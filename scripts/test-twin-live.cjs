/* The live relay, driven through the real api/twin-live.js and the real
   mirrorLive() in lib/twin.js.

   What is under test:
     · an unsigned letter is refused before a word of it is read
     · a feed opened on the twin comes on air here, under the twin's watchword
     · the segments land, and the feed keeps beating while they do
     · nothing from the twin can move a feed this house is broadcasting
     · a feed that came from the twin is never relayed back
*/
const fs = require("fs");
const crypto = require("crypto");

const SECRET = "twin_8f31c0a9d4e67b25a1c8f0d93e7b46512ac9d8e0f3b7a164";
const sign = (raw) => crypto.createHmac("sha256", SECRET).update(raw).digest("hex");

/* ---------------------------------------------------------------- receiver */

const DB = `
let FEEDS = [];
let CHUNKS = [];
let NEXT = 1;
let AIR = null;
let CURSOR = {};
const db = { query: async (sql, args) => {
  const q = sql.replace(/\\s+/g, ' ').trim();
  if (/SELECT id, twin_origin, state FROM live_feeds WHERE twin_key/.test(q)) {
    return { rows: FEEDS.filter(f => f.twin_key === args[0])
      .map(f => ({ id: f.id, twin_origin: f.twin_origin, state: f.state })) };
  }
  if (/SELECT id, twin_origin FROM live_feeds WHERE twin_key/.test(q)) {
    return { rows: FEEDS.filter(f => f.twin_key === args[0])
      .map(f => ({ id: f.id, twin_origin: f.twin_origin })) };
  }
  if (/INSERT INTO live_feeds/.test(q)) {
    const f = { id: NEXT++, title: args[0], note: args[1], word_hash: args[2],
      mime: args[3], state: 'live', who: args[4], twin_key: args[5],
      twin_origin: args[6], seq: 0, beat_at: 'now' };
    FEEDS.push(f);
    return { rows: [{ id: f.id }] };
  }
  if (/UPDATE live_feeds SET title = /.test(q)) {
    const f = FEEDS.find(x => x.id === args[0]);
    if (f) Object.assign(f, { title: args[1], state: 'live', twin_origin: args[4] });
    return { rows: [] };
  }
  if (/INSERT INTO live_chunks/.test(q)) {
    CHUNKS.push({ feed_id: args[0], seq: args[1], is_head: args[2], part: args[3] });
    return { rows: [] };
  }
  if (/UPDATE live_feeds SET seq = GREATEST/.test(q)) {
    const f = FEEDS.find(x => x.id === args[0]);
    if (f) { f.seq = Math.max(f.seq, args[1]); f.state = 'live'; }
    return { rows: [] };
  }
  if (/UPDATE live_feeds SET state = 'ended'/.test(q)) {
    const f = FEEDS.find(x => x.id === args[0]); if (f) f.state = 'ended';
    return { rows: [] };
  }
  if (/DELETE FROM live_chunks/.test(q)) {
    CHUNKS = CHUNKS.filter(c => c.feed_id !== args[0]); return { rows: [] };
  }
  if (/DELETE FROM live_cursor/.test(q)) { delete CURSOR[args[0]]; return { rows: [] }; }
  if (/INSERT INTO live_air/.test(q)) { AIR = { on_air: args[0], note: args[1], back_at: args[2] }; return { rows: [] }; }
  if (/INSERT INTO live_cursor/.test(q)) { CURSOR[args[0]] = { x: args[1], y: args[2], name: args[3] }; return { rows: [] }; }
  return { rows: [] };
} };
globalThis.__F = () => FEEDS;
globalThis.__C = () => CHUNKS;
globalThis.__AIR = () => AIR;
globalThis.__CUR = () => CURSOR;
globalThis.__SEED = (f) => { FEEDS.push(Object.assign({ id: NEXT++ }, f)); };
`;

const STUBS = [
  "const crypto = require('crypto');",
  DB,
  "const SECRET = " + JSON.stringify(SECRET) + ";",
  "function verifySignature(req) {",
  "  const given = String(req.headers['x-twin-sign'] || '');",
  "  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});",
  "  const want = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');",
  "  if (given.length !== want.length) return false;",
  "  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(want));",
  "}",
].join("\n");

let src = fs.readFileSync("hatchable/api/twin-live.js", "utf8")
  .replace(/^import .*$/gm, "")
  .replace(/^export const /gm, "const ")
  .replace(/^export default async function/m, "const handler = async function")
  + "\nmodule.exports = handler;\n";

const mod = { exports: null };
new Function("module", "require", STUBS + "\n" + src)(mod, require);
const twinLive = mod.exports;

const res = () => {
  let out = null, code = 200;
  return { status(c) { code = c; return this; }, json(o) { out = o; return this; },
    get o() { return out; }, get code() { return code; } };
};
const send = async (payload, sig) => {
  const raw = JSON.stringify(payload);
  const r = res();
  await twinLive({ body: payload, headers: { "x-twin-sign": sig === undefined ? sign(raw) : sig } }, r);
  return r;
};

let fails = 0;
const check = (ok, label, extra) => {
  console.log((ok ? "PASS " : "FAIL ") + label + (extra ? "  \u2014 " + extra : ""));
  if (!ok) fails++;
};

/* ------------------------------------------------------------ sender side */
/* lib/twin.js loaded for real, with the network recorded instead of used. */
const LETTERS = [];
globalThis.fetch = async (url, opts) => {
  LETTERS.push({ url: String(url), body: JSON.parse(opts.body), sig: opts.headers["x-twin-sign"] });
  return { ok: true, json: async () => ({ ok: true }) };
};
let twinSrc = fs.readFileSync("hatchable/lib/twin.js", "utf8")
  .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?$/gm, "")
  .replace(/^export /gm, "")
  + "\nmodule.exports = { mirrorLive, newLiveKey, twinPost, sign };\n";
