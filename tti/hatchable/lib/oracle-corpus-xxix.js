/** Oracle corpus, volume XXIX — the druids, alchemy, music and runes pages,
 * worked section by section: who the druids actually were, what they believed,
 * what alchemy actually gave us, and what sound does to a nervous system.
 *
 * Shared by both oracles. Register: plain words, no grading diamonds. Where a
 * romantic claim has no evidence, that is said rather than quietly dropped. */
const E = (id, limb, keys, q, a) => ({ id, limb, keys, q, a });
const D = 'druids';
const AL = 'alchemy';
const MU = 'magic';

export const VOL29 = [
  E('dru-29-evidence', D, ['how do we know about druids', 'evidence for druids', 'sources on druids', 'what do we know about druids'],
    'How much do we actually know about the druids?',
    `Less than the tradition admits, and the page starts with that rather than burying it. The druids left no writings of their own — deliberately, as far as we can tell — so everything comes from outsiders: Caesar, who had political reasons to make them interesting; Pliny, who was collecting marvels; a handful of later Irish and Welsh texts, written down by Christians centuries after the fact. There is no druidic inscription, no druidic text, no archaeological find that says druid on it. What follows on the page is the best reconstruction available, and it should be read knowing that the sources are thin, hostile or late.`),

  E('dru-29-three-orders', D, ['druid bard vates', 'three orders of druids', 'strabo druid classes', 'what kinds of druids were there'],
    'What were the three orders?',
    `Strabo gives three, and the division is functional rather than hierarchical. The druid proper held the learning — law, natural philosophy, theology, and the calendar. The bard held the memory — genealogy, praise-poetry, satire, and the ability to make or unmake a reputation. The vates handled the rites — sacrifice, divination, and reading the natural world for signs. In practice the same person might do all three, and the Irish tradition blurs the boundaries further. The useful point is that this was not a priesthood in the Christian sense but an intellectual class with a professional monopoly on literacy it chose not to write down.`),

  E('dru-29-training', D, ['druid training', 'twenty years', 'why did druids not write', 'druid memory'],
    'Why did they not write anything down?',
    `Twenty years of training, according to Caesar, entirely by memory — and the reason is argued rather than recorded. The most likely answer is that writing was refused because the monopoly was the point: knowledge that can be written down can be taken, copied, and held by anyone with the tablet. Keeping it in the head kept the class indispensable and made its authority personal rather than transferable. There is a second, quieter benefit, which anyone who has memorised anything long knows — material held in the head is constantly reworked and stays alive, while material written down gets fixed and stops being argued with. They may well have understood both.`),

  E('dru-29-women', D, ['were there women druids', 'female druids', 'druidesses', 'bandrui'],
    'Were there women druids?',
    `Probably, and the evidence is better than the Victorian reconstruction lets on. The Irish texts use bandruí, a feminine form of the word, and name individual women with the standing that goes with it. Later classical writers describe Galli priestesses on an island off Brittany who performed rites no man was permitted to attend. What there is not is any reliable account of women in the archdruidal role Caesar describes, and the nineteenth-century revival's confident pictures of white-robed priestesses owe more to its own tastes than to anything ancient. The honest position: the class was probably not exclusively male, and the details are unrecoverable.`),

  E('dru-29-roundhouses', D, ['where did druids live', 'stone circles druids', 'did druids build stonehenge', 'roundhouses'],
    'Did the druids build Stonehenge?',
    `No, and the gap is enormous. Stonehenge's main phase was built between roughly 2500 and 2000 BCE. The druids appear in the historical record about two thousand years later, in the Iron Age. They did not build it, did not worship at it in the way the revival claimed, and almost certainly had no tradition about who built it, because the builders predated their language. They lived in roundhouses — timber, thatch, a central hearth, a farmstead around them — not in stone circles. The image of the druid at Stonehenge is a seventeenth-century invention by John Aubrey and William Stukeley that has simply never been evicted.`),

  E('dru-29-soul', D, ['druid belief in the soul', 'do druids believe in reincarnation', 'soul does not die', 'druid afterlife'],
    'What did they believe about death?',
    `That the soul does not die, and this is the one belief on which the sources agree. Caesar, Pomponius Mela and others all report it, and Caesar explicitly links it to military courage — a warrior who does not expect annihilation fights differently. The precise form is not recoverable: transmigration into another body is one reading, movement to an Otherworld that runs alongside this one is another, and the Irish material suggests something closer to the second. What is safe to say is that the doctrine was central, was reported by several independent writers, and was understood by contemporaries as the reason these people were difficult to frighten.`),

  E('dru-29-otherworld', D, ['the otherworld', 'annwn', 'sidhe', 'celtic otherworld'],
    'What is the Otherworld?',
    `Not a place above or below but alongside, reachable through specific openings at specific times. The Irish call it variously and inconsistently — Tír na nÓg, Annwn in the Welsh material, the síd mounds that are the entrances. It runs in parallel with this world and its rules differ: time moves differently, the dead are present, and crossing over is usually a mistake or a gift rather than an achievement. What makes it interesting philosophically is that it is not a reward structure. There is no moral accounting, no judgement, no heaven and hell. It is a geography of the sacred rather than an ethics of the afterlife, and that is a genuinely different way of organising death.`),

  E('dru-29-mistletoe', D, ['mistletoe rite', 'pliny mistletoe', 'golden sickle', 'druids and mistletoe'],
    'Is the mistletoe rite real?',
    `It is in Pliny, and Pliny is the only source. He describes mistletoe growing on an oak — rare, because mistletoe prefers apple and hawthorn — cut with a golden sickle by a white-robed druid on the sixth day of the moon, with two white bulls sacrificed and a feast beneath. That is one paragraph in one Roman encyclopaedist with a taste for the exotic. It may record something real; it may be a traveller's marvel. What is certain is that the entire modern image of the druid — white robe, gold sickle, oak grove — comes from this single passage. The most famous druidic rite we have rests on one man's anecdote, and that is worth knowing before anyone wears the robe.`),

  E('dru-29-sacrifice', D, ['druid human sacrifice', 'wicker man', 'did druids sacrifice people', 'lindow man'],
    'Did they practise human sacrifice?',
    `The sources say yes and the archaeology is ambiguous, and both halves matter. Caesar and Lucan describe it, including the burning wicker figure — but both were writing with Rome's own interest in justifying conquest, and Roman propaganda needed barbarians. Archaeologically there are bodies: Lindow Man, preserved in a Cheshire bog around the first century CE, killed by several means at once in a way that looks ritual rather than criminal. But bog bodies are found across northern Europe without druidic involvement. The honest reading is that ritual killing happened in this world and the specific druidic framing cannot be confirmed or dismissed.`),

  E('dru-29-coligny', D, ['coligny calendar', 'druid calendar', 'celtic calendar', 'how did druids keep time'],
    'What is the Coligny calendar?',
    `The single most important druidic artefact we have, and it is not a druidic text. It is a bronze plate from first-century Gaul, broken into fragments, giving a five-year lunisolar calendar of astonishing sophistication: sixty-two months, with two intercalary months inserted to keep the lunar and solar years aligned. It is written in Gaulish using Latin letters, which means it postdates the refusal to write. What it proves is that the calendar knowledge Caesar described was real and technically advanced — and it does so with arithmetic rather than assertion, which is exactly the kind of evidence the rest of the subject lacks.`),

  E('dru-29-rome', D, ['how did the druids end', 'rome destroyed the druids', 'mona anglesey', 'suppression of druids'],
    'How did the druids end?',
    `Rome ended them, and did it as a deliberate policy rather than a side effect. The druids were a transnational intellectual class with authority across tribal boundaries, which is precisely the kind of organisation an empire cannot govern alongside. Suetonius records that Augustus restricted their practice and Claudius abolished it outright; Tacitus describes the attack on Mona, Anglesey, in 60 or 61 CE, where the druids stood on the shore and were cut down. The class was dismantled because it was a rival structure of authority. What survived went into the bardic tradition and the monasteries, where the material was written down at last — by the people who had replaced it.`),

  E('dru-29-revival', D, ['modern druidry revival', 'when did druidry start', 'ancient order of druids', 'is modern druidry authentic'],
    'Is modern druidry the same thing?',
    `No, and the revival is honest about it. Modern druidry begins in the eighteenth century with John Toland, William Stukeley and the Ancient Order of Druids of 1781, and it was built from classical fragments, Romantic nationalism and a great deal of imagination. The nineteenth century added the white robes and the Stonehenge connection. What is important is that this is not a fraud, it is a new tradition with a documented founding — and the modern orders that do best are the ones that say so plainly. Claiming an unbroken line is both false and unnecessary; the practice does not need the ancestry to be worth doing.`),

  E('dru-29-practice', D, ['what can i actually do druidry', 'druid practice', 'modern druid practice', 'defensible druidry'],
    'What can I actually do, without pretending?',
    `The page gives a practice that survives scrutiny, and it costs nothing. Pick one tree and visit it monthly for a year, noting what it is doing — that is phenology, it is real science, and it is the practice that has changed the most members' sense of time. Learn eight of the trees by their actual botany before you learn their ogham names. Keep the eight stations of the year by observing the equinoxes and solstices rather than by reciting something. Write down what you notice and check it against what actually happened. None of that requires belief in the druids. All of it is what they would have recognised.`),

  E('alc-29-usefully-wrong', AL, ['was alchemy wrong', 'alchemy and chemistry', 'two thousand years of alchemy', 'was alchemy a failure'],
    'Was alchemy just wrong?',
    `It was wrong about its central claim and right about almost everything else, which is a much more interesting verdict. The transmutation of base metal into gold never happened, and the elixir of life never worked. But in two thousand years of trying, alchemy produced distillation, the alembic, the water bath, crystallisation, the separation of acids and alkalis, the discovery of phosphorus, antimony, arsenic and alcohol, and — most importantly — the laboratory notebook as a genre. The theory was wrong and the method it drove was the foundation of the thing that replaced it. Boyle and Lavoisier were not working against alchemy so much as inheriting its workshop.`),

  E('alc-29-how-it-died', AL, ['how did alchemy end', 'phlogiston', 'death of alchemy', 'chemistry replaced alchemy'],
    'How did alchemy actually end?',
    `Not by refutation but by a better way of keeping score. The decisive episode is phlogiston: the theory that burning releases a substance called phlogiston, which held for a century because it explained a great deal and was quietly adjusted whenever it failed. Lavoisier killed it with a balance — weighing the reactants and the products and finding that metals gain weight when they burn, which phlogiston cannot accommodate. What ended alchemy was not a better story but the insistence on measurement, on conservation, and on publishing a result that contradicts you. The lesson the page draws is general: a doctrine dies when it is made to keep accounts it cannot balance.`),

  E('alc-29-gave-us', AL, ['what did alchemy give us', 'alchemy inventions', 'distillation history', 'alchemy contributions'],
    'What did alchemy actually give us?',
    `The apparatus and the attitude. Distillation and the alembic. Crystallisation, sublimation, calcination — the separation techniques still in every laboratory. The discovery of phosphorus by Brandt in 1669, boiling urine, which is exactly the kind of unglamorous persistence the tradition produced. The concept of a controlled reaction vessel. The idea, revolutionary at the time, that a recipe should be written down precisely enough for someone else to repeat it — which is the direct ancestor of the methods section of a paper. And the four elements as a working classification of states and tendencies, which was wrong as physics and useful as chemistry.`),

  E('alc-29-four-elements', AL, ['four elements alchemy', 'earth air fire water', 'elements as tendencies', 'what are the four elements'],
    'What were the four elements actually for?',
    `Not substances but tendencies, and reading them that way rescues more of the system than people expect. Earth is what settles and persists; water is what flows and binds; air is what separates and mediates; fire is what transforms and consumes. Every process in the alchemical scheme is an arrangement of these four — calcination burns away, dissolution loosens, coagulation fixes. As physics it is false: matter is not made of four elements. As a vocabulary for describing what happens in a process, it maps remarkably well onto what modern chemistry calls phase, solubility, oxidation and reduction. The framework keeps it as the second reading and files the first as myth.`),

  E('alc-29-nigredo', AL, ['nigredo albedo rubedo', 'stages of alchemy', 'great work stages', 'the opus'],
    'What are the four colour stages, nigredo to rubedo?',
    `Four, named by the colour the material takes. Nigredo, the blackening: putrefaction, dissolution, the breakdown of the original into something unrecognisable. Albedo, the whitening: purification, washing, the separation of what is worth keeping. Citrinitas, the yellowing — often folded into the next stage — the dawning of the new quality. Rubedo, the reddening: the finished work, fixed and stable. Read psychologically, which is how Jung took it, it is a decent description of any real change: something has to rot before it can be reformed, and the stages cannot be skipped. Read chemically it is a description of roasting, washing and reducing an ore. Both readings were probably intended.`),

  E('alc-29-solve', AL, ['solve et coagula', 'dissolve and combine', 'alchemical motto', 'solve coagula meaning'],
    'What is solve et coagula, and why does it matter?',
    `Dissolve and combine — and it is the whole method in three words. Break the thing down until its parts are free, then recombine them into a form the original could never have taken. Chemically it is exactly right and it is how every synthesis works: you cannot build anything new out of a structure that will not let go. The page treats it as a practice rather than a motto and asks you to actually distil something, because the discipline of watching a mixture separate and come back together teaches more about transformation than any amount of reading about it. It is also, without strain, a description of how a mind changes.`),

  E('alc-29-notebook', AL, ['laboratory notebook', 'alchemical record keeping', 'why keep a notebook', 'alchemy practice'],
    'Why does the page insist on a laboratory notebook?',
    `Because it is the single thing that separates the tradition that survived from the one that did not. The alchemists who wrote in symbols and riddles produced two thousand years of unrepeatable claims, because nobody could check anyone. The ones who wrote plainly — quantities, temperatures, times, and the failures — produced chemistry. A notebook is not bureaucracy, it is the mechanism by which a claim becomes testable. The practice the page asks for is deliberately small: record what you did, record what happened including when it went wrong, and go back and read it. That is the whole of the scientific method, arrived at four centuries early by people who were trying to make gold.`),

  E('alc-29-to-periodic', AL, ['from alchemy to the periodic table', 'lavoisier', 'how chemistry began', 'alchemy to chemistry'],
    'How did you get from alchemy to the periodic table?',
    `In about a century, by insisting on the balance. Lavoisier's conservation of mass in the 1770s made it possible to say a reaction cannot create or destroy matter, only rearrange it. Dalton's atomic theory in 1808 gave the rearrangement a counting scheme. Cannizzaro in 1860 settled the confusion between atoms and molecules, which let atomic weights be compared properly. And Mendeleev in 1869 arranged the elements by weight and found the properties repeated, leaving gaps for elements not yet found — then predicted their properties, and was right. Every one of those steps used apparatus the alchemists built and a discipline they mostly did not.`),

  E('mus-29-oldest', MU, ['oldest technology', 'music oldest technology', 'bone flute', 'how old is music'],
    'Why does the order call music the oldest technology?',
    `Because the evidence is older than farming, older than writing, older than anything we would usually call technology. Bone flutes from the Swabian Jura are around forty thousand years old — made by people with the same brains as us, in caves, before agriculture. Music is not a cultural accessory that arrived late; it is something the species was doing as soon as it could work a bone. That is the argument the page opens with, and it sets up the rest: if something is this old and this universal, it is probably doing something real to the nervous system, and the interesting question is what.`),

  E('mus-29-harmonic-series', MU, ['harmonic series', 'why do chords sound good', 'overtones', 'is the harmonic series natural'],
    'Is the harmonic series a human invention?',
    `No, and this is the part of the page that is straightforwardly physics. Any vibrating object produces a fundamental plus overtones at integer multiples of its frequency — twice, three times, four times, and so on. That is a property of the wave equation, not of culture. A plucked string, a struck bell, a voice: all of them carry the same stack. What makes consonance feel like something is that simple frequency ratios produce overlapping overtones, and the ear reads the overlap as agreement. The octave is two to one, the fifth three to two, the fourth four to three. Those ratios are in the mathematics before anyone decided they were pleasant.`),

  E('mus-29-entrainment', MU, ['entrainment', 'why does rhythm move you', 'rhythm and the body', 'musical entrainment'],
    'Why does rhythm move the body?',
    `Because entrainment is not a metaphor, it is a measured phenomenon in coupled oscillators. Two rhythmic systems that can sense each other drift toward a shared period — metronomes on a shared board, fireflies in a mangrove, hearts in close proximity, and a nervous system with a beat in it. The human case is unusually strong: we synchronise to an external pulse spontaneously, without deciding to, and the effect is measurable in motor cortex activity even when the listener is perfectly still. Drumming together is not symbolic solidarity, it is a group of oscillators locking. That it feels like solidarity is a separate question and a real one.`),

  E('mus-29-brainwave', MU, ['brainwave entrainment', 'do binaural beats work', 'delta theta alpha beta', 'brainwave part honestly'],
    'Do brainwave entrainment claims hold up?',
    `Partly, and the page separates the two halves carefully. The measurable half: the brain does produce characteristic rhythms — delta under four hertz in deep sleep, theta four to eight in drowsiness and deep meditation, alpha eight to twelve when relaxed with eyes closed, beta above that when engaged. Those are real and were real before anyone marketed anything. The weaker half: the claim that playing a tone at a given frequency drives the brain into that state. Evidence exists for auditory steady-state response, but the behavioural effects are small, inconsistent, and shrink markedly in properly blinded trials. Enjoy it. Do not expect it to do what the packaging says.`),

  E('mus-29-binaural', MU, ['binaural beats', 'do binaural beats do anything', 'binaural beat evidence'],
    'What are binaural beats, really?',
    `An artefact of the auditory system rather than a sound in the world. Present two slightly different tones, one to each ear, and the brain reports a third pulsing tone at the difference — five hundred in one ear and five hundred and ten in the other produces a ten hertz beat that exists nowhere in the air. It requires headphones and it is generated in the brainstem. Whether that beat then entrains cortical rhythms is the contested part, and the honest summary is that it produces a measurable evoked response and a subjective sense of altered state, with a thin and inconsistent record of doing anything beyond that. It is a genuine perceptual phenomenon wearing a speculative costume.`),

  E('mus-29-432', MU, ['432 hz', 'is 432 hz special', 'a440 conspiracy', 'tuning frequency'],
    'Is 432 Hz a more natural tuning?',
    `No, and the argument against it is simple arithmetic. The hertz — one cycle per second — was defined in 1880s Europe using a definition of the second that did not exist in any culture that ever tuned an instrument. There is no natural 432 anything, because there was no natural unit to be 432 of. Tuning standards have varied continuously across centuries and cities, from about 415 to 455 hertz, and A440 was settled internationally in 1939 largely for broadcast engineering convenience. Tunings do affect how music feels; that is a real and interesting effect. The claim that one particular number is cosmically privileged is not supported by anything.`),

  E('mus-29-cymatics', MU, ['cymatics', 'chladni plates', 'sound made visible', 'hans jenny'],
    'What is cymatics, and how much of it is real?',
    `Chladni figures, from 1787: scatter sand on a metal plate, bow the edge, and the sand arranges itself along the nodal lines where the plate is not moving. That is exact, reproducible physics — the normal modes of a vibrating surface, and a direct visualisation of an eigenvalue problem. Hans Jenny's twentieth-century work extended it and gave it the name. The real part is the demonstration; the overreach is the leap from "sound organises sand on a plate" to "sound organises matter in general". The first is a laboratory exercise. The second has no evidence behind it and the page says so.`),

  E('mus-29-practice-hum', MU, ['humming practice', 'vagus nerve humming', 'how to use sound', 'sound practice'],
    'What sound practices does the page actually recommend?',
    `Six, and all of them are cheap. Hum, long and low — it stimulates the vagus nerve, which is a real mechanism with real measured effects on heart rate variability. Sit inside a drone rather than listening to one, which changes the listening from an activity into a condition. Sing with other people; the synchronisation is measurable and the mood effect is robust. Listen to a place — the acoustic signature of a space is as informative as its appearance. Build a rhythm and then drop it out, which is how the tradition produces altered states without substances. And protect your hearing, because none of this works if you cannot hear it in twenty years.`),

  E('mus-29-survives', MU, ['what survives in music', 'solid claims about music', 'music evidence', 'music what holds up'],
    'What about music actually survives scrutiny?',
    `The harmonic series as physics. Entrainment as a measured property of coupled oscillators, including humans. The vagal effects of slow breathing and sustained vocalisation. The cross-cultural universality of a small number of intervals and the octave equivalence. Music's measurable effects on pain, anxiety and motor rehabilitation, which are well replicated in clinical settings. What does not survive: any claim that a particular frequency has intrinsic moral or healing properties, any claim that ancient tuning systems were cosmologically correct, and any claim that binaural beats reliably produce specific cognitive states. The real effects are substantial and none of them needs the mysticism.`),

  E('mus-29-druid-tree', MU, ['ogham thirteen trees', 'ogham trees', 'tree alphabet', 'thirteen consonants'],
    'What is the ogham tree list?',
    `Thirteen trees, one per consonant group of the calendar, and the honest history is complicated. Ogham itself is a real script — about four hundred surviving inscriptions, mostly on stone in Ireland and Wales, mostly fourth to sixth century, mostly names and territorial claims. The tree alphabet is a medieval scholarly gloss, the Bríatharogam, applied afterwards; the trees were probably never the primary meaning. Robert Graves's thirteen-consonant calendar in The White Goddess is a twentieth-century construction that has since become the popular version. The trees are worth learning on their own merits, which is what the page recommends, and the alphabet is worth knowing as a beautiful piece of later interpretation.`),

  E('run-29-what-they-are', 'runes', ['what are runes', 'what were runes for', 'runic alphabet', 'elder futhark'],
    'What were runes actually for?',
    `Writing, in the plainest sense, and that is the fact the revival keeps losing. The Elder Futhark, twenty-four characters from around the second century CE, was used for names, ownership marks, memorials and the occasional boast. The vast majority of surviving inscriptions say things like "Thorvald raised this stone for his father" or "I, Hrolf, carved these runes". They are a script for a society with limited writing surfaces, which is why the strokes are straight — straight lines cut into wood or stone, no curves. The magical use is real and comes later, in a minority of inscriptions, and it is layered onto a functional alphabet rather than being its origin.`),

  E('run-29-magic', 'runes', ['runic magic', 'were runes magical', 'rune spells', 'alu runes'],
    'Were runes magical?',
    `Some of them, some of the time, and the evidence is specific rather than general. There are inscriptions that are clearly charms — the word alu appears on several objects and seems to have had a ritual function; the Eggja stone is largely unreadable and probably meant to be. The Björketorp stone carries a curse. So magical use existed. What did not exist was a coherent system of rune magic comparable to what modern practice describes; the runic corpus is a few hundred inscriptions of which perhaps a dozen are unambiguously occult. Anyone who tells you there is a complete ancient system of rune sorcery is describing a modern construction.`),

  E('run-29-modern', 'runes', ['modern rune use', 'guido von list', 'armanen runes', 'runes and the twentieth century'],
    'Where does modern rune use come from?',
    `From the nineteenth and twentieth centuries, and the lineage is documented. Guido von List invented the eighteen-character Armanen futhark in 1902, claiming to have received it during a period of blindness, and it has no relationship to any historical runic row. It was taken up by German nationalist and then National Socialist circles, which is why the SS lightning bolts are Armanen-derived. Mid-century esotericists like Edred Thorsson recovered the Elder Futhark and separated it from that history as far as was possible. The point the order makes is that you cannot use runes without knowing this, and that a symbol with that recent a past deserves more scrutiny, not less.`),

  E('run-29-practice', 'runes', ['how to work with runes', 'rune practice', 'carving runes', 'using runes honestly'],
    'How should someone work with runes?',
    `Learn the actual alphabet first — twenty-four characters, their names, their sounds, and the inscriptions they appear in — before assigning meanings to them, because the meanings people use now are largely modern and it is better to know which. Carve them, which is what they were made for and teaches the shapes faster than any chart. Read a real corpus: the Elder Futhark inscriptions are published and mostly short. If you want a divinatory practice, run it as one, with the honesty that this is a twentieth-century invention using ancient materials. What the order will not do is present a modern system as an ancient one, which is the single most common fraud in this whole field.`)
];
