# Attempting the subexponential prime–Laguerre proof

**Twenty-second-stage investigation — 15 October 2026**  
**Target:** Prove
\[
p_n=e^{o(n)}
\]
for
\[
p_n
=1+(-1)^{n+1}2^n
-3\sum_{m\ge2}\frac{\Lambda(m)}{m^2}
L_{n-1}^{(1)}(3\log m).
\]
**Companion program:** `scripts/research-rss-prime-laguerre-growth-proof.py`  
**Machine-readable results:** `docs/rh/rss-prime-laguerre-growth-proof-results.json`

## Verdict

The requested bound was not proved. The attempt does, however, remove one apparent difficulty exactly and identifies the remaining theorem in ordinary prime-counting terms.

The exponentially large endpoint term is precisely the transform of the continuous prime-density main term. It cancels before any estimate is applied. What remains is an exact signed Laguerre transform of the Chebyshev error \(\psi(x)-x+1\).

This remainder would be subexponential under square-root-scale pointwise control, or under a sufficiently sharp critical weighted-energy theorem. The later critical Chebyshev-energy stage isolates the second option in a form weaker than pointwise control but still equivalent to RH. Absolute values destroy the necessary cancellation, the Laguerre kernel is not positive, and finite zero verification leaves a nonzero exponential rate however small.

Since the subexponential bound is already equivalent to RH, claiming it without a new square-root prime theorem would assume the desired conclusion.

---

## 1. The exponential endpoint term cancels exactly

Put
\[
f_n(x)=x^{-2}L_{n-1}^{(1)}(3\log x).
\]
The continuous-density transform is
\[
3\int_1^\infty f_n(x)\,dx.
\]
With \(t=3\log x\), this becomes
\[
\int_0^\infty e^{-t/3}L_{n-1}^{(1)}(t)\,dt.
\]
The Laguerre Laplace identity gives
\[
\int_0^\infty e^{-st}L_{n-1}^{(1)}(t)\,dt
=1-\left(1-\frac1s\right)^n.
\]
At \(s=1/3\),
\[
\boxed{
3\int_1^\infty f_n(x)\,dx
=1-(-2)^n
=1+(-1)^{n+1}2^n.}
\]

Thus the endpoint exponential is not an unexplained reservoir. It is exactly the image of the main density \(d x\), while the von Mangoldt sum is the image of the discrete measure \(d\psi(x)\).

The companion program verifies the polynomial identity exactly for \(n=1,\ldots,20\).

## 2. Exact reduction to the Chebyshev error

Let
\[
\psi(x)=\sum_{m\le x}\Lambda(m)
\]
and use the shifted error
\[
\widetilde E(x)=\psi(x)-(x-1).
\]
The shift makes \(\widetilde E(1)=0\) and does not change its asymptotic scale.

The completed coefficient is exactly
\[
\boxed{
p_n
=-3\int_1^\infty f_n(x)\,d\widetilde E(x).}
\]
Integration by parts, using
\[
\frac{d}{dx}f_n(x)
=-x^{-3}
\left[
2L_{n-1}^{(1)}(3\log x)
+3L_{n-2}^{(2)}(3\log x)
\right],
\]
gives
\[
\boxed{
p_n
=-3\int_1^\infty
\widetilde E(x)x^{-3}
\left[
2L_{n-1}^{(1)}(3\log x)
+3L_{n-2}^{(2)}(3\log x)
\right]dx.}
\]

The subexponential problem is therefore no longer hidden in the endpoint term. It is a uniform-in-\(n\), oscillatory estimate for the prime-counting error.

## 3. Why termwise bounds fail

Taking absolute values before subtracting the continuous main term leaves the scales
\[
2^n
\quad\text{and}\quad
3\sum_{m\ge2}\frac{\Lambda(m)}{m^2}
\left|L_{n-1}^{(1)}(3\log m)\right|.
\]
Such a bound discards exactly the cancellation defining \(p_n\). It can at best produce an exponential estimate and cannot yield \(e^{o(n)}\).

The first computed coefficients illustrate the cancellation. At \(n=10\), the endpoint term is \(-1023\), the transformed prime term is approximately \(-1023.684823\), and their completed remainder is only
\[
p_{10}=0.684823\ldots.
\]
This is strong finite cancellation, not a uniform theorem.

## 4. The kernel has no positivity structure

The associated Laguerre polynomial \(L_{n-1}^{(1)}\) has \(n-1\) positive roots. The program finds:

- four positive roots for \(L_4^{(1)}\);
- nine for \(L_9^{(1)}\);
- nineteen for \(L_{19}^{(1)}\).

Hence the kernel alternates sign increasingly often as \(n\) grows. The differentiated kernel in the prime-error identity is also signed.

Neither \(\widetilde E(x)\) nor the kernel has the sign needed for a monotone or positive-measure proof. Any successful estimate must exploit correlated oscillation between prime error and Laguerre phase, not positivity.

## 5. The prime number theorem does not reach the required scale

The ordinary prime number theorem gives
\[
\psi(x)=x+o(x).
\]
Classical zero-free-region estimates improve this to \(x\) times a decaying subpower factor. That remains much larger than the square-root scale
\[
\psi(x)-x
=O(x^{1/2}\log^2x).
\]

The square-root estimate is the scale supplied by RH through the explicit formula. Conversely, in its standard uniform form it excludes zeros to the right of \(1/2\) and is equivalent to RH.

Using it in the integral would prove subexponential growth, but deriving it here would already solve the same problem by another route. The current TTI and prime-ledger results do not supply this estimate.

## 6. Finite verification cannot remove the exponential rate

For the generalized Li map based at \(s=2\), an off-line zero contributes radial exponent
\[
\alpha(\eta,\gamma)
=
\operatorname{artanh}
\frac{3\eta}{\gamma^2+9/4+\eta^2}.
\]
Any finite verification height can only force a hypothetical first off-line zero to a larger \(\gamma\), making \(\alpha\) extremely small. It does not force \(\alpha=0\).

Even using only the critical strip and the first possible nontrivial-zero height gives the coarse exponential base
\[
1.007442777170\ldots>1.
\]
Stronger finite verification makes this number much closer to one but never proves the required limit equals one.

## 7. Proof boundary

The attempt establishes:

1. the endpoint exponential cancels the continuous prime density exactly;
2. the completed sequence is an exact signed transform of \(\psi(x)-x+1\);
3. the Laguerre kernels have increasing sign variation;
4. fixed-index convergence, absolute bounds, ordinary PNT error and finite verification do not imply subexponential growth.

The remaining theorem is still
\[
\boxed{
p_n=e^{o(n)}.}
\]
It can be supplied by any of the following RH-strength inputs:

- a new square-root-scale pointwise bound for \(\psi(x)-x\);
- the later critical all-scale mean-square theorem for the Chebyshev error; or
- a new uniform theorem proving cancellation between the Chebyshev error and the signed Laguerre kernels.

The critical-energy continuation proves that the middle statement is sufficient and weaker in pointwise form, but does not prove its estimate. Therefore the requested proof—and RH—remains open.
