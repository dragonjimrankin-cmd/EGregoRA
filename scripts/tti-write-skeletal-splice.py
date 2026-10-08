import math
phi=(1+5**0.5)/2
F=[0,1]
for i in range(2,20): F.append(F[-1]+F[-2])
rows=[]
tot=0
for n in range(1,9):
    R=F[n+2]-1
    dep=R*phi**(-n)
    tot+=dep
    rows.append((n, F[n+2], R, phi**(-n), dep, tot))

# ---------------- Plate I: the skeleton, spliced at every density -----------
def pt(v, dr=0.0, cx=320, cy=286):
    l=math.log10(v); rad=40+62*l+dr
    frac=l-math.floor(l); ang=-1.5708+6.28318*frac
    return (round(cx+rad*math.cos(ang),2), round(cy+rad*math.sin(ang),2))

def sample(a,b,dr=0.0,steps=700):
    la, lb = math.log10(a), math.log10(b)
    return [pt(10**(la+(lb-la)*i/steps), dr) for i in range(steps+1)]

L=[]; A=L.append
A('      <svg viewBox="0 0 640 600" role="img" aria-label="A logarithmic spiral marked at one, ten, one hundred and one thousand. At each of those density thresholds the climbing path forks: a bright half carries on outward and a rose half turns back and falls inward below one. The three fixed points nought, one and minus one are marked at the centre, and their scaled images three hundred and thirty-three, six hundred and sixty-six and nine hundred and ninety-nine are marked on the outer turn.">')
A('        <rect x="0" y="0" width="640" height="600" fill="#070b1a"/>')
A('        <g fill="none" stroke="#24627f" stroke-width="0.5" stroke-dasharray="2 5" opacity="0.5">')
for r in (40,102,164,226):
    A(f'          <circle cx="320" cy="286" r="{r}"/>')
A('        </g>')
A('        <line x1="320" y1="286" x2="320" y2="52" stroke="#76cfee" stroke-width="0.6" stroke-dasharray="4 6" opacity="0.4"/>')
# the climb, spliced at each decade
A('        <defs><marker id="sk-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="#ffd979"/></marker>')
A('          <marker id="sk-back" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="#ef84b6"/></marker></defs>')
climb=sample(1,1000)
A('        <polyline fill="none" stroke="#ffd979" stroke-width="2.6" opacity="0.95" marker-end="url(#sk-arr)" points="'+" ".join(f"{x},{y}" for x,y in climb)+'"/>')
# returning halves at each threshold: short rose arcs falling inward
for k,(dec,depth) in enumerate([(10,1),(100,2),(1000,3)], start=1):
    back=sample(dec, 1.0, -7.0*k, 700)
    A(f'        <polyline fill="none" stroke="#ef84b6" stroke-width="{2.4 - 0.4*k}" opacity="{0.9 - 0.12*k}" points="'+" ".join(f"{x},{y}" for x,y in back)+'"/>')
# the fall below one, shared
r0=40-7
tail=[]
for i in range(0,241):
    t=i/240; kk=6.0*t
    rad=(r0-20)*(phi**(-kk))+20.0
    ang=-1.5708-6.28318*kk/2.2
    tail.append((round(320+rad*math.cos(ang),2), round(286+rad*math.sin(ang),2)))
A('        <polyline fill="none" stroke="#ef84b6" stroke-width="2.2" marker-end="url(#sk-back)" opacity="0.95" points="'+" ".join(f"{x},{y}" for x,y in tail)+'"/>')
for kk in range(1,7):
    rad=(r0-20)*(phi**(-kk))+20.0
    ang=-1.5708-6.28318*kk/2.2
    x=round(320+rad*math.cos(ang),2); y=round(300+rad*math.sin(ang),2)
    A(f'        <circle cx="{x}" cy="{y}" r="{round(max(2.4,4.8*phi**(-kk*0.3)),2)}" fill="rgba(3,4,12,0.9)" stroke="#ef84b6" stroke-width="1"/>')
