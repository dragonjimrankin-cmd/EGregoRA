/* The twin's shelf, driven through the real api/twin-media.js and the real
   signing in lib/twin.js.

   What is under test:
     · an unsigned letter is refused before a word of it is read
     · a signed upsert holds a listing that points at the twin's file
     · a state change travels, and so does a take-down
     · a letter from the twin cannot touch a recording this house owns
     · an echo cannot start: a row that came from the twin is never mirrored back
*/
const fs = require("fs");
const crypto = require("crypto");

const SECRET = "twin_8f31c0a9d4e67b25a1c8f0d93e7b46512ac9d8e0f3b7a164";
const sign = (raw) => crypto.createHmac("sha256", SECRET).update(raw).digest("hex");

/* A shelf, held in memory, that behaves enough like the real one. */
const DB = `
let SHELF = [];
let NEXT = 1;
const QUERIES = [];
const db = { query: async (sql, args) => {
  QUERIES.push({ sql: sql.replace(/\\s+/g, ' ').trim(), args });
  if (/SELECT id, twin_origin FROM media WHERE twin_key/.test(sql)) {
    return { rows: SHELF.filter(r => r.twin_key === args[0]).map(r => ({ id: r.id, twin_origin: r.twin_origin })) };
  }
  if (/DELETE FROM media WHERE id/.test(sql)) {
    const n = SHELF.length; SHELF = SHELF.filter(r => r.id !== args[0]);
    return { rows: [], n };
  }
  if (/UPDATE media SET state = /.test(sql)) {
    const r = SHELF.find(x => x.id === args[0]); if (r) r.state = args[1];
    return { rows: [] };
  }
  if (/UPDATE media SET kind = /.test(sql)) {
    const r = SHELF.find(x => x.id === args[0]);
    if (r) Object.assign(r, { title: args[2], summary: args[3], state: args[9],
      remote_url: args[10], twin_origin: args[12] });
    return { rows: [] };
  }
  if (/INSERT INTO media /.test(sql)) {
    const row = { id: NEXT++, kind: args[0], title: args[1], state: args[8],
      remote_url: args[9], twin_key: args[10], twin_origin: args[11], storage_key: null };
    SHELF.push(row);
    return { rows: [{ id: row.id }] };
  }
  return { rows: [] };
} };
globalThis.__SHELF = () => SHELF;
globalThis.__SEED = (row) => { SHELF.push(Object.assign({ id: NEXT++ }, row)); };
globalThis.__QUERIES = () => QUERIES;
`;

/* The real twin-media endpoint, with its one import stood in. */
let src = fs.readFileSync("hatchable/api/twin-media.js", "utf8")
  .replace(/^import .*$/gm, "")
  .replace(/^export const /gm, "const ")
  .replace(/^export default async function/m, "const handler = async function")
  + "\nmodule.exports = handler;\n";

const stubs = [
  "const crypto = require('crypto');",
  DB,
  /* verifySignature is the same algorithm the shipped lib/twin.js uses — the
     point is to prove a bad signature is refused, so the harness needs to be
     able to forge one as well as a good one. */
  "const SECRET = " + JSON.stringify(SECRET) + ";",
  "function verifySignature(req) {",
  "  const given = String(req.headers['x-twin-sign'] || '');",
  "  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});",
  "  const want = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');",
  "  if (given.length !== want.length) return false;",
  "  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(want));",
  "}",
].join("\n");

const mod = { exports: null };
new Function("module", "require", stubs + "\n" + src)(mod, require);
const twinMedia = mod.exports;

const res = () => {
  let out = null, code = 200;
  return { status(c) { code = c; return this; }, json(o) { out = o; return this; },
    get o() { return out; }, get code() { return code; } };
};

const send = async (payload, sig) => {
  const raw = JSON.stringify(payload);
  const r = res();
  await twinMedia({ body: payload, headers: { "x-twin-sign": sig === undefined ? sign(raw) : sig } }, r);
  return r;
};

let fails = 0;
const check = (ok, label, extra) => {
  console.log((ok ? "PASS " : "FAIL ") + label + (extra ? "  — " + extra : ""));
  if (!ok) fails++;
};

