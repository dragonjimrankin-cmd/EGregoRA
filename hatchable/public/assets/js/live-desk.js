/* ===========================================================================
   The Director's Desk — plates, tape and the vision mixer
   ---------------------------------------------------------------------------
   A broadcaster on this site has one camera and no studio. This module gives
   them the rest of it: a plate composer that draws house-style infographics
   on a canvas, a tape player for a video file off the disk, and a mixer that
   composites whichever of those is on air into a single canvas. The canvas is
   what MediaRecorder records, so the watchers receive the cut programme
   rather than the raw camera — no second feed, no extra API, no media server.

   Everything here is drawn, not fetched. A plate is a specification (a title
   and some lines) rendered with 2D canvas calls, which means it stays sharp
   at any size, weighs nothing, works with no network, and can be edited live
   while the feed is running.
   ======================================================================== */

const GOLD = "#d7b05a";
const BRIGHT = "#f3ddaa";
const DIM = "#cbbb93";
const MUTED = "#9f947a";
const VERDANT = "#7fae7a";
const ROSE = "#c98b6a";
const BLUE = "#8fb6d8";
const INK = "#0e0c0a";

const SERIF = '"EB Garamond", Garamond, Georgia, serif';
const TITLE = 'Cinzel, "Cinzel Decorative", Georgia, serif';

export const PLATE_KINDS = [
  { id: "title", label: "Title card", hint: "A kicker, a title, a line under it." },
  { id: "points", label: "Numbered points", hint: "One line each. The list is numbered for you." },
  { id: "bars", label: "Bar chart", hint: "label | number on each line." },
  { id: "dial", label: "Dial", hint: "One line: label | percentage." },
  { id: "cycle", label: "Wheel", hint: "One label per line, arranged round a ring." },
  { id: "ledger", label: "Survives / does not", hint: "survives | does not, on each line." },
  { id: "timeline", label: "Timeline", hint: "when | what on each line." },
  { id: "quote", label: "Quotation", hint: "The quotation in the lines box, the source in the subtitle." }
];

/* --------------------------------------------------------------- drawing */

function rows(spec) {
  return String(spec.lines || "").split("\n")
    .map((l) => l.trim()).filter(Boolean)
    .map((l) => {
      const bits = l.split("|").map((b) => b.trim());
      return { a: bits[0] || "", b: bits.length > 1 ? bits.slice(1).join(" | ") : "" };
    });
}

function wrap(c, text, x, y, max, lh, limit) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  let line = "";
  let drawn = 0;
  for (let i = 0; i < words.length; i++) {
    const trial = line ? line + " " + words[i] : words[i];
    if (c.measureText(trial).width > max && line) {
      c.fillText(line, x, y + drawn * lh);
      drawn += 1;
      line = words[i];
      if (limit && drawn >= limit) { line = ""; break; }
    } else {
      line = trial;
    }
  }
  if (line) { c.fillText(line, x, y + drawn * lh); drawn += 1; }
  return drawn * lh;
}

/* The frame every plate sits in: the ink, the rule, the corner ticks. */
function frame(c, W, H, spec) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#14110d");
  g.addColorStop(1, INK);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);

  c.strokeStyle = "rgba(215,176,90,0.45)";
  c.lineWidth = 2;
  c.strokeRect(28, 28, W - 56, H - 56);
  c.strokeStyle = "rgba(215,176,90,0.18)";
  c.lineWidth = 1;
  c.strokeRect(38, 38, W - 76, H - 76);

  c.strokeStyle = GOLD;
  c.lineWidth = 2;
  const t = 18;
  [[28, 28, 1, 1], [W - 28, 28, -1, 1], [28, H - 28, 1, -1], [W - 28, H - 28, -1, -1]]
    .forEach((k) => {
      c.beginPath();
      c.moveTo(k[0] + k[2] * t, k[1]);
      c.lineTo(k[0], k[1]);
      c.lineTo(k[0], k[1] + k[3] * t);
      c.stroke();
    });

  if (spec.kicker) {
    c.fillStyle = MUTED;
    c.font = '600 20px ' + TITLE;
    c.letterSpacing = "4px";
    c.fillText(String(spec.kicker).toUpperCase(), 72, 92);
    c.letterSpacing = "0px";
  }
  if (spec.mark !== false) {
    c.fillStyle = "rgba(215,176,90,0.5)";
    c.font = '600 18px ' + TITLE;
    c.textAlign = "right";
    c.fillText("EGREGORA", W - 72, H - 64);
    c.textAlign = "left";
  }
}

