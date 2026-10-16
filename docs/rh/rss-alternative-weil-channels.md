# Other possible channels for the Weil residue

**Ninth-stage investigation — 14 October 2026**  
**Question:** Beyond the inverse-square ledger and the harmonic splice at 1000, are there independently positive channels with the correct cusp, arithmetic support and a plausible route to the exact Weil identity?  
**Companion program:** `scripts/research-rss-alternative-weil-channels.mjs`  
**Machine-readable results:** `docs/rh/rss-alternative-weil-channel-results.json`

## Verdict

Two substantially better proxy channels exist, but neither completes the Weil form unconditionally.

1. The **archimedean Weyl-density channel** is a continuous positive Gram channel derived from the Riemann–von Mangoldt mean zero density. It has a non-lacunary spectrum and the exact unit cusp coefficient
   \[
   D_\Gamma(t,t)=t\log(1/t)+O(t).
   \]
   On the unconditional no-prime interval it approximates Suzuki’s diagonal extremely closely. It omits the fluctuating prime/zero distribution and is not the exact global kernel.
2. The **zero-ordinate projection channel** uses the actual imaginary ordinates of all non-trivial zeta zeros while discarding their horizontal displacement from the critical line. It is unconditionally positive, convergent and has the exact cusp coefficient. Under RH it becomes exactly Suzuki’s zero-spectrum factor. Equality with the arithmetic screw kernel is itself equivalent to RH.
3. A **positive prime-power sampling channel** can transfer the same Weyl density to the frequencies \(\log(p^k)\). It gets the mean cusp and prime-power support type, but it changes delayed events into spectral frequencies and uses different weights from the explicit formula.
4. Direct Pólya-kernel features remain quadratic at the origin even if log-concavity is eventually proved.
5. The exact explicit-formula channel is unconditional and arithmetically correct but signed. The recovery-witness channel remains the sharpest exact positivity target.

The new boundary is:

> **The archimedean factor independently supplies the spectrum, normalization and local cusp that the decimal splice lacked. The unresolved object is now the fluctuating correction that turns this positive mean channel into the exact prime/zero kernel without losing positivity.**

No proof of RH or global Weil positivity is obtained.

---

## 1. Tests every proposed channel must pass

A candidate \(B\) is useful only if it can meet several requirements simultaneously.

### Positivity

Its kernel must have an independently fixed Gram form
\[
D_B(t,u)=\langle b_t,b_u\rangle
\]
on every finite real point set, not only for sampled matrices.

### Local regularity

Suzuki’s exact arithmetic kernel satisfies
\[
G_g(t,t)=2\Psi(t)
=t\log(1/t)+O(t)
\qquad(t\downarrow0).
\]
Any \(t^2\) channel is excluded from exact equality.

### Normalization

The leading coefficient is one. Getting the order \(t\log(1/t)\) while leaving an arbitrary multiplier is not yet equality, especially because \(\kappa_{\rm R}=1/(4\pi^2)\) is already fixed in TTI.

### Arithmetic support

The exact potential records the archimedean completion and jumps at every prime-power time \(\log(p^k)\). A decimal or smooth mean spectrum must explain how those fluctuations enter.

### Full-domain identity

A local asymptotic, finite window or mean density is insufficient. The final requirement is
\[
G_g(t,u)=D_B(t,u)
\quad(t,u\in\mathbb R),
\]
or the corresponding Weil norm formula on the full admissible test class.

### Non-circularity

A feature map built from real critical-line zero frequencies is an exact factor after RH is assumed. It is not an unconditional proof of the line confinement.

## 2. Channel A: the archimedean Weyl density

The decimal boundary channel found the right order but the wrong coefficient and a log-periodic spectrum. The gamma factor suggests a non-decimal source for both corrections.

### 2.1 Independent mean density

The unconditional Riemann–von Mangoldt zero-counting formula has leading term
\[
\overline N(T)
=\frac{T}{2\pi}\log\frac{T}{2\pi}
 -\frac{T}{2\pi}+O(\log T).
\]
Its mean density is therefore
\[
\overline N'(\lambda)
=\frac1{2\pi}\log\frac{\lambda}{2\pi}.
\]
The second-order screw Green factor assigns spectral weight \(2/\lambda^2\) per frequency. Applying it to the mean density gives
\[
\boxed{
\rho_\Gamma(\lambda)
=\frac{\log(\lambda/2\pi)}{\pi\lambda^2},
\qquad \lambda\ge2\pi.}
\]
The threshold \(2\pi\) is where the leading density becomes nonnegative. Changes on a bounded low-frequency interval affect only smooth terms and not the cusp.

