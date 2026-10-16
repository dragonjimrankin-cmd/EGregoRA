# Does the prime-pair event at 101 close the same-\(\xi\) contraction link?

**Forty-fourth-stage investigation — 15 October 2026**  
**Question:** Does the prime-supported catch-up at \(101\), especially the diagonal \((101,101)\) term \(\Lambda(101)^2\), connect the derived prime-power contraction to the actual \(\xi\)-zero divisor?  
**Companion program:** `scripts/research-rss-prime-pair-splice-link.py`  
**Machine-readable results:** `docs/rh/rss-prime-pair-splice-link-results.json`

## Verdict

An exact prime-to-zero **criterion** is available, but the requested same-\(\xi\) dynamical link is not proved.

The audit follows the \((101,101)\) term through two different pair ledgers:

1. In the raw finite Chebyshev-error energy, it contributes
   \[
   \Lambda(101)^2[2X-\max(X,101)]_+,
   \]
   which equals \(X(\log101)^2\) for \(X\ge101\). This is one local \(O(X)\) term in a global energy whose required bound is \(X^{2+o(1)}\).
2. In the centered Fisher metric that generates the prime-power natural gradient, the self-pair vanishes exactly. The metric is a sum over squared log-ratios, so the \((101,101)\) summand contains \(\log^2(101/101)=0\). Distinct prime-power cross-pairs, not the self-pair, supply the positive variance.

The complete all-scale Chebyshev pair-energy estimate would imply that every zero has \(\eta=0\), by Mellin holomorphy. But that estimate is equivalent to RH and remains unproved. Independently, the one-point Euler anchor gives an exact positive defect identity whose vanishing is also equivalent to RH. Its certified upper bound is tiny, not zero.

Therefore the exact conditional bridge is found, but the \((101,101)\) event does not establish the missing global estimate, prime-anchor conservation, or invariance of the actual \(\xi\) divisor under \(\eta\mapsto\eta/\varphi\). No zero-free strip or RH proof is obtained.

---

## 1. The prime-pair Fisher metric

For \(a>1\), let
\[
M(a)=\sum_{n\ge2}\frac{\Lambda(n)}{n^a},
\qquad
p_a(n)=\frac{\Lambda(n)n^{-a}}{M(a)},
\qquad
A(a)=\log M(a).
\]
Differentiating the absolutely convergent sum gives
\[
A''(a)
=\operatorname{Var}_{p_a}(\log n).
\]
Writing the variance as a pair sum yields the exact identity
\[
\boxed{
A''(a)
=\frac{1}{2M(a)^2}
\sum_{m,n\ge2}
\frac{\Lambda(m)\Lambda(n)}{(mn)^a}
\left(\log\frac mn\right)^2.
}
\tag{F}
\]
Every summand is nonnegative. Every diagonal self-pair \(m=n\) is exactly zero.

In particular, the \((101,101)\) term is
\[
\frac{\Lambda(101)^2}{2M(a)^2\,101^{2a}}
\left(\log\frac{101}{101}\right)^2=0.
\]
The prime \(101\) still participates through cross-pairs \((101,n)\) with \(n\ne101\), but its self-pair does not create a displacement force. The companion calculation at \(a=2\), truncated to prime powers through 20,000, gives Fisher variance \(1.005674024596929\), pairwise variance \(1.005674024596929\), zero self-pair contribution, and a positive \(0.00825154664185801\) subtotal from cross-pairs involving 101.

