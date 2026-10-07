/* ===========================================================================
   The Atlas — the whole site as a branching figure you can turn in your hand
   ---------------------------------------------------------------------------
   One trunk, eleven limbs, the sub-limbs hung off the limb they belong to,
   and under each of those the actual sections of the page, read out of the
   pages themselves by scripts/gather-topics.py. Nothing here is a second
   hand-written list: if a page gains a section, the map gains a twig.

   Drag to turn it. Wheel to come closer. Click a limb to open it; click a
   twig to read what it is; click again, or press the button in the reading,
   to go there. Everything the map can reach is also written out underneath
   as a plain nested list, so the map is a pleasure rather than a toll gate.
   ======================================================================== */
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const host = document.getElementById("atlas-stage");
const feed = document.getElementById("atlas-data");
if (host && feed && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  try { start(JSON.parse(feed.textContent)); } catch (err) { quietly(err); }
}

function quietly(err) {
  if (window.console) console.warn("atlas:", err);
  const box = document.getElementById("atlas-box");
  if (box) box.classList.add("atlas--off");
}

function start(data) {
  /* --- colours, kept in step with the stylesheet ------------------------- */
  const GOLD = 0xd7b05a, BRIGHT = 0xf3ddaa, VERDANT = 0x7fae7a;
  const BLUE = 0x8fb6d8, ROSE = 0xc98b6a, DIM = 0x6d6350;

  const say = (t) => { const el = document.getElementById("atlas-status"); if (el) el.textContent = t; };

  /* --- the tree ---------------------------------------------------------- */
  /* Node: {title, href, kind, depth, pos, home, children, open, mesh, label} */
  const nodes = [];
  const root = {
    title: "EGregoRA", href: "/", kind: "root", depth: 0,
    note: "An order of enquiry. Eleven limbs, one subject.", children: []
  };
  nodes.push(root);

  const add = (parent, spec) => {
    const n = Object.assign({ children: [], open: false, depth: parent.depth + 1, parent }, spec);
    parent.children.push(n);
    nodes.push(n);
    return n;
  };

  data.limbs.forEach((limb) => {
    const L = add(root, {
      title: limb.title, href: limb.href, kind: "limb", num: limb.num,
      note: limb.note, page: limb.page
    });
    limb.subs.forEach((sub) => {
      const S = add(L, { title: sub.title, href: sub.href, kind: "sub", num: sub.num, note: sub.note });
      (sub.topics || []).forEach((t) => add(S, { title: t.title, href: t.href, kind: "topic" }));
    });
    (limb.topics || []).forEach((t) => add(L, { title: t.title, href: t.href, kind: "topic" }));
  });

  /* --- where everything sits -------------------------------------------- */
  const V = THREE.Vector3;

  /* Two vectors at right angles to d, so children can be fanned around the
     direction their parent is already pointing. */
  const frame = (d) => {
    const up = Math.abs(d.y) > 0.9 ? new V(1, 0, 0) : new V(0, 1, 0);
    const u = new V().crossVectors(d, up).normalize();
    const v = new V().crossVectors(d, u).normalize();
    return [u, v];
  };

  root.pos = new V(0, 0, 0);
  root.home = root.pos.clone();

  const LIMBS = root.children;
  LIMBS.forEach((L, i) => {
    const a = (i / LIMBS.length) * Math.PI * 2;
    const lift = Math.sin(i * 1.9) * 2.6;
    L.pos = new V(Math.cos(a) * 10, lift, Math.sin(a) * 10);
    L.home = L.pos.clone();
    L.dir = L.pos.clone().normalize();
  });

  const fan = (parent, reach, spread) => {
    const kids = parent.children;
    if (!kids.length) return;
    const d = parent.dir ? parent.dir.clone() : new V(0, 1, 0);
    const [u, v] = frame(d);
    kids.forEach((k, i) => {
      const t = kids.length === 1 ? 0 : (i / kids.length) * Math.PI * 2;
      const wobble = 1 + (i % 3) * 0.17;
      const off = u.clone().multiplyScalar(Math.cos(t) * spread * wobble)
        .add(v.clone().multiplyScalar(Math.sin(t) * spread * wobble * 0.72));
      k.home = parent.home.clone().add(d.clone().multiplyScalar(reach * wobble)).add(off);
      k.dir = k.home.clone().sub(parent.home).normalize();
      k.pos = parent.home.clone();          /* grows out of its parent */
      fan(k, reach * 0.62, spread * 0.58);
    });
  };
  LIMBS.forEach((L) => fan(L, 5.2, 3.4));

  /* --- the room ---------------------------------------------------------- */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0a09, 0.022);

  const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 500);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.PointLight(BRIGHT, 220, 120);
  key.position.set(14, 18, 16);
  scene.add(key);
  const fill = new THREE.PointLight(BLUE, 90, 120);
  fill.position.set(-18, -8, -12);
  scene.add(fill);

  /* a few grains of dust, so the turning reads as turning */
  const dust = new THREE.BufferGeometry();
  const grains = new Float32Array(600 * 3);
  for (let i = 0; i < grains.length; i++) grains[i] = (Math.random() - 0.5) * 90;
  dust.setAttribute("position", new THREE.BufferAttribute(grains, 3));
  scene.add(new THREE.Points(dust, new THREE.PointsMaterial({
    color: GOLD, size: 0.12, transparent: true, opacity: 0.4
  })));

  /* --- the bodies -------------------------------------------------------- */
  const SIZE = { root: 1.15, limb: 0.66, sub: 0.44, topic: 0.26 };
  const TINT = { root: BRIGHT, limb: GOLD, sub: VERDANT, topic: BLUE };
  const ball = {
    root: new THREE.IcosahedronGeometry(1, 2),
    limb: new THREE.IcosahedronGeometry(1, 1),
    sub: new THREE.OctahedronGeometry(1, 0),
    topic: new THREE.TetrahedronGeometry(1, 0)
  };

  const pickable = [];
  nodes.forEach((n) => {
    const mat = new THREE.MeshStandardMaterial({
      color: TINT[n.kind], emissive: TINT[n.kind], emissiveIntensity: 0.22,
      roughness: 0.42, metalness: 0.35, transparent: true, opacity: 1
    });
    const m = new THREE.Mesh(ball[n.kind], mat);
    m.scale.setScalar(SIZE[n.kind]);
    m.position.copy(n.pos);
    m.userData.node = n;
    n.mesh = m;
    n.mat = mat;
    scene.add(m);
    pickable.push(m);

    if (n.parent) {
      const g = new THREE.BufferGeometry().setFromPoints([n.parent.pos.clone(), n.pos.clone()]);
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({
        color: n.kind === "topic" ? DIM : GOLD, transparent: true, opacity: 0.5
      }));
      n.line = line;
      scene.add(line);
    }
  });

  /* Limbs and sub-limbs are always out; topics wait to be asked for. */
  const shown = (n) => n.depth <= 1 || (n.parent && n.parent.open) ||
    (n.kind === "sub" && n.parent && n.parent.kind === "limb");

  /* --- the labels -------------------------------------------------------- */
  const layer = document.getElementById("atlas-labels");
  nodes.forEach((n) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "atlas-label is-" + n.kind;
    el.textContent = (n.num ? n.num + " \u00b7 " : "") + n.title;
    el.addEventListener("click", (e) => { e.stopPropagation(); choose(n); });
    layer.appendChild(el);
    n.label = el;
  });

  /* --- turning it -------------------------------------------------------- */
  let yaw = 0.6, pitch = 0.32, dist = 34, spin = true;
  const target = new V(0, 0, 0);
  const place = () => {
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    camera.position.set(
      target.x + Math.sin(yaw) * cp * dist,
      target.y + sp * dist,
      target.z + Math.cos(yaw) * cp * dist
    );
    camera.lookAt(target);
  };

  let drag = null;
  renderer.domElement.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, moved: 0 };
    renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!drag) { hoverAt(e); return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    yaw -= dx * 0.006;
    pitch = Math.max(-1.3, Math.min(1.3, pitch + dy * 0.006));
    spin = false;
  });
  const letGo = (e) => {
    if (drag && drag.moved < 5) pickAt(e);
    drag = null;
  };
  renderer.domElement.addEventListener("pointerup", letGo);
  renderer.domElement.addEventListener("pointercancel", () => { drag = null; });
  renderer.domElement.addEventListener("wheel", (e) => {
    e.preventDefault();
    dist = Math.max(8, Math.min(70, dist + Math.sign(e.deltaY) * 2.2));
  }, { passive: false });

  /* --- choosing ---------------------------------------------------------- */
  const ray = new THREE.Raycaster();
  const where = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    return new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1
    );
  };
  const under = (e) => {
    ray.setFromCamera(where(e), camera);
    const hits = ray.intersectObjects(pickable.filter((m) => m.visible), false);
    return hits.length ? hits[0].object.userData.node : null;
  };

  let hot = null, chosen = null;
  const hoverAt = (e) => {
    const n = under(e);
    if (n === hot) return;
    hot = n;
    renderer.domElement.style.cursor = n ? "pointer" : "grab";
  };
  const pickAt = (e) => {
    const n = under(e);
    if (n) choose(n); else clear();
  };

  const KIND = { root: "The trunk", limb: "A limb", sub: "A sub-limb", topic: "A section of the page" };

  function choose(n) {
    chosen = n;
    if (n.children.length) {
      n.open = !n.open;
      if (n.open) root.children.forEach((o) => { if (o !== n && o.kind === "limb") o.open = false; });
    }
    target.copy(n.home);
    if (n.kind !== "root") dist = Math.min(dist, n.kind === "limb" ? 26 : 18);
    spin = false;
    paint(n);
  }

  function clear() {
    chosen = null;
    target.set(0, 0, 0);
    paint(null);
  }

  const read = document.getElementById("atlas-read");
  function paint(n) {
    if (!read) return;
    if (!n) {
      read.innerHTML = '<p class="muted small">Turn it with a drag, come closer with the wheel. ' +
        'Click a limb to open its sections; click anything to read what it is.</p>';
      return;
    }
    const kids = n.children.length
      ? '<p class="muted small">' + n.children.length +
        (n.children.length === 1 ? " branch" : " branches") +
        (n.open ? " \u2014 open. Click again to fold it away." : " \u2014 click the node to open it.") + "</p>"
      : "";
    read.innerHTML =
      '<p class="kicker">' + KIND[n.kind] + (n.num ? " \u00b7 " + n.num : "") + "</p>" +
      "<h3>" + n.title + "</h3>" +
      (n.note ? "<p>" + n.note + "</p>" : "") +
      kids +
      '<p><a class="btn" href="' + n.href + '">Go there &rarr;</a></p>';
  }
  paint(null);

  /* --- buttons ----------------------------------------------------------- */
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
  on("at-spin", (e) => {
    spin = !spin;
    e.currentTarget.textContent = spin ? "Hold Still" : "Turn It";
    e.currentTarget.setAttribute("aria-pressed", String(spin));
  });
  on("at-open", () => { nodes.forEach((n) => { if (n.children.length) n.open = true; }); say("Everything open."); });
  on("at-fold", () => { nodes.forEach((n) => { n.open = false; }); clear(); say("Folded back to the limbs."); });
  on("at-home", () => { yaw = 0.6; pitch = 0.32; dist = 34; clear(); spin = true; say("Back to the whole figure."); });

  const find = document.getElementById("at-find");
  if (find) find.addEventListener("input", () => {
    const q = find.value.trim().toLowerCase();
    nodes.forEach((n) => { n.lit = q.length > 1 && n.title.toLowerCase().indexOf(q) >= 0; });
    if (q.length > 1) {
      const hits = nodes.filter((n) => n.lit);
      nodes.forEach((n) => { if (n.lit) { let p = n.parent; while (p) { p.open = true; p = p.parent; } } });
      say(hits.length ? hits.length + (hits.length === 1 ? " match" : " matches") + ", lit in rose."
        : "Nothing of that name on the map.");
      if (hits.length === 1) { target.copy(hits[0].home); dist = 16; spin = false; paint(hits[0]); }
    } else say("");
  });

  /* --- the loop ---------------------------------------------------------- */
  const screen = new V();
  let w = 0, h = 0;

  const fit = () => {
    const r = host.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else addEventListener("resize", fit);
  fit();

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (spin) yaw += dt * 0.12;
    place();

    nodes.forEach((n) => {
      const out = shown(n);
      const want = out ? n.home : (n.parent ? n.parent.pos : n.home);
      n.pos.lerp(want, 1 - Math.pow(0.004, dt));

      const grown = out ? 1 : 0.001;
      const s = SIZE[n.kind] * (n.mesh.scale.x / SIZE[n.kind] + (grown - n.mesh.scale.x / SIZE[n.kind]) * (1 - Math.pow(0.004, dt)));
      n.mesh.scale.setScalar(Math.max(0.0001, s));
      n.mesh.position.copy(n.pos);
      n.mesh.visible = s > SIZE[n.kind] * 0.08;
      n.mesh.rotation.y += dt * (n.kind === "topic" ? 0.8 : 0.3);

      const picked = n === chosen, warm = n === hot || n.lit;
      n.mat.emissiveIntensity = picked ? 0.95 : warm ? 0.6 : 0.22;
      n.mat.color.setHex(n.lit ? ROSE : TINT[n.kind]);

      if (n.line) {
        n.line.geometry.setFromPoints([n.parent.pos, n.pos]);
        n.line.material.opacity = out ? (n.kind === "topic" ? 0.3 : 0.55) : 0;
        n.line.visible = out;
      }

      /* the label, projected onto the glass */
      const el = n.label;
      const wanted = n.mesh.visible && (n.depth <= 1 || picked || warm ||
        (n.parent && (n.parent === chosen || n.parent.open)));
      if (!wanted) { el.style.display = "none"; return; }
      screen.copy(n.pos).project(camera);
      if (screen.z > 1) { el.style.display = "none"; return; }
      el.style.display = "";
      el.style.transform = "translate(-50%,-50%) translate(" +
        ((screen.x * 0.5 + 0.5) * w).toFixed(1) + "px," +
        ((-screen.y * 0.5 + 0.5) * h).toFixed(1) + "px)";
      el.classList.toggle("is-on", picked || warm);
      el.style.opacity = String(Math.max(0.25, 1 - Math.max(0, (camera.position.distanceTo(n.pos) - 18) / 34)));
    });

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  say(nodes.length + " places on the map. Drag to turn it.");
}
