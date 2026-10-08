#!/usr/bin/env python3
"""Insert the expanded prose sections into the hand-maintained TTI chapters.

Idempotent: each block is wrapped in a marker comment and replaced on re-run.
Generated chapters (skeletal-splice, megatubule) are NOT touched here -- edit
their own writer scripts instead.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "tti" / "src"

MARK_OPEN = "<!-- expand:{key}:start -->"
MARK_CLOSE = "<!-- expand:{key}:end -->"

BLOCKS = {}

# ---------------------------------------------------------------- moebius ---
BLOCKS["moebius"] = r"""
<div class="divider">&#10022;</div>

<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">7.6 &mdash; the seam, read in the one place nature already paints it</p>
    <h2 id="t-colour">The Seam and the Colour Charge</h2>
    <p class="lede muted">If the half-twist is real, it should leave a fingerprint somewhere small enough
      to be measured rather than merely admired. The strong force is where to look, because the strong
      force is the one place in physics where a charge is already described as a thing that cannot be
      exhibited on its own.</p>
  </div>

  <div class="wrap narrow">
    <div class="frame illuminated">
      <p>Begin with what is not in dispute. Quarks carry a charge of the strong interaction that physicists
        named <em>colour</em> &mdash; three values, conventionally red, green and blue, with three
        corresponding anticolours. The gauge group is SU(3). Eight gluons mediate the force, and each
        gluon carries one colour together with one anticolour. No isolated colour has ever been observed:
        everything that reaches a detector is colourless, either a three-quark combination taking one of
        each, or a quark bound to an antiquark of the matching anticolour. This is confinement, and it is
        among the best-tested facts in physics. <span class="sci">&#9670;</span></p>
      <p>Now read that list again with the strip in hand. A gluon is <em>a colour and its inversion,
        carried on one object.</em> A meson is <em>a thing and its mirror, continuous across a join.</em>
        Confinement is the statement that <em>the two faces cannot be prised apart and shown separately.</em>
        Those are not three loose analogies for non-orientability. They are the definition of it. On a
        cylinder you can paint the inside red and the outside anti-red and keep them distinct for ever;
        on a strip with a half-twist you cannot, because walking the surface carries red continuously into
        anti-red without ever crossing an edge. <span class="spec">&#9670;</span></p>
      <p class="lede">The framework's reading: colour is what the seam looks like from underneath. Charge
        that can only appear in inverted pairs is the local signature of a surface with one face.</p>
    </div>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <p class="kicker">7.6.1</p>
    <h3 id="t-z2-z3">Two turns, two centres: why colour needs three and the twist needs two</h3>
    <p>The objection arrives immediately, and it is the right one. The M&ouml;bius half-twist is an order-two
      operation: do it twice and you are back where you began. That is the group <strong>Z&#8322;</strong>,
      the parity of matter and antimatter, the phase of π that the previous section leans on. Colour is not
      two-valued. The centre of SU(3) is <strong>Z&#8323;</strong> &mdash; a third of a turn, a phase of
      2π/3, three colours rather than two faces. A half-twist cannot by itself produce a three-fold charge,
      and any account that waves at &ldquo;inversion&rdquo; and hopes the reader will not count is
      pretending. <span class="sci">&#9670;</span></p>
    <p>What the framework says instead is more modest and more exact. The strip supplies the
      <em>inversion</em>; it does not supply the <em>multiplicity</em>. Z&#8322; is the parity of the seam:
      which face you are on. Z&#8323; is the structure of the fibre sitting over the seam: how many
      distinguishable ways there are to be on a face. Multiply them and you get Z&#8326; &mdash; six &mdash;
      and the framework notices without insisting that six is the number of quark flavours and that the
      quark sector of the Standard Model, counted as flavour times colour times particle-or-antiparticle,
      contains exactly <strong>6 &times; 3 &times; 2 = 36</strong> states. The arithmetic is exact. Whether
      the factorisation means anything is the open question, and it is taken up where the thirty-six already
      lives: <a href="/spiral/#t-quarks">the accumulation vertex at 666</a>.
      <span class="spec">&#9670;</span></p>
    <p class="muted">Stated against ourselves: a product of two cyclic groups is the cheapest construction
      in mathematics, and one can factor almost any small integer into a story. The reading earns nothing
      until it predicts a relation between the Z&#8322; phase and the Z&#8323; phase that QCD does not
      already contain &mdash; a computed number, not a matching count. Until then it is a resemblance held
      honestly, and nothing is built on top of it.</p>
  </div>
