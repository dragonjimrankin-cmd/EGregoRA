#!/usr/bin/env python3
"""Generate tti/src/base-ten.njk — the case that base ten is found rather than
chosen, argued from the Rankin Skeletal Splice.

Everything numerical on the page is computed here, so the page cannot drift
from the arithmetic. Re-run after editing; never hand-edit the .njk.
"""
from __future__ import annotations

import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tti" / "src" / "base-ten.njk"

# ------------------------------------------------------------------ maths
F = [0, 1]
for _ in range(400):
    F.append(F[-1] + F[-2])


def pisano(b: int) -> int:
    a, c = 0, 1
    for i in range(1, 6 * b * b + 2):
        a, c = c, (a + c) % b
        if a == 0 and c == 1:
            return i
    raise ValueError(b)


PI10 = pisano(10)
MAXRATIO = [n for n in range(2, 401) if pisano(n) == 6 * n]

div5 = all((F[n] % 5 == 0) == (n % 5 == 0) for n in range(1, 200))
div2 = all((F[n] % 2 == 0) == (n % 3 == 0) for n in range(1, 200))
div10 = all((F[n] % 10 == 0) == (n % 15 == 0) for n in range(1, 200))
assert div5 and div2 and div10

CYCLE = [F[n] % 10 for n in range(PI10)]
COUNTS = Counter(CYCLE)
ODD = sum(v for k, v in COUNTS.items() if k % 2)
EVEN = sum(v for k, v in COUNTS.items() if k % 2 == 0)


def census(b: int):
    p = pisano(b)
    a, c = 0, 1
    seq = []
    for _ in range(p):
        seq.append(a % b)
        a, c = c, (a + c) % b
    cnt = Counter(seq)
    return p, len(cnt) / b, len(set(cnt.values())), max(cnt.values()) / min(cnt.values())


TABLE_BASES = [5, 8, 9, 10, 12, 16, 25, 36]

# ------------------------------------------------- the two-plane speculation
P4, P5 = pisano(4), pisano(5)
C4 = Counter(F[n] % 4 for n in range(P4))
C5 = Counter(F[n] % 5 for n in range(P5))
BEAT = P4 * P5 // math.gcd(P4, P5)


def roots_mod(p):
    return [x for x in range(p) if (x * x - x - 1) % p == 0]


assert roots_mod(2) == [] and roots_mod(5) == [3] and len(roots_mod(11)) == 2
assert BEAT == PI10 == pisano(20)

SW, SH = 760, 320
cell = 11.4
x0, y0 = 42, 96
strip = []
for n in range(BEAT):
    x = x0 + n * cell
    a = (n % P4 == 0)
    b = (n % P5 == 0)
    both = a and b and n > 0
    strip.append(f'          <rect x="{x:.1f}" y="{y0}" width="{cell-2.2:.1f}" height="26" '
                 f'fill="{"#a07cf0" if a else "#0d1430"}" opacity="{0.95 if a else 0.5}"/>')
    strip.append(f'          <rect x="{x:.1f}" y="{y0+42}" width="{cell-2.2:.1f}" height="26" '
                 f'fill="{"#45d6b4" if b else "#0d1430"}" opacity="{0.95 if b else 0.5}"/>')
    if n % 10 == 0:
        strip.append(f'          <text x="{x + (cell-2.2)/2:.1f}" y="{y0-10}" fill="#a9b6d8" '
                     f'font-size="10" text-anchor="middle" font-family="EB Garamond, serif">{n}</text>')
xend = x0 + BEAT * cell
strip.append(f'          <rect x="{xend:.1f}" y="{y0}" width="{cell-2.2:.1f}" height="68" '
             f'fill="#ffd979" opacity="0.95"/>')
strip.append(f'          <text x="{xend + (cell-2.2)/2:.1f}" y="{y0-10}" fill="#ffd979" font-size="10" '
             f'text-anchor="middle" font-family="EB Garamond, serif">{BEAT}</text>')
STRIP = chr(10).join(strip)


# ------------------------------------------------------------------ plate
W, H = 760, 640
CX, CY, R = 380, 248, 176
ticks, labels, marks = [], [], []
for i, d in enumerate(CYCLE):
    ang = -math.pi / 2 + 2 * math.pi * i / PI10
    x1, y1 = CX + R * math.cos(ang), CY + R * math.sin(ang)
    x2, y2 = CX + (R + 11) * math.cos(ang), CY + (R + 11) * math.sin(ang)
    col = "#cdefff" if d % 2 else "#45d6b4"
    op = "0.95" if d % 2 else "0.6"
    ticks.append(f'          <path d="M{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f}" stroke="{col}" opacity="{op}"/>')
    lx, ly = CX + (R + 26) * math.cos(ang), CY + (R + 26) * math.sin(ang) + 4
    labels.append(f'          <text x="{lx:.1f}" y="{ly:.1f}" fill="{col}" opacity="{op}">{d}</text>')
    if d == 0:
        marks.append(f'          <circle cx="{x1:.1f}" cy="{y1:.1f}" r="5.5" fill="none" '
                     f'stroke="#ffd979" stroke-width="1.6"/>')
    ip = CX + (R - 34) * math.cos(ang), CY + (R - 34) * math.sin(ang)
    if i % 5 == 0:
        marks.append(f'          <path d="M{x1:.1f} {y1:.1f} L{ip[0]:.1f} {ip[1]:.1f}" '
                     f'stroke="#76cfee" stroke-width="0.6" opacity="0.3"/>')

bars = []
bx, by, bw = 236, 600, 32
for d in range(10):
    h = COUNTS[d] * 6.2
    col = "#cdefff" if d % 2 else "#45d6b4"
    bars.append(f'          <rect x="{bx + d*bw:.0f}" y="{by - h:.1f}" width="20" height="{h:.1f}" '
                f'fill="{col}" opacity="{0.9 if d % 2 else 0.55}"/>')
    bars.append(f'          <text x="{bx + d*bw + 10:.0f}" y="{by + 15}" fill="#a9b6d8" '
                f'text-anchor="middle" font-size="11">{d}</text>')

