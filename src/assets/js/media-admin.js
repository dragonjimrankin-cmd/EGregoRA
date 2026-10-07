/* ===========================================================================
   The publishing doors — Admin Only, on /podcast/ and /videos/
   ---------------------------------------------------------------------------
   Behind the order's passcode: hand over a recording, let it be cleaned up,
   write the few lines that go with it, and it joins the list on the page.

   The cleaning happens *here*, in the browser, and that is a deliberate
   choice rather than a shortcut. A server function has no ffmpeg and a
   strict clock; a browser has the whole Web Audio engine sitting idle. So
   the file is decoded, run through a real chain — rumble filter, gate,
   compressor, tone, loudness match, limiter, trimmed silence, fades — and
   rendered offline, usually faster than real time. Nothing leaves the
   machine until it has been listened to.

   Film is the harder case and is treated honestly. There is no transcoder
   in a browser, so a graded film is *re-recorded* through a canvas and a
   MediaRecorder at playback speed: twenty minutes of film takes twenty
   minutes, and the result is WebM. That is said plainly in the panel, and
   uploading the original untouched is always the first option.
   ======================================================================== */

import { countdown } from "./live.js";

/* The MP3 encoder is served from this site, not from a CDN. It used to be
   fetched from unpkg, which failed outright when that host was unreachable
   and took the whole admin panel down with it — so the library now ships
   with the site and is loaded once, lazily, the first time something needs
   to encode. */
let lamePromise = null;
function lameJS() {
  if (!lamePromise) {
    lamePromise = import("./vendor/lamejs.js")
      .then((mod) => (mod && mod.Mp3Encoder ? mod : (mod && mod.default) || mod))
      .catch((err) => { lamePromise = null; throw err; });
  }
  return lamePromise;
}

const panels = document.querySelectorAll("[data-admin-media]");
panels.forEach(setup);

