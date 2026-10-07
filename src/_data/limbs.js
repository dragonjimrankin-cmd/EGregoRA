/**
 * The eleven limbs of the order, in their proper order, with the sub-limbs
 * hung beneath the limb they belong to.
 *
 * This is the single place the list is written down. The index page builds
 * its grid and its reading list from here, so the limbs cannot be numbered
 * one way on one page and another way on the next. If a limb gains a page
 * of its own, change the href here and the whole site follows.
 *
 * `page: false` marks a limb whose material currently lives inside another
 * limb's page rather than on one of its own. Saying so is better than
 * quietly pointing at something else.
 */
export default [
  {
    num: 'I',
    glyph: 'star',
    title: 'Cosmic Physics',
    href: '/cosmic-aether/',
    page: false,
    body: 'Relativity, quantum field theory, thermodynamics and cosmology read as cosmology once was: an ' +
      'account of what the whole thing is doing and what that implies about us. Entropy, horizons, ' +
      'information, the arrow of time.',
    subs: [
      { num: 'I\u00b7i', title: 'Astronomy &amp; the Survey of the Sky', href: '/astronomy/' },
      { num: 'I\u00b7ii', title: 'The Cosmic Aether', href: '/cosmic-aether/' }
    ]
  },
  {
    num: 'II',
    glyph: 'tree',
    title: 'Druidry, Trees &amp; the Living Earth',
    href: '/druids/',
    page: true,
    body: 'The grove as a laboratory. Phenology, mycorrhizal networks, the ogham tree alphabet, the eight ' +
      'stations of the solar year, and what it does to a nervous system to keep seasonal time for a decade.',
    subs: [
      { num: 'II\u00b7ix', title: 'Runes, Charms &amp; Natural Energies', href: '/runes/' }
    ]
  },
  {
    num: 'III',
    glyph: 'metatron',
    title: 'Sacred Geometry &amp; Natural Form',
    href: '/sacred-geometry/',
    page: true,
    body: 'Phyllotaxis, the Fibonacci spiral, close-packing, minimal surfaces, Platonic and Archimedean ' +
      'solids \u2014 why pattern recurs across scales, and where the honest mathematics ends and the wishful ' +
      'numerology begins.',
    subs: [
      { num: 'III\u00b7iii', title: 'Sound, Music &amp; the Cosmic Brainwave', href: '/music/' }
    ]
  },
  {
    num: 'IV',
    glyph: 'spiral',
    title: 'Astrology as Symbolic Technology',
    href: '/astrology/',
    page: true,
    body: 'Not as a prediction engine but as humanity\u2019s oldest symbolic operating system: a 4,000-year ' +
      'archive of how we map character, time and meaning onto the sky. Studied historically, used ' +
      'reflectively, tested honestly.',
    subs: []
  },
  {
    num: 'V',
    glyph: 'eye',
    title: 'Neuroscience, Psychology &amp; the Visionary State',
    href: '/neurobiology/',
    page: true,
    body: 'Predictive processing, the default mode network, entropic brain theory; meditation, breath, ' +
      'fasting and the serotonergic psychedelics as instruments that alter the observer rather than the ' +
      'observed.',
    subs: []
  },
  {
    num: 'VI',
    glyph: 'seed',
    title: 'Biology &amp; the Stubbornness of Life',
    href: '/neurobiology/',
    page: false,
    body: 'Autopoiesis, symbiogenesis, morphogenesis, bioelectricity. How matter learned to hold a shape ' +
      'against the current, and why every cell is already solving problems we have no good language for.',
    subs: []
  },
  {
    num: 'VII',
    glyph: 'star',
    title: 'God, the Law of One &amp; the Contact Question',
    href: '/extraterrestrials/',
    page: true,
    body: 'Non-duality across traditions; the Ra material read as a philosophical text rather than ' +
      'scripture; Fermi, Drake, Avi Loeb, the UAP record and the discipline of holding a question open ' +
      'without filling it.',
    subs: []
  },
  {
    num: 'VIII',
    glyph: 'eye',
    title: 'The Black Tribunal',
    href: '/occult/#black-tribunal',
    page: false,
    body: 'How esoteric ideas get captured by tyranny \u2014 the Thule and Ahnenerbe occultism of the Nazi ' +
      'regime, the theft of ancient symbols, the pseudo-science of race. Studied as pathology, named as ' +
      'atrocity, never as inspiration. Its material sits inside the Occult page until it has a room of its own.',
    subs: []
  },
  {
    num: 'IX',
    glyph: 'metatron',
    title: 'Magic &amp; the Wizard\u2019s Craft',
    href: '/wizardry/',
    page: true,
    body: 'Magic defined operationally: the deliberate use of symbol, attention and ritual to reconfigure a ' +
      'mind, and through that mind, a life. Ceremony, sigil, memory palace, intention. The wizard as applied ' +
      'psychologist with better robes.',
    subs: [
      { num: 'IX\u00b7i', title: 'The Occult', href: '/occult/' },
      { num: 'IX\u00b7ii', title: 'The Hermetic Qabalah &amp; the Tree of Life', href: '/qabalah/' }
    ]
  },
  {
    num: 'X',
    glyph: 'spiral',
    title: 'Alchemy &amp; the Elemental Forces',
    href: '/elemental-alchemy/',
    page: true,
    body: 'Earth, water, air and fire were never a failed chemistry \u2014 they were a working taxonomy of ' +
      'states and tendencies: the solid, the flowing, the volatile, the transforming. Carried forward into ' +
      'phase, plasma and thermodynamics, and inward into the <em>opus</em>: nigredo, albedo, citrinitas, ' +
      'rubedo. Salt, sulphur and mercury; solve et coagula; the quintessence the other four turn around.',
    subs: []
  },
  {
    num: 'XI',
    glyph: 'eye',
    title: 'Consciousness &amp; the Hard Problem',
    href: '/consciousness/',
    page: true,
    body: 'The newest limb and the one most likely to be wrong. Why there is something it is like to be you; ' +
      'Chalmers\u2019 hard problem, integrated information, global workspace, and the Penrose\u2013Hameroff claim ' +
      'that the answer is quantum and sits in the microtubule. Held as a live question and kept in the ' +
      'speculative column until the physics obliges us to move it.',
    subs: [
      { num: 'XI\u00b7i', title: 'Decoherence &amp; the Remembered Self', href: '/decoherence/' },
      { num: 'XI\u00b7ii', title: 'Local &amp; Non-Local Reality', href: '/locality/' }
    ]
  }
];
