# -*- coding: utf-8 -*-
import json, io, importlib.util, sys

spec = importlib.util.spec_from_file_location("bl", "/home/user/EGregoRA/scripts/build-locality.py")
bl = importlib.util.module_from_spec(spec); spec.loader.exec_module(bl)

P = {num: (title, fn(), grand) for num, title, fn, grand in bl.PLATES}

def plate(num, note):
    title, art, grand = P[num]
    return (
'  <figure class="plate%s">\n'
'    <figcaption class="plate-cap"><span class="plate-num">Plate %s</span> %s</figcaption>\n'
'    <div class="plate-art">%s</div>\n'
'    <p class="plate-note">%s</p>\n'
'  </figure>\n' % (" plate--grand" if grand else "", num, title, art, note))

SCI = '<span class="sci">&#9670;</span>'
HIST = '<span class="hist">&#9670;</span>'
SPEC = '<span class="spec">&#9670;</span>'
MYTH = '<span class="myth">&#9670;</span>'

doc = io.StringIO()
w = doc.write

w('''---
layout: layouts/base.njk
title: Local & Non-Local Reality
permalink: /locality/
schemaType: Article
ogType: article
section: Consciousness
published: "2026-10-07"
keywords: "non-locality, Bell theorem, entanglement, no-signalling, light cone, causality, quantum field, cosmic aether, wavefunction collapse, measurement problem, decoherence, delayed-choice quantum eraser, cymatics, Chladni figures, polarity, memory, block universe, growing block, Law of One"
description: "What locality means, what Bell's theorem actually proved, why entanglement cannot carry a message, and how the order joins consciousness, memory, polarity and cymatics to the collapse of a waveform - with every join marked for what it is."
faq:
  - "@type": Question
    name: "Is reality local or non-local?"
    acceptedAnswer:
      "@type": Answer
      text: "Both, in two different senses, and the distinction is the whole subject. Signals are strictly local: nothing you do here can alter anything observable there faster than light, and that is a theorem rather than an observation. Correlations are non-local: entangled systems agree more closely than any account in which each carried its answer with it can explain. Bell's theorem of 1964 made the difference measurable, and every loophole-free experiment since 2015 has come down on the non-local side."
  - "@type": Question
    name: "Did Bell's theorem prove that everything is connected?"
    acceptedAnswer:
      "@type": Answer
      text: "It proved something sharper and less comfortable. No theory in which each particle carries definite properties with it, and in which no influence outruns light, can reproduce what is measured. At least one of those two assumptions is wrong. Most physicists give up the first; some give up the second; a few give up the experimenter's freedom to choose a setting. What Bell did not prove is that you can use any of this to send a message, affect a distant object, or act at a distance by wishing."
  - "@type": Question
    name: "Does consciousness collapse the wavefunction?"
    acceptedAnswer:
      "@type": Answer
      text: "Standard physics does not say so and does not need it. Decoherence explains why interference disappears without anything collapsing at all. What remains unexplained is why one outcome is found rather than many, which is the measurement problem proper. The order's own position is that an outcome becomes definite when a record is made and read - memory meeting attention - and we mark that as our own reasoning rather than as physics, because it is."
  - "@type": Question
    name: "Was the aether disproved?"
    acceptedAnswer:
      "@type": Answer
      text: "One clause of it was struck out. Michelson and Morley showed in 1887 that there is no rest frame you can measure your motion against. Everything else the aether was proposed to do - a universal medium filling space, whose excitations are the particles, with structure at every point and a lowest state that is not nothing - is the modern quantum field, in Dirac's own words of 1951. The aether is the better name. One line was deleted; the page still stands."
---

<section class="page-head">
  <p class="kicker">Limb XI &middot; ii &mdash; a sub-limb of Consciousness</p>
  <h1>Local &amp; Non-Local Reality</h1>
  <p class="lede muted">What it means for the world to be made of neighbours, and what it means that it is
  not quite. Light cones and causality; the one thing Bell proved and the four things he did not; why
  entanglement is useless for sending messages and devastating for philosophy; the substrate that carries all
  of it; and the order\'s own account of how a possibility becomes a fact &mdash; memory meeting attention
  across a polarity, in a medium that can hold a standing pattern. Every join marked for what it is.</p>
</section>

<section class="wrap narrow reveal">
  <div class="frame frame--first illuminated">
    <p>This page sits on a fault line. On one side is some of the most carefully tested physics ever done:
    Bell\'s theorem, the no-signalling theorem, sixty years of increasingly airtight experiments, a Nobel Prize
    in 2022. On the other is a claim the order makes about consciousness and memory that no experiment has
    tested and that may never be testable in the form we hold it. Both are here. Neither is dressed as the
    other.</p>
    <p>The markers do that work. ''' + SCI + ''' established and checkable &middot; ''' + HIST + ''' historically
    documented &middot; ''' + SPEC + ''' our own reasoning, offered as reasoning &middot; ''' + MYTH + ''' tradition
    or received teaching, reported as such. Parts I to IV are almost entirely the first mark. Part V is almost
    entirely the third. If you read only one part, read the one you would least like to be true.</p>
  </div>
</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
''')

