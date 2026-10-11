#!/usr/bin/env node
/* Runs the built podcast page in jsdom with the network stubbed, then presses
   every button on it and reports whatever throws. The scripts under test are
   the real built files; only fetch, prompt and the missing media APIs are
   faked, so a handler that survives here will survive in a browser, and one
   that throws here is a real wiring bug. */
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const ROOT = new URL("..", import.meta.url).pathname;
const HTML = readFileSync(ROOT + "hatchable/public/podcast/index.html", "utf8");

const problems = [];
const notes = [];
const say = (t) => notes.push(t);

const EP = {
  id: 1, kind: "audio", title: "Test Episode", number: "004",
  summary: "A summary.", tags: ["test"], links: [], topics: [],
  pinned: 0, date: "2026-10-10", length: "1m", seconds: 60,
  mime: "audio/mpeg", has_transcript: true, state: "published",
  url: "https://egregora.hatchable.site/episodes/1.mp3", cover: "", images: []
};

const dom = new JSDOM(HTML, {
  url: "https://egregora.hatchable.site/podcast/",
  runScripts: "outside-only",
  pretendToBeVisual: true
});
const w = dom.window;

/* Known jsdom artifacts, not product bugs: no canvas 2D without the
   canvas package, no scrollIntoView, and [data-restore] only exists on
   archived rows while the test row is published. */
const JSDOM_NOISE = /clearRect|scrollIntoView/;
w.addEventListener("error", (e) => {
  if (JSDOM_NOISE.test(e.message)) return;
  problems.push("window error: " + e.message);
});
process.on("unhandledRejection", (r) =>
  problems.push("unhandled rejection: " + (r && r.message ? r.message : r)));

const fake = (obj, status) => ({
  ok: (status || 200) < 400,
  status: status || 200,
  json: async () => obj,
  text: async () => JSON.stringify(obj),
  arrayBuffer: async () => new ArrayBuffer(3),
  /* A real Blob, not a lookalike: the private ear checks instanceof, and
     the editor's fetched episode file must pass that check. */
  blob: async () => new w.Blob(["fake"], { type: "audio/mpeg" })
});

w.fetch = async (url, opts) => {
  const u = String(url);
  let body = {};
  try { body = opts && opts.body ? JSON.parse(opts.body) : {}; } catch { body = {}; }
  if (u.includes("/api/media")) {
    if (body.action === "list") return fake({ ok: true, items: [EP] });
    if (body.action === "shelf") return fake({ ok: true, items: [EP] });
    if (body.action === "transcript") return fake({ ok: true, title: EP.title, transcript: "some words" });
    if (body.action === "next-number") return fake({ ok: true, number: "005" });
    /* A small chunk_max so a tiny test file still uploads in several pieces,
       which is what makes the progress meter step rather than jump. */
    if (body.action === "begin") return fake({ ok: true, chunk_max: 1200 });
    return fake({ ok: true, item: EP });
  }
  if (u.includes("/api/edit")) {
    if (body.action === "source") return fake({ ok: true, html: "" });
    if (body.action === "overrides") return fake({ ok: true, ops: [] });
    if (body.action === "list") return fake({ ok: true, edits: [], log: [] });
    if (body.action === "signins") return fake({ ok: true, signins: [{ email: "a@b.c", name: "A", how: "email", at: "2026-10-11T00:00:00" }] });
    if (body.action === "paraphrase") return fake({ ok: true, paraphrase: "A rewritten line.", via: "harness", checked: 2 });
    return fake({ ok: true });
  }
  if (u.includes("/api/transcribe")) {
    /* The server's hearing ear is dead (no credit, no token), but the
       describing ear still writes a listing from words it is handed. */
    if (body.action === "describe") return fake({
      ok: true, title: "A heard title", summary: "A summary from the ear.",
      tags: ["heard"], links: [], topics: [], by: "the harness"
    });
    return fake({ error: "nothing could hear it (harness)" }, 503);
  }
  return fake({ ok: true });
};
w.prompt = () => "8===D";
w.confirm = () => true;
w.URL.createObjectURL = () => "blob:fake";
/* jsdom has no layout, so scrolling is a no-op the page can still call. */
w.Element.prototype.scrollIntoView = function () {};
w.URL.revokeObjectURL = () => {};
if (!w.navigator.mediaDevices) {
  Object.defineProperty(w.navigator, "mediaDevices", { value: { getUserMedia: async () => { throw new Error("no mic in harness"); } } });
}

