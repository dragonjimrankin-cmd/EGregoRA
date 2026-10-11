/* Drives the real /api/media finish+replace assembly (now via the shared
   lib/upload-parts.js) with a stubbed db: chunks in, one glued buffer out,
   bytes must match exactly. */
const fs = require("fs");
const crypto = require("crypto");

let src = fs.readFileSync("hatchable/api/media.js", "utf8");
src = src
  .replace(/^import .*$/gm, "")
  .replace(/^export const /gm, "const ")
  .replace(/^export default async function/m, "const handler = async function")
  + "\nmodule.exports = handler;\n";

let lib = fs.readFileSync("hatchable/lib/upload-parts.js", "utf8")
  .replace(/^export class /gm, "class ")
  .replace(/^export function /gm, "function ")
  .replace(/^export async function /gm, "async function ");

const stubs = [
  "const ai = { generateText: async () => { throw new Error('offline'); } };",
  "let CHUNKS = {};",
  "let PUTS = [];",
  "const db = { query: async (sql, args) => {",
  "  if (/INSERT INTO media_chunks/.test(sql)) { (CHUNKS[args[0]] = CHUNKS[args[0]] || {})[args[1]] = args[2]; return { rows: [] }; }",
  "  if (/DELETE FROM media_chunks WHERE upload_id/.test(sql) && !/INTERVAL/.test(sql)) { delete CHUNKS[args[0]]; return { rows: [] }; }",
  "  if (/DELETE FROM media_chunks WHERE at </.test(sql)) return { rows: [] };",
  "  const partsOf = (u) => { const c = CHUNKS[u] || {}; return Object.keys(c).sort((a,b)=>a-b).map(k=>c[k]); };",
  "  if (/AS encoded_length/.test(sql)) return { rows: partsOf(args[0]).map((p,i)=>({ seq: i, encoded_length: p.length, tail: p.slice(-2) })) };",
  "  if (/AND seq = /.test(sql)) { const c = CHUNKS[args[0]] || {}; return { rows: c[args[1]] != null ? [{ part: c[args[1]] }] : [] }; }",
  "  if (/INSERT INTO media/.test(sql)) return { rows: [{ id: 7, kind: args[0], title: args[2], state: 'published' }] };",
  "  if (/UPDATE media SET storage_key/.test(sql)) return { rows: [] };",
  "  if (/SELECT storage_key, kind FROM media/.test(sql)) return { rows: [{ storage_key: 'episodes/x.mp3', kind: 'audio' }] };",
  "  return { rows: [] };",
  "} };",
  "const storage = { put: async (key, buf, mime) => { PUTS.push({ key, len: buf.length, mime }); } };",
  "const adminDoor = async () => ({ ok: true, who: 'test' });",
  /* Publishing now belongs to a signed-in member as well as to the key, so
     the harness stands one in. Shape follows lib/accounts.js whoAmI(). */
  "const whoAmI = async () => ({ id: 3, email: 'archivist@example.com', name: 'The Archivist',",
  "  verified: true, age_verified: true, id_status: 'accepted', privilege: 'admin', status: 'active' });",
  "const freeDoors = []; const freeChat = async () => { throw new Error('offline'); };",
].join("\n");

const mod = { exports: null };
new Function("module", stubs + "\n" + lib + "\n" + src + "\nglobalThis.__PUTS = () => PUTS;")(mod);
const handler = mod.exports;

const res = () => { let out = null, code = 200; return { status(c){ code = c; return this; }, json(o){ out = o; return this; }, get o(){ return out; }, get code(){ return code; } }; };

async function upload(name, bytes) {
  let r = res();
  await handler({ body: { action: "begin", pass: "x", upload: name, mime: "audio/wav" } }, r);
  const raw = Math.floor((r.o.chunk_max || 1468006) * 0.74);
  for (let i = 0, s = 0; i < bytes.length; i += raw, s++) {
    await handler({ body: { action: "chunk", pass: "x", upload: name, seq: s, part: bytes.subarray(i, Math.min(bytes.length, i + raw)).toString("base64") } }, res());
  }
  r = res();
  await handler({ body: { action: "finish", pass: "x", upload: name, kind: "audio", title: "Test episode", mime: "audio/wav", after: 0, publish: true } }, r);
  return r;
}

(async () => {
  const small = crypto.randomBytes(3 * 1024 * 1024 + 12345);
  let r = await upload("usmall", small);
  let put = globalThis.__PUTS().pop();
  console.log((r.code === 200 && put && put.len === small.length ? "PASS" : "FAIL") +
    " small upload glued byte-exact (stored " + (put && put.len) + ")");

  const big = crypto.randomBytes(250 * 1024 * 1024);
  const t = Date.now();
  r = await upload("ubig", big);
  put = globalThis.__PUTS().pop();
  console.log((r.code === 200 && put && put.len === big.length ? "PASS" : "FAIL") +
    " 250MB upload survived finish in " + Math.round((Date.now() - t) / 1000) + "s (stored " + (put && put.len) + ")");
  if (r.code !== 200) console.log("  error:", r.o && r.o.error);

  const huge = Buffer.alloc(470 * 1024 * 1024, 7);
  r = await upload("uhuge", huge);
  console.log((r.code === 413 ? "PASS" : "FAIL") + " over-cap upload refused with " + r.code + " (" + (r.o && r.o.error) + ")");

  process.exit(0);
})().catch((e) => { console.error("harness error", e); process.exit(1); });
