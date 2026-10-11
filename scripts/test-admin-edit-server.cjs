#!/usr/bin/env node
/* Drives the real hatchable/api/edit.js 'save' handler — and therefore the
   real tidyOps validator — with the ops the expanded editor can now emit.
   Confirms the server keeps the erase (delete) op and every new insert
   kind, stores their address/words correctly, and still refuses an unsafe
   address. Platform deps are stubbed by _edit-test-loader.mjs. */
const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
const path = require("path");

register(pathToFileURL(path.join(__dirname, "_edit-test-loader.mjs")));

/* db.query stub: RETURNING gets an id, everything else empty rows. */
globalThis.__dbQuery = async function (sql) {
  if (/RETURNING/i.test(sql)) return { rows: [{ id: 42, at: "2026-10-11T00:00:00Z" }] };
  return { rows: [] };
};
globalThis.__doorResult = { ok: true, who: "admin" };

let failures = 0;
function check(name, cond) {
  if (cond) console.log("  ok  - " + name);
  else { failures++; console.log("  FAIL- " + name); }
}

function mockRes(capture) {
  return {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(d) { capture.out = d; capture.status = this.statusCode; }
  };
}

(async function () {
  const mod = await import(pathToFileURL(path.join(__dirname, "..", "hatchable", "api", "edit.js")).href);
  const handler = mod.default;

  const ops = [
    { ref: "body > p:nth-of-type(2)", op: "delete" },
    { ref: "body > p:nth-of-type(1)", op: "insert-after", tag: "ul", value: "Alpha\nBeta" },
    { ref: "body > p:nth-of-type(1)", op: "insert-after", tag: "table", value: "A | B" },
    { ref: "body > p:nth-of-type(1)", op: "insert-after", tag: "a", href: "/occult/", value: "Occult" },
    { ref: "body > p:nth-of-type(1)", op: "insert-after", tag: "img", src: "/assets/img/x.png", alt: "X" },
    { ref: "body > p:nth-of-type(1)", op: "insert-after", tag: "video", src: "/v.mp4" },
    { ref: "body > p:nth-of-type(1)", op: "insert-after", tag: "iframe", src: "https://example.com/" },
    { ref: "body > p:nth-of-type(1)", op: "insert-after", tag: "h5", value: "Small heading" },
    { ref: "body > p:nth-of-type(1)", op: "insert-after", tag: "hr" },
    { ref: "body > p:nth-of-type(1)", op: "insert-after", tag: "figure", value: "Cap" },
    /* these two must be refused: an unsafe address on each shape */
    { ref: "body > p:nth-of-type(1)", op: "insert-after", tag: "img", src: "javascript:alert(1)" },
    { ref: "body > p:nth-of-type(1)", op: "insert-after", tag: "a", href: "javascript:alert(1)" },
    /* an unknown tag must be refused */
    { ref: "body > p:nth-of-type(1)", op: "insert-after", tag: "script", value: "x" }
  ];

  const capture = {};
  await handler(
    { body: { action: "save", pass: "x", page: "/occult/", prompt: "test", confirm: "publish", ops } },
    mockRes(capture)
  );

  const out = capture.out || {};
  const kept = out.ops || [];
  const byTag = {};
  kept.forEach((o) => { if (o.tag) byTag[o.tag] = o; });
  const hasDelete = kept.some((o) => o.op === "delete");

  console.log("edit.js save — tidyOps keeps the new operations:");
  check("handler returned ok", out.ok === true && out.id === 42);
  check("delete op kept", hasDelete);
  check("ul kept with value", byTag.ul && byTag.ul.value === "Alpha\nBeta");
  check("table kept", !!byTag.table);
  check("a kept with href + value", byTag.a && byTag.a.href === "/occult/" && byTag.a.value === "Occult");
  check("img kept with src + alt", byTag.img && byTag.img.src === "/assets/img/x.png" && byTag.img.alt === "X");
  check("video kept with src", byTag.video && byTag.video.src === "/v.mp4");
  check("iframe kept with src", byTag.iframe && byTag.iframe.src === "https://example.com/");
  check("h5 kept (new heading)", byTag.h5 && byTag.h5.value === "Small heading");
  check("hr kept", !!byTag.hr);
  check("figure kept", !!byTag.figure);

  /* the unsafe / unknown ones must NOT be present */
  check("javascript: img refused", kept.filter((o) => o.tag === "img").length === 1);
  check("javascript: link refused", kept.filter((o) => o.tag === "a").length === 1);
  check("script tag refused", !byTag.script);

  console.log(failures ? "\nFAILURES: " + failures : "\nall passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("threw:", e && e.stack || e); process.exit(1); });
