/**
 * POST /api/keeper — the keeper's key.
 *
 * A small door for whoever is minding the order's machines. It is opened
 * with a passcode typed into the page, and behind it are the only two
 * questions worth asking when a generation is stuck: *who asked for this*,
 * and *may I let the GPU go?*
 *
 * The passcode lives in config as KEEPER_PASSCODE and falls back to the one
 * the order was given. It is checked here, on the server, and never sent to
 * the browser — the page only ever learns whether it was right.
 *
 * Actions
 *   { action: 'open',   pass }            who asked for what, and the state
 *                                         of every GPU the order can reach
 *   { action: 'release', pass, id? }      free the Kaggle lock: one job by
 *                                         id, or whatever is holding it
 *   { action: 'gpus',    pass }           every machine the order can reach,
 *                                         one row each, with its state
 *   { action: 'reset',   pass, gpu }      reset one machine by its id: a
 *                                         Kaggle account's lock and stuck
 *                                         jobs, or a Colab worker dropped
 *                                         from the pool so it re-registers
 */
import { db, config } from 'hatchable';
import { gpuBusy, releaseGpu, kaggleAccountList, whoAmI } from '../lib/kaggle.js';
import { liveWorkers, sortByFree, retireWorker, colabSecret } from '../lib/colab.js';
import { poolReport } from '../lib/pool.js';

export const access = 'public';
export const methods = ['POST'];

const FALLBACK = '1133';

/* --------------------------------------------------------- the three tries
 *
 * A four-figure passcode is ten thousand guesses, which a script gets
 * through in a minute. Three wrong keys from one browser and the door stays
 * shut for twenty minutes, counted on the server where the guesser cannot
 * reach it. The browser is recognised by its address together with the
 * signature it sends, hashed, so that nothing identifying is written down
 * and one person's guessing cannot shut another person out.
 */
const TRIES = 3;
const LOCKOUT_MIN = 20;

async function whoIsKnocking(req) {
  const h = req.headers || {};
  const ip = String(h['x-forwarded-for'] || h['x-real-ip'] || (req.socket && req.socket.remoteAddress) || '?')
    .split(',')[0].trim();
  const agent = String(h['user-agent'] || '');
  const raw = ip + '|' + agent;
  let sum = 5381;
  for (let i = 0; i < raw.length; i++) sum = ((sum * 33) ^ raw.charCodeAt(i)) >>> 0;
  return 'k' + sum.toString(36) + '-' + raw.length;
}

async function doorState(who) {
  try {
    const { rows } = await db.query(
      'SELECT fails, locked_at FROM keeper_tries WHERE who = $1', [who]);
    const row = rows && rows[0];
    if (!row) return { fails: 0, wait: 0 };
    const held = row.locked_at
      ? LOCKOUT_MIN - (Date.now() - new Date(row.locked_at).getTime()) / 60000
      : 0;
    if (held > 0) return { fails: row.fails, wait: Math.ceil(held) };
    /* The lockout has run out: the slate is clean again. */
    if (row.locked_at) {
      await db.query('UPDATE keeper_tries SET fails = 0, locked_at = NULL WHERE who = $1', [who]).catch(() => {});
      return { fails: 0, wait: 0 };
    }
    return { fails: row.fails, wait: 0 };
  } catch {
    return { fails: 0, wait: 0 };
  }
}

async function wrongKey(who) {
  try {
    const { rows } = await db.query(
      `INSERT INTO keeper_tries (who, fails, last_at) VALUES ($1, 1, NOW())
       ON CONFLICT (who) DO UPDATE SET fails = keeper_tries.fails + 1, last_at = NOW()
       RETURNING fails`, [who]);
    const fails = (rows && rows[0] && rows[0].fails) || 1;
    if (fails >= TRIES) {
      await db.query('UPDATE keeper_tries SET locked_at = NOW() WHERE who = $1', [who]).catch(() => {});
      return { left: 0, wait: LOCKOUT_MIN };
    }
    return { left: TRIES - fails, wait: 0 };
  } catch {
    return { left: TRIES - 1, wait: 0 };
  }
}

async function rightKey(who) {
  await db.query('DELETE FROM keeper_tries WHERE who = $1', [who]).catch(() => {});
}

async function passcode() {
  try {
    const set = await config.get('KEEPER_PASSCODE');
    if (set && String(set).trim()) return String(set).trim();
  } catch { /* not configured */ }
  return FALLBACK;
}

const when = (t) => (t ? new Date(t).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : null);
const ago = (t) => (t ? Math.round((Date.now() - new Date(t).getTime()) / 1000) : null);

