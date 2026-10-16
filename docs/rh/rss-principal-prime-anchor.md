# Searching for the missing principal-prime conservation law

**Thirty-second-stage investigation — 15 October 2026**  
**Question:** Can an independent principal-prime or completed-logarithmic-derivative conservation law force the horizontal-residue variation to vanish?  
**Companion program:** `scripts/research-rss-principal-prime-anchor.py`  
**Machine-readable results:** `docs/rh/rss-principal-prime-anchor-results.json`

## Verdict

No independent conservation law was proved. The search does, however, reduce the required prime-side statement much further than full stationarity on an open half-plane.

One absolutely convergent Euler-product anchor is enough. Let
\[
H_t(w)
=\frac{\xi_t'}{\xi_t}\!\left(\frac12+w\right),
\]
where \(\xi_t\) is the centrally normalised canonical product obtained by transporting every hypothetical off-line quartet by
\[
(\eta,\gamma)
\longmapsto
(e^{-t}\eta,\gamma).
\]
At the single point \(s=2\), so \(w=3/2\), the investigation proves
\[
\boxed{
\mathrm{RH}
\iff
\left.\frac d{dt}H_t(3/2)\right|_{t=0}=0
\iff
\left.\frac d{dt}\mathcal R_{\rm hor}(t)\right|_{t=0}=0.
}
\]
Every off-line quartet contributes strictly positively to the first variation of \(H_t(3/2)\) and strictly negatively to the first variation of the horizontal residue. More strongly, the two variations are termwise comparable:
\[
1.4269\ldots
\left(-\frac{d\mathcal R_{\rm hor}}{dt}\right)
\le
\frac d{dt}H_t(3/2)
\le
1.5196\ldots
\left(-\frac{d\mathcal R_{\rm hor}}{dt}\right).
\]

The anchor is genuinely principal-prime and absolutely convergent for the actual \(\xi\):
\[
\boxed{
\frac{\xi'}{\xi}(2)
=
\frac32-\frac{\gamma_{\!E}+\log\pi}{2}
-
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}.
}
\]
Numerically it is
\[
\frac{\xi'}{\xi}(2)
=0.069066231530\ldots.
\]
Thus the missing theorem no longer has to assert equality of completed logarithmic derivatives throughout \(\Re s>1\). Conservation of this one scalar along the transported divisor would force the horizontal-residue variation to vanish and would prove RH.

The decisive gap remains. The von Mangoldt sum on the right is static, but the transported canonical product \(\xi_t\) is not independently known to possess the same Euler product for \(t>0\). Equating its logarithmic derivative to the fixed prime scalar is precisely the missing compatibility between the auxiliary zero flow and the actual zeta function. Static primes do not by themselves make a synthetically moved divisor arithmetic. The sought conservation law therefore remains unproved, and RH remains open.

---

## 1. An absolutely convergent prime anchor

Start from
\[
\xi(s)
=
\frac12s(s-1)\pi^{-s/2}\Gamma(s/2)\zeta(s).
\]
Logarithmic differentiation at \(s=2\) gives
\[
\frac{\xi'}{\xi}(2)
=
\frac12+1-\frac12\log\pi
+\frac12\psi(1)
+\frac{\zeta'}{\zeta}(2).
\]
Since \(\psi(1)=-\gamma_E\) and the Euler product converges absolutely at two,
\[
\frac{\zeta'}{\zeta}(2)
=-\sum_{n\ge2}\frac{\Lambda(n)}{n^2}.
\]
Therefore
\[
\boxed{
\mathcal P_2
:=
\frac32-\frac{\gamma_E+\log\pi}{2}
-
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}
=
\frac{\xi'}{\xi}(2).
}
\]

This is a much smaller arithmetic target than the earlier all-index Laguerre bound or the critical Chebyshev-energy theorem. It uses one fixed, absolutely convergent von Mangoldt moment. The companion program enumerates 78,734 prime-power terms through one million and obtains a partial completed value within about \(10^{-6}\) of the independently evaluated anchor.

The small target is sufficient only because the chosen zero flow has a one-sided effect at this point. A generic deformation need not have that property.

## 2. The ordinate anchor and its positive defect

Use the centred coordinate
\[
z=s-\frac12.
\]
For an off-line quartet with upper representative
\[
a=\eta+i\gamma,
\]
the exact logarithmic-derivative contribution is
\[
H_q(w)
=
\frac{2w}{w^2-a^2}
+
\frac{2w}{w^2-\overline a^{\,2}}.
\]
Projecting both upper zeros to the critical line while retaining their ordinate and multiplicity gives
\[
H_{{\rm ord},q}(w)
=
\frac{4w}{w^2+\gamma^2}.
\]
The earlier ordinate-splice calculation found
\[
H_q(w)-H_{{\rm ord},q}(w)
=
\frac{
4w\eta^2(w^2-\eta^2-3\gamma^2)
}{
(w^2+\gamma^2)
\left[(w^2-\eta^2+\gamma^2)^2+4\eta^2\gamma^2\right]
}.
\]

At \(w=3/2\), every nontrivial zero obeys
\[
\eta^2+3\gamma^2>\frac94.
\]
Consequently
\[
H_{{\rm ord},q}(3/2)-H_q(3/2)>0
\]
for every off-line quartet. Summing gives the exact Euler-anchor defect
\[
\boxed{
\begin{aligned}
\mathcal D_2
&:=H_{\rm ord}(3/2)-\frac{\xi'}{\xi}(2)\\
&=\sum_{\rm quartets}
\frac{
6\eta^2(\eta^2+3\gamma^2-9/4)
}{
(\gamma^2+9/4)
\left[(\gamma^2-\eta^2+9/4)^2+4\eta^2\gamma^2\right]
}.
\end{aligned}
}
\]
Here
\[
H_{\rm ord}(3/2)
=
\sum_{\rho:\,\Im\rho>0}
\frac{3m(\rho)}{\gamma_ho^2+9/4},
\]
with multiplicity. Both sides converge absolutely.

It follows that
\[
\mathcal D_2\ge0,
\qquad
\mathcal D_2=0
\iff
\mathrm{RH}.
\]
This is a one-point Euler-half-plane counterpart of the central horizontal residue. The prime term is explicit; the ordinate term is fixed by the unconditional zero-counting measure. Proving their equality would still prove RH.

## 3. First variation at the Euler anchor

For one quartet put
\[
e=\eta^2,
\qquad
g=\gamma^2,
\qquad
A=e+g,
\]
and
\[
Q_{\eta,\gamma}(w)
=w^4+2(g-e)w^2+A^2.
\]
Along \(\dot\eta=-\eta\),
\[
\partial_t\log Q
=
\frac{4e(w^2-A)}{Q}.
\]
Differentiating with respect to \(w\) gives the completed-logarithmic-derivative variation
\[
\boxed{
\partial_t\!\left(\frac{Q'}Q\right)(w)
=
\frac{
8ew\left[-w^4+2Aw^2+A(3g-e)\right]
}{Q(w)^2}.
}
\]

The polynomial in square brackets is positive throughout a large initial real interval. With \(y=w^2\), its positive root is
\[
y=A+2\gamma\sqrt A.
\]
Every nontrivial zeta zero has \(\gamma^2>199\), while \(e<1/4\). The anchor value \(y=9/4\) is therefore far inside the positive interval. Hence
\[
\boxed{
\left.\frac d{dt}H_t(3/2)\right|_{t=0}>0
}
\]
whenever even one off-line quartet exists.

The differentiated summands are \(O(\eta^2/\gamma^4)\), so the total variation converges. Reflection cannot cancel it: the formula is even in \(\eta\), and reflected partners add.

This proves the one-point criterion
\[
\boxed{
\mathrm{RH}
\iff
\left.\frac d{dt}
\frac{\xi_t'}{\xi_t}(2)
\right|_{t=0}=0.
}
\]
It is weaker in the amount of data requested than full stationarity, but not weaker in logical strength.

## 4. Quantitative bridge to horizontal-residue dissipation

For the same quartet, the magnitude of the central horizontal-residue loss is
\[
-\frac{dr}{dt}
=
\frac{8e(3g-e)}{(e+g)^3}.
\]
Introduce the dimensionless variables
\[
x=\frac eg,
\qquad
u=\frac{9}{4g}.
\]
At the Euler anchor the ratio of variations is
\[
\frac{
\partial_t(Q'/Q)(3/2)
}{-\partial_t r}
=
\frac32
\frac{
P(x,u)(1+x)^3
}{
(3-x)D(x,u)^2
},
\]
where
\[
P(x,u)
=-u^2+2(1+x)u+(1+x)(3-x),
\]
\[
D(x,u)
=u^2+2(1-x)u+(1+x)^2.
\]

The strip and first-zero bounds give
\[
0\le x\le\frac1{796},
\qquad
0\le u\le\frac9{796}.
\]
Elementary rational interval bounds then yield
\[
\frac{150544547934}{105500886481}
<
\frac{
\partial_t(Q'/Q)(3/2)
}{-\partial_t r}
<
\frac{1456197119514729}{958307065033472}.
\]
Numerically,
\[
1.4269505\ldots
<
\frac{
\partial_t(Q'/Q)(3/2)
}{-\partial_t r}
<
1.5195517\ldots.
\]

Because the inequalities are termwise and every term has the same sign, they survive summation over the complete divisor:
\[
1.4269\ldots(-\dot{\mathcal R}_{\rm hor})
\le
\dot H_t(3/2)
\le
1.5196\ldots(-\dot{\mathcal R}_{\rm hor}).
\]
This is the requested direct bridge. Conserving the completed logarithmic derivative at one Euler point forces the horizontal-residue variation to vanish quantitatively, not merely by a chain of qualitative equivalences.

## 5. Why the static prime moment is not yet a conservation law

The prime scalar
\[
\mathcal P_2
=
\frac32-\frac{\gamma_E+\log\pi}{2}
-
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}
\]
is of course static: the auxiliary zero flow does not alter the ordinary primes. The invalid step would be to conclude immediately that
\[
H_t(3/2)=\mathcal P_2
\]
for the transported canonical product.

The identity
\[
H_0(3/2)=\mathcal P_2
\]
holds because \(\xi_0=\xi\) has the zeta Euler product. For \(t>0\), an off-line quartet has been moved and the resulting canonical product is a different entire function. No Dirichlet series, Euler product or automorphic object has been derived for it. The fixed von Mangoldt ledger and the moving divisor are then two independently defined objects.

If one assumes that every \(\xi_t\) has the same completed Euler product, Euler-product uniqueness makes every \(\xi_t\) the same function and proves stationarity. At the infinitesimal level, the strict anchor variation shows that this can happen only under RH. Therefore
\[
\text{“the primes are unchanged”}
\]
is not the missing theorem. The missing theorem is an intertwining statement showing that the synthetic divisor flow remains represented by those unchanged primes. That statement is exactly what has not been established.

## 6. Candidate conservation mechanisms tested

| Candidate | Outcome |
|---|---|
| Fixed moment \(\sum\Lambda(n)n^{-2}\) | Absolutely convergent and static, but tied to \(\xi_t'/\xi_t(2)\) only at \(t=0\) without a transported Euler product. |
| Same Euler product for all \(t\) | Would conserve the anchor, but analytic uniqueness already gives same-\(\xi\) stationarity. |
| Functional reflection | Quartet variation is even in \(\eta\); reflected terms add instead of cancel. |
| Central normalisation | Multiplying \(\xi_t\) by a scalar leaves its logarithmic derivative unchanged. |
| Möbius extraction and divisor return | Recover the principal von Mangoldt ledger algebraically but supply no evolution intertwining it with the moved divisor. |
| Fixed archimedean completion | Its derivative has no \(t\)-variation and therefore cannot cancel the strictly positive zero variation. |
| \(K_\kappa\) natural-gradient geometry | Derives \(\dot\eta=-\eta\), but that flow strictly increases the Euler anchor whenever off-line support exists. |

The new scalar criterion makes the failure especially clear. No complicated all-scale cancellation is needed after conservation is available; the problem is deriving even one point of conservation for a divisor that the flow otherwise changes.

## 7. Minimal missing theorem

A sufficient independent statement is now:
\[
\boxed{
\left.
\frac d{dt}
\frac{\xi_t'}{\xi_t}(2)
\right|_{t=0}
=0,
}
\]
or, more arithmetically, prove for \(t\) near zero that
\[
\boxed{
\frac{\xi_t'}{\xi_t}(2)
=
\frac32-\frac{\gamma_E+\log\pi}{2}
-
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}.
}
\]
The right side is an independently defined principal-prime scalar. The left side belongs to the transported divisor. The quantitative comparison then gives
\[
\dot{\mathcal R}_{\rm hor}=0,
\]
and strict negativity of every off-line residue term gives RH.

What has been proved is that this single anchor would suffice and that it is coercively equivalent to residue stationarity. What has not been proved is the displayed equality for \(t\ne0\). Neither completion symmetry, static primes, Möbius inversion nor the \(\kappa\) geometry supplies it.

The conservation-law search therefore sharpens the target but does not close it. RH remains open.

**Prime-phase retry:** [`rss-prime-phase-conservation.md`](./rss-prime-phase-conservation.md) proves the weighted endpoint-completed phase identity for \(\sigma>1\). Its attempted continuation to \(\sigma=1/2\) acquires exactly the positive off-line Blaschke defect, so boundary conservation remains RH-equivalent.

**Prime-pair splice follow-up:** [`rss-prime-pair-splice-link.md`](./rss-prime-pair-splice-link.md) makes explicit that \(\Lambda(101)/101^2\) is already one term of the \(s=2\) prime anchor, while the exact horizontal defect is a positive sum over all off-line quartets. The anchor is a bridge, but its equality condition is still RH-strength.
