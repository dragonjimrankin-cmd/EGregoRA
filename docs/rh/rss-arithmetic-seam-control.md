# Finding an arithmetic controller for the two-ended seam

**Twenty-first-stage investigation — 15 October 2026**  
**Question:** Can the two-ended seam product be controlled from primes rather than left solely as a zero-side reformulation?  
**Companion program:** `scripts/research-rss-arithmetic-seam-control.py`  
**Machine-readable results:** `docs/rh/rss-arithmetic-seam-control-results.json`

## Verdict

An exact arithmetic controller has been found, but its decisive estimate has not been proved.

A generalized Li coordinate based at \(s=2\) maps the critical line to the unit circle and every hypothetical off-line quartet to reciprocal points, one inside and one outside that circle. Applying the coordinate to the endpoint-completed Euler function
\[
(s-1)\zeta(s)
\]
produces coefficients with an absolutely convergent von Mangoldt–Laguerre formula at every fixed index. Their exponential growth rate detects whether any zero lies off the critical line.

For the concrete base point \(s=2\), define
\[
p_n
=1+(-1)^{n+1}2^n
-3\sum_{m\ge2}
\frac{\Lambda(m)}{m^2}
L_{n-1}^{(1)}(3\log m).
\]
Then
\[
\boxed{
\mathrm{RH}
\quad\Longleftrightarrow\quad
\limsup_{n\to\infty}|p_n|^{1/n}=1.}
\]
Equivalently, RH follows if this prime sequence is subexponential:
\[
p_n=e^{o(n)}.
\]

This is the requested arithmetic control in exact target form. It does not complete the proof because the all-index cancellation between the explicit endpoint term and the oscillatory prime-power sum has not been established. Proving it would be another criterion equivalent to RH.

---

## 1. Why one ordinary explicit-formula test cannot equal the seam defect

The two-ended seam defect is
\[
\varepsilon(\eta)
=-2\log\cos(\pi\eta).
\]
It depends on horizontal displacement and is independent of ordinate.

Suppose one tried to obtain it from a single holomorphic Weil test \(h\), with
\[
\Re h(x+iy)=f(y)
\]
independent of \(x\) on an open strip. Since the real part of a holomorphic function is harmonic,
\[
f''(y)=0.
\]
If \(f\) is also even, it must be constant. But
\[
\varepsilon''(y)
=2\pi^2\sec^2(\pi y)>0.
\]

Therefore no single analytic explicit-formula test can have real part equal to the nonlinear, height-independent seam defect. Arithmetic control must instead use either a nonlinear determinant or a complete family of analytic tests. This explains why ordinary convergent zero sums inevitably reintroduce height weights.

## 2. Move the arithmetic expansion into the Euler half-plane

Choose a real parameter \(a<0\) and set
\[
c=\frac12-a,
\qquad
s_0=1-a=\frac12+c.
\]
The base point \(s_0\) lies strictly to the right of one, where the Euler and von Mangoldt series converge absolutely.

Define the generalized Li coordinate
\[
z_a(s)
=\frac{s+a-1}{s-a}.
\]
Its inverse is
\[
s_a(z)
=\frac{1-a-az}{1-z}
=s_0+\frac{(1-2a)z}{1-z}.
\]
On the critical line,
\[
|z_a(1/2+i\gamma)|=1.
\]

For
\[
\rho=\frac12+\eta+i\gamma,
\]
one obtains
\[
|z_a(\rho)|^2
=
\frac{\gamma^2+(c-\eta)^2}
{\gamma^2+(c+\eta)^2}.
\]
Thus \(\eta>0\) places the mapped zero strictly inside the unit disk. Critical reflection sends it to the reciprocal conjugate outside the disk.

Every off-line quartet therefore leaves an interior singularity in the generalized Li disk.

## 3. Endpoint-complete the prime function first

Using \(\log\zeta(s)\) alone creates a pole at \(s=1\). Under the disk map, its coefficients contain a large artificial exponential that must cancel the separate endpoint factor \(\log(s-1)\).