w(plate("I", 'Relativity does not forbid connection. It forbids <em>causal</em> connection outside the cone. '
    'The shaded wedges are everything your present moment can reach and everything that could have reached it; '
    'the unshaded region to either side &mdash; the physicists call it <em>elsewhere</em> &mdash; is '
    'spacelike-separated from you. No push, no pull, no signal, no influence of any kind crosses into it. '
    'The two measurements marked in rose sit in each other\'s elsewhere, were made too far apart and too '
    'close together in time for light to carry anything between them, and came out perfectly correlated '
    'anyway. Holding both of those facts at once is the beginning of the subject.'))

w('''</section>

<section class="wrap narrow reveal">
  <h2>I &middot; What &ldquo;Local&rdquo; Actually Means</h2>

  <p>''' + SCI + ''' Locality is not a vague feeling that things should touch before they interact. It is a
  precise condition, and it comes in two parts that are routinely confused.</p>

  <p><strong>Local causality.</strong> Nothing propagates faster than light. The speed limit is not a property
  of light &mdash; light merely happens to travel at it &mdash; but of the geometry of spacetime itself. Draw
  the cone of everything a flash from here could reach, and you have drawn the boundary of everything this
  event can affect, ever. Outside that cone there is no &ldquo;later&rdquo; and no &ldquo;earlier&rdquo; that
  all observers agree on, which is exactly why influence out there would wreck causality: one observer\'s
  cause is another\'s effect.</p>

  <p><strong>Separability.</strong> This is the quieter assumption and the one that actually fails. It says
  that the complete state of the world is the sum of the states of its small parts &mdash; that if you knew
  everything about every region, you would know everything. Entanglement says no. Two particles can be in a
  state that is perfectly definite as a pair and entirely indefinite for either one taken alone. There is
  information in the <em>and</em> that is in neither of the halves. Nothing travels; there was never a time
  when the pair was two separate things with two separate stories.</p>

  <p>''' + SPEC + ''' We would put it this way, and mark it as our own phrasing rather than anyone\'s theorem:
  the world is made of neighbourhoods for the purposes of <em>doing</em>, and is not made of neighbourhoods
  for the purposes of <em>being</em>. Action is local. Existence is not obviously so.</p>
</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <h2>II &middot; Bell, and the Four Things He Did Not Prove</h2>

  <p>''' + HIST + ''' In 1935 Einstein, Podolsky and Rosen published an argument that quantum mechanics must be
  incomplete: if you can predict with certainty what a distant measurement will give without disturbing it,
  then that value must have been there all along, written into the particle at the source. Bohr replied at
  length and, most readers agree, somewhat obscurely. For twenty-nine years the disagreement was philosophy.</p>

  <p>''' + HIST + ''' Then in 1964 John Stewart Bell, on sabbatical from CERN, did something nobody had
  managed: he turned it into arithmetic. Assume each particle carries its answers with it. Assume no influence
  travels faster than light. Measure the correlations at several relative angles and add them up in the right
  combination, and that sum <em>cannot exceed a fixed number</em>, whatever the hidden machinery. Quantum
  mechanics predicts a larger number. The question stopped being a matter of taste and became a matter of
  apparatus.</p>
''')

