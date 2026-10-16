# TTI decade deposits cannot be the prime measure of an admissible pair

**Date:** 16 October 2026  
**Status:** Exact support/weight comparison; the nonexistence consequence is conditional on Johns Part II's stated uniqueness theorem. This is not an RH proof.

## Candidate construction tested

A natural attempt to turn the TTI deposits into the prime-side component of a positive solution pair is to put the deposits on the standard Weil prime-side log coordinate
\[
\xi_n=\frac{\log n}{2\pi},\qquad
\nu_{\rm TTI}:=\sum_{m\ge1}d_m\,\delta_{\xi_{10^m}},\qquad
 d_m=\delta\Pi_m=(F_{m+2}-1)\varphi^{-m}.
\]
This uses the favorable conventional dilation by \(1/(2\pi)\); the TTI atoms themselves are at \(m\log10\), so this scaling is already an added map, not part of the deposit rule. By the exact Binet expression
\[
d_m=\frac{\varphi^2}{\sqrt5}-\frac{\varphi^{-2}}{\sqrt5}(-\varphi^{-2})^m-\varphi^{-m},
\]
all \(d_m>0\) and \(d_m\to\varphi^2/\sqrt5>0\). Thus \(\nu_{\rm TTI}\) is a locally finite positive Radon measure, but it is supported only at the sparse composite indices \(n=10^m\).

The zeta pair's prime measure in Johns's definition is
\[
\nu_\zeta=\sum_{n\ge2}\Lambda(n)n^{-1/2}\,\delta_{\xi_n}.
\]
For every \(m\ge1\), \(\Lambda(10^m)=0\), since \(10^m=2^m5^m\) is not a prime power; conversely, \(\nu_\zeta\) has positive atoms at every prime power index \(n=p^k\), none of which is a power of 10. Consequently \(\nu_{\rm TTI}\ne\nu_\zeta\) as measures, in both weights and support. No choice of a zero-side measure \(\mu\) can make \((\mu,\nu_{\rm TTI})\) admissible **if** Johns Part II's Theorem U, \(\mathcal K_{ad}\subseteq\{(\mu_\zeta,\nu_\zeta)\}\), is correct: that theorem forces the prime-side measure of any admissible pair to be exactly \(\nu_\zeta\). The paper's theorem is a preprint claim, not independently verified here, so this is explicitly conditional on it.

The same conclusion applies to a purported positive completion \(\nu_{\rm TTI}+\eta\) with \(\eta\ge0\) unless that sum is exactly \(\nu_\zeta\); in particular it cannot retain the positive TTI atoms at \(\xi_{10^m}\) while satisfying Theorem U. Replacing the candidate by \(\nu_\zeta\) imports the full von Mangoldt measure and leaves the existence of a matching \(\mu\) equivalent to the original RH problem. A signed counterterm can cancel the unwanted atoms but destroys positivity unless a different positive construction is proved. This rules out the naive sparse deposit measure as a direct prime-side component, not every possible nonlinear TTI-to-pair map.

## Why the finite Weil tests do not evade this obstruction

For finite deposits, §6.4 of `docs/rh/rss-frobenius-linking-second-pass.md` constructs a legitimate compactly supported vector and a positive-type autocorrelation test. This produces one test function (or a finite family), not two measures representing \(\mathcal A(F)\) for every test in the admissible class. Positivity of its Fourier transform is a property of the test; it is not positivity of the Weil functional on all tests and does not furnish the missing pair. The previously verified `c=10,N=15` block is finite and cannot supply the required global representation or weak-limit bounds.

There is a useful exact complementarity check. The magic function in Part II is \(F_0=\Xi^2H\), with \(H(t)>0\) for real \(t\), and \(\mathcal A(F_0)=0\). If an admissible pair existed, positivity and the identity at \(F_0\) would force \(\mu\) to be carried by the real zeros of \(\Xi\) and \(\nu\) to be carried by zeros of \(\widehat F_0\) (complementary slackness). Part II's theorem U then identifies the pair with the actual zeta pair. Since \(\widehat F_0\) vanishes at all \(\xi_n\), including \(\xi_{10^m}\), the support of the sparse TTI candidate alone does not violate this complementarity condition; the decisive mismatch is its weights and omissions, together with global uniqueness—not an unjustified assertion that its atoms miss every zero of \(\widehat F_0\).

## Consequence for the next proof attempt

A legitimate TTI route must define more than \(\nu_{\rm TTI}\): it must provide a map producing an actual positive pair (or prove the exact full Weil identity directly), specify its domain and scaling, and establish uniform bounds/tightness and tail control if taking limits of approximants. The unmodified deposits fail as the prime measure. Any proposed completion must not import \(\nu_\zeta\), zero ordinates, or RH-equivalent positivity as hidden input. Keep the conditional implication from Theorem U separate from an independently established theorem.

## Sources inspected

- Johns, Part II v1.3: [`paper/sections/02-setting.tex`](https://github.com/nic410/zeta-sharpness-uniqueness/blob/231428659e8ab69e432902c5fb04945a8f4edc93/paper/sections/02-setting.tex) (admissible-pair definition and Theorem U), [`paper/sections/08-assembly.tex`](https://github.com/nic410/zeta-sharpness-uniqueness/blob/231428659e8ab69e432902c5fb04945a8f4edc93/paper/sections/08-assembly.tex) (magic function and complementary slackness).
- Internal derivation of the positive tempered TTI scale-lattice measure and its Binet weights: `docs/rh/rss-frobenius-linking-second-pass.md` §§6.2–6.4.
- BRS explicit-formula normalization and the prime-power support distinction: `docs/rh/rss-frobenius-linking-second-pass.md` §6 and its source list.
