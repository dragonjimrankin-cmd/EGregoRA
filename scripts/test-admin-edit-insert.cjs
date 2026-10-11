#!/usr/bin/env node
/* Exercises the new Admin Edit Mode capabilities — the erase (delete) op
   and the whole expanded insert palette — by loading the deployed
   admin-edit.js into a jsdom page and replaying a batch of stored ops
   through the same applyPublished() path the live site uses on every load.
   Complements test-admin-edit.cjs, which covers the original ops. */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const SRC = path.join(__dirname, "..", "hatchable", "public", "assets", "js", "admin-edit.js");
const src = fs.readFileSync(SRC, "utf8");

/* One erase, and one insert of each interesting kind. Refs are plain
   selectors — find() is just querySelector, exactly as in the live file. */
const OPS = [
  { ref: "#p2", op: "delete" },
  { ref: "#p1", op: "insert-after", tag: "ul", value: "Alpha\nBeta\nGamma" },
  { ref: "#p1", op: "insert-after", tag: "ol", value: "One\nTwo" },
  { ref: "#p1", op: "insert-after", tag: "table", value: "A | B\nC | D" },
  { ref: "#p1", op: "insert-after", tag: "a", href: "/occult/", value: "Occult" },
  { ref: "#p1", op: "insert-after", tag: "img", src: "/assets/img/x.png", alt: "X" },
  { ref: "#p1", op: "insert-after", tag: "video", src: "/v.mp4" },
  { ref: "#p1", op: "insert-after", tag: "audio", src: "/a.mp3" },
  { ref: "#p1", op: "insert-after", tag: "iframe", src: "https://example.com/" },
  { ref: "#p1", op: "insert-after", tag: "h2", value: "Title" },
  { ref: "#p1", op: "insert-after", tag: "hr" },
  { ref: "#p1", op: "insert-after", tag: "figure", value: "Cap" },
  { ref: "#p1", op: "insert-after", tag: "blockquote", value: "Quoted" },
  /* an unknown tag must produce nothing */
  { ref: "#p1", op: "insert-after", tag: "script", value: "alert(1)" }
];

const HTML = "<!doctype html><html><head></head><body>" +
  '<p id="p1">First paragraph</p>' +
  '<p id="p2">Second paragraph</p>' +
  '<p id="p3">Third paragraph</p>' +
  "</body></html>";

const dom = new JSDOM(HTML, { runScripts: "outside-only", url: "https://egregora.test/occult/" });
const win = dom.window;

win.fetch = function (url, opts) {
  let body = {};
  try { body = JSON.parse((opts && opts.body) || "{}"); } catch (e) { body = {}; }
  const payload = body.action === "overrides" ? { ok: true, ops: OPS } : { ok: true };
  return Promise.resolve({ ok: true, json: function () { return Promise.resolve(payload); } });
};

let failures = 0;
function check(name, cond) {
  if (cond) console.log("  ok  - " + name);
  else { failures++; console.log("  FAIL- " + name); }
}

win.eval(src);

function runAssertions() {
  const d = win.document;
  console.log("Admin Edit Mode — erase + expanded insert palette:");

  check("delete removed #p2", d.getElementById("p2") === null);
  check("delete left #p1 and #p3", !!d.getElementById("p1") && !!d.getElementById("p3"));

  const ul = d.querySelector("ul");
  check("ul inserted with 3 li", ul && ul.querySelectorAll("li").length === 3);
  check("ul li text", ul && ul.querySelectorAll("li")[0].textContent === "Alpha" &&
    ul.querySelectorAll("li")[2].textContent === "Gamma");
  const ol = d.querySelector("ol");
  check("ol inserted with 2 li", ol && ol.querySelectorAll("li").length === 2);

  const table = d.querySelector("table");
  check("table inserted with 2 rows", table && table.querySelectorAll("tr").length === 2);
  check("table row 1 cells A,B", table &&
    table.querySelectorAll("tr")[0].querySelectorAll("td").length === 2 &&
    table.querySelectorAll("tr")[0].querySelectorAll("td")[0].textContent === "A" &&
    table.querySelectorAll("tr")[0].querySelectorAll("td")[1].textContent === "B");

  const a = d.querySelector("a");
  check("anchor inserted with href + label", a &&
    a.getAttribute("href") === "/occult/" && a.textContent === "Occult");

  const img = d.querySelector("img");
  check("img inserted with src + alt", img &&
    img.getAttribute("src") === "/assets/img/x.png" && img.getAttribute("alt") === "X");
  const video = d.querySelector("video");
  check("video inserted with src + controls", video &&
    video.getAttribute("src") === "/v.mp4" && video.hasAttribute("controls"));
  const audio = d.querySelector("audio");
  check("audio inserted with src + controls", audio &&
    audio.getAttribute("src") === "/a.mp3" && audio.hasAttribute("controls"));
  const iframe = d.querySelector("iframe");
  check("iframe inserted with src", iframe &&
    iframe.getAttribute("src") === "https://example.com/");

  const h2 = d.querySelector("h2");
  check("h2 inserted with text", h2 && h2.textContent === "Title");
  check("hr inserted", !!d.querySelector("hr"));
  const figure = d.querySelector("figure");
  check("figure inserted with figcaption", figure &&
    figure.querySelector("figcaption") &&
    figure.querySelector("figcaption").textContent === "Cap");
  const bq = d.querySelector("blockquote");
  check("blockquote inserted with text", bq && bq.textContent === "Quoted");

  check("unknown 'script' tag produced nothing", d.querySelectorAll("body script").length === 0);

  console.log(failures ? "\nFAILURES: " + failures : "\nall passed");
  process.exit(failures ? 1 : 0);
}

if (win.document.readyState === "complete") setTimeout(runAssertions, 60);
else win.addEventListener("load", function () { setTimeout(runAssertions, 60); });
