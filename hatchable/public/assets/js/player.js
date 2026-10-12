/**
 * The house player — an audio element, properly played back, with the
 * sound drawn while it plays.
 *
 * Every <audio class="player"> on the page is wrapped in the same figure:
 * a canvas that listens to the sound through a Web Audio analyser and
 * answers it — gold bars for the spectrum, a ring that breathes with the
 * level, embers that rise while it plays — and a plain, exact transport:
 * play and pause, a seek bar, the time on both sides.
 *
 * The native controls are removed only once the figure is standing, so a
 * page without this script still plays its sound. Where the storage host
 * will not share the samples cross-origin, the canvas falls back to a
 * drawn wave keyed to the playhead, so the figure never goes dead.
 *
 * Nothing here uploads, stores or phones home. It is a window onto the
 * sound, nothing more.
 */

(function () {
  "use strict";

  let Ctx = null;
  const audioCtx = () => {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    if (!Ctx) Ctx = new C();
    if (Ctx.state === "suspended") Ctx.resume().catch(() => {});
    return Ctx;
  };

  const stamp = (s) => {
    s = Math.max(0, Math.round(s || 0));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return (h ? h + ":" + String(m).padStart(2, "0") : String(m)) + ":" +
      String(s % 60).padStart(2, "0");
  };

  function enhance(audio) {
    if (audio.dataset.fx) return;
    audio.dataset.fx = "1";
    audio.controls = false;
    audio.preload = audio.preload || "metadata";
    /* Cross-origin samples: "anonymous" mode only when the host actually
       answers with CORS headers, because a host that refuses will refuse
       the sound itself — an audio element forced into CORS mode plays
       nothing at all where the host sends no access-control headers. The
       probe is a HEAD; where it fails the sound still plays and the
       canvas falls back to the drawn wave keyed to the playhead. */
    if (audio.src && !/^(blob:|data:)/i.test(audio.src)) {
      /* A one-byte GET: signed storage URLs sign a method, and a signed
         host answers a range ask, which a HEAD ask may refuse. */
      fetch(audio.src, { method: "GET", mode: "cors", headers: { "range": "bytes=0-0" } })
        .then((r) => { if (r.ok || r.status === 206) audio.crossOrigin = "anonymous"; })
        .catch(() => {});
    }

    const fig = document.createElement("div");
    fig.className = "fx-player";
    audio.parentNode.insertBefore(fig, audio);

    const cv = document.createElement("canvas");
    cv.className = "fx-canvas";
    cv.width = 960; cv.height = 220;
    cv.setAttribute("role", "img");
    cv.setAttribute("aria-label", "The sound, drawn while it plays");

    const bar = document.createElement("div");
    bar.className = "fx-bar";

    /* The transport, in full: skip to the previous episode, two speeds of
       rewind and of forwards, and the play between them. */
    const stepBtn = (label, aria, fn) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "fx-step";
      b.setAttribute("aria-label", aria);
      b.textContent = label;
      b.addEventListener("click", fn);
      return b;
    };

    /* Some browsers (and jsdom) hand back nothing from play(); never let
       that throw where a button was pressed. */
    const start = (a) => { const p = a.play(); if (p && p.catch) p.catch(() => {}); };

    /* Whoever starts the sound, the player must be seen: open every
       closed <details> above it and bring the figure into view. */
    const reveal = (a) => {
      let d = a.closest("details");
      while (d) {
        d.open = true;
        d = d.parentElement ? d.parentElement.closest("details") : null;
      }
      const f = a.closest(".fx-player");
      if (f && f.scrollIntoView) {
        try { f.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
        catch { try { f.scrollIntoView(); } catch { /* nowhere to scroll */ } }
      }
    };

    /* Skip to previous: the episode before this one in the page's own
       order — opened, seen and playing. At the first, start again. */
    const skipPrev = () => {
      const all = Array.from(document.querySelectorAll("audio.player"));
      const i = all.indexOf(audio);
      const prev = i > 0 ? all[i - 1] : null;
      if (prev) {
        reveal(prev);
        start(prev);
      } else {
        try { audio.currentTime = 0; } catch { /* not seekable yet */ }
        reveal(audio);
        start(audio);
      }
    };

    const nudge = (secs) => () => {
      try {
        const d = Number.isFinite(audio.duration) ? audio.duration : Infinity;
        audio.currentTime = Math.max(0, Math.min(d, (audio.currentTime || 0) + secs));
      } catch { /* nothing loaded to move through */ }
      reveal(audio);
    };

    const prevBtn = stepBtn("⏮", "Skip to the previous episode", skipPrev);
    const back60 = stepBtn("\u221260", "Back one minute", nudge(-60));
    const back10 = stepBtn("\u221210", "Back ten seconds", nudge(-10));

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "fx-play";
    playBtn.setAttribute("aria-label", "Play or pause");
    playBtn.textContent = "►";

    const fwd10 = stepBtn("+10", "Forwards ten seconds", nudge(10));
    const fwd60 = stepBtn("+60", "Forwards one minute", nudge(60));

    const now = document.createElement("span");
    now.className = "fx-time";
    now.textContent = "0:00";

    const seek = document.createElement("input");
    seek.type = "range";
    seek.className = "fx-seek";
    seek.min = "0"; seek.max = "1000"; seek.value = "0";
    seek.setAttribute("aria-label", "Where in the recording");

    const end = document.createElement("span");
    end.className = "fx-time";
    end.textContent = "0:00";

    /* The voice of the room: a level of its own, remembered on this
       device, with a hand to silence it. */
    const muteBtn = document.createElement("button");
    muteBtn.type = "button";
    muteBtn.className = "fx-step fx-mute";
    muteBtn.setAttribute("aria-label", "Mute or unmute");
    muteBtn.title = "Mute or unmute";
    const vol = document.createElement("input");
    vol.type = "range";
    vol.className = "fx-vol";
    vol.min = "0"; vol.max = "100";
    vol.setAttribute("aria-label", "Volume");
    vol.title = "Volume";
    let savedVol = 1;
    try {
      const sv = Number(localStorage.getItem("fx-volume"));
      if (Number.isFinite(sv) && sv >= 0 && sv <= 1) savedVol = sv;
    } catch { /* the device keeps its own counsel */ }
    vol.value = String(Math.round(savedVol * 100));
    audio.volume = savedVol;
    const paintMute = () => {
      muteBtn.textContent = (audio.muted || audio.volume === 0) ? "\u{1F507}" : "\u{1F50A}";
    };
    vol.addEventListener("input", () => {
      audio.volume = Number(vol.value) / 100;
      if (audio.volume > 0) audio.muted = false;
      try { localStorage.setItem("fx-volume", String(audio.volume)); } catch { /* no shelf */ }
      paintMute();
    });
    muteBtn.addEventListener("click", () => {
      audio.muted = !audio.muted;
      paintMute();
    });
    paintMute();

    bar.append(prevBtn, back60, back10, playBtn, fwd10, fwd60, now, seek, end, muteBtn, vol);
    fig.append(cv, audio, bar);

    /* --------------------------------------------------------- the sound */
    let analyser = null;
    let freq = null;
    let wired = false;
    const wire = () => {
      if (wired) return;
      wired = true;
      const ctx = audioCtx();
      if (!ctx) return;
      try {
        const src = ctx.createMediaElementSource(audio);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        freq = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) { analyser = null; }
    };

    /* ------------------------------------------------------- the drawing */
    const g = cv.getContext("2d");
    let raf = 0;
    let embers = [];
    let t0 = 0;

    const ember = (w) => ({
      x: Math.random() * w, y: 200 + Math.random() * 20,
      v: 0.4 + Math.random() * 1.2, r: 0.6 + Math.random() * 1.8,
      a: 0.25 + Math.random() * 0.5
    });

    function draw(ts) {
      raf = requestAnimationFrame(draw);
      const w = cv.width, h = cv.height;
      g.clearRect(0, 0, w, h);
      const playing = !audio.paused && !audio.ended;
      const t = ts / 1000;

      let level = 0;
      let bins = null;
      if (analyser && freq) {
        analyser.getByteFrequencyData(freq);
        let sum = 0;
        for (let i = 0; i < freq.length; i++) sum += freq[i];
        level = sum / (freq.length * 255);
        if (level > 0.001) bins = freq;
      }
      if (!bins && playing) {
        /* The storage host kept the samples to itself; draw the wave from
           the playhead instead so the figure still answers the sound. */
        level = 0.35 + 0.2 * Math.sin(t * 2.1) + 0.1 * Math.sin(t * 5.7);
      }

      /* the breathing ring */
      const cx = w / 2, cy = h / 2;
      const R = 34 + level * 46;
      g.save();
      g.strokeStyle = "rgba(215, 176, 90, " + (0.35 + level * 0.5) + ")";
      g.lineWidth = 1.6 + level * 3;
      g.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
        const wob = bins
          ? bins[Math.floor((a / (Math.PI * 2)) * Math.min(96, bins.length)) % bins.length] / 255
          : (playing ? 0.5 + 0.5 * Math.sin(a * 6 + t * 3) * 0.4 : 0.2);
        const rr = R + wob * 16;
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.62;
        a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.closePath();
      g.stroke();
      g.restore();

      /* the spectrum bars */
      const N = 56;
      const bw = w / N;
      for (let i = 0; i < N; i++) {
        let v;
        if (bins) {
          const at = Math.floor(Math.pow(i / N, 1.4) * Math.min(140, bins.length));
          v = bins[at] / 255;
        } else {
          v = playing
            ? Math.abs(Math.sin(i * 0.7 + t * 4) * Math.sin(i * 0.23 - t * 2.4)) * level
            : 0.03;
        }
        const bh = 4 + v * (h - 26);
        const x = i * bw + bw * 0.22;
        const grd = g.createLinearGradient(0, h, 0, h - bh);
        grd.addColorStop(0, "rgba(215, 176, 90, 0.16)");
        grd.addColorStop(1, "rgba(243, 221, 170, " + (0.35 + v * 0.6) + ")");
        g.fillStyle = grd;
        g.fillRect(x, h - bh, bw * 0.56, bh);
      }

      /* embers while it plays */
      if (playing && embers.length < 42 && Math.random() < 0.5 + level)
        embers.push(ember(w));
      embers = embers.filter((e) => e.y > -6);
      for (const e of embers) {
        e.y -= e.v * (1 + level * 2.4);
        e.x += Math.sin(t * 2 + e.y * 0.05) * 0.5;
        g.fillStyle = "rgba(243, 221, 170, " + (e.a * (playing ? 1 : 0.4)) + ")";
        g.beginPath();
        g.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        g.fill();
      }
      if (!playing && embers.length === 0 && level < 0.01) {
        /* at rest: a quiet baseline so the figure reads as a player */
        g.strokeStyle = "rgba(215, 176, 90, 0.28)";
        g.lineWidth = 1;
        g.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const y = cy + Math.sin(x * 0.02 + t0) * 2;
          x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }
      t0 += 0.01;
    }

    /* ------------------------------------------------------ the transport */
    const toggle = () => {
      wire();
      if (audio.paused) { reveal(audio); start(audio); }
      else audio.pause();
    };
    playBtn.addEventListener("click", toggle);
    audio.addEventListener("click", toggle);
    cv.addEventListener("click", toggle);

    let scrubbing = false;
    seek.addEventListener("input", () => {
      scrubbing = true;
      if (Number.isFinite(audio.duration) && audio.duration)
        audio.currentTime = (seek.value / 1000) * audio.duration;
      scrubbing = false;
    });

    audio.addEventListener("play", () => { playBtn.textContent = "❚❚"; });
    audio.addEventListener("pause", () => { playBtn.textContent = "►"; });
    audio.addEventListener("ended", () => { playBtn.textContent = "►"; });
    audio.addEventListener("loadedmetadata", () => {
      end.textContent = stamp(audio.duration);
    });
    audio.addEventListener("timeupdate", () => {
      now.textContent = stamp(audio.currentTime);
      if (!scrubbing && Number.isFinite(audio.duration) && audio.duration)
        seek.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
    });

    /* draw only while the figure can be seen */
    const io = "IntersectionObserver" in window
      ? new IntersectionObserver((ents) => {
        const seen = ents.some((e) => e.isIntersecting);
        if (seen && !raf) raf = requestAnimationFrame(draw);
        if (!seen && raf) { cancelAnimationFrame(raf); raf = 0; }
      }, { threshold: 0.05 })
      : null;
    if (io) io.observe(fig); else raf = requestAnimationFrame(draw);
  }

  window.EGPlayerEnhance = enhance;
  const sweep = (root) => (root || document)
    .querySelectorAll("audio.player").forEach((a) => enhance(a));
  window.EGPlayerSweep = sweep;
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => sweep());
  else sweep();

  /* Whoever starts the sound — the transport, a shelf row, a cued plate,
     a dropped file — the player must be seen. The play event does not
     bubble, so this listens on the way down: open every closed <details>
     above the sound and bring its figure into view. */
  document.addEventListener("play", (e) => {
    const a = e.target;
    if (!a || !a.classList || !a.classList.contains("player")) return;
    let d = a.closest("details");
    while (d) {
      d.open = true;
      d = d.parentElement ? d.parentElement.closest("details") : null;
    }
    const f = a.closest(".fx-player");
    if (f && f.scrollIntoView) {
      try { f.scrollIntoView({ block: "nearest", behavior: "smooth" }); }
      catch { try { f.scrollIntoView(); } catch { /* nowhere to scroll */ } }
    }
  }, true);

  /* The drop-audio-here plate: a button that is also a target. A file
     dropped (or chosen) plays in the house player from this device
     alone — nothing is uploaded, nothing leaves the page. */
  const zone = document.querySelector("[data-drop-zone]");
  if (zone) {
    const btn = zone.querySelector("[data-drop-audio]");
    const file = zone.querySelector("[data-drop-file]");
    const slot = zone.querySelector("[data-drop-slot]");
    const note = zone.querySelector("[data-drop-note]");
    const sayDrop = (t, bad) => {
      if (!note) return;
      note.textContent = t || "";
      note.className = "muted small" + (bad ? " is-bad" : "");
    };
    const take = (f) => {
      if (!f) return;
      const okType = /^audio\//.test(f.type || "") ||
        /\.(mp3|m4a|aac|ogg|oga|opus|wav|webm|flac)$/i.test(f.name || "");
      if (!okType) return sayDrop("That is not a sound this page can play.", true);
      const fig = document.createElement("div");
      fig.className = "drop-fig";
      const cap = document.createElement("p");
      cap.className = "muted small";
      cap.textContent = f.name + " \u2014 playing from this device alone; nothing was uploaded.";
      const a = document.createElement("audio");
      a.className = "player";
      a.preload = "metadata";
      a.src = URL.createObjectURL(f);
      fig.append(cap, a);
      if (slot) slot.prepend(fig);
      enhance(a);
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
      sayDrop("");
    };
    if (btn && file) {
      btn.addEventListener("click", () => file.click());
      file.addEventListener("change", () => {
        take(file.files && file.files[0]);
        file.value = "";
      });
    }
    ["dragenter", "dragover"].forEach((ev) =>
      zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add("is-over"); }));
    ["dragleave", "drop"].forEach((ev) =>
      zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove("is-over"); }));
    zone.addEventListener("drop", (e) => {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) take(f);
    });
  }
})();