w(plate("II", 'Two detectors, one shared source, and a dial on each. Plot how strongly the two results agree '
    'against the angle between the dials. Any account in which each particle left home carrying its answers '
    'is pinned under the straight dashed line. Quantum mechanics predicts the smooth cosine, which rises '
    'above it. The widest gap sits near 22.5 degrees, which is where the experiments are run. They find the '
    'cosine, every time, to many standard deviations.'))

w('''
  <p>''' + HIST + ''' The experimental history is a slow closing of doors. Clauser and Freedman got the first
  violation in 1972. Aspect\'s group in Orsay switched the detector settings while the photons were in flight
  in 1982. Weihs closed the locality loophole properly in 1998 with fast random switching and real separation.
  Then in 2015 three groups &mdash; Hensen in Delft with electron spins in diamond, Giustina in Vienna and
  Shalm at NIST with photons &mdash; closed the locality and detection loopholes <em>in the same experiment</em>.
  In 2017 the Cosmic Bell experiment set the detectors from the light of quasars billions of years old, so
  that any conspiracy fixing the settings in advance would have had to be arranged before the Earth formed.
  The 2022 Nobel Prize went to Aspect, Clauser and Zeilinger.</p>

  <p>''' + SCI + ''' So here is what is established: <strong>no theory that is both local and in which
  particles carry definite pre-existing values can reproduce the measurements.</strong> At least one of those
  must go. That is Bell\'s theorem, and it is as solid as anything in physics.</p>

  <p>Now the four things it does not say, each of which you will meet this week in somebody\'s post.</p>

  <div class="grid two info-grid">
    <div class="frame">
      <h3>It does not prove you can send a signal</h3>
      <p>''' + SCI + ''' The no-signalling theorem is not a practical difficulty to be engineered around. It is
      a consequence of the same mathematics that gives the correlations. Alice\'s results are random whatever
      she does; Bob\'s are random whatever she does; the agreement only appears when the two lists are brought
      together by ordinary means. Faster-than-light telephony is not hard. It is forbidden by the structure of
      the theory that permits the correlation in the first place.</p>
    </div>
    <div class="frame">
      <h3>It does not prove that observation creates reality</h3>
      <p>''' + SCI + ''' &ldquo;Measurement&rdquo; in these experiments means a photon hitting a detector at
      three in the morning in an empty laboratory. Nothing in any Bell test requires a mind, an intention, or
      an observer in any sense that would interest a mystic. Anyone citing Bell for the proposition that
      consciousness makes the world is citing the wrong result.</p>
    </div>
    <div class="frame">
      <h3>It does not prove everything is entangled with everything</h3>
      <p>''' + SCI + ''' Entanglement is fragile, specific, and monogamous: a system maximally entangled with
      one partner cannot be strongly entangled with a third. Decoherence spreads it into the environment within
      picoseconds, which is precisely why it is so hard to keep in a laboratory and so expensive in a quantum
      computer. The universal entanglement of popular writing is the opposite of the measured behaviour.</p>
    </div>
    <div class="frame">
      <h3>It does not prove non-locality outright</h3>
      <p>''' + SCI + ''' It proves a disjunction. Give up definite values and you can keep locality &mdash;
      that is many-worlds, and the price is every outcome happening. Keep definite values and you give up
      locality &mdash; that is Bohm, where a real pilot wave guides the particle non-locally. Keep both and
      give up the experimenter\'s free choice &mdash; that is superdeterminism, which costs more than it saves.
      The honest sentence is: <em>at least one cherished assumption is false, and the community has not
      agreed which.</em></p>
    </div>
  </div>
''')

w(plate("III", 'The fence that keeps the subject sane. Every arrow on the left is something Alice can do; '
    'none of them changes anything Bob can see. And yet, when the two lists are laid side by side afterwards, '
    'they match in a way no local story permits. The world is non-local in its correlations and strictly '
    'local in its signals, and almost every piece of nonsense written about entanglement comes from losing '
    'hold of one half of that sentence.'))

