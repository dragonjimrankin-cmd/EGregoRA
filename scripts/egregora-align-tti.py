#!/usr/bin/env python3
"""Bring the EGregoRA pages into agreement with The Two Infinities site.

Where the two sites differed on the Moebius Seam, the Cosmic Ledger or the
Rankin Skeletal Splice, TTI is canonical and EGregoRA is corrected here.
Idempotent: literal swaps are checked before applying, inserted sections are
wrapped in marker comments and replaced on re-run.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

# --------------------------------------------------------------------------
# 1. Literal corrections (old -> new). Each must match exactly once.
# --------------------------------------------------------------------------
SWAPS = [
    # ---- src/cosmic-ledger.njk ------------------------------------------
    ("src/cosmic-ledger.njk",
     """the independent research project of <strong>James Rankin</strong>, co-founder of this order, which
    holds three limbs together: <a href="/moebius-seam/">the Moebius Seam</a>, the <strong>Cosmic
    Ledger</strong> set out here, and the <strong>Rankin Skeletal Splice</strong>, the numerical work
    on the ways the Riemann Hypothesis is equivalent. The Framework is soon to be published in full,
    where these ideas are detailed properly and the mathematics is rigorously tested. Until that
    publication, what is written here is a summary in plain words, and it is graded as myth and
    speculation because that is what an unpublished framework is.""",
     """the independent research project of <strong>James Alexander Matthew Rankin</strong>, co-founder of
    this order, which holds three limbs together: <a href="/moebius-seam/">the Moebius Seam</a>, the
    <strong>Cosmic Ledger</strong> set out here, and the <strong>Rankin Skeletal Splice</strong> &mdash;
    the arithmetic of the fork at every density threshold, taken against the fixed skeleton of
    &minus;1, 0 and 1 and its scaled images 333, 666 and 999. The Framework is now written out at full
    length as the <em>Unified Edition</em>, and where this page and that account differ, the Unified
    Edition is the correct one and this page has been brought into line with it. What is written here
    remains a summary in plain words, graded as teaching rather than physics.""")
    ,
    ("src/cosmic-ledger.njk",
     """The claim, in one breath: <em>collapse leaves a residue; residue is polarity; polarity accumulated
    over the history of the universe is what gives constants and boson couplings the particular values
    they have; the residue cannot be quantised, because the act of measurement destroys exactly the
    record that quantising it would require; and the proportions of dark energy, dark matter and ordinary
    matter that we measure are the running balance of that ledger at 13.8 billion years &mdash; our
    reading, at our moment, not a fixed property of the world.</em>""",
     """The claim, in one breath: <em>collapse leaves a residue; residue is polarity; the universe is
    modelled as a structured zero on the Riemann sphere, whose three poles stand for three degrees of
    completion along the chain &alpha; &rarr; &pi; &rarr; &pi;/2 &rarr; i; and the dark energy, dark
    matter and ordinary matter we measure are the residues at those three poles &mdash; 68.10, 26.95 and
    4.95 &mdash; dark matter being not a particle but geometry that reached the &pi;/2 threshold and
    stopped, far enough to gravitate, not far enough to carry a phase and therefore not far enough to
    shine.</em>""")
    ,
    ("src/cosmic-ledger.njk",
     """The teaching maps the three fractions onto three states of the ledger: what has
    not been entered, what has been entered but not phased, and what has fully integrated into charged,
    chemical, visible matter. Note carefully that standard cosmology already explains the changing
    proportions without any of this, and that nothing here yet predicts 26.2 rather than 20 or 40. The
    Framework claims a derivation; the derivation is what the publication will have to show.""",
     """The teaching maps the three fractions onto three degrees of completion: baseline
    geometry that never left &pi;, geometry that reached &pi;/2 and halted, and geometry that completed
    the phase into charged, chemical, visible matter. The Framework now does produce numbers &mdash;
    68.10, 26.95 and 4.95, as the residues of its measurement function &mdash; which moves the argument
    on but does not end it: the numbers follow from the choice of that function, and it is the choice
    that is owed a justification. Standard cosmology, meanwhile, explains the changing proportions
    without any of this.""")
    ,
    ("src/cosmic-ledger.njk",
     """    <p>Everything the order has published on the Seam, the Ledger and the Splice is a summary. The full
    account is <strong>The Two Infinities Framework</strong> by <strong>James Rankin</strong>, an
    independent research project currently in progress and <strong>soon to be published in full</strong>.
    It is there that these ideas are detailed properly: the geometry of the seam, the ledger of residue
    polarisation, the derivation the fractions would need, and the number-theoretic work of the Rankin
    Skeletal Splice &mdash; with the mathematics <strong>rigorously tested</strong> rather than
    asserted.</p>
    <p>The order aligns itself with the project and will link to it the moment there is something to link
    to. Until then we publish the ideas as what they are, graded as what they are, and we would rather be
    argued with early than believed late.</p>""",
     """    <p>Everything the order has published on the Seam, the Ledger and the Splice is a summary. The full
    account is <strong>The Two Infinities Framework</strong> by
    <strong>James Alexander Matthew Rankin</strong>, now written out at full length as the
    <em>Unified Edition</em>: thirty-one chapters and an appendix, with the geometry of the seam, the
    measurement function and its three residues, the &chi;-field reading of the dark sector, and the
    arithmetic of the Skeletal Splice each set out with what is earned, what is chosen and what is
    refused kept apart.</p>
    <p><strong>Where this page and the Unified Edition disagree, the Unified Edition is right.</strong>
    The three sections below have been corrected against it, and the corrections are marked rather than
    quietly made. A public link follows when the Framework's own site opens; until then the order will
    send the relevant chapter to anyone who asks.</p>""")
    ,
    ("src/cosmic-ledger.njk",
     """      <li><strong>In progress</strong> &mdash; The Two Infinities Framework, James Rankin: the Seam, the Ledger and the Skeletal Splice set out together, with the mathematics tested. <span class="spec">&#9670;</span></li>""",
     """      <li><strong>2026</strong> &mdash; The Two Infinities Framework, James Alexander Matthew Rankin: the Unified Edition, with the Seam, the Ledger and the Skeletal Splice set out together &mdash; the measurement function, the three residues 68.10 / 26.95 / 4.95, and the &chi;-field halo that gives a flat rotation curve. <span class="spec">&#9670;</span></li>""")
    ,
    ("src/cosmic-ledger.njk",
     """      <dt>The Two Infinities Framework</dt><dd>James Rankin's independent research project: the Moebius Seam, the Cosmic Ledger and the Rankin Skeletal Splice as one account, soon to be published in full.</dd>
      <dt>Rankin Skeletal Splice</dt><dd>The numerical component of the Framework, claiming new ways in which the Riemann Hypothesis is equivalent.</dd>""",
     """      <dt>The Two Infinities Framework</dt><dd>James Alexander Matthew Rankin's independent research project: the Moebius Seam, the Cosmic Ledger and the Rankin Skeletal Splice as one account, written out in full as the Unified Edition. Where this site and that account differ, that account is correct.</dd>
      <dt>Rankin Skeletal Splice</dt><dd>The arithmetic limb of the Framework: the fork taken at every density threshold, the halves sent back counted as R<sub>n</sub> = F<sub>n+2</sub> &minus; 1, and the deposit per density that converges on &phi;&sup2;/&radic;5 = 1.170820393&hellip;</dd>
      <dt>Quantum of deposit</dt><dd>&phi;&sup2;/&radic;5, the amount of accumulated polarisation each density adds in the limit. It makes progress linear in n, which makes the tick 1/n, which makes the ascent unfinishable.</dd>
      <dt>&chi;-field</dt><dd>The Framework's bookkeeping of how far a region has travelled along &alpha; &rarr; &pi; &rarr; &pi;/2 &rarr; i. &chi; &asymp; 0 is dark energy, &chi; &asymp; &frac12; is dark matter, &chi; &asymp; 1 is ordinary matter.</dd>""")
    ,
    ("src/cosmic-ledger.njk",
     """      <li><span class="spec">&#9670;</span> <strong>James Rankin</strong>, <em>The Two Infinities Framework</em> &mdash; in progress; link to follow on publication.</li>""",
     """      <li><span class="spec">&#9670;</span> <strong>James Alexander Matthew Rankin</strong>, <em>The Two Infinities Framework &mdash; Unified Edition</em> &mdash; the source for the three teaching sections on this page, and the authority where this page and it disagree.</li>""")
    ,
    ("src/cosmic-ledger.njk",
     """    the Ledger is the bookkeeping, and the Skeletal Splice is the arithmetic that has to balance if either
    of the other two is to mean anything. <span class="spec">&#9670;</span></p>""",
     """    the Ledger is the bookkeeping, and the Skeletal Splice is the arithmetic that has to balance if either
    of the other two is to mean anything. In the Unified Edition the Splice is the Fibonacci count of the
    halves sent back at every threshold, not a result about the Riemann Hypothesis; the only Riemann
    object the Framework uses is the <em>sphere</em> the Ledger's function is defined on.
    <span class="spec">&#9670;</span></p>""")
    ,
    # ---- src/moebius-seam.njk -------------------------------------------
    ("src/moebius-seam.njk",
     """      <li><span class="myth">&#9670;</span> <strong>"The Seam is equivalent to RH."</strong> No derivation exists in either direction. The word is being used as poetry.</li>""",
     """      <li><span class="myth">&#9670;</span> <strong>"The Seam is equivalent to RH."</strong> No derivation exists in either direction, the word was being used as poetry, and the Framework itself makes no such claim &mdash; this identification was the order's own embroidery and is now withdrawn. See <a href="#t-corrected">the correction</a>.</li>""")
    ,
    ("src/moebius-seam.njk",
     """      <li><span class="myth">&#9670;</span> <strong>"Gravity is the memory of baryonic matter."</strong> Gravity couples to all stress-energy, most gravitating matter is not baryonic, and free fall is history-independent to one part in 10<sup>15</sup>.</li>""",
     """      <li><span class="myth">&#9670;</span> <strong>"Gravity is the memory of baryonic matter."</strong> Gravity couples to all stress-energy, most gravitating matter is not baryonic, and free fall is history-independent to one part in 10<sup>15</sup>. The Framework's own reading is different and better: gravity is the curvature of the integration field itself, and the dark sector is that field caught at three stages of completion.</li>""")
    ,
    ("src/moebius-seam.njk",
     """      <dt>Equivalence (mathematical)</dt><dd>Mutual derivability. Not resemblance, not analogy, not rhyme.</dd>""",
     """      <dt>Equivalence (mathematical)</dt><dd>Mutual derivability. Not resemblance, not analogy, not rhyme.</dd>
      <dt>Berry phase</dt><dd>A geometric phase a quantum state picks up by being carried around a loop in parameter space. Real, measured, and the quantity the Framework asks to account for CP violation &mdash; a phase of exactly &pi;, the half-twist.</dd>
      <dt>Colour charge</dt><dd>The charge of the strong force. Three values, never observed alone: everything that reaches a detector is a colour bound to its own inversion. The Framework reads that as the seam seen from underneath.</dd>
      <dt>Two-being seam</dt><dd>The reading on which the half-twist produces not one oriented thing but an inverted pair sharing a single surface &mdash; which puts a plane in the sky across which galaxy handedness should reverse.</dd>""")
    ,
]

