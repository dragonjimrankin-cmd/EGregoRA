# One hundred rounds against the dephased Mellin obstruction

**Forty-third-stage investigation — 15 October 2026**  
**Question:** Can established positivity, symmetry, dephasing, entropy or flow properties bootstrap finitely many Mellin rungs to the next rung?  
**Companion program:** `scripts/research-rss-hundred-round-mellin-closure-search.py`  
**Machine-readable results:** `docs/rh/rss-hundred-round-mellin-closure-search-results.json`

## Verdict

One hundred declared research rounds were completed. None proved a new Mellin rung or RH.

The rounds crossed ten ladder transitions with ten established mechanisms:

1. positivity;
2. probability normalization;
3. horizontal reflection symmetry;
4. logarithmic CPTP dephasing;
5. finite relative entropy;
6. all fixed logarithmic moments;
7. the Fisher natural-gradient flow;
8. unit-phase invariance;
9. positive trace-class realization;
10. strict entropy and moment convexity.

Every attempted finite bootstrap has an exact separator countermodel. For any finite \(J\ge1\), choose
\[
\boxed{
\frac1{2(J+1)}<\eta_J<\frac1{2J}
}
\]
and define
\[
Q_{\eta_J}
=
\frac12\left(p_{\eta_J}+p_{-\eta_J}\right).
\]
Then
\[
A_j(Q_{\eta_J})<\infty
\qquad(1\le j\le J),
\]
but
\[
A_{J+1}(Q_{\eta_J})=\infty.
\]
The state retains all ten properties listed above. Thus no finite collection of already established rungs, supplemented only by those structural properties, can force the next rung.

This is a genuine no-go theorem for the tested bootstrap class, not a proof that RH is unreachable. A successful argument must use new arithmetic information special to the actual \(\xi\) divisor and strong enough to rule out every separator state.

The requested “further one hundred rounds after success” were not triggered, because the first hundred did not succeed. Separate conversational turns cannot be generated autonomously; this report records one hundred mathematical search rounds completed in the present turn.

RH remains open.

---

## 1. Search protocol

The Stage-42 ladder is
\[
A_j
=
\sum_{n=p^k}P_\xi(n)n^{1-1/j}.
\]
Its \(j\)-th rung is finite for one reflected component exactly when
\[
2\eta<\frac1j.
\]

Each search round attempted an implication of the form
\[
A_1,\ldots,A_J<\infty
\quad+
\text{one established mechanism}
\quad\Longrightarrow
the subset \(A_{J+1}<\infty\).
\]

Ten values \(J=1,\ldots,10\) were crossed with the ten mechanisms, giving one hundred routes. The machine ledger records the attempted transition, mechanism, separator displacement and exact failure reason for every round.

The finite range of the census is not the source of the no-go conclusion. The separator formula works for every \(J\ge1\), proving the general statement analytically.

## 2. Separator proof

The slow branch of \(Q_\eta\) contributes
\[
\frac{M(1+1/j-2\eta)}{M(2-2\eta)}
\]
to \(A_j\). This is finite exactly when
\[
1+\frac1j-2\eta>1,
\]
or
\[
2\eta<\frac1j.
\]

For \(\eta_J\) in the declared interval,
\[
2\eta_J<\frac1J.
\]
If \(j\le J\), then \(1/j\ge1/J\), so
\[
2\eta_J<\frac1j
\]
and every earlier rung is finite.

On the other hand,
\[
2\eta_J>\frac1{J+1},
\]
so the \((J+1)\)-st numerator reaches or crosses the pole boundary and diverges. Positivity prevents cancellation.

Therefore
\[
\boxed{
A_1,\ldots,A_J<\infty
\not\Longrightarrow
A_{J+1}<\infty
}
\]
inside the reflected von-Mangoldt family, for every finite \(J\).

## 3. Why each retained mechanism fails to bridge the gap

### 3.1 Positivity

The separator is already positive. Positivity prevents cancellation of its divergent slow branch; it does not make the branch decay faster.

### 3.2 Normalization

Every \(p_\eta\) has mass one. Trace control is an \(L^1\) statement and gives no moment of an unbounded power of \(n\).

### 3.3 Reflection symmetry

The state contains \(\eta\) and \(-\eta\) equally. Reflection cancels signed horizontal means but doubles the presence of \(|\eta|\). The slow branch remains positive.

### 3.4 Logarithmic dephasing

Dephasing removes ordinate phases and off-diagonal matrix entries. It leaves \(p_{-\eta}\), and hence its tail exponent, exactly unchanged.

### 3.5 Finite relative entropy

For every fixed \(|\eta|<1/2\), the separator has finite relative entropy to \(p_0\). Relative entropy permits polynomially unbounded likelihood ratios on sufficiently light tails.

### 3.6 All logarithmic moments

Every fixed sum involving \((\log n)^k\) converges when \(|\eta|<1/2\). Powers of \(\log n\) do not control any fixed positive power \(n^\theta\) without a quantitative analytic-radius estimate.

### 3.7 Fisher natural-gradient flow

