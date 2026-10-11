/* ===========================================================================
   The Two Infinities — ShakDrah, the oracle's keeper.

   A green dragon built entirely in code, using the shared avatar controls but
   with reptilian anatomy, motion and shading rather than a recoloured fox:

     · procedurally generated scale, roughness and fringe-alpha textures,
       drawn on canvases at load — no image files, no CDN assets beyond
       three.js itself
     · overlapping keeled scales across the skull, jaw, chest and tail,
       with a softer shell fringe along the throat and dewlap so the
       silhouette breaks up instead of ending at a hard edge
     · MeshPhysicalMaterial with sheen and a faint iridescent clearcoat,
       which is what makes a scaled hide read as hide under a rim light,
       plus a generated environment map for soft image-based lighting
     · a wet clearcoat nostril ridge, a layered reptile eye (sclera,
       striated amber iris, vertical slit pupil, refracting cornea,
       catchlight) and curved barbels either side of the jaw
     · anatomy by vertex deformation: a long tapering snout, brow horns,
       swept crown horns, a spined crest running nape to tail, a hinged
       jaw, neck and withers, and folded wings at the shoulders

   He breathes, blinks asymmetrically, flexes his frills, tracks the cursor
   with head, neck and eyes separately, sweeps a seven-segment spined tail,
   and lip-syncs either to HeadTTS's true phoneme timestamps or, on the
   immediate native fallback, to the browser synthesiser's word boundaries.
   Neither mouth track is improvised at random.

   Exposes window.EGDragon = { speak(text), stop(), available, muted }.
   =========================================================================== */

import * as THREE from "./vendor/three.module.js";
import {
  AVATAR_VOICE_PROFILES,
  NaturalVoiceEngine,
  getMaleNeuralVoice,
  normaliseSpeechText,
  rankNativeVoices
} from "./neural-voice.js?v=male-voices-1";