# --------------------------------------------------------------------------
# 2. Inserted sections, keyed by a marker comment.
# --------------------------------------------------------------------------
INSERTS = []

INSERTS.append((
    "src/moebius-seam.njk",
    "seam-corrected",
    # anchor: insert immediately before this literal
    '  <div class="page-head tight">\n    <p class="kicker">Third of Three &mdash; the doctrine</p>',
    r"""
<div class="divider">✦</div>

<!-- =========================== CORRECTED =============================== -->
<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">Corrected against the Framework &mdash; read this before the doctrine below</p>
    <h2 id="t-corrected">What the Seam Actually Says</h2>
    <p class="lede muted">This page was written before the Two Infinities Framework was set out at full
    length. Where the two differ, the Framework is the correct one, and three things on this page were
    wrong. They are named here rather than quietly repaired.</p>
  </div>

  <div class="wrap narrow">
    <div class="frame illuminated">
      <h3>The three corrections</h3>
      <ol>
        <li><strong>The Seam is not a statement about the Riemann Hypothesis.</strong> The Framework makes
        no claim on the Hypothesis at all. The only Riemann object it uses is the <em>sphere</em> &mdash;
        the surface on which the Cosmic Ledger's measurement function is defined. The identification of
        the critical line with the seam was the order's own embroidery on a resemblance, and it is
        withdrawn. The exposition of the Hypothesis further down this page is kept because it is good
        mathematics honestly told; it is no longer presented as doctrine.</li>
        <li><strong>The Splice is not a Riemann result either.</strong> The Rankin Skeletal Splice is the
        arithmetic of the fork taken at every density threshold: the halves sent back are counted as
        R<sub>n</sub> = F<sub>n+2</sub> &minus; 1, and the deposit per density converges on
        &phi;&sup2;/&radic;5. See <a href="/cosmic-ledger/#t-splice-corrected">the Ledger page</a>.</li>
        <li><strong>Gravity is not the remembered weight of baryonic matter.</strong> In the Framework
        gravity is the curvature of the integration field itself, and the dark sector is that field
        caught at three degrees of completion. The old formulation failed on its own terms, since most
        gravitating matter is not baryonic.</li>
      </ol>
    </div>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <p class="kicker">The Framework's seam, in its own terms</p>
    <h3 id="t-corrected-four">Four shapes, and only one of them is a way of getting somewhere</h3>
    <p>The circle is &pi; applied once: a line curved into a closed loop. The torus is &pi; applied twice:
    a loop curved around another loop. The complex plane is generated by &pi;/2, the half-rotation that
    creates the imaginary axis. The Moebius strip is &pi; applied as a half-twist that <em>inverts
    orientation</em> rather than closing it. Three of those are places to be; the fourth is the
    transition between them, and that distinction carries the whole chapter.
    <span class="spec">&#9670;</span></p>
    <p>From it the Framework takes three readings. That <strong>i is the strip caught mid-twist</strong>
    &mdash; not imaginary in the sense of being unreal, but imaginary in the sense of being a quarter of
    the way through an inversion, since i&sup2; = &minus;1 completes the half-twist.
    <span class="sci">&#9670;</span> That <strong>quantum collapse is the identification of the two
    faces</strong>: a complex-valued wavefunction has a real face and an imaginary one, and collapse is
    the moment they reveal themselves as a single continuous surface. That offers a topology for the
    event and not a dynamics, and any reading which promotes it to a solution of the measurement problem
    has overstated it. <span class="spec">&#9670;</span> And that <strong>CP violation is a Moebius Berry
    phase of exactly &pi;</strong>: matter acquires phase &theta; crossing the throat, antimatter
    &theta; + &pi;, the difference being the structural signature of the half-twist. That one is owed a
    calculation it does not yet have. <span class="spec">&#9670;</span></p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h3 id="t-corrected-colour">Where the seam shows up small: colour charge</h3>
    <p>Quarks carry a charge of the strong force called colour &mdash; three values, three anticolours,
    gauge group SU(3), eight gluons. No isolated colour has ever been seen. Every object that reaches a
    detector is colourless: three quarks taking one of each, or a quark bound to an antiquark of the
    matching anticolour. A gluon itself carries one colour <em>and</em> one anticolour.
    <span class="sci">&#9670;</span></p>
    <p>Read that list again with a strip in hand. A charge carried only ever as a thing bound to its own
    inversion, which cannot be prised apart and displayed separately, is the definition of a surface with
    one face rather than two. On a cylinder you could keep red and anti-red distinct for ever; on a
    half-twisted band you cannot. <span class="spec">&#9670;</span></p>
    <p class="muted">And the objection, which the Framework states before anyone else can: the twist is
    order two, Z&#8322;, while the centre of SU(3) is Z&#8323;. A half-twist supplies the
    <em>inversion</em>, not the <em>multiplicity</em>. The two multiply to Z&#8326;, and the quark sector
    counted as flavour times colour times sign contains exactly 6 &times; 3 &times; 2 = 36 states &mdash;
    arithmetic which is exact and which earns nothing until it predicts a number QCD does not already
    have.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h3 id="t-corrected-galaxies">Where the seam shows up large: the handedness of galaxies</h3>
    <p>This is the one place the Framework volunteers for refutation. Automated analyses of spiral-arm
    curvature report that the two directions of rotation are not found in equal numbers: in JWST's
    Advanced Deep Extragalactic Survey, of 263 galaxies whose spin could be read, 158 turned clockwise and
    105 counterclockwise &mdash; a 3.39&sigma; departure &mdash; and a DESI Legacy sample of some 1.3
    million galaxies maps the effect as a dipole that reverses across a plane near our own Galactic pole.
    <span class="sci">&#9670;</span></p>
    <p>A single global half-twist predicts a uniform lean over the whole sky, which is precisely what the
    data is not. A twist that births an inverted <em>pair</em> puts a plane where the two orientations
    hand off &mdash; a sign flip, which is what is seen. The prediction is not the size of the asymmetry,
    because the Framework has no amplitude and says so, but its shape: a cleanly odd orientation field,
    A(&minus;n&#770;) = &minus;A(n&#770;), about a single great circle.
    <span class="spec">&#9670;</span></p>
    <p class="muted">The rival is pedestrian and currently the favourite: galaxies turning against the
    Milky Way's motion are Doppler-brightened, enter a magnitude-limited sample preferentially, and
    produce exactly such an excess centred on our pole. The Framework's own expectation &mdash; that a
    primordial seam ought to be a cosmic-frame structure rather than one aligned with our own pole
    &mdash; runs partly against the current data, and it records that against itself.</p>
  </div>
</section>
"""
))

