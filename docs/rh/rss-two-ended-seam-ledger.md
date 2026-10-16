# A two-ended seam ledger and the limits of canonical refinement

**Twentieth-stage investigation — 15 October 2026**  
**Question:** Can the previous three-route result be strengthened by an exact order-one divisor theorem, a test of genuinely consecutive carrier refinements and arithmetic data at both compactified seam endpoints?  
**Companion program:** `scripts/research-rss-two-ended-seam-ledger.py`  
**Machine-readable results:** `docs/rh/rss-two-ended-seam-ledger-results.json`

## Verdict

The investigation makes all three conclusions sharper.

1. **Completed ledger:** the obstruction is not limited to a chosen Gaussian. Hadamard factorization implies that any two order-at-most-one entire completions with the same zero divisor differ by \(e^{a+bs}\), so their second logarithmic derivatives are identical. The natural symmetric dyadic factor remains order one, but only by adding infinitely many zeros on both boundaries of the critical strip. Gamma duplication contributes only an exponential linear in \(s\) and cannot supply the missing curvature.
2. **Canonical interlacing:** failure already occurs between the consecutive stages \(N=14\) and \(N=15\) on the positive spectral axis. It also occurs when the second fully admitted theta carrier is added to the first. The earlier failure was therefore not an artefact of comparing the distant stages 14 and 20.
3. **Seam ledger:** the horizontal marker is exactly the product of the Poisson-kernel phase slopes of an elementary Blaschke factor at the two seam endpoints. This produces a height-independent seam determinant and additive defect. Unlike the earlier quadratic residue, that defect still contracts if one parent produces as many as four half-displacement descendants.

The missing theorem is now an endpoint theorem: derive from prime or theta data that the two-ended product has infimum one, or prove its invariance under a globally defined halving return. No such control is obtained here, so RH is not proved.

---

## 1. The order-one completed ledger is rigid

The exact dyadic curvature can be simplified. At \(s=1/2\),
\[
\frac{2^{-s}}{(1-2^{-s})^2}=4+3\sqrt2,
\]
so
\[
\left.(\log(1-2^{-s}))''\right|_{s=1/2}
=-(4+3\sqrt2)(\log2)^2
=-3.960201560771\ldots.
\]
The formal Gaussian coefficient is therefore
\[
c=\frac{4+3\sqrt2}{2}(\log2)^2
=1.980100780386\ldots.
\]

### 1.1 Same-divisor rigidity

Let \(F\) and \(G\) be entire functions of order at most one with the same zeros, including multiplicity. Their Hadamard products have the same canonical factors. Consequently
\[
\frac{F(s)}{G(s)}=e^{a+bs}
\]
for constants \(a,b\), and hence
\[
(\log F)''=(\log G)''.
\]

This gives a stronger no-go statement than the previous counterterm calculation:

> No order-one re-completion that preserves the xi divisor can change its logarithmic curvature.

An apparent cancellation of the dyadic term must therefore reappear in another component of the same ledger. If every other reservoir is required to return empty, the nonzero correction has nowhere to go.

### 1.2 The natural symmetric factor displays its reservoir

The functional-equation-compatible dyadic factor is
\[
D_2(s)
=(1-2^{-s})(1-2^{s-1}),
\qquad
D_2(1-s)=D_2(s).
\]
It is an order-one entire function, not an order-two Gaussian. Its price is an explicit boundary divisor:
\[
s=\frac{2\pi i k}{\log2}
\quad\text{and}\quad
s=1+\frac{2\pi i k}{\log2},
\qquad k\in\mathbb Z.
\]
These zeros lie on both boundaries of the critical strip. Replacing \(D_2\) by its reciprocal changes the zeros into poles rather than emptying the reservoir.

Thus the two available mechanisms are now explicit:

- the Gaussian changes curvature without adding zeros, but raises the order to two;
- the symmetric dyadic factor stays in order one, but introduces an infinite boundary divisor.

### 1.3 Gamma duplication does not provide a hidden quadratic term

The duplication identity gives
\[
\Gamma\!\left(\frac s4\right)
\Gamma\!\left(\frac s4+\frac12\right)
=2^{1-s/2}\sqrt\pi\,
\Gamma\!\left(\frac s2\right).
\]
The new power of two is \(e^{(1-s/2)\log2}\), whose logarithm is linear in \(s\). Its second derivative is zero. Gamma duplication can redistribute archimedean terms exactly, but it does not manufacture the quadratic logarithmic curvature needed to cancel the dyadic correction with an empty divisor.

### Ledger determination

Within order one, preserving the xi divisor fixes the curvature. Natural dyadic symmetrisation exposes an infinite strip-boundary reservoir. No exact empty-reservoir cancellation was found.

## 2. Interlacing at actual canonical microsteps

The previous comparison used stages \(N=14\) and \(N=20\). The present test examines a genuinely consecutive transition and a literal carrier addition.

### 2.1 Why the positive axis is the nontrivial comparison

