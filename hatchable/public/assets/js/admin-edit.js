/**
 * Admin Edit Mode — the little door in the bottom-left corner of every page.
 *
 * WHAT IT IS FOR
 * Draw a box over part of a page and change exactly what is inside it:
 * the words, verbatim; the colour; the font, size and spacing, to the
 * pixel. Nothing outside the box moves, and the tool is built so that it
 * cannot move: every change is addressed either to an element the box
 * fully contains, or to a run of characters inside a single text node whose
 * own rectangle falls inside the box. There is no operation that can reach
 * anything else.
 *
 * HOW THE SELECTION WORKS
 * The old version only caught elements entirely inside the rectangle, so
 * dragging across half a paragraph caught nothing at all. This one measures
 * the page the way the browser draws it: every word is given a Range, the
 * Range is asked for its client rectangles, and a word counts as selected
 * when its own rectangle is inside the box. Consecutive selected words in
 * one text node become one run. That is what makes "the three words I
 * dragged over" mean the three words and not the paragraph they live in.
 *
 * THREE WAYS TO CHANGE IT
 *   Words — the exact selected text, in a box, to edit and apply verbatim.
 *           No model is involved and nothing is interpreted.
 *   Look  — colour, background, font, size in pixels, weight, italic,
 *           letter-spacing, alignment. Applied to the runs if the box holds
 *           words, to the elements if it holds whole blocks.
 *   Ask   — a sentence, sent to the same model stack the oracle uses, which
 *           may only answer with operations against what was selected.
 *
 * Everything is previewed on the page first, confirmed once, then published
 * and written to a log that can be read, undone and redone.
 *
 * House rule observed here: no backticks anywhere in this file.
 */
