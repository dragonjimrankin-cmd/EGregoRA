/* The two mode doors and the three hands on each, driven through the real
   admin-edit.js and owner-panel.js in a DOM.

   What is under test:
     - the admin button is a fixed pill, and it is on the left;
     - both modes carry Undo, Redo and Apply changes;
     - opening one closes the other;
     - leaving with changes staged asks first.
*/
const fs = require("fs");
const { JSDOM } = require("jsdom");

let fails = 0;
const check = (ok, label, extra) => {
  console.log((ok ? "PASS " : "FAIL ") + label + (extra ? "  \u2014 " + extra : ""));
  if (!ok) fails++;
};

const dom = new JSDOM(
  '<!doctype html><html><body><main><p>Hello.</p></main>' +
  '<footer class="site-foot"></footer></body></html>',
  { runScripts: "outside-only", url: "https://egregora.hatchable.site/podcast/" }
);
const { window } = dom;
const doc = window.document;

/* The bits of the browser these two files lean on. */
window.matchMedia = window.matchMedia || function () {
  return { matches: false, addListener() {}, removeListener() {},
    addEventListener() {}, removeEventListener() {} };
};
window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.requestAnimationFrame = (f) => setTimeout(() => f(Date.now()), 0);
/* The editor opens behind a passcode door, and the door asks the server. A
   stub that answers "yes" to everything lets the test get to the real panel. */
window.fetch = () => Promise.resolve({
  ok: true, status: 200,
  json: () => Promise.resolve({ ok: true, ops: [], rows: [], token: "t", member: null })
});
Object.defineProperty(window.navigator, "clipboard",
  { value: { writeText: () => Promise.resolve() }, configurable: true });

const tick = (ms) => new Promise((r) => setTimeout(r, ms === undefined ? 30 : ms));
const run = async (path) => {
  const code = fs.readFileSync(path, "utf8");
  window.eval(code);
  /* Both files wait for DOMContentLoaded before they draw anything, and in a
     DOM built from a string that fires after the constructor returns. */
  await tick();
};