# the splice nodes
for v,label in ((10,"10"),(100,"100"),(1000,"1000")):
    x,y=pt(v)
    A(f'        <circle cx="{x}" cy="{y}" r="11" fill="#ffd979" stroke="#ffd979" stroke-width="1.4"/>')
    A(f'        <text x="{x}" y="{y+4}" font-family="Cinzel, serif" font-size="9" fill="#03040c" text-anchor="middle">{label}</text>')
    A(f'        <circle cx="{x}" cy="{y}" r="18" fill="none" stroke="#cdefff" stroke-width="0.9" stroke-dasharray="3 4" opacity="0.8"/>')
x,y=pt(1)
A(f'        <circle cx="{x}" cy="{y}" r="11" fill="#ffd979"/>')
A(f'        <text x="{x}" y="{y+4}" font-family="Cinzel, serif" font-size="9" fill="#03040c" text-anchor="middle">1</text>')
# the skeleton at the centre
A('        <circle cx="320" cy="286" r="15" fill="#ffd979"/>')
A('        <text x="320" y="291" font-family="Cinzel, serif" font-size="11" fill="#03040c" text-anchor="middle">0</text>')
A('        <text x="278" y="290" font-family="Cinzel, serif" font-size="11" fill="#a07cf0" text-anchor="end">&#8722;1</text>')
A('        <circle cx="286" cy="286" r="5" fill="none" stroke="#a07cf0" stroke-width="1.2"/>')
# the scaled skeleton on the outer turn
for v,lab,col in ((333,"333","#45d6b4"),(666,"666","#76cfee"),(999,"999","#a07cf0")):
    x,y=pt(v)
    A(f'        <circle cx="{x}" cy="{y}" r="7" fill="rgba(3,4,12,0.9)" stroke="{col}" stroke-width="1.4"/>')
    off = {"999": (-24, -10, "end"), "333": (12, 17, "start"), "666": (12, 4, "start")}[lab]
    A(f'        <text x="{x+off[0]}" y="{y+off[1]}" font-family="EB Garamond, serif" font-size="11" fill="{col}" text-anchor="{off[2]}">{lab}</text>')
A('        <g font-family="EB Garamond, serif" font-size="12">')
A('          <line x1="34" y1="548" x2="66" y2="548" stroke="#ffd979" stroke-width="2.6"/><text x="74" y="552" fill="#ffd979">the prime being, climbing</text>')
A('          <line x1="34" y1="572" x2="66" y2="572" stroke="#ef84b6" stroke-width="2.2"/><text x="74" y="576" fill="#ef84b6">the halves sent back</text>')
A('          <text x="360" y="552" fill="#cdefff">dashed rings: the splice at 10, 100, 1000</text>')
A('          <text x="360" y="576" fill="#a9b6d8" font-style="italic">the skeleton, and its images</text>')
A('        </g>')
A('      </svg>')
plate1="\n".join(L)

# ---------------- Plate II: the deposits and the running polarisation -------
L=[]; A=L.append
A('      <svg viewBox="0 0 760 320" role="img" aria-label="Eight bars, one per density, showing the polarisation each one deposits. The bars rise quickly and then flatten onto a dashed line at one point one seven zero eight, the limiting quantum. A straight rising line behind them shows the running total, which grows by the same amount at every further density.">')
A('        <rect x="0" y="0" width="760" height="320" fill="#070b1a"/>')
A('        <line x1="64" y1="248" x2="712" y2="248" stroke="#24627f" stroke-width="1.2"/>')
A('        <line x1="64" y1="40" x2="64" y2="248" stroke="#24627f" stroke-width="1.2"/>')
qy=248-1.1708203932*120
A(f'        <line x1="64" y1="{qy:.1f}" x2="700" y2="{qy:.1f}" stroke="#ffd979" stroke-width="1" stroke-dasharray="3 5"/>')
A(f'        <text x="706" y="{qy+4:.1f}" fill="#ffd979" font-size="12">&#966;&#178;/&#8730;5</text>')
for (n,f,R,p,dep,t) in rows:
    x=64+ (n-1)*78 + 14
    h=dep*120
    A(f'        <rect x="{x}" y="{248-h:.1f}" width="40" height="{h:.1f}" fill="#45d6b4" opacity="0.5" stroke="#45d6b4" stroke-width="0.8"/>')
    A(f'        <text x="{x+20}" y="266" fill="#a9b6d8" font-size="12" text-anchor="middle">{n}</text>')
    A(f'        <text x="{x+20}" y="{248-h-6:.1f}" fill="#cdefff" font-size="10.5" text-anchor="middle">{dep:.3f}</text>')
