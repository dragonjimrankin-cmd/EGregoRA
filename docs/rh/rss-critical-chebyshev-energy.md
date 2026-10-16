# Finding the missing theorem: critical Chebyshev energy

**Twenty-fourth-stage investigation — 15 October 2026**  
**Question:** What is the weakest concrete positive arithmetic estimate that closes the prime–Laguerre route?  
**Companion program:** `scripts/research-rss-critical-chebyshev-energy.py`  
**Machine-readable results:** `docs/rh/rss-critical-chebyshev-energy-results.json`

## Verdict

The missing theorem can be stated more weakly than pointwise square-root prime error. It is the following positive, all-scale mean-square estimate:

\[
\boxed{
\forall\delta>0,
\qquad
\int_X^{2X}|\psi(x)-x|^2\,dx
\ll_\delta X^{2+\delta}
\qquad(X\ge2).
}
\tag{CE}
\]

Equivalently,
\[
X^{-2}\int_X^{2X}|\psi(x)-x|^2\,dx=X^{o(1)}.
\]

This **critical Chebyshev-energy theorem** would be enough. It permits errors larger than square-root scale on sparse sets, so it is genuinely weaker in form than a pointwise estimate. Nevertheless, for the particular arithmetic function \(\psi(x)-x\), it is equivalent to RH: a Mellin-transform argument shows that (CE) excludes every zero in \(\Re s>1/2\), and RH supplies (CE) through the standard square-root error estimate.

The theorem also supplies exactly the weighted Hilbert norm required by the signed Laguerre transform. Its Hilbert-valued generating function recovers the same coefficient base
\[
\frac{3/2+\varepsilon}{3/2-\varepsilon}
\]
found in the preceding half-plane calculation.

What has been found is the precise theorem and a proof of its equivalence to RH—not a proof of its asserted estimate. No known input in the present framework establishes (CE). RH remains open.

---

## 1. The theorem in three equivalent arithmetic forms

Use the endpoint-compatible error
\[
\widetilde E(x)=\psi(x)-(x-1)=\psi(x)-x+1.
\]
Adding one does not change any of the following critical exponents.

The dyadic statement (CE) is equivalent to the cumulative estimate
\[
\boxed{
\forall\delta>0,
\qquad
\int_1^X\frac{|\widetilde E(x)|^2}{x^2}\,dx
\ll_\delta X^\delta.
}
\tag{CE-cum}
\]

It is also equivalent to the family of global weighted norms
\[
\boxed{
I_\varepsilon
=
\int_1^\infty
|\widetilde E(x)|^2x^{-2-2\varepsilon}\,dx
<\infty
\quad\text{for every }\varepsilon>0.
}
\tag{CE-wt}
\]

### Dyadic to cumulative

On \([2^k,2^{k+1}]\), (CE) gives
\[
\int_{2^k}^{2^{k+1}}
\frac{|\widetilde E(x)|^2}{x^2}\,dx
\ll_\delta 2^{k\delta}.
\]
Summing the geometric sequence through \(X\) proves (CE-cum).

### Cumulative to weighted

Partial summation against \(x^{-2\varepsilon}\), or a dyadic decomposition, shows that (CE-cum) with any \(\delta<2\varepsilon\) makes \(I_\varepsilon\) finite.

### Weighted to dyadic

Conversely,
\[
\int_X^{2X}|\widetilde E(x)|^2\,dx
\le
(2X)^{2+2\varepsilon}I_\varepsilon.
\]
Given a desired \(\delta>0\), choose \(\varepsilon=\delta/2\). This returns (CE), with an inessential change of exponent notation.

Thus the missing statement is one theorem, not three independent assumptions.

## 2. Why this is weaker than pointwise square-root error

The pointwise target
\[
\psi(x)-x=O_\varepsilon(x^{1/2+\varepsilon})
\]
immediately implies (CE). Squaring and integrating over a dyadic interval gives
\[
\int_X^{2X}|\psi(x)-x|^2dx
\ll_\varepsilon X^{2+2\varepsilon}.
\]

The reverse implication does not hold for a general function. An \(L^2\) estimate allows values well above square-root scale on sets whose measure is sufficiently small. The energy theorem therefore avoids demanding pointwise control at every \(x\).

There is an important qualification. For this specific Chebyshev error, (CE) has enough analytic content to imply RH. Once RH is obtained, the standard explicit-formula argument separately returns the familiar pointwise bound. The logical loop is
\[
\text{pointwise square-root error}
\Longrightarrow
\text{critical energy}
\Longrightarrow
\mathrm{RH}
\Longrightarrow
\text{pointwise square-root error}.
\]

