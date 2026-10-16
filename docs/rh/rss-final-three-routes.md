# The final three routes: cancellation, interlacing and a seam divisor

**Nineteenth-stage investigation — 15 October 2026**  
**Question:** Can the three narrowest surviving targets be constructed rather than left as abstract proof obligations?  
**Companion program:** `scripts/research-rss-final-three-routes.mjs`  
**Machine-readable results:** `docs/rh/rss-final-three-routes-results.json`

## Verdict

Two routes fail in their current form, while the third produces a genuinely new object but not a proof.

1. **Completed-ledger cancellation:** the nonzero \(p=2\) curvature can be cancelled formally by a zero-free Gaussian factor, but that factor raises the completed function from order one to order two. A zero-free factor that preserves order one has logarithmic second derivative zero and cannot cancel the correction. Any order-one alternative with nonzero curvature must add zeros or poles, so its residue reservoir is not empty.
2. **Canonical interlacing:** on the positive spectral axis, the tested \(N=14\) and \(N=20\) deficit-halving completions do not strictly interlace. The current stage refinement therefore cannot be promoted directly to a Sturm or Obreschkoff chain.
3. **Seam divisor:** the critical strip can be mapped conformally to the unit disk. The complete zeta-zero divisor then satisfies the Blaschke condition, so every zero entering from infinite height is represented by a convergent analytic product. Moreover, the hyperbolic distance of a mapped zero from the real diameter depends only on its horizontal displacement and does not decay with height. This constructs the requested seam accounting and a coercive horizontal marker.

The remaining gap is control. Symmetric Blaschke products may contain off-real zero pairs. No current prime-side or theta-kernel estimate forces the supremum hyperbolic distance of the divisor to vanish.

No proof of RH is obtained.

---

## 1. Exact completed-ledger cancellation within order one

The dyadic multiplier contributes
\[
L_2''\!\left(\frac12\right)
=
-3.960201560771\ldots
\]
to the central logarithmic curvature.

### 1.1 A formal cancellation can be manufactured

Let
\[
z=s-\frac12.
\]
The zero-free factor
\[
G_c(s)=e^{cz^2}
\]
has
\[
\frac{d^2}{ds^2}\log G_c(s)=2c.
\]
Choosing
\[
c=1.980100780386\ldots
\]
cancels the single \(p=2\) correction algebraically. A symmetrized pair of dyadic factors has twice the correction and requires
\[
c=3.960201560771\ldots.
\]

This is an exact counterterm, but it is chosen from the defect rather than derived from the completed arithmetic.

### 1.2 Why the Gaussian is not an admissible solution

The Riemann xi function is entire of order one. Multiplying it by \(e^{cz^2}\) produces an order-two function. The zero set is unchanged, but the Hadamard growth class and the central logarithmic-derivative bookkeeping have changed.

This matters because the positive central residue identity belongs to the order-one canonical completion. An order-two Gaussian inserts precisely the extra quadratic exponential term that the order-one Hadamard factorization excludes.

### 1.3 A zero-free order-one factor cannot do the job

A zero-free entire function of finite order at most one has the form
\[
E(s)=e^{a+bs}.
\]
Therefore
\[
\frac{d^2}{ds^2}\log E(s)=0.
\]
No zero-free order-one multiplier can cancel a nonzero central curvature correction.

The alternatives are exhaustive:

- a zero-free quadratic counterterm cancels the curvature but raises the order;
- an order-one factor with nonzero curvature must introduce zeros or poles and hence a nonempty divisor reservoir;
- a zero-free order-one factor preserves the divisor and order but supplies no curvature.

### Route 1 determination

Within the order-one completed class and with the xi divisor fixed, the requested cancellation is impossible by a zero-free multiplier. A successful identity would have to reorganize existing prime, gamma and zero terms internally rather than append a counterterm. No such identity was found.

## 2. Interlacing of canonical theta refinements

A real-rootedness-preserving refinement chain would ideally satisfy strict interlacing between consecutive stages.

### 2.1 The first tested stage pair

For the zeroth-seed deficit-halving completion, the first positive roots are
\[
N=14:
\quad
14.76029885,
\quad
16.80644586,
\]
and
\[
N=20:
\quad
14.15896815,
\quad
20.06317393.
\]
Sorting the positive roots gives the family pattern
\[
20,
14,
14,
20,
\]
where each number denotes the stage supplying that root. The positive axis is the nontrivial comparison: on the full symmetric line, any two even functions without a zero at the origin also have a same-family central pair for parity reasons.

Adjacent positive roots from stage 14 occur. The roots do not alternate, so the two stages do not strictly interlace.

### 2.2 Consequence for positive refinements

For polynomials, the Obreschkoff theory explains why interlacing allows all real linear combinations to remain real-rooted. The same structural principle motivates entire-function and Sturm-chain approaches. Without interlacing, positive updates can create nonreal zeros, as demonstrated by the previous stage’s explicit half-sum counterexample.

The tested failure does not prove that no finer refinement can work. Stage \(14\) to stage \(20\) changes many coefficients and clocks at once. One could seek carrier-sized microsteps with a common differential or Hermite–Biehler structure.

But that structure must be constructed. The current canonical stage sequence is not already an interlacing chain.

### Route 2 determination

The naive interlacing theorem is false for the tested canonical refinements. The remaining version is narrower:

> Find a new carrier-by-carrier refinement whose transforms form a Sturm or Hermite–Biehler chain and whose accumulated update equals the canonical theta completion.

No such micro-refinement has been derived.

## 3. Constructing the seam divisor

The seam route can be advanced further than the previous audit suggested.

### 3.1 Map the critical strip to the right half-plane

