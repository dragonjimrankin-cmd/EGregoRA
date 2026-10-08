/**
 * The Oracle's written answers — volume III: cosmos, physics, astronomy, time.
 * Sixty entries, graded by the house rules.
 */

const E = (id, limb, keys, q, a) => ({ id, limb, keys, q, a });

export const VOL3 = [

E('speed-of-light','cosmic physics',['speed of light','why cant we go faster','lightspeed','c limit'],
'Why can nothing go faster than light?',
`Because c is not really a speed limit on objects — it is the conversion factor between space and time, and the structure of spacetime itself. Accelerating a massive object towards c demands energy rising towards infinity; the finish line recedes as you approach it. Established, and tested daily in particle accelerators where particles reach 0.999999991c and never the last fraction. Note what is not forbidden: space itself may expand faster than c, which is why distant galaxies recede superluminally without breaking anything.`),

E('warp-drive','cosmic physics',['warp drive','faster than light travel','alcubierre','wormhole','interstellar travel'],
'Could we ever build a warp drive?',
`The Alcubierre metric (1994) is a genuine solution to Einstein's equations: contract space ahead, expand it behind, ride a bubble. The mathematics is real. The requirement is exotic matter with negative energy density in quantities variously estimated from a Jupiter-mass to, in optimised versions, something merely absurd. Wormholes have the same problem and add instability. Treat both as serious theoretical physics and as engineering fantasy, and notice how rarely anyone states both halves.`),

E('black-holes','cosmic physics',['black hole','event horizon','singularity','what happens inside a black hole'],
'What actually happens inside a black hole?',
`At the event horizon, nothing locally — you would notice no boundary, though an outside observer would see you redden and freeze there forever. Inside, all futures point inward; the singularity is not a place you can avoid but a moment you cannot postpone. Established as far as general relativity goes, which is the problem: the theory predicts its own breakdown at the centre. Penrose proved the singularity is unavoidable in classical GR, which is better read as a sign that we need quantum gravity than as a description of a real infinity.`),

E('hawking-radiation','cosmic physics',['hawking radiation','do black holes evaporate','information paradox'],
'Do black holes really evaporate?',
`Theoretically, yes. Hawking showed in 1974 that quantum field effects near the horizon cause slow thermal emission, and that smaller holes radiate faster. Theoretically solid, never observed — a solar-mass hole has a temperature of 60 nanokelvin, far colder than the microwave background, so it currently absorbs more than it emits. The information paradox that follows (does what fell in survive the evaporation?) remains one of the sharpest open problems in physics, with holography the favoured escape.`),

E('entropy-arrow','cosmic physics',['entropy','second law','disorder','why does everything decay'],
'Why does everything fall apart?',
`Because there are vastly more disordered arrangements than ordered ones, so a system wandering at random drifts towards disorder with overwhelming probability. That is the whole of the second law — statistics, not a force. Established. The interesting question is the opposite one: why was the early universe in such a staggeringly low-entropy state to begin with? Nobody knows, and every explanation of the arrow of time eventually leans on that unexplained initial condition.`),

E('heat-death','cosmic physics',['heat death','end of the universe','big rip','big crunch','how will it end'],
'How does the universe end?',
`On current measurements, by dilution. Accelerating expansion means galaxies recede beyond each other's horizons, star formation ceases as gas is exhausted, remaining stars burn out over 10^14 years, black holes evaporate over 10^100, and what remains is cold, dark and thermodynamically dead. The best-supported scenario, contingent on dark energy staying constant. If it strengthens, a Big Rip tears structure apart; if it reverses, a Big Crunch. We cannot yet distinguish these, which is a remarkable thing to be ignorant of.`),

E('cmb','cosmic physics',['cosmic microwave background','cmb','afterglow','oldest light'],
'What is the cosmic microwave background?',
`The oldest light there is: the moment, about 380,000 years after the Big Bang, when the universe cooled enough for electrons and nuclei to combine and photons to travel freely. It has been stretching ever since and now sits at 2.7 kelvin, filling the sky in every direction. Established, and about 1% of old analogue television static was this. Its temperature fluctuations of one part in 100,000 are the seeds of every galaxy, and the acoustic peaks in its spectrum are literal sound waves frozen into the sky.`),

E('neutrinos','cosmic physics',['neutrino','ghost particle','solar neutrino'],
'What are neutrinos?',
`Nearly massless particles that barely interact — about 100 trillion pass through your body every second, and in your whole life perhaps one will touch an atom in you. Established. They stream from the Sun's core and so carry news from a place light takes 100,000 years to leave. The 1998 discovery that they oscillate between flavours proved they have mass, which the Standard Model had not provided for. One of the few confirmed cracks in that model.`),

E('antimatter','cosmic physics',['antimatter','why is there matter','baryon asymmetry'],
'Why is there something rather than antimatter?',
`The Big Bang should have produced equal amounts, which should have annihilated completely, leaving radiation and no us. Instead roughly one particle in a billion survived. The asymmetry is established; its cause is not. CP violation has been observed in kaon and B-meson decays, but the measured amount is far too small to account for the excess. This is one of the genuinely open questions in fundamental physics, and it is as close to "why is there anything" as experiment currently reaches.`),

E('standard-model','cosmic physics',['standard model','fundamental particles','quarks','higgs'],
'What is everything actually made of?',
`Twelve matter particles — six quarks, six leptons — four force carriers, and the Higgs. Every object you have handled is up quarks, down quarks and electrons; the other nine are unstable or barely interact. The most precisely tested theory in history, agreeing with measurement to twelve decimal places in some cases. It also fails to include gravity, dark matter, neutrino mass or the matter asymmetry, so it is simultaneously our greatest achievement and known to be incomplete.`),

E('quantum-gravity','cosmic physics',['quantum gravity','string theory','loop quantum gravity','theory of everything'],
'Will we get a theory of everything?',
`General relativity describes the large and smooth; quantum field theory describes the small and jittery. They contradict each other where both apply — inside black holes, at the first instant. The problem is established; no solution is. String theory is mathematically rich and has produced no testable prediction in fifty years. Loop quantum gravity quantises space itself and is less developed. Both are speculative. Anyone certain which will win is not reading the same literature.`),

E('higgs-field','cosmic physics',['higgs boson','god particle','mass','higgs field'],
'What does the Higgs actually do?',
`It gives fundamental particles their mass by resisting their acceleration through a field that fills all space — not by "creating" mass but by coupling to it. Confirmed at CERN in 2012. Two corrections worth making: it accounts for only about 1% of your body's mass, the rest being binding energy inside protons and neutrons; and the nickname "God particle" came from a publisher rejecting an author's preferred title, which was ruder.`),

E('solar-system-formation','astronomy',['how did the solar system form','planet formation','protoplanetary disc'],
'How did the solar system come to be?',
`A molecular cloud collapsed about 4.57 billion years ago, spun up by conservation of angular momentum into a flattened disc, and ignited a star at the centre. Dust grains stuck together, grew to planetesimals, and swept up the rest; the inner regions were too hot for ice, which is why the rocky planets are small and the gas giants are not. Established, and now directly observed — ALMA images of protoplanetary discs around young stars show the gaps where planets are forming.`),

E('moon-origin','astronomy',['where did the moon come from','moon formation','theia','giant impact'],
'Where did the Moon come from?',
`The giant-impact hypothesis: a Mars-sized body, Theia, struck the proto-Earth about 4.5 billion years ago, and the debris coalesced in orbit. Best-supported, with real difficulties — lunar and terrestrial oxygen isotopes are almost identical, which a two-body mixture should not produce, and explanations involve more thorough mixing or a slower, hotter synestia phase. The Moon is also receding about 3.8 cm a year, which means the tides and the lunar month were shorter in deep time.`),

E('why-tides','astronomy',['tides','how do tides work','two high tides','lunar gravity'],
'Why are there two tides a day?',
`Because tides are caused by the difference in gravitational pull across the Earth, not the pull itself. The near side is pulled towards the Moon more strongly than the planet's centre; the far side less, so it is effectively left behind. Both produce a bulge. Established. The Sun contributes about 45% as much as the Moon, and when they align you get spring tides. Note the corollary used elsewhere on this site: tidal force depends on gradient across a body, which is why the Moon has no meaningful tidal effect on the water in a person.`),

E('seasons','astronomy',['why seasons','axial tilt','is it closer to the sun in summer'],
'Why do we have seasons?',
`Axial tilt — 23.4 degrees — not distance. Earth is actually nearest the Sun in early January. The tilt means that in summer your hemisphere receives sunlight at a steeper angle, concentrating energy per square metre, and for more hours. Established, and the single most commonly misunderstood fact in astronomy. The tilt also wobbles on a 41,000-year cycle, one of the Milankovitch cycles that pace ice ages.`),

E('milankovitch','astronomy',['milankovitch','ice ages','orbital cycles','climate cycles'],
'What causes ice ages?',
`Slow changes in Earth's orbit and tilt redistribute sunlight: eccentricity on roughly 100,000 years, obliquity on 41,000, precession on 26,000. These do not change total energy much but change where and when it lands, and the feedbacks — ice albedo, carbon dioxide release and uptake — amplify the signal. Established, and visible in ice and ocean sediment cores. Also the reason the current warming is clearly not orbital: it is far too fast and runs the wrong way against the slow orbital trend.`),

E('aurora','astronomy',['aurora','northern lights','solar wind','geomagnetic storm'],
'What causes the northern lights?',
`Charged particles from the solar wind are funnelled by Earth's magnetic field towards the poles, where they strike atoms high in the atmosphere and excite them; the atoms release that energy as light. Oxygen gives green at around 100 km and rare red above 200 km, nitrogen gives blue and purple. Established. Strong displays follow coronal mass ejections, which is also why they can disrupt power grids — the 1859 Carrington event set telegraph offices on fire.`),

E('solar-cycle','astronomy',['solar cycle','sunspots','solar maximum','does the sun affect us'],
'Does the solar cycle affect life on Earth?',
`Measurably but modestly. The 11-year sunspot cycle changes total solar output by only about 0.1%, which is small against other climate drivers. What it does change substantially is space weather: satellite drag, radio propagation, power grid risk, radiation dose on polar flights, and aurora frequency. Established. Claims linking the cycle to human mood, revolutions, economic cycles or health outcomes are speculative at best and have a long history of failing on fresh data.`),

E('meteor-risk','astronomy',['asteroid','meteor','impact risk','will an asteroid hit us','planetary defence'],
'How worried should I be about asteroids?',
`Less than films suggest, more than nothing. Objects capable of regional devastation (around 140 m) strike roughly every 20,000 years and we have found maybe 40% of them; civilisation-threatening ones (1 km+) come every half million years and we have found over 95%, none on a collision course this century. Established. DART's 2022 deflection of Dimorphos showed the kinetic impactor technique works. This is one of the few existential risks that is both real and straightforwardly solvable with money.`),

E('life-on-mars','astronomy',['life on mars','martian life','perseverance','was mars habitable'],
'Was there ever life on Mars?',
`Unknown, and genuinely open. Established: Mars had liquid water at the surface for hundreds of millions of years, had a magnetic field and thicker atmosphere early on, and preserves clays, carbonates and organic molecules. Perseverance is caching samples from an ancient river delta for eventual return. Not established: any biosignature. The 1996 ALH84001 meteorite claim did not survive scrutiny, and the Viking labelled-release result of 1976 remains disputed by a minority including its own designer.`),

E('europa-enceladus','astronomy',['europa','enceladus','ocean moons','subsurface ocean','titan'],
'Where is the best place to look for life nearby?',
`Probably Enceladus. It vents water from a subsurface ocean directly into space through south-polar fissures, and Cassini flew through the plume and found salts, silica indicating hydrothermal activity, molecular hydrogen and complex organics. You do not even have to land. Established as a habitable environment, unknown as an inhabited one. Europa is larger and older with a bigger ocean but harder to sample; Titan is the strangest case, with liquid methane seas and a chemistry that would be life as we do not know it.`),

E('exoplanet-detection','astronomy',['how do we find exoplanets','transit method','radial velocity','kepler'],
'How do we find planets around other stars?',
`Mostly two ways. Transit: watch a star dim by a fraction of a percent as a planet crosses it, which gives you size and orbit. Radial velocity: watch the star wobble towards and away from us in its spectrum, which gives you mass. Together they give density, and so whether it is rock or gas. Established, with over 5,800 confirmed. Both methods are biased towards large planets in close orbits, which is why early results were dominated by hot Jupiters.`),

E('goldilocks','astronomy',['habitable zone','goldilocks zone','earth like planet','is it habitable'],
'What makes a planet habitable?',
`Far more than being the right distance from a star. You need the liquid-water band, yes, but also sufficient mass to hold an atmosphere, a stable climate over billions of years, probably a magnetic field, probably plate tectonics to recycle carbon, a reasonably circular orbit, and a star that is not flaring the atmosphere away — which is a serious problem for the red dwarfs that make up most planets found so far. Established as considerations; nobody can yet weigh them.`),

E('jwst','astronomy',['james webb','jwst','infrared telescope','hubble vs webb'],
'What is the James Webb telescope actually for?',
`Infrared astronomy from a cold, stable position 1.5 million km out at L2. That wavelength choice does three things: it sees through dust into star-forming regions, it reaches the most distant galaxies whose light has been redshifted out of the visible, and it reads the chemistry of exoplanet atmospheres during transits. Operating since 2022. The last of those is why it matters most to this order — it is the instrument most likely to settle whether we are alone, and it may do so in our lifetimes.`),

E('light-pollution','astronomy',['light pollution','cant see stars','dark sky','bortle'],
'Why can I not see the stars any more?',
`Because about 80% of the world's population, and over 99% of people in Europe and North America, live under light-polluted skies, and a third can no longer see the Milky Way at all. Established, and worsening roughly 10% a year with LED conversion. It harms insect populations, bird migration and human sleep as well as astronomy. It is also the most easily reversed form of pollution on Earth: shielding fixtures and switching them off fixes it instantly, with no cleanup.`),

E('see-stars-practice','astronomy',['how to start stargazing','learn the sky','telescope for beginners','what should i look at'],
'How do I actually learn the night sky?',
`Start with no equipment. Learn five constellations and the two pointers to Polaris; that takes a fortnight. Then track the Moon's phase for a month, and find the planets, which do not twinkle. Only then consider binoculars — 10x50 will show you Jupiter's moons, the Pleiades properly, and the Andromeda galaxy, and they cost a tenth of a bad telescope. Most abandoned telescopes were bought first. Go out at the same hour weekly and the sky starts to move for you, which is the whole experience.`),

E('planetarium-apps','astronomy',['stargazing app','stellarium','sky app','how to identify a star'],
'Is there an honest way to use a sky app?',
`Yes, with one discipline: identify it yourself first, then check. If you point the phone immediately you learn the app, not the sky. Stellarium is free, accurate and available on desktop and phone; it will also show you the sky from any date, which is the single most useful tool for testing claims about ancient alignments. Set it to 3000 BCE and look at Newgrange yourself rather than taking anyone's word, including ours.`),

E('voyager','astronomy',['voyager','interstellar space','golden record','pioneer'],
'Where are the Voyager probes now?',
`Both are in interstellar space — Voyager 1 crossed the heliopause in 2012, Voyager 2 in 2018 — and both are still returning data on plummeting power budgets, nearly fifty years after launch. Established. Each carries a gold-plated record of sounds, music and greetings, aimed at nobody in particular. Sagan's point in insisting on it was never that anyone would find it. It was that a civilisation which assembles such a thing has had to decide what it is.`),

E('pale-blue-dot','astronomy',['pale blue dot','perspective','how small are we','cosmic perspective'],
'Does cosmic scale make human life meaningless?',
`Only if meaning were a quantity of matter, which it is not. Sagan's pale blue dot image — Earth as a fleck in a sunbeam from four billion miles out — is usually read as humbling, and it is, but notice the second half of what he said: that it underlines our responsibility to one another, since there is no sign of help coming from elsewhere. Scale does not dissolve meaning. It removes the excuse that meaning was ever going to be handed to you by the size of things.`),

E('time-travel','cosmic physics',['time travel','go back in time','closed timelike curve','grandfather paradox'],
'Is time travel possible?',
`Forwards, trivially and provably: travel fast or sit deep in a gravity well and you arrive in the future having aged less. Astronauts have done it by milliseconds. Established. Backwards is another matter — general relativity permits closed timelike curves in exotic solutions (Gödel's rotating universe, traversable wormholes), but all require negative energy density or impossible conditions, and Hawking's chronology protection conjecture suggests quantum effects would destroy any such machine as it formed. Speculative, leaning strongly towards no.`),

E('holographic','cosmic physics',['holographic principle','is the universe a hologram','ads cft','black hole entropy'],
'Is the universe a hologram?',
`Not in the sense usually meant. The holographic principle says the information describing a volume of space can be encoded on its boundary — derived from the surprising fact that a black hole's entropy scales with its surface area, not its volume. The mathematics (AdS/CFT) is taken seriously and has been enormously productive, but it is proven for a spacetime geometry that is not ours. It does not mean reality is a projection, an illusion, or a simulation, though it gets quoted that way weekly.`),

E('vacuum-energy','cosmic physics',['zero point energy','vacuum energy','free energy','casimir'],
'Can we extract zero-point energy?',
`The vacuum does have nonzero energy — the Casimir effect, where two close plates are pushed together by the exclusion of certain modes between them, is real and measured. Established. But it is the ground state: by definition the lowest energy configuration, and you cannot extract net work from a system already at its minimum. Every "free energy from the vacuum" device sold in the last century has failed independent testing. The physics is genuine; the market built on it is not.`),

E('cosmological-principle','cosmic physics',['are we at the centre','cosmological principle','expansion centre','where did the big bang happen'],
'Where did the Big Bang happen?',
`Everywhere. This is the hardest thing to picture and the most important to get right: the Big Bang was not an explosion at a point in space, it was an expansion of space itself, happening at every location simultaneously. Every galaxy sees all others receding from it, and none is at the centre, because there is no centre. Established. The balloon analogy helps — dots on an inflating surface all recede from each other, and no dot is the origin.`),

E('redshift','astronomy',['redshift','how do we know the universe is expanding','hubble law','doppler'],
'How do we know the universe is expanding?',
`Distant galaxies' light is shifted towards the red, and the shift is proportional to distance — Hubble's 1929 observation, built on Leavitt's calibration of Cepheid variables and Slipher's spectra. Established, and corroborated independently by the microwave background, the abundance of light elements, and the ages of the oldest stars. Note the honesty of the current state: the expansion rate measured locally and the rate inferred from the early universe disagree by about 8%, the Hubble tension, and nobody knows why.`),

E('dark-sky-sound','cosmic physics',['does space have sound','sound in space','sonification'],
'Is there sound in space?',
`Not as pressure waves your ear could receive, because there is no medium in most of it. But where there is gas — inside a galaxy cluster — sound does propagate: the Perseus cluster has a pressure wave corresponding to a B-flat 57 octaves below middle C. Established. The "sounds of the planets" circulating online are data sonifications, where magnetometer or radio measurements are shifted into audible range. They are honest art made from real data, and dishonest only when presented as recordings.`),

E('gravitational-waves','cosmic physics',['gravitational waves','ligo','spacetime ripples'],
'What are gravitational waves?',
`Ripples in spacetime itself, produced when massive objects accelerate asymmetrically — two black holes spiralling together, for instance. LIGO detected the first in 2015, a signal lasting 0.2 seconds from a merger 1.3 billion light years away, measured as a length change of one part in 10^21: a thousandth the width of a proton over a four-kilometre arm. Established, Nobel 2017. It opened a second channel onto the universe that does not rely on light at all.`),

E('nuclear-fusion','cosmic physics',['fusion','nuclear fusion power','tokamak','will fusion work'],
'Will fusion power ever arrive?',
`It already powers everything you have ever eaten, via the Sun. On Earth, the 2022 and 2023 ignition results at the National Ignition Facility achieved more fusion energy out than laser energy delivered to the target — a genuine milestone, and not the same as more energy out than the whole facility consumed. The physics is established; the engineering is not. Commercial power is plausibly decades away, and "thirty years away" has been the standing joke since 1960 for reasons that are mostly funding rather than impossibility.`),

E('what-is-energy','cosmic physics',['what is energy','define energy','is energy a thing'],
'What is energy, actually?',
`A bookkeeping quantity, not a substance. Energy is the number that stays the same when a system changes — and Noether proved in 1918 why: conservation of energy follows from the fact that the laws of physics do not change over time. Established, and one of the deepest results in science. This matters here because "energy" in esoteric usage means something else entirely: a felt quality, a vitality, an atmosphere. Both usages are legitimate. Sliding between them mid-sentence is how a great deal of nonsense gets sold.`),

E('conservation-soul','cosmic physics',['energy cannot be created or destroyed','so my energy survives death','conservation and the soul'],
'Does “energy cannot be destroyed” mean something of me survives?',
`It is the most common misuse of physics in the spiritual world, and it does not work. The conservation law says the total quantity is constant; it says nothing about pattern, organisation or identity persisting. The energy in a burnt book is conserved perfectly, and the book is gone. Established physics, invalid inference. There may be good arguments for survival after death — this page is not hostile to the question, see the Consciousness limb — but this is not one of them, and using it weakens the case.`),

E('scale-of-universe','astronomy',['how big is the universe','observable universe','how many galaxies'],
'How big is the universe?',
`The observable part is about 93 billion light years across — larger than 13.8 billion because space expanded while the light travelled. It contains an estimated two trillion galaxies. Beyond the observable horizon it continues, by an unknown and possibly infinite amount; we cannot see it, by definition. Established for the observable, unknown beyond. If space is flat, as measurements suggest to within a fraction of a percent, infinite is the simplest reading.`),

E('are-we-made-of-stars','astronomy',['star stuff','we are made of stars','nucleosynthesis','where do elements come from'],
'Are we really made of stars?',
`Literally, and the detail is better than the slogan. Hydrogen came from the Big Bang. Carbon, nitrogen and oxygen were forged in stellar cores and shed by dying stars. Iron came from supernovae. Gold, platinum and uranium came largely from neutron-star collisions — the 2017 kilonova observation confirmed it directly. Established. The calcium in your bones and the iron in your blood were made in events of unimaginable violence, and have been in several previous arrangements before this one.`),

E('why-night-dark','astronomy',['olbers paradox','why is the sky dark at night','night sky dark','dark sky at night','why is space black'],
'Why is the night sky dark?',
`Olbers' paradox: in an infinite, eternal, static universe filled with stars, every line of sight should end on a star and the whole sky should blaze. It does not — which tells you that at least one of those assumptions is false. Established answer: the universe has a finite age, so light from beyond a certain distance has not arrived, and expansion redshifts distant light out of the visible. The darkness overhead is direct evidence that the universe had a beginning. Most people look at it nightly without noticing.`),

E('light-year','astronomy',['light year','how far is a light year','distance in space'],
'How far is a light year, really?',
`About 9.46 trillion kilometres. The number is useless; the proportion is not. If the Sun were a grapefruit in London, Earth would be a grain of sand 15 metres away and the next star would be another grapefruit in New York. Established, and the reason interstellar travel is hard in a way that films systematically hide. Voyager 1, the fastest departing object we have made, would need roughly 73,000 years to reach the nearest star — if it were pointed there, which it is not.`),

E('fermi-great-filter','cosmic physics',['great filter','are we rare','rare earth','is intelligence common'],
'Are we likely to be the only intelligent life?',
`Honestly unknown, and the arguments cut both ways. Rare-Earth considerations: complex cells arose once in four billion years, apparently through a singular endosymbiotic merger; our large Moon, plate tectonics and Jupiter may all have been necessary. Against: life appeared almost immediately once conditions allowed, and the galaxy is vast. Speculative. What is established is that we have no second data point, and a sample of one supports nothing. See the Extraterrestrials limb for the rest of this argument.`),

E('aurora-photos','astronomy',['aurora photos look better','why dont auroras look like photos','camera vs eye'],
'Why do auroras look better in photographs?',
`Because long exposures accumulate light that your eye cannot, and because human colour vision degrades badly in low light — the cone cells that see colour need more photons than the rods that see motion and shape. Established. A modest aurora that reads as grey-green and ghostly to the eye will photograph in vivid colour at a ten-second exposure. This is worth knowing before travelling; it is not deception, but the reality is subtler and, many would say, stranger.`),

E('sun-fate','astronomy',['what will happen to the sun','red giant','will the sun explode'],
'What happens to the Sun?',
`It will not explode — far too small. In about 5 billion years it exhausts core hydrogen, swells into a red giant that will engulf Mercury and Venus and scorch or possibly swallow Earth, shed its outer layers as a planetary nebula, and leave a white dwarf roughly Earth-sized that cools for trillions of years. Established. Earth becomes uninhabitable much sooner than that — rising luminosity will likely end complex life in around a billion years.`),

E('spacetime-curvature','cosmic physics',['how does gravity work','curved spacetime','is gravity a force'],
'Is gravity a force?',
`In Newton's account, yes; in Einstein's, no. Mass and energy curve spacetime, and objects simply follow the straightest available path through that curved geometry — which looks to us like attraction. You are not being pulled to your chair; the chair is pushing you off the straight path you would otherwise take through spacetime. Established, confirmed by light bending around the Sun (1919), GPS corrections, and gravitational waves. Reconciling this geometric picture with quantum field theory is the open problem.`),

E('observer-universe','cosmic physics',['anthropic principle','why am i here now','observer selection'],
'Is it strange that I exist at all?',
`Statistically, yes, and the anthropic principle is the standard caution against reading too much into it. Any observer must find themselves in conditions permitting observers; you could not have found yourself in a universe where you were impossible. That dissolves some of the surprise but not all of it — the weak anthropic principle explains why we see what we see, not why there is anything at all to see. Speculative, and more philosophically slippery than either its users or its critics usually admit.`),

E('stars-twinkle','astronomy',['why do stars twinkle','planets dont twinkle','atmospheric seeing'],
'Why do stars twinkle but planets do not?',
`Because stars are effectively point sources, and their single thin beam is deflected by turbulent cells in the atmosphere. Planets are discs — small, but large enough that the twinkling of each part averages out across the whole. Established, and the most useful trick in naked-eye astronomy: if it is steady, it is a planet. It is also why telescopes are put on mountains and in space, and why adaptive optics, which deforms a mirror hundreds of times a second to cancel the turbulence, was such an advance.`),

E('speed-of-dark','cosmic physics',['is there a speed of dark','shadow faster than light','phase velocity'],
'Can anything travel faster than light?',
`Some things that carry no information can. Sweep a laser across the Moon and the dot crosses faster than c, because no single thing is moving — each photon travels separately. The same goes for the phase velocity of some waves, the apparent motion of a shadow's edge, and the expansion of space between distant galaxies. Established. The prohibition is specifically on causal influence: nothing that could carry a signal or an effect gets ahead of light.`),

E('cosmic-rays','astronomy',['cosmic rays','radiation in space','is flying dangerous radiation'],
'What are cosmic rays, and should I worry?',
`High-energy particles, mostly protons, from the Sun and from distant supernovae and active galaxies. The highest-energy ones carry the kinetic energy of a well-struck tennis ball in a single proton, and nobody is sure what accelerates them. Established. On the ground the atmosphere shields you well. A transatlantic flight gives roughly the dose of a chest X-ray; frequent aircrew receive more occupational radiation than most nuclear workers. For anyone leaving Earth's magnetic field, it becomes a central engineering problem.`),

E('spacetime-foam','cosmic physics',['planck scale','quantum foam','smallest length'],
'Is there a smallest possible length?',
`Possibly. The Planck length, 1.6 × 10^-35 metres, is where quantum effects and gravity both become unignorable and our current theories stop producing sensible answers. Established as a limit of current theory, speculative as a physical minimum — some approaches (loop quantum gravity) make space genuinely discrete at that scale, others do not. Penrose's collapse proposal, discussed in the Consciousness limb, leans on structure at exactly this scale, which is both its boldest move and the hardest to test.`),

E('many-worlds','cosmic physics',['many worlds','everett','does every choice split the universe'],
'Does every quantum event split the universe?',
`On Everett's interpretation, there is no collapse — the wavefunction simply keeps evolving, and all outcomes occur in branches that no longer interact. Speculative, though it is taken seriously by many physicists precisely because it adds nothing to the formalism; it just declines to add collapse. The costs are an unimaginable profusion of branches and real difficulty making sense of probability. It also does not mean your choices spawn copies who made the other decision; branching is at the level of quantum events, not deliberations.`),

E('why-three-dimensions','cosmic physics',['why three dimensions','why 3d space','extra dimensions'],
'Why three dimensions of space?',
`Nobody knows, and there are suggestive hints rather than an answer. Stable orbits and stable atoms are only possible in three spatial dimensions — in four, inverse-cube gravity gives no stable orbits at all. That is an anthropic observation, not an explanation. String theory requires ten or eleven dimensions with the extras compactified too small to see, which would answer the question by replacing it with a harder one. Speculative throughout.`),

E('entangle-communication','cosmic physics',['can entanglement send messages','spooky action','faster than light communication'],
'Can entanglement be used to communicate?',
`No, and the proof is solid. Measuring one half of an entangled pair instantly fixes the correlation, but the outcome you get is random, and the distant party sees only random results until they compare notes through an ordinary classical channel limited by lightspeed. Established — the no-communication theorem. Entanglement is real, non-local correlation is real, and Bell's theorem rules out local hidden variables. None of it gives you a telephone, and no amount of restating it as "consciousness" changes that.`),

E('universe-purpose','cosmic physics',['does the universe have a purpose','teleology','why does anything exist'],
'Does the universe have a purpose?',
`Physics has no place to put one. The equations describe how states evolve, not what they are for, and every attempt to find direction in them has had to smuggle it in. That is not an argument against purpose; it is an observation about the tool. The question is not scientific, which is a statement about its method and not about its importance. The order's position: this is the oldest and best question, it belongs to philosophy and to the traditions, and anyone answering it with a physics paper has changed the subject.`),

E('measure-time','cosmic physics',['what is time','does time exist','block universe','presentism'],
'What is time?',
`Contested at the deepest level. Relativity treats it as a dimension, with past and future equally real — the block universe — and no objective present, since simultaneity depends on motion. Thermodynamics gives it a direction via entropy. Quantum mechanics treats it as an external parameter, which is one of the reasons quantum gravity is hard; in some formulations of the Wheeler–DeWitt equation, time disappears entirely. Established that your experience of flow has no clear counterpart in the equations. Speculative what follows from that.`),

E('universe-from-nothing','cosmic physics',['something from nothing','why is there anything','krauss','quantum fluctuation'],
'Could the universe have come from nothing?',
`Several physicists have argued yes — that a quantum fluctuation in a vacuum state could produce a universe, with total energy near zero once gravitational potential is counted as negative. Speculative, and the usual philosophical objection has force: the "nothing" in these models is a quantum vacuum with laws, fields and a state space, which is a long way from nothing in the sense the question intends. The honest position is that the deepest version of this question remains open, and both triumphant atheism and triumphant theism are overclaiming on it.`)

];
