#!/usr/bin/env python3
"""Generate tti/src/megatubule.njk — The Cosmic Megatubule.
Generated artefact: edit this script, not the page it writes."""
import math

phi = (1 + 5 ** 0.5) / 2

# ---------------------------------------------------------------- Plate I ---
# A toroidal band carrying one half-twist. The band's edge is a single closed
# curve that only shuts after two circuits, which is the Möbius fact drawn.
L = []; A = L.append
A('      <svg viewBox="0 0 760 460" role="img" aria-label="A torus drawn as a ribbon running round a ring, with one half twist in it, so that the ribbon has a single edge that only closes after two circuits. At the left of the ring the ribbon narrows into a throat marked the Cold Spot, where converging arrows show density rising. Beyond the throat a small fresh spiral is beginning, labelled the next octave.">')
A('        <rect x="0" y="0" width="760" height="460" fill="#070b1a"/>')

CX, CY, R, W, YS = 430.0, 230.0, 168.0, 36.0, 0.52

def pinch(th):
    """The tube narrows to a throat on the left-hand side of the ring."""
    d = abs(((th - math.pi) + math.pi) % (2 * math.pi) - math.pi)
    return 0.07 + 0.93 * (1 - math.exp(-(d * d) / 0.30))

def band(th, s):
    """s in [-1, 1] runs across the ribbon; th runs round the ring.
       The half-twist is phi = th/2, so the rim closes only after 4 pi."""
    ph = th / 2
    w = W * pinch(th) * s
    r = R + w * math.cos(ph)
    z = w * math.sin(ph)
    x = CX + r * math.cos(th)
    y = CY + (r * math.sin(th)) * YS - z * 0.8
    return round(x, 2), round(y, 2)

# the rim: one curve, two circuits
edge = [band(4 * math.pi * i / 1400, 1.0) for i in range(1401)]
A('        <polyline fill="none" stroke="#76cfee" stroke-width="2" opacity="0.95" points="'
  + " ".join(f"{x},{y}" for x, y in edge) + '"/>')

# the tube itself: cross-sections whose orientation turns by half a turn
# over one circuit, which is the twist made visible
for i in range(0, 40):
    th = 2 * math.pi * i / 40
    pw = W * pinch(th)
    cx = CX + R * math.cos(th)
    cy = CY + R * math.sin(th) * YS
    rot = math.degrees(th / 2)
    op = 0.22 + 0.5 * (0.5 + 0.5 * math.sin(th - math.pi / 2))
    A(f'        <ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{pw:.1f}" ry="{pw * 0.34:.1f}" '
      f'transform="rotate({rot:.1f} {cx:.1f} {cy:.1f})" fill="none" stroke="#45d6b4" '
      f'stroke-width="0.8" opacity="{op:.2f}"/>')

# guide ring of the torus axis
ring = [(round(CX + R * math.cos(2 * math.pi * i / 240), 2),
         round(CY + R * math.sin(2 * math.pi * i / 240) * YS, 2)) for i in range(241)]
A('        <polyline fill="none" stroke="#24627f" stroke-width="0.7" stroke-dasharray="3 6" opacity="0.7" points="'
  + " ".join(f"{x},{y}" for x, y in ring) + '"/>')

# the throat: the ring's left-hand side pinched to a point
TX, TY = CX - R, CY
A(f'        <circle cx="{TX}" cy="{TY}" r="9" fill="#cdefff"/>')
A(f'        <circle cx="{TX}" cy="{TY}" r="19" fill="none" stroke="#cdefff" stroke-width="1" stroke-dasharray="3 4" opacity="0.85"/>')
for k in range(8):
    a = 2 * math.pi * k / 8
    x1 = TX + 56 * math.cos(a); y1 = TY + 56 * math.sin(a) * 0.8
    x2 = TX + 24 * math.cos(a); y2 = TY + 24 * math.sin(a) * 0.8
    A(f'        <line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#ffd979" stroke-width="1.2" opacity="0.75" marker-end="url(#mt-in)"/>')
