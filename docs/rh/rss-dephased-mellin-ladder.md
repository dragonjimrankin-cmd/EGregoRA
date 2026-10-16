# Attempting to overcome the global frame bound: the Mellin–Rényi ladder

**Forty-second-stage investigation — 15 October 2026**  
**Question:** Can the uniform estimate \(P_\xi\le Cp_0\) be replaced by weaker positive arithmetic statements that are easier to prove?  
**Companion program:** `scripts/research-rss-dephased-mellin-ladder.py`  
**Machine-readable results:** `docs/rh/rss-dephased-mellin-ladder-results.json`

## Verdict

The uniform \(L^\infty\) bound can be weakened substantially, but the weaker conditions are not presently provable.

Define the negative Mellin moments
\[
\boxed{
A_j
=
\sum_{n=p^k}P_\xi(n)n^{1-1/j},
\qquad j=1,2,3,\ldots.
}
\]
Then
\[
\boxed{
\mathrm{RH}
\iff
A_j<\infty
\text{ for every integer }j\ge1.
}
\]
The first rung is automatic:
\[
A_1=\sum_nP_\xi(n)=1.
\]
The first nontrivial rung is
\[
A_2
=
\sum_nP_\xi(n)\sqrt n<\infty.
\]
It would exclude every zero with
\[
\left|\Re\rho-\frac12\right|\ge\frac14,
\]
so it would establish the global zero-free strip
\[
\frac14<\Re\rho<\frac34.
\]
That statement is already unproved. Each successive rung shrinks the permitted strip:
\[
A_j<\infty
\quad\Longrightarrow\quad
\left|\Re\rho-\frac12\right|<\frac1{2j}.
\]

There is an equivalent Rényi ladder. With
\[
R(n)=\frac{P_\xi(n)}{p_0(n)},
\]
put
\[
\mathcal R_q
=
\sum_np_0(n)R(n)^q.
\]
Then
\[
\boxed{
\mathrm{RH}
\iff
R\in L^q(p_0)
\text{ for every finite }q>1.
}
\]

Thus uniform domination is not necessary. A countable family of finite positive moments would suffice. However, normalization and logarithmic dephasing supply only \(A_1\). They do not establish \(A_2\), let alone the full shrinking-strip ladder.

The attempted reduction therefore sharpens the remaining arithmetic task but does not prove it. RH remains open.

---

## 1. Exact Mellin threshold of one off-line component

For a reflected displacement \(\eta>0\), the slow-decay component is
\[
p_{-\eta}(n)
=
\frac{\Lambda(n)n^{-2+2\eta}}
{M(2-2\eta)}.
\]
Its contribution to \(A_j\) is
\[
\frac1{M(2-2\eta)}
\sum_n
\Lambda(n)
 n^{-1-1/j+2\eta}.
\]
Equivalently, when convergent, it is
\[
\frac{M(1+1/j-2\eta)}{M(2-2\eta)}.
\]
The von-Mangoldt Dirichlet series
\[
M(s)=\sum_n\Lambda(n)n^{-s}
\]
converges precisely for \(\Re s>1\). Therefore the displayed component diverges exactly when
\[
1+\frac1j-2\eta\le1,
\]
or
\[
\boxed{2\eta\ge\frac1j.}
\]
Every zero pair has positive weight in \(P_\xi\), so no other component can cancel this divergence.

Consequently,
\[
A_j<\infty
\quad\Longrightarrow\quad
|\eta_\rho|<\frac1{2j}
\quad\text{for every zero }\rho.
\]
If all \(A_j\) are finite and one off-line zero has \(|\eta|>0\), choose \(j\) with \(1/j\le2|\eta|\). Its positive contribution makes \(A_j\) infinite, a contradiction. Hence every \(\eta\) is zero.

Conversely, under RH, \(P_\xi=p_0\), and
\[
A_j
=
\frac{M(1+1/j)}{M(2)}<\infty
\]
for every finite \(j\). This proves the countable criterion.

## 2. The first rungs

The ladder begins as follows:

| Rung | Positive statement | Zero displacement excluded |
|---|---|---|
| \(j=1\) | \(\sum P_\xi=1\) | \(|\eta|\ge1/2\), already outside the nontrivial strip |
| \(j=2\) | \(\sum P_\xi(n)\sqrt n<\infty\) | \(|\eta|\ge1/4\) |
| \(j=3\) | \(\sum P_\xi(n)n^{2/3}<\infty\) | \(|\eta|\ge1/6\) |
| \(j=4\) | \(\sum P_\xi(n)n^{3/4}<\infty\) | \(|\eta|\ge1/8\) |
| \(j=5\) | \(\sum P_\xi(n)n^{4/5}<\infty\) | \(|\eta|\ge1/10\) |
| \(j\to\infty\) | moments approach \(\sum nP_\xi(n)\) | every fixed \(|\eta|>0\) |

The first row follows from the trace-preserving construction. There is no interpolation theorem taking mass one to the second row: moments of an unbounded observable are not controlled by trace alone.

The second row may look much weaker than RH, but it is already a uniform assertion about every zero. A zero-density theorem allowing one exceptional zero does not prove it. One exceptional pair with \(|\eta|\ge1/4\) contributes a divergent positive series.

## 3. Rényi version

