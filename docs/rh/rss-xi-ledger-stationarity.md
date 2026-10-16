# Can the completed xi ledger be stationary under the support flow?

**Thirty-first-stage investigation — 15 October 2026**  
**Question:** Can the actual completed \(\xi\)-zero ledger be proved stationary under
\[
T_t(\eta,\gamma)=(e^{-t}\eta,\gamma)?
\]  
**Companion program:** `scripts/research-rss-xi-ledger-stationarity.py`  
**Machine-readable results:** `docs/rh/rss-xi-ledger-stationarity-results.json`

## Verdict

No unconditional stationarity theorem was found. The attempt proves that stationarity under any one positive flow time is exactly RH:
\[
\boxed{
\mathrm{RH}
\quad\Longleftrightarrow\quad
(T_t)_\#\mu_\xi=
\mu_\xi
\text{ for one }t>0.
}
\]
Under RH every displacement is zero and is fixed. Conversely, stationarity of any finite-height normalised ledger gives
\[
M_2
=
\int\eta^2\,d\mu
=
e^{-2t}M_2,
\]
so \(M_2=0\). Equivalently, an off-line zero would generate distinct support points \(e^{-nt}\eta\) accumulating at the same finite ordinate.

The investigation then tried to derive stationarity from the functional equation, central normalisation, the established \(\kappa\) geometry and the completed prime ledger. Each route reaches an exact obstruction:

- reflection symmetry preserves \(\pm\eta\), not horizontal shrinkage;
- an even real off-line quartet factor preserves completion symmetry and order but moves under the flow;
- scalar normalisation can keep the central value fixed without stopping that movement;
- the convergent horizontal residue has strictly negative first variation for every off-line quartet; and
- setting the principal prime-side variation to zero is another RH-equivalent identity, not a known consequence of the Euler product.

Thus the support flow provides a valid conditional fixed-point proof, but proving its stationarity for the actual \(\xi\) ledger is not a weaker intermediate lemma. It is the unresolved theorem itself in dynamical form. RH remains open.

---

## 1. Even weak stationarity is already sufficient

The generator of the support semigroup is
\[
\mathcal Lf
=-\eta\,\partial_\eta f.
\]
Weak stationarity of a probability ledger requires
\[
\int\mathcal Lf\,d\mu=0
\]
for every admissible test function. One test is enough here. For
\[
f(\eta)=\eta^2,
\]
one has
\[
\mathcal Lf=-2\eta^2.
\]
Therefore
\[
\int\mathcal Lf\,d\mu=0
\quad\Longrightarrow\quad
\int\eta^2\,d\mu=0.
\]
The ledger must be supported on the critical line.

This closes a possible loophole: one does not need equality of the complete transported measure. Infinitesimal stationarity against the single quadratic observable is already RH-strength.

## 2. First variation of one completed quartet

Use the centred variable \(z=s-1/2\). A reflected, conjugate quartet has factor
\[
Q_{\eta,\gamma}(z)
=
z^4+2(\gamma^2-\eta^2)z^2
+(\eta^2+\gamma^2)^2.
\]
It is even and real:
\[
Q(-z)=Q(z),
\qquad
Q(\overline z)=\overline{Q(z)}.
\]
Multiplying a completed order-one function by this polynomial preserves its order and both completion symmetries.

Along \(d\eta/dt=-\eta\), direct differentiation gives
\[
\boxed{
\partial_tQ_{\eta,\gamma}(z)
=
4\eta^2
\left[z^2-(\eta^2+\gamma^2)\right].
}
\]
For \(\eta\ne0\), this is not the zero polynomial. Consequently, symmetry-preserving contraction changes the completed function.

One may divide by \(Q(0)\) at every time so that the central value remains one. The logarithmic variation then becomes
\[
\partial_t\log Q(z)
-
\partial_t\log Q(0),
\]
which remains nonzero away from the centre. Central normalisation therefore does not provide stationarity.

The companion calculation verifies this at three displacements and three evaluation points. Both moving coefficients and every nontrivial central-normalised variation are nonzero.

## 3. A convergent aggregate has strict negative variation

For an upper off-line quartet, retain the exact central horizontal residue
\[
r(\eta,\gamma)
=
\frac{4\eta^2(\eta^2+3\gamma^2)}
{\gamma^2(\eta^2+\gamma^2)^2}.
\]
Put
\[
x=
\frac{\eta^2}{\gamma^2}.
\]
Then
\[
r
=
\frac4{\gamma^2}
\frac{x(x+3)}{(x+1)^2}.
\]
Because \(dx/dt=-2x\),
\[
\boxed{
\frac{dr}{dt}
=
-
\frac{8x(3-x)}
{\gamma^2(1+x)^3}.
}
\]
For a nontrivial zero in the critical strip, \(0<x<3\), so
\[
\frac{dr}{dt}<0
\]
whenever \(\eta\ne0\).