The flow \(\eta(t)=\eta(0)e^{-t}\) eventually moves the separator inside any fixed rung. It does so by changing the state. No theorem identifies that moved state with the original \(\xi\) divisor.

### 3.8 Unit phases

Multiplication by \(e^{-i\tau\log n}\), or any diagonal unit phase, preserves the probability tail exactly.

### 3.9 Trace-class realization

Rank-one feature states and their convex mixtures are trace class. Relative domination by the much lighter central diagonal is not implied by trace class.

### 3.10 Strict convexity

Strict convexity detects that \(Q_\eta\ne p_0\). It does not force its divergence functional to vanish without a separately proved equality or minimization principle tied to the fixed divisor.

## 4. Why interpolation does not cross the next rung

Mellin moments are log-convex in their real exponent where finite. Hölder interpolation can fill the interval between two already finite exponents. It cannot continue across the abscissa of convergence.

For the separator, the abscissa is a genuine singular boundary. Earlier rungs approach it from the convergent side, while the next rung lies on or beyond it. Applying interpolation beyond the endpoint would assume the very moment being sought.

This rules out a common apparent shortcut:
\[
A_J<\infty
\quad\text{and convexity}
\quad\not\Longrightarrow
A_{J+1}<\infty.
\]

## 5. Standard arithmetic routes screened

The census also rechecked ten possible sources of the missing arithmetic input.

| Route | Result | Gate |
|---|---|---|
| Linear completed explicit formula | Insufficient | Linear holomorphic divisor sums do not produce the nonlinear dephased amplitude statistic |
| Absolute value of the explicit formula | Invalid transfer | An absolute bound on a signed sum is not a zero-by-zero positive diagonal identity |
| Quadratic explicit formula | Missing input | Dephasing constructs the diagonal, but no same-\(\xi\) arithmetic formula controls its global moments |
| Weil positivity | RH-equivalent | Full admissible positivity is not an established premise |
| Critical Chebyshev energy | RH-equivalent | Its all-scale estimate already excludes every right-half-strip zero |
| Li coefficients | RH-equivalent | All-index positivity is another RH criterion |
| Nyman–Beurling closure | RH-equivalent | The required closure limit is equivalent to RH |
| Zero-density estimates | Insufficient | They may permit one exceptional zero; one is enough for divergence |
| Classical zero-free region near \(1\) | Insufficient | Its boundary approaches \(1\) with height and supplies no fixed central strip |
| Finite-height verification | Finite only | It cannot exclude an exceptional zero above the verified height |

No route in this list supplies \(A_2<\infty\) without importing an unproved or RH-equivalent assertion.

## 6. What a successful next input must look like

The separator theorem sharply restricts the form of useful new information. It must be genuinely arithmetic and special to the actual completed zeta function. Sufficient examples would include:

1. a proof of
   \[
   A_2<\infty
   \]
   followed by a new same-\(\xi\) recurrence taking \(A_J\) to \(A_{J+1}\);
2. analytic continuation of the dephased Mellin transform through every point
   \[
   z_J=-1+1/J;
   \]
3. an arithmetic identity forcing
   \[
   P_\xi=p_0;
   \]
4. a new positive explicit formula whose prime side is finite and whose zero side dominates one complete nontrivial Mellin rung.

None has been established here.

## 7. Why repeating the same mechanisms cannot help

The separator is parametric in \(J\). After any finite number of successful lower-rung estimates, choose a smaller positive \(\eta\) between the next two thresholds. All previous estimates and structural properties survive, while the next target fails.

Accordingly, simply running more combinations of normalization, dephasing, entropy, phase averaging or interpolation cannot converge to RH. A future round is meaningful only if it introduces a new arithmetic premise not shared by the separator family.

This is the principal result of the hundred-round search: it prevents further work from mistaking repeated structural recombination for progress on the arithmetic boundary.

## Evidence boundary

Proved here:

- completion of one hundred declared finite-bootstrap search rounds;
- an exact separator for every tested route;
- a general separator theorem for every finite Mellin rung;
- insufficiency of the ten retained structural mechanisms, separately and collectively;
- failure of interpolation to cross the true Mellin abscissa;
- classification of ten standard arithmetic routes by their present gate.

Not proved:

- \(A_2<\infty\) for the actual \(\xi\) mixture;
- a same-\(\xi\) recurrence between Mellin rungs;
- any new global zero-free strip;
- the uniform frame bound;
- RH.

## Final status

The hundred rounds did not overcome the obstruction. They proved that the obstruction cannot be crossed by finite bootstrapping from the established structural package:
\[
\boxed{
\forall J\ge1,
\quad
\exists\eta_J:
\quad
A_1,\ldots,A_J<\infty,
\qquad
A_{J+1}=\infty.
}
\]
A successful continuation now requires genuinely new arithmetic information tied to the actual \(\xi\) divisor. RH remains open.

**Prime-pair follow-up:** [`rss-prime-pair-splice-link.md`](./rss-prime-pair-splice-link.md) checks whether the \((101,101)\) diagonal can supply the missing same-\(\xi\) closure. It isolates the exact all-scale energy criterion and shows why the single prime event does not establish it.
