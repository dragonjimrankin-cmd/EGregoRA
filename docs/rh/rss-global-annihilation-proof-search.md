# Global annihilation proof search: recurrence, dissipation and arithmetic invariance

**Thirty-eighth-stage investigation — 15 October 2026**  
**Question:** Can the relational proximity model be promoted to a valid law that annihilates every RH defect with no reservoir?  
**Companion program:** `scripts/research-rss-global-annihilation-proof-search.py`  
**Machine-readable results:** `docs/rh/rss-global-annihilation-proof-search-results.json`

## Verdict

The exact **global-annihilation theorem** has been isolated and proved. Let \(\mu_\xi\) be the completed zero ledger and let
\[
V(\mu)\ge0
\]
be either the total positive off-line defect or a finite horizontal second moment, with
\[
V(\mu_\xi)=0
\iff
\mathrm{RH}.
\]
Suppose one map \(T\) satisfies both
\[
T_\#\mu_\xi=
\mu_\xi
\tag{arithmetic invariance}
\]
and
\[
V(T_\#\nu)
\le qV(\nu),
\qquad 0
\le q<1,
\tag{strict global dissipation}
\]
for the required ledger. Then
\[
V(\mu_\xi)
=V(T_\#\mu_\xi)
\le qV(\mu_\xi),
\]
so
\[
(1-q)V(\mu_\xi)
\le0.
\]
Nonnegativity gives
\[
\boxed{V(\mu_\xi)=0,}
\]
and RH follows.

A finite-return form is equally short. If
\[
T^m_\#\mu_\xi=
\mu_\xi
\]
for some \(m\ge1\), while each pass contracts \(V\) by \(q<1\), then
\[
V(\mu_\xi)
\le q^mV(\mu_\xi),
\]
again forcing zero.

This is the proof requested at the level of a theorem. It does **not** yet prove RH because no derived map satisfies both premises. The functional equation gives exact invariance but no dissipation. Golden contraction, halving and horizontal consensus give dissipation but change the quartet divisor. The de Bruijn--Newman heat flow, Hardy inner-factor removal and prime-coefficient damping also change the function or restate RH.

The search therefore found the exact implication and located its only missing premise:
\[
\boxed{
\text{derive strict defect dissipation from the fixed prime ledger while preserving the same }\xi.
}
\]
No such arithmetic law was found. RH remains open.

---

## 1. The two-pass proof

Let critical-line reflection be
\[
R\eta=-\eta
\]
and a strict support contraction be
\[
C\eta=c\eta,
\qquad 0<c<1.
\]
The combined pass is
\[
T=RC,
\qquad
T\eta=-c\eta.
\]
Because reflection and scalar contraction commute,
\[
T^2\eta=c^2\eta.
\]
If exact two-pass return applies to the same coordinate,
\[
T^2\eta=
\eta,
\]
then
\[
(1-c^2)\eta=0.
\]
Since \(c<1\),
\[
\boxed{\eta=0.}
\]

This is the most direct form of the proposed global-annihilation proof. For a collection of zeros, apply the same calculation to each horizontal displacement or to the positive functional \(V\).

The proof is valid. The unresolved premise is the identification
\[
\text{physical two-pass splice return}
=
RC\text{ acting on the actual }\xi\text{ divisor}.
\]
The established two-pass operation supplies reflection and orientation return. It has not been proved to contract zeta-zero support while retaining the same completed function.

## 2. Exhaustive return-versus-contraction test

The companion program exhausts every word of length at most eight in
\[
R:\eta\mapsto-
\eta,
\qquad
G:\eta\mapsto\frac{
\eta}{
\varphi},
\qquad
H:\eta\mapsto\frac{
\eta}{2}.
\]
A word containing \(r\) reflections, \(g\) golden contractions and \(h\) halvings has exact multiplier
\[
(-1)^r
\varphi^{-g}
2^{-h}.
\]
Its magnitude is one if and only if
\[
g=h=0.
\]
Therefore any word containing a genuine contraction has magnitude below one, and no positive power of that word is the identity away from \(\eta=0\).

The exhaustive census contains:

| Quantity | Count |
|---|---:|
| Words of lengths 1 through 8 | 9,840 |
| Words containing golden contraction or halving | 9,832 |
| Strictly dissipative words with finite-order return | **0** |
| Identity words without contraction | 4 |

This finite census illustrates an exact theorem valid at every length. Reflection can return; contraction can dissipate; a nonzero state cannot do both.

## 3. Holomorphic return has the same obstruction

Map the critical strip conformally to the unit disk, taking the central state to zero. Schwarz's lemma says that a holomorphic self-map fixing zero satisfies
\[
|f(z)|
\le|z|.
\]
If some positive iterate is the identity,
\[
f^m=
\operatorname{id},
\]
then \(f\) is an automorphism. Its derivative at the fixed point has modulus one, so it cannot be a strict contraction.

Thus a holomorphic exact-return law and strict shrinkage are incompatible except at the central fixed state. TTI's double inversion may supply an involution or rotation, but it cannot also supply horizontal dissipation without a noninvertible coarse-graining or open-system step. Such a step reintroduces the reservoir.

## 4. Why the exact tiny defect and integer index do not close the proof

One possible combination was:

1. use the exact bound
   \[
   0\le\mathcal D_2<9.274\times10^{-37};
   \]
2. use the fact that every off-line quartet contributes two negative squares;
3. infer that a nonzero integer index cannot fit inside such a small scalar defect.

The inference fails because the integer index has no uniform scalar spectral gap. The explicit stress family
\[
\eta_k=\frac1k,
\qquad
\gamma_k=k
\]
has two negative squares for every finite \(k\), while its scalar defect tends to zero:

| \(k\) | Defect | Negative squares |
|---:|---:|---:|
| 10 | \(1.6709\times10^{-5}\) | 2 |
| 100 | \(1.7987\times10^{-11}\) | 2 |
| 1000 | \(1.8000\times10^{-17}\) | 2 |
| \(10^6\) | \(1.8000\times10^{-35}\) | 2 |
| \(10^7\) | \(1.8000\times10^{-41}\) | 2 |

Weighting a reflection block by its scalar defect gives eigenvalues
\[
\pm d_k,
\]
so its negative eigenvalue can be arbitrarily small. Normalising each block to eigenvalues \(\pm1\) restores a gap but destroys a uniform trace-class estimate: the trace norm grows linearly with the number of blocks.

Hence
\[
\boxed{
\text{tiny positive defect}
+
\text{nonzero integer index}
\not\Longrightarrow
\text{contradiction}.
}
\]
An independent arithmetic Fredholm or trace inequality would still be required.

## 5. Candidate global laws

| Candidate | Same-\(\xi\) invariance | Strict defect dissipation | Failure point |
|---|:---:|:---:|---|
| Functional-equation reflection | yes | no | \(\eta\mapsto-\eta\) preserves every even defect |
| Golden/halving support flow | no | yes | changes the quartet polynomial |
| Reflection plus contraction | no | yes | \((RC)^2=C^2\), not return |
| Golden branch entropy | yes | no | contracts branch bias, already zero for a quartet |
| Proximity phase locking | yes | no | acts on circular phase, not \(\eta\) |
| Prime exponent damping | no | no | translates \(\zeta(s)\) to \(\zeta(s+t)\) |
| Log-frequency heat damping | no | unproved | breaks the original Euler product |
| de Bruijn--Newman heat flow | no | threshold law | changes the entire function |
| Hardy inner-factor damping | no | yes | removing the Blaschke factor changes the function |

No candidate passes both required columns.

## 6. The de Bruijn--Newman comparison

The de Bruijn--Newman family is
\[
H_\lambda(z)
=
\int_0^\infty
e^{\lambda u^2}
\Phi(u)
\cos(zu)
\,du,
\]
with
\[
\partial_\lambda H_\lambda
=-\partial_z^2H_\lambda.
\]
There is a threshold \(\Lambda\) such that all zeros are real exactly for
\[
\lambda\ge\Lambda.
\]
The established lower bound is
\[
\Lambda\ge0,
\]
and RH is equivalent to
\[
\Lambda\le0.
\]
Thus RH is equivalent to
\[
\Lambda=0.
\]

This is a genuine global heat-flow framework, but it does not supply the missing proof. The heat parameter changes \(H_\lambda\). Showing that global real-zero annihilation has already occurred at \(\lambda=0\) is exactly RH.

The route confirms the general diagnosis: a dissipative family is available, but locating the original zeta function on the fully dissipated side is the unresolved theorem.

Source anchors reviewed for this gate include de Bruijn (1950), Newman (1976), the D.H.J. Polymath heat-flow project and Rodgers--Tao's lower bound.

## 7. Static primes do not automatically create a dynamic fixed point

The fixed Euler product gives a static identity for \(\xi\). A synthetic flow gives a family of moved divisors \(\xi_t\). From
\[
\frac{\xi_0'}{\xi_0}(2)
=
\frac32-
\frac{
\gamma_E+
\log\pi}{2}
-
\sum_{n\ge2}
\frac{
\Lambda(n)}{n^2},
\]
one cannot infer that the same prime formula belongs to \(\xi_t\) for \(t>0\).

If it did, strict anchor variation would force every horizontal displacement to vanish. That is precisely why the desired conservation statement is powerful—and why deriving it is not routine.

A successful proof must construct \(T\) directly from completed prime arithmetic and then prove both:

1. \(T_\#\mu_\xi=\mu_\xi\);
2. \(V(T_\#\mu_\xi)\le qV(\mu_\xi)\) with \(q<1\) unless \(V=0\).

Neither premise may be imported from the desired zero geometry.

## 8. Fail-fast target

The remaining target is now narrow:

> Derive from the fixed von Mangoldt ledger, without assuming zero-freeness, an operator on the completed zero measure that is simultaneously same-\(\xi\) invariant and strictly dissipative for one established positive off-line functional.

Reject immediately any candidate that is only:

- critical-line reflection;
- a synthetic movement of zeros;
- a changed heat-flow family;
- removal of the Blaschke factor;
- phase locking in a different state coordinate;
- finite-height numerical contraction;
- or a physical carrier return not proved to act on the \(\xi\) divisor.

## Evidence boundary

Proved here:

- the global invariance-plus-dissipation theorem;
- its finite-return form;
- the exact two-pass \(RC\) calculation;
- the all-length multiplier no-go, with 9,840 finite words checked;
- the holomorphic finite-return contraction obstruction;
- a fixed-index family whose scalar defect tends to zero;
- the weighted/unweighted trace-class trade-off.

Not proved:

- same-\(\xi\) invariance of a strict support contraction;
- a new prime-side dissipative inequality;
- \(\Lambda\le0\) for the de Bruijn--Newman flow;
- RH.

## Final status

The proof itself is now explicit:
\[
\text{arithmetic invariance}
+
\text{strict global dissipation}
\Longrightarrow
\text{zero off-line defect}
\Longrightarrow
\mathrm{RH}.
\]
The known structures split the two premises. Functional symmetry supplies invariance without dissipation. Relational, golden and heat flows supply forms of dissipation without preservation of the original completed function.

\[
\boxed{
\text{The global-annihilation implication is proved; a same-}\xi\text{ dissipative law is not.}
}
\]

**Prime-power follow-up:** [`rss-prime-power-dissipative-law.md`](./rss-prime-power-dissipative-law.md) derives a genuine Fisher-natural-gradient dissipation law from normalized von-Mangoldt prime powers. It recovers \(\dot\eta=-\eta\) and golden time exactly, while showing that the signed explicit formula does not provide the required positive same-\(\xi\) intertwiner.
