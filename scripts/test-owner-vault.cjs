/* The owner's vault, driven through the real api/media.js and api/owner.js.

   Two claims are under test. First, that every save an editor makes leaves a
   row in owner_archive carrying the storage key rather than a pointer at the
   shelf. Second, that the only way to read those rows, or to sign a link to
   the file behind them, is owner mode — an admin is deliberately not enough. */
const fs = require("fs");

const strip = (p) => fs.readFileSync(p, "utf8")
  /* api/owner.js spreads one import across three lines, so the single-line
     rule alone would leave "} from '../lib/door.js';" behind. */
  .replace(/^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]*['"];?/gm, "")
  .replace(/^import .*$/gm, "")
  .replace(/^export const /gm, "const ")
  .replace(/^export default async function/m, "const handler = async function")
  + "\nmodule.exports = handler;\n";

let src = strip("hatchable/api/media.js");
let lib = fs.readFileSync("hatchable/lib/upload-parts.js", "utf8")
  .replace(/^export class /gm, "class ")
  .replace(/^export function /gm, "function ")
  .replace(/^export async function /gm, "async function ");

/* A shelf row that stands in for whatever the editor has just saved. */
const ROW = "const ROW = { id: 41, kind: 'audio', title: 'The ninth limb', state: 'published',";
const ROW2 = "  storage_key: 'episodes/1-ninth.mp3', mime: 'audio/mpeg', bytes: 5242880, seconds: 913 };";

const stubs = [
  "const ai = { generateText: async () => { throw new Error('offline'); } };",
  "let CHUNKS = {};",
  "let PUTS = [];",
  "let VAULT = [];",
  "let vaultBroken = false;",
  ROW, ROW2,
  "const db = { query: async (sql, args) => {",
  "  if (/INSERT INTO media_chunks/.test(sql)) { (CHUNKS[args[0]] = CHUNKS[args[0]] || {})[args[1]] = args[2]; return { rows: [] }; }",
  "  if (/DELETE FROM media_chunks/.test(sql)) return { rows: [] };",
  /* The row under test. Anything the vault writes is kept verbatim. */
  "  if (/INSERT INTO owner_archive/.test(sql)) {",
  "    if (vaultBroken) throw new Error('the vault is shut');",
  "    VAULT.push({ media_id: args[0], kind: args[1], title: args[2], storage_key: args[3],",
  "      mime: args[4], bytes: args[5], seconds: args[6], state: args[7], did: args[8],",
  "      note: args[9], saved_by: args[10] });",
  "    return { rows: [] }; }",
  "  if (/UPDATE media SET state = \\$1/.test(sql)) return { rows: [Object.assign({}, ROW, { state: args[0] })] };",
  "  if (/UPDATE media SET title = COALESCE/.test(sql)) return { rows: [Object.assign({}, ROW, { title: args[1] || ROW.title })] };",
  "  if (/UPDATE media SET storage_key/.test(sql)) return { rows: [] };",
  "  if (/SELECT \\* FROM media WHERE id/.test(sql)) return { rows: [ROW] };",
  "  if (/DELETE FROM media WHERE id/.test(sql)) return { rows: [] };",
  /* The inserted row, built from what the editor actually sent: the column
     order follows the INSERT in api/media.js. Standing in with the fixed
     fixture here would prove nothing about the key or the weight. */
  "  if (/INSERT INTO media/.test(sql)) return { rows: [{ id: 77, kind: args[0], title: args[1],",
  "    storage_key: args[7], mime: args[8], bytes: args[9], seconds: args[5], state: args[12] }] };",
  "  const partsOf = (u) => { const c = CHUNKS[u] || {}; return Object.keys(c).sort((a,b)=>a-b).map(k=>c[k]); };",
  "  if (/AS encoded_length/.test(sql)) return { rows: partsOf(args[0]).map((p,i)=>({ seq: i, encoded_length: p.length, tail: p.slice(-2) })) };",
  "  if (/AND seq = /.test(sql)) { const c = CHUNKS[args[0]] || {}; return { rows: c[args[1]] != null ? [{ part: c[args[1]] }] : [] }; }",
  "  return { rows: [] };",
  "} };",
  "const storage = {",
  "  put: async (key, buf, mime) => { PUTS.push({ key, len: buf.length, mime }); },",
  "  url: async (key) => 'https://store.example/' + key,",
  "  delete: async () => {}",
  "};",
  "const adminDoor = async () => ({ ok: true, who: 'test' });",
  "const whoAmI = async () => ({ id: 3, email: 'archivist@example.com', name: 'The Archivist',",
  "  verified: true, age_verified: true, id_status: 'accepted', privilege: 'admin', status: 'active' });",
  "const freeDoors = []; const freeChat = async () => { throw new Error('offline'); };",
].join("\n");

const mod = { exports: null };
new Function("module", stubs + "\n" + lib + "\n" + src +
  "\nglobalThis.__VAULT = () => VAULT;" +
  "\nglobalThis.__resetVault = () => { VAULT = []; };" +
  "\nglobalThis.__breakVault = (b) => { vaultBroken = !!b; };")(mod);
const media = mod.exports;

const res = () => {
  let out = null, code = 200;
  return { status(c) { code = c; return this; }, json(o) { out = o; return this; },
    get o() { return out; }, get code() { return code; } };
};

let fails = 0;
const check = (ok, label, extra) => {
  console.log((ok ? "PASS " : "FAIL ") + label + (extra ? "  — " + extra : ""));
  if (!ok) fails++;
};

/* A real chunked upload through begin/chunk/finish, the way the editor does it. */
async function saveNew(name, bytes, publish) {
  let r = res();
  await media({ body: { action: "begin", pass: "x", upload: name, mime: "audio/wav" } }, r);
  const raw = Math.floor((r.o.chunk_max || 1468006) * 0.74);
  for (let i = 0, s = 0; i < bytes.length; i += raw, s++) {
    await media({ body: { action: "chunk", pass: "x", upload: name, seq: s,
      part: bytes.subarray(i, Math.min(bytes.length, i + raw)).toString("base64") } }, res());
  }
  r = res();
  await media({ body: { action: "finish", pass: "x", upload: name, kind: "audio",
    title: "The ninth limb", mime: "audio/wav", after: 0, publish: publish !== false } }, r);
  return r;
}

(async () => {
  /* ------------------------- 0. the save the user asked about: a fresh take */
  globalThis.__resetVault();
  const made = await saveNew("uvault", Buffer.alloc(1024 * 1024 + 77, 3), true);
  let rows = globalThis.__VAULT();
  check(made.code === 200 && rows.length === 1 && rows[0].did === "saved-published",
    "saving and publishing a take leaves one vault row",
    rows.length ? rows[0].did : "no row, status " + made.code);
  check(rows[0] && /^episodes\//.test(rows[0].storage_key || "") && rows[0].bytes === 1024 * 1024 + 77,
    "that row names the stored file and its exact weight",
    rows[0] && rows[0].storage_key + " / " + rows[0].bytes);

  globalThis.__resetVault();
  await saveNew("uvaultdraft", Buffer.alloc(2048, 5), false);
  rows = globalThis.__VAULT();
  check(rows.length === 1 && rows[0].did === "saved-draft",
    "saving as a draft is kept too, marked as a draft", rows.length ? rows[0].did : "no row");

  /* ------------------------------------------------ 1. every save is kept */
  const saves = [
    ["publish", { id: 41 }, "published"],
    ["unpublish", { id: 41 }, "unpublished"],
    ["archive", { id: 41 }, "archive"],
    ["restore", { id: 41 }, "restore"],
    ["edit", { id: 41, title: "The ninth limb, revised" }, "edited"],
    ["delete", { id: 41 }, "deleted"],
  ];
  for (const [action, body, did] of saves) {
    globalThis.__resetVault();
    const r = res();
    await media({ body: Object.assign({ action, pass: "x" }, body) }, r);
    const rows = globalThis.__VAULT();
    check(r.code === 200 && rows.length === 1 && rows[0].did === did,
      "a " + action + " leaves one vault row marked '" + did + "'",
      rows.length ? "got " + rows[0].did : "no row, status " + r.code);
  }

  /* ------------------------------------- 2. the row carries the file itself */
  globalThis.__resetVault();
  await media({ body: { action: "archive", pass: "x", id: 41 } }, res());
  const kept = globalThis.__VAULT()[0];
  check(kept && kept.storage_key === "episodes/1-ninth.mp3" && kept.bytes === 5242880,
    "the vault row carries the storage key and the weight, not a pointer at the shelf",
    kept && kept.storage_key + " / " + kept.bytes);
  check(kept && kept.saved_by === "archivist@example.com",
    "the vault row names who saved it", kept && kept.saved_by);

  /* -------------------------------------- 3. a delete keeps the note, not
     the key, because the file went with the shelf entry */
  globalThis.__resetVault();
  await media({ body: { action: "delete", pass: "x", id: 41 } }, res());
  const gone = globalThis.__VAULT()[0];
  check(gone && gone.did === "deleted" && gone.storage_key === null,
    "a delete is recorded with no key, since the file went with it",
    gone && gone.did + " / key=" + gone.storage_key);

  /* --------------------------------------- 4. a shut vault must not cost the
     save. The shelf comes first; the vault is the record of it. */
  globalThis.__resetVault();
  globalThis.__breakVault(true);
  const broke = res();
  await media({ body: { action: "publish", pass: "x", id: 41 } }, broke);
  globalThis.__breakVault(false);
  check(broke.code === 200 && broke.o && broke.o.ok === true,
    "a vault that refuses still leaves the save standing",
    "status " + broke.code);

  /* ------------------------------------------- 5. owner mode is the only door */
  const omod = { exports: null };
  new Function("module", [
    /* The owner room needs its own copy: the media stubs are not in scope
       inside this second compiled module. */
    "const VROW = { id: 41, kind: 'audio', title: 'The ninth limb', state: 'published',",
    "  storage_key: 'episodes/1-ninth.mp3', mime: 'audio/mpeg', bytes: 5242880, seconds: 913 };",
    "const db = { query: async (sql, args) => {",
    "  if (/FROM owner_archive a/.test(sql)) return { rows: [Object.assign({ id: 9, media_id: null,",
    "    shelf_state: null, shelf_title: null }, VROW)] };",
    "  if (/count\\(\\*\\)::int AS n, COALESCE/.test(sql)) return { rows: [{ n: 1, b: 5242880 }] };",
    "  if (/SELECT storage_key, title, mime, kind FROM owner_archive/.test(sql))",
    "    return { rows: [withKey ? VROW : Object.assign({}, VROW, { storage_key: null })] };",
    "  if (/INSERT INTO activity_log/.test(sql)) return { rows: [] };",
    "  return { rows: [] };",
    "} };",
    "let withKey = true;",
    "globalThis.__setKey = (b) => { withKey = !!b; };",
    "const storage = { url: async (key) => 'https://store.example/' + key };",
    "const adminDoor = async () => ({ ok: true, who: 'test' });",
    "const passcode = async () => 'nope';",
    "const ownerPasscode = async () => 'nope';",
    "const issueToken = async () => ({ token: 't', until: new Date() });",
    "const checkToken = async (t, kind) => (t === 'ownerkey' ? { kind: 'owner', until: new Date() } : null);",
    "const closeToken = async () => {};",
    "let PRIV = 'member';",
    "globalThis.__priv = (p) => { PRIV = p; };",
    "const whoAmI = async () => ({ id: 3, email: 'a@b.c', name: 'A', privilege: PRIV, status: 'active' });",
    "const issueCode = async () => {}; const sendCode = async () => {};",
    strip("hatchable/api/owner.js"),
  ].join("\n"))(omod);
  const owner = omod.exports;

  const asMember = res();
  await owner({ body: { action: "vault" } }, asMember);
  check(asMember.code === 401, "a signed-in member who is not the owner is refused the vault",
    "status " + asMember.code);

  globalThis.__priv("admin");
  const asAdmin = res();
  await owner({ body: { action: "vault" } }, asAdmin);
  check(asAdmin.code === 401, "an admin is refused the vault too — it is the founder's copy",
    "status " + asAdmin.code);

  globalThis.__priv("owner");
  const asOwner = res();
  await owner({ body: { action: "vault" } }, asOwner);
  check(asOwner.code === 200 && asOwner.o && Array.isArray(asOwner.o.items) && asOwner.o.total === 1,
    "the owner reads the vault",
    asOwner.o && "items=" + ((asOwner.o.items || []).length) + " total=" + asOwner.o.total);

  const it = (asOwner.o && asOwner.o.items && asOwner.o.items[0]) || null;
  check(it && it.on_shelf === false && it.fetchable === true,
    "a save whose shelf entry is gone is still listed and still fetchable",
    it && "on_shelf=" + it.on_shelf + " fetchable=" + it.fetchable);

  const held = res();
  await owner({ body: { action: "vault", token: "ownerkey" } }, held);
  check(held.code === 200, "a remembered owner key opens it as well", "status " + held.code);

  globalThis.__setKey(true);
  const got = res();
  await owner({ body: { action: "vault-file", id: 9 } }, got);
  check(got.code === 200 && got.o && /store\.example\/episodes\//.test(got.o.url || ""),
    "the owner can sign a link to the stored file", got.o && got.o.url);

  globalThis.__setKey(false);
  const lost = res();
  await owner({ body: { action: "vault-file", id: 9 } }, lost);
  check(lost.code === 410,
    "a save whose file was destroyed says so plainly rather than signing a dead link",
    "status " + lost.code + (lost.o ? " — " + lost.o.error : ""));

  console.log(fails ? "\n" + fails + " FAILURE(S)" : "\nall passed");
  process.exit(fails ? 1 : 0);
})();
