# Trying every remaining route around the halving obstruction

**Eighteenth-stage investigation — 14 October 2026**  
**Question:** Can any of the four remaining routes—prime-ledger invariance, complete zero genealogy, real-rooted kernel refinement or compactified seam control—supply the missing global theorem?  
**Companion program:** `scripts/research-rss-global-halving-routes.mjs`  
**Machine-readable results:** `docs/rh/rss-global-halving-routes-results.json`

## Verdict

All four routes were pursued. Each gives a precise sufficient theorem, but none can presently be completed from the established TTI rules.

1. **Prime-ledger invariance:** ordinary dyadic removal has a nonzero central curvature correction. Halving is not an exact invariance of the prime ledger, and horizontal residue may be transferred into a carrier or branch reservoir rather than forced to vanish.
2. **Complete zero genealogy:** local parentage is automatic inside any fixed zero-free contour, but zeros can enter from infinity as the family changes. The escaping quartet is exactly such an entry. A global no-birth theorem still requires uniform control at infinity.
3. **Real-rooted kernel refinement:** positivity and halving do not preserve real-rootedness under addition. An explicit positive average of two real-rooted even polynomials has nonreal zeros. Interlacing or total positivity is required and has not been proved for the theta-carrier refinements.
4. **Compactified seam control:** a supremum norm detects the escaping quartet after compactification, but \(\xi\) cannot extend holomorphically through infinity as a regular point. A non-holomorphic endpoint identification does not inherit the identity theorem.

The investigation produces several exact negative results and narrows the remaining targets. It does not prove RH.

---

## 1. Route A — derive aggregate invariance from the prime ledger

The previous stage found a sufficient aggregate theorem. Let
\[
\mathcal R
=
\sum_{\text{upper quartets}}
\frac{4\eta^2(\eta^2+3\gamma^2)}
{\gamma^2(\eta^2+\gamma^2)^2}.
\]
One-to-one halving strictly contracts every nonzero summand. If closure preserves \(\mathcal R\), strict contraction and invariance force \(\mathcal R=0\), which is equivalent to RH.

The first attempt was to derive invariance from an exact dyadic identity on the prime side.

### 1.1 The natural parity operation is not invariant

Removing the even integers from the Dirichlet series gives
\[
(1-2^{-s})\zeta(s)
=
\sum_{n\text{ odd}}n^{-s}.
\]
The logarithmic curvature contributed by the dyadic multiplier is
\[
\frac{d^2}{ds^2}\log(1-2^{-s})
=
-\frac{(\log2)^2 2^{-s}}
{(1-2^{-s})^2}.
\]
At the central point,
\[
\left.\frac{d^2}{ds^2}\log(1-2^{-s})\right|_{s=1/2}
=
-3.960201560771\ldots
\]
This is not zero. The elementary arithmetic operation most directly associated with halving therefore changes the central completed ledger rather than preserving it.

The gamma factor, endpoint polynomial and other Euler factors still belong to the completed function, so this calculation does not prove that no more elaborate TTI transformation could cancel the correction. It does show that literal parity removal is not the desired conservation law.

### 1.2 Residue may move into a reservoir

For one representative quartet, write
\[
\mathcal R_{\rm before}
=
\mathcal R_{\rm after}
+
\mathcal R_{\rm export},
\qquad
\mathcal R_{\rm export}>0.
\]
This identity is automatic: the missing horizontal residue can be assigned to another channel. A closed physical ledger may conserve
\[
\mathcal R+\mathcal E_{\rm carrier}
\]
rather than \(\mathcal R\) alone.

To force RH, TTI would have to prove that the carrier or seam reservoir returns empty after the complete cycle. Closure by itself normally conserves a total; it does not say that each component returns separately.

### 1.3 The four-way fork supplies an exact reservoir

If four spectral descendants each have half the parent displacement, their quadratic energy is
\[
4\left(\frac\eta2\right)^2=\eta^2.
\]
The four-way event can therefore return exactly the horizontal norm exported by halving. This is compatible with nonzero residue rather than contradictory to it.

