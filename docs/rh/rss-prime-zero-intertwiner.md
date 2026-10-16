# A positive prime–zero feature intertwiner candidate and its pair-correlation gate

**Fortieth-stage investigation — 15 October 2026**  
**Question:** Can the actual \(\xi\) divisor be intertwined with the von-Mangoldt dissipative law by a positive identity?  
**Companion program:** `scripts/research-rss-prime-zero-intertwiner.py`  
**Machine-readable results:** `docs/rh/rss-prime-zero-intertwiner-results.json`

## Verdict

A canonical positive prime–zero **feature map** has been constructed, together with a new RH-equivalent boundedness criterion. The identity needed to apply that criterion has not been proved.

For a centered zero coordinate
\[
\rho=\frac12+\eta+i\gamma,
\]
define the normalized von-Mangoldt feature
\[
\boxed{
\psi_{\eta,\gamma}(n)
=
\frac{
\sqrt{\Lambda(n)}
n^{-1-\eta-i\gamma}}
{\sqrt{M(2+2\eta)}},
}
\]
where
\[
M(a)=
\sum_{n\ge2}\Lambda(n)n^{-a}
=-\frac{\zeta'}{\zeta}(a).
\]
Then
\[
\sum_n
|\psi_{\eta,\gamma}(n)|^2=1
\]
and, crucially,
\[
\boxed{
|\psi_{\eta,\gamma}(n)|^2
=p_\eta(n).
}
\]
The ordinate phase cancels on the probability diagonal. A reflected pair therefore produces the positive mixture
\[
\frac12
\left(p_\eta+p_{-\eta}ight).
\]

Weight every upper reflected zero pair positively by a convergent ordinate weight, for example
\[
w_\rho
\propto
\frac{m(\rho)}{\gamma_\rho^2+9/4},
\qquad
\sum_ho w_\rho=1,
\]
and define
\[
P_\xi(n)
=
\sum_ho
w_\rho
\frac{p_{\eta_\rho}(n)+p_{-\eta_\rho}(n)}2.
\]
Then
\[
\boxed{
\mathrm{RH}
\iff
P_\xi=p_0
\text{ on all prime powers}.
}
\]
In fact a weaker boundedness condition suffices:
\[
\boxed{
\mathrm{RH}
\iff
\sup_{p^k}
\frac{P_\xi(p^k)}{p_0(p^k)}
<\infty.
}
\]
If any \(\eta>0\) occurs with positive weight, its reflected \(p_{-\eta}\) contribution grows relative to \(p_0\) like \(n^{2\eta}\), making the ratio unbounded.

This is a sharp positive intertwiner criterion. The missing theorem is the arithmetic identity or bound
\[
P_\xi(n)=p_0(n)
\quad\text{or at least}\quad
P_\xi(n)\le Cp_0(n).
\]
Linear averaging of feature vectors cannot prove it: it retains or deletes the oscillatory ordinate carrier. A coherent quadratic lift contains two-prime off-diagonal entries. The Stage-41 follow-up shows, however, that logarithmic conjugation-averaging annihilates those entries exactly and retains the positive diagonal. Pair control is therefore unnecessary for constructing the dephased map; it is required only for coherent prime-side reconstruction. The global arithmetic bound remains unproved, and RH remains open.

---

## 1. Exact feature construction

The Stage-39 arithmetic state is
\[
p_\eta(n)
=
\frac{\Lambda(n)n^{-2-2\eta}}
{M(2+2\eta)}.
\]
Taking its canonical complex square root and inserting the ordinate character gives
\[
\psi_{\eta,\gamma}(n)
=
\sqrt{p_\eta(n)}e^{-i\gamma\log n}.
\]
This is an arithmetic analogue of a phase-bearing “being”: \(\eta\) changes the amplitude distribution over prime powers, while \(\gamma\) changes only phase.

The deterministic calculation checked five states on 18,120 prime powers through 200,000. Every feature norm differed from one by less than \(3\times10^{-16}\), and every diagonal differed from \(p_\eta\) by less than \(1.2\times10^{-16}\).

Thus proximity-style phase alignment can affect the characters \(e^{-i\gamma\log n}\), while the RH obstruction remains in the amplitude law \(p_\eta\). This recovers the earlier phase/support separation inside one arithmetic Hilbert space.

## 2. Global positive-mixture rigidity

Under RH, every \(\eta_\rho=0\), so every reflected diagonal is \(p_0\) and therefore
\[
P_\xi=p_0.
\]

Conversely, suppose some pair has \(\eta_\rho>0\) and positive weight. Its reflected slow-decay component satisfies
\[
\frac{p_{-\eta_\rho}(n)}{p_0(n)}
=
\frac{M(2)}{M(2-2\eta_\rho)}
n^{2\eta_\rho}.
\]
Every term in \(P_\xi\) is nonnegative. No other term can cancel this growth. Hence
\[
\frac{P_\xi(n)}{p_0(n)}
\longrightarrow\infty
\]
along prime powers. This proves both the equality and boundedness criteria.

A toy ledger containing one critical pair and two off-line pairs at \(\eta=0.1\) and \(0.25\) produced:

- total variation from \(p_0\): \(0.0127458\);
- relative entropy from \(p_0\): \(0.00310715\);
- mixture/central ratio rising from \(0.9940\) at \(n=2\) to \(12.8098\) near \(n=200{,}000\).

The all-critical control agreed with \(p_0\) to floating-point precision.

## 3. Why linear phase averaging cannot establish the identity

Write \(u=\log x\). Translation averaging by a positive measure \(\mu\) sends
\[
e^{i\gamma u}
\longmapsto
\widehat\mu(\gamma)e^{i\gamma u}.
\]
If \(\widehat\mu(\gamma)\ne0\), the oscillation remains. If it is zero, that ordinate mode is deleted rather than converted into the positive \(p_\eta\) diagonal.

A Gaussian phase average with width \(0.02\) was tested at \((\eta,\gamma)=(1/4,15)\). It multiplied every carrier by the positive factor
\[
e^{-\sigma^2\gamma^2/2},
\]
so all signs were retained: 9,616 positive and 8,504 negative prime-power carriers remained.

Therefore no translation-invariant linear positive phase average can turn every unknown ordinate mode into the required gamma-independent Gibbs probability.

## 4. Coherent quadratic lifting creates prime pairs before dephasing

The rank-one density operator
\[
|\psi_\rho\rangle
\langle\psi_\rho|
\]
has the desired diagonal \(p_\eta\). Its off-diagonal entry is
\[
\frac{
\sqrt{\Lambda(n)\Lambda(m)}
n^{-1-\eta}m^{-1-\eta}
e^{-i\gamma\log(n/m)}}
{M(2+2\eta)}.
\]
This depends on two prime powers and their logarithmic ratio. Reconstructing the **full coherent operator** from the prime side would require a two-prime correlation identity, not the one-point moment
\[
-\frac{\zeta'}{\zeta}(2).
\]

The subsequent [`rss-logarithmic-dephasing.md`](./rss-logarithmic-dephasing.md) audit separates coherent reconstruction from diagonal construction. The logarithmic twirl
\[
\mathcal D_T(A)=\frac1{2T}\int_{-T}^{T}U_tAU_t^*dt,
\qquad U_te_n=e^{-it\log n}e_n,
\]
multiplies \(A_{nm}\) by \(\operatorname{sinc}(T\log(n/m))\). It therefore annihilates every \(n\ne m\) entry in the limit and keeps \(p_\eta\) exactly. No pair estimate is needed for this dephased positive map.

Autocorrelation and critical-energy estimates remain relevant only if one insists on coherent prime-side reconstruction or uses them to prove the surviving global bound. They are not prerequisites for defining the positive diagonal.

## 5. Bridge attempts

| Attempt | Outcome |
|---|---|
| Linear log-scale phase averaging | Retains oscillatory signs unless it deletes the mode |
| Delete all nonzero ordinate modes | Deletes the zero information as well |
| Coherent quadratic density operator | Gives the correct positive diagonal and also introduces prime-pair off-diagonals |
| Logarithmic density twirl | Exactly removes all off-diagonals and retains \(p_\eta\); construction gate resolved |
| Weil autocorrelation test | Unnecessary for dephasing; remains an RH-equivalent route to the global bound |
| Critical Chebyshev energy | Unnecessary for dephasing; remains an unresolved RH-equivalent route to the global bound |

## 6. Narrow target

The proof target is now:

> Prove from the completed explicit formula a positive frame or diagonal identity \(P_\xi=p_0\), or merely a uniform bound \(P_\xi\le Cp_0\), for the ordinate-weighted von-Mangoldt zero features.

The boundedness version is already enough because any off-line pair forces polynomial tail growth relative to \(p_0\).

The dephased map itself no longer needs two-prime control: lift first and then logarithmically twirl. Any proposed **prime-side proof of the global bound**, however, must still identify a valid arithmetic theorem rather than silently assume Weil positivity, critical Chebyshev energy or another RH-equivalent assertion.

## Evidence boundary

Proved here:

- the normalized von-Mangoldt feature map attached to each zero coordinate;
- exact ordinate-phase cancellation on its probability diagonal;
- an RH-equivalent positive global-mixture criterion;
- the weaker RH-equivalent boundedness criterion;
- the linear phase-average no-go;
- identification of the coherent quadratic lift’s two-prime off-diagonal terms;
- in the Stage-41 follow-up, exact removal of those terms by a logarithmic CPTP twirl.

Not proved:

- the frame identity \(P_\xi=p_0\);
- a uniform arithmetic bound for \(P_\xi/p_0\);
- a same-\(\xi\) prime-side theorem forcing the dephased output to be central;
- RH.

## Final status

The same-\(\xi\) intertwiner now has a canonical candidate and a minimal sufficient bound:
\[
\boxed{
P_\xi(n)
\le Cp_0(n)
\text{ on all prime powers}
\Longrightarrow
\mathrm{RH}.
}
\]
The positive diagonal is exact, but deriving its global frame bound from fixed prime arithmetic remains open.

**Dephasing follow-up:** [`rss-logarithmic-dephasing.md`](./rss-logarithmic-dephasing.md) proves that lift-then-average logarithmic twirling removes every off-diagonal prime pair without estimating it, while retaining \(\eta\) and allowing \(\gamma\) to be kept in a classical register. This resolves the phase-removal and diagonal-construction gates, not the RH-equivalent global frame bound.