A('        <defs><marker id="mt-in" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.6" markerHeight="4.6" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="#ffd979"/></marker></defs>')
A(f'        <text x="{TX}" y="{TY - 100}" font-family="EB Garamond, serif" font-size="13" fill="#cdefff" text-anchor="middle">the Cold Spot &#8212; the throat</text>')
A(f'        <text x="{TX}" y="{TY + 108}" font-family="EB Garamond, serif" font-size="12" fill="#ffd979" text-anchor="middle">density greatest here</text>')

# through the throat: a fresh octave beginning on the other side
sp = []
for i in range(0, 300):
    t = i / 299
    ang = -math.pi / 2 + 6.0 * math.pi * t
    rad = 4 + 56 * t * t
    sp.append((round(96 - rad * math.cos(ang) * 0.75, 2), round(CY + rad * math.sin(ang) * 0.75, 2)))
A('        <polyline fill="none" stroke="#a07cf0" stroke-width="2" opacity="0.9" points="'
  + " ".join(f"{x},{y}" for x, y in sp) + '"/>')
A('        <circle cx="96" cy="230" r="4" fill="#a07cf0"/>')
A('        <text x="96" y="150" font-family="EB Garamond, serif" font-size="13" fill="#a07cf0" text-anchor="middle">the next octave,</text>')
A('        <text x="96" y="166" font-family="EB Garamond, serif" font-size="13" fill="#a07cf0" text-anchor="middle">freshly begun</text>')
A(f'        <path d="M{TX - 26} {TY} L138 {TY}" stroke="#a07cf0" stroke-width="1.2" stroke-dasharray="4 5" opacity="0.8"/>')
A(f'        <text x="{(TX - 26 + 138) / 2:.0f}" y="{TY - 10}" font-family="EB Garamond, serif" font-size="11" fill="#a07cf0" text-anchor="middle">residue</text>')

A('        <text x="24" y="34" font-family="EB Garamond, serif" font-size="15" fill="#cdefff">the megatubule: one surface, one edge, one throat</text>')
A('        <text x="24" y="432" font-family="EB Garamond, serif" font-size="12" fill="#a9b6d8">The rim is a single curve: follow it round once and you arrive on what looked like the other face.</text>')
A('        <text x="24" y="448" font-family="EB Garamond, serif" font-size="12" fill="#a9b6d8">Two circuits to close &#8212; which is the half-twist, drawn rather than asserted.</text>')
A('      </svg>')
plate1 = "\n".join(L)

# --------------------------------------------------------------- Plate II ---
# Density along the tube, through the throat, and the octave restarting.
L = []; A = L.append
A('      <svg viewBox="0 0 760 320" role="img" aria-label="A density profile along the length of the tube. Density climbs steeply to a spike at the throat, marked the Cold Spot, then drops to a low baseline on the far side where a new sequence of stations begins at one and climbs again. Eight stations are marked on the near side, numbered to one thousand, and the first three of a fresh octave on the far side.">')
A('        <rect x="0" y="0" width="760" height="320" fill="#070b1a"/>')
A('        <line x1="40" y1="250" x2="720" y2="250" stroke="#24627f" stroke-width="1.2"/>')
TH = 430
curve = []
for i in range(0, 391):
    x = 40 + i
    d = (x - TH) / 150.0
    y = 250 - (176 * math.exp(-abs(d) ** 1.5 * 2.2) + 14)
    curve.append((x, round(y, 1)))
A('        <polyline fill="none" stroke="#76cfee" stroke-width="2.6" points="'
  + " ".join(f"{x},{y}" for x, y in curve) + '"/>')
curve2 = []
for i in range(0, 290):
    x = TH + 1 + i
    t = i / 289
    y = 250 - (18 + 118 * t * t)
    curve2.append((round(x, 1), round(y, 1)))
A('        <polyline fill="none" stroke="#a07cf0" stroke-width="2.6" points="'
  + " ".join(f"{x},{y}" for x, y in curve2) + '"/>')