The result strengthens the earlier warning: the carrier fork at 1000 cannot be identified with spectral-zero multiplication in an RH argument. If it is, the proposed contraction has its own conservation reservoir.

### Route A determination

No prime-side identity giving
\[
\mathcal R_{\rm after}=\mathcal R_{\rm before}
\]
was found. The simplest dyadic transformation has a nonzero central correction, and a closed total ledger can preserve exported residue in another channel. The aggregate route remains sufficient but underived.

## 2. Route B — prove complete zero genealogy

The second route asks for a parent map between the zeros of consecutive finite completions.

### 2.1 What analytic continuation gives automatically

Let \(F(\lambda,s)\) be holomorphic in \(s\) and continuous or analytic in a refinement parameter \(\lambda\). Let \(C\) be a compact contour on which
\[
F(\lambda,s)\ne0
\]
throughout a parameter interval. The argument principle fixes the number of zeros inside \(C\), counted with multiplicity. Simple zeros move continuously; multiple zeros can split or collide, but total multiplicity cannot appear spontaneously inside the contour.

This gives a legitimate **local genealogy**. On every fixed zero-free contour, children have parents when coefficients change continuously.

### 2.2 Why local genealogy is not global genealogy

The complex plane is noncompact. A zero may cross the top of every fixed rectangle as the stage changes. Viewed locally, it has arrived from outside; viewed globally, its ancestry lies at infinity.

The escaping quartet
\[
s=rac12\pmrac14\pm i\varphi^N
\]
is constructed precisely this way. It never appears spontaneously in a bounded interior region. It remains beyond each fixed contour until the contour is enlarged to its height.

Consequently, the ordinary continuation theorem establishes parentage only after a contour has been fixed. It does not supply one contour or one estimate covering all heights.

### 2.3 Finite order does not prevent entry from infinity

All of the relevant completed functions have controlled entire-function growth. That alone is insufficient. Multiplication by a stage-dependent polynomial preserves the order of an entire function while adding zeros at arbitrarily large heights.

Thus a uniform order or exponential-type bound does not yield the required no-birth theorem. One needs a lower bound on an exhaustion of contours, or an explicit divisor at infinity that accounts for every incoming zero.

### 2.4 What the finite counts show

The deficit-halving calculations gave
\[
2,2,4,3
\]
inside the height-30 rectangle for the carrier-bearing origin models and
\[
4,3,3,3
\]
for the boundary-only model. These changes can be understood as contour crossings; they do not violate local continuation. They also do not define a complete global parent map.

### Route B determination

Local no-birth is established by ordinary complex analysis. Global no-birth remains exactly the infinity problem. To close this route, TTI must derive either:

- uniform nonvanishing on an expanding contour sequence; or
- a seam divisor that gives every zero entering from infinity a controlled parent and inherited horizontal bound.

Neither is currently available.

## 3. Route C — preserve real-rootedness under kernel refinement

The third route seeks kernels \(K_N\) such that:

1. every Fourier transform \(\widehat K_N\) has only real zeros;
2. every splice refinement preserves that property;
3. \(\widehat K_N\to\Xi\) locally uniformly.

If achieved, closure of the Laguerre–Pólya class would prove RH.

### 3.1 Positivity is not enough

Consider the even real-rooted polynomials
\[
f(z)=(z^2-1)(z^2-2)
\]
and
\[
g(z)=(z^2-10)(z^2-20).
\]
Both have four real zeros. Put \(y=z^2\). Their positive half-sum is
\[
\frac{f(z)+g(z)}2
=
y^2-16.5y+101.
\]
The discriminant is
\[
16.5^2-4(101)=-131.75<0.
\]
Therefore the positive average has nonreal zeros.

This finite example captures the kernel problem. Adding positive real-rooted carrier components does not preserve real-rootedness unless their zeros satisfy an interlacing or stronger total-positivity condition.

### 3.2 Pure dilation preserves roots but loses the target

If \(F\) has real zeros, then
\[
F(2z)
\]
also has real zeros, at half the original positions. This is an exact real-rootedness-preserving halving operation.