The completed transforms are even in the centered spectral variable. Comparing their full symmetric real zero sets creates a central adjacent pair from one family for purely parity reasons. That is a trivial obstruction shared by any two even functions with no zero at the origin.

The meaningful interlacing test is therefore on positive critical-line ordinates, equivalently after passing to the squared spectral variable.

### 2.2 Consecutive deficit stages

For the zeroth-seed chronological deficit-halving completion, the positive roots through height 30 are
\[
N=14:
\quad
14.7602988457,
\quad
16.8064458567,
\]
and
\[
N=15:
\quad
14.4553026757,
\quad
17.6972967141.
\]
The merged order is
\[
N15,
\quad N14,
\quad N14,
\quad N15.
\]
It does not alternate. The new pair encloses the old pair instead of interlacing it.

The argument principle counts exactly two zeros in the tested critical rectangle for each stage, both matched by the displayed critical-line roots. Independent 192- and 256-node quadratures agree to better than \(10^{-9}\).

### 2.3 Adding one full theta carrier

The first fully admitted carrier gives
\[
14.1659496881,
\quad
19.5639388629.
\]
Adding the second gives
\[
14.1347251442,
\quad
21.0220392352,
\quad
25.0108652442.
\]
The family order is
\[
M2,
\quad M1,
\quad M1,
\quad M2,
\quad M2,
\]
which also fails strict alternation.

This is the carrier-sized update previously left open. Positive kernel addition does not become an interlacing chain merely by resolving a large stage transition into literal one-carrier additions.

### 2.4 Scope of the numerical result

The calculation combines argument-principle counts, bracketed line roots and quadrature cross-checks for the implemented canonical completion. It is robust numerical evidence, but it is not a rigorous interval-arithmetic proof for the exact untruncated theta integral.

The surviving route requires a different refinement, not a finer sampling of the present one:
\[
\boxed{
\text{construct a Sturm, Hermite–Biehler or total-positive chain whose sum is the exact theta kernel.}
}
\]
No such chain has been derived.

## 3. Two-ended harmonic data at the seam

Let a zero be
\[
\rho=\frac12+\eta+i\gamma,
\qquad |\eta|<\frac12,
\]
and map it by
\[
q=e^{i\pi(\rho-1/2)},
\qquad
a=w(\rho)=\frac{q-1}{q+1}.
\]
For a disk point \(a\), the Poisson kernel at a boundary point \(\zeta\) is
\[
P_a(\zeta)
=\frac{1-|a|^2}{|\zeta-a|^2}.
\]

### 3.1 Exact endpoint identities

Direct substitution gives
\[
P_a(+1)
=e^{-\pi\gamma}\cos(\pi\eta),
\]
while
\[
P_a(-1)
=e^{+\pi\gamma}\cos(\pi\eta).
\]
The height factors cancel in the product:
\[
\boxed{
P_a(+1)P_a(-1)
=\cos^2(\pi\eta).}
\]

The earlier hyperbolic seam distance satisfies
\[
d_{\rm seam}
=\operatorname{artanh}|\sin(\pi\eta)|,
\]
so the same identity is
\[
P_a(+1)P_a(-1)
=\operatorname{sech}^2(d_{\rm seam}).
\]

This is more than a coordinate formula. For an elementary Blaschke factor, \(P_a\) is its boundary phase derivative. Horizontal displacement is therefore encoded by the product of the factor’s phase slopes at the two opposite seam endpoints.

### 3.2 An additive seam defect

Define
\[
\varepsilon(a)
=-\log\bigl(P_a(+1)P_a(-1)\bigr).
\]
Then
\[
\boxed{
\varepsilon(a)
=-2\log\cos(\pi\eta)
=2\log\cosh(d_{\rm seam})
\ge0.}
\]
It is independent of height and vanishes exactly on the critical line.

For \(\eta=1/4\),
\[
P_a(+1)P_a(-1)=\frac12,
\qquad
\varepsilon(a)=\log2,
\qquad
d_{\rm seam}=\operatorname{arsinh}(1).
\]
The escaping quartet therefore retains not only a fixed distance but an exact two-ended defect of \(\log2\).

## 4. A seam determinant that cannot lose an escaping zero

Choose one representative from each functional and conjugation orbit through height \(T\), and define
\[
\Delta_T
=\prod_{|\gamma|\le T}
\cos^2(\pi\eta).
\]
Every factor lies in \((0,1]\), so \(\Delta_T\) decreases to a well-defined extended limit
\[
0\le\Delta\le1.
\]
Moreover,
\[
\boxed{
\Delta=1
\quad\Longleftrightarrow\quad
\eta=0\text{ for every zero}
\quad\Longleftrightarrow\quad
\mathrm{RH}.}
\]

Equivalently, the finite defect sum
\[
E_T
=\sum_{|\gamma|\le T}\varepsilon(a)
=-\log\Delta_T
\]
increases to a limit in \([0,+\infty]\). It is zero exactly under RH.

