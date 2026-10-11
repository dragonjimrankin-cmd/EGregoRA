/**
 * The order's one admin passcode, and the lockout that guards it.
 *
 * The keeper's key opened the first of these doors; the publishing doors on
 * /podcast/ and /videos/ share its three tries and its twenty-minute shut,
 * but have their own passcode — the keeper minds machines, this one
 * publishes work, and they are not the same job.
 * Keeping that logic in one place means a change to the rule is a change
 * everywhere, rather than three copies drifting apart.
 *
 * The passcode is never sent to the browser. The browser only ever learns
 * whether the one it typed was right.
 */
import { db, config } from 'hatchable';
import { whoAmI } from './accounts.js';

/* The publishing doors take the owner's own passcode. It is not a number,
   so the fields that use it are plain text rather than numeric. */
const FALLBACK = '8===D';
const TRIES = 3;
const LOCKOUT_MIN = 20;

export async function passcode() {
  try {
    /* Its own key, so setting the keeper's passcode on the Setup page does
       not quietly change who may publish. */
    const set = await config.get('PUBLISH_PASSCODE');
    if (set && String(set).trim()) return String(set).trim();
  } catch { /* not configured */ }
  return FALLBACK;
}

/** Who is knocking: address and signature, hashed, so nothing identifying is kept. */
/* ------------------------------------------------- the remembered key
 *
 * A door proved once with the right passcode mints a token, good for a
 * week. The browser keeps it in a cookie; every door on the site checks
 * for it before it asks, so the key is only ever asked for once. "Close
 * the door" burns the token in the table, and it is dead on every page.
 */
const TOKEN_DAYS = 7;

export async function issueToken(kind, member_id) {
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  let raw = '';
  for (let i = 0; i < a.length; i += 1) raw += String.fromCharCode(a[i]);
  const token = btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  await db.query(
    `INSERT INTO admin_tokens (token, kind, member_id, expires_at)
     VALUES ($1, $2, $3, NOW() + ($4 || ' days')::interval)
     ON CONFLICT (token) DO NOTHING`,
    [token, kind || 'admin', member_id || null, String(TOKEN_DAYS)]
  );
  return token;
}

export async function checkToken(token, wantKind) {
  const t = String(token || '').trim();
  if (!t) return null;
  try {
    const { rows } = await db.query(
      'SELECT kind, expires_at, member_id FROM admin_tokens WHERE token = $1 AND expires_at > NOW()', [t]);
    const row = rows && rows[0];
    if (!row) return null;
    if (wantKind === 'owner' && row.kind !== 'owner') return null;
    if (row.member_id) {
      /* A suspended member is suspended even through a remembered key. */
      const { rows: mrows } = await db.query('SELECT status FROM members WHERE id = $1', [row.member_id]);
      if (mrows && mrows[0] && mrows[0].status === 'suspended') return null;
    }
    return { kind: row.kind, until: row.expires_at };
  } catch {
    return null;
  }
}

export async function closeToken(token) {
  try {
    await db.query('DELETE FROM admin_tokens WHERE token = $1', [String(token || '')]);
  } catch { /* already dead */ }
}

/* The owner's key, a step behind the publishing one. It defaults to the
   publishing key — the owner is the one who holds that — and the setting
   OWNER_PASSCODE makes them different. */
export async function ownerPasscode() {
  try {
    const set = await config.get('OWNER_PASSCODE');
    if (set && String(set).trim()) return String(set).trim();
  } catch { /* not configured */ }
  return passcode();
}

export function knocker(req) {
  const h = (req && req.headers) || {};
  const ip = String(h['x-forwarded-for'] || h['x-real-ip'] ||
    (req && req.socket && req.socket.remoteAddress) || '?').split(',')[0].trim();
  const raw = ip + '|' + String(h['user-agent'] || '');
  let sum = 5381;
  for (let i = 0; i < raw.length; i++) sum = ((sum * 33) ^ raw.charCodeAt(i)) >>> 0;
  return 'k' + sum.toString(36) + '-' + raw.length;
}

