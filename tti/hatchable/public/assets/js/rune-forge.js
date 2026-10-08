/* ===========================================================================
   The Rune Forge — the shared parts
   ---------------------------------------------------------------------------
   One rune is a small specification: a blank (its shape and its substance),
   a stave cut into the face, an optional stone set into it, and a meaning
   the maker gives it. This module holds the alphabet, the materials, the
   gemstones and the builder that turns a specification into a three.js
   group. The forge on the Runes page and the Turning Shop on the Ask Ed
   page both import it, so a rune carried from one to the other is built
   from the same code and arrives identical.

   Nothing here touches the document, so it can be imported anywhere.
   ======================================================================== */

/* --- the Elder Futhark ----------------------------------------------------
   Each stave is a list of straight cuts in a unit square, x and y from 0 to
   1 with y upward, exactly as they are cut into wood or stone: runes have
   no curves because curves split along the grain and are hard to chisel. */
export const FUTHARK = [
  { id: 'fehu', char: '\u16A0', name: 'Fehu', sound: 'f', gloss: 'Cattle, movable wealth',
    cuts: [[0.30, 0.02, 0.30, 0.98], [0.30, 0.98, 0.78, 0.76], [0.30, 0.66, 0.78, 0.44]] },
  { id: 'uruz', char: '\u16A2', name: 'Uruz', sound: 'u', gloss: 'The aurochs, untamed strength',
    cuts: [[0.25, 0.02, 0.25, 0.98], [0.25, 0.98, 0.75, 0.78], [0.75, 0.78, 0.75, 0.02]] },
  { id: 'thurisaz', char: '\u16A6', name: 'Thurisaz', sound: 'th', gloss: 'The thorn, the giant, a defended edge',
    cuts: [[0.30, 0.02, 0.30, 0.98], [0.30, 0.74, 0.72, 0.52], [0.72, 0.52, 0.30, 0.30]] },
  { id: 'ansuz', char: '\u16A8', name: 'Ansuz', sound: 'a', gloss: 'The god, the mouth, speech',
    cuts: [[0.30, 0.02, 0.30, 0.98], [0.30, 0.98, 0.76, 0.76], [0.30, 0.68, 0.76, 0.46]] },
  { id: 'raidho', char: '\u16B1', name: 'Raidho', sound: 'r', gloss: 'The ride, the journey, right order',
    cuts: [[0.30, 0.02, 0.30, 0.98], [0.30, 0.98, 0.74, 0.82], [0.74, 0.82, 0.30, 0.60], [0.30, 0.60, 0.76, 0.02]] },
  { id: 'kenaz', char: '\u16B2', name: 'Kenaz', sound: 'k', gloss: 'The torch, the forge, craft',
    cuts: [[0.30, 0.50, 0.74, 0.98], [0.30, 0.50, 0.74, 0.02]] },
  { id: 'gebo', char: '\u16B7', name: 'Gebo', sound: 'g', gloss: 'The gift, and the obligation in it',
    cuts: [[0.20, 0.02, 0.80, 0.98], [0.80, 0.02, 0.20, 0.98]] },
  { id: 'wunjo', char: '\u16B9', name: 'Wunjo', sound: 'w', gloss: 'Joy, and the kin it is had among',
    cuts: [[0.30, 0.02, 0.30, 0.98], [0.30, 0.98, 0.74, 0.78], [0.74, 0.78, 0.30, 0.58]] },
  { id: 'hagalaz', char: '\u16BA', name: 'Hagalaz', sound: 'h', gloss: 'Hail: damage that comes from the sky',
    cuts: [[0.25, 0.02, 0.25, 0.98], [0.75, 0.02, 0.75, 0.98], [0.25, 0.64, 0.75, 0.36]] },
  { id: 'nauthiz', char: '\u16BE', name: 'Nauthiz', sound: 'n', gloss: 'Need, the fire drill, constraint',
    cuts: [[0.50, 0.02, 0.50, 0.98], [0.22, 0.34, 0.78, 0.66]] },
  { id: 'isa', char: '\u16C1', name: 'Isa', sound: 'i', gloss: 'Ice: stillness, and a bridge that may hold',
    cuts: [[0.50, 0.02, 0.50, 0.98]] },
  { id: 'jera', char: '\u16C3', name: 'Jera', sound: 'j', gloss: 'The year, the harvest, a cycle completed',
    cuts: [[0.44, 0.98, 0.76, 0.72], [0.76, 0.72, 0.44, 0.52], [0.56, 0.48, 0.24, 0.28], [0.24, 0.28, 0.56, 0.02]] },
  { id: 'eihwaz', char: '\u16C7', name: 'Eihwaz', sound: '\u00E6', gloss: 'The yew, the world tree, endurance through death',
    cuts: [[0.45, 0.08, 0.45, 0.92], [0.45, 0.92, 0.76, 1.00], [0.45, 0.08, 0.14, 0.00]] },
  { id: 'perthro', char: '\u16C8', name: 'Perthro', sound: 'p', gloss: 'The lot cup: chance, and what is not yet known',
    cuts: [[0.30, 0.02, 0.30, 0.98], [0.30, 0.98, 0.74, 0.78], [0.30, 0.02, 0.74, 0.22]] },
  { id: 'algiz', char: '\u16C9', name: 'Algiz', sound: 'z', gloss: 'The elk, the raised hand, warding',
    cuts: [[0.50, 0.02, 0.50, 0.98], [0.50, 0.70, 0.16, 0.98], [0.50, 0.70, 0.84, 0.98]] },
  { id: 'sowilo', char: '\u16CA', name: 'Sowilo', sound: 's', gloss: 'The sun, the sail, victory in plain daylight',
    cuts: [[0.72, 0.98, 0.30, 0.72], [0.30, 0.72, 0.72, 0.44], [0.72, 0.44, 0.30, 0.10]] },
  { id: 'tiwaz', char: '\u16CF', name: 'Tiwaz', sound: 't', gloss: 'Tyr: the oath kept at cost, the pole star',
    cuts: [[0.50, 0.02, 0.50, 0.98], [0.50, 0.98, 0.20, 0.68], [0.50, 0.98, 0.80, 0.68]] },
  { id: 'berkano', char: '\u16D2', name: 'Berkano', sound: 'b', gloss: 'The birch, the mother, quiet beginnings',
    cuts: [[0.30, 0.02, 0.30, 0.98], [0.30, 0.98, 0.74, 0.78], [0.74, 0.78, 0.30, 0.56],
           [0.30, 0.56, 0.74, 0.30], [0.74, 0.30, 0.30, 0.06]] },
  { id: 'ehwaz', char: '\u16D6', name: 'Ehwaz', sound: 'e', gloss: 'The horse: a partnership that carries you',
    cuts: [[0.25, 0.02, 0.25, 0.98], [0.75, 0.02, 0.75, 0.98], [0.25, 0.98, 0.50, 0.70], [0.50, 0.70, 0.75, 0.98]] },
  { id: 'mannaz', char: '\u16D7', name: 'Mannaz', sound: 'm', gloss: 'The human being, and humankind',
    cuts: [[0.22, 0.02, 0.22, 0.98], [0.78, 0.02, 0.78, 0.98], [0.22, 0.98, 0.78, 0.50], [0.78, 0.98, 0.22, 0.50]] },
  { id: 'laguz', char: '\u16DA', name: 'Laguz', sound: 'l', gloss: 'Water, the leek, what flows and what grows in it',
    cuts: [[0.35, 0.02, 0.35, 0.98], [0.35, 0.98, 0.74, 0.70]] },
  { id: 'ingwaz', char: '\u16DC', name: 'Ingwaz', sound: '\u014Bg', gloss: 'Ing: the seed held, potential stored',
    cuts: [[0.50, 0.98, 0.80, 0.50], [0.80, 0.50, 0.50, 0.02], [0.50, 0.02, 0.20, 0.50], [0.20, 0.50, 0.50, 0.98]] },
  { id: 'dagaz', char: '\u16DE', name: 'Dagaz', sound: 'd', gloss: 'Day: the hinge between dark and light',
    cuts: [[0.22, 0.02, 0.22, 0.98], [0.78, 0.02, 0.78, 0.98], [0.22, 0.02, 0.78, 0.98], [0.22, 0.98, 0.78, 0.02]] },
  { id: 'othala', char: '\u16DF', name: 'Othala', sound: 'o', gloss: 'The inherited homestead \u2014 and the rune most stolen',
    cuts: [[0.50, 0.98, 0.78, 0.62], [0.78, 0.62, 0.50, 0.30], [0.50, 0.30, 0.22, 0.62], [0.22, 0.62, 0.50, 0.98],
           [0.36, 0.44, 0.18, 0.02], [0.64, 0.44, 0.82, 0.02]] }
];

