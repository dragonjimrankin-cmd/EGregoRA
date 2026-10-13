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
 * THE WAYS TO CHANGE IT
 *   Words — the exact selected text, in a box, to edit and apply verbatim.
 *           No model is involved and nothing is interpreted.
 *   Look  — colour, background, font, size in pixels, weight, italic,
 *           letter-spacing, alignment, line height, opacity, decoration,
 *           case, border, corners, padding, margin and shadow — plus
 *           one-touch presets in the house colours and faces, and a mirror
 *           button that takes the same looks back off.
 *   Do    — the structural work: move a block among its neighbours,
 *           duplicate it, hide, restore or erase it altogether, reset its
 *           look, point a link, swap an image, and insert a new element
 *           beside it — headings, paragraphs, quotations, lists, tables,
 *           code, links, buttons, pictures, video, audio, embeds, figures,
 *           dividers and plain containers.
 *   Ask   — a sentence, sent to the same model stack the oracle uses, which
 *           may only answer with operations against what was selected.
 *
 * And the quick ways in: double-click anything to select it, a little
 * toolbar beside the box for the common moves, Widen/Narrow to correct the
 * selection without re-dragging, Escape to step back, "e" to open the
 * door, a 1-2-3 guide, a whole-site log, and the backups — every publish
 * and source save keeps one, and any of them restores in a click.
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
    if (doorToken) payload.token = doorToken; /* the remembered key rides along; the server checks it before anything else */
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

  /* The styles for the editor's own furniture, carried in the file itself
     so the tool never depends on a stylesheet build it cannot see. */
  function injectStyles() {
    if (document.getElementById("ae-extra-style")) return;
    var css = [
      ".ae-steps { font-size: .74rem; color: #9f947a; margin: .25rem 0 .1rem; letter-spacing: .05em; }",
      ".ae-step { opacity: .5; }",
      ".ae-step.is-on { opacity: 1; color: #f3ddaa; }",
      ".ae-presets { display: flex; flex-wrap: wrap; gap: .3rem; margin: .3rem 0 .55rem; }",
      ".ae-chip { background: #0e0c0a; border: 1px solid rgba(215,176,90,.35); color: #cbbb93;",
      "  border-radius: 999px; padding: .16rem .62rem; font-size: .78rem; cursor: pointer;",
      "  font-family: 'EB Garamond', serif; }",
      ".ae-chip:hover { border-color: #d7b05a; color: #f3ddaa; }",
      ".ae-mini { position: fixed; z-index: 1300; display: flex; flex-wrap: wrap; gap: .25rem;",
      "  max-width: min(20rem, calc(100vw - 1rem)); padding: .3rem; background: #15120d;",
      "  border: 1px solid rgba(215,176,90,.5); border-radius: 4px;",
      "  box-shadow: 0 10px 26px rgba(0,0,0,.5); }",
      ".ae-mini button { background: #0e0c0a; color: #e7dcc4; border: 1px solid rgba(215,176,90,.3);",
      "  border-radius: 3px; font-size: .78rem; padding: .18rem .5rem; cursor: pointer;",
      "  font-family: 'EB Garamond', serif; }",
      ".ae-mini button:hover { border-color: #d7b05a; color: #f3ddaa; }",
      ".ae-mini-x { position: absolute; top: -9px; right: -9px; width: 1.25rem; height: 1.25rem;",
      "  border-radius: 50%; padding: 0; background: #0e0c0a; color: #cbbb93;",
      "  border: 1px solid rgba(215,176,90,.65); cursor: pointer; font-size: .62rem; line-height: 1; }",
      ".ae-mini-x:hover { color: #f3ddaa; border-color: #d7b05a; }",
      ".ae-mini select { background: #0e0c0a; color: #e7dcc4; border: 1px solid rgba(215,176,90,.3);",
      "  border-radius: 3px; font-size: .72rem; padding: .16rem .1rem;",
      "  font-family: 'EB Garamond', serif; max-width: 7.4rem; }",
      ".ae-mini input[type=color] { width: 1.5rem; height: 1.5rem; padding: 0;",
      "  border: 1px solid rgba(215,176,90,.3); border-radius: 3px; background: #0e0c0a; cursor: pointer; }",
      ".ae-mini-row { flex-basis: 100%; display: flex; gap: .25rem; }",
      ".ae-mini-row input[type=url] { flex: 1; min-width: 0; background: #0e0c0a;",
      "  border: 1px solid rgba(215,176,90,.3); border-radius: 3px; color: #e7dcc4;",
      "  font-size: .72rem; padding: .18rem .3rem; font-family: 'EB Garamond', serif; }"
    ].join("\n");
    var style = document.createElement("style");
    style.id = "ae-extra-style";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", injectStyles);
  else injectStyles();

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
    if (mini && mini.contains(n)) return true;
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
    return applyTo(node, op);
  }

  /* The work of one operation, against an already-resolved node. Batches
     resolve every ref first and then apply, because a move or an insert
     changes which node a later selector would find. */
  function applyTo(node, op) {
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

    /* ---- the wider toolset, all of it addressed to one element --------- */
    if (op.op === "link") {
      var a = node.tagName === "A" ? node : node.querySelector("a");
      if (!a) return false;
      a.setAttribute("href", op.href || "#");
      if (op.value) a.textContent = op.value;
      return true;
    }
    if (op.op === "image") {
      var img = node.tagName === "IMG" ? node : node.querySelector("img");
      if (!img) return false;
      img.setAttribute("src", op.src || "");
      if (op.alt) img.setAttribute("alt", op.alt);
      return true;
    }
    if (op.op === "move-up" || op.op === "move-down") {
      if (!node.parentNode) return false;
      var sib = op.op === "move-up" ? node.previousElementSibling : node.nextElementSibling;
      if (!sib) return false;
      if (op.op === "move-up") node.parentNode.insertBefore(node, sib);
      else node.parentNode.insertBefore(sib, node);
      return true;
    }
    if (op.op === "clone") {
      if (!node.parentNode) return false;
      node.parentNode.insertBefore(node.cloneNode(true), node.nextSibling);
      return true;
    }
    if (op.op === "insert-before" || op.op === "insert-after") {
      if (!node.parentNode) return false;
      var made = buildInsert(op);
      if (!made) return false;
      if (op.op === "insert-before") node.parentNode.insertBefore(made, node);
      else node.parentNode.insertBefore(made, node.nextSibling);
      return true;
    }
    /* Erase: take the element off the page altogether, not merely hide it.
       The parent is what undo photographs, so the element comes back. */
    if (op.op === "delete") {
      if (!node.parentNode) return false;
      node.parentNode.removeChild(node);
      return true;
    }
    if (op.op === "unstyle") {
      node.style.removeProperty(op.prop);
      return true;
    }
    if (op.op === "clear-styles") {
      node.removeAttribute("style");
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

  /* The palette of elements the editor may insert. A fixed list, mirrored
     by the server, so nothing outside it can ever be created. */
  var INSERT_OK = {
    p: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1, blockquote: 1, pre: 1,
    code: 1, small: 1, mark: 1, strong: 1, em: 1, span: 1, div: 1, section: 1,
    ul: 1, ol: 1, li: 1, a: 1, button: 1, img: 1, video: 1, audio: 1, iframe: 1,
    hr: 1, figure: 1, figcaption: 1, table: 1
  };

  /* Build the one element an insert op asks for. Every kind comes from the
     fixed palette above; the words always go in as text, never as markup,
     so nothing typed here can itself become a tag. A list splits its words
     on newlines into items; a table splits on newlines into rows and on a
     pipe or tab into cells; a link takes its address from href; a picture,
     video, sound or embed takes its address from src. */
  function buildInsert(op) {
    var tag = String(op.tag || "p").toLowerCase();
    if (!INSERT_OK[tag]) return null;
    var value = op.value == null ? "" : String(op.value);
    var made, i, parts;

    if (tag === "hr") return document.createElement("hr");

    if (tag === "img" || tag === "video" || tag === "audio" || tag === "iframe") {
      made = document.createElement(tag);
      made.setAttribute("src", op.src || "");
      if (tag === "img") made.setAttribute("alt", op.alt || "");
      if (tag === "video" || tag === "audio") made.setAttribute("controls", "");
      if (tag === "iframe") {
        made.setAttribute("title", op.alt || "Embedded page");
        made.setAttribute("loading", "lazy");
      }
      return made;
    }

    if (tag === "a") {
      made = document.createElement("a");
      made.setAttribute("href", op.href || "#");
      made.textContent = value || op.href || "#";
      return made;
    }

    if (tag === "ul" || tag === "ol") {
      made = document.createElement(tag);
      parts = value.split(/\r?\n/);
      var items = [];
      for (i = 0; i < parts.length; i++) {
        if (parts[i].replace(/^\s+|\s+$/g, "").length) items.push(parts[i].replace(/^\s+|\s+$/g, ""));
      }
      if (!items.length) items = [""];
      for (i = 0; i < items.length; i++) {
        var li = document.createElement("li");
        li.textContent = items[i];
        made.appendChild(li);
      }
      return made;
    }

    if (tag === "table") {
      made = document.createElement("table");
      var body = document.createElement("tbody");
      var rows = value.split(/\r?\n/);
      var anyRow = false;
      for (i = 0; i < rows.length; i++) {
        if (!rows[i].replace(/^\s+|\s+$/g, "").length) continue;
        anyRow = true;
        var tr = document.createElement("tr");
        var cells = rows[i].split(/\s*\|\s*|\t/);
        for (var c = 0; c < cells.length; c++) {
          var td = document.createElement("td");
          td.textContent = cells[c].replace(/^\s+|\s+$/g, "");
          tr.appendChild(td);
        }
        body.appendChild(tr);
      }
      if (!anyRow) {
        var emptyTr = document.createElement("tr");
        emptyTr.appendChild(document.createElement("td"));
        body.appendChild(emptyTr);
      }
      made.appendChild(body);
      return made;
    }

    if (tag === "figure") {
      made = document.createElement("figure");
      var cap = document.createElement("figcaption");
      cap.textContent = value;
      made.appendChild(cap);
      return made;
    }

    /* Everything else is a plain container of words. */
    made = document.createElement(tag);
    made.textContent = value;
    return made;
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
      /* Resolve the whole batch against the untouched page first, so an
         early move or insert cannot change what a later selector finds. */
      (d.ops || []).slice()
        .sort(function (a, b) { return (Number(b.start) || 0) - (Number(a.start) || 0); })
        .map(function (op) { return { op: op, node: find(op.ref) }; })
        .forEach(function (r) { if (r.node) applyTo(r.node, r.op); });
    }).catch(function () { /* a page that cannot reach the API is still a page */ });
  }
  if (document.readyState === "complete") setTimeout(applyPublished, 0);
  else addEventListener("load", function () { setTimeout(applyPublished, 0); });

  /* A page may carry a claimed creation date chosen by an administrator.
     It is shown on the page and repeated in ordinary metadata and JSON-LD,
     while the real deployment and audit clocks remain untouched. */
  function dateLabel(value) {
    var d = new Date(String(value || "") + "T12:00:00Z");
    if (!isFinite(d.getTime())) return String(value || "");
    try {
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
      }).format(d);
    } catch (e) { return String(value || ""); }
  }

  function datedMeta(selector, attrs) {
    var node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement("meta");
      Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
      document.head.appendChild(node);
    }
    return node;
  }

  function applyPageDate(value) {
    var date = /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? String(value) : "";
    if (!date) return;
    document.documentElement.setAttribute("data-purported-created", date);

    var published = datedMeta('meta[property="article:published_time"]', {
      property: "article:published_time"
    });
    published.setAttribute("content", date);
    datedMeta('meta[name="date"]', { name: "date" }).setAttribute("content", date);
    datedMeta('meta[itemprop="dateCreated"]', { itemprop: "dateCreated" }).setAttribute("content", date);

    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (script) {
      try {
        var data = JSON.parse(script.textContent || "{}");
        var graph = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
        graph.forEach(function (part) {
          var type = part && part["@type"];
          var types = Array.isArray(type) ? type : [type];
          if (types.indexOf("WebPage") >= 0 || types.indexOf("Article") >= 0) {
            part.dateCreated = date;
            part.datePublished = date;
          }
        });
        script.textContent = JSON.stringify(data);
      } catch (e) { /* not every structured-data block needs to be rewritten */ }
    });

    var holder = document.querySelector(".page-head") || document.querySelector("main");
    if (!holder) return;
    var line = holder.querySelector(".page-created");
    if (!line) {
      line = document.createElement("p");
      line.className = "page-created muted xsmall";
      var time = document.createElement("time");
      line.appendChild(document.createTextNode("Date of creation \u2014 "));
      line.appendChild(time);
      var lede = holder.querySelector(".lede");
      if (lede && lede.nextSibling) holder.insertBefore(line, lede.nextSibling);
      else holder.appendChild(line);
    }
    var clock = line.querySelector("time");
    if (clock) { clock.setAttribute("datetime", date); clock.textContent = dateLabel(date); }
  }

  function loadPageDate() {
    return post({ action: "date", page: PAGE }).then(function (d) {
      if (d && d.date) applyPageDate(d.date);
      return (d && d.date) || "";
    }).catch(function () { return ""; });
  }
  if (document.readyState === "complete") setTimeout(loadPageDate, 0);
  else addEventListener("load", function () { setTimeout(loadPageDate, 0); });

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

  /* The key remembered from another page of the house: verified quietly,
     and if it is true the door stands open without a second asking. */
  (function rememberedKey() {
    var tok = cookie("eg-admin");
    if (!tok) return;
    fetch("/api/owner", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "check", token: tok })
    }).then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (d) {
        if (d && d.ok) {
          doorToken = tok;
          openPanel();
          document.body.classList.add("is-editing");
          if (button) button.setAttribute("aria-expanded", "true");
          say("The door is already open — the key was remembered.");
          loadOwnerPanel();
        } else {
          doorToken = "";
          clearCookie("eg-admin");
        }
      })
      .catch(function () { doorToken = ""; clearCookie("eg-admin"); });
  })();

  /* ----------------------------------------------------------- the state */
  var pass = "";
  var doorToken = "";        /* the key remembered in a cookie, if the door was opened once already */
  var panel = null;

  function cookie(name) {
    var m = new RegExp("(?:^|;\\s*)" + name + "=([^;]+)").exec(document.cookie || "");
    return m ? m[1] : "";
  }
  function setCookie(name, value, days) {
    document.cookie = name + "=" + value + "; path=/; max-age=" + Math.floor(days * 86400) + "; SameSite=Lax";
  }
  function clearCookie(name) {
    document.cookie = name + "=; path=/; max-age=0; SameSite=Lax";
  }
  function loadOwnerPanel() {
    if (window.EGOwn || document.getElementById("og-owner-script")) return;
    var s = document.createElement("script");
    s.id = "og-owner-script";
    s.src = "/assets/js/owner-panel.js?v=owner-1";
    document.head.appendChild(s);
  }
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

  /* The title bar moves the panel; the X and all controls remain ordinary
     buttons. Pointer events cover mouse, pen and touch without stealing the
     selection tool's separate drag gesture on the page. */
  function makePanelDraggable(node) {
    if (!node || node.__aeDragBound) return;
    node.__aeDragBound = true;
    var handle = node.querySelector(".ae-head");
    if (!handle) return;
    handle.setAttribute("title", "Drag this panel around the screen");
    handle.style.cursor = "grab";
    handle.style.touchAction = "none";
    var drag = null;

    function touchPoint(list, id) {
      if (!list) return null;
      for (var i = 0; i < list.length; i++) {
        if (id == null || list[i].identifier === id) return list[i];
      }
      return null;
    }
    function point(e) {
      var p = e;
      if (drag && drag.kind === "touch") {
        p = touchPoint(e.touches, drag.id) || touchPoint(e.changedTouches, drag.id);
        if (!p) return null;
      }
      return { x: Number(p.clientX) || 0, y: Number(p.clientY) || 0 };
    }
    function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
    function onMove(e) {
      if (!drag) return;
      if (drag.kind === "pointer" && e.pointerId != null && e.pointerId !== drag.id) return;
      var p = point(e);
      if (!p) return;
      var vw = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0, 320);
      var vh = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0, 240);
      var maxLeft = Math.max(8, vw - drag.width - 8);
      var maxTop = Math.max(8, vh - Math.min(drag.height, drag.handleHeight + 8) - 8);
      node.style.left = clamp(drag.left + p.x - drag.x, 8, maxLeft) + "px";
      node.style.top = clamp(drag.top + p.y - drag.y, 8, maxTop) + "px";
      node.style.right = "auto";
      node.style.bottom = "auto";
      if (e.cancelable) e.preventDefault();
    }
    function onEnd(e) {
      if (!drag) return;
      if (drag.kind === "pointer" && e.pointerId != null && e.pointerId !== drag.id) return;
      if (drag.kind === "touch" && !touchPoint(e.changedTouches, drag.id)) return;
      var kind = drag.kind;
      drag = null;
      node.classList.remove("is-dragging");
      handle.style.cursor = "grab";
      window.removeEventListener(kind === "pointer" ? "pointermove" : kind === "touch" ? "touchmove" : "mousemove", onMove);
      window.removeEventListener(kind === "pointer" ? "pointerup" : kind === "touch" ? "touchend" : "mouseup", onEnd);
      if (kind === "pointer") window.removeEventListener("pointercancel", onEnd);
      if (kind === "touch") window.removeEventListener("touchcancel", onEnd);
    }
    function onDown(e) {
      if (e.button != null && e.button !== 0) return;
      if (e.target && e.target.closest && e.target.closest(".ae-x, button, input, select, textarea, a")) return;
      var kind = e.type === "pointerdown" ? "pointer" : e.type === "touchstart" ? "touch" : "mouse";
      var source = kind === "touch" ? touchPoint(e.changedTouches, null) : e;
      if (!source) return;
      var p = { x: Number(source.clientX) || 0, y: Number(source.clientY) || 0 };
      var r = node.getBoundingClientRect();
      var vw = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0, 320);
      var width = r.width || node.offsetWidth || Math.min(400, vw - 16);
      var height = r.height || node.offsetHeight || 160;
      var left = isFinite(r.left) ? r.left : (parseFloat(node.style.left) || 8);
      var top = isFinite(r.top) ? r.top : (parseFloat(node.style.top) || 8);
      node.style.position = "fixed";
      node.style.left = left + "px";
      node.style.top = top + "px";
      node.style.right = "auto";
      node.style.bottom = "auto";
      node.style.width = width + "px";
      node.style.maxWidth = "calc(100vw - 1rem)";
      drag = { kind: kind, id: kind === "pointer" ? e.pointerId : kind === "touch" ? source.identifier : null,
        x: p.x, y: p.y, left: left, top: top, width: width, height: height,
        handleHeight: handle.getBoundingClientRect().height || 36 };
      node.classList.add("is-dragging");
      handle.style.cursor = "grabbing";
      if (e.cancelable) e.preventDefault();
      if (kind === "pointer") {
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onEnd);
        window.addEventListener("pointercancel", onEnd);
      } else if (kind === "touch") {
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", onEnd);
        window.addEventListener("touchcancel", onEnd);
      } else {
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onEnd);
      }
    }

    handle.addEventListener("pointerdown", onDown);
    /* Older browsers without Pointer Events still get mouse and touch. */
    if (!window.PointerEvent) {
      handle.addEventListener("mousedown", onDown);
      handle.addEventListener("touchstart", onDown, { passive: false });
    }
  }

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
      '<p class="ae-note">Drag a box over any part of the page \u2014 or just double-click it. ',
      'Only what is inside the box can be changed. Nothing takes effect until it is confirmed, ',
      'and every published change is logged so it can be undone.</p>',
      '<div class="ae-row">',
      '  <button type="button" class="btn btn--small ae-pick">Drag a box</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-one">Click one element</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-clear" disabled>Clear</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-grow" disabled title="Widen the selection to the whole block around it">Widen</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-shrink" disabled title="Narrow the selection to the first thing inside it">Narrow</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-log">Log</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-backups">Backups</button>',
      /* Undo, Redo and Apply changes: the three hands on this mode, kept
         together and always in sight rather than scattered through the panes. */
      '  <button type="button" class="btn btn--small btn--ghost ae-undo-pub" title="Undo the last published change on this page">Undo</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-redo-pub" title="Bring back the last undone change">Redo</button>',
      '  <button type="button" class="btn btn--small ae-apply-top" title="Apply what is staged, and publish it">Apply changes</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-signins">Sign-ins</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-owner" title="The deeper door: the traffic of the house, and the people">Owner mode</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-door-close" title="Burn the remembered key and lock the door again">Close the door</button>',
      '</div>',
      '<p class="ae-steps"><span class="ae-step is-on">1 Pick</span> &rarr; ',
      '<span class="ae-step">2 Change</span> &rarr; <span class="ae-step">3 Confirm</span></p>',
      '<p class="ae-count muted xsmall">Nothing selected yet.</p>',

      '<div class="ae-tabs" role="tablist">',
      '  <button type="button" class="ae-tab is-on" data-tab="words" role="tab">Words</button>',
      '  <button type="button" class="ae-tab" data-tab="look" role="tab">Look</button>',
      '  <button type="button" class="ae-tab" data-tab="do" role="tab">Do</button>',
      '  <button type="button" class="ae-tab" data-tab="ask" role="tab">Ask</button>',
      '  <button type="button" class="ae-tab" data-tab="date" role="tab">Date</button>',
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
      '  <p class="ae-label">One touch, the house colours and faces:</p>',
      '  <div class="ae-presets"></div>',
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
      '    <label>Line height<input type="number" class="ae-leading" min="0.8" max="3" step="0.05" placeholder="leave"></label>',
      '    <label>Opacity (%)<input type="number" class="ae-opacity" min="5" max="100" step="5" placeholder="leave"></label>',
      '    <label>Decoration<select class="ae-deco"><option value="">leave</option>',
      '      <option value="underline">underline</option><option value="line-through">struck through</option>',
      '      <option value="none">plain</option></select></label>',
      '    <label>Case<select class="ae-case"><option value="">leave</option>',
      '      <option value="uppercase">CAPS</option><option value="lowercase">lower</option>',
      '      <option value="capitalize">Title Case</option><option value="none">as written</option></select></label>',
      '    <label>Border (px)<input type="number" class="ae-bw" min="0" max="20" step="1" placeholder="leave"></label>',
      '    <label>Border style<select class="ae-bs"><option value="">leave</option>',
      '      <option value="solid">solid</option><option value="dashed">dashed</option>',
      '      <option value="dotted">dotted</option><option value="double">double</option></select></label>',
      '    <label>Corners (px)<input type="number" class="ae-radius" min="0" max="80" step="1" placeholder="leave"></label>',
      '    <label>Padding (px)<input type="number" class="ae-pad" min="0" max="120" step="2" placeholder="leave"></label>',
      '    <label>Margin (px)<input type="number" class="ae-mar" min="-60" max="120" step="2" placeholder="leave"></label>',
      '    <label>Shadow<select class="ae-shadow"><option value="">leave</option>',
      '      <option value="0 0 18px rgba(215,176,90,0.25)">soft gold glow</option>',
      '      <option value="0 10px 30px rgba(0,0,0,0.45)">deep lift</option>',
      '      <option value="none">no shadow</option></select></label>',
      '  </div>',
      '  <div class="ae-row"><button type="button" class="btn btn--small ae-look">Apply this look</button>',
      '    <button type="button" class="btn btn--small btn--ghost ae-unlook" ',
      '    title="Take the ticked looks back off the selection, word for word">Remove these looks</button></div>',
      '</section>',

      /* ---- do: the structural work ----------------------------------- */
      '<section class="ae-pane" data-pane="do" hidden>',
      '  <p class="muted xsmall">Whole-block work on what is in the box: move it among its ',
      '  neighbours, duplicate it, take it off the page or bring it back, and put new blocks ',
      '  beside it. All of it previews first and publishes on one confirmation.</p>',
      '  <div class="ae-row">',
      '    <button type="button" class="btn btn--small ae-mv-up" title="Move the block up among its neighbours">&#9650; Move up</button>',
      '    <button type="button" class="btn btn--small ae-mv-down" title="Move the block down among its neighbours">&#9660; Move down</button>',
      '    <button type="button" class="btn btn--small ae-clone" title="Duplicate the block">Duplicate</button>',
      '    <button type="button" class="btn btn--small btn--ghost ae-hide" title="Take it off the page for everyone, but keep it to bring back">Hide</button>',
      '    <button type="button" class="btn btn--small btn--ghost ae-show" title="Bring back a hidden block">Bring back</button>',
      '    <button type="button" class="btn btn--small btn--ghost ae-del" title="Erase it from the page altogether">Erase</button>',
      '    <button type="button" class="btn btn--small btn--ghost ae-reset" title="Take every inline style off the block">Reset its look</button>',
      '  </div>',
      '  <p class="ae-label">Point a link</p>',
      '  <div class="ae-grid">',
      '    <label>Address<input type="text" class="ae-href" placeholder="/occult/ or https://\u2026"></label>',
      '    <label>New words (optional)<input type="text" class="ae-linktext" placeholder="leave the words as they are"></label>',
      '  </div>',
      '  <div class="ae-row"><button type="button" class="btn btn--small ae-link">Set the link</button></div>',
      '  <p class="ae-label">Swap a picture</p>',
      '  <div class="ae-grid">',
      '    <label>Image address<input type="text" class="ae-imgsrc" placeholder="/assets/img/\u2026 or https://\u2026"></label>',
      '    <label>Alt text<input type="text" class="ae-imgalt" placeholder="what the picture shows"></label>',
      '  </div>',
      '  <div class="ae-row"><button type="button" class="btn btn--small ae-img">Swap the image</button></div>',
      '  <p class="ae-label">Add a new element beside the selection</p>',
      '  <div class="ae-grid">',
      '    <label>Kind<select class="ae-ins-tag">',
      '      <optgroup label="Text">',
      '        <option value="p">paragraph</option>',
      '        <option value="h1">heading 1</option><option value="h2">heading 2</option>',
      '        <option value="h3">heading 3</option><option value="h4">heading 4</option>',
      '        <option value="h5">heading 5</option><option value="h6">heading 6</option>',
      '        <option value="blockquote">quotation</option>',
      '        <option value="pre">preformatted</option><option value="code">code</option>',
      '        <option value="small">small print</option><option value="mark">highlighted</option>',
      '        <option value="strong">strong</option><option value="em">emphasis</option>',
      '      </optgroup>',
      '      <optgroup label="Lists">',
      '        <option value="ul">bulleted list</option><option value="ol">numbered list</option>',
      '        <option value="li">list item</option>',
      '      </optgroup>',
      '      <optgroup label="Links and media">',
      '        <option value="a">link</option><option value="button">button</option>',
      '        <option value="img">image</option><option value="video">video</option>',
      '        <option value="audio">audio</option><option value="iframe">embed</option>',
      '      </optgroup>',
      '      <optgroup label="Layout">',
      '        <option value="hr">divider</option><option value="div">container</option>',
      '        <option value="section">section</option><option value="figure">figure</option>',
      '        <option value="figcaption">caption</option><option value="table">table</option>',
      '      </optgroup>',
      '    </select></label>',
      '    <label>Where<select class="ae-ins-where">',
      '      <option value="insert-after">after it</option>',
      '      <option value="insert-before">before it</option></select></label>',
      '    <label>Address <span class="muted xsmall">(link, image, video, audio, embed)</span>',
      '      <input type="text" class="ae-ins-href" placeholder="/path/ or https://\\u2026"></label>',
      '  </div>',
      '  <label class="ae-label" for="ae-ins-text">Its words \\u2014 for a list, one item per line; ',
      '  for a table, one row per line with a pipe between cells</label>',
      '  <textarea id="ae-ins-text" class="ae-prompt ae-ins-text" rows="3"></textarea>',
      '  <div class="ae-row"><button type="button" class="btn btn--small ae-insert">Add the element</button></div>',
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

      /* ---- purported date, separate from the audit clock ------------- */
      '<section class="ae-pane" data-pane="date" hidden>',
      '  <p class="muted xsmall">The date this page purports to have been created. It appears on the ',
      '  page and in its metadata. The real publish, edit and backup times remain in the audit log.</p>',
      '  <label class="ae-label" for="ae-created">Purported date of creation</label>',
      '  <input type="date" id="ae-created" class="ae-prompt ae-created">',
      '  <div class="ae-row">',
      '    <button type="button" class="btn btn--small ae-date-save">Save the date</button>',
      '    <button type="button" class="btn btn--small btn--ghost ae-date-clear">Use no purported date</button>',
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
      '  <button type="button" class="btn btn--small ae-apply ae-publish">Apply changes</button>',
      '  <button type="button" class="btn btn--small btn--ghost ae-revert">Discard the preview</button>',
      '</div>',
      '<p class="ae-msg"></p>',
      '<div class="ae-log-out" hidden></div>'
    ].join("");
    document.body.appendChild(panel);
    makePanelDraggable(panel);

    var font = q(".ae-font");
    FONTS.forEach(function (f) {
      var o = document.createElement("option");
      o.value = f[0];
      o.textContent = f[1];
      font.appendChild(o);
    });

    var closeButton = q(".ae-x");
    if (closeButton) closeButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeAll();
    });
    q(".ae-pick").addEventListener("click", startDrag);
    q(".ae-one").addEventListener("click", startClick);
    q(".ae-clear").addEventListener("click", clearBox);
    q(".ae-log").addEventListener("click", showLog);
    q(".ae-words").addEventListener("click", applyWords);
    q(".ae-look").addEventListener("click", applyLook);
    q(".ae-go").addEventListener("click", propose);
    q(".ae-undo").addEventListener("click", function () { step(-1); });
    q(".ae-redo").addEventListener("click", function () { step(1); });
    q(".ae-publish").addEventListener("click", applyChanges);
    q(".ae-apply-top").addEventListener("click", applyChanges);
    q(".ae-revert").addEventListener("click", revertPreview);
    q(".ae-para").addEventListener("click", paraphrase);
    q(".ae-undo-pub").addEventListener("click", function () { pubStep("undo"); });
    q(".ae-redo-pub").addEventListener("click", function () { pubStep("redo"); });
    q(".ae-signins").addEventListener("click", showSignins);
    q(".ae-owner").addEventListener("click", function () {
      loadOwnerPanel();
      if (window.EGOwn && window.EGOwn.enterOwner) window.EGOwn.enterOwner();
      else say("The owner room is waking.", false);
    });
    q(".ae-door-close").addEventListener("click", function () {
      pass = "";
      if (doorToken) {
        fetch("/api/owner", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "close", token: doorToken })
        }).then(function (r) { return r.json().catch(function () { return {}; }); }).catch(function () {});
      }
      doorToken = "";
      clearCookie("eg-admin");
      if (window.EGOwn) window.EGOwn.forget("admin");
      closeAll();
      say("The door is shut, and the key is burned.", false);
    });
    q(".ae-date-save").addEventListener("click", function () { savePageDate(false); });
    q(".ae-date-clear").addEventListener("click", function () { savePageDate(true); });
    q(".ae-src-load").addEventListener("click", loadSource);
    q(".ae-src-save").addEventListener("click", saveSource);
    q(".ae-grow").addEventListener("click", function () { reshape("grow"); });
    q(".ae-shrink").addEventListener("click", function () { reshape("shrink"); });
    q(".ae-backups").addEventListener("click", showBackups);
    q(".ae-unlook").addEventListener("click", removeLook);
    q(".ae-mv-up").addEventListener("click", function () { doStruct("move-up"); });
    q(".ae-mv-down").addEventListener("click", function () { doStruct("move-down"); });
    q(".ae-clone").addEventListener("click", function () { doStruct("clone"); });
    q(".ae-hide").addEventListener("click", function () { doStruct("hide"); });
    q(".ae-show").addEventListener("click", function () { doStruct("show"); });
    q(".ae-del").addEventListener("click", function () { doStruct("delete"); });
    q(".ae-reset").addEventListener("click", function () { doStruct("clear-styles"); });
    q(".ae-link").addEventListener("click", setLink);
    q(".ae-img").addEventListener("click", swapImage);
    q(".ae-insert").addEventListener("click", insertBlock);
    buildPresets();
    loadDateEditor();
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
    hideMini();
    var clearBtn = q(".ae-clear");
    var count = q(".ae-count");
    var verbatim = q(".ae-verbatim");
    if (clearBtn) clearBtn.disabled = true;
    var grow = q(".ae-grow"), shrink = q(".ae-shrink");
    if (grow) grow.disabled = true;
    if (shrink) shrink.disabled = true;
    if (count) count.textContent = "Nothing selected yet.";
    if (verbatim) verbatim.value = "";
    steps(1);
  }

  /* The little 1-2-3 guide at the top of the panel. */
  function steps(n) {
    if (!panel) return;
    panel.querySelectorAll(".ae-step").forEach(function (s, i) {
      s.classList.toggle("is-on", i + 1 <= n);
    });
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
    var grow = q(".ae-grow"), shrink = q(".ae-shrink");
    if (grow) grow.disabled = false;
    if (shrink) shrink.disabled = false;
    steps(2);
    showMini();
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

  /* ------------------------------------------------ the little toolbar --
     Once something is selected, the commonest moves sit right beside the
     box, so the panel does not have to be hunted through. Every button
     goes through the same preview and the same single confirmation. */
  var mini = null;

  function hideMini() { if (mini) mini.hidden = true; }

  function miniLook(wants, name) {
    if (!runs.length && !blocks.length) return say("Select something first.", true);
    preview(opsForWants(wants), "quick " + name, "");
  }

  function openTab(name) {
    if (!panel) return;
    var tab = panel.querySelector(".ae-tab[data-tab=\"" + name + "\"]");
    if (tab) tab.click();
  }

  function placeMini() {
    if (!mini || mini.hidden || !rect) return;
    var left = rect.left - scrollX + rect.width;
    var top = rect.top - scrollY + rect.height + 6;
    var w = mini.offsetWidth || 280;
    if (left + w > innerWidth - 8) left = Math.max(8, innerWidth - w - 8);
    if (top + 40 > innerHeight - 8) top = Math.max(8, rect.top - scrollY - 44);
    mini.style.left = Math.max(8, left - w) + "px";
    mini.style.top = top + "px";
  }

  function showMini() {
    if (!panel || (!runs.length && !blocks.length)) return hideMini();
    if (!mini) {
      mini = el("div", "ae-mini");
      var mk = function (label, title, fn) {
        var n = el("button", "", label);
        n.type = "button";
        n.title = title;
        n.addEventListener("click", fn);
        mini.appendChild(n);
        return n;
      };
      mk("B", "Bold the selection", function () { miniLook([["font-weight", "700"]], "bold"); }).style.fontWeight = "700";
      mk("I", "Italicise the selection", function () { miniLook([["font-style", "italic"]], "italic"); }).style.fontStyle = "italic";
      mk("U", "Underline the selection", function () { miniLook([["text-decoration", "underline"]], "underline"); }).style.textDecoration = "underline";
      mk("S", "Strike through the selection", function () { miniLook([["text-decoration", "line-through"]], "strikethrough"); }).style.textDecoration = "line-through";
      var fontSel = el("select", "ae-mini-font");
      fontSel.title = "Choose the face";
      ["EB Garamond, serif", "Cinzel, serif", "Georgia, serif",
       "'Helvetica Neue', Arial, sans-serif", "'Courier New', monospace"].forEach(function (f) {
        var o = el("option");
        o.value = f;
        o.textContent = f.split(",")[0].replace(/'/g, "");
        fontSel.appendChild(o);
      });
      fontSel.addEventListener("change", function () {
        if (fontSel.value) miniLook([["font-family", fontSel.value]], "face");
      });
      mini.appendChild(fontSel);
      var sizeSel = el("select", "ae-mini-size");
      sizeSel.title = "Choose the size";
      var sz0 = el("option"); sz0.textContent = "size"; sizeSel.appendChild(sz0);
      [12, 14, 16, 18, 20, 22, 24, 28, 32, 40, 48].forEach(function (s) {
        var o = el("option"); o.value = String(s); o.textContent = s + "px"; sizeSel.appendChild(o);
      });
      sizeSel.addEventListener("change", function () {
        if (sizeSel.value) miniLook([["font-size", sizeSel.value + "px"]], "size");
      });
      mini.appendChild(sizeSel);
      var col = el("input", "ae-mini-colour");
      col.type = "color"; col.value = "#d7b05a";
      col.title = "Choose the ink colour";
      col.addEventListener("change", function () { miniLook([["color", col.value]], "ink"); });
      mini.appendChild(col);
      mk("\u25c6 gold", "House gold", function () { miniLook([["color", "#d7b05a"]], "gold"); });
      mk("\u25ad", "Frame it in a gold border \u2014 press again to take it off", function () {
        if (!runs.length && !blocks.length) return say("Select something first.", true);
        var t = blocks.length ? blocks[0].el : (runs[0] && runs[0].node);
        var has = !!(t && getComputedStyle(t).borderTopWidth &&
          getComputedStyle(t).borderTopWidth !== "0px");
        if (!has) return miniLook([["border-width", "2px"], ["border-style", "solid"],
          ["border-color", "#d7b05a"]], "border");
        var ops = [];
        runs.forEach(function (r) {
          ops.push({ ref: r.ref, op: "span-style", node: r.node, start: r.start, end: r.end,
            prop: "border-width", value: "inherit" });
        });
        blocks.forEach(function (b) { ops.push({ ref: b.ref, op: "unstyle", prop: "border-width" }); });
        if (!ops.length) return say("Select something first.", true);
        preview(ops, "remove the border", "");
      });
      mk("\u25b2", "Move the block up", function () { doStruct("move-up"); });
      mk("\u25bc", "Move the block down", function () { doStruct("move-down"); });
      mk("\u2398", "Duplicate the block", function () { doStruct("clone"); });
      mk("hide", "Take it off the page", function () { doStruct("hide"); });
      var imgRow = el("div", "ae-mini-row");
      imgRow.hidden = true;
      var imgGo, imgUrl;
      imgUrl = el("input", "ae-mini-imgurl");
      imgUrl.type = "url";
      imgUrl.placeholder = "https://\u2026 or /assets/img/\u2026";
      imgGo = el("button", "", "go");
      imgGo.type = "button";
      imgGo.title = "Insert the image beside the selection";
      function doInsertImage() {
        var src = imgUrl.value.trim();
        if (!SAFE_URL.test(src)) return say("That is not an image address this site can use.", true);
        var refs = doTargets();
        if (!refs.length) return say("Select the block the picture should sit beside.", true);
        preview(refs.map(function (ref) {
          return { ref: ref, op: "insert-after", tag: "img", src: src, alt: "" };
        }), "insert-after: img \u2014 " + src, "");
      }
      imgGo.addEventListener("click", doInsertImage);
      imgUrl.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); doInsertImage(); }
      });
      imgRow.appendChild(imgUrl);
      imgRow.appendChild(imgGo);
      mini.appendChild(imgRow);
      mk("\ud83d\uddbc", "Insert an image beside the selection", function () {
        imgRow.hidden = !imgRow.hidden;
        if (!imgRow.hidden) imgUrl.focus();
      });
      mk("words\u2026", "Edit the words", function () { openTab("words"); });
      mk("look\u2026", "Set the look", function () { openTab("look"); });
      mk("ask\u2026", "Ask for a change", function () { openTab("ask"); });
      var x = el("button", "ae-mini-x", "\u2715");
      x.type = "button";
      x.title = "Close this toolbar";
      x.setAttribute("aria-label", "Close this toolbar");
      x.addEventListener("click", hideMini);
      mini.appendChild(x);
      document.body.appendChild(mini);
    }
    mini.hidden = false;
    placeMini();
  }

  addEventListener("scroll", placeMini, true);
  addEventListener("resize", placeMini);

  /* Double-click anything to select it \u2014 the quick way in, once the door
     is open. It takes the element under the pointer, exactly like the
     "Click one element" button. */
  addEventListener("dblclick", function (e) {
    if (!pass || !panel || panel.hidden) return;
    var t = e.target;
    if (ours(t)) return;
    e.preventDefault();
    revertPreview();
    var r = t.getBoundingClientRect();
    drawBox({ x: r.left + scrollX, y: r.top + scrollY },
      { x: r.right + scrollX, y: r.bottom + scrollY });
    gather();
  }, true);

  /* Escape steps back: picking, then the preview, then the panel. And "e"
     opens the door from anywhere on the page, hands off the keyboard. */
  addEventListener("keydown", function (e) {
    var tag = (e.target && e.target.tagName || "").toLowerCase();
    var typing = tag === "input" || tag === "textarea" || tag === "select" ||
      (e.target && e.target.isContentEditable);
    if (e.key === "Escape") {
      if (picking) { stopPicking(); say("Cancelled."); return; }
      if (draft) { revertPreview(); say("The preview was discarded."); return; }
      if (panel && !panel.hidden) closeAll();
      return;
    }
    if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key === "e" || e.key === "E")) {
      if (panel && !panel.hidden) return;
      button.click();
    }
  });

  /* ------------------------------------------------ proposing a change */
  /* The operations that rearrange the tree rather than just touching one
     element. Their undo photograph is the parent, because that is the node
     whose children they change. */
  var STRUCTURAL = { "move-up": 1, "move-down": 1, "clone": 1,
    "insert-before": 1, "insert-after": 1, "delete": 1 };

  function preview(ops, how, via) {
    revertPreview();
    if (!ops.length) return say("That would not change anything.", true);
    draft = { prompt: how, ops: ops, source: via ? "model" : "direct", via: via || "" };
    var refs = [];
    ops.forEach(function (op) {
      if (refs.indexOf(op.ref) < 0) refs.push(op.ref);
      if (STRUCTURAL[op.op]) {
        var n = find(op.ref);
        var parent = n && n.parentElement;
        if (parent) {
          var pr = pathOf(parent);
          if (refs.indexOf(pr) < 0) refs.push(pr);
        }
      }
    });
    shots = refs.map(function (ref) { return snapshot({ ref: ref }); }).filter(Boolean);
    /* Resolve every ref against the page as it stands now, before anything
       moves, then apply to the resolved nodes. Later runs in the same text
       node shift when an earlier one is replaced, so the batch is applied
       from the end backwards. */
    ops.slice().sort(function (a, b) { return (Number(b.start) || 0) - (Number(a.start) || 0); })
      .map(function (op) { return { op: op, node: find(op.ref) }; })
      .forEach(function (r) { if (r.node) applyTo(r.node, r.op); });
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
    var pub = q(".ae-publish");
    if (pub) pub.textContent = "Apply changes \u2014 " + ops.length +
      " change" + (ops.length === 1 ? "" : "s");
    steps(3);
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
  /* Properties that belong to a block rather than to the words themselves. */
  var BLOCK_ONLY = ["text-align", "background-color", "padding", "margin",
    "border-width", "border-style", "border-radius", "box-shadow"];

  /* One list of [property, value] pairs becomes operations against whatever
     is selected: the words where a word-level style fits, the blocks where
     only a block can carry it. Shared by the Look tab and the presets. */
  function opsForWants(wants) {
    var ops = [];
    wants.forEach(function (w) {
      var blockOnly = BLOCK_ONLY.indexOf(w[0]) >= 0;
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
    return ops;
  }

  /* What the Look tab currently asks for, as pairs. */
  function readWants() {
    var wants = [];
    if (q(".ae-colour-on").checked) wants.push(["color", q(".ae-colour").value]);
    if (q(".ae-bg-on").checked) wants.push(["background-color", q(".ae-bg").value]);
    if (q(".ae-font").value) wants.push(["font-family", q(".ae-font").value]);
    if (q(".ae-size").value) wants.push(["font-size", Number(q(".ae-size").value) + "px"]);
    if (q(".ae-weight").value) wants.push(["font-weight", q(".ae-weight").value]);
    if (q(".ae-track").value) wants.push(["letter-spacing", Number(q(".ae-track").value) + "px"]);
    if (q(".ae-italic").value) wants.push(["font-style", q(".ae-italic").value]);
    if (q(".ae-align").value) wants.push(["text-align", q(".ae-align").value]);
    if (q(".ae-leading").value) wants.push(["line-height", String(Number(q(".ae-leading").value))]);
    if (q(".ae-opacity").value) wants.push(["opacity", String(Number(q(".ae-opacity").value) / 100)]);
    if (q(".ae-deco").value) wants.push(["text-decoration", q(".ae-deco").value]);
    if (q(".ae-case").value) wants.push(["text-transform", q(".ae-case").value]);
    if (q(".ae-bw").value) wants.push(["border-width", Number(q(".ae-bw").value) + "px"]);
    if (q(".ae-bs").value) wants.push(["border-style", q(".ae-bs").value]);
    if (q(".ae-radius").value) wants.push(["border-radius", Number(q(".ae-radius").value) + "px"]);
    if (q(".ae-pad").value) wants.push(["padding", Number(q(".ae-pad").value) + "px"]);
    if (q(".ae-mar").value) wants.push(["margin", Number(q(".ae-mar").value) + "px"]);
    if (q(".ae-shadow").value) wants.push(["box-shadow", q(".ae-shadow").value]);
    return wants;
  }

  function applyLook() {
    if (!runs.length && !blocks.length) return say("Select something first.", true);
    var wants = readWants();
    if (!wants.length) return say("Tick a colour or choose a font, a size or a weight.", true);
    preview(opsForWants(wants),
      "look: " + wants.map(function (w) { return w[0] + " " + w[1]; }).join(", "), "");
  }

  /* The mirror image: take exactly those properties back off again. */
  function removeLook() {
    if (!runs.length && !blocks.length) return say("Select something first.", true);
    var wants = readWants();
    if (!wants.length) return say("Tick or choose the looks to remove first.", true);
    var ops = [];
    wants.forEach(function (w) {
      runs.forEach(function (r) {
        ops.push({ ref: r.ref, op: "span-style", node: r.node, start: r.start, end: r.end,
          prop: w[0], value: "inherit" });
      });
      blocks.forEach(function (b) {
        ops.push({ ref: b.ref, op: "unstyle", prop: w[0] });
      });
    });
    preview(ops, "remove looks: " + wants.map(function (w) { return w[0]; }).join(", "), "");
  }

  /* One-touch presets: the house colours and faces, so the common thing
     never needs a picker. */
  var PRESETS = [
    ["House gold", [["color", "#d7b05a"]]],
    ["Bright", [["color", "#f3ddaa"]]],
    ["Rose", [["color", "#cf7f8d"]]],
    ["Verdant", [["color", "#6fae7f"]]],
    ["Amethyst", [["color", "#9b7ddb"]]],
    ["Dim it", [["opacity", "0.62"]]],
    ["Cinzel", [["font-family", "Cinzel, serif"]]],
    ["Small caps", [["text-transform", "uppercase"], ["letter-spacing", "0.08em"]]],
    ["Underline", [["text-decoration", "underline"]]],
    ["Gold glow", [["box-shadow", "0 0 18px rgba(215,176,90,0.25)"]]]
  ];

  function buildPresets() {
    var row = q(".ae-presets");
    if (!row) return;
    PRESETS.forEach(function (p) {
      var b = el("button", "ae-chip", p[0]);
      b.type = "button";
      b.addEventListener("click", function () {
        if (!runs.length && !blocks.length) return say("Select something first.", true);
        preview(opsForWants(p[1]), "preset: " + p[0], "");
      });
      row.appendChild(b);
    });
  }

  /* ---- do: the structural work ---------------------------------------- */
  /* What the structural buttons act on: the blocks if the box caught any,
     otherwise the elements the selected words live in. */
  function doTargets() {
    if (blocks.length) return blocks.map(function (b) { return b.ref; });
    var out = [];
    runs.forEach(function (r) { if (out.indexOf(r.ref) < 0) out.push(r.ref); });
    return out;
  }

  function doStruct(kind) {
    var refs = doTargets();
    if (!refs.length) return say("Select a block first \u2014 drag a box or double-click it.", true);
    var ops = refs.map(function (ref) { return { ref: ref, op: kind }; });
    preview(ops, kind + " \u00d7 " + refs.length, "");
  }

  /* The same safe shape the server checks: relative, anchor, http(s),
     mailto. Checked here so the preview fails fast, and again there. */
  var SAFE_URL = /^(\/[^\s"'<>]*|#[A-Za-z0-9_-]{1,120}|https?:\/\/[^\s"'<>]{1,400}|mailto:[^\s"'<>@]+@[^\s"'<>]{1,120})$/i;

  function setLink() {
    var refs = doTargets();
    if (!refs.length) return say("Select the link, or the block it sits in.", true);
    var href = q(".ae-href").value.trim();
    if (!SAFE_URL.test(href)) return say("That is not an address this site can link to.", true);
    var words = q(".ae-linktext").value.trim();
    preview(refs.map(function (ref) {
      return { ref: ref, op: "link", href: href, value: words };
    }), "link \u2192 " + href, "");
  }

  function swapImage() {
    var refs = doTargets();
    if (!refs.length) return say("Select the picture, or the block it sits in.", true);
    var src = q(".ae-imgsrc").value.trim();
    if (!SAFE_URL.test(src)) return say("That is not an image address this site can use.", true);
    var alt = q(".ae-imgalt").value.trim();
    preview(refs.map(function (ref) {
      return { ref: ref, op: "image", src: src, alt: alt };
    }), "image \u2192 " + src, "");
  }

  function insertBlock() {
    var refs = doTargets();
    if (!refs.length) return say("Select the block the new one should sit beside.", true);
    var tag = q(".ae-ins-tag").value;
    var where = q(".ae-ins-where").value;
    var body = q(".ae-ins-text").value.trim();
    var addr = q(".ae-ins-href").value.trim();
    var MEDIA = { img: 1, video: 1, audio: 1, iframe: 1 };
    if (MEDIA[tag] && !SAFE_URL.test(addr)) {
      return say("For " + tag + ", put its address in the Address box.", true);
    }
    if (tag === "a" && !SAFE_URL.test(addr)) {
      return say("For a link, put its address in the Address box.", true);
    }
    if (tag !== "hr" && !MEDIA[tag] && tag !== "a" && !body) {
      return say("Give the new element some words.", true);
    }
    preview(refs.map(function (ref) {
      var op = { ref: ref, op: where, tag: tag };
      if (MEDIA[tag]) { op.src = addr; op.alt = body; }
      else if (tag === "a") { op.href = addr; op.value = body; }
      else if (tag !== "hr") op.value = body;
      return op;
    }), where + ": " + tag +
      (body ? " \u2014 " + body.slice(0, 60) : (addr ? " \u2014 " + addr.slice(0, 60) : "")), "");
  }

  /* Widen the selection to the block around it, or narrow it to the first
     thing inside \u2014 so the box can be corrected without re-dragging. */
  function reshape(how) {
    var base = null;
    if (blocks.length) base = blocks[0].el;
    else if (runs.length) base = runs[0].el;
    if (!base) return say("Select something first.", true);
    var node = how === "grow" ? base.parentElement
      : (base.firstElementChild || base);
    if (!node || node === document.body) {
      return say("There is nowhere further to " + (how === "grow" ? "widen." : "narrow."), true);
    }
    var r = node.getBoundingClientRect();
    drawBox({ x: r.left + scrollX, y: r.top + scrollY },
      { x: r.right + scrollX, y: r.bottom + scrollY });
    gather();
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
  /* One press does the whole thing: put what is staged onto the page, then
     publish it. If nothing is staged yet, take the pane the admin is looking
     at and stage that first, so the button never asks for a step the person
     pressing it cannot see. */
  function applyChanges() {
    /* Whether anything is staged is read off the panel: the confirm row is
       only shown once there is something waiting to be applied. */
    var staged = q(".ae-confirm");
    if (!staged || staged.hidden) {
      var tab = q(".ae-tab.is-on");
      var which = tab ? tab.getAttribute("data-tab") : "words";
      if (which === "look") applyLook(); else if (which === "words") applyWords();
    }
    staged = q(".ae-confirm");
    if (!staged || staged.hidden) { say("There is nothing staged to apply yet.", true); return; }
    publish();
  }

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
  function showLog(whole) {
    var out = q(".ae-log-out");
    out.hidden = false;
    out.innerHTML = "<p class=\"muted xsmall\">Reading the log\u2026</p>";
    post({ action: "list", pass: pass, page: whole ? "" : PAGE }).then(function (d) {
      var scope = "<div class=\"ae-row\"><button type=\"button\" class=\"btn btn--small " +
        (whole ? "btn--ghost " : "") + "ae-scope\" data-whole=\"\">This page</button>" +
        "<button type=\"button\" class=\"btn btn--small " +
        (whole ? "" : "btn--ghost ") + "ae-scope\" data-whole=\"1\">Whole site</button></div>";
      var rows = (d.edits || []).map(function (e) {
        return "<tr><td>#" + e.id + "</td>" +
          (whole ? "<td>" + String(e.page || "").replace(/[<&]/g, "") + "</td>" : "") +
          "<td>" + String(e.prompt || "")
          .replace(/[<&]/g, "").slice(0, 90) + "</td><td>" + e.count + "</td><td>" + e.state +
          "</td><td><button type=\"button\" class=\"btn btn--small btn--ghost ae-flip\" " +
          "data-id=\"" + e.id + "\" data-to=\"" + (e.state === "live" ? "undo" : "redo") + "\">" +
          (e.state === "live" ? "Undo" : "Redo") + "</button></td></tr>";
      }).join("");
      out.innerHTML = scope + (rows
        ? "<p class=\"muted xsmall\">Every published change" + (whole ? " on the site" : " on this page") +
          ". Undo takes it off the page for everyone; redo puts it back. The log itself is never rewritten.</p>" +
          "<div class=\"table-scroll\"><table class=\"ae-table\"><thead><tr><th>#</th>" +
          (whole ? "<th>Page</th>" : "") + "<th>Asked for</th>" +
          "<th>Ops</th><th>State</th><th></th></tr></thead><tbody>" + rows + "</tbody></table></div>"
        : "<p class=\"muted xsmall\">Nothing has been published " +
          (whole ? "anywhere yet." : "on this page yet.") + "</p>");
      out.querySelectorAll(".ae-flip").forEach(function (b) {
        b.addEventListener("click", function () {
          post({ action: b.getAttribute("data-to"), pass: pass, id: Number(b.getAttribute("data-id")) })
            .then(function () { say("Done. Reload to see it as a visitor will."); showLog(whole); })
            .catch(function (err) { say(err.message || "That did not work.", true); });
        });
      });
      out.querySelectorAll(".ae-scope").forEach(function (b) {
        b.addEventListener("click", function () { showLog(b.getAttribute("data-whole") === "1"); });
      });
    }).catch(function (err) {
      out.innerHTML = "<p class=\"ae-msg is-bad\">" + (err.message || "The log would not open.") + "</p>";
    });
  }

  /* The backups: every publish and every source save keeps one, and any of
     them can be restored. The door was always in the API; this is the
     handle on it. */
  function showBackups() {
    var out = q(".ae-log-out");
    if (!out) return;
    out.hidden = false;
    out.innerHTML = "<p class=\"muted xsmall\">Reading the backups\u2026</p>";
    post({ action: "backups", pass: pass, page: PAGE }).then(function (d) {
      var rows = (d.backups || []).map(function (b) {
        return "<tr><td>#" + b.id + "</td><td>" + String(b.kind || "").replace(/[<&]/g, "") +
          "</td><td>" + String(b.detail || "").slice(0, 90).replace(/[<&]/g, "") +
          "</td><td>" + String(b.at || "").slice(0, 16).replace(/[<&]/g, "") +
          "</td><td><button type=\"button\" class=\"btn btn--small btn--ghost ae-rest\" data-id=\"" +
          b.id + "\">Restore</button></td></tr>";
      }).join("");
      out.innerHTML = rows
        ? "<p class=\"muted xsmall\">Every publish and every source save on this page kept what " +
          "stood before it. Restoring puts that moment back exactly.</p>" +
          "<div class=\"table-scroll\"><table class=\"ae-table\"><thead><tr><th>#</th><th>Kind</th>" +
          "<th>Detail</th><th>When</th><th></th></tr></thead><tbody>" + rows + "</tbody></table></div>"
        : "<p class=\"muted xsmall\">No backups kept on this page yet.</p>";
      out.querySelectorAll(".ae-rest").forEach(function (b) {
        b.addEventListener("click", function () {
          if (!window.confirm("Restore backup #" + b.getAttribute("data-id") +
            "? The page returns to exactly how it stood at that moment.")) return;
          post({ action: "restore", pass: pass, id: Number(b.getAttribute("data-id")) })
            .then(function () { say("Restored \u2014 reloading."); setTimeout(function () { location.reload(); }, 600); })
            .catch(function (err) { say(err.message || "It would not restore.", true); });
        });
      });
    }).catch(function (err) {
      out.innerHTML = "<p class=\"ae-msg is-bad\">" + (err.message || "The backups would not open.") + "</p>";
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

  /* ------------------------------------------ purported creation date */
  function loadDateEditor() {
    var input = q(".ae-created");
    if (!input) return;
    loadPageDate().then(function (date) { input.value = date || ""; });
  }

  function savePageDate(clear) {
    var input = q(".ae-created");
    var date = input && input.value || "";
    if (!clear && !date) return say("Choose a date first.", true);
    post({ action: "set-date", pass: pass, page: PAGE, date: date, clear: !!clear })
      .then(function (d) {
        if (input) input.value = d.date || "";
        if (d.date) {
          applyPageDate(d.date);
          say("The page now purports to have been created on " + dateLabel(d.date) +
            ". The real audit times were not changed.");
        } else {
          say("The purported creation date was cleared. Reloading the built metadata.");
          setTimeout(function () { location.reload(); }, 500);
        }
      }).catch(function (err) { say(err.message || "The date would not save.", true); });
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
    makePanelDraggable(panel);
    var closeButton = q(".ae-x");
    if (closeButton) closeButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeAll();
    });
    var field = q(".ae-pass");
    var go = function () {
      var typed = field.value.trim();
      if (!typed) return say("The passcode, please.", true);
      say("Trying the door\u2026");
      post({ action: "list", pass: typed, page: PAGE }).then(function () {
        pass = typed;
        /* Mint the remembered key, so no page of the house asks twice. */
        fetch("/api/owner", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "unlock", pass: typed })
        }).then(function (r) { return r.json().catch(function () { return {}; }); })
          .then(function (d) {
            if (d && d.ok && d.token) { doorToken = d.token; setCookie("eg-admin", d.token, 7); }
          }).catch(function () {});
        loadOwnerPanel();
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

/* ---------------------------------------------------------------------------
   Two doors, one at a time — and no walking away from work half done.

   Both the admin panel and the owner room are fixed to the left of the screen,
   so opening one over the other would bury it. Whichever opens last closes the
   other, and the two say so to each other over one event rather than reaching
   into one another's wiring.

   Leaving the page while changes are staged but not applied asks first. The
   staged state is read straight off the panel: the confirm row is only shown
   once there is something waiting to be applied.
   ------------------------------------------------------------------------ */
(function () {
  'use strict';
  function panel() { return document.querySelector('.admin-edit-panel'); }
  function panelOpen() { var p = panel(); return !!p && !p.hidden; }
  function staged() {
    var c = document.querySelector('.admin-edit-panel .ae-confirm');
    return !!c && !c.hidden;
  }
  function closePanel() {
    var x = document.querySelector('.admin-edit-panel .ae-x');
    if (x && panelOpen()) x.click();
  }
  function closeRoom() {
    var x = document.querySelector('.og-overlay .og-close');
    if (x) x.click();
  }

  /* When this panel opens, ask the owner room to step aside. */
  if (typeof MutationObserver === 'function') {
    var was = false;
    new MutationObserver(function () {
      var open = panelOpen();
      if (open && !was) {
        closeRoom();
        try {
          window.dispatchEvent(new CustomEvent('eg-mode-open',
            { detail: { mode: 'admin' } }));
        } catch (e) {}
      }
      was = open;
    }).observe(document.documentElement, { childList: true, subtree: true,
      attributes: true, attributeFilter: ['hidden'] });
  }

  /* And step aside when the owner room opens. */
  window.addEventListener('eg-mode-open', function (ev) {
    if (ev.detail && ev.detail.mode === 'owner') closePanel();
  });

  window.addEventListener('beforeunload', function (ev) {
    if (!staged()) return;
    ev.preventDefault();
    ev.returnValue = 'There are changes in Admin Edit Mode that have not been applied.';
    return ev.returnValue;
  });
})();
