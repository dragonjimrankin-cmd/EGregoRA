# Attempting global positivity of the Riemann screw kernel

**Sixth-stage investigation — 14 October 2026**<br>
**Question:** Can the exact prime-power dynamics, recovery structure, or the Rankin \(\kappa\)-kernel prove
\[
G_g\succeq0,
\qquad\text{equivalently}\qquad
\Psi(t)\ge 0\quad(t\in\mathbb R)?
\]
**Companion program:** `scripts/research-rss-global-screw-positivity.mjs`<br>
**Machine-readable results:** `docs/rh/rss-global-screw-positivity-results.json`

## Verdict

No proof of the infinite statement has been found. The attempt does, however, reach a sharper and more useful boundary than “this is equivalent to RH”.

The positive half-line can be organized into finite negative-slope episodes. Every such episode has a last active prime-power event—a **recovery witness**—and the only remaining sign test at that witness is
\[
\boxed{\mathcal J_q\le \mathcal C_q.}
\]
Here \(\mathcal J_q\) is one nonnegative, logarithmically smoothed von Mangoldt cost and \(\mathcal C_q\) is an exact capacity determined by the entry state and terminal load. Equivalently, for a multi-event episode, the weighted logarithmic arrival centroid must satisfy
\[
\boxed{
c_q\ge 1-\frac{\mathcal C_q}{(s-a)P_q^-}.}
\]
This is the sharp scalar target. It is not a fixed-margin estimate: the available slack is exactly the reserve, and reserves must approach zero along subsequences.

Two additional obstructions have now been proved explicitly inside the RSS route:

1. **Prime-power hinges do not give positive kernels term by term.** Every delayed hinge \(h_a(t)=(|t|-a)_+\) has an indefinite \(2\times2\) stationary-increment matrix. Positive Mangoldt coefficients therefore do not turn the arithmetic loading into a Loewner-positive sum.
2. **Primitive extraction is signed.** Recovering \(\Lambda\) from the all-integer repetition ledger uses
   \[
   \Lambda(n)=\sum_{d\mid n}\mu(d)\log(n/d),
   \]
   so Möbius signs enter before the exact prime-power forcing is obtained. The positive scalar \(\kappa_{\rm R}=1/(4\pi^2)\) cannot make that inversion order-preserving.

Consequently, the RSS and \(\kappa\) constructions do identify the right Green geometry and the exact transform into \(K_\xi\), but they do not currently supply the missing **signed arithmetic level–area inequality**. Proving that inequality at every recovery witness would prove RH; no known unconditional prime-number estimate establishes it.

A separate [source-forensic audit of the earlier positivity lemma](./rss-earlier-positivity-lemma-audit.md) checks the full project and original 52-file archive. It identifies the valid arbitrary-finite-set lemma as positivity of the different Rankin \(\kappa\)-increment kernel, not \(G_g\), and traces the later corrections to the archive’s complete-monotonicity and Bernstein-density claims.

The subsequent [double-Möbius/Weil completion audit](./rss-double-mobius-weil-completion.md) tests whether TTI’s second inversion supplies the missing bridge. It proves that the canonical doubled operator \(P=\left(\begin{smallmatrix}0&Z\\M&0\end{smallmatrix}\right)\) is an exact involution, but its inverse face restores the all-integer ledger. The natural Green-regularised adjoint \(M^*G_\kappa M\) is PSD yet cannot equal \(G_g\): its diagonal is \(O(t^2)\), whereas Suzuki’s target is \(t\log(1/t)+O(t)\) near zero.

---

## 1. Claim boundary and sources

The starting point is Suzuki’s arithmetic screw potential. With \(g=-\Psi\), its stationary-increment kernel is
\[
G_g(x,y)=g(x-y)-g(x)-g(-y)+g(0)
       =\Psi(x)+\Psi(y)-\Psi(x-y).
\]
Suzuki proves the special equivalence
\[
\mathrm{RH}
\iff G_g\succeq0\text{ on every finite real point set}
\iff \Psi(t)\ge0\text{ for every real }t.
\]
The scalar-to-kernel implication is special to this arithmetic function; it is not a generic fact about an arbitrary nonnegative function.

