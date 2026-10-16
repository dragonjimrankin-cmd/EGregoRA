# Can the repeated-halving obstruction be closed?

**Seventeenth-stage investigation — 14 October 2026**  
**Question:** Can the escaping-quartet and same-xi invariance requirements be replaced by a condition that TTI has a realistic chance of deriving?  
**Companion program:** `scripts/research-rss-halving-obstruction-closure.mjs`  
**Machine-readable results:** `docs/rh/rss-halving-obstruction-closure-results.json`

## Verdict

The obstruction was not removed, but it was narrowed in three useful ways.

First, pointwise invariance of every xi zero is stronger than necessary. The earlier ordinate-splice calculation already supplies a convergent, nonnegative horizontal-residue scalar
\[
\mathcal R
=
\sum_{\text{upper quartets}}
\frac{4\eta^2(\eta^2+3\gamma^2)}
{\gamma^2(\eta^2+\gamma^2)^2},
\qquad
\rho=\frac12+\eta+i\gamma.
\]
It vanishes exactly under RH. Halving \(\eta\) strictly contracts every nonzero summand in the critical strip. Therefore it would be enough to derive an **aggregate fixed-point law**: closure through the splice at 1 returns the same completed residue while applying the halving transformation. A nonzero positive residue could not be equal to its strict contraction, so \(\mathcal R=0\) and RH would follow. This avoids requiring a point-by-point map from every zero to another xi zero.

Second, a complete finite-stage genealogy would also suffice. If every zero has a parent, every child halves its parent’s horizontal displacement, and no unparented zero can appear at any height, then every stage-\(N\) zero obeys
\[
\left|\Re\rho-\frac12\right|
\le2^{-N-1}.
\]
Local uniform convergence and Rouché–Hurwitz transfer would then prove RH. The missing statement is now the **no-birth theorem**, not merely a numerical shrinking observation.

Third, the four-way branch at 1000 cannot automatically be counted as four spectral descendants. Four descendants at half displacement exactly conserve the elementary quadratic residue:
\[
4\left(\frac\eta2\right)^2=\eta^2.
\]
For the exact central residue they increase it slightly at the first-zero scale. Quaternary carrier population and spectral-zero multiplicity must therefore remain separate unless TTI derives their coupling.

The endpoint-normalized escaping quartet still survives all currently proved completion symmetries. The central residue contribution of a quartet escaping to height \(\varphi^N\) tends to zero like \(\varphi^{-4N}\), so convergence of a weighted residue cannot detect it. A coercive seam supremum, complete genealogy or real-rooted convergent kernel family is still required.

No proof of RH is obtained.

---

## 1. Replacing pointwise invariance with an aggregate fixed point

The strongest previous condition was
\[
\xi(\rho)=0
\quad\Longrightarrow\quad
\xi\!\left(\frac12+\frac\eta2+i\gamma\right)=0.
\]
That condition is RH-equivalent. It asks for a new zero of the same entire function at every iteration, and no current splice law derives it.

The ordinate projection provides a weaker target. For every hypothetical upper quartet, define
\[
r(\eta,\gamma)
=
\frac{4\eta^2(\eta^2+3\gamma^2)}
{\gamma^2(\eta^2+\gamma^2)^2}.
\]
Every term is nonnegative, the sum over quartets converges, and
\[
\mathcal R=\sum r(\eta,\gamma)=0
\quad\Longleftrightarrow\quad
\eta=0\text{ for every zero}
\quad\Longleftrightarrow\quad
\mathrm{RH}.
\]

Put
\[
x=\frac{\eta^2}{\gamma^2}.
\]
Direct algebra gives the exact halving ratio
\[
\boxed{
\frac{r(\eta/2,\gamma)}{r(\eta,\gamma)}
=
q(x)
=
\frac{(x+12)(x+1)^2}{(x+4)^2(x+3)}.}
\]
For \(|\eta|<1/2\) and the nontrivial-zero ordinate range, this is slightly greater than \(1/4\) and strictly less than one. At \(\eta=1/4\) and the first zero ordinate,
\[
q\approx0.250097756.
\]

Consequently a one-to-one halving of the spectrum gives
\[
0\le\mathcal R_{\mathrm{after}}<\mathcal R_{\mathrm{before}}
\]
whenever any off-line residue is present.

