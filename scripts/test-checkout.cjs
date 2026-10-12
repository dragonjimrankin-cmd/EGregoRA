/* Taking money, driven through the real lib/stripe.js, lib/payments.js,
   api/checkout.js and api/stripe-webhook.js.

   The five things here are the five that would actually go wrong:
     · the form encoding Stripe insists on — get it wrong and every payment fails
     · the webhook signature — get it wrong and anyone can claim an order paid
     · an order is marked paid only when Stripe says so
     · with no key set, the shop still works and says plainly that cards do not
     · a repeated event is a no-op, because Stripe retries
*/
const fs = require("fs");
const crypto = require("crypto");

let fails = 0;
const check = (ok, label, extra) => {
  console.log((ok ? "PASS " : "FAIL ") + label + (extra ? "  \u2014 " + extra : ""));
  if (!ok) fails++;
};

/* Load a module with its imports stripped and its dependencies stood in. */
function load(path, prelude, tail) {
  let s = fs.readFileSync(path, "utf8")
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?$/gm, "")
    .replace(/^export const /gm, "const ")
    .replace(/^export class /gm, "class ")
    .replace(/^export async function /gm, "async function ")
    .replace(/^export function /gm, "function ")
    .replace(/^export default async function/m, "const handler = async function");
  s += "\nmodule.exports = { " + tail + " };\n";
  const mod = { exports: null };
  new Function("module", "require", prelude + "\n" + s)(mod, require);
  return mod.exports;
}

/* ------------------------------------------------------------------ ledger */
/* The ledger. Written with indexOf rather than regexes: this block is a
   template literal, and JS turns \$2 into $2 inside one, which quietly turns
   /SET state = \$2/ into a regex that can never match. indexOf has no escape
   semantics to get wrong. */
