#!/usr/bin/env node
/* Runs the REAL denoise gate in the built media-admin.js end to end:
   the page is loaded in jsdom, Web Audio is stubbed with buffers backed by
   real Float32Arrays, and a synthetic episode — two voiced words, an
   isolated cough, a quiet sniff — is pushed through the actual
   "Enhance it" button. Then the gated output is measured: the words must
   survive at full level, the cough and the sniff must be silenced. */
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const ROOT = new URL("..", import.meta.url).pathname;
const HTML = readFileSync(ROOT + "hatchable/public/podcast/index.html", "utf8");

const problems = [];
const notes = [];
const say = (t) => notes.push(t);

const RATE = 16000, SECS = 3, N = RATE * SECS;

/* ---- the synthetic episode ------------------------------------------ */
/* deterministic noise so the test never flaps */
let seed = 42;
const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff * 2 - 1;
const chan = new Float32Array(N);
for (let i = 0; i < N; i++) chan[i] = rnd() * 0.001;              /* room floor */
const tone = (a, b, f, amp) => {
  for (let i = Math.floor(a * RATE); i < Math.floor(b * RATE); i++)
    chan[i] += amp * Math.sin(2 * Math.PI * f * i / RATE);
};
tone(0.50, 0.90, 150, 0.30);                                       /* word one */
for (let i = Math.floor(1.30 * RATE); i < Math.floor(1.45 * RATE); i++)
  chan[i] += rnd() * 0.5;                                          /* a cough */
tone(1.90, 2.30, 160, 0.30);                                       /* word two */
for (let i = Math.floor(2.50 * RATE); i < Math.floor(2.62 * RATE); i++)
  chan[i] += rnd() * 0.004;                                        /* a sniff */

const SYNTH = {
  numberOfChannels: 1, length: N, sampleRate: RATE, duration: SECS,
  getChannelData: () => chan
};
const rms = (arr, a, b) => {
  let s = 0, n = 0;
  for (let i = Math.floor(a * RATE); i < Math.floor(b * RATE); i++) { s += arr[i] * arr[i]; n++; }
  return Math.sqrt(s / Math.max(1, n));
};

/* ---- the Web Audio stub --------------------------------------------- */
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
src = src.replace(/^\s*import\s[^;]+;?\s*$/gm, "");
src = src.replace(/^\s*export\s+/gm, "");
w.eval("(function(){function countdown(){} \n" + src + "\n})();");

const $ = (s) => w.document.querySelector(s);
const tick = (ms) => new Promise((go) => setTimeout(go, ms));
const click = (s) => { const n = $(s); if (n) n.dispatchEvent(new w.Event("click", { bubbles: true })); };
await tick(30);

/* ---- push the synthetic file through the real buttons ---------------- */
click("[data-am=open]");
const pass = $("[data-am=pass]");
if (pass) pass.value = "8===D";
click("[data-am=signin]");
await tick(30);

/* the gap-closer rearranges the timeline; this test is about the gate,
   so it is unticked and everything else runs as delivered. */
const gapBox = w.document.querySelector('[data-want="gaps"]');
if (gapBox) gapBox.checked = false;
const denBox = w.document.querySelector('[data-want="denoise"]');
if (!denBox) problems.push("the denoise box is not on the page");
else say("denoise box present, checked: " + denBox.checked);

const fileInput = $("[data-am=file]");
const f = new w.File([new w.Blob([new Uint8Array(64)])], "ep.wav", { type: "audio/wav" });
Object.defineProperty(fileInput, "files", { value: [f] });
fileInput.dispatchEvent(new w.Event("change", { bubbles: true }));
await tick(60);
say("file msg: " + $("[data-am=msg]").textContent.trim());

click("[data-am=run]");
await tick(400);
const after = $("[data-am=msg]").textContent.trim();
say("enhance msg: " + after);
const readout = $("[data-am=after]").textContent.replace(/\s+/g, " ").trim();
say("after readout: " + readout);

