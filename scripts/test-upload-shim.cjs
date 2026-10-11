/* assembleUpload must survive runtimes whose Buffer is not Node's.
   Runs the real lib three ways: real Node Buffer; a shim whose allocUnsafe
   returns a plain Uint8Array (what the platform has been seen to do); and
   that shim with the zero-copy wrap also refused. Bytes must match exactly
   in every case. */
const fs = require("fs");
const crypto = require("crypto");
const nodeBuffer = Buffer;

let lib = fs.readFileSync("hatchable/lib/upload-parts.js", "utf8")
  .replace(/^export class /gm, "class ")
  .replace(/^export function /gm, "function ")
  .replace(/^export async function /gm, "async function ");

function load(bufferImpl) {
  const mod = { exports: null };
  new Function("module", "Buffer", lib + "\nmodule.exports = { assembleUpload, UploadAssemblyError };")(mod, bufferImpl);
  return mod.exports;
}

const original = crypto.randomBytes(5 * 1024 * 1024 + 777);
const b64 = original.toString("base64");
const CHUNK = 1000000;
const parts = [];
for (let i = 0; i < b64.length; i += CHUNK) parts.push(b64.slice(i, i + CHUNK));

const db = { query: async (sql, a) => {
  if (/AS encoded_length/.test(sql)) {
    return { rows: parts.map((p, i) => ({ seq: i, encoded_length: p.length, tail: p.slice(-2) })) };
  }
  return { rows: [{ part: parts[a[1]] }] };
} };

const shimNoWrite = {
  allocUnsafe: (n) => new Uint8Array(n),        /* the platform's behaviour */
  from: nodeBuffer.from.bind(nodeBuffer),        /* base64 + wrap both work */
};
const shimNoWrap = {
  allocUnsafe: (n) => new Uint8Array(n),
  from: (arg, enc) => {
    if (typeof arg !== "string") throw new Error("wrap refused");
    return nodeBuffer.from(arg, enc);
  },
};

let fails = 0;
async function run(name, impl) {
  const { assembleUpload } = load(impl);
  const whole = await assembleUpload(db, "u-test", { maxBytes: 460 * 1024 * 1024 });
  const out = nodeBuffer.from(whole.buffer ? nodeBuffer.from(whole) : whole);
  const ok = out.equals(original);
  const isBufferLike = typeof whole.set === "function" && whole.length === original.length;
  if (ok && isBufferLike) console.log("PASS", name, "(" + whole.length + " bytes, write=" + (typeof whole.write) + ")");
  else { fails++; console.log("FAIL", name, "equals=" + ok, "len=" + whole.length); }
}

(async () => {
  await run("real node Buffer", nodeBuffer);
  await run("shim: allocUnsafe -> Uint8Array", shimNoWrite);
  await run("shim: and wrap refused", shimNoWrap);
  console.log(fails ? fails + " FAIL" : "3 pass, 0 fail");
  process.exit(fails ? 1 : 0);
})();
