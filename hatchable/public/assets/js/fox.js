/* ===========================================================================
   EGregoRA — the Oracle's familiar, second sculpt.

   A fox built entirely in code and shaded for realism rather than for charm:

     · procedurally generated fur, roughness and hair-alpha textures, drawn
       on canvases at load — no image files, no CDN assets beyond three.js
     · eight-layer shell fur over the skull, cheeks, chest and tail, so the
       silhouette breaks up into hair instead of ending at a hard edge
     · MeshPhysicalMaterial with sheen, which is what makes fur read as fur
       under a rim light, plus a generated environment map for soft
       image-based lighting
     · a wet clearcoat nose, a layered eye (sclera, striated iris, slit
       pupil, refracting cornea, catchlight) and curved tube whiskers
     · anatomy by vertex deformation: a true tapering muzzle, brow ridge,
       zygomatic flare, hinged jaw, neck and withers

   He breathes, blinks asymmetrically, flicks and swivels his ears, tracks
   the cursor with head, neck and eyes separately, swishes a seven-segment
   tail, and lip-syncs to the browser's speech synthesiser.

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
    fur:      0xb4571f,
    furWarm:  0xd2792f,
    furDeep:  0x8c3d12,
    furShade: 0x5e2a10,
    cream:    0xf2e6d2,
    creamDim: 0xd9c6a8,
    black:    0x17100d,
    gold:     0xd7b05a,
    iris:     0xdca845,
    tongue:   0xbb6a74
  };

  /* ------------------------------------------------------- canvas textures */

  const makeCanvas = (w, h) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    return c;
  };

  const asTexture = (canvas, { srgb = false, repeat = 1 } = {}) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.anisotropy = 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };

  /* A seamless-ish hair field: thousands of short tapered strokes.
     Used as the colour variation map and, in a monochrome variant, as the
     alpha map that cuts the fur shells into individual hairs. */
  const hairCanvas = (w, h, { strokes, light, dark, bg, alpha }) => {
    const c = makeCanvas(w, h);
    const g = c.getContext("2d");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < strokes; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const len = 4 + Math.random() * 16;
      const a = (-Math.PI / 2) + (Math.random() - 0.5) * 0.8;
      const t = Math.random();
      g.strokeStyle = alpha
        ? `rgba(255,255,255,${0.35 + t * 0.65})`
        : (t > 0.5 ? light : dark);
      g.globalAlpha = alpha ? 1 : 0.14 + Math.random() * 0.3;
      g.lineWidth = alpha ? 0.8 + Math.random() * 1.6 : 0.6 + Math.random() * 1.4;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.stroke();
      // wrap the stroke round the edges so the tile does not seam badly
      if (x < 20 || x > w - 20) {
        const wx = x < 20 ? x + w : x - w;
        g.beginPath(); g.moveTo(wx, y); g.lineTo(wx + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke();
      }
    }
    g.globalAlpha = 1;
    return c;
  };

  const furMap     = asTexture(hairCanvas(512, 512, { strokes: 5200, light: "#e8914a", dark: "#7a3410", bg: "#b4571f" }), { srgb: true, repeat: 3 });
  const creamMap   = asTexture(hairCanvas(512, 512, { strokes: 4200, light: "#fffaf0", dark: "#c3ad8c", bg: "#f2e6d2" }), { srgb: true, repeat: 3 });
  const hairAlpha  = asTexture(hairCanvas(512, 512, { strokes: 9000, bg: "#000000", alpha: true }), { repeat: 4 });

  /* A roughness map so the coat is not uniformly matte — guard hairs catch
     light, undercoat does not. */
  const roughCanvas = (() => {
    const c = makeCanvas(256, 256);
    const g = c.getContext("2d");
    g.fillStyle = "#b8b8b8";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const v = 120 + Math.floor(Math.random() * 110);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 6);
    }
    return c;
  })();
  const roughMap = asTexture(roughCanvas, { repeat: 3 });

  /* Iris: radial striations, a darker limbal ring, a bright inner flare. */
  const irisTex = (() => {
    const c = makeCanvas(256, 256);
    const g = c.getContext("2d");
    const cx = 128, cy = 128;
    const grad = g.createRadialGradient(cx, cy, 10, cx, cy, 128);
    grad.addColorStop(0, "#f6d479");
    grad.addColorStop(0.45, "#d79e36");
    grad.addColorStop(0.82, "#9c6615");
    grad.addColorStop(1, "#3a2206");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 260; i++) {
      const a = Math.random() * Math.PI * 2;
      const r0 = 18 + Math.random() * 26;
      const r1 = 70 + Math.random() * 54;
      g.strokeStyle = Math.random() > 0.5 ? "rgba(255,232,166,0.30)" : "rgba(60,34,6,0.34)";
      g.lineWidth = 0.6 + Math.random() * 2.2;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      g.stroke();
    }
    g.strokeStyle = "rgba(24,14,4,0.75)";
    g.lineWidth = 16;
    g.beginPath(); g.arc(cx, cy, 120, 0, Math.PI * 2); g.stroke();
    return c;
  })();
  const irisMap = asTexture(irisTex, { srgb: true });
  irisMap.wrapS = irisMap.wrapT = THREE.ClampToEdgeWrapping;
  irisMap.repeat.set(1, 1);

  /* ----------------------------------------------------------- materials */
  const physical = (o) => new THREE.MeshPhysicalMaterial({
    roughness: 0.92, metalness: 0, sheen: 1, sheenRoughness: 0.72, ...o
  });

  const M = {
    fur: physical({
      color: 0xffffff, map: furMap, roughnessMap: roughMap,
      sheenColor: new THREE.Color(0xffc98a)
    }),
    furDeep: physical({
      color: C.furDeep, roughnessMap: roughMap, roughness: 0.95,
      sheenColor: new THREE.Color(0xd79a60)
    }),
    furShade: physical({ color: C.furShade, roughness: 0.96, sheen: 0.7 }),
    cream: physical({
      color: 0xffffff, map: creamMap, roughnessMap: roughMap,
      sheenColor: new THREE.Color(0xfff3dd)
    }),
    creamDim: physical({ color: C.creamDim, roughness: 0.95, sheenColor: new THREE.Color(0xfff1d6) }),
    black: physical({ color: C.black, roughness: 0.62, sheen: 0.5 }),
    nose: new THREE.MeshPhysicalMaterial({
      color: 0x241614, roughness: 0.22, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.08
    }),
    tongue: new THREE.MeshPhysicalMaterial({
      color: C.tongue, roughness: 0.34, clearcoat: 0.8, clearcoatRoughness: 0.25
    }),
    mouth: new THREE.MeshStandardMaterial({ color: 0x1b0c0c, roughness: 0.6 }),
    iris: new THREE.MeshStandardMaterial({
      map: irisMap, roughness: 0.3, metalness: 0.1,
      emissiveMap: irisMap, emissive: 0xffffff, emissiveIntensity: 0.18
    }),
    sclera: new THREE.MeshStandardMaterial({ color: 0x6d5a46, roughness: 0.42 }),
    cornea: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.02, metalness: 0,
      transmission: 0.96, thickness: 0.22, ior: 1.38,
      clearcoat: 1, clearcoatRoughness: 0.02, transparent: true
    }),
    tooth: new THREE.MeshPhysicalMaterial({ color: 0xf6efe0, roughness: 0.3, clearcoat: 0.6 }),
    whisker: new THREE.MeshStandardMaterial({
      color: 0xf4ead8, roughness: 0.4, transparent: true, opacity: 0.62
    })
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

  /* --- shell fur -------------------------------------------------------
     The classic technique: stack N copies of the surface, each pushed a
     little further out along its own normals, each masked by a hair-alpha
     texture whose threshold rises with height. The eye integrates the
     stack into a coat with depth and a soft, broken silhouette. */
  const SHELLS = 8;
  const furShells = (mesh, {
    depth = 0.075, tint = 0xffffff, map = furMap, shells = SHELLS, tipDark = 0.55
  } = {}) => {
    const base = mesh.geometry;
    const pos = base.attributes.position;
    const nor = base.attributes.normal;
    const group = new THREE.Group();

    for (let s = 1; s <= shells; s++) {
      const f = s / shells;
      const geo = base.clone();
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        p.setXYZ(
          i,
          pos.getX(i) + nor.getX(i) * depth * f,
          pos.getY(i) + nor.getY(i) * depth * f,
          pos.getZ(i) + nor.getZ(i) * depth * f
        );
      }
      p.needsUpdate = true;

      const col = new THREE.Color(tint).multiplyScalar(1 - tipDark * f * f);
      const mat = new THREE.MeshPhysicalMaterial({
        color: col, map, alphaMap: hairAlpha,
        transparent: true, alphaTest: 0.06 + 0.5 * f,
        depthWrite: false, roughness: 0.95, metalness: 0,
        sheen: 1, sheenRoughness: 0.6,
        sheenColor: new THREE.Color(0xffd3a0),
        side: THREE.DoubleSide
      });
      const shell = new THREE.Mesh(geo, mat);
      shell.renderOrder = s;
      group.add(shell);
    }
    mesh.add(group);
    return group;
  };

  /* ----------------------------------------------------------- scene */
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0810, 7.5, 16);

  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
  camera.position.set(0.1, 0.1, 7.0);
  camera.lookAt(0, -0.08, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (err) {
    mount.classList.add("fox-stage--failed");
    setStatus("The familiar cannot be drawn here — this browser has no WebGL. The written answer stands on its own.");
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.appendChild(renderer.domElement);

  /* Image-based lighting from a generated equirectangular gradient: a warm
     sky above, a violet floor below, one soft lamp. This is most of the
     difference between "plastic" and "photographed". */
  try {
    const envC = makeCanvas(512, 256);
    const g = envC.getContext("2d");
    const sky = g.createLinearGradient(0, 0, 0, 256);
    sky.addColorStop(0, "#ffe6bd");
    sky.addColorStop(0.42, "#6b5a6e");
    sky.addColorStop(0.62, "#2a2030");
    sky.addColorStop(1, "#140f1c");
    g.fillStyle = sky; g.fillRect(0, 0, 512, 256);
    const lamp = g.createRadialGradient(130, 70, 4, 130, 70, 78);
    lamp.addColorStop(0, "#fffdf4"); lamp.addColorStop(1, "rgba(255,245,220,0)");
    g.fillStyle = lamp; g.fillRect(0, 0, 512, 256);
    const cool = g.createRadialGradient(400, 120, 4, 400, 120, 96);
    cool.addColorStop(0, "#b9c9ff"); cool.addColorStop(1, "rgba(150,170,255,0)");
    g.fillStyle = cool; g.fillRect(0, 0, 512, 256);

    const envTex = new THREE.CanvasTexture(envC);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    envTex.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    scene.environment = pmrem.fromEquirectangular(envTex).texture;
    scene.environmentIntensity = 0.9;
    envTex.dispose();
    pmrem.dispose();
  } catch (e) { /* IBL is an enhancement, not a requirement */ }

  scene.add(new THREE.HemisphereLight(0xffe9c4, 0x1a1420, 0.35));

  const key = new THREE.DirectionalLight(0xffd9a4, 2.4);
  key.position.set(3.0, 4.2, 4.0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1; key.shadow.camera.far = 22;
  key.shadow.camera.left = -4.5; key.shadow.camera.right = 4.5;
  key.shadow.camera.top = 4.5; key.shadow.camera.bottom = -4.5;
  key.shadow.bias = -0.0012;
  key.shadow.radius = 2.4;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xa8c0ff, 2.6);
  rim.position.set(-3.4, 2.2, -3.6);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xffcf9a, 0.5);
  fill.position.set(-2.4, -0.6, 3.4);
  scene.add(fill);

  const bounce = new THREE.PointLight(C.gold, 1.5, 15, 2);
  bounce.position.set(0, -2.2, 2.8);
  scene.add(bounce);

  /* ======================================================== the fox */
  const fox = new THREE.Group();
  fox.position.y = -0.25;
  scene.add(fox);

  /* ---------- body / chest bust -------------------------------------- */
  const body = new THREE.Group();
  fox.add(body);

  const chestGeo = sculpt(new THREE.SphereGeometry(1.25, 48, 36), (v) => {
    v.y *= 1.1;
    v.z *= 0.88;
    const up = smoothstep(0.1, 1.2, v.y);
    v.x *= 1 - 0.47 * up;
    v.z *= 1 - 0.43 * up;
    // withers: a ridge over the shoulders rather than a smooth dome
    const wit = smoothstep(0.35, 0.95, v.y) * smoothstep(0.2, -0.8, v.z);
    v.y += wit * 0.16;
    const sh = smoothstep(0.6, -0.4, v.y);
    v.x *= 1 + 0.22 * sh;
    // the barrel of the ribcage is deeper than it is wide
    v.z *= 1 + 0.08 * smoothstep(0.4, -0.6, v.y) * smoothstep(0, 1, v.z);
    if (v.y < -0.85) v.y = -0.85 - (v.y + 0.85) * 0.25;
  });
  const chest = new THREE.Mesh(chestGeo, M.fur);
  chest.position.y = -1.74;
  chest.castShadow = true; chest.receiveShadow = true;
  body.add(chest);
  furShells(chest, { depth: 0.1, tint: 0xffffff, tipDark: 0.5 });

  // cream bib down the front
  const bibGeo = sculpt(new THREE.SphereGeometry(1.1, 36, 26), (v) => {
    v.y *= 1.12; v.z *= 0.55;
    const up = smoothstep(0.0, 1.2, v.y);
    v.x *= 1 - 0.52 * up;
  });
  const bib = new THREE.Mesh(bibGeo, M.cream);
  bib.position.set(0, -1.84, 0.56);
  bib.scale.set(0.78, 0.92, 1);
  bib.castShadow = true;
  body.add(bib);
  furShells(bib, { depth: 0.085, map: creamMap, tipDark: 0.3 });

  // shoulder and ruff tufts
  const tuft = (x, y, z, s, rot, matl) => {
    const g = sculpt(new THREE.ConeGeometry(0.3, 0.98, 6, 3), (v) => {
      v.z *= 0.45;
      v.x += Math.sin(v.y * 3.0) * 0.04;
    });
    const m = new THREE.Mesh(g, matl);
    m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.set(rot[0], rot[1], rot[2]);
    m.castShadow = true;
    return m;
  };
  for (let i = 0; i < 15; i++) {
    const a = (i / 14) * Math.PI - Math.PI / 2;
    const r = 1.02;
    body.add(tuft(
      Math.sin(a) * r * 1.1, -1.0 + Math.cos(a) * 0.1, Math.cos(a) * r * 0.62,
      0.46 + 0.2 * Math.cos(a),
      [0.5 + 0.15 * Math.cos(a), 0, -Math.sin(a) * 0.95],
      i % 3 === 0 ? M.creamDim : M.furDeep
    ));
  }

  /* ---------- the tail ------------------------------------------------ */
  const tail = new THREE.Group();
  tail.position.set(-0.98, -2.28, -0.58);
  body.add(tail);

  const tailSegs = [];
  let parent = tail;
  for (let i = 0; i < 7; i++) {
    const seg = new THREE.Group();
    seg.position.y = i === 0 ? 0 : 0.46;
    const r = 0.47 - i * 0.042;
    const g = sculpt(new THREE.SphereGeometry(r, 20, 16), (v) => { v.y *= 1.26; v.z *= 0.94; });
    const mesh = new THREE.Mesh(g, i >= 5 ? M.cream : M.fur);
    mesh.castShadow = true;
    furShells(mesh, {
      depth: 0.13, shells: 6,
      map: i >= 5 ? creamMap : furMap,
      tint: i >= 5 ? 0xffffff : 0xffffff,
      tipDark: i >= 5 ? 0.25 : 0.45
    });
    seg.add(mesh);
    parent.add(seg);
    parent = seg;
    tailSegs.push(seg);
  }
  tail.rotation.z = 0.92;
  tail.rotation.x = -0.3;

  /* ---------- the head ------------------------------------------------ */
  const neck = new THREE.Group();
  neck.position.y = -0.5;
  fox.add(neck);

  const head = new THREE.Group();
  neck.add(head);

  /* The skull: a sphere pulled forward into a wedge muzzle, flattened on
     top, with a brow ridge, zygomatic flare and an occipital taper. */
  const skullGeo = sculpt(new THREE.SphereGeometry(1.0, 64, 48), (v) => {
    const fwd = smoothstep(0.08, 1.0, v.z);
    v.z += fwd * fwd * 1.18;
    v.x *= 1 - 0.68 * fwd;
    v.y = v.y * (1 - 0.54 * fwd) - fwd * 0.2;
    // flatten the crown and dish the forehead slightly
    if (v.y > 0.55) v.y = 0.55 + (v.y - 0.55) * 0.52;
    const dish = smoothstep(0.1, 0.7, v.y) * smoothstep(0.9, 0.2, v.z);
    v.z -= dish * 0.05;
    // brow ridge over the eyes
    const brow = smoothstep(0.08, 0.5, v.y) * smoothstep(-0.1, 0.55, v.z) * (1 - fwd * 0.8);
    v.y += brow * 0.11; v.z += brow * 0.08;
    // zygomatic (cheekbone) flare
    const cheek = smoothstep(0.3, -0.35, v.y) * (1 - fwd) * smoothstep(0.1, 0.8, Math.abs(v.x));
    v.x *= 1 + cheek * 0.33;
    // a shallow stop where muzzle meets forehead
    const stop = Math.exp(-Math.pow((v.z - 0.72) / 0.16, 2)) * smoothstep(0.0, 0.5, v.y);
    v.y -= stop * 0.05;
    if (v.y < -0.3) v.y = -0.3 + (v.y + 0.3) * 0.5;
    const back = smoothstep(-0.2, -1.0, v.z);
    v.x *= 1 - 0.2 * back; v.y *= 1 - 0.14 * back;
  });
  const skull = new THREE.Mesh(skullGeo, M.fur);
  skull.castShadow = true; skull.receiveShadow = true;
  head.add(skull);
  furShells(skull, { depth: 0.062, tipDark: 0.48 });

  // cream muzzle wrap and chin
  const snoutGeo = sculpt(new THREE.SphereGeometry(0.52, 36, 26), (v) => {
    const fwd = smoothstep(-0.2, 0.52, v.z);
    v.z += fwd * 0.74;
    v.x *= 1 - 0.52 * fwd;
    v.y *= 1 - 0.44 * fwd;
    if (v.y < -0.1) v.y = -0.1 + (v.y + 0.1) * 0.58;
  });
  const snout = new THREE.Mesh(snoutGeo, M.cream);
  snout.position.set(0, -0.3, 0.86);
  snout.castShadow = true;
  head.add(snout);
  furShells(snout, { depth: 0.04, map: creamMap, shells: 5, tipDark: 0.28 });

  // dark bridge stripe along the top of the muzzle
  const bridge = new THREE.Mesh(
    sculpt(new THREE.SphereGeometry(0.3, 24, 18), (v) => { v.z *= 2.5; v.y *= 0.4; v.x *= 0.7; }),
    M.furDeep
  );
  bridge.position.set(0, 0.09, 1.14);
  head.add(bridge);

  // nose leather, with a philtrum groove and nostril slits
  const noseGeo = sculpt(new THREE.SphereGeometry(0.21, 36, 28), (v) => {
    v.y *= 0.76; v.z *= 0.82;
    // flatten the front plane
    if (v.z > 0.08) v.z = 0.08 + (v.z - 0.08) * 0.55;
    // nostril dimples
    const nd = Math.exp(-(Math.pow((Math.abs(v.x) - 0.1) / 0.045, 2) + Math.pow((v.y + 0.02) / 0.05, 2)));
    v.z -= nd * 0.085;
    // philtrum down the middle underneath
    if (v.y < -0.04 && Math.abs(v.x) < 0.035) v.z -= 0.03;
  });
  const nose = new THREE.Mesh(noseGeo, M.nose);
  nose.position.set(0, -0.2, 2.0);
  nose.castShadow = true;
  head.add(nose);

  /* ---------- the jaw (the part that lip-syncs) ----------------------- */
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.42, 0.28);
  head.add(jaw);

  const jawGeo = sculpt(new THREE.SphereGeometry(0.46, 36, 26), (v) => {
    const fwd = smoothstep(-0.2, 0.46, v.z);
    v.z += fwd * 1.02;
    v.x *= 1 - 0.57 * fwd;
    v.y *= 0.56 * (1 - 0.35 * fwd);
    if (v.y > 0.0) v.y *= 0.32;
  });
  const lowerJaw = new THREE.Mesh(jawGeo, M.cream);
  lowerJaw.position.set(0, -0.04, 0.52);
  lowerJaw.castShadow = true;
  jaw.add(lowerJaw);
  furShells(lowerJaw, { depth: 0.035, map: creamMap, shells: 4, tipDark: 0.25 });

  // dark mouth cavity so an open mouth reads as depth, not a gap
  const cavity = new THREE.Mesh(
    sculpt(new THREE.SphereGeometry(0.36, 20, 14), (v) => { v.z *= 1.9; v.y *= 0.62; }),
    M.mouth
  );
  cavity.position.set(0, 0.08, 0.72);
  jaw.add(cavity);

  // tongue
  const tongue = new THREE.Mesh(
    sculpt(new THREE.SphereGeometry(0.2, 22, 16), (v) => {
      v.z *= 2.3; v.y *= 0.3; v.x *= 0.85;
      if (Math.abs(v.x) < 0.02 && v.y > 0) v.y -= 0.012;   // the central groove
    }),
    M.tongue
  );
  tongue.position.set(0, 0.0, 0.86);
  jaw.add(tongue);

  // teeth: upper canines and incisors on the skull, lowers on the jaw
  const fang = (x, y, z, h, r, flip, tilt, parentObj) => {
    const g = sculpt(new THREE.ConeGeometry(r, h, 8, 2), (v) => {
      v.z += smoothstep(0, 1, (v.y + h / 2) / h) * 0.012;
    });
    const f = new THREE.Mesh(g, M.tooth);
    f.position.set(x, y, z);
    f.rotation.x = (flip ? Math.PI : 0) + tilt;
    parentObj.add(f);
  };
  [-1, 1].forEach((s) => {
    fang(0.175 * s, -0.42, 1.42, 0.2, 0.048, true, 0.1, head);
    fang(0.095 * s, -0.40, 1.74, 0.1, 0.03, true, 0.06, head);
    fang(0.035 * s, -0.40, 1.80, 0.08, 0.024, true, 0.04, head);
    fang(0.155 * s, 0.1, 1.2, 0.16, 0.042, false, -0.1, jaw);
    fang(0.07 * s, 0.09, 1.38, 0.08, 0.026, false, -0.06, jaw);
  });

  /* ---------- eyes ---------------------------------------------------- */
  const eyeRigs = [];
  [-1, 1].forEach((s) => {
    const rig = new THREE.Group();
    rig.position.set(0.465 * s, 0.26, 0.62);
    rig.rotation.y = 0.33 * s;
    head.add(rig);

    // dark eye-patch marking, almond shaped
    const patch = new THREE.Mesh(
      sculpt(new THREE.SphereGeometry(0.31, 20, 14), (v) => {
        v.z *= 0.28; v.y *= 0.68;
        v.x *= 1 + 0.25 * smoothstep(0.0, -0.3, v.x * s);
      }),
      M.furShade
    );
    patch.position.z = 0.015;
    rig.add(patch);

    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 40, 30), M.sclera);
    globe.position.z = 0.1;
    rig.add(globe);

    // iris as a slightly concave disc, so it catches light like a real one
    const irisGeo = sculpt(new THREE.CircleGeometry(0.155, 48), (v) => {
      v.z -= (1 - (v.x * v.x + v.y * v.y) / 0.024) * 0.016;
    });
    const iris = new THREE.Mesh(irisGeo, M.iris);
    iris.position.z = 0.148;
    globe.add(iris);

    // vertical slit pupil — a fox, not a dog
    const pupil = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 32),
      new THREE.MeshBasicMaterial({ color: 0x080506 })
    );
    pupil.scale.set(0.3, 1.0, 1);
    pupil.position.z = 0.155;
    globe.add(pupil);

    // cornea: a clear bulge over the iris, which is where realism lives
    const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.202, 32, 24), M.cornea);
    cornea.scale.set(1, 1, 1.08);
    globe.add(cornea);

    // two catchlights, one key, one rim
    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.031, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xfffaf0 })
    );
    glint.position.set(-0.07 * s, 0.075, 0.175);
    globe.add(glint);
    const glint2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xcfdcff, transparent: true, opacity: 0.8 })
    );
    glint2.position.set(0.085 * s, -0.05, 0.172);
    globe.add(glint2);

    // lids, furred on the outside
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.222, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2),
      M.fur
    );
    lid.position.z = 0.1;
    rig.add(lid);

    const lowLid = new THREE.Mesh(
      new THREE.SphereGeometry(0.218, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2),
      M.fur
    );
    lowLid.position.z = 0.1;
    lowLid.rotation.x = Math.PI;
    rig.add(lowLid);

    // a fine dark rim round the lid edge
    const liner = new THREE.Mesh(
      new THREE.TorusGeometry(0.205, 0.012, 8, 36),
      new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.55 })
    );
    liner.position.z = 0.135;
    rig.add(liner);

    eyeRigs.push({ rig, globe, lid, lowLid, iris, pupil, side: s });
  });

  // brow tufts, which give him an expression
  const brows = [];
  [-1, 1].forEach((s) => {
    const b = new THREE.Mesh(
      sculpt(new THREE.SphereGeometry(0.17, 18, 12), (v) => { v.x *= 1.9; v.y *= 0.38; v.z *= 0.52; }),
      M.furDeep
    );
    b.position.set(0.47 * s, 0.56, 0.52);
    b.rotation.z = -0.2 * s;
    head.add(b);
    brows.push(b);

    // three long vibrissae above each eye, as real foxes have
    for (let i = 0; i < 3; i++) {
      const h = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.002, 0.34, 4), M.whisker);
      h.position.set((0.4 + i * 0.07) * s, 0.62, 0.5 - i * 0.05);
      h.rotation.z = -0.9 * s;
      h.rotation.x = -0.5;
      h.translateY(0.17);
      head.add(h);
    }
  });

  /* ---------- ears ---------------------------------------------------- */
  const earShape = () => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.42, 0);
    sh.quadraticCurveTo(-0.36, 0.78, 0, 1.2);
    sh.quadraticCurveTo(0.36, 0.78, 0.42, 0);
    sh.quadraticCurveTo(0, -0.16, -0.42, 0);
    return sh;
  };

  const ears = [];
  [-1, 1].forEach((s) => {
    const ear = new THREE.Group();
    ear.position.set(0.56 * s, 0.78, -0.16);
    ear.rotation.z = -0.3 * s;
    ear.rotation.y = 0.3 * s;
    ear.rotation.x = -0.12;
    head.add(ear);

    const outerGeo = new THREE.ExtrudeGeometry(earShape(), {
      depth: 0.16, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.07,
      bevelSegments: 4, curveSegments: 16
    });
    outerGeo.center();
    // cup the ear: thin it towards the tip and curl the edges forward
    sculpt(outerGeo, (v) => {
      v.z *= 1 - 0.34 * smoothstep(-0.2, 0.62, v.y);
      v.z += Math.pow(Math.abs(v.x) / 0.45, 2) * 0.1;
    });
    outerGeo.computeVertexNormals();
    const outer = new THREE.Mesh(outerGeo, M.fur);
    outer.position.y = 0.54;
    outer.castShadow = true;
    ear.add(outer);
    furShells(outer, { depth: 0.035, shells: 5, tipDark: 0.5 });

    const innerGeo = new THREE.ExtrudeGeometry(earShape(), {
      depth: 0.08, bevelEnabled: false, curveSegments: 14
    });
    innerGeo.center();
    const inner = new THREE.Mesh(innerGeo, M.furShade);
    inner.scale.set(0.66, 0.74, 1);
    inner.position.set(0, 0.52, 0.15);
    ear.add(inner);

    // pale inner-ear fuzz, a fringe of fine hairs along the leading edge
    for (let i = 0; i < 12; i++) {
      const fz = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.22 + Math.random() * 0.12, 4), M.cream);
      const u = i / 11;
      fz.position.set((-0.2 + u * 0.4) * 1, 0.2 + Math.sin(u * Math.PI) * 0.42, 0.19);
      fz.rotation.z = (u - 0.5) * 1.1;
      fz.rotation.x = -0.3;
      ear.add(fz);
    }

    // black tip, hair-shelled so the silhouette is soft
    const tipMesh = new THREE.Mesh(
      sculpt(new THREE.ConeGeometry(0.21, 0.44, 12, 3), (v) => { v.z *= 0.52; }),
      M.black
    );
    tipMesh.position.y = 1.02;
    tipMesh.castShadow = true;
    ear.add(tipMesh);
    furShells(tipMesh, { depth: 0.05, shells: 5, tint: 0x3a2a24, map: null, tipDark: 0.3 });

    ears.push(ear);
  });

  /* ---------- whiskers: curved tubes, not straight pins ---------------- */
  [-1, 1].forEach((s) => {
    for (let i = 0; i < 5; i++) {
      const len = 0.9 - i * 0.07;
      const droop = 0.12 + i * 0.07;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(len * 0.35 * s, 0.03, -len * 0.05),
        new THREE.Vector3(len * 0.72 * s, -droop * 0.5, -len * 0.16),
        new THREE.Vector3(len * s, -droop, -len * 0.3)
      ]);
      const w = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.0055, 5, false), M.whisker);
      w.position.set(0.17 * s, -0.24 - i * 0.075, 1.74);
      w.rotation.z = (i - 2) * 0.09 * s;
      w.rotation.y = -0.2 * s;
      head.add(w);
    }
  });

  /* ---------- cheek ruff: the wide vulpine frame ----------------------- */
  [-1, 1].forEach((s) => {
    for (let i = 0; i < 7; i++) {
      const t = tuft(
        0.86 * s, -0.02 - i * 0.14, 0.34 - i * 0.1,
        0.36 + i * 0.04,
        [0.2, 0, (0.9 + i * 0.13) * s],
        i % 2 ? M.cream : M.creamDim
      );
      head.add(t);
    }
  });

  /* ---------- the sigil rings behind him ------------------------------ */
  const ringMat = (op) => new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, opacity: op });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.012, 8, 160), ringMat(0.4));
  ring.position.z = -2.2; scene.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.01, 6, 6), ringMat(0.3));
  ring2.position.z = -2.15; scene.add(ring2);
  const ring3 = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.01, 6, 3), ringMat(0.22));
  ring3.position.z = -2.1; scene.add(ring3);

  // soft ground shadow catcher
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(4.5, 48),
    new THREE.ShadowMaterial({ opacity: 0.38 })
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
  let listening = false;
  let jawNow = 0, jawTarget = 0;
  let viseme = 0.5, visemeT = 0;
  let emphasis = 0;
  let blinkTimer = 1.5 + Math.random() * 3, blink = 0, blinkSkew = 0;
  let earPerk = 0;
  let headTilt = 0;
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
      // breathing: faster and shallower while he talks, as it would be
      const rate = speaking ? 1.7 : 1.05;
      const breath = Math.sin(t * rate);
      chest.scale.set(1 + breath * 0.02, 1 + breath * 0.013, 1 + breath * 0.024);
      fox.position.y = -0.25 + Math.sin(t * 0.95) * 0.035;
      neck.rotation.z = Math.sin(t * 0.47) * 0.03;

      tail.rotation.z = 0.92 + Math.sin(t * 0.8) * 0.15;
      tailSegs.forEach((seg, i) => {
        seg.rotation.z = Math.sin(t * 1.1 - i * 0.5) * (0.07 + i * 0.013);
        seg.rotation.x = Math.cos(t * 0.75 - i * 0.4) * 0.045;
      });

      ring.rotation.z = t * 0.05;
      ring2.rotation.z = -t * 0.08;
      ring3.rotation.z = t * 0.11;

      // ears: idle drift, independent flicks, perked when speaking or listening
      earPerk += (((speaking || listening) ? 0.6 : 0) - earPerk) * 0.05;
      ears.forEach((ear, i) => {
        const s = i === 0 ? -1 : 1;
        const flick = (Math.sin(t * 9.1 + i * 3) > 0.993) ? 0.24 : 0;
        const swivel = listening ? Math.sin(t * 0.9 + i * 1.7) * 0.08 : 0;
        ear.rotation.z = (-0.3 + earPerk * 0.12) * s + (Math.sin(t * 1.21 + i * 2) * 0.025 + flick) * s;
        ear.rotation.x = -0.12 - earPerk * 0.12 + Math.sin(t * 0.9 + i) * 0.02;
        ear.rotation.y = 0.3 * s + swivel * s;
      });
    }

    // a quizzical head tilt while he is being asked something
    headTilt += ((listening ? 0.16 : 0) - headTilt) * 0.04;

    // gaze: head, neck and eyes move on different lags, as real heads do
    const tx = pointer.active ? pointer.x * 0.36 : Math.sin(t * 0.31) * 0.12;
    const ty = pointer.active ? pointer.y * 0.22 : Math.cos(t * 0.24) * 0.07;
    head.rotation.y += (tx - head.rotation.y) * 0.055;
    head.rotation.x += (ty * 0.55 - head.rotation.x) * 0.055;
    head.rotation.z += (headTilt - head.rotation.z) * 0.06;
    neck.rotation.y += (tx * 0.35 - neck.rotation.y) * 0.03;
    eyeRigs.forEach((e) => {
      e.globe.rotation.y = -tx * 0.4;
      e.globe.rotation.x = ty * 0.3;
      // the pupil narrows a little in the key light and widens when he listens
      const target = listening ? 0.42 : 0.3;
      e.pupil.scale.x += (target - e.pupil.scale.x) * 0.05;
    });

    // blinking — fast close, slower open, the two lids very slightly offset
    blinkTimer -= dt;
    if (blinkTimer <= 0) {
      blink = 1; blinkSkew = (Math.random() - 0.5) * 0.12;
      blinkTimer = 2.2 + Math.random() * 5;
    }
    if (blink > 0) blink = Math.max(0, blink - dt * 6.5);
    const closed = Math.sin(blink * Math.PI);
    eyeRigs.forEach((e, i) => {
      const c2 = Math.max(0, Math.min(1, closed + blinkSkew * (i ? 1 : -1)));
      e.lid.rotation.x = c2 * 1.98;
      e.lowLid.rotation.x = Math.PI - c2 * 1.5;
    });

    brows.forEach((b, i) => {
      const target = 0.56 + (speaking ? 0.05 + emphasis * 0.05 : 0) +
        (listening ? 0.035 : 0) + Math.sin(t * 0.6 + i) * 0.006;
      b.position.y += (target - b.position.y) * 0.1;
    });

    /* ---- lip sync ---- */
    if (speaking) {
      visemeT -= dt;
      if (visemeT <= 0) {
        viseme = 0.25 + Math.random() * 0.75;
        visemeT = 0.075 + Math.random() * 0.1;
      }
      emphasis = Math.max(0, emphasis - dt * 3.2);
      const env = 0.45 + 0.55 * Math.abs(Math.sin(t * 6.2));
      jawTarget = 0.05 + 0.44 * viseme * env + emphasis * 0.12;
      snout.scale.x = 1 + jawNow * 0.1;
      tongue.position.y = -0.02 - jawNow * 0.08;
    } else {
      emphasis = 0;
      jawTarget = 0.012 + Math.sin(t * 0.9) * 0.008;
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
    u.onboundary = () => { emphasis = 1; };
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
    /** The microphone button tells him when he is being spoken to, so he
        cocks his head, widens his pupils and swivels his ears. */
    listen(on) { listening = !!on; if (on) { stop(); earPerk = 1; } },
    get muted() { return muted; },
    set muted(v) { muted = !!v; if (muted) stop(); }
  };

  if (window.__EG_PENDING_SPEECH__) {
    speak(window.__EG_PENDING_SPEECH__);
    window.__EG_PENDING_SPEECH__ = "";
  }
})();
