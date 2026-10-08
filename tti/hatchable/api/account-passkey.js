/**
 * POST /api/account-passkey — the biometric half of the door.
 *
 * Four actions, chosen with { action } in the body:
 *
 *   register-options  (signed in)  → challenge + relying-party details so the
 *                                    browser can ask the device for a key
 *   register          (signed in)  → store the public key the device made
 *   login-options                  → challenge for a biometric sign-in
 *   login                          → verify the signature, open a session
 *
 * No fingerprint or face ever reaches this server. The device checks the
 * human locally and proves it by signing a challenge with a key it holds;
 * the user-verified flag in the signed data is what tells us a biometric (or
 * a device PIN) was actually used.
 */
import { db } from 'hatchable';
import {
  whoAmI, cleanEmail, newChallenge, takeChallenge,
  verifyAssertion, authFlags, parseClientData, startSession, b64url
} from '../lib/accounts.js';

export const access = 'public';
export const methods = ['POST'];

function rpIdFrom(req) {
  const host = String((req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '')
    .split(':')[0].toLowerCase();
  return host || 'egregora.hatchable.site';
}

export default async function (req, res) {
  const body = req.body || {};
  const action = String(body.action || '').trim();
  const rpId = rpIdFrom(req);

  try {
    /* ---------------------------------------------- enrol a new passkey */
    if (action === 'register-options') {
      const me = await whoAmI(req);
      if (!me) return res.status(401).json({ error: 'Sign in with your email first, then add a passkey.' });

      const challenge = await newChallenge('register', me.id);
      const { rows } = await db.query('SELECT cred_id FROM member_passkeys WHERE member_id = $1', [me.id]);

      return res.json({
        challenge,
        rp: { id: rpId, name: 'EGregoRA' },
        user: {
          id: b64url.encode(new TextEncoder().encode('m' + me.id)),
          name: me.email,
          displayName: me.name || me.email
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'required'      // force the face / finger / PIN check
        },
        timeout: 120000,
        attestation: 'none',
        excludeCredentials: rows.map((r) => ({ type: 'public-key', id: r.cred_id }))
      });
    }

    if (action === 'register') {
      const me = await whoAmI(req);
      if (!me) return res.status(401).json({ error: 'Sign in first.' });

      const { credId, publicKey, challenge, clientDataJSON, label } = body;
      if (!credId || !publicKey || !challenge) {
        return res.status(400).json({ error: 'The device sent an incomplete key.' });
      }
      const taken = await takeChallenge(challenge, 'register');
      if (!taken) return res.status(400).json({ error: 'That enrolment expired. Start again.' });

      const client = parseClientData(clientDataJSON);
      if (client && client.challenge && client.challenge !== challenge) {
        return res.status(400).json({ error: 'The challenge did not match.' });
      }

      await db.query(
        `INSERT INTO member_passkeys (member_id, cred_id, public_key, label)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (cred_id) DO UPDATE SET public_key = EXCLUDED.public_key, label = EXCLUDED.label`,
        [me.id, String(credId), String(publicKey), String(label || 'This device').slice(0, 60)]
      );
      return res.json({ ok: true, message: 'Passkey enrolled. You can sign in with your face or fingerprint now.' });
    }

    /* ------------------------------------------------ biometric sign-in */
    if (action === 'login-options') {
      const addr = cleanEmail(body.email);
      let memberId = null;
      let allow = [];
      if (addr) {
        const { rows } = await db.query(
          `SELECT p.cred_id, p.member_id FROM member_passkeys p
             JOIN members m ON m.id = p.member_id WHERE m.email = $1`, [addr]);
        if (!rows.length) {
          return res.status(404).json({ error: 'No passkey is enrolled for that address. Use the emailed code.' });
        }
        memberId = rows[0].member_id;
        allow = rows.map((r) => ({ type: 'public-key', id: r.cred_id }));
      }
      const challenge = await newChallenge('login', memberId);
      return res.json({
        challenge,
        rpId,
        timeout: 120000,
        userVerification: 'required',
        allowCredentials: allow
      });
    }

    if (action === 'login') {
      const { credId, challenge, authenticatorData, clientDataJSON, signature } = body;
      if (!credId || !challenge || !authenticatorData || !clientDataJSON || !signature) {
        return res.status(400).json({ error: 'The device sent an incomplete assertion.' });
      }

      const taken = await takeChallenge(challenge, 'login');
      if (!taken) return res.status(400).json({ error: 'That sign-in expired. Try again.' });

      const client = parseClientData(clientDataJSON);
      if (!client || client.type !== 'webauthn.get' || client.challenge !== challenge) {
        return res.status(400).json({ error: 'The challenge did not match.' });
      }

      const { rows } = await db.query(
        `SELECT p.id, p.member_id, p.public_key, m.email, m.name
           FROM member_passkeys p JOIN members m ON m.id = p.member_id
          WHERE p.cred_id = $1`, [String(credId)]);
      const key = rows[0];
      if (!key) return res.status(404).json({ error: 'That passkey is not known here.' });

      const flags = authFlags(authenticatorData);
      if (!flags.present) return res.status(401).json({ error: 'No one was present at the device.' });
      if (!flags.verified) {
        return res.status(401).json({ error: 'The device did not check a face, fingerprint or PIN. Try again.' });
      }

      const good = await verifyAssertion({
        publicKey: key.public_key, authenticatorData, clientDataJSON, signature
      });
      if (!good) return res.status(401).json({ error: 'That signature does not verify.' });

      await db.query('UPDATE member_passkeys SET last_used = NOW() WHERE id = $1', [key.id]);
      const token = await startSession(key.member_id, 'passkey');
      return res.json({
        ok: true, token,
        member: { id: key.member_id, email: key.email, name: key.name, verified: true }
      });
    }

    /* ------------------------------------------------------- housekeeping */
    if (action === 'forget') {
      const me = await whoAmI(req);
      if (!me) return res.status(401).json({ error: 'Sign in first.' });
      await db.query('DELETE FROM member_passkeys WHERE member_id = $1 AND id = $2', [me.id, Number(body.id)]);
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action.' });
  } catch (err) {
    console.error('account-passkey failed', action, err && err.message);
    return res.status(500).json({ error: 'The key exchange failed: ' + (err && err.message || 'unknown') });
  }
}
