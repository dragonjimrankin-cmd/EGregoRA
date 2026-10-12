/**
 * The twin — EGregoRA and The Two Infinities as one membership.
 *
 * The two sites are separate Hatchable projects with separate databases, so a
 * member created on one does not exist on the other. This module keeps them in
 * step: whenever an address is verified, an age check passes, or someone joins
 * or leaves the mailing list, the change is mirrored to the twin, and a sign-in
 * on either side can ask the twin whether the address is already known.
 *
 * What crosses: the address, the name, whether it is verified, the mailing-list
 * flag, and the outcome of the age check. What never crosses: sessions, codes,
 * passkeys, and the identity document itself. One membership, two front doors;
 * each door still asks you to prove it is you.
 */
import crypto from 'node:crypto';
import { db } from 'hatchable';

/* This project, and the one on the other side of the mirror. */
export const HOME = {
  key: 'egregora',
  label: 'EGregoRA',
  url: 'https://egregora.hatchable.site'
};
export const TWIN = {
  key: 'two-infinities',
  label: 'The Eternal Integration: Two Infinities (and beyond)',
  url: 'https://the-two-infinities.hatchable.site'
};

/* A shared secret, so neither site will take an instruction from the street.
   It is not a user credential and grants nothing but member mirroring. */
const SECRET = process.env.TWIN_SECRET || 'twin_8f31c0a9d4e67b25a1c8f0d93e7b46512ac9d8e0f3b7a164';

/* How this project signs its letters. The twin carries the other set, so a
   code sent from either site looks like the site the member is standing in
   while saying plainly that the account covers both. */
export const BRAND = {
  name: 'EGregoRA',
  wordmark: 'E G R E G O R A',
  paper: '#0d0a05',
  ink: '#e8dcc0',
  accent: '#d7b05a',
  bright: '#f3ddaa',
  dim: '#cbbb93',
  faint: '#8e8468',
  foot: '#6f6855',
  /* The four doors worth opening first, used by the welcome letter. */
  highlights: [
    ['/ask-ed/', 'The oracle', 'written answers, graded by how well they are evidenced, and a fox who reads them aloud.'],
    ['/infographics/', 'The plates', 'one idea to a page, drawn as live vector art.'],
    ['/cosmic-aether/', 'The cosmic aether', 'why only one clause of the old idea was struck out, and the rest stands.'],
    ['/occult/', 'The Occult', 'including the part most orders will not print about stolen runes and industrial atrocity.']
  ],
  youAreIn: 'Your address is confirmed and you are a member of EGregoRA.'
};

/** One sentence, used in every letter either site sends. */
export const PAIR_LINE =
  'One account covers EGregoRA and The Eternal Integration: Two Infinities (and beyond) — ' +
  'sign in at either with the same address.';

const TIMEOUT_MS = 6000;

export function sign(bodyText) {
  return crypto.createHmac('sha256', SECRET).update(bodyText).digest('hex');
}

export function verifySignature(req) {
  const given = String(req.headers['x-twin-sign'] || '');
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  const want = sign(raw);
  if (given.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(want));
}