The exact formula for \(\Psi\), its connection with Weil positivity, and the screw-function criterion come from Masatoshi Suzuki, [*Aspects of the screw function corresponding to the Riemann zeta-function*](https://arxiv.org/abs/2206.03682).

This stage also inspected the exact definitions and proofs in Rainer Mittermeier’s August 2026 five-part preprint series:

- [Part 2: directed prime-power certificate and Chebyshev memory](https://zenodo.org/records/22076060);
- [Part 3: active reserve and smoothed cost](https://zenodo.org/records/22076071);
- [Part 4: recovery witnesses and service-clock geometry](https://zenodo.org/records/22076079);
- [Part 5: terminal-episode exclusion, classical bridge and no-floor theorem](https://zenodo.org/records/22076088).

These are recent preprints, not a substitute for independent checking. The companion program independently reproduces the algebraic identities used below on a finite diagnostic domain. It does **not** rerun the published \(q\le10^{10}\) MPFR certificate, and its ordinary double-precision episode audit is not a directed-rounding theorem.

The statuses must remain separate:

- Suzuki’s equivalence is an external theorem.
- The published directed certificate through \(q=10^{10}\) is a finite computer-assisted result.
- The reserve, cost, centroid and classical bridge formulas are exact identities.
- The new delayed-hinge obstruction is an elementary exact calculation.
- The companion program’s counts through \(t=12\) are finite diagnostics.
- The all-witness inequality is open and RH-equivalent.

## 2. Exact arithmetic form

For \(t>0\), write
\[
\Psi(t)=A(t)-\mathcal P(t),
\]
where
\[
\mathcal P(t)=
\sum_{n\le e^t}\frac{\Lambda(n)}{\sqrt n}(t-\log n)
\]
and
\[
\begin{aligned}
A(t)={}&8\left(\cosh\frac t2-1\right)-\alpha t+C\\
&-4e^{-t/2}\sum_{m\ge0}\frac{e^{-2mt}}{(4m+1)^2},
\end{aligned}
\]
with
\[
\alpha=\frac12\left(\log(8\pi)+\gamma_E+\frac\pi2\right)
      =\frac{\zeta'(1/2)}{\zeta(1/2)},
\qquad
C=\frac{\pi^2}{4}+2G.
\]
The expression is extended evenly to negative \(t\).

At ordered prime powers \(q_j\), put
\[
\ell_j=\log q_j,
\qquad
w_j=\frac{\Lambda(q_j)}{\sqrt{q_j}},
\]
\[
W_j=\sum_{i\le j}w_i,
\qquad
L_j=\sum_{i\le j}w_i\ell_i.
\]
On \((\ell_j,\ell_{j+1})\),
\[
\Psi(t)=A(t)-W_jt+L_j.
\]
The prime-power sum is affine there, while
\[
\boxed{
A''(\log x)=\frac{x^3-x-1}{\sqrt{x}(x^2-1)}.}
\]
Its sign transition occurs at the plastic constant, below \(x=2\), and it is strictly positive and increasing throughout the arithmetic region. Thus every prime-power interval is strictly convex and has at most one stationary minimum.

This closes the local geometry. It does not close the global sign because every event decreases the derivative by \(w_j\); the inherited states \(W_j,L_j\) retain all preceding arithmetic memory.

## 3. The exact classical barrier

Define the weighted Chebyshev/Riesz error
\[
\mathcal S(X)=
\sum_{n\le X}\frac{\Lambda(n)}{\sqrt n}\log\frac Xn
-4\sqrt X.
\]
Then
\[
\boxed{
\Psi(\log X)
=L-\alpha\log X-\mathcal S(X)-\varrho_\infty(X),}
\]
where
\[
L=\frac{\pi^2}{4}+2G-8
 =-3.700667711373222\ldots
\]
and
\[
\varrho_\infty(X)
=4\sum_{m\ge1}\frac{X^{-(4m+1)/2}}{(4m+1)^2}
>0.
\]
Therefore the desired global theorem is exactly
\[
\boxed{
\mathcal S(X)+\alpha\log X+\varrho_\infty(X)\le L
\qquad(X\ge1).}
\]
The companion program checks the bridge at ten values through \(t=12\); the largest ordinary floating-point discrepancy is approximately
\[
1.08\times10^{-13}.
\]
This validates the implementation, not the infinite inequality.

### 3.1 Chebyshev-memory form

Let
\[
\psi(x)=\sum_{n\le x}\Lambda(n),
\qquad
R(x)=\psi(x)-x.
\]
Integration by parts gives
\[
\mathcal P(\log x)
=4\sqrt x-\log x-4+\mathcal I_R(x),
\]
with
\[
\mathcal I_R(x)=
\int_1^x R(y)y^{-3/2}
\left(1+\frac12\log\frac xy\right)dy.
\]
Hence
\[
\Psi(\log x)=B(x)-\mathcal I_R(x),
\]
where
\[
B(x)=(1-\alpha)\log x+(C-4)
+\frac4{\sqrt x}\left(1-
\sum_{m\ge0}\frac{x^{-2m}}{(4m+1)^2}
ight).
\]
One has
\[
B(x)<0\qquad(x\ge2).
\]
For example, the verifier obtains
\[
B(2)\approx-0.90015148,
\qquad
B(e^{12})\approx-19.93376823.
\]
Thus a proof needs the signed inequality
\[
\boxed{\mathcal I_R(x)\le B(x)<0.}
\]

This exposes a strict no-go for a common approach. The kernel multiplying \(R(y)\) in \(\mathcal I_R\) is positive. A symmetric estimate \(|R(y)|\le E(y)\) yields only
\[
\mathcal I_R(x)
\le
\int_1^x E(y)y^{-3/2}
\left(1+\frac12\log\frac xy\right)dy,
\]
whose right side is nonnegative. It cannot imply the required negative upper bound. The issue is not merely that known absolute estimates are numerically too large: taking absolute values destroys the sign in the logically wrong direction.

Classical zero-free-region bounds are therefore insufficient in this form. Even an RH-scale absolute estimate would not by itself restore the negative historical cancellation. A successful memory proof must keep signed information, condition on an exact state, or establish a genuinely one-sided averaged theorem.

## 4. Workload and recovery episodes

Define the right-continuous workload
\[
Y(t)=-\Psi'(t).
\]
Between events,
\[
Y'(t)=-A''(t)<0,
\]
while a prime-power event at \(q\) makes the upward jump
\[
Y^+-Y^-=\frac{\Lambda(q)}{\sqrt q}.
\]
Because \(\Psi(0)=0\),
\[
\boxed{\Psi(t)=-\int_0^tY(v)\,dv.}
\]
The weighted prefix
\[
\Sigma_{1/2}(x)=\sum_{n\le x}\frac{\Lambda(n)}{\sqrt n}

directly synchronizes with the workload:
\[
Y(\log x)
=\mathcal E_{1/2}(x)+\alpha-\mathcal R_A(x),
\]
where
\[
\mathcal E_{1/2}(x)=\Sigma_{1/2}(x)-2\sqrt x
\]
and
\[
\mathcal R_A(x)
=2\sum_{m\ge1}\frac{x^{-(4m+1)/2}}{4m+1}>0.
\]
The verifier checks this equality on sampled prime-power states with maximum displayed discrepancy about \(3.21\times10^{-13}\).

An **active episode** is a maximal interval on which \(Y>0\); there \(\Psi\) decreases. A recovery occurs when smooth service carries \(Y\) back to zero before the next event. The last active event \(q=e^s\) in that episode is its recovery witness. If \(q_{\rm next}=e^{s_+}\), it obeys the exact narrow-window condition
\[
\boxed{
0<Y(s)<A'(s_+)-A'(s).}
\]

Part 5’s terminal theorem excludes an episode that remains active forever, using the Mellin transform of the shifted weighted prefix and a Pringsheim–Landau argument. Combined with known weighted-Chebyshev oscillation, this gives infinitely many recovered episodes. This is real progress in quantifier reduction, but not in sign strength: a stable workload can repeatedly recover while its accumulated busy-period area drives \(\Psi\) below zero.

Queue stability is not an area theorem. The fact that every episode ends does not prove that the clearance entering it exceeds its drawdown.

## 5. Exact reserve and the remaining scalar inequality

Consider an episode entering at \(a\), with
\[
E=\Psi(a),
\qquad
Y_a=Y(a)>0.
\]
At a later active event \(s=\log q\), define the elapsed load
\[
P=P_0(a,s)=\sum_{a<\ell_i\le s}w_i.
\]
Let \(\tau=\tau_a(P)>s\) be the frozen recovery time, uniquely determined by
\[
A'(\tau)-A'(a)=Y_a+P.
\]
Equivalently, \(A'(\tau)=W_q\). Define
\[
S_1(a,\tau)
=(\tau-a)A'(\tau)-A(\tau)+A(a),
\]
\[
\mathcal C_q
=E-S_1(a,\tau)+(s-a)P,
\]
and
\[
\mathcal J_q
=\sum_{a<\ell_i\le s}w_i(s-\ell_i)
=\sum_{e^a<n\le q}
\frac{\Lambda(n)}{\sqrt n}\log\frac qn.
\]
Then the exact frozen reserve is
\[
\boxed{
\mathcal V_q
=A(\tau)-W_q\tau+L_q
=\mathcal C_q-\mathcal J_q.}
\]
At a recovery witness no event occurs between \(s\) and \(\tau\), so \(\mathcal V_q=\Psi(\tau)\) is the actual episode minimum. Within an episode reserves strictly decrease at successive active events; consequently only the witness must be tested.

After the finite base, the complete target is therefore
\[
\boxed{
\mathcal J_q\le\mathcal C_q
\quad\text{at every recovery witness}.}
\]
This is not a restatement at every real \(t\): it removes all idle intervals, all non-minimizing active events, and all future scheduling beyond the witness. But it remains RH-equivalent because the witness set retains every local minimum.

### 5.1 Arrival-centroid form

Put
\[
D=s-a,
\qquad
P_q^-=
\sum_{a<\ell_i<s}w_i.
\]
When \(DP_q^->0\), define
\[
c_q=
\frac{
\sum_{a<\ell_i<s}(\ell_i-a)w_i
}{DP_q^-}.
\]
Then \(0\le c_q\le1\), and a direct first-moment calculation gives
\[
\mathcal J_q=(1-c_q)DP_q^-.
\]
Thus
\[
\boxed{
\mathcal V_q\ge0
\iff
c_q\ge c_q^{\rm crit}
:=1-\frac{\mathcal C_q}{DP_q^-}.}
\]
Moreover the amount by which the centroid inequality is satisfied is exactly
\[
\boxed{
c_q-c_q^{\rm crit}
=\frac{\mathcal V_q}{DP_q^-}.}
\]

This is the sharpest scalar version found. The endpoint recovery window controls the **terminal load level**—it says that \(Y(s)\) lies in a short service interval—but does not determine the **arrival first moment** \(c_q\). A proof must prevent too much of the relevant Mangoldt load from arriving too early in each adaptively selected episode.

In elementary prime variables, the missing theorem can be written as
\[
\sum_{e^a<n<q}
\frac{\Lambda(n)}{\sqrt n}
\log\frac n{e^a}
\ge
\log\frac q{e^a}
\sum_{e^a<n<q}
\frac{\Lambda(n)}{\sqrt n}
-\mathcal C_q
\]
at every recovery witness. This is a recovery-conditioned, weighted short-interval first-moment inequality. Existing unconditional estimates for an arbitrary deterministic interval do not exploit the witness level condition sharply enough to prove it.

### 5.2 Why front-loading is not enough

The state-only bound
\[
\mathcal J_q\le DP_q^-
\]
places every prior arrival at the episode entrance. It is rigorous but discards the positive first moment. On the finite diagnostic domain through \(t=12\):

- 1,694 recovery witnesses were reconstructed;
- 313 had a nonzero multi-event centroid denominator;
- the front-loading rectangle closed 294 of those 313;
- 19 multi-event witnesses needed actual timing information.

This finite pattern is useful: most episodes are easy, while a small subset requires a timing-aware theorem. It is not an asymptotic sparsity result and cannot remove those witnesses from the universal quantifier.

The smallest audited reserve was
\[
0.0275205733535\ldots
\]
at recovery time
\[
t\approx8.0390637595,
\]
for the episode entering at prime power 3079 and witnessed at 3089 before 3109. This agrees with the fifth-stage interval-minimum diagnostic.

The narrowest normalized centroid clearance in this domain occurred for the episode entering at 149239 and witnessed at 159059:
\[
c_q\approx0.492559013,
\qquad
c_q^{\rm crit}\approx0.472806200,
\]
so
\[
c_q-c_q^{\rm crit}\approx0.019752813.
\]
These numbers are ordinary floating-point diagnostics. The much stronger published directed computation proves positivity through \(q=10^{10}\), but neither finite computation controls the tail.

## 6. Why strict convexity and Bregman bounds stop locally

At an active event \(q\), the frozen drawdown has the exact Bregman form
\[
E_q-\mathcal V_q
=A(\ell_q)-A(\tau_q)
-A'(\tau_q)(\ell_q-\tau_q).
\]
Strict convexity makes this quantity nonnegative and allows lower curvature bounds such as
\[
\min\Psi
\ge E_q-\frac{[-\Psi'(\ell_q+)]_+^2}{2m_q}.
\]
This is excellent for closing a known finite interval. It cannot prove the infinite theorem without a lower bound on the inherited clearance \(E_q\). The arithmetic history controlling \(E_q\) is exactly what reappears as signed Chebyshev memory or as the reserve capacity.

The finite critical episode illustrates the scale separation: its local drawdown is tiny relative to its inherited positive clearance. Bounding drawdown alone therefore misses the dominant global state variable.

A fixed positive lower bound for \(E_q\), \(\mathcal V_q\), or the interval minima is unavailable in principle. Unconditionally,
\[
\liminf_{t\to\infty}\Psi(t)\le0.
\]
Under RH, the zero expansion makes \(\Psi\) uniformly almost periodic and forces returns arbitrarily close to \(\Psi(0)=0\). Any completion estimate must therefore sharpen along tight witnesses rather than spend a fixed additive error.

## 7. New operator obstruction: every delayed hinge is indefinite

The prime-power part of \(\Psi\) is a positive weighted sum of delayed hinges, subtracted from \(A\):
\[
\mathcal P(t)=\sum_qw_qh_{\ell_q}(t),
\qquad
h_a(t)=(|t|-a)_+.
\]
It is tempting to seek a termwise positive-kernel comparison. That cannot work.

For one hinge define
\[
H_a(x,y)=h_a(x)+h_a(y)-h_a(x-y).
\]
Choose
\[
a<x<y,
\qquad
0<y-x<a.
\]
Writing \(X=x-a>0\) and \(Y=y-a>0\), one has \(h_a(x-y)=0\), so
\[
\begin{pmatrix}
H_a(x,x)&H_a(x,y)\\
H_a(y,x)&H_a(y,y)
\end{pmatrix}
=
\begin{pmatrix}
2X&X+Y\\
X+Y&2Y
\end{pmatrix}.
\]
Its determinant is
\[
4XY-(X+Y)^2=-(X-Y)^2<0.
\]
Therefore:

> **Delayed-hinge obstruction.** For every \(a>0\), the stationary-increment kernel generated by \((|t|-a)_+\) is indefinite. Multiplication by either sign leaves one positive and one negative direction.

The verifier uses \(a=1,x=2,y=2.5\), obtaining
\[
\begin{pmatrix}2&2.5\\2.5&3\end{pmatrix},
\qquad
\det=-0.25.
\]

This does not prove that the complete arithmetic sum is indefinite; under RH, its cancellation with the archimedean part produces the desired positive kernel. It proves that positivity cannot be assembled by declaring each positive Mangoldt hinge to be a positive operator. The proof must be global and cancellation-sensitive.

The same point explains why the unconditional Gram kernel
\[
K_\Lambda(s,t)
=-\frac{\zeta'}{\zeta}(s+\overline t)
=\sum_n\Lambda(n)n^{-s-\overline t}
\]
does not settle the screw problem. Its Dirichlet-series features are positive, but inversion into delayed time-domain hinges is not a positivity-preserving kernel operation.

## 8. Why the Rankin \(\kappa\)-kernel does not close the arithmetic gap

The framework has already fixed
\[
\kappa_{\rm R}=\frac1{4\pi^2}.
\]
It gives the positive all-integer kernel
\[
K_\kappa(s,t)
=\kappa_{\rm R}\zeta(s+\overline t+2)

after Green weighting. The fifth-stage report showed that its vertical-line increments have the right screw geometry and that the exact arithmetic deformation maps to the xi Pick kernel by a double Laplace transform.

What remains is not a missing normalization. There are two non-positive operations between the smooth repetition ledger and the required prime-power history.

First, primitive extraction satisfies
\[
\log n=\sum_{d\mid n}\Lambda(d),
\]
so Möbius inversion gives
\[
\boxed{
\Lambda(n)=\sum_{d\mid n}\mu(d)\log(n/d).}
\]
The companion program checks this identity through \(n=10{,}000\), with maximum floating error about \(1.43\times10^{-14}\); both signs of \(\mu\) occur thousands of times. This extraction is not order-preserving.

Second, once the exact positive weights \(\Lambda(q)\) have been obtained, the delayed-hinge kernels themselves are indefinite. Thus even positivity of the Dirichlet coefficient kernel does not survive the time-domain event transform term by term.

The role of \(\kappa_{\rm R}\) remains genuine:

- it selects inverse-square Green weighting;
- it places the RSS return geometry in the stationary-increment category;
- it supplies the correct dimensional normalization for the conditional zero expansion; and
- it participates in the exact Laplace route to \(K_\xi\).

But multiplying by a positive constant cannot control signed Möbius cancellation or the recovery-conditioned arrival centroid. A new RSS theorem would have to couple its return states directly to the exact von Mangoldt first moment, not merely to positive all-integer repetition energy.

## 9. Other candidate routes tested

### 9.1 Terminal recurrence

Excluding a never-recovering episode removes one failure mode but not finite bad episodes. Infinitely many recovered episodes remain, and any one may in principle have \(\mathcal J_q>\mathcal C_q\). Recovery controls the endpoint level, not the accumulated area.

### 9.2 Prime-gap control

At a witness,
\[
Y_q<A'(\log q_{\rm next})-A'(\log q).
\]
Asymptotically this window is related to
\[
\frac{q_{\rm next}-q}{\sqrt q}.
\]
A strong all-prime-power gap theorem could make the terminal workload small. It still would not bound the earlier arrival first moment, and known unconditional worst-case gap bounds do not supply the required uniform sub-square-root control. The gap route is therefore insufficient twice over: its available estimates are too weak for all events, and terminal level alone does not control area.

### 9.3 Finite verified zeros

If RH is rigorously verified through height \(H\), a retained critical-line zero sum gives a finite lower bound of the form
\[
\Psi(t)\ge F_T(t)-\kappa_H\left(1+\cosh\frac t2\right),
\]
where \(F_T\ge0\) is finite and \(\kappa_H=O((\log H)/H)\). For fixed \(H\), the retained sum is bounded while the tail penalty grows like \(\cosh(t/2)\). This can extend a finite certificate but can never become a global proof.

### 9.4 Terminal-pinned finite-spectral estimates

Published finite-spectral bounds for \(\Sigma_{1/2}(u)\), pinned to an exact entry state and clipped by \(P_q^-\), give a valid one-sided constructor for \(\widehat{\mathcal J}_q\). They are genuine sufficient estimates, not circular uses of RH above the verified height. The unresolved step is still to prove
\[
\widehat{\mathcal J}_q\le\mathcal C_q
\]
at every future witness. The no-floor theorem means the additive slack of such a constructor must tend to zero along tight subsequences.

### 9.5 Positive spectral measure

Under RH,
\[
\Psi(t)=2\sum_{\gamma>0}
\frac{1-\cos(\gamma t)}{\gamma^2},
\]
which is manifestly nonnegative and gives a positive screw kernel. Using this as an unconditional representation would already assume that every xi frequency is real. Likewise, treating scattering resonances as the spectrum of a positive self-adjoint operator assumes the confinement that must be proved. This route is circular unless the real spectral measure is constructed independently of the Riemann zeros.

### 9.6 Generic complete-Pick or bounded-feature universality

The fifth-stage bounded-transform obstruction remains decisive. The \(K_\kappa\) feature norms stay uniformly bounded at the critical boundary, while the xi Pick kernel grows quadratically near every critical-line zero. No single bounded feature operator can perform the conversion on the whole half-plane. The exact double Laplace map is necessarily an unbounded inverse-Green operation whose positivity depends on global \(G_g\succeq0\).

## 10. What a successful next theorem must say

The most economical remaining target is not “find a positive asymptotic margin”. It is one of the following equivalent, zero-slack statements at every recovery witness:

\[
\boxed{
\mathcal J_q\le\mathcal C_q,}
\]

\[
\boxed{
\int_{e^a}^{q}
\frac{\Sigma_{1/2}(u)-\Sigma_{1/2}(e^a)}{u}\,du
\le\mathcal C_q,}
\]

or, for \((s-a)P_q^->0\),
\[
\boxed{
c_q\ge1-\frac{\mathcal C_q}{(s-a)P_q^-}.}
\]

A genuinely new theorem would need to use both:

1. the **level constraint** selecting a recovery witness,
   \[
   0<Y_q<A'(\log q_{\rm next})-A'(\log q),
   \]
2. and the **area/centroid constraint** controlling the preceding Mangoldt arrivals.

This is a transversality problem. An exceptional-set count alone is not enough: a sparse set may still contain a negative reserve. An average theorem alone is not enough: the witness intervals are selected adaptively by the same arithmetic process. A fixed additive error is not enough: valid margins approach zero. A pointwise absolute bound is not enough: the global Chebyshev memory requires negative signed cancellation.

For the RSS programme to add proof strength, it would have to produce a theorem of this form from independently established return geometry—for example, a direct inequality forcing the weighted primitive-event centroid above its state-dependent critical value. No such bridge is currently present in the framework.

## 11. Final assessment

The attempt did not prove
\[
G_g\succeq0
\quad\text{or}\quad
\Psi(t)\ge0\text{ for all }t.
\]
It did establish a cleaner map of the obstruction:

- strict inter-event convexity solves the local continuum problem;
- directed arithmetic solves a very large but finite event domain;
- terminal exclusion proves every active episode eventually recovers;
- pure debit reduces each episode to one recovery witness;
- exact state conditioning reduces each witness to one nonnegative smoothed cost;
- normalized arrival time reduces that cost to one centroid inequality;
- no positive uniform slack is available;
- absolute Chebyshev bounds erase the required sign;
- individual prime hinges are operator-indefinite;
- Möbius extraction from the RSS repetition ledger is signed; and
- finite zero information remains intrinsically finite.

The sharp unresolved statement is therefore:

> **Recovery-conditioned level–centroid theorem.** Prove, without assuming RH or a real zero spectrum, that every recovery witness has enough late weighted Mangoldt arrival mass to satisfy
> \[
> c_q\ge1-\frac{\mathcal C_q}{(s-a)P_q^-},
> \]
> equivalently \(\mathcal J_q\le\mathcal C_q\).

That theorem would complete the screw-kernel route and, through the exact double-Laplace bridge already derived, prove positivity of \(K_\xi\) and RH. At present it remains open.
