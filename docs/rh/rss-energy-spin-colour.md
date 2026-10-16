# Applying critical energy and testing spin–colour channels

**Twenty-fifth-stage investigation — 15 October 2026**  
**Questions:**

1. What does the critical Chebyshev-energy theorem do to every earlier RH object?
2. Could physical spin or colour supply the missing estimate or alter the seam contraction?

**Companion program:** `scripts/research-rss-energy-spin-colour.py`  
**Machine-readable results:** `docs/rh/rss-energy-spin-colour-results.json`

## Verdict

The critical energy estimate closes all of the earlier **exact zeta-side** obligations, but only conditionally because that estimate remains unproved. If
\[
\forall\delta>0,
\qquad
\int_X^{2X}|\psi(x)-x|^2dx
\ll_\delta X^{2+\delta},
\tag{CE}
\]
then the prime–Laguerre coefficients are subexponential, the generalized Li disk has radius one, RH follows, every horizontal zero residue vanishes, every two-ended seam factor is one and the positive ordinate channel equals the exact Weil channel.

This does **not** prove that the finite splice completions are real-rooted, derive a splice clock, or determine a physical action or constant. It closes downstream RH-equivalent objects after assuming the one missing arithmetic estimate.

Spin and colour can organize a future matrix-valued ledger, but simple multiplicity does not help. A spin doublet and colour triplet give a six-dimensional internal space. If those are internal states of each arithmetic carrier, a colour- and spin-blind scalar trace sees only the singlet channel. Repeating the same scalar coefficient six times multiplies it by six but leaves its root-test radius unchanged.

If instead the six states are interpreted as six distinct spectral descendants, a new obstruction appears. The earlier seam theorem proves strict contraction for at most four half-displacement descendants. Six descendants do not contract uniformly. At displacement \(\eta=1/4\), their total defect is larger than the parent defect, and universal contraction returns only for \(|\eta|>0.424141195855\ldots\).

Thus spin and colour matter chiefly by forcing the model to distinguish **internal degeneracy** from **spectral branching**. Neither reading proves (CE), and no physical spin–colour coupling has been derived from the prime ledger. RH remains open.

---

## 1. Applying critical energy to the previous programme

The weighted form of (CE) is
\[
I_\varepsilon
=
\int_1^\infty
|\psi(x)-(x-1)|^2x^{-2-2\varepsilon}dx
<\infty
\qquad(\varepsilon>0).
\]
The preceding stage proves that this one family of norms reaches every later zeta-side object.

| Previous object | Consequence of (CE) | Scope |
|---|---|---|
| Signed Chebyshev–Laguerre transform | \(p_n=e^{o(n)}\) | Direct Hilbert-space estimate |
| Endpoint-completed generalized Li series | Radius at least one | No mapped zeta zero lies inside the disk |
| Nontrivial zeta divisor | Every zero has \(\Re\rho=1/2\) | Mellin continuation plus functional symmetry |
| Horizontal residue norm | \(\mathcal R_{\rm hor}=0\) | Conditional through RH |
| Two-ended Poisson product | \(P_a(+1)P_a(-1)=1\) for every zero | Every \(\eta=0\) |
| Seam determinant | \(\Delta=1\), total defect \(E=0\) | Conditional through RH |
| Ordinate projection | \(D_{\rm ord}=G_g\) | Horizontal correction vanishes |
| Weil/Suzuki positivity target | Exact RH-equivalent positivity holds | Conditional through RH |
| Same-xi horizontal halving | Acts trivially because all displacements already vanish | Consequence, not a dynamical derivation |

This is the first complete implication chain from one positive prime norm through the Laguerre controller to every seam and residue formulation:
\[
\boxed{
\text{critical prime energy}
\Longrightarrow
p_n=e^{o(n)}
\Longrightarrow
\mathrm{RH}
\Longrightarrow
\mathcal R_{\rm hor}=0,
\quad \Delta=1,
\quad D_{\rm ord}=G_g.
}
\]

The first premise has not been proved. The chain therefore organizes the previous work; it does not upgrade its epistemic status.

## 2. What critical energy does not supply

Several previous constructions are not merely restatements of the exact zeta divisor.

### Finite theta completions

The estimate concerns \(\psi\), \(\zeta\) and the exact limiting xi function. It says nothing by itself about whether each finite carrier completion \(\Xi_N\) has only critical-line zeros. It also does not derive a uniform shrinking strip for those approximants.

Once RH follows, the **limit** has only critical-line zeros. That does not retroactively make every approximating entire function real-rooted. Local uniform convergence still permits nonreal zeros to move or escape unless additional real-rootedness and zero-accounting hypotheses are supplied.