(() => {
  "use strict";

  const mount = document.getElementById("dragon-stage");
  if (!mount) return;

  const statusEl = document.getElementById("dragon-status");
  const btnSpeak = document.getElementById("dragon-speak");
  const btnStop = document.getElementById("dragon-stop");
  const btnNatural = document.getElementById("dragon-natural");
  const neuralVoiceSelect = document.getElementById("dragon-voice");
  const setStatus = (s) => { if (statusEl) statusEl.textContent = s; };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* Stable procedural detail gives ShakDrah the same scale pattern and
     facial identity on every visit while retaining organic motion. */
  const random = (() => {
    let state = 0xbb67ae85;
    return () => {
      state |= 0; state = (state + 0x6d2b79f5) | 0;
      let n = Math.imul(state ^ (state >>> 15), 1 | state);
      n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
      return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    };
  })();

  /* ----------------------------------------------------------- palette */
  const C = {
    fur:      0x3f7a3a,   /* the hide: deep leaf green */
    furWarm:  0x63a84c,   /* sunlit scales along the back */
    furDeep:  0x27512c,   /* shadowed plates */
    furShade: 0x16321d,   /* the darkest crevice between scales */
    cream:    0xd8e2a8,   /* the pale belly and throat plates */
    creamDim: 0xaebd82,
    black:    0x0e1a12,
    gold:     0x76cfee,   /* the sigil rings: ion blue, not gold */
    iris:     0xe8b43c,   /* amber, as a reptile's should be */
    tongue:   0x9a4a62
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
      const x = random() * w;
      const y = random() * h;
      const len = 4 + random() * 16;
      const a = (-Math.PI / 2) + (random() - 0.5) * 0.8;
      const t = random();
      g.strokeStyle = alpha
        ? `rgba(255,255,255,${0.35 + t * 0.65})`
        : (t > 0.5 ? light : dark);
      g.globalAlpha = alpha ? 1 : 0.14 + random() * 0.3;
      g.lineWidth = alpha ? 0.8 + random() * 1.6 : 0.6 + random() * 1.4;
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

  /* Scales: overlapping keeled rows, offset every other row, each one lit
     from above and shadowed at the lip where the next row laps over it.
     Drawn once at load, tiled over the hide. */
  const scaleCanvas = (w, h, { rows, light, dark, bg, keel }) => {
    const c = makeCanvas(w, h);
    const g = c.getContext("2d");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    const sh = h / rows;
    const sw = sh * 1.45;
    for (let r = -1; r <= rows; r++) {
      const y = r * sh;
      const offset = (r % 2) * sw * 0.5;
      for (let x = -sw; x < w + sw; x += sw) {
        const cx = x + offset;
        const jitter = (Math.sin(r * 12.9898 + x * 78.233) * 43758.5453) % 1;
        const t = Math.abs(jitter);
        g.beginPath();
        g.moveTo(cx, y + sh);
        g.quadraticCurveTo(cx, y - sh * 0.15, cx + sw * 0.5, y - sh * 0.15);
        g.quadraticCurveTo(cx + sw, y - sh * 0.15, cx + sw, y + sh);
        g.closePath();
        const grad = g.createLinearGradient(cx, y - sh * 0.2, cx, y + sh);
        grad.addColorStop(0, t > 0.5 ? light : bg);
        grad.addColorStop(0.62, bg);
        grad.addColorStop(1, dark);
        g.fillStyle = grad;
        g.globalAlpha = 0.82 + t * 0.18;
        g.fill();
        /* the keel: a raised ridge down the centre of each scale */
        if (keel) {
          g.globalAlpha = 0.3;
          g.strokeStyle = light;
          g.lineWidth = 0.8;
          g.beginPath();
          g.moveTo(cx + sw * 0.5, y + sh * 0.9);
          g.lineTo(cx + sw * 0.5, y - sh * 0.05);
          g.stroke();
        }
        g.globalAlpha = 0.5;
        g.strokeStyle = dark;
        g.lineWidth = 0.7;
        g.stroke();
      }
    }
    g.globalAlpha = 1;
    return c;
  };

  const furMap     = asTexture(scaleCanvas(512, 512, { rows: 26, light: "#86c667", dark: "#1b3b22", bg: "#3f7a3a", keel: true }), { srgb: true, repeat: 3 });
  const creamMap   = asTexture(scaleCanvas(512, 512, { rows: 18, light: "#f0f6c8", dark: "#8c9a63", bg: "#d8e2a8", keel: false }), { srgb: true, repeat: 2.2 });
  const hairAlpha  = asTexture(hairCanvas(512, 512, { strokes: 9000, bg: "#000000", alpha: true }), { repeat: 4 });

  /* A roughness map so the coat is not uniformly matte — guard hairs catch
     light, undercoat does not. */
  const roughCanvas = (() => {
    const c = makeCanvas(256, 256);
    const g = c.getContext("2d");
    g.fillStyle = "#b8b8b8";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const v = 120 + Math.floor(random() * 110);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(random() * 256, random() * 256, 1 + random() * 3, 1 + random() * 6);
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
    grad.addColorStop(0.00, "#ffe9a8");
    grad.addColorStop(0.22, "#f5cf55");
    grad.addColorStop(0.52, "#d89a24");
    grad.addColorStop(0.80, "#9c6412");
    grad.addColorStop(0.95, "#5d3a0b");
    grad.addColorStop(1.00, "#2a1a06");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);

    // stromal fibres
    for (let i = 0; i < 320; i++) {
      const a = random() * Math.PI * 2;
      const r0 = 16 + random() * 26;
      const r1 = 72 + random() * 50;
      g.strokeStyle = random() > 0.5
        ? "rgba(255,238,190,0.36)"
        : "rgba(54,30,6,0.40)";
      g.lineWidth = 0.6 + random() * 2.2;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      g.stroke();
    }
    // collarette — the ruffled ring a third of the way out
    g.strokeStyle = "rgba(255,230,160,0.3)";
    g.lineWidth = 5;
    g.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.08) {
      const r = 44 + Math.sin(a * 11) * 3.5;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
    // limbal ring
    g.strokeStyle = "rgba(28,16,4,0.9)";
    g.lineWidth = 18;
    g.beginPath(); g.arc(cx, cy, 119, 0, Math.PI * 2); g.stroke();
    return c;
  })();

  const irisMap = asTexture(irisTex, { srgb: true });
  irisMap.wrapS = irisMap.wrapT = THREE.ClampToEdgeWrapping;
  irisMap.repeat.set(1, 1);

  /* ----------------------------------------------------------- materials */
  /* Hide, not fur: lower roughness, a little clearcoat for the wet sheen a
     reptile has along the keels, and iridescence so the green shifts toward
     blue at glancing angles. */
  const physical = (o) => new THREE.MeshPhysicalMaterial({
    roughness: 0.56, metalness: 0.04, sheen: 0.7, sheenRoughness: 0.5,
    clearcoat: 0.35, clearcoatRoughness: 0.42,
    iridescence: 0.22, iridescenceIOR: 1.3, ...o
  });

  const M = {
    fur: physical({
      color: 0xffffff, map: furMap, roughnessMap: roughMap,
      bumpMap: furMap, bumpScale: 0.052,
      sheenColor: new THREE.Color(0x9fe6b4)
    }),
    furDeep: physical({
      color: C.furDeep, roughnessMap: roughMap, roughness: 0.95,
      sheenColor: new THREE.Color(0x6fc98c)
    }),
    furShade: physical({ color: C.furShade, roughness: 0.96, sheen: 0.7 }),
    cream: physical({
      color: 0xffffff, map: creamMap, roughnessMap: roughMap,
      bumpMap: creamMap, bumpScale: 0.036,
      sheenColor: new THREE.Color(0xeaf4c2)
    }),
    creamDim: physical({ color: C.creamDim, roughness: 0.95, sheenColor: new THREE.Color(0xd7e4a6) }),
    black: physical({ color: C.black, roughness: 0.62, sheen: 0.5 }),
    nose: new THREE.MeshPhysicalMaterial({
      color: 0x16281a, roughness: 0.18, metalness: 0,
      bumpMap: roughMap, bumpScale: 0.014,
      clearcoat: 1, clearcoatRoughness: 0.06
    }),
    horn: new THREE.MeshPhysicalMaterial({
      color: 0xc9b488, roughness: 0.52, metalness: 0.08,
      bumpMap: roughMap, bumpScale: 0.024,
      clearcoat: 0.3, clearcoatRoughness: 0.5
    }),
    membrane: new THREE.MeshPhysicalMaterial({
      color: 0x2f6b43, roughness: 0.68, metalness: 0,
      transparent: true, opacity: 0.93, side: THREE.DoubleSide,
      sheen: 0.8, sheenColor: new THREE.Color(0x8fe0a8)
    }),
    tongue: new THREE.MeshPhysicalMaterial({
      color: C.tongue, roughness: 0.34, clearcoat: 0.8, clearcoatRoughness: 0.25
    }),
    mouth: new THREE.MeshStandardMaterial({ color: 0x1b0c0c, roughness: 0.6 }),
    iris: new THREE.MeshStandardMaterial({
      map: irisMap, roughness: 0.2, metalness: 0.08,
      emissiveMap: irisMap, emissive: 0xe8b43c, emissiveIntensity: 0.09
    }),
    sclera: new THREE.MeshStandardMaterial({ color: 0xe6dcb4, roughness: 0.3 }),
    cornea: new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.03, metalness: 0,
      transparent: true, opacity: 0.12,
      clearcoat: 1, clearcoatRoughness: 0.02,
      depthWrite: false, ior: 1.38
    }),
    tooth: new THREE.MeshPhysicalMaterial({ color: 0xf6efe0, roughness: 0.3, clearcoat: 0.6 }),
    whisker: new THREE.MeshStandardMaterial({
      color: 0x8fb06a, roughness: 0.5, transparent: true, opacity: 0.85
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
    mount.classList.add("dragon-stage--failed");
    setStatus("ShakDrah cannot be drawn here — this browser has no WebGL. The written answer stands on its own.");
    return;
  }
  const constrainedGPU = window.matchMedia("(max-width: 680px)").matches ||
    (Number(navigator.deviceMemory) > 0 && Number(navigator.deviceMemory) <= 4);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, constrainedGPU ? 1.5 : 2));
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
    sky.addColorStop(0, "#dff4d5");
    sky.addColorStop(0.42, "#48676a");
    sky.addColorStop(0.62, "#172f2c");
    sky.addColorStop(1, "#081411");
    g.fillStyle = sky; g.fillRect(0, 0, 512, 256);
    const lamp = g.createRadialGradient(130, 70, 4, 130, 70, 78);
    lamp.addColorStop(0, "#f2ffe9"); lamp.addColorStop(1, "rgba(210,255,220,0)");
    g.fillStyle = lamp; g.fillRect(0, 0, 512, 256);
    const cool = g.createRadialGradient(400, 120, 4, 400, 120, 96);
    cool.addColorStop(0, "#93dcff"); cool.addColorStop(1, "rgba(90,195,235,0)");
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

  scene.add(new THREE.HemisphereLight(0xdfffd9, 0x081712, 0.38));

  const key = new THREE.DirectionalLight(0xe4ffd9, 2.3);
  key.position.set(3.0, 4.2, 4.0);
  key.castShadow = true;
  key.shadow.mapSize.set(constrainedGPU ? 1024 : 2048, constrainedGPU ? 1024 : 2048);
  key.shadow.camera.near = 1; key.shadow.camera.far = 22;
  key.shadow.camera.left = -4.5; key.shadow.camera.right = 4.5;
  key.shadow.camera.top = 4.5; key.shadow.camera.bottom = -4.5;
  key.shadow.bias = -0.0012;
  key.shadow.radius = 2.4;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x78d9ff, 2.85);
  rim.position.set(-3.4, 2.2, -3.6);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0xa9d88f, 0.48);
  fill.position.set(-2.4, -0.6, 3.4);
  scene.add(fill);

  const bounce = new THREE.PointLight(C.gold, 1.5, 15, 2);
  bounce.position.set(0, -2.2, 2.8);
  scene.add(bounce);

  /* ==================================================== the dragon */
  const dragon = new THREE.Group();
  const DRAGON_Y = 0.16;          // sits high enough that the jaw never leaves frame
  dragon.position.y = DRAGON_Y;
  scene.add(dragon);

  /* ---------- body / chest bust -------------------------------------- */
  const body = new THREE.Group();
  dragon.add(body);

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
  /* The scaled hide stays crisp; unlike Gink's coat it does not need a
     stack of hair shells. Relief now comes from the keeled bump map. */

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
  /* A restrained three-layer fringe remains only at the soft dewlap. */
  furShells(bib, { depth: 0.025, shells: 3, map: creamMap, tipDark: 0.2 });

  /* Raised throat scutes break the old smooth fox-bib silhouette into broad,
     overlapping reptilian armour without adding a downloaded model. */
  const throatScutes = [];
  for (let i = 0; i < 7; i++) {
    const plate = new THREE.Mesh(
      sculpt(new THREE.SphereGeometry(0.28, 24, 14), (v) => {
        v.x *= 1.55 - i * 0.055;
        v.y *= 0.34;
        v.z *= 0.32;
      }),
      i % 2 ? M.creamDim : M.cream
    );
    plate.position.set(0, -0.83 - i * 0.27, 1.06 - i * 0.075);
    plate.rotation.x = -0.12 - i * 0.018;
    plate.castShadow = true;
    body.add(plate);
    throatScutes.push(plate);
  }

  // faceted shoulder armour and lateral neck spines
  const armourSpike = (x, y, z, s, rot, matl) => {
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
    body.add(armourSpike(
      Math.sin(a) * r * 1.1, -1.0 + Math.cos(a) * 0.1, Math.cos(a) * r * 0.62,
      0.46 + 0.2 * Math.cos(a),
      [0.5 + 0.15 * Math.cos(a), 0, -Math.sin(a) * 0.95],
      i % 3 === 0 ? M.horn : M.furDeep
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
    const r = Math.max(0.14, 0.45 - i * 0.05);
    const g = sculpt(new THREE.SphereGeometry(r, 24, 18), (v) => {
      v.y *= 1.28; v.z *= 0.9;
      /* a low dorsal keel continues the spine into the tail */
      const dorsal = smoothstep(0.0, 0.8, v.y / Math.max(r, 0.001)) * smoothstep(0.1, -0.7, v.z / Math.max(r, 0.001));
      v.z -= dorsal * 0.045;
    });
    const mesh = new THREE.Mesh(g, M.fur);
    mesh.castShadow = true;
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
  dragon.add(neck);

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
  /* The bump-mapped scale rows stay visible right to the silhouette. */

  // pale scaled muzzle wrap and chin
  const snoutGeo = sculpt(new THREE.SphereGeometry(0.52, 36, 26), (v) => {
    const fwd = smoothstep(-0.2, 0.52, v.z);
    /* The muzzle stops short of the nose and is buried inside it. It used to
       run to z 1.34, which put its tip — and five copied shell layers — out
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
  /* Smooth throat plates transition cleanly into the bare nostril ridge. */

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

  /* Deep nostril apertures and a slow flare make the muzzle read as living
     reptile anatomy rather than the fox rig with a green material. */
  const nostrils = [-1, 1].map((side) => {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 10), M.mouth);
    nostril.scale.set(1.12, 0.48, 0.26);
    nostril.position.set(0.108 * side, -0.19, 2.105);
    nostril.rotation.z = -0.2 * side;
    head.add(nostril);
    return nostril;
  });

  /* ---------- the jaw (the part that lip-syncs) ----------------------- */
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.42, 0.28);
  head.add(jaw);

  const jawGeo = sculpt(new THREE.SphereGeometry(0.46, 36, 26), (v) => {
    const fwd = smoothstep(-0.25, 0.46, v.z);
    /* This is what was poking through the nose. The lower jaw ran to z 2.40
       in head space while the nose leather ends at 2.11, so the cream fur on
       the jaw's tip stood out in front of the black. On a real dragon the lower
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
  /* Lower-jaw scutes remain hard-edged rather than fox-like and furry. */

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
    pupil.scale.set(0.34, 1.08, 1);       // a true reptilian slit, not the old fox oval
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

  /* ---------- horns, brow spikes and the ear frills -------------------- */

  /** A horn: a tapering, slightly curved, faintly ridged cone. */
  const horn = (len, baseR, curve, twist) => {
    const pts = [];
    const segs = 14;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      pts.push(new THREE.Vector3(
        Math.sin(t * curve) * len * 0.34,
        t * len,
        -Math.sin(t * curve) * len * 0.2
      ));
    }
    const path = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(path, 26, baseR, 10, false);
    /* taper to a point, and ring the horn with growth ridges */
    sculpt(geo, (v, i, count) => {
      const t = v.y / Math.max(len, 0.0001);
      const k = Math.max(0.06, 1 - t * 0.94);
      v.x *= k; v.z *= k;
      const ridge = Math.sin(t * twist) * 0.012 * (1 - t);
      v.x += ridge; v.z += ridge;
    });
    geo.computeVertexNormals();
    return geo;
  };

  /* The two great crown horns, swept back over the skull. */
  [-1, 1].forEach((side) => {
    const h = new THREE.Mesh(horn(1.42, 0.17, 1.15, 48), M.horn);
    h.position.set(0.44 * side, 0.74, -0.2);
    h.rotation.set(-0.72, 0.26 * side, -0.22 * side);
    h.castShadow = true;
    head.add(h);

    /* a smaller brow spike in front of it */
    const b = new THREE.Mesh(horn(0.58, 0.085, 0.7, 36), M.horn);
    b.position.set(0.5 * side, 0.4, 0.48);
    b.rotation.set(-0.5, 0.2 * side, -0.5 * side);
    b.castShadow = true;
    head.add(b);

    /* three small cheek spines sweeping back along the jawline */
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(horn(0.3 + i * 0.07, 0.045, 0.5, 20), M.horn);
      c.position.set(0.78 * side, -0.18 - i * 0.12, 0.42 - i * 0.3);
      c.rotation.set(-0.2, 0, (1.15 + i * 0.1) * side);
      head.add(c);
    }
  });

  /* The ear frills: a fan of membrane on a short armature, which keeps the
     name `ears` so the flick-and-swivel animation drives them unchanged. */
  const frillShape = () => {
    const sh = new THREE.Shape();
    sh.moveTo(-0.1, 0);
    sh.quadraticCurveTo(-0.52, 0.52, -0.62, 1.04);
    sh.lineTo(-0.3, 0.86);
    sh.lineTo(-0.16, 1.16);
    sh.lineTo(0.04, 0.84);
    sh.lineTo(0.26, 1.08);
    sh.lineTo(0.3, 0.72);
    sh.quadraticCurveTo(0.5, 0.4, 0.2, 0);
    sh.quadraticCurveTo(0, -0.1, -0.1, 0);
    return sh;
  };

  const ears = [];
  [-1, 1].forEach((side) => {
    const ear = new THREE.Group();
    ear.position.set(0.66 * side, 0.4, -0.5);
    ear.rotation.z = -0.42 * side;
    ear.rotation.y = 0.62 * side;
    ear.rotation.x = -0.2;
    head.add(ear);

    const webGeo = new THREE.ExtrudeGeometry(frillShape(), {
      depth: 0.035, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015,
      bevelSegments: 2, curveSegments: 14
    });
    webGeo.center();
    sculpt(webGeo, (v) => {
      /* cup the fan backwards, as a frill at rest does */
      v.z += Math.pow(Math.abs(v.x) / 0.5, 2) * 0.16;
    });
    webGeo.computeVertexNormals();
    const web = new THREE.Mesh(webGeo, M.membrane);
    web.position.y = 0.46;
    web.scale.set(0.82, 0.86, 1);
    web.castShadow = true;
    ear.add(web);

    /* the ribs that hold the fan open */
    for (let i = 0; i < 4; i++) {
      const u = i / 3;
      const rib = new THREE.Mesh(horn(0.62 + Math.sin(u * Math.PI) * 0.26, 0.022, 0.3, 12), M.horn);
      rib.position.set((-0.3 + u * 0.56) * 1, 0.04, 0.02);
      rib.rotation.z = (u - 0.5) * 1.05;
      ear.add(rib);
    }
    ears.push(ear);
  });

  /* ---------- the crest: spines from the nape down the spine ----------- */
  const crest = [];
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const spine = new THREE.Mesh(horn(0.34 + Math.sin(t * Math.PI) * 0.3, 0.05, 0.25, 14), M.horn);
    spine.position.set(0, 0.62 - t * 0.5, -0.62 - t * 0.34);
    spine.rotation.x = -0.5 - t * 0.55;
    spine.castShadow = true;
    head.add(spine);
    crest.push(spine);
  }
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const spine = new THREE.Mesh(horn(0.42 + (1 - t) * 0.22, 0.06, 0.2, 14), M.horn);
    spine.position.set(0, -0.62 - t * 0.5, -0.74 - t * 0.1);
    spine.rotation.x = -1.0 - t * 0.2;
    spine.castShadow = true;
    body.add(spine);
    crest.push(spine);
  }

  /* ---------- barbels: two curved feelers either side of the jaw ------- */
  [-1, 1].forEach((side) => {
    for (let i = 0; i < 2; i++) {
      const len = 1.25 - i * 0.3;
      const droop = 0.5 + i * 0.2;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(len * 0.3 * side, -droop * 0.2, -len * 0.08),
        new THREE.Vector3(len * 0.62 * side, -droop * 0.72, -len * 0.26),
        new THREE.Vector3(len * 0.8 * side, -droop * 1.35, -len * 0.46)
      ]);
      const b = new THREE.Mesh(new THREE.TubeGeometry(curve, 22, 0.022 - i * 0.005, 7, false), M.furDeep);
      b.position.set(0.2 * side, -0.3 - i * 0.1, 1.5);
      b.rotation.y = -0.18 * side;
      b.castShadow = true;
      head.add(b);
    }
  });

  /* ---------- folded wings at the shoulders ---------------------------- */
  const wings = [];
  [-1, 1].forEach((side) => {
    const wing = new THREE.Group();
    wing.position.set(1.0 * side, -1.5, -0.5);
    wing.rotation.z = -0.5 * side;
    wing.rotation.y = 0.8 * side;
    body.add(wing);

    /* the arm, folded back on itself */
    const arm = new THREE.Mesh(horn(1.1, 0.085, 0.5, 18), M.fur);
    arm.rotation.z = -0.4 * side;
    arm.castShadow = true;
    wing.add(arm);

    /* four fingers, with membrane stretched between them */
    const tips = [];
    for (let i = 0; i < 4; i++) {
      const u = i / 3;
      const finger = new THREE.Mesh(horn(1.3 - u * 0.4, 0.045, 0.45, 16), M.horn);
      finger.position.set(0.1 * side, 0.95, 0);
      finger.rotation.z = (-0.1 - u * 0.5) * side;
      finger.rotation.x = -0.2 - u * 0.5;
      wing.add(finger);
      tips.push(finger);
    }

    const webShape = new THREE.Shape();
    webShape.moveTo(0, 0);
    webShape.quadraticCurveTo(0.5, 0.9, 0.2, 1.7);
    webShape.quadraticCurveTo(0.05, 1.1, -0.3, 0.6);
    webShape.quadraticCurveTo(-0.2, 0.2, 0, 0);
    const webGeo = new THREE.ExtrudeGeometry(webShape, { depth: 0.015, bevelEnabled: false, curveSegments: 12 });
    const web = new THREE.Mesh(webGeo, M.membrane);
    web.position.set(0.12 * side, 0.5, -0.04);
    web.rotation.z = -0.3 * side;
    web.castShadow = true;
    wing.add(web);

    wings.push(wing);
  });

  /* ---------- the sigil rings behind him ------------------------------ */
  const ringMat = (op) => new THREE.MeshBasicMaterial({ color: C.gold, transparent: true, opacity: op });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.012, 8, 160), ringMat(0.45));
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
  let roundNow = 0, roundTarget = 0;
  let pressNow = 0, pressTarget = 0;

  /* ---- visemes -------------------------------------------------------
     The jaw is driven by the letters actually being spoken rather than by
     noise. Each sound class gets a mouth shape: how far the jaw drops, and
     how wide the muzzle spreads. Crude next to a real phoneme aligner, but
     English orthography is regular enough that an open A reads as an open
     mouth and an M reads as a closed one, which is all the eye checks. */
  /* jaw, lateral spread, muzzle rounding, bilabial pressure */
  const SHAPES = {
    a: [0.95, 0.55, 0.08, 0], A: [0.95, 0.55, 0.08, 0],
    o: [0.80, 0.10, 1.0, 0], u: [0.55, 0.05, 0.88, 0], w: [0.40, 0.00, 0.78, 0],
    e: [0.55, 0.85, 0.05, 0], i: [0.38, 0.90, 0, 0], y: [0.38, 0.80, 0.08, 0],
    m: [0.02, 0.35, 0, 1], b: [0.05, 0.35, 0, 0.92], p: [0.05, 0.35, 0, 1],
    f: [0.16, 0.65, 0, 0.3], v: [0.16, 0.65, 0, 0.26],
    s: [0.14, 0.80, 0, 0], z: [0.14, 0.80, 0, 0], c: [0.18, 0.75, 0, 0], x: [0.20, 0.70, 0, 0],
    t: [0.22, 0.60, 0, 0], d: [0.24, 0.55, 0, 0], n: [0.20, 0.55, 0, 0], l: [0.30, 0.60, 0, 0],
    r: [0.34, 0.35, 0.24, 0], g: [0.30, 0.40, 0, 0], k: [0.30, 0.45, 0, 0], q: [0.35, 0.15, 0.66, 0],
    h: [0.30, 0.45, 0, 0], j: [0.28, 0.65, 0, 0]
  };
  const VOWELS = "aeiouy";
  let visQueue = [];          // [{ jaw, wide, round, press, dur }]
  let visHold = 0;            // time left on the current shape
  let visJaw = 0, visWide = 0, visRound = 0, visPress = 0;

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
      shapes.push({
        jaw: sh[0], wide: sh[1], round: sh[2] || 0, press: sh[3] || 0,
        v: isVowel, weight: isVowel ? 1.5 : 0.8
      });
    }
    if (!shapes.length) shapes.push({ jaw: 0.4, wide: 0.5, weight: 1 });
    const total = shapes.reduce((n, sh) => n + sh.weight, 0);
    const span = Math.max(0.1, seconds);
    visQueue = shapes.map((sh) => ({
      jaw: sh.jaw,
      wide: sh.wide,
      round: sh.round || 0,
      press: sh.press || 0,
      dur: Math.max(0.035, (sh.weight / total) * span)
    }));
    // every word ends by closing a little, which is what separates words
    visQueue.push({ jaw: 0.06, wide: 0.3, round: 0, press: 0, dur: 0.045 });
    visHold = 0;
  };
  let emphasis = 0;
  let blinkTimer = 1.5 + random() * 3, blink = 0, blinkSkew = 0;
  let earPerk = 0;
  const earFlick = [
    { wait: 0.6 + random() * 1.9, on: 0 },
    { wait: 0.6 + random() * 1.9, on: 0 }
  ];
  let headTilt = 0;
  const pointer = { x: 0, y: 0, active: false };
  const microGaze = { x: 0, y: 0, tx: 0, ty: 0, wait: 1.4 };

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
    if (document.hidden) return;

    if (!reduceMotion) {
      // breathing: faster and shallower while he talks, as it would be
      const rate = speaking ? 1.7 : 1.05;
      const breath = Math.sin(t * rate);
      chest.scale.set(1 + breath * 0.021, 1 + breath * 0.012, 1 + breath * 0.027);
      throatScutes.forEach((plate, i) => {
        plate.position.z = 1.06 - i * 0.075 + breath * (0.008 + i * 0.001);
      });
      nostrils.forEach((nostril, i) => {
        nostril.scale.y = 0.48 + (breath + 1) * 0.026 + (speaking ? 0.025 : 0);
        nostril.rotation.z = (i ? -1 : 1) * 0.2;
      });
      dragon.position.y = DRAGON_Y + Math.sin(t * 0.72) * 0.025;
      neck.rotation.z = Math.sin(t * 0.38) * 0.022;

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
        if (e.wait <= 0) { e.on = 0.2; e.wait = 1.1 + random() * 1.9; }
        if (e.on > 0) e.on = Math.max(0, e.on - dt);
      });
      ears.forEach((ear, i) => {
        const s = i === 0 ? -1 : 1;
        const flick = Math.sin((earFlick[i].on / 0.2) * Math.PI) * 0.13;
        const swivel = listening ? Math.sin(t * 0.7 + i * 1.7) * 0.055 : 0;
        /* Preserve the broad frill's sculpted resting angles; the old fox
           constants folded both fans too far into the skull each frame. */
        ear.rotation.z = (-0.42 + earPerk * 0.07) * s + (Math.sin(t * 0.82 + i * 2) * 0.018 + flick) * s;
        ear.rotation.x = -0.2 - earPerk * 0.07 + Math.sin(t * 0.62 + i) * 0.014;
        ear.rotation.y = 0.62 * s + swivel * s;
      });
      wings.forEach((wing, i) => {
        const side = i ? 1 : -1;
        wing.rotation.x = Math.sin(t * 0.52 + i * 0.8) * 0.025 - (speaking ? 0.018 : 0);
        wing.rotation.z = (-0.5 + breath * 0.012) * side;
      });
      crest.forEach((spine, i) => {
        const base = spine.userData.restX ?? spine.rotation.x;
        spine.userData.restX = base;
        spine.rotation.x = base + Math.sin(t * 0.55 - i * 0.22) * 0.012;
      });
    }

    // a quizzical head tilt while he is being asked something
    headTilt += ((listening ? 0.16 : 0) - headTilt) * 0.04;

    // ShakDrah's gaze settles slowly, with sparse deliberate micro-saccades
    microGaze.wait -= dt;
    if (microGaze.wait <= 0) {
      microGaze.tx = (random() - 0.5) * 0.03;
      microGaze.ty = (random() - 0.5) * 0.018;
      microGaze.wait = 1.8 + random() * 2.8;
    }
    microGaze.x += (microGaze.tx - microGaze.x) * (1 - Math.exp(-dt * 9));
    microGaze.y += (microGaze.ty - microGaze.y) * (1 - Math.exp(-dt * 9));
    const tx = (pointer.active ? pointer.x * 0.27 : Math.sin(t * 0.25) * 0.055) + microGaze.x;
    const ty = (pointer.active ? pointer.y * 0.17 : Math.cos(t * 0.2) * 0.036) + microGaze.y;
    head.rotation.y += (tx - head.rotation.y) * 0.055;
    head.rotation.x += (ty * 0.55 - head.rotation.x) * 0.055;
    head.rotation.z += (headTilt - head.rotation.z) * 0.06;
    neck.rotation.y += (tx * 0.35 - neck.rotation.y) * 0.03;
    eyeRigs.forEach((e) => {
      /* The eyes counter-rotate against the head, so that wherever the skull
         turns the gaze stays on the viewer — the trick portrait painters use. */
      e.globe.rotation.y = e.restY - head.rotation.y * 0.55 - tx * 0.18;
      e.globe.rotation.x = -head.rotation.x * 0.45 + ty * 0.14;
      // ShakDrah keeps a narrow reptilian slit, dilating only with attention
      const target = listening ? 0.55 : (speaking ? 0.44 : 0.34);
      e.pupil.scale.x += (target - e.pupil.scale.x) * 0.045;
      e.pupil.scale.y += ((speaking ? 1.1 : 1.08) - e.pupil.scale.y) * 0.035;
      e.iris.material.emissiveIntensity = 0.09 + emphasis * 0.055;
    });

    // blinking — fast close, slower open, the two lids very slightly offset
    blinkTimer -= dt;
    if (blinkTimer <= 0) {
      blink = 1; blinkSkew = (random() - 0.5) * 0.12;
      blinkTimer = 2.2 + random() * 5;
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
        visRound = nextShape.round || 0; visPress = nextShape.press || 0;
        visHold += nextShape.dur;
      }
      if (!visQueue.length && visHold <= 0) {
        /* Between boundary events, or in a browser that reports none, he
           keeps a low murmur going rather than freezing mid-word. */
        visJaw = 0.26 + 0.22 * Math.abs(Math.sin(t * 5.4));
        visWide = 0.45 + 0.15 * Math.sin(t * 3.1);
        visRound = 0.12 + 0.1 * Math.abs(Math.sin(t * 2.6));
        visPress = 0;
      }
      emphasis = Math.max(0, emphasis - dt * 3.2);
      jawTarget = 0.035 + 0.42 * visJaw + emphasis * 0.05;
      wideTarget = visWide;
      roundTarget = visRound;
      pressTarget = visPress;
      tongue.position.y = -0.02 - jawNow * 0.08 + roundNow * 0.018;
    } else {
      emphasis = 0;
      visQueue.length = 0; visHold = 0; visJaw = 0; visWide = 0; visRound = 0; visPress = 0;
      jawTarget = 0.012 + Math.sin(t * 0.9) * 0.008;
      wideTarget = 0; roundTarget = 0; pressTarget = 0;
    }
    const opening = jawTarget > jawNow;
    const kJaw = 1 - Math.exp(-dt * (opening ? 34 : 19));
    jawNow += (jawTarget - jawNow) * kJaw;
    wideNow += (wideTarget - wideNow) * (1 - Math.exp(-dt * 22));
    roundNow += (roundTarget - roundNow) * (1 - Math.exp(-dt * 20));
    pressNow += (pressTarget - pressNow) * (1 - Math.exp(-dt * 28));
    jaw.rotation.x = jawNow * (1 - pressNow * 0.27);
    jaw.position.y = -0.42 - jawNow * 0.062 + pressNow * 0.008;
    jaw.position.z = 0.28 + roundNow * 0.018;
    /* Reptilian articulation is weightier and less lip-led than Gink's, but
       rounded vowels and bilabials still need visibly different silhouettes. */
    snout.scale.x = 1 + jawNow * 0.038 + wideNow * 0.046 - roundNow * 0.018;
    snout.scale.y = 1 + roundNow * 0.052 - pressNow * 0.026;
    snout.scale.z = 1 + roundNow * 0.064;
    nose.position.y = -0.2 + roundNow * 0.007;
    nose.position.z = 1.98 + roundNow * 0.016;
    cavity.scale.x = 1 + wideNow * 0.045 - roundNow * 0.08;
    cavity.scale.y = 1 + jawNow * 2.05;
    tongue.scale.x = 1 + wideNow * 0.045 - roundNow * 0.07;

    renderer.render(scene, camera);
  };
  animate();

  /* ======================================================== the voice */
  const VOICE_KEY = "shakdrah";
  const voiceProfile = AVATAR_VOICE_PROFILES[VOICE_KEY];
  const synth = window.speechSynthesis;
  const canSpeak = !!synth && typeof SpeechSynthesisUtterance === "function";
  const canSpeakNaturally = NaturalVoiceEngine.isSupported();
  const naturalPreferenceKey = "tti-shakdrah-natural-voice";
  const neuralVoicePreferenceKey = "tti-shakdrah-neural-male-voice";
  let chosenVoice = null;
  let naturalVoice = null;
  let naturalWanted = false;
  let selectedNeuralVoice = voiceProfile.neuralVoice;
  try {
    naturalWanted = localStorage.getItem(naturalPreferenceKey) === "1";
    const remembered = localStorage.getItem(neuralVoicePreferenceKey);
    selectedNeuralVoice = getMaleNeuralVoice(remembered)?.id || voiceProfile.neuralVoice;
  } catch {
    naturalWanted = false;
    selectedNeuralVoice = voiceProfile.neuralVoice;
  }
  if (neuralVoiceSelect) neuralVoiceSelect.value = selectedNeuralVoice;

  const pickVoice = () => {
    if (!canSpeak) return null;
    chosenVoice = rankNativeVoices(synth.getVoices(), VOICE_KEY)[0] || null;
    return chosenVoice;
  };

  const selectedVoiceLabel = () => {
    const selected = getMaleNeuralVoice(naturalVoice?.voiceId || selectedNeuralVoice);
    return selected ? `${selected.name} (${selected.accent})` : selectedNeuralVoice;
  };

  const readyLine = () => {
    if (naturalWanted && canSpeakNaturally) {
      return naturalVoice?.ready
        ? `Ready — ${selectedVoiceLabel()} is generated privately on this device.`
        : `Natural voice selected — ${selectedVoiceLabel()} will load only when ShakDrah next speaks.`;
    }
    if (!canSpeak) return "No speech synthesiser here — ShakDrah will mouth the words silently.";
    if (!chosenVoice) return "Ready. Ask the oracle and ShakDrah will read the answer aloud.";
    return /^en[-_]GB/i.test(chosenVoice.lang)
      ? `Ready — using ${chosenVoice.name}, the best British voice installed here.`
      : `Ready — no British voice is installed, so ${chosenVoice.name} stands in.`;
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

  /* ----------------------------------------------------------------------
     Speaking the grades out loud
     ----------------------------------------------------------------------
     On the page a claim is graded by a coloured diamond, which is silent:
     a listener gets the words and loses the order's judgement of them.
     So when ShakDrah meets a graded claim he reads the claim, leaves a beat,
     and then says what it was graded as, in the legend's own wording.
     The diamond itself is never pronounced.
  ---------------------------------------------------------------------- */
  const GRADE_SAID = {
    sci:  "established science",
    hist: "scholarship and history",
    spec: "speculative and contested",
    myth: "myth, tradition and primary esoteric text"
  };
  /* The label written after the diamond in prose, mapped to its grade. */
  const GRADE_WORD = {
    established: "sci", tested: "sci", proven: "sci", settled: "sci", science: "sci",
    measured: "sci", provable: "sci", demonstrated: "sci", observed: "sci", verified: "sci",
    scholarship: "hist", history: "hist", historical: "hist", documented: "hist",
    attested: "hist", record: "hist", recorded: "hist",
    speculative: "spec", speculation: "spec", contested: "spec", open: "spec",
    unknown: "spec", conjecture: "spec", hypothesis: "spec", unproven: "spec",
    unsettled: "spec", disputed: "spec",
    myth: "myth", mythic: "myth", tradition: "myth", traditional: "myth",
    symbol: "myth", symbolic: "myth", esoteric: "myth", legend: "myth"
  };
  const GRADE_PAUSE = 1000;     // the beat before the verdict, in milliseconds

  /* A diamond, then any grading label that follows it, then the claim it
     governs — which runs to the next diamond or the end of the passage. */
  const MARK = /\u25c6\s*([A-Za-z]+)?/g;

  /* Turn a passage into a running order: lines to say and beats to leave.
     Text with no diamonds in it comes back as plain lines, exactly as
     before, so the oracle's own answers are unaffected. */
  const scriptFrom = (text) => {
    const src = String(text || "");
    if (src.indexOf("\u25c6") === -1) return chunk(src).map((line) => ({ line }));

    const parts = [];               // { grade, body }
    let at = 0, grade = null, m;
    MARK.lastIndex = 0;
    while ((m = MARK.exec(src))) {
      parts.push({ grade, body: src.slice(at, m.index) });
      const word = (m[1] || "").toLowerCase();
      const known = Object.prototype.hasOwnProperty.call(GRADE_WORD, word);
      grade = known ? GRADE_WORD[word] : null;
      /* A recognised label is the grade's own name: it is spoken at the end
         as the verdict, not read out in the middle of the sentence. */
      at = known ? m.index + m[0].length : m.index + 1;
    }
    parts.push({ grade, body: src.slice(at) });

    const out = [];
    for (const part of parts) {
      const body = part.body.replace(/^[\s:;,.\u2014-]+/, "").trim();
      if (body) for (const line of chunk(body)) out.push({ line });
      if (part.grade && body) {
        out.push({ wait: GRADE_PAUSE });
        out.push({ line: `This has been graded as ${GRADE_SAID[part.grade]}.` });
      }
    }
    return out.length ? out : chunk(src).map((line) => ({ line }));
  };

  /* The same thing read straight off the page, where the grade is not a
     label in the text but a class on the element holding the diamond. */
  const textWithMarks = (node) => {
    if (!node) return "";
    const copy = node.cloneNode(true);
    copy.querySelectorAll(".sci, .hist, .spec, .myth").forEach((el) => {
      const key = ["sci", "hist", "spec", "myth"].find((k) => el.classList.contains(k));
      const inner = el.textContent.replace(/\u25c6/g, " ").trim();
      el.replaceWith(document.createTextNode(` \u25c6${key} ${inner} `));
    });
    return copy.textContent.replace(/\s+/g, " ").trim();
  };
  /* The class names are the grade words too, so the reader above finds them. */
  GRADE_WORD.sci = "sci"; GRADE_WORD.hist = "hist";
  GRADE_WORD.spec = "spec"; GRADE_WORD.myth = "myth";

  let queue = [], muted = false, lastText = "", silentTimer = null, paused = false;
  let mimeTimer = null;
  let speechRequest = 0;
  const RATE = voiceProfile.nativeRate;
  const PITCH = voiceProfile.nativePitch;
  const CPS = 13.5 * RATE;      // characters per second at this speaking rate

  /* HeadTTS supplies Oculus viseme names and true phoneme timings. These
     character-specific jaw/width targets replace spelling-based guesses
     whenever the natural voice is active. */
  const NEURAL_SHAPES = {
    sil: [0.02, 0.25, 0, 0], PP: [0.03, 0.32, 0, 1], FF: [0.14, 0.64, 0, 0.3], TH: [0.18, 0.58, 0, 0],
    DD: [0.23, 0.58, 0, 0], kk: [0.31, 0.42, 0, 0], CH: [0.28, 0.68, 0, 0], SS: [0.14, 0.8, 0, 0],
    nn: [0.2, 0.55, 0, 0], RR: [0.34, 0.35, 0.24, 0], aa: [0.94, 0.53, 0.08, 0], E: [0.56, 0.84, 0.04, 0],
    I: [0.38, 0.9, 0, 0], O: [0.8, 0.12, 1, 0], U: [0.54, 0.06, 0.88, 0]
  };
  const mouthViseme = ({ viseme, duration }) => {
    const shape = NEURAL_SHAPES[viseme] || NEURAL_SHAPES.sil;
    visQueue = [{
      jaw: shape[0], wide: shape[1], round: shape[2], press: shape[3],
      dur: Math.max(0.035, duration || 0.08)
    }];
    visHold = 0;
  };

  naturalVoice = new NaturalVoiceEngine({
    profile: VOICE_KEY,
    voice: selectedNeuralVoice,
    onStatus: ({ text }) => { if (naturalWanted && !muted) setStatus(text); },
    onStart: () => {
      speaking = true;
      paused = false;
      if (btnStop) btnStop.disabled = false;
      setStatus(`Speaking — ${naturalVoice.voiceLabel}, generated locally.`);
    },
    onEnd: ({ cancelled }) => {
      speaking = false;
      paused = false;
      visQueue.length = 0; visHold = 0;
      if (btnStop) btnStop.disabled = true;
      if (!cancelled) setStatus("Finished. Test everything kindly.");
    },
    onViseme: mouthViseme,
    onWord: ({ word }) => { emphasis = /[.!?]$/.test(word) ? 1 : 0.35; },
    onError: (error) => console.warn("ShakDrah natural voice:", error)
  });

  const paintNatural = () => {
    if (neuralVoiceSelect) neuralVoiceSelect.disabled = !canSpeakNaturally;
    if (!btnNatural) return;
    btnNatural.hidden = !canSpeakNaturally;
    btnNatural.disabled = !canSpeakNaturally;
    btnNatural.setAttribute("aria-pressed", naturalWanted ? "true" : "false");
    btnNatural.textContent = naturalWanted ? "Natural voice: on" : "Natural voice: off";
    btnNatural.title = naturalWanted
      ? "Use the immediate voice installed on this device instead"
      : "Download and run ShakDrah's more realistic neural voice in this browser";
  };
  neuralVoiceSelect?.addEventListener("change", () => {
    const selected = getMaleNeuralVoice(neuralVoiceSelect.value);
    if (!selected) {
      neuralVoiceSelect.value = naturalVoice.voiceId;
      return;
    }
    stop();
    naturalVoice.setVoice(selected.id);
    selectedNeuralVoice = selected.id;
    try { localStorage.setItem(neuralVoicePreferenceKey, selected.id); } catch { /* private window */ }
    setStatus(naturalWanted
      ? `${naturalVoice.voiceLabel} selected — press Speak to hear ShakDrah use it.`
      : `${naturalVoice.voiceLabel} selected for Natural voice mode.`);
  });

  btnNatural?.addEventListener("click", async () => {
    naturalWanted = !naturalWanted;
    try { localStorage.setItem(naturalPreferenceKey, naturalWanted ? "1" : "0"); } catch { /* private window */ }
    speechRequest += 1;
    naturalVoice.stop({ notify: false });
    if (canSpeak) synth.cancel();
    paintNatural();
    if (!naturalWanted) { setStatus(readyLine()); return; }
    btnNatural.disabled = true;
    try {
      await naturalVoice.connect();
      setStatus(readyLine());
    } catch (error) {
      naturalWanted = false;
      try { localStorage.setItem(naturalPreferenceKey, "0"); } catch { /* private window */ }
      setStatus(`Natural voice could not load (${String(error?.message || error).slice(0, 90)}). The installed voice remains ready.`);
    } finally {
      paintNatural();
    }
  });
  paintNatural();

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
    speechRequest += 1;
    queue = []; speaking = false; paused = false;
    visQueue.length = 0; visHold = 0;
    clearTimeout(silentTimer);
    clearTimeout(mimeTimer); mimeTimer = null;
    naturalVoice.stop({ notify: false });
    if (canSpeak) synth.cancel();
    if (btnStop) btnStop.disabled = true;
    setStatus(readyLine());
  };

  const sayNext = (request) => {
    if (request !== speechRequest) return;
    clearTimeout(mimeTimer); mimeTimer = null;
    if (!queue.length) {
      speaking = false;
      visQueue.length = 0; visHold = 0;
      if (btnStop) btnStop.disabled = true;
      setStatus("Finished. Test everything kindly.");
      return;
    }
    const item = queue.shift();
    if (item && item.wait) {
      /* A beat before the verdict. The mouth rests; the queue goes on. */
      speaking = true;
      mimeTimer = setTimeout(() => sayNext(request), item.wait);
      return;
    }
    const sourceLine = typeof item === "string" ? item : item.line;
    const line = normaliseSpeechText(sourceLine, VOICE_KEY);
    if (!line) { sayNext(request); return; }
    const u = new SpeechSynthesisUtterance(line);
    if (chosenVoice) { u.voice = chosenVoice; u.lang = chosenVoice.lang; } else u.lang = "en-GB";
    u.rate = RATE; u.pitch = PITCH; u.volume = 1;
    let sawBoundary = false;
    u.onstart = () => {
      if (request !== speechRequest) return;
      speaking = true;
      /* Chrome and Safari fire word boundaries; Firefox often does not. Give
         it a moment, and if nothing arrives, mime the line on a timer so the
         mouth still follows the words instead of inventing them. */
      setTimeout(() => { if (request === speechRequest && speaking && !sawBoundary) mimeText(line); }, 320);
    };
    u.onboundary = (e) => {
      if (request !== speechRequest) return;
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
    u.onend = () => sayNext(request);
    u.onerror = () => sayNext(request);
    synth.speak(u);
  };

  const speakNative = (text, request, fallbackNote = "") => {
    naturalVoice.stop({ notify: false });
    if (!canSpeak) {
      speaking = true;
      if (btnStop) btnStop.disabled = false;
      setStatus(fallbackNote || "Mouthing the answer — this device has no speech synthesiser.");
      clearTimeout(silentTimer);
      clearTimeout(mimeTimer); mimeTimer = null;
      const performance = normaliseSpeechText(
        scriptFrom(text).filter((item) => item.line).map((item) => item.line).join(" "),
        VOICE_KEY
      );
      mimeText(performance);
      silentTimer = setTimeout(() => {
        if (request !== speechRequest) return;
        speaking = false;
        if (btnStop) btnStop.disabled = true;
        setStatus(readyLine());
      }, Math.min(45000, 55 * text.length));
      return;
    }
    synth.cancel();
    if (!chosenVoice) pickVoice();
    queue = scriptFrom(text);
    speaking = true;
    paused = false;
    if (btnStop) btnStop.disabled = false;
    setStatus(fallbackNote || (chosenVoice ? `Speaking — ${chosenVoice.name}.` : "Speaking."));
    sayNext(request);
  };

  const speak = (text) => {
    if (!text) return;
    lastText = text;
    if (btnSpeak) btnSpeak.disabled = false;
    if (muted) return;

    const request = ++speechRequest;
    clearTimeout(silentTimer);
    clearTimeout(mimeTimer); mimeTimer = null;
    queue = [];
    if (canSpeak) synth.cancel();

    if (naturalWanted && canSpeakNaturally) {
      speaking = false; // model preparation is not mouth movement
      paused = false;
      if (btnStop) btnStop.disabled = false;
      naturalVoice.speak(scriptFrom(text)).catch((error) => {
        if (request !== speechRequest || muted) return;
        naturalWanted = false;
        try { localStorage.setItem(naturalPreferenceKey, "0"); } catch { /* private window */ }
        paintNatural();
        const reason = String(error?.message || error || "unavailable").slice(0, 90);
        speakNative(text, request,
          `Natural voice unavailable (${reason}); continuing with the best installed voice.`);
      });
      return;
    }
    speakNative(text, request);
  };

  btnSpeak?.addEventListener("click", () => {
    speak(lastText || (
      "I am ShakDrah, the order's familiar. Ask the oracle a question and I will read its answer aloud. " +
      "Everything I say was written in advance by the order and graded by its rules on evidence. " +
      "Test everything kindly."
    ));
  });
  btnStop?.addEventListener("click", stop);
  if (btnStop) btnStop.disabled = true;
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });

  /* Hold him mid-sentence and let him go on again. Neural audio resumes
     from its exact Web Audio offset; native speech uses the browser engine. */
  const hold = () => {
    if (naturalWanted && naturalVoice.pause()) {
      paused = true;
      speaking = false;
      setStatus("Paused.");
      return true;
    }
    if (!canSpeak || !speaking) return false;
    try { synth.pause(); } catch { return false; }
    paused = true;
    setStatus("Paused.");
    return true;
  };
  const resume = () => {
    if (!paused) return false;
    if (naturalWanted && naturalVoice.resume()) {
      paused = false;
      speaking = true;
      setStatus(`Speaking — ${naturalVoice.voiceLabel}, generated locally.`);
      return true;
    }
    if (!canSpeak) return false;
    try { synth.resume(); } catch { return false; }
    paused = false;
    speaking = true;
    setStatus(chosenVoice ? `Speaking — ${chosenVoice.name}.` : "Speaking.");
    return true;
  };
  const again = () => {
    if (!lastText) return false;
    paused = false;
    stop();
    speak(lastText);
    return true;
  };

  /** Read an element of the page aloud, grades and all: the diamonds are
      not pronounced, but after each graded claim he says how it is filed. */
  const speakNode = (el) => {
    const node = typeof el === "string" ? document.querySelector(el) : el;
    if (!node) return false;
    const text = textWithMarks(node);
    if (!text) return false;
    speak(text);
    return true;
  };

  window.EGDragon = {
    speak, speakNode, available: true, stop,
    hold, resume, again,
    get paused() { return paused; },
    get speaking() { return speaking; },
    get lastText() { return lastText; },
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