const LEDGER = [
  "const TABLES = { shop_orders: [], memberships: [], donations: [], stripe_events: [] };",
  "const SEEN = [];",
  "const SENT = [];",
  "const db = { query: async (sql, args) => {",
  "  const q = sql.replace(/\\s+/g, ' ').trim();",
  "  SEEN.push(q);",
  "  const at = (frag) => q.indexOf(frag) >= 0;",
  "  if (at('INSERT INTO shop_orders')) {",
  "    TABLES.shop_orders.push({ ref: args[0], product_key: args[1], product_name: args[2],",
  "      qty: args[3], unit_price: args[4], total: args[5], name: args[6], email: args[7],",
  "      notes: args[8], payment_state: 'awaiting', house: args[9], stripe_session: null });",
  "    return { rows: [{ ref: args[0] }] }; }",
  "  if (at('SELECT count(*)::int AS n FROM shop_orders')) return { rows: [{ n: 0 }] };",
  "  if (at('UPDATE shop_orders SET stripe_session')) {",
  "    const r = TABLES.shop_orders.find(x => x.ref === args[0]);",
  "    if (r) r.stripe_session = args[1];",
  "    return { rows: [] }; }",
  "  if (at('UPDATE shop_orders SET payment_state')) {",
  "    const r = TABLES.shop_orders.find(x => x.stripe_session === args[0]);",
  "    if (!r) return { rows: [] };",
  "    if (args[1]) { r.payment_state = 'paid'; r.paid_at = 'now'; }",
  "    r.stripe_intent = args[2]; r.amount_paid = args[3];",
  "    return { rows: [{ ref: r.ref, product_name: r.product_name, qty: r.qty, email: r.email }] }; }",
  "  if (at('INSERT INTO donations')) {",
  "    const row = { id: TABLES.donations.length + 1, email: args[0], name: args[1],",
  "      amount: args[2], message: args[3], state: 'awaiting', stripe_session: null };",
  "    TABLES.donations.push(row); return { rows: [row] }; }",
  "  if (at('UPDATE donations SET stripe_session')) {",
  "    const r = TABLES.donations.find(x => x.id === args[0]); if (r) r.stripe_session = args[1];",
  "    return { rows: [] }; }",
  "  if (at('UPDATE donations SET state')) {",
  "    const r = TABLES.donations.find(x => x.stripe_session === args[0]);",
  "    if (!r) return { rows: [] };",
  "    r.state = args[1]; r.amount_paid = args[3];",
  "    return { rows: [{ email: r.email, amount: r.amount }] }; }",
  "  if (at('INSERT INTO memberships')) {",
  "    const ex = TABLES.memberships.find(m => m.email === args[0]);",
  "    if (ex) { ex.tier = args[2]; ex.amount = args[3]; return { rows: [] }; }",
  "    TABLES.memberships.push({ email: args[0], name: args[1], tier: args[2], amount: args[3],",
  "      interval: args[4], state: 'awaiting', stripe_session: null });",
  "    return { rows: [] }; }",
  "  if (at('UPDATE memberships SET stripe_session')) {",
  "    const r = TABLES.memberships.find(x => x.email === args[0]); if (r) r.stripe_session = args[1];",
  "    return { rows: [] }; }",
  /* Three different UPDATEs with three different parameter orders. Matching
     them loosely is what once made this stub report a session id as a state. */
  "  if (at(\"UPDATE memberships SET state = 'active'\")) {",
  "    const r = TABLES.memberships.find(x => x.email === args[0]);",
  "    if (r) { r.state = 'active'; r.stripe_session = args[1]; r.stripe_customer = args[2];",
  "      r.period_end = args[3]; r.amount = args[4]; }",
  "    return { rows: [] }; }",
  "  if (at('stripe_sub = $4')) {",
  "    const r = TABLES.memberships.find(x => x.email === args[0]);",
  "    if (r) { r.state = args[1]; r.period_end = args[2]; r.stripe_sub = args[3]; }",
  "    return { rows: [] }; }",
  "  if (at('WHERE stripe_sub = $1')) {",
  "    const r = TABLES.memberships.find(x => x.stripe_sub === args[0]);",
  "    if (r) { r.state = args[1]; r.period_end = args[2]; }",
  "    return { rows: [] }; }",
  "  if (at('INSERT INTO stripe_events')) {",
  "    if (TABLES.stripe_events.some(e => e.id === args[0])) return { rows: [] };",
  "    TABLES.stripe_events.push({ id: args[0], type: args[1] }); return { rows: [{ id: args[0] }] }; }",
  "  return { rows: [] };",
  "} };",
  "const email = async (m) => { SENT.push(m); };",
  "globalThis.__T = TABLES; globalThis.__SEEN = SEEN; globalThis.__SENT = SENT;",
].join("\n");

/* ----------------------------------------------------------------- Stripe */
const CALLS = [];
let NEXT_SESSION = null;
const stripePrelude = (env) => `
const crypto = require('node:crypto');
process.env.STRIPE_SECRET_KEY = ${JSON.stringify(env.key || "")};
process.env.STRIPE_WEBHOOK_SECRET = ${JSON.stringify(env.whsec || "")};
const CALLS = globalThis.__CALLS;
const NEXT = () => globalThis.__NEXT();
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  CALLS.push({ url: u, method: (opts && opts.method) || 'GET',
    body: opts && opts.body ? String(opts.body) : '', auth: opts && opts.headers && opts.headers.authorization });
  if (/\\/checkout\\/sessions$/.test(u) && ((opts || {}).method || 'GET') === 'POST') {
    return { ok: true, status: 200, json: async () => NEXT() };
  }
  if (/\\/checkout\\/sessions\\//.test(u)) return { ok: true, status: 200, json: async () => NEXT() };
  if (/\\/events\\//.test(u)) return { ok: true, status: 200, json: async () => NEXT() };
  return { ok: false, status: 400, json: async () => ({ error: { message: 'no such thing' } }) };
};
`;
globalThis.__CALLS = CALLS;
globalThis.__NEXT = () => NEXT_SESSION;

