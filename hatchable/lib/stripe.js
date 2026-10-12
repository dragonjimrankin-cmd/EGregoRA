/**
 * lib/stripe.js — Stripe, without the SDK.
 *
 * The runtime has fetch and crypto and nothing else to hand, and the SDK is a
 * large dependency for four calls. So this talks to api.stripe.com directly:
 * form-encoded bodies, Bearer auth, and one HMAC where Stripe asks for one.
 *
 * Two things in here are deliberate rather than convenient.
 *
 * First, nothing is ever trusted from an inbound body alone. Webhooks are
 * verified against the shared signing secret when the platform hands over the
 * raw bytes — and when it does not, this refuses rather than re-serialising a
 * parsed object and hoping the bytes match, because they will not. The caller
 * then has a second, better route: ask Stripe for the object by id, with our
 * own secret key. An attacker can name an event; they cannot make Stripe
 * confirm one that did not happen.
 *
 * Second, no key is baked in and no default is invented. With no
 * STRIPE_SECRET_KEY set, configured() is false and the endpoints say plainly
 * that taking money is not switched on, rather than failing halfway through a
 * customer's checkout.
 */
import crypto from 'node:crypto';

const API = 'https://api.stripe.com/v1';

export const SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
export const CURRENCY = process.env.STRIPE_CURRENCY || 'gbp';

/** Are we able to take money at all? */
export function configured() {
  return /^sk_(test|live)_[A-Za-z0-9]{8,}$/.test(SECRET_KEY);
}

/** Test keys are worth knowing about, because test payments are not money. */
export function mode() {
  if (!configured()) return 'off';
  return /^sk_test_/.test(SECRET_KEY) ? 'test' : 'live';
}

/** Pounds to the smallest unit Stripe counts in. Integer, or Stripe refuses. */
export function toPence(pounds) {
  const n = Number(pounds);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

export class StripeError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = 'StripeError';
    this.status = status || 502;
    this.detail = detail || null;
  }
}

/**
 * Flatten { a: { b: 1 } } into the bracket form Stripe wants: a[b]=1.
 * Arrays become indexed keys — line_items[0][quantity]=2 — which is what the
 * API expects, and what an SDK would have done for us.
 */
function flatten(value, prefix, out) {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
    return;
  }
  if (typeof value === 'object') {
    for (const k of Object.keys(value)) {
      flatten(value[k], prefix ? `${prefix}[${k}]` : k, out);
    }
    return;
  }
  out.push([prefix, String(value)]);
}

/**
 * One call to Stripe.
 * @param {string} path  e.g. '/checkout/sessions'
 * @param {object} params  nested; flattened to form encoding
 */
export async function api(path, params = {}, method = 'POST') {
  if (!configured()) throw new StripeError('Taking money is not switched on.', 503);

  const body = [];
  flatten(params, '', body);
  const init = {
    method,
    headers: { authorization: 'Bearer ' + SECRET_KEY }
  };
  if (method !== 'GET' && body.length) {
    init.headers['content-type'] = 'application/x-www-form-urlencoded';
    init.body = new URLSearchParams(body).toString();
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let res;
  try {
    res = await fetch(API + path, Object.assign({ signal: ctrl.signal }, init));
  } catch (err) {
    clearTimeout(timer);
    throw new StripeError('Stripe could not be reached.', 502, err && err.message);
  }
  clearTimeout(timer);

  let data = null;
  try { data = await res.json(); } catch { /* not every response is JSON */ }

  if (!res.ok) {
    const e = (data && data.error) || {};
    throw new StripeError(
      e.message || ('Stripe refused that (' + res.status + ').'),
      res.status >= 500 ? 502 : res.status,
      e.type || null);
  }
  return data;
}

/** Ask Stripe for an object it owns. The answer cannot be forged. */
export async function retrieve(path) {
  return api(path, {}, 'GET');
}

/**
 * Verify a Stripe webhook signature.
 *
 * Needs the exact bytes Stripe signed. Where the platform has already parsed
 * the body into an object, those bytes are gone and re-serialising will not
 * reproduce them — so this says so, rather than quietly comparing against
 * something that happens to look right.
 *
 * @param {string} rawBody    the request body exactly as received
 * @param {string} headerVal  the Stripe-Signature header
 */
export function verifyWebhook(rawBody, headerVal) {
  if (!WEBHOOK_SECRET) return { ok: false, error: 'No webhook secret is set.' };
  if (typeof rawBody !== 'string') {
    return { ok: false, error: 'The raw body was not handed over; the signature cannot be checked.' };
  }

  let t = '';
  const sigs = [];
  for (const part of String(headerVal || '').split(',')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === 't') t = v;
    else if (k === 'v1') sigs.push(v);
  }
  if (!t || !sigs.length) return { ok: false, error: 'No signature to check.' };

  /* Replay window: five minutes either side, as Stripe recommends. */
  const age = Math.abs((Date.now() / 1000) - Number(t));
  if (!Number.isFinite(age) || age > 300) return { ok: false, error: 'That signature is too old.' };

  const want = crypto.createHmac('sha256', WEBHOOK_SECRET)
    .update(t + '.' + rawBody).digest('hex');

  for (const given of sigs) {
    const a = Buffer.from(given);
    const b = Buffer.from(want);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return { ok: true, timestamp: t };
  }
  return { ok: false, error: 'The signature does not match.' };
}

/** Did Stripe tell us the money actually arrived? */
export function isPaid(session) {
  return !!session && session.payment_status === 'paid';
}
