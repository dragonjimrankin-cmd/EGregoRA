/* ===========================================================================
   The holding card — what the order shows when it is not on air
   ---------------------------------------------------------------------------
   A dark page saying "nothing is live" is indistinguishable from a page that
   is broken, and it gives a visitor no reason to come back. So the off-air
   screen is a thing in its own right: a slow sky, a turning sigil, the
   order's lines passing through, and a constellation you can draw yourself
   by pressing the stars. Press three or more and the figure is named; leave
   it alone and it dissolves back into the sky.

   It costs one canvas and no network, and it stops the moment the feed comes
   up, so nobody's battery pays for the decoration.
   ======================================================================== */

const GOLD = "#d7b05a";
const BRIGHT = "#f3ddaa";
const DIM = "#9f947a";
const VERDANT = "#7fae7a";

const LINES = [
  "The order is not on air.",
  "Life, Love, Magic.",
  "Test everything kindly.",
  "Roots repeat branches.",
  "An answer that cannot survive your scepticism has not earned your belief.",
  "The aether was never disproved \u2014 one clause of it was struck out.",
  "Name the thing accurately. That is the first act of magic.",
  "Nothing here is live, but the sky is still working."
];

/* Names given to whatever you join up. Nonsense with a straight face is the
   point: the order does not pretend its constellations are ancient. */
const NAMES = [
  "The Lesser Kettle", "The Unlit Lamp", "The Patient Fox", "The Broken Compass",
  "The Long Vowel", "The Sleeping Druid", "The Ninth Limb", "The Quiet Argument",
  "The Borrowed Rune", "The Second Thought", "The Upturned Cup", "The Slow Proof"
];

const rand = (a, b) => a + Math.random() * (b - a);

