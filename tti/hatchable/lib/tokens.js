/**
 * API tokens.
 *
 * A token lets something that is not a browser — another chat, a script, an
 * agent on somebody else's machine — drive this project. Tokens are stored as
 * SHA-256 hashes, so the table is useless to anyone who reads it; the token
 * itself exists only where it was issued.
 */
import { db } from 'hatchable';

export async function sha256(text) {
  const bytes = new TextEncoder().encode(String(text));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Pull the bearer token off a request, however it was sent. */
export function bearer(req) {
  const h = (req.headers && (req.headers.authorization || req.headers.Authorization)) || '';
  const m = /^Bearer\s+(.+)$/i.exec(String(h));
  if (m) return m[1].trim();
  const alt = req.headers && (req.headers['x-egregora-token'] || req.headers['x-api-token']);
  if (alt) return String(alt).trim();
  const b = req.body || {}, q = req.query || {};
  return String(b.token || q.token || '').trim() || null;
}

/**
 * Check a token and record the use.
 * @returns {Promise<{ok:true,name:string,scope:string}|{ok:false,error:string}>}
 */
export async function checkToken(req, action) {
  const token = bearer(req);
  if (!token) return { ok: false, error: 'No token. Send Authorization: Bearer <token>.' };
  const hash = await sha256(token);
  const { rows } = await db.query(
    'SELECT id, name, scope, revoked FROM api_tokens WHERE token_hash = $1',
    [hash]
  );
  const row = rows && rows[0];
  if (!row) return { ok: false, error: 'That token is not known here.' };
  if (row.revoked) return { ok: false, error: 'That token has been revoked.' };
  await db.query(
    'UPDATE api_tokens SET uses = uses + 1, last_used = NOW(), last_action = $2 WHERE id = $1',
    [row.id, String(action || '').slice(0, 60)]
  );
  return { ok: true, name: row.name, scope: row.scope };
}

/** What the register of tokens looks like from outside: no hashes, no values. */
export async function listTokens() {
  const { rows } = await db.query(
    'SELECT name, scope, uses, last_used, last_action, revoked, created_at FROM api_tokens ORDER BY created_at'
  );
  return rows || [];
}
