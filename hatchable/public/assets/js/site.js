/* EGregoRA — starfield, reveals, nav */
(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Mobile nav --- */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      const label = toggle.querySelector("em");
      if (label) label.textContent = open ? "Close" : "Menu";
    });
  }

  /* --- Scroll reveals ---
   *
   * Everything marked .reveal starts at opacity 0 and is faded in when it
   * comes into view. That is a decoration, and a decoration must never be
   * the reason a visitor cannot read the page, so this is deliberately
   * paranoid:
   *
   *   - the threshold is 0, not a fraction. A fractional threshold is the
   *     classic phone bug: the Ask Ed panel is several thousand pixels tall
   *     on a narrow screen, 12% of it is taller than the whole viewport, so
   *     it could never satisfy the observer and simply stayed invisible.
   *   - anything already on screen at load, or scrolled past, is shown at
   *     once rather than waiting for a scroll that may never come.
   *   - if there is no IntersectionObserver, or the observer has not fired
   *     within a couple of seconds, everything is revealed outright.
   */
  const reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  const show = (el) => el.classList.add("in");

  /* The fade only exists once this script is running. Without the class the
     stylesheet leaves every panel visible, so a script that fails to load,
     is blocked, or throws can never hide the page. */
  document.documentElement.classList.add("js-reveals");

  if (!("IntersectionObserver" in window)) {
    reveals.forEach(show);
  } else {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting || e.intersectionRatio > 0) { show(e.target); io.unobserve(e.target); }
      }),
      { threshold: 0, rootMargin: "120px 0px 120px 0px" }
    );
    reveals.forEach((el) => io.observe(el));

    /* Belt and braces: anything whose top is already above the fold. */
    const sweep = () => {
      const h = window.innerHeight || document.documentElement.clientHeight;
      reveals.forEach((el) => {
        if (el.classList.contains("in")) return;
        const r = el.getBoundingClientRect();
        if (r.top < h + 120 && r.bottom > -120) show(el);
      });
    };
    sweep();
    window.addEventListener("load", sweep, { once: true });
    setTimeout(sweep, 400);
    /* If nothing at all has been revealed after a few seconds the observer
       is not working on this device. Show everything rather than leave the
       visitor with a blank page. */
    setTimeout(() => {
      if (!reveals.some((el) => el.classList.contains("in"))) reveals.forEach(show);
    }, 3000);
  }

  /* --- Starfield + slow nebula drift --- */
  const cv = document.getElementById("starfield");
  if (!cv || reduce) return;
  const ctx = cv.getContext("2d");
  let w, h, stars, dpr;

  function seed() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.width = innerWidth * dpr;
    h = cv.height = innerHeight * dpr;
    const count = Math.min(380, Math.floor((innerWidth * innerHeight) / 5200));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 1.25 + 0.25) * dpr,
      a: Math.random(),
      s: Math.random() * 0.012 + 0.002,
      hue: Math.random() < 0.18 ? "215,176,90" : Math.random() < 0.3 ? "155,125,219" : "239,227,200"
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const st of stars) {
      st.a += st.s;
      const alpha = 0.25 + Math.abs(Math.sin(st.a)) * 0.7;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${st.hue},${alpha.toFixed(3)})`;
      ctx.fill();
      st.y += st.r * 0.012;
      if (st.y > h + 2) { st.y = -2; st.x = Math.random() * w; }
    }
    requestAnimationFrame(draw);
  }

  seed();
  draw();
  let t;
  addEventListener("resize", () => { clearTimeout(t); t = setTimeout(seed, 200); });
})();

/* ------------------------------------------------------------------ Oracle
   A conversational client for /api/ask. Keeps the thread in memory, sends the
   last turns with each question so the oracle can follow a line of enquiry,
   renders a transcript, streams the answer in word by word, offers follow-up
   chips, and hands the finished text to Gink to read aloud. */
(() => {
  "use strict";
  const form = document.getElementById("oracle-form");
  if (!form) return;

  const thread = document.getElementById("oracle-thread");
  const chips = document.getElementById("oracle-chips");
  const box = document.getElementById("o-question");
  const btn = document.getElementById("o-submit");
  const reset = document.getElementById("o-reset");
  const nameEl = document.getElementById("o-name");
  const limbEl = document.getElementById("o-limb");
  if (!thread || !box || !btn) return;

  const fileInput = document.getElementById("o-files");
  const fileList = document.getElementById("o-file-list");

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX_KEPT = 16;                 // turns held in the client thread
  let history = [];                    // [{ role, text }]
  let busy = false;
  let attachments = [];                // [{ id, name, kind, chars }]

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* A deliberately small amount of markdown: the order's answers use bold,
     italics, em dashes and the ◆ grading marks, and nothing else. */
  const rich = (text) => esc(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    /* markdown links, which the oracle uses when it has searched the web */
    .replace(/\[([^\]\n]+)\]\((https?:&#39;?\/\/[^\s)]+|https?:\/\/[^\s)]+)\)/g,
      (m, label, url) => '<a href="' + url + '" target="_blank" rel="noopener nofollow">' + label + "</a>")
    /* bare URLs left in the prose */
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g,
      (m, pre, url) => pre + '<a href="' + url + '" target="_blank" rel="noopener nofollow">' + url + "</a>")
    .replace(/\n/g, "\n");

  const paragraphs = (text) =>
    rich(text).split(/\n{2,}/).map((p) => {
      const lines = p.split("\n");
      if (lines.every((l) => /^\s*[—\-•]\s+/.test(l)) && lines.length > 1) {
        return "<ul>" + lines.map((l) =>
          "<li>" + l.replace(/^\s*[—\-•]\s+/, "") + "</li>").join("") + "</ul>";
      }
      return "<p>" + lines.join("<br>") + "</p>";
    }).join("");

  const scrollThread = () => {
    thread.scrollTop = thread.scrollHeight;
  };

  const addMsg = (role, html, cls) => {
    const el = document.createElement("div");
    el.className = "oracle-msg oracle-msg--" + role + (cls ? " " + cls : "");
    el.innerHTML =
      '<p class="oracle-who">' + (role === "you" ? "You" : "The Oracle") + "</p>" +
      '<div class="oracle-text">' + html + "</div>";
    const waiting = document.getElementById("oracle-waiting");
    if (waiting) waiting.hidden = true;
    thread.appendChild(el);
    scrollThread();
    return el;
  };

  const thinking = () => {
    const el = addMsg("oracle", '<p class="oracle-dots"><i></i><i></i><i></i></p>', "is-thinking");
    return el;
  };

  /* Reveal an answer a few words at a time, which is what makes a reply feel
     answered rather than pasted. Instant under reduced-motion. */
  const reveal = (el, text, done) => {
    const target = el.querySelector(".oracle-text");
    if (reduce) { target.innerHTML = paragraphs(text); scrollThread(); done && done(); return; }
    const words = text.split(/(\s+)/);
    let i = 0;
    const step = () => {
      i = Math.min(words.length, i + 3);
      target.innerHTML = paragraphs(words.slice(0, i).join(""));
      scrollThread();
      if (i < words.length) setTimeout(step, 16);
      else done && done();
    };
    step();
  };

  const setChips = (list) => {
    if (!chips) return;
    chips.innerHTML = "";
    if (!list || !list.length) { chips.hidden = true; return; }
    chips.hidden = false;
    list.forEach((q) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.textContent = q;
      chips.appendChild(b);
    });
  };

  /* Pictures the oracle drew for this reply. */
  const attachImages = (el, data) => {
    if (!data.images || !data.images.length) return;
    const wrap = document.createElement("div");
    wrap.className = "oracle-art";
    data.images.slice(0, 3).forEach((img) => {
      if (!img || !img.url) return;
      const fig = document.createElement("figure");
      fig.innerHTML =
        '<a href="' + esc(img.url) + '" target="_blank" rel="noopener">' +
        '<img src="' + esc(img.url) + '" alt="' +
        esc(img.prompt || "An image drawn by the oracle") + '" loading="lazy"></a>' +
        '<figcaption>Drawn just now by the oracle \u00b7 generated, not photographed' +
        (img.prompt ? " \u00b7 " + esc(String(img.prompt).slice(0, 160)) : "") + "</figcaption>";
      wrap.appendChild(fig);
    });
    if (wrap.children.length) {
      el.appendChild(wrap);
      scrollThread();
      if (window.EGArrived) window.EGArrived("oracle-image", wrap);
    }
  };

  /* Provenance — where the answer came from, which model wrote it, what it was
     grounded in — is deliberately NOT shown. It belongs in the server log, not
     in the conversation. Only things the reader can act on survive here: links
     the oracle actually followed, and a note it wrote itself. */
  const footnote = (el, data) => {
    const bits = [];
    if (data.sources && data.sources.length) {
      bits.push("looked up on the web: " + data.sources.slice(0, 4).map((s) =>
        '<a href="' + esc(s.url) + '" target="_blank" rel="noopener nofollow">' +
        esc(s.title || s.url).slice(0, 60) + "</a>").join(", "));
    }
    if (data.note) bits.push(esc(data.note));
    if (!bits.length) return;
    const p = document.createElement("p");
    p.className = "oracle-src";
    p.innerHTML = bits.join(" \u00b7 ");
    el.appendChild(p);
  };

  /* ---- files handed to the oracle ---- */
  const renderFiles = () => {
    if (!fileList) return;
    fileList.innerHTML = "";
    attachments.forEach((f) => {
      const li = document.createElement("li");
      li.className = "file-chip" + (f.pending ? " is-pending" : "") + (f.error ? " is-error" : "");
      li.innerHTML =
        '<span class="file-name">' + esc(f.name) + "</span>" +
        '<span class="file-meta">' + esc(
          f.pending ? "reading\u2026" :
          f.error ? f.error :
          f.kind === "image" ? "image \u00b7 held as reference" :
          (f.chars || 0).toLocaleString() + " characters read") + "</span>";
      if (!f.pending) {
        const x = document.createElement("button");
        x.type = "button";
        x.className = "file-x";
        x.setAttribute("aria-label", "Remove " + f.name);
        x.textContent = "\u00d7";
        x.addEventListener("click", () => {
          attachments = attachments.filter((a) => a !== f);
          renderFiles();
        });
        li.appendChild(x);
      }
      fileList.appendChild(li);
    });
  };

  const readAsBase64 = (file) => new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(",").pop());
    fr.onerror = () => reject(new Error("unreadable"));
    fr.readAsDataURL(file);
  });

  const sendFile = async (file) => {
    const entry = { name: file.name, pending: true };
    attachments.push(entry);
    renderFiles();
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error("larger than 4 MB");
      const data = await readAsBase64(file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: window.EGAuthHeaders ? window.EGAuthHeaders() : { "content-type": "application/json" },
        body: JSON.stringify({
          name: file.name, type: file.type, data,
          asker: (nameEl && nameEl.value || "").trim()
        })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.id) throw new Error(out.error || "could not be read");
      Object.assign(entry, out, { pending: false });
    } catch (err) {
      entry.pending = false;
      entry.error = (err && err.message) || "failed";
    }
    renderFiles();
  };

  if (fileInput) fileInput.addEventListener("change", () => {
    Array.from(fileInput.files || []).slice(0, 6).forEach(sendFile);
    fileInput.value = "";
  });

  const ask = async (question) => {
    if (busy) return;
    const q = String(question || "").trim();
    if (q.length < 2) return;

    busy = true;
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = "Consulting\u2026";
    if (reset) reset.hidden = false;
    setChips([]);

    const ready = attachments.filter((f) => f.id);
    addMsg("you", paragraphs(q) + (ready.length
      ? '<p class="oracle-attached">Attached: ' +
        ready.map((f) => esc(f.name)).join(", ") + "</p>"
      : ""));
    history.push({ role: "user", text: q });
    box.value = "";
    box.style.height = "";

    const pending = thinking();

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: window.EGAuthHeaders ? window.EGAuthHeaders() : { "content-type": "application/json" },
        body: JSON.stringify({
          question: q,
          name: (nameEl && nameEl.value || "").trim(),
          limb: (limbEl && limbEl.value) || "",
          history: history.slice(0, -1).slice(-MAX_KEPT),
          attachments: attachments.filter((f) => f.id).map((f) => f.id)
        })
      });
      const data = await res.json().catch(() => ({}));

      pending.classList.remove("is-thinking");

      if (!res.ok || !data.answer) {
        pending.querySelector(".oracle-text").innerHTML =
          "<p>" + esc(data.error || "The oracle is silent just now. The written form below still reaches Ed.") + "</p>";
        pending.classList.add("is-error");
        history.pop();
      } else {
        reveal(pending, data.answer, () => {
          attachImages(pending, data);
          if (data.videos && data.videos.length && window.EGFilmWatch) {
            data.videos.forEach((v) => { if (v && v.id) window.EGFilmWatch(v.id, v.prompt); });
          }
          footnote(pending, data);
          setChips(data.followups);
          scrollThread();
        });
        history.push({ role: "oracle", text: data.answer });
        if (history.length > MAX_KEPT) history = history.slice(-MAX_KEPT);
        if (window.EGFox && window.EGFox.available) window.EGFox.speak(data.answer);
        else window.__EG_PENDING_SPEECH__ = data.answer;
      }
    } catch {
      pending.classList.remove("is-thinking");
      pending.classList.add("is-error");
      pending.querySelector(".oracle-text").innerHTML =
        "<p>No answer could be fetched \u2014 this page may be running without its backend. " +
        "The written form below still reaches Ed.</p>";
      history.pop();
    } finally {
      busy = false;
      btn.disabled = false;
      btn.textContent = label;
      box.focus();
    }
  };

  const expand = document.getElementById("o-expand");
  if (expand) expand.addEventListener("click", () => {
    const on = document.body.classList.toggle("oracle-tall");
    expand.setAttribute("aria-pressed", on ? "true" : "false");
    expand.textContent = on ? "Shrink the space" : "Expand the space";
    try { localStorage.setItem("eg-oracle-tall", on ? "1" : "0"); } catch {}
    scrollThread();
  });
  try {
    if (localStorage.getItem("eg-oracle-tall") === "1" && expand) expand.click();
  } catch {}

  form.addEventListener("submit", (e) => { e.preventDefault(); ask(box.value); });

  // Enter sends, Shift+Enter makes a new line
  box.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit ? form.requestSubmit() : ask(box.value);
    }
  });

  // grow the box with the question
  const grow = () => {
    box.style.height = "auto";
    box.style.height = Math.min(box.scrollHeight, 240) + "px";
  };
  box.addEventListener("input", grow);

  if (chips) chips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (b) ask(b.textContent);
  });

  if (reset) reset.addEventListener("click", () => {
    history = [];
    thread.querySelectorAll(".oracle-msg:not(.oracle-greet)").forEach((n) => n.remove());
    const waiting = document.getElementById("oracle-waiting");
    if (waiting) waiting.hidden = false;
    setChips([
      "Why 137.5 degrees and not 120?",
      "Is the Law of One testable?",
      "Is magic real, in one paragraph?"
    ]);
    reset.hidden = true;
    if (window.EGFox) window.EGFox.stop();
    box.value = "";
    box.focus();
  });
})();

/* ------------------------------------------------- Hold-to-speak microphone
   Push-to-talk for the oracle, using the browser's own SpeechRecognition.
   Hold the button (pointer or space bar), speak, release. The transcript is
   written into the question box; if it looks like a complete question the
   form is submitted for you. Nothing is uploaded by this code — recognition
   is the browser's, and in Chrome it goes to Google's speech service exactly
   as it does for any other site that uses the API. Say so plainly rather
   than pretend otherwise. */
(() => {
  "use strict";
  const btn = document.getElementById("o-mic");
  const form = document.getElementById("oracle-form");
  const box = document.getElementById("o-question");
  const hint = document.getElementById("o-mic-hint");
  if (!btn || !form || !box) return;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    btn.hidden = true;
    if (hint) {
      hint.innerHTML = "This browser has no speech recognition, so the hold-to-speak " +
        "button is hidden. Firefox and most in-app browsers are in this group. Type the question instead — " +
        "the oracle answers identically either way.";
    }
    return;
  }
  btn.hidden = false;

  const label = btn.querySelector(".mic-label");
  const setLabel = (s) => { if (label) label.textContent = s; };

  let rec = null;
  let active = false;
  let committed = "";   // finalised text from this hold
  let before = "";      // whatever was already in the box
  let gotSpeech = false;
  let holdStart = 0;

  const fox = () => (window.EGFox && typeof window.EGFox.listen === "function") ? window.EGFox : null;

  const start = () => {
    if (active) return;
    active = true;
    gotSpeech = false;
    committed = "";
    holdStart = Date.now();
    before = box.value.trim();
    btn.classList.add("is-listening");
    setLabel("Listening…");
    fox()?.listen(true);

    rec = new SR();
    rec.lang = document.documentElement.lang || "en-GB";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) committed += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      gotSpeech = gotSpeech || !!(committed.trim() || interim.trim());
      const joined = (before ? before + " " : "") + (committed + interim).replace(/\s+/g, " ").trim();
      box.value = joined;
      box.dispatchEvent(new Event("input", { bubbles: true }));
    };

    rec.onerror = (e) => {
      const why = {
        "not-allowed": "Microphone permission was refused. Allow it in the padlock menu, or type instead.",
        "service-not-allowed": "This browser will not run speech recognition on this page. Type instead.",
        "no-speech": "Nothing was heard. Hold the button, speak, then release.",
        "audio-capture": "No microphone was found on this device.",
        "network": "Speech recognition needs a connection and could not reach its service."
      }[e.error] || "Speech recognition stopped unexpectedly. Type the question instead.";
      if (hint) hint.textContent = why;
      finish(true);
    };

    rec.onend = () => { if (active) finish(false); };

    try { rec.start(); }
    catch { finish(true); }
  };

  const finish = (quiet) => {
    if (!active) return;
    active = false;
    btn.classList.remove("is-listening");
    setLabel("Hold to speak");
    fox()?.listen(false);
    try { rec && rec.stop(); } catch {}
    rec = null;

    const held = Date.now() - holdStart;
    const text = box.value.trim();

    if (!quiet && held < 350) {
      if (hint) hint.textContent = "Hold the button down while you speak — a tap is too short to hear anything.";
      return;
    }
    if (!gotSpeech) return;

    // tidy the transcript: capitalise, and add a question mark if it asks something
    let tidy = text.replace(/\s+/g, " ").trim();
    if (tidy) {
      tidy = tidy.charAt(0).toUpperCase() + tidy.slice(1);
      if (!/[.?!]$/.test(tidy)) {
        tidy += /^(who|what|when|where|why|how|is|are|was|were|do|does|did|can|could|should|would|will|if)\b/i
          .test(tidy) ? "?" : ".";
      }
      box.value = tidy;
    }

    if (tidy.length >= 8) {
      if (hint) hint.textContent = "Heard you. Consulting the order…";
      form.requestSubmit
        ? form.requestSubmit()
        : form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    } else if (hint) {
      hint.textContent = "That was too short to work with. Hold again and ask a fuller question.";
    }
  };

  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    btn.setPointerCapture?.(e.pointerId);
    start();
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
    btn.addEventListener(ev, () => finish(false)));
  btn.addEventListener("contextmenu", (e) => e.preventDefault());

  btn.addEventListener("keydown", (e) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); start(); }
  });
  btn.addEventListener("keyup", (e) => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); finish(false); }
  });
  btn.addEventListener("blur", () => finish(false));
  document.addEventListener("visibilitychange", () => { if (document.hidden) finish(true); });
})();

/* ------------------------------------------------- Floating scroll arrows
   A small rail of two arrows, fixed to the right edge. Each one appears only
   when there is actually somewhere to go in that direction, so on a short
   page neither is drawn, and at the foot of a long one only the up arrow is.
   Hidden entirely for anyone who has asked for reduced motion to stay put —
   no, in fact they still work, they simply jump instead of gliding. */
(() => {
  "use strict";
  const rail = document.getElementById("scroll-rail");
  const up = document.getElementById("scroll-top");
  const down = document.getElementById("scroll-bottom");
  if (!rail || !up || !down) return;

  const SLACK = 24;           // px of travel below which there is nothing to do
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior = reduce ? "auto" : "smooth";

  const scroller = document.scrollingElement || document.documentElement;

  const update = () => {
    const y = window.scrollY || scroller.scrollTop || 0;
    const max = Math.max(0, scroller.scrollHeight - window.innerHeight);
    const canUp = y > SLACK;
    const canDown = max - y > SLACK;

    /* Each arrow keeps its slot in the rail whether or not it is shown, so
       the surviving one does not jump when the other goes. The rail itself
       only disappears when neither direction has anywhere to go. */
    up.classList.toggle("is-off", !canUp);
    down.classList.toggle("is-off", !canDown);
    up.disabled = !canUp;
    down.disabled = !canDown;
    up.setAttribute("aria-hidden", canUp ? "false" : "true");
    down.setAttribute("aria-hidden", canDown ? "false" : "true");
    up.tabIndex = canUp ? 0 : -1;
    down.tabIndex = canDown ? 0 : -1;
    rail.hidden = !(canUp || canDown);
    rail.setAttribute("aria-hidden", rail.hidden ? "true" : "false");
  };

  const go = (to) => window.scrollTo({ top: to, behavior });
  up.addEventListener("click", () => go(0));
  down.addEventListener("click", () =>
    go(Math.max(0, scroller.scrollHeight - window.innerHeight)));

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  };

  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  addEventListener("load", update);
  // the page grows as reveal animations and Gink's canvas settles in
  if (window.ResizeObserver) {
    new ResizeObserver(onScroll).observe(document.body);
  }
  update();
})();


/* ------------------------------------------------------- Progress bars
 * One bar, used by every generator on the page.
 *
 * Two kinds of number can arrive and the bar never pretends they are the
 * same. A MEASURED percentage is the sampler's own step counter, reported by
 * the GPU doing the work. An ESTIMATED one is this page reading the clock
 * against how long the route usually takes — it eases towards 94% and stops
 * there, because a bar that sits at 99% is a lie and one that hits 100%
 * before the file exists is a worse one. The label says which you are
 * looking at, and the line beneath says which machine is doing the work.
 * ------------------------------------------------------------------ */
(function () {
  window.EGBar = function (card, opts) {
    opts = opts || {};
    var wrap = card.querySelector('.gen-wait');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'gen-wait';
      card.insertBefore(wrap, card.firstChild);
    }
    wrap.innerHTML =
      '<div class="gen-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
      '<span></span></div>' +
      '<p class="gen-line"><strong class="gen-pct">0%</strong>' +
      '<span class="gen-kind">estimated from the clock</span></p>' +
      '<p class="gen-note">' + (opts.note || 'Working\u2026') + '</p>' +
      '<p class="gen-gpu">Looking for a machine\u2026</p>';

    var box  = wrap.querySelector('.gen-bar');
    var fill = wrap.querySelector('.gen-bar span');
    var pct  = wrap.querySelector('.gen-pct');
    var kind = wrap.querySelector('.gen-kind');
    var note = wrap.querySelector('.gen-note');
    var gpu  = wrap.querySelector('.gen-gpu');

    var shown = 0;
    var measured = false;
    var expect = Number(opts.expect) || 30;
    var t0 = Date.now();

    function paint(v) {
      var n = Math.min(100, Math.max(0, Math.round(v)));
      if (n <= shown) return;
      shown = n;
      fill.style.width = n + '%';
      pct.textContent = n + '%';
      box.setAttribute('aria-valuenow', String(n));
      if (n >= 100) box.classList.add('is-full');
    }

    function creep() {
      if (measured) return;
      var f = ((Date.now() - t0) / 1000) / expect;
      paint(94 * (1 - Math.exp(-2.2 * f)));
    }

    var timer = setInterval(creep, 700);
    creep();

    return {
      set: function (v, isMeasured, stage) {
        if (isMeasured && !measured) {
          measured = true;
          kind.textContent = 'measured on the GPU';
        }
        if (typeof v === 'number' && v > 0) paint(v);
        if (stage) note.textContent = stage;
      },
      gpu: function (text) { if (text) gpu.textContent = text; },
      note: function (text) { if (text) note.textContent = text; },
      done: function () { measured = true; clearInterval(timer); paint(100); },
      stop: function () { clearInterval(timer); }
    };
  };
})();

/* ------------------------------------------------------------- Drawing box
   A direct line to /api/draw: a prompt in, one finished image out, with no
   model and no conversation in between. */
(() => {
  "use strict";
  const form = document.getElementById("draw-form");
  if (!form) return;

  const box = document.getElementById("d-prompt");
  const btn = document.getElementById("d-submit");
  const clear = document.getElementById("d-clear");
  const out = document.getElementById("draw-out");
  const examples = document.getElementById("draw-examples");
  const nameEl = document.getElementById("o-name");
  if (!box || !btn || !out) return;

  let busy = false;

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const draw = async (prompt) => {
    const p = String(prompt || "").trim();
    if (busy || p.length < 3) return;

    busy = true;
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = "Drawing\u2026";
    if (clear) clear.hidden = false;

    const card = document.createElement("figure");
    card.className = "draw-card is-working";
    card.innerHTML = '<figcaption>' + esc(p) + "</figcaption>";
    const bar = window.EGBar(card, { note: "Drawing \u2014 fifteen to forty seconds.", expect: 28 });
    out.prepend(card);
    card.scrollIntoView({ block: "nearest", behavior: "smooth" });

    try {
      const res = await fetch("/api/draw", {
        method: "POST",
        headers: window.EGAuthHeaders ? window.EGAuthHeaders() : { "content-type": "application/json" },
        body: JSON.stringify({ prompt: p, name: (nameEl && nameEl.value || "").trim() })
      });
      const data = await res.json().catch(() => ({}));

      /* The quick routes were unavailable and the picture is being drawn on
         the order's own GPU: wait on it the way a clip is waited on. */
      if (res.ok && data.id && data.status === "queued") {
        bar.stop();
        if (window.EGJobWatch) { window.EGJobWatch(card, data.id, p, data); return; }
      }

      bar.done();
      bar.stop();
      card.classList.remove("is-working");

      if (!res.ok || !data.url) {
        card.classList.add("is-error");
        card.innerHTML =
          "<p>" + esc(data.error || "The drawing failed. Try again, or change the wording.") + "</p>" +
          '<figcaption>' + esc(p) + "</figcaption>";
      } else {
        card.innerHTML =
          '<a href="' + esc(data.url) + '" target="_blank" rel="noopener">' +
          '<img src="' + esc(data.url) + '" alt="' + esc(p) + '" loading="lazy"></a>' +
          "<figcaption>" + esc(p) +
          '<span class="draw-meta">Generated, not photographed' +
          (data.provider ? " \u00b7 " + esc(data.provider) : "") +
          (data.hardware ? '<br>Drawn on ' + esc(data.hardware) : "") +
          " \u00b7 open in a new tab for the full size</span></figcaption>";
        if (window.EGMontageAdd) window.EGMontageAdd(data.url, p, "image");
        if (window.EGArrived) window.EGArrived("image", card);
      }
    } catch {
      bar.stop();
      card.classList.remove("is-working");
      card.classList.add("is-error");
      card.innerHTML =
        "<p>No image could be fetched \u2014 this page may be running without its backend.</p>" +
        '<figcaption>' + esc(p) + "</figcaption>";
    } finally {
      busy = false;
      btn.disabled = false;
      btn.textContent = label;
    }
  };

  form.addEventListener("submit", (e) => { e.preventDefault(); draw(box.value); });

  box.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      form.requestSubmit ? form.requestSubmit() : draw(box.value);
    }
  });

  if (examples) examples.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    box.value = b.textContent.trim();
    box.focus();
  });

  if (clear) clear.addEventListener("click", () => {
    out.innerHTML = "";
    clear.hidden = true;
    box.value = "";
    box.focus();
  });
})();

/* --------------------------------------------------------------- Filming
   /api/video is a job queue: submit a prompt, then poll until HunyuanVideo
   1.5 has finished the clip (about three minutes for five seconds of 480p). */
(() => {
  "use strict";
  const form = document.getElementById("film-form");
  if (!form) return;

  const box = document.getElementById("v-prompt");
  const aspectEl = document.getElementById("v-aspect");
  const modelEl = document.getElementById("v-model");
  const modelNote = document.getElementById("v-model-note");
  const btn = document.getElementById("v-submit");
  const clear = document.getElementById("v-clear");
  const out = document.getElementById("film-out");
  const examples = document.getElementById("film-examples");
  const nameEl = document.getElementById("o-name");
  if (!box || !btn || !out) return;

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const ready = (card, data, prompt) => {
    card.classList.remove("is-working");
    var isImage = data.kind === "image";
    card.innerHTML =
      (isImage
        ? '<a href="' + esc(data.url) + '" target="_blank" rel="noopener"><img src="' +
          esc(data.url) + '" alt="' + esc(prompt) + '" loading="lazy"></a>'
        : '<video controls playsinline preload="metadata" src="' + esc(data.url) + '"></video>') +
      "<figcaption>" + esc(prompt) +
      '<span class="draw-meta">Generated, not ' + (isImage ? "photographed" : "filmed") + ' \u00b7 ' +
      esc(data.model || "HunyuanVideo 1.5 \u00b7 480p") +
      (data.hardware ? "<br>Rendered on " + esc(data.hardware) : "") +
      (data.carried ? '<br>Carried over \u00b7 ' + esc(data.carried) : "") +
      "</span></figcaption>";
    if (window.EGMontageAdd) {
      window.EGMontageAdd(data.url, prompt, isImage ? "image" : "video", {
        id: data.id, sheet: data.sheet, seed: data.seed
      });
    }
    if (window.EGArrived) window.EGArrived(card.dataset.origin === "oracle" ? "oracle-video" : "video", card);
  };

  const failed = (card, msg, prompt) => {
    card.classList.remove("is-working");
    card.classList.add("is-error");
    card.innerHTML = "<p>" + esc(msg) + "</p><figcaption>" + esc(prompt) + "</figcaption>";
  };

  /* Poll every 6 seconds, for up to forty minutes, moving the bar with
     whatever the server knows: the sampler's own step count where the
     machine reports it, the clock where it does not. */
  const watch = (card, id, prompt, first) => {
    let tries = 0;
    const bar = card.__bar || window.EGBar(card, {
      note: "Waiting for a machine\u2026",
      expect: (first && first.kind === "image") ? 90 : 300
    });
    card.__bar = bar;
    if (first && first.hardware) bar.gpu(first.hardware);
    if (first && first.note) bar.note(first.note);

    const tick = async () => {
      tries += 1;
      if (tries > 400) {
        bar.stop();
        return failed(card, "This has run for over forty minutes \u2014 it may still arrive; reload later.", prompt);
      }
      try {
        const res = await fetch("/api/video?id=" + encodeURIComponent(id));
        const data = await res.json().catch(() => ({}));
        if (typeof data.progress === "number") bar.set(data.progress, data.measured, data.stage || null);
        if (data.hardware) bar.gpu(data.hardware);
        if (data.status === "ready" && data.url) { bar.done(); bar.stop(); return ready(card, data, prompt); }
        if (data.status === "failed") { bar.stop(); return failed(card, data.error || "The generator gave up on that one.", prompt); }
      } catch { /* keep waiting */ }
      setTimeout(tick, 6000);
    };
    setTimeout(tick, 5000);
  };

  let busy = false;

  /* ---- continuation ----------------------------------------------------
     Set by the montage when a shot is chosen to grow the next one out of.
     It holds the parent's id and, where the browser could read the frame off
     the canvas, the frame itself — already uploaded, so the model can be
     handed a literal first frame rather than a description of one. */
  let cont = null;
  const contBox = document.getElementById("v-continues");

  const paintCont = () => {
    if (!contBox) return;
    if (!cont) { contBox.hidden = true; contBox.innerHTML = ""; return; }
    contBox.hidden = false;
    contBox.innerHTML =
      (cont.thumb ? '<img src="' + esc(cont.thumb) + '" alt="The frame this shot continues from">' : "") +
      '<div><p class="cont-head">Continuing from shot ' + esc(String(cont.index || "?")) + "</p>" +
      '<p class="muted xsmall">' +
      (cont.frame
        ? "The last frame goes to the model as this shot\u2019s first frame. "
        : "The frame itself could not be read off this clip, so the words and the seed carry it. ") +
      "Characters, setting, camera, light and film stock are carried over word for word \u2014 " +
      "write only what happens next.</p>" +
      (cont.carried ? '<p class="muted xsmall cont-sheet">' + esc(cont.carried) + "</p>" : "") +
      '<button type="button" class="btn btn--ghost btn--small" id="v-cont-drop">Start fresh instead</button></div>';
    const drop = document.getElementById("v-cont-drop");
    if (drop) drop.addEventListener("click", () => { cont = null; paintCont(); });
  };

  /* Called by the montage. */
  window.EGExtendFrom = (info) => {
    cont = info || null;
    paintCont();
    const anchor = document.getElementById("film-box");
    if (anchor) anchor.scrollIntoView({ block: "start", behavior: "smooth" });
    if (box) { box.focus(); if (!box.value.trim()) box.placeholder = "What happens next in this shot?"; }
  };

  const film = async (prompt) => {
    const p = String(prompt || "").trim();
    if (busy || p.length < 3) return;
    busy = true;
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = "Generating\u2026";
    if (clear) clear.hidden = false;

    const card = document.createElement("figure");
    card.className = "draw-card is-working";
    card.innerHTML = "<figcaption>" + esc(p) + "</figcaption>";
    card.__bar = window.EGBar(card, {
      note: "Filming \u2014 about three minutes for five seconds of 480p. Leave the page open.",
      expect: 300
    });
    out.prepend(card);

    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: window.EGAuthHeaders ? window.EGAuthHeaders() : { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: p,
          aspect: (aspectEl && aspectEl.value) || "16:9",
          model: (modelEl && modelEl.value) || "hunyuan15",
          name: (nameEl && nameEl.value || "").trim(),
          from: cont ? cont.id : undefined,
          frame: cont ? cont.frame : undefined,
          sheet: cont ? cont.sheet : undefined,
          seed: cont ? cont.seed : undefined
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.id) { card.__bar.stop(); failed(card, data.error || "The camera would not start.", p); }
      else {
        watch(card, data.id, p, data);
        cont = null;
        paintCont();
      }
    } catch {
      if (card.__bar) card.__bar.stop();
      failed(card, "No clip could be requested \u2014 this page may be running without its backend.", p);
    } finally {
      busy = false;
      btn.disabled = false;
      btn.textContent = label;
    }
  };

  form.addEventListener("submit", (e) => { e.preventDefault(); film(box.value); });
  if (examples) examples.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    box.value = b.textContent.trim();
    box.focus();
  });
  if (clear) clear.addEventListener("click", () => {
    out.innerHTML = "";
    clear.hidden = true;
    box.value = "";
    box.focus();
  });

  /* What each model is, in the server's words rather than the page's. */
  if (modelEl) {
    fetch("/api/video?models=1")
      .then((r) => r.json())
      .then((d) => {
        if (!d || !d.models) return;
        const notes = {};
        modelEl.innerHTML = "";
        d.models.forEach((m) => {
          notes[m.key] = m.note + (m.own_gpu ? "" : " Needs a paid route \u2014 too large for the order\u2019s own GPU.");
          const o = document.createElement("option");
          o.value = m.key;
          o.textContent = m.label;
          modelEl.appendChild(o);
        });
        const paint = () => { if (modelNote) modelNote.textContent = notes[modelEl.value] || ""; };
        modelEl.addEventListener("change", paint);
        paint();
      })
      .catch(() => {});
  }

  /* A picture queued on the order's own GPU is watched exactly like a clip. */
  window.EGJobWatch = (card, id, prompt, first) => watch(card, id, prompt, first);

  /* Clips the oracle starts for itself inside the conversation. */
  window.EGFilmWatch = (id, prompt) => {
    const card = document.createElement("figure");
    card.className = "draw-card is-working";
    card.innerHTML = "<figcaption>" + esc(prompt || "") + "</figcaption>";
    card.__bar = window.EGBar(card, { note: "The oracle is filming \u2014 about three minutes.", expect: 300 });
    card.dataset.origin = "oracle";
    out.prepend(card);
    document.getElementById("film-box").scrollIntoView({ block: "nearest", behavior: "smooth" });
    watch(card, id, prompt || "");
  };
})();

/* ------------------------------------------------------------------ *
 * The Threshold — accounts, emailed codes, and passkey biometrics.
 * ------------------------------------------------------------------ */
(function () {
  var box = document.getElementById('auth-box');
  var KEY = 'eg-session';

  /* token lives in localStorage and travels as a bearer header */
  function token() {
    try { return localStorage.getItem(KEY) || held || ''; } catch (e) { return held || ''; }
  }
  var held = '';
  function setToken(t) {
    held = t || '';
    window.__egTok = held;
    /* If storage was declined, the session lives only as long as this tab. */
    var ok = !window.EGConsent || window.EGConsent.allowed();
    try {
      if (t && ok) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY);
    } catch (e) {}
  }
  window.EGToken = token;

  function post(url, body) {
    var h = { 'Content-Type': 'application/json' };
    var t = token();
    if (t) h.Authorization = 'Bearer ' + t;
    return fetch(url, { method: 'POST', headers: h, body: JSON.stringify(body || {}) })
      .then(function (r) { return r.json().then(function (d) { d._ok = r.ok; return d; }); });
  }

  /* base64url <-> bytes, the currency WebAuthn deals in */
  function fromB64(s) {
    s = String(s).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function toB64(buf) {
    var b = new Uint8Array(buf), s = '';
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  if (!box) return;

  var panes = {};
  Array.prototype.forEach.call(box.querySelectorAll('.auth-pane'), function (p) {
    panes[p.getAttribute('data-pane')] = p;
  });
  function show(name) {
    Object.keys(panes).forEach(function (k) { panes[k].hidden = (k !== name); });
    box.setAttribute('data-state', name);
  }
  function say(el, text, bad) {
    if (!el) return;
    el.textContent = text || '';
    el.className = 'auth-msg' + (text ? (bad ? ' is-bad' : ' is-good') : '');
  }

  var emailIn = document.getElementById('a-email');
  var nameIn = document.getElementById('a-name');
  var msg = document.getElementById('a-msg');
  var codeMsg = document.getElementById('a-code-msg');
  var bioMsg = document.getElementById('a-bio-msg');
  var sendBtn = document.getElementById('a-send');
  var bioBtn = document.getElementById('a-bio');

  var hasWebAuthn = !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create);
  if (hasWebAuthn && bioBtn) bioBtn.hidden = false;
  var unsupported = document.getElementById('a-bio-unsupported');
  if (!hasWebAuthn && unsupported) unsupported.hidden = false;

  /* ---------------------------------------------------- step one: code */
  var startForm = document.getElementById('auth-start-form');
  function sendCode(quiet) {
    var addr = (emailIn.value || '').trim();
    if (!addr) { say(msg, 'An address first.', true); return; }
    if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'Sending…'; }
    post('/api/account-start', Object.assign(
      { email: addr, name: (nameIn && nameIn.value) || '' },
      window.EGCaptcha ? window.EGCaptcha('join') : {}
    ))
      .then(function (d) {
        if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send my code'; }
        if (!d._ok) {
          if (d.captcha && window.EGCaptchaRenew) window.EGCaptchaRenew('join');
          say(quiet ? codeMsg : msg, d.error || 'That did not work.', true);
          return;
        }
        var note = document.getElementById('a-code-note');
        if (note) {
          note.textContent = (d.returning
            ? 'Welcome back. A sign-in code is on its way to ' + addr + '. '
            : 'A code is on its way to ' + addr + '. ') +
            'It lasts fifteen minutes and works once.';
        }
        if (window.EGCaptchaRenew) window.EGCaptchaRenew('join');
        say(codeMsg, quiet ? 'Another code sent.' : '', false);
        show('code');
        var ci = document.getElementById('a-code');
        if (ci) { ci.value = ''; ci.focus(); }
      })
      .catch(function () {
        if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send my code'; }
        say(msg, 'The threshold did not answer. Try again.', true);
      });
  }
  if (startForm) startForm.addEventListener('submit', function (e) { e.preventDefault(); sendCode(false); });
  var again = document.getElementById('a-again');
  if (again) again.addEventListener('click', function () { sendCode(true); });
  var back = document.getElementById('a-back');
  if (back) back.addEventListener('click', function () { say(msg, ''); show('start'); });

  /* ---------------------------------------------------- step two: enter */
  var codeForm = document.getElementById('auth-code-form');
  if (codeForm) codeForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = (document.getElementById('a-code').value || '').replace(/\D/g, '');
    var btn = document.getElementById('a-check');
    if (btn) { btn.disabled = true; btn.textContent = 'Checking…'; }
    post('/api/account-verify', { email: (emailIn.value || '').trim(), code: code })
      .then(function (d) {
        if (btn) { btn.disabled = false; btn.textContent = 'Verify and enter'; }
        if (!d._ok || !d.token) { say(codeMsg, d.error || 'That code was refused.', true); return; }
        setToken(d.token);
        say(codeMsg, '');
        enter(d.member);
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Verify and enter'; }
        say(codeMsg, 'The threshold did not answer.', true);
      });
  });

  /* ------------------------------------------------------- signed in UI */
  function enter(member) {
    var g = document.getElementById('a-greeting');
    var who = document.getElementById('a-who');
    var first = (member && member.name ? String(member.name).split(/\s+/)[0] : '');
    if (g) g.textContent = first ? 'Welcome, ' + first + '.' : 'Welcome.';
    if (who) {
      who.textContent = 'Signed in as ' + (member && member.email ? member.email : 'a verified member') +
        '. This session lasts thirty days unless you end it.';
    }
    show('in');
    loadKeys();
  }

  function loadKeys() {
    var list = document.getElementById('a-keys');
    if (!list) return;
    post('/api/account-me', {}).then(function (d) {
      if (!d.signed_in) { setToken(''); show('start'); return; }
      list.innerHTML = '';
      if (!d.passkeys || !d.passkeys.length) {
        var li = document.createElement('li');
        li.className = 'muted small';
        li.textContent = 'No device enrolled yet.';
        list.appendChild(li);
        return;
      }
      d.passkeys.forEach(function (k) {
        var li = document.createElement('li');
        var span = document.createElement('span');
        span.textContent = k.label || 'A device';
        var drop = document.createElement('button');
        drop.type = 'button';
        drop.className = 'linkish';
        drop.textContent = 'forget';
        drop.addEventListener('click', function () {
          post('/api/account-passkey', { action: 'forget', id: k.id }).then(loadKeys);
        });
        li.appendChild(span);
        li.appendChild(drop);
        list.appendChild(li);
      });
    });
  }

  var out = document.getElementById('a-signout');
  if (out) out.addEventListener('click', function () {
    post('/api/account-signout', {}).catch(function () {}).then(function () {
      setToken('');
      say(msg, 'Signed out. The door is only ever closed, never locked.');
      show('start');
    });
  });

  /* --------------------------------------------- enrol a biometric key */
  function deviceLabel() {
    var u = navigator.userAgent || '';
    if (/iPhone|iPad/.test(u)) return 'iPhone or iPad (Face ID / Touch ID)';
    if (/Macintosh/.test(u)) return 'Mac (Touch ID)';
    if (/Android/.test(u)) return 'Android device (fingerprint)';
    if (/Windows/.test(u)) return 'Windows (Hello)';
    return 'This device';
  }

  var addKey = document.getElementById('a-add-key');
  if (addKey) addKey.addEventListener('click', function () {
    if (!hasWebAuthn) { say(bioMsg, 'This browser has no passkey support.', true); return; }
    addKey.disabled = true;
    say(bioMsg, 'Ask your device…');
    post('/api/account-passkey', { action: 'register-options' })
      .then(function (o) {
        if (!o._ok) throw new Error(o.error || 'The server refused.');
        return navigator.credentials.create({
          publicKey: {
            challenge: fromB64(o.challenge),
            rp: o.rp,
            user: {
              id: fromB64(o.user.id),
              name: o.user.name,
              displayName: o.user.displayName
            },
            pubKeyCredParams: o.pubKeyCredParams,
            authenticatorSelection: o.authenticatorSelection,
            timeout: o.timeout,
            attestation: o.attestation,
            excludeCredentials: (o.excludeCredentials || []).map(function (c) {
              return { type: 'public-key', id: fromB64(c.id) };
            })
          }
        }).then(function (cred) {
          /* getPublicKey() hands us SPKI directly — no CBOR to unpick */
          var spki = cred.response.getPublicKey && cred.response.getPublicKey();
          if (!spki) throw new Error('This device did not offer a readable public key.');
          return post('/api/account-passkey', {
            action: 'register',
            credId: toB64(cred.rawId),
            publicKey: toB64(spki),
            challenge: o.challenge,
            clientDataJSON: toB64(cred.response.clientDataJSON),
            label: deviceLabel()
          });
        });
      })
      .then(function (d) {
        addKey.disabled = false;
        if (!d._ok) { say(bioMsg, d.error || 'The key was not accepted.', true); return; }
        say(bioMsg, d.message || 'Enrolled.');
        loadKeys();
      })
      .catch(function (err) {
        addKey.disabled = false;
        var m = (err && err.name === 'NotAllowedError')
          ? 'The device declined, or the prompt was dismissed.'
          : (err && err.message) || 'The enrolment failed.';
        say(bioMsg, m, true);
      });
  });

  /* ------------------------------------------- sign in with the finger */
  if (bioBtn) bioBtn.addEventListener('click', function () {
    var addr = (emailIn.value || '').trim();
    if (!addr) { say(msg, 'Type your address first, then press this.', true); return; }
    bioBtn.disabled = true;
    say(msg, 'Ask your device…');
    post('/api/account-passkey', { action: 'login-options', email: addr })
      .then(function (o) {
        if (!o._ok) throw new Error(o.error || 'No passkey here.');
        return navigator.credentials.get({
          publicKey: {
            challenge: fromB64(o.challenge),
            rpId: o.rpId,
            timeout: o.timeout,
            userVerification: o.userVerification,
            allowCredentials: (o.allowCredentials || []).map(function (c) {
              return { type: 'public-key', id: fromB64(c.id) };
            })
          }
        }).then(function (as) {
          return post('/api/account-passkey', {
            action: 'login',
            credId: toB64(as.rawId),
            challenge: o.challenge,
            authenticatorData: toB64(as.response.authenticatorData),
            clientDataJSON: toB64(as.response.clientDataJSON),
            signature: toB64(as.response.signature)
          });
        });
      })
      .then(function (d) {
        bioBtn.disabled = false;
        if (!d._ok || !d.token) { say(msg, d.error || 'That was refused.', true); return; }
        setToken(d.token);
        say(msg, '');
        enter(d.member);
      })
      .catch(function (err) {
        bioBtn.disabled = false;
        var m = (err && err.name === 'NotAllowedError')
          ? 'The device declined, or the prompt was dismissed.'
          : (err && err.message) || 'The sign-in failed.';
        say(msg, m, true);
      });
  });

  /* already carrying a session? walk straight in */
  if (token()) {
    post('/api/account-me', {}).then(function (d) {
      if (d && d.signed_in) enter(d.member); else setToken('');
    }).catch(function () {});
  }
})();

/* ------------------------------------------------------------------ *
 * Consent. Nothing is written to the visitor's machine until they say
 * yes. Declining is a real answer: the stores are emptied and the
 * writing helpers refuse from then on.
 * ------------------------------------------------------------------ */
(function () {
  var KEY = 'eg-consent';
  var MINE = ['eg-session', 'eg-thread', 'eg-name', 'eg-draft'];

  function readChoice() {
    try { return localStorage.getItem(KEY) || ''; } catch (e) { return 'declined'; }
  }
  function wipe() {
    try {
      MINE.forEach(function (k) { localStorage.removeItem(k); sessionStorage.removeItem(k); });
    } catch (e) {}
  }

  var consent = {
    choice: function () { return readChoice(); },
    allowed: function () { return readChoice() === 'accepted'; },
    set: function (value) {
      try { localStorage.setItem(KEY, value); } catch (e) {}
      if (value !== 'accepted') wipe();
      document.documentElement.setAttribute('data-consent', value);
    }
  };
  window.EGConsent = consent;
  document.documentElement.setAttribute('data-consent', readChoice() || 'unasked');

  var gate = document.getElementById('cookie-gate');

  function open() {
    if (!gate) return;
    gate.hidden = false;
    requestAnimationFrame(function () { gate.classList.add('is-up'); });
  }
  function close() {
    if (!gate) return;
    gate.classList.remove('is-up');
    setTimeout(function () { gate.hidden = true; }, 420);
  }

  if (gate && !readChoice()) setTimeout(open, 900);

  var yes = document.getElementById('cookie-yes');
  var no = document.getElementById('cookie-no');
  if (yes) yes.addEventListener('click', function () { consent.set('accepted'); close(); });
  if (no) no.addEventListener('click', function () { consent.set('declined'); close(); });

  var reopen = document.getElementById('cookie-reopen');
  if (reopen) reopen.addEventListener('click', function () {
    open();
    if (gate) gate.scrollIntoView({ block: 'nearest' });
  });
})();

/* ------------------------------------------------------------------ *
 * Arrivals. An image or a clip can take minutes, by which time the
 * asker has usually looked away. Say so when one lands: a note in the
 * corner, the tab title flashing, and a soft pair of notes.
 * ------------------------------------------------------------------ */
(function () {
  var realTitle = document.title;
  var flashing = null;
  var tray = null;

  function titleFlash(text) {
    if (!document.hidden) return;
    var on = false;
    clearInterval(flashing);
    flashing = setInterval(function () {
      on = !on;
      document.title = on ? text : realTitle;
    }, 1100);
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { clearInterval(flashing); document.title = realTitle; }
  });

  /* Two soft notes, synthesised — no file to fetch, no autoplay of media. */
  function chime() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      [[528, 0], [792, 0.17]].forEach(function (pair) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = pair[0];
        var t = ctx.currentTime + pair[1];
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.09, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 1);
      });
      setTimeout(function () { if (ctx.close) ctx.close(); }, 2200);
    } catch (e) { /* silence is an acceptable failure */ }
  }

  function note(text, node) {
    if (!tray) {
      tray = document.createElement('div');
      tray.className = 'arrival-tray';
      tray.setAttribute('aria-live', 'polite');
      document.body.appendChild(tray);
    }
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'arrival';
    el.innerHTML = '<span class="arrival-mark" aria-hidden="true">✦</span><span>' +
      String(text).replace(/[&<>]/g, '') + '</span>';
    el.addEventListener('click', function () {
      if (node && node.scrollIntoView) node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      el.remove();
    });
    tray.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-up'); });
    setTimeout(function () {
      el.classList.remove('is-up');
      setTimeout(function () { el.remove(); }, 500);
    }, 9000);
  }

  /* kind: 'image' | 'video' | 'oracle-image'; node: the card that arrived */
  window.EGArrived = function (kind, node, how) {
    var words = {
      image: 'Your image is ready.',
      video: 'Your clip has finished filming.',
      'oracle-image': 'The oracle drew something for you.',
      'oracle-video': 'The oracle\u2019s clip has arrived.'
    };
    var text = words[kind] || 'Something new has arrived.';
    if (how) text += ' ' + how;

    if (node) {
      node.classList.add('just-arrived');
      setTimeout(function () { node.classList.remove('just-arrived'); }, 4000);
      if (!document.hidden) {
        var box = node.getBoundingClientRect();
        var seen = box.top < window.innerHeight && box.bottom > 0;
        if (!seen) node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
    note(text, node);
    titleFlash('\u2726 ' + text);
    chime();
  };
})();

/* ------------------------------------------------------------------ *
 * The letter to Ed. Posts to /api/letter, which stores it, forwards it
 * and sends the asker an acknowledgement by return of post.
 * ------------------------------------------------------------------ */
(function () {
  var form = document.getElementById('letter-form');
  if (!form) return;
  var btn = document.getElementById('letter-send');
  var msg = document.getElementById('letter-msg');

  function say(text, bad) {
    if (!msg) return;
    msg.textContent = text || '';
    msg.className = 'auth-msg' + (text ? (bad ? ' is-bad' : ' is-good') : '');
  }
  function field(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (btn) { btn.disabled = true; btn.textContent = 'Sending\u2026'; }
    say('');
    fetch('/api/letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({
        name: field('name'),
        email: field('email'),
        topic: field('topic'),
        question: field('question'),
        public: field('public'),
        website: field('website')
      }, window.EGCaptcha ? window.EGCaptcha('letter') : {}))
    })
      .then(function (r) { return r.json().then(function (d) { d._ok = r.ok; return d; }); })
      .then(function (d) {
        if (btn) { btn.disabled = false; btn.textContent = 'Send the Question'; }
        if (window.EGCaptchaRenew) window.EGCaptchaRenew('letter');
        if (!d._ok) { say(d.error || 'The letter was refused.', true); return; }
        say(d.message || 'Your letter is in the pile.');
        var q = document.getElementById('question');
        if (q) q.value = '';
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Send the Question'; }
        say('The post did not go through \u2014 email info@shakra.co.uk instead.', true);
      });
  });
})();

/* ------------------------------------------------------------------ *
 * One place that knows how to speak to a protected endpoint.
 * ------------------------------------------------------------------ */
(function () {
  window.EGAuthToken = function () {
    try { return localStorage.getItem('eg-session') || window.__egTok || ''; }
    catch (e) { return window.__egTok || ''; }
  };
  window.EGAuthHeaders = function () {
    var h = { 'content-type': 'application/json' };
    var t = window.EGAuthToken();
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  };
  /* Members-only state, fetched once per page and shared. */
  var cached = null;
  window.EGStudio = function () {
    if (cached) return cached;
    cached = fetch('/api/account-me', { method: 'POST', headers: window.EGAuthHeaders(), body: '{}' })
      .then(function (r) { return r.json(); })
      .catch(function () { return { signed_in: false, studio: false }; });
    return cached;
  };
})();

/* ------------------------------------------------------------------ *
 * The studio door, as the visitor meets it. The image and video panels
 * stay shuttered until the account is signed in, the address confirmed
 * and the age and identity check passed. The server enforces the same
 * thing; this is only so nobody wastes a prompt finding out.
 * ------------------------------------------------------------------ */
(function () {
  var panels = [
    { el: document.getElementById('draw-box'), noun: 'Image generation' },
    { el: document.getElementById('film-box'), noun: 'Video generation' }
  ].filter(function (p) { return p.el; });
  if (!panels.length) return;

  var WORDS = {
    signin: {
      head: 'Members only',
      body: 'The generators are open to signed-in members who are over eighteen and have passed the ' +
            'identity check. Everything else here — the oracle, every page, every answer — stays open ' +
            'to everyone, and always will.',
      cta: 'Sign in or create an account'
    },
    verify: {
      head: 'Confirm your address',
      body: 'Your account exists but the address has not been confirmed yet. Enter the six-digit code we ' +
            'emailed you and the studio opens.',
      cta: 'Enter my code'
    },
    identity: {
      head: 'Age and identity check needed',
      body: 'Making images and video needs proof of age. There are two ways through: let the camera ' +
            'look at your face, which takes seconds and keeps nothing, or show a government-issued ' +
            'document, which always works. Asked once, and never shown on the site.',
      cta: 'Pass the check'
    }
  };

  function shutter(panel, state) {
    var w = WORDS[state] || WORDS.signin;
    var form = panel.el.querySelector('form');
    var out = panel.el.querySelector('.draw-out');
    if (form) form.hidden = true;
    if (out) out.hidden = true;
    panel.el.classList.add('is-shut');

    var gate = document.createElement('div');
    gate.className = 'studio-gate';
    gate.innerHTML =
      '<p class="gate-mark" aria-hidden="true">&#9737;</p>' +
      '<h4>' + w.head + '</h4>' +
      '<p class="muted small">' + w.body + '</p>' +
      '<p><a class="btn" href="/join/">' + w.cta + '</a></p>' +
      '<p class="muted xsmall">' + panel.noun + ' is gated because a generator can be made to produce ' +
      'things a person should be accountable for. The check puts a name behind every prompt. ' +
      'Nothing is checked, and no account is needed, to talk to the oracle.</p>';
    var anchor = form || out || panel.el.lastElementChild;
    panel.el.insertBefore(gate, anchor);
  }

  function open(panel) {
    panel.el.classList.remove('is-shut');
    var g = panel.el.querySelector('.studio-gate');
    if (g) g.remove();
    var form = panel.el.querySelector('form');
    var out = panel.el.querySelector('.draw-out');
    if (form) form.hidden = false;
    if (out) out.hidden = false;
  }

  /* Shut by default, so a slow reply never leaves the door ajar. */
  panels.forEach(function (p) { shutter(p, 'signin'); });

  window.EGStudio().then(function (me) {
    var state = !me || !me.signed_in ? 'signin'
      : (!me.member || !me.member.verified) ? 'verify'
      : me.studio ? 'open' : 'identity';
    panels.forEach(function (p) {
      if (state === 'open') { open(p); return; }
      var g = p.el.querySelector('.studio-gate');
      if (g) g.remove();
      shutter(p, state);
    });
  });
})();

/* ------------------------------------------------------------------ *
 * The age and identity check on the Join page.
 * ------------------------------------------------------------------ */
(function () {
  var form = document.getElementById('id-form');
  if (!form) return;
  var msg = document.getElementById('i-msg');
  var state = document.getElementById('a-id-state');
  var btn = document.getElementById('i-send');
  var fileIn = document.getElementById('i-doc');
  var preview = document.getElementById('i-preview');
  var carried = null;

  function say(text, bad) {
    if (!msg) return;
    msg.textContent = text || '';
    msg.className = 'auth-msg' + (text ? (bad ? ' is-bad' : ' is-good') : '');
  }

  function passed(member) {
    form.hidden = true;
    if (state) {
      state.innerHTML = '<strong class="gate-open">The studio is open to you.</strong> ' +
        'Checked' + (member && member.legal_name ? ' as ' + member.legal_name : '') +
        '. Image and video generation are unlocked on the <a href="/ask-ed/">Ask Ed</a> page.';
    }
  }

  /* Read the document once, as a data URL, so the post is a single JSON body. */
  if (fileIn) fileIn.addEventListener('change', function () {
    var f = fileIn.files && fileIn.files[0];
    carried = null;
    if (!f) { if (preview) preview.textContent = ''; return; }
    if (f.size > 6 * 1024 * 1024) {
      say('That image is over 6 MB. A normal phone photo is plenty.', true);
      fileIn.value = '';
      return;
    }
    var r = new FileReader();
    r.onload = function () {
      carried = r.result;
      if (preview) {
        preview.textContent = f.name + ' \u00b7 ' + Math.round(f.size / 1024) + ' KB \u00b7 held in this ' +
          'page only until you submit.';
      }
      say('');
    };
    r.onerror = function () { say('That file could not be read.', true); };
    r.readAsDataURL(f);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!carried) { say('Attach a photograph of the document.', true); return; }
    var dec = document.getElementById('i-declare');
    if (!dec || !dec.checked) { say('The declaration has to be ticked.', true); return; }

    if (btn) { btn.disabled = true; btn.textContent = 'Checking\u2026'; }
    say('');
    fetch('/api/account-identity', {
      method: 'POST',
      headers: window.EGAuthHeaders(),
      body: JSON.stringify({
        action: 'submit',
        legal_name: document.getElementById('i-legal').value,
        dob: document.getElementById('i-dob').value,
        country: document.getElementById('i-country').value,
        doc_type: document.getElementById('i-doc-type').value,
        doc: carried,
        declaration: true
      })
    })
      .then(function (r) { return r.json().then(function (d) { d._ok = r.ok; return d; }); })
      .then(function (d) {
        if (btn) { btn.disabled = false; btn.textContent = 'Submit the check'; }
        if (!d._ok) { say(d.error || 'The check did not pass.', true); return; }
        carried = null;
        say(d.message || 'Checked.');
        passed({ legal_name: document.getElementById('i-legal').value });
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Submit the check'; }
        say('The check could not be sent. Try again.', true);
      });
  });

  /* Already checked? Do not ask again. */
  if (window.EGStudio) window.EGStudio().then(function (me) {
    if (me && me.studio) passed(me.member);
  });
})();

/* ------------------------------------------------------------------ *
 * The face scan. Phone camera or webcam, three frames, no upload until
 * the button is pressed, nothing kept afterwards.
 * ------------------------------------------------------------------ */
(function () {
  var box = document.getElementById('scan-box');
  if (!box) return;

  var video = document.getElementById('scan-video');
  var ring = document.getElementById('scan-ring');
  var hint = document.getElementById('scan-hint');
  var msg = document.getElementById('scan-msg');
  var startBtn = document.getElementById('scan-start');
  var shootBtn = document.getElementById('scan-shoot');
  var stopBtn = document.getElementById('scan-stop');
  var stream = null;

  var canCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  if (!canCamera) {
    var un = document.getElementById('scan-unsupported');
    if (un) un.hidden = false;
    if (startBtn) startBtn.disabled = true;
  }

  function say(text, bad) {
    if (!msg) return;
    msg.textContent = text || '';
    msg.className = 'auth-msg' + (text ? (bad ? ' is-bad' : ' is-good') : '');
  }

  function stop() {
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }
    if (video) { video.srcObject = null; video.hidden = true; }
    if (ring) ring.hidden = true;
    if (shootBtn) shootBtn.hidden = true;
    if (stopBtn) stopBtn.hidden = true;
    if (startBtn) { startBtn.hidden = false; startBtn.disabled = !canCamera; }
  }

  if (startBtn) startBtn.addEventListener('click', function () {
    say('Asking for the camera\u2026');
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 960 } },
      audio: false
    }).then(function (s) {
      stream = s;
      video.srcObject = s;
      video.hidden = false;
      if (ring) ring.hidden = false;
      startBtn.hidden = true;
      shootBtn.hidden = false;
      stopBtn.hidden = false;
      say('');
      if (hint) hint.textContent = 'Look straight at the lens, keep still, and press the button.';
      return video.play().catch(function () {});
    }).catch(function (err) {
      var m = (err && err.name === 'NotAllowedError')
        ? 'The camera was refused. Allow it in the address bar, or use the document check below.'
        : 'No camera could be opened. The document check below always works.';
      say(m, true);
    });
  });

  if (stopBtn) stopBtn.addEventListener('click', function () { stop(); say('Camera off.'); });

  /* One frame, square, downscaled to something a vision model will read. */
  function frame() {
    var w = video.videoWidth, h = video.videoHeight;
    if (!w || !h) return null;
    var side = Math.min(w, h);
    var size = 640;
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var ctx = c.getContext('2d');
    ctx.drawImage(video, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
    return c.toDataURL('image/jpeg', 0.86);
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------------------------------------------------------------- *
   * The reader. A published face model, fetched from a CDN and run
   * entirely in this page: the camera frames never leave the browser
   * to produce the estimate. No key, no account with anyone, no call
   * to a model company. If it will not load we fall back to asking the
   * server, and failing that, to the document.
   * ---------------------------------------------------------------- */
  var FACE_LIB = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.esm.js';
  var FACE_MODELS = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
  var api = null;
  var loading = null;

  function loadReader() {
    if (api) return Promise.resolve(api);
    if (loading) return loading;
    loading = import(FACE_LIB)
      .then(function (mod) {
        var f = mod.default || mod;
        return Promise.all([
          f.nets.tinyFaceDetector.loadFromUri(FACE_MODELS),
          f.nets.ageGenderNet.loadFromUri(FACE_MODELS)
        ]).then(function () { api = f; return f; });
      })
      .catch(function (err) {
        loading = null;
        throw new Error('The face reader would not load: ' + ((err && err.message) || 'blocked'));
      });
    return loading;
  }

  /* Take several readings and use the median — a single frame is noisy. */
  function readAge(samples) {
    return loadReader().then(function (f) {
      var opts = new f.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 });
      var ages = [];
      var faces = 0;
      var chain = Promise.resolve();
      for (var i = 0; i < samples; i++) {
        chain = chain.then(function () {
          return f.detectAllFaces(video, opts).withAgeAndGender().then(function (found) {
            if (found && found.length) {
              faces = Math.max(faces, found.length);
              found.sort(function (a, b) { return b.detection.box.area - a.detection.box.area; });
              ages.push(found[0].age);
            }
            return wait(260);
          });
        });
      }
      return chain.then(function () {
        if (!ages.length) return { face: false, faces: 0, samples: samples };
        ages.sort(function (a, b) { return a - b; });
        var mid = ages[Math.floor(ages.length / 2)];
        return {
          face: true,
          faces: faces,
          age: Math.round(mid),
          low: Math.round(ages[0]),
          high: Math.round(ages[ages.length - 1]),
          samples: ages.length,
          /* tight spread across frames means a steady reading */
          confidence: Math.max(0.35, Math.min(0.95, 1 - (ages[ages.length - 1] - ages[0]) / 24)),
          model: 'face-api/age_gender'
        };
      });
    });
  }

  if (shootBtn) shootBtn.addEventListener('click', function () {
    if (!stream) return;
    shootBtn.disabled = true;
    var shots = [];

    say('Hold still \u2014 reading your face in this browser\u2026');
    if (ring) ring.classList.add('is-reading');
    var local = null;

    /* Three frames a third of a second apart: a still photograph held up to
       the lens tends to give itself away across them. */
    frame() && shots.push(frame());
    wait(350)
      .then(function () { var f = frame(); if (f) shots.push(f); return wait(350); })
      .then(function () { var f = frame(); if (f) shots.push(f); })
      .then(function () {
        if (!shots.length) throw new Error('The camera gave no picture.');
        /* The estimate happens here, in the page, before anything is sent. */
        return readAge(7).catch(function (err) {
          say((err && err.message) || 'The face reader would not load.', true);
          return null;
        });
      })
      .then(function (reading) {
        local = reading;
        if (reading && reading.face === false) {
          throw new Error('No face found in the frame. Fill the oval with your head, ' +
            'face a window, and try again.');
        }
        if (reading && reading.age) {
          say('Read as about ' + reading.age + ' \u2014 confirming\u2026');
        } else {
          say('Sending the frames to be read\u2026');
        }
        return fetch('/api/account-face', {
          method: 'POST',
          headers: window.EGAuthHeaders(),
          body: JSON.stringify({ frames: shots.slice(0, 3), client_estimate: local })
        });
      })
      .then(function (r) { return r.json().then(function (d) { d._ok = r.ok; return d; }); })
      .then(function (d) {
        shots.length = 0;                       /* drop the frames on this side too */
        shootBtn.disabled = false;
        if (ring) ring.classList.remove('is-reading');

        if (d.ok) {
          stop();
          say(d.message || 'Checked. The studio is open.');
          box.classList.add('is-passed');
          var form = document.getElementById('id-form');
          var or = document.querySelector('.scan-or');
          if (form) form.hidden = true;
          if (or) or.hidden = true;
          var state = document.getElementById('a-id-state');
          if (state) {
            state.innerHTML = '<strong class="gate-open">The studio is open to you.</strong> ' +
              'Age confirmed by face scan' + (d.estimated ? ' \u00b7 read as about ' + d.estimated : '') +
              '. Image and video generation are unlocked on the <a href="/ask-ed/">Ask Ed</a> page.';
          }
          return;
        }

        say(d.message || d.error || 'The scan did not settle it.', !d.inconclusive ? true : false);
        if (d.fallback === 'document') {
          stop();
          var f2 = document.getElementById('id-form');
          if (f2) {
            f2.scrollIntoView({ block: 'center', behavior: 'smooth' });
            f2.classList.add('is-wanted');
            setTimeout(function () { f2.classList.remove('is-wanted'); }, 3000);
          }
        }
      })
      .catch(function (err) {
        shootBtn.disabled = false;
        if (ring) ring.classList.remove('is-reading');
        say((err && err.message) || 'The reading failed. Try again, or use the document check.', true);
      });
  });

  window.addEventListener('pagehide', stop);

  /* Already checked? Put the camera away before it is ever opened. */
  if (window.EGStudio) window.EGStudio().then(function (me) {
    if (me && me.studio) { box.hidden = true; var or = document.querySelector('.scan-or'); if (or) or.hidden = true; }
  });
})();

/* ------------------------------------------------------------------ *
 * The gate-word. Self-hosted, drawn as SVG on the server, no third
 * party told who is knocking. window.EGCaptcha(name) hands back the
 * token and the typed answer; .renew(name) draws a fresh one.
 * ------------------------------------------------------------------ */
(function () {
  var boxes = {};

  function fetchWord(box) {
    var art = box.querySelector('[data-captcha-art]');
    if (art) art.innerHTML = '<span class="captcha-wait">drawing\u2026</span>';
    box.dataset.token = '';
    return fetch('/api/captcha')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.svg) throw new Error('no word');
        box.dataset.token = d.token;
        if (art) art.innerHTML = d.svg;
      })
      .catch(function () {
        if (art) art.innerHTML = '<span class="captcha-wait">The gate-word could not be drawn. ' +
          'Press the arrow to try again.</span>';
      });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-captcha]'), function (box) {
    boxes[box.getAttribute('data-captcha')] = box;
    fetchWord(box);
    var again = box.querySelector('[data-captcha-new]');
    if (again) again.addEventListener('click', function () {
      var input = box.querySelector('[data-captcha-input]');
      if (input) input.value = '';
      fetchWord(box);
    });
    /* Typing it in upper case is kinder to read back. */
    var input = box.querySelector('[data-captcha-input]');
    if (input) input.addEventListener('input', function () {
      var at = input.selectionStart;
      input.value = input.value.toUpperCase();
      try { input.setSelectionRange(at, at); } catch (e) {}
    });
  });

  window.EGCaptcha = function (name) {
    var box = boxes[name];
    if (!box) return {};
    var input = box.querySelector('[data-captcha-input]');
    return {
      captcha_token: box.dataset.token || '',
      captcha: (input && input.value) || ''
    };
  };
  window.EGCaptchaRenew = function (name) {
    var box = boxes[name];
    if (!box) return;
    var input = box.querySelector('[data-captcha-input]');
    if (input) input.value = '';
    fetchWord(box);
  };
})();

/* ------------------------------------------------------------------ *
 * The head's sign-in link knows whether you are already inside.
 * ------------------------------------------------------------------ */
(function () {
  var link = document.getElementById('head-join');
  if (!link || !window.EGStudio) return;
  window.EGStudio().then(function (me) {
    if (!me || !me.signed_in) return;

    /* The chip says who you are, not what your address is. An email address
       printed into the furniture of every page is a small privacy leak — it
       is on screen in every screenshot, every shared tab and every projector
       — and it is never the thing the reader needs. The address lives on the
       account page, where you went to look for it. */
    var member = me.member || {};
    var name = String(member.name || '').trim();
    var label = name ? name.split(/\s+/)[0] : '';
    if (!label) {
      /* No name on the register yet — fall back to the address's local part,
         which is a handle rather than a contactable address. */
      var local = String(member.email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
      label = local ? local.charAt(0).toUpperCase() + local.slice(1) : 'Member';
    }

    link.classList.add('is-in');
    link.href = '/account/';
    link.setAttribute('title', name ? 'Logged in as ' + name : 'Your account');
    var mark = link.querySelector('.head-join-mark');
    if (mark) mark.textContent = '\u2726';
    var text = link.querySelector('.head-join-text');
    if (text) {
      text.classList.add('head-join-addr');
      text.textContent = '';
      var lead = document.createElement('span');
      lead.className = 'head-join-lead';
      lead.textContent = 'Logged in as';
      var who = document.createElement('span');
      who.className = 'head-join-who';
      who.textContent = label;
      text.appendChild(lead);
      text.appendChild(who);
    }
  }).catch(function () {});
})();

/* ------------------------------------------------------------------ *
 * The register — your own page.
 * ------------------------------------------------------------------ */
(function () {
  var wait = document.getElementById('acct-wait');
  if (!wait) return;
  var out = document.getElementById('acct-out');
  var none = document.getElementById('acct-none');

  function when(value) {
    if (!value) return '—';
    var d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function row(dl, term, detail) {
    var dt = document.createElement('dt');
    dt.textContent = term;
    var dd = document.createElement('dd');
    if (detail && detail.nodeType) dd.appendChild(detail); else dd.textContent = detail;
    dl.appendChild(dt);
    dl.appendChild(dd);
  }

  window.EGStudio().then(function (me) {
    wait.hidden = true;
    if (!me || !me.signed_in) { if (none) none.hidden = false; return; }
    if (out) out.hidden = false;

    var m = me.member || {};
    var nameEl = document.getElementById('acct-name');
    var mailEl = document.getElementById('acct-email');
    if (nameEl) nameEl.textContent = m.name || m.legal_name || 'Member of the order';
    if (mailEl) mailEl.textContent = m.email || '';

    var dl = document.getElementById('acct-grid');
    if (dl) {
      dl.innerHTML = '';
      row(dl, 'Joined', when(m.joined));
      row(dl, 'Address', m.verified ? 'Confirmed' : 'Not confirmed yet');
      row(dl, 'Signed in by', me.method === 'passkey' ? 'Passkey — face, finger or PIN' : 'Emailed code');
      row(dl, 'This session ends', when(me.session && me.session.expires));
      row(dl, 'Devices signed in', String((me.counts && me.counts.sessions) || 1));
      row(dl, 'Letters to Ed', String((me.counts && me.counts.letters) || 0));
      if (m.legal_name) row(dl, 'Checked as', m.legal_name);
    }

    var studio = document.getElementById('acct-studio');
    if (studio) {
      if (me.studio) {
        var how = m.id_doc_type === 'face-scan' ? 'a face scan' : 'a document';
        studio.innerHTML = '<strong class="gate-open">Open to you.</strong> Age confirmed by ' + how +
          (m.checked ? ' on ' + when(m.checked) : '') +
          '. Image and video generation are unlocked on the <a href="/ask-ed/">Ask Ed</a> page.';
      } else if (!m.verified) {
        studio.innerHTML = 'Shut. Confirm your address first — <a href="/join/">enter the code</a>.';
      } else {
        studio.innerHTML = 'Shut. The generators need an age check: a look at your face, or a document. ' +
          '<a href="/join/">Pass the check</a> and it opens at once. Everything else here is already yours.';
      }
    }

    /* the mailing list */
    var listNote = document.getElementById('acct-list');
    var listBtn = document.getElementById('acct-list-btn');
    var listMsg = document.getElementById('acct-list-msg');

    function paintList(on) {
      if (listNote) {
        listNote.innerHTML = on
          ? '<strong class="gate-open">You are on the list.</strong> New pages, the podcast, and the ' +
            'occasional long letter. Every one of them carries the way out at its foot.'
          : 'You are <strong>off the list</strong>. You will still get post you actually asked for — a ' +
            'sign-in code, or a reply to a letter you sent Ed.';
      }
      if (listBtn) listBtn.textContent = on ? 'Leave the list' : 'Rejoin the list';
    }
    var on = m.subscribed !== false;
    paintList(on);

    if (listBtn) listBtn.addEventListener('click', function () {
      listBtn.disabled = true;
      fetch('/api/unsubscribe', {
        method: 'POST',
        headers: window.EGAuthHeaders(),
        body: JSON.stringify({ on: !on })
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          listBtn.disabled = false;
          if (d && d.ok) {
            on = Boolean(d.subscribed);
            paintList(on);
            if (listMsg) { listMsg.textContent = d.message || ''; listMsg.className = 'auth-msg is-good'; }
          } else if (listMsg) {
            listMsg.textContent = (d && d.error) || 'That did not take.';
            listMsg.className = 'auth-msg is-bad';
          }
        })
        .catch(function () {
          listBtn.disabled = false;
          if (listMsg) { listMsg.textContent = 'That did not take.'; listMsg.className = 'auth-msg is-bad'; }
        });
    });

    var keys = document.getElementById('acct-keys');
    if (keys) {
      keys.innerHTML = '';
      if (!me.passkeys || !me.passkeys.length) {
        var li = document.createElement('li');
        li.className = 'muted small';
        li.textContent = 'No passkey enrolled — you sign in with an emailed code.';
        keys.appendChild(li);
      } else {
        me.passkeys.forEach(function (k) {
          var li2 = document.createElement('li');
          var a = document.createElement('span');
          a.textContent = k.label || 'A device';
          var b = document.createElement('span');
          b.className = 'muted xsmall';
          b.textContent = k.last_used ? 'last used ' + when(k.last_used) : 'added ' + when(k.created_at);
          li2.appendChild(a);
          li2.appendChild(b);
          keys.appendChild(li2);
        });
      }
    }
  }).catch(function () {
    wait.hidden = true;
    if (none) none.hidden = false;
  });

  var signOut = document.getElementById('acct-out-btn');
  if (signOut) signOut.addEventListener('click', function () {
    fetch('/api/account-signout', { method: 'POST', headers: window.EGAuthHeaders(), body: '{}' })
      .catch(function () {})
      .then(function () {
        try { localStorage.removeItem('eg-session'); } catch (e) {}
        window.__egTok = '';
        window.location.href = '/join/';
      });
  });
})();

/* ------------------------------------------------------------------ *
 * The cutting room.
 *
 * Clips generated on this page collect here and are edited into one
 * film entirely in the browser: each shot is drawn onto a canvas in
 * real time while a MediaRecorder captures the canvas stream. No
 * upload, no service, no ffmpeg — and no audio, because the models
 * make none.
 * ------------------------------------------------------------------ */
(function () {
  var box = document.getElementById('montage-box');
  if (!box) return;

  var list = document.getElementById('shot-list');
  var renderBtn = document.getElementById('m-render');
  var clearBtn = document.getElementById('m-clear');
  var msg = document.getElementById('m-msg');
  var out = document.getElementById('montage-out');
  var transEl = document.getElementById('m-transition');
  var shapeEl = document.getElementById('m-shape');

  var shots = [];
  var busy = false;

  function say(text, bad) {
    msg.textContent = text || '';
    msg.className = 'auth-msg' + (text ? (bad ? ' is-bad' : ' is-good') : '');
  }

  /* ----------------------------------------------------------- shots */

  var STILL = 3;   // seconds a still picture holds in the cut

  window.EGMontageAdd = function (url, prompt, kind, meta) {
    if (!url || shots.some(function (s) { return s.url === url; })) return;
    meta = meta || {};

    /* A still is a shot too. It holds for three seconds and takes the same
       transitions, which is also what makes it a usable starting frame: a
       picture you liked becomes the first frame of the clip that follows. */
    if (kind === 'image') {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      var still = {
        url: url, prompt: prompt || 'A picture', kind: 'image', image: img,
        in: 0, out: STILL, duration: STILL, id: meta.id || null,
        sheet: meta.sheet || null, seed: meta.seed || null
      };
      img.addEventListener('load', paint);
      shots.push(still);
      paint();
      return;
    }

    var v = document.createElement('video');
    v.src = url;
    v.crossOrigin = 'anonymous';
    v.preload = 'metadata';
    v.muted = true;
    v.playsInline = true;
    var shot = {
      url: url, prompt: prompt || 'A clip', kind: 'video', video: v,
      in: 0, out: null, duration: null, id: meta.id || null,
      sheet: meta.sheet || null, seed: meta.seed || null
    };
    v.addEventListener('loadedmetadata', function () {
      shot.duration = v.duration;
      if (shot.out === null) shot.out = v.duration;
      paint();
    });
    shots.push(shot);
    paint();
  };

  /* ------------------------------------------------- extending a shot
   *
   * Pick a shot and the next generation grows out of it. Three things
   * travel across, strongest first:
   *
   *   1. the frame itself. For a clip it is read off a canvas at the out
   *      point, for a still it is the picture; either way it is uploaded and
   *      handed to the model as the literal first frame where the route
   *      supports image-to-video.
   *   2. the seed, so the noise does not change underneath the world.
   *   3. the continuity sheet — the exact words that described the
   *      characters, the setting, the camera, the light and the stock.
   *
   * If the browser cannot read the frame (a clip served without permissive
   * CORS headers taints the canvas) the page says so rather than pretending,
   * and the other two locks still apply.
   */
  function grabFrame(shot) {
    return new Promise(function (resolve) {
      try {
        var W = 848, H = 480;
        var canvas = document.createElement('canvas');
        var src = shot.kind === 'image' ? shot.image : shot.video;

        var paintIt = function () {
          var sw = src.videoWidth || src.naturalWidth;
          var sh = src.videoHeight || src.naturalHeight;
          if (!sw || !sh) return resolve(null);
          canvas.width = sw; canvas.height = sh;
          canvas.getContext('2d').drawImage(src, 0, 0, sw, sh);
          try { resolve(canvas.toDataURL('image/jpeg', 0.92)); }
          catch (e) { resolve(null); }          // tainted canvas
        };

        if (shot.kind === 'image') {
          if (src.complete) paintIt();
          else { src.addEventListener('load', paintIt); src.addEventListener('error', function () { resolve(null); }); }
          return;
        }

        var at = Math.max(0, (shot.out || shot.duration || 1) - 0.08);
        var done = function () { src.removeEventListener('seeked', done); paintIt(); };
        src.addEventListener('seeked', done);
        try { src.currentTime = at; } catch (e) { resolve(null); }
        setTimeout(function () { resolve(null); }, 4000);
      } catch (e) { resolve(null); }
    });
  }

  async function extendFrom(shot, index) {
    if (!window.EGExtendFrom) return;
    say('Reading the frame\u2026');
    var dataUrl = await grabFrame(shot);
    var hosted = null;

    if (dataUrl) {
      try {
        var res = await fetch('/api/upload', {
          method: 'POST',
          headers: window.EGAuthHeaders ? window.EGAuthHeaders() : { 'content-type': 'application/json' },
          body: JSON.stringify({ name: 'frame.jpg', type: 'image/jpeg', data: dataUrl })
        });
        var out = await res.json().catch(function () { return {}; });
        if (res.ok && out.url) hosted = out.url;
      } catch (e) { /* the words and the seed will have to carry it */ }
    }

    window.EGExtendFrom({
      id: shot.id || null,
      index: index + 1,
      frame: hosted,
      thumb: dataUrl || (shot.kind === 'image' ? shot.url : null),
      sheet: shot.sheet || null,
      seed: shot.seed || null,
      carried: shot.prompt
    });
    say(hosted
      ? 'Shot ' + (index + 1) + ' is the starting frame. Say what happens next.'
      : 'That clip\u2019s frame could not be read in the browser, so the description and the seed will carry it. Say what happens next.',
      !hosted);
  }

  function total() {
    return shots.reduce(function (n, s) {
      return n + Math.max(0, (s.out || 0) - (s.in || 0));
    }, 0);
  }

  function paint() {
    list.innerHTML = '';
    if (!shots.length) {
      var li = document.createElement('li');
      li.className = 'shot-empty';
      li.textContent = 'No shots yet. Draw a picture or film a clip above and it lands here \u2014 ' +
        'then any shot can be continued from, so the next one keeps the same characters.';
      list.appendChild(li);
      renderBtn.disabled = true;
      if (clearBtn) clearBtn.hidden = true;
      return;
    }
    if (clearBtn) clearBtn.hidden = false;
    renderBtn.disabled = busy || shots.length < 1;

    shots.forEach(function (s, i) {
      var li = document.createElement('li');
      li.className = 'shot';

      var thumb;
      if (s.kind === 'image') {
        thumb = document.createElement('img');
        thumb.src = s.url;
        thumb.alt = String(s.prompt).slice(0, 80);
        thumb.className = 'shot-thumb';
      } else {
        thumb = document.createElement('video');
        thumb.src = s.url + '#t=0.5';
        thumb.className = 'shot-thumb';
        thumb.muted = true;
        thumb.playsInline = true;
        thumb.preload = 'metadata';
      }

      var body = document.createElement('div');
      body.className = 'shot-body';

      var head = document.createElement('p');
      head.className = 'shot-name';
      head.textContent = (i + 1) + '. ' + (s.kind === 'image' ? '\u25a3 ' : '\u25b6 ') +
        String(s.prompt).slice(0, 90);
      body.appendChild(head);

      var ext = document.createElement('button');
      ext.type = 'button';
      ext.className = 'btn btn--ghost btn--small shot-extend';
      ext.textContent = s.kind === 'image' ? 'Film on from this picture' : 'Continue from this shot';
      ext.title = 'Carry the characters, the setting and the camera into the next generation';
      ext.addEventListener('click', function () { extendFrom(s, i); });
      body.appendChild(ext);

      if (s.kind === 'image') {
        var hold = document.createElement('div');
        hold.className = 'shot-trim';
        hold.innerHTML = '<label>Hold <input type="number" min="0.5" step="0.5" value="' +
          s.out.toFixed(1) + '"></label><span class="muted xsmall">seconds on screen</span>';
        var hi = hold.querySelector('input');
        hi.addEventListener('change', function () {
          s.out = Math.max(0.5, Number(hi.value) || STILL);
          s.duration = s.out;
          paint();
        });
        body.appendChild(hold);
      } else if (s.duration) {
        var trim = document.createElement('div');
        trim.className = 'shot-trim';
        trim.innerHTML =
          '<label>In <input type="number" min="0" step="0.1" value="' + s.in.toFixed(1) + '"></label>' +
          '<label>Out <input type="number" min="0.1" step="0.1" value="' + s.out.toFixed(1) + '"></label>' +
          '<span class="muted xsmall">of ' + s.duration.toFixed(1) + 's</span>';
        var ins = trim.querySelectorAll('input');
        ins[0].addEventListener('change', function () {
          s.in = Math.max(0, Math.min(Number(ins[0].value) || 0, (s.out || 0) - 0.2));
          paint();
        });
        ins[1].addEventListener('change', function () {
          s.out = Math.min(s.duration, Math.max(Number(ins[1].value) || 0, s.in + 0.2));
          paint();
        });
        body.appendChild(trim);
      }

      var tools = document.createElement('div');
      tools.className = 'shot-tools';
      [['▲', 'Earlier', -1], ['▼', 'Later', 1]].forEach(function (b) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'shot-btn';
        btn.textContent = b[0];
        btn.title = b[1];
        btn.addEventListener('click', function () {
          var j = i + b[2];
          if (j < 0 || j >= shots.length) return;
          var tmp = shots[i]; shots[i] = shots[j]; shots[j] = tmp;
          paint();
        });
        tools.appendChild(btn);
      });
      var drop = document.createElement('button');
      drop.type = 'button';
      drop.className = 'shot-btn';
      drop.textContent = '✕';
      drop.title = 'Take it out';
      drop.addEventListener('click', function () { shots.splice(i, 1); paint(); });
      tools.appendChild(drop);

      li.appendChild(thumb);
      li.appendChild(body);
      li.appendChild(tools);
      list.appendChild(li);
    });

    var foot = document.createElement('li');
    foot.className = 'shot-total muted xsmall';
    foot.textContent = shots.length + (shots.length === 1 ? ' shot · ' : ' shots · ') +
      total().toFixed(1) + ' seconds in the cut';
    list.appendChild(foot);
  }

  if (clearBtn) clearBtn.addEventListener('click', function () {
    shots = [];
    out.innerHTML = '';
    say('');
    paint();
  });

  /* ---------------------------------------------------------- render */

  function drawCover(ctx, video, W, H, alpha) {
    var vw = video.videoWidth || video.naturalWidth;
    var vh = video.videoHeight || video.naturalHeight;
    if (!vw || !vh) return;
    var scale = Math.max(W / vw, H / vh);
    var w = vw * scale, h = vh * scale;
    ctx.globalAlpha = alpha;
    ctx.drawImage(video, (W - w) / 2, (H - h) / 2, w, h);
    ctx.globalAlpha = 1;
  }

  function seek(video, t) {
    return new Promise(function (res) {
      var done = function () { video.removeEventListener('seeked', done); res(); };
      video.addEventListener('seeked', done);
      try { video.currentTime = t; } catch (e) { res(); }
      setTimeout(res, 1500);
    });
  }

  /* A still is held for its hold time, with the same cross-fade into the
     next shot that a clip gets. Real time, like everything else here,
     because the recorder is capturing the canvas as it plays. */
  function holdStill(ctx, W, H, shot, next, fade) {
    return new Promise(function (resolve) {
      var t0 = performance.now();
      var span = Math.max(0.3, (shot.out || STILL) - (shot.in || 0)) * 1000;
      var nextStarted = false;
      var step = function () {
        var t = performance.now() - t0;
        if (t >= span) { resolve(nextStarted); return; }
        drawCover(ctx, shot.image, W, H, 1);
        if (next && fade > 0 && t > span - fade * 1000) {
          var k = Math.min(1, (t - (span - fade * 1000)) / (fade * 1000));
          if (!nextStarted) {
            nextStarted = true;
            if (next.kind !== 'image') {
              next.video.currentTime = next.in;
              next.video.play().catch(function () {});
            }
          }
          drawCover(ctx, next.kind === 'image' ? next.image : next.video, W, H, k);
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function playSegment(ctx, W, H, shot, next, fade, onTick) {
    return new Promise(function (resolve) {
      var v = shot.video;
      var started = false;
      var nextStarted = false;

      var step = function () {
        if (v.paused && started) return;
        var t = v.currentTime;
        if (t >= shot.out - 0.02) {
          v.pause();
          resolve(nextStarted);
          return;
        }
        drawCover(ctx, v, W, H, 1);

        if (next && fade > 0 && t > shot.out - fade) {
          var k = Math.min(1, (t - (shot.out - fade)) / fade);
          if (!nextStarted) {
            nextStarted = true;
            next.video.currentTime = next.in;
            next.video.play().catch(function () {});
          }
          drawCover(ctx, next.video, W, H, k);
        }
        if (onTick) onTick();
        requestAnimationFrame(step);
      };

      seek(v, shot.in).then(function () {
        started = true;
        v.play().then(function () { requestAnimationFrame(step); })
          .catch(function () { resolve(false); });
      });
    });
  }

  renderBtn.addEventListener('click', async function () {
    if (busy || !shots.length) return;
    if (!window.MediaRecorder || !document.createElement('canvas').captureStream) {
      say('This browser cannot record a canvas, so the montage cannot be cut here.', true);
      return;
    }
    busy = true;
    renderBtn.disabled = true;
    out.innerHTML = '';
    say('Cutting — this plays through in real time, so give it ' + total().toFixed(0) + ' seconds.');

    var size = (shapeEl.value || '854x480').split('x');
    var W = Number(size[0]), H = Number(size[1]);
    var fade = transEl.value === 'cut' ? 0 : Number(transEl.value);

    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a090e';
    ctx.fillRect(0, 0, W, H);

    var stream = canvas.captureStream(30);
    var mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
      .find(function (m) { return MediaRecorder.isTypeSupported(m); }) || '';
    var rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 4000000 } : undefined);
    var chunks = [];
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };

    var finished = new Promise(function (res) { rec.onstop = res; });
    rec.start(200);

    try {
      for (var i = 0; i < shots.length; i++) {
        var shot = shots[i];
        var next = shots[i + 1] || null;
        if (shot.out === null && shot.duration) shot.out = shot.duration;
        say('Cutting shot ' + (i + 1) + ' of ' + shots.length + '…');
        var preRolled = shot.kind === 'image'
          ? await holdStill(ctx, W, H, shot, next, fade)
          : await playSegment(ctx, W, H, shot, next, fade);
        if (preRolled && next) next.in = Math.min((next.out || 0) - 0.2, next.in + fade);
      }
    } catch (err) {
      say('The cut broke partway: ' + ((err && err.message) || 'unknown'), true);
    }

    rec.stop();
    await finished;
    shots.forEach(function (s) { try { if (s.video) s.video.pause(); } catch (e) {} });

    var blob = new Blob(chunks, { type: 'video/webm' });
    var url = URL.createObjectURL(blob);
    out.innerHTML =
      '<figure class="draw-card"><video controls playsinline src="' + url + '"></video>' +
      '<figcaption>Your montage · ' + shots.length + ' shots · ' + Math.round(blob.size / 1024) + ' KB' +
      '<span class="draw-meta">Cut in your browser · generated, not filmed</span></figcaption></figure>' +
      '<p><a class="btn" href="' + url + '" download="egregora-montage.webm">Download the film</a></p>';
    say('Done. The film is below, and the download keeps it.');
    busy = false;
    renderBtn.disabled = false;
    if (window.EGArrived) window.EGArrived('video', out.querySelector('.draw-card'), 'Your montage is cut.');
  });

  paint();
})();