/** POST to the twin. Never throws: the twin being down must not break a join. */
async function post(payload) {
  const raw = JSON.stringify(payload);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${TWIN.url}/api/twin-member`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-twin-sign': sign(raw) },
      body: raw,
      signal: ctrl.signal
    });
    if (!r.ok) return { ok: false, status: r.status };
    return await r.json();
  } catch (err) {
    console.error('twin unreachable', err && err.message);
    return { ok: false, error: 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Mirror a member to the twin. Pass only what changed; absent fields are left
 * alone on the other side. Fire and forget from the caller's point of view.
 */
export async function mirror(email, patch = {}) {
  if (!email) return { ok: false };
  const out = await post({ action: 'upsert', email, ...patch, from: HOME.key });
  if (out && out.ok) {
    await db.query('UPDATE members SET twin_synced_at = NOW() WHERE email = $1', [email])
      .catch(() => {});
  }
  return out;
}

/** Ask the twin what it knows about an address, for the greeting and the age gate. */
export async function askTwin(email) {
  if (!email) return { known: false };
  const out = await post({ action: 'lookup', email, from: HOME.key });
  return out && out.ok ? out : { known: false };
}

/** Ask the twin to vouch for one of its own session tokens. The forum uses
    this so a member signed in over there can post over here; what crosses is
    only what the member has chosen to show. */
export async function askTwinWhois(token) {
  if (!token) return { known: false };
  const out = await post({ action: 'whois', token, from: HOME.key });
  return out && out.ok && out.member ? out : { known: false };
}

/**
 * Pull anything the twin knows that we do not: the name, the verified flag and
 * the age check. Used when an address signs in here for the first time having
 * already joined over there, so the studio does not ask for a document twice.
 */
export async function adoptFromTwin(email) {
  const them = await askTwin(email);
  if (!them.known) return { adopted: false };
  await db.query(
    `UPDATE members SET
       name         = COALESCE(name, $2),
       verified     = verified OR $3,
       age_verified = age_verified OR $4,
       id_status    = CASE WHEN id_status = 'verified' THEN id_status
                           WHEN $5 = 'verified' THEN 'verified' ELSE id_status END,
       verified_at  = COALESCE(verified_at, CASE WHEN $5 = 'verified' THEN NOW() END),
       twin_synced_at = NOW()
     WHERE email = $1`,
    [email, them.name || null, Boolean(them.verified), Boolean(them.age_verified),
     them.id_status || null]
  ).catch((err) => console.error('adoptFromTwin failed', err && err.message));
  return { adopted: true, ...them };
}

/* ═══════════════════════════════════════════════════════════ the twin's shelf
   The podcast and films shelves, kept as one shelf across the two houses.

   A recording is stored once, on the house it was published from; the twin
   holds a listing that points at it. So publishing here publishes there, a
   title changed on either side is changed on both, and taking an episode down
   takes it down in both places.

   Nothing here can be reached from the street: every letter is signed with the
   shared secret, and the receiving end verifies it before it reads a word. */

const MEDIA_TIMEOUT_MS = 9000;

/** POST to any twin endpoint, signed. Never throws: a twin that is down must
    not cost this house a publish. */
export async function twinPost(path, payload, ms = MEDIA_TIMEOUT_MS) {
  const raw = JSON.stringify(payload);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${TWIN.url}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-twin-sign': sign(raw) },
      body: raw,
      signal: ctrl.signal
    });
    if (!r.ok) return { ok: false, status: r.status };
    return await r.json();
  } catch (err) {
    console.error('twin unreachable at ' + path, err && err.message);
    return { ok: false, error: 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The stable address the twin should play this item from. It points at this
 * house's own /api/media-file endpoint rather than at a signed store link,
 * because those expire in a week — and a shelf that falls silent on a Tuesday
 * is worse than one that says plainly the file has gone.
 */
export function twinFileUrl(id) {
  return `${HOME.url}/api/media-file?id=${encodeURIComponent(id)}`;
}

/** What crosses for an episode: the listing and the words, never the bytes. */
function shelfOf(row, id) {
  return {
    twin_key: row.twin_key,
    kind: row.kind === 'video' ? 'video' : 'audio',
    title: row.title || '',
    summary: row.summary || '',
    number: row.number || '',
    length: row.length_text || '',
    seconds: row.seconds == null ? null : Number(row.seconds),
    tags: row.tags || '',
    mime: row.mime || '',
    state: row.state || 'published',
    transcript: row.transcript || null,
    links: row.links || null,
    topics: row.topics || null,
    purported_date: row.purported_date || null,
    file_url: row.remote_url || twinFileUrl(id),
    from: HOME.key
  };
}

/**
 * Tell the twin about a shelf change. Fire and forget from the caller's point
 * of view; the local save has already happened and must not wait on it.
 *
 * @param {'upsert'|'state'|'remove'} action
 * @param {object} row    the media row as this house has it
 */
export async function mirrorMedia(action, row) {
  if (!row || !row.twin_key) return { ok: false, error: 'no twin_key' };
  if (action === 'remove') {
    return twinPost('/api/twin-media', {
      action: 'remove', twin_key: row.twin_key, from: HOME.key
    });
  }
  return twinPost('/api/twin-media', Object.assign({ action }, shelfOf(row, row.id)));
}

/** Mint the identity an episode is known by on both sides. */
export function newTwinKey() {
  return HOME.key + '-' + Date.now().toString(36) +
    '-' + crypto.randomBytes(4).toString('hex');
}


/* ---- the live room ------------------------------------------------------

   A feed is a run of short segments, not a true stream, so the relay is a
   letter per segment rather than an open socket. Each carries the same two
   seconds of camera the house it was recorded on just stored, and each is
   sent without waiting: a twin that is slow or down must never make the
   broadcaster's own room stutter. A dropped segment is a dropped two
   seconds, not a broken feed. */

/* A segment is due about every two seconds. A letter that takes longer than
   this has already missed its place in the line, so stop waiting for it. */
const LIVE_TIMEOUT_MS = 4000;

/**
 * Tell the twin what the live room is doing.
 *
 * A feed that arrived from the twin is never relayed back — that is the whole
 * anti-echo rule, and it is checked here as well as at the call sites so that
 * a future caller cannot get it wrong.
 *
 * @param {'open'|'chunk'|'close'|'air'|'cursor'} action
 * @param {object} payload  twin_key, plus whatever the action needs
 */
export async function mirrorLive(action, payload) {
  const p = payload || {};
  if (p.twin_origin) return { ok: false, error: 'echo refused' };
  if (!p.twin_key && action !== 'air') return { ok: false, error: 'no twin_key' };
  return twinPost('/api/twin-live', Object.assign({ action, from: HOME.key }, p), LIVE_TIMEOUT_MS);
}

/** Mint the identity a feed is known by on both sides. */
export function newLiveKey() {
  return HOME.key + '-live-' + Date.now().toString(36) +
    '-' + crypto.randomBytes(4).toString('hex');
}