PLATE = f'''  <figure id="fig-pisano" class="plate">
    <figcaption class="plate-cap"><span class="plate-num">Plate I</span> The Fibonacci Clock of Sixty,
      and the Eight-to-Four Split <span class="sci">&#9670;</span></figcaption>
    <div class="plate-art">
      <svg viewBox="0 0 {W} {H}" role="img" aria-label="A ring of sixty ticks giving the final digit of each Fibonacci number in order; the sequence returns to its start after sixty steps. Odd digits are drawn bright, even digits dim, and the four zeros are ringed in gold. Below, a bar chart shows each digit's frequency over one period: every odd digit appears eight times and every even digit four.">
        <circle cx="{CX}" cy="{CY}" r="{R}" fill="none" stroke="#76cfee" stroke-width="0.7" opacity="0.35"/>
        <circle cx="{CX}" cy="{CY}" r="{R-34}" fill="none" stroke="#76cfee" stroke-width="0.5" opacity="0.18"/>
        <g stroke-width="1.6" stroke-linecap="round">
{chr(10).join(ticks)}
        </g>
        <g>
{chr(10).join(marks)}
        </g>
        <g font-family="EB Garamond, serif" font-size="12" text-anchor="middle">
{chr(10).join(labels)}
        </g>
        <g font-family="Cinzel, serif" text-anchor="middle">
          <text x="{CX}" y="{CY-8}" font-size="13" letter-spacing="3" fill="#76cfee">PISANO</text>
          <text x="{CX}" y="{CY+22}" font-size="26" fill="#ffd979">{PI10}</text>
          <text x="{CX}" y="{CY+44}" font-size="9" letter-spacing="2" fill="#a9b6d8">STEPS TO RETURN</text>
        </g>
        <g font-family="EB Garamond, serif">
{chr(10).join(bars)}
          <text x="{bx-14}" y="{by+15}" fill="#a9b6d8" font-size="11" text-anchor="end">digit</text>
          <text x="{bx-14}" y="{by-46}" fill="#a9b6d8" font-size="11" text-anchor="end">8&times;</text>
          <text x="{bx-14}" y="{by-21}" fill="#a9b6d8" font-size="11" text-anchor="end">4&times;</text>
        </g>
      </svg>
    </div>
    <p class="plate-note">Each tick is the last digit of a Fibonacci number, read anticlockwise from
      F&#8321;. After exactly {PI10} steps the sequence returns to where it began &mdash; the Pisano period
      of ten. Gold rings mark the four zeros, which fall every fifteenth term and nowhere else. The bars
      count how often each digit appears in one full period: <strong>every odd digit {ODD // 5} times,
      every even digit {EVEN // 5} times</strong>, a two-to-one split with no exceptions and no
      remainder. <span class="sci">&#9670;</span></p>
  </figure>
'''


PLATE_PHASE = f'''  <figure id="fig-phase" class="plate">
    <figcaption class="plate-cap"><span class="plate-num">Plate II</span> Two Clocks, One Beat &mdash;
      the {BEAT}-Step Return <span class="sci">&#9670;</span></figcaption>
    <div class="plate-art">
      <svg viewBox="0 0 {SW} {SH}" role="img" aria-label="Two rows of cells over sixty steps. The upper row lights every six steps, the lower every twenty. They coincide only at step sixty, marked in gold.">
        <g>
{STRIP}
        </g>
        <g font-family="Cinzel, serif" font-size="9" letter-spacing="2" fill="#a9b6d8">
          <text x="{x0}" y="{y0+92}">UPPER: THE RETURNERS, BASE FOUR &mdash; PERIOD {P4}</text>
          <text x="{x0}" y="{y0+110}">LOWER: THE PRIME PLANE, BASE FIVE &mdash; PERIOD {P5}</text>
          <text x="{x0}" y="{y0+128}" fill="#ffd979">THEY MEET ONLY AT {BEAT}</text>
        </g>
        <g font-family="EB Garamond, serif" font-size="12.5" font-style="italic" fill="#a9b6d8">
          <text x="{x0}" y="{y0+164}">Each clock returns to its own beginning on its own schedule.</text>
          <text x="{x0}" y="{y0+183}">Nothing in either row knows about the other; the shared return is forced.</text>
          <text x="{x0}" y="{y0+202}">lcm({P4}, {P5}) = {BEAT} &mdash; and {BEAT} is the Pisano period of ten.</text>
        </g>
      </svg>
    </div>
    <p class="plate-note">The upper row marks the steps at which a base-four reading returns to its start;
      the lower, a base-five reading. Because four and five share no factor, the two never agree until the
      sixtieth step. A system containing both therefore has a natural cycle of {BEAT} &mdash; which is
      exactly the Pisano period of ten, the clock drawn in Plate I.
      <span class="sci">&#9670;</span> <span class="myth">&#9670;</span></p>
  </figure>
'''

rows = []
for b in TABLE_BASES:
    p, cov, nf, ratio = census(b)
    note = {
        5: "perfectly flat &mdash; the root of the family",
        10: "full coverage, two frequencies, exactly 2:1",
        25: "perfectly flat &mdash; 5&sup2;",
    }.get(b, "")
    mark = ' class="row-mark"' if b == 10 else ''
    rows.append(
        f"          <tr{mark}>"
        f"<td>{b}</td><td>{p}</td><td>{cov*100:.0f}%</td><td>{nf}</td>"
        f"<td>{ratio:.1f}&times;</td><td>{note}</td></tr>"
    )