/* --- what the blank is made of -------------------------------------------- */
export const SUBSTANCES = [
  { id: 'oak', label: 'Oak heartwood', colour: 0x8a6033, rough: 0.82, metal: 0.0 },
  { id: 'ash', label: 'Ash', colour: 0xc9ac79, rough: 0.8, metal: 0.0 },
  { id: 'yew', label: 'Yew', colour: 0x7a3f2a, rough: 0.72, metal: 0.0 },
  { id: 'birch', label: 'Birch', colour: 0xe4dcc6, rough: 0.78, metal: 0.0 },
  { id: 'blackthorn', label: 'Blackthorn', colour: 0x3b2e26, rough: 0.74, metal: 0.0 },
  { id: 'bone', label: 'Bone', colour: 0xe8e0cb, rough: 0.55, metal: 0.0 },
  { id: 'antler', label: 'Antler', colour: 0xd8c9a6, rough: 0.6, metal: 0.0 },
  { id: 'slate', label: 'Slate', colour: 0x4a4f56, rough: 0.68, metal: 0.0 },
  { id: 'basalt', label: 'Basalt', colour: 0x32343a, rough: 0.85, metal: 0.0 },
  { id: 'granite', label: 'Granite', colour: 0x8d8880, rough: 0.72, metal: 0.0 },
  { id: 'chalk', label: 'Chalk', colour: 0xf1ede2, rough: 0.95, metal: 0.0 },
  { id: 'clay', label: 'Fired clay', colour: 0xa6603f, rough: 0.8, metal: 0.0 },
  { id: 'obsidian-blank', label: 'Obsidian', colour: 0x14121a, rough: 0.12, metal: 0.0 },
  { id: 'bronze', label: 'Bronze', colour: 0xb07d3a, rough: 0.34, metal: 1.0 },
  { id: 'iron', label: 'Cold iron', colour: 0x5a5e66, rough: 0.46, metal: 1.0 },
  { id: 'silver', label: 'Silver', colour: 0xd7d9de, rough: 0.18, metal: 1.0 },
  { id: 'gold', label: 'Gold', colour: 0xd9a93c, rough: 0.2, metal: 1.0 }
];