const loadStripe = (env) => load("hatchable/lib/stripe.js", stripePrelude(env),
  "configured, mode, toPence, api, verifyWebhook, StripeError, SECRET_KEY");

/* --------------------------------------------------------------- checkout */
function loadCheckout(stripe, payments) {
  const prelude = LEDGER + `
const configured = () => ${JSON.stringify(stripe.configured)};
const mode = () => 'test';
const CURRENCY = 'gbp';
const toPence = (p) => Math.round(Number(p) * 100);
class StripeError extends Error { constructor(m, s, d) { super(m); this.status = s || 502; this.detail = d; } }
const api = async (path, params) => { globalThis.__CALLS.push({ path, params }); return globalThis.__NEXT(); };
const cleanEmail = (v) => { const s = String(v || '').trim().toLowerCase();
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(s) ? s : ''; };
const randomToken = (n) => 'abcd1234'.slice(0, n * 2);
const solveCaptcha = async () => ({ ok: true });
const applySessionId = async (id) => globalThis.__PAY.applySessionId(id);
const SHELF = { 'fox-figure': { name: 'The Fox', price: 25 }, 'fox-pin': { name: 'Fox Enamel Pin', price: 12 } };
const MEMBERSHIP = { member: { name: 'Member', amount: 5, interval: 'month' } };
const DONATION = { min: 1, max: 5000 };
const REF_PREFIX = 'EG'; const HOUSE_LABEL = 'EGregoRA';
`;
  return load("hatchable/api/checkout.js", prelude, "handler").handler;
}

