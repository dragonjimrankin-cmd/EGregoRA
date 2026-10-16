# What if 1000 splices into four?

**Fifteenth-stage investigation — 14 October 2026**  
**Question:** What changes if the event at \(1000\) is a quaternary splice?  
**Companion program:** `scripts/research-rss-quaternary-splice-at-1000.py`  
**Machine-readable results:** `docs/rh/rss-quaternary-splice-at-1000-results.json`

## Verdict

The word *four* again has three inequivalent meanings:

1. the event produces **four new carriers**;
2. one incoming path becomes **four total outgoing branches**, producing a net cohort of three;
3. the existing channel acquires **four internal states**, without a scalar population increase.

All three were tested in both requested scopes: first at 1000 alone, and then after each of the three ternary models at 100, 666 and 999. Crossing these choices with the zeroth-seed, fully reindexed and boundary-only splice-at-one conventions gives 36 population scenarios. Chronological and equal-local-ticks schedules give 72 diagnostic paths.

Every path defines a finite entire theta completion with the xi functional equation and conjugation symmetry. In
\[
0\le\Re s\le1,
\qquad
0\le\Im s\le30,
\]
all 72 paths gave zero counts
\[
2,2,4,3
\]
at cutoffs \(N=14,20,30,40\), with every argument-principle total matched by separately bracketed critical-line roots. No off-line zero was detected in that rectangle.

The main structural result is more specific than the numerical result. Under the fully reindexed splice-at-one convention, the existing cohort at 1000 is
\[
F_4=3.
\]
That is exactly the **net new cohort** created when one incoming path becomes four total outgoing paths:
\[
4-1=3.
\]
Thus the “four total branches” reading requires no population change at 1000 in the reindexed model. This is a genuine arithmetic fit. It does not determine the ontology of the four branches or prove a statement about xi zeros.

All 72 paths still admit the escaping-quartet stress family. A quaternary splice therefore does not establish a global shrinking strip and does not prove RH.

---

## 1. Two scopes

### 1.1 The 1000 event alone

The first scope returns to the three splice-at-one baselines and alters only the cohort at 1000. Their original totals through 1000 are
\[
5,7,4
\]
for the zeroth-seed, reindexed and boundary-only conventions.

### 1.2 After ternary events

The second scope retains each meaning previously tested at 100, 666 and 999:

- three new carriers at each event;
- three total branches, represented by net cohorts of two;
- three internal states, with no uncoupled scalar population increase.

The event at 1000 is then assigned each of the three meanings of four. This produces nine ternary–quaternary combinations under each origin convention.

The station 333 remains outside the named ternary set in this combined hypothesis. Its possible role continues to be covered by the separate internal-station comparison.

## 2. Independent depth and clock at 1000

The 1000 event has decimal coordinate
\[
d(1000)=\log_{10}(1000)=3.
\]
Under the reindexed splice-at-one convention its depth is shifted to four. Its golden gap is
\[
g_{1000,k}=\varphi^{-(d(1000)+k_{1000})}.
\]

Chronological clocks use
\[
k_{1000}=N-3,
\]
while equal-local-ticks schedules use
\[
k_{1000}=N.
\]
The ternary events retain their own logarithmic depths and independent clocks. No global delay is introduced.

These clock laws remain declared diagnostic interpolations rather than derived TTI dynamics.

## 3. Interpretation A — four new carriers

This reading replaces the existing cohort at 1000 with
\[
M_{1000}=4.
\]
For the 1000-only scope, the totals become:

| Splice-at-one convention | Carriers through 1000 |
|---|---:|
| Zeroth seed | 7 |
| Reindexed Fibonacci | 8 |
| Boundary only | 6 |

With the earlier ternary models retained, the totals are:

| Ternary meaning at 100/666/999 | Zeroth seed | Reindexed | Boundary only |
|---|---:|---:|---:|
| Three new carriers | 15 | 15 | 14 |
| Three total branches | 12 | 12 | 11 |
| Three internal states | 7 | 8 | 6 |

No standard Fibonacci number equals four. A literal four-carrier cohort is therefore an explicit exception to the existing Fibonacci population law unless another construction derives it.

## 4. Interpretation B — four total branches

If the incoming path is one of the four outgoing paths, the net increase is
\[
4-1=3.
\]
The replacement cohort is therefore
\[
M_{1000}=3.
\]

For the 1000-only scope:

| Splice-at-one convention | Carriers through 1000 |
|---|---:|
| Zeroth seed | 6 |
| Reindexed Fibonacci | 7 |
| Boundary only | 5 |

For the combined scope:

| Ternary meaning at 100/666/999 | Zeroth seed | Reindexed | Boundary only |
|---|---:|---:|---:|
| Three new carriers | 14 | 14 | 13 |
| Three total branches | 11 | 11 | 10 |
| Three internal states | 6 | 7 | 5 |

