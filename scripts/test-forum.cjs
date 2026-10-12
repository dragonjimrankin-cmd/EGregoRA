/* Drives the real /api/forum and /api/profile handlers with a stub db:
   reads, identity (local + twin-vouched), locked threads, the moderator
   policy, and the 400-word bio shelf. */
const fs = require("fs");
const crypto = require("crypto");

function load(path, extra) {
  let src = fs.readFileSync(path, "utf8")
    .replace(/^import .*$/gm, "")
    .replace(/^export const /gm, "const ")
    .replace(/^export default async function/m, "const handler = async function")
    + "\nmodule.exports = handler;\n";
  const mod = { exports: null };
  new Function("module", extra + "\n" + src)(mod);
  return mod.exports;
}

/* ---------------- the stub world ---------------- */
let THREADS = [{ id: "seed-1", title: "Seeded thread", blurb: "b", author_kind: "oracle",
  author_name: "Gink", author_home: "egregora", created_at: "2026-06-02", last_at: "2026-06-02",
  pinned: true, locked: false }];
let POSTS = [{ id: 1, thread_id: "seed-1", author_kind: "oracle", author_id: null,
  author_name: "Gink", author_home: "egregora", author_avatar: null, author_tag: null,
  body: "First words.", created_at: "2026-06-02" }];
let PROFILES = {};            /* member_id -> {display_name,bio,avatar_key,home} */
let CHUNKS = {};              /* upload_id -> part */
let PUTS = [];
let nextId = 100;
const genId = () => "gen-" + (nextId++);
let COMPOSE = async () => "A considered reply from the construct.";
let TWIN_KNOWN = { known: true, member: { id: 9, name: "Twin Person", display_name: "TP", bio: "hi", avatar_url: null, email: "twin@example.org", privilege: null, membership: "member" } };
let LOCAL_MEMBER = { id: 7, email: "rowan@example.org", name: "Rowan", kind: "human", privilege: null };

const db = { query: async (sql, a = []) => {
  const S = sql.replace(/\s+/g, " ");
  if (/FROM forum_threads t/.test(S)) return { rows: THREADS.map((t) => ({ ...t, post_count: POSTS.filter((p) => String(p.thread_id) === String(t.id)).length })) };
  if (/FROM forum_threads WHERE id/.test(S)) { const t = THREADS.find((x) => String(x.id) === String(a[0])); return { rows: t ? [t] : [] }; }
  if (/SELECT locked FROM forum_threads/.test(S)) { const t = THREADS.find((x) => String(x.id) === String(a[0])); return { rows: t ? [{ locked: t.locked }] : [] }; }
  if (/INSERT INTO forum_threads/.test(S)) { const id = genId(); const t = { id, title: a[0], author_kind: a[1], author_id: a[2], author_name: a[3], author_home: a[4], pinned: false, locked: false, created_at: "now", last_at: "now" }; THREADS.push(t); return { rows: [{ id }] }; }
  if (/INSERT INTO forum_posts/.test(S)) {
    const id = nextId++;
    /* two shapes: the member insert (8 args) and the construct insert
       (5 args — kind and home are literals in that statement) */
    const p = a.length === 5
      ? { id, thread_id: a[0], author_kind: "bot", author_id: a[1], author_name: a[2], author_home: "egregora", author_avatar: null, author_tag: a[3], body: a[4], created_at: "now" }
      : { id, thread_id: a[0], author_kind: a[1], author_id: a[2], author_name: a[3], author_home: a[4], author_avatar: a[5], author_tag: a[6], body: a[7], created_at: "now" };
    POSTS.push(p);
    return { rows: [{ id, created_at: "now" }] };
  }
  if (/UPDATE forum_threads SET last_at/.test(S)) { const t = THREADS.find((x) => String(x.id) === String(a[0])); if (t) t.last_at = "now"; return { rows: [] }; }
  if (/interval '2 hours'/.test(S)) return { rows: [] };                     /* no recent bot post */
  if (/FROM forum_posts WHERE thread_id/.test(S)) return { rows: POSTS.filter((p) => String(p.thread_id) === String(a[0])) };
  if (/author_kind = 'bot' GROUP BY/.test(S)) return { rows: [] };
  if (/FROM forum_posts/.test(S)) return { rows: [] };
  /* The door reads the ledger: these fixtures hold a live membership. */
  if (/FROM memberships WHERE email/.test(S)) return { rows: [{ state: "active", period_end: null, tier: "member" }] };
  if (/FROM members WHERE email/.test(S)) return { rows: a[0].startsWith("sable") ? [{ id: 42 }] : [] };
  if (/FROM forum_profiles WHERE member_id = ANY/.test(S)) return { rows: [] };
  if (/FROM forum_profiles WHERE member_id = /.test(S)) { const p = PROFILES[a[0]]; return { rows: p ? [p] : [] }; }
  if (/INSERT INTO forum_profiles/.test(S)) { PROFILES[a[0]] = Object.assign(PROFILES[a[0]] || {}, { display_name: a[1], bio: a[2], home: a[3] }); return { rows: [] }; }
  if (/INSERT INTO media_chunks/.test(S)) { CHUNKS[a[0]] = a[1]; return { rows: [] }; }
  if (/SELECT part FROM media_chunks/.test(S)) return { rows: CHUNKS[a[0]] ? [{ part: CHUNKS[a[0]] }] : [] };
  if (/DELETE FROM media_chunks/.test(S)) { delete CHUNKS[a[0]]; return { rows: [] }; }
  return { rows: [] };
} };
const storage = { url: async (k) => "https://cdn/" + k, put: async (k, b, m) => PUTS.push({ k, len: b.length, m }) };
const whoAmI = async (req) => (req && req.body && req.body.token === "local") ? LOCAL_MEMBER : null;
const bearer = (req) => (req && req.body && req.body.token) || "";
const askTwinWhois = async (t) => (t === "foreign" ? TWIN_KNOWN : { known: false });
const BOTS = [{ key: "sable", name: "Sable Wren", tag: "moderator · construct", quest: "q" }];
const compose = async () => COMPOSE();
const mirror = async () => {};

