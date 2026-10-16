# Golden-delay completions including the splice at one

**Corrected twelfth-stage investigation — 14 October 2026**  
**Question:** TTI places a splice at \(1\) as well as at \(10,100,1000,\ldots\). How should that splice enter the finite completed functions, and does any coherent interpretation force a golden shrinking bound for their zeros?  
**Companion program:** `scripts/research-rss-golden-catchup-completions.py`  
**Machine-readable results:** `docs/rh/rss-golden-catchup-completion-results.json`

## Verdict

The preceding per-splice construction still began one threshold too late. Its levels were \(10,100,1000,\ldots\), whereas the TTI sequence also contains a splice at \(1\). Adding it creates a genuine indexing choice: the current framework does not say whether \(1\) is a zeroth seed before the published Fibonacci count, the first member of a reindexed Fibonacci count, or a geometric boundary that carries delay without creating a new theta carrier.

All three coherent readings have therefore been constructed and tested:

1. **Zeroth seed:** \(1\) receives one seed carrier, while \(10,100,1000\) retain the existing \(F_1,F_2,F_3\) labels.
2. **Reindexed Fibonacci:** \(1,10,100,1000\) receive \(F_1,F_2,F_3,F_4\), shifting every later label.
3. **Boundary only:** \(1\) has a golden delay but no analytic carrier; \(10,100,1000\) retain the existing labels.

Each carrier-bearing splice has its own golden depth and local return clock. Every resulting finite completed function is entire, preserves the functional equation and conjugation, and converges locally uniformly to \(\xi\) along cofinal clock schedules.

For every indexing model, two clock schedules were tested in
\[
0\le\Re s\le1,
\qquad
0\le\Im s\le30.
\]
At decimal cutoffs \(N=14,20,30,40\), all six model/schedule paths produced total zero counts
\[
2,2,4,3.
\]
Every total matched the independently bracketed critical-line root count, so no off-line zero was detected in the tested rectangle. The indexing choices changed finite carrier counts and moved root ordinates, but not the bounded-window verdict.

None of the three models proves a global shrinking strip. An even real entire factor can still add an off-line quartet at height \(\varphi^N\), tend to one on every fixed compact set and preserve both xi symmetries. Its horizontal displacement remains \(1/4\). Including the splice at \(1\) therefore corrects the finite bookkeeping but does not remove the escaping-zero obstruction.

No proof of RH is obtained.

---

## 1. The splice at one: three coherent readings

Write the decimal level as
\[
\ell=0,1,2,3,\ldots,
\qquad
q_\ell=10^\ell.
\]
Thus
\[
q_0=1,
\quad q_1=10,
\quad q_2=100,
\quad q_3=1000.
\]

Each active level has a depth index \(d_\ell\), local clock \(k_\ell\ge0\), remaining gap
\[
\boxed{
g_{\ell,k_\ell}=\varphi^{-(d_\ell+k_\ell)},}
\]
and admitted fraction
\[
a_{\ell,k_\ell}=1-g_{\ell,k_\ell}.
\]

The ambiguity concerns the cohort size and depth index assigned at \(\ell=0\).

### 1.1 Model A — zeroth seed splice

Give the splice at \(1\) one seed carrier:
\[
M_0=1,
\qquad d_0=0.
\]
Keep the existing labels after it:
\[
M_\ell=F_\ell,
\qquad d_\ell=\ell,
\qquad \ell\ge1.
\]
Then the sequence of cohort sizes through 1000 is
\[
1,1,1,2,
\]
with total
\[
1+F_1+F_2+F_3=5.
\]

This interpretation preserves every previously published Fibonacci label at \(10,100,1000\). Its cost is that the splice at \(1\) is a special seed rather than an ordinary member of the same recurrence.

At birth, its formal gap is \(\varphi^0=1\), so its carrier is initially unadmitted. Once its independent clock advances, its gap becomes \(\varphi^{-k_0}\).

### 1.2 Model B — reindex every Fibonacci splice

Make \(1\) the first ordinary Fibonacci splice:
\[
M_\ell=F_{\ell+1},
\qquad
d_\ell=\ell+1.
\]
The cohort sizes at
\[
1,10,100,1000
\]
are then
\[
F_1,F_2,F_3,F_4=1,1,2,3,
\]
with total
\[
F_1+F_2+F_3+F_4=7.
\]

This is the cleanest recurrence: no special seed rule is required. But it changes the existing interpretation of 1000 from the third Fibonacci splice with multiplicity \(F_3=2\) to the fourth with multiplicity \(F_4=3\). Every earlier statement depending on the old indexing would have to be re-audited.

### 1.3 Model C — boundary splice without a carrier

Treat \(1\) as a genuine geometric splice or seam with
\[
d_0=0
\]
but assign it no theta carrier:
\[
M_0=0.
\]
For later levels retain
\[
M_\ell=F_\ell,
\qquad d_\ell=\ell,
\qquad \ell\ge1.
\]
The carrier sizes through 1000 remain
\[
F_1,F_2,F_3=1,1,2,
\]
with total \(4\).

