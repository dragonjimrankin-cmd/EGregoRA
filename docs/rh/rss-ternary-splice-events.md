# What if 100, 666 and 999 each splice into three?

**Fourteenth-stage investigation — 14 October 2026**  
**Question:** If the events at \(100\), \(666\) and \(999\) are ternary rather than ordinary splice events, what does “three” count, and does the resulting multiplicity improve control of the finite completed-function zeros?  
**Companion program:** `scripts/research-rss-ternary-splice-events.py`  
**Machine-readable results:** `docs/rh/rss-ternary-splice-events-results.json`

## Verdict

“Splice into three” has at least three mathematically different meanings:

1. each event creates **three new carriers**;
2. one incoming path becomes **three total branches**, a net increase of two;
3. one carrier acquires **three internal states**, with no population increase.

All three were tested across the zeroth-seed, reindexed-Fibonacci and boundary-only conventions for the splice at \(1\). Chronological and equal-local-ticks schedules then give eighteen diagnostic paths.

Every path yields a finite entire completed function with the xi functional and conjugation symmetries. In
\[
0\le\Re s\le1,
\qquad
0\le\Im s\le30,
\]
all eighteen paths produced zero counts
\[
2,2,4,3
\]
at cutoffs \(N=14,20,30,40\), and every total matched the separately bracketed critical-line roots. No off-line zero was detected in that rectangle.

The three meanings produce very different populations through 1000:

- three new carriers: \(13,14,12\);
- three total branches: \(10,11,9\);
- three internal states: \(5,7,4\).

Yet the first low-window roots are numerically controlled almost entirely by the earliest theta carriers, so the ternary cohorts at 100, 666 and 999 do not visibly separate the roots at the displayed precision once the splice-at-one convention is fixed.

Ternary branching does not establish a global golden shrinking bound. The escaping-quartet construction remains available in every model.

No proof of RH is obtained.

---

## 1. The isolated ternary hypothesis

This investigation tests exactly the named events
\[
100,
\qquad666,
\qquad999.
\]
The station 333 remains structurally distinguished by the earlier order-three bounce study, but it is not assigned a ternary cohort here because it was not part of the stated ternary set. The separate internal-splice report tests the broader hypothesis in which 333 is also promoted to a splice.

For each named event, use the continuous decimal depth
\[
d(q)=\log_{10}q,
\]
shifted by one under the reindexed splice-at-one convention. With independent local clock \(k_q\),
\[
g_{q,k_q}=\varphi^{-(d(q)+k_q)}.
\]
Chronological clocks use
\[
k_q=N-\log_{10}q,
\]
while equal-local-ticks schedules use \(k_q=N\).

The depth interpolation and clock laws are explicit diagnostics, not already-derived TTI dynamics.

## 2. Interpretation A — three new carriers

Under this reading, each named event contributes a cohort of size three:
\[
M_{100}=M_{666}=M_{999}=3.
\]
At 100, this replaces the earlier cohort assignment. The later two events add new three-carrier blocks.

The totals through 1000 are:

| Splice-at-one convention | Carrier total |
|---|---:|
| Zeroth seed | 13 |
| Reindexed Fibonacci | 14 |
| Boundary only | 12 |

This is the literal population reading of “each splice creates three.” It departs from the earlier Fibonacci cohort at 100 and therefore requires a rule explaining why these three events use fixed ternary multiplicity while the other decimal events use Fibonacci multiplicity.

## 3. Interpretation B — three total branches

One incoming path may be counted as one of the three outgoing paths. The net increase is then
\[
3-1=2.
\]
The finite theta cohort representing new carriers has size two:
\[
M_{100}=M_{666}=M_{999}=2.
\]

The resulting totals are:

| Splice-at-one convention | Carrier total |
|---|---:|
| Zeroth seed | 10 |
| Reindexed Fibonacci | 11 |
| Boundary only | 9 |

This interpretation matches the ordinary graph-theoretic meaning of a ternary fork: one incoming edge, three outgoing edges and two additional branches. Whether TTI’s population variable counts total outgoing paths or newly produced descendants must be fixed before choosing between this model and the three-new model.

## 4. Interpretation C — three states of one carrier

The number three may count internal states rather than descendants. The natural finite symmetry is
\[
\mathbb Z_3=
\{1,\omega,\omega^2\},
\qquad
\omega=e^{2\pi i/3}.
\]
Its complex state space decomposes as
\[
\mathbb C^3
=
\mathbf1\oplus\chi\oplus\bar\chi.
\]
The character identity
\[
1+\omega+\omega^2=0
\]
means that a completely symmetric scalar trace retains only the invariant mean channel. The two nontrivial phase channels cancel unless a state-dependent coupling distinguishes them.

