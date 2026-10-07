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
  cap.textContent = "Press three stars or more to draw a constellation. It will be named for you.";
  host.appendChild(cap);

  const c = canvas.getContext("2d");
  let W = 0;
  let H = 0;
  let stars = [];
  let joined = [];
  let named = "";
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
      c.strokeStyle = "rgba(215,176,90," + (0.3 + 0.35 * Math.sin(t * 2)).toFixed(2) + ")";
      c.lineWidth = 1.2;
      c.stroke();
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

  function press(x, y) {
    let near = null;
    let best = 26;
    stars.forEach((s) => {
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < best) { best = d; near = s; }
    });
    if (!near) return;
    if (near.lit) return;
    near.lit = true;
    joined.push(near);
    if (joined.length === 3) {
      named = NAMES[Math.floor(Math.random() * NAMES.length)];
      fade = 0;
      cap.textContent = "You have drawn " + named + ". Keep going, or let it fade.";
    } else if (joined.length > 3) {
      cap.textContent = named + ", now of " + joined.length + " stars.";
    }
    if (joined.length > 11) {
      joined.forEach((s) => { s.lit = false; });
      joined = [];
      named = "";
      cap.textContent = "Eleven stars is a limb's worth. The sky has been swept; start again.";
    }
  }

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
