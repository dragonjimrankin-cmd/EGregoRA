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

/* ------------------------------------------------------------------ Oracle */
(() => {
  "use strict";
  const form = document.getElementById("oracle-form");
  if (!form) return;
  const out = document.getElementById("oracle-answer");
  const body = out.querySelector(".oracle-body");
  const btn = document.getElementById("o-submit");

  const show = (html, tone) => {
    out.hidden = false;
    body.className = "oracle-body" + (tone ? " " + tone : "");
    body.innerHTML = html;
    out.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const esc = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const paragraphs = (text) =>
    esc(text)
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const question = form.question.value.trim();
    if (question.length < 8) return show("<p>Ask a fuller question — at least a sentence.</p>", "is-error");

    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = "Consulting…";
    show('<p class="muted">The order is considering your question…</p>', "is-waiting");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question,
          name: form.name.value.trim(),
          limb: form.limb.value
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.answer) {
        show(`<p>${esc(data.error || "The oracle is silent just now. The written form below still reaches Ed.")}</p>`, "is-error");
      } else {
        const note =
          data.source === "written"
            ? '<p class="oracle-src">From the order\u2019s written answers' +
              (data.matched ? " \u00b7 " + esc(data.matched) : "") + "</p>"
            : data.source === "model"
              ? '<p class="oracle-src">Composed just now in the order\u2019s voice</p>'
              : "";
        show(paragraphs(data.answer) + note, "");
        if (window.EGFox && window.EGFox.available) window.EGFox.speak(data.answer);
        else window.__EG_PENDING_SPEECH__ = data.answer;
      }
    } catch {
      show("<p>No answer could be fetched — this page may be running without its backend. The written form below still reaches Ed.</p>", "is-error");
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
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

    up.hidden = !canUp;
    down.hidden = !canDown;
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
