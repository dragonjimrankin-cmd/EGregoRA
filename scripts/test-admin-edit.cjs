/* Drives the real admin-edit.js in jsdom: every new op through the real
   applyPublished -> apply() path, and the real unlock -> panel path. */
const { JSDOM } = require("jsdom");
const fs = require("fs");

const html = "<!doctype html><html><head></head><body>" +
  '<p id="p1" style="color: red; font-size: 20px">Some <a href="/old">link words</a> here.</p>' +
  '<img id="im" src="/old.png" alt="old">' +
  '<div id="d1">A</div><div id="d2">B</div>' +
  "<footer class=\"site-foot\"></footer></body></html>";

const dom = new JSDOM(html, { url: "https://egregora.hatchable.site/test/", runScripts: "dangerously" });
const { window } = dom;

const P = "body > p:nth-of-type(1)";
const A = P + " > a:nth-of-type(1)";
const IMG = "body > img:nth-of-type(1)";
const D1 = "body > div:nth-of-type(1)";
const D2 = "body > div:nth-of-type(2)";

const appliedOps = [
  { ref: A, op: "link", href: "/occult/#t-what-the-word-has-meant", value: "the true word" },
  { ref: IMG, op: "image", src: "/assets/img/plate-iv.png", alt: "the fourth plate" },
  { ref: D2, op: "move-up" },
  { ref: D1, op: "clone" },
  { ref: D2, op: "insert-after", tag: "blockquote", value: "As above, so below." },
  { ref: P, op: "unstyle", prop: "font-size" },
  { ref: P, op: "span-text", node: 0, start: 0, end: 4, value: "Many" },
  { ref: "body > footer:nth-of-type(1)", op: "clear-styles" }
];

window.fetch = function (url, opts) {
  const body = JSON.parse((opts && opts.body) || "{}");
  let out = { ok: true };
  if (body.action === "overrides") out = { ok: true, ops: appliedOps };
  if (body.action === "source") out = { ok: true, html: "" };
  if (body.action === "date") out = { ok: true, page: "/", date: "" };
  if (body.action === "list") out = { ok: true, edits: [], log: [] };
  return Promise.resolve({
    ok: true, status: 200,
    json: function () { return Promise.resolve(out); }
  });
};

const script = window.document.createElement("script");
script.textContent = fs.readFileSync("src/assets/js/admin-edit.js", "utf8");
window.document.body.appendChild(script);

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

setTimeout(function () {
  const doc = window.document;
  const a = doc.querySelector("a");
  const img = doc.querySelector("img");
  const body = doc.body;
  const kids = Array.prototype.map.call(body.children, function (n) { return n.id || n.tagName; });

  check("link href set", a.getAttribute("href") === "/occult/#t-what-the-word-has-meant");
  check("link words set", a.textContent === "the true word");
  check("image swapped", img.getAttribute("src") === "/assets/img/plate-iv.png");
  check("image alt swapped", img.getAttribute("alt") === "the fourth plate");
  /* order was p,img,d1,d2,footer -> move-up d2, clone d1, insert-after d2 blockquote:
     p, img, d2, BLOCKQUOTE, d1, DIV(clone of d1), footer */
  /* refs resolve before any mutation: d2 up, d1 cloned (twin keeps the
     id), blockquote after d2; DIV before the footer is the editor mount */
  check("moved up + cloned + inserted: " + kids.join(","),
    kids[2] === "d2" && kids[3] === "BLOCKQUOTE" && kids[4] === "d1" &&
    kids[5] === "d1" && kids[6] === "DIV" && kids[7] === "FOOTER");
  check("blockquote words", body.querySelector("blockquote").textContent === "As above, so below.");
  const p = doc.querySelector("p");
  check("unstyle removed only font-size (colour kept)",
    p.style.fontSize === "" && p.style.color === "red");
  check("span-text replaced verbatim", p.textContent.indexOf("Many") === 0);

  /* ---- the panel path: unlock with the stubbed list action ---- */
  const open = doc.querySelector(".admin-edit-open");
  check("door button exists", open);
  open.click();
  const pass = doc.querySelector("#ae-pass");
  check("passcode door shown", pass);
  pass.value = "test-pass";
  doc.querySelector(".ae-unlock").click();

  setTimeout(function () {
    const panel = doc.querySelector(".admin-edit-panel:not(.admin-edit-locked)");
    check("panel opened", panel);
    check("Do tab present", panel.querySelector('.ae-tab[data-tab="do"]'));
    check("Backups button present", panel.querySelector(".ae-backups"));
    check("steps indicator present", panel.querySelectorAll(".ae-step").length === 3);
    check("presets built", panel.querySelectorAll(".ae-chip").length === 10);
    check("widen/narrow present", panel.querySelector(".ae-grow") && panel.querySelector(".ae-shrink"));
    check("look extras present", panel.querySelector(".ae-leading") && panel.querySelector(".ae-shadow"));
    check("do pane controls", panel.querySelector(".ae-mv-up") && panel.querySelector(".ae-href") &&
      panel.querySelector(".ae-ins-tag"));
    panel.querySelector('.ae-tab[data-tab="do"]').click();
    check("do pane visible on click", panel.querySelector('.ae-pane[data-pane="do"]').hidden === false);
    /* safe-url guard runs client-side too */
    panel.querySelector('.ae-tab[data-tab="look"]').click();
    const evt = new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true });
    window.dispatchEvent(evt);
    check("escape closes the panel", panel.hidden === true);

    let failed = 0;
    results.forEach(function (r) {
      if (!r[1]) failed++;
      console.log((r[1] ? "PASS " : "FAIL ") + r[0]);
    });
    console.log(failed ? failed + " FAILURES" : "ALL " + results.length + " CHECKS PASSED");
    process.exit(failed ? 1 : 0);
  }, 120);
}, 120);
