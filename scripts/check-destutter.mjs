#!/usr/bin/env node
/* Runs the REAL de-stutter in the built media-admin.js end to end: the
   page is loaded in jsdom, Web Audio is stubbed with buffers backed by
   real Float32Arrays, and a synthetic episode is pushed through the real
   "Enhance it" button with the de-stutter ticked.

   The episode holds, in order:
     - a long fluent passage (must not be touched)
     - "b — b — but":  a true stutter; the first b must be muted, the
                       last repeat and the word must stand
     - "I — I — I mean": the last "I" IS the word; only the first two go
     - "wait ... wait": a chosen repetition — must not be touched
     - "no no please":  short real words — must not be touched
     - another long fluent passage.
   Anything less than that score is a failure. */
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const ROOT = new URL("..", import.meta.url).pathname;
const HTML = readFileSync(ROOT + "hatchable/public/podcast/index.html", "utf8");

const problems = [];
const notes = [];
const say = (t) => notes.push(t);

const RATE = 16000, SECS = 20.5, N = Math.floor(RATE * SECS);

let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff * 2 - 1;
const chan = new Float32Array(N);
for (let i = 0; i < N; i++) chan[i] = rnd() * 0.001;
const tone = (a, b, f, amp) => {
  for (let i = Math.floor(a * RATE); i < Math.floor(b * RATE); i++)
    chan[i] += amp * Math.sin(2 * Math.PI * f * i / RATE);
};

tone(0.50, 2.50, 155, 0.28);          /* fluent passage one */
tone(3.00, 3.10, 140, 0.30);          /* b   — muted */
tone(3.18, 3.28, 140, 0.30);          /* b   — kept (last repeat) */
tone(3.36, 3.81, 140, 0.30);          /* but — the word, kept */
tone(4.50, 4.62, 200, 0.30);          /* I   — muted */
tone(4.72, 4.84, 200, 0.30);          /* I   — muted */
tone(4.94, 5.06, 200, 0.30);          /* I   — kept (it IS the word) */
tone(5.16, 5.56, 200, 0.30);          /* mean — kept */
tone(6.20, 6.65, 180, 0.30);          /* wait — chosen repeat, kept */
tone(7.05, 7.50, 180, 0.30);          /* wait — kept */
tone(8.20, 8.45, 190, 0.30);          /* no   — kept */
tone(8.60, 8.85, 190, 0.30);          /* no   — kept */
tone(9.00, 9.40, 170, 0.30);          /* please — kept */
tone(10.00, 20.00, 150, 0.28);        /* fluent passage two */

const SYNTH = {
  numberOfChannels: 1, length: N, sampleRate: RATE, duration: SECS,
  getChannelData: () => chan
};
const rms = (arr, a, b) => {
  let s = 0, n = 0;
  for (let i = Math.floor(a * RATE); i < Math.floor(b * RATE); i++) { s += arr[i] * arr[i]; n++; }
  return Math.sqrt(s / Math.max(1, n));
};

const created = [];
const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} });
class FakeCtx {
  constructor() { this.destination = {}; this._src = null; }
  async decodeAudioData() { return SYNTH; }
  createBuffer(chans, len, rate) {
    const data = Array.from({ length: chans }, () => new Float32Array(len));
    const b = { numberOfChannels: chans, length: len, sampleRate: rate,
      duration: len / rate, getChannelData: (c) => data[c] };
    created.push(b);
    return b;
  }
  createBufferSource() {
    const self = this;
    return { buffer: null, connect() {}, start() { self._src = this.buffer; } };
  }
  createGain() { return { gain: param(), value: 1, connect() {} }; }
  createBiquadFilter() { return { type: "", frequency: param(), Q: param(), gain: param(), connect() {} }; }
  createDynamicsCompressor() {
    return { threshold: param(), knee: param(), ratio: param(), attack: param(), release: param(), connect() {} };
  }
  async startRendering() { return this._src || SYNTH; }
  close() {}
}

const dom = new JSDOM(HTML, {
  url: "https://egregora.hatchable.site/podcast/",
  runScripts: "outside-only",
  pretendToBeVisual: true
});
const w = dom.window;
w.AudioContext = FakeCtx;
w.webkitAudioContext = FakeCtx;
w.OfflineAudioContext = FakeCtx;
w.addEventListener("error", (e) => problems.push("window error: " + e.message));
process.on("unhandledRejection", (r) =>
  problems.push("unhandled rejection: " + (r && r.message ? r.message : r)));

