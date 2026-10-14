/**
 * Site-wide clarity layer for the TTI research corpus.
 *
 * Every guide answers the same four questions in prose: what is being argued,
 * what established work can legitimately support it, where the inference stops,
 * and what a critical reader should ask next. External sources are bearings,
 * not borrowed authority: none of them endorses TTI's speculative bridges.
 */

const sources = Object.freeze({
  infinity: {
    title: "Infinity",
    publisher: "Stanford Encyclopedia of Philosophy",
    url: "https://plato.stanford.edu/entries/infinity/",
    note: "Cantorian infinity, mathematical ontology, and the distinction between mathematical and physical infinity."
  },
  complexExperiment: {
    title: "Quantum theory based on real numbers can be experimentally falsified",
    publisher: "Nature 600 (2021)",
    url: "https://www.nature.com/articles/s41586-021-04160-4",
    note: "The influential network experiment separating complex quantum theory from one specifically defined real-amplitude foil."
  },
  complexDebate: {
    title: "On whether quantum theory needs complex numbers: the foil theories perspective",
    publisher: "arXiv (2025 preprint)",
    url: "https://arxiv.org/abs/2506.08091",
    note: "Why the experimental result depends on how the rival real theory and its composition rule are defined."
  },
  consciousness: {
    title: "The Neuroscience of Consciousness",
    publisher: "Stanford Encyclopedia of Philosophy",
    url: "https://plato.stanford.edu/entries/consciousness-neuroscience/",
    note: "A comparative account of global-workspace, recurrent-processing, higher-order and integrated-information approaches."
  },
  quantumConsciousness: {
    title: "Quantum Approaches to Consciousness",
    publisher: "Stanford Encyclopedia of Philosophy",
    url: "https://plato.stanford.edu/entries/qt-consciousness/",
    note: "The Penrose–Hameroff proposal, its microtubule mechanism, and the physical questions that remain unresolved."
  },
  entropy: {
    title: "Information Processing and Thermodynamic Entropy",
    publisher: "Stanford Encyclopedia of Philosophy",
    url: "https://plato.stanford.edu/entries/information-entropy/",
    note: "The distinctions among thermodynamic, statistical and informational entropy, including Landauer's principle."
  },
  gravity: {
    title: "Einstein's geometric gravity",
    publisher: "Einstein Online · Max Planck Institute for Gravitational Physics",
    url: "https://www.einstein-online.info/en/GeomGravity/",
    note: "An accessible account of gravity as spacetime geometry and free motion along geodesics."
  },
  quantumGravity: {
    title: "The need for quantum gravity",
    publisher: "Einstein Online · Max Planck Institute for Gravitational Physics",
    url: "https://www.einstein-online.info/en/border_regions/",
    note: "Why general relativity and quantum theory must both matter at extreme curvature and microscopic scales."
  },
  waves: {
    title: "Observation of Gravitational Waves from a Binary Black Hole Merger",
    publisher: "Einstein Online · Max Planck Institute for Gravitational Physics",
    url: "https://www.einstein-online.info/en/spotlight/observation-of-gravitational-waves-from-a-binary-black-hole-merger/",
    note: "What LIGO measured and how waveform models turn strain data into a test of general relativity."
  },
  planck: {
    title: "Planck 2018 results VI: Cosmological parameters",
    publisher: "Astronomy & Astrophysics 641, A6",
    url: "https://www.aanda.org/articles/aa/full_html/2020/09/aa33910-18/aa33910-18.html",
    note: "The model-dependent ΛCDM fit behind the familiar present-epoch cosmic density fractions."
  },
  darkMatter: {
    title: "Dark Matter",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/dark-matter/",
    note: "Observational evidence from dynamics, lensing and structure, alongside the still-open question of composition."
  },
  darkEnergy: {
    title: "Dark Energy",
    publisher: "NASA Science",
    url: "https://science.nasa.gov/dark-energy/",
    note: "The evidence for accelerated expansion and the major live classes of explanation."
  },
  topology: {
    title: "Computational Topology: Surface Topology",
    publisher: "Stanford University",
    url: "https://graphics.stanford.edu/courses/cs468-02-fall/notes/02.pdf",
    note: "The torus, Möbius band, orientability and gluing rules as precise mathematical objects."
  },
  horizon: {
    title: "Horizon",
    publisher: "Einstein Online · Max Planck Institute for Gravitational Physics",
    url: "https://www.einstein-online.info/en/explandict/horizon/",
    note: "The event horizon as a causal boundary, not a material membrane or generic synonym for every seam."
  },
  wormholes: {
    title: "Humanly traversable wormholes",
    publisher: "Physical Review D 103, 066007 (2021)",
    url: "https://link.aps.org/doi/10.1103/PhysRevD.103.066007",
    note: "A concrete theoretical construction that makes its negative-energy, beyond-Standard-Model and stability assumptions explicit."
  },
  lrd: {
    title: "Overmassive black holes and little red dots naturally form in simulations",
    publisher: "Nature 657 (2026)",
    url: "https://www.nature.com/articles/s41586-026-10985-8",
    note: "A conventional heavy-seed and rapid-accretion pathway that reproduces little-red-dot-like sources."
  },
  rh: {
    title: "Riemann Hypothesis",
    publisher: "Clay Mathematics Institute",
    url: "https://www.claymath.org/millennium/riemann-hypothesis/",
    note: "The official statement of the unresolved problem and its connection to fluctuations in the distribution of primes."
  }
});

