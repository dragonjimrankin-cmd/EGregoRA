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