This density is not fitted to TTI’s decimal result. It comes from the gamma-factor normalization in the zero-counting law and the inverse-square Green factor already present in the screw representation.

### 2.2 Unconditional positivity

Define
\[
D_\Gamma(t,u)
=\int_{2\pi}^{\infty}
(e^{i\lambda t}-1)(e^{-i\lambda u}-1)
\rho_\Gamma(\lambda)\,d\lambda.
\]
Because \(\rho_\Gamma\ge0\), this is PSD for every finite real point set and every complex coefficient vector. The integral converges: the tail is controlled by \((\log\lambda)/\lambda^2\), while the lower endpoint is finite.

Its diagonal is
\[
D_\Gamma(t,t)
=2\int_{2\pi}^{\infty}
(1-\cos(\lambda t))
\frac{\log(\lambda/2\pi)}{\pi\lambda^2}
\,d\lambda.
\]
Substitute \(y=\lambda t\). The coefficient of \(t\log(1/t)\) is
\[
\frac2\pi
\int_0^\infty\frac{1-\cos y}{y^2}\,dy
=\frac2\pi\cdot\frac\pi2
=1.
\]
Therefore
\[
\boxed{
D_\Gamma(t,t)=t\log(1/t)+O(t).}
\]
This channel fixes both defects of the raw decimal tower: it is non-lacunary and it has the correct normalization without retuning \(\kappa_{\rm R}\).

### 2.3 Numerical comparison on the no-prime interval

For \(0<t<\log2\), Suzuki’s \(\Psi\) contains no prime-power hinge. The verifier compares its exact no-prime formula with \(D_\Gamma\):

| \(t\) | exact \(G_g(t,t)\) | \(D_\Gamma(t,t)\) | relative difference |
|---:|---:|---:|---:|
| \(10^{-2}\) | 0.03207578196 | 0.03210076985 | \(7.79\times10^{-4}\) |
| \(10^{-3}\) | 0.00549441255 | 0.00549466286 | \(4.56\times10^{-5}\) |
| \(10^{-4}\) | 0.000779542264 | 0.000779544801 | \(3.25\times10^{-6}\) |
| \(10^{-5}\) | 0.000100978502 | 0.000100978532 | \(2.90\times10^{-7}\) |

The difference is smooth and the diagnostics are consistent with an \(O(t^2)\) correction over the stable part of the quadrature. The table is numerical, not a certified identity. The unit cusp coefficient is analytic.

### 2.4 Why this is still a proxy

\(\rho_\Gamma\) is the continuous mean zero density. The exact zero-counting measure fluctuates around it, and those fluctuations are arithmetically tied to the primes. A smooth measure cannot reproduce every oscillation, every delayed hinge or the global recurrence of \(\Psi\).

The archimedean channel is therefore the strongest independent **local** channel found so far, not the global Weil channel.

## 3. Channel B: project every zero to its ordinate

There is a stronger arithmetic proxy that does not assume RH.

Write each non-trivial zero as
\[
\rho=\beta+i\gamma,
\qquad\gamma>0,
\]
and retain its multiplicity. Its ordinate \(\gamma\) is a real number whether or not \(\beta=1/2\). Define the positive measure
\[
\boxed{
\nu_{\rm ord}
=2\sum_{\rho:\,\gamma>0}
\frac{m(\rho)}{\gamma^2}\,\delta_\gamma.}
\]
The corresponding features are
\[
b_t(\rho)
=\frac{\sqrt{2m(\rho)}}{\gamma}
(e^{i\gamma t}-1).
\]
The Riemann–von Mangoldt count implies convergence of the increment norm. Thus
\[
D_{\rm ord}(t,u)
=\sum_{\rho:\,\gamma>0}
b_t(\rho)\overline{b_u(\rho)}
\]
is unconditionally PSD.

### 3.1 What it preserves and what it erases

This channel preserves:

- the actual zero ordinates;
- multiplicity;
- the correct mean density;
- the inverse-square screw weight; and
- the unit logarithmic cusp.

It erases
\[
\eta=\beta-rac12,
\]
the horizontal displacement from the critical line.

Under RH, \(\eta=0\) for every zero and
\[
D_{\rm ord}=G_g.
\]
Conversely, if \(D_{\rm ord}=G_g\) globally, then \(G_g\) is PSD, and Suzuki’s theorem implies RH. Hence
\[
\boxed{
D_{\rm ord}=G_g
\quad\Longleftrightarrow\quad
\mathrm{RH}.}
\]
The ordinate channel is an unconditional positive object, but proving equality does not make the central problem disappear; it isolates it as the effect of horizontal zero displacement.

