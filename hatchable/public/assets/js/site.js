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
      }
    } catch {
      show("<p>No answer could be fetched — this page may be running without its backend. The written form below still reaches Ed.</p>", "is-error");
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  });
})();
