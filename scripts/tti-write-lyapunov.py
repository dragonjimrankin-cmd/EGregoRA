#!/usr/bin/env python3
"""Insert the computed-Lyapunov stress test into tti/src/stress-tests.njk.

Reads ops/tti-lyapunov.json and ops/tti-lyapunov-sweep.json (produced by
scripts/tti-lyapunov.py) and writes the section and its plate. Idempotent:
re-running replaces the existing section rather than duplicating it.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "tti" / "src" / "stress-tests.njk"
MAIN = json.loads((ROOT / "ops" / "tti-lyapunov.json").read_text())
SWEEP = json.loads((ROOT / "ops" / "tti-lyapunov-sweep.json").read_text())
UND = json.loads((ROOT / "ops" / "tti-lyapunov-undamped.json").read_text())
UND_MIN = min(l for _, l in UND)
UND_ONSET = min(a for a, l in UND if l > 0.02)
UND_TYP = sum(l for a, l in UND if l > 0.02) / len([1 for a, l in UND if l > 0.02])
UND_FLAT = [a for a, l in UND if l <= 0.02]

LAM = MAIN["chaotic"]["lambda"]
CTRL = MAIN["periodic"]["lambda"]
chaotic = [(a, l) for a, l in SWEEP if l > 0.005]
bands = []
for a, l in chaotic:
    if bands and abs(a - bands[-1][-1]) < 0.06:
        bands[-1].append(a)
    else:
        bands.append([a])
BANDS = [(b[0], b[-1]) for b in bands]
LMAX = max(l for _, l in SWEEP)
AMAX = [a for a, l in SWEEP if l == LMAX][0]
EFOLD = 1.0 / LAM
DRIVE_T = 2 * math.pi / (2 / 3)
HORIZON = math.log(1e10) / LAM

# ----------------------------------------------------------------- plate
W, H = 760, 420
L, R, T, B = 78, 726, 48, 330
amin, amax = 0.0, max(a for a, _ in SWEEP)
lmin, lmaxp = -0.28, 0.20


def X(a):
    return L + (a - amin) / (amax - amin) * (R - L)


def Y(l):
    return B - (l - lmin) / (lmaxp - lmin) * (B - T)


shade = "".join(
    f'          <rect x="{X(lo)-6:.1f}" y="{T}" width="{X(hi)-X(lo)+12:.1f}" '
    f'height="{B-T}" fill="#a07cf0" opacity="0.11"/>\n'
    for lo, hi in BANDS
)
pts = " L".join(f"{X(a):.1f} {Y(l):.1f}" for a, l in SWEEP)
undpts = " L".join(f"{X(a):.1f} {Y(l):.1f}" for a, l in UND)
unddots = "".join(
    f'          <circle cx="{X(a):.1f}" cy="{Y(l):.1f}" r="2.6" fill="#ef84b6" opacity="0.9"/>\n'
    for a, l in UND
)
dots = "".join(
    f'          <circle cx="{X(a):.1f}" cy="{Y(l):.1f}" r="3" '
    f'fill="{"#ffd979" if l > 0.005 else "#45d6b4"}"/>\n'
    for a, l in SWEEP
)
xt = "".join(
    f'          <text x="{X(a):.1f}" y="{B+20}">{a:.1f}</text>\n'
    for a in (0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6)
)
yt = "".join(
    f'          <text x="{L-12}" y="{Y(v)+4:.1f}">{v:+.2f}</text>\n'
    for v in (0.20, 0.10, 0.0, -0.10, -0.20)
)
grid = "".join(
    f'          <path d="M{L} {Y(v):.1f} H{R}" stroke="#76cfee" stroke-width="0.5" opacity="0.14"/>\n'
    for v in (0.20, 0.10, -0.10, -0.20)
)

PLATE = f'''  <figure id="fig-lyapunov" class="plate">
    <figcaption class="plate-cap"><span class="plate-num">Plate III</span> The Largest Lyapunov Exponent
      of the Driven Pendulum, Computed <span class="sci">&#9670;</span></figcaption>
    <div class="plate-art">
      <svg viewBox="0 0 {W} {H}" role="img" aria-label="A graph of the largest Lyapunov exponent against drive amplitude for the damped driven pendulum. The curve crosses zero into positive territory in two bands, shaded, separated by regions where the exponent is negative and the motion is periodic.">
{shade}{grid}
        <path d="M{L} {Y(0):.1f} H{R}" stroke="#ffd979" stroke-width="1" opacity="0.8"/>
        <path d="M{L} {T} V{B} M{L} {B} H{R}" stroke="#a9b6d8" stroke-width="0.8" opacity="0.5" fill="none"/>
        <path d="M{undpts}" fill="none" stroke="#ef84b6" stroke-width="1.5" opacity="0.8"/>
{unddots}        <path d="M{pts}" fill="none" stroke="#cdefff" stroke-width="1.5" opacity="0.85"/>
{dots}
        <g font-family="EB Garamond, serif" font-size="11.5" fill="#a9b6d8" text-anchor="middle">
{xt}        </g>
        <g font-family="EB Garamond, serif" font-size="11.5" fill="#a9b6d8" text-anchor="end">
{yt}        </g>
        <g font-family="Cinzel, serif" font-size="10" letter-spacing="2" fill="#a9b6d8">
          <text x="{(L+R)/2:.0f}" y="{B+44}" text-anchor="middle">DRIVE AMPLITUDE A</text>
          <text x="{L-54}" y="{(T+B)/2:.0f}" text-anchor="middle"
            transform="rotate(-90 {L-54} {(T+B)/2:.0f})">LYAPUNOV λ</text>
        </g>
        <g font-family="EB Garamond, serif" font-size="12.5" font-style="italic">
          <text x="{L+8}" y="{T+18}" fill="#ffd979">λ &gt; 0: chaotic &mdash; prediction decays exponentially</text>
          <text x="{L+8}" y="{T+36}" fill="#ef84b6">undamped: never negative, anywhere</text>
          <text x="{L+8}" y="{T+54}" fill="#cdefff">damped: dips below zero again and again</text>
          <text x="{L+8}" y="{B-12}" fill="#45d6b4">λ &lt; 0: periodic &mdash; the motion settles into a cycle</text>
        </g>
      </svg>
    </div>
    <p class="plate-note">Two sweeps. The pale curve is the damped pendulum; the rose curve is the same
      system with the damping removed. Each point is a separate integration of the driven damped pendulum at
      q&nbsp;=&nbsp;0.5 and &omega;&nbsp;=&nbsp;2/3, run for three thousand time units after a discarded
      transient, with the tangent vector renormalised every unit. Where a curve sits above the gold line
      the motion is genuinely chaotic. The damped curve dips below repeatedly &mdash; the same equation,
      perfectly periodic. The undamped curve never does, at any amplitude tested.
      <span class="sci">&#9670;</span></p>
  </figure>
'''

SECTION = f'''<div class="divider">&#10022;</div>

<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">&mdash; experiment three, run rather than proposed</p>
    <h2 id="t-lyapunov">The Lyapunov Exponent, Computed</h2>
    <p class="lede muted">This page demanded a number: chaos is a defined property with a measurable
      exponent, and the framework does not get to call its pendulum chaotic without computing one.
      Here it is, with its controls, and with the thing it found that nobody was looking for.</p>
  </div>

  <div class="wrap narrow">
    <div class="frame illuminated">
      <h3 id="t-lyap-method">Method</h3>
      <p>The system is the driven damped pendulum, which is what the thesis sentence invokes:</p>
      <p class="formula" style="text-align:center">θ&#776; + q&thinsp;θ&#775; + sin θ = A&thinsp;cos(ωt)</p>
      <p>The trajectory and its tangent-space equations are integrated together with fourth-order
        Runge&ndash;Kutta, the tangent vector renormalised at fixed intervals and the logarithms
        accumulated &mdash; the standard variational method. Transients are discarded. The code is in the
        repository as <code>scripts/tti-lyapunov.py</code> and the raw output in
        <code>ops/tti-lyapunov.json</code>, so anyone can check the arithmetic rather than take it on
        trust.</p>

      <h3 id="t-lyap-result">Result</h3>
      <p class="lede">At the standard parameters q = 0.5, A = 1.2, ω = 2/3, the largest Lyapunov exponent
        is <strong>λ = {LAM:+.4f}</strong> per unit time. Positive, and not marginally.
        <span class="sci">&#9670;</span></p>
      <p>Two controls say the number means what it should. With the drive weakened to A = 0.5, and again
        with the drive switched off entirely, the exponent comes out at exactly
        <strong>{CTRL:+.3f}</strong> &mdash; which is &minus;q/2, the value forced by the damping for any
        motion that settles. The method returns the right answer when the answer is known.
        <span class="sci">&#9670;</span></p>
      <p>So the word survives. The pendulum the framework invokes is chaotic in the technical sense:
        deterministic, governed by one line, and separating nearby states exponentially. The
        e-folding time is {EFOLD:.1f} time units, so ten orders of magnitude of initial precision buys
        about {HORIZON:.0f} time units of prediction &mdash; roughly {HORIZON/DRIVE_T:.0f} drive cycles,
        and then nothing. That is the quantitative content of &ldquo;exact in its law, incomputable in
        its future&rdquo;.</p>
    </div>
  </div>
</section>

<section class="wrap">
{PLATE}
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-lyap-windows">What the sweep found, which the framework did not want</h3>
    <p>Computing λ at one parameter set proves one parameter set. So the exponent was swept across drive
      amplitudes from {amin:.2f} to {amax:.2f} in steps of 0.025, and the result is the plate above.</p>
    <p class="lede"><strong>Chaos is not generic.</strong> It occupies two narrow bands &mdash; roughly
      A = {BANDS[0][0]:.2f} to {BANDS[0][1]:.2f}, and again near A = {BANDS[-1][0]:.2f} &mdash; with the
      exponent peaking at λ = {LMAX:+.4f} at A = {AMAX:.2f}. Between and beyond those bands the same
      equation is periodic, sometimes sharply so: at A = 1.30 and A = 1.35 the exponent returns to the
      fully contracted value of &minus;0.25. <span class="sci">&#9670;</span></p>
    <p>This is a new debt and it was created by the framework's own experiment, which is the point of
      running them. The thesis says the universe swings like an out-of-control pendulum. The computation
      says a driven pendulum is out of control only inside particular windows of its parameters, and is
      otherwise as regular as a metronome. <strong>So the framework now owes an account of why its
      parameters would sit inside a chaotic band rather than in one of the much wider periodic
      regions</strong> &mdash; and it does not have one. Saying the cosmos is chaotic because pendulums
      are chaotic is no longer available: most pendulums, most of the time, are not.</p>
    <p class="muted">The repair, if there is one, is that a cosmic system is undamped, and an undamped
      system cannot settle into the attracting cycles that produce the negative exponents here. That was
      written as plausible and uncomputed. It is computed in the next section.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h3 id="t-lyap-undamped">Experiment four &mdash; the undamped case, which the last section demanded</h3>
    <p>The repair offered above was that a cosmic system has no outside to lose energy to, so it cannot
      settle into the attracting cycles that produce the negative exponents &mdash; and that this was
      plausible but uncomputed. It has now been computed: the same sweep with the damping set to zero,
      amplitudes from 0 to {amax:.1f}.</p>
    <p class="lede">The result is unambiguous. <strong>The undamped exponent is never negative at any
      amplitude tested</strong> &mdash; the minimum over the whole sweep is
      {UND_MIN:+.5f}, which is zero to within the integration error. The periodic windows are
      <em>gone</em>. <span class="sci">&#9670;</span></p>
    <p>And this is not a numerical accident; it could not have come out otherwise. An undamped system
      preserves phase-space area, so by Liouville's theorem its exponents must sum to zero, which in two
      dimensions forces λ&#8321; = &minus;λ&#8322; and therefore λ&#8321; &ge; 0. <strong>A negative
      largest exponent is mathematically impossible without dissipation.</strong> The computation agrees
      with the theorem, which is the correct order of events. <span class="sci">&#9670;</span></p>
    <p>Above A &asymp; {UND_ONSET:.2f} the exponent sits around {UND_TYP:+.2f} across the entire range,
      with no windows and no returns to regularity &mdash; chaos is <em>generic</em> once the drive is
      strong enough. Below that the exponent is zero rather than negative: the motion is quasi-periodic,
      wandering on an intact torus, still never settling but perfectly predictable.</p>
    <p class="lede">So the debt the sweep created is paid, and the two halves of the thesis sentence come
      apart cleanly in the process. <strong>Cannot settle</strong> is now the stronger claim: it holds at
      every amplitude, and it holds by theorem rather than by computation.
      <strong>Out of control</strong> is the weaker one: it holds above a threshold and fails below it,
      where the motion is unending and entirely foreseeable.</p>
    <p class="muted">Stated against ourselves, because the repair should not be allowed to buy more than
      it paid for: all of this is a two-dimensional driven pendulum, and Liouville's theorem applies to
      the universe only if the universe is Hamiltonian, which is exactly the sort of thing a framework
      should not help itself to. What has been shown is that <em>the framework's own chosen system</em>
      behaves as the framework said it would once the dissipation is removed. That was in doubt an hour
      ago and it is not in doubt now.</p>
  </div>
</section>

'''

MARK_START = "<!-- lyapunov:start -->"
MARK_END = "<!-- lyapunov:end -->"
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
    print(f"wrote the Lyapunov section -- lambda={LAM:+.4f}, bands={BANDS}")


if __name__ == "__main__":
    main()
