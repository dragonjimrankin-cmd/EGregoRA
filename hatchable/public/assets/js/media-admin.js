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
      target: el.loud ? Number(el.loud.value) : -18,
      grade: on("grade"), shrink: on("shrink")
    };
  };

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

    let from = 0, to = fileBuf.duration;
    if (want.trim) {
      from = Math.max(0, fileLook.head - 0.25);
      to = Math.min(fileBuf.duration, fileLook.tail + 0.4);
    }
    const rate = fileBuf.sampleRate;
    const frames = Math.max(1, Math.floor((to - from) * rate));
    const off = new OfflineAudioContext(Math.min(2, fileBuf.numberOfChannels), frames, rate);

    const src = off.createBufferSource();
    src.buffer = fileBuf;
    const out = CHAIN(off, src, fileLook, want);

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
    el.after.innerHTML = reading(look, "After the work");

    step("Encoding\u2026", 0.85);
    const made = await encode(done);
    const treatment = [
      want.rumble && "rumble filtered below 72 Hz",
      want.gate && "hiss shelved",
      want.tone && "tone shaped (mud down, presence and air up)",
      want.deess && "de-essed",
      want.level && "levelled",
      want.loud && ("matched to " + want.target + " dB RMS"),
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
      const mod = await import("https://unpkg.com/@breezystack/lamejs@1.2.7/src/js/index.js");
      const lame = mod.Mp3Encoder ? mod : (mod.default || mod);
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
        "<td>" + esc(i.state) + "</td>" +
        "<td>" + (i.bytes ? mb(i.bytes) : "\u2014") + "</td>" +
        '<td class="muted xsmall">' + esc(i.treatment) + "</td>" +
        '<td><button class="btn btn--small btn--ghost" type="button" data-flip="' + i.id + '">' +
        (i.state === "published" ? "Take down" : "Publish") + "</button> " +
        '<button class="btn btn--small btn--ghost" type="button" data-drop="' + i.id + '">Delete</button></td></tr>'
      ).join("") + "</tbody></table>";

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
        ? '<article class="frame media">' +
          '<div class="num">' + esc(i.number || "\u2726") + "</div><div>" +
          '<p class="meta">' + esc(i.date) + (i.length ? " \u00b7 " + esc(i.length) : "") +
          (i.tags.length ? " \u00b7 " + esc(i.tags.join(" \u00b7 ")) : "") + "</p>" +
          "<h3>" + esc(i.title) + "</h3>" +
          (i.summary ? "<p>" + esc(i.summary) + "</p>" : "") +
          (i.url ? '<audio class="player" controls preload="none" src="' + esc(i.url) + '"></audio>' : "") +
          "</div></article>"
        : '<article class="frame card">' +
          (i.url ? '<video class="am-film" controls preload="metadata" src="' + esc(i.url) + '"></video>' : "") +
          '<p class="tag mt-1">' + esc(i.date) + (i.length ? " \u00b7 " + esc(i.length) : "") + "</p>" +
          "<h3>" + esc(i.title) + "</h3>" +
          (i.summary ? "<p>" + esc(i.summary) + "</p>" : "") +
          (i.tags.length ? '<p class="muted xsmall">' + esc(i.tags.join(" \u00b7 ")) + "</p>" : "") +
          "</article>").join("");
    } catch {
      slot.hidden = true;
    }
  }

  window.EGMediaRefresh = load;
  load();
})();
