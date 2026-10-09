#!/usr/bin/env python3
"""Insert 'The Eternal Integration' section, with a computed pendulum phase
portrait, into tti/src/foundations.njk. Idempotent."""
from pathlib import Path
import math

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "tti" / "src" / "foundations.njk"

# ---- phase portrait geometry ---------------------------------------------
W, H = 760, 430
X0, Y0 = 380, 190          # origin of the phase plane
TMAX = 1.7 * math.pi       # theta range drawn
SX = 672 / (2 * TMAX)      # fits inside a 44 px margin either side
SY = 48                    # momentum scale


def pt(th, p):
    return (X0 + th * SX, Y0 - p * SY)


def path(points):
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in points)


def curve(E, sign=1, n=420):
    """p = sign * sqrt(2(E + cos th)) where real, clipped to the drawn range."""
    out, run = [], []
    for i in range(n + 1):
        th = -TMAX + 2 * TMAX * i / n
        v = 2 * (E + math.cos(th))
        if v < 0:
            if len(run) > 1:
                out.append(run)
            run = []
            continue
        run.append(pt(th, sign * math.sqrt(v)))
    if len(run) > 1:
        out.append(run)
    return out


paths = []
for E in (-0.85, -0.55, -0.2, 0.25, 0.7):          # libration
    for s_ in (1, -1):
        for seg in curve(E, s_):
            paths.append(("lib", path(seg)))
for s_ in (1, -1):                                   # separatrix, E = 1
    for seg in curve(0.999999, s_):
        paths.append(("sep", path(seg)))
for E in (1.3, 1.75, 2.3):                          # circulation
    for s_ in (1, -1):
        for seg in curve(E, s_):
            paths.append(("rot", path(seg)))

STROKE = {
    "lib": '#45d6b4" stroke-width="1" opacity="0.55',
    "sep": '#ffd979" stroke-width="2.1" opacity="0.95',
    "rot": '#a07cf0" stroke-width="1" opacity="0.5',
}
curves = "\n".join(
    f'          <path d="{d}" stroke="{STROKE[k]}"/>' for k, d in paths
)

ticks, labels = [], []
for k, lab in ((-1, "&minus;π"), (0, "0"), (1, "π")):
    x = X0 + k * math.pi * SX
    ticks.append(f'          <path d="M{x:.1f} {Y0-4} V{Y0+4}" stroke="#a9b6d8" stroke-width="0.8"/>')
    labels.append(f'          <text x="{x:.1f}" y="{Y0+22}">{lab}</text>')
ticks_svg_lines = "\n".join(ticks)
ticks_svg_text = "\n".join(labels)

LEG_Y = 352
legend = """
        <g stroke-linecap="round">
          <path d="M70 {a} H104" stroke="#45d6b4" stroke-width="1.6"/>
          <path d="M70 {b} H104" stroke="#ffd979" stroke-width="2.1"/>
          <path d="M70 {c} H104" stroke="#a07cf0" stroke-width="1.6"/>
        </g>
        <g font-family="EB Garamond, serif" font-size="12.5" fill="#a9b6d8">
          <text x="116" y="{a2}"><tspan fill="#45d6b4">Libration</tspan> &mdash; it swings out, turns, and comes back. Finite period.</text>
          <text x="116" y="{b2}"><tspan fill="#ffd979">The separatrix</tspan> &mdash; E = 2mgL exactly. It approaches the top for ever. Infinite period.</text>
          <text x="116" y="{c2}"><tspan fill="#a07cf0">Circulation</tspan> &mdash; over the top, round and round, never turning back.</text>
        </g>
""".format(a=LEG_Y, b=LEG_Y + 22, c=LEG_Y + 44,
           a2=LEG_Y + 4, b2=LEG_Y + 26, c2=LEG_Y + 48)

