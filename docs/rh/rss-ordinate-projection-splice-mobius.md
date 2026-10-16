# The ordinate splice: two inversions, horizontal residue and arithmetic Möbius extraction

**Tenth-stage investigation — 14 October 2026**  
**Question:** Can the unconditional zero-ordinate projection be expressed as a genuine TTI two-inversion splice, and can its discarded horizontal information be connected to the splice at 1000 and to divisor Möbius extraction on the prime side?  
**Companion program:** `scripts/research-rss-ordinate-splice-residue.mjs`  
**Machine-readable results:** `docs/rh/rss-ordinate-splice-residue-results.json`

## Verdict

Yes at the level of exact operator geometry, and partially at the level of a positive scalar residue.

Center the zero plane at the critical line:
\[
z=\rho-\frac12=\eta+i\gamma.
\]
The functional equation and complex conjugation give two exact involutions
\[
I:z\mapsto-z,
\qquad
C:z\mapsto\overline z.
\]
Their composition is
\[
S=IC:z\mapsto-\overline z,
\qquad
S(\eta,
\gamma)=(-\eta,
\gamma).
\]
Thus \(S\) is precisely reflection across the critical line in centered coordinates. Its complementary orthogonal projectors are
\[
Q_{\rm ord}=\frac{1+S}{2},
\qquad
Q_{\rm hor}=\frac{1-S}{2},
\]
with
\[
Q_{\rm ord}z=i\gamma,
\qquad
Q_{\rm hor}z=\eta.
\]
This is an exact TTI-style two-face splice: the ordinate is the reflection-even state and the horizontal displacement is the reflection-odd residue.

The investigation also derives an exact positive central residue:
\[
\boxed{
H_{\rm ord}'(0)-H'(0)
=
\sum_{\text{off-line upper pairs}}
\frac{4\eta^2(
\eta^2+3\gamma^2)}{
\gamma^2(
\eta^2+
\gamma^2)^2}
=\|B_{\rm hor}\|^2.}
\]
Every summand is nonnegative, the sum converges, and it vanishes if and only if every \(\eta=0\). Therefore
\[
\boxed{
H_{\rm ord}'(0)=H'(0)
\quad\Longleftrightarrow\quad
\mathrm{RH}.}
\]
This is the first independently positive horizontal-residue norm found in the TTI/RSS route.

It does not prove that the norm is zero. Away from the central derivative, the full horizontal correction changes sign in both the real Laplace variable and the time domain. It is therefore not a positive Weil correction term by term.

