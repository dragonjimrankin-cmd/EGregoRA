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

  return library;
}
