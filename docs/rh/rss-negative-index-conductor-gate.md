# Can a quantised index exclude an off-line zero?

**Thirty-fifth-stage negative-square and conductor audit — 15 October 2026**  
**Companion program:** `scripts/research-rss-negative-index-conductor-gate.py`  
**Machine-readable results:** `docs/rh/rss-negative-index-conductor-gate-results.json`

## Verdict

A finite synthetic negative-square theorem has been proved. It eliminates the collapsing-amplitude problem at the detector level:

\[
\boxed{
\text{one nontrivial functional-equation mirror cycle}
\Longrightarrow
\text{one negative square}.
}
\]

In the full complex census, one off-line quartet contains two such mirror cycles and contributes two negative squares. This count is unchanged when the quartet approaches the critical line or moves to arbitrarily high ordinate. The negative eigenvalue does not become a small positive number; its existence is an integer-valued obstruction.

The arithmetic promotion gate nevertheless fails. For zeta, the completed reflection form is the zero side of the Guinand--Weil explicit formula. Proving that it has no negative square on the complete admissible test space is Weil positivity, which is equivalent to RH. The prime, pole and gamma expression is an equality, not an independent sign theorem.

Burnol's local conductor commutators were also tested as a possible arithmetic index engine. The established local theory gives signed conductor symbols and a supertrace with an identity correction. It does not supply a canonical global Fredholm pair with compact difference or a place-by-place computation of zero index. An index extracted directly from the phase of \(\xi\) returns the argument-principle zero count.

The Sonine reflection route closes at the same point: completeness and minimality preserve the nodes, but a positive reflection metric would have to remove exactly the negative quartet block and no independent arithmetic theorem does so.

Thus quantised detection is achieved; arithmetic exclusion is not. The route is closed under its stated fail-fast rule. RH remains open.

---

## 1. The finite reflection form

Use the centered coordinate
\[
z=s-\frac12.
\]
Functional-equation reflection is
\[
Rz=-\overline z.
\]
Let \(Z=\{z_1,\ldots,z_n\}\) be a finite set stable under \(R\), and let \(J_Z\) be the permutation matrix
\[
(J_Z)_{jk}=1
\quad\Longleftrightarrow\quad
z_k=Rz_j.
\]
For an evaluation vector \(v\in\mathbb C^n\), define
\[
Q_Z(v)=v^*J_Zv
=\sum_j v_j\overline{v_{Rj}}.
\]
The reflection is an involution, so its orbits have size one or two.

A fixed node obeys \(Rz=z\), hence \(\Re z=0\). It lies on the critical line and contributes
\[
|v_z|^2.
\]
A nontrivial two-cycle \(\{z,Rz\}\) contributes the block
\[
\begin{pmatrix}
0&1\\
1&0
\end{pmatrix},
\]
whose eigenvalues are \(+1\) and \(-1\).

Therefore, if \(f\) nodes are fixed and \(p\) nontrivial mirror cycles occur, then
\[
\boxed{
\operatorname{Inertia}(Q_Z)=(f+p,p,0).
}
\]
This is an exact algebraic theorem. No limiting estimate or numerical eigenvalue calculation is involved.

## 2. The quartet census

An off-line zero in the upper half-plane has centered coordinate
\[
z=\eta+i\gamma,
\qquad \eta\ne0.
\]
Its functional-equation mirror is
\[
Rz=-\eta+i\gamma.
\]
Conjugation supplies the lower pair
\[
\eta-i\gamma,
\qquad
-\eta-i\gamma.
\]
Thus the full quartet has two nontrivial \(R\)-cycles. Its reflection matrix is
\[
J_{m quartet}
=
\begin{pmatrix}
0&1&0&0\\
1&0&0&0\\
0&0&0&1\\
0&0&1&0
\end{pmatrix},
\]
and
\[
\boxed{
\operatorname{Inertia}(J_{m quartet})=(2,2,0).
}
\]
Two quartets have inertia \((4,4,0)\). Four distinct critical-line nodes have inertia \((4,0,0)\).

This solves the collapsing-margin problem abstractly. The quartet at displacement \(10^{-6}\) has exactly the same inertia as the quartet at displacement \(10^{-1}\). A quartet at ordinate \(10^6\) also has the same index.

## 3. Pullback through interpolation

The reflection matrix acts on free evaluation coordinates. To test whether the sign survives a function-space realization, evaluate polynomials of degree below \(n\) at the distinct nodes. The resulting Vandermonde matrix is
\[
V_{jk}=z_j^k.
\]
Its determinant is
\[
\det V=\prod_{i<j}(z_j-z_i),
\]
which is nonzero for distinct nodes. Pulling the form back to polynomial coefficients gives
\[
G=V^*J_ZV.
\]
By Sylvester's law of inertia,
\[
\operatorname{Inertia}(G)=\operatorname{Inertia}(J_Z).
\]
Thus finite interpolation does not erase the negative index.

