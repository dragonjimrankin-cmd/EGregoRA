import ttiAtlas from "./ttiAtlas.js";

/**
 * The Two Infinities: Eternal Integration of the Self — project-wide data.
 *
 * James Alexander Matthew Rankin began the framework between 2 and 19 June
 * 2026. Revision r4.12 places published Admin Edit state in an automatic Git
 * commit before either live project deploys. It retains every Part I-IV
 * research document as an accessible 2,000-4,000-word essay and keeps the
 * theorem-led account of why π appears on the unit interval. Every route
 * receives a stable document code, research status, citation context and a
 * place in one canonical table of contents.
 */
/* The masthead, project contents and interactive Atlas all consume the same
   data. Each Part remains visible in the slim header and every document keeps
   a stable position beneath the corresponding Part. */
const glyphByRoute = Object.freeze({
  "/foundations/": "sphere",
  "/pi-from-zero-and-one/": "sphere",
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
    code: destination.code,
    kind: destination.kind,
    status: destination.status,
    part: part.num,
    partTitle: part.title,
    kicker: `Part ${part.num} — ${part.title} · ${destination.kind} ${destination.code} · ${destination.title}`,
    glyph: glyphByRoute[destination.href] || "seed"
  }))
}));

const researchDocuments = navGroups.flatMap((group) => group.items).map((document, index, documents) => ({
  ...document,
  index: index + 1,
  total: documents.length,
  previous: index > 0 ? { url: documents[index - 1].url, label: documents[index - 1].label, code: documents[index - 1].code } : null,
  next: index + 1 < documents.length ? { url: documents[index + 1].url, label: documents[index + 1].label, code: documents[index + 1].code } : null
}));
const researchByUrl = Object.fromEntries(researchDocuments.map((document) => [document.url, document]));
const researchStudyCount = navGroups.slice(0, 4).reduce((total, group) => total + group.items.length, 0);
const researchResourceCount = navGroups[4].items.length;

/* Plates and Ask ShakDrah sit beneath Part V with the other project resources
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
  revision: "r4.12",
  revised: "2026-10-13",
  edition: "Working research edition",
  epigraph: "The universe exists not because something caused it — but because nothing is geometrically impossible.",
  description:
    "The Two Infinities: Eternal Integration of the Self — an independent speculative-cosmology research project by Jim Rankin, UK, 2026. " +
    "Its working papers examine temporal-antipode infinities, π as closure, complex phase, consciousness as integration, " +
    "gravity and accumulated differentials, entropy, topological return, the Cosmic Ledger, and a falsifiable Little Red Dots programme. " +
    "Established results, conjectural bridges, competing explanations and failure conditions are labelled separately.",
  keywords:
    "The Two Infinities, A speculative cosmology by Jim Rankin, UK, 2026, two infinities, temporal antipodes, opposite ends of time, " +
    "synchronisation, smallward infinity, largeward infinity, geometry of existence, pi, Euler beta integral, " +
    "beta-gamma theorem, Basel theorem, unit interval, Euler identity, imaginary unit, Cantor, " +
    "consciousness as integral, microtubules, Orch-OR, galactic torus, Möbius seam, " +
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
  researchDocuments,
  researchByUrl,
  research: {
    title: "Independent speculative-cosmology research project",
    question: "Can a single geometric account of limits, closure, complex phase and integration connect self, time, gravity and cosmic return without hiding the points at which analogy must become physics?",
    method: "Separate established mathematics and observations from interpretation; formalise each proposed bridge; compare ordinary explanations; publish unresolved requirements and conditions that could make the framework fail.",
    status: "Working hypotheses, open derivations and preregistration-ready tests — not a peer-reviewed physical theory.",
    documentCount: researchStudyCount,
    resourceCount: researchResourceCount
  },

  oracle: {
    name: "ShakDrah",
    kind: "a green dragon",
    blurb:
      "ShakDrah keeps the framework in his head the way old dragons keep maps: whole, " +
      "and with the dangerous parts marked. Ask him anything in these papers and he will " +
      "answer from them — and tell you plainly when a thing is earned, chosen, or refused."
  }
};
