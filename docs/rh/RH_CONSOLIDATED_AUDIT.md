# Riemann Programme — Consolidated Source and Proof Audit

**Project:** The Two Infinities: Eternal Integration of the Self  
**Audit date:** 15 October 2026  
**Source archive:** `RHfindings1.rar`  
**Google Drive file ID:** `1uVlGEwXPv7wl8p23othrM-ji2uQTjd8i`  
**Archive size:** 373,717 bytes  
**Drive MD5:** `e07fad54fcfc032738126c405eedf73d`  
**Expanded corpus:** 52 files, 916,946 bytes  
**Scope:** Internal consolidation and logical audit. This is not peer review and does not claim a proof of the Riemann Hypothesis.

---

## 1. Executive verdict

The archive is a valuable research diary, not a finished proof corpus. It records repeated experiments around the Riemann xi function, the Pólya kernel, Laguerre inequalities, Weil positivity, Connes–van Suijlekom-style Galerkin matrices, screw functions, moment matrices and real-axis logarithmic derivatives. Its strongest contribution is methodological: it repeatedly discovers that a computable or averaged quantity does not automatically control the pointwise location of every non-trivial zero.

The seven files named `RH_FRAMEWORK_COMPREHENSIVE...` are cumulative variants rather than clean replacements. The last version contains early claims, later corrections and still later restatements of some corrected claims. It cannot be published or integrated by simply selecting its final paragraphs. The consolidated status must instead be reconstructed claim by claim.

This audit finds four classes of material:

