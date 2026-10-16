# The third-density bounce: periodic orbit or xi contraction?

**Eleventh-stage investigation — 14 October 2026**  
**Question:** Do the bounces among 999, 666 and 333, together with the missing-one carry into 1000, generate only a periodic reflection system, or do they derive a strict contraction symmetry of the completed xi spectrum?  
**Companion program:** `scripts/research-rss-third-density-bounce.py`  
**Machine-readable results:** `docs/rh/rss-third-density-bounce-results.json`

## Verdict

The natural exact bounce models are periodic, not contractive.

There are two exact finite systems:

1. If 999 is treated as the closed quotient, translation by 333 has order three:
   \[
   0\longrightarrow333\longrightarrow666\longrightarrow0
   \pmod{999}.
   \]
   Together with the complement reflection \(R(n)=999-n\), this is a \(D_3\) action.
2. If the actual carry into 1000 is retained, translation by 333 has order 1000, not three:
   \[
   T_+(n)=n+333\pmod{1000},
   \qquad
   T_+^3(n)=n-1\pmod{1000}.
   \]
   In the descending \(999\to666\to333\) direction, \(T_-^3(n)=n+1\). The missing one is therefore an exact one-step drift after every three moves. Because \(\gcd(333,1000)=1\), the orbit visits all 1000 residue states before returning. With \(R(n)=999-n\), the system is the dihedral permutation action \(D_{1000}\) of order 2000.

Both systems are finite permutations. Their spectral eigenvalues are roots of unity of modulus one. They can reverse, redistribute and phase-shift a residue, but they do not contract its norm.

The route
\[
999\longrightarrow666\longrightarrow333
\]
can separately be interpolated as a contraction toward the midpoint followed by reflection. In centered coordinates this gives
\[
\eta\longmapsto-\frac13\eta.
\]
But iterating that rule immediately leaves the named stations:
\[
333\longrightarrow444\longrightarrow555.
\]
It is therefore a new affine rule, not a consequence of the exact periodic bounce.

Numerical completed-xi diagnostics confirm that the literal translations do not preserve even the first known zero. The proposed horizontal contraction is not a functional identity of \(\xi\). Requiring it merely to preserve the complete zero set would be enough to prove RH—but that requirement is itself RH-equivalent.

The missing-one carry has produced a precise cocycle or drift, not an independently derived contraction of the xi spectrum. No proof of RH is obtained.

---

## 1. The exact geometry of 999, 666 and 333

Normalize the last full third-density turn by 999:
\[
x=\frac{n}{999},
\qquad
\eta=x-\frac12.
\]
Then

| station | \(x\) | centered coordinate \(\eta\) |
|---:|---:|---:|
| 999 | \(1\) | \(+1/2\) |
| 666 | \(2/3\) | \(+1/6\) |
| 333 | \(1/3\) | \(-1/6\) |
| 0 | \(0\) | \(-1/2\) |

The complement map is
\[
R(n)=999-n.
\]
After normalization,
\[
R(x)=1-x,
\qquad
R(\eta)=-\eta.
\]
Consequently,
\[
333\longleftrightarrow666
\]
is a literal reflection across the midpoint \(499.5\). This has the same centered algebra as the functional reflection of a zeta zero,
\[
\beta\longleftrightarrow1-\beta,
\qquad
\eta=\beta-\frac12\longmapsto-\eta.
\]

This is an exact structural correspondence. It does not identify \(333/999\) and \(666/999\) with actual zeta-zero real parts. It identifies the two reflection laws.

## 2. Closing at 999 gives a three-cycle

Work first modulo 999. Define
\[
T_{999}(n)=n+333\pmod{999}.
\]
Because
\[
3\cdot333=999,
\]
we have
\[
T_{999}^3=1.
\]
Its seam orbit is
\[
0\longrightarrow333\longrightarrow666\longrightarrow0.
\]
On the quotient, 0 and 999 represent the same seam point. The reflection satisfies
\[
R^2=1,
\qquad
RT_{999}R=T_{999}^{-1}.
\]
These are the defining relations of the dihedral group \(D_3\).

### 2.1 The three-station Fourier split