### Splice clocks and genealogy

No relationship between golden depths, local catch-up clocks and prime energy follows from (CE). The theorem also does not produce a parent map for zeros. Same-xi halving becomes vacuous after RH because every horizontal displacement is already zero; it is not derived as a physical or arithmetic evolution law.

### Physical constants

The estimate is dimensionless arithmetic. It supplies no spacetime action, unit-bearing scale, gauge-field normalization, charge lattice or galactic radius. Those four physical gates remain exactly where the earlier audit placed them.

## 3. What “spin and colour” could mean mathematically

Physical labels cannot be inserted as unexplained multiplicities. The narrow standard representation model is
\[
V_{\rm spin}=\mathbb C^2,
\qquad
V_{\rm colour}=\mathbb C^3,
\qquad
V=V_{\rm spin}\otimes V_{\rm colour},
\]
so
\[
\dim V=2\cdot3=6.
\]

The corresponding operator space decomposes under \(SU(2)\times SU(3)\) as
\[
\operatorname{End}(V)
=(\mathbf1,\mathbf1)
\oplus(\mathbf3,\mathbf1)
\oplus(\mathbf1,\mathbf8)
\oplus(\mathbf3,\mathbf8).
\]
The dimensions are
\[
1+3+8+24=36.
\]

A normalized scalar trace sees only the \((\mathbf1,\mathbf1)\) singlet. Pauli matrices and the eight colour generators are traceless. Thus an uncoupled scalar zeta completion cannot see spin polarization or colour orientation; it sees only the common singlet coefficient.

### Relation to the earlier ternary model

The earlier state-only interpretation used
\[
\mathbb Z_3=\{1,\omega,\omega^2\}.
\]
This can resemble the centre or triality shadow of \(SU(3)\), whose centre is \(\mathbb Z_3\). It is not the full colour group. Three cyclic phases do not derive eight gauge generators, a local connection, gluon dynamics or confinement.

### Relation to the earlier quaternary model

The earlier four-state alternatives do not derive spin. The fundamental spin representation is a two-dimensional \(SU(2)\) doublet and its centre is \(\mathbb Z_2\), not \(\mathbb Z_4\). Four states could arise from spin combined with another binary label, but that tensor-product ontology and its coupling would have to be derived independently.

## 4. The singlet bottleneck

Suppose a matrix-valued prime error were constructed on a \(d\)-dimensional internal space. Decompose it as
\[
\boldsymbol E(x)
=E(x)I_d+oldsymbol E_0(x),
\qquad
\operatorname{Tr}\boldsymbol E_0(x)=0.
\]
The Hilbert–Schmidt norm obeys the exact Pythagorean identity
\[
\boxed{
\|\boldsymbol E(x)\|_{\rm HS}^2
=d|E(x)|^2+
\|\boldsymbol E_0(x)\|_{\rm HS}^2.
}
\]
Equivalently,
\[
\left|\frac1d\operatorname{Tr}\boldsymbol E(x)\right|^2
\le
\frac1d\|\boldsymbol E(x)\|_{\rm HS}^2.
\]

A natural spin–colour theorem would be
\[
\boxed{
\forall\delta>0,
\qquad
\int_X^{2X}
\|\boldsymbol\psi(x)-xI_6\|_{\rm HS}^2dx
\ll_\delta X^{2+\delta}.
}
\tag{SCE}
\]
If the normalized trace recovers \(\psi(x)\), then (SCE) implies the scalar theorem (CE).

This does not make the problem easier. It makes it stronger. The nonsinglet channels add a nonnegative term; they cannot cancel the singlet energy in a Hilbert norm. Proving excellent colour-octet or spin-triplet cancellation while leaving the singlet uncontrolled would not settle RH.

This is the **singlet bottleneck**:
\[
\boxed{
\text{all scalar zeta obstruction remains in }(\mathbf1,\mathbf1).
}
\]

## 5. Why degeneracy does not change the coefficient radius

If every scalar prime–Laguerre channel is simply repeated \(d\) times, a log determinant or unnormalized trace changes
\[
p_n\longmapsto d p_n.
\]
But
\[
|d p_n|^{1/n}=d^{1/n}|p_n|^{1/n},
\qquad
d^{1/n}\longrightarrow1.
\]
Therefore
\[
\limsup_{n\to\infty}|d p_n|^{1/n}
=
\limsup_{n\to\infty}|p_n|^{1/n}.
\]

For spin, colour and their product, \(d=2,3,6\). None changes the generalized Li radius. Multiplicity changes amplitudes and zero multiplicities, not the location of the nearest singularity.

