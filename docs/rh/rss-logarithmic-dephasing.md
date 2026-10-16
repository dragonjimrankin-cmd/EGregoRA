# Logarithmic dephasing resolves the phase and off-diagonal gates

**Forty-first-stage investigation — 15 October 2026**  
**Question:** Can ordinate oscillation and quadratic off-diagonal prime pairs be removed without discarding the RH-relevant horizontal zero data?  
**Companion program:** `scripts/research-rss-logarithmic-dephasing.py`  
**Machine-readable results:** `docs/rh/rss-logarithmic-dephasing-results.json`

## Verdict

Yes—for construction of the positive prime–zero map. The order of the two operations matters:

1. lift the feature vector to its rank-one density operator;
2. average that operator by logarithmic unitary conjugation.

Let \(\mathcal H=\ell^2(\mathcal P)\), where \(\mathcal P\) is the set of prime powers, and let
\[
L e_n=(\log n)e_n,
\qquad
U_t=e^{-itL}.
\]
For the Stage-40 feature,
\[
U_t\psi_{\eta,\gamma}=\psi_{\eta,\gamma+t}.
\]
Define the logarithmic density twirl
\[
\mathcal D_T(A)
=
\frac1{2T}\int_{-T}^{T}U_tAU_t^*\,dt.
\]
Its matrix entries are
\[
\bigl(\mathcal D_TA\bigr)_{nm}
=A_{nm}
\frac{\sin\!\bigl(T\log(n/m)\bigr)}
{T\log(n/m)}.
\]
Because distinct prime powers have distinct logarithms,
\[
\boxed{
\mathcal D_T(A)
\longrightarrow
\mathcal D(A)
=
\sum_n
\langle e_n,Ae_n\rangle
|e_n\rangle\langle e_n|.
}
\]
For every zero feature this gives
\[
\boxed{
\mathcal D
\left(
|\psi_{\eta,\gamma}\rangle
\langle\psi_{\eta,\gamma}|
\right)
=
\operatorname{diag}(p_\eta).
}
\]
Thus the off-diagonal two-prime terms are **annihilated**, not estimated. No Weil positivity or critical Chebyshev-energy bound is needed to construct this dephased state.

This corrects an overstatement in Stage 40. A coherent full density operator has two-prime off-diagonal entries, and recovering that full operator arithmetically would need pair control. The positive diagonal map itself does not.

The horizontal coordinate is retained. Two distinct diagonal likelihoods recover \(\eta\), and \(\gamma\) can be stored in a separate classical register. Therefore ordinate oscillation can be removed from the arithmetic factor without destroying the zero ledger.

What remains is sharper than before:
\[
\boxed{
\text{The positive map exists exactly; the assertion }
P_\xi\le Cp_0
\text{ is itself the unproved RH-equivalent statement.}
}
\]
The twirl supplies no reason that the actual global output must be central or bounded relative to \(p_0\). RH is not proved.

---

## 1. Why averaging the vector fails

Direct linear averaging gives
\[
\frac1{2T}
\int_{-T}^{T}U_t\psi\,dt.
\]
Its \(n\)-th coordinate is multiplied by
\[
\operatorname{sinc}(T\log n)
=
\frac{\sin(T\log n)}{T\log n}.
\]
Since \(n\ge2\), every multiplier tends to zero. The average therefore converges to the zero vector. It has removed not only the ordinate phase but also the amplitude distribution carrying \(\eta\).

This confirms the Stage-40 linear no-go. A linear vector average either retains a Fourier carrier or suppresses it. It does not turn the carrier into the von-Mangoldt probability law.

## 2. Why lift-then-average succeeds

For an operator \(A\), conjugation gives
\[
(U_tAU_t^*)_{nm}
=e^{-it\log(n/m)}A_{nm}.
\]
The diagonal has frequency zero. Every off-diagonal entry has nonzero frequency because \(n\ne m\). Symmetric Cesàro averaging consequently preserves the former and kills the latter.

