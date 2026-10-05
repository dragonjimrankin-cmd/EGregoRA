/**
 * POST /api/letter — the "Write to Ed directly" form.
 *
 * Three things happen, in this order of importance:
 *   1. the letter is written to the database, so it cannot be lost;
 *   2. an acknowledgement goes straight back to the asker;
 *   3. the letter is forwarded to the order's address.
 *
 * Steps two and three are allowed to fail without failing the request —
 * a letter safely stored is the thing that matters.
 */
import { db, email } from 'hatchable';
import { cleanEmail, randomToken } from '../lib/accounts.js';

export const access = 'public';
export const methods = ['POST'];

const ED = 'ask@egregora.org';
const LIMB_NOTE = {
  'Cosmic physics & astronomy': 'the first limb',
  'Druidry, trees & nature': 'the second limb',
  'Sacred geometry': 'the third limb',
  'Astrology': 'the fourth limb',
  'Neuroscience & psychology': 'the fifth limb',
  'Biology & life': 'the sixth limb',
  'God, the Law of One & contact': 'the seventh limb',
  'Magic & the wizard\u2019s craft': 'the ninth limb',
  'History, propaganda & the shadow': 'the eighth limb'
};

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* The acknowledgement. Ornate, but it promises nothing it cannot keep. */
function autoreplyHtml({ name, topic, question, reference }) {
  const first = String(name || '').trim().split(/\s+/)[0] || 'friend';
  const limb = LIMB_NOTE[topic] || 'no limb in particular, which is often where the good questions sit';
  return `<!doctype html><html><body style="margin:0;background:#0a090e;padding:28px 12px;
    font-family:Georgia,'EB Garamond',serif;color:#cbbb93">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;background:#100e16;
      border:1px solid rgba(215,176,90,.38);border-radius:4px" cellpadding="0" cellspacing="0">
      <tr><td style="padding:26px 30px 10px;text-align:center">
        <div style="font-size:26px;color:#d7b05a;letter-spacing:.3em">&#10022;</div>
        <div style="font-family:Georgia,serif;letter-spacing:.34em;color:#f3ddaa;
          font-size:15px;text-transform:uppercase;margin-top:10px">EGregoRA</div>
        <div style="color:#9f947a;font-size:12px;letter-spacing:.22em;margin-top:6px">LIFE, LOVE, MAGIC.</div>
      </td></tr>
      <tr><td style="padding:4px 30px 0"><hr style="border:0;border-top:1px solid rgba(215,176,90,.22)"></td></tr>
      <tr><td style="padding:18px 30px 26px;font-size:16px;line-height:1.62">
        <p style="margin:0 0 14px">${esc(first)},</p>
        <p style="margin:0 0 14px">Your letter reached the order and has been put in the pile. This note is
        sent by the machinery, not by Ed &mdash; but Ed reads every letter himself, and that is not
        machinery at all.</p>
        <p style="margin:0 0 14px">You filed it under <strong style="color:#f3ddaa">${esc(topic || 'nothing in particular')}</strong>
        &mdash; ${esc(limb)}. Your reference is
        <strong style="color:#f3ddaa;letter-spacing:.12em">${esc(reference)}</strong>; quote it if you write again.</p>
        <blockquote style="margin:0 0 16px;padding:10px 16px;border-left:2px solid rgba(215,176,90,.42);
          color:#9f947a;font-style:italic;white-space:pre-wrap">${esc(String(question).slice(0, 700))}</blockquote>
        <p style="margin:0 0 14px"><strong style="color:#f3ddaa">What happens now.</strong> Most letters are
        answered within a fortnight. Some are answered at length in the podcast mailbag instead, and if you
        asked us not to, they are not. Ed will tell you plainly when he does not know &mdash; that is the
        most common answer here, and the most useful one.</p>
        <p style="margin:0 0 14px"><strong style="color:#f3ddaa">If you cannot wait.</strong> The oracle at
        <a href="https://egregora.hatchable.site/ask-ed/" style="color:#d7b05a">egregora.hatchable.site/ask-ed/</a>
        answers at once, from the order's own written answers, and will say so when it is guessing.</p>
        <p style="margin:0 0 14px"><strong style="color:#f3ddaa">Please note.</strong> EGregoRA is a study
        order, not a clinic. We cannot give medical, psychiatric, legal or financial advice, and will not
        advise on any controlled substance. If you are in crisis, contact your local emergency service or a
        crisis line now rather than waiting for a reply &mdash; in the UK, Samaritans, 116&nbsp;123, free,
        at any hour.</p>
        <p style="margin:0 0 6px">Test everything kindly.</p>
        <p style="margin:0;color:#9f947a">&mdash; The order, on Ed's behalf</p>
      </td></tr>
      <tr><td style="padding:0 30px 24px;text-align:center;color:#6f6855;font-size:11.5px;line-height:1.6">
        <hr style="border:0;border-top:1px solid rgba(215,176,90,.18);margin-bottom:12px">
        EGregoRA &middot; co-founded by Edward Gregory and Jim Rankin<br>
        This address accepts replies. You received this because someone used your address on the form at
        egregora.hatchable.site &mdash; if that was not you, ignore it and nothing further will be sent.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function forwardHtml(row) {
  return `<div style="font-family:Georgia,serif;line-height:1.6">
    <h2>A letter for Ed &mdash; ${esc(row.reference)}</h2>
    <p><strong>From:</strong> ${esc(row.name)} &lt;${esc(row.email)}&gt;<br>
       <strong>Limb:</strong> ${esc(row.topic || '\u2014')}<br>
       <strong>May we answer publicly:</strong> ${esc(row.publicity || '\u2014')}</p>
    <hr>
    <p style="white-space:pre-wrap">${esc(row.question)}</p>
    <hr>
    <p style="color:#777;font-size:12px">Reply straight to this message to reach them.</p>
  </div>`;
}

export default async function (req, res) {
  const body = req.body || {};
  const name = String(body.name || '').trim().slice(0, 120);
  const addr = cleanEmail(body.email);
  const question = String(body.question || '').trim().slice(0, 8000);
  const topic = String(body.topic || '').trim().slice(0, 120) || null;
  const publicity = String(body.public || body.publicity || '').trim().slice(0, 120) || null;

  if (body.website) return res.json({ ok: true });            // honeypot: say yes, do nothing
  if (!name) return res.status(400).json({ error: 'A name, even a chosen one.' });
  if (!addr) return res.status(400).json({ error: 'A working email address, or Ed cannot reply.' });
  if (question.length < 12) return res.status(400).json({ error: 'Ask the real question — a line or two at least.' });

  try {
    const { rows: recent } = await db.query(
      `SELECT count(*)::int AS n FROM letters WHERE email = $1 AND created_at > NOW() - interval '1 hour'`,
      [addr]
    );
    if (recent[0] && recent[0].n >= 4) {
      return res.status(429).json({ error: 'Four letters in an hour is plenty. Ed will get to them.' });
    }

    const reference = 'EG-' + randomToken(4).slice(0, 6).toUpperCase();
    const { rows } = await db.query(
      `INSERT INTO letters (name, email, topic, question, publicity, reference)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, addr, topic, question, publicity, reference]
    );
    const row = rows[0];

    let replied = false;
    try {
      await email.send({
        to: addr,
        subject: 'Your letter reached the order \u2014 ' + reference,
        html: autoreplyHtml(row)
      });
      replied = true;
      await db.query('UPDATE letters SET autoreplied = TRUE WHERE id = $1', [row.id]);
    } catch (err) {
      console.error('autoreply failed', err && err.message);
    }

    try {
      await email.send({
        to: ED,
        subject: `[${reference}] ${topic || 'A letter'} \u2014 ${name}`,
        html: forwardHtml(row),
        replyTo: addr
      });
      await db.query('UPDATE letters SET forwarded = TRUE WHERE id = $1', [row.id]);
    } catch (err) {
      console.error('forward failed', err && err.message);
    }

    res.json({
      ok: true,
      reference,
      autoreplied: replied,
      message: replied
        ? `Your letter is in the pile. An acknowledgement is on its way to ${addr}; your reference is ${reference}.`
        : `Your letter is in the pile, reference ${reference}. The acknowledgement email could not be sent, but the letter itself is safe and Ed will see it.`
    });
  } catch (err) {
    console.error('letter failed', err && err.message);
    res.status(500).json({ error: 'The letter could not be stored. Try again, or email ask@egregora.org directly.' });
  }
}