PLATE = f'''  <figure id="fig-pendulum" class="plate">
    <figcaption class="plate-cap"><span class="plate-num">Plate II</span> The Phase Portrait of a
      Pendulum, and the Orbit That Never Arrives <span class="sci">&#9670;</span></figcaption>
    <div class="plate-art">
      <svg viewBox="0 0 {W} {H}" role="img" aria-label="The phase plane of a pendulum: closed oval orbits near the centre for bound swinging, open wavy curves above and below for continuous rotation, and between them the gold separatrix, the single orbit of critical energy whose period is infinite">
        <g fill="none" stroke="#a9b6d8" stroke-width="0.8" opacity="0.45">
          <path d="M44 {Y0} H716"/>
          <path d="M{X0} 34 V{Y0+112}"/>
        </g>
        <g fill="none" stroke-linecap="round">
{curves}
        </g>
        <g fill="none">
{ticks_svg_lines}
        </g>
        <g font-family="EB Garamond, serif" font-size="12" fill="#a9b6d8" text-anchor="middle">
{ticks_svg_text}
        </g>
        <g font-family="Cinzel, serif" font-size="10" letter-spacing="2" fill="#a9b6d8">
          <text x="{X0}" y="{Y0+140}" text-anchor="middle">ANGLE θ</text>
          <text x="44" y="26">MOMENTUM θ&#775;</text>
        </g>
        <circle cx="{X0}" cy="{Y0}" r="3.4" fill="#cdefff"/>
        <circle cx="{X0 - math.pi*SX:.1f}" cy="{Y0}" r="4" fill="#03040c" stroke="#ffd979" stroke-width="1.4"/>
        <circle cx="{X0 + math.pi*SX:.1f}" cy="{Y0}" r="4" fill="#03040c" stroke="#ffd979" stroke-width="1.4"/>
{legend}
      </svg>
    </div>
    <p class="plate-note">Every possible motion of a pendulum, drawn at once. The two ringed points at
      &plusmn;π are the inverted position &mdash; saddle points, unstable equilibria. Inside the gold
      curve the bob swings and returns; outside it the bob goes over the top and keeps turning in one
      direction for ever. The gold curve itself is the <strong>separatrix</strong>, the single orbit of
      critical energy E = 2mgL, and it is the one the framework cares about: a pendulum released exactly
      onto it approaches the vertical and <em>never reaches it</em>. The period is infinite.
      <span class="sci">&#9670;</span></p>
  </figure>
'''