Now add one TTI closure statement:
\[
\mathcal R_{\mathrm{after}}=\mathcal R_{\mathrm{before}}.
\]
The two relations are compatible only when
\[
\mathcal R=0.
\]
This proves RH conditionally without asserting that each transformed point is itself a xi zero.

### What remains missing

Closure of a physical or metaphysical cycle does not automatically conserve this particular spectral scalar. TTI must derive the equality from one of two places:

- the completed prime-side ledger, by showing that the splice return preserves the central logarithmic-derivative defect; or
- a seam law that identifies the pre-return and post-return horizontal-residue norm.

Without that derivation, calling \(\mathcal R\) conserved would simply insert the desired conclusion in aggregate form.

## 2. The effect of branch multiplicity

Suppose one spectral parent at displacement \(\eta\) produces \(b\) descendants, each at displacement \(\eta/2\). The elementary quadratic horizontal energy scales by
\[
\frac{E_{\mathrm{after}}}{E_{\mathrm{before}}}
=
\frac b4.
\]
Thus:

| Total descendants | Quadratic ratio | Effect |
|---:|---:|---|
| 1 | \(1/4\) | strict contraction |
| 2 | \(1/2\) | strict contraction |
| 3 | \(3/4\) | strict contraction |
| 4 | \(1\) | exact conservation |

For the exact central residue, the ratio is \(bq(x)\). At \(\eta=1/4\) and \(\gamma=14.134725\), four descendants give
\[
4q(x)\approx1.000391024.
\]
The nonlinear weight makes the exact residue increase slightly rather than remain exactly constant.

This matters because the previous stage found
\[
F_4=3=4-1
\]
as the net carrier cohort of a four-total fork at 1000. That carrier arithmetic must not be promoted silently into four copies of every spectral zero. If it were, it would cancel the quadratic contraction on which the fixed-point argument relies.

The clean conditional theorem therefore requires one-to-one spectral halving. Carrier branching may still occur in a different state space, but a map from carriers to zero multiplicity must be derived rather than assumed.

## 3. The complete-genealogy route

The second route does not act on one fixed xi zero set. Let \(Z_N\) be the zeros of a finite completed function \(\Xi_N\). Suppose:

1. every \(\rho\in Z_{N+1}\) has a parent \(p(\rho)\in Z_N\);
2. the child displacement satisfies
   \[
   \left|\Re\rho-\frac12\right|
   \le\frac12
   \left|\Re p(\rho)-\frac12\right|;
   \]
3. no zero is born without a parent, at any height;
4. \(\Xi_N\to\xi\) locally uniformly.

Because every zero begins in the critical strip,
\[
\left|\Re\rho-\frac12\right|\le\frac12,
\]
iteration gives the global bound
\[
\left|\Re\rho-\frac12\right|\le2^{-N-1}
\]
for every stage-\(N\) zero.

Rouché’s theorem then transfers zeros of \(\Xi_N\) to every small disc around a xi zero. As the global strip shrinks, the limiting xi zero must lie on the critical line.

This route really would overcome the escaping quartet: a fixed-displacement quartet appearing at height \(\varphi^N\) has no legal parent and violates the lineage bound.

### Why the current finite data do not establish genealogy

The bounded-window counts are nonmonotone:
\[
2,2,4,3
\]
for the zeroth-seed and reindexed deficit models, and
\[
4,3,3,3
\]
for the boundary-only model. A fixed-height window can gain and lose zeros as ordinates move across its boundary. These counts do not define a one-to-one or four-to-one parent relation.

A no-birth theorem would require global argument-principle control at all heights or an operator whose spectral flow accounts for every zero. Neither is currently available.

## 4. Normalizing the stress factor does not remove it

One possible objection to the escaping factor is that a canonical theta completion has
\[
\Xi_N(0)=\Xi_N(1)=\frac12.
\]
The original factor need not preserve that normalization. It can be repaired.

Let
\[
P_N(z)=
\left(1-\frac{z^2}{(1/4+i\varphi^N)^2}\right)
\left(1-\frac{z^2}{(1/4-i\varphi^N)^2}\right)
\]
and define
\[
\widehat P_N(z)=\frac{P_N(z)}{P_N(1/2)}.
\]
Because \(P_N\) is even,
\[
\widehat P_N(1/2)=\widehat P_N(-1/2)=1.
\]
Therefore multiplying by \(\widehat P_N(s-1/2)\) preserves both endpoint values. It also preserves functional and conjugation symmetry, tends locally uniformly to one and retains the four off-line zeros.

