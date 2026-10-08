/* ===========================================================================
   The pattern book — ready-made pieces for the Turning Shop
   ---------------------------------------------------------------------------
   Every model here is built out of primitives when it is asked for: no files
   to download, nothing fetched from anywhere, and each piece arrives as a
   single group that can be moved, turned, scaled and coloured exactly like a
   plain box. They are deliberately rough — a bench, not a sculpture — because
   the point is to get an arrangement standing quickly and then work on it.
   ======================================================================== */

export function buildLibrary(THREE) {
  const mat = (colour, opts) => new THREE.MeshStandardMaterial(Object.assign(
    { color: new THREE.Color(colour), roughness: 0.5, metalness: 0.15 }, opts || {}));

  /* A small helper: make a mesh, place it, add it to the group. */
  const put = (group, geo, material, x, y, z, rx, ry, rz) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x || 0, y || 0, z || 0);
    m.rotation.set(rx || 0, ry || 0, rz || 0);
    group.add(m);
    return m;
  };

  const BOX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const CYL = (rt, rb, h, s) => new THREE.CylinderGeometry(rt, rb, h, s || 20);
  const SPH = (r, w, h) => new THREE.SphereGeometry(r, w || 24, h || 18);
  const CONE = (r, h, s) => new THREE.ConeGeometry(r, h, s || 20);
  const TOR = (r, t, s) => new THREE.TorusGeometry(r, t, 14, s || 32);

  /* ---------------------------------------------------------------- shapes */
  const solids = {
    tetrahedron: () => new THREE.TetrahedronGeometry(1.4),
    octahedron: () => new THREE.OctahedronGeometry(1.3),
    dodecahedron: () => new THREE.DodecahedronGeometry(1.3),
    icosahedron: () => new THREE.IcosahedronGeometry(1.3),
    capsule: () => new THREE.CapsuleGeometry(0.8, 1.4, 8, 20),
    'torus knot': () => new THREE.TorusKnotGeometry(1, 0.32, 120, 18),
    ring: () => new THREE.TorusGeometry(1.4, 0.12, 10, 48),
    tube: () => new THREE.CylinderGeometry(1, 1, 2.6, 28, 1, true),
    disc: () => new THREE.CylinderGeometry(1.6, 1.6, 0.18, 36),
    wedge: () => new THREE.ConeGeometry(1.3, 2, 4),
    pyramid: () => new THREE.ConeGeometry(1.5, 2, 4),
    plate: () => new THREE.BoxGeometry(3, 0.16, 3)
  };

  const library = [];
  const entry = (group, id, label, make) => library.push({ group, id, label, make });

  for (const [name, geo] of Object.entries(solids)) {
    entry('Solids', name, name.replace(/^./, (c) => c.toUpperCase()), (colour) => {
      const g = new THREE.Group();
      put(g, geo(), mat(colour), 0, 1.2, 0);
      return g;
    });
  }

  /* ------------------------------------------------------------- furniture */
  entry('Furniture', 'table', 'Table', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(3.4, 0.2, 2), m, 0, 1.6, 0);
    [[-1.5, -0.8], [1.5, -0.8], [-1.5, 0.8], [1.5, 0.8]].forEach(([x, z]) =>
      put(g, BOX(0.22, 1.6, 0.22), m, x, 0.8, z));
    return g;
  });
  entry('Furniture', 'chair', 'Chair', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(1.3, 0.16, 1.3), m, 0, 1, 0);
    put(g, BOX(1.3, 1.5, 0.16), m, 0, 1.75, -0.57);
    [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([x, z]) =>
      put(g, BOX(0.14, 1, 0.14), m, x, 0.5, z));
    return g;
  });
  entry('Furniture', 'bench', 'Bench', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(4, 0.2, 1.1), m, 0, 0.9, 0);
    put(g, BOX(0.2, 0.9, 1.1), m, -1.7, 0.45, 0);
    put(g, BOX(0.2, 0.9, 1.1), m, 1.7, 0.45, 0);
    return g;
  });
  entry('Furniture', 'bookshelf', 'Bookshelf', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(0.18, 4, 1), m, -1.4, 2, 0);
    put(g, BOX(0.18, 4, 1), m, 1.4, 2, 0);
    for (let i = 0; i < 5; i++) put(g, BOX(2.9, 0.14, 1), m, 0, 0.3 + i * 0.92, 0);
    return g;
  });
  entry('Furniture', 'bed', 'Bed', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(2.4, 0.4, 4.4), m, 0, 0.8, 0);
    put(g, BOX(2.4, 1.4, 0.2), m, 0, 1.4, -2.2);
    put(g, BOX(2.2, 0.3, 1), m, 0, 1.15, -1.5);
    return g;
  });
  entry('Furniture', 'door', 'Door & frame', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(0.25, 4.4, 0.4), m, -1.2, 2.2, 0);
    put(g, BOX(0.25, 4.4, 0.4), m, 1.2, 2.2, 0);
    put(g, BOX(2.65, 0.3, 0.4), m, 0, 4.3, 0);
    put(g, BOX(2, 4, 0.14), m, 0, 2, 0);
    put(g, SPH(0.12), m, 0.7, 2, 0.14);
    return g;
  });

  /* ---------------------------------------------------------- architecture */
  entry('Architecture', 'column', 'Column', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, CYL(0.75, 0.75, 4.4, 24), m, 0, 2.6, 0);
    put(g, BOX(2, 0.4, 2), m, 0, 0.2, 0);
    put(g, BOX(2, 0.4, 2), m, 0, 5, 0);
    return g;
  });
  entry('Architecture', 'arch', 'Arch', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(0.7, 3.4, 0.8), m, -1.6, 1.7, 0);
    put(g, BOX(0.7, 3.4, 0.8), m, 1.6, 1.7, 0);
    const half = new THREE.TorusGeometry(1.6, 0.35, 12, 24, Math.PI);
    put(g, half, m, 0, 3.4, 0);
    return g;
  });
  entry('Architecture', 'trilithon', 'Trilithon', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(0.9, 4, 0.7), m, -1.4, 2, 0, 0, 0, 0.03);
    put(g, BOX(0.9, 4, 0.7), m, 1.4, 2, 0, 0, 0, -0.03);
    put(g, BOX(4.2, 0.7, 0.8), m, 0, 4.3, 0);
    return g;
  });
  entry('Architecture', 'stones', 'Stone circle', (c) => {
    const g = new THREE.Group(), m = mat(c);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      put(g, BOX(0.7, 2.6 + (i % 3) * 0.4, 0.5), m,
        Math.cos(a) * 3.4, 1.3 + (i % 3) * 0.2, Math.sin(a) * 3.4, 0, -a, 0);
    }
    return g;
  });
  entry('Architecture', 'obelisk', 'Obelisk', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, CYL(0.35, 0.65, 5.2, 4), m, 0, 2.8, 0, 0, Math.PI / 4, 0);
    put(g, CONE(0.5, 0.8, 4), m, 0, 5.8, 0, 0, Math.PI / 4, 0);
    put(g, BOX(1.6, 0.4, 1.6), m, 0, 0.2, 0);
    return g;
  });
  entry('Architecture', 'tower', 'Round tower', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, CYL(1.3, 1.6, 6, 24), m, 0, 3, 0);
    put(g, CONE(1.7, 1.6, 24), m, 0, 6.8, 0);
    put(g, BOX(0.5, 0.8, 0.3), m, 0, 4.4, 1.3);
    return g;
  });
  entry('Architecture', 'house', 'Cottage', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(4, 2.6, 3), m, 0, 1.3, 0);
    put(g, CONE(3.1, 1.8, 4), m, 0, 3.5, 0, 0, Math.PI / 4, 0);
    put(g, BOX(0.5, 1.4, 0.5), m, 1.2, 4.2, 0);
    put(g, BOX(0.9, 1.6, 0.12), m, 0, 0.8, 1.5);
    return g;
  });
  entry('Architecture', 'stairs', 'Stairs', (c) => {
    const g = new THREE.Group(), m = mat(c);
    for (let i = 0; i < 7; i++) put(g, BOX(2.4, 0.3, 0.7), m, 0, 0.15 + i * 0.3, -i * 0.7);
    return g;
  });
  entry('Architecture', 'bridge', 'Bridge', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(7, 0.3, 1.6), m, 0, 2.2, 0);
    const half = new THREE.TorusGeometry(2.6, 0.3, 10, 24, Math.PI);
    put(g, half, m, 0, 0.4, 0.6);
    put(g, half.clone(), m, 0, 0.4, -0.6);
    [-3.2, 3.2].forEach((x) => put(g, BOX(0.4, 2.2, 1.6), m, x, 1.1, 0));
    return g;
  });
  entry('Architecture', 'well', 'Well', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, CYL(1.2, 1.2, 1.2, 24, 1), m, 0, 0.6, 0);
    [-1.1, 1.1].forEach((x) => put(g, BOX(0.18, 2, 0.18), m, x, 1.6, 0));
    put(g, CONE(1.6, 1, 4), m, 0, 3, 0, 0, Math.PI / 4, 0);
    put(g, CYL(0.1, 0.1, 2.2, 10), m, 0, 2.4, 0, 0, 0, Math.PI / 2);
    return g;
  });
  entry('Architecture', 'fence', 'Fence', (c) => {
    const g = new THREE.Group(), m = mat(c);
    for (let i = -3; i <= 3; i++) put(g, BOX(0.16, 1.8, 0.16), m, i * 0.9, 0.9, 0);
    put(g, BOX(5.8, 0.14, 0.1), m, 0, 1.5, 0);
    put(g, BOX(5.8, 0.14, 0.1), m, 0, 0.7, 0);
    return g;
  });
  entry('Architecture', 'dome', 'Dome', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, new THREE.SphereGeometry(2.2, 30, 16, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, 0.6, 0);
    put(g, CYL(2.3, 2.3, 0.6, 30), m, 0, 0.3, 0);
    return g;
  });

  /* --------------------------------------------------------------- nature */
  entry('Nature', 'oak', 'Broadleaf tree', (c) => {
    const g = new THREE.Group();
    put(g, CYL(0.3, 0.45, 2.6, 12), mat('#6b4a2b'), 0, 1.3, 0);
    const leaf = mat(c);
    put(g, SPH(1.5), leaf, 0, 3.3, 0);
    put(g, SPH(1), leaf, 1, 2.8, 0.5);
    put(g, SPH(0.9), leaf, -0.9, 3, -0.5);
    return g;
  });
  entry('Nature', 'pine', 'Pine', (c) => {
    const g = new THREE.Group();
    put(g, CYL(0.22, 0.3, 1.6, 10), mat('#6b4a2b'), 0, 0.8, 0);
    const leaf = mat(c);
    put(g, CONE(1.5, 2, 16), leaf, 0, 2.2, 0);
    put(g, CONE(1.2, 1.8, 16), leaf, 0, 3.2, 0);
    put(g, CONE(0.85, 1.4, 16), leaf, 0, 4.1, 0);
    return g;
  });
  entry('Nature', 'bare', 'Bare tree', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, CYL(0.22, 0.4, 3, 10), m, 0, 1.5, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      put(g, CYL(0.06, 0.14, 1.8, 6), m,
        Math.cos(a) * 0.5, 2.9, Math.sin(a) * 0.5, Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
    }
    return g;
  });
  entry('Nature', 'bush', 'Bush', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, SPH(0.9), m, 0, 0.8, 0);
    put(g, SPH(0.7), m, 0.8, 0.6, 0.3);
    put(g, SPH(0.6), m, -0.7, 0.55, -0.3);
    return g;
  });
  entry('Nature', 'mushroom', 'Mushroom', (c) => {
    const g = new THREE.Group();
    put(g, CYL(0.22, 0.3, 1.1, 14), mat('#efe3c8'), 0, 0.55, 0);
    put(g, new THREE.SphereGeometry(0.85, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(c), 0, 1.05, 0);
    return g;
  });
  entry('Nature', 'rock', 'Rock', (c) => {
    const g = new THREE.Group();
    const geo = new THREE.IcosahedronGeometry(1.2, 0);
    put(g, geo, mat(c, { roughness: 0.95, metalness: 0 }), 0, 0.9, 0, 0.4, 0.8, 0.2);
    return g;
  });
  entry('Nature', 'mountain', 'Mountain', (c) => {
    const g = new THREE.Group(), m = mat(c, { roughness: 0.95, metalness: 0 });
    put(g, CONE(3, 4.5, 6), m, 0, 2.2, 0);
    put(g, CONE(1.8, 2.6, 6), m, 2.4, 1.3, 1.2);
    return g;
  });
  entry('Nature', 'crystal', 'Crystal cluster', (c) => {
    const g = new THREE.Group(), m = mat(c, { roughness: 0.15, metalness: 0.5 });
    put(g, CONE(0.5, 2.6, 6), m, 0, 1.3, 0);
    put(g, CONE(0.35, 1.8, 6), m, 0.6, 0.9, 0.3, 0, 0, -0.3);
    put(g, CONE(0.3, 1.4, 6), m, -0.55, 0.7, -0.25, 0, 0, 0.35);
    return g;
  });
  entry('Nature', 'log', 'Fallen log', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, CYL(0.45, 0.5, 4, 14), m, 0, 0.5, 0, 0, 0, Math.PI / 2);
    put(g, CYL(0.18, 0.2, 1.2, 8), m, 0.8, 0.9, 0.3, 0.5, 0, 0.8);
    return g;
  });

  /* ------------------------------------------------------------ celestial */
  entry('Celestial', 'planet', 'Ringed planet', (c) => {
    const g = new THREE.Group();
    put(g, SPH(1.5, 32, 24), mat(c), 0, 2, 0);
    put(g, TOR(2.4, 0.08, 64), mat('#d7b05a', { metalness: 0.6, roughness: 0.3 }), 0, 2, 0, Math.PI / 2.2);
    return g;
  });
  entry('Celestial', 'moon', 'Cratered moon', (c) => {
    const g = new THREE.Group(), m = mat(c, { roughness: 0.9, metalness: 0 });
    put(g, SPH(1.4, 32, 24), m, 0, 1.8, 0);
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI;
      put(g, SPH(0.18 + Math.random() * 0.14, 12, 8), m,
        Math.sin(b) * Math.cos(a) * 1.35, 1.8 + Math.cos(b) * 1.35, Math.sin(b) * Math.sin(a) * 1.35);
    }
    return g;
  });
  entry('Celestial', 'orrery', 'Orrery arm', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.7, roughness: 0.3 });
    put(g, CYL(0.12, 0.12, 4, 12), m, 0, 2, 0);
    put(g, CYL(0.07, 0.07, 3.4, 10), m, 0, 3.6, 0, 0, 0, Math.PI / 2);
    put(g, SPH(0.55), mat('#d98c2b'), 0, 3.6, 0);
    put(g, SPH(0.28), mat('#2f6fa8'), 1.7, 3.6, 0);
    put(g, TOR(1.7, 0.04, 48), m, 0, 3.6, 0, Math.PI / 2);
    return g;
  });
  entry('Celestial', 'star', 'Star', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.4, roughness: 0.25 });
    put(g, new THREE.OctahedronGeometry(1.1), m, 0, 2, 0);
    put(g, new THREE.OctahedronGeometry(1.1), m, 0, 2, 0, 0, Math.PI / 4, Math.PI / 4);
    return g;
  });
  entry('Celestial', 'comet', 'Comet', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, SPH(0.6), m, 0, 2, 0);
    put(g, CONE(0.55, 3.4, 18), m, -1.9, 2, 0, 0, 0, Math.PI / 2);
    return g;
  });

  /* --------------------------------------------------------------- figures */
  entry('Figures', 'person', 'Standing figure', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, new THREE.CapsuleGeometry(0.42, 1.1, 6, 16), m, 0, 2.5, 0);
    put(g, SPH(0.38, 20, 16), m, 0, 3.5, 0);
    [-0.55, 0.55].forEach((x) => put(g, new THREE.CapsuleGeometry(0.14, 1.1, 5, 10), m, x, 2.5, 0));
    [-0.24, 0.24].forEach((x) => put(g, new THREE.CapsuleGeometry(0.17, 1.2, 5, 10), m, x, 1.1, 0));
    return g;
  });
  entry('Figures', 'robed', 'Robed figure', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, CONE(1, 3, 20), m, 0, 1.5, 0);
    put(g, SPH(0.38, 20, 16), m, 0, 3.2, 0);
    put(g, CONE(0.55, 0.8, 16), m, 0, 3.4, -0.1);
    return g;
  });
  entry('Figures', 'bird', 'Bird', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, new THREE.CapsuleGeometry(0.45, 0.7, 6, 16), m, 0, 1.6, 0, Math.PI / 2);
    put(g, SPH(0.3), m, 0, 1.9, 0.75);
    put(g, CONE(0.12, 0.4, 8), m, 0, 1.9, 1.1, Math.PI / 2);
    [-1, 1].forEach((s) => put(g, BOX(1.4, 0.08, 0.5), m, s * 0.8, 1.75, 0, 0, 0, s * 0.2));
    put(g, CONE(0.3, 1, 8), m, 0, 1.6, -0.9, -Math.PI / 2);
    return g;
  });
  entry('Figures', 'fox', 'Fox, roughed out', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, new THREE.CapsuleGeometry(0.5, 1.2, 6, 16), m, 0, 1.3, 0, 0, 0, Math.PI / 2);
    put(g, SPH(0.42), m, 1.1, 1.5, 0);
    put(g, CONE(0.22, 0.5, 10), m, 1.45, 1.35, 0, 0, 0, -Math.PI / 2.2);
    [-0.22, 0.22].forEach((z) => put(g, CONE(0.18, 0.4, 8), m, 1, 1.9, z));
    [[-0.5, 0.3], [-0.5, -0.3], [0.5, 0.3], [0.5, -0.3]].forEach(([x, z]) =>
      put(g, CYL(0.12, 0.12, 1, 8), m, x, 0.5, z));
    put(g, new THREE.CapsuleGeometry(0.26, 1, 6, 12), m, -1.3, 1.2, 0, 0, 0, Math.PI / 3);
    return g;
  });


  /* ------------------------------------------------------------ the body
     One figure, jointed, posed by angles rather than drawn twice. The parts
     hang off each other the way they do on a person — forearm off upper arm,
     shin off thigh — so a pose is a short list of rotations and the whole
     thing follows. Degrees here, because nobody thinks in radians. */
  const d = (deg) => (deg * Math.PI) / 180;
  const CAP = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 12);

  /* A pose is: hip height, a lean, a spine bend, a head tilt, and for each
     arm and leg [swing, spread, bend] in degrees. */
  const human = (c, P) => {
    const m = mat(c);
    const g = new THREE.Group();
    const pose = Object.assign({
      hip: 1.9, lean: 0, turn: 0, roll: 0, spine: 0, bend: 0, head: 0,
      armL: [10, 8, -10], armR: [10, -8, -10],
      legL: [0, 3, 0], legR: [0, -3, 0]
    }, P || {});

    const root = new THREE.Group();
    root.position.y = pose.hip;
    root.rotation.set(d(pose.lean), d(pose.turn), d(pose.roll));
    g.add(root);

    put(root, CAP(0.26, 0.2), m, 0, 0.05, 0);              // pelvis

    const torso = new THREE.Group();
    torso.rotation.set(d(pose.spine), 0, d(pose.bend));
    root.add(torso);
    put(torso, CAP(0.3, 0.75), m, 0, 0.55, 0);             // chest

    const neck = new THREE.Group();
    neck.position.y = 1.0;
    neck.rotation.x = d(pose.head);
    torso.add(neck);
    put(neck, CYL(0.1, 0.1, 0.16, 10), m, 0, 0.06, 0);
    put(neck, SPH(0.28, 20, 16), m, 0, 0.36, 0);

    [[-1, pose.armL], [1, pose.armR]].forEach(([side, A]) => {
      const sh = new THREE.Group();
      sh.position.set(side * 0.4, 0.9, 0);
      sh.rotation.set(d(A[0]), 0, d(A[1]));
      torso.add(sh);
      put(sh, SPH(0.14, 14, 10), m, 0, 0, 0);
      put(sh, CAP(0.11, 0.46), m, 0, -0.35, 0);
      const el = new THREE.Group();
      el.position.y = -0.68;
      el.rotation.x = d(A[2] || 0);
      sh.add(el);
      put(el, CAP(0.1, 0.42), m, 0, -0.3, 0);
      put(el, SPH(0.12, 14, 10), m, 0, -0.58, 0);          // hand
    });

    [[-1, pose.legL], [1, pose.legR]].forEach(([side, L]) => {
      const hp = new THREE.Group();
      hp.position.set(side * 0.18, 0, 0);
      hp.rotation.set(d(L[0]), 0, d(L[1]));
      root.add(hp);
      put(hp, CAP(0.15, 0.56), m, 0, -0.42, 0);
      const kn = new THREE.Group();
      kn.position.y = -0.82;
      kn.rotation.x = d(L[2] || 0);
      hp.add(kn);
      put(kn, CAP(0.13, 0.5), m, 0, -0.36, 0);
      put(kn, BOX(0.24, 0.12, 0.46), m, 0, -0.68, 0.1);    // foot
    });

    return g;
  };

  /* Twenty-eight of them: the ones a scene actually asks for. */
  const POSES = [
    ['stand', 'Standing', {}],
    ['attention', 'At attention', { armL: [0, 4, 0], armR: [0, -4, 0], legL: [0, 1, 0], legR: [0, -1, 0] }],
    ['walk', 'Walking', { armL: [28, 8, -18], armR: [-28, -8, -12], legL: [-22, 3, 14], legR: [24, -3, -22], hip: 1.86 }],
    ['stride', 'Striding out', { armL: [48, 8, -30], armR: [-44, -8, -14], legL: [-34, 3, 18], legR: [40, -3, -34], hip: 1.82, spine: 6 }],
    ['run', 'Running', { armL: [76, 10, -92], armR: [-70, -10, -86], legL: [-46, 3, 62], legR: [58, -3, -70], hip: 1.84, spine: 14 }],
    ['sprint', 'Sprinting', { armL: [96, 12, -104], armR: [-88, -12, -96], legL: [-58, 4, 96], legR: [74, -4, -88], hip: 1.8, spine: 22, head: -12 }],
    ['jump', 'Jumping', { armL: [-152, 16, -10], armR: [-152, -16, -10], legL: [26, 6, -58], legR: [26, -6, -58], hip: 2.1, spine: -4 }],
    ['crouch', 'Crouching', { hip: 1.1, spine: 16, armL: [40, 10, -60], armR: [40, -10, -60], legL: [62, 8, -104], legR: [62, -8, -104] }],
    ['sit', 'Sitting on a chair', { hip: 1.15, armL: [18, 8, -46], armR: [18, -8, -46], legL: [84, 4, -84], legR: [84, -4, -84] }],
    ['sit-ground', 'Sitting on the ground', { hip: 0.62, spine: -8, armL: [-24, 24, -14], armR: [-24, -24, -14], legL: [74, 16, -46], legR: [74, -16, -46] }],
    ['lotus', 'Cross-legged', { hip: 0.58, armL: [36, 26, -58], armR: [36, -26, -58], legL: [84, 56, -118], legR: [84, -56, -118] }],
    ['meditate', 'In meditation', { hip: 0.58, head: 8, armL: [44, 20, -72], armR: [44, -20, -72], legL: [86, 58, -120], legR: [86, -58, -120] }],
    ['kneel', 'Kneeling', { hip: 1.0, legL: [8, 4, -142], legR: [8, -4, -142], armL: [14, 8, -16], armR: [14, -8, -16] }],
    ['pray', 'Kneeling in prayer', { hip: 1.0, head: 16, spine: 8, legL: [8, 4, -142], legR: [8, -4, -142], armL: [62, -14, -96], armR: [62, 14, -96] }],
    ['bow', 'Bowing', { spine: 58, head: -24, hip: 1.84, armL: [-34, 10, -14], armR: [-34, -10, -14], legL: [-10, 3, 10], legR: [-10, -3, 10] }],
    ['invoke', 'Arms raised', { armL: [-160, 26, -8], armR: [-160, -26, -8], head: -18, spine: -8 }],
    ['tpose', 'Arms straight out', { armL: [0, 88, 0], armR: [0, -88, 0] }],
    ['reach', 'Reaching up', { armL: [-168, 6, -6], armR: [-120, -16, -24], spine: -10, head: -22 }],
    ['point', 'Pointing', { armL: [8, 10, -14], armR: [-88, -10, 0], head: -6, turn: -8 }],
    ['wave', 'Waving', { armL: [8, 10, -14], armR: [-126, -34, -46] }],
    ['arms-crossed', 'Arms folded', { armL: [66, -24, -104], armR: [66, 24, -104] }],
    ['hands-hips', 'Hands on hips', { armL: [24, 44, -96], armR: [24, -44, -96] }],
    ['carry', 'Carrying a load', { armL: [78, 12, -62], armR: [78, -12, -62], spine: -10, hip: 1.88 }],
    ['throw', 'Throwing', { armL: [-54, 22, -24], armR: [-148, -18, -62], spine: -14, turn: 18, legL: [-26, 4, 16], legR: [28, -4, -24] }],
    ['fight', 'Fighting stance', { hip: 1.74, turn: 24, spine: 10, armL: [96, -16, -104], armR: [84, 12, -112], legL: [-28, 8, 34], legR: [30, -8, -38] }],
    ['climb', 'Climbing', { hip: 1.8, spine: 8, armL: [-146, 16, -36], armR: [-72, -14, -58], legL: [68, 10, -92], legR: [-18, -6, 22] }],
    ['dance', 'Dancing', { roll: 10, turn: -16, spine: -8, armL: [-148, 34, -40], armR: [48, -46, -74], legL: [-30, 6, 42], legR: [16, -14, -18] }],
    ['lean', 'Leaning back', { lean: -22, hip: 1.86, head: -10, armL: [-28, 14, -18], armR: [-28, -14, -18], legL: [16, 4, -12], legR: [16, -4, -12] }],
    ['stagger', 'Staggering', { roll: 16, turn: 12, spine: 14, head: 12, armL: [-96, 38, -34], armR: [-44, -42, -58], legL: [34, 12, -46], legR: [-26, -10, 28] }],
    ['lie', 'Lying down', { hip: 0.3, lean: -90, armL: [-18, 34, -10], armR: [-18, -34, -10], legL: [6, 6, -6], legR: [6, -6, -6] }],
    ['sleep', 'Sleeping on one side', { hip: 0.32, lean: -90, roll: 70, head: 10, armL: [-58, 18, -72], armR: [-34, -16, -84], legL: [42, 6, -64], legR: [24, -6, -48] }],
    ['float', 'Floating', { hip: 1.5, lean: -70, armL: [-62, 46, -28], armR: [-62, -46, -28], legL: [-24, 14, 34], legR: [-10, -14, 22] }]
  ];

  POSES.forEach(([id, label, pose]) => {
    entry('Human poses', 'pose-' + id, label, (c) => human(c, pose));
  });


  /* -------------------------------------------------------------- vehicles */
  const wheels = (g, m, pts, r) => pts.forEach(([x, y, z]) =>
    put(g, CYL(r, r, 0.22, 16), m, x, y, z, 0, 0, Math.PI / 2));

  entry('Vehicles', 'car', 'Car', (c) => {
    const g = new THREE.Group(), m = mat(c), gl = mat('#8fb6d8', { opacity: 0.6, transparent: true });
    put(g, BOX(3.8, 0.7, 1.7), m, 0, 0.75, 0);
    put(g, BOX(2, 0.6, 1.55), gl, -0.1, 1.35, 0);
    wheels(g, m, [[1.2, 0.4, 0.85], [1.2, 0.4, -0.85], [-1.2, 0.4, 0.85], [-1.2, 0.4, -0.85]], 0.4);
    return g;
  });
  entry('Vehicles', 'van', 'Van', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(4.2, 1.8, 1.9), m, -0.4, 1.4, 0);
    put(g, BOX(1.6, 1.1, 1.85), m, 2, 1, 0);
    wheels(g, m, [[1.7, 0.45, 0.95], [1.7, 0.45, -0.95], [-1.4, 0.45, 0.95], [-1.4, 0.45, -0.95]], 0.45);
    return g;
  });
  entry('Vehicles', 'lorry', 'Lorry', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(4.6, 2.2, 2.2), m, -1.4, 1.9, 0);
    put(g, BOX(1.8, 1.6, 2.1), m, 1.8, 1.4, 0);
    wheels(g, m, [[2.1, 0.5, 1.1], [2.1, 0.5, -1.1], [-1, 0.5, 1.1], [-1, 0.5, -1.1],
      [-2.2, 0.5, 1.1], [-2.2, 0.5, -1.1]], 0.5);
    return g;
  });
  entry('Vehicles', 'bus', 'Bus', (c) => {
    const g = new THREE.Group(), m = mat(c), gl = mat('#8fb6d8', { opacity: 0.55, transparent: true });
    put(g, BOX(6.4, 2.2, 2.2), m, 0, 1.7, 0);
    [-2, -0.8, 0.4, 1.6].forEach((x) => [1.12, -1.12].forEach((z) =>
      put(g, BOX(0.9, 0.8, 0.06), gl, x, 2.1, z)));
    wheels(g, m, [[2.3, 0.5, 1.1], [2.3, 0.5, -1.1], [-2.3, 0.5, 1.1], [-2.3, 0.5, -1.1]], 0.5);
    return g;
  });
  entry('Vehicles', 'bicycle', 'Bicycle', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.6, roughness: 0.3 });
    [[-0.9], [0.9]].forEach(([x]) => put(g, TOR(0.62, 0.06, 28), m, x, 0.62, 0));
    put(g, CYL(0.04, 0.04, 1.8, 8), m, 0, 0.95, 0, 0, 0, Math.PI / 2);
    put(g, CYL(0.04, 0.04, 0.9, 8), m, -0.4, 0.75, 0, 0, 0, 0.6);
    put(g, CYL(0.04, 0.04, 0.9, 8), m, 0.75, 0.95, 0, 0, 0, 0.3);
    put(g, BOX(0.4, 0.08, 0.16), m, -0.5, 1.2, 0);
    put(g, CYL(0.03, 0.03, 0.5, 8), m, 0.95, 1.3, 0, Math.PI / 2);
    return g;
  });
  entry('Vehicles', 'motorbike', 'Motorbike', (c) => {
    const g = new THREE.Group(), m = mat(c);
    [[-0.85], [0.85]].forEach(([x]) => put(g, TOR(0.5, 0.16, 24), m, x, 0.5, 0));
    put(g, BOX(1.5, 0.4, 0.5), m, 0, 0.85, 0);
    put(g, BOX(0.6, 0.25, 0.45), m, -0.5, 1.15, 0);
    put(g, CYL(0.04, 0.04, 0.6, 8), m, 0.85, 1.2, 0, Math.PI / 2);
    return g;
  });
  entry('Vehicles', 'tractor', 'Tractor', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(2.4, 1, 1.4), m, 0, 1.2, 0);
    put(g, BOX(1, 1.1, 1.2), m, -0.6, 2.1, 0);
    wheels(g, m, [[1.1, 0.55, 0.85], [1.1, 0.55, -0.85]], 0.55);
    wheels(g, m, [[-0.9, 1, 0.95], [-0.9, 1, -0.95]], 1);
    return g;
  });
  entry('Vehicles', 'cart', 'Horse cart', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(2.6, 0.2, 1.4), m, 0, 1, 0);
    [[1.3, 0.12], [-1.3, 0.12]].forEach(([x]) => put(g, BOX(0.12, 0.7, 1.4), m, x, 1.35, 0));
    [1, -1].forEach((z) => put(g, TOR(0.8, 0.1, 24), m, -0.4, 0.8, z * 0.75));
    put(g, CYL(0.07, 0.07, 2.4, 8), m, 2.2, 0.9, 0, 0, 0, Math.PI / 2);
    return g;
  });
  entry('Vehicles', 'carriage', 'Train carriage', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(7, 2.4, 2.4), m, 0, 2.1, 0);
    put(g, BOX(7.2, 0.4, 2.6), m, 0, 0.8, 0);
    wheels(g, m, [[2.4, 0.45, 1.2], [2.4, 0.45, -1.2], [-2.4, 0.45, 1.2], [-2.4, 0.45, -1.2]], 0.45);
    return g;
  });
  entry('Vehicles', 'locomotive', 'Steam locomotive', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, CYL(0.95, 0.95, 4.4, 20), m, 0.6, 1.6, 0, 0, 0, Math.PI / 2);
    put(g, BOX(1.8, 2, 2), m, -2, 2, 0);
    put(g, CYL(0.26, 0.34, 1.1, 14), m, 2.1, 3, 0);
    wheels(g, m, [[1.6, 0.6, 1], [1.6, 0.6, -1], [0, 0.8, 1], [0, 0.8, -1], [-1.7, 0.8, 1], [-1.7, 0.8, -1]], 0.7);
    return g;
  });
  entry('Vehicles', 'sailboat', 'Sailing boat', (c) => {
    const g = new THREE.Group(), m = mat(c), sail = mat('#efe3c8');
    put(g, new THREE.CapsuleGeometry(0.7, 3.2, 6, 16), m, 0, 0.7, 0, 0, 0, Math.PI / 2);
    put(g, CYL(0.07, 0.07, 4, 10), m, 0, 2.8, 0);
    put(g, CONE(1.1, 3.4, 3), sail, 0.35, 2.6, 0);
    return g;
  });
  entry('Vehicles', 'aeroplane', 'Aeroplane', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.5, roughness: 0.35 });
    put(g, new THREE.CapsuleGeometry(0.5, 4, 8, 18), m, 0, 2.4, 0, 0, 0, Math.PI / 2);
    put(g, BOX(1.1, 0.12, 6), m, 0, 2.4, 0);
    put(g, BOX(0.7, 0.1, 2.2), m, -2.1, 2.5, 0);
    put(g, BOX(0.7, 1.1, 0.1), m, -2.2, 3, 0);
    [[2.6], [-2.6]].forEach(([z]) => put(g, CYL(0.3, 0.3, 1, 14), m, 0.2, 2.1, z, 0, 0, Math.PI / 2));
    return g;
  });
  entry('Vehicles', 'helicopter', 'Helicopter', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, SPH(1, 20, 14), m, 0, 1.8, 0);
    put(g, CYL(0.18, 0.18, 3.4, 10), m, -2, 2.2, 0, 0, 0, Math.PI / 2);
    put(g, CYL(0.08, 0.08, 0.7, 8), m, 0, 2.9, 0);
    [0, Math.PI / 2].forEach((r) => put(g, BOX(6, 0.06, 0.3), m, 0, 3.2, 0, 0, r, 0));
    put(g, BOX(0.06, 1.2, 0.5), m, -3.6, 2.5, 0);
    [0.6, -0.6].forEach((z) => put(g, CYL(0.06, 0.06, 2.4, 8), m, 0, 0.7, z, 0, 0, Math.PI / 2));
    return g;
  });
  entry('Vehicles', 'balloon', 'Hot-air balloon', (c) => {
    const g = new THREE.Group(), m = mat(c), basket = mat('#8a5a33');
    put(g, SPH(1.7, 24, 18), m, 0, 4.4, 0);
    put(g, CONE(1, 1.2, 18), m, 0, 2.8, 0, Math.PI);
    put(g, BOX(1.1, 0.9, 1.1), basket, 0, 1.3, 0);
    [[0.45, 0.45], [-0.45, 0.45], [0.45, -0.45], [-0.45, -0.45]].forEach(([x, z]) =>
      put(g, CYL(0.025, 0.025, 1.1, 6), m, x, 2.2, z));
    return g;
  });

  /* ------------------------------------------------------------ spacecraft */
  entry('Spacecraft', 'rocket', 'Rocket', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.6, roughness: 0.3 });
    put(g, CYL(0.7, 0.7, 5, 22), m, 0, 3, 0);
    put(g, CONE(0.7, 1.6, 22), m, 0, 6.3, 0);
    [0, 2.1, 4.2].forEach((r) => put(g, BOX(0.1, 1.4, 1.1), m, 0, 1, 0, 0, r, 0.2));
    put(g, CYL(0.5, 0.75, 0.8, 18), m, 0, 0.2, 0);
    return g;
  });
  entry('Spacecraft', 'shuttle', 'Shuttle', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.4 });
    put(g, new THREE.CapsuleGeometry(0.7, 3.4, 8, 18), m, 0, 2, 0, 0, 0, Math.PI / 2);
    put(g, CONE(0.7, 1.2, 18), m, 2.5, 2, 0, 0, 0, -Math.PI / 2);
    put(g, BOX(2, 0.14, 5), m, -0.6, 1.8, 0);
    put(g, BOX(1.2, 1.3, 0.12), m, -2, 2.6, 0);
    return g;
  });
  entry('Spacecraft', 'saucer', 'Flying saucer', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.8, roughness: 0.2 });
    const glass = mat('#9fe3ff', { opacity: 0.55, transparent: true, metalness: 0.2 });
    put(g, CYL(2.4, 2.4, 0.3, 36), m, 0, 2, 0);
    put(g, CONE(2.4, 0.9, 36), m, 0, 1.6, 0, Math.PI);
    put(g, CONE(2.4, 0.7, 36), m, 0, 2.5, 0);
    put(g, new THREE.SphereGeometry(0.9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass, 0, 2.5, 0);
    [0, 1, 2, 3, 4, 5].forEach((n) => {
      const a = (n / 6) * Math.PI * 2;
      put(g, SPH(0.16, 12, 10), glass, Math.cos(a) * 1.9, 1.95, Math.sin(a) * 1.9);
    });
    return g;
  });
  entry('Spacecraft', 'probe', 'Probe', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.7 });
    const panel = mat('#2f4f8a', { metalness: 0.4 });
    put(g, BOX(1, 1, 1), m, 0, 2, 0);
    [1, -1].forEach((x) => put(g, BOX(2.4, 0.06, 1), panel, x * 1.8, 2, 0));
    put(g, CYL(0.05, 0.05, 1.4, 8), m, 0, 3, 0);
    put(g, new THREE.SphereGeometry(0.6, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, 1.4, 0, Math.PI);
    return g;
  });
  entry('Spacecraft', 'station', 'Ring station', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.65, roughness: 0.3 });
    put(g, TOR(2.6, 0.4, 44), m, 0, 3, 0, Math.PI / 2);
    put(g, CYL(0.3, 0.3, 5.2, 14), m, 0, 3, 0, 0, 0, Math.PI / 2);
    put(g, CYL(0.3, 0.3, 5.2, 14), m, 0, 3, 0, Math.PI / 2, 0, 0);
    put(g, SPH(0.8, 20, 14), m, 0, 3, 0);
    return g;
  });
  entry('Spacecraft', 'lander', 'Lander', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.5 });
    put(g, new THREE.OctahedronGeometry(1.1), m, 0, 1.9, 0);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([x, z]) => {
      put(g, CYL(0.07, 0.07, 1.7, 8), m, x * 0.9, 1, z * 0.9, 0.5 * z, 0, -0.5 * x);
      put(g, CYL(0.3, 0.3, 0.1, 12), m, x * 1.45, 0.1, z * 1.45);
    });
    put(g, CYL(0.25, 0.25, 0.5, 10), m, 0, 0.9, 0);
    return g;
  });
  entry('Spacecraft', 'cruiser', 'Cruiser', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.7, roughness: 0.25 });
    put(g, BOX(6, 0.8, 1.6), m, 0, 2.4, 0);
    put(g, BOX(2, 0.7, 2.6), m, -1.4, 3, 0);
    put(g, CONE(0.8, 2, 16), m, 3.6, 2.4, 0, 0, 0, -Math.PI / 2);
    [1, -1].forEach((z) => put(g, CYL(0.4, 0.4, 2.4, 14), m, -2.2, 2.2, z * 1.6, 0, 0, Math.PI / 2));
    return g;
  });

  /* ---------------------------------------------------------------- animals */
  const beast = (c, P) => {
    const g = new THREE.Group(), m = mat(c);
    const body = P.body || [0.5, 1.4];
    put(g, new THREE.CapsuleGeometry(body[0], body[1], 6, 14), m, 0, P.h, 0, 0, 0, Math.PI / 2);
    put(g, SPH(P.head || 0.4, 18, 14), m, (body[1] / 2) + 0.3, P.h + (P.lift || 0.2), 0);
    if (P.snout) put(g, new THREE.CapsuleGeometry(P.snout, 0.3, 5, 10), m,
      (body[1] / 2) + 0.65, P.h + (P.lift || 0.2) - 0.08, 0, 0, 0, Math.PI / 2);
    (P.ears || []).forEach(([x, y, z, r]) => put(g, CONE(0.14, 0.3, 8), m, x, y, z, 0, 0, r || 0));
    const legs = P.legs == null ? 4 : P.legs;
    if (legs) {
      [[body[1] / 2 - 0.1, 1], [body[1] / 2 - 0.1, -1], [-body[1] / 2 + 0.1, 1], [-body[1] / 2 + 0.1, -1]]
        .forEach(([x, s]) => put(g, CYL(P.leg || 0.11, P.leg || 0.11, P.h - (P.foot || 0.05), 8),
          m, x, (P.h - (P.foot || 0.05)) / 2, s * (body[0] * 0.7)));
    }
    if (P.tail) put(g, new THREE.CapsuleGeometry(P.tail[0], P.tail[1], 5, 10), m,
      -(body[1] / 2) - 0.3, P.h + (P.tailLift || 0.2), 0, 0, 0, P.tailAngle == null ? Math.PI / 3 : P.tailAngle);
    return g;
  };

  entry('Animals', 'dog', 'Dog', (c) => beast(c, { h: 0.95, body: [0.36, 1.1], head: 0.33, snout: 0.16,
    ears: [[0.75, 1.3, 0.2, 0.2], [0.75, 1.3, -0.2, -0.2]], tail: [0.08, 0.5], leg: 0.1 }));
  entry('Animals', 'cat', 'Cat', (c) => beast(c, { h: 0.62, body: [0.26, 0.85], head: 0.26, snout: 0.12,
    ears: [[0.6, 0.92, 0.14], [0.6, 0.92, -0.14]], tail: [0.06, 0.7], tailAngle: Math.PI / 2.4, leg: 0.07 }));
  entry('Animals', 'horse', 'Horse', (c) => beast(c, { h: 1.6, body: [0.6, 2, 0], head: 0.42, snout: 0.22,
    ears: [[1.35, 2.1, 0.14], [1.35, 2.1, -0.14]], tail: [0.1, 0.8], leg: 0.14, lift: 0.5 }));
  entry('Animals', 'cow', 'Cow', (c) => beast(c, { h: 1.35, body: [0.75, 2, 0], head: 0.45, snout: 0.26,
    ears: [[1.3, 1.6, 0.35, 1.2], [1.3, 1.6, -0.35, -1.2]], tail: [0.07, 0.9], tailAngle: 0.1, leg: 0.15 }));
  entry('Animals', 'sheep', 'Sheep', (c) => {
    const g = beast(c, { h: 0.95, body: [0.6, 1, 0], head: 0.3, snout: 0.16, leg: 0.1 });
    const m = mat(c);
    [[0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3], [0, 0]].forEach(([x, z]) =>
      put(g, SPH(0.42, 14, 10), m, x, 1.25, z));
    return g;
  });
  entry('Animals', 'deer', 'Deer', (c) => {
    const g = beast(c, { h: 1.4, body: [0.42, 1.5, 0], head: 0.32, snout: 0.16, leg: 0.09, lift: 0.5 });
    const m = mat(c);
    [1, -1].forEach((z) => {
      put(g, CYL(0.04, 0.05, 0.7, 6), m, 1.05, 2.2, z * 0.13, 0, 0, -z * 0.25);
      put(g, CYL(0.03, 0.03, 0.35, 6), m, 1.2, 2.5, z * 0.3, 0, 0, -z * 0.8);
    });
    return g;
  });
  entry('Animals', 'wolf', 'Wolf', (c) => beast(c, { h: 1.05, body: [0.4, 1.35], head: 0.34, snout: 0.2,
    ears: [[0.95, 1.45, 0.17], [0.95, 1.45, -0.17]], tail: [0.1, 0.6], tailAngle: 0.6, leg: 0.1, lift: 0.3 }));
  entry('Animals', 'bear', 'Bear', (c) => beast(c, { h: 1.2, body: [0.75, 1.5], head: 0.5, snout: 0.26,
    ears: [[1.1, 1.85, 0.3], [1.1, 1.85, -0.3]], leg: 0.2, lift: 0.3 }));
  entry('Animals', 'rabbit', 'Rabbit', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, new THREE.CapsuleGeometry(0.3, 0.4, 6, 14), m, 0, 0.5, 0, 0, 0, Math.PI / 2);
    put(g, SPH(0.24, 16, 12), m, 0.42, 0.72, 0);
    [0.1, -0.1].forEach((z) => put(g, new THREE.CapsuleGeometry(0.06, 0.4, 4, 8), m, 0.38, 1.1, z, 0, 0, z * 1.4));
    put(g, SPH(0.14, 12, 10), m, -0.5, 0.5, 0);
    [[0.3, 1], [0.3, -1], [-0.3, 1], [-0.3, -1]].forEach(([x, s]) =>
      put(g, CYL(0.07, 0.07, 0.35, 8), m, x, 0.18, s * 0.2));
    return g;
  });
  entry('Animals', 'mouse', 'Mouse', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, new THREE.CapsuleGeometry(0.18, 0.3, 6, 12), m, 0, 0.25, 0, 0, 0, Math.PI / 2);
    put(g, CONE(0.16, 0.3, 12), m, 0.34, 0.25, 0, 0, 0, -Math.PI / 2);
    [0.1, -0.1].forEach((z) => put(g, CYL(0.1, 0.1, 0.03, 12), m, 0.18, 0.42, z, Math.PI / 2, 0, 0));
    put(g, new THREE.CapsuleGeometry(0.03, 0.6, 4, 8), m, -0.5, 0.2, 0, 0, 0, Math.PI / 2.2);
    return g;
  });
  entry('Animals', 'fish', 'Fish', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.35, roughness: 0.3 });
    put(g, SPH(0.5, 20, 14), m, 0, 1.2, 0).scale.set(1.8, 1, 0.5);
    put(g, CONE(0.45, 0.7, 10), m, -1.1, 1.2, 0, 0, 0, Math.PI / 2).scale.set(1, 1, 0.4);
    put(g, CONE(0.3, 0.5, 8), m, 0, 1.6, 0).scale.set(1, 1, 0.3);
    return g;
  });
  entry('Animals', 'whale', 'Whale', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, new THREE.CapsuleGeometry(1, 3, 8, 20), m, 0, 1.6, 0, 0, 0, Math.PI / 2).scale.set(1, 1, 0.75);
    put(g, CONE(0.9, 1.4, 10), m, -2.6, 1.7, 0, 0, 0, Math.PI / 2).scale.set(1, 1, 0.25);
    [1, -1].forEach((z) => put(g, BOX(0.9, 0.1, 0.5), m, 0.4, 1.2, z * 0.8, 0, z * 0.4, 0));
    return g;
  });
  entry('Animals', 'snake', 'Snake', (c) => {
    const g = new THREE.Group(), m = mat(c);
    for (let i = 0; i < 14; i++) {
      const a = i * 0.55;
      put(g, SPH(0.26 - i * 0.012, 14, 10), m, Math.sin(a) * 1.2, 0.26, i * 0.28 - 1.8);
    }
    put(g, SPH(0.3, 14, 10), m, Math.sin(-0.55) * 1.2, 0.3, -2.1).scale.set(1.3, 0.8, 1);
    return g;
  });
  entry('Animals', 'owl', 'Owl', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, new THREE.CapsuleGeometry(0.45, 0.5, 6, 16), m, 0, 1.4, 0);
    put(g, SPH(0.42, 18, 14), m, 0, 2.05, 0);
    [0.18, -0.18].forEach((z) => put(g, CONE(0.12, 0.25, 8), m, 0, 2.4, z, 0, 0, z * 0.6));
    [0.16, -0.16].forEach((z) => put(g, SPH(0.13, 12, 10), m, 0.3, 2.1, z));
    put(g, CONE(0.07, 0.18, 8), m, 0.42, 2, 0, 0, 0, -Math.PI / 2);
    return g;
  });
  entry('Animals', 'raven', 'Raven', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, new THREE.CapsuleGeometry(0.3, 0.8, 6, 14), m, 0, 1.1, 0, 0, 0, Math.PI / 2.6);
    put(g, SPH(0.26, 16, 12), m, 0.65, 1.5, 0);
    put(g, CONE(0.1, 0.4, 8), m, 0.95, 1.45, 0, 0, 0, -Math.PI / 2);
    put(g, CONE(0.25, 0.9, 6), m, -0.7, 0.95, 0, 0, 0, Math.PI / 2).scale.set(1, 1, 0.3);
    [1, -1].forEach((z) => put(g, CYL(0.05, 0.05, 0.5, 6), m, 0.1, 0.5, z * 0.12));
    return g;
  });
  entry('Animals', 'butterfly', 'Butterfly', (c) => {
    const g = new THREE.Group(), m = mat(c, { opacity: 0.85, transparent: true });
    put(g, new THREE.CapsuleGeometry(0.06, 0.5, 4, 8), m, 0, 1.6, 0, 0, 0, Math.PI / 2);
    [1, -1].forEach((z) => {
      put(g, SPH(0.4, 14, 10), m, 0.1, 1.75, z * 0.4, 0, 0, 0).scale.set(0.8, 0.08, 1);
      put(g, SPH(0.28, 14, 10), m, -0.25, 1.6, z * 0.32).scale.set(0.7, 0.08, 1);
    });
    return g;
  });
  entry('Animals', 'beetle', 'Beetle', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.6, roughness: 0.25 });
    put(g, SPH(0.5, 20, 14), m, 0, 0.45, 0).scale.set(1, 0.6, 1.4);
    put(g, SPH(0.26, 14, 10), m, 0, 0.42, 0.75);
    [1, -1].forEach((s) => [0.3, 0, -0.3].forEach((z) =>
      put(g, CYL(0.04, 0.04, 0.5, 6), m, s * 0.5, 0.2, z, 0, 0, s * 0.9)));
    return g;
  });
  entry('Animals', 'spider', 'Spider', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, SPH(0.45, 18, 14), m, -0.25, 0.6, 0);
    put(g, SPH(0.25, 14, 10), m, 0.3, 0.55, 0);
    for (let i = 0; i < 4; i++) [1, -1].forEach((s) => {
      const a = -0.5 + i * 0.35;
      put(g, CYL(0.035, 0.035, 1.1, 6), m, Math.sin(a) * 0.4, 0.4, s * 0.55, s * 0.9, a, 0);
    });
    return g;
  });
  entry('Animals', 'frog', 'Frog', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, SPH(0.45, 18, 14), m, 0, 0.4, 0).scale.set(1, 0.75, 1.2);
    [0.16, -0.16].forEach((z) => put(g, SPH(0.13, 12, 10), m, 0.25, 0.65, z));
    [1, -1].forEach((s) => {
      put(g, new THREE.CapsuleGeometry(0.09, 0.3, 4, 8), m, -0.2, 0.3, s * 0.42, 0, 0, Math.PI / 3);
      put(g, new THREE.CapsuleGeometry(0.07, 0.2, 4, 8), m, 0.35, 0.18, s * 0.33, 0, 0, Math.PI / 2.4);
    });
    return g;
  });
  entry('Animals', 'tortoise', 'Tortoise', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, new THREE.SphereGeometry(0.7, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, 0.42, 0).scale.set(1, 0.7, 1.3);
    put(g, SPH(0.22, 14, 10), m, 0, 0.4, 1);
    [[0.45, 0.6], [-0.45, 0.6], [0.45, -0.6], [-0.45, -0.6]].forEach(([x, z]) =>
      put(g, CYL(0.12, 0.12, 0.35, 8), m, x, 0.18, z));
    return g;
  });

  /* ----------------------------------------------------------------- plants */
  entry('Plants', 'fern', 'Fern', (c) => {
    const g = new THREE.Group(), m = mat(c);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const f = put(g, new THREE.CapsuleGeometry(0.05, 1.3, 4, 8), m,
        Math.cos(a) * 0.35, 0.85, Math.sin(a) * 0.35, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
      f.scale.set(1, 1, 0.4);
    }
    return g;
  });
  entry('Plants', 'flower', 'Flower', (c) => {
    const g = new THREE.Group(), m = mat(c), stem = mat('#5f9e58');
    put(g, CYL(0.05, 0.05, 1.6, 8), stem, 0, 0.8, 0);
    put(g, SPH(0.18, 14, 10), m, 0, 1.65, 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      put(g, SPH(0.26, 12, 10), m, Math.cos(a) * 0.3, 1.65, Math.sin(a) * 0.3).scale.set(1, 0.3, 1);
    }
    [0.4, -0.4].forEach((z) => put(g, SPH(0.3, 12, 8), stem, 0, 0.7, z).scale.set(0.4, 0.1, 1));
    return g;
  });
  entry('Plants', 'sunflower', 'Sunflower', (c) => {
    const g = new THREE.Group(), m = mat(c), stem = mat('#5f9e58');
    put(g, CYL(0.09, 0.11, 3.2, 10), stem, 0, 1.6, 0);
    put(g, CYL(0.42, 0.42, 0.12, 24), m, 0, 3.3, 0, Math.PI / 2.2);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      put(g, BOX(0.42, 0.05, 0.16), m, Math.cos(a) * 0.6, 3.3, Math.sin(a) * 0.6, 0.5, -a, 0);
    }
    return g;
  });
  entry('Plants', 'grass', 'Tuft of grass', (c) => {
    const g = new THREE.Group(), m = mat(c);
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.35;
      put(g, CONE(0.05, 0.7 + Math.random() * 0.5, 5), m,
        Math.cos(a) * r, 0.45, Math.sin(a) * r, Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3);
    }
    return g;
  });
  entry('Plants', 'reeds', 'Reeds', (c) => {
    const g = new THREE.Group(), m = mat(c), head = mat('#8a5a33');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, r = 0.2 + (i % 3) * 0.12, h = 1.8 + (i % 4) * 0.4;
      put(g, CYL(0.04, 0.05, h, 7), m, Math.cos(a) * r, h / 2, Math.sin(a) * r, 0, 0, (i % 2 ? 1 : -1) * 0.07);
      put(g, new THREE.CapsuleGeometry(0.09, 0.3, 5, 10), head, Math.cos(a) * r, h + 0.1, Math.sin(a) * r);
    }
    return g;
  });
  entry('Plants', 'cactus', 'Cactus', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, new THREE.CapsuleGeometry(0.42, 2.2, 8, 16), m, 0, 1.5, 0);
    [[1, 0.4], [-1, 0.9]].forEach(([s, y]) => {
      put(g, new THREE.CapsuleGeometry(0.2, 0.8, 6, 12), m, s * 0.5, 1.2 + y, 0, 0, 0, -s * Math.PI / 2);
      put(g, new THREE.CapsuleGeometry(0.2, 0.7, 6, 12), m, s * 0.95, 1.7 + y, 0);
    });
    return g;
  });
  entry('Plants', 'palm', 'Palm', (c) => {
    const g = new THREE.Group(), m = mat('#8a5a33'), leaf = mat(c);
    for (let i = 0; i < 7; i++) put(g, CYL(0.19, 0.22, 0.6, 10), m, Math.sin(i * 0.4) * 0.2, 0.3 + i * 0.58, 0);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      put(g, SPH(1.1, 12, 8), leaf, Math.cos(a) * 0.9 + 0.5, 4.5, Math.sin(a) * 0.9,
        0, -a, 0.35).scale.set(1, 0.06, 0.35);
    }
    return g;
  });
  entry('Plants', 'vine', 'Climbing vine', (c) => {
    const g = new THREE.Group(), m = mat(c);
    for (let i = 0; i < 22; i++) {
      const t = i / 22, a = t * Math.PI * 5;
      put(g, SPH(0.12, 10, 8), m, Math.cos(a) * 0.45, t * 3.4 + 0.1, Math.sin(a) * 0.45);
      if (i % 3 === 0) put(g, SPH(0.3, 10, 8), m, Math.cos(a) * 0.75, t * 3.4 + 0.1, Math.sin(a) * 0.75)
        .scale.set(1, 0.12, 0.7);
    }
    return g;
  });
  entry('Plants', 'potted', 'Herb in a pot', (c) => {
    const g = new THREE.Group(), pot = mat('#8a5a33'), m = mat(c);
    put(g, CYL(0.42, 0.32, 0.6, 16), pot, 0, 0.3, 0);
    put(g, CYL(0.46, 0.46, 0.1, 16), pot, 0, 0.6, 0);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2, r = 0.2;
      put(g, new THREE.CapsuleGeometry(0.05, 0.5, 4, 8), m,
        Math.cos(a) * r, 0.95, Math.sin(a) * r, Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4);
    }
    return g;
  });
  entry('Plants', 'lily', 'Lily pads', (c) => {
    const g = new THREE.Group(), m = mat(c), flower = mat('#efe3c8');
    [[0, 0, 0.7], [1.1, 0.3, 0.5], [-0.8, -0.6, 0.45], [0.4, -1.1, 0.4]].forEach(([x, z, r]) =>
      put(g, CYL(r, r, 0.06, 20), m, x, 0.06, z));
    put(g, SPH(0.22, 14, 10), flower, 0, 0.18, 0);
    return g;
  });
  entry('Plants', 'wheat', 'Wheat', (c) => {
    const g = new THREE.Group(), m = mat(c);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, r = 0.1 + (i % 4) * 0.1;
      put(g, CYL(0.025, 0.03, 1.8, 6), m, Math.cos(a) * r, 0.9, Math.sin(a) * r, 0, 0, Math.cos(a) * 0.08);
      put(g, new THREE.CapsuleGeometry(0.07, 0.4, 5, 8), m, Math.cos(a) * r, 2, Math.sin(a) * r);
    }
    return g;
  });
  entry('Plants', 'bramble', 'Bramble', (c) => {
    const g = new THREE.Group(), m = mat(c);
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.8;
      put(g, CYL(0.04, 0.04, 0.9, 6), m, Math.cos(a) * r, 0.5 + Math.random() * 0.4, Math.sin(a) * r,
        Math.random() - 0.5, a, Math.random() - 0.5);
    }
    return g;
  });

  /* -------------------------------------------------------------- buildings */
  entry('Buildings', 'chapel', 'Chapel', (c) => {
    const g = new THREE.Group(), m = mat(c), roof = mat('#5a4a3a');
    put(g, BOX(3, 2.6, 5), m, 0, 1.3, 0);
    put(g, CONE(2.6, 1.4, 4), roof, 0, 3.3, 0, 0, Math.PI / 4).scale.set(1, 1, 1.7);
    put(g, BOX(1.4, 4.4, 1.4), m, 0, 2.2, 3);
    put(g, CONE(1.1, 1.6, 4), roof, 0, 5.2, 3, 0, Math.PI / 4);
    put(g, BOX(0.12, 0.9, 0.12), m, 0, 6.3, 3);
    put(g, BOX(0.5, 0.12, 0.12), m, 0, 6.2, 3);
    return g;
  });
  entry('Buildings', 'barn', 'Barn', (c) => {
    const g = new THREE.Group(), m = mat(c), roof = mat('#5a4a3a');
    put(g, BOX(4, 2.4, 6), m, 0, 1.2, 0);
    put(g, new THREE.CylinderGeometry(2.2, 2.2, 6, 14, 1, false, 0, Math.PI), roof, 0, 2.4, 0, Math.PI / 2, 0, 0);
    put(g, BOX(1.6, 1.8, 0.1), mat('#8a5a33'), 0, 0.9, 3.02);
    return g;
  });
  entry('Buildings', 'keep', 'Castle keep', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(4, 5, 4), m, 0, 2.5, 0);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([x, z]) => {
      put(g, CYL(0.8, 0.8, 6, 14), m, x * 2, 3, z * 2);
      put(g, CYL(0.95, 0.95, 0.4, 14), m, x * 2, 6.2, z * 2);
    });
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      put(g, BOX(0.5, 0.5, 0.5), m, Math.cos(a) * 1.8, 5.2, Math.sin(a) * 1.8);
    }
    put(g, BOX(1.2, 2, 0.2), mat('#5a4a3a'), 0, 1, 2.05);
    return g;
  });
  entry('Buildings', 'watchtower', 'Watchtower', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, CYL(0.9, 1.2, 6, 16), m, 0, 3, 0);
    put(g, CYL(1.5, 1.5, 0.4, 16), m, 0, 6.2, 0);
    put(g, CONE(1.6, 1.4, 16), mat('#5a4a3a'), 0, 7.1, 0);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      put(g, BOX(0.3, 0.5, 0.3), m, Math.cos(a) * 1.3, 6.6, Math.sin(a) * 1.3, 0, -a, 0);
    }
    return g;
  });
  entry('Buildings', 'windmill', 'Windmill', (c) => {
    const g = new THREE.Group(), m = mat(c), sail = mat('#efe3c8');
    put(g, CYL(1, 1.5, 5, 18), m, 0, 2.5, 0);
    put(g, CONE(1.3, 1.2, 18), mat('#5a4a3a'), 0, 5.5, 0);
    for (let i = 0; i < 4; i++) {
      put(g, BOX(0.18, 3.4, 0.7), sail, 0, 4.4, 1.3, 0, 0, (i / 4) * Math.PI * 2)
        .position.set(Math.sin(i / 4 * Math.PI * 2) * 1.7, 4.4 + Math.cos(i / 4 * Math.PI * 2) * 1.7, 1.3);
    }
    return g;
  });
  entry('Buildings', 'lighthouse', 'Lighthouse', (c) => {
    const g = new THREE.Group(), m = mat(c), glass = mat('#ffe9a0', { opacity: 0.7, transparent: true });
    put(g, CYL(0.8, 1.6, 7, 20), m, 0, 3.5, 0);
    put(g, CYL(1.1, 1.1, 0.3, 20), m, 0, 7.1, 0);
    put(g, CYL(0.8, 0.8, 1, 16), glass, 0, 7.7, 0);
    put(g, CONE(1, 0.9, 16), mat('#5a4a3a'), 0, 8.6, 0);
    return g;
  });
  entry('Buildings', 'hut', 'Round hut', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, CYL(1.6, 1.7, 1.8, 18), m, 0, 0.9, 0);
    put(g, CONE(2, 1.8, 18), mat('#8a7a53'), 0, 2.7, 0);
    put(g, BOX(0.8, 1.2, 0.12), mat('#5a4a3a'), 0, 0.6, 1.7);
    return g;
  });
  entry('Buildings', 'temple', 'Temple front', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(7, 0.5, 4), m, 0, 0.25, 0);
    put(g, BOX(6.4, 0.4, 3.6), m, 0, 0.65, 0);
    [-2.6, -1.3, 0, 1.3, 2.6].forEach((x) => put(g, CYL(0.32, 0.36, 3.6, 16), m, x, 2.6, 1.4));
    put(g, BOX(6.6, 0.5, 3.4), m, 0, 4.6, 0);
    put(g, CONE(3.6, 1.2, 3), m, 0, 5.4, 0, 0, Math.PI / 6).scale.set(1, 1, 0.5);
    return g;
  });
  entry('Buildings', 'pyramid', 'Step pyramid', (c) => {
    const g = new THREE.Group(), m = mat(c);
    for (let i = 0; i < 5; i++) {
      const w = 6 - i * 1.1;
      put(g, BOX(w, 0.8, w), m, 0, 0.4 + i * 0.8, 0);
    }
    return g;
  });
  entry('Buildings', 'ziggurat', 'Ziggurat', (c) => {
    const g = new THREE.Group(), m = mat(c);
    for (let i = 0; i < 4; i++) {
      const w = 7 - i * 1.6;
      put(g, BOX(w, 1.1, w * 0.8), m, 0, 0.55 + i * 1.1, 0);
    }
    put(g, BOX(1.4, 1.4, 1.2), m, 0, 5, 0);
    for (let i = 0; i < 8; i++) put(g, BOX(1.2, 0.18, 0.4), m, 0, 0.3 + i * 0.55, 3 - i * 0.3);
    return g;
  });
  entry('Buildings', 'longhouse', 'Longhouse', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(3.2, 1.6, 8), m, 0, 0.8, 0);
    put(g, new THREE.CylinderGeometry(2.1, 2.1, 8, 12, 1, false, 0, Math.PI), mat('#6a5a3a'), 0, 1.6, 0, Math.PI / 2, 0, 0);
    put(g, BOX(1, 1.4, 0.12), mat('#5a4a3a'), 0, 0.7, 4.02);
    return g;
  });
  entry('Buildings', 'tenement', 'City block', (c) => {
    const g = new THREE.Group(), m = mat(c), gl = mat('#8fb6d8', { opacity: 0.5, transparent: true });
    put(g, BOX(4, 9, 4), m, 0, 4.5, 0);
    for (let f = 0; f < 6; f++) for (let w = -1; w <= 1; w++) {
      put(g, BOX(0.8, 0.9, 0.08), gl, w * 1.2, 1.4 + f * 1.4, 2.02);
      put(g, BOX(0.08, 0.9, 0.8), gl, 2.02, 1.4 + f * 1.4, w * 1.2);
    }
    return g;
  });

  /* ------------------------------------------------------------------ tools */
  entry('Tools', 'hammer', 'Hammer', (c) => {
    const g = new THREE.Group(), wood = mat('#8a5a33'), m = mat(c, { metalness: 0.8, roughness: 0.25 });
    put(g, CYL(0.07, 0.08, 1.6, 12), wood, 0, 0.8, 0);
    put(g, BOX(0.7, 0.26, 0.26), m, 0, 1.7, 0);
    put(g, CONE(0.18, 0.4, 8), m, -0.45, 1.7, 0, 0, 0, Math.PI / 2);
    return g;
  });
  entry('Tools', 'axe', 'Axe', (c) => {
    const g = new THREE.Group(), wood = mat('#8a5a33'), m = mat(c, { metalness: 0.8, roughness: 0.25 });
    put(g, CYL(0.07, 0.08, 2, 12), wood, 0, 1, 0);
    put(g, BOX(0.5, 0.6, 0.1), m, 0.3, 1.9, 0, 0, 0, -0.15);
    put(g, CONE(0.35, 0.4, 6), m, 0.6, 1.9, 0, 0, 0, -Math.PI / 2).scale.set(1, 1, 0.25);
    return g;
  });
  entry('Tools', 'saw', 'Saw', (c) => {
    const g = new THREE.Group(), wood = mat('#8a5a33'), m = mat(c, { metalness: 0.7, roughness: 0.3 });
    put(g, BOX(2.4, 0.5, 0.05), m, 0.4, 1.2, 0);
    for (let i = 0; i < 18; i++) put(g, CONE(0.06, 0.14, 4), m, -0.75 + i * 0.13, 0.9, 0, Math.PI);
    put(g, BOX(0.5, 0.7, 0.18), wood, -1.1, 1.25, 0);
    return g;
  });
  entry('Tools', 'chisel', 'Chisel', (c) => {
    const g = new THREE.Group(), wood = mat('#8a5a33'), m = mat(c, { metalness: 0.8, roughness: 0.2 });
    put(g, new THREE.CapsuleGeometry(0.11, 0.5, 6, 12), wood, 0, 1.2, 0);
    put(g, CYL(0.05, 0.05, 0.9, 10), m, 0, 0.5, 0);
    put(g, BOX(0.16, 0.12, 0.06), m, 0, 0.08, 0);
    return g;
  });
  entry('Tools', 'spade', 'Spade', (c) => {
    const g = new THREE.Group(), wood = mat('#8a5a33'), m = mat(c, { metalness: 0.7, roughness: 0.3 });
    put(g, CYL(0.06, 0.07, 2.4, 12), wood, 0, 1.5, 0);
    put(g, TOR(0.16, 0.05, 14), wood, 0, 2.75, 0, Math.PI / 2);
    put(g, BOX(0.5, 0.6, 0.06), m, 0, 0.35, 0);
    put(g, CONE(0.3, 0.3, 4), m, 0, 0.03, 0, Math.PI).scale.set(1, 1, 0.2);
    return g;
  });
  entry('Tools', 'rake', 'Rake', (c) => {
    const g = new THREE.Group(), wood = mat('#8a5a33'), m = mat(c, { metalness: 0.6 });
    put(g, CYL(0.06, 0.06, 2.6, 12), wood, 0, 1.4, 0);
    put(g, BOX(1.2, 0.1, 0.1), m, 0, 0.2, 0);
    for (let i = 0; i < 7; i++) put(g, CONE(0.05, 0.3, 6), m, -0.5 + i * 0.17, 0.05, 0, Math.PI);
    return g;
  });
  entry('Tools', 'scythe', 'Scythe', (c) => {
    const g = new THREE.Group(), wood = mat('#8a5a33'), m = mat(c, { metalness: 0.8, roughness: 0.2 });
    put(g, CYL(0.06, 0.07, 3, 12), wood, 0, 1.5, 0, 0, 0, 0.12);
    put(g, CYL(0.05, 0.05, 0.4, 8), wood, 0.25, 1.6, 0, Math.PI / 2);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * 1.4;
      put(g, BOX(0.3, 0.07, 0.04), m, -0.3 - Math.sin(a) * 1.5, 0.1 + Math.cos(a) * 0.5, 0, 0, 0, -a);
    }
    return g;
  });
  entry('Tools', 'anvil', 'Anvil', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.85, roughness: 0.3 });
    put(g, BOX(1.6, 0.4, 0.7), m, 0, 1.2, 0);
    put(g, BOX(0.7, 0.5, 0.6), m, 0, 0.85, 0);
    put(g, BOX(1.2, 0.3, 0.8), m, 0, 0.5, 0);
    put(g, CONE(0.3, 0.9, 10), m, 1.1, 1.2, 0, 0, 0, -Math.PI / 2);
    return g;
  });
  entry('Tools', 'workbench', 'Workbench', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, BOX(3.4, 0.25, 1.4), m, 0, 1.5, 0);
    [[1.5, 0.6], [1.5, -0.6], [-1.5, 0.6], [-1.5, -0.6]].forEach(([x, z]) =>
      put(g, BOX(0.2, 1.5, 0.2), m, x, 0.75, z));
    put(g, BOX(3, 0.12, 0.8), m, 0, 0.6, 0);
    put(g, BOX(0.5, 0.4, 0.4), mat(c, { metalness: 0.8 }), 1.4, 1.75, 0.4);
    return g;
  });
  entry('Tools', 'bucket', 'Bucket', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.6, roughness: 0.35 });
    put(g, new THREE.CylinderGeometry(0.5, 0.38, 0.9, 18, 1, true), m, 0, 0.45, 0);
    put(g, CYL(0.38, 0.38, 0.05, 18), m, 0, 0.03, 0);
    put(g, TOR(0.5, 0.04, 20), m, 0, 0.6, 0, 0, 0, Math.PI / 2).rotation.set(0, 0, 0);
    return g;
  });
  entry('Tools', 'telescope', 'Telescope', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.75, roughness: 0.25 });
    put(g, CYL(0.22, 0.3, 2.4, 18), m, 0, 2, 0, 0, 0, -Math.PI / 4);
    put(g, CYL(0.14, 0.14, 0.5, 12), m, -0.95, 1.05, 0, 0, 0, -Math.PI / 4);
    [0, 2.1, 4.2].forEach((r) => put(g, CYL(0.05, 0.05, 1.8, 8), m, 0, 0.9, 0, 0.35, r, 0));
    put(g, CYL(0.3, 0.3, 0.1, 14), m, 0, 0.05, 0);
    return g;
  });
  entry('Tools', 'microscope', 'Microscope', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.7, roughness: 0.3 });
    put(g, CYL(0.55, 0.65, 0.2, 18), m, 0, 0.1, 0);
    put(g, BOX(0.28, 1.6, 0.3), m, -0.3, 0.9, 0, 0.25);
    put(g, BOX(0.9, 0.08, 0.7), m, 0.1, 0.9, 0);
    put(g, CYL(0.16, 0.16, 1, 14), m, 0.1, 1.75, 0, 0.3);
    put(g, CYL(0.1, 0.1, 0.35, 12), m, 0.1, 1.15, 0);
    return g;
  });
  entry('Tools', 'mortar', 'Mortar & pestle', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, new THREE.CylinderGeometry(0.55, 0.42, 0.6, 20, 1, true), m, 0, 0.3, 0);
    put(g, CYL(0.42, 0.42, 0.08, 20), m, 0, 0.04, 0);
    put(g, new THREE.CapsuleGeometry(0.1, 0.7, 6, 12), m, 0.18, 0.7, 0, 0, 0, 0.4);
    return g;
  });
  entry('Tools', 'hourglass', 'Hourglass', (c) => {
    const g = new THREE.Group(), wood = mat('#8a5a33');
    const glass = mat(c, { opacity: 0.45, transparent: true, roughness: 0.1 });
    [0.1, 1.9].forEach((y) => put(g, CYL(0.5, 0.5, 0.14, 18), wood, 0, y, y > 1 ? 0 : 0));
    put(g, CONE(0.42, 0.85, 18), glass, 0, 0.6, 0, Math.PI);
    put(g, CONE(0.42, 0.85, 18), glass, 0, 1.4, 0);
    [[0.4, 0.4], [-0.4, 0.4], [0.4, -0.4], [-0.4, -0.4]].forEach(([x, z]) =>
      put(g, CYL(0.05, 0.05, 1.8, 8), wood, x, 1, z));
    return g;
  });
  entry('Tools', 'scales', 'Scales', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.75, roughness: 0.25 });
    put(g, CYL(0.6, 0.7, 0.14, 20), m, 0, 0.07, 0);
    put(g, CYL(0.07, 0.07, 3, 12), m, 0, 1.5, 0);
    put(g, BOX(2.6, 0.08, 0.08), m, 0, 3, 0);
    [1.2, -1.2].forEach((x) => {
      [0.3, -0.3].forEach((z) => put(g, CYL(0.012, 0.012, 0.9, 6), m, x, 2.55, z, 0, 0, 0));
      put(g, CYL(0.42, 0.38, 0.12, 18), m, x, 2.1, 0);
    });
    return g;
  });
  entry('Tools', 'dividers', 'Dividers', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.85, roughness: 0.2 });
    [1, -1].forEach((s) => put(g, CYL(0.05, 0.03, 2.4, 8), m, s * 0.35, 1.2, 0, 0, 0, -s * 0.28));
    put(g, SPH(0.13, 12, 10), m, 0, 2.3, 0);
    put(g, TOR(0.12, 0.03, 12), m, 0, 2.45, 0, Math.PI / 2);
    return g;
  });
  entry('Tools', 'brazier', 'Brazier', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.7, roughness: 0.35 });
    const fire = mat('#ff9a3c', { emissive: new THREE.Color('#ff6a00'), emissiveIntensity: 0.6 });
    put(g, new THREE.CylinderGeometry(0.8, 0.5, 0.7, 20, 1, true), m, 0, 1.5, 0);
    put(g, CYL(0.5, 0.5, 0.08, 20), m, 0, 1.2, 0);
    [0, 2.1, 4.2].forEach((r) => put(g, CYL(0.06, 0.06, 1.4, 8), m, 0, 0.6, 0, 0.22, r, 0));
    [0, 1, 2, 3].forEach((i) => put(g, CONE(0.22 - i * 0.04, 0.5, 8), fire,
      Math.cos(i) * 0.2, 1.95 + i * 0.16, Math.sin(i) * 0.2));
    return g;
  });

  /* ---------------------------------------------------- the order's things */
  entry('The order', 'chalice', 'Chalice', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.7, roughness: 0.25 });
    put(g, CYL(0.9, 0.35, 1.1, 24, 1), m, 0, 1.9, 0);
    put(g, CYL(0.14, 0.14, 1, 12), m, 0, 1, 0);
    put(g, CYL(0.75, 0.75, 0.16, 24), m, 0, 0.5, 0);
    return g;
  });
  entry('The order', 'candle', 'Candle', (c) => {
    const g = new THREE.Group();
    put(g, CYL(0.75, 0.8, 0.14, 20), mat('#d7b05a', { metalness: 0.7, roughness: 0.3 }), 0, 0.5, 0);
    put(g, CYL(0.22, 0.26, 2.2, 16), mat(c), 0, 1.6, 0);
    put(g, CONE(0.09, 0.3, 10), mat('#ffd27a'), 0, 2.9, 0);
    return g;
  });
  entry('The order', 'cauldron', 'Cauldron', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.5, roughness: 0.6 });
    put(g, SPH(1.3, 28, 20, 0, Math.PI * 2, Math.PI / 2.6, Math.PI / 2), m, 0, 1.4, 0);
    put(g, TOR(1.22, 0.1, 40), m, 0, 1.4, 0, Math.PI / 2);
    [0, Math.PI * 2 / 3, Math.PI * 4 / 3].forEach((a) =>
      put(g, CYL(0.1, 0.1, 0.9, 8), m, Math.cos(a) * 0.7, 0.45, Math.sin(a) * 0.7));
    return g;
  });
  entry('The order', 'book', 'Book', (c) => {
    const g = new THREE.Group();
    put(g, BOX(2.2, 0.35, 3), mat(c), 0, 0.7, 0);
    put(g, BOX(2, 0.28, 2.8), mat('#efe3c8'), 0.05, 0.72, 0);
    return g;
  });
  entry('The order', 'scroll', 'Scroll', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, CYL(0.3, 0.3, 3.4, 20), m, 0, 0.6, 0, 0, 0, Math.PI / 2);
    [-1.8, 1.8].forEach((x) => put(g, CYL(0.1, 0.1, 0.4, 10), mat('#6b4a2b'), x, 0.6, 0, 0, 0, Math.PI / 2));
    return g;
  });
  entry('The order', 'staff', 'Staff', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, CYL(0.1, 0.13, 5, 12), m, 0, 2.5, 0);
    put(g, SPH(0.42), mat('#7a4fa3', { roughness: 0.2, metalness: 0.4 }), 0, 5.2, 0);
    put(g, TOR(0.4, 0.07, 28), mat('#d7b05a', { metalness: 0.8, roughness: 0.2 }), 0, 5.2, 0, Math.PI / 2);
    return g;
  });
  entry('The order', 'sword', 'Sword', (c) => {
    const g = new THREE.Group();
    const steel = mat(c, { metalness: 0.85, roughness: 0.2 });
    put(g, BOX(0.22, 3.6, 0.07), steel, 0, 2.8, 0);
    put(g, CONE(0.16, 0.5, 4), steel, 0, 4.8, 0);
    put(g, BOX(1.4, 0.16, 0.18), mat('#d7b05a', { metalness: 0.8 }), 0, 0.95, 0);
    put(g, CYL(0.12, 0.12, 0.9, 12), mat('#6b4a2b'), 0, 0.5, 0);
    return g;
  });
  entry('The order', 'pentacle', 'Pentacle', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.7, roughness: 0.3 });
    put(g, TOR(1.6, 0.1, 64), m, 0, 2, 0);
    for (let i = 0; i < 5; i++) {
      const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const a2 = (((i + 2) % 5) / 5) * Math.PI * 2 - Math.PI / 2;
      const x1 = Math.cos(a1) * 1.6, y1 = Math.sin(a1) * 1.6;
      const x2 = Math.cos(a2) * 1.6, y2 = Math.sin(a2) * 1.6;
      const len = Math.hypot(x2 - x1, y2 - y1);
      const bar = put(g, BOX(len, 0.09, 0.09), m, (x1 + x2) / 2, 2 + (y1 + y2) / 2, 0);
      bar.rotation.z = Math.atan2(y2 - y1, x2 - x1);
    }
    return g;
  });
  entry('The order', 'altar', 'Altar', (c) => {
    const g = new THREE.Group(), m = mat(c, { roughness: 0.9, metalness: 0 });
    put(g, BOX(3.4, 0.4, 2), m, 0, 1.6, 0);
    put(g, BOX(2.4, 1.4, 1.4), m, 0, 0.7, 0);
    put(g, BOX(3.8, 0.3, 2.4), m, 0, 0.15, 0);
    return g;
  });
  entry('The order', 'lantern', 'Lantern', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.6, roughness: 0.35 });
    put(g, BOX(1, 0.14, 1), m, 0, 0.6, 0);
    put(g, BOX(1, 0.14, 1), m, 0, 2.1, 0);
    [[-0.43, -0.43], [0.43, -0.43], [-0.43, 0.43], [0.43, 0.43]].forEach(([x, z]) =>
      put(g, CYL(0.05, 0.05, 1.5, 6), m, x, 1.35, z));
    put(g, SPH(0.3), mat('#ffd27a'), 0, 1.35, 0);
    put(g, TOR(0.25, 0.05, 20), m, 0, 2.3, 0, Math.PI / 2);
    return g;
  });
  entry('The order', 'flask', 'Alchemical flask', (c) => {
    const g = new THREE.Group(), m = mat(c, { roughness: 0.1, metalness: 0.2 });
    put(g, SPH(1), m, 0, 1.1, 0);
    put(g, CYL(0.28, 0.28, 1.2, 16), m, 0, 2.2, 0);
    put(g, TOR(0.3, 0.06, 20), m, 0, 2.75, 0, Math.PI / 2);
    return g;
  });
  entry('The order', 'barrel', 'Barrel', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, CYL(0.9, 0.9, 2.2, 24), m, 0, 1.1, 0);
    const band = mat('#4a4a52', { metalness: 0.8, roughness: 0.3 });
    [0.35, 1.1, 1.85].forEach((y) => put(g, TOR(0.92, 0.07, 32), band, 0, y, 0, Math.PI / 2));
    return g;
  });

  /* ------------------------------------------------------------ machinery */
  entry('Machinery', 'gear', 'Gear', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.8, roughness: 0.3 });
    put(g, CYL(1.4, 1.4, 0.35, 32), m, 0, 1.4, 0, Math.PI / 2);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      put(g, BOX(0.4, 0.45, 0.35), m, Math.cos(a) * 1.6, 1.4 + Math.sin(a) * 1.6, 0, 0, 0, a);
    }
    put(g, CYL(0.3, 0.3, 0.5, 16), mat('#1b1b1f'), 0, 1.4, 0, Math.PI / 2);
    return g;
  });
  entry('Machinery', 'wheel', 'Cart wheel', (c) => {
    const g = new THREE.Group(), m = mat(c);
    put(g, TOR(1.5, 0.16, 48), m, 0, 1.6, 0);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      put(g, BOX(1.5, 0.12, 0.12), m, Math.cos(a) * 0.75, 1.6 + Math.sin(a) * 0.75, 0, 0, 0, a);
    }
    put(g, CYL(0.25, 0.25, 0.4, 16), m, 0, 1.6, 0, Math.PI / 2);
    return g;
  });
  entry('Machinery', 'ladder', 'Ladder', (c) => {
    const g = new THREE.Group(), m = mat(c);
    [-0.6, 0.6].forEach((x) => put(g, BOX(0.14, 5, 0.14), m, x, 2.5, 0));
    for (let i = 0; i < 7; i++) put(g, BOX(1.3, 0.1, 0.1), m, 0, 0.5 + i * 0.7, 0);
    return g;
  });
  entry('Machinery', 'boat', 'Rowing boat', (c) => {
    const g = new THREE.Group(), m = mat(c);
    const hull = new THREE.SphereGeometry(1.4, 28, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const h = put(g, hull, m, 0, 1, 0);
    h.scale.set(1, 0.8, 2.4);
    put(g, BOX(2.4, 0.12, 0.5), m, 0, 1.1, 0);
    put(g, BOX(2.4, 0.12, 0.5), m, 0, 1.1, 1.4);
    return g;
  });
  entry('Machinery', 'pylon', 'Standing frame', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.6 });
    [-1, 1].forEach((s) => {
      put(g, CYL(0.1, 0.12, 5, 8), m, s * 1.2, 2.5, 0, 0, 0, -s * 0.08);
    });
    [1.2, 2.6, 4].forEach((y) => put(g, BOX(2.4, 0.1, 0.1), m, 0, y, 0));
    return g;
  });

  /* ------------------------------------------------------------------ pipes
     A pipe is the one shape a bench always wants and never has: a run of it,
     a bend of the right angle, and a fitting to join them. Everything here
     shares one bore so the pieces meet properly when they are stood end to
     end — 0.42 outside, 0.3 inside — and every bend is swept from a torus so
     the wall thickness carries round the corner instead of mitring. The long
     runs are built from the same cylinder at different lengths, because that
     is what a pipe rack actually is. */
  const PIPE_R = 0.42;          /* outside radius */
  const BORE = 0.3;             /* inside radius  */
  const pipeMat = (c) => mat(c, { metalness: 0.65, roughness: 0.34 });

  /* An open-ended tube: outer wall, inner wall, and a ring at each end so the
     cut face reads as a wall thickness rather than a hole in the world. */
  const TUBE = (g, m, len, x, y, z, rx, ry, rz, ro, ri) => {
    const outer = ro || PIPE_R, inner = ri === undefined ? BORE : ri;
    const hub = new THREE.Group();
    hub.add(new THREE.Mesh(new THREE.CylinderGeometry(outer, outer, len, 24, 1, true), m));
    hub.add(new THREE.Mesh(new THREE.CylinderGeometry(inner, inner, len, 24, 1, true), m));
    [-1, 1].forEach((s) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 24), m);
      ring.rotation.x = -Math.PI / 2 * s;
      ring.position.y = (len / 2) * s;
      hub.add(ring);
    });
    hub.position.set(x || 0, y || 0, z || 0);
    hub.rotation.set(rx || 0, ry || 0, rz || 0);
    g.add(hub);
    return hub;
  };

  /* A swept bend of any angle, standing on its end, turning towards +Z. */
  const BEND = (g, m, deg, radius) => {
    const a = (deg * Math.PI) / 180;
    const r = radius || 1.1;
    const geo = new THREE.TorusGeometry(r, PIPE_R, 16, 40, a);
    const t = put(g, geo, m, 0, 0, 0);
    /* The torus is drawn in the XY plane from +X; stand it up so the first
       mouth faces down and the second leans over by the angle asked for. */
    t.rotation.set(Math.PI / 2, 0, 0);
    t.position.set(-r, 0, 0);
    return t;
  };

  const flange = (g, m, y, rot) => {
    const f = put(g, new THREE.CylinderGeometry(0.72, 0.72, 0.12, 24), m, 0, y, 0, rot || 0);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      put(g, CYL(0.07, 0.07, 0.2, 8), m, Math.cos(a) * 0.56, y, Math.sin(a) * 0.56, rot || 0);
    }
    return f;
  };

  [['short', 1.4], ['stub', 2.4], ['run', 4], ['long run', 6.5], ['mains', 9]].forEach(([name, len]) => {
    entry('Pipes', 'pipe-' + name.replace(/\s+/g, '-'), 'Pipe \u2014 ' + name + ' (' + len + ')', (c) => {
      const g = new THREE.Group();
      TUBE(g, pipeMat(c), len, 0, len / 2, 0);
      return g;
    });
  });

  entry('Pipes', 'pipe-wide', 'Pipe \u2014 wide bore', (c) => {
    const g = new THREE.Group();
    TUBE(g, pipeMat(c), 4, 0, 2, 0, 0, 0, 0, 0.8, 0.62);
    return g;
  });
  entry('Pipes', 'pipe-narrow', 'Pipe \u2014 narrow bore', (c) => {
    const g = new THREE.Group();
    TUBE(g, pipeMat(c), 4, 0, 2, 0, 0, 0, 0, 0.2, 0.12);
    return g;
  });
  entry('Pipes', 'pipe-lying', 'Pipe \u2014 lying down', (c) => {
    const g = new THREE.Group();
    TUBE(g, pipeMat(c), 5, 0, 0.42, 0, Math.PI / 2, 0, 0);
    return g;
  });

  [15, 22.5, 30, 45, 60, 90, 120, 135, 180].forEach((deg) => {
    entry('Pipes', 'elbow-' + deg, 'Bend \u2014 ' + deg + '\u00b0', (c) => {
      const g = new THREE.Group();
      BEND(g, pipeMat(c), deg);
      return g;
    });
  });
  entry('Pipes', 'elbow-tight', 'Bend \u2014 90\u00b0, tight', (c) => {
    const g = new THREE.Group();
    BEND(g, pipeMat(c), 90, 0.62);
    return g;
  });
  entry('Pipes', 'pipe-u', 'U-bend', (c) => {
    const g = new THREE.Group(), m = pipeMat(c);
    BEND(g, m, 180, 0.9);
    TUBE(g, m, 1.6, 0, -0.8, 0);
    TUBE(g, m, 1.6, -1.8, -0.8, 0);
    return g;
  });
  entry('Pipes', 'pipe-s', 'S-bend', (c) => {
    const g = new THREE.Group(), m = pipeMat(c);
    const a = new THREE.Group(); BEND(a, m, 90, 0.9); g.add(a);
    const b = new THREE.Group(); BEND(b, m, 90, 0.9);
    b.rotation.y = Math.PI; b.position.set(-1.8, 0.9, 0.9); g.add(b);
    return g;
  });
  entry('Pipes', 'pipe-tee', 'Tee', (c) => {
    const g = new THREE.Group(), m = pipeMat(c);
    TUBE(g, m, 3, 0, 1.5, 0);
    TUBE(g, m, 1.6, 0.8, 1.5, 0, 0, 0, Math.PI / 2);
    return g;
  });
  entry('Pipes', 'pipe-cross', 'Cross', (c) => {
    const g = new THREE.Group(), m = pipeMat(c);
    TUBE(g, m, 3, 0, 1.5, 0);
    TUBE(g, m, 3, 0, 1.5, 0, 0, 0, Math.PI / 2);
    return g;
  });
  entry('Pipes', 'pipe-wye', 'Wye branch', (c) => {
    const g = new THREE.Group(), m = pipeMat(c);
    TUBE(g, m, 3, 0, 1.5, 0);
    TUBE(g, m, 2, 0.6, 2.4, 0, 0, 0, -Math.PI / 4);
    return g;
  });
  entry('Pipes', 'pipe-flanged', 'Pipe \u2014 flanged both ends', (c) => {
    const g = new THREE.Group(), m = pipeMat(c);
    TUBE(g, m, 3.4, 0, 1.9, 0);
    flange(g, m, 0.26); flange(g, m, 3.54);
    return g;
  });
  entry('Pipes', 'pipe-valve', 'Valve', (c) => {
    const g = new THREE.Group(), m = pipeMat(c);
    TUBE(g, m, 3, 0, 1.5, 0);
    put(g, SPH(0.72), m, 0, 1.5, 0);
    put(g, CYL(0.1, 0.1, 0.7, 10), m, 0.5, 2, 0, 0, 0, -Math.PI / 4);
    put(g, TOR(0.42, 0.08, 24), m, 0.85, 2.35, 0, Math.PI / 4, 0, -Math.PI / 4);
    return g;
  });
  entry('Pipes', 'pipe-reducer', 'Reducer', (c) => {
    const g = new THREE.Group(), m = pipeMat(c);
    TUBE(g, m, 1.4, 0, 0.7, 0, 0, 0, 0, 0.8, 0.62);
    put(g, CYL(0.42, 0.8, 0.9, 24), m, 0, 1.85, 0);
    TUBE(g, m, 1.4, 0, 3, 0);
    return g;
  });
  entry('Pipes', 'pipe-cap', 'End cap', (c) => {
    const g = new THREE.Group(), m = pipeMat(c);
    TUBE(g, m, 1, 0, 0.5, 0);
    put(g, new THREE.SphereGeometry(0.42, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, 1, 0);
    return g;
  });
  entry('Pipes', 'pipe-bracket', 'Pipe on a bracket', (c) => {
    const g = new THREE.Group(), m = pipeMat(c);
    TUBE(g, m, 6, 0, 2.4, 0, 0, 0, Math.PI / 2);
    [-2, 0, 2].forEach((x) => {
      put(g, BOX(0.16, 2.4, 0.16), m, x, 1.2, -0.5);
      put(g, TOR(0.55, 0.08, 20), m, x, 2.4, 0, 0, Math.PI / 2);
    });
    return g;
  });
  entry('Pipes', 'pipe-rack', 'Pipe run \u2014 three high', (c) => {
    const g = new THREE.Group(), m = pipeMat(c);
    [1, 2, 3].forEach((y) => TUBE(g, m, 7, 0, y, 0, 0, 0, Math.PI / 2));
    [-3, 3].forEach((x) => put(g, BOX(0.2, 3.6, 0.2), m, x, 1.8, 0));
    return g;
  });
  entry('Pipes', 'pipe-manifold', 'Manifold', (c) => {
    const g = new THREE.Group(), m = pipeMat(c);
    TUBE(g, m, 6, 0, 0.9, 0, 0, 0, Math.PI / 2);
    [-2, -0.7, 0.7, 2].forEach((x) => TUBE(g, m, 2.2, x, 2, 0, 0, 0, 0, 0.28, 0.18));
    return g;
  });

  /* --------------------------------------------------------- doors & gates
     A door is a frame, a leaf and a way of knowing which side opens. Every
     one of these stands on the floor with its sill at y = 0, so a door
     dropped next to a wall meets it, and every leaf is hung slightly ajar
     where it opens, because a shut door is a rectangle and tells you
     nothing about what it is. */
  const iron = (c) => mat(c, { metalness: 0.7, roughness: 0.42 });
  const timber = (c) => mat(c, { roughness: 0.78, metalness: 0.05 });

  /* The posts and lintel every opening shares. */
  const doorFrame = (g, m, w, h, d) => {
    const t = 0.26;
    [-1, 1].forEach((s) => put(g, BOX(t, h, d), m, (s * (w + t)) / 2, h / 2, 0));
    put(g, BOX(w + t * 2, t, d), m, 0, h + t / 2, 0);
  };

  const handle = (g, m, x, y, z) => {
    put(g, SPH(0.1), m, x, y, z + 0.09);
    put(g, CYL(0.05, 0.05, 0.1, 10), m, x, y, z + 0.05, Math.PI / 2);
  };

  entry('Doors & gates', 'door-panel', 'Door \u2014 panelled', (c) => {
    const g = new THREE.Group(), m = timber(c);
    doorFrame(g, m, 2, 4.2, 0.4);
    const leaf = new THREE.Group();
    put(leaf, BOX(1.9, 4.1, 0.14), m, 0, 2.05, 0);
    [[0, 3], [0, 1.1]].forEach(([x, y]) => put(leaf, BOX(1.2, 1.4, 0.2), mat(c, { roughness: 0.9 }), x, y, 0));
    handle(leaf, iron('#2a2a30'), 0.72, 2, 0.07);
    leaf.position.x = -0.95;
    leaf.rotation.y = -0.5;
    leaf.children.forEach((ch) => { ch.position.x += 0.95; });
    g.add(leaf);
    return g;
  });
  entry('Doors & gates', 'door-arched', 'Door \u2014 arched', (c) => {
    const g = new THREE.Group(), m = timber(c);
    [-1, 1].forEach((s) => put(g, BOX(0.26, 3.2, 0.4), m, s * 1.13, 1.6, 0));
    put(g, TOR(1.13, 0.17, 28), m, 0, 3.2, 0, 0, 0, 0);
    const leaf = put(g, BOX(2, 3.1, 0.14), m, 0, 1.55, 0);
    leaf.rotation.y = 0;
    const top = put(g, new THREE.CylinderGeometry(1, 1, 0.14, 24, 1, false, 0, Math.PI), m, 0, 3.1, 0, Math.PI / 2, 0, 0);
    top.rotation.set(Math.PI / 2, 0, 0);
    handle(g, iron('#2a2a30'), 0.75, 1.6, 0.07);
    for (let i = 0; i < 5; i++) put(g, CYL(0.07, 0.07, 0.04, 8), iron('#2a2a30'), -0.7, 0.6 + i * 0.6, 0.08, Math.PI / 2);
    return g;
  });
  entry('Doors & gates', 'door-double', 'Doors \u2014 double, ajar', (c) => {
    const g = new THREE.Group(), m = timber(c);
    doorFrame(g, m, 4, 4.4, 0.4);
    [-1, 1].forEach((s) => {
      const leaf = new THREE.Group();
      put(leaf, BOX(1.95, 4.3, 0.14), m, (s * 1.95) / 2, 2.15, 0);
      handle(leaf, iron('#2a2a30'), s * 0.2, 2.1, 0.07);
      leaf.position.x = s * 2;
      leaf.rotation.y = s * 0.55;
      g.add(leaf);
    });
    return g;
  });
  entry('Doors & gates', 'door-barn', 'Barn door \u2014 sliding', (c) => {
    const g = new THREE.Group(), m = timber(c);
    put(g, BOX(6, 0.16, 0.2), iron('#3a3a42'), 0, 4.5, -0.2);
    const leaf = new THREE.Group();
    put(leaf, BOX(2.8, 4.3, 0.16), m, 0, 2.15, 0);
    put(leaf, BOX(3, 0.18, 0.2), m, 0, 4.1, 0.08);
    put(leaf, BOX(3, 0.18, 0.2), m, 0, 0.3, 0.08);
    put(leaf, BOX(0.18, 4.6, 0.2), m, 0, 2.2, 0.08, 0, 0, 0.62);
    [-1, 1].forEach((s) => put(leaf, CYL(0.18, 0.18, 0.1, 14), iron('#3a3a42'), s * 1.1, 4.45, -0.1, Math.PI / 2));
    leaf.position.x = -1;
    g.add(leaf);
    return g;
  });
  entry('Doors & gates', 'door-stable', 'Stable door', (c) => {
    const g = new THREE.Group(), m = timber(c);
    doorFrame(g, m, 2, 4.2, 0.4);
    const top = put(g, BOX(1.9, 1.9, 0.14), m, -0.6, 3.1, 0.5, 0, -0.9, 0);
    top.position.set(-1.6, 3.15, 0.7);
    put(g, BOX(1.9, 2, 0.14), m, 0, 1.05, 0);
    put(g, BOX(1.9, 0.18, 0.24), m, 0, 2.1, 0.06);
    handle(g, iron('#2a2a30'), 0.7, 1.5, 0.07);
    return g;
  });
  entry('Doors & gates', 'door-vault', 'Vault door', (c) => {
    const g = new THREE.Group(), m = mat(c, { metalness: 0.85, roughness: 0.28 });
    put(g, TOR(1.9, 0.3, 40), m, 0, 2.2, 0);
    put(g, CYL(1.85, 1.85, 0.5, 40), m, 0, 2.2, 0, Math.PI / 2);
    put(g, TOR(0.75, 0.12, 28), m, 0, 2.2, 0.32);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      put(g, BOX(1.4, 0.14, 0.14), m, Math.cos(a) * 0.1, 2.2 + Math.sin(a) * 0.1, 0.34, 0, 0, a);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      put(g, CYL(0.12, 0.12, 0.6, 10), m, Math.cos(a) * 1.85, 2.2 + Math.sin(a) * 1.85, 0, Math.PI / 2);
    }
    return g;
  });
  entry('Doors & gates', 'gate-five-bar', 'Five-bar field gate', (c) => {
    const g = new THREE.Group(), m = timber(c);
    put(g, BOX(0.24, 3.4, 0.24), m, -2.1, 1.7, 0);
    put(g, BOX(0.24, 3.4, 0.24), m, 2.1, 1.7, 0);
    for (let i = 0; i < 5; i++) put(g, BOX(4.2, 0.18, 0.14), m, 0, 0.6 + i * 0.6, 0);
    put(g, BOX(4.9, 0.16, 0.12), m, 0, 1.8, 0.08, 0, 0, 0.6);
    put(g, CYL(0.09, 0.09, 3.6, 10), iron('#2f2f36'), -2.35, 1.8, 0);
    return g;
  });
  entry('Doors & gates', 'gate-iron', 'Wrought-iron gate', (c) => {
    const g = new THREE.Group(), m = iron(c);
    [-1, 1].forEach((s) => put(g, CYL(0.14, 0.16, 4.4, 14), m, s * 2.2, 2.2, 0));
    [-1, 1].forEach((s) => put(g, SPH(0.22), m, s * 2.2, 4.5, 0));
    for (let i = -3; i <= 3; i++) {
      put(g, CYL(0.06, 0.06, 3.6, 10), m, i * 0.6, 1.8, 0);
      put(g, CONE(0.11, 0.3, 10), m, i * 0.6, 3.75, 0);
    }
    [1.1, 3.3].forEach((y) => put(g, BOX(4.2, 0.12, 0.1), m, 0, y, 0));
    for (let i = -1; i <= 1; i++) put(g, TOR(0.42, 0.05, 20), m, i * 1.2, 2.2, 0);
    return g;
  });
  entry('Doors & gates', 'gate-garden', 'Garden gate', (c) => {
    const g = new THREE.Group(), m = timber(c);
    [-1, 1].forEach((s) => put(g, BOX(0.2, 2.6, 0.2), m, s * 1.3, 1.3, 0));
    for (let i = -2; i <= 2; i++) {
      const h = 2.1 - Math.abs(i) * 0.12;
      put(g, BOX(0.18, h, 0.1), m, i * 0.5, h / 2 + 0.2, 0);
      put(g, CONE(0.14, 0.2, 4), m, i * 0.5, h + 0.3, 0);
    }
    [0.7, 1.9].forEach((y) => put(g, BOX(2.4, 0.14, 0.1), m, 0, y, 0.05));
    return g;
  });
  entry('Doors & gates', 'gate-portcullis', 'Portcullis', (c) => {
    const g = new THREE.Group(), m = iron(c);
    for (let i = -3; i <= 3; i++) put(g, BOX(0.18, 5, 0.18), m, i * 0.7, 2.7, 0);
    for (let j = 0; j < 5; j++) put(g, BOX(4.6, 0.16, 0.16), m, 0, 0.8 + j * 1.1, 0);
    for (let i = -3; i <= 3; i++) put(g, CONE(0.14, 0.4, 4), m, i * 0.7, 0, 0, Math.PI);
    put(g, BOX(5.6, 0.5, 0.6), mat('#6b6459'), 0, 5.4, 0);
    return g;
  });
  entry('Doors & gates', 'gate-torii', 'Torii gate', (c) => {
    const g = new THREE.Group(), m = mat(c, { roughness: 0.6 });
    [-1, 1].forEach((s) => put(g, CYL(0.22, 0.28, 4.4, 18), m, s * 1.9, 2.2, 0, 0, 0, -s * 0.03));
    const top = put(g, BOX(5.6, 0.26, 0.5), m, 0, 4.7, 0);
    top.rotation.z = 0;
    put(g, BOX(6, 0.2, 0.4), m, 0, 4.95, 0);
    put(g, BOX(4.4, 0.24, 0.34), m, 0, 3.9, 0);
    put(g, BOX(0.3, 0.9, 0.3), m, 0, 4.3, 0);
    return g;
  });
  entry('Doors & gates', 'gate-lych', 'Lych gate', (c) => {
    const g = new THREE.Group(), m = timber(c);
    [[-1.6, -1], [1.6, -1], [-1.6, 1], [1.6, 1]].forEach(([x, z]) => put(g, BOX(0.26, 3, 0.26), m, x, 1.5, z));
    [-1, 1].forEach((s) => {
      const r = put(g, BOX(3.8, 0.16, 2.4), mat('#6d5a46'), 0, 3.7, s * 0.72);
      r.rotation.x = s * 0.5;
    });
    put(g, BOX(3.8, 0.2, 0.2), m, 0, 4.25, 0);
    for (let i = -1; i <= 1; i++) put(g, BOX(0.14, 1.4, 0.1), m, i * 0.6, 0.7, 0);
    put(g, BOX(2.2, 0.14, 0.1), m, 0, 1.3, 0);
    return g;
  });
  entry('Doors & gates', 'gate-temple', 'Temple gate', (c) => {
    const g = new THREE.Group(), m = mat(c, { roughness: 0.7 });
    [-1, 1].forEach((s) => put(g, BOX(0.9, 5, 0.9), m, s * 2.4, 2.5, 0));
    [-1, 1].forEach((s) => put(g, BOX(1.2, 0.3, 1.2), m, s * 2.4, 5.15, 0));
    put(g, BOX(6.4, 0.5, 1), m, 0, 5.6, 0);
    put(g, BOX(5.4, 0.4, 0.8), m, 0, 6.1, 0);
    for (let i = -2; i <= 2; i++) put(g, CYL(0.1, 0.1, 0.5, 8), m, i * 0.8, 5.95, 0.5);
    return g;
  });
  entry('Doors & gates', 'gate-sliding', 'Sliding yard gate', (c) => {
    const g = new THREE.Group(), m = iron(c);
    put(g, BOX(7, 0.2, 0.3), m, 0, 0.1, 0);
    const leaf = new THREE.Group();
    put(leaf, BOX(5, 0.18, 0.14), m, 0, 0.5, 0);
    put(leaf, BOX(5, 0.18, 0.14), m, 0, 2.9, 0);
    for (let i = -4; i <= 4; i++) put(leaf, BOX(0.12, 2.5, 0.12), m, i * 0.55, 1.7, 0);
    put(leaf, BOX(5.1, 0.16, 0.1), m, 0, 1.7, 0.06, 0, 0, 0.46);
    [-1, 1].forEach((s) => put(leaf, CYL(0.22, 0.22, 0.12, 14), m, s * 2, 0.22, 0, Math.PI / 2));
    leaf.position.x = 1.2;
    g.add(leaf);
    return g;
  });

  return library;
}
