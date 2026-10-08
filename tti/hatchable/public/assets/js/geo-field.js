/* ===========================================================================
   The geometry field — a two-body-at-a-time physics for the backdrop glyphs
   ---------------------------------------------------------------------------
   The sacred figures behind every page used to drift along fixed CSS paths,
   which meant they passed straight through one another as though each were
   painted on its own sheet of glass. They are now a *field*: every glyph
   carries a position, a velocity, a spin and a radius, and the frame loop
   lets them act on each other.

   Three behaviours, in order of distance:

     1. REPULSION.  Approach is resisted. Once the gap between two glyphs
        falls below the sum of their radii the force rises like 1/d², pushing
        along the line of centres. Shapes shoulder each other aside long
        before they touch, which is what makes the field look alive.

     2. MISSHAPING.  The same force that pushes also deforms. Each glyph
        accumulates a strain tensor from its neighbours — squashed along the
        contact axis, stretched across it — applied as a rotate/scale/rotate
        sandwich so a circle becomes a true ellipse rather than a sheared
        blur. Strain relaxes back to round when the neighbour leaves.

     3. COLLIDE or MERGE.  If two glyphs still meet, what happens depends on
        how hard they meet. A fast closing speed is a COLLISION: they bounce
        elastically, both take a deep strain shock, and the shock rings down.
        A slow, heavy approach is a MERGE: the pair fuses into one larger
        figure — area is conserved, so the merged radius is √(r₁²+r₂²) — the
        absorbed glyph fades inside it, and after a while the merged body
        grows unstable and fissions back into two, each thrown clear.

   Everything is transform-only (translate, rotate, scale) so the whole field
   stays on the compositor. With prefers-reduced-motion the module does not
   start and the CSS keeps the figures still.
   ======================================================================== */
