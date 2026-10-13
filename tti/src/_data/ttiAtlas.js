/**
 * The five research divisions used by the project contents, masthead and
 * interactive Atlas. `limbs` is retained because the Atlas renderer models
 * each division as a branch. This is the single source of truth for titles,
 * order, document codes and research status throughout TTI.
 */
const documentMeta = Object.freeze({
  "/foundations/": ["Concept paper", "Working hypothesis"],
  "/pi-from-zero-and-one/": ["Mathematical note", "Established derivation / speculative reading"],
  "/the-self/": ["Theoretical paper", "Working hypothesis"],
  "/dx/": ["Research note", "Working hypothesis"],
  "/prime-plane/": ["Comparative note", "Speculative model"],
  "/gravity/": ["Theory paper", "Open physical bridge"],
  "/spiral/": ["Mathematical model", "Working model"],
  "/skeletal-splice/": ["Mathematical model", "Working model"],
  "/torus/": ["Topology paper", "Comparative model"],
  "/megatubule/": ["Scale hypothesis", "Speculative model"],
  "/moebius/": ["Topology paper", "Working hypothesis"],
  "/cosmic-ledger/": ["Quantitative model", "Open calibration"],
  "/seams/": ["Synthesis paper", "Working hypothesis"],
  "/entropy/": ["Boundary paper", "Critical distinction"],
  "/temporal-antipodes/": ["Concept paper", "Working hypothesis"],
  "/time-and-residue/": ["Philosophy paper", "Speculative model"],
  "/inverted-toruses/": ["Topology paper", "Speculative model"],
  "/wormholes/": ["Constraint paper", "Comparative analysis"],
  "/out-of-phase/": ["Phase hypothesis", "Speculative model"],
  "/stress-tests/": ["Falsification paper", "Active programme"],
  "/essays/": ["Collected essays", "Research context"],
  "/double-inversion/": ["Comparative paper", "Open question"],
  "/accumulated-differentials/": ["Bridge paper", "Open derivation"],
  "/little-red-dots/": ["Observational hypothesis", "Competing models"],
  "/little-red-dots/research-proposal/": ["Research protocol", "Preregistration draft"],
  "/plates/": ["Figure compendium", "Project resource"],
  "/ask-shakdrah/": ["Research assistant", "Project resource"],
  "/join/": ["Reader service", "Project resource"],
  "/account/": ["Reader service", "Project resource"]
});

const lowerRomanOrder = Object.freeze({ i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 });

const page = (num, title, href, note) => {
  const [part, item = "i"] = num.split("·");
  const sequence = lowerRomanOrder[item] || 1;
  const [kind, status] = documentMeta[href] || ["Research document", "Working edition"];
  return {
    num,
    code: `TTI-${part}.${String(sequence).padStart(2, "0")}`,
    title,
    href,
    note,
    kind,
    status,
    topics: []
  };
};