1. **Exact and reproducible algebra.** Definitions, functional identities, several elementary integrals and conditional inverse-Laplace calculations can be checked directly.
2. **A sound internal theorem.** Strict log-convexity of \(\xi(\sigma)\) on the real axis follows from a positive Pólya-kernel integral and Cauchy–Schwarz. The archive does not establish that this observation is new in the literature.
3. **Numerical evidence and useful failed experiments.** These include finite zero scans, finite matrices, Padé tests, moment calculations and cancellation diagnostics. They remain finite experiments.
4. **Claims whose supplied proofs do not close.** These include unconditional complete monotonicity of a transformed \((\log\xi)''\), unconditional negativity of \((\log\xi)'''\), positivity of a proposed Bernstein density for all \(t>0\), the claimed converse from critical-line positivity to RH, and the announced proof of Pólya-kernel log-concavity. None should be displayed as a theorem on the public site from the present documents.

The archive does **not** answer TTI’s open splice questions. It supplies no unique splice-to-action map, no physical length or energy scale, no gauge-field or charge normalisation and no independent reference radius \(r_0\). It does, however, suggest sharper mathematical diagnostics for future splice work: transform the splice sequence, state a positivity problem precisely, separate local terms from the global quadratic form and refuse to infer a universal sign from finite matrices.

---

## 2. Corpus reconciliation

### 2.1 Exact duplicates

Four pairs are byte-for-byte identical and should count once in a logical source history:

- `RH_SESSION9_ADDENDUM.md` = `RH_SESSION9_ADDENDUM (1).md`
- `RH_SESSION11_FINDINGS (2).md` = `RH_SESSION11_FINDINGS (3).md`
- `RH_SESSION12_FINDINGS (3).md` = `RH_SESSION12_FINDINGS (4).md`
- `RH_SESSION17_FINDINGS (2).md` = `RH_SESSION17_FINDINGS (3).md`

This leaves 48 unique payloads.

### 2.2 Comprehensive-document lineage

The seven master variants grow from 65,907 to 72,972 bytes. Pairwise comparison shows that they mostly replace or append a small number of sections. The newest filename, `RH_FRAMEWORK_COMPREHENSIVE (6).md`, identifies itself as version 14.0 and includes Session 18 material. It is the latest diary snapshot, but not a reliable single source of truth because:

- its opening summary calls several results unconditional theorems;
- later addenda correct formulas used in those theorems;
- still later summaries retain the theorem labels;
- an early section says Pólya-kernel log-concavity implies \(L_1[\Xi]\ge0\), while a later section records a counterexample to that implication;
- an early section calls critical-line positivity equivalent to RH, Session 7 retracts the converse, and Session 16c asserts it again without repairing the logical gap.

The archive therefore needs a **correction-aware ledger**, not a “latest file wins” rule.

### 2.3 Session lineage used for this audit

Where numbered variants differ, the longest or exact-latest payload was used only as the most complete record, never as automatic proof:

- Session 8: `RH_SESSION8_FINDINGS (1).md`
- Session 9: `RH_SESSION9_FINDINGS (1).md`, both rounds files, and one addendum copy
- Session 11: either identical `(2)` or `(3)`
- Session 12: either identical `(3)` or `(4)`
- Session 15: `RH_SESSION15_FINDINGS (3).md`
- Session 17: either identical `(2)` or `(3)`
- Session 18: `RH_SESSION18_FINDINGS (3).md`

Dedicated theorem documents were audited independently because they often preserve an earlier claim after the session diary has corrected it.

---

## 3. Notation and safe baseline

Use

\[
\xi(s)=\frac12s(s-1)\pi^{-s/2}\Gamma(s/2)\zeta(s),
\qquad
\Xi(t)=\xi\!\left(\frac12+it\right).
\]

The Riemann Hypothesis states that every non-trivial zero \(\rho\) of \(\zeta\) satisfies \(\Re\rho=\tfrac12\). No document in the archive proves that statement.

The archive uses a Pólya-kernel representation, up to conventional normalising constants,

\[
\xi\!\left(\frac12+r\right)
 = C\int_0^\infty \Phi(u)\cosh(ru)\,du,
\]

with \(C>0\) and \(\Phi(u)>0\) on the half-line. Constants do not affect logarithmic derivatives. This representation is the safest route to the archive’s valid real-axis convexity result.

Under RH, pairing zeros at \(\frac12\pm i\gamma_k\) gives

\[
F(x):=(\log\xi)''\!\left(\frac12+\sqrt{x}\right)
 =2\sum_k\frac{\gamma_k^2-x}{(x+\gamma_k^2)^2}.
\]

That formula is **conditional on the all-on-line representation**. The earlier formula

\[
F(x)=2\sum_k\frac1{x+\gamma_k^2}
\]

is not the same function. The archive correctly identifies the latter expression as a different logarithmic-derivative combination after Session 16.

---

## 4. Results that survive the audit

### 4.1 Strict real-axis log-convexity

Let

\[
M(r)=\int_0^\infty \Phi(u)\cosh(ru)\,du,
\]

where \(\Phi>0\) and decays fast enough to justify differentiation. Define

\[
d\mu_r(u)=\frac{\Phi(u)\cosh(ru)}{M(r)}\,du.
\]

Then

\[
(\log M)''(r)
 =\mathbb E_r[u^2]
 -\bigl(\mathbb E_r[u\tanh(ru)]\bigr)^2.
\]

Cauchy–Schwarz gives

\[
\bigl(\mathbb E_r[u\tanh(ru)]\bigr)^2
 \le \mathbb E_r[u^2]\,\mathbb E_r[\tanh^2(ru)]
 <\mathbb E_r[u^2]
\]

for \(r>0\). At \(r=0\), symmetry gives \(M'(0)=0\) and \((\log M)''(0)=M''(0)/M(0)>0\). The functional equation supplies the reflected half of the real axis. Thus the supplied argument for

\[
(\log\xi)''(\sigma)>0\qquad(\sigma\in\mathbb R)
\]

is internally sound, provided the stated positive-kernel representation and differentiation hypotheses are used. The website labels this an **internally derivable result** rather than a new theorem, because the archive does not contain a literature review sufficient to establish novelty.

### 4.2 Elementary integral identities

The following calculations are reproducible independently of RH:

\[
\int_0^\infty(2u^2-1)e^{-u^2}\,du=0,
\]

and

\[
\int_0^\infty(2u^2-1)e^{-u^2}\log u\,du
 =\frac{\sqrt\pi}{2}.
\]

The second identity follows from differentiating the Gamma integral and using
\(\psi(3/2)-\psi(1/2)=2\).

Likewise,

\[
\int_0^\infty\frac{3u^2-1}{(1+u^2)^3}\,du=0,
\qquad
\int_0^\infty\frac{3u^2-1}{(1+u^2)^3}\log u\,du=\frac\pi4
\]

can be checked by standard substitutions. These identities describe leading-order cancellation in smooth models. They do not determine the sign of the corresponding discrete zero sum without explicit error bounds.

### 4.3 Conditional inverse-Laplace algebra

Starting from the correct RH-conditional expression for \(F\), termwise inversion gives

\[
\rho(t)=2\sum_k(2\gamma_k^2t-1)e^{-\gamma_k^2t},
\]

because

\[
\int_0^\infty e^{-xt}(2\gamma^2t-1)e^{-\gamma^2t}\,dt
 =\frac{\gamma^2-x}{(x+\gamma^2)^2}.
\]

The Mellin calculation

\[
\int_0^\infty t^{s-1}\rho(t)\,dt
 =2(2s-1)\Gamma(s)\sum_k\gamma_k^{-2s}
\]

is also algebraically correct where termwise integration and convergence are justified. Neither formula proves \(\rho(t)>0\).

### 4.4 Negative experimental results

Several failures are useful when stated narrowly:

- finite Euler-product partial sums on the critical line oscillate and are not licensed by the region of absolute convergence;
- a reported \([14/14]\) Padé experiment did not reproduce the intended pole pattern;
- finite CvS/Galerkin matrices can lie inside an uncertainty band and are then inconclusive;
- kernel positivity or low-order total positivity does not automatically establish that every zero of its transform is real;
- finite checks of Laguerre, Hankel, Turán or zero-gap inequalities cannot discharge universal quantifiers.

The experiment with one Padé approximant does **not** prove that real-coefficient Padé approximants cannot have imaginary poles: \(1/(1+z^2)\) is an immediate counterexample to that general rationale. The experiment is retained as a failed implementation, not a closed theorem.

### 4.5 Which earlier positivity lemma actually survives?

A full source-forensic pass is recorded in [`rss-earlier-positivity-lemma-audit.md`](./rss-earlier-positivity-lemma-audit.md). Its exact finding is that the earlier universal finite-set Gram lemma applies to the Rankin \(\kappa\)-increment kernel
\[
D_{\kappa,\sigma}(x,y)
=\kappa_{\rm R}\sum_{n\ge1}n^{-2\sigma-2}
(e^{-ix\log n}-1)(e^{iy\log n}-1),
\]
not to Suzuki’s arithmetic screw kernel. Indeed,
\[
\sum_{i,j}c_i\overline{c_j}D_{\kappa,\sigma}(x_i,x_j)
=\kappa_{\rm R}\sum_{n\ge1}n^{-2\sigma-2}
\left|\sum_i c_i(e^{-ix_i\log n}-1)\right|^2\ge0.
\]
This is unconditional for every finite real point set whenever \(\sigma>-1/2\), and the project uses the safer range \(\sigma\ge1/2\).

The target kernel
\[
G_g(x,y)=\Psi(x)+\Psi(y)-\Psi(x-y)
\]
has different arithmetic forcing. No positive reindexing or closure theorem changes the log-integer spectrum and smooth Dirichlet weights into the completed prime-power/xi spectrum. The project’s exact double Laplace identity says that **if** \(G_g\) were globally PSD, the xi Pick kernel would be PSD and RH would follow; it does not supply the antecedent.

The archive’s other likely source of the recollection is its real-axis log-convexity theorem. That theorem survives, but its positive \(\cosh\)-weighted measure becomes a signed \(\cos\)-weighted expression on the critical line. The complete-monotonicity and Bernstein-density documents do not repair that domain change.

Finally, the “Global PSD” heading in the comprehensive document reports selected finite Galerkin matrices. The same source says that proving cooperative rescue for every cutoff, dimension and test function is open and RH-equivalent. Thus no earlier result establishes
\[
\Psi(t)\ge0\quad(t\in\mathbb R)
\quad\text{or}\quad
G_g\succeq0
\text{ on every finite real point set}.
\]

### 4.6 Double Möbius inversion does not supply the promotion

The seventh-stage operator audit in [`rss-double-mobius-weil-completion.md`](./rss-double-mobius-weil-completion.md) tests whether TTI’s geometric second inversion repairs this gap. Write
\[
M a=\mu*a,
\qquad
Z a=\mathbf1*a.
\]
Then \(ZM=MZ=I\), but \(M^2\ne I\). The exact doubled-space analogue of TTI’s two-face return is
\[
P=\begin{pmatrix}0&Z\\M&0\end{pmatrix},
\qquad P^2=I.
\]
It returns the primitive state to the original all-integer ledger; it does not generate a third arithmetic object.

The associated adjoint closure \(M^*GM\) is positive whenever the selected metric \(G\) is positive. With the ordinary feature norm it is unbounded. With the independently derived \(\kappa_{\rm R}/n^2\) Green metric it converges, but its diagonal is quadratic at the origin,
\[
D_{M,\kappa}(t,t)=C t^2+o(t^2),
\]
whereas Suzuki’s target has the cusp
\[
G_g(t,t)=t\log(1/t)+O(t).
\]
The two kernels therefore cannot be equal near zero. The returned Dirichlet kernel also depends only on \(s+\overline t\), while the xi Pick kernel has separate \(s\)- and \(t\)-dependence.

A pullback metric can always be chosen to force a prescribed positive form in finite dimensions. Such a choice is not a positivity proof unless TTI fixes the metric independently of the Weil target. The missing bridge is now more precise: a separately derived, history-bearing residue or cocycle \(B\) would have to satisfy
\[
W(f*\widetilde f)=\|Bf\|^2
\]
on the full admissible test space, equivalently realise \(\mathcal C_q-\mathcal J_q\) as a norm square at every recovery witness.

### 4.7 The splice at 1000 derives the cusp order only after a new boundary postulate

The eighth-stage report [`rss-third-splice-weil-channel.md`](./rss-third-splice-weil-channel.md) tests whether TTI’s already-present splice at 1000 can supply that residue. It uses the published post-seed convention in which \(10,100,1000\) are indexed \(1,2,3\). The later splice-at-one audit shows that this multiplicity is not convention-independent. Under the stated post-seed convention, the arithmetic gives
\[
\delta\Pi_3=4\varphi^{-3}=0.9442719\ldots
\]
and the exact accumulation law
\[
\Pi_N=1.170820393\ldots N-1.570820393\ldots+o(1).
\]
Restricting the established \(\kappa_{\rm R}/m^2\) all-integer ledger to \(m=10^n\) still gives a differentiable \(t^2\) diagonal.

A new but independently solvable model treats the third-splice residue as the boundary value of a two-dimensional harmonic bulk. Its Dirichlet-to-Neumann operator has symbol \(|\lambda|\), so the boundary covariance is \(\kappa_{\rm R}/|\lambda|\). With literal frequencies \(\lambda_n=10^n\) and strengths \(\Pi_n\), this yields
\[
w_n=\kappa_{\rm R}\frac{\Pi_n}{10^n},
\qquad
D(t,t)=\Theta(t\log(1/t)).
\]
It is the first splice model to reproduce the target regularity class without selecting the Green exponent from the desired asymptotic.

It does not reproduce the target kernel. The discrete tower has a nonconstant decimal log-periodic cusp coefficient between approximately \(0.0108\) and \(0.0222\) on sampled phases. Filling every decade continuously removes that modulation and induces density
\[
\rho(\lambda)=
\frac{\kappa_{\rm R}L}{(\log10)^2}
\frac{\log\lambda}{\lambda^2},
\]
but its cusp coefficient is \(0.0175731\ldots\), not \(1\). The fixed \(\kappa_{\rm R}\) is not retuned.

There is also an exact support obstruction: decimal hinges occur at \(n\log10\), whereas \(\Psi\) has derivative jumps at every \(\log(p^k)\). Coefficient changes cannot move those events. The full all-integer Möbius/hinge deformation recovers \(\Psi\) exactly, but it imports an additional carrier and is not positivity-preserving. Thus the boundary model derives a promising first-order mechanism, not the arithmetic Weil identity.

### 4.8 The gamma mean and ordinate projection are stronger proxy channels

The ninth-stage survey [`rss-alternative-weil-channels.md`](./rss-alternative-weil-channels.md) derives the positive archimedean density
\[
\rho_\Gamma(\lambda)
=\frac{\log(\lambda/2\pi)}{\pi\lambda^2},
\qquad\lambda\ge2\pi,
\]
from the Riemann–von Mangoldt mean density and the screw Green weight. Its Gram diagonal has the exact normalization
\[
D_\Gamma(t,t)=t\log(1/t)+O(t),
\]
because \(2\pi^{-1}\int_0^\infty(1-\cos y)y^{-2}dy=1\). On the no-prime interval, numerical quadrature approaches the exact Suzuki diagonal with relative difference below \(3\times10^{-7}\) at \(t=10^{-5}\). This channel is an unconditional positive mean model; it omits discrete zero/prime fluctuations.

A second unconditional PSD proxy projects every non-trivial zero \(\rho=\beta+i\gamma\) to its real ordinate \(\gamma\), with measure
\[
\nu_{\rm ord}=2\sum_{\gamma>0}\frac{m(\rho)}{\gamma^2}\delta_\gamma.
\]
It uses actual zero heights without assuming \(\beta=1/2\), converges by the unconditional zero count, and equals \(G_g\) under RH. Conversely, equality would make \(G_g\) PSD and therefore imply RH. The discarded horizontal correction changes sign even for one hypothetical off-line zero, so it cannot be restored as a positive feature term by term.

A positive prime-power sampling of \(\rho_\Gamma\) also has the unit cusp asymptotically, but changes exact delayed events into spectral frequencies and replaces \(\Lambda(q)/\sqrt q\) by different weights. Direct Pólya features remain \(O(t^2)\). The exact explicit-formula channel remains signed. The unresolved object is therefore a positive completion of the fluctuating difference between the gamma mean and the exact prime/zero distribution.

### 4.9 The two-inversion ordinate splice has a positive central residue

The tenth-stage report [`rss-ordinate-projection-splice-mobius.md`](./rss-ordinate-projection-splice-mobius.md) centers each zero at the critical line,
\[
z=\rho-\frac12=\eta+i\gamma.
\]
Functional inversion \(I:z\mapsto-z\) and conjugation \(C:z\mapsto\overline z\) are distinct exact involutions. Their composition
\[
S=IC:z\mapsto-\overline z,
\qquad
(\eta,\gamma)\mapsto(-\eta,\gamma)
\]
is reflection across the critical line while remaining in the upper half-plane. It gives complementary orthogonal projectors
\[
Q_{\rm ord}=\frac{1+S}{2},
\qquad
Q_{\rm hor}=\frac{1-S}{2},
\]
with \(Q_{\rm ord}z=i\gamma\) and \(Q_{\rm hor}z=\eta\). For the two upper members of an off-line quartet, the normalized sum/difference operation is exactly a Hadamard splice:
\[
q=\frac{z+Sz}{\sqrt2}=\sqrt2\,i\gamma,
\qquad
r=\frac{z-Sz}{\sqrt2}=\sqrt2\,\eta.
\]
This makes the ordinate projection an exact symmetry projector rather than an arbitrary deletion of \(\beta\).

For one quartet, the exact logarithmic-derivative defect is
\[
H_q(w)-H_{{\rm ord},q}(w)
=
\frac{4w\eta^2(w^2-\eta^2-3\gamma^2)}
{(w^2+\gamma^2)\left[(w^2-\eta^2+\gamma^2)^2+4\eta^2\gamma^2\right]}.
\]
It changes sign at \(w=\sqrt{\eta^2+3\gamma^2}\), and the corresponding time-domain correction is also signed. The full defect therefore remains unavailable as an unconditional positive Weil feature.

At the central seam, however, differentiation produces an exact positive residue:
\[
\boxed{
H_{\rm ord}'(0)-H'(0)
=
\sum_{\text{off-line quartets}}
\frac{4\eta^2(\eta^2+3\gamma^2)}
{\gamma^2(\eta^2+\gamma^2)^2}
=\|B_{\rm hor}\|^2.}
\]
The convergent sum is nonnegative and vanishes exactly when every \(\eta=0\). Equivalently,
\[
H_{\rm ord}'(0)=H'(0)
\quad\Longleftrightarrow\quad
\mathrm{RH}.
\]
Writing \(N(T)\) for the unconditional count of positive zero ordinates with multiplicity gives the scalar form
\[
4\int_0^\infty\frac{N(T)}{T^3}\,dT
=(\log\xi)''\!\left(\frac12\right)
\quad\Longleftrightarrow\quad
\mathrm{RH}.
\]

This is the first independently nonnegative horizontal-residue scalar obtained in the RSS route. It does not prove its own vanishing. Arithmetic Möbius extraction \(M=\mu*\) and zero reflection \(S=IC\) remain different operators, joined only by the completed explicit formula:
\[
\log n\xrightarrow{\mu*}\Lambda(n)
\longrightarrow\Psi
\longrightarrow\frac{\xi'}{\xi}
\longleftrightarrow\{\text{zero quartets}\}
\xrightarrow{S}(\gamma,\eta).
\]
The inverse arithmetic face \(Z\) restores the all-integer logarithmic ledger but does not force \(\eta=0\). TTI’s \(F_3=2\) matches the two upper quartet members structurally; no TTI arithmetic derivation of the quartet or of residue extinction has been obtained.

### 4.10 The missing-one carry produces drift, not xi contraction

The eleventh-stage report [`rss-third-density-bounce.md`](./rss-third-density-bounce.md) tests the exact 999–666–333 dynamics. If 999 is identified with the seam at zero, translation by 333 has order three modulo 999. With complement reflection \(R(n)=999-n\), it gives a \(D_3\) action and a three-station Fourier split into one invariant mean plus a two-dimensional reflection-even/reflection-odd sector.

Retaining the actual carry into 1000 changes the finite dynamics. With
\[
T(n)=n+333\pmod{1000},
\]
the missing-one identity becomes
\[
\boxed{T^3(n)=n-1\pmod{1000},}
\]
because \(3\cdot333=999\equiv-1\pmod{1000}\). Since \(\gcd(333,1000)=1\), \(T\) has order 1000 and visits every residue state. Together with \(R\), it generates the \(D_{1000}\) permutation action of order 2000. Its Fourier eigenvalues are roots of unity, so the exact bounce preserves channel norm. The missing one is a drift cocycle, not damping.

The initial route can be interpolated differently. Contracting toward \(999/2\) by a factor \(1/3\), then reflecting, gives
\[
B(n)=666-\frac n3,
\qquad
\eta\mapsto-\frac13\eta.
\]
It reproduces \(999\to666\to333\), but its next route is \(333\to444\to555\). It immediately leaves the named station set and is therefore an added affine dynamics rather than a consequence of the periodic bounce.

Completed-xi diagnostics reject literal translation as a zero symmetry. At the first zero ordinate, the quotient shift sends \(1/2+i\gamma_1\) to \(5/6+i\gamma_1\), where the computed xi magnitude is approximately \(4.626\times10^{-4}\), compared with a zero residual below \(1.3\times10^{-17}\). Generic samples also show that the horizontal factor-one-third map is not a functional identity of \(\xi\).

The contraction nevertheless yields an exact criterion. For fixed \(0<a<1\), if every centered zero \(\eta+i\gamma\) implied another zero \(-a\eta+i\gamma\), an off-line zero would generate infinitely many distinct zeros accumulating at \(i\gamma\). This is impossible for a nonzero entire function. Conversely, RH makes every zero fixed by every such contraction. Therefore
\[
\boxed{
\text{zero-set invariance under one strict horizontal contraction}
\quad\Longleftrightarrow\quad
\mathrm{RH}.}
\]
The 999–666–333 arithmetic has not derived this invariance. Equal periodic bouncing only cancels \(+\eta\) and \(-\eta\) linearly; it cannot cancel the positive residue norm built from \(\eta^2\). Nor does arithmetic Möbius extraction induce the contraction: decimal root-of-unity modes do not reproduce the completed \(\log(p^k)\) event support.

### 4.11 The splice at one leaves three finite completions but no global zero strip

The corrected twelfth-stage report [`rss-golden-catchup-completions.md`](./rss-golden-catchup-completions.md) begins the threshold sequence at
\[
1,10,100,1000,\ldots=10^\ell,
\qquad \ell\ge0.
\]
Every level has an independent clock \(k_\ell\), depth index \(d_\ell\), and remaining gap
\[
g_{\ell,k_\ell}=\varphi^{-(d_\ell+k_\ell)}.
\]
TTI does not yet determine how the splice at \(1\) enters the published Fibonacci indexing, so three coherent readings were tested. A **zeroth seed** gives \(1\) one special carrier while preserving \(F_1,F_2,F_3\) at \(10,100,1000\), producing five carriers through 1000. A **reindexed Fibonacci** model assigns \(F_1,F_2,F_3,F_4\) to \(1,10,100,1000\), producing seven but shifting all existing labels. A **boundary-only** model gives \(1\) a delay but no analytic carrier, preserving the existing total of four; without a coupling, that boundary cannot move a zero.

For each model, finite consecutive theta blocks \(B_\ell\) of the stated cohort sizes define
\[
\Psi_{N,\mathbf k}(x)=
\sum_{\ell:M_\ell>0}
\left(1-\varphi^{-(d_\ell+k_\ell)}\right)
\sum_{m\in B_\ell}e^{-\pi m^2x},
\]
\[
\Xi_{N,\mathbf k}(s)
=
\frac12+
\frac{s(s-1)}2
\int_1^\infty
\Psi_{N,\mathbf k}(x)
\left(x^{s/2}+x^{(1-s)/2}\right)\frac{dx}{x}.
\]
Every finite member is entire and has both xi symmetries. Each model converges locally uniformly to \(\xi\) as the cutoff and all fixed carrier clocks advance.

Chronological clocks \(k_\ell=N-\ell\) and equal local ticks \(k_\ell=N\) were tested for all three indexings. In \(0\le\Re s\le1\), \(0\le\Im s\le30\), all six paths found 2, 2, 4 and 3 zeros at cutoffs \(N=14,20,30,40\). Every total equals its separately bracketed critical-line count. Reindexing moves finite root ordinates—for example the first pair at \(N=14\) moves from approximately \(14.7604,16.8062\) to \(14.4553,17.6971\)—but no off-line zero was detected in the bounded window.

The escaping-quartet stress factor
\[
P_N(z)=
\left(1-\frac{z^2}{(1/4+i\varphi^N)^2}\right)
\left(1-\frac{z^2}{(1/4-i\varphi^N)^2}\right)
\]
applies to every model. It tends locally to one, preserves completion symmetry and adds zeros with \(|\eta|=1/4\) at height \(\varphi^N\). Thus adding the splice at \(1\) changes finite indexing but cannot promote compact convergence into a global shrinking strip. TTI must still choose the indexing and clock law, and an RH-strength theorem must exclude escaping quartets uniformly in height.

### 4.12 Internal stations admit three splice models

The thirteenth-stage report [`rss-third-density-splice-events.md`](./rss-third-density-splice-events.md) promotes 333, 666 and 999 from distinguished bounce stations to possible delayed splice events. Their arithmetic positions are exact, but the word “splice” does not determine their population effect. Three interpretations were crossed with every compatible splice-at-one convention.

First, one new carrier can be added at each station, giving 8, 10 or 7 carriers through 1000 under the zeroth-seed, reindexed and boundary-only origin models. Second, assigning successive Fibonacci cohorts to every ordered event
\[
1,10,100,333,666,999,1000
\]
gives
\[
F_1+\cdots+F_7=F_9-1=33
\]
carriers and makes 1000 the seventh splice event. Third, the three stations can act as delayed faces sharing the existing 1000 theta block, retaining totals 5, 7 or 4. Only the reindexed splice-at-one model supplies \(F_4=3\) carriers at 1000, allowing a one-to-one face/carrier assignment without averaging.

For the decimal-coordinate models, internal depth was explicitly interpolated by \(d(q)=\log_{10}q\), shifted by one in the reindexed model. This is a declared analytic choice, not a TTI theorem. The shared-face calculation uses the mean of the three admitted fractions so that no station is privileged.

Seven population scenarios and two clock schedules produced fourteen diagnostic paths. Every path had argument-principle counts 2, 2, 4 and 3 through height 30 at cutoffs \(N=14,20,30,40\), and every total matched its critical-line count. The all-event Fibonacci model moved the finite ordinates most strongly but produced no detected off-line zero in the tested window.

The same escaping-quartet factor applies to all fourteen paths. Internal splices therefore alter carrier counts, clock structure and finite roots without establishing uniform global zero contraction. A future TTI rule must choose whether the stations add population, reindex every event or form faces of one cohort before their physical or spectral effect is determinate.

### 4.13 Ternary splicing changes multiplicity, not the global obstruction

The fourteenth-stage report [`rss-ternary-splice-events.md`](./rss-ternary-splice-events.md) isolates the hypothesis that 100, 666 and 999 each splice into three. It distinguishes three meanings of that statement. If three counts new carriers, the totals through 1000 are 13, 14 or 12 under the three splice-at-one conventions. If it counts all outgoing branches, the net increase is two at each event and the totals are 10, 11 or 9. If it counts internal states, no scalar carrier is added and the totals remain 5, 7 or 4.

The internal-state model carries the natural \(\mathbb Z_3\) decomposition
\[
\mathbb C^3=\mathbf1\oplus\chi\oplus\bar\chi,
\qquad
1+\omega+\omega^2=0.
\]
A symmetric scalar trace retains only the invariant mean. The nontrivial phase channels cannot affect the scalar completed function until TTI derives a state-dependent coupling. Their linear phase cancellation also does not force the positive horizontal residue, which is quadratic in zero displacement, to vanish.

All nine population scenarios were tested with chronological and equal-local-ticks schedules. The resulting eighteen paths again had counts 2, 2, 4 and 3 through height 30 at cutoffs \(N=14,20,30,40\), with every total matched by critical-line roots. Once the splice-at-one convention is fixed, changing three new carriers to two new carriers or three uncoupled states does not move the displayed low roots: the altered theta carriers begin too high to contribute at the displayed precision.

This numerical insensitivity is not an identity between the models. It instead shows that late multiplicity does little to the first finite roots under the selected carrier map. Every model still admits the escaping-quartet stress factor. Ternary population and \(\mathbb Z_3\) cancellation therefore do not supply global zero contraction.

### 4.14 A four-way fork fits the reindexed 1000 cohort

The fifteenth-stage report [`rss-quaternary-splice-at-1000.md`](./rss-quaternary-splice-at-1000.md) tests a quaternary event at 1000 both alone and after every ternary model at 100, 666 and 999. Four new carriers give baseline totals 7, 8 or 6. Four total outgoing branches give a net cohort of three and totals 6, 7 or 5. Four uncoupled internal states leave the baseline totals at 5, 7 or 4.

There is an exact structural fit in the fully reindexed convention:
\[
F_4=3=4-1.
\]
Its existing 1000 cohort already equals the net population added when one incoming path becomes four total branches. The four-total and four-state scalar completions therefore coincide in that convention unless internal states receive an additional coupling. A cyclic state model has \(\mathbb Z_4\) characters \(1,i,-1,-i\), but four states do not uniquely choose \(\mathbb Z_4\); the Klein four group and other actions remain possible.

Crossing three meanings of four, both scopes and all three origin conventions gives 36 population scenarios. Two clock schedules produce 72 paths. Every path again had counts 2, 2, 4 and 3 at the selected cutoffs through height 30, with no detected off-line zero. Changing the late 1000 cohort did not move the displayed low roots because those theta carriers are already exponentially suppressed.

The identity \(F_4=4-1\) is an arithmetic compatibility, not a derivation that Fibonacci cohorts count net branches. Every path still admits the escaping-quartet factor, so the quaternary proposal does not establish uniform global contraction.

### 4.15 Same-xi halving is RH-equivalent, not yet derived

The sixteenth-stage report [`rss-splice-at-one-halving.md`](./rss-splice-at-one-halving.md) tests three meanings of the proposal that every return through the splice at 1 halves everything downstream. Horizontal zero halving, literal population or admitted-weight halving, and remaining-interval halving are mathematically different.

For a zero \(\rho=1/2+\eta+i\gamma\), define
\[
H(\rho)=\frac12+\frac\eta2+i\gamma.
\]
If \(H\) maps every xi zero to another zero of the same \(\xi\), an off-line zero generates infinitely many distinct zeros accumulating at \(1/2+i\gamma\), contradicting the identity theorem. Conversely RH makes every zero a fixed point. The same-xi zero-preserving halving property is therefore RH-equivalent. No TTI construction currently derives that invariance.

Literal admitted-weight halving drives downstream theta contributions to zero and loses the xi limit. Literal population halving is undefined on odd Fibonacci cohorts without another rule. Halving the remaining deficit \(g=1-a\) is coherent: \(g_n=2^{-n}g_0\) and \(a_n=1-2^{-n}g_0\). It accelerates carrier admission and preserves the xi limit, but does not imply horizontal zero contraction.

Six deficit-halving model/schedule paths retained matching winding and critical-line counts through height 30. The boundary-only model rapidly approached the first three xi ordinates. Finite tracked halving still permits newly created quartets at heights growing with the stage. A proof requires either same-xi zero-set invariance or a global \(2^{-N}\) strip covering every finite-stage zero.

### 4.16 Aggregate contraction narrows the halving obstruction

The seventeenth-stage report [`rss-halving-obstruction-closure.md`](./rss-halving-obstruction-closure.md) replaces pointwise zero invariance by a weaker fixed-point target. The previously derived positive central residue \(\mathcal R\) vanishes exactly under RH. Under one-to-one horizontal halving, each nonzero quartet contribution contracts by the exact ratio
\[
q(x)=\frac{(x+12)(x+1)^2}{(x+4)^2(x+3)},
\qquad x=\frac{\eta^2}{\gamma^2},
\]
which is approximately \(1/4\) in the critical strip. If splice closure preserved the aggregate residue, strict contraction and invariance would force \(\mathcal R=0\). TTI has not yet derived that conservation law from the prime ledger or seam.

A complete finite-stage genealogy gives another sufficient theorem: every zero must have a parent, every child must halve horizontal displacement and no zero may be born without a parent. This produces a global \(2^{-N-1}\) strip and hence RH under local uniform convergence. The observed nonmonotone window counts do not establish such a genealogy.

Four spectral descendants at half displacement conserve \(\sum\eta^2\), so the four-way carrier event cannot be identified with four copies of each zero without defeating the contraction. An endpoint-normalized stress factor still carries an escaping quartet, while its contribution to the convergent residue decays like \(\varphi^{-4N}\). The remaining routes are aggregate residue invariance, a coercive compactified seam norm, complete no-birth genealogy or a convergent real-rooted kernel refinement.

### 4.17 All four global-halving routes retain a missing theorem

The eighteenth-stage report [`rss-global-halving-routes.md`](./rss-global-halving-routes.md) attempts every remaining route. On the prime side, the natural dyadic multiplier \(1-2^{-s}\) has central logarithmic curvature \(-3.960201560771\ldots\), so literal parity halving does not preserve the completed ledger. Residue can also be conserved in a carrier reservoir rather than returning to its horizontal channel.

Analytic continuation supplies local zero genealogy on every fixed zero-free contour, but no global genealogy: zeros may enter across every expanding boundary from infinity. Finite order does not prevent this because stage-dependent polynomial multiplication preserves order while adding escaping zeros.

The real-rooted-kernel route requires more than positivity. The half-sum of \((z^2-1)(z^2-2)\) and \((z^2-10)(z^2-20)\) has nonreal zeros, demonstrating the need for interlacing or total positivity. Pure dilation preserves real roots but cannot converge to a fixed nonconstant \(\Xi\).

Finally, ordinate compactification makes a supremum detect the quartet, but \(\xi\) has an essential singularity at infinity and cannot extend there as an ordinary holomorphic seam point. The remaining narrow targets are an exact completed-ledger cancellation with empty reservoir, interlacing for every canonical theta refinement or a new seam divisor controlling zeros entering from infinity.

### 4.18 A Blaschke divisor solves seam accounting, not seam control

The nineteenth-stage report [`rss-final-three-routes.md`](./rss-final-three-routes.md) attempts those three targets directly.

The dyadic curvature can be cancelled formally by
\[
e^{c(s-1/2)^2},
\qquad
c=1.980100780386\ldots,
\]
but this Gaussian raises the completed function from order one to order two. A zero-free entire function of order at most one is \(e^{a+bs}\) and has zero logarithmic second derivative. Any order-one multiplier with nonzero curvature must instead introduce zeros or poles. Thus no appended counterterm simultaneously preserves the order-one class, preserves the xi divisor and empties the residue reservoir.

The tested canonical refinement also fails strict interlacing. On the positive spectral axis, the \(N=14\) and \(N=20\) root lists contain adjacent roots belonging to the same stage. This rules out the naive stage-to-stage Obreschkoff route, though not a newly constructed carrier-sized Sturm or Hermite–Biehler refinement.

The seam route does produce a new exact object. With
\[
q=e^{i\pi(s-1/2)},
\qquad
w=\frac{q-1}{q+1},
\]
the critical strip maps to the disk, infinite upper and lower height map to \(-1\) and \(+1\), and the critical line maps to the real diameter. Since the zero count is \(O(T\log T)\) while the radial defect is exponentially small, the mapped complete zero divisor satisfies the Blaschke condition.

Its hyperbolic distance from the critical diameter is
\[
d_{\rm seam}(\rho)
=
\operatorname{artanh}|\sin(\pi(\Re\rho-1/2))|.
\]
This marker is independent of ordinate and vanishes exactly on the critical line. At fixed horizontal displacement \(1/4\), it remains \(0.881373587020\ldots\) even as the zero reaches the compactified seam.

This constructs both complete seam accounting and coercive horizontal detection. It does not prove RH. Blaschke summability controls radial mass, not the supremum of transverse hyperbolic displacement, and symmetric off-real divisor pairs remain allowed. The outstanding theorem is a prime-side or canonical-kernel estimate forcing that supremum to zero.

### 4.19 The two-ended seam ledger is coercive but uncontrolled

The twentieth-stage report [`rss-two-ended-seam-ledger.md`](./rss-two-ended-seam-ledger.md) strengthens all three determinations.

Hadamard factorization makes the order-one obstruction divisor-wide. Any two entire functions of order at most one with the same zeros differ by \(e^{a+bs}\), so their second logarithmic derivatives agree. The functional-equation-symmetric factor
\[
(1-2^{-s})(1-2^{s-1})
\]
remains order one only by adding the infinite boundary divisor
\[
s=\frac{2\pi i k}{\log2},
\qquad
s=1+\frac{2\pi i k}{\log2}.
\]
Gamma duplication introduces a power of two whose logarithm is linear, so it supplies no cancelling curvature.

The interlacing test is also tightened. On the positive spectral axis, the genuinely consecutive stages \(N=14\) and \(N=15\) have family order
\[
N15,N14,N14,N15,
\]
and therefore do not interlace. Adding a second fully admitted theta carrier to the first likewise fails alternation. These are robust numerical diagnostics for the implemented completions, not a rigorous interval proof for the exact untruncated integral.

For a mapped zero \(a\), the disk Poisson kernels at the two seam endpoints obey the exact identity
\[
P_a(+1)P_a(-1)
=\cos^2(\pi\eta)
=\operatorname{sech}^2(d_{\rm seam}).
\]
The additive defect
\[
\varepsilon(a)
=-\log(P_a(+1)P_a(-1))
=2\log\cosh(d_{\rm seam})
\]
is height-independent and zero exactly on the critical line. At \(\eta=1/4\), it equals \(\log2\). Finite products of \(\cos^2(\pi\eta)\) define an unweighted seam determinant that cannot forget a zero merely because its height diverges.

This defect also survives the earlier branch warning. For \(0<|\eta|<1/2\),
\[
4\varepsilon(\eta/2)<\varepsilon(\eta),
\]
so even four half-displacement descendants strictly contract it. The full endpoint phase derivatives nevertheless diverge, and no current prime or theta identity extracts the per-zero product, determinant or infimum. The seam object is coercive; its arithmetic control remains open.

### 4.20 The seam now has an exact arithmetic controller

The twenty-first-stage report [`rss-arithmetic-seam-control.md`](./rss-arithmetic-seam-control.md) moves the expansion point into the Euler-product half-plane. For \(a=-1\),
\[
z_a(s)=\frac{s-2}{s+1}
\]
is based at \(s=2\), maps the critical line to the unit circle and maps one member of every off-line quartet inside it.

Apply this coordinate to the endpoint-completed prime function \((s-1)\zeta(s)\). Its logarithm has coefficients
\[
p_n
=1+(-1)^{n+1}2^n
-3\sum_{m\ge2}
\frac{\Lambda(m)}{m^2}
L_{n-1}^{(1)}(3\log m).
\]
For each fixed \(n\), the prime-power sum converges absolutely. The endpoint term is essential: it cancels the artificial exponential produced if the zeta pole and \(\log(s-1)\) are estimated separately.

The generating series has radius one exactly when RH holds, giving the exact arithmetic criterion
\[
\mathrm{RH}
\quad\Longleftrightarrow\quad
\limsup_{n\to\infty}|p_n|^{1/n}=1.
\]
Thus the seam infimum would be forced to one by the explicit subexponential estimate
\[
p_n=e^{o(n)}.
\]

This identifies the arithmetic controller but does not prove its bound. Absolute convergence at every fixed index is not uniform control as \(n\to\infty\). A quartet at height \(\gamma\) produces only a radial exponent of order \(\gamma^{-2}\) at the fixed base point, so detecting an escaping zero requires coefficient indices of order \(\gamma^2\). The infinite sequence sees every defect; no finite prefix sees arbitrary height.

A single ordinary Weil test cannot equal the seam defect either. If the real part of a holomorphic test depends only on horizontal displacement, harmonicity makes that dependence affine, whereas \(-2\log\cos(\pi\eta)\) is nonlinear. The all-index arithmetic family is therefore necessary, but its subexponential cancellation remains equivalent to RH rather than a proof of it.

### 4.21 The subexponential proof reduces to square-root prime error

The twenty-second-stage report [`rss-prime-laguerre-growth-proof.md`](./rss-prime-laguerre-growth-proof.md) attempts the requested bound directly. Its first step succeeds exactly. If
\[
f_n(x)=x^{-2}L_{n-1}^{(1)}(3\log x),
\]
then
\[
3\int_1^\infty f_n(x)\,dx
=1-(-2)^n.
\]
The apparent endpoint exponential is therefore precisely the transform of the continuous prime-density measure \(dx\).

Writing \(\widetilde E(x)=\psi(x)-(x-1)\), the completed coefficient becomes
\[
p_n=-3\int_1^\infty f_n(x)\,d\widetilde E(x).
\]
After integration by parts it is an explicit signed transform of the Chebyshev prime error. This removes the artificial large term but does not prove a bound.

Three natural estimates fail. Taking absolute values destroys the main cancellation. The Laguerre kernel is not positive: \(L_{n-1}^{(1)}\) has \(n-1\) positive roots and increasing sign variation. Ordinary prime-number-theorem errors remain near the \(x\) scale, while the sufficient bound is the RH-scale estimate
\[
\psi(x)-x=O(x^{1/2}\log^2x).
\]
Finally, finite zero verification only reduces a possible exponential rate; it cannot make that rate exactly zero.

The requested proof is therefore not completed. It now requires either a new square-root-scale prime-error theorem or a uniform cancellation theorem for the signed Chebyshev–Laguerre transform. Both are equivalent in strength to the unresolved zero-location problem.

### 4.22 Both prime-error routes meet the same critical boundary

The twenty-third-stage report [`rss-dual-prime-error-routes.md`](./rss-dual-prime-error-routes.md) attempts both missing theorems. Under
\[
z=\frac{s-2}{s+1},
\]
the unit disk is exactly the half-plane \(\Re s>1/2\). If arithmetic continuation reaches only \(\Re s>\theta\), the largest guaranteed centered disk and corresponding coefficient base are
\[
r_\theta=\frac{2-\theta}{1+\theta},
\qquad
B_\theta=\frac{1+\theta}{2-\theta}.
\]
Only \(\theta=1/2\) gives \(B_\theta=1\); every fixed exponent loss remains exponential.

The square-root route fails because established prime-number-theorem and zero-free-region estimates do not reach \(x^{1/2+\varepsilon}\). The direct Laguerre route fails because critical-weight orthogonality needs norms not supplied by unconditional prime estimates, recurrence introduces uncontrolled logarithmic moments, and signed phase correlation is not uniformly bounded. The later critical-energy stage identifies a sufficient norm weaker in pointwise form, but its all-scale estimate remains RH-equivalent. Established zero-density and averaged-in-height estimates cannot exclude one exceptional zero.

The two requests are therefore the same analytic continuation problem in different coordinates. Neither attempt provides a new inequality crossing \(\Re s=1/2\), and RH remains open.

### 4.23 Critical Chebyshev energy isolates the missing theorem

The twenty-fourth-stage report [`rss-critical-chebyshev-energy.md`](./rss-critical-chebyshev-energy.md) finds a weaker positive formulation of the required arithmetic input:
\[
\forall\delta>0,
\qquad
\int_X^{2X}|\psi(x)-x|^2\,dx
\ll_\delta X^{2+\delta}.
\]
Unlike pointwise square-root control, this estimate permits large errors on sparse sets. It is nevertheless RH-equivalent for the Chebyshev error. In its weighted form it says that
\[
\int_1^\infty
|\psi(x)-(x-1)|^2x^{-2-2\varepsilon}\,dx<\infty
\]
for every \(\varepsilon>0\). Cauchy–Schwarz then makes the Mellin transform of the shifted error holomorphic throughout \(\Re s>1/2\). There it equals the logarithmic derivative of \((s-1)\zeta(s)\), so even one zero in that half-plane would give a forbidden pole. RH supplies the converse through the standard \(O(x^{1/2}\log^2x)\) estimate.

The same energy has an exact finite triangularly weighted von Mangoldt pair expansion. Its weighted norms also control the signed Laguerre kernels through the Hilbert-valued generating function
\[
\sum_{n\ge1}
\left[2L_{n-1}^{(1)}(t)+3L_{n-2}^{(2)}(t)\right]z^n
=
\frac{z(2+z)}{(1-z)^3}
\exp\!\left(-\frac{tz}{1-z}\right).
\]
The resulting disk radius reproduces exactly the earlier exponent-to-base map and would imply \(p_n=e^{o(n)}\).

This identifies a positive all-scale theorem that is weaker in form than the prior pointwise target and proves its equivalence to every later formulation. It does not establish the energy estimate. RH remains open.

### 4.24 Critical energy applied; spin and colour audited

The twenty-fifth-stage report [`rss-energy-spin-colour.md`](./rss-energy-spin-colour.md) propagates the critical-energy premise through the earlier programme. Conditionally, it gives
\[
p_n=e^{o(n)}
\Longrightarrow
\mathrm{RH}
\Longrightarrow
\mathcal R_{\rm hor}=0,
\quad
\Delta=1,
\quad
D_{\rm ord}=G_g.
\]
Thus one all-scale prime norm closes the arithmetic controller, horizontal residue, two-ended seam determinant and ordinate/Weil equality. It does not prove real-rootedness of each finite theta completion, choose a splice clock or derive any physical constant.

For spin and colour, the minimal internal space is \(V=\mathbb C^2\otimes\mathbb C^3\). Its operator space decomposes into singlet, spin-triplet, colour-octet and mixed channels with dimensions \(1+3+8+24=36\). A scalar trace sees only the singlet. If
\[
\boldsymbol E=E I_d+\boldsymbol E_0,
\qquad \operatorname{Tr}\boldsymbol E_0=0,
\]
then
\[
\|\boldsymbol E\|_{\rm HS}^2
=d|E|^2+\|\boldsymbol E_0\|_{\rm HS}^2.
\]
Nonsinglet channels add positive energy and cannot cancel the scalar Chebyshev obstruction. Fixed multiplicity also leaves the coefficient radius unchanged because \(d^{1/n}\to1\).

The seam result depends on whether six means internal states or six new zeros. Retaining six internal states before and after halving preserves contraction. Six distinct half-displacement descendants instead satisfy
\[
6\varepsilon(\eta/2)>\varepsilon(\eta)
\]
for \(0<|\eta|<0.424141195855\ldots\), so they defeat uniform contraction. The earlier \(\mathbb Z_3\) phase model can represent at most the centre/triality shadow of \(SU(3)\), not full colour gauge dynamics. No prime-dependent \(SU(2)\times SU(3)\) coupling or singlet energy theorem is derived.

### 4.25 Universal π-coupling is exact but does not close prime energy

The twenty-sixth-stage report [`rss-universal-pi-coupling.md`](./rss-universal-pi-coupling.md) tests several meanings of “every number above one is entangled with \(\pi\).” For integers, two exact universal couplings are already present:
\[
\prod_{n=2}^{\infty}\left(1-\frac{z^2}{n^2}\right)
=\frac{\sin(\pi z)}{\pi z(1-z^2)},
\qquad
\vartheta(x)=x^{-1/2}\vartheta(1/x).
\]
The sine product packages the integer lattice; the self-dual theta Gaussian supplies the archimedean completion and functional equation. Every finite golden-delay theta model already contains the second coupling through \(e^{-\pi n^2x}\).

Neither identity controls the von Mangoldt fluctuation. Unit phases preserve positive energy exactly. The multiplicative phase \(n^{i\pi}\) replaces \(\zeta(s)\) with \(\zeta(s-i\pi)\), shifting zeros vertically without changing their real parts. Parity phases retain all nontrivial zeta zeros and add the dyadic divisor. The archimedean \(\pi\)-factor is zero-free in \(\Re s>1/2\) and cannot cancel a zero of \((s-1)\zeta(s)\).

A common tensor factor \(|\pi\rangle\) is separable, not quantum-entangled. Number-dependent register states could be entangled only after their Hilbert space, overlaps, dynamics and arithmetic observable are specified. In the spin–colour model, \(\pi\) parametrizes the centres of \(SU(2)\) and \(SU(3)\), but scalar singlets remove those phases. In the seam, \(\pi\) already turns strip displacement into the coercive angular defect; it does not force that displacement to vanish.

The exact new conclusion is structural: universal \(\pi\)-coupling supplies lattice completion, Fourier duality and phase geometry, not the critical untwisted prime-energy estimate. RH remains open.

### 4.26 Direct π×π tests fail at canonical geometry and principal energy

The twenty-seventh-stage report [`rss-pi-squared-coupling.md`](./rss-pi-squared-coupling.md) tests both direct meanings of \(\pi\times\pi\). For
\[
\Theta_a(x)=\sum_{n\in\mathbb Z}e^{-an^2x},
\]
Poisson summation gives
\[
\Theta_a(x)=\sqrt{\frac{\pi}{ax}}\Theta_{\pi^2/a}(1/x).
\]
The unique positive self-dual coefficient is \(a=\pi\). Substituting \(a=\pi^2\) pairs that channel with \(a=1\), while \(\sin(\pi^2z)\) moves lattice zeros from integers to \(n/\pi\).

The \(\pi^2\) strip exponential also fails on the original domain: \(\cos(\pi^2\eta)\) changes sign at \(|\eta|=1/(2\pi)\), inside the critical strip. The right-half-plane/Cayley seam map no longer covers every possible zero. Pairing two canonical \(\pi\)-channels instead produces \(\zeta(s)^2\), doubling multiplicities without changing zero locations or the generalized Li radius.

Finite von Mangoldt computations through \(X=262{,}144\) compare untwisted, logarithmic-\(\pi\), logarithmic-\(\pi^2\) and additive-\(\pi^2\) energy channels. They distinguish finite behavior but cannot establish an all-scale exponent. Logarithmic twists are vertical translates of the same horizontal-zero problem; the additive twist is a different channel and does not control the principal one. Unit \(\pi^2\)-phases preserve Hilbert energy exactly.

The proposal has therefore been tested rather than merely classified. Direct \(\pi^2\) substitutions break canonical geometry, while doubled \(\pi\) channels duplicate the existing obstruction. RH remains open.

### 4.27 The decimal phase derives a golden barycentre, not zero transport

The twenty-eighth-stage report [`rss-decimal-splice-contraction.md`](./rss-decimal-splice-contraction.md) tests whether the exact decimal phase can close the remaining contraction gap. It identifies
\[
p=\cos\frac{\pi}{5}=\frac{\varphi}{2},
\qquad
p\eta+(1-p)(-\eta)
=\frac{\eta}{\varphi}.
\]
Thus \(\pi/10\) supplies the exact coefficient \(c=1/\varphi\) for a weighted identity/reflection mixer.

The coefficient is compatible with the exact nonlinear seam. Since \(-\log\cos x\) has positive even-power coefficients,
\[
2\varepsilon(\eta/\varphi)
<\frac{2}{\varphi^2}\varepsilon(\eta)
<\varepsilon(\eta)
\]
for every nonzero critical-strip displacement. Two hypothetical contracted spectral descendants therefore retain strict total seam contraction.

The mixer does not, however, move zero support. Its input points remain \(+\eta\) and \(-\eta\), while their weighted barycentre need not be a zero. Function-level reflection gives
\[
p\xi(s)+(1-p)\xi(1-s)=\xi(s),
\]
which is identity at the original argument rather than evaluation at a contracted argument. Keeping \(\gamma\) fixed while contracting \(\eta\) is nonholomorphic, and a unitary two-output mixer stores rather than destroys the complementary norm.

The period-twenty additive phase \(e^{i\pi n/10}\) is a nonprincipal residue-class channel. Its reduced-residue mean vanishes, but an exact discrete Fourier example has zero decimal mode and nonzero principal mode. Its finite von Mangoldt energy cannot prove the all-scale untwisted estimate.

This stage therefore replaces an arbitrary contraction factor by an exact decimal-golden candidate and proves two-branch seam compatibility. Same-\(\xi\) closure, an aggregate fixed point, a no-birth genealogy and principal-prime recovery all remain unproved. RH remains open.

### 4.28 Entropy contracts the branch label, not horizontal support

The twenty-ninth-stage report [`rss-kappa-entropy-splice.md`](./rss-kappa-entropy-splice.md) uses the already-derived
\[
\kappa_{\rm R}=\frac{1}{4\pi^2},
\qquad
K_\kappa(s,t)=\kappa_{\rm R}\zeta(s+\overline t+2),
\]
rather than introducing a new kernel. The decimal weights define the binary random-reflection channel
\[
P=
\begin{pmatrix}p&q\\q&p\end{pmatrix},
\qquad
p=\frac{\varphi}{2},
\qquad
q=1-p.
\]
Its nonconstant eigenvalue is \(p-q=1/\varphi\). It contracts a branch bias \(m\) to \(m/\varphi\), increases Shannon entropy and satisfies
\[
D(P\mu\Vert u)
\le\frac{1}{\varphi^2}D(\mu\Vert u).
\]

The completed \(\xi\) ledger is invariant under this channel. Critical-line reflection satisfies \(R_\#\mu_\xi=\mu_\xi\), hence \(p\mu_\xi+qR_\#\mu_\xi=\mu_\xi\). But the fixed-point set contains every reflection-symmetric measure, including every off-line quartet. The strict entropy contraction removes only antisymmetric branch imbalance, which the functional equation already removes without RH.

The established feature geometry supplies two additional no-go results. First,
\[
pv_\eta+qv_{-\eta}\ne v_{\eta/\varphi};
\]
feature mixing is not coordinate movement. Second, random reflection does not uniformly contract the raw \(K_\kappa\)-distance to the critical feature. The exact two-pass seam also satisfies \(R^2=I\), which excludes strict global contraction on the full state space: applying a factor below one twice would contradict exact return. Entropy production therefore requires coarse-graining or an environment that retains the discarded information.

The natural entropy channel and completed-ledger invariance are now derived. Their invariant set is too large to select the critical line. A successful route would require a support-changing open-system law with the critical ledger as its unique invariant state, together with no-birth and principal-prime control. RH remains open.

### 4.29 Natural-gradient support flow has the right unique fixed point

The thirtieth-stage report [`rss-kappa-natural-gradient-flow.md`](./rss-kappa-natural-gradient-flow.md) normalises the established Rankin features to the zeta probability family
\[
\pi_\eta(n)
=
\frac{n^{-3-2\eta}}{\zeta(3+2\eta)}.
\]
Writing \(L(a)=\log\zeta(a)\), its relative entropy to \(\pi_0\) and Fisher metric satisfy
\[
\frac{dD}{d\eta}=4\eta L''(3+2\eta),
\qquad
I(\eta)=4L''(3+2\eta).
\]
The Fisher-natural gradient is therefore exactly
\[
\frac{d\eta}{dt}=-\eta,
\qquad
\eta(t)=e^{-t}\eta(0).
\]
At \(t=\log\varphi\), this recovers the decimal support map \(\eta\mapsto\eta/\varphi\).

The resulting deterministic Markov semigroup preserves the critical strip, commutes with reflection, fixes the ordinate and supplies a complete genealogy without births. Its only invariant finite-probability ledger is supported at \(\eta=0\): invariance forces
\[
\int\eta^2d\mu
=e^{-2t}\int\eta^2d\mu,
\]
so the horizontal second moment vanishes.

This finds the requested support-changing law and unique fixed point, but not stationarity of the actual \(\xi\) ledger. The functional equation supplies reflection, not shrinkage. Contracting an off-line quartet changes its polynomial and the completed entire function. A five-feature quotient-Gram diagnostic also has a negative LDL pivot, numerically obstructing an exact pure-state channel lift on the whole \(K_\kappa\) feature family.

If finite-height \(\xi\) ledgers were stationary under this semigroup, the second-moment argument would prove RH immediately. No completed-prime identity currently establishes that stationarity. The candidate is canonical within the information geometry, but same-\(\xi\) invariance remains the RH-equivalent bridge. RH remains open.

### 4.30 Xi-ledger stationarity is exactly RH

The thirty-first-stage report [`rss-xi-ledger-stationarity.md`](./rss-xi-ledger-stationarity.md) attempts to prove stationarity of the actual completed divisor. It first proves the exact equivalence
\[
\mathrm{RH}
\quad\Longleftrightarrow\quad
(T_t)_\#\mu_\xi=
\mu_\xi
\text{ for one }t>0.
\]
Even weak stationarity for \(f(\eta)=\eta^2\) forces the horizontal second moment to vanish.

For one reflected quartet,
\[
Q_{\eta,\gamma}(z)
=z^4+2(\gamma^2-\eta^2)z^2+(\eta^2+\gamma^2)^2,
\]
and the flow gives
\[
\partial_tQ
=4\eta^2\left[z^2-(\eta^2+\gamma^2)\right].
\]
Thus an off-line quartet moves even though evenness, reality, entire order and central normalisation are preserved.

The convergent horizontal residue supplies an aggregate version. With \(x=\eta^2/\gamma^2\),
\[
\frac{dr}{dt}
=-\frac{8x(3-x)}{\gamma^2(1+x)^3}<0
\]
for every off-line nontrivial zero. Zero total variation would prove RH, but no completed-prime or seam conservation law forces it.

Functional symmetry, central normalisation, kappa entropy and principal-prime uniqueness were all tested. The first three preserve structures weaker than divisor stationarity; the fourth would prove the desired statement if its all-scale identity were established. No such identity was derived. RH remains open.

### 4.31 One Euler anchor is enough

The thirty-second-stage report [`rss-principal-prime-anchor.md`](./rss-principal-prime-anchor.md) searches directly for the missing completed-prime conservation law. It reduces the open-half-plane target to the single absolutely convergent anchor
\[
\frac{\xi'}{\xi}(2)
=\frac32-\frac{\gamma_E+\log\pi}{2}
-\sum_{n\ge2}\frac{\Lambda(n)}{n^2}
=0.069066231530\ldots.
\]
For the transported canonical divisor \(\xi_t\), every off-line quartet contributes strictly positively to
\[
\left.\frac d{dt}\frac{\xi_t'}{\xi_t}(2)\right|_{t=0}.
\]
The contribution is quantitatively comparable to the magnitude of the central horizontal-residue loss. Termwise and after summation,
\[
1.4269\ldots(-\dot{\mathcal R}_{\rm hor})
\le
\left.\frac d{dt}\frac{\xi_t'}{\xi_t}(2)\right|_{t=0}
\le
1.5196\ldots(-\dot{\mathcal R}_{\rm hor}).
\]
Consequently
\[
\mathrm{RH}
\iff
\left.\frac d{dt}\frac{\xi_t'}{\xi_t}(2)\right|_{t=0}=0
\iff
\dot{\mathcal R}_{\rm hor}(0)=0.
\]
Thus one scalar conservation law would suffice; equality throughout \(\Re s>1\) is unnecessary.

The principal moment on the right is static, but that does not conserve the logarithmic derivative of a synthetically moved divisor. The Euler-product identity belongs to \(\xi_0=\xi\). No Euler product has been derived for \(\xi_t\) when \(t>0\). Identifying the transported anchor with the same fixed von Mangoldt moment is the missing same-function intertwining theorem, and assuming the same Euler product would already give stationarity by uniqueness.

The search therefore derives a smaller exact target and a coercive prime-anchor/residue bridge, but not the independent conservation premise. RH remains open.

### 4.32 The prime-phase law and its exact crossing defect

The thirty-third-stage report [`rss-prime-phase-conservation.md`](./rss-prime-phase-conservation.md) retries the scalar conservation law by Fourier transforming the principal-prime phase. For
\[
C(s)=(s-1)\zeta(s)
\]
and \(\sigma>1\), absolute convergence proves
\[
\boxed{
\frac6\pi\int_0^\infty
\frac{T\arg C(\sigma+iT)}{(T^2+9/4)^2}\,dT
=
\frac1{\sigma+1/2}
-
\sum_{n\ge2}\frac{\Lambda(n)}{n^{\sigma+3/2}}.
}
\]
The factor \(s-1\) completes the zeta pole. Formally setting \(\sigma=1/2\) gives exactly
\[
1-
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}
=
\frac{C'}C(2).
\]

The continuation to the critical boundary is not automatic. Moving the vertical line crosses every zero with \(\Re\rho>1/2\), and canonical factorisation gives
\[
\mathcal I_C^{\rm crit}-\frac{C'}C(2)
=
H_{\rm ord}(3/2)-\frac{\xi'}\xi(2)
=
\mathcal D_2.
\]
Each off-line quartet contributes the already derived strictly positive Euler-anchor defect. Therefore the boundary phase law is conserved if and only if \(\mathcal D_2=0\), equivalently if and only if RH.

The retry proves the prime-phase identity throughout its Euler domain and evaluates the complete obstruction. Dominated convergence controls the height tail but cannot suppress logarithmic branch jumps through zeros. Analytic continuation of the absolutely convergent right side also does not continue an argument integral across zeros. Defect-free boundary continuation remains unproved. RH remains open.

### 4.33 The reverse phase inequality recovers the same inner factor

The thirty-fourth-stage report [`rss-reverse-prime-phase-inequality.md`](./rss-reverse-prime-phase-inequality.md) searches the Hardy/Nevanlinna, Balazard--Saias--Yor and Nyman--Beurling literature for an independent proof of
\[
\mathcal I_C^{\rm crit}\le\frac{C'}C(2).
\]
No such proof or already-established weaker implication was found.

Under the disk map \(s=1/(1-z)\), Balazard, Saias and Yor factor
\[
f(z)=(s-1)\zeta(s)=B_{\mathbb D}(z)O(z),
\]
with no singular inner measure. Their exact identity gives
\[
S_{\rm BSY}
=\frac1{2\pi}\int_{\Re s=1/2}
\frac{\log|\zeta(s)|}{|s|^2}|ds|
=\sum_{\Re\rho>1/2}\log\left|\frac{\rho}{1-\rho}\right|
=-\log|B_{\mathbb D}(0)|\ge0.
\]
If \(B_{\mathbb H}\) denotes the corresponding half-plane product, then \(B_{\mathbb H}(1)=B_{\mathbb D}(0)\). Burnol's Nyman-space projection theorem yields
\[
\operatorname{dist}(1,NB)^2
=1-|B_{\mathbb H}(1)|^2
=1-e^{-2S_{\rm BSY}}.
\]
The Stage-33 phase defect is a different positive kernel on the same forbidden divisor. Consequently
\[
\mathcal D_2=0
\iff S_{\rm BSY}=0
\iff B=1
\iff\operatorname{dist}(1,NB)=0
\iff\mathrm{RH}.
\]
Outerness, cyclicity, zero Nyman distance and zero BSY mass are therefore equivalent detectors, not independent exclusion engines. De Branges--Sonine completeness, negative-square indices and conductor commutators were also checked; no established arithmetic theorem computes the required sign or index without first encoding zero-freeness.

The audit does obtain a rigorous quantitative tail bound. Platt--Trudgian verified RH through
\[
H=3{,}000{,}175{,}332{,}800.
\]
For every possible quartet above that height,
\[
d_{\eta,\gamma}
\le\frac92\gamma^{-4}+\frac38\gamma^{-6}.
\]
Integrating Bellotti--Wong's explicit upper bound for \(N(T)\) gives
\[
\sum_{\gamma>H}\gamma^{-4}
<2.060805050027808\times10^{-37},
\]
and hence
\[
\boxed{
0\le
\mathcal I_C^{\rm crit}-\frac{C'}C(2)
<9.274\times10^{-37}.
}
\]
The comparison is independently certified by `scripts/certify-rss-prime-phase-defect.py`, which encloses \(\pi\) and every logarithm by exact rational series bounds and proves the final strict inequality by integer cross multiplication. This near-equality cannot be rounded to zero: the defect is \(O(\eta^2)\) near the line and \(O(\gamma^{-4})\) at high ordinate, so no positive uniform gap is known. The reverse inequality and RH remain open.

### 4.34 The integer negative-square detector closes at Weil positivity

The thirty-fifth-stage report [`rss-negative-index-conductor-gate.md`](./rss-negative-index-conductor-gate.md) replaces the collapsing scalar defect by a finite integer-valued inertia. In centered coordinates \(z=s-1/2\), functional-equation reflection is \(Rz=-\overline z\). For a finite reflection-stable node set, define
\[
Q_Z(v)=\sum_jv_j\overline{v_{Rj}}.
\]
If \(f\) nodes are fixed by \(R\) and \(p\) nontrivial mirror cycles occur, the exact reflection-block decomposition gives
\[
\boxed{
\operatorname{Inertia}(Q_Z)=(f+p,p,0).
}
\]
A full off-line quartet contains two mirror cycles and therefore has inertia \((2,2,0)\). Polynomial evaluation at distinct nodes is an invertible Vandermonde map, so Sylvester's law preserves this inertia on coefficient space. The index remains two when the quartet displacement is \(10^{-6}\) or its ordinate is \(10^6\), even though the near-line Vandermonde conditioning collapses. At exact collision on the line, the Vandermonde becomes singular and the reduced critical form is positive.

The standard multiplicity-weighted Weil block \(\left(\begin{smallmatrix}0&m\\m&0\end{smallmatrix}\right)\) still has only one negative eigenvalue. Counting multiplicity by dimension requires a confluent derivative-jet lift, for which no completed prime-side realization was found.

On the zeta test domain, the corresponding completed reflection form is the zero side of the Guinand--Weil explicit formula. Proving that its arithmetic side has zero negative index for every test is Weil positivity and is RH-equivalent. Burnol's local conductor theory does not bypass this: the conductor symbol is signed, the local formula uses a supertrace plus an identity correction, and no canonical global Fredholm pair with compact difference and independently computable prime-side index is supplied. Sonine completeness retains the same negative quartet block and adds no independent reflection positivity.

The fail-fast rule is therefore triggered. Quantised detection is proved, but the proposed arithmetic index and conductor routes are not promoted. RH remains open.

### 4.35 Relational synchronisation combines the clocks but not the sectors

The thirty-sixth-stage report [`rss-relational-synchronisation-combinations.md`](./rss-relational-synchronisation-combinations.md) tests whether proximity to other beings can be combined with the earlier \(\pi\)-register, Fibonacci-cohort, entropy, halving, natural-gradient, phase-defect and negative-index analogies.

The constructive part is a valid consensus model. For a reflected pair,
\[
\dot\eta_+=-J(\eta_+-\eta_-),
\qquad
\dot\eta_-=-J(\eta_--\eta_+),
\]
so reflection-symmetric initial data satisfy
\[
\eta_+(t)=\eta_0e^{-2Jt},
\qquad
\eta_-(t)=-\eta_0e^{-2Jt}.
\]
This recovers golden contraction at \(t=\log\varphi/(2J)\) and halving at \(t=\log2/(2J)\). A sixteen-node network built from eight Fibonacci cohorts, reflected partners, a proximity envelope and the squared splice Gram kernel has a positive-semidefinite connected graph Laplacian. Its tested coherence energy decreases strictly.

The combination audit separates circular relative phase \(q=\tan((\theta_1-\theta_2)/2)\), reflection-branch bias \(m\), and horizontal zero displacement \(\eta\). The state
\[
q=0,
\qquad m=0,
\qquad \eta=\frac14
\]
is perfectly phase locked and reflection balanced while retaining a positive Euler-anchor defect and two negative squares. A common \(\pi\) register changes neither relative phase nor \(\eta\); golden branch entropy acts on \(m\), which is already zero for a completed quartet.

All \(2^7-1=127\) non-empty combinations of seven declared mechanisms were enumerated. Fifteen preserve the original quartet but leave horizontal support unchanged. Forty-eight apply a finite golden or halving support contraction and therefore alter the quartet polynomial while leaving a nonzero defect. Sixty-four include exact mirror-barycentre projection and place the transformed support on the line, but replace the original divisor. No combination is both support-changing and independently same-\(\xi\).

The phase defect decreases continuously under the support flows, while the integer negative index remains two until exact collision. At high ordinate the scalar defect becomes tiny and the index remains unchanged, so the escape obstruction also survives the combinations.

Relational proximity therefore gives a coherent physical and dynamical analogy and unifies several clocks. It does not provide the missing arithmetic intertwining theorem. Requiring the consensus flow to preserve the original completed function or its principal-prime anchor is again RH-equivalent. RH remains open.

### 4.36 Relational coherence transports a conserved defect

The thirty-seventh-stage report [`rss-relational-defect-transport.md`](./rss-relational-defect-transport.md) asks what happens to the obstruction when one participant is brought to the critical state. At the Euler anchor \(w=3/2\), a quartet has positive defect
\[
d_w(\eta,\gamma)
=H_{\rm ord}(w;\gamma)-H_q(w;\eta,\gamma).
\]
In a closed fixed-ordinate network, conservation of the principal-prime anchor conserves the sum of these defects. An exact two-quartet calculation shows that contracting one displacement from \(0.2\) to zero forces the other from \(0.2\) to \(0.282883\ldots\). One quartet becomes critical, but the other retains the complete positive defect and two negative squares.

For an open subsystem under repeated golden contraction, the local defect tends to zero only because the complementary reservoir ledger grows by exactly the same amount. Interpreted arithmetically, the reservoir would require another off-line quartet, a changed ordinate measure, births, multiplicity or escape beyond finite height. The high-ordinate capacity of one quartet decays rapidly, so a fixed toy defect moved to ordinate \(10^6\) requires more than \(4.7\times10^{18}\) edge-of-strip quartets.

The report also qualifies the one-point anchor criterion. With fixed ordinates and the declared strict inward flow, anchor conservation forces RH. If ordinates may move, the off-line quartet \((\eta,\gamma)=(1/4,15)\) can be replaced by a critical pair at \(\gamma=15.006168\ldots\) while preserving the \(s=2\) anchor exactly. It fails at other anchors and changes the zero-counting measure. Three scalar anchors acting on three movable quartets have a rank-three Jacobian in six variables and hence a three-dimensional local nullspace.

A finite collection of scalar moments therefore does not fingerprint a movable divisor. Conservation of the logarithmic derivative on an open set does: analytic uniqueness fixes the normalized completed function and all its zeros. That rigidity also forbids nontrivial contraction unless the divisor was already critical. Relational synchronization can redistribute or export the obstruction, but no same-\(\xi\) annihilation law is derived. RH remains open.

### 4.37 Global annihilation has a proof theorem but no same-xi arithmetic law

The thirty-eighth-stage report [`rss-global-annihilation-proof-search.md`](./rss-global-annihilation-proof-search.md) isolates the requested proof. If a nonnegative off-line functional \(V\) vanishes exactly under RH and one operator \(T\) satisfies
\[
T_\#\mu_\xi=\mu_\xi,
\qquad
V(T_\#\nu)\le qV(\nu),
\quad 0\le q<1,
\]
then
\[
V(\mu_\xi)=V(T_\#\mu_\xi)
\le qV(\mu_\xi),
\]
so \(V(\mu_\xi)=0\) and RH follows. The finite-return version replaces invariance after one pass by \(T^m_\#\mu_\xi=\mu_\xi\) and gives the same conclusion with \(q^m\).

For reflection \(R\eta=-\eta\) and contraction \(C\eta=c\eta\), the combined map obeys \((RC)^2\eta=c^2\eta\). Exact two-pass return therefore forces \((1-c^2)\eta=0\). This is a valid conditional global-annihilation proof. The unresolved premise is that the physical two-pass operation acts as \(RC\) on the actual completed divisor.

Every word of length at most eight in reflection, golden contraction and halving was enumerated: 9,840 words, of which 9,832 are strictly dissipative. None of those 9,832 has finite-order return away from \(\eta=0\). The all-length reason is exact: every word has multiplier \((-1)^r\varphi^{-g}2^{-h}\), whose magnitude is below one whenever \(g+h>0\). A disk version follows from Schwarz's lemma: a finite-order holomorphic self-map fixing the centre is an automorphism and cannot be a strict contraction.

Combining the exact \(9.274\times10^{-37}\) defect bound with the integer index also fails to close the proof. Explicit quartets retain two negative squares while their scalar defect tends below \(10^{-40}\). Defect-weighted reflection blocks lose any eigenvalue gap; normalising them to eigenvalues \(\pm1\) loses a uniform trace-class bound.

Functional-equation reflection supplies same-\(\xi\) invariance without dissipation. Golden, halving, relational, Hardy inner-factor and heat flows supply forms of dissipation only by changing support or the function. The de Bruijn--Newman family is the established global heat-flow comparison, but proving its real-zero threshold is already at zero is RH. The global-annihilation implication is proved; no prime-derived operator satisfying both premises was found. RH remains open.

### 4.38 Prime-power arithmetic supplies dissipation but not the xi intertwiner

The thirty-ninth-stage report [`rss-prime-power-dissipative-law.md`](./rss-prime-power-dissipative-law.md) derives a strict law directly from the von-Mangoldt ledger. For \(a=2+2\eta>1\), normalize
\[
p_\eta(n)
=\frac{\Lambda(n)n^{-2-2\eta}}
{-\zeta'(2+2\eta)/\zeta(2+2\eta)}.
\]
Writing \(A(a)=\log[-\zeta'(a)/\zeta(a)]\), the relative entropy to \(p_0\) and Fisher metric satisfy
\[
D(p_\eta\Vert p_0)
=A(2)-A(a)+(a-2)A'(a),
\]
\[
\frac{dD}{d\eta}=4\eta A''(a),
\qquad
I_\eta=4A''(a).
\]
Therefore the arithmetic Fisher-natural gradient is exactly
\[
\boxed{
\dot\eta=-\eta,
\qquad
\dot D=-4\eta^2A''(a)<0
}
\]
away from the central state. Golden time \(t=\log\varphi\) follows without an adjustable contraction coefficient.

Positive reflection mixtures are rigid. For \(\eta>0\), the ratio \(p_{-\eta}(n)/p_0(n)\) grows like \(n^{2\eta}\) along prime powers. Hence a finite positive reflection-symmetric mixture can equal \(p_0\) at every prime power only when every displacement is zero. If the actual completed zero ledger were proved to induce such a mixture, RH would follow.

The standard explicit formula does not supply that positive identification. A raw quartet contributes
\[
4x^{1/2}\cosh(\eta\log x)\cos(\gamma\log x),
\]
and the ordinate cosine changes sign. In the deterministic test at \((\eta,\gamma)=(1/4,15)\), 9,616 prime-power carriers were positive and 8,504 negative through 200,000. Replacing this signed expression by the positive Gibbs mixture is not an identity. Squaring it introduces prime-pair correlations and returns to the unproved critical Chebyshev-energy estimate.

The programme has therefore found genuine arithmetic dissipation on normalized prime powers, improving the Stage-38 candidate table. What remains absent is an intertwining theorem making the actual \(\xi\) divisor follow that law while preserving the fixed completed function. Arithmetic dissipation is proved; same-\(\xi\) intertwining and RH remain open.

### 4.39 The positive intertwiner exists as a feature map, not as a proved frame identity

The fortieth-stage report [`rss-prime-zero-intertwiner.md`](./rss-prime-zero-intertwiner.md) attaches to each centered zero \(\rho=1/2+\eta+i\gamma\) the normalized von-Mangoldt vector
\[
\psi_{\eta,\gamma}(n)
=\frac{\sqrt{\Lambda(n)}n^{-1-\eta-i\gamma}}
{\sqrt{-\zeta'(2+2\eta)/\zeta(2+2\eta)}}.
\]
Its diagonal is exactly the Stage-39 prime law:
\[
|\psi_{\eta,\gamma}(n)|^2=p_\eta(n).
\]
Thus the ordinate phase cancels after a canonical quadratic lift.

Using positive convergent weights \(w_\rho\propto m(\rho)/(\gamma_\rho^2+9/4)\), define
\[
P_\xi(n)
=\sum_\rho w_\rho
\frac{p_{\eta_\rho}(n)+p_{-\eta_\rho}(n)}2.
\]
The tail ratio of any reflected off-line component grows like \(n^{2|\eta|}\). Positivity prevents cancellation, giving the exact criteria
\[
\mathrm{RH}
\iff P_\xi=p_0
\iff
\sup_{p^k}\frac{P_\xi(p^k)}{p_0(p^k)}<\infty.
\]
The boundedness form is weaker than full frame equality but remains sufficient.

The candidate does not yet prove its own arithmetic bound. A linear translation or phase average of feature vectors only multiplies each ordinate Fourier mode by a characteristic function and retains its sign unless the mode is deleted. The coherent quadratic density \(|\psi_\rho\rangle\langle\psi_\rho|\) has the desired diagonal, while its off-diagonal entries depend on pairs of prime powers and \(\log(n/m)\). Stage 41 corrects the initial inference that those entries must be estimated to obtain the diagonal.

The same-\(\xi\) intertwiner now has a canonical positive feature model and a minimal sufficient bound. The frame identity remains unproved. RH remains open.

### 4.40 Logarithmic dephasing resolves the construction gate

The forty-first-stage report [`rss-logarithmic-dephasing.md`](./rss-logarithmic-dephasing.md) changes the order of operations. On the prime-power Hilbert space put
\[
U_te_n=e^{-it\log n}e_n
\]
and average the conjugated density operator:
\[
\mathcal D_T(A)
=\frac1{2T}\int_{-T}^{T}U_tAU_t^*dt.
\]
Then
\[
(\mathcal D_TA)_{nm}
=A_{nm}\operatorname{sinc}(T\log(n/m)).
\]
Every off-diagonal frequency is nonzero, while every diagonal frequency is zero. Trace-norm convergence for the rank-one features therefore gives
\[
\mathcal D
\left(|\psi_{\eta,\gamma}\rangle\langle\psi_{\eta,\gamma}|\right)
=\operatorname{diag}(p_\eta).
\]
This is a completely positive, trace-preserving diagonal conditional expectation. It annihilates the two-prime off-diagonal terms instead of estimating them. Weil positivity and critical Chebyshev energy are not needed to construct the dephased positive map.

The dephasing does not lose the RH-relevant coordinate. For two prime powers \(n\ne m\),
\[
\eta=-1-
\frac{\log([p_\eta(n)\Lambda(m)]/[p_\eta(m)\Lambda(n)])}
{2\log(n/m)}.
\]
The ordinate and multiplicity can be retained in a separate orthogonal classical register. Thus the whole zero ledger can be recorded positively while exposing \(p_\eta\) as its arithmetic diagonal.

This resolves two earlier construction questions: direct vector averaging fails, but lift-then-average succeeds; coherent off-diagonal prime pairs exist, but no pair bound is needed to remove them. It does **not** show that the global dephased state is \(p_0\). The surviving assertion
\[
P_\xi=p_0
\quad\text{or merely}\quad
P_\xi\le Cp_0
\]
is itself equivalent to RH. Weil positivity and critical Chebyshev energy are bypassed as construction tools, not proved as arithmetic theorems. The positive map is resolved; the same-\(\xi\) global frame bound and RH remain open.

### 4.41 The dephased frame bound has a countable Mellin ladder

The forty-second-stage report [`rss-dephased-mellin-ladder.md`](./rss-dephased-mellin-ladder.md) asks whether uniform domination is stronger than necessary. Define
\[
A_j=\sum_{n=p^k}P_\xi(n)n^{1-1/j}.
\]
A reflected component with displacement \(\eta>0\) contributes a positive multiple of
\[
M(1+1/j-2\eta),
\]
which diverges when \(2\eta\ge1/j\). Consequently
\[
\mathrm{RH}
\iff
A_j<\infty
\quad\text{for every integer }j\ge1.
\]
The first rung \(A_1=1\) follows from probability normalization. The first nontrivial rung
\[
A_2=\sum_nP_\xi(n)\sqrt n<\infty
\]
would already prove the unestablished global zero-free strip \(1/4<\Re\rho<3/4\). Successive rungs shrink that strip to the critical line.

Equivalently, if \(R=P_\xi/p_0\), then
\[
\mathrm{RH}
\iff
R\in L^q(p_0)
\quad\text{for every finite }q>1.
\]
A single off-line displacement makes the \(q\)-th relative moment diverge once \(q|\eta|\ge1/2\).

The explicit reflected state \((p_{0.1}+p_{-0.1})/2\) retains mass one, reflection symmetry, positive dephasing, finite relative entropy, all fixed logarithmic moments and the componentwise dissipative flow, yet its fifth Mellin rung diverges. This proves that the established structural properties do not imply the needed global moments.

Uniform \(L^\infty\) domination has therefore been weakened to countably many scalar positive sums, but only the normalization rung is proved. The first new rung is already a zero-free-strip theorem. The obstruction is narrowed, not overcome, and RH remains open.

### 4.42 One hundred finite-bootstrap rounds prove a separator no-go

The forty-third-stage report [`rss-hundred-round-mellin-closure-search.md`](./rss-hundred-round-mellin-closure-search.md) crosses ten Mellin-rung transitions with ten established mechanisms: positivity, normalization, reflection, dephasing, finite entropy, fixed logarithmic moments, Fisher flow, phase invariance, trace class and strict convexity.

Every one of the one hundred declared routes has an exact separator. For arbitrary finite \(J\), choose
\[
\frac1{2(J+1)}<\eta_J<\frac1{2J}
\]
and let
\[
Q_{\eta_J}=\frac12(p_{\eta_J}+p_{-\eta_J}).
\]
Then
\[
A_j(Q_{\eta_J})<\infty\quad(1\le j\le J),
\qquad
A_{J+1}(Q_{\eta_J})=\infty.
\]
The separator retains all ten mechanisms. Hence no finite combination of the established structural package can bootstrap finitely many Mellin rungs to the next one. Hölder or log-convex interpolation cannot cross the genuine abscissa of convergence.

This no-go is limited and should not be inflated: \(Q_{\eta_J}\) is an abstract reflected von-Mangoldt state, not a claimed alternative zeta divisor. A new arithmetic identity special to the actual \(\xi\) divisor could rule it out. The screened standard sources—linear or absolute explicit formulas, Weil positivity, critical Chebyshev energy, Li, Nyman–Beurling, zero density, classical zero-free regions and finite verification—either remain insufficient, finite-height only or RH-equivalent.

No route proved \(A_2<\infty\), a new central zero-free strip or RH. Because the first hundred rounds did not succeed, no post-success obstruction phase was triggered.

### 4.43 The (101,101) prime-pair term does not close same-xi contraction

The forty-fourth-stage report [`rss-prime-pair-splice-link.md`](./rss-prime-pair-splice-link.md) follows the prime-supported catch-up at 101 through the prime-family Fisher metric, the finite Chebyshev pair energy and the one-point Euler anchor.

For \(M(a)=\sum_n\Lambda(n)n^{-a}\), the curvature has the exact pairwise form
\[
(\log M)''(a)
=\frac{1}{2M(a)^2}\sum_{m,n\ge2}\frac{\Lambda(m)\Lambda(n)}{(mn)^a}\log^2\!\frac mn.
\]
Thus the \((101,101)\) self-pair vanishes in the centered Fisher metric. In the raw Chebyshev energy it contributes \((\log101)^2[2X-\max(X,101)]_+\), equal to \(X(\log101)^2\) for \(X\ge101\). This local term does not establish the all-scale critical energy estimate.

The full estimate \(\int_X^{2X}|\psi(x)-x|^2dx\ll_\delta X^{2+\delta}\) for every \(\delta>0\) would imply RH by Mellin holomorphy, but it is itself RH-equivalent and unproved. The one-point prime-anchor defect likewise equals a positive sum over off-line quartets and has been certified tiny but not zero. No same-\(\xi\) flow invariance follows from the 101 event.

### 4.44 No fixed prime-index Markov channel implements the golden eta contraction

The forty-fifth-stage report [`rss-prime-channel-contraction-no-go.md`](./rss-prime-channel-contraction-no-go.md) tests whether the natural-gradient map \(\eta\mapsto c\eta\) can be realized by one positive stochastic kernel on prime powers. For \(p_a(n)=\Lambda(n)n^{-a}/M(a)\) and \(a_c=2+c(a-2)\), any such identity on an open interval analytically continues throughout \(a>1\). The limit \(a\to\infty\) forces the kernel to fix the first support point \(2\), while the contracted target requires more mass at \(3\) than the input tail outside \(2\) supplies. This is an exact no-go for a parameter-independent Markov channel, including \(c=1/\varphi\).

The obstruction rules out one natural positive-channel bridge. It does not rule out a nonlinear same-\(\xi\) identity or a law defined only on the discrete actual zero set. No actual \(\xi\)-ledger invariance, zero-free strip or RH proof is obtained.

### 4.45 A nonlinear geometric-mean prime map exactly realizes feature contraction

The forty-sixth-stage report [`rss-geometric-prime-reweighting.md`](./rss-geometric-prime-reweighting.md) constructs
\[
\mathcal G_c(q)(n)=\frac{q(n)^cp_0(n)^{1-c}}{\sum_mq(m)^cp_0(m)^{1-c}}.
\]
It sends each prime-power feature state exactly as \(p_\eta\mapsto p_{c\eta}\). Its fixed points are \(p_0\) conditioned on their support, so \(p_0\) is the unique full-support fixed point; relative entropy strictly decreases for full-support noncentral ledgers. Since \(P_\xi\) has full support, \(\mathcal G_c(P_\xi)=P_\xi\) would imply \(P_\xi=p_0\) and RH.

The contraction map is now realized nonlinearly on the prime probability simplex. Its fixed-point property for the actual dephased zero mixture is not derived; that property is already RH-equivalent. No same-\(\xi\) arithmetic invariance, new zero-free strip or RH proof is obtained.

### 4.46 A single local prime-power Hankel equality would force RH

The forty-seventh-stage report [`rss-local-prime-power-diagonal-link.md`](./rss-local-prime-power-diagonal-link.md) writes the coefficients on one prime tower as a positive moment sequence:
\[
a_{p,k}=\frac{P_\xi(p^k)}{\log p}=\int r^k\,d\nu_p(r),
\qquad
r=p^{-2\pm2\eta_\rho}.
\]
Its Hankel determinant is nonnegative and vanishes exactly when the rate measure is concentrated at one point. Because every off-line reflected zero contributes two distinct positive rates, even one equality \(a_{p,1}a_{p,3}=a_{p,2}^2\) at a single prime would imply RH.

This is a sharp local certificate, not the missing proof. The actual value of that determinant has not been derived from the Euler product or a one-variable explicit formula; its evaluation requires a diagonal zero-pair identity and brings back prime-pair correlations. No RH proof is obtained.

---

## 5. Correction ledger

| Claim in archive | Correction or defect | Consolidated status |
|---|---|---|
| Quadratic lifting necessarily requires a two-prime estimate to obtain the positive diagonal | The coherent density has two-prime off-diagonal entries, but logarithmic conjugation-averaging projects them exactly to zero and retains \(p_\eta\). | Corrected: pair control is unnecessary for dephased feature construction; a same-\(\xi\) prime-side proof of the global frame bound remains RH-equivalent. |
| \((\log\xi)''>0\) on the critical line iff RH | Session 7 correctly notes that one off-line zero’s negative contribution need not dominate the total positive background. Session 16c reasserts the converse only for deviations above a numerical threshold. | RH implies positivity away from poles in the all-on-line representation. The converse is not proved by the supplied argument. |
| Pólya-kernel log-concavity implies \(L_1[\Xi]\ge0\) | The archive later supplies a two-Gaussian counterexample to the general implication. | Rejected as a general bridge. |
| \(\Phi\) is strictly log-concave, proved by a variance bound | The sketch bounds an infinite weighted variance by a two-point expression without establishing the required support or tail bound. Individual log-concavity does not in general survive arbitrary summation. | Numerically supported in the archive; supplied proof incomplete. |
| \(F(x)=2\sum1/(x+\gamma_k^2)\) | Corrected in Sessions 16–17 to \(F(x)=2\sum(\gamma_k^2-x)/(x+\gamma_k^2)^2\). | Original formula and “trivial CM proof” retracted. |
| \(F\) is completely monotone unconditionally | The alternative proof says higher \(n\) are “easier”, relies on finite epoch verification and does not supply one uniform analytic bound for all \(n,x\). Positivity of derivatives at one point would not establish complete monotonicity on an interval. | Unproved in supplied corpus. |
| Bernstein density \(\rho(t)>0\) for all \(t>0\) | For small \(t\), the proof says only the first term can be negative. The inequality is reversed: all \(\gamma_k<1/\sqrt{2t}\) give negative terms, and their number grows as \(t\to0\). | Formula conditional on RH; positivity only numerically sampled in the archive. |
| \(\rho(t)\sim(3/\pi\sqrt t)\log(1/t)\) | Applying \(-(1+2t\,d/dt)\) to a leading \(t^{-1/2}\log(1/t)\) term cancels the logarithmic factor. | Stated asymptotic is not established and its leading form is inconsistent with the displayed operator. |
| \((\log\xi)'''(\sigma)<0\) unconditionally | The proof begins with an RH-only all-on-line zero sum, bridges a finite range numerically, replaces a discrete sum by a smooth approximation, and gives no complete uniform treatment of hypothetical off-line quartets for all \(\sigma\). | Conjecture/proof programme, not theorem. |
| Bernstein integral converges only for \(\Re(s)>1/2\) and diverges at every non-zero critical-line point | With \(y=s-1/2\), the Laplace variable is \(x=y^2\); \(\Re(y^2)>0\) is a pair of sectors, not the whole right half-plane. Under the RH-conditional series, the large-\(t\) decay permits continuation at least until the first singularity, so small non-zero imaginary \(y\) is not automatically divergent. | “Bernstein wedge” statement rejected as written. |
| A real-coefficient Padé approximant naturally places poles on the real axis | Real rational functions may have conjugate non-real or purely imaginary poles. | Rationale false; one reported numerical failure retained. |
| Real-axis channel retains \(-58.1\) dB of zero information | No invariant definition, uncertainty analysis or proof of universality is supplied. | Heuristic metric only. |
| Fibonacci splice route is closed and base-independent | The RH archive records only a negative search for connection to its selected matrices. TTI’s separate base-ten argument is not addressed by that search. | No RH connection found; no verdict on TTI’s intrinsic-base claim. |

