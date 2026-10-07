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

  /* The camera is opened before the countdown, so the ten seconds are spent
     looking at yourself rather than waiting for a permission dialogue. */
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

      rec = new MediaRecorder(stream, {
        mimeType: type,
        videoBitsPerSecond: quality === "high" ? 1800000 : quality === "low" ? 500000 : 1000000,
        audioBitsPerSecond: 64000
      });
      rec.ondataavailable = async (e) => {
        if (!e.data || !e.data.size || feedId == null) return;
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
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    root.classList.remove("is-live");
    $("start").disabled = false;
    $("stop").disabled = true;
    if (cancel) { cancel(); cancel = null; }
  }

  $("stop").addEventListener("click", async () => {
    const id = feedId;
    feedId = null;
    stopAll();
    if (id) await post({ action: "close", id }).catch(() => {});
    say("The feed is ended and its segments are deleted.");
    drawMine((await post({ action: "mine" })).feeds || []);
  });

  /* The override table. One tickbox per power, per person, and a block that
     takes everything at once — a broadcaster dealing with a nuisance
     should not have to untick three boxes in a row. */
  async function drawPeople() {
    if (!feedId) return;
    const n = $("people");
    if (!n) return;
    try {
      const d = await post({ action: "people", id: feedId });
      const folk = d.people || [];
      n.innerHTML = folk.length
        ? '<table class="keeper-table"><thead><tr><th>Who</th><th>Chat</th><th>Camera</th>' +
          "<th>Blocked</th><th>On air</th></tr></thead><tbody>" + folk.map((p) =>
            "<tr><td>" + esc(p.who) + "</td>" +
            ["can_chat", "can_cam", "blocked"].map((f) =>
              '<td><input type="checkbox" data-person="' + p.id + '" data-field="' + f + '"' +
              (p[f] ? " checked" : "") + ' aria-label="' + f.replace("_", " ") + ' for ' +
              esc(p.who) + '"></td>').join("") +
            "<td>" + (p.on_camera ? "yes" : "\u2014") + "</td></tr>").join("") + "</tbody></table>"
        : '<p class="muted small">Nobody is in the room yet.</p>';
      n.querySelectorAll("[data-person]").forEach((b) => b.addEventListener("change", async () => {
        await post({ action: "allow", person: Number(b.getAttribute("data-person")),
          field: b.getAttribute("data-field"), value: b.checked }).catch(() => {});
        drawPeople();
      }));
    } catch { /* the table will be there next beat */ }
  }

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
    try {
      const d = await post({ action: "join", id: picked.id, word });
      say("In. " + d.title + " \u2014 running a few seconds behind the room.");
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
