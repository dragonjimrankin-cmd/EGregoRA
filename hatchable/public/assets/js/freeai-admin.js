/* ===========================================================================
   The five Free.ai doors, in every admin panel
   ---------------------------------------------------------------------------
   This file does three things and refuses the rest:

     1. it stays hidden until the order's passcode has opened an admin door
        somewhere on the page, and remembers that pass for the session only;
     2. it lists the doors as Free.ai 1 to 5 — never the accounts behind them
        — with what each has left today, when that resets, how many films
        and pictures are still in the allowance, and the month's requests;
     3. it fills the model dropdowns from Free.ai's own list and remembers
        the choice on this device, so the order's own work (the oracle, the
        pictures, the films) uses the model an administrator picked.

   The keys are never here. Everything goes through /api/freeai, which will
   not answer without the passcode.
   ======================================================================== */

const PASS_KEY = "eg-admin-pass";
const WANT_KEY = "eg-freeai-want";

/* ------------------------------------------------------- the admin's pass */

export function adminPass() {
  try { return window.sessionStorage.getItem(PASS_KEY) || ""; } catch (e) { return ""; }
}
export function keepPass(pass) {
  try { window.sessionStorage.setItem(PASS_KEY, String(pass || "")); } catch (e) { /* no store */ }
  window.dispatchEvent(new CustomEvent("eg-admin-in"));
}
export function wants() {
  try { return JSON.parse(window.localStorage.getItem(WANT_KEY) || "{}") || {}; } catch (e) { return {}; }
}
function remember(next) {
  try { window.localStorage.setItem(WANT_KEY, JSON.stringify(next)); } catch (e) { /* no store */ }
}

/* The rest of the site asks these two questions, so they are globals. */
window.EGAdminPass = adminPass;
window.EGAdminIn = () => Boolean(adminPass());
window.EGFreeWants = wants;
window.EGAdminKeep = keepPass;

const clock = (s) => {
  s = Math.max(0, Math.round(Number(s) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h >= 24) return Math.floor(h / 24) + "d " + (h % 24) + "h";
  if (h) return h + "h " + m + "m";
  return m + "m";
};
const count = (n) => Number(n || 0).toLocaleString();

async function post(body) {
  const r = await fetch("/api/freeai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.assign({ pass: adminPass() }, body))
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d && d.error) || "The doors would not open.");
  return d;
}

function setup(root) {
  const fa = (n) => root.querySelector('[data-fa="' + n + '"]');
  const msg = fa("msg");
  const say = (t, bad) => {
    if (!msg) return;
    msg.textContent = t || "";
    msg.classList.toggle("is-bad", Boolean(bad));
  };

  const show = () => { root.hidden = !adminPass(); };
  show();
  window.addEventListener("eg-admin-in", show);

  /* ------------------------------------------------------------ the table */
  async function check() {
    say("Asking\u2026");
    try {
      const d = await post({ action: "status" });
      const rows = fa("rows");
      rows.innerHTML = "";
      (d.doors || []).forEach((door) => {
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        th.setAttribute("scope", "row");
        th.textContent = door.label;
        tr.appendChild(th);
        const cell = (text, bad) => {
          const td = document.createElement("td");
          td.textContent = text;
          if (bad) td.className = "is-spent";
          tr.appendChild(td);
        };
        cell(count(door.tokens_left) + " of " + count(door.tokens_of), door.tokens_left <= 0);
        cell(clock(door.resets_in));
        cell(String(door.videos_left) + (door.videos_made ? " (" + door.videos_made + " made)" : ""),
          door.videos_left <= 0);
        cell(clock(door.videos_reset_in));
        cell(String(door.images_left) + (door.images_made ? " (" + door.images_made + " made)" : ""),
          door.images_left <= 0);
        cell(count(door.requests_used) + " of " + count(door.requests_of) +
          " \u00b7 resets in " + clock(door.requests_reset_in));
        if (door.last_error) tr.title = door.last_error;
        rows.appendChild(tr);
      });
      fa("table").hidden = false;
      say(d.note || "");
    } catch (err) {
      say(err.message, true);
    }
  }

  /* ------------------------------------------------------- the dropdowns */
  function fill(select, list, blankLabel) {
    const had = select.value;
    select.innerHTML = "";
    const none = document.createElement("option");
    none.value = "";
    none.textContent = blankLabel;
    select.appendChild(none);
    const groups = [["Self-hosted \u2014 cheapest", true], ["External \u2014 costs more tokens", false]];
    groups.forEach(([label, self]) => {
      const mine = list.filter((m) => Boolean(m.self) === self);
      if (!mine.length) return;
      const g = document.createElement("optgroup");
      g.label = label;
      mine.slice(0, 300).forEach((m) => {
        const o = document.createElement("option");
        o.value = m.id;
        o.textContent = m.id;
        g.appendChild(o);
      });
      select.appendChild(g);
    });
    if (had) select.value = had;
  }

  async function loadModels() {
    say("Fetching the list\u2026");
    try {
      const d = await post({ action: "models" });
      const list = d.models || [];
      if (!list.length) { say("Free.ai returned no list. The dropdowns keep their defaults.", true); return; }
      fill(fa("model-chat"), list.filter((m) => m.kind === "chat"), "Qwen 2.5 7B \u2014 self-hosted, cheapest");
      fill(fa("model-image"), list.filter((m) => m.kind === "image"), "FLUX.2 Klein \u2014 self-hosted");
      fill(fa("model-video"), list.filter((m) => m.kind === "video"), "CogVideoX \u2014 self-hosted");
      const want = wants();
      if (want.chat) fa("model-chat").value = want.chat;
      if (want.image) fa("model-image").value = want.image;
      if (want.video) fa("model-video").value = want.video;
      say(list.length + " models listed.");
    } catch (err) {
      say(err.message, true);
    }
  }

  const want = wants();
  ["chat", "image", "video"].forEach((kind) => {
    const sel = fa("model-" + kind);
    if (!sel) return;
    if (want[kind]) {
      const o = document.createElement("option");
      o.value = want[kind];
      o.textContent = want[kind];
      sel.appendChild(o);
      sel.value = want[kind];
    }
    sel.addEventListener("change", () => {
      const next = wants();
      next[kind] = sel.value;
      remember(next);
    });
  });
  const doorSel = fa("door");
  if (doorSel) {
    if (want.slot) doorSel.value = String(want.slot);
    doorSel.addEventListener("change", () => {
      const next = wants();
      next.slot = doorSel.value ? Number(doorSel.value) : 0;
      remember(next);
    });
  }

  if (fa("check")) fa("check").addEventListener("click", check);
  if (fa("load-models")) fa("load-models").addEventListener("click", loadModels);
  if (adminPass()) check();
}

document.querySelectorAll('[data-fa="root"]').forEach(setup);
