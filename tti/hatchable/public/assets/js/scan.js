/* ===========================================================================
   The Scanner — a camera, two photographs, and a solid at the end of it
   ---------------------------------------------------------------------------
   This is not photogrammetry and does not pretend to be. It is the oldest
   honest trick in the trade: a *visual hull* from two silhouettes. Stand
   the thing in front of the camera, take it front on, turn it a quarter and
   take it again, and the outline of the first photograph gives the width of
   every slice while the outline of the second gives the depth of the same
   slice. Sweep an ellipse down the two profiles and you have a solid with
   the photograph wrapped round the front of it.

   Two photographs make a far better object than one; one will still work,
   and the depth is then guessed from the width, which is right for a mug
   and wrong for a book. The page says so rather than hiding it.

   Faces get the same treatment with the proportions of a head, plus a
   gentle push outward where the photograph is bright — a nose is lit from
   the front and a cheek falls away, so shading is a usable, imperfect
   stand-in for depth at this scale.

   Nothing here is uploaded. The camera stream, the frames and the finished
   mesh never leave the page: the scan is made in the browser and handed
   straight to the Turning Shop or the sketch pad.
   ======================================================================== */

const box = document.getElementById("scan-box");
if (box) start();

function start() {
  const $ = (id) => document.getElementById(id);
  const video = $("scan-video");
  const preview = $("scan-preview");
  const statusEl = $("scan-status");
  const stepsEl = $("scan-steps");
  const shots = $("scan-shots");

  const say = (t, bad) => {
    if (!statusEl) return;
    statusEl.textContent = t || "";
    statusEl.className = "auth-msg" + (bad ? " is-bad" : "");
  };

  /* --- what we are making ------------------------------------------------ */
  const PLAN = {
    object: [
      { key: "back", label: "The empty background", hint: "Point the camera where the object will stand and take it with nothing there. This is optional, and it is also what makes the cut-out clean." },
      { key: "front", label: "The object, front on", hint: "Put the object in frame without moving the camera. Fill the frame with it." },
      { key: "side", label: "The object, turned a quarter", hint: "Turn the object ninety degrees on the spot. This gives it depth; skip it and the depth is guessed from the width." }
    ],
    face: [
      { key: "back", label: "The empty background", hint: "Step out of frame and take the wall behind you. Optional, but it makes the cut-out clean." },
      { key: "front", label: "Face on", hint: "Head upright, filling the frame, looking straight at the lens. Even light, no hat brim." },
      { key: "side", label: "In profile", hint: "Turn to face fully sideways. This is what gives the head a nose and a skull rather than a mask." }
    ]
  };

  let mode = "object";
  let step = 0;
  let stream = null;
  const frames = { back: null, front: null, side: null };   /* ImageData */
  let built = null;                                          /* the finished spec */

  /* --- the camera -------------------------------------------------------- */
  async function openCamera() {
    if (stream) return true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      say("This browser will not give a page the camera. Use the file button instead \u2014 photographs work just as well.", true);
      return false;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode === "face" ? "user" : { ideal: "environment" },
          width: { ideal: 1280 }, height: { ideal: 960 }
        },
        audio: false
      });
    } catch (err) {
      say("The camera was refused: " + ((err && err.message) || "no reason given") +
        ". The file button below takes photographs you have already.", true);
      return false;
    }
    video.srcObject = stream;
    video.hidden = false;
    try { await video.play(); } catch { /* autoplay guard */ }
    return true;
  }

  function closeCamera() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    video.hidden = true;
  }

  /* --- frames ------------------------------------------------------------ */
  const WORK = 320;   /* every frame is reduced to this on the long side */

  function toWork(source, w, h) {
    const scale = WORK / Math.max(w, h);
    const cw = Math.max(8, Math.round(w * scale));
    const ch = Math.max(8, Math.round(h * scale));
    const cv = document.createElement("canvas");
    cv.width = cw; cv.height = ch;
    const c = cv.getContext("2d", { willReadFrequently: true });
    c.drawImage(source, 0, 0, cw, ch);
    return c.getImageData(0, 0, cw, ch);
  }

  const grabVideo = () => toWork(video, video.videoWidth || 640, video.videoHeight || 480);

  function grabFile(file) {
    return new Promise((done, fail) => {
      const img = new Image();
      img.onload = () => done(toWork(img, img.naturalWidth, img.naturalHeight));
      img.onerror = () => fail(new Error("that file is not a picture this browser can open"));
      img.src = URL.createObjectURL(file);
    });
  }

  /* --- separating the thing from the room --------------------------------
     Two ways, and the first is much the better. With a photograph of the
     empty background, every pixel that has changed is the object. Without
     one, the room is flooded inward from the edges of the frame: whatever
     the border colour reaches is background, and what it cannot reach is
     the thing in the middle. That fails against a busy wall, which is why
     the page asks for the background plate first. */
  function cut(front, back) {
    const { width: w, height: h, data: f } = front;
    const mask = new Uint8Array(w * h);

    if (back && back.width === w && back.height === h) {
      const b = back.data;
      let diffs = [];
      for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
        const d = Math.abs(f[p] - b[p]) + Math.abs(f[p + 1] - b[p + 1]) + Math.abs(f[p + 2] - b[p + 2]);
        diffs.push(d);
      }
      /* The threshold is read off the picture rather than guessed: the
         median difference is the camera's own noise, and anything well
         above it is the object. */
      const sorted = diffs.slice().sort((a, c) => a - c);
      const noise = sorted[Math.floor(sorted.length * 0.5)];
      const cutAt = Math.max(28, noise * 3 + 18);
      for (let i = 0; i < mask.length; i++) mask[i] = diffs[i] > cutAt ? 1 : 0;
    } else {
      /* Flood the room in from the border. */
      const seen = new Uint8Array(w * h);
      const stack = [];
      const near = (i, j) => {
        const p = i * 4, q = j * 4;
        return Math.abs(f[p] - f[q]) + Math.abs(f[p + 1] - f[q + 1]) + Math.abs(f[p + 2] - f[q + 2]) < 46;
      };
      for (let x = 0; x < w; x++) { stack.push(x); stack.push((h - 1) * w + x); }
      for (let y = 0; y < h; y++) { stack.push(y * w); stack.push(y * w + w - 1); }
      stack.forEach((i) => { seen[i] = 1; });
      while (stack.length) {
        const i = stack.pop();
        const x = i % w, y = (i / w) | 0;
        const go = (j) => { if (j >= 0 && j < mask.length && !seen[j] && near(i, j)) { seen[j] = 1; stack.push(j); } };
        if (x > 0) go(i - 1);
        if (x < w - 1) go(i + 1);
        if (y > 0) go(i - w);
        if (y < h - 1) go(i + w);
      }
      for (let i = 0; i < mask.length; i++) mask[i] = seen[i] ? 0 : 1;
    }

    return tidy(mask, w, h);
  }

  /* Close the speckle, drop everything that is not the main blob. */
  function tidy(mask, w, h) {
    const morph = (src, grow) => {
      const out = new Uint8Array(src.length);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let hit = grow ? 0 : 1;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = Math.min(w - 1, Math.max(0, x + dx));
              const ny = Math.min(h - 1, Math.max(0, y + dy));
              const v = src[ny * w + nx];
              if (grow) hit |= v; else hit &= v;
            }
          }
          out[y * w + x] = hit;
        }
      }
      return out;
    };
    let m = morph(morph(mask, 1), 0);    /* close */
    m = morph(morph(m, 0), 1);           /* open  */

    /* Largest connected region only, so a shadow in the corner is not part
       of the sculpture. */
    const label = new Int32Array(m.length).fill(-1);
    let best = -1, bestSize = 0, id = 0;
    for (let i = 0; i < m.length; i++) {
      if (!m[i] || label[i] >= 0) continue;
      const stack = [i];
      label[i] = id;
      let size = 0;
      while (stack.length) {
        const j = stack.pop();
        size++;
        const x = j % w, y = (j / w) | 0;
        const go = (k) => { if (k >= 0 && k < m.length && m[k] && label[k] < 0) { label[k] = id; stack.push(k); } };
        if (x > 0) go(j - 1);
        if (x < w - 1) go(j + 1);
        if (y > 0) go(j - w);
        if (y < h - 1) go(j + w);
      }
      if (size > bestSize) { bestSize = size; best = id; }
      id++;
    }
    const out = new Uint8Array(m.length);
    if (best >= 0) for (let i = 0; i < m.length; i++) out[i] = label[i] === best ? 1 : 0;
    return { mask: out, w, h, area: bestSize };
  }

  /* --- the profiles ------------------------------------------------------
     One number per row of the picture: where the middle of the slice is and
     how wide it is. The rows are taken between the top and the bottom of
     the silhouette, so a thing photographed small still fills its own
     height. */
  function rowsOf(cutout, count) {
    const { mask, w, h } = cutout;
    let top = h, bottom = -1, left = w, right = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!mask[y * w + x]) continue;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
    if (bottom < 0) return null;
    const span = Math.max(1, right - left + 1);
    const tall = Math.max(1, bottom - top + 1);
    const rows = [];
    for (let i = 0; i < count; i++) {
      const y = Math.min(h - 1, Math.round(top + (i / (count - 1)) * (tall - 1)));
      let lo = -1, hi = -1;
      for (let x = 0; x < w; x++) if (mask[y * w + x]) { if (lo < 0) lo = x; hi = x; }
      if (lo < 0) { rows.push([0, 0]); continue; }
      const cx = ((lo + hi) / 2 - (left + right) / 2) / span;
      const half = ((hi - lo + 1) / 2) / span;
      rows.push([cx, half]);
    }
    return { rows, box: { top, bottom, left, right }, aspect: tall / span };
  }

  /* The cut-out itself, as a transparent PNG at a decent size, for the
     texture and for the sketch pad. */
  function cutoutUrl(frame, cutout, bounds, pad) {
    const { mask, w, h } = cutout;
    const { top, bottom, left, right } = bounds;
    const px = Math.round((right - left) * (pad || 0.04));
    const py = Math.round((bottom - top) * (pad || 0.04));
    const x0 = Math.max(0, left - px), x1 = Math.min(w - 1, right + px);
    const y0 = Math.max(0, top - py), y1 = Math.min(h - 1, bottom + py);
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;

    const cv = document.createElement("canvas");
    cv.width = cw; cv.height = ch;
    const c = cv.getContext("2d");
    const out = c.createImageData(cw, ch);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const src = ((y + y0) * w + (x + x0)) * 4;
        const dst = (y * cw + x) * 4;
        out.data[dst] = frame.data[src];
        out.data[dst + 1] = frame.data[src + 1];
        out.data[dst + 2] = frame.data[src + 2];
        /* A one-pixel feather, so the edge is not a staircase. */
        const i = (y + y0) * w + (x + x0);
        let a = mask[i] ? 255 : 0;
        if (!a) {
          const n = (mask[i - 1] || 0) + (mask[i + 1] || 0) + (mask[i - w] || 0) + (mask[i + w] || 0);
          if (n >= 2) a = 150;
        }
        out.data[dst + 3] = a;
      }
    }
    c.putImageData(out, 0, 0);

    /* Scale it up a little for the texture: 320 is enough to carve from,
       not enough to look at. */
    const big = document.createElement("canvas");
    const k = Math.min(3, 768 / Math.max(cw, ch));
    big.width = Math.round(cw * k); big.height = Math.round(ch * k);
    const bc = big.getContext("2d");
    bc.imageSmoothingQuality = "high";
    bc.drawImage(cv, 0, 0, big.width, big.height);
    return big.toDataURL("image/png");
  }

  /* A coarse brightness grid, used to push a face outward where it is lit. */
  function shading(frame, cutout, bounds, n) {
    const { mask, w } = cutout;
    const { top, bottom, left, right } = bounds;
    const grid = [];
    for (let j = 0; j < n; j++) {
      const row = [];
      for (let i = 0; i < n; i++) {
        const x = Math.round(left + (i / (n - 1)) * (right - left));
        const y = Math.round(top + (j / (n - 1)) * (bottom - top));
        const p = (y * w + x) * 4;
        row.push(mask[y * w + x]
          ? (frame.data[p] * 0.299 + frame.data[p + 1] * 0.587 + frame.data[p + 2] * 0.114) / 255
          : 0);
      }
      grid.push(row);
    }
    /* Flatten the overall exposure out: what matters is which part of the
       face is brighter than the rest, not how bright the room was. */
    const all = grid.flat().filter((v) => v > 0);
    const avg = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0.5;
    return grid.map((row) => row.map((v) => (v ? Math.max(-1, Math.min(1, (v - avg) * 2.2)) : 0)));
  }

  /* --- putting it together ----------------------------------------------- */
  const ROWS = 64;

  function build() {
    if (!frames.front) { say("Take the front view first.", true); return null; }
    const frontCut = cut(frames.front, frames.back);
    if (!frontCut.area || frontCut.area < 200) {
      say("Nothing stood out from the background. Try again with the background plate, or against a plainer wall.", true);
      return null;
    }
    const front = rowsOf(frontCut, ROWS);
    if (!front) { say("The outline came out empty.", true); return null; }

    let depth = null;
    if (frames.side) {
      const sideCut = cut(frames.side, frames.back);
      const side = sideCut.area > 200 ? rowsOf(sideCut, ROWS) : null;
      if (side) {
        /* The side view is scaled to the front view's height, so the two
           profiles describe the same object even if you stepped nearer. */
        const k = front.aspect / Math.max(0.01, side.aspect);
        depth = side.rows.map(([, half]) => half * k);
      }
    }

    const spec = {
      kind: mode === "face" ? "head" : "object",
      name: mode === "face" ? "a scanned head" : "a scanned object",
      rows: front.rows,
      depth,
      aspect: front.aspect,
      texture: cutoutUrl(frames.front, frontCut, front.box),
      shading: mode === "face" ? shading(frames.front, frontCut, front.box, 24) : null,
      guessedDepth: !depth
    };
    return spec;
  }

  /* --- the panel --------------------------------------------------------- */
  function paintSteps() {
    if (!stepsEl) return;
    const plan = PLAN[mode];
    stepsEl.innerHTML = "";
    plan.forEach((s, i) => {
      const li = document.createElement("li");
      li.className = "scan-step" + (i === step ? " is-now" : "") + (frames[s.key] ? " is-done" : "");
      li.innerHTML = "<strong>" + s.label + (frames[s.key] ? " \u2014 taken" : "") + "</strong><br>" +
        '<span class="muted xsmall">' + s.hint + "</span>";
      stepsEl.appendChild(li);
    });
    const cap = $("scan-capture");
    if (cap) cap.textContent = "Take: " + plan[step].label;
    const skip = $("scan-skip");
    if (skip) skip.hidden = step === 1;    /* the front view is not optional */
  }

  function paintShots() {
    if (!shots) return;
    shots.innerHTML = "";
    PLAN[mode].forEach((s) => {
      const f = frames[s.key];
      if (!f) return;
      const cv = document.createElement("canvas");
      cv.width = f.width; cv.height = f.height;
      cv.className = "scan-thumb";
      cv.getContext("2d").putImageData(f, 0, 0);
      cv.title = s.label;
      shots.appendChild(cv);
    });
  }

  function showPreview(spec) {
    if (!preview || !spec) return;
    const img = new Image();
    img.onload = () => {
      const c = preview.getContext("2d");
      preview.width = 300;
      preview.height = Math.round(300 * (img.height / img.width));
      c.clearRect(0, 0, preview.width, preview.height);
      c.drawImage(img, 0, 0, preview.width, preview.height);
      preview.hidden = false;
    };
    img.src = spec.texture;
  }

  function advance() {
    const plan = PLAN[mode];
    const next = plan.findIndex((s, i) => i > step && !frames[s.key]);
    step = next >= 0 ? next : Math.min(step + 1, plan.length - 1);
    paintSteps();
  }

  function finish() {
    built = build();
    if (!built) return;
    showPreview(built);
    const row = $("scan-done");
    if (row) row.hidden = false;
    say(built.guessedDepth
      ? "Cut out. There is no second view, so the depth is guessed from the width \u2014 right for a mug, wrong for a book."
      : "Cut out, with a real depth from the second view. Put it on the bench or onto the sketch pad.");
  }

  /* --- buttons ----------------------------------------------------------- */
  const on = (id, fn) => { const el = $(id); if (el) el.addEventListener("click", fn); };

  document.querySelectorAll("[data-scan-mode]").forEach((b) => {
    b.addEventListener("click", async () => {
      mode = b.getAttribute("data-scan-mode");
      document.querySelectorAll("[data-scan-mode]").forEach((o) =>
        o.setAttribute("aria-pressed", String(o === b)));
      frames.back = frames.front = frames.side = null;
      built = null; step = 0;
      if (preview) preview.hidden = true;
      const row = $("scan-done"); if (row) row.hidden = true;
      paintSteps(); paintShots();
      if (stream) { closeCamera(); await openCamera(); }
      say(mode === "face"
        ? "Face scan. Two photographs \u2014 face on and in profile \u2014 make a head with a nose; one makes a mask."
        : "Object scan. The background plate first if you can, then the object, then the object turned a quarter.");
    });
  });

  on("scan-start", async () => {
    if (await openCamera()) {
      say("Camera on. Nothing is sent anywhere \u2014 every frame stays in this page.");
      $("scan-start").hidden = true;
      $("scan-stop").hidden = false;
      $("scan-capture").hidden = false;
      $("scan-skip").hidden = false;
    }
  });
  on("scan-stop", () => {
    closeCamera();
    $("scan-start").hidden = false;
    $("scan-stop").hidden = true;
    $("scan-capture").hidden = true;
    say("Camera off.");
  });

  on("scan-capture", () => {
    if (!stream) return say("Turn the camera on first, or use a photograph from the file button.", true);
    const key = PLAN[mode][step].key;
    frames[key] = grabVideo();
    paintShots();
    advance();
    if (frames.front) finish(); else say("Taken. " + PLAN[mode][step].label + " next.");
  });

  on("scan-skip", () => { advance(); say("Skipped."); });

  on("scan-redo", () => {
    frames.back = frames.front = frames.side = null;
    built = null; step = 0;
    if (preview) preview.hidden = true;
    const row = $("scan-done"); if (row) row.hidden = true;
    paintSteps(); paintShots();
    say("Starting again.");
  });

  const file = $("scan-file");
  if (file) file.addEventListener("change", async () => {
    const f = file.files && file.files[0];
    if (!f) return;
    try {
      frames[PLAN[mode][step].key] = await grabFile(f);
      paintShots();
      advance();
      if (frames.front) finish(); else say("Loaded. " + PLAN[mode][step].label + " next.");
    } catch (err) {
      say((err && err.message) || "that file would not open", true);
    }
    file.value = "";
  });

  /* --- handing it on ------------------------------------------------------ */
  on("scan-to-bench", () => {
    if (!built) return say("Nothing has been scanned yet.", true);
    if (!window.EGScanToBench) return say("The Turning Shop is not awake on this page.", true);
    window.EGScanToBench(built);
    say("On the bench. It moves, turns and sizes like any other piece.");
  });

  on("scan-to-pad", () => {
    if (!built) return say("Nothing has been scanned yet.", true);
    if (!window.EGSketchFloat) return say("The sketch pad is not open on this page.", true);
    window.EGSketchFloat(built.texture);
    say("On the paper, held as a selection \u2014 drag it about, scroll to size it, Enter to put it down.");
  });

  paintSteps();
  window.addEventListener("pagehide", closeCamera);
}