---

## 6. The identity gap, stated without inflation

The recurring obstruction is real but should be described modestly. The functional equation gives symmetry. The Euler product gives a prime expansion in its valid half-plane. The Hadamard product expresses the entire function through all of its zeros. Weil-type criteria translate RH into positivity over a sufficiently rich test space. None of these identities, by itself, turns finite numerical positivity or averaged control into a proof that every zero lies on one line.

A safe schematic is

\[
\text{prime data in a convergence region}
\longrightarrow
\text{global or averaged identities}
\;
ot\Longrightarrow\;
\text{pointwise location of every zero}.
\]

Calling this an “identity gap” is useful project vocabulary. Calling it a theorem that no technique can bridge would be too strong. A future proof of RH, if one is found, would by definition bridge it using additional structure.

The archive’s cooperative-rescue language can also be retained as a description of finite computations: separate contributions to a tested matrix may be indefinite while their computed sum is positive. It is not yet an analytic theorem for all dimensions, cutoffs and test functions.

---

## 7. Relevance to the outstanding splice questions

### 7.1 Unique splice-to-action map

The constructive note [`../splice-to-action-map.md`](../splice-to-action-map.md) now supplies a declared candidate family
\[
\{\delta\Pi_n\}
\mapsto
K_N(u,v)
\mapsto
S_E[\chi;g].
\]
For nonnegative Fibonacci cohort deposits and \(\omega_n=2\pi(n+1)/\log10\),
\[
K_N(u,v)=\sum_n\delta\Pi_n\cos\bigl(\omega_n(u-v)\bigr)
\]
is unconditionally positive semidefinite by an explicit sine--cosine feature map. A covariant Euclidean quadratic family is
\[
S_E[\chi;g]
=\frac12\int\sqrt g\,\chi F\!\left(\ell_*^2(-\Delta_g)\right)\chi.
\]
Two distinct positive form factors built from the same splice data were exhibited:
\[
F_A(z)=z+\sum_n\delta\Pi_n(1-e^{-10^{-n}z}),
\]
\[
F_B(z)=z+\sum_n\delta\Pi_n\frac{10^{-n}z}{1+10^{-n}z}.
\]
Their inequivalence proves that splice data, Euclidean positivity and covariance do not select a unique action. The independent length \(\ell_*\), Lorentzian prescription, field content, interactions and conservation law remain unprovided. The programme therefore advances from “no explicit map” to “a precise positive candidate family with a proved nonuniqueness obstruction,” not to a derived physical theory.