(() => {
  "use strict";

  const field = document.querySelector(".geo");
  if (!field) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const nodes = Array.from(field.querySelectorAll(".geo-layer"));
  if (nodes.length < 2) return;

  /* Take the layers off their CSS keyframes — from here the loop owns the
     transform, and a half-applied animation would fight it every frame. */
  field.classList.add("geo--live");

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  /* ----------------------------------------------------------- the bodies */
  let W = window.innerWidth, H = window.innerHeight;

  const bodies = nodes.map((el, i) => {
    const r = el.getBoundingClientRect();
    const w = r.width || 320, h = r.height || 320;
    /* Pin every layer to the origin; position is carried in the transform. */
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.right = "auto";
    el.style.bottom = "auto";
    el.style.margin = "0";
    const speed = rand(4, 11);           // px per second — a slow, heavy drift
    const dir = rand(0, Math.PI * 2);
    return {
      el, w, h,
      /* Spread the starting positions around the frame rather than stacking
         them in a corner; the field redistributes itself within a minute. */
      x: rand(0.12, 0.88) * W - w / 2,
      y: rand(0.12, 0.88) * H - h / 2,
      vx: Math.cos(dir) * speed,
      vy: Math.sin(dir) * speed,
      r: Math.max(w, h) * 0.42,          // the effective collision radius
      r0: Math.max(w, h) * 0.42,
      spin: rand(-3.2, 3.2),             // degrees per second
      angle: rand(0, 360),
      mass: (w * h) / 100000,
      strain: 0,                         // 0 = round, 1 = fully misshapen
      strainAngle: 0,
      scale: 1,
      alpha: 1,
      state: "free",                     // free | merged | absorbed
      partner: null,
      timer: 0,
      index: i
    };
  });

  /* ------------------------------------------------------------ the forces */
  const REPEL = 2600;        // strength of the near-field push
  const REACH = 1.55;        // repulsion begins at REACH × (r₁+r₂)
  const MERGE_SPEED = 26;    // closing slower than this fuses; faster bounces
  const MAX_V = 46;

  function wrapWalls(b, dt) {
    const pad = 0.35;
    const minX = -b.w * pad, maxX = W - b.w * (1 - pad);
    const minY = -b.h * pad, maxY = H - b.h * (1 - pad);
    if (b.x < minX) { b.x = minX; b.vx = Math.abs(b.vx); }
    if (b.x > maxX) { b.x = maxX; b.vx = -Math.abs(b.vx); }
    if (b.y < minY) { b.y = minY; b.vy = Math.abs(b.vy); }
    if (b.y > maxY) { b.y = maxY; b.vy = -Math.abs(b.vy); }
  }

  function merge(a, b) {
    /* Area is conserved: π r₁² + π r₂² = π R². The heavier body survives. */
    const keep = a.mass >= b.mass ? a : b;
    const gone = keep === a ? b : a;
    const R = Math.sqrt(keep.r * keep.r + gone.r * gone.r);
    const px = (a.vx * a.mass + b.vx * b.mass) / (a.mass + b.mass);
    const py = (a.vy * a.mass + b.vy * b.mass) / (a.mass + b.mass);

    keep.x += (gone.x + gone.w / 2 - (keep.x + keep.w / 2)) * 0.22;
    keep.y += (gone.y + gone.h / 2 - (keep.y + keep.h / 2)) * 0.22;
    keep.vx = px; keep.vy = py;
    keep.r = R;
    keep.scale = R / keep.r0;
    keep.mass += gone.mass;
    keep.spin = (keep.spin + gone.spin) * 0.6;
    keep.state = "merged";
    keep.partner = gone;
    keep.timer = rand(7, 16);            // seconds before it fissions again
    keep.strain = Math.max(keep.strain, 0.5);

    gone.state = "absorbed";
    gone.partner = keep;
    gone.alpha = 0;
  }

  function fission(keep) {
    const gone = keep.partner;
    if (!gone) { keep.state = "free"; return; }
    const dir = rand(0, Math.PI * 2);
    const kick = rand(16, 30);

    keep.r = keep.r0;
    keep.scale = 1;
    keep.mass -= gone.mass;
    keep.state = "free";
    keep.partner = null;
    keep.vx += Math.cos(dir) * kick;
    keep.vy += Math.sin(dir) * kick;
    keep.strain = 1;
    keep.strainAngle = dir;

    gone.state = "free";
    gone.partner = null;
    gone.alpha = 1;
    gone.x = keep.x + Math.cos(dir + Math.PI) * (keep.r + gone.r) * 1.1;
    gone.y = keep.y + Math.sin(dir + Math.PI) * (keep.r + gone.r) * 1.1;
    gone.vx = -Math.cos(dir) * kick;
    gone.vy = -Math.sin(dir) * kick;
    gone.strain = 1;
    gone.strainAngle = dir;
  }

  function step(dt) {
    /* ---- pairwise interaction ------------------------------------------ */
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      if (a.state === "absorbed") continue;
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (b.state === "absorbed") continue;

        const ax = a.x + a.w / 2, ay = a.y + a.h / 2;
        const bx = b.x + b.w / 2, by = b.y + b.h / 2;
        let dx = bx - ax, dy = by - ay;
        let d = Math.hypot(dx, dy) || 0.001;
        const touch = a.r + b.r;
        if (d > touch * REACH) continue;

        const nx = dx / d, ny = dy / d;

        /* 1 — repulsion, rising as the gap closes */
        const gap = Math.max(d, touch * 0.35);
        const f = (REPEL * touch) / (gap * gap);
        a.vx -= nx * f * dt / a.mass;
        a.vy -= ny * f * dt / a.mass;
        b.vx += nx * f * dt / b.mass;
        b.vy += ny * f * dt / b.mass;

        /* 2 — misshaping, proportional to how deep the overlap runs */
        const press = clamp(1 - d / (touch * REACH), 0, 1);
        const axis = Math.atan2(ny, nx);
        if (press > a.strain) { a.strain = press; a.strainAngle = axis; }
        if (press > b.strain) { b.strain = press; b.strainAngle = axis; }

        /* 3 — contact: collide hard, or merge soft */
        if (d < touch * 0.82 && a.state === "free" && b.state === "free") {
          const closing = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (closing > 0) {
            if (closing < MERGE_SPEED && Math.random() < 0.55) {
              merge(a, b);
              break;
            }
            /* elastic bounce along the line of centres */
            const m = (2 * closing) / (a.mass + b.mass);
            a.vx -= m * b.mass * nx; a.vy -= m * b.mass * ny;
            b.vx += m * a.mass * nx; b.vy += m * a.mass * ny;
            a.strain = 1; b.strain = 1;
            a.strainAngle = b.strainAngle = axis;
            /* push them apart so they cannot stick */
            const push = (touch * 0.82 - d) / 2;
            a.x -= nx * push; a.y -= ny * push;
            b.x += nx * push; b.y += ny * push;
          }
        }
      }
    }

    /* ---- integrate, relax, draw ---------------------------------------- */
    for (const b of bodies) {
      if (b.state === "merged") {
        b.timer -= dt;
        if (b.timer <= 0) fission(b);
      }
      if (b.state === "absorbed") {
        /* ride inside the body that swallowed it, invisible */
        b.x = b.partner.x; b.y = b.partner.y;
        b.el.style.opacity = "0";
        continue;
      }

      const v = Math.hypot(b.vx, b.vy);
      if (v > MAX_V) { b.vx *= MAX_V / v; b.vy *= MAX_V / v; }
      b.vx *= 1 - 0.18 * dt;             // the field is viscous, not empty
      b.vy *= 1 - 0.18 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.angle += b.spin * dt;
      wrapWalls(b, dt);

      b.strain *= Math.pow(0.12, dt);    // strain rings down over ~1s
      if (b.strain < 0.002) b.strain = 0;

      const sq = 1 - 0.3 * b.strain;     // squashed along the contact axis
      const st = 1 + 0.26 * b.strain;    // stretched across it
      const deg = (b.strainAngle * 180) / Math.PI;

      b.el.style.opacity = String(b.alpha);
      b.el.style.transform =
        `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0) ` +
        `rotate(${b.angle.toFixed(2)}deg) ` +
        `scale(${(b.scale).toFixed(3)}) ` +
        (b.strain
          ? `rotate(${deg.toFixed(1)}deg) scale(${sq.toFixed(3)}, ${st.toFixed(3)}) rotate(${(-deg).toFixed(1)}deg)`
          : "");
    }
  }

  /* ----------------------------------------------------------------- loop */
  let last = performance.now();
  let running = true;

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);   // never leap on a stall
    last = now;
    step(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  });

  let resizeT = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      W = window.innerWidth; H = window.innerHeight;
      for (const b of bodies) {
        b.x = clamp(b.x, -b.w * 0.35, W - b.w * 0.65);
        b.y = clamp(b.y, -b.h * 0.35, H - b.h * 0.65);
      }
    }, 160);
  });
})();
