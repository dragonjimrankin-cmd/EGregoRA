import ttiAtlas from "./ttiAtlas.js";

/**
 * The Two Infinities: Eternal Integration of the Self — project-wide data.
 *
 * James Alexander Matthew Rankin began the framework between 2 and 19 June
 * 2026. Revision r6.0 reorganises the public site around the framework's three
 * fundamental conjectural structures: eternal integration, the Rankin Skeletal
 * Splice, and Part III's seams and return. The complete six-Part corpus remains
 * available in a separate research archive, together with the Atlas, Plates,
 * Oracle, long-form syntheses and correction records. Every document keeps its
 * stable code, evidence boundary and canonical place in the archive.
 */
/* The masthead archive, canonical contents and interactive Atlas all consume
   the same data. Three conjectures lead the public rail; every Part and every
   document keeps a stable position inside the complete archive. */
const glyphByRoute = Object.freeze({
  "/foundations/": "sphere",
  "/pi-from-zero-and-one/": "sphere",
  "/the-self/": "integral",
  "/dx/": "integral",
  "/prime-plane/": "star",
  "/entropy-and-self-renewal/": "integral",
  "/cosmic-ratio-in-time/": "ledger",
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
  "/riemann-programme/": "integral",
  "/riemann-proof-audit/": "eye",
  "/riemann-splice-questions/": "spiral",
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
const resourceGroup = navGroups.find((group) => group.part === "V");
const researchStudyCount = navGroups
  .filter((group) => group.part !== "V")
  .reduce((total, group) => total + group.items.length, 0);
const researchResourceCount = resourceGroup ? resourceGroup.items.length : 0;

/* Plates and Ask ShakDrah sit beneath Part V with the other project resources
   instead of being duplicated as detached actions beside the six Parts. */
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
  revision: "r6.0",
  revised: "2026-10-14",
  edition: "Fundamental conjectures edition",
  epigraph: "The universe exists not because something caused it — but because nothing is geometrically impossible.",
  description:
    "The Two Infinities: Eternal Integration of the Self — an independent speculative-cosmology research project by Jim Rankin, UK, 2026. " +
    "Its working papers examine temporal-antipode infinities, π as closure, complex phase, consciousness as integration, " +
    "gravity and accumulated differentials, entropy, topological return, the Cosmic Ledger, a falsifiable Little Red Dots programme, " +
    "and a correction-aware Riemann Hypothesis research dossier. Established results, conditional formulae, numerical evidence, " +
    "conjectural bridges, competing explanations and failure conditions are labelled separately.",
  keywords:
    "The Two Infinities, A speculative cosmology by Jim Rankin, UK, 2026, two infinities, temporal antipodes, opposite ends of time, " +
    "synchronisation, smallward infinity, largeward infinity, geometry of existence, pi, Euler beta integral, " +
    "beta-gamma theorem, Basel theorem, unit interval, Euler identity, imaginary unit, Cantor, " +
    "consciousness as integral, self-renewal, integration turnover, entropy production, microtubules, Orch-OR, galactic torus, Möbius seam, " +
    "Klein bottle, double inversion, light polarization, geometric phase, entropy, accumulated differentials, mass, gravity, cosmic ratio, sector exchange, cosmic ledger, chi field, dark matter, dark energy, JWST little red dots, inherited residue, " +
    "zero seam, previous universe conjecture, preregistered research, flat rotation curves, CMB, Fibonacci splice, " +
    "Riemann Hypothesis, Riemann xi function, Polya kernel, Weil criterion, proof audit, identity gap, " +
    "golden ratio, triangular numbers, arrow of time, Hawking radiation, astronomy, cosmology",
  ogImage: "/assets/img/og-two-infinities.jpg",
  ogImageAlt: "A luminous torus of stars, with a spiral climbing from a bright centre",
  motto: "Nothing is geometrically impossible.",
  focusAreas: [
    {
      key: "integration",
      numeral: "I",
      eyebrow: "First principle",
      label: "Eternal Integration",
      url: "/foundations/",
      note: "Why the framework proposes that selfhood persists by integrating, differentiating and integrating again rather than terminating at a final state.",
      equation: "I_{n+1}=\\mathcal{R}(I_n,D_n)",
      links: [
        { label: "Foundations", url: "/foundations/" },
        { label: "The self that integrates", url: "/the-self/" },
        { label: "Entropy and self-disintegration", url: "/entropy-and-self-renewal/" },
        { label: "Cosmic ratios through time", url: "/cosmic-ratio-in-time/" }
      ]
    },
    {
      key: "splice",
      numeral: "II",
      eyebrow: "Generative mechanism",
      label: "The Rankin Skeletal Splice",
      url: "/skeletal-splice/",
      note: "The proposed fork at each density threshold: one branch continues, one returns, while the fixed skeleton of minus one, nought and one supplies the frame.",
      equation: "P_n=F_{n+2}-1",
      links: [
        { label: "The Rankin Skeletal Splice", url: "/skeletal-splice/" },
        { label: "Recursive spiral", url: "/spiral/" },
        { label: "The Prime Plane", url: "/prime-plane/" },
        { label: "Riemann Programme", url: "/riemann-programme/" }
      ]
    },
    {
      key: "return",
      numeral: "III",
      eyebrow: "Topology of return",
      label: "Seams and Return",
      url: "/seams/",
      note: "How Möbius seams, temporal antipodes, residue, inverted toruses and wormhole analogies are used to imagine return without a terminal edge.",
      equation: "(x,0)\\sim(1-x,1)",
      links: [
        { label: "Seams and Return", url: "/seams/" },
        { label: "The Möbius Bridge", url: "/moebius/" },
        { label: "Temporal antipodes", url: "/temporal-antipodes/" },
        { label: "Time and residue", url: "/time-and-residue/" }
      ]
    }
  ],

  /* The complete six-Part corpus now lives in the Research Archive while
     `nav` remains the complete flat list for the footer and audits. */
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
