#!/usr/bin/env node
/* Verify the real Admin Edit Mode scripts in both sites and in both source
   and deployed copies. This covers the X close action and the title-bar drag
   gesture without depending on a browser's layout engine. */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const FILES = [
  "src/assets/js/admin-edit.js",
  "hatchable/public/assets/js/admin-edit.js",
  "tti/src/assets/js/admin-edit.js",
  "tti/hatchable/public/assets/js/admin-edit.js"
];
const wait = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms));
const failures = [];
const check = (ok, label) => {
  console.log((ok ? "PASS " : "FAIL ") + label);
  if (!ok) failures.push(label);
};

async function exercise(relative, usePointer) {
  const source = fs.readFileSync(path.join(ROOT, relative), "utf8");
  const dom = new JSDOM(
    "<!doctype html><html><body><main><p>Panel test.</p></main><footer class=\"site-foot\"></footer></body></html>",
    { runScripts: "outside-only", pretendToBeVisual: true, url: "https://example.test/" }
  );
  const { window } = dom;
  const { document } = window;
  window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  window.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 0);
  window.fetch = async () => ({
    ok: true, status: 200,
    json: async () => ({ ok: true, ops: [], rows: [], token: "test-token", member: null })
  });
  window.confirm = () => true;
  if (!usePointer) window.PointerEvent = undefined; // exercise the legacy mouse fallback
  window.eval(source);
  await wait(50);

  const open = document.querySelector("button.admin-edit-open");
  if (!open) {
    check(false, `${relative}: admin edit door mounted`);
    dom.window.close();
    return;
  }
  open.click();
  await wait(20);
  const pass = document.querySelector(".ae-pass");
  const unlock = document.querySelector(".ae-unlock");
  if (!pass || !unlock) {
    check(false, `${relative}: passcode door mounted`);
    dom.window.close();
    return;
  }
  pass.value = "test-pass";
  unlock.click();
  await wait(80);

  const panel = document.querySelector(".admin-edit-panel");
  const handle = panel && panel.querySelector(".ae-head");
  check(!!panel && !panel.hidden, `${relative}: panel opens`);
  check(!!handle && /drag/i.test(handle.getAttribute("title") || ""), `${relative}: title bar advertises dragging`);
  if (!panel || !handle) {
    dom.window.close();
    return;
  }

  const event = (type, x, y, button = 0) => usePointer
    ? new window.PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, button, clientX: x, clientY: y })
    : new window.MouseEvent(type, { bubbles: true, cancelable: true, button, clientX: x, clientY: y });
  handle.dispatchEvent(event(usePointer ? "pointerdown" : "mousedown", 100, 100));
  window.dispatchEvent(event(usePointer ? "pointermove" : "mousemove", 140, 130));
  const moved = panel.style.position === "fixed" && panel.style.left === "40px" && panel.style.top === "30px";
  check(moved, `${relative}: panel follows title-bar drag (${panel.style.left}, ${panel.style.top})`);
  window.dispatchEvent(event(usePointer ? "pointerup" : "mouseup", 140, 130));
  check(!panel.classList.contains("is-dragging"), `${relative}: drag ends cleanly`);

  const close = panel.querySelector(".ae-x");
  if (close) close.click();
  check(!!close && panel.hidden, `${relative}: top-right X closes the panel`);
  dom.window.close();
}

(async () => {
  for (let i = 0; i < FILES.length; i++) await exercise(FILES[i], i % 2 === 0);
  console.log(failures.length ? `\n${failures.length} failure(s)` : "\nAll Admin Edit panel checks passed.");
  process.exitCode = failures.length ? 1 : 0;
})();