pts=" ".join(f"{64+(n-1)*78+34},{248-t*12:.1f}" for (n,f,R,p,dep,t) in rows)
A(f'        <polyline fill="none" stroke="#a07cf0" stroke-width="2.2" points="{pts}"/>')
A('        <text x="700" y="140" fill="#a07cf0" font-size="12" text-anchor="end">running total &#928;&#8345; (scaled &#215;0.1)</text>')
A('        <text x="64" y="30" fill="#cdefff" font-size="14">what each density deposits, and what it all adds up to</text>')
A('        <text x="360" y="292" fill="#a9b6d8" font-size="12" text-anchor="middle">density index n &#8212; the splices at 10, 100, 1000, &#8230;</text>')
A('      </svg>')
plate2="\n".join(L)

# ---------------- Plate III: speed up, time per rung down -------------------
L=[]; A=L.append
A('      <svg viewBox="0 0 760 300" role="img" aria-label="Two curves. A straight rising line for the prime being\'s speed, proportional to the accumulated polarisation. A falling curve for the time each further density takes, proportional to one over n. A note records that the falling curve is the harmonic series, whose sum diverges, so the climb never finishes.">')
A('        <rect x="0" y="0" width="760" height="300" fill="#070b1a"/>')
A('        <line x1="64" y1="236" x2="712" y2="236" stroke="#24627f" stroke-width="1.2"/>')
A('        <line x1="64" y1="36" x2="64" y2="236" stroke="#24627f" stroke-width="1.2"/>')
spd=" ".join(f"{64+(n-1)*78+34},{236-t*16:.1f}" for (n,f,R,p,dep,t) in rows)
A(f'        <polyline fill="none" stroke="#45d6b4" stroke-width="2.6" points="{spd}"/>')
A('        <text x="700" y="60" fill="#45d6b4" font-size="12" text-anchor="end">speed &#8733; &#928;&#8345;</text>')
tim=" ".join(f"{64+(n-1)*78+34},{236-(100/ (rows[n-1][5]) ):.1f}" for n in range(1,9))
A(f'        <polyline fill="none" stroke="#ef84b6" stroke-width="2.6" points="{tim}"/>')
A('        <text x="700" y="200" fill="#ef84b6" font-size="12" text-anchor="end">time for the next density &#8733; 1/&#928;&#8345;</text>')
for n in range(1,9):
    A(f'        <text x="{64+(n-1)*78+34}" y="256" fill="#a9b6d8" font-size="12" text-anchor="middle">{n}</text>')
A('        <text x="64" y="28" fill="#cdefff" font-size="14">the climb accelerates &#8212; and still never arrives</text>')
A('        <text x="360" y="282" fill="#a9b6d8" font-size="12" text-anchor="middle">&#8721; 1/&#928;&#8345; diverges like the harmonic series: faster at every step, infinite in total</text>')
A('      </svg>')
plate3="\n".join(L)

table_rows="\n".join(
 f'        <tr><td>{n}</td><td>{f}</td><td>{R}</td><td>{p:.6f}</td><td>{dep:.5f}</td><td>{t:.5f}</td></tr>'
 for (n,f,R,p,dep,t) in rows)

