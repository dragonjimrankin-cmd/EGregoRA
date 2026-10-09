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
  key: 'two-infinities',
  label: 'The Two Infinities (and beyond)',
  url: 'https://the-two-infinities.hatchable.site'
};
export const TWIN = {
  key: 'egregora',
  label: 'EGregoRA',
  url: 'https://egregora.hatchable.site'
};

/* A shared secret, so neither site will take an instruction from the street.
   It is not a user credential and grants nothing but member mirroring. */
const SECRET = process.env.TWIN_SECRET || 'twin_8f31c0a9d4e67b25a1c8f0d93e7b46512ac9d8e0f3b7a164';

/* How this project signs its letters. The twin carries the other set, so a
   code sent from either site looks like the site the member is standing in
   while saying plainly that the account covers both. */
export const BRAND = {
  name: 'The Two Infinities',
  wordmark: 'T H E \u00A0 T W O \u00A0 I N F I N I T I E S',
  paper: '#03040c',
  ink: '#e7edff',
  accent: '#76cfee',
  bright: '#cdefff',
  dim: '#a9b6d8',
  faint: '#7f8cb0',
  foot: '#64719a',
  /* The four doors worth opening first, used by the welcome letter. */
  highlights: [
    ['/foundations/', 'The foundations', 'the thesis itself: an eternal integration of opposing infinities, swinging like a pendulum that cannot settle.'],
    ['/stress-tests/', 'The stress tests', 'the experiments the framework ran against itself, including the one it lost.'],
    ['/plates/', 'The plates', 'every figure on the site, drawn as live vector art, gathered in one place.'],
    ['/ask-shakdrah/', 'ShakDrah', 'a green dragon who will answer in writing, at length, and say so when there is no good answer.']
  ],
  youAreIn: 'Your address is confirmed and you are a member of The Two Infinities (and beyond).'
};

/** One sentence, used in every letter either site sends. */
export const PAIR_LINE =
  'One account covers The Two Infinities (and beyond) and EGregoRA — ' +
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
