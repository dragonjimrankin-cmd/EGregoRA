/* ===========================================================================
   The Turning Shop — a basic 3D modelling bench on the Ask Ed page
   ---------------------------------------------------------------------------
   Blocks and primitives, the way a piece is roughed out before it is
   sculpted: add a solid, move it, turn it, scale it, colour it. Everything
   happens in this page — no upload, no service, no account. The model can be
   taken away as an OBJ (with an MTL for the colours) that any 3D program will
   open, or the current view can be handed to the image generator as a sketch
   so a photograph is rendered from the arrangement you actually built.
   ======================================================================== */
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { buildLibrary } from "./model-library.js";

const stage = document.getElementById("model-stage");
if (stage) start();

function start() {
  const statusEl = document.getElementById("md-status");
  const msgEl = document.getElementById("md-msg");
  const sliders = document.getElementById("model-sliders");
  const say = (t) => { if (statusEl) statusEl.textContent = t; };
  const note = (t, bad) => {
    if (!msgEl) return;
    msgEl.textContent = t || "";
    msgEl.className = "auth-msg" + (bad ? " is-bad" : "");
  };

  /* --- the room ---------------------------------------------------------- */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0a12);

  const camera = new THREE.PerspectiveCamera(45, 16 / 10, 0.1, 500);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
  } catch {
    stage.classList.add("model-stage--failed");
    stage.textContent = "This browser will not open a 3D window.";
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  stage.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xfff0d0, 0x20202c, 1.1));
  const key = new THREE.DirectionalLight(0xffe9c0, 1.5);
  key.position.set(6, 9, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fa0ff, 0.5);
  rim.position.set(-7, 3, -6);
  scene.add(rim);

  const grid = new THREE.GridHelper(20, 20, 0xd7b05a, 0x2a2740);
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  scene.add(grid);

  const pieces = new THREE.Group();
  scene.add(pieces);

  /* --- the camera on a leash --------------------------------------------- */
  let yaw = 0.7, pitch = 0.5, dist = 14;
  const place = () => {
    camera.position.set(
      dist * Math.cos(pitch) * Math.sin(yaw),
      dist * Math.sin(pitch),
      dist * Math.cos(pitch) * Math.cos(yaw)
    );
    camera.lookAt(0, 1, 0);
  };
  place();

  const size = () => {
    const w = stage.clientWidth || 640;
    const h = Math.max(320, Math.round(w * 0.62));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  size();
  window.addEventListener("resize", size);

  let dragging = false, lastX = 0, lastY = 0, moved = 0;

  /* --- shifting the piece with the mouse over the window -------------------
     Hold Ctrl and the held pieces follow the mouse across the floor — left
     and right, nearer and further. Hold Alt and they move in the upright
     plane instead — left and right, up and down. No button is needed: the
     hand hovers, the modifier is down, the piece moves. The arrow keys do
     the same in steps for anyone who would rather not drag. */
  let hovering = false, overX = 0, overY = 0, haveOver = false;
  const nudging = { ctrl: false, alt: false };
  const mode = () => (nudging.ctrl ? "floor" : nudging.alt ? "upright" : null);

  function shift(dx, dy) {
    if (!picked.length || !mode()) return;
    const k = dist * 0.0016;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
    right.y = 0;
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    right.normalize();
    const move = new THREE.Vector3();
    if (mode() === "floor") {
      const into = new THREE.Vector3(-right.z, 0, right.x);   /* away from the eye */
      move.addScaledVector(right, dx * k).addScaledVector(into, dy * k);
    } else {
      move.addScaledVector(right, dx * k).addScaledVector(new THREE.Vector3(0, 1, 0), -dy * k);
    }
    picked.forEach((o) => {
      o.position.add(move);
      if (o.userData.anim) rebase(o);
    });
    refreshHalos();
    load();
  }

  function sayMode() {
    const m = mode();
    stage.classList.toggle("is-nudging", Boolean(m));
    if (!m) { if (picked.length || pieces.children.length) say(describe()); return; }
    if (!picked.length) { say("Nothing is held \u2014 click a piece first, then Ctrl or Alt will move it."); return; }
    say(m === "floor"
      ? "Ctrl: moving across the floor. Mouse or arrow keys \u2014 left and right, nearer and further."
      : "Alt: moving in the upright plane. Mouse or arrow keys \u2014 left and right, up and down.");
  }

  stage.addEventListener("pointerenter", (e) => {
    hovering = true; overX = e.clientX; overY = e.clientY; haveOver = true;
  });
  stage.addEventListener("pointerleave", () => {
    hovering = false; haveOver = false;
    nudging.ctrl = false; nudging.alt = false;
    sayMode();
  });

  window.addEventListener("keydown", (e) => {
    if (!hovering) return;
    if (e.key === "Control" || e.key === "Alt") {
      const was = mode();
      nudging.ctrl = e.ctrlKey || e.key === "Control";
      nudging.alt = e.altKey || e.key === "Alt";
      if (mode() !== was) sayMode();
      e.preventDefault();
      return;
    }
    if (!mode() || !picked.length) return;
    const step = e.shiftKey ? 48 : 18;
    if (e.key === "ArrowLeft") shift(-step, 0);
    else if (e.key === "ArrowRight") shift(step, 0);
    else if (e.key === "ArrowUp") shift(0, -step);
    else if (e.key === "ArrowDown") shift(0, step);
    else return;
    e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    if (e.key !== "Control" && e.key !== "Alt" && e.ctrlKey === nudging.ctrl && e.altKey === nudging.alt) return;
    const was = mode();
    nudging.ctrl = e.key === "Control" ? false : e.ctrlKey;
    nudging.alt = e.key === "Alt" ? false : e.altKey;
    if (mode() !== was) sayMode();
  });
  window.addEventListener("blur", () => {
    nudging.ctrl = false; nudging.alt = false; sayMode();
  });

  renderer.domElement.addEventListener("pointerdown", (e) => {
    if (mode()) { e.preventDefault(); return; }    /* a modifier is held: no orbiting */
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
    renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    const dx0 = haveOver ? e.clientX - overX : 0;
    const dy0 = haveOver ? e.clientY - overY : 0;
    overX = e.clientX; overY = e.clientY; haveOver = true;
    if (mode()) {
      /* The modifier wins: the piece follows the hand, the camera stays put. */
      nudging.ctrl = e.ctrlKey; nudging.alt = e.altKey && !e.ctrlKey;
      if (mode()) { shift(dx0, dy0); e.preventDefault(); return; }
      sayMode();
    }
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    yaw -= dx * 0.006;
    pitch = Math.max(-1.3, Math.min(1.4, pitch + dy * 0.006));
    place();
  });
  renderer.domElement.addEventListener("contextmenu", (e) => { if (mode()) e.preventDefault(); });
  const release = (e) => {
    if (!dragging) return;
    if (mode()) { dragging = false; return; }
    dragging = false;
    if (moved < 4) pick(e);       // a click, not a drag: try to select
  };
  renderer.domElement.addEventListener("pointerup", release);
  renderer.domElement.addEventListener("pointercancel", () => { dragging = false; });
  renderer.domElement.addEventListener("wheel", (e) => {
    e.preventDefault();
    dist = Math.max(4, Math.min(40, dist + Math.sign(e.deltaY) * 1.1));
    place();
  }, { passive: false });

  /* --- the solids --------------------------------------------------------- */
  const SHAPES = {
    box: () => new THREE.BoxGeometry(2, 2, 2),
    sphere: () => new THREE.SphereGeometry(1.2, 32, 24),
    cylinder: () => new THREE.CylinderGeometry(1, 1, 2.4, 32),
    cone: () => new THREE.ConeGeometry(1.2, 2.6, 32),
    torus: () => new THREE.TorusGeometry(1.2, 0.42, 20, 40)
  };

  let colour = "#d7b05a";
  let finish = "satin";

  /* How a surface behaves in the light. Four is enough to tell brass from
     oak from glass without turning the bench into a material editor. */
  const FINISH = {
    matt: { roughness: 0.95, metalness: 0.0, opacity: 1, transparent: false },
    satin: { roughness: 0.42, metalness: 0.22, opacity: 1, transparent: false },
    metal: { roughness: 0.22, metalness: 0.9, opacity: 1, transparent: false },
    glass: { roughness: 0.08, metalness: 0.1, opacity: 0.42, transparent: true }
  };
  const skin = (c) => new THREE.MeshStandardMaterial(
    Object.assign({ color: new THREE.Color(c) }, FINISH[finish] || FINISH.satin));

  /* --- what is picked up ---------------------------------------------------
     More than one piece can be held at once: Shift or Ctrl while clicking
     adds to the handful, and every tool below — colour, finish, duplicate,
     delete, the sliders, the animator — acts on all of them. The last one
     touched is the primary: it is what the sliders read their numbers from. */
  let picked = [];
  let chosen = null;
  const halos = new THREE.Group();
  scene.add(halos);

  function drawHalos() {
    while (halos.children.length) halos.remove(halos.children[0]);
    picked.forEach((o) => {
      const h = new THREE.BoxHelper(o, o === chosen ? 0x7fae7a : 0xd7b05a);
      halos.add(h);
    });
  }
  const refreshHalos = () => halos.children.forEach((h) => h.update());

  function describe() {
    if (!picked.length) {
      return pieces.children.length
        ? "Nothing selected. Click a piece to pick it up; hold Shift to pick up several."
        : "Add a solid to begin. Click a solid to select it; drag the background to turn the view.";
    }
    if (picked.length === 1) {
      return "Selected: " + (chosen.userData.kind || "a piece") +
        ". Use the sliders to move, turn and size it, recolour it with the swatches, " +
        "or press Animate to set it going.";
    }
    return "Selected: " + picked.length + " pieces. Colour, finish, duplicate, delete and the " +
      "animator act on all of them; the sliders move them together.";
  }

  function select(obj, additive) {
    if (!obj) picked = [];
    else if (additive) {
      const i = picked.indexOf(obj);
      if (i >= 0) picked.splice(i, 1); else picked.push(obj);
    } else picked = [obj];
    chosen = picked.length ? picked[picked.length - 1] : null;
    drawHalos();
    if (sliders) sliders.hidden = !chosen;
    if (chosen) load();
    say(describe());
  }

  function add(kind) {
    const geo = (SHAPES[kind] || SHAPES.box)();
    const mesh = new THREE.Mesh(geo, skin(colour));
    mesh.position.set((Math.random() - 0.5) * 3, 1.4, (Math.random() - 0.5) * 3);
    mesh.userData = { kind, colour };
    pieces.add(mesh);
    select(mesh);
  }

  /* --- the pattern book ---------------------------------------------------
     Ready-made pieces, built out of primitives on the spot. A piece arrives
     as a group: it moves, turns, scales and recolours like anything else,
     and the OBJ writer walks it the same way. */
  const LIBRARY = buildLibrary(THREE);

  function addFromBook(item) {
    const g = item.make(colour);
    g.userData = { kind: item.label, colour, fromBook: true };
    g.position.set((Math.random() - 0.5) * 2.5, 0, (Math.random() - 0.5) * 2.5);
    pieces.add(g);
    select(g);
    say("Placed: " + item.label + ". Drag the background to walk round it.");
  }

  const book = document.getElementById("pattern-book");
  const shelf = document.getElementById("pb-shelf");
  const search = document.getElementById("pb-search");
  const count = document.getElementById("pb-count");
  const bookBtn = document.getElementById("md-book");

  /* --- the plates in the book ---------------------------------------------
     A name is a poor picture of a shape, so every piece in the book is drawn
     rather than written: a second, tiny renderer builds each model once,
     frames it, photographs it on a transparent ground and keeps the picture.
     It is all local and takes a fraction of a second \u2014 nothing is fetched. */
  const thumbs = new Map();
  let shutter = null;

  function photographer() {
    if (shutter) return shutter;
    let r;
    try {
      r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch { return null; }
    r.setPixelRatio(2);
    r.setSize(72, 72, false);
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xfff0d0, 0x20202c, 1.3));
    const k = new THREE.DirectionalLight(0xffe9c0, 1.6);
    k.position.set(4, 7, 5);
    sc.add(k);
    const rimLight = new THREE.DirectionalLight(0x8fa0ff, 0.6);
    rimLight.position.set(-5, 2, -4);
    sc.add(rimLight);
    const cam = new THREE.PerspectiveCamera(32, 1, 0.05, 400);
    shutter = { r, sc, cam };
    return shutter;
  }

  function thumbFor(item) {
    if (thumbs.has(item.id)) return thumbs.get(item.id);
    const shop = photographer();
    if (!shop) return null;
    let url = null;
    const piece = item.make("#d7b05a");
    shop.sc.add(piece);
    try {
      piece.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(piece);
      const mid = box.getCenter(new THREE.Vector3());
      const span = box.getSize(new THREE.Vector3());
      const reach = Math.max(span.x, span.y, span.z) || 1;
      const away = reach * 2.1;
      shop.cam.position.set(mid.x + away * 0.78, mid.y + away * 0.62, mid.z + away * 0.78);
      shop.cam.lookAt(mid);
      shop.cam.near = Math.max(0.05, away * 0.05);
      shop.cam.far = away * 8;
      shop.cam.updateProjectionMatrix();
      shop.r.render(shop.sc, shop.cam);
      url = shop.r.domElement.toDataURL("image/png");
    } catch { url = null; }
    shop.sc.remove(piece);
    dispose(piece);
    thumbs.set(item.id, url);
    return url;
  }

  function fillShelf(q) {
    if (!shelf) return;
    const want = String(q || "").trim().toLowerCase();
    const groups = new Map();
    let shown = 0;
    LIBRARY.forEach((item) => {
      if (want && !(item.label + " " + item.id + " " + item.group).toLowerCase().includes(want)) return;
      if (!groups.has(item.group)) groups.set(item.group, []);
      groups.get(item.group).push(item);
      shown++;
    });
    shelf.textContent = "";
    groups.forEach((items, name) => {
      const h = document.createElement("h4");
      h.textContent = name;
      shelf.appendChild(h);
      const row = document.createElement("div");
      row.className = "book-row";
      items.forEach((item) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "tool book-piece";
        b.title = item.label;
        b.setAttribute("aria-label", item.label);
        const art = thumbFor(item);
        if (art) {
          const img = document.createElement("img");
          img.src = art;
          img.alt = "";
          img.width = 72;
          img.height = 72;
          b.appendChild(img);
        } else {
          b.textContent = item.label;      /* no 3D here: the names will do */
        }
        b.addEventListener("click", () => addFromBook(item));
        row.appendChild(b);
      });
      shelf.appendChild(row);
    });
    if (count) count.textContent = shown + " of " + LIBRARY.length + " pieces";
    if (!shown) {
      const p = document.createElement("p");
      p.className = "muted small";
      p.textContent = "Nothing in the book by that name.";
      shelf.appendChild(p);
    }
  }

  if (bookBtn && book) {
    bookBtn.addEventListener("click", () => {
      book.hidden = !book.hidden;
      bookBtn.setAttribute("aria-expanded", String(!book.hidden));
      bookBtn.classList.toggle("is-on", !book.hidden);
      if (!book.hidden && !shelf.childElementCount) fillShelf("");
      if (!book.hidden && search) search.focus();
    });
  }
  if (search) search.addEventListener("input", () => fillShelf(search.value));

  const ray = new THREE.Raycaster();
  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    const pt = new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1
    );
    ray.setFromCamera(pt, camera);
    const hit = ray.intersectObjects(pieces.children, true)[0];
    if (!hit) { if (!(e.shiftKey || e.metaKey)) select(null); return; }
    /* Click any part of a ready-made piece and the whole piece is picked. */
    let obj = hit.object;
    while (obj.parent && obj.parent !== pieces) obj = obj.parent;
    select(obj, e.shiftKey || e.metaKey);
  }

  /* --- the sliders -------------------------------------------------------- */
  const S = {
    x: document.getElementById("md-x"),
    y: document.getElementById("md-y"),
    z: document.getElementById("md-z"),
    scale: document.getElementById("md-scale"),
    turn: document.getElementById("md-turn"),
    tilt: document.getElementById("md-tilt")
  };

  function load() {
    if (!chosen) return;
    if (S.x) S.x.value = chosen.position.x;
    if (S.y) S.y.value = chosen.position.y;
    if (S.z) S.z.value = chosen.position.z;
    if (S.scale) S.scale.value = chosen.scale.x;
    if (S.turn) S.turn.value = Math.round((chosen.rotation.y * 180) / Math.PI + 360) % 360;
    if (S.tilt) S.tilt.value = Math.round((chosen.rotation.x * 180) / Math.PI);
  }

  function apply() {
    if (!chosen) return;
    const dx = Number(S.x.value) - chosen.position.x;
    const dy = Number(S.y.value) - chosen.position.y;
    const dz = Number(S.z.value) - chosen.position.z;
    const sc = Number(S.scale.value) || 1;
    const ry = (Number(S.turn.value) * Math.PI) / 180;
    const rx = (Number(S.tilt.value) * Math.PI) / 180;
    picked.forEach((o) => {
      /* The primary lands exactly on the numbers; the rest come with it. */
      o.position.set(o.position.x + dx, o.position.y + dy, o.position.z + dz);
      o.scale.set(sc, sc, sc);
      o.rotation.y = ry;
      o.rotation.x = rx;
      if (o.userData.anim) rebase(o);
    });
    refreshHalos();
  }
  Object.values(S).forEach((el) => el && el.addEventListener("input", apply));

  /* --- the tool bar ------------------------------------------------------- */
  const box = document.getElementById("model-box");
  box.querySelectorAll("[data-add]").forEach((b) =>
    b.addEventListener("click", () => add(b.dataset.add)));

  box.querySelectorAll(".model-tools .swatch").forEach((b) => {
    b.style.background = b.dataset.colour;
    b.addEventListener("click", () => setColour(b.dataset.colour));
  });

  box.querySelectorAll("[data-finish]").forEach((b) =>
    b.addEventListener("click", () => {
      finish = b.dataset.finish;
      box.querySelectorAll("[data-finish]").forEach((o) => o.classList.toggle("is-on", o === b));
      paint();
    }));

  /* Paint whatever is selected — one solid, or every part of a group. */
  function paint() {
    if (!picked.length) return;
    const touch = (m) => {
      m.material.color = new THREE.Color(colour);
      const f = FINISH[finish] || FINISH.satin;
      m.material.roughness = f.roughness;
      m.material.metalness = f.metalness;
      m.material.opacity = f.opacity;
      m.material.transparent = f.transparent;
      m.material.needsUpdate = true;
    };
    picked.forEach((p) => {
      if (p.isMesh) touch(p);
      else p.traverse((o) => { if (o.isMesh) touch(o); });
      p.userData.colour = colour;
    });
  }

  /* Any colour at all, by wheel or by hex. */
  const rgb = document.getElementById("md-rgb");
  const hex = document.getElementById("md-hex");
  const setColour = (value, from) => {
    const v = String(value || "").trim();
    if (!/^#[0-9a-f]{6}$/i.test(v)) return;
    colour = v.toLowerCase();
    if (rgb && from !== "wheel") rgb.value = colour;
    if (hex && from !== "hex") hex.value = colour;
    box.querySelectorAll(".model-tools .swatch").forEach((o) =>
      o.classList.toggle("is-on", o.dataset.colour === colour));
    paint();
  };
  if (rgb) rgb.addEventListener("input", () => setColour(rgb.value, "wheel"));
  if (hex) hex.addEventListener("change", () => setColour(hex.value, "hex"));

  const on = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", fn);
    return el;
  };

  on("md-duplicate", () => {
    if (!picked.length) return note("Select a piece first.", true);
    const copies = picked.map((src) => {
      const copy = src.clone(true);
      if (copy.isMesh) copy.material = src.material.clone();
      else copy.traverse((o) => { if (o.isMesh) o.material = o.material.clone(); });
      copy.position.x += 1.2;
      copy.userData = Object.assign({}, src.userData);
      if (copy.userData.anim) copy.userData.anim = null;
      pieces.add(copy);
      return copy;
    });
    picked = copies;
    chosen = copies[copies.length - 1];
    drawHalos();
    load();
    say(describe());
    note(copies.length > 1 ? copies.length + " copies made." : "");
  });

  const dispose = (obj) => {
    if (obj.isMesh) { obj.geometry.dispose(); obj.material.dispose(); return; }
    obj.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  };

  on("md-delete", () => {
    if (!picked.length) return note("Select a piece first.", true);
    picked.slice().forEach((o) => { pieces.remove(o); dispose(o); });
    select(null);
  });

  on("md-all", () => {
    if (!pieces.children.length) return note("There is nothing on the bench yet.", true);
    picked = pieces.children.slice();
    chosen = picked[picked.length - 1];
    drawHalos();
    load();
    say(describe());
    note("");
  });

  on("md-none", () => { select(null); note(""); });

  on("md-clear", () => {
    while (pieces.children.length) {
      const m = pieces.children.pop();
      dispose(m);
    }
    select(null);
    note("");
  });

  const gridBtn = on("md-grid", () => {
    grid.visible = !grid.visible;
    gridBtn.setAttribute("aria-pressed", String(grid.visible));
    gridBtn.classList.toggle("is-on", grid.visible);
  });
  if (gridBtn) gridBtn.classList.add("is-on");


  /* --- the animator --------------------------------------------------------
     Press Animate and a box opens asking, in so many words, how you would
     like the piece to move. The sentence is read here in the page — no model,
     no service — and turned into a handful of motions laid over whatever
     position the piece is already in. Say "hold still" and it returns to
     exactly where it stood. */
  const MOTIONS = [
    { kind: "spin", test: /spin|rotat|revolv|whirl|twirl|turn(?!s? (into|to))|pirouett|gyrat/, name: "spin" },
    { kind: "orbit", test: /orbit|circl|go(es)? round|goes around|fly round|flies round|round the centre|round the middle/, name: "orbit the centre" },
    { kind: "bob", test: /bob|float|hover|rise and fall|up and down(?! the)|levitat/, name: "bob in the air" },
    { kind: "swing", test: /swing|sway|rock|pendul|lean|tilt back/, name: "swing" },
    { kind: "pulse", test: /puls|throb|heartbeat|beat|breath|grow and shrink|swell/, name: "pulse" },
    { kind: "drift", test: /drift|slide|glide|shuttle|side to side|back and forth|to and fro|paces?/, name: "drift from side to side" },
    { kind: "wobble", test: /wobbl|shak|shiver|judder|trembl|quiver|shudder|rattl/, name: "wobble" },
    { kind: "bounce", test: /bounc|hop|jump|spring|skip/, name: "bounce" }
  ];

  function readMotion(text) {
    const s = String(text || "").toLowerCase();
    let speed = 1;
    if (/\b(slow|slowly|gentl[ey]|lazy|lazily|softly|barely|calm)\b/.test(s)) speed = 0.45;
    if (/\b(fast|quick|quickly|rapid|rapidly|briskly)\b/.test(s)) speed = 2.2;
    if (/\b(wildly|violently|furious|frantic|very fast|like mad|madly)\b/.test(s)) speed = 3.6;
    let size = 1;
    if (/\b(small|slight|slightly|subtle|little|tiny|faint|a touch)\b/.test(s)) size = 0.45;
    if (/\b(big|large|wide|wildly|high|huge|great|far)\b/.test(s)) size = 1.9;
    const dir = /\b(anti-?clockwise|counter-?clockwise|widdershins|backwards?|the other way|left)\b/.test(s) ? -1 : 1;
    let axis = "y";
    if (/\b(end over end|tumbl|cartwheel|roll|sideways)\b/.test(s)) axis = "z";
    if (/\b(somersault|forwards? roll|pitch|head over heels)\b/.test(s)) axis = "x";
    const moves = [];
    const names = [];
    MOTIONS.forEach((m) => {
      if (!m.test.test(s)) return;
      moves.push({ kind: m.kind, speed, size, dir, axis });
      names.push(m.name);
    });
    let guessed = false;
    if (!moves.length) {
      moves.push({ kind: "spin", speed, size, dir, axis });
      names.push("turn on the spot");
      guessed = true;
    }
    return { moves, names, guessed, speed, dir };
  }

  function rebase(o) {
    const a = o.userData.anim;
    if (!a) return;
    a.base = {
      px: o.position.x, py: o.position.y, pz: o.position.z,
      rx: o.rotation.x, ry: o.rotation.y, rz: o.rotation.z,
      sc: o.scale.x,
      radius: Math.hypot(o.position.x, o.position.z),
      angle: Math.atan2(o.position.z, o.position.x)
    };
  }

  function runMotion(o, t) {
    const a = o.userData.anim;
    if (!a) return;
    const b = a.base;
    let px = b.px, py = b.py, pz = b.pz;
    let rx = b.rx, ry = b.ry, rz = b.rz, sc = b.sc;
    a.moves.forEach((m) => {
      const w = m.speed, A = m.size;
      if (m.kind === "spin") {
        if (m.axis === "x") rx += t * w * m.dir;
        else if (m.axis === "z") rz += t * w * m.dir;
        else ry += t * w * m.dir;
      } else if (m.kind === "orbit") {
        const r = Math.max(2, b.radius) * (A > 1 ? 1.4 : 1);
        const ang = b.angle + t * w * 0.6 * m.dir;
        px = Math.cos(ang) * r;
        pz = Math.sin(ang) * r;
        ry = b.ry - ang;
      } else if (m.kind === "bob") {
        py += Math.sin(t * w * 1.4) * 0.6 * A;
      } else if (m.kind === "swing") {
        rz += Math.sin(t * w * 1.6) * 0.35 * A;
      } else if (m.kind === "pulse") {
        sc = b.sc * (1 + Math.sin(t * w * 2.2) * 0.16 * A);
      } else if (m.kind === "drift") {
        px += Math.sin(t * w) * 1.6 * A;
      } else if (m.kind === "wobble") {
        rx += Math.sin(t * w * 7) * 0.09 * A;
        rz += Math.cos(t * w * 9) * 0.09 * A;
      } else if (m.kind === "bounce") {
        py += Math.abs(Math.sin(t * w * 2)) * 0.9 * A;
      }
    });
    o.position.set(px, py, pz);
    o.rotation.set(rx, ry, rz);
    o.scale.set(sc, sc, sc);
  }

  const animBox = document.getElementById("anim-box");
  const animText = document.getElementById("md-anim-text");
  const animRead = document.getElementById("md-anim-read");
  const animBtn = on("md-anim", () => {
    if (!animBox) return;
    animBox.hidden = !animBox.hidden;
    animBtn.setAttribute("aria-expanded", String(!animBox.hidden));
    animBtn.classList.toggle("is-on", !animBox.hidden);
    if (!animBox.hidden) {
      if (!picked.length) note("Nothing is selected \u2014 pick a piece and the instruction will land on it.", true);
      if (animText) animText.focus();
    }
  });

  const list = (names) => names.length < 2
    ? names[0]
    : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];

  on("md-anim-go", () => {
    if (!picked.length) return note("Select a piece for the instruction to land on.", true);
    const want = readMotion(animText ? animText.value : "");
    picked.forEach((o) => {
      o.userData.anim = { moves: want.moves, base: null };
      rebase(o);
    });
    const how = (want.speed < 0.6 ? "slowly" : want.speed > 3 ? "wildly" : want.speed > 1.5 ? "quickly" : "steadily") +
      (want.dir < 0 ? ", the other way round" : "");
    if (animRead) {
      animRead.textContent = want.guessed
        ? "I could not find a motion in that, so " + (picked.length > 1 ? "they turn" : "it turns") +
          " on the spot, " + how + ". Try: spin, orbit, bob, swing, pulse, drift, wobble or bounce."
        : "Set going: " + list(want.names) + ", " + how + ". " +
          (picked.length > 1 ? picked.length + " pieces are moving." : "");
    }
    note("");
  });

  on("md-anim-stop", () => {
    const held = picked.length ? picked : pieces.children;
    let n = 0;
    held.slice().forEach((o) => {
      const a = o.userData.anim;
      if (!a) return;
      n++;
      o.position.set(a.base.px, a.base.py, a.base.pz);
      o.rotation.set(a.base.rx, a.base.ry, a.base.rz);
      o.scale.set(a.base.sc, a.base.sc, a.base.sc);
      o.userData.anim = null;
    });
    refreshHalos();
    load();
    if (animRead) {
      animRead.textContent = n
        ? (n > 1 ? n + " pieces are" : "It is") + " holding still again, back where it stood."
        : "Nothing selected was moving.";
    }
  });

  /* --- taking it away ----------------------------------------------------- */
  function toObj() {
    const lines = ["# EGregoRA — the Turning Shop", "mtllib egregora-model.mtl"];
    const mats = [];
    let offset = 1;
    const meshes = [];
    pieces.children.forEach((piece) => {
      if (piece.isMesh) meshes.push(piece);
      else piece.traverse((o) => { if (o.isMesh) meshes.push(o); });
    });
    pieces.updateMatrixWorld(true);
    meshes.forEach((mesh, i) => {
      const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      geo.applyMatrix4(mesh.matrixWorld);
      const pos = geo.attributes.position;
      const name = "piece" + (i + 1) + "_" +
        String((mesh.userData && mesh.userData.kind) || mesh.parent.userData.kind || "part")
          .replace(/[^\w]+/g, "-");
      const matName = "colour" + (i + 1);
      mats.push({ name: matName, colour: new THREE.Color(mesh.material.color) });
      lines.push("o " + name, "usemtl " + matName);
      for (let v = 0; v < pos.count; v++) {
        lines.push("v " + pos.getX(v).toFixed(5) + " " + pos.getY(v).toFixed(5) + " " + pos.getZ(v).toFixed(5));
      }
      for (let f = 0; f < pos.count; f += 3) {
        lines.push("f " + (offset + f) + " " + (offset + f + 1) + " " + (offset + f + 2));
      }
      offset += pos.count;
      geo.dispose();
    });
    const mtl = mats.map((m) =>
      "newmtl " + m.name + "\nKd " + m.colour.r.toFixed(4) + " " + m.colour.g.toFixed(4) + " " +
      m.colour.b.toFixed(4) + "\nKa 0 0 0\nKs 0.2 0.2 0.2\nNs 40\nillum 2\n").join("\n");
    return { obj: lines.join("\n") + "\n", mtl };
  }

  const save = (name, text, type) => {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  on("md-export", () => {
    if (!pieces.children.length) return note("There is nothing to take away yet.", true);
    pieces.updateMatrixWorld(true);
    const { obj, mtl } = toObj();
    save("egregora-model.obj", obj, "text/plain");
    setTimeout(() => save("egregora-model.mtl", mtl, "text/plain"), 400);
    note("Saved: egregora-model.obj and its colour file. Open either in Blender, Meshlab or a printer slicer.");
  });

  /* --- handing the bench over --------------------------------------------
     Two doors out of the Turning Shop. The image generator wants a cut-out:
     the pieces on a transparent ground, no floor grid, no selection marks,
     so it can be put down anywhere on the sketch paper. The video generator
     wants a frame: the view exactly as it stands, which becomes the literal
     first frame of the clip where the route allows it. */
  function capture(cutout) {
    const held = picked.slice();
    const wasGrid = grid.visible;
    const wasBg = scene.background;
    select(null);
    if (cutout) { grid.visible = false; scene.background = null; }
    renderer.render(scene, camera);
    const data = renderer.domElement.toDataURL("image/png").split(",")[1];
    grid.visible = wasGrid;
    scene.background = wasBg;
    renderer.render(scene, camera);
    if (held.length) {
      picked = held;
      chosen = held[held.length - 1];
      drawHalos();
      load();
      say(describe());
    }
    return data;
  }

  async function hostIt(data, name) {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: window.EGAuthHeaders ? window.EGAuthHeaders() : { "content-type": "application/json" },
      body: JSON.stringify({ name, type: "image/png", data, asker: "model" })
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out.url) throw new Error(out.error || "the upload was refused");
    return out.url;
  }

  function sender(id, { cutout, name, go, done }) {
    on(id, async () => {
      if (!pieces.children.length) return note("Build something first.", true);
      const btn = document.getElementById(id);
      btn.disabled = true;
      note("Sending the bench over\u2026");
      try {
        const url = await hostIt(capture(cutout), name);
        go(url);
        note(done);
      } catch (err) {
        note("It could not be sent: " + ((err && err.message) || "unknown error"), true);
      } finally {
        btn.disabled = false;
      }
    });
  }

  sender("md-to-image", {
    cutout: true,
    name: "model-cutout.png",
    go: (url) => {
      if (window.EGModelPlace) window.EGModelPlace(url);
      else if (window.EGModelHandOver) window.EGModelHandOver(url);
    },
    done: "The sketch pad is open above with the piece on the cursor \u2014 click to put it down, " +
      "scroll to size it, then write what it is made of and press Draw it."
  });

  sender("md-to-film", {
    cutout: false,
    name: "model-frame.png",
    go: (url) => {
      if (window.EGModelToFilm) window.EGModelToFilm(url);
    },
    done: "The view is attached to the video box above as the opening frame. Write what moves."
  });

  sender("md-render", {
    cutout: false,
    name: "model.png",
    go: (url) => { if (window.EGModelHandOver) window.EGModelHandOver(url); },
    done: "The whole view is attached to the image box above as a sketch. Write what it is made of \u2014 " +
      "brass, oak, stone, flesh \u2014 and press Draw it."
  });

  /* --- the loop ----------------------------------------------------------- */
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    let moving = false;
    pieces.children.forEach((o) => {
      if (!o.userData.anim) return;
      moving = true;
      runMotion(o, t);
    });
    if (moving && halos.children.length) refreshHalos();
    renderer.render(scene, camera);
  })();

  select(null);
}
