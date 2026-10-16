# Closing the two RSS-to-modular bridge premises

**Third-stage investigation — 14 October 2026**<br>
**Question:** Does RSS itself supply a measurable projective ledger, and does its existing two-cycle torus give the upper half-plane a concrete meaning and intrinsic metric?<br>
**Companion program:** `scripts/research-rss-ledger-hyperbolic.mjs`<br>
**Machine-readable results:** `docs/rh/rss-ledger-hyperbolic-results.json`

## Result in one sentence

The two premises can be closed **at the level of the RSS mathematical state model**, with sharply stated qualifications: the declared splice multiplicities already give the primitive two-register ledger
\[
L_n=(F_n,F_{n+1}),
\qquad
L_{n+1}=
\begin{pmatrix}0&1\\1&1\end{pmatrix}L_n,
\]
whose projective update is the golden inverse branch and whose entries recover the declared cumulative return and deposit; meanwhile the existing circulation/return torus has a marked two-period Gram matrix whose dimensionless shape is
\[
\tau=x+iy,
\qquad
y=\frac{\det(\omega_I,\omega_R)}{|\omega_I|^2}>0,
\]
and the basis-independent relative-strain metric on unit-area shapes is exactly
\[
ds^2=\frac{dx^2+dy^2}{y^2}.
\]

Two empirical debts remain. The register exchange is proved as recurrence-state relabelling and as an exact matrix factor, not as a directly observed exchange of two material substances at a seam. The hyperbolic metric is intrinsic to the **space of two-cycle shapes**, not automatically to physical spacetime; a physical application must measure the two periods and their Gram matrix.

---

## 1. What “independent RSS justification” requires

The previous report, `rss-modular-derivation.md`, used two premises:

1. a primitive integer pair on which unit addition and seam exchange act; and
2. an upper-half-plane completion carrying the canonical hyperbolic metric.

It is not enough to note that both premises are standard in modular mathematics. A non-circular RSS derivation must identify structures already present in the project before using the modular consequences. The relevant existing declarations are:

| Existing RSS object | Project source | Exact mathematical content |
|---|---|---|
| Splice multiplicity | `tti/src/spiral.njk` | \(m_n=F_n\), with \(F_{n+2}=F_{n+1}+F_n\) |
| Cumulative splice population | `tti/src/spiral.njk` | \(\sum_{k=1}^nF_k=F_{n+2}-1\) |
| Returner/deposit observable | `tti/src/skeletal-splice.njk` and `accumulated-differentials.njk` | \(R_n=F_{n+2}-1\) and \(\delta\Pi_n=R_n\varphi^{-n}\) |
| Two independent process cycles | `tti/src/torus.njk` | one cycle carries circulation/accumulation and one carries return |
| Winding memory | `tti/src/torus.njk` | \((p,q)\in\mathbb Z^2\) records the two winding counts |
| Integer seam transport | `tti/src/inverted-toruses.njk` | winding ledgers transform by \(GL(2,\mathbb Z)\), with determinant recording orientation |

These are sufficient to construct a concrete count ledger and a marked two-cycle shape space. They are not sufficient to assert a particular laboratory carrier, stress-energy source or spacetime metric. That distinction is preserved throughout.

There is also a notation issue. Different RSS pages use \(P_n\) and \(R_n\) for the same Fibonacci-minus-one cumulative count. In this report, write
\[
C_n:=\sum_{k=1}^nF_k=F_{n+2}-1
\]
when the notation itself is not the subject under discussion.

## 2. The projective ledger is already present in the recurrence

### 2.1 The minimal local state

A second-order recurrence does not have a scalar autonomous local state. To compute the next multiplicity, it must retain the two preceding values. RSS’s own multiplicity law therefore supplies
\[
\boxed{
L_n=
\binom{m_n}{m_{n+1}}
=
\binom{F_n}{F_{n+1}}.}
\]

This is not an abstract “integration/residue” pair invented for modular theory. Both entries are declared RSS splice counts at adjacent return sections. Operationally they are the previous and current measured flux registers. Equivalently, at section \(k\) the observer stores \((m_{k-1},m_k)\); the notation above is the same state with \(k=n+1\). It therefore requires one retained measurement, not knowledge of a future count. This establishes a measurable recurrence ledger, although not yet two simultaneous material stocks.

