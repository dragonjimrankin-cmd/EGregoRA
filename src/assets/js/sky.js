/* ===========================================================================
   The Ladder of Scale — one map from a London street to the Local Group
   ---------------------------------------------------------------------------
   A map of the observable neighbourhood cannot be drawn to scale on a
   screen. If the Earth is one pixel across, the Local Group is sixteen
   billion pixels wide, and everything interesting is either a speck or off
   the edge. Every honest "powers of ten" map therefore cheats in the same
   way, and says so: the radius on screen is the *logarithm* of the radius
   in metres. One ring out is ten times further; two rings out is a hundred.

   So distances here are true in order of magnitude and false in proportion,
   which is the only way to hold twenty decades in one figure. Everything
   else — the sizes quoted in the readout, the distances in the notes, the
   order of the rungs — is real, and sourced in the page beneath.

   Drawn with canvas 2D rather than WebGL so it works on a phone, in a
   locked-down browser, and on a machine with no graphics driver worth the
   name. With JavaScript off the page falls back to the written ladder,
   which carries the same numbers.
   ======================================================================== */
(() => {
  const host = document.getElementById("sky-stage");
  if (!host) return;

  const cv = document.createElement("canvas");
  cv.className = "sky-canvas";
  host.appendChild(cv);
  const ctx = cv.getContext("2d");
  if (!ctx) { host.classList.add("sky--off"); return; }

  const GOLD = "#d7b05a", BRIGHT = "#f3ddaa", DIM = "#9f947a";
  const VERDANT = "#7fae7a", BLUE = "#8fb6d8", ROSE = "#c98b6a";

  const LY = 9.4607e15;        // metres in a light year
  const AU = 1.495978707e11;   // metres in an astronomical unit
  const PC = 3.0857e16;        // metres in a parsec

  /* ------------------------------------------------------------- the rungs
     r is a radius in metres from the centre of the view, which is you.
     Every figure is a round number of the real thing, not a guess. */
  const RUNGS = [
    { r: 2.0e4, name: "London, England",
      kind: "ground", tint: VERDANT,
      say: "Twenty kilometres from Charing Cross in any direction and you are still in London. " +
           "This is where the map starts, because it is where you are standing." },
    { r: 5.0e5, name: "Britain",
      kind: "ground", tint: VERDANT,
      say: "A thousand kilometres from the Channel to Cape Wrath. Light crosses it in three " +
           "thousandths of a second." },
    { r: 6.371e6, name: "The Earth",
      kind: "world", tint: BLUE,
      say: "Mean radius 6,371 km. Everything anyone has ever done happened inside this circle, " +
           "with a dozen exceptions who went as far as the next rung and came back." },
    { r: 3.844e8, name: "The Moon's orbit",
      kind: "world", tint: BLUE,
      say: "384,400 km, and 1.3 light seconds. The furthest any human being has been. The " +
           "distance grows by 3.8 cm a year, measured by bouncing lasers off mirrors left in 1969." },
    { r: 1 * AU, name: "One astronomical unit",
      kind: "system", tint: GOLD,
      say: "149,597,870,700 metres, exactly, by definition since 2012. Sunlight takes 8 minutes " +
           "20 seconds. The Sun holds 99.86% of the system's mass." },
    { r: 30.1 * AU, name: "Neptune's orbit",
      kind: "system", tint: GOLD,
      say: "4.5 billion km. The last planet, and the edge of the Kuiper belt begins just beyond " +
           "it — Pluto, Eris, Makemake, Haumea and some hundred thousand icy bodies over 100 km." },
    { r: 121 * AU, name: "The heliopause",
      kind: "system", tint: GOLD,
      say: "Where the solar wind loses its push against the interstellar medium. Voyager 1 crossed " +
           "it in August 2012 and is the only made thing on the far side." },
    { r: 0.8 * LY, name: "The Oort cloud",
      kind: "system", tint: DIM,
      say: "A shell of comets, inferred rather than seen, running from a few thousand to perhaps " +
           "100,000 AU. The Sun's gravitational grip ends somewhere out here, about two light years." },
    { r: 4.246 * LY, name: "Proxima Centauri",
      kind: "stars", tint: ROSE,
      say: "The nearest star: a red dwarf with at least three planets, one of them in the " +
           "temperate zone. 4.25 light years. Voyager 1, if it were aimed there, would take " +
           "73,000 years." },
    { r: 10 * PC, name: "The nearest stars",
      kind: "stars", tint: ROSE,
      say: "Within 10 parsecs — 32.6 light years — there are some 400 stars, and the great " +
           "majority of them are red dwarfs. Sirius, Altair, Vega, 61 Cygni, Tau Ceti. This is " +
           "also the standard distance at which absolute magnitude is defined." },
    { r: 150 * PC, name: "The Local Bubble",
      kind: "stars", tint: BLUE,
      say: "A cavity about a thousand light years across, blown in the interstellar gas by a " +
           "series of supernovae some 14 million years ago. The Sun wandered into it, and most " +
           "nearby star formation sits on its wall." },
    { r: 1000 * PC, name: "The Orion Arm",
      kind: "galaxy", tint: GOLD,
      say: "Our spur of the galaxy: 3,500 light years across and 10,000 long, between the " +
           "Sagittarius and Perseus arms. Orion's nebula, the Pleiades and most of the bright " +
           "winter sky are in here with us." },
    { r: 50000 * LY, name: "The Milky Way",
      kind: "galaxy", tint: BRIGHT,
      say: "A barred spiral some 100,000 light years across holding 100 to 400 billion stars, " +
           "with Sagittarius A* — four million solar masses of black hole — at the middle, and " +
           "the Sun 26,000 light years out, going round once every 230 million years." },
    { r: 160000 * LY, name: "The Magellanic Clouds",
      kind: "galaxy", tint: VERDANT,
      say: "Two irregular satellite galaxies, 160,000 and 200,000 light years off, visible to " +
           "the naked eye from the southern hemisphere, and being pulled apart into a stream of " +
           "hydrogen that trails right across our sky." },
    { r: 2.537e6 * LY, name: "Andromeda",
      kind: "group", tint: BRIGHT,
      say: "M31, the largest galaxy of the Local Group and the furthest thing visible to the " +
           "unaided eye. 2.5 million light years, closing at 110 km/s: it will merge with the " +
           "Milky Way in about 4.5 billion years." },
    { r: 5.0e6 * LY, name: "The Local Group",
      kind: "group", tint: GOLD,
      say: "Rather more than 80 galaxies inside about 5 million light years, held by gravity " +
           "against the expansion of space: Andromeda and the Milky Way at the two foci, " +
           "Triangulum third, and a swarm of dwarfs around each." },
    { r: 1.6e7 * LY, name: "The edge of the Local Group",
      kind: "group", tint: DIM,
      say: "Past the gravitational boundary the neighbours begin: the Sculptor and M81 groups " +
           "around 12 million light years, the Centaurus A group beyond, and the Virgo Cluster " +
           "at 54 million — the mass our whole group is falling towards. This is as far out as " +
           "this map goes." }
  ].map((r) => Object.assign(r, { at: Math.log10(r.r) }));

  const SPAN = 2.6;            // decades visible in the window at once
  /* Zoomed all the way in, the innermost rung sits just inside the edge of
     the view; zoomed out, the outermost one does. */
  const LO = RUNGS[0].at + 0.35;
  const HI = RUNGS[RUNGS.length - 1].at + 0.25;

  let top = HI;                // the outermost decade currently on screen
  let want = HI;
  const clamp = (v) => Math.max(LO, Math.min(HI, v));

  /* -------------------------------------------------------- saying the size
     A readout in whatever unit a human would actually use at this scale. */
  const across = (metres) => {
    const d = metres * 2;
    if (d < 1e6) return (d / 1e3).toFixed(0) + " km";
    if (d < 2 * AU) return Number((d / 1e3).toPrecision(3)).toLocaleString("en-GB") + " km";
    if (d < 0.5 * LY) return (d / AU).toPrecision(3) + " astronomical units";
    if (d < 1e6 * LY) {
      return Number((d / LY).toPrecision(3)).toLocaleString("en-GB") + " light years";
    }
    return (d / (1e6 * LY)).toPrecision(3) + " million light years";
  };

  /* A steady scatter of stars, the same every frame so nothing twinkles at
     anyone who asked the system for no motion. */
  const SEED = [];
  for (let i = 0; i < 420; i++) {
    const a = (i * 2.399963) % (Math.PI * 2);
    const f = ((i * 7919) % 1000) / 1000;
    SEED.push({ a, f, size: 0.4 + ((i * 104729) % 100) / 100 * 1.1 });
  }

  const status = document.getElementById("sky-status");
  const readOut = document.getElementById("sky-read");
  const where = document.getElementById("sky-where");
  const slider = document.getElementById("sky-slider");

  /* The rung whose own radius is nearest the edge of the view: the thing
     the map is currently showing you. */
  const nearest = () => {
    let best = RUNGS[0], gap = Infinity;
    for (const r of RUNGS) {
      const d = Math.abs(r.at - (top - 0.35));
      if (d < gap) { gap = d; best = r; }
    }
    return best;
  };

  let said = null;
  function tell() {
    const n = nearest();
    if (readOut) readOut.textContent = "Across the view: " + across(Math.pow(10, top));
    if (n === said) return;
    said = n;
    if (where) {
      where.innerHTML = "<h3>" + n.name + "</h3><p>" + n.say + "</p>" +
        '<p class="muted xsmall">Radius ' + across(n.r / 2) + " from here.</p>";
    }
    if (status) status.textContent = n.name + ". " + across(Math.pow(10, top)) + " across the view.";
  }

  /* --------------------------------------------------------------- drawing */
  let w = 0, h = 0, cx = 0, cy = 0, R = 0;
  function fit() {
    const box = host.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = Math.max(240, box.width); h = Math.max(240, box.height);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.width = w + "px"; cv.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2; cy = h / 2;
    R = Math.min(w, h) * 0.46;
  }

  /* Screen radius for something of this many decades. Below the window it
     collapses into the hub at the centre; above it, off the edge. */
  const ring = (at) => ((at - (top - SPAN)) / SPAN) * R;

  function draw() {
    ctx.clearRect(0, 0, w, h);

    /* The field: a scatter that thickens as you go out, so the eye reads
       the outer decades as fuller of things than the inner ones. */
    ctx.save();
    for (const s of SEED) {
      const at = (top - SPAN) + s.f * SPAN;
      const rr = ring(at);
      if (rr < 6 || rr > R) continue;
      const x = cx + Math.cos(s.a + at * 0.7) * rr;
      const y = cy + Math.sin(s.a + at * 0.7) * rr * 0.86;
      ctx.globalAlpha = 0.12 + 0.5 * (rr / R);
      ctx.fillStyle = s.f > 0.6 ? BLUE : BRIGHT;
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    /* A ring for each whole power of ten inside the window. */
    ctx.save();
    ctx.font = "10px 'EB Garamond', serif";
    for (let d = Math.ceil(top - SPAN); d <= Math.floor(top); d++) {
      const rr = ring(d);
      if (rr < 4) continue;
      ctx.strokeStyle = "rgba(215,176,90,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rr, rr * 0.86, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(159,148,122,0.75)";
      ctx.fillText("10^" + d + " m", cx + 6, cy - rr * 0.86 + 12);
    }
    ctx.restore();

    /* The rungs themselves. */
    for (const n of RUNGS) {
      const rr = ring(n.at);
      if (rr < 2 || rr > R * 1.02) continue;
      const near = Math.abs(n.at - (top - 0.35)) < 0.45;
      ctx.save();
      ctx.strokeStyle = n.tint;
      ctx.globalAlpha = near ? 0.95 : 0.55;
      ctx.lineWidth = near ? 2 : 1.1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rr, rr * 0.86, 0, 0, Math.PI * 2);
      ctx.stroke();

      /* A body sitting on its own ring, so the circle reads as a thing and
         not only as a measurement. */
      const bx = cx + rr * 0.72, by = cy - rr * 0.86 * 0.69;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = n.tint;
      ctx.beginPath();
      ctx.arc(bx, by, near ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = near ? 1 : 0.6;
      ctx.fillStyle = near ? BRIGHT : DIM;
      ctx.font = (near ? "12px" : "11px") + " 'EB Garamond', serif";
      ctx.textAlign = bx > cx ? "left" : "right";
      ctx.fillText(n.name, bx + (bx > cx ? 9 : -9), by + 4);
      ctx.restore();
    }

    /* The hub: everything smaller than the window, folded to a point. */
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
    g.addColorStop(0, "rgba(243,221,170,0.5)");
    g.addColorStop(1, "rgba(243,221,170,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = DIM;
    ctx.font = "10px 'EB Garamond', serif";
    ctx.textAlign = "center";
    ctx.fillText("you are here", cx, cy + 34);
    ctx.restore();
  }

  /* ------------------------------------------------------------- the moving */
  const still = typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  let running = false;
  function run() {
    if (running) return;
    running = true;
    const step = () => {
      const d = want - top;
      if (Math.abs(d) < 0.002 || still) { top = want; running = false; }
      else { top += d * 0.16; }
      top = clamp(top);
      if (slider) slider.value = String(top.toFixed(3));
      draw();
      tell();
      if (running) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const goTo = (v) => { want = clamp(v); run(); };
  const by = (d) => goTo(want + d);

  /* ------------------------------------------------------------- the hands */
  cv.addEventListener("wheel", (e) => {
    e.preventDefault();
    by(Math.sign(e.deltaY) * 0.22);
  }, { passive: false });

  let drag = null;
  cv.addEventListener("pointerdown", (e) => {
    drag = e.clientY;
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", (e) => {
    if (drag === null) return;
    by((e.clientY - drag) * 0.006);
    drag = e.clientY;
  });
  const letGo = () => { drag = null; };
  cv.addEventListener("pointerup", letGo);
  cv.addEventListener("pointercancel", letGo);

  host.tabIndex = 0;
  host.addEventListener("keydown", (e) => {
    const k = e.key;
    if (k === "ArrowUp" || k === "+" || k === "=") { by(-0.25); e.preventDefault(); }
    if (k === "ArrowDown" || k === "-") { by(0.25); e.preventDefault(); }
    if (k === "Home") { goTo(LO); e.preventDefault(); }
    if (k === "End") { goTo(HI); e.preventDefault(); }
  });

  if (slider) {
    slider.min = String(LO.toFixed(3));
    slider.max = String(HI.toFixed(3));
    slider.step = "0.01";
    slider.value = String(top.toFixed(3));
    slider.addEventListener("input", () => { want = top = clamp(parseFloat(slider.value)); draw(); tell(); });
  }

  document.querySelectorAll("[data-sky]").forEach((b) => {
    b.addEventListener("click", () => {
      const to = parseFloat(b.getAttribute("data-sky"));
      if (!isNaN(to)) goTo(to);
    });
  });

  /* Clicking a written rung underneath the map takes the map there too, so
     the list and the figure are one instrument rather than two. */
  document.querySelectorAll("[data-rung]").forEach((el, i) => {
    el.addEventListener("click", (e) => {
      const n = RUNGS[i];
      if (!n) return;
      e.preventDefault();
      goTo(n.at + 0.35);
      if (host.scrollIntoView) host.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
    });
  });

  if (window.ResizeObserver) new ResizeObserver(() => { fit(); draw(); }).observe(host);
  else addEventListener("resize", () => { fit(); draw(); });

  fit();
  draw();
  tell();
})();