A(f'        <line x1="{TH}" y1="20" x2="{TH}" y2="262" stroke="#cdefff" stroke-width="1" stroke-dasharray="3 5" opacity="0.85"/>')
A(f'        <text x="{TH}" y="16" font-family="EB Garamond, serif" font-size="12" fill="#cdefff" text-anchor="middle">the throat</text>')
for lab, x in (("1", 92), ("10", 170), ("100", 262), ("1000", 360)):
    A(f'        <circle cx="{x}" cy="250" r="5" fill="rgba(3,4,12,0.9)" stroke="#ffd979" stroke-width="1.2"/>')
    A(f'        <text x="{x}" y="270" font-family="Cinzel, serif" font-size="10" fill="#ffd979" text-anchor="middle">{lab}</text>')
for lab, x in (("1&#8242;", 500), ("10&#8242;", 588), ("100&#8242;", 676)):
    A(f'        <circle cx="{x}" cy="250" r="5" fill="rgba(3,4,12,0.9)" stroke="#a07cf0" stroke-width="1.2"/>')
    A(f'        <text x="{x}" y="270" font-family="Cinzel, serif" font-size="10" fill="#a07cf0" text-anchor="middle">{lab}</text>')
A('        <text x="46" y="44" font-family="EB Garamond, serif" font-size="13" fill="#76cfee">this octave, rising toward the seam</text>')
A('        <text x="700" y="40" font-family="EB Garamond, serif" font-size="13" fill="#a07cf0" text-anchor="end">the next octave, from a clean floor</text>')
A('        <text x="40" y="300" font-family="EB Garamond, serif" font-size="12" fill="#a9b6d8">Schematic. The vertical axis is the framework\u2019s density, not a measured temperature.</text>')
A('      </svg>')
plate2 = "\n".join(L)

# -------------------------------------------------------------- Plate III ---
# The Cold Spot as measured: a cool core with a warm ring, to scale in degrees.
L = []; A = L.append
A('      <svg viewBox="0 0 760 300" role="img" aria-label="A schematic patch of the microwave sky twenty degrees across, showing the Cold Spot: a core about five degrees wide at roughly minus seventy microkelvin, surrounded by a slightly warm ring, against a background whose typical fluctuation is about eighteen microkelvin.">')
A('        <rect x="0" y="0" width="760" height="300" fill="#070b1a"/>')
A('        <defs><radialGradient id="cs-core"><stop offset="0%" stop-color="#1b2f6b"/><stop offset="55%" stop-color="#0d1430"/><stop offset="100%" stop-color="#070b1a"/></radialGradient></defs>')
A('        <rect x="40" y="30" width="330" height="240" fill="#0d1430" opacity="0.5" stroke="#24627f" stroke-width="0.8"/>')
import random
random.seed(7)
for i in range(190):
    x = 44 + random.random() * 322; y = 34 + random.random() * 232
    r = 4 + random.random() * 16
    A(f'        <circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#76cfee" opacity="{0.03 + random.random() * 0.05:.3f}"/>')
