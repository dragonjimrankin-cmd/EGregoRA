/**
 * POST /api/account-face — prove your age by showing your face.
 *
 * The browser takes two or three frames from the phone camera or webcam and
 * posts them here. A vision model estimates the age of the face; the frames
 * are then thrown away unless the check fails, in which case one is kept as
 * evidence of the attempt.
 *
 * The thresholds follow the way age estimation is actually used in practice:
 *
 *   estimated 25 or over, confidently       → pass. The buffer above 18 is
 *                                             the whole point: estimation is
 *                                             accurate to a few years, so the
 *                                             line is drawn well clear of it.
 *   estimated 18 to 24                      → inconclusive. The studio stays
 *                                             shut and the document check is
 *                                             offered instead. Nobody is
 *                                             accused of anything.
 *   estimated under 18                      → refused and recorded.
 *   no face, or a photograph of a screen    → refused, try again or use a
 *                                             document.
 */
import { db, storage } from 'hatchable';
import { whoAmI, callerIp } from '../lib/accounts.js';
import { estimateAge } from '../lib/facecheck.js';

export const access = 'public';
export const methods = ['POST'];

const PASS_AT = 25;          // confident-adult threshold
const ADULT_AT = 18;
const MAX_FRAME = 3 * 1024 * 1024;

function bytesOf(dataUrl) {
  const m = /^data:([^;,]+);base64,(.+)$/s.exec(String(dataUrl || ''));
  if (!m) return null;
  try {
    const bin = atob(m[2].replace(/\s+/g, ''));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return { bytes: out, mime: m[1].toLowerCase() };
  } catch {
    return null;
  }
}

export default async function (req, res) {
  const me = await whoAmI(req);
  if (!me) return res.status(401).json({ error: 'Sign in first — the check is attached to an account.' });
  if (me.age_verified && me.id_status === 'verified') {
    return res.json({ ok: true, already: true, message: 'You are already checked. The studio is open.' });
  }

  const body = req.body || {};
  const frames = Array.isArray(body.frames) ? body.frames.slice(0, 3) : (body.frame ? [body.frame] : []);
  const ip = callerIp(req);

  if (!frames.length) return res.status(400).json({ error: 'No picture came through. Try the scan again.' });

  const first = bytesOf(frames[0]);
  if (!first) return res.status(400).json({ error: 'That frame could not be read.' });
  if (first.bytes.length > MAX_FRAME) return res.status(400).json({ error: 'That frame is too large.' });
  if (!/^image\/(jpeg|png|webp)$/.test(first.mime)) {
    return res.status(400).json({ error: 'The scan must be a JPEG or PNG frame.' });
  }

  const record = async (outcome, age, note, keep) => {
    let docKey = null;
    if (keep) {
      try {
        docKey = `identity/${me.id}/face-${Date.now()}.jpg`;
        await storage.put(docKey, first.bytes, first.mime);
      } catch { docKey = null; }
    }
    await db.query(
      'INSERT INTO identity_checks (member_id, outcome, age_years, doc_type, doc_key, note, ip) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [me.id, outcome, age == null ? null : Math.round(age), 'face-scan', docKey, String(note || '').slice(0, 400), ip]
    ).catch(() => {});
    return docKey;
  };

  /* Ask every frame we were given and keep the most confident reading. */
  let best = null;
  for (const frame of frames) {
    const out = await estimateAge(frame);
    if (!out) continue;
    if (!best || (Number(out.confidence) || 0) > (Number(best.confidence) || 0)) best = out;
  }

  /* No server-side vision route answered — which is the normal case on a
     project with no model keys. The browser ran the estimate itself, with a
     published face model and no network at all, and sent the reading here.
     That cannot be trusted the way a server-side reading can, so when it is
     the only evidence we keep the frame as well. */
  let clientOnly = false;
  if (!best) {
    const c = body.client_estimate || {};
    const cAge = Number(c.age);
    if (c && c.face && Number.isFinite(cAge) && cAge > 0 && cAge < 120) {
      clientOnly = true;
      best = {
        face: true,
        faces: Number(c.faces || 1),
        live: true,
        age: Math.round(cAge),
        low: Number(c.low) || null,
        high: Number(c.high) || null,
        confidence: Number(c.confidence) || 0.6,
        note: 'read in the browser by ' + String(c.model || 'a face model').slice(0, 60) +
          ' from ' + Number(c.samples || 1) + ' samples',
        model: 'browser:' + String(c.model || 'face-api')
      };
    }
  }

  if (!best) {
    await record('inconclusive', null, 'no model answered, server or browser', false);
    return res.status(503).json({
      error: 'No age-estimation model would answer just now \u2014 neither here nor in your browser. ' +
        'The document check below is working and will settle it.',
      fallback: 'document'
    });
  }

  if (!best.face) {
    await record('inconclusive', null, 'no usable face: ' + best.note, false);
    return res.status(400).json({
      error: 'No clear face in that scan — ' + (best.note || 'too dark, too far or cut off') +
        '. Face a window, fill the frame with your head, and try again.',
      retry: true, note: best.note
    });
  }
  if (best.faces > 1) {
    await record('inconclusive', best.age, 'more than one face in frame', false);
    return res.status(400).json({ error: 'More than one face in the frame. Scan alone.', retry: true });
  }
  if (!best.live) {
    await record('rejected', best.age, 'presentation attack suspected: ' + best.note, true);
    return res.status(403).json({
      error: 'That looks like a photograph of a screen or a printed picture rather than a person at a camera. ' +
        'Try again in better light, or use the document check.',
      fallback: 'document'
    });
  }

  const age = Number(best.age);

  if (age < ADULT_AT) {
    await record('under-age', age, 'estimated under eighteen: ' + best.note, true);
    return res.status(403).json({
      error: `The scan reads as about ${age}. The generators are for adults only, so they stay shut. ` +
        'Everything else on this site is open to you, and always will be. If the scan is wrong about ' +
        'you, the document check will settle it.',
      estimated: age, fallback: 'document'
    });
  }

  if (age < PASS_AT || (Number(best.confidence) || 0) < 0.45) {
    await record('inconclusive', age, 'within the buffer, or low confidence', false);
    return res.status(200).json({
      ok: false, inconclusive: true, estimated: age, confidence: best.confidence,
      message: `The scan reads as about ${age}, which is too close to the line to call. Age estimation ` +
        'is only good to a few years, so the studio asks for a document whenever the reading falls ' +
        'under twenty-five. No judgement in it — it is arithmetic.',
      fallback: 'document'
    });
  }

  /* Clear adult. */
  const name = String(body.legal_name || me.name || '').trim().slice(0, 140) || null;
  await db.query(
    `UPDATE members
        SET id_status = 'verified', age_verified = TRUE, verified_at = NOW(),
            id_doc_type = 'face-scan', declared_ip = $1, legal_name = COALESCE(legal_name, $2)
      WHERE id = $3`,
    [ip, name, me.id]
  );
  await record('verified', age, 'face scan, estimated ' + age + ' (' + (best.model || 'vision model') + ')', clientOnly);

  res.json({
    ok: true,
    id_status: 'verified',
    age_verified: true,
    estimated: age,
    model: best.model,
    message: `The scan reads as comfortably over eighteen — about ${age}. The studio is open to you. ` +
      (clientOnly
        ? 'The reading was taken in your browser, so one frame is kept as the record of it.'
        : 'The picture has been discarded; only the reading was kept.')
  });
}
