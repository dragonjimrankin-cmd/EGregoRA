# Riemann Programme — Consolidated Source and Proof Audit

**Project:** The Two Infinities: Eternal Integration of the Self  
**Audit date:** 14 October 2026  
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

---

## 5. Correction ledger

| Claim in archive | Correction or defect | Consolidated status |
|---|---|---|
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

No source document derives a spacetime action from the splice sequence. Spectral positivity, a Weil form or a moment matrix can constrain a mathematical operator, but it does not identify which TTI field is dynamical, which term is local, which symmetry is gauged or why one coefficient rather than another multiplies an operator.

A legitimate future bridge would have to begin with a declared map such as

\[
\{\delta\Pi_n\}
\mapsto
\mathcal K(x,y)
\mapsto
S[g,\chi,\Psi,A],
\]

then prove covariance, locality or a stated non-local alternative, stability and conservation. The RH archive contains no such map.

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
| Real-axis strict log-convexity of \(\xi\) | Internally sound derivation; novelty unverified |
| Elementary balance integrals | Exact and reproducible |
| Correct RH-conditional formula for \(F(x)\) | Recovered after correction |
| Conditional inverse-Laplace and Mellin algebra | Algebraically sound where convergence permits |
| Pólya-kernel log-concavity | Numerical evidence; supplied proof incomplete |
| Complete monotonicity of \(F\) | Unproved in supplied corpus |
| Bernstein-density positivity | Numerically sampled; proof invalid as written |
| Unconditional \((\log\xi)'''<0\) | Unproved in supplied corpus |
| Critical-line positivity converse | Unproved in supplied corpus |
| CvS/CCM convergence | Open in the archive |
| Splice action coefficients | Not derived |
| Physical scale for \(G\) | Not derived |
| \(e\) and \(\alpha_{\rm EM}\) normalisation | Not derived |
| Independent \(r_0\) | Not derived |

**Bottom line:** the archive strengthens TTI’s research discipline more than its cosmological equations. Its lasting lesson is that exact identities, visually compelling cancellation and deep finite precision can still stop one quantifier short of a theorem.