It does reveal where conditioning is lost. Moving a sample quartet from \(\eta=10^{-1}\) to \(\eta=10^{-6}\) leaves the inertia \((2,2,0)\), while the exact squared Vandermonde determinant falls by a factor below
\[
10^{-20}.
\]
At \(\eta=0\), each horizontal pair collides, the four-node Vandermonde becomes singular and the reduced critical-line form is positive. The index jump occurs exactly at the collision. This is the quantised version of the collapsing metric margin.

## 4. Multiplicity does not come for free

The ordinary zero sum counts a zero of multiplicity \(m\) by multiplying its evaluation contribution by \(m\). A mirror block becomes
\[
\begin{pmatrix}
0&m\\
m&0
\end{pmatrix},
\]
with eigenvalues \(+m\) and \(-m\). Its negative index remains one rather than becoming \(m\).

To count multiplicity by dimension, one must add independent derivative-jet coordinates
\[
F(z),F'(z),\ldots,F^{(m-1)}(z)
\]
and use confluent Hermite interpolation. Such a lifted synthetic form has \(m\) negative blocks per mirror cycle. But these derivative coordinates are not present in the ordinary multiplicity-weighted Weil zero sum. No established completed prime-side formula for the required confluent index was found.

The finite theorem therefore counts distinct mirror cycles exactly. A multiplicity-counting lift is mathematically constructible but lacks the arithmetic bridge.

## 5. Contact with the Weil form

The completed explicit formula has a zero-side reflection structure of the schematic form
\[
Q_{m zero}(F)
=
\sum_\rho
F(\rho)\overline{F(1-\overline\rho)},
\]
with the precise admissible test class and normalisation fixed by the Guinand--Weil theorem. The same completed form equals a combination of:

- prime-power terms;
- pole terms;
- archimedean gamma terms;
- endpoint and normalisation corrections.

The finite reflection theorem explains the signature of an interpolated zero block. But the explicit formula itself supplies only
\[
Q_{m zero}(F)=Q_{m arithmetic}(F).
\]
It does not show that the right side is nonnegative for every admissible \(F\).

The promotion target would be
\[
\kappa(Q_{m arithmetic})=0
\]
proved without knowing the zeros. On the complete Weil test domain, that is precisely the positivity criterion equivalent to RH. The integer language removes the small amplitude but does not make the arithmetic sign easier.

Finite bandwidth does not solve this. A small test space may fail to interpolate the offending nodes and therefore miss a negative direction. Enlarging the space until every possible node is detected recovers the full RH-equivalent criterion.

## 6. Conductor-commutator gate

Burnol's local conductor theory was examined because commutators retain phase and can sometimes define relative indices insensitive to scalar renormalisation.

At a finite prime, the local time-delay symbol is nonnegative, but the conductor symbol has the form
\[
H_p=\log p-\tau_p.
\]
It is signed. The local explicit-formula contribution is represented by a supertrace together with an identity correction, not by an ordinary positive trace.

A global Fredholm construction would require at least:

1. two canonical completed projections or involutions;
2. a compact difference;
3. stable domains at the archimedean and finite places;
4. a trace-class or Fredholm completion after summing over primes;
5. an index changed by every off-line quartet;
6. a place-by-place arithmetic proof that the index is zero.

The established local formulas do not supply this object. The unsmoothed sum over places requires global regularisation, and that regularisation is already the completed explicit formula. No canonical pair with compact difference was found. If the proposed index is instead defined from the phase of \(\xi\), its value is the argument-principle zero count and is circular for the present purpose.

The conductor route therefore fails before a global index can be asserted.

## 7. Sonine reflection gate

Burnol's Sonine systems give unconditional complete and minimal systems associated with the actual zeta zeros, together with canonical biorthogonal data. This is stronger than a merely heuristic spectral realization.

However, completeness is compatible with an off-line quartet. On the quartet evaluation sector, the reflection block remains
\[
\begin{pmatrix}0&1\\1&0\end{pmatrix}
\]
with signature \((1,1)\). A positive reflection metric must eliminate or reverse precisely this negative direction. No theorem deriving such positivity from co-Poisson support, the Euler product or the conductor calculus was found. Assuming it would reintroduce Weil positivity in another basis.

The Sonine route is consequently retained as a structural model, not promoted as an exclusion engine.

## 8. Fail-fast conclusion

The stage set five promotion requirements:

1. an integer obstruction that survives a near-line zero;
2. exact compatibility with completion;
3. a well-defined global index;
4. arithmetic computation independent of zero location;
5. no reduction to Weil positivity or the argument principle.

Only the first two survive, and the second survives only as the explicit-formula identity. Requirements three through five fail with the presently established theory.

The exact accomplishment is
\[
\boxed{
\text{off-line mirror cycle}
\Longrightarrow
\text{negative square with integer index}.
}
\]
The unresolved implication is
\[
\boxed{
\text{completed prime data}
\Longrightarrow
\text{index zero}.
}
\]
No independent proof of the second implication was found. The route is closed rather than cosmetically renamed. RH remains open.

**Relational-combination follow-up:** [`rss-relational-synchronisation-combinations.md`](./rss-relational-synchronisation-combinations.md) tests the detector together with proximity locking, Fibonacci cohorts, the splice kernel, entropy, golden contraction and halving. The index remains two at every nonzero finite displacement.