This interpretation has the cleanest fit with the reindexed sequence:
\[
1,10,100,1000
\longleftrightarrow
F_1,F_2,F_3,F_4
=
1,1,2,3.
\]
At 1000, the existing \(F_4=3\) cohort already counts the three additional paths needed for four total branches. In that convention the quaternary statement changes the interpretation of the cohort but not its size or scalar completed function.

The same fit does not occur in the zeroth-seed or boundary-only conventions, where the original 1000 cohort is \(F_3=2\).

## 5. Interpretation C — four internal states

A cyclic candidate is
\[
\mathbb Z_4=\{1,i,-1,-i\}.
\]
The regular state space decomposes as
\[
\mathbb C^4
=
\mathbf1\oplus\chi\oplus\chi^2\oplus\chi^3,
\]
and the character sum is
\[
1+i-1-i=0.
\]
A symmetric scalar trace retains the invariant mean channel; all nontrivial character channels cancel unless a state-dependent coupling distinguishes them.

Unlike the three-state case, four states do not uniquely select a group. The cyclic group \(\mathbb Z_4\), the Klein group \(\mathbb Z_2\times\mathbb Z_2\), and actions inherited from permutations of four states have different representation structures. Arithmetic multiplicity alone does not choose among them.

With no new scalar coupling, the baseline totals remain:

| Splice-at-one convention | Carriers through 1000 |
|---|---:|
| Zeroth seed | 5 |
| Reindexed Fibonacci | 7 |
| Boundary only | 4 |

In the combined scope they remain the totals of the selected ternary model:

| Ternary meaning at 100/666/999 | Zeroth seed | Reindexed | Boundary only |
|---|---:|---:|---:|
| Three new carriers | 13 | 14 | 12 |
| Three total branches | 10 | 11 | 9 |
| Three internal states | 5 | 7 | 4 |

These internal states may still be physically or spectrally meaningful. The narrower conclusion is that an uncoupled symmetric scalar completion cannot see them.

## 6. Finite completed functions

For each scalar population model, assign every cohort a consecutive theta block \(B\) and let its independent remaining gap be \(g_B\). Define
\[
\Psi_N(x)
=
\sum_B(1-g_B)
\sum_{m\in B}e^{-\pi m^2x}.
\]
Then set
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

Every finite member is entire and satisfies
\[
\Xi_N(s)=\Xi_N(1-s),
\qquad
\Xi_N(\bar s)=\overline{\Xi_N(s)}.
\]
Every fixed carrier coefficient tends to one along cofinal schedules, so each scalar family converges locally uniformly to \(\xi\).

## 7. Finite-window zero comparison

All 72 population/schedule paths produced:

| Cutoff | Total zeros | Critical-line roots | Off-line detected |
|---:|---:|---:|---:|
| 14 | 2 | 2 | 0 |
| 20 | 2 | 2 | 0 |
| 30 | 4 | 4 | 0 |
| 40 | 3 | 3 | 0 |

At \(N=14\), chronological roots again depend on the splice-at-one convention:

| Origin convention | First roots |
|---|---|
| Zeroth seed | 14.76039167, 16.80619230 |
| Reindexed Fibonacci | 14.45533746, 17.69711280 |
| Boundary only | 14.76039167, 16.80619230 |

At the displayed precision, changing the 1000 cohort from two to three or four does not move these low roots. Nor do the alternative ternary populations visibly separate them once the origin convention is fixed. The changed carriers occupy theta indices whose terms are already extremely small for \(x\ge1\).

This is numerical insensitivity, not equality of all the completed functions. The reindexed four-total and four-state scalar models are exactly coincident at 1000 because both retain a cohort of size \(F_4=3\); most other pairs differ, but below the displayed low-window precision.

The argument-principle calculations are numerical winding counts, not interval-certified global zero proofs.

## 8. The escaping-quartet test

For any completed family above, multiply by
\[
P_N(z)=
\left(1-\frac{z^2}{(1/4+i\varphi^N)^2}\right)
\left(1-\frac{z^2}{(1/4-i\varphi^N)^2}\right),
\qquad z=s-\frac12.
\]
The factor is even and real, tends to one on every compact set, and preserves the same xi limit and completion symmetries. It introduces zeros at
\[
s=\frac12\pm\frac14\pm i\varphi^N.
\]
Their fixed horizontal displacement is \(1/4\), while their heights escape every fixed numerical window.

Neither a four-way population fork nor cancellation among four internal phases excludes this quartet. Linear character cancellation also cannot force a quadratic horizontal zero residue to vanish.

## 9. Determination

The quaternary proposal produces one notable structural match:
\[
\boxed{
F_4=3=4-1.
}
\]
If the splice at one fully reindexes the Fibonacci hierarchy, then the existing 1000 cohort is already the exact net population required for one path to become four total branches. This makes the four-total reading more economical than the four-new reading.

It is still conditional. TTI must derive that cohorts count net descendants, establish why 1000 has a quaternary branching law, and specify how any internal four-state structure couples to the scalar or matrix-valued completion. It must also obtain uniform-in-height zero control.

The finite evidence is compatible with the proposal. It does not choose the proposal and does not prove RH.
