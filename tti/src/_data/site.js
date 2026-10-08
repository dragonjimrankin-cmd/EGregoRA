/**
 * The Two Infinities (and Beyond) — site-wide constants.
 *
 * The framework is James Alexander Matthew Rankin's, written between the
 * 2nd and 19th of June 2026 and revised to r3.5. This site is its reading
 * room: the same house style as EGregoRA, turned from the wood to the sky.
 */
export default {
  name: "The Two Infinities",
  longName: "The Two Infinities (and Beyond)",
  tagline: "Zero, One, and the Shape They Are Forced to Make.",
  url: "https://two-infinities.hatchable.site",
  lang: "en-GB",
  locale: "en_GB",
  themeColor: "#03040c",
  email: "dragon.jim.rankin@gmail.com",
  author: "James Alexander Matthew Rankin",
  cofounder: "James Alexander Matthew Rankin",
  cofounder2: "ShakDragon",
  founded: "2026-06-02",
  revision: "r3.5",
  revised: "2026-06-20",
  epigraph: "The universe exists not because something caused it — but because nothing is geometrically impossible.",
  description:
    "The Two Infinities: a geometry of existence from zero and one — π as the constant of closure, " +
    "i as the half-turn that opens a dimension, consciousness as the integral, gravity as the curvature " +
    "itself, and the Cosmic Ledger that measures all three. Twenty papers, eleven essays and the " +
    "χ-field dark-sector model, drawn as plates.",
  keywords:
    "two infinities, geometry of existence, pi, Euler identity, imaginary unit, Cantor, " +
    "consciousness as integral, microtubules, Orch-OR, galactic torus, Möbius seam, Klein bottle, " +
    "cosmic ledger, chi field, dark matter, dark energy, flat rotation curves, CMB, Fibonacci splice, " +
    "golden ratio, triangular numbers, arrow of time, Hawking radiation, astronomy, cosmology",
  ogImage: "/assets/img/og-two-infinities.jpg",
  ogImageAlt: "A luminous torus of stars, with a spiral climbing from a bright centre",
  motto: "Nothing is geometrically impossible.",

  /* The spine of the site. Eight parts of the Unified Edition, plus the
     plate room, the dragon, and the way in. */
  nav: [
    { url: "/foundations/",   label: "Foundations",   glyph: "sphere" },
    { url: "/the-self/",      label: "The Self",      glyph: "integral" },
    { url: "/gravity/",       label: "Gravity",       glyph: "spiral" },
    { url: "/torus/",         label: "Torus",         glyph: "torus" },
    { url: "/moebius/",       label: "Möbius",        glyph: "mobius" },
    { url: "/cosmic-ledger/", label: "The Ledger",    glyph: "ledger" },
    { url: "/seams/",         label: "Seams",         glyph: "star" },
    { url: "/stress-tests/",  label: "Stress Tests",  glyph: "eye" },
    { url: "/essays/",        label: "Essays",        glyph: "tree" },
    { url: "/plates/",        label: "Plates",        glyph: "metatron" },
    { url: "/ask-shakdragon/",label: "ShakDragon",    glyph: "dragon" }
  ],

  oracle: {
    name: "ShakDragon",
    kind: "a green dragon",
    blurb:
      "ShakDragon keeps the framework in his head the way old dragons keep maps: whole, " +
      "and with the dangerous parts marked. Ask him anything in these papers and he will " +
      "answer from them — and tell you plainly when a thing is earned, chosen, or refused."
  }
};