function heading(c, W, spec, y) {
  c.fillStyle = BRIGHT;
  c.font = '600 54px ' + TITLE;
  const used = wrap(c, spec.title || "", 72, y, W - 190, 62, 2);
  let at = y + used + 4;
  if (spec.subtitle) {
    c.fillStyle = MUTED;
    c.font = 'italic 28px ' + SERIF;
    at += wrap(c, spec.subtitle, 72, at, W - 190, 36, 2);
  }
  c.strokeStyle = "rgba(215,176,90,0.4)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(72, at + 12);
  c.lineTo(W - 72, at + 12);
  c.stroke();
  return at + 50;
}

const ACCENTS = { gold: GOLD, green: VERDANT, rose: ROSE, blue: BLUE };

/* Render one plate specification onto a canvas 2D context. */
export function renderPlate(c, W, H, spec) {
  const accent = ACCENTS[spec.accent] || GOLD;
  c.save();
  c.textBaseline = "alphabetic";
  c.textAlign = "left";
  frame(c, W, H, spec);
  const list = rows(spec);
  const kind = spec.kind || "title";

  if (kind === "title") {
    c.fillStyle = BRIGHT;
    c.font = '600 76px ' + TITLE;
    const used = wrap(c, spec.title || "", 72, 300, W - 144, 88, 3);
    c.strokeStyle = accent;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(72, 300 + used + 24);
    c.lineTo(292, 300 + used + 24);
    c.stroke();
    if (spec.subtitle) {
      c.fillStyle = DIM;
      c.font = 'italic 34px ' + SERIF;
      wrap(c, spec.subtitle, 72, 300 + used + 84, W - 144, 44, 3);
    }
    c.restore();
    return;
  }

  let y = heading(c, W, spec, 150);

  if (kind === "points") {
    c.font = '30px ' + SERIF;
    list.slice(0, 7).forEach((r, i) => {
      c.fillStyle = accent;
      c.font = '600 26px ' + TITLE;
      c.fillText(String(i + 1).padStart(2, "0"), 72, y + 2);
      c.fillStyle = DIM;
      c.font = '30px ' + SERIF;
      const text = r.b ? r.a + " \u2014 " + r.b : r.a;
      y += Math.max(44, wrap(c, text, 136, y, W - 230, 38, 2) + 14);
    });
  }

  if (kind === "bars") {
    const nums = list.map((r) => Math.abs(parseFloat(r.b.replace(/[^0-9.\-]/g, ""))) || 0);
    const top = Math.max.apply(null, nums.concat([1]));
    const wide = W - 420;
    list.slice(0, 8).forEach((r, i) => {
      c.fillStyle = DIM;
      c.font = '26px ' + SERIF;
      c.textAlign = "right";
      c.fillText(r.a.slice(0, 26), 290, y + 22);
      c.textAlign = "left";
      const w = Math.max(3, (nums[i] / top) * wide);
      c.fillStyle = "rgba(215,176,90,0.14)";
      c.fillRect(310, y, wide, 30);
      c.fillStyle = accent;
      c.fillRect(310, y, w, 30);
      c.fillStyle = BRIGHT;
      c.font = '600 22px ' + TITLE;
      c.fillText(r.b, 310 + w + 14, y + 23);
      y += 48;
    });
  }

  if (kind === "dial") {
    const r0 = list[0] || { a: "", b: "0" };
    const pct = Math.max(0, Math.min(100, parseFloat(r0.b.replace(/[^0-9.\-]/g, "")) || 0));
    const cx = W / 2;
    const cy = y + 190;
    const rad = 150;
    c.lineWidth = 26;
    c.strokeStyle = "rgba(215,176,90,0.15)";
    c.beginPath();
    c.arc(cx, cy, rad, Math.PI * 0.75, Math.PI * 2.25);
    c.stroke();
    c.strokeStyle = accent;
    c.lineCap = "round";
    c.beginPath();
    c.arc(cx, cy, rad, Math.PI * 0.75, Math.PI * 0.75 + (Math.PI * 1.5 * pct) / 100);
    c.stroke();
    c.lineCap = "butt";
    c.fillStyle = BRIGHT;
    c.font = '600 92px ' + TITLE;
    c.textAlign = "center";
    c.fillText(Math.round(pct) + "%", cx, cy + 20);
    c.fillStyle = MUTED;
    c.font = '28px ' + SERIF;
    c.fillText(r0.a, cx, cy + 74);
    c.textAlign = "left";
  }

  if (kind === "cycle") {
    const cx = W / 2;
    const cy = y + 180;
    const rad = 140;
    const n = Math.max(1, Math.min(12, list.length));
    c.strokeStyle = "rgba(215,176,90,0.4)";
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(cx, cy, rad, 0, Math.PI * 2);
    c.stroke();
    c.textAlign = "center";
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n - Math.PI / 2;
      const px = cx + rad * Math.cos(a);
      const py = cy + rad * Math.sin(a);
      c.fillStyle = accent;
      c.beginPath();
      c.arc(px, py, 7, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = DIM;
      c.font = '24px ' + SERIF;
      c.fillText(list[i].a.slice(0, 22), cx + (rad + 62) * Math.cos(a), cy + (rad + 62) * Math.sin(a) + 8);
    }
    c.textAlign = "left";
  }

  if (kind === "ledger") {
    c.font = '600 24px ' + TITLE;
    c.fillStyle = VERDANT;
    c.fillText("SURVIVES", 72, y);
    c.fillStyle = ROSE;
    c.fillText("DOES NOT", W / 2 + 20, y);
    y += 26;
    c.strokeStyle = "rgba(215,176,90,0.25)";
    c.beginPath();
    c.moveTo(W / 2, y);
    c.lineTo(W / 2, y + 300);
    c.stroke();
    y += 32;
    const half = W / 2 - 110;
    list.slice(0, 6).forEach((r) => {
      c.font = '26px ' + SERIF;
      c.fillStyle = DIM;
      const h1 = wrap(c, r.a, 72, y, half, 34, 2);
      c.fillStyle = MUTED;
      const h2 = wrap(c, r.b, W / 2 + 20, y, half, 34, 2);
      y += Math.max(h1, h2) + 16;
    });
  }

  if (kind === "timeline") {
    const x0 = 230;
    c.strokeStyle = "rgba(215,176,90,0.35)";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x0, y - 10);
    c.lineTo(x0, y + Math.min(6, list.length) * 62);
    c.stroke();
    list.slice(0, 6).forEach((r) => {
      c.fillStyle = accent;
      c.beginPath();
      c.arc(x0, y + 12, 6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = BRIGHT;
      c.font = '600 24px ' + TITLE;
      c.textAlign = "right";
      c.fillText(r.a.slice(0, 18), x0 - 24, y + 20);
      c.textAlign = "left";
      c.fillStyle = DIM;
      c.font = '26px ' + SERIF;
      wrap(c, r.b, x0 + 26, y + 20, W - x0 - 110, 32, 1);
      y += 62;
    });
  }

  if (kind === "quote") {
    c.fillStyle = "rgba(215,176,90,0.3)";
    c.font = '600 160px ' + SERIF;
    c.fillText("\u201C", 64, y + 80);
    c.fillStyle = BRIGHT;
    c.font = 'italic 40px ' + SERIF;
    const used = wrap(c, list.map((r) => r.a).join(" "), 150, y + 40, W - 280, 54, 6);
    c.fillStyle = MUTED;
    c.font = '26px ' + TITLE;
    c.fillText("\u2014 " + (spec.subtitle || "the order"), 150, y + used + 80);
  }

  c.restore();
}