const twinMod = { exports: null };
/* twin.js imports crypto and the platform db; both are stripped above, so both
   are stood in here — crypto for real, the db because these paths never touch it. */
new Function("module", "require",
  "const crypto = require('node:crypto');\n" +
  "const db = { query: async () => ({ rows: [] }) };\n" + twinSrc)(twinMod, require);
const { mirrorLive, newLiveKey } = twinMod.exports;

(async () => {
  /* -------------------------------------------------- 1. the door is shut */
  const open = { action: "open", twin_key: "egregora-live-m1-aabb", title: "Under the stars",
    note: "A walk.", word_hash: "d".repeat(64), mime: "video/webm", who: "Jim", from: "egregora" };
  const bad = await send(open, "0".repeat(64));
  check(bad.code === 401, "a letter not signed by the twin is refused", "status " + bad.code);
  check(globalThis.__F().length === 0, "and no feed was opened for it");

  const forged = await send(open, sign(JSON.stringify({ action: "open", twin_key: "other" })));
  check(forged.code === 401, "a signature over different words does not open it", "status " + forged.code);

  /* -------------------------------------------- 2. the feed comes on air */
  const made = await send(open);
  const feed = globalThis.__F()[0];
  check(made.code === 200 && made.o.created === true, "a signed open brings the feed on air here",
    made.o && JSON.stringify(made.o));
  check(feed && feed.twin_origin === "egregora", "and marks it as the twin's",
    feed && "twin_origin=" + feed.twin_origin);
  check(feed && feed.word_hash === "d".repeat(64),
    "under the same watchword, hashed \u2014 the word itself never crossed",
    feed && feed.word_hash.slice(0, 8) + "\u2026");

  /* ------------------------------------------------ 3. the segments land */
  for (let i = 1; i <= 3; i++) {
    await send({ action: "chunk", twin_key: open.twin_key, seq: i, head: i === 1,
      part: "segment-" + i });
  }
  const chunks = globalThis.__C();
  check(chunks.length === 3 && chunks[0].is_head === true,
    "the segments land in order, the first carrying the format header",
    "n=" + chunks.length + " head=" + (chunks[0] && chunks[0].is_head));
  check(feed.seq === 3, "and the feed beats forward as they do", "seq=" + feed.seq);

  const dup = await send({ action: "chunk", twin_key: "no-such-feed", seq: 9, part: "x" });
  check(dup.code === 404, "a segment for a feed that is not here is refused, not invented",
    "status " + dup.code);

  /* --------------------------- 4. this house's own broadcast is untouchable */
  globalThis.__SEED({ twin_key: "ours", twin_origin: null, state: "live", title: "Ours" });
  const grab = await send({ action: "chunk", twin_key: "ours", seq: 1, part: "x" });
  check(grab.code === 409, "the twin cannot push a segment into this house's own feed",
    "status " + grab.code);
  const steal = await send({ action: "close", twin_key: "ours" });
  check(steal.code === 409 && globalThis.__F().some((f) => f.twin_key === "ours" && f.state === "live"),
    "and cannot close it either", "status " + steal.code);

  /* ------------------------------------------------- 5. cursor and air */
  await send({ action: "cursor", twin_key: open.twin_key, x: 0.25, y: 0.75, name: "Jim" });
  const cur = globalThis.__CUR()[feed.id];
  check(cur && cur.x === 0.25 && cur.y === 0.75, "the director's mouse crosses too",
    cur && cur.x + "," + cur.y);

  const airOff = await send({ action: "air", on: false, note: "Back at nine." });
  check(airOff.code === 200 && globalThis.__AIR().on_air === false,
    "the sign over the door needs no feed identity, and travels anyway",
    globalThis.__AIR().note);

  /* --------------------------------------------------- 6. off air */
  const closed = await send({ action: "close", twin_key: open.twin_key });
  check(closed.o.closed === true && feed.state === "ended" && globalThis.__C().length === 0,
    "closing on the twin takes it off air here and drops the segments",
    "state=" + feed.state + " chunks=" + globalThis.__C().length);

  const late = await send({ action: "chunk", twin_key: open.twin_key, seq: 4, part: "x" });
  check(late.code === 200 && feed.state === "live",
    "a segment arriving after the close puts it back on air rather than being lost",
    "state=" + feed.state);

  /* --------------------------------------- 7. the echo cannot start */
  LETTERS.length = 0;
  const echo = await mirrorLive("chunk", { twin_key: "x", twin_origin: "egregora", seq: 1, part: "p" });
  check(LETTERS.length === 0 && echo && echo.error === "echo refused",
    "a feed that came from the twin is never relayed back",
    echo && echo.error + ", letters=" + LETTERS.length);

  LETTERS.length = 0;
  const nokey = await mirrorLive("chunk", { seq: 1, part: "p" });
  check(LETTERS.length === 0 && nokey.error === "no twin_key",
    "and nothing goes out without a shared identity", nokey.error);

  LETTERS.length = 0;
  await mirrorLive("air", { on: true });
  check(LETTERS.length === 1 && LETTERS[0].body.action === "air" &&
    LETTERS[0].url.endsWith("/api/twin-live"),
    "the sign over the door does go out, needing no feed identity",
    LETTERS[0] && LETTERS[0].url);

  const k = newLiveKey();
  check(/^egregora-live-/.test(k) && k.length > 20, "a feed identity is minted per house", k);

  console.log(fails ? "\n" + fails + " FAILURE(S)" : "\nall passed");
  process.exit(fails ? 1 : 0);
})();
