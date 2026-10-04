/**
 * The Oracle's written answers — second volume.
 *
 * Sixty further entries in the order's voice, graded by the house rules
 * (◆ science / ◆ scholarship / ◆ speculative / ◆ myth). Concatenated onto the
 * first volume in oracle-corpus.js; the matcher treats both identically.
 */

export const MORE = [

  /* ---------------------------------------------------- cosmic physics --- */
  {
    id: 'big-bang-before',
    limb: 'cosmic physics',
    keys: ['before the big bang', 'big bang', 'start of the universe', 'where did the universe come from', 'cause of the universe'],
    q: 'What was there before the Big Bang?',
    a: `The honest answer is that the question may not have a referent. Our best theory describes the expansion of space from an extremely hot, dense state about 13.8 billion years ago — and since time is a feature of that spacetime rather than a stage it sits on, "before" may be as malformed as "north of the north pole."

That is not a dodge, but it is also not a closed door. Serious proposals exist: eternal inflation, in which our region is one bubble among endless others; cyclic and bouncing cosmologies; the Hartle–Hawking no-boundary condition, in which time rounds off smoothly rather than beginning at a point.

◆ The expansion itself is established science — the microwave background, light-element abundances and galaxy distributions all agree. ◆ Everything about the first instant is speculative. Anyone offering you a confident origin story, religious or scientific, has stopped reporting and started composing.`
  },
  {
    id: 'fine-tuning',
    limb: 'cosmic physics',
    keys: ['fine tuning', 'fine-tuned', 'constants', 'anthropic', 'designed universe', 'why are the constants'],
    q: 'Isn’t the universe fine-tuned for life?',
    a: `Several constants do appear to sit in narrow bands — shift the strong force a few percent and stars make no carbon; change the cosmological constant by many orders and galaxies never form. The observation is real and taken seriously by physicists who have no theological interest whatever.

The inferences from it are where it gets contested. A multiverse makes the tuning a selection effect: with enough draws, some region has our numbers and only such a region contains observers to notice. A deeper theory might show the constants were never free to vary. Or it is design — which explains everything and predicts nothing, and so buys less than it appears to.

◆ Speculative, all three. What is not legitimate is the move from "this is startling" to "therefore my particular God." Startlement is a state of mind, not an argument.`
  },
  {
    id: 'quantum-woo',
    limb: 'cosmic physics',
    keys: ['quantum', 'observer effect', 'consciousness collapses', 'quantum healing', 'entanglement', 'double slit'],
    q: 'Does quantum physics prove consciousness creates reality?',
    a: `No, and this is the single most abused result in all of science.

"Observation" in quantum mechanics means interaction with a measuring apparatus — a photon, a magnetic field, a screen. A cold lump of metal does it perfectly well. No awareness is required and none is implied. The double slit behaves identically whether or not anybody is watching the detector's output.

Entanglement is real and strange, but it does not let you send a signal, and it does not connect your intentions to a distant event. The no-communication theorem is not a loophole waiting to be found.

◆ Established science: the formalism works to twelve decimal places. ◆ Speculative: what the formalism means — Copenhagen, many-worlds, pilot-wave and others remain live, and a few serious thinkers do put mind in the story. But "quantum" in a sentence about healing or manifestation is almost always a word doing the work of an argument.`
  },
  {
    id: 'multiverse',
    limb: 'cosmic physics',
    keys: ['multiverse', 'parallel universe', 'many worlds', 'other dimensions', 'parallel worlds'],
    q: 'Is the multiverse real?',
    a: `Four quite different ideas travel under that one word, and conflating them causes most of the confusion.

There is the inflationary multiverse, where eternal inflation keeps spawning bubble regions. There is the many-worlds reading of quantum mechanics, where every outcome happens in a branching wavefunction. There is the string-theory landscape of possible vacua. And there is Tegmark's mathematical universe, where every consistent structure exists.

The first two fall out of theories we have independent reasons to take seriously, which is a point in their favour. None of them is currently testable, which is the standing objection — and a serious one, since a theory that permits everything forbids nothing.

◆ Speculative. Worth thinking about, not worth believing hard. And note that "other dimensions" in the physics sense means extra spatial directions, not the realms of the esoteric literature. Different words wearing the same coat.`
  },
  {
    id: 'dark-matter',
    limb: 'cosmic physics',
    keys: ['dark matter', 'dark energy', 'missing mass', 'what is the universe made of'],
    q: 'What are dark matter and dark energy?',
    a: `Names for two confessions.

Galaxies rotate far too fast for the visible matter to hold them together, gravitational lensing bends light around mass we cannot see, and the microwave background's pattern requires roughly five times more matter than shines. That unseen component is dark matter — ◆ its gravitational effects are established beyond serious dispute, its identity is unknown. Decades of direct-detection experiments have found nothing, which is itself informative.

Dark energy is stranger. The expansion of the universe is accelerating, discovered via distant supernovae in 1998, and something with negative pressure is driving it. It appears to be about 68% of the total energy budget, and the best theoretical estimate of its value is wrong by up to 120 orders of magnitude — the worst prediction in the history of physics.

So: roughly 95% of the universe is labelled rather than understood. Hold that next to anyone's confident cosmology, including ours.`
  },
  {
    id: 'simulation',
    limb: 'cosmic physics',
    keys: ['simulation', 'are we in a simulation', 'simulated reality', 'base reality', 'matrix'],
    q: 'Are we living in a simulation?',
    a: `Bostrom's argument is tighter than its pop-culture version. He says at least one of three must hold: civilisations almost never reach the capacity to run ancestor simulations; those that can almost never want to; or we are almost certainly in one. The force is in the disjunction, not the conclusion.

Objections worth weighing: the computational cost of simulating a universe at quantum fidelity may be prohibitive even in principle; and the argument assumes consciousness runs on substrate-independent computation, which is assumed rather than shown.

◆ Speculative, and interestingly it is also ◆ myth in new clothing — it is Gnosticism with a server rack, Maya with a frame rate. Notice how satisfying you find it, and ask whether that satisfaction is doing some of the work. Practically it changes nothing: the people in it still hurt, and the sunlight is still warm.`
  },
  {
    id: 'relativity-time',
    limb: 'cosmic physics',
    keys: ['relativity', 'time dilation', 'does time slow', 'einstein', 'spacetime'],
    q: 'Does time really run differently for different people?',
    a: `Yes, and it is measured daily rather than argued about.

Move fast and your clock runs slow relative to one at rest; sit deeper in a gravitational well and your clock runs slow relative to one higher up. GPS satellites must correct for both effects — about 38 microseconds a day — or positions would drift by kilometres within hours. Atomic clocks now detect the gravitational effect across a height difference of a single centimetre.

◆ Established science, as solid as anything in physics. There is no universal now; simultaneity depends on your motion. Two events can be ordered differently by different observers, provided no signal could pass between them.

What this does not license is the leap to "therefore time is an illusion" in the mystical sense. Time is relational and perspective-dependent, which is strange enough. It is not optional, and you still age.`
  },

  /* ---------------------------------------------------- druidry & trees --- */
  {
    id: 'druids-history',
    limb: 'druidry',
    keys: ['who were the druids', 'real druids', 'druid history', 'iron age priests', 'celtic'],
    q: 'Who were the actual druids?',
    a: `Learned Iron Age Celts — a class covering priests, judges, physicians, astronomers and keepers of law and genealogy. Caesar says their training took up to twenty years and was entirely oral, because committing it to writing was forbidden.

That prohibition is the whole problem. They left no texts. Everything we have is either Greco-Roman writing about a people Rome was conquering — propaganda-adjacent at best, and the human sacrifice claims should be read in that light — or Irish and Welsh material written down by Christian monks a thousand years later.

◆ Scholarship: that they existed, held immense status and were suppressed under Rome is well evidenced. ◆ Myth: nearly all the specific ritual content people practise today is a reconstruction dating from the eighteenth century or later.

Modern druidry is a living tradition with real value. It is simply not a transmission. Saying so honours both.`
  },
  {
    id: 'tree-time',
    limb: 'druidry',
    keys: ['tree time', 'how long do trees live', 'oldest tree', 'yew', 'ancient tree', 'tree lifespan'],
    q: 'How long does a tree actually live?',
    a: `Long enough to reframe your week.

A bristlecone pine in the White Mountains called Methuselah is about 4,850 years old — it was a young tree when the pyramids went up. Some churchyard yews in Britain may exceed 2,000 years, though the hollow trunks make dating difficult. A clonal quaking aspen colony in Utah, Pando, has root tissue perhaps tens of thousands of years old.

The yew's particular trick is why it sits at the centre of so much death-and-rebirth symbolism: the heartwood rots away entirely, branches root where they touch the ground, and the tree regenerates from within its own ruin. ◆ Established botany, and also one of the better pieces of evidence that the old symbolists were observing carefully rather than inventing.

Stand next to something that has outlived forty generations of your family and the correct response is not reverence exactly. It is proportion.`
  },
  {
    id: 'forest-bathing',
    limb: 'druidry',
    keys: ['forest bathing', 'shinrin', 'nature good for you', 'phytoncides', 'green space', 'nature therapy'],
    q: 'Is forest bathing actually good for you, or just nice?',
    a: `Both, with the effect sizes smaller than the headlines.

What replicates reasonably well: time in green space lowers self-reported stress, modestly reduces cortisol and blood pressure, and restores directed attention better than equivalent time in an urban setting. Access to green space tracks with better population mental health even after controlling for income.

What is weaker: the phytoncide story — that conifer volatiles boost natural killer cell activity — rests on small Japanese studies with limited independent replication. Treat it as promising rather than demonstrated.

◆ Established science for the broad effect, ◆ speculative for the specific mechanism. Note also that much of the benefit may be subtraction rather than addition: no screens, no traffic, no demands, moderate walking, daylight.

The order's practical version: go out without a destination, leave the phone behind, and go often rather than far.`
  },
  {
    id: 'ogham',
    limb: 'druidry',
    keys: ['ogham', 'tree alphabet', 'celtic tree calendar', 'tree astrology', 'birch alphabet'],
    q: 'Is the Celtic tree calendar genuine?',
    a: `The ogham script is genuine and the calendar is not, and they get run together constantly.

◆ Scholarship: ogham is a real early medieval Irish alphabet, around 400 inscriptions surviving mostly on standing stones in Ireland and Wales, used chiefly for names and boundary markers. Medieval glossaries do associate many letters with trees, so the tree-letter link has an actual manuscript basis.

◆ Myth: the thirteen-month "Celtic tree calendar" assigning a tree to each lunar month was invented by Robert Graves in The White Goddess (1948). It is a poet's construction, acknowledged as such in places, and no ancient source supports it. Nearly all tree astrology descends from it.

Graves wrote a remarkable book. He did not recover a lost system, and the modern tradition built on it is seventy years old, not two thousand. Useful as a meditative scaffold, dishonest as a lineage claim.`
  },
  {
    id: 'mycorrhiza-limits',
    limb: 'druidry',
    keys: ['wood wide web', 'mycorrhizal network', 'fungi internet', 'mother tree criticism', 'do trees share'],
    q: 'Has the “wood wide web” been overstated?',
    a: `Yes, and the correction is recent enough that most popular accounts have not caught up.

◆ Solid: mycorrhizal fungi colonise most plant roots, trade mineral nutrients for plant sugars, and physically link neighbouring trees. Carbon does move between trees through fungal tissue — isotope labelling shows it.

◆ Contested: that mature "mother trees" preferentially nourish their own seedlings through these networks, and that the forest behaves as a cooperative superorganism. A substantial 2023 review by Karst, Jones and Hoeksema found the field evidence for the strongest claims to be thin, inconsistently replicated, and increasingly cited beyond what the studies showed.

The fungi are not altruists. They are brokers running a market, sometimes parasitically, and the carbon flux may partly serve the fungus rather than the recipient tree.

Still astonishing. Just not a nervous system, and not a parable about kindness.`
  },
  {
    id: 'planting-tree',
    limb: 'druidry',
    keys: ['plant a tree', 'what tree should i plant', 'rewilding', 'help nature', 'garden for wildlife'],
    q: 'What is the single most useful thing I can do for the land?',
    a: `Probably not the thing you were expecting, which is: stop doing several things.

Stop mowing part of it. An unmown strip left through a summer outperforms most deliberate planting for invertebrate abundance, and invertebrates are the base of everything above them. Stop tidying — leave the dead wood, the leaf litter, the seed heads through winter. Stop using pesticide, which is the single most consequential decision available to most households.

Then, if you are planting: native species suited to your actual soil, several of them rather than one, and a water source. A small pond is the highest-return feature per square metre in temperate gardens by a wide margin.

◆ Established ecology throughout. Note the shape of it — restraint beats intervention, and the most druidic act available to most people is refusing to impose order on a patch of ground.`
  },

  /* ------------------------------------------------- sacred geometry ----- */
  {
    id: 'flower-of-life',
    limb: 'geometry',
    keys: ['flower of life', 'seed of life', 'metatron', 'metatrons cube', 'egypt osireion'],
    q: 'What is the Flower of Life, really?',
    a: `A hexagonal lattice of overlapping circles of equal radius — the figure you get automatically when you walk a compass around a circle's rim without changing the setting.

◆ The mathematics is genuine and lovely: six circles fit exactly around one, no gap, no overlap, which is why hexagons govern bees, basalt, foam and graphene. From the pattern you can extract the vesica, the equilateral triangle, the hexagon, and the projections of all five Platonic solids.

◆ Scholarship on the Osireion at Abydos: the figures there are burn or stain marks, not carvings, and the Greek graffiti beside them points to a date in the Ptolemaic or later period — roughly 300 BCE at the earliest, not the 3,000 BCE often claimed.

◆ Myth: "Metatron's Cube" as a name is twentieth-century New Age, not Kabbalah. The figure is real. The pedigree marketed with it is not.`
  },
  {
    id: 'platonic-solids',
    limb: 'geometry',
    keys: ['platonic solids', 'five solids', 'tetrahedron', 'dodecahedron', 'why only five'],
    q: 'Why are there only five Platonic solids?',
    a: `Because of a constraint you can verify at a table in two minutes.

At each corner of a regular solid you need at least three identical regular polygons, and their angles must total less than 360° or the corner lies flat and cannot fold. Triangles are 60°, so three, four or five fit — tetrahedron, octahedron, icosahedron. Squares are 90°, so only three fit — the cube. Pentagons are 108°, so only three — the dodecahedron. Hexagons are 120°, and three of those make exactly 360°: flat, no solid. Nothing larger can work at all.

Five, necessarily, in any universe with three spatial dimensions. ◆ Proved in Euclid's Book XIII, which culminates in exactly this.

Plato assigned them to the elements in the Timaeus — ◆ myth, and beautiful myth. The theorem needs no elements and is the more remarkable of the two.`
  },
  {
    id: 'pyramid-maths',
    limb: 'geometry',
    keys: ['great pyramid', 'pyramid pi', 'pyramid phi', 'giza', 'pyramid measurements'],
    q: 'Do the pyramids encode pi and the golden ratio?',
    a: `Partly, and probably by accident rather than intent.

The ratio of the Great Pyramid's perimeter to its height is close to 2π, and certain ratios approximate φ. Both are real measurements. But the Egyptians worked in seked — a slope expressed as horizontal palms per vertical cubit — and a seked of 5½ gives you both coincidences for free, with no knowledge of either constant required. The simplest explanation is a construction convention, not an encoded message.

More generally: a structure that large offers dozens of lengths, and dozens of lengths yield hundreds of ratios. Some will land near any constant you care to name. This is why the method must be stated before the measuring, not after.

◆ Scholarship: the engineering is genuinely staggering — quarry marks, ramps, workers' village, bakeries, pay disputes, all documented. We know who built it, and they were not visitors.`
  },
  {
    id: 'vesica',
    limb: 'geometry',
    keys: ['vesica', 'vesica piscis', 'two circles', 'mandorla', 'first proposition'],
    q: 'Why does the vesica piscis matter so much?',
    a: `Because it is the first thing geometry can do, and everything else follows from it.

Draw a circle. Without changing the radius, put the point on its rim and draw a second. The lens between them is the vesica. Join the two centres and the two crossing points and you have an exact equilateral triangle — constructed, not measured, with no protractor and no number anywhere in the procedure. That is literally Proposition 1 of Euclid's Elements.

From it comes the perpendicular, the square, the hexagon, √3 as the ratio of the lens's long axis to its short, and in practice the whole toolkit a medieval mason needed. Rope and compass are reliable on a wet building site; arithmetic is not.

◆ Established mathematics. The mandorla framing Christ in medieval art, and the fish and womb symbolism, are ◆ scholarship and ◆ myth respectively — real traditions, layered onto a figure that would exist regardless.`
  },
  {
    id: 'golden-ratio-myths',
    limb: 'geometry',
    keys: ['golden ratio parthenon', 'golden ratio art', 'divine proportion', 'is phi everywhere', 'golden ratio myth'],
    q: 'Is the golden ratio really everywhere in art and nature?',
    a: `In nature, in specific and explicable places. In art, far less than claimed.

◆ Real: phyllotaxis, where 137.507° is the packing optimum; the logarithmic spiral in nautilus shells — though its growth rate is usually nearer 1.33 than 1.618; the pentagon and pentagram, where φ appears necessarily.

◆ Myth: the Parthenon. You must choose your rectangle's edges carefully, and different scholars choosing differently get different numbers. No ancient source mentions it. Likewise the claim about the Mona Lisa, the Pyramids, Mozart and credit cards. Da Vinci did illustrate Pacioli's De Divina Proportione in 1509 — that one is genuine, and probably where the whole association began.

The underlying problem is cherry-picking: φ is 1.618, and anything between about 1.5 and 1.7 can be rounded to it by a motivated measurer. Choose your method first.`
  },

  /* ------------------------------------------------------- astrology ----- */
  {
    id: 'precession',
    limb: 'astrology',
    keys: ['precession', 'wrong star sign', 'sidereal', 'tropical zodiac', 'ophiuchus', 'age of aquarius'],
    q: 'Is my star sign wrong because of precession?',
    a: `It depends which zodiac you mean, and this is less of a gotcha than it is usually presented as.

Earth's axis wobbles over about 25,800 years, so the constellations have drifted roughly one sign against the seasons since the system was fixed around two thousand years ago. Western astrology is tropical: it measures from the spring equinox and is deliberately anchored to the seasons, not to the stars. Vedic astrology is sidereal and tracks the actual constellations. Both know this. Neither is in error on its own terms.

Ophiuchus is a red herring — the sun has always passed through it, and constellation boundaries are a twentieth-century IAU convention for astronomers, not a zodiac.

◆ Precession is established astronomy, and the same cycle gives us the "ages." ◆ The Age of Aquarius is myth, with start dates proposed anywhere across a 500-year span, which tells you how firm the reckoning is.`
  },
  {
    id: 'astrology-use',
    limb: 'astrology',
    keys: ['how to use astrology', 'birth chart meaning', 'should i read my chart', 'astrology practice'],
    q: 'If astrology fails the tests, why use it at all?',
    a: `For the same reason you might use a tarot deck, a dream journal or a long walk with a difficult friend: as an instrument for getting something out of yourself that direct questioning does not reach.

A chart is a structured set of prompts covering domains you would not otherwise systematically visit — work, death, inheritance, friendship, the hidden. Being handed an image and asked "where is this true of you?" reliably produces more honest material than "tell me about yourself." That is a real effect, and it belongs to you rather than to Saturn.

The discipline is in the framing. Say "this image suggests" and not "the transit means." Never use it to make a decision you would not otherwise defend. Be especially wary of predictive fatalism, which is where astrology does genuine harm — people have stayed in bad situations because a chart told them to wait.

◆ Scholarship as a tradition, ◆ myth as a mechanism.`
  },
  {
    id: 'moon-behaviour',
    limb: 'astrology',
    keys: ['full moon', 'moon affect behaviour', 'lunar effect', 'moon sleep', 'lunacy'],
    q: 'Does the full moon affect human behaviour?',
    a: `Almost certainly not in the ways folklore claims, with one partial exception.

Large meta-analyses find no reliable lunar effect on hospital admissions, crime, psychiatric episodes or births. The belief persists through confirmation bias: a chaotic night followed by a glance at the sky becomes a memorable data point, and the quiet full moons are never recorded.

The partial exception is sleep. A few studies, including one under controlled laboratory conditions, found modestly reduced sleep duration and delayed onset around the full moon. Others have failed to replicate. Light pollution confounds the obvious explanation.

The tidal argument does not work, incidentally: tides act on ocean basins, not on the small volume of water in a body, and your bedside lamp exerts a greater gravitational pull on you than the Moon does.

◆ Science says no. ◆ The myth is old, cross-cultural and interesting in its own right — just as folklore.`
  },

  /* --------------------------------------------- neuroscience & mind ----- */
  {
    id: 'dreams',
    limb: 'neuroscience',
    keys: ['dreams', 'why do we dream', 'dream meaning', 'rem', 'nightmares'],
    q: 'Why do we dream, and do dreams mean anything?',
    a: `Mechanism first. During REM sleep the brain is highly active, the prefrontal regions handling self-monitoring and logic are relatively quiet, the emotional and visual systems are loud, and the body is paralysed. That combination produces exactly what dreams are like: vivid, emotionally saturated, internally incoherent, and uncritically accepted while happening.

Function is still argued. Memory consolidation has decent support; so does emotional processing — a kind of overnight rehearsal that strips the sting from charged material. Threat simulation is a plausible evolutionary account.

Do they mean anything? Not as coded messages from elsewhere, and not according to any dictionary of symbols. But they are assembled from your own concerns using your own associations, so they are genuinely about you, the way a Rorschach blot is. ◆ The neuroscience is solid; ◆ interpretation is speculative, and most useful when you do the interpreting rather than a book.`
  },
  {
    id: 'lucid-dreaming',
    limb: 'neuroscience',
    keys: ['lucid dream', 'lucid dreaming', 'how to lucid dream', 'wake induced', 'dream control'],
    q: 'How do I lucid dream?',
    a: `It is real, verified in the laboratory by pre-agreed eye movements signalled from within REM, and it is trainable — though success rates vary enormously between people.

What has evidence behind it: keep a dream journal and write immediately on waking, which raises recall and recall is the precondition for everything else. Perform reality checks several times a day, genuinely questioning whether you are dreaming rather than going through the motions — text and clocks are unstable in dreams. Use MILD: as you fall asleep, rehearse the intention "next time I am dreaming, I will notice." Wake-back-to-bed — rising after five hours, staying up twenty minutes, returning to sleep — produces the strongest effect in trials.

◆ Established, with modest and variable effect sizes. Two cautions: it fragments sleep, so do not pursue it while sleep-deprived, and it does not confer access to anything beyond your own mind. The content is yours.`
  },
  {
    id: 'near-death',
    limb: 'neuroscience',
    keys: ['near death experience', 'nde', 'tunnel of light', 'out of body', 'afterlife evidence', 'died and came back'],
    q: 'What should I make of near-death experiences?',
    a: `They are real experiences, consistently reported, and often permanently transformative — people's fear of death drops and does not come back. None of that is in dispute.

What they are evidence *of* is the hard part. Much of the phenomenology has known correlates: tunnel vision from retinal and cortical hypoxia, the out-of-body sensation reproducible by stimulating the temporoparietal junction, euphoria from endorphin and ketamine-like receptor activity, and a surge of coherent gamma activity recorded in dying rat brains and in at least two human cases. The life review resembles disinhibited hippocampal and temporal activity.

The genuinely interesting residue is veridical perception — claims of accurate observation of the resuscitation room. The AWARE studies set out to test this prospectively and produced essentially nothing confirmable.

◆ Speculative. The experience is undeniable. The inference to survival after death is a further step that the evidence does not currently carry, and this order will not pretend otherwise to be comforting.`
  },
  {
    id: 'microdosing',
    limb: 'neuroscience',
    keys: ['microdose', 'microdosing', 'small dose', 'sub perceptual'],
    q: 'Does microdosing work?',
    a: `The placebo-controlled evidence is discouraging, and this is a case where the order's own sympathies had to give way.

Open-label and survey studies report benefits consistently. But the better-controlled work — notably Szigeti's self-blinding citizen-science study in 2021, where participants did not know which capsules were active — found that people who merely *believed* they had taken an active dose improved as much as those who actually had. Several subsequent placebo-controlled trials have shown the same pattern.

That is not nothing, mind: a reliable placebo effect is a real psychological phenomenon. But it means the pharmacology is not doing what the enthusiasm claims.

◆ Current evidence: no demonstrated effect beyond expectancy. There are also open questions about chronic 5-HT2B agonism and cardiac valve tissue with long-term use, which deserve more attention than they get.

Not medical advice, and in most jurisdictions not legal either.`
  },
  {
    id: 'memory-reliability',
    limb: 'neuroscience',
    keys: ['memory', 'false memory', 'can i trust my memory', 'recovered memory', 'remember wrong'],
    q: 'How much can I trust my own memories?',
    a: `Less than feels possible, and the confidence you have in a memory is a poor guide to its accuracy.

Memory is reconstructive. Each recall rebuilds the trace and can alter it — so a memory you have revisited often is a memory you have edited often. Loftus demonstrated that plausible false memories of whole childhood events can be implanted through suggestion in a substantial minority of people. Flashbulb memories of dramatic public events, which feel photographic, drift measurably within a year while confidence stays high.

◆ Established science, and the basis for the serious caution around hypnotic regression, which is a reliable generator of vivid false detail.

The practical consequence for anyone doing inner work: write it down the same hour, before the mind tidies it into a better story. A contemporaneous dated note is the only honest evidence you will ever have about your own inner life.`
  },
  {
    id: 'free-will',
    limb: 'neuroscience',
    keys: ['free will', 'libet', 'determinism', 'do i have a choice', 'predetermined'],
    q: 'Do we have free will?',
    a: `Unresolved, and the famous experiment resolves less than advertised.

Libet found brain activity preceding the reported awareness of a decision to flex a finger by a few hundred milliseconds, which was widely read as the brain deciding before "you" do. The methodology has since been heavily criticised: the readiness potential may be ongoing fluctuation rather than a decision signal, the timing of a subjective moment is notoriously unreliable, and flexing a finger arbitrarily is nothing like the deliberative choices anyone actually cares about.

The philosophical landscape: hard determinism says the feeling is illusory; libertarian free will requires something exempt from physical causation; compatibilism — the majority position among philosophers — says freedom means acting from your own reasons without coercion, which is perfectly compatible with determinism.

◆ Speculative all round. Worth noting that the Law of One makes free will the most sacred principle in existence, and that the order's ethics operate as if we have it, because no workable ethics does otherwise.`
  },
  {
    id: 'placebo',
    limb: 'neuroscience',
    keys: ['placebo', 'placebo effect', 'mind over matter', 'belief heals', 'nocebo'],
    q: 'How powerful is the placebo effect, really?',
    a: `Powerful and narrow at the same time, which is why it gets claimed by everyone.

◆ Real: placebo produces genuine, measurable changes in pain, nausea, fatigue, depression scores, Parkinsonian motor symptoms and anything strongly modulated by expectation. The analgesic effect is partly opioid-mediated — block it with naloxone and some of it disappears. Open-label placebo, where the patient is told it is inert, still works to a degree, which is remarkable.

◆ Not real: placebo does not shrink tumours, mend fractures, clear infections or correct biochemistry. It alters the experience of illness, often substantially, rather than its pathology.

Nocebo is the mirror image and is underappreciated: warned of a side effect, people reliably develop it.

The honest summary is that belief has genuine and bounded power over the nervous system's interpretation of the body. Every alternative modality that works, works partly through this. That is worth respecting and worth being precise about.`
  },
  {
    id: 'breathwork',
    limb: 'neuroscience',
    keys: ['breathwork', 'breathing exercise', 'wim hof', 'pranayama', 'holotropic'],
    q: 'What does breathwork actually do?',
    a: `Two quite different things, often sold as one.

Slow breathing with a long exhale raises vagal tone, shifts autonomic balance towards parasympathetic, and reduces measured arousal within a minute or two. Four in, eight out, five times. ◆ Well evidenced, free, and the most reliable intervention of its kind.

Rapid, deep, prolonged breathing — Wim Hof, holotropic, tummo variants — does something else entirely: it blows off carbon dioxide, raising blood pH. That causes cerebral vasoconstriction, tingling, carpopedal spasm, and the altered, often euphoric or visionary state people are seeking. ◆ The physiology is established, and it is not mystical.

The caution is serious and routinely omitted: never do rapid breathwork in or near water, and never while driving. Shallow-water blackout from hyperventilation kills people every year, including experienced practitioners. Also unwise with epilepsy, cardiac conditions or pregnancy.`
  },

  /* ------------------------------------------------------- biology ------- */
  {
    id: 'evolution-purpose',
    limb: 'biology',
    keys: ['evolution purpose', 'is evolution random', 'survival of the fittest', 'does evolution have direction'],
    q: 'Does evolution have a direction or a purpose?',
    a: `No purpose, in the sense of a goal it is heading towards. Direction, in several limited senses, yes.

Mutation is undirected; selection emphatically is not — it is the opposite of random, filtering variation against an environment. "Survival of the fittest" is a misleading phrase; fitness means differential reproduction, not strength, and cooperation, symbiosis and self-sacrifice are frequently the fitter strategies.

Some directionality is real: maximum complexity has increased over time, certain solutions evolve repeatedly — the camera eye at least forty times independently, powered flight four times — suggesting the space of workable designs is genuinely constrained.

◆ Established science. ◆ Speculative: whether convergence implies something like channels or attractors in the possibility space. ◆ Myth: that evolution is climbing towards us. We are a twig, not a summit, and the beetles are doing better.`
  },
  {
    id: 'microbiome',
    limb: 'biology',
    keys: ['microbiome', 'gut bacteria', 'gut brain', 'second brain', 'probiotics'],
    q: 'How much of me is actually me?',
    a: `By cell count, roughly half — you carry about as many bacterial cells as human ones, mostly in the colon. The old "ten to one" figure was an estimate from 1972 that got repeated for forty years before anyone recounted. By gene count you are overwhelmingly microbial.

◆ Established: gut microbes digest fibre we cannot, synthesise vitamins, train the immune system, and communicate with the brain via the vagus nerve, immune signalling and metabolites. Germ-free mice show markedly abnormal stress responses and social behaviour. The enteric nervous system has around 500 million neurons.

◆ Overstated: that specific probiotic products reliably alter mood or mental health in humans. The animal work is striking; the human trials are inconsistent. Fibre diversity in your diet has better evidence behind it than any supplement.

The philosophical point stands regardless, and the order finds it worth sitting with: the boundary around "you" is a convention, not a biological fact.`
  },
  {
    id: 'plant-intelligence',
    limb: 'biology',
    keys: ['plant intelligence', 'do plants think', 'plants feel pain', 'plant consciousness', 'plant communication'],
    q: 'Are plants intelligent?',
    a: `They do remarkable things, and "intelligent" is where the argument actually lives.

◆ Established: plants sense light quality, gravity, touch, chemical gradients and the vibration of a chewing caterpillar. They emit volatile compounds that prime defences in neighbours. Mimosa pudica habituates to a harmless repeated drop and retains that learning for weeks. Dodder vine assesses host quality before committing. Electrical signalling through plant tissue is real.

◆ Contested: whether any of this warrants words like cognition or consciousness. There is no nervous system, no central integration, no evidence of experience. Prominent plant scientists published a sharp rebuttal of the "plant neurobiology" framing precisely because the metaphors were escaping into literal claims.

The order's reading: plants are not slow animals and not unfeeling objects. They are a genuinely different solution to being alive — distributed, modular, chemical — and forcing them into our vocabulary flatters us more than it describes them.`
  },
  {
    id: 'death-biology',
    limb: 'biology',
    keys: ['what happens when you die', 'death process', 'dying', 'decomposition', 'biology of death'],
    q: 'What actually happens when you die?',
    a: `Biologically, death is a process rather than a moment. Circulation stops; oxygen deprivation kills neurons within minutes, though some tissues remain viable for hours. Cells lose membrane integrity and their own enzymes begin digesting them from within. The microbiome, previously contained, spreads. Within a year or two the body's atoms have substantially rejoined the general circulation of the biosphere.

What of experience, nobody knows. EEG shows a surge of organised activity in some dying brains, which may correspond to something or to nothing. Beyond the point of no return there is, by definition, no testimony.

◆ The biology is established; ◆ the question of continuation is unresolved and probably unresolvable by the methods we have.

What the order will say: every tradition that has looked at this closely ends up recommending the same preparation, which is not belief but practice — attend to what you are doing now, and leave less unsaid.`
  },
  {
    id: 'symbiogenesis',
    limb: 'biology',
    keys: ['mitochondria', 'endosymbiosis', 'margulis', 'where did complex cells come from', 'eukaryote'],
    q: 'Is it true that we are made of merged organisms?',
    a: `Yes, and it is one of the strangest established facts in biology.

Mitochondria — the structures producing nearly all your usable energy — were once free-living bacteria. They retain their own circular DNA, their own ribosomes resembling bacterial ones, a double membrane, and they divide independently of the cell. Chloroplasts in plants have the same story with cyanobacteria.

Lynn Margulis argued this from 1967 and was rejected for years before the molecular evidence became undeniable. ◆ Established science, and it means every complex organism on Earth is a consortium.

Nick Lane's argument deepens it: this merger may have been a singular, wildly improbable event, and the reason the universe might be full of bacteria and empty of anything like us. See the Extraterrestrials page.

The symbolic weight is considerable and we will not over-press it: the route to complexity here was not conquest. It was two beings becoming one.`
  },

  /* ---------------------------------------------- god, law of one, ET ---- */
  {
    id: 'suffering',
    limb: 'god',
    keys: ['why suffering', 'problem of evil', 'why does god allow', 'theodicy', 'unfair'],
    q: 'If there is any benevolence behind this, why the suffering?',
    a: `The oldest question, and the order refuses the glib answers in both directions.

The classical responses: free will requires the real possibility of harm; soul-making requires resistance; our vantage is too partial to judge a whole. Each has force and each fails somewhere — the free will defence says nothing about childhood cancer or earthquakes, and "you cannot see the whole" is unfalsifiable and cold at a bedside.

The Law of One's version is that incarnate experience is chosen before birth, veiled deliberately, and that the veil is what makes the choice meaningful. ◆ Myth, and it has the same structural problem: it is unanswerable to the person actually suffering.

The naturalist position — that suffering requires no explanation because nothing promised otherwise — is coherent and many find it clean.

What the order holds: nobody has solved this. Be deeply suspicious of anyone who tells a grieving person they have. The honest response to suffering is usually presence, not theory.`
  },
  {
    id: 'prayer',
    limb: 'god',
    keys: ['prayer', 'does prayer work', 'intercessory prayer', 'praying', 'ask the universe'],
    q: 'Does prayer work?',
    a: `Split the question, because two different things are being asked.

Intercessory prayer — praying for a distant stranger's recovery — has been tested properly. The large STEP trial in 2006 found no benefit, and patients who knew they were being prayed for did slightly worse, plausibly from performance anxiety. ◆ No evidence of a remote physical effect.

Prayer as practice is a different matter. Regular contemplative prayer shows the same kinds of benefit as other contemplative practice: reduced anxiety, improved affect regulation, a stronger sense of meaning and belonging. Articulating what you want and what you fear, aloud, to something you take seriously, is a genuinely useful psychological operation whether or not anyone receives it.

◆ Established for the practitioner, ◆ negative for action at a distance, ◆ myth for the metaphysics.

The order's phrasing: prayer reliably changes the one praying. Whether it does more than that is outside what we can check.`
  },
  {
    id: 'service-to-others',
    limb: 'law of one',
    keys: ['service to others', 'service to self', 'polarity law of one', 'sto', 'sts'],
    q: 'What does “service to others” actually mean in practice?',
    a: `In the Law of One it is one of two coherent orientations of the will — the other being service to self — and the material insists both are genuine paths, which is more interesting than it is usually reported.

Stripped of the cosmology, the practical content is recognisable and demanding: treat other beings' free will as nearly inviolable; help when help is wanted rather than when helping would feel good; do not override someone for their own benefit; accept that you cannot carry another's lesson for them.

The common failure mode is the one the material names repeatedly — service to self wearing the other's uniform. Helping in order to be the sort of person who helps. The test is whether you can serve invisibly, without the account being credited to you.

◆ Myth as cosmology, and worth taking seriously as ethics. It converges with Buddhist and Stoic accounts of right action, which is at least a point in its favour.`
  },
  {
    id: 'harvest',
    limb: 'law of one',
    keys: ['harvest', 'ascension', 'fourth density', '2012', 'shift', 'new earth'],
    q: 'Is there really a “harvest” or ascension coming?',
    a: `The Law of One describes a transition from third to fourth density, with individuals continuing according to their orientation. The surrounding culture attached dates to this — 2012 most famously — and those dates have come and gone.

The order's position is firm here: ◆ myth, and the dated versions have already failed. When a prediction fails, the honest move is to record the failure, not to reinterpret it as a "spiritual" or "energetic" shift that conveniently leaves no trace. That reinterpretation habit is the reliable signature of a failed prophecy, and it has been studied — Festinger's When Prophecy Fails documents the pattern exactly.

Note also what the belief does to people. Expecting imminent rescue is demobilising. It postpones the work and it encourages contempt for the ordinary world and its ordinary repairs.

If something like this is true, it will not require you to arrange your life around a date. Live as though the work is yours.`
  },
  {
    id: 'alien-contact-personal',
    limb: 'extraterrestrials',
    keys: ['i saw a ufo', 'i was abducted', 'my encounter', 'contact experience', 'something happened to me'],
    q: 'I think I had an encounter. What do I do?',
    a: `First: you are not mad, and this order will not treat you as though you are. Encounter experiences are overwhelmingly reported by people with no sign of mental illness, and the dismissal they usually meet does real damage.

Second, practically: write it down now, in full, dated, before the account settles into a story. Include what you were doing in the preceding hours, your sleep, anything you had taken, the weather, who else was present and what they saw. That record will be worth more later than any amount of recollection.

Third, a caution we give sincerely: avoid hypnotic regression. It feels like recovery and is a demonstrated generator of vivid false detail, and it will contaminate the one clean record you have.

Fourth: be wary of communities that need your experience to mean a particular thing. Your account is yours.

And if it left you frightened or unable to function, that is a matter for a clinician as well as for an order.`
  },
  {
    id: 'why-no-proof',
    limb: 'extraterrestrials',
    keys: ['why no proof', 'why dont they land', 'disclosure', 'why hide', 'government cover up'],
    q: 'If they are real, why no proof?',
    a: `Three answers, depending on which hypothesis you are holding.

If they are nuts-and-bolts craft, the absence is damning. Eighty years, billions of camera phones, every pocket carrying a sensor, and the image quality has not improved. That pattern fits a phenomenon of perception far better than a fleet of objects.

If the cover-up is real, the conspiracy is a harder claim than the craft: tens of thousands of participants across four continents and eight decades, zero documents, zero defectors with material. Secrets of that size do not hold — the Manhattan Project leaked within years.

If they are interdimensional and inter-density, as this order leans towards, then proof of the kind demanded may be categorically unavailable. Visibility would be their choice, and restraint consistent with a free-will ethic.

◆ Note honestly that the third answer explains the absence of evidence a little too comfortably. We hold it, and we hold the suspicion with it.`
  },

  /* ---------------------------------------- magic, alchemy, shadow ------- */
  {
    id: 'sigils',
    limb: 'magic',
    keys: ['sigil', 'how to make a sigil', 'chaos magic', 'servitor', 'spare'],
    q: 'How do sigils work?',
    a: `Mechanically, you compress a statement of intent into an abstract glyph, charge it in an intense state, then deliberately forget the original wording and leave the image to work below conscious attention. Austin Osman Spare developed the method; chaos magic made it standard.

The order's reading of the mechanism is psychological and, we think, sufficient. A sigil is a self-authored priming cue. It fixes an intention precisely, which most intentions never are; it bypasses the internal argument that dissolves most resolutions; and it recruits attention to opportunities matching the goal. The forgetting is the clever part — it removes the anxious monitoring that undermines the thing.

◆ Myth as metaphysics, ◆ speculative as psychology, and the components — implementation intentions, attentional priming — are ◆ established.

Caveat that matters: sigils work on things you can act on. They do not reach across the world and rearrange it, and treating them as though they do is how magical practice turns into avoidance.`
  },
  {
    id: 'curses',
    limb: 'magic',
    keys: ['curse', 'hex', 'cursed', 'psychic attack', 'black magic', 'someone cursed me'],
    q: 'Can someone curse me?',
    a: `Not by action at a distance, and yes by a route that is entirely real and worth taking seriously.

The documented mechanism is nocebo. In cultures with strong shared belief in sorcery, people have genuinely sickened and in extreme cases died after learning they were cursed — the anthropological literature on so-called voodoo death is substantial. The agent is not the curse. It is the belief, operating through chronic stress, appetite loss, withdrawal and in some accounts catecholamine-driven cardiac events.

So the protective measure is not a counter-ritual, though if a ritual quiets you then it is doing useful psychological work and we will not sneer at it. The protection is refusing the premise.

◆ Established for the nocebo pathway, ◆ nothing for the transmission. If you are frightened, the problem to solve is the fear, which is real, rather than the hex, which has to go through your own nervous system to reach you at all.`
  },
  {
    id: 'ritual-why',
    limb: 'magic',
    keys: ['why ritual', 'what is ritual for', 'does ritual matter', 'ceremony'],
    q: 'What is ritual actually for?',
    a: `For marking, binding and shifting — three jobs ordinary life does badly.

Marking: human beings do not metabolise transitions well without ceremony. Grief without a funeral, a change of life without a rite, a commitment without a witness — these tend to stay unfinished. ◆ There is genuine anthropological and psychological support for this.

Binding: synchronised action — chanting, drumming, moving together — reliably increases group cohesion and cooperation in experiments. Costly or effortful rituals bind harder. This is measurable and somewhat unsettling.

Shifting: repetition, rhythm, restricted sensory input and sustained attention move the nervous system into a different mode. The incense and the candlelight are not decoration; they are inputs.

◆ Established for all three functions, ◆ myth for any claim about efficacy beyond the participants.

The order's practical rule: a ritual with no content is theatre, and a resolution with no ritual rarely survives the month. Build ones you would not be embarrassed to explain.`
  },
  {
    id: 'tarot',
    limb: 'magic',
    keys: ['tarot', 'cards', 'divination', 'i ching', 'runes', 'oracle cards'],
    q: 'Is there anything to tarot and divination?',
    a: `As prediction, no — and no divinatory system has ever performed above chance under controlled conditions.

As a technique for thinking, genuinely yes. A random image handed to you at a moment of difficulty forces an association you would not have reached by deliberation. You project onto it, and what you project is information about you. The spread's structure makes you consider positions — what is hidden, what is ending, what opposes — that you would otherwise skip. It is a disciplined interruption of your own habitual framing.

◆ Myth as divination, ◆ speculative as projective psychology, though the underlying mechanism is well understood.

The history is worth knowing: tarot begins as a fifteenth-century Italian card game. Its occult meanings are eighteenth-century French inventions, chiefly Court de Gébelin and Etteilla, and the Egyptian pedigree is fabricated. A real tradition, 250 years old, not 5,000. Say so and you can use it honestly.`
  },
  {
    id: 'alchemy-practice',
    limb: 'alchemy',
    keys: ['how to practise alchemy', 'inner alchemy', 'nigredo', 'albedo', 'magnum opus', 'alchemical stages'],
    q: 'What are the stages of the alchemical work?',
    a: `The classical sequence is nigredo, albedo, citrinitas, rubedo — blackening, whitening, yellowing, reddening — though sources disagree and some collapse it to three.

Read chemically it describes putrefaction, purification, and the emergence of something stable. Read psychologically, which is how Jung read it and how most moderns encounter it: nigredo is the encounter with your own material, the dissolution and the depression that attends it; albedo is the washing, the separating of what is yours from what you absorbed; citrinitas is dawning understanding; rubedo is integration — the thing brought back into ordinary life and made useful.

◆ Scholarship for the texts and the laboratory history, ◆ myth for the transformation claims, ◆ speculative for Jung's psychological reading, which is illuminating and not demonstrated.

The honest observation is that the sequence matches the shape of real personal change unusually well, including the part everyone wants to skip. There is no route to albedo that does not pass through the black.`
  },
  {
    id: 'elements',
    limb: 'alchemy',
    keys: ['four elements', 'earth air fire water', 'elemental', 'fifth element', 'aether'],
    q: 'What use are the four elements if chemistry replaced them?',
    a: `Chemistry replaced them as a theory of matter and did not replace them as a taxonomy of experience, which is a distinction worth holding.

◆ As physics, dead: Empedocles and Aristotle were wrong, and the periodic table is the correct account. Nobody should be doing science with fire and water.

◆ As scholarship, they organised Western medicine, psychology and cosmology for two thousand years — humours, temperaments, the qualities hot, cold, wet and dry — and you cannot read any pre-modern text without them.

◆ As practice, they remain a serviceable set of coordinates for states of mind: earth for the stable and the stubborn, water for feeling and dissolution, air for thought and detachment, fire for will and destruction. Four questions to ask of a situation, rather than four substances.

The order's tenth limb holds them in exactly that way — as a lens, named as a lens. The trouble only starts when someone claims a physical mechanism for them.`
  },
  {
    id: 'runes-stolen',
    limb: 'shadow',
    keys: ['runes', 'swastika', 'stolen symbols', 'black sun', 'sonnenrad', 'can i use runes'],
    q: 'Can I still use runes and other symbols the far right stole?',
    a: `Yes, with knowledge, and the knowledge is not optional.

◆ Scholarship: the swastika is a solar and auspicious symbol across at least five millennia and many unconnected cultures, and remains sacred in Hinduism, Buddhism and Jainism. Elder Futhark runes are a genuine Germanic writing system from roughly the second century. The Sonnenrad or "black sun" is different — its famous form is a floor mosaic installed at Wewelsburg under the SS, and it has no pre-Nazi pedigree worth speaking of.

So the cases differ. Some symbols were stolen, some were manufactured. Learn which you are holding.

The order's position: refusing to use stolen symbols cedes five thousand years of human heritage to the people who stole them, which is a strange victory to hand over. But using them in ignorance, or being coy about the theft, is how a sign becomes a signal. Name the theft. Then carry the symbol properly.`
  },
  {
    id: 'esoteric-fascism',
    limb: 'shadow',
    keys: ['esoteric fascism', 'traditionalism', 'evola', 'ariosophy', 'occult nazi', 'thule'],
    q: 'Why does the esoteric scene keep drifting towards the far right?',
    a: `Because several of its structural habits are exactly the handholds authoritarian politics needs, and pretending otherwise is how it keeps happening.

The handholds: a hunger for hidden knowledge, which makes conspiracy thinking feel like discernment. Hierarchies of initiation, which normalise the idea that some people are simply more advanced. Golden-age nostalgia, which needs a story about who ruined it. Distrust of institutions and expertise, which leaves nothing to check a claim against. And the lure of a lineage, which rewards the fabricators.

◆ Scholarship: Goodrick-Clarke's The Occult Roots of Nazism traces Ariosophy and List and Lanz precisely; Evola's Traditionalism remains directly influential on the contemporary far right. This is documented history, not insinuation.

The Shadow Cabinet exists for this. Nothing in this order romanticises it: it was an industrial atrocity dressed in stolen runes. Study it the way you study a pathogen — closely, and with gloves.`
  },
  {
    id: 'spiritual-bypass',
    limb: 'shadow',
    keys: ['spiritual bypassing', 'toxic positivity', 'love and light', 'avoiding', 'bypass'],
    q: 'What is spiritual bypassing, and am I doing it?',
    a: `John Welwood's term for using spiritual practice and belief to avoid unfinished psychological business — which it is extraordinarily good at, because the avoidance looks like progress from the inside.

The signatures: reframing every grievance as a lesson so that no one is ever accountable. Treating anger as unevolved rather than as information. "Everything happens for a reason" deployed at someone else's catastrophe. Calm that cannot survive contradiction. Pursuing states instead of changes. Forgiving quickly to avoid the harder work of feeling the injury.

Am I doing it? The usable test: does your practice make you easier to be honest with, or harder? Ask someone who loves you and is not impressed by you.

◆ Clinically recognised and widely observed, ◆ not formally studied to any great extent.

The order's framing is enforced integration — the feelings, choices and paths of previous beings and of your own history, positive and negative alike, nothing disowned. You cannot transcend what you have not admitted.`
  },
  {
    id: 'guru-warning',
    limb: 'shadow',
    keys: ['guru', 'teacher', 'cult', 'am i in a cult', 'spiritual leader', 'how to spot a cult'],
    q: 'How do I tell a real teacher from a cult?',
    a: `By structure rather than by doctrine. Beliefs vary enormously; the architecture of harm is remarkably consistent.

Warning signs: the teacher is beyond question, and questioning is reframed as your defect. Information is tiered, with the real teaching reserved for insiders. Contact with outside relationships is discouraged. Leaving is framed as catastrophe or betrayal. Financial demands escalate. Sexual access flows to the leader. There is a special enemy. And nobody can describe what evidence would show the teacher wrong.

Healthy signs: the teacher wants you to need them less over time. Disagreement is tolerated and sometimes welcomed. Money is boringly transparent. Former students speak well of the place and are not shunned. The teacher has peers who can contradict them.

◆ Scholarship: this maps onto Lifton's criteria for thought reform, which have held up for seventy years.

Apply it here too. If EGregoRA ever stops publishing its own corrections, leave.`
  },

  /* ------------------------------------------------- practice & order ---- */
  {
    id: 'practice-daily',
    limb: 'practice',
    keys: ['daily practice', 'what should i do every day', 'routine', 'discipline', 'how often'],
    q: 'What should a daily practice look like?',
    a: `Small, fixed, and boring enough to survive a bad week. That is the entire technology.

A defensible minimum, in order of evidence: protect sleep first, because nothing else works on four hours. Ten minutes of sitting, same time, same place. Twenty minutes outdoors without a destination or a phone. Three lines written at night about what actually happened, dated.

That is it. Thirty-five minutes. Notice there is nothing to buy and nothing to believe.

Add seasonally rather than daily — a longer walk at the solstices, a fast or a vigil if those suit you, one difficult book at a time.

The failure mode is always the same: an elaborate scheme kept for eleven days and then abandoned with a sense of personal failure, which costs more than the practice would have gained. Halve whatever you were planning. You can always add once the smaller thing has survived three months.`
  },
  {
    id: 'bad-trip',
    limb: 'practice',
    keys: ['bad trip', 'difficult experience', 'panic', 'frightening', 'integration', 'after a trip'],
    q: 'How do I handle a difficult inner experience?',
    a: `During: do not fight it. Resistance is most of the suffering in a difficult state. Change posture, change room, get to open air, put on familiar music, find water. Tell someone you trust that you are having a hard time — saying it aloud breaks the loop more often than not. Remember that it will end, because it will.

Afterwards: integration is the part everyone skips and the part that does the work. Write the account the same day. Wait a week before deciding what it meant — early interpretations are usually the mind grabbing the nearest available story. Talk to someone who will neither dismiss it nor inflate it. Change one concrete thing in your life as a result, or the insight evaporates.

◆ Established practice in the clinical psychedelic literature, where integration sessions are standard.

If distress persists for days, if sleep breaks down, or if the boundaries of ordinary reality do not re-establish, that is a clinician's matter. Say so early.`
  },
  {
    id: 'reading-order',
    limb: 'practice',
    keys: ['what should i read', 'reading list', 'books', 'where to begin reading', 'recommend a book'],
    q: 'What should I read first?',
    a: `Four books, one from each shelf, and read them in this order.

◆ Science: Philip Ball, Patterns in Nature — the real mathematics of natural form, illustrated, and it will inoculate you against most sacred-geometry overreach without making you cynical.

◆ Scepticism: Carl Sagan, The Demon-Haunted World — written by a man who spent his life looking for aliens, which is exactly what gives it authority.

◆ Scholarship: Ronald Hutton, The Triumph of the Moon — the honest history of modern pagan witchcraft, by a historian who likes his subject and tells the truth about it anyway.

◆ Primary esoteric text: pick one and read it whole rather than in quotations. The Law of One, or the Corpus Hermeticum, or the Tao Te Ching.

Then the full list is on the Further Research page. Read primary sources wherever you can; most esoteric facts are a chain of books quoting books, and about half the chains end in nobody's guess.`
  },
  {
    id: 'ask-question',
    limb: 'order',
    keys: ['ask ed', 'how do i ask', 'submit a question', 'can i email', 'contact'],
    q: 'How do I ask Ed something this oracle cannot answer?',
    a: `Use the form on the Ask Ed page. Questions go into the order's book and the good ones get answered properly — some in writing, some on the podcast, where a question with a real difficulty in it is worth an episode.

What makes a question answerable: be specific, say what you have already tried or read, and say what would change your mind. "Is astrology real" is a lecture. "I have found birth charts uncannily accurate about three friends and I want to know whether I am fooling myself" is a conversation.

What this oracle is: 320 written answers composed in the order's voice, matched to your words. When nothing fits well, it says so rather than inventing — a machine confidently making things up is the exact opposite of what an order of enquiry is for.

If you want to argue with something on this site, that is also welcome, and more useful to us than agreement.`
  },
  {
    id: 'who-is-jim',
    limb: 'order',
    keys: ['jim rankin', 'who is jim', 'other co-founder', 'co founder'],
    q: 'Who is Jim Rankin?',
    a: `Co-founder of EGregoRA, Ed's understudy, and on the better days his muse.

Where Ed presses a question until it yields, Jim is the one who asks why that question and not another. A good deal of what the order now calls its own began as something Jim said sideways and Ed refused to let go of — the pursuit and the provocation, which are two halves of one method rather than a senior and a junior partner.

The order was co-founded, is described as co-founded everywhere on this site, and that is not a courtesy. An egregore built by one mind is just a preoccupation. It takes a second voice, reliably disagreeing, before the thing can be said to have a life of its own.

He is also the reason there is a tenth limb, and the reason the tagline is three words rather than eight.`
  },
  {
    id: 'why-grades',
    limb: 'order',
    keys: ['grading', 'diamond symbols', 'what do the diamonds mean', 'why grade', 'ledger'],
    q: 'Why grade everything with those diamonds?',
    a: `Because the alternative is the swamp that most of this territory has become.

Four shelves, and nothing may sit on two at once. ◆ Established science: replicated, measured, would be abandoned if the measurements changed. ◆ Scholarship and history: documented, sourced, argued about by people with footnotes. ◆ Speculative and contested: serious, unresolved, might go either way. ◆ Myth, tradition and primary esoteric text: ancient, meaningful, not making an empirical claim it could lose.

All four are worth your evening. The grading is not a hierarchy of value — the myth shelf holds some of the best material we have.

Confusing them is the only sin this order recognises, and it is the mechanism by which an honest tradition becomes a scam: a ◆ myth claim quietly promoted to ◆ science because it would be more impressive there. Once you can see the move, you cannot unsee it, and you will notice how much of the market depends on it.`
  },
  {
    id: 'changed-mind',
    limb: 'order',
    keys: ['what have you been wrong about', 'changed your mind', 'admit', 'mistake', 'corrections'],
    q: 'What has this order changed its mind about?',
    a: `A fair question, and one we think every order should be asked.

The mother-tree account of forest cooperation: we taught it with more confidence than the field evidence supports, and the 2023 reviews corrected us. Microdosing: the self-blinding and placebo-controlled results went against our expectations and we had to follow them. The Osireion dating, which we repeated at second hand before checking the Greek graffiti. And the general habit of treating the nuts-and-bolts alien hypothesis as the serious one and the interdimensional reading as the embarrassing one — we now think that is backwards, while holding the new position at the grade it deserves.

Each of those is still on the site, corrected in place rather than quietly deleted.

The commitment is simple: a belief you have never pressed on is furniture, not knowledge. Test everything kindly, and that has to include us.`
  }
  ,
  {
    id: 'synchronicity',
    limb: 'practice',
    keys: ['synchronicity', 'coincidence', 'signs', 'the universe is telling me', 'meaningful coincidence', '1111'],
    q: 'Are synchronicities meaningful or just coincidence?',
    a: `Both, and the interesting part is that this is not a fudge.

The statistics first. You encounter an enormous number of events daily, you are a world-class pattern detector, and you only notice the hits. The birthday problem is the standard demonstration: in a room of 23 people the odds of a shared birthday are better than even, which almost nobody intuits. Once you start seeing 11:11, you check the clock more often at 11:11. ◆ Established: most synchronicity is selective attention plus base rates.

Jung's claim was different and ◆ speculative — an acausal connecting principle linking inner state and outer event by meaning rather than cause. It is not testable in its current form and has not advanced much in seventy years.

What the order suggests doing with them: treat a synchronicity as a prompt rather than an instruction. The useful question is never "what is the universe telling me" but "why was I primed to notice that, today."`
  },
  {
    id: 'solstice',
    limb: 'practice',
    keys: ['solstice', 'equinox', 'how to mark the seasons', 'stonehenge', 'newgrange', 'seasonal ritual'],
    q: 'How should I mark a solstice?',
    a: `Simply, outdoors, and preferably at the inconvenient hour. The inconvenience is doing some of the work.

◆ Established: the astronomical alignments at Newgrange, around 3200 BCE, and at Stonehenge are real and precise — the Newgrange roof-box admits the midwinter sunrise along a nineteen-metre passage. People have been doing this with great seriousness for five thousand years.

◆ Myth: most of the specific modern ceremony. The eight-festival Wheel of the Year was assembled in the mid-twentieth century; it is a good structure and a young one.

A practical form that needs no tradition: be awake before dawn. Go to the same place each year. Note what has changed in you since the last one and say it aloud or write it. Eat something afterwards with other people.

The point is not the sun, which is indifferent. It is having one fixed annual coordinate against which to measure a life that otherwise blurs.`
  },
  {
    id: 'is-this-ai',
    limb: 'order',
    keys: ['are you ai', 'bot', 'robot', 'machine', 'human', 'is this a bot', 'who wrote this', 'chatgpt', 'is this a real person', 'how does this oracle work'],
    q: 'Am I talking to a real person or a machine?',
    a: `Neither, exactly, and you are owed a straight answer.

What you are reading is one of 320 answers written in advance, in the order's voice and under its grading rules, and selected by matching the words of your question against them. No model is generating this sentence. When nothing in the corpus fits your question well, the oracle says so and offers the nearest things it does have, rather than improvising — an order of enquiry producing confident invention would be a contradiction in terms.

Ed and Jim stand behind the content. The matching is a machine's work; the claims are theirs.

If a model fallback is ever enabled, it will be labelled in the response, and it will be held to the same rules: grade the claim, cite where you can, and say plainly when you do not know.

For anything outside what is written here, use the form on the Ask Ed page and a human will read it.`
  }

];
