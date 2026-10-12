/**
 * POST /api/owner — the owner's room.
 *
 * Two things live behind this door.
 *
 * The remembered key. The publishing passcode used to be good for one tab
 * only, and the little door on every page asked for it again on every page.
 * Now a door proved once with the right key can mint a token good for a
 * week; the browser keeps it in a cookie and every door on the site stands
 * open without asking again. "Close the door" burns the token. A signed-in
 * member holding the admin or owner privilege needs no key at all — the
 * account is the key.
 *
 * Owner mode. A step further behind the admin door: the traffic of the
 * house, day by day, and the people — every account that has signed up,
 * with its privilege, its last sign-in, its whole trail, and the work an
 * owner may do to it: send a fresh key, change the details, set the
 * privilege, suspend it, or take it off the roll altogether.
 *
 * The same rule as every door here: the keys never travel in the answers.
 */
import { db, storage } from 'hatchable';
import {
  adminDoor, passcode, ownerPasscode, issueToken, checkToken, closeToken
} from '../lib/door.js';
import { whoAmI, issueCode, sendCode } from '../lib/accounts.js';

export const access = 'public';
export const methods = ['POST'];

const clean = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

const PRIVS = ['member', 'admin', 'owner'];
const STATUSES = ['active', 'suspended'];

async function log(member_id, actor, action, detail) {
  try {
    await db.query(
      `INSERT INTO activity_log (member_id, actor, action, detail)
       VALUES ($1, $2, $3, $4)`,
      [member_id || null, clean(actor, 80) || 'system', clean(action, 60) || 'note', clean(detail, 500)]
    );
  } catch (e) {
    console.error('activity log failed', e && e.message);
  }
}

/** Owner mode admits a held owner token or the account that owns the house. */
async function requireOwner(req) {
  const body = req.body || {};
  const held = await checkToken(body.token, 'owner');
  if (held) return { ok: true, via: 'token' };
  const me = await whoAmI(req);
  if (me && me.privilege === 'owner') return { ok: true, via: 'member', member: me };
  return { ok: false };
}