const res = () => { let out = null, code = 200, heads = {}; return {
  status(c) { code = c; return this; }, json(o) { out = o; return this; },
  setHeader(k, v) { heads[k] = v; }, end() { return this; },
  get o() { return out; }, get code() { return code; }, get heads() { return heads; } }; };

const forum = load("hatchable/api/forum.js", `
  const db = ${"null"};`);
/* rebuild with real stub bindings visible inside the function scope */
function mk(handlerSrc, names) {
  const mod = { exports: null };
  new Function("module", "db", "storage", "whoAmI", "bearer", "askTwinWhois", "BOTS", "compose", "mirror",
    handlerSrc)(mod, db, storage, whoAmI, bearer, askTwinWhois, BOTS, compose, mirror);
  return mod.exports;
}
function prep(path) {
  return fs.readFileSync(path, "utf8")
    .replace(/^import .*$/gm, "")
    .replace(/^export const /gm, "const ")
    .replace(/^export default async function/m, "const handler = async function")
    + "\nmodule.exports = handler;\n";
}
const forumH = mk(prep("hatchable/api/forum.js"));
const profileH = mk(prep("hatchable/api/profile.js"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log("PASS", name); }
  else { fail++; console.log("FAIL", name, extra || ""); }
}

(async () => {
  /* 1 — public reads */
  let r = res(); await forumH({ method: "GET", body: {} }, r);
  check("threads list", r.code === 200 && r.o.ok && r.o.threads.length === 1 && r.o.threads[0].post_count === 1, JSON.stringify(r.o));

  r = res(); await forumH({ method: "GET", body: { thread_id: "seed-1" } }, r);
  check("thread read + oracle avatar", r.o.ok && r.o.posts[0].author_avatar.endsWith("gink.png"), JSON.stringify(r.o && r.o.posts));

  r = res(); await forumH({ method: "GET", body: { thread_id: 999 } }, r);
  check("missing thread 404", r.code === 404);

  r = res(); await forumH({ method: "OPTIONS", body: {} }, r);
  check("OPTIONS 204 + CORS", r.code === 204 && r.heads["Access-Control-Allow-Origin"] === "*");

  /* 2 — identity gates */
  r = res(); await forumH({ method: "POST", body: { action: "new", title: "x", body: "y" } }, r);
  check("no identity 401", r.code === 401);

  r = res(); await forumH({ method: "POST", body: { action: "me", token: "foreign" } }, r);
  check("twin whois identity", r.o.ok && r.o.member && r.o.member.home === "two-infinities" && r.o.member.name === "TP", JSON.stringify(r.o));

  /* 3 — local member starts a thread; the construct answers */
  r = res(); await forumH({ method: "POST", body: { action: "new", token: "local", title: "A new question", body: "Why does the pattern keep itself?" } }, r);
  check("new thread", r.o.ok && r.o.thread_id === "gen-100", JSON.stringify(r.o));
  await sleep(50);
  const bots = POSTS.filter((p) => p.author_kind === "bot");
  check("bot replied", bots.length === 1 && bots[0].author_name === "Sable Wren" && bots[0].author_id === 42, JSON.stringify(bots));

  /* 4 — twin member posts into it; author snapshot is two-infinities */
  r = res(); await forumH({ method: "POST", body: { action: "post", token: "foreign", thread_id: "gen-100", body: "From the other side of the sky." } }, r);
  check("twin post", r.o.ok, JSON.stringify(r.o));
  const twinPost = POSTS.find((p) => p.body.startsWith("From the other side"));
  check("twin author snapshot", twinPost && twinPost.author_home === "two-infinities" && twinPost.author_name === "TP");

  /* 5 — locked thread refuses */
  THREADS[0].locked = true;
  r = res(); await forumH({ method: "POST", body: { action: "post", token: "local", thread_id: "seed-1", body: "Hello?" } }, r);
  check("locked 403", r.code === 403, JSON.stringify(r.o));
  THREADS[0].locked = false;

  /* 6 — body length cap */
  r = res(); await forumH({ method: "POST", body: { action: "post", token: "local", thread_id: "seed-1", body: "a".repeat(9000) } }, r);
  const long = POSTS[POSTS.length - 1];
  check("body capped at 6000", r.o.ok && long.body.length === 6000, String(long && long.body.length));

  /* 7 — construct abstains when compose returns nothing */
  COMPOSE = async () => null;
  const before = POSTS.length;
  r = res(); await forumH({ method: "POST", body: { action: "new", token: "local", title: "Quiet one", body: "Something only a human would ask." } }, r);
  await sleep(50);
  check("bot abstains honestly", POSTS.length === before + 1, POSTS.length + " vs " + before);

  /* 8 — profile: get / save / 400-word cap / avatar */
  r = res(); await profileH({ method: "POST", body: { action: "get", token: "local" } }, r);
  check("profile get", r.o.ok && r.o.profile, JSON.stringify(r.o));

  const many = new Array(401).fill("word").join(" ");
  r = res(); await profileH({ method: "POST", body: { action: "save", token: "local", display_name: "Rowan", bio: many } }, r);
  check("401-word bio refused", r.code === 400 && /400 words/.test(r.o.error), JSON.stringify(r.o));

  const ok = new Array(400).fill("word").join(" ");
  r = res(); await profileH({ method: "POST", body: { action: "save", token: "local", display_name: "Rowan", bio: ok } }, r);
  check("400-word bio saved", r.o.ok && PROFILES[7].display_name === "Rowan", JSON.stringify(r.o));

  /* not a jpeg */
  r = res(); await profileH({ method: "POST", body: { action: "avatar", token: "local", part: Buffer.from("PNGishbytes").toString("base64") } }, r);
  r = res(); await profileH({ method: "POST", body: { action: "avatar-finish", token: "local" } }, r);
  check("non-jpeg refused", r.code === 400, JSON.stringify(r.o));

  /* a real tiny jpeg */
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), crypto.randomBytes(2000), Buffer.from([0xff, 0xd9])]);
  r = res(); await profileH({ method: "POST", body: { action: "avatar", token: "local", part: jpeg.toString("base64") } }, r);
  r = res(); await profileH({ method: "POST", body: { action: "avatar-finish", token: "local" } }, r);
  check("avatar stored", r.o.ok && PUTS.length === 1 && PUTS[0].len === jpeg.length && /^avatars\/7-/.test(PUTS[0].k), JSON.stringify(PUTS));

  /* no session on the shelf */
  r = res(); await profileH({ method: "POST", body: { action: "get" } }, r);
  check("profile 401", r.code === 401);

  console.log(pass + " pass, " + fail + " fail");
  process.exit(fail ? 1 : 0);
})();
