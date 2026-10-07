/* ===========================================================================
   The Atlas — the whole site as one figure you can turn in your hand
   ---------------------------------------------------------------------------
   One trunk, eleven limbs, the sub-limbs hung off the limb they belong to,
   and under each of those the actual sections of the page, read out of the
   pages themselves by scripts/gather-topics.py. Nothing here is a second
   hand-written list: if a page gains a section, the map gains a twig.

   The same map is drawn four ways, because the same structure genuinely is
   all four of these things:

     the figure    a plain branching body, the clearest to read
     the cosmos    Möbius-seamed torus knots strung round a multiverse
     the tree      a trunk, boughs and twigs, which is what a limb is
     the galaxy    stars, planets and moons turning in EGregoRA

   Only one stem stands open at a time. Opening a limb folds every other
   limb away, and opening a sub-limb folds its sisters, so the figure never
   becomes a thicket. Clicking anything darkens the rest of the page to
   almost nothing and gives the map the whole screen; Escape, or the button,
   gives the page back.
   ======================================================================== */
import * as THREE from "./vendor/three.module.js";

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
  const GOLD = 0xd7b05a, BRIGHT = 0xf3ddaa, VERDANT = 0x7fae7a;
  const BLUE = 0x8fb6d8, ROSE = 0xc98b6a, DIM = 0x6d6350;
  const V = THREE.Vector3;

  const say = (t) => { const el = document.getElementById("atlas-status"); if (el) el.textContent = t; };

  /* ------------------------------------------------------------- the tree */
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

  const LIMBS = root.children;

  /* ------------------------------------------------------------ the rooms */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0b0a09, 0.018);

  const camera = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 900);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.PointLight(BRIGHT, 260, 220);
  key.position.set(16, 22, 18);
  scene.add(key);
  const fill = new THREE.PointLight(BLUE, 110, 220);
  fill.position.set(-20, -10, -14);
  scene.add(fill);

  const dust = new THREE.BufferGeometry();
  const grains = new Float32Array(700 * 3);
  for (let i = 0; i < grains.length; i++) grains[i] = (Math.random() - 0.5) * 110;
  dust.setAttribute("position", new THREE.BufferAttribute(grains, 3));
  scene.add(new THREE.Points(dust, new THREE.PointsMaterial({
    color: GOLD, size: 0.12, transparent: true, opacity: 0.35
  })));

  /* --------------------------------------------------------- the four maps
     A skin says three things: where everything stands, what each node is
     made of, and what scenery stands behind it. Everything else — opening,
     reading, searching, going there — is the same whichever skin is on. */

  /* Two vectors at right angles to d, for fanning children. */
  const frame = (d) => {
    const up = Math.abs(d.y) > 0.9 ? new V(1, 0, 0) : new V(0, 1, 0);
    const u = new V().crossVectors(d, up).normalize();
    const v = new V().crossVectors(d, u).normalize();
    return [u, v];
  };

  const fan = (parent, reach, spread, bias) => {
    const kids = parent.children;
    if (!kids.length) return;
    const d = (parent.dir ? parent.dir.clone() : new V(0, 1, 0))
      .add(bias || new V()).normalize();
    const [u, v] = frame(d);
    kids.forEach((k, i) => {
      const t = kids.length === 1 ? 0 : (i / kids.length) * Math.PI * 2;
      const wobble = 1 + (i % 3) * 0.17;
      const off = u.clone().multiplyScalar(Math.cos(t) * spread * wobble)
        .add(v.clone().multiplyScalar(Math.sin(t) * spread * wobble * 0.72));
      k.home = parent.home.clone().add(d.clone().multiplyScalar(reach * wobble)).add(off);
      k.dir = k.home.clone().sub(parent.home).normalize();
      fan(k, reach * 0.62, spread * 0.58, bias);
    });
  };

  /* A ring of n points on a sphere, spread by the golden angle so eleven
     limbs are evenly scattered rather than banded. */
  const spiralOnSphere = (i, n, r) => {
    const y = 1 - (i / Math.max(1, n - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const a = i * Math.PI * (3 - Math.sqrt(5));
    return new V(Math.cos(a) * rad * r, y * r * 0.8, Math.sin(a) * rad * r);
  };

  const SKINS = {
    figure: {
      label: "The Figure",
      blurb: "The plain branching body. The clearest of the four to read.",
      dist: 34,
      place() {
        root.home = new V(0, 0, 0);
        LIMBS.forEach((L, i) => {
          const a = (i / LIMBS.length) * Math.PI * 2;
          L.home = new V(Math.cos(a) * 10, Math.sin(i * 1.9) * 2.6, Math.sin(a) * 10);
          L.dir = L.home.clone().normalize();
          fan(L, 5.2, 3.4);
        });
      },
      shape: {
        root: () => new THREE.IcosahedronGeometry(1, 2),
        limb: () => new THREE.IcosahedronGeometry(1, 1),
        sub: () => new THREE.OctahedronGeometry(1, 0),
        topic: () => new THREE.TetrahedronGeometry(1, 0)
      },
      size: { root: 1.15, limb: 0.66, sub: 0.44, topic: 0.26 },
      tint: { root: BRIGHT, limb: GOLD, sub: VERDANT, topic: BLUE },
      scenery: () => null
    },

    cosmos: {
      label: "The Cosmos",
      blurb: "Each limb a torus knot, seamed like a M\u00f6bius band and threaded " +
        "through the others, all of them held inside one round multiverse.",
      dist: 62,
      place() {
        root.home = new V(0, 0, 0);
        const R = 26;
        LIMBS.forEach((L, i) => {
          L.home = spiralOnSphere(i, LIMBS.length, R);
          L.dir = L.home.clone().normalize();
          /* Children hang inward along the knot's own axis, so a limb reads
             as a little universe with its own contents rather than as spikes
             pointing out of the shell. */
          fan(L, 6.4, 4.2, L.dir.clone().multiplyScalar(-0.55));
        });
      },
      shape: {
        root: () => new THREE.IcosahedronGeometry(1, 3),
        /* p and q coprime gives a genuine knot rather than a loop. */
        limb: (i) => new THREE.TorusKnotGeometry(1, 0.3, 140, 20, 2 + (i % 4), 3 + ((i * 2) % 5)),
        sub: () => new THREE.TorusGeometry(0.8, 0.26, 14, 40),
        topic: () => new THREE.SphereGeometry(1, 16, 12)
      },
      size: { root: 2.4, limb: 2.1, sub: 1.05, topic: 0.4 },
      tint: { root: BRIGHT, limb: GOLD, sub: VERDANT, topic: BLUE },
      scenery(group) {
        /* The multiverse: one round shell with everything inside it. */
        const shell = new THREE.Mesh(
          new THREE.IcosahedronGeometry(34, 3),
          new THREE.MeshBasicMaterial({ color: 0x4c6b8a, wireframe: true, transparent: true, opacity: 0.1 })
        );
        group.add(shell);
        const haze = new THREE.Mesh(
          new THREE.SphereGeometry(33, 36, 24),
          new THREE.MeshBasicMaterial({ color: 0x2b3b55, transparent: true, opacity: 0.05, side: THREE.BackSide })
        );
        group.add(haze);

        /* The seam. A M\u00f6bius band is a strip given half a twist before its
           ends are joined, which is why it has one side and one edge: the
           order's favourite fact about continuity, drawn here as the thread
           the knots are strung on. */
        const strip = [];
        const SEG = 260, W = 1.5, R = 30;
        for (let i = 0; i <= SEG; i++) {
          const u = (i / SEG) * Math.PI * 2;
          for (const s of [-1, 1]) {
            const v = s * W;
            const x = (R + v * Math.cos(u / 2)) * Math.cos(u);
            const y = v * Math.sin(u / 2);
            const z = (R + v * Math.cos(u / 2)) * Math.sin(u);
            strip.push(x, y, z);
          }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(strip, 3));
        const idx = [];
        for (let i = 0; i < SEG; i++) {
          const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
          idx.push(a, b, c, b, d, c);
        }
        geo.setIndex(idx);
        geo.computeVertexNormals();
        group.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
          color: GOLD, metalness: 0.7, roughness: 0.35,
          transparent: true, opacity: 0.34, side: THREE.DoubleSide
        })));
        return group;
      }
    },

    tree: {
      label: "The Tree",
      blurb: "A trunk, eleven boughs and their twigs \u2014 which is what a limb " +
        "has meant here all along.",
      dist: 40,
      place() {
        root.home = new V(0, -2, 0);
        LIMBS.forEach((L, i) => {
          /* Up the trunk in a spiral, the way a real bough leaves it: the
             higher the limb, the shorter its reach, so the crown closes. */
          const t = i / (LIMBS.length - 1);
          const a = i * 2.39996;                    /* the golden angle again */
          const y = 3 + t * 15;
          const out = 9.5 - t * 3.4;
          L.home = new V(Math.cos(a) * out, y, Math.sin(a) * out);
          L.dir = new V(Math.cos(a) * 0.72, 0.62, Math.sin(a) * 0.72).normalize();
          fan(L, 4.4, 2.8, new V(0, 0.4, 0));
        });
      },
      shape: {
        root: () => new THREE.CylinderGeometry(1, 1.5, 3, 16),
        limb: () => new THREE.SphereGeometry(1, 18, 14),
        sub: () => new THREE.SphereGeometry(0.9, 14, 10),
        topic: () => new THREE.IcosahedronGeometry(1, 0)
      },
      size: { root: 1.3, limb: 0.9, sub: 0.6, topic: 0.3 },
      tint: { root: 0x8a6b40, limb: VERDANT, sub: 0x9ec28f, topic: BRIGHT },
      scenery(group) {
        const bark = new THREE.MeshStandardMaterial({ color: 0x6b5236, roughness: 0.92, metalness: 0.02 });
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 2.6, 22, 20, 1, true), bark);
        trunk.position.y = 6;
        group.add(trunk);
        /* Roots, so the thing is standing rather than floating. */
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          const r = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.5, 6, 8), bark);
          r.position.set(Math.cos(a) * 2, -6, Math.sin(a) * 2);
          r.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5);
          group.add(r);
        }
        const ground = new THREE.Mesh(
          new THREE.CircleGeometry(30, 48),
          new THREE.MeshBasicMaterial({ color: 0x1a2318, transparent: true, opacity: 0.4 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -8.4;
        group.add(ground);
        return group;
      }
    },

    galaxy: {
      label: "The Galaxy",
      blurb: "EGregoRA as a galaxy: each limb a star, its sub-limbs planets, " +
        "and every section of a page a moon.",
      dist: 54,
      place() {
        root.home = new V(0, 0, 0);
        LIMBS.forEach((L, i) => {
          /* Two logarithmic arms, the way a barred spiral actually winds. */
          const arm = i % 2;
          const t = Math.floor(i / 2) / Math.ceil(LIMBS.length / 2);
          const a = arm * Math.PI + t * 2.5;
          const r = 7 + t * 20;
          L.home = new V(Math.cos(a) * r, (Math.random() - 0.5) * 1.6, Math.sin(a) * r);
          L.dir = new V(-Math.sin(a), 0.08, Math.cos(a)).normalize();
          /* Planets ride round their star in the plane of the disc, and
             moons round the planets. */
          L.children.forEach((k, j) => {
            const ka = (j / Math.max(1, L.children.length)) * Math.PI * 2;
            const kr = k.kind === "sub" ? 4.2 : 3.2 + (j % 3) * 0.5;
            k.home = L.home.clone().add(new V(Math.cos(ka) * kr, (j % 2 ? 0.5 : -0.5), Math.sin(ka) * kr));
            k.dir = k.home.clone().sub(L.home).normalize();
            k.children.forEach((m, q) => {
              const ma = (q / Math.max(1, k.children.length)) * Math.PI * 2;
              m.home = k.home.clone().add(new V(Math.cos(ma) * 1.9, (q % 2 ? 0.3 : -0.3), Math.sin(ma) * 1.9));
              m.dir = m.home.clone().sub(k.home).normalize();
            });
          });
        });
      },
      shape: {
        root: () => new THREE.SphereGeometry(1, 32, 24),
        limb: () => new THREE.SphereGeometry(1, 24, 18),
        sub: () => new THREE.SphereGeometry(1, 20, 14),
        topic: () => new THREE.SphereGeometry(1, 12, 10)
      },
      size: { root: 3.4, limb: 1.1, sub: 0.6, topic: 0.28 },
      tint: { root: BRIGHT, limb: 0xffd9a0, sub: 0x9fc3e8, topic: 0xcfc4a8 },
      scenery(group) {
        /* The disc: a hundred thousand suns, standing in for themselves. */
        const pts = [];
        for (let i = 0; i < 4200; i++) {
          const arm = i % 2;
          const t = Math.pow(Math.random(), 0.65);
          const a = arm * Math.PI + t * 2.6 + (Math.random() - 0.5) * 0.44;
          const r = 5 + t * 30 + (Math.random() - 0.5) * 3.4;
          pts.push(Math.cos(a) * r, (Math.random() - 0.5) * (2.6 - t * 1.6), Math.sin(a) * r);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        group.add(new THREE.Points(g, new THREE.PointsMaterial({
          color: 0xcddcf2, size: 0.26, transparent: true, opacity: 0.6
        })));
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(5.4, 32, 24),
          new THREE.MeshBasicMaterial({ color: 0xffe6b0, transparent: true, opacity: 0.12 })
        );
        group.add(core);
        return group;
      }
    }
  };

  const ORDER = ["figure", "cosmos", "tree", "galaxy"];
  const SAVED = "eg-atlas-skin";
  let skinName = "figure";
  try {
    const was = window.localStorage.getItem(SAVED);
    if (was && SKINS[was]) skinName = was;
  } catch { /* no store */ }
  let skin = SKINS[skinName];

  /* ------------------------------------------------------------ the bodies */
  const sceneryGroup = new THREE.Group();
  scene.add(sceneryGroup);

  nodes.forEach((n, i) => {
    n.order = i;
    n.mat = new THREE.MeshStandardMaterial({
      color: GOLD, emissive: GOLD, emissiveIntensity: 0.22,
      roughness: 0.42, metalness: 0.35, transparent: true, opacity: 1
    });
    n.mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), n.mat);
    n.mesh.userData.node = n;
    n.pos = new V();
    scene.add(n.mesh);

    if (n.parent) {
      n.line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new V(), new V()]),
        new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.5 })
      );
      scene.add(n.line);
    }
  });

  function dressSkin() {
    skin.place();
    nodes.forEach((n) => {
      const make = skin.shape[n.kind];
      n.mesh.geometry.dispose();
      n.mesh.geometry = make(n.order);
      n.mat.color.setHex(skin.tint[n.kind]);
      n.mat.emissive.setHex(skin.tint[n.kind]);
      if (n.line) n.line.material.color.setHex(n.kind === "topic" ? DIM : GOLD);
      /* Everything starts folded into its parent and grows out. */
      if (!n.started) { n.pos.copy(n.parent ? n.parent.home : n.home); n.started = true; }
    });
    while (sceneryGroup.children.length) {
      const kid = sceneryGroup.children.pop();
      if (kid.geometry) kid.geometry.dispose();
      if (kid.material) kid.material.dispose();
    }
    if (skin.scenery) skin.scenery(sceneryGroup);
    dist = skin.dist;
    scene.fog.density = skinName === "figure" ? 0.018 : 0.006;
  }

  /* ------------------------------------------------- one stem at a time ---
     Opening a node folds every node that is not on its own line of descent.
     That is the whole rule, and it is applied centrally so no button can
     get round it. */
  function openOnly(node) {
    const keep = new Set();
    let p = node;
    while (p) { keep.add(p); p = p.parent; }
    nodes.forEach((n) => { n.open = keep.has(n) && n.children.length > 0; });
  }
  const foldAll = () => nodes.forEach((n) => { n.open = false; });

  const shown = (n) =>
    n.depth <= 1 ||
    (n.kind === "sub" && n.parent && n.parent.kind === "limb") ||
    (n.parent && n.parent.open);

  /* ------------------------------------------------------------ the labels */
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

  /* ------------------------------------------------------------ the camera */
  let yaw = 0.6, pitch = 0.32, dist = skin.dist, spin = true;
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
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (drag && drag.moved < 5) pickAt(e);
    drag = null;
  });
  renderer.domElement.addEventListener("pointercancel", () => { drag = null; });
  renderer.domElement.addEventListener("wheel", (e) => {
    e.preventDefault();
    dist = Math.max(6, Math.min(140, dist + Math.sign(e.deltaY) * (dist * 0.08)));
  }, { passive: false });

  /* ----------------------------------------------------------- choosing --- */
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
    const hits = ray.intersectObjects(nodes.filter((n) => n.mesh.visible).map((n) => n.mesh), false);
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
    /* Clicking the thing you already have in hand is how you go there \u2014
       the reading panel's button says the same, but a second click on the
       node itself is the gesture people reach for first. */
    if (n === chosen && n.href) { window.location.href = n.href; return; }
    chosen = n;
    focus(true);
    if (n.children.length) {
      if (n.open) { n.open = false; if (n.parent) openOnly(n.parent); }
      else openOnly(n);
    } else if (n.parent) {
      openOnly(n.parent);
    }
    target.copy(n.home);
    if (n.kind !== "root") dist = Math.min(dist, n.kind === "limb" ? skin.dist * 0.6 : skin.dist * 0.36);
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
        "Click a limb to open it \u2014 only one stem stands open at a time, so the rest fold away.</p>";
      return;
    }
    const kids = n.children.length
      ? '<p class="muted small">' + n.children.length +
        (n.children.length === 1 ? " branch" : " branches") +
        (n.open ? " \u2014 open. Click the node again to fold it." : " \u2014 click the node to open it.") + "</p>"
      : "";
    read.innerHTML =
      '<p class="kicker">' + KIND[n.kind] + (n.num ? " \u00b7 " + n.num : "") + "</p>" +
      "<h3>" + n.title + "</h3>" +
      (n.note ? "<p>" + n.note + "</p>" : "") +
      kids +
      '<p class="muted xsmall">Click it on the map again to go there.</p>' +
      '<p><a class="btn" href="' + n.href + '">Go there &rarr;</a></p>';
  }
  paint(null);

  /* ------------------------------------------------------- the whole screen
     The map is worth looking at properly, so touching it darkens everything
     else on the page to almost nothing and lets the stage fill the window.
     Escape, or the button, gives the page back. */
  const boxEl = document.getElementById("atlas-box");
  let focused = false;
  function focus(on) {
    if (on === focused) return;
    focused = on;
    document.body.classList.toggle("atlas-focused", focused);
    if (boxEl) boxEl.classList.toggle("is-focused", focused);
    const btn = document.getElementById("at-focus");
    if (btn) {
      btn.textContent = focused ? "Give the page back" : "Fill the screen";
      btn.setAttribute("aria-pressed", String(focused));
    }
    if (focused) {
      say("The page is out of the way. Escape, or the button, brings it back.");
      try { boxEl.scrollIntoView({ block: "center" }); } catch { /* old browser */ }
    }
    requestAnimationFrame(fit);
    setTimeout(fit, 260);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && focused) { focus(false); say(""); }
  });

  /* ------------------------------------------------------------- the skins */
  function wear(name) {
    if (!SKINS[name]) return;
    skinName = name;
    skin = SKINS[name];
    try { window.localStorage.setItem(SAVED, name); } catch { /* no store */ }
    document.querySelectorAll("[data-skin]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.getAttribute("data-skin") === name)));
    foldAll();
    chosen = null;
    target.set(0, 0, 0);
    dressSkin();
    spin = true;
    say(skin.label + ". " + skin.blurb);
    const note = document.getElementById("atlas-skin-note");
    if (note) note.textContent = skin.blurb;
  }
  document.querySelectorAll("[data-skin]").forEach((b) =>
    b.addEventListener("click", () => wear(b.getAttribute("data-skin"))));

  /* ------------------------------------------------------------- the tools */
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); };
  on("at-spin", (e) => {
    spin = !spin;
    e.currentTarget.textContent = spin ? "Hold Still" : "Turn It";
    e.currentTarget.setAttribute("aria-pressed", String(spin));
  });
  on("at-fold", () => { foldAll(); clear(); say("Folded back to the limbs."); });
  on("at-home", () => { yaw = 0.6; pitch = 0.32; dist = skin.dist; foldAll(); clear(); spin = true; say("Back to the whole figure."); });
  on("at-focus", () => focus(!focused));

  const find = document.getElementById("at-find");
  if (find) find.addEventListener("input", () => {
    const q = find.value.trim().toLowerCase();
    nodes.forEach((n) => { n.lit = q.length > 1 && n.title.toLowerCase().indexOf(q) >= 0; });
    if (q.length <= 1) { say(""); return; }
    const hits = nodes.filter((n) => n.lit);
    say(hits.length
      ? hits.length + (hits.length === 1 ? " match" : " matches") + ", lit in rose." +
        (hits.length > 1 ? " Only one stem opens at a time, so the first is the one laid open." : "")
      : "Nothing of that name on the map.");
    if (hits.length) {
      openOnly(hits[0].parent || hits[0]);
      target.copy(hits[0].home);
      dist = skin.dist * 0.4;
      spin = false;
      paint(hits[0]);
      focus(true);
    }
  });

  /* --------------------------------------------------------------- the loop */
  const screen = new V();
  let w = 0, h = 0;

  function fit() {
    const r = host.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(host); else addEventListener("resize", fit);

  dressSkin();
  wear(skinName);
  fit();

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (spin) yaw += dt * (skinName === "galaxy" ? 0.07 : 0.12);
    place();
    if (sceneryGroup.children.length && skinName === "galaxy") sceneryGroup.rotation.y += dt * 0.012;
    if (sceneryGroup.children.length && skinName === "cosmos") sceneryGroup.rotation.y -= dt * 0.02;

    const ease = 1 - Math.pow(0.004, dt);

    nodes.forEach((n) => {
      const out = shown(n);
      const want = out ? n.home : (n.parent ? n.parent.pos : n.home);
      n.pos.lerp(want, ease);

      const full = skin.size[n.kind];
      const wantScale = out ? full : full * 0.001;
      const now_ = n.mesh.scale.x || full;
      n.mesh.scale.setScalar(Math.max(0.0001, now_ + (wantScale - now_) * ease));
      n.mesh.position.copy(n.pos);
      n.mesh.visible = n.mesh.scale.x > full * 0.08;
      n.mesh.rotation.y += dt * (n.kind === "topic" ? 0.8 : 0.3);
      if (skinName === "cosmos" && n.kind === "limb") n.mesh.rotation.x += dt * 0.18;

      const picked = n === chosen, warm = n === hot || n.lit;
      n.mat.emissiveIntensity = picked ? 0.95 : warm ? 0.6 : 0.22;
      n.mat.color.setHex(n.lit ? ROSE : skin.tint[n.kind]);

      if (n.line) {
        n.line.geometry.setFromPoints([n.parent.pos, n.pos]);
        n.line.material.opacity = out ? (n.kind === "topic" ? 0.3 : 0.55) : 0;
        n.line.visible = out;
      }

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
      el.style.opacity = String(Math.max(0.22,
        1 - Math.max(0, (camera.position.distanceTo(n.pos) - dist * 0.5) / (dist * 1.4))));
    });

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  say(nodes.length + " places on the map. Drag to turn it; click anything to open it up.");
}
