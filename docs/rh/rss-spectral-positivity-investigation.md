# Attempting spectral confinement for the RSS modular completion

**Fourth-stage investigation — 14 October 2026**<br>
**Question:** Can the RSS-derived modular scattering system supply a positivity theorem that excludes every off-critical Riemann zero?<br>
**Companion program:** `scripts/research-rss-spectral-positivity.mjs`<br>
**Machine-readable results:** `docs/rh/rss-spectral-positivity-results.json`

## Verdict in one sentence

A genuine but incomplete advance has been obtained: the RSS repetition ledger gives exact positive Gram kernels on the critical half-plane; the framework’s \(\kappa_{\rm R}=1/(4\pi^2)\) is exactly the inverse first eigenvalue of the unit-period cusp circle and supplies a positive Green-weighted kernel; and modular scattering can be normalised into an exact difference equation for \(H(s)=\xi'(s)/\xi(s)\). However, these positive kernels are **not** the stronger Pick/Weil kernel whose positivity is equivalent to RH, while an explicit Blaschke counterfactor proves that scattering unitarity, reflection symmetry and a positive self-adjoint Laplacian cannot by themselves confine the resonances. No proof of RH has been found.

The investigation does isolate a minimal sufficient theorem:

> Construct, without using the Riemann zeros, RSS return-state vectors \(V_s\) such that
> \[
> \langle V_t,V_s\rangle
> =K_\xi(s,t)
> :=\frac{H(s)+\overline{H(t)}}{s+\overline t-1},
> \qquad \Re s,\Re t>\frac12.
> \]
> Then Gram positivity would prove RH.

That identity has not been derived. It is the precise remaining positivity problem rather than a claim hidden beneath the word “spectral”.

---

## 1. What a confinement theorem must actually prove

Write Riemann’s entire xi function as
\[
\xi(s)
=\frac12s(s-1)\Lambda(s),
\qquad
\Lambda(s)=\pi^{-s/2}\Gamma\!\left(\frac s2\right)\zeta(s).
\]
It obeys
\[
\xi(s)=\xi(1-s),
\qquad
\xi(\overline s)=\overline{\xi(s)}.
\]

The Riemann hypothesis is equivalent to saying that \(\xi\) has no zero in the open right critical half-plane
\[
\mathcal R=\left\{s:\Re s>\frac12\right\}.
\]
The functional equation then excludes zeros in the reflected left half-plane, leaving only \(\Re s=1/2\).

A spectral construction therefore needs more than:

- a Hilbert space with a positive norm;
- a self-adjoint modular Laplacian;
- unitary scattering on the physical line;
- the scattering functional equation; or
- numerical agreement for finitely many zeros or positivity coefficients.

It must prove a property that forbids poles of \(\xi'/\xi\) everywhere in \(\mathcal R\). The central question is which positive object would do that and whether RSS already supplies it.

## 2. Exact normalisation of the modular scattering coefficient

The modular cusp scattering coefficient is
\[
\Phi(u)=\frac{\Lambda(2u-1)}{\Lambda(2u)}.
\]
Set
\[
s=2u-1.
\]
Because
\[
\Lambda(s)=\frac{2\xi(s)}{s(s-1)},
\]
one obtains
\[
\Phi\!\left(\frac{s+1}{2}\right)
=\frac{s+1}{s-1}\frac{\xi(s)}{\xi(s+1)}.
\]
The pole-normalised scattering function is therefore
\[
\boxed{
\Psi(s)
:=\frac{s-1}{s+1}
\Phi\!\left(\frac{s+1}{2}\right)
=\frac{\xi(s)}{\xi(s+1)}.}
\]

This rational normalisation matters. Omitting it incorrectly identifies the meromorphic completed zeta \(\Lambda\) with the entire xi function.

Let
\[
H(s)=\frac{\xi'(s)}{\xi(s)}.
\]
Taking a logarithmic derivative gives the exact scattering difference equation
\[
\boxed{
\frac{\Psi'(s)}{\Psi(s)}
=H(s)-H(s+1).}
\]

Thus the modular scattering system really does contain horizontal finite differences of the function whose poles are the Riemann zeros. The companion program independently evaluates both sides at four complex points; the largest displayed discrepancy is approximately \(2.5\times10^{-11}\).

This is stronger than merely saying that zeta appears somewhere in the scattering determinant. It also shows the limitation: a finite difference of \(H\) does not determine a positivity sign for \(H\) unless a boundary condition and sign-preserving reconstruction are supplied. Iteration gives the exact telescope
\[
H(s)=H(s+N)+
\sum_{k=0}^{N-1}\frac{\Psi'(s+k)}{\Psi(s+k)},
\]
but its summands have no fixed sign and \(H(s+N)\sim\tfrac12\log(N/(2\pi))\). Renormalising the divergent endpoint recovers \(H\), not positivity.

Nor is ordinary Schur positivity of \(\Psi\) sufficient. A contractive scattering function may have interior zeros; those are precisely encoded by Blaschke factors. The required positive object must control the logarithmic derivative \(H\), not merely the magnitude of \(\Psi\).

## 3. An exact RH-equivalent Pick kernel

### 3.1 Positive-real formulation

Consider \(H(s)=\xi'(s)/\xi(s)\) on \(\mathcal R\). RH is equivalent to
\[
\boxed{
\Re H(s)>0
\quad\text{for every }\Re s>\frac12.}
\]

The forward implication can be seen from the Hadamard product. Under RH, write the zeros as
\[
\rho=\frac12+i\gamma,
\qquad \gamma\in\mathbb R.
\]
For \(w=s-1/2\), symmetric summation gives
\[
H\!\left(\frac12+w\right)
=\sum_\gamma\frac1{w-i\gamma}.
\]
Every summand has positive real part when \(\Re w>0\). Conversely, if \(H\) is holomorphic with positive real part throughout \(\mathcal R\), it cannot have a pole there, so \(\xi\) has no zero there. Reflection by \(s\mapsto1-s\) then proves RH.

Equivalently,
\[
\frac{\partial}{\partial\sigma}
\log|\xi(\sigma+it)|
=\Re H(\sigma+it)>0.
\]
So the modulus of xi must increase horizontally away from the critical line. This is the Sondow–Dumitrescu monotonicity formulation.

### 3.2 Pick-kernel formulation

A holomorphic function has positive real part on a right half-plane exactly when its Carathéodory/Pick kernel is positive semidefinite. Here that kernel is
\[
\boxed{
K_\xi(s,t)
=\frac{H(s)+\overline{H(t)}}{s+\overline t-1}.}
\]

Under RH it has the explicit Gram expansion
\[
K_\xi(s,t)
=\sum_\gamma
\frac1{(s-\tfrac12-i\gamma)
(\overline t-\tfrac12+i\gamma)}.
\]
Hence for every finite set \(s_1,\ldots,s_m\in\mathcal R\) and coefficients \(c_j\),
\[
\sum_{j,k}c_j\overline{c_k}K_\xi(s_j,s_k)
=
\sum_\gamma
\left|
\sum_j\frac{c_j}{s_j-\tfrac12-i\gamma}
\right|^2
\ge0.
\]

Conversely, positivity for every finite point set makes \(H\) a positive-real holomorphic function on \(\mathcal R\), excluding every off-critical zero. Therefore:

> **Xi Pick criterion.** RH holds if and only if \(K_\xi\) is positive semidefinite on \(\Re s>1/2\).

This is the sought spectral-confinement mechanism in exact form. It is not yet a proof, because the displayed Gram expansion used the assumption that the zero ordinates \(\gamma\) are real. To prove RH, RSS would have to construct an equal Gram representation from independently defined return or lattice data.

The program sampled 66 values of \(H\) and three nontrivial Pick matrices. Their real parts and finite LDL\(^*\) pivots were positive. These checks validate the implementation but prove nothing about unsampled points or matrices of arbitrary size.

## 4. A real positivity theorem supplied by the RSS ledger

The primitive-versus-repeated lattice construction does produce positivity—just not yet the right positivity.

For \(\Re s>1/2\), define the feature vector
\[
v_s=(1^{-s},2^{-s},3^{-s},\ldots).
\]
It belongs to \(\ell^2\), because \(\sum n^{-2\Re s}\) converges. Its Gram kernel is
\[
\boxed{
K_{\rm rep}(s,t)
=\langle v_t,v_s\rangle
=\sum_{n=1}^\infty n^{-s-\overline t}
=\zeta(s+\overline t).}
\]
Consequently,
\[
\sum_{j,k}c_j\overline{c_k}
\zeta(s_j+\overline{s_k})
=
\sum_{n=1}^\infty
\left|\sum_jc_jn^{-s_j}\right|^2
\ge0.
\]

This is an unconditional positive kernel on the same half-plane \(\mathcal R\). It has a direct RSS meaning: \(n\) is the integer repetition scale separating primitive ledger directions from all repeated states.

Prime powers give a second positive kernel. With the von Mangoldt weight \(\Lambda_{\rm vM}(n)\),
\[
\boxed{
K_{\Lambda}(s,t)
=
\sum_{n=2}^\infty
\Lambda_{\rm vM}(n)n^{-s-\overline t}
=-\frac{\zeta'}{\zeta}(s+\overline t).}
\]
It is Gram because its features are
\[
\sqrt{\Lambda_{\rm vM}(n)}\,n^{-s}.
\]
The program constructs both kernels through \(n=50{,}000\); all displayed LDL\(^*\) pivots are strictly positive.

This is the strongest unconditional positivity obtained in the present attempt:

> **RSS repetition-kernel theorem.** Integer repetitions and prime-power repetitions generate positive-semidefinite Dirichlet kernels on the open critical half-plane.

### 4.1 The framework’s existing \(\kappa\) value

The framework’s Cosmic Ledger has already fixed its geometric coupling as
\[
\boxed{\kappa_{\rm R}=\frac1{4\pi^2}}.
\]
This value was not absent from the wider RSS framework; the earlier version of this investigation failed to carry it into the spectral analysis.

It now has an exact interpretation in the modular completion. The cusp coordinate has unit period,
\[
x\sim x+1,
\]
so its Fourier modes are \(e^{2\pi i n x}\). The positive transverse Laplacian obeys
\[
-\partial_x^2e^{2\pi i n x}
=4\pi^2n^2e^{2\pi i n x}.
\]
Consequently,
\[
\kappa_{\rm R}=\frac1{4\pi^2}
=\lambda_1^{-1}
\]
is precisely the inverse of the first non-zero cusp-circle eigenvalue. On the mean-zero subspace, the Green operator
\[
G=(-\partial_x^2)^{-1}
\]
is positive and has eigenvalues
\[
\frac{\kappa_{\rm R}}{n^2}.
\]
Its two-sided trace is the exact Basel value
\[
\operatorname{Tr}G
=2\kappa_{\rm R}\sum_{n=1}^{\infty}\frac1{n^2}
=2\frac1{4\pi^2}\frac{\pi^2}{6}
=\frac1{12}.
\]

Applying \(G^{1/2}\) to the positive-frequency repetition features produces another unconditional Gram kernel:
\[
V_s^{(\kappa)}(n)
=\sqrt{\kappa_{\rm R}}\,n^{-s-1},
\]
\[
\boxed{
K_\kappa(s,t)
=\kappa_{\rm R}\zeta(s+\overline t+2).}
\]
The verifier now constructs this kernel through \(n=50{,}000\) and confirms positive LDL\(^*\) pivots.

This is a real bridge: the already-derived RSS coupling is also the canonical inverse-Laplacian scale of the unit modular cusp. The numerical equality is exact once the cusp period is one. Identifying the framework’s torus/Möbius coupling with this cusp Green scale is still an interpretation of the shared value, not a derivation of the arithmetic Pick kernel.

A notation collision should also be removed. In `rss-modular-derivation.md`, the temporary coefficient in \(R(x)=\kappa/x\) is fixed to one by projective normalisation. That coefficient is now denoted \(\kappa_{\rm proj}=1\); it is not the geometric coupling \(\kappa_{\rm R}=1/(4\pi^2)\).

### 4.2 Why \(\kappa\) still does not prove RH

The arguments of zeta in these kernels are
\[
s+\overline t,
\qquad
\Re(s+\overline t)>1.
\]
Thus the first two kernels only evaluate the Dirichlet series and Euler product in their absolute-convergence region. The Green-weighted kernel is evaluated still farther right, at \(s+\overline t+2\). None evaluates \(\xi(s)\) at the original point \(s\in\mathcal R\), and none encounters a hypothetical zero with \(1/2<\Re s<1\).

Multiplication by the positive number \(\kappa_{\rm R}\) preserves a kernel’s sign but cannot move or exclude zeros. Applying the inverse cusp Laplacian adds the useful positive weight \(n^{-2}\), but this shifts the combined zeta argument rather than producing \(H(s)=\xi'(s)/\xi(s)\).

Differentiating the logarithm produces the positive prime-power kernel, but it still has the combined argument \(s+\overline t\). Analytic continuation from that two-variable Gram kernel to the one-variable function \(H(s)\) is not a positivity-preserving operation. The missing identity is therefore
\[
K_{\rm rep},\ K_\Lambda\text{ or }K_\kappa
\quad\not\equiv
the RH-equivalent kernel \(K_\xi\).
\]

No valid Schur complement, compression or positive integral transform carrying the ledger kernels to \(K_\xi\) was found. Producing one would be a genuine proof-level advance.

## 5. Why scattering unitarity cannot provide confinement by itself

The modular Laplacian is self-adjoint, and its scattering coefficient is unitary on the physical line. That does not make scattering resonances ordinary \(L^2\) eigenvalues. Resonances are poles of a meromorphic continuation and can be complex even for a self-adjoint system.

There is an exact algebraic obstruction. Put \(w=u-1/2\), so the physical scattering line is \(\Re w=0\). For any complex \(a\) with \(\Re a>0\), define
\[
C_a(w)
=
\frac{(w-a)(w-\overline a)}
{(w+\overline a)(w+a)}.
\]
Then
\[
C_a(w)C_a(-w)=1,
\]
\[
|C_a(it)|=1
\quad(t\in\mathbb R),
\]
and
\[
C_a(\overline w)=\overline{C_a(w)}.
\]
Nevertheless, \(C_a\) has zeros at \(a,\overline a\) and poles at \(-a,-\overline a\). Their horizontal displacement is arbitrary.

Multiplying a one-channel scattering coefficient by such a factor preserves:

- boundary unitarity;
- the reflection functional equation;
- real analyticity; and
- the limiting value one at large spectral parameter,

while adding an arbitrary off-axis resonance pair. The companion program checks these identities for \(a=0.22+1.7i\) to roundoff, with maximum error \(2.3\times10^{-16}\).

Xi’s functional and conjugation symmetries have a parallel obstruction. For an arbitrary non-real offset \(a\), the factor
\[
P_a(s)=
\left((s-\tfrac12)^2-a^2\right)
\left((s-\tfrac12)^2-\overline a^{\,2}\right)
\]
obeys
\[
P_a(1-s)=P_a(s),
\qquad
P_a(\overline s)=\overline{P_a(s)},
\]
while inserting the zero quadruple \(1/2\pm a\), \(1/2\pm\overline a\). Multiplying xi by this polynomial would not preserve its Euler product or precise asymptotics, so it is not a zeta model. It proves exactly the intended no-go: functional and reality symmetries alone do not confine zeros. The program checks this second counterfactor independently.

This does not say that the modular scattering coefficient is arbitrary; its arithmetic formula is fixed. It proves a narrower but decisive no-go statement:

> **Unitarity no-go.** Unitarity, self-adjointness and reflection symmetry alone cannot be the missing RH argument. Any successful proof must use additional arithmetic positivity beyond those structural properties.

The positive torus-shape metric derived in the third-stage report is likewise a different quadratic form. It measures relative deformation of a Gram matrix. No identity equating it with \(K_\xi\) or Weil’s arithmetic form follows from basis invariance.

## 6. Weil positivity is the global version of the missing theorem

For a smooth compactly supported function \(g\) on \((0,\infty)\), let
\[
\widehat g(s)=\int_0^\infty g(u)u^s\frac{du}{u}
\]
be its Mellin transform. Weil’s quadratic form can be written spectrally as
\[
\mathcal W(g)
=
\sum_\rho
\widehat g(\rho)
\overline{\widehat g(1-\overline\rho)}.
\]

If RH holds, then \(1-\overline\rho=\rho\), and therefore
\[
\mathcal W(g)=
\sum_\rho|\widehat g(\rho)|^2\ge0.
\]
Weil’s converse shows that an off-critical zero permits test functions for which this form is negative. Thus
\[
\boxed{
\mathrm{RH}
\quad\Longleftrightarrow\quad
\mathcal W(g)\ge0
\text{ for every admissible }g.}
\]

The explicit formula rewrites \(\mathcal W\) using prime-power and archimedean terms. RSS already supplies a route to those prime-power terms through primitive/repeated lattice states. But the terms enter a globally regularised form, not as the positive kernel \(K_\Lambda\) alone. Subtraction of cusp and archimedean contributions destroys term-by-term positivity.

A tempting argument would be: “the Eisenstein series has a positive \(L^2\) norm, so its scattering contribution is positive.” This fails because the scattering phase is obtained only after subtracting divergent cusp terms. A finite part of a positive divergent quantity need not be positive. Positivity must survive the exact renormalisation, which is essentially the unresolved Weil criterion.

The useful RSS target can therefore be stated in either of two equivalent ways:

1. produce a covariance or Gram representation of \(\mathcal W(g)\) for the full admissible test space; or
2. produce a Gram representation of \(K_\xi(s,t)\) on the full right critical half-plane.

Verifying a restricted family of test functions or a finite matrix is insufficient unless density and closure preserve the form.

## 7. Li positivity: a discrete diagnostic, not a shortcut

The Li coefficients are defined by
\[
\lambda_n
=
\frac1{(n-1)!}
\left.
\frac{d^n}{ds^n}
\left[s^{n-1}\log\xi(s)\right]
\right|_{s=1}.
\]
Equivalently,
\[
\log\xi\!\left(\frac1{1-z}\right)
=-\log2+
\sum_{n=1}^\infty\frac{\lambda_n}{n}z^n.
\]
Li’s theorem says
\[
\boxed{
\mathrm{RH}
\quad\Longleftrightarrow
\lambda_n\ge0
\text{ for every }n\ge1.}
\]

The program computes the first 30 coefficients by Cauchy extraction on two independent contours. Every displayed coefficient is positive; the largest difference between the two computations is approximately \(1.3\times10^{-6}\). It also recovers
\[
\lambda_1
=1+\frac\gamma2-\frac12\log(4\pi)
=0.0230957089\ldots
\]
to the requested tolerance.

This is a reproducibility check, not new evidence capable of proving RH. A hypothetical off-critical zero at sufficiently great height changes any fixed finite prefix by an arbitrarily small amount. Eventually its Li contribution grows exponentially and causes non-tempered oscillation, but there is no finite universal index at which it must become visible. Therefore “all coefficients checked so far are positive” can never establish the theorem.

## 8. The minimal new RSS theorem that would prove RH

The attempt leaves one sharply specified route.

### RSS arithmetic Gram-lift conjecture

Construct from primitive RSS return channels, without referencing the Riemann zeros, a Hilbert space \(\mathcal H_{\rm RSS}\) and vectors \(V_s\) for every \(\Re s>1/2\) satisfying
\[
\boxed{
\langle V_t,V_s\rangle_{\mathcal H_{\rm RSS}}
=
\frac{\xi'(s)/\xi(s)+
\overline{\xi'(t)/\xi(t)}}
{s+\overline t-1}.}
\]

If this identity were proved, then for every finite coefficient vector,
\[
\sum_{j,k}c_j\overline{c_k}K_\xi(s_j,s_k)
=
\left\|\sum_jc_jV_{s_j}\right\|^2
\ge0.
\]
The Pick criterion would imply \(\Re(\xi'/\xi)>0\) throughout \(\mathcal R\), excluding zeros there. The xi functional equation would then prove RH.

A valid construction must meet all of these tests:

1. **Zero independence:** the vectors must be defined from RSS/lattice/prime data, not from assumed real zero ordinates.
2. **Exact kernel identity:** asymptotics, finite matching and shared determinants are insufficient.
3. **Full domain:** the identity must hold throughout \(\Re s,\Re t>1/2\), not merely where the Euler product converges in one variable.
4. **Renormalised positivity:** cusp and archimedean subtraction must be included without an indefinite remainder.
5. **Closure:** positivity must extend to the complete Weil test space or all finite Pick matrices.
6. **No circular causality axiom:** declaring off-critical poles “noncausal” is useful only if causality is independently derived and is proved to forbid precisely those poles.

The current RSS data proves positivity for \(K_{\rm rep}\), \(K_\Lambda\), the \(\kappa_{\rm R}\)-normalised cusp Green kernel, the torus strain metric and ordinary Hilbert norms. It does not yet prove the Gram-lift identity.

## 9. Final assessment

### Achieved

1. The modular scattering coefficient has been correctly normalised into \(\Psi(s)=\xi(s)/\xi(s+1)\).
2. Its logarithmic derivative gives the exact horizontal difference \(H(s)-H(s+1)\).
3. An exact Pick kernel whose positivity is equivalent to RH has been identified.
4. Integer repetitions and prime-power repetitions yield two unconditional positive Gram kernels on \(\Re s>1/2\).
5. The existing value \(\kappa_{\rm R}=1/(4\pi^2)\) is exactly the inverse first eigenvalue of the unit-period cusp circle and induces a third positive Green-weighted kernel.
6. A rigorous counterfactor shows that unitarity and reflection symmetry permit off-axis resonances.
7. Finite Pick and Li diagnostics have been independently reproduced.
8. The one additional theorem sufficient for an RSS proof has been stated in an auditable, non-circular form.

### Not achieved

1. No equality between any of the three RSS ledger/Green kernels and \(K_\xi\) has been proved.
2. No globally positive Weil form has been constructed from RSS observables.
3. No sign-preserving inversion of the scattering finite-difference equation has been found.
4. No mechanism has been found that makes modular resonances eigenvalues of a self-adjoint operator with the required vertical alignment.
5. RH remains unproved.

The honest conclusion is not that positivity failed everywhere. A substantial positive structure is present, and it begins exactly at the critical half-plane. The failure is more specific: the presently derived positive form tests **integer repetitions at the combined argument** \(s+\overline t\), whereas RH requires positivity of the **xi logarithmic derivative at the original spectral argument**. Bridging those two kernels without assuming RH is now the central problem.

> **Transform follow-up:** `rss-kappa-pick-transform.md` finds an exact bridge. The prime-power/archimedean screw kernel maps to \(K_\xi\) by a double Laplace congruence, with \(\kappa_{\rm R}\) providing the inverse-square frequency normalisation. Kernel equality is achieved; global screw-kernel positivity remains equivalent to RH.
>
> **Global-positivity follow-up:** `rss-global-screw-positivity-attempt.md` carries the target through exact recovery witnesses to \(\mathcal J_q\le\mathcal C_q\), equivalently a weighted arrival-centroid inequality, and proves why termwise hinge positivity and unsigned RSS primitive extraction cannot supply that estimate.

---

## Reproducibility

Run from the repository root:

```bash
npm run research:rss-positivity
```

The standard-library-only program verifies:

- four xi functional-equation samples;
- four normalised scattering/xi ratio and logarithmic-derivative identities;
- positive finite Gram matrices for 50,000 repetition, prime-power and \(\kappa_{\rm R}\)-weighted inverse-cusp features;
- the exact identities \(4\pi^2\kappa_{\rm R}=1\) and \(2\kappa_{\rm R}\zeta(2)=1/12\);
- 66 sampled values of \(\Re(\xi'/\xi)\);
- three finite xi Pick matrices;
- 30 Li coefficients on two independent Cauchy contours; and
- the unitary/reflection/reality identities of an arbitrary off-axis resonance counterfactor.

All numerical checks are explicitly labelled finite diagnostics.

## Selected literature

1. Jeffrey C. Lagarias, *The Riemann Hypothesis: Arithmetic and Geometry*, for Weil and Li positivity and the distinction between spectral interpretation and the required positivity: <https://websites.umich.edu/~lagarias/doc/mt-holyoke-rev.pdf>
2. Jean-François Burnol, “The Explicit Formula in Simple Terms,” for Weil’s criterion and its covariance interpretation: <https://arxiv.org/pdf/math/9810169>
3. Enrico Bombieri and Jeffrey C. Lagarias, “Complements to Li’s Criterion for the Riemann Hypothesis,” *Journal of Number Theory* 77 (1999), 274–287: <https://www.sciencedirect.com/science/article/pii/S0022314X99923922>
4. Jonathan Sondow and Cristian Dumitrescu, “A monotonicity property of Riemann’s xi function and a reformulation of the Riemann hypothesis,” *Periodica Mathematica Hungarica* 60 (2010), 37–40: <https://arxiv.org/pdf/1005.1104>
5. Maciej Zworski, “Mathematical study of scattering resonances,” for the distinction between self-adjoint spectra and complex resonances: <https://d-nb.info/1129547876/34>
6. J. Brian Conrey and Xian-Jin Li, “A note on some positivity conditions related to zeta and L-functions,” for obstructions in de Branges/scattering positivity programmes: <https://aimath.org/~kaur/publications/41.pdf>