export function holdingCard(host, words) {
  if (!host) return () => {};
  host.innerHTML = "";
  host.classList.add("holding");

  const canvas = document.createElement("canvas");
  canvas.className = "holding-canvas";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label",
    "An off-air card: a slow star field with a turning sigil. Press the stars to join them up.");
  canvas.tabIndex = 0;
  host.appendChild(canvas);

  const cap = document.createElement("p");
  cap.className = "holding-cap muted xsmall";
  cap.textContent = "Press three stars or more to draw a constellation. Press the first one again to close the loop.";
  host.appendChild(cap);

  /* The naming box. It only appears once a loop has been closed, so it is
     built now and kept out of the way until then. */
  const box = document.createElement("div");
  box.className = "sky-name";
  box.hidden = true;
  box.innerHTML =
    '<p class="sky-name-head">Name your constellation</p>' +
    '<p class="muted xsmall" data-sky="says">You closed the loop. It is yours to name.</p>' +
    '<div class="sky-name-row">' +
    '<label class="sr-only" for="sky-name-field">The name</label>' +
    '<input type="text" id="sky-name-field" data-sky="field" maxlength="40" ' +
    'placeholder="The Lesser Kettle" autocomplete="off">' +
    '<button type="button" class="btn btn--small" data-sky="keep">Name it</button>' +
    '<button type="button" class="btn btn--small btn--ghost" data-sky="regen">' +
    "Let the order name it</button>" +
    '<button type="button" class="btn btn--small btn--ghost" data-sky="again">Start again</button>' +
    "</div>";
  host.appendChild(box);
  const skyEl = (n) => box.querySelector('[data-sky="' + n + '"]');

  const c = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let stars = [];
  let joined = [];
  let named = "";
  let closed = false;
  let fade = 0;
  let t = 0;
  let alive = true;

  function size() {
    const r = host.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(280, Math.round(r.width));
    H = Math.round(Math.min(460, Math.max(240, W * 0.52)));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = [];
    const many = Math.round((W * H) / 9000);
    for (let i = 0; i < many; i++) {
      stars.push({
        x: rand(8, W - 8), y: rand(8, H - 8),
        r: rand(0.6, 1.9), tw: rand(0, 6.28), sp: rand(0.4, 1.6), lit: false
      });
    }
  }

  /* The sigil: eleven rays, a ring, and a slow turn. The same figure the
     order prints, drawn here rather than loaded. */
  function sigil(cx, cy, rad, turn) {
    c.save();
    c.translate(cx, cy);
    c.rotate(turn);
    c.strokeStyle = "rgba(215,176,90,0.35)";
    c.lineWidth = 1;
    c.beginPath();
    c.arc(0, 0, rad, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(0, 0, rad * 0.93, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 11; i++) {
      const a = (Math.PI * 2 * i) / 11;
      c.beginPath();
      c.moveTo(Math.cos(a) * rad * 0.22, Math.sin(a) * rad * 0.22);
      c.lineTo(Math.cos(a) * rad * 0.9, Math.sin(a) * rad * 0.9);
      c.strokeStyle = i === 0 ? "rgba(215,176,90,0.75)" : "rgba(215,176,90,0.22)";
      c.stroke();
      c.beginPath();
      c.arc(Math.cos(a) * rad * 0.93, Math.sin(a) * rad * 0.93, 1.8, 0, Math.PI * 2);
      c.fillStyle = GOLD;
      c.fill();
    }
    c.rotate(-turn * 2.4);
    c.strokeStyle = "rgba(127,174,122,0.5)";
    c.beginPath();
    c.arc(0, 0, rad * 0.42, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }

  function draw() {
    if (!alive) return;
    t += 0.016;

    const g = c.createRadialGradient(W / 2, H * 0.52, 10, W / 2, H * 0.52, Math.max(W, H) * 0.8);
    g.addColorStop(0, "#15120d");
    g.addColorStop(1, "#080705");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    stars.forEach((s) => {
      const a = 0.35 + 0.45 * Math.sin(s.tw + t * s.sp);
      c.beginPath();
      c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      c.fillStyle = s.lit ? BRIGHT : "rgba(243,221,170," + a.toFixed(2) + ")";
      c.fill();
      if (s.lit) {
        c.beginPath();
        c.arc(s.x, s.y, s.r + 3.5, 0, Math.PI * 2);
        c.strokeStyle = "rgba(215,176,90,0.5)";
        c.lineWidth = 1;
        c.stroke();
      }
    });

    if (joined.length > 1) {
      c.beginPath();
      c.moveTo(joined[0].x, joined[0].y);
      for (let i = 1; i < joined.length; i++) c.lineTo(joined[i].x, joined[i].y);
      if (closed) c.closePath();
      c.strokeStyle = closed
        ? "rgba(127,174,122," + (0.45 + 0.3 * Math.sin(t * 2)).toFixed(2) + ")"
        : "rgba(215,176,90," + (0.3 + 0.35 * Math.sin(t * 2)).toFixed(2) + ")";
      c.lineWidth = closed ? 1.6 : 1.2;
      c.stroke();
      if (closed) {
        c.fillStyle = "rgba(127,174,122,0.07)";
        c.fill();
      }
    }

    sigil(W / 2, H * 0.47, Math.min(W, H) * 0.19, t * 0.08);

    c.textAlign = "center";
    c.fillStyle = GOLD;
    c.font = '600 15px Cinzel, Georgia, serif';
    c.letterSpacing = "6px";
    c.fillText("OFF AIR", W / 2, 34);
    c.letterSpacing = "0px";

    /* The lines pass through one at a time, fading in and out. */
    const span = 7;
    const which = Math.floor(t / span) % words.length;
    const into = (t % span) / span;
    const lineAlpha = into < 0.12 ? into / 0.12 : into > 0.88 ? (1 - into) / 0.12 : 1;
    c.fillStyle = "rgba(203,187,147," + lineAlpha.toFixed(2) + ")";
    c.font = 'italic 17px "EB Garamond", Georgia, serif';
    const text = words[which];
    const max = W - 48;
    if (c.measureText(text).width > max) {
      const cut = text.lastIndexOf(" ", Math.floor(text.length * 0.55));
      c.fillText(text.slice(0, cut), W / 2, H - 52);
      c.fillText(text.slice(cut + 1), W / 2, H - 30);
    } else {
      c.fillText(text, W / 2, H - 36);
    }

    if (named) {
      fade = Math.min(1, fade + 0.02);
      c.fillStyle = "rgba(127,174,122," + fade.toFixed(2) + ")";
      c.font = '600 13px Cinzel, Georgia, serif';
      c.letterSpacing = "3px";
      c.fillText(named.toUpperCase(), W / 2, H * 0.47 + Math.min(W, H) * 0.19 + 30);
      c.letterSpacing = "0px";
    }
    c.textAlign = "left";

    requestAnimationFrame(draw);
  }

  /* How the figure looks, in words, so that whatever names it has something
     to go on besides a count. */
  function shapeWords() {
    if (joined.length < 3) return "";
    const xs = joined.map((s) => s.x);
    const ys = joined.map((s) => s.y);
    const w = Math.max.apply(null, xs) - Math.min.apply(null, xs);
    const h = Math.max.apply(null, ys) - Math.min.apply(null, ys);
    const mid = ys.reduce((a, b) => a + b, 0) / ys.length;
    const bits = ["a closed loop of " + joined.length + " stars"];
    if (w > h * 1.6) bits.push("much wider than tall");
    else if (h > w * 1.6) bits.push("tall and narrow");
    else bits.push("roughly square");
    bits.push(mid < H * 0.4 ? "high in the sky" : mid > H * 0.6 ? "low on the horizon" : "mid-sky");
    if (joined.length >= 7) bits.push("rambling");
    else if (joined.length <= 4) bits.push("spare");
    return bits.join(", ");
  }

  function sweepSky(words) {
    joined.forEach((s) => { s.lit = false; });
    joined = [];
    named = "";
    closed = false;
    box.hidden = true;
    if (skyEl("field")) skyEl("field").value = "";
    cap.textContent = words ||
      "Press three stars or more to draw a constellation. Press the first one again to close the loop.";
  }

  function closeLoop() {
    closed = true;
    named = "";
    fade = 0;
    box.hidden = false;
    skyEl("says").textContent = "A closed figure of " + joined.length +
      " stars. Give it a name, or ask the order for one.";
    cap.textContent = "The loop is closed. Name it below.";
    const field = skyEl("field");
    if (field) { field.value = ""; field.focus(); }
  }

  function press(x, y) {
    if (closed) return;
    let near = null;
    let best = 26;
    stars.forEach((s) => {
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < best) { best = d; near = s; }
    });
    if (!near) return;
    /* Pressing the first star again closes the figure \u2014 the one gesture
       everyone tries, and now the one that matters. */
    if (near === joined[0] && joined.length >= 3) { closeLoop(); return; }
    if (near.lit) return;
    near.lit = true;
    joined.push(near);
    if (joined.length === 3) {
      cap.textContent = "Three stars. Press the first one again to close the loop, or keep going.";
    } else if (joined.length > 3) {
      cap.textContent = joined.length + " stars. Close the loop on the first one when it looks right.";
    }
    if (joined.length > 11) {
      sweepSky("Eleven stars is a limb's worth. The sky has been swept; start again.");
    }
  }

  /* ---------------------------------------------------------- the naming */
  function settle(name, how) {
    named = name;
    fade = 0;
    skyEl("says").textContent = how || ("Named " + name + ".");
    cap.textContent = name + " \u2014 " + joined.length + " stars, closed.";
  }

  if (skyEl("keep")) skyEl("keep").addEventListener("click", () => {
    const want = (skyEl("field").value || "").trim().slice(0, 40);
    if (!want) {
      skyEl("says").textContent = "Type a name, or let the order find one.";
      return;
    }
    settle(want, "Named by you. It will hold until the sky is swept.");
  });

  if (skyEl("regen")) skyEl("regen").addEventListener("click", async () => {
    const btn = skyEl("regen");
    btn.disabled = true;
    const was = btn.textContent;
    btn.textContent = "Consulting\u2026";
    skyEl("says").textContent = "Asking the order for a name\u2026";
    let name = "";
    let by = "";
    try {
      const r = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sky-name", stars: joined.length, shape: shapeWords() })
      });
      const d = await r.json();
      if (d && d.ok && d.name) { name = d.name; by = d.by || ""; }
    } catch (err) {
      name = "";
    }
    if (!name) {
      /* No model answered. The order keeps its own list for exactly this,
         and says which it used rather than pretending. */
      name = NAMES[Math.floor(Math.random() * NAMES.length)];
      by = "";
      skyEl("field").value = name;
      settle(name, "No model answered, so this came from the order's own list. " +
        "Press again for another, or type your own.");
    } else {
      skyEl("field").value = name;
      settle(name, "Named by " + (by || "the order") + ". Press again for another.");
    }
    btn.disabled = false;
    btn.textContent = was;
  });

  if (skyEl("again")) skyEl("again").addEventListener("click", () => sweepSky());

  canvas.addEventListener("pointerdown", (e) => {
    const r = canvas.getBoundingClientRect();
    press(e.clientX - r.left, e.clientY - r.top);
  });
  canvas.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    press(rand(0, W), rand(0, H));
  });

  const onResize = () => size();
  addEventListener("resize", onResize);
  size();
  draw();

  return function stop() {
    alive = false;
    removeEventListener("resize", onResize);
    host.classList.remove("holding");
    host.innerHTML = "";
  };
}

export { LINES };