### 7.2 Physical scale for \(G\)

All splice deposits and the zero-location diagnostics in this corpus are dimensionless until a unit-bearing scale is introduced. No manipulation of a dimensionless RH sequence can determine Newton’s constant by itself. TTI still needs an independently derived \(\ell_{10}\) or equivalent physical datum in

\[
G=C_{10}\frac{c^3\ell_{10}^2}{\hbar}.
\]

The RH archive supplies neither \(\ell_{10}\) nor a unique \(C_{10}\).

### 7.3 Electromagnetic normalisation

A circle-valued second-splice phase may motivate \(U(1)\), but the normalisation freedom

\[
A_\mu\mapsto\lambda A_\mu,
\qquad
q\mapsto q/\lambda
\]

remains until the kinetic term and minimal charge unit are fixed by additional structure. Prime frequencies, zeta zeros and complete-monotonicity claims do not remove that freedom. The archive therefore does not derive \(e\) or \(\alpha_{\rm EM}\).

### 7.4 Independent halo radius \(r_0\)

The conditional splice-halo relation \(r_n=r_0 10^n\) still needs an independently anchored \(r_0\). The RH work contains logarithmic prime frequencies and spectral scales, but no unique, dimensionally valid map from either to a galactic radius. Choosing a zeta ordinate or prime logarithm after looking at a rotation curve would be retrospective fitting.

