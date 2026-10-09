#!/usr/bin/env python3
"""Insert the toy-integrator stress test into tti/src/stress-tests.njk.

Reads ops/tti-toy-integrator.json (written by scripts/tti-toy-integrator.py).
Idempotent: re-running replaces the section between its markers.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "tti" / "src" / "stress-tests.njk"
D = json.loads((ROOT / "ops" / "tti-toy-integrator.json").read_text())

BK = D["baker"]
FWD, BWD = BK["forward_entropy_bits"], BK["backward_entropy_bits"]
BR = D["branch"]
SW = D["swap"]

# ------------------------------------------------------------------ plate
W, H = 760, 400
# left panel: entropy against step, forward and backward
L1, R1, T1, B1 = 72, 372, 56, 300
steps = len(FWD) - 1
emax = max(max(FWD), max(BWD)) * 1.08


def X1(i):
    return L1 + i / steps * (R1 - L1)


def Y1(v):
    return B1 - v / emax * (B1 - T1)


fwd_path = " L".join(f"{X1(i):.1f} {Y1(v):.1f}" for i, v in enumerate(FWD))
bwd_path = " L".join(f"{X1(i):.1f} {Y1(v):.1f}" for i, v in enumerate(BWD))
fwd_dots = "".join(
    f'          <circle cx="{X1(i):.1f}" cy="{Y1(v):.1f}" r="2.6" fill="#45d6b4"/>\n'
    for i, v in enumerate(FWD))
bwd_dots = "".join(
    f'          <path d="M{X1(i)-3:.1f} {Y1(v)-3:.1f} l6 6 M{X1(i)+3:.1f} {Y1(v)-3:.1f} l-6 6" '
    f'stroke="#ef84b6" stroke-width="1.3"/>\n'
    for i, v in enumerate(BWD))

# right panel: drift and entropy production against branching ratio
L2, R2, T2, B2 = 452, 724, 56, 300
bs = sorted(int(k) for k in BR)
pmax = max(BR[str(b)]["entropy_production_per_step_nats"] for b in bs) * 1.12


def X2(i):
    return L2 + i / (len(bs) - 1) * (R2 - L2)


def Y2(v):
    return B2 - v / pmax * (B2 - T2)


ep_path = " L".join(
    f"{X2(i):.1f} {Y2(BR[str(b)]['entropy_production_per_step_nats']):.1f}"
    for i, b in enumerate(bs))
dr_path = " L".join(
    f"{X2(i):.1f} {Y2(BR[str(b)]['drift_per_step']):.1f}" for i, b in enumerate(bs))
sw_dots = "".join(
    f'          <circle cx="{X2(bs.index(int(k))):.1f}" cy="{Y2(0.0):.1f}" r="4" '
    f'fill="none" stroke="#ffd979" stroke-width="1.6"/>\n' for k in SW)
xt2 = "".join(
    f'          <text x="{X2(i):.1f}" y="{B2+18}">{b}</text>\n' for i, b in enumerate(bs))
xt1 = "".join(
    f'          <text x="{X1(i):.1f}" y="{B1+18}">{i}</text>\n' for i in range(0, steps + 1, 2))

PLATE = f'''  <figure id="fig-toy" class="plate">
    <figcaption class="plate-cap"><span class="plate-num">Plate IV</span> The Toy Integrator: an Arrow
      That Is Not There, and One That Was Put There <span class="sci">&#9670;</span></figcaption>
    <div class="plate-art">
      <svg viewBox="0 0 {W} {H}" role="img" aria-label="Two panels. On the left, coarse-grained entropy against step number for a reversible map, run forwards and backwards from the same starting blob: the two curves rise together and lie on top of one another. On the right, entropy production per step against branching ratio for a walk on a tree, rising steeply, with gold rings at zero marking the same tree sampled by a different measure.">
        <g fill="none" stroke="#a9b6d8" stroke-width="0.8" opacity="0.5">
          <path d="M{L1} {T1-10} V{B1} H{R1}"/>
          <path d="M{L2} {T2-10} V{B2} H{R2}"/>
        </g>
        <path d="M{fwd_path}" fill="none" stroke="#45d6b4" stroke-width="1.6" opacity="0.9"/>
        <path d="M{bwd_path}" fill="none" stroke="#ef84b6" stroke-width="1.6" opacity="0.75"
          stroke-dasharray="5 4"/>
{fwd_dots}{bwd_dots}
        <path d="M{ep_path}" fill="none" stroke="#cdefff" stroke-width="1.8"/>
        <path d="M{dr_path}" fill="none" stroke="#a07cf0" stroke-width="1.4" stroke-dasharray="4 3"/>
{sw_dots}
        <g font-family="EB Garamond, serif" font-size="11" fill="#a9b6d8" text-anchor="middle">
{xt1}{xt2}        </g>
        <g font-family="Cinzel, serif" font-size="9.5" letter-spacing="2" fill="#a9b6d8">
          <text x="{(L1+R1)/2:.0f}" y="{B1+40}" text-anchor="middle">STEP</text>
          <text x="{(L2+R2)/2:.0f}" y="{B2+40}" text-anchor="middle">BRANCHING RATIO b</text>
          <text x="{L1}" y="{T1-22}">A &middot; REVERSIBLE MAP &mdash; ENTROPY, BITS</text>
          <text x="{L2}" y="{T2-22}">B &middot; TREE WALK &mdash; ENTROPY PRODUCTION</text>
        </g>
        <g font-family="EB Garamond, serif" font-size="12" font-style="italic">
          <text x="{L1+10}" y="{T1+26}" fill="#45d6b4">forwards</text>
          <text x="{L1+10}" y="{T1+44}" fill="#ef84b6">backwards &mdash; the same rise</text>
          <text x="{L2+8}" y="{T2+26}" fill="#cdefff">uniform over states</text>
          <text x="{L2+8}" y="{T2+44}" fill="#a07cf0">drift per step, dashed</text>
          <text x="{L2+8}" y="{T2+62}" fill="#ffd979">uniform over directions: zero</text>
        </g>
        <g font-family="EB Garamond, serif" font-size="12" fill="#a9b6d8">
          <text x="{L1}" y="{H-24}">Asymmetry between the two directions: {BK["asymmetry"]:.3f} bits &mdash; nothing.</text>
        </g>
      </svg>
    </div>
    <p class="plate-note">Left: twenty thousand points started in a small blob and pushed through an
      exactly reversible map. Coarse-grained entropy climbs {BK["forward_rise"]:.2f} bits going forwards
      and {BK["backward_rise"]:.2f} bits going <em>backwards</em>, and the two curves lie on top of each
      other. Right: a walk on a tree with b ways down and one way up. Sampling uniformly over states
      produces entropy at up to {max(BR[str(b)]["entropy_production_per_step_nats"] for b in bs):.2f}
      nats per step; sampling the same tree uniformly over directions produces exactly none.
      <span class="sci">&#9670;</span></p>
  </figure>
'''

SECTION = f'''<div class="divider">&#10022;</div>

<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">&mdash; experiment five, and the framework loses this one</p>
    <h2 id="t-toy">The Toy Integrator</h2>
    <p class="lede muted">The task this page set was exact: build the smallest simulation containing two
      opposed infinities and see whether an arrow of time appears without one being inserted by hand. It
      was built. The answer is no, and the reason is more useful than the answer.</p>
  </div>

  <div class="wrap narrow">
    <div class="frame illuminated">
      <h3 id="t-toy-models">Three models, each answering one question</h3>
      <p>The code is <code>scripts/tti-toy-integrator.py</code> and the output
        <code>ops/tti-toy-integrator.json</code>. Entropy production is measured as the
        Kullback&ndash;Leibler divergence per step between the forward path distribution and its time
        reverse, which is zero exactly when the dynamics is statistically reversible &mdash; the standard
        definition, not one invented here.</p>
      <ul>
        <li><strong>A. The baker's map.</strong> The two infinities as stretching against folding:
          doubling in one direction, halving into the interval in the other. Exactly invertible and
          area-preserving, so any arrow found in it must be an artefact. Twenty thousand points start in a
          small blob and are run forwards <em>and backwards</em>.</li>
        <li><strong>B. The branching walk.</strong> The framework's asymmetry stated as plainly as it can
          be: from any level there are b ways down, because the interval subdivides, and one way up,
          because counting proceeds by ones. Choose uniformly among the available states.</li>
        <li><strong>C. The same tree, one thing changed.</strong> Choose uniformly among the available
          <em>directions</em> instead. Same state space, same asymmetry in the number of states, a
          different and equally arbitrary measure.</li>
      </ul>
    </div>
  </div>
</section>

<section class="wrap">
{PLATE}
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-toy-result">What came out</h3>
    <p><strong>Model A found no arrow, and found it loudly.</strong> Coarse-grained entropy rose
      {BK["forward_rise"]:.3f} bits running forwards and {BK["backward_rise"]:.3f} bits running
      backwards, with the two directions differing by {BK["asymmetry"]:.3f} bits &mdash; noise. A blob
      spreads whichever way you run the clock. The rise is a fact about starting small and about looking
      through a grid, not a fact about a direction in the dynamics.
      <span class="sci">&#9670;</span></p>
    <p><strong>Model B found a strong arrow.</strong> With b = 2 the walk drifts downward at
      {BR["2"]["drift_per_step"]:+.3f} per step and produces
      {BR["2"]["entropy_production_per_step_nats"]:.3f} nats of entropy per step; by b = 10 that is
      {BR["10"]["drift_per_step"]:+.3f} per step and
      {BR["10"]["entropy_production_per_step_nats"]:.3f} nats. The drift follows (b&minus;1)/(b+1) and the
      production ((b&minus;1)/(b+1))&middot;ln&nbsp;b exactly. More room downward, so the walk goes down.
      Exactly what the framework predicts.</p>
    <p class="lede"><strong>And Model C killed it.</strong> Same tree, same cardinalities, same
      &ldquo;more room below&rdquo; &mdash; measure swapped from states to directions, and the drift falls
      to {SW["10"]["drift_per_step"]:+.4f} per step with entropy production of exactly zero, at every
      branching ratio. <span class="sci">&#9670;</span></p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h3 id="t-toy-verdict">The verdict, stated plainly</h3>
    <p>The asymmetry between the two infinities does <strong>not</strong>, by itself, produce a direction
      of time. What produces the direction in Model B is not the fact that there are more states below;
      it is the decision to sample states uniformly. Change that decision and the arrow vanishes while
      every cardinality in the model stays exactly where it was.</p>
    <p class="lede">So the step the framework takes on the foundations page &mdash; from
      &ldquo;there is more room in that direction&rdquo; to &ldquo;things therefore tend that way&rdquo;
      &mdash; is not merely unproven. It is <em>false as stated</em>, and the smallest honest simulation
      of it says so. The missing ingredient is a measure, and the framework has never supplied one.</p>
    <p>Which sharpens the entropy objection rather than answering it, and sharpens it in a particular
      direction. &ldquo;Sample uniformly over states&rdquo; is not a neutral choice: it is the
      postulate of equal a priori probabilities, the assumption statistical mechanics already makes and
      from which the second law already follows. Grant it, and the framework's arrow appears &mdash; but
      it is then the thermodynamic arrow wearing different words, and the framework has derived nothing
      that was not already there. Refuse it, and there is no arrow at all.
      <span class="spec">&#9670;</span></p>
    <p class="muted">What the framework may still say, and all it may say until it has more: that the
      asymmetry of the two infinities makes the <em>state space</em> the right shape for an arrow to live
      in, and that something else must choose the measure. That is a weaker claim than the one printed on
      the foundations page, and the foundations page has been marked accordingly rather than quietly
      left as it was.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-toy-next">What would change this result</h3>
    <ul>
      <li><strong>Derive the measure.</strong> If a uniform measure over states can be shown to follow
        from the structure rather than be assumed alongside it, Model B becomes an argument instead of a
        restatement. Nothing in the framework currently does this.</li>
      <li><strong>Find an arrow in a reversible model.</strong> Model A is the fair test and it came back
        empty. A variant with two infinities and no inserted measure that nevertheless distinguishes the
        two time directions would overturn everything in this section.</li>
      <li><strong>Show the measure is forced by the cardinalities.</strong> The most interesting
        possibility, and the hardest: that an uncountable set of states below and a countable set above
        make &ldquo;uniform over directions&rdquo; incoherent. The simulation cannot settle this, because
        it is finite. A proof could.</li>
    </ul>
    <p class="muted small">Experiment run {len(FWD)-1} steps, 20,000 points, seed fixed in the script so
      the numbers above reproduce exactly.</p>
  </div>
</section>

'''

MARK_START = "<!-- toy:start -->"
MARK_END = "<!-- toy:end -->"
BLOCK = f"{MARK_START}\n{SECTION}{MARK_END}\n\n"


def main() -> None:
    s = PAGE.read_text()
    if MARK_START in s:
        a = s.index(MARK_START)
        b = s.index(MARK_END) + len(MARK_END) + 2
        s = s[:a] + BLOCK + s[b:]
    else:
        anchor = '<section class="wrap narrow reveal">\n  <div class="frame">\n    <h3 id="t-proposed">'
        assert s.count(anchor) == 1
        s = s.replace(anchor, BLOCK + anchor, 1)
    PAGE.write_text(s)
    print("wrote the toy-integrator section")


if __name__ == "__main__":
    main()
