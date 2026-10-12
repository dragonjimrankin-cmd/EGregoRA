/* ===========================================================================
   Owner Mode — the deeper door
   ---------------------------------------------------------------------------
   One step behind the admin door, on every page of the house.

   The remembered keys ride in two cookies, eg-admin and eg-owner. A door
   proved once with the right passcode mints a week-long token; this file
   checks it on load, tells the admin door it is real, and carries the
   owner's room — the traffic of the house, and the people.

   The people tab is the roll of the house: every account that has signed
   up, with the privilege it holds (member, admin, owner), when it last
   came through the door, and the work an owner may do to it — send a fresh
   sign-in code, change the details, set the privilege, suspend or reinstate
   it, take it off the roll, and read its whole trail, expanded where it
   stands.

   The traffic tab is what the house has been doing: visits by day, by
   page, by referrer, by the kind of machine they read it on, and what the
   members have been making.

   Keys are only ever sent to /api/owner. Nothing here stores a passcode.
   =========================================================================== */
(function () {
  "use strict";
  if (window.EGOwn) return;

  var DAYS = 7;
  var $ = (sel, root) => (root || document).querySelector(sel);

  /* ------------------------------------------------------------- cookies */
  function cookie(name) {
    var m = new RegExp("(?:^|;\\s*)" + name + "=([^;]+)").exec(document.cookie || "");
    return m ? m[1] : "";
  }
  function setCookie(name, value) {
    document.cookie = name + "=" + value + "; path=/; max-age=" + DAYS * 86400 + "; SameSite=Lax";
  }
  function clearCookie(name) {
    document.cookie = name + "=; path=/; max-age=0; SameSite=Lax";
  }

  function post(body) {
    return fetch("/api/owner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.assign({ token: cookie("eg-owner") || cookie("eg-admin") || "" }, body))
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        d._status = r.status;
        return d;
      });
    });
  }

  /* --------------------------------------------------------------- state */
  var state = {
    admin: null,   /* {kind, until} of a checked eg-admin cookie */
    owner: null,   /* {kind, until} of a checked eg-owner cookie */
    panel: null,   /* the open overlay, if any */
    pill: null,
    vaultKind: ""  /* the shelf the vault is currently filtered to */
  };

  function check(kind) {
    var tok = cookie(kind === "owner" ? "eg-owner" : "eg-admin");
    if (!tok) return Promise.resolve(null);
    return fetch("/api/owner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "check", token: tok })
    }).then(function (r) {
      return r.json().catch(function () { return {}; });
    }).then(function (d) {
      if (d && d.ok) {
        var info = { kind: d.kind, until: d.until, token: tok };
        if (kind === "owner") state.owner = info;
        else if (d.kind === "owner") { state.owner = info; state.admin = info; }
        else state.admin = info;
        return info;
      }
      clearCookie(kind === "owner" ? "eg-owner" : "eg-admin");
      if (kind === "owner") state.owner = null;
      else state.admin = null;
      return null;
    }).catch(function () {
      return null;
    });
  }

  /* The admin door on the page listens for this: the key checks out, open
     quietly, no asking. */
  function announce() {
    if (state.admin) window.dispatchEvent(new CustomEvent("eg-own-admin-remembered", {
      detail: { kind: state.admin.kind, until: state.admin.until, token: state.admin.token }
    }));
    paintPill();
  }

  /* ------------------------------------------------------------ the pill */
  function paintPill() {
    var want = Boolean(state.owner);
    if (want && !state.pill) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "og-pill";
      b.textContent = "✦ Owner mode";
      b.title = "The deeper door: the traffic of the house, and the people.";
      b.addEventListener("click", function () { openPanel(); });
      document.body.appendChild(b);
      state.pill = b;
    } else if (!want && state.pill) {
      state.pill.parentNode.removeChild(state.pill);
      state.pill = null;
    }
  }

  /* ------------------------------------------------------ ask for the key */
  function askOwnerKey(onOk) {
    if ($("#og-ask")) return;
    var wrap = document.createElement("div");
    wrap.id = "og-ask";
    wrap.innerHTML =
      '<div class="og-ask-card">' +
      '<p class="og-kicker">The deeper door</p>' +
      '<p class="og-note">Owner mode needs the owner key — the key that opens the ' +
      'owner room. It is the publishing key unless a separate owner key has ' +
      'been set. Three wrong and it shuts for twenty minutes.</p>' +
      '<label class="og-label" for="og-ask-pass">Owner key</label>' +
      '<input type="password" id="og-ask-pass" class="og-input" autocomplete="off">' +
      '<div class="og-row">' +
      '<button type="button" class="btn btn--small og-ask-go">Open the owner room</button>' +
      '<button type="button" class="btn btn--small btn--ghost og-ask-no">Not now</button>' +
      '</div>' +
      '<p class="og-msg"></p>' +
      '</div>';
    document.body.appendChild(wrap);
    var pass = $("#og-ask-pass", wrap);
    var msg = $(".og-msg", wrap);
    var say = (t, bad) => { msg.textContent = t || ""; msg.className = "og-msg" + (bad ? " is-bad" : ""); };
    var go = () => {
      var p = (pass.value || "").trim();
      if (!p) return say("The key, please.", true);
      say("Opening…");
      fetch("/api/owner", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "unlock", pass: p })
      }).then(function (r) {
        return r.json().catch(function () { return {}; });
      }).then(function (d) {
        wrap.parentNode && wrap.parentNode.removeChild(wrap);
        if (!d || !d.ok) return say("No.", true) && onOk && onOk(null, d && d.error || "The door would not open.");
        setCookie(d.kind === "owner" ? "eg-owner" : "eg-admin", d.token);
        state[d.kind === "owner" ? "owner" : "admin"] = { kind: d.kind, token: d.token };
        announce();
        if (d.kind === "owner") onOk && onOk(d);
        else onOk && onOk(d, "That opened the admin door, not the owner room. The owner key is set separately — or the founder's signed-in account opens it without a key.");
      }).catch(function () {
        wrap.parentNode && wrap.parentNode.removeChild(wrap);
        onOk && onOk(null, "The door did not answer.");
      });
    };
    $(".og-ask-go", wrap).addEventListener("click", go);
    $(".og-ask-no", wrap).addEventListener("click", function () { wrap.parentNode.removeChild(wrap); });
    pass.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    pass.focus();
  }

  function enterOwner() {
    if (state.owner) return openPanel();
    check("owner").then(function (info) {
      if (info) openPanel();
      else askOwnerKey(function (d, err) {
        if (d && d.kind === "owner") openPanel();
        else if (err) { var n = $("#og-ask .og-msg"); if (n) { n.textContent = err; n.className = "og-msg is-bad"; } }
      });
    });
  }

  /* ------------------------------------------------------------ the panel */
  var esc = (t) => String(t == null ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function fmtWhen(v) {
    if (!v) return "—";
    var d = new Date(v);
    if (isNaN(d.getTime())) return String(v).slice(0, 16);
    var sameYear = d.getFullYear() === new Date().getFullYear();
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: sameYear ? undefined : "numeric" }) +
      " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  function fmtNum(n) { return Number(n || 0).toLocaleString(); }

  function openPanel() {
    if (state.panel) { state.panel.hidden = false; return; }
    var p = document.createElement("div");
    p.id = "og-panel";
    p.className = "og-overlay";
    p.innerHTML =
      '<div class="og-sheet" role="dialog" aria-label="Owner mode">' +
      '<div class="og-head">' +
      '<div class="og-head-l">' +
      '<p class="og-kicker">Owner mode</p>' +
      '<h2 class="og-title">The owner room</h2>' +
      '</div>' +
      '<div class="og-head-r">' +
      '<button type="button" class="btn btn--small btn--ghost og-tab-btn is-on" data-ogtab="traffic">The traffic</button>' +
      '<button type="button" class="btn btn--small btn--ghost og-tab-btn" data-ogtab="people">The people</button>' +
      '<button type="button" class="btn btn--small btn--ghost og-tab-btn" data-ogtab="bios">The biographies</button>' +
      '<button type="button" class="btn btn--small btn--ghost og-tab-btn" data-ogtab="vault">The vault</button>' +
      '<span class="og-hands">' +
      '<button type="button" class="btn btn--small btn--ghost og-undo" title="Undo the last change made in this room" disabled>Undo</button>' +
      '<button type="button" class="btn btn--small btn--ghost og-redo" title="Bring back the last undone change" disabled>Redo</button>' +
      '<button type="button" class="btn btn--small og-apply" title="Save what has been changed in this room" disabled>Apply changes</button>' +
      '</span>' +
      '<button type="button" class="btn btn--small btn--ghost og-leave" title="Burn the owner key on this device">Leave owner mode</button>' +
      '<button type="button" class="btn btn--small btn--ghost og-close" aria-label="Close the owner room">&#215;</button>' +
      '</div>' +
      '</div>' +
      '<div class="og-body">' +
      '<section class="og-pane" data-pane="traffic"><p class="og-loading">Reading the house ledger…</p></section>' +
      '<section class="og-pane" data-pane="people" hidden><p class="og-loading">Reading the roll…</p></section>' +
      '<section class="og-pane" data-pane="bios" hidden><p class="og-loading">Reading the shelf…</p></section>' +
      '<section class="og-pane" data-pane="vault" hidden><p class="og-loading">Reading the vault…</p></section>' +
      '</div>' +
      '</div>';
    document.body.appendChild(p);
    state.panel = p;

    $(".og-close", p).addEventListener("click", closePanel);
    $(".og-leave", p).addEventListener("click", function () {
      forget("owner");
      closePanel();
    });
    Array.prototype.forEach.call(p.querySelectorAll(".og-tab-btn"), function (b) {
      b.addEventListener("click", function () { showTab(b.getAttribute("data-ogtab")); });
    });
    showTab("traffic");
  }

  function closePanel() {
    if (state.panel) {
      state.panel.parentNode && state.panel.parentNode.removeChild(state.panel);
      state.panel = null;
    }
  }

  function forget(kind) {
    var cname = kind === "owner" ? "eg-owner" : "eg-admin";
    var tok = cookie(cname);
    clearCookie(cname);
    if (tok) post({ action: "close", token: tok }).catch(function () {});
    if (kind === "owner") { state.owner = null; state.admin = null; }
    else state.admin = null;
    announce();
  }

  function showTab(name) {
    if (!state.panel) return;
    Array.prototype.forEach.call(state.panel.querySelectorAll(".og-pane"), function (s) {
      s.hidden = s.getAttribute("data-pane") !== name;
    });
    Array.prototype.forEach.call(state.panel.querySelectorAll(".og-tab-btn"), function (b) {
      b.classList.toggle("is-on", b.getAttribute("data-ogtab") === name);
    });
    if (name === "traffic") loadTraffic();
    else if (name === "bios") loadBios();
    else if (name === "vault") loadVault();
    else loadPeople();
  }

  /* ---------------------------------------------------------- biographies
     The members' own words and pictures, each waiting for the nod before
     it goes on the people page. */
  function loadBios() {
    var pane = state.panel && $('.og-pane[data-pane="bios"]', state.panel);
    if (!pane) return;
    post({ action: "bios" }).then(function (d) {
      if (!d || !d.ok) { pane.innerHTML = '<p class="og-msg is-bad">' + esc(d && d.error || "The shelf would not open.") + "</p>"; return; }
      var pend = d.pending || [];
      var html = '<div class="og-people-bar"><p class="og-muted">The members\u2019 own words, waiting for the nod. ' +
        (d.approved || 0) + " approved on the people page.</p>" +
        '<button type="button" class="btn btn--small btn--ghost">Refresh the shelf</button></div>';
      if (!pend.length) {
        html += '<p class="og-muted">Nothing is waiting. When a member submits a biography from their account page, it appears here for the nod.</p>';
      } else {
        html += '<div class="og-bios">';
        pend.forEach(function (b) {
          html += '<div class="og-bio">' +
            (b.avatar
              ? '<img class="og-bio-img" src="' + esc(b.avatar) + '" alt="">'
              : '<div class="og-bio-img og-bio-none">?</div>') +
            '<div class="og-bio-body">' +
            '<p><span class="og-who">' + esc(b.name) + '</span>' +
            '<span class="og-mail">' + esc(b.email) + " \u00b7 submitted " + esc(String(b.submitted_at || "").slice(0, 10)) + "</span></p>" +
            '<p class="og-bio-text">' + esc(b.bio).replace(/\n/g, "<br>") + "</p>" +
            '<p class="og-acts">' +
            '<button type="button" class="btn btn--small og-bio-approve" data-uid="' + b.member_id + '">Approve \u2014 put it on the page</button> ' +
            '<button type="button" class="btn btn--small btn--ghost og-danger og-bio-reject" data-uid="' + b.member_id + '">Pass on it</button>' +
            "</p></div></div>";
        });
        html += "</div>";
      }
      pane.innerHTML = html;
      Array.prototype.forEach.call(pane.querySelectorAll(".og-bio-approve, .og-bio-reject"), function (btn) {
        btn.addEventListener("click", function () {
          var approve = btn.classList.contains("og-bio-approve");
          btn.disabled = true;
          post({ action: approve ? "bio-approve" : "bio-reject", member_id: Number(btn.getAttribute("data-uid")) })
            .then(function (dd) {
              if (dd && dd.ok) loadBios();
              else { btn.disabled = false; }
            })
            .catch(function () { btn.disabled = false; });
        });
      });
    }).catch(function () {
      pane.innerHTML = '<p class="og-msg is-bad">The shelf would not answer.</p>';
    });
  }

  /* ---------------------------------------------------------------- the vault
     Every save the podcast and films editors have made, newest first. The
     rows are the record rather than a pointer at the shelf, so a recording
     that has since been unpublished, archived or deleted off the media page
     is still listed here — and, while the file itself survives, still
     fetchable. Nothing outside owner mode can read this. */
  function mb(n) {
    var b = Number(n) || 0;
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(0) + " KB";
    if (b < 1073741824) return (b / 1048576).toFixed(1) + " MB";
    return (b / 1073741824).toFixed(2) + " GB";
  }

  function whatWas(did) {
    var W = {
      "saved-published": "Saved and published.",
      "saved-draft": "Saved as a draft.",
      "published": "Published.",
      "unpublished": "Taken off the site.",
      "archive": "Archived off the shelf.",
      "restore": "Brought back as a draft.",
      "edited": "Its notes were changed.",
      "replaced": "A new master was saved over it.",
      "deleted": "Deleted."
    };
    return W[did] || "Saved.";
  }

  function vaultFilter(want, label, on) {
    return '<button type="button" class="btn btn--small btn--ghost og-vault-filter' +
      (want === on ? " is-on" : "") + '" data-kind="' + esc(want) + '">' + esc(label) + "</button>";
  }

  function loadVault(kind, before) {
    var pane = state.panel && $('.og-pane[data-pane="vault"]', state.panel);
    if (!pane) return;
    var want = kind == null ? state.vaultKind : kind;
    var ask = { action: "vault", limit: 60 };
    if (want) ask.kind = want;
    if (before) ask.before = before;
    post(ask).then(function (d) {
      if (!d || !d.ok) {
        pane.innerHTML = '<p class="og-msg is-bad">' +
          esc((d && d.error) || "The vault would not open.") + "</p>";
        return;
      }
      state.vaultKind = want;
      var items = d.items || [];
      var html =
        '<div class="og-people-bar">' +
        '<p class="og-muted">' + fmtNum(d.total || 0) + " saves kept, " + mb(d.bytes || 0) +
        " between them. Every save an editor makes is written here, and it stays " +
        "whether or not the episode does.</p>" +
        '<p class="og-acts og-vault-filters">' +
        vaultFilter("", "Everything", want) +
        vaultFilter("audio", "The podcast", want) +
        vaultFilter("video", "The films", want) +
        '<button type="button" class="btn btn--small btn--ghost og-vault-again">Read it again</button>' +
        "</p></div>";

      if (!items.length) {
        html += '<p class="og-muted">Nothing has been saved yet. As soon as an episode or a film ' +
          "is saved from its editor, it is written here.</p>";
      } else {
        html += '<div class="og-vault">';
        items.forEach(function (v) {
          var when = esc(String(v.saved_at || "").replace("T", " ").slice(0, 16));
          var flag = v.on_shelf ? "On the site now"
            : v.shelf_state ? "Off the site (" + esc(v.shelf_state) + ")"
              : v.media_id == null ? "No longer on the shelf" : "Not published";
          html += '<div class="og-bio og-vault-row">' +
            '<div class="og-bio-body">' +
            '<p><span class="og-who">' + esc(v.title || "Untitled") + "</span>" +
            '<span class="og-mail">' + when + " \u00b7 " +
            esc(v.kind === "video" ? "film" : "episode") +
            (v.bytes ? " \u00b7 " + mb(v.bytes) : "") +
            (v.saved_by ? " \u00b7 saved by " + esc(v.saved_by) : "") + "</span></p>" +
            '<p class="og-bio-text">' + esc(whatWas(v.did)) +
            (v.note ? " " + esc(v.note) : "") + "</p>" +
            '<p class="og-acts">' +
            '<span class="og-vault-flag ' + (v.on_shelf ? "is-live" : "is-off") + '">' + flag + "</span> " +
            (v.fetchable
              ? '<button type="button" class="btn btn--small og-vault-get" data-id="' + v.id +
                '">Fetch the file</button>'
              : '<span class="og-micro">The file went with the shelf entry; the note remains.</span>') +
            "</p></div></div>";
        });
        html += "</div>";
        if (d.more && items.length) {
          html += '<p class="og-acts"><button type="button" class="btn btn--small btn--ghost og-vault-more" data-before="' +
            esc(items[items.length - 1].saved_at) + '">Read older saves</button></p>';
        }
      }
      pane.innerHTML = html;

      Array.prototype.forEach.call(pane.querySelectorAll(".og-vault-filter"), function (b) {
        b.addEventListener("click", function () {
          loadVault(b.getAttribute("data-kind") || "", null);
        });
      });
      var again = pane.querySelector(".og-vault-again");
      if (again) again.addEventListener("click", function () { loadVault(state.vaultKind, null); });
      var older = pane.querySelector(".og-vault-more");
      if (older) older.addEventListener("click", function () {
        loadVault(state.vaultKind, older.getAttribute("data-before"));
      });
      Array.prototype.forEach.call(pane.querySelectorAll(".og-vault-get"), function (b) {
        b.addEventListener("click", function () {
          b.disabled = true;
          b.textContent = "Asking the store\u2026";
          post({ action: "vault-file", id: Number(b.getAttribute("data-id")) }).then(function (dd) {
            b.disabled = false;
            if (dd && dd.ok && dd.url) {
              window.open(dd.url, "_blank", "noopener");
              b.textContent = "Fetch the file";
            } else {
              b.textContent = (dd && dd.error) || "The store would not sign a link.";
            }
          }).catch(function () {
            b.disabled = false;
            b.textContent = "The store did not answer.";
          });
        });
      });
    }).catch(function () {
      pane.innerHTML = '<p class="og-msg is-bad">The vault would not answer.</p>';
    });
  }

  /* -------------------------------------------------------------- traffic */
  function barChart(el, series, key, color) {
    if (!series || !series.length) { el.innerHTML = '<p class="og-muted">No days yet.</p>'; return; }
    var max = 1;
    series.forEach(function (r) { max = Math.max(max, Number(r[key]) || 0); });
    var html = '<div class="og-chart" role="img" aria-label="Visits by day">';
    series.forEach(function (r) {
      var v = Number(r[key]) || 0;
      var h = Math.max(3, Math.round(v / max * 100));
      html += '<div class="og-bar-wrap" title="' + esc(r.day) + " — " + v + '">' +
        '<div class="og-bar" style="height:' + h + '%;background:' + color + '"></div>' +
        '<span class="og-bar-label">' + esc(String(r.day).slice(5)) + "</span></div>";
    });
    html += "</div>";
    el.innerHTML = html;
  }

  function statCard(label, value, sub) {
    return '<div class="og-stat"><span class="og-stat-n">' + esc(String(value)) + "</span>" +
      '<span class="og-stat-l">' + esc(label) + (sub ? '<em class="og-stat-s">' + esc(sub) + "</em>" : "") + "</span></div>";
  }

  function loadTraffic() {
    var pane = state.panel && $('.og-pane[data-pane="traffic"]', state.panel);
    if (!pane) return;
    post({ action: "analytics" }).then(function (d) {
      if (!d || !d.ok) { pane.innerHTML = '<p class="og-msg is-bad">' + esc(d && d.error || "The ledger would not open.") + "</p>"; return; }
      var v = d.visits || {}, s = d.signins || {}, c = d.content || {};
      var html = "";
      html += '<div class="og-stats">';
      html += statCard("Visits today", fmtNum(v.today));
      html += statCard("Visits · 7 days", fmtNum(v.d7));
      html += statCard("Visits · 30 days", fmtNum(v.d30));
      html += statCard("Visits · all time", fmtNum(v.total));
      html += statCard("Signed-in readers · 30 days", fmtNum(v.signed_in_30));
      html += statCard("Members", fmtNum(c.members), fmtNum(c.members_verified) + " verified · " + fmtNum(c.suspended) + " suspended");
      html += "</div>";

      html += '<p class="og-kicker og-sub">The last twenty-eight days</p>';
      html += '<div class="og-chart-block"><p class="og-muted">Visits</p><div class="og-chart-holder" data-chart="visits"></div></div>';
      html += '<div class="og-chart-block"><p class="og-muted">Members through the door (sign-ins)</p><div class="og-chart-holder" data-chart="signins"></div></div>';

      html += '<div class="og-cols">';
      html += '<div><p class="og-kicker og-sub">Top pages · 30 days</p><table class="og-table">';
      (d.pages || []).forEach(function (r) {
        html += '<tr><td class="og-path">' + esc(r.path) + "</td><td class=\"og-n\">" + fmtNum(r.n) + "</td></tr>";
      });
      html += "</table></div>";
      html += '<div><p class="og-kicker og-sub">Where they came from · 30 days</p><table class="og-table">';
      (d.refs || []).forEach(function (r) {
        html += '<tr><td class="og-path">' + esc(r.ref) + "</td><td class=\"og-n\">" + fmtNum(r.n) + "</td></tr>";
      });
      html += "</table></div></div>";

      html += '<div class="og-cols">';
      html += '<div><p class="og-kicker og-sub">The machines</p><table class="og-table">';
      (d.agents || []).forEach(function (r) {
        html += '<tr><td>' + esc(r.label) + "</td><td class=\"og-n\">" + fmtNum(r.n) + "</td></tr>";
      });
      html += "</table></div>";
      html += '<div><p class="og-kicker og-sub">What the house holds</p><table class="og-table">';
      html += "<tr><td>Episodes on the shelf</td><td class='og-n'>" + fmtNum(c.episodes) + "</td></tr>";
      html += "<tr><td>Films on the shelf</td><td class='og-n'>" + fmtNum(c.films) + "</td></tr>";
      html += "<tr><td>Questions to the oracle · 30 days</td><td class='og-n'>" + fmtNum(c.questions_30) + "</td></tr>";
      html += "<tr><td>Forum posts · 30 days</td><td class='og-n'>" + fmtNum(c.forum_30) + "</td></tr>";
      html += "<tr><td>Letters · 30 days</td><td class='og-n'>" + fmtNum(c.letters_30) + "</td></tr>";
      html += "<tr><td>Live feeds · 30 days</td><td class='og-n'>" + fmtNum(c.live_30) + "</td></tr>";
      html += "<tr><td>Sign-ins · 7 / 30 days / all</td><td class='og-n'>" + fmtNum(s.d7) + " / " + fmtNum(s.d30) + " / " + fmtNum(s.total) + "</td></tr>";
      html += "</table></div></div>";

      pane.innerHTML = html;
      barChart($('[data-chart="visits"]', pane), d.series, "visits", "rgba(215,176,90,.75)");
      barChart($('[data-chart="signins"]', pane), d.series, "signins", "rgba(127,174,122,.8)");
    }).catch(function (e) {
      pane.innerHTML = '<p class="og-msg is-bad">The ledger would not answer.</p>';
    });
  }

  /* --------------------------------------------------------------- people */
  var usersCache = [];

  function loadPeople() {
    var pane = state.panel && $('.og-pane[data-pane="people"]', state.panel);
    if (!pane) return;
    post({ action: "users" }).then(function (d) {
      if (!d || !d.ok) { pane.innerHTML = '<p class="og-msg is-bad">' + esc(d && d.error || "The roll would not open.") + "</p>"; return; }
      usersCache = d.users || [];
      var html = '<div class="og-people-bar">' +
        "<p class=\"og-muted\">The roll of the house — " + usersCache.length + " account" + (usersCache.length === 1 ? "" : "s") +
        '. Change the privilege, the status, the details; send a fresh key; or read the trail.</p>' +
        '<button type="button" class="btn btn--small btn--ghost og-people-refresh">Refresh the roll</button></div>';
      html += '<table class="og-table og-people"><thead><tr>' +
        "<th>Who</th><th>Joined</th><th>Last sign-in</th><th>Privilege</th><th>Status</th><th>The work</th>" +
        "</tr></thead><tbody>";
      usersCache.forEach(function (u) {
        var suspended = u.status === "suspended";
        html += '<tr data-uid="' + u.id + '"' + (suspended ? ' class="og-row-suspended"' : "") + ">" +
          "<td><span class=\"og-who\">" + esc(u.name || "(no name)") + "</span>" +
          '<span class="og-mail">' + esc(u.email) + (u.verified ? "" : " · unverified") + "</span></td>" +
          "<td>" + esc(String(u.joined || "").slice(0, 10)) + "</td>" +
          "<td>" + esc(fmtWhen(u.last_login)) + "</td>" +
          '<td><select class="og-sel og-priv" data-uid="' + u.id + '">' +
          ["member", "admin", "owner"].map(function (p) {
            return '<option value="' + p + '"' + (p === u.privilege ? " selected" : "") + ">" + p + "</option>";
          }).join("") + "</select></td>" +
          '<td><select class="og-sel og-status" data-uid="' + u.id + '">' +
          ["active", "suspended"].map(function (p) {
            return '<option value="' + p + '"' + (p === u.status ? " selected" : "") + ">" + p + "</option>";
          }).join("") + "</select></td>" +
          '<td class="og-acts">' +
          '<button type="button" class="btn btn--small btn--ghost og-act" data-act="reset" data-uid="' + u.id + '" title="Post a fresh sign-in code to the address">Fresh key</button> ' +
          '<button type="button" class="btn btn--small btn--ghost og-act" data-act="details" data-uid="' + u.id + '">Details</button> ' +
          '<button type="button" class="btn btn--small btn--ghost og-act" data-act="trail" data-uid="' + u.id + '">Trail ▸</button> ' +
          '<button type="button" class="btn btn--small btn--ghost og-act og-danger" data-act="delete" data-uid="' + u.id + '">Take off the roll</button>' +
          "</td></tr>" +
          '<tr class="og-subrow" data-subuid="' + u.id + '" hidden><td colspan="6"></td></tr>';
      });
      html += "</tbody></table>";
      pane.innerHTML = html;
      wirePeople(pane);
    }).catch(function () {
      pane.innerHTML = '<p class="og-msg is-bad">The roll would not answer.</p>';
    });
  }

  function findUser(id) {
    for (var i = 0; i < usersCache.length; i++) if (usersCache[i].id === Number(id)) return usersCache[i];
    return null;
  }

  function subRow(id) {
    if (!state.panel) return null;
    return $('.og-subrow[data-subuid="' + id + '"]', state.panel);
  }

  function wirePeople(pane) {
    Array.prototype.forEach.call(pane.querySelectorAll(".og-priv, .og-status"), function (sel) {
      sel.addEventListener("change", function () {
        var u = findUser(sel.getAttribute("data-uid"));
        if (!u) return;
        var body = { action: "user-update", id: u.id };
        if (sel.classList.contains("og-priv")) body.privilege = sel.value;
        else body.status = sel.value;
        post(body).then(function (d) {
          if (!d || !d.ok) { sel.value = sel.classList.contains("og-priv") ? u.privilege : u.status; alert(d && d.error || "The roll refused that."); return; }
          if (sel.classList.contains("og-priv")) u.privilege = sel.value; else u.status = sel.value;
          var tr = sel.closest("tr");
          if (sel.classList.contains("og-status")) tr.classList.toggle("og-row-suspended", sel.value === "suspended");
        }).catch(function () { alert("The roll would not answer."); });
      });
    });

    Array.prototype.forEach.call(pane.querySelectorAll(".og-act"), function (b) {
      b.addEventListener("click", function () {
        var act = b.getAttribute("data-act");
        var u = findUser(b.getAttribute("data-uid"));
        if (!u) return;
        if (act === "reset") {
          post({ action: "user-reset", id: u.id }).then(function (d) {
            alert(d && d.ok ? d.note : (d && d.error) || "The post would not send.");
          }).catch(function () { alert("The post would not answer."); });
        } else if (act === "delete") {
          if (!confirm("Take " + (u.name || u.email) + " off the roll entirely? Their words in the house stay; their key and account do not.")) return;
          post({ action: "user-delete", id: u.id }).then(function (d) {
            if (!d || !d.ok) { alert(d && d.error || "The roll refused."); return; }
            loadPeople();
          }).catch(function () { alert("The roll would not answer."); });
        } else if (act === "details") {
          var row = subRow(u.id);
          if (!row) return;
          var showing = !row.hidden;
          Array.prototype.forEach.call(pane.querySelectorAll(".og-subrow"), function (r) { r.hidden = true; });
          if (showing) return;
          row.hidden = false;
          row.firstElementChild.innerHTML =
            '<div class="og-details">' +
            '<label class="og-label">Name<input type="text" class="og-input og-d-name" maxlength="120" value="' + esc(u.name || "") + '"></label>' +
            '<label class="og-label">Country<input type="text" class="og-input og-d-country" maxlength="80" value="' + esc(u.country || "") + '"></label>' +
            '<label class="og-label">Legal name<input type="text" class="og-input og-d-legal" maxlength="120" value="' + esc(u.legal_name || "") + '"></label>' +
            '<label class="og-check"><input type="checkbox" class="og-d-sub"' + (u.subscribed ? " checked" : "") + '> subscribed to the letters</label>' +
            '<span class="og-micro">Address: ' + esc(u.email) + " · joined " + esc(String(u.joined || "").slice(0, 10)) +
            " · identity " + esc(u.id_status) + "</span>" +
            '<div class="og-row">' +
            '<button type="button" class="btn btn--small og-d-save">Save the details</button>' +
            '<span class="og-micro og-d-msg"></span>' +
            "</div></div>";
          $(".og-d-save", row).addEventListener("click", function () {
            post({
              action: "user-update", id: u.id,
              name: $(".og-d-name", row).value,
              country: $(".og-d-country", row).value,
              legal_name: $(".og-d-legal", row).value,
              subscribed: $(".og-d-sub", row).checked
            }).then(function (d) {
              var m = $(".og-d-msg", row);
              if (!d || !d.ok) { m.textContent = d && d.error || "The roll refused."; m.className = "og-micro is-bad"; return; }
              u.name = $(".og-d-name", row).value || u.name;
              m.textContent = "Saved."; m.className = "og-micro";
              loadPeople();
            }).catch(function () { var m = $(".og-d-msg", row); if (m) m.textContent = "The roll would not answer."; });
          });
        } else if (act === "trail") {
          var row = subRow(u.id);
          if (!row) return;
          var showing = !row.hidden;
          Array.prototype.forEach.call(pane.querySelectorAll(".og-subrow"), function (r) { r.hidden = true; });
          if (showing) return;
          row.hidden = false;
          row.firstElementChild.innerHTML = '<p class="og-loading">Reading the trail…</p>';
          post({ action: "user-timeline", id: u.id }).then(function (d) {
            var cell = row.firstElementChild;
            if (!d || !d.ok) { cell.innerHTML = '<p class="og-msg is-bad">' + esc(d && d.error || "The trail would not open.") + "</p>"; return; }
            if (!d.events || !d.events.length) {
              cell.innerHTML = '<p class="og-muted">Nothing yet in the trail — the trail fills as the member moves through the house.</p>';
              return;
            }
            var html = '<p class="og-kicker og-sub">The trail of ' + esc(u.name || u.email) + "</p><ol class='og-trail'>";
            d.events.forEach(function (e) {
              html += "<li><span class='og-trail-when'>" + esc(fmtWhen(e.at)) + "</span> " +
                "<strong>" + esc(e.label) + "</strong>" +
                (e.detail ? " — <span class='og-muted'>" + esc(e.detail) + "</span>" : "") + "</li>";
            });
            html += "</ol>";
            cell.innerHTML = html;
          }).catch(function () {
            row.firstElementChild.innerHTML = '<p class="og-msg is-bad">The trail would not answer.</p>';
          });
        }
      });
    });

    var refresh = $(".og-people-refresh", pane);
    if (refresh) refresh.addEventListener("click", loadPeople);
  }

  /* ------------------------------------------------------------------ css */
  function injectStyles() {
    if (document.getElementById("og-extra-style")) return;
    var css = [
      ".og-pill { position: fixed; left: 1.1rem; bottom: 7.9rem; z-index: 900; font-family: Cinzel, serif; font-size: .72rem; letter-spacing: .14em;",
      "  color: #0e0c0a; background: #d7b05a; border: 1px solid rgba(215,176,90,.7); padding: .5rem .9rem; cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,.5); }",
      ".og-pill:hover { background: #f3ddaa; }",
      ".og-overlay { position: fixed; inset: 0; z-index: 950; background: rgba(4,3,2,.82); display: flex; align-items: stretch; justify-content: flex-end; }",
      ".og-sheet { width: min(1060px, 96vw); margin-left: auto; background: #12100c; border-left: 1px solid rgba(215,176,90,.4);",
      "  color: #e9e0c9; display: flex; flex-direction: column; font-family: 'EB Garamond', Georgia, serif; }",
      ".og-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; padding: 1.2rem 1.4rem .9rem; border-bottom: 1px solid rgba(215,176,90,.25); flex-wrap: wrap; }",
      ".og-kicker { font-family: Cinzel, serif; font-size: .68rem; letter-spacing: .3em; text-transform: uppercase; color: #d7b05a; margin: 0 0 .3rem; }",
      ".og-title { font-family: Cinzel, serif; font-size: 1.35rem; margin: 0; color: #f3ddaa; font-weight: 700; }",
      ".og-head-r { display: flex; gap: .45rem; flex-wrap: wrap; align-items: center; }",
      ".og-hands { display: flex; gap: .35rem; align-items: center; padding: .1rem .5rem .1rem .1rem; border-right: 1px solid rgba(215,176,90,.25); margin-right: .2rem; }",
      ".og-hands .btn[disabled] { opacity: .4; cursor: default; }",
      "@media (max-width: 640px) { .og-pill { left: .7rem; bottom: 4.4rem; } .og-hands { border-right: 0; margin-right: 0; } }",

      ".og-tab-btn.is-on { border-color: #d7b05a !important; color: #f3ddaa !important; }",
      ".og-body { padding: 1.2rem 1.4rem 2rem; overflow-y: auto; flex: 1; }",
      ".og-loading, .og-muted { color: #9f947a; font-size: .9rem; }",
      ".og-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .6rem; margin-bottom: 1.2rem; }",
      ".og-stat { border: 1px solid rgba(215,176,90,.25); background: #0e0c0a; padding: .7rem .8rem; display: flex; flex-direction: column; gap: .15rem; }",
      ".og-stat-n { font-family: Cinzel, serif; font-size: 1.5rem; color: #f3ddaa; }",
      ".og-stat-l { font-size: .78rem; color: #cbbb93; letter-spacing: .04em; display: block; }",
      ".og-stat-s { display: block; font-style: normal; font-size: .7rem; color: #9f947a; }",
      ".og-sub { margin: 1.1rem 0 .4rem; }",
      ".og-chart-holder { margin-bottom: .8rem; }",
      ".og-chart { display: flex; align-items: flex-end; gap: 2px; height: 110px; border-bottom: 1px solid rgba(215,176,90,.3); padding-bottom: 2px; }",
      ".og-bar-wrap { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; height: 100%; position: relative; }",
      ".og-bar { width: 100%; min-height: 2px; opacity: .9; }",
      ".og-bar-label { position: absolute; bottom: -1.15rem; font-size: .58rem; color: #9f947a; white-space: nowrap; }",
      ".og-chart { margin-bottom: 1.2rem; }",
      ".og-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 1.4rem; }",
      "@media (max-width: 780px) { .og-cols { grid-template-columns: 1fr; } .og-sheet { margin-left: 0; } }",
      ".og-table { width: 100%; border-collapse: collapse; font-size: .86rem; }",
      ".og-table th { font-family: Cinzel, serif; font-size: .62rem; letter-spacing: .18em; text-transform: uppercase; color: #9f947a; text-align: left; padding: .3rem .4rem; border-bottom: 1px solid rgba(215,176,90,.3); }",
      ".og-table td { padding: .38rem .4rem; border-bottom: 1px solid rgba(215,176,90,.12); vertical-align: top; }",
      ".og-path { font-family: 'Courier New', monospace; font-size: .8rem; color: #cbbb93; }",
      ".og-n { text-align: right; font-family: 'Courier New', monospace; color: #f3ddaa; white-space: nowrap; }",
      ".og-people-bar { display: flex; justify-content: space-between; gap: 1rem; align-items: center; margin-bottom: .7rem; flex-wrap: wrap; }",
      ".og-people td { font-size: .84rem; }",
      ".og-who { display: block; font-family: Cinzel, serif; font-size: .82rem; color: #f3ddaa; letter-spacing: .05em; }",
      ".og-mail { display: block; font-size: .74rem; color: #9f947a; margin-top: .1rem; }",
      ".og-row-suspended td { opacity: .55; }",
      ".og-acts { white-space: nowrap; }",
      ".og-acts .btn { font-size: .68rem; padding: .28rem .5rem; margin: 0 .15rem 0 0; }",
      ".og-danger { color: #c98b6a; }",
      ".og-sel { background: #0e0c0a; color: #e9e0c9; border: 1px solid rgba(215,176,90,.35); font-size: .8rem; padding: .25rem .3rem; }",
      ".og-subrow td { background: #0e0c0a; }",
      ".og-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: .8rem; padding: .4rem 0; align-items: start; }",
      ".og-label { display: block; font-size: .72rem; color: #cbbb93; letter-spacing: .05em; margin-bottom: .35rem; }",
      ".og-input { width: 100%; box-sizing: border-box; background: #12100c; color: #e9e0c9; border: 1px solid rgba(215,176,90,.35); padding: .4rem .5rem; font-family: inherit; font-size: .85rem; }",
      ".og-check { display: flex; gap: .4rem; align-items: center; font-size: .8rem; color: #cbbb93; }",
      ".og-bios { display: flex; flex-direction: column; gap: .8rem; }",
      ".og-bio { display: flex; gap: .7rem; border: 1px solid rgba(215,176,90,.2); border-radius: 4px; padding: .6rem; }",
      ".og-bio-img { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; flex: none; background: #15120d; }",
      ".og-bio-none { display: flex; align-items: center; justify-content: center; color: #9f947a; font-size: 1.4rem; }",
      ".og-bio-body { min-width: 0; }",
      ".og-bio-text { margin: .3rem 0; font-size: .9rem; color: #e7dcc4; }",
      ".og-micro { font-size: .72rem; color: #9f947a; }",
      ".og-micro.is-bad { color: #c98b6a; }",
      ".og-trail { margin: .3rem 0 0; padding-left: 1.2rem; max-height: 300px; overflow-y: auto; }",
      ".og-trail li { margin: 0 0 .45rem; font-size: .84rem; }",
      ".og-trail-when { font-family: 'Courier New', monospace; font-size: .72rem; color: #9f947a; margin-right: .5rem; }",
      ".og-row { display: flex; gap: .8rem; align-items: center; }",
      ".og-ask { position: fixed; inset: 0; z-index: 960; background: rgba(4,3,2,.82); display: flex; align-items: center; justify-content: center; }",
      ".og-ask-card { width: min(430px, 92vw); background: #12100c; border: 1px solid rgba(215,176,90,.45); padding: 1.4rem; color: #e9e0c9; font-family: 'EB Garamond', Georgia, serif; }",
      ".og-note { font-size: .88rem; color: #cbbb93; margin: 0 0 .9rem; }",
      ".og-msg { font-size: .82rem; color: #9f947a; min-height: 1rem; margin: .6rem 0 0; }",
      ".og-msg.is-bad { color: #c98b6a; }",
      ".og-row { display: flex; gap: .6rem; }",
      ".og-vault { display: flex; flex-direction: column; gap: .55rem; }",
      ".og-vault-row { padding: .7rem .85rem; border: 1px solid rgba(215,176,90,.22); border-radius: 3px; background: rgba(215,176,90,.04); }",
      ".og-vault-flag { display: inline-block; font-size: .74rem; letter-spacing: .04em; padding: .16rem .5rem; border-radius: 2px; border: 1px solid rgba(215,176,90,.35); color: #cbbb93; }",
      ".og-vault-flag.is-live { color: #7fb99a; border-color: rgba(127,185,154,.5); }",
      ".og-vault-flag.is-off { color: #c98b6a; border-color: rgba(201,139,106,.45); }",
      ".og-vault-filters, .og-vault .og-acts { display: flex; flex-wrap: wrap; gap: .45rem; align-items: center; }",
      ".og-vault .og-acts { margin: .45rem 0 0; }"
    ].join("\n");
    var st = document.createElement("style");
    st.id = "og-extra-style";
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ----------------------------------------------------------------- start */
  function boot() {
    injectStyles();
    check("admin").then(function () {
      return check("owner");
    }).then(function () {
      announce();
    });
  }

  window.EGOwn = {
    enterOwner: enterOwner,
    openPanel: openPanel,
    closePanel: closePanel,
    forget: forget,
    cookie: cookie,
    setCookie: setCookie,
    check: check,
    isOwner: () => Boolean(state.owner),
    isAdmin: () => Boolean(state.admin)
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

/* ---------------------------------------------------------------------------
   Undo, Redo and Apply changes for the owner room.

   Every edit made anywhere inside the room is remembered as it happens, so the
   three hands in the header work the same whichever pane is open. Nothing here
   reaches into the room's own wiring: it listens from outside, and Apply
   changes simply presses the pane's own save hand, so whatever that pane does
   to save is exactly what still happens.
   ------------------------------------------------------------------------ */
(function () {
  'use strict';
  var done = [], undone = [], applied = false;
  /* The room the last edit happened in. Normally there is only one, but
     aiming at it rather than at the first one in the document means the hands
     light up in the room that was actually touched. */
  var current = null;

  function room() {
    if (current && current.querySelector && current.querySelector('.og-undo')) return current;
    var all = document.querySelectorAll('.og-overlay');
    return all.length ? all[all.length - 1] : null;
  }
  function hands() {
    var r = room(); if (!r) return null;
    return { u: r.querySelector('.og-undo'), r: r.querySelector('.og-redo'),
             a: r.querySelector('.og-apply') };
  }
  function paint() {
    var h = hands(); if (!h) return;
    if (h.u) h.u.disabled = !done.length;
    if (h.r) h.r.disabled = !undone.length;
    if (h.a) h.a.disabled = !done.length;
  }
  function value(el) { return el.type === 'checkbox' ? el.checked : el.value; }

  /* An input event arrives after the field has already changed, so the old
     wording cannot be read off it. Every field is therefore photographed
     while it is still untouched, and that photograph is what Undo returns
     to. Taken when a room is drawn, and again whenever one is entered. */
  function snapshot(root) {
    if (!root || !root.querySelectorAll) return;
    var fields = root.querySelectorAll('input, textarea, select');
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].__ogKnown === undefined) fields[i].__ogKnown = value(fields[i]);
    }
  }
  function setValue(el, v) {
    if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
    el.__ogKnown = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /* A field is recorded once per stretch of editing: the first change stores
     the photograph, and later typing only updates where it ended up, so one
     Undo takes the whole stretch back rather than a letter at a time. */
  document.addEventListener('input', function (ev) {
    var el = ev.target;
    if (!el || !el.closest || !el.closest('.og-overlay')) return;
    if (!('value' in el) && el.type !== 'checkbox') return;
    applied = false;
    current = el.closest('.og-overlay');
    var last = done[done.length - 1];
    if (last && last.el === el) { last.to = value(el); }
    else {
      var from = el.__ogKnown !== undefined ? el.__ogKnown : value(el);
      done.push({ el: el, from: from, to: value(el) });
      undone.length = 0;
    }
    paint();
  }, true);

  document.addEventListener('focusin', function (ev) {
    if (ev.target && ev.target.closest && ev.target.closest('.og-overlay')) snapshot(document);
  });

  document.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
    if (!b) return;
    if (b.classList.contains('og-undo')) {
      var rec = done.pop(); if (!rec) return;
      setValue(rec.el, rec.from);
      undone.push(rec); paint();
    } else if (b.classList.contains('og-redo')) {
      var back = undone.pop(); if (!back) return;
      setValue(back.el, back.to);
      done.push(back); paint();
    } else if (b.classList.contains('og-apply')) {
      /* Press the pane's own save hand, and let it do the saving. */
      var r = room();
      var save = r && (r.querySelector('.og-d-save:not([hidden])') ||
                       r.querySelector('.og-d-save'));
      if (save) save.click();
      applied = true;
      done.forEach(function (rec) { rec.el.__ogKnown = rec.to; });
      done.length = 0; undone.length = 0; paint();
    }
  });

  /* Opening the room again starts from a clean slate. */
  document.addEventListener('eg-own-admin-remembered', function () {
    done.length = 0; undone.length = 0; applied = false; paint();
  });

  /* Two doors, one at a time. When the room opens, ask the admin panel to
     step aside, and step aside in turn when it opens. Both are fixed to the
     left of the screen, so one over the other would bury it. */
  function closeAdmin() {
    var x = document.querySelector('.admin-edit-panel .ae-x');
    if (x) x.click();
  }
  var roomWas = false;
  function sweep() {
    snapshot(document);
    paint();
    var open = !!document.querySelector('.og-overlay');
    if (open && !roomWas) {
      closeAdmin();
      try {
        window.dispatchEvent(new CustomEvent('eg-mode-open', { detail: { mode: 'owner' } }));
      } catch (e) {}
    }
    roomWas = open;
  }
  if (typeof MutationObserver === 'function') {
    new MutationObserver(sweep).observe(document.documentElement,
      { childList: true, subtree: true });
  }
  window.addEventListener('eg-mode-open', function (ev) {
    if (ev.detail && ev.detail.mode === 'admin') {
      var x = document.querySelector('.og-overlay .og-close');
      if (x) x.click();
    }
  });

  /* Leaving the page with changes that were never applied. */
  window.addEventListener('beforeunload', function (ev) {
    if (!done.length || applied) return;
    ev.preventDefault();
    ev.returnValue = 'There are changes in the owner room that have not been applied.';
    return ev.returnValue;
  });
})();
