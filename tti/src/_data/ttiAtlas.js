/**
 * The five reading paths used by the interactive map on the TTI introduction.
 * `limbs` is retained as the data key because the shared atlas renderer models
 * each top-level route as a branch, whatever the site calls it in prose.
 */
const page = (num, title, href, note) => ({ num, title, href, note, topics: [] });

export default {
  limbs: [
    {
      num: "I",
      title: "First Principles",
      href: "/foundations/",
      page: false,
      note: "Begin with zero and one, then follow closure into the self, the differential and the Prime Plane.",
      topics: [],
      subs: [
        page("I·i", "Foundations", "/foundations/", "Zero, one, π, i and the first claim about why anything exists."),
        page("I·ii", "The Self", "/the-self/", "Consciousness considered as the integration of infinitesimal moments."),
        page("I·iii", "dx", "/dx/", "The differential as a completed increment rather than a disposable notation."),
        page("I·iv", "The Prime Plane", "/prime-plane/", "Base-five Prime Plane, base-eight return and base-four alternatives, kept explicitly speculative.")
      ]
    },
    {
      num: "II",
      title: "Cosmic Architecture",
      href: "/gravity/",
      page: false,
      note: "Curvature, growth and the recurring toroidal forms proposed from the differential to the galaxy.",
      topics: [],
      subs: [
        page("II·i", "Gravity", "/gravity/", "Curvature rather than force, with the limits of that claim kept visible."),
        page("II·ii", "The Spiral", "/spiral/", "The pace of becoming, triangular accumulation and the harmonic divergence."),
        page("II·iii", "The Splice", "/skeletal-splice/", "Fibonacci accumulation and the exact arithmetic beneath the proposed skeleton."),
        page("II·iv", "Torus", "/torus/", "The closed circulating form that the framework sees recurring across scales."),
        page("II·v", "Megatubule", "/megatubule/", "The galactic-scale extension of the microtubule conjecture.")
      ]
    },
    {
      num: "III",
      title: "Seams and Return",
      href: "/moebius/",
      page: false,
      note: "Inversion, temporal antipodes, entropy, residue and the account kept across a cosmic return.",
      topics: [],
      subs: [
        page("III·i", "Möbius", "/moebius/", "The one-sided seam, its mathematical neighbours and the framework's proposed identification."),
        page("III·ii", "Cosmic Ledger", "/cosmic-ledger/", "Three cosmic residues, a measurement function and the debts the conjecture must pay."),
        page("III·iii", "Seams", "/seams/", "Horizons, Hawking radiation, arrows of time and the possibility of return."),
        page("III·iv", "Entropy and Integration", "/entropy/", "Established entropies separated from TTI's speculative phases of integration."),
        page("III·v", "Temporal Antipodes", "/temporal-antipodes/", "Why finite projections may overlap while the two asymptotic endpoints share no clock."),
        page("III·vi", "Time and Residue", "/time-and-residue/", "What, if anything, can cross a closure without being smuggled through it."),
        page("III·vii", "Inverted Tori", "/inverted-toruses/", "Paired orientations and the observational signatures they would need to leave."),
        page("III·viii", "Matter and Antimatter Out of Phase", "/out-of-phase/", "A phase conjecture constrained by the fact that reversible mixing creates no net baryon number.")
      ]
    },
    {
      num: "IV",
      title: "Tests and Essays",
      href: "/stress-tests/",
      page: false,
      note: "Objections, standalone arguments and research programmes designed to let mathematics or the sky say no.",
      topics: [],
      subs: [
        page("IV·i", "Stress Tests", "/stress-tests/", "The declared failure conditions and strongest objections to the framework."),
        page("IV·ii", "Essays", "/essays/", "Standalone arguments, comparisons and explicit retractions."),
        page("IV·iii", "Two Inversions", "/double-inversion/", "Möbius return, polarized light and whether path memory can survive restored state."),
        page("IV·iv", "Accumulated Differentials", "/accumulated-differentials/", "Where exact sums meet units, covariance, conservation, mass and gravity."),
        page("IV·v", "JWST's Little Red Dots", "/little-red-dots/", "The inherited-residue conjecture stated beside ordinary astrophysical explanations."),
        page("IV·vi", "The Zero-Seam Test", "/little-red-dots/research-proposal/", "A preregistered comparison in which conventional, local-front and inherited-residue models may all lose.")
      ]
    },
    {
      num: "V",
      title: "Reading Rooms",
      href: "/plates/",
      page: false,
      note: "The visual compendium, the framework's dragon interlocutor and the reader's own standing in the site.",
      topics: [],
      subs: [
        page("V·i", "The Plates", "/plates/", "Thirty-one vector arguments gathered beneath twenty-one exclusive source headings."),
        page("V·ii", "Ask ShakDrah", "/ask-shakdrah/", "Question the framework, ask for a drawing or film, and hear one of six distinct male voices."),
        page("V·iii", "Join", "/join/", "Create or recover the small local identity used by the reading room."),
        page("V·iv", "Your Account", "/account/", "Your name, standing and local account controls once signed in.")
      ]
    }
  ]
};
