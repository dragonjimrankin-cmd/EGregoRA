# Can the critical prime-phase inequality be reversed?

**Thirty-fourth-stage literature and obstruction audit — 15 October 2026**  
**Target:** \(\mathcal I_C^{\rm crit}\le C'(2)/C(2)\)  
**Companion program:** `scripts/research-rss-reverse-prime-phase-inequality.py`  
**Machine-readable results:** `docs/rh/rss-reverse-prime-phase-inequality-results.json`  
**Exact interval certificate:** `scripts/certify-rss-prime-phase-defect.py`  
**Independent-review dossier:** [`prime-phase-independent-review-note.md`](./prime-phase-independent-review-note.md)  
**Quantised-index follow-up:** [`rss-negative-index-conductor-gate.md`](./rss-negative-index-conductor-gate.md)

## Verdict

No independent proof of
\[
\boxed{
\mathcal I_C^{\rm crit}\le \frac{C'}C(2)
}
\]
was found. No established theorem strictly weaker in hypothesis and already known for zeta was found that implies this inequality.

The reason is now structurally explicit. Stage 33 proved
\[
\mathcal I_C^{\rm crit}-\frac{C'}C(2)
=\mathcal D_2
=\sum_{\text{off-line quartets}}d_{\eta,\gamma},
\qquad d_{\eta,\gamma}>0.
\]
Hardy-space factorisation, the Balazard--Saias--Yor logarithmic integral and Burnol's Nyman--Beurling projection theorem all isolate the same zeros in \(\Re s>1/2\) as a Blaschke inner factor. They give exact, non-cancelling detectors of a forbidden zero. They do not supply an independent arithmetic reason why that inner factor must be trivial.

The requested reverse inequality is consequently not a loose estimate waiting to be read from generic canonical factorisation. It says that a nonnegative inner-factor contribution is at most zero. Thus
\[
\boxed{
\mathcal I_C^{\rm crit}\le \frac{C'}C(2)
\iff
\mathcal D_2=0
\iff
B\equiv1
\iff
\mathrm{RH}.
}
\]
Declaring \(C\) outer, cyclic or zero-free in the critical half-plane merely renames the same missing statement.

There is, however, a strong unconditional quantitative conclusion. Combining Platt--Trudgian's rigorous verification through the exact height
\[
H=3{,}000{,}175{,}332{,}800
\]
with Bellotti--Wong's explicit zero-counting bound gives
\[
\boxed{
0\le
\mathcal I_C^{\rm crit}-\frac{C'}C(2)
<9.274\times10^{-37}.
}
\]
This is a rigorous near-equality, subject only to the cited zero-counting theorem and rigorous computation. It is not equality. A hypothetical off-line zero could lie arbitrarily close to the critical line or sufficiently high; no known theorem supplies a positive gap that would permit rounding the upper bound to zero.

RH remains open.

---

## 1. The exact logical target

Put
\[
C(s)=(s-1)\zeta(s).
\]
The preceding report proved the Euler-domain phase law
\[
\mathcal I_C(\sigma)
=
\frac1{\sigma+1/2}
-
\sum_{n\ge2}\frac{\Lambda(n)}{n^{\sigma+3/2}},
\qquad \sigma>1,
\]
and the critical-boundary defect formula
\[
\mathcal I_C^{\rm crit}-\frac{C'}C(2)=\mathcal D_2.
\]
For one off-line quartet represented in the upper half-plane by
\[
\rho=\frac12+\eta+i\gamma,
\qquad 0<\eta<\frac12,
\]
the contribution is
\[
\boxed{
 d_{\eta,\gamma}
=
\frac{
6\eta^2(\eta^2+3\gamma^2-9/4)
}{
(\gamma^2+9/4)
\left[(\gamma^2-\eta^2+9/4)^2+4\eta^2\gamma^2\right]
}>0.
}
\]
Therefore an upper bound of zero is already a zero-exclusion theorem. Any candidate route must do more than produce another nonnegative functional of the same off-line divisor. It must prove that the divisor is empty using information not equivalent to its emptiness.

The search applied the following fail-fast test to every candidate:

1. What established theorem is being imported?
2. Which part of the canonical factorisation does it control?
3. Does it bound the positive Blaschke contribution, or merely identify it?
4. Does the decisive step assume zero-freeness, outerness, cyclicity, critical Chebyshev energy, subexponential Laguerre growth or another known RH equivalent?
5. Is the source primary, established literature, a rigorous computation, a secondary diagnostic or an unreviewed claim?

No candidate passed all five gates.

## 2. The Balazard--Saias--Yor factorisation

Balazard, Saias and Yor use the conformal map
\[
s=\frac1{1-z},
\]
which sends the unit disk to \(\Re s>1/2\), and study
\[
f(z)=(s-1)\zeta(s)=C(s).
\]
They prove that \(f\in H^{1/3}\), that its singular inner measure is zero and that Jensen--Hardy factorisation gives
\[
\boxed{
\frac1{2\pi}
\int_{\Re s=1/2}
\frac{\log|\zeta(s)|}{|s|^2}
\,|ds|
=
\sum_{\Re\rho>1/2}
\log\left|\frac{\rho}{1-\rho}\right|.
}
\]
Every term on the right is positive. In canonical-factor language,
\[
f=B\,O,
\]
where \(O\) is outer and \(B\) is the Blaschke product of the zeros in \(\Re s>1/2\). With the standard half-plane normalisation,
\[
S_{\rm BSY}
:=
\sum_{\Re\rho>1/2}
\log\left|\frac{\rho}{1-\rho}\right|
=-\log|B(1)|
\ge0.
\]
Here \(B(1)\) is the half-plane Blaschke product evaluated at \(s=1\), corresponding to the disk centre \(z=0\).

This result is highly relevant but has the wrong logical direction for the requested search. It proves that the harmonic defect is positive and identifies every positive summand. The inequality
\[
S_{\rm BSY}\le0
\]
would imply \(S_{\rm BSY}=0\), hence \(B=1\), hence RH. No established theorem in the paper supplies that reverse sign.

The Stage-33 defect is not numerically identical to the BSY scalar: it uses a different positive kernel on the same forbidden-zero divisor. For one quartet the BSY mass is
\[
b_{\eta,\gamma}
=
\log
\frac{\gamma^2+(1/2+\eta)^2}
     {\gamma^2+(1/2-\eta)^2}
>0.
\]
Both defects vanish exactly on the critical line. At high ordinate,
\[
b_{\eta,\gamma}
\sim \frac{2\eta}{\gamma^2},
\qquad
 d_{\eta,\gamma}
\sim \frac{18\eta^2}{\gamma^4}
=\frac92 b_{\eta,\gamma}^2.
\]
Thus the phase defect is a quadratically smaller measurement of the same inner obstruction at high zeros. This explains both its strong numerical suppression and its lack of a positive uniform gap.

## 3. Burnol and the Nyman--Beurling obstruction

Under the Mellin transform, the Nyman--Beurling problem becomes a Hardy-space closure problem in \(\Re s>1/2\). A forbidden zero \(\rho\) annihilates every Nyman generator while the target evaluates nontrivially. The Hardy reproducing kernel at \(\rho\) is therefore an exact separating witness.

Burnol's factorisation theorem sharpens this from a one-zero witness to the complete obstruction. If \(NB\) is the closed Nyman space and \(B\) is the Blaschke product of all zeta zeros in \(\Re s>1/2\), then its Mellin image is
\[
\mathcal M(NB)=B H^2.
\]
The target projection has norm \(|B(1)|\), so
\[
\boxed{
\operatorname{dist}(1,NB)^2
=1-|B(1)|^2
=1-e^{-2S_{\rm BSY}}.
}
\]
The BSY logarithmic integral and the Nyman metric defect are therefore two exact functions of the same inner factor.

For one simple forbidden zero \(\rho=\beta+i\gamma\), evaluation already gives the lower obstruction
\[
\operatorname{dist}(1,NB)^2
\ge
\frac{2\beta-1}{|\rho|^2}.
\]
This is an excellent detector, but its size collapses as \(\beta\downarrow1/2\) or \(|\gamma|\to\infty\). Passing to the model-space quotient
\[
K_B=H^2\ominus BH^2
\]
quantises the obstruction: for a finite forbidden divisor, \(\dim K_B\) counts its zeros with multiplicity. Yet this still detects rather than excludes. Computing the dimension from \(B\) invokes the argument principle; proving \(K_B=\{0\}\) from the arithmetic side is exactly the cyclicity or density assertion equivalent to RH.

Báez--Duarte's restriction to integer dilations does not change that conclusion. Finite Gram matrices are positive automatically. The substantive assertion is that the distances tend to zero. That limiting density statement is the criterion, not an independent proof of it. Importing the convergence of the approximants would therefore be circular.

## 4. Why generic outer-function theory cannot reverse the sign

Canonical factorisation separates three logically different objects:

1. an outer factor reconstructed from boundary modulus data;
2. a Blaschke factor encoding interior zeros;
3. a possible singular inner factor.

For the BSY function, the singular factor has already been eliminated. This is genuine information, but it leaves the Blaschke product untouched. Boundary modulus determines the outer factor; it does not prove that the zero factor is absent.

The desired argument would have to infer
\[
B=1
\]
from a property already proved for zeta. None of the generic Hardy or Nevanlinna theorems inspected does that. The commonly proposed replacements are all equivalent:

- “\(C\) is outer in \(\Re s>1/2\)”;
- “the zeta multiplier is cyclic”;
- “the Nyman target distance is zero”;
- “the BSY logarithmic defect vanishes”;
- “the Stage-33 phase defect vanishes”;
- “the forbidden model space has dimension zero.”

Each statement says that the same Blaschke product is trivial. Factorisation is the exact accounting identity, not the missing arithmetic exclusion engine.

## 5. Other routes tested

### de Branges--Sonine systems

Burnol's complete and minimal systems associated with zeta zeros give unconditional spectral synthesis and explicit biorthogonal structure. Completeness does not constrain the real parts of the nodes: the system is complete for the actual zeros whether or not RH holds. A positive reflection metric or a Hermite--Biehler property strong enough to force the critical line would be new input and may itself encode RH. No established theorem deriving that positivity from the Euler product was found.

### Generalised Nevanlinna functions and negative squares

Pontryagin/Krein--Langer theory can replace a small metric defect by an integer-valued negative index. This avoids the collapsing-amplitude problem at the detector level. It does not compute the index arithmetically. Reading the index from the analytic factorisation is again zero counting. No established prime-side trace or Fredholm theorem proving the index zero was found.

### Conductor operators and commutators

Burnol's local conductor and commutator formulae retain phase and completion data and are plausible ingredients for a future relative index. Existing results realise local explicit-formula terms; they do not provide a global zeta-sensitive Fredholm pair whose arithmetically computed index vanishes. This is a research proposal, not a theorem implying the reverse phase inequality.

### Mean-periodicity and spectral synthesis

Meromorphic continuation, the functional equation and mean-periodicity are compatible with off-line zeros. They encode the complex exponents but do not locate them on the symmetry line. An additional sign, unitarity or positive-metric theorem would still be required.

### Critical prime-error estimates

Critical Chebyshev energy, square-root prime error and subexponential Laguerre growth would all continue the relevant Mellin or generating functions through \(\Re s>1/2\). They would prove the reverse inequality. The programme has already audited them as RH-equivalent all-scale inputs. Reusing them here would be circular.

### Claimed stronger zero-free regions

One GitHub catalogue advertised an unvalidated 2026 preprint claiming a zero-free half-plane \(\Re s>7/8\). The primary proof was not validated in this search, so it is not treated as an established theorem. Even if correct, it would leave the region
\[
\frac12<\Re s\le\frac78
\]
uncontrolled and would not imply the target inequality. A self-published BSY comparison with inferred definitions and unsupported conclusions was rejected for the same evidence reason.

## 6. A rigorous quantitative near-reverse inequality

Although finite verification cannot prove exact vanishing, it can place a certified upper bound on the defect.

Platt and Trudgian proved by rigorous computation that every nontrivial zero with
\[
0<\gamma\le H,
\qquad
H=3{,}000{,}175{,}332{,}800,
\]
lies on the critical line. Their exact count is \(12{,}363{,}153{,}437{,}138\) zeros. Therefore every quartet contributing to \(\mathcal D_2\) has \(\gamma>H\).

Since \(0<\eta^2<1/4\), the exact quartet term satisfies
\[
\begin{aligned}
 d_{\eta,\gamma}
&=
\frac{6\eta^2(\eta^2+3\gamma^2-9/4)}
{(\gamma^2+9/4)
[(\gamma^2-\eta^2+9/4)^2+4\eta^2\gamma^2]}\\
&\le
\frac{3/8+(9/2)\gamma^2}{\gamma^6}\\
&=
\frac92\gamma^{-4}+\frac38\gamma^{-6}.
\end{aligned}
\]
Let \(N(T)\) count all positive-ordinate zeros with multiplicity. Counting every positive zero rather than one representative per off-line quartet only enlarges the bound. For \(p>1\), Stieltjes integration gives
\[
\sum_{\gamma>H}\gamma^{-p}
\le
p\int_H^\infty \frac{N(T)}{T^{p+1}}\,dT.
\]
Bellotti--Wong prove, for \(T\ge e\),
\[
N(T)
\le
\frac{T}{2\pi}\log\frac{T}{2\pi e}
+0.10076\log T
+0.24460\log\log T
+8.08344.
\]
Using \(\log\log T\le\log T\) produces the elementary upper bound
\[
\sum_{\gamma>H}\gamma^{-p}
\le
\frac{pH^{1-p}}{2\pi(p-1)}
\left(
\log\frac{H}{2\pi e}
+\frac1{p-1}
\right)
+(0.10076+0.24460)H^{-p}
\left(\log H+\frac1p\right)
+8.08344H^{-p}.
\]
At the verified height, the companion program obtains
\[
\sum_{\gamma>H}\gamma^{-4}
<2.060805050027808\times10^{-37},
\]
\[
\sum_{\gamma>H}\gamma^{-6}
<2.050087910596571\times10^{-62}.
\]
Consequently
\[
\mathcal D_2
<
\frac92(2.060805050027808\times10^{-37})
+
\frac38(2.050087910596571\times10^{-62}),
\]
so
\[
\boxed{
0\le\mathcal D_2
<9.273622725125135\times10^{-37}
<9.274\times10^{-37}.
}
\]
Equivalently,
\[
\boxed{
\frac{C'}C(2)
\le
\mathcal I_C^{\rm crit}
<
\frac{C'}C(2)+9.274\times10^{-37}.
}
\]
This is the strongest non-circular consequence found in the search.

### 6.1 Exact rational interval certificate

The displayed comparison is now independently executable without floating-point proof steps. The certificate `scripts/certify-rss-prime-phase-defect.py` uses:

- Machin's identity with alternating rational arctangent bounds for \(\pi\);
- the positive atanh series with an explicit geometric remainder for every logarithm;
- exact `Fraction` integration of the Bellotti--Wong majorant;
- integer cross multiplication against \(9274/10^{40}\).

It proves exactly that its rational defect upper bound is strictly below
\[
\frac{9274}{10^{40}}
=9.274\times10^{-37}.
\]
The decimal strings in the certificate JSON are display values only. All proof comparisons use rational integers.

## 7. Why the tiny tail does not close the proof

There is no known universal \(\varepsilon_0>0\) such that
\[
\mathcal D_2>0
\Longrightarrow
\mathcal D_2\ge\varepsilon_0.
\]
The explicit quartet formula rules out such a gap at the level of canonical zero configurations. For fixed height,
\[
d_{\eta,\gamma}=O(\eta^2)
\qquad(\eta\to0),
\]
and for fixed displacement,
\[
d_{\eta,\gamma}=O(\gamma^{-4})
\qquad(\gamma\to\infty).
\]
A zero just off the critical line above the verified range could therefore contribute a positive amount far below any prescribed finite threshold. Functional symmetry creates its quartet but does not quantise \(\eta\) away from zero.

The integer model-space index avoids the small amplitude, but no arithmetic theorem computes it as zero. The metric estimate and the index formulation fail at complementary places: one has an established arithmetic scalar with no gap; the other has a gap but no independent arithmetic evaluation.

## 8. Evidence classification

### Primary established sources

- M. Balazard, E. Saias and M. Yor, **“Notes sur la fonction \(\zeta\) de Riemann, 2,”** *Advances in Mathematics* **143** (1999), 284--287. This is the primary Hardy/Jensen identity used above.
- J.-F. Burnol, **“A note on Nyman's equivalent formulation of the Riemann Hypothesis,”** *Contemporary Mathematics* **287** (2001), 23--26; arXiv `math/9910055v3`. This is the inner-factor projection source.
- J.-F. Burnol, **“A lower bound in an approximation problem involving the zeros of the Riemann zeta function,”** *Advances in Mathematics* **170** (2002), 56--70. This supplies exact zero-evaluation obstructions and lower bounds.
- L. Báez-Duarte, **“A strengthening of the Nyman--Beurling criterion for the Riemann Hypothesis,”** arXiv `math/0202141v2`. This is the integer-dilation criterion.
- D. J. Platt and T. S. Trudgian, **“The Riemann hypothesis is true up to \(3\cdot10^{12}\),”** *Bulletin of the London Mathematical Society* **53** (2021), 792--797. The exact verified endpoint is \(3{,}000{,}175{,}332{,}800\).
- C. Bellotti and P.-J. Wong, **“Improved estimates for the argument and zero-counting function of the Riemann zeta-function,”** arXiv `2412.15470v2`, Theorem 1.1. This supplies the explicit \(N(T)\) bound.

### Secondary material used only diagnostically

GitHub route audits were used to locate references, compare normalisations and identify repeated dead ends. They were not treated as proof authorities. In particular, proposals involving negative-square censuses, conductor-commutator indices or Sonine reflection metrics remain proposals until an independent arithmetic computation is proved.

### Rejected material

Search-result presence, machine-generated catalogues and self-published analyses were not accepted as evidence. Claims were rejected if the primary proof was unavailable, definitions were inferred rather than stated, or the decisive step silently assumed zero-freeness, cyclicity or an RH-equivalent all-scale estimate.

## 9. Exact conclusion

The literature search found an exact structural concordance:
\[
\boxed{
\mathcal D_2=0
\iff
S_{\rm BSY}=0
\iff
B=1
\iff
\operatorname{dist}(1,NB)=0
\iff
\mathrm{RH}.
}
\]
The quantities are different measurements, but their zero set is the same forbidden inner divisor. This is useful because it shows precisely what a future proof must add. It must establish, from genuinely arithmetic information, that \(B\) is trivial. Another factorisation, another positive defect or another cyclicity label will not do so by itself.

The only new unconditional inequality obtained is the certified near-equality
\[
0\le
\mathcal I_C^{\rm crit}-\frac{C'}C(2)
<9.274\times10^{-37}.
\]
It is quantitatively strong and logically insufficient. The requested reverse inequality was not proved. RH remains open.
