/* Exercises the real /api/edit draft endpoint: the rules interpreter and
   the tidyOps gate, with the platform imports stubbed out. */
const fs = require("fs");

let src = fs.readFileSync("hatchable/api/edit.js", "utf8");
src = src
  .replace(/^import .*$/gm, "")
  .replace(/^export const /gm, "const ")
  .replace(/^export default async function/m, "const handler = async function")
  + "\nmodule.exports = handler;\n";

const stubs = [
  "const ai = { generateText: async () => { const e = new Error('offline'); e.code = 'SetupRequired'; throw e; } };",
  "const db = { query: async () => ({ rows: [] }) };",
  "const adminDoor = async () => ({ ok: true, who: 'test' });",
  "const freeChat = async () => { throw new Error('offline'); };",
  "const openChat = async () => { throw new Error('offline'); };",
  "const openaiChat = async () => { throw new Error('offline'); };",
  "const topMatches = () => [];",
  "const SECTIONS = [];"
].join("\n");

const module_ = { exports: null };
new Function("module", stubs + "\n" + src)(module_);
const handler = module_.exports;

const NODES = [
  { ref: "block:0", kind: "element", tag: "div", classes: "frame", text: "A panel of text." },
  { ref: "block:1", kind: "element", tag: "a", classes: "", text: "a link" }
];

async function draft(prompt, nodes) {
  let out = null;
  const res = {
    status() { return this; },
    json(o) { out = o; return this; }
  };
  await handler({ body: { action: "draft", pass: "x", page: "/", prompt, nodes: nodes || NODES } }, res);
  return out;
}

const results = [];
function check(name, cond) { results.push([name, !!cond]); }
function has(ops, op, pred) {
  return (ops || []).some((o) => o.op === op && (!pred || pred(o)));
}

(async () => {
  let d;

  d = await draft("move it up");
  check("move-up: " + JSON.stringify(d.ops), has(d.ops, "move-up"));

  d = await draft("move that down");
  check("move-down", has(d.ops, "move-down"));

  d = await draft("duplicate that");
  check("clone", has(d.ops, "clone"));

  d = await draft("link it to /occult/#t-what-the-word-has-meant");
  check("link href", has(d.ops, "link", (o) => o.href === "/occult/#t-what-the-word-has-meant"));

  d = await draft("point that at https://example.com/page");
  check("link https", has(d.ops, "link", (o) => o.href === "https://example.com/page"));

  d = await draft("link it to javascript:alert(1)");
  check("javascript: refused", !has(d.ops, "link"));

  d = await draft("link it to \" onmouseover=\"x");
  check("quote injection refused", !has(d.ops, "link"));

  d = await draft("swap the image with /assets/img/plate-iv.png");
  check("image src", has(d.ops, "image", (o) => o.src === "/assets/img/plate-iv.png"));

  d = await draft("add a paragraph after saying \u201cHello there, friends.\u201d");
  check("insert-after p", has(d.ops, "insert-after", (o) => o.tag === "p" && o.value === "Hello there, friends."));

  d = await draft("insert a divider before");
  check("insert-before hr", has(d.ops, "insert-before", (o) => o.tag === "hr"));

  d = await draft("clear the styling");
  check("clear-styles", has(d.ops, "clear-styles"));

  /* regression: the rules that already worked must still work */
  d = await draft("make it gold");
  check("gold still works", has(d.ops, "style", (o) => o.prop === "color" && o.value === "#d7b05a"));

  d = await draft("hide that");
  check("hide still works", has(d.ops, "hide"));

  d = await draft("replace the text with \u201cLife, Love, Magic.\u201d");
  check("verbatim text still works", has(d.ops, "text", (o) => o.value === "Life, Love, Magic."));

  d = await draft("wibble wobble nothing meaningful");
  check("nonsense yields a note, not ops", (!d.ops || !d.ops.length) && !!d.note);

  let failed = 0;
  results.forEach((r) => { if (!r[1]) failed++; console.log((r[1] ? "PASS " : "FAIL ") + r[0]); });
  console.log(failed ? failed + " FAILURES" : "ALL " + results.length + " CHECKS PASSED");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error("harness error", e); process.exit(1); });