(function adminEdit() {
  var PAGE = location.pathname.replace(/index\.html$/, "") || "/";
  var FONTS = [
    ["", "leave the font as it is"],
    ["Cinzel, serif", "Cinzel \u2014 the display face"],
    ["'EB Garamond', serif", "EB Garamond \u2014 the body face"],
    ["Georgia, serif", "Georgia"],
    ["'Helvetica Neue', Arial, sans-serif", "Helvetica / Arial"],
    ["'Courier New', monospace", "Courier"]
  ];

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

  /* A selector that survives a reload: tag plus nth-of-type from body down.
     No ids are invented and no classes are relied on, because a class is
     one of the things this tool can change. */
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

  /* The nth child node of an element, which is how a run addresses the text
     node it lives in. Element children count too, so the index stays true
     when a paragraph holds a <strong> in the middle of it. */
  function childAt(parent, index) {
    if (!parent) return null;
    var n = parent.childNodes[index];
    return n && n.nodeType === 3 ? n : null;
  }

  function ours(node) {
    if (!node) return true;
    var n = node.nodeType === 3 ? node.parentElement : node;
    if (!n) return true;
    if (panel && panel.contains(n)) return true;
    if (mount.contains(n)) return true;
    if (n === boxEl || n === hoverEl) return true;
    return false;
  }

  /* --------------------------------------------- applying an operation */
  /* Every op carries everything needed to find its target again from a cold
     page, which is what lets a published change be replayed for a visitor
     who has never seen the editor. */
  function apply(op) {
    var node = find(op.ref);
    if (!node) return false;

    /* ---- a run of characters inside one text node --------------------- */
    if (op.op === "span-style" || op.op === "span-text") {
      var text = childAt(node, Number(op.node));
      if (!text) return false;
      var start = Math.max(0, Math.min(text.length, Number(op.start)));
      var end = Math.max(start, Math.min(text.length, Number(op.end)));
      if (end <= start) return false;
      var range = document.createRange();
      range.setStart(text, start);
      range.setEnd(text, end);
      if (op.op === "span-text") {
        range.deleteContents();
        range.insertNode(document.createTextNode(String(op.value || "")));
        node.normalize();
        return true;
      }
      var span = document.createElement("span");
      span.className = "ae-run";
      span.style.setProperty(op.prop, op.value);
      try { range.surroundContents(span); } catch (e) { return false; }
      return true;
    }

    /* ---- a whole element ---------------------------------------------- */
    if (op.op === "text") node.textContent = op.value;
    else if (op.op === "hide") node.style.display = "none";
    else if (op.op === "show") node.style.display = "";
    else if (op.op === "style" && op.prop) node.style.setProperty(op.prop, op.value);
    else if (op.op === "colour") node.style.setProperty("color", op.value);
    else if (op.op === "background") node.style.setProperty("background-color", op.value);
    else if (op.op === "border") node.style.setProperty("border-color", op.value);
    else if (op.op === "font-size") node.style.setProperty("font-size", op.value);
    else if (op.op === "align") node.style.setProperty("text-align", op.value);
    return true;
  }

  /* To undo a preview exactly, the whole element is photographed before it
     is touched: its markup and its inline style. Restoring is then one
     assignment and cannot drift. */
  function snapshot(op) {
    var node = find(op.ref);
    if (!node) return null;
    return { ref: op.ref, html: node.innerHTML, style: node.getAttribute("style") || "" };
  }

  function restore(shot) {
    var node = shot && find(shot.ref);
    if (!node) return;
    node.innerHTML = shot.html;
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

  /* A page whose source was saved through the Source tab is served in place
     of the built file: the browser writes it over the document, exactly as
     if the file itself had been edited on the platform. The written page
     carries a flag so it does not write itself again. */
  if (!window.__aeSourceDone) {
    fetch("/api/edit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "source", page: PAGE })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.html) return;
      window.__aeSourceDone = true;
      var head = d.html.replace(/<head(\s|>)/i, function (m, sp) {
        return "<head" + sp + "<scr" + "ipt>window.__aeSourceDone=1;</scr" + "ipt>";
      });
      document.open();
      document.write(head);
      document.close();
    }).catch(function () { /* the built page stands */ });
  }

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
  var boxEl = null;          /* the rectangle on screen */
  var hoverEl = null;        /* the outline that follows the pointer */
  var rect = null;           /* its page coordinates */
  var runs = [];             /* word runs inside the box */
  var blocks = [];           /* whole elements inside the box */
  var draft = null;          /* the ops last proposed, awaiting confirmation */
  var shots = [];            /* snapshots taken before previewing */
  var history = [];          /* prompts tried in this sitting */
  var at = -1;               /* where in that history we stand */

  function q(sel) { return panel ? panel.querySelector(sel) : null; }

  function say(text, bad) {
    var n = q(".ae-msg");
    if (!n) return;
    n.textContent = text || "";
    n.className = "ae-msg" + (bad ? " is-bad" : "");
  }

  function selectedText() {
    return runs.map(function (r) { return r.text; }).join(" ");
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
      '<p class="ae-note">Drag a box over any part of the page \u2014 whole blocks or just a few ',
      'words. Only what is inside it can be changed. Nothing takes effect until it is confirmed, ',
      'and every published change is logged so it can be undone.</p>',
      '<div class="ae-row">',
      '  <button type="button" class="btn btn--small ae-pick">Drag a box</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-one">Click one element</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-clear" disabled>Clear</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-log">Log</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-undo-pub" title="Undo the last published change on this page">Undo</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-redo-pub" title="Bring back the last undone change">Redo</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-signins">Sign-ins</button>',
      '</div>',
      '<p class="ae-count muted xsmall">Nothing selected yet.</p>',

      '<div class="ae-tabs" role="tablist">',
      '  <button type="button" class="ae-tab is-on" data-tab="words" role="tab">Words</button>',
      '  <button type="button" class="ae-tab" data-tab="look" role="tab">Look</button>',
      '  <button type="button" class="ae-tab" data-tab="ask" role="tab">Ask</button>',
      '  <button type="button" class="ae-tab" data-tab="source" role="tab">Source</button>',
      '</div>',

      /* ---- verbatim words ------------------------------------------- */
      '<section class="ae-pane" data-pane="words">',
      '  <label class="ae-label" for="ae-verbatim">The selected words, exactly as they are. ',
      '  Edit them and apply \u2014 nothing is interpreted.</label>',
      '  <textarea id="ae-verbatim" class="ae-prompt ae-verbatim" rows="4"></textarea>',
      '  <div class="ae-row">',
      '    <button type="button" class="btn btn--small ae-words">Apply these words</button>',
      '    <button type="button" class="btn btn--small btn--ghost ae-para" ',
      '    title="Rewrite the selection in the house voice, checked against the order\u2019s current knowledge">Paraphrase</button>',
      '  </div>',
      '</section>',

      /* ---- look ------------------------------------------------------ */
      '<section class="ae-pane" data-pane="look" hidden>',
      '  <div class="ae-grid">',
      '    <label>Text colour<span class="ae-pair">',
      '      <input type="color" class="ae-colour" value="#d7b05a">',
      '      <input type="checkbox" class="ae-colour-on"> use</span></label>',
      '    <label>Background<span class="ae-pair">',
      '      <input type="color" class="ae-bg" value="#0e0c0a">',
      '      <input type="checkbox" class="ae-bg-on"> use</span></label>',
      '    <label>Font<select class="ae-font"></select></label>',
      '    <label>Size (px)<input type="number" class="ae-size" min="6" max="200" step="1" placeholder="leave"></label>',
      '    <label>Weight<select class="ae-weight">',
      '      <option value="">leave</option><option value="400">normal</option>',
      '      <option value="600">semibold</option><option value="700">bold</option></select></label>',
      '    <label>Letter-spacing (px)<input type="number" class="ae-track" min="-5" max="20" step="0.1" placeholder="leave"></label>',
      '    <label>Style<select class="ae-italic"><option value="">leave</option>',
      '      <option value="italic">italic</option><option value="normal">upright</option></select></label>',
      '    <label>Align<select class="ae-align"><option value="">leave</option>',
      '      <option value="left">left</option><option value="center">centre</option>',
      '      <option value="right">right</option></select></label>',
      '  </div>',
      '  <div class="ae-row"><button type="button" class="btn btn--small ae-look">Apply this look</button></div>',
      '</section>',

      /* ---- ask ------------------------------------------------------- */
      '<section class="ae-pane" data-pane="ask" hidden>',
      '  <label class="ae-label" for="ae-prompt">Say what should change inside the box.</label>',
      '  <textarea id="ae-prompt" class="ae-prompt" rows="3" ',
      'placeholder="Make these words rose. Set the heading in Cinzel at 28px. Hide this plate."></textarea>',
      '  <div class="ae-row">',
      '    <button type="button" class="btn btn--small ae-go">Propose the change</button>',
      '    <button type="button" class="btn btn--small btn--ghost ae-undo" title="Step back through the prompts tried in this sitting">Undo prompt</button>',
      '    <button type="button" class="btn btn--small btn--ghost ae-redo" title="Step forward again">Redo prompt</button>',
      '  </div>',
      '</section>',

      /* ---- source: the whole page, edited like a file ----------------- */
      '<section class="ae-pane" data-pane="source" hidden>',
      '  <p class="muted xsmall">The entire page as one document, edited the way the platform edits a ',
      '  file. Every save writes a backup first, and any backup can be restored from the log.</p>',
      '  <textarea class="ae-prompt ae-source" rows="12" spellcheck="false"></textarea>',
      '  <div class="ae-row">',
      '    <button type="button" class="btn btn--small ae-src-load">Load the page source</button>',
      '    <button type="button" class="btn btn--small btn--ghost ae-src-save">Save the source (backs up first)</button>',
      '  </div>',
      '</section>',

      '<div class="ae-draft" hidden></div>',
      '<div class="ae-row ae-confirm" hidden>',
      '  <button type="button" class="btn btn--small ae-publish">Confirm and publish</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-revert">Discard the preview</button>',
      '</div>',
      '<p class="ae-msg"></p>',
      '<div class="ae-log-out" hidden></div>'
    ].join("");
    document.body.appendChild(panel);

    var font = q(".ae-font");
    FONTS.forEach(function (f) {
      var o = document.createElement("option");
      o.value = f[0];
      o.textContent = f[1];
      font.appendChild(o);
    });

    q(".ae-x").addEventListener("click", closeAll);
    q(".ae-pick").addEventListener("click", startDrag);
    q(".ae-one").addEventListener("click", startClick);
    q(".ae-clear").addEventListener("click", clearBox);
    q(".ae-log").addEventListener("click", showLog);
    q(".ae-words").addEventListener("click", applyWords);
    q(".ae-look").addEventListener("click", applyLook);
    q(".ae-go").addEventListener("click", propose);
    q(".ae-undo").addEventListener("click", function () { step(-1); });
    q(".ae-redo").addEventListener("click", function () { step(1); });
    q(".ae-publish").addEventListener("click", publish);
    q(".ae-revert").addEventListener("click", revertPreview);
    q(".ae-para").addEventListener("click", paraphrase);
    q(".ae-undo-pub").addEventListener("click", function () { pubStep("undo"); });
    q(".ae-redo-pub").addEventListener("click", function () { pubStep("redo"); });
    q(".ae-signins").addEventListener("click", showSignins);
    q(".ae-src-load").addEventListener("click", loadSource);
    q(".ae-src-save").addEventListener("click", saveSource);
    panel.querySelectorAll(".ae-tab").forEach(function (b) {
      b.addEventListener("click", function () {
        panel.querySelectorAll(".ae-tab").forEach(function (o) { o.classList.remove("is-on"); });
        b.classList.add("is-on");
        panel.querySelectorAll(".ae-pane").forEach(function (p) {
          p.hidden = p.getAttribute("data-pane") !== b.getAttribute("data-tab");
        });
      });
    });
  }

  function closeAll() {
    revertPreview();
    clearBox();
    stopPicking();
    if (panel) panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-editing");
  }

  /* ------------------------------------------------- the selection tool */
  var mode = "";             /* 'drag' | 'click' | '' */
  var dragFrom = null;

  function startDrag() {
    revertPreview(); clearBox();
    mode = "drag"; picking = true;
    document.body.classList.add("is-picking");
    say("Drag across the words, the paragraph or the panel you want to change.");
  }

  function startClick() {
    revertPreview(); clearBox();
    mode = "click"; picking = true;
    document.body.classList.add("is-picking");
    say("Click the one thing you want to change. Hover shows what will be taken.");
  }

  function stopPicking() {
    picking = false; mode = ""; dragFrom = null;
    document.body.classList.remove("is-picking");
    if (hoverEl && hoverEl.parentNode) hoverEl.parentNode.removeChild(hoverEl);
    hoverEl = null;
  }

  function clearBox() {
    if (boxEl && boxEl.parentNode) boxEl.parentNode.removeChild(boxEl);
    boxEl = null; rect = null; runs = []; blocks = [];
    paintMarks();
    var clearBtn = q(".ae-clear");
    var count = q(".ae-count");
    var verbatim = q(".ae-verbatim");
    if (clearBtn) clearBtn.disabled = true;
    if (count) count.textContent = "Nothing selected yet.";
    if (verbatim) verbatim.value = "";
  }

  function point(e) {
    var t = e.touches && e.touches[0] ? e.touches[0] : e;
    return { x: t.pageX, y: t.pageY };
  }

  function drawBox(a, b) {
    rect = {
      left: Math.min(a.x, b.x), top: Math.min(a.y, b.y),
      width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y)
    };
    if (!boxEl) { boxEl = el("div", "admin-edit-box"); document.body.appendChild(boxEl); }
    boxEl.style.left = rect.left + "px";
    boxEl.style.top = rect.top + "px";
    boxEl.style.width = rect.width + "px";
    boxEl.style.height = rect.height + "px";
  }

  function onDown(e) {
    if (!picking || (panel && panel.contains(e.target))) return;
    if (mode === "click") {
      e.preventDefault(); e.stopPropagation();
      var target = e.target;
      if (ours(target)) return;
      var r = target.getBoundingClientRect();
      drawBox({ x: r.left + scrollX, y: r.top + scrollY },
        { x: r.right + scrollX, y: r.bottom + scrollY });
      stopPicking();
      gather();
      return;
    }
    e.preventDefault();
    dragFrom = point(e);
    drawBox(dragFrom, dragFrom);
  }

  function onMove(e) {
    if (!picking) return;
    if (mode === "click") {
      var target = e.target;
      if (ours(target)) return;
      if (!hoverEl) { hoverEl = el("div", "admin-edit-hover"); document.body.appendChild(hoverEl); }
      var r = target.getBoundingClientRect();
      hoverEl.style.left = (r.left + scrollX) + "px";
      hoverEl.style.top = (r.top + scrollY) + "px";
      hoverEl.style.width = r.width + "px";
      hoverEl.style.height = r.height + "px";
      return;
    }
    if (!dragFrom) return;
    e.preventDefault();
    drawBox(dragFrom, point(e));
  }

  function onUp(e) {
    if (!picking || mode !== "drag" || !dragFrom) return;
    drawBox(dragFrom, point(e));
    stopPicking();
    gather();
  }

  addEventListener("mousedown", onDown, true);
  addEventListener("mousemove", onMove, true);
  addEventListener("mouseup", onUp, true);
  addEventListener("touchstart", onDown, { capture: true, passive: false });
  addEventListener("touchmove", onMove, { capture: true, passive: false });
  addEventListener("touchend", onUp, true);

  /* ------------------------------------------- what is inside the box --
     Two passes. First the words: every text node is walked, every word in
     it is given a Range, and the Range is asked where the browser actually
     drew it. A word whose own rectangle sits inside the box is in; the rest
     is not, however close. Consecutive words in one text node are merged
     into a single run, so three dragged-over words become one operation
     with a start and an end measured in characters.

     Then the blocks: elements wholly inside the box and holding no selected
     words of their own \u2014 a plate, a frame, a button \u2014 which are the things
     a background or a border belongs to. */
  function inBox(r) {
    if (!r || (!r.width && !r.height)) return false;
    var cx = r.left + scrollX + r.width / 2;
    var cy = r.top + scrollY + r.height / 2;
    return cx >= rect.left && cx <= rect.left + rect.width &&
      cy >= rect.top && cy <= rect.top + rect.height;
  }

  function gather() {
    runs = []; blocks = [];
    if (!rect || rect.width < 4 || rect.height < 4) {
      say("That box is too small to hold anything. Try again.", true);
      return;
    }

    var walker = document.createTreeWalker(document.body, 4, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return 2;
        var p = n.parentElement;
        if (!p || ours(p)) return 2;
        var tag = p.tagName.toLowerCase();
        if (tag === "script" || tag === "style" || tag === "textarea") return 2;
        if (p.closest("svg")) return 2;
        return 1;
      }
    });

    var text;
    while ((text = walker.nextNode())) {
      var parent = text.parentElement;
      var index = Array.prototype.indexOf.call(parent.childNodes, text);
      var value = text.nodeValue;
      var word = /\S+/g;
      var hit;
      var run = null;
      while ((hit = word.exec(value))) {
        var range = document.createRange();
        range.setStart(text, hit.index);
        range.setEnd(text, hit.index + hit[0].length);
        var rects = range.getClientRects();
        var caught = false;
        for (var i = 0; i < rects.length; i++) { if (inBox(rects[i])) { caught = true; break; } }
        if (caught) {
          if (run && hit.index - run.end <= 3) run.end = hit.index + hit[0].length;
          else {
            run = { ref: pathOf(parent), node: index, start: hit.index,
              end: hit.index + hit[0].length, el: parent };
            runs.push(run);
          }
        } else {
          run = null;
        }
      }
    }
    runs.forEach(function (r) {
      var node = childAt(find(r.ref), r.node);
      r.text = node ? node.nodeValue.slice(r.start, r.end) : "";
    });
    runs = runs.filter(function (r) { return r.text; });

    var touched = runs.map(function (r) { return r.el; });
    var all = document.body.querySelectorAll("*");
    for (var k = 0; k < all.length && blocks.length < 30; k++) {
      var node2 = all[k];
      if (ours(node2)) continue;
      var tag2 = node2.tagName.toLowerCase();
      if (tag2 === "script" || tag2 === "style" || node2.closest("svg")) continue;
      var r2 = node2.getBoundingClientRect();
      if (!r2.width || !r2.height) continue;
      var left = r2.left + scrollX, top = r2.top + scrollY;
      var whollyIn = left >= rect.left - 2 && top >= rect.top - 2 &&
        left + r2.width <= rect.left + rect.width + 2 &&
        top + r2.height <= rect.top + rect.height + 2;
      if (!whollyIn) continue;
      if (touched.some(function (t) { return t === node2 || node2.contains(t); })) continue;
      if (blocks.some(function (b) { return b.el.contains(node2); })) continue;
      blocks.push({
        ref: pathOf(node2), el: node2, tag: tag2,
        classes: typeof node2.className === "string" ? node2.className : "",
        text: (node2.textContent || "").trim().slice(0, 200)
      });
    }

    paintMarks();
    var clearBtn = q(".ae-clear");
    if (clearBtn) clearBtn.disabled = false;
    var words = runs.reduce(function (n, r) { return n + r.text.split(/\s+/).length; }, 0);
    var count = q(".ae-count");
    if (count) {
      count.textContent = runs.length || blocks.length
        ? words + " word(s) in " + runs.length + " run(s), and " + blocks.length +
          " whole element(s). Nothing outside the box can be touched."
        : "Nothing inside that box can be changed. Try a slightly bigger one.";
    }
    var verbatim = q(".ae-verbatim");
    if (verbatim) verbatim.value = selectedText();
    say(runs.length || blocks.length
      ? "Selected. Edit the words, set the look, or ask for something."
      : "Nothing caught. Drag across some words or a panel.", !(runs.length || blocks.length));
  }

  /* A faint mark under everything that is selected, so there is never any
     doubt about what the next button will touch. */
  var marks = [];
  function paintMarks() {
    marks.forEach(function (m) { if (m.parentNode) m.parentNode.removeChild(m); });
    marks = [];
    function mark(r, cls) {
      var m = el("div", cls);
      m.style.left = (r.left + scrollX) + "px";
      m.style.top = (r.top + scrollY) + "px";
      m.style.width = r.width + "px";
      m.style.height = r.height + "px";
      document.body.appendChild(m);
      marks.push(m);
    }
    runs.forEach(function (r) {
      var node = childAt(find(r.ref), r.node);
      if (!node) return;
      var range = document.createRange();
      range.setStart(node, r.start);
      range.setEnd(node, Math.min(node.length, r.end));
      var rects = range.getClientRects();
      for (var i = 0; i < rects.length; i++) mark(rects[i], "admin-edit-mark");
    });
    blocks.forEach(function (b) { mark(b.el.getBoundingClientRect(), "admin-edit-mark is-block"); });
  }

  /* ------------------------------------------------ proposing a change */
  function preview(ops, how, via) {
    revertPreview();
    if (!ops.length) return say("That would not change anything.", true);
    draft = { prompt: how, ops: ops, source: via ? "model" : "direct", via: via || "" };
    var refs = [];
    ops.forEach(function (op) { if (refs.indexOf(op.ref) < 0) refs.push(op.ref); });
    shots = refs.map(function (ref) { return snapshot({ ref: ref }); }).filter(Boolean);
    /* Later runs in the same text node shift when an earlier one is
       replaced, so operations are applied from the end backwards. */
    ops.slice().sort(function (a, b) { return (Number(b.start) || 0) - (Number(a.start) || 0); })
      .forEach(apply);
    var list = ops.map(function (op) {
      var what = op.op === "span-text" || op.op === "text" ? "the words"
        : op.op === "hide" ? "hidden" : (op.prop || op.op);
      return "<li><code>" + what + "</code> &rarr; " +
        (op.value ? String(op.value).slice(0, 60) : "(removed)") + "</li>";
    }).join("");
    var out = q(".ae-draft");
    out.hidden = false;
    out.innerHTML = "<p class=\"muted xsmall\">Previewed on the page, not saved. " +
      ops.length + " change(s)" + (via ? " \u2014 " + via : "") + ".</p><ul class=\"ae-ops\">" +
      list + "</ul>";
    q(".ae-confirm").hidden = false;
    paintMarks();
    say("This is a preview. It will not take effect until you confirm.");
  }

  function revertPreview() {
    shots.forEach(restore);
    shots = [];
    draft = null;
    var out = q(".ae-draft");
    var row = q(".ae-confirm");
    if (out) out.hidden = true;
    if (row) row.hidden = true;
  }

  /* ---- words, verbatim ------------------------------------------------ */
  function applyWords() {
    if (!runs.length) return say("Select some words first \u2014 drag across them.", true);
    var wanted = q(".ae-verbatim").value;
    if (wanted === selectedText()) return say("Those are the words that are already there.", true);
    /* One run keeps the replacement exact. Several runs are collapsed into
       the first, and the rest are emptied, which is the only honest way to
       put one piece of text where several pieces were. */
    var ops = runs.map(function (r, i) {
      return { ref: r.ref, op: "span-text", node: r.node, start: r.start, end: r.end,
        value: i === 0 ? wanted : "" };
    });
    preview(ops, "verbatim: " + wanted.slice(0, 120), "");
  }

  /* ---- look ----------------------------------------------------------- */
  function applyLook() {
    if (!runs.length && !blocks.length) return say("Select something first.", true);
    var wants = [];
    if (q(".ae-colour-on").checked) wants.push(["color", q(".ae-colour").value]);
    if (q(".ae-bg-on").checked) wants.push(["background-color", q(".ae-bg").value]);
    if (q(".ae-font").value) wants.push(["font-family", q(".ae-font").value]);
    if (q(".ae-size").value) wants.push(["font-size", Number(q(".ae-size").value) + "px"]);
    if (q(".ae-weight").value) wants.push(["font-weight", q(".ae-weight").value]);
    if (q(".ae-track").value) wants.push(["letter-spacing", Number(q(".ae-track").value) + "px"]);
    if (q(".ae-italic").value) wants.push(["font-style", q(".ae-italic").value]);
    if (q(".ae-align").value) wants.push(["text-align", q(".ae-align").value]);
    if (!wants.length) return say("Tick a colour or choose a font, a size or a weight.", true);

    var ops = [];
    wants.forEach(function (w) {
      /* Alignment and background belong to a block; a colour, a font and a
         size can be put on the words themselves. */
      var blockOnly = w[0] === "text-align" || w[0] === "background-color";
      if (!blockOnly) {
        runs.forEach(function (r) {
          ops.push({ ref: r.ref, op: "span-style", node: r.node, start: r.start, end: r.end,
            prop: w[0], value: w[1] });
        });
      }
      blocks.forEach(function (b) {
        ops.push({ ref: b.ref, op: "style", prop: w[0], value: w[1] });
      });
      if (blockOnly && !blocks.length && runs.length) {
        runs.forEach(function (r) {
          var owner = pathOf(find(r.ref));
          if (!ops.some(function (o) { return o.ref === owner && o.prop === w[0]; })) {
            ops.push({ ref: owner, op: "style", prop: w[0], value: w[1] });
          }
        });
      }
    });
    preview(ops, "look: " + wants.map(function (w) { return w[0] + " " + w[1]; }).join(", "), "");
  }

  /* ---- ask ------------------------------------------------------------ */
  function step(dir) {
    if (!history.length) return say("No prompts to step through yet.");
    at = Math.max(0, Math.min(history.length - 1, at + dir));
    q(".ae-prompt").value = history[at];
    say("Prompt " + (at + 1) + " of " + history.length + ".");
  }

  function propose() {
    var prompt = q(".ae-prompt").value.trim();
    if (!runs.length && !blocks.length) return say("Select an area first.", true);
    if (!prompt) return say("Say what should change.", true);
    revertPreview();
    if (history[history.length - 1] !== prompt) history.push(prompt);
    at = history.length - 1;
    say("Thinking, inside the box only\u2026");

    /* The model is shown the runs and the blocks, and nothing else of the
       page. Each carries the reference it must quote back. */
    var nodes = runs.map(function (r, i) {
      return { ref: "run:" + i, kind: "words", tag: "text", text: r.text };
    }).concat(blocks.map(function (b, i) {
      return { ref: "block:" + i, kind: "element", tag: b.tag, classes: b.classes, text: b.text };
    }));

    post({ action: "draft", pass: pass, page: PAGE, prompt: prompt, rect: rect, nodes: nodes })
      .then(function (d) {
        var ops = [];
        (d.ops || []).forEach(function (op) {
          var m = /^(run|block):(\d+)$/.exec(op.ref || "");
          if (!m) return;
          var i = Number(m[2]);
          if (m[1] === "run") {
            var r = runs[i];
            if (!r) return;
            if (op.op === "text") {
              ops.push({ ref: r.ref, op: "span-text", node: r.node, start: r.start, end: r.end,
                value: op.value });
            } else if (op.op === "style" && op.prop) {
              ops.push({ ref: r.ref, op: "span-style", node: r.node, start: r.start, end: r.end,
                prop: op.prop, value: op.value });
            }
          } else {
            var b = blocks[i];
            if (!b) return;
            ops.push(Object.assign({}, op, { ref: b.ref }));
          }
        });
        if (!ops.length) {
          return say(d.note || "Nothing could be made of that, inside this box.", true);
        }
        preview(ops, prompt, (d.source === "model" ? (d.via || "model") : "rules"));
      })
      .catch(function (err) { say(err.message || "That did not work.", true); });
  }

  /* --------------------------------------------------------- publishing */
  function publish() {
    if (!draft) return say("Propose a change first.", true);
    post({
      action: "save", pass: pass, page: PAGE, prompt: draft.prompt,
      rect: rect, ops: draft.ops, source: draft.source, confirm: "publish"
    }).then(function (d) {
      shots = [];
      var row = q(".ae-confirm");
      if (row) row.hidden = true;
      draft = null;
      say("Published as change #" + d.id + ". It is in the log and can be undone there.");
    }).catch(function (err) { say(err.message || "It would not save.", true); });
  }

  /* ------------------------------------------------------------ the log */
  function showLog() {
    var out = q(".ae-log-out");
    out.hidden = false;
    out.innerHTML = "<p class=\"muted xsmall\">Reading the log\u2026</p>";
    post({ action: "list", pass: pass, page: PAGE }).then(function (d) {
      var rows = (d.edits || []).map(function (e) {
        return "<tr><td>#" + e.id + "</td><td>" + String(e.prompt || "")
          .replace(/[<&]/g, "") + "</td><td>" + e.count + "</td><td>" + e.state +
          "</td><td><button type=\"button\" class=\"btn btn--small btn--ghost ae-flip\" " +
          "data-id=\"" + e.id + "\" data-to=\"" + (e.state === "live" ? "undo" : "redo") + "\">" +
          (e.state === "live" ? "Undo" : "Redo") + "</button></td></tr>";
      }).join("");
      out.innerHTML = rows
        ? "<p class=\"muted xsmall\">Every published change on this page. Undo takes it off the " +
          "page for everyone; redo puts it back. The log itself is never rewritten.</p>" +
          "<div class=\"table-scroll\"><table class=\"ae-table\"><thead><tr><th>#</th><th>Asked for</th>" +
          "<th>Ops</th><th>State</th><th></th></tr></thead><tbody>" + rows + "</tbody></table></div>"
        : "<p class=\"muted xsmall\">Nothing has been published on this page yet.</p>";
      out.querySelectorAll(".ae-flip").forEach(function (b) {
        b.addEventListener("click", function () {
          post({ action: b.getAttribute("data-to"), pass: pass, id: Number(b.getAttribute("data-id")) })
            .then(function () { say("Done. Reload to see it as a visitor will."); showLog(); })
            .catch(function (err) { say(err.message || "That did not work.", true); });
        });
      });
    }).catch(function (err) {
      out.innerHTML = "<p class=\"ae-msg is-bad\">" + (err.message || "The log would not open.") + "</p>";
    });
  }

  /* Paraphrase the selected words against the order's most current
     knowledge. The server consults the corpus and the site map first and
     tells the model it may not contradict them; the result lands in the
     verbatim box, where it stays editable until it is applied. */
  function paraphrase() {
    var ta = q(".ae-verbatim");
    var text = (ta && ta.value) || selectedText();
    if (!text || !text.trim()) return say("Select some words to paraphrase first.", true);
    say("Paraphrasing against the order's knowledge\u2026");
    post({ action: "paraphrase", pass: pass, page: PAGE, text: text }).then(function (d) {
      if (ta) ta.value = d.paraphrase;
      say("Paraphrased, checked against " + (d.checked || 0) + " entries of the order's knowledge" +
        (d.via ? " (" + d.via + ")" : "") + ". Read it, then Apply these words.");
    }).catch(function (err) { say(err.message || "It would not paraphrase.", true); });
  }

  /* Undo / redo the most recent published change on this page, then reload
     so the administrator sees what a visitor will. */
  function pubStep(want) {
    post({ action: "list", pass: pass, page: PAGE }).then(function (d) {
      var pick = null;
      var edits = d.edits || [];
      for (var i = 0; i < edits.length; i++) {
        if (edits[i].state === (want === "undo" ? "live" : "undone")) { pick = edits[i]; break; }
      }
      if (!pick) return say(want === "undo"
        ? "Nothing published on this page to undo."
        : "Nothing undone on this page to redo.", true);
      post({ action: want, pass: pass, id: pick.id }).then(function () {
        say((want === "undo" ? "Undone" : "Redone") + " \u2014 reloading.");
        setTimeout(function () { location.reload(); }, 600);
      }).catch(function (err) { say(err.message || "That would not " + want + ".", true); });
    }).catch(function (err) { say(err.message || "The log could not be read.", true); });
  }

  /* The sign-in ledger: who came through the door, how, and when. */
  function showSignins() {
    var out = q(".ae-log-out");
    if (!out) return;
    out.hidden = false;
    out.innerHTML = "<p class=\"muted xsmall\">Reading the ledger\u2026</p>";
    post({ action: "signins", pass: pass }).then(function (d) {
      var rows = (d.signins || []).map(function (r) {
        return "<tr><td>" + String((r.name || "") + " " + (r.email || ""))
          .replace(/[<&]/g, "") + "</td><td>" + String(r.how || "").replace(/[<&]/g, "") +
          "</td><td>" + String(r.at || "").slice(0, 16).replace(/[<&]/g, "") + "</td></tr>";
      }).join("");
      out.innerHTML = rows
        ? "<p class=\"muted xsmall\">Every sign-in is kept, and a note goes to the order's address each time.</p>" +
          "<div class=\"table-scroll\"><table class=\"ae-table\"><thead><tr><th>Who</th><th>How</th>" +
          "<th>When</th></tr></thead><tbody>" + rows + "</tbody></table></div>"
        : "<p class=\"muted xsmall\">No sign-ins kept yet.</p>";
    }).catch(function (err) {
      out.innerHTML = "<p class=\"ae-msg is-bad\">" + (err.message || "The ledger would not open.") + "</p>";
    });
  }

  /* ------------------------------------------------- the page as a file */
  function loadSource() {
    var ta = q(".ae-source");
    if (!ta) return;
    post({ action: "source", page: PAGE }).then(function (d) {
      if (d && d.html) { ta.value = d.html; say("The saved source is in the box."); return; }
      return fetch(PAGE).then(function (r) { return r.text(); }).then(function (t) {
        ta.value = t;
        say("The served page is in the box \u2014 no saved source yet.");
      });
    }).catch(function (err) { say(err.message || "The source could not be loaded.", true); });
  }

  function saveSource() {
    var ta = q(".ae-source");
    if (!ta || !ta.value || ta.value.length < 40) return say("Load the source first.", true);
    if (!window.confirm("Save the whole page as edited? A backup of what stands now is kept, " +
      "and every visitor will see the new page.")) return;
    post({ action: "save-source", pass: pass, page: PAGE, html: ta.value }).then(function () {
      say("Saved, with a backup kept \u2014 reloading.");
      setTimeout(function () { location.reload(); }, 600);
    }).catch(function (err) { say(err.message || "It would not save.", true); });
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
    q(".ae-x").addEventListener("click", closeAll);
    var field = q(".ae-pass");
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
        say("Drag a box over anything on the page to begin.");
      }).catch(function (err) {
        say(err.message || "That is not the passcode.", true);
      });
    };
    q(".ae-unlock").addEventListener("click", go);
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

  /* The marks are drawn in page coordinates, so they follow a resize only
     if they are redrawn. */
  addEventListener("resize", function () { if (runs.length || blocks.length) paintMarks(); });
})();