### 3.2 The discarded displacement is not a positive correction term

For a hypothetical zero parameter
\[
a=\eta+i\gamma,
\]
the inverse-Laplace contribution of one symmetric factor has the form
\[
2\operatorname{Re}
\frac{\cosh(at)-1}{a^2}.
\]
Its projected critical-line contribution is
\[
2\frac{1-\cos(\gamma t)}{\gamma^2}.
\]
The difference changes sign with \(t\). Using \(\gamma=14.134725\ldots\), the verifier finds both signs over \(0<t\le10\) for admissible hypothetical displacements \(\eta=0.1,0.25\) and \(0.49\). For \(\eta=0.1\), for example, the sampled one-factor correction ranges approximately from \(-0.00518\) to \(0.00544\).

Therefore an off-line zero cannot be restored to the ordinate channel by adding one independently positive feature per zero. The horizontal correction is cancellation-sensitive and can become exponentially large through \(\cosh(\eta t)\).

This is a sharper operator picture of RH: the positive ordinate projection is always available, but the exact horizontal correction is not a positive channel term by term.

## 4. Channel C: sample the Weyl density on prime powers

The gamma channel has the right mean density but not discrete prime support. The prime number theorem provides a natural positive discretization.

At spectral frequency
\[
\lambda_q=\log q,
\qquad q=p^k,
\]
define
\[
\boxed{
\nu_{\Gamma,p}
=\frac1\pi
\sum_{\substack{q=p^k\\\log q>2\pi}}
\frac{\Lambda(q)}{q}
\frac{\log(\log q/2\pi)}{(\log q)^2}
\,\delta_{\log q}.}
\]
Every coefficient is nonnegative. The associated stationary-increment kernel is therefore unconditionally PSD.

The prime number theorem gives, in a smoothed sense,
\[
\sum_n\frac{\Lambda(n)}{n}F(\log n)
\sim
\int_0^\infty F(\lambda)\,d\lambda.
\]
Consequently the coarse spectral density of \(\nu_{\Gamma,p}\) is \(\rho_\Gamma\), and its leading diagonal is again
\[
t\log(1/t).
\]
This channel combines the right mean cusp with actual prime-power log frequencies.

It is not the explicit formula. The exact arithmetic potential uses coefficients
\[
\frac{\Lambda(q)}{\sqrt q}
\]
multiplying delayed hinges at the **time** \(\log q\). The positive sampling channel instead uses a different \(\Lambda(q)/q\) weight and turns \(\log q\) into a **spectral frequency**. That operation is not an identity or a known positivity-preserving form of the explicit formula.

This channel is useful as a positive prime-side approximation and as a numerical comparator. It does not supply the exact Weil form.

## 5. Channel D: direct Pólya-kernel features

Because \(\Phi(u)>0\), one always has the unconditional Gram features
\[
b_t(u)=\sqrt{\Phi(u)}(e^{itu}-1)
\]
and kernel
\[
D_\Phi(t,u)
=\int b_t(v)\overline{b_u(v)}\,dv.
\]
This is positive independently of whether \(\Phi\) is log-concave.

But \(\Phi\) decays super-exponentially. All of its frequency moments are finite, so
\[
D_\Phi(t,t)
=t^2\int u^2\Phi(u)\,du+o(t^2).
\]
Even a completed proof of strict log-concavity would not change that moment regularity. Turning this channel into the Weil cusp would require an unbounded inverse-smoothing operation, and positivity of that operation would need a new proof.

Thus Pólya log-concavity and the Weil residue remain separate issues.

## 6. Channel E: the exact signed explicit-formula space

The exact arithmetic route remains
\[
\log n
\xrightarrow{M}
\Lambda(n)
\xrightarrow{\text{delayed hinges}}
\Psi(t)
\xrightarrow{\text{centering}}
G_g(t,u).
\]
It includes every prime-power event and the archimedean term. In that sense it is already the exact deformation the programme seeks.

Its natural geometry is not yet Hilbert-positive:

- Möbius extraction is signed;
- each delayed-hinge increment kernel is indefinite; and
- the archimedean and arithmetic terms require global cancellation.

One may describe this as a signed or Krein-space factorization, but renaming an indefinite form does not turn it into a Hilbert norm. The task is to prove that the completed total has no negative direction on the full test domain.

## 7. Channel F: recovery-witness residue vectors

