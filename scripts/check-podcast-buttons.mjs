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

w.addEventListener("error", (e) => problems.push("window error: " + e.message));
process.on("unhandledRejection", (r) =>
  problems.push("unhandled rejection: " + (r && r.message ? r.message : r)));

const fake = (obj, status) => ({
  ok: (status || 200) < 400,
  status: status || 200,
  json: async () => obj,
  text: async () => JSON.stringify(obj),
  blob: async () => ({ size: 3, type: "audio/mpeg", arrayBuffer: async () => new ArrayBuffer(3) })
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
  if (u.includes("/api/transcribe")) return fake({ error: "nothing could hear it (harness)" }, 503);
  return fake({ ok: true });
};
w.prompt = () => "8===D";
w.confirm = () => true;
w.URL.createObjectURL = () => "blob:fake";
w.URL.revokeObjectURL = () => {};
if (!w.navigator.mediaDevices) {
  Object.defineProperty(w.navigator, "mediaDevices", { value: { getUserMedia: async () => { throw new Error("no mic in harness"); } } });
}

const stub = (name) => "function " + name + "(){} ";
const run = (file, pre) => {
  let src = readFileSync(ROOT + "hatchable/public/assets/js/" + file, "utf8");
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
run("media-admin.js", stub("countdown"));
run("device-studio.js", stub("busyBox") + stub("busyError") + stub("hold") + stub("release") +
  "async function nameTheDevice(){return 'harness'} ");
run("admin-edit.js", "");

const $ = (s) => w.document.querySelector(s);
const click = (s) => {
  const n = $(s);
  if (!n) { problems.push("missing button " + s); return null; }
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
click("[data-am=summarise]");
await tick(20);

/* choose a file the browser 'cannot decode' (no Web Audio in jsdom) */
const fileInput = $("[data-am=file]");
if (fileInput) {
  const f = new w.File([new w.Blob(["fake"])], "ep.wma", { type: "audio/x-ms-wma" });
  Object.defineProperty(fileInput, "files", { value: [f] });
  fileInput.dispatchEvent(new w.Event("change", { bubbles: true }));
  await tick(40);
  say("file chosen msg: " + msg("[data-am=msg]"));
  click("[data-am=hear]");
  await tick(40);
  say("hear with undecodable file: " + msg("[data-am=msg]"));
}

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

await tick(50);

console.log("--- notes ---");
for (const n of notes) console.log("  " + n);
console.log("--- problems ---");
if (!problems.length) console.log("  none");
for (const p of problems) console.log("  " + p);
process.exit(problems.length ? 1 : 0);
