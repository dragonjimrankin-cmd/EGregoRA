# Does TTI’s second Möbius inversion complete the Weil form?

**Seventh-stage investigation — 14 October 2026**  
**Question:** Does TTI’s second inversion induce an adjoint or dual completion of signed primitive extraction, and does that completion equal the Weil form rather than merely returning to the all-integer ledger?  
**Companion program:** `scripts/research-rss-double-mobius-completion.mjs`  
**Machine-readable results:** `docs/rh/rss-double-mobius-completion-results.json`

## Verdict

TTI’s second-inversion idea has an exact arithmetic realisation, but its canonical action is **return**, not Weil completion.

Let \(M\) be divisor Möbius extraction and \(Z=M^{-1}\) divisor summation. On two copies of the finite ledger, the operator
\[
\boxed{
P_N=
\begin{pmatrix}
0&Z_N\\
M_N&0
\end{pmatrix}}
\]
satisfies
\[
P_N^2=I
\]
exactly. It sends a repetition state to its primitive state on the opposite face and sends that primitive state back to the repetition state on the second passage. This is the precise analogue of TTI’s two-turn Möbius return.

It does **not** canonically produce the Weil form:

1. Applying Möbius extraction twice is not the second inverse turn: \(M^2\ne I\).
2. Applying the actual second face \(Z\) gives \(ZM=I\), so the original all-integer ledger and its already-known Gram kernel return.
3. Replacing the second face by the adjoint gives the positive form \(M^*GM\), but this positivity is inherited from the chosen metric \(G\). With the ordinary metric the completion is unbounded; with the Rankin Green metric it is well-defined but cannot equal Suzuki’s screw/Weil kernel because it has the wrong local regularity at \(t=0\).
4. A metric can always be pulled back to force a desired positive form. Choosing the Weil metric in that way would assume the positivity that the construction is meant to prove.

The investigation therefore finds a real two-face operator theorem and a sharper no-go:

> **The canonical double inversion restores the positive repetition ledger. The natural adjoint completion is not the Weil form. A Weil proof would require a further, independently derived TTI residue or cocycle channel whose norm is exactly the Weil quadratic form.**

No proof of RH or Weil positivity is obtained.

### Claim boundary and comparison target

