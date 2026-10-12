/**
 * POST /api/stripe-webhook — Stripe telling us what happened.
 *
 * This is the backup door. The front door is api/checkout.js `confirm`, which
 * runs when the customer comes back from paying and asks Stripe directly. This
 * one covers the case where they never come back — they close the tab, their
 * phone dies, a subscription renews a month later.
 *
 * Signature verification here is honest about its limits. Stripe signs the
 * exact bytes it sent, and this platform may hand over a parsed body instead,
 * in which case those bytes are gone and re-serialising will not reproduce
 * them. Rather than compare against something that only looks right, this
 * verifies when it can and — when it cannot — fetches the event from Stripe by
 * id with our own secret key. An attacker can name an event; they cannot make
 * Stripe confirm one that did not happen.
 *
 * Every event is claimed by id before it is acted on, because Stripe retries,
 * and because acting twice on a paid order is worse than acting once late.
 */
import { verifyWebhook, configured, retrieve, StripeError } from '../lib/stripe.js';
import { claimEvent, applySession, applySessionId, applySubscriptionId } from '../lib/payments.js';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  if (!configured()) {
    return res.status(503).json({ ok: false, error: 'Taking money is not switched on.' });
  }

  const raw = typeof req.body === 'string' ? req.body : null;
  const header = (req.headers && (req.headers['stripe-signature'] ||
    req.headers['Stripe-Signature'])) || '';

  let event = null;
  let trusted = false;

  if (raw) {
    const v = verifyWebhook(raw, header);
    if (!v.ok) return res.status(400).json({ ok: false, error: v.error });
    trusted = true;
    try { event = JSON.parse(raw); }
    catch { return res.status(400).json({ ok: false, error: 'That is not JSON.' }); }
  } else {
    /* No raw bytes, so no signature to check. Take the id and ask Stripe. */
    const id = String((req.body && req.body.id) || '')
      .replace(/[^A-Za-z0-9_]/g, '');
    if (!/^evt_/.test(id)) {
      return res.status(400).json({ ok: false, error: 'No verifiable event to act on.' });
    }
    try {
      event = await retrieve('/events/' + encodeURIComponent(id));
      trusted = true;   /* fetched with our own key: as good as verified */
    } catch (err) {
      const e = err instanceof StripeError ? err : null;
      return res.status(e ? e.status : 502).json({
        ok: false, error: 'Stripe would not confirm that event.'
      });
    }
  }

  if (!trusted || !event || !event.id) {
    return res.status(400).json({ ok: false, error: 'Nothing to act on.' });
  }

  const type = String(event.type || '');
  const obj = (event.data && event.data.object) || {};

  /* Stripe's retries are expected, not exceptional. A repeat is acknowledged
     and dropped, which is the whole reason the ledger of handled events exists. */
  const fresh = await claimEvent(event.id, type);
  if (!fresh) return res.json({ ok: true, duplicate: true, type });

  try {
    switch (type) {
      /* Money arrived, however it arrived. */
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
      case 'payment_intent.succeeded': {
        if (obj.object === 'payment_intent') {
          /* Reached only for a payment made outside Checkout; the session
             events above cover the shop, membership and gifts. */
          return res.json({ ok: true, type, noted: true });
        }
        /* Read the session back from Stripe rather than using the copy in the
           event, so a stale or doctored object cannot mark anything paid. */
        const out = await applySessionId(obj.id);
        return res.json({ ok: true, type, state: out.state });
      }

      case 'checkout.session.expired': {
        return res.json({ ok: true, type, state: 'expired' });
      }

      /* A subscription's life after its first payment. */
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const out = await applySubscriptionId(obj.id);
        return res.json({ ok: true, type, state: out.state });
      }

      case 'invoice.payment_failed': {
        const subId = obj.subscription;
        if (subId) await applySubscriptionId(subId);
        return res.json({ ok: true, type, state: 'past_due' });
      }

      default:
        /* Acknowledged and ignored. Stripe will keep sending events this house
           has no use for, and a 400 would only make it retry them. */
        return res.json({ ok: true, type, ignored: true });
    }
  } catch (err) {
    const e = err instanceof StripeError ? err : null;
    console.error('stripe-webhook ' + type + ':', (e && e.detail) || (err && err.message));
    /* 500, so Stripe retries: a failed handler must not look like success. */
    return res.status(500).json({ ok: false, error: 'The ledger did not take that.' });
  }
}