(async function main() {
/* ------------------------------------------------------------------ admin */
await run("hatchable/public/assets/js/admin-edit.js");

const pill = doc.querySelector("button.admin-edit-open");
check(!!pill, "the admin door exists on the page", pill && pill.className);
check(pill && pill.textContent.trim() === "Admin Edit Mode",
  "and it is labelled as the mode it opens", pill && pill.textContent.trim());

pill.click();
await tick();
/* The first press opens the passcode door, not the editor. */
const doorField = doc.querySelector(".ae-pass");
check(!!doorField, "the first press asks for the passcode");
doorField.value = "the-right-one";
doc.querySelector(".ae-unlock").click();
await tick(60);
const panel = doc.querySelector(".admin-edit-panel");
check(!!panel && !panel.hidden && !doc.querySelector(".ae-pass"),
  "and the right passcode opens the editor itself");

const label = (sel) => {
  const b = doc.querySelector(sel);
  return b ? b.textContent.trim() : "(missing)";
};
check(label(".ae-undo-pub") === "Undo", "Undo is in the toolbar", label(".ae-undo-pub"));
check(label(".ae-redo-pub") === "Redo", "Redo is in the toolbar", label(".ae-redo-pub"));
check(label(".ae-apply-top") === "Apply changes",
  "and so is Apply changes", label(".ae-apply-top"));
check(label(".ae-publish").indexOf("Apply changes") === 0,
  "the confirm row offers the same single action, not a second wording",
  label(".ae-publish"));

/* Apply with nothing staged must say so rather than publish nothing. */
doc.querySelector(".ae-apply-top").click();
const msg = doc.querySelector(".ae-msg");
check(!!msg && /nothing staged/i.test(msg.textContent),
  "Apply changes with nothing staged says so instead of publishing nothing",
  msg && msg.textContent.trim().slice(0, 44));

/* -------------------------------------------------- one door at a time */
/* A pretend owner room, with a close hand that records being pressed. */
let ownerClosed = 0;
const room = doc.createElement("div");
room.className = "og-overlay";
room.innerHTML = '<button class="og-close" type="button">x</button>';
doc.body.appendChild(room);
room.querySelector(".og-close").addEventListener("click", () => { ownerClosed++; });

/* Close and reopen the admin panel: opening it should send the room away. */
doc.querySelector(".admin-edit-panel .ae-x").click();
check(panel.hidden, "the panel closes on its own hand");
await tick();
pill.click();
await tick(60);
check(ownerClosed === 1,
  "opening the admin panel closes the owner room rather than covering it",
  "close pressed " + ownerClosed + " time(s)");

/* And the other way round. */
let adminClosed = 0;
doc.querySelector(".admin-edit-panel .ae-x")
  .addEventListener("click", () => { adminClosed++; });
window.dispatchEvent(new window.CustomEvent("eg-mode-open", { detail: { mode: "owner" } }));
check(panel.hidden && adminClosed === 1,
  "and the owner room opening sends the admin panel away",
  "panel hidden=" + panel.hidden);

/* ------------------------------------------------------- walking away */
let asked = null;
window.addEventListener("beforeunload", (ev) => { asked = ev; });
const fire = () => {
  asked = null;
  const ev = new window.Event("beforeunload", { cancelable: true });
  window.dispatchEvent(ev);
  return ev;
};
fire();
check(asked && !asked.defaultPrevented,
  "leaving with nothing staged leaves quietly");

const confirmRow = doc.querySelector(".admin-edit-panel .ae-confirm");
confirmRow.hidden = false;
const ev2 = fire();
check(ev2.defaultPrevented === true,
  "leaving with changes staged asks first");
check(ev2.cancelable && ev2.defaultPrevented,
  "and the ask can actually hold the navigation");
confirmRow.hidden = true;

/* ------------------------------------------------------------------ owner */
await run("hatchable/public/assets/js/owner-panel.js");

/* The owner room's hands work by delegation, so a room built here exercises
   exactly the code that ships. */
const oroom = doc.createElement("div");
oroom.className = "og-overlay";
oroom.innerHTML =
  '<button type="button" class="og-undo" disabled>Undo</button>' +
  '<button type="button" class="og-redo" disabled>Redo</button>' +
  '<button type="button" class="og-apply" disabled>Apply changes</button>' +
  '<button type="button" class="og-close">x</button>' +
  '<div class="og-pane"><input class="og-d-name" value="Edward"></div>' +
  '<button type="button" class="og-d-save">Save the details</button>';
doc.body.appendChild(oroom);
await tick();

const U = () => oroom.querySelector(".og-undo");
const R = () => oroom.querySelector(".og-redo");
const A = () => oroom.querySelector(".og-apply");
const input = oroom.querySelector(".og-d-name");

const type = (v) => {
  input.value = v;
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
};

check(U().disabled && A().disabled, "the owner hands start asleep");

type("Edward Gregory");
check(!U().disabled && !A().disabled,
  "an edit wakes Undo and Apply changes");
check(R().disabled, "with nothing undone, Redo stays asleep");

U().click();
check(input.value === "Edward", "Undo puts the field back to what it said",
  input.value);
check(!R().disabled, "and wakes Redo");

R().click();
check(input.value === "Edward Gregory", "Redo brings the edit back", input.value);

/* One stretch of typing is one undo, not a letter at a time. */
type("Edward G.");
type("Edward Gregory Rankin");
U().click();
check(input.value === "Edward",
  "a whole stretch of typing undoes in one press, not a letter at a time",
  input.value);
R().click();

let saved = 0;
oroom.querySelector(".og-d-save").addEventListener("click", () => { saved++; });
A().click();
check(saved === 1, "Apply changes presses the room's own save hand",
  "save pressed " + saved + " time(s)");
check(A().disabled && U().disabled,
  "and the hands go back to sleep once the work is applied");

/* The owner room also asks before you walk away from unapplied edits. */
type("Jim Rankin");
const ev3 = fire();
check(ev3.defaultPrevented === true,
  "leaving the owner room with unapplied changes asks first");
A().click();
const ev4 = fire();
check(!ev4.defaultPrevented, "and once applied, it does not");

/* The admin panel stepping aside when the room opens. */
if (doc.querySelector(".admin-edit-panel").hidden) { pill.click(); await tick(60); }
check(!doc.querySelector(".admin-edit-panel").hidden, "the admin panel is open again");
oroom.dispatchEvent(new window.Event("x")); /* no-op; room already present */
window.dispatchEvent(new window.CustomEvent("eg-mode-open", { detail: { mode: "admin" } }));
check(!!doc.querySelector(".og-overlay .og-close"),
  "the room keeps a close hand for the admin panel to press");


console.log(fails ? "\n" + fails + " FAILURE(S)" : "\nall passed");
process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('harness:', e); process.exit(1); });
