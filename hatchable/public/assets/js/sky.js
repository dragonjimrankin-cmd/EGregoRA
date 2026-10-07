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
    { r: 6.957e8, name: "The Sun",
      kind: "world", tint: BRIGHT,
      say: "Radius 696,340 km — 109 Earths across the face of it, and 333,000 Earths by mass. " +
           "The map starts here because this is the nearest star, and the one object in the sky " +
           "whose surface we can watch change from hour to hour. The core runs at 15 million " +
           "kelvin and fuses 600 million tonnes of hydrogen a second; a photon made down there " +
           "takes tens of thousands of years to fight its way out, and eight minutes to reach you." },
    { r: 1.5e10, name: "Mercury's orbit",
      kind: "system", tint: GOLD,
      say: "0.39 astronomical units. Its perihelion creeps forward by 43 arcseconds a century " +
           "more than Newton allows, and that discrepancy was the first hard evidence that " +
           "general relativity is the better account of gravity." },
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
           "around 12 million light years, the Centaurus A group beyond. Everything inside this " +
           "ring is bound to us by gravity; everything outside it is being carried away by the " +
           "expansion of space." },
    { r: 5.4e7 * LY, name: "The Virgo Cluster",
      kind: "cluster", tint: BLUE,
      say: "Thirteen hundred galaxies and more, 54 million light years off, with M87 and its " +
           "photographed black hole at the centre. This is the mass our whole Local Group is " +
           "falling towards at some 400 km/s — the Virgocentric flow." },
    { r: 2.6e8 * LY, name: "Laniakea",
      kind: "cluster", tint: BLUE,
      say: "Our supercluster: 520 million light years across, a hundred thousand galaxies, " +
           "defined in 2014 by Tully and colleagues not by where things are but by which way " +
           "they are flowing. Everything in it drains towards the Great Attractor. The name is " +
           "Hawaiian for immeasurable heaven." },
    { r: 7.5e8 * LY, name: "The cosmic web",
      kind: "cluster", tint: VERDANT,
      say: "At this scale galaxies are not objects, they are pixels. They lie along filaments of " +
           "dark matter and hot gas — the Sloan Great Wall runs 1.4 billion light years — walling " +
           "off voids hundreds of millions of light years across with almost nothing in them. The " +
           "whole pattern grew from density ripples of one part in a hundred thousand, which are " +
           "directly visible in the microwave background." },
    { r: 4.65e10 * LY, name: "The observable universe",
      kind: "horizon", tint: BRIGHT,
      say: "The edge of what can be seen: a co-moving radius of 46.5 billion light years, wider " +
           "than the 13.8-billion-year age of the universe because space expanded while the light " +
           "was in transit. The outermost thing visible is the microwave background, the moment " +
           "380,000 years in when the universe cooled enough to go transparent. This is not an " +
           "edge of the universe. It is the edge of our evidence." },
    { r: 4.65e13 * LY, name: "Beyond the horizon",
      kind: "beyond", tint: ROSE,
      say: "Inflation implies the whole is very much larger than the part we can see — by a " +
           "factor of at least a thousand on conservative readings, and possibly without limit. " +
           "No observation made from inside the horizon can settle it, and none ever will. This " +
           "is the rung where measurement stops and inference takes over: speculative and " +
           "contested, and marked as such." },
    { r: 4.65e16 * LY, name: "The Moebius Torus",
      kind: "seam", tint: GOLD,
      say: "The order's own figure for the shape of the whole, offered as emblem and not as " +
           "cosmology: a torus seamed like a Möbius band, so that what leaves by one face returns " +
           "by the other and there is no outside to stand in. Causality is its one-way flow and " +
           "the cosmic ledger is what comes round. Cosmology does measure the curvature of space " +
           "and finds it flat to a few tenths of a per cent, which permits several topologies and " +
           "proves none of them. Myth, tradition and primary esoteric text." }
  ].map((r) => Object.assign(r, { at: Math.log10(r.r) }));

  const SPAN = 2.6;            // decades visible in the window at once
  /* Zoomed all the way in, the innermost rung sits just inside the edge of
     the view; zoomed out, the outermost one does. */
  const LO = RUNGS[0].at + 0.35;
  const HI = RUNGS[RUNGS.length - 1].at + 0.25;

  /* Where measurement ends. Past the observable horizon the map stops being
     a survey and becomes an emblem, and it says so by changing what it
     draws: the rings fade out and the order's Moebius torus fades in. */
  const HORIZON = RUNGS.find((r) => r.kind === "horizon").at;
  const EMBLEM = RUNGS[RUNGS.length - 1].at;
  const beyondness = () => Math.max(0, Math.min(1, (top - (HORIZON + 0.4)) / (EMBLEM - HORIZON - 0.4)));

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
    if (d < 1e9 * LY) return Number((d / (1e6 * LY)).toPrecision(3)).toLocaleString("en-GB") + " million light years";
    if (d < 1e12 * LY) return Number((d / (1e9 * LY)).toPrecision(3)).toLocaleString("en-GB") + " billion light years";
    return Number((d / (1e12 * LY)).toPrecision(3)).toLocaleString("en-GB") + " trillion light years";
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

  /* ------------------------------------------------------- the emblem ----
     A torus drawn in perspective with a single band running round it twice,
     half-twisted, so the band's two apparent sides are one side. Nothing
     here is a measurement; it is the order's figure for a whole with no
     outside, and the panel beside it says so in those words. */
  function drawTorus(alpha) {
    const R0 = R * 0.62, r0 = R * 0.26, squash = 0.42;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);

    /* The body of the torus: rings of latitude, drawn back to front. */
    for (let i = 0; i <= 26; i++) {
      const v = (i / 26) * Math.PI * 2;
      const rr = R0 + r0 * Math.cos(v);
      const yy = r0 * Math.sin(v) * squash * 1.9;
      ctx.beginPath();
      ctx.ellipse(0, yy, rr, rr * squash, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(215,176,90," + (0.05 + 0.1 * Math.cos(v)).toFixed(3) + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* The seam. One strip, two laps, a half twist: the edge you start on is
       not the edge you come back on. */
    for (const lap of [0, 1]) {
      ctx.beginPath();
      for (let i = 0; i <= 240; i++) {
        const u = (i / 240) * Math.PI * 2;
        const phase = u / 2 + lap * Math.PI;      // the half twist
        const rr = R0 + r0 * Math.cos(phase);
        const x = Math.cos(u) * rr;
        const y = Math.sin(u) * rr * squash + r0 * Math.sin(phase) * squash * 1.9;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = lap ? "rgba(243,221,170,0.75)" : "rgba(215,176,90,0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    /* The observable universe, to scale against the whole: the little bright
       disc somewhere on the band that is everything anyone has ever seen. */
    const px = Math.cos(0.8) * (R0 + r0 * Math.cos(0.4));
    const py = Math.sin(0.8) * (R0 + r0 * Math.cos(0.4)) * squash + r0 * Math.sin(0.4) * squash * 1.9;
    ctx.fillStyle = BRIGHT;
    ctx.beginPath();
    ctx.arc(px, py, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "10px 'EB Garamond', serif";
    ctx.fillStyle = DIM;
    ctx.textAlign = "left";
    ctx.fillText("everything we can see", px + 8, py + 3);

    ctx.textAlign = "center";
    ctx.fillStyle = GOLD;
    ctx.font = "11px 'EB Garamond', serif";
    ctx.fillText("one side, one edge, no outside", 0, R * 0.92);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const bey = beyondness();

    /* The field: a scatter that thickens as you go out, so the eye reads
       the outer decades as fuller of things than the inner ones. */
    ctx.save();
    ctx.globalAlpha = 1 - bey;
    for (const s of SEED) {
      const at = (top - SPAN) + s.f * SPAN;
      const rr = ring(at);
      if (rr < 6 || rr > R) continue;
      const x = cx + Math.cos(s.a + at * 0.7) * rr;
      const y = cy + Math.sin(s.a + at * 0.7) * rr * 0.86;
      ctx.globalAlpha = (0.12 + 0.5 * (rr / R)) * (1 - bey);
      ctx.fillStyle = s.f > 0.6 ? BLUE : BRIGHT;
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    /* A ring for each whole power of ten inside the window. */
    ctx.save();
    ctx.globalAlpha = 1 - bey;
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
      if (n.kind === "seam") continue;          // the last rung is the emblem
      const rr = ring(n.at);
      if (rr < 2 || rr > R * 1.02) continue;
      const near = Math.abs(n.at - (top - 0.35)) < 0.45;
      ctx.save();
      ctx.strokeStyle = n.tint;
      ctx.globalAlpha = (near ? 0.95 : 0.55) * (1 - bey * 0.92);
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
    ctx.globalAlpha = 1 - bey;
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

    if (bey > 0.01) drawTorus(bey);
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