The update is exact:
\[
L_{n+1}
=
\binom{m_{n+1}}{m_n+m_{n+1}}
=
B L_n,
\qquad
B=
\begin{pmatrix}0&1\\1&1\end{pmatrix}.
\]

The relevant minimality statement needs one qualification. For the **family** of all histories obeying the second-order law, one current value does not determine the next. For example,
\[
(1,3)\mapsto(3,4),
\qquad
(2,3)\mapsto(3,5).
\]
The current register is \(3\) in both states, but the successors differ. Thus two registers are the minimal autonomous linear state if no external stage label is supplied. A single preselected Fibonacci orbit can of course be encoded by its index \(n\); that is external indexing, not a one-register local evolution law.

### 2.2 The existing observables are recovered from the pair

The ledger is not merely sufficient to continue the recurrence. It reconstructs the headline RSS quantities:
\[
C_n=F_{n+2}-1
=F_n+F_{n+1}-1
=u_n+v_n-1.
\]
Therefore the declared deposit becomes
\[
\boxed{
\delta\Pi_n
=(u_n+v_n-1)\varphi^{-n}.}
\]

The subtraction of one is the already-declared distinguished line that continues rather than joining the cumulative returner population. No new fitted coefficient is introduced.

Consecutive Fibonacci numbers are coprime:
\[
\gcd(F_n,F_{n+1})=1.
\]
Hence every \(L_n\) is a primitive lattice vector. This is exactly the primitivity condition required by the projective-lattice calculation in the previous report. Common scaling \(kL_n\) is then a repeated state rather than a new primitive direction.

The companion program checks all these identities exactly with `BigInt` for the first 24 states. It also verifies the cumulative and deposit reconstruction and coprimality at every checked stage.

### 2.3 Projectivisation gives the golden branch without a new variable

Let
\[
\xi_n:=\frac{u_n}{v_n}
=rac{F_n}{F_{n+1}}.
\]
Then
\[
\xi_{n+1}
=\frac{v_n}{u_n+v_n}
=\frac1{1+\xi_n}.
\]
The positive fixed point is
\[
\xi_*=\frac1{1+\xi_*}
=\varphi^{-1}.
\]

Thus the projective coordinate needed by the modular investigation is a ratio of two declared count observables. The golden inverse branch is not added after the fact; it is the projectivised RSS recurrence.

### 2.4 What exactly swaps at the seam?

The update matrix factors as
\[
B=RT,
\qquad
T=
\begin{pmatrix}1&1\\0&1\end{pmatrix},
\qquad
R=
\begin{pmatrix}0&1\\1&0\end{pmatrix}.
\]
For column vectors, \(T\) first performs unit addition,
\[
(u,v)\stackrel{T}{\longmapsto}(u+v,v),
\]
and \(R\) then exchanges the two register roles,
\[
(u+v,v)\stackrel{R}{\longmapsto}(v,u+v).
\]
The exchange satisfies \(R^2=I\). The full one-stage map \(B\) is not an involution; it has determinant \(-1\), while \(B^2\) preserves orientation.

This separates three claims that should not be conflated:

1. **Exact algebraic result:** \(B=RT\), with \(R\) an involutive coordinate exchange.
2. **Exact recurrence interpretation:** on the next Poincaré return section, the old current register becomes the inherited/previous register, while the new current register is the sum. This is a genuine role relabelling in a shift register.
3. **Unproved physical promotion:** two tagged material channels literally cross a physical seam and exchange substances or causal roles.

The first two are established by the RSS recurrence. The third requires cohort-resolved observation. A matrix factorisation alone does not show a material seam in nature.

This also improves the language used in the previous report. “Integration” and “returned residue” need not initially denote two stocks of unknown substance. They can denote two directly countable consecutive return fluxes. If RSS later identifies those fluxes with physical integrated and returned carriers, that is an empirical map rather than an assumption hidden inside the arithmetic.

### 2.5 Variable completed-unit branches

