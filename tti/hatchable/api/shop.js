/**
 * POST /api/shop — the shop's ledger.
 *
 * One action: `order`. The product line is validated against the shelf in
 * lib/shelf.js, the gate-word is checked, the order is written to the database
 * so it cannot be lost, and a copy goes to the order's address.
 *
 * This is the written-down route, and it stays: a customer who would rather
 * not put a card into a form, or whose card is refused, still gets an order
 * into the ledger. api/checkout.js is the other door, and it writes to the
 * same table with payment_state = 'awaiting' before Stripe is asked for
 * anything — so both doors land in one place.
 *
 * The email is allowed to fail without failing the request: an order safely
 * stored is the thing that matters.
 */
import { db, email } from 'hatchable';
import { cleanEmail, randomToken } from '../lib/accounts.js';
import { solveCaptcha } from '../lib/captcha.js';
import { SHELF, REF_PREFIX, ORDER_TO, SHOP_TITLE, SHOP_LINE } from '../lib/shelf.js';

export const access = 'public';
export const methods = ['POST'];

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function orderEmailHtml(o) {
  return `<!doctype html><html><body style="margin:0;background:#05070f;padding:28px 12px;
    font-family:Georgia,'EB Garamond',serif;color:#a9b6d8">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;background:#070b1a;
      border:1px solid rgba(118,207,238,.35);border-radius:4px" cellpadding="0" cellspacing="0">
      <tr><td style="padding:26px 30px 10px;text-align:center">
        <div style="font-family:Georgia,serif;letter-spacing:.34em;color:#cdefff;font-size:15px;
          text-transform:uppercase">${esc(SHOP_TITLE)}</div>
        <div style="color:#76cfee;font-size:13px;margin-top:6px">A new order is written to the ledger</div>
      </td></tr>
      <tr><td style="padding:16px 30px 6px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="font-size:15px;line-height:1.6">
          <tr><td style="color:#76cfee;padding:4px 0">Reference</td>
              <td align="right" style="color:#e7edff;font-family:monospace">${esc(o.ref)}</td></tr>
          <tr><td style="color:#76cfee;padding:4px 0">Item</td>
              <td align="right">${esc(o.item)} &times; ${esc(o.qty)}</td></tr>
          <tr><td style="color:#76cfee;padding:4px 0">Total</td>
              <td align="right">&#163;${esc(o.total)}</td></tr>
          <tr><td style="color:#76cfee;padding:4px 0">Name</td>
              <td align="right">${esc(o.name)}</td></tr>
          <tr><td style="color:#76cfee;padding:4px 0">Email</td>
              <td align="right" style="word-break:break-all">${esc(o.email)}</td></tr>
          ${o.notes ? `<tr><td style="color:#76cfee;padding:4px 0;vertical-align:top">Notes</td>
              <td align="right" style="text-align:left;max-width:300px">${esc(o.notes)}</td></tr>` : ''}
        </table>
      </td></tr>
      <tr><td style="padding:14px 30px 26px;font-size:13px;color:#8f9cc0">
        ${esc(SHOP_LINE)} Nothing has been charged here; if the card route was not used,
        the confirmation goes out by hand.
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export default async function (req, res) {
  const body = req.body || {};
  const action = String(body.action || 'order').slice(0, 24);

  if (action !== 'order') {
    return res.status(400).json({ error: 'The shop takes orders; that is the whole of its grammar.' });
  }

  const key = String(body.key || '').slice(0, 40);
  const item = SHELF[key];
  if (!item) {
    const n = Object.keys(SHELF).length;
    return res.status(400).json({ error: 'That is not on the shelf. ' + n + ' things are; check the page.' });
  }

  const name = String(body.name || '').trim().slice(0, 80);
  if (name.length < 2) return res.status(400).json({ error: 'A name, so the order has one.' });

  const emailAddr = cleanEmail(body.email);
  if (!emailAddr) return res.status(400).json({ error: 'A working email address, or the order cannot find you back.' });

  const qty = Math.round(Number(body.qty));
  if (!Number.isFinite(qty) || qty < 1 || qty > 10) {
    return res.status(400).json({ error: 'One to ten of anything; more than that and we should talk first.' });
  }

  const notes = String(body.notes || '').trim().slice(0, 500);

  const gate = await solveCaptcha(body.captcha_token, body.captcha);
  if (!gate.ok) return res.status(400).json({ error: gate.error, captcha: true });

  try {
    const { rows: recent } = await db.query(
      `SELECT count(*)::int AS n FROM shop_orders WHERE email = $1 AND created_at > NOW() - interval '1 hour'`,
      [emailAddr]
    );
    if (recent[0] && recent[0].n >= 3) {
      return res.status(429).json({ error: 'Three orders in an hour is plenty. The ledger will have the rest.' });
    }

    const ref = REF_PREFIX + '-' + randomToken(4).slice(0, 6).toUpperCase();
    const total = item.price * qty;
    const { rows } = await db.query(
      `INSERT INTO shop_orders (ref, product_key, product_name, qty, unit_price, total,
                                name, email, notes, payment_state, house)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'awaiting',$10) RETURNING ref`,
      [ref, key, item.name, qty, item.price, total, name, emailAddr, notes, REF_PREFIX]
    );

    try {
      await email({
        to: ORDER_TO,
        subject: `The shop \u2014 order ${ref}: ${item.name} x${qty} (${name})`,
        html: orderEmailHtml({
          ref: rows[0].ref, item: item.name, qty, total, name, email: emailAddr, notes
        })
      });
    } catch (err) {
      console.error('shop: the order email failed (the order is stored)', err && err.message);
    }

    return res.json({ ok: true, ref: rows[0].ref });
  } catch (err) {
    console.error('shop: the ledger could not be written', err && err.message);
    return res.status(500).json({ error: 'The ledger could not be written. The order was not lost; try once more.' });
  }
}