Let a state assign amplitudes \((a_0,a_{333},a_{666})\) to the three stations, and set
\[
\omega=e^{2\pi i/3}.
\]
The order-three discrete Fourier modes are
\[
c_0=\frac{a_0+a_{333}+a_{666}}{\sqrt3},
\]
\[
c_+=\frac{a_0+\omega a_{333}+\omega^2a_{666}}{\sqrt3},
\qquad
c_-=\frac{a_0+\omega^2a_{333}+\omega a_{666}}{\sqrt3}.
\]
The first is the invariant mean. The other two form the two-dimensional nontrivial representation. Reflection exchanges \(c_+\) and \(c_-\), so their real even/odd coordinates are
\[
c_{\rm even}
=\frac{2a_0-a_{333}-a_{666}}{\sqrt6},
\qquad
c_{\rm odd}
=\frac{a_{333}-a_{666}}{\sqrt2}.
\]

This supplies a precise structural role for the third-splice count \(F_3=2\): after the invariant mean is removed, the three-station bounce has two nontrivial channels. One is reflection-even and one reflection-odd.

The odd channel is a plausible finite analogue of the horizontal zero residue. But the decomposition does not force
\[
c_{\rm odd}=0.
\]
It merely measures it.

## 3. The carry changes \(D_3\) into a 1000-state orbit

The quotient-999 model omits the carry. Retain the actual decimal threshold and instead define
\[
T(n)=n+333\pmod{1000}.
\]
Now
\[
3\cdot333=999\equiv-1\pmod{1000},
\]
so
\[
\boxed{T^3(n)=n-1\pmod{1000}.}
\]
This is the exact missing-one law.

The beginning of the ascending orbit is
\[
0,
333,
666,
999,
332,
665,
998,
331,
664,
997,
\ldots
\]
Every block of three ascending steps moves the starting residue down by one. Traversing the user-facing route in the reverse direction gives
\[
999,
666,
333,
0,
667,
334,
1,
668,
335,
2,
\ldots
\]
For \(T_-(n)=n-333\pmod{1000}\), the corresponding identity is
\[
T_-^3(n)=n+1\pmod{1000}.
\]
Thus the sign of the one-step drift records the chosen direction; the period and absence of contraction are unchanged. Since
\[
\gcd(333,1000)=1,
\]
the additive order of 333 modulo 1000 is
\[
\frac{1000}{\gcd(333,1000)}=1000.
\]
The orbit visits every residue from 0 to 999 exactly once before returning.

The complement reflection remains
\[
R(n)=999-n\pmod{1000}.
\]
It obeys
\[
R^2=1,
\qquad
RTR=T^{-1}.
\]
Thus the carry-aware bounce is a \(D_{1000}\) permutation action, where the convention here gives \(D_{1000}\) order 2000.

### 3.1 The missing one is a drift, not damping

The exact identity
\[
1000-3\cdot333=1
\]
acts as a cocycle: closing three nominal thirds misses the threshold by one, and that deficit shifts the next three-step block.

Nothing gets smaller. The state is moved to another residue. In a Fourier basis on \(\mathbb Z/1000\mathbb Z\), translation acts on
\[
e_k(n)=e^{2\pi i kn/1000}
\]
by the eigenvalue
\[
\lambda_k=e^{2\pi i(333)k/1000}.
\]
Every eigenvalue satisfies
\[
|\lambda_k|=1.
\]
The reflection exchanges conjugate modes. Hence the exact carry-aware bounce is norm-preserving. It cannot by itself damp a horizontal channel.

## 4. Where the apparent factor \(1/3\) comes from

The first named route does admit another reading. Let the real midpoint be
\[
m=\frac{999}{2}=499.5.
\]
Define contraction toward the midpoint by
\[
C(n)=m+\frac{n-m}{3}.
\]
Then
\[
C(999)=666.
\]
Follow it by complement reflection:
\[
R(n)=999-n.
\]
The combined map is
\[
B(n)=R(C(n))
=666-\frac n3.
\]
It sends
\[
B(999)=333.
\]
In normalized centered coordinates,
\[
\boxed{B(\eta)=-\frac13\eta.}
\]
Thus the displayed route
\[
999\xrightarrow{C}666\xrightarrow{R}333
\]
can be interpreted as contraction followed by inversion.

### 4.1 Why this is not the periodic bounce rule

