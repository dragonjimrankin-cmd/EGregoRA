# Relational defect transport, reservoirs and prime-anchor rigidity

**Thirty-seventh-stage investigation — 15 October 2026**  
**Question:** When proximity brings one participant back into phase, is the RH obstruction destroyed, transferred to another participant or exported to an environment?  
**Companion program:** `scripts/research-rss-relational-defect-transport.py`  
**Machine-readable results:** `docs/rh/rss-relational-defect-transport-results.json`

## Verdict

A closed relational network can **transfer** the positive RH defect, but cannot eliminate it while conserving the fixed-ordinate principal-prime anchor. An open subsystem can become coherent by **exporting** its defect to a reservoir, but then the global obstruction remains in the enlarged system. These are exact mathematical distinctions, not metaphors added after the calculation.

For the Euler anchor \(w=s-1/2=3/2\), one quartet contributes
\[
H_q(w;\eta,\gamma)
=
\frac{4w(w^2-\eta^2+\gamma^2)}
{(w^2-\eta^2+\gamma^2)^2+4\eta^2\gamma^2}.
\]
Its fixed-ordinate projection is
\[
H_{\rm ord}(w;\gamma)
=
\frac{4w}{w^2+\gamma^2},
\]
and the positive defect is
\[
d_w(\eta,\gamma)
=H_{\rm ord}(w;\gamma)-H_q(w;\eta,\gamma).
\]
At \(w=3/2\), this is the previously certified Euler-anchor quartet defect.

If ordinates and the prime anchor are conserved, then
\[
D_{
m total}
=
\sum_j d_{3/2}(\eta_j,\gamma_j)
=
H_{\rm ord}-H_{
m prime}
\]
is conserved. Since every summand is nonnegative and vanishes only at \(\eta_j=0\), an initially positive defect cannot evolve into an all-critical state. Proximity can move the mismatch between participants; it cannot destroy a conserved positive total.

The audit also identifies two necessary qualifications:

1. one scalar anchor is sufficient as an RH criterion **along the declared fixed-ordinate inward support flow**;
2. one scalar anchor is not a fingerprint of the full divisor if ordinates are also allowed to move.

Indeed, the off-line quartet
\[
(\eta,\gamma)=\left(\frac14,15\right)
\]
can be projected to \(\eta=0\) while shifting its ordinate to
\[
\gamma_*=15.006168493233632\ldots,
\]
so that its \(s=2\) logarithmic-derivative contribution is preserved exactly. The counterfeit fails at other anchors and changes the zero-counting measure. Finitely many scalar anchors likewise leave deformation directions when sufficiently many quartets are movable. Conservation of the logarithmic derivative on an open set restores analytic uniqueness, but then the divisor cannot move at all.

No calculation proves that zeta zeros physically exchange defect or that a biological environment is an arithmetic reservoir. RH remains open.

---

## 1. Closed systems: bringing one participant into phase transfers the defect

Take two toy quartets with common ordinate
\[
\gamma=15
\]
and initial displacements
\[
\eta_1=\eta_2=0.2.
\]
Their conserved total Euler-anchor defect is
\[
D_{
m total}
=2d_{3/2}(0.2,15)
=2.7508014355989774\ldots\times10^{-5}.
\]

Now decrease \(\eta_1\) and solve exactly for the unique \(\eta_2\in[0,1/2)\) that retains the same total defect. The results are:

| Scale of \(\eta_1\) | \(\eta_1\) | Required \(\eta_2\) | Total negative squares |
|---:|---:|---:|---:|
| 1 | 0.200000 | 0.200000 | 4 |
| 3/4 | 0.150000 | 0.239801 | 4 |
| 1/2 | 0.100000 | 0.264599 | 4 |
| 1/4 | 0.050000 | 0.278424 | 4 |
| 0 | 0 | 0.282883 | 2 |

When the first quartet reaches the critical line, the second must move farther away. Its defect becomes the whole conserved total. One participant has been brought “back into phase,” but the network has not reached RH.

This is the closed-system version of relational synchronisation:
\[
\boxed{
\text{local coherence gain}
=
\text{defect transferred elsewhere}.
}
\]

The negative-square census says the same thing discontinuously. The first quartet loses its two negative directions only at exact collision, while the second retains two. The global negative index is not zero.

