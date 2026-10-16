# Can the decimal splice produce the missing RH contraction?

**Twenty-eighth-stage investigation — 15 October 2026**  
**Question:** Can the new decimal phase law derive
\[
\eta\longmapsto c\eta,
\qquad |c|<1,
\]
on the zero set of the same Riemann \(\xi\)-function, or prove the equivalent untwisted prime-energy estimate?  
**Companion program:** `scripts/research-rss-decimal-splice-contraction.py`  
**Machine-readable results:** `docs/rh/rss-decimal-splice-contraction-results.json`

## Verdict

The attempt produces one exact new contraction coefficient:
\[
\boxed{c=\frac1\varphi=0.618033988749\ldots.}
\]
It comes from combining the decimal angle with critical-line reflection. Put
\[
\alpha=\frac\pi{10},
\qquad
p=\cos(2\alpha)=\cos\frac{\pi}{5}
=\frac{\varphi}{2}.
\]
For the weighted identity/reflection mixer
\[
T_p(\eta)
=p\eta+(1-p)(-\eta),
\]
one obtains
\[
T_p(\eta)
=(2p-1)\eta
=(\varphi-1)\eta
=
\frac{\eta}{\varphi}.
\]
Thus the decimal phase and the golden return law meet exactly rather than approximately.

This is a real sharpening of the previous conditional RH route. The nonlinear two-ended seam defect
\[
\varepsilon(\eta)=-2\log\cos(\pi\eta)
\]
contracts even if one parent is interpreted as producing two descendants at displacement \(\eta/\varphi\):
\[
2\varepsilon(\eta/\varphi)<
\varepsilon(\eta)
\qquad(0<|\eta|<1/2).
\]
The exact positive horizontal residue also contracts for two descendants uniformly throughout the critical strip above the first zero ordinate.

But the decisive same-function statement is not obtained. The mixer contracts a weighted coordinate, expectation or selected output channel. It does not move the support points \(+\eta\) and \(-\eta\), and a weighted average of two zero locations is not generally another zero. At function level, the exact reflection average gives
\[
p\xi(s)+(1-p)\xi(1-s)=\xi(s)
\]
by the functional equation. It returns the original function at the original argument; it does not give \(\xi(1/2+\eta/\varphi+i\gamma)\).

There are two further exact obstructions. Horizontal-only contraction with ordinate fixed is nonholomorphic, and the additive decimal prime phase is a nonprincipal period-twenty channel. Its finite cancellation does not bound the untwisted von Mangoldt ledger.

The outcome is therefore:

- **derived:** an exact golden contraction coefficient from the decimal phase;
- **proved:** one or two hypothetical contracted descendants strictly reduce the exact seam defect;
- **not derived:** movement of every \(\xi\)-zero, same-\(\xi\) invariance, no births at infinity or principal prime recovery;
- **status:** a sharper conditional RH criterion, not a proof of RH.

---

## 1. The golden decimal mixer

The Decimal Splice fixes the half-turn increment
\[
\alpha=\frac\pi{10}.
\]
Doubling that angle gives the exact pentagonal identity
\[
\cos\frac\pi5=\frac\varphi2.
\]
Use this as the weight of the identity branch:
\[
p=\frac\varphi2,
\qquad
1-p=1-\frac\varphi2.
\]
Critical-line reflection sends horizontal displacement \(\eta\) to \(-\eta\). The convex mixer of the forward and reflected coordinates is therefore
\[
T_p(\eta)
=p\eta+(1-p)(-\eta)
=(2p-1)\eta.
\]
Since
\[
2p-1=\varphi-1=\varphi^{-1},
\]
the output coordinate is
\[
\boxed{T_p(\eta)=\varphi^{-1}\eta.}
\]
Iteration gives
\[
T_p^N(\eta)=\varphi^{-N}\eta.
\]

This is precisely the form sought in the repeated-contraction programme. It also matches the existing golden depth of the returners. The coefficient is no longer inserted as an arbitrary \(c\) somewhere between zero and one.

### What has been chosen

The phase identity determines the number \(p=\varphi/2\). It does not by itself prove that \(p\) is a branch probability, an amplitude weight or a spectral multiplicity. The original verbal splice says that one half continues and one half returns. Equal population halves would have weights \(1/2,1/2\), whose barycentre is zero. The new \(p,1-p\) weights must therefore refer to phase response or coupling strength, not silently replace the population count.

That distinction is essential. The arithmetic proves what the proposed weighted mixer would do. The theory still owes the dynamics that make this the correct mixer.

## 2. Why the nonlinear seam defect really contracts

The exact two-ended seam defect already constructed in the RH programme is
\[
\varepsilon(\eta)
=-2\log\cos(\pi\eta),
\qquad |\eta|<\frac12.
\]
It is positive away from the critical line and vanishes only at \(\eta=0\).

