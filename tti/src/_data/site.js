/**
 * The Shape of Becoming: Infinity, Gravity and Existence — site-wide constants.
 *
 * The framework is James Alexander Matthew Rankin's, written between the
 * 2nd and 19th of June 2026 and revised to r4.2. This site is its reading
 * room: the same house style as EGregoRA, turned from the wood to the sky.
 */
const navGroups = [
  {
    label: "First principles",
    shortLabel: "Begin",
    note: "Zero, one, the self and the smallest gathering",
    items: [
      { url: "/foundations/", label: "Foundations", note: "The geometry of existence", glyph: "sphere" },
      { url: "/the-self/", label: "The Self", note: "Consciousness as the integral", glyph: "integral" },
      { url: "/dx/", label: "dx", note: "The completed differential", glyph: "integral" }
    ]
  },
  {
    label: "Cosmic architecture",
    shortLabel: "Cosmos",
    note: "Curvature, growth and the recurring toroidal form",
    items: [
      { url: "/gravity/", label: "Gravity", note: "Curvature rather than force", glyph: "spiral" },
      { url: "/spiral/", label: "The Spiral", note: "The pace of becoming", glyph: "spiral" },
      { url: "/skeletal-splice/", label: "The Splice", note: "Fibonacci accumulation", glyph: "spiral" },
      { url: "/torus/", label: "Torus", note: "The shape that keeps returning", glyph: "torus" },
      { url: "/megatubule/", label: "Megatubule", note: "The galactic-scale conjecture", glyph: "torus" }
    ]
  },
  {
    label: "Seams and return",
    shortLabel: "Seams",
    note: "Inversion, entropy, residue and the cosmic account",
    items: [
      { url: "/moebius/", label: "Möbius", note: "The inside of the outside", glyph: "mobius" },
      { url: "/cosmic-ledger/", label: "Cosmic Ledger", note: "Three residues and what they owe", glyph: "ledger" },
      { url: "/seams/", label: "Seams", note: "Horizons, time and return", glyph: "star" },
      { url: "/entropy/", label: "Entropy", note: "Physics before metaphor", glyph: "spiral" }
    ]
  },
  {
    label: "Tests and essays",
    shortLabel: "Enquire",
    note: "Conjectures, objections and ways the sky can refuse",
    items: [
      { url: "/stress-tests/", label: "Stress Tests", note: "Where the framework might break", glyph: "eye" },
      { url: "/essays/", label: "Essays", note: "Standalone arguments and retractions", glyph: "tree" },
      { url: "/double-inversion/", label: "Two Inversions", note: "Möbius return and polarized light", glyph: "mobius" },
      { url: "/accumulated-differentials/", label: "Accumulation", note: "Differentials, mass and gravity", glyph: "integral" },
      { url: "/little-red-dots/", label: "Little Red Dots", note: "The inherited-residue conjecture", glyph: "star" },
      { url: "/little-red-dots/research-proposal/", label: "Zero-Seam Test", note: "The preregistered research programme", glyph: "eye" }
    ]
  }
];

const navActions = [
  { url: "/plates/", label: "Plates", note: "The visual compendium", glyph: "metatron", kind: "quiet" },
  { url: "/ask-shakdrah/", label: "Ask ShakDrah", note: "Question the whole framework", glyph: "dragon", kind: "primary" }
];

export default {
  name: "The Shape of Becoming: Infinity, Gravity and Existence",
  longName: "The Shape of Becoming: Infinity, Gravity and Existence",
  titleSuffix: "The Shape of Becoming",
  legacyName: "The Shape of Becoming",
  tagline: "A speculative cosmology by Jim Rankin, UK, 2026",
  url: "https://the-two-infinities.hatchable.site",
  lang: "en-GB",
  locale: "en_GB",
  themeColor: "#03040c",
  email: "dragon.jim.rankin@gmail.com",
  author: "James Alexander Matthew Rankin",
  cofounder: "James Alexander Matthew Rankin",
  cofounder2: "ShakDrah",
  founded: "2026-06-02",
  revision: "r4.2",
  revised: "2026-10-13",
  epigraph: "The universe exists not because something caused it — but because nothing is geometrically impossible.",
  description:
    "The Shape of Becoming: Infinity, Gravity and Existence — A speculative cosmology by Jim Rankin, UK, 2026. " +
    "It follows temporal-antipode infinities, π as closure, i as the half-turn that opens a dimension, consciousness as the integral, " +
    "gravity as curvature, entropy versus integration, double-inversion residue, accumulated differentials, the Cosmic Ledger, " +
    "and a falsifiable Little Red Dots research programme. Twenty papers, eleven source essays and new research notes, drawn as plates.",
  keywords:
    "The Shape of Becoming, A speculative cosmology by Jim Rankin, UK, 2026, two infinities, temporal antipodes, opposite ends of time, " +
    "synchronisation, smallward infinity, largeward infinity, geometry of existence, pi, Euler identity, " +
    "imaginary unit, Cantor, consciousness as integral, microtubules, Orch-OR, galactic torus, Möbius seam, " +
    "Klein bottle, double inversion, light polarization, geometric phase, entropy, accumulated differentials, mass, gravity, cosmic ledger, chi field, dark matter, dark energy, JWST little red dots, inherited residue, " +
    "zero seam, previous universe conjecture, preregistered research, flat rotation curves, CMB, Fibonacci splice, " +
    "golden ratio, triangular numbers, arrow of time, Hawking radiation, astronomy, cosmology",
  ogImage: "/assets/img/og-two-infinities.jpg",
  ogImageAlt: "A luminous torus of stars, with a spiral climbing from a bright centre",
  motto: "Nothing is geometrically impossible.",

  /* Four readable constellations replace the former wall of twenty equal
     links. `nav` remains the complete flat list for the footer and audits. */
  navGroups,
  navActions,
  nav: [...navGroups.flatMap((group) => group.items), ...navActions],

  oracle: {
    name: "ShakDrah",
    kind: "a green dragon",
    blurb:
      "ShakDrah keeps the framework in his head the way old dragons keep maps: whole, " +
      "and with the dangerous parts marked. Ask him anything in these papers and he will " +
      "answer from them — and tell you plainly when a thing is earned, chosen, or refused."
  }
};
