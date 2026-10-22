/* ===========================================================================
   The publishing doors — Admin Only, on /podcast/ and /videos/
   ---------------------------------------------------------------------------
   Behind the order's passcode: hand over a recording, let it be cleaned up,
   write the few lines that go with it, and it joins the list on the page.

   The cleaning happens *here*, in the browser, and that is a deliberate
   choice rather than a shortcut. A server function has no ffmpeg and a
   strict clock; a browser has the whole Web Audio engine sitting idle. So
 the file is decoded, run through a real chain — rumble filter, gate,
 compressor, tone, loudness match, limiter, de-stutter, denoise gate
 (sniffs and coughs out, words left whole), trimmed silence, fades — and
   rendered offline, usually faster than real time. Nothing leaves the
   machine until it has been listened to.

   Film is the harder case and is treated honestly. There is no transcoder
   in a browser, so a graded film is *re-recorded* through a canvas and a
   MediaRecorder at playback speed: twenty minutes of film takes twenty
   minutes, and the result is WebM. That is said plainly in the panel, and
   uploading the original untouched is always the first option.
   ======================================================================== */

import { countdown } from "./live.js";
import { createProgressLiveness } from "./progress-live.js?v=progress-live-1";
import {
  voiceTemplate,
  sealVoiceprint,
  openVoiceprint,
  assignVoiceprints
} from "./voiceprint.js";

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

/* The FLAC door has its own encoder, served from this site like lamejs and
   loaded once, lazily, the first time something asks for FLAC. */