Likewise, assigning unitary spin or colour phases does not reduce a positive energy. Orthogonal channel energies add by Pythagoras. A signed boson–fermion supertrace could cancel amplitudes, but it is indefinite and does not provide the positive \(L^2\) norm required by the Mellin Cauchy–Schwarz argument. Invoking such a cancellation without an exact supersymmetric identity would replace the theorem with another unproved sign assumption.

## 6. Internal degeneracy versus spectral descendants

The two-ended seam defect is
\[
\varepsilon(\eta)
=-2\log\cos(\pi\eta).
\]
The earlier result proves
\[
4\varepsilon(\eta/2)<\varepsilon(\eta)
\qquad(0<|\eta|<1/2).
\]
Hence one, two, three or four half-displacement descendants contract the defect.

Spin and colour introduce a possible six-state count. Two interpretations must not be conflated.

### Six internal states of one zero

If the same sixfold internal degeneracy is present before and after halving, compare
\[
6\varepsilon(\eta)
\quad\text{with}\quad
6\varepsilon(\eta/2).
\]
The common factor cancels, and strict contraction follows from the monotonicity of \(\varepsilon\). Internal state multiplicity causes no branching obstruction.

### Six distinct descendant zeros

If one parent zero instead produces six separate zeros at half displacement, the comparison is
\[
\varepsilon(\eta)
\quad\text{versus}\quad
6\varepsilon(\eta/2).
\]
At \(\eta=1/4\),
\[
\varepsilon(1/4)=\log2
=0.6931471806\ldots,
\]
while
\[
6\varepsilon(1/8)
=0.950083\ldots>
\varepsilon(1/4).
\]
The defect expands.

The unique positive threshold solving
\[
\varepsilon(\eta)=6\varepsilon(\eta/2)
\]
is
\[
\boxed{
\eta_6=0.424141195855\ldots.
}
\]
Thus six half-displacement descendants:

- expand the seam defect for \(0<|\eta|<\eta_6\);
- balance at \(|\eta|=\eta_6\); and
- contract only for \(\eta_6<|\eta|<1/2\).

Since hypothetical zeta displacements can be arbitrarily small, six-way spectral branching cannot support a uniform contraction proof. This extends the earlier warning that carrier multiplicity must not be promoted silently to zero multiplicity.

## 7. Could colour-weighted primes create a new route?

A genuinely non-Abelian arithmetic model would attach matrices to prime events, producing Euler factors schematically of the form
\[
\det(I-U_p p^{-s})^{-1},
\qquad U_p\in SU(2)\times SU(3).
\]
Such data lead to matrix Euler products or additional \(L\)-function-like sectors. This is mathematically coherent only after the prime-to-representation map, local gauge law and completion are specified.

If the original zeta factor is retained in the singlet sector, its critical-energy obstruction remains. Proving critical energy for every added sector would normally demand zero control for additional completed \(L\)-functions, making the claim stronger than RH rather than providing a shortcut to it.

Nonprincipal channels may exhibit useful cancellation, but they do not remove the principal singlet. A complete construction must show how the scalar prime ledger is recovered and then prove the singlet estimate without defining the internal weights from the desired answer.

No such prime-to-spin or prime-to-colour representation has been derived in TTI.

## 8. Determination

Applying critical energy produces a clean conditional closure:
\[
\text{one all-scale prime norm}
\Longrightarrow
\text{all exact zeta-side residues vanish}.
\]
It leaves the finite splice ontology and the physical gates untouched.

Spin and colour sharpen that ontology in three useful ways:

1. they distinguish internal state degeneracy from new spectral descendants;
2. they identify the scalar singlet as the surviving arithmetic obstruction;
3. they show that a six-way descendant reading exceeds the existing four-branch contraction theorem.

A legitimate next theorem would require a non-circular matrix-valued prime ledger and a proof of critical energy for its singlet component. Merely multiplying carriers by two, three or six, summing roots of unity, or tracing over internal states does not supply that proof.

Spin and colour may therefore play a structural role, but no present calculation promotes them into an RH proof or a physical derivation. RH remains open.

## 9. Universal-π application note

The later [universal-π audit](./rss-universal-pi-coupling.md) identifies exact phase geometry behind the internal groups: a \(2\pi\) spinor rotation gives the central \(SU(2)\) phase \(e^{i\pi}=-1\), while the \(SU(3)\) centre uses \(e^{2\pi i k/3}\). Scalar singlets remove these central phases, so their presence does not alter the Hilbert–Schmidt singlet decomposition or prove critical energy.

A common \(\pi\)-register is also separable rather than quantum-entangled. Number-dependent register states would require a declared Hilbert space, dynamics and prime-recovery observable.