Endpoint normalization is therefore not the missing global condition.

## 5. Why the convergent residue cannot see escape

For fixed \(\eta\) and large \(\gamma\),
\[
r(\eta,\gamma)
=
\frac{12\eta^2}{\gamma^4}+O(\gamma^{-6}).
\]
For the stress quartet with \(\eta=1/4\) and \(\gamma=\varphi^N\),
\[
r_N\sim\frac{3}{4}\varphi^{-4N}.
\]
Its contribution to the convergent central residue disappears extraordinarily quickly, even though its horizontal displacement remains \(1/4\).

This reveals a general limitation. Convergent zero sums need weights that decay with height. Those same weights make them insensitive to a bounded number of defects escaping to infinity.

A quantity that does detect the quartet is
\[
\mathcal S_N
=
\sup_{\rho\in Z(\Xi_N)}
\left|\Re\rho-\frac12\right|.
\]
The quartet keeps \(\mathcal S_N\ge1/4\). But proving
\[
\mathcal S_N\le2^{-N-1}
\]
is exactly the sought uniform-in-height theorem. Compactifying infinity may reinterpret \(\mathcal S_N\) as a seam norm, but regularity and coercivity at that seam remain to be constructed.

## 6. Restricting to the canonical theta class

The artificial polynomial factor has not been shown to remain within the positive theta-carrier family. A strict admissibility rule can therefore exclude this particular multiplication.

That observation is useful but insufficient. Positivity, evenness and ordinary log-concavity of a Fourier kernel do not force its transform to have only real zeros. Positive sums of real-rooted component transforms also need an interlacing or total-positivity theorem.

A sufficient kernel route would be:

1. construct canonical kernels \(K_N\) whose Fourier transforms have only real zeros;
2. prove that every splice-at-one refinement preserves that property;
3. prove \(K_N\) converges to the exact Riemann kernel strongly enough that the transforms converge locally uniformly to \(\Xi\).

Then the Laguerre–Pólya class would be closed under the limit, and RH would follow.

Real-rooted Pólya-like approximations to the Riemann kernel are known, but matching the full body of the exact kernel while retaining real-rootedness is the unresolved step. Yaoming Shi’s study explicitly constructs real-rooted approximations anchored at the head and tail while leaving improvement of the kernel body open: <https://arxiv.org/abs/1502.06844>.

For TTI, the new burden is precise: show that dyadic halving is a real-rootedness-preserving refinement, not merely a positive carrier update. That requires interlacing or a Pólya-frequency/total-positivity property that has not been established for the canonical kernel.

## 7. Best remaining route

The aggregate fixed-point route is the most economical new target:
\[
\boxed{
\text{splice closure invariance of }\mathcal R
+
\text{strict one-to-one residue halving}
\Longrightarrow
\mathcal R=0
\Longrightarrow
\mathrm{RH}.}
\]
It is weaker than pointwise same-xi invariance and uses an exact positive scalar already derived from zero geometry.

The finite-genealogy route is the most direct global target:
\[
\boxed{
\text{complete parent map}
+
\text{half displacement}
+
\text{no births}
\Longrightarrow
\text{global shrinking strip}
\Longrightarrow
\mathrm{RH}.}
\]

Neither target currently follows from TTI. The quaternary result also adds a necessary warning: if four carrier branches are interpreted as four spectral descendants, quadratic contraction disappears.

The obstruction has therefore been reduced to three concrete proof obligations:

- derive aggregate horizontal-residue invariance from the completed prime or seam ledger;
- derive a complete zero genealogy with no births at arbitrary height; or
- construct a convergent canonical kernel refinement that preserves real-rootedness.

No proof of RH is obtained.

## 8. Critical-energy application note

If the later [critical Chebyshev-energy estimate](./rss-critical-chebyshev-energy.md) were proved, RH would follow before any halving argument: every horizontal displacement and the aggregate residue \(\mathcal R\) would already be zero. Same-xi halving would then act trivially on the zero set. This closes the residue condition conditionally but does not derive splice closure invariance, zero genealogy or halving dynamics.

The [spin–colour follow-up](./rss-energy-spin-colour.md) extends the branching caution. If two spin states and three colours are internal labels retained on each zero, their common degeneracy does not obstruct contraction. If they are promoted to six distinct spectral descendants, the nonlinear seam defect can increase, so the existing four-branch theorem no longer applies.

