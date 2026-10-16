# Can one prime-index channel realize the horizontal contraction?

**Forty-fifth-stage investigation — 15 October 2026**  
**Question:** Can the Fisher-natural prime-power flow \(\eta\mapsto c\eta\) be implemented by a fixed positive stochastic operation on the prime ledger, and thereby provide its missing link to the actual \(\xi\) divisor?  
**Companion program:** `scripts/research-rss-prime-channel-contraction-no-go.py`  
**Machine-readable results:** `docs/rh/rss-prime-channel-contraction-no-go-results.json`

## Verdict

A natural positive-channel version of the missing link is impossible.

For
\[
p_a(n)=\frac{\Lambda(n)n^{-a}}{M(a)},
\qquad
M(a)=\sum_n\Lambda(n)n^{-a},
\qquad a>1,
\]
the golden contraction \(\eta\mapsto\eta/\varphi\) is the parameter map
\[
a\longmapsto a_c=2+c(a-2),
\qquad c=\varphi^{-1}\in(0,1).
\]
Suppose one fixed column-stochastic kernel \(K(r\mid n)\) on prime powers implemented that map:
\[
Kp_a=p_{a_c}
\]
for every \(a\) in an open interval. Then, for each output state \(r\),
\[
F_r(z)=\sum_nK(r\mid n)\Lambda(n)n^{-z}
\]
is holomorphic for \(\Re z>1\). Cross-multiplying the assumed identity by the normalizers gives a holomorphic identity, so analytic uniqueness extends it from the open interval to all real \(a>1\).

As \(a\to\infty\), both \(p_a\) and \(p_{a_c}\) concentrate at the first prime power, \(n=2\). Hence \(K\delta_2=\delta_2\), in particular \(K(3\mid2)=0\). The output mass at 3 is then bounded by all input mass outside 2:
\[
(Kp_a)(3)\le\sum_{n\ge3}p_a(n)
\sim\frac{\log3}{\log2}\left(\frac23\right)^a.
\]
But the desired contracted state requires
\[
p_{a_c}(3)
\sim\frac{\log3}{\log2}\left(\frac23\right)^{a_c}.
\]
Their ratio is asymptotic to
\[
\left(\frac23\right)^{a_c-a}
=\left(\frac32\right)^{(1-c)(a-2)}
\longrightarrow\infty.
\]
The target needs more mass at 3 than the input has at every state other than 2. That contradicts stochasticity.

Therefore:

> **Prime-index Markov channel no-go.** For every \(0<c<1\), no single parameter-independent Markov kernel on the prime-power basis sends \(p_a\) to \(p_{2+c(a-2)}\) on any nonempty open interval of parameters.

The argument is exact; it is not a finite-dimensional numerical obstruction.

## 1. What this attempt tests

The natural-gradient calculation derives a flow on the *parameter family* \(p_a\). A possible missing link would be an arithmetic operation on prime-power states that implements this flow without being told \(\eta\) separately. The theorem rules out the simplest positive realization: one fixed stochastic kernel acting on the prime-power index and valid across a continuum of feature states.

The reason is visible at the support edge. For large \(a\), nearly all input mass is at 2. A Markov kernel that preserves the limiting state cannot turn that mass into a larger 3-component. Yet parameter contraction decreases \(a\) toward 2, making the target tail at 3 decay more slowly. The shift cannot be paid for by any available input mass.

The \((101,101)\) pair is not special to this obstruction. It is part of the existing arithmetic family. The contradiction already follows from the first two prime powers, 2 and 3; it does not depend on a finite event or a fitted constant.

## 2. What the no-go does not say

The kernel assumption is deliberately explicit. It does **not** rule out:

- an \(\eta\)-dependent resampling rule, which would use the horizontal parameter directly rather than derive it from primes;
- a signed, non-Markov or nonlinear operator;
- an identity defined only on the unknown discrete set of actual \(\xi\)-zero displacements, which need not contain an open interval;
- a direct nonlinear explicit-formula identity or a positive all-scale arithmetic theorem.

In particular, the no-go is not a proof that same-\(\xi\) closure is impossible. It closes one candidate way of obtaining that closure.

## 3. Reconnection to the known global bridges

The previous prime-pair audit produced two exact criteria:

1. the all-scale critical Chebyshev-energy estimate implies Mellin holomorphy in \(\Re s>1/2\), hence \(\eta=0\) for every zero; that estimate is itself RH-equivalent and unproved;
2. the one-point defect \(\mathcal D_2\) is a convergent positive sum over off-line quartets and vanishes exactly under RH; its certified upper bound is tiny but not zero.

Neither criterion follows from the failure of a Markov channel. The present result says only that the parameter contraction cannot be transported to prime probabilities by one fixed positive stochastic kernel. A successful link must be a genuinely different arithmetic identity tying the **actual completed \(\xi\) divisor** to the fixed prime ledger.

## 4. Status

A plausible positive-channel bridge has been ruled out rigorously. The derived prime-family flow remains valid; its action on the actual \(\xi\)-zero ledger remains unproved. No new zero-free strip or RH proof is obtained.

**Preceding audit:** [`rss-prime-pair-splice-link.md`](./rss-prime-pair-splice-link.md) follows the \((101,101)\) term and identifies the exact all-scale energy and prime-anchor criteria.

**Nonlinear follow-up:** [`rss-geometric-prime-reweighting.md`](./rss-geometric-prime-reweighting.md) bypasses this channel no-go with a nonlinear geometric-mean map that exactly sends \(p_\eta\) to \(p_{c\eta}\). Its fixed-point link to the actual \(\xi\) mixture remains RH-equivalent and unproved.