Apply the same operation again. Starting from 333,
\[
C(333)=444,
\qquad
B(333)=555.
\]
The next route is therefore
\[
333\longrightarrow444\longrightarrow555,
\]
not a return to 999, 666 or 333. Continued iteration generates
\[
\eta_k=\frac12\left(-\frac13\right)^k,
\]
which converges to the midpoint.

This is a mathematically valid contraction system. But it is a different dynamical law from either exact finite bounce:

- the modulo-999 law returns after three translations;
- the modulo-1000 law visits every residue and returns after 1000 translations;
- the affine contraction never returns and immediately introduces new stations.

The three initial numbers do not choose among those laws by themselves. Calling the third one “the bounce” adds the contraction postulate.

## 5. Direct tests against the completed xi function

The research program evaluates
\[
\xi(s)
=\frac12s(s-1)\pi^{-s/2}\Gamma(s/2)\zeta(s)
\]
using an Euler–Maclaurin expansion for \(\zeta\) and a Lanczos approximation for \(\Gamma\). It first verifies the standard functional equation numerically on generic complex samples, with maximum absolute discrepancy below
\[
2.5\times10^{-13}.
\]

At the first zero ordinate
\[
\gamma_1=14.134725141734693\ldots,
\]
the calculation gives
\[
\left|
\xi\!\left(\frac12+i\gamma_1\right)
\right|
<1.3\times10^{-17}.
\]

### 5.1 The periodic translations do not preserve the zero

The quotient-999 translation shifts the real coordinate by
\[
\frac{333}{999}=\frac13.
\]
It sends the first critical-line zero candidate to
\[
\frac56+i\gamma_1.
\]
The calculation finds
\[
\left|
\xi\!\left(\frac56+i\gamma_1\right)
\right|
=4.6264191508765\times10^{-4},
\]
far from the numerical zero residual.

The carry-aware shift by \(333/1000\) similarly gives
\[
\left|
\xi\!\left(0.833+i\gamma_1\right)
\right|
=4.6217580233730\times10^{-4}.
\]

These are numerical diagnostics, not a universal proof. They decisively reject the simplest claim that translating a known zero by one bounce step is itself a zero symmetry. A global functional identity under a nonzero real translation is also incompatible with the real-axis growth of \(\xi\).

### 5.2 The contraction is not a functional identity

Promote the centered contraction to the zero plane:
\[
B_a(\eta+i\gamma)=-a\eta+i\gamma,
\qquad 0<a<1.
\]
For the third-density candidate, \(a=1/3\).

This operation preserves the ordinate while changing only the real displacement. In terms of \(s\) and \(\overline s\), it is not holomorphic. Generic numerical samples also show
\[
\xi(B_{1/3}s)\ne\xi(s).
\]
Therefore it is not another functional equation of the completed xi function.

Known critical-line zeros cannot test zero-set preservation, because \(B_a\) fixes every point with \(\eta=0\). That proposed preservation law is precisely where the RH difficulty has moved.

## 6. The bounce-contraction lemma

The contraction idea nevertheless produces a clean theorem.

> **Bounce-contraction lemma.** Fix \(0<a<1\). Suppose that whenever \(\eta+i\gamma\) is a centered non-trivial xi zero, \(-a\eta+i\gamma\) is also a centered xi zero. Then RH holds.

### Proof

Assume there is a zero with \(\eta\ne0\). Repeated application gives zeros
\[
\eta+i\gamma,\qquad
-a\eta+i\gamma,\qquad
a^2\eta+i\gamma,\qquad
-a^3\eta+i\gamma,\qquad
\ldots
\]
They are distinct because \(0<a<1\) and \(\eta\ne0\), and they converge to the finite point
\[
i\gamma.
\]
But \(F(z)=\xi(1/2+z)\) is a nonzero entire function. Its zeros are isolated and cannot have a finite accumulation point. The assumption \(\eta\ne0\) is impossible. Therefore every \(\eta=0\), which is RH. \(\square\)

Conversely, under RH every \(\eta=0\), so every zero is fixed by every \(B_a\). Hence
\[
\boxed{
\text{zero-set invariance under one strict horizontal contraction}
\quad\Longleftrightarrow\quad
\mathrm{RH}.}
\]

This is a sharper result than a numerical contraction test. It also shows why the missing step cannot be assumed: deriving the zero-preserving property would already prove RH.

## 7. Why equal bouncing does not erase the positive residue