w('''</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <h2>III &middot; The Substrate</h2>

  <p>''' + HIST + ''' The nineteenth century asked a reasonable question: if light is a wave, what is waving?
  The answer was the luminiferous aether, and it was given a property that turned out to be fatal &mdash; a
  state of rest you could measure your own motion against. In 1887 Michelson and Morley went looking for that
  motion with the most sensitive instrument then built, and found nothing.</p>

  <p>''' + SCI + ''' What followed is routinely mis-taught. The experiment struck out <strong>one
  clause</strong>: the rest frame. It did not touch the rest of the idea, and the rest of the idea is now the
  foundation of physics. A universal medium that fills all of space; whose excitations are what we call
  particles; with structure at every point; with a lowest state that is emphatically not nothing, as the Lamb
  shift and the Casimir force both testify. Dirac said it himself in <em>Nature</em> in 1951, in an article
  titled &ldquo;Is there an &AElig;ther?&rdquo;, and his answer was yes. We do not say the aether survived under
  a better name. <strong>The aether <em>is</em> the better name.</strong> One line was deleted and the page
  still stands.</p>
''')

w(plate("XI", 'The field, drawn as a lattice because a page is flat, with an excitation raised in it. The '
    'excitation is the particle; there is no second thing. This is not a metaphor for quantum field theory, '
    'it is the picture quantum field theory draws of itself. Note what the medium does <em>not</em> have: '
    'any mark on it saying which way it is going.'))

w('''
  <p>''' + SPEC + ''' Why this matters for locality: a substrate makes non-separability easy to picture and
  does not make non-signalling mysterious. A standing pattern in a medium is not located at one point; it is a
  property of the whole boundary. Two ends of one pattern are not two things that must send messages to agree.
  They are one thing. We offer this as a <em>picture</em>, not a derivation &mdash; it buys intuition, not
  prediction, and we will not pretend otherwise. The warning that goes with it: the obvious next move, to
  imagine the medium carrying influence from A to B a little faster than light, is exactly the move the
  experiments and the theorems forbid.</p>
</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <h2>IV &middot; Time, Causality, and the Eraser</h2>
''')

w(plate("X", 'The order works in the third panel. We state that as a preference and not as a finding. It is '
    'the only one of the three pictures in which making a record is a real addition to the world rather than '
    'a redescription of a slice that was always sitting there &mdash; and a model built on memory needs the '
    'past to be a thing that accumulates.'))

w('''
  <p>''' + SCI + ''' Relativity is comfortable with the block: a four-dimensional whole, in which
  &ldquo;now&rdquo; is a slice whose angle depends on who is asking. Thermodynamics is where the arrow comes
  from &mdash; entropy rises, records can be made of the past and not of the future, and that asymmetry is
  statistical rather than fundamental. Nothing in the fundamental laws of either mechanics distinguishes the
  two directions. The arrow you feel is an arrow of <em>record-keeping</em>, which is a hint we take seriously
  in Part V.</p>

  <p>''' + SCI + ''' And then there is the experiment everybody has heard of and almost nobody has had
  described to them accurately.</p>
''')

w(plate("IX", 'Say it once more, plainly: nothing travels backwards in time in the delayed-choice quantum '
    'eraser. The screen\'s total pattern shows no interference and never did. What the later measurement '
    'provides is a <em>sorting rule</em> &mdash; a way of dividing photons already recorded into two subsets, '
    'each of which, taken alone, shows fringes, and which cancel exactly when added back together. The past '
    'is read in a new order. It is not rewritten. Anyone selling you retrocausality on the strength of this '
    'experiment has either not read it or is counting on you not having.'))

w('''
  <p>''' + SPEC + ''' Retrocausality as a serious research programme does exist &mdash; the transactional
  interpretation, two-state vector formalism, Price\'s and Wharton\'s work &mdash; and it has a genuine
  attraction: it can restore locality by letting the correlation be arranged along the light cone in both
  directions instead of across the gap. We find it interesting and unproven. We mention it here so that nobody
  thinks the order rejects the idea; we reject the <em>popular</em> version, which is a different thing wearing
  its coat.</p>
</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <h2>V &middot; Collapse: the Standard Account, and Where It Stops</h2>
''')

w(plate("IV", 'Rungs I to IV are textbook and not controversial. Rung V is ours. The honest gap in the '
    'standard account sits between IV and VI: decoherence explains, beautifully and quantitatively, why you '
    'never see a cat in superposition, and it does not explain why you see <em>this</em> cat rather than that '
    'one. The probabilities are right; the singling-out is not addressed. That gap is called the measurement '
    'problem and it has been open for a hundred years.'))