/* ---- measure what the gate actually did ------------------------------ */
/* the last full-length buffer is the final pass's output (the gate, then
   the room tone laid over it) */
const gated = created.filter((b) => b.length === N).pop();
if (!gated) {
  problems.push("the gate never wrote an output buffer");
} else {
  const out = gated.getChannelData(0);
  const cough = rms(out, 1.32, 1.43), coughIn = rms(chan, 1.32, 1.43);
  const w1 = rms(out, 0.55, 0.85), w1In = rms(chan, 0.55, 0.85);
  const w2 = rms(out, 1.95, 2.25), w2In = rms(chan, 1.95, 2.25);
  const sniff = rms(out, 2.50, 2.62);
  say("cough:  in " + coughIn.toFixed(4) + " -> out " + cough.toFixed(4));
  say("word 1: in " + w1In.toFixed(4) + " -> out " + w1.toFixed(4) +
      "  (" + Math.round(100 * w1 / w1In) + "% kept)");
  say("word 2: in " + w2In.toFixed(4) + " -> out " + w2.toFixed(4) +
      "  (" + Math.round(100 * w2 / w2In) + "% kept)");
  say("sniff:  out " + sniff.toFixed(4));

  /* a gated-silent stretch between the cough and word two: with the room
     tone laid it must breathe at about the room's floor, not sit at
     digital zero */
  const hush = rms(out, 1.60, 1.80);
  say("gated hush:  out " + hush.toFixed(5) + "  (room floor " + rms(chan, 1.60, 1.80).toFixed(5) + ")");

  if (cough > 0.02) problems.push("the cough survived the gate (rms " + cough.toFixed(4) + ")");
  if (w1 < 0.8 * w1In) problems.push("word one was chewed (kept " + Math.round(100 * w1 / w1In) + "%)");
  if (w2 < 0.8 * w1In) problems.push("word two was chewed (kept " + Math.round(100 * w2 / w2In) + "%)");
  if (sniff > 0.002) problems.push("the sniff survived the gate (rms " + sniff.toFixed(4) + ")");
  if (hush < 0.0003) problems.push("the silences are dead air — no room tone was laid (rms " + hush.toFixed(5) + ")");
  if (hush > 0.005) problems.push("the room tone is louder than the room (rms " + hush.toFixed(5) + ")");
  if (!/gated/i.test(after + readout)) problems.push("the treatment text never mentions the gate");
  if (!/room tone/i.test(after + readout)) problems.push("the treatment text never mentions the room tone");
}

/* ---- the publish door that appears, and its question ----------------- */
const pubrow = w.document.querySelector("[data-am=pubrow]");
if (!pubrow) {
  problems.push("no publish row in the page");
} else if (pubrow.hidden) {
  problems.push("the publish row did not appear after enhancing");
} else {
  say("publish row: appeared after enhance");
  const pubnow = w.document.querySelector("[data-am=pubnow]");

  w.confirm = () => false;                       /* answer "n" */
  pubnow.dispatchEvent(new w.Event("click", { bubbles: true }));
  await tick(60);
  const refused = $("[data-am=msg]").textContent.trim();
  say("publish, answered n: " + refused);
  if (!/Not published/.test(refused)) problems.push("'n' did not stop the publish");

  w.confirm = () => true;                        /* answer "y" */
  pubnow.dispatchEvent(new w.Event("click", { bubbles: true }));
  await tick(150);
  const done = $("[data-am=msg]").textContent.trim();
  say("publish, answered y: " + done);
  if (!/Published/.test(done)) problems.push("'y' did not publish it");
}

await tick(50);
console.log("--- notes ---");
for (const n of notes) console.log("  " + n);
console.log("--- problems ---");
if (!problems.length) console.log("  none");
for (const p of problems) console.log("  " + p);
process.exit(problems.length ? 1 : 0);