Arithmetic divisor Möbius inversion remains a different operator. It supplies the primitive prime-power ledger that determines \(H=\xi'/\xi\) through the completed explicit formula, but the inverse return \(ZM=I\) does not force \(B_{\rm hor}=0\). The missing theorem is now especially precise: derive the vanishing of this positive zero-side residue from the completed primitive ledger.

No proof of RH is claimed.

---

## 1. Two exact inversions in the centered zero plane

Let
\[
F(z)=\xi\!\left(\frac12+z\right).
\]
The functional equation \(\xi(s)=\xi(1-s)\) becomes
\[
F(z)=F(-z).
\]
Because \(\xi\) has real coefficients on the real axis,
\[
F(\overline z)=\overline{F(z)}.
\]
Accordingly, a zero \(z=\eta+i\gamma\) occurs with the quartet
\[
\eta+i\gamma,\qquad
-\eta+i\gamma,\qquad
\eta-i\gamma,\qquad
-\eta-i\gamma.
\]
Equivalently, the quartet is \(\{z,-\overline z,\overline z,-z\}\).

On the real coordinate pair \((\eta,\gamma)\), the two involutions have matrices
\[
I=
\begin{pmatrix}-1&0\\0&-1\end{pmatrix},
\qquad
C=
\begin{pmatrix}1&0\\0&-1\end{pmatrix}.
\]
Their composition is
\[
S=IC=
\begin{pmatrix}-1&0\\0&1\end{pmatrix},
\qquad S^2=1.
\]
It keeps an upper-half-plane zero in the upper half-plane and exchanges its two possible horizontal positions:
\[
\eta+i\gamma
\longleftrightarrow
-
\eta+i\gamma.
\]

### 1.1 The reflection projectors

Because \(S\) is an orthogonal involution,
\[
Q_{\rm ord}=rac{1+S}{2}
=
\begin{pmatrix}0&0\\0&1\end{pmatrix},
\]
\[
Q_{\rm hor}=rac{1-S}{2}
=
\begin{pmatrix}1&0\\0&0\end{pmatrix}.
\]
They satisfy
\[
Q_{\rm ord}^2=Q_{\rm ord},
\qquad
Q_{\rm hor}^2=Q_{\rm hor},
\qquad
Q_{\rm ord}Q_{\rm hor}=0,
\qquad
Q_{\rm ord}+Q_{\rm hor}=1.
\]
The zero state decomposes uniquely as
\[
z=i\gamma+\eta.
\]
The ordinate projection used in the ninth-stage channel survey is therefore not an arbitrary act of deleting \(\beta\). It is the even spectral projector of the exact composition of the functional and conjugation inversions.

## 2. The upper-pair splice is a Hadamard transform

Take the two upper-half-plane members
\[
z_+=\eta+i\gamma,
\qquad
z_-=Sz_+=-
\eta+i\gamma.
\]
Apply the normalized sum-and-difference transform
\[
\begin{pmatrix}q\\r\end{pmatrix}
=
\frac1{\sqrt2}
\begin{pmatrix}1&1\\1&-1\end{pmatrix}
\begin{pmatrix}z_+\\z_-\end{pmatrix}.
\]
Then
\[
q=\sqrt2\,i\gamma,
\qquad
r=\sqrt2\,\eta.
\]
This is an orthogonal splice, so
\[
|z_+|^2+|z_-|^2
=|q|^2+|r|^2
=2\gamma^2+2\eta^2.
\]

The ordinate channel is what remains after the pair is symmetrized. The horizontal channel records exactly what symmetrization removes. Under RH,
\[
r=0
\]
for every pair.

### 2.1 Relation to the splice at 1000

TTI’s third decimal splice has Fibonacci multiplicity
\[
F_3=2.
\]
That count structurally matches the two upper-half-plane members \(z_+\) and \(z_-\) needed by the Hadamard splice. It makes the following interpretation coherent:

- the phase-like ordinate \(\gamma\) is the continued symmetric channel;
- the real displacement \(\eta\) is the returned or history-bearing channel;
- the third splice separates the two rather than applying another inverse to the same state.

This is an analogy backed by exact zero-plane algebra. It is not a derivation of zeta zeros from the Fibonacci count or from the number 1000. The arithmetic splice rule and the zeta quartet remain independently defined structures.

## 3. The exact quartet defect

Set
\[
H(w)=\frac{\xi'}{\xi}\!\left(\frac12+w\right).
\]
For an off-line upper zero \(a=\eta+i\gamma\), the completed quartet contributes
\[
H_q(w)
=
\frac{2w}{w^2-a^2}
+
\frac{2w}{w^2-\overline a^{\,2}}.
\]
If both upper members are projected onto the critical line at the same ordinate, their contribution becomes
\[
H_{{\rm ord},q}(w)
=
\frac{4w}{w^2+\gamma^2}.
\]
Direct simplification gives
\[
\boxed{
H_q(w)-H_{{\rm ord},q}(w)
=
\frac{
4w\eta^2(w^2-
\eta^2-3\gamma^2)}{
(w^2+
\gamma^2)
\left[(w^2-
\eta^2+
\gamma^2)^2+4\eta^2
\gamma^2\right]}.}
\]
The verifier checks this identity in 72 parameter combinations with maximum floating error below \(2.9\times10^{-17}\).

### 3.1 The full defect is signed

For \(w>0\), every denominator in the displayed expression is positive. The sign changes at
\[
w=\sqrt{
\eta^2+3\gamma^2}.
\]
It is negative below that point and positive above it. Thus the horizontal correction is not a positive-real or completely monotone contribution by itself.

The corresponding time-domain quartet potential is
\[
4\operatorname{Re}
\frac{\cosh((
\eta+i\gamma)t)-1}{(
\eta+i\gamma)^2},
\]
while its projected version is
\[
4\frac{1-
\cos(
\gamma t)}{
\gamma^2}.
\]
Their difference also changes sign. The script tests admissible hypothetical displacements \(\eta=0.1,0.25,0.49\) at \(\gamma=14.134725\ldots\).

This confirms the ninth-stage warning: the ordinate projection is positive, but an off-line correction cannot be restored as one additional positive time-domain feature per zero.

## 4. A positive residue appears at the central seam

Although the full defect is signed, its first derivative at the symmetry centre has a fixed sign. Differentiating at \(w=0\) gives
\[
H_{{\rm ord},q}'(0)-H_q'(0)
=
\frac{4\eta^2(
\eta^2+3\gamma^2)}{
\gamma^2(
\eta^2+
\gamma^2)^2}
>0
\]
for every \(\eta\ne0\).

Define the horizontal residue feature
\[
oxed{
r_{
\eta,
\gamma}
=
\frac{2
\eta\sqrt{
\eta^2+3\gamma^2}}{
\gamma(
\eta^2+
\gamma^2)}.}
\]
Then
\[
|r_{
\eta,
\gamma}|^2
=
H_{{\rm ord},q}'(0)-H_q'(0).
\]
Summing once over each off-line upper pair,
\[
\boxed{
\mathcal R_{
\rm hor}
:=H_{
\rm ord}'(0)-H'(0)
=
\sum_{
\rm quartets}
|r_{
\eta,
\gamma}|^2.}
\]
The sum converges because \(|\eta|<1/2\) and the zero count grows like \(T\log T\), while each large-\(\gamma\) term is \(O(\eta^2/\gamma^4)\).

Therefore
\[
\mathcal R_{
\rm hor}
\ge0,
\]
and
\[
\mathcal R_{
\rm hor}=0
\quad\Longleftrightarrow\quad
\eta=0\text{ for every zero}
\quad\Longleftrightarrow\quad
\mathrm{RH}.
\]

This does not infer RH from positivity: positivity holds whether or not RH is true. RH is the stronger assertion that the independently nonnegative residue is exactly zero.

### 4.1 A zero-counting formulation

The projected derivative is determined by the unconditional ordinate-counting measure:
\[
H_{
\rm ord}'(0)
=
2\sum_{
\rho:\,
\gamma>0}
\frac{m(
\rho)}{
\gamma^2}
=
2\int_0^
\infty
\frac{dN(T)}{T^2}.
\]
After integration by parts, with the lower interval containing no zero,
\[
H_{
\rm ord}'(0)
=
4\int_0^
\infty
\frac{N(T)}{T^3}
\,dT.
\]
The exact centered curvature is
\[
H'(0)
=(\log\xi)''\!\left(\frac12\right).
\]
Hence RH is equivalent to the scalar identity
\[
oxed{
4\int_0^
\infty
\frac{N(T)}{T^3}
\,dT
=
(
\log\xi)''\!\left(\frac12\right).}
\]
The left side uses every zero ordinate whether or not its real part is \(1/2\); the right side uses the complete xi function. Their difference is the positive horizontal residue norm.

## 5. How this differs from arithmetic Möbius inversion

The word “inversion” now refers to three distinct operations.

### Geometric zero-plane inversions

\[
I:z\mapsto-z,
\qquad
C:z\mapsto\overline z,
\qquad
S=IC:z\mapsto-\overline z.
\]
These act on zero locations and yield the orthogonal ordinate/horizontal projectors.

### Arithmetic primitive extraction

\[
M a=\mu*a,
\qquad
Z a=\mathbf1*a,
\qquad
ZM=MZ=1.
\]
These act on divisor-indexed coefficients. In particular,
\[
M(
\log)(n)=\Lambda(n).
\]

### The completed explicit-formula bridge

The two sides meet only after the archimedean completion and transform:
\[
\boxed{
\log n
\xrightarrow{
M}
\Lambda(n)
\xrightarrow{
\text{hinges}+A}
\Psi(t)
\xrightarrow{
\mathcal L}
H(w)=\frac{
\xi'}{
\xi}\!\left(\frac12+w\right)
\xleftrightarrow{
\text{Hadamard}}
\{\eta+i\gamma\}.}
\]
The explicit formula states that the completed primitive prime history and the completed zero spectrum describe the same analytic function. It does not make \(M\) equal to \(S\).

The arithmetic second face \(Z\) restores the all-integer logarithmic ledger:
\[
ZM(
\log)=
\log.
\]
That return does not imply
\[
Q_{
\rm hor}z=0.
\]
In TTI language, the visible ledger can return while a horizontal zero-space residue remains.

## 6. A precise TTI interpretation

The result permits a disciplined structural reading of the three splice levels:

| TTI threshold | Candidate mathematical role | Status |
|---:|---|---|
| \(10\) | real/localised displacement, analogous to \(\eta\) | analogy only |
| \(100\) | phase or ordinate channel \(\gamma\) | analogy supported by the existing phase interpretation |
| \(1000\) | reflection splice separating the symmetric ordinate from horizontal history | exact zero-plane algebra; physical role conjectural |

The strongest statement is not that decimal thresholds cause zeta zeros. It is this:

> TTI’s “return plus residue” architecture has an exact realization in the centered xi zero plane. The composed inversion returns the ordinate channel while the antisymmetric horizontal coordinate records failure to lie on the fixed seam.

At the third splice, the normalized pair transform conserves total pair energy and places all off-seam information in one residue coordinate. This is a mathematically clean carrier for the idea; the base-ten assignment remains TTI’s interpretation rather than a theorem of analytic number theory.

## 7. Relation to the Weil kernel

The unconditional ordinate Gram kernel is
\[
D_{
\rm ord}(t,u)
=
\sum_{
\rho:\,
\gamma>0}
\frac{2m(
\rho)}{
\gamma^2}
(e^{i
\gamma t}-1)(e^{-i
\gamma u}-1).
\]
Define the exact defect
\[
E(t,u)=G_g(t,u)-D_{
\rm ord}(t,u).
\]
Then
\[
E=0
\quad\Longleftrightarrow\quad
\mathrm{RH}.
\]
Under the corresponding Laplace/logarithmic-derivative transform, the central slope difference is the negative horizontal norm,
\[
H'(0)-H_{\rm ord}'(0)=-\mathcal R_{\rm hor}.
\]
But \(E(t,u)\) is not PSD or negative semidefinite term by term for an off-line quartet. Thus the new scalar norm does not automatically lift to a full-domain Weil factorization.

A complete route would have to prove one of:
\[
\mathcal R_{
\rm hor}=0,
\]
\[
H_{
\rm ord}(w)=H(w)
\quad\text{throughout a determining domain},
\]
or
\[
D_{
\rm ord}(t,u)=G_g(t,u)
\quad\text{for every real }t,u.
\]
Each is RH-equivalent. The first is now a positive zero-residue statement with an explicit norm.

## 8. What the splice/Möbius link contributes

The combined picture is
\[
\begin{array}{ccccc}
\text{repetition ledger}
&\xrightarrow{M}&
\text{primitive prime history}
&\xrightarrow{\text{completion}}&
H(w)\\[4pt]
&&&&\updownarrow\\[-2pt]
\text{all-integer return}
&\xleftarrow{Z}&
\text{signed extraction}
&&
\text{ordinate}\oplus\text{horizontal residue}.
\end{array}
\]
The first line is arithmetic. The final split is the geometric two-inversion splice. The explicit formula is the bridge.

This makes the outstanding theorem more specific than “find another positive kernel”:

> **Primitive-to-horizontal extinction theorem.** Show from the completed Möbius-extracted prime ledger, without assuming RH, that the horizontal residue norm \(\mathcal R_{\rm hor}\) vanishes.

The theorem would have to use global cancellation. Merely applying \(Z\), squaring Möbius signs, or transporting a metric cannot make a nonzero \(\eta\) vanish.

## 9. Final assessment

The ordinate projection links to TTI more directly than the decimal spectral tower did.

- Functional inversion and conjugation are two exact involutions.
- Their composition is reflection across the critical seam.
- The sum/difference splice separates phase-like ordinate from horizontal residue.
- The third-splice multiplicity two has the correct pair architecture, though not a derived zeta meaning.
- The horizontal residue has an exact positive central norm.
- Arithmetic Möbius extraction supplies the prime history whose completed transform must extinguish that residue.

What remains unproved is not the existence or positivity of the scalar residue. It is its vanishing. The full time-domain defect remains signed, so the result does not yet equal the Weil norm on every test function.

The [third-density bounce follow-up](./rss-third-density-bounce.md) tests whether 999, 666, 333 and the missing-one carry supply that vanishing mechanism. Their exact dynamics are periodic permutations: the carry gives \(T^3(n)=n-1\pmod{1000}\), not damping. A separately postulated strict horizontal contraction would force RH by isolation of xi zeros, but the splice arithmetic does not derive that zero-set symmetry.

## 10. Critical-energy application note

The later [critical Chebyshev-energy theorem](./rss-critical-chebyshev-energy.md) gives the requested primitive-to-horizontal extinction only conditionally on its unproved estimate. Its weighted Mellin norms exclude every zero in \(\Re s>1/2\); functional symmetry then gives \(\eta=0\) for every zero. Consequently
\[
\mathcal R_{\rm hor}=0,
\qquad
D_{\rm ord}=G_g.
\]
This applies one prime-side norm to the exact projector decomposition, but does not derive that norm from Möbius inversion or splice arithmetic. The [spin–colour follow-up](./rss-energy-spin-colour.md) identifies the same scalar obstruction as the internal singlet channel.