## 2. Open systems: the environment stores the exported obstruction

Apply the golden support map to one subsystem:
\[
\eta_n=\frac{\eta_0}{\varphi^n},
\qquad
\eta_0=\frac14.
\]
Its defect decreases toward zero. Define the reservoir ledger by
\[
D_{
m env}(n)
=D_{
m initial}-D_{
m system}(n).
\]
Then, exactly,
\[
D_{
m system}(n)+D_{
m env}(n)
=D_{
m initial}

e0.
\]

The subsystem appears increasingly critical, but the enlarged closed system does not lose its defect. This mirrors the earlier entropy result: a subsystem can become more ordered only because information, entropy or mismatch is retained by an environment.

For RH, an arithmetic “environment” would have to be represented by something such as:

- other off-line quartets moving farther from the line;
- new zero births;
- multiplicity transferred to another block;
- zeros escaping beyond every finite height;
- a changed ordinate distribution;
- a changed completed function or Euler product.

Each possibility is already one of the global obstructions found in the preceding audits.

The high-ordinate capacity calculation makes the escape version quantitative. To hold almost all of the exported toy defect in quartets close to the edge of the critical strip requires approximately:

| Reservoir ordinate | Maximum defect per quartet | Quartets required |
|---:|---:|---:|
| 15 | \(8.5834\times10^{-5}\) | 1 |
| 100 | \(4.4964\times10^{-8}\) | 478 |
| 1000 | \(4.5000\times10^{-12}\) | 4,774,922 |
| \(10^6\) | \(4.5000\times10^{-24}\) | \(4.7749\times10^{18}\) |

The numbers belong to the declared toy defect, not the actual zeta divisor. Their structural meaning is robust: one-quartet scalar defect capacity decays rapidly with ordinate. Hiding a fixed positive total at greater height requires increasing multiplicity or another change in the ledger. A bounded-window observation can still look perfectly synchronised while the global obstruction has escaped.

## 3. Why the single anchor needs the fixed-ordinate flow