let flacPromise = null;
function flacEnc() {
  if (!flacPromise) {
    flacPromise = import("./vendor/flac-encoder.js")
      .then((mod) => (mod && mod.encodeFlac ? mod : (mod && mod.default) || mod))
      .catch((err) => { flacPromise = null; throw err; });
  }
  return flacPromise;
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
    transcribeBar: $("[data-am=transcribe-progress]"),
    transcribeCallout: $("[data-am=transcribe-callout]"),
    transcribeHeading: $("[data-am=transcribe-heading]"),
    transcribeDetail: $("[data-am=transcribe-detail]"),
    preview: $("[data-am=preview]"),
    pubrow: $("[data-am=pubrow]"),
    pubnow: $("[data-am=pubnow]"),
    meta: $("[data-am=meta]"),
    title: $("[data-am=title]"),
    number: $("[data-am=number]"),
    summary: $("[data-am=summary]"),
    summaryState: $("[data-am=summary-state]"),
    tags: $("[data-am=tags]"),
    send: $("[data-am=send]"),
    shelf: $("[data-am=shelf]"),
    loud: $("[data-am=loud]")
  };
  if (!el.open || !el.panel) return;

  let pass = "";
  let source = null;           /* the file as chosen */
  let ready = null;            /* { blob, mime, seconds, treatment, bytes } */

  /* The key remembered from another page of the house: if it checks out,
     the door stands open without a second asking. */
  (function rememberedKey() {
    const m = /(?:^|;\s*)eg-admin=([^;]+)/.exec(document.cookie || "");
    if (!m) return;
    const tok = m[1];
    fetch("/api/owner", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "check", token: tok })
    }).then((r) => r.json().catch(() => ({})))
      .then((d) => {
        if (!(d && d.ok)) { document.cookie = "eg-admin=; path=/; max-age=0; SameSite=Lax"; return; }
        window.__egDoorToken = tok;
        el.open.textContent = "Close the admin door";
        el.open.setAttribute("aria-expanded", "true");
        el.panel.hidden = false;
        el.work.hidden = false;
        window.EGMediaAdminOn = true;
        if (el.msg) {
          el.msg.classList.remove("is-bad");
          el.msg.textContent = "The door is already open — the key was remembered. " +
            (window.EGToken && window.EGToken() ? "" :
              "Sign in at /join/ to upload or record; the episode is kept under your account.");
        }
        post({ action: "shelf", kind: KIND })
          .then((d2) => { drawShelf(d2.items || []); fillNumber(); if (window.EGMediaRefresh) window.EGMediaRefresh(); })
          .catch(() => {});
      })
      .catch(() => { document.cookie = "eg-admin=; path=/; max-age=0; SameSite=Lax"; });
  })();

  const say = (t, bad) => {
    if (!el.msg) return;
    el.msg.textContent = t || "";
    el.msg.className = "auth-msg" + (bad ? " is-bad" : "");
  };
  /* Percentages remain measured rather than invented. If a render, model load,
     transcription pass, summary request or upload is quiet for four seconds,
     the common reporter adds an elapsed-time heartbeat and moving sheen so it
     is visibly alive until the next real measurement arrives. */
  const progressLiveness = createProgressLiveness();
  const showProgress = (node, text, fraction, bad) =>
    progressLiveness.update(node, text, fraction, bad);
  const step = (text, fraction) => showProgress(el.bar, text, fraction, false);
  const transcriptionStep = (text, fraction, bad) => {
    showProgress(el.transcribeBar || el.bar, text, fraction, bad);
    if (!el.transcribeCallout) return;
    const done = !bad && Number(fraction) >= 1;
    el.transcribeCallout.hidden = false;
    el.transcribeCallout.classList.toggle("is-working", !bad && !done);
    el.transcribeCallout.classList.toggle("is-ready", done);
    el.transcribeCallout.classList.toggle("is-bad", !!bad);
    if (el.transcribeHeading) {
      const heading = bad
        ? "This run has stopped"
        : done
          ? "Transcript and summary ready"
          : "Working now: transcript first, summary next";
      if (el.transcribeHeading.textContent !== heading) el.transcribeHeading.textContent = heading;
    }
    if (el.transcribeDetail) {
      const detail = bad
        ? "Nothing will be published. Read the error below, then try again."
        : done
          ? "The summary box below was filled automatically. Review it before publishing."
          : "This area is busy. Please do not click again or close this page while it works.";
      if (el.transcribeDetail.textContent !== detail) el.transcribeDetail.textContent = detail;
    }
  };
  const mb = (n) => (n / 1048576).toFixed(1) + " MB";
  /* Read only the piece being sent. Keeping the complete Blob in an
     ArrayBuffer as well as the decoded episode made long podcasts needlessly
     consume another file's worth of browser memory at publish time. */
  const blobPartBase64 = async (blob, from, to) => {
    const bytes = new Uint8Array(await blob.slice(from, to).arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };
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
    body: JSON.stringify(Object.assign({ pass, token: window.__egDoorToken || "" }, payload))
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "the shelf refused that");
    return data;
  });

  const voiceStampSeconds = (stamp) => {
    const value = String(stamp || "").trim().toLowerCase();
    if (/[hms]/.test(value)) {
      const found = /^(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?$/.exec(value.replace(/\s+/g, ""));
      return found ? Number(found[1] || 0) * 3600 + Number(found[2] || 0) * 60 + Number(found[3] || 0) : 0;
    }
    const parts = value.split(":").map(Number);
    if (parts.some((part) => !Number.isFinite(part))) return 0;
    return parts.length > 2 ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : (parts[0] || 0) * 60 + (parts[1] || 0);
  };

  function voiceTurns(text, knownSpeakers, duration) {
    const known = new Map((knownSpeakers || []).map((speaker) =>
      [String(speaker.name).toLowerCase(), Number(speaker.number)]));
    const byNumber = new Map((knownSpeakers || []).map((speaker) =>
      [Number(speaker.number), speaker.name]));
    const turns = [];
    String(text || "").split(/\n\s*\n/).forEach((block) => {
      const found = /^\[([^\]]+)\]\s+(.+?)\s+—\s*([\s\S]*)$/.exec(block.trim());
      if (!found) return;
      const label = found[2].trim();
      const numbered = /^Speaker\s+(\d+)$/i.exec(label);
      const number = numbered ? Number(numbered[1]) : (known.get(label.toLowerCase()) || null);
      turns.push({
        at: voiceStampSeconds(found[1]),
        stamp: found[1],
        number,
        name: numbered ? (byNumber.get(number) || "") : label,
        text: found[3].trim()
      });
    });
    turns.forEach((turn, index) => {
      const next = turns[index + 1];
      turn.to = next ? next.at : Math.min(Number(duration) || turn.at + 30, turn.at + 45);
    });
    return turns;
  }

  /* Every authenticated audio path uses this same matcher. It tests Edward
     Gregory and Jim Rankin first in the report, then every additional
     explicitly enrolled voiceprint. Low-score or low-margin results abstain;
     an unknown voice remains Speaker N rather than receiving the wrong name. */
  async function localVoiceMatches(buffer, transcript, knownSpeakers) {
    if (!buffer || !String(transcript || "").trim()) {
      return { labels: [], uncertain: [], reason: "no decoded audio or timestamped transcript" };
    }
    const data = await post({ action: "voiceprints" });
    const records = data.voiceprints || [];
    if (!records.length) return { labels: [], uncertain: [], reason: "no enrolled voiceprints" };
    const enrolled = new Map();
    const locked = [];
    for (const record of records) {
      try {
        enrolled.set(record.name, await openVoiceprint(record, pass));
      } catch {
        locked.push(record.name);
      }
    }
    if (!enrolled.size) {
      return { labels: [], uncertain: [], locked,
        reason: "no enrolled template could be opened with this admin passcode" };
    }
    const turns = voiceTurns(transcript, knownSpeakers || [], buffer.duration);
    const numbers = [...new Set(turns.map((turn) => turn.number).filter(Number.isInteger))];
    if (!numbers.length) {
      return { labels: [], uncertain: [], reason: "the transcript has no diarized speaker numbers" };
    }
    const candidates = new Map();
    const tooShort = [];
    for (const number of numbers) {
      const intervals = turns.filter((turn) => turn.number === number)
        .map((turn) => ({ from: turn.at, to: turn.to }));
      try {
        candidates.set(number, voiceTemplate(buffer, intervals));
      } catch {
        tooShort.push(number);
      }
    }
    const result = assignVoiceprints(candidates, enrolled, {
      minimumScore: 0.7,
      minimumMargin: 0.04
    });
    result.uncertain = [...new Set((result.uncertain || []).concat(tooShort))];
    result.locked = locked;
    result.reason = result.labels.length ? "matched" : "no unambiguous enrolled voice was found";
    return result;
  }

  const voiceMatchReport = (result) => {
    const labels = (result.labels || []).map((label) =>
      "Speaker " + label.number + " → " + label.name + " (similarity " +
      Math.round(label.score * 100) + "%, margin " + Math.round(label.margin * 100) + "%)")
      .join("; ");
    const locked = result.locked && result.locked.length
      ? "; re-enrol locked template" + (result.locked.length === 1 ? " " : "s ") + result.locked.join(", ")
      : "";
    return labels + locked;
  };

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
      /* The Free.ai panel inside this one needs to know an administrator is
         present. The pass is kept for this tab only, never written to disk. */
      if (window.EGAdminKeep) window.EGAdminKeep(pass);
      /* Mint the remembered key: no page of the house asks twice. */
      try {
        fetch("/api/owner", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "unlock", pass: pass })
        }).then((r) => r.json().catch(() => ({})))
          .then((d) => {
            if (d && d.ok && d.token) {
              window.__egDoorToken = d.token;
              document.cookie = "eg-admin=" + d.token + "; path=/; max-age=604800; SameSite=Lax";
            }
          }).catch(() => {});
      } catch (e) { /* the key stays in this tab only */ }
      /* The public shelf learns an administrator is present, so summaries
         can be edited where they stand. Kept for this tab only. */
      window.EGMediaAdminOn = true;
      window.EGMediaPass = pass;
      say("Open. The key is remembered for this week, on every page. " +
        (window.EGToken && window.EGToken() ? "" :
          "Sign in at /join/ to upload or record — the episode is kept under your account."));
      drawShelf(d.items || []);
      fillNumber();
      if (window.EGMediaRefresh) window.EGMediaRefresh();
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
      gaps: on("gaps"), denoise: on("denoise"), destutter: on("destutter"),
      roomtone: on("roomtone"),
      gapHold: Number((root.querySelector("[data-am=gaphold]") || {}).value || 1.5),
      gapLeave: Number((root.querySelector("[data-am=gapleave]") || {}).value || 0.45),
      target: el.loud ? Number(el.loud.value) : -18,
      grade: on("grade"), shrink: on("shrink")
    };
  };

  /* The form the take is published in: MP3 or FLAC. The choice lives in
     "Four — the work"; where a page offers no choice (the film door), the
     default stands: MP3. */
  const fmtChoice = () => {
    const picked = root.querySelector('[data-am="fmt"]:checked');
    return picked && picked.value === "flac" ? "flac" : "mp3";
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
    let unlockedCtx = null;
    /* Pausing is a held state, not a stopped one: the recorder keeps the take
       open and simply stops taking, so the clock has to hold still with it or
       the length it reports would be a lie. */
    let pausedAt = 0, pausedTotal = 0, finishing = null;

    const state = (t) => { const n = r("state"); if (n) n.textContent = t || ""; };

    /* Seconds actually recorded, with the held stretches taken back out. */
    const elapsed = () =>
      (Date.now() - started - pausedTotal - (pausedAt ? Date.now() - pausedAt : 0)) / 1000;

    /* The two hands that belong to a take in progress: the pause, and the
       door that saves and publishes in one press. Both sit in the markup
       hidden and come up only once there is a take to hold or to save. */
    function liveButtons(on) {
      const p = r("pause"), s = r("savepub");
      if (p) p.hidden = !on;
      if (s) { s.hidden = !on; s.disabled = !on; }
      if (!on) { pausedAt = 0; pausedTotal = 0; paintPause(); }
    }

    function paintPause() {
      const p = r("pause");
      if (!p) return;
      p.classList.toggle("is-paused", !!pausedAt);
      p.setAttribute("aria-pressed", pausedAt ? "true" : "false");
      p.textContent = pausedAt ? "Continue recording" : "Pause recording";
    }

    function paintClock() {
      state(pausedAt
        ? "Held at " + clock(elapsed()) + " \u2014 press continue to carry on."
        : "Recording \u2014 " + clock(elapsed()));
      paintPause();
    }

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
      const ctx = unlockedCtx || new (window.AudioContext || window.webkitAudioContext)();
      unlockedCtx = null;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
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
      if (!(window.EGToken && window.EGToken())) {
        state("Sign in first — recording for the site needs a signed-in account. The sign-in is at /join/.");
        return;
      }
      /* iPhone Safari only lets an audio context start from a tap. Made here,
         before the microphone is asked for, so the level meter can run. */
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC && KIND === "audio") {
          unlockedCtx = new AC();
          if (unlockedCtx.state === "suspended") unlockedCtx.resume().catch(() => {});
        }
      } catch (e) { unlockedCtx = null; }
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
      /* Held on to, so the save-and-publish hand can wait for the take to be
         read back before it tries to publish something that is not there. */
      rec.onstop = () => { finishing = finish(); };
      rec.start(1000);
      started = Date.now();
      pausedAt = 0;
      pausedTotal = 0;
      finishing = null;
      r("stop").disabled = false;
      root.classList.add("is-recording");
      liveButtons(true);
      tick = setInterval(paintClock, 250);
      paintClock();
      say("Recording. Hold it with the pause if you need to; stop when you are done, " +
          "or save and publish it from here in one press.");
    }

    r("stop").addEventListener("click", () => {
      if (rec && rec.state !== "inactive") rec.stop();
      r("stop").disabled = true;
    });

    /* The pause hand. MediaRecorder holds the take open and simply stops
       taking, so continuing picks up inside the same file rather than making
       a second one to be stitched together afterwards. Where a browser offers
       no pause at all, say so rather than pretending it worked. */
    const pauseBtn = r("pause");
    if (pauseBtn) pauseBtn.addEventListener("click", () => {
      if (!rec || rec.state === "inactive") return;
      if (typeof rec.pause !== "function" || typeof rec.resume !== "function") {
        return say("This browser cannot hold a recording mid-take. Stop it and start again.", true);
      }
      try {
        if (pausedAt) { pausedTotal += Date.now() - pausedAt; pausedAt = 0; rec.resume(); }
        else { pausedAt = Date.now(); rec.pause(); }
      } catch (err) {
        return say((err && err.message) || "The recorder would not hold still.", true);
      }
      paintClock();
      say(pausedAt ? "Held. Nothing is being recorded until you press continue."
        : "Carrying on from where it was held.");
    });

    /* One press that finishes the take and puts it on the site: stop, wait for
       it to be read back, then run the very same publish path the shelf uses.
       The save lands in the owner's vault like any other. */
    const saveBtn = r("savepub");
    if (saveBtn) saveBtn.addEventListener("click", async () => {
      if (!rec && !source) return say("There is no recording to save yet.", true);
      saveBtn.disabled = true;
      try {
        if (rec && rec.state !== "inactive") rec.stop();
        if (finishing) await finishing;
      } catch (err) { /* finish reports its own trouble on the page */ }
      if (!source) { saveBtn.disabled = false; return; }
      await publishIt(saveBtn);
      saveBtn.disabled = false;
    });

    async function finish() {
      clearInterval(tick);
      /* Taken before the counters are cleared, or a take that was held would
         be reported with the held stretch still counted in it. */
      const took = elapsed();
      root.classList.remove("is-recording");
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (meter) { meter.live = false; meter.ctx.close().catch(() => {}); meter = null; }
      r("start").disabled = false;
      /* The pause hand has nothing left to hold; the save-and-publish door
         stays up, because the take it offers is now the finished one. */
      const pauseGone = r("pause");
      if (pauseGone) { pauseGone.hidden = true; pauseGone.classList.remove("is-paused"); }
      pausedAt = 0;
      pausedTotal = 0;

      const blob = new Blob(bits, { type: bits[0] ? bits[0].type : "audio/webm" });
      state("Recorded " + clock(took) + " \u2014 " + mb(blob.size) + ".");
      /* Hand it to the same path a chosen file takes. */
      source = blob;
      ready = null;
      pendingNewVoiceMatches = null;
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
          fileLook = { seconds: took };
          el.before.innerHTML = '<p class="kicker">As it was recorded</p><ul class="am-read">' +
            "<li>Length <strong>" + clock(fileLook.seconds) + "</strong></li>" +
            "<li>Weight <strong>" + mb(blob.size) + "</strong></li></ul>";
        }
        if (el.meta) el.meta.hidden = false;
        if (el.send) el.send.disabled = false;
        say("Recorded. Enhance it, have it transcribed, then publish \u2014 or save and " +
            "publish it from the recorder in one press.");
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
    pendingNewVoiceMatches = null;
    if (el.meta) el.meta.hidden = true;
    if (el.pubrow) el.pubrow.hidden = true;   /* a new file starts over */
    if (el.after) el.after.innerHTML = "";
    if (!f) return;
    source = f;
    if (el.title && !el.title.value) {
      el.title.value = f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
    }
    say("Reading " + f.name + " \u2014 " + mb(f.size) + "\u2026");
    try {
      if (KIND === "audio") {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          fileBuf = await ctx.decodeAudioData(await f.arrayBuffer());
          ctx.close();
          fileLook = inspect(fileBuf);
          el.before.innerHTML = reading(fileLook, "As it arrived");
          say("Read. Choose what to do to it, then enhance.");
        } catch {
          /* A format this browser cannot decode — a WMA, say, which no
             browser can open. The file is not lost: it can still be
             published exactly as it arrived, and downloaded from the page. */
          fileBuf = null;
          fileLook = null;
          el.before.innerHTML = '<p class="kicker">As it arrived</p><ul class="am-read">' +
            "<li>Weight <strong>" + mb(f.size) + "</strong></li>" +
            "<li>Kind <strong>" + esc(f.type || "unknown") + "</strong></li></ul>";
          say("This browser cannot open that file for cleaning — it can still " +
            "be published exactly as it arrived.");
        }
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
    step("Starting the work\u2026", 0);   /* the bar appears at once */
    try {
      if (KIND === "audio") await enhanceAudio(want);
      else await enhanceVideo(want);
    } catch (err) {
      say((err && err.message) || "The enhancement failed.", true);
    } finally {
      el.run.disabled = false;
    }
  });

  /* ---------------------------------------------------- the denoise gate
     A real gate, done where a real gate can only be done: over the
     rendered samples, frame by frame. The node chain above cannot gate
     honestly — WebAudio has no expander node — so this measures the
     file's own noise floor and voice level, opens the gate just *before*
     each word (so consonants survive), holds it across the short breaths
     inside a phrase, and shuts only on what stands alone: a cough, a
     sniff, a chair knock. Speech itself is never turned down — the gate
     either passes it untouched or silences what is not speech at all.
     A burst is only dropped when it is short, alone on both sides, *and*
     unvoiced by its zero-crossings, so a one-word answer like "Yes." is
     kept while a cough is not. */
  /* The shared eyes: 20 ms frames of loudness and noisiness, measured on
     the samples themselves. Both the gate and the de-stutter look
     through this and nothing else. */
  function frameEnvelope(buf) {
    const rate = buf.sampleRate;
    const chans = buf.numberOfChannels;
    const FRAME = Math.max(1, Math.round(rate * 0.02));
    const frames = Math.max(1, Math.ceil(buf.length / FRAME));
    const ch = [];
    for (let c = 0; c < chans; c++) ch.push(buf.getChannelData(c));
    const rms = new Float64Array(frames);
    const zcr = new Float64Array(frames);
    for (let f = 0; f < frames; f++) {
      const a = f * FRAME, b = Math.min(buf.length, a + FRAME);
      let sum = 0, k = 0, cross = 0, last = 0;
      for (let i = a; i < b; i++) {
        let v = 0;
        for (let c = 0; c < chans; c++) { const s = ch[c][i]; v += s * s; }
        sum += v / chans; k++;
        const mono = ch[0][i];
        if (i > a && ((mono >= 0) !== (last >= 0))) cross++;
        last = mono;
      }
      rms[f] = Math.sqrt(sum / Math.max(1, k));
      zcr[f] = cross / Math.max(1, b - a - 1);
    }
    return { ch, FRAME, frames, rate, rms, zcr };
  }

  /* The floor of the room and the level of the voice, measured from the
     file itself — every threshold in here hangs off these two. */
  function floorAndVoice(E) {
    const sorted = Float64Array.from(E.rms).sort();
    return {
      floor: sorted[Math.floor(E.frames * 0.15)] || 0,
      voice: sorted[Math.floor(E.frames * 0.85)] || 0
    };
  }

  function denoiseGate(buf) {
    const E = frameEnvelope(buf);
    const { ch, FRAME, frames, rate, rms, zcr } = E;
    const n = buf.length;

    const { floor, voice } = floorAndVoice(E);
    /* A file with no speech in it gets no gate at all — there would be
       nothing to protect and everything to lose. */
    if (voice < 1e-4 || voice <= floor * 1.6) return { buf, bursts: 0, floor };

    const openTh = Math.max(floor * 3.2, voice * 0.10);
    const closeTh = openTh * 0.55; /* hysteresis: shut lower than we open */

    const open = new Uint8Array(frames);
    let held = 0;
    for (let f = 0; f < frames; f++) {
      if (rms[f] >= openTh) held = 1;
      else if (rms[f] < closeTh) held = 0;
      open[f] = held;
    }

    /* What stands alone — gone within a quarter of a second, no speech
       within 300 ms either side, and noisy by its zero-crossings — is a
       cough or a knock, not a word. Those the gate shuts on. */
    const ALONE = 15, SHORT = 12, NOISY = 0.20;
    let bursts = 0;
    let f = 0;
    while (f < frames) {
      if (!open[f]) { f++; continue; }
      let g = f;
      while (g < frames && open[g]) g++;
      const len = g - f;
      let near = false;
      for (let i = Math.max(0, f - ALONE); !near && i < f; i++) near = open[i] === 1;
      for (let i = g; !near && i < Math.min(frames, g + ALONE); i++) near = open[i] === 1;
      if (len <= SHORT && !near) {
        let z = 0;
        for (let i = f; i < g; i++) z += zcr[i];
        if (z / len >= NOISY) { for (let i = f; i < g; i++) open[i] = 0; bursts++; }
      }
      f = g;
    }

    /* Hold across the short breaths inside a phrase, so words are never
       separated from each other. */
    const HOLD = 11; /* 220 ms */
    for (let i = 0; i < frames - 1; i++) {
      if (!open[i]) continue;
      let j = i + 1;
      while (j < frames && !open[j]) j++;
      if (j < frames && j - i - 1 <= HOLD) for (let k = i + 1; k < j; k++) open[k] = 1;
    }

    /* Open just before each word and let it ring out after. Measured from
       a snapshot of the boundaries — extending the live array would let
       each fresh frame extend the next, and the gate would creep open
       across the whole episode. */
    const PRE = 5, POST = 4; /* 100 ms in, 80 ms out */
    const edges = Uint8Array.from(open);
    for (let i = 0; i < frames; i++) {
      if (!edges[i]) continue;
      if (i === 0 || !edges[i - 1])
        for (let k = Math.max(0, i - PRE); k < i; k++) open[k] = 1;
      if (i === frames - 1 || !edges[i + 1])
        for (let k = i + 1; k < Math.min(frames, i + 1 + POST); k++) open[k] = 1;
    }

    /* Write the gain: fast attack, slower release, so nothing clicks. */
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const out = ctx.createBuffer(ch.length, n, rate);
    ctx.close();
    const atk = 1 - Math.exp(-1 / (rate * 0.008));
    const rel = 1 - Math.exp(-1 / (rate * 0.014));
    for (let c = 0; c < ch.length; c++) {
      const srcD = ch[c];
      const dst = out.getChannelData(c);
      let gNow = 0;
      for (let i = 0; i < n; i++) {
        const target = open[(i / FRAME) | 0] ? 1 : 0;
        gNow += (target - gNow) * (target > gNow ? atk : rel);
        dst[i] = srcD[i] * gNow;
      }
    }
    return { buf: out, bursts, floor };
  }

  /* ------------------------------------------------------- the de-stutter
     A stutter has a signature: the same short syllable, landing two or
     three times in a row, each landing nearly the length, loudness and
     pitch of the last, with a breath between — and then the word itself,
     spoken once, longer. Only that exact pattern is touched, and only
     the repeats: the word at the end is never cut, nothing longer than a
     syllable is ever cut, and a word a speaker chose to say twice on
     purpose ("wait — wait") stands, because a chosen repeat is longer
     than a syllable and sits behind a longer pause.

     The repeats are silenced where they stand rather than spliced out.
     A splice would move everything after it, and plates are cued to
     moments in this episode; a silenced repeat leaves the timeline
     exactly where it was, and the gate mops up what is left.

     The guard rail matters more than the detection. If the pattern
     fires often enough that speech itself must be in doubt — singing,
     applause, a room full of cutlery — the whole pass is abandoned and
     nothing at all is touched. A stutter kept is a small harm; a
     sentence eaten is not. */
  function pitchOf(data, a, b, rate) {
    /* The roughest honest pitch: autocorrelation over the stretch, the
       lag between 60 and 400 Hz that agrees with itself best. */
    const n = b - a;
    if (n < Math.floor(rate / 200)) return 0;
    const minLag = Math.floor(rate / 400), maxLag = Math.min(n - 1, Math.floor(rate / 60));
    let best = 0, bestV = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let s = 0;
      for (let i = a; i + lag < b; i++) s += data[i] * data[i + lag];
      if (s > bestV) { bestV = s; best = lag; }
    }
    return best ? rate / best : 0;
  }

  function destutter(buf) {
    const E = frameEnvelope(buf);
    const { ch, FRAME, frames, rate, rms, zcr } = E;
    const { floor, voice } = floorAndVoice(E);
    if (voice < 1e-4 || voice <= floor * 1.6)
      return { buf, events: [], skipped: "" };

    const th = Math.max(floor * 3.2, voice * 0.10);
    const closeTh = th * 0.55;
    const ms = (f) => f * FRAME * 1000 / rate;

    /* Syllables: runs of voiced frames, split by breaths. */
    const segs = [];
    let held = 0, start = -1;
    for (let f = 0; f <= frames; f++) {
      const on = f < frames && (rms[f] >= th || (held && rms[f] >= closeTh));
      held = on ? 1 : 0;
      if (on && start < 0) start = f;
      if (!on && start >= 0) {
        let r = 0, z = 0;
        for (let i = start; i < f; i++) { r += rms[i]; z += zcr[i]; }
        segs.push({ from: start, to: f, rms: r / (f - start), zcr: z / (f - start), pitch: 0 });
        start = -1;
      }
    }

    const similar = (a, b, tolDur, tolPitch) => {
      const la = a.to - a.from, lb = b.to - b.from;
      if (Math.max(la, lb) / Math.min(la, lb) > tolDur) return false;
      if (Math.max(a.rms, b.rms) / Math.max(1e-9, Math.min(a.rms, b.rms)) > 2.2) return false;
      if (Math.max(a.zcr, b.zcr) / Math.max(1e-6, Math.min(a.zcr, b.zcr)) > 3) return false;
      if (a.pitch > 0 && b.pitch > 0) {
        const cents = Math.abs(1200 * Math.log2(a.pitch / b.pitch));
        if (cents > tolPitch) return false;
      }
      return true;
    };

    /* Walk the syllables and find the pattern: repeats, then the word. */
    const events = [];
    const doomed = [];
    let i = 0;
    while (i < segs.length - 1) {
      const a = segs[i];
      const dur = ms(a.to - a.from);
      const gap = ms(segs[i + 1].from - a.to);
      /* A repeat is shorter than a word — a syllable, not a word — and
         hurries into the next. Anything 220 ms or longer could be a
         word a person meant to say, and words are not ours to remove. */
      if (dur < 50 || dur > 220 || gap < 25 || gap > 250) { i++; continue; }
      if (!a.pitch) a.pitch = pitchOf(ch[0], a.from * FRAME, Math.min(buf.length, a.to * FRAME), rate);

      /* Gather the run of repeats behind it. */
      let j = i + 1;
      while (j < segs.length) {
        const s = segs[j];
        const g = j + 1 < segs.length ? ms(segs[j + 1].from - s.to) : Infinity;
        if (!similar(a, s, 1.35, 400)) break;
        if (g !== Infinity && (g < 25 || g > 250)) break;
        j++;
      }
      const repeats = j - i; /* candidates, at least one */
      const anchor = segs[j];

      /* The word the stutter was reaching for: it must be there, clearly
         longer than a repeat, and kin — the same pitch family, arriving
         straight out of the last repeat. A chosen repetition
         ("wait — wait") has no such anchor and stands. */
      const anchorGap = anchor ? ms(anchor.from - segs[j - 1].to) : Infinity;
      const anchorDur = anchor ? ms(anchor.to - anchor.from) : 0;
      if (!anchor || repeats < 2 || anchorGap > 250 ||
          anchorDur < Math.max(250, dur * 1.3)) { i++; continue; }
      if (!anchor.pitch)
        anchor.pitch = pitchOf(ch[0], anchor.from * FRAME, Math.min(buf.length, anchor.to * FRAME), rate);
      if (a.pitch > 0 && anchor.pitch > 0 &&
          Math.abs(1200 * Math.log2(a.pitch / anchor.pitch)) > 500) { i++; continue; }

      /* Two repeats minimum — one echo of a syllable is prosody, not a
         stutter. And the LAST repeat always stands: in "I — I — I mean"
         the last "I" is the word itself, and in "b — b — but" keeping it
         costs a faint hesitation where cutting it would cost a word. */
      doomed.push(segs.slice(i, i + repeats - 1));
      events.push({ at: segs[i].from * FRAME / rate, n: repeats - 1 });
      i = j + 1;
    }

    /* The guard rail: too much "stuttering" means this is not speech. */
    let speech = 0, drop = 0;
    for (const s of segs) speech += s.to - s.from;
    for (const grp of doomed) for (const s of grp) drop += s.to - s.from;
    if (doomed.length > 30 || (speech > 0 && drop > speech * 0.03)) {
      return {
        buf, events: [],
        skipped: "the stutter check found " + doomed.length +
          " places — too many to trust, so nothing was touched"
      };
    }
    if (!doomed.length) return { buf, events: [], skipped: "" };

    /* Silence the repeats where they stand: 5 ms ramps, timeline intact. */
    const mute = new Uint8Array(frames);
    for (const grp of doomed) for (const s of grp)
      for (let t = s.from; t < s.to; t++) mute[t] = 1;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const out = ctx.createBuffer(ch.length, buf.length, rate);
    ctx.close();
    const atk = 1 - Math.exp(-1 / (rate * 0.005));
    const rel = 1 - Math.exp(-1 / (rate * 0.010));
    for (let c = 0; c < ch.length; c++) {
      const srcD = ch[c];
      const dst = out.getChannelData(c);
      let gNow = 1;
      for (let t = 0; t < buf.length; t++) {
        const target = mute[(t / FRAME) | 0] ? 0 : 1;
        gNow += (target - gNow) * (target > gNow ? atk : rel);
        dst[t] = srcD[t] * gNow;
      }
    }
    return { buf: out, events, skipped: "" };
  }

  /* ------------------------------------------------------- the room tone
     A gated recording has holes in it: where the gate shut, or a repeat
     was silenced, the samples are digital zero — and the ear hears
     those holes as dead air against the room's own breathing. So the
     silences are re-laid with the room's tone: noise measured from the
     file's own floor, warmed by a one-pole filter so it is air and not
     hiss, and breathed by a slow swell so it never sounds like a synth
     holding one note. Where the room already breathes — an ungated
     quiet stretch — nothing is added; the fill stops as the real floor
     is reached. A recording with no floor at all is left alone: studio
     digital has no continuity to mend, and inventing a room for it
     would be a lie. */
  function roomTone(buf, knownFloor) {
    const E = frameEnvelope(buf);
    const { ch, FRAME, frames, rate, rms } = E;
    /* The floor must be the room's level BEFORE the gate scoured it to
       digital zero — so the gate hands its measurement down. Measuring
       here would find the holes the gate dug and call them the floor. */
    const floor = knownFloor != null ? knownFloor : floorAndVoice(E).floor;
    if (floor < 1e-5) return { buf, filled: 0 };
    const target = Math.min(floor, 0.01); /* the room's level, never a shout */

    let seed = 1234567;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff * 2 - 1;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const out = ctx.createBuffer(ch.length, buf.length, rate);
    ctx.close();

    /* One-pole lowpass at about 3.5 kHz, and the matching divisor so the
       filtered noise lands on the room's measured level. */
    const a = 1 - Math.exp(-2 * Math.PI * 3500 / rate);
    const norm = target / (0.577 * Math.sqrt(a / (2 - a)));

    const filledFrames = new Uint8Array(frames);
    for (let c = 0; c < ch.length; c++) {
      const srcD = ch[c];
      const dst = out.getChannelData(c);
      let lp = 0, gNow = 0;
      for (let i = 0; i < buf.length; i++) {
        const f = (i / FRAME) | 0;
        /* How much of the floor is missing here: full fill over digital
           zero, nothing where the room is already present. */
        const have = rms[f] / target;
        const wantG = have >= 1 ? 0 : 1 - have;
        if (c === 0 && wantG > 0.5) filledFrames[f] = 1;
        /* A slow breath, ±25%, a shade out of step per channel. */
        const breath = 1 + 0.25 * Math.sin(2 * Math.PI * 0.2 * i / rate + c);
        gNow += (wantG - gNow) * 0.0005;
        lp += a * (rnd() - lp);
        dst[i] = srcD[i] + lp * norm * breath * gNow;
      }
    }
    let filled = 0;
    for (let f = 0; f < frames; f++) filled += filledFrames[f];
    return { buf: out, filled: filled * FRAME / rate };
  }

  async function enhanceAudio(want) {
    if (!fileBuf) {
      return say(source
        ? "That file cannot be cleaned in this browser \u2014 publish it as it arrived."
        : "Choose a file first.", true);
    }

    /* The chosen form first: whatever arrived is converted to the chosen
       format — MP3 or FLAC — the moment the button is pressed, and all of
       the work after runs on the converted take. What is published at the
       end is the same format again. */
    const fmt = fmtChoice();
    step("Converting to " + (fmt === "flac" ? "FLAC" : "MP3") + "\u2026", 0.04);
    const conv = await encode(fileBuf, fmt);
    const c1 = new (window.AudioContext || window.webkitAudioContext)();
    fileBuf = await c1.decodeAudioData(await conv.blob.arrayBuffer());
    c1.close();
    fileLook = inspect(fileBuf);
    const convNote = "converted to " + conv.label + " before the work";

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

    let done = await off.startRendering();
    let stutterNote = "";
    if (want.destutter) {
      step("Listening for stuttering\u2026", 0.62);
      const st = destutter(done);
      done = st.buf;
      if (st.skipped) stutterNote = st.skipped;
      else if (st.events.length) {
        const reps = st.events.reduce((s, e) => s + e.n, 0);
        stutterNote = reps + " repeated syllable" + (reps === 1 ? "" : "s") + " muted at " +
          st.events.length + " place" + (st.events.length === 1 ? "" : "s") +
          " (" + st.events.slice(0, 6).map((e) => clock(e.at) + " \u00d7" + e.n).join(", ") +
          (st.events.length > 6 ? ", \u2026" : "") + ")";
      } else stutterNote = "no stuttering found";
    }
    let gateNote = "";
    let preFloor = null;
    if (want.denoise) {
      step("Gating \u2014 sniffs and coughs out, words left whole\u2026", 0.7);
      const gated = denoiseGate(done);
      done = gated.buf;
      preFloor = gated.floor;   /* the room's level, before the gate scoured it */
      if (gated.bursts)
        gateNote = gated.bursts + " isolated noise burst" + (gated.bursts === 1 ? "" : "s") +
          " gated out";
    }
    let toneNote = "";
    if (want.roomtone) {
      step("Laying the room's own tone under the silences\u2026", 0.78);
      const toned = roomTone(done, preFloor);
      done = toned.buf;
      if (toned.filled >= 0.05)
        toneNote = "room tone laid under " + clock(toned.filled) + " of silence";
    }
    step("Measuring\u2026", 0.82);
    const look = inspect(done);
    const notes = [cutNote, stutterNote, gateNote, toneNote].filter(Boolean);
    el.after.innerHTML = reading(look, "After the work") +
      (notes.length ? '<p class="muted xsmall">' + notes.join("; ") + ".</p>" : "");

    step("Encoding\u2026", 0.85);
    const made = await encode(done, fmt);
    const treatment = [
      convNote,
      want.rumble && "rumble filtered below 72 Hz",
      want.gate && "hiss shelved",
      want.tone && "tone shaped (mud down, presence and air up)",
      want.deess && "de-essed",
      want.level && "levelled",
      want.loud && ("matched to " + want.target + " dB RMS"),
      want.gaps && cutNote,
      want.destutter && stutterNote,
      want.denoise && (gateNote
        ? "sniffs and coughs gated out \u2014 " + gateNote
        : "silences gated, no stray bursts found"),
      want.roomtone && (toneNote || "room tone checked, silences already continuous"),
      want.trim && "silence trimmed from both ends",
      want.fade && "faded in and out"
    ].filter(Boolean).join(", ") || "left as it was";

    ready = { blob: made.blob, mime: made.mime, seconds: done.duration, treatment, look };
    showPreview(made.blob, "audio");
    step("Done \u2014 " + mb(made.blob.size) + " as " + made.label, 1);
    say("Enhanced: " + treatment + ". Listen to it, then publish.");
    if (el.meta) el.meta.hidden = false;
    if (el.pubrow) el.pubrow.hidden = false;   /* the publish door appears */
  }

  /* MP3 or FLAC by the chosen door; MP3 if lamejs will load, FLAC through
     the site's own encoder, WAV if neither will load. An hour of WAV is
     half a gigabyte, so a compressed door matters; failing over to WAV is
     better than failing. */
  async function encode(buf, fmt) {
    if (fmt === "flac") {
      try {
        const mod = await flacEnc();
        const chans = Math.min(2, buf.numberOfChannels);
        const list = [];
        for (let c = 0; c < chans; c++) list.push(buf.getChannelData(c));
        const made = mod.encodeFlac({
          sampleRate: buf.sampleRate,
          channels: list,
          progress: (done, total) => {
            if (done % 64 === 0 || done === total)
              step("Encoding\u2026 " + Math.round((done / total) * 100) + "%",
                0.85 + (done / total) * 0.14);
          }
        });
        return { blob: new Blob([made], { type: "audio/flac" }), mime: "audio/flac", label: "FLAC" };
      } catch {
        return { blob: wav(buf), mime: "audio/wav", label: "WAV (the FLAC encoder would not load)" };
      }
    }
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
    if (el.meta) el.meta.hidden = false;
    if (el.pubrow) el.pubrow.hidden = false;   /* the publish door appears */
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
     Private BrowserWhisper decodes the recording in bounded 16 kHz pieces and
     runs Whisper Base in background workers on this machine. Episode audio is
     not uploaded for transcription. Timestamped words arrive in order; then
     EGregoRA receives the completed text so the archivist can write the title,
     summary, tags and links. Those links are checked against the real site
     index, so the archivist cannot invent a destination. */
  let listing = null;     /* what the archivist wrote, kept for the upload */
  let earBy = "";         /* which ear heard the episode */
  let pendingNewVoiceMatches = null; /* local-only matches until the media row exists */

  /* The ear, opened directly beneath the button: a read-only box the
     transcript is typed into as it is heard. */
  const hearBtn = root.querySelector("[data-am=hear]");
  let earBox = null;
  function earShow() {
    if (!earBox) {
      earBox = document.createElement("textarea");
      earBox.readOnly = true;
      earBox.rows = 10;
      earBox.className = "am-ear";
      earBox.setAttribute("aria-label", "The transcript as it is heard");
      /* Directly underneath the button, clear of the button row's flex. */
      const row = (hearBtn && hearBtn.closest(".btn-row")) || hearBtn;
      if (row) row.insertAdjacentElement("afterend", earBox);
    }
    earBox.hidden = false;
    return earBox;
  }

  /* Types the transcript out a few characters at a time; interim words sit
     behind a caret until they are final. */
  function makeTyper(node) {
    let target = "", shown = 0, ghost = "", live = true;
    (function tick() {
      if (!live) return;
      if (shown < target.length) shown = Math.min(target.length, shown + 9);
      node.value = target.slice(0, shown) +
        (shown < target.length || ghost ? " \u258c " + ghost : "");
      node.scrollTop = node.scrollHeight;
      window.setTimeout(tick, 16);
    })();
    return {
      add: (s) => { target += s; },
      ghost: (s) => { ghost = s || ""; },
      text: () => target,
      stop: () => { live = false; node.value = target; node.scrollTop = node.scrollHeight; }
    };
  }

  /* Private local transcription is a separate in-browser application:
     BrowserWhisper runs Whisper Base inside two workers, decodes in bounded
     pieces, caches the model in the browser's private origin storage, and
     never uploads episode audio to a speech-to-text provider. The first use
     downloads the model; later uses read the cached copy. A pause longer than
     two and a half seconds remains the conservative provisional turn change,
     with one timestamp only when the displayed speaker changes. */
  const PRIVATE_WHISPER_MODULE =
    "/assets/js/private-whisper/browser-whisper.js?v=private-whisper-1";
  let whisperEngine = null;
  let whisperLoad = null;

  /* A seam \u2014 a loader the page can override \u2014 lets the test harness
     stand in a fake ear; in the browser it is a plain dynamic import. */
  function browserWhisperLoader() {
    if (window.EGBrowserWhisperLoader) return window.EGBrowserWhisperLoader();
    return import(PRIVATE_WHISPER_MODULE);
  }

  async function whisper(report = step) {
    if (whisperEngine) return whisperEngine;
    if (!whisperLoad) {
      report("Opening private local Whisper \u2014 audio stays on this device", 0.02);
      whisperLoad = browserWhisperLoader()
        .then(function (module) {
          whisperEngine = new module.BrowserWhisper({
            model: "whisper-base",
            language: "en",
            quantization: "hybrid"
          });
          return whisperEngine;
        })
        .catch(function (error) {
          whisperLoad = null;
          throw error;
        });
    }
    return whisperLoad;
  }

  async function listenWhisper(blob, seconds, typer, report = step) {
    const engine = await whisper(report);
    if (!(blob instanceof Blob) || !blob.size) {
      throw new Error("private Whisper needs the recording file, but it is not available");
    }
    const type = blob.type || "audio/mpeg";
    const suffix = type.includes("mp4") || type.includes("m4a") ? "m4a"
      : type.includes("wav") ? "wav"
        : type.includes("webm") ? "webm" : "mp3";
    const input = blob instanceof File
      ? blob
      : new File([blob], "egregora-private-transcription." + suffix, { type });
    let speaker = 1, lastEnd = 0, wrote = false, furthest = 0.02;

    const stage = function (event) {
      const amount = Math.max(0, Math.min(1, Number(event && event.progress) || 0));
      const name = String((event && event.stage) || "");
      let fraction = furthest, label = "Private Whisper is preparing locally";
      if (name === "loading") {
        fraction = 0.03 + amount * 0.29;
        label = amount < 1
          ? "Private Whisper model \u2014 " + Math.round(amount * 100) + "% downloaded or read from cache"
          : "Private Whisper model ready on this device";
      } else if (name === "decoding") {
        fraction = 0.32 + amount * 0.08;
        label = "Decoding the recording locally \u2014 " + Math.round(amount * 100) + "%";
      } else if (name === "transcribing") {
        label = "Private Whisper is transcribing locally";
      }
      furthest = Math.max(furthest, fraction);
      report(label, furthest);
    };

    const stream = engine.transcribe(input, { onProgress: stage });
    try {
      for await (const segment of stream) {
        const words = String(segment && segment.text || "").trim();
        if (!words) continue;
        const start = Math.max(0, Number(segment.start) || 0);
        const end = Math.max(start, Number(segment.end) || start);
        const changed = wrote && start - lastEnd > 2.5;
        if (changed) speaker = speaker === 1 ? 2 : 1;
        typer.add(!wrote
          ? "[" + clock(start) + "] Speaker " + speaker + " \u2014 " + words
          : changed
            ? "\n\n[" + clock(start) + "] Speaker " + speaker + " \u2014 " + words
            : " " + words);
        wrote = true;
        lastEnd = Math.max(lastEnd, end);
        const heard = seconds > 0 ? Math.min(1, end / seconds) : 0;
        furthest = Math.max(furthest, 0.40 + heard * 0.50);
        report("Private Whisper \u2014 " + clock(end) +
          (seconds > 0 ? " of " + clock(seconds) : " transcribed"), furthest);
      }
    } catch (error) {
      if (stream && stream.cancel) stream.cancel();
      const detail = String((error && error.message) || error || "local model failure");
      throw new Error("private local Whisper could not finish: " + detail);
    }
    typer.ghost("");
    if (!wrote) throw new Error("private local Whisper found no speech in the recording");
    report("Private transcript assembled on this device", 0.92);
    return typer.text();
  }



  /* The archivist writes the listing from a transcript. summaryOnly touches
     nothing but the summary field. */
  async function describeListing(transcript, summaryOnly, report = step) {
    report(summaryOnly ? "Writing the summary from the transcript" : "Writing the summary and listing",
      summaryOnly ? 0.12 : 0.95);
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
    if (el.summary) {
      el.summary.value = d.summary || el.summary.value;
      el.summary.classList.add("am-summary-ready");
    }
    if (el.summaryState) {
      el.summaryState.hidden = false;
      el.summaryState.textContent = "Summary ready \u2014 written automatically from the transcript. Read and edit it before publishing.";
    }
    if (!summaryOnly) {
      if (el.title) el.title.value = d.title || el.title.value;
      if (el.tags) { el.tags.value = (d.tags || []).join(", "); if (el.markTags) el.markTags(); }
    }
    if (el.meta) el.meta.hidden = false;

    const n = root.querySelector("[data-am=listing]");
    if (n && !summaryOnly) {
      n.hidden = false;
      n.innerHTML = '<p class="kicker">What it heard</p>' +
        '<p class="muted small">Transcribed by ' + esc(earBy || "the ear") +
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
    report(summaryOnly ? "The summary is ready" : "The transcript, summary and listing are ready", 1);
    if (!summaryOnly)
      say("Listed: " + (d.title || "") + " \u2014 " + (d.tags || []).length + " tags, " +
        (d.links || []).length + " links into the site. Change anything you disagree with.");
    return d;
  }

  /* A summary from the transcript, without touching the rest. */
  let lastTranscript = "";
  const sumBtn = root.querySelector("[data-am=summarise]");
  if (sumBtn) sumBtn.addEventListener("click", async () => {
    if (!lastTranscript) return say("There is no transcript yet \u2014 transcribe first.", true);
    sumBtn.disabled = true;
    sumBtn.setAttribute("aria-busy", "true");
    sumBtn.textContent = "Writing the summary\u2026";
    transcriptionStep("Starting the summary", 0.03);
    try {
      await describeListing(lastTranscript, true, transcriptionStep);
      say("The summary is written from the transcript. Read it before you publish.");
      if (el.summary) el.summary.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      const message = (err && err.message) || "No model would write the summary just now.";
      transcriptionStep("Summary stopped \u2014 " + message, null, true);
      say(message, true);
    } finally {
      sumBtn.disabled = false;
      sumBtn.setAttribute("aria-busy", "false");
      sumBtn.textContent = "Rewrite only the summary";
    }
  });

  if (hearBtn) hearBtn.addEventListener("click", async () => {
    if (KIND !== "audio") return say("Only sound can be transcribed here.", true);
    const blob = (ready && ready.blob) || source;
    if (!blob) return say("Choose a recording first.", true);
    hearBtn.disabled = true;
    hearBtn.setAttribute("aria-busy", "true");
    hearBtn.textContent = "Transcribing now \u2014 summary follows\u2026";
    if (sumBtn) sumBtn.disabled = true;
    if (el.summaryState) el.summaryState.hidden = true;
    if (el.summary) el.summary.classList.remove("am-summary-ready");
    lastTranscript = "";
    let completed = false;
    transcriptionStep("Starting transcription", 0.01);
    const typer = makeTyper(earShow());
    try {
      /* The recording goes only to the separate private BrowserWhisper app.
         It works in background workers; there is no automatic cloud or
         microphone fallback that could send or play the episode elsewhere. */
      let buf = fileBuf;
      if (!buf) {
        try {
          const c0 = new (window.AudioContext || window.webkitAudioContext)();
          buf = await c0.decodeAudioData(await blob.arrayBuffer());
          c0.close();
        } catch { buf = null; }
      }
      earBy = "private local Whisper Base";
      say("Private Whisper is listening on this device. The first use downloads its model once; the audio is not uploaded for transcription.");
      lastTranscript = await listenWhisper(blob,
        (buf && buf.duration) || (ready && ready.seconds) || 0,
        typer, transcriptionStep);
      typer.stop();
      if (sumBtn) sumBtn.disabled = lastTranscript.trim().length < 40;
      if (lastTranscript.trim().length >= 40) {
        transcriptionStep("Checking enrolled voiceprints", 0.94);
        pendingNewVoiceMatches = buf
          ? await localVoiceMatches(buf, lastTranscript, []).catch((error) => ({
            labels: [], uncertain: [], reason: (error && error.message) || "voiceprint comparison unavailable"
          }))
          : { labels: [], uncertain: [], reason: "the audio could not be decoded locally" };
        /* A listing model is useful but not allowed to discard a successful
           private transcript. Keep it for publication before asking the
           separate text-only archivist to write metadata. */
        listing = { transcript: lastTranscript, links: [], topics: [], tags: [] };
        try {
          await describeListing(lastTranscript, false, transcriptionStep);
          if (el.summary) el.summary.scrollIntoView({ behavior: "smooth", block: "center" });
          if (pendingNewVoiceMatches.labels.length) {
            say("The listing is ready. Voiceprints found " + voiceMatchReport(pendingNewVoiceMatches) +
              (pendingNewVoiceMatches.uncertain.length ? "; uncertain voices remain unnamed." : "."));
          }
        } catch (summaryError) {
          if (el.meta) el.meta.hidden = false;
          const why = (summaryError && summaryError.message) || "the text-only archivist is unavailable";
          transcriptionStep("Private transcript ready \u2014 write or retry the summary: " + why, 1, true);
          say("The private transcript is safe and will publish with the episode. The summary was not written: " + why, true);
        }
        completed = true;
      } else {
        transcriptionStep("Transcription stopped \u2014 too few words were heard", null, true);
        say("The ear kept almost nothing \u2014 the listing is yours to write by hand.", true);
      }
    } catch (err) {
      typer.stop();
      transcriptionStep("Transcription or summary stopped \u2014 " +
        ((err && err.message) || "the work could not be completed"), null, true);
      say((err && err.message) || "The transcript and summary could not be completed.", true);
    } finally {
      hearBtn.disabled = false;
      hearBtn.setAttribute("aria-busy", "false");
      hearBtn.textContent = completed
        ? "Transcribe again and rewrite the summary"
        : "Try transcription and summary again";
      if (sumBtn) sumBtn.disabled = lastTranscript.trim().length < 40;
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
  /* One publish routine, two doors to it: the standing button below the
     listing, and the one that appears under the preview when the
     enhancement is done. Both ask the same plain question first. */
  async function publishIt(btn) {
    const blob = (ready && ready.blob) || source;
    if (!blob) return say("Nothing to publish yet.", true);
    const title = (el.title && el.title.value.trim()) || "";
    if (!title) return say("It needs a title.", true);

    if (!window.confirm("Do you want to publish \u201c" + title +
        "\u201d to the site? (y/n)"))
      return say("Not published \u2014 it stays here, unfinished business.");

    if (btn) btn.disabled = true;
    if (el.send && btn !== el.send) el.send.disabled = true;
    try {
      let pendingVoiceMatches = pendingNewVoiceMatches ||
        { labels: [], uncertain: [], reason: "not an audio transcript" };
      if (!pendingNewVoiceMatches && KIND === "audio" && fileBuf && listing && listing.transcript) {
        try {
          step("Checking every enrolled voiceprint, with Ed and Jim first", 0.02);
          pendingVoiceMatches = await localVoiceMatches(fileBuf, listing.transcript, []);
        } catch (error) {
          /* Identification may abstain or a passcode may have changed. Neither
             is a reason to lose a finished recording; it stays generically
             labelled and the editor explains what needs review. */
          pendingVoiceMatches = { labels: [], uncertain: [],
            reason: (error && error.message) || "voiceprint comparison unavailable" };
        }
      }
      const upload = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const begun = await post({ action: "begin", upload, mime: blob.type });
      const CH = Math.min(900000, begun.chunk_max || 900000);
      const raw = Math.floor(CH * 0.74);   /* base64 grows a third */
      const pieces = Math.ceil(blob.size / raw);

      for (let i = 0; i < pieces; i++) {
        const from = i * raw;
        const part = await blobPartBase64(blob, from, Math.min(blob.size, from + raw));
        await post({ action: "chunk", upload, seq: i, part });
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

      if (d && d.item && pendingVoiceMatches.labels.length) {
        try {
          const identified = await post({
            action: "voiceprint-labels",
            id: d.item.id,
            labels: pendingVoiceMatches.labels,
            feature_version: "eg-vp-mfsc-1"
          });
          d.item.speakers = identified.speakers || d.item.speakers;
        } catch (error) {
          pendingVoiceMatches = { labels: [], uncertain: pendingVoiceMatches.uncertain || [],
            reason: (error && error.message) || "the matched labels could not be stored" };
        }
      }
      const matchNote = pendingVoiceMatches.labels.length
        ? " Voiceprints assigned " + voiceMatchReport(pendingVoiceMatches) + "."
        : (KIND === "audio" && listing && listing.transcript
          ? " Voiceprints made no automatic assignment: " + pendingVoiceMatches.reason + "."
          : "");
      say("Published. It is on the page now \u2014 reload to see it in the list." + matchNote);
      step("Published", 1);
      const shelf = await post({ action: "shelf", kind: KIND });
      drawShelf(shelf.items || []);
      if (window.EGMediaRefresh) window.EGMediaRefresh();
      if (d && d.item) addToPage(d.item);
    } catch (err) {
      say((err && err.message) || "The upload failed.", true);
    } finally {
      if (btn) btn.disabled = false;
      if (el.send && btn !== el.send) el.send.disabled = false;
    }
  }
  if (el.send) el.send.addEventListener("click", () => publishIt(el.send));
  if (el.pubnow) el.pubnow.addEventListener("click", () => publishIt(el.pubnow));

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
      '<div><label for="' + KIND + '-ed-date">Purported creation date</label>' +
      '<input type="date" id="' + KIND + '-ed-date" data-ed="date" value="' +
      esc(item.purported_date || "") + '" placeholder="' + esc(item.date || "") + '">' +
      '<span class="muted xsmall">Actual upload date: ' + esc(item.date || "unknown") +
      ". Leave blank to show that instead.</span></div>" +
      '<div><label for="' + KIND + '-ed-tags">Tags</label>' +
      '<input type="text" id="' + KIND + '-ed-tags" data-ed="tags" value="' + esc(item.tags.join(", ")) + '"></div>' +
      "</div>" +
      '<label for="' + KIND + '-ed-summary">Summary</label>' +
      '<textarea id="' + KIND + '-ed-summary" data-ed="summary" rows="3">' + esc(item.summary) + "</textarea>" +
      '<div class="btn-row"><button class="btn btn--small" type="button" data-ed="save">Save the writing</button>' +
      '<button class="btn btn--small btn--ghost" type="button" data-ed="transcribe">Transcribe this episode</button>' +
      '<button class="btn btn--small btn--ghost" type="button" data-ed="sum-from-tr">Write the summary from its transcript</button>' +
      '<button class="btn btn--small btn--ghost" type="button" data-ed="read-tr">Read its transcript</button></div>' +
      '<p class="am-bar" data-ed="tr-progress" aria-label="Transcription progress" hidden></p>' +
      '<div class="ep-transcript" data-ed="trbox" hidden></div>' +

      (KIND === "audio"
        ? '<div class="divider">\u2726</div>' +
          '<p class="kicker">Consenting voiceprints</p>' +
          '<p class="muted small">Every audio transcript is checked for Edward Gregory and Jim Rankin first, then every further enrolled voice. ' +
          'The audio is analysed on this device; only passcode-encrypted, revocable templates are stored. ' +
          '<strong>It is never used to sign in, and an uncertain voice stays unnamed.</strong></p>' +
          '<label class="ae-pair"><input type="checkbox" data-ed="vp-consent"> ' +
          'I confirm that every person I enrol explicitly consents to biometric enrollment and podcast labelling.</label>' +
          '<div class="btn-row">' +
          '<button class="btn btn--small" type="button" data-ed="vp-from-turns">Enrol consenting named turns</button>' +
          '<button class="btn btn--small btn--ghost" type="button" data-ed="vp-match">Check every voiceprint now</button></div>' +
          '<p class="muted xsmall">For a cleaner enrollment, type one consenting speaker’s full name and record fifteen seconds alone. ' +
          'Read naturally: “Every changing pattern leaves a trace; careful listening separates the voice from the room.”</p>' +
          '<div class="am-cut"><input type="text" data-ed="vp-name" maxlength="80" ' +
          'value="Edward Gregory" aria-label="Consenting speaker to enrol">' +
          '<button class="btn btn--small btn--ghost" type="button" data-ed="vp-record">Record 15-second enrollment</button></div>' +
          '<div data-ed="vp-list" class="muted small"></div>' +
          '<p data-ed="vp-state" class="muted small"></p>'
        : "") +

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
          '<p class="kicker">Drop another voice in</p>' +
          '<p class="muted small">Choose a moment, choose a file, and lay it over the episode \u2014 or ' +
          "hold the episode silent while the new voice plays. The master is only replaced when it is laid in.</p>" +
          '<div class="am-cut">' +
          '<button class="btn btn--small btn--ghost" type="button" data-ed="drop-here">Use the playhead</button>' +
          '<span data-ed="dropat" class="am-time">0:00</span>' +
          '<input type="file" data-ed="drop-file" ' +
          'accept="audio/*,video/mp4,.mp3,.wav,.flac,.aac,.m4a,.wma,.mp4">' +
          "</div>" +
          '<label class="ae-pair"><input type="checkbox" data-ed="drop-both" checked> ' +
          "Both heard at once \u2014 untick and the episode is muted while the new voice plays</label>" +
          '<div class="btn-row"><button class="btn btn--small" type="button" data-ed="drop-go">Lay it in</button></div>' +
          '<p class="muted small" data-ed="drop-state"></p>'
        : "") +

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
    const transcribeStep = (text, fraction, bad) =>
      showProgress(ed("tr-progress"), text, fraction, bad);
    let autoMatchCurrent = async () => ({ labels: [], uncertain: [], reason: "not ready" });

    /* The player everything else is measured against. */
    const player = document.createElement(KIND === "audio" ? "audio" : "video");
    player.controls = true;
    player.src = item.url;
    player.className = KIND === "audio" ? "player" : "am-film";
    /* Podcast masters need no CORS permission for native playback. */
    if (KIND === "video") player.crossOrigin = "anonymous";
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
      fetch(item.url).then((response) => {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.blob();
      }).then(async (blob) => {
        edit.sourceBlob = blob;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        edit.buf = await ctx.decodeAudioData(await blob.arrayBuffer());
        ctx.close();
        edit.seconds = edit.buf.duration;
        tellEd("Ready. " + clock(edit.buf.duration) + " of audio, cut to the sample.");
        if (item.has_transcript) {
          const matched = await autoMatchCurrent().catch(() => null);
          if (matched && matched.labels && matched.labels.length) {
            tellEd("Ready. Voiceprints automatically assigned " + voiceMatchReport(matched) +
              (matched.uncertain.length ? "; uncertain voices stayed unnamed." : "."));
          }
        }
      }).catch(() => tellEd("The audio could not be fetched for cutting. The writing and the pictures still work.", true));
    } else {
      tellEd("Ready. Cutting a film re-records the stretch at playback speed.");
    }

    /* ------------------------------------------------ consenting voiceprints
       Both named speakers have explicitly consented to podcast labelling. The
       acoustic template is made and matched here, then AES-GCM sealed before
       it crosses the wire. The server cannot decrypt it and this route never
       participates in authentication. */
    if (KIND === "audio") {
      let vpRecords = [];
      const vpTell = (text, bad) => {
        const node = ed("vp-state");
        if (!node) return;
        node.textContent = text || "";
        node.className = "muted small" + (bad ? " is-bad" : "");
      };
      const keptTranscript = async () => {
        const response = await fetch("/api/media", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "transcript", id: item.id })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok || !String(data.transcript || "").trim()) {
          throw new Error(data.error || "This episode has no named transcript to sample.");
        }
        return data;
      };
      autoMatchCurrent = async (transcriptOverride) => {
        const transcriptData = transcriptOverride
          ? { transcript: transcriptOverride }
          : await keptTranscript();
        const result = await localVoiceMatches(edit.buf, transcriptData.transcript, item.speakers || []);
        if (result.labels.length) {
          const applied = await post({
            action: "voiceprint-labels",
            id: item.id,
            labels: result.labels,
            feature_version: "eg-vp-mfsc-1"
          });
          item.speakers = applied.speakers || item.speakers;
          result.applied = applied;
        }
        return result;
      };
      const consented = () => {
        if (!ed("vp-consent").checked) {
          vpTell("Confirm every selected speaker's explicit consent before enrollment.", true);
          return false;
        }
        return window.confirm("Confirm that every selected person explicitly consents to biometric enrollment " +
          "for podcast speaker labelling only. Templates are revocable and never used to sign in.");
      };
      const saveVoiceprint = async (name, template, sourceId) => {
        const envelope = await sealVoiceprint(name, template, pass);
        await post(Object.assign({
          action: "enrol-voiceprint",
          name,
          consent: true,
          sample_seconds: template.voiced_seconds,
          sample_frames: template.sample_frames,
          source_media_id: sourceId || null
        }, envelope));
      };
      const refreshVoiceprints = async () => {
        const box = ed("vp-list");
        try {
          const data = await post({ action: "voiceprints" });
          vpRecords = data.voiceprints || [];
          if (!vpRecords.length) {
            box.innerHTML = "<p>No biometric templates are enrolled.</p>";
            return;
          }
          box.innerHTML = "<ul class=\"am-read\">" + vpRecords.map((record) =>
            "<li><strong>" + esc(record.name) + "</strong> \u2014 " +
            Number(record.sample_seconds || 0).toFixed(1) + " seconds; encrypted " +
            esc(String(record.updated_at || "").slice(0, 10)) +
            ' <button type="button" class="btn btn--small btn--ghost" data-vp-delete="' +
            esc(record.name) + '">Delete voiceprint</button></li>').join("") + "</ul>";
          box.querySelectorAll("[data-vp-delete]").forEach((button) => {
            button.addEventListener("click", async () => {
              const name = button.getAttribute("data-vp-delete");
              if (!window.confirm("Permanently erase " + name + "'s encrypted biometric template?")) return;
              try {
                await post({ action: "delete-voiceprint", name });
                vpTell(name + "'s voiceprint was erased. The non-biometric audit note remains.");
                await refreshVoiceprints();
              } catch (error) {
                vpTell((error && error.message) || "The voiceprint could not be erased.", true);
              }
            });
          });
        } catch (error) {
          vpTell((error && error.message) || "The encrypted templates could not be read.", true);
        }
      };
      refreshVoiceprints();

      ed("vp-from-turns").addEventListener("click", async () => {
        const button = ed("vp-from-turns");
        if (!edit.buf) return vpTell("Wait until the episode audio is decoded.", true);
        if (!consented()) return;
        button.disabled = true;
        try {
          vpTell("Measuring every consenting named voice on this device, with Ed and Jim first\u2026");
          const data = await keptTranscript();
          const turns = voiceTurns(data.transcript, item.speakers || [], edit.buf.duration);
          const core = ["Edward Gregory", "Jim Rankin"];
          const names = [...new Set(turns.map((turn) => turn.name).filter((name) =>
            name && !/^Speaker\s+\d+$/i.test(name)))]
            .sort((left, right) => {
              const li = core.indexOf(left), ri = core.indexOf(right);
              return (li < 0 ? 99 : li) - (ri < 0 ? 99 : ri) || left.localeCompare(right);
            });
          if (!names.length) throw new Error("Name the consenting transcript voices before enrolling them.");
          const templates = [];
          for (const name of names) {
            const intervals = turns.filter((turn) => turn.name === name)
              .map((turn) => ({ from: turn.at, to: turn.to }));
            templates.push({ name, template: voiceTemplate(edit.buf, intervals) });
          }
          /* Every selected voice must be measurable before any is written, so
             a multi-speaker enrollment cannot silently stop halfway through. */
          for (const measured of templates) {
            await saveVoiceprint(measured.name, measured.template, item.id);
          }
          vpTell(names.length + " consenting voiceprint" + (names.length === 1 ? " was" : "s were") +
            " encrypted and stored for podcast labelling only.");
          await refreshVoiceprints();
        } catch (error) {
          vpTell((error && error.message) || "The voiceprints could not be enrolled.", true);
        } finally {
          button.disabled = false;
        }
      });

      ed("vp-record").addEventListener("click", async () => {
        const button = ed("vp-record");
        const name = String(ed("vp-name").value || "").trim();
        if (name.length < 2 || /^Speaker\s+\d+$/i.test(name)) {
          return vpTell("Enter the consenting person's full name before recording.", true);
        }
        if (!consented()) return;
        button.disabled = true;
        let stream = null;
        try {
          if (!window.MediaRecorder || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("This browser cannot make a local enrollment recording.");
          }
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
          });
          const type = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"]
            .find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "";
          const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
          const bits = [];
          recorder.ondataavailable = (event) => { if (event.data && event.data.size) bits.push(event.data); };
          const stopped = new Promise((resolve, reject) => {
            recorder.onstop = resolve;
            recorder.onerror = () => reject(new Error("The enrollment recorder stopped unexpectedly."));
          });
          let left = 15;
          vpTell("Recording " + name + " alone \u2014 15 seconds remaining\u2026");
          const ticker = window.setInterval(() => {
            left--;
            vpTell("Recording " + name + " alone \u2014 " + Math.max(0, left) + " seconds remaining\u2026");
          }, 1000);
          recorder.start(500);
          await new Promise((resolve) => window.setTimeout(resolve, 15000));
          recorder.stop();
          await stopped;
          window.clearInterval(ticker);
          stream.getTracks().forEach((track) => track.stop());
          stream = null;

          const blob = new Blob(bits, { type: recorder.mimeType || "audio/webm" });
          const context = new (window.AudioContext || window.webkitAudioContext)();
          const sample = await context.decodeAudioData(await blob.arrayBuffer());
          await context.close();
          const template = voiceTemplate(sample, [{ from: 0, to: sample.duration }]);
          const mapped = (item.speakers || []).some((speaker) => speaker.name === name);
          await saveVoiceprint(name, template, mapped ? item.id : null);
          vpTell(name + "'s raw sample was discarded; the encrypted voiceprint is stored.");
          await refreshVoiceprints();
        } catch (error) {
          if (stream) stream.getTracks().forEach((track) => track.stop());
          vpTell((error && error.message) || "The enrollment recording failed.", true);
        } finally {
          button.disabled = false;
        }
      });

      ed("vp-match").addEventListener("click", async () => {
        const button = ed("vp-match");
        if (!edit.buf) return vpTell("Wait until the episode audio is decoded.", true);
        button.disabled = true;
        try {
          vpTell("Checking Edward Gregory, Jim Rankin, then every further enrolled voiceprint\u2026");
          const transcriptData = await keptTranscript();
          const result = await localVoiceMatches(edit.buf, transcriptData.transcript, item.speakers || []);
          const report = voiceMatchReport(result);
          if (!result.labels.length) {
            throw new Error("No labels were changed: " + result.reason +
              (result.uncertain.length ? "; uncertain Speaker " + result.uncertain.join(", ") : "") + ".");
          }
          if (!window.confirm("Apply these unambiguous local biometric matches? " + report +
              ". Uncertain voices remain unnamed; voiceprints never authenticate anyone.")) {
            return vpTell("The biometric comparison was not applied: " + report + ".");
          }
          const applied = await post({
            action: "voiceprint-labels",
            id: item.id,
            labels: result.labels,
            feature_version: "eg-vp-mfsc-1"
          });
          item.speakers = applied.speakers || item.speakers;
          vpTell("Biometric speaker labels applied: " + report +
            (result.uncertain.length ? ". Uncertain Speaker " + result.uncertain.join(", ") + " stayed unnamed." : ".") +
            " Review the transcript before publishing.");
        } catch (error) {
          vpTell((error && error.message) || "The biometric comparison failed.", true);
        } finally {
          button.disabled = false;
        }
      });
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

    /* Existing uploads use the same separate private local Whisper app. The
       stored episode is fetched into this browser, transcribed in workers, and
       only the completed transcript is returned to EGregoRA. Known speaker
       names then refresh their compact speech patterns on the server. */
    ed("transcribe").addEventListener("click", async () => {
      const button = ed("transcribe");
      if (!edit.buf) return tellEd("The audio is still loading. Try again when the player says Ready.", true);
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      const transcriptBox = ed("trbox");
      transcriptBox.innerHTML = "";
      const area = document.createElement("textarea");
      area.readOnly = true;
      area.rows = 12;
      area.className = "am-ear";
      area.setAttribute("aria-label", "The transcript as it is heard");
      transcriptBox.appendChild(area);
      transcriptBox.hidden = false;
      const typer = makeTyper(area);
      let transcript = "";
      transcribeStep("Starting transcription", 0.01);
      try {
        if (!edit.sourceBlob) throw new Error("The stored episode file is not ready for private transcription.");
        tellEd("Private Whisper is transcribing this stored episode on your device\u2026");
        transcript = await listenWhisper(edit.sourceBlob, edit.buf.duration, typer, transcribeStep);
        typer.stop();
        if (!transcript || transcript.trim().length < 40) {
          throw new Error("The ear did not keep enough words to save.");
        }
        transcribeStep("Saving the transcript", 0.94);
        await post({ action: "edit", id: item.id, transcript });
        const known = Array.isArray(item.speakers) ? item.speakers : [];
        let named = null;
        if (known.length) {
          transcribeStep("Restoring known speaker names", 0.96);
          named = await post({ action: "name-speakers", id: item.id, speakers: known });
        }
        transcribeStep("Checking enrolled voiceprints", 0.98);
        const biometric = await autoMatchCurrent(transcript).catch((error) => ({
          labels: [], uncertain: [], reason: (error && error.message) || "voiceprint comparison unavailable"
        }));
        area.value = (biometric.applied && biometric.applied.transcript) ||
          (named && named.transcript) || transcript;
        item.has_transcript = true;
        tellEd(biometric.labels.length
          ? "Transcript saved. Voiceprints automatically assigned " + voiceMatchReport(biometric) +
            (biometric.uncertain.length ? "; uncertain voices stayed unnamed." : ".")
          : named && named.speaker_patterns_stored
            ? "Transcript saved. Named speech patterns are stored; voiceprints made no new assignment (" +
              biometric.reason + ")."
            : "Transcript saved. Its turns are kept; voiceprints made no assignment (" +
              biometric.reason + ").");
        transcribeStep("Transcription saved", 1);
        button.textContent = "Transcribe it again";
      } catch (err) {
        typer.stop();
        transcribeStep("Transcription stopped \u2014 " +
          ((err && err.message) || "the episode could not be transcribed"), null, true);
        tellEd((err && err.message) || "The episode could not be transcribed.", true);
      } finally {
        button.disabled = false;
        button.setAttribute("aria-busy", "false");
      }
    });

    /* A summary written from the kept transcript, by the same models the
       oracle leans on. Nothing is saved until the writing is saved. */
    ed("sum-from-tr").addEventListener("click", async () => {
      tellEd("Reading the kept transcript\u2026");
      const r = await fetch("/api/media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "transcript", id: item.id })
      }).catch(() => null);
      const td = r ? await r.json().catch(() => null) : null;
      if (!td || !td.transcript || td.transcript.trim().length < 40)
        return tellEd("No transcript is kept with this episode.", true);
      const dd = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pass, action: "describe", text: td.transcript, kind: KIND })
      }).then((x) => x.json()).catch(() => null);
      if (!dd || !dd.ok)
        return tellEd((dd && dd.error) || "No model would write the summary just now.", true);
      ed("summary").value = dd.summary || ed("summary").value;
      tellEd("A summary is written from the transcript by " + (dd.by || "a model") +
        " \u2014 read it, then save the writing.");
    });

    /* Read the kept transcript where you stand — the words the ear wrote
       when the episode was posted. Press again and they close. */
    ed("read-tr").addEventListener("click", async () => {
      const box = ed("trbox");
      if (!box.hidden) {
        box.hidden = true;
        ed("read-tr").textContent = "Read its transcript";
        return;
      }
      tellEd("Fetching the kept transcript\u2026");
      try {
        const r = await fetch("/api/media", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "transcript", id: item.id })
        });
        const d = await r.json();
        if (!d || !d.ok) throw new Error((d && d.error) || "the transcript would not open");
        const words = String(d.transcript || "").trim();
        box.innerHTML = "";
        const head = document.createElement("p");
        head.className = "kicker";
        head.textContent = "The transcript \u2014 as it was heard";
        const pre = document.createElement("pre");
        pre.className = "ep-tr-text";
        pre.textContent = words || "(no words were kept)";
        box.append(head, pre);
        box.hidden = false;
        ed("read-tr").textContent = "Close the transcript";
        tellEd(words ? "The transcript is open below." : "No transcript is kept with this episode.",
          !words);
      } catch (err) {
        tellEd((err && err.message) || "It would not open.", true);
      }
    });

    /* Drop another voice in at any point. Both heard at once lays the new
       voice over the episode; unticked, the episode holds its breath while
       the new voice plays. The master is replaced over the wire. */
    if (KIND === "audio") {
      let dropAt = 0;
      ed("drop-here").addEventListener("click", () => {
        dropAt = player.currentTime;
        ed("dropat").textContent = clock(dropAt);
      });
      ed("drop-go").addEventListener("click", async () => {
        const f = ed("drop-file").files && ed("drop-file").files[0];
        if (!edit.buf) return tellEd("The master is not decoded yet \u2014 give it a second.", true);
        if (!f) return tellEd("Choose the file to drop in.", true);
        const both = ed("drop-both").checked;
        tellEd("Decoding " + f.name + "\u2026");
        let drop;
        try {
          const c0 = new (window.AudioContext || window.webkitAudioContext)();
          drop = await c0.decodeAudioData(await f.arrayBuffer());
          c0.close();
        } catch {
          return tellEd("This browser cannot decode that file.", true);
        }
        const m = edit.buf;
        const rate = m.sampleRate;
        const chans = m.numberOfChannels;
        const at = Math.max(0, Math.min(dropAt, m.duration));
        const cut = Math.floor(at * rate);
        const dropFrames = Math.ceil(drop.duration * rate);
        const totalSeconds = both
          ? Math.max(m.duration, at + drop.duration)
          : m.duration + drop.duration;
        const c1 = new (window.AudioContext || window.webkitAudioContext)();
        const outBuf = c1.createBuffer(chans, Math.ceil(totalSeconds * rate), rate);
        for (let ch = 0; ch < chans; ch++) {
          const o = outBuf.getChannelData(ch);
          const src = m.getChannelData(ch);
          const dch = drop.getChannelData(Math.min(ch, drop.numberOfChannels - 1));
          if (both) {
            o.set(src);
            for (let i = 0; i < dch.length && cut + i < o.length; i++) o[cut + i] += dch[i];
          } else {
            o.set(src.subarray(0, cut), 0);
            o.set(dch, cut);
            o.set(src.subarray(cut), cut + dropFrames);
          }
        }
        c1.close();
        tellEd("Encoding the new master\u2026");
        const made = await encode(outBuf, fmtChoice());
        const upload = await sendBlob(made.blob, (t) => tellEd(t));
        await post({
          action: "replace", id: item.id, upload, mime: made.mime,
          seconds: Math.round(outBuf.duration),
          length: clock(outBuf.duration).replace(/ \d+s$/, ""),
          treatment: "another voice laid in at " + clock(at) +
            (both ? " \u2014 both heard at once" : " \u2014 the episode muted while it plays")
        });
        edit.buf = outBuf;
        edit.seconds = outBuf.duration;
        await refresh();
        const ni = byId.get(item.id);
        if (ni) { item = ni; edit.item = ni; player.src = ni.url; }
        tellEd("Laid in at " + clock(at) + " and saved over the master" +
          (both ? ", both voices heard." : "; the episode holds its breath while the new voice plays."));
      });
    }

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
      const made = await encode(done, fmtChoice());
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
        const change = { action: "edit", id: item.id, title: ed("title").value,
          summary: ed("summary").value, tags: ed("tags").value,
          number: KIND === "audio" ? ed("number").value : "" };
        const wantedDate = ed("date").value || "";
        if (wantedDate !== (item.purported_date || "")) change.date = wantedDate;
        await post(change);
        tellEd("The writing and any purported creation date are saved. The actual upload time is unchanged.");
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
    const pieces = Math.ceil(blob.size / raw);
    for (let i = 0; i < pieces; i++) {
      const from = i * raw;
      const part = await blobPartBase64(blob, from, Math.min(blob.size, from + raw));
      await post({ action: "chunk", upload, seq: i, part });
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
        (i.state === "archived"
          ? '<button class="btn btn--small btn--ghost" type="button" data-restore="' + i.id +
            '">Restore</button> '
          : '<button class="btn btn--small btn--ghost" type="button" data-pin="' + i.id + '">' +
            (i.pinned ? "Unpin" : "Pin to the top") + "</button> " +
            '<button class="btn btn--small btn--ghost" type="button" data-flip="' + i.id + '">' +
            (i.state === "published" ? "Take down" : "Publish") + "</button> " +
            '<button class="btn btn--small btn--ghost" type="button" data-arch="' + i.id +
            '">Archive</button> ') +
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

    /* Archive steps the episode off the public shelf without destroying it;
       Restore brings it back as a draft, ready to publish again. */
    el.shelf.querySelectorAll("[data-arch]").forEach((b) => b.addEventListener("click", async () => {
      const id = Number(b.getAttribute("data-arch"));
      if (!window.confirm("Archive that episode? It leaves the public page and the feed, " +
        "and stays here in the vault.")) return;
      b.disabled = true;
      await post({ action: "archive", id }).catch(() => {});
      drawShelf((await post({ action: "shelf", kind: KIND })).items || []);
      if (window.EGMediaRefresh) window.EGMediaRefresh();
    }));
    el.shelf.querySelectorAll("[data-restore]").forEach((b) => b.addEventListener("click", async () => {
      const id = Number(b.getAttribute("data-restore"));
      b.disabled = true;
      await post({ action: "restore", id }).catch(() => {});
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
  let lastItems = [];
  const SUB_LANGS = [
    ["", "Original"], ["en-US", "English (American)"], ["es", "Espa\u00f1ol"],
    ["fr", "Fran\u00e7ais"], ["de", "Deutsch"], ["it", "Italiano"],
    ["pt", "Portugu\u00eas"], ["nl", "Nederlands"], ["pl", "Polski"],
    ["ru", "\u0420\u0443\u0441\u0441\u043a\u0438\u0439"], ["ar", "\u0627\u0644\u0639\u0631\u0628\u064a\u0629"],
    ["hi", "\u0939\u093f\u0902\u0926\u0940"], ["zh", "\u4e2d\u6587 (\u7b80\u4f53)"],
    ["ja", "\u65e5\u672c\u8a9e"], ["ko", "\ud55c\uad6d\uc5b4"],
    ["tr", "T\u00fcrk\u00e7e"], ["el", "\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac"],
    ["la", "Latinum"], ["cy", "Cymraeg"], ["ga", "Gaeilge"]
  ];
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
      lastItems = items;
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
          (window.EGMediaAdminOn
            ? "<p class=\"ep-sum\">" +
              (i.summary ? esc(i.summary) : '<span class="muted xsmall">No summary yet.</span>') +
              ' <button type="button" class="btn btn--small btn--ghost" data-mx-sum="' + i.id +
              '">Edit the summary</button></p>'
            : (i.summary ? "<p>" + esc(i.summary) + "</p>" : "")) +
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
            '" data-for="' + i.id + '"></audio>' +
            '<p class="ep-actions">' +
            '<button type="button" class="btn btn--small" data-mx-dl="' + i.id +
            '" data-mx-url="' + esc(i.url) + '">Download the episode</button>' +
            (i.has_transcript
              ? '<button type="button" class="btn btn--small btn--ghost" data-mx-readtr="' + i.id +
                '" data-mx-title="' + esc(i.title) + '">Read the transcript</button>' +
                '<button type="button" class="btn btn--small btn--ghost" data-mx-tr="' + i.id +
                '" data-mx-title="' + esc(i.title) + '">Download the transcript</button>'
              : "") +
            "</p>" +
            (i.has_transcript
              ? '<div class="ep-transcript" data-mx-trbox="' + i.id + '" hidden></div>'
              : "") +
            (i.url
              ? '<div class="ep-subs">' +
                  '<label class="ep-subs-label"><input type="checkbox" data-mx-subon="' + i.id + '"> Subtitles</label>' +
                  '<select class="ep-subs-lang" data-mx-sube="' + i.id + '" aria-label="The language of the subtitles">' +
                  SUB_LANGS.map((l) => '<option value="' + l[0] + '">' + l[1] + "</option>").join("") +
                  "</select>" +
                  '<span class="ep-subs-note" data-mx-subnote="' + i.id + '"></span>' +
                "</div>" +
                '<div class="ep-caption" data-mx-cap="' + i.id + '" hidden></div>'
              : "")
            : "") +
          "</div></details>"
        : '<article class="frame card' + (i.pinned ? " is-pinned" : "") + '">' +
          (i.pinned ? '<p class="pin-mark">pinned</p>' : "") +
          (i.url ? '<video class="am-film" controls preload="metadata" src="' + esc(i.url) + '"></video>' : "") +
          '<p class="tag mt-1">' + esc(i.date) + (i.length ? " \u00b7 " + esc(i.length) : "") + "</p>" +
          "<h3>" + esc(i.title) + "</h3>" +
          (i.summary ? "<p>" + esc(i.summary) + "</p>" : "") +
          (i.tags.length ? '<p class="muted xsmall">' + esc(i.tags.join(" \u00b7 ")) + "</p>" : "") +
          "</article>").join("");
      /* Not every format plays in a browser — a WMA, in particular, plays
         nowhere on the web. Where the player would be, say so plainly and
         leave the download standing: the file itself is never lost. */
      items.forEach((i) => {
        if (!/wma/i.test(String(i.mime || ""))) return;
        const player = slot.querySelector('[data-for="' + i.id + '"]');
        if (!player) return;
        const note = document.createElement("p");
        note.className = "muted small";
        note.textContent = "This episode is a WMA file. No browser can play that " +
          "format — the download button below gives you the file itself.";
        player.replaceWith(note);
      });

      if (window.EGPlayerSweep) window.EGPlayerSweep(slot);

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

      /* ------------------------------------------------------- subtitles
         The words under the sound: on or off, in the language chosen.
         The original comes from the transcript's turns; another language
         is translated by the order's own models and kept on the shelf,
         so a choice is only ever asked once. */
      const subCache = new Map();    /* id + lang -> response */
      const subLines = new Map();    /* id    -> current cues */
      const subCap = (id) => slot.querySelector('[data-mx-cap="' + id + '"]');
      const subNote = (id) => slot.querySelector('[data-mx-subnote="' + id + '"]');

      const showSubLine = (player, id) => {
        const box = subCap(id);
        if (!box) return;
        const lines = subLines.get(id) || [];
        const t = player.currentTime || 0;
        let line = null;
        for (let k = 0; k < lines.length; k++) {
          if (t >= lines[k].start && t < lines[k].end) { line = lines[k]; break; }
        }
        box.hidden = !line || player.paused;
        if (line && box.textContent !== line.text) box.textContent = line.text;
      };

      const wireSubs = (player, id) => {
        if (player.dataset.subsWired) return;
        player.dataset.subsWired = "1";
        player.addEventListener("timeupdate", () => showSubLine(player, id));
        player.addEventListener("pause", () => showSubLine(player, id));
        player.addEventListener("play", () => showSubLine(player, id));
        player.addEventListener("ended", () => { const b = subCap(id); if (b) b.hidden = true; });
      };

      const drawSubs = (id) => {
        const on = slot.querySelector('[data-mx-subon="' + id + '"]');
        const sel = slot.querySelector('[data-mx-sube="' + id + '"]');
        const player = slot.querySelector('[data-for="' + id + '"]');
        const note = subNote(id);
        if (!on || !player) return;
        if (!on.checked) {
          subLines.delete(id);
          const b = subCap(id); if (b) b.hidden = true;
          if (note) note.textContent = "";
          return;
        }
        if (sel) sel.disabled = true;
        const lang = sel ? sel.value : "";
        const key = id + ":" + (lang || "original");
        const settle = (got) => {
          if (sel) sel.disabled = false;
          if (slot.querySelector('[data-mx-subon="' + id + '"]') !== on || !on.checked) return;
          const lines = (got && got.lines) || [];
          if (!lines.length) {
            subLines.delete(id);
            const b = subCap(id); if (b) b.hidden = true;
            if (note) note.textContent =
              (got && got.status === "no-transcript")
                ? "This episode has no transcript yet — the captions appear the moment its words are taken."
                : ((got && got.error) || "No words for that language just now.");
            return;
          }
          if (note) note.textContent = "";
          subLines.set(id, lines);
          wireSubs(player, id);
          showSubLine(player, id);
        };
        if (subCache.has(key)) { settle(subCache.get(key)); return; }
        if (note) note.textContent = lang ? "Finding the translation…" : "Gathering the words…";
        fetch("/api/media", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "subtitles", id: Number(id), lang: lang || "" })
        }).then((r) => r.json().catch(() => ({})).then((d) => {
          d._ok = r.ok;
          return d;
        })).then((d) => {
          if (!d._ok && !d.ok) d = { lines: [], status: "error", error: (d && d.error) || "The shelf did not answer." };
          subCache.set(key, d);
          settle(d);
        }).catch(() => {
          const d = { lines: [], status: "error", error: "The shelf did not answer." };
          subCache.set(key, d);
          settle(d);
        });
      };

      Array.prototype.forEach.call(slot.querySelectorAll("[data-mx-subon]"), (on) => {
        const id = on.getAttribute("data-mx-subon");
        on.addEventListener("change", () => drawSubs(id));
        const sel = slot.querySelector('[data-mx-sube="' + id + '"]');
        if (sel) sel.addEventListener("change", () => drawSubs(id));
      });
    } catch {
      slot.hidden = true;
    }
  }

  const save = (blob, name) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 20000);
  };
  const extFor = (t) => String(t || "").includes("mpeg") ? ".mp3"
    : String(t || "").includes("flac") ? ".flac"
    : String(t || "").includes("wav") ? ".wav"
      : String(t || "").includes("ogg") ? ".ogg"
        : String(t || "").includes("mp4") ? ".mp4"
          : String(t || "").includes("m4a") ? ".m4a"
            : String(t || "").includes("aac") ? ".aac"
              : String(t || "").includes("flac") ? ".flac"
                : String(t || "").includes("wma") ? ".wma" : ".webm";

  slot.addEventListener("click", async (ev) => {
    const dl = ev.target.closest && ev.target.closest("[data-mx-dl]");
    const tr = ev.target.closest && ev.target.closest("[data-mx-tr]");

    /* Summaries stand editable where they are, while the door is open. */
    const su = ev.target.closest && ev.target.closest("[data-mx-sum]");
    if (su) {
      const id = Number(su.getAttribute("data-mx-sum"));
      const item = lastItems.find((x) => x.id === id);
      if (!item) return;
      const holder = su.closest("p");
      holder.innerHTML = "";
      const ta = document.createElement("textarea");
      ta.rows = 3;
      ta.className = "am-ear";
      ta.value = item.summary || "";
      const save = document.createElement("button");
      save.type = "button";
      save.className = "btn btn--small";
      save.textContent = "Save the summary";
      const leave = document.createElement("button");
      leave.type = "button";
      leave.className = "btn btn--small btn--ghost";
      leave.textContent = "Leave it";
      holder.appendChild(ta);
      holder.appendChild(save);
      holder.appendChild(leave);
      save.addEventListener("click", async () => {
        save.disabled = true;
        try {
          const r = await fetch("/api/media", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              pass: window.EGMediaPass || "", action: "edit", id,
              title: item.title, summary: ta.value,
              tags: item.tags.join(", "), number: item.number || ""
            })
          });
          const out = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(out.error || "it would not save");
          if (window.EGMediaRefresh) window.EGMediaRefresh();
        } catch (err) {
          save.disabled = false;
          save.textContent = (err && err.message) || "It would not save";
        }
      });
      leave.addEventListener("click", () => {
        if (window.EGMediaRefresh) window.EGMediaRefresh();
      });
      ta.focus();
      return;
    }
    if (dl) {
      const url = dl.getAttribute("data-mx-url");
      if (!url) return;
      dl.disabled = true;
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error();
        const b = await r.blob();
        save(b, "egregora-episode-" + dl.getAttribute("data-mx-dl") + extFor(b.type));
      } catch { save(new Blob([], { type: "text/plain" }), "egregora-episode.txt"); }
      dl.disabled = false;
    }
    if (tr) {
      tr.disabled = true;
      try {
        const r = await fetch("/api/media", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "transcript", id: Number(tr.getAttribute("data-mx-tr")) })
        });
        const d = await r.json();
        if (d && d.ok) {
          const head = "EGregoRA \u2014 " + (d.title || "episode") +
            "\nTranscript as kept when the episode was posted.\n\n";
          save(new Blob([head + (d.transcript || "(no words were kept)")],
            { type: "text/plain" }),
            "egregora-transcript-" + tr.getAttribute("data-mx-tr") + ".txt");
        }
      } catch { /* a failed fetch is a quiet no-op; the button returns */ }
      tr.disabled = false;
    }

    /* Read the transcript where you stand: the words kept with the upload,
       opened in the episode itself — no download, no new page. Press again
       and they close. */
    const rd = ev.target.closest && ev.target.closest("[data-mx-readtr]");
    if (rd) {
      const id = Number(rd.getAttribute("data-mx-readtr"));
      const box = slot.querySelector('[data-mx-trbox="' + id + '"]');
      if (!box) return;
      if (!box.hidden) {
        box.hidden = true;
        rd.textContent = "Read the transcript";
        return;
      }
      rd.disabled = true;
      rd.textContent = "Fetching the words\u2026";
      try {
        const r = await fetch("/api/media", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "transcript", id })
        });
        const d = await r.json();
        if (!d || !d.ok) throw new Error((d && d.error) || "the transcript would not open");
        const words = String(d.transcript || "").trim();
        box.innerHTML = "";
        const head = document.createElement("p");
        head.className = "kicker";
        head.textContent = "The transcript \u2014 as it was heard";
        const pre = document.createElement("pre");
        pre.className = "ep-tr-text";
        pre.textContent = words || "(no words were kept)";
        box.append(head, pre);
        box.hidden = false;
        rd.textContent = "Close the transcript";
        if (box.scrollIntoView) {
          try { box.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch { /* no scroll */ }
        }
      } catch (err) {
        rd.textContent = (err && err.message) || "It would not open";
      }
      rd.disabled = false;
    }
  });

  window.EGMediaRefresh = load;
  load();
})();