const stub = (name) => "function " + name + "(){} ";
const run = (file, pre) => {
  let src = readFileSync(ROOT + "hatchable/public/assets/js/" + file, "utf8");
  /* Strip ES-module imports jsdom cannot resolve — both the multi-line
     named form (import {\n a,\n b\n} from "./x") and the single-line one. */
  src = src.replace(/import\s+{[^}]*}\s+from\s+["'][^"']*["'];?/g, "");
  src = src.replace(/^\s*import\s[^;]+;?\s*$/gm, "");
  src = src.replace(/^\s*export\s+/gm, "");
  try {
    w.eval("(function(){" + (pre || "") + src + "\n})();");
    say("loaded " + file);
  } catch (e) {
    problems.push(file + " failed to evaluate: " + e.message);
  }
};

run("player.js", "");
/* media-admin.js imports the progress liveness reporter as an ES module;
   the harness cannot resolve module paths, so the real module's source —
   not a stub — is laid into the same scope ahead of it. */
const progressLive = readFileSync(ROOT + "hatchable/public/assets/js/progress-live.js", "utf8")
  .replace(/^\s*export\s+/gm, "");
run("media-admin.js", progressLive + "\n" + stub("countdown") + stub("voiceTemplate") + stub("sealVoiceprint") +
  stub("openVoiceprint") + stub("voiceSimilarity"));
run("device-studio.js", stub("busyBox") + stub("busyError") + stub("hold") + stub("release") +
  "async function nameTheDevice(){return 'harness'} ");
run("admin-edit.js", "");

const $ = (s) => w.document.querySelector(s);
const click = (s) => {
  const n = $(s);
  if (!n) {
    /* [data-restore] only exists on archived rows; the test row is
       published, so its absence is expected, not a wiring bug. */
    if (s !== "[data-restore]") problems.push("missing button " + s);
    return null;
  }
  try { n.dispatchEvent(new w.Event("click", { bubbles: true })); }
  catch (e) { problems.push(s + " click threw: " + e.message); }
  return n;
};
const tick = (ms) => new Promise((go) => setTimeout(go, ms));
const msg = (s) => { const n = $(s); return n ? n.textContent.trim() : "(no msg node)"; };

await tick(50);

/* ---- the public shelf ---------------------------------------------- */
say("public shelf after list: " + ($("#uploaded-media") ? ($("#uploaded-media").hidden ? "hidden" : "shown") : "absent"));
click("[data-mx-dl]");
await tick(20);
click("[data-mx-tr]");
await tick(20);

/* ---- read the transcript where you stand ----------------------------- */
click("[data-mx-readtr]");
await tick(40);
const trBox = w.document.querySelector("[data-mx-trbox]");
const trBtn = w.document.querySelector("[data-mx-readtr]");
say("read transcript: " + (trBox && !trBox.hidden ? "opened — " + trBox.textContent.replace(/\s+/g, " ").trim() : "did not open"));
if (!trBox || trBox.hidden) problems.push("the transcript box did not open on the shelf");
else if (!/some words/.test(trBox.textContent)) problems.push("the transcript box opened but holds no words");
if (trBtn && trBox && !trBox.hidden) {
  click("[data-mx-readtr]");                       /* press again — it closes */
  await tick(20);
  say("read transcript again: " + (trBox.hidden ? "closed" : "still open"));
  if (!trBox.hidden) problems.push("the transcript box would not close again");
}

/* ---- the house player's transport ----------------------------------- */
const fxBar = w.document.querySelector(".fx-player .fx-bar");
if (!fxBar) {
  problems.push("no enhanced player transport on the page");
} else {
  const press = (label) => {
    const b = [...fxBar.querySelectorAll("button")].find((x) => x.textContent.trim() === label);
    if (!b) { problems.push("transport button " + label + " missing"); return; }
    try { b.dispatchEvent(new w.Event("click", { bubbles: true })); }
    catch (e) { problems.push("transport " + label + " threw: " + e.message); }
  };
  ["\u23ee", "\u221260", "\u221210", "\u25ba", "+10", "+60"].forEach(press);
  await tick(30);
  say("transport: all six buttons pressed");
}

/* ---- drop audio here -------------------------------------------------- */
click("[data-drop-audio]");
const dropFile = w.document.querySelector("[data-drop-file]");
if (!dropFile) {
  problems.push("no drop-audio zone on the page");
} else {
  const f = new w.File([new w.Blob(["fake"])], "demo.mp3", { type: "audio/mpeg" });
  Object.defineProperty(dropFile, "files", { value: [f], configurable: true });
  dropFile.dispatchEvent(new w.Event("change", { bubbles: true }));
  await tick(40);
  const dropped = w.document.querySelector("[data-drop-slot] audio.player");
  say("drop audio: " + (dropped ? "player spawned and playing" : "nothing spawned"));
  if (!dropped) problems.push("dropping audio spawned no player");
  /* a non-audio file must be refused, not played */
  const bad = new w.File([new w.Blob(["x"])], "notes.txt", { type: "text/plain" });
  Object.defineProperty(dropFile, "files", { value: [bad], configurable: true });
  dropFile.dispatchEvent(new w.Event("change", { bubbles: true }));
  await tick(20);
  say("drop refusal: " + (w.document.querySelector("[data-drop-note]") || {}).textContent);
}

