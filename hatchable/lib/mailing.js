/**
 * The order's mailing list.
 *
 * Everyone who confirms an address is put on it, and told so in the first
 * letter rather than discovering it later. Every list email carries the way
 * out at the foot: a one-click link with a token unique to that member, which
 * needs no sign-in and no reason given. Transactional post — codes, letter
 * acknowledgements — is not list mail and carries no footer, because you
 * cannot unsubscribe from a reply to your own letter.
 */
import { db, email } from 'hatchable';
import { randomToken } from './accounts.js';

export const SITE = 'https://egregora.hatchable.site';
export const FROM_NAME = 'EGregoRA';

/**
 * The order's address. One constant, used by every letter the site sends.
 *
 * Note what this does and does not control. Hatchable's `email.send` takes
 * `{ to, subject, html, text }` and nothing else — the envelope sender is set
 * by the platform's own SMTP relay, not by this project, so no line of code
 * here can change the address an email appears to come FROM. What it can do,
 * and now does, is say the correct address plainly inside every letter, so a
 * reader always knows where to write even if the From line shows the account
 * the project is hosted under.
 */
export const CONTACT = 'shakradragon@gmail.com';
export const CONTACT_LINK =
  `<a href="mailto:${CONTACT}" style="color:#d7b05a">${CONTACT}</a>`;

/** Every member needs a stable token before they can be mailed. */
export async function unsubToken(member) {
  if (member && member.unsub_token) return member.unsub_token;
  const token = randomToken(16);
  await db.query(
    'UPDATE members SET unsub_token = COALESCE(unsub_token, $1) WHERE id = $2',
    [token, member.id]
  );
  const { rows } = await db.query('SELECT unsub_token FROM members WHERE id = $1', [member.id]);
  return (rows[0] && rows[0].unsub_token) || token;
}

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The foot of every list email. Plain, findable, and honest about the list. */
export function listFooter(addr, token) {
  const out = `${SITE}/api/unsubscribe?t=${encodeURIComponent(token)}`;
  return `
  <tr><td style="padding:0 30px 26px;text-align:center;color:#6f6855;font-size:11.5px;line-height:1.75">
    <hr style="border:0;border-top:1px solid rgba(215,176,90,.18);margin:0 0 14px">
    You are receiving this because <strong style="color:#9f947a">${esc(addr)}</strong> is on the EGregoRA
    mailing list &mdash; you were added when you confirmed this address, and you were told so at the time.
    <br><br>
    <a href="${out}" style="color:#d7b05a;text-decoration:underline">Unsubscribe from the mailing list</a>
    &nbsp;&middot;&nbsp;
    <a href="${SITE}/account/" style="color:#d7b05a;text-decoration:underline">Your account</a>
    <br><br>
    One click removes you at once. No reason is asked for, no confirmation page argues with you, and no
    further list mail is sent. You keep your account, and everything on the site stays open to you either
    way. If the link will not open, copy this address into your browser:<br>
    <span style="color:#5d5747;word-break:break-all">${out}</span>
    <br><br>
    EGregoRA &middot; co-founded by Edward Gregory and Jim Rankin &middot;
    <a href="${SITE}" style="color:#6f6855">egregora.hatchable.site</a>
    <br>Write to the order at ${CONTACT_LINK} &mdash; that address reaches us, whatever
    this letter was sent from.
  </td></tr>`;
}

/** Wrap body HTML in the house letter, with the unsubscribe foot attached. */
export function listLetter({ title, body, addr, token }) {
  return `<!doctype html><html><body style="margin:0;background:#0a090e;padding:28px 12px;
    font-family:Georgia,'EB Garamond',serif;color:#cbbb93">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;background:#100e16;
      border:1px solid rgba(215,176,90,.38);border-radius:4px" cellpadding="0" cellspacing="0">
      <tr><td style="padding:26px 30px 10px;text-align:center">
        <div style="font-size:26px;color:#d7b05a;letter-spacing:.3em">&#10022;</div>
        <div style="letter-spacing:.34em;color:#f3ddaa;font-size:15px;text-transform:uppercase;
          margin-top:10px">EGregoRA</div>
        <div style="color:#9f947a;font-size:12px;letter-spacing:.22em;margin-top:6px">LIFE, LOVE, MAGIC.</div>
      </td></tr>
      <tr><td style="padding:4px 30px 0"><hr style="border:0;border-top:1px solid rgba(215,176,90,.22)"></td></tr>
      <tr><td style="padding:18px 30px 24px;font-size:16px;line-height:1.62">
        ${title ? `<h2 style="font-family:Georgia,serif;color:#f3ddaa;margin:0 0 14px;font-size:20px">${esc(title)}</h2>` : ''}
        ${body}
      </td></tr>
      ${listFooter(addr, token)}
    </table>
  </td></tr></table>
</body></html>`;
}

