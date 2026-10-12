#!/usr/bin/env node
/* The recorder's two new hands, run against the real podcast page and the
   real media-admin.js in jsdom.

   What is under test:
     · a take in progress grows a pause hand, and it is the loud one
     · pausing holds the recorder and the clock stops with it
     · continuing picks up inside the same take
     · the save-and-publish hand stops the take and publishes it in one press
     · nothing is offered before there is a take to offer it on

   Only the machine is faked — MediaRecorder, the microphone, the audio
   context and the canvas. The wiring under test is the shipped file. */
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const ROOT = new URL("..", import.meta.url).pathname;
const HTML = readFileSync(ROOT + "hatchable/public/podcast/index.html", "utf8");

const problems = [];
let fails = 0;
const check = (ok, label, extra) => {
  console.log((ok ? "PASS " : "FAIL ") + label + (extra ? "  — " + extra : ""));
  if (!ok) fails++;
};

const dom = new JSDOM(HTML, {
  url: "https://egregora.hatchable.site/podcast/",
  runScripts: "outside-only",
  pretendToBeVisual: true
});
const w = dom.window;

const JSDOM_NOISE = /clearRect|scrollIntoView|Not implemented/;
w.addEventListener("error", (e) => { if (!JSDOM_NOISE.test(e.message)) problems.push("window error: " + e.message); });
process.on("unhandledRejection", (r) => problems.push("unhandled rejection: " + (r && r.message ? r.message : r)));

/* --------------------------------------------------------------- the machine */
const CALLS = { pause: 0, resume: 0, start: 0, stop: 0 };

class FakeRecorder {
  constructor(stream, opts) { this.state = "inactive"; this.opts = opts; this.ondataavailable = null; this.onstop = null; }
  start() { this.state = "recording"; CALLS.start++; }
  stop() { if (this.state === "inactive") return; this.state = "inactive"; CALLS.stop++; if (this.onstop) this.onstop(); }
  pause() { if (this.state !== "recording") throw new Error("not recording"); this.state = "paused"; CALLS.pause++; }
  resume() { if (this.state !== "paused") throw new Error("not paused"); this.state = "recording"; CALLS.resume++; }
}
FakeRecorder.isTypeSupported = () => true;
w.MediaRecorder = FakeRecorder;

Object.defineProperty(w.navigator, "mediaDevices", {
  configurable: true,
  value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }], getAudioTracks: () => [], addTrack() {} }) }
});

/* jsdom has no canvas backend and no Web Audio; both are stood in. */
w.HTMLCanvasElement.prototype.getContext = () => ({
  clearRect() {}, fillRect() {}, strokeRect() {},
  set fillStyle(v) {}, set strokeStyle(v) {}
});
const FAKE_BUF = {
  length: 44100, sampleRate: 44100, numberOfChannels: 1, duration: 1,
  getChannelData: () => new Float32Array(44100)
};
w.AudioContext = class {
  constructor() { this.destination = {}; this.currentTime = 0; this.sampleRate = 44100; }
  createMediaStreamSource() { return { connect() {} }; }
  createAnalyser() {
    return { fftSize: 0, frequencyBinCount: 512, connect() {}, getByteTimeDomainData(a) { a.fill(128); } };
  }
  createGain() { return { gain: { value: 0 }, connect() {} }; }
  createBufferSource() { return { buffer: null, connect() {}, start() {}, stop() {} }; }
  async decodeAudioData() { return FAKE_BUF; }
  async close() {}
};

/* ------------------------------------------------------------- the network */
const SENT = [];
const fake = (obj, status) => ({
  ok: (status || 200) < 400, status: status || 200,
  json: async () => obj, text: async () => JSON.stringify(obj),
  blob: async () => new w.Blob(["fake"], { type: "audio/mpeg" })
});
w.fetch = async (url, opts) => {
  const u = String(url);
  let body = {};
  try { body = opts && opts.body ? JSON.parse(opts.body) : {}; } catch { body = {}; }
  if (u.includes("/api/media")) {
    SENT.push(body);
    if (body.action === "list" || body.action === "shelf") return fake({ ok: true, items: [] });
    if (body.action === "next-number") return fake({ ok: true, number: "005" });
    if (body.action === "begin") return fake({ ok: true, chunk_max: 100000 });
    return fake({ ok: true, item: { id: 1, title: body.title || "Recorded", kind: "audio", state: "published" } });
  }
  if (u.includes("/api/edit")) {
    if (body.action === "source") return fake({ ok: true, html: "" });
    if (body.action === "overrides") return fake({ ok: true, ops: [] });
    return fake({ ok: true, edits: [], log: [], signins: [] });
  }
  return fake({ ok: true });
};
w.prompt = () => "pass";
w.confirm = () => true;
w.URL.createObjectURL = () => "blob:fake";
w.URL.revokeObjectURL = () => {};
w.Element.prototype.scrollIntoView = function () {};

/* ----------------------------------------------------------- the real files */
const stub = (name) => "function " + name + "(){} ";
const run = (file, pre) => {
  let src = readFileSync(ROOT + "hatchable/public/assets/js/" + file, "utf8");
  src = src.replace(/import\s+{[^}]*}\s+from\s+["'][^"']*["'];?/g, "");
  src = src.replace(/^\s*import\s[^;]+;?\s*$/gm, "");
  src = src.replace(/^\s*export\s+/gm, "");
  try { w.eval("(function(){" + (pre || "") + src + "\n})();"); }
  catch (e) { problems.push(file + " failed to evaluate: " + e.message); }
};

run("player.js", "");
const progressLive = readFileSync(ROOT + "hatchable/public/assets/js/progress-live.js", "utf8")
  .replace(/^\s*export\s+/gm, "");