page = f'''---
layout: layouts/base.njk
title: The Rankin Skeletal Splice
permalink: /skeletal-splice/
description: "The Rankin skeletal splice: the fork at every density threshold, taken against the fixed skeleton of minus one, nought and one and its scaled images 333, 666 and 999. Why the halves sent back accumulate as completed differentials below one, how that accumulation polarises the two infinities, and why the resulting gradient accelerates the prime being at every further density without ever letting it arrive."
---

<section class="page-head">
  <p class="kicker">Part V &mdash; The Ledger &middot; the splice, on the skeleton</p>
  <h1>The Rankin Skeletal Splice</h1>
  <p class="lede muted">Two results of the framework, put together: the fork that happens at every density,
    and the three fixed points it happens against. What falls out of the join is a gradient &mdash; and
    something for it to pull on.</p>
</section>

<section class="wrap narrow reveal">
  <div class="frame frame--first illuminated">
    <h2 id="t-what">What the splice is</h2>
    <p class="lede">A being that reaches the top of a density does not simply continue. It
      <strong>splices</strong>: one half carries on into the next density, the other is sent back.</p>
    <p>That much is <a href="/spiral/#t-splice">chapter ten</a>, and it is drawn on
      <a href="/spiral/#fig-route">Plate&nbsp;II</a> of the spiral page. What makes it
      <em>skeletal</em> is the frame it happens against. The framework has exactly three points that do
      not move under its own operations: <span class="formula-inline">0</span>, the ground, unmoved by
      scale; <span class="formula-inline">1</span>, the self, unmoved by multiplication; and
      <span class="formula-inline">&minus;1</span>, the mirror, the point a half-turn returns you to.
      &ldquo;They are the skeleton the rest is hung upon.&rdquo; <span class="spec">&#9670;</span></p>
    <p>And the skeleton recurs. Lifted two turns up the spiral it reappears as
      <strong>333</strong>, <strong>666</strong> and <strong>999</strong> &mdash; the same three roles
      under larger names, with the turning points at the thirds. So the splice is not an event that
      happens somewhere arbitrary: it happens <em>on</em> a structure that is the same at every scale.
      The splice is skeletal because the bone it breaks on is the same bone every time.</p>
    <p class="muted">Said plainly, because the next three sections depend on it: the splice is a rule the
      framework asserts, not a result it derives. What <em>is</em> derived &mdash; and provable &mdash; is
      the count that comes out of it: <span class="formula-inline">P<sub>n</sub> = F<sub>n+2</sub> &minus;
      1</span>, the population after n splices, one less than a Fibonacci number every time.
      <span class="sci">&#9670;</span></p>
    <p class="muted small">Grading: <span class="sci">&#9670; established</span> &middot;
      <span class="hist">&#9670; scholarship</span> &middot;
      <span class="spec">&#9670; the framework's argument</span> &middot;
      <span class="myth">&#9670; vision, stated as vision</span>.</p>
  </div>
</section>

<div class="divider">✦</div>

<section class="wrap reveal">
  <figure id="fig-skeletal" class="plate">
    <figcaption class="plate-cap"><span class="plate-num">Plate I</span> The Splice at Every Density, on
      the Same Skeleton <span class="spec">&#9670;</span></figcaption>
    <div class="plate-art">
{plate1}
    </div>
    <p class="plate-note">One climb, three splices. At 10, at 100 and at 1000 the road forks: gold carries
      on, rose turns back. Every rose road ends in the same place &mdash; the interval below one &mdash;
      and the stations there are the returners of
      <a href="/seams/#t-returners">chapter fifteen</a>, each fall shorter than the last by the golden
      ratio. The three fixed points sit at the centre; their scaled images sit on the outer turn.</p>
  </figure>
</section>

<div class="divider">✦</div>

<section class="wrap narrow reveal">
  <div class="frame">
    <h2 id="t-accumulation">The returning differentials accumulate</h2>
    <p class="lede">A returner does not arrive empty. It brings back everything it gathered on the way up
      &mdash; and on this framework's reading of calculus, what it gathered is made of completed smallest
      integrals.</p>
    <p>From <a href="/dx/">the chapter on dx</a>: a differential is not a vanishing nothing but the
      smallest act of gathering that has actually been finished. A climb through a density is therefore a
      sum of such acts, and the half that is sent back carries its share of them downward.
      <span class="spec">&#9670;</span></p>
    <p>Each return lands below one, at a depth set by the golden law &mdash; the n-th return falling to
      roughly <span class="formula-inline">&phi;<sup>&minus;n</sup></span> of the way to the ground. And
      the number of returners at the n-th density is the population minus the single line that keeps
      climbing: <span class="formula-inline">R<sub>n</sub> = F<sub>n+2</sub> &minus; 1</span>.</p>
    <p>So the quantity deposited into the lower infinity at the n-th density is the count times the depth:</p>
    <p class="formula" style="text-align:center">&delta;&Pi;<sub>n</sub> = R<sub>n</sub> &middot;
      &phi;<sup>&minus;n</sup> = (F<sub>n+2</sub> &minus; 1)&thinsp;&phi;<sup>&minus;n</sup></p>
    <p>Here is the pretty part, and it is arithmetic rather than assertion. Fibonacci grows like
      <span class="formula-inline">&phi;<sup>n</sup></span> and the depth discount shrinks like
      <span class="formula-inline">&phi;<sup>&minus;n</sup></span>, so the two cancel. The deposit does
      not run away and it does not die out: it converges on a constant.</p>
    <p class="formula" style="text-align:center">&delta;&Pi;<sub>n</sub> &rarr; &phi;&sup2;/&radic;5 =
      (5 + 3&radic;5)/10 = 1.170820&hellip;</p>
    <p><strong>Every further density deposits the same quantum.</strong> Not more, not less &mdash;
      1.1708 of whatever unit the first one was measured in. The running total is therefore straight:
      <span class="formula-inline">&Pi;<sub>n</sub> &asymp; 1.1708&thinsp;n &minus; 1.618</span>, with a
      correction that dies geometrically. <span class="sci">&#9670;</span> The arithmetic is checkable; the
      <em>reading</em> of it as a physical deposit is the framework's. <span class="spec">&#9670;</span></p>

    <div class="table-wrap">
      <table class="ledger">
        <caption>The deposit at each density, and the running polarisation</caption>
        <thead>
          <tr><th>n</th><th>F<sub>n+2</sub></th><th>R<sub>n</sub></th><th>&phi;<sup>&minus;n</sup></th>
            <th>&delta;&Pi;<sub>n</sub></th><th>&Pi;<sub>n</sub></th></tr>
        </thead>
        <tbody>
{table_rows}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="wrap reveal">
  <figure id="fig-deposit" class="plate">
    <figcaption class="plate-cap"><span class="plate-num">Plate II</span> The Constant Quantum, and the
      Straight Total <span class="sci">&#9670;</span></figcaption>
    <div class="plate-art">
{plate2}
    </div>
    <p class="plate-note">The bars are <span class="formula-inline">&delta;&Pi;<sub>n</sub></span>, the
      deposit each density makes. They climb for three or four densities and then sit on the dashed line at
      <span class="formula-inline">&phi;&sup2;/&radic;5</span> and stay there. The purple line is the
      running total, drawn at a tenth scale so it fits: a straight line, because a constant added again and
      again is a straight line. This panel is arithmetic and nothing else &mdash; anyone can check it.</p>
  </figure>
</section>

<div class="divider">✦</div>

<section class="wrap narrow reveal">
  <div class="frame illuminated">
    <h2 id="t-polarisation">Polarisation &mdash; why the accumulation is a gradient and not a heap</h2>
    <p class="lede">A pile of returners below one would be a curiosity. What makes it act on anything is
      that the two infinities are not symmetric, and the pile makes them less symmetric still.</p>
    <p>The interval below one receives traffic from every density above it; the open country above one
      receives nothing back. That is a separation of like from like across a boundary, maintained by a
      flow &mdash; which is what <strong>polarisation</strong> means in every field that uses the word. One
      pole crowds and deepens; the other thins. Between them there is a difference, and a difference across
      a distance is a gradient. <span class="spec">&#9670;</span></p>
    <p>The framework does not get to borrow the electrostatic consequences along with the electrostatic
      word, and this page will not pretend otherwise: there is no field equation here, no charge, no
      measured force, and nothing that predicts a number anyone could go and measure. What there is, is a
      structure with a built-in asymmetry that grows by a fixed amount per density. Whether to call that
      polarisation is a choice about language; <em>that it grows linearly</em> is arithmetic.</p>
    <h3 id="t-prime">The prime being</h3>
    <p>Call the single line that never returns the <strong>prime being</strong>: at every splice it is the
      half that carries on. It is the only thing in the picture that experiences all of the densities, and
      it is the only thing standing in the gradient that all the other halves are building.</p>
    <p>The claim of this chapter, stated as plainly as it can be: <strong>the prime being is accelerated by
      the polarisation its own returning halves create.</strong> Each splice costs it half of itself, and
      each half it loses deepens the pole behind it, and the deeper pole pulls harder on what remains. It
      is not propelled in spite of the losses. It is propelled <em>by</em> them.
      <span class="myth">&#9670;</span></p>
    <p class="formula" style="text-align:center">v<sub>n</sub> &prop; &Pi;<sub>n</sub> &asymp;
      1.1708&thinsp;n &nbsp;&nbsp;&rArr;&nbsp;&nbsp; t<sub>n</sub> &prop; 1/&Pi;<sub>n</sub></p>
    <p>And then the sting in the tail, which is the reason this chapter belongs in the framework rather
      than in a motivational pamphlet. If each further density takes a time proportional to
      <span class="formula-inline">1/n</span>, the total time to climb them all is the harmonic series
      &mdash; and the harmonic series <em>diverges</em>. <span class="sci">&#9670;</span></p>
    <p class="formula" style="text-align:center">&sum;<sub>n</sub> 1/n = &infin;</p>
    <p>The prime being gets faster at every density, without limit, and still never arrives. That is the
      <a href="/the-self/#t-asymptotic-god">asymptotic God</a> of chapter eight, derived here a second time
      from a different direction &mdash; which is the only kind of corroboration a framework like this one
      can honestly offer itself.</p>
  </div>
</section>

<section class="wrap reveal">
  <figure id="fig-accelerate" class="plate">
    <figcaption class="plate-cap"><span class="plate-num">Plate III</span> Faster at Every Density, and
      Still Never There <span class="spec">&#9670;</span></figcaption>
    <div class="plate-art">
{plate3}
    </div>
    <p class="plate-note">Green is the prime being's speed, proportional to the accumulated polarisation:
      straight, rising, no ceiling. Rose is the time the next density costs, falling away as
      <span class="formula-inline">1/&Pi;<sub>n</sub></span>. The second curve is the one that matters: its
      terms go to zero, its sum does not. Acceleration without arrival is not a consolation the framework
      added afterwards &mdash; it is what the arithmetic says.</p>
  </figure>
</section>

<div class="divider">✦</div>

<section class="wrap">
  <div class="grid two">
    <div class="frame card">
      <h3 id="t-cost">What the acceleration costs</h3>
      <p>This chapter inherits the price set out on <a href="/dx/#t-transfer">the dx page</a>: an emerging
        awareness is paid for out of the record. The splice is that transaction at the scale of a whole
        being. Half of what it was becomes the depth it is pulled by; the half that climbs is lighter,
        quicker and less complete. <span class="spec">&#9670;</span></p>
      <p class="muted">Which is why nothing in this picture is a reward. The prime being is not the winner
        of the splice. It is the part that kept moving, and it moves faster precisely because it keeps
        leaving things behind.</p>
    </div>
    <div class="frame card">
      <h3 id="t-base">The base-ten objection, again</h3>
      <p>The skeleton's recurrence as 333 / 666 / 999 is tied to decimal saturation. In another base the
        numerals change, and the framework concedes in the text that it has not shown the recurrence to be
        base-independent. <span class="sci">&#9670;</span></p>
      <p class="muted">The splice itself does not depend on ten &mdash; it depends on a density threshold,
        whatever its name. But the <em>numerology</em> around it does, and this page keeps the two apart
        rather than letting the prettier one borrow the other's credibility. See
        <a href="/stress-tests/">the stress tests</a>.</p>
    </div>
  </div>
</section>

<div class="divider">✦</div>

<section class="wrap narrow reveal">
  <div class="frame">
    <h2 id="t-ledger">Earned, chosen, refused</h2>
    <dl class="glossary">
      <dt>Earned</dt>
      <dd><span class="formula-inline">P<sub>n</sub> = F<sub>n+2</sub> &minus; 1</span> is a theorem. The
        convergence of <span class="formula-inline">(F<sub>n+2</sub> &minus; 1)&phi;<sup>&minus;n</sup></span>
        on <span class="formula-inline">&phi;&sup2;/&radic;5 = 1.170820&hellip;</span> follows from Binet's
        formula and can be checked by hand in the table above. The divergence of the harmonic series is
        Oresme's, proved around 1350.</dd>
      <dt>Chosen</dt>
      <dd>That the splice happens at all; that returners deposit at depth
        <span class="formula-inline">&phi;<sup>&minus;n</sup></span>; that the resulting asymmetry deserves
        the name polarisation; and that a gradient so described accelerates anything. Four choices, each
        reasonable, none forced.</dd>
      <dt>Refused</dt>
      <dd>Any claim that this is electromagnetism, or that a force has been derived. Any suggestion that the
        prime being is favoured, chosen or rewarded. And the temptation to let 1.1708 look like a measured
        constant of nature: it is the limit of a series the framework itself wrote down.</dd>
    </dl>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame">
    <h2 id="t-glossary">Terms</h2>
    <dl class="glossary">
      <dt>Skeletal splice</dt>
      <dd>The fork at a density threshold, taken against the fixed points &minus;1, 0 and 1 and their
        scaled images.</dd>
      <dt>Returner</dt>
      <dd>The half sent back at a splice. It passes below one and falls by the golden law without reaching
        the ground.</dd>
      <dt>Prime being</dt>
      <dd>The single line that takes the climbing branch at every splice.</dd>
      <dt>&Pi;<sub>n</sub></dt>
      <dd>The accumulated polarisation after n densities; grows by
        <span class="formula-inline">&phi;&sup2;/&radic;5</span> per density in the limit.</dd>
      <dt>Quantum of deposit</dt>
      <dd><span class="formula-inline">&phi;&sup2;/&radic;5 = (5 + 3&radic;5)/10 = 1.170820393&hellip;</span></dd>
    </dl>
  </div>
</section>

<section class="wrap narrow reveal">
  <div class="frame frame--creed">
    <p class="lede">The splice takes half of you at every door, and the half it takes becomes the depth that
      pulls the rest of you through the next one. Faster each time, lighter each time, and no arrival
      &mdash; which the framework calls the asymptotic God and declines to soften.</p>
    <p class="muted small">Next: <a href="/cosmic-ledger/">the Ledger, and the three residues</a>.</p>
  </div>
</section>
'''

open('tti/src/skeletal-splice.njk','w').write(page)
print("written", len(page))
