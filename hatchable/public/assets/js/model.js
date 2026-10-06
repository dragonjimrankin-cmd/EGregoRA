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

  /* Two grids, either or both. The X grid is the floor the pieces stand on;
     the Y grid stands upright behind them, for judging height and for
     lining a wall up against something. */
  const makeGrid = (upright) => {
    const g = new THREE.GridHelper(20, 20, 0xd7b05a, 0x2a2740);
    g.material.transparent = true;
    g.material.opacity = upright ? 0.22 : 0.35;
    if (upright) { g.rotation.x = Math.PI / 2; g.position.set(0, 10, -10); }
    scene.add(g);
    return g;
  };
  const grid = makeGrid(false);
  const gridY = makeGrid(true);
  gridY.visible = false;

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

  /* --- the hand on the bench -----------------------------------------------
     The left button works the piece, not the camera:

       drag             move the held pieces across the floor
       Ctrl + drag      move them in the upright plane, up and down
       Alt + drag       turn them in the floor plane
       Ctrl + Alt       turn them in the upright plane, end over end
       right-drag       walk the camera round (Shift + drag does the same)
       wheel            closer and further

     With nothing selected a plain drag turns the view, so an empty bench
     still behaves the way a 3D window is expected to. The arrow keys repeat
     all four, in steps, whenever the pointer is over the window. */
  let dragging = false, orbiting = false, lastX = 0, lastY = 0, moved = 0;
  let hovering = false;

  const modeOf = (e) => {
    if (e.ctrlKey && e.shiftKey) return "size";
    if (e.buttons === 3) return "size";              // both buttons down
    if (e.altKey && e.ctrlKey) return "pitch";
    if (e.altKey) return "yaw";
    if (e.ctrlKey) return "upright";
    return "floor";
  };

  const LABEL = {
    floor: "Dragging across the floor. Ctrl for up and down, Alt to turn, Ctrl+Alt to tip.",
    upright: "Ctrl: dragging up and down in the upright plane.",
    yaw: "Alt: turning in the floor plane.",
    pitch: "Ctrl+Alt: tipping end over end.",
    size: "Both buttons, or Ctrl+Shift: resizing from the centre."
  };

  function work(mode, dx, dy) {
    if (!picked.length) return;
    if (mode === "size") {
      /* Growing and shrinking about the piece\u2019s own middle, so it swells
         in place instead of crawling away from its origin. */
      const f = Math.max(0.2, Math.min(5, 1 + (dx - dy) * 0.004));
      picked.forEach((o) => {
        const mid = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
        const next = Math.max(0.01, Math.min(60, o.scale.x * f));
        const grew = next / o.scale.x;
        o.scale.setScalar(next);
        o.position.set(
          mid.x + (o.position.x - mid.x) * grew,
          mid.y + (o.position.y - mid.y) * grew,
          mid.z + (o.position.z - mid.z) * grew
        );
        if (o.userData.anim) rebase(o);
      });
      refreshHalos();
      load();
      return;
    }
    if (mode === "yaw" || mode === "pitch") {
      const turn = (mode === "yaw" ? dx : dy) * 0.012;
      picked.forEach((o) => {
        if (mode === "yaw") o.rotation.y += turn;
        else o.rotation.x += turn;
        if (o.userData.anim) rebase(o);
      });
    } else {
      const k = dist * 0.0016;
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
      right.y = 0;
      if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
      right.normalize();
      const move = new THREE.Vector3();
      if (mode === "floor") {
        const into = new THREE.Vector3(-right.z, 0, right.x);   /* away from the eye */
        move.addScaledVector(right, dx * k).addScaledVector(into, dy * k);
      } else {
        move.addScaledVector(right, dx * k).addScaledVector(new THREE.Vector3(0, 1, 0), -dy * k);
      }
      picked.forEach((o) => {
        o.position.add(move);
        if (o.userData.anim) rebase(o);
      });
    }
    refreshHalos();
    load();
  }

  stage.addEventListener("pointerenter", () => { hovering = true; });
  stage.addEventListener("pointerleave", () => { hovering = false; });

  window.addEventListener("keydown", (e) => {
    if (!hovering || !picked.length) return;
    const step = e.shiftKey ? 48 : 18;
    const mode = modeOf(e);
    if (e.key === "ArrowLeft") work(mode, -step, 0);
    else if (e.key === "ArrowRight") work(mode, step, 0);
    else if (e.key === "ArrowUp") work(mode, 0, -step);
    else if (e.key === "ArrowDown") work(mode, 0, step);
    else return;
    e.preventDefault();
    stamp();
  });

  renderer.domElement.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = 0;
    lastX = e.clientX; lastY = e.clientY;
    /* The right button, or Shift, or an empty selection: turn the view. */
    orbiting = picked.length
      ? (e.button === 2 && !e.ctrlKey && !e.shiftKey) || (e.shiftKey && !e.ctrlKey)
      : true;
    if (!orbiting) remember();          // one undo step per drag, not per frame
    renderer.domElement.setPointerCapture(e.pointerId);
    stage.classList.toggle("is-nudging", !orbiting);
    if (!orbiting) say(LABEL[modeOf(e)]);
  });

  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    if (e.buttons === 3 && picked.length) orbiting = false;   // both buttons: resize
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (orbiting) {
      yaw -= dx * 0.006;
      pitch = Math.max(-1.3, Math.min(1.4, pitch + dy * 0.006));
      place();
      return;
    }
    const mode = modeOf(e);
    say(LABEL[mode]);
    work(mode, dx, dy);
    e.preventDefault();
  });

  renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

  const release = (e) => {
    if (!dragging) return;
    const wasOrbiting = orbiting;
    dragging = false;
    stage.classList.remove("is-nudging");
    if (moved < 4) { pick(e); return; }      // a click, not a drag: select
    if (!wasOrbiting) { stamp(); say(describe()); }
  };
  renderer.domElement.addEventListener("pointerup", release);
  renderer.domElement.addEventListener("pointercancel", () => {
    dragging = false;
    stage.classList.remove("is-nudging");
  });
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
  const skin = (c, f) => new THREE.MeshStandardMaterial(
    Object.assign({ color: new THREE.Color(c) }, FINISH[f || finish] || FINISH.satin));

  /* Every mesh inside a piece, in a fixed order, so a surface can be named
     by its number and still be the same surface after an undo. */
  const meshesOf = (o) => {
    const out = [];
    if (o.isMesh) out.push(o);
    else o.traverse((c) => { if (c.isMesh) out.push(c); });
    return out;
  };

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
    if (typeof listSurfaces === "function" && texBox && !texBox.hidden) listSurfaces();
    say(describe());
  }

  /* A new piece arrives at a fifth of its drawn size: it is far easier to
     grow something into a scene than to find the rest of the bench behind
     it. The Size slider takes it back up. */
  const ARRIVE = 0.2;

  function add(kind) {
    remember();
    const geo = (SHAPES[kind] || SHAPES.box)();
    const mesh = new THREE.Mesh(geo, skin(colour));
    mesh.position.set((Math.random() - 0.5) * 3, 0.4, (Math.random() - 0.5) * 3);
    mesh.scale.setScalar(ARRIVE);
    mesh.userData = { kind, colour, finish, solid: kind };
    pieces.add(mesh);
    select(mesh);
  }

  /* --- the pattern book ---------------------------------------------------
     Ready-made pieces, built out of primitives on the spot. A piece arrives
     as a group: it moves, turns, scales and recolours like anything else,
     and the OBJ writer walks it the same way. */
  const LIBRARY = buildLibrary(THREE);

  function addFromBook(item) {
    remember();
    const g = item.make(colour);
    g.userData = { kind: item.label, colour, finish, fromBook: true, bookId: item.id };
    g.scale.setScalar(ARRIVE);
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
    if (count) count.textContent = shown + " of " + LIBRARY.length + " objects";
    if (!shown) {
      const p = document.createElement("p");
      p.className = "muted small";
      p.textContent = "Nothing among the objects by that name.";
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
  Object.values(S).forEach((el) => {
    if (!el) return;
    el.addEventListener("input", apply);
    /* One undo step for a whole slider drag, taken as it starts. */
    el.addEventListener("pointerdown", () => { if (picked.length) remember(); });
  });

  /* --- the tool bar ------------------------------------------------------- */
  const box = document.getElementById("model-box");
  box.querySelectorAll("[data-add]").forEach((b) =>
    b.addEventListener("click", () => add(b.dataset.add)));

  box.querySelectorAll(".model-tools .swatch").forEach((b) => {
    b.style.background = b.dataset.colour;
    b.addEventListener("click", () => { if (picked.length) remember(); setColour(b.dataset.colour); });
  });

  box.querySelectorAll("[data-finish]").forEach((b) =>
    b.addEventListener("click", () => {
      if (picked.length) remember();
      finish = b.dataset.finish;
      box.querySelectorAll("[data-finish]").forEach((o) => o.classList.toggle("is-on", o === b));
      paint();
    }));

  /* Paint whatever is selected — one solid, or every part of a group. A
     picture laid on a surface stays where it is; only the colour under it
     and the way the light sits on it change. */
  function paint() {
    if (!picked.length) return;
    picked.forEach((p) => {
      paintObj(p, colour, finish);
      p.userData.colour = colour;
      p.userData.finish = finish;
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
    remember();
    const copies = picked.map((src) => {
      const copy = src.clone(true);
      meshesOf(copy).forEach((o) => {
        o.material = Array.isArray(o.material)
          ? o.material.map((m) => m.clone())
          : o.material.clone();
      });
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

  const letGo = (m) => {
    if (Array.isArray(m)) { m.forEach(letGo); return; }
    if (m.map) m.map.dispose();
    m.dispose();
  };
  const dispose = (obj) => {
    meshesOf(obj).forEach((o) => { o.geometry.dispose(); letGo(o.material); });
  };

  on("md-delete", () => {
    if (!picked.length) return note("Select a piece first.", true);
    remember();
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
    if (pieces.children.length) remember();
    while (pieces.children.length) {
      const m = pieces.children.pop();
      dispose(m);
    }
    select(null);
    note("");
  });

  const gridSwitch = (id, g) => {
    const b = on(id, () => {
      g.visible = !g.visible;
      b.setAttribute("aria-pressed", String(g.visible));
      b.classList.toggle("is-on", g.visible);
    });
    if (b) b.classList.toggle("is-on", g.visible);
  };
  gridSwitch("md-grid-x", grid);
  gridSwitch("md-grid-y", gridY);

  /* --- the texture drawer --------------------------------------------------
     A picture brought in from the machine and laid on a surface. Each piece
     remembers which of its surfaces wear it and how: where the picture sits,
     which way up it is, and how big it is against the shape. The file never
     leaves the page \u2014 it is read straight into a texture. */
  const texStore = new Map();     // id -> { name, url, tex }
  let texSeq = 0;
  let activeTex = null;           // id of the picture being worked with

  const FACES = ["Right", "Left", "Top", "Bottom", "Front", "Back"];
  const isBox = (m) => Boolean(m && m.geometry && m.geometry.type === "BoxGeometry");

  function dressOne(mesh, face, spec) {
    const store = texStore.get(spec.id);
    if (!store) return;
    const tx = store.tex.clone();
    tx.needsUpdate = true;
    tx.wrapS = tx.wrapT = spec.tile ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    tx.center.set(0.5, 0.5);
    tx.rotation = (Number(spec.rot) || 0) * Math.PI / 180;
    tx.repeat.set(1 / Math.max(0.05, spec.sw), 1 / Math.max(0.05, spec.sh));
    tx.offset.set(Number(spec.x) || 0, Number(spec.y) || 0);
    if (face == null) {
      if (Array.isArray(mesh.material)) mesh.material = mesh.material[0];
      mesh.material = mesh.material.clone();
      mesh.material.map = tx;
      mesh.material.needsUpdate = true;
      return;
    }
    if (!Array.isArray(mesh.material)) {
      const base = mesh.material;
      mesh.material = [0, 1, 2, 3, 4, 5].map(() => base.clone());
    }
    const one = mesh.material[face].clone();
    one.map = tx;
    one.needsUpdate = true;
    mesh.material[face] = one;
  }

  function dress(obj, spec) {
    if (!spec || !spec.targets || !spec.targets.length) return;
    const list = meshesOf(obj);
    spec.targets.forEach((t) => {
      const m = list[t.mesh];
      if (m) dressOne(m, t.face == null ? null : Number(t.face), spec);
    });
    obj.userData.tex = spec;
  }

  function strip(obj) {
    meshesOf(obj).forEach((m) => {
      const bare = (mm) => { if (mm.map) { mm.map.dispose(); mm.map = null; mm.needsUpdate = true; } };
      if (Array.isArray(m.material)) { m.material.forEach(bare); m.material = m.material[0]; }
      else bare(m.material);
    });
    obj.userData.tex = null;
  }

  /* --- undo and redo -------------------------------------------------------
     The bench is small enough to write down completely: what each piece is,
     where it stands, what colour and finish it wears and which surfaces
     carry a picture. Undo rebuilds the whole arrangement from that writing,
     which keeps one honest list rather than thirty kinds of reversal. */
  const recipeOf = (o) => {
    const u = o.userData || {};
    return {
      book: u.fromBook ? u.bookId : null,
      solid: u.fromBook ? null : (u.solid || "box"),
      label: u.kind || "a piece",
      colour: u.colour || colour,
      finish: u.finish || finish,
      p: [o.position.x, o.position.y, o.position.z],
      r: [o.rotation.x, o.rotation.y, o.rotation.z],
      s: o.scale.x,
      tex: u.tex ? JSON.parse(JSON.stringify(u.tex)) : null
    };
  };

  function paintObj(o, c, f) {
    const touch = (m) => {
      m.color = new THREE.Color(c);
      const spec = FINISH[f] || FINISH.satin;
      m.roughness = spec.roughness;
      m.metalness = spec.metalness;
      m.opacity = spec.opacity;
      m.transparent = spec.transparent;
      m.needsUpdate = true;
    };
    meshesOf(o).forEach((m) => {
      if (Array.isArray(m.material)) m.material.forEach(touch);
      else touch(m.material);
    });
  }

  function buildFrom(rec) {
    let o = null;
    if (rec.book) {
      const item = LIBRARY.find((i) => i.id === rec.book);
      if (item) o = item.make(rec.colour);
    }
    if (!o) o = new THREE.Mesh((SHAPES[rec.solid] || SHAPES.box)(), skin(rec.colour, rec.finish));
    o.position.fromArray(rec.p);
    o.rotation.set(rec.r[0], rec.r[1], rec.r[2]);
    o.scale.setScalar(rec.s);
    o.userData = {
      kind: rec.label, colour: rec.colour, finish: rec.finish,
      fromBook: Boolean(rec.book), bookId: rec.book || null,
      solid: rec.solid || null, tex: null
    };
    paintObj(o, rec.colour, rec.finish);
    if (rec.tex) dress(o, rec.tex);
    return o;
  }

  let past = [], future = [];
  const scene_state = () => pieces.children.map(recipeOf);

  function marks() {
    const u = document.getElementById("md-undo");
    const r = document.getElementById("md-redo");
    if (u) u.disabled = !past.length;
    if (r) r.disabled = !future.length;
  }

  /* Called before anything changes. */
  function remember() {
    past.push(scene_state());
    if (past.length > 40) past.shift();
    future = [];
    marks();
  }
  /* Called after a change that was already remembered. */
  function stamp() { marks(); }

  function restore(state) {
    while (pieces.children.length) {
      const m = pieces.children.pop();
      dispose(m);
    }
    state.forEach((rec) => pieces.add(buildFrom(rec)));
    select(null);
    marks();
  }

  /* --- undo, redo ---------------------------------------------------------- */
  on("md-undo", () => {
    if (!past.length) return note("Nothing to undo.", true);
    future.push(scene_state());
    restore(past.pop());
    note("Undone.");
  });
  on("md-redo", () => {
    if (!future.length) return note("Nothing to redo.", true);
    past.push(scene_state());
    restore(future.pop());
    note("Redone.");
  });
  window.addEventListener("keydown", (e) => {
    if (!hovering || !(e.ctrlKey || e.metaKey)) return;
    const k = String(e.key).toLowerCase();
    if (k !== "z" && k !== "y") return;
    e.preventDefault();
    const redo = k === "y" || e.shiftKey;
    const btn = document.getElementById(redo ? "md-redo" : "md-undo");
    if (btn) btn.click();
  });
  marks();

  /* --- the texture studio --------------------------------------------------
     It stays shut until there is a picture to lay on something. Then it
     lists the surfaces of whatever is held \u2014 the six faces of a box, or
     the separate parts of a ready-made piece \u2014 and gives the four things
     a laid picture needs: where it sits, which way round it is, how big it
     is, and whether it repeats across the surface or is placed once. */
  const texBox = document.getElementById("texture-box");
  const texFile = document.getElementById("md-texfile");
  const texList = document.getElementById("tx-list");
  const texSurf = document.getElementById("tx-surfaces");
  const TX = {
    x: document.getElementById("tx-x"),
    y: document.getElementById("tx-y"),
    rot: document.getElementById("tx-rot"),
    sw: document.getElementById("tx-sw"),
    sh: document.getElementById("tx-sh"),
    tile: document.getElementById("tx-tile")
  };

  const specNow = () => ({
    id: activeTex,
    x: Number(TX.x && TX.x.value) || 0,
    y: Number(TX.y && TX.y.value) || 0,
    rot: Number(TX.rot && TX.rot.value) || 0,
    sw: Number(TX.sw && TX.sw.value) || 1,
    sh: Number(TX.sh && TX.sh.value) || 1,
    tile: Boolean(TX.tile && TX.tile.checked),
    targets: readSurfaces()
  });

  function readSurfaces() {
    if (!texSurf) return [];
    return Array.from(texSurf.querySelectorAll("input:checked")).map((i) => ({
      mesh: Number(i.dataset.mesh),
      face: i.dataset.face === "" ? null : Number(i.dataset.face)
    }));
  }

  function listSurfaces() {
    if (!texSurf) return;
    texSurf.textContent = "";
    if (!chosen) {
      const p = document.createElement("p");
      p.className = "muted xsmall";
      p.textContent = "Hold a piece and its surfaces appear here.";
      texSurf.appendChild(p);
      return;
    }
    const list = meshesOf(chosen);
    const row = (label, mesh, face, on) => {
      const l = document.createElement("label");
      l.className = "check";
      const i = document.createElement("input");
      i.type = "checkbox";
      i.dataset.mesh = String(mesh);
      i.dataset.face = face == null ? "" : String(face);
      i.checked = Boolean(on);
      const sp = document.createElement("span");
      sp.textContent = label;
      l.appendChild(i);
      l.appendChild(sp);
      texSurf.appendChild(l);
    };
    if (list.length === 1 && isBox(list[0])) {
      row("The whole box", 0, null, true);
      FACES.forEach((f, n) => row(f + " face", 0, n, false));
    } else if (list.length === 1) {
      row("The whole surface", 0, null, true);
    } else {
      list.forEach((m, n) => row(m.name || ("Part " + (n + 1)), n, null, n === 0));
    }
  }

  function listTextures() {
    if (!texList) return;
    texList.textContent = "";
    texStore.forEach((rec, id) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tool tex-chip" + (id === activeTex ? " is-on" : "");
      b.title = rec.name;
      const img = document.createElement("img");
      img.src = rec.url;
      img.alt = rec.name;
      b.appendChild(img);
      b.addEventListener("click", () => { activeTex = id; listTextures(); });
      texList.appendChild(b);
    });
  }

  function openStudio() {
    if (!texBox) return;
    texBox.hidden = false;
    listTextures();
    listSurfaces();
    texBox.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  if (texFile) texFile.addEventListener("change", () => {
    const f = texFile.files && texFile.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        texSeq++;
        const id = "tex" + texSeq;
        texStore.set(id, { name: f.name, url: String(reader.result), tex });
        activeTex = id;
        openStudio();
        note("Picture brought in: " + f.name + ". Choose the surfaces and press Lay it on.");
      };
      img.onerror = () => note("That picture could not be read.", true);
      img.src = String(reader.result);
    };
    reader.onerror = () => note("That file could not be read.", true);
    reader.readAsDataURL(f);
    texFile.value = "";
  });

  on("md-texture", () => {
    if (texStore.size) { openStudio(); return; }
    if (texFile) texFile.click();
  });
  on("tx-import", () => { if (texFile) texFile.click(); });
  on("tx-close", () => { if (texBox) texBox.hidden = true; });

  const relay = (live) => {
    if (!activeTex || !picked.length) return;
    if (!live) remember();
    const spec = specNow();
    if (!spec.targets.length) { note("Tick at least one surface.", true); return; }
    picked.forEach((o) => dress(o, JSON.parse(JSON.stringify(spec))));
    note("");
  };

  on("tx-apply", () => {
    if (!picked.length) return note("Hold a piece first.", true);
    if (!activeTex) return note("Bring a picture in first.", true);
    relay(false);
    note("Laid on. Move the sliders and it follows.");
  });
  on("tx-strip", () => {
    if (!picked.length) return note("Hold a piece first.", true);
    remember();
    picked.forEach(strip);
    note("The picture is off again.");
  });
  Object.values(TX).forEach((el) => {
    if (!el) return;
    el.addEventListener("input", () => {
      if (!picked.length || !picked.some((o) => o.userData.tex)) return;
      relay(true);          // already laid on: follow the slider
    });
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
      const face = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      mats.push({ name: matName, colour: new THREE.Color(face.color) });
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
    const wasGridY = gridY.visible;
    const wasBg = scene.background;
    select(null);
    if (cutout) { grid.visible = false; gridY.visible = false; scene.background = null; }
    renderer.render(scene, camera);
    const data = renderer.domElement.toDataURL("image/png").split(",")[1];
    grid.visible = wasGrid;
    gridY.visible = wasGridY;
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