/* The countdown is stood in so it fires at once: the ten seconds it counts
   are the part of the flow this test has no interest in waiting for. */
run("media-admin.js", progressLive + "\nfunction countdown(host, n, go){ if (go) go(); } " +
  stub("voiceTemplate") + stub("sealVoiceprint") + stub("openVoiceprint") + stub("voiceSimilarity"));

const $ = (s) => w.document.querySelector(s);
const click = (s) => {
  const n = $(s);
  if (!n) { problems.push("missing " + s); return null; }
  n.dispatchEvent(new w.Event("click", { bubbles: true }));
  return n;
};
const tick = (ms) => new Promise((go) => setTimeout(go, ms));
const secs = () => {
  const t = ($("[data-am=rec-state]") || {}).textContent || "";
  const m = t.match(/(\d+)m (\d+)s/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

await tick(60);

/* -------------------------------------------------- 0. the markup is there */
const pause = $("[data-am=rec-pause]");
const save = $("[data-am=rec-savepub]");
check(!!pause, "the podcast page carries a pause hand in the recorder");
check(!!save, "the podcast page carries a save-and-publish hand in the recorder");
check(!!(pause && pause.hidden) && !!(save && save.hidden),
  "both hands stay out of the way until there is a take",
  pause && save ? "pause hidden=" + pause.hidden + " save hidden=" + save.hidden : "");
check(!!(save && /save and publish/i.test(save.textContent)),
  "the save hand says what it does", save && save.textContent.trim());

click("[data-am=rec-open]");
await tick(20);

/* ------------------------------------------------- 0b. the sign-in gate */
/* Recording for the site needs a signed-in account. Assert the gate holds
   before standing a session in, so the rest of the test cannot pass by
   quietly walking past it. */
click("[data-am=rec-start]");
await tick(120);
check(/sign in first/i.test(($("[data-am=rec-state]") || {}).textContent || ""),
  "recording is refused before anybody has signed in",
  ($("[data-am=rec-state]") || {}).textContent.trim().slice(0, 48));
check(CALLS.start === 0, "and no recorder is opened for them", "start calls = " + CALLS.start);
w.EGToken = () => "harness-session";

/* ------------------------------------------------------ 1. start a take */
click("[data-am=rec-start]");
await tick(350);
check(CALLS.start === 1, "the recorder started", "start calls = " + CALLS.start);
check(!!(pause && !pause.hidden), "the pause hand appears while recording is active",
  pause && "hidden=" + pause.hidden);
check(!!(save && !save.hidden && !save.disabled),
  "the save-and-publish hand appears with it",
  save && "hidden=" + save.hidden + " disabled=" + save.disabled);
check(!!(pause && /pause recording/i.test(pause.textContent)),
  "it reads 'Pause recording' while recording", pause && pause.textContent.trim());
check(w.document.querySelector("[data-admin-media]").classList.contains("is-recording"),
  "the editor is marked as recording");

/* ------------------------------------------------------- 2. hold the take */
await tick(1300);
const before = secs();
click("[data-am=rec-pause]");
await tick(120);
check(CALLS.pause === 1, "pausing calls pause() on the recorder", "pause calls = " + CALLS.pause);
check(!!(pause && pause.classList.contains("is-paused")),
  "the hand changes to its held look so the state is not in doubt");
check(!!(pause && /continue recording/i.test(pause.textContent)),
  "it now reads 'Continue recording'", pause && pause.textContent.trim());
check(/held/i.test(($("[data-am=rec-state]") || {}).textContent || ""),
  "the page says the take is held", ($("[data-am=rec-state]") || {}).textContent);
check(pause && pause.getAttribute("aria-pressed") === "true",
  "the held state is announced to a screen reader",
  pause && "aria-pressed=" + pause.getAttribute("aria-pressed"));

await tick(1600);
const during = secs();
check(before !== null && during === before,
  "the clock stops with the recording, so the length it reports is true",
  "held at " + before + "s, still " + during + "s after waiting");

/* ------------------------------------------------------ 3. carry it on */
click("[data-am=rec-pause]");
await tick(1400);
check(CALLS.resume === 1, "continuing calls resume() on the same recorder", "resume calls = " + CALLS.resume);
check(!!(pause && !pause.classList.contains("is-paused") && /pause recording/i.test(pause.textContent)),
  "the hand reads 'Pause recording' again");
const after = secs();
check(after !== null && after > during,
  "the take carries on from where it was held, and the clock moves again",
  during + "s -> " + after + "s");
check(CALLS.stop === 0, "continuing did not stop the take and start another");

/* --------------------------------------- 4. one press saves and publishes */
SENT.length = 0;
click("[data-am=rec-savepub]");
await tick(600);
const fin = SENT.filter((b) => b.action === "finish");
check(CALLS.stop === 1, "the save hand stopped the take first", "stop calls = " + CALLS.stop);
check(fin.length >= 1, "the save hand sent it to be published",
  "finish calls = " + fin.length);
check(fin.length >= 1 && fin[0].publish === true,
  "and it was published, not merely stored",
  fin[0] ? "publish=" + fin[0].publish : "no finish");
check(!!(pause && pause.hidden),
  "the pause hand goes away once there is nothing left to hold");
check(!!(save && !save.hidden),
  "the save hand stays, since the take it offers is the finished one");

console.log(problems.length ? "\nproblems:\n  " + problems.join("\n  ") : "");
console.log(fails || problems.length ? "\n" + (fails + problems.length) + " FAILURE(S)" : "\nall passed");
process.exit(fails || problems.length ? 1 : 0);