/* ---- the admin door ------------------------------------------------- */
click("[data-am=open]");
const pass = $("[data-am=pass]");
if (pass) pass.value = "8===D";
click("[data-am=signin]");
await tick(30);
say("door msg: " + msg("[data-am=msg]"));

/* the shelf inside the door */
click("[data-flip]");
await tick(20);
click("[data-arch]");
await tick(20);
click("[data-restore]");
click("[data-drop]");
await tick(20);
click("[data-edit]");
await tick(30);
say("editor opened: " + ($(".am-editor") ? "yes" : "no"));
click("[data-ed=sum-from-tr]");
await tick(20);
say("sum-from-tr: " + msg("[data-ed=state]"));
click('[data-ed="read-tr"]');
await tick(40);
const edBox = w.document.querySelector('[data-ed="trbox"]');
say("editor transcript: " + (edBox && !edBox.hidden ? "opened — " + edBox.textContent.replace(/\s+/g, " ").trim() : "did not open"));
if (!edBox || edBox.hidden) problems.push("the transcript box did not open in the editor");
else if (!/some words/.test(edBox.textContent)) problems.push("the editor transcript box holds no words");
click("[data-ed=drop-here]");
click("[data-ed=drop-go]");
await tick(20);
say("drop-go without file: " + msg("[data-ed=state]"));
click("[data-ed=save]");
await tick(20);

/* ---- the transcribe button ----------------------------------------- */
click("[data-am=hear]");
await tick(30);
say("hear without file: " + msg("[data-am=msg]"));
if (!/Choose a recording/.test(msg("[data-am=msg]"))) problems.push("hear with no file did not ask for a recording");
click("[data-am=summarise]");
await tick(20);

/* Now give the page a working ear and a file it can decode, and prove the
   whole road: file -> in-page whisper -> transcript typed -> listing
   written. The seam (EGTransformersLoader) stands in the CDN library; the
   Web Audio stubs let the file decode and resample as they would live. */
function fakeBuf(seconds, rate) {
  const len = Math.max(1, Math.floor(seconds * rate));
  const data = new Float32Array(len);
  for (let i = 0; i < len; i++) data[i] = 0.08 * Math.sin(2 * Math.PI * 220 * i / rate);
  return { duration: seconds, sampleRate: rate, numberOfChannels: 1, length: len,
           getChannelData: () => data };
}
w.AudioContext = w.webkitAudioContext = function () {
  return { decodeAudioData: async () => fakeBuf(3, 8000), close() {}, currentTime: 0,
           createBufferSource: () => ({ buffer: null, connect() {}, start() {} }),
           destination: {} };
};
w.OfflineAudioContext = w.webkitOfflineAudioContext = function (ch, len, rate) {
  return { createBufferSource: () => ({ buffer: null, connect() {}, start() {} }),
           destination: {}, startRendering: async () => fakeBuf(len / rate, rate) };
};
/* The in-page ear is the private local Whisper; the seam the page offers
   lets this harness hand it a fake engine that hears two segments. */
w.EGBrowserWhisperLoader = () => Promise.resolve({
  BrowserWhisper: class {
    async *transcribe(file, opts) {
      if (opts && opts.onProgress) {
        opts.onProgress({ stage: "loading", progress: 1 });
        opts.onProgress({ stage: "transcribing", progress: 0.5 });
      }
      yield { text: "hello world", start: 0, end: 2.4 };
      yield { text: "the ear heard the file itself", start: 3, end: 5.5 };
    }
  }
});

const fileInput = $("[data-am=file]");
if (fileInput) {
  const f = new w.File([new w.Blob(["fake"])], "ep.mp3", { type: "audio/mpeg" });
  Object.defineProperty(fileInput, "files", { value: [f], configurable: true });
  fileInput.dispatchEvent(new w.Event("change", { bubbles: true }));
  await tick(60);
  say("file chosen msg: " + msg("[data-am=msg]"));
  click("[data-am=hear]");
  await tick(320);
  const earBox = w.document.querySelector(".am-ear");
  const heard = earBox ? earBox.value.replace(/\s+/g, " ").trim() : "(no ear box)";
  say("hear with file: " + msg("[data-am=msg]"));
  say("ear box: " + heard.slice(0, 90));
  if (!/hello world/.test(heard)) problems.push("the in-page ear did not type the transcript it heard");
  if (!/Listed/i.test(msg("[data-am=msg]"))) problems.push("the listing was not written from the heard transcript");
}