function setup(root) {
  const KIND = root.getAttribute("data-admin-media") === "video" ? "video" : "audio";
  const $ = (sel) => root.querySelector(sel);
  const el = {
    open: $("[data-am=open]"),
    panel: $("[data-am=panel]"),
    pass: $("[data-am=pass]"),
    signin: $("[data-am=signin]"),
    msg: $("[data-am=msg]"),
    work: $("[data-am=work]"),
    file: $("[data-am=file]"),
    before: $("[data-am=before]"),
    after: $("[data-am=after]"),
    opts: $("[data-am=opts]"),
    run: $("[data-am=run]"),
    bar: $("[data-am=bar]"),
    preview: $("[data-am=preview]"),
    meta: $("[data-am=meta]"),
    title: $("[data-am=title]"),
    number: $("[data-am=number]"),
    summary: $("[data-am=summary]"),
    tags: $("[data-am=tags]"),
    send: $("[data-am=send]"),
    shelf: $("[data-am=shelf]"),
    loud: $("[data-am=loud]")
  };
  if (!el.open || !el.panel) return;

  let pass = "";
  let source = null;           /* the file as chosen */
  let ready = null;            /* { blob, mime, seconds, treatment, bytes } */

  const say = (t, bad) => {
    if (!el.msg) return;
    el.msg.textContent = t || "";
    el.msg.className = "auth-msg" + (bad ? " is-bad" : "");
  };
  const step = (t, frac) => {
    if (!el.bar) return;
    el.bar.hidden = false;
    el.bar.textContent = t;
    el.bar.style.setProperty("--done", Math.round((frac || 0) * 100) + "%");
  };
  const mb = (n) => (n / 1048576).toFixed(1) + " MB";
  const clock = (s) => {
    s = Math.round(s || 0);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return (h ? h + "h " : "") + (h ? String(m).padStart(2, "0") : m) + "m " +
      String(s % 60).padStart(2, "0") + "s";
  };
  const esc = (t) => String(t == null ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const post = (payload) => fetch("/api/media", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(Object.assign({ pass }, payload))
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "the shelf refused that");
    return data;
  });

  /* ------------------------------------------------------------- the door */
  el.open.addEventListener("click", () => {
    const shut = el.panel.hidden;
    el.panel.hidden = !shut;
    el.open.setAttribute("aria-expanded", String(shut));
    el.open.textContent = shut ? "Close the admin door" : "Admin Only";
    if (shut && el.pass) el.pass.focus();
  });

  if (el.signin) el.signin.addEventListener("click", async (e) => {
    e.preventDefault();
    pass = (el.pass && el.pass.value) || "";
    if (!pass) return say("The passcode, please.", true);
    try {
      say("Opening\u2026");
      const d = await post({ action: "shelf", kind: KIND });
      el.work.hidden = false;
      if (el.pass) el.pass.value = "";
      say("Open. The passcode is not kept \u2014 closing the page locks it again.");
      drawShelf(d.items || []);
      fillNumber();
    } catch (err) {
      pass = "";
      say((err && err.message) || "That did not open it.", true);
    }
  });

  /* --------------------------------------------------------- the audio work
     One chain, used twice: rendered offline for an episode, and wired live
     into the recorder for a film's sound. */
  const CHAIN = (ctx, src, look, want) => {
    let node = src;
    const link = (n) => { node.connect(n); node = n; return n; };

    if (want.rumble) {
      /* Below about 70 Hz a spoken recording holds nothing but traffic,
         table knocks and the room's own breathing. */
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass"; hp.frequency.value = 72; hp.Q.value = 0.7;
      link(hp);
    }

    if (want.gate && look.floor > 0) {
      /* A true gate needs sample-level logic; what an offline graph can do
         honestly is pull down the band where hiss lives without touching
         the voice. It is a hiss shelf, so it is called one. */
      const hiss = ctx.createBiquadFilter();
      hiss.type = "highshelf"; hiss.frequency.value = 7200;
      hiss.gain.value = Math.max(-9, Math.min(0, 20 * Math.log10(look.floor) * 0.3));
      link(hiss);
    }

    if (want.tone) {
      const mud = ctx.createBiquadFilter();
      mud.type = "peaking"; mud.frequency.value = 300; mud.Q.value = 1.1; mud.gain.value = -2.4;
      link(mud);
      const presence = ctx.createBiquadFilter();
      presence.type = "peaking"; presence.frequency.value = 3200; presence.Q.value = 0.9; presence.gain.value = 2.6;
      link(presence);
      const air = ctx.createBiquadFilter();
      air.type = "highshelf"; air.frequency.value = 11000; air.gain.value = 1.6;
      link(air);
    }

    if (want.deess) {
      const s = ctx.createBiquadFilter();
      s.type = "peaking"; s.frequency.value = 6400; s.Q.value = 2.6; s.gain.value = -3.2;
      link(s);
    }

    if (want.level) {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -22; comp.knee.value = 8;
      comp.ratio.value = 3.2; comp.attack.value = 0.008; comp.release.value = 0.22;
      link(comp);
    }

    /* Match the loudness: a rough gain to the target, then a hard, fast
       compressor standing in for a brickwall limiter so the peaks that
       survive cannot clip. */
    const gain = ctx.createGain();
    gain.value = 1;
    if (want.loud && look.rms > 0) {
      const wantRms = Math.pow(10, want.target / 20);
      gain.gain.value = Math.max(0.2, Math.min(8, wantRms / look.rms));
    }
    link(gain);

    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -1.2; lim.knee.value = 0;
    lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
    link(lim);

    return node;
  };

  /* --------------------------------------------------- the speechless parts
     Every recording has them: the pause while a page is turned, the long
     think, the forty seconds the kettle took. Finding them is a matter of
     measuring the sound in short windows, calling anything near the noise
     floor speechless, and joining neighbouring windows into runs.

     A run is only cut if it is longer than the patience you set, and even
     then a breath of it is left behind \u2014 silence removed completely
     sounds wrong, because a conversation has rhythm and an abrupt join
     reads as a mistake. */
  function findGaps(buf, holdFor, leave, floor) {
    const rate = buf.sampleRate;
    const win = Math.floor(rate * 0.04);                 /* forty milliseconds */
    const chans = Math.min(2, buf.numberOfChannels);
    const data = [];
    for (let c = 0; c < chans; c++) data.push(buf.getChannelData(c));

    /* Speech sits well above the floor; three times it, with a sensible
       minimum, keeps room tone from counting as talking. */
    const quietUnder = Math.max(floor * 3, 0.004);

    const loud = [];
    for (let i = 0; i < buf.length; i += win) {
      let sum = 0, n = 0;
      for (let j = i; j < Math.min(buf.length, i + win); j++) {
        let v = 0;
        for (let c = 0; c < chans; c++) v += data[c][j];
        sum += (v / chans) * (v / chans); n++;
      }
      loud.push(Math.sqrt(sum / Math.max(1, n)) > quietUnder);
    }

    const gaps = [];
    let from = -1;
    for (let i = 0; i <= loud.length; i++) {
      const speechless = i < loud.length ? !loud[i] : false;
      if (speechless && from < 0) from = i;
      if (!speechless && from >= 0) {
        const a = (from * win) / rate, b = (i * win) / rate;
        if (b - a >= holdFor) gaps.push({ from: a, to: b });
        from = -1;
      }
    }

    /* What is kept: everything either side of each gap, plus the breath
       left in the middle of it. */
    const keep = [];
    let at = 0;
    gaps.forEach((g) => {
      const half = leave / 2;
      keep.push({ from: at, to: Math.min(buf.duration, g.from + half) });
      at = Math.max(0, g.to - half);
    });
    keep.push({ from: at, to: buf.duration });

    const saved = gaps.reduce((n, g) => n + (g.to - g.from) - leave, 0);
    return { gaps, keep: keep.filter((k) => k.to - k.from > 0.02), saved: Math.max(0, saved) };
  }

  /* What is actually in the file: peak, loudness, noise floor, silence at
     each end. Measured on a single downmixed pass. */
  function inspect(buf) {
    const n = buf.length, chans = buf.numberOfChannels;
    const data = [];
    for (let c = 0; c < chans; c++) data.push(buf.getChannelData(c));
    let peak = 0, sum = 0;
    const win = Math.max(1, Math.floor(buf.sampleRate * 0.05));
    const quiet = [];
    let wsum = 0, wn = 0, head = -1, tail = -1;
    for (let i = 0; i < n; i++) {
      let v = 0;
      for (let c = 0; c < chans; c++) v += data[c][i];
      v /= chans;
      const a = Math.abs(v);
      if (a > peak) peak = a;
      sum += v * v;
      wsum += v * v; wn++;
      if (a > 0.012) { if (head < 0) head = i; tail = i; }
      if (wn >= win) { quiet.push(Math.sqrt(wsum / wn)); wsum = 0; wn = 0; }
    }
    quiet.sort((a, b) => a - b);
    const floor = quiet.length ? quiet[Math.floor(quiet.length * 0.08)] : 0;
    const rms = Math.sqrt(sum / Math.max(1, n));
    return {
      peak, rms, floor,
      seconds: buf.duration,
      rate: buf.sampleRate,
      chans,
      head: head < 0 ? 0 : head / buf.sampleRate,
      tail: tail < 0 ? buf.duration : tail / buf.sampleRate
    };
  }

  const dB = (v) => (v > 0 ? (20 * Math.log10(v)).toFixed(1) + " dB" : "\u2212\u221e");

  const reading = (look, head) =>
    "<p class=\"kicker\">" + head + "</p><ul class=\"am-read\">" +
    "<li>Length <strong>" + clock(look.seconds) + "</strong></li>" +
    "<li>Peak <strong>" + dB(look.peak) + "</strong></li>" +
    "<li>Loudness (RMS) <strong>" + dB(look.rms) + "</strong></li>" +
    "<li>Noise floor <strong>" + dB(look.floor) + "</strong></li>" +
    "<li>" + look.rate + " Hz, " + (look.chans === 1 ? "mono" : look.chans + " channels") + "</li>" +
    "</ul>";

  const wants = () => {
    const on = (name) => {
      const box = root.querySelector('[data-want="' + name + '"]');
      return box ? box.checked : false;
    };
    return {
      rumble: on("rumble"), gate: on("gate"), tone: on("tone"), deess: on("deess"),
      level: on("level"), loud: on("loud"), trim: on("trim"), fade: on("fade"),
      gaps: on("gaps"),
      gapHold: Number((root.querySelector("[data-am=gaphold]") || {}).value || 1.5),
      gapLeave: Number((root.querySelector("[data-am=gapleave]") || {}).value || 0.45),
      target: el.loud ? Number(el.loud.value) : -18,
      grade: on("grade"), shrink: on("shrink")
    };
  };

  /* ---------------------------------------------------------- the vocabulary
     The house's own subject words, as chips. Tapping one adds it to the
     tag field; tapping it again takes it off. The field stays editable \u2014
     the chips are a shortcut, not a cage. */
  (function tagChips() {
    const field = el.tags;
    if (!field) return;
    const read = () => field.value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    const write = (list) => {
      field.value = list.filter((t, i, all) => all.indexOf(t) === i).join(", ");
      mark();
    };
    const mark = () => {
      const have = new Set(read());
      root.querySelectorAll(".am-chip").forEach((c) =>
        c.setAttribute("aria-pressed", String(have.has(c.getAttribute("data-tag")))));
    };
    root.querySelectorAll(".am-chip").forEach((c) => c.addEventListener("click", () => {
      const tag = c.getAttribute("data-tag");
      const have = read();
      write(have.indexOf(tag) >= 0 ? have.filter((t) => t !== tag) : have.concat([tag]));
    }));
    field.addEventListener("input", mark);
    mark();
    el.markTags = mark;
  })();

  /* ====================================================== recording in place
     Not every episode starts as a file. This opens the machine's own
     microphone (or camera, on the films page), gives you ten seconds to
     settle \u2014 to sit down, clear your throat, look at the lens \u2014 and
     then records straight into the page. What comes out is handed to
     exactly the same enhancer, listing and publishing as an uploaded file,
     because it is the same thing: a recording. */
  (function recordHere() {
    const open = root.querySelector("[data-am=rec-open]");
    const box = root.querySelector("[data-am=rec]");
    if (!open || !box) return;

    const r = (n) => root.querySelector('[data-am="rec-' + n + '"]');
    let stream = null, rec = null, bits = [], started = 0, tick = null, cancel = null, meter = null;

    const state = (t) => { const n = r("state"); if (n) n.textContent = t || ""; };

    open.addEventListener("click", () => {
      const shut = box.hidden;
      box.hidden = !shut;
      open.textContent = shut ? "Hide the recorder" : "Record it here instead";
    });

    /* A level meter, because recording blind is how an hour gets lost to a
       muted microphone. */
    function watchLevel(src) {
      const canvas = r("meter");
      if (!canvas) return;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const node = ctx.createMediaStreamSource(src);
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      node.connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      const g = canvas.getContext("2d");
      meter = { ctx, live: true };
      const draw = () => {
        if (!meter || !meter.live) return;
        an.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128) / 128);
        g.clearRect(0, 0, canvas.width, canvas.height);
        g.fillStyle = peak > 0.95 ? "#c98b6a" : "#d7b05a";
        g.fillRect(0, 10, canvas.width * Math.min(1, peak * 1.6), canvas.height - 20);
        g.strokeStyle = "rgba(215,176,90,0.3)";
        g.strokeRect(0.5, 9.5, canvas.width - 1, canvas.height - 19);
        requestAnimationFrame(draw);
      };
      draw();
    }

    r("start").addEventListener("click", async () => {
      try {
        const kind = KIND;
        const how = r("source") ? r("source").value : "mic";
        const q = r("quality") ? r("quality").value : "mid";
        const size = q === "high" ? 1920 : q === "low" ? 854 : 1280;

        if (kind === "video" && how === "screen") {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          const mic = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
          if (mic) mic.getAudioTracks().forEach((t) => stream.addTrack(t));
        } else if (kind === "video") {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: size }, frameRate: { ideal: 30 } },
            audio: { echoCancellation: true, noiseSuppression: true }
          });
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
          });
        }

        const mirror = r("mirror");
        if (mirror) { mirror.srcObject = stream; mirror.play().catch(() => {}); }
        if (KIND === "audio") watchLevel(stream);

        state("Microphone open. Ten seconds \u2014 settle, and start when the count clears.");
        r("start").disabled = true;
        cancel = countdown(r("count"), 10, () => go(q));
      } catch (err) {
        state((err && err.message) || "The device would not open.");
        r("start").disabled = false;
      }
    });

    function go(q) {
      const type = KIND === "audio"
        ? (["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]
          .find((t) => MediaRecorder.isTypeSupported(t)) || "")
        : (["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
          .find((t) => MediaRecorder.isTypeSupported(t)) || "video/webm");

      bits = [];
      rec = new MediaRecorder(stream, Object.assign({ mimeType: type || undefined },
        KIND === "audio"
          ? { audioBitsPerSecond: 128000 }
          : { videoBitsPerSecond: q === "high" ? 6000000 : q === "low" ? 1500000 : 3000000 }));
      rec.ondataavailable = (e) => { if (e.data && e.data.size) bits.push(e.data); };
      rec.onstop = finish;
      rec.start(1000);
      started = Date.now();
      r("stop").disabled = false;
      root.classList.add("is-recording");
      tick = setInterval(() => state("Recording \u2014 " + clock((Date.now() - started) / 1000)), 500);
      say("Recording. Press stop when you are done; it goes straight to the enhancer.");
    }

    r("stop").addEventListener("click", () => {
      if (rec && rec.state !== "inactive") rec.stop();
      r("stop").disabled = true;
    });

    async function finish() {
      clearInterval(tick);
      root.classList.remove("is-recording");
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (meter) { meter.live = false; meter.ctx.close().catch(() => {}); meter = null; }
      r("start").disabled = false;

      const blob = new Blob(bits, { type: bits[0] ? bits[0].type : "audio/webm" });
      state("Recorded " + clock((Date.now() - started) / 1000) + " \u2014 " + mb(blob.size) + ".");
      /* Hand it to the same path a chosen file takes. */
      source = blob;
      ready = null;
      if (el.title && !el.title.value) {
        el.title.value = (KIND === "audio" ? "Recorded " : "Filmed ") +
          new Date().toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
      }
      try {
        if (KIND === "audio") {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          fileBuf = await ctx.decodeAudioData(await blob.arrayBuffer());
          ctx.close();
          fileLook = inspect(fileBuf);
          el.before.innerHTML = reading(fileLook, "As it was recorded");
        } else {
          fileLook = { seconds: (Date.now() - started) / 1000 };
          el.before.innerHTML = '<p class="kicker">As it was recorded</p><ul class="am-read">' +
            "<li>Length <strong>" + clock(fileLook.seconds) + "</strong></li>" +
            "<li>Weight <strong>" + mb(blob.size) + "</strong></li></ul>";
        }
        if (el.meta) el.meta.hidden = false;
        if (el.send) el.send.disabled = false;
        say("Recorded. Enhance it, have it transcribed, then publish.");
      } catch (err) {
        say((err && err.message) || "The recording could not be read back.", true);
      }
    }
  })();

  /* ------------------------------------------------------------ the chooser */
  let fileBuf = null, fileLook = null;

  if (el.file) el.file.addEventListener("change", async () => {
    const f = el.file.files && el.file.files[0];
    ready = null;
    if (el.meta) el.meta.hidden = true;
    if (el.after) el.after.innerHTML = "";
    if (!f) return;
    source = f;
    if (el.title && !el.title.value) {
      el.title.value = f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
    }
    say("Reading " + f.name + " \u2014 " + mb(f.size) + "\u2026");
    try {
      if (KIND === "audio") {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        fileBuf = await ctx.decodeAudioData(await f.arrayBuffer());
        ctx.close();
        fileLook = inspect(fileBuf);
        el.before.innerHTML = reading(fileLook, "As it arrived");
        say("Read. Choose what to do to it, then enhance.");
      } else {
        const probe = document.createElement("video");
        probe.preload = "metadata";
        probe.src = URL.createObjectURL(f);
        await new Promise((go, no) => {
          probe.onloadedmetadata = go;
          probe.onerror = () => no(new Error("that file is not a film this browser can open"));
        });
        fileLook = { seconds: probe.duration, w: probe.videoWidth, h: probe.videoHeight };
        el.before.innerHTML = '<p class="kicker">As it arrived</p><ul class="am-read">' +
          "<li>Length <strong>" + clock(probe.duration) + "</strong></li>" +
          "<li>Frame <strong>" + probe.videoWidth + "\u00d7" + probe.videoHeight + "</strong></li>" +
          "<li>Weight <strong>" + mb(f.size) + "</strong></li></ul>";
        say("Read. Grading re-records the film at playback speed \u2014 " +
          clock(probe.duration) + " of film takes about that long.");
      }
      if (el.meta) el.meta.hidden = false;
      if (el.send) el.send.disabled = false;
    } catch (err) {
      say((err && err.message) || "That file could not be read.", true);
    }
  });

  /* ------------------------------------------------------------ the cleaning */
  if (el.run) el.run.addEventListener("click", async () => {
    if (!source) return say("Choose a file first.", true);
    const want = wants();
    el.run.disabled = true;
    try {
      if (KIND === "audio") await enhanceAudio(want);
      else await enhanceVideo(want);
    } catch (err) {
      say((err && err.message) || "The enhancement failed.", true);
    } finally {
      el.run.disabled = false;
    }
  });

  async function enhanceAudio(want) {
    if (!fileBuf) return say("Choose a file first.", true);
    step("Rendering\u2026", 0.1);
    const rate = fileBuf.sampleRate;

    /* The speechless stretches, if they are to come out. The kept pieces
       are laid end to end into one buffer first and the chain runs over the
       result, so a join cannot be heard as a change in tone. */
    let working = fileBuf, workLook = fileLook, cutNote = "";
    if (want.gaps) {
      step("Finding the speechless stretches\u2026", 0.18);
      const found = findGaps(fileBuf, want.gapHold, want.gapLeave, fileLook.floor);
      if (found.gaps.length) {
        const total = found.keep.reduce((n, k) => n + (k.to - k.from), 0);
        const join = new OfflineAudioContext(Math.min(2, fileBuf.numberOfChannels),
          Math.max(1, Math.floor(total * rate)), rate);
        let at = 0;
        found.keep.forEach((k) => {
          const piece = join.createBufferSource();
          piece.buffer = fileBuf;
          const g = join.createGain();
          const len = k.to - k.from;
          g.gain.setValueAtTime(0, at);
          g.gain.linearRampToValueAtTime(1, at + 0.01);
          g.gain.setValueAtTime(1, at + Math.max(0.02, len - 0.01));
          g.gain.linearRampToValueAtTime(0, at + len);
          piece.connect(g); g.connect(join.destination);
          piece.start(at, k.from, len);
          at += len;
        });
        step("Closing " + found.gaps.length + " speechless stretch(es)\u2026", 0.3);
        working = await join.startRendering();
        workLook = inspect(working);
        cutNote = found.gaps.length + " speechless stretch" + (found.gaps.length === 1 ? "" : "es") +
          " shortened, " + clock(found.saved) + " saved";
      } else {
        cutNote = "no speechless stretch ran longer than " + want.gapHold + "s";
      }
    }

    let from = 0, to = working.duration;
    if (want.trim) {
      from = Math.max(0, workLook.head - 0.25);
      to = Math.min(working.duration, workLook.tail + 0.4);
    }
    const frames = Math.max(1, Math.floor((to - from) * rate));
    const off = new OfflineAudioContext(Math.min(2, working.numberOfChannels), frames, rate);

    const src = off.createBufferSource();
    src.buffer = working;
    const out = CHAIN(off, src, workLook, want);

    if (want.fade) {
      const f = off.createGain();
      const end = (to - from);
      f.gain.setValueAtTime(0, 0);
      f.gain.linearRampToValueAtTime(1, 0.35);
      f.gain.setValueAtTime(1, Math.max(0.4, end - 0.7));
      f.gain.linearRampToValueAtTime(0, end);
      out.connect(f); f.connect(off.destination);
    } else {
      out.connect(off.destination);
    }
    src.start(0, from, to - from);

    const done = await off.startRendering();
    step("Measuring\u2026", 0.7);
    const look = inspect(done);
    el.after.innerHTML = reading(look, "After the work") +
      (cutNote ? '<p class="muted xsmall">' + cutNote + ".</p>" : "");

    step("Encoding\u2026", 0.85);
    const made = await encode(done);
    const treatment = [
      want.rumble && "rumble filtered below 72 Hz",
      want.gate && "hiss shelved",
      want.tone && "tone shaped (mud down, presence and air up)",
      want.deess && "de-essed",
      want.level && "levelled",
      want.loud && ("matched to " + want.target + " dB RMS"),
      want.gaps && cutNote,
      want.trim && "silence trimmed from both ends",
      want.fade && "faded in and out"
    ].filter(Boolean).join(", ") || "left as it was";

    ready = { blob: made.blob, mime: made.mime, seconds: done.duration, treatment, look };
    showPreview(made.blob, "audio");
    step("Done \u2014 " + mb(made.blob.size) + " as " + made.label, 1);
    say("Enhanced: " + treatment + ". Listen to it, then publish.");
    if (el.meta) el.meta.hidden = false;
  }

  /* MP3 if lamejs will load, WAV if it will not. An hour of WAV is half a
     gigabyte, so the MP3 route matters; failing over to WAV is better than
     failing. */
  async function encode(buf) {
    try {
      const lame = await lameJS();
      const chans = Math.min(2, buf.numberOfChannels);
      const enc = new lame.Mp3Encoder(chans, buf.sampleRate, 128);
      const L = buf.getChannelData(0);
      const R = chans > 1 ? buf.getChannelData(1) : null;
      const to16 = (f) => {
        const o = new Int16Array(f.length);
        for (let i = 0; i < f.length; i++) {
          const v = Math.max(-1, Math.min(1, f[i]));
          o[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
        }
        return o;
      };
      const l16 = to16(L), r16 = R ? to16(R) : null;
      const BLOCK = 1152, out = [];
      for (let i = 0; i < l16.length; i += BLOCK) {
        const a = l16.subarray(i, i + BLOCK);
        const b = r16 ? r16.subarray(i, i + BLOCK) : undefined;
        const buf8 = chans > 1 ? enc.encodeBuffer(a, b) : enc.encodeBuffer(a);
        if (buf8.length) out.push(new Uint8Array(buf8));
        if (i % (BLOCK * 400) === 0) {
          step("Encoding\u2026 " + Math.round((i / l16.length) * 100) + "%", 0.85 + (i / l16.length) * 0.14);
          await new Promise((r2) => setTimeout(r2, 0));
        }
      }
      const tail = enc.flush();
      if (tail.length) out.push(new Uint8Array(tail));
      return { blob: new Blob(out, { type: "audio/mpeg" }), mime: "audio/mpeg", label: "MP3" };
    } catch {
      return { blob: wav(buf), mime: "audio/wav", label: "WAV (the MP3 encoder would not load)" };
    }
  }

  function wav(buf) {
    const chans = Math.min(2, buf.numberOfChannels), n = buf.length, rate = buf.sampleRate;
    const bytes = 44 + n * chans * 2;
    const v = new DataView(new ArrayBuffer(bytes));
    const str = (at, s) => { for (let i = 0; i < s.length; i++) v.setUint8(at + i, s.charCodeAt(i)); };
    str(0, "RIFF"); v.setUint32(4, bytes - 8, true); str(8, "WAVEfmt ");
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, chans, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * chans * 2, true);
    v.setUint16(32, chans * 2, true); v.setUint16(34, 16, true);
    str(36, "data"); v.setUint32(40, n * chans * 2, true);
    let at = 44;
    const data = [];
    for (let c = 0; c < chans; c++) data.push(buf.getChannelData(c));
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < chans; c++) {
        const s = Math.max(-1, Math.min(1, data[c][i]));
        v.setInt16(at, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        at += 2;
      }
    }
    return new Blob([v.buffer], { type: "audio/wav" });
  }

  /* --------------------------------------------------------------- the film */
  async function enhanceVideo(want) {
    if (!window.MediaRecorder) throw new Error("this browser has no recorder, so the film cannot be graded here");
    const v = document.createElement("video");
    v.src = URL.createObjectURL(source);
    v.muted = true;
    await new Promise((go, no) => { v.onloadedmetadata = go; v.onerror = () => no(new Error("the film would not open")); });

    const cap = want.shrink ? 1280 : 1920;
    const scale = Math.min(1, cap / Math.max(1, v.videoWidth));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(v.videoWidth * scale / 2) * 2;
    canvas.height = Math.round(v.videoHeight * scale / 2) * 2;
    const ctx = canvas.getContext("2d");
    ctx.filter = want.grade
      ? "brightness(1.06) contrast(1.1) saturate(1.12)"
      : "none";

    const stream = canvas.captureStream(30);

    /* The film's own sound, through the same chain an episode gets. */
    let ac = null;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const src = ac.createMediaElementSource(v);
      const dest = ac.createMediaStreamDestination();
      const look = { peak: 1, rms: 0.08, floor: 0.004 };
      CHAIN(ac, src, look, want).connect(dest);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    } catch { /* a silent film, then */ }

    const type = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      .find((t) => MediaRecorder.isTypeSupported(t)) || "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: want.shrink ? 2800000 : 5200000 });
    const bits = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) bits.push(e.data); };

    const stopped = new Promise((go) => { rec.onstop = go; });
    rec.start(1000);
    await v.play();

    let live = true;
    const draw = () => {
      if (!live) return;
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      step("Re-recording \u2014 " + clock(v.currentTime) + " of " + clock(v.duration),
        v.duration ? v.currentTime / v.duration : 0);
      requestAnimationFrame(draw);
    };
    draw();
    await new Promise((go) => { v.onended = go; });
    live = false;
    rec.stop();
    await stopped;
    if (ac) ac.close().catch(() => {});

    const blob = new Blob(bits, { type: "video/webm" });
    const treatment = [
      want.grade && "graded (a touch of brightness, contrast and colour)",
      want.shrink && "reduced to 720p-class width",
      want.rumble && "sound rumble filtered",
      want.tone && "sound tone shaped",
      want.level && "sound levelled",
      want.loud && "sound loudness matched"
    ].filter(Boolean).join(", ") || "re-recorded unchanged";

    ready = { blob, mime: "video/webm", seconds: v.duration, treatment };
    el.after.innerHTML = '<p class="kicker">After the work</p><ul class="am-read">' +
      "<li>Frame <strong>" + canvas.width + "\u00d7" + canvas.height + "</strong></li>" +
      "<li>Weight <strong>" + mb(blob.size) + "</strong></li>" +
      "<li>WebM, VP9 where the browser allows it</li></ul>";
    showPreview(blob, "video");
    step("Done \u2014 " + mb(blob.size), 1);
    say("Graded: " + treatment + ". Watch it, then publish.");
  }

  function showPreview(blob, how) {
    if (!el.preview) return;
    el.preview.innerHTML = "";
    const node = document.createElement(how === "video" ? "video" : "audio");
    node.controls = true;
    node.src = URL.createObjectURL(blob);
    node.className = how === "video" ? "am-film" : "player";
    el.preview.appendChild(node);
  }

  /* ================================================== the ear and the archivist
     The listing writes itself from the recording. The sound is reduced to a
     small mono copy here \u2014 16 kHz, 32 kbps, in ten-minute stretches \u2014
     because the services that transcribe take about 25 MB and an hour of
     stereo is twenty times that. The words come back in order, are joined,
     and the archivist writes the title, the summary, the tags and the
     sections of this site the episode actually touches.

     The links are checked against the real index of the site on the server,
     so the archivist cannot send a listener to a page that is not there. */
  const SEG = 600;            /* ten minutes a stretch */

  async function smallCopy(buf, from, to) {
    const rate = 16000;
    const frames = Math.max(1, Math.floor((to - from) * rate));
    const off = new OfflineAudioContext(1, frames, rate);
    const src = off.createBufferSource();
    src.buffer = buf;
    /* Speech lives between 90 Hz and 7 kHz; stripping the rest makes a
       smaller file the transcriber reads no worse. */
    const hp = off.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 90;
    src.connect(hp); hp.connect(off.destination);
    src.start(0, from, to - from);
    const done = await off.startRendering();

    const lame = await lameJS();
    const enc = new lame.Mp3Encoder(1, rate, 32);
    const f = done.getChannelData(0);
    const pcm = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) {
      const v = Math.max(-1, Math.min(1, f[i]));
      pcm[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
    }
    const out = [];
    for (let i = 0; i < pcm.length; i += 1152) {
      const b = enc.encodeBuffer(pcm.subarray(i, i + 1152));
      if (b.length) out.push(new Uint8Array(b));
    }
    const tail = enc.flush();
    if (tail.length) out.push(new Uint8Array(tail));
    return new Blob(out, { type: "audio/mpeg" });
  }

  let listing = null;     /* what the archivist wrote, kept for the upload */

  async function transcribeAndDescribe(buf, seconds) {
    const parts = Math.max(1, Math.ceil(seconds / SEG));
    const words = [];
    let ear = "";

    for (let i = 0; i < parts; i++) {
      const from = i * SEG, to = Math.min(seconds, (i + 1) * SEG);
      step("Reducing stretch " + (i + 1) + " of " + parts + "\u2026", i / parts);
      const small = await smallCopy(buf, from, to);
      step("Listening to stretch " + (i + 1) + " of " + parts +
        " (" + mb(small.size) + ")\u2026", (i + 0.4) / parts);
      const upload = await sendBlob(small, () => {});
      const heard = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pass, action: "hear", upload, mime: "audio/mpeg" })
      }).then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "it could not be heard");
        return d;
      });
      ear = heard.by || ear;
      /* Stamp each stretch with where it began, so the archivist can give
         the episode its chapters. */
      words.push("[" + clock(from) + "] " + heard.text);
      step("Heard " + (i + 1) + " of " + parts, (i + 1) / parts);
    }

    const transcript = words.join("\n\n");
    step("Writing the listing\u2026", 0.95);
    const d = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pass, action: "describe", text: transcript, kind: KIND })
    }).then(async (r) => {
      const out = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(out.error || "the listing could not be written");
      return out;
    });

    listing = {
      transcript,
      links: d.links || [],
      topics: d.topics || [],
      tags: d.tags || []
    };
    if (el.title) el.title.value = d.title || el.title.value;
    if (el.summary) el.summary.value = d.summary || el.summary.value;
    if (el.tags) { el.tags.value = (d.tags || []).join(", "); if (el.markTags) el.markTags(); }
    if (el.meta) el.meta.hidden = false;

    const n = root.querySelector("[data-am=listing]");
    if (n) {
      n.hidden = false;
      n.innerHTML = '<p class="kicker">What it heard</p>' +
        '<p class="muted small">Transcribed by ' + esc(ear || "the ear") +
        ", described by " + esc(d.by || "a model") + ". " +
        transcript.length.toLocaleString() + " characters of transcript, kept with the episode.</p>" +
        ((d.links || []).length
          ? '<p class="kicker">It touches these parts of the site</p><ul class="am-links">' +
            d.links.map((l) => '<li><a href="' + esc(l.href) + '">' + esc(l.title) + "</a> " +
              '<span class="muted xsmall">' + esc(l.why) + "</span></li>").join("") + "</ul>"
          : '<p class="muted small">It did not match any section of the site closely enough to link.</p>') +
        ((d.topics || []).length
          ? '<p class="kicker">Its shape</p><ul class="am-links">' +
            d.topics.map((t) => "<li><strong>" + clock(t.at) + "</strong> " + esc(t.heading) + "</li>").join("") +
            "</ul>"
          : "") +
        '<details class="scroll"><summary>The transcript</summary><pre class="code-block am-script">' +
        esc(transcript.slice(0, 40000)) + "</pre></details>";
    }
    step("The listing is written", 1);
    say("Listed: " + (d.title || "") + " \u2014 " + (d.tags || []).length + " tags, " +
      (d.links || []).length + " links into the site. Change anything you disagree with.");
  }

  const hearBtn = root.querySelector("[data-am=hear]");
  if (hearBtn) hearBtn.addEventListener("click", async () => {
    if (KIND !== "audio") return say("Only sound can be transcribed here.", true);
    if (!fileBuf) return say("Choose a recording first.", true);
    hearBtn.disabled = true;
    try {
      await transcribeAndDescribe(fileBuf, fileBuf.duration);
    } catch (err) {
      say((err && err.message) || "It could not be transcribed.", true);
    } finally {
      hearBtn.disabled = false;
    }
  });

  /* The next number in the run, filled in without being asked. */
  async function fillNumber() {
    if (KIND !== "audio" || !el.number) return;
    const after = Number(root.getAttribute("data-after") || 0);
    try {
      const d = await post({ action: "next-number", after });
      if (d && d.number && !el.number.value) el.number.value = d.number;
    } catch { /* type it by hand, then */ }
  }

  /* -------------------------------------------------------------- the upload */
  if (el.send) el.send.addEventListener("click", async () => {
    const blob = (ready && ready.blob) || source;
    if (!blob) return say("Nothing to publish yet.", true);
    const title = (el.title && el.title.value.trim()) || "";
    if (!title) return say("It needs a title.", true);

    el.send.disabled = true;
    try {
      const upload = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const begun = await post({ action: "begin", upload, mime: blob.type });
      const CH = Math.min(900000, begun.chunk_max || 900000);
      const raw = Math.floor(CH * 0.74);   /* base64 grows a third */
      const whole = new Uint8Array(await blob.arrayBuffer());
      const pieces = Math.ceil(whole.length / raw);

      for (let i = 0; i < pieces; i++) {
        const slice = whole.subarray(i * raw, (i + 1) * raw);
        let bin = "";
        for (let j = 0; j < slice.length; j++) bin += String.fromCharCode(slice[j]);
        await post({ action: "chunk", upload, seq: i, part: btoa(bin) });
        step("Sending \u2014 " + (i + 1) + " of " + pieces, (i + 1) / pieces);
      }

      const seconds = (ready && ready.seconds) || (fileLook && fileLook.seconds) || 0;
      const d = await post({
        action: "finish", upload, kind: KIND,
        title,
        summary: (el.summary && el.summary.value.trim()) || "",
        number: (el.number && el.number.value.trim()) || "",
        length: clock(seconds).replace(/ \d+s$/, ""),
        seconds: Math.round(seconds),
        tags: (el.tags && el.tags.value.trim()) || "",
        mime: blob.type || (KIND === "video" ? "video/webm" : "audio/mpeg"),
        original_bytes: source ? source.size : null,
        treatment: (ready && ready.treatment) || "uploaded as it arrived",
        after: Number(root.getAttribute("data-after") || 0),
        transcript: listing ? listing.transcript : null,
        links: listing ? listing.links : null,
        topics: listing ? listing.topics : null,
        publish: true
      });

      say("Published. It is on the page now \u2014 reload to see it in the list.");
      step("Published", 1);
      const shelf = await post({ action: "shelf", kind: KIND });
      drawShelf(shelf.items || []);
      if (window.EGMediaRefresh) window.EGMediaRefresh();
      if (d && d.item) addToPage(d.item);
    } catch (err) {
      say((err && err.message) || "The upload failed.", true);
    } finally {
      el.send.disabled = false;
    }
  });

  /* ========================================================= the editing room
     What an editor actually needs, and nothing it does not: cut a piece out,
     merge the pieces you kept, hang pictures on an episode, fix the writing,
     throw the whole thing away.

     Cutting is non-destructive until you say otherwise. Marking snippets
     builds a list; merging the chosen ones makes a new recording; and only
     then do you choose whether it replaces the original or stands beside it
     as a new entry. The original is never touched until that moment. */
  let byId = new Map();
  let edit = null;   /* { item, buf, snippets[], media } */

  function openEditor(item) {
    if (!item) return;
    const box = root.querySelector('[data-am=editor]');
    if (!box) return;
    edit = { item, buf: null, snippets: [], seconds: item.seconds || 0 };

    box.innerHTML =
      '<div class="frame am-editor">' +
      '<p class="kicker">Editing \u2014 ' + esc(item.title) + "</p>" +
      '<div class="am-ed-play"></div>' +
      '<p class="muted small" data-ed="state">Loading the ' +
      (KIND === "audio" ? "episode" : "film") + "\u2026</p>" +

      '<p class="kicker">The writing</p><div class="am-fields">' +
      '<div><label for="' + KIND + '-ed-title">Title</label>' +
      '<input type="text" id="' + KIND + '-ed-title" data-ed="title" value="' + esc(item.title) + '"></div>' +
      (KIND === "audio"
        ? '<div><label for="' + KIND + '-ed-number">Episode number</label>' +
          '<input type="text" id="' + KIND + '-ed-number" data-ed="number" value="' + esc(item.number) + '"></div>'
        : "") +
      '<div><label for="' + KIND + '-ed-tags">Tags</label>' +
      '<input type="text" id="' + KIND + '-ed-tags" data-ed="tags" value="' + esc(item.tags.join(", ")) + '"></div>' +
      "</div>" +
      '<label for="' + KIND + '-ed-summary">Summary</label>' +
      '<textarea id="' + KIND + '-ed-summary" data-ed="summary" rows="3">' + esc(item.summary) + "</textarea>" +
      '<div class="btn-row"><button class="btn btn--small" type="button" data-ed="save">Save the writing</button></div>' +

      '<div class="divider">\u2726</div>' +
      '<p class="kicker">Cut</p>' +
      '<p class="muted small">Play up to the point you want, press <em>Mark in</em>, play on, press ' +
      "<em>Mark out</em>, then cut. Nothing is lost until you save over the original.</p>" +
      '<div class="am-cut">' +
      '<button class="btn btn--small btn--ghost" type="button" data-ed="in">Mark in</button>' +
      '<span data-ed="inval" class="am-time">0:00</span>' +
      '<button class="btn btn--small btn--ghost" type="button" data-ed="out">Mark out</button>' +
      '<span data-ed="outval" class="am-time">0:00</span>' +
      '<button class="btn btn--small" type="button" data-ed="cut">Cut the snippet</button>' +
      '<button class="btn btn--small btn--ghost" type="button" data-ed="drop-range">Cut it OUT and keep the rest</button>' +
      "</div>" +
      '<div data-ed="snips"></div>' +
      '<div class="btn-row">' +
      '<button class="btn btn--small" type="button" data-ed="merge">Merge the chosen snippets</button>' +
      '<button class="btn btn--small btn--ghost" type="button" data-ed="whole">Start again from the whole thing</button>' +
      "</div>" +
      '<div data-ed="merged"></div>' +

      (KIND === "audio"
        ? '<div class="divider">\u2726</div>' +
          '<p class="kicker">Pictures</p>' +
          '<p class="muted small">A cover for the episode, and plates cued to a moment \u2014 the player ' +
          "raises each one as the sound reaches it.</p>" +
          '<label for="' + KIND + '-ed-img">Choose a picture</label>' +
          '<input type="file" id="' + KIND + '-ed-img" data-ed="img" accept="image/*">' +
          '<label for="' + KIND + '-ed-cap">Caption</label>' +
          '<input type="text" id="' + KIND + '-ed-cap" data-ed="cap" maxlength="300">' +
          '<div class="btn-row">' +
          '<button class="btn btn--small btn--ghost" type="button" data-ed="as-cover">Make it the cover</button>' +
          '<button class="btn btn--small" type="button" data-ed="as-cue">Insert it at the playhead</button>' +
          "</div>" +
          '<div data-ed="plates"></div>'
        : "") +

      '<div class="divider">\u2726</div>' +
      '<div class="btn-row">' +
      '<button class="btn btn--small btn--ghost" type="button" data-ed="close">Close the editor</button>' +
      '<button class="btn btn--small btn--ghost am-danger" type="button" data-ed="kill">Delete this ' +
      (KIND === "audio" ? "episode" : "film") + " for good</button>" +
      "</div></div>";

    const ed = (name) => box.querySelector('[data-ed="' + name + '"]');
    const tellEd = (t, bad) => { const n = ed("state"); if (n) { n.textContent = t; n.className = "muted small" + (bad ? " is-bad" : ""); } };

    /* The player everything else is measured against. */
    const player = document.createElement(KIND === "audio" ? "audio" : "video");
    player.controls = true;
    player.src = item.url;
    player.className = KIND === "audio" ? "player" : "am-film";
    player.crossOrigin = "anonymous";
    box.querySelector(".am-ed-play").appendChild(player);
    edit.player = player;

    let markIn = 0, markOut = 0;
    const show = () => {
      ed("inval").textContent = clock(markIn);
      ed("outval").textContent = clock(markOut);
    };
    show();

    ed("in").addEventListener("click", () => { markIn = player.currentTime; if (markOut < markIn) markOut = markIn; show(); });
    ed("out").addEventListener("click", () => { markOut = player.currentTime; if (markOut < markIn) markIn = markOut; show(); });

    /* Audio is fetched and decoded once, so cutting is instant and exact.
       Film is cut by re-recording the stretch you asked for, which is the
       only way a browser can do it \u2014 so it costs playback time. */
    if (KIND === "audio") {
      tellEd("Fetching the audio so it can be cut exactly\u2026");
      fetch(item.url).then((r) => r.arrayBuffer()).then(async (bytes) => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        edit.buf = await ctx.decodeAudioData(bytes);
        ctx.close();
        edit.seconds = edit.buf.duration;
        tellEd("Ready. " + clock(edit.buf.duration) + " of audio, cut to the sample.");
      }).catch(() => tellEd("The audio could not be fetched for cutting. The writing and the pictures still work.", true));
    } else {
      tellEd("Ready. Cutting a film re-records the stretch at playback speed.");
    }

    ed("cut").addEventListener("click", async () => {
      if (markOut - markIn < 0.2) return tellEd("Mark a stretch longer than a fifth of a second.", true);
      edit.snippets.push({ from: markIn, to: markOut, keep: true, label: clock(markIn) + " \u2192 " + clock(markOut) });
      drawSnips();
      tellEd("Snippet marked. Mark as many as you like, then merge the ones you want.");
    });

    /* The commoner wish: take out the cough, keep everything else. */
    ed("drop-range").addEventListener("click", () => {
      if (markOut - markIn < 0.05) return tellEd("Mark the stretch to remove first.", true);
      const end = edit.seconds || (edit.buf && edit.buf.duration) || player.duration || 0;
      edit.snippets = [];
      if (markIn > 0.05) edit.snippets.push({ from: 0, to: markIn, keep: true, label: "0:00 \u2192 " + clock(markIn) });
      if (end - markOut > 0.05) edit.snippets.push({ from: markOut, to: end, keep: true, label: clock(markOut) + " \u2192 " + clock(end) });
      drawSnips();
      tellEd("The two keepers are listed. Merge them and that stretch is gone.");
    });

    ed("whole").addEventListener("click", () => { edit.snippets = []; drawSnips(); tellEd("Back to the whole thing."); });

    function drawSnips() {
      const n = ed("snips");
      if (!edit.snippets.length) { n.innerHTML = '<p class="muted xsmall">No snippets marked.</p>'; return; }
      n.innerHTML = '<ul class="am-snips">' + edit.snippets.map((sn, i) =>
        "<li><label><input type=\"checkbox\" data-snip=\"" + i + '"' + (sn.keep ? " checked" : "") + "> " +
        esc(sn.label) + ' <span class="muted xsmall">(' + clock(sn.to - sn.from) + ")</span></label> " +
        '<button class="btn btn--small btn--ghost" type="button" data-hear="' + i + '">Hear it</button> ' +
        '<button class="btn btn--small btn--ghost" type="button" data-up="' + i + '">\u2191</button>' +
        '<button class="btn btn--small btn--ghost" type="button" data-down="' + i + '">\u2193</button>' +
        '<button class="btn btn--small btn--ghost" type="button" data-cutdrop="' + i + '">\u00d7</button></li>'
      ).join("") + "</ul>";
      n.querySelectorAll("[data-snip]").forEach((b) => b.addEventListener("change", () => {
        edit.snippets[Number(b.getAttribute("data-snip"))].keep = b.checked;
      }));
      n.querySelectorAll("[data-hear]").forEach((b) => b.addEventListener("click", () => {
        const sn = edit.snippets[Number(b.getAttribute("data-hear"))];
        player.currentTime = sn.from;
        player.play();
        setTimeout(() => player.pause(), Math.max(200, (sn.to - sn.from) * 1000));
      }));
      n.querySelectorAll("[data-up]").forEach((b) => b.addEventListener("click", () => {
        const i = Number(b.getAttribute("data-up"));
        if (i > 0) { const t = edit.snippets[i - 1]; edit.snippets[i - 1] = edit.snippets[i]; edit.snippets[i] = t; drawSnips(); }
      }));
      n.querySelectorAll("[data-down]").forEach((b) => b.addEventListener("click", () => {
        const i = Number(b.getAttribute("data-down"));
        if (i < edit.snippets.length - 1) { const t = edit.snippets[i + 1]; edit.snippets[i + 1] = edit.snippets[i]; edit.snippets[i] = t; drawSnips(); }
      }));
      n.querySelectorAll("[data-cutdrop]").forEach((b) => b.addEventListener("click", () => {
        edit.snippets.splice(Number(b.getAttribute("data-cutdrop")), 1); drawSnips();
      }));
    }
    drawSnips();

    /* ---------------------------------------------------------- merging */
    ed("merge").addEventListener("click", async () => {
      const keep = edit.snippets.filter((sn) => sn.keep);
      if (!keep.length) return tellEd("Mark and tick at least one snippet first.", true);
      try {
        if (KIND === "audio") await mergeAudio(keep);
        else await mergeVideo(keep);
      } catch (err) {
        tellEd((err && err.message) || "The merge failed.", true);
      }
    });

    async function mergeAudio(keep) {
      if (!edit.buf) throw new Error("the audio is not loaded, so it cannot be cut");
      tellEd("Merging " + keep.length + " snippet(s)\u2026");
      const rate = edit.buf.sampleRate;
      const chans = Math.min(2, edit.buf.numberOfChannels);
      const total = keep.reduce((n, sn) => n + Math.floor((sn.to - sn.from) * rate), 0);
      const off = new OfflineAudioContext(chans, Math.max(1, total), rate);
      let at = 0;
      keep.forEach((sn) => {
        const src = off.createBufferSource();
        src.buffer = edit.buf;
        /* A short ramp at each join, so a cut does not click. */
        const g = off.createGain();
        const len = sn.to - sn.from;
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(1, at + 0.008);
        g.gain.setValueAtTime(1, at + Math.max(0.01, len - 0.008));
        g.gain.linearRampToValueAtTime(0, at + len);
        src.connect(g); g.connect(off.destination);
        src.start(at, sn.from, len);
        at += len;
      });
      const done = await off.startRendering();
      const made = await encode(done);
      edit.made = { blob: made.blob, mime: made.mime, seconds: done.duration,
        treatment: "cut and merged from " + keep.length + " snippet(s)" };
      showMerged(made.blob, "audio", done.duration);
      tellEd("Merged: " + clock(done.duration) + ", " + mb(made.blob.size) + " as " + made.label + ".");
    }

    async function mergeVideo(keep) {
      if (!window.MediaRecorder) throw new Error("this browser has no recorder");
      tellEd("Re-recording the chosen stretches at playback speed\u2026");
      const v = document.createElement("video");
      v.src = item.url;
      v.crossOrigin = "anonymous";
      v.muted = true;
      await new Promise((go, no) => { v.onloadedmetadata = go; v.onerror = () => no(new Error("the film would not open")); });

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(v.videoWidth / 2) * 2;
      canvas.height = Math.round(v.videoHeight / 2) * 2;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(30);
      let ac = null;
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        const src = ac.createMediaElementSource(v);
        const dest = ac.createMediaStreamDestination();
        src.connect(dest);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      } catch { /* silent, then */ }

      const type = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
        .find((t) => MediaRecorder.isTypeSupported(t)) || "video/webm";
      const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 4200000 });
      const bits = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) bits.push(e.data); };
      const stopped = new Promise((go) => { rec.onstop = go; });
      rec.start(1000);

      let live = true;
      const draw = () => { if (!live) return; ctx.drawImage(v, 0, 0, canvas.width, canvas.height); requestAnimationFrame(draw); };
      draw();

      /* One recorder, each kept stretch played into it in turn. */
      for (let i = 0; i < keep.length; i++) {
        const sn = keep[i];
        v.currentTime = sn.from;
        await new Promise((go) => { v.onseeked = go; });
        await v.play();
        await new Promise((go) => {
          const watch = () => {
            if (v.currentTime >= sn.to || v.ended) { v.pause(); go(); return; }
            tellEd("Snippet " + (i + 1) + " of " + keep.length + " \u2014 " + clock(v.currentTime) + " of " + clock(sn.to));
            requestAnimationFrame(watch);
          };
          watch();
        });
      }
      live = false;
      rec.stop();
      await stopped;
      if (ac) ac.close().catch(() => {});

      const blob = new Blob(bits, { type: "video/webm" });
      const total = keep.reduce((n, sn) => n + (sn.to - sn.from), 0);
      edit.made = { blob, mime: "video/webm", seconds: total,
        treatment: "cut and merged from " + keep.length + " snippet(s)" };
      showMerged(blob, "video", total);
      tellEd("Merged: " + clock(total) + ", " + mb(blob.size) + ".");
    }

    function showMerged(blob, how, seconds) {
      const n = ed("merged");
      n.innerHTML = "";
      const node = document.createElement(how === "video" ? "video" : "audio");
      node.controls = true;
      node.src = URL.createObjectURL(blob);
      node.className = how === "video" ? "am-film" : "player";
      n.appendChild(node);
      const row = document.createElement("div");
      row.className = "btn-row";
      row.innerHTML = '<button class="btn btn--small" type="button" data-save="over">Save over the original</button>' +
        '<button class="btn btn--small btn--ghost" type="button" data-save="new">Publish as a new entry</button>';
      n.appendChild(row);
      row.querySelectorAll("[data-save]").forEach((b) => b.addEventListener("click", async () => {
        b.disabled = true;
        try {
          const upload = await sendBlob(blob, (t, f) => { tellEd(t); step(t, f); });
          if (b.getAttribute("data-save") === "over") {
            await post({ action: "replace", id: item.id, upload, mime: blob.type,
              seconds: Math.round(seconds), length: clock(seconds).replace(/ \d+s$/, ""),
              treatment: edit.made.treatment });
            tellEd("Saved over the original. The old file has been removed.");
          } else {
            await post({ action: "finish", upload, kind: KIND,
              title: (ed("title").value || item.title) + " (edit)",
              summary: ed("summary").value, number: KIND === "audio" ? ed("number").value : "",
              length: clock(seconds).replace(/ \d+s$/, ""), seconds: Math.round(seconds),
              tags: ed("tags").value, mime: blob.type, treatment: edit.made.treatment, publish: true });
            tellEd("Published as a new entry.");
          }
          await refresh();
        } catch (err) {
          tellEd((err && err.message) || "That could not be saved.", true);
          b.disabled = false;
        }
      }));
    }

    /* ---------------------------------------------------------- pictures */
    if (KIND === "audio") {
      const plates = () => {
        const n = ed("plates");
        const list = (byId.get(item.id) || item).images || [];
        n.innerHTML = (item.cover ? '<p class="muted xsmall">Cover is set.</p>' : "") +
          (list.length
            ? '<ul class="am-plates">' + list.map((im) =>
              '<li><img src="' + esc(im.url) + '" alt=""><span>' + clock(im.at) +
              (im.caption ? " \u00b7 " + esc(im.caption) : "") + "</span>" +
              '<button class="btn btn--small btn--ghost" type="button" data-plate="' + im.id + '">Remove</button></li>'
            ).join("") + "</ul>"
            : '<p class="muted xsmall">No plates cued yet.</p>');
        n.querySelectorAll("[data-plate]").forEach((b) => b.addEventListener("click", async () => {
          await post({ action: "drop-image", image_id: Number(b.getAttribute("data-plate")) }).catch(() => {});
          await refresh(); plates();
        }));
      };
      plates();

      const hang = async (role) => {
        const f = ed("img").files && ed("img").files[0];
        if (!f) return tellEd("Choose a picture first.", true);
        try {
          tellEd("Sending the picture\u2026");
          const upload = await sendBlob(f, () => {});
          const d = await post({ action: "attach", id: item.id, upload, mime: f.type, role,
            at: role === "cue" ? player.currentTime : 0, caption: ed("cap").value });
          if (d && d.item) { item.cover = d.item.cover; item.images = d.item.images; byId.set(item.id, d.item); }
          ed("img").value = ""; ed("cap").value = "";
          tellEd(role === "cover" ? "Cover set." : "Plate cued at " + clock(player.currentTime) + ".");
          plates();
          await refresh();
        } catch (err) {
          tellEd((err && err.message) || "The picture would not go up.", true);
        }
      };
      ed("as-cover").addEventListener("click", () => hang("cover"));
      ed("as-cue").addEventListener("click", () => hang("cue"));
    }

    ed("save").addEventListener("click", async () => {
      try {
        await post({ action: "edit", id: item.id, title: ed("title").value,
          summary: ed("summary").value, tags: ed("tags").value,
          number: KIND === "audio" ? ed("number").value : "" });
        tellEd("The writing is saved.");
        await refresh();
      } catch (err) {
        tellEd((err && err.message) || "It would not save.", true);
      }
    });

    ed("kill").addEventListener("click", async () => {
      if (!window.confirm("Delete \u201c" + item.title + "\u201d for good? The file goes too.")) return;
      await post({ action: "delete", id: item.id }).catch(() => {});
      box.innerHTML = "";
      await refresh();
    });

    ed("close").addEventListener("click", () => { box.innerHTML = ""; edit = null; });
    box.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  /* Send any blob up in pieces and hand back the upload's name. */
  async function sendBlob(blob, onStep) {
    const upload = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const begun = await post({ action: "begin", upload, mime: blob.type });
    const raw = Math.floor(Math.min(900000, begun.chunk_max || 900000) * 0.74);
    const whole = new Uint8Array(await blob.arrayBuffer());
    const pieces = Math.ceil(whole.length / raw);
    for (let i = 0; i < pieces; i++) {
      const slice = whole.subarray(i * raw, (i + 1) * raw);
      let bin = "";
      for (let j = 0; j < slice.length; j++) bin += String.fromCharCode(slice[j]);
      await post({ action: "chunk", upload, seq: i, part: btoa(bin) });
      if (onStep) onStep("Sending \u2014 " + (i + 1) + " of " + pieces, (i + 1) / pieces);
    }
    return upload;
  }

  async function refresh() {
    const shelf = await post({ action: "shelf", kind: KIND }).catch(() => null);
    if (shelf) drawShelf(shelf.items || []);
    if (window.EGMediaRefresh) window.EGMediaRefresh();
  }

  /* ---------------------------------------------------------- what is there */
  function drawShelf(items) {
    if (!el.shelf) return;
    if (!items.length) {
      el.shelf.innerHTML = '<p class="muted small">Nothing uploaded through this door yet.</p>';
      return;
    }
    el.shelf.innerHTML = '<table class="keeper-table"><thead><tr><th>Title</th><th>State</th>' +
      "<th>Weight</th><th>What was done</th><th></th></tr></thead><tbody>" +
      items.map((i) =>
        "<tr><td><strong>" + esc(i.title) + "</strong><br>" +
        '<span class="muted xsmall">' + esc(i.date) + " \u00b7 " + esc(i.length || "") + "</span></td>" +
        "<td>" + esc(i.state) + (i.pinned ? ' <span class="pin-mark">pinned</span>' : "") + "</td>" +
        "<td>" + (i.bytes ? mb(i.bytes) : "\u2014") + "</td>" +
        '<td class="muted xsmall">' + esc(i.treatment) + "</td>" +
        '<td><button class="btn btn--small" type="button" data-edit="' + i.id + '">Edit</button> ' +
        '<button class="btn btn--small btn--ghost" type="button" data-pin="' + i.id + '">' +
        (i.pinned ? "Unpin" : "Pin to the top") + "</button> " +
        '<button class="btn btn--small btn--ghost" type="button" data-flip="' + i.id + '">' +
        (i.state === "published" ? "Take down" : "Publish") + "</button> " +
        '<button class="btn btn--small btn--ghost" type="button" data-drop="' + i.id + '">Delete</button></td></tr>'
      ).join("") + "</tbody></table><div data-am=\"editor\"></div>";
    byId = new Map(items.map((i) => [i.id, i]));
    el.shelf.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () =>
      openEditor(byId.get(Number(b.getAttribute("data-edit"))))));

    el.shelf.querySelectorAll("[data-pin]").forEach((b) => b.addEventListener("click", async () => {
      const id = Number(b.getAttribute("data-pin"));
      const want = b.textContent.trim() === "Unpin" ? "unpin" : "pin";
      b.disabled = true;
      try {
        const d = await post({ action: want, id });
        drawShelf(d.items || []);
        if (window.EGMediaRefresh) window.EGMediaRefresh();
      } catch (err) {
        say((err && err.message) || "That could not be pinned.", true);
        b.disabled = false;
      }
    }));

    el.shelf.querySelectorAll("[data-flip]").forEach((b) => b.addEventListener("click", async () => {
      const id = Number(b.getAttribute("data-flip"));
      const now = b.textContent.trim() === "Publish";
      await post({ action: now ? "publish" : "unpublish", id }).catch(() => {});
      drawShelf((await post({ action: "shelf", kind: KIND })).items || []);
      if (window.EGMediaRefresh) window.EGMediaRefresh();
    }));
    el.shelf.querySelectorAll("[data-drop]").forEach((b) => b.addEventListener("click", async () => {
      if (!window.confirm("Delete that for good?")) return;
      await post({ action: "delete", id: Number(b.getAttribute("data-drop")) }).catch(() => {});
      drawShelf((await post({ action: "shelf", kind: KIND })).items || []);
      if (window.EGMediaRefresh) window.EGMediaRefresh();
    }));
  }

  function addToPage(item) {
    if (window.EGMediaRefresh) window.EGMediaRefresh(item);
  }
}