A('        <circle cx="205" cy="150" r="96" fill="none" stroke="#ef84b6" stroke-width="0.8" opacity="0.5"/>')
A('        <circle cx="205" cy="150" r="62" fill="url(#cs-core)"/>')
A('        <circle cx="205" cy="150" r="62" fill="none" stroke="#cdefff" stroke-width="1.1" stroke-dasharray="4 5"/>')
A('        <text x="205" y="154" font-family="EB Garamond, serif" font-size="13" fill="#cdefff" text-anchor="middle">&#8722;70 &#181;K</text>')
A('        <text x="205" y="286" font-family="EB Garamond, serif" font-size="12" fill="#a9b6d8" text-anchor="middle">a 20&#176; patch toward Eridanus; the core is about 5&#176; across</text>')
A('        <text x="205" y="22" font-family="EB Garamond, serif" font-size="13" fill="#cdefff" text-anchor="middle">what is measured</text>')
A('        <text x="420" y="22" font-family="EB Garamond, serif" font-size="13" fill="#45d6b4">what is claimed</text>')
rows = [
    ("Mean CMB temperature", "2.72548 K", "#cdefff"),
    ("Typical fluctuation", "about 18 \u00b5K rms", "#cdefff"),
    ("Cold Spot depth", "about \u221270 \u00b5K at the core", "#cdefff"),
    ("Angular size", "roughly 5\u00b0, in a 10\u00b0 region", "#cdefff"),
    ("Found by", "Vielva et al., WMAP wavelets, 2004", "#a9b6d8"),
    ("Confirmed present by", "Planck, 2013 and 2015", "#a9b6d8"),
    ("Significance", "a few per cent after look-elsewhere", "#ef84b6"),
    ("Supervoid", "proposed 2015, disputed 2017", "#ef84b6"),
    ("Framework\u2019s reading", "the megatubule\u2019s throat", "#45d6b4"),
    ("Status of that reading", "vision, stated as vision", "#45d6b4"),
]
for i, (k, v, col) in enumerate(rows):
    y = 54 + i * 23
    A(f'        <text x="420" y="{y}" font-family="EB Garamond, serif" font-size="12" fill="#a9b6d8">{k}</text>')
    A(f'        <text x="736" y="{y}" font-family="EB Garamond, serif" font-size="12" fill="{col}" text-anchor="end">{v}</text>')
    A(f'        <line x1="420" y1="{y + 6}" x2="736" y2="{y + 6}" stroke="#24627f" stroke-width="0.4" opacity="0.5"/>')
A('      </svg>')
plate3 = "\n".join(L)

