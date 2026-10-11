/* Encodes known signals with the real vendor/flac-encoder.js, then decodes
   them with libsndfile (python soundfile) and demands sample-exact round
   trips: silence, a tone, noise, stereo, an odd length that is not a whole
   number of FLAC blocks, and a rate outside the usual pair. */
const fs = require("fs");
const { execSync } = require("child_process");

const src = fs.readFileSync("hatchable/public/assets/js/vendor/flac-encoder.js", "utf8")
  .replace(/^export function/gm, "function");
const mod = { exports: null };
new Function("module", src + "\nmodule.exports = { encodeFlac };")(mod);
const { encodeFlac } = mod.exports;

const quant = (f) => { const o = new Int16Array(f.length);
  for (let i = 0; i < f.length; i++) { const v = Math.max(-1, Math.min(1, f[i])); o[i] = v < 0 ? v * 0x8000 : v * 0x7fff; }
  return o; };

const cases = [];
const sr = 44100;
let mono = new Float32Array(sr * 2);
for (let i = 0; i < mono.length; i++) mono[i] = 0.4 * Math.sin(2 * Math.PI * 440 * i / sr);
cases.push(["tone mono", sr, [mono]]);
cases.push(["silence", sr, [new Float32Array(5000)]]);
let noise = new Float32Array(9001);   /* odd length, partial last block */
let seed = 42;
for (let i = 0; i < noise.length; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; noise[i] = (seed / 0x40000000) - 1; }
cases.push(["noise odd length", sr, [noise]]);
let L = new Float32Array(sr * 3), R = new Float32Array(sr * 3);
for (let i = 0; i < L.length; i++) { L[i] = 0.3 * Math.sin(2 * Math.PI * 220 * i / sr); R[i] = 0.3 * Math.sin(2 * Math.PI * 330 * i / sr + 1); }
cases.push(["stereo 3s", sr, [L, R]]);
let hi = new Float32Array(48000);
for (let i = 0; i < hi.length; i++) hi[i] = 0.5 * Math.sin(2 * Math.PI * 1000 * i / 48000);
cases.push(["48 kHz", 48000, [hi]]);

let fails = 0;
for (const [name, rate, chans] of cases) {
  const flac = encodeFlac({ sampleRate: rate, channels: chans });
  const path = "/tmp/flac-test-" + name.replace(/\W+/g, "_") + ".flac";
  fs.writeFileSync(path, flac);
  fs.writeFileSync(path + ".expect", Buffer.concat([...chans.map(quant)].flatMap(() => [])));  /* placeholder */
  /* write the expected int16 interleaved for python */
  const n = chans[0].length, nch = chans.length;
  const inter = new Int16Array(n * nch);
  const q = chans.map(quant);
  for (let i = 0; i < n; i++) for (let c = 0; c < nch; c++) inter[i * nch + c] = q[c][i];
  fs.writeFileSync(path + ".expect", Buffer.from(inter.buffer));

  const py = execSync(`python3 - <<'PY'
import soundfile as sf, numpy as np, sys
data, rate = sf.read("${path}", dtype="int16", always_2d=True)
np.save("${path}.got.npy", data)
print(rate, data.shape[0], data.shape[1])
PY`).toString().trim();
  const got = new Int16Array(new Uint8Array(fs.readFileSync(path + ".got.npy").subarray(128)).buffer);  /* .npy header is 128 bytes for this shape */
  const [grate, gframes, gch] = py.split(" ").map(Number);
  const exact = got.length === inter.length && got.every((v, i) => v === inter[i]);
  if (grate === rate && gframes === n && gch === nch && exact) {
    console.log("PASS", name, "(" + flac.length + " bytes flac, " + inter.length + " samples exact, " + grate + " Hz)");
  } else {
    fails++;
    let firstBad = -1;
    for (let i = 0; i < Math.min(got.length, inter.length); i++) if (got[i] !== inter[i]) { firstBad = i; break; }
    console.log("FAIL", name, "rate=" + grate, "frames=" + gframes + "/" + n, "ch=" + gch, "exact=" + exact, "firstBad=" + firstBad);
  }
}
console.log(fails ? fails + " FAIL" : cases.length + " pass, 0 fail");
process.exit(fails ? 1 : 0);