The sum \(\mathcal R=\sum r(\eta,\gamma)\) is convergent. Its differentiated terms decay at the stronger scale \(\eta^2/\gamma^4\), so the flow again supplies a sharp conditional argument:
\[
\left.\frac{d\mathcal R_t}{dt}\right|_{t=0}=0
\quad\Longrightarrow\quad
\mathcal R=0
\quad\Longrightarrow\quad
\mathrm{RH}.
\]
What is missing is a completed-prime or seam theorem forcing that derivative to vanish.

## 4. Why functional symmetry is insufficient

The functional equation and reality give the upper-pair reflection
\[
(\eta,\gamma)
\longleftrightarrow
(-\eta,\gamma).
\]
The support flow commutes with this reflection:
\[
T_t(-\eta,\gamma)
=
R T_t(\eta,\gamma).
\]
It therefore preserves the class of symmetric ledgers. Preserving a class is not fixing each member of that class.

The quartet factor above is an explicit stress family. It can be multiplied into a completed symmetric entire function, centrally normalised and placed at arbitrary height. All listed symmetries survive, while the natural-gradient support flow moves its roots. Any proof using only functional symmetry, reality, order and one scalar normalisation therefore cannot establish stationarity.

The Euler product is the structure that this stress factor lacks. A successful proof must use the principal prime ledger in an essential way.

## 5. The function-level and prime-side requirements

Let \(\xi_t\) denote the completed divisor obtained by transporting every hypothetical quartet. Logarithmic differentiation gives a meromorphic first variation. A moving off-line root contributes a nonzero principal part. Thus
\[
\partial_t\log\xi_t(s)=0
\]
on an open set would force every such root velocity to vanish.

On the prime side, preserving the same completed function requires the principal von Mangoldt and archimedean logarithmic derivative in \(\Re s>1\) to remain unchanged. If that equality held on the open half-plane, analytic uniqueness would return the same \(\xi\) function and the same divisor.

But the quartet calculation shows exactly what must be cancelled. No Euler-product identity found in the splice construction cancels this nonzero first variation. Demanding such cancellation for all \(s\), or even demanding zero variation of the convergent central residue, is another expression of the RH-strength stationarity theorem.

The smooth \(K_\kappa\) feature distribution does not change this conclusion. It derives the natural-gradient transport, but the bounded source geometry does not make the singular \(K_\xi\) divisor a stationary state. The earlier unbounded inverse-Green boundary remains.

## 6. Routes tested

| Route | Outcome |
|---|---|
| Functional equation | Gives reflection symmetry only; even real off-line quartet factors still move. |
| Central completion | A scalar keeps \(\xi_t(1/2)\) fixed but cannot remove the nonconstant logarithmic variation. |
| Weak Markov stationarity | The single test \(f=\eta^2\) already forces RH. |
| Horizontal-residue conservation | Its first variation is strictly negative off the line; proving zero variation is RH-equivalent. |
| Principal prime ledger | Equality on \(\Re s>1\) would prove stationarity by uniqueness, but no such all-scale identity is derived. |
| Kappa entropy geometry | Produces the flow, not the assertion that the actual \(\xi\) divisor follows or is fixed by it. |

## 7. Final status

The stationarity problem now has equivalent formulations at five levels:

1. invariance of finite-height zero measures;
2. weak invariance of the horizontal second moment;
3. zero first variation of every quartet divisor;
4. conservation of the convergent horizontal residue; and
5. stationarity of the principal completed prime logarithmic derivative.

Each would prove RH. None follows from the currently derived splice, functional-equation or prime identities.

The attempted stationarity proof therefore does not close the gap. It shows precisely why the gap cannot be discharged by calling the completed ledger static: a static mathematical object need not be invariant under an auxiliary gradient flow. A new principal-prime conservation law would still be required. RH remains open.

**Principal-prime follow-up:** [`rss-principal-prime-anchor.md`](./rss-principal-prime-anchor.md) reduces the required law to conservation of the single absolutely convergent anchor \(\xi_t'/\xi_t(2)\). Its variation is coercively comparable to horizontal-residue loss, but no Euler product for the moved divisor proves that conservation.