This preserves all existing Fibonacci arithmetic. Analytically, however, a boundary without a carrier or coupling cannot alter the completed function or its zeros. For the splice at \(1\) to matter spectrally under this interpretation, TTI must specify how that boundary acts on the later carriers.

### 1.4 What is fixed and what remains open

The existence of the threshold sequence
\[
1,10,100,1000,\ldots
\]
is now included. What remains unselected is the role of \(1\) in the Fibonacci population law. The three totals through 1000 are therefore
\[
\boxed{5,\,7,\,4}
\]
for the zeroth-seed, reindexed and boundary-only models respectively.

The numerical comparison below does not choose among them. It determines which conclusions are robust under all three.

## 2. Finite completed theta families

For any selected model, order its carrier-bearing cohorts by decimal level. Give each cohort a consecutive finite block \(B_\ell\) of positive theta indices, with
\[
|B_\ell|=M_\ell.
\]
The blocks partition
\[
\{1,\ldots,C_N\},
\]
where \(C_N\) is the finite carrier count through decimal level \(N\).

Define
\[
\boxed{
\Psi_{N,\mathbf k}(x)=
\sum_{\substack{0\le\ell\le N\\M_\ell>0}}
\left(1-\varphi^{-(d_\ell+k_\ell)}\right)
\sum_{m\in B_\ell}e^{-\pi m^2x}.}
\]
The corresponding completed function is
\[
\boxed{
\Xi_{N,\mathbf k}(s)=
\frac12+
\frac{s(s-1)}2
\int_1^\infty
\Psi_{N,\mathbf k}(x)
\left(x^{s/2}+x^{(1-s)/2}\right)
\frac{dx}{x}.}
\]

### 2.1 Exact completion properties

For every finite cutoff, indexing model and clock vector:

1. The carrier is a finite sum of exponentially decaying functions, so \(\Xi_{N,\mathbf k}\) is entire.
2. The two powers exchange under \(s\mapsto1-s\), giving
   \[
   \Xi_{N,\mathbf k}(s)=\Xi_{N,\mathbf k}(1-s).
   \]
3. All coefficients are real, giving
   \[
   \Xi_{N,\mathbf k}(\bar s)=\overline{\Xi_{N,\mathbf k}(s)}.
   \]
4. In every model, the carrier blocks eventually cover every positive integer theta index. If every fixed carrier-bearing clock tends to infinity, its coefficient tends to one. Exponential domination then gives
   \[
   \Xi_{N,\mathbf k}\longrightarrow\xi
   \]
   locally uniformly.

The association of Fibonacci cohorts with consecutive theta modes is an explicit analytic realization, not a theorem identifying TTI descendants with classical theta indices.

## 3. The two clock schedules

The vector of local clocks is not yet tied to one TTI time law. Two cofinal schedules expose the consequences.

### 3.1 Chronological schedule

Set
\[
k_\ell=N-\ell.
\]
For the zeroth-seed and boundary-only models, \(d_\ell=\ell\) on every carrier-bearing cohort, so
\[
g_{\ell,k_\ell}=\varphi^{-N}.
\]
The histories synchronize despite their different births.

For the reindexed model, \(d_\ell=\ell+1\), so
\[
g_{\ell,k_\ell}=\varphi^{-(N+1)}.
\]
It also synchronizes, but one golden step further advanced.

Thus a single scalar gap can reappear along a special chronological diagonal. It is not the general multi-clock state.

### 3.2 Equal-local-ticks schedule

Set
\[
k_\ell=N
\]
for every active level. Then the different initial depths remain visible:
\[
g_{\ell,k_\ell}=\varphi^{-(d_\ell+N)}.
\]
This schedule is a diagnostic comparison, not a derived physical chronology.

## 4. Finite-window zero counts

The verifier uses 256-point Gauss–Legendre quadrature after setting \(x=e^u\). It computes the argument-principle winding number around
\[
0\le\Re s\le1,
\qquad
0\le\Im s\le30,
\]
and independently brackets all sign-changing critical-line roots.

### 4.1 Counts common to all models

Every one of the six model/schedule combinations produced:

| Decimal cutoff \(N\) | Total zeros | Critical-line roots | Off-line detected |
|---:|---:|---:|---:|
| 14 | 2 | 2 | 0 |
| 20 | 2 | 2 | 0 |
| 30 | 4 | 4 | 0 |
| 40 | 3 | 3 | 0 |

The changing count \(2,2,4,3\) again rules out a simple one-to-one trajectory for all finite roots.

### 4.2 Carrier counts differ

| \(N\) | Zeroth seed | Reindexed Fibonacci | Boundary only |
|---:|---:|---:|---:|
| 14 | 987 | 1,596 | 986 |
| 20 | 17,711 | 28,656 | 17,710 |
| 30 | 2,178,309 | 3,524,577 | 2,178,308 |
| 40 | 267,914,296 | 433,494,436 | 267,914,295 |

Most high-index theta terms are already below floating range for \(x\ge1\), so these enormous formal differences do not create comparable computational cost.

### 4.3 The indexing changes root positions

At \(N=14\) under the chronological schedule:

