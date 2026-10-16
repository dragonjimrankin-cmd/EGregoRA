# Can the prime-phase law conserve the Euler anchor?

**Thirty-third-stage investigation — 15 October 2026**  
**Question:** Can the one-point principal-prime conservation law be proved by continuing an exact Euler-product phase identity to the critical boundary?  
**Companion program:** `scripts/research-rss-prime-phase-conservation.py`  
**Machine-readable results:** `docs/rh/rss-prime-phase-conservation-results.json`  
**Follow-up audit:** [`rss-reverse-prime-phase-inequality.md`](./rss-reverse-prime-phase-inequality.md)

## Verdict

The retry proves an exact conservation identity in the Euler-product half-plane, including its endpoint completion. It does not prove that the identity reaches the critical boundary without an additional zero-crossing term.

Put
\[
a=\frac32,
\qquad
C(s)=(s-1)\zeta(s),
\]
and, for \(\sigma>1\), define the weighted endpoint-completed phase
\[
\mathcal I_C(\sigma)
=
\frac6\pi
\int_0^\infty
\frac{T\,\arg C(\sigma+iT)}{(T^2+9/4)^2}\,dT,
\]
using the Euler-product branch. Direct Fourier transformation of the absolutely convergent prime series gives
\[
\boxed{
\mathcal I_C(\sigma)
=
\frac1{\sigma+1/2}
-
\sum_{n\ge2}
\frac{\Lambda(n)}{n^{\sigma+3/2}}
\qquad(\sigma>1).
}
\]
Its formal value at the critical boundary is exactly the endpoint-completed prime anchor at \(s=2\):
\[
\boxed{
\mathcal I_C(1/2)
\stackrel{?}{=}
1-
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}
=
\frac{C'}C(2).
}
\]