The middle implication is the useful new formulation.

## 3. Mellin closure excludes one exceptional zero

For \(\Re s>1\), partial summation gives
\[
\int_1^\infty \psi(x)x^{-s-1}\,dx
=-\frac1s\frac{\zeta'(s)}{\zeta(s)}.
\]
Since
\[
\int_1^\infty(x-1)x^{-s-1}\,dx
=\frac1{s(s-1)},
\]
one obtains the endpoint-completed identity
\[
\boxed{
\int_1^\infty\widetilde E(x)x^{-s-1}\,dx
=-\frac1s\frac{d}{ds}
\log\bigl((s-1)\zeta(s)\bigr).
}
\tag{M}
\]

Assume (CE-wt). Fix \(s\) with \(\sigma=\Re s>1/2\), and choose
\[
0<\varepsilon<\sigma-\frac12.
\]
Cauchy–Schwarz gives
\[
\begin{aligned}
\int_1^\infty
|\widetilde E(x)|x^{-\sigma-1}\,dx
&\le
I_\varepsilon^{1/2}
\left(
\int_1^\infty x^{-2\sigma+2\varepsilon}\,dx
\right)^{1/2}\\
&<\infty.
\end{aligned}
\]

The left side of (M) consequently defines a holomorphic function throughout \(\Re s>1/2\). It agrees with the logarithmic derivative on \(\Re s>1\), so uniqueness of analytic continuation extends that identity to the larger half-plane.

If \((s-1)\zeta(s)\) had a zero \(\rho\) there, its logarithmic derivative would have a pole at \(\rho\). The Mellin integral is holomorphic there, a contradiction. Hence
\[
\zeta(s)\ne0
\qquad(\Re s>1/2).
\]
Functional symmetry then places every nontrivial zero on \(\Re s=1/2\).

This is why the new theorem differs from a loose average or a zero-density estimate. It is an all-\(X\), critical-scale norm that makes the relevant Mellin transform holomorphic. One exceptional zero is not permitted.

## 4. RH supplies the theorem in the reverse direction

Under RH, the standard explicit-formula estimate is
\[
\psi(x)-x=O(x^{1/2}\log^2x).
\]
Therefore
\[
\int_X^{2X}|\psi(x)-x|^2dx
=O(X^2\log^4X),
\]
which is stronger than (CE) for every fixed \(\delta>0\).

Consequently
\[
\boxed{
\mathrm{RH}
\quad\Longleftrightarrow\quad
\forall\delta>0,
\ 
\int_X^{2X}|\psi(x)-x|^2dx
\ll_\delta X^{2+\delta}.
}
\]

This is an equivalence theorem that can be proved now. Its right-hand estimate remains an unproved proposition.

## 5. A finite von Mangoldt pair ledger

The energy has a completely finite arithmetic expansion. Put \(Y=2X\) and \([u]_+=\max(u,0)\). Since
\[
\psi(x)=\sum_{m\le x}\Lambda(m),
\]
expanding the square and integrating gives
\[
\boxed{
\begin{aligned}
\int_X^Y(\psi(x)-x)^2dx
={}&
\sum_{m,n\le Y}
\Lambda(m)\Lambda(n)
[\,Y-\max(X,m,n)\,]_+\\
&-
\sum_{m\le Y}
\Lambda(m)
[\,Y^2-\max(X,m)^2\,]_+\\
&+
\frac{Y^3-X^3}{3}.
\end{aligned}
}
\tag{P}
\]

The companion program verifies (P) against direct integration between the jumps of \(\psi\) on six finite ranges.

Formula (P) says exactly what arithmetic cancellation is missing. Individual terms naturally live on the \(X^3\) scale. The theorem requires their triangularly weighted combination to be only \(X^{2+o(1)}\) at every scale. It is a finite prime-pair inequality, with no zero ordinates and no Laguerre phases in its statement.

This positivity does not prove the upper bound: the integral is nonnegative automatically, while the issue is making it small enough. Pair-ledger expansion reorganises that issue but does not supply the needed cancellation.

## 6. The exact Hilbert bridge to the Laguerre coefficients

Recall
\[
p_n=-3\int_1^\infty
\widetilde E(x)x^{-3}
K_n(3\log x)\,dx,
\]
where
\[
K_n(t)=2L_{n-1}^{(1)}(t)+3L_{n-2}^{(2)}(t).
\]

Apply Cauchy–Schwarz with (CE-wt):
\[
|p_n|
\le
3I_\varepsilon^{1/2}
\left(
\int_1^\infty
x^{-4+2\varepsilon}|K_n(3\log x)|^2dx
\right)^{1/2}.
\]
With \(t=3\log x\), the kernel norm becomes
\[
\frac13
\int_0^\infty
 e^{-c_\varepsilon t}|K_n(t)|^2dt,
\qquad
c_\varepsilon=1-\frac{2\varepsilon}{3}.
\]

The Laguerre generating functions combine exactly:
\[
\boxed{
\sum_{n\ge1}K_n(t)z^n
=
\frac{z(2+z)}{(1-z)^3}
\exp\!\left(-\frac{tz}{1-z}\right).
}
\tag{L}
\]

For \(|z|=r\),
\[
\min_{|z|=r}
\Re\frac{z}{1-z}
=-\frac{r}{1+r}.
\]
Therefore the right side of (L) belongs to
\(L^2((0,\infty),e^{-c_\varepsilon t}dt)\) whenever
\[
c_\varepsilon-rac{2r}{1+r}>0,
\]
or equivalently
\[
r<\frac{c_\varepsilon}{2-c_\varepsilon}.
\]
Vector-valued Cauchy estimates now give an exponential base arbitrarily close to
\[
\frac{2-c_\varepsilon}{c_\varepsilon}
=
\frac{1+2\varepsilon/3}{1-2\varepsilon/3}
=
\frac{3/2+\varepsilon}{3/2-\varepsilon}.
\]

This is exactly the preceding half-plane base
\[
B_\theta=\frac{1+\theta}{2-\theta}
\]
at \(\theta=1/2+\varepsilon\).

Because (CE) supplies \(I_\varepsilon<\infty\) for every \(\varepsilon>0\), the base can be made arbitrarily close to one. Hence
\[
p_n=e^{o(n)}.
\]

The pointwise and Laguerre routes have therefore been joined by a positive Hilbert-space theorem rather than by a conjectural phase-correlation estimate.

## 7. Why established averages do not close it

The phrase “mean square” alone is not enough. The required estimate has three simultaneous features:

1. it is at the critical \(X^2\) energy scale;
2. it holds on every dyadic interval;
3. it allows only a subpower loss.

Ordinary PNT-sized pointwise control places the corresponding energy near the \(X^3\) scale, even when multiplied by a decaying subpower factor. Zero-density and mean-over-height theorems can permit exceptional zeros. The critical Chebyshev energy cannot: its Mellin consequence is holomorphic at every point of \(\Re s>1/2\).

Finite samples of the energy, like finite samples of \(p_n\), verify formulas and implementations only. They cannot prove the all-scale exponent.

## 8. Proof boundary

The twenty-fourth-stage search finds four exact pieces:

1. a positive theorem weaker in form than pointwise square-root error;
2. an equivalence proof connecting that theorem to RH;
3. a finite von Mangoldt pair-ledger version;
4. a Hilbert-valued Laguerre bound that reproduces the exact exponent-to-base map.

The remaining unproved assertion is now
\[
\boxed{
\int_X^{2X}|\psi(x)-x|^2dx
\le X^{2+o(1)}
\quad\text{as an upper bound valid at every scale.}
}
\]

This is the missing theorem. It has been isolated, not established. Calling the equivalence a proof of the estimate would be circular. RH remains open.

## 9. Universal-π application note

The later [universal-π audit](./rss-universal-pi-coupling.md) confirms that the Riemann completion already couples every integer to \(\pi\) through the self-dual theta Gaussian. This supplies functional symmetry but not the critical energy estimate. Any unit-modulus \(\pi\)-phase preserves the positive \(L^2\) norm, while the zero-free archimedean factor cannot remove a singularity of the endpoint-completed prime logarithm.

Thus universal \(\pi\)-coupling organizes the completion but leaves the same all-scale von Mangoldt pair-energy theorem as the missing input.

## 10. π×π direct-test note

The later [direct \(\pi\times\pi\) tests](./rss-pi-squared-coupling.md) compute untwisted and three \(\pi\)-twisted dyadic prime-energy diagnostics through \(X=262{,}144\). Logarithmic twists are vertical translations of the same zero problem; the additive twist is a different channel. Unit phases preserve positive energy, and no finite range proves the all-\(X\) critical estimate.

**Prime-pair splice follow-up:** [`rss-prime-pair-splice-link.md`](./rss-prime-pair-splice-link.md) isolates the \((101,101)\) diagonal in the finite Chebyshev pair ledger. It contributes \(X(\log101)^2\) for \(X\ge101\), but the all-scale critical energy bound—not any one diagonal term—is what Mellin-excludes every off-line zero.

