/* ===========================================================================
   Record now on your device — /podcast/ and /videos/
   ---------------------------------------------------------------------------
   A whole small studio that never speaks to the server. The microphone (or
   the camera, or the screen) is recorded straight into the page; the page
   then asks whether to keep it; what is kept gets a transport with a scrub
   bar, play, pause, and ten seconds either way; and four honest edits:

     crop to the marks · remove the sound between the marks ·
     insert audio at the playhead · archive it on this device

   Sound is edited properly — decoded into an AudioBuffer, rebuilt sample by
   sample, rendered offline, encoded to MP3 if the vendored encoder loads and
   WAV if it does not. Film has no transcoder in a browser, so a cut film is
   re-recorded through a canvas at playback speed; that is said plainly in
   the panel rather than hidden behind a spinner.

   The archive is IndexedDB on this machine. Nothing is uploaded, so nothing
   needs a password; the publishing door upstairs is still the only way onto
   the site itself.
   ======================================================================== */

import { busyBox, busyError, nameTheDevice, hold, release } from "./live.js";

let lamePromise = null;
function lameJS() {
  if (!lamePromise) {
    lamePromise = import("./vendor/lamejs.js")
      .then((mod) => (mod && mod.Mp3Encoder ? mod : (mod && mod.default) || mod))
      .catch((err) => { lamePromise = null; throw err; });
  }
  return lamePromise;
}

/* ----------------------------------------------------------------- store */
const DB_NAME = "egregora-studio";
const STORE = "files";
let dbPromise = null;

function db() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((go, no) => {
    if (!window.indexedDB) { no(new Error("this browser keeps no local archive")); return; }
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => go(req.result);
    req.onerror = () => no(req.error || new Error("the archive would not open"));
  }).catch((err) => { dbPromise = null; throw err; });
  return dbPromise;
}

function tx(mode, run) {
  return db().then((d) => new Promise((go, no) => {
    const t = d.transaction(STORE, mode);
    const out = run(t.objectStore(STORE));
    t.oncomplete = () => go(out && out.result !== undefined ? out.result : out);
    t.onerror = () => no(t.error || new Error("the archive refused that"));
  }));
}

const store = {
  all: () => tx("readonly", (s) => s.getAll()),
  get: (id) => tx("readonly", (s) => s.get(id)),
  put: (rec) => tx("readwrite", (s) => s.put(rec)),
  drop: (id) => tx("readwrite", (s) => s.delete(id))
};

/* ---------------------------------------------------------------- helpers */
const clock = (s) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return m + ":" + (r < 10 ? "0" : "") + r;
};
const weigh = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};
const when = (ms) => {
  const d = new Date(ms);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};
const newId = () => "f" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* An AudioBuffer out to a WAV blob — the floor under everything, since every
   browser can write bytes even when the MP3 encoder will not load. */
function wavOf(buf) {
  const chans = buf.numberOfChannels;
  const frames = buf.length;
  const rate = buf.sampleRate;
  const bytes = new ArrayBuffer(44 + frames * chans * 2);
  const view = new DataView(bytes);
  const text = (at, s) => { for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i)); };
  text(0, "RIFF"); view.setUint32(4, 36 + frames * chans * 2, true); text(8, "WAVE");
  text(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, chans, true); view.setUint32(24, rate, true);
  view.setUint32(28, rate * chans * 2, true); view.setUint16(32, chans * 2, true);
  view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, frames * chans * 2, true);
  let at = 44;
  const data = [];
  for (let c = 0; c < chans; c++) data.push(buf.getChannelData(c));
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < chans; c++) {
      let v = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(at, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      at += 2;
    }
  }
  return new Blob([view], { type: "audio/wav" });
}

