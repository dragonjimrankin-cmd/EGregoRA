# A local prime-power Hankel test for the missing \(\xi\)-to-prime link

**Forty-seventh-stage investigation — 15 October 2026**  
**Question:** Can invariance of the nonlinear prime map be reduced to an explicit local Euler-factor identity on one prime-power tower?  
**Companion program:** `scripts/research-rss-local-prime-power-diagonal-link.py`  
**Machine-readable results:** `docs/rh/rss-local-prime-power-diagonal-link-results.json`

## Verdict

The global fixed-point gate has an exact **one-prime, three-coefficient** certificate. This sharpens what an explicit-formula proof would need to establish, but the certificate itself is not obtained from the Euler product.

Let
\[
P_\xi(n)=\sum_\rho w_\rho\frac{p_{\eta_\rho}(n)+p_{-\eta_\rho}(n)}2,
\qquad
p_\eta(n)=\frac{\Lambda(n)n^{-2-2\eta}}{M(2+2\eta)},
\]
with positive normalized weights proportional to multiplicity divided by \(\gamma_\rho^2+9/4\), over upper reflected zero pairs \(w_\rho\). Fix any prime \(p\) and define its local coefficients
\[
a_{p,k}=\frac{P_\xi(p^k)}{\log p},\qquad k\ge1.
\]
They have the exact positive moment representation
\[
\boxed{
a_{p,k}=\int_0^1 r^k\,d\nu_p(r),
}
\]
where each off-line pair at displacement \(\eta>0\) contributes positive mass at the two distinct rates
\[
r_+=p^{-2-2\eta},\qquad r_-=p^{-2+2\eta}.
\]
The central prime law instead has the geometric sequence
\[
a_{p,k}^{(0)}=\frac{p^{-2k}}{M(2)}.
\]

For every \(k\ge1\), the local Hankel determinant obeys
\[
\boxed{
a_{p,k}a_{p,k+2}-a_{p,k+1}^2
=\frac12\int\!\!\int (rs)^k(r-s)^2\,d\nu_p(r)d\nu_p(s)\ge0.
}
\]
It is zero precisely when \(\nu_p\) is supported at one rate. Because every off-line zero contributes both distinct rates with positive weight, this gives
\[
\boxed{
a_{p,1}a_{p,3}=a_{p,2}^2\text{ for even one prime }p
\quad\Longleftrightarrow\quad \mathrm{RH}.
}
\]
The forward implication is the useful one: a single exact local equality would force all zero displacements to vanish. The reverse follows because under RH \(P_\xi=p_0\), whose local sequence is geometric.

**The missing link is now narrowly stated, not proved:** derive that one local determinant equality for the actual \(P_\xi\) from the completed explicit formula or the Euler product. The ordinary one-variable explicit formula does not give it. The determinant is quadratic in the zero mixture and its zero-side expansion involves pairs of zero features; the corresponding prime-side expression contains off-diagonal correlations. No cancellation or local recurrence establishing the equality was found.

---

## 1. Exact local coefficient formula

Write \(\rho=1/2+\eta+i\gamma\), and let the upper reflected pair have weight \(w_\rho>0\). For every prime \(p\) and exponent \(k\ge1\),
\[
\boxed{
\frac{P_\xi(p^k)}{\log p}
=
\sum_\rho\frac{w_\rho}{2}
\left[
\frac{p^{-k(2+2\eta_\rho)}}{M(2+2\eta_\rho)}
+
\frac{p^{-k(2-2\eta_\rho)}}{M(2-2\eta_\rho)}
\right].
}
\tag{1}
\]
Define the finite positive measure
\[
\nu_p
=
\sum_\rho\frac{w_\rho}{2}
\left[
\frac{\delta_{p^{-2-2\eta_\rho}}}{M(2+2\eta_\rho)}
+
\frac{\delta_{p^{-2+2\eta_\rho}}}{M(2-2\eta_\rho)}
\right].
\tag{2}
\]
Then (1) is exactly \(a_{p,k}=\int r^k d\nu_p(r)\). The support lies in \((0,1)\), and the measure is finite because the weights are summable and \(1/M(a)\) is bounded for real \(a>1\).

For the central law,
\[
\frac{p_0(p^k)}{\log p}=\frac{p^{-2k}}{M(2)},
\]
corresponding to the point measure \(M(2)^{-1}\delta_{p^{-2}}\). Its Hankel determinants vanish.

## 2. Why one vanishing determinant forces RH

Expanding the determinant gives
\[
\begin{aligned}
a_{p,k}a_{p,k+2}-a_{p,k+1}^2
&=\int\!\!\int r^k s^k(s^2-rs)\,d\nu_p(r)d\nu_p(s)\\
&=\frac12\int\!\!\int (rs)^k(r-s)^2\,d\nu_p(r)d\nu_p(s).
\end{aligned}
\]
Every factor is nonnegative. Since \(r,s>0\), the integral vanishes exactly when \(r=s\) for \(\nu_p\times\nu_p\)-almost every pair, i.e. when \(\nu_p\) is concentrated at one rate.

