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
import { buildRune, takeFromBench, FUTHARK, byId } from "./rune-forge.js";

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
  const aim = new THREE.Vector3(0, 1, 0);      // what the camera looks at
  const place = () => {
    camera.position.set(
      aim.x + dist * Math.cos(pitch) * Math.sin(yaw),
      aim.y + dist * Math.sin(pitch),
      aim.z + dist * Math.cos(pitch) * Math.cos(yaw)
    );
    camera.lookAt(aim);
  };

  /* Walking the camera about without turning it: Alt+Shift across the floor,
     Ctrl+Alt+Shift (or the wheel) up and down. */
  function panCamera(mode, dx, dy) {
    const k = dist * 0.0018;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
    right.y = 0;
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    right.normalize();
    if (mode === "panY") {
      aim.y = Math.max(-20, Math.min(40, aim.y - dy * k));
      aim.x -= right.x * dx * k;
      aim.z -= right.z * dx * k;
    } else {
      const into = new THREE.Vector3(-right.z, 0, right.x);
      aim.addScaledVector(right, -dx * k).addScaledVector(into, -dy * k);
    }
    place();
  }
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
  let camWork = null;
  let hovering = false;

  /* The camera first: Alt+Shift walks it, Shift or the right button turns
     it, and an empty bench turns it too. Otherwise the hand is on the piece. */
  const cameraMode = (e) => {
    if (e.altKey && e.shiftKey) return (e.ctrlKey || e.metaKey) ? "panY" : "panX";
    if (!picked.length) return "orbit";
    if (e.button === 2 && !e.ctrlKey && !e.shiftKey && !e.altKey) return "orbit";
    if (e.shiftKey && !e.ctrlKey && !e.altKey) return "orbit";
    return null;
  };

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

  /* Tab walks the selection on. With several pieces held it moves the main
     one \u2014 the piece the sliders answer to \u2014 round the handful; with one or
     none it walks through everything on the bench. Shift+Tab goes back. */
  function cycle(back) {
    if (!pieces.children.length) return;
    const step = back ? -1 : 1;
    if (picked.length > 1) {
      const at = picked.indexOf(chosen);
      chosen = picked[(at + step + picked.length) % picked.length];
      drawHalos();
      load();
      say("Main piece: " + (chosen.userData.kind || "a piece") + " \u2014 " +
        (picked.indexOf(chosen) + 1) + " of " + picked.length + " held.");
      return;
    }
    const all = pieces.children;
    const at = chosen ? all.indexOf(chosen) : -1;
    select(all[(at + step + all.length) % all.length]);
  }

  window.addEventListener("keydown", (e) => {
    if (!hovering) return;
    if (e.key === "Tab") { e.preventDefault(); cycle(e.shiftKey); return; }
    if (!picked.length) return;
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
    camWork = cameraMode(e);
    orbiting = Boolean(camWork);
    if (!orbiting) remember();          // one undo step per drag, not per frame
    renderer.domElement.setPointerCapture(e.pointerId);
    stage.classList.toggle("is-nudging", !orbiting);
    if (!orbiting) say(LABEL[modeOf(e)]);
  });

  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    if (e.buttons === 3 && picked.length && !e.shiftKey) { orbiting = false; camWork = null; }
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (orbiting) {
      if (camWork === "panX" || camWork === "panY") {
        camWork = (e.ctrlKey || e.metaKey) ? "panY" : (e.altKey && e.shiftKey ? "panX" : camWork);
        panCamera(camWork, dx, dy);
        say(camWork === "panY"
          ? "Alt+Ctrl+Shift: walking the camera up and down."
          : "Alt+Shift: walking the camera across the floor.");
        return;
      }
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
    if (e.ctrlKey || e.metaKey) {
      dist = Math.max(4, Math.min(80, dist + Math.sign(e.deltaY) * 1.1));
      place();
      return;
    }
    panCamera("panY", 0, Math.sign(e.deltaY) * 26);
  }, { passive: false });

  /* --- keeping the page still ---------------------------------------------
     A 3D window is worked with the mouse, and browsers read some of those
     presses as page gestures: the middle button starts autoscroll, the two
     side buttons walk back and forward through history, and a stray drag
     can pull the page about. Over the bench, all of that is held off. The
     arrow keys are left alone, so the page can still be moved by keyboard,
     and nothing here touches the rest of the site. */
  const hush = (e) => { e.preventDefault(); e.stopPropagation(); };
  ["mousedown", "mouseup", "auxclick", "click"].forEach((kind) =>
    stage.addEventListener(kind, (e) => {
      if (e.button === 0) return;          // the ordinary left press is wanted
      hush(e);
    }, true));
  stage.addEventListener("dragstart", hush);
  stage.addEventListener("pointerdown", (e) => { if (e.button >= 1) e.preventDefault(); }, true);
  /* Space and the page keys scroll a page; over the bench they should not. */
  stage.addEventListener("keydown", (e) => {
    if ([" ", "PageUp", "PageDown", "Home", "End"].includes(e.key)) e.preventDefault();
  });
  stage.tabIndex = -1;

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

  /* A new piece arrives at half its drawn size: it is far easier to
     grow something into a scene than to find the rest of the bench behind
     it. The Size slider takes it back up. */
  const ARRIVE = 0.5;

  /* Whenever a piece lands, put the bench in front of the person who asked
     for it \u2014 the shelf of objects is long, and the window is above it. */
  const showBench = () => {
    try { stage.scrollIntoView({ block: "center", behavior: "smooth" }); } catch { /* old browser */ }
  };

  function add(kind) {
    remember();
    const geo = (SHAPES[kind] || SHAPES.box)();
    const mesh = new THREE.Mesh(geo, skin(colour));
    mesh.position.set((Math.random() - 0.5) * 3, 0.4, (Math.random() - 0.5) * 3);
    mesh.scale.setScalar(ARRIVE);
    mesh.userData = { kind, colour, finish, solid: kind };
    pieces.add(mesh);
    select(mesh);
    showBench();
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
    showBench();
    say("Placed: " + item.label + ". Drag it to move it; drag the background to walk round it.");
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

  /* Which drawers the person has opened, so that searching and clearing a
     search does not keep shutting them again. */
  const openDrawers = new Set();

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
    /* Each group is a drawer that opens. Fourteen groups and a hundred and
       seventy-nine objects is a very long shelf to scroll past looking for
       one chair, so everything is shut by default \u2014 except when a search
       is running, when every drawer holding a match stands open, and except
       the first, so the shelf never looks empty. */
    let first = true;
    groups.forEach((items, name) => {
      const drawer = document.createElement("details");
      drawer.className = "book-drawer";
      drawer.open = Boolean(want) || first || openDrawers.has(name);
      first = false;
      drawer.addEventListener("toggle", () => {
        if (drawer.open) openDrawers.add(name); else openDrawers.delete(name);
      });
      const h = document.createElement("summary");
      h.textContent = name + " \u00b7 " + items.length;
      drawer.appendChild(h);
      shelf.appendChild(drawer);
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
      drawer.appendChild(row);
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

  /* --- stitching -----------------------------------------------------------
     Two or more pieces become one. The parts keep their own positions,
     turns, colours and pictures; what changes is that from now on they are
     moved, turned, sized, textured and exported as a single thing. Unpick
     takes them apart again, back where they were. */
  on("md-stitch", () => {
    if (picked.length < 2) return note("Hold two or more pieces first \u2014 Shift-click to add one.", true);
    remember();
    const mid = new THREE.Vector3();
    const box = new THREE.Box3();
    picked.forEach((o) => box.expandByObject(o));
    box.getCenter(mid);

    const whole = new THREE.Group();
    whole.position.copy(mid);
    const parts = picked.slice();
    parts.forEach((o) => {
      pieces.remove(o);
      o.position.sub(mid);
      whole.add(o);
    });
    whole.userData = {
      kind: parts.length + " pieces stitched",
      colour: (parts[0].userData && parts[0].userData.colour) || colour,
      finish: (parts[0].userData && parts[0].userData.finish) || finish,
      stitched: true, tex: null
    };
    pieces.add(whole);
    select(whole);
    note(parts.length + " pieces are one piece now. Unpick takes them apart again.");
  });

  /* --- unstitching ---------------------------------------------------------
     Taking a piece apart. A stitched piece comes apart at its seams, exactly
     as it went together. Anything else \u2014 a tree, a cottage, a cart \u2014 is read
     for its natural divisions: parts that share a colour and a kind of shape
     belong together, so a tree falls into trunk and leaves rather than into
     nine separate spheres. If the reading is not what you wanted, the
     splitting bench below lets you say exactly where the cuts go. */
  const hexOf = (m) => {
    const one = Array.isArray(m) ? m[0] : m;
    return one && one.color ? one.color.getHexString() : "ffffff";
  };
  const family = (geo) => {
    const t = String((geo && geo.type) || "").replace("Geometry", "");
    if (t === "Sphere" || t === "Icosahedron" || t === "Dodecahedron") return "round";
    if (t === "Cylinder" || t === "Capsule") return "shaft";
    if (t === "Cone") return "point";
    if (t === "Box") return "block";
    return t.toLowerCase() || "part";
  };

  /* The reading: a list of lists of meshes. */
  function readParts(obj) {
    const list = meshesOf(obj);
    if (list.length < 2) return [list];
    const byKey = new Map();
    list.forEach((m) => {
      const key = hexOf(m.material) + "|" + family(m.geometry);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(m);
    });
    if (byKey.size > 1) return Array.from(byKey.values());
    /* One colour, one kind of shape: fall back on height, which separates a
       plinth from what stands on it. */
    obj.updateMatrixWorld(true);
    const mid = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
    const low = [], high = [];
    list.forEach((m) => {
      const p = new THREE.Vector3().setFromMatrixPosition(m.matrixWorld);
      (p.y < mid.y ? low : high).push(m);
    });
    if (low.length && high.length) return [low, high];
    return list.map((m) => [m]);
  }

  /* Build one loose piece out of a handful of meshes, keeping them exactly
     where they look and centring the new piece on its own middle. */
  function buildPart(meshes, root, label) {
    root.updateMatrixWorld(true);
    const g = new THREE.Group();
    meshes.forEach((m) => {
      const copy = new THREE.Mesh(
        m.geometry.clone(),
        Array.isArray(m.material) ? m.material.map((x) => x.clone()) : m.material.clone());
      copy.name = m.name;
      copy.applyMatrix4(m.matrixWorld);
      g.add(copy);
    });
    const mid = new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3());
    g.children.forEach((ch) => ch.position.sub(mid));
    g.position.copy(mid);
    const first = meshes[0];
    g.userData = {
      kind: label, colour: "#" + hexOf(first.material), finish,
      raw: true, tex: null
    };
    return g;
  }

  function splitInto(obj, groups, how) {
    const made = [];
    groups.forEach((meshes, n) => {
      if (!meshes.length) return;
      const name = (obj.userData.kind || "piece") + " \u00b7 " +
        (meshes.length === 1 && meshes[0].name ? meshes[0].name : family(meshes[0].geometry)) +
        (groups.length > 2 ? " " + (n + 1) : "");
      made.push(buildPart(meshes, obj, name));
    });
    if (made.length < 2) return null;
    pieces.remove(obj);
    dispose(obj);
    made.forEach((g) => pieces.add(g));
    picked = made;
    chosen = made[made.length - 1];
    drawHalos();
    load();
    say(describe());
    note("Split into " + made.length + " pieces" + (how ? " \u2014 " + how : "") + ".");
    return made;
  }

  on("md-unstitch", () => {
    if (!picked.length) return note("Hold a piece first.", true);
    remember();
    let done = 0;
    picked.slice().forEach((obj) => {
      if (obj.userData && obj.userData.stitched) {
        obj.updateMatrixWorld(true);
        const freed = [];
        obj.children.slice().forEach((part) => {
          part.applyMatrix4(obj.matrix);
          obj.remove(part);
          pieces.add(part);
          freed.push(part);
        });
        pieces.remove(obj);
        picked = freed;
        chosen = freed[freed.length - 1] || null;
        done += freed.length;
        return;
      }
      const read = readParts(obj);
      if (read.length < 2) { note("That piece is a single surface \u2014 there is nothing to split.", true); return; }
      const made = splitInto(obj, read, "by colour and shape");
      if (made) done += made.length;
    });
    if (done) {
      drawHalos();
      if (chosen) load();
      say(describe());
    }
  });

  /* --- the splitting bench -------------------------------------------------
     A second little 3D window showing only the piece being taken apart. Each
     part of it belongs to a numbered piece-to-be; click a part in the window,
     or its row in the list, and it joins whichever piece-to-be is active.
     The reading above is loaded in as the opening proposal, so most of the
     time the work is one or two corrections rather than a sorting job. */
  const splitBox = document.getElementById("split-box");
  const splitStage = document.getElementById("split-stage");
  const splitList = document.getElementById("split-parts");
  const splitBuckets = document.getElementById("split-buckets");
  const BUCKET_COLOURS = [0x7fae7a, 0xd7b05a, 0x8fb6d8, 0xc8352f, 0xb98fd8, 0xe0a060, 0x6fd0c0, 0xe0e0a0];

  let splitShop = null;      // { renderer, scene, camera, parts, source, assign, bucket, count }

  function splitRender() {
    if (!splitShop) return;
    splitShop.renderer.render(splitShop.scene, splitShop.camera);
  }

  function paintSplit() {
    if (!splitShop) return;
    splitShop.parts.forEach((p, i) => {
      const b = splitShop.assign[i];
      const col = new THREE.Color(BUCKET_COLOURS[b % BUCKET_COLOURS.length]);
      p.mesh.material.color.copy(col);
      p.mesh.material.emissive = new THREE.Color(col).multiplyScalar(0.18);
      p.mesh.material.needsUpdate = true;
    });
    if (splitBuckets) {
      splitBuckets.textContent = "";
      for (let b = 0; b < splitShop.count; b++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tool bucket" + (b === splitShop.bucket ? " is-on" : "");
        btn.style.borderColor = "#" + new THREE.Color(BUCKET_COLOURS[b % BUCKET_COLOURS.length]).getHexString();
        const n = splitShop.assign.filter((a) => a === b).length;
        btn.textContent = "Piece " + (b + 1) + " \u00b7 " + n;
        btn.addEventListener("click", () => { splitShop.bucket = b; paintSplit(); });
        splitBuckets.appendChild(btn);
      }
      const add = document.createElement("button");
      add.type = "button";
      add.className = "tool";
      add.textContent = "+ another piece";
      add.addEventListener("click", () => {
        splitShop.count = Math.min(8, splitShop.count + 1);
        splitShop.bucket = splitShop.count - 1;
        paintSplit();
      });
      splitBuckets.appendChild(add);
    }
    if (splitList) {
      splitList.textContent = "";
      splitShop.parts.forEach((p, i) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "split-row";
        const dot = document.createElement("span");
        dot.className = "split-dot";
        dot.style.background = "#" + new THREE.Color(
          BUCKET_COLOURS[splitShop.assign[i] % BUCKET_COLOURS.length]).getHexString();
        row.appendChild(dot);
        const txt = document.createElement("span");
        txt.textContent = (p.source.name || family(p.source.geometry)) +
          " \u00b7 piece " + (splitShop.assign[i] + 1);
        row.appendChild(txt);
        row.addEventListener("click", () => {
          splitShop.assign[i] = splitShop.bucket;
          paintSplit();
        });
        splitList.appendChild(row);
      });
    }
    splitRender();
  }

  function openSplit(obj) {
    if (!splitBox || !splitStage) return;
    closeSplit();
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch { note("This browser will not open a second 3D window.", true); return; }
    const w = splitStage.clientWidth || 420;
    const h = Math.max(240, Math.round(w * 0.7));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    splitStage.textContent = "";
    splitStage.appendChild(renderer.domElement);

    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xfff0d0, 0x20202c, 1.2));
    const k = new THREE.DirectionalLight(0xffe9c0, 1.4);
    k.position.set(5, 8, 6);
    sc.add(k);

    obj.updateMatrixWorld(true);
    const source = meshesOf(obj);
    const holder = new THREE.Group();
    sc.add(holder);
    const parts = source.map((m) => {
      const mesh = new THREE.Mesh(m.geometry.clone(), new THREE.MeshStandardMaterial({
        color: 0x7fae7a, roughness: 0.5, metalness: 0.1
      }));
      mesh.applyMatrix4(m.matrixWorld);
      holder.add(mesh);
      return { mesh, source: m };
    });
    const box = new THREE.Box3().setFromObject(holder);
    const mid = box.getCenter(new THREE.Vector3());
    const reach = Math.max(0.5, box.getSize(new THREE.Vector3()).length());
    holder.position.sub(mid);

    const cam = new THREE.PerspectiveCamera(38, w / h, 0.05, reach * 20);
    let sYaw = 0.8, sPitch = 0.45, sDist = reach * 1.5;
    const put3 = () => {
      cam.position.set(
        sDist * Math.cos(sPitch) * Math.sin(sYaw),
        sDist * Math.sin(sPitch),
        sDist * Math.cos(sPitch) * Math.cos(sYaw));
      cam.lookAt(0, 0, 0);
    };
    put3();

    /* The reading above becomes the opening proposal. */
    const read = readParts(obj);
    const assign = source.map((m) => {
      const at = read.findIndex((set) => set.indexOf(m) >= 0);
      return at < 0 ? 0 : at;
    });

    splitShop = {
      renderer, scene: sc, camera: cam, parts, source: obj, assign,
      bucket: 0, count: Math.max(2, Math.min(8, read.length)), holder
    };

    const ray = new THREE.Raycaster();
    let turning = false, px = 0, py = 0, travelled = 0;
    const el = renderer.domElement;
    el.addEventListener("pointerdown", (e) => {
      turning = true; travelled = 0; px = e.clientX; py = e.clientY;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (!turning) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      px = e.clientX; py = e.clientY;
      travelled += Math.abs(dx) + Math.abs(dy);
      sYaw -= dx * 0.008;
      sPitch = Math.max(-1.3, Math.min(1.4, sPitch + dy * 0.008));
      put3();
      splitRender();
    });
    el.addEventListener("pointerup", (e) => {
      if (!turning) return;
      turning = false;
      if (travelled > 4) return;
      const r = el.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1), cam);
      const hit = ray.intersectObjects(parts.map((p) => p.mesh), false)[0];
      if (!hit) return;
      const at = parts.findIndex((p) => p.mesh === hit.object);
      if (at >= 0) { splitShop.assign[at] = splitShop.bucket; paintSplit(); }
    });
    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      sDist = Math.max(reach * 0.4, Math.min(reach * 6, sDist + Math.sign(e.deltaY) * reach * 0.12));
      put3();
      splitRender();
    }, { passive: false });
    ["mousedown", "mouseup", "auxclick", "click", "contextmenu"].forEach((kind) =>
      el.addEventListener(kind, (ev) => { if (ev.button !== 0) { ev.preventDefault(); ev.stopPropagation(); } }, true));

    splitBox.hidden = false;
    paintSplit();
    splitBox.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function closeSplit() {
    if (!splitShop) return;
    splitShop.parts.forEach((p) => { p.mesh.geometry.dispose(); p.mesh.material.dispose(); });
    splitShop.renderer.dispose();
    if (splitStage) splitStage.textContent = "";
    splitShop = null;
    if (splitBox) splitBox.hidden = true;
  }

  on("md-split", () => {
    if (picked.length !== 1) return note("Hold exactly one piece to take it apart by hand.", true);
    if (meshesOf(chosen).length < 2) return note("That piece is a single surface \u2014 there is nothing to split.", true);
    openSplit(chosen);
  });
  on("split-close", () => closeSplit());
  on("split-auto", () => {
    if (!splitShop) return;
    const read = readParts(splitShop.source);
    splitShop.assign = splitShop.parts.map((p) => {
      const at = read.findIndex((set) => set.indexOf(p.source) >= 0);
      return at < 0 ? 0 : at;
    });
    splitShop.count = Math.max(2, Math.min(8, read.length));
    paintSplit();
  });
  on("split-do", () => {
    if (!splitShop) return;
    const obj = splitShop.source;
    const buckets = [];
    for (let b = 0; b < splitShop.count; b++) {
      buckets.push(splitShop.parts.filter((p, i) => splitShop.assign[i] === b).map((p) => p.source));
    }
    const full = buckets.filter((b) => b.length);
    if (full.length < 2) { note("Put the parts into at least two pieces first.", true); return; }
    remember();
    closeSplit();
    splitInto(obj, full, "by hand");
  });

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
    if (u.raw) {
      /* A piece that was cut by hand has no recipe to rebuild from, so undo
         keeps the thing itself, cloned, rather than a description of it. */
      return { raw: o.clone(true), label: u.kind || "a piece",
        colour: u.colour || colour, finish: u.finish || finish };
    }
    if (u.stitched) {
      return {
        stitch: o.children.map(recipeOf),
        label: u.kind || "stitched piece",
        colour: u.colour || colour, finish: u.finish || finish,
        p: [o.position.x, o.position.y, o.position.z],
        r: [o.rotation.x, o.rotation.y, o.rotation.z],
        s: o.scale.x,
        tex: u.tex ? JSON.parse(JSON.stringify(u.tex)) : null
      };
    }
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
    if (rec.raw) {
      const back = rec.raw.clone(true);
      back.userData = { kind: rec.label, colour: rec.colour, finish: rec.finish, raw: true, tex: null };
      return back;
    }
    if (rec.stitch) {
      o = new THREE.Group();
      rec.stitch.forEach((kid) => o.add(buildFrom(kid)));
      o.position.fromArray(rec.p);
      o.rotation.set(rec.r[0], rec.r[1], rec.r[2]);
      o.scale.setScalar(rec.s);
      o.userData = {
        kind: rec.label, colour: rec.colour, finish: rec.finish,
        stitched: true, tex: null
      };
      if (rec.tex) dress(o, rec.tex);
      return o;
    }
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
    remember();
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

  /* --- handing the arrangement over in words -------------------------------
     Two kinds of writing about the same bench. The plain description is for
     a model that answers to English: colours, materials, sizes and where
     things stand in relation to each other. The vector listing is for one
     that answers to numbers: every piece with its position, its turn, its
     size and its colour, in a fixed order, with the camera written out at
     the end. Either is added to whatever is already in the prompt box \u2014
     nothing is ever overwritten \u2014 separated by a single full stop. */
  const NAMED = [
    ["gold", 0xd7b05a], ["brass", 0xc9a227], ["amber", 0xe0a060], ["red", 0xc8352f],
    ["orange", 0xe07a2f], ["yellow", 0xe8d44d], ["green", 0x5f9e58], ["deep green", 0x2f6b3a],
    ["blue", 0x2f6fa8], ["pale blue", 0x8fb6d8], ["violet", 0x7a4fa8], ["pink", 0xd98fb6],
    ["brown", 0x8a5a33], ["dark brown", 0x5a3a20], ["bone", 0xefe3c8], ["white", 0xf5f2ea],
    ["grey", 0x9a9a9a], ["steel", 0xb8c0cc], ["black", 0x1b1b1f]
  ];
  const colourName = (hex) => {
    const c = new THREE.Color(hex);
    let best = NAMED[0], score = Infinity;
    NAMED.forEach((n) => {
      const o = new THREE.Color(n[1]);
      const d = (c.r - o.r) ** 2 + (c.g - o.g) ** 2 + (c.b - o.b) ** 2;
      if (d < score) { score = d; best = n; }
    });
    return best[0];
  };
  const FINISH_WORD = {
    matt: "matt", satin: "satin", metal: "polished metal", glass: "clear glass"
  };
  const round2 = (n) => Math.round(n * 100) / 100;
  const degrees = (r) => Math.round((r * 180) / Math.PI);

  function measure(o) {
    o.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(o);
    return {
      mid: box.getCenter(new THREE.Vector3()),
      span: box.getSize(new THREE.Vector3()),
      low: box.min.y
    };
  }

  function placeWords(mid, span) {
    const bits = [];
    if (mid.x < -0.6) bits.push("to the left");
    else if (mid.x > 0.6) bits.push("to the right");
    else bits.push("at the centre");
    if (mid.z > 0.8) bits.push("near the front");
    else if (mid.z < -0.8) bits.push("further back");
    if (span.y > 4) bits.push("towering");
    else if (span.y < 0.4) bits.push("small");
    if (mid.y - span.y / 2 > 0.4) bits.push("raised off the ground");
    return bits.join(", ");
  }

  function sceneInWords() {
    if (!pieces.children.length) return "";
    const lines = pieces.children.map((o) => {
      const { mid, span } = measure(o);
      const u = o.userData || {};
      return "a " + colourName(u.colour || colour) + " " +
        (FINISH_WORD[u.finish || finish] || "satin") + " " +
        String(u.kind || "shape").toLowerCase() +
        ", about " + round2(span.y) + " units tall, " + placeWords(mid, span);
    });
    const whole = measure(pieces);
    return "The arrangement, built as a model and to be rendered as a photograph: " +
      lines.join("; ") + ". The whole group is about " + round2(whole.span.x) + " units across and " +
      round2(whole.span.y) + " units high, seen three-quarters on from slightly above, " +
      "lit warm from the upper left with a cool rim from behind";
  }

  function sceneInVectors() {
    if (!pieces.children.length) return "";
    const rows = pieces.children.map((o, i) => {
      const { mid, span } = measure(o);
      const u = o.userData || {};
      return (i + 1) + ". " + String(u.kind || "shape") +
        " | colour " + (u.colour || colour) +
        " | finish " + (u.finish || finish) +
        " | centre (" + round2(mid.x) + ", " + round2(mid.y) + ", " + round2(mid.z) + ")" +
        " | rotation (" + degrees(o.rotation.x) + ", " + degrees(o.rotation.y) + ", " + degrees(o.rotation.z) + ")" +
        " | scale " + round2(o.scale.x) +
        " | bounds " + round2(span.x) + " x " + round2(span.y) + " x " + round2(span.z);
    });
    const cam = camera.position;
    return "Exact layout. Right-handed axes, Y up, one unit = one metre, ground plane at y=0. " +
      pieces.children.length + " objects. " + rows.join(" ") +
      " Camera: position (" + round2(cam.x) + ", " + round2(cam.y) + ", " + round2(cam.z) + ")" +
      ", looking at (" + round2(aim.x) + ", " + round2(aim.y) + ", " + round2(aim.z) + ")" +
      ", field of view " + camera.fov + " degrees";
  }

  /* Never overwrite: add to what is already written, with one full stop and
     one space between the old text and the new. */
  function appendPrompt(id, text, where) {
    const el = document.getElementById(id);
    if (!el) return note("That prompt box is not on this page.", true);
    if (!text) return note("Build something first.", true);
    const had = String(el.value || "").replace(/[\s.]+$/, "");
    el.value = had ? had + ". " + text : text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    const anchor = document.getElementById(where);
    if (anchor) anchor.scrollIntoView({ block: "start", behavior: "smooth" });
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    note("Added to the " + (where === "draw-box" ? "picture" : "clip") +
      " prompt above \\u2014 nothing that was already written has been touched.");
  }

  on("md-words-image", () => appendPrompt("d-prompt", sceneInWords(), "draw-box"));
  on("md-words-film", () => appendPrompt("v-prompt", sceneInWords(), "film-box"));
  on("md-vectors-image", () => appendPrompt("d-prompt", sceneInVectors(), "draw-box"));
  on("md-vectors-film", () => appendPrompt("v-prompt", sceneInVectors(), "film-box"));

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

  /* Straight onto the paper. There is no need to put this through the
     upload at all \u2014 the sketch pad draws it onto its own canvas, and the
     canvas is uploaded later if the sketch is used. Keeping it local means
     no round trip, no account needed, and nothing to go wrong between here
     and there. */
  on("md-to-image", () => {
    if (!pieces.children.length) return note("Build something first.", true);
    if (!window.EGModelPlace) return note("The sketch pad is not on this page.", true);
    try {
      const data = "data:image/png;base64," + capture(true);
      window.EGModelPlace(data);
      note("The sketch pad is open above with the piece on the cursor \u2014 click to put it down, " +
        "scroll to size it, then write what it is made of and press Generate.");
    } catch (err) {
      note("The view could not be cut out: " + ((err && err.message) || "unknown error"), true);
    }
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
      "brass, oak, stone, flesh \u2014 and press Generate."
  });

  /* --- runes carried in from the forge -------------------------------------
     The Rune Forge on the Runes page writes its specifications into this
     browser and sends the maker here. They are picked up once, built with
     the same code that drew them there, and laid out in a row on the
     bench; the hand-over is cleared as it is read, so a reload does not
     place them twice. */
  /* --- a model from a sentence --------------------------------------------
     The server asks a model for a *plan* rather than a mesh: which pieces,
     at what size, turned which way, standing where. The plan is then built
     here out of the same primitives and the same pattern book a person
     would have dragged into place, so what arrives can be moved, recoloured,
     split, stitched and exported like anything else on the bench.

     The plan speaks in metres and the shop's primitives are two units
     across, so every part is scaled by the size asked for over the size the
     geometry actually is. */
  const DIM = {
    box: [2, 2, 2],
    sphere: [2.4, 2.4, 2.4],
    cylinder: [2, 2.4, 2],
    cone: [2.4, 2.6, 2.4],
    torus: [3.24, 3.24, 0.84]
  };
  const RAD = Math.PI / 180;

  function buildPlan(plan) {
    const whole = new THREE.Group();
    let made = 0;

    (plan.parts || []).forEach((part) => {
      let o = null;
      let dim = null;

      if (part.book) {
        const item = LIBRARY.find((i) => i.id === part.book);
        if (item) {
          o = item.make(part.colour);
          const bb = new THREE.Box3().setFromObject(o);
          const size = bb.getSize(new THREE.Vector3());
          /* A book piece is drawn at whatever size suited the drawer; stand
             it on its own floor and scale it to the size the plan asked for. */
          o.position.y -= bb.min.y;
          dim = [Math.max(0.01, size.x), Math.max(0.01, size.y), Math.max(0.01, size.z)];
        }
      }
      if (!o) {
        const kind = part.solid && SHAPES[part.solid] ? part.solid : "box";
        o = new THREE.Mesh(SHAPES[kind](), skin(part.colour, finish));
        dim = DIM[kind] || DIM.box;
        o.userData.solid = kind;
      }

      const holder = new THREE.Group();
      o.scale.set(part.s[0] / dim[0], part.s[1] / dim[1], part.s[2] / dim[2]);
      holder.add(o);
      holder.position.set(part.p[0], part.p[1], part.p[2]);
      holder.rotation.set(part.r[0] * RAD, part.r[1] * RAD, part.r[2] * RAD);
      holder.userData = { kind: part.book || part.solid || "part", colour: part.colour, finish };
      whole.add(holder);
      made++;
    });

    if (!made) return null;

    /* Centre it over the origin and stand it on the floor, so a plan that
       drifted sideways still arrives in front of the camera. */
    const bb = new THREE.Box3().setFromObject(whole);
    const mid = bb.getCenter(new THREE.Vector3());
    whole.children.forEach((c) => { c.position.x -= mid.x; c.position.z -= mid.z; c.position.y -= bb.min.y; });
    return whole;
  }

  window.EGModelFromPlan = (plan) => {
    if (!plan || !plan.parts || !plan.parts.length) return false;
    const whole = buildPlan(plan);
    if (!whole) return false;
    remember();
    whole.userData = {
      kind: plan.name || "a written model",
      colour, finish, stitched: true, written: true
    };
    whole.scale.setScalar(ARRIVE);
    pieces.add(whole);
    select(whole);
    showBench();
    say("Built: " + (plan.name || "a model") + " \u2014 " + plan.parts.length +
      " parts, stitched into one piece. Unstitch takes it apart to work on the parts.");
    return true;
  };

  /* The catalogue, so the server can tell the model what this shop can
     actually build rather than guessing at names. */
  window.EGModelCatalogue = () => LIBRARY.map((i) => i.id);

  /* --- the written-model box ---------------------------------------------- */
  (function writtenModels() {
    const form = document.getElementById("md-write-form");
    const box = document.getElementById("md-write");
    const out = document.getElementById("md-write-msg");
    if (!form || !box) return;
    const tell = (t, bad) => {
      if (!out) return;
      out.textContent = t || "";
      out.className = "auth-msg" + (bad ? " is-bad" : "");
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const want = box.value.trim();
      if (want.length < 3) return tell("Say what to build.", true);
      const go = document.getElementById("md-write-go");
      if (go) go.disabled = true;
      const job = window.EGWork ? window.EGWork.start("a model is being drawn up") : null;
      tell("Drawing up a plan\u2026 this takes a few seconds.");
      try {
        const r = await fetch("/api/model3d", {
          method: "POST",
          headers: Object.assign({ "content-type": "application/json" },
            window.EGAuthHeaders ? window.EGAuthHeaders() : {}),
          body: JSON.stringify({ prompt: want, ids: window.EGModelCatalogue() })
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "the plan could not be drawn up");
        if (!window.EGModelFromPlan(data)) throw new Error("the plan came back empty");
        tell((data.note || "Built.") + (data.by ? " \u2014 drawn up by " + data.by + "." : ""));
      } catch (err) {
        tell((err && err.message) || "That could not be built.", true);
      } finally {
        if (window.EGWork) window.EGWork.end(job);
        if (go) go.disabled = false;
      }
    });
  })();

  /* --- the scanner's harvest ----------------------------------------------
     A spec from scan.js: one row of numbers per slice of the photograph,
     saying how wide that slice is and (if a second view was taken) how deep.
     Sweeping an ellipse down the two profiles gives a visual hull, and the
     cut-out photograph is laid over the front of it by a flat projection,
     which is the right projection because the photograph was taken flat on.

     A face gets two extras: a deeper default section, because a head is
     nearly as deep as it is wide, and a small push outward where the
     photograph is bright, which puts a nose on it. */
  function scanMesh(spec) {
    const rows = spec.rows || [];
    const n = rows.length;
    if (n < 4) return null;
    const SEG = 44;
    const head = spec.kind === "head";
    const H = head ? 2.6 : 3;
    const W = H / Math.max(0.2, spec.aspect || 1.4);
    const DEEP = head ? 1.1 : 0.78;
    const BUMP = head ? 0.42 : 0;

    const grid = spec.shading || null;
    const lumAt = (u, v) => {
      if (!grid || !grid.length) return 0;
      const gy = Math.min(grid.length - 1, Math.max(0, Math.round(v * (grid.length - 1))));
      const line = grid[gy];
      const gx = Math.min(line.length - 1, Math.max(0, Math.round(u * (line.length - 1))));
      return line[gx] || 0;
    };

    const pos = [], uv = [], idx = [];
    for (let i = 0; i < n; i++) {
      const cx = rows[i][0] * W;
      const halfW = Math.max(0.004, rows[i][1] * W);
      const halfD = Math.max(0.004, (spec.depth ? spec.depth[i] * W : rows[i][1] * W * DEEP));
      const y = H * (1 - i / (n - 1));
      const v = i / (n - 1);
      for (let sgm = 0; sgm <= SEG; sgm++) {
        const a = (sgm / SEG) * Math.PI * 2;
        const x = cx + halfW * Math.cos(a);
        let z = halfD * Math.sin(a);
        if (BUMP && Math.sin(a) > 0) {
          const u = Math.min(1, Math.max(0, (x / W) + 0.5));
          z += lumAt(u, v) * BUMP * halfD * Math.sin(a);
        }
        pos.push(x, y, z);
        uv.push(Math.min(1, Math.max(0, (x / W) + 0.5)), 1 - v);
      }
    }
    const ring = SEG + 1;
    for (let i = 0; i < n - 1; i++) {
      for (let sgm = 0; sgm < SEG; sgm++) {
        const a = i * ring + sgm, b = a + 1, c = a + ring, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }
    /* Caps, so the solid is closed and the OBJ writer is happy. */
    const capAt = (i, up) => {
      const centre = pos.length / 3;
      let cx = 0, cy = 0, cz = 0;
      for (let sgm = 0; sgm < SEG; sgm++) {
        const k = (i * ring + sgm) * 3;
        cx += pos[k]; cy += pos[k + 1]; cz += pos[k + 2];
      }
      pos.push(cx / SEG, cy / SEG, cz / SEG);
      uv.push(0.5, up ? 1 : 0);
      for (let sgm = 0; sgm < SEG; sgm++) {
        const a = i * ring + sgm, b = a + 1;
        if (up) idx.push(centre, a, b); else idx.push(centre, b, a);
      }
    };
    capAt(0, true);
    capAt(n - 1, false);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.72, metalness: 0.04, side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, material);

    /* The photograph itself. It arrives as a data URL, so there is no
       network and no CORS to think about. */
    if (spec.texture) {
      const img = new Image();
      img.onload = () => {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        material.map = tex;
        material.needsUpdate = true;
      };
      img.src = spec.texture;
    }
    return mesh;
  }

  window.EGScanToBench = (spec) => {
    if (!spec) return;
    const mesh = scanMesh(spec);
    if (!mesh) { note("That scan had too little in it to carve.", true); return; }
    remember();
    const g = new THREE.Group();
    g.add(mesh);
    g.userData = {
      kind: spec.name || (spec.kind === "head" ? "a scanned head" : "a scanned object"),
      colour, finish, scanned: true
    };
    g.scale.setScalar(ARRIVE);
    g.position.set((Math.random() - 0.5) * 2.5, 0, (Math.random() - 0.5) * 2.5);
    pieces.add(g);
    select(g);
    showBench();
    say("Placed: " + g.userData.kind +
      (spec.guessedDepth ? ". There was only one view, so its depth is a guess from its width." : ".") +
      " Drag it to move it.");
  };

  /* --- the lasso -----------------------------------------------------------
     Shift-clicking pieces one at a time is fine for three and tiresome for
     thirty. With the lasso on, a drag across the window draws a rectangle
     and everything whose middle falls inside it is picked up together —
     then the lasso turns itself off, because what you almost always want
     next is to drag the handful you have just gathered. */
  let lasso = false;
  let lassoFrom = null;
  const lassoBox = document.createElement("div");
  lassoBox.className = "md-lasso";
  lassoBox.hidden = true;
  stage.appendChild(lassoBox);

  const lassoBtn = document.getElementById("md-lasso");
  const setLasso = (on_) => {
    lasso = on_;
    if (lassoBtn) {
      lassoBtn.setAttribute("aria-pressed", String(lasso));
      lassoBtn.classList.toggle("is-on", lasso);
    }
    stage.classList.toggle("is-lassoing", lasso);
    if (lasso) say("Lasso: drag a box round the pieces you want. Hold Shift to add them to what is already picked up.");
  };
  if (lassoBtn) lassoBtn.addEventListener("click", () => setLasso(!lasso));

  const screenOf = (obj) => {
    const centre = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
    centre.project(camera);
    const r = renderer.domElement.getBoundingClientRect();
    return {
      x: r.left + (centre.x * 0.5 + 0.5) * r.width,
      y: r.top + (-centre.y * 0.5 + 0.5) * r.height,
      z: centre.z
    };
  };

  renderer.domElement.addEventListener("pointerdown", (e) => {
    if (!lasso || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    lassoFrom = { x: e.clientX, y: e.clientY, shift: e.shiftKey || e.metaKey };
    lassoBox.hidden = false;
    renderer.domElement.setPointerCapture(e.pointerId);
  }, true);

  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!lassoFrom) return;
    e.stopPropagation();
    const r = stage.getBoundingClientRect();
    const x1 = Math.min(lassoFrom.x, e.clientX) - r.left;
    const y1 = Math.min(lassoFrom.y, e.clientY) - r.top;
    lassoBox.style.left = x1 + "px";
    lassoBox.style.top = y1 + "px";
    lassoBox.style.width = Math.abs(e.clientX - lassoFrom.x) + "px";
    lassoBox.style.height = Math.abs(e.clientY - lassoFrom.y) + "px";
  }, true);

  const lassoEnd = (e) => {
    if (!lassoFrom) return;
    e.stopPropagation();
    const x1 = Math.min(lassoFrom.x, e.clientX), x2 = Math.max(lassoFrom.x, e.clientX);
    const y1 = Math.min(lassoFrom.y, e.clientY), y2 = Math.max(lassoFrom.y, e.clientY);
    const keep = lassoFrom.shift ? picked.slice() : [];
    lassoFrom = null;
    lassoBox.hidden = true;

    if (x2 - x1 < 6 && y2 - y1 < 6) { setLasso(false); return; }
    const caught = pieces.children.filter((o) => {
      const p = screenOf(o);
      return p.z < 1 && p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2;
    });
    picked = keep.slice();
    caught.forEach((o) => { if (picked.indexOf(o) < 0) picked.push(o); });
    chosen = picked.length ? picked[picked.length - 1] : null;
    drawHalos();
    if (sliders) sliders.hidden = !chosen;
    if (chosen) load();
    setLasso(false);
    say(caught.length
      ? "Lassoed " + caught.length + (caught.length === 1 ? " piece" : " pieces") +
        ", " + picked.length + " held in all. Drag any of them and they all move."
      : "Nothing was inside the box.");
  };
  renderer.domElement.addEventListener("pointerup", lassoEnd, true);

  (function collectRunes() {
    const specs = takeFromBench();
    if (!specs.length) return;
    remember();
    const span = 2.6;
    specs.forEach((spec, i) => {
      let g;
      try { g = buildRune(THREE, spec); } catch { return; }
      g.position.set((i - (specs.length - 1) / 2) * span, 0, 0);
      g.userData.kind = g.userData.kind || "Rune";
      g.userData.colour = colour;
      g.userData.finish = finish;
      pieces.add(g);
      if (i === specs.length - 1) select(g);
    });
    showBench();
    const named = specs.map((x) => byId(FUTHARK, x.rune).name).join(", ");
    say((specs.length === 1 ? "Your rune is on the bench: " : "Your runes are on the bench: ") + named +
      ". Move them, add to them, export the lot as an OBJ, or hand the view to the image generator.");
    note(specs.length === 1
      ? "One rune arrived from the forge on the Runes page."
      : specs.length + " runes arrived from the forge on the Runes page.");
    const room = document.getElementById("model-box");
    if (room) setTimeout(() => room.scrollIntoView({ block: "start", behavior: "smooth" }), 120);
  })();

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