SECTION = f'''<div class="divider">&#10022;</div>

<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">&mdash; the thesis of the whole work, in one sentence</p>
    <h2 id="t-eternal-integration">The Eternal Integration, and the Pendulum That Cannot Settle</h2>
    <p class="lede muted">Everything on this site is an elaboration of a single claim, and it is worth
      putting the claim down bare before any of the machinery is brought to it.</p>
  </div>

  <div class="wrap narrow">
    <div class="frame frame--creed illuminated">
      <p class="lede" style="text-align:center">The universe is an eternal integration of opposing
        infinities, which together swing like a pendulum that cannot settle.</p>
    </div>
  </div>

  <div class="wrap narrow">
    <div class="frame">
      <p>That sentence has four load-bearing words, and each one is technical. Taken loosely it is a mood.
        Taken precisely it is a position with consequences, some of which can be checked. The rest of this
        section takes them one at a time.</p>
    </div>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h3 id="t-ei-infinities">&ldquo;Opposing infinities&rdquo; &mdash; and why they are not the same size</h3>
    <p>The two infinities are not large and larger. They point in opposite directions. One opens
      <em>upward</em>, through counting: 1, 2, 3, and onward without end. The other opens
      <em>downward</em>, into the interval between zero and one, subdividing without ever reaching the
      floor. The first is the infinity of accumulation; the second is the infinity of descent.</p>
    <p>They are also, provably, of different magnitudes. Cantor's diagonal argument shows that the
      counting numbers are <strong>countable</strong>, with cardinality ℵ&#8320;, while the points of the
      interval (0, 1) are <strong>uncountable</strong>, with cardinality 2<sup>ℵ&#8320;</sup> &mdash;
      strictly larger. There are more numbers between zero and one than there are whole numbers in the
      entire unending march upward. <span class="sci">&#9670;</span></p>
    <p class="lede">So the opposition is not symmetric. There is more room downward than upward, and that
      asymmetry is the tilt the framework reads as the origin of the arrow of time.
      <span class="spec">&#9670;</span></p>
    <p class="muted">Said against ourselves, and now harder than before: cardinality is not a physical
      density, and nothing in Cantor's theorem is about rates, directions or duration. The step from
      &ldquo;more room in that direction&rdquo; to &ldquo;things therefore tend that way&rdquo; is the
      framework's, it was long conceded as the weakest joint at
      <a href="/stress-tests/#t-entropy">the entropy objection</a> &mdash; and it has since been
      simulated and <strong>found to fail</strong>. The smallest honest model of the asymmetry produces
      an arrow only once a uniform measure over states is assumed; swap the measure and the arrow
      disappears with every cardinality untouched. The working claim is therefore the weaker one: the
      asymmetry shapes the space an arrow could live in, and something else, not yet supplied, must
      choose the measure. The run is at <a href="/stress-tests/#t-toy">the toy integrator</a>.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-ei-integration">&ldquo;Integration&rdquo; &mdash; the operation, not the metaphor</h3>
    <p>Integration here means what it means in analysis: the gathering of infinitesimal contributions
      into a total. The universe is not <em>described</em> by an integral; on this reading it
      <em>is</em> one &mdash; a sum being taken, continuously, over contributions each of which is a
      completed <a href="/dx/">differential</a>.</p>
    <p class="formula" style="text-align:center">U = &int;<sub>0</sub><sup>&infin;</sup>
      f(t)&thinsp;dt</p>
    <p>Writing it that way makes the technical content of &ldquo;eternal&rdquo; exact. An integral with an
      unbounded upper limit is <em>improper</em>: it is defined as the limit of
      &int;<sub>0</sub><sup>T</sup> as T &rarr; &infin;, and that limit either converges to a number or it
      does not. The framework's claim is that this one <strong>does not converge</strong> &mdash; and it
      has an arithmetic reason rather than a wish. The deposit per density is linear, so the duration of
      the n-th density goes as 1/n, and</p>
    <p class="formula" style="text-align:center">&sum;<sub>n</sub> 1/n &rarr; &infin;</p>
    <p>The harmonic series diverges. The total time is unbounded even though every individual stage is
      shorter than the last. <strong>Eternal does not mean long; it means the sum has no limit.</strong>
      <span class="sci">&#9670;</span> The full derivation is at
      <a href="/skeletal-splice/#t-pace">the splice</a>.</p>
  </div>
</section>

<section class="wrap">
  <div class="page-head tight">
    <p class="kicker">&mdash; the image, taken literally</p>
    <h3 id="t-ei-pendulum">&ldquo;Pendulum&rdquo; &mdash; and the orbit with an infinite period</h3>
    <p class="lede muted">This is the part of the sentence that turns out to be more than an image. The
      pendulum is the best-studied nonlinear system in physics, and its behaviour contains, exactly, the
      thing the framework has been claiming all along.</p>
  </div>

{PLATE}
</section>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h3 id="t-ei-separatrix">The mathematics of a swing that never arrives</h3>
    <p>A pendulum of length L obeys</p>
    <p class="formula" style="text-align:center">θ&#776; + (g/L)&thinsp;sin θ = 0</p>
    <p>For small swings sin θ &asymp; θ and the motion is simple harmonic, with a period
      2π&radic;(L/g) that is famously independent of amplitude. That is the textbook pendulum, and it is a
      linearisation &mdash; a convenience, true only near the bottom.
      <span class="sci">&#9670;</span></p>
    <p>Keep the sine and the picture changes completely. As the amplitude grows the period grows with it,
      and as the amplitude approaches π &mdash; the bob swinging all the way up to vertical &mdash; the
      period <strong>diverges logarithmically</strong>. At exactly the critical energy E = 2mgL the
      solution is the <em>separatrix</em>, and it has an exact closed form:</p>
    <p class="formula" style="text-align:center">θ(t) = 4&thinsp;arctan(e<sup>&omega;t</sup>) &minus; π,
      &nbsp; &omega; = &radic;(g/L)</p>
    <p>Read it and the behaviour is unmistakable. As t &rarr; &infin;, θ &rarr; π. The bob approaches the
      vertical and never gets there. It is always moving, it never stops, it never turns back, and it
      never arrives. <strong>The period of that orbit is infinite.</strong>
      <span class="sci">&#9670;</span></p>
    <p class="lede">That is the asymptotic God written in Newtonian mechanics: an approach that is
      genuinely unending, not because something blocks it but because the geometry of the motion has an
      unstable equilibrium at the top. <span class="spec">&#9670;</span></p>
    <p class="muted">And it is worth being precise about why: the vertical is an <em>unstable</em>
      equilibrium, a saddle point in the phase plane. Orbits take infinite time to reach a saddle. The
      framework's unreachable One and the pendulum's inverted position are the same kind of object
      &mdash; a fixed point approached asymptotically along a separatrix &mdash; and that is a
      mathematical statement, not a simile.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-ei-two-regimes">Two regimes, one dividing line</h3>
    <p>The phase portrait above shows every possible pendulum motion simultaneously, and it divides
      cleanly in two:</p>
    <ul>
      <li><strong>Libration</strong> (E &lt; 2mgL) &mdash; the closed orbits near the centre. The bob
        swings out, turns, comes back. Bounded, periodic, finite period. A density that returns to
        itself.</li>
      <li><strong>Circulation</strong> (E &gt; 2mgL) &mdash; the open curves above and below. The bob has
        enough energy to go over the top, and then it keeps going round in the same direction for ever.
        It never turns back. <span class="sci">&#9670;</span></li>
    </ul>
    <p>Between them, and belonging to neither, sits the separatrix. And note what the phase space of a
      pendulum actually <em>is</em>: because θ and θ + 2π are the same configuration, the space is not a
      plane but a <strong>cylinder</strong> &mdash; and once the energy surface is closed up, a
      <strong>torus</strong>. The framework did not choose the torus for this chapter and then find a
      pendulum to fit it. The torus is where pendulum motion lives, as a matter of elementary classical
      mechanics. <a href="/torus/">The torus chapter</a> is about the same surface.
      <span class="sci">&#9670;</span></p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h3 id="t-ei-out-of-control">&ldquo;Cannot settle&rdquo; &mdash; what that means technically, and what chaos adds</h3>
    <p>The sentence used to say <em>out of control</em>, and it has been changed. The reason is worth
      giving, because it is the framework tightening a claim rather than softening one. Two different
      things were being asserted at once, and computation separated them: one holds everywhere and by
      theorem, the other holds only above a threshold. The thesis now carries the first and states the
      second as a consequence. <a href="/stress-tests/#t-lyap-undamped">The numbers are here.</a></p>
    <ol>
      <li><strong>Undamped.</strong> A real pendulum loses energy to friction, its amplitude decays, and
        it settles at the bottom. This one does not. Nothing removes energy from the system, because the
        system is everything &mdash; there is no outside for the losses to go to. An undamped pendulum
        never settles, in principle and not merely in practice.</li>
      <li><strong>Above a threshold, chaotic &mdash; a consequence, not part of the thesis.</strong> Add a periodic drive to a damped pendulum and
        you have the canonical chaotic system of nonlinear dynamics: motion that is fully deterministic,
        obeys an equation written on one line, and is nonetheless unpredictable in the long run because
        nearby trajectories separate exponentially &mdash; a positive Lyapunov exponent. Determinism and
        predictability are not the same property, and the pendulum is the standard demonstration that
        they come apart. <span class="sci">&#9670;</span></li>
      <li><strong>Not</strong> random, and not lawless. This is the reading the framework refuses. A
        pendulum that cannot settle is not one that does whatever it likes. It is one whose law is exact,
        whose rest is structurally unavailable, and whose future &mdash; past a threshold in the drive
        &mdash; is beyond computation.</li>
    </ol>
    <p class="lede">So the thesis, unpacked: a sum that never converges, taken over contributions pulled
      between two unequal infinities, in a system that cannot settle because there is nothing outside it
      to absorb the swing. That much holds unconditionally. Whether its exact law also fails to buy
      anyone a prediction depends on how hard it is driven &mdash; and that is a measurable question,
      answered for the pendulum itself on the <a href="/stress-tests/#t-lyapunov">stress-tests
      page</a>.</p>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h3 id="t-ei-ledger">What this earns, and what it only borrows</h3>
    <div class="grid two">
      <div class="frame card">
        <h3>Earned</h3>
        <ul>
          <li>ℵ&#8320; &lt; 2<sup>ℵ&#8320;</sup>: Cantor, a theorem. <span class="sci">&#9670;</span></li>
          <li>&sum;1/n diverges: Oresme, c. 1350. <span class="sci">&#9670;</span></li>
          <li>The separatrix has infinite period, with the closed form given above.
            <span class="sci">&#9670;</span></li>
          <li>Pendulum phase space is a cylinder; the driven damped case is chaotic with a positive
            Lyapunov exponent. <span class="sci">&#9670;</span></li>
        </ul>
      </div>
      <div class="frame card">
        <h3>Chosen, and refused</h3>
        <ul>
          <li><em>Chosen:</em> that the universe <em>is</em> the integral rather than being described by
            one. <span class="spec">&#9670;</span></li>
          <li><em>Chosen:</em> that the asymmetry of the two infinities is a physical tilt and not merely
            a fact about sets. <span class="spec">&#9670;</span></li>
          <li><em>Refused:</em> treating the pendulum as proof. A system can share a mathematical
            structure with another and have nothing else in common; the separatrix is offered as the
            clearest known instance of an unending approach, not as evidence that the cosmos is
            one.</li>
          <li><em>Refused:</em> &ldquo;chaotic&rdquo; as a licence for vagueness. Chaos is a defined
            property with a measurable exponent, and the framework does not get to borrow its
            glamour without computing one.</li>
        </ul>
      </div>
    </div>
  </div>
</section>

'''


def main():
    s = PAGE.read_text()
    if "t-eternal-integration" in s:
        start = s.index('<div class="divider">&#10022;</div>\n\n<section class="wrap">\n  <div class="page-head tight">\n    <p class="kicker">&mdash; the thesis of the whole work')
        end = s.index("<!-- expand:foundations:start -->")
        s = s[:start] + SECTION + s[end:]
    else:
        anchor = "<!-- expand:foundations:start -->"
        assert s.count(anchor) == 1
        s = s.replace(anchor, SECTION + anchor, 1)
    PAGE.write_text(s)
    print("wrote the eternal-integration section into tti/src/foundations.njk")


if __name__ == "__main__":
    main()
