# Independent-review note: the endpoint-completed prime-phase law

**Prepared:** 15 October 2026  
**Purpose:** external mathematical checking, not a priority or novelty claim  
**Primary reports:** `rss-prime-phase-conservation.md` and `rss-reverse-prime-phase-inequality.md`  
**Exact certificate:** `scripts/certify-rss-prime-phase-defect.py`

## Claim boundary

This note asks reviewers to check three results:

1. an exact weighted prime-phase identity for \(\Re s>1\);
2. an exact positive off-line-zero defect at the critical boundary;
3. an explicit upper bound smaller than \(9.274\times10^{-37}\) for that defect, using published zero verification and zero counting.

It does **not** claim a proof of the Riemann Hypothesis. The reverse inequality that would force the defect to vanish remains unproved. No claim of novelty is made until the formulas have been compared comprehensively with the literature on Poisson--Jensen, Volchkov-type criteria, Balazard--Saias--Yor and weighted argument integrals.

## 1. Normalisation

Let
\[
C(s)=(s-1)\zeta(s),
\qquad a=\frac32.
\]
For \(\sigma>1\), use the Euler-product branch of \(\log\zeta(\sigma+iT)\), tending to zero as \(\sigma\to+\infty\), and define
\[
\mathcal I_C(\sigma)
=
\frac6\pi
\int_0^\infty
\frac{T\arg C(\sigma+iT)}{(T^2+9/4)^2}\,dT.
\]
The first review question is whether all argument conventions and endpoint values are stated sufficiently to make this unambiguous.

## 2. Euler-domain identity

Absolute convergence gives
\[
\log\zeta(\sigma+iT)
=
\sum_{n\ge2}
\frac{\Lambda(n)}{\log n}
 n^{-\sigma-iT}.
\]
The kernel transform is
\[
\int_0^\infty
\frac{T\sin(bT)}{(T^2+a^2)^2}\,dT
=
\frac{\pi b}{4a}e^{-ab},
\qquad a,b>0.
\]
At \(a=3/2\), the prefactor \((6/\pi)(\pi/(4a))\) is one. Termwise integration therefore gives
\[
\frac6\pi
\int_0^\infty
\frac{T\arg\zeta(\sigma+iT)}{(T^2+9/4)^2}\,dT
=-
\sum_{n\ge2}\frac{\Lambda(n)}{n^{\sigma+3/2}}.
\]
The endpoint factor contributes
\[
\frac6\pi
\int_0^\infty
\frac{T\arg(\sigma-1+iT)}{(T^2+9/4)^2}\,dT
=
\frac1{\sigma+1/2}.
\]
Hence
\[
\boxed{
\mathcal I_C(\sigma)
=
\frac1{\sigma+1/2}
-
\sum_{n\ge2}\frac{\Lambda(n)}{n^{\sigma+3/2}},
\qquad \sigma>1.
}
\]

### Review checks

- Justify Fubini or dominated termwise integration from absolute convergence.
- Confirm the sign of the sine transform.
- Confirm the branch of \(\arg(\sigma-1+iT)\).
- Confirm the factor \(6/\pi\).
- Check that no gamma-factor term belongs in this Euler-domain identity for \(C\).

## 3. Boundary endpoint and pole correction