async function encodeAudio(buf) {
  try {
    const lame = await lameJS();
    const chans = Math.min(2, buf.numberOfChannels);
    const enc = new lame.Mp3Encoder(chans, buf.sampleRate, 160);
    const left = buf.getChannelData(0);
    const right = chans > 1 ? buf.getChannelData(1) : null;
    const to16 = (f) => {
      const out = new Int16Array(f.length);
      for (let i = 0; i < f.length; i++) {
        const v = Math.max(-1, Math.min(1, f[i]));
        out[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
      }
      return out;
    };
    const l = to16(left);
    const r = right ? to16(right) : null;
    const block = 1152;
    const parts = [];
    for (let i = 0; i < l.length; i += block) {
      const a = l.subarray(i, i + block);
      const b = r ? r.subarray(i, i + block) : undefined;
      const chunk = r ? enc.encodeBuffer(a, b) : enc.encodeBuffer(a);
      if (chunk.length) parts.push(new Int8Array(chunk));
    }
    const tail = enc.flush();
    if (tail.length) parts.push(new Int8Array(tail));
    return new Blob(parts, { type: "audio/mpeg" });
  } catch (err) {
    return wavOf(buf);
  }
}

function decodeAudio(blob) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return Promise.reject(new Error("this browser has no audio engine"));
  const ctx = new Ctx();
  return blob.arrayBuffer()
    .then((bytes) => new Promise((go, no) => ctx.decodeAudioData(bytes, go, no)))
    .then((buf) => { if (ctx.close) ctx.close(); return buf; });
}

function blankLike(buf, frames, ctx) {
  return ctx.createBuffer(buf.numberOfChannels, frames, buf.sampleRate);
}
function makeCtx(buf, frames) {
  const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  return new Off(buf.numberOfChannels, Math.max(1, frames), buf.sampleRate);
}