/* ------------------------------------------------------------------ run */
(async () => {
  /* ============================ 1. with no key, which is today's reality */
  const off = loadStripe({});
  check(off.configured() === false, "with no STRIPE_SECRET_KEY the shop is simply not taking cards");
  check(off.mode() === "off", "and says so rather than guessing a mode", off.mode());

  /* A live-looking key must be recognised, and a stray string must not be. */
  const live = loadStripe({ key: "sk_live_" + "a".repeat(24) });
  check(live.configured() === true && live.mode() === "live", "a live key is recognised as live");
  const bogus = loadStripe({ key: "not-a-key" });
  check(bogus.configured() === false, "a stray string is not accepted as a key");

  /* ============================================== 2. pounds to pence */
  check(off.toPence(18) === 1800 && off.toPence(135) === 13500,
    "pounds become the smallest unit Stripe counts in", off.toPence(18) + " / " + off.toPence(135));
  check(off.toPence(19.99) === 1999, "and £19.99 does not become 1998 through floating point",
    off.toPence(19.99));
  check(Number.isNaN(off.toPence("nonsense")), "nonsense is refused rather than charged as zero");

  /* ====================== 3. the form encoding Stripe actually wants */
  process.env.STRIPE_SECRET_KEY = "sk_test_" + "b".repeat(24);
  const st = loadStripe({ key: "sk_test_" + "b".repeat(24), whsec: "whsec_test" });
  CALLS.length = 0;
  NEXT_SESSION = { id: "cs_test_1", url: "https://checkout.stripe.com/c/pay/cs_test_1" };
  await st.api("/checkout/sessions", {
    mode: "payment",
    client_reference_id: "EG-ABCD12",
    customer_email: "fox@example.com",
    success_url: "https://egregora.hatchable.site/shop/thanks/?session_id=x",
    cancel_url: "https://egregora.hatchable.site/shop/",
    metadata: { kind: "shop", ref: "EG-ABCD12" },
    line_items: [{ quantity: 2, price_data: { currency: "gbp", unit_amount: 2500,
      product_data: { name: "The Fox" } } }]
  });
  const sent = CALLS[0].body;
  const has = (frag) => sent.indexOf(frag) >= 0;
  check(has("line_items%5B0%5D%5Bprice_data%5D%5Bunit_amount%5D=2500"),
    "the price travels as line_items[0][price_data][unit_amount], in pence",
    decodeURIComponent(sent).match(/line_items\[0\]\[price_data\]\[unit_amount\]=\d+/)[0]);
  check(has("line_items%5B0%5D%5Bprice_data%5D%5Bproduct_data%5D%5Bname%5D=The+Fox") ||
        has("line_items%5B0%5D%5Bprice_data%5D%5Bproduct_data%5D%5Bname%5D=The%20Fox"),
    "and the product name nested inside it");
  check(has("line_items%5B0%5D%5Bquantity%5D=2"), "the quantity beside it");
  check(has("mode=payment") && has("client_reference_id=EG-ABCD12"),
    "the mode and the reference this house will look the payment up by");
  check(CALLS[0].auth === "Bearer " + process.env.STRIPE_SECRET_KEY,
    "signed with the secret key, which never reaches the browser");

  /* A subscription needs the interval, or Stripe will not charge again. */
  CALLS.length = 0;
  await st.api("/checkout/sessions", { mode: "subscription", line_items: [{ quantity: 1,
    price_data: { currency: "gbp", unit_amount: 500, recurring: { interval: "month", interval_count: 1 },
      product_data: { name: "Member" } } }] });
  check(decodeURIComponent(CALLS[0].body).indexOf("line_items[0][price_data][recurring][interval]=month") >= 0,
    "a membership carries its interval, so it renews",
    decodeURIComponent(CALLS[0].body).match(/recurring\]\[interval\]=\w+/)[0]);

  /* ================================================= 4. the webhook signature */
  const secret = "whsec_test";
  const raw = JSON.stringify({ id: "evt_1", type: "checkout.session.completed",
    data: { object: { id: "cs_test_1", object: "checkout.session" } } });
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac("sha256", secret).update(t + "." + raw).digest("hex");
  const hdr = "t=" + t + ",v1=" + sig;

  check(st.verifyWebhook(raw, hdr).ok === true, "a correctly signed webhook is accepted");
  const tampered = raw.replace("evt_1", "evt_2");
  check(st.verifyWebhook(tampered, hdr).ok === false,
    "one word changed in the body and it is refused");
  const old = "t=" + (t - 900) + ",v1=" +
    crypto.createHmac("sha256", secret).update((t - 900) + "." + raw).digest("hex");
  check(st.verifyWebhook(raw, old).ok === false, "a signature from fifteen minutes ago is refused");
  check(st.verifyWebhook(raw, "t=" + t + ",v1=" + "0".repeat(64)).ok === false,
    "a forged signature is refused");
  /* The important one: a parsed body is not the bytes Stripe signed. */
  const parsed = st.verifyWebhook(JSON.parse(raw), hdr);
  check(parsed.ok === false, "a body the platform already parsed is refused, not quietly trusted",
    parsed.error);
  const noSec = loadStripe({ key: process.env.STRIPE_SECRET_KEY });
  check(noSec.verifyWebhook(raw, hdr).ok === false,
    "with no signing secret set, nothing is verified rather than everything being");

  /* ================== 5. an order is paid only when Stripe says so */
  globalThis.__PAY = load("hatchable/lib/payments.js", LEDGER + `
const retrieve = async (p) => globalThis.__NEXT();
const ORDER_TO = 'shakradragon@gmail.com'; const HOUSE_LABEL = 'EGregoRA';
`, "applySession, applySessionId, claimEvent, setSubscription");

  const ledger = globalThis.__T;
  ledger.shop_orders.push({ ref: "EG-ABCD12", product_key: "fox-figure", product_name: "The Fox",
    qty: 2, unit_price: 25, total: 50, name: "Jim", email: "fox@example.com", notes: "",
    payment_state: "awaiting", house: "EG", stripe_session: "cs_test_1" });

  let out = await globalThis.__PAY.applySession({
    id: "cs_test_1", object: "checkout.session", payment_status: "unpaid",
    amount_total: 5000, metadata: { kind: "shop" }, customer_details: { email: "fox@example.com" }
  });
  check(ledger.shop_orders[0].payment_state === "awaiting" && out.state === "awaiting",
    "a session Stripe has not settled leaves the order awaiting",
    "payment_status=unpaid \u2192 " + ledger.shop_orders[0].payment_state);

  out = await globalThis.__PAY.applySession({
    id: "cs_test_1", object: "checkout.session", payment_status: "paid",
    amount_total: 5000, payment_intent: "pi_1",
    metadata: { kind: "shop", ref: "EG-ABCD12" }, customer_details: { email: "fox@example.com" }
  });
  check(ledger.shop_orders[0].payment_state === "paid" && out.state === "paid",
    "and marks it paid when Stripe says the money arrived",
    ledger.shop_orders[0].payment_state + " / \u00a3" + ledger.shop_orders[0].amount_paid);
  check(ledger.shop_orders[0].stripe_intent === "pi_1",
    "keeping the payment reference the refund would need");

  /* A session id nobody has heard of must not conjure an order. */
  out = await globalThis.__PAY.applySession({
    id: "cs_test_nope", object: "checkout.session", payment_status: "paid",
    amount_total: 9900, metadata: { kind: "shop" }
  });
  check(out.state === "unknown" && ledger.shop_orders.length === 1,
    "a session that matches no order marks nothing paid", out.state);

  /* A gift, and a membership. */
  ledger.donations.push({ id: 1, email: "badger@example.com", amount: 10, state: "awaiting",
    stripe_session: "cs_gift" });
  await globalThis.__PAY.applySession({ id: "cs_gift", object: "checkout.session",
    payment_status: "paid", amount_total: 1000, metadata: { kind: "donation" } });
  check(ledger.donations[0].state === "paid", "a gift is recorded as given",
    ledger.donations[0].state + " \u00a3" + ledger.donations[0].amount_paid);

  ledger.memberships.push({ email: "fox@example.com", tier: "member", amount: 5, state: "awaiting" });
  await globalThis.__PAY.applySession({ id: "cs_mem", object: "checkout.session",
    payment_status: "paid", amount_total: 500, metadata: { kind: "membership", tier: "member",
      email: "fox@example.com" }, customer_details: { email: "fox@example.com" } });
  check(ledger.memberships[0].state === "active", "a membership becomes active on payment",
    ledger.memberships[0].state);

  /* ===================================== 6. Stripe retries are a no-op */
  const first = await globalThis.__PAY.claimEvent("evt_dup", "checkout.session.completed");
  const again = await globalThis.__PAY.claimEvent("evt_dup", "checkout.session.completed");
  check(first === true && again === false,
    "an event handled once is not handled twice, however often Stripe sends it",
    "first=" + first + " second=" + again);

  /* ============= 7. a subscription going bad is reflected, not ignored */
  await globalThis.__PAY.setSubscription({ id: "sub_1", status: "past_due",
    metadata: { email: "fox@example.com" }, current_period_end: null });
  check(ledger.memberships[0].state === "past_due",
    "a failed renewal shows as past due rather than staying active",
    ledger.memberships[0].state);
  await globalThis.__PAY.setSubscription({ id: "sub_1", status: "canceled",
    metadata: { email: "fox@example.com" } });
  check(ledger.memberships[0].state === "cancelled", "and cancellation is recorded",
    ledger.memberships[0].state);

  /* ==================== 8. the checkout endpoint, end to end */
  NEXT_SESSION = { id: "cs_test_new", url: "https://checkout.stripe.com/c/pay/cs_test_new",
    customer: "cus_1" };
  const co = loadCheckout({ configured: true }, globalThis.__PAY);
  const res = () => {
    let o = null, c = 200;
    return { status(x) { c = x; return this; }, json(y) { o = y; return this; },
      get o() { return o; }, get code() { return c; } };
  };
  const post = async (h, body) => {
    const r = res(); await co(Object.assign({}, h, body), r); return r; };
  const H = { headers: { host: "egregora.hatchable.site" } };

  const bought = await post(H, { body: { action: "checkout", kind: "shop", key: "fox-figure",
    qty: 2, name: "Jim Rankin", email: "fox@example.com", notes: "" } });
  check(bought.code === 200 && bought.o.url === "https://checkout.stripe.com/c/pay/cs_test_new",
    "a purchase comes back with Stripe's payment page to go to",
    bought.o && bought.o.url);
  const order = globalThis.__T.shop_orders[globalThis.__T.shop_orders.length - 1];
  check(order.stripe_session === "cs_test_new" && order.payment_state === "awaiting",
    "the order was written down and tied to the session before any card was taken",
    order.ref + " \u2192 " + order.stripe_session + " (" + order.payment_state + ")");

  const forged = await post({ headers: { host: "evil.example.com" } },
    { body: { action: "checkout", kind: "shop", key: "fox-figure", qty: 1,
      name: "Jim", email: "fox@example.com" } });
  check(forged.code === 200, "a forged Host does not break the checkout");

  const bad = await post(H, { body: { action: "checkout", kind: "shop", key: "not-for-sale",
    qty: 1, name: "Jim", email: "fox@example.com" } });
  check(bad.code === 400, "something not on the shelf is refused before Stripe is asked",
    bad.o && bad.o.error);
  const noEmail = await post(H, { body: { action: "checkout", kind: "shop", key: "fox-figure",
    qty: 1, name: "Jim", email: "nope" } });
  check(noEmail.code === 400, "and so is an address a receipt cannot reach");
  const tooMany = await post(H, { body: { action: "checkout", kind: "shop", key: "fox-figure",
    qty: 99, name: "Jim", email: "fox@example.com" } });
  check(tooMany.code === 400, "and ninety-nine of anything");

  const gift = await post(H, { body: { action: "checkout", kind: "donation", amount: 10,
    name: "A friend", email: "badger@example.com", message: "For the grove." } });
  check(gift.code === 200 && gift.o.gift > 0, "a gift opens a payment page too",
    "gift #" + (gift.o && gift.o.gift));
  const stingy = await post(H, { body: { action: "checkout", kind: "donation", amount: 0,
    email: "badger@example.com" } });
  check(stingy.code === 400, "and a gift of nothing is refused, politely", stingy.o && stingy.o.error);

  const joined = await post(H, { body: { action: "checkout", kind: "membership", tier: "member",
    name: "Jim", email: "jim@example.com" } });
  check(joined.code === 200 && joined.o.tier === "member", "a membership can be joined",
    joined.o && joined.o.tier);

  /* Not switched on: the honest answer, and the order route still open. */
  const cold = loadCheckout({ configured: false }, globalThis.__PAY);
  const probe = res();
  await cold(Object.assign({}, H, { body: { action: "checkout", kind: "shop", key: "fox-figure",
    qty: 1, name: "Jim", email: "fox@example.com" } }), probe);
  check(probe.code === 503 && probe.o.not_configured === true,
    "with no key, checkout says plainly that cards are off \u2014 it does not half-charge",
    probe.o && probe.o.error.slice(0, 58) + "\u2026");
  const probeConfirm = res();
  await cold(Object.assign({}, H, { body: { action: "confirm", session_id: "cs_test_x" } }), probeConfirm);
  check(probeConfirm.code === 200 && probeConfirm.o.state === "awaiting",
    "and the success page degrades to 'awaiting' rather than erroring",
    probeConfirm.o && probeConfirm.o.state);

  console.log(fails ? "\n" + fails + " FAILURE(S)" : "\nall passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("harness:", e); process.exit(1); });
