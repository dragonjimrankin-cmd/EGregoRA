/**
 * Accounts for the order.
 *
 * Passwordless by design: an address is proved by a six-digit code sent to
 * it, and after that a member may add a passkey — Face ID, Touch ID, Windows
 * Hello, an Android fingerprint or a hardware key — and come back with a
 * glance instead of an inbox.
 *
 * There are no passwords to leak, no password resets, and no biometric data
 * anywhere near this server: WebAuthn keeps the fingerprint or face on the
 * device and sends only a signature made by a key that device holds.
 */
import { db, email } from 'hatchable';

export const SESSION_DAYS = 30;
export const CODE_MINUTES = 15;

/* ------------------------------------------------------------- encoding */

export const b64url = {
  encode(bytes) {
    let s = '';
    const a = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let i = 0; i < a.length; i += 1) s += String.fromCharCode(a[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  decode(str) {
    const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
    const pad = s + '='.repeat((4 - (s.length % 4)) % 4);
    const bin = atob(pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  }
};

export function randomToken(bytes = 32) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return b64url.encode(a);
}

export function sixDigits() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(100000 + (a[0] % 900000));
}

export function cleanEmail(raw) {
  const e = String(raw || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254 ? e : null;
}

/* -------------------------------------------------------------- members */

export async function findOrCreate(addr, name) {
  const { rows } = await db.query(
    `INSERT INTO members (email, name) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET name = COALESCE(members.name, EXCLUDED.name)
     RETURNING id, email, name, verified`,
    [addr, name || null]
  );
  return rows[0];
}

export async function issueCode(member, purpose = 'verify') {
  const code = sixDigits();
  await db.query(
    `INSERT INTO member_codes (member_id, code, purpose, expires_at)
     VALUES ($1, $2, $3, NOW() + ($4 || ' minutes')::interval)`,
    [member.id, code, purpose, String(CODE_MINUTES)]
  );
  return code;
}

export async function sendCode(member, code, purpose) {
  const joining = purpose === 'verify';
  const subject = joining
    ? `EGregoRA — your verification code is ${code}`
    : `EGregoRA — your sign-in code is ${code}`;
  const html = `
    <div style="font-family:Georgia,serif;background:#0d0a05;color:#e8dcc0;padding:28px">
      <p style="font-family:'Times New Roman',serif;letter-spacing:4px;color:#d7b05a;font-size:13px;margin:0 0 14px">
        E G R E G O R A</p>
      <p style="margin:0 0 12px">${joining
        ? 'Welcome. One number proves the address is yours:'
        : 'Someone asked to sign in as you. If that was you:'}</p>
      <p style="font-size:34px;letter-spacing:10px;color:#f3ddaa;margin:18px 0">${code}</p>
      <p style="margin:0 0 10px;font-size:14px;color:#cbbb93">
        It is good for ${CODE_MINUTES} minutes and can be used once.</p>
      <p style="margin:0;font-size:13px;color:#8e8468">
        If you did not ask for this, ignore it — nothing has been created or changed.
        Test everything kindly.</p>
    </div>`;
  await email.send({
    to: member.email,
    subject,
    html,
    text: `EGregoRA — your code is ${code}. It is good for ${CODE_MINUTES} minutes.`
  });
}

export async function checkCode(member_id, code, purpose) {
  const { rows } = await db.query(
    `SELECT id FROM member_codes
      WHERE member_id = $1 AND code = $2 AND purpose = $3
        AND used_at IS NULL AND expires_at > NOW()
      ORDER BY id DESC LIMIT 1`,
    [member_id, String(code || '').trim(), purpose]
  );
  if (!rows[0]) return false;
  await db.query('UPDATE member_codes SET used_at = NOW() WHERE id = $1', [rows[0].id]);
  return true;
}

/* ------------------------------------------------------------- sessions */

export async function startSession(member_id, method) {
  const token = randomToken(32);
  await db.query(
    `INSERT INTO member_sessions (token, member_id, method, expires_at)
     VALUES ($1, $2, $3, NOW() + ($4 || ' days')::interval)`,
    [token, member_id, method || 'email', String(SESSION_DAYS)]
  );
  await db.query('UPDATE members SET last_seen = NOW(), verified = TRUE WHERE id = $1', [member_id]);
  return token;
}

export function bearer(req) {
  const h = (req.headers && (req.headers.authorization || req.headers.Authorization)) || '';
  const m = /^Bearer\s+(.+)$/i.exec(String(h));
  return m ? m[1].trim() : (req.body && req.body.token) || (req.query && req.query.token) || null;
}

export async function whoAmI(req) {
  const token = bearer(req);
  if (!token) return null;
  const { rows } = await db.query(
    `SELECT m.id, m.email, m.name, m.verified, m.age_verified, m.id_status,
            m.legal_name, m.dob, m.id_doc_type, m.created_at, m.verified_at,
            s.method, s.expires_at, s.created_at AS session_started
       FROM member_sessions s JOIN members m ON m.id = s.member_id
      WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  );
  return rows[0] || null;
}

/* ------------------------------------------------------------- passkeys */

export async function newChallenge(kind, member_id) {
  const challenge = randomToken(32);
  await db.query(
    `INSERT INTO member_challenges (challenge, member_id, kind, expires_at)
     VALUES ($1, $2, $3, NOW() + interval '10 minutes')`,
    [challenge, member_id || null, kind]
  );
  return challenge;
}

export async function takeChallenge(challenge, kind) {
  const { rows } = await db.query(
    `DELETE FROM member_challenges
      WHERE challenge = $1 AND kind = $2 AND expires_at > NOW()
      RETURNING member_id`,
    [String(challenge || ''), kind]
  );
  return rows[0] || null;
}

/** DER-encoded ECDSA signature → the raw r||s pair WebCrypto wants. */
function derToRaw(der) {
  if (der[0] !== 0x30) return der;                       // already raw
  let i = 2;
  if (der[1] & 0x80) i = 2 + (der[1] & 0x7f);
  const readInt = () => {
    if (der[i] !== 0x02) throw new Error('bad signature');
    const len = der[i + 1];
    let start = i + 2;
    let end = start + len;
    while (der[start] === 0x00 && end - start > 32) start += 1;
    const part = der.slice(start, end);
    i = end;
    const padded = new Uint8Array(32);
    padded.set(part, 32 - part.length);
    return padded;
  };
  const r = readInt();
  const s = readInt();
  const out = new Uint8Array(64);
  out.set(r, 0);
  out.set(s, 32);
  return out;
}

/**
 * Verify a WebAuthn assertion against a stored SPKI public key.
 * ES256 (P-256 + SHA-256) only, which is what every platform authenticator
 * offers first.
 */
export async function verifyAssertion({ publicKey, authenticatorData, clientDataJSON, signature }) {
  const spki = b64url.decode(publicKey);
  const authData = b64url.decode(authenticatorData);
  const clientData = b64url.decode(clientDataJSON);
  const sig = derToRaw(b64url.decode(signature));

  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', clientData));
  const signed = new Uint8Array(authData.length + hash.length);
  signed.set(authData, 0);
  signed.set(hash, authData.length);

  const key = await crypto.subtle.importKey(
    'spki', spki, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']
  );
  return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, sig, signed);
}

/** The flags byte of authenticatorData tells us whether a human was present
 *  and whether the device actually checked a face, a fingerprint or a PIN. */
export function authFlags(authenticatorData) {
  const d = b64url.decode(authenticatorData);
  const flags = d[32];
  return {
    present: Boolean(flags & 0x01),
    verified: Boolean(flags & 0x04)   // UV — biometric or PIN was checked
  };
}

export function parseClientData(clientDataJSON) {
  try {
    return JSON.parse(new TextDecoder().decode(b64url.decode(clientDataJSON)));
  } catch {
    return null;
  }
}


/* ------------------------------------------------------- the studio door
 *
 * The image and video generators are not open to the street. A caller must
 * be signed in, hold a verified address, and have passed the age and
 * identity check. This returns either { ok: true, member } or a refusal
 * ready to be handed back to the browser.
 */
export async function requireStudio(req) {
  const me = await whoAmI(req);
  if (!me) {
    return {
      ok: false, status: 401, reason: 'signin',
      error: 'The studio is for members. Sign in or create an account at /join/, then come back.'
    };
  }
  if (!me.verified) {
    return {
      ok: false, status: 403, reason: 'verify',
      error: 'Your address is not confirmed yet. Enter the six-digit code we emailed you.'
    };
  }
  if (!me.age_verified || me.id_status !== 'verified') {
    return {
      ok: false, status: 403, reason: 'identity',
      error: 'Generating images and video needs an age and identity check first. It takes a minute, at /join/.'
    };
  }
  return { ok: true, member: me };
}

/** Whole years between a date of birth and today, in UTC. */
export function ageFrom(dob) {
  const d = new Date(dob + 'T00:00:00Z');
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let years = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) years -= 1;
  return years;
}

export function callerIp(req) {
  const h = (req && req.headers) || {};
  const fwd = String(h['x-forwarded-for'] || h['cf-connecting-ip'] || '').split(',')[0].trim();
  return fwd || null;
}