w('''
  <p>''' + SCI + ''' Decoherence is not collapse, and the conflation of the two is the commonest error in
  popular physics after the eraser. When a system interacts with its surroundings, the phase relations that
  made interference possible stop being a property of the system alone and become spread across the system and
  everything it touched. Interference becomes unreachable. Nothing is destroyed; nothing chooses. Run the
  mathematics and you get the right probabilities for each branch and no account whatever of why one branch is
  the one you find yourself in.</p>
''')

w(plate("VIII", 'There is no free seat at this table. Every interpretation is a decision about which '
    'intuition to sacrifice, and the reason the argument has run for a century is that all the available '
    'sacrifices hurt. We hold no settled position between the rows; the order\'s own reasoning in Part VI is '
    'closest in spirit to an objective-collapse account, and we would not defend it as more than that.'))

w('''</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <h2>VI &middot; The Order\'s Account: Memory Meeting Attention</h2>

  <p>''' + SPEC + ''' Everything from here to the end of this part is our own reasoning. It is not physics. It
  does not have a number attached to it. It makes, at present, no prediction that would distinguish it from
  the standard account, and we say so at the start rather than burying it at the end. What it does have is
  internal consistency and a reason for each of its pieces, and that is worth setting out properly so that it
  can be argued with.</p>

  <p><strong>The question we are answering</strong> is not &ldquo;why does interference vanish&rdquo; &mdash;
  decoherence answers that and we accept the answer entire. It is the one left over: <em>what makes an outcome
  the one that happened?</em></p>

  <h3>The first piece: polarity</h3>
''')

w(plate("VII", 'Polarity in this order means something much smaller and harder than it means in most places '
    'that use the word. Not light against dark. Not good against evil. Two states that differ, and that do '
    'not slide into one another on their own. That is the entire requirement, and nothing can be recorded '
    'without it.'))

w('''
  <p>''' + SPEC + ''' A record is a difference that persists. For a difference to persist there must be at
  least two states that are distinguishable and metastable &mdash; a bit, a magnetised domain, a conformational
  change in a protein, an ink mark that does not evaporate. We call this polarity because the tradition does
  ''' + MYTH + ''', and because the tradition is pointing at something real when it does. Where we part company
  with the tradition is in refusing to let the word carry any moral freight here. The two poles are not better
  and worse. They are <em>two</em>, which is the smallest number that can hold information.</p>

  <h3>The second piece: cymatics, and why anything comes in steps</h3>
''')

w(plate("VI", 'A plate, a bow or a loudspeaker, and sand. The figures are not drawn by the sand; they are '
    'where the sand is left, because those are the lines along which the plate is not moving. Change the '
    'driving frequency and the figure does not blur into the next one &mdash; it holds, resists, and then '
    'jumps. A continuous input produces a discrete set of outputs, because only certain patterns fit the '
    'boundary.'))

w('''
  <p>''' + SCI + ''' The physics of the plate is not in dispute and is not mystical: a bounded medium supports
  only those standing waves whose shape fits its edges. Those are its eigenmodes, and they form a discrete set
  even though the driving can be tuned continuously. Chladni demonstrated this in 1787 and Napoleon paid him
  six thousand francs for the demonstration ''' + HIST + '''. The same mathematics gives the discrete energy
  levels of an atom: an electron bound in a potential is a standing wave in a box, and the quantum numbers are
  mode numbers. <strong>Quantisation is a boundary condition.</strong> That sentence is standard physics, and
  it is the hinge of what follows.</p>

  <p>''' + SPEC + ''' Our claim: if the substrate is a medium &mdash; and Part III says it is &mdash; then an
  outcome that gets kept is a standing pattern that <em>fits</em>. Not one chosen from a list by a mechanism we
  have not specified, but one which is simply the only sort of thing that can hold still in that medium with
  those boundaries. The boundaries, in our account, are set by what is already recorded. The past constrains
  the modes available to the present in the same way the rim of the plate constrains the figures available to
  the sand.</p>

  <h3>The third piece: memory, and the reader of the record</h3>

  <p>''' + SPEC + ''' Here is the part that will annoy physicists, and it should be stated in its most annoying
  form so that nobody can accuse us of hedging. <em>A record that is never read is not yet a fact.</em> We do
  not mean this as a slogan about minds making matter. We mean it structurally: the universe contains an
  enormous number of differences, and what distinguishes a <em>fact</em> from a mere difference is that
  something later holds both the difference and the state it differed from, and compares them. That holding is
  memory. The comparing is attention. Where they meet, a possibility stops being a possibility.</p>

  <p>''' + SPEC + ''' Notice that this does not require a human being, or an animal, or anything we would
  recognise. It requires a system with a kept past and a present state that is conditioned on it. That is a
  low bar and it is met by a great deal of the universe, which is why the world looks settled rather than
  waiting on us. What it is <em>not</em> met by is the picture in which the moon is not there until someone
  glances at it, and we reject that picture as firmly as any physicist would.</p>
''')