The correct arithmetic object is their exact combination
\[
C(s)=(s-1)\zeta(s).
\]
It is entire. Its zeros are the nontrivial and trivial zeta zeros, while the zeta pole has already been removed.

Define
\[
P_a(z)
=
\log
\frac{(s_a(z)-1)\zeta(s_a(z))}
{(-a)\zeta(1-a)}
=
\sum_{n\ge1}\frac{p_{n,a}}n z^n.
\]
The normalization makes \(P_a(0)=0\).

The trivial zeros lie to the left of the critical line and map outside the unit disk. The point \(z=1\), corresponding to infinite \(s\), lies on its boundary. The only possible singularities inside the disk come from nontrivial zeros with \(\Re\rho>1/2\).

Consequently the series radius \(R_a\) obeys
\[
R_a=1
\quad\Longleftrightarrow\quad
\mathrm{RH}.
\]
Cauchy–Hadamard now gives
\[
\frac1{R_a}
=
\limsup_{n\to\infty}
\left|\frac{p_{n,a}}n\right|^{1/n}
=
\limsup_{n\to\infty}|p_{n,a}|^{1/n}.
\]
This is the required all-height detector.

## 4. Exact prime-power formula

In \(\Re s>1\),
\[
\log\zeta(s)
=
\sum_{m\ge2}
\frac{\Lambda(m)}{\log m}\,m^{-s}.
\]
Expanding through the generalized Li map gives
\[
\boxed{
p_{n,a}
=
1+(-1)^{n+1}
\left(\frac{1-a}{-a}\right)^n
-(1-2a)
\sum_{m\ge2}
\frac{\Lambda(m)}{m^{1-a}}
L_{n-1}^{(1)}((1-2a)\log m).}
\]

For each fixed \(n\), the Laguerre factor is only a polynomial in \(\log m\). Because \(1-a>1\), this von Mangoldt series converges absolutely.

The first two terms arise from \(\log(s-1)\). They cancel the artificial exponential created by treating the zeta pole separately. This endpoint completion is essential: estimating the pole and prime pieces independently produces exponentially large terms even when their completed sum remains moderate.

### The concrete controller at \(a=-1\)

Here
\[
s_0=2,
\qquad
1-2a=3,
\]
and
\[
\boxed{
p_n
=1+(-1)^{n+1}2^n
-3\sum_{m\ge2}
\frac{\Lambda(m)}{m^2}
L_{n-1}^{(1)}(3\log m).}
\]
The exact missing estimate is
\[
\boxed{
p_n=e^{o(n)}.}
\]
If established, it forces \(R_{-1}=1\), excludes every zero with \(\Re\rho>1/2\), and functional symmetry excludes every zero with \(\Re\rho<1/2\). The two-ended seam infimum must then equal one.

## 5. Relation to the ordinary generalized Li coefficients

Factor xi as
\[
\xi(s)
=
\left[\frac12s\pi^{-s/2}\Gamma(s/2)\right]
\left[(s-1)\zeta(s)\right].
\]
The same disk expansion splits each generalized Li coefficient into an archimedean part and the completed-prime coefficient \(p_n\).

A 1,024-point Cauchy extraction at radius \(0.18\), using independent Euler–Maclaurin zeta and Lanczos gamma evaluators, gives for \(a=-1\):

| \(n\) | Completed-prime \(p_n\) | Archimedean part | Generalized Li coefficient |
|---:|---:|---:|---:|
| 1 | 1.2901170207 | −1.0829183261 | 0.2071986946 |
| 2 | 1.5405705471 | −0.7147350018 | 0.8258355453 |
| 3 | 1.4245268381 | 0.4226079247 | 1.8471347628 |
| 4 | 1.1928757903 | 2.0639297760 | 3.2568055663 |
| 5 | 0.9551399810 | 4.0803911045 | 5.0355310855 |
| 6 | 0.7630027948 | 6.3966218677 | 7.1596246625 |
| 7 | 0.6390841665 | 8.9627426866 | 9.6018268531 |
| 8 | 0.5890886790 | 11.7431221364 | 12.3322108153 |
| 9 | 0.6081577149 | 14.7110018305 | 15.3191595461 |
| 10 | 0.6848230571 | 17.8455527087 | 18.5303757658 |

