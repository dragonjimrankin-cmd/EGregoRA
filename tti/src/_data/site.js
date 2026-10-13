import ttiAtlas from "./ttiAtlas.js";

/**
 * The Two Infinities: Eternal Integration of the Self — site-wide constants.
 *
 * The framework is James Alexander Matthew Rankin's, written between the
 * 2nd and 19th of June 2026 and revised to r4.6. This site is its reading
 * room: the same house style as EGregoRA, turned from the wood to the sky.
 */
/* The header and the introduction Atlas share one canonical table of contents.
   Each Part is a visible masthead heading; every page beneath it is rendered
   as a contextual subheading in that Part's panel. */
const glyphByRoute = Object.freeze({
  "/foundations/": "sphere",
  "/the-self/": "integral",
  "/dx/": "integral",
  "/prime-plane/": "star",
  "/gravity/": "spiral",
  "/spiral/": "spiral",
  "/skeletal-splice/": "spiral",
  "/torus/": "torus",
  "/megatubule/": "torus",
  "/moebius/": "mobius",
  "/cosmic-ledger/": "ledger",
  "/seams/": "star",
  "/entropy/": "spiral",
  "/temporal-antipodes/": "star",
  "/time-and-residue/": "ledger",
  "/inverted-toruses/": "torus",
  "/out-of-phase/": "mobius",
  "/stress-tests/": "eye",
  "/essays/": "tree",
  "/double-inversion/": "mobius",
  "/accumulated-differentials/": "integral",
  "/little-red-dots/": "star",
  "/little-red-dots/research-proposal/": "eye",
  "/plates/": "metatron",
  "/ask-shakdrah/": "dragon",
  "/join/": "seed",
  "/account/": "eye"
});

const navGroups = ttiAtlas.limbs.map((part) => ({
  part: part.num,
  label: `Part ${part.num} · ${part.title}`,
  shortLabel: part.title,
  note: part.note,
  items: part.subs.map((destination) => ({
    url: destination.href,
    label: destination.title,
    note: destination.note,
    glyph: glyphByRoute[destination.href] || "seed"
  }))
}));

/* Plates and Ask ShakDrah now sit beneath Part V with the other reading rooms
   instead of being duplicated as detached actions beside the five Parts. */
const navActions = [];

export default {
  name: "The Two Infinities: Eternal Integration of the Self",
  longName: "The Two Infinities: Eternal Integration of the Self",
  titleSuffix: "The Two Infinities",
  legacyName: "The Two Infinities",
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
  revision: "r4.6",
  revised: "2026-10-13",
  epigraph: "The universe exists not because something caused it — but because nothing is geometrically impossible.",
  description:
    "The Two Infinities: Eternal Integration of the Self — A speculative cosmology by Jim Rankin, UK, 2026. " +
    "It follows temporal-antipode infinities, π as closure, i as the half-turn that opens a dimension, consciousness as the integral, " +
    "gravity as curvature, entropy versus integration, double-inversion residue, accumulated differentials, the Cosmic Ledger, " +
    "and a falsifiable Little Red Dots research programme. Twenty papers, eleven source essays and new research notes, drawn as plates.",
  keywords:
    "The Two Infinities, A speculative cosmology by Jim Rankin, UK, 2026, two infinities, temporal antipodes, opposite ends of time, " +
    "synchronisation, smallward infinity, largeward infinity, geometry of existence, pi, Euler identity, " +
    "imaginary unit, Cantor, consciousness as integral, microtubules, Orch-OR, galactic torus, Möbius seam, " +
    "Klein bottle, double inversion, light polarization, geometric phase, entropy, accumulated differentials, mass, gravity, cosmic ledger, chi field, dark matter, dark energy, JWST little red dots, inherited residue, " +
    "zero seam, previous universe conjecture, preregistered research, flat rotation curves, CMB, Fibonacci splice, " +
    "golden ratio, triangular numbers, arrow of time, Hawking radiation, astronomy, cosmology",
  ogImage: "/assets/img/og-two-infinities.jpg",
  ogImageAlt: "A luminous torus of stars, with a spiral climbing from a bright centre",
  motto: "Nothing is geometrically impossible.",

  /* Five numbered Parts replace the abstract four-cluster header. `nav`
     remains the complete flat list for the footer and audits. */
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