Formally setting \(\sigma=1/2\) on the prime side gives
\[
1-
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}
=
1+\frac{\zeta'}{\zeta}(2)
=
\frac{C'}C(2).
\]
At the boundary,
\[
\arg\left(-\frac12+iT\right)
=
\pi-
arctan(2T),
\qquad T>0.
\]
Its weighted transform is \(5/6\), not one. Relative to the formal analytic endpoint, the pole correction is therefore
\[
-\frac16.
\]
This term was omitted in the first draft of the derivation and was restored before the final Stage-33 report.

### Review checks

- Verify the continuous boundary argument convention.
- Verify separately the constant-\(\pi\) and arctangent integrals.
- Check that the endpoint factor is not double-counted when comparing with \(\xi'/\xi\).

## 4. Critical-boundary defect

Let
\[
\rho=\frac12+\eta+i\gamma,
\qquad 0<\eta<\frac12,
\]
represent one off-line quartet. The claimed quartet contribution is
\[
 d_{\eta,\gamma}
=
\frac{
6\eta^2(\eta^2+3\gamma^2-9/4)
}{
(\gamma^2+9/4)
\left[(\gamma^2-\eta^2+9/4)^2+4\eta^2\gamma^2\right]
}.
\]
Every denominator is positive, and the known first-zero height makes the remaining numerator factor positive. Summing over off-line quartets gives
\[
\boxed{
\mathcal I_C^{\rm crit}-\frac{C'}C(2)
=
\mathcal D_2
=
\sum_{	ext{off-line quartets}}d_{\eta,\gamma}
\ge0.
}
\]
Thus
\[
\mathcal I_C^{\rm crit}
\le\frac{C'}C(2)
\iff
\mathcal D_2=0
\iff
\mathrm{RH}.
\]

### Review checks

- Re-derive the quartet formula independently from the paired logarithmic derivatives.
- Confirm whether the sum indexes one representative per full quartet.
- Check multiplicities.
- Verify absolute convergence from \(N(T)=O(T\log T)\).
- Confirm that no zero at the boundary of the moving contour is silently included.

## 5. Canonical-factorisation comparison

Balazard--Saias--Yor prove
\[
S_{\rm BSY}
=
\frac1{2\pi}
\int_{\Re s=1/2}
\frac{\log|\zeta(s)|}{|s|^2}|ds|
=
\sum_{\Re\rho>1/2}
\log\left|\frac{\rho}{1-\rho}\right|.
\]
Burnol's Nyman projection theorem identifies the corresponding Blaschke product through
\[
\operatorname{dist}(1,NB)^2
=1-|B(1)|^2
=1-e^{-2S_{\rm BSY}}.
\]
The Stage-33 scalar is a different positive kernel on the same forbidden divisor. The review note claims only the common vanishing set
\[
\mathcal D_2=0
\iff S_{\rm BSY}=0
\iff B=1
\iff\operatorname{dist}(1,NB)=0.
\]
It does not claim numerical equality between these defects.

### Review checks

- Confirm the half-plane versus disk normalisation of \(B(1)\).
- Confirm the factor of two in the Nyman distance relation.
- Check the quartet convention in the BSY sum.

## 6. Explicit tail bound

Platt--Trudgian verify that every positive-ordinate nontrivial zero through
\[
H=3{,}000{,}175{,}332{,}800
\]
lies on the critical line. Therefore every contributing off-line quartet has \(\gamma>H\).

For \(0<\eta^2<1/4\),
\[
d_{\eta,\gamma}
\le
\frac92\gamma^{-4}
+
\frac38\gamma^{-6}.
\]
For \(p>1\), Stieltjes integration and the omission of the negative endpoint term give
\[
\sum_{\gamma>H}\gamma^{-p}
\le
p\int_H^\infty N(T)T^{-p-1}\,dT.
\]
Bellotti--Wong's upper bound is
\[
N(T)
\le
\frac{T}{2\pi}
\log\frac{T}{2\pi e}
+0.10076\log T
+0.24460\log\log T
+8.08344,
\qquad T\ge e.
\]
Using \(\log\log T\le\log T\) and integrating gives exact rationally enclosed upper bounds
\[
\sum_{\gamma>H}\gamma^{-4}
<2.060805050027808\times10^{-37},
\]
\[
\sum_{\gamma>H}\gamma^{-6}
<2.050087910596571\times10^{-62}.
\]
Consequently
\[
\boxed{
0\le\mathcal D_2
<9.274\times10^{-37}.
}
\]

The executable certificate uses only `fractions.Fraction` for proof comparisons. It encloses \(\pi\) using Machin's identity and alternating arctangent series, and encloses logarithms using the positive atanh series with an explicit tail. The final comparison is exact integer cross multiplication against
\[
\frac{9274}{10^{40}}.
\]
Decimal output is display-only.

### Review checks

- Verify the stated versions and constants of both external inputs.
- Check the strict verified endpoint and the open tail \(\gamma>H\).
- Check that counting every positive zero overcounts rather than undercounts quartet representatives.
- Recheck the pointwise denominator bound.
- Audit the rational-series remainder formulas in the certificate.

## 7. Evidence and nonclaims

| Item | Status |
|---|---|
| Euler-domain phase identity | Proved internally from an absolutely convergent series |
| Endpoint transform and \(-1/6\) correction | Proved internally |
| Quartet defect formula | Proved internally; independent re-derivation requested |
| Platt--Trudgian verified height | External rigorous computation |
| Bellotti--Wong zero-count bound | External analytic theorem |
| \(9.274\times10^{-37}\) comparison | Exact rational executable certificate from the two inputs |
| Reverse inequality | Not proved; equivalent to RH |
| RH | Not proved |
| Novelty | Not asserted |

## 8. Requested reviewer response

A useful review should report separately:

1. any normalisation or branch error;
2. any missing endpoint or contour contribution;
3. any incorrect quartet multiplicity;
4. any mismatch with the cited versions of the external theorems;
5. whether the prime-phase identity already appears in the Volchkov/BSY literature;
6. whether the explicit defect bound is already known;
7. whether the rational certificate correctly encloses every transcendental constant;
8. whether the results are suitable for a short note after corrections.

A reviewer should not treat numerical smallness as evidence that the defect vanishes. The logical conclusion remains
\[
0\le\mathcal D_2<9.274\times10^{-37},
\qquad
\mathcal D_2=0\text{ unproved}.
\]