For \(a=2+2\eta\), the relative entropy to the central law satisfies
\[
\frac{dD}{d\eta}=4\eta A''(a),
\qquad
I_\eta=4A''(a).
\]
Thus the Fisher-natural gradient is
\[
\boxed{\dot\eta=-I_\eta^{-1}D'(\eta)=-\eta.}
\]
The prime-pair variance therefore supplies the exact mobility and dissipation law for the **feature-family parameter**. Formula (F) does not assert that a zero of \(\xi\) follows this flow.

## 2. The same diagonal in the Chebyshev pair ledger

Put
\[
\psi(x)=\sum_{n\le x}\Lambda(n),
\qquad
Y=2X,
\qquad
[u]_+=\max(u,0).
\]
Expanding and integrating the square gives the exact finite identity
\[
\begin{aligned}
E(X):=\int_X^{2X}(\psi(x)-x)^2\,dx
={}&\sum_{m,n\le2X}\Lambda(m)\Lambda(n)
 [2X-\max(X,m,n)]_+\\
&-\sum_{m\le2X}\Lambda(m)[(2X)^2-\max(X,m)^2]_+\\
&+\frac{(2X)^3-X^3}{3}.
\end{aligned}
\tag{P}
\]
Since \(\Lambda(101)=\log101\), the \((101,101)\) pair in the first sum contributes
\[
\boxed{(\log101)^2[2X-\max(X,101)]_+.}
\]
For \(X\ge101\), this is exactly \(X(\log101)^2\), an \(O(X)\) local term. It is present in the existing prime-pair ledger; adding the same event again would double-count it.

The target is not to identify or enlarge one diagonal term. It is to prove the all-scale cancellation in the **whole** expression:
\[
\boxed{
\forall\delta>0,\qquad
E(X)\ll_\delta X^{2+\delta}\quad(X\ge2).
}
\tag{CE}
\]
Individual terms in (P) naturally occur on the \(X^3\) scale. The diagonal \((101,101)\) term neither controls the off-diagonal pairs nor proves their cancellation against the linear and continuous terms.

## 3. The exact all-scale prime-pair-to-zero link

Let \(\widetilde E(x)=\psi(x)-(x-1)\). The all-scale bound (CE) is equivalent to
\[
\int_1^\infty |\widetilde E(x)|^2x^{-2-2\varepsilon}\,dx<\infty
\qquad\text{for every }\varepsilon>0.
\]
For \(\Re s>1\), partial summation gives
\[
\int_1^\infty \widetilde E(x)x^{-s-1}\,dx
=-\frac1s\frac{d}{ds}\log((s-1)\zeta(s)).
\tag{M}
\]
The weighted square-integrability and Cauchy–Schwarz extend the left side holomorphically to every \(\Re s>1/2\). By analytic uniqueness, (M) then holds there. A zero with \(\Re\rho>1/2\) would create a pole of the logarithmic derivative where the Mellin integral is holomorphic, a contradiction. Functional symmetry rules out zeros to the left as well. Therefore
\[
\boxed{(\mathrm{CE})\Longrightarrow \eta_\rho=0\text{ for every nontrivial zero}.}
\]
Conversely, RH gives the standard square-root bound for \(\psi(x)-x\), which implies (CE). Thus this is an exact arithmetic-to-zero bridge—but its required all-scale estimate is itself equivalent to RH, not a proved consequence of the event at 101.

This route uses the **full** prime-pair energy, including every diagonal and off-diagonal term. It is not a local \((101,101)\) argument and does not establish the prime-power gradient as a same-\(\xi\) evolution.

## 4. Direct one-point prime anchor

There is also a direct exact positive-defect bridge. At \(s=2\),
\[
\frac{\xi'}{\xi}(2)
=\frac32-\frac{\gamma_E+\log\pi}{2}
-\sum_{n\ge2}\frac{\Lambda(n)}{n^2},
\]
so \(\Lambda(101)/101^2\) is already one term of the ordinary anchor. Comparing it with the ordinate-projected zero sum gives
\[
\mathcal D_2
:=H_{\rm ord}(3/2)-\frac{\xi'}{\xi}(2)
=\sum_{\rm quartets}
\frac{6\eta^2(\eta^2+3\gamma^2-9/4)}
{(\gamma^2+9/4)[(\gamma^2-\eta^2+9/4)^2+4\eta^2\gamma^2]}.
\]
Every term is positive for an off-line quartet, hence
\[
\mathcal D_2\ge0,
\qquad
\mathcal D_2=0\iff\mathrm{RH}.
\]
The exact rational certificate establishes \(\mathcal D_2<9.274\times10^{-37}\). It does not establish \(\mathcal D_2=0\); an off-line quartet at sufficiently large height can make a positive contribution arbitrarily small.

This is the closest direct prime-to-horizontal-residue identity in the current work. It identifies what must vanish. The still-missing theorem is the vanishing itself—or, equivalently, defect-free critical-boundary continuation, the all-scale estimate (CE), or same-\(\xi\) invariance under strict contraction.

## 5. Where the proposed same-\(\xi\) bridge still breaks

The derived feature flow has a strict Lyapunov law. If a weighted ledger of actual zeros were known to follow it and also to preserve the corresponding completed prime/zero functional, then strict dissipation would force the ledger onto \(\eta=0\). But these are two separate statements:

- **Derived:** the normalized von-Mangoldt feature family has \(\dot\eta=-\eta\) and a positive pairwise Fisher metric.
- **Not derived:** the actual \(\xi\)-zero ledger is transported by that flow while retaining the same completed Euler product or a conserved aggregate residue.

Moving an off-line quartet changes its completed zero factor. The fixed prime ledger belongs to \(\xi\) at \(t=0\); no Euler product has been established for the synthetically moved divisor at \(t>0\). The raw \((101,101)\) pair term does not resolve that function-level compatibility.

## 6. Result

The requested link is now explicit at the level of exact implications:
\[
\boxed{
\text{all-scale prime-pair energy bound}
\Longrightarrow
\text{Mellin holomorphy in }\Re s>1/2
\Longrightarrow
\text{no horizontal displacement}.}
\]
A second exact bridge is the positive anchor defect \(\mathcal D_2\). The new audit clarifies why the event at 101 does not turn either bridge into a proof: the self-pair vanishes in the Fisher curvature, its raw energy contribution is local, and no global conservation law follows from it.

**Status:** the arithmetic-to-zero criterion is proved; the required same-\(\xi\) closure is not. No new zero-free strip or RH proof was found.

**Source reports:** [`critical Chebyshev energy`](./rss-critical-chebyshev-energy.md), [`prime-power dissipative law`](./rss-prime-power-dissipative-law.md), [`principal-prime anchor`](./rss-principal-prime-anchor.md), and [`prime-phase conservation`](./rss-prime-phase-conservation.md).

**Channel follow-up:** [`rss-prime-channel-contraction-no-go.md`](./rss-prime-channel-contraction-no-go.md) proves that no parameter-independent stochastic kernel on prime powers can realize \(\eta\mapsto c\eta\) across an open family of feature states. This rules out one natural route to the same-\(\xi\) link, without ruling out a nonlinear arithmetic identity or proving RH.

**Local diagonal follow-up:** [`rss-local-prime-power-diagonal-link.md`](./rss-local-prime-power-diagonal-link.md) derives a positive Hankel determinant along any one prime-power tower. Its exact vanishing at a single prime would force RH; the explicit formula has not been shown to supply that equality.
