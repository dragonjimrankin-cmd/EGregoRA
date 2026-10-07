/* ===========================================================================
   The Live Cam — broadcasting, and watching
   ---------------------------------------------------------------------------
   There is no media server behind this site, so a feed here is the camera
   recording two seconds at a time and the watchers playing those segments
   as they land, a few seconds behind the room. That is said on the page as
   well as in the code, because a viewer who expects true live and gets six
   seconds of lag will think something is broken rather than honest.

   Watching needs two things: an account on this site, and the watchword the
   broadcaster typed before the countdown. An account is not an invitation
   and a shared word is not an identity, so both are asked for.
   ======================================================================== */

import { createMixer, plateCanvas, PLATE_KINDS } from "./live-desk.js";

const SEGMENT = 2000;          /* milliseconds per segment */
const POLL = 1400;             /* how often a watcher asks for more */

const esc = (t) => String(t == null ? "" : t)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const when = (iso) => {
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
};

/* A countdown anybody can use: ten seconds, visible, cancellable. */
export function countdown(host, seconds, go) {
  let left = seconds;
  host.hidden = false;
  host.innerHTML = '<span class="count-num">' + left + "</span>" +
    '<span class="count-note">Starting \u2014 look at the camera</span>' +
    '<button type="button" class="btn btn--small btn--ghost count-stop">Stop</button>';
  const num = host.querySelector(".count-num");
  let dead = false;
  host.querySelector(".count-stop").addEventListener("click", () => {
    dead = true; host.hidden = true; host.innerHTML = "";
  });
  const tick = setInterval(() => {
    if (dead) { clearInterval(tick); return; }
    left -= 1;
    if (left > 0) { num.textContent = left; return; }
    clearInterval(tick);
    host.hidden = true;
    host.innerHTML = "";
    go();
  }, 1000);
  return () => { dead = true; clearInterval(tick); host.hidden = true; host.innerHTML = ""; };
}