const fake = (obj, status) => ({
  ok: (status || 200) < 400, status: status || 200,
  json: async () => obj, text: async () => JSON.stringify(obj)
});
w.fetch = async (url, opts) => {
  const u = String(url);
  let body = {};
  try { body = opts && opts.body ? JSON.parse(opts.body) : {}; } catch { body = {}; }
  if (u.includes("/api/media")) {
    if (body.action === "shelf" || body.action === "list") return fake({ ok: true, items: [] });
    if (body.action === "next-number") return fake({ ok: true, number: "005" });
    return fake({ ok: true, item: {} });
  }
  return fake({ ok: true });
};
w.prompt = () => "8===D";
w.confirm = () => true;
w.URL.createObjectURL = () => "blob:fake";
w.URL.revokeObjectURL = () => {};

let src = readFileSync(ROOT + "hatchable/public/assets/js/media-admin.js", "utf8");
/* Strip the ES-module imports jsdom cannot resolve — both the multi-line
   named form (import {\n a,\n b\n} from "./x") and the single-line one. */
src = src.replace(/import\s+{[^}]*}\s+from\s+["'][^"']*["'];?/g, "");
src = src.replace(/^\s*import\s[^;]+;?\s*$/gm, "");
src = src.replace(/^\s*export\s+/gm, "");
/* media-admin.js imports the progress liveness reporter as an ES module.
   The harness cannot resolve module paths, so the real module's source —
   not a stub — is laid into the same scope ahead of it. */
const progressLive = readFileSync(ROOT + "hatchable/public/assets/js/progress-live.js", "utf8")
  .replace(/^\s*export\s+/gm, "");
w.eval("(function(){" + progressLive + "\nfunction countdown(){} \n" + src + "\n})();");

const $ = (s) => w.document.querySelector(s);
const tick = (ms) => new Promise((go) => setTimeout(go, ms));
const click = (s) => { const n = $(s); if (n) n.dispatchEvent(new w.Event("click", { bubbles: true })); };
await tick(30);

click("[data-am=open]");
const pass = $("[data-am=pass]");
if (pass) pass.value = "8===D";
click("[data-am=signin]");
await tick(30);

/* This test is about the de-stutter alone: the gate and the gap-closer
   are unticked, the de-stutter ticked (it ships unticked, on purpose). */
const set = (name, on) => {
  const b = w.document.querySelector('[data-want="' + name + '"]');
  if (!b) { problems.push("no box " + name); return; }
  b.checked = on;
};
set("gaps", false); set("denoise", false); set("destutter", true);

const fileInput = $("[data-am=file]");
const f = new w.File([new w.Blob([new Uint8Array(64)])], "ep.wav", { type: "audio/wav" });
Object.defineProperty(fileInput, "files", { value: [f] });
fileInput.dispatchEvent(new w.Event("change", { bubbles: true }));
await tick(60);

click("[data-am=run]");
await tick(900);
const after = $("[data-am=msg]").textContent.trim();
say("enhance msg: " + after);
const readout = $("[data-am=after]").textContent.replace(/\s+/g, " ").trim();
say("after readout: " + readout);

/* the last full-length buffer is the final pass's output */
const outBuf = created.filter((b) => b.length === N).pop();
if (!outBuf) {
  problems.push("the de-stutter never wrote an output buffer");
} else {
  const out = outBuf.getChannelData(0);
  const kept = (label, a, b) => {
    const rIn = rms(chan, a, b), rOut = rms(out, a, b);
    const pct = Math.round(100 * rOut / rIn);
    say(label + ": " + pct + "% kept");
    if (rOut < 0.8 * rIn) problems.push(label + " was touched (" + pct + "% kept)");
  };
  const muted = (label, a, b) => {
    const rOut = rms(out, a, b);
    say(label + ": out rms " + rOut.toFixed(4));
    if (rOut > 0.02) problems.push(label + " survived (rms " + rOut.toFixed(4) + ")");
  };

  muted("stutter b (first)", 3.02, 3.08);
  kept("stutter b (last repeat)", 3.20, 3.26);
  kept("the word 'but'", 3.40, 3.75);
  muted("'I' (first)", 4.52, 4.60);
  muted("'I' (second)", 4.74, 4.82);
  kept("'I' (the word itself)", 4.96, 5.04);
  kept("the word 'mean'", 5.20, 5.50);
  kept("chosen 'wait' (one)", 6.25, 6.60);
  kept("chosen 'wait' (two)", 7.10, 7.45);
  kept("'no' (one)", 8.22, 8.42);
  kept("'no' (two)", 8.62, 8.82);
  kept("the word 'please'", 9.05, 9.35);
  kept("fluent passage one", 0.80, 2.20);
  kept("fluent passage two", 10.50, 19.50);

  if (!/muted at 2 places/.test(after + readout))
    problems.push("the report does not name the two stutter places");
}

await tick(50);
console.log("--- notes ---");
for (const n of notes) console.log("  " + n);
console.log("--- problems ---");
if (!problems.length) console.log("  none");
for (const p of problems) console.log("  " + p);
process.exit(problems.length ? 1 : 0);