/* crop · silence · splice — all three rebuilt sample by sample. */
function cropBuffer(buf, from, to) {
  const rate = buf.sampleRate;
  const a = Math.max(0, Math.floor(from * rate));
  const b = Math.min(buf.length, Math.ceil(to * rate));
  const ctx = makeCtx(buf, b - a);
  const out = blankLike(buf, Math.max(1, b - a), ctx);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    out.getChannelData(c).set(buf.getChannelData(c).subarray(a, b));
  }
  return out;
}
function silenceBuffer(buf, from, to) {
  const rate = buf.sampleRate;
  const a = Math.max(0, Math.floor(from * rate));
  const b = Math.min(buf.length, Math.ceil(to * rate));
  const ctx = makeCtx(buf, buf.length);
  const out = blankLike(buf, buf.length, ctx);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const src = buf.getChannelData(c);
    const dst = out.getChannelData(c);
    dst.set(src);
    /* Not a hard cut: twenty milliseconds of ramp either side, or the edit
       announces itself with a click. */
    const ramp = Math.min(Math.floor(rate * 0.02), Math.max(0, Math.floor((b - a) / 2)));
    for (let i = a; i < b; i++) dst[i] = 0;
    for (let i = 0; i < ramp; i++) {
      const g = i / ramp;
      if (a - ramp + i >= 0) dst[a - ramp + i] *= 1 - g;
      if (b + i < dst.length) dst[b + i] *= g;
    }
  }
  return out;
}
function spliceBuffer(buf, other, at) {
  const rate = buf.sampleRate;
  const cut = Math.max(0, Math.min(buf.length, Math.floor(at * rate)));
  const extra = Math.round(other.duration * rate);
  const chans = Math.max(buf.numberOfChannels, other.numberOfChannels);
  const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new Off(chans, buf.length + extra, rate);
  const out = ctx.createBuffer(chans, buf.length + extra, rate);
  for (let c = 0; c < chans; c++) {
    const dst = out.getChannelData(c);
    const src = buf.getChannelData(Math.min(c, buf.numberOfChannels - 1));
    dst.set(src.subarray(0, cut), 0);
    dst.set(src.subarray(cut), cut + extra);
    const ins = other.getChannelData(Math.min(c, other.numberOfChannels - 1));
    /* Resampled by the crudest honest means if the rates differ. */
    if (Math.abs(other.sampleRate - rate) < 1) {
      dst.set(ins.subarray(0, extra), cut);
    } else {
      const step = other.sampleRate / rate;
      for (let i = 0; i < extra; i++) {
        const j = Math.min(ins.length - 1, Math.floor(i * step));
        dst[cut + i] = ins[j];
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ mount */
document.querySelectorAll("[data-device-studio]").forEach(setup);

function setup(root) {
  const KIND = root.getAttribute("data-device-studio") === "video" ? "video" : "audio";
  const d = (name) => root.querySelector("[data-ds=" + name + "]");
  const el = {
    open: d("open"), panel: d("panel"), source: d("source"),
    start: d("start"), stop: d("stop"), clock: d("clock"), state: d("state"),
    mirror: d("mirror"), meter: d("meter"),
    keep: d("keep"), keepWhat: d("keep-what"), keepYes: d("keep-yes"), keepNo: d("keep-no"),
    editor: d("editor"), stage: d("stage"),
    rew: d("rew"), play: d("play"), pause: d("pause"), ff: d("ff"),
    seek: d("seek"), time: d("time"),
    markIn: d("mark-in"), markOut: d("mark-out"), markClear: d("mark-clear"), marks: d("marks"),
    crop: d("crop"), mute: d("mute-range"), undo: d("undo"),
    insFile: d("ins-file"), insert: d("insert"),
    bar: d("bar"), msg: d("msg"), name: d("name"),
    archive: d("archive"), download: d("download"),
    rows: d("rows"), empty: d("empty"), table: d("table")
  };

  let stream = null;
  let rec = null;
  let chunks = [];
  let ticking = 0;
  let pending = null;       /* the blob just recorded, awaiting keep or bin */
  let workBlob = null;      /* what the editor is holding */
  let workId = null;        /* if it came out of the archive, which row */
  let history = [];
  let media = null;         /* the <audio> or <video> in the stage */
  let markIn = null;
  let markOut = null;
  let busy = false;

  const say = (t, bad) => {
    if (!el.msg) return;
    el.msg.textContent = t || "";
    el.msg.classList.toggle("is-bad", !!bad);
  };
  const step = (t, frac) => {
    if (!el.bar) return;
    if (!t) { el.bar.hidden = true; el.bar.textContent = ""; return; }
    el.bar.hidden = false;
    el.bar.textContent = t + (frac || frac === 0 ? "  " + Math.round(frac * 100) + "%" : "");
  };
  const lock = (on) => {
    busy = on;
    [el.crop, el.mute, el.insert, el.archive, el.download, el.undo].forEach((b) => {
      if (b) b.disabled = on || (b === el.undo && !history.length) ||
        (b === el.insert && !(el.insFile && el.insFile.files && el.insFile.files.length));
    });
  };

  /* ---------------------------------------------------------- the panel */
  if (el.open) el.open.addEventListener("click", () => {
    const shut = el.panel.hidden;
    el.panel.hidden = !shut;
    el.open.setAttribute("aria-expanded", shut ? "true" : "false");
    if (shut) refreshFiles();
  });

  /* ------------------------------------------------------- the recording */
  function drawMeter(analyser) {
    if (!el.meter) return;
    const c = el.meter.getContext("2d");
    const bins = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!stream) return;
      analyser.getByteFrequencyData(bins);
      c.clearRect(0, 0, el.meter.width, el.meter.height);
      const n = 48;
      for (let i = 0; i < n; i++) {
        const v = bins[Math.floor(i * bins.length / n)] / 255;
        const h = Math.max(2, v * el.meter.height);
        c.fillStyle = v > 0.8 ? "#c98b6a" : "#7fae7a";
        c.fillRect(i * (el.meter.width / n) + 1, el.meter.height - h, el.meter.width / n - 2, h);
      }
      window.requestAnimationFrame(tick);
    };
    tick();
  }

  if (el.start) el.start.addEventListener("click", async () => {
    if (rec) return;
    say("");
    try {
      if (KIND === "video" && el.source && el.source.value === "screen") {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        let mic = null;
        try { mic = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { mic = null; }
        stream = new MediaStream(screen.getVideoTracks()
          .concat(mic ? mic.getAudioTracks() : screen.getAudioTracks()));
      } else if (KIND === "video") {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err) {
      if (busyError(err)) {
        say("That device is busy \u2014 see the box below.", true);
        busyBox(el.panel, {
          device: await nameTheDevice(KIND === "video" && (!el.source || el.source.value === "cam") ? "video" : "audio"),
          why: "Something already has it open. Usually that is another tab of this site, a video " +
            "call, or a recorder left running."
        }, async () => { release(); el.start.click(); });
        return;
      }
      say("The device would not open: " + (err && err.message ? err.message : "no reason given"), true);
      return;
    }
    hold(stream);

    if (el.mirror) { el.mirror.srcObject = stream; el.mirror.play().catch(() => {}); }
    if (el.meter) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        const an = ctx.createAnalyser();
        an.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(an);
        drawMeter(an);
      }
    }

    const want = KIND === "video"
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
    const type = want.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || "";
    chunks = [];
    rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: rec.mimeType || type || (KIND === "video" ? "video/webm" : "audio/webm") });
      pending = blob;
      shutStream();
      el.state.textContent = "";
      if (el.keep) {
        el.keep.hidden = false;
        if (el.keepWhat) {
          el.keepWhat.textContent = (KIND === "video" ? "A film" : "A recording") + " of " +
            clock(ticking) + ", " + weigh(blob.size) + ".";
        }
      }
      rec = null;
    };
    rec.start(1000);

    ticking = 0;
    el.clock.textContent = "0:00";
    el.state.textContent = "Recording. Nothing is being sent anywhere.";
    el.start.disabled = true;
    el.stop.disabled = false;
    if (el.keep) el.keep.hidden = true;
    const t = window.setInterval(() => {
      if (!rec) { window.clearInterval(t); return; }
      ticking += 1;
      el.clock.textContent = clock(ticking);
    }, 1000);
  });

  function shutStream() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    if (el.mirror) el.mirror.srcObject = null;
    el.start.disabled = false;
    el.stop.disabled = true;
  }

  if (el.stop) el.stop.addEventListener("click", () => { if (rec) rec.stop(); });

  if (el.keepYes) el.keepYes.addEventListener("click", () => {
    if (!pending) return;
    el.keep.hidden = true;
    loadIntoEditor(pending, null, (KIND === "video" ? "Film" : "Recording") + " of " + when(Date.now()));
    pending = null;
  });
  if (el.keepNo) el.keepNo.addEventListener("click", () => {
    pending = null;
    el.keep.hidden = true;
    say("Thrown away. Nothing was kept.");
  });

  /* ------------------------------------------------------------ the editor */
  function loadIntoEditor(blob, id, name) {
    workBlob = blob;
    workId = id || null;
    history = [];
    markIn = null; markOut = null;
    drawMarks();
    if (el.name && name) el.name.value = name;
    el.editor.hidden = false;
    mountMedia();
    lock(false);
    say("");
    el.editor.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function mountMedia() {
    if (media) { try { URL.revokeObjectURL(media.src); } catch (e) {} media.remove(); }
    media = document.createElement(KIND === "video" ? "video" : "audio");
    media.className = KIND === "video" ? "ds-video" : "ds-audio";
    media.controls = false;
    media.playsInline = true;
    media.preload = "metadata";
    media.src = URL.createObjectURL(workBlob);
    el.stage.innerHTML = "";
    el.stage.appendChild(media);
    media.addEventListener("timeupdate", paint);
    media.addEventListener("loadedmetadata", paint);
    media.addEventListener("durationchange", paint);
    media.addEventListener("ended", paint);
  }

  function span() {
    const dur = media && isFinite(media.duration) ? media.duration : 0;
    return dur;
  }
  function paint() {
    const dur = span();
    const at = media ? media.currentTime : 0;
    if (el.time) el.time.textContent = clock(at) + " / " + (dur ? clock(dur) : "—");
    if (el.seek && dur) el.seek.value = String(Math.round((at / dur) * 1000));
  }
  if (el.seek) el.seek.addEventListener("input", () => {
    const dur = span();
    if (!dur || !media) return;
    media.currentTime = (Number(el.seek.value) / 1000) * dur;
  });
  if (el.play) el.play.addEventListener("click", () => { if (media) media.play().catch(() => {}); });
  if (el.pause) el.pause.addEventListener("click", () => { if (media) media.pause(); });
  if (el.rew) el.rew.addEventListener("click", () => {
    if (media) media.currentTime = Math.max(0, media.currentTime - 10);
  });
  if (el.ff) el.ff.addEventListener("click", () => {
    if (media) media.currentTime = Math.min(span() || 0, media.currentTime + 10);
  });

  function drawMarks() {
    if (!el.marks) return;
    if (markIn === null && markOut === null) {
      el.marks.textContent = "No marks set — the whole recording.";
    } else {
      el.marks.textContent = "In " + (markIn === null ? "the start" : clock(markIn)) +
        " · out " + (markOut === null ? "the end" : clock(markOut));
    }
  }
  if (el.markIn) el.markIn.addEventListener("click", () => {
    markIn = media ? media.currentTime : 0; drawMarks();
  });
  if (el.markOut) el.markOut.addEventListener("click", () => {
    markOut = media ? media.currentTime : span(); drawMarks();
  });
  if (el.markClear) el.markClear.addEventListener("click", () => {
    markIn = null; markOut = null; drawMarks();
  });

  function range() {
    const dur = span();
    const a = markIn === null ? 0 : Math.max(0, markIn);
    const b = markOut === null ? dur : Math.min(dur, markOut);
    if (b - a < 0.05) return null;
    return { a: a, b: b };
  }

  function remember() {
    history.push(workBlob);
    if (history.length > 8) history.shift();
    if (el.undo) el.undo.disabled = false;
  }
  function replace(blob) {
    workBlob = blob;
    const at = media ? media.currentTime : 0;
    mountMedia();
    media.addEventListener("loadedmetadata", function once() {
      media.removeEventListener("loadedmetadata", once);
      if (isFinite(at) && at < (media.duration || 0)) media.currentTime = at;
    });
  }
  if (el.undo) el.undo.addEventListener("click", () => {
    if (!history.length) return;
    workBlob = history.pop();
    mountMedia();
    el.undo.disabled = !history.length;
    say("Put back as it was.");
  });

  /* Film is cut by playing it and recording what comes out — the only route a
     browser has. gain is dropped inside any muted range, and an inserted
     track is scheduled against the same clock. */
  async function recut(opts) {
    if (!window.MediaRecorder) throw new Error("this browser has no recorder, so a film cannot be cut here");
    const v = document.createElement("video");
    v.src = URL.createObjectURL(workBlob);
    v.muted = false;
    v.playsInline = true;
    await new Promise((go, no) => {
      v.addEventListener("loadedmetadata", go, { once: true });
      v.addEventListener("error", () => no(new Error("that film would not open")), { once: true });
    });
    const from = opts.from || 0;
    const to = opts.to && isFinite(opts.to) ? opts.to : v.duration;
    const c = document.createElement("canvas");
    c.width = v.videoWidth || 1280;
    c.height = v.videoHeight || 720;
    const g = c.getContext("2d");
    const pic = c.captureStream(30);

    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const dest = ctx.createMediaStreamDestination();
    const gain = ctx.createGain();
    ctx.createMediaElementSource(v).connect(gain);
    gain.connect(dest);
    let laid = null;
    if (opts.lay) {
      laid = ctx.createBufferSource();
      laid.buffer = opts.lay;
      const lg = ctx.createGain();
      lg.gain.value = 1;
      laid.connect(lg);
      lg.connect(dest);
    }

    const out = new MediaStream(pic.getVideoTracks().concat(dest.stream.getAudioTracks()));
    const type = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      .find((t) => MediaRecorder.isTypeSupported(t)) || "video/webm";
    const r = new MediaRecorder(out, { mimeType: type, videoBitsPerSecond: 4200000 });
    const got = [];
    r.ondataavailable = (e) => { if (e.data && e.data.size) got.push(e.data); };

    v.currentTime = from;
    await new Promise((go) => v.addEventListener("seeked", go, { once: true }));
    r.start(1000);
    await v.play();
    if (laid) laid.start(ctx.currentTime + Math.max(0, (opts.layAt || from) - from));

    await new Promise((go) => {
      const frame = () => {
        if (v.currentTime >= to - 0.02 || v.ended) { go(); return; }
        g.drawImage(v, 0, 0, c.width, c.height);
        const inHole = opts.hole && v.currentTime >= opts.hole.a && v.currentTime <= opts.hole.b;
        gain.gain.value = inHole ? 0 : 1;
        step("Re-recording the film at playback speed", (v.currentTime - from) / Math.max(0.1, to - from));
        window.requestAnimationFrame(frame);
      };
      frame();
    });
    v.pause();
    r.stop();
    await new Promise((go) => { r.onstop = go; });
    if (laid) { try { laid.stop(); } catch (e) {} }
    if (ctx.close) ctx.close();
    URL.revokeObjectURL(v.src);
    step("");
    return new Blob(got, { type: type });
  }

  async function withGuard(label, run) {
    if (busy) return;
    lock(true);
    say("");
    try {
      await run();
    } catch (err) {
      say(label + " failed: " + (err && err.message ? err.message : "no reason given"), true);
      step("");
    }
    lock(false);
  }

  if (el.crop) el.crop.addEventListener("click", () => withGuard("The crop", async () => {
    const r = range();
    if (!r) throw new Error("set a mark in and a mark out first — the two are in the same place");
    remember();
    if (KIND === "video") {
      step("Re-recording the film at playback speed", 0);
      replace(await recut({ from: r.a, to: r.b }));
    } else {
      step("Cutting the sound");
      const buf = await decodeAudio(workBlob);
      replace(await encodeAudio(cropBuffer(buf, r.a, r.b)));
      step("");
    }
    markIn = null; markOut = null; drawMarks();
    say("Cropped to " + clock(r.b - r.a) + ".");
  }));

  if (el.mute) el.mute.addEventListener("click", () => withGuard("The removal", async () => {
    const r = range();
    if (!r) throw new Error("mark the stretch you want silent first");
    remember();
    if (KIND === "video") {
      step("Re-recording the film at playback speed", 0);
      replace(await recut({ from: 0, to: span(), hole: r }));
    } else {
      step("Silencing the stretch");
      const buf = await decodeAudio(workBlob);
      replace(await encodeAudio(silenceBuffer(buf, r.a, r.b)));
      step("");
    }
    say("The sound between " + clock(r.a) + " and " + clock(r.b) + " is gone; the length is unchanged.");
  }));

  if (el.insFile) el.insFile.addEventListener("change", () => {
    if (el.insert) el.insert.disabled = !(el.insFile.files && el.insFile.files.length);
  });

  if (el.insert) el.insert.addEventListener("click", () => withGuard("The insert", async () => {
    const f = el.insFile && el.insFile.files && el.insFile.files[0];
    if (!f) throw new Error("choose an audio file first");
    const at = media ? media.currentTime : 0;
    const other = await decodeAudio(f);
    remember();
    if (KIND === "video") {
      step("Re-recording the film at playback speed", 0);
      replace(await recut({ from: 0, to: span(), lay: other, layAt: at }));
      say("Laid over the film from " + clock(at) + " — " + clock(other.duration) + " of it.");
    } else {
      step("Splicing it in");
      const buf = await decodeAudio(workBlob);
      replace(await encodeAudio(spliceBuffer(buf, other, at)));
      step("");
      say("Spliced in at " + clock(at) + " — the recording is now " +
        clock((buf.duration || 0) + other.duration) + " long.");
    }
  }));

  if (el.download) el.download.addEventListener("click", () => {
    if (!workBlob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(workBlob);
    a.download = (el.name && el.name.value ? el.name.value.replace(/[^\w .-]+/g, " ").trim() : "egregora") +
      (KIND === "video" ? ".webm" : (workBlob.type.indexOf("mpeg") > -1 ? ".mp3" : ".wav"));
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 20000);
  });

  if (el.archive) el.archive.addEventListener("click", () => withGuard("The archiving", async () => {
    if (!workBlob) throw new Error("there is nothing in the editor");
    const rec2 = {
      id: workId || newId(),
      name: (el.name && el.name.value.trim()) || ((KIND === "video" ? "Film" : "Recording") + " " + when(Date.now())),
      kind: KIND,
      mime: workBlob.type || "",
      size: workBlob.size,
      seconds: Math.round(span() || 0),
      made: workId ? undefined : Date.now(),
      saved: Date.now(),
      blob: workBlob
    };
    if (rec2.made === undefined) {
      const old = await store.get(rec2.id);
      rec2.made = (old && old.made) || Date.now();
    }
    await store.put(rec2);
    workId = rec2.id;
    await refreshFiles();
    say("Kept in this device's archive as " + rec2.name + ".");
  }));

  /* -------------------------------------------------------- the file table */
  function cell(row, text, head) {
    const c = document.createElement(head ? "th" : "td");
    if (head) c.setAttribute("scope", "row");
    c.textContent = text;
    row.appendChild(c);
    return c;
  }

  async function refreshFiles() {
    if (!el.rows) return;
    let list = [];
    try { list = (await store.all()) || []; } catch (err) { list = []; }
    list.sort((a, b) => (b.saved || b.made || 0) - (a.saved || a.made || 0));
    el.rows.innerHTML = "";
    if (el.empty) el.empty.hidden = list.length > 0;
    if (el.table) el.table.hidden = list.length === 0;
    list.forEach((f) => {
      const tr = document.createElement("tr");
      if (f.id === workId) tr.className = "is-open";
      cell(tr, f.name || "—", true);
      cell(tr, f.kind === "video" ? "Film" : "Audio");
      cell(tr, f.seconds ? clock(f.seconds) : "—");
      cell(tr, weigh(f.size));
      cell(tr, when(f.made || f.saved));
      const doers = document.createElement("td");
      doers.className = "cell-do";
      const make = (label, run, ghost) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn btn--tiny" + (ghost ? " btn--ghost" : "");
        b.textContent = label;
        b.addEventListener("click", run);
        doers.appendChild(b);
        return b;
      };
      const mine = f.kind === KIND;
      const edit = make("Edit", async () => {
        const full = await store.get(f.id);
        if (!full) return;
        if (!mine) {
          say("That one is " + (f.kind === "video" ? "a film" : "audio") +
            " — open it on the " + (f.kind === "video" ? "Videos" : "Podcasts") + " page to edit it.", true);
          return;
        }
        loadIntoEditor(full.blob, full.id, full.name);
        refreshFiles();
      });
      if (!mine) edit.classList.add("is-elsewhere");
      make("Rename", async () => {
        const full = await store.get(f.id);
        if (!full) return;
        const next = window.prompt("Call it what?", full.name || "");
        if (next === null) return;
        full.name = next.trim() || full.name;
        await store.put(full);
        refreshFiles();
      }, true);
      make("Download", async () => {
        const full = await store.get(f.id);
        if (!full) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(full.blob);
        a.download = (full.name || "egregora").replace(/[^\w .-]+/g, " ").trim() +
          (full.kind === "video" ? ".webm" : (String(full.mime).indexOf("mpeg") > -1 ? ".mp3" : ".wav"));
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(a.href), 20000);
      }, true);
      make("Delete", async () => {
        if (!window.confirm("Delete " + (f.name || "this file") + " from this device?")) return;
        await store.drop(f.id);
        if (workId === f.id) workId = null;
        refreshFiles();
      }, true);
      tr.appendChild(doers);
      el.rows.appendChild(tr);
    });
  }

  refreshFiles();
}
