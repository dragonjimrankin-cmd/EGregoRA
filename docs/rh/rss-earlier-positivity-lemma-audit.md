# Source-forensic audit of the earlier positivity lemma

**Audit date:** 14 October 2026  
**Question:** Did an earlier result already prove, without RH,
\[
\Psi(t)\ge 0\quad(t\in\mathbb R),
\qquad\text{or equivalently}\qquad
G_g\succeq0
\]
for every finite real point set?  
**Corpus checked:** the full project tree and all 52 extracted files in `google_drive/RHfindings1/` (48 distinct payloads after exact duplicates are removed).  
**Status:** No such proof was found.

## 1. Forensic verdict

The exact valid earlier result most likely remembered as “we already proved positivity for arbitrary finite point sets” is the **Rankin \(\kappa\)-increment Gram identity** in:

- `docs/rh/rss-kappa-pick-transform.md`, section 1, **“The \(\kappa\)-kernel already has the right geometric type”**; and
- its source theorem in `docs/rh/rss-spectral-positivity-investigation.md`, section 4, **“A real positivity theorem supplied by the RSS ledger.”**

It proves universal finite-set positivity for a different kernel,
\[
D_{\kappa,\sigma}(x,y)
=\kappa_{\rm R}\sum_{n\ge1}n^{-2\sigma-2}
 (e^{-ix\log n}-1)(e^{iy\log n}-1),
\]
not for Suzuki’s arithmetic kernel
\[
G_g(x,y)=\Psi(x)+\Psi(y)-\Psi(x-y).
\]

The most likely source of a second recollection—“we already proved positivity on the xi side”—is the archive’s real-axis chain
\[
(\log\xi)''(\sigma)>0
\longrightarrow
F(x)=(\log\xi)''(1/2+\sqrt x)\text{ completely monotone}
\longrightarrow
\rho(t)>0.
\]
Only the first arrow’s starting theorem, strict real-axis log-convexity, has a complete unconditional argument in the supplied corpus. The complete-monotonicity and Bernstein-density upgrades do not close.

A third phrase, **“Global PSD”**, appears in `RH_FRAMEWORK_COMPREHENSIVE (6).md`, section 4.2. Its table reports selected finite Galerkin computations. The same file later says that analytical cooperative rescue is unproved and that proving it is proving RH. It is not a universal lemma.

Therefore the answer is precise:

> **There is an earlier universal Gram-positivity lemma, but its object is \(D_{\kappa,\sigma}\), not \(G_g\). There is no earlier unconditional all-\(t\) positivity lemma for Suzuki’s \(\Psi\), and no earlier arbitrary-finite-set positivity theorem for its screw kernel.**

## 2. The exact valid lemma and all of its quantifiers

For a fixed real \(\sigma\), define
\[
v_{\sigma+ix}(n)
=\sqrt{\kappa_{\rm R}}\,n^{-\sigma-1}e^{-ix\log n}.
\]
Then
\[
D_{\kappa,\sigma}(x,y)
=\langle v_{\sigma+ix}-v_\sigma,
        v_{\sigma+iy}-v_\sigma\rangle_{\ell^2}.
\]
Consequently, for every integer \(m\ge1\), every real point set
\(x_1,\ldots,x_m\), and every complex coefficient set
\(c_1,\ldots,c_m\),
\[
\begin{aligned}
\sum_{i,j=1}^m c_i\overline{c_j}
D_{\kappa,\sigma}(x_i,x_j)
&=\kappa_{\rm R}\sum_{n\ge1}n^{-2\sigma-2}
\left|\sum_{i=1}^m c_i(e^{-ix_i\log n}-1)\right|^2\\
&\ge0.
\end{aligned}
\]

### Assumptions and convergence