/** The letter that goes out the moment someone joins the order. */
export async function sendWelcome(member) {
  if (!member || member.welcomed) return false;
  const token = await unsubToken(member);
  const first = String(member.name || '').trim().split(/\s+/)[0];

  const body = `
    <p style="margin:0 0 14px">${first ? esc(first) + ',' : 'Welcome,'}</p>
    <p style="margin:0 0 14px">Your address is confirmed and you are a member of EGregoRA. There is no
    rank attached to that, no fee, and no teaching withheld from anyone who is not &mdash; every page on
    the site stays open to everybody. What an account changes is small and practical: the oracle knows
    your name, keeps the thread of what you have asked, and can open the image and video studio once your
    age is checked.</p>
    <p style="margin:0 0 14px"><strong style="color:#f3ddaa">You have also been added to the mailing
    list</strong>, which is the only thing we will do with this address without asking again. It carries
    new pages, the podcast when there is one, and the occasional long letter when Ed has something worth
    the postage. It is not weekly and it is never a newsletter about newsletters. The way off it is at the
    foot of this and every other list email, and takes one click.</p>
    <p style="margin:0 0 10px"><strong style="color:#f3ddaa">Worth your first hour:</strong></p>
    <ul style="margin:0 0 14px;padding-left:20px;color:#cbbb93">
      <li style="margin-bottom:6px"><a href="${SITE}/ask-ed/" style="color:#d7b05a">The oracle</a> &mdash;
      1,280 written answers, graded by how well they are evidenced, and a fox who reads them aloud.</li>
      <li style="margin-bottom:6px"><a href="${SITE}/infographics/" style="color:#d7b05a">The plates</a>
      &mdash; one idea to a page, drawn as live vector art.</li>
      <li style="margin-bottom:6px"><a href="${SITE}/cosmic-aether/" style="color:#d7b05a">The cosmic
      aether</a> &mdash; why only one clause of the old idea was struck out, and the rest stands.</li>
      <li><a href="${SITE}/occult/" style="color:#d7b05a">The Occult</a> &mdash; including the part most
      orders will not print about stolen runes and industrial atrocity.</li>
    </ul>
    <p style="margin:0 0 14px">Test everything kindly. If an answer cannot survive your scepticism, it
    does not deserve your belief &mdash; ours included.</p>
    <p style="margin:0;color:#9f947a">&mdash; The order</p>`;

  try {
    await email.send({
      to: member.email,
      subject: 'You are in \u2014 EGregoRA',
      html: listLetter({ title: 'Welcome to the order', body, addr: member.email, token })
    });
    await db.query('UPDATE members SET welcomed = TRUE, subscribed_at = COALESCE(subscribed_at, NOW()) WHERE id = $1',
      [member.id]);
    return true;
  } catch (err) {
    console.error('welcome failed', err && err.message);
    return false;
  }
}

/**
 * Send a dispatch to the whole list, in small batches so one bad address
 * cannot stop the rest.
 * @returns {Promise<{sent:number, failed:number, total:number}>}
 */
export async function sendDispatch({ subject, title, body, only }) {
  const where = only ? 'AND email = $1' : '';
  const args = only ? [only] : [];
  const { rows } = await db.query(
    `SELECT id, email, name, unsub_token FROM members
      WHERE subscribed = TRUE AND verified = TRUE ${where} ORDER BY id`, args);

  let sent = 0, failed = 0;
  for (const member of rows) {
    try {
      const token = await unsubToken(member);
      await email.send({
        to: member.email,
        subject,
        html: listLetter({ title: title || subject, body, addr: member.email, token })
      });
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error('dispatch to ' + member.email + ' failed', err && err.message);
    }
  }
  return { sent, failed, total: rows.length };
}
