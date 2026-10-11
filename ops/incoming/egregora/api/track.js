/**
 * POST /api/track — one quiet row per page load.
 *
 * Every page of the house sends one small note: which page, who referred
 * the visitor, what they read it with, and — if a member is signed in —
 * whose eyes it was. The owner mode reads these rows as the house traffic.
 *
 * Nothing about the page's words is kept; the table trims itself past
 * ninety days, a little at a time, so the ledger never outgrows the house.
 */
import { db } from 'hatchable';
import { whoAmI } from '../lib/accounts.js';

export const access = 'public';
export const methods = ['POST'];

const PATH_MAX = 200;
const REF_MAX = 300;
const AGENT_MAX = 200;

export default async function (req, res) {
  const body = req.body || {};
  const path = String(body.path || '').trim().slice(0, PATH_MAX);
  if (!path || path.length > PATH_MAX) return res.status(204).end();
  if (path.startsWith('/api/') || path.startsWith('/__hatchable')) return res.status(204).end();
  if (!/^\/[a-z0-9\-_/.]*$/i.test(path)) return res.status(204).end();

  const ref = String(body.ref || '').slice(0, REF_MAX) || null;
  const agent = String((req.headers && (req.headers['user-agent'])) || '').slice(0, AGENT_MAX);

  let member_email = null;
  try {
    const me = await whoAmI(req);
    if (me) member_email = me.email;
  } catch { /* anonymous */ }

  try {
    await db.query(
      `INSERT INTO visits (path, referrer, agent, member_email)
       VALUES ($1, $2, $3, $4)`,
      [path, ref, agent || null, member_email]
    );
    /* A trim, on about one request in forty: drop the oldest beyond 90 days. */
    if (Math.random() < 0.025) {
      await db.query(
        `WITH old AS (
           SELECT ctid FROM visits
            WHERE at < NOW() - INTERVAL '90 days'
            ORDER BY at DESC
            LIMIT 500
         )
         DELETE FROM visits v USING old WHERE v.ctid = old.ctid`
      ).catch(() => {});
    }
  } catch (e) {
    console.error('track failed', e && e.message);
  }

  res.status(204).end();
}