/* --- the stones -----------------------------------------------------------
   Every main family of precious and semi-precious stone, with the optical
   behaviour that actually distinguishes them: a transparent gem transmits
   and refracts, an opaque one does not, and a few of them do something odd
   with the light that is worth modelling. */
export const GEMS = [
  { id: 'none', label: 'No stone', group: '\u2014' },

  { id: 'diamond', label: 'Diamond', group: 'Precious', colour: 0xf4f6ff, clear: 1, ior: 2.42, rough: 0.0 },
  { id: 'ruby', label: 'Ruby', group: 'Precious', colour: 0xa0132c, clear: 0.9, ior: 1.77, rough: 0.03 },
  { id: 'sapphire', label: 'Sapphire', group: 'Precious', colour: 0x1b3f8f, clear: 0.9, ior: 1.77, rough: 0.03 },
  { id: 'emerald', label: 'Emerald', group: 'Precious', colour: 0x12795a, clear: 0.85, ior: 1.58, rough: 0.07 },

  { id: 'amethyst', label: 'Amethyst', group: 'Quartz', colour: 0x7a46b8, clear: 0.88, ior: 1.54, rough: 0.04 },
  { id: 'citrine', label: 'Citrine', group: 'Quartz', colour: 0xd79a28, clear: 0.88, ior: 1.54, rough: 0.04 },
  { id: 'rose-quartz', label: 'Rose quartz', group: 'Quartz', colour: 0xe3a3ad, clear: 0.5, ior: 1.54, rough: 0.2 },
  { id: 'smoky-quartz', label: 'Smoky quartz', group: 'Quartz', colour: 0x5b4636, clear: 0.8, ior: 1.54, rough: 0.06 },
  { id: 'clear-quartz', label: 'Clear quartz', group: 'Quartz', colour: 0xeef3f6, clear: 0.95, ior: 1.54, rough: 0.02 },
  { id: 'carnelian', label: 'Carnelian', group: 'Quartz', colour: 0xb4461d, clear: 0.35, ior: 1.54, rough: 0.18 },
  { id: 'agate', label: 'Banded agate', group: 'Quartz', colour: 0xb89a74, clear: 0.25, ior: 1.54, rough: 0.2 },
  { id: 'jasper', label: 'Jasper', group: 'Quartz', colour: 0x8c3f2c, clear: 0, rough: 0.35 },
  { id: 'bloodstone', label: 'Bloodstone', group: 'Quartz', colour: 0x24503a, clear: 0, rough: 0.3 },
  { id: 'tigers-eye', label: "Tiger's eye", group: 'Quartz', colour: 0xa9712a, clear: 0, rough: 0.22, sheen: 1 },
  { id: 'onyx', label: 'Black onyx', group: 'Quartz', colour: 0x15151a, clear: 0, rough: 0.12 },

  { id: 'aquamarine', label: 'Aquamarine', group: 'Beryl', colour: 0x8fd3d8, clear: 0.9, ior: 1.58, rough: 0.04 },
  { id: 'morganite', label: 'Morganite', group: 'Beryl', colour: 0xe8b7ab, clear: 0.88, ior: 1.58, rough: 0.05 },
  { id: 'heliodor', label: 'Heliodor', group: 'Beryl', colour: 0xd9c04a, clear: 0.88, ior: 1.58, rough: 0.05 },

  { id: 'topaz', label: 'Topaz', group: 'Other crystal', colour: 0x9fc6e8, clear: 0.9, ior: 1.62, rough: 0.03 },
  { id: 'peridot', label: 'Peridot', group: 'Other crystal', colour: 0x8dbb2c, clear: 0.88, ior: 1.65, rough: 0.05 },
  { id: 'garnet', label: 'Garnet', group: 'Other crystal', colour: 0x7c1420, clear: 0.85, ior: 1.78, rough: 0.05 },
  { id: 'spinel', label: 'Spinel', group: 'Other crystal', colour: 0xc43f63, clear: 0.88, ior: 1.72, rough: 0.04 },
  { id: 'zircon', label: 'Zircon', group: 'Other crystal', colour: 0xd6c6a8, clear: 0.9, ior: 1.93, rough: 0.03 },
  { id: 'tanzanite', label: 'Tanzanite', group: 'Other crystal', colour: 0x5240a8, clear: 0.88, ior: 1.69, rough: 0.05 },
  { id: 'tourmaline', label: 'Tourmaline', group: 'Other crystal', colour: 0x2f7a4d, clear: 0.85, ior: 1.62, rough: 0.06 },
  { id: 'fluorite', label: 'Fluorite', group: 'Other crystal', colour: 0x6fbfa5, clear: 0.9, ior: 1.43, rough: 0.07 },
  { id: 'iolite', label: 'Iolite', group: 'Other crystal', colour: 0x4a5aa8, clear: 0.86, ior: 1.54, rough: 0.05 },

  { id: 'opal', label: 'Opal', group: 'Play of light', colour: 0xdfe8ea, clear: 0.55, ior: 1.45, rough: 0.12, sheen: 1 },
  { id: 'moonstone', label: 'Moonstone', group: 'Play of light', colour: 0xd6dde8, clear: 0.6, ior: 1.52, rough: 0.14, sheen: 1 },
  { id: 'labradorite', label: 'Labradorite', group: 'Play of light', colour: 0x40566b, clear: 0.15, ior: 1.56, rough: 0.16, sheen: 1 },
  { id: 'sunstone', label: 'Sunstone', group: 'Play of light', colour: 0xd07a35, clear: 0.4, ior: 1.54, rough: 0.16, sheen: 1 },

  { id: 'lapis', label: 'Lapis lazuli', group: 'Opaque', colour: 0x1f3a93, clear: 0, rough: 0.3 },
  { id: 'turquoise', label: 'Turquoise', group: 'Opaque', colour: 0x2fa6a6, clear: 0, rough: 0.3 },
  { id: 'malachite', label: 'Malachite', group: 'Opaque', colour: 0x157a52, clear: 0, rough: 0.22, sheen: 1 },
  { id: 'jade', label: 'Jade', group: 'Opaque', colour: 0x4f8f5c, clear: 0.3, ior: 1.66, rough: 0.2 },
  { id: 'sodalite', label: 'Sodalite', group: 'Opaque', colour: 0x2a3f8a, clear: 0, rough: 0.3 },
  { id: 'obsidian', label: 'Obsidian', group: 'Opaque', colour: 0x15131b, clear: 0, rough: 0.08 },
  { id: 'jet', label: 'Jet', group: 'Opaque', colour: 0x101014, clear: 0, rough: 0.25 },
  { id: 'amber', label: 'Amber', group: 'Opaque', colour: 0xc87a1a, clear: 0.75, ior: 1.54, rough: 0.14 },
  { id: 'pearl', label: 'Pearl', group: 'Opaque', colour: 0xf0e8dc, clear: 0, rough: 0.12, sheen: 1 },
  { id: 'hematite', label: 'Hematite', group: 'Opaque', colour: 0x4b4d52, clear: 0, rough: 0.18, metal: 1 },
  { id: 'pyrite', label: 'Pyrite', group: 'Opaque', colour: 0xc9a63a, clear: 0, rough: 0.22, metal: 1 }
];

