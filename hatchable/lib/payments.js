/**
 * lib/payments.js — what happens when money arrives.
 *
 * There are two doors in: the page a customer lands on after paying, and
 * Stripe's webhook. Both end up here, and both are answered from a session
 * fetched from Stripe with our own key rather than from anything the caller
 * asserts — because the success page is a URL in a browser, and anyone can
 * type one.
 *
 * Everything here is idempotent. Stripe retries, customers hit back, and
 * webhooks are delivered more than once by design; a second pass must be a
 * no-op, not a second paid order.
 */
import { db, email } from 'hatchable';
import { retrieve } from './stripe.js';
import { ORDER_TO, HOUSE_LABEL } from './shelf.js';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const pounds = (pence) => (Number(pence || 0) / 100).toFixed(2);

/**
 * Remember an event by its id. Returns true only the first time, so a repeat
 * delivery can be acknowledged without acting on it twice.
 */
export async function claimEvent(id, type) {
  if (!id) return false;
  try {
    const { rows } = await db.query(
      `INSERT INTO stripe_events (id, type) VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING RETURNING id`, [String(id), String(type || '')]);
    return !!(rows && rows[0]);
  } catch (err) {
    console.error('payments: could not claim event', err && err.message);
    return false;
  }
}

async function note(subject, lines) {
  try {
    await email({
      to: ORDER_TO,
      subject: HOUSE_LABEL + ' \u2014 ' + subject,
      html: '<!doctype html><html><body style="margin:0;background:#05070f;padding:24px;' +
        'font-family:Georgia,serif;color:#c9d2ee"><h2 style="color:#fff;font-weight:normal;' +
        'letter-spacing:.14em;font-size:16px">' + esc(subject) + '</h2><table cellpadding="3"' +
        ' style="font-size:14px">' +
        lines.map((l) => '<tr><td style="color:#8f9cc0">' + esc(l[0]) +
          '</td><td style="color:#eef2ff">' + esc(l[1]) + '</td></tr>').join('') +
        '</table></body></html>'
    });
  } catch (err) {
    console.error('payments: the note failed (the record is written)', err && err.message);
  }
}

/**
 * Fetch a checkout session from Stripe and act on what Stripe says about it.
 *
 * @param {string} sessionId
 * @returns {Promise<{ok:boolean, state:string, ref?:string, kind?:string}>}
 */
export async function applySessionId(sessionId) {
  const id = String(sessionId || '').replace(/[^A-Za-z0-9_]/g, '');
  if (!/^cs_(test|live)_/.test(id)) return { ok: false, state: 'unknown', error: 'That is not a checkout.' };

  const session = await retrieve('/checkout/sessions/' + encodeURIComponent(id));
  return applySession(session);
}

/**
 * Record a session as settled. Called with a session fetched from Stripe, never
 * with one from a request body.
 */