The recovery reduction supplies exact scalars
\[
\mathcal V_q
=\mathcal C_q-\mathcal J_q.
\]
If TTI could construct vectors \(R_q\) with
\[
\mathcal V_q=\|R_q\|^2
\]
at every witness, the global sign problem would close.

This channel has the right arithmetic history and does not smooth away event timing. It lacks an independently positive construction. Defining \(\|R_q\|^2\) to equal \(\mathcal V_q\) after assuming \(\mathcal V_q\ge0\) would be circular.

It remains the sharpest discrete arithmetic target because it asks for exactly the missing sign and no unnecessary uniform margin.

## 8. Other operator families do not add a new exponent

Fractional boundary actions have covariance
\[
|\lambda|^{-2s}.
\]
With a linearly accumulated logarithmic multiplicity, their diagonals scale as
\[
t^{2s}\log(1/t)
\]
within the relevant range. The Weil cusp selects
\[
2s=1,
\qquad s=\frac12,
\]
which is exactly the ordinary harmonic Dirichlet-to-Neumann boundary channel already tested. Other fractional orders miss the cusp exponent.

Likewise, finite-dimensional residue coordinates, compact feature corrections and bounded transforms remain differentiable and cannot supply the logarithmic singularity.

## 9. Comparative scorecard

| Channel | Independently PSD? | Cusp | Arithmetic fidelity | Exact Weil form? |
|---|---|---|---|---|
| Existing Rankin Green | Yes | \(t^2\) | all-integer/decimal restriction | No |
| Third-splice harmonic boundary | Yes, after new boundary postulate | decimal-modulated \(t\log(1/t)\) | decimal | No |
| Archimedean Weyl density | Yes | exact unit \(t\log(1/t)\) | gamma-factor mean | No |
| Zero-ordinate projection | Yes | exact unit cusp | actual zero ordinates | Exactly under RH |
| Prime Weyl sampling | Yes | unit cusp asymptotically | prime-power frequencies, altered weights | No |
| Direct Pólya feature | Yes | \(t^2\) | Pólya kernel | No |
| Explicit-formula/Krein | No; signed | exact | exact primes and gamma term | Exact signed form |
| Recovery-witness vectors | Unknown | not a local spectral model | exact selected prime history | Would close the gap |
| Real-zero Hilbert factor | Only under RH | exact | exact under RH | Conditional/circular |

## 10. The new remaining problem

The gamma mean channel and ordinate projection allow the missing object to be stated more sharply.

Write schematically
\[
\nu_{\rm ord}
=ho_\Gamma(\lambda)
\,d\lambda
+
u_{\rm fluct}.
\]
The first term is positive and fixes the local normalization. The fluctuation \(\nu_{\rm fluct}\) is signed as a difference of the zero-counting staircase and its mean. On the prime side it corresponds to the oscillatory explicit-formula remainder.

The next theorem cannot merely show that the mean dominates on average. It must construct the completed fluctuation as part of one positive norm, or show at every recovery witness that its signed cost stays below the exact capacity.

The remaining requirement is therefore one of these equivalent forms:
\[
G_g-D_\Gamma
\quad\text{is absorbed into an independently positive completed channel},
\]
\[
G_g=D_{\rm ord}
\quad\text{by proving every horizontal displacement vanishes},
\]
or
\[
\mathcal C_q-\mathcal J_q=\|R_q\|^2
\quad\text{at every recovery witness}.
\]
The first formulation is constructive, the second is explicitly RH-equivalent, and the third is the sharp arithmetic checkpoint.

## 11. Final assessment

Looking beyond the decimal splice materially improves the architecture.

- The gamma-factor mean density supplies the exact non-lacunary cusp and coefficient.
- The ordinate projection supplies an unconditional positive channel at the actual zero heights.
- Prime Weyl sampling supplies a positive prime-supported analogue.
- The Pólya channel confirms why log-concavity alone remains too smooth.
- The signed explicit formula and recovery witnesses retain the exact arithmetic obligation.

The strongest new candidate is not another splice normalization. It is a **gamma-normalized mean channel plus a history-bearing fluctuation completion**. What has not been found is an independently positive law for that fluctuation. Without it, the exact Weil identity remains open and RH-equivalent.

The [tenth-stage ordinate-splice follow-up](./rss-ordinate-projection-splice-mobius.md) resolves the projection into exact functional/conjugation symmetry projectors. It finds a convergent positive scalar norm for the horizontal residue at the central seam, while confirming that the full time-domain correction is signed. Proving that new norm vanishes remains RH-equivalent.
