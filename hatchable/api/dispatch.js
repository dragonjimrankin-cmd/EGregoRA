/**
 * POST /api/dispatch — send a letter to the whole mailing list.
 *
 * Only the order's own addresses may do this, and only while signed in.
 * Send with { test: true } first and it goes to you alone.
 */
import { db } from 'hatchable';
import { whoAmI } from '../lib/accounts.js';
import { sendDispatch } from '../lib/mailing.js';

export const access = 'public';
export const methods = ['POST'];

const KEEPERS = ['ask@egregora.org', 'ed@egregora.org', 'jim@egregora.org'];

export default async function (req, res) {
  const me = await whoAmI(req);
  if (!me) return res.status(401).json({ error: 'Sign in first.' });
  if (!KEEPERS.includes(String(me.email || '').toLowerCase())) {
    return res.status(403).json({ error: 'Only the order sends to the order.' });
  }

  const body = req.body || {};
  const subject = String(body.subject || '').trim().slice(0, 200);
  const title = String(body.title || '').trim().slice(0, 200) || null;
  const html = String(body.body || body.html || '').trim();
  const test = body.test !== false;

  if (!subject) return res.status(400).json({ error: 'A subject line.' });
  if (html.length < 20) return res.status(400).json({ error: 'There is no letter here.' });

  const out = await sendDispatch({ subject, title, body: html, only: test ? me.email : null });

  await db.query(
    'INSERT INTO dispatches (subject, body, sent, failed, test_only, sent_by) VALUES ($1,$2,$3,$4,$5,$6)',
    [subject, html.slice(0, 20000), out.sent, out.failed, test, me.email]
  ).catch(() => {});

  res.json({
    ok: true, test,
    ...out,
    message: test
      ? `Test sent to ${me.email} alone. Post again with "test": false to send to all ${out.total ? '' : ''}subscribers.`
      : `Sent to ${out.sent} of ${out.total} subscribers${out.failed ? `, ${out.failed} failed` : ''}.`
  });
}
