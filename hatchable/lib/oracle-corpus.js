/**
 * The Oracle's written answers.
 *
 * Shared with ShakDrah on The Two Infinities: the two oracles carry one
 * corpus, mirrored by scripts/oracle-sync.py and gated in CI by
 * scripts/oracle-validate.mjs, which also requires that every entry be
 * reachable — ask it its own question and it must win the match.
 *
 * Composed for EGregoRA in the order's voice and graded by the house rules
 * (science / scholarship / speculative / myth). The matcher in
 * api/ask.js scores a visitor's question against the `keys` of each entry and
 * serves the best fit; a model call is only attempted when nothing here is a
 * good enough match.
 */

import { MORE } from './oracle-corpus-more.js';
import { VOL3 } from './oracle-corpus-iii.js';
import { VOL4 } from './oracle-corpus-iv.js';
import { VOL5 } from './oracle-corpus-v.js';
import { VOL6 } from './oracle-corpus-vi.js';
import { VOL7 } from './oracle-corpus-vii.js';
import { VOL8 } from './oracle-corpus-viii.js';
import { VOL9 } from './oracle-corpus-ix.js';
import { VOL10 } from './oracle-corpus-x.js';
import { VOL11 } from './oracle-corpus-xi.js';
import { VOL12 } from './oracle-corpus-xii.js';
import { VOL13 } from './oracle-corpus-xiii.js';
import { VOL14 } from './oracle-corpus-xiv.js';
import { VOL15 } from './oracle-corpus-xv.js';
import { VOL16 } from './oracle-corpus-xvi.js';
import { VOL17 } from './oracle-corpus-xvii.js';
import { VOL19 } from './oracle-corpus-xix.js';
import { VOL18 } from './oracle-corpus-xviii.js';
import { VOL20 } from './oracle-corpus-xx.js';
import { VOL21 } from './oracle-corpus-xxi.js';
import { VOL22 } from './oracle-corpus-xxii.js';
import { VOL23 } from './oracle-corpus-xxiii.js';
import { VOL24 } from './oracle-corpus-xxiv.js';
import { VOL25 } from './oracle-corpus-xxv.js';
import { VOL26 } from './oracle-corpus-xxvi.js';
import { VOL27 } from './oracle-corpus-xxvii.js';
import { VOL28 } from './oracle-corpus-xxviii.js';
import { VOL29 } from './oracle-corpus-xxix.js';
import { VOL30 } from './oracle-corpus-xxx.js';
import { VOL31 } from './oracle-corpus-xxxi.js';
import { VOL32 } from './oracle-corpus-xxxii.js';
import { VOL33 } from './oracle-corpus-xxxiii.js';
import { VOL34 } from './oracle-corpus-xxxiv.js';