/* Draw a plate specification into a fresh offscreen canvas. */
export function plateCanvas(spec, W, H) {
  const el = document.createElement("canvas");
  el.width = W || 1280;
  el.height = H || 720;
  renderPlate(el.getContext("2d"), el.width, el.height, spec);
  return el;
}

/* ----------------------------------------------------------- the mixer */
/* One canvas, one output stream. Whatever is on air is painted into it each
   frame; cuts fade through black so a change of source never looks like the
   feed dropping. Audio is mixed in a WebAudio graph so the tape's sound and
   the microphone can both be heard, or either muted, without touching the
   recorder. */
export function createMixer(opts) {
  const o = opts || {};
  const W = o.width || 1280;
  const H = o.height || 720;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d", { alpha: false });

  const state = {
    mode: "camera",        /* camera | plate | tape | split | inset */
    plate: null,           /* a canvas */
    cam: null,             /* a <video> playing the camera */
    tape: null,            /* a <video> playing a file */
    caption: "",
    captionOn: false,
    badge: "",
    veil: 0,               /* 0 clear, 1 black — used for the fade */
    running: true
  };

  function paintVideo(el, x, y, w, h) {
    if (!el || !el.videoWidth) {
      c.fillStyle = "#17130e";
      c.fillRect(x, y, w, h);
      c.fillStyle = MUTED;
      c.font = '24px ' + SERIF;
      c.textAlign = "center";
      c.fillText("no picture", x + w / 2, y + h / 2);
      c.textAlign = "left";
      return;
    }
    const sr = el.videoWidth / el.videoHeight;
    const dr = w / h;
    let sw = el.videoWidth;
    let sh = el.videoHeight;
    let sx = 0;
    let sy = 0;
    if (sr > dr) { sw = el.videoHeight * dr; sx = (el.videoWidth - sw) / 2; }
    else { sh = el.videoWidth / dr; sy = (el.videoHeight - sh) / 2; }
    c.drawImage(el, sx, sy, sw, sh, x, y, w, h);
  }

  function paintPlate(x, y, w, h) {
    if (!state.plate) {
      c.fillStyle = INK;
      c.fillRect(x, y, w, h);
      return;
    }
    c.drawImage(state.plate, x, y, w, h);
  }

  function lowerThird() {
    if (!state.captionOn || !state.caption) return;
    const h = 92;
    const y = H - h - 54;
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "rgba(14,12,10,0.92)");
    g.addColorStop(1, "rgba(14,12,10,0.72)");
    c.fillStyle = g;
    c.fillRect(54, y, W - 108, h);
    c.fillStyle = GOLD;
    c.fillRect(54, y, 6, h);
    c.fillStyle = BRIGHT;
    c.font = '600 34px ' + TITLE;
    c.textBaseline = "middle";
    const parts = state.caption.split("|");
    c.fillText(parts[0].trim().slice(0, 48), 86, y + (parts.length > 1 ? 32 : h / 2));
    if (parts.length > 1) {
      c.fillStyle = MUTED;
      c.font = 'italic 24px ' + SERIF;
      c.fillText(parts.slice(1).join(" ").trim().slice(0, 70), 86, y + 66);
    }
    c.textBaseline = "alphabetic";
  }

  function badge() {
    if (!state.badge) return;
    c.fillStyle = "rgba(14,12,10,0.8)";
    c.fillRect(54, 44, 22 + state.badge.length * 13, 40);
    c.fillStyle = ROSE;
    c.beginPath();
    c.arc(72, 64, 7, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = BRIGHT;
    c.font = '600 20px ' + TITLE;
    c.fillText(state.badge, 90, 71);
  }

  function frameLoop() {
    if (!state.running) return;
    c.fillStyle = INK;
    c.fillRect(0, 0, W, H);

    if (state.mode === "camera") paintVideo(state.cam, 0, 0, W, H);
    else if (state.mode === "tape") paintVideo(state.tape, 0, 0, W, H);
    else if (state.mode === "plate") paintPlate(0, 0, W, H);
    else if (state.mode === "split") {
      paintPlate(0, 0, W / 2, H);
      paintVideo(state.cam, W / 2, 0, W / 2, H);
      c.strokeStyle = GOLD;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(W / 2, 0);
      c.lineTo(W / 2, H);
      c.stroke();
    } else if (state.mode === "inset") {
      paintPlate(0, 0, W, H);
      const iw = Math.round(W * 0.26);
      const ih = Math.round((iw * 9) / 16);
      const ix = W - iw - 54;
      const iy = H - ih - 54;
      c.fillStyle = INK;
      c.fillRect(ix - 3, iy - 3, iw + 6, ih + 6);
      paintVideo(state.cam, ix, iy, iw, ih);
      c.strokeStyle = GOLD;
      c.lineWidth = 2;
      c.strokeRect(ix - 3, iy - 3, iw + 6, ih + 6);
    }

    lowerThird();
    badge();

    if (state.veil > 0) {
      c.fillStyle = "rgba(14,12,10," + state.veil + ")";
      c.fillRect(0, 0, W, H);
    }
    requestAnimationFrame(frameLoop);
  }
  requestAnimationFrame(frameLoop);

  const stream = canvas.captureStream(o.fps || 24);

  /* Audio. Two inputs, two gains, one destination that the recorder sees. */
  const AC = window.AudioContext || window.webkitAudioContext;
  const actx = AC ? new AC() : null;
  const dest = actx ? actx.createMediaStreamDestination() : null;
  const micGain = actx ? actx.createGain() : null;
  const tapeGain = actx ? actx.createGain() : null;
  if (actx) {
    micGain.gain.value = 1;
    tapeGain.gain.value = 1;
    micGain.connect(dest);
    tapeGain.connect(dest);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  }
  let micNode = null;
  let tapeNode = null;

  return {
    canvas,
    stream,
    state,

    setCamera(el) { state.cam = el; },
    setTape(el) { state.tape = el; },
    setPlate(el) { state.plate = el; },
    setCaption(text, on) { state.caption = text || ""; state.captionOn = !!on; },
    setBadge(text) { state.badge = text || ""; },

    /* A cut with a 260ms fade through black each way. */
    take(mode, fade) {
      if (!fade) { state.mode = mode; return Promise.resolve(); }
      return new Promise((done) => {
        const step = 1 / 16;
        const down = setInterval(() => {
          state.veil = Math.min(1, state.veil + step);
          if (state.veil >= 1) {
            clearInterval(down);
            state.mode = mode;
            const up = setInterval(() => {
              state.veil = Math.max(0, state.veil - step);
              if (state.veil <= 0) { clearInterval(up); done(); }
            }, 16);
          }
        }, 16);
      });
    },

    micFrom(micStream) {
      if (!actx || !micStream || !micStream.getAudioTracks().length) return;
      if (micNode) micNode.disconnect();
      micNode = actx.createMediaStreamSource(micStream);
      micNode.connect(micGain);
      if (actx.state === "suspended") actx.resume();
    },
    tapeFrom(videoEl) {
      if (!actx || !videoEl || tapeNode) return;
      try {
        tapeNode = actx.createMediaElementSource(videoEl);
        tapeNode.connect(tapeGain);
      } catch (e) { /* already wired, or a format with no audio */ }
      if (actx.state === "suspended") actx.resume();
    },
    micLevel(v) { if (micGain) micGain.gain.value = v; },
    tapeLevel(v) { if (tapeGain) tapeGain.gain.value = v; },

    stop() {
      state.running = false;
      stream.getTracks().forEach((t) => t.stop());
      if (actx && actx.state !== "closed") actx.close().catch(() => {});
    }
  };
}