These finite values verify the normalization and decomposition. They do not establish subexponential growth for every \(n\).

## 6. How an escaping zero reaches the arithmetic controller

For fixed \(c\), define the radial Li exponent
\[
\alpha_c(\eta,\gamma)
=-\log|z_a(\rho)|
=
\operatorname{artanh}
\frac{2c\eta}{\gamma^2+c^2+\eta^2}.
\]
At large height,
\[
\alpha_c(\eta,
\gamma)
\sim
\frac{2c\eta}{\gamma^2}.
\]
An inside-disk singularity contributes coefficient growth on the scale
\[
e^{n\alpha_c}.
\]
It becomes order-one visible when
\[
n\asymp\alpha_c^{-1}.
\]

For \(a=-1\), \(c=3/2\), and the escaping displacement \(\eta=1/4\):

| Stage | Height \(\varphi^N\) | Approximate e-fold coefficient index |
|---:|---:|---:|
| 14 | 842.999 | 947,532 |
| 20 | 15,127.000 | 305,101,506 |
| 30 | 1,860,498.000 | \(4.62\times10^{12}\) |
| 40 | 228,826,127.000 | \(6.98\times10^{16}\) |

Thus every escaping zero is detected by the infinite coefficient sequence, but no fixed finite prefix detects all possible heights. This is exactly how the arithmetic controller repairs the height-decay problem without creating a finite verification of RH.

If a target height were already known, choosing
\[
c=\sqrt{\gamma^2+\eta^2}
\]
maximizes the radial exponent and gives
\[
\alpha_{
m max}
=\operatorname{arsinh}(\eta/\gamma).
\]
That scale-matched detector is faster, but choosing a different base point for each unknown zero does not provide one uniform proof.

## 7. What has and has not been controlled

The two-ended seam marker now has an exact arithmetic controller:

\[
\text{prime powers}
\longrightarrow
p_n
\longrightarrow
R_a
\longrightarrow
\text{absence of interior mapped zeros}
\longrightarrow
\inf_a P_a(+1)P_a(-1)=1.
\]

The unresolved step is one explicit cancellation theorem:
\[
1+(-1)^{n+1}2^n
-3\sum_{m\ge2}
\frac{\Lambda(m)}{m^2}
L_{n-1}^{(1)}(3\log m)
=e^{o(n)}.
\]

Absolute convergence for each fixed \(n\) is not enough. The estimate must be uniform as \(n\to\infty\). Termwise absolute bounds lose the oscillatory cancellation and are exponentially too large.

This is genuine progress in formulation: the arithmetic object, endpoint completion, prime-power weights and required asymptotic are all explicit. But the asymptotic is equivalent to excluding off-line zeros. It must not be presented as established.

No proof of RH is obtained.

## 8. Critical-energy application note

The later [critical Chebyshev-energy theorem](./rss-critical-chebyshev-energy.md) supplies a precise conditional closure of this controller. If
\[
\int_X^{2X}|\psi(x)-x|^2dx\ll_\delta X^{2+\delta}
\quad\text{for every }\delta>0,
\]
then all critical weighted norms of the shifted prime error are finite. The Hilbert-valued Laguerre generating function consequently gives \(p_n=e^{o(n)}\), the generalized Li radius is at least one and RH follows.

This applies the energy theorem to the controller; it does not prove the energy estimate. The [spin–colour follow-up](./rss-energy-spin-colour.md) also shows that repeating the controller across two spin and three colour states changes \(p_n\) by only a fixed multiplicity and leaves its root-test radius unchanged.