This is the requested scalar conservation law in explicit integral form. However, the equality at \(\sigma=1/2\) is not a consequence of the proved \(\sigma>1\) identity. Moving the vertical line to the critical boundary crosses every zero with \(\Re\rho>1/2\). Canonical factorisation gives the exact defect
\[
\boxed{
\mathcal I_C^{\rm crit}
-
\frac{C'}C(2)
=
\mathcal D_2
=
H_{\rm ord}(3/2)-\frac{\xi'}\xi(2)
\ge0,
}
\]
where every off-line quartet contributes
\[
\frac{
6\eta^2(\eta^2+3\gamma^2-9/4)
}{
(\gamma^2+9/4)
\left[(\gamma^2-\eta^2+9/4)^2+4\eta^2\gamma^2\right]
}>0.
\]
Therefore
\[
\boxed{
\mathcal I_C^{\rm crit}=\frac{C'}C(2)
\iff
\mathcal D_2=0
\iff
\mathrm{RH}.
}
\]

The retry has found and proved the prime-phase law on its legitimate Euler domain, but proving its defect-free continuation would prove RH directly. Dominated convergence, analytic continuation of the right side, the functional equation and the natural-gradient law do not remove the Blaschke term. No unconditional proof of the boundary equality was found. RH remains open.

---

## 1. Fourier transform of the principal-prime phase

For \(\sigma>1\),
\[
\log\zeta(\sigma+iT)
=
\sum_{n\ge2}
\frac{\Lambda(n)}{\log n}
 n^{-\sigma-iT}.
\]
The series converges absolutely. Its imaginary part is
\[
\arg\zeta(\sigma+iT)
=
-
\sum_{n\ge2}
\frac{\Lambda(n)}{\log n}
 n^{-\sigma}
\sin(T\log n),
\]
with the branch tending to zero as \(\sigma\to+\infty\).

The required Fourier integral is elementary. For \(a>0\) and \(b>0\),
\[
\boxed{
\int_0^\infty
\frac{T\sin(bT)}{(T^2+a^2)^2}\,dT
=
\frac{\pi b}{4a}e^{-ab}.
}
\]
It follows by differentiating
\[
\int_0^\infty
\frac{\cos(bT)}{(T^2+a^2)^2}\,dT
=
\frac{\pi}{4a^3}(1+ab)e^{-ab}.
\]
The companion program checks the sine transform numerically at frequencies \(\log2,\log3,\log5\) and \(\log11\), with errors below \(4\times10^{-8}\).

At \(a=3/2\), the prefactor in the weighted phase transform satisfies
\[
\frac6\pi\frac{\pi}{4a}=1.
\]
Termwise integration therefore gives
\[
\boxed{
\mathcal I_\zeta(\sigma)
:=
\frac6\pi
\int_0^\infty
\frac{T\arg\zeta(\sigma+iT)}{(T^2+9/4)^2}\,dT
=
-
\sum_{n\ge2}
\frac{\Lambda(n)}{n^{\sigma+3/2}}.
}
\]
This identity is unconditional for \(\sigma>1\). It is already tuned to the desired exponent: formally substituting \(\sigma=1/2\) produces \(-\sum\Lambda(n)/n^2\).

## 2. Endpoint completion is exact

The zeta pole at \(s=1\) must not be crossed silently. Complete it first with
\[
C(s)=(s-1)\zeta(s).
\]
For \(x>0\),
\[
\arg(x+iT)=\arctan(T/x).
\]
Integration by parts gives
\[
\frac6\pi
\int_0^\infty
\frac{T\arctan(T/x)}{(T^2+a^2)^2}\,dT
=
\frac{3}{2a(a+x)}.
\]
At \(a=3/2\), with \(x=\sigma-1\), this becomes
\[
\frac1{\sigma+1/2}.
\]
Adding this endpoint phase to the zeta phase proves
\[
\boxed{
\mathcal I_C(\sigma)
=
\frac1{\sigma+1/2}
-
\sum_{n\ge2}
\frac{\Lambda(n)}{n^{\sigma+3/2}}

\qquad(\sigma>1).
}
\]

At the desired boundary \(\sigma=1/2\), the right side is
\[
1-
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}.
\]
This is exactly
\[
\frac{C'}C(2)
=
\frac1{2-1}+\frac{\zeta'}\zeta(2).
\]
The phase transform is not an arbitrary kernel chosen after the fact. Its vertical displacement \(a=3/2\) maps the critical boundary point \(1/2+iT\) to the Euler anchor \(2\), and its Fourier decay maps \(n^{-1/2}\) to \(n^{-2}\).

## 3. Connection to the ordinate anchor

Let \(N(T)\) count nontrivial zeros with \(0<\Im\rho\le T\), including multiplicity. The ordinate projection at \(w=3/2\) is
\[
H_{\rm ord}(3/2)
=
\sum_{\Im\rho>0}
\frac{3m(\rho)}{\gamma_\rho^2+9/4}.
\]
Stieltjes integration by parts gives
\[
\boxed{
H_{\rm ord}(3/2)
=
6\int_0^\infty
\frac{T N(T)}{(T^2+9/4)^2}\,dT.
}
\]
Use the exact Riemann--von Mangoldt counting formula
\[
N(T)
=
1+\frac{\theta(T)}\pi
+\frac1\pi\arg\zeta(1/2+iT),
\]
with the standard continuous argument convention and midpoint values at jumps.

The gamma phase obeys
\[
\frac6\pi
\int_0^\infty
\frac{T\theta(T)}{(T^2+9/4)^2}\,dT
=-\frac{\gamma_E+\log\pi}{2}.
\]
This follows by integration by parts and the Poisson formula for
\(\Re\psi(1/4+iT/2)\). The constant term in \(N(T)\) contributes
\[
6\int_0^\infty
\frac{T}{(T^2+9/4)^2}\,dT
=
\frac43.
\]
Hence
\[
H_{\rm ord}(3/2)
=
\frac43-\frac{\gamma_E+\log\pi}{2}
+
\mathcal I_\zeta^{\rm crit}.
\]

On the other hand,
\[
\frac{\xi'}\xi(2)
=
\frac32-\frac{\gamma_E+\log\pi}{2}
-
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}.
\]
Subtracting gives
\[
\boxed{
\mathcal D_2
=
\mathcal I_\zeta^{\rm crit}
+
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}
-
\frac16.
}
\]
The \(1/6\) is the contribution missed if the pole at one is crossed without endpoint completion.

On the critical boundary,
\[
\arg(-1/2+iT)
=
\pi-\arctan(2T)
\qquad(T>0).
\]
Its weighted transform is \(5/6\). Therefore the endpoint-completed form is cleaner:
\[
\boxed{
\mathcal D_2
=
\mathcal I_C^{\rm crit}
-
\left(
1-
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}
\right)
=
\mathcal I_C^{\rm crit}-\frac{C'}C(2).
}
\]
This is the exact scalar conservation equation requested.

## 4. The Blaschke term is the horizontal defect

A logarithm can be continued through a zero-free domain, but no single holomorphic branch of \(\log C\) crosses a zero. When the vertical line moves from \(\sigma>1\) to \(\sigma=1/2\), each zero with \(\beta>1/2\) contributes an inner, or Blaschke, factor.

For an upper reflected pair
\[
\rho=\frac12+\eta+i\gamma,
\qquad
1-\overline\rho=\frac12-\eta+i\gamma,
\]
the resulting one-point defect is exactly
\[
\boxed{
 d_{\eta,\gamma}
=
\frac{
6\eta^2(\eta^2+3\gamma^2-9/4)
}{
(\gamma^2+9/4)
\left[(\gamma^2-\eta^2+9/4)^2+4\eta^2\gamma^2\right]
}.
}
\]
Every denominator is positive. Since every nontrivial zero has ordinate above the certified first zero,
\[
\eta^2+3\gamma^2-\frac94>0.
\]
Thus
\[
d_{\eta,\gamma}>0
\]
for every off-line quartet.

Summation is legitimate because the terms are \(O(\eta^2/\gamma^4)\). It gives
\[
\mathcal D_2
=
\sum_{\rm off\mbox{-}line\ quartets}
d_{\eta,\gamma}.
\]
Consequently
\[
\mathcal D_2=0
\iff
\text{there is no zero with }\Re\rho>1/2
\iff
\mathrm{RH},
\]
where the final implication uses functional reflection.

The term blocking phase conservation is not an uncontrolled remainder. It is exactly the positive horizontal zero defect already found from the transported divisor.

## 5. Why analytic continuation of the prime sum does not suffice

The right side
\[
\frac1{\sigma+1/2}
-
\sum_{n\ge2}
\frac{\Lambda(n)}{n^{\sigma+3/2}}
\]
is analytic well beyond \(\sigma=1\); its prime series remains absolutely convergent at \(\sigma=1/2\). It is tempting to invoke analytic continuation and substitute the boundary value.

That step is invalid because the left side is not presented as one holomorphic function of \(\sigma\) across zeros. It is a weighted argument of \(C(\sigma+iT)\). The branch changes when the moving line crosses a zero. Analytic continuation of the scalar expression on the right does not prove that the boundary argument integral has no added inner-factor term.

Equivalently, an identity theorem can continue
\[
\frac{C'}C(s)
\]
through a domain already known to be zero-free. It cannot be used to prove that the domain is zero-free while ignoring the poles of that same logarithmic derivative.

## 6. Closure routes retried

### Dominated convergence

The weight is strong enough to control growth as \(T\to\infty\). That is not the issue. Near a zero, the argument changes branch. Those local changes have finite weighted mass and add to \(\mathcal D_2\). A bound in \(T\) cannot erase the topological jump in \(\sigma\).

### Functional-equation pairing

A zero at \(1/2+\eta+i\gamma\) is paired with one at \(1/2-\eta+i\gamma\). When the line moves from the Euler region to \(1/2\), it crosses the right member but stops before crossing the left member. The two Blaschke contributions therefore do not cancel. Reflection explains why the defect is even in \(\eta\), not why it vanishes.

### Natural-gradient or Noether conservation

The law \(\dot\eta=-\eta\) is a gradient flow. It dissipates relative entropy and makes the \(s=2\) logarithmic-derivative anchor strictly increase off the line. It is not a Hamiltonian flow generated by a symmetry of \(\xi\). Calling the prime scalar a conserved charge would contradict the explicitly computed velocity unless every \(\eta\) were already zero.

### Critical Chebyshev energy

The earlier all-scale estimate for \(\psi(x)-x\) would make the completed Mellin transform holomorphic in \(\Re s>1/2\). It would therefore justify defect-free continuation. But that estimate is itself equivalent to RH. It cannot be imported as an independent proof.

### Finite zero verification

Checking all zeros through a height moves any possible Blaschke contribution into the tail and makes it very small. It never makes it exactly zero: a zero at greater height contributes a positive quantity of order \(\eta^2/\gamma^4\).

## 7. Exact status

The retry proves the following genuine principal-prime law:
\[
\mathcal I_C(\sigma)
=
\frac1{\sigma+1/2}
-
\sum_{n\ge2}
\frac{\Lambda(n)}{n^{\sigma+3/2}}
\qquad(\sigma>1).
\]
It identifies the desired conservation statement as the boundary equality
\[
\mathcal I_C^{\rm crit}
=
1-
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}.
\]
And it proves the exact failure formula
\[
\mathcal I_C^{\rm crit}
-
\left(1-
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}
\right)
=
\sum_{m off\mbox{-}line\ quartets}d_{\eta,\gamma}
\ge0.
\]

Thus the conservation law is established throughout its Euler-product domain and its boundary obstruction is fully evaluated. What is not established is that the obstruction vanishes. That assertion is equivalent to RH.

No independent theorem currently available in the programme removes the Blaschke term. Claiming that the absolutely convergent right side automatically continues the argument integral would omit precisely the zeros being tested. The retry therefore sharpens the prime-side mechanism but does not prove RH. RH remains open.