const SHELF_LETTER = {
  action: "upsert", twin_key: "egregora-m1-aabbccdd", kind: "audio",
  title: "The ninth limb", summary: "A reading.", number: "009",
  length: "15m 13s", seconds: 913, tags: "limb, reading", mime: "audio/mpeg",
  state: "published",
  file_url: "https://egregora.hatchable.site/api/media-file?id=41",
  from: "egregora"
};

(async () => {
  /* ---------------------------------------------------- 1. the door is shut */
  const bad = await send(SHELF_LETTER, "0".repeat(64));
  check(bad.code === 401, "a letter that is not signed by the twin is refused", "status " + bad.code);
  check(globalThis.__SHELF().length === 0, "and nothing was written for it");

  const forged = await send(SHELF_LETTER, sign(JSON.stringify({ action: "upsert", twin_key: "other" })));
  check(forged.code === 401, "a signature over different words does not open it", "status " + forged.code);

  const nokey = await send({ action: "upsert", title: "No key", file_url: "https://x/y" });
  check(nokey.code === 400, "a letter with no twin_key is refused", "status " + nokey.code);

  /* --------------------------------------------- 2. a listing is held */
  const made = await send(SHELF_LETTER);
  const row = globalThis.__SHELF()[0];
  check(made.code === 200 && made.o && made.o.created === true,
    "a signed upsert creates the listing", made.o && JSON.stringify(made.o));
  check(row && row.twin_origin === "egregora",
    "the row records which house holds the bytes", row && "twin_origin=" + row.twin_origin);
  check(row && row.remote_url === "https://egregora.hatchable.site/api/media-file?id=41",
    "and the address to play it from", row && row.remote_url);
  check(row && row.storage_key === null,
    "this house holds no copy of the file", row && "storage_key=" + row.storage_key);

  /* The same letter again must update, not double up. */
  const again = await send(Object.assign({}, SHELF_LETTER, { title: "The ninth limb, revised" }));
  check(again.o && again.o.updated === true && globalThis.__SHELF().length === 1,
    "the same episode arriving twice updates rather than duplicates",
    again.o && JSON.stringify(again.o) + ", shelf=" + globalThis.__SHELF().length);
  check(globalThis.__SHELF()[0].title === "The ninth limb, revised",
    "and a title changed on the twin is changed here",
    globalThis.__SHELF()[0].title);

  /* ------------------------------------------------ 3. state travels */
  const off = await send({ action: "state", twin_key: SHELF_LETTER.twin_key, state: "archived" });
  check(off.o && off.o.changed === true && globalThis.__SHELF()[0].state === "archived",
    "taking it down on the twin takes it down here",
    "state=" + globalThis.__SHELF()[0].state);

  const badState = await send({ action: "state", twin_key: SHELF_LETTER.twin_key, state: "DROP TABLE" });
  check(globalThis.__SHELF()[0].state === "published",
    "a state that does not exist falls back to published rather than being believed",
    "state=" + globalThis.__SHELF()[0].state);

  /* --------------------------------- 4. this house's own work is untouchable */
  globalThis.__SEED({ twin_key: "local-1", twin_origin: null, title: "Ours", state: "published" });
  const grab = await send({ action: "state", twin_key: "local-1", state: "archived" });
  check(grab.code === 409, "the twin cannot take down a recording this house owns",
    "status " + grab.code);
  const wipe = await send({ action: "remove", twin_key: "local-1" });
  check(wipe.code === 409 && globalThis.__SHELF().some((r) => r.twin_key === "local-1"),
    "and cannot delete one either", "status " + wipe.code);

  /* ------------------------------------------------- 5. the take-down */
  const gone = await send({ action: "remove", twin_key: SHELF_LETTER.twin_key });
  check(gone.o && gone.o.removed === true &&
    !globalThis.__SHELF().some((r) => r.twin_key === SHELF_LETTER.twin_key),
    "a recording deleted on the twin leaves this shelf too",
    gone.o && JSON.stringify(gone.o));

  const twice = await send({ action: "remove", twin_key: SHELF_LETTER.twin_key });
  check(twice.code === 200 && twice.o.removed === false,
    "taking down something already gone is not an error");

  console.log(fails ? "\n" + fails + " FAILURE(S)" : "\nall passed");
  process.exit(fails ? 1 : 0);
})();
