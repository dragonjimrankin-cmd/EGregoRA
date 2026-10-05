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

  /* --- Scroll reveals --- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

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
   chips, and hands the finished text to the fox to read aloud. */
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
    if (wrap.children.length) { el.appendChild(wrap); scrollThread(); }
  };

  const footnote = (el, data) => {
    const bits = [];
    if (data.source === "written") bits.push("From the order\u2019s written answers" +
      (data.matched ? " \u00b7 " + esc(data.matched) : ""));
    else if (data.source === "model") {
      bits.push("Composed just now in the order\u2019s voice");
      if (data.grounded && data.grounded.length)
        bits.push("grounded in: " + data.grounded.slice(0, 2).map(esc).join("; "));
    } else if (data.source === "crisis") bits.push("Said before anything else");
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
        headers: { "content-type": "application/json" },
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
        headers: { "content-type": "application/json" },
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
  // the page grows as reveal animations and the fox canvas settle in
  if (window.ResizeObserver) {
    new ResizeObserver(onScroll).observe(document.body);
  }
  update();
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
    card.innerHTML =
      '<div class="draw-wait"><span class="draw-spin" aria-hidden="true"></span>' +
      "<p>Drawing \u2014 this takes fifteen to forty seconds.</p></div>" +
      '<figcaption>' + esc(p) + "</figcaption>";
    out.prepend(card);
    card.scrollIntoView({ block: "nearest", behavior: "smooth" });

    try {
      const res = await fetch("/api/draw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: p, name: (nameEl && nameEl.value || "").trim() })
      });
      const data = await res.json().catch(() => ({}));
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
          " \u00b7 open in a new tab for the full size</span></figcaption>";
      }
    } catch {
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