But repeated dilation gives
\[
F(2^Nz),
\]
which does not converge to a fixed nonconstant function \(\Xi(z)\). The operation contracts roots by changing the whole spectral scale rather than refining a fixed kernel.

Conversely \(F(z/2)\) expands the roots. Neither operation supplies a convergent approximation to the fixed Riemann kernel.

### 3.3 Interlacing is the missing refinement theorem

A weighted update of the form
\[
K_{N+1}=K_N+\delta K_N
\]
requires proof that the transform of \(\delta K_N\) interlaces the transform of \(K_N\), or that the update belongs to a Pólya-frequency/total-positivity class. Ordinary positivity and log-concavity do not provide that theorem.

Real-rooted Pólya-like approximations to the Riemann kernel are known, but preserving real-rootedness while converging through the full body of the exact kernel remains unresolved. See Yaoming Shi, *Real-rooted Pólya-like approximations to the Riemann Xi-function*: <https://arxiv.org/abs/1502.06844>.

### Route C determination

The kernel route remains mathematically valid, but the halving rule does not supply the required interlacing. Proving interlacing for every canonical theta-carrier refinement would itself be a major theorem and is now the narrowest target for this route.

## 4. Route D — use a compactified seam supremum

Weighted residue sums miss escape because their weights decay with height. A supremum does not:
\[
\mathcal S_N
=
\sup_{\rho\in Z(\Xi_N)}
\left|\Re\rho-rac12\right|.
\]
An escaping quartet keeps
\[
\mathcal S_N\ge\frac14.
\]

### 4.1 Compactifying the ordinate

Use the coordinate
\[
\tau(\gamma)
=
\frac{\gamma}{\sqrt{1+\gamma^2}}.
\]
Then
\[
\gamma\to\pm\infty
\quad\Longrightarrow\quad
\tau\to\pm1.
\]
Identifying the endpoints places both directions of infinity on a finite seam. The quartet approaches that seam while retaining horizontal displacement \(1/4\). Set-theoretically, the compactified supremum detects it perfectly.

### 4.2 Why analytic regularity fails

The identity theorem would become available only if the transformed completed function extended holomorphically through the seam as an ordinary interior point.

But \(\xi\) is a nonpolynomial entire function with infinitely many zeros. Infinity is therefore an essential singularity, not a removable singularity or pole. If an entire function extended meromorphically to the Riemann sphere with only a pole at infinity, it would be a polynomial and would have only finitely many zeros.

No ordinary conformal compactification can turn infinity into a regular analytic point of \(\xi\). A non-holomorphic compactification can identify endpoints topologically, but it does not transfer the identity theorem or local uniform holomorphic convergence to the seam.

### 4.3 What a successful seam object would require

TTI would need a new object rather than \(\xi\) itself: a normalized section, divisor or operator-valued boundary datum that

- records the infinite zero divisor without becoming singular;
- has a norm coercive in horizontal displacement;
- converges uniformly at the seam;
- obeys the proposed halving law.

Constructing such an object without encoding RH in its definition remains open.

### Route D determination

The compactified supremum solves the detection problem but not the analytic-control problem. It identifies exactly where the quartet arrives, yet the present completion supplies no theorem controlling its seam value.

## 5. Combined assessment

The four attempts establish the following exact progress:

- horizontal residue contracts algebraically under one-to-one halving;
- zeros have local parents inside every fixed zero-free contour;
- the compactified supremum detects fixed-displacement escape;
- spectral dilation preserves real-rootedness.

They also expose four independent blocking facts:

- the dyadic \(p=2\) prime correction is nonzero;
- zeros can enter from infinity in a noncompact family;
- positive sums of real-rooted components need not be real-rooted;
- \(\xi\) has an essential singularity at compactified infinity.

The narrowest remaining proof targets are therefore:

1. derive a completed-ledger identity that cancels the \(p=2\) correction and proves the residue reservoir returns empty;
2. prove interlacing for every canonical theta-carrier refinement;
3. construct a seam divisor that accounts for incoming zeros and retains a coercive horizontal norm.

Each would be enough to reopen a proof route. None is currently derived by the TTI framework.

No proof of RH is obtained.