function parseAgent(ua) {
  ua = String(ua || '');
  let b = 'other';
  if (/edg\//i.test(ua)) b = 'Edge';
  else if (/chrome/i.test(ua)) b = 'Chrome';
  else if (/firefox/i.test(ua)) b = 'Firefox';
  else if (/safari/i.test(ua)) b = 'Safari';
  let o = 'another system';
  if (/iphone|ipad|ipod/i.test(ua)) o = 'iOS';
  else if (/android/i.test(ua)) o = 'Android';
  else if (/mac os/i.test(ua)) o = 'macOS';
  else if (/windows/i.test(ua)) o = 'Windows';
  else if (/linux/i.test(ua)) o = 'Linux';
  return b + ' on ' + o;
}

const dayAgo = (n) => `NOW() - INTERVAL '${Number(n) || 0} days'`;

export default async function (req, res) {
  const body = req.body || {};
  const action = clean(body.action, 24);

  try {
    /* ---------------------------------------------------- the remembered key */

    if (action === 'unlock') {
      const me = await whoAmI(req);
      const pass = clean(body.pass, 120);
      let kind = null;
      if (pass) {
        if (pass === await ownerPasscode()) kind = 'owner';
        else if (pass === await passcode()) kind = 'admin';
        if (!kind) {
          const d = await adminDoor(req, pass);
          if (!d.ok) return res.status(d.status || 401).json({ error: d.error });
          kind = 'admin';
        }
      } else if (me) {
        kind = me.privilege === 'owner' ? 'owner' : (me.privilege === 'admin' ? 'admin' : null);
      }
      if (!kind) return res.status(401).json({
        error: 'The door needs the key, or a signed-in account that holds the privilege. The sign-in is at /join/.'
      });
      const token = await issueToken(kind, me && me.id);
      await log(me && me.id, me ? me.email : 'knocker', kind + '-door-opened',
        'The ' + kind + ' door was opened and a week-long remembered key was issued.');
      return res.json({ ok: true, kind, token });
    }

    if (action === 'check') {
      const held = await checkToken(body.token, null);
      if (!held) return res.status(401).json({ error: 'The key is not recognised, or its week is out.' });
      return res.json({ ok: true, kind: held.kind, until: held.until });
    }

    if (action === 'close') {
      await closeToken(body.token);
      const me = await whoAmI(req);
      await log(me && me.id, me ? me.email : 'knocker', 'door-closed',
        'A remembered key was burned.');
      return res.json({ ok: true });
    }

    /* ------------------------------------------------------------- owner mode */
    const gate = await requireOwner(req);
    if (!gate.ok) return res.status(401).json({
      error: 'Owner mode needs the owner key, or the account that holds the owner privilege.'
    });
    const me = gate.member;

    if (action === 'users') {
      const { rows } = await db.query(
        `SELECT m.id, m.email, m.name, m.country, m.legal_name, m.subscribed,
                m.privilege, m.status, m.verified, m.age_verified, m.id_status,
                m.created_at, m.last_seen,
                COALESCE((SELECT s.at FROM signins s WHERE s.email = m.email ORDER BY s.at DESC LIMIT 1), m.last_seen) AS last_login
           FROM members m
          ORDER BY m.created_at ASC, m.id ASC`
      );
      const users = (rows || []).map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name || '',
        country: r.country || '',
        legal_name: r.legal_name || '',
        subscribed: r.subscribed !== false,
        privilege: r.privilege || 'member',
        status: r.status || 'active',
        verified: Boolean(r.verified),
        age_verified: Boolean(r.age_verified),
        id_status: r.id_status || 'none',
        joined: r.created_at,
        last_seen: r.last_seen,
        last_login: r.last_login
      }));
      return res.json({ ok: true, users });
    }

    if (action === 'user-update') {
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Which member?' });
      const { rows } = await db.query('SELECT id, email, name FROM members WHERE id = $1', [id]);
      const target = rows && rows[0];
      if (!target) return res.status(404).json({ error: 'No such member.' });

      const sets = [];
      const params = [];
      const add = (col, val) => { params.push(val); sets.push(col + ' = $' + params.length); };

      if (body.name !== undefined) add('name', clean(body.name, 120) || null);
      if (body.country !== undefined) add('country', clean(body.country, 80) || null);
      if (body.legal_name !== undefined) add('legal_name', clean(body.legal_name, 120) || null);
      if (body.subscribed !== undefined) add('subscribed', Boolean(body.subscribed));
      if (body.privilege !== undefined) {
        if (PRIVS.indexOf(body.privilege) < 0) return res.status(400).json({ error: 'That privilege does not exist.' });
        if (me && target.id === me.id && body.privilege !== 'owner') {
          return res.status(400).json({ error: 'You cannot lower your own privilege.' });
        }
        add('privilege', body.privilege);
      }
      if (body.status !== undefined) {
        if (STATUSES.indexOf(body.status) < 0) return res.status(400).json({ error: 'That status does not exist.' });
        if (me && target.id === me.id && body.status === 'suspended') {
          return res.status(400).json({ error: 'You cannot suspend yourself.' });
        }
        add('status', body.status);
      }
      if (!sets.length) return res.status(400).json({ error: 'Nothing to change.' });
      params.push(id);
      await db.query('UPDATE members SET ' + sets.join(', ') + ' WHERE id = $' + params.length, params);
      await log(target.id, me ? me.email : 'owner', 'member-updated',
        target.email + ' — ' + sets.map((s) => s.split(' ')[0]).join(', '));
      return res.json({ ok: true });
    }

    if (action === 'user-reset') {
      const id = Number(body.id);
      const { rows } = await db.query('SELECT * FROM members WHERE id = $1', [id]);
      const target = rows && rows[0];
      if (!target) return res.status(404).json({ error: 'No such member.' });
      const code = await issueCode(target, 'signin');
      await sendCode(target, code, 'signin');
      await log(target.id, me ? me.email : 'owner', 'reset-sent',
        'A fresh sign-in code was posted to ' + target.email + '.');
      return res.json({
        ok: true,
        note: 'A fresh sign-in code is on its way to ' + target.email + '. It lasts fifteen minutes and works once.'
      });
    }

    if (action === 'user-delete') {
      const id = Number(body.id);
      const { rows } = await db.query('SELECT id, email, name FROM members WHERE id = $1', [id]);
      const target = rows && rows[0];
      if (!target) return res.status(404).json({ error: 'No such member.' });
      if (me && target.id === me.id) {
        return res.status(400).json({ error: 'You cannot take yourself off the roll.' });
      }
      await db.query('DELETE FROM member_sessions WHERE member_id = $1', [id]);
      await db.query('DELETE FROM member_codes WHERE member_id = $1', [id]);
      await db.query('DELETE FROM member_passkeys WHERE member_id = $1', [id]);
      await db.query('DELETE FROM members WHERE id = $1', [id]);
      await log(id, me ? me.email : 'owner', 'member-deleted',
        (target.name || '') + ' <' + target.email + '> was taken off the roll. Their words stay in the house.');
      return res.json({ ok: true });
    }

    if (action === 'user-timeline') {
      const id = Number(body.id);
      const { rows: mrows } = await db.query('SELECT id, email, name FROM members WHERE id = $1', [id]);
      const target = mrows && mrows[0];
      if (!target) return res.status(404).json({ error: 'No such member.' });

      const events = [];
      const push = (at, label, detail) => {
        if (!at) return;
        events.push({ at, label: String(label).slice(0, 120), detail: String(detail || '').slice(0, 300) });
      };
      const q = async (sql, p, map) => {
        let rows = [];
        try { rows = (await db.query(sql, p)).rows || []; } catch (e) { return; }
        for (const r of rows) {
          try { push(...map(r)); } catch (e) { /* one bad row does not sink the trail */ }
        }
      };

      await q('SELECT at, how FROM signins WHERE email = $1 ORDER BY at DESC LIMIT 100',
        [target.email], (r) => [r.at, 'Signed in', r.how || '']);
      await q('SELECT at, action, detail, actor FROM activity_log WHERE member_id = $1 ORDER BY at DESC LIMIT 100',
        [id], (r) => [r.at, r.action, r.detail + (r.actor && r.actor !== 'system' ? ' (by ' + r.actor + ')' : '')]);
      await q('SELECT created_at AS at, title, state FROM media WHERE who = $1 ORDER BY created_at DESC LIMIT 50',
        [target.email], (r) => [r.at, 'Episode: ' + r.title, r.state || '']);
      await q('SELECT created_at AS at, title FROM forum_threads WHERE author_id = $1 ORDER BY created_at DESC LIMIT 50',
        [id], (r) => [r.at, 'Forum thread: ' + r.title, '']);
      await q('SELECT created_at AS at, thread_id FROM forum_posts WHERE author_id = $1 ORDER BY created_at DESC LIMIT 100',
        [id], (r) => [r.at, 'Forum post', 'thread ' + String(r.thread_id || '').slice(0, 8)]);
      if (target.name) {
        await q('SELECT created_at AS at, question FROM questions WHERE asker_name = $1 ORDER BY created_at DESC LIMIT 50',
          [target.name], (r) => [r.at, 'Asked the oracle', r.question]);
        await q('SELECT created_at AS at, name FROM uploads WHERE asker_name = $1 ORDER BY created_at DESC LIMIT 50',
          [target.name], (r) => [r.at, 'Uploaded a file', r.name]);
      }
      await q('SELECT created_at AS at, topic FROM letters WHERE email = $1 ORDER BY created_at DESC LIMIT 50',
        [target.email], (r) => [r.at, 'Wrote a letter', r.topic || '']);

      events.sort((a, b) => new Date(b.at) - new Date(a.at));
      return res.json({ ok: true, events: events.slice(0, 200) });
    }

    if (action === 'analytics') {
      const count = async (sql) => {
        try {
          const { rows } = await db.query(sql);
          const r = rows && rows[0];
          return Number((r && (r.n !== undefined ? r.n : r.count)) || 0);
        } catch (e) { return 0; }
      };
      const top = async (sql) => {
        try { return (await db.query(sql)).rows || []; } catch (e) { return []; }
      };

      const visits = {
        total: await count('SELECT count(*) AS n FROM visits'),
        today: await count('SELECT count(*) AS n FROM visits WHERE at::date = CURRENT_DATE'),
        d7: await count('SELECT count(*) AS n FROM visits WHERE at > ' + dayAgo(7)),
        d30: await count('SELECT count(*) AS n FROM visits WHERE at > ' + dayAgo(30)),
        signed_in_30: await count('SELECT count(DISTINCT member_email) AS n FROM visits WHERE at > ' + dayAgo(30) + ' AND member_email IS NOT NULL')
      };
      const signins = {
        total: await count('SELECT count(*) AS n FROM signins'),
        d7: await count('SELECT count(*) AS n FROM signins WHERE at > ' + dayAgo(7)),
        d30: await count('SELECT count(*) AS n FROM signins WHERE at > ' + dayAgo(30))
      };

      let series = [];
      try {
        const { rows } = await db.query(
          `SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
                  (SELECT count(*) FROM visits v WHERE v.at::date = d.day::date) AS visits,
                  (SELECT count(*) FROM signins s WHERE s.at::date = d.day::date) AS signins
             FROM (SELECT generate_series((CURRENT_DATE - 27)::timestamptz, (CURRENT_DATE)::timestamptz, interval '1 day') AS day) d
            ORDER BY d.day`
        );
        series = rows || [];
      } catch (e) {
        console.error('analytics series failed', e && e.message);
      }

      const pages = await top('SELECT path, count(*) AS n FROM visits WHERE at > ' + dayAgo(30) +
        ' GROUP BY path ORDER BY n DESC LIMIT 25');
      const refs = await top('SELECT coalesce(nullif(referrer, \'\'), \'(none)\') AS ref, count(*) AS n FROM visits WHERE at > ' +
        dayAgo(30) + ' GROUP BY 1 ORDER BY n DESC LIMIT 15');
      const agentsRaw = await top('SELECT agent, count(*) AS n FROM visits WHERE at > ' + dayAgo(30) +
        " AND agent IS NOT NULL AND agent <> '' GROUP BY agent ORDER BY n DESC LIMIT 60");
      const buckets = {};
      for (const r of agentsRaw) {
        const key = parseAgent(r.agent);
        buckets[key] = (buckets[key] || 0) + Number(r.n);
      }
      const agents = Object.keys(buckets)
        .map((k) => ({ label: k, n: buckets[k] }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 10);

      const content = {
        episodes: await count("SELECT count(*) AS n FROM media WHERE kind = 'audio' AND state = 'published'"),
        films: await count("SELECT count(*) AS n FROM media WHERE kind = 'video' AND state = 'published'"),
        questions_30: await count('SELECT count(*) AS n FROM questions WHERE created_at > ' + dayAgo(30)),
        forum_30: await count('SELECT count(*) AS n FROM forum_posts WHERE created_at > ' + dayAgo(30)),
        letters_30: await count('SELECT count(*) AS n FROM letters WHERE created_at > ' + dayAgo(30)),
        live_30: await count('SELECT count(*) AS n FROM live_feeds WHERE started_at > ' + dayAgo(30)),
        members: await count('SELECT count(*) AS n FROM members'),
        members_verified: await count('SELECT count(*) AS n FROM members WHERE verified'),
        suspended: await count("SELECT count(*) AS n FROM members WHERE status = 'suspended'")
      };

      return res.json({ ok: true, visits, signins, series, pages, refs, agents, content });
    }

    /* ------------------------------------------------ the biographies
       The members' own words and pictures, waiting for the owner's nod
       before they show on the people page. */
    if (action === 'bios') {
      const { rows: pend } = await db.query(
        `SELECT mb.member_id, m.email, mb.display_name, mb.bio, mb.image_key, mb.submitted_at
           FROM member_bios mb
           JOIN members m ON m.id = mb.member_id
          WHERE mb.status = 'pending'
          ORDER BY mb.submitted_at ASC`);
      const bios = [];
      for (const r of pend) {
        let avatar = null;
        if (r.image_key) { try { avatar = await storage.url(r.image_key, { ttl: 86400 }); } catch {} }
        bios.push({
          member_id: Number(r.member_id), email: r.email,
          name: r.display_name || r.email, bio: r.bio, avatar,
          submitted_at: r.submitted_at
        });
      }
      const { rows: appr } = await db.query(
        `SELECT count(*)::int AS n FROM member_bios WHERE status = 'approved'`);
      return res.json({ ok: true, pending: bios, approved: appr[0] ? appr[0].n : 0 });
    }

    if (action === 'bio-approve' || action === 'bio-reject') {
      const id = Number(body.member_id);
      if (!id) return res.status(400).json({ error: 'Which biography?' });
      const status = action === 'bio-approve' ? 'approved' : 'rejected';
      const { rows: [r] } = await db.query(
        `UPDATE member_bios SET status = $2, reviewed_at = NOW()
          WHERE member_id = $1 AND status = 'pending'
          RETURNING member_id`, [id, status]);
      if (!r) return res.status(404).json({ error: 'No pending biography for that member.' });
      return res.json({ ok: true, member_id: id, status });
    }

    /* ------------------------------------------------------------- the vault
       Every save the podcast and films editors have made, newest first. The
       rows are the record rather than a pointer at the shelf, so an episode
       that has since been unpublished, archived or deleted is still here —
       and, while the file itself survives, still fetchable. */
    if (action === 'vault') {
      const kind = clean(body.kind, 8);
      const want = kind === 'audio' || kind === 'video' ? kind : null;
      const limit = Math.min(200, Math.max(1, Number(body.limit) || 60));
      const before = body.before ? new Date(body.before) : null;
      const where = [];
      const args = [];
      if (want) { args.push(want); where.push('kind = $' + args.length); }
      if (before && !isNaN(before)) { args.push(before.toISOString()); where.push('saved_at < $' + args.length); }
      args.push(limit + 1);
      const { rows } = await db.query(
        `SELECT a.id, a.media_id, a.kind, a.title, a.storage_key, a.mime, a.bytes, a.seconds,
                a.state, a.did, a.note, a.saved_by, a.saved_at,
                m.state AS shelf_state, m.title AS shelf_title
           FROM owner_archive a
           LEFT JOIN media m ON m.id = a.media_id
          ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
          ORDER BY a.saved_at DESC, a.id DESC
          LIMIT $` + args.length, args);

      const more = rows.length > limit;
      const items = rows.slice(0, limit).map((r) => ({
        id: Number(r.id),
        media_id: r.media_id == null ? null : Number(r.media_id),
        kind: r.kind,
        title: r.title,
        mime: r.mime,
        bytes: r.bytes == null ? null : Number(r.bytes),
        seconds: r.seconds == null ? null : Number(r.seconds),
        state: r.state,
        did: r.did,
        note: r.note,
        saved_by: r.saved_by,
        saved_at: r.saved_at,
        /* What the shelf says now, which is the honest test of whether the
           vault is the only copy left. */
        on_shelf: r.shelf_state === 'published',
        shelf_state: r.shelf_state || null,
        shelf_title: r.shelf_title || null,
        /* A row with no key is a note about a file that no longer exists. */
        fetchable: !!r.storage_key
      }));

      const { rows: tally } = await db.query(
        `SELECT count(*)::int AS n, COALESCE(sum(bytes), 0)::bigint AS b FROM owner_archive`);
      return res.json({
        ok: true, items, more,
        total: tally[0] ? Number(tally[0].n) : 0,
        bytes: tally[0] ? Number(tally[0].b) : 0
      });
    }

    /* Hand back a short-lived link to the stored file. This is the only path
       from the vault to the bytes, and it sits behind requireOwner like the
       rest of the room. */
    if (action === 'vault-file') {
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Which save?' });
      const { rows: [r] } = await db.query(
        'SELECT storage_key, title, mime, kind FROM owner_archive WHERE id = $1', [id]);
      if (!r) return res.status(404).json({ error: 'There is no such save in the vault.' });
      if (!r.storage_key) {
        return res.status(410).json({
          error: 'The file went with the shelf entry. The vault kept the note, not the sound.'
        });
      }
      let url = null;
      try { url = await storage.url(r.storage_key, { ttl: 3600 }); } catch (e) {
        return res.status(502).json({ error: 'The store would not sign a link to it.' });
      }
      if (!url) return res.status(502).json({ error: 'The store would not sign a link to it.' });
      await log(null, 'owner', 'vault-file',
        'Fetched #' + id + ' — ' + clean(r.title, 120));
      return res.json({ ok: true, url, title: r.title, mime: r.mime, kind: r.kind });
    }

    return res.status(404).json({ error: 'That is not in the owner room.' });
  } catch (e) {
    console.error('owner room failed', e && e.message);
    return res.status(500).json({ error: 'The owner room did not answer. Try again in a moment.' });
  }
}