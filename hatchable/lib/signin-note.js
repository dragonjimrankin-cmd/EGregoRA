/**
 * The sign-in ledger and its post.
 *
 * Every successful sign-in is written to the signins table, and a note goes
 * to the order's address so the founders always know when a member comes
 * through the door. Neither may fail the sign-in itself: a member who has
 * proved themselves must not be turned away because the postbox jammed.
 */
import { db, email } from 'hatchable';
import { CONTACT } from './mailing.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function noteSignin(member, how) {
  const addr = member && member.email;
  if (!addr) return;

  try {
    await db.query(
      'INSERT INTO signins (email, name, how) VALUES ($1, $2, $3)',
      [addr, (member.name || ''), how]);
  } catch (e) {
    console.error('signin log failed', e && e.message);
  }

  try {
    const when = new Date().toUTCString();
    await email.send({
      to: CONTACT,
      subject: 'Sign-in on EGregoRA \u2014 ' + addr,
      text: 'A member signed in to EGregoRA.\n\nWho: ' + (member.name || '(no name kept)') +
        ' <' + addr + '>\nHow: ' + how + '\nWhen: ' + when + '\n\nThis note is sent by the ' +
        'machinery on every sign-in, and the sign-in is also written to the ledger.',
      html: '<p>A member signed in to <strong>EGregoRA</strong>.</p>' +
        '<ul><li><strong>Who:</strong> ' + esc(member.name || '(no name kept)') +
        ' &lt;' + esc(addr) + '&gt;</li>' +
        '<li><strong>How:</strong> ' + esc(how) + '</li>' +
        '<li><strong>When:</strong> ' + esc(when) + '</li></ul>' +
        '<p style="color:#777;font-size:12px">Sent by the machinery on every sign-in; ' +
        'the sign-in is also written to the ledger.</p>'
    });
  } catch (e) {
    console.error('signin email failed', e && e.message);
  }
}