Consequently, this interpretation adds no theta carriers by itself. Carrier totals stay at the splice-at-one values:

| Splice-at-one convention | Carrier total |
|---|---:|
| Zeroth seed | 5 |
| Reindexed Fibonacci | 7 |
| Boundary only | 4 |

This is not an assertion that the nontrivial \(\mathbb Z_3\) states are physically absent. It says that a scalar completed function cannot see them without a declared coupling or matrix-valued completion.

## 5. Finite completed functions

For the population-changing models, assign every cohort a consecutive theta block \(B\) and define
\[
\Psi_N(x)
=
\sum_B(1-g_B)
\sum_{m\in B}e^{-\pi m^2x}.
\]
For the state-only model, retain the original scalar carrier blocks; the two nontrivial \(\mathbb Z_3\) channels are not inserted without a coupling.

In every case set
\[
\boxed{
\Xi_N(s)
=
\frac12+
\frac{s(s-1)}2
\int_1^\infty
\Psi_N(x)
\left(x^{s/2}+x^{(1-s)/2}\right)
\frac{dx}{x}.}
\]

Each function is entire and obeys
\[
\Xi_N(s)=\Xi_N(1-s),
\qquad
\Xi_N(\bar s)=\overline{\Xi_N(s)}.
\]
Every fixed carrier coefficient tends to one along cofinal clock schedules, so each scalar family converges locally uniformly to \(\xi\).

## 6. Finite-window zero counts

All nine population scenarios under both schedules produced:

| Cutoff | Total zeros | Critical-line roots | Off-line detected |
|---:|---:|---:|---:|
| 14 | 2 | 2 | 0 |
| 20 | 2 | 2 | 0 |
| 30 | 4 | 4 | 0 |
| 40 | 3 | 3 | 0 |

At cutoff \(N=14\), chronological roots are determined by the splice-at-one convention:

| Origin convention | First roots |
|---|---|
| Zeroth seed | 14.76039167, 16.80619230 |
| Reindexed Fibonacci | 14.45533746, 17.69711280 |
| Boundary only | 14.76039167, 16.80619230 |

Changing “three new” to “three total” or “three states” does not change these displayed values. This is not an exact equality of the completed functions. The ternary carriers begin at theta indices whose factors are already extremely small at \(x\ge1\), so their differences fall below the displayed low-window sensitivity.

A model intended to make ternary branching control low zeros would need a derived coupling to low theta modes, not merely more high-index carriers.

## 7. Relation to the earlier three-station model

The previous internal-splice comparison found a suggestive match: under the reindexed splice-at-one convention, the 1000 cohort has
\[
F_4=3
\]
carriers, one for each of 333, 666 and 999. The present hypothesis is different. It assigns ternary behavior to 100, 666 and 999, so it does not coincide with the three-face decomposition of 1000.

The overlap at 666 and 999 is compatible, but the inclusion of 100 and exclusion of 333 require an additional TTI principle. Arithmetic alone does not identify why precisely these three events share a branching order.

## 8. Why ternary symmetry does not force RH

A \(\mathbb Z_3\) decomposition can cancel linear phase sums through
\[
1+\omega+\omega^2=0.
\]
That cancellation does not force the horizontal zero norm to vanish. Quantities built from squared displacement remain nonnegative and insensitive to phase cancellation.

More directly, every completed family can still be multiplied by
\[
P_N(z)=
\left(1-\frac{z^2}{(1/4+i\varphi^N)^2}\right)
\left(1-\frac{z^2}{(1/4-i\varphi^N)^2}\right),
\qquad z=s-\frac12.
\]
The factor is even and real, tends to one on every compact set and preserves the same xi limit. It adds an off-line quartet with
\[
\left|\Re s-\frac12\right|=\frac14
\]
at height \(\varphi^N\).

Thus neither ternary population nor \(\mathbb Z_3\) phase cancellation supplies uniform global zero control.

## 9. Determination

The three readings answer different questions:

- **three new carriers** is the strongest population growth;
- **three total branches** is the natural net-growth interpretation of a ternary fork;
- **three internal states** introduces \(\mathbb Z_3\) structure but is invisible to the scalar completion without a new coupling.

All are analytically coherent. All preserve the completion symmetries. All pass the bounded zero window tested here. None yields a global shrinking theorem.

The decisive next question is therefore not numerical but structural:
\[
\boxed{
\text{Does “three” count descendants, outgoing branches, or internal states?}
}
Until TTI fixes that ontology and its coupling to the completed kernel, the ternary pattern changes multiplicity but cannot determine the xi zeros.

No proof of RH is obtained.
