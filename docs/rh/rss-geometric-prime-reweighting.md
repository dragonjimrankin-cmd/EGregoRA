# A nonlinear prime-ledger contraction—and its full-support fixed-point gate

**Forty-sixth-stage investigation — 15 October 2026**  
**Question:** After a fixed prime-index Markov channel was ruled out, can a different positive arithmetic map realize the derived contraction and connect it to the actual \(\xi\) ledger?  
**Companion program:** `scripts/research-rss-geometric-prime-reweighting.py`  
**Machine-readable results:** `docs/rh/rss-geometric-prime-reweighting-results.json`

## Verdict

There is a canonical **nonlinear** positive map on prime-power probability ledgers that exactly realizes the feature-family contraction. For a probability law \(q\) and \(0<c<1\), set
\[
\boxed{
\mathcal G_c(q)(n)
=
\frac{q(n)^c p_0(n)^{1-c}}
{Z_c(q)},
\qquad
Z_c(q)=\sum_mq(m)^cp_0(m)^{1-c}.
}
\tag{G}
\]
Hölder gives \(Z_c(q)\le1\), with equality precisely when \(q=p_0\).

For
\[
p_0(n)=\frac{\Lambda(n)n^{-2}}{M(2)},
\qquad
p_\eta(n)=\frac{\Lambda(n)n^{-2-2\eta}}{M(2+2\eta)},
\qquad
M(a)=\sum_n\Lambda(n)n^{-a},
\]
one obtains exactly
\[
\boxed{\mathcal G_c(p_\eta)=p_{c\eta}.}
\]
Thus \(c=1/\varphi\) gives the golden contraction without a fixed stochastic channel.

**Support qualification:** the fixed points on the whole probability simplex are not unique. They are exactly the laws \(p_0\) conditioned on a nonempty support \(S\):
\[
q_S(n)=\frac{p_0(n)\mathbf 1_{n\in S}}{p_0(S)}.
\]
Consequently, \(p_0\) is the **unique full-support** fixed point. The actual dephased zero mixture \(P_\xi\) has full support, since each zero-conditioned feature \(p_\eta\) is positive at every prime power and the mixture has positive weights. Hence
\[
\mathcal G_c(P_\xi)=P_\xi
\quad\Longleftrightarrow\quad
P_\xi=p_0
\quad\Longleftrightarrow\quad
\mathrm{RH}.
\]

This is a precise nonlinear fixed-point formulation of the desired prime–zero link. **The fixed-point premise remains unproved.** The explicit formula is linear and signed; it gives no invariance of the nonlinear aggregate \(P_\xi\) under \(\mathcal G_c\). Establishing that invariance would already establish the RH-equivalent global frame identity. The contraction is realized on prime distributions, but its application to the actual \(\xi\)-divisor remains open.

---

## 1. Exact action on a single feature state

For \(q=p_\eta\),
\[
\begin{aligned}
q(n)^c p_0(n)^{1-c}
&=
\left(\frac{\Lambda(n)n^{-2-2\eta}}{M(2+2\eta)}\right)^c
\left(\frac{\Lambda(n)n^{-2}}{M(2)}\right)^{1-c}\\
&=
\frac{\Lambda(n)n^{-2-2c\eta}}
{M(2+2\eta)^cM(2)^{1-c}}.
\end{aligned}
\]
Summing over \(n\) gives
\[
Z_c(p_\eta)
=
\frac{M(2+2c\eta)}
{M(2+2\eta)^cM(2)^{1-c}},
\]
so normalization yields \(p_{c\eta}\) exactly for every \(-1/2<\eta<1/2\).

In likelihood-ratio form,
\[
\frac{\mathcal G_c(q)(n)}{p_0(n)}
=
\frac{(q(n)/p_0(n))^c}{Z_c(q)}.
\]
The map is nonlinear in \(q\), so it bypasses the Stage-45 fixed-channel no-go without contradicting it.

## 2. Complete fixed-point classification

