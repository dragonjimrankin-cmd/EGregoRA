/* The forum door, driven through the real api/forum.js.

   The rule under test: the forum is readable by anyone, but only an owner, an
   administrator, or a member whose membership is still inside its period may
   write. And a member of the twin house is judged on the standing their house
   vouched for, because this house holds no row of theirs.
*/
const fs = require("fs");

let fails = 0;
const check = (ok, label, extra) => {
  console.log((ok ? "PASS " : "FAIL ") + label + (extra ? "  \u2014 " + extra : ""));
  if (!ok) fails++;
};

/* Built as an array rather than a template literal: inside a template literal
   JS turns \$2 into $2, which quietly turns a regex into one that cannot match.
   Here the stub reads the SQL with indexOf and there is nothing to escape. */
const STUBS = [
  "const T = { members: [], memberships: [], forum_profiles: [], threads: [], posts: [] };",
  "globalThis.__T = T;",
  "const db = { query: async (sql, args) => {",
  "  const q = sql.replace(/\\s+/g, ' ').trim();",
  "  const at = (f) => q.indexOf(f) >= 0;",
  "  if (at('FROM forum_profiles WHERE member_id')) {",
  "    return { rows: T.forum_profiles.filter(p => p.member_id === args[0]) }; }",
  "  if (at('FROM memberships WHERE email')) {",
  "    const hit = T.memberships.filter(m => m.email === args[0] &&",
  "      (args.length < 2 || m.state === args[1]));",
  "    return { rows: hit }; }",
  "  if (at('INSERT INTO forum_threads')) {",
  "    const t = { id: T.threads.length + 1, title: args[0], locked: false };",
  "    T.threads.push(t); return { rows: [t] }; }",
  "  if (at('FROM forum_threads WHERE id')) {",
  "    return { rows: T.threads.filter(t => String(t.id) === String(args[0])) }; }",
  "  if (at('FROM forum_posts WHERE thread_id')) {",
  "    return { rows: T.posts.filter(p => String(p.thread_id) === String(args[0])) }; }",
  "  if (at('FROM forum_profiles fp')) return { rows: [] };",
  "  if (at('INSERT INTO forum_posts')) {",
  "    const p = { id: T.posts.length + 1, thread_id: args[0], body: args[7],",
  "      created_at: new Date().toISOString() };",
  "    T.posts.push(p); return { rows: [p] }; }",
  "  if (at('FROM members WHERE email')) {",
  "    return { rows: T.members.filter(m => m.email === args[0]) }; }",
  "  if (at('FROM forum_threads')) return { rows: [] };",
  "  return { rows: [] };",
  "} };",
  "const storage = { url: async () => null };",
  /* The signed-in member is set per test; null means nobody. */
  "let ME = null;",
  "globalThis.__setMe = (m) => { ME = m; };",
  "const whoAmI = async () => ME;",
  "const bearer = (req) => (req.headers && req.headers.authorization || '').replace(/^Bearer /, '');",
  /* The twin's vouching, set per test. */
  "let TWIN = { known: false };",
  "globalThis.__setTwin = (t) => { TWIN = t; };",
  "const askTwinWhois = async () => TWIN;",
  "const BOTS = [{ name: 'Gink', key: 'gink' }]; const compose = async () => null;",
].join("\n");

let src = fs.readFileSync("hatchable/api/forum.js", "utf8")
  .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?$/gm, "")
  .replace(/^export const /gm, "const ")
  .replace(/^export default async function/m, "const handler = async function")
  + "\nmodule.exports = handler;\n";

const mod = { exports: null };
new Function("module", "require", STUBS + "\n" + src)(mod, require);
const forum = mod.exports;

const res = () => {
  let out = null, code = 200;
  return {
    /* The forum answers the twin across an origin, so it sets CORS headers
       before anything else. */
    setHeader() { return this; },
    status(c) { code = c; return this; }, json(o) { out = o; return this; },
    get o() { return out; }, get code() { return code; }
  };
};
const call = async (body, headers) => {
  const r = res();
  await forum({ method: "POST", body, headers: headers || {} }, r);
  return r;
};

const member = (over) => Object.assign({
  id: 7, email: "plain@example.com", name: "Plain", kind: "human",
  privilege: null, status: "active"
}, over || {});

const IN_A_YEAR = new Date(Date.now() + 365 * 864e5).toISOString();
const LAST_WEEK = new Date(Date.now() - 7 * 864e5).toISOString();

