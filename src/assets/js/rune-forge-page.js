/* ===========================================================================
   The Rune Forge — the bench on the Runes page
   ---------------------------------------------------------------------------
   Cut a rune into a blank of your choosing, set a stone into it, write down
   what it is going to mean for you, and keep it. A kept rune can be sent to
   the Turning Shop on the Ask Ed page, where it can be arranged with
   everything else, exported as an OBJ, or handed to the image generator.

   Everything happens in the page. The rune book is kept in this browser and
   is never sent anywhere.
   ======================================================================== */
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import {
  FUTHARK, SUBSTANCES, GEMS, BLANKS, SETTINGS,
  buildRune, blankSpec, byId, sendToBench, BOOK_KEY
} from "./rune-forge.js";

const stage = document.getElementById("forge-stage");
if (stage) start();

function start() {
  const say = (t, bad) => {
    const el = document.getElementById("forge-msg");
    if (!el) return;
    el.textContent = t || "";
    el.className = "auth-msg" + (bad ? " is-bad" : "");
  };

  /* --- the room ---------------------------------------------------------- */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0a12);
  const camera = new THREE.PerspectiveCamera(42, 16 / 11, 0.1, 100);
  camera.position.set(0, 0.4, 6.2);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch {
    stage.textContent = "This browser will not open a 3D window.";
    return;
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  stage.appendChild(renderer.domElement);

  const fit = () => {
    const w = stage.clientWidth || 640;
    const h = Math.round(w * 0.68);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  fit();
  new ResizeObserver(fit).observe(stage);

  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x1a1420, 0.75));
  const key = new THREE.DirectionalLight(0xffe9c2, 1.5);
  key.position.set(3.4, 5, 4.2);
  key.castShadow = true;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8fb6d8, 0.7);
  rim.position.set(-4, 1.4, -3);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7, 48),
    new THREE.MeshStandardMaterial({ color: 0x14121c, roughness: 0.95 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.1;
  floor.receiveShadow = true;
  scene.add(floor);

  /* --- the piece on the bench -------------------------------------------- */
  let spec = blankSpec(0);
  let piece = null;
  let spin = true;
  let yaw = 0, pitch = 0.1;

  function rebuild() {
    if (piece) {
      scene.remove(piece);
      piece.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
    }
    piece = buildRune(THREE, spec);
    scene.add(piece);
    paintReading();
  }

  /* --- the controls ------------------------------------------------------- */
  const fill = (id, list, value) => {
    const el = document.getElementById(id);
    if (!el) return;
    const groups = new Map();
    list.forEach((item) => {
      const g = item.group || "";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(item);
    });
    el.innerHTML = "";
    const add = (parent, item) => {
      const o = document.createElement("option");
      o.value = item.id;
      o.textContent = item.label || item.name;
      if (item.id === value) o.selected = true;
      parent.appendChild(o);
    };
    if (groups.size > 1) {
      groups.forEach((items, g) => {
        const og = document.createElement("optgroup");
        og.label = g;
        items.forEach((i) => add(og, i));
        el.appendChild(og);
      });
    } else {
      list.forEach((i) => add(el, i));
    }
  };

  fill("rf-rune", FUTHARK.map((r) => ({ id: r.id, label: r.char + "  " + r.name + " \u2014 " + r.gloss })), spec.rune);
  fill("rf-blank", BLANKS, spec.blank);
  fill("rf-substance", SUBSTANCES, spec.substance);
  fill("rf-gem", GEMS, spec.gem);
  fill("rf-setting", SETTINGS, spec.setting);

  const bind = (id, key2, after) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      spec[key2] = el.type === "range" ? Number(el.value) / 100 : el.value;
      if (after) after();
      rebuild();
    });
  };
  bind("rf-rune", "rune");
  bind("rf-blank", "blank");
  bind("rf-substance", "substance");
  bind("rf-gem", "gem");
  bind("rf-setting", "setting");
  const depthOut = document.getElementById("rf-depth-out");
  bind("rf-depth", "depth", () => {
    if (depthOut) depthOut.textContent = Math.round(spec.depth * 100) + "%";
  });

  const meaningEl = document.getElementById("rf-meaning");
  if (meaningEl) meaningEl.addEventListener("input", () => {
    spec.meaning = meaningEl.value.slice(0, 400);
    if (piece) piece.userData.meaning = spec.meaning;
    paintReading();
  });

  /* What the rune says: the tradition's gloss, then the maker's own, kept
     plainly apart. A personal meaning does not overwrite the inherited one;
     it stands beside it. */
  function paintReading() {
    const el = document.getElementById("rf-reading");
    if (!el) return;
    const r = byId(FUTHARK, spec.rune);
    const g = byId(GEMS, spec.gem);
    const sub = byId(SUBSTANCES, spec.substance);
    const mine = (spec.meaning || "").trim();
    el.innerHTML =
      '<p class="rune-char" aria-hidden="true">' + r.char + "</p>" +
      "<p><strong>" + r.name + "</strong> \u00b7 sound <em>" + r.sound + "</em> \u00b7 " +
      sub.label.toLowerCase() + (g.id === "none" ? "" : ", set with " + g.label.toLowerCase()) + "</p>" +
      '<p class="muted small"><strong>Inherited:</strong> ' + r.gloss + ". This is what the stave has " +
      "meant historically, as far as the sources go \u2014 and the sources are thinner than the posters suggest.</p>" +
      (mine
        ? '<p class="muted small"><strong>Yours:</strong> ' + esc(mine) + "</p>"
        : '<p class="muted xsmall">Write your own meaning below. It is kept with the rune, and travels with it to the bench.</p>');
  }

  const esc = (t) => String(t).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* --- turning it in the hand -------------------------------------------- */
  let dragging = false, lastX = 0, lastY = 0;
  renderer.domElement.addEventListener("pointerdown", (e) => {
    dragging = true; spin = false; lastX = e.clientX; lastY = e.clientY;
    renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    yaw += (e.clientX - lastX) * 0.01;
    pitch = Math.max(-1.2, Math.min(1.2, pitch + (e.clientY - lastY) * 0.01));
    lastX = e.clientX; lastY = e.clientY;
  });
  const letGo = () => { dragging = false; };
  renderer.domElement.addEventListener("pointerup", letGo);
  renderer.domElement.addEventListener("pointercancel", letGo);
  renderer.domElement.addEventListener("wheel", (e) => {
    e.preventDefault();
    camera.position.z = Math.max(3, Math.min(12, camera.position.z + (e.deltaY > 0 ? 0.4 : -0.4)));
  }, { passive: false });

  const spinBtn = document.getElementById("rf-spin");
  if (spinBtn) spinBtn.addEventListener("click", () => {
    spin = !spin;
    spinBtn.setAttribute("aria-pressed", String(spin));
    spinBtn.textContent = spin ? "Hold it still" : "Let it turn";
  });

  /* --- the rune book ------------------------------------------------------ */
  let book = [];
  try { book = JSON.parse(localStorage.getItem(BOOK_KEY) || "[]"); } catch { book = []; }
  if (!Array.isArray(book)) book = [];

  const shelf = document.getElementById("rf-book");
  const countEl = document.getElementById("rf-count");

  function saveBook() {
    try { localStorage.setItem(BOOK_KEY, JSON.stringify(book)); } catch { /* private window */ }
  }

  function paintBook() {
    if (!shelf) return;
    shelf.innerHTML = "";
    if (!book.length) {
      shelf.innerHTML = '<li class="muted small">Nothing kept yet. Cut one and press <em>Keep this rune</em>.</li>';
    }
    book.forEach((b, i) => {
      const r = byId(FUTHARK, b.rune);
      const g = byId(GEMS, b.gem);
      const li = document.createElement("li");
      li.className = "rune-kept";
      li.innerHTML =
        '<span class="rune-kept-char" aria-hidden="true">' + r.char + "</span>" +
        '<span class="rune-kept-body"><strong>' + r.name + "</strong> \u00b7 " +
        byId(SUBSTANCES, b.substance).label.toLowerCase() +
        (g.id === "none" ? "" : " \u00b7 " + g.label.toLowerCase()) +
        ((b.meaning || "").trim() ? '<br><em>' + esc(b.meaning) + "</em>" : "") +
        "</span>";
      const edit = document.createElement("button");
      edit.type = "button"; edit.className = "tool"; edit.textContent = "Open";
      edit.addEventListener("click", () => {
        spec = Object.assign({}, b);
        ["rune", "blank", "substance", "gem", "setting"].forEach((k) => {
          const el = document.getElementById("rf-" + k);
          if (el) el.value = spec[k];
        });
        const d = document.getElementById("rf-depth");
        if (d) d.value = String(Math.round((spec.depth || 0.5) * 100));
        if (depthOut) depthOut.textContent = Math.round((spec.depth || 0.5) * 100) + "%";
        if (meaningEl) meaningEl.value = spec.meaning || "";
        rebuild();
        say("Opened on the bench. Change anything and keep it again.");
      });
      const drop = document.createElement("button");
      drop.type = "button"; drop.className = "tool"; drop.textContent = "Discard";
      drop.addEventListener("click", () => {
        book.splice(i, 1); saveBook(); paintBook();
      });
      const acts = document.createElement("span");
      acts.className = "rune-kept-acts";
      acts.append(edit, drop);
      li.appendChild(acts);
      shelf.appendChild(li);
    });
    if (countEl) countEl.textContent = String(book.length);
    const send = document.getElementById("rf-send-all");
    if (send) send.disabled = !book.length;
  }
  paintBook();

  const keep = document.getElementById("rf-keep");
  if (keep) keep.addEventListener("click", () => {
    book.push(Object.assign({}, spec, { made: Date.now() }));
    saveBook();
    paintBook();
    say("Kept. It is in your rune book below, in this browser only.");
  });

  const clear = document.getElementById("rf-forget");
  if (clear) clear.addEventListener("click", () => {
    book = [];
    saveBook();
    paintBook();
    say("The book is empty again.");
  });

  /* --- to the bench on the Ask Ed page ------------------------------------ */
  const go = (specs, what) => {
    if (!specs.length) { say("Nothing to send.", true); return; }
    if (!sendToBench(specs)) {
      say("This browser will not hold the hand-over \u2014 private mode blocks it.", true);
      return;
    }
    say("Sending " + what + " to the Turning Shop\u2026");
    window.location.href = "/ask-ed/#model-box";
  };
  const sendOne = document.getElementById("rf-send");
  if (sendOne) sendOne.addEventListener("click", () => go([spec], "this rune"));
  const sendAll = document.getElementById("rf-send-all");
  if (sendAll) sendAll.addEventListener("click", () =>
    go(book.slice(), book.length === 1 ? "the kept rune" : "all " + book.length + " kept runes"));

  /* --- the loop ----------------------------------------------------------- */
  rebuild();
  (function loop() {
    requestAnimationFrame(loop);
    if (piece) {
      if (spin) yaw += 0.006;
      piece.rotation.y = yaw;
      piece.rotation.x = pitch;
    }
    renderer.render(scene, camera);
  })();

  say("Cut a rune, set a stone, and write what it is for.");
}