For a stage containing \(a\ge1\) completed unit additions before role exchange,
\[
B_a=RT^a
=
\begin{pmatrix}0&1\\1&a\end{pmatrix},
\]
so
\[
(u,v)\mapsto(v,u+av),
\qquad
\xi\mapsto\frac1{a+\xi}.
\]

This preserves the gcd because \(\det B_a=-1\). It supplies the inverse continued-fraction branches used in the modular completion. The existing Fibonacci RSS sector is precisely \(a=1\) at every stage.

A remaining model question must stay visible: the fixed RSS multiplicity law establishes the \(a=1\) orbit. The larger alphabet follows if the number of completed unit integrations is allowed to vary, as argued in the previous report, but the current public RSS model does not exhibit physical events realising every \(a>1\).

## 3. How the count ledger relates to the torus ledger

RSS already gives a torus two independent winding classes. Choose a marked oriented basis
\[
\alpha_I,\alpha_R\in H_1(T^2,\mathbb Z),
\]
where the labels refer to the circulation/integration and return cycles. A closed path has class
\[
[p\alpha_I+q\alpha_R],
\qquad (p,q)\in\mathbb Z^2.
\]

Three objects must be kept distinct:

1. **coefficients** \((p,q)\): integer winding counts;
2. **period vectors** \(\omega_I,\omega_R\): geometric representatives of the marked cycles in a two-dimensional phase/period plane; and
3. **physical observables:** whatever experiment records those periods, phases or return events.

With period vectors present, the displacement represented by a winding class is
\[
W_{p,q}=p\omega_I+q\omega_R,
\]
and its squared length is
\[
|W_{p,q}|^2
=
\begin{pmatrix}p&q\end{pmatrix}
G
\binom pq,
\qquad
G_{ij}=\omega_i\cdot\omega_j.
\]

The Fibonacci register \(L_n=(F_n,F_{n+1})\) and a torus winding pair both live in a primitive \(\mathbb Z^2\) lattice and transform by the same integer matrices. This supplies a natural marked identification:
\[
L_n\longleftrightarrow
F_n\alpha_I+F_{n+1}\alpha_R.
\]
It is not a theorem that a laboratory return path has those winding numbers. Mathematically, an isomorphism between two copies of \(\mathbb Z^2\) requires a choice of marked basis. RSS’s named circulation and return cycles suggest that marking, but observation must confirm it.

## 4. The positive imaginary coordinate has a concrete meaning

### 4.1 Derivation from two periods

Assume the two independent RSS cycles have measurable oriented period vectors \(\omega_I,\omega_R\) in a common two-dimensional phase or state plane. Rotate coordinates so that \(\omega_I\) lies on the positive real axis and divide by it. The shape ratio is
\[
\tau=rac{\omega_R}{\omega_I}=x+iy,
\qquad y>0.
\]

No complex physical substance is being introduced. Complex notation packages the two real shape observables. Coordinate-free formulas are
\[
\boxed{
x=rac{\omega_I\cdot\omega_R}{|\omega_I|^2},}
\qquad
\boxed{y=rac{\det(\omega_I,\omega_R)}{|\omega_I|^2}>0.}
\]
If \(\theta\) is the oriented angle between the periods, then
\[
x=rac{|\omega_R|}{|\omega_I|}\cos\theta,
\qquad
y=rac{|\omega_R|}{|\omega_I|}\sin\theta.
\]

Thus:

- \(x\) measures dimensionless shear or longitudinal overlap of the return cycle along the integration cycle;
- \(y\) measures dimensionless transverse return separation, equivalently oriented period-cell area divided by the squared first-cycle length;
- \(y>0\) says that the marked cycles are independent and oriented consistently;
- \(y=0\) is a degenerate one-cycle limit, not a valid two-dimensional torus shape.

The formula is scale-free. Replacing both periods by \(\lambda\omega_i\) multiplies the numerator and denominator of \(x\) and \(y\) by \(\lambda^2\), leaving \(\tau\) unchanged.

This answers the measurement question narrowly. The imaginary coordinate is **not** time, physical altitude, spacetime distance, density by itself or an unseen fourth direction. It is a ratio made from two measured cycle vectors.

### 4.2 The Gram-matrix formula