(async () => {
  const T = globalThis.__T;

  /* --------------------------------------------------- nobody signed in */
  globalThis.__setMe(null);
  globalThis.__setTwin({ known: false });
  let r = await call({ action: "new", title: "A thread", body: "Hello" });
  check(r.code === 401 && r.o.reason === "sign-in",
    "a visitor is refused, and told to sign in rather than to buy anything",
    "status " + r.code + " reason=" + (r.o && r.o.reason));

  r = await call({ action: "me" });
  check(r.code === 200 && r.o.can_post === false && r.o.reason === "sign-in",
    "and the page can see that before it draws the composer",
    "can_post=" + r.o.can_post);

  /* --------------------------------------- a member with no membership */
  globalThis.__setMe(member());
  T.memberships.length = 0;
  r = await call({ action: "new", title: "A thread", body: "Hello" });
  check(r.code === 403 && r.o.reason === "membership",
    "a signed-in member with no membership may read but not write",
    "status " + r.code + " reason=" + (r.o && r.o.reason));
  check(T.posts.length === 0, "and nothing was written for them");

  r = await call({ action: "me" });
  check(r.o.can_post === false && typeof r.o.why === "string" && r.o.why.length > 10,
    "and is told plainly what would let them write",
    r.o.why && r.o.why.slice(0, 46) + "\u2026");

  /* --------------------------------------------- a member in good standing */
  T.memberships.push({ email: "plain@example.com", state: "active", period_end: IN_A_YEAR,
    tier: "patron" });
  r = await call({ action: "new", title: "A thread", body: "Hello there" });
  check(r.code === 200 && r.o.ok === true && T.posts.length === 1,
    "a membership still inside its period may write",
    "status " + r.code + " posts=" + T.posts.length);

  r = await call({ action: "me" });
  check(r.o.can_post === true, "and the composer knows it", "can_post=" + r.o.can_post);

  /* ------------------------------------------------- a lapsed membership */
  T.memberships[0].period_end = LAST_WEEK;
  r = await call({ action: "post", thread_id: T.threads[0].id, body: "Again" });
  check(r.code === 403 && r.o.reason === "membership",
    "a membership whose period has ended no longer may",
    "status " + r.code);

  T.memberships[0].period_end = IN_A_YEAR;
  T.memberships[0].state = "cancelled";
  r = await call({ action: "post", thread_id: T.threads[0].id, body: "Again" });
  check(r.code === 403, "and neither may one that was cancelled", "status " + r.code);
  T.memberships[0].state = "active";

  /* --------------------------------------------------- the order's own keys */
  for (const priv of ["admin", "owner"]) {
    globalThis.__setMe(member({ privilege: priv, email: priv + "@example.com" }));
    r = await call({ action: "post", thread_id: T.threads[0].id, body: "From " + priv });
    check(r.code === 200, "an " + priv + " may write without a membership",
      "status " + r.code);
  }

  /* ------------------------------------------------- the house's constructs */
  globalThis.__setMe(member({ id: 99, kind: "bot", email: "gink@forum.egregora" }));
  r = await call({ action: "post", thread_id: T.threads[0].id, body: "A construct speaks" });
  check(r.code === 200, "the house's own constructs are not shut out of their own room",
    "status " + r.code);

  /* --------------------------------------------- a member of the twin house */
  globalThis.__setMe(null);
  globalThis.__setTwin({
    known: true,
    member: { id: 3, name: "Twin", email: "twin@example.com", kind: "human",
      privilege: null, membership: null, display_name: "A twin member" }
  });
  /* A twin member is recognised by their own house's session token, so one has
     to be carried for the vouching door to be asked at all. */
  const TWIN_HEADERS = { authorization: "Bearer twin-session-token" };
  r = await call({ action: "post", thread_id: T.threads[0].id, body: "From over there" }, TWIN_HEADERS);
  check(r.code === 403, "a twin member with nothing vouched for them may not write either",
    "status " + r.code);

  globalThis.__setTwin({
    known: true,
    member: { id: 3, name: "Twin", email: "twin@example.com", kind: "human",
      privilege: null, membership: "patron", display_name: "A twin member" }
  });
  r = await call({ action: "post", thread_id: T.threads[0].id, body: "From over there" }, TWIN_HEADERS);
  check(r.code === 200,
    "a twin member whose house vouched for a membership may write here",
    "status " + r.code);

  globalThis.__setTwin({
    known: true,
    member: { id: 4, name: "Boss", email: "boss@example.com", kind: "human",
      privilege: "owner", membership: null }
  });
  r = await call({ action: "post", thread_id: T.threads[0].id, body: "The owner across the way" }, TWIN_HEADERS);
  check(r.code === 200, "and so may the twin's owner", "status " + r.code);

  /* ----------------------------------------------------- reading stays open */
  globalThis.__setMe(null);
  globalThis.__setTwin({ known: false });
  r = await call({ action: "threads" });
  check(r.code === 200, "reading the list needs no account at all", "status " + r.code);
  r = await call({ action: "thread", thread_id: T.threads[0].id });
  check(r.code === 200, "and neither does reading a thread", "status " + r.code);

  console.log(fails ? "\n" + fails + " FAILURE(S)" : "\nall passed");
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error("harness:", e); process.exit(1); });