const BASE = [
 {
 id: 'egregore',
 limb: 'foundations',
 keys: ['egregore', 'egregora', 'thought form', 'thoughtform', 'group mind', 'why called', 'what does the name'],
 q: 'What is an egregore, and why that name?',
 a: `An egregore is the old name for a thought-form grown large: the thing that forms when enough minds attend to the same idea for long enough that it begins to attend back. A grove, a guild, a nation, a football club, a scientific paradigm — each behaves like an entity with appetites and a memory, though nothing in it is alive in the way you are. It is fed by attention and starves without it.

EGregoRA is one built deliberately and in daylight, with its hands open. EG for its co-founder Edward Gregory, RA for the old solar name that keeps surfacing wherever people go looking for a source.

Where does that sit on the ledger? The sociology is solid — collective behaviour, institutional memory, norm cascades are measured things. The claim that an egregore is in any sense conscious is myth, and we file it there. The useful part needs no metaphysics at all: whatever you attend to together, you are building, whether or not you meant to.`
 },
 {
 id: 'astrology-real',
 limb: 'astrology',
 keys: ['astrology', 'horoscope', 'star sign', 'zodiac', 'birth chart', 'planets affect', 'real'],
 q: 'Is astrology real?',
 a: `Two answers, and both matter.

As a symbolic system with four millennia of continuous use — real, demonstrably, and enormously consequential. It gave us the calendar habits, the hours, much of the vocabulary we still use for character, and a library of images for time and temperament that nothing has replaced. Studying it is studying how humans mapped meaning onto the sky.

As a physical force by which Saturn's position alters your week — no. Every controlled test has failed. Shawn Carlson's double-blind study in Nature (1985) is the famous one; Geoffrey Dean's meta-analyses are the thorough ones. Astrologers could not match charts to personality profiles above chance.

So we study it as scholarship and use it, if at all, as a mirror — a set of prompts that make you say something true about yourself you would not otherwise have said. That is a real effect. It is just not an astronomical one.`
 },
 {
 id: 'golden-angle',
 limb: 'geometry',
 keys: ['137.5', 'golden angle', 'phyllotaxis', 'fibonacci', 'sunflower', 'spiral', 'phi', 'golden ratio'],
 q: 'Why 137.5 degrees and not 120?',
 a: `Because 137.5° is the one angle that never lets a new leaf sit directly above an old one.

Put each new primordium a fixed turn around the stem from the last. If that turn is a rational fraction of a circle — 120°, say, which is one third — then after three steps you are back where you started, and every fourth leaf shadows the first. Rational angles produce rays; rays produce shadow and waste.

The golden angle, 360°/φ² ≈ 137.507°, is the hardest number to approximate with a simple fraction, so the pattern never closes. Each new element falls into the largest remaining gap. The Fibonacci parastichies you count on a sunflower — 34 one way, 55 the other — are a consequence, not a cause.

This is established science: Douady and Couder got the same spirals from ferrofluid droplets repelling each other in a dish, no genetics involved. Beautiful, and entirely mundane. Which is the best kind of beautiful.`
 },
 {
 id: 'law-of-one',
 limb: 'law of one',
 keys: ['law of one', 'ra material', 'ra', 'density', 'service to others', 'channelled', 'confederation'],
 q: 'Does the Law of One hold up?',
 a: `As cosmology, it is untestable, and we should say so plainly. Densities, harvests, the Confederation — none of it makes a prediction that could fail. That is not a small objection; it is the whole of the scientific objection.

As philosophy it is far more interesting than its reputation suggests. Strip the science-fiction furniture and the core is this: consciousness is unitary, separation is the condition that makes experience possible, and free will is so nearly sacred that it will not be overridden even to help. That intuition is in good company — Advaita Vedanta, Plotinus, Eckhart, Whitehead's process theology. The Ra material's distinctive move is making polarity, the chosen orientation of the will, the hinge of the whole thing.

Read it as a text rather than a transcript and it rewards you. Read it as a report from somewhere and you have left the ledger we keep. Myth and primary esoteric text — which is a respectable shelf, not a dismissal.`
 },
 {
 id: 'psychedelics-brain',
 limb: 'neuroscience',
 keys: ['psychedelic', 'psilocybin', 'lsd', 'mushroom', 'shroom', 'ayahuasca', 'dmt', 'mescaline', 'entropic brain', 'default mode', 'dmn', 'ego dissolution', 'trip', 'hallucinogen'],
 q: 'What do psychedelics actually do to the brain?',
 a: `The best current account is predictive processing. Your brain is not receiving the world; it is guessing the world and correcting the guess. Perception is a controlled hallucination held in check by sensory evidence.

Serotonergic psychedelics act on 5-HT2A receptors, densely expressed on deep-layer cortical pyramidal cells, and the effect is to weaken the grip of high-level priors. Carhart-Harris and Friston call it REBUS — relaxed beliefs under psychedelics. Measured consequences: default mode network coherence falls, the self-model loosens, and regions that normally keep to themselves start talking.

Two honest cautions. Higher entropy is higher plasticity, not higher accuracy — the state that makes new connections cheap also makes false certainty cheap. And this is established science about mechanism, not an endorsement: EGregoRA gives no advice on taking anything, and these substances are controlled in most jurisdictions and genuinely hazardous for some people.

Read Pollan for the story, the Johns Hopkins trials for the data, and William James for everything the data still misses.`
 },
 {
 id: 'mother-tree',
 limb: 'trees',
 keys: ['tree', 'trees', 'mycorrhizal', 'wood wide web', 'fungi', 'forest', 'communicate', 'talk'],
 q: 'Do trees really talk to each other?',
 a: `Something real is happening, and the popular phrasing oversells it.

What is well evidenced: most trees live in obligate partnership with mycorrhizal fungi, trading sugar for phosphorus and water across an interface of enormous surface area. Carbon labelled with isotopes does move between trees through fungal networks — Suzanne Simard's work showed this in the field. Trees also release volatile compounds when attacked, and neighbours downwind mount defences.

What is not established: intention, altruism, or a mother tree deliberately feeding her young. Transfer happens along gradients, and the fungus is an agent with its own interests, not a cable. Some ecologists think the network is better read as a fungal marketplace, occasionally a parasitic one, than as a forest commons.

Science for the plumbing, speculative for the purpose. The grove is stranger and less sentimental than the bestselling version — which is the usual direction of travel once you look properly.`
 },
 {
 id: 'nazi-occult',
 limb: 'shadow',
 keys: ['nazi', 'nazis', 'hitler', 'himmler', 'thule', 'ahnenerbe', 'occult roots', 'fascism', 'runes', 'swastika'],
 q: 'Did the Nazis really practise occultism?',
 a: `Partly, and it has been wildly exaggerated — and both halves of that sentence do work.

What is documented: Himmler was credulous, and the SS Ahnenerbe funded pseudo-archaeology, runic mysticism and expeditions chasing an Aryan prehistory that never existed. The Thule Society fed personnel and symbolism into the early party. Goodrick-Clarke's The Occult Roots of Nazism is the sober account; Kurlander's Hitler's Monsters maps how far the supernatural imaginary reached.

What is myth: Hitler as an initiate, a hidden magical order steering the war, the Spear of Destiny. Hitler was mostly contemptuous of Himmler's enthusiasms. Most of this genre descends from post-war sensationalism, not archives.

The lesson the Black Tribunal exists for is not that occultism causes fascism. It is that fascism loots whatever symbolic system is to hand, and symbols have no immune system of their own. The swastika was auspicious across Eurasia for millennia before it was stolen. Learn how the theft is done, and you can start giving things back.

Never study the symbols without the consequences: Levi, Arendt, and Eco's fourteen signs of Ur-Fascism belong beside every book listed above.`
 },
 {
 id: 'magic-definition',
 limb: 'magic',
 keys: ['magic', 'magick', 'spell', 'ritual', 'sigil', 'wizard', 'does magic work', 'witchcraft'],
 q: 'Does magic work?',
 a: `Define it operationally and the question becomes answerable.

Magic, as this order uses the word, is the deliberate use of symbol, attention and ritual to reconfigure a mind — and through that mind, a life. On that definition it plainly works, and the mechanisms are not mysterious: attention is a finite resource and ritual directs it; expectancy has measurable physiological effects; a memory palace really does make you able to recall a thousand items; committing to something publicly and symbolically changes what you then do.

If instead you mean causing an event at a distance with no physical mediation, there is no good evidence, and a century of attempts to find it has produced effect sizes that shrink as the protocols tighten.

So: science for the psychology of ritual, myth for the metaphysics. The wizard is an applied psychologist with better robes — and that is not a demotion. Most people never learn to direct their own attention at all.`
 },
 {
 id: 'alchemy',
 limb: 'alchemy',
 keys: ['alchemy', 'alchemical', 'nigredo', 'rubedo', 'philosophers stone', 'elements', 'elemental', 'mercury', 'sulphur', 'transmutation'],
 q: 'Was alchemy just failed chemistry?',
 a: `No — and Lawrence Principe settled this by doing the experiments. Follow the recipes with period materials and they work: the glassware, the reagents, the quantitative habits are real chemistry under a symbolic skin. Newton and Boyle were practitioners, not dabblers, and chymistry became chemistry by continuity, not conquest.

The four elements were never a bad theory of matter; they were a working taxonomy of states and tendencies — solid, flowing, volatile, transforming. We still use it. We just call it phase.

Then there is the opus: nigredo, albedo, citrinitas, rubedo. Blackening, whitening, yellowing, reddening. Jung read that sequence as a map of individuation — dissolution, purification, dawning, integration — and whatever you make of his metaphysics, the stages describe how people actually come apart and reassemble.

Scholarship for the history, science for the chemistry, myth for the stone. Solve et coagula: dissolve and recombine. It is good advice about matter and better advice about selves.`
 },
 {
 id: 'aliens',
 limb: 'contact',
 keys: ['alien', 'aliens', 'ufo', 'uap', 'extraterrestrial', 'fermi', 'drake', 'contact', 'disclosure'],
 q: 'Are we alone — and what about the UAP footage?',
 a: `Nobody knows, and anyone who tells you otherwise is selling something.

The honest structure of the question: the Drake equation is a way of organising our ignorance, not a calculation — the biological terms are unconstrained by a single data point. Fermi's paradox is only a paradox if you assume expansion is cheap and inevitable, which we have no basis for.

On UAP: read the 2021 and 2023 ODNI reports themselves rather than what people say is in them. The honest summary is that a residue of incidents remains unexplained, and unexplained means unexplained — not explained as craft. Sensor artefacts, parallax and the limits of gun-camera optics account for more of the famous footage than enthusiasts admit.

The most useful lens may be Vallée's: whatever the phenomenon is, its folklore behaves exactly like older folklore — fairy abduction, night visitors, the same narrative grammar in new costume. That is a fact about the reports, and it is interesting whichever way the physics falls.

Speculative, held open. Holding a question open without filling it is a skill, and this order treats it as one.`
 },
 {
 id: 'consciousness',
 limb: 'neuroscience',
 keys: ['consciousness', 'conscious', 'hard problem', 'qualia', 'awareness', 'panpsychism', 'sentience', 'what is the self'],
 q: 'What is consciousness?',
 a: `Unsolved. Genuinely, not coyly.

We have made real progress on the easy problems, which are not easy: which processes correlate with report, how attention gates access, why anaesthesia takes the lights out. Anil Seth's framing — the self as another controlled hallucination, a model the brain builds of the body it is steering — is the most productive account going, and it predicts real illusions.

The hard problem is untouched. Nothing in the functional story explains why any of it is like anything from the inside. Integrated Information Theory tries to make the question quantitative and gets strange results; global workspace theory describes the traffic and skirts the question; panpsychism solves it by declaring it never needed solving, which is either profound or a shrug in formal dress.

This order's position: hold the mystery without filling it with the first available mysticism. The Law of One's answer — that awareness is the ground rather than the product — is myth here, not science. That does not make it uninteresting. It makes it unproven.`
 },
 {
 id: 'meditation',
 limb: 'neuroscience',
 keys: ['meditation', 'meditate', 'breath', 'mindfulness', 'practice', 'how do i start', 'trance'],
 q: 'How should I actually start meditating?',
 a: `Shorter and duller than you expect, and far more often.

Ten minutes, same time daily, one object of attention — the breath at the nostrils is traditional because it is always present and mildly boring. When you notice you have wandered, that noticing is the repetition; return without commentary. The wandering is not failure, it is the exercise. People quit because they believe the quiet mind is the goal, when the goal is the return.

What is measured: reduced amygdala reactivity, attentional improvements, modest but real effects on anxiety and relapse in depression. What is oversold: enlightenment timelines, claims about 432 Hz, and most apps.

One caution we take seriously — intensive retreat practice can destabilise some people, and the literature on adverse effects is thin but not empty. If you have a history of psychosis or severe dissociation, do this with a clinician's knowledge.

Add ritual if it helps: a candle, a fixed seat, the same gesture to begin. That is the magic limb doing exactly what it claims — structuring attention.`
 },
 {
 id: 'entropy-time',
 limb: 'physics',
 keys: ['entropy', 'time', 'arrow of time', 'thermodynamics', 'second law', 'why does time'],
 q: 'Why does time only go one way?',
 a: `Because of how it started, not because of how it works.

Nearly every fundamental law is time-symmetric — run the equations backwards and nothing protests. The asymmetry we live in is statistical: there are overwhelmingly more disordered arrangements than ordered ones, so a system wandering blindly through its possibilities drifts towards disorder. That is the second law, and it is a counting argument, not a force.

Which leaves the real question: why was the past so extraordinarily ordered? The early universe was in a state of fantastically low entropy, and nothing in the laws requires it to have been. This is the past hypothesis, and it is the actual mystery. Sean Carroll's From Eternity to Here is the best long treatment; Rovelli's The Order of Time the most beautiful short one.

So the arrow you feel — memory of the past, not the future; cream mixing into coffee and never out — traces back to a single unexplained boundary condition at the beginning of everything. Established science, with a hole at the far end you can put your arm through.`
 },
 {
 id: 'sacred-geometry-limits',
 limb: 'geometry',
 keys: ['sacred geometry', 'flower of life', 'metatron', 'platonic solids', 'is it real', 'nonsense', 'pyramid'],
 q: 'How much of sacred geometry is nonsense?',
 a: `A fair amount, and the honest parts are better than the nonsense.

What survives measurement: the Platonic solids really are the only five regular convex polyhedra, and Euclid's proof of that is one of the most satisfying objects in human thought. Close-packing, minimal surfaces, hexagonal tiling in foams and honeycomb, phyllotaxis — all real, all explicable, all genuinely gorgeous.

What does not: φ in the Parthenon and the Great Pyramid, mostly produced by choosing which lines to measure and where to stop. The golden ratio in credit cards and faces — no. Mario Livio's The Golden Ratio documents the debunking in detail and is the book to read if you want your assumptions dented.

The Flower of Life and Metatron's Cube are beautiful as emblems and as a drawing exercise in compass geometry. As claims about physics, they are myth.

Our rule: if a geometric claim can be measured, measure it. If it can only be felt, enjoy it as ornament — this site is covered in it — and do not promote it to a fact.`
 },
 {
 id: 'god',
 limb: 'god',
 keys: ['god', 'does god exist', 'religion', 'divine', 'faith', 'creator', 'atheist'],
 q: 'Does God exist?',
 a: `Not a question this order answers for you, and not because we are being evasive.

What we can do is sort the question. The cosmological arguments establish, at best, that something is unexplained — and physics agrees, which is why fine-tuning is a live conversation rather than a settled one. The design argument lost its biological branch to Darwin and keeps its cosmological branch in a contested state. The problem of suffering remains the strongest objection and has no answer that satisfies everybody who has actually suffered.

What interests us more is the convergence. Mystics from unconnected traditions — Plotinus, Shankara, Eckhart, Ibn Arabi — report something strikingly similar when they go looking inwardly: unity, the dissolution of the observer, an impression of ground rather than object. That convergence is real data about human minds. Whether it is data about the cosmos is exactly the thing at issue.

Ed's practical position: whatever you conclude, it should cost you something. A God who only ever agrees with you is a mirror, not a deity.`
 },
 {
 id: 'symbiosis',
 limb: 'biology',
 keys: ['symbiosis', 'margulis', 'mitochondria', 'evolution', 'cooperation', 'life', 'origin of life'],
 q: 'Is life about competition or cooperation?',
 a: `Both, and the deepest events were mergers.

Lynn Margulis was mocked for decades for arguing that mitochondria and chloroplasts are captured bacteria. She was right. Every complex cell on this planet is a fusion of lineages, and the single most consequential event in the history of life was one cell failing to digest another. That is established science now, and it reframes everything.

Nick Lane's work pushes it further: eukaryotic complexity may have been unlocked by that merger because it solved an energy problem no single-membrane organism could solve. Lichens are a partnership. Your gut is an ecosystem you could not live a month without. Mycorrhizae built forests.

None of which abolishes competition — the partnerships are riddled with cheating, policing and exploitation, and symbiosis slides into parasitism constantly.

The useful correction is to the story we tell: nature is not primarily red in tooth and claw. It is a very large number of negotiated settlements, some of which have been running for two billion years.`
 },
 {
 id: 'wheel-year',
 limb: 'druids',
 keys: ['wheel of the year', 'solstice', 'equinox', 'samhain', 'beltane', 'festival', 'seasons', 'celtic'],
 q: 'Is the Wheel of the Year ancient?',
 a: `The astronomy is; the calendar as you have met it is not.

Solstices and equinoxes are real events, determined by a 23.4° axial tilt, and people have tracked them for at least five thousand years — Newgrange and Maeshowe are instruments, whatever else they are. Four of the eight stations are therefore as old as attention.

The eight-fold wheel itself, with its familiar names in sequence, was assembled in the mid-twentieth century, largely by Ross Nichols and Gerald Gardner, from genuinely attested but geographically and chronologically scattered festivals. Samhain and Beltane are well attested in Irish sources; the full symmetrical cycle is modern. Ronald Hutton's The Stations of the Sun is the definitive account, and Blood and Mistletoe the corrective on druids generally.

This does not devalue it. A modern synthesis of real materials, kept faithfully for decades, is a living tradition — that is what traditions are made of. We simply decline to date it falsely. Science for the sky, scholarship for the calendar.`
 },
 {
 id: 'past-lives',
 limb: 'shadow',
 keys: ['past life', 'past lives', 'reincarnation', 'previous life', 'ed past life', 'enforced integration', 'karma'],
 q: 'What about past lives — and Ed\'s account of one?',
 a: `Ed states his plainly on the Introduction page rather than hinting at it: through sustained meditation and ritual recall he has walked what he holds to be past lives, and among them identified a character who stood inside the Nazi regime. He offers it as the reason he refuses to study fascism at a comfortable distance — not as evidence, and not expecting belief.

What he describes as the work of this life is an enforced integration: a compelled reckoning with the feelings, choices and paths of the beings he has been, those that healed and those that harmed alike, held in one awareness rather than sorted into a side worth keeping and a side to be buried. Nothing disowned, because what is disowned steers from underground.

The order's filing is unchanged by its being a co-founder's: myth, tradition and primary esoteric experience. Recall is not a credential and confers no authority here. Read it as literal reincarnation, as the psyche giving shape to inherited shadow, or as myth doing myth's work — the ethical content is identical and is not negotiable. The atrocity was real. Nothing recovered in trance softens an hour of it.`
 },
 {
 id: 'scepticism',
 limb: 'foundations',
 keys: ['how do i know', 'sceptic', 'skeptic', 'believe', 'evidence', 'critical thinking', 'woo', 'bullshit'],
 q: 'How do I tell good esoteric material from nonsense?',
 a: `Five habits, and they are the house rules.

Separate the claim from the feeling it gives you. Awe is evidence that you are alive, not that a statement is true. Keep the awe; audit the claim on its own.

Ask what would have to be false. Anything worth holding can tell you what observation would overturn it. What cannot is not knowledge — it may still be beautiful, but file it as myth.

Find the best critic, not the worst. If you cannot state the strongest opposing case in its own terms, you do not yet understand your own.

Follow the citation to its source. Most esoteric facts are a chain of books quoting books. Walk it back. Roughly half the chains end in nothing at all — someone's speculation, confidently recycled.

Keep two ledgers: one for what is demonstrated, one for what is meaningful. Let them inform each other and never let one forge entries in the other.

And the standing instruction, which is the whole order in three words: test everything kindly.`
 },
 {
 id: 'where-start',
 limb: 'foundations',
 keys: ['where do i start', 'beginner', 'new here', 'what should i read', 'reading list', 'join', 'member'],
 q: 'I am new here. Where do I start?',
 a: `Start with whichever limb you are already arguing with in your head — curiosity that is already running beats a curriculum.

If you want one book per direction: Rovelli's The Order of Time for the physics, Simard's Finding the Mother Tree for the woods, Seth's Being You for the mind, Nick Lane's The Vital Question for life itself, Frances Yates's The Art of Memory for the magic, Principe's The Secrets of Alchemy for the opus, Hutton's Blood and Mistletoe to inoculate yourself against invented history, and the Ra material if you want to meet the Law of One in its own voice rather than its fans'.

Then: pick one tree and visit it monthly for a year. It sounds trivial. It is the single practice that has changed the most members' sense of time, and it costs nothing.

The Further Research page grades every source so you always know whether you are holding science, scholarship, speculation or myth. Read across all four. Confusing them is the only sin this order recognises.`
 }
];