Let
\[
G=
\begin{pmatrix}
\omega_I\cdot\omega_I&\omega_I\cdot\omega_R\\
\omega_I\cdot\omega_R&\omega_R\cdot\omega_R
\end{pmatrix}.
\]
Its cell area is
\[
A=\sqrt{\det G}=\det(\omega_I,\omega_R)>0.
\]
Then
\[
x=\frac{G_{12}}{G_{11}},
\qquad
y=\frac{\sqrt{\det G}}{G_{11}}.
\]

These equations provide an operational route: estimate the two cycle lengths and their cross-angle or cross-phase, form \(G\), and compute \(x,y\). The companion program reconstructs \(x,y\) from four differently scaled period pairs and verifies that common scale cancels.

### 4.3 The cusp and the two reciprocal scales

After normalising the cell area to one, a convenient basis is
\[
e_I=\frac1{\sqrt y}(1,0),
\qquad
e_R=\frac1{\sqrt y}(x,y).
\]
The first cycle has length
\[
|e_I|=y^{-1/2},
\]
while the transverse component of the second has length
\[
(e_R)_\perp=y^{1/2}.
\]
Their product is one. As \(y\to\infty\), one marked cycle pinches toward zero while its transverse partner expands toward infinity. The modular cusp therefore has a precise shape meaning: **unbounded separation of two reciprocal cycle scales at fixed area**.

This is compatible with RSS’s “two infinities” language, but compatibility is not a proof that a cosmological smallward/largeward pair has this measured torus modulus.

## 5. Why the upper half-plane is the torus-shape space

Remove overall area from the period Gram matrix:
\[
Q=\frac{G}{\sqrt{\det G}}.
\]
Then \(Q\) is symmetric, positive definite and has determinant one. In terms of \(\tau=x+iy\),
\[
\boxed{
Q(\tau)=\frac1y
\begin{pmatrix}
1&x\\x&x^2+y^2
\end{pmatrix},
\qquad \det Q=1.}
\]

Conversely, every positive-definite symmetric \(2\times2\) matrix of determinant one has a unique representation of this form with \(y>0\). Therefore
\[
\mathbb H
\cong
\{Q=Q^T>0:\det Q=1\}
\cong SL(2,\mathbb R)/SO(2).
\]

This is the important completion step. The upper half-plane is not attached because it is a useful arena for modular forms. It is the space of possible dimensionless shapes of the two-cycle flat torus already used by RSS.

A change of primitive oriented cycle basis is an integer matrix
\[
M\in SL(2,\mathbb Z).
\]
It acts on the Gram matrix by congruence,
\[
Q\mapsto M^TQM,
\]
and on \(\tau\) by a fractional-linear transformation, up to the conventional choice of row versus column marking. Hence the unmarked oriented shape space is
\[
\mathcal M_1=SL(2,\mathbb Z)\backslash\mathbb H.
\]
Orientation-reversing matrices in the existing RSS \(GL(2,\mathbb Z)\) seam formalism add the corresponding reflection/conjugation operation.

A topological torus alone does not select a point of \(\mathbb H\). It supplies the two-cycle lattice; the measured period Gram matrix supplies its shape. This is why \(y\) is an observable to be determined, not a universal constant inferred from topology.

Nor does this require the familiar doughnut embedding to have a globally Euclidean induced metric. A two-phase torus is directly represented as \(\mathbb R^2/\Lambda\). More generally, a measured Riemannian torus determines a conformal structure, and every oriented torus conformal structure has a flat representative \(\mathbb C/(\mathbb Z\oplus\tau\mathbb Z)\), unique after fixing marking and area. The matrix \(Q\) records that conformal/phase shape, not the torus’s extrinsic bending in three-dimensional space.

## 6. Why the metric is intrinsically hyperbolic

### 6.1 A coordinate-free shape-change metric

For an infinitesimal change \(dQ\) of the unit-area shape, define
\[
\boxed{
\langle U,V\rangle_Q
=\frac12\operatorname{tr}
\left(Q^{-1}UQ^{-1}V\right).}
\]
In particular,
\[
ds^2
=\frac12\operatorname{tr}
\left(Q^{-1}dQ\,Q^{-1}dQ\right).
\]