/* ===========================================================================
   The public list — uploaded episodes and films, shown above the committed
   ones so the newest work is first. This runs for every visitor; it asks
   the shelf what is published and nothing more.
   ======================================================================== */
(function publicShelf() {
  const slot = document.getElementById("uploaded-media");
  if (!slot) return;
  const KIND = slot.getAttribute("data-kind") === "video" ? "video" : "audio";
  const esc = (t) => String(t == null ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const stamp = (s) => {
    s = Math.round(s || 0);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return (h ? h + ":" + String(m).padStart(2, "0") : String(m)) + ":" + String(s % 60).padStart(2, "0");
  };

  async function load() {
    try {
      const r = await fetch("/api/media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "list", kind: KIND })
      });
      const d = await r.json();
      const items = (d && d.items) || [];
      if (!items.length) { slot.innerHTML = ""; slot.hidden = true; return; }
      slot.hidden = false;
      slot.innerHTML = items.map((i) => KIND === "audio"
        ? '<details class="frame media ep"><summary>' +
          '<span class="num">' + esc(i.number || "\u2726") + "</span>" +
          '<span class="ep-head"><span class="meta">' + esc(i.date) +
          (i.length ? " \u00b7 " + esc(i.length) : "") +
          (i.pinned ? ' \u00b7 <span class="pin-mark">pinned</span>' : "") + "</span>" +
          '<span class="ep-title">' + esc(i.title) + "</span>" +
          (i.tags.length ? '<span class="muted xsmall">' + esc(i.tags.join(" \u00b7 ")) + "</span>" : "") +
          "</span></summary><div class=\"ep-body\">" +
          (i.summary ? "<p>" + esc(i.summary) + "</p>" : "") +
          (i.links && i.links.length
            ? '<p class="kicker">Where it meets the rest of the house</p><ul class="am-links">' +
              i.links.map((l) => '<li><a href="' + esc(l.href) + '">' + esc(l.title) + "</a> " +
                '<span class="muted xsmall">' + esc(l.why || "") + "</span></li>").join("") + "</ul>"
            : "") +
          (i.topics && i.topics.length
            ? '<p class="kicker">Its shape</p><ul class="am-links">' +
              i.topics.map((t) => "<li><strong>" + esc(stamp(t.at)) + "</strong> " +
                esc(t.heading) + "</li>").join("") + "</ul>"
            : "") +
          (i.cover || (i.images && i.images.length)
            ? '<div class="ep-plate" data-plates="' + i.id + '">' +
              '<img src="' + esc(i.cover || i.images[0].url) + '" alt="">' +
              '<figcaption class="plate-cap"><span class="muted xsmall" data-cap></span></figcaption></div>'
            : "") +
          (i.url ? '<audio class="player" controls preload="none" src="' + esc(i.url) +
            '" data-for="' + i.id + '"></audio>' : "") +
          "</div></details>"
        : '<article class="frame card' + (i.pinned ? " is-pinned" : "") + '">' +
          (i.pinned ? '<p class="pin-mark">pinned</p>' : "") +
          (i.url ? '<video class="am-film" controls preload="metadata" src="' + esc(i.url) + '"></video>' : "") +
          '<p class="tag mt-1">' + esc(i.date) + (i.length ? " \u00b7 " + esc(i.length) : "") + "</p>" +
          "<h3>" + esc(i.title) + "</h3>" +
          (i.summary ? "<p>" + esc(i.summary) + "</p>" : "") +
          (i.tags.length ? '<p class="muted xsmall">' + esc(i.tags.join(" \u00b7 ")) + "</p>" : "") +
          "</article>").join("");
      /* A plate rises as the sound reaches it. The cover stands until the
         first cue, and each cue holds until the next. */
      items.forEach((i) => {
        if (!i.images || !i.images.length) return;
        const player = slot.querySelector('[data-for="' + i.id + '"]');
        const stage = slot.querySelector('[data-plates="' + i.id + '"]');
        if (!player || !stage) return;
        const img = stage.querySelector("img");
        const cap = stage.querySelector("[data-cap]");
        const cues = i.images.slice().sort((a, b) => a.at - b.at);
        let now = -1;
        player.addEventListener("timeupdate", () => {
          let want = -1;
          for (let k = 0; k < cues.length; k++) if (player.currentTime >= cues[k].at) want = k;
          if (want === now) return;
          now = want;
          const pick = want < 0 ? null : cues[want];
          img.src = pick ? pick.url : (i.cover || cues[0].url);
          if (cap) cap.textContent = pick ? pick.caption || "" : "";
        });
      });
    } catch {
      slot.hidden = true;
    }
  }

  window.EGMediaRefresh = load;
  load();
})();