The Taylor series of \(-\log\cos x\) has positive coefficients:
\[
-\log\cos x
=
\sum_{n\ge1} a_nx^{2n},
\qquad a_n>0.
\]
For \(0<c<1\),
\[
-\log\cos(cx)
=
\sum_{n\ge1}a_nc^{2n}x^{2n}
<
c^2\displaystyle\sum_{n\ge1}a_nx^{2n}.
\]
Consequently
\[
\varepsilon(c\eta)<c^2\varepsilon(\eta)
\]
for every nonzero strip displacement.

For the golden decimal coefficient \(c=1/\varphi\),
\[
2c^2=
\frac2{\varphi^2}
=0.763932022500\ldots<1.
\]
Therefore
\[
\boxed{
2\varepsilon(\eta/\varphi)
<
\varepsilon(\eta)
}
\]
throughout the open critical strip.

This matters because the splice has two branches. Under the hypothetical reading that one spectral parent creates two contracted spectral descendants, the two descendants still cannot carry as much seam defect as the parent. Near the line, three descendants fail the necessary quadratic test because
\[
3/\varphi^2=1.145898\ldots>1.
\]
Thus this contraction law is naturally compatible with two spectral branches, but not automatically with three or more.

Representative computed two-descendant ratios are:

| \(|\eta|\) | \(2\varepsilon(\eta/\varphi)/\varepsilon(\eta)\) |
|---:|---:|
| \(10^{-6}\) | 0.763932 |
| 0.10 | 0.756007 |
| 0.25 | 0.708348 |
| 0.40 | 0.575456 |
| 0.49 | 0.314266 |

The contraction becomes stronger toward the edge of the strip.

## 3. The central horizontal residue also contracts

For an upper off-line quartet, the earlier ordinate-splice stage derived
\[
r(\eta,\gamma)
=
\frac{4\eta^2(\eta^2+3\gamma^2)}
{\gamma^2(\eta^2+\gamma^2)^2}.
\]
Writing \(x=\eta^2/\gamma^2\), direct substitution gives
\[
\frac{r(c\eta,\gamma)}{r(\eta,\gamma)}
=
c^2
\frac{(c^2x+3)(x+1)^2}
{(c^2x+1)^2(x+3)}.
\]
Put \(q=c^2\). Since \(q x+3\le x+3\), the one-descendant ratio has the elementary upper bound
\[
\frac{r(c\eta,\gamma)}{r(\eta,\gamma)}
\le
q\left(\frac{1+x}{1+qx}\right)^2
\le q(1+x)^2.
\]
For a critical-strip quartet above the first nontrivial zero ordinate,
\[
x=\frac{\eta^2}{\gamma^2}
<\frac{1}{4(14.134725\ldots)^2}
=0.00125132\ldots.
\]
It follows uniformly on that domain that two descendants obey
\[
2\frac{r(c\eta,\gamma)}{r(\eta,\gamma)}
<0.765846<1.
\]
The calculation also sampled \(\gamma=14.134725\ldots,50,1000\) and \(\eta=0.1,0.25,0.49\); its largest two-descendant ratio was approximately \(0.76488\).

This proves that the golden mixer is compatible with both positive zero-side quantities currently available, once contracted descendants are assumed. It does not prove that either quantity is invariant under a completed decimal cycle. The earlier aggregate fixed-point route still needs
\[
\mathcal R_{\rm after}
=
\mathcal R_{\rm before}.
\]
Without a prime-side or seam-side derivation of that equality, contraction plus invariance cannot yet be invoked to force \(\mathcal R=0\).

## 4. The support-versus-barycentre obstruction

The central logical issue can be seen without any special function. Reflection supplies two support points:
\[
+\eta,
\qquad
-\eta.
\]
Their equal barycentre is zero:
\[
\frac{\eta+(-\eta)}2=0.
\]
The golden weighted barycentre is \(\eta/\varphi\). Neither statement moves either support point. A probability distribution can have mean zero while all of its mass lies away from zero.

RH is a statement about support: every individual nontrivial zero must have \(\eta=0\). It is not a statement that the mean horizontal displacement vanishes. Functional symmetry already makes every off-line quartet have zero signed mean.

The same warning applies to coherent channels. A lossless two-channel unitary can rotate which output contains the horizontal information, but it preserves total norm. If one output looks contracted, the complementary output stores the omitted information. Discarding that output is a projection or postselection, not an invariance of the full completed determinant.

For the decimal mixer to prove RH, TTI would need to show that the full \(\xi\) zero ledger is the contracted output and that the complementary channel is zero-free. That has not been derived.

## 5. Function-level reflection gives identity, not root movement