export async function applySession(session) {
  if (!session || !session.id) return { ok: false, state: 'unknown' };
  const meta = session.metadata || {};
  const kind = String(meta.kind || 'shop');
  const paid = session.payment_status === 'paid';
  const total = pounds(session.amount_total);

  if (kind === 'membership') {
    const emailAddr = String(session.customer_details && session.customer_details.email ||
      meta.email || '').toLowerCase().trim();
    if (!emailAddr) return { ok: false, state: 'unknown' };
    /* A subscription settles on its first invoice; the subscription event
       carries the period, so read that rather than guessing a month. */
    let periodEnd = null;
    if (session.subscription) {
      try {
        const sub = await retrieve('/subscriptions/' + encodeURIComponent(session.subscription));
        periodEnd = sub && sub.current_period_end
          ? new Date(Number(sub.current_period_end) * 1000).toISOString() : null;
        await setSubscription(sub);
      } catch (err) {
        console.error('payments: could not read the subscription', err && err.message);
      }
    }
    if (paid) {
      await db.query(
        `UPDATE memberships SET state = 'active', stripe_session = $2,
             stripe_customer = $3, period_end = COALESCE($4, period_end),
             amount = $5, updated_at = NOW()
           WHERE email = $1`,
        [emailAddr, session.id, session.customer || null, periodEnd, total]);
      await note('Membership paid: ' + (meta.tier || '') + ' \u00a3' + total, [
        ['Member', emailAddr],
        ['Tier', meta.tier || ''],
        ['Amount', '\u00a3' + total],
        ['Session', session.id]
      ]);
    }
    return { ok: true, state: paid ? 'active' : 'awaiting', kind };
  }

  if (kind === 'donation') {
    const { rows } = await db.query(
      `UPDATE donations SET state = $2, paid_at = NOW(), stripe_intent = $3, amount_paid = $4
         WHERE stripe_session = $1
         RETURNING email, amount`, [session.id, paid ? 'paid' : 'awaiting',
        session.payment_intent || null, total]);
    if (paid && rows[0]) {
      await note('A gift of \u00a3' + total, [
        ['From', rows[0].email], ['Amount', '\u00a3' + total], ['Session', session.id]]);
    }
    return { ok: true, state: paid ? 'paid' : 'awaiting', kind };
  }

  /* The shop. Marked paid only where Stripe says paid; a session that is still
     open, or was abandoned, leaves the order awaiting. */
  const { rows } = await db.query(
    `UPDATE shop_orders
        SET payment_state = CASE WHEN $2 THEN 'paid' ELSE payment_state END,
            paid_at       = CASE WHEN $2 THEN NOW() ELSE paid_at END,
            stripe_intent = COALESCE($3, stripe_intent),
            amount_paid   = CASE WHEN $2 THEN $4 ELSE amount_paid END
      WHERE stripe_session = $1
      RETURNING ref, product_name, qty, email`,
    [session.id, paid, session.payment_intent || null, total]);

  /* No row matched, so nothing was paid — whatever Stripe says about a session
     this house has no record of. Answering 'paid' here would tell a browser
     that a stranger's session id was a confirmed order. */
  if (!rows[0]) return { ok: false, state: 'unknown', kind };

  if (paid) {
    await note('Paid: order ' + rows[0].ref, [
      ['Order', rows[0].ref],
      ['Item', rows[0].product_name + ' \u00d7 ' + rows[0].qty],
      ['Amount', '\u00a3' + total],
      ['Email', rows[0].email],
      ['Session', session.id]
    ]);
  }
  return { ok: true, state: paid ? 'paid' : 'awaiting', ref: rows[0].ref, kind };
}

/** Bring a membership in line with what Stripe says about its subscription. */
export async function setSubscription(sub) {
  if (!sub || !sub.id) return;
  const emailAddr = String((sub.metadata && sub.metadata.email) || '').toLowerCase().trim();
  const status = String(sub.status || '');
  /* Stripe's own statuses, mapped onto the three this ledger keeps. */
  const state = (status === 'active' || status === 'trialing') ? 'active'
    : (status === 'past_due' || status === 'unpaid') ? 'past_due'
      : (status === 'canceled' || status === 'incomplete_expired') ? 'cancelled' : 'awaiting';
  const periodEnd = sub.current_period_end
    ? new Date(Number(sub.current_period_end) * 1000).toISOString() : null;

  if (emailAddr) {
    await db.query(
      `UPDATE memberships SET state = $2, period_end = $3, stripe_sub = $4, updated_at = NOW()
         WHERE email = $1`, [emailAddr, state, periodEnd, sub.id]);
  } else {
    await db.query(
      `UPDATE memberships SET state = $2, period_end = $3, updated_at = NOW()
         WHERE stripe_sub = $1`, [sub.id, state, periodEnd]);
  }
}

/** Fetch a subscription from Stripe and apply it. */
export async function applySubscriptionId(subId) {
  const id = String(subId || '').replace(/[^A-Za-z0-9_]/g, '');
  if (!/^sub_/.test(id)) return { ok: false };
  const sub = await retrieve('/subscriptions/' + encodeURIComponent(id));
  await setSubscription(sub);
  return { ok: true, state: sub.status };
}
