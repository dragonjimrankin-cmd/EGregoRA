/**
 * Admin Edit Mode — the little door in the bottom-left corner of every page.
 *
 * What it does, in order: the passcode, then a rectangle drawn anywhere on
 * the page, then a sentence saying what should change inside it. The
 * sentence goes to /api/edit, which answers with a list of operations
 * against the elements that are actually inside the box. Those are shown as
 * a preview on the page itself, in place, highlighted — and nothing is
 * published until the change is confirmed, which the panel says before it
 * is asked. Anything published can be undone again from the log.
 *
 * Every published change is logged server-side with the words that produced
 * it, and the log is readable, undoable and redoable from the same panel.
 * Undo and redo for the prompts themselves are separate, and local: they
 * step backwards and forwards through what has been tried in this sitting
 * without publishing anything.
 *
 * Also: on every page load, for every visitor, published changes are
 * fetched once and applied. That is what makes an edit an edit rather than
 * a trick of one browser.
 *
 * House rule observed here: no backticks anywhere in this file.
 */
(function adminEdit() {
  var PAGE = location.pathname.replace(/index\.html$/, "") || "/";

  /* ------------------------------------------------------------ helpers */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function post(payload) {
    return fetch("/api/edit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.error || "the editor refused that");
        return d;
      });
    });
  }

  /* A selector that survives a reload: the path of tag plus nth-of-type
     from the body down. No ids are invented and no classes are relied on,
     because a class can be changed by the very thing this writes. */
  function pathOf(node) {
    if (!node || node === document.body) return "body";
    var parts = [];
    var cur = node;
    while (cur && cur !== document.body && cur.parentElement) {
      var tag = cur.tagName.toLowerCase();
      var i = 1;
      var sib = cur;
      while ((sib = sib.previousElementSibling)) {
        if (sib.tagName.toLowerCase() === tag) i++;
      }
      parts.unshift(tag + ":nth-of-type(" + i + ")");
      cur = cur.parentElement;
    }
    return "body > " + parts.join(" > ");
  }

  function find(sel) {
    try { return document.querySelector(sel); } catch (e) { return null; }
  }

  /* ----------------------------------------------- applying an operation */
  function apply(op) {
    var node = find(op.ref);
    if (!node) return false;
    if (op.op === "text") {
      node.textContent = op.value;
    } else if (op.op === "hide") {
      node.style.display = "none";
    } else if (op.op === "show") {
      node.style.display = "";
    } else if (op.op === "style" && op.prop) {
      node.style.setProperty(op.prop, op.value);
    } else if (op.op === "colour") {
      node.style.setProperty("color", op.value);
    } else if (op.op === "background") {
      node.style.setProperty("background-color", op.value);
    } else if (op.op === "border") {
      node.style.setProperty("border-color", op.value);
    } else if (op.op === "font-size") {
      node.style.setProperty("font-size", op.value);
    } else if (op.op === "align") {
      node.style.setProperty("text-align", op.value);
    }
    return true;
  }

  /* Everything needed to put one operation back exactly as it was. */
  function snapshot(op) {
    var node = find(op.ref);
    if (!node) return null;
    return {
      ref: op.ref,
      text: node.textContent,
      style: node.getAttribute("style") || ""
    };
  }

  function restore(shot) {
    var node = shot && find(shot.ref);
    if (!node) return;
    node.textContent = shot.text;
    if (shot.style) node.setAttribute("style", shot.style);
    else node.removeAttribute("style");
  }

  /* ------------------------------------- what every visitor already sees */
  function applyPublished() {
    post({ action: "overrides", page: PAGE }).then(function (d) {
      (d.ops || []).forEach(apply);
    }).catch(function () { /* a page that cannot reach the API is still a page */ });
  }
  if (document.readyState === "complete") setTimeout(applyPublished, 0);
  else addEventListener("load", function () { setTimeout(applyPublished, 0); });

  /* --------------------------------------------------------- the button */
  var mount = document.createElement("div");
  mount.className = "admin-edit-mount";
  var button = el("button", "admin-edit-open", "Admin Edit Mode");
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  mount.appendChild(button);

  function place() {
    var foot = document.querySelector("footer.site-foot");
    if (foot && foot.parentNode) foot.parentNode.insertBefore(mount, foot);
    else document.body.appendChild(mount);
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", place);
  else place();

  /* ----------------------------------------------------------- the state */
  var pass = "";
  var panel = null;
  var picking = false;
  var box = null;            /* the rectangle on screen */
  var rect = null;           /* its page coordinates */
  var nodes = [];            /* what is inside it */
  var draft = null;          /* the ops last proposed */
  var preview = [];          /* snapshots taken before previewing */
  var history = [];          /* prompts tried in this sitting */
  var at = -1;               /* where in that history we stand */

  function say(text, bad) {
    if (!panel) return;
    var n = panel.querySelector(".ae-msg");
    if (!n) return;
    n.textContent = text || "";
    n.className = "ae-msg" + (bad ? " is-bad" : "");
  }

  /* ---------------------------------------------------------- the panel */
  function openPanel() {
    if (panel) { panel.hidden = false; return; }
    panel = el("div", "admin-edit-panel");
    panel.innerHTML = [
      '<div class="ae-head">',
      '  <strong>Admin Edit Mode</strong>',
      '  <button type="button" class="ae-x" aria-label="Close edit mode">&#215;</button>',
      '</div>',
      '<p class="ae-note">Draw a rectangle on the page. Everything you ask for applies ',
      'inside that box and nowhere else. <strong>No change takes effect until it is ',
      'confirmed</strong>, and every published change is logged so that it can be ',
      'undone later.</p>',
      '<div class="ae-row">',
      '  <button type="button" class="btn btn--small ae-pick">Select an area</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-clear" disabled>Clear the box</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-log">The change log</button>',
      '</div>',
      '<p class="ae-count muted xsmall">Nothing selected yet.</p>',
      '<label class="ae-label" for="ae-prompt">What should change inside the box?</label>',
      '<textarea id="ae-prompt" class="ae-prompt" rows="3" ',
      'placeholder="Make the heading gold. Replace the text with &quot;Life, Love, Magic.&quot; Hide this plate."></textarea>',
      '<div class="ae-row">',
      '  <button type="button" class="btn btn--small ae-go">Propose the change</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-undo" title="Step back through the prompts tried in this sitting">Undo prompt</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-redo" title="Step forward again">Redo prompt</button>',
      '</div>',
      '<div class="ae-draft" hidden></div>',
      '<div class="ae-row ae-confirm" hidden>',
      '  <button type="button" class="btn btn--small ae-publish">Confirm and publish</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-revert">Discard the preview</button>',
      '</div>',
      '<p class="ae-msg"></p>',
      '<div class="ae-log-out" hidden></div>'
    ].join("");
    document.body.appendChild(panel);

    panel.querySelector(".ae-x").addEventListener("click", closeAll);
    panel.querySelector(".ae-pick").addEventListener("click", startPick);
    panel.querySelector(".ae-clear").addEventListener("click", clearBox);
    panel.querySelector(".ae-log").addEventListener("click", showLog);
    panel.querySelector(".ae-go").addEventListener("click", propose);
    panel.querySelector(".ae-undo").addEventListener("click", function () { step(-1); });
    panel.querySelector(".ae-redo").addEventListener("click", function () { step(1); });
    panel.querySelector(".ae-publish").addEventListener("click", publish);
    panel.querySelector(".ae-revert").addEventListener("click", revertPreview);
  }

  function closeAll() {
    revertPreview();
    clearBox();
    if (panel) panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-editing");
  }

  /* ------------------------------------------------- the selection tool */
  function startPick() {
    clearBox();
    picking = true;
    document.body.classList.add("is-picking");
    say("Drag a rectangle over the part of the page you want to work on.");
  }

  function clearBox() {
    if (box && box.parentNode) box.parentNode.removeChild(box);
    box = null; rect = null; nodes = [];
    var clearBtn = panel && panel.querySelector(".ae-clear");
    var count = panel && panel.querySelector(".ae-count");
    if (clearBtn) clearBtn.disabled = true;
    if (count) count.textContent = "Nothing selected yet.";
  }

  var dragFrom = null;
  function onDown(e) {
    if (!picking) return;
    if (panel && panel.contains(e.target)) return;
    e.preventDefault();
    var p = point(e);
    dragFrom = p;
    box = el("div", "admin-edit-box");
    document.body.appendChild(box);
    draw(p, p);
  }
  function onMove(e) {
    if (!picking || !dragFrom) return;
    e.preventDefault();
    draw(dragFrom, point(e));
  }
  function onUp(e) {
    if (!picking || !dragFrom) return;
    var to = point(e);
    draw(dragFrom, to);
    picking = false;
    dragFrom = null;
    document.body.classList.remove("is-picking");
    gather();
  }
  function point(e) {
    var t = e.touches && e.touches[0] ? e.touches[0] : e;
    return { x: t.pageX, y: t.pageY };
  }
  function draw(a, b) {
    rect = {
      left: Math.min(a.x, b.x), top: Math.min(a.y, b.y),
      width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y)
    };
    box.style.left = rect.left + "px";
    box.style.top = rect.top + "px";
    box.style.width = rect.width + "px";
    box.style.height = rect.height + "px";
  }

  addEventListener("mousedown", onDown, true);
  addEventListener("mousemove", onMove, true);
  addEventListener("mouseup", onUp, true);
  addEventListener("touchstart", onDown, { capture: true, passive: false });
  addEventListener("touchmove", onMove, { capture: true, passive: false });
  addEventListener("touchend", onUp, true);

  /* Which elements are inside the rectangle. Leaves only: a container that
     merely surrounds the box would hand the editor the whole page. */
  function gather() {
    nodes = [];
    if (!rect || rect.width < 8 || rect.height < 8) {
      say("That box is too small to hold anything. Try again.", true);
      return;
    }
    var all = document.body.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      var node = all[i];
      if (panel && panel.contains(node)) continue;
      if (node === box || node === mount || mount.contains(node)) continue;
      if (node.closest && node.closest(".admin-edit-panel")) continue;
      var tag = node.tagName.toLowerCase();
      if (tag === "script" || tag === "style" || tag === "svg" || node.closest("svg")) continue;
      var r = node.getBoundingClientRect();
      var top = r.top + scrollY;
      var left = r.left + scrollX;
      if (!r.width || !r.height) continue;
      var inside = left >= rect.left - 2 && top >= rect.top - 2 &&
        left + r.width <= rect.left + rect.width + 2 &&
        top + r.height <= rect.top + rect.height + 2;
      if (!inside) continue;
      /* Only the smallest things that contain the content: if a child of
         this node is also inside, leave the parent out of the list. */
      var hasInnerSelected = false;
      for (var k = 0; k < node.children.length; k++) {
        var c = node.children[k].getBoundingClientRect();
        if (c.width && c.height &&
          c.left + scrollX >= rect.left - 2 && c.top + scrollY >= rect.top - 2 &&
          c.left + scrollX + c.width <= rect.left + rect.width + 2 &&
          c.top + scrollY + c.height <= rect.top + rect.height + 2) { hasInnerSelected = true; break; }
      }
      if (hasInnerSelected) continue;
      nodes.push({
        ref: pathOf(node),
        tag: tag,
        classes: typeof node.className === "string" ? node.className : "",
        text: (node.textContent || "").trim().slice(0, 400)
      });
      if (nodes.length >= 40) break;
    }
    var clearBtn2 = panel && panel.querySelector(".ae-clear");
    var count2 = panel && panel.querySelector(".ae-count");
    if (clearBtn2) clearBtn2.disabled = false;
    if (count2) {
      count2.textContent = nodes.length
        ? nodes.length + " element(s) inside the box. Nothing outside it can be touched."
        : "Nothing editable inside that box.";
    }
    say(nodes.length ? "Now say what should change." : "Draw a box around some words or a panel.",
      !nodes.length);
  }

  /* ---------------------------------------------------- prompt and draft */
  function step(dir) {
    if (!history.length) return say("No prompts to step through yet.");
    at = Math.max(0, Math.min(history.length - 1, at + dir));
    panel.querySelector(".ae-prompt").value = history[at];
    say("Prompt " + (at + 1) + " of " + history.length + ".");
  }

  function propose() {
    var prompt = panel.querySelector(".ae-prompt").value.trim();
    if (!nodes.length) return say("Select an area first.", true);
    if (!prompt) return say("Say what should change.", true);
    revertPreview();
    if (history[history.length - 1] !== prompt) history.push(prompt);
    at = history.length - 1;
    say("Thinking inside the box\u2026");
    post({ action: "draft", pass: pass, page: PAGE, prompt: prompt, rect: rect, nodes: nodes })
      .then(function (d) {
        draft = { prompt: prompt, ops: d.ops || [], source: d.source || "rules", via: d.via || "" };
        if (!draft.ops.length) {
          panel.querySelector(".ae-draft").hidden = true;
          panel.querySelector(".ae-confirm").hidden = true;
          return say(d.note || "Nothing could be made of that.", true);
        }
        preview = draft.ops.map(snapshot).filter(Boolean);
        draft.ops.forEach(function (op) {
          apply(op);
          var n = find(op.ref);
          if (n) n.classList.add("ae-touched");
        });
        var list = draft.ops.map(function (op) {
          return "<li><code>" + op.op + (op.prop ? " " + op.prop : "") + "</code> &rarr; " +
            (op.value ? String(op.value).slice(0, 60) : "(hidden)") + "</li>";
        }).join("");
        var out = panel.querySelector(".ae-draft");
        out.hidden = false;
        out.innerHTML = "<p class=\"muted xsmall\">Previewed on the page, not saved. " +
          draft.ops.length + " change(s), proposed by the " +
          (draft.source === "model" ? ("model" + (draft.via ? " \u2014 " + draft.via : "")) : "rules") +
          ".</p><ul class=\"ae-ops\">" + list + "</ul>";
        panel.querySelector(".ae-confirm").hidden = false;
        say("This is a preview. It will not take effect until you confirm.");
      })
      .catch(function (err) { say(err.message || "That did not work.", true); });
  }

  function revertPreview() {
    preview.forEach(restore);
    preview = [];
    document.querySelectorAll(".ae-touched").forEach(function (n) {
      n.classList.remove("ae-touched");
    });
    var out = panel && panel.querySelector(".ae-draft");
    var row = panel && panel.querySelector(".ae-confirm");
    if (out) out.hidden = true;
    if (row) row.hidden = true;
  }

  function publish() {
    if (!draft) return say("Propose a change first.", true);
    post({
      action: "save", pass: pass, page: PAGE, prompt: draft.prompt,
      rect: rect, ops: draft.ops, source: draft.source,
      confirm: "publish"
    }).then(function (d) {
      preview = [];
      document.querySelectorAll(".ae-touched").forEach(function (n) {
        n.classList.remove("ae-touched");
      });
      panel.querySelector(".ae-confirm").hidden = true;
      say("Published as change #" + d.id + ". It is in the log, and can be undone from there.");
    }).catch(function (err) { say(err.message || "It would not save.", true); });
  }

  /* ------------------------------------------------------------ the log */
  function showLog() {
    var out = panel.querySelector(".ae-log-out");
    out.hidden = false;
    out.innerHTML = "<p class=\"muted xsmall\">Reading the log\u2026</p>";
    post({ action: "list", pass: pass, page: PAGE }).then(function (d) {
      var rows = (d.edits || []).map(function (e) {
        return "<tr><td>#" + e.id + "</td><td>" + (e.prompt || "")
          .replace(/[<&]/g, "") + "</td><td>" + e.count + "</td><td>" + e.state +
          "</td><td><button type=\"button\" class=\"btn btn--small btn--ghost ae-flip\" " +
          "data-id=\"" + e.id + "\" data-to=\"" + (e.state === "live" ? "undo" : "redo") + "\">" +
          (e.state === "live" ? "Undo" : "Redo") + "</button></td></tr>";
      }).join("");
      out.innerHTML = rows
        ? "<p class=\"muted xsmall\">Every published change on this page. Undo takes it off " +
          "the page for everyone; redo puts it back. The log itself is never rewritten.</p>" +
          "<div class=\"table-scroll\"><table class=\"ae-table\"><thead><tr><th>#</th><th>Asked for</th>" +
          "<th>Ops</th><th>State</th><th></th></tr></thead><tbody>" + rows + "</tbody></table></div>"
        : "<p class=\"muted xsmall\">Nothing has been published on this page yet.</p>";
      out.querySelectorAll(".ae-flip").forEach(function (b) {
        b.addEventListener("click", function () {
          post({ action: b.getAttribute("data-to"), pass: pass, id: Number(b.getAttribute("data-id")) })
            .then(function () {
              say("Done. Reload the page to see it as a visitor will.");
              showLog();
            })
            .catch(function (err) { say(err.message || "That did not work.", true); });
        });
      });
    }).catch(function (err) {
      out.innerHTML = "<p class=\"ae-msg is-bad\">" + (err.message || "The log would not open.") + "</p>";
    });
  }

  /* ----------------------------------------------------------- the door */
  function openDoor() {
    if (panel) { panel.hidden = false; return; }
    panel = el("div", "admin-edit-panel admin-edit-locked");
    panel.innerHTML = [
      '<div class="ae-head">',
      '  <strong>Admin Edit Mode</strong>',
      '  <button type="button" class="ae-x" aria-label="Close edit mode">&#215;</button>',
      '</div>',
      '<p class="ae-note">The passcode, please. Three wrong and the door shuts for twenty minutes.</p>',
      '<label class="ae-label" for="ae-pass">Passcode</label>',
      '<input type="password" id="ae-pass" class="ae-prompt ae-pass" autocomplete="off">',
      '<div class="ae-row"><button type="button" class="btn btn--small ae-unlock">Open the door</button></div>',
      '<p class="ae-msg"></p>'
    ].join("");
    document.body.appendChild(panel);
    panel.querySelector(".ae-x").addEventListener("click", closeAll);
    var field = panel.querySelector(".ae-pass");
    var go = function () {
      var typed = field.value.trim();
      if (!typed) return say("The passcode, please.", true);
      say("Trying the door\u2026");
      post({ action: "list", pass: typed, page: PAGE }).then(function () {
        pass = typed;
        panel.parentNode.removeChild(panel);
        panel = null;
        openPanel();
        button.setAttribute("aria-expanded", "true");
        document.body.classList.add("is-editing");
        say("Select an area to begin.");
      }).catch(function (err) {
        say(err.message || "That is not the passcode.", true);
      });
    };
    panel.querySelector(".ae-unlock").addEventListener("click", go);
    field.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    field.focus();
  }

  button.addEventListener("click", function () {
    if (panel && !panel.hidden) { closeAll(); return; }
    if (pass) {
      openPanel();
      button.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-editing");
      return;
    }
    openDoor();
  });
})();