If any zero has \(\eta_\rho\ne0\), its reflected feature pair contributes positive mass at both
\[
p^{-2-2\eta_\rho}\ne p^{-2+2\eta_\rho}.
\]
Thus \(\nu_p\) has at least two distinct support points and every local determinant is strictly positive. Therefore even one exact equality, such as
\[
\boxed{
P_\xi(p)P_\xi(p^3)=P_\xi(p^2)^2,
}
\]
forces RH. No assumption that the zero set contains an open family is needed.

This criterion is stronger in *locality* than the full identity \(P_\xi=p_0\), but it is not weaker in logical strength.

## 3. Local generating function and pole signature

The prime-power tower has generating function
\[
F_{p,\xi}(z)
:=
\sum_{k\ge1}a_{p,k}z^k
=
\sum_\rho\frac{w_\rho}{2}
\left[
\frac{p^{-2-2\eta_\rho}z}
{M(2+2\eta_\rho)(1-p^{-2-2\eta_\rho}z)}
+
\frac{p^{-2+2\eta_\rho}z}
{M(2-2\eta_\rho)(1-p^{-2+2\eta_\rho}z)}
\right].
\]
Under RH this reduces to
\[
F_{p,0}(z)=\frac1{M(2)}\frac{p^{-2}z}{1-p^{-2}z},
\]
with radius of convergence \(p^2\). For one off-line feature, the two terms have simple poles at \(p^{2+2\eta}\) and \(p^{2-2\eta}\). More robustly, its positive slow-decay rate \(p^{-2+2\eta}>p^{-2}\) implies \(a_{p,k}\ge c p^{-k(2-2\eta)}\) for some \(c>0\), so the aggregate generating function has radius at most \(p^{2-2\eta}<p^2\). Positive coefficients prevent cancellation of this earlier convergence boundary.

Equivalently, the exact Euler-factor recurrence
\[
a_{p,k+1}=p^{-2}a_{p,k}\quad(k\ge1)
\]
would force RH. The Hankel equality above is an even shorter sufficient check: it tests whether three consecutive coefficients lie on a geometric progression.

## 4. What an explicit formula would have to supply

The Mellin transform of the zero mixture is
\[
\Psi_\xi(s):=\sum_nP_\xi(n)n^s
=
\sum_\rho\frac{w_\rho}{2}
\left[
\frac{M(2+2\eta_\rho-s)}{M(2+2\eta_\rho)}
+
\frac{M(2-2\eta_\rho-s)}{M(2-2\eta_\rho)}
\right]
\]
where it converges. In zero notation, the partition-function arguments are
\[
2+2\eta=1+\rho+\overline\rho,
\qquad
2-2\eta=3-\rho-\overline\rho.
\]
Thus the desired local coefficients depend on the **diagonal zero-pair data** \((\rho,\overline\rho)\), not on a holomorphic test function of \(\rho\) alone.

The standard explicit formula evaluates sums \(\sum_\rho f(\rho)\) for suitable holomorphic \(f\). It does not directly evaluate a normalized statistic involving \(M(1+\rho+\overline\rho-s)\). Squaring or polarizing the formula can introduce the needed conjugate-zero pairs, but also introduces all off-diagonal zero and prime pairs. Removing those terms is a new correlation theorem, not a consequence of the local factor \((1-p^{-s})^{-1}\) by itself.

The attempted bridge therefore reaches the exact bottleneck:
\[
\boxed{
\text{prove one local Hankel determinant is zero for the actual }P_\xi.
}
\]
This would establish the missing prime–zero link and RH. No such derivation was found.

## 5. Finite stress check

The companion program uses a 20,000 prime-power truncation and a reflected stress state with \(\eta=1/4\). For \(p=2,3,5,7,11\), it computes the first three local coefficients. The central state has zero Hankel determinant up to floating-point roundoff; the off-line stress mixture has a strictly positive determinant at each tested prime.

This validates the moment representation and its sign in a finite model. It does **not** estimate the determinant of the actual \(P_\xi\), whose zero displacements are the unknown.

## 6. Result and scope

A one-prime-power tower gives a concise positive certificate:
\[
\Delta_{p,1}
=P_\xi(p)P_\xi(p^3)-P_\xi(p^2)^2
\ge0,
\qquad
\Delta_{p,1}=0\iff\mathrm{RH}.
\]
The underlying positivity is exact and requires no assumptions about zero spacing or multiplicity beyond positive reflected weights. But no known Euler-product or one-variable explicit-formula identity sets \(\Delta_{p,1}=0\). Computing it from the zero mixture is already a two-point diagonal problem.

**Important boundary:** this local test is not the raw \((101,101)\) Chebyshev-energy term. The determinant involves a full positive mixture over all zero pairs and three powers of one prime. A single diagonal prime-pair contribution does not evaluate or cancel it.

No RH proof or new zero-free strip was obtained.

**Related audits:** [`geometric prime reweighting`](./rss-geometric-prime-reweighting.md), [`prime-pair splice link`](./rss-prime-pair-splice-link.md), [`prime-channel no-go`](./rss-prime-channel-contraction-no-go.md), and [`prime–zero intertwiner`](./rss-prime-zero-intertwiner.md).