- The sum is absolutely controlled because \(|e^{-ix\log n}-1|\le2\).
- The scalar majorant is \(\sum_n n^{-2\sigma-2}\), so this representation converges for \(\sigma>-1/2\). The project uses it in the narrower region \(\sigma\ge1/2\).
- The number of points and coefficients is finite; no interchange of two infinite sums is needed beyond a finite linear combination of an absolutely convergent feature norm.
- No zero of \(\zeta\) and no RH assumption enters.

This is a genuine unconditional stationary-increment Gram theorem.

### Why it is not the required theorem

Its positive spectral measure is the discrete measure supported at the log-integer frequencies,
\[
\sum_{n\ge1}\kappa_{\rm R}n^{-2\sigma-2}\delta_{\log n}.
\]
Suzuki’s kernel contains the completed prime-power explicit formula. Under RH it can instead be represented through real zero ordinates. Replacing one spectrum by the other is the missing arithmetic step, not a positivity-preserving relabelling.

The fifth-stage report makes this boundary explicit: its opening result says that **if** \(G_g\) were proved positive semidefinite on every real window, then the exact double Laplace transform would produce the xi Pick kernel and prove RH. The same report says that this global positivity has not been proved.

No standard closure property fills the gap:

- a bounded feature operator cannot create the poles and boundary norm blow-up of the xi kernel from the uniformly bounded \(\kappa\)-features;
- analytic continuation of a positive kernel need not remain positive;
- applying an inverse transform need not preserve positivity;
- primitive extraction from the all-integer ledger is Möbius-signed; and
- each delayed prime-power hinge is operator-indefinite, despite its positive Mangoldt coefficient.

## 3. Version chronology and correction chain

The archive’s filenames are cumulative Drive variants, not independent final papers. The relevant chronology is:

1. **Session 9, 20 July 2026 — global Pick positivity is explicitly left open.**  
   `RH_SESSION9_FINDINGS (1).md`, section 3, states
   \[
   \mathrm{RH}
   \iff M(z_1,\ldots,z_m)\succeq0
   \text{ for every finite subset of }\mathbb H^+.
   \]
   Its “Not Solved” section says that proving this for all finite subsets remains unproved.

2. **Session 12 — a valid real-axis positivity theorem.**  
   `RH_LOGCONVEXITY_THEOREM.md` proves
   \[
   (\log\xi)''(\sigma)>0\qquad(\sigma\in\mathbb R)
   \]
   from the positive Pólya-kernel/cosh measure. Its “Relation to the Identity Gap” expressly says that the argument does not continue to the critical line because \(\cos(tu)\) changes sign.

3. **Sessions 15–17 — an overstrong complete-monotonicity/Bernstein upgrade.**  
   `RH_THEOREM_COMPLETE_MONOTONICITY.md` labels complete monotonicity unconditional. Session 16 then corrects its zero formula and says the easy termwise proof is invalid. Session 16 states the explicit Bernstein density only **under RH** and lists unconditional positivity as a next step. `RH_SESSION17_FINDINGS...` retains an “Unconditional” heading but immediately says “Under RH. (The formula uses on-line zero ordinates.)” The dedicated `RH_THEOREM_BERNSTEIN_DENSITY.md` nevertheless reasserts an unconditional theorem.

4. **Session 18 — later correction of the density status.**  
   `RH_SESSION18_FINDINGS (3).md`, lines 348–351, lists Bernstein-density positivity **under RH** and describes no new unconditional theorem. It still retains the complete-monotonicity label, so the correction is partial rather than a clean replacement.

5. **Comprehensive versions 12–14 — conflicting statements coexist.**  
   Version 14 is `RH_FRAMEWORK_COMPREHENSIVE (6).md`. Its status line calls complete monotonicity and Bernstein-density positivity unconditional, while its later section 17 labels the density “Under RH”. Its section 4.2 calls a finite table “Global PSD”, while section 4.5/its open-problems list says analytical cooperative rescue is unproved and equivalent to proving RH.

The chronology therefore does not support a “latest wording wins” rule. The later files themselves preserve the correction needed for the forensic conclusion.

