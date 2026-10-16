# Attempting both remaining prime-error routes

**Twenty-third-stage investigation — 15 October 2026**  
**Targets:**

1. prove a square-root-scale bound for \(\psi(x)-x\);
2. prove uniform cancellation in the signed Chebyshev–Laguerre transform.

**Companion program:** `scripts/research-rss-dual-prime-error-routes.py`  
**Machine-readable results:** `docs/rh/rss-dual-prime-error-routes-results.json`

## Verdict

Neither route produced a proof. They can, however, be identified exactly as two coordinate descriptions of the same analytic-continuation problem.

For the generalized Li map
\[
z=\frac{s-2}{s+1},
\qquad
s=2+\frac{3z}{1-z},
\]
the unit disk \(|z|<1\) is exactly the half-plane
\[
\Re s>\frac12.
\]

A subexponential coefficient theorem would make the endpoint-completed prime logarithm analytic throughout that disk. A square-root Chebyshev theorem would make the corresponding Mellin object analytic throughout the same half-plane. Either excludes every zero with real part above \(1/2\), and functional symmetry then proves RH.

No established TTI identity, positivity theorem or unconditional prime estimate crosses this boundary.

---

## 1. Attempt A — square-root prime error

The target is
\[
\psi(x)-x
=O(x^{1/2}\log^2x),
\]
or, slightly more flexibly,
\[
\psi(x)-x
=O_\varepsilon(x^{1/2+\varepsilon})
\quad\text{for every }\varepsilon>0.
\]

### 1.1 Explicit-formula obstruction

The explicit formula represents the prime error through terms of the form
\[
\frac{x^\rho}{\rho}.
\]
A zero \(\rho=\beta+i\gamma\) with \(\beta>1/2\) contributes at the \(x^\beta\) scale. It obstructs a uniform square-root estimate.

Conversely, a square-root estimate excludes every \(\beta>1/2\). Functional symmetry excludes \(\beta<1/2\), yielding RH.

The desired prime estimate is therefore not a weaker lemma waiting inside the existing explicit formula. It is another exact form of the zero-location theorem.

### 1.2 Inputs that were tested

- The ordinary prime number theorem, \(\psi(x)=x+o(x)\), approaches the exponent from one, not from one half.
- Classical zero-free regions near \(\Re s=1\) improve the \(x\)-scale by a subpower factor but do not produce \(x^{1/2+\varepsilon}\).
- Finite critical-line verification only moves a hypothetical first counterexample to a greater height.
- The positive horizontal residue and seam contraction give RH-equivalent zero-side norms but no new inequality for \(\psi(x)-x\).

No square-root-scale theorem follows from these inputs.

## 2. Attempt B — uniform signed-Laguerre cancellation

The exact remainder from the previous stage can be written with \(t=3\log x\) as
\[
p_n
=-\int_0^\infty
\widetilde E(e^{t/3})e^{-2t/3}
\left[
2L_{n-1}^{(1)}(t)
+3L_{n-2}^{(2)}(t)
\right]dt,
\]
where
\[
\widetilde E(x)=\psi(x)-(x-1).
\]

### 2.1 Laguerre orthogonality

Associated Laguerre functions have useful weighted orthogonality. Applying Cauchy–Schwarz, however, requires a family of critical weighted norms of \(\widetilde E\). Unconditional prime-error estimates do not supply them. The later critical Chebyshev-energy stage shows that these norms can be obtained from an all-scale \(L^2\) theorem weaker in pointwise form than square-root error, while still equivalent to RH.

Thus orthogonality reorganises the problem and reveals the correct positive norm, but supplies no free inequality.

### 2.2 Recurrence in the coefficient index

The Laguerre recurrence relates neighbouring polynomials, but after summation over prime powers it introduces additional logarithmic prime moments. The resulting recurrence does not close in \(p_n\) and has no derived contraction coefficient.

### 2.3 Signed oscillation

Both the Chebyshev error and the Laguerre kernel change sign. A proof would need a uniform theorem controlling their correlation for every \(n\). Existing sign-change information controls neither phase alignment nor worst-case accumulation.

Available zero-density and averaged-in-height estimates also do not suffice. The coefficient radius and seam infimum can be changed by a single exceptional zero, whereas those estimates permit exceptional sets. The later critical all-scale Chebyshev-energy formulation is different: it is strong enough to make the Mellin transform holomorphic and is treated separately.

## 3. The exact quantitative boundary

Suppose one could continue the prime logarithm only through
\[
\Re s>\theta,
\qquad \theta\ge\frac12.
\]
Under
\[
z=\frac{s-2}{s+1},
\]
the largest disk centered at zero within this half-plane has radius
\[
\boxed{
r_\theta=\frac{2-\theta}{1+\theta}.}
\]
Cauchy–Hadamard then leaves the coefficient base
\[
\boxed{
B_\theta=\frac{1+\theta}{2-\theta}.}
\]

Examples are:

| Prime-error exponent \(\theta\) | Coefficient base \(B_\theta\) |
|---:|---:|
| \(1/2\) | \(1\) |
| \(0.51\) | \(1.01342\ldots\) |
| \(0.55\) | \(1.06897\ldots\) |
| \(0.60\) | \(1.14286\ldots\) |
| \(0.75\) | \(1.4\) |
| \(0.90\) | \(1.72727\ldots\) |
| \(1\) | \(2\) |

Every fixed loss \(\theta>1/2\), however small, remains exponential in \(n\). Only the exact limiting exponent \(1/2\) gives subexponential growth.

## 4. Why the two attempts coincide

The endpoint-completed generating function is
\[
P(z)
=
\log\frac{(s(z)-1)\zeta(s(z))}{\zeta(2)},
\qquad
s(z)=2+\frac{3z}{1-z}.
\]

To prove uniform signed-Laguerre cancellation is to prove that its Taylor coefficients have radius at least one. That is to prove \(P\) is analytic throughout \(|z|<1\). Under the inverse map, this is exactly zero-freeness of \((s-1)\zeta(s)\) throughout \(\Re s>1/2\).

To prove square-root prime error is likewise to exclude every zero in that half-plane.

Therefore
\[
\boxed{
\text{square-root Chebyshev control}
\Longleftrightarrow
\text{subexponential Laguerre control}
\Longleftrightarrow
\text{zero-freeness in }\Re s>1/2.
}
\]
Functional symmetry turns the last statement into RH.

## 5. Proof boundary

The attempts establish three useful facts:

1. the two proposed routes are the same analytic boundary in different coordinates;
2. an exponent loss \(\theta-1/2\) translates exactly into the exponential base \((1+\theta)/(2-\theta)\);
3. Laguerre orthogonality reaches a critical weighted boundary and does not create positivity.

What remains missing is a genuinely new arithmetic inequality excluding every zero in \(\Re s>1/2\), stated either as square-root Chebyshev error or uniform signed-Laguerre cancellation.

Neither route supplied that inequality. RH remains open.