page = f'''---
layout: layouts/base.njk
title: The Cosmic Megatubule
permalink: /megatubule/
description: "The shape of the universe read as a torus carrying a Mobius half-twist, projected out from the Cold Spot in Eridanus — the throat at which density is greatest. What the measurement actually says, what the framework adds, and the claim that through the throat a fresh octave is beginning, where the beings that pass a thousand leave their residue."
---

<section class="page-head">
  <p class="kicker">Part IV &mdash; Torus &amp; M&ouml;bius &middot; the whole, as one tube</p>
  <h1>The Cosmic Megatubule</h1>
  <p class="lede muted">One surface, one edge, one throat. The framework's picture of the universe is not a
    ball and not a sheet, but a tube that returns through itself &mdash; and the place it returns through
    can be pointed at in the sky.</p>
</section>

<section class="wrap narrow reveal">
  <div class="frame frame--first illuminated">
    <h2 id="t-shape">The shape</h2>
    <p class="lede">Take the torus of <a href="/torus/">Part&nbsp;IV</a> &mdash; &pi; applied twice, a
      circulation that comes back to itself. Then put the half-twist of
      <a href="/moebius/">the M&ouml;bius chapter</a> into it. What you have is not a doughnut and not a
      band: it is a <strong>tube with one surface</strong>, and the framework calls it the
      megatubule.</p>
    <p>The name is deliberate. A microtubule is the smallest tube the framework takes seriously, and
      <a href="/the-self/">the chapter on the self</a> hangs a great deal on it. The claim here is that the
      same object appears at the other end of the scale, and that this is the seam rule again: one
      structure, seen at whatever magnification you happen to be using.
      <span class="spec">&#9670;</span></p>
    <p>Three consequences follow immediately, and all three are geometry rather than speculation once the
      shape is granted:</p>
    <ul>
      <li><strong>There is no outside.</strong> A single-surfaced tube has no second face to be outside of.
        Questions of the form &ldquo;what is beyond the universe&rdquo; are asking for a face the shape
        does not have. <span class="sci">&#9670;</span></li>
      <li><strong>There is exactly one edge.</strong> Everything the framework calls a seam &mdash; collapse,
        the horizon, the moment of recognition, the saturation ceiling &mdash; is that one edge, met at a
        different scale. <span class="spec">&#9670;</span></li>
      <li><strong>Orientation is not conserved on a full circuit.</strong> Carry a handedness round the
        twist and it returns reversed; carry it round twice and it returns as it left. That parity test is
        the subject of Appendix&nbsp;A, and it is the one part of this picture that could in principle be
        checked against galaxy handedness. <span class="sci">&#9670;</span></li>
    </ul>
    <p class="muted small">Grading: <span class="sci">&#9670; established</span> &middot;
      <span class="hist">&#9670; scholarship</span> &middot;
      <span class="spec">&#9670; the framework's argument</span> &middot;
      <span class="myth">&#9670; vision, stated as vision</span>.</p>
  </div>
</section>

<div class="divider">✦</div>

<section class="wrap reveal">
  <figure id="fig-megatubule" class="plate">
    <figcaption class="plate-cap"><span class="plate-num">Plate I</span> The Megatubule &mdash; One
      Surface, One Edge, One Throat <span class="spec">&#9670;</span></figcaption>
    <div class="plate-art">
{plate1}
    </div>
    <p class="plate-note">The ribbon carries a single half-twist, so its rim is one curve that needs two
      circuits to close &mdash; drawn here rather than asserted, which is the only honest way to show a
      M&ouml;bius claim. At the left the tube narrows to a throat: the framework's reading of the Cold
      Spot. Through it, a fresh spiral is beginning.</p>
  </figure>
</section>

<div class="divider">✦</div>

<section class="wrap narrow reveal">
  <div class="frame">
    <h2 id="t-coldspot">The throat, and what is actually measured</h2>
    <p class="lede">The framework places the throat at the Cold Spot. Before the reading, the measurement
      &mdash; because this is the one page in Part&nbsp;IV that touches real data, and the data deserves to
      be stated without the interpretation leaning on it.</p>
    <p>The microwave background sits at <span class="formula-inline">2.72548&nbsp;K</span> and varies across
      the sky by about <span class="formula-inline">18&nbsp;&micro;K</span> rms. In the constellation
      Eridanus there is a region roughly five degrees across that runs about
      <span class="formula-inline">&minus;70&nbsp;&micro;K</span> at its core &mdash; large, and cold, and
      found by Vielva and colleagues in a wavelet analysis of WMAP in 2004. Planck looked and the feature
      is there. <span class="sci">&#9670;</span></p>
    <p>Now the honest part. Its statistical significance, once you allow for the fact that <em>something</em>
      unusual is expected somewhere on a whole sky, falls to a few per cent &mdash; interesting, not
      decisive. The leading physical explanation, a supervoid in the line of sight shedding energy from
      photons that cross it, was proposed by Szapudi and colleagues in 2015 on the strength of a void some
      1.8 billion light-years across; subsequent galaxy surveys have failed to find a void deep enough to
      account for the deficit, and the question is open.
      <span class="sci">&#9670;</span></p>
    <p><strong>What the framework adds, and nothing more:</strong> that a cold spot is a
      <em>density</em> spot. Temperature in the microwave background is a record of how much the photons had
      to climb out of; the deepest climb is the densest place. Read the Cold Spot as the point of greatest
      density and it stops being an anomaly in a smooth sky and becomes the <strong>throat</strong> &mdash;
      the single place where the tube passes through itself, and therefore the place everything is projected
      out from. <span class="myth">&#9670;</span></p>
    <p class="muted">That is a reading, and the page labels it as one. The honest objection is blunt: a few
      per cent is not a discovery, and a framework that attaches its central geometric feature to a
      marginal anomaly has staked a great deal on a feature that may yet be noise. If the Cold Spot is
      explained away, this chapter loses its address in the sky &mdash; though not its shape.</p>
  </div>
</section>

<section class="wrap reveal">
  <figure id="fig-coldspot" class="plate">
    <figcaption class="plate-cap"><span class="plate-num">Plate II</span> The Cold Spot: Measured, and Read
      <span class="sci">&#9670;</span></figcaption>
    <div class="plate-art">
{plate3}
    </div>
    <p class="plate-note">The left panel is schematic but the numbers beside it are not: they are what the
      measurement says, with its contested points marked in rose. The last two lines are the framework's,
      and are marked as such. Keeping those two columns apart is the whole discipline of this site.</p>
  </figure>
</section>

<div class="divider">✦</div>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h2 id="t-octave">Through the throat: the next octave</h2>
    <p class="lede">A seam is not a wall. The framework has said from <a href="/seams/">Part&nbsp;VI</a>
      onward that a boundary is an identification &mdash; a place where what was outside becomes inside.
      The throat is that, at the scale of everything.</p>
    <p>On this side, density climbs through the stations toward saturation. At the throat it inverts. And on
      the far side the climb begins again <strong>from a clean floor</strong>: not a continuation of our
      sequence but a fresh octave, the eighth step that is the first step of the next register, the same
      note at double the frequency. The cell does it every time it divides
      (<a href="/essays/#t-cell">chapter twenty-six</a>); the framework's claim is that the universe does
      it once, through one point. <span class="myth">&#9670;</span></p>

    <h3 id="t-residue">Where the beings past a thousand leave their residue</h3>
    <p>The <a href="/skeletal-splice/">skeletal splice</a> set out what happens at each density: the path
      forks, one half climbs and one half is sent back. Ten, a hundred, a thousand. The question this page
      answers is what happens to the half that climbs past the third threshold &mdash; past a thousand,
      where our octave runs out of places.</p>
    <p>It does not fork again into our register, because there is no fourth density here to fork into. It
      arrives at the throat. And what passes through does not arrive on the far side as a being: it arrives
      as <strong>residue</strong> &mdash; the compressed, de-individuated remainder of everything it
      gathered, laid down as the floor the next octave starts from.
      <span class="myth">&#9670;</span></p>
    <p>Which gives the framework a reading of its own foundations it did not have before. The clean floor
      our own octave began from &mdash; nought, the ground, the untrodden place &mdash; is on this account
      not empty at all. It is the residue of the previous octave's returners, packed so densely that it
      reads to us as nothing. The <a href="/seams/#t-two-densities">density at the bottom of everything</a>
      and the <a href="/dx/#t-transfer">record spent to buy awareness</a> turn out to be the same deposit,
      seen from two ends. <span class="spec">&#9670;</span></p>
    <p class="muted">Note what this costs. If residue is what passes through, then nothing personal does.
      The framework is not offering continuity of self across the throat and should not be read as offering
      it: what crosses is the deposit, not the depositor. Any consolation here is for the structure, not
      for the being.</p>
  </div>
</section>

<section class="wrap reveal">
  <figure id="fig-profile" class="plate">
    <figcaption class="plate-cap"><span class="plate-num">Plate III</span> Density Along the Tube, and the
      Octave Restarting <span class="spec">&#9670;</span></figcaption>
    <div class="plate-art">
{plate2}
    </div>
    <p class="plate-note">Our stations on the left, climbing to the throat; the next octave's on the right,
      beginning again at one over a floor made of what came through. The axis is the framework's density,
      not a temperature &mdash; the Cold Spot is where the chapter claims the two coincide, and that
      coincidence is the whole of the claim.</p>
  </figure>
</section>

<div class="divider">✦</div>

<section class="wrap">
  <div class="grid two">
    <div class="frame card">
      <h3 id="t-why-one">Why only one throat</h3>
      <p>A torus with a half-twist has a single edge; a single edge admits a single place of maximum
        pinch. Two throats would require two twists, and two twists cancel &mdash; the surface becomes
        two-sided again and the whole structure loses the property it was built for.
        <span class="spec">&#9670;</span></p>
      <p class="muted">So the uniqueness of the Cold Spot is not an extra assumption bolted on. It is
        forced by the shape, which is the strongest kind of thing this chapter is able to say.</p>
    </div>
    <div class="frame card">
      <h3 id="t-test">What would settle it</h3>
      <p>Appendix&nbsp;A's parity test is the live one: if the twist is real, galaxy handedness should not
        be perfectly balanced across the sky, and the imbalance should be oriented with respect to the
        throat. Reported asymmetries exist and are disputed, largely on selection-effect grounds.
        <span class="sci">&#9670;</span></p>
      <p class="muted">A clean null result &mdash; handedness balanced to high precision, with no
        preferred axis &mdash; would not merely weaken this page. It would remove the twist, and with it
        the single edge, and with it the throat.</p>
    </div>
  </div>
</section>

<div class="divider">✦</div>

<section class="wrap narrow reveal">
  <div class="frame">
    <h2 id="t-ledger">Earned, chosen, refused</h2>
    <dl class="glossary">
      <dt>Earned</dt>
      <dd>The Cold Spot exists in the data, at roughly &minus;70&nbsp;&micro;K and roughly five degrees,
        and was confirmed by Planck. A M&ouml;bius band has one surface and one edge, and reverses
        orientation on a single circuit &mdash; that is topology, not opinion. The octave structure of the
        cell cycle is well measured.</dd>
      <dt>Chosen</dt>
      <dd>Reading temperature deficit as density surplus. Placing the throat of the whole structure at that
        particular feature. Taking the microtubule and the megatubule to be one object at two scales.
        Calling what crosses the throat residue.</dd>
      <dt>Refused</dt>
      <dd>That the Cold Spot is established as anomalous &mdash; after the look-elsewhere correction it is
        a few per cent, and the page says so. That a supervoid has been found to explain it &mdash; it has
        not. And any suggestion that a person survives the crossing: what the framework sends through is a
        deposit, and it does not pretend otherwise.</dd>
    </dl>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h2 id="t-glossary">Terms</h2>
    <dl class="glossary">
      <dt>Megatubule</dt>
      <dd>The whole, read as a single-surfaced tube: a torus carrying one half-twist.</dd>
      <dt>Throat</dt>
      <dd>The single place of maximum pinch, where the tube passes through itself. Identified here with the
        Cold Spot.</dd>
      <dt>Octave</dt>
      <dd>Eight steps, the eighth of which is the first of the next register &mdash; the same note at double
        the frequency.</dd>
      <dt>Residue</dt>
      <dd>What a being that passes a thousand leaves on the far side: the gathered deposit, stripped of the
        gatherer.</dd>
      <dt>Cold Spot</dt>
      <dd>A region in Eridanus about 5&deg; across and about 70&nbsp;&micro;K below the mean, found in WMAP
        in 2004 and present in Planck.</dd>
    </dl>
    <h3>Reading</h3>
    <ul class="biblio">
      <li>Vielva, P. <em>et al.</em> &mdash; &ldquo;Detection of non-Gaussianity in the WMAP 1-year data
        using spherical wavelets&rdquo;, <em>ApJ</em> <strong>609</strong> (2004).</li>
      <li>Planck Collaboration &mdash; &ldquo;Isotropy and statistics of the CMB&rdquo;, 2013 and 2015
        results.</li>
      <li>Szapudi, I. <em>et al.</em> &mdash; &ldquo;Detection of a supervoid aligned with the cold spot of
        the cosmic microwave background&rdquo;, <em>MNRAS</em> <strong>450</strong> (2015).</li>
      <li>Mackenzie, R. <em>et al.</em> &mdash; &ldquo;Evidence against a supervoid causing the CMB Cold
        Spot&rdquo;, <em>MNRAS</em> <strong>470</strong> (2017).</li>
    </ul>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame frame--creed">
    <p class="lede">One surface, one edge, one throat &mdash; and on the other side of it a floor being laid
      by everything that got far enough to stop being anyone. Our own ground, on this reading, is somebody
      else's residue.</p>
    <p class="muted small">Next: <a href="/moebius/">the twist itself, and the parity test</a>.</p>
  </div>
</section>
'''

open('tti/src/megatubule.njk', 'w').write(page)
print("written", len(page))
