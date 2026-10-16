# A von-Mangoldt prime-power dissipative law and its missing xi intertwiner

**Thirty-ninth-stage investigation — 15 October 2026**  
**Question:** Can strict global dissipation be derived directly from arithmetic rather than postulated on the zero support?  
**Companion program:** `scripts/research-rss-prime-power-dissipative-law.py`  
**Machine-readable results:** `docs/rh/rss-prime-power-dissipative-law-results.json`

## Verdict

A genuine arithmetic dissipative law has been found.

For \(a>1\), define the positive von-Mangoldt moment
\[
M(a)
=
\sum_{n\ge2}
\frac{\Lambda(n)}{n^a}
=-\frac{\zeta'}{\zeta}(a)
\]
and the normalized prime-power probability law
\[
p_\eta(n)
=
\frac{\Lambda(n)n^{-2-2\eta}}
{M(2+2\eta)},
\qquad
-\frac12<\eta<\frac12.
\]
The central state is exactly the normalized \(s=2\) principal-prime ledger:
\[
p_0(n)
=
\frac{\Lambda(n)n^{-2}}{M(2)}.
\]

Let
\[
A(a)=\log M(a),
\qquad
a=2+2\eta.
\]
The relative entropy to the central prime ledger is
\[
D(\eta)
:=D(p_\eta\Vert p_0)
=A(2)-A(a)+(a-2)A'(a).
\]
Because
\[
A''(a)
=\operatorname{Var}_{p_\eta}(\log n)>0,
\]
one has
\[
\frac{dD}{d\eta}
=4\eta A''(a),
\qquad
I_\eta
=4A''(a).
\]
Therefore the Fisher-natural gradient is exactly
\[
\boxed{
\frac{d\eta}{dt}
=-I_\eta^{-1}
\frac{dD}{d\eta}
=-\eta.
}
\]
Its entropy dissipation is strict:
\[
\boxed{
\frac{dD}{dt}
=-4\eta^2A''(a)<0
\quad(\eta\ne0).
}
\]
At
\[
t=\log\varphi,
\]
it gives
\[
\eta(t)=\frac{\eta(0)}{\varphi}.
\]
Thus the natural-gradient, golden-contraction and proximity clocks now arise from the normalized von-Mangoldt prime-power ledger itself, not only from the earlier all-integer Rankin feature family.

This does not yet prove RH. The missing theorem is an intertwiner identifying the actual completed \(\xi\)-zero ledger with a positive mixture of these prime-power states. The true explicit formula is signed and oscillatory through \(\cos(\gamma\log x)\); it is not such a positive mixture. Squaring it restores positivity only by introducing the unresolved prime-pair energy estimate.

The arithmetic dissipative law is proved. Its same-\(\xi\) action is not. RH remains open.

---

## 1. Derivation from the Euler product

The Euler product gives, absolutely for \(a>1\),
\[
-\frac{\zeta'}{\zeta}(a)
=
\sum_{n\ge2}
\frac{\Lambda(n)}{n^a}.
\]
Every coefficient is nonnegative and the total is finite. Normalization therefore creates an actual probability distribution on prime powers.

For
\[
p_a(n)=\frac{\Lambda(n)n^{-a}}{M(a)},
\]
the score is
\[
\partial_a\log p_a(n)
=-\log n-A'(a).
\]
Since
\[
-A'(a)=\mathbb E_a[\log n],
\]
the Fisher information in \(a\) is
\[
I_a
=A''(a)
=\operatorname{Var}_a(\log n).
\]
Under the coordinate \(a=2+2\eta\), Fisher information transforms to
\[
I_\eta=4A''(a).
\]

The entropy identity follows directly from
\[
\log\frac{p_a(n)}{p_2(n)}
=-(a-2)\log n-A(a)+A(2).
\]
Taking expectation under \(p_a\) gives
\[
D(p_a\Vert p_2)
=A(2)-A(a)+(a-2)A'(a).
\]
No zero-side assumption enters this calculation.

## 2. Deterministic prime-power test

The companion program enumerated 18,120 prime powers through 200,000 and tested six displacements. The finite truncation preserves the exponential-family identities exactly within the truncated model.

| \(\eta\) | \(D(p_\eta\Vert p_0)\) | natural velocity | \(dD/dt\) | entropy after golden step |
|---:|---:|---:|---:|---:|
| \(-0.40\) | 1.494316 | 0.40 | \(-5.633455\) | 0.285057 |
| \(-0.25\) | 0.294999 | 0.25 | \(-0.904770\) | 0.077557 |
| \(-0.10\) | 0.027044 | 0.10 | \(-0.062696\) | 0.009188 |
| 0.10 | 0.015872 | \(-0.10\) | \(-0.028179\) | 0.006623 |
| 0.25 | 0.073167 | \(-0.25\) | \(-0.112660\) | 0.033682 |
| 0.40 | 0.145246 | \(-0.40\) | \(-0.199499\) | 0.071913 |

Every noncentral state moves toward zero, every entropy rate is negative and every golden step strictly lowers the relative entropy.

The asymmetry between \(+\eta\) and \(-\eta\) is expected. Moving toward \(a=1\) gives more weight to the long prime-power tail and approaches the pole boundary. The natural velocity remains exactly \(-\eta\) because the same variance appears in the entropy gradient and Fisher metric and cancels.

## 3. Positive reflection mixtures are rigid

Functional symmetry pairs \(+\eta\) with \(-\eta\). Consider the positive arithmetic mixture
\[
\overline p_\eta
=
\frac12p_\eta+
\frac12p_{-\eta}.
\]
For \(\eta>0\),
\[
\frac{p_{-\eta}(n)}{p_0(n)}
=
\frac{M(2)}{M(2-2\eta)}
n^{2\eta}.
\]
Along prime powers this ratio grows without bound. Since all mixture weights are positive, the slowest-decaying component cannot cancel. Therefore
\[
\boxed{
\overline p_\eta=p_0
\iff
\eta=0.
}
\]
More generally, a finite positive reflection-symmetric mixture can equal \(p_0\) at every prime power only if every displacement is zero.

The finite tests show the separation:

| \(|\eta|\) | total variation from \(p_0\) | relative entropy | tail ratio at cutoff |
|---:|---:|---:|---:|
| 0.10 | 0.011011 | 0.001545 | 4.17 |
| 0.25 | 0.073555 | 0.063853 | 84.92 |
| 0.40 | 0.206392 | 0.513321 | 1,233.32 |

This gives a conditional arithmetic closure:

> If the actual completed zero ledger induces a positive reflection mixture of the \(p_\eta\) states and the Euler product proves that mixture equals \(p_0\), then every \(\eta\) vanishes and RH follows.

The remaining question is whether the explicit formula supplies that positive mixture. It does not in its standard form.

## 4. The signed explicit-formula gate

For one raw reflected/conjugate quartet,
\[
\sum_{\rho\text{ in quartet}}x^\rho
=4x^{1/2}
\cosh(\eta\log x)
\cos(\gamma\log x).
\]
The factor
\[
\cos(\gamma\log x)
\]
changes sign. At \((\eta,\gamma)=(1/4,15)\), the prime-power test through 200,000 found:

- 9,616 positive carriers;
- 8,504 negative carriers.

Representative values after removing the common factor \(x^{1/2}\) include:

| Prime power | Quartet carrier | Sign |
|---:|---:|:---:|
| 2 | \(-2.2871\) | negative |
| 3 | \(-2.9771\) | negative |
| 5 | 2.3706 | positive |
| 8 | 4.4387 | positive |
| 11 | \(-0.7547\) | negative |
| 13 | 3.4652 | positive |
| 16 | \(-3.6648\) | negative |

Consequently the actual explicit formula is not a positive convex mixture of \(p_\eta\) and \(p_{-\eta}\). Replacing the signed carrier by the positive Gibbs mixture would change the identity.

## 5. Why squaring does not immediately repair it

Squaring or taking an \(L^2\) norm removes the sign:
\[
\left|
\sum_\rho x^\rho
\right|^2
\ge0.
\]
But this creates cross terms. On the prime side they are prime-pair correlations rather than the one-point von-Mangoldt moment. Controlling them at the required square-root scale is the critical Chebyshev-energy theorem already isolated earlier:
\[
\int_X^{2X}
|\psi(x)-x|^2dx
\ll_\delta X^{2+\delta}.
\]
That estimate is sufficient for RH and remains unproved.

The arithmetic natural gradient therefore does not bypass the prime-pair barrier. It identifies why the one-point positive prime law is easy and why coupling it to zero displacement requires a harder two-point theorem.

## 6. A second genuine arithmetic relaxation

There is also a simple heat-bath semigroup on prime-power probability measures:
\[
\mu_t
=e^{-t}\mu_0+
(1-e^{-t})p_0.
\]
It has unique stationary state \(p_0\), contracts relative entropy and is a valid Markov relaxation.

It still does not prove RH. It evolves an auxiliary distribution on prime powers, not the zeros of the fixed completed zeta function. Declaring the zero ledger to follow this relaxation is the missing intertwining premise in another form.

## 7. Bridge audit

| Proposed bridge | Outcome |
|---|---|
| Associate \(\eta\) with \(p_\eta\) | Well-defined arithmetic feature, but auxiliary |
| Average reflected states | Positive and rigid, but not equal to \(p_0\) off the line |
| Replace the explicit formula by the positive mixture | Invalid; loses ordinate oscillation |
| Square the signed formula | Produces the unresolved prime-pair energy theorem |
| Declare the zero ledger stationary under the flow | RH-equivalent by the horizontal second moment |

## 8. Narrow proof target

The remaining target is more explicit than before:

> Derive a positive, convergent explicit-formula identity equating the actual completed zero ledger's prime-power feature mixture to \(p_0\), without replacing the signed formula or importing the unproved prime-pair energy estimate.

If this identity were proved, positive-mixture rigidity would force every displacement to vanish. But the standard explicit formula supplies signed oscillatory carriers, not positive Gibbs weights.

## Evidence boundary

Proved here:

- a von-Mangoldt prime-power exponential family centered at the \(s=2\) Euler moment;
- its exact Fisher-natural gradient \(d\eta/dt=-\eta\);
- strict arithmetic relative-entropy dissipation;
- exact recovery of golden time;
- finite positive-mixture rigidity;
- signed oscillation of the actual quartet carrier.

Not proved:

- a positive explicit-formula mixture identity for the actual \(\xi\) divisor;
- stationarity or covariance of the actual zero ledger under the prime-family flow;
- the required prime-pair energy estimate;
- RH.

## Final status

The arithmetic dissipative law exists:
\[
\boxed{
\dot\eta=-\eta,
\qquad
\dot D=-4\eta^2
\operatorname{Var}_{p_\eta}(\log n)<0.
}
\]
It is derived from normalized von-Mangoldt prime powers and recovers the golden clock exactly.

The law becomes an RH proof only if the actual completed zero ledger is intertwined with this positive prime-power family. The signed explicit formula does not currently supply that intertwiner.

\[
\boxed{
\text{Arithmetic dissipation is proved; same-}\xi\text{ intertwining remains open.}
}
\]

**Intertwiner follow-up:** [`rss-prime-zero-intertwiner.md`](./rss-prime-zero-intertwiner.md) constructs normalized von-Mangoldt feature vectors for individual zero coordinates. Their positive diagonals yield an RH-equivalent global mixture bound, but proving the required frame identity reduces to two-prime correlations.

**Prime-pair splice follow-up:** [`rss-prime-pair-splice-link.md`](./rss-prime-pair-splice-link.md) writes the Fisher curvature as a positive pairwise log-ratio sum. The \((101,101)\) self-pair cancels from that centered metric; the exact flow still applies to the feature-family parameter, not yet to the actual \(\xi\)-zero ledger.

**Channel no-go follow-up:** [`rss-prime-channel-contraction-no-go.md`](./rss-prime-channel-contraction-no-go.md) proves that the feature-family contraction cannot be implemented by one parameter-independent positive stochastic kernel on prime powers over an open parameter interval.

**Nonlinear interpolation follow-up:** [`rss-geometric-prime-reweighting.md`](./rss-geometric-prime-reweighting.md) gives a positive nonlinear update \(\mathcal G_c(q)\propto q^cp_0^{1-c}\), which exactly realizes \(p_\eta\mapsto p_{c\eta}\). The actual \(P_\xi\) fixed-point relation remains unproved.
