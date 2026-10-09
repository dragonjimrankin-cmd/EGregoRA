/**
 * /api/unsubscribe — one click off the list.
 *
 *   GET  ?t=<token>   → removes them and returns a plain page saying so.
 *   POST { on: true } → with a session, puts them back on.
 *
 * No sign-in, no confirmation step that argues, no "are you sure". The link
 * in the email footer works on the first click, from any mail client, even
 * when the person has long since forgotten the account exists.
 */
import { db } from 'hatchable';
import { mirror } from '../lib/twin.js';
import { whoAmI } from '../lib/accounts.js';

export const access = 'public';
export const methods = ['GET', 'POST'];

const SITE = 'https://egregora.hatchable.site';

function page(heading, line, extra = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${heading} — EGregoRA</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=EB+Garamond:ital@0;1&display=swap" rel="stylesheet">
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:#0a090e;
         color:#cbbb93; font-family:'EB Garamond',Georgia,serif; padding:2rem 1rem; }
  .card { max-width:34rem; text-align:center; border:1px solid rgba(215,176,90,.38);
          border-radius:4px; background:#100e16; padding:2.2rem 2rem;
          box-shadow:0 18px 50px rgba(0,0,0,.6); }
  .mark { color:#d7b05a; font-size:1.8rem; letter-spacing:.3em; }
  .name { font-family:'Cinzel',serif; letter-spacing:.34em; color:#f3ddaa; font-size:.95rem;
          text-transform:uppercase; margin:.7rem 0 .3rem; }
  .tag { color:#9f947a; font-size:.7rem; letter-spacing:.22em; text-transform:uppercase; }
  h1 { font-family:'Cinzel',serif; color:#f3ddaa; font-size:1.3rem; font-weight:600;
       margin:1.4rem 0 .8rem; letter-spacing:.04em; }
  p { line-height:1.65; margin:0 0 1rem; }
  .small { font-size:.9rem; color:#9f947a; }
  a.btn { display:inline-block; margin-top:.6rem; padding:.6rem 1.2rem; text-decoration:none;
          font-family:'Cinzel',serif; font-size:.7rem; letter-spacing:.2em; text-transform:uppercase;
          color:#d7b05a; border:1px solid rgba(215,176,90,.45); border-radius:3px; }
  a.btn:hover { color:#f3ddaa; border-color:rgba(215,176,90,.9); }
  hr { border:0; border-top:1px solid rgba(215,176,90,.2); margin:1.4rem 0; }
</style></head><body>
<div class="card">
  <div class="mark">&#10022;</div>
  <div class="name">EGregoRA</div>
  <div class="tag">Life, Love, Magic.</div>
  <h1>${heading}</h1>
  <p>${line}</p>
  ${extra}
  <hr>
  <p class="small">Nothing else changes. Your account stands, and every page on the site is open to you
  whether you are on the list or not.</p>
  <a class="btn" href="${SITE}/">Back to the order</a>
</div></body></html>`;
}

export default async function (req, res) {
  /* ---- putting someone back on, from their own account ---- */
  if (req.method === 'POST') {
    const me = await whoAmI(req);
    if (!me) return res.status(401).json({ error: 'Sign in first.' });
    const on = (req.body || {}).on !== false;
    await db.query(
      on
        ? 'UPDATE members SET subscribed = TRUE, subscribed_at = NOW(), unsubscribed_at = NULL WHERE id = $1'
        : 'UPDATE members SET subscribed = FALSE, unsubscribed_at = NOW() WHERE id = $1',
      [me.id]
    );
    mirror(me.email, { subscribed: on }).catch(() => {});
    return res.json({
      ok: true, subscribed: on,
      message: on
        ? 'You are on the mailing list again — one list, covering both sites.'
        : 'You are off the mailing list, on both sites. Nothing further will arrive from either.'
    });
  }

  /* ---- the one-click link from the foot of an email ---- */
  const token = String((req.query && req.query.t) || '').trim();
  res.setHeader('content-type', 'text/html; charset=utf-8');

  if (!token) {
    return res.status(400).send(page(
      'That link is incomplete',
      'The unsubscribe link did not carry its token, so we cannot tell whom to remove.',
      `<p class="small">Sign in and turn the list off from your account, or write to
       <a href="mailto:shakradragon@gmail.com" style="color:#d7b05a">shakradragon@gmail.com</a> and we will do it by hand.</p>`
    ));
  }

  try {
    const { rows } = await db.query(
      `UPDATE members SET subscribed = FALSE, unsubscribed_at = NOW()
        WHERE unsub_token = $1 RETURNING email, subscribed`, [token]);
    const member = rows[0];
    if (member) mirror(member.email, { subscribed: false }).catch(() => {});

    if (!member) {
      return res.status(404).send(page(
        'That link is no longer valid',
        'We could not find anyone to remove with it — which usually means it has already been used, or the account has been erased.',
        `<p class="small">If list mail is still arriving, write to
         <a href="mailto:shakradragon@gmail.com" style="color:#d7b05a">shakradragon@gmail.com</a> and it will stop.</p>`
      ));
    }

    return res.send(page(
      'You are off the list',
      `<strong style="color:#f3ddaa">${member.email}</strong> will receive no further mailing-list
       letters from EGregoRA. That took effect the moment you opened this page — there is nothing else
       to confirm.`,
      `<p class="small">You will still get the occasional piece of transactional post if you ask for it:
       a sign-in code you requested, or a reply to a letter you sent Ed. Those are answers to you, not
       mailings, so they have no unsubscribe link.</p>
       <p class="small">Changed your mind? Turn it back on from
       <a href="${SITE}/account/" style="color:#d7b05a">your account</a>.</p>`
    ));
  } catch (err) {
    console.error('unsubscribe failed', err && err.message);
    return res.status(500).send(page(
      'Something went wrong',
      'We could not take you off the list just now. Write to <a href="mailto:shakradragon@gmail.com" style="color:#d7b05a">shakradragon@gmail.com</a> and it will be done by hand, today.'
    ));
  }
}