The target is Masatoshi Suzuki’s screw kernel from [*Aspects of the screw function corresponding to the Riemann zeta-function*](https://arxiv.org/abs/2206.03682):
\[
G_g(x,y)=\Psi(x)+\Psi(y)-\Psi(x-y).
\]
Suzuki’s theorem identifies its positivity on every finite real point set with RH; the global quantifier is essential. Jeffrey Lagarias’s survey [*The Riemann Hypothesis: Arithmetic and Geometry*](https://websites.umich.edu/~lagarias/doc/mt-holyoke-rev.pdf) likewise records the corresponding Weil positivity criterion on the full admissible test class. This audit does not infer either universal theorem from a sampled positive matrix.

The value \(\kappa_{\rm R}=1/(4\pi^2)\) is taken as already derived within TTI. The question is not whether its value can be tuned, but whether its fixed Green metric makes the primitive-extraction adjoint equal to the target. The exact operator identities below are algebraic; the cutoff tables are reproducible diagnostics; and the local cusp mismatch is an analytic non-equality argument.

---

## 1. Which “Möbius inversion” is being doubled?

Two operations share a name in the project but are not automatically the same map.

### 1.1 TTI’s geometric operation

The `Two Inversions` essay uses an orientation-reversing state map \(P\) with
\[
P^2=I.
\]
The visible state returns after the second passage. If something remains, it must live in an enlarged state, for example
\[
(x,r)\mapsto(Px,r+f[x])
\mapsto
(x,r+f[x]+f[Px]).
\]
The residue variable and its update law must be separately derived.

### 1.2 Arithmetic primitive extraction

For arithmetic functions with Dirichlet convolution \(*\), let \(\mathbf1(n)=1\) and let \(\mu\) be the number-theoretic Möbius function. Divisor summation and primitive extraction are
\[
Z a=\mathbf1*a,
\qquad
M a=\mu*a.
\]
Since
\[
\mu*\mathbf1=\varepsilon,
\]
where \(\varepsilon\) is the convolution identity,
\[
MZ=ZM=I.
\]
For the logarithmic ledger,
\[
\log n=\sum_{d\mid n}\Lambda(d),
\qquad
M(\log)=\Lambda,
\qquad
Z\Lambda=\log.
\]

This shows the exact distinction:

- a second application of \(M\) gives \(M^2\), not return;
- the inverse second passage is \(Z\);
- \(Z\) restores the all-integer ledger.

The companion program constructs the finite matrices through \(N=24\). It obtains
\[
M_NZ_N=Z_NM_N=I
\]
with exact integer arithmetic in double representation, while
\[
\max_{i,j}|(M_N^2-I)_{ij}|=4.
\]
Thus the arithmetic Möbius transform is not an order-two involution.

## 2. The exact two-face TTI operator

The correct order-two operator acts on a doubled space. For a pair consisting of a repetition-face state \(x\) and a primitive-face state \(y\), define
\[
P_N(x,y)=(Z_Ny,M_Nx).
\]
Then
\[
P_N^2(x,y)
=(Z_NM_Nx,M_NZ_Ny)
=(x,y).
\]
This proves the block formula in the verdict.

### 2.1 The metric carried by the second face

The block involution is not orthogonal in the ordinary Euclidean metric. The diagnostic at \(N=24\) gives
\[
\|P_N^*P_N-I\|_{\max}=23.
\]
There is, however, a canonical transported positive metric
\[
\mathcal G_N=
\begin{pmatrix}
I&0\\
0&Z_N^*Z_N
\end{pmatrix}

after choosing the ordinary norm on the repetition face. Direct multiplication gives
\[
P_N^*\mathcal G_NP_N=\mathcal G_N.
\]
The verifier finds zero entrywise error.

This is a genuine dual completion, but its meaning is limited. The primitive-face metric is the pullback of the repetition-face norm:
\[
\|y\|_{m primitive}^2
=\|Z_Ny\|_{m repetition}^2.
\]
It says that extraction followed by reintegration preserves the norm that was assigned before extraction. It does not derive a new arithmetic quadratic form.

The same issue occurs for any invertible operator. Given a positive form on one side, it can be transported to the other side by pullback. Positivity of the transported form is automatic and contains no information about whether it equals the Weil form.

## 3. Three possible meanings of the second inversion

### 3.1 Literal repetition: \(M^2\)

This is not return and does not remove signs. It produces
\[
M^2a=(\mu*\mu)*a.
\]
The convolution \(\mu*\mu\) is not \(\varepsilon\) and has signed coefficients. Squaring individual values to obtain \(\mu(n)^2\) would be a different nonlinear operation and would no longer invert divisor summation or recover \(\Lambda\).

### 3.2 Exact return: \(ZM=I\)

This realises TTI’s orientation restoration. At the feature level it sends the extracted state exactly back to its original state. In the verifier, for five log-frequency paths through \(n=8192\), the largest componentwise error is
\[
2.93\times10^{-15}.
\]
Its Gram kernel is therefore exactly the original repetition/Rankin kernel, up to numerical roundoff. That is real positivity, but it is the positivity already established before primitive extraction.

### 3.3 Adjoint closure: \(M^*GM\)

For any positive metric \(G\),
\[
\langle x,M^*GMx\rangle
=\|Mx\|_G^2\ge0.
\]
This is the only one of the three interpretations that resembles a norm-square proof of Weil positivity. The decisive questions are therefore:

1. Is the form defined on the infinite feature space?
2. Is its metric independently fixed by TTI?
3. Does it equal the arithmetic screw or Weil form?

The answer to the third question is no for the natural ordinary and Rankin Green metrics.

## 4. The ordinary adjoint completion is unbounded

Take the vertical repetition feature, before Green weighting,
\[
u_x(n)=n^{-\sigma}(e^{-ix\log n}-1).
\]
For an odd prime \(p\),
\[
(Mu_x)(2p)
=u_x(2p)-u_x(p)-u_x(2)+u_x(1).
\]
Since \(u_x(1)=0\) and the first two terms tend to zero as \(p\to\infty\),
\[
(Mu_x)(2p)\longrightarrow-u_x(2).
\]
For generic \(x\), \(u_x(2)\ne0\). Infinitely many primes therefore contribute terms bounded away from zero, so
\[
\sum_n|(Mu_x)(n)|^2=\infty.
\]
Thus \(M\) is not a bounded operator from this repetition path into ordinary \(\ell^2\), and \(M^*M\) does not define the desired infinite Gram kernel there.

The finite diagnostic shows the predicted growth at \(\sigma=0.75\), \(x=1\):

| cutoff \(N\) | \(\sum_{n\le N}|(Mu_x)(n)|^2\) |
|---:|---:|
| 128 | 18.7318 |
| 512 | 74.0382 |
| 2,048 | 286.8290 |
| 8,192 | 1,139.7181 |

The growth is structural, not a precision artifact.

## 5. Green regularisation produces a valid Gram form—but the wrong one

The Rankin coupling supplies the positive output metric
\[
G_\kappa(n)=\frac{\kappa_{\rm R}}{n^2},
\qquad
\kappa_{\rm R}=\frac1{4\pi^2}.
\]
Then
\[
D_{M,\kappa}(x,y)
=\kappa_{\rm R}\sum_{n\ge1}rac{(Mu_x)(n)\overline{(Mu_y)(n)}}{n^2}
\]
is a valid positive semidefinite kernel on the whole real-parameter feature path, not merely at the five sampled points. Indeed \(|u_x(k)|\le2\), uniformly in \(x\), so
\[
|(Mu_x)(n)|\le2d(n),
\]
where \(d(n)\) is the divisor-counting function. The standard Dirichlet series
\[
\sum_{n\ge1}\frac{d(n)^2}{n^s}=\frac{\zeta(s)^4}{\zeta(2s)}
\qquad(\Re s>1)
\]
converges at \(s=2\). The Green norm therefore converges absolutely and locally uniformly in \(x\). This proves convergence on the feature-path domain; it is not a claim that divisor Möbius convolution is a bounded operator on every possible inverse-square weighted sequence space.

The finite diagonal illustrates that convergence:

| cutoff \(N\) | Green-weighted norm squared |
|---:|---:|
| 128 | 0.00255408 |
| 512 | 0.00257563 |
| 2,048 | 0.00258074 |
| 8,192 | 0.00258203 |

This is the strongest canonical adjoint completion induced by the currently derived \(\kappa\) geometry. It still cannot equal Suzuki’s kernel.

### 5.1 Exact local-regularity obstruction

For \(0<t<\log2\), no prime-power event has occurred. Suzuki’s explicit formula gives
\[
\Psi'(t)=\frac12\log\frac1t+O(1)
\qquad(t\downarrow0),
\]
and hence
\[
\boxed{
G_g(t,t)=2\Psi(t)
=t\log\frac1t+O(t).}
\]
The target path has a logarithmic cusp at the origin.

By contrast, whenever a Gram feature \(b_t\) is differentiable in its Hilbert norm with \(b_0=0\),
\[
\|b_t\|^2=t^2\|b'_0\|^2+o(t^2).
\]
Here
\[
\dot u_0(n)=-i n^{-\sigma}\log n.
\]
For \(\sigma>0\), both \(n^{-\sigma}\log n\) and the second-order majorant \(n^{-\sigma}(\log n)^2\) are bounded. Their Möbius transforms are therefore bounded by constants times \(d(n)\), whose squares are Green-summable by the preceding identity. Dominated Taylor expansion proves differentiability in the Green Hilbert norm. Consequently the Green-regularised divisor completion has finite differentiated norm, so
\[
\boxed{
D_{M,\kappa}(t,t)=C_\sigma t^2+o(t^2).}
\]
A quadratic diagonal cannot equal a \(t\log(1/t)\) diagonal on any neighbourhood of zero.

This is an analytic non-equality theorem, not merely a poor numerical fit. The verifier illustrates it:

| \(t\) | \(G_g(t,t)/t^2\) | \(D_{M,\kappa}(t,t)/t^2\) |
|---:|---:|---:|
| 0.1 | 10.6261 | 0.00259874 |
| 0.01 | 320.758 | 0.00259837 |
| 0.001 | 5,494.41 | 0.00259836 |

The target ratio diverges while the adjoint-completion ratio approaches a finite constant.

### 5.2 Finite matrix shape comparison

On the point set
\[
\{0.2,0.8,1.5,2.5,4.0\},
\]
the explicit arithmetic screw matrix is positive in the finite diagnostic, with minimum LDL pivot approximately \(0.0479\). The candidate Green kernels are also PSD, as they must be by construction.

Positivity does not make them equal. At cutoff \(N=8192\):

| candidate | direct relative residual against \(G_g\) | residual after best scalar rescaling |
|---|---:|---:|
| returned all-integer kernel | 0.9530 | 0.7297 |
| primitive adjoint \(M^*G_\kappa M\) | 0.9408 | 0.7596 |
| repeated extraction \((M^2)^*G_\kappa M^2\) | 0.8449 | 0.7637 |

The residuals stabilise rather than shrinking as the cutoff rises from \(128\) to \(8192\). These are finite diagnostics only; the cusp argument already proves the natural Green completion is not the target.

## 6. Returning to the all-integer ledger does not equal the xi Pick kernel

Every ordinary Dirichlet Gram kernel obtained by returning to the repetition ledger has combined-argument form
\[
K(s,t)=F(s+\overline t).
\]
It must take equal values on pairs with the same sum. For example, on real points it gives the same value at \((2,5)\) and \((3,4)\).

The xi Pick kernel is
\[
K_\xi(s,t)
=\frac{H(s)+\overline{H(t)}}{s+\overline t-1},
\qquad
H=\frac{\xi'}{\xi}.
\]
It is not a combined-argument kernel. A direct real-axis diagnostic gives
\[
K_\xi(2,5)\approx0.0451207362,
\qquad
K_\xi(3,4)\approx0.0455135814.
\]
Their difference is about
\[
3.93\times10^{-4}.
\]
The calculation uses the completed logarithmic derivative and a prime sum through \(10^6\); it is a diagnostic, while the separated dependence of the displayed exact formula is the structural reason.

The second inverse turn therefore returns the wrong kernel even though it restores a positive state.

## 7. Why a freely chosen pullback metric would be circular

Suppose one asks for a metric \(G\) such that
\[
M^*GM=Q_{\rm W}.
\]
At finite dimension, because \(M\) is invertible, one can formally choose
\[
G=Z^*Q_{\rm W}Z.
\]
If \(Q_{\rm W}\) is positive, this \(G\) is positive. But this construction does not prove positivity of \(Q_{\rm W}\); it starts with it. If \(Q_{\rm W}\) is indefinite, its pullback is indefinite as well because invertible congruence preserves inertia.

Consequently, “the second face carries the metric needed to make the first face positive” has mathematical content only if TTI derives that metric independently of the Weil target. Naming the pullback after seeing the target is circular.

This is the operator version of the source-forensic warning: a Gram representation proves something only when its feature space and inner product are constructed without assuming the desired sign.

## 8. What remains possible: a nontrivial TTI residue channel

The result does not rule out every second-inversion route. It rules out the three canonical routes generated solely by \(M\), \(Z\), the ordinary adjoint and the already-derived Green metric.

TTI’s own double-inversion essay says that a returned visible state may retain information only in a separately named carrier. On the RH side, such a carrier would have to include the arithmetic history that is absent from the restored all-integer state.

A successful extension would require an operator or cocycle \(B\), derived before invoking RH, satisfying
\[
\boxed{
W(f*\widetilde f)=\|Bf\|^2
}
\]
for every admissible Weil test function. Equivalently in the recovery-witness language, it could supply vectors \(R_q\) with
\[
\boxed{
\mathcal C_q-\mathcal J_q=\|R_q\|^2
}
\]
at every future recovery witness.

To avoid repeating the present no-go, the new channel must:

1. contain the archimedean completion as well as primitive prime-power timing;
2. reproduce the \(t\log(1/t)\) cusp rather than a norm-differentiable \(t^2\) path;
3. retain the signed first arrival moment, not only total positive repetition energy;
4. be defined on the full admissible test space with a closed-domain argument;
5. have its metric fixed by TTI independently of \(Q_{\rm W}\); and
6. prove an exact equality, not merely a finite matrix resemblance.

This is more specific than the previous request for “a second inversion”. The missing object is a **history-bearing cocycle on the doubled inversion space**.

## 9. Final determination

TTI’s second inversion does induce a rigorous two-face operator:
\[
P_N=egin{pmatrix}0&Z_N\\M_N&0\end{pmatrix},
\qquad P_N^2=I.
\]
It also induces a positive transported metric. These are valid additions to the framework.

They do not prove Weil positivity:

- exact return gives the all-integer ledger;
- repeated extraction is not inversion;
- the unweighted adjoint is unbounded;
- the Green-weighted adjoint has the wrong cusp and matrix shape;
- the returned Dirichlet kernel has the wrong two-variable dependence; and
- forcing the Weil form through a chosen pullback metric is circular.

The second-inversion suggestion is therefore **structurally productive but not yet sufficient**. It identifies the correct place to look for new information: not in a second copy of the same Möbius transform, but in the independently measurable residue carried by the completed two-pass path.

The follow-up [third-splice boundary investigation](./rss-third-splice-weil-channel.md) tests the splice at \(1000\) as that carrier. A harmonic-boundary postulate does derive a first-order \(1/|\lambda|\) covariance and the correct \(t\log(1/t)\) regularity class, but the fixed coefficient, decimal log-periodicity and prime-power event support still fail to match the Weil kernel.