The map preserves support: \(\mathcal G_c(q)(n)>0\) exactly where \(q(n)>0\). Suppose \(\mathcal G_c(q)=q\) and let \(S=\{n:q(n)>0\}\). On \(S\),
\[
\left(\frac{q(n)}{p_0(n)}\right)^{1-c}=Z_c(q)^{-1},
\]
so \(q\) is proportional to \(p_0\) on its support. Normalization fixes the proportionality constant:
\[
q(n)=\frac{p_0(n)}{p_0(S)}\mathbf 1_{n\in S}.
\]
Conversely, direct substitution shows every such conditional law is fixed, with \(Z_c(q)=p_0(S)^{1-c}\). Taking \(S\) to be all prime powers gives the unique full-support fixed point \(p_0\).

This support qualification matters: a fixed-point argument for an arbitrary ledger alone is insufficient. It becomes conclusive for \(P_\xi\) because the zero-feature mixture has full support.

## 3. Relative-entropy dissipation

For \(0<t\le1\), define
\[
L(t)=\log\sum_n p_0(n)\left(\frac{q(n)}{p_0(n)}\right)^t,
\qquad
q_t=\mathcal G_t(q).
\]
Under the usual finite-entropy and differentiation conditions,
\[
D(q_t\Vert p_0)=tL'(t)-L(t)
\]
and
\[
\boxed{
\frac{d}{dt}D(q_t\Vert p_0)
=tL''(t)
=t\operatorname{Var}_{q_t}
\!\left(\log\frac q{p_0}\right)\ge0.
}
\]
Thus moving from \(t=1\) down to \(c<1\) never increases KL divergence. It decreases it **strictly** unless \(q/p_0\) is constant on the support of \(q\), i.e. unless \(q\) is one of the conditional fixed points above. In particular, it strictly decreases KL for every full-support \(q\ne p_0\).

For the feature family this is the exact prime-power entropy dissipation under \(\eta\mapsto c\eta\). The finite regression checks six displacements and a reflected, full-support off-line stress mixture; each noncentral input moves closer to \(p_0\), and the reflected mixture is not fixed.

## 4. What this gives for the actual zero ledger

If an independent theorem established \(\mathcal G_c(P_\xi)=P_\xi\) for any one \(0<c<1\), the full-support fixed-point classification would give \(P_\xi=p_0\). Positive-mixture rigidity then gives \(\eta_\rho=0\) for every zero.

The invariance does not follow merely because:

- \(P_\xi\) has total mass one or full support;
- the Euler product defines \(p_0\);
- the feature states individually obey \(\mathcal G_c(p_\eta)=p_{c\eta}\); or
- the functional equation reflects \(\eta\) to \(-\eta\).

The map is nonlinear, so applying it to a mixture is not the same as contracting each zero component and summing. No explicit-formula identity equating the nonlinear postprocessed mixture before and after the map is known here. Asserted invariance of \(P_\xi\) would itself be RH-equivalent.

## 5. Result

A positive nonlinear prime-ledger operation now exactly implements the golden contraction. Its full-support fixed point is uniquely \(p_0\), and the actual zero mixture is full-support. This gives the precise criterion
\[
\text{same-}\xi\text{ invariance under }\mathcal G_{1/\varphi}
\Longleftrightarrow
P_\xi=p_0
\Longleftrightarrow
\mathrm{RH}.
\]
The first relation is the missing arithmetic statement. No proof of it, no new zero-free strip and no RH proof were found.

**Local-tower follow-up:** [`rss-local-prime-power-diagonal-link.md`](./rss-local-prime-power-diagonal-link.md) reduces the fixed-point condition to one prime's three consecutive prime-power masses; a zero Hankel determinant would force RH, but its value for the actual \(P_\xi\) remains unproved.

**Related audits:** [`prime-index channel no-go`](./rss-prime-channel-contraction-no-go.md), [`positive prime–zero intertwiner`](./rss-prime-zero-intertwiner.md), [`logarithmic dephasing`](./rss-logarithmic-dephasing.md), and [`prime-pair splice link`](./rss-prime-pair-splice-link.md).