INSERTS.append((
    "src/cosmic-ledger.njk",
    "ledger-corrected",
    '<!-- ================================ LEDGER ================================ -->',
    r"""
<div class="divider">✦</div>

<!-- ======================= CORRECTED AGAINST TTI ========================= -->
<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">Corrected against the Framework</p>
    <h2 id="t-corrected">The Ledger as the Unified Edition Writes It</h2>
    <p class="lede muted">The teaching above was written in plain words before the Framework was set out
    at full length. It is not wrong so much as vague, and the Unified Edition is both more specific and
    more exposed. Where the two differ, this is the correct version.</p>
  </div>

  <div class="wrap narrow">
    <div class="frame illuminated">
      <h3 id="t-corrected-function">A structured zero, and three residues</h3>
      <p>The universe is modelled as a meromorphic function on the <strong>Riemann sphere</strong> whose
      residues encode the structural constraints of the cosmos. The Global Residue Theorem then requires
      that the total residue vanish &mdash; which is the precise sense in which the universe is a
      structured zero rather than a nothing. That much is standard complex analysis.
      <span class="sci">&#9670;</span></p>
      <p class="formula" style="text-align:center">f(z) = (1 / z&thinsp;sin(&pi;z)) &middot;
      cos(&pi;z/2) &minus; &kappa;z&sup2;</p>
      <p>The Framework's own content is the choice of that function &mdash; the <strong>Universal Rankin
      Measurement Function</strong> &mdash; and the claim that &kappa; is not fitted but rigid: the
      volume-to-surface-area ratio of a unit torus undergoing a Moebius inversion half-twist,
      &kappa; = 1/4&pi;&sup2; &asymp; 0.025330. Its three structural poles on the real axis carry residues
      of about 0.6810, 0.2695 and 0.0495, with &minus;1 at infinity closing the sum.
      <span class="spec">&#9670;</span></p>
      <div class="table-wrap">
      <table class="ledger">
        <thead><tr><th>Pole</th><th>Stage on &alpha; &rarr; &pi; &rarr; &pi;/2 &rarr; i</th><th>What it does</th><th>Share</th></tr></thead>
        <tbody>
          <tr><td>z = 1</td><td>&pi; only &mdash; baseline curvature</td><td>Expands; neither clumps nor shines</td><td>68.10%</td></tr>
          <tr><td>z = &frac12;</td><td>&pi;/2 reached, phase split incomplete</td><td>Gravitates; does not shine</td><td>26.95%</td></tr>
          <tr><td>z = 0</td><td>i &mdash; full complex phase</td><td>Gravitates, shines, binds, builds chemistry</td><td>4.95%</td></tr>
        </tbody>
      </table>
      </div>
      <p class="muted">Compare those three with the Planck figures quoted at the top of this page and the
      agreement is close but not exact, which is the honest state of it. Two challenges the author records
      against himself remain open: that the residues are computed from an ansatz rather than derived, and
      that the uniqueness of the three poles is asserted rather than proved.</p>
    </div>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-corrected-dark-matter">Dark matter is a state, not a species</h3>
    <p>This is the sharpest correction on the page. The earlier teaching called dark matter &ldquo;residue
    entered but not phased&rdquo;, which is the right instinct in imprecise words. The Framework says it
    exactly: dark matter is geometry that reached the &pi;/2 threshold and halted. It has the curvature,
    so it must gravitate. The complex phase never completed, so it cannot couple to light. Being dark is
    structural rather than accidental &mdash; which is more than the particle hypothesis offers, since a
    WIMP is dark because its couplings were chosen small. <span class="spec">&#9670;</span></p>
    <p>And it pays for itself with a rotation curve. A galaxy sits in a gradient running from &chi; &asymp;
    1 in the luminous disk to &chi; &asymp; &frac12; through the halo. A &chi; &prop; 1/r profile gives
    &rho; &prop; 1/r&sup2;, hence an enclosed mass growing linearly with radius, hence a constant orbital
    velocity far beyond the visible disk &mdash; which is what Rubin and Ford measured and what the
    visible mass cannot explain.</p>
    <p class="formula" style="text-align:center">&chi; &prop; 1/r &rArr; &rho; &prop; 1/r&sup2; &rArr;
    M(r) &prop; r &rArr; v(r) = constant</p>
    <p class="muted">The debt, stated as the Framework states it: the 1/r profile is motivated &mdash; it
    is the natural behaviour of a scalar field sourced by a central mass in the weak-field limit &mdash;
    but it has not been derived from the Framework's own modified field equations. It is a profile chosen
    because it works, not forced because it must be. That is the first place a critic should press, and
    one unambiguous direct detection of a dark-matter particle would end the reading outright.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h3 id="t-splice-corrected">The Rankin Skeletal Splice, correctly described</h3>
    <p>The order has previously described the Splice as numerical work on the Riemann Hypothesis. That was
    wrong and is withdrawn. The Splice is the arithmetic of the fork taken at every density threshold,
    counted against the fixed skeleton of &minus;1, 0 and 1 and its scaled images 333, 666 and 999.</p>
    <p>At each threshold the ascending population divides, and the halves sent back are counted on a
    Fibonacci skeleton:</p>
    <p class="formula" style="text-align:center">R<sub>n</sub> = F<sub>n+2</sub> &minus; 1 &nbsp;&middot;&nbsp;
    &delta;&Pi;<sub>n</sub> = (F<sub>n+2</sub> &minus; 1)&middot;&phi;<sup>&minus;n</sup> &rarr;
    &phi;&sup2;/&radic;5 = (5 + 3&radic;5)/10 = 1.170820393&hellip;</p>
    <p>So the accumulated polarisation is &Pi;<sub>n</sub> &asymp; 1.1708n &minus; 1.618 &mdash; linear in
    n. The triangular skeleton agrees from the other direction, since
    T<sub>n</sub> &minus; T<sub>n&minus;1</sub> = n and 666 is T<sub>36</sub>, the thirty-sixth triangular
    number and so the vertex at which an uninterrupted ascent from 1 to 36 stands completely accumulated.
    <span class="sci">&#9670;</span></p>
    <p class="lede">Linear deposit makes the rate linear, which makes each density's tick go as 1/n, which
    makes the clock accelerate for ever &mdash; and yet &sum;1/n diverges, so the ascent never arrives.
    That is the Framework's asymptotic God, derived a second time from pace alone.
    <span class="spec">&#9670;</span></p>
    <p class="muted">How narrow that escape is, is the point. A skeleton depositing n&sup2; per step would
    give ticks of 1/n&sup2;, a total of &pi;&sup2;/6, and a journey that arrives. A constant deposit would
    stall. Linear is the single knife-edge between the two, and both of the Framework's skeletons sit on
    it. The hinge is the assumption that rate is carried by accumulated progress; the Framework names it
    rather than hiding it.</p>
  </div>
</section>
"""
))


