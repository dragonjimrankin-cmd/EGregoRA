/* ===========================================================================
   EGregoRA — Gink, the Oracle's familiar, second sculpt.

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
   tail, and lip-syncs to the browser's speech synthesiser word by word:
   the visemes are read off the text actually being spoken, timed to the
   boundary events the synthesiser reports, not improvised at random.

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

  /* Iris: a blue eye, built the way a real one is — a pale inner flare round
     the pupil, radiating stromal fibres, and a dark limbal ring at the edge
     that is most of what makes an iris look like an iris. */
  const irisTex = (() => {
    const c = makeCanvas(256, 256);
    const g = c.getContext("2d");
    const cx = 128, cy = 128;
    const grad = g.createRadialGradient(cx, cy, 8, cx, cy, 128);
    grad.addColorStop(0.00, "#cfe8ff");
    grad.addColorStop(0.22, "#8fc4ef");
    grad.addColorStop(0.52, "#4f8fd1");
    grad.addColorStop(0.80, "#255a9c");
    grad.addColorStop(0.95, "#12325e");
    grad.addColorStop(1.00, "#0a1c36");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);

    // stromal fibres
    for (let i = 0; i < 320; i++) {
      const a = Math.random() * Math.PI * 2;
      const r0 = 16 + Math.random() * 26;
      const r1 = 72 + Math.random() * 50;
      g.strokeStyle = Math.random() > 0.5
        ? "rgba(214,238,255,0.34)"
        : "rgba(9,26,54,0.38)";
      g.lineWidth = 0.6 + Math.random() * 2.2;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      g.stroke();
    }
    // collarette — the ruffled ring a third of the way out
    g.strokeStyle = "rgba(190,226,255,0.3)";
    g.lineWidth = 5;
    g.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.08) {
      const r = 44 + Math.sin(a * 11) * 3.5;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
    // limbal ring
    g.strokeStyle = "rgba(6,16,34,0.88)";
    g.lineWidth = 18;
    g.beginPath(); g.arc(cx, cy, 119, 0, Math.PI * 2); g.stroke();
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
      map: irisMap, roughness: 0.26, metalness: 0.05,
      emissiveMap: irisMap, emissive: 0x7fb0ea, emissiveIntensity: 0.05
    }),
    sclera: new THREE.MeshStandardMaterial({ color: 0xcdc4b6, roughness: 0.34 }),
    cornea: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.03, metalness: 0,
      transparent: true, opacity: 0.12,
      clearcoat: 1, clearcoatRoughness: 0.02,
      depthWrite: false, ior: 1.38
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
    depth = 0.075, tint = 0xffffff, map = furMap, shells = SHELLS, tipDark = 0.55,
    fade = null
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
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        /* `fade` lets a region grow no fur at all — used where a shell would
           otherwise push through something solid sitting on top of it, such
           as the muzzle hair emerging through the leather of the nose. */
        const k = fade ? Math.max(0, Math.min(1, fade(x, y, z))) : 1;
        const d = depth * f * k;
        p.setXYZ(i, x + nor.getX(i) * d, y + nor.getY(i) * d, z + nor.getZ(i) * d);
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


  /** A spherical cap sitting on the surface of an eyeball of the given
      radius, facing +Z, with flat radial UVs so a round texture (an iris)
      maps on without smearing. This keeps the iris and pupil on the curved
      front of the eye instead of floating as discs inside it. */
  const eyeCap = (radius, halfAngle, mat) => {
    const g = new THREE.SphereGeometry(radius, 56, 36, 0, Math.PI * 2, 0, halfAngle);
    g.rotateX(Math.PI / 2);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    const span = radius * Math.sin(halfAngle) * 2;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, 0.5 + pos.getX(i) / span, 0.5 + pos.getY(i) / span);
    }
    uv.needsUpdate = true;
    return new THREE.Mesh(g, mat);
  };

  /* ----------------------------------------------------------- scene */
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0810, 7.5, 16);

  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
  camera.position.set(0.1, 0.22, 7.0);
  camera.lookAt(0, 0.1, 0);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (err) {
    mount.classList.add("fox-stage--failed");
    setStatus("Gink cannot be drawn here — this browser has no WebGL. The written answer stands on its own.");
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
  const FOX_Y = 0.16;          // sits high enough that the jaw never leaves frame
  fox.position.y = FOX_Y;
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
    v.z += fwd * fwd * 1.24;
    v.x *= 1 - 0.80 * fwd;
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
    /* The muzzle stops short of the nose and is buried inside it. It used to
       run to z 1.34, which put its tip — and five shells of cream fur — out
       in front of the nose leather, so orange hair appeared to grow through
       the black. It now ends at 1.08, well behind the leather's front face. */
    v.z += fwd * 0.56;
    v.x *= 1 - 0.70 * fwd;
    v.y *= 1 - 0.56 * fwd;
    if (v.y < -0.1) v.y = -0.1 + (v.y + 0.1) * 0.58;
  });
  const snout = new THREE.Mesh(snoutGeo, M.cream);
  snout.position.set(0, -0.3, 0.86);
  snout.castShadow = true;
  head.add(snout);
  furShells(snout, {
    depth: 0.04, map: creamMap, shells: 5, tipDark: 0.28,
    /* bare from z 0.72 forward: that is the part the nose sits over */
    fade: (x, y, z) => 1 - smoothstep(0.72, 1.0, z)
  });

  // dark bridge stripe along the top of the muzzle
  const bridge = new THREE.Mesh(
    sculpt(new THREE.SphereGeometry(0.3, 24, 18), (v) => { v.z *= 2.5; v.y *= 0.4; v.x *= 0.7; }),
    M.furDeep
  );
  bridge.position.set(0, 0.09, 1.18);
  head.add(bridge);

  // nose leather, with a philtrum groove and nostril slits
  const noseGeo = sculpt(new THREE.SphereGeometry(0.215, 36, 28), (v) => {
    v.y *= 0.74; v.z *= 0.8; v.x *= 0.92;
    // flatten the front plane
    if (v.z > 0.08) v.z = 0.08 + (v.z - 0.08) * 0.55;
    // nostril dimples
    const nd = Math.exp(-(Math.pow((Math.abs(v.x) - 0.1) / 0.045, 2) + Math.pow((v.y + 0.02) / 0.05, 2)));
    v.z -= nd * 0.085;
    // philtrum down the middle underneath
    if (v.y < -0.04 && Math.abs(v.x) < 0.035) v.z -= 0.03;
  });
  const nose = new THREE.Mesh(noseGeo, M.nose);
  nose.position.set(0, -0.2, 1.98);
  nose.castShadow = true;
  head.add(nose);

  /* ---------- the jaw (the part that lip-syncs) ----------------------- */
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.42, 0.28);
  head.add(jaw);

  const jawGeo = sculpt(new THREE.SphereGeometry(0.46, 36, 26), (v) => {
    const fwd = smoothstep(-0.25, 0.46, v.z);
    /* This is what was poking through the nose. The lower jaw ran to z 2.40
       in head space while the nose leather ends at 2.11, so the cream fur on
       the jaw's tip stood out in front of the black. On a real fox the lower
       jaw stops short of the nose, and now so does this one: 2.02. */
    v.z += fwd * 0.76;
    v.x *= 1 - 0.80 * fwd;            // the lower jaw tapers to a point
    v.y *= 0.52 * (1 - 0.5 * fwd);
    if (v.y > 0.0) v.y *= 0.32;
  });
  const lowerJaw = new THREE.Mesh(jawGeo, M.cream);
  lowerJaw.position.set(0, -0.04, 0.52);
  lowerJaw.castShadow = true;
  jaw.add(lowerJaw);
  furShells(lowerJaw, {
    depth: 0.035, map: creamMap, shells: 4, tipDark: 0.25,
    /* and no hair at all on the last of it, under the leather */
    fade: (x, y, z) => 1 - smoothstep(0.95, 1.25, z)
  });

  // dark mouth cavity so an open mouth reads as depth, not a gap
  const cavity = new THREE.Mesh(
    sculpt(new THREE.SphereGeometry(0.36, 20, 14), (v) => { v.z *= 1.9; v.y *= 0.62; }),
    M.mouth
  );
  cavity.position.set(0, 0.08, 0.62);
  jaw.add(cavity);

  // tongue
  const tongue = new THREE.Mesh(
    sculpt(new THREE.SphereGeometry(0.2, 22, 16), (v) => {
      v.z *= 2.3; v.y *= 0.3; v.x *= 0.85;
      if (Math.abs(v.x) < 0.02 && v.y > 0) v.y -= 0.012;   // the central groove
    }),
    M.tongue
  );
  tongue.position.set(0, 0.0, 0.74);
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
    rig.position.set(0.525 * s, 0.28, 0.80);   // proud of the skull, not sunk in it
    rig.rotation.y = 0.3 * s;
    head.add(rig);

    // dark eye-patch marking, almond shaped
    const patch = new THREE.Mesh(
      sculpt(new THREE.SphereGeometry(0.31, 20, 14), (v) => {
        v.z *= 0.28; v.y *= 0.68;
        v.x *= 1 + 0.25 * smoothstep(0.0, -0.3, v.x * s);
      }),
      M.furShade
    );
    patch.position.z = 0.02;
    patch.scale.set(1.05, 1, 1);
    rig.add(patch);

    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.2, 40, 30), M.sclera);
    globe.position.z = 0.1;
    rig.add(globe);

    // the iris, lying on the curve of the eye itself
    const iris = eyeCap(0.2015, 0.84, M.iris);   // a little smaller, so the sclera shows
    iris.renderOrder = 2;
    globe.add(iris);

    // the pupil: black, dead centre, and on the surface so nothing can bury it
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
    const pupil = eyeCap(0.2035, 0.44, pupilMat);
    pupil.scale.set(0.78, 1.0, 1);        // a broad vertical oval
    pupil.renderOrder = 3;
    globe.add(pupil);

    // cornea: a clear bulge over the iris, which is where realism lives
    const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.208, 40, 28), M.cornea);
    cornea.scale.set(1, 1, 1.05);
    cornea.renderOrder = 6;
    globe.add(cornea);

    // two catchlights, one key, one rim
    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.031, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xfffaf0 })
    );
    glint.position.set(-0.092 * s, 0.09, 0.195);
    glint.renderOrder = 5;
    globe.add(glint);
    const glint2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xcfdcff, transparent: true, opacity: 0.8 })
    );
    glint2.position.set(0.105 * s, -0.07, 0.188);
    glint2.renderOrder = 5;
    globe.add(glint2);

    /* ---- eyelids ----------------------------------------------------
       Each lid is a furred spherical cap riding just outside the globe,
       hinged at the socket. At rest they are swung clear of the iris so the
       eye is properly open — the upper lid resting a little over the top of
       the iris, as a real one does — and a dark lash rim is fixed to each
       lid edge so the aperture has a drawn line rather than a soft fade. */
    const lashMat = new THREE.MeshStandardMaterial({ color: 0x1d120c, roughness: 0.5 });

    const makeLid = (radius, rest, lower) => {
      const l = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2),
        M.fur
      );
      l.position.z = 0.1;
      l.rotation.x = rest;
      l.castShadow = true;

      const lash = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.995, 0.011, 8, 44), lashMat);
      lash.rotation.x = Math.PI / 2;
      l.add(lash);

      // a soft fold of skin above the upper lid
      if (!lower) {
        const fold = new THREE.Mesh(
          sculpt(new THREE.SphereGeometry(radius * 0.92, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.6),
                 (v) => { v.y *= 0.5; }),
          M.furDeep
        );
        fold.position.y = radius * 0.22;
        l.add(fold);
      }
      rig.add(l);
      return l;
    };

    const REST_UP = -0.62;                 // swung back off the iris
    const REST_LOW = Math.PI + 0.46;       // lower lid dropped clear
    const lid = makeLid(0.238, REST_UP, false);
    const lowLid = makeLid(0.232, REST_LOW, true);

    /* The sockets sit on the sides of a wedge skull, so each globe is
       counter-rotated back towards the viewer and then toed in very slightly,
       which is what convergence on a near object actually looks like. He
       therefore meets your eye rather than staring past your shoulder. */
    const restY = -rig.rotation.y - 0.085 * s;
    globe.rotation.y = restY;

    eyeRigs.push({ rig, globe, lid, lowLid, iris, pupil, side: s, restY, REST_UP, REST_LOW });
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
  let wideNow = 0, wideTarget = 0;

  /* ---- visemes -------------------------------------------------------
     The jaw is driven by the letters actually being spoken rather than by
     noise. Each sound class gets a mouth shape: how far the jaw drops, and
     how wide the muzzle spreads. Crude next to a real phoneme aligner, but
     English orthography is regular enough that an open A reads as an open
     mouth and an M reads as a closed one, which is all the eye checks. */
  const SHAPES = {
    a: [0.95, 0.55], A: [0.95, 0.55],
    o: [0.80, 0.10], u: [0.55, 0.05], w: [0.40, 0.00],
    e: [0.55, 0.85], i: [0.38, 0.90], y: [0.38, 0.80],
    m: [0.02, 0.35], b: [0.05, 0.35], p: [0.05, 0.35],
    f: [0.16, 0.65], v: [0.16, 0.65],
    s: [0.14, 0.80], z: [0.14, 0.80], c: [0.18, 0.75], x: [0.20, 0.70],
    t: [0.22, 0.60], d: [0.24, 0.55], n: [0.20, 0.55], l: [0.30, 0.60],
    r: [0.34, 0.35], g: [0.30, 0.40], k: [0.30, 0.45], q: [0.35, 0.15],
    h: [0.30, 0.45], j: [0.28, 0.65]
  };
  const VOWELS = "aeiouy";
  let visQueue = [];          // [{ jaw, wide, dur }]
  let visHold = 0;            // time left on the current shape
  let visJaw = 0, visWide = 0;

  /* Turn a word into a short run of mouth shapes and spread them over the
     time the synthesiser will plausibly take to say it. Consonant clusters
     collapse — the mouth does not articulate every letter of "strength". */
  const mouthWord = (word, seconds) => {
    const letters = String(word).toLowerCase().replace(/[^a-z']/g, "");
    if (!letters) return;
    const shapes = [];
    let lastVowel = null;
    for (let i = 0; i < letters.length; i++) {
      const ch = letters[i];
      const sh = SHAPES[ch];
      if (!sh) continue;
      const isVowel = VOWELS.indexOf(ch) > -1;
      if (isVowel && lastVowel === ch) continue;           // "ee" is one shape
      if (isVowel) lastVowel = ch; else lastVowel = null;
      const prev = shapes[shapes.length - 1];
      if (prev && !isVowel && !prev.v && Math.abs(prev.jaw - sh[0]) < 0.12) {
        prev.weight += 0.6;                                 // collapse a cluster
        continue;
      }
      shapes.push({ jaw: sh[0], wide: sh[1], v: isVowel, weight: isVowel ? 1.5 : 0.8 });
    }
    if (!shapes.length) shapes.push({ jaw: 0.4, wide: 0.5, weight: 1 });
    const total = shapes.reduce((n, sh) => n + sh.weight, 0);
    const span = Math.max(0.1, seconds);
    visQueue = shapes.map((sh) => ({
      jaw: sh.jaw,
      wide: sh.wide,
      dur: Math.max(0.035, (sh.weight / total) * span)
    }));
    // every word ends by closing a little, which is what separates words
    visQueue.push({ jaw: 0.06, wide: 0.3, dur: 0.045 });
    visHold = 0;
  };
  let emphasis = 0;
  let blinkTimer = 1.5 + Math.random() * 3, blink = 0, blinkSkew = 0;
  let earPerk = 0;
  const earFlick = [
    { wait: 0.6 + Math.random() * 1.9, on: 0 },
    { wait: 0.6 + Math.random() * 1.9, on: 0 }
  ];
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
      fox.position.y = FOX_Y + Math.sin(t * 0.95) * 0.035;
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
      /* Flicks used to fire off a sine threshold, roughly every 0.7s per ear,
         which read as a nervous twitch. They are now scheduled, and scheduled
         65% less often: the same flick, at a little under a third of the rate. */
      earFlick.forEach((e, i) => {
        e.wait -= dt;
        if (e.wait <= 0) { e.on = 0.2; e.wait = 1.1 + Math.random() * 1.9; }
        if (e.on > 0) e.on = Math.max(0, e.on - dt);
      });
      ears.forEach((ear, i) => {
        const s = i === 0 ? -1 : 1;
        const flick = Math.sin((earFlick[i].on / 0.2) * Math.PI) * 0.24;
        const swivel = listening ? Math.sin(t * 0.9 + i * 1.7) * 0.08 : 0;
        ear.rotation.z = (-0.3 + earPerk * 0.12) * s + (Math.sin(t * 1.21 + i * 2) * 0.025 + flick) * s;
        ear.rotation.x = -0.12 - earPerk * 0.12 + Math.sin(t * 0.9 + i) * 0.02;
        ear.rotation.y = 0.3 * s + swivel * s;
      });
    }

    // a quizzical head tilt while he is being asked something
    headTilt += ((listening ? 0.16 : 0) - headTilt) * 0.04;

    // gaze: head, neck and eyes move on different lags, as real heads do
    const tx = pointer.active ? pointer.x * 0.3 : Math.sin(t * 0.31) * 0.07;
    const ty = pointer.active ? pointer.y * 0.2 : Math.cos(t * 0.24) * 0.045;
    head.rotation.y += (tx - head.rotation.y) * 0.055;
    head.rotation.x += (ty * 0.55 - head.rotation.x) * 0.055;
    head.rotation.z += (headTilt - head.rotation.z) * 0.06;
    neck.rotation.y += (tx * 0.35 - neck.rotation.y) * 0.03;
    eyeRigs.forEach((e) => {
      /* The eyes counter-rotate against the head, so that wherever the skull
         turns the gaze stays on the viewer — the trick portrait painters use. */
      e.globe.rotation.y = e.restY - head.rotation.y * 0.55 - tx * 0.18;
      e.globe.rotation.x = -head.rotation.x * 0.45 + ty * 0.14;
      // the pupil widens when he is listening and in the lower light
      const target = listening ? 0.95 : 0.78;
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
      // lids travel from their open rest angles to meet just below centre
      e.lid.rotation.x = e.REST_UP + c2 * (1.30 - e.REST_UP);
      e.lowLid.rotation.x = e.REST_LOW - c2 * (e.REST_LOW - (Math.PI - 0.62));
    });

    brows.forEach((b, i) => {
      const target = 0.56 + (speaking ? 0.05 + emphasis * 0.05 : 0) +
        (listening ? 0.035 : 0) + Math.sin(t * 0.6 + i) * 0.006;
      b.position.y += (target - b.position.y) * 0.1;
    });

    /* ---- lip sync -----------------------------------------------------
       Shapes are consumed from the queue the words put there, and the jaw
       chases them with a spring that opens faster than it closes — the
       asymmetry is most of what makes a mouth look like it is speaking
       rather than chattering. Smoothing is framerate-independent. */
    if (speaking) {
      visHold -= dt;
      while (visHold <= 0 && visQueue.length) {
        const nextShape = visQueue.shift();
        visJaw = nextShape.jaw; visWide = nextShape.wide;
        visHold += nextShape.dur;
      }
      if (!visQueue.length && visHold <= 0) {
        /* Between boundary events, or in a browser that reports none, he
           keeps a low murmur going rather than freezing mid-word. */
        visJaw = 0.26 + 0.22 * Math.abs(Math.sin(t * 5.4));
        visWide = 0.45 + 0.15 * Math.sin(t * 3.1);
      }
      emphasis = Math.max(0, emphasis - dt * 3.2);
      jawTarget = 0.035 + 0.42 * visJaw + emphasis * 0.05;
      wideTarget = visWide;
      tongue.position.y = -0.02 - jawNow * 0.08;
    } else {
      emphasis = 0;
      visQueue.length = 0; visHold = 0; visJaw = 0; visWide = 0;
      jawTarget = 0.012 + Math.sin(t * 0.9) * 0.008;
      wideTarget = 0;
    }
    const opening = jawTarget > jawNow;
    const kJaw = 1 - Math.exp(-dt * (opening ? 34 : 19));
    jawNow += (jawTarget - jawNow) * kJaw;
    wideNow += (wideTarget - wideNow) * (1 - Math.exp(-dt * 22));
    jaw.rotation.x = jawNow;
    snout.scale.x = 1 + jawNow * 0.06 + wideNow * 0.05;
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
    if (!canSpeak) return "No speech synthesiser here — Gink will mouth the words silently.";
    if (!chosenVoice) return "Ready. Ask the oracle and Gink will read the answer aloud.";
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
  let mimeTimer = null;
  const RATE = 0.95;
  const CPS = 13.5 * RATE;      // characters per second at this speaking rate

  /* Mouth a text without a synthesiser: walk the words on a timer at the
     same pace the voice would have used. Used on devices with no speech. */
  const mimeText = (text, done) => {
    const words = String(text).split(/\s+/).filter(Boolean);
    let i = 0;
    const tick = () => {
      if (i >= words.length) { clearTimeout(mimeTimer); mimeTimer = null; done && done(); return; }
      const w = words[i++];
      const secs = Math.max(0.14, w.length / CPS);
      mouthWord(w, secs);
      const pause = /[.,;:!?…]$/.test(w) ? 220 : 40;
      mimeTimer = setTimeout(tick, secs * 1000 + pause);
    };
    tick();
  };

  const stop = () => {
    queue = []; speaking = false;
    visQueue.length = 0; visHold = 0;
    clearTimeout(silentTimer);
    clearTimeout(mimeTimer); mimeTimer = null;
    if (canSpeak) synth.cancel();
    if (btnStop) btnStop.disabled = true;
    setStatus(readyLine());
  };

  const sayNext = () => {
    clearTimeout(mimeTimer); mimeTimer = null;
    if (!queue.length) {
      speaking = false;
      visQueue.length = 0; visHold = 0;
      if (btnStop) btnStop.disabled = true;
      setStatus("Finished. Test everything kindly.");
      return;
    }
    const line = queue.shift();
    const u = new SpeechSynthesisUtterance(line);
    if (chosenVoice) { u.voice = chosenVoice; u.lang = chosenVoice.lang; } else u.lang = "en-GB";
    u.rate = RATE; u.pitch = 0.86; u.volume = 1;
    let sawBoundary = false;
    u.onstart = () => {
      speaking = true;
      /* Chrome and Safari fire word boundaries; Firefox often does not. Give
         it a moment, and if nothing arrives, mime the line on a timer so the
         mouth still follows the words instead of inventing them. */
      setTimeout(() => { if (speaking && !sawBoundary) mimeText(line); }, 320);
    };
    u.onboundary = (e) => {
      /* A real boundary: take the word at this character index and give the
         jaw exactly that word to shape, spread over how long it will take. */
      sawBoundary = true;
      clearTimeout(mimeTimer); mimeTimer = null;
      const from = typeof e.charIndex === "number" ? e.charIndex : 0;
      const len = e.charLength || (line.slice(from).match(/^\S+/) || [""])[0].length;
      const word = line.substr(from, Math.max(1, len));
      if (word.trim()) {
        mouthWord(word, Math.max(0.12, word.trim().length / CPS));
        emphasis = /[.!?]$/.test(word) ? 1 : 0.45;
      }
    };
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
      clearTimeout(mimeTimer); mimeTimer = null;
      mimeText(text);
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
      "I am Gink, the order's familiar. Ask the oracle a question and I will read its answer aloud. " +
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