const from = (...keys) => keys.map((key) => sources[key]);
const guide = (question, argument, evidence, limit, prompt, sourceKeys) => ({
  question,
  argument,
  evidence,
  limit,
  prompt,
  sources: from(...sourceKeys)
});

export default Object.freeze({
  "/foundations/": guide(
    "Can a contrast between nothing and unity become a disciplined starting point for a cosmology?",
    "TTI proposes a chain of dependence: boundaries make distinction possible; a chosen geometry supplies closure; complex phase then supplies a richer space of relations. The page is strongest when read as a conditional construction—if those starting premises are granted, later steps can be inspected one by one—not as a proof that nature had no alternative.",
    "Cantor's work establishes that the natural numbers and the real unit interval have different cardinalities. Quantum theory is conventionally formulated over complex Hilbert spaces. Neither fact, by itself, assigns the two infinities to time, turns π into a cause, or identifies a wavefunction with matter.",
    "The mathematical statements are real results; the ontological meanings attached to 0, 1, π and i are TTI's proposal. Current debate also shows that experiments distinguish standard complex quantum theory from particular real-amplitude rivals, not from every possible reformulation using real arithmetic.",
    "Which declared premise does the most work: the meaning of the endpoints, the demand for closure, or the promotion from mathematics to physics?",
    ["infinity", "complexExperiment", "complexDebate"]
  ),
  "/pi-from-zero-and-one/": guide(
    "What, exactly, can be proved about π using only a unit interval?",
    "The page gives an exact route from an integral over 0 < x < 1 to π, then asks whether circular closure deserves an ontological role in TTI. This is not a claim that the decimal symbols 0 and 1 secretly contain π. It is a claim that once a Euclidean metric and circular closure are chosen, π is forced by the geometry.",
    "Euler's beta integral, semicircle area and the Basel problem provide independent mathematical appearances of π. Their agreement is powerful internal checking. It does not select Euclidean circular closure as the geometry of the physical universe.",
    "The theorem ends where the physical interpretation begins. A different metric, topology or closure rule would change the construction; no theorem on this page makes π a causal agent.",
    "Can the framework justify its closure rule without assuming the circular geometry whose appearance it celebrates?",
    ["infinity", "topology"]
  ),
  "/the-self/": guide(
    "Is a self best understood as a substance, or as a continuing act of integration?",
    "TTI treats the self as the process that binds changing sensations, memories and intentions into a history experienced as one life. The proposal shifts the question from finding an unchanging inner object to explaining how continuity is maintained while almost every constituent changes.",
    "Contemporary consciousness research takes integration, global availability, recurrent processing and higher-order representation seriously, but no consensus theory identifies integration alone as sufficient for consciousness. Personal continuity also remains a philosophical problem, not a quantity read directly from a brain scan.",
    "The page offers a metaphysical model of first-person unity. It does not derive subjective experience from an equation, prove survival beyond biological function, or show that every integrated system is conscious.",
    "What observation would distinguish TTI's integrating self from an ordinary neural system that combines information without possessing the proposed deeper continuity?",
    ["consciousness", "quantumConsciousness"]
  ),
  "/dx/": guide(
    "Can the differential dx be read as more than notation without confusing mathematics with ontology?",
    "The page uses the differential as a disciplined image of a change small enough to be local yet real enough to accumulate. TTI then asks whether persistence might consist of such increments being continuously taken up into a larger history.",
    "Calculus rigorously defines derivatives, differentials and integrals through limits and related structures. Those tools describe change with extraordinary success. They do not say that reality is literally made of infinitesimal pieces or that an integral is automatically a conscious act.",
    "The ontological reading is optional and must earn physical content through variables, units and dynamics. A metaphor becomes a model only when it predicts something that standard calculus plus established physics does not already predict.",
    "If dx names a physical increment, what carries it, what are its units, and what conservation law governs its accumulation?",
    ["infinity", "gravity"]
  ),
  "/prime-plane/": guide(
    "Do prime counts or preferred numerical bases reveal a physical phase architecture?",
    "TTI compares several base-dependent ways of arranging primes and phase sectors, using base ten as an internally motivated representation rather than pretending that notation is irrelevant. The useful question is whether any pattern survives a change of representation strongly enough to deserve physical attention.",
    "Prime numbers and residue classes have exact arithmetic structure. A visual pattern in base five, eight, ten or another base can be mathematically correct while remaining a consequence of the chosen encoding.",
    "No base comparison on this page proves a particle family, force, dimension or cosmic sector. A physical promotion would require an invariant construction and a measurable quantity whose value does not depend on how humans write integers.",
    "Which feature is invariant under a change of base, and what experiment would measure that invariant rather than the diagram?",
    ["infinity", "rh"]
  ),
  "/entropy-and-self-renewal/": guide(
    "Could the work of repeatedly rebuilding a self be one source of entropy production?",
    "The proposal is not that consciousness violates thermodynamics. It is that a persistent organised system may remain coherent only by replacing components, correcting errors and exporting waste. Integration can rise locally while total entropy still increases because maintenance has a cost.",
    "Living systems are open systems: they preserve organisation by consuming free energy and releasing heat and waste. Landauer's principle gives a precise lower bound for logically irreversible erasure, but it does not establish a universal price for every act of memory, identity or consciousness.",
    "TTI has not yet derived an entropy-production term uniquely associated with self-renewal. The bridge remains qualitative until a state variable, control volume and measurable excess above ordinary metabolism are defined.",
    "What would be measured differently in two equally active systems if one performed the proposed integration and the other did not?",
    ["entropy", "consciousness"]
  ),
  "/cosmic-ratio-in-time/": guide(
    "Is 5:27:68 a timeless architecture, or a present-epoch description that changes with cosmic history?",
    "The page corrects a static reading of the famous cosmic pie chart. TTI may interpret baryonic matter, dark matter and dark energy as stages of integration, but it must first respect the standard fact that their density fractions evolve differently as the universe expands.",
    "Planck's familiar fractions are model-dependent inferences within base ΛCDM, not three substances weighed directly. Matter density dilutes with expansion while a cosmological constant remains approximately constant per unit volume, so the fractions change even without any conversion between sectors.",
    "A changing ratio is not evidence that one sector turns into another. Exchange, reversal or cyclic swapping requires continuity equations with explicit interaction terms and observations that outperform the non-interacting model.",
    "What redshift-dependent curve does TTI predict that differs from ordinary ΛCDM dilution without adding a freely fitted exchange function?",
    ["planck", "darkMatter", "darkEnergy"]
  ),
  "/gravity/": guide(
    "Can TTI add a testable completion model to gravity without merely renaming spacetime curvature?",
    "The page starts from general relativity's geometric account and proposes that dark energy, dark matter and baryonic matter represent baseline, partial and completed integration. That ordering is an interpretive hypothesis; it becomes physics only if one set of dynamics reproduces expansion, lensing, structure growth and local gravity.",
    "General relativity relates spacetime curvature to stress-energy. Dark matter is inferred through several independent gravitational effects, and the present density budget is inferred by fitting cosmological models to data. None of this establishes a π-level or i-level.",
    "TTI does not yet derive the observed fractions, a covariant stress-energy tensor or a unique halo profile. Nor is gravity's resistance to quantisation evidence that gravity sits 'before' complex phase; quantum gravity remains required where both quantum effects and strong curvature matter.",
    "What single field equation could produce the same mass profile for dynamics and lensing while also matching early structure formation?",
    ["gravity", "quantumGravity", "planck", "darkMatter"]
  ),
  "/spiral/": guide(
    "When does a recurring spiral become an explanation rather than a visual rhyme?",
    "TTI reads spirals as records of accumulation: each turn inherits a previous radius while adding displacement, so repetition and novelty coexist. The page compares triangular, harmonic and Fibonacci constructions to ask which mechanism, if any, can generate that combination across scales.",
    "Spiral forms arise through many established mechanisms—orbital precession, density waves, differential growth, angular momentum and optimisation among them. Similar shape does not imply identical cause.",
    "A numerical resemblance earns physical meaning only when the variables, scale law and dynamics are fixed before the fit. The framework must not select a spiral after seeing the object and call the match a prediction.",
    "Which dimensionless relation stays constant across the proposed systems, and what ordinary mechanism is it expected to beat?",
    ["gravity", "topology"]
  ),
  "/skeletal-splice/": guide(
    "Does the Skeletal Splice supply physical coefficients, or only an exact arithmetic scaffold?",
    "The Splice organises triangular and Fibonacci-related sequences into a repeatable arithmetic construction. Its legitimate achievement is internal: readers can reproduce the steps, test identities and locate where choices enter. TTI then asks whether the pattern can constrain a physical model.",
    "Exact integer identities remain exact regardless of their interpretation. Physics adds further requirements: dimensions, covariance, conservation, a state space and a derivation connecting the integers to measured quantities.",
    "A close numerical match is not a mechanism, especially when normalisations or index choices were selected after comparison. The Splice has not yet derived Newton's constant, the fine-structure constant, a halo radius or a cosmological abundance.",
    "Which coefficient follows before observational input, with units and uncertainty fixed, and could therefore be wrong?",
    ["rh", "gravity"]
  ),
  "/torus/": guide(
    "What does toroidal return explain, and what remains only an analogy?",
    "A torus provides a precise way for motion to continue without meeting an edge: one or more directions wrap around. TTI uses that geometry to imagine recurrence that preserves continuity while allowing many local paths.",
    "Tori occur rigorously in topology and physically in systems whose boundary conditions or dynamics support them. Their appearance in magnetic confinement, fluid vortices or mathematical phase spaces does not show that the universe as a whole has toroidal topology.",
    "Global cosmic topology is an empirical question. The framework still owes an embedding or metric, causal structure and observational signatures such as constrained repeated patterns—not just a familiar doughnut-shaped illustration.",
    "What observation would distinguish a genuinely toroidal universe from a simply connected universe containing local toroidal structures?",
    ["topology", "infinity"]
  ),
  "/megatubule/": guide(
    "Can a biological microtubule inspire a cosmic model without being scaled up by metaphor alone?",
    "The megatubule is a scale hypothesis: a proposal that nested cylindrical organisation might support transport and integration at both neural and galactic scales. Its value is as a generator of questions about channels, coherence and boundary conditions.",
    "Microtubules are cellular structures with established mechanical and transport roles. Quantum-consciousness accounts involving them remain disputed and require mechanisms that survive biological noise. Galaxies, by contrast, are governed on large scales by gravity, gas dynamics, magnetic fields and dark-matter structure.",
    "Shared shape is not shared physics. The cosmic proposal needs a defined field, a scaling rule and observations not already explained by galactic dynamics; it cannot inherit biological function merely from cylindrical resemblance.",
    "What quantity is conserved across the proposed scale change, and why should its governing equation remain valid over more than twenty orders of magnitude?",
    ["quantumConsciousness", "gravity", "darkMatter"]
  ),
  "/moebius/": guide(
    "Could orientation reversal be physically consequential without being confused with time reversal?",
    "TTI uses the Möbius band as a disciplined model of return with changed handedness: after one circuit a local frame is reversed, and after two it is restored. The physical proposal is that some cosmic seam may act analogously on states transported around it.",
    "A Möbius band is mathematically non-orientable, and its gluing rule is exact. That fact alone says nothing about antimatter, temporal direction, entropy, or the topology of spacetime.",
    "To promote the seam into physics, the page must specify what state is transported, the connection governing transport, which observable changes sign, and how a laboratory or astronomical measurement differs from ordinary geometric phase.",
    "What measurable object returns reversed after one circuit, and what prevents an ordinary gauge choice from removing the apparent reversal?",
    ["topology", "gravity"]
  ),
  "/cosmic-ledger/": guide(
    "Can the Ledger turn TTI's three-stage picture into a quantitatively accountable model?",
    "The Ledger is where poetic correspondences are required to become bookkeeping. It assigns variables to baseline, partial and completed integration and asks how they contribute to expansion, mass profiles and conserved totals.",
    "Modern cosmology already links parameters to multiple data sets: microwave-background anisotropies, lensing, clustering, supernova distances and structure growth. A rival ledger must fit these jointly rather than explaining one curve at a time.",
    "The current χ profiles and residue terms are ansätze, not consequences of an action or field equation. Calibration after observing each target would make the model descriptive but not predictive.",
    "Can one parameter set survive galaxies, clusters, lensing and expansion without target-specific redefinition?",
    ["planck", "darkMatter", "darkEnergy", "gravity"]
  ),
  "/seams/": guide(
    "Are horizons, thermodynamic arrows and topological seams instances of one boundary, or importantly different things?",
    "The page compares boundaries to expose both common structure and category errors. TTI's productive intuition is that limits organise what can cross, return or be remembered; its discipline is to keep causal, topological and thermodynamic limits distinct.",
    "An event horizon is a causal boundary in spacetime. An entropy gradient describes statistical direction. A Möbius seam is a topological identification. Each has different mathematics and none can substitute for another without an explicit bridge.",
    "Calling all three 'seams' is a research vocabulary, not a unification. A successful synthesis must derive a shared invariant or demonstrate a transfer law that respects each domain's established constraints.",
    "What operation is genuinely common to all proposed seams, rather than merely describable with the same metaphor?",
    ["horizon", "entropy", "topology"]
  ),
  "/entropy/": guide(
    "Can integration and entropy be related without treating order and disorder as simple opposites?",
    "TTI proposes phases in which local organisation is assembled, maintained and released. The useful version of the claim is compatible with the second law: a subsystem can become more organised while producing greater entropy in its surroundings.",
    "Thermodynamic entropy, Boltzmann or Gibbs entropy and Shannon information answer related but non-identical questions. Landauer's result concerns logically irreversible erasure under specified physical conditions; it is not a licence to equate every loss of meaning with heat.",
    "No scalar 'integration' measure on this page has yet been shown to enter a thermodynamic state equation. The arrow of time cannot be derived from a verbal contrast between integration and disintegration.",
    "What state variables make integration measurable, and how do they enter an entropy balance for a clearly bounded system?",
    ["entropy", "consciousness"]
  ),
  "/temporal-antipodes/": guide(
    "Can two asymptotic limits orient time without becoming clocks that can be synchronised?",
    "TTI places smallward and largeward limits at opposite ends of a compactified temporal description. The conditional claim is modest but precise: if the endpoints are not physically identified and no transport law joins them, they cannot share an operational clock even when finite projections overlap.",
    "Compactification is a standard mathematical technique, and relativity requires a protocol when distant clocks are compared. Drawing infinite limits at finite positions changes coordinates; it does not create signals or simultaneity.",
    "The temporal assignment is a TTI postulate, not a consequence of Cantor's theorem. A physical version still needs states, a causal transport rule and a finite observable distinguishable from ordinary redshift, delay and time dilation.",
    "What finite measurement retains information about the proposed endpoints after every standard relativistic effect has been modelled?",
    ["infinity", "gravity"]
  ),
  "/time-and-residue/": guide(
    "What could survive a cosmic closure, and what would 'survival' have to mean physically?",
    "The page separates three possibilities often blurred together: a later state may resemble an earlier one, may be statistically constrained by it, or may literally receive transferable information from it. TTI's residue claim concerns the strongest case and therefore inherits the greatest burden.",
    "Physics permits correlations and conserved quantities to persist through many transformations. Information transfer nevertheless requires a carrier, a channel, a mapping between state spaces and a causal account of how the channel operates.",
    "Similarity, memory and transmission are not synonyms. Personal testimony and visionary material can motivate a question but cannot establish a cosmological carrier or conservation law.",
    "What encoded distinction crosses the seam, through which degree of freedom, and how could a later observer tell transmission from coincidence or shared dynamics?",
    ["entropy", "horizon", "consciousness"]
  ),
  "/inverted-toruses/": guide(
    "Can a globally twisted torus model return with reversed orientation while preserving a coherent spacetime?",
    "The construction combines recurrence with a twist, producing a mapping-torus-style model in which a transported frame may return transformed. TTI explores whether this can formalise inversion more carefully than a picture of a torus turning inside out.",
    "Topology allows precise quotient spaces and orientation-changing identifications. A physically admissible spacetime must additionally carry a metric, causal structure, suitable matter content and globally consistent fields.",
    "A topological identification is not automatically a dynamical event. The current model has not shown that the universe has this topology or that such a twist creates matter, reverses time, or transmits residue.",
    "Can the proposed identification support ordinary local physics everywhere and yield a unique observable global signature?",
    ["topology", "gravity", "infinity"]
  ),
  "/wormholes/": guide(
    "Is an inverted torus a wormhole, or are global identification and local traversable throat fundamentally different claims?",
    "The page's central service is a refusal: a toroidal or twisted global topology does not become a traversable wormhole merely because both involve return. A wormhole is a spacetime geometry with a throat and causal path; an inverted torus is a global identification unless further metric structure is supplied.",
    "General relativity admits wormhole geometries, but classical traversability typically requires violations of averaged or null energy conditions. Concrete quantum or higher-dimensional models state exceptional assumptions and face severe stability constraints.",
    "TTI has not produced a throat metric, stress-energy source, stability analysis or observational signature. Until it does, 'wormhole' is a comparison target, not the name of an achieved result.",
    "What metric and stress-energy tensor keep the proposed throat open, and what observation distinguishes it from a compact object or lens?",
    ["wormholes", "gravity", "horizon"]
  ),
  "/out-of-phase/": guide(
    "Could matter and antimatter occupy phase-related sectors without violating known conservation constraints?",
    "TTI asks whether apparent separation might be represented as a phase offset rather than a spatial partition. The mathematically useful part is the distinction between an isolated phase coincidence and sustained phase locking.",
    "Quantum fields use complex phases, and matter–antimatter asymmetry is a measured fact requiring a dynamical account. Reversible phase evolution alone cannot generate a net conserved charge from a symmetric initial state.",
    "The proposal does not yet provide baryon-number violation, CP asymmetry, departure from equilibrium or another accepted route to baryogenesis. Nor does a phase diagram place real antimatter beyond a topological seam.",
    "Which interaction turns the proposed phase relation into a quantitative asymmetry while preserving every conservation law that should remain intact?",
    ["complexExperiment", "complexDebate", "gravity"]
  ),
  "/stress-tests/": guide(
    "What would make TTI change its mind?",
    "This page converts attractive images into liabilities the framework must accept. A serious stress test identifies a rival explanation, freezes a discriminating prediction before the result is known and states what outcome would count against TTI.",
    "Established theories earn trust by surviving linked tests with shared parameters. General relativity predicts orbit precession, light bending and gravitational waves from one framework; ΛCDM connects expansion and structure data. TTI should be judged by the same logic, not by isolated resemblance.",
    "A test is not risky if every outcome can be re-described as another kind of integration. Unspecified corrections, source-by-source phase offsets and post-hoc profile choices must count as losses rather than escapes.",
    "Which proposed observation has the largest likelihood ratio between TTI and its strongest conventional rival, using parameters fixed in advance?",
    ["gravity", "waves", "planck", "lrd"]
  ),
  "/essays/": guide(
    "How should the project's philosophical essays be read alongside its technical claims?",
    "The essays give TTI room to explore consequences, histories and metaphors without pretending that every suggestive connection is a derivation. Their task is to make assumptions visible and sharpen questions that the formal papers can later accept or reject.",
    "Philosophical argument can clarify concepts such as infinity, identity, explanation and necessity. It cannot substitute for empirical support when a claim concerns fields, particles, cosmic history or measurable dynamics.",
    "A memorable sentence may organise thought while remaining false as physics. Readers should carry each essay's conclusion back to the evidence ledger before treating it as part of the model.",
    "After removing the metaphor, what proposition remains, and what kind of evidence could make that proposition more or less credible?",
    ["infinity", "consciousness", "entropy"]
  ),
  "/double-inversion/": guide(
    "If two inversions restore orientation, can any trace of the path remain?",
    "The page compares an exact involution—apply a reversal twice and recover the starting orientation—with physical systems that can accumulate phase or hysteresis along a closed path. TTI's question is whether return of the visible state can coexist with retained path information.",
    "Topology and linear algebra distinguish an operation's endpoint from the route used to implement it. Geometric phase, dissipation and environmental coupling can leave measurable traces even when a selected coordinate returns.",
    "Path memory is not guaranteed by the word 'inversion'. It requires a connection, non-commuting operations, hysteresis or another explicit mechanism; otherwise two exact reversals simply cancel.",
    "Which gauge-invariant observable records the route after the orientation has returned, and what null experiment shows that the effect is not ordinary dissipation?",
    ["topology", "complexExperiment", "entropy"]
  ),
  "/accumulated-differentials/": guide(
    "Can repeated microscopic differences source macroscopic mass or gravity?",
    "TTI proposes that what persists may be the accumulation of changes rather than an underlying static substance. Exact sums and integrals show how small contributions build a total; the physical conjecture is that an integration variable might contribute to stress-energy.",
    "Calculus licenses accumulation once a quantity and measure are defined. General relativity requires a covariantly conserved stress-energy tensor with correct units and transformation properties.",
    "A dimensionless count of increments cannot become mass by analogy. The model still owes a carrier, coupling constant, action, conservation law and independent prediction; inserting the desired mass scale after summation would be circular.",
    "What local Lagrangian produces the accumulation law and a conserved stress-energy tensor without fitting the final gravitational scale?",
    ["gravity", "quantumGravity", "entropy"]
  ),
  "/little-red-dots/": guide(
    "Do JWST's little red dots require inherited cosmic residue, or can early black-hole growth explain them?",
    "TTI treats compact red sources at high redshift as a possible place to look for boundary residue. That is now a deliberately disadvantaged hypothesis: a useful version must beat increasingly detailed conventional models of obscured, rapidly accreting black holes in compact hosts.",
    "By 2026, radiation-hydrodynamic simulations had produced little-red-dot-like objects through heavy black-hole seeds, dense gas and sustained rapid accretion. Spectroscopy and host-galaxy studies also strengthen accreting-black-hole interpretations, while population diversity and detailed emission physics remain active research.",
    "Red colour, compactness or early appearance alone is no longer persuasive evidence for TTI. The residue model needs a preregistered feature that conventional accretion, dust, stellar populations and selection effects do not naturally produce.",
    "What spectral, temporal or population-level signature has a quantitative residue prediction and a low probability under the best black-hole model?",
    ["lrd", "gravity", "darkMatter"]
  ),
  "/little-red-dots/research-proposal/": guide(
    "How can the Zero-Seam idea be tested without designing the analysis to find it?",
    "The protocol compares three families: conventional compact-source models, a local transition model and inherited residue. Its purpose is not to secure a TTI win; it is to make all three vulnerable under the same held-out data and scoring rule.",
    "Current conventional models can generate compact red high-redshift sources through black-hole seeding, gas enshrouding and rapid accretion. That evidence raises the bar and should inform the null model, priors and synthetic recovery tests.",
    "A flexible extra component will almost always improve a fit. The proposal therefore needs complexity penalties, blinded thresholds, negative controls and a rule that treats failure to outperform conventional models as evidence against the residue claim.",
    "Which one statistic will be frozen before opening the validation set, and what numerical result will retire rather than merely revise the inherited-residue model?",
    ["lrd", "planck"]
  ),
  "/riemann-programme/": guide(
    "What survived the Riemann archive once numerical success was separated from proof?",
    "The dossier preserves useful identities, transforms, asymptotic observations and diagnostic computations while refusing to promote them into a proof. Its main result is methodological: corrections must propagate through every later claim that depended on the corrected step.",
    "The Riemann Hypothesis remains open and states that every nontrivial zero of ζ(s) has real part one half. Extensive numerical verification and equivalent criteria are evidence and structure, not a proof for all zeros.",
    "No calculation over a finite range closes a universal implication. A positivity pattern, kernel approximation or critical-line identity must be connected to RH by a theorem whose hypotheses are actually proved.",
    "At which exact implication would a sceptical analyst stop, and can that implication be stated independently of the desired conclusion?",
    ["rh"]
  ),
  "/riemann-proof-audit/": guide(
    "Where does each proposed RH route first require more than it has established?",
    "The proof ledger audits arguments at their earliest unsupported move: complete monotonicity, positivity of a density, replacement of one kernel by another, restriction to the critical line, or extension from numerical range to all parameters. This is more informative than declaring a long calculation simply right or wrong.",
    "Equivalent criteria for RH are valuable only when every condition of the equivalence is met. Approximation can illuminate a transform while failing to preserve the zero set or sign property needed by the exact theorem.",
    "A repaired lemma is not a proof unless the full dependency chain is repaired. The page deliberately records downgrades and retractions rather than hiding them behind encouraging numerics.",
    "Which missing statement is both necessary for the route and realistically separable into a lemma that could be proved or disproved?",
    ["rh"]
  ),
  "/riemann-splice-questions/": guide(
    "Does the RH work determine any of the physical constants or splice coefficients TTI still lacks?",
    "The answer is presently no. The archive contributes disciplined transforms, spectral analogies and proof-audit habits, but it does not supply a dimensionful action, gravitational coupling, electromagnetic normalisation or halo scale.",
    "The zeta function encodes prime-number structure, and RH constrains fluctuations around the average distribution of primes. Moving from that arithmetic fact to physical constants requires an independently justified map with units and dynamics.",
    "A shared appearance of spectra, oscillation or criticality is not a coefficient derivation. The splice remains open until a physical bridge predicts a number before calibration and survives comparison with data.",
    "What explicit map carries a dimensionless zeta quantity into a physical observable without importing the observable as its own scale?",
    ["rh", "gravity"]
  ),
  "/plates/": guide(
    "How should a reader use the visual arguments without treating pictures as evidence?",
    "The Plates are an index of reasoning. Each image compresses a relation—closure, orientation, accumulation, phase or recurrence—so a reader can see the proposed move before returning to the paper that states its assumptions.",
    "Diagrams are indispensable in mathematics and physics, but their force comes from the definitions and equations they represent. Visual similarity can suggest a hypothesis; it cannot establish common mechanism or scale.",
    "Every plate should be read with its evidence mark and source link. If the prose and derivation do not support the visual implication, the picture has no independent authority.",
    "Which arrow or identification in the image is an established relation, and which one is the speculative move the paper must defend?",
    ["topology", "gravity", "infinity"]
  ),
  "/ask-shakdrah/": guide(
    "What should the research assistant do when the project is more certain than its evidence?",
    "Ask ShakDrah is designed to explain the corpus while preserving its internal evidence grades. A good answer should state the claim plainly, identify its strongest support, name the missing bridge and offer the best rival explanation before extending the speculation.",
    "The assistant's prepared knowledge is a map of this project, not an independent scientific authority. External sources provide checks on established background; the project remains responsible for every inference it adds.",
    "Fluent language can make a weak claim sound settled. The assistant must not convert metaphor into mechanism, numerical agreement into proof, or a project source into external confirmation.",
    "What is the strongest version of this claim that the evidence actually supports, and what would change the answer?",
    ["infinity", "gravity", "entropy", "rh"]
  )
});