- zeroth seed: \(14.76039167,\ 16.80619230\);
- reindexed Fibonacci: \(14.45533746,\ 17.69711280\);
- boundary only: \(14.76039167,\ 16.80619230\).

The boundary-only and zeroth-seed paths agree here because their chronological carrier coefficients are equal and their one-carrier cutoff difference is exponentially negligible. The reindexed model is one golden step further advanced and visibly shifts the roots.

For all models and schedules, every counted root in the tested window lies on
\[
\Re s=\frac12
\]
to the resolution of the calculation. These are numerical counts, not interval-certified global results.

## 5. A candidate vector-delay bound

For a selected model and clock state, define the largest carrier-bearing residual gap
\[
G_{N,\mathbf k}
=
\max_{\substack{0\le\ell\le N\\M_\ell>0}}
\varphi^{-(d_\ell+k_\ell)}.
\]
A natural global proposal would be
\[
\left|\Re\rho_{N,\mathbf k}-\frac12\right|
\le C G_{N,\mathbf k}
\]
for every stage zero.

All six tested paths satisfy this in the bounded rectangle because the observed horizontal displacement is zero. But local convergence controls fixed compact sets only; it does not control zeros whose heights grow with the cutoff.

## 6. Why the splice at one cannot establish the global bound

For a selected indexing model and cofinal clock schedule, write the completed sequence as \(\Xi_N\). Define
\[
P_N(z)=
\left(1-\frac{z^2}{(1/4+i\varphi^N)^2}\right)
\left(1-\frac{z^2}{(1/4-i\varphi^N)^2}\right)
\]
and
\[
\widehat\Xi_N(s)
=
\Xi_N(s)P_N\!\left(s-\frac12\right).
\]

The modified functions remain entire and preserve
\[
\widehat\Xi_N(s)=\widehat\Xi_N(1-s),
\qquad
\widehat\Xi_N(\bar s)=\overline{\widehat\Xi_N(s)}.
\]
On every fixed compact set,
\[
P_N(z)=1+O(\varphi^{-2N}),
\]
so the local limit remains \(\xi\).

Nevertheless, every stage contains the quartet
\[
s=\frac12\pm\frac14\pm i\varphi^N,
\]
whose horizontal displacement is always
\[
\left|\Re s-\frac12\right|=\frac14.
\]
The quartet escapes above every fixed-height test and violates every shrinking bound as \(N\to\infty\).

This countermodel applies equally to all three interpretations of the splice at \(1\). It proves that the following package is insufficient:

- the correct threshold sequence beginning at \(1\);
- Fibonacci carrier blocks under any of the three indexings;
- independent golden clocks;
- entire completion;
- exact functional and conjugation symmetries;
- local uniform convergence to \(\xi\); and
- successful zero counts in every fixed finite window.

## 7. What is now required

A genuine theorem needs:

1. a TTI rule selecting whether \(1\) is a zeroth seed, reindexed Fibonacci splice or carrier-free boundary;
2. a derived relationship between every local clock and global evolution;
3. a theorem converting the vector of residual gaps into horizontal zero displacement;
4. zero counts uniform in both cutoff and height; and
5. exclusion of escaping off-line quartets with multiplicity control.

If these conditions yielded
\[
\left|\Re\rho_N-\frac12\right|\le C G_N,
\qquad G_N\to0,
\]
then Rouché’s theorem around each limiting xi zero would force that zero onto the critical line. The missing global estimate is therefore RH-strength.

## 8. Final determination

Adding the splice at \(1\) is necessary for fidelity to TTI. It does not give one automatic analytic model; it creates three coherent possibilities with different finite carrier totals:
\[
\boxed{5,\ 7,\ 4\text{ carriers through }1000.}
\]

All three admit finite, entire, symmetry-preserving completed theta families. All six tested indexing/schedule paths have only critical-line zeros through height 30 at the selected cutoffs. The splice-at-one choice changes finite root ordinates but not the present verdict.

The robust conclusion is
\[
\boxed{
\text{The splice at one changes the finite indexing, not the need for global zero control.}
}
\]

No proof of RH is obtained.

## 9. Critical-energy application note

The later [critical Chebyshev-energy theorem](./rss-critical-chebyshev-energy.md), if proved, establishes RH for the exact limiting \(\xi\). It does not prove that each finite golden-delay completion is real-rooted, choose among the three splice-at-one conventions, derive either clock schedule or exclude escaping zeros from every approximating family. Those remain separate finite-family questions.

The [spin–colour audit](./rss-energy-spin-colour.md) likewise does not license multiplying theta carriers by physical state counts. Internal degeneracy and new spectral descendants have different zero and seam effects and must be modeled separately.

## 10. Universal-π application note

The later [universal-π audit](./rss-universal-pi-coupling.md) shows that every finite theta completion already carries the exact coupling \(e^{-\pi n^2x}\) and inherits the Poisson self-duality \(\vartheta(x)=x^{-1/2}\vartheta(1/x)\). This explains completion symmetry but does not strengthen local uniform convergence into global zero control. Universal \(\pi\)-coupling therefore does not remove the escaping-quartet obstruction.