export default {
  limbs: [
    {
      num: "I",
      title: "First Principles",
      href: "/foundations/",
      page: false,
      note: "Defines the project’s boundary conditions, mathematical vocabulary and conjectural account of the integrating self.",
      topics: [],
      subs: [
        page("I·i", "Foundations", "/foundations/", "Research question: can limit asymmetry, closure through π and complex phase form a coherent starting chain?"),
        page("I·ii", "π from 0 and 1", "/pi-from-zero-and-one/", "Uses Euler’s beta-integral theorem, circular arc measure and the Basel theorem to separate an exact unit-interval result from TTI’s speculative interpretation."),
        page("I·iii", "The Self", "/the-self/", "Tests the proposal that consciousness is an integration of differential moments into a bounded first-person history."),
        page("I·iv", "dx", "/dx/", "Examines whether the differential can be interpreted as a completed increment without confusing notation with ontology."),
        page("I·v", "The Prime Plane", "/prime-plane/", "Compares base-five, base-eight and base-four phase models while keeping every physical promotion explicitly speculative.")
      ]
    },
    {
      num: "II",
      title: "Cosmic Architecture",
      href: "/gravity/",
      page: false,
      note: "Develops the project’s geometric models of curvature, accumulation, recurrence and scale, and records where analogy stops.",
      topics: [],
      subs: [
        page("II·i", "Gravity", "/gravity/", "Separates established spacetime curvature from TTI’s unproved proposal that accumulated integration can source mass."),
        page("II·ii", "The Spiral", "/spiral/", "Studies triangular accumulation, harmonic timing and Fibonacci growth as candidate descriptions of becoming."),
        page("II·iii", "The Splice", "/skeletal-splice/", "Sets out the exact arithmetic of the Skeletal Splice before considering any cosmological interpretation."),
        page("II·iv", "Torus", "/torus/", "Compares the torus as a topology of return across physical systems and the framework’s larger recurrence claim."),
        page("II·v", "Megatubule", "/megatubule/", "Assesses the proposed extension from biological microtubules to a galactic-scale integrating structure.")
      ]
    },
    {
      num: "III",
      title: "Seams and Return",
      href: "/moebius/",
      page: false,
      note: "Investigates orientation, entropy, temporal boundaries, return and residue under mathematical and physical constraints.",
      topics: [],
      subs: [
        page("III·i", "Möbius", "/moebius/", "Distinguishes established one-sided topology from the project’s proposed physical seam and inversion mechanisms."),
        page("III·ii", "Cosmic Ledger", "/cosmic-ledger/", "Defines the three-residue measurement ansatz and lists the calibration, conservation and field-equation debts it inherits."),
        page("III·iii", "Seams", "/seams/", "Compares horizons, Hawking radiation, arrows of time and recurrence without treating them as interchangeable boundaries."),
        page("III·iv", "Entropy and Integration", "/entropy/", "Separates thermodynamic, statistical and informational entropy from TTI’s conjectural integration phases."),
        page("III·v", "Temporal Antipodes", "/temporal-antipodes/", "Asks whether opposite asymptotic endpoints can share finite projections without sharing a synchronised clock."),
        page("III·vi", "Time and Residue", "/time-and-residue/", "Specifies what information, if any, could cross a closure and what carrier such a claim would require."),
        page("III·vii", "Inverted-Torus Universe", "/inverted-toruses/", "Constructs a globally twisted torus-bundle model and records its orientation and observational requirements."),
        page("III·viii", "Wormholes and Inverted Tori", "/wormholes/", "Compares global torus inversion with a local spacetime throat under energy, stability and causality constraints."),
        page("III·ix", "Matter and Antimatter Out of Phase", "/out-of-phase/", "Tests a phase-sector conjecture against the requirement that reversible mixing cannot create net baryon number.")
      ]
    },
    {
      num: "IV",
      title: "Tests and Essays",
      href: "/stress-tests/",
      page: false,
      note: "Turns the framework into objections, discriminating observations, competing models and research protocols that can fail.",
      topics: [],
      subs: [
        page("IV·i", "Stress Tests", "/stress-tests/", "Collects the framework’s declared failure conditions, strongest objections and unresolved physical bridges."),
        page("IV·ii", "Essays", "/essays/", "Provides eleven standalone arguments and historical comparisons, including explicit limits and retractions."),
        page("IV·iii", "Two Inversions", "/double-inversion/", "Compares Möbius frame return with optical polarization and asks what could retain path memory after an exact involution."),
        page("IV·iv", "Accumulated Differentials", "/accumulated-differentials/", "Carries exact sums to the point where units, covariance, conservation and stress–energy must be supplied."),
        page("IV·v", "JWST’s Little Red Dots", "/little-red-dots/", "Places the inherited-residue conjecture beside conventional compact-source and obscured-accretion explanations."),
        page("IV·vi", "The Zero-Seam Test", "/little-red-dots/research-proposal/", "Defines a staged, preregistration-ready comparison in which conventional, local-front and inherited-residue models may all lose.")
      ]
    },
    {
      num: "V",
      title: "Reading Rooms",
      href: "/plates/",
      page: false,
      note: "Provides the figures, question interface and reader services that support inspection of the research corpus.",
      topics: [],
      subs: [
        page("V·i", "The Plates", "/plates/", "Indexes thirty-three vector arguments beneath twenty-three exclusive source headings with links back to their papers."),
        page("V·ii", "Ask ShakDrah", "/ask-shakdrah/", "Queries the project corpus, creates drawings or films and can read answers in six distinct local voices."),
        page("V·iii", "Join", "/join/", "Creates or recovers the local reader identity used by the research rooms."),
        page("V·iv", "Your Account", "/account/", "Manages the reader’s local name, standing and account controls.")
      ]
    }
  ]
};