/* ------------------------------------------------------------------------ */


export const ANSWERS = [
 ...BASE, ...MORE, ...VOL3, ...VOL4, ...VOL5, ...VOL6, ...VOL7,
 ...VOL8, ...VOL9, ...VOL10, ...VOL11, ...VOL12, ...VOL13, ...VOL14, ...VOL15, ...VOL16, ...VOL17, ...VOL18, ...VOL19, ...VOL20, ...VOL21, ...VOL22, ...VOL23, ...VOL24, ...VOL25, ...VOL26, ...VOL27, ...VOL28, ...VOL29, ...VOL30, ...VOL31, ...VOL32, ...VOL33, ...VOL34
];

const STOP = new Set(
 ('a an and are as at be but by do does did for from had has have how i if in into is it its me my no not of on or our so that the their them then there these they this to was we what when where which who why will with you your about can could would should'
 ).split(' ')
);

// Short tokens that carry real meaning on these sites and must survive the
// length filter: a question like 'what is dx' is otherwise empty.
const SHORT = new Set(['dx', 'pi', 'ai']);

const tokenize = (s) =>
 String(s)
 .toLowerCase()
 .replace(/[^a-z0-9\s']/g, ' ')
 .split(/\s+/)
 .filter((w) => (w.length > 2 || SHORT.has(w)) && !STOP.has(w));

/**
 * Score every answer against the question and return the best, with a
 * confidence in 0..1. Phrase hits in `keys` count for much more than loose
 * word overlap with the body text.
 */
export function bestMatch(question, limbHint = '') {
 const text = String(question).toLowerCase();
 const words = new Set(tokenize(question));
 if (!words.size) return { entry: null, score: 0 };

 let best = null;
 let bestScore = 0;

 let bestKeyed = false;

 for (const entry of ANSWERS) {
 let score = 0;
 let keyed = false;

 for (const key of entry.keys) {
 if (text.includes(key)) { score += key.includes(' ') ? 6 : 4; keyed = true; }
 else if (words.has(key)) { score += 3; keyed = true; }
 }

 for (const w of tokenize(entry.q)) if (words.has(w)) score += 1.2;

 /* Loose overlap with the body of an answer is the weakest signal there is,
    and it used to be unbounded: a long question collected a fifth of a point
    from dozens of incidental words. Capped at two — enough to break a tie,
    never enough to make a match. */
 let bodyScore = 0;
 for (const w of new Set(tokenize(entry.a))) if (words.has(w)) bodyScore += 0.18;
 score += Math.min(2, bodyScore);

 if (limbHint && entry.limb && limbHint.toLowerCase().includes(entry.limb)) score += 1.5;

 if (score > bestScore) { bestScore = score; best = entry; bestKeyed = keyed; }
 }

 /* `keyed` says whether the winner was chosen because the question actually
    contains one of its keywords, rather than merely sharing vocabulary with
    its prose. Nothing is served to a visitor word-for-word unless it is
    keyed; an unkeyed match is grounding material and nothing more. */
 return { entry: best, score: Math.min(1, bestScore / 9), keyed: bestKeyed };
}

/** The next-best questions, for when nothing matches well enough to answer. */
export function nearest(question, limit = 3) {
 const words = new Set(tokenize(question));
 return ANSWERS
 .map((e) => {
 let s = 0;
 for (const k of e.keys) if (k.includes(' ') ? String(question).toLowerCase().includes(k) : words.has(k)) s += 3;
 for (const w of tokenize(e.q)) if (words.has(w)) s += 1;
 return { e, s };
 })
 .sort((a, b) => b.s - a.s)
 .slice(0, limit)
 .map(({ e }) => e.q);
}

/**
 * The k best-scoring written answers, for use as grounding material when a
 * model composes a fresh reply. Retrieval, rather than a single lookup: the
 * oracle then speaks from the order's own body of work even when it is
 * writing a sentence nobody has written before.
 */
export function topMatches(question, limbHint = '', k = 5) {
 const text = String(question).toLowerCase();
 const words = new Set(tokenize(question));
 if (!words.size) return [];

 const scored = [];
 for (const entry of ANSWERS) {
 let score = 0;
 for (const key of entry.keys) {
 if (text.includes(key)) score += key.includes(' ') ? 6 : 4;
 else if (words.has(key)) score += 3;
 }
 for (const w of tokenize(entry.q)) if (words.has(w)) score += 1.2;
 for (const w of new Set(tokenize(entry.a))) if (words.has(w)) score += 0.18;
 if (limbHint && entry.limb && limbHint.toLowerCase().includes(entry.limb)) score += 1.5;
 if (score > 0) scored.push({ entry, score: Math.min(1, score / 9) });
 }
 scored.sort((a, b) => b.score - a.score);
 return scored.slice(0, k);
}

/** Questions the corpus can answer well, for suggesting next turns. */
export function relatedQuestions(question, limbHint = '', limit = 3) {
 const asked = String(question).toLowerCase();
 return topMatches(question, limbHint, limit + 4)
 .map((m) => m.entry.q)
 .filter((q) => q.toLowerCase() !== asked)
 .slice(0, limit);
}