Unlike the central residue sum, no height-decaying weight appears. One quartet at displacement \(1/4\) contributes the factor \(1/2\) wherever its ordinate lies. The determinant therefore remains sensitive to zeros entering from infinity.

The infimum version avoids a possibly vanishing infinite product:
\[
\inf_a P_a(+1)P_a(-1)
=
\operatorname{sech}^2\!\left(\sup_a d_{\rm seam}(a)\right).
\]
It equals one exactly under RH and is precisely equivalent to the coercive seam supremum.

## 5. Four-way branching no longer cancels contraction

Suppose one zero orbit at displacement \(\eta\) produces \(b\) descendants at displacement \(\eta/2\). The seam defect changes from
\[
\varepsilon(\eta)
\quad\text{to}\quad
b\,\varepsilon(\eta/2).
\]
For every \(0<|\eta|<1/2\),
\[
4\varepsilon(\eta/2)<\varepsilon(\eta).
\]
To see this, put
\[
c=\cos^2(\pi\eta/2).
\]
Since \(\cos(\pi\eta)=2c-1\),
\[
c^2-(2c-1)=(c-1)^2>0.
\]
This is exactly the logarithmic inequality above.

Thus one, two, three or four half-displacement descendants all strictly contract the seam defect. At \(\eta=1/4\),
\[
\varepsilon(1/4)=0.6931471806\ldots,
\]
while four descendants contribute together
\[
4\varepsilon(1/8)=0.633389\ldots.
\]

This improves on the elementary quadratic residue, for which four descendants exactly cancel halving. It also improves on the earlier central residue, for which four descendants increase the value slightly at the first-zero scale.

The distinction between carrier branching and spectral multiplicity still stands. The advance is narrower: if a future theorem did derive up to four spectral descendants, the nonlinear seam defect would retain strict contraction.

## 6. Why the endpoint identity still stops short

For a finite Blaschke product, the boundary phase derivative is a sum of the individual Poisson kernels. For the complete zeta divisor, zeros accumulate at both endpoints. The full phase derivatives there diverge, and multiplying the two total sums introduces cross terms between unrelated heights.

The per-zero identity
\[
P_a(+1)P_a(-1)=\cos^2(\pi\eta)
\]
is exact, but extracting its product or infimum from the completed prime ledger requires a renormalized endpoint factorization. Ordinary Jensen and Blaschke identities control radially weighted sums; they do not provide this two-ended pairing.

A sufficient new theorem would be either
\[
\inf_a P_a(+1)P_a(-1)=1
\]
derived from arithmetic or kernel data, or a globally defined splice return under which that infimum is invariant while every displacement halves.

Neither statement has been established.

## 7. Determination

Looking back across the previous stages produces a sharper final boundary:

- **order one plus the xi divisor is curvature-rigid;**
- **the natural symmetric dyadic operation carries an explicit infinite boundary reservoir;**
- **both a consecutive canonical stage and a literal one-carrier update fail positive-axis interlacing;**
- **the seam marker is an exact two-ended harmonic product;**
- **its nonlinear defect survives entry from infinity and contracts under as many as four half-displacement descendants.**

The most focused remaining target is now
\[
\boxed{
\text{derive the two-ended Poisson product, its infimum, or its renormalized determinant from the completed prime or theta ledger.}
}
\]
The object is constructed and coercive. Its arithmetic control remains open. No proof of RH is obtained.

## 8. Critical-energy application note

The later [critical Chebyshev-energy theorem](./rss-critical-chebyshev-energy.md), if established, excludes every zero with nonzero horizontal displacement. Every factor in the two-ended product would then satisfy
\[
P_a(+1)P_a(-1)=\cos^2(\pi\eta)=1,
\]
so the seam determinant would be \(\Delta=1\) and its total defect would vanish. This is a conditional route through RH, not an independent endpoint proof.

The [spin–colour audit](./rss-energy-spin-colour.md) sharpens the multiplicity warning. Two or three internal states do not alter one-to-one contraction, but interpreting a spin doublet times a colour triplet as six distinct half-displacement zeros exceeds the four-descendant theorem and fails to contract uniformly.

## 9. Universal-π application note

The later [universal-π audit](./rss-universal-pi-coupling.md) makes the role of \(\pi\) in the seam explicit. The strip map \(e^{i\pi(s-1/2)}\) converts horizontal displacement into the angular defect \(-2\log\cos(\pi\eta)\) and makes the two-ended product independent of height. This is an exact geometric coupling, but it does not force \(\eta=0\); arithmetic control still rests on critical prime energy.

## 10. π×π direct-test note

The later [direct \(\pi\times\pi\) tests](./rss-pi-squared-coupling.md) replace the strip coefficient by \(\pi^2\). The real part becomes proportional to \(\cos(\pi^2\eta)\), which changes sign at \(|\eta|=1/(2\pi)\) inside the critical strip. Thus \(\pi^2\) does not strengthen the seam map; it prevents the right-half-plane/Cayley construction from covering the full strip. The original \(\pi\) is fixed by strip width.