/* The editor's own transcribe button hears a stored episode and saves the
   transcript. Reopen the editor now that Web Audio is stubbed, so the master
   decodes and the ear has something to read. */
click("[data-edit]");
await tick(90);
click('[data-ed="transcribe"]');
await tick(360);
say("editor transcribe: " + msg('[data-ed="state"]'));
if (!/Transcript saved/i.test(msg('[data-ed="state"]')))
  problems.push("the editor's transcribe button did not save a transcript");

/* ---- admin summary on the public page ------------------------------- */
click("[data-mx-sum]");
await tick(20);
say("summary editor: " + ($(".ep-sum textarea") ? "opened" : "did not open"));
if ($(".ep-sum textarea")) {
  const saveBtn = [...$(".ep-sum").querySelectorAll("button")].find((b) => /Save/.test(b.textContent));
  if (saveBtn) { saveBtn.dispatchEvent(new w.Event("click", { bubbles: true })); await tick(20); }
}

/* ---- device studio --------------------------------------------------- */
click("[data-ds=open]");
click("[data-ds=post]");
await tick(30);
say("studio post msg: " + msg("[data-ds=post-note]") + " / " + msg("[data-ds=state]"));

/* ---- admin edit mode -------------------------------------------------- */
click(".admin-edit-open");
await tick(20);
const field = $("#ae-pass");
if (field) { field.value = "8===D"; click(".ae-unlock"); await tick(30); }
say("edit mode msg: " + msg(".ae-msg"));
click(".ae-undo-pub");
await tick(20);
say("undo-pub: " + msg(".ae-msg"));
click(".ae-redo-pub");
await tick(20);
click(".ae-signins");
await tick(20);
say("signins view: " + ($(".ae-log-out table") ? "ledger rendered" : msg(".ae-log-out")));
/* words tab: select nothing, press paraphrase */
click(".ae-para");
await tick(20);
say("paraphrase empty: " + msg(".ae-msg"));
/* source tab */
const srcTab = [...w.document.querySelectorAll(".ae-tab")].find((t) => t.getAttribute("data-tab") === "source");
if (srcTab) srcTab.dispatchEvent(new w.Event("click", { bubbles: true }));
await tick(10);
click(".ae-src-load");
await tick(20);
say("source load: " + msg(".ae-msg"));
click(".ae-src-save");
await tick(20);
say("source save empty: " + msg(".ae-msg"));

/* ---- the upload progress meter -------------------------------------- */
/* Stage a file, give it a title, and publish it. As the chunks go up the
   bar must climb --done from 0 to 100% — that is what draws the gold fill
   behind the words on both the podcast and the video doors. Capture every
   value the bar is handed, to prove it is a moving meter and not a single
   jump to "done". */
{
  const fi = $("[data-am=file]");
  if (fi) {
    const bytes = new Uint8Array(2600);          /* three pieces at the harness chunk_max */
    for (let i = 0; i < bytes.length; i++) bytes[i] = i & 255;
    const f = new w.File([new w.Blob([bytes])], "ep.mp3", { type: "audio/mpeg" });
    Object.defineProperty(fi, "files", { value: [f], configurable: true });
    fi.dispatchEvent(new w.Event("change", { bubbles: true }));
    await tick(40);
    const titleEl = $("[data-am=title]");
    if (titleEl) titleEl.value = "An uploaded episode";
    const bar = $("[data-am=bar]");
    const seen = [];
    if (bar) {
      const orig = bar.style.setProperty.bind(bar.style);
      bar.style.setProperty = (k, v) => { if (k === "--done") seen.push(String(v)); return orig(k, v); };
    }
    click("[data-am=pubnow]");
    await tick(90);
    const finalDone = bar ? bar.style.getPropertyValue("--done") : "";
    say("upload meter steps: " + (seen.join(" \u2192 ") || "(none)"));
    say("upload meter final: " + finalDone + " | " + (bar ? bar.textContent.replace(/\s+/g, " ").trim() : "(no bar)"));
    if (!bar) problems.push("there is no upload progress bar on the page");
    else {
      if (bar.hidden) problems.push("the upload progress bar stayed hidden during the upload");
      if (seen.length < 2) problems.push("the upload bar did not climb through progress (it should step, not jump)");
      if (!/100%/.test(finalDone)) problems.push("the upload bar did not reach 100% (got " + finalDone + ")");
    }
  }
}

await tick(50);

console.log("--- notes ---");
for (const n of notes) console.log("  " + n);
console.log("--- problems ---");
if (!problems.length) console.log("  none");
for (const p of problems) console.log("  " + p);
process.exit(problems.length ? 1 : 0);
