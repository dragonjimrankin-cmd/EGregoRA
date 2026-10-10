/** Oracle corpus, volume XXXVIII — the site's own pages: what an egregore is
 * and why the house is named for one, the eleven limbs, the four grading marks,
 * the co-founders, how the oracle answers, what an account holds, and the shop.
 *
 * Shared by both oracles. Register: plain words, no grading diamonds. These
 * entries answer questions about the house itself rather than about the world,
 * and they are written in the order's own voice because that is what is being
 * asked about. */
const E = (id, limb, keys, q, a) => ({ id, limb, keys, q, a });
const O = 'order';
const C = 'contact';

export const VOL38 = [
  E('eg-38-egregore', O, ['what is an egregore', 'why are you called egregora', 'egregore thought form', 'meaning of egregora'],
    'What is an egregore, and why is the house named for one?',
    `An egregore is the old name for a thought-form grown large: the living spirit that forms when many minds attend to the same idea for long enough that it begins to attend back. The word is from the Greek egrēgoros, watcher, and it turns up in the Book of Enoch for the angels who came down and taught. The occult use is later and more interesting — it describes how a group's shared focus takes on properties none of the individuals have, and starts shaping them in return. Every institution, religion and movement has one. The house is named for it because that is an honest description of what any tradition is: not a set of beliefs held separately by people, but a thing those people are inside, which was built by attention and now directs it.`),

  E('eg-38-eleven', O, ['eleven limbs', 'what are the fields of enquiry', 'structure of the site', 'what does egregora cover'],
    'What are the eleven limbs?',
    `Eleven doorways into one room, numbered I to XI. Cosmic physics. Druidry, trees and the living earth. Sacred geometry and natural form. Astrology as symbolic technology. Neuroscience, psychology and the visionary state. Biology and the stubbornness of life. God, the Law of One and the contact question. The Black Tribunal. Magic and the wizard's craft. Alchemy and the elemental forces. And consciousness with the hard problem, the newest limb and the one the site itself says is most likely to be wrong. The claim is not that these are eleven subjects; it is that they are one subject approached eleven ways, which is why the pages cross-reference so heavily and why the same figure appears at several scales.`),

  E('eg-38-figure', O, ['the whole figure', 'tree of the site', 'one figure many scales', 'how is the site structured'],
    'What is the figure the site keeps returning to?',
    `Every room in the house drawn as one figure: the trunk, the eleven limbs, the sub-limbs hung beneath them, and under each the sections of the page itself. The same structure is drawn at several scales, which is the house's central visual claim — that the organisation of a subject, of a site and of a tree are not metaphors for each other but instances of one branching form. That is a stronger claim than it looks, because branching is genuinely what happens when a system optimises transport under constraint: lungs, rivers, mycelium and trees all branch for the same physical reason. The figure is the argument that a way of organising knowledge can be read off a way of growing, and the site invites you to think that is worth testing.`),

  E('eg-38-diamonds', O, ['four diamonds', 'what do the marks mean', 'grading claims', 'sci hist spec myth'],
    'What do the four marks mean?',
    `Every substantive claim in this order carries a mark, and the mark tells you what kind of thing the claim is and how much weight it will bear. Scientific, for what is measured and replicated. Historical, for what is documented and datable. Speculative, for what is argued but not established — and the site uses this mark on its own material constantly. Mythic, for what carries meaning without carrying fact, and is not thereby worthless. It is the single most important convention on the site, because it means a reader never has to guess whether the order is asserting or exploring. The oracle's answers do not carry the marks, on the reasoning that speech should not be cluttered with apparatus, but the gradings still govern what it is willing to say.`),

  E('eg-38-cofounders', O, ['who founded egregora', 'edward gregory and jim rankin', 'who are the co founders', 'ed and jim'],
    'Who founded this?',
    `Edward Gregory and Jim Rankin, as co-founders. Edward is a natural philosopher in the old, unembarrassed sense of the phrase: someone who refuses to choose between the telescope and the tree, and who writes as though cosmology and a walk in a wood were parts of the same enquiry. Jim is Ed's understudy and sometimes his muse — he holds the practical side, the correspondence and the making of things, and on The Two Infinities it is Jim who is written to directly. Neither is presented as a guru or a channel, and the site is explicit that the teaching stands or falls on the material rather than on the men. If you want to argue with the house, argue with the pages.`),

  E('eg-38-ed', O, ['who is edward gregory', 'about ed', 'ed natural philosopher', 'ed gregory background'],
    'Who is Edward Gregory?',
    `A natural philosopher in the sense the phrase had before it was split into sciences. He refuses to choose between the telescope and the tree, which is the house's whole position in one gesture: the same person can care about the cosmic microwave background and about which trees leaf first in a particular wood, and treating those as different kinds of interest is a modern habit rather than a necessary one. He writes the material, keeps the limbs, and answers correspondence. He is presented as a co-founder, never as the founder, and the site is careful about this because the distinction is about how the house thinks — nothing here comes from one person's revelation, and the teaching is meant to be arguable.`),

  E('eg-38-jim', O, ['who is jim rankin', 'about jim', 'jim rankin understudy', 'jim muse'],
    'What is Jim Rankin’s part in this house?',
    `Co-founder, Ed's understudy and sometimes his muse. He holds the practical side of the house — the correspondence, the making of things, and the running of the Two Infinities, where the letter-form heading reads "Speak to Jim directly" because that is literally who answers. The understudy framing is deliberate and worth taking at face value: he is not a deputy or a junior, he is the person who can carry the work when Ed cannot, and who shapes it from alongside. The muse part is admitted openly, which is unusual and more honest than pretending a collaboration is purely administrative. Both men are co-founders and the site never describes either as the founder alone.`),

  E('eg-38-oracle', O, ['how does the oracle answer', 'how does gink answer', 'are the answers written', 'who writes the oracle answers'],
    'How does the oracle actually answer?',
    `From written answers, first and by preference. Every reply Gink gives is text that was written for this site and checked against the pages it comes from — the oracle is not improvising, and it will not invent an answer when nothing written covers the question. That is a deliberate design decision rather than a limitation: the order would rather the oracle say it has nothing than produce plausible-sounding material, because a confident fabrication in a voice you trust is worse than an honest gap. The spoken voice is the oracle's own, but the words are the order's written ones, unchanged. If a model is used at all it is a fallback, and it is labelled as one.`),

  E('eg-38-shakdrah', O, ['who is shakdrah', 'what is shakdrah', 'green dragon oracle', 'shakdrah versus gink'],
    'What kind of keeper is ShakDrah, and how does he differ from Gink?',
    `The Two Infinities' oracle, and the same membership covers both. Where Gink is a fox at a desk, ShakDrah is a green dragon, and the framing is that he keeps the framework the way old dragons keep maps: whole, and with the dangerous parts marked. That is not decoration — it describes the method. The framework has load-bearing claims and speculative ones, and the dragon's job is to hold the whole structure while telling you which parts will bear weight. The words are written and checked in exactly the same way as Gink's, the two corpora are kept identical by an automated gate, and an account on either site works on both. Same house, different room, different keeper.`),

  E('eg-38-gink', O, ['who is gink', 'is gink a real fox', 'the fox at the desk', 'gink origin'],
    'Is Gink a real fox?',
    `The desk carries a cast of a fox skull, taken from a museum reference rather than from an animal — no bone is sold or used. What the skull does on the desk is Ed's testimony and the site files it as such, which is the honest way to put it: it is a real object with a personal history and it is not evidence of anything. Gink himself is the order's familiar in the traditional sense — a keeper of answers, a figure who gives the material a voice. The site does not claim he is a spirit, an entity or a real animal. He is a character with a function, and the function is that a written tradition is easier to talk to than a document.`),

  E('eg-38-ask', O, ['how do i ask ed a question', 'write to ed', 'ask a question', 'contact the order'],
    'How do I put a question to the house?',
    `Three ways, and they do different things. Ask the oracle on /ask-ed/ — it answers immediately from the written corpus, and if nothing written covers your question it will say so rather than guess. Write to Ed directly through the letter form on that page, which asks for a name, an address and which limb the question belongs to; every question is read, most are answered within a fortnight, and the best are answered at length in the podcast mailbag. And on The Two Infinities, the same form goes to Jim. Ed will tell you plainly when he does not know something, which the site mentions specifically because it is the behaviour people are usually surprised by.`),

  E('eg-38-tools', O, ['what can i make here', 'image video 3d montage', 'studio tools', 'what generators are there'],
    'What can I actually make on this site?',
    `Four things, all behind the studio door. An image, photorealistic unless you ask for a painting, an engraving, a diagram or a cartoon, made with Stable Diffusion — open weights. Five seconds of 480p video from a sentence, made with HunyuanVideo 1.5, Tencent's open-weights model at 8.3 billion parameters, code and weights published. A 3D model built from solids — box, sphere, cylinder, cone, torus — moved, turned, scaled and coloured in the window. And a montage, which collects every clip and picture you have generated and lets you order them, trim, set holds, choose cuts or crossfades and lay sound. The house uses open-weights models deliberately, and says so on the page.`),

  E('eg-38-studio', O, ['why is the studio age gated', 'studio door age check', 'age verification', 'why do i need to verify'],
    'Why is the studio behind an age check?',
    `Because it is the one part of the site that generates images, and the order has decided that capability should not be open to anyone. Everything else — every page, every answer, the whole of the teaching — is open to everyone whether they hold an account or not. There are two ways through the door, and the page explains both. This is not a gate on the material and the site is explicit that it never will be; it is a gate on a generator, which is a different thing. The distinction matters because most sites put the interesting content behind the check and leave the marketing outside. This one does the opposite.`),

  E('eg-38-account', O, ['what is an account for', 'why make an account', 'what does an account do', 'account benefits'],
    'What is an account actually for?',
    `A convenience, never a gate on the teaching. Every page and every answer stays open whether you hold one or not. What an account does: the oracle greets you by name and keeps the thread of what you have asked — and so does ShakDrah on The Two Infinities, because it is the same membership across both sites. Files you generate are kept rather than vanishing. And you get the monthly letter. That is the whole of it. There is no premium tier on the teaching, because the house's position is that the material is the point and charging for it would change what the material is. If you want the teaching, it is already open.`),

  E('eg-38-privacy', O, ['what data do you hold', 'what is held exactly', 'privacy', 'how do i delete my account'],
    'What does the site hold about me?',
    `Four things, listed on the account page. Your email address, and the name you chose to be called by. A session token per device, good for thirty days, revocable there. A public key for each passkey — never the biometric itself, because the scan happens on your device and never leaves it. And the documents and letters you have generated or sent. There are no passwords at all: proof of the address is a one-time code that expires in fifteen minutes, so there is nothing to reuse, leak, phish or reset. Signing out ends the device's session at once. To have the account and everything attached erased — address, documents, letters, the lot — the page gives an address to write to.`),

  E('eg-38-signin', O, ['how do i sign in', 'no passwords', 'passkey sign in', 'how does login work'],
    'How does signing in work?',
    `One form does both signing in and creating an account. If the address is new, an account is made; if it is known, you are signed back in. Either way a six-digit code goes to the inbox, it lasts fifteen minutes, it works once, and nothing is created until it is entered. There are no passwords — nothing to reuse, leak, phish or reset. You can add a passkey, and then your device will let you back in with Face ID, Touch ID, Windows Hello, an Android fingerprint or a hardware key. The scan happens on your device and the site only ever holds the public key, which means a breach of this site cannot give anyone your biometric. It is the same membership on both sites.`),

  E('eg-38-shop', O, ['what is in the shop', 'what can i buy', 'products', 'order merchandise'],
    'What does the shop sell?',
    `Books, instruments, things to hold, and things to wear. The Codex, £38, is the founding text with all eleven limbs and the annotated reading list. The Wheel of the Year chart, £24, and the Ogham tree deck, £29. The Grove Journal, £19, dated for phenology — a page a week for bud-burst, bird return, weather, dream and mood. The Sacred Solids set, £64, in English beech, sold with the Euclidean proof of why there are only five. An orrery of the inner planets geared to real orbital ratios, so you can watch a retrograde happen in your hands. A pocket astrolabe with a plate cut for 52°N. Membership at £6 a month. Printed on FSC stock with vegetable inks; wooden items from windfall and coppice timber.`),

  E('eg-38-ethics', O, ['does this stuff heal', 'shop ethics', 'do your products work', 'shipping and ethics'],
    'Do the products do anything?',
    `The shop says plainly: nothing in it promises to heal, cure or protect you. That is stated on the products page rather than buried, and it is the house's position on the whole question. What the objects are is instruments and reminders — an astrolabe that actually works as an astrolabe, solids made for handling while thinking, a journal dated so that phenology can be recorded properly. Printed on FSC stock with vegetable inks, wooden items turned from windfall and coppice timber. Nothing is sold as charged, blessed or energetically prepared, because the order considers that claim unfalsifiable and therefore dishonest to sell. If an object changes how you attend, it has done something real, and that is the whole of the claim.`),

  E('eg-38-black-tribunal', O, ['black tribunal limb eight', 'thule ahnenerbe limb', 'occult captured by tyranny', 'enforced integration past life'],
    'What is the Black Tribunal?',
    `Limb VIII, and the limb the house is most serious about. It covers how esoteric ideas get captured by tyranny: the Thule and Ahnenerbe occultism of the Nazi regime, the theft of ancient symbols, and the pseudo-science of race. It is studied as pathology and named as atrocity. The order's position is stated without hedging — nothing in that material romanticises anything; it was an industrial atrocity dressed in stolen runes. And the limb goes further than a condemnation: Ed has, through meditation and ritual recall, identified a past-life character who stood inside that regime, and the work is an enforced integration with the feelings, choices and paths of previous beings, positively and negatively impacting alike, with nothing disowned.`),

  E('eg-38-tagline', O, ['what is the tagline', 'life love magic', 'egregora motto', 'what is the creed'],
    'What is the house’s tagline?',
    `Life, Love, Magic. Three words, and the site is firm that they are the whole of it — an earlier eight-word formulation was retired and should not come back. The three are meant to be read as a sequence rather than a list: life as the fact to be explained, love as the force that binds and attends, magic as the deliberate use of symbol and attention to change a mind. It appears on the Five Solids tee under the nested platonic solids, engraved the way a plate-maker would have left them, construction lines and annotations included. That choice is characteristic — the house would rather show you the working than present you with a finished mystique.`),

  E('eg-38-use', O, ['how do i use this site', 'where do i start', 'podcasts videos infographics', 'what is on the site'],
    'How should I use this place?',
    `Podcasts for long-form conversation, released regularly. Videos for visual essays, grove walks and whiteboard cosmology. Infographics, one idea per page, drawn properly rather than generated — and the infographics page carries copies of every infographic drawn anywhere else on the site, so it works as a visual index. The pages themselves for the limbs. The oracle when you want a quick answer in the house's own words. The letter form when you want a person. The order's own advice is to start with one limb that interests you and read it whole rather than sampling, because the pages are written to be argued with and a fragment will not show you whether the argument holds.`),

  E('eg-38-tti', O, ['what is the two infinities', 'what is tti', 'second site', 'relationship between the sites'],
    'What is The Two Infinities, and how does it relate to this?',
    `The same house, built around one framework rather than eleven limbs. Its thesis, verbatim: the universe is an eternal integration of opposing infinities, which together swing like a pendulum that cannot settle. Chaos is demoted there to a stated consequence above a threshold rather than part of the thesis. It carries the same formatting and the same full set of capabilities, re-themed to astronomy and the galactic torus, with ShakDrah the green dragon in place of Gink. Sign-up, sign-in and the mailing list come as one package across both — joining or subscribing on either covers both. The two corpora are kept identical by an automated gate, so a question answered on one is answered on the other.`)
];
