/**
 * POST /api/checkout — taking money.
 *
 * Three kinds of thing are paid for here, and all three work the same way:
 * the record is written first, then Stripe is asked for a hosted payment page,
 * then the session is attached to the record. So an order exists before a card
 * is anywhere near it, and nothing that was written can be lost if the
 * customer closes the tab halfway.
 *
 *   shop        a product off the shelf, in lib/shelf.js
 *   membership  a recurring tier — Stripe's subscriptions need a fixed amount
 *   donation    a gift, once, at whatever the giver chooses
 *
 * No payment details ever reach this server. Stripe's own page takes the card,
 * and the only thing that comes back is a session id, which is then checked
 * against Stripe rather than believed.
 *
 * With no STRIPE_SECRET_KEY set, this says so plainly and changes nothing —
 * the shop still takes orders the old way, through api/shop.js, and nobody
 * meets a broken card form.
 */
import { db } from 'hatchable';
import { cleanEmail, randomToken } from '../lib/accounts.js';
import { solveCaptcha } from '../lib/captcha.js';
import { api, configured, mode, toPence, CURRENCY, StripeError } from '../lib/stripe.js';
import { applySessionId } from '../lib/payments.js';
import { SHELF, MEMBERSHIP, DONATION, REF_PREFIX, HOUSE_LABEL } from '../lib/shelf.js';

export const access = 'public';
export const methods = ['POST'];

/* Stripe fills this in when it sends the customer back, so the page knows
   which checkout to ask about. */
const SESSION_PLACEHOLDER = '{CHECKOUT_SESSION_ID}';

const KNOWN_HOSTS = [
  'egregora.hatchable.site',
  'the-two-infinities.hatchable.site'
];

/** The address to come back to. Taken from the request, and only if it is one
    of the two houses — a forged Host must not aim a payment at a stranger. */
function siteUrl(req) {
  const host = String((req.headers && (req.headers.host || req.headers.Host)) || '')
    .replace(/[^A-Za-z0-9.\-:]/g, '');
  const safe = KNOWN_HOSTS.indexOf(host) >= 0 ? host : KNOWN_HOSTS[0];
  return 'https://' + safe;
}

function newRef() {
  return REF_PREFIX + '-' + randomToken(4).slice(0, 6).toUpperCase();
}

