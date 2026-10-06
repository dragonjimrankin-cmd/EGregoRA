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
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
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
  renderer.domElement.addEventListener("pointerdown", (e) => {
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
    renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    yaw -= dx * 0.006;
    pitch = Math.max(-1.3, Math.min(1.4, pitch + dy * 0.006));
    place();
  });
  const release = (e) => {
    if (!dragging) return;
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
  let chosen = null;

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

  const outline = new THREE.BoxHelper(new THREE.Object3D(), 0x7fae7a);
  outline.visible = false;
  scene.add(outline);

  function select(obj) {
    chosen = obj || null;
    outline.visible = Boolean(chosen);
    if (chosen) {
      outline.setFromObject(chosen);
      if (sliders) sliders.hidden = false;
      load();
      say("Selected: " + (chosen.userData.kind || "a piece") +
        ". Use the sliders to move, turn and size it, or recolour it with the swatches.");
    } else {
      if (sliders) sliders.hidden = true;
      say(pieces.children.length
        ? "Nothing selected. Click a piece to pick it up."
        : "Add a solid to begin. Click a solid to select it; drag the background to turn the view.");
    }
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
        b.className = "tool";
        b.textContent = item.label;
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
    if (!hit) return select(null);
    /* Click any part of a ready-made piece and the whole piece is picked. */
    let obj = hit.object;
    while (obj.parent && obj.parent !== pieces) obj = obj.parent;
    select(obj);
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
    chosen.position.set(Number(S.x.value), Number(S.y.value), Number(S.z.value));
    const sc = Number(S.scale.value) || 1;
    chosen.scale.set(sc, sc, sc);
    chosen.rotation.y = (Number(S.turn.value) * Math.PI) / 180;
    chosen.rotation.x = (Number(S.tilt.value) * Math.PI) / 180;
    outline.setFromObject(chosen);
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
    if (!chosen) return;
    const touch = (m) => {
      m.material.color = new THREE.Color(colour);
      const f = FINISH[finish] || FINISH.satin;
      m.material.roughness = f.roughness;
      m.material.metalness = f.metalness;
      m.material.opacity = f.opacity;
      m.material.transparent = f.transparent;
      m.material.needsUpdate = true;
    };
    if (chosen.isMesh) touch(chosen);
    else chosen.traverse((o) => { if (o.isMesh) touch(o); });
    chosen.userData.colour = colour;
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
    if (!chosen) return note("Select a piece first.", true);
    const copy = chosen.clone(true);
    if (copy.isMesh) copy.material = chosen.material.clone();
    else copy.traverse((o) => { if (o.isMesh) o.material = o.material.clone(); });
    copy.position.x += 1.2;
    copy.userData = Object.assign({}, chosen.userData);
    pieces.add(copy);
    select(copy);
    note("");
  });

  const dispose = (obj) => {
    if (obj.isMesh) { obj.geometry.dispose(); obj.material.dispose(); return; }
    obj.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  };

  on("md-delete", () => {
    if (!chosen) return note("Select a piece first.", true);
    pieces.remove(chosen);
    dispose(chosen);
    select(null);
  });

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

  /* --- handing the view to Gink ------------------------------------------- */
  on("md-render", async () => {
    if (!pieces.children.length) return note("Build something first.", true);
    const btn = document.getElementById("md-render");
    btn.disabled = true;
    note("Handing the view over\u2026");
    const wasSelected = chosen;
    select(null);                        // no green outline in the render
    renderer.render(scene, camera);
    try {
      const data = renderer.domElement.toDataURL("image/png").split(",")[1];
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: window.EGAuthHeaders ? window.EGAuthHeaders() : { "content-type": "application/json" },
        body: JSON.stringify({ name: "model.png", type: "image/png", data, asker: "model" })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.url) throw new Error(out.error || "the upload was refused");
      if (window.EGModelHandOver) window.EGModelHandOver(out.url);
      note("The view is attached to the image box above as a sketch. Write what it is made of \u2014 " +
        "brass, oak, stone, flesh \u2014 and press Draw it.");
    } catch (err) {
      note("It could not be handed over: " + ((err && err.message) || "unknown error"), true);
    } finally {
      if (wasSelected) select(wasSelected);
      btn.disabled = false;
    }
  });

  /* --- the loop ----------------------------------------------------------- */
  (function loop() {
    requestAnimationFrame(loop);
    renderer.render(scene, camera);
  })();

  select(null);
}
