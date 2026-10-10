/** Oracle corpus, volume XXVIII — the astronomy page, worked section by
 * section: the ladder of scale, what a star is, how long one gets, the four
 * classes of black hole, rotation curves, and how any of this is known.
 *
 * Shared by both oracles: Gink on EGregoRA, ShakDrah on The Two Infinities.
 * Register: plain words, no grading diamonds in prose. Numbers given as
 * numbers; the framework's reading named as such, objection kept attached. */
const E = (id, limb, keys, q, a) => ({ id, limb, keys, q, a });
const A = 'astronomy';
const P = 'physics';

export const VOL28 = [
  E('ast-28-never-touched', A, ['has anyone touched a star', 'astronomy oldest limb', 'discipline of looking up', 'how do we know about stars'],
    'Why does the order call astronomy its strictest limb?',
    `Because of one fact that never stops being strange: no astronomer has ever touched a star. Everything known about the composition, temperature, mass, distance and motion of every star in the sky was worked out from light. There is no sample, no laboratory, no second opinion. That makes astronomy the place where the mystical and the measurable have the longest shared border — and the border is best policed precisely because there is nowhere else to appeal. A claim here either survives the light or it does not.`),

  E('ast-28-ladder', A, ['ladder of scale', 'how big is the universe', 'powers of ten', 'scale of the cosmos'],
    'What is the ladder of scale?',
    `One map, nineteen rungs, twenty-six powers of ten — from the face of the Sun out to the edge of the observable universe, and then one turn further. The first nineteen rungs are measurements: radar fixes the astronomical unit to the metre, parallax calibrates the nearby stars, Cepheids calibrate parallax, supernovae calibrate Cepheids, and each rung above rests on the one below. Kick out a rung and everything above it moves. That is the whole structure of astronomical distance in one sentence, and it is why cosmologists are so careful about calibration and so impatient with anyone who treats a headline distance as a bare fact.`),

  E('ast-28-last-rungs', A, ['last two rungs', 'are the last two rungs measured', 'framework shape of the whole', 'beyond the observable universe'],
    'Are all nineteen rungs of the ladder measured?',
    `Seventeen are. The last two are not, and the map says so by changing what it draws: the rings and the star field fade out and a torus with a single half-twisted band running round it fades in, with the whole observable universe sitting inside it. That is the framework's own figure for the shape of everything, and it is presented as a figure. The honest way to read the ladder is that the bottom of it is measured, the top of it is argued, and the seam between the two is exactly where a reader should slow down.`),

  E('ast-28-what-a-star-is', A, ['what is a star', 'why do stars shine', 'hydrostatic equilibrium', 'gravity and radiation'],
    'What is a star, physically?',
    `A ball of plasma in which gravity pulling in and radiation pushing out have agreed to a truce. That truce is called hydrostatic equilibrium and the whole of stellar astronomy is the study of how it is kept and how it ends. Fusion in the core generates the outward pressure; the star's own weight supplies the inward. When the fuel runs out the truce is called off, and what happens next depends almost entirely on how much mass was left in the core at that moment.`),

  E('ast-28-obafgm', A, ['spectral classes', 'o b a f g k m', 'what are the spectral types', 'stellar classification'],
    'What do the letters O, B, A, F, G, K, M mean?',
    `Surface temperature, running from roughly forty thousand kelvin at the O end down to about twenty-four hundred at the M end. The Sun is a G. The sequence is not alphabetical and that is an accident of history rather than a mnemonic failure: Annie Jump Cannon reordered Pickering's hydrogen-line classes at Harvard around 1901 when it became clear the original ordering was tracking the wrong thing. The old scheme had been arranged by hydrogen line strength, which peaks in the middle of the range rather than at one end, so the letters were left behind in their new order and the field learned the phrase "oh be a fine girl, kiss me" instead.`),

  E('ast-28-lifetime', A, ['how long do stars live', 'mass luminosity relation', 'why do big stars die fast', 'stellar lifetime'],
    'Why do massive stars die so quickly?',
    `Because they are profligate. Lifetime goes roughly as mass divided by luminosity, and luminosity goes as something near the 3.5th power of mass — so doubling a star's mass cuts its life by a factor of about ten. A sixty-solar-mass O star burns out in a few million years, which is shorter than the interval between some mass extinctions on Earth. The Sun gets about ten billion. A red dwarf gets trillions, which is longer than the universe has existed, and is why not one has ever died of old age.`),

  E('ast-28-three-doors', A, ['how do stars die', 'white dwarf neutron star black hole', 'what happens at the end of a star', 'stellar remnants'],
    'What does a star leave behind?',
    `Almost entirely set by the mass of its core when fusion stops, and there are three doors. Under about eight solar masses, the star swells to a red giant, sheds its outer layers as a planetary nebula — named by Herschel, and nothing to do with planets — and leaves a white dwarf the size of the Earth with the mass of the Sun. Between roughly eight and twenty, the core collapses and rebounds in a supernova, leaving a neutron star: a city of neutrons, twenty kilometres across, spinning in milliseconds. Above that, nothing holds and it is a black hole.`),

  E('ast-28-multiples', A, ['are most stars alone', 'binary stars', 'do stars have companions', 'stellar multiples'],
    'Are most stars alone?',
    `No, and the fact matters for everything downstream. Something like half of Sun-like stars are in binaries or higher multiples, and the figure rises steeply with mass — among O stars, nearly all have companions. That changes how you read stellar evolution, because a close companion can strip a star's envelope, feed it mass, or merge with it, producing objects no isolated star could ever become. Type Ia supernovae, the standard candles the whole distance ladder above us rests on, are a product of exactly that traffic.`),

  E('ast-28-cepheids', A, ['cepheid variables', 'period luminosity', 'henrietta leavitt', 'standard candles'],
    'Why are Cepheid variables so important?',
    `Because they gave astronomy its first real yardstick. A Cepheid pulses with a period set by its luminosity, a relation Henrietta Leavitt published in 1912. Measure the period and you know the true brightness; compare that with how bright it looks and you have the distance. Hubble used exactly this in 1924 on the Andromeda nebula and found it far too distant to be inside the Milky Way, which ended the island-universe debate and was the largest single expansion of the known world in the history of the species.`),

  E('ast-28-frost-line', A, ['frost line', 'why are inner planets rocky', 'gas giants and ice giants', 'structure of the solar system'],
    'Why are the inner planets rocky and the outer ones not?',
    `Because of the frost line — the distance from the young Sun beyond which water, ammonia and methane could condense as ice. Inside it, only rock and metal could gather, and there was not much of either, so you get four small dense worlds. Outside it, ices were abundant, so cores grew massive enough to capture hydrogen and helium directly. Note the naming error the page insists on: Uranus and Neptune are mostly water, ammonia and methane under crushing pressure. They are ice giants. They should never have been called gas giants, and the term survives only through habit.`),

  E('ast-28-51peg', A, ['51 pegasi b', 'first exoplanet', 'hot jupiter', 'exoplanet discovery history'],
    'What was the first exoplanet around a Sun-like star?',
    `51 Pegasi b, found in 1995 — a Jupiter-mass planet four days from its star. Nobody had a theory that allowed it, and the field's first response was to doubt the measurement. That reaction is worth remembering, because it is the standard first response to any genuinely new result. Kepler, launched in 2009, then found thousands by watching for the one-hundredth-of-a-per-cent dip as a planet crossed its star. We now have nearly six thousand, and almost nothing about our own solar system's arrangement turns out to be typical.`),

  E('ast-28-galaxy-shapes', A, ['types of galaxy', 'spiral elliptical irregular', 'density waves', 'galaxy classification'],
    'What are the main kinds of galaxy?',
    `Four shapes, and the habits matter more than the pictures. Spirals are rotating discs of gas, dust and young blue stars with a bulge of old ones, and the arms are density waves rather than solid structures — stars drift through them the way traffic drifts through a jam. They are still making stars. Barred spirals, about two thirds of spirals, have a bar of stars funneling gas inward. Ellipticals are old, red, round and finished. Irregulars are what is left, often after a collision. The classification is descriptive, not evolutionary, and a great many galaxies sit between the boxes.`),

  E('ast-28-quasars', A, ['what is a quasar', 'seyfert blazar radio galaxy', 'active galactic nucleus', 'are quasars different objects'],
    'Are quasars, Seyferts, blazars and radio galaxies different things?',
    `Mostly not, and the discovery that they are one object was a genuine simplification of the sky. In a few per cent of galaxies the central black hole is eating, and the infalling matter outshines every star in the host combined. These were catalogued as four different kinds of object before it was realised they are the same object seen from different angles. A blazar points its jet at us; a radio galaxy points it sideways; a quasar and a Seyfert differ largely in how luminous the nucleus is relative to its galaxy. Angle and appetite, not species.`),

  E('ast-28-rotation-curves', A, ['rotation curves', 'vera rubin', 'dark matter evidence', 'why do galaxies rotate too fast'],
    'What did the rotation curves actually show?',
    `That the outskirts of spiral galaxies turn too fast. Vera Rubin and Kent Ford, through the 1970s, measured rotation speeds at increasing distance from the centre. By Kepler, the speed should fall off with distance from the mass, the way planetary speeds fall off from the Sun. It does not: it flattens. So either there is five times more mass than we can see, arranged in a halo rather than a disc, or gravity does not behave the way we think at those scales. The first reading won, and dark matter is now most of the mass budget of the universe — but note that the second reading is the actual alternative, and it has never been fully eliminated.`),

  E('ast-28-cosmic-web', A, ['cosmic web', 'filaments and voids', 'large scale structure', 'how are galaxies distributed'],
    'How are galaxies arranged in space?',
    `Not evenly, and the pattern has a name. Galaxies sit in groups of dozens and clusters of thousands; the clusters sit on filaments of dark matter and hot gas; the filaments wall off voids hundreds of millions of light years across with almost nothing in them. The whole thing is called the cosmic web and it looks, at the largest scales, like a sponge or a neural network. It grew from density fluctuations of one part in a hundred thousand in the early universe, amplified by gravity for thirteen billion years, and the fact that we can predict that structure from the microwave background is one of the strongest results in cosmology.`),

  E('ast-28-bh-def', A, ['what is a black hole', 'is a black hole a hole', 'escape velocity light', 'event horizon definition'],
    'What is a black hole, exactly?',
    `Not a hole and not made of anything. It is a region where the escape velocity exceeds the speed of light — which is to say, more precisely, a region whose future points inward. Once inside, every path you can take leads further in, not because something is pulling harder but because the direction out no longer exists in the geometry. That is the whole content of the phrase. It is a place where the causal structure of spacetime has been rearranged, not an object with a surface.`),

  E('ast-28-bh-classes', A, ['types of black hole', 'stellar intermediate supermassive', 'classes of black hole', 'how big do black holes get'],
    'What are the four classes of black hole?',
    `By mass, and the gaps between them are informative. Stellar-mass, three to a hundred and fifty suns — the remnant of a massive star whose core could not be held up; Cygnus X-1 was the first that convinced people, in 1971, and was the subject of a bet Hawking placed against himself and lost in 1990. Intermediate, a hundred to a hundred thousand suns — the awkward middle, long suspected and poorly evidenced, with GW190521 producing a 142-solar-mass remnant as the cleanest case. Supermassive, millions to tens of billions, one at the centre of essentially every large galaxy. And primordial, hypothetical: proposed by Hawking and Zel'dovich, none ever observed.`),

  E('ast-28-sgra', A, ['sagittarius a star', 'black hole at centre of milky way', 's2 star orbit', 'supermassive black hole mass'],
    'How do we know the mass of the black hole at the centre of the Milky Way?',
    `By watching individual stars orbit an invisible point for thirty years. Sagittarius A* is 4.3 million solar masses, established by tracking stars like S2 all the way round — S2 passes within 120 astronomical units at three per cent of the speed of light. Ghez and Genzel shared the 2020 Nobel Prize for the work. It is worth sitting with the method for a moment: nobody imaged the hole until 2022, and nobody needed to. Orbital mechanics plus patience gave the mass decades earlier, and that is what a measurement looks like.`),

  E('ast-28-information', A, ['black hole information paradox', 'what happens to what fell in', 'is information lost in a black hole', 'unitarity and black holes'],
    'What is the black hole information paradox?',
    `The sharpest open problem at the join of quantum theory and gravity, and it comes from two rules that cannot both hold. Quantum mechanics is unitary: information is never destroyed, only scrambled. General relativity says a black hole is characterised entirely by mass, charge and spin — everything else that fell in is gone from the outside. Now add Hawking radiation, which is thermal and therefore carries no information about what made the hole. Let it evaporate completely and the information appears to have been destroyed, which unitarity forbids. Hawking argued for decades that it really was destroyed; he conceded in 2004. The modern candidate answers — information encoded in the radiation, preserved on the horizon, or leaked through replica wormholes — are live and none is settled.`),

  E('ast-28-how-known', A, ['how do we know distances', 'parallax', 'distance ladder', 'radar astronomical unit'],
    'How is any of this known at all?',
    `Every distance rests on a ladder, and each rung is calibrated by the one below. Radar and spacecraft fix the astronomical unit to the metre. Parallax — the apparent shift of a nearby star as the Earth orbits — gives the distances out to a few thousand light years, and Gaia has now measured parallaxes for over a billion stars. Cepheids calibrate against parallax, supernovae calibrate against Cepheids, redshift carries us the rest of the way. The important discipline is that this is one connected chain, not a set of independent facts. Any error propagates upward.`),

  E('ast-28-survives', A, ['what holds up in astronomy', 'solid results astronomy', 'stellar nucleosynthesis', 'expansion of the universe'],
    'Which parts of astronomy are genuinely solid?',
    `The short list is worth memorising. Stellar nucleosynthesis — the heavy elements in your body were assembled in stars and in neutron-star collisions, measured in spectra, in meteorites, and in the 2017 kilonova GW170817, which made gold in front of us. The expansion of the universe, measured independently by redshift, by the microwave background, and by the distribution of galaxies. General relativity in every regime it has been tested, including the orbit of Mercury and the direct detection of gravitational waves in 2015. And the ages of the oldest stars, which come out consistently below the age of the universe rather than awkwardly above it.`),

  E('ast-28-not-survives', A, ['astronomy myths', 'what does not hold up', 'planet like earth', 'planetary alignments'],
    'What does not hold up?',
    `Three claims the page names directly. "Astronomers have found a planet exactly like Earth" — they have not; they have found planets of similar radius in similar orbits with unknown atmospheres. "Planetary alignments cause things on Earth" — the tidal pull of Jupiter on you is less than that of a passing car, and there is no mechanism by which an alignment could do anything. And the routine conflation of a measurement with its interpretation: a redshift is a measurement, an expansion is an inference, and they are not the same statement.`),

  E('ast-28-eratosthenes', A, ['eratosthenes', 'measuring the earth', 'history of astronomy', 'how was the earth measured first'],
    'Where does the history of measurement start?',
    `With a stick and a well. Eratosthenes, around 240 BCE, knew the Sun stood directly overhead at Syene on the summer solstice and measured its shadow at Alexandria on the same day. The difference in angle, with the distance between the cities, gives the circumference of the Earth — to within a few per cent. It is the template for everything that followed: a local measurement, a geometric relation, and a number about something you cannot touch. Babylonian records begin around 1600 BCE and run unbroken for a millennium, which is why we can still predict eclipses today using data gathered before the word science existed.`),

  E('ast-28-light-year', A, ['what is a light year', 'parsec definition', 'astronomical units', 'distance units astronomy'],
    'What is a light year, and why do professionals use parsecs?',
    `A light year is the distance light travels in a year: 9.46 trillion kilometres. A distance, never a time, and the phrase is misused constantly in both directions. A parsec is 3.26 light years — the distance at which one astronomical unit subtends one arcsecond. Astronomers prefer it because it falls straight out of the parallax method that actually measures the distance, so a star with a parallax of one tenth of an arcsecond is ten parsecs away with no conversion factor in between. It is the unit that makes the measurement and the number the same act.`),

  E('ast-28-reading', A, ['best astronomy books', 'what should i read astronomy', 'sagan cosmos', 'kip thorne'],
    'What should I read on astronomy?',
    `Sagan's Cosmos, still the best first book, and honest about what was unknown when it was written — read it knowing some of it is now wrong. Kip Thorne's Black Holes and Time Warps, which is the history and the physics from someone who did both. Bradley Schaefer or similar for the measurement side, because the ladder is the part that makes everything else trustworthy. Then go to the primary record: the Gaia data release notes and the Planck papers are free, readable in their introductions, and are the actual frontier rather than a popular account of it.`),

  E('astro-28-two-questions', 'astrology', ['is astrology science', 'does astrology work', 'astrology tested', 'two questions not one'],
    'Is astrology true?',
    `The page splits the question in two because running them together is how the argument gets lost. First: does astrology predict measurable outcomes better than chance? The testing record is unambiguous and it says no. Second: is astrology a meaningful symbolic system with a real history and a real psychology? That one says yes, and it is a much more interesting yes. This order keeps both answers at once and refuses to let either collapse into the other. It is studied here as symbolic technology — history and meaning, not a prediction engine.`),

  E('astro-28-testing', 'astrology', ['astrology testing', 'gauquelin', 'time twins study', 'astrology experiments'],
    'What did the actual tests find?',
    `That astrology does not beat chance, repeatedly and across several independent designs. The time twins study is the cleanest: people born within minutes of each other, sharing a chart almost exactly, tracked across decades and found to diverge on personality, occupation and life outcomes no less than strangers do. Shawn Carlson's 1985 double-blind test in Nature had practising astrologers match charts to personality profiles and they performed at chance. The honest reading is not that the tests were rigged but that the effect, whatever it is, is not in the predictions.`),

  E('astro-28-nature-study', 'astrology', ['nature astrology study', 'double blind astrology', 'shawn carlson', 'nature 1985 astrology'],
    'What was the Nature study, and why does it matter?',
    `Shawn Carlson, 1985, published in Nature — and it matters because Carlson designed it with the astrologers' cooperation, which removes the usual objection that the test was set up by a sceptic to fail. Practising astrologers were given natal charts and asked to match them to standardised personality profiles. They performed at chance, and they knew the protocol in advance and agreed to it. That is the standard a good test sets: designed with the believers, run blind, pre-agreed outcome. Very few contested claims have ever met it.`),

  E('astro-28-accurate-feeling', 'astrology', ['why does astrology feel accurate', 'barnum effect', 'forer', 'subjective validation'],
    'Why does astrology feel so accurate?',
    `Because it is doing something real, just not what it claims to be doing. Bertram Forer's 1948 experiment gave every student the same personality profile, assembled from newspaper astrology columns, and they rated its accuracy at 4.3 out of 5. The effect has three parts: statements vague enough to be true of anyone, framed specific enough to feel personal; confirmation bias, which keeps the hits and discards the misses; and the fact that being described is itself an act of attention, and attention to yourself produces change. None of that requires the planets. All of it is measurable.`),

  E('astro-28-chart-built', 'astrology', ['how is a chart built', 'natal chart construction', 'ephemeris chart', 'what goes into a birth chart'],
    'How is a chart actually built?',
    `From three inputs and a great deal of arithmetic, none of it mysterious. Your birth time and place fix where you stood on a rotating sphere; the ephemeris gives the position of every body at that instant; the house system projects your local horizon and meridian onto the sky and divides it into twelve. Add the zodiac positions of the planets and you have a chart. It is a genuine astronomical calculation — the positions are correct, the mathematics is sound. What is not established is that the resulting picture means anything about you.`),

  E('astro-28-signs', 'astrology', ['twelve signs', 'what are the zodiac signs', 'zodiac meanings', 'aries taurus gemini'],
    'What are the twelve signs?',
    `Twelve thirty-degree sectors of the ecliptic, each carrying a traditional character: Aries, initiative and impulse; Taurus, persistence and appetite; Gemini, connection and restlessness; Cancer, memory and enclosure; Leo, display and generosity; Virgo, discrimination and service; Libra, relation and balance; Scorpio, intensity and transformation; Sagittarius, reach and overreach; Capricorn, structure and endurance; Aquarius, principle and detachment; Pisces, dissolution and compassion. Read them as a vocabulary for temperament rather than a description of people. As vocabulary they are unusually economical; as description they fail the tests above.`),

  E('astro-28-planets', 'astrology', ['what do the planets mean astrology', 'planetary symbolism', 'saturn jupiter meaning', 'planets in astrology'],
    'What do the planets stand for?',
    `Functions rather than influences, in the way the tradition actually uses them. The Sun is the organising centre of a life and the sense of purpose; the Moon is habit, body, and what you do without deciding; Mercury is how you connect and convey; Venus is what you value and how you approach it; Mars is appetite and assertion; Jupiter is expansion and the reach that overshoots; Saturn is limit, time and structure; Uranus is rupture; Neptune is dissolution and vision; Pluto is the pressure that transforms. They are a set of categories for describing a psyche, and they are good categories.`),

  E('astro-28-houses', 'astrology', ['what are the houses astrology', 'twelve houses meaning', 'first house seventh house', 'astrological houses'],
    'What are the twelve houses?',
    `The sectors of your own sky rather than of the ecliptic, which is the distinction people most often miss. Where the signs describe how a force behaves, the houses describe where in a life it operates: the first house is the self as presented, the fourth home and origin, the seventh partnership, the eighth shared resources and mortality, the tenth public standing, the twelfth what is hidden or withdrawn. Because they are keyed to your horizon, they need a birth time to within a few minutes. Get the time wrong and the whole structure rotates, which is one reason practitioners insist on it.`),

  E('astro-28-aspects', 'astrology', ['what are aspects astrology', 'conjunction opposition trine square', 'astrological aspects', 'major aspects'],
    'What are the aspects?',
    `The angles between bodies, and the part of the system with the most internal logic. A conjunction, bodies at the same degree, fuses two functions whether or not that is comfortable. An opposition, a hundred and eighty degrees, sets them against each other and demands a decision. A trine, a hundred and twenty, is ease and flow — and is considered by experienced practitioners to be less useful than it sounds, because nothing gets done. A square, ninety degrees, is friction and therefore movement. A sextile, sixty, is opportunity that must be taken. The system's own claim is that tension is more productive than harmony, which is at least a defensible psychology.`),

  E('astro-28-big-three', 'astrology', ['big three astrology', 'sun moon ascendant', 'what is my rising sign', 'sun sign moon sign rising'],
    'What are the big three?',
    `The Sun sign, the Moon sign and the Ascendant — and they are worth having because they do three genuinely different jobs. The Sun sign is where you were born in the zodiac: your stated centre and what you are trying to become. The Moon sign is the sign the Moon occupied, which in the tradition governs habit, comfort and emotional reflex. The Ascendant is the sign rising on your eastern horizon at your birth minute, which frames how the whole chart is laid out and, in practice, how you are read by others on first meeting. The third of the three is the only one that requires an accurate birth time.`),

  E('astro-28-transits', 'astrology', ['what are transits', 'saturn return', 'planetary returns', 'astrological transits'],
    'What are transits and returns?',
    `Transits are where the planets are now, set against where they were at your birth; returns are when a planet comes back to its natal position. The Saturn return, at about twenty-nine and again at fifty-eight, is the famous one — Saturn takes that long to complete an orbit, so the return is an astronomical fact and the interpretation laid on it is a cultural one. It happens to land where adult life actually reorganises for most people, which is why it feels so precise. That coincidence is the whole of astrology's persuasive power in miniature: a real cycle, a real life stage, and no demonstrated connection between them.`),

  E('astro-28-precession', 'astrology', ['precession wrong sign', 'is my star sign wrong', 'astrology precession', 'thirteen signs ophiuchus'],
    'Is my sign wrong because of precession?',
    `No, and the objection misunderstands the system rather than refuting it. The Earth's axis precesses over about twenty-six thousand years, so the constellations have drifted roughly a month from where they were two thousand years ago. But Western astrology was never about constellations — it uses the tropical zodiac, twelve equal sectors measured from the spring equinox. Your sign is where you were in that seasonal frame, and it has not moved. This is the single most common "gotcha" in the whole debate and it dissolves on contact. It does not make astrology true. It does make the objection wrong.`),

  E('astro-28-ages', 'astrology', ['age of aquarius', 'precessional ages', 'what is the age of aquarius', 'astrological ages'],
    'What are the precessional ages?',
    `The spring equinox drifting backwards through the constellations, about one every two thousand one hundred and sixty years, giving twelve ages across the twenty-six thousand year cycle. The Age of Aquarius is the one everyone has heard of and nobody can date, because the boundaries between constellations are a modern convention drawn by the International Astronomical Union in 1930 rather than an ancient fact. Depending on where you put the line, we entered it anywhere from the eighteenth century to the twenty-seventh. That undateability is not a mystery; it is the absence of a definition.`),

  E('astro-28-honestly', 'astrology', ['how to use astrology honestly', 'using a chart honestly', 'astrology as tool', 'symbolic technology'],
    'How does this order say astrology should be used?',
    `As symbolic technology and nothing more. A chart is a structured vocabulary for thinking about a temperament, and structured vocabularies are genuinely useful: they give you a fixed set of categories so that reflection is repeatable rather than mood-driven, and the categories are old enough to encode several thousand years of observation about how people differ. Use it to generate questions about yourself. Do not use it to predict, to time decisions, to judge other people, or to excuse behaviour. The moment it is doing any of those it has crossed from tool into claim, and the claim does not survive the testing record above.`),

  E('astro-28-history', 'astrology', ['history of astrology', 'babylonian astrology', 'four thousand years', 'where did astrology come from'],
    'Where does astrology come from?',
    `Babylon, over four thousand years, and it began as a state instrument rather than a personal one. The earliest records are omen texts read for the king and the harvest, not for individuals; horoscopic astrology — the personal birth chart — is a Hellenistic development, roughly the last centuries BCE, when Babylonian observation met Greek geometry and Egyptian religion. It spread to India, to the Islamic world, and to medieval Europe, where it was practised by people we would now call astronomers without any sense of contradiction. Kepler cast charts. The split between the two disciplines is recent and is worth remembering when the word pseudoscience is deployed.`),

  E('astro-28-stands', 'astrology', ['where does the order stand on astrology', 'order position astrology', 'egregora astrology stance'],
    'Where does this order actually stand?',
    `Both answers, held at once, and the holding is the point. The predictive claim fails and has failed repeatedly under conditions the practitioners themselves agreed to; this order does not defend it and will not soften it. The symbolic system is real, historically substantial, psychologically effective, and worth studying properly — which is why there is a full page of it here with every symbol explained. What the order refuses is the lazy position on either side: dismissing four thousand years of thought as nonsense, or treating a failed prediction engine as though the failure were an oversight.`)
];