export default async function (req, res) {
  const body = req.body || {};
  const action = String(body.action || 'checkout').slice(0, 24);

  /* ------------------------------------------------ the customer came back */
  if (action === 'confirm') {
    if (!configured()) return res.json({ ok: true, state: 'awaiting', mode: 'off' });
    try {
      const out = await applySessionId(body.session_id);
      return res.json({ ok: out.ok, state: out.state, ref: out.ref, kind: out.kind });
    } catch (err) {
      const e = err instanceof StripeError ? err : null;
      return res.status(e ? e.status : 502).json({
        ok: false, state: 'unknown',
        error: 'Stripe would not confirm that. The order is safe in the ledger; give it a moment.'
      });
    }
  }

  if (action !== 'checkout') {
    return res.status(400).json({ error: 'Checkout or confirm; that is the whole of its grammar.' });
  }

  if (!configured()) {
    /* Not an error the customer can do anything about, and not a reason to
       lose the order: say what is missing and leave the ledger route open. */
    return res.status(503).json({
      ok: false, not_configured: true,
      error: 'Taking money by card is not switched on at this house yet. ' +
             'The order can still be written down \u2014 use the plain order form.'
    });
  }

  const kind = String(body.kind || 'shop').slice(0, 12);
  const emailAddr = cleanEmail(body.email);
  if (!emailAddr) return res.status(400).json({ error: 'A working email address, for the receipt.' });

  const gate = await solveCaptcha(body.captcha_token, body.captcha);
  if (!gate.ok) return res.status(400).json({ error: gate.error, captcha: true });

  const back = siteUrl(req);
  const to = (page) => back + page + '?session_id=' + encodeURIComponent(SESSION_PLACEHOLDER);
  const from = (page) => back + page;

  try {
    let session;

    /* ------------------------------------------------------- the shop */
    if (kind === 'shop') {
      const key = String(body.key || '').slice(0, 40);
      const item = SHELF[key];
      if (!item) return res.status(400).json({ error: 'That is not on the shelf.' });

      const name = String(body.name || '').trim().slice(0, 80);
      if (name.length < 2) return res.status(400).json({ error: 'A name, so the order has one.' });

      const qty = Math.round(Number(body.qty));
      if (!Number.isFinite(qty) || qty < 1 || qty > 10) {
        return res.status(400).json({ error: 'One to ten of anything; more than that and we should talk first.' });
      }
      const notes = String(body.notes || '').trim().slice(0, 500);

      const { rows: recent } = await db.query(
        `SELECT count(*)::int AS n FROM shop_orders
          WHERE email = $1 AND created_at > NOW() - interval '1 hour'`, [emailAddr]);
      if (recent[0] && recent[0].n >= 5) {
        return res.status(429).json({ error: 'Five checkouts in an hour is plenty. Try again shortly.' });
      }

      const ref = newRef();
      const total = item.price * qty;
      await db.query(
        `INSERT INTO shop_orders (ref, product_key, product_name, qty, unit_price, total,
                                  name, email, notes, payment_state, house)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'awaiting',$10)`,
        [ref, key, item.name, qty, item.price, total, name, emailAddr, notes, HOUSE_LABEL]);

      session = await api('/checkout/sessions', {
        mode: 'payment',
        client_reference_id: ref,
        customer_email: emailAddr,
        success_url: to('/shop/thanks/'),
        cancel_url: from('/shop/'),
        metadata: { kind: 'shop', ref, house: HOUSE_LABEL, product: item.name },
        line_items: [{
          quantity: qty,
          price_data: {
            currency: CURRENCY,
            unit_amount: toPence(item.price),
            product_data: { name: item.name }
          }
        }]
      });

      await db.query('UPDATE shop_orders SET stripe_session = $2 WHERE ref = $1',
        [ref, session.id]);
      return res.json({ ok: true, url: session.url, ref, kind, mode: mode() });
    }

    /* --------------------------------------------------- paid membership */
    if (kind === 'membership') {
      const key = String(body.tier || '').slice(0, 24);
      const tier = MEMBERSHIP[key];
      if (!tier) return res.status(400).json({ error: 'That is not one of the tiers.' });
      const name = String(body.name || '').trim().slice(0, 80);

      await db.query(
        `INSERT INTO memberships (email, name, tier, amount, interval, state, stripe_session)
         VALUES ($1, $2, $3, $4, $5, 'awaiting', NULL)
         ON CONFLICT (email) DO UPDATE
           SET tier = EXCLUDED.tier, amount = EXCLUDED.amount, interval = EXCLUDED.interval,
               name = CASE WHEN EXCLUDED.name = '' THEN memberships.name ELSE EXCLUDED.name END,
               updated_at = NOW()`,
        [emailAddr, name, key, tier.amount, tier.interval]);

      session = await api('/checkout/sessions', {
        mode: 'subscription',
        customer_email: emailAddr,
        success_url: to('/shop/thanks/'),
        cancel_url: from('/membership/'),
        metadata: { kind: 'membership', tier: key, email: emailAddr, house: HOUSE_LABEL },
        subscription_data: { metadata: { kind: 'membership', email: emailAddr, tier: key } },
        line_items: [{
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: toPence(tier.amount),
            recurring: { interval: tier.interval, interval_count: 1 },
            product_data: {
              name: HOUSE_LABEL + ' \u2014 ' + tier.name,
              description: 'Paid membership, billed every ' + tier.interval + '.'
            }
          }
        }]
      });

      await db.query('UPDATE memberships SET stripe_session = $2, stripe_customer = $3 WHERE email = $1',
        [emailAddr, session.id, session.customer || null]);
      return res.json({ ok: true, url: session.url, tier: key, kind, mode: mode() });
    }

    /* -------------------------------------------------------- a gift */
    if (kind === 'donation') {
      const amount = Math.round(Number(body.amount) * 100) / 100;
      if (!Number.isFinite(amount) || amount < DONATION.min || amount > DONATION.max) {
        return res.status(400).json({
          error: 'A gift of between \u00a3' + DONATION.min + ' and \u00a3' + DONATION.max + '.'
        });
      }
      const name = String(body.name || '').trim().slice(0, 80);
      const message = String(body.message || '').trim().slice(0, 500);

      const { rows } = await db.query(
        `INSERT INTO donations (email, name, amount, message, state)
         VALUES ($1, $2, $3, $4, 'awaiting') RETURNING id`,
        [emailAddr, name, amount, message]);

      session = await api('/checkout/sessions', {
        mode: 'payment',
        client_reference_id: 'GIFT-' + rows[0].id,
        customer_email: emailAddr,
        success_url: to('/shop/thanks/'),
        cancel_url: from('/membership/'),
        metadata: { kind: 'donation', gift: String(rows[0].id), house: HOUSE_LABEL },
        line_items: [{
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: toPence(amount),
            product_data: {
              name: 'A gift to ' + HOUSE_LABEL,
              description: message ? 'With a message.' : 'Given freely.'
            }
          }
        }]
      });

      await db.query('UPDATE donations SET stripe_session = $2 WHERE id = $1',
        [rows[0].id, session.id]);
      return res.json({ ok: true, url: session.url, gift: Number(rows[0].id), kind, mode: mode() });
    }

    return res.status(400).json({ error: 'Shop, membership or donation.' });
  } catch (err) {
    const e = err instanceof StripeError ? err : null;
    console.error('checkout:', (e && e.detail) || (err && err.message));
    return res.status(e ? e.status : 502).json({
      ok: false,
      error: e ? e.message : 'The checkout could not be opened. Nothing has been charged.'
    });
  }
}