/* --- the shape of the blank ----------------------------------------------- */
export const BLANKS = [
  { id: 'tablet', label: 'Tablet \u2014 a flat rectangle' },
  { id: 'disc', label: 'Disc \u2014 a cut round' },
  { id: 'pebble', label: 'Pebble \u2014 a river stone' },
  { id: 'stave', label: 'Stave \u2014 a long bar' },
  { id: 'pendant', label: 'Pendant \u2014 drilled to hang' },
  { id: 'lozenge', label: 'Lozenge \u2014 a four-sided gem cut' },
  { id: 'shard', label: 'Shard \u2014 broken, not shaped' }
];

export const SETTINGS = [
  { id: 'inlaid', label: 'Inlaid flush into the face' },
  { id: 'cabochon', label: 'Cabochon, standing proud' },
  { id: 'faceted', label: 'Faceted and raised' },
  { id: 'pierced', label: 'Set through the stave' },
  { id: 'crowned', label: 'Crowned at the head of the blank' }
];

export const byId = (list, id) => list.find((x) => x.id === id) || list[0];

export function blankSpec(i) {
  const rune = FUTHARK[i % FUTHARK.length];
  return {
    rune: rune.id,
    blank: 'tablet',
    substance: 'oak',
    gem: 'none',
    setting: 'inlaid',
    depth: 0.5,
    meaning: '',
    made: Date.now()
  };
}

