/* ===========================================================================
   EGregoRA — the Oracle's familiar.

   A sculpted low-poly fox, generated entirely in code: the skull, jaw, ears,
   tongue and tail are built by deforming primitives vertex by vertex rather
   than by stacking spheres, so the silhouette reads as an animal rather than
   as a snowman. He breathes, blinks, flicks his ears, tracks the cursor,
   swishes his tail, and lip-syncs to the browser's own speech synthesiser in
   a British male voice.

   No audio files, no API key, no third-party service.
   Exposes window.EGFox = { speak(text), stop(), available, muted }.
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

  /* ----------------------------------------------------------- palette */
  const C = {
    fur:      0xc2622c,
    furDeep:  0x9a4318,
    furShade: 0x7a3414,
    cream:    0xf6ead6,
    creamDim: 0xdcc9ad,
    black:    0x1d1310,
    gold:     0xd7b05a,
    iris:     0xe8b84b,
    tongue:   0xc4727a
  };

  const S = (color, o = {}) => new THREE.MeshStandardMaterial({
    color, roughness: 0.82, metalness: 0.02, flatShading: true, ...o
  });

  const M = {
    fur:      S(C.fur),
    furDeep:  S(C.furDeep),
    furShade: S(C.furShade),
    cream:    S(C.cream, { roughness: 0.92 }),
    creamDim: S(C.creamDim, { roughness: 0.95 }),
    black:    S(C.black,  { roughness: 0.42, metalness: 0.08 }),
    nose:     S(0x2a1a16, { roughness: 0.25, metalness: 0.1, flatShading: false }),
    tongue:   S(C.tongue, { roughness: 0.6, flatShading: false }),
    iris:     new THREE.MeshStandardMaterial({
                color: C.iris, roughness: 0.18, metalness: 0.3,
                emissive: 0x4a3208, emissiveIntensity: 0.7, flatShading: false }),
    sclera:   new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.3, flatShading: false }),
    whisker:  new THREE.MeshBasicMaterial({ color: 0xf0e4cf, transparent: true, opacity: 0.5 })
  };

  /* ----------------------------------------------------------- helpers */

  /** Deform a geometry in place with a (vec3) => void callback. */
  const sculpt = (geo, fn) => {
    const p = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      fn(v);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  };

  const smoothstep = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  /* ----------------------------------------------------------- scene */
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x090910, 7, 15);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.05, 7.1);
  camera.lookAt(0, -0.05, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (err) {
    mount.classList.add("fox-stage--failed");
    setStatus("The familiar cannot be drawn here — this browser has no WebGL. The written answer stands on its own.");
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.appendChild(renderer.domElement);

  /* lighting: warm key from upper right, cool rim behind left, gold bounce */
  scene.add(new THREE.HemisphereLight(0xffe9c4, 0x1a1420, 0.65));
  const key = new THREE.DirectionalLight(0xffd79a, 2.0);
  key.position.set(3.2, 4.0, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 20;
  key.shadow.camera.left = -4; key.shadow.camera.right = 4;
  key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.bias = -0.0015;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x9db6ff, 1.1);
  rim.position.set(-3.6, 1.6, -3.2);
  scene.add(rim);

  const bounce = new THREE.PointLight(C.gold, 1.1, 14, 2);
  bounce.position.set(0, -2.0, 2.6);
  scene.add(bounce);

  /* ======================================================== the fox */
  const fox = new THREE.Group();
  fox.position.y = -0.25;
  scene.add(fox);

  /* ---------- body / chest bust -------------------------------------- */
  const body = new THREE.Group();
  fox.add(body);

  const chestGeo = sculpt(new THREE.SphereGeometry(1.25, 22, 18), (v) => {
    v.y *= 1.08;
    v.z *= 0.86;
    // taper the top towards the neck
    const up = smoothstep(0.1, 1.2, v.y);
    v.x *= 1 - 0.46 * up;
    v.z *= 1 - 0.42 * up;
    // widen the shoulders
    const sh = smoothstep(0.6, -0.4, v.y);
    v.x *= 1 + 0.2 * sh;
    // flatten the base so he sits in the frame
    if (v.y < -0.85) v.y = -0.85 - (v.y + 0.85) * 0.25;
  });
  const chest = new THREE.Mesh(chestGeo, M.fur);
  chest.position.y = -1.72;
  chest.castShadow = true; chest.receiveShadow = true;
  body.add(chest);

  // cream bib down the front
  const bibGeo = sculpt(new THREE.SphereGeometry(1.1, 18, 14), (v) => {
    v.y *= 1.1; v.z *= 0.55;
    const up = smoothstep(0.0, 1.2, v.y);
    v.x *= 1 - 0.5 * up;
  });
  const bib = new THREE.Mesh(bibGeo, M.cream);
  bib.position.set(0, -1.82, 0.55);
  bib.scale.set(0.78, 0.92, 1);
  body.add(bib);

  // shoulder fur tufts
  const tuft = (x, y, z, s, rot, matl) => {
    const g = sculpt(new THREE.ConeGeometry(0.3, 0.95, 4), (v) => { v.z *= 0.45; });
    const m = new THREE.Mesh(g, matl);
    m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.set(rot[0], rot[1], rot[2]);
    m.castShadow = true;
    return m;
  };
  for (let i = 0; i < 9; i++) {
    const a = (i / 8) * Math.PI - Math.PI / 2;
    const r = 1.02;
    body.add(tuft(
      Math.sin(a) * r * 1.08, -1.0 + Math.cos(a) * 0.1, Math.cos(a) * r * 0.62,
      0.52 + 0.2 * Math.cos(a),
      [0.5 + 0.15 * Math.cos(a), 0, -Math.sin(a) * 0.9],
      i % 3 === 0 ? M.creamDim : M.furDeep
    ));
  }

  /* ---------- the tail ------------------------------------------------ */
  const tail = new THREE.Group();
  tail.position.set(-0.95, -2.25, -0.55);
  body.add(tail);

  const tailSegs = [];
  let parent = tail;
  for (let i = 0; i < 7; i++) {
    const seg = new THREE.Group();
    seg.position.y = i === 0 ? 0 : 0.46;
    const r = 0.46 - i * 0.045;
    const g = sculpt(new THREE.SphereGeometry(r, 12, 9), (v) => { v.y *= 1.25; v.z *= 0.92; });
    const mesh = new THREE.Mesh(g, i >= 5 ? M.cream : (i % 2 ? M.fur : M.furDeep));
    mesh.castShadow = true;
    seg.add(mesh);
    parent.add(seg);
    parent = seg;
    tailSegs.push(seg);
  }
  tail.rotation.z = 0.9;
  tail.rotation.x = -0.3;

  /* ---------- the head ------------------------------------------------ */
  const neck = new THREE.Group();
  neck.position.y = -0.5;
  fox.add(neck);

  const head = new THREE.Group();
  neck.add(head);

  /* The skull: a sphere pulled forward into a wedge-shaped muzzle, flattened
     on top, with a brow ridge and cheek flares. This single sculpt does most
     of the work of making him look vulpine. */
  const skullGeo = sculpt(new THREE.SphereGeometry(1.0, 32, 24), (v) => {
    const fwd = smoothstep(0.1, 1.0, v.z);          // how far towards the nose
    // draw the face forward into a long tapered muzzle
    v.z += fwd * fwd * 1.15;
    v.x *= 1 - 0.66 * fwd;
    v.y = v.y * (1 - 0.52 * fwd) - fwd * 0.2;
    // flatten the crown
    if (v.y > 0.55) v.y = 0.55 + (v.y - 0.55) * 0.55;
    // brow ridge over the eyes
    const brow = smoothstep(0.1, 0.55, v.y) * smoothstep(-0.1, 0.55, v.z) * (1 - fwd * 0.8);
    v.y += brow * 0.1; v.z += brow * 0.07;
    // cheek flares
    const cheek = smoothstep(0.35, -0.35, v.y) * (1 - fwd) * smoothstep(0.1, 0.8, Math.abs(v.x));
    v.x *= 1 + cheek * 0.3;
    // cut the underside flat where the jaw hinges
    if (v.y < -0.3) v.y = -0.3 + (v.y + 0.3) * 0.52;
    // narrow the back of the skull
    const back = smoothstep(-0.2, -1.0, v.z);
    v.x *= 1 - 0.18 * back; v.y *= 1 - 0.12 * back;
  });
  const skull = new THREE.Mesh(skullGeo, M.fur);
  skull.castShadow = true; skull.receiveShadow = true;
  head.add(skull);

  // cream muzzle wrap and chin
  const snoutGeo = sculpt(new THREE.SphereGeometry(0.52, 20, 14), (v) => {
    const fwd = smoothstep(-0.2, 0.52, v.z);
    v.z += fwd * 0.72;
    v.x *= 1 - 0.5 * fwd;
    v.y *= 1 - 0.42 * fwd;
    if (v.y < -0.1) v.y = -0.1 + (v.y + 0.1) * 0.6;
  });
  const snout = new THREE.Mesh(snoutGeo, M.cream);
  snout.position.set(0, -0.3, 0.86);
  snout.castShadow = true;
  head.add(snout);

  // dark bridge stripe along the top of the muzzle
  const bridge = new THREE.Mesh(
    sculpt(new THREE.SphereGeometry(0.3, 14, 10), (v) => { v.z *= 2.5; v.y *= 0.42; v.x *= 0.72; }),
    M.furDeep
  );
  bridge.position.set(0, 0.08, 1.12);
  head.add(bridge);

  // nose leather, with nostril dimples
  const noseGeo = sculpt(new THREE.SphereGeometry(0.2, 18, 14), (v) => {
    v.y *= 0.78; v.z *= 0.8;
    if (v.z > 0.05 && v.y < 0.02 && Math.abs(v.x) > 0.06 && Math.abs(v.x) < 0.16) v.z -= 0.07;
  });
  const nose = new THREE.Mesh(noseGeo, M.nose);
  nose.position.set(0, -0.2, 1.98);
  nose.castShadow = true;
  head.add(nose);

  /* ---------- the jaw (the part that lip-syncs) ----------------------- */
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.42, 0.28);
  head.add(jaw);

  const jawGeo = sculpt(new THREE.SphereGeometry(0.46, 20, 14), (v) => {
    const fwd = smoothstep(-0.2, 0.46, v.z);
    v.z += fwd * 1.0;
    v.x *= 1 - 0.56 * fwd;
    v.y *= 0.56 * (1 - 0.35 * fwd);
    if (v.y > 0.0) v.y *= 0.35;                    // flat top: the mouth line
  });
  const lowerJaw = new THREE.Mesh(jawGeo, M.cream);
  lowerJaw.position.set(0, -0.04, 0.52);
  lowerJaw.castShadow = true;
  jaw.add(lowerJaw);

  // dark mouth cavity so an open mouth reads as depth, not a gap
  const cavity = new THREE.Mesh(
    sculpt(new THREE.SphereGeometry(0.36, 14, 10), (v) => { v.z *= 1.9; v.y *= 0.62; }),
    M.black
  );
  cavity.position.set(0, 0.08, 0.72);
  jaw.add(cavity);

  // tongue
  const tongue = new THREE.Mesh(
    sculpt(new THREE.SphereGeometry(0.2, 14, 10), (v) => { v.z *= 2.3; v.y *= 0.3; v.x *= 0.85; }),
    M.tongue
  );
  tongue.position.set(0, 0.0, 0.86);
  jaw.add(tongue);

  // teeth: upper canines fixed to the skull, lower ones to the jaw
  const fang = (x, y, z, h, flip, parentObj) => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(0.045, h, 5), M.cream);
    f.position.set(x, y, z);
    if (flip) f.rotation.x = Math.PI;
    parentObj.add(f);
  };
  [-1, 1].forEach((s) => {
    fang(0.17 * s, -0.42, 1.42, 0.19, true, head);
    fang(0.09 * s, -0.40, 1.72, 0.1, true, head);
    fang(0.15 * s, 0.1, 1.2, 0.15, false, jaw);
  });

  /* ---------- eyes ---------------------------------------------------- */
  const eyeRigs = [];
  [-1, 1].forEach((s) => {
    const rig = new THREE.Group();
    rig.position.set(0.46 * s, 0.26, 0.6);
    rig.rotation.y = 0.32 * s;
    head.add(rig);

    // dark eye-patch markings
    const patch = new THREE.Mesh(
      sculpt(new THREE.SphereGeometry(0.3, 12, 9), (v) => { v.z *= 0.3; v.y *= 0.72; }),
      M.furShade
    );
    patch.position.z = 0.02;
    rig.add(patch);

    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 18), M.sclera);
    globe.position.z = 0.1;
    rig.add(globe);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.155, 20, 16), M.iris);
    iris.position.z = 0.085;
    iris.scale.set(1, 1, 0.5);
    globe.add(iris);

    // vertical slit pupil — a fox, not a dog
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 12), M.black);
    pupil.scale.set(0.3, 1.0, 0.4);
    pupil.position.z = 0.1;
    globe.add(pupil);

    // specular catchlight, which is most of what makes an eye look alive
    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff6e0 })
    );
    glint.position.set(-0.07 * s, 0.07, 0.17);
    globe.add(glint);

    // eyelid: a hemisphere that rotates down to blink
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.215, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      M.fur
    );
    lid.position.z = 0.1;
    rig.add(lid);

    const lowLid = new THREE.Mesh(
      new THREE.SphereGeometry(0.212, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      M.fur
    );
    lowLid.position.z = 0.1;
    lowLid.rotation.x = Math.PI;
    rig.add(lowLid);

    eyeRigs.push({ rig, globe, lid, lowLid, iris, pupil, side: s });
  });

  // brow tufts, which give him an expression
  const brows = [];
  [-1, 1].forEach((s) => {
    const b = new THREE.Mesh(
      sculpt(new THREE.SphereGeometry(0.17, 10, 8), (v) => { v.x *= 1.9; v.y *= 0.4; v.z *= 0.55; }),
      M.furDeep
    );
    b.position.set(0.47 * s, 0.56, 0.52);
    b.rotation.z = -0.2 * s;
    head.add(b);
    brows.push(b);
  });

  /* ---------- ears ---------------------------------------------------- */
  const earShape = () => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.42, 0);
    sh.quadraticCurveTo(-0.34, 0.75, 0, 1.18);
    sh.quadraticCurveTo(0.34, 0.75, 0.42, 0);
    sh.quadraticCurveTo(0, -0.16, -0.42, 0);
    return sh;
  };

  const ears = [];
  [-1, 1].forEach((s) => {
    const ear = new THREE.Group();
    ear.position.set(0.56 * s, 0.76, -0.16);
    ear.rotation.z = -0.3 * s;
    ear.rotation.y = 0.3 * s;
    ear.rotation.x = -0.12;
    head.add(ear);

    const outerGeo = new THREE.ExtrudeGeometry(earShape(), {
      depth: 0.16, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2, curveSegments: 7
    });
    outerGeo.center();
    sculpt(outerGeo, (v) => { v.z *= 1 - 0.3 * smoothstep(-0.2, 0.6, v.y); });
    const outer = new THREE.Mesh(outerGeo, M.fur);
    outer.position.y = 0.52;
    outer.castShadow = true;
    ear.add(outer);

    const innerGeo = new THREE.ExtrudeGeometry(earShape(), {
      depth: 0.08, bevelEnabled: false, curveSegments: 6
    });
    innerGeo.center();
    const inner = new THREE.Mesh(innerGeo, M.furShade);
    inner.scale.set(0.66, 0.74, 1);
    inner.position.set(0, 0.5, 0.14);
    ear.add(inner);

    // pale inner-ear fuzz
    for (let i = 0; i < 4; i++) {
      const fz = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.2, 4), M.cream);
      fz.position.set((-0.12 + i * 0.08) * 1, 0.3 + (i % 2) * 0.1, 0.18);
      fz.rotation.z = (i - 1.5) * 0.25;
      ear.add(fz);
    }

    // black tip
    const tip = new THREE.Mesh(
      sculpt(new THREE.ConeGeometry(0.2, 0.42, 6), (v) => { v.z *= 0.5; }),
      M.black
    );
    tip.position.y = 1.0;
    ear.add(tip);

    ears.push(ear);
  });

  /* ---------- whiskers ------------------------------------------------ */
  [-1, 1].forEach((s) => {
    for (let i = 0; i < 3; i++) {
      const len = 0.78 - i * 0.08;
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.003, len, 4), M.whisker);
      w.position.set(0.17 * s, -0.26 - i * 0.09, 1.72);
      w.rotation.z = Math.PI / 2 * s * 0.82 + (i - 1) * 0.05 * s;
      w.rotation.x = -0.2;
      w.translateY(len / 2);
      head.add(w);
    }
  });

  /* ---------- cheek ruff tufts ---------------------------------------- */
  [-1, 1].forEach((s) => {
    for (let i = 0; i < 4; i++) {
      const t = tuft(
        0.86 * s, -0.12 - i * 0.2, 0.3 - i * 0.12,
        0.42 + i * 0.05,
        [0.2, 0, (1.0 + i * 0.18) * s],
        i % 2 ? M.cream : M.creamDim
      );
      head.add(t);
    }
  });

  /* ---------- the sigil rings behind him ------------------------------ */
  const ringMat = (op) => new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, opacity: op });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.012, 6, 120), ringMat(0.4));
  ring.position.z = -2.2; scene.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.01, 6, 6), ringMat(0.3));
  ring2.position.z = -2.15; scene.add(ring2);
  const ring3 = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.01, 6, 3), ringMat(0.22));
  ring3.position.z = -2.1; scene.add(ring3);

  // soft ground shadow catcher
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(4, 32),
    new THREE.ShadowMaterial({ opacity: 0.35 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -3.3;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ----------------------------------------------------------- sizing */
  const resize = () => {
    const w = mount.clientWidth || 320;
    const h = mount.clientHeight || Math.round(w * 0.95);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

  /* ----------------------------------------------------------- state */
  let speaking = false;
  let jawNow = 0, jawTarget = 0;
  let viseme = 0.5, visemeT = 0;     // mouth shape varies per syllable
  let emphasis = 0;                  // kicked on each spoken word boundary
  let blinkTimer = 1.5 + Math.random() * 3, blink = 0;
  let earPerk = 0;
  const pointer = { x: 0, y: 0, active: false };

  mount.addEventListener("pointermove", (e) => {
    const r = mount.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    pointer.active = true;
  });
  mount.addEventListener("pointerleave", () => { pointer.active = false; });
  mount.addEventListener("click", () => { earPerk = 1; blink = 1; });

  /* ----------------------------------------------------------- loop */
  const clock = new THREE.Clock();
  let last = 0;

  const animate = () => {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const dt = Math.min(t - last, 0.05); last = t;

    if (!reduceMotion) {
      // breathing through the chest and a slight bob
      const breath = Math.sin(t * 1.05);
      chest.scale.set(1 + breath * 0.018, 1 + breath * 0.012, 1 + breath * 0.02);
      fox.position.y = -0.25 + Math.sin(t * 0.95) * 0.035;
      neck.rotation.z = Math.sin(t * 0.47) * 0.03;

      // tail: a travelling wave down the segments
      tail.rotation.z = 0.9 + Math.sin(t * 0.8) * 0.14;
      tailSegs.forEach((seg, i) => {
        seg.rotation.z = Math.sin(t * 1.1 - i * 0.5) * (0.07 + i * 0.012);
        seg.rotation.x = Math.cos(t * 0.75 - i * 0.4) * 0.04;
      });

      ring.rotation.z = t * 0.05;
      ring2.rotation.z = -t * 0.08;
      ring3.rotation.z = t * 0.11;

      // ears: idle drift, occasional flick, perked while he is speaking
      earPerk += ((speaking ? 0.5 : 0) - earPerk) * 0.05;
      ears.forEach((ear, i) => {
        const s = i === 0 ? -1 : 1;
        const flick = (Math.sin(t * 9.1 + i * 3) > 0.993) ? 0.22 : 0;
        ear.rotation.z = (-0.3 + earPerk * 0.1) * s + (Math.sin(t * 1.21 + i * 2) * 0.025 + flick) * s;
        ear.rotation.x = -0.12 - earPerk * 0.1 + Math.sin(t * 0.9 + i) * 0.02;
      });
    }

    // gaze: follow the cursor, otherwise glance about slowly
    const tx = pointer.active ? pointer.x * 0.36 : Math.sin(t * 0.31) * 0.12;
    const ty = pointer.active ? pointer.y * 0.22 : Math.cos(t * 0.24) * 0.07;
    head.rotation.y += (tx - head.rotation.y) * 0.055;
    head.rotation.x += (ty * 0.55 - head.rotation.x) * 0.055;
    neck.rotation.y += (tx * 0.35 - neck.rotation.y) * 0.03;
    eyeRigs.forEach((e) => {
      e.globe.rotation.y = -tx * 0.35;
      e.globe.rotation.x = ty * 0.28;
    });

    // blinking — fast close, slower open
    blinkTimer -= dt;
    if (blinkTimer <= 0) { blink = 1; blinkTimer = 2.2 + Math.random() * 5; }
    if (blink > 0) blink = Math.max(0, blink - dt * 6.5);
    const closed = Math.sin(blink * Math.PI);
    eyeRigs.forEach((e) => {
      e.lid.rotation.x = closed * 1.95;
      e.lowLid.rotation.x = Math.PI - closed * 1.5;
    });

    // brows lift a little while he talks
    brows.forEach((b, i) => {
      const target = 0.56 + (speaking ? 0.05 + emphasis * 0.05 : 0) + Math.sin(t * 0.6 + i) * 0.006;
      b.position.y += (target - b.position.y) * 0.1;
    });

    /* ---- lip sync ---- */
    if (speaking) {
      visemeT -= dt;
      if (visemeT <= 0) {               // change mouth shape at syllable rate
        viseme = 0.25 + Math.random() * 0.75;
        visemeT = 0.075 + Math.random() * 0.1;
      }
      emphasis = Math.max(0, emphasis - dt * 3.2);
      const env = 0.45 + 0.55 * Math.abs(Math.sin(t * 6.2));
      jawTarget = 0.05 + 0.44 * viseme * env + emphasis * 0.12;
      // the muzzle widens slightly on open vowels
      snout.scale.x = 1 + jawNow * 0.1;
      tongue.position.y = -0.02 - jawNow * 0.08;
    } else {
      emphasis = 0;
      jawTarget = 0.012 + Math.sin(t * 0.9) * 0.008;   // soft resting breath
      snout.scale.x += (1 - snout.scale.x) * 0.1;
    }
    jawNow += (jawTarget - jawNow) * 0.38;
    jaw.rotation.x = jawNow;
    cavity.scale.y = 1 + jawNow * 1.9;

    renderer.render(scene, camera);
  };
  animate();

  /* ======================================================== the voice */
  const synth = window.speechSynthesis;
  const canSpeak = !!synth && typeof SpeechSynthesisUtterance === "function";
  let chosenVoice = null;

  const BRITISH_MALE = [
    "daniel", "arthur", "oliver", "george", "ryan", "thomas", "jamie",
    "google uk english male", "microsoft george", "microsoft ryan",
    "en-gb-language", "british"
  ];
  const FEMALE_HINT = /female|zira|hazel|susan|kate|serena|fiona|martha|amelie|libby|sonia|moira|karen|tessa/i;

  const pickVoice = () => {
    if (!canSpeak) return null;
    const voices = synth.getVoices();
    if (!voices.length) return null;
    const gb = voices.filter((v) => /^en[-_]GB/i.test(v.lang));
    const byName = (list) => list.find((v) => BRITISH_MALE.some((n) => v.name.toLowerCase().includes(n)));
    chosenVoice =
      byName(gb) || byName(voices) ||
      gb.find((v) => !FEMALE_HINT.test(v.name)) || gb[0] ||
      voices.find((v) => /^en/i.test(v.lang) && !FEMALE_HINT.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang)) || voices[0] || null;
    return chosenVoice;
  };

  const readyLine = () => {
    if (!canSpeak) return "No speech synthesiser here — the fox will mouth the words silently.";
    if (!chosenVoice) return "Ready. Ask the oracle and the fox will read the answer aloud.";
    return /^en[-_]GB/i.test(chosenVoice.lang)
      ? `Ready — speaking as ${chosenVoice.name}, British English.`
      : `Ready — no British voice is installed on this device, so ${chosenVoice.name} stands in.`;
  };

  if (canSpeak) {
    pickVoice();
    synth.addEventListener?.("voiceschanged", () => { pickVoice(); if (!speaking) setStatus(readyLine()); });
  }
  setStatus(readyLine());

  const chunk = (text, max = 210) => {
    const sentences = String(text).replace(/\s+/g, " ")
      .replace(/([.!?…])\s+/g, "$1\u0000").split("\u0000").filter(Boolean);
    const out = []; let buf = "";
    for (const s of sentences) {
      if ((buf + " " + s).trim().length > max) { if (buf) out.push(buf.trim()); buf = s; }
      else buf = (buf + " " + s).trim();
    }
    if (buf) out.push(buf.trim());
    return out;
  };

  let queue = [], muted = false, lastText = "", silentTimer = null;

  const stop = () => {
    queue = []; speaking = false;
    clearTimeout(silentTimer);
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
    const u = new SpeechSynthesisUtterance(queue.shift());
    if (chosenVoice) { u.voice = chosenVoice; u.lang = chosenVoice.lang; } else u.lang = "en-GB";
    u.rate = 0.95; u.pitch = 0.86; u.volume = 1;
    u.onstart = () => { speaking = true; };
    u.onboundary = () => { emphasis = 1; };     // real word-level lip sync
    u.onend = sayNext;
    u.onerror = sayNext;
    synth.speak(u);
  };

  const speak = (text) => {
    if (!text) return;
    lastText = text;
    if (btnSpeak) btnSpeak.disabled = false;
    if (muted) return;

    if (!canSpeak) {
      speaking = true;
      setStatus("Mouthing the answer — this device has no speech synthesiser.");
      clearTimeout(silentTimer);
      silentTimer = setTimeout(() => { speaking = false; setStatus(readyLine()); },
        Math.min(45000, 55 * text.length));
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

  btnSpeak?.addEventListener("click", () => {
    speak(lastText || (
      "I am the order's familiar. Ask the oracle a question and I will read its answer aloud. " +
      "Everything I say was written in advance by the order and graded by its rules on evidence. " +
      "Test everything kindly."
    ));
  });
  btnStop?.addEventListener("click", stop);
  if (btnStop) btnStop.disabled = true;
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });

  window.EGFox = {
    speak, stop, available: true,
    get muted() { return muted; },
    set muted(v) { muted = !!v; if (muted) stop(); }
  };

  if (window.__EG_PENDING_SPEECH__) {
    speak(window.__EG_PENDING_SPEECH__);
    window.__EG_PENDING_SPEECH__ = "";
  }
})();