### 7.5 What the RH work can contribute

It can contribute **tests**, not missing constants:

1. Construct a splice generating function and state its analytic domain.
2. Define the exact Hankel, Loewner or quadratic form whose positivity would imply the desired stability property.
3. Derive truncation-error bounds before reading finite eigenvalues physically.
4. Test the decimal log-frequency \(2\pi/\log 10\) against independently specified observables without fitting a phase per object.
5. Require one map to govern dynamics and lensing if the splice deposit is proposed as gravitating matter.

These steps would make the splice programme harder to fool. They would not yet make it physical.

---

## 8. Publication and website policy

The public TTI integration follows these rules:

- no proof of RH is claimed;
- “theorem” is reserved for an argument that closes within the supplied assumptions;
- internally reproducible algebra is separated from claims of novelty;
- RH-conditional formulas keep the condition visible;
- finite computations are labelled numerical evidence;
- failed experiments are not promoted into impossibility theorems;
- superseded claims remain visible in a correction ledger rather than being erased;
- the RH programme remains separate from the speculative cosmology;
- analogies to the splice are labelled methodological, never coefficient derivations.

The website synthesis is implemented in Part VI:

- `TTI-VI.01` — **The Riemann Dossier**
- `TTI-VI.02` — **Proof and Correction Ledger**
- `TTI-VI.03` — **The Splice Questions After RH**