/* --- building one ---------------------------------------------------------
   A blank, the stave cut into both faces, and the stone. Everything is a
   primitive: the group can be moved, turned, scaled, exported to OBJ and
   photographed exactly like anything else on the bench. */
export function buildRune(THREE, spec) {
  const s = Object.assign(blankSpec(0), spec || {});
  const rune = byId(FUTHARK, s.rune);
  const sub = byId(SUBSTANCES, s.substance);
  const gem = byId(GEMS, s.gem);
  const group = new THREE.Group();

  const body = new THREE.MeshStandardMaterial({
    color: sub.colour, roughness: sub.rough, metalness: sub.metal
  });
  const cut = new THREE.MeshStandardMaterial({
    color: new THREE.Color(sub.colour).multiplyScalar(0.34),
    roughness: Math.min(1, sub.rough + 0.12), metalness: sub.metal * 0.6
  });

  /* The blank itself. W and H are the face; T is how thick it is. */
  let W = 1.5, H = 2.2, T = 0.34;
  let blankMesh;
  if (s.blank === 'disc') {
    W = H = 2.0; T = 0.3;
    blankMesh = new THREE.Mesh(new THREE.CylinderGeometry(W / 2, W / 2, T, 48), body);
    blankMesh.rotation.x = Math.PI / 2;
  } else if (s.blank === 'pebble') {
    W = 1.9; H = 2.3; T = 0.72;
    blankMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), body);
    blankMesh.scale.set(W / 2, H / 2, T / 2);
  } else if (s.blank === 'stave') {
    W = 0.95; H = 3.1; T = 0.3;
    blankMesh = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), body);
  } else if (s.blank === 'pendant') {
    W = H = 1.9; T = 0.26;
    blankMesh = new THREE.Mesh(new THREE.CylinderGeometry(W / 2, W / 2, T, 48), body);
    blankMesh.rotation.x = Math.PI / 2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 12, 28), body);
    ring.position.set(0, H / 2 + 0.16, 0);
    group.add(ring);
  } else if (s.blank === 'lozenge') {
    W = 1.7; H = 2.5; T = 0.42;
    blankMesh = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), body);
    blankMesh.scale.set(W / 2, H / 2, T / 2);
  } else if (s.blank === 'shard') {
    W = 1.6; H = 2.4; T = 0.3;
    blankMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), body);
    blankMesh.scale.set(W / 2, H / 2, T / 2);
  } else {
    blankMesh = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), body);
  }
  blankMesh.castShadow = true;
  blankMesh.receiveShadow = true;
  group.add(blankMesh);

  /* The stave. Each cut is a thin box laid on the face and sunk into it, on
     the front and again on the back, the way a rune cut through a thin
     tablet shows on both sides. */
  const depth = Math.max(0.08, Math.min(1, Number(s.depth) || 0.5));
  const gauge = 0.085 + depth * 0.05;
  const sink = T / 2 - (0.02 + depth * 0.06);
  const fieldW = W * 0.62, fieldH = H * 0.62;

  const carve = (z, flip) => {
    rune.cuts.forEach((c) => {
      const x1 = (c[0] - 0.5) * fieldW * (flip ? -1 : 1);
      const y1 = (c[1] - 0.5) * fieldH;
      const x2 = (c[2] - 0.5) * fieldW * (flip ? -1 : 1);
      const y2 = (c[3] - 0.5) * fieldH;
      const len = Math.hypot(x2 - x1, y2 - y1);
      if (len < 0.001) return;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(len + gauge * 0.6, gauge, gauge * 1.4), cut);
      bar.position.set((x1 + x2) / 2, (y1 + y2) / 2, z);
      bar.rotation.z = Math.atan2(y2 - y1, x2 - x1);
      bar.castShadow = true;
      group.add(bar);
    });
  };
  carve(sink, false);
  carve(-sink, true);

  /* The stone. */
  if (gem && gem.id !== 'none') {
    const opts = {
      color: gem.colour,
      roughness: gem.rough != null ? gem.rough : 0.1,
      metalness: gem.metal || 0
    };
    let stone;
    if (gem.clear > 0.2 && THREE.MeshPhysicalMaterial) {
      stone = new THREE.MeshPhysicalMaterial(Object.assign(opts, {
        transmission: gem.clear,
        thickness: 0.6,
        ior: gem.ior || 1.5,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        transparent: true,
        opacity: Math.max(0.55, 1 - gem.clear * 0.25),
        iridescence: gem.sheen ? 0.7 : 0
      }));
    } else {
      stone = new THREE.MeshPhysicalMaterial(Object.assign(opts, {
        clearcoat: gem.sheen ? 1 : 0.4,
        clearcoatRoughness: 0.06,
        iridescence: gem.sheen ? 0.85 : 0,
        iridescenceIOR: 1.6,
        sheen: gem.sheen ? 1 : 0
      }));
    }

    const r = Math.min(W, H) * 0.19;
    let geom;
    if (s.setting === 'faceted') geom = new THREE.OctahedronGeometry(r, 0);
    else if (s.setting === 'cabochon') geom = new THREE.SphereGeometry(r, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    else if (s.setting === 'pierced') geom = new THREE.IcosahedronGeometry(r * 0.78, 0);
    else if (s.setting === 'crowned') geom = new THREE.ConeGeometry(r * 0.9, r * 1.8, 8);
    else geom = new THREE.CylinderGeometry(r, r, T * 0.5, 36);

    const set = new THREE.Mesh(geom, stone);
    if (s.setting === 'inlaid') { set.rotation.x = Math.PI / 2; set.position.set(0, -H * 0.34, T * 0.18); }
    else if (s.setting === 'cabochon') { set.rotation.x = -Math.PI / 2; set.position.set(0, -H * 0.3, T / 2); }
    else if (s.setting === 'faceted') set.position.set(0, -H * 0.3, T / 2 + r * 0.4);
    else if (s.setting === 'pierced') set.position.set(0, 0, 0);
    else set.position.set(0, H / 2 + r * 1.1, 0);
    set.castShadow = true;
    group.add(set);

    /* A collar of the blank's own substance, so the stone looks seated
       rather than balanced. */
    if (s.setting !== 'pierced' && s.setting !== 'inlaid') {
      const collar = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, r * 0.14, 10, 28), body);
      collar.position.copy(set.position);
      if (s.setting === 'crowned') collar.rotation.x = Math.PI / 2;
      group.add(collar);
    }
  }

  group.userData = {
    kind: 'Rune: ' + rune.name,
    rune: rune.id,
    runeName: rune.name,
    runeChar: rune.char,
    gloss: rune.gloss,
    meaning: String(s.meaning || ''),
    spec: s,
    fromForge: true
  };
  return group;
}

/* --- carrying them between pages ------------------------------------------
   The forge writes the set here and sends the maker to the bench; the bench
   picks it up once and clears it, so a reload does not keep re-placing the
   same runes. */
export const HANDOVER_KEY = 'eg-rune-handover';
export const BOOK_KEY = 'eg-rune-book';

export function sendToBench(specs) {
  try {
    localStorage.setItem(HANDOVER_KEY, JSON.stringify(specs || []));
    return true;
  } catch {
    return false;
  }
}

export function takeFromBench() {
  try {
    const raw = localStorage.getItem(HANDOVER_KEY);
    if (!raw) return [];
    localStorage.removeItem(HANDOVER_KEY);
    const out = JSON.parse(raw);
    return Array.isArray(out) ? out : [];
  } catch {
    return [];
  }
}
