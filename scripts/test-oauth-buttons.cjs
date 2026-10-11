#!/usr/bin/env node
/* Loads the real site.js into a jsdom page carrying the join gate's social
   elements, answers /api/oauth the way the server now does, and checks the
   buttons that actually get drawn — including Microsoft. */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const FILE = process.argv[2] || "hatchable/public/assets/js/site.js";
const src = fs.readFileSync(path.join(__dirname, "..", FILE), "utf8");

const PROVIDERS = [
  { id: "google", label: "Google", ready: true },
  { id: "microsoft", label: "Microsoft", ready: true },
  { id: "apple", label: "Apple", ready: false },
  { id: "x", label: "X", ready: true },
  { id: "facebook", label: "Facebook", ready: true },
  { id: "github", label: "GitHub", ready: true },
  { id: "discord", label: "Discord", ready: true }
];

const HTML = "<!doctype html><html><head></head><body>" +
  '<div class="social-door" id="social-door" hidden>' +
  '<div class="social-row" id="social-row"></div>' +
  '<p class="auth-msg xsmall" id="social-msg"></p></div>' +
  "</body></html>";

const dom = new JSDOM(HTML, { runScripts: "outside-only", url: "https://egregora.hatchable.site/join/" });
const win = dom.window;

/* Browser APIs site.js expects and jsdom does not provide. These are
   environment shims so the real file can run, not stand-ins for its logic. */
win.matchMedia = function () {
  return { matches: false, media: "", addEventListener: function () {}, removeEventListener: function () {},
    addListener: function () {}, removeListener: function () {}, onchange: null };
};
win.IntersectionObserver = function () { this.observe = function () {}; this.unobserve = function () {};
  this.disconnect = function () {}; this.takeRecords = function () { return []; }; };
win.ResizeObserver = win.IntersectionObserver;
win.requestAnimationFrame = function (cb) { return setTimeout(function () { cb(Date.now()); }, 0); };
win.cancelAnimationFrame = function (id) { clearTimeout(id); };
win.scrollTo = function () {};
win.alert = function () {};
win.confirm = function () { return false; };
if (!win.navigator.clipboard) win.navigator.clipboard = { writeText: function () { return Promise.resolve(); } };

win.fetch = function (url, opts) {
  let body = {};
  try { body = JSON.parse((opts && opts.body) || "{}"); } catch (e) { body = {}; }
  const out = body.action === "ready"
    ? { ok: true, providers: PROVIDERS, redirect: "https://egregora.hatchable.site/api/oauth?back=<provider>" }
    : { ok: true };
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(out) });
};

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log("  ok  - " + name);
  else { failures++; console.log("  FAIL- " + name + (extra ? "  [" + extra + "]" : "")); }
}

/* Only the social block matters here; the rest of site.js guards on elements
   this page does not have, so it settles without them. */
win.eval(src);

setTimeout(function () {
  const d = win.document;
  const door = d.getElementById("social-door");
  const row = d.getElementById("social-row");
  const links = Array.prototype.slice.call(row.querySelectorAll("a.social-btn"));
  const ids = links.map((a) => a.className.replace(/.*social-btn--(\S+).*/, "$1"));

  console.log("social buttons drawn from the real site.js (" + FILE + "):");
  check("the door was unhidden", door.hidden === false);
  check("six ready doors became six buttons", links.length === 6, "got " + links.length + ": " + ids.join(","));
  check("unconfigured Apple was left out", ids.indexOf("apple") < 0);
  check("Microsoft has a button", ids.indexOf("microsoft") >= 0, ids.join(","));

  const ms = row.querySelector("a.social-btn--microsoft");
  check("Microsoft button starts the flow", ms && /\/api\/oauth\?go=microsoft/.test(ms.getAttribute("href") || ""),
    ms && ms.getAttribute("href"));
  check("Microsoft button carries the return page", ms && /back_to=/.test(ms.getAttribute("href") || ""));
  check("Microsoft button is labelled 'Continue with Microsoft'",
    ms && /Continue with Microsoft/.test(ms.textContent || ""), ms && ms.textContent);
  check("Microsoft button carries its mark", ms && !!ms.querySelector("svg"));

  ["google", "facebook", "x", "discord", "github"].forEach((id) => {
    const a = row.querySelector("a.social-btn--" + id);
    check(id + " button wired to go=" + id, a && /go=/.test(a.getAttribute("href") || "") &&
      a.getAttribute("href").indexOf("go=" + id) >= 0);
  });

  console.log(failures ? "\nFAILURES: " + failures : "\nall passed");
  process.exit(failures ? 1 : 0);
}, 120);