Write
\[
z=s-\frac12=\eta+i\gamma,
\qquad
|\eta|<\frac12.
\]
Define
\[
q=e^{i\pi z}
=e^{-\pi\gamma}e^{i\pi\eta}.
\]
Because \(|\eta|<1/2\),
\[
\Re q=e^{-\pi\gamma}\cos(\pi\eta)>0.
\]
Thus \(q\) lies in the right half-plane.

The critical line \(\eta=0\) maps to the positive real axis. Positive height tends to \(q=0\), while negative height tends to infinity.

### 3.2 Map the half-plane to the unit disk

Apply the Cayley map
\[
w=\frac{q-1}{q+1}.
\]
Then
\[
\gamma\to+\infty
\quad\Longrightarrow\quad
w\to-1,
\]
and
\[
\gamma\to-\infty
\quad\Longrightarrow\quad
w\to+1.
\]
The critical line maps to the real diameter \((-1,1)\).

The inverse formulas are exact:
\[
q=\frac{1+w}{1-w},
\]
\[
\eta
=
\frac1\pi
\arg\!\left(\frac{1+w}{1-w}\right),
\qquad
\gamma
=
-\frac1\pi
\log\left|\frac{1+w}{1-w}\right|.
\]

The horizontal displacement is therefore retained in the angular approach to the seam rather than lost when \(w\to\pm1\).

### 3.3 The zeta-zero divisor satisfies the Blaschke condition

For the Cayley map,
\[
1-|w|^2
=
\frac{4\Re q}{|1+q|^2}.
\]
At large positive height,
\[
1-|w|
=O\!\left(e^{-\pi\gamma}\cos(\pi\eta)\right).
\]
The number of nontrivial zeros through height \(T\) is \(O(T\log T)\). Exponential decay therefore dominates zero density, giving
\[
\sum_\rho(1-|w_\rho|)<\infty.
\]

The mapped zeros define a convergent Blaschke product
\[
B(w)
=
\prod_a
\frac{|a|}{a}
\frac{a-w}{1-\bar a w},
\]
with the usual adjustment if a zero occurs at the origin. Functional and conjugation symmetries can be represented by grouping the disk zeros into their symmetric orbits.

This is a genuine seam divisor. Zeros entering from arbitrarily large height are not omitted; they accumulate at the disk boundary while the product remains analytic inside the disk.

## 4. A coercive horizontal seam norm

The right-half-plane hyperbolic metric is
\[
ds=\frac{|dq|}{\Re q}.
\]
The positive real axis represents the critical line. For
\[
q=re^{i\theta},
\qquad
\theta=\pi\eta,
\]
the hyperbolic distance to that axis is
\[
d_{\rm seam}
=
\int_0^{|\theta|}\frac{d\phi}{\cos\phi}
=
\operatorname{artanh}(|\sin\theta|).
\]
Therefore
\[
\boxed{
d_{\rm seam}(\rho)
=
\operatorname{artanh}(|\sin(\pi\eta)|).}
\]

This quantity has the required properties:

- it is independent of \(\gamma\);
- it is zero exactly when \(\eta=0\);
- it remains positive as \(|\gamma|\to\infty\);
- it strictly decreases when \(|\eta|\) is halved.

For the escaping quartet displacement \(\eta=1/4\),
\[
d_{\rm seam}
=
\operatorname{artanh}\left(\frac1{\sqrt2}\right)
=
\operatorname{arsinh}(1)
=
0.881373587020\ldots
\]
at every height.

Thus the compactified divisor no longer hides the quartet. It reaches the boundary with a fixed positive hyperbolic mark.

## 5. Why the seam construction still does not prove RH

Every symmetric off-real zero family also defines a valid Blaschke product. The Blaschke condition controls radial mass
\[
\sum(1-|a|),
\]
not the supremum transverse distance
\[
\mathcal S
=
\sup_{a\in Z(B)}d_{\rm seam}(a,(-1,1)).
\]

The desired conclusion is
\[
\mathcal S=0.
\]
Neither bounded analyticity of \(B\), its inner boundary behavior nor real symmetry forces all its zeros onto the real diameter. Conjugate off-real pairs are fully compatible with those properties.

The newly constructed seam object therefore solves two earlier problems:

- it accounts for the complete infinite divisor;
- it retains a coercive, height-independent measure of horizontal displacement.

It does not solve the control problem. TTI still needs a prime-side or kernel-side theorem implying
\[
\sup_{a\in Z(B_N)}d_{\rm seam}(a,(-1,1))
\longrightarrow0

to close the finite-stage route, or that this supremum is already zero for the exact xi divisor.

## 6. Determination

The three requested attempts now have sharper outcomes:

### Completed ledger

No zero-free order-one counterterm can cancel the dyadic curvature. A Gaussian can do so only by raising the order, while an order-one factor with curvature must add a divisor reservoir.

### Interlacing

The current \(N=14\) and \(N=20\) canonical refinements fail strict interlacing. A different carrier-scale Sturm or Hermite–Biehler refinement must be built from scratch.

### Seam divisor

A valid Blaschke divisor and coercive hyperbolic horizontal norm have now been constructed. The remaining theorem is a uniform arithmetic or kernel bound on that norm.

The narrowest surviving statement is
\[
\boxed{
\text{derive from the completed prime or theta ledger that }
\sup_{\rho}
\operatorname{artanh}(|\sin(\pi(\Re\rho-1/2))|)=0.}
\]
This statement is equivalent to RH, but the divisor formulation prevents escape from being hidden by height-decaying weights and identifies exactly what a seam proof must control.

No proof of RH is obtained.