/* ---------------------------------------------------------- broadcasting */
(function broadcast() {
  const root = document.getElementById("live-admin");
  if (!root) return;
  const $ = (n) => root.querySelector('[data-lv="' + n + '"]');
  let pass = "";
  let feedId = null, rec = null, stream = null, seq = 0, cancel = null;
  let tapeParts = [], tapeType = "video/webm", tapeFrom = 0;

  const say = (t, bad) => {
    const n = $("msg");
    if (n) { n.textContent = t || ""; n.className = "auth-msg" + (bad ? " is-bad" : ""); }
  };

  const post = (payload) => fetch("/api/live", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(Object.assign({ pass }, payload))
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "the feed refused that");
    return d;
  });

  $("open").addEventListener("click", () => {
    const panel = $("panel");
    const shut = panel.hidden;
    panel.hidden = !shut;
    $("open").setAttribute("aria-expanded", String(shut));
    $("open").textContent = shut ? "Close the admin door" : "Admin Only";
  });

  $("signin").addEventListener("click", async (e) => {
    e.preventDefault();
    pass = $("pass").value || "";
    try {
      const d = await post({ action: "mine" });
      $("work").hidden = false;
      $("pass").value = "";
      say("Open.");
      drawMine(d.feeds || []);
      drawFiles();
    } catch (err) {
      pass = "";
      say((err && err.message) || "That did not open it.", true);
    }
  });

  function drawMine(feeds) {
    const n = $("mine");
    if (!n) return;
    n.innerHTML = feeds.length
      ? '<table class="keeper-table"><thead><tr><th>Feed</th><th>State</th><th>Watchers</th>' +
        "<th>Segments</th><th></th></tr></thead><tbody>" + feeds.map((f) =>
          "<tr><td>" + esc(f.title) + '<br><span class="muted xsmall">from ' + esc(when(f.since)) +
          "</span></td><td>" + esc(f.state) + "</td><td>" + f.watchers + "</td><td>" + f.segments +
          "</td><td>" + (f.state === "live"
            ? '<button class="btn btn--small btn--ghost" type="button" data-end="' + f.id + '">End it</button>'
            : "") + "</td></tr>").join("") + "</tbody></table>"
      : '<p class="muted small">No feed has run yet.</p>';
    n.querySelectorAll("[data-end]").forEach((b) => b.addEventListener("click", async () => {
      await post({ action: "close", id: Number(b.getAttribute("data-end")) }).catch(() => {});
      drawMine((await post({ action: "mine" })).feeds || []);
    }));
  }

  /* ------------------------------------------------------------- the desk */
  /* The gallery: a deck of plates, a tape machine, and the buttons that put
     one of them on air. It is built whether or not a feed is running, so a
     broadcaster can cut plates together and rehearse before the countdown,
     and keep editing them while live. */
  const desk = (function makeDesk() {
    const deckKey = "eg-live-deck";
    let mixer = null;
    let deck = [];
    try { deck = JSON.parse(localStorage.getItem(deckKey) || "[]"); } catch (e) { deck = []; }

    const d = (n) => root.querySelector('[data-lv="' + n + '"]');
    const has = d("programme");

    function spec() {
      return {
        kind: (d("pk") || {}).value || "title",
        kicker: (d("p-kicker") || {}).value || "",
        title: (d("p-title") || {}).value || "",
        subtitle: (d("p-sub") || {}).value || "",
        lines: (d("p-lines") || {}).value || "",
        accent: (d("p-accent") || {}).value || "gold"
      };
    }

    function preview() {
      const host = d("p-preview");
      if (!host) return;
      const el = plateCanvas(spec(), 1280, 720);
      el.className = "plate-shot";
      host.innerHTML = "";
      host.appendChild(el);
      return el;
    }

    function toAir(sp, mode) {
      if (!mixer) return;
      mixer.setPlate(plateCanvas(sp, 1280, 720));
      if (mode) mixer.take(mode, !!(d("fade") || {}).checked).then(mark);
      else mark();
    }

    function mark() {
      root.querySelectorAll("[data-air]").forEach((b) => {
        const on = mixer && b.getAttribute("data-air") === mixer.state.mode;
        b.classList.toggle("is-on", !!on);
        b.setAttribute("aria-pressed", String(!!on));
      });
      const n = d("on-air");
      if (n && mixer) n.textContent = mixer.state.mode;
    }

    function drawDeck() {
      const host = d("deck");
      if (!host) return;
      host.innerHTML = deck.length ? "" : '<p class="muted small">The deck is empty. Compose a plate and keep it.</p>';
      deck.forEach((sp, i) => {
        const card = document.createElement("figure");
        card.className = "deck-card";
        const shot = plateCanvas(sp, 640, 360);
        shot.className = "plate-shot";
        card.appendChild(shot);
        const cap = document.createElement("figcaption");
        cap.innerHTML = '<span>' + esc(sp.title || sp.kind) + "</span>" +
          '<button type="button" class="btn btn--small" data-deck-air="' + i + '">To air</button>' +
          '<button type="button" class="btn btn--small btn--ghost" data-deck-edit="' + i + '">Edit</button>' +
          '<button type="button" class="btn btn--small btn--ghost" data-deck-drop="' + i + '">Drop</button>';
        card.appendChild(cap);
        host.appendChild(card);
      });
      host.querySelectorAll("[data-deck-air]").forEach((b) => b.addEventListener("click", () => {
        toAir(deck[Number(b.getAttribute("data-deck-air"))], "plate");
      }));
      host.querySelectorAll("[data-deck-edit]").forEach((b) => b.addEventListener("click", () => {
        const sp = deck[Number(b.getAttribute("data-deck-edit"))];
        if (d("pk")) d("pk").value = sp.kind;
        if (d("p-kicker")) d("p-kicker").value = sp.kicker || "";
        if (d("p-title")) d("p-title").value = sp.title || "";
        if (d("p-sub")) d("p-sub").value = sp.subtitle || "";
        if (d("p-lines")) d("p-lines").value = sp.lines || "";
        if (d("p-accent")) d("p-accent").value = sp.accent || "gold";
        preview();
      }));
      host.querySelectorAll("[data-deck-drop]").forEach((b) => b.addEventListener("click", () => {
        deck.splice(Number(b.getAttribute("data-deck-drop")), 1);
        localStorage.setItem(deckKey, JSON.stringify(deck));
        drawDeck();
      }));
    }

    if (has) {
      const hint = d("p-hint");
      const kindSel = d("pk");
      if (kindSel && !kindSel.options.length) {
        PLATE_KINDS.forEach((k) => {
          const o = document.createElement("option");
          o.value = k.id;
          o.textContent = k.label;
          kindSel.appendChild(o);
        });
      }
      const showHint = () => {
        const k = PLATE_KINDS.find((x) => x.id === (kindSel || {}).value);
        if (hint && k) hint.textContent = k.hint;
      };
      if (kindSel) kindSel.addEventListener("change", () => { showHint(); preview(); });
      showHint();
      ["p-kicker", "p-title", "p-sub", "p-lines", "p-accent"].forEach((n) => {
        const el = d(n);
        if (el) el.addEventListener("input", preview);
        if (el) el.addEventListener("change", preview);
      });
      if (d("p-air")) d("p-air").addEventListener("click", () => toAir(spec(), "plate"));
      if (d("p-save")) d("p-save").addEventListener("click", () => {
        deck.push(spec());
        if (deck.length > 40) deck.shift();
        localStorage.setItem(deckKey, JSON.stringify(deck));
        drawDeck();
        say("Plate kept in the deck \u2014 " + deck.length + " there now.");
      });
      if (d("deck-clear")) d("deck-clear").addEventListener("click", () => {
        deck = [];
        localStorage.setItem(deckKey, "[]");
        drawDeck();
      });

      /* Drag a picture onto the programme and it goes out. The file is read
         in this browser and never uploaded; the monitor is also a drop
         target so there is somewhere obvious to aim at, and the picture
         stays up until the director takes it down. */
      const drop = d("programme");
      let lastStill = "";
      const takeImage = (file) => {
        if (!file || file.type.indexOf("image/") !== 0) {
          return say("That is not a picture the browser can read.", true);
        }
        if (!mixer) return say("Open the camera first \u2014 the desk needs to be lit.", true);
        const img = new Image();
        img.onload = () => {
          mixer.setStill(img, file.name);
          lastStill = file.name;
          const n = d("still-name");
          if (n) n.textContent = file.name + " \u2014 " + img.naturalWidth + "\u00d7" + img.naturalHeight;
          mixer.take("still", !!(d("fade") || {}).checked).then(mark);
          say("Showing " + file.name + ". Press Camera, or the button under the monitor, to take it down.");
        };
        img.onerror = () => say("That picture would not open.", true);
        img.src = URL.createObjectURL(file);
      };
      if (drop) {
        ["dragenter", "dragover"].forEach((e) => drop.addEventListener(e, (ev) => {
          ev.preventDefault();
          drop.classList.add("is-dropping");
        }));
        ["dragleave", "drop"].forEach((e) => drop.addEventListener(e, () => drop.classList.remove("is-dropping")));
        drop.addEventListener("drop", (ev) => {
          ev.preventDefault();
          const f = ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0];
          takeImage(f);
        });
      }
      if (d("still-file")) d("still-file").addEventListener("change", (e) => {
        takeImage(e.target.files && e.target.files[0]);
      });
      if (d("still-off")) d("still-off").addEventListener("click", () => {
        if (mixer) mixer.take("camera", true).then(mark);
        say(lastStill ? lastStill + " taken down. Back to the camera." : "Back to the camera.");
      });

      /* The second screen. A browser will only share a screen when a person
         asks for it, so this is a button and not a setting; where it goes
         once shared is the setting. */
      let screenStream = null;
      const screenEl = d("screen");
      const screenWhere = () => (d("screen-mode") || { value: "off" }).value;
      if (d("screen-share")) d("screen-share").addEventListener("click", async () => {
        if (!mixer) return say("Open the camera first.", true);
        try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { frameRate: { ideal: 15 } }, audio: false
          });
          screenEl.srcObject = screenStream;
          screenEl.muted = true;
          await screenEl.play().catch(() => {});
          mixer.setScreen(screenEl);
          const stop = screenStream.getVideoTracks()[0];
          if (stop) stop.addEventListener("ended", () => {
            screenStream = null;
            if (d("screen-mode")) d("screen-mode").value = "off";
            if (mixer) mixer.take("camera", true).then(mark);
            say("The screen share ended. Back to the camera.");
          });
          if (screenWhere() === "off" && d("screen-mode")) d("screen-mode").value = "instead";
          applyScreen();
          say("Screen shared. It is going out " +
            (screenWhere() === "under" ? "underneath the camera." : "in place of the camera."));
        } catch (err) {
          say((err && err.message) || "The screen would not share.", true);
        }
      });
      function applyScreen() {
        if (!mixer) return;
        const where = screenWhere();
        if (where === "off") { mixer.take("camera", true).then(mark); return; }
        if (!screenStream) return say("Share a screen first.", true);
        mixer.take(where === "under" ? "stack" : "screen", !!(d("fade") || {}).checked).then(mark);
      }
      if (d("screen-mode")) d("screen-mode").addEventListener("change", applyScreen);
      if (d("screen-stop")) d("screen-stop").addEventListener("click", () => {
        if (screenStream) screenStream.getTracks().forEach((t) => t.stop());
        screenStream = null;
        if (d("screen-mode")) d("screen-mode").value = "off";
        if (mixer) mixer.take("camera", true).then(mark);
        say("The screen share is stopped.");
      });

      root.querySelectorAll("[data-air]").forEach((b) => b.addEventListener("click", () => {
        if (!mixer) return say("Open the camera first \u2014 the desk needs a picture to cut with.", true);
        mixer.take(b.getAttribute("data-air"), !!(d("fade") || {}).checked).then(mark);
      }));

      /* The tape machine. The file never leaves the browser; it is played
         into the mixer, so what the watchers get is the recording of the
         programme, not an upload they have to download. */
      const tape = d("tape");
      if (d("tape-file")) d("tape-file").addEventListener("change", (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f || !tape) return;
        tape.src = URL.createObjectURL(f);
        tape.loop = !!(d("tape-loop") || {}).checked;
        tape.load();
        say("Tape loaded: " + f.name + " \u2014 " + Math.round(f.size / 1048576) + " MB. Nothing was uploaded.");
        if (mixer) { mixer.setTape(tape); mixer.tapeFrom(tape); }
      });
      if (tape) {
        tape.addEventListener("timeupdate", () => {
          const n = d("tape-time");
          if (!n || !tape.duration) return;
          const left = Math.max(0, tape.duration - tape.currentTime);
          n.textContent = Math.floor(left / 60) + ":" + String(Math.floor(left % 60)).padStart(2, "0") + " left";
          const bar = d("tape-bar");
          if (bar) bar.style.width = ((tape.currentTime / tape.duration) * 100).toFixed(1) + "%";
        });
        tape.addEventListener("ended", () => {
          if ((d("tape-back") || {}).checked && mixer) mixer.take("camera", true).then(mark);
        });
      }
      const press = (name, fn) => { const b = d(name); if (b) b.addEventListener("click", fn); };
      press("tape-play", () => { if (tape) { tape.play().catch(() => {}); if (mixer) mixer.tapeFrom(tape); } });
      press("tape-pause", () => tape && tape.pause());
      press("tape-restart", () => { if (tape) tape.currentTime = 0; });
      press("tape-back10", () => { if (tape) tape.currentTime = Math.max(0, tape.currentTime - 10); });
      press("tape-on10", () => { if (tape) tape.currentTime = Math.min(tape.duration || 0, tape.currentTime + 10); });
      press("tape-air", () => {
        if (!mixer) return say("Open the camera first.", true);
        if (tape) { mixer.setTape(tape); mixer.tapeFrom(tape); tape.play().catch(() => {}); }
        mixer.take("tape", !!(d("fade") || {}).checked).then(mark);
      });
      if (d("tape-loop")) d("tape-loop").addEventListener("change", (e) => { if (tape) tape.loop = e.target.checked; });

      const level = (name, fn) => {
        const el = d(name);
        if (el) el.addEventListener("input", () => fn(Number(el.value) / 100));
      };
      level("mic-level", (v) => mixer && mixer.micLevel(v));
      level("tape-level", (v) => mixer && mixer.tapeLevel(v));

      const capWrite = () => mixer && mixer.setCaption((d("cap-text") || {}).value,
        !!(d("cap-on") || {}).checked);
      ["cap-text", "cap-on"].forEach((n) => {
        const el = d(n);
        if (el) { el.addEventListener("input", capWrite); el.addEventListener("change", capWrite); }
      });
      if (d("badge")) d("badge").addEventListener("change", () => mixer && mixer.setBadge(d("badge").value));

      drawDeck();
      preview();
    }

    return {
      wake(camEl, w, h) {
        if (mixer) return;
        mixer = createMixer({ width: w || 960, height: h || 540, fps: 24 });
        mixer.setCamera(camEl);
        if (stream) mixer.micFrom(stream);
        if (d("tape")) { mixer.setTape(d("tape")); }
        mixer.setCaption((d("cap-text") || {}).value, !!(d("cap-on") || {}).checked);
        if (d("badge")) mixer.setBadge(d("badge").value);
        toAir(spec(), null);
        const host = d("programme");
        if (host) {
          host.innerHTML = "";
          mixer.canvas.className = "programme-canvas";
          host.appendChild(mixer.canvas);
        }
        mark();
      },
      air(mode) { if (mixer) mixer.take(mode, false).then(mark); },
      out() { return mixer ? mixer.stream : null; },
      sleep() {
        if (mixer) mixer.stop();
        mixer = null;
        const host = d("programme");
        if (host) host.innerHTML = '<p class="muted small">The gallery is dark. Open the camera to light it.</p>';
        mark();
      }
    };
  }());

  /* The camera is opened before the countdown, so the ten seconds are spent
     looking at yourself rather than waiting for a permission dialogue. The
     camera is not what gets recorded, though: it goes into the mixer, and
     the mixer's canvas is what the recorder sees. That is what lets a plate
     or a piece of tape go out on the feed without a second connection. */
  async function openCamera() {
    const wantCam = $("source").value !== "mic";
    const quality = $("quality").value;
    const size = quality === "high" ? 1280 : quality === "low" ? 640 : 960;
    stream = await navigator.mediaDevices.getUserMedia({
      video: wantCam ? { width: { ideal: size }, frameRate: { ideal: 24 } } : false,
      audio: { echoCancellation: true, noiseSuppression: true }
    });
    const mirror = $("mirror");
    mirror.srcObject = stream;
    mirror.muted = true;
    await mirror.play().catch(() => {});
    desk.wake(mirror, size, Math.round((size * 9) / 16));
    if (!wantCam) desk.air("plate");
    return { wantCam, quality };
  }

  $("start").addEventListener("click", async () => {
    const title = $("title").value.trim();
    const word = $("word").value.trim();
    if (!title) return say("Give the feed a title.", true);
    if (word.length < 3) return say("Set a watchword of at least three characters \u2014 " +
      "nobody gets in without it.", true);
    try {
      say("Opening the camera\u2026");
      const { wantCam, quality } = await openCamera();
      say("Camera open. Ten seconds.");
      cancel = countdown($("count"), 10, () => begin(title, word, wantCam, quality));
      $("start").disabled = true;
      $("stop").disabled = false;
    } catch (err) {
      say((err && err.message) || "The camera would not open.", true);
      $("start").disabled = false;
    }
  });

  async function begin(title, word, wantCam, quality) {
    try {
      const type = ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/webm"]
        .find((t) => MediaRecorder.isTypeSupported(t)) || "video/webm";
      const d = await post({ action: "open", title, word, mime: type, note: $("note").value.trim() });
      feedId = d.id;
      seq = 0;

      rec = new MediaRecorder(desk.out() || stream, {
        mimeType: type,
        videoBitsPerSecond: quality === "high" ? 1800000 : quality === "low" ? 500000 : 1000000,
        audioBitsPerSecond: 64000
      });
      rec.ondataavailable = async (e) => {
        if (!e.data || !e.data.size || feedId == null) return;
        /* The same segments that go out are kept in memory for the archive.
           They are the broadcast, in order, head first, so concatenating
           them is the whole recording with no re-encoding. */
        if (keeping()) tapeParts.push(e.data);
        const bytes = new Uint8Array(await e.data.arrayBuffer());
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        const mine = seq++;
        try {
          await post({ action: "push", id: feedId, seq: mine, head: mine === 0, part: btoa(bin) });
          say("Live \u00b7 " + (mine + 1) + " segments sent \u00b7 watchword \u201c" + word + "\u201d");
        } catch (err) {
          say("A segment did not get through: " + ((err && err.message) || "unknown"), true);
        }
      };
      tapeParts = [];
      tapeType = type;
      tapeFrom = Date.now();
      rec.start(SEGMENT);
      root.classList.add("is-live");
      say("Live. Watchers need an account here and the watchword \u201c" + word + "\u201d.");
      drawMine((await post({ action: "mine" })).feeds || []);
    } catch (err) {
      say((err && err.message) || "The feed would not start.", true);
      stopAll();
    }
  }

  function stopAll() {
    if (rec && rec.state !== "inactive") rec.stop();
    rec = null;
    desk.sleep();
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    root.classList.remove("is-live");
    $("start").disabled = false;
    $("stop").disabled = true;
    if (cancel) { cancel(); cancel = null; }
  }

  const keeping = () => !!($("keep") || {}).checked;

  /* Filing the recording. The broadcast is already in memory as a list of
     segments; this glues them into one file and sends it up in pieces, with
     the count said out loud so a long upload does not look like a hang. */
  async function fileTheTape(id, title) {
    if (!tapeParts.length) return;
    const whole = new Blob(tapeParts, { type: tapeType });
    const seconds = Math.round((Date.now() - tapeFrom) / 1000);
    tapeParts = [];
    const upload = "live-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    try {
      const begun = await post({ action: "keep-begin", upload });
      const raw = Math.floor((begun.chunk_max || 1400000) * 0.7);
      const buf = new Uint8Array(await whole.arrayBuffer());
      const pieces = Math.ceil(buf.length / raw);
      say("Filing the recording \u2014 " + Math.round(buf.length / 1048576) + " MB in " + pieces + " pieces\u2026");
      for (let i = 0; i < pieces; i++) {
        const slice = buf.subarray(i * raw, Math.min(buf.length, (i + 1) * raw));
        let bin = "";
        for (let j = 0; j < slice.length; j++) bin += String.fromCharCode(slice[j]);
        await post({ action: "keep-chunk", upload, seq: i, part: btoa(bin) });
        say("Filing the recording \u2014 piece " + (i + 1) + " of " + pieces + "\u2026");
      }
      const done = await post({ action: "keep", upload, id, title, mime: tapeType, seconds });
      say("Filed as " + done.folder + "/" + done.name + ". It is in the archive below.");
      drawFiles();
    } catch (err) {
      say("The recording could not be filed: " + ((err && err.message) || "unknown") +
        ". The broadcast itself went out fine.", true);
    }
  }

  $("stop").addEventListener("click", async () => {
    const id = feedId;
    const title = $("title").value.trim() || "An unnamed broadcast";
    const keep = keeping();
    feedId = null;
    stopAll();
    if (id) await post({ action: "close", id }).catch(() => {});
    say(keep ? "The feed is ended. Its live segments are deleted; the recording is being filed."
      : "The feed is ended and its segments are deleted. Nothing was kept.");
    drawMine((await post({ action: "mine" })).feeds || []);
    if (keep) await fileTheTape(id, title);
  });

  /* ------------------------------------------------------- the archive */
  /* A file browser, in the plain sense: folders on the left, what is in the
     chosen folder on the right, and a player underneath. Folders are days,
     because that is how anyone looking for a broadcast actually searches. */
  let tapes = [];
  let folderNow = "";

  const size = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.round(b / 1024) + " KB");
  const span = (sec) => Math.floor(sec / 60) + "m " + String(sec % 60).padStart(2, "0") + "s";

  function drawFolders() {
    const host = $("folders");
    if (!host) return;
    const names = [];
    tapes.forEach((t) => { if (names.indexOf(t.folder) < 0) names.push(t.folder); });
    if (!folderNow || names.indexOf(folderNow) < 0) folderNow = names[0] || "";
    host.innerHTML = names.length
      ? names.map((f) => '<li><button type="button" class="folder' +
        (f === folderNow ? " is-on" : "") + '" data-folder="' + esc(f) + '">' +
        '<span class="folder-mark">\u25b8</span> ' + esc(f) + ' <span class="muted xsmall">' +
        tapes.filter((t) => t.folder === f).length + "</span></button></li>").join("")
      : '<li class="muted small">No folders yet.</li>';
    host.querySelectorAll("[data-folder]").forEach((b) => b.addEventListener("click", () => {
      folderNow = b.getAttribute("data-folder");
      drawFolders();
      drawInFolder();
    }));
  }

  function drawInFolder() {
    const host = $("filelist");
    if (!host) return;
    const got = tapes.filter((t) => t.folder === folderNow);
    host.innerHTML = got.length
      ? '<table class="keeper-table"><thead><tr><th>File</th><th>Length</th><th>Size</th>' +
        "<th></th></tr></thead><tbody>" + got.map((t) =>
          "<tr><td>" + esc(t.name) + '<br><span class="muted xsmall">' + esc(t.title) +
          "</span></td><td>" + span(t.seconds) + "</td><td>" + size(t.bytes) + "</td><td>" +
          '<button type="button" class="btn btn--small" data-play="' + t.id + '">Play</button> ' +
          '<a class="btn btn--small btn--ghost" href="' + t.url + '" download="' + esc(t.name) +
          '">Download</a> ' +
          '<button type="button" class="btn btn--small btn--ghost" data-burn="' + t.id + '">Delete</button>' +
          "</td></tr>").join("") + "</tbody></table>"
      : '<p class="muted small">This folder is empty.</p>';
    host.querySelectorAll("[data-play]").forEach((b) => b.addEventListener("click", () => {
      const t = tapes.find((x) => String(x.id) === b.getAttribute("data-play"));
      const v = $("player");
      if (t && v) { v.src = t.url; v.hidden = false; v.play().catch(() => {}); }
    }));
    host.querySelectorAll("[data-burn]").forEach((b) => b.addEventListener("click", async () => {
      if (!confirm("Delete this recording? There is no copy.")) return;
      await post({ action: "tape-drop", tape: Number(b.getAttribute("data-burn")) }).catch(() => {});
      drawFiles();
    }));
  }

  async function drawFiles() {
    if (!$("folders")) return;
    try {
      const d = await post({ action: "tapes" });
      tapes = d.tapes || [];
      drawFolders();
      drawInFolder();
    } catch (err) {
      say((err && err.message) || "The archive would not open.", true);
    }
  }

  if ($("files-load")) $("files-load").addEventListener("click", drawFiles);

  /* The live table. Everyone who has come through the door, grouped by the
     elemental phase they declared, with the overrides at three levels:
     one person, one whole phase, or every non-admin in the room. The
     element is how the order reads a room, so it is how the table is
     ordered rather than an afterthought in a column. */
  const PHASES = [
    { id: "earth", glyph: "\u25bd", note: "body, ground, the slow proof" },
    { id: "fire", glyph: "\u25b3", note: "will, drive, the fast proof" },
    { id: "water", glyph: "\u25bd\u0335", note: "feeling, memory, the deep proof" },
    { id: "air", glyph: "\u25b3\u0335", note: "thought, speech, the clear proof" },
    { id: "aether", glyph: "\u2b21", note: "the field the other four stand in" },
    { id: "unsaid", glyph: "\u00b7", note: "came in before the question, or would not answer" }
  ];

  function tick(p, f) {
    return '<td><input type="checkbox" data-person="' + p.id + '" data-field="' + f + '"' +
      (p[f] ? " checked" : "") + ' aria-label="' + f.replace("_", " ") + " for " + esc(p.who) + '"></td>';
  }

  function phaseRow(ph, folk) {
    const n = folk.length;
    const onCam = folk.filter((p) => p.can_cam).length;
    const onMic = folk.filter((p) => p.can_mic).length;
    return '<tr class="phase-row"><th colspan="6"><span class="phase-glyph">' + ph.glyph +
      "</span> " + ph.id.toUpperCase() + ' <span class="muted xsmall">' + ph.note + " \u00b7 " +
      n + (n === 1 ? " person" : " people") + " \u00b7 " + onCam + " on camera \u00b7 " + onMic +
      ' with a microphone</span><span class="phase-acts">' +
      '<button type="button" class="btn btn--small btn--ghost" data-el="' + ph.id + '" data-field="can_cam" data-on="1">Cameras on</button>' +
      '<button type="button" class="btn btn--small btn--ghost" data-el="' + ph.id + '" data-field="can_cam" data-on="0">off</button>' +
      '<button type="button" class="btn btn--small btn--ghost" data-el="' + ph.id + '" data-field="can_mic" data-on="1">Mics on</button>' +
      '<button type="button" class="btn btn--small btn--ghost" data-el="' + ph.id + '" data-field="can_mic" data-on="0">off</button>' +
      "</span></th></tr>";
  }

  async function drawPeople() {
    if (!feedId) return;
    const n = $("people");
    if (!n) return;
    try {
      const d = await post({ action: "people", id: feedId });
      const folk = d.people || [];
      if (!folk.length) {
        n.innerHTML = '<p class="muted small">Nobody is in the room yet. They are asked for their ' +
          "elemental phase at the door, and appear here under it.</p>";
        return;
      }
      let html = '<table class="keeper-table people-table"><thead><tr><th>Who</th><th>Chat</th>' +
        "<th>Camera</th><th>Microphone</th><th>Blocked</th><th>On air</th></tr></thead><tbody>";
      PHASES.forEach((ph) => {
        const got = folk.filter((p) => (p.element || "unsaid") === ph.id);
        if (!got.length) return;
        html += phaseRow(ph, got);
        html += got.map((p) =>
          "<tr><td>" + esc(p.who) + "</td>" +
          tick(p, "can_chat") + tick(p, "can_cam") + tick(p, "can_mic") + tick(p, "blocked") +
          "<td>" + (p.on_camera ? "yes" : "\u2014") + "</td></tr>").join("");
      });
      html += "</tbody></table>";
      n.innerHTML = html;

      n.querySelectorAll("[data-person]").forEach((b) => b.addEventListener("change", async () => {
        await post({ action: "allow", id: feedId, person: Number(b.getAttribute("data-person")),
          field: b.getAttribute("data-field"), value: b.checked }).catch(() => {});
        drawPeople();
      }));
      n.querySelectorAll("[data-el]").forEach((b) => b.addEventListener("click", async () => {
        await post({ action: "allow", id: feedId, element: b.getAttribute("data-el"),
          field: b.getAttribute("data-field"), value: b.getAttribute("data-on") === "1" }).catch(() => {});
        drawPeople();
      }));
    } catch { /* the table will be there next beat */ }
  }

  /* Everyone at once. The admin is not in this table, so "all" can never
     lock the broadcaster out of their own room. */
  root.querySelectorAll("[data-all]").forEach((b) => b.addEventListener("click", async () => {
    if (!feedId) return say("No feed is running.", true);
    await post({ action: "allow", id: feedId, all: true,
      field: b.getAttribute("data-all"), value: b.getAttribute("data-on") === "1" })
      .then((d) => say("Changed for " + d.changed + " in the room."))
      .catch((e) => say((e && e.message) || "That did not take.", true));
    drawPeople();
  }));

  const orderSay = $("order-say");
  if (orderSay) orderSay.addEventListener("click", async () => {
    const box = $("order-line");
    const body = box.value.trim();
    if (!body || !feedId) return;
    box.value = "";
    await post({ action: "order-say", id: feedId, body }).catch(() => {});
  });

  setInterval(drawPeople, 4000);

  addEventListener("beforeunload", () => {
    if (feedId) navigator.sendBeacon && navigator.sendBeacon("/api/live",
      new Blob([JSON.stringify({ action: "close", pass, id: feedId })], { type: "application/json" }));
  });
})();

