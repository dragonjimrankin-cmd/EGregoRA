/* --------------------------------------------------------------------------
   ShakDrah and Gink — current prepared answers.

   The large oracle remains available for open questions. This small, public
   corpus catches only the newly published TTI questions for which the Order
   has written an exact answer. It runs before /api/ask, so those answers do
   not drift with a model and the question does not need to leave the browser.
   Everything else passes to the existing oracle unchanged.
   ----------------------------------------------------------------------- */
(() => {
  "use strict";

  const entries = [
    {
      id: "circle-evidence",
      question: "Are The Channeling Circle's channeled entities scientifically verified?",
      patterns: [
        /channeling circle.*(?:evidence|prove|proof|verified|scientific|real|trust)/,
        /(?:evidence|prove|proof|verified|scientific).*(?:channeling circle|channeled entities)/
      ],
      answer: `**No.** The public archive verifies that a group met, recorded sessions and published words attributed to named entities. It does not independently verify that Laitos, Q'uo, Ra, an archangel, an extraterrestrial civilisation or any other claimed source produced those words.

The source labels are part of the Circle's spiritual testimony. Other live interpretations remain possible: contemplative speech, altered-state experience, collaborative meaning-making, inherited L/L Research vocabulary, imaginative construction, a genuinely metaphysical contact, or some mixture. A text can be moving, coherent and ethically useful without settling which interpretation caused it.

The archive's recurring advice to use discernment is a worthwhile internal safeguard, but personal resonance is not an external identity test. Testable medical, psychological or geophysical claims still require ordinary evidence. TTI therefore cites the Circle as a **claimed reception archive**, never as scientific confirmation of the Prime Being, the one residue, higher densities or non-human contact. Read the [attributed analysis and epistemic boundary](https://the-two-infinities.hatchable.site/time-and-residue/#t-channeling-circle).`,
      followups: [
        "What is The Channeling Circle, and what does it claim to do?",
        "How does The Channeling Circle relate to the one-residue essay?",
        "What should I make of its portal, health, and planetary claims?"
      ]
    },
    {
      id: "circle-archive",
      question: "What is in The Channeling Circle transcript archive?",
      patterns: [
        /channeling circle.*(?:archive|catalogue|catalog|transcript|session|entities)/,
        /(?:archive|catalogue|catalog|transcript|session).*(?:channeling circle)/
      ],
      answer: `As reviewed on **11 October 2026**, the Circle's searchable catalogue contains **39 dated sessions**, beginning on 11 November 2023 and running through 13 September 2026. TTI's index links every session rather than copying the transcript corpus.

The catalogue attributes speech to L/Leema, Hatonn, Oxal, Laitos, Latwii, Q'uo, KORVL, Ra, Yahweh, the Hathors, Aethos, Elohim, Yod-Heh-Shin-Vah-Heh and spelling variants, Yeheshua, El Ra, an unknown entity, Yom, Yadda, the Celestials, Archangels Michael and Uriel, Mikael and Lakesh. These are **catalogue attributions**, not identities independently established by TTI.

The transcripts retain useful signs of human mediation: named channelers, questions, pauses, corrections, inaudible passages and a notice where poor audio prevented a coherent transcription. That makes the collection valuable as a record of how a claimed contact becomes speech, recording, edited text and later interpretation. Open the [complete 39-session index](https://the-two-infinities.hatchable.site/time-and-residue/#t-circle-archive) or the [source catalogue](https://thechannelingcircle.com/home/transcripts).`,
      followups: [
        "Which practices and themes recur in The Channeling Circle transcripts?",
        "Are The Channeling Circle's channeled entities scientifically verified?",
        "What is the one residue that travels?"
      ]
    },
    {
      id: "circle-practices",
      question: "Which practices and themes recur in The Channeling Circle transcripts?",
      patterns: [
        /channeling circle.*(?:practice|theme|meditat|ground|discern|ritual|teach)/,
        /(?:practice|theme|meditat|ground|discern|ritual).*(?:channeling circle)/
      ],
      answer: `The practical centre is meditation, stillness, grounding, receptivity and discernment. The group describes calling or inviting contact, tuning toward love and the One Infinite Creator, receiving words or impressions through human instruments, asking questions, then recording and transcribing what was said. Daily ritual, dreams, synchronicities and quiet attention are repeatedly presented as ways of noticing guidance.

The ethical themes are love, service to others, free will, forgiveness, acceptance, friendship, boundaries, care for children and choosing one's response to difficulty. The organising cosmology adds love/light, mind/body/spirit beings, polarity, catalyst, higher selves, social-memory complexes, densities of consciousness, Gaia and planetary transition. Water, lighthouses, mountains, gardens, sunflowers and portals often function as contemplative images.

Keep the levels separate. Meditation or forgiveness can be considered as human practices without accepting the archive's claimed speakers or cosmology. Densities, telepathy, portals and angelic or planetary action remain attributed metaphysical claims. TTI's [thematic map](https://the-two-infinities.hatchable.site/time-and-residue/#t-circle-themes) marks that boundary explicitly.`,
      followups: [
        "What is The Channeling Circle, and what does it claim to do?",
        "What should I make of its portal, health, and planetary claims?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "circle-residue",
      question: "How does The Channeling Circle relate to the one-residue essay?",
      patterns: [
        /channeling circle.*(?:one residue|residue essay|transmission|prime being|fit|relate)/,
        /(?:one residue|residue essay).*(?:channeling circle)/
      ],
      answer: `It supplies a contemporary **case study in claimed transmission**, not proof of the transmission's supernatural source. An experience is attributed to a speaker, filtered through a human instrument and a group, put into inherited language, recorded, transcribed, edited and encountered by later readers. That sequence is observable even if the alleged entity cannot be verified.

TTI writes the surviving transcript schematically as an editing operation applied to several terms: a hypothesised contact or residue, the instrument's memory and vocabulary, the immediate setting, the circle's shared expectations, novelty and error. The question mark stays on the contact term. Internal coherence cannot tell us which term produced a sentence.

On the **historical** reading, the Circle inherits L/L Research concepts and distributes new cultural traces. On the **structural** reading, its One-and-many language revisits a recurrent philosophical problem. Only the strongest and least supported reading treats a session as nonlocal reception. The archive cannot promote that possibility into fact. See [Why it belongs in the residue essay](https://the-two-infinities.hatchable.site/time-and-residue/#t-circle-residue).`,
      followups: [
        "What is the one residue that travels?",
        "Are The Channeling Circle's channeled entities scientifically verified?",
        "What does one Prime Being per universe-instance mean?"
      ]
    },
    {
      id: "circle-health",
      question: "What should I make of its portal, health, and planetary claims?",
      patterns: [
        /channeling circle.*(?:portal|health|blood pressure|bone density|regeneration|neuroplastic|planet|gaia|storm|volcan)/,
        /(?:portal|blood pressure|bone density|cellular regeneration|planetary claim).*(?:transcript|channel)/,
        /(?:transcript|channel).*(?:portal|blood pressure|bone density|regeneration|neuroplastic|planetary)/
      ],
      answer: `Treat them as claims inside the Circle's spiritual framework, not as established medicine, geophysics or topology. The transcripts discuss telepathy, portals, non-human entities, density shifts, collective energy, angelic action and effects upon bodies or planetary systems. Their presence in a transcript documents a belief or reported experience; it does not supply controlled evidence for the mechanism.

Statements connecting spiritual or grounding practices with blood pressure, bone density, cellular regeneration, neuroplasticity or other health outcomes should not be used as diagnosis or treatment and should not replace qualified care. Claims about storms, volcanoes, Gaia or collective energy likewise need independent geophysical evidence before they can be treated as physical explanations.

A final distinction matters for the newer TTI geometry: a contemplative “portal” is not evidence for an orientation-reversing torus mapping space. One is spiritual testimony and metaphor; the other is a mathematical construction used in a speculative cosmology. Similar imagery does not merge their evidential status. The [published caution](https://the-two-infinities.hatchable.site/time-and-residue/#t-circle-themes) is deliberately firm on this point.`,
      followups: [
        "Are The Channeling Circle's channeled entities scientifically verified?",
        "What is an orientation-reversing torus mapping space?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "circle-definition",
      question: "What is The Channeling Circle, and what does it claim to do?",
      patterns: [
        /(?:what|who|explain|describe).*(?:channeling circle)/,
        /channeling circle.*(?:what|who|purpose|claim|does|doing)/
      ],
      answer: `The Channeling Circle describes itself as a small group working in the tradition of [L/L Research](https://www.llresearch.org/). It publishes sessions attributed to members of the “Confederation of Planets in the Service of the One Infinite Creator” and uses the vocabulary of the Law of One, also called there the Law of Love.

Its public method combines group attunement, silent meditation, vocal channeling through named human instruments, questions from participants, recording, transcription and publication. The work is framed as service: the circle calls or invites contact, tunes toward love and the One Infinite Creator, receives words or impressions, then preserves them for seekers. It also links a YouTube channel, Facebook group and Buzzsprout podcast.

That paragraph reports the group's own account. TTI does **not** certify the attributed entities or imply endorsement by L/L Research. It studies the archive because it makes a claimed source-to-instrument-to-record chain unusually visible. Read the [TTI synthesis](https://the-two-infinities.hatchable.site/time-and-residue/#t-channeling-circle) and follow its links to the [original project](https://thechannelingcircle.com/).`,
      followups: [
        "What is in The Channeling Circle transcript archive?",
        "Which practices and themes recur in The Channeling Circle transcripts?",
        "Are The Channeling Circle's channeled entities scientifically verified?"
      ]
    },
    {
      id: "every-being-prime",
      question: "Could every being be the Prime Being somewhere?",
      patterns: [
        /(?:every|any|each|another).*(?:prime being|prime role)/,
        /prime being.*(?:somewhere|another universe|different instance|everyone|every being)/
      ],
      answer: `That is the corrected modal proposal. It does **not** say that every being is simultaneously Prime in one universe, or that one named identity rules every possible world. It says that each universe-instance has exactly one occupant of the prime role, while every being is eligible to occupy that role in some other possible instance.

Symbolically, if p(u) names the Prime Being in universe u, then each u has one p(u), but p(u₁), p(u₂) and p(u₃) need not be the same being. “Prime” is therefore a position selected by an instance's boundary conditions, not a superior species, permanent soul rank, prophet, ruler or eternally favoured person.

There is a further philosophical debt: strict identity across possible worlds is not automatic. “The same being elsewhere” may require counterpart theory rather than literal numerical identity. No mechanism has yet demonstrated that residues cross between separate universe-instances. The newer Zero-Seam proposal names a candidate crossing kernel and conservation test, but does not derive or observe one. The Prime-role proposal remains modal and metaphysical, not an empirical discovery. See [The Prime Being changes with the instance](https://the-two-infinities.hatchable.site/time-and-residue/#t-instances).`,
      followups: [
        "What does one Prime Being per universe-instance mean?",
        "What is the one residue that travels?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "prime-per-instance",
      question: "What does one Prime Being per universe-instance mean?",
      patterns: [
        /(?:one|single).*prime being.*(?:universe|instance)/,
        /prime being.*(?:per universe|universe instance|mean|role|locally unique)/
      ],
      answer: `Within one universe-instance, the conjecture assigns one being to a special **role**: its residue occupies that world's globally transmissible mode. Other beings still leave local physical, informational and cultural traces, but they do not automatically occupy that same global carrier.

The uniqueness is local to the instance. It is not a claim that one identity is eternally privileged across all possible universes. In another instance, another being can occupy the role. This preserves “one Prime Being” without turning Prime into a caste or proper name.

The essay also separates several meanings of transmission. Ordinary physical effects remain inside causal spacetime. Information requires a carrier. Philosophical ideas travel through people, speech, texts and institutions. A possible-world counterpart is a modal relation, not a signal. The common-mode proposal remains inside one universe. The separate Zero-Seam extension asks about inter-universe inheritance, but its kernel is a research debt rather than an established carrier. Read [One Source Per Universe, Every Being Eligible](https://the-two-infinities.hatchable.site/time-and-residue/#t-proposal).`,
      followups: [
        "Could every being be the Prime Being somewhere?",
        "What is the one residue that travels?",
        "How does The Channeling Circle relate to the one-residue essay?"
      ]
    },
    {
      id: "one-residue",
      question: "What is the one residue that travels?",
      patterns: [
        /(?:what|explain|describe).*(?:one residue|residue that travels)/,
        /one residue.*(?:travel|transmit|mean|time|space)/
      ],
      answer: `The proposal says that one residue in each universe-instance can be distributed through that instance's depth of time and space. It does **not** arrive as a preserved personality, complete memory or migrating soul. Later minds receive different projections: recurring questions, intuitions and philosophical forms shaped by their own bodies, languages, histories and circumstances.

That is why the receiving equation includes more than the residue. Interpretation, inherited culture, material conditions, novelty, accident and error all contribute. Even if a global residue existed, no philosophy or channeled text could be reduced to it.

Four readings are now kept apart. Historically, traces travel through ordinary causal chains and cultural transmission. Structurally, similar embodied minds may converge without a cosmic sender. Metaphysically, the Prime Being's residue occupies a common mode inside its own universe-instance. The newer inherited-boundary reading adds a proposed crossing from a preceding universe and carries the greatest mathematical and evidential debt. None may erase differences between traditions or promote inter-universe transmission without a derived mechanism. Read [The One Residue That Travels](https://the-two-infinities.hatchable.site/time-and-residue/).`,
      followups: [
        "What does one Prime Being per universe-instance mean?",
        "How does The Channeling Circle relate to the one-residue essay?",
        "Could the universe itself be the Möbius seam?"
      ]
    },
    {
      id: "mapping-space",
      question: "What is an orientation-reversing torus mapping space?",
      patterns: [
        /orientation reversing.*(?:torus|mapping space|mapping torus|monodromy)/,
        /(?:mapping torus|torus mapping space).*(?:orientation|reverse|seam)/
      ],
      answer: `Begin with a two-torus T² and an interval from 0 to 1. Identify the torus at the far end with the torus at the near end using a map f that reverses orientation. The resulting three-dimensional mapping space is written M_f = (T² × [0,1]) / ((x,1) ~ (f(x),0)), with the induced integer matrix f_* having determinant −1.

One circuit through the identified direction returns a local torus frame with opposite handedness. Two circuits restore the original orientation. The oriented double cover therefore closes after two turns. The “seam” is not necessarily a physical wall at one privileged location: its drawn position is a cut used to display the fundamental domain, while the orientation-reversing identification belongs to the topology of the whole space.

For spacetime, TTI writes X = R_t × M_f so ordinary causal time remains distinct from spatial orientation reversal. This is the precise analogue behind the phrase “the universe is the Möbius seam”; it is not a claim that the cosmos is literally a two-dimensional paper Möbius strip. See [The Universe Is the Möbius Seam](https://the-two-infinities.hatchable.site/inverted-toruses/#t-seam-world).`,
      followups: [
        "Could the universe itself be the Möbius seam?",
        "Does orientation reversal reverse time or create antimatter?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "orientation-boundary",
      question: "Does orientation reversal reverse time or create antimatter?",
      patterns: [
        /orientation reversal.*(?:time|antimatter|matter|flow)/,
        /(?:invert|inverted|inside out).*(?:torus|seam).*(?:time|antimatter|matter)/,
        /(?:time reversal|antimatter).*(?:orientation|torus|moebius seam)/
      ],
      answer: `**No—not by itself.** Orientation reversal changes handedness. Time reversal changes the direction assigned to temporal evolution. Reversing a physical flow changes a velocity or current. Redrawing a torus inside out changes an embedding. Converting matter to antimatter changes quantum numbers and particle content. These are different operations and none may be substituted for another without an explicit physical law.

In the seam-world model, one spatial circuit can reverse a transported frame's orientation while causal time continues forward in X = R_t × M_f. A second circuit restores the original orientation. That topological parity may be worth tracking, but it does not automatically flip charge, baryon number, CP, or the thermodynamic arrow.

Accordingly, the inverted-torus essay treats any matter/antimatter connection as an additional hypothesis with its own mechanism and conservation ledger. Geometry can organise a conjecture; it cannot silently manufacture particle physics. Read [Handedness Reversal Is Not Time Reversal](https://the-two-infinities.hatchable.site/inverted-toruses/#t-not-time).`,
      followups: [
        "What is an orientation-reversing torus mapping space?",
        "Why can the smaller and bigger infinities never fully synchronise?",
        "Can reversible mixing create a matter-antimatter imbalance?"
      ]
    },
    {
      id: "seam-universe",
      question: "Could the universe itself be the Möbius seam?",
      patterns: [
        /universe.*(?:is|be|itself).*(?:moebius|mobius).*seam/,
        /(?:moebius|mobius) seam.*(?:universe|cosmos)/,
        /universe of inverted tor(?:us|i|uses)/
      ],
      answer: `As a disciplined conjecture, yes: the strongest version says the universe is not a collection of ordinary tori joined by a separate seam. It is the orientation-reversing **mapping space itself**. Ordinary torus slices are local cross-sections; after one global circuit they return with reversed orientation, and after two they return to their original handedness.

This makes the seam global. The line drawn in a diagram is only the cut where we choose to display the identification. No observer need encounter a luminous boundary or fall through a literal strip. The precise model is a three-dimensional torus mapping space with orientation-reversing monodromy, extended by a separate time coordinate—not a two-dimensional Möbius strip enlarged into a universe.

Two weaker readings remain available: a network of toroidal cells joined by local inversion seams, and a multiverse of ordinary and orientation-reversed toroidal worlds. The mapping-space reading is cleaner because it makes “one seam, many apparent tori” topologically exact. It is still speculative and currently lacks a demonstrated physical degree of freedom, scale and observational signature. Read [The Universe of Inverted Tori](https://the-two-infinities.hatchable.site/inverted-toruses/).`,
      followups: [
        "What is an orientation-reversing torus mapping space?",
        "Does orientation reversal reverse time or create antimatter?",
        "What is the one residue that travels?"
      ]
    },
    {
      id: "wormhole-inverted-torus",
      question: "Can an inverted torus be a traversable wormhole?",
      patterns: [
        /inverted tor(?:us|i|uses).*(?:wormhole|throat|travers)/,
        /(?:wormhole|throat).*(?:inverted torus|inverted tori|orientation revers)/,
        /toroidal.*(?:mouth|wormhole|throat)/
      ],
      answer: `**Not from topology alone.** An inverted mapping torus is a global identification: a torus fibre returns through an orientation-reversing map whose induced matrix has determinant minus one. That construction can be mathematically precise without containing two mouths, a local throat or a shortcut. A traversable wormhole is a stronger Lorentzian-spacetime claim.

For a simple Morris–Thorne throat, the shape function must satisfy b(r₀) = r₀ and the flare-out condition b′(r₀) < 1, while the redshift function stays finite so no horizon blocks passage. In ordinary general relativity this elementary setup violates the null energy condition at the throat. A candidate must then identify its supporting stress–energy, obey junction and conservation conditions, survive perturbations, keep tidal forces finite and address the possibility that moving mouths create closed timelike curves.

TTI can contribute a proposed **mouth map**. Toroidal winding data may cross from mouth A to mouth B through an orientation-reversing map f with det f_* = −1. That can reverse a transported spatial or internal frame while future-directed time remains future-directed. It does not by itself create antimatter, reverse entropy, provide negative energy or preserve memory. A round trip restores orientation under an exact involution; any residue must live in a computed phase, holonomy, winding, interaction or environmental record.

The clean distinction is: the inverted torus tells a state **how to return**; the wormhole metric must tell spacetime **how to let it pass**. Read [Wormholes and Inverted Tori](https://the-two-infinities.hatchable.site/wormholes/) and its [six-gate research programme](https://the-two-infinities.hatchable.site/wormholes/#t-programme).`,
      followups: [
        "What is an orientation-reversing torus mapping space?",
        "Does residue from one inversion survive a second inversion?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "matter-phase",
      question: "How can matter be residue while antimatter is out of phase?",
      patterns: [
        /matter.*residue.*antimatter.*(?:phase|out of phase)/,
        /antimatter.*(?:out of phase|phase).*(?:matter|residue)/,
        /(?:permanent orthogonality|periodic overlap|quasiperiodic separation)/
      ],
      answer: `The essay asks whether today's matter could be the surviving residue of an earlier interaction while a complementary antimatter sector persists in a relative phase that suppresses ordinary overlap. It studies three meanings of that separation rather than pretending “out of phase” is one mechanism.

**Permanent orthogonality:** the sectors occupy exactly conserved orthogonal states, so ordinary annihilation is forbidden. This best explains survival but requires a real symmetry or superselection rule.

**Periodic overlap:** rationally related cycles return to alignment, producing pulsed opportunities for interaction. This is sharply testable, but early dense overlap threatens to erase the residue unless another protection exists.

**Quasiperiodic separation:** incommensurate frequencies never repeat exactly, though arbitrarily close alignments can still occur. It is mathematically subtle, but incommensurability alone is not a physical shield over finite-width interaction windows.

None of these possibilities is established particle physics, and phase separation is not baryogenesis. The proposal must identify the Hilbert spaces, Hamiltonian, coupling, conserved quantities and observations that distinguish it. Read [The Residue That Did Not Meet Its Opposite](https://the-two-infinities.hatchable.site/out-of-phase/).`,
      followups: [
        "Can reversible mixing create a matter-antimatter imbalance?",
        "Does orientation reversal reverse time or create antimatter?",
        "How do the base-5 to base-8 and base-5 to base-4 shifts differ?"
      ]
    },
    {
      id: "baryogenesis-boundary",
      question: "Can reversible mixing create a matter-antimatter imbalance?",
      patterns: [
        /reversible mixing.*(?:matter|antimatter|baryon|imbalance|asymmetry)/,
        /(?:matter antimatter|baryon).*(?:mixing|create|net|symmetric state)/,
        /phase separation.*(?:baryogenesis|net baryon|imbalance)/
      ],
      answer: `Not from an exactly symmetric state by reversible mixing alone. A reversible map can move an existing bias, hide it in correlations, separate it into sectors or make it locally visible and invisible. It cannot create a new global net baryon number if the initial state and the dynamics preserve the relevant symmetry.

Conventional baryogenesis identifies the missing ingredients through the Sakharov conditions: baryon-number violation, C and CP violation, and departure from thermal equilibrium. An alternative could instead impose asymmetric boundary conditions, but then the asymmetry has been placed in the boundary data rather than generated by phase mixing.

This is a central accounting rule for both the residue essay and the inverted-torus essay. Orientation reversal, periodic overlap and quasiperiodicity may alter where interactions occur; they do not silently supply baryon-number violation or CP asymmetry. A viable model must say where the bias enters and show that the equations preserve the claimed ledger. Read [Separation Is Not Baryogenesis](https://the-two-infinities.hatchable.site/out-of-phase/#t-sakharov).`,
      followups: [
        "How can matter be residue while antimatter is out of phase?",
        "Does orientation reversal reverse time or create antimatter?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "base-shifts",
      question: "How do the base-5 to base-8 and base-5 to base-4 shifts differ?",
      patterns: [
        /base ?5.*base ?8.*base ?4/,
        /(?:base five|base 5).*(?:base eight|base 8|base four|base 4).*(?:shift|phase|plane)/,
        /prime plane.*(?:return plane|base 8|base 4)/
      ],
      answer: `Both proposals begin by assigning the Prime Plane a base-5 phase language. They differ in the return plane used for later beings.

In the **base-5 to base-8** version, return is expressed through an octave structure. Because 5 and 8 are coprime, exact joint recurrence occurs only after 40 ticks in the simplest integer model. This produces a long phase relation and connects naturally—but only analogically—to octave language.

In the **base-5 to base-4** alternative, the return plane has a shorter fourfold organisation. Five and four are also coprime, so the elementary joint recurrence is 20 ticks. The cycle is tighter and the mismatch has a different symmetry.

Neither numeral base is known to be a physical plane, frequency or dimension. Changing notation does not create dynamics. To become more than numerology, either version must identify a measurable state space, evolution rule, coupling and observable that changes when 8 is replaced by 4. Until then the comparison is mathematical speculation, not evidence about cosmology. Read [Prime Plane Phase Arithmetic](https://the-two-infinities.hatchable.site/prime-plane/).`,
      followups: [
        "How can matter be residue while antimatter is out of phase?",
        "Why can the smaller and bigger infinities never fully synchronise?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "little-red-dots-residue",
      question: "Could little red dots be remnants of a previous universe?",
      patterns: [
        /little red dots?.*(?:previous universe|prior universe|remnant|inherited residue|minus one|negative interval)/,
        /(?:previous universe|prior universe|inherited residue|negative interval).*(?:little red dots?|jwst)/
      ],
      answer: `That is the new TTI conjecture, not an astronomical conclusion. The observed sources remain compact early objects whose spectra increasingly support accreting black holes inside dense gas. TTI asks whether that ordinary machinery is the positive-side body of something older: one global residue left by a prior cosmic closure and projected into many local seeds.

The proposed interval −1 < ξ < 0 is a residue coordinate, not automatically a place, epoch, negative-energy reservoir or hidden sky. In the established Cosmic Ledger, R∞ = −1 is bookkeeping. Promoting it into transferable boundary data requires a state space, a crossing kernel, locality and conservation. The earlier local χ-front remains necessary: inherited residue would bias where a dark scaffold integrates into a luminous host rather than replace gas, gravity or accretion.

Many dots do not mean many Prime Beings. The coherent form is one global source condition sampled at many emergence points; the dots share an ancestry, not an identity. They are neither preserved ancient galaxies nor fragments of a person. Read [JWST's Little Red Dots, Through TTI](https://the-two-infinities.hatchable.site/little-red-dots/) and keep its speculative grading attached.`,
      followups: [
        "What is the Zero-Seam Test?",
        "What is the one residue that travels?",
        "Does orientation reversal reverse time or create antimatter?"
      ]
    },
    {
      id: "zero-seam-test",
      question: "What is the Zero-Seam Test?",
      patterns: [
        /(?:what|explain|describe).*(?:zero seam test|zero-seam test)/,
        /zero seam.*(?:research|proposal|test|jwst|little red dot)/,
        /little red dots?.*(?:research proposal|falsif|preregister|held out)/
      ],
      answer: `The Zero-Seam Test is a staged research proposal designed to stop the inherited-residue idea from surviving by metaphor alone. It compares three nested models: conventional black-hole, gas and host physics H_A; that baseline plus a local integration front H_χ; and both plus one inherited-residue crossing law H_−+.

The theory must first derive a finite, conserved kernel shared by every source. The observing team then builds a selection-aware JWST census and freezes the outcomes, priors and exclusions before opening fields withheld by observing programme. The primary test is joint out-of-sample prediction of the redshift-dependent population clock, the lag between compact central growth and extended host growth, and a prespecified shared covariance. Energy accounting and any resolvable orientation trace are consistency tests, not escape routes.

The programme starts with public archival data and earns new telescope time only through successful prediction. It rejects the tested implementation if no crossing law can be derived, conservation fails, the held-out population relation is absent, or ordinary astrophysics predicts as well with fewer assumptions. Even success would establish an unexplained regularity consistent with the model, not prove a previous universe. Read [the complete proposal](https://the-two-infinities.hatchable.site/little-red-dots/research-proposal/).`,
      followups: [
        "Could little red dots be remnants of a previous universe?",
        "How should I grade these new claims?",
        "What is the one residue that travels?"
      ]
    },
    {
      id: "pi-zero-one",
      question: "Why does π appear between zero and one?",
      patterns: [
        /(?:why|how).*(?:pi|π).*(?:zero|0).*(?:one|1)/,
        /(?:zero|0).*(?:one|1).*(?:produce|give|result|derive|lead).*(?:pi|π)/,
        /(?:beta integral|beta theorem|unit interval).*(?:pi|π)/,
        /(?:pi|π).*(?:beta integral|beta theorem|unit interval)/
      ],
      answer: `Zero and one do **not** produce π by bare arithmetic. Finite additions, subtractions, multiplications and divisions starting from 0 and 1 stay rational, while π is transcendental. The exact claim needs declared geometry: take the continuum [0,1], give it the Euclidean metric, and ask for the symmetric measure associated with circular closure.

Euler's beta-integral theorem then gives B(1/2,1/2) = ∫₀¹ dx/√(x(1−x)) = π. The bounds are exactly 0 and 1; the kernel treats them symmetrically, diverges at each edge, yet has a finite total. Under u = 2x−1 the integral becomes ∫₋₁¹ du/√(1−u²), which is the arc length of the upper unit semicircle. The apparently open interval has become a diameter, and π measures its closing arc.

The same constant appears through independent checks. The fundamental theorem of calculus gives 4∫₀¹ dx/(1+x²) = π, leading to the Gregory–Leibniz series. Euler's Basel theorem gives Σₙ₌₁∞1/n² = π²/6: the terms begin at one, tend to zero and accumulate to a finite π-dependent value. These are exact theorems, not numerology.

TTI's extra move remains speculative. It reads 0 and 1 as boundaries of existence and promotes Euclidean circular closure into a condition on reality. Neither the beta theorem nor the Basel theorem proves that interpretation, and closure alone does not select a Euclidean metric. Read [Why π Appears Between Zero and One](https://the-two-infinities.hatchable.site/pi-from-zero-and-one/) for the full derivation and its earned/chosen/refused ledger.`,
      followups: [
        "Why can the smaller and bigger infinities never fully synchronise?",
        "Is TTI integration the same thing as entropy?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "temporal-antipodes",
      question: "Why can the smaller and bigger infinities never fully synchronise?",
      patterns: [
        /(?:smaller|smallward).*(?:bigger|larger|largeward).*infinit.*(?:synchron|sync|same time|clock)/,
        /(?:two infinities|infinities).*(?:opposite ends of time|temporal antipodes|synchron|share.*clock)/,
        /temporal antipode.*(?:infin|time|phase|clock)/
      ],
      answer: `This is the **Temporal Antipodes conjecture**. “Smaller” and “bigger” name directions of scale, not cardinal sizes: smallward tends toward zero, while largeward tends through unbounded magnitudes. In fact, the real interval between zero and one is uncountable and therefore has greater cardinality than the countable outward sequence of natural numbers. Cantor's theorem establishes that distinction; it does not put either infinity at an end of time.

TTI adds the speculative temporal assignment. Write u(t) = (2/π) arctan(t), so every finite time lies between −1 and +1 while the endpoints are reached only as t tends to opposite infinities. Under the convention suggested by TTI's arrow, the largeward boundary is u = −1 and the smallward boundary is u = +1. Reversing those labels changes nothing essential. A reflection u ↦ −u pairs the endpoints on paper, but it does not carry a signal, transport a clock or make them simultaneous.

Full synchronisation means more than two projected phases crossing once. After a lawful transport to one comparison surface, equal phase and equal rate must persist through a non-zero interval: Δφ = 2πk and dΔφ/dt = 0. If the two endpoint states remain asymptotic, are not physically identified, and may be compared only through an ordinary causal protocol, they have no shared finite event or round-trip clock channel. Under those assumptions, complete endpoint synchrony is structurally excluded. Interior echoes may still align periodically or come arbitrarily close quasiperiodically.

The word **cannot** remains conditional. The conjecture would fail if a consistent temporal gluing gave the endpoints a common clock, or if a derived model produced exact phase-and-rate locking over an interval. Ordinary propagation delays and unsynchronised astrophysical sources are not evidence for it. Read [Temporal Antipodes](https://the-two-infinities.hatchable.site/temporal-antipodes/) and its [declared stress test](https://the-two-infinities.hatchable.site/stress-tests/#t-temporal-antipodes).`,
      followups: [
        "How can matter be residue while antimatter is out of phase?",
        "Does orientation reversal reverse time or create antimatter?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "entropy-self-renewal",
      question: "Could entropy be the cost of a self disintegrating so integration can continue?",
      patterns: [
        /entropy.*(?:self|turnover|disintegrat|renew).*(?:integrat|continue|persist|cost)/,
        /entropy.*(?:cost|dissipat).*(?:self|turnover|disintegrat|renew)/,
        /(?:self|turnover|disintegrat|renew).*(?:entropy|dissipat).*(?:integrat|continue|persist|cost)/
      ],
      answer: `Possibly as a **testable bridge**, but not as the definition or general cause of entropy. Established thermodynamics applies to systems whether or not they contain a self. An open, organised system can persist by consuming free energy, replacing parts and exporting entropy. That shows that turnover can carry an irreversible cost; it does not show that all entropy is produced by cosmic self-disintegration.

The key TTI bookkeeping is dI/dt = A − D. I is an independently measured degree of integration, A is assembly and D is disassembly. A stable self can have dI/dt near zero while both A and D are large. Its total throughput Φ = A + D may therefore be high even though a snapshot shows little net change. Real finite-rate turnover can dissipate through friction, diffusion, chemical reactions, control and information erasure, but Φ is not automatically an entropy-production rate.

A physical bridge must define I, measure A and D separately, close the heat, work and matter budget, and test whether throughput predicts residual entropy production after known mechanisms are included. It loses if I only renames entropy, if the extra coefficient is consistent with zero, or if conservation is violated. Rebuilding the same macro-pattern is another forward process; it is not every molecule and photon retracing its path. Read [Entropy as the Cost of Self-Renewal](https://the-two-infinities.hatchable.site/entropy-and-self-renewal/) and the broader [entropy boundary paper](https://the-two-infinities.hatchable.site/entropy/).`,
      followups: [
        "Is TTI integration the same thing as entropy?",
        "Is the 5:27:68 cosmic ratio only a 13.8-billion-year snapshot?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "cosmic-ratio-snapshot",
      question: "Is the 5:27:68 cosmic ratio only a 13.8-billion-year snapshot?",
      patterns: [
        /(?:5\s*:?\s*27\s*:?\s*68|cosmic ratio).*(?:13\.?8|snapshot|time|epoch|swap|reverse|convert)/,
        /(?:baryonic|baryon).*(?:dark matter).*(?:dark energy).*(?:snapshot|time|epoch|swap|reverse|convert)/,
        /(?:matter|dark sector).*(?:percent|fraction).*(?:swap|change|reverse|convert|age)/
      ],
      answer: `**It is a present-epoch snapshot, but “only” understates how strongly it is constrained.** The familiar figures are model-fitted density parameters near today: Ωb0, Ωdm0 and ΩΛ0. They are not an eternal recipe. In standard cosmology, nonrelativistic baryons and cold dark matter dilute approximately as a⁻³, radiation as a⁻⁴, and a cosmological constant remains constant. The fractions therefore change with time even when no sector converts into another.

This produces ordinary swaps of dominance: radiation dominates early, matter later, and dark energy late. It does not mean dark energy consumed matter. Baryons and cold dark matter have nearly the same background scaling, although they redistribute differently inside galaxies because baryons collide, cool and form stars while cold dark matter is effectively collisionless.

TTI's stronger hypothesis treats the sectors as completed, partial and ground levels of integration and asks whether they exchange or reverse. That requires continuity equations dotρi + 3H(1+wi)ρi = Qi with ΣQi = 0, plus a microphysical carrier, momentum transfer, baryon-number and charge accounting, and entropy production. The model must jointly survive nucleosynthesis, the cosmic microwave background, expansion, lensing and structure growth. It fails if ordinary dilution explains the alleged swap, if fitted transition rates are zero, or if a simpler model predicts held-out data as well. Read [The Cosmic Ratio in Time](https://the-two-infinities.hatchable.site/cosmic-ratio-in-time/) and the original [five-percent interpretation](https://the-two-infinities.hatchable.site/gravity/#t-five-percent).`,
      followups: [
        "Could entropy be the cost of a self disintegrating so integration can continue?",
        "How do accumulated differentials connect to mass and gravity?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "entropy-integration",
      question: "Is TTI integration the same thing as entropy?",
      patterns: [
        /(?:tti|phase|cosmic).*(?:integration).*(?:same as|equal|entropy)/,
        /entropy.*(?:integration|consciousness|order|disorder)/
      ],
      answer: `No. Keep at least four definitions visible. Thermodynamic entropy is a state function that constrains macroscopic processes. Boltzmann entropy, S = kB ln Ω, counts microstates compatible with a specified macro-description. Von Neumann entropy is defined from a quantum density matrix. Shannon entropy measures uncertainty in a probability distribution. Their relationships require stated ensembles, coarse-graining and physical protocols.

TTI's **integration** is a proposed order parameter for degrees of freedom acting as a coherent whole. That idea may be philosophically useful, but no established law says that increased TTI integration must lower entropy, raise entropy, generate consciousness or create mass. Local order can increase while the environment gains more entropy, and gravitational systems do not behave like simple gas boxes. Similar arrows in a diagram are not an equality.

A physical bridge would need a state space, dynamics, system boundary, independently defined integration measure I, and a derived relation such as I = F[ρ]. It would also need null models for ordinary self-organisation and a result that could show the bridge is absent. The older symbolic sequence 101, 333, 666 and 999 is retained as cultural history of the framework, not as a result of statistical mechanics.

Read [Entropy and the Phases of Integration](https://the-two-infinities.hatchable.site/entropy/). Its central discipline is simple: established thermodynamics, information theory, TTI interpretation and spiritual symbolism go on separate ledgers.`,
      followups: [
        "How do accumulated differentials connect to mass and gravity?",
        "Why can the smaller and bigger infinities never fully synchronise?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "double-inversion-residue",
      question: "Does residue from one inversion survive a second inversion?",
      patterns: [
        /(?:residue|memory).*(?:first|one|single|after|through).*(?:second|double|two).*(?:inversion|polar)/,
        /(?:double|two|second).*(?:inversion|moebius|mobius|polar).*(?:residue|memory|survive|preserve)/
      ],
      answer: `If the declared inversion is an exact involution P, then P² = I. The modelled state returns exactly, and the direct residue ΔO = O(P²x) − O(x) is zero for every observable O defined only on that state. This is true both for a transported transverse frame after two circuits of the Möbius double cover and, up to an overall phase, for two passages through the same ideal order-two polarization element.

Something can nevertheless survive in a **larger description**. A Möbius strip remains globally non-orientable after the local frame returns. A closed polarization path can acquire a Pancharatnam–Berry phase detectable relative to a reference arm. A real optical element can retain heat, hysteresis or nonlinear material memory. Correlations can leak into an environment. Each is a distinct carrier with a distinct observable; none is implied merely by saying “inversion.”

TTI could add a residue variable r and a law such as (x,r) mapping to (Px,r + f[x]). Then x may return after two operations while r does not. But that enlarged law, its units, conservation rules and coupling have to be derived and tested. It cannot be smuggled into P after the fact. A positive optical phase result would establish an optical path effect, not cosmic inheritance or matter–antimatter conversion.

Read [Two Inversions](https://the-two-infinities.hatchable.site/double-inversion/) and the parent [Möbius account](https://the-two-infinities.hatchable.site/moebius/#t-double-inversion). The disciplined answer is: exact restoration is the null; surviving residue requires a separately named place to live.`,
      followups: [
        "Could the universe itself be the Möbius seam?",
        "Does orientation reversal reverse time or create antimatter?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "differentials-mass-gravity",
      question: "How do accumulated differentials connect to mass and gravity?",
      patterns: [
        /(?:accumulat|gather).*(?:differential|dx).*(?:mass|gravity|weigh)/,
        /(?:mass|gravity).*(?:accumulat|differential|dx|splice deposit)/
      ],
      answer: `There are three levels, and the bridge between the second and third must not be skipped. In mathematics, integrals and sums accumulate differential contributions. The Skeletal Splice gives the exact count R_n = F_(n+2) − 1, defines δΠ_n = R_n φ^(−n), and yields δΠ_n tending to φ²/√5 = 1.170820… with Π_n approximately 1.1708n − 1.618. Those quantities are dimensionless until a scale and units are supplied.

In established physics, a written dx is not a smallest grain of matter. Rest mass, energy density, momentum, pressure and stress enter the stress–energy tensor. General relativity relates a conserved total T_μν to curvature through G_μν + Λg_μν = (8πG/c⁴)T_μν. Much ordinary mass is QCD binding and kinetic energy, not a direct count of elementary deposits.

TTI's possible bridge is to promote accumulated history to a covariant field A(x), supply a causal evolution or kernel, derive a Lagrangian or constitutive law, and obtain a stress–energy contribution T^A_μν. The complete source must obey covariant conservation because the Einstein tensor has zero divergence. Only there could accumulated history contribute to effective mass and then to gravity.

The proposal must face equivalence-principle, fifth-force, lensing, structure-growth, CMB and stability constraints. It loses if its best-fit contribution is zero, violates conservation, merely renames an existing field, or cannot fit independent data. Read [When Differentials Accumulate](https://the-two-infinities.hatchable.site/accumulated-differentials/) and the [Skeletal Splice](https://the-two-infinities.hatchable.site/skeletal-splice/#t-accumulation). The sum is earned; its weight is not.`,
      followups: [
        "Is TTI integration the same thing as entropy?",
        "What is the one residue that travels?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "rh-dossier",
      question: "What did the consolidated Riemann Hypothesis archive actually establish?",
      patterns: [
        /(?:riemann|rh).*(?:archive|dossier|consolidat).*(?:establish|prove|find|result|show)/,
        /(?:what|which).*(?:establish|result|survive).*(?:riemann|rh dossier|rh archive)/
      ],
      answer: `The 52-file archive does **not** prove the Riemann Hypothesis. Four file pairs are exact duplicates, and the seven “comprehensive” versions are cumulative diaries: early claims remain above later retractions. TTI therefore rebuilt the result claim by claim rather than treating the last filename as authoritative.

One argument closes internally: the Riemann xi function is strictly log-convex on the real axis. A positive Pólya-kernel integral turns the relevant logarithmic second derivative into a second moment minus a Cauchy–Schwarz-controlled square. Several balance integrals are also exact, including an integral equal to √π/2 and another equal to π/4. Under RH, the corrected formula for F(x) = (log xi)''(1/2+√x), its inverse-Laplace expression and a Mellin identity are algebraically useful.

Finite matrix spectra, Laguerre checks, zero scans and cancellation patterns remain numerical evidence. The supplied documents do not close their claims of unconditional complete monotonicity, global Bernstein-density positivity, unconditional negativity of the third logarithmic derivative, or the converse from critical-line positivity to RH. Read [The Riemann Dossier](https://the-two-infinities.hatchable.site/riemann-programme/) and its full [Proof and Correction Ledger](https://the-two-infinities.hatchable.site/riemann-proof-audit/).`,
      followups: [
        "Which Riemann Hypothesis claims were corrected or downgraded?",
        "Does the Riemann Hypothesis work solve the outstanding splice questions?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "rh-proof-audit",
      question: "Which Riemann Hypothesis claims were corrected or downgraded?",
      patterns: [
        /(?:riemann|rh).*(?:correct|downgrad|retract|error|audit|proof gap)/,
        /(?:correct|downgrad|retract|error).*(?:complete monotonic|bernstein|polya|critical line|riemann)/
      ],
      answer: `Five headline claims require downgrade in the supplied corpus. First, the easy complete-monotonicity proof used the wrong function: F was written as 2Σ1/(x+γ²), then correctly replaced by 2Σ(γ²−x)/(x+γ²)². The old termwise proof no longer applies. Second, the Bernstein-density proof says only the first term can be negative at small t; the inequality runs the other way, and the number of negative early-zero terms grows as t approaches zero.

Third, the unconditional proof of (log xi)''' < 0 begins with an RH-only all-on-line zero sum, crosses a finite interval numerically and does not supply one uniform treatment of arbitrary off-line quartets. Fourth, the Pólya-kernel log-concavity sketch replaces an infinite weighted variance with a two-point bound without proving the required tail estimate; individual log-concavity is not automatically preserved by summation. Fifth, Session 7 correctly retracts the claim that critical-line positivity implies RH because one negative zero contribution need not dominate the total background; a later file reasserts the equivalence without repairing that gap.

The audit retains exact identities and finite experiments at their proper grade. “Unproved here” does not mean false; it means the archive has not supplied the missing bound. See [Proof and Correction Ledger](https://the-two-infinities.hatchable.site/riemann-proof-audit/).`,
      followups: [
        "What did the consolidated Riemann Hypothesis archive actually establish?",
        "Does the Riemann Hypothesis work solve the outstanding splice questions?",
        "How should I grade these new claims?"
      ]
    },
    {
      id: "rh-splice-bridge",
      question: "Does the Riemann Hypothesis work solve the outstanding splice questions?",
      patterns: [
        /(?:riemann|rh).*(?:splice|base ten|base 10|gravity|electromagnet|dark matter).*(?:solve|answer|derive|help|fix)/,
        /(?:riemann|rh|zeta).*(?:determine|derive|fix).*(?:splice|action|physical constant|coupling)/,
        /(?:splice|base ten|base 10).*(?:riemann|rh|zeta).*(?:action|scale|normal|radius|help)/
      ],
      answer: `No—not at the level of physical derivation. The literal TTI hierarchy remains π-level geometry, the decimal splice at 10 as a proposed localised gravitational source, and the splice at 100 as a proposed circular phase that may support U(1). The RH archive supplies no unique map from the exact deposit sequence to a covariant action, no unit-bearing length or energy scale needed to determine G, no canonical gauge-field and charge normalisation needed to determine e or alpha, and no independently anchored galactic radius r₀.

It does offer useful discipline. Transform the splice sequence before interpreting it; state the infinite quadratic form or stability operator first; derive a truncation budget before trusting a small finite eigenvalue; and preregister the decimal log-frequency, golden approach exponent, phase rule and radial anchor before examining galaxy data. One law must explain both dynamics and lensing if the deposit is claimed to gravitate.

The RH diary’s negative Fibonacci search also does not refute TTI’s separate argument that base ten is intrinsic. It only reports no connection to the selected RH matrices. Similar spectra and cancellation language cannot supply missing couplings. Read [The Splice Questions After RH](https://the-two-infinities.hatchable.site/riemann-splice-questions/) and [When Differentials Accumulate](https://the-two-infinities.hatchable.site/accumulated-differentials/).`,
      followups: [
        "What did the consolidated Riemann Hypothesis archive actually establish?",
        "Which Riemann Hypothesis claims were corrected or downgraded?",
        "How do accumulated differentials connect to mass and gravity?"
      ]
    },
    {
      id: "epistemic-grading",
      question: "How should I grade these new claims?",
      patterns: [
        /(?:how|what).*(?:grade|classify|weigh|evaluate).*(?:new claims|channel|residue|torus|seam)/,
        /(?:earned|chosen|refused).*(?:channel|residue|torus|claim)/
      ],
      answer: `Use four separate ledgers rather than one mood of belief.

**Established mathematics or physics:** a mapping torus can be defined precisely; determinant −1 records orientation reversal; two reversals restore orientation; arctangent can compactify an infinite coordinate without reaching its boundary; reversible symmetric dynamics do not create a global asymmetry from nothing.

**Historical or source evidence:** The Channeling Circle publishes a dated transcript archive in the L/L Research tradition. That establishes the publication record and the group's self-description, not the identity of its attributed speakers.

**Conditional mechanism:** if a specified orientation degree of freedom, carrier, coupling or conserved sector existed, the equations describe consequences that could be developed and tested. The “if” must remain visible.

**Metaphysical reading:** one Prime Being per universe-instance, a globally transmissible residue, nonlocal reception, or a seam-world as cosmology. These may organise thought, but they are not thereby empirical results.

Never let resemblance do the work of evidence. A spiritual portal is not a topological seam; orientation reversal is not time reversal; cultural inheritance is not a signal between universes; a meaningful channeling is not source authentication. The framework is strongest when those boundaries remain explicit.`,
      followups: [
        "Are The Channeling Circle's channeled entities scientifically verified?",
        "Can reversible mixing create a matter-antimatter imbalance?",
        "Could the universe itself be the Möbius seam?"
      ]
    }
  ];

  const normalise = (value) => String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/möbius/g, "moebius")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const find = (question) => {
    const raw = String(question || "").trim();
    const plain = normalise(raw);
    if (!plain) return null;

    const exact = entries.find((entry) => normalise(entry.question) === plain);
    if (exact) return exact;

    return entries.find((entry) => (entry.patterns || []).some((pattern) => pattern.test(plain))) || null;
  };

  window.EGOracleKnowledge = Object.freeze({
    version: "2026-10-14.1",
    reviewed: "2026-10-14",
    entries: Object.freeze(entries.slice()),
    find
  });

  if (typeof window.fetch !== "function" || typeof window.Response !== "function") return;
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    let url;
    try {
      const value = typeof input === "string" ? input : input && input.url;
      url = new URL(value, window.location.href);
    } catch {
      return nativeFetch(input, init);
    }

    const method = String(init.method || (input && input.method) || "GET").toUpperCase();
    if (url.origin !== window.location.origin || url.pathname !== "/api/ask" || method !== "POST") {
      return nativeFetch(input, init);
    }

    let body;
    try { body = JSON.parse(String(init.body || "{}")); } catch { body = {}; }
    if (Array.isArray(body.attachments) && body.attachments.length) return nativeFetch(input, init);

    const entry = find(body.question);
    if (!entry) return nativeFetch(input, init);

    return new window.Response(JSON.stringify({
      answer: entry.answer,
      followups: entry.followups,
      note: "Prepared answer · reviewed 14 October 2026 · linked sources carry the full context.",
      prepared: true,
      knowledge_id: entry.id,
      knowledge_version: window.EGOracleKnowledge.version
    }), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  };
})();