/** Everything generated lately, and who asked for it. */
async function recent(limit) {
  const out = [];
  try {
    const { rows } = await db.query(
      `SELECT id, kind, prompt, provider, model, status, asker_name, created_at, updated_at, error
         FROM videos ORDER BY created_at DESC LIMIT $1`, [limit]
    );
    for (const r of rows || []) {
      out.push({
        id: r.id,
        kind: r.kind || 'video',
        who: r.asker_name || 'not given',
        asked: String(r.prompt || '').slice(0, 160),
        provider: r.provider || null,
        model: r.model || null,
        status: r.status,
        error: r.error || null,
        at: when(r.created_at),
        age_s: ago(r.created_at)
      });
    }
  } catch (err) {
    console.error('keeper: could not read the job log', err && err.message);
  }
  return out;
}

/** The pictures drawn on the quick routes, which never become jobs. */
async function drawings(limit) {
  try {
    const { rows } = await db.query(
      `SELECT id, asker_name, question, created_at FROM questions
        WHERE limb = 'image' ORDER BY created_at DESC LIMIT $1`, [limit]
    );
    return (rows || []).map((r) => ({
      id: r.id,
      who: r.asker_name || 'not given',
      asked: String(r.question || '').slice(0, 160),
      at: when(r.created_at),
      age_s: ago(r.created_at)
    }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------- the machines
 *
 * Every GPU the order can reach, as one flat list the keeper can read down.
 * A Kaggle account is a machine even when it is asleep, because its weekly
 * quota and its lock are the things that go wrong; a Colab worker only
 * exists while a notebook is running, so a worker that has stopped
 * answering is shown as silent rather than quietly dropped.
 */
async function machines() {
  const out = [];

  const held = await gpuBusy();
  let health = {};
  try { health = await poolReport(); } catch { health = {}; }
  const kHealth = new Map((health.kaggle || []).map((a) => [String(a.account), a]));

  let accounts = [];
  try { accounts = await kaggleAccountList(); } catch { accounts = []; }

  for (const a of accounts) {
    const label = a.label || a.id;
    const h = kHealth.get(String(label)) || kHealth.get(String(a.id)) || {};
    const mine = held && (!held.slug || !a.user || String(held.slug).startsWith(a.user + '/'));
    /* Confirm the account is alive, cheaply, and name the user it belongs
       to — a token that has been revoked looks exactly like a quiet one
       until something asks. */
    let user = a.user || null;
    let reachable = null;
    try {
      const me = await whoAmI(a);
      user = (me && (me.user || me.userName)) || user;
      reachable = Boolean(me && !me.error);
    } catch { reachable = false; }

    out.push({
      id: 'kaggle:' + (a.id || label),
      kind: 'Kaggle',
      label,
      user,
      gpu: 'Nvidia Tesla T4 (when the account is verified)',
      state: !reachable ? 'token refused'
        : mine && held ? 'busy \u2014 ' + (held.kind || 'a job') + ' since ' + when(held.started_at)
          : (h.state || 'ready'),
      busy: Boolean(mine && held),
      stale: Boolean(mine && held && ago(held.started_at) > 2700),
      fails: Number(h.fails) || 0,
      successes: Number(h.successes) || 0,
      last_error: h.last_error || null,
      can_reset: true,
      note: 'Resetting frees this account\u2019s lock and cancels anything still marked live.'
    });
  }

  let live = [];
  try { live = await liveWorkers(); } catch { live = []; }
  let free = [], rest = live;
  try { ({ free, rest } = await sortByFree(live, { timeout: 3500 })); } catch { /* keep the raw list */ }
  const freeSet = new Set(free.map((w) => w.endpoint));

  for (const w of live) {
    out.push({
      id: 'colab:' + w.endpoint,
      kind: 'Colab',
      label: w.label || w.account || 'a notebook',
      user: w.account || null,
      gpu: w.gpu || 'GPU',
      state: freeSet.has(w.endpoint) ? 'free' : 'busy or silent',
      busy: !freeSet.has(w.endpoint),
      caps: w.caps || 'video',
      jobs: w.jobs,
      can_reset: true,
      note: 'Resetting drops this worker from the pool. The notebook puts itself back within a minute if it is still running.'
    });
  }

  if (!out.length) {
    out.push({
      id: 'none', kind: '\u2014', label: 'No machine is configured or awake',
      gpu: '\u2014', state: 'nothing to show', busy: false, can_reset: false,
      note: 'Paste a Kaggle token on the setup page, or run colab/egregora-gpu.ipynb in a Google account.'
    });
  }
  return out;
}

/** Reset one machine, named by the id the census gave it. */
async function resetMachine(id) {
  const target = String(id || '');

  if (target.startsWith('colab:')) {
    const endpoint = target.slice(6);
    try {
      await retireWorker(endpoint);
      return { ok: true, message: 'That worker is out of the pool. If its notebook is still running it ' +
        'will register itself again within the minute.' };
    } catch (err) {
      return { ok: false, message: 'It could not be dropped: ' + ((err && err.message) || 'unknown') };
    }
  }

  if (target.startsWith('kaggle:')) {
    try {
      const held = await gpuBusy();
      if (held) await releaseGpu(held.slug, 'cancelled');
      const { rows } = await db.query(
        "UPDATE gpu_jobs SET status = 'cancelled', finished_at = NOW() " +
        "WHERE status IN ('queued','running') RETURNING id");
      /* A token on a cooldown after a run of failures is given its name
         back, so a machine that has been fixed is tried again at once
         rather than after the pool's own timer. */
      await db.query("UPDATE provider_health SET fails = 0, cooldown_until = NULL WHERE provider = 'kaggle'")
        .catch(() => {});
      return {
        ok: true,
        message: 'Kaggle reset: the lock is free, ' + ((rows && rows.length) || 0) +
          ' live job(s) cancelled, and the cooldown on the account cleared.'
      };
    } catch (err) {
      return { ok: false, message: 'It could not be reset: ' + ((err && err.message) || 'unknown') };
    }
  }

  if (target === 'all') {
    const a = await resetMachine('kaggle:all');
    let dropped = 0;
    try {
      const live = await liveWorkers();
      for (const w of live) { await retireWorker(w.endpoint); dropped++; }
    } catch { /* the pool may be empty */ }
    return { ok: a.ok, message: a.message + ' ' + dropped + ' Colab worker(s) dropped.' };
  }

  return { ok: false, message: 'There is no machine with that name.' };
}


export default async function (req, res) {
  const body = req.body || {};
  const given = String(body.pass || '').trim();
  const want = await passcode();

  const who = await whoIsKnocking(req);
  const door = await doorState(who);
  if (door.wait > 0) {
    return res.status(429).json({
      error: 'Three wrong keys. This browser cannot try again for ' + door.wait +
        ' more ' + (door.wait === 1 ? 'minute' : 'minutes') + '.',
      wait_minutes: door.wait
    });
  }

  if (!given) return res.status(400).json({ error: 'The key is needed.' });
  if (given !== want) {
    /* Slow a guesser down a little without locking the keeper out. */
    await new Promise((go) => setTimeout(go, 900));
    const bad = await wrongKey(who);
    return res.status(403).json({
      error: bad.wait
        ? 'That is not the key, and that was the third try. This browser is shut out for ' +
          bad.wait + ' minutes.'
        : 'That is not the key. ' + bad.left + (bad.left === 1 ? ' try' : ' tries') +
          ' left before this browser is shut out for ' + LOCKOUT_MIN + ' minutes.',
      tries_left: bad.left,
      wait_minutes: bad.wait || 0
    });
  }
  await rightKey(who);

  const action = String(body.action || 'open');

  if (action === 'gpus') {
    return res.json({ ok: true, gpus: await machines(), secret_set: Boolean(await colabSecret()) });
  }

  if (action === 'reset') {
    const out = await resetMachine(body.gpu);
    const gpus = await machines();
    return res.status(out.ok ? 200 : 500).json({ ok: out.ok, message: out.message, gpus });
  }

  if (action === 'release') {
    const held = await gpuBusy();
    const id = body.id ? Number(body.id) : null;
    if (!held && !id) {
      return res.json({ ok: true, freed: false, message: 'The GPU was not being held \u2014 nothing to free.' });
    }
    try {
      if (id) {
        await db.query("UPDATE gpu_jobs SET status = 'cancelled', finished_at = NOW() WHERE id = $1", [id]);
      } else {
        await releaseGpu(held.slug, 'cancelled');
        /* Belt and braces: anything else still marked live is cleared too,
           because a half-finished row is exactly what wedges the lock. */
        await db.query(
          "UPDATE gpu_jobs SET status = 'cancelled', finished_at = NOW() WHERE status IN ('queued','running')"
        );
      }
      return res.json({
        ok: true,
        freed: true,
        message: 'The Kaggle GPU is free. Anything that was actually running on Kaggle will finish on its ' +
          'own and be ignored; the next request can claim the machine straight away.'
      });
    } catch (err) {
      return res.status(500).json({ error: 'Could not free it: ' + ((err && err.message) || 'unknown') });
    }
  }

  /* action: open */
  const held = await gpuBusy();
  let workers = [];
  try {
    const live = await liveWorkers();
    const { free, rest } = await sortByFree(live, { timeout: 3500 });
    const tag = (w, state) => ({
      label: w.label, gpu: w.gpu, account: w.account || null,
      caps: w.caps || 'video', jobs: w.jobs, state
    });
    workers = free.map((w) => tag(w, 'free')).concat(rest.map((w) => tag(w, 'busy or silent')));
    if (live.length === 1) workers = live.map((w) => tag(w, 'awake'));
  } catch (err) {
    console.error('keeper: could not read the worker pool', err && err.message);
  }

  res.json({
    ok: true,
    gpus: await machines(),
    kaggle: held
      ? {
          held: true, kind: held.kind, slug: held.slug,
          since: when(held.started_at), age_s: ago(held.started_at),
          stale: ago(held.started_at) > 2700
        }
      : { held: false },
    workers,
    jobs: await recent(12),
    drawings: await drawings(12)
  });
}