Each public essay is a shorter, accessible account of this audit. This document remains the detailed internal consolidation record.

---

## 9. Final status table

| Area | Status after consolidation |
|---|---|
| RH proof | Not achieved |
| Johns/TTI admissible-pair audit | Corollary 8.2 is an RH-equivalent OPS-positivity characterization, not proof; Lean depends on disclosed analytic/object axioms. The direct sparse TTI prime measure differs from \(\nu_\zeta\); positive log-translation convolution cannot repair its prime-power support. Pair nonexistence is conditional on the preprint's uniqueness theorem. See `docs/rh/rss-johns-v13-classical-cone-audit.md`, `docs/rh/rss-tti-admissible-pair-no-go.md` and `docs/rh/rss-tti-positive-convolution-no-go.md`. |
| Real-axis strict log-convexity of \(\xi\) | Internally sound derivation; novelty unverified |
| Elementary balance integrals | Exact and reproducible |
| Correct RH-conditional formula for \(F(x)\) | Recovered after correction |
| Conditional inverse-Laplace and Mellin algebra | Algebraically sound where convergence permits |
| Pólya-kernel log-concavity | Numerical evidence; supplied proof incomplete |
| Complete monotonicity of \(F\) | Unproved in supplied corpus |
| Bernstein-density positivity | Numerically sampled; proof invalid as written |
| Unconditional \((\log\xi)'''<0\) | Unproved in supplied corpus |
| Critical-line positivity converse | Unproved in supplied corpus |
| Rankin \(\kappa\)-increment Gram kernel | Unconditionally PSD for arbitrary finite point sets; different kernel |
| Doubled Möbius operator \(P=\left(\begin{smallmatrix}0&Z\\M&0\end{smallmatrix}\right)\) | Exact involution; returns the all-integer ledger and does not induce the Weil metric |
| Natural adjoint completion \(M^*GM\) | Unweighted form unbounded; Green form convergent and PSD but excluded from equality with \(G_g\) by its \(t^2\) diagonal |
| 1000 harmonic-boundary channel | Under the published post-seed indexing, conditionally derives \(t\log(1/t)\) order; fixed coefficient, decimal modulation and prime-power support do not match \(G_g\) |
| Archimedean Weyl-density channel | Unconditionally PSD with exact unit cusp coefficient; continuous mean channel, not exact arithmetic fluctuations |
| Zero-ordinate projection channel | Unconditionally PSD and exact under RH; equality with \(G_g\) is itself RH-equivalent |
| Two-inversion ordinate/horizontal projectors | Exact orthogonal decomposition induced by functional inversion composed with conjugation |
| Central horizontal-residue norm | Convergent and nonnegative; vanishes exactly under RH, but no prime-side vanishing theorem is known |
| 999-quotient bounce | Exact order-three \(D_3\) reflection system; periodic and non-contracting |
| Missing-one carry into 1000 | Exact \(T^3(n)=n-1\) drift and order-1000 permutation; not damping |
| Strict horizontal zero contraction | Zero-set invariance would imply and be implied by RH; not derived from splice or prime arithmetic |
| Splice-at-one golden-delay theta completions | Three coherent indexings (five, seven or four carriers through 1000), each entire, exactly symmetry-preserving and locally uniformly convergent to \(\xi\) along cofinal schedules |
| Internal 333/666/999 splice models | Extra carriers, all-event Fibonacci and shared-face readings give seven compatible population scenarios; all preserve completion symmetry |
| Ternary 100/666/999 splice models | Three-new, three-total and three-state readings give nine population scenarios; uncoupled \(\mathbb Z_3\) phases disappear from the scalar mean |
| Quaternary splice at 1000 | Four-new, four-total and four-state readings were tested alone and after every ternary model; \(F_4=3=4-1\) exactly fits the reindexed net cohort |
| Repeated halving at the splice at 1 | Same-xi horizontal halving is RH-equivalent; admitted-weight halving loses the xi limit; remaining-deficit halving preserves it without controlling zeros |
| Halving-obstruction closure attempt | Aggregate positive-residue invariance or complete no-birth genealogy would suffice; neither is derived, and four spectral descendants cancel quadratic halving |
| Four-route global-halving audit | Prime parity has a nonzero correction; genealogy fails at infinity; positive blends need not remain real-rooted; \(\xi\) is singular at the compactified seam |
| Final three routes | Order-one zero-free cancellation is impossible; tested canonical stages do not interlace; a Blaschke seam divisor and coercive marker are constructed, but their supremum is uncontrolled |
| Two-ended seam ledger | Same-divisor order-one completions are curvature-rigid; consecutive and one-carrier refinements fail numerical interlacing; the endpoint Poisson defect is coercive and four-branch contractive but arithmetically uncontrolled |
| Arithmetic seam controller | Endpoint-completed generalized Li coefficients have an exact absolutely convergent prime-power formula; subexponential all-index growth would prove RH but remains unproved |
| Prime–Laguerre growth proof attempt | The endpoint exponential cancels the continuous prime density exactly; the remainder is a signed transform of \(\psi(x)-x+1\), and the missing bound is at RH-equivalent square-root scale |
| Dual prime-error routes | Square-root Chebyshev error and uniform Laguerre cancellation are the same continuation boundary; exponent \(\theta\) leaves coefficient base \((1+\theta)/(2-\theta)\), equal to one only at \(\theta=1/2\) |
| Critical Chebyshev energy | The all-scale estimate \(\int_X^{2X}|\psi(x)-x|^2dx\ll_\delta X^{2+\delta}\) is a positive theorem weaker in form than pointwise control and exactly sufficient by Mellin and Laguerre Hilbert bounds; the estimate remains unproved and RH-equivalent |
| Energy application and spin–colour audit | Critical energy conditionally kills every exact horizontal/seam residue; an \(SU(2)\times SU(3)\) internal space leaves the scalar singlet obstruction and coefficient radius unchanged, while six spectral descendants fail uniform seam contraction below displacement \(0.424141\ldots\) |
| Universal π-coupling | Sine and theta identities exactly couple every integer mode to \(\pi\), while unit phases preserve positive energy, logarithmic phases shift zeta vertically and a common \(\pi\)-register is separable; no critical prime-energy estimate follows |
| Direct π×π coupling tests | \(\pi^2\) pairs the theta coefficient with one, moves sine zeros to \(n/\pi\) and breaks the full-strip seam map at \(|\eta|=1/(2\pi)\); two canonical channels double zeta multiplicity without changing its zeros or radius |
| Decimal golden contraction attempt | \(\pi/10\) yields the exact weighted-reflection barycentre \(c=1/\varphi\), and two hypothetical descendants strictly contract the exact seam defect; zero support is unchanged, horizontal-only contraction is nonholomorphic and the period-twenty prime twist is nonprincipal |
| Kappa-entropy splice attempt | The golden random-reflection channel contracts branch relative entropy by at most \(1/\varphi^2\) and preserves the completed \(\xi\) ledger, but every reflection-symmetric off-line quartet is also fixed; feature mixing is not support movement |
| Kappa natural-gradient support flow | Normalised Rankin features yield \(d\eta/dt=-\eta\), golden time \(\log\varphi\) and a unique critical-line invariant probability ledger; stationarity of the actual \(\xi\) ledger or principal prime channel remains unproved |
| Completed xi-ledger stationarity attempt | Stationarity for one positive time, weak quadratic stationarity and zero horizontal-residue variation are all RH-equivalent; off-line quartet factors move despite completion symmetry and central normalisation |
| Principal-prime one-point conservation search | The missing half-plane law reduces to conservation of the absolutely convergent \(s=2\) anchor; its flow variation is strictly positive off the line and coercively comparable to residue loss, but no Euler product for the moved divisor proves conservation |
| Prime-phase boundary conservation retry | The weighted endpoint-completed prime-phase law is exact for \(\sigma>1\); shifting it to \(\sigma=1/2\) adds precisely the positive off-line Blaschke defect, so defect-free continuation remains RH-equivalent |
| Reverse prime-phase inequality search | Hardy factorisation, the BSY logarithmic integral and Burnol's Nyman projection recover the same forbidden-zero inner factor; no independent reverse sign was found, but verified zeros plus an explicit counting bound give \(0\le\mathcal D_2<9.274\times10^{-37}\), now backed by an exact rational interval certificate |
| Negative-index/conductor gate | A finite reflection form has inertia \((f+p,p,0)\), so an off-line quartet contributes two stable negative squares; the prime-side zero-index statement is Weil positivity, while no established global conductor Fredholm index or Sonine reflection metric supplies an independent arithmetic computation |
| Relational synchronisation combinations | Proximity, Fibonacci cohorts and a squared splice-kernel graph give positive consensus dynamics and align golden/halving clocks; all 127 mechanism subsets either leave horizontal support fixed or change the divisor, so same-\(\xi\) arithmetic invariance remains missing |
| Relational defect transport | Closed fixed-ordinate anchor conservation transfers positive defect between quartets; open subsystem coherence exports it to a reservoir; moving ordinates can counterfeit finitely many anchors, while open-set conservation fixes the divisor and forbids nontrivial contraction |
| Global-annihilation proof search | Invariance plus strict Lyapunov dissipation would prove RH, as would finite return plus contraction; exhaustive map words, index-gap stress, heat flow and inner-factor routes show that known structures supply one premise but not both |
| Von-Mangoldt dissipative law | Normalized prime-power weights have exact Fisher-natural gradient \(\dot\eta=-\eta\), strict entropy decay and golden time; positive mixtures are rigid, but the signed linear explicit formula does not force the actual zero mixture to be central |
| Positive prime–zero intertwiner candidate | Individual zeros define normalized von-Mangoldt feature vectors whose diagonals are \(p_\eta\); boundedness of the global positive mixture relative to \(p_0\) is RH-equivalent, but no same-\(\xi\) arithmetic theorem proves that frame bound |
| Logarithmic dephasing | Lift-then-average conjugation produces an exact CPTP diagonal map, removes off-diagonal prime pairs without estimating them and retains horizontal zero data; the surviving global centrality or boundedness assertion remains RH-equivalent and unproved |
| Dephased Mellin–Rényi ladder | Uniform frame domination can be replaced by countably many finite negative Mellin moments or all finite relative moments; normalization proves only the first rung, while the second already asserts an unproved global zero-free strip |
| Hundred-round Mellin closure search | Ten structural mechanisms across ten rung transitions all admit exact reflected separators; a general theorem rules out every finite bootstrap from the current structural package, while leaving open genuinely new same-\(\xi\) arithmetic input |
| 101 prime-pair bridge audit | The \((101,101)\) self-pair vanishes from centered Fisher curvature and contributes only \(X(\log101)^2\) locally to the raw Chebyshev energy; the all-scale pair-energy/Mellin criterion and the positive Euler-anchor defect link primes to horizontal displacement, but their vanishing remains RH-equivalent |
| Prime-index contraction channel no-go | No parameter-independent Markov kernel on prime powers maps \(p_a\) to \(p_{2+c(a-2)}\) on an open interval for \(0<c<1\); analytic continuation plus the 2/3 support-tail asymptotics gives an exact contradiction, but does not rule out nonlinear same-\(\xi\) identities |
| Geometric-mean prime reweighting | The nonlinear map \(\mathcal G_c(q)\propto q^cp_0^{1-c}\) exactly maps \(p_\eta\to p_{c\eta}\); its fixed points are \(p_0\) conditioned on support, making \(p_0\) unique at full support and KL strictly dissipative for full-support noncentral laws. Its fixed-point condition on full-support \(P_\xi\) is RH-equivalent and unproved |
| Local prime-power Hankel certificate | For each prime \(p\), \(P_\xi(p^k)/\log p\) is a positive moment sequence in rates \(p^{-2\pm2\eta_\rho}\); one vanishing 2×2 Hankel determinant would force RH, but the actual \(P_\xi\) determinant has not been evaluated by an explicit formula |
| Golden shrinking zero strip | Observed for all one hundred and sixteen model/schedule paths across the splice-at-one, internal-splice, ternary, quaternary and deficit-halving audits only through height 30; globally unproved and defeated as an implication by the escaping-quartet stress family |
| Positive prime Weyl sampling | PSD with prime-power frequencies and unit mean cusp; wrong weights and event/frequency role |
| Suzuki \(G_g\) / all-\(t\) \(\Psi\) positivity | RH-equivalent and unproved; only local/finite positivity established |
| Recovery-witness inequality \(\mathcal C_q-\mathcal J_q\ge0\) | Open for all future witnesses |
| CvS/CCM convergence | Open in the archive |
| Splice-to-action map | A positive decimal log-frequency kernel and covariant Euclidean quadratic action family are constructed; two inequivalent positive form factors prove nonuniqueness, while the physical scale, Lorentzian prescription, field content, interactions and measured normalisations remain underived |
| Physical scale for \(G\) | Not derived |
| \(e\) and \(\alpha_{\rm EM}\) normalisation | Not derived |
| Independent \(r_0\) | Not derived |

**Bottom line:** the archive strengthens TTI’s research discipline more than its cosmological equations. Its lasting lesson is that exact identities, visually compelling cancellation and deep finite precision can still stop one quantifier short of a theorem.