This measures **relative strain** rather than raw coordinate displacement. Multiplication by \(Q^{-1}\) compares a deformation with the current shape itself. It is dimensionless, positive for every non-zero tangent deformation and independent of the basis used to write the two cycles.

Under an area-preserving basis transformation,
\[
Q'=M^TQM,
\qquad
U'=M^TUM,
\qquad
V'=M^TVM,
\]
cyclic invariance of the trace gives
\[
\langle U',V'\rangle_{Q'}
=\langle U,V\rangle_Q.
\]
The companion program verifies this numerically for shear, inversion and a nontrivial determinant-one matrix.

### 6.2 Pullback to \((x,y)\)

Substitute
\[
Q(x,y)=\frac1y
\begin{pmatrix}1&x\\x&x^2+y^2\end{pmatrix}.
\]
The derivatives are
\[
Q_x=\frac1y
\begin{pmatrix}0&1\\1&2x\end{pmatrix},
\]
\[
Q_y=
\begin{pmatrix}
-y^{-2}&-xy^{-2}\\
-xy^{-2}&1-x^2y^{-2}
\end{pmatrix}.
\]
A direct calculation gives
\[
\frac12\operatorname{tr}(Q^{-1}Q_xQ^{-1}Q_x)=\frac1{y^2},
\]
\[
\frac12\operatorname{tr}(Q^{-1}Q_xQ^{-1}Q_y)=0,
\]
\[
\frac12\operatorname{tr}(Q^{-1}Q_yQ^{-1}Q_y)=\frac1{y^2}.
\]
Therefore
\[
\boxed{
ds^2=\frac{dx^2+dy^2}{y^2}.}
\]
This is the Poincaré metric of curvature \(-1\). The computation verifies the formula at four nontrivial shapes in addition to the symbolic derivation. The negative curvature belongs to the **space of shapes**: each individual flat representative \(\mathbb C/\Lambda\) is itself locally Euclidean. Neither statement makes physical spacetime hyperbolic.

For
\[
\gamma z=\frac{az+b}{cz+d},
\qquad ad-bc=1,
\]
one has
\[
\operatorname{Im}(\gamma z)
=\frac{y}{|cz+d|^2},
\qquad
|d(\gamma z)|
=\frac{|dz|}{|cz+d|^2}.
\]
The common denominator cancels, so
\[
\frac{|d(\gamma z)|^2}{\operatorname{Im}(\gamma z)^2}
=\frac{|dz|^2}{y^2}.
\]
The program verifies this tangent-norm identity for nine matrix/point cases.

### 6.3 The exact uniqueness statement

It would be too strong to say that invariance under the **discrete** group \(SL(2,\mathbb Z)\) uniquely determines the metric. It does not. A positive modular-invariant function can be used to make other modular-invariant metrics.

The hyperbolic metric is unique up to an overall scale under the stronger naturality condition:

> unit-area two-cycle shape space is homogeneous under the full continuous \(SL(2,\mathbb R)\) action, and the metric is a smooth Riemannian quadratic form invariant under that action.

At \(Q=I\), the tangent space consists of symmetric traceless matrices
\[
U=
\begin{pmatrix}a&b\\b&-a\end{pmatrix}.
\]
The stabiliser \(SO(2)\) rotates the pair \((a,b)\). Its only invariant positive quadratic form is a constant multiple of \(a^2+b^2\). Transitivity of \(SL(2,\mathbb R)\) carries that inner product to every shape. This proves uniqueness up to scale. The factor \(1/2\) above fixes the conventional curvature \(-1\) normalisation.

RSS motivation for this condition is the absence of a preferred marked unit-area torus shape before measurement and the requirement that equivalent cycle bases describe the same relative deformation. That is a defensible naturality principle, but it should be named. It is stronger than the bare topological statement “there are two cycles.”

Rank two is essential. For \(n>2\), determinant-one shape space becomes \(SL(n,\mathbb R)/SO(n)\), not an ordinary hyperbolic plane. The Poincaré geometry follows specifically from RSS’s two independent cycle/register directions rather than from a generic decision to use complex numbers.

## 7. The projective boundary and the interior must not be conflated

The count ratio and the torus shear have previously both been denoted \(x\). They are related but not identical quantities.

- The recurrence supplies a boundary coordinate
  \[
  \xi=u/v\in\mathbb P^1(\mathbb R).
  \]
- The torus Gram matrix supplies an interior shape coordinate
  \[
  \tau=x+iy\in\mathbb H.
  \]

The relation is geometric:
\[
\partial\mathbb H
=\mathbb P^1(\mathbb R).
\]
Primitive integer pairs label rational boundary directions and primitive torus cycles. Positive-definite matrices \(Q\) fill in the non-degenerate interior shapes. In a degeneration \(y\to0^+\), the real limit \(x\) becomes a projective boundary direction.

But a primitive pair \((u,v)\) does not by itself determine \(y\), or even a unique interior point above its projective direction. A winding class is not a torus shape. The measured Gram matrix supplies the missing interior geometry.

This distinction resolves a possible hidden conflation in the earlier modular report. The modular group acts naturally on both the boundary ledger and the interior shape space, but an RSS state-to-shape map needs both:

1. integer winding/count data; and
2. a positive period Gram matrix.

## 8. What has now been discharged

| Bridge requirement | Outcome |
|---|---|
| Find a two-coordinate ledger already in RSS | **Achieved.** \((F_n,F_{n+1})\) is the recurrence’s adjacent measured multiplicity state. |
| Show that it is minimal | **Achieved with scope stated.** It is minimal for an autonomous local model of the full second-order recurrence family without external \(n\). |
| Recover existing RSS observables | **Achieved.** \(C_n=u+v-1\) and \(\delta\Pi_n=(u+v-1)\varphi^{-n}\). |
| Establish primitivity | **Achieved.** Consecutive Fibonacci entries have gcd one; all \(B_a\) preserve gcd. |
| Explain coordinate exchange | **Achieved as recurrence/Poincaré relabelling and matrix factorisation.** Not yet established as material exchange. |
| Connect to \((p,q)\) winding memory | **Achieved after choosing the RSS circulation/return marking.** Coefficients, period vectors and observables remain distinct. |
| Say what \(y>0\) measures | **Achieved.** It is normalised oriented cell area/transverse return separation. |
| Derive \(\mathbb H\) rather than postulate it | **Achieved.** \(\mathbb H\cong SL(2,\mathbb R)/SO(2)\) is the unit-area marked flat-torus shape space. |
| Derive the Poincaré metric | **Achieved.** It is the pullback of the affine-invariant relative-strain metric on determinant-one Gram matrices. |
| State uniqueness assumptions | **Achieved.** Full continuous homogeneous \(SL(2,\mathbb R)\) invariance is required; discrete modular invariance alone is insufficient. |
| Derive a hyperbolic physical spacetime | **Not claimed and not implied.** The hyperbolic manifold is a state/moduli space. |

The strongest honest verdict is therefore:

> The two former bridge premises no longer need to be abstract mathematical postulates. RSS count data supplies the boundary ledger, and RSS’s two-cycle torus supplies a measurable interior shape variable and its natural state-space metric. What remains is not another algebraic bridge but an empirical identification: show which physical channels carry the two registers and periods, and show by tagged observations that seam passage implements the proposed role exchange.

## 9. Consequence for the previous conditional modular result

The previous conditional theorem can now be restated more concretely.

- Replace the hypothetical integration/residue vector by the adjacent multiplicity ledger \(L_n=(F_n,F_{n+1})\).
- Read its projective ratio as a primitive boundary state.
- Use the marked circulation/return period Gram matrix to complete boundary directions to non-degenerate torus shapes in \(\mathbb H\).
- Quotient changes of primitive cycle basis by \(SL(2,\mathbb Z)\).
- Use the relative-strain metric, which pulls back to the hyperbolic metric.

Under those identifications, the modular lattice, cusp and scattering calculation in `rss-modular-derivation.md` no longer rests on an unexplained generic complex coordinate. Its imaginary direction is torus-shape area/scale separation.

This does not alter the earlier limitations:

- the original finite Fibonacci cycles are not the rational primes;
- the direct closed-geodesic Euler product is Selberg zeta, not Riemann zeta;
- Riemann zeta enters through primitive-versus-repeated lattice scaling and cusp scattering;
- no proof of the Riemann hypothesis follows; and
- no physical spacetime curvature follows from curvature of shape space.

> **Positivity follow-up:** `rss-spectral-positivity-investigation.md` asks whether this modular completion can confine every zeta zero. It derives unconditional positive Gram kernels from integer and prime-power repetitions, identifies the existing \(\kappa_{\rm R}=1/(4\pi^2)\) as the inverse first eigenvalue of the unit-period cusp circle, and obtains the associated positive Green-weighted kernel. These are not yet the RH-equivalent xi Pick kernel. The report also gives an explicit unitary counterfactor showing why scattering symmetry alone cannot supply confinement.

## 10. A falsifiable physical protocol

A physical promotion would require more than observing Fibonacci totals.

1. **Tag consecutive cohorts.** Measure \(m_n\) and \(m_{n+1}\) separately rather than only their sum.
2. **Test the autonomous update.** Verify event by event that
   \[
   (m_n,m_{n+1})\mapsto(m_{n+1},m_n+m_{n+1}).
   \]
3. **Test role exchange, not only arithmetic.** Follow tagged members or a conserved label to determine whether the old current channel becomes the next inherited channel. Aggregate Fibonacci agreement cannot distinguish a real exchange from another mechanism with the same totals.
4. **Identify two periodic observables.** Recover circulation/integration and return phases and demonstrate two independent non-contractible cycle classes.
5. **Measure the period Gram matrix.** Estimate \(|\omega_I|\), \(|\omega_R|\) and their cross-angle or cross-phase; compute \(x\) and \(y\) from the formulas above.
6. **Change the cycle marking.** Verify that an integer basis change alters coordinates but not basis-independent predictions.
7. **Compare deformations.** Under controlled perturbations, test whether relative shape change is described by
   \[
   \tfrac12\operatorname{tr}(Q^{-1}dQ)^2
   \]
   rather than by an arbitrary Euclidean metric in the chosen coordinates.

Failure at steps 1–3 would reject the physical seam ledger while leaving the recurrence mathematics intact. Failure at steps 4–7 would reject the torus-shape promotion while leaving the upper-half-plane theorem intact as geometry.

---

## Reproducibility

From the repository root, run:

```bash
npm run research:rss-bridges
```

The script uses only Node’s standard library and verifies:

- exact Fibonacci shift-register updates for 24 stages;
- exact recovery of cumulative returners and gcd primitivity;
- the factorisation \(B=RT\) and \(R^2=I\);
- 12 general inverse branches \(B_a=RT^a\);
- scale-independent recovery of \(x,y\) from four period Gram matrices;
- \(\det Q=1\);
- all three metric coefficients at four nontrivial shapes;
- congruence invariance under three determinant-one basis changes;
- hyperbolic tangent-norm invariance in nine modular cases; and
- reciprocal cusp scale separation through \(y=10^4\).

## Selected literature

1. Anton Zorich, *Flat Surfaces*, especially the construction of a flat torus from \(x+iy\) and unit-area normalisation: <https://math.uchicago.edu/~masur/zorich_leshouches.pdf>
2. Rich Schwartz, *The Symmetric Space for \(SL_n(\mathbb R)\)*, including determinant-one positive forms, the invariant trace metric and \(SL(2,\mathbb R)/SO(2)\cong\mathbb H\): <https://www.math.brown.edu/reschwar/M2710M/symm.pdf>
3. Förstner and Moonen, *A Metric for Covariance Matrices*, for the canonical affine-invariant metric on positive-definite matrices and its determinant-one restriction: <https://www.ipb.uni-bonn.de/pdfs/Forstner1999Metric.pdf>
4. C. McMullen, *Riemann Surfaces, Dynamics and Geometry*, for \(\mathbb C/(\mathbb Z\oplus\tau\mathbb Z)\), torus moduli and the hyperbolic metric: <https://people.math.harvard.edu/~ctm/papers/home/text/class/notes/rs/course.pdf>
5. Mark Greenfield and Lizhen Ji, “A new modular characterization of the hyperbolic plane,” for unit-area marked flat tori and the resulting hyperbolic metric: <https://arxiv.org/pdf/1707.00818>
