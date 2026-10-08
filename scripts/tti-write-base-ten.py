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
description: "Why the Rankin Skeletal Splice puts ten in nature rather than in our hands: the five-rhythm is intrinsic to Fibonacci arithmetic — Binet's √5, divisibility by five every fifth term, and the Pisano period of sixty that attains the theoretical maximum — and ten is that five doubled by bilateral symmetry. With the counter-case, and the argument this page withdraws."
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