/* -------------------------------------------------------------- watching */
(function watch() {
  const root = document.getElementById("live-watch");
  if (!root) return;
  const $ = (n) => root.querySelector('[data-lw="' + n + '"]');
  const mine = { element: "" };
  let feeds = [], picked = null, since = -1, timer = null, src = null, buffer = null;
  const queue = [];

  const say = (t, bad) => {
    const n = $("msg");
    if (n) { n.textContent = t || ""; n.className = "auth-msg" + (bad ? " is-bad" : ""); }
  };

  const post = (payload) => fetch("/api/live", {
    method: "POST",
    headers: Object.assign({ "content-type": "application/json" },
      window.EGAuthHeaders ? window.EGAuthHeaders() : {}),
    body: JSON.stringify(payload)
  }).then(async (r) => {
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "the feed refused that");
    return d;
  });

  async function refresh() {
    try {
      const d = await fetch("/api/live", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "list" })
      }).then((r) => r.json());
      feeds = d.feeds || [];
      const n = $("list");
      n.innerHTML = feeds.length
        ? feeds.map((f) =>
          '<li><button type="button" class="btn btn--small" data-feed="' + f.id + '">' +
          esc(f.title) + "</button> " +
          '<span class="muted xsmall">live since ' + esc(when(f.since)) +
          " \u00b7 " + f.watchers + " watching</span>" +
          (f.note ? '<br><span class="muted xsmall">' + esc(f.note) + "</span>" : "") + "</li>").join("")
        : '<li class="muted small">Nothing is live at the moment. The order broadcasts rarely and ' +
          "without warning; this page is where it appears when it does.</li>";
      n.querySelectorAll("[data-feed]").forEach((b) => b.addEventListener("click", () => {
        picked = feeds.find((f) => String(f.id) === b.getAttribute("data-feed"));
        $("chosen").textContent = picked ? picked.title : "";
        $("gate").hidden = false;
        $("word").focus();
      }));
    } catch {
      say("The list of feeds could not be read.", true);
    }
  }

  $("enter").addEventListener("click", async () => {
    if (!picked) return say("Choose a feed first.", true);
    const word = $("word").value.trim();
    if (!word) return say("The watchword, please.", true);
    const chose = root.querySelector('input[name="lw-element"]:checked');
    const element = chose ? chose.value : "";
    if (!element) {
      return say("Before you come in: which elemental phase is your integral aligned with \u2014 " +
        "earth, fire, water, air or aether?", true);
    }
    try {
      const d = await post({ action: "join", id: picked.id, word, element });
      mine.element = d.element || element;
      say("In, as " + (d.element || element) + ". " + d.title +
        " \u2014 running a few seconds behind the room.");
      start(picked.id, word, d.mime || "video/webm");
      room(picked.id, word);
    } catch (err) {
      say((err && err.message) || "That did not let you in.", true);
    }
  });

  /* Segments are appended to one MediaSource in order. The first carries
     the format header; 'sequence' mode lets the rest follow it without
     their own timestamps lining up, which is what makes a recorded stream
     playable as a stream at all. */
  function start(id, word, mime) {
    const video = $("video");
    $("stage").hidden = false;
    since = -1;
    if (timer) clearInterval(timer);

    if (!window.MediaSource || !MediaSource.isTypeSupported(mime)) {
      say("This browser cannot play the feed's format.", true);
      return;
    }
    src = new MediaSource();
    video.src = URL.createObjectURL(src);
    src.addEventListener("sourceopen", () => {
      buffer = src.addSourceBuffer(mime);
      buffer.mode = "sequence";
      buffer.addEventListener("updateend", pump);
      pull(id, word);
      timer = setInterval(() => pull(id, word), POLL);
    });

    function pump() {
      if (!buffer || buffer.updating || !queue.length) return;
      try { buffer.appendBuffer(queue.shift()); } catch { /* the window moved on */ }
    }

    async function pull(feedId, pass) {
      try {
        const d = await post({ action: "pull", id: feedId, word: pass, since });
        (d.parts || []).forEach((p) => {
          since = Math.max(since, p.seq);
          const bin = atob(p.part);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          queue.push(bytes);
        });
        pump();
        /* Keep near the live edge; a watcher who tabs away should not come
           back three minutes behind. */
        if (video.buffered.length) {
          const edge = video.buffered.end(video.buffered.length - 1);
          if (edge - video.currentTime > 6) video.currentTime = edge - 1.2;
        }
        if (video.paused) video.play().catch(() => {});
        if (d.state !== "live") {
          clearInterval(timer);
          say("The feed has ended.");
        }
      } catch (err) {
        say((err && err.message) || "The feed dropped.", true);
      }
    }
  }


  /* ------------------------------------------------------------- the room
     Chat, the people in it, and any member who has been given the floor
     with a camera of their own. All of it is polled on the same clock as
     the feed, because a second connection would buy nothing here. */
  function room(id, word) {
    const box = document.getElementById("live-room");
    if (!box) return;
    box.hidden = false;
    const $$ = (n) => box.querySelector('[data-lr="' + n + '"]');
    let since = 0, mine = null, myRec = null, myStream = null, mySeq = 0;
    const seen = new Set();

    const line = (l) =>
      '<li class="' + (l.order ? "chat-order" : "") + '"><span class="chat-who">' +
      esc(l.who) + "</span> " + esc(l.body) + "</li>";

    async function beat() {
      try {
        const d = await post({ action: "room", id, word, since });
        (d.lines || []).forEach((l) => {
          if (seen.has(l.id)) return;
          seen.add(l.id);
          since = Math.max(since, l.id);
          $$("lines").insertAdjacentHTML("beforeend", line(l));
        });
        if (d.lines && d.lines.length) {
          const log = $$("log");
          log.scrollTop = log.scrollHeight;
        }
        $$("people").textContent = (d.people || []).map((p) => p.who).join(" \u00b7 ") ||
          "nobody else, yet";
        $$("send").disabled = !(d.you && d.you.can_chat);
        $$("saybox").placeholder = d.you && d.you.can_chat
          ? "Say something to the room"
          : "The broadcaster has turned your voice off";
        const camBtn = $$("camera");
        camBtn.disabled = !(d.you && d.you.can_cam) && !mine;
        camBtn.title = d.you && d.you.can_cam
          ? "" : "The broadcaster has to open the floor to you first";
        drawCams(d.cams || [], word);
        if (d.state !== "live") { clearInterval(beatTimer); dropCam(); }
      } catch (err) {
        /* A dropped beat is not worth shouting about; the next one usually
           lands. Only a refusal is worth saying out loud. */
        if (err && /watchword|member|room to you/i.test(err.message)) say(err.message, true);
      }
    }

    /* Other people's cameras, each its own little window. */
    const windows = new Map();
    function drawCams(cams, pass) {
      const wall = $$("wall");
      cams.forEach((c) => {
        if (windows.has(c.id) || (mine && c.id === mine)) return;
        const cell = document.createElement("figure");
        cell.className = "cam-cell";
        cell.innerHTML = '<video playsinline autoplay muted></video><figcaption>' + esc(c.who) + "</figcaption>";
        wall.appendChild(cell);
        const v = cell.querySelector("video");
        v.muted = false;
        windows.set(c.id, { cell, stop: playInto(v, c.id, pass) });
      });
      windows.forEach((w, id) => {
        if (!cams.some((c) => c.id === id)) {
          w.stop();
          w.cell.remove();
          windows.delete(id);
        }
      });
    }

    /* The same segment-by-segment playback the main feed uses. */
    function playInto(video, feedId, pass) {
      let from = -1, timer = null, buf = null;
      const q = [];
      const mime = "video/webm";
      if (!window.MediaSource || !MediaSource.isTypeSupported(mime)) return () => {};
      const src = new MediaSource();
      video.src = URL.createObjectURL(src);
      src.addEventListener("sourceopen", () => {
        buf = src.addSourceBuffer(mime);
        buf.mode = "sequence";
        buf.addEventListener("updateend", pump);
        tick();
        timer = setInterval(tick, POLL);
      });
      function pump() {
        if (!buf || buf.updating || !q.length) return;
        try { buf.appendBuffer(q.shift()); } catch { /* the window moved on */ }
      }
      async function tick() {
        try {
          const d = await post({ action: "pull", id: feedId, word: pass, since: from });
          (d.parts || []).forEach((p) => {
            from = Math.max(from, p.seq);
            const bin = atob(p.part);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            q.push(bytes);
          });
          pump();
          if (video.paused) video.play().catch(() => {});
        } catch { /* the camera went down */ }
      }
      return () => { if (timer) clearInterval(timer); };
    }

    $$("send").addEventListener("click", async (e) => {
      e.preventDefault();
      const body = $$("saybox").value.trim();
      if (!body) return;
      $$("saybox").value = "";
      try { await post({ action: "say", id, word, body }); await beat(); }
      catch (err) { say((err && err.message) || "That did not go through.", true); }
    });
    $$("saybox").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $$("send").click(); }
    });

    /* Your own camera in the room, with the same ten-second countdown the
       broadcaster gets. */
    $$("camera").addEventListener("click", async () => {
      if (mine) { dropCam(); return; }
      try {
        myStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, frameRate: { ideal: 20 } },
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        const own = $$("own");
        own.hidden = false;
        own.srcObject = myStream;
        own.muted = true;
        own.play().catch(() => {});
        $$("camera").textContent = "Lower my camera";
        countdown($$("count"), 10, () => raise(id, word));
      } catch (err) {
        say((err && err.message) || "Your camera would not open.", true);
      }
    });

    async function raise(feedId, pass) {
      try {
        const type = ["video/webm;codecs=vp8,opus", "video/webm"]
          .find((t) => MediaRecorder.isTypeSupported(t)) || "video/webm";
        const d = await post({ action: "cam", id: feedId, word: pass, on: true, mime: type });
        mine = d.cam;
        mySeq = 0;
        myRec = new MediaRecorder(myStream, { mimeType: type, videoBitsPerSecond: 600000, audioBitsPerSecond: 48000 });
        myRec.ondataavailable = async (e) => {
          if (!e.data || !e.data.size || !mine) return;
          const bytes = new Uint8Array(await e.data.arrayBuffer());
          let bin = "";
          for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
          const n = mySeq++;
          await post({ action: "cam-push", id: feedId, word: pass, cam: mine, seq: n,
            head: n === 0, part: btoa(bin) }).catch(() => {});
        };
        myRec.start(SEGMENT);
        say("Your camera is up in the room.");
      } catch (err) {
        say((err && err.message) || "The floor is not open to you yet.", true);
        dropCam();
      }
    }

    function dropCam() {
      if (myRec && myRec.state !== "inactive") myRec.stop();
      myRec = null;
      if (myStream) myStream.getTracks().forEach((t) => t.stop());
      myStream = null;
      const own = $$("own");
      if (own) { own.hidden = true; own.srcObject = null; }
      $$("camera").textContent = "Put my camera up";
      if (mine) post({ action: "cam", id, word, on: false }).catch(() => {});
      mine = null;
    }

    beat();
    const beatTimer = setInterval(beat, 2500);
    addEventListener("beforeunload", dropCam);
  }

  refresh();
  setInterval(refresh, 20000);
})();