def swap(rel: str, old: str, new: str) -> str:
    path = ROOT / rel
    text = path.read_text()
    if new in text:
        return "already"
    n = text.count(old)
    if n != 1:
        raise SystemExit(f"{rel}: expected 1 match, found {n}\n---\n{old[:120]}")
    path.write_text(text.replace(old, new, 1))
    return "ok"


def insert(rel: str, key: str, anchor: str, html: str) -> str:
    path = ROOT / rel
    text = path.read_text()
    block = f"<!-- align:{key}:start -->\n{html.strip()}\n<!-- align:{key}:end -->\n\n"
    pat = re.compile(
        re.escape(f"<!-- align:{key}:start -->") + r".*?" + re.escape(f"<!-- align:{key}:end -->") + r"\n*",
        re.S,
    )
    if pat.search(text):
        text = pat.sub(block, text)
    else:
        if text.count(anchor) < 1:
            raise SystemExit(f"{rel}: anchor not found for {key}")
        text = text.replace(anchor, block + anchor, 1)
    path.write_text(text)
    return "ok"


def main() -> None:
    for rel, old, new in SWAPS:
        print(f"{swap(rel, old, new):8} swap   {rel}")
    for rel, key, anchor, html in INSERTS:
        print(f"{insert(rel, key, anchor, html):8} insert {rel} [{key}]")


if __name__ == "__main__":
    main()