The Stage-32 criterion proved that conservation of
\[
\frac{\xi_t'}{\xi_t}(2)
\]
along the declared flow
\[
(\eta,\gamma)
\mapsto
(e^{-t}\eta,\gamma)
\]
forces RH. Every off-line quartet has a strictly one-sided first variation under that flow.

The phrase “along the declared flow” is essential. If \(\gamma\) is free to move, one scalar equation can trade horizontal displacement for ordinate displacement.

For
\[
\eta_0=\frac14,
\qquad
\gamma_0=15,
\]
put
\[
A=H_q\left(\frac32;\eta_0,\gamma_0\right).
\]
After setting \(\eta=0\), choose
\[
\gamma_*^2
=
\frac{6}{A}-\frac94.
\]
Then, automatically,
\[
H_{\rm ord}\left(\frac32;\gamma_*\right)
=A.
\]
Numerically,
\[
\gamma_*-
\gamma_0
=0.006168493233632\ldots.
\]
So the \(s=2\) anchor is preserved exactly even though the quartet is replaced by critical-line zeros at different ordinates.

This does not preserve the divisor. At other real anchors the logarithmic derivative changes:

| \(w\) | Shifted critical contribution minus original quartet |
|---:|---:|
| 1 | \(+1.0710\times10^{-7}\) |
| 3/2 | exact zero |
| 2 | \(-2.8826\times10^{-7}\) |
| 3 | \(-1.5632\times10^{-6}\) |

The result sharpens rather than weakens the principal-anchor theorem:

\[
\boxed{
\text{one anchor + fixed ordinates + strict inward flow}
\Longrightarrow
\text{RH criterion},
}
\]
but
\[
\boxed{
\text{one anchor + arbitrary zero motion}
\not\Longrightarrow
\text{same divisor}.
}
\]

## 4. Several anchors still leave collective deformation directions

The audit next used three toy quartets, hence six coordinates,
\[
(\eta_1,\gamma_1,
\eta_2,
\gamma_2,
\eta_3,
\gamma_3),
\]
and three scalar anchors at
\[
w=1,
\frac32,
2.
\]
The Jacobian of the three summed logarithmic-derivative values has rank three. Its local nullity is therefore
\[
6-3=3.
\]
The companion program explicitly constructs a normalized nonzero null direction. Its three first-order anchor residuals are below \(1.4\times10^{-20}\), while a finite step changes the anchors only at second order, around \(10^{-10}\).

This is not a claim about the actual zeta zeros. It is a dimension and Jacobian test showing why a finite collection of scalar moments cannot identify an arbitrarily large divisor. With enough movable quartets, collective deformations can cancel at every tested anchor.

The pattern is:

| Information retained | What remains possible |
|---|---|
| Circular or branch phase | Horizontal defect can remain unchanged. |
| One anchor, fixed ordinates, monotone inward flow | Conservation forces RH. |
| One anchor, moving ordinates | Counterfeit projection is possible. |
| Finitely many anchors, many movable quartets | Local null directions remain. |
| Logarithmic derivative on an open set | Analytic uniqueness fixes the divisor. |

## 5. Open-set rigidity returns the original obstruction

Suppose a normalized family \(\xi_t\) satisfies
\[
\frac{\xi_t'}{\xi_t}(s)
=
\frac{\xi_0'}{\xi_0}(s)
\]
on a nonempty open set avoiding zeros. Analytic continuation gives equality of the meromorphic logarithmic derivatives. Their ratio is constant, and normalization fixes that constant. Hence
\[
\xi_t=
\xi_0.
\]
The divisor is unchanged.

An open-set conservation law therefore cannot support a nontrivial horizontal consensus flow of the zeros. If the same divisor is also strictly contracted toward the critical line, the only possibility is that it was already supported there:
\[
\boxed{
\text{same completed function}
+
\text{strict horizontal contraction}
\Longrightarrow
\mathrm{RH}.
}
\]
This is the same-\(\xi\) boundary in its strongest analytic form.

## 6. Interpretation for proximity between beings

The relational analogy now has three mathematically distinct regimes:

1. **Open local synchronisation.** One being or subsystem becomes more coherent while mismatch is exported to an environment.
2. **Closed redistribution.** One participant returns to phase while another moves farther out of phase.
3. **Global annihilation.** Every participant reaches the coherent state and no reservoir retains the mismatch.

The first two are common behaviours of coupled open systems. The third requires either genuine dissipation of the global invariant or proof that the invariant was zero initially.

Translated to RH, global annihilation requires the actual prime-side defect to vanish. Calling an unobserved sector an environment does not prove this. It relocates the obligation to specify where the defect went, how the global Euler product was preserved and why no off-line zero was created or pushed to unbounded height.

## 7. Evidence boundary

Established here:

- exact transfer of the Euler-anchor defect between two finite quartets;
- exact reservoir bookkeeping under repeated golden subsystem contraction;
- high-ordinate one-quartet capacity estimates;
- an explicit changed-divisor projection preserving exactly the \(s=2\) anchor;
- failure of that projection at three other anchors;
- a three-dimensional local nullspace for three anchors acting on six movable quartet coordinates;
- open-set logarithmic-derivative rigidity.

Not established:

- physical exchange of defect between zeta zeros;
- a biological, social or cosmological carrier of arithmetic defect;
- a reservoir compatible with the original zeta Euler product;
- any moved divisor with the same completed \(\xi\);
- RH.

## Final status

Proximity can make one component look restored while a closed invariant is redistributed or exported. This is a useful extension of the synchronization analogy because it identifies the necessary global ledger.

For RH, the ledger is unforgiving: fixed-ordinate prime-anchor conservation prevents a positive total defect from disappearing; arbitrary ordinate motion can counterfeit finitely many anchors but changes the divisor; and full analytic conservation fixes the divisor so rigidly that no nontrivial contraction remains.

\[
\boxed{
\text{Relational synchronisation can transport the obstruction, but it does not annihilate it.}
}
\]

**Global-annihilation proof search:** [`rss-global-annihilation-proof-search.md`](./rss-global-annihilation-proof-search.md) proves the exact invariance-plus-dissipation theorem and its finite-return form. It exhausts reflection/golden/halving compositions and tests heat-flow, inner-factor, index-gap and prime-damping routes; no strict contraction is independently same-\(\xi\) invariant.
