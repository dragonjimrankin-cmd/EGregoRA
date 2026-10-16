# No positive log-translation convolution sends TTI deposits to the zeta prime measure

**Date:** 16 October 2026  
**Candidate lemma:** A nonzero positive convolution smoothing of the TTI decade-lattice measure cannot have the prime-power support required of the zeta prime measure.  
**RH relevance:** This rules out a natural, explicitly specified class of TTI-to-prime-measure maps. It does not rule out nonlinear or non-translation-equivariant maps, and the implication to nonexistence of an admissible pair is conditional on Johns Part II's unreviewed uniqueness theorem.

## Definitions

Let \(L=\log 10\), and write the TTI log-scale deposit measure as
\[
\mu_D=\sum_{m\ge1}d_m\delta_{mL},\qquad
 d_m=(F_{m+2}-1)\varphi^{-m}>0.
\]
The explicit Binet expression gives \(d_m\to\varphi^2/\sqrt5>0\). In unscaled logarithmic coordinates, the zeta prime measure is
\[
\nu_\zeta^{\log}=\sum_{n\ge2}\Lambda(n)n^{-1/2}\delta_{\log n},
\]
with support
\[
\mathcal P=\{a\log p:p\text{ prime},\ a\in\mathbb Z_{\ge1}\}.
\]
The standard Weil coordinate is \(\xi=\log n/(2\pi)\); scaling both source and target by \(1/(2\pi)\) does not alter the support argument below.

Consider the following concrete class of positive, log-translation-equivariant smoothings. Let \(\kappa\ne0\) be a positive Radon measure with compact support, and set
\[
\nu_\kappa=\mu_D*\kappa
=\sum_{m\ge1}d_m\,\tau_{mL}\kappa,
\qquad
(\tau_y\kappa)(E)=\kappa(E-y).
\]
Compact support of \(\kappa\) makes this a locally finite positive Radon measure. This class includes positive compactly supported convolution kernels; the argument also applies to any positive convolution kernel for which the sum defines a Radon measure.

## The support obstruction

Because every \(d_m>0\), there is no cancellation between translated copies of \(\kappa\), and
\[
\operatorname{supp}(\nu_\kappa)
=\overline{\bigcup_{m\ge1}(mL+\operatorname{supp}\kappa)}.
\]
Choose any \(x\in\operatorname{supp}\kappa\), which exists since \(\kappa\ne0\). Then both \(x+L\) and \(x+2L\) belong to \(\operatorname{supp}(\nu_\kappa)\). If \(\nu_\kappa=\nu_\zeta^{\log}\), there would be primes \(p,q\) and positive integers \(a,b\) with
\[
e^{x+L}=p^a,\qquad e^{x+2L}=q^b.
\]
Dividing gives \(q^b/p^a=e^L=10\), hence \(q^b=10p^a\). The right side has both 2 and 5 as prime divisors, so by unique factorization it cannot be a power of a single prime \(q\). Contradiction. Therefore
\[
\boxed{\mu_D*\kappa\ne\nu_\zeta^{\log}\quad\text{for every nonzero positive compactly supported convolution kernel }\kappa.}
\]
The same proof works in the \(\xi\)-coordinate, where the TTI lattice step is \(L/(2\pi)\); exponentiating the difference still multiplies by 10.

## Consequence for admissible pairs

Johns Part II v1.3 states the uniqueness theorem \(\mathcal K_{ad}\subseteq\{(\mu_\zeta,\nu_\zeta)\}\). Conditional on that paper-level theorem, no zero-side measure \(\mu\) can make \((\mu,\nu_\kappa)\) admissible for any kernel in this class. This is a conditional consequence of the claimed uniqueness theorem, not an independent proof of it. Without accepting that theorem, the support argument only says that this convolution output is not the zeta prime measure; it alone does not rule out some other admissible pair.

A nonpositive subtraction could remove the extra decade-translated support, but that leaves the positive-kernel class and requires a new proof of positivity. A map that deletes/reweights atoms, depends on prime data, or is nonlinear/non-translation-equivariant is not covered. Such a map must be defined from TTI's existing rules and proved to satisfy the full admissible-pair identity; merely appending missing von Mangoldt atoms imports the target prime measure rather than deriving it.

## TTI and Weil-domain checks

The unscaled TTI distribution is on \(m\log10\); adopting \(\log n/(2\pi)\) already requires an explicit dilation. The finite autocorrelation in `docs/rh/rss-frobenius-linking-second-pass.md` §6.4 is an admissible positive-type Weil test, not a measure representing the archimedean functional on every test. A positive Gram block does not turn the smoothing above into an admissible pair. Even a weak limit would require exact \(\mathcal K_{ad}\) support and normalization, uniform local-mass bounds, absolute convergence, and passage of the explicit-formula identity to all test functions.

## Sources and status

- Johns, Part II v1.3, [admissible-pair definition and uniqueness framework](https://github.com/nic410/zeta-sharpness-uniqueness/blob/231428659e8ab69e432902c5fb04945a8f4edc93/paper/sections/02-setting.tex); its Theorem U is a preprint claim, not independently verified here.
- Internal exact deposit formula and BRS normalization check: `docs/rh/rss-frobenius-linking-second-pass.md` §§6.2–6.4.
- The support proof above is elementary and independent of RH; only the admissible-pair nonexistence consequence uses Johns's claimed uniqueness theorem.