async function shutFor(who) {
  try {
    const { rows } = await db.query('SELECT fails, locked_at FROM keeper_tries WHERE who = $1', [who]);
    const row = rows && rows[0];
    if (!row) return 0;
    if (!row.locked_at) return 0;
    const held = LOCKOUT_MIN - (Date.now() - new Date(row.locked_at).getTime()) / 60000;
    if (held > 0) return Math.ceil(held);
    await db.query('UPDATE keeper_tries SET fails = 0, locked_at = NULL WHERE who = $1', [who]).catch(() => {});
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Check a typed passcode. Returns { ok } or { ok:false, status, error }.
 * Every wrong key is counted; three shuts the door for twenty minutes.
 */
export async function adminDoor(req, typed) {
  /* The remembered key: proved once on any page, it rides in a cookie and
     opens every door for its week, so the order is not asked twice for
     what it has already given. */
  const held = await checkToken(req && req.body && req.body.token, null);
  if (held) return { ok: true, via: 'token', kind: held.kind };
  /* A signed-in member holding the privilege needs no key at all. */
  try {
    const member = await whoAmI(req);
    if (member && (member.privilege === 'admin' || member.privilege === 'owner')) {
      return { ok: true, via: 'member', member };
    }
  } catch { /* no session */ }
  const who = knocker(req);
  const wait = await shutFor(who);
  if (wait) {
    return { ok: false, status: 429, error: 'Too many wrong keys. The door is shut for ' + wait + ' more minute(s).' };
  }
  const want = await passcode();
  if (String(typed || '').trim() !== want) {
    try {
      const { rows } = await db.query(
        `INSERT INTO keeper_tries (who, fails, last_at) VALUES ($1, 1, NOW())
         ON CONFLICT (who) DO UPDATE SET fails = keeper_tries.fails + 1, last_at = NOW()
         RETURNING fails`, [who]);
      const fails = (rows && rows[0] && rows[0].fails) || 1;
      if (fails >= TRIES) {
        await db.query('UPDATE keeper_tries SET locked_at = NOW() WHERE who = $1', [who]).catch(() => {});
        return { ok: false, status: 429, error: 'That was the third wrong key. The door is shut for ' + LOCKOUT_MIN + ' minutes.' };
      }
      return { ok: false, status: 401, error: 'Not the key. ' + (TRIES - fails) + ' tr' + (TRIES - fails === 1 ? 'y' : 'ies') + ' left.' };
    } catch {
      return { ok: false, status: 401, error: 'Not the key.' };
    }
  }
  await db.query('DELETE FROM keeper_tries WHERE who = $1', [who]).catch(() => {});
  return { ok: true, who };
}

/**
 * The owner door — a step further behind the publishing one. Same three
 * tries, same twenty-minute shut, its own book of knocks. A remembered
 * owner token, or the account that holds the owner privilege, needs no
 * key at all.
 */
export async function ownerDoor(req, typed) {
  const held = await checkToken(req && req.body && req.body.token, 'owner');
  if (held) return { ok: true, via: 'token' };
  try {
    const member = await whoAmI(req);
    if (member && member.privilege === 'owner') return { ok: true, via: 'member', member };
  } catch { /* no session */ }
  const who = knocker(req) + '|owner';
  const wait = await shutFor(who);
  if (wait) {
    return { ok: false, status: 429, error: 'Too many wrong keys. The door is shut for ' + wait + ' more minute(s).' };
  }
  const want = await ownerPasscode();
  if (String(typed || '').trim() !== want) {
    try {
      const { rows } = await db.query(
        `INSERT INTO keeper_tries (who, fails, last_at) VALUES ($1, 1, NOW())
         ON CONFLICT (who) DO UPDATE SET fails = keeper_tries.fails + 1, last_at = NOW()
         RETURNING fails`, [who]);
      const fails = (rows && rows[0] && rows[0].fails) || 1;
      if (fails >= TRIES) {
        await db.query('UPDATE keeper_tries SET locked_at = NOW() WHERE who = $1', [who]).catch(() => {});
        return { ok: false, status: 429, error: 'That was the third wrong key. The door is shut for ' + LOCKOUT_MIN + ' minutes.' };
      }
      return { ok: false, status: 401, error: 'Not the key. ' + (TRIES - fails) + ' tr' + (TRIES - fails === 1 ? 'y' : 'ies') + ' left.' };
    } catch {
      return { ok: false, status: 401, error: 'Not the key.' };
    }
  }
  await db.query('DELETE FROM keeper_tries WHERE who = $1', [who]).catch(() => {});
  return { ok: true, who };
}