Functional symmetry already supplies opposite members
\[
+\eta+i\gamma,
\qquad
-\eta+i\gamma.
\]
Their average lies on the critical line. Therefore an equal bounce between 333 and 666 models a fact already known unconditionally: the horizontal coordinates cancel linearly.

RH requires more than linear cancellation. The central residue is
\[
\mathcal R_{\rm hor}
=
\sum_{\text{off-line quartets}}
\frac{4\eta^2(\eta^2+3\gamma^2)}
{\gamma^2(\eta^2+\gamma^2)^2}.
\]
Changing \(\eta\) to \(-\eta\) leaves every summand unchanged. A periodic bounce can make the mean displacement zero while the norm remains positive.

A strict contraction would reduce the magnitude of each nonzero horizontal coordinate. If the completed arithmetic state were simultaneously invariant under that contraction, only zero norm could survive. But the finite bounce operators found here are permutations, not contractions.

## 8. Möbius extraction does not generate the contraction

Arithmetic Möbius extraction remains
\[
\log n\xrightarrow{\mu*}\Lambda(n).
\]
A real translation \(s\mapsto s+c\) changes each prime term by the prime-dependent factor
\[
p^{-s}\longmapsto p^{-c}p^{-s}.
\]
Neither \(M=\mu*\) nor its inverse divisor sum \(Z\) applies one common horizontal contraction to every xi zero. The finite decimal bounce also has root-of-unity Fourier frequencies, whereas the completed explicit formula has event support at every
\[
\log(p^k).
\]

Thus the exact arithmetic diagram remains
\[
\log n
\xrightarrow{\mu*}
\Lambda(n)
\longrightarrow
\Psi
\longrightarrow
\frac{\xi'}{\xi}
\longleftrightarrow
\{\text{zero quartets}\}.
\]
The missing theorem would have to show from this completed ledger that its zero image is closed under one strict horizontal contraction. The bounce-contraction lemma would then finish RH immediately.

The 999/1000 arithmetic does not currently provide that theorem.

## 9. TTI interpretation

The investigation gives the three stations disciplined roles:

- **999:** the last occupied point and seam boundary;
- **666:** the positive-side accumulation station, one third of the centered distance from the outer boundary;
- **333:** the reflected partner of 666;
- **the missing one:** the carry cocycle that advances the next three-step block rather than damping it.

The finite system is richer than a static numerological resemblance. It has exact dihedral algebra and an explicit even/odd channel decomposition. But its exact dynamics are conservative. To obtain the convergent route toward the critical seam, TTI must add the affine contraction rule and explain why the completed prime/zero spectrum obeys it.

The most important distinction is therefore:

> Reflection explains why off-line zeros would occur in pairs. Contraction would explain why such pairs cannot exist. The third-density arithmetic derives the reflection and the missing-one drift; it does not yet derive the contraction.

## 10. Final determination

The test separates three claims that initially look similar.

| Claim | Result | Status |
|---|---|---|
| 333-step bounce with 999 identified as the seam | Order-three \(D_3\) system | Exact and periodic |
| 333-step bounce with the carry into 1000 retained | Order-1000 \(D_{1000}\) system with \(T^3=n-1\) | Exact and periodic |
| 999 → 666 → 333 as contraction plus reflection | \(\eta\mapsto-\eta/3\) | Exact interpolation, but an added dynamical rule |
| Translation of the completed xi zero spectrum | Fails at the first known zero | Numerically rejected; no functional identity |
| Horizontal contraction as a xi functional equation | Generic xi values are not invariant | Rejected as a functional identity |
| Horizontal contraction as a zero-set symmetry | Forces RH by zero isolation | Exact RH-equivalent criterion; unproved |

The third-density bounce is therefore not an unnoticed RH proof. Its missing-one carry produces a remarkably clean long-period drift, and its quotient produces the correct reflection-even/reflection-odd channel architecture. Neither supplies damping.

The next valid target is narrow:
\[
\boxed{
\xi\!\left(\frac12+
\eta+i\gamma\right)=0
\quad\Longrightarrow\quad
\xi\!\left(\frac12-
\frac{
\eta}{3}+i\gamma\right)=0.}
\]
If this implication were derived independently from the completed prime ledger, RH would follow immediately. At present it is the missing theorem, not a consequence of the 999–666–333 bounce.
