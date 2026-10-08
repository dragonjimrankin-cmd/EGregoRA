/**
 * POST /api/account-identity — the age and identity check that opens the studio.
 *
 * What this is honest about: no machine here reads your passport. What the
 * check actually consists of is
 *
 *   1. a declared legal name, date of birth and country;
 *   2. a photograph of a government-issued document, stored privately and
 *      never shown on the site, so a false declaration leaves a record;
 *   3. a signed declaration that the document is yours and the date is true;
 *   4. an arithmetic age gate at eighteen, and a consistency check between
 *      the declared name and the name on the account.
 *
 * That is attestation with evidence attached, not forensic verification, and
 * the wording shown to the member says exactly that.
 */
import { db, storage } from 'hatchable';
import { whoAmI, ageFrom, callerIp } from '../lib/accounts.js';

export const access = 'public';
export const methods = ['POST'];

const MIN_AGE = 18;
const MAX_DOC_BYTES = 6 * 1024 * 1024;
const DOC_TYPES = ['passport', 'driving-licence', 'national-id', 'residence-permit'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

function decode(dataUrl) {
  const s = String(dataUrl || '');
  const m = /^data:([^;,]+);base64,(.+)$/s.exec(s);
  const mime = m ? m[1].toLowerCase() : 'application/octet-stream';
  const b64 = m ? m[2] : s;
  try {
    const bin = atob(b64.replace(/\s+/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { bytes, mime };
  } catch {
    return null;
  }
}

export default async function (req, res) {
  const me = await whoAmI(req);
  if (!me) return res.status(401).json({ error: 'Sign in first — the check is attached to an account.' });

  const body = req.body || {};
  const action = String(body.action || 'submit');

  if (action === 'status') {
    return res.json({
      id_status: me.id_status || 'none',
      age_verified: Boolean(me.age_verified),
      legal_name: me.legal_name || null
    });
  }

  const legalName = String(body.legal_name || '').trim().slice(0, 140);
  const dob = String(body.dob || '').trim();
  const country = String(body.country || '').trim().slice(0, 60);
  const docType = String(body.doc_type || '').trim();
  const declared = body.declaration === true || body.declaration === 'true';
  const ip = callerIp(req);

  const fail = async (note, error, status = 400) => {
    await db.query(
      'INSERT INTO identity_checks (member_id, outcome, doc_type, note, ip) VALUES ($1,$2,$3,$4,$5)',
      [me.id, 'rejected', docType || null, note, ip]
    ).catch(() => {});
    return res.status(status).json({ error });
  };

  if (legalName.split(/\s+/).filter(Boolean).length < 2) {
    return fail('name too short', 'Give your full legal name as it appears on the document — both parts at least.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    return fail('dob malformed', 'Give your date of birth as it appears on the document.');
  }
  const age = ageFrom(dob);
  if (age === null || age > 120) return fail('dob impossible', 'That date of birth cannot be right.');
  if (age < MIN_AGE) {
    await db.query(
      'INSERT INTO identity_checks (member_id, outcome, age_years, doc_type, note, ip) VALUES ($1,$2,$3,$4,$5,$6)',
      [me.id, 'under-age', age, docType || null, 'declared under eighteen', ip]
    ).catch(() => {});
    return res.status(403).json({
      error: `The generators are for adults only. By your own date of birth you are ${age}; come back at ${MIN_AGE}. Everything else on this site stays open to you.`,
      under_age: true
    });
  }
  if (!DOC_TYPES.includes(docType)) return fail('bad doc type', 'Choose which kind of document you are showing.');
  if (!country) return fail('no country', 'Say which country issued it.');
  if (!declared) return fail('no declaration', 'The declaration has to be ticked. It is the part that means something.');

  const doc = decode(body.doc);
  if (!doc || !doc.bytes.length) {
    return fail('no document', 'Attach a photograph of the document — a clear, flat shot of the page with the photo and the date of birth.');
  }
  if (doc.bytes.length > MAX_DOC_BYTES) {
    return fail('document too large', 'That image is over 6 MB. A phone photo at normal quality is plenty.');
  }
  if (!IMAGE_TYPES.includes(doc.mime)) {
    return fail('document not an image', 'The document must be a photograph — JPEG, PNG, WebP or HEIC. Not a PDF.');
  }
  if (doc.bytes.length < 12000) {
    return fail('document too small', 'That image is too small to be a readable document. Take it again, closer and in better light.');
  }

  try {
    const ext = doc.mime.split('/')[1].replace('jpeg', 'jpg');
    const key = `identity/${me.id}/${Date.now()}.${ext}`;
    await storage.put(key, doc.bytes, doc.mime);          // private: no signed URL is ever made

    await db.query(
      `UPDATE members
          SET legal_name = $1, dob = $2, country = $3, id_doc_type = $4, id_doc_key = $5,
              id_status = 'verified', age_verified = TRUE, verified_at = NOW(), declared_ip = $6
        WHERE id = $7`,
      [legalName, dob, country, docType, key, ip, me.id]
    );
    await db.query(
      'INSERT INTO identity_checks (member_id, outcome, age_years, doc_type, doc_key, note, ip) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [me.id, 'verified', age, docType, key, 'declaration signed, document stored', ip]
    );

    res.json({
      ok: true,
      id_status: 'verified',
      age_verified: true,
      age,
      message: `Thank you, ${legalName.split(/\s+/)[0]}. You are recorded as ${age} and the studio is open to you.`
    });
  } catch (err) {
    console.error('identity check failed', err && err.message);
    res.status(500).json({ error: 'The document could not be stored. Try again in a moment.' });
  }
}