Applied to
\[
A_\rho
=
|\psi_{\eta,\gamma}\rangle
\langle\psi_{\eta,\gamma}|,
\]
the twirl retains
\[
(A_\rho)_{nn}
=|\psi_{\eta,\gamma}(n)|^2
=p_\eta(n)
\]
and eliminates every term containing
\[
e^{-i\gamma\log(n/m)},
\qquad n\ne m.
\]
The construction does not ask whether the sum of those off-diagonal terms is positive or small. They lie in nonzero eigenspaces of the conjugation action and are projected away.

This is the standard atomic diagonal conditional expectation. It is:

- completely positive;
- trace preserving on positive trace-class operators;
- trace-norm contractive;
- idempotent;
- independent of \(\eta\) and \(\gamma\).

## 3. Infinite-dimensional convergence

For completeness, the conclusion is not based on a formal interchange of infinitely many matrix entries. Let \(P_N\) project onto the first \(N\) prime-power basis vectors. For a rank-one state \(A=|\psi\rangle\langle\psi|\),
\[
\|A-P_NAP_N\|_1
\longrightarrow0.
\]
On the finite-dimensional compression, every off-diagonal multiplier tends to zero and hence
\[
\|\mathcal D_T(P_NAP_N)-\mathcal D(P_NAP_N)\|_1
\longrightarrow0.
\]
Both \(\mathcal D_T\) and \(\mathcal D\) are trace-norm contractions. Approximate \(A\) by \(P_NAP_N\), apply the finite-dimensional limit and then let \(N\to\infty\). This proves trace-norm convergence for every prime–zero rank-one feature.

A positively weighted sum of the states is handled by the same truncation argument because its trace is one. No pair-correlation summability hypothesis is introduced.

## 4. The horizontal coordinate is not lost

For two distinct prime powers \(n,m\),
\[
\frac{p_\eta(n)\Lambda(m)}
{p_\eta(m)\Lambda(n)}
=
\left(\frac nm\right)^{-2-2\eta}.
\]
Hence
\[
\boxed{
\eta
=-1-
\frac{
\log\!\left(
[p_\eta(n)\Lambda(m)]/[p_\eta(m)\Lambda(n)]
\right)}
{2\log(n/m)}.
}
\]
The dephased probability therefore determines \(\eta\). The companion calculation recovered \(\eta=1/4\) from the entries at \(n=2\) and \(m=3\) to floating-point precision.

The ordinate \(\gamma\) is intentionally absent from the prime-power diagonal. If preserving the complete zero coordinate is required, use the classical–quantum record
\[
|\gamma,m\rangle\langle\gamma,m|
\otimes
\operatorname{diag}(p_\eta),
\]
where the orthogonal first factor records ordinate and multiplicity. This record is positive, retains the whole input zero ledger and exposes the RH-relevant amplitude law without ordinate oscillation.

For a reflected pair, the arithmetic factor may instead be
\[
\frac12\left(
\operatorname{diag}(p_\eta)
+
\operatorname{diag}(p_{-\eta})
\right).
\]
It determines \(|\eta|\), which is all that is needed for the RH criterion.

## 5. What happened to the two-prime gate?

Before dephasing, the coherent matrix contains
\[
\frac{
\sqrt{\Lambda(n)\Lambda(m)}
n^{-1-\eta}m^{-1-\eta}
e^{-i\gamma\log(n/m)}}
{M(2+2\eta)}.
\]
There are now two distinct questions:

1. **Can the positive diagonal be constructed from the zero feature?**  
   Yes. The twirl projects the displayed term to zero whenever \(n\ne m\).

2. **Can the entire coherent operator be recovered from a prime-side explicit formula?**  
   No such theorem has been supplied. That stronger request retains the two-prime entries and therefore requires correlation information.

Stage 40 conflated these questions when it described pair control as necessary for “the quadratic lift.” Pair control is necessary for coherent reconstruction, not for the dephased intertwiner requested here.

## 6. Why this still does not establish the arithmetic bound

