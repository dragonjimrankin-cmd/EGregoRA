/* ===========================================================================
   EGregoRA — the Oracle's familiar.

   A low-poly 3D fox head, built procedurally in Three.js, that speaks the
   oracle's answers aloud in a British male voice using the browser's own
   speech synthesiser. No audio files, no API key, no third-party service:
   the mesh is generated from primitives at runtime and the voice comes from
   the operating system.

   Exposes window.EGFox = { speak(text), stop(), available }.
   =========================================================================== */

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

(() => {
  "use strict";

  const mount = document.getElementById("fox-stage");
  if (!mount) return;

  const statusEl = document.getElementById("fox-status");
  const btnSpeak = document.getElementById("fox-speak");
  const btnStop = document.getElementById("fox-stop");
  const setStatus = (s) => { if (statusEl) statusEl.textContent = s; };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------- palette */
  const FUR      = 0xb2552a;
  const FUR_DARK = 0x8a3d1c;
  const CREAM    = 0xf3e6cf;
  const DARKEST  = 0x241611;
  const GOLD     = 0xd7b05a;

  const mat = (color, opts = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.05, flatShading: true, ...opts });

  const furMat   = mat(FUR);
  const darkMat  = mat(FUR_DARK);
  const creamMat = mat(CREAM, { roughness: 0.9 });
  const blackMat = mat(DARKEST, { roughness: 0.5 });
  const eyeMat   = new THREE.MeshStandardMaterial({
    color: GOLD, roughness: 0.25, metalness: 0.35, emissive: 0x3a2a08, flatShading: false
  });

  /* ------------------------------------------------------------- scene */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.12, 6.2);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (err) {
    mount.classList.add("fox-stage--failed");
    setStatus("The familiar cannot be drawn here — your browser has no WebGL. The written answer stands on its own.");
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  /* lighting — warm key, cool rim, to match the site's gold-on-ink */
  scene.add(new THREE.AmbientLight(0xfff2d8, 0.55));
  const key = new THREE.DirectionalLight(0xffd9a0, 1.5); key.position.set(2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fa8ff, 0.8); rim.position.set(-3, 1.2, -2.5); scene.add(rim);
  const fill = new THREE.PointLight(0xd7b05a, 0.8, 18); fill.position.set(0, -1.5, 3); scene.add(fill);

  /* ------------------------------------------------------------- the fox */
  const fox = new THREE.Group();
  scene.add(fox);

  const head = new THREE.Group();
  fox.add(head);

  // skull — a faceted sphere, squashed
  const skull = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), furMat);
  skull.scale.set(1, 0.95, 0.92);
  head.add(skull);

  // cheek ruffs
  [-1, 1].forEach((s) => {
    const ruff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), creamMat);
    ruff.position.set(0.82 * s, -0.3, 0.1);
    ruff.scale.set(0.9, 1.25, 0.7);
    ruff.rotation.z = -0.5 * s;
    head.add(ruff);
  });

  // brow / forehead blaze
  const blaze = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), darkMat);
  blaze.position.set(0, 0.55, 0.62);
  blaze.scale.set(1.1, 0.55, 0.45);
  head.add(blaze);

  // upper muzzle
  const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.46, 1.25, 7), creamMat);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, -0.08, 1.12);
  muzzle.scale.set(1, 1, 0.62);
  head.add(muzzle);

  // nose
  const nose = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), blackMat);
  nose.position.set(0, 0.02, 1.72);
  nose.scale.set(1.25, 0.85, 0.85);
  head.add(nose);

  // ---- jaw: the piece that animates with speech
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.22, 0.35);
  head.add(jaw);

  const lowerJaw = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.05, 7), creamMat);
  lowerJaw.rotation.x = Math.PI / 2;
  lowerJaw.position.set(0, -0.12, 0.6);
  lowerJaw.scale.set(1, 1, 0.42);
  jaw.add(lowerJaw);

  // dark mouth interior, revealed as the jaw drops
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.9), blackMat);
  mouth.position.set(0, 0.06, 0.52);
  jaw.add(mouth);

  // a hint of teeth, because he is a fox
  [-1, 1].forEach((s) => {
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.17, 4), creamMat);
    fang.position.set(0.17 * s, 0.17, 0.86);
    fang.rotation.x = Math.PI;
    head.add(fang);
  });

  // ---- eyes
  const eyes = [];
  const lids = [];
  [-1, 1].forEach((s) => {
    const socket = new THREE.Group();
    socket.position.set(0.44 * s, 0.26, 0.76);
    head.add(socket);

    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), eyeMat);
    socket.add(ball);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), blackMat);
    pupil.scale.set(0.45, 1, 0.6);
    pupil.position.set(0, 0, 0.14);
    ball.add(pupil);

    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.225, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), furMat);
    lid.position.set(0, 0, 0);
    socket.add(lid);

    eyes.push(ball);
    lids.push(lid);
  });

  // ---- ears
  const ears = [];
  [-1, 1].forEach((s) => {
    const ear = new THREE.Group();
    ear.position.set(0.62 * s, 0.82, -0.1);
    ear.rotation.z = -0.32 * s;
    head.add(ear);

    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.15, 4), furMat);
    outer.position.y = 0.52;
    outer.scale.set(1, 1, 0.45);
    ear.add(outer);

    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.8, 4), darkMat);
    inner.position.set(0, 0.46, 0.1);
    inner.scale.set(1, 1, 0.3);
    ear.add(inner);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.3, 4), blackMat);
    tip.position.y = 1.02;
    tip.scale.set(1, 1, 0.45);
    ear.add(tip);

    ears.push(ear);
  });

  // ---- a suggestion of a neck ruff so the head is not floating
  const collar = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), creamMat);
  collar.position.set(0, -1.28, -0.1);
  collar.scale.set(1.15, 0.5, 0.8);
  fox.add(collar);

  // ---- an order sigil ring turning slowly behind him
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.05, 0.012, 6, 96),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.45 })
  );
  ring.position.z = -1.4;
  scene.add(ring);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.72, 0.008, 6, 6),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.35 })
  );
  ring2.position.z = -1.35;
  scene.add(ring2);

  /* ------------------------------------------------------------- sizing */
  const resize = () => {
    const w = mount.clientWidth || 320;
    const h = mount.clientHeight || Math.round(w * 0.78);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

  /* ------------------------------------------------------------- state */
  let speaking = false;
  let jawTarget = 0;
  let jawNow = 0;
  let blinkTimer = 2 + Math.random() * 4;
  let blink = 0;
  let pointer = { x: 0, y: 0 };

  mount.addEventListener("pointermove", (e) => {
    const r = mount.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  mount.addEventListener("pointerleave", () => { pointer.x = 0; pointer.y = 0; });

  /* ------------------------------------------------------------- loop */
  const clock = new THREE.Clock();
  const animate = () => {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    if (!reduceMotion) {
      // idle breathing and sway
      fox.position.y = Math.sin(t * 0.9) * 0.045;
      head.rotation.z = Math.sin(t * 0.52) * 0.035;
      ring.rotation.z = t * 0.06;
      ring2.rotation.z = -t * 0.09;

      // ear flicks
      ears.forEach((ear, i) => {
        const s = i === 0 ? -1 : 1;
        const flick = Math.sin(t * 1.3 + i * 2.1) * 0.03 + (Math.sin(t * 7.3 + i) > 0.985 ? 0.18 : 0);
        ear.rotation.z = -0.32 * s + flick * s;
      });
    }

    // look towards the pointer, or gently about when idle
    const lookX = pointer.x * 0.32 + (speaking ? 0 : Math.sin(t * 0.37) * 0.07);
    const lookY = pointer.y * 0.2 + (speaking ? 0 : Math.cos(t * 0.29) * 0.05);
    head.rotation.y += (lookX - head.rotation.y) * 0.06;
    head.rotation.x += (lookY * 0.6 - head.rotation.x) * 0.06;

    // blinking
    blinkTimer -= dt;
    if (blinkTimer <= 0) { blink = 1; blinkTimer = 2.5 + Math.random() * 5; }
    if (blink > 0) blink = Math.max(0, blink - dt * 7);
    const open = 1 - Math.sin(blink * Math.PI);
    lids.forEach((l) => { l.rotation.x = -Math.PI * 0.5 * open * 0.0 + (1 - open) * 1.9; l.scale.y = 1; });
    eyes.forEach((e) => { e.scale.y = 0.15 + 0.85 * open; });

    // jaw — driven by speech, eased so it never snaps
    if (speaking) {
      // a plausible mouth: a fast carrier under a slower syllabic envelope
      const env = 0.5 + 0.5 * Math.sin(t * 7.1);
      const carrier = 0.5 + 0.5 * Math.sin(t * 19.3 + Math.sin(t * 3.1) * 2);
      jawTarget = 0.07 + 0.42 * env * carrier;
    } else {
      jawTarget = 0;
    }
    jawNow += (jawTarget - jawNow) * 0.35;
    jaw.rotation.x = jawNow;
    mouth.scale.y = 1 + jawNow * 2.2;

    renderer.render(scene, camera);
  };
  animate();

  /* ======================================================== the voice */

  const synth = window.speechSynthesis;
  const canSpeak = !!synth && typeof SpeechSynthesisUtterance === "function";

  let chosenVoice = null;

  /* Prefer, in order: a named British male system voice, any en-GB voice,
     any English voice. The named list covers macOS/iOS, Windows and the
     common Chrome/Android voices. */
  const BRITISH_MALE = [
    "daniel", "arthur", "oliver", "george", "ryan", "thomas",
    "google uk english male", "microsoft george", "microsoft ryan",
    "en-gb-language", "british"
  ];

  const pickVoice = () => {
    if (!canSpeak) return null;
    const voices = synth.getVoices();
    if (!voices.length) return null;

    const gb = voices.filter((v) => /^en[-_]GB/i.test(v.lang));
    const byName = (list) =>
      list.find((v) => BRITISH_MALE.some((n) => v.name.toLowerCase().includes(n)));

    chosenVoice =
      byName(gb) ||
      byName(voices) ||
      gb.find((v) => !/female|zira|hazel|susan|kate|serena|fiona|martha/i.test(v.name)) ||
      gb[0] ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0] ||
      null;

    return chosenVoice;
  };

  if (canSpeak) {
    pickVoice();
    synth.addEventListener?.("voiceschanged", () => {
      pickVoice();
      if (chosenVoice) setStatus(readyLine());
    });
  }

  const readyLine = () => {
    if (!canSpeak) return "Your browser has no speech synthesiser — the fox will mouth the words silently.";
    if (!chosenVoice) return "Ready. Ask the oracle and the fox will read the answer aloud.";
    const gb = /^en[-_]GB/i.test(chosenVoice.lang);
    return gb
      ? `Ready — speaking as ${chosenVoice.name} (British English).`
      : `Ready — your device has no British voice installed, so ${chosenVoice.name} will stand in.`;
  };
  setStatus(readyLine());

  /* Long answers must be split: most engines truncate or stall past a few
     hundred characters. Split on sentence boundaries and queue. */
  const chunk = (text, max = 220) => {
    const sentences = String(text)
      .replace(/\s+/g, " ")
      .replace(/([.!?…])\s+/g, "$1\u0000")
      .split("\u0000")
      .filter(Boolean);

    const out = [];
    let buf = "";
    for (const s of sentences) {
      if ((buf + " " + s).trim().length > max) {
        if (buf) out.push(buf.trim());
        buf = s;
      } else {
        buf = (buf + " " + s).trim();
      }
    }
    if (buf) out.push(buf.trim());
    return out;
  };

  let queue = [];
  let muted = false;

  const stop = () => {
    queue = [];
    speaking = false;
    if (canSpeak) synth.cancel();
    if (btnStop) btnStop.disabled = true;
    setStatus(readyLine());
  };

  const sayNext = () => {
    if (!queue.length) {
      speaking = false;
      if (btnStop) btnStop.disabled = true;
      setStatus("Finished. Test everything kindly.");
      return;
    }
    const part = queue.shift();
    const u = new SpeechSynthesisUtterance(part);
    if (chosenVoice) { u.voice = chosenVoice; u.lang = chosenVoice.lang; }
    else u.lang = "en-GB";
    u.rate = 0.95;   // unhurried, as an oracle should be
    u.pitch = 0.88;  // a shade below default: male, dry
    u.volume = 1;

    u.onstart = () => { speaking = true; };
    u.onend = () => { sayNext(); };
    u.onerror = () => { sayNext(); };
    synth.speak(u);
  };

  const speak = (text) => {
    if (!text) return;
    lastText = text;
    if (btnSpeak) btnSpeak.disabled = false;
    if (muted) return;

    if (!canSpeak) {
      // No synthesiser: still animate, so the familiar is not simply dead.
      speaking = true;
      setStatus("Mouthing the answer — no speech synthesiser on this device.");
      clearTimeout(silentTimer);
      silentTimer = setTimeout(() => { speaking = false; setStatus(readyLine()); },
        Math.min(45000, 60 * text.length));
      return;
    }

    synth.cancel();
    if (!chosenVoice) pickVoice();
    queue = chunk(text);
    speaking = true;
    if (btnStop) btnStop.disabled = false;
    setStatus(chosenVoice ? `Speaking — ${chosenVoice.name}.` : "Speaking.");
    sayNext();
  };

  let silentTimer = null;
  let lastText = "";

  btnSpeak?.addEventListener("click", () => {
    if (!lastText) {
      speak(
        "I am the order's familiar. Ask the oracle a question and I will read its answer aloud. " +
        "Everything I say is written in advance by the order and graded by its rules on evidence. " +
        "Test everything kindly."
      );
    } else {
      speak(lastText);
    }
  });

  btnStop?.addEventListener("click", stop);
  if (btnStop) btnStop.disabled = true;

  // Stop talking if the reader leaves the page.
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });

  window.EGFox = {
    speak,
    stop,
    available: true,
    get muted() { return muted; },
    set muted(v) { muted = !!v; if (muted) stop(); }
  };

  // Anything the oracle produced before the fox finished loading.
  if (window.__EG_PENDING_SPEECH__) {
    speak(window.__EG_PENDING_SPEECH__);
    window.__EG_PENDING_SPEECH__ = "";
  }
})();