</section>

<div class="divider">&#10022;</div>

<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">7.7 &mdash; Appendix A, brought into the body of the chapter</p>
    <h2 id="t-handedness">Why Galaxies Have a Rotation Bias</h2>
    <p class="lede muted">The seam makes one claim that the sky can refuse. It concerns which way spiral
      galaxies turn, and the honest answer arrives in three stages: the ledger is silent, a single twist
      gets it wrong, and only the third reading says anything sharp.</p>
  </div>

  <div class="wrap narrow">
    <div class="frame illuminated">
      <h3 id="t-handedness-obs">What is actually observed</h3>
      <p>Across SDSS, Pan-STARRS, the Dark Energy Survey, the DESI Legacy imaging and now JWST, automated
        analyses of spiral-arm curvature report that clockwise and counterclockwise rotation, as seen from
        Earth, are not found in equal numbers. In the JWST Advanced Deep Extragalactic Survey field, of 263
        galaxies whose spin could be read, <strong>158 turned clockwise and 105 counterclockwise</strong>
        &mdash; a 3.39σ departure from an even split. An earlier JWST deep field gave 24 against 10 in the
        same sense. A DESI Legacy sample of about 1.3 million galaxies maps the effect across the whole
        footprint. <span class="sci">&#9670;</span></p>
      <p>Three features of the signal matter more than the headline ratio, and the framework stands or falls
        on them rather than on the two-to-one:</p>
      <ol>
        <li><strong>It is a dipole, not a preference.</strong> One Galactic hemisphere shows an excess of one
          handedness and the opposite hemisphere shows the inverse. The asymmetry <em>changes sign across a
          plane.</em></li>
        <li><strong>The axis sits near our own Galactic pole.</strong> The structure is referenced to
          us &mdash; which is exactly what an artefact would also do.</li>
        <li><strong>It strengthens with redshift.</strong> The earlier and fainter the galaxies, the stronger
          the reported imbalance.</li>
      </ol>
      <p class="muted">The leading mundane explanation is selection. Galaxies rotating against the Milky
        Way's own motion are Doppler-brightened and therefore over-represented in a magnitude-limited
        sample; the effect would naturally centre on our Galactic pole and worsen for faint, distant
        objects. Any geometric account has to beat that far less exciting rival, and must say so before it
        says anything else. <span class="sci">&#9670;</span></p>
    </div>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-handedness-fail">Why the ledger is silent and the single twist fails</h3>
    <p>The <a href="/cosmic-ledger/">cosmic ledger</a> partitions energy by how far a region has travelled
      along α &rarr; π &rarr; π/2 &rarr; i, which is what yields the dark-energy, dark-matter and baryonic
      split. Galaxy spin is a property of fully integrated baryonic matter &mdash; the five per cent &mdash;
      and concerns <em>which way it turns</em>, not <em>how far it got</em>. The two questions live on
      different axes. The percentages cannot speak to spin, and a framework that pretended otherwise would
      be mining its own numbers for an answer they do not contain.</p>
    <p>M&ouml;bius parity is the one place in the framework where handedness is native: i is the strip caught
      mid-twist, and CP violation is read as a geometric phase of π. The obvious extension is that the same
      twist imprints a preferred orientation on macroscopic angular momentum. But a single global half-twist
      predicts a <em>uniform</em> preference &mdash; the whole sky leaning one way. It has no plane across
      which handedness reverses. So on its own it predicts precisely the thing the data most clearly is not.
      <span class="spec">&#9670;</span></p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h3 id="t-two-being">The two-being reading</h3>
    <p>The resolution is already in the chapter above, in the wormhole paragraph: an object traversing the
      twist emerges as its own mirror image, and the universe of matter we inhabit may be the M&ouml;bius
      image of a complementary one on the other face. Read ontologically rather than decoratively, the twist
      does not produce one oriented thing. <strong>It produces a handed pair</strong> &mdash; two beings,
      mutually inverted, sharing a single continuous surface. Orientation is then not one global arrow but
      two opposite arrows meeting at a join.</p>
    <p class="lede">A handed pair <em>is</em> a sign flip. If reality is two inverted beings on one surface,
      the plane where their orientations hand off is exactly a plane across which observed handedness
      reverses. The dipole stops being an embarrassment and becomes a candidate signature: the seam itself,
      seen edge-on. <span class="spec">&#9670;</span></p>
    <p>This is also the point at which the colour reading and the galaxy reading turn out to be the same
      statement at two scales. Confinement says the two faces cannot be separated <em>in the small</em>:
      no bare colour, only inverted pairs. The dipole, if it is real, says the two faces cannot be separated
      <em>in the large</em>: no one-handed universe, only a sky that reverses across a join. One seam, read
      twice. <span class="spec">&#9670;</span></p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-handedness-debts">The debts this reading still owes</h3>
    <dl class="glossary">
      <dt>Why is the seam <em>here</em>?</dt>
      <dd>The pair explains that there is a dipole. It does not explain why the flip-plane threads our own
        Galactic pole rather than any of infinitely many planes. The selection account answers this for
        free, because the effect is defined relative to us. The two-being model must either swallow a
        suspicious coincidence or define the seam by the observer's position on the surface &mdash; in which
        case it makes the same prediction as the artefact and adds no testable content.</dd>
      <dt>There is no amplitude.</dt>
      <dd>Nothing in the framework fixes how strong the bias should be. A pair of faces is a yes-or-no fact;
        it carries no number. A perfect match to 158 against 105 could not be claimed as a derivation,
        because no magnitude was ever derived. Matching a ratio you did not predict is not evidence.</dd>
      <dt>The redshift trend adjudicates nothing.</dt>
      <dd>A primordial seam should show most strongly in the earliest galaxies. So should a classification
        bias that worsens with faintness. The trend flatters both stories equally.</dd>
    </dl>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h3 id="t-handedness-test">The one falsifiable edge</h3>
    <p>What makes this worth recording rather than dismissing is that the two-being reading is
      <em>sharper</em> than the single twist, and riskier. If the dipole is a genuine seam between inverted
      beings, the sky's orientation field must be cleanly odd:</p>
    <p class="formula" style="text-align:center">A(&minus;n&#770;) = &minus;A(n&#770;)</p>
    <p>to high precision, about a <em>single great circle</em> &mdash; not a smear, not several axes, not a
      lopsided one-sided excess. The selection effect predicts instead an excess tied to our motion vector
      and to apparent magnitude, which need not be perfectly antisymmetric and need not resolve to one clean
      circle once Doppler and inclination biases are modelled out. So the test is explicit, and the three
      outcomes are set down in advance in <a href="/stress-tests/#t-handedness">the stress tests</a>.</p>
    <p class="muted">The framework's honest expectation runs partly <em>against</em> the most prominent
      feature of the current data: a primordial seam ought to be a cosmic-frame structure, and the reported
      axis aligns with our own pole. That tension is not hidden here. It is the sharpest and most useful
      thing the framework can say about galaxy spin &mdash; sharp precisely because the sky can refuse
      it.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame frame--creed">
    <p class="kicker">7.8 &mdash; vision, named as vision</p>
    <h3 id="t-ripple-back">The ripple back</h3>
    <p>If the twist births an inverted co-self, the consequence does not stop at galaxies. The
      <a href="/the-self/#t-spiral-being">Spiral Being</a> acquires a counter-spiral: a being winding the
      opposite way around the same torus, toward the same asymptotic One that neither can reach, the two
      coils together tracing the full double-handed structure of which the single spiral was only ever one
      strand. The integral self &mdash; the gathering of infinitesimal dx moments into a life &mdash;
      implies a co-integration performed on the inverted face: an experience that is the mirror of
      experience, oriented oppositely through the same collapses. <span class="myth">&#9670;</span></p>
    <p>In this register the M&ouml;bius statement of this chapter completes itself. <em>I am the
      universe</em>, said from one face, has always implied a second voice saying the same from the other
      side of a surface that has only one side. The two are not two universes. They are one continuous
      existence, experienced from the two orientations a single twist makes available &mdash; the inside of
      the outside, and the outside of the inside, meeting at a seam that, out among the galaxies, we may or
      may not be looking straight down the axis of.</p>
    <p class="muted small">Offered in the lineage the introduction names &mdash; Pythagoras, Kepler, Cantor
      &mdash; and explicitly not as physics. It borrows no authority from the falsifiable test above.</p>
  </div>
</section>
"""

# ---------------------------------------------------------- cosmic-ledger ---
BLOCKS["cosmic-ledger"] = r"""
<div class="divider">&#10022;</div>

<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">8.7 &mdash; what the middle residue is a residue <em>of</em></p>
    <h2 id="t-dark-matter">Dark Matter Is the Ledger's Middle Entry</h2>
    <p class="lede muted">The second pole carries 26.95 per cent. Everything in this section is an attempt
      to say what, physically, is sitting at that pole &mdash; and to be clear that an entry in a ledger is
      not yet a substance.</p>
  </div>

  <div class="wrap narrow">
    <div class="frame illuminated">
      <p>Standard cosmology measures a dark sector and then looks for something to put in it. The
        observational case is overwhelming and comes from independent directions that have no reason to
        agree and do: flat galactic rotation curves since Vera Rubin's work in the 1970s; the velocity
        dispersions of galaxy clusters; gravitational lensing maps whose mass does not follow the light; the
        relative heights of the acoustic peaks in the cosmic microwave background, which fix the ratio of
        dark to baryonic matter at roughly <strong>5.44 to 1</strong>; and the offset between mass and gas
        in colliding clusters. The inference &mdash; that something gravitates without radiating &mdash; is
        as secure as anything in cosmology. <span class="sci">&#9670;</span></p>
      <p>What is <em>not</em> secure is the next step, which is almost always taken silently: that a thing
        which gravitates and does not radiate must be a <em>particle</em>. Forty years of direct-detection
        experiments &mdash; xenon time projection chambers, cryogenic germanium, axion haloscopes &mdash;
        have returned null results across most of the parameter space that motivated them. The particle
        reading is not refuted. It is unconfirmed, expensively and repeatedly.
        <span class="sci">&#9670;</span></p>
      <p class="lede">The ledger's reading is that the middle entry is not a species but a
        <strong>state</strong>: a region of geometry that has reached the π/2 threshold and stopped there.
        Integrated enough to curve space. Not integrated enough to carry a phase, and therefore not
        integrated enough to emit light.</p>
    </div>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <p class="kicker">8.7.1</p>
    <h3 id="t-chi-half">The three poles as three degrees of completion</h3>
    <p>The chain the whole framework runs on is α &rarr; π &rarr; π/2 &rarr; i, and the χ-field is nothing
      more than a bookkeeping of how far along it a region has travelled. Read that way, the three residues
      stop being three numbers and become three stages of one process:</p>
    <table class="ledger">
      <thead>
        <tr><th>Pole</th><th>χ</th><th>Stage reached</th><th>What it does</th><th>Share</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>z = 1</td><td>&asymp; 0</td><td>π only &mdash; baseline curvature</td>
          <td>Expands. Neither clumps nor shines.</td><td>68.10%</td>
        </tr>
        <tr>
          <td>z = &frac12;</td><td>&asymp; &frac12;</td><td>π/2 reached, phase split incomplete</td>
          <td>Gravitates. Does not shine.</td><td>26.95%</td>
        </tr>
        <tr>
          <td>z = 0</td><td>&asymp; 1</td><td>i &mdash; full complex phase</td>
          <td>Gravitates, shines, binds, builds chemistry.</td><td>4.95%</td>
        </tr>
      </tbody>
    </table>
    <p>The middle row is the whole of the claim. Electromagnetism in this framework is not an add-on; it is
      what a <em>completed</em> phase rotation looks like from inside. A region that halts at π/2 has
      acquired the curvature but not the phase. It must therefore gravitate and must not radiate &mdash;
      which is precisely and only the list of properties dark matter is observed to have, and the reason it
      is dark is structural rather than accidental. <span class="spec">&#9670;</span></p>
    <p class="muted">Note what has and has not been achieved. The reading explains <em>why a dark,
      gravitating component should exist at all</em>, which the particle hypothesis does not &mdash; a WIMP
      is dark because we chose its couplings to be small. What it does not do is produce 26.95 per cent from
      the physics; that number comes out of the residue arithmetic, and the residue arithmetic rests on the
      choice of f. Two separate claims, one strong and one owed.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <p class="kicker">8.7.2 &mdash; where the ledger touches an observation</p>
    <h3 id="t-flat-curves">Flat rotation curves out of a 1/r integration gradient</h3>
    <p>A galaxy, on this account, sits at the centre of a χ-gradient: χ &asymp; 1 in the luminous disk,
      falling smoothly to χ &asymp; &frac12; through the halo, and tending to χ &rarr; 0 in the
      intergalactic void. The halo is not a cloud of anything. It is the region where the geometry has
      <em>partially integrated</em> &mdash; enough to gravitate, not enough to radiate &mdash; and the
      rotation curve simply reads its profile off.</p>
    <p class="formula" style="text-align:center">χ(r) &prop; 1/r &nbsp;&rArr;&nbsp;
      ρ<sub>χ</sub> &prop; 1/r² &nbsp;&rArr;&nbsp; M(r) &prop; r &nbsp;&rArr;&nbsp;
      v(r) = &radic;(GM(r)/r) = constant</p>
    <p>That is the flat curve, and it falls out of the gradient rather than being fitted to it. Newtonian
      gravity acting on the visible disk alone gives the Keplerian decline v &prop; 1/&radic;r, which is not
      what is seen; an enclosed mass growing linearly with radius is what is required, and a 1/r integration
      field delivers exactly that. <span class="spec">&#9670;</span></p>
    <p class="muted">The debt, stated as the author states it against himself: the 1/r profile is the natural
      behaviour of a scalar field sourced by a central mass in the weak-field limit, and it is consistent
      with the logarithmic sensitivity of the screening function near its operating point &mdash; but it has
      <em>not</em> been derived from the framework's own modified field equations. Until someone shows that
      the modified Einstein equations with F(χ) necessarily yield χ &prop; 1/r in a galactic halo, this is a
      profile chosen because it works, not a profile forced because it must. It is the closest the framework
      has come to a quantitative astrophysical match, and the gap is the first place a critic should
      press. <a href="/gravity/#t-dark-sector">The gravity chapter carries the same accounting.</a></p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <p class="kicker">8.7.3</p>
    <h3 id="t-dm-discriminate">What would tell the two readings apart</h3>
    <ul>
      <li><strong>A direct detection.</strong> One unambiguous nuclear-recoil signal with the right annual
        modulation and the particle account wins outright, and the integration-state reading is finished.
        It is a genuine risk and it is accepted. <span class="sci">&#9670;</span></li>
      <li><strong>Dark matter without baryons, or baryons without dark matter.</strong> A state of the
        geometry is tied to the integration history of a region; a particle is not. Galaxies with no dark
        halo at all &mdash; several candidates are reported and disputed &mdash; are awkward for a particle
        that should have been swept along, and should be <em>expected</em> on a reading where χ tracks what
        the region has done. <span class="spec">&#9670;</span></li>
      <li><strong>The collision test.</strong> Colliding clusters separate gas from mass. A state-of-geometry
        halo must pass through unimpeded exactly as a collisionless particle does, so this famous
        observation does not discriminate &mdash; and it is listed here so that no one claims it as
        support.</li>
    </ul>
    <p class="muted">One thing the ledger explicitly cannot do is speak to <em>which way galaxies turn</em>.
      Spin is a property of the fully integrated five per cent and concerns orientation, not completion. The
      handedness question belongs to the seam, and is answered &mdash; or refused &mdash;
      <a href="/moebius/#t-handedness">there</a>.</p>
  </div>
</section>
"""

# ----------------------------------------------------------------- spiral ---
BLOCKS["spiral"] = r"""
<div class="divider">&#10022;</div>

<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">&mdash; the accumulation vertex, counted</p>
    <h2 id="t-quarks">The Thirty-Six and the Quarks</h2>
    <p class="lede muted">666 is interesting to this framework for one reason only: it is the thirty-sixth
      triangular number, the point at which an uninterrupted ascent from 1 to 36 has been completely
      accumulated. So the question that matters is not what 666 means. It is <em>what is thirty-six.</em></p>
  </div>

  <div class="wrap narrow">
    <div class="frame illuminated">
      <p class="formula" style="text-align:center">T<sub>36</sub> = 1 + 2 + &hellip; + 36 =
        36 &times; 37 / 2 = 666</p>
      <p>Thirty-six is also, exactly, the number of quark states in the Standard Model when they are counted
        the way the chart on the wall counts them: <strong>six flavours</strong> &mdash; up, down, strange,
        charm, bottom, top &mdash; each in <strong>three colours</strong>, each with an
        <strong>antiparticle</strong>. Six times three times two is thirty-six. Add the two spin
        orientations and the count doubles to 72, which is the figure cosmologists use for the quark
        contribution to the relativistic degrees of freedom of the early universe, g<sub>*</sub>.
        <span class="sci">&#9670;</span></p>
      <p>Both halves of that paragraph are plain arithmetic over established physics. Neither is in dispute.
        What the framework does with them is a single, carefully limited proposal: that the thirty-six is
        not a coincidence of bookkeeping but a <em>completed ascent</em> &mdash; the full roster of ways
        matter can be a constituent before it is allowed to be a thing.</p>
    </div>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-quarks-vertex">Why the vertex is the accumulation, and not the maximum</h3>
    <p>The chapter above established that of the third density's three upper special points, only 666 is
      triangular. 333 and 999 are not. That is what marks 666 as the <em>accumulation vertex</em>: the place
      where everything counted so far has been summed rather than merely reached. 999 is a ceiling &mdash;
      a clean carry, the point past which the next increment forces a rollover. 666 is a total.</p>
    <p>Set the quark roster beside that distinction and it lands in the right column. Thirty-six is not a
      maximum; nothing forbids a fourth generation in principle, and the count is closed by measurement
      &mdash; the Z boson's invisible width fixes three light neutrino species, which is why three
      generations and not four. <span class="sci">&#9670;</span> Thirty-six is a <em>total</em>: everything
      that was found, summed. And the quantity physics actually cares about when it asks what the early
      universe was doing is precisely the sum over that roster, not the largest member of it. The triangular
      number is the shape of a census. <span class="spec">&#9670;</span></p>
    <p>There is a second join. The three colours of the strong charge and the two faces of the
      M&ouml;bius seam multiply to the six that indexes the flavours; that factorisation, and the honest
      objection to it, is set out in <a href="/moebius/#t-z2-z3">the seam and the colour charge</a>. Here it
      is enough to note that the thirty-six decomposes along exactly the two axes the framework already
      had &mdash; an inversion of order two, and a charge of order three &mdash; and that it does so without
      anything being bent to fit.</p>
    <p class="muted">What is refused: the numerological move. 666 is not claimed to <em>predict</em> the
      quark sector, and if a fourth generation were discovered tomorrow the count would become 48 and this
      section would be deleted rather than rescued. The framework records a structural resemblance between
      a completed triangular sum and a completed particle census, states the mechanism it would need and
      does not have, and leaves it at that. Nothing downstream depends on it.</p>
  </div>
</section>

<div class="divider">&#10022;</div>

<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">&mdash; the one place the triangle does real work</p>
    <h2 id="t-pace">How the Triangle Skeleton Sets the Pace</h2>
    <p class="lede muted">Resemblance is cheap. This is the part of the triangular reading that is not a
      resemblance: the skeleton does not merely count the universe, it times it.</p>
  </div>

  <div class="wrap narrow">
    <div class="frame illuminated">
      <p>Take the triangular numbers and ask the only question that matters dynamically: not how large is
        T<sub>n</sub>, but <em>how much is added at step n.</em> The answer is the simplest possible:</p>
      <p class="formula" style="text-align:center">T<sub>n</sub> &minus; T<sub>n&minus;1</sub> = n</p>
      <p>The increment is the index. Each turn of the ascent deposits exactly as much as its own number, so
        the accumulation grows as n²/2 while the <em>deposit</em> grows only as n. That single fact is the
        pacemaker, and everything else in this section is its consequence.</p>
      <p>The <a href="/skeletal-splice/">skeletal splice</a> shows the same law arriving from an entirely
        different direction. Counting returners through the Fibonacci skeleton gives a deposit per decade of
        exactly φ²/&radic;5 = 1.170820393&hellip;, so the accumulated progress is
        Π<sub>n</sub> &asymp; 1.1708n &minus; 1.618 &mdash; linear in n, just as the triangular deposit is.
        Two different skeletons, a triangular one and a Fibonacci one, agree that
        <strong>progress accumulates linearly</strong>. <span class="spec">&#9670;</span></p>
    </div>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-pace-tick">Linear deposit, hyperbolic tick</h3>
    <p>Now convert deposit into duration. If the rate at which a density is traversed is proportional to the
      progress already accumulated &mdash; v<sub>n</sub> &prop; Π<sub>n</sub> &prop; n &mdash; then the time
      taken to cross the n-th density is its reciprocal:</p>
    <p class="formula" style="text-align:center">t<sub>n</sub> &prop; 1/n</p>
    <p>which has two consequences, and they pull in opposite directions. Each successive turn is
      <em>faster</em> than the one before: the ticks shorten without limit, which is why the later densities
      are described as compressed rather than extended. And yet the total refuses to close, because the
      harmonic series diverges:</p>
    <p class="formula" style="text-align:center">&sum; 1/n = 1 + &frac12; + &#8531; + &frac14; + &hellip;
      &rarr; &infin;</p>
    <p class="lede">The clock accelerates for ever and the journey never finishes. That is the asymptotic
      God, derived a second time, from pace alone.</p>
    <p>It is worth seeing how narrow the escape is. Had the deposit grown even slightly faster &mdash; had
      the skeleton been square rather than triangular, with increment n² and tick 1/n² &mdash; the sum would
      converge to π²/6 and the ascent would arrive in finite time at a reachable One. Had the deposit grown
      slower, progress would stall. The harmonic case is the single boundary between an arrival and a stall,
      and it is the case a <em>linear</em> increment produces. The triangular skeleton is not decorating the
      framework's central claim; it is the reason that claim has the form it does.
      <span class="spec">&#9670;</span></p>
    <p class="muted">Against ourselves: v<sub>n</sub> &prop; Π<sub>n</sub> is an assumption, not a theorem.
      It is the natural one &mdash; accumulated structure carries the next step &mdash; but a different
      coupling between progress and rate gives a different series, and some of those converge. The result is
      robust to the <em>constant</em> (1.1708 or any other positive number changes nothing, since the
      harmonic series diverges regardless of scaling) and fragile to the <em>exponent</em>. Stating which
      part is sturdy and which is the hinge is the whole of the discipline here.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-pace-clock">What this says about now</h3>
    <p>If the tick shortens as 1/n, then the subjective length of a density is not a measure of how much
      happens in it. Early densities are long and sparse; later ones are brief and dense, carrying more
      accumulated structure through a shorter interval. A being in the third density is not halfway through
      anything in time; it is at the point where the deposit has grown large enough for the pace to be felt
      as acceleration &mdash; which is, in the framework's reading, exactly the complaint every generation
      makes about the one before it. <span class="myth">&#9670;</span></p>
    <p class="muted small">That last paragraph is vision and is marked as vision. The arithmetic above it is
      not.</p>
  </div>
</section>
"""


sys.path.insert(0, str(Path(__file__).resolve().parent))
from _tti_blocks_2 import BLOCKS2  # noqa: E402

BLOCKS.update(BLOCKS2)


def apply_block(key: str, html: str) -> bool:
    path = SRC / f"{key}.njk"
    text = path.read_text()
    wrapped = (
        MARK_OPEN.format(key=key) + "\n" + html.strip() + "\n" + MARK_CLOSE.format(key=key) + "\n\n"
    )
    pattern = re.compile(
        re.escape(MARK_OPEN.format(key=key)) + r".*?" + re.escape(MARK_CLOSE.format(key=key)) + r"\n*",
        re.S,
    )
    if pattern.search(text):
        text = pattern.sub(wrapped, text)
    else:
        # insert before the final <section ...> of the file (the closing creed)
        idx = text.rstrip().rfind("\n<section")
        if idx < 0:
            raise SystemExit(f"{key}: no insertion point found")
        text = text[: idx + 1] + wrapped + text[idx + 1 :]
    path.write_text(text)
    return True


def main() -> None:
    for key, html in BLOCKS.items():
        apply_block(key, html)
        print(f"expanded tti/src/{key}.njk")


if __name__ == "__main__":
    main()