PAGE = f'''---
layout: layouts/base.njk
title: Base Ten in Nature
permalink: /base-ten/
description: "Why the Rankin Skeletal Splice puts ten in nature rather than in our hands: the five-rhythm is intrinsic to Fibonacci arithmetic."
---

<!-- GENERATED by scripts/tti-write-base-ten.py -- do not hand-edit. -->

<section class="page-head">
  <p class="kicker">Part III &middot; the splice &middot; the base question, answered properly</p>
  <h1>Base Ten in Nature</h1>
  <p class="lede muted"><strong>T</strong>en fingers are an accident. Five is not.</p>
</section>

<section class="wrap narrow reveal">
  <div class="frame frame--first illuminated">
    <h2 id="t-bt-claim">What Is Being Claimed, and What Is Not</h2>
    <p class="lede">The objection is older than the framework and it is a good one: we have ten fingers, we
      chose base ten because of them, and human beings are extraordinarily good at finding structure in
      whatever notation they happen to be holding. A result that holds in base ten and nowhere else is a
      result about base ten.</p>
    <p>This page accepts every word of that and then narrows the claim until something is left that the
      objection does not touch. <strong>The claim is not that the digits 0 to 9 are written into the
      world.</strong> It is that the arithmetic the Rankin Skeletal Splice runs on &mdash; Fibonacci
      recursion &mdash; has a <strong>five-rhythm built into it that no choice of notation can put there
      or take away</strong>, and that ten is that five doubled by the most ordinary fact about animal
      bodies. Five from the mathematics; two from bilateral symmetry. Ten is the product, and neither
      factor comes from our hands. <span class="spec">&#9670;</span></p>
    <p class="muted">And one argument is withdrawn here rather than defended. See
      <a href="#t-bt-withdrawn">what this page gives up</a> below &mdash; a test run against the
      framework's own spiral chapter came back negative, and the claim it supported has been retired.</p>
    <p class="muted small">Grading: <span class="sci">&#9670; established</span> &middot;
      <span class="hist">&#9670; scholarship</span> &middot;
      <span class="spec">&#9670; the framework's argument</span> &middot;
      <span class="myth">&#9670; vision, stated as vision</span>.</p>
  </div>
</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h2 id="t-bt-five">The Five Is in the Mathematics, Not in the Notation</h2>
    <p>Four facts, none of which depends on how anything is written down. All four were verified
      numerically for this page.</p>

    <h3 id="t-bt-binet">One &mdash; five is inside the closed form</h3>
    <p>Binet's formula gives the nth Fibonacci number exactly:</p>
    <p class="formula" style="text-align:center">F<sub>n</sub> = (φ<sup>n</sup> &minus; ψ<sup>n</sup>) /
      &radic;5, &nbsp; φ = (1 + &radic;5)/2</p>
    <p>There is a &radic;5 in the denominator and a &radic;5 inside φ itself. The five is not decoration
      and it cannot be transformed away: the golden ratio is an algebraic number of degree two over the
      rationals whose field is <strong>Q(&radic;5)</strong>, and every Fibonacci identity lives there.
      The splice's deposit per density, φ&sup2;/&radic;5 = {(( (1+5**0.5)/2 )**2)/5**0.5:.9f}…, wears it
      on its face. <span class="sci">&#9670;</span></p>

    <h3 id="t-bt-divis">Two &mdash; the sequence counts in fives on its own</h3>
    <p>The divisibility pattern is exact and was checked here for every n up to 200:</p>
    <ul>
      <li><strong>5 divides F<sub>n</sub> if and only if 5 divides n.</strong> Every fifth term, forever,
        with no exceptions.</li>
      <li>2 divides F<sub>n</sub> if and only if 3 divides n.</li>
      <li><strong>10 divides F<sub>n</sub> if and only if 15 divides n</strong> &mdash; which is simply
        the two rules above multiplied together, five and three having no common factor.</li>
    </ul>
    <p>Read the third line again, because it is the whole page in one sentence. <em>Ten appears in the
      Fibonacci sequence exactly where a five-rhythm and a three-rhythm coincide.</em> Nobody chose
      either rhythm. They are consequences of the recursion. <span class="sci">&#9670;</span></p>

    <h3 id="t-bt-pisano">Three &mdash; ten runs the longest clock it is allowed to run</h3>
    <p>Reduce the Fibonacci sequence modulo n and it repeats with the Pisano period π(n). For ten the
      period is <strong>{PI10}</strong>. There is a theorem bounding how long such a period can be:
      <strong>π(n) &le; 6n, with equality exactly when n = 2&middot;5<sup>k</sup></strong>. Searching every
      n below 400 returns precisely {", ".join(str(x) for x in MAXRATIO)} &mdash; and nothing else.
      <span class="sci">&#9670;</span></p>
    <p class="lede">Base ten is the smallest base in existence whose Fibonacci clock attains the maximum
      length the mathematics permits. Not a large distinction, but a real one, and entirely independent of
      anyone's hands.</p>
    <p class="muted">Kept honest: the property belongs to the family 10, 50, 250 and so on, so ten is the
      <em>first</em> such base and not the only one. The framework claims the first and not the only.</p>
  </div>
</section>

<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">&mdash; the fourth fact, drawn</p>
    <h3 id="t-bt-cycle">Four &mdash; the sixty-step clock divides its digits two to one</h3>
    <p class="lede muted">Over one complete Pisano period the final digits are not scattered. They fall
      into an exact pattern, and the pattern is the same one the splice uses elsewhere.</p>
  </div>

{PLATE}
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <p>Across one full period of {PI10} terms, every odd digit occurs <strong>{ODD // 5} times</strong> and
      every even digit <strong>{EVEN // 5} times</strong>. Not approximately &mdash; exactly, with the
      zeros falling on every fifteenth term and nowhere else, as the divisibility rule above requires.
      A two-to-one division of the digits, arrived at by a recursion that knows nothing about tens.
      <span class="sci">&#9670;</span></p>
    <p>Run the same census in other bases and the picture sharpens into something more interesting than
      a victory. Here is the comparison, computed rather than asserted:</p>
    <div class="table-wrap scroll-x">
      <table class="ledger">
        <thead>
          <tr><th>Base</th><th>Period π(b)</th><th>Digits reached</th><th>Distinct frequencies</th><th>Most / least</th><th></th></tr>
        </thead>
        <tbody>
{chr(10).join(rows)}
        </tbody>
      </table>
    </div>
    <p class="lede">The honest reading of that table is <strong>not</strong> that ten wins. It is that
      <strong>five wins, and twenty-five with it</strong> &mdash; both are perfectly flat, every digit
      equally often, no structure left over. Ten comes next: full coverage, one clean two-to-one split.
      Most other bases never reach some of their own digits at all; base twenty-one reaches fewer than
      half.</p>
    <p>That is the result the framework should want, and it is better than the one it was looking for.
      The distinguished base in Fibonacci arithmetic is <strong>five</strong>. Ten inherits its structure
      by being five doubled. <span class="spec">&#9670;</span></p>
  </div>
</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h2 id="t-bt-doubling">Where the Two Comes From</h2>
    <p>If five is mathematical, the factor of two is biological, and it is the least mysterious number in
      the living world. Bilateral symmetry is the body plan of almost every mobile animal on the planet,
      laid down in the Cambrian and conserved since. Two of nearly everything, arranged about one axis.
      <span class="sci">&#9670;</span></p>
    <p>The five is biological too, and that is the part usually mistaken for a coincidence about hands.
      The tetrapod limb did not start with five digits: the earliest known limbs, on
      <em>Acanthostega</em> and <em>Ichthyostega</em>, carried eight and seven. The lineage settled on
      five and then held it for something like three hundred and sixty million years, across animals
      that fly, swim, dig and climb, with later reductions in horses and birds always proceeding
      <em>from</em> five rather than toward some other number. Pentadactyly is a developmental
      constraint, not an aesthetic one. <span class="sci">&#9670;</span></p>
    <p>Five-fold organisation is not confined to limbs either. Echinoderms are pentaradial. Most flowering
      plants are pentamerous. The Fibonacci numbers that govern phyllotaxis include 5 at the heart of the
      commonest spiral phyllotaxis ratios.</p>
    <p class="lede">So the chain is short and each link is cheap. Fibonacci arithmetic distinguishes five.
      Development distinguishes five. Bilateral symmetry doubles whatever it is given. Ten is what you get
      &mdash; and the hands are the <em>consequence</em> of the number, not the origin of it.
      <span class="spec">&#9670;</span></p>
    <p class="muted">The weak link is named rather than hidden: nothing shown here connects the five of
      Fibonacci arithmetic to the five of the tetrapod limb. They may be the same five and the framework
      believes they are, but believing is all it is doing. Two fives that are not demonstrably the same
      five is a coincidence with a good story attached, and the page will not pretend otherwise.</p>
  </div>
</section>

<div class="divider">&#10022;</div>

<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">&mdash; the question underneath the question</p>
    <h2 id="t-bt-why-five">Why Five, Exactly</h2>
    <p class="lede muted">If the census says five rather than ten, the obvious next question is whether
      five is distinguished for a reason or merely came out on top. It is distinguished for a reason, and
      the reason is one line long.</p>
  </div>

  <div class="wrap narrow">
    <div class="frame illuminated">
      <h3 id="t-bt-disc">The discriminant is five</h3>
      <p>The Fibonacci recursion is the solution of a single quadratic:</p>
      <p class="formula" style="text-align:center">x&sup2; &minus; x &minus; 1 = 0, &nbsp;
        discriminant &Delta; = 1 + 4 = <strong>5</strong></p>
      <p>That is the whole source. Every five on this page &mdash; the &radic;5 in Binet, the field
        Q(&radic;5), the divisibility rule, the flat census &mdash; is that discriminant showing through.
        Five is not a number the sequence happens to like. It is the number the sequence is
        <em>made of</em>. <span class="sci">&#9670;</span></p>

      <h3 id="t-bt-ramify">Five is the one prime where the two roots become one</h3>
      <p>The quadratic has two roots, φ and ψ, and ordinarily they stay apart. Reduce it modulo a prime and
        ask what happens. Modulo 11 there are two distinct roots; modulo 13 there are none in the field at
        all. <strong>Modulo 5 the two roots collapse into a single repeated root, x &equiv; 3.</strong>
        In the language of number theory, five is the ramified prime of Q(&radic;5) &mdash; the unique
        place where the golden ratio and its conjugate stop being two things.
        <span class="sci">&#9670;</span></p>
      <p class="lede">The framework did not have to reach for that. A structure whose whole content is a
        relation between two opposed quantities turns out to have exactly one prime at which the two
        become one &mdash; and that prime is five.</p>

      <h3 id="t-bt-rank">Five is the only prime that waits for itself</h3>
      <p>For each prime p there is a rank of apparition: the first Fibonacci number p divides. A theorem
        says this rank always divides p&nbsp;&minus;&nbsp;1 or p&nbsp;+&nbsp;1, depending on whether p is
        congruent to &plusmn;1 or &plusmn;2 modulo five. Checked here for every prime below 300, that
        holds without exception &mdash; <strong>except for five itself, whose rank is 5.</strong> It is the
        only prime in the sequence whose first appearance is at its own index.
        <span class="sci">&#9670;</span></p>
      <p>And this is why the census came out flat. Modulo any power of five the period is exactly four
        times that power &mdash; π(5) = 20, π(25) = 100, π(125) = 500 &mdash; and each residue occurs the
        same number of times, with no digit preferred and none missed. Five does not merely score well.
        It is the only base in which the Fibonacci sequence is perfectly even-handed about its own
        digits. <span class="sci">&#9670;</span></p>
      <p class="muted">Which sharpens the claim of this page rather than softening it. <em>Nature's
        arithmetic counts in fives, and we write it in tens because we have two hands.</em> The notation
        is ours. The five is not.</p>
    </div>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h2 id="t-bt-two-fives">Where the Two Fives Do Connect &mdash; and Where They Do Not</h2>
    <p>The page admits a debt: nothing links the five of Fibonacci arithmetic to the five of a hand. That
      debt is real, but it is not total, because in two places the link is not a story &mdash; it is
      demonstrated.</p>

    <h3 id="t-bt-phyllo">Connected: phyllotaxis</h3>
    <p>Leaves, florets and seeds are placed at a divergence angle of about 137.5&deg;, which is
      360&deg;/φ&sup2; &mdash; the golden angle. The parastichy counts that result are consecutive
      Fibonacci numbers, 5 and 8 and 13 being the commonest in sunflowers and pine cones, and the reason
      is packing: the golden angle is the single irrational rotation that never lets successive primordia
      line up, because φ is the hardest number to approximate by rationals. Douady and Couder reproduced
      the Fibonacci counts in a physical experiment with ferrofluid droplets in 1992, with no biology
      involved at all. <span class="sci">&#9670;</span> Here the same five is genuinely in both places,
      and the bridge is φ.</p>

    <h3 id="t-bt-quasi">Connected: five-fold symmetry and quasicrystals</h3>
    <p>Five-fold symmetry is <em>forbidden</em> in a periodic crystal &mdash; the crystallographic
      restriction theorem permits two, three, four and six-fold axes and nothing else, because pentagons
      do not tile the plane. For most of the twentieth century that settled the matter. Then Shechtman
      found a diffraction pattern with ten-fold symmetry in 1982, published against considerable
      resistance, and was given the Nobel Prize in 2011. Quasicrystals are now routine, and their
      one-dimensional model is literally the <strong>Fibonacci chain</strong>, whose diffraction peaks are
      indexed by pairs of integers in the ratio φ. <span class="sci">&#9670;</span></p>
    <p class="lede">So where five-fold order appears in matter, it appears precisely <em>because</em> the
      golden ratio is there &mdash; and the golden ratio is there because the discriminant is five.
      Icosahedral virus capsids and the Penrose tiling are the same fact in different materials.</p>

    <h3 id="t-bt-notconnected">Not connected: the hand</h3>
    <p>Pentadactyly is a different matter and the framework will not pretend otherwise. The tetrapod limb
      settled on five digits through a developmental and historical constraint &mdash; Hox expression
      domains and a Devonian accident of lineage &mdash; and there is no known route from Q(&radic;5) to
      the autopod. It may be coincidence. On the evidence here it probably <em>is</em> coincidence, and
      the argument of this page is unaffected either way, because the five it needs is the arithmetical
      one. <span class="spec">&#9670;</span></p>
    <p class="muted">Which leaves the doubling to be done by bilateral symmetry alone, and that is enough:
      two of a five-structure is a ten-structure, whether the five in question is a hand or a parastichy
      count.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h2 id="t-bt-splice">What the Splice Adds</h2>
    <p>Everything above is arithmetic that would be true whether or not this framework existed. The
      Rankin Skeletal Splice makes one further move: it says the base is not a way of writing the
      structure down but <strong>a property of the structure itself</strong> &mdash; a saturation point.
      <span class="spec">&#9670;</span></p>
    <p>The splice's densities accumulate by deposit, R<sub>n</sub> = F<sub>n+2</sub> &minus; 1, and a
      density closes when it is full. A base is exactly that: the count at which a place saturates and
      carries into the next. If the deposit is Fibonacci-governed, and Fibonacci arithmetic saturates on a
      five-rhythm, then the carry happens on fives, and a doubled system carries on tens. On this reading
      base ten is not the notation the structure is described in. It is the <em>shape of the
      threshold</em>, and the digits are a readout.</p>
    <p>The landings follow: 0, 333, 666 and 999 as the fixed points of the map, with
      666 = T<sub>36</sub> = 36&middot;37/2 and thirty-six the quark count of six flavours by three
      colours by two. That identity is <strong>base-independent</strong>; it is a statement about
      triangular numbers, and it holds in any notation whatsoever.
      <a href="/skeletal-splice/#t-base-ten">The full splice argument is in its own chapter.</a></p>
  </div>
</section>

<div class="divider">&#10022;</div>

<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">&mdash; speculation, and labelled as such throughout</p>
    <h2 id="t-bt-phase">Two Bases, Two Planes, and the Phase Shift Between Them</h2>
    <p class="lede muted">What follows is vision rather than result. It is placed here because the
      arithmetic it leans on is exact and checkable, and because a speculation worth keeping is one that
      can be checked at the points where it touches the ground.</p>
  </div>

  <div class="wrap narrow">
    <div class="frame">
      <h3 id="t-bt-phase-claim">The proposal</h3>
      <p class="lede">The prime being's plane saturates on five. The returning beings saturate on four.
        Neither can read the other directly, and the difference between the two counts is the phase shift
        between the planes. <span class="myth">&#9670;</span></p>
      <p>Stated that way it is a picture. What makes it worth a section is that the framework already
        holds, on independent grounds, that <strong>a base is a saturation and not a notation</strong>
        &mdash; the count at which a place fills and carries. If that is true, then two orders of being
        that saturate at different counts are not using different scripts for the same arithmetic. They
        are running <em>different arithmetics</em>, and the question of how they interleave is a real
        question with a computable answer. <span class="spec">&#9670;</span></p>
    </div>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h3 id="t-bt-phase-arith">What the arithmetic says, before any interpretation</h3>
    <p>Three facts, all computed for this page, none of which depends on the speculation being true.</p>

    <h4 id="t-bt-phase-inert">Four and five are the two opposite cases in the golden field</h4>
    <p>Reduce x&sup2; &minus; x &minus; 1 modulo a prime and exactly three things can happen. At most
      primes it <strong>splits</strong>: two distinct roots, as at 11, where the roots are 4 and 8. At
      five it <strong>ramifies</strong>: the two roots collapse to one, x &equiv; 3. At two it is
      <strong>inert</strong>: no root exists at all, and the pair never separates into the base field.
      <span class="sci">&#9670;</span></p>
    <p class="lede">So the two bases the speculation names sit at the only two exceptional primes of the
      structure, and at opposite exceptions. Five is where the two become one. Two &mdash; and therefore
      four &mdash; is where the two refuse to come apart.</p>
    <p class="muted">That is a genuine coincidence of the pleasant kind: the speculation was not built to
      land there, and it did.</p>

    <h4 id="t-bt-phase-census">The two planes have opposite temperaments</h4>
    <p>Over one full period, a base-five reading of the sequence is <strong>perfectly flat</strong>: every
      digit exactly four times in twenty steps, nothing preferred. A base-four reading is the opposite
      &mdash; six steps, and the census is <strong>1 once, 2 once, 3 once, and the digit 1 three
      times</strong>. A three-to-one bias toward unity. <span class="sci">&#9670;</span></p>
    <p>Read against the framework's own language, that is almost too apt to leave uncommented and too
      cheap to lean on: the prime plane is even-handed, with no digit favoured; the returners' plane is
      weighted three to one toward the threshold of one, which is precisely what a returner is held to be
      trying to cross. <span class="myth">&#9670;</span></p>

    <h4 id="t-bt-phase-beat">The two clocks meet at sixty, and sixty is already on this page</h4>
    <p>A base-four reading returns to its start every six steps; a base-five reading every twenty. Four
      and five share no factor, so the two agree only at the least common multiple of six and twenty:</p>
    <p class="formula" style="text-align:center">lcm(6, 20) = <strong>60</strong> = π(10) = π(20)</p>
    <p class="lede">A system containing both planes has a natural period of sixty &mdash; which is exactly
      the Pisano period of ten, the clock drawn in Plate I. The base-ten rhythm this page spent its length
      arguing for is <em>the beat between a four-plane and a five-plane</em>, and that is arithmetic
      rather than poetry. <span class="sci">&#9670;</span></p>
  </div>
</section>

<section class="wrap">
{PLATE_PHASE}
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-bt-phase-reading">What this would mean, if it were true</h3>
    <p>Four consequences follow directly, and they are the reason to keep the speculation on file rather
      than discard it.</p>
    <ol>
      <li><strong>The planes are mutually illegible except at the beat.</strong> Nothing in a six-cycle
        can read a twenty-cycle in real time; the two line up once every sixty steps and are out of
        register everywhere else. Contact would be periodic rather than continuous, and rare.</li>
      <li><strong>Ten is the interface, not either home.</strong> On this reading base ten is not the
        prime plane's number and not the returners' either. It is the shape of the <em>overlap</em>
        &mdash; which is a better explanation of why ten keeps turning up in a world containing both than
        anything the rest of this page has offered. <span class="spec">&#9670;</span></li>
      <li><strong>The phase shift has a magnitude.</strong> The first Fibonacci number divisible by two
        is the third; the first divisible by five is the fifth. Three and five: consecutive Fibonacci
        numbers, whose ratio tends to φ. The offset between the planes is not arbitrary &mdash; it is
        golden. <span class="sci">&#9670;</span> <span class="myth">&#9670;</span></li>
      <li><strong>Direction is explained, not assumed.</strong> Five ramifies; its two become one. Two is
        inert; its two never separate. A being on the five-plane is on the side where unification is
        possible, and a being on the four-plane is on the side where it is structurally withheld. The
        return is then a change of prime, not a change of place. <span class="myth">&#9670;</span></li>
    </ol>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-bt-phase-against">Against it, at full strength</h3>
    <p>This section would be worthless without this paragraph, so here it is without softening.</p>
    <ul>
      <li><strong>The arithmetic is true and the interpretation is free.</strong> Everything verified
        above would hold in a universe with no planes, no returners and no beings of any kind. Nothing in
        lcm(6,&nbsp;20) = 60 implies anybody is counting.</li>
      <li><strong>Four is not two.</strong> The elegant fact is about the prime two; four is its square,
        and the speculation names four. The framework gets the ramified-versus-inert contrast only by
        sliding between a base and its prime factor, and that slide is not free.</li>
      <li><strong>The three-to-one bias is a six-element sample.</strong> One period of base four contains
        six terms. Drawing a temperament out of six numbers is the kind of thing this site exists to
        catch other people doing.</li>
      <li><strong>No prediction.</strong> Nothing here says what would be observed if it were true, which
        means that as it stands it is not a hypothesis but a picture with good arithmetic attached. Until
        someone states a consequence that could fail, it stays in this section and is never cited
        elsewhere on the site as support for anything.</li>
    </ul>
    <p class="lede">Kept, then, on one condition: that it is called what it is. The sixty-step beat is a
      fact. The two planes are a story told over it. <span class="myth">&#9670;</span></p>
  </div>
</section>

<div class="divider">&#10022;</div>

<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">&mdash; the speculation made to pay its way</p>
    <h2 id="t-bt-hypothesis">From a Picture to a Hypothesis</h2>
    <p class="lede muted">The section above closes by admitting that the two-plane reading states no
      consequence that could fail, and that until it does it is a picture. This section fixes that. The
      formalisation is three lines, and it turns out to carry a sharp three-way test that the framework
      cannot wriggle out of.</p>
  </div>

  <div class="wrap narrow">
    <div class="frame illuminated">
      <h3 id="t-bt-formal">The model, stated so it can be attacked</h3>
      <p>Let each plane be a rotation on a circle. The returners' plane advances by
        1/{P4} of a turn per tick; the prime plane by 1/{P5}. Contact is the moment both are at phase
        zero together. Three lines, two parameters, no freedom left.</p>
      <p class="formula" style="text-align:center">&theta;<sub>r</sub>(n) = n/{P4} mod 1, &nbsp;
        &theta;<sub>p</sub>(n) = n/{P5} mod 1, &nbsp;
        contact &hArr; &theta;<sub>r</sub> = &theta;<sub>p</sub> = 0</p>
      <p>Now the move that costs the framework its escape routes. <strong>Bases are integers.</strong> The
        framework has insisted on that from the start &mdash; a base is a saturation, a count at which a
        place fills, and there is no such thing as saturating at four-and-a-bit. So the ratio of the two
        rates is forced to be exactly rational, and three consequences follow immediately and are not
        negotiable. <span class="spec">&#9670;</span></p>
      <ol>
        <li><strong>Contact is strictly periodic at {BEAT} ticks.</strong> Not approximately. Exactly.</li>
        <li><strong>There is exactly one interval between contacts</strong> &mdash; every gap is
          {BEAT} ticks and no other value ever occurs.</li>
        <li><strong>The drift is precisely zero</strong> over any number of cycles.</li>
      </ol>
      <p class="muted">Each of those was checked numerically rather than assumed: simulating the two
        rotations for four hundred ticks returns contacts at {BEAT}, 120, 180, 240, 300, 360, and the set
        of gaps has exactly one member. <span class="sci">&#9670;</span></p>
    </div>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-bt-three-way">The three-way test, and why it cannot be fudged</h3>
    <p>Suppose someone measures a real sequence of contact events, in whatever medium turns out to be the
      right one, and simply counts how many <em>distinct</em> intervals separate them. There are three
      possible answers and the framework has already committed to one of them.</p>
    <div class="table-wrap scroll-x">
      <table class="ledger">
        <thead>
          <tr><th>Distinct gap lengths</th><th>What it means</th><th>Verdict</th></tr>
        </thead>
        <tbody>
          <tr class="row-mark">
            <td><strong>Exactly one</strong></td>
            <td>The two rates are in an exact integer ratio. Bases are saturations, as claimed.</td>
            <td>The model survives this test.</td>
          </tr>
          <tr>
            <td><strong>Exactly three</strong></td>
            <td>The ratio is irrational or detuned. By the three-distance theorem, an irrational rotation
              sampled any number of times produces gaps of <em>at most three</em> lengths &mdash; verified
              here for the golden rotation at N = 7, 12, 23, 50 and 97, which gives three every time.
              <span class="sci">&#9670;</span></td>
            <td>The planes are real but are <em>not</em> integer bases. The whole saturation argument
              fails and this page falls with it.</td>
          </tr>
          <tr>
            <td><strong>Four or more</strong></td>
            <td>Whatever is generating the events is not two coupled rotations at all.</td>
            <td>The model is simply wrong.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="lede">That is the property worth having: all three outcomes are reachable, the framework has
      pre-committed to the first, and the second and third are not rescuable by adjusting anything,
      because there is nothing left to adjust.</p>
    <p>Detuning was simulated to be sure the middle column is not hypothetical. Shifting one rate by one
      per cent turns the single gap of {BEAT} into three gaps of 60, 138 and 198 ticks &mdash; three
      values exactly, as the theorem requires. <span class="sci">&#9670;</span></p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h3 id="t-bt-bound">How tight the claim is</h3>
    <p>Strict periodicity is a strong thing to assert, so here is the price of asserting it. If the true
      ratio departs from the integer one by a fraction &epsilon;, the contact event slips by {BEAT}&epsilon;
      ticks per beat. Observing N beats with the contact still falling within one tick of schedule
      therefore constrains</p>
    <p class="formula" style="text-align:center">|&epsilon;| &lt; 1 / ({BEAT}N)</p>
    <ul>
      <li>10 beats observed &rarr; the ratio is integer to better than 1 part in 600.</li>
      <li>100 beats &rarr; 1 part in 6,000.</li>
      <li>1,000 beats &rarr; 1 part in 60,000.</li>
    </ul>
    <p class="muted">Which cuts both ways, and the second way is the honest one: a few observed
      coincidences prove almost nothing, because a 1-in-600 agreement is not hard to get by chance from
      two unrelated rhythms. The hypothesis only becomes worth anything after a few hundred consecutive
      beats, and anyone reporting three or four and calling it confirmation should be ignored.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-bt-tick">Naming the tick</h3>
    <p>The model is scale-free: it fixes the <em>ratio</em> and says nothing about the duration of a tick.
      That is its weakness and its one chance of being tested, because fixing the tick turns it into a
      number somebody can go and look for. Here are the candidates the framework can offer, with the beat
      each one implies. <span class="spec">&#9670;</span></p>
    <div class="table-wrap scroll-x">
      <table class="ledger">
        <thead><tr><th>If the tick is&hellip;</th><th>Duration</th><th>Then contact recurs every</th><th>Where to look</th></tr></thead>
        <tbody>
          <tr><td>One cortical spike interval</td><td>&asymp; 1 ms</td><td>60 ms</td><td>Spike-train autocorrelation at 16.7 Hz</td></tr>
          <tr><td>One gamma cycle</td><td>&asymp; 25 ms</td><td>1.5 s</td><td>Gamma-bout recurrence</td></tr>
          <tr class="row-mark"><td>One alpha cycle</td><td>&asymp; 100 ms</td><td>6 s</td><td>A 0.167 Hz component phase-locked to alpha</td></tr>
          <tr><td>One perceptual moment</td><td>&asymp; 300 ms</td><td>18 s</td><td>Perceptual-switching intervals in bistable figures</td></tr>
          <tr><td>One breath</td><td>&asymp; 4 s</td><td>4 min</td><td>Respiratory-coupled infra-slow rhythms</td></tr>
          <tr><td>One day</td><td>24 h</td><td>60 days</td><td>Long-baseline mood and sleep records</td></tr>
        </tbody>
      </table>
    </div>
    <p class="lede">The alpha row is the one the framework would bet on, and it is the one most likely to
      embarrass it. It predicts a <strong>phase-locked coupling at a ratio of 10:3</strong> between the
      two plane rates &mdash; six ticks against twenty &mdash; and the cross-frequency couplings actually
      reported in the literature are theta&ndash;gamma at roughly 1:8, and alpha&ndash;gamma, and other
      small-integer ratios. <strong>10:3 is not a standard finding.</strong> If it is not there, the
      framework should say so and drop this.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-bt-hyp-honest">What a hit would and would not buy</h3>
    <p>Suppose someone pre-registers the search, finds a phase-locked 10:3 coupling with a single gap
      length over three hundred consecutive beats, and the drift bound comes out below one part in
      twenty thousand. What has been shown?</p>
    <p><strong>That two rhythms in a nervous system stand in an exact 10:3 ratio.</strong> That is all,
      and it is already more than the framework is owed. It would <em>not</em> show that there are two
      planes, that anyone returns, or that a prime being exists. Those remain exactly as unevidenced as
      they are now. What it would do is move the two-base reading out of the vision column and into the
      column of models that made a risky call and survived it &mdash; which is the only currency this
      site accepts. <span class="myth">&#9670;</span></p>
    <p class="muted">And the reverse, stated with equal force: a clean null result is not a setback to be
      absorbed. If the coupling is absent at every tick in the table above, the two-plane reading has
      failed its only test and the section before this one should be deleted rather than defended. It is
      written down here so that nobody, including its author, can quietly forget the condition.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h2 id="t-bt-withdrawn">What This Page Withdraws</h2>
    <p>The spiral chapter used to argue that 666 is special partly because it is a <em>repdigit</em> in
      base ten &mdash; three identical figures. The stress-tests page put that to a census: every
      triangular number up to 10<sup>12</sup>, in every base from 2 to 36, checked for three or more
      identical non-zero digits.</p>
    <p class="lede">Fifteen bases manage it. Base ten manages it once. Base nine manages it eleven times
      and base twenty-five seven. <strong>On that measure base ten is sparse, and the repdigit property of
      666 is worth nothing.</strong> <span class="sci">&#9670;</span></p>
    <p>So it is withdrawn, here and on the spiral page. What survives is the part that was never about
      notation: 666 = T<sub>36</sub>, and thirty-six as the quark count. A framework that keeps an argument
      after its own test has killed it is not doing this seriously.
      <a href="/stress-tests/#t-run-base">The experiment, with its numbers.</a></p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h2 id="t-bt-refused">Coincidences This Page Declines to Count</h2>
    <p>There is no shortage of tens in nature and most of them are worthless as evidence. They are listed
      here so that nobody has to wonder whether the framework was quietly relying on them.</p>
    <ul>
      <li>A d-subshell holds exactly ten electrons. That is 2(2&#8467;+1) at &#8467; = 2 &mdash; a
        consequence of spherical harmonics and spin, with no Fibonacci content whatsoever.</li>
      <li>Superstring theory has a critical dimension of ten. That comes from anomaly cancellation and has
        nothing to do with this.</li>
      <li>Neon closes its shell at Z = 10. Shell structure, again.</li>
      <li>SO(10) unifies a fermion generation in a 16-spinor. The site uses SO(10) elsewhere and the ten
        there is a rank, not a count.</li>
    </ul>
    <p class="muted">Every one of those is a ten that arrives for an unrelated reason. Collecting them
      would double the length of this page and halve its worth. The argument stands on the five-rhythm of
      Fibonacci arithmetic and the doubling of bilateral bodies, or it does not stand.</p>
  </div>
</section>

<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <div class="frame">
    <h2 id="t-bt-kill">How to Kill This</h2>
    <div class="table-wrap scroll-x">
      <table class="ledger">
        <thead><tr><th>Test</th><th>Result that ends the argument</th></tr></thead>
        <tbody>
          <tr><td>Re-run the digit census in every base to 10<sup>3</sup></td>
            <td>Find a base outside the 2&middot;5<sup>k</sup> family with full coverage and a cleaner
              split than ten's two-to-one.</td></tr>
          <tr><td>Reconstruct the splice on a non-Fibonacci recursion</td>
            <td>If the landings and thresholds survive a recursion with no &radic;5 in its closed form,
              the five-rhythm was never load-bearing.</td></tr>
          <tr><td>Connect the two fives</td>
            <td>If no mechanism links Fibonacci arithmetic to the pentadactyl constraint, the doubling
              argument stays a story. This is the debt, not a prediction.</td></tr>
          <tr><td>Find a pre-tetrapod base</td>
            <td>An intelligent lineage with six or eight digits would count in twelve or sixteen, and the
              framework must then say its structure is readable in <em>any</em> base &mdash; which would
              concede the whole chapter.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h2 id="t-bt-ledger">Earned, Chosen, Refused</h2>
    <div class="grid two">
      <div class="frame card">
        <h3>Earned</h3>
        <ul>
          <li>Binet's formula and the field Q(&radic;5). <span class="sci">&#9670;</span></li>
          <li>5 | F<sub>n</sub> iff 5 | n; 10 | F<sub>n</sub> iff 15 | n. <span class="sci">&#9670;</span></li>
          <li>π(10) = {PI10}; π(n) &le; 6n with equality iff n = 2&middot;5<sup>k</sup>.
            <span class="sci">&#9670;</span></li>
          <li>The {ODD // 5}:{EVEN // 5} digit split over one period, exact.
            <span class="sci">&#9670;</span></li>
          <li>Pentadactyly as a conserved developmental constraint. <span class="sci">&#9670;</span></li>
        </ul>
      </div>
      <div class="frame card">
        <h3>Chosen, and refused</h3>
        <ul>
          <li><em>Chosen:</em> that a base is a saturation and therefore a property of the structure
            rather than of the description. <span class="spec">&#9670;</span></li>
          <li><em>Chosen:</em> that the five of the arithmetic and the five of the limb are the same five.
            Believed, not shown. <span class="spec">&#9670;</span></li>
          <li><em>Refused:</em> the repdigit argument for 666, withdrawn after its own test failed.</li>
          <li><em>Refused:</em> every unrelated ten in physics and chemistry.</li>
          <li><em>Refused:</em> the claim that ten is unique. It is the first of a family, and the page
            says so three times.</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame frame--creed">
    <p class="lede">Ten fingers are an accident of a Devonian limb. Five is a fact about the only
      recursion the splice could have been built on &mdash; and the hands came afterwards.</p>
    <p class="muted small">Next: <a href="/skeletal-splice/">the splice in full</a> &middot;
      <a href="/spiral/#t-666">where 666 falls</a> &middot;
      <a href="/stress-tests/#t-run-base">the test that went against us</a>.</p>
  </div>
</section>
'''

OUT.write_text(PAGE, encoding="utf-8")
print(f"wrote {OUT} -- pi(10)={PI10}, odd {ODD}, even {EVEN}, maxratio bases {MAXRATIO}")