The exact completed functional equation is
\[
\xi(s)=\xi(1-s).
\]
Apply the golden mixer to function values:
\[
\mathcal M_p\xi(s)
=
p\xi(s)+(1-p)\xi(1-s).
\]
The functional equation immediately gives
\[
\boxed{
\mathcal M_p\xi(s)=\xi(s).
}
\]
This is exact same-function invariance, but it does nothing to the argument \(s\). If \(\rho\) is a zero, the average is still zero at \(\rho\), not at the weighted average of \(\rho\) and its reflected partner.

A finite quartet stress test makes the distinction explicit. Put \(z=s-1/2\) and form the even real polynomial with roots \(\pm\eta\pm i\gamma\):
\[
P_{\eta,\gamma}(z)
=
 z^4+2(\gamma^2-\eta^2)z^2
+(\eta^2+\gamma^2)^2.
\]
Replacing \(\eta\) by \(c\eta\) changes both the \(z^2\) and constant coefficients unless
\[
\eta=0
\qquad
\text{or}
\qquad
c^2=1.
\]
So the contracted quartet belongs to a different entire function unless the zeros were already on the line. This is the finite algebraic form of the same-\(\xi\) obstruction.

## 6. Horizontal-only contraction is nonholomorphic

Write the centred zero coordinate as
\[
z=\eta+i\gamma.
\]
The desired map keeps the ordinate fixed:
\[
T_c(z)=c\eta+i\gamma.
\]
In terms of \(z\) and its conjugate,
\[
T_c(z)
=
\frac{1+c}{2}z
+
\frac{c-1}{2}\overline z.
\]
For \(c
e1\), the conjugate coefficient is nonzero. The map is not holomorphic.

This explains why no ordinary change of complex argument has emerged from the decimal phase. A holomorphic affine contraction
\[
z\longmapsto cz
\]
would contract \(\gamma\) as well as \(\eta\). If it preserved the nonempty zero set of the same entire function indefinitely, every known zero would generate a forbidden finite accumulation at the centre. It therefore cannot be an unconditional symmetry of \(\xi\).

A horizontal contraction may still arise as a spectral flow, a nonlocal operator or a transition between different finite completions. But then the proof must supply a global genealogy and rule out zeros entering from infinity. Complex analyticity does not supply that bridge for free.

## 7. The decimal prime phase is a different Fourier mode

The prime-side candidate is
\[
e^{i\pi n/10}
=
e^{2\pi i n/20}.
\]
It is periodic modulo twenty. On the reduced residue classes
\[
1,3,7,9,11,13,17,19,
\]
its phase sum is zero. This cancels the leading equidistributed prime density in that nonprincipal additive channel.

Finite von Mangoldt diagnostics through \(X=262{,}144\) gave:

| \(X\) | Untwisted normalized energy | Decimal additive normalized energy |
|---:|---:|---:|
| 256 | 0.05580 | 1.23730 |
| 4,096 | 0.05373 | 0.41253 |
| 32,768 | 0.08368 | 1.07206 |
| 262,144 | 0.08259 | 0.94320 |

The decimal twist does not even reduce the displayed finite normalized energy relative to the untwisted channel. More importantly, no finite comparison could establish the required all-scale principal estimate.

A discrete Fourier counterexample is exact. A constant vector on all twenty residue classes has nonzero principal mode equal to twenty, while its first additive Fourier mode is zero. Therefore perfect cancellation in the decimal mode can coexist with a large untwisted mode.

The period-twenty calculation organises residue classes; it does not recover
\[
\psi(x)-x.
\]
Proving a bound for the decimal twist is not a proof of the critical Chebyshev-energy estimate.

## 8. The sharpened conditional theorem

The attempt does support the following conditional statement.

> **Golden decimal contraction criterion.** Suppose a completed decimal-splice law acts on every upper zero quartet, produces at most two spectral descendants with horizontal displacement at most \(|\eta|/\varphi\), preserves the relevant completed seam ledger, and permits no unparented zeros to enter at arbitrary height. Then repeated contraction gives a global shrinking strip and RH follows.

The gain over an arbitrary assumed \(c\) is exact:
\[
c=\varphi^{-1}
\qquad\text{after}\qquad
p=\cos(\pi/5)=\varphi/2,
\]
and the two-branch seam inequality is proved throughout the strip.

The missing premises are equally exact:

1. prove that the decimal mixer acts on zero support rather than an expectation or projected channel;
2. prove same-\(\xi\) closure, or a complete finite-stage genealogy with no births at infinity;
3. derive invariance of the positive seam ledger under the complete cycle; or
4. recover and bound the untwisted principal von Mangoldt channel.

The decimal splice has therefore improved the candidate contraction law but has not supplied the spectral invariance that would make it a proof. RH remains open.

**Entropy follow-up:** [`rss-kappa-entropy-splice.md`](./rss-kappa-entropy-splice.md) derives the natural golden random-reflection channel in the established \(\kappa_{\rm R}\) geometry. It proves strict branch-relative-entropy contraction and completed-ledger invariance, but also proves that every reflection-symmetric off-line quartet is fixed.
