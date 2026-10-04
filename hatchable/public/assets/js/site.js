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