## 4. Audit of every candidate positivity claim

### 4.1 Strict real-axis log-convexity: valid but different

The positive Pólya-kernel representation is
\[
M(r)=C\int_0^\infty\Phi(u)\cosh(ru)\,du,
\qquad C>0,
\]
with \(\Phi(u)>0\) and super-exponential decay. Differentiation under the integral is justified on compact real \(r\)-sets by an integrable super-exponential majorant. After normalisation,
\[
(\log M)''(r)
=\mathbb E_r[u^2]
 -\bigl(\mathbb E_r[u\tanh(ru)]\bigr)^2>0.
\]
At \(r=0\), one should use \(M'(0)=0\) and \(M''(0)/M(0)>0\). The archive instead invokes an all-on-line Hadamard sum at that one point, but that invocation is unnecessary and can be removed.

**Quantifier obtained:** every real \(\sigma\).  
**Quantifier not obtained:** complex \(s=1/2+it\), every real screw parameter \(t\), or every finite Gram matrix for \(G_g\).

The attempted continuation changes \(\cosh(ru)>0\) into the signed oscillatory weight \(\cos(tu)\). Cauchy–Schwarz with a positive probability measure is then unavailable. This is the first and decisive domain boundary.

### 4.2 Complete monotonicity: the supplied proof does not close

The dedicated theorem claims
\[
(-1)^nF^{(n)}(x)>0
\quad\text{for every integer }n\ge0\text{ and every }x>0.
\]
Its sum
\[
S_n(r)=\sum_k
\frac{(2n+1)\gamma_k^2-r^2}{(r^2+\gamma_k^2)^{n+2}}
\]
is obtained from the all-on-line zero representation. Thus it is RH-conditional at the point where it is introduced.

The subsequent unconditional route has five independent gaps:

1. “Higher \(n\) are easier” is not a comparison inequality or induction.
2. A table at \(r=100\) does not quantify all \(r\), still less all \(n\) and \(r\) simultaneously.
3. “Epoch verification” is finite and no certified interval enclosure covering the full middle range is supplied.
4. Replacing the zero-counting measure by a smooth density needs an explicit remainder smaller than the sign margin uniformly over the asserted domain; none is given.
5. The claimed off-line extension misuses a zero-free region. A classical zero-free region excludes zeros too close to \(\Re s=1\); it does **not** imply
   \(|\Re\rho-1/2|<1/(5.7\log^2|\Im\rho|)\).

The closing measure is also the wrong transform. The document writes
\[
\mu=\sum_k2\gamma_k^2\delta_{\gamma_k^2},
\]
which would represent \(\sum_k2\gamma_k^2e^{-\gamma_k^2x}\), not the rational function \(F(x)\). The corrected RH-conditional inverse transform is the continuous density candidate in the next subsection.

### 4.3 Bernstein density: exact conditional algebra, invalid universal sign proof

Under RH and with the justified termwise inversion,
\[
F(x)=2\sum_k\frac{\gamma_k^2-x}{(x+\gamma_k^2)^2}
\]
gives
\[
\rho(t)=2\sum_k(2\gamma_k^2t-1)e^{-\gamma_k^2t}.
\]
This algebra survives.

The sign proof fails at its first nontrivial interval. It says that for
\(0<t\le1/(2\gamma_1^2)\), only the \(k=1\) term can be negative. In fact a term is negative exactly when
\[
\gamma_k<\frac1{\sqrt{2t}}.
\]
The threshold increases as \(t\downarrow0\), so the number of negative terms increases. For example, at \(t=10^{-3}\), using \(\gamma_2\approx21.022\),
\[
2\gamma_2^2t-1<0.
\]
The asserted sign split is already false at the second zero.

The rest of the argument does not repair it:

- a smooth asymptotic marked \(\approx\) is not a one-sided error bound for the discrete sum;
- 1,000 verified zeros at finitely many or sampled \(t\)-values do not quantify every \(t>0\);
- a limit as \(t\to0^+\) does not cover a punctured interval without an effective remainder;
- the displayed operator \(-(1+2t\,d/dt)\) cancels the leading logarithm in a term of the form \(t^{-1/2}\log(1/t)\), contrary to the claimed logarithmically enhanced density asymptotic; and
- the claimed off-line error \(3.42\times10^{-37}\) is not “negligible” relative to the quoted lower value \(1.36\times10^{-84}\); it is about \(10^{47}\) times larger.

Even if Bernstein’s theorem supplied an unconditional positive representing measure from a separately proved complete-monotonicity theorem, that would not by itself establish that the measure is absolutely continuous with this RH-derived density.

### 4.4 “Global PSD” cooperative rescue: finite certification only

`RH_FRAMEWORK_COMPREHENSIVE (6).md`, section 4.2, reports positive minimum eigenvalues for selected cutoffs \(c=2,5,13,19\). These are finite Galerkin matrices with fixed computational parameters. The report does not state or prove:

- every cutoff \(c\);
- every basis size \(N\);
- every frequency truncation \(T\);
- every admissible test function; or
- every finite point set for \(G_g\).

The same master file states immediately before this table that Weil positivity for all admissible tests is equivalent to RH. It later says the rescue problem grows without bound and lists an analytical proof of cooperative rescue as open.

The word “global” here means “the sum of all pieces included in that finite matrix”, not “globally quantified over the infinite Weil test space.”

### 4.5 Herglotz and Pick positivity: the archive itself records the right universal condition

`RH_SESSION9_FINDINGS (1).md` gives the cleanest discriminator. For
\[
G(z)=-\frac{\Xi'(\sqrt z)}{2\sqrt z\,\Xi(\sqrt z)},
\]
it states that RH is equivalent to \(G\) being Herglotz, equivalently to its Pick matrix being PSD for **every** finite subset of the upper half-plane.

Under RH the matrix decomposes into a sum of rank-one Gram matrices. That decomposition uses real \(\gamma_k^2\), which is precisely the desired zero-location conclusion. The archive reports finite random and near-pole checks, then explicitly lists the all-finite-set condition as unsolved.

This is not a contradiction. It is the correct separation between:

- a conditional Gram expansion;
- finite numerical evidence; and
- the universal theorem equivalent to RH.

## 5. External primary-source check: Suzuki’s exact boundary

Masatoshi Suzuki’s [*Aspects of the screw function corresponding to the Riemann zeta-function*](https://arxiv.org/abs/2206.03682) supplies the decisive external check.

For the arithmetic function in that paper:

- **Theorem 1.1** gives the explicit prime formula, transform, and zero-series representation unconditionally. In the zero series, the zero parameters need not be real without RH.
- **Theorem 1.2** states
  \[
  \mathrm{RH}\iff g=-\Psi\text{ is a screw function on all of }\mathbb R,
  \]
  which means \(G_g\) is PSD for every finite real point set.
- **Theorem 1.7** states
  \[
  \mathrm{RH}\iff\Psi(t)\ge0\text{ for every }t\in\mathbb R.
  \]
- **Theorems 4.1 and 4.2** prove unconditional positivity only on a sufficiently small interval/window.

The familiar Gram formula
\[
G_g(t,u)=\sum_\gamma
\frac{(e^{i\gamma t}-1)(e^{-i\gamma u}-1)}{\gamma^2}
\]
becomes a sum of modulus squares only after all \(\gamma\) are real. Treating it as an unconditional Gram decomposition silently assumes RH.

Suzuki’s result also confirms the logical relation between the scalar and matrix targets for this particular function. Full kernel positivity gives
\[
G_g(t,t)=2\Psi(t)\ge0.
\]
Conversely, universal scalar positivity implies RH by Theorem 1.7, and RH then implies full screw-kernel positivity by Theorem 1.2. The converse is special to this arithmetic \(\Psi\), not a generic theorem saying every nonnegative function generates a PSD stationary-increment kernel.

For the broader quadratic-form criterion, Jeffrey Lagarias’s survey [*The Riemann Hypothesis: Arithmetic and Geometry*](https://websites.umich.edu/~lagarias//doc/mt-holyoke-rev.pdf), Theorem 3.2, likewise records Weil positivity for all admissible test functions as equivalent to RH. It cannot be imported as an unconditional positivity lemma.

## 6. Consequence for the recovery-witness target

The sixth-stage reduction remains exact:
\[
\mathcal V_q=\mathcal C_q-\mathcal J_q.
\]
Once the local convex geometry and episode decomposition are fixed, proving
\[
\mathcal V_q\ge0
\]
at every future recovery witness would close the remaining global sign obligation and hence prove \(\Psi(t)\ge0\) for all \(t\), therefore RH.

None of the audited earlier results yields
\[
\mathcal J_q\le\mathcal C_q
\]
for every recovery witness:

- \(D_{\kappa,\sigma}\succeq0\) concerns a different positive spectrum;
- real-axis log-convexity concerns a positive cosh measure;
- complete monotonicity and density positivity are not proved;
- cooperative rescue is finite-matrix evidence; and
- Pick/Weil/screw positivity is the RH-equivalent condition being sought.

## 7. Final source determination

No overlooked filename, version, section, theorem, or lemma in the full local project or the 52-file archive proves the target universal statement.

The exact source map is:

| Remembered positivity | Exact source and status | Why it does not settle \(G_g\) |
|---|---|---|
| Arbitrary finite-set Gram positivity | `rss-kappa-pick-transform.md` §1, \(D_{\kappa,\sigma}\) | Different frequencies and weights; no positive transform to the arithmetic kernel |
| Positive Dirichlet kernels | `rss-spectral-positivity-investigation.md` §4 | Kernels \(K_{\rm rep},K_\Lambda,K_\kappa\), not \(K_\xi\) or \(G_g\) |
| Strict positivity for all real inputs | `RH_LOGCONVEXITY_THEOREM.md` | Real \(\sigma\), positive cosh measure; critical-line weight is signed |
| Complete monotonicity for all derivatives | `RH_THEOREM_COMPLETE_MONOTONICITY.md` | RH-sensitive zero sum, no uniform proof, wrong closing measure |
| Bernstein density for all \(t>0\) | `RH_THEOREM_BERNSTEIN_DENSITY.md` | Formula derived under RH; small-\(t\) sign split is false |
| “Global PSD” | `RH_FRAMEWORK_COMPREHENSIVE (6).md` §4.2 | Selected finite Galerkin matrices only; analytic all-test theorem explicitly open |
| Every Pick matrix PSD | `RH_SESSION9_FINDINGS (1).md` §3 | Correctly identified there as RH-equivalent and unproved |
| Local screw positivity | Suzuki, Theorems 4.1–4.2 | Only a sufficiently small interval/window |
| Global \(\Psi\) or screw positivity | Suzuki, Theorems 1.7 and 1.2 | Exactly equivalent to RH; no unconditional proof found |

**Final status:** the remembered lemma is valid only after restoring its original object and domain. It proves unconditional positivity for the Rankin/Dirichlet Gram kernel. Promoting it to Suzuki’s full arithmetic screw kernel is the first unsupported step. The universal witness inequality \(\mathcal C_q-\mathcal J_q\ge0\) remains open.

The follow-up [double-Möbius/Weil completion audit](./rss-double-mobius-weil-completion.md) also closes the most direct second-inversion repair: the canonical two-face involution returns the original ledger, while its Green adjoint has a quadratic origin and therefore cannot equal the \(t\log(1/t)\)-cusped screw kernel. Any remaining route needs a separately derived history-bearing residue or cocycle, not another application of primitive extraction.
