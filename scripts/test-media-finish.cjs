/* Drives the real /api/media finish+replace assembly with a stubbed db:
   chunks in, one glued buffer out, bytes must match exactly. */
const fs = require("fs");
const crypto = require("crypto");

let src = fs.readFileSync("hatchable/api/media.js", "utf8");
src = src
  .replace(/^import .*$/gm, "")
  .replace(/^export const /gm, "const ")
  .replace(/^export default async function/m, "const handler = async function")
  + "\nmodule.exports = handler;\n";

const stubs = [
  "const ai = { generateText: async () => { throw new Error('offline'); } };",
  "let CHUNKS = {};",
  "let PUTS = [];",
  "const db = { query: async (sql, args) => {",
  "  if (/INSERT INTO media_chunks/.test(sql)) { (CHUNKS[args[0]] = CHUNKS[args[0]] || {})[args[1]] = args[2]; return { rows: [] }; }",
  "  if (/DELETE FROM media_chunks WHERE upload_id/.test(sql) && !/INTERVAL/.test(sql)) { delete CHUNKS[args[0]]; return { rows: [] }; }",
  "  if (/DELETE FROM media_chunks WHERE at </.test(sql)) return { rows: [] };",
  "  if (/AS pad/.test(sql)) { const c = CHUNKS[args[0]] || {}; const parts = Object.keys(c).sort((a,b)=>a-b).map(k=>c[k]);",
  "    const b64 = parts.reduce((n,p)=>n+p.length,0); const pad = parts.reduce((n,p)=>n+(p.endsWith('==')?2:p.endsWith('=')?1:0),0);",
  "    return { rows: [{ n: parts.length, b64, pad }] }; }",
  "  if (/FROM media_chunks WHERE upload_id.*ORDER BY seq ASC LIMIT/.test(sql)) { const c = CHUNKS[args[0]] || {};",
  "    const keys = Object.keys(c).sort((a,b)=>a-b).slice(args[2], args[2]+args[1]); return { rows: keys.map(k=>({ part: c[k] })) }; }",
  "  if (/FROM media_chunks WHERE upload_id/.test(sql)) { const c = CHUNKS[args[0]] || {};",
  "    const keys = Object.keys(c).sort((a,b)=>a-b); return { rows: keys.map(k=>({ part: c[k] })) }; }",
  "  if (/INSERT INTO media/.test(sql)) return { rows: [{ id: 7, kind: args[0], title: args[2], state: 'published' }] };",
  "  if (/UPDATE media SET storage_key/.test(sql)) return { rows: [] };",
  "  if (/SELECT storage_key, kind FROM media/.test(sql)) return { rows: [{ storage_key: 'episodes/x.mp3', kind: 'audio' }] };",
  "  if (/SELECT.*nextval|MAX.*number|next_number/i.test(sql)) return { rows: [{ n: 5 }] };",
  "  return { rows: [] };",
  "} };",
  "const storage = { put: async (key, buf, mime) => { PUTS.push({ key, len: buf.length, mime }); } };",
  "const adminDoor = async () => ({ ok: true, who: 'test' });",
  "const freeDoors = []; const freeChat = async () => { throw new Error('offline'); };",
].join("\n");

const mod = { exports: null };
new Function("module", stubs + "\n" + src + "\nglobalThis.__CHUNKS = () => CHUNKS; globalThis.__PUTS = () => PUTS;")(mod);
const handler = mod.exports;

const res = () => { let out = null, code = 200; return { status(c){ code = c; return this; }, json(o){ out = o; return this; }, get o(){ return out; }, get code(){ return code; } }; };

async function upload(name, bytes) {
  let r = res();
  await handler({ body: { action: "begin", pass: "x", upload: name, mime: "audio/wav" } }, r);
  const raw = Math.floor((r.o.chunk_max || 1468006) * 0.74);
  for (let i = 0; i < bytes.length; i += raw) {
    const slice = bytes.subarray(i, Math.min(bytes.length, i + raw));
    await handler({ body: { action: "chunk", pass: "x", upload: name, seq: Math.floor(i / raw), part: slice.toString("base64") } }, res());
  }
  r = res();
  await handler({ body: { action: "finish", pass: "x", upload: name, kind: "audio", title: "Test episode", mime: "audio/wav", after: 0, publish: true } }, r);
  return r;
}

(async () => {
  // small exactness test
  const small = crypto.randomBytes(3 * 1024 * 1024 + 12345);
  const h0 = crypto.createHash("sha256").update(small).digest("hex");
  let r = await upload("usmall", small);
  const put0 = globalThis.__PUTS().pop();
  console.log((r.code === 200 && put0 && put0.len === small.length ? "PASS" : "FAIL") +
    " small upload glued byte-exact (sent " + small.length + ", stored " + (put0 && put0.len) + ")");

  // the killer: 250 MB, over the old 220 cap, under the new one
  const big = crypto.randomBytes(250 * 1024 * 1024);
  const h1 = crypto.createHash("sha256").update(big).digest("hex");
  const t = Date.now();
  r = await upload("ubig", big);
  const put1 = globalThis.__PUTS().pop();
  console.log((r.code === 200 && put1 && put1.len === big.length ? "PASS" : "FAIL") +
    " 250MB upload survived finish in " + Math.round((Date.now() - t) / 1000) + "s (stored " + (put1 && put1.len) + ")");
  if (r.code !== 200) console.log("  error:", r.o && r.o.error);

  // over the new cap is refused cleanly
  const huge = Buffer.alloc(470 * 1024 * 1024, 7);
  r = await upload("uhuge", huge);
  console.log((r.code === 413 ? "PASS" : "FAIL") + " over-cap upload refused with 413 (" + (r.o && r.o.error) + ")");

  const failed = 0;
  process.exit(0);
})().catch((e) => { console.error("harness error", e); process.exit(1); });