The completed explicit formula is linear in a holomorphic test function evaluated on the divisor. The dephased probability is nonlinear in the zero coordinate: it uses a feature and its adjoint and depends on
\[
\rho+\overline\rho=2\Re\rho.
\]
As a local function of an unconstrained complex variable, this has nonzero \(\bar\partial\)-derivative. It cannot be represented by the same canonical one-point holomorphic formula on an open strip. Ad hoc entire interpolation on the already known discrete divisor would merely encode the zeros and would not be an arithmetic derivation.

The twirl is therefore a valid **spectral postprocessing map**, not a newly proved prime-side identity. It constructs
\[
P_\xi(n)
=
\sum_\rho w_\rho
\frac{p_{\eta_\rho}(n)+p_{-\eta_\rho}(n)}2
\]
from the actual zero coordinates. It does not show
\[
P_\xi=p_0
\quad\text{or}\quad
P_\xi\le Cp_0.
\]
Indeed Stage 40 proved that either statement is equivalent to RH. There is no weaker technical lemma left between that global bound and the desired theorem.

## 7. Status of the four stated obstructions

| Obstruction | Resolution | Remaining boundary |
|---|---|---|
| Linear phase averaging | Do not average feature vectors; average conjugated density operators | Vector averaging still deletes the state |
| Quadratic off-diagonal prime pairs | Logarithmic twirling annihilates every \(n\ne m\) coefficient | Full coherent arithmetic reconstruction would still need pair control |
| Weil positivity | Not needed to construct or dephase the positive feature map | Using Weil positivity to prove the global bound would assume an RH-equivalent theorem |
| Critical Chebyshev energy | Not needed to construct the dephased map | It remains an RH-equivalent possible route to the global arithmetic bound |

Thus the first two are resolved constructively. The latter two are bypassed for construction but cannot be declared proved: each is an alternative RH-equivalent route to the remaining global assertion.

## 8. Finite audit

The companion program tested \((\eta,\gamma)=(1/4,15)\) on 711 prime powers through 5,000. It verified:

- direct vector averaging loses norm as the averaging window grows;
- density twirling keeps trace one and the diagonal exactly;
- sampled off-diagonal sinc multipliers tend to zero;
- the aggregate off-diagonal Hilbert–Schmidt norm decreases over the tested range;
- the diagonal likelihood ratio recovers \(\eta=1/4\).

These checks illustrate the mechanism. The conditional-expectation proof above supplies the all-support result.

## Evidence boundary

Proved here:

- an explicit logarithmic CPTP twirl taking every prime–zero feature state to \(\operatorname{diag}(p_\eta)\);
- exact elimination of all off-diagonal prime pairs without estimating them;
- trace-norm convergence for the rank-one features and their positive mixtures;
- recovery of \(\eta\) from the dephased state;
- retention of \(\gamma\) and multiplicity in a classical register;
- removal of Weil positivity and critical Chebyshev energy from the feature-construction step.

Not proved:

- a same-\(\xi\) prime-side formula for the nonlinear dephased spectral statistic;
- \(P_\xi=p_0\);
- \(P_\xi\le Cp_0\);
- Weil positivity;
- the critical Chebyshev-energy estimate;
- RH.

## Final status

The phase and off-diagonal construction problem has a clean solution:
\[
\boxed{
|\psi_\rho\rangle\langle\psi_\rho|
\xrightarrow{\ \text{logarithmic twirl}\ }
\operatorname{diag}(p_{\eta_\rho}).
}
\]
The surviving obstruction is no longer “how to remove the phase” or “how to control the off-diagonal entries.” It is the single global arithmetic assertion
\[
\boxed{
P_\xi\le Cp_0,
}
\]
which is already equivalent to RH. The map is resolved; the theorem is not. RH remains open.

**Moment-ladder follow-up:** [`rss-dephased-mellin-ladder.md`](./rss-dephased-mellin-ladder.md) replaces uniform domination by a countable family of scalar negative Mellin moments. The first moment is automatic, but the first nontrivial member already asserts the unproved zero-free strip \(1/4<\Re\rho<3/4\).