Let
\[
R(n)=P_\xi(n)/p_0(n).
\]
If an off-line pair has displacement \(\eta>0\) and positive mixture weight, then for some \(c_\rho>0\),
\[
R(n)\ge c_\rho n^{2\eta}
\]
along all prime powers. Hence
\[
\begin{aligned}
\mathcal R_q
&=
\sum_np_0(n)R(n)^q\\
&\ge
C_\rho
\sum_n\Lambda(n)n^{-2+2q\eta}.
\end{aligned}
\]
The series on the right diverges when
\[
2-2q\eta\le1,
\]
that is,
\[
\boxed{q\eta\ge\frac12.}
\]
Therefore finite \(\mathcal R_q\) excludes every displacement
\[
|\eta|\ge\frac1{2q}.
\]
If \(R\in L^q(p_0)\) for every finite \(q>1\), any fixed positive \(\eta\) is excluded by choosing \(q\ge1/(2\eta)\). Under RH, \(R=1\), so all these moments equal one.

This proves
\[
\mathrm{RH}
\iff
P_\xi/p_0\in\bigcap_{q>1}L^q(p_0).
\]
It is weaker in form than \(L^\infty\), but still contains a sequence of shrinking critical-strip theorems.

## 4. Why the established structure does not imply the next rung

Consider the explicit reflected positive state
\[
P^{(0.1)}
=
\frac12(p_{0.1}+p_{-0.1}).
\]
It has all of the following properties:

- total mass one;
- reflection symmetry;
- an exact positive CPTP dephased construction;
- finite relative entropy to \(p_0\);
- finite moments of \(\log n\) of every fixed order;
- the Stage-39 componentwise natural-gradient flow;
- no ordinate-phase or off-diagonal-pair obstruction.

Nevertheless,
\[
\frac{P^{(0.1)}(n)}{p_0(n)}
\ge c n^{0.2}
\]
for a positive constant \(c\), and
\[
A_5(P^{(0.1)})=\infty.
\]
At \(j=5\), the relevant von-Mangoldt exponent reaches the pole boundary:
\[
1+\frac15-2(0.1)=1.
\]

This is a countermodel to any argument using only positivity, normalization, reflection, finite entropy, dephasing and componentwise dissipation. Those properties all survive while the required global moment fails.

The countermodel is not offered as a possible zeta divisor. It shows which already-proved structural facts are insufficient to force the desired bound.

## 5. Mellin-transform interpretation

Define
\[
\mathcal M_P(z)=\sum_nP_\xi(n)n^{-z}.
\]
The Mellin rungs sample this transform at
\[
z_j=-1+\frac1j.
\]
Thus
\[
A_j=\mathcal M_P(z_j).
\]
Under RH,
\[
\mathcal M_P(z)
=
\frac{M(2+z)}{M(2)},
\qquad \Re z>-1.
\]
An off-line slow component with displacement \(\eta\) moves its convergence boundary from \(-1\) to
\[
-1+2\eta.
\]
The sequence \(z_j\downarrow-1\) detects any such movement. Equivalently,
\[
\boxed{
\mathrm{RH}
\iff
\mathcal M_P(z_j)<\infty
\text{ for every }j.
}
\]

This is the cleanest weakening found. Instead of pointwise domination at every prime power, it asks for finiteness of one scalar positive sum at each member of a countable sequence.

## 6. Why this still cannot be inferred from the explicit formula

The dephased state is a nonlinear spectral statistic. Its Mellin transform is
\[
\sum_\rho\frac{w_\rho}{2}
\left[
\frac{M(2+2\eta_\rho+z)}{M(2+2\eta_\rho)}
+
\frac{M(2-2\eta_\rho+z)}{M(2-2\eta_\rho)}
\right],
\]
where convergent.

At \(z=z_j\), finiteness of this positive sum directly prohibits zeros beyond the corresponding horizontal line. The usual linear explicit formula does not supply that prohibition: it retains signed ordinate phases and can accommodate exceptional zeros. Dephasing removes the phases but does not enlarge the convergence half-plane of the resulting amplitude distribution.

Therefore no cancellation argument remains available. The missing input must establish a genuine zero-free strip or, equivalently, one new Mellin rung.

## 7. Finite diagnostics

The companion calculation evaluated partial moment sums over 18,120 prime powers through 200,000.

- For \(\eta=0.1\), the predicted threshold is \(j=5\).
- For \(\eta=0.25\), the predicted threshold is \(j=2\).
- At each threshold the series reduces to the divergent boundary \(\sum\Lambda(n)/n\).
- Beyond each threshold the divergence is polynomially stronger.

The finite values do not prove divergence or convergence; the analytic conclusion follows from the abscissa of convergence of \(-\zeta'/\zeta(s)\). The computation checks the exponents and monotonic partial sums.

## Evidence boundary

Proved here:

- the countable negative-Mellin-moment criterion equivalent to RH;
- the all-finite-order Rényi criterion equivalent to RH;
- the exact horizontal strip excluded by each rung;
- automatic closure of only the first Mellin rung;
- a positive reflected countermodel showing that the previously established structural properties do not imply the next rungs.

Not proved:

- \(A_2<\infty\) for the actual \(\xi\) zero mixture;
- any new global zero-free strip around the critical line;
- all Mellin rungs;
- all finite Rényi moments;
- \(P_\xi\le Cp_0\);
- RH.

## Final status

The uniform frame bound has been replaced by a weaker countable target:
\[
\boxed{
\forall j\ge1,
\qquad
\sum_{n=p^k}P_\xi(n)n^{1-1/j}<\infty.
}
\]
Only its first, normalization-level member is currently established. The first nontrivial member is already a new global zero-free-strip theorem.

The obstruction has been narrowed, not overcome. RH remains open.

**Hundred-round follow-up:** [`rss-hundred-round-mellin-closure-search.md`](./rss-hundred-round-mellin-closure-search.md) tests ten established mechanisms across ten finite-rung transitions. An exact reflected separator survives every route and proves that no finite bootstrap from the current structural package can force the next Mellin rung.