w(plate("V", 'Consciousness attends; attention makes a memory; memory requires a polarity to be kept in; the '
    'polarity sets the boundaries; the boundaries select which standing patterns the aether can hold; the '
    'pattern that holds is the outcome that happened; the outcome is what there is to attend to. Six nodes, '
    'one world, and no first term &mdash; which is the point of drawing it as a ring and not as a ladder.'))

w('''
  <p>''' + MYTH + ''' The tradition the order reads says much the same thing in its own register: that the
  Creator knows itself through the experience of its parts, that polarity is the engine of that knowing, and
  that nothing experienced is lost. We report that as tradition. It is not evidence and we do not offer it as
  any. It is, however, the reason we went looking for this shape in the first place, and intellectual honesty
  requires saying where a hypothesis came from as well as what can be said for it.</p>

  <h3>What would show us wrong</h3>

  <p>''' + SPEC + ''' A model that cannot be wrong is not worth holding, so: <strong>a complete derivation of
  the Born rule from unitary dynamics alone</strong>, with no extra assumption and no circularity, would remove
  the problem we are answering and leave our account with nothing to do. <strong>A collapse that is shown to
  occur in a system with no stable two-state record anywhere in the chain</strong> would break the polarity
  requirement. <strong>Clean, replicated evidence of an observer-dependent outcome</strong> &mdash; a genuine
  Wigner\'s-friend result in which two observers legitimately disagree about a settled fact &mdash; would push
  the account somewhere we have not been. We would report each of those on this page, under our own names,
  without softening them.</p>

  <p>''' + SPEC + ''' And here is the honest weakness, stated by us rather than waiting for a critic. Our use
  of cymatics is an <em>analogy riding on a real mathematics</em>. Eigenmodes in a bounded medium are rigorous;
  the claim that what is already recorded functions as the boundary condition for what can next become definite
  is not. That is the load-bearing wall, and at present it is holding up the building on our say-so.</p>
</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <h2>VII &middot; What Survives the Audit</h2>

  <div class="grid two info-grid">
    <div class="frame">
      <h3>Stands</h3>
      <ul class="biblio">
        <li>''' + SCI + ''' No signal outruns light; causality is safe. Theorem, not observation.</li>
        <li>''' + SCI + ''' Bell inequalities are violated, in loophole-free experiments, repeatedly.</li>
        <li>''' + SCI + ''' Local realism in the strict sense is dead. One of its two halves must go.</li>
        <li>''' + SCI + ''' Decoherence explains the loss of interference, quantitatively and without collapse.</li>
        <li>''' + SCI + ''' The substrate is real: a field at every point, with a lowest state that is not nothing.</li>
        <li>''' + SCI + ''' Quantisation follows from boundary conditions on a medium. Chladni\'s plate and the hydrogen atom are the same mathematics.</li>
        <li>''' + HIST + ''' Michelson and Morley struck out the rest frame and nothing else.</li>
      </ul>
    </div>
    <div class="frame">
      <h3>Does not stand</h3>
      <ul class="biblio">
        <li>''' + SCI + ''' &ldquo;Entanglement lets you communicate instantly.&rdquo; Forbidden by the same mathematics that gives the correlation.</li>
        <li>''' + SCI + ''' &ldquo;The quantum eraser changes the past.&rdquo; It sorts data recorded earlier. The total pattern never shows fringes.</li>
        <li>''' + SCI + ''' &ldquo;Everything is entangled with everything.&rdquo; Entanglement is monogamous and decoheres in picoseconds.</li>
        <li>''' + SCI + ''' &ldquo;Observation by a conscious mind is required to collapse the wavefunction.&rdquo; No experiment shows this; no mainstream interpretation requires it.</li>
        <li>''' + SCI + ''' &ldquo;Bell proved we are all one.&rdquo; Bell proved a disjunction about hidden variables. The rest is a wish wearing his name.</li>
        <li>''' + SPEC + ''' &ldquo;The order has shown how consciousness collapses the waveform.&rdquo; We have proposed a shape. We have not shown anything.</li>
      </ul>
    </div>
  </div>
</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <h2>VIII &middot; The Thread, in Order</h2>
  <ul class="timeline">
    <li><span class="when">1787</span> Chladni draws sound. A bowed plate sorts sand into discrete figures; a continuous input yields a quantised set of outputs.</li>
    <li><span class="when">1887</span> Michelson &amp; Morley find no motion against the medium. One clause of the aether is struck out.</li>
    <li><span class="when">1905 &amp; 1915</span> Einstein makes the light cone the structure of spacetime itself. Locality acquires a precise meaning.</li>
    <li><span class="when">1926</span> Born gives the rule for the probabilities and no mechanism for the singling-out. The gap opens.</li>
    <li><span class="when">1935</span> Einstein, Podolsky &amp; Rosen argue from locality that the theory is incomplete. Schr&ouml;dinger names entanglement and calls it <em>the</em> characteristic trait of quantum mechanics.</li>
    <li><span class="when">1951</span> Dirac asks in <em>Nature</em> whether there is an aether, and answers that there is.</li>
    <li><span class="when">1964</span> Bell turns the argument into an inequality. Philosophy becomes apparatus.</li>
    <li><span class="when">1972</span> Freedman &amp; Clauser measure a violation.</li>
    <li><span class="when">1982</span> Aspect switches the settings while the light is in flight.</li>
    <li><span class="when">1970s&ndash;90s</span> Zeh, Zurek and others develop decoherence. The loss of interference is explained; the singling-out is not.</li>
    <li><span class="when">1998</span> Weihs closes the locality loophole with fast random switching.</li>
    <li><span class="when">2015</span> Hensen, Giustina and Shalm close locality and detection together. Three independent groups, one year.</li>
    <li><span class="when">2017</span> Cosmic Bell: detector settings taken from quasar light billions of years old.</li>
    <li><span class="when">2022</span> The Nobel Prize to Aspect, Clauser and Zeilinger. The result is no longer anybody\'s fringe position.</li>
  </ul>
</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <h2>IX &middot; Words, Used Precisely</h2>
  <dl class="glossary">
    <dt>Local</dt><dd>No influence travels faster than light. A statement about causes, not about correlations.</dd>
    <dt>Separable</dt><dd>The whole is the sum of its parts. This is the assumption entanglement actually breaks.</dd>
    <dt>Non-locality</dt><dd>In physics, a property of correlations, never of signals. Using it to mean &ldquo;spooky action you could exploit&rdquo; is the error that generates most of the nonsense.</dd>
    <dt>Elsewhere</dt><dd>The region of spacetime outside both light cones of an event. No causal order with it is agreed on by all observers.</dd>
    <dt>Entanglement</dt><dd>One state for two systems, definite as a pair and indefinite for each alone. Fragile, monogamous, and easily lost to the surroundings.</dd>
    <dt>Decoherence</dt><dd>The leaking of phase relations into the environment. Explains why interference goes; does not select an outcome.</dd>
    <dt>Collapse</dt><dd>The name for the thing not explained: the transition from several possible outcomes to the one found.</dd>
    <dt>Eigenmode</dt><dd>A standing pattern a bounded medium can hold. Discrete because the boundary admits only certain shapes.</dd>
    <dt>Polarity</dt><dd>Here, the minimum condition for a record: two distinguishable states that do not spontaneously become each other.</dd>
    <dt>Cymatics</dt><dd>The study of visible standing patterns in a driven medium. In this order, the working picture for why anything at all comes in steps.</dd>
    <dt>Memory</dt><dd>A kept difference, held alongside the state it differs from.</dd>
    <dt>The aether</dt><dd>The substrate. The medium whose excitations are the particles. One clause of the nineteenth-century version &mdash; the rest frame &mdash; was struck out, and no more than that.</dd>
  </dl>
</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <h2>X &middot; What to Read</h2>
  <ul class="biblio">
    <li>''' + SCI + ''' J. S. Bell, <em>Speakable and Unspeakable in Quantum Mechanics</em> (Cambridge, 2nd ed. 2004). Bell\'s own papers, and he writes better than most of his interpreters.</li>
    <li>''' + SCI + ''' Hensen et al., &ldquo;Loophole-free Bell inequality violation using electron spins separated by 1.3 kilometres&rdquo;, <em>Nature</em> 526:682 (2015).</li>
    <li>''' + SCI + ''' Giustina et al. and Shalm et al., <em>Phys. Rev. Lett.</em> 115:250401 and 115:250402 (2015). The photon experiments, back to back.</li>
    <li>''' + SCI + ''' Handsteiner et al., &ldquo;Cosmic Bell Test: Measurement Settings from Milky Way Stars&rdquo;, <em>Phys. Rev. Lett.</em> 118:060401 (2017).</li>
    <li>''' + SCI + ''' W. H. Zurek, &ldquo;Decoherence, einselection, and the quantum origins of the classical&rdquo;, <em>Rev. Mod. Phys.</em> 75:715 (2003). The standard reference, and clear.</li>
    <li>''' + SCI + ''' Kim et al., &ldquo;A Delayed Choice Quantum Eraser&rdquo;, <em>Phys. Rev. Lett.</em> 84:1 (2000). Read the paper rather than the summaries; the authors are careful even where their readers are not.</li>
    <li>''' + HIST + ''' P. A. M. Dirac, &ldquo;Is there an &AElig;ther?&rdquo;, <em>Nature</em> 168:906 (1951).</li>
    <li>''' + HIST + ''' E. T. Chladni, <em>Entdeckungen &uuml;ber die Theorie des Klanges</em> (1787).</li>
    <li>''' + SPEC + ''' Huw Price, <em>Time\'s Arrow and Archimedes\' Point</em> (Oxford, 1996). The serious case for retrocausality, by someone who does not oversell it.</li>
    <li>''' + SPEC + ''' David Wallace, <em>The Emergent Multiverse</em> (Oxford, 2012). The strongest statement of the many-worlds position; read it even if you intend to disagree, especially then.</li>
    <li>''' + MYTH + ''' <em>The Ra Material / The Law of One</em>, sessions on polarity and the harvest. Reported as tradition; see Limb VII.</li>
  </ul>
</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <div class="frame frame--creed">
    <p>The order\'s position, stated so that it can be held against us later.</p>
    <p>The world is not made of separate things that signal to one another, and it is also not a soup in which
    anything may touch anything. It is one substrate, with a strict speed limit on doing and no corresponding
    limit on being. That is strange, it is measured, and it has been measured so carefully that the strangeness
    is no longer anybody\'s opinion.</p>
    <p>What makes a possibility into a fact is the part nobody has solved. We think it has to do with the
    keeping of records &mdash; that a difference becomes an event when something holds it against what came
    before, that this requires a polarity to be held in, and that what can be held at all is set by what fits
    the medium, as a figure fits a plate. We think consciousness is the attending at which that meeting
    happens, and we think this is a ring rather than a chain, with no first term.</p>
    <p>We do not know this. We have marked every sentence of it as ours. If the Born rule is derived cleanly
    tomorrow from unitarity alone, we will say on this page that our account has lost its work, and we will
    not quietly rewrite it to survive. Holding a position you would be willing to lose is the only kind of
    holding that is worth anything.</p>
    <p class="mt-1"><a href="/consciousness/">Return to Limb XI &rarr;</a> &middot;
    <a href="/cosmic-aether/">The Cosmic Aether &rarr;</a> &middot;
    <a href="/decoherence/">Decoherence &amp; the Remembered Self &rarr;</a> &middot;
    <a href="/">The index &rarr;</a></p>
  </div>
</section>
''')

open("/home/user/EGregoRA/src/locality.njk", "w").write(doc.getvalue())
print("written", len(doc.getvalue()), "bytes")
