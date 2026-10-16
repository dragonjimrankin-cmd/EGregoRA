# Can Rankin Skeletal Splice cycles generate the Riemann Euler product?

**Independent mathematical investigation — 14 October 2026**<br>
**Status:** exact results, reproducible finite computations, and one clearly marked extension conjecture<br>
**Companion program:** `scripts/research-rss-prime-orbits.mjs`<br>
**Machine-readable output:** `docs/rh/rss-prime-orbit-results.json`

> **Follow-ups completed:** `docs/rh/rss-modular-derivation.md` derives the continued-fraction alphabet and modular cusp conditionally from an RSS projective ledger. `docs/rh/rss-ledger-hyperbolic-completion.md` then derives that ledger from consecutive RSS splice counts and the upper half-plane metric from the existing two-cycle torus shape. Both preserve the finite-cycle no-go result below while obtaining Riemann zeta exactly as primitive-versus-repeated lattice data and modular scattering data.

## Executive result

There is a real and mathematically precise prime-orbit resemblance in the Rankin Skeletal Splice (RSS), but the present finite Fibonacci splice does **not** generate the Riemann Euler product or the Riemann explicit formula.

The investigation produced five main findings.

1. **The open RSS population is not itself a periodic-orbit sequence.** If
   \(R_n=F_{n+2}-1\) were the number of fixed points of the \(n\)-th iterate of a map, then period two would contain
   \[
   \frac{R_2-R_1}{2}=\frac12
   \]
   primitive cycles. This is impossible. The obstruction occurs before any comparison with primes.

2. **The natural closed Fibonacci completion is valid but has the wrong zeta function.** The golden-mean subshift with adjacency matrix
   \[
   A=\begin{pmatrix}1&1\\1&0\end{pmatrix}
   \]
   has \(L_n=\operatorname{tr}(A^n)\) periodic points and dynamical zeta function
   \[
   Z_A(z)=\frac{1}{\det(I-zA)}=\frac1{1-z-z^2}.
   \]
   With one intrinsic splice duration \(a>0\), this becomes
   \[
   Z_A(s)=\frac1{1-e^{-as}-e^{-2as}},
   \]
   not \(\zeta(s)\).

3. **A strong positive asymptotic relation does survive.** If \(P_n\) is the number of primitive Fibonacci-shift cycles of exact period \(n\), and \(S_n=\sum_{k\le n}P_k\), then
   \[
   P_n\sim\frac{\varphi^n}{n},\qquad
   S_n\sim\frac{\varphi^2\varphi^n}{n}.
   \]
   Combining this with the prime number theorem gives the genuine asymptotic identity
   \[
   \boxed{
   S_n\sim\pi\!\left(\varphi^2\log\varphi\;\varphi^n\right)
   }
   \qquad(n\to\infty).
   \]
   The scale factor \(\varphi^2\log\varphi=1.2598289137\ldots\) is derived from the two leading asymptotics, not fitted to the computed data. In the exact calculation through \(n=30\), the root-mean-square relative difference for \(12\le n\le30\) is about **0.271%**. This is an unusually close finite comparison, but it compares cumulative counts only. It does not pair individual cycles with primes and is explained by the general prime-orbit theorem shape shared by many chaotic systems.

4. **The direct Euler-product identity is structurally impossible for the present finite model.** A finite-state splice with finitely many intrinsic transition lengths has all cycle lengths in a finite-rank additive module. The numbers \(\{\log p:p\text{ prime}\}\) are linearly independent over \(\mathbb Q\). Therefore no such finite roof model can have primitive lengths exactly \(\log p\). Its spectral determinant is also an exponential polynomial with only \(O(T)\) zeros or poles up to height \(T\), whereas Riemann’s nontrivial zeros have \(T\log T\) counting growth.

5. **There is one rigorous and nontrivial extension worth pursuing.** The same matrix \(A\) is the continued-fraction digit-one matrix. The golden ratio is the all-ones fixed itinerary of the Gauss map. Replacing the single digit \(1\) by all digits \(a\ge1\) gives a countable dynamical system with inverse branches
   \[
   g_a(x)=\frac1{a+x}
   \]
   and transfer operator
   \[
   (\mathcal L_s f)(x)=
   \sum_{a=1}^{\infty}(a+x)^{-2s}
   f\!\left(\frac1{a+x}\right).
   \]
   This is the established Gauss/Mayer route to the modular Selberg zeta function and an infinite resonance spectrum. For the modular surface, Riemann’s zeta function occurs in the scattering coefficient
   \[
   \Phi(s)=
   \sqrt\pi\,
   \frac{\Gamma(s-\tfrac12)\zeta(2s-1)}
        {\Gamma(s)\zeta(2s)}.
   \]
   Thus the Fibonacci splice is genuinely embedded as the all-ones sector of a dynamical system in which Riemann zeros occur. But the direct periodic-orbit product there is the **Selberg** product over modular geodesics, not the Riemann product over rational primes. The extension is therefore a promising bridge, not a derivation of primes from the current RSS.

The defensible verdict is consequently:

> **Direct claim:** ruled out for the finite Fibonacci splice with finite intrinsic roof data.<br>
> **Asymptotic claim:** established; primitive Fibonacci-cycle counts have a precisely calibrated prime-number-theorem envelope.<br>
> **Extended claim:** plausible research programme; a countable continued-fraction completion yields modular transfer operators and brings Riemann \(\zeta\) into scattering data, but the extra digits and cusp geometry still have to be derived from RSS rather than imported because their zeta connection is already known.

---

## 1. The exact target

A slogan such as “primes resemble primitive orbits” is not enough. For a flow with primitive closed cycles \(C\), intrinsic lengths \(\ell(C)>0\), and positive unit orbit weights, the dynamical Euler product is
\[
Z_{\rm dyn}(s)=
\prod_{C\ {m primitive}}
\left(1-e^{-s\ell(C)}\right)^{-1}.
\]
For \(\Re s\) sufficiently large,
\[
-\frac{Z_{\rm dyn}'(s)}{Z_{\rm dyn}(s)}
=
\sum_C\sum_{k\ge1}
\ell(C)e^{-sk\ell(C)}.
\]
Riemann’s Euler product gives
\[
-\frac{\zeta'(s)}{\zeta(s)}
=
\sum_p\sum_{k\ge1}
(\log p)e^{-sk\log p}.
\]
The two products are equal only if their positive atomic length measures agree:
\[
\boxed{
\sum_C\sum_{k\ge1}\ell(C)\,\delta_{k\ell(C)}
=
\sum_p\sum_{k\ge1}(\log p)\,\delta_{k\log p}.
}
\]
Uniqueness of the Laplace transform, followed recursively from the shortest atom upward, means that the primitive length multiset must be
\[
\{\ell(C)\} = \{\log 2,\log 3,\log 5,\log 7,\ldots\}
\]
with the correct multiplicities. Prime powers must arise from repetitions of those primitive cycles, not from independently selected cycles.

Signed or complex orbit weights can evade the positivity argument by cancellation, but then the weights themselves must reproduce every von Mangoldt coefficient. Unless such weights are derived independently, this only relocates the arithmetic input.

This measure identity is the standard applied throughout the investigation. Similar growth rates, plots, correlations, or a finite list of prime-valued encodings cannot establish it.

## 2. An explicit RSS state space

### 2.1 What is exactly supplied by RSS

The established combinatorial output on the project’s splice page is the open population
\[
R_n=F_{n+2}-1.
\]
It counts returners after \(n\) splice stages. It is a count of states or branches reached after an open evolution. It does not by itself specify:

- a set on which one map acts repeatedly;
- which states return to their starting state;
- when two returned paths represent the same primitive cycle;
- an invariant length under cyclic change of starting point; or
- an orbit weight.

These data are required before a dynamical zeta function exists.

### 2.2 The minimal closed Fibonacci completion

The least arbitrary standard completion is the golden-mean subshift
\[
X_A=\{x\in\{0,1\}^{\mathbb Z}: A_{x_jx_{j+1}}=1\},
\qquad
A=\begin{pmatrix}1&1\\1&0\end{pmatrix},
\]
with return map \(\sigma(x)_j=x_{j+1}\).

A periodic word of period \(n\) is a point fixed by \(\sigma^n\). Two such words define the same closed cycle when they differ by a cyclic shift. A cycle is primitive if the word is not a repetition of a shorter word. The intrinsic combinatorial length is its least period \(n\); a constant physical duration per splice changes it to \(an\).

This model is explicit, intrinsic and prime-free. It captures closed Fibonacci combinatorics, but it is a **completion** of the RSS population rule, not an identity with that rule.

## 3. First no-go result: the RSS population fails orbit integrality

For any map \(T\) having finitely many fixed points for every iterate, let
\[
N_n=\#\operatorname{Fix}(T^n).
\]
If \(O_n\) is the number of primitive cycles of exact period \(n\), then
\[
N_n=\sum_{d\mid n}dO_d,
\qquad
O_n=\frac1n\sum_{d\mid n}\mu(d)N_{n/d}.
\]
Every \(O_n\) must be a nonnegative integer. This is the elementary periodic-orbit form of the Dold congruences.

Put \(N_n=R_n=F_{n+2}-1\). The first values are \(R_1=1\), \(R_2=2\). A point fixed by \(T\) is already fixed by \(T^2\), and every genuinely period-two orbit contributes two additional points. Therefore
\[
O_2=\frac{R_2-R_1}{2}=\frac{2-1}{2}=\frac12.
\]
This is impossible. It proves:

> **Theorem 1 — open-population obstruction.** There is no discrete dynamical system, finite or infinite, whose iterate fixed-point counts are finite and equal to \(F_{n+2}-1\) for every \(n\).

The minus-one population may be valid as open branching arithmetic, but it cannot simultaneously be interpreted as a closed-return count.

## 4. The correct closed Fibonacci orbit system

For the golden-mean shift,
\[
N_n=\operatorname{tr}(A^n)=L_n,
\]
where \(L_n\) is the Lucas sequence. Möbius inversion now gives valid primitive-cycle counts
\[
P_n=\frac1n\sum_{d\mid n}\mu(d)L_{n/d}.
\]
The first values are:

| \(n\) | periodic points \(L_n\) | primitive cycles \(P_n\) | cumulative cycles \(S_n\) |
|---:|---:|---:|---:|
| 1 | 1 | 1 | 1 |
| 2 | 3 | 1 | 2 |
| 3 | 4 | 1 | 3 |
| 4 | 7 | 1 | 4 |
| 5 | 11 | 2 | 6 |
| 6 | 18 | 2 | 8 |
| 7 | 29 | 4 | 12 |
| 8 | 47 | 5 | 17 |
| 9 | 76 | 8 | 25 |
| 10 | 123 | 11 | 36 |

Its Artin–Mazur zeta function is
\[
\begin{aligned}
Z_A(z)
&=\exp\!\left(\sum_{n\ge1}\frac{L_n}{n}z^n\right)\\
&=\prod_{C\ {m primitive}}(1-z^{|C|})^{-1}\\
&=\frac1{\det(I-zA)}
=\frac1{1-z-z^2}.
\end{aligned}
\]
This is an exact dynamical Euler product. It answers one part of the research question positively: closed Fibonacci cycles **do** yield a legitimate primitive-cycle product. The remaining question is whether it can be Riemann’s product. The determinant already says no.

With \(z=e^{-as}\), all primitive lengths lie in \(a\mathbb N\), and
\[
Z_A(s)=\frac1{1-e^{-as}-e^{-2as}}.
\]
The denominator has only two roots as a function of \(e^{-as}\), repeated on arithmetic vertical lattices in the \(s\)-plane. It cannot reproduce the nonperiodic Riemann zero spectrum.

## 5. The positive result: a calibrated prime-counting envelope

Although the exact Euler product fails, the primitive-cycle count has the same leading shape as prime counting.

Since \(L_n=\varphi^n+(-\varphi)^{-n}\),
\[
P_n\sim\frac{\varphi^n}{n}.
\]
The cumulative count is dominated by its geometric tail:
\[
\begin{aligned}
S_n
&=\sum_{k\le n}P_k
\sim \sum_{k\le n}\frac{\varphi^k}{k}\\
&\sim \frac{\varphi^n}{n}
\sum_{j\ge0}\varphi^{-j}
=\frac{\varphi^2\varphi^n}{n}.
\end{aligned}
\]
On the other hand, for \(x_n=c\varphi^n\), the prime number theorem gives
\[
\pi(x_n)\sim
\frac{c\varphi^n}{n\log\varphi}.
\]
Matching leading constants determines one and only one asymptotic scale:
\[
c=\varphi^2\log\varphi=1.2598289137944103\ldots.
\]
Hence
\[
S_n\sim\pi(c\varphi^n).
\]

The computation gives:

| \(n\) | \(S_n\) | \(\lfloor c\varphi^n\rfloor\) | \(\pi(\lfloor c\varphi^n\rfloor)\) | relative difference |
|---:|---:|---:|---:|---:|
| 12 | 79 | 405 | 79 | 0.000% |
| 13 | 119 | 656 | 119 | 0.000% |
| 14 | 177 | 1,062 | 178 | −0.562% |
| 15 | 267 | 1,718 | 267 | 0.000% |
| 18 | 928 | 7,279 | 928 | 0.000% |
| 20 | 2,170 | 19,057 | 2,164 | 0.277% |
| 24 | 12,216 | 130,621 | 12,215 | 0.008% |
| 27 | 45,610 | 553,321 | 45,573 | 0.081% |
| 30 | 172,577 | 2,343,909 | 172,480 | 0.056% |

The exact machine output contains every row from \(n=1\) through \(30\). The RMS relative difference over \(12\le n\le30\) is \(0.002709\), or about \(0.271\%\).

This deserves to be retained as a concrete RSS result, with two cautions.

First, the constant was selected by matching proven leading asymptotics. The finite agreement is evidence that both asymptotics settle quickly; it is not an independent prediction of individual primes. Second, every period-\(n\) cycle has the same length \(an\), while the primes counted in one shell have many distinct lengths \(\log p\). The envelope forgets exactly the information an Euler product needs.

## 6. Second no-go result: finite length rank

Suppose an RSS return graph has finitely many transition types with intrinsic lengths
\[
r_1,\ldots,r_m>0.
\]
Every closed-cycle length is a nonnegative integer combination of these values, so all cycle lengths lie in
\[
\mathcal M=\mathbb Zr_1+\cdots+\mathbb Zr_m.
\]
The \(\mathbb Q\)-linear span of \(\mathcal M\) has dimension at most \(m\).

In contrast, logarithms of distinct rational primes are linearly independent over \(\mathbb Q\). Indeed, if
\[
q_1\log p_1+\cdots+q_k\log p_k=0
\]
with rational \(q_j\), multiplication by a common denominator and exponentiation gives
\[
p_1^{n_1}\cdots p_k^{n_k}=1.
\]
Unique factorisation forces every integer \(n_j=0\), hence every \(q_j=0\).

Therefore:

> **Theorem 2 — finite length-rank obstruction.** No finite-state RSS suspension whose roof length takes only finitely many intrinsic transition values can have primitive-cycle lengths \(\{\log p\}\).

This result allows arbitrary real transition lengths; it is not limited to integer lengths or to one uniform duration. It does not rule out an infinite alphabet, an infinite-rank roof function, or a non-locally-constant geometric flow. It says that those would be genuinely new structure beyond the finite splice.

## 7. Third no-go result: resonance-density mismatch

A finite transition model with finitely many constant edge lengths has a transfer determinant whose entries are finite sums of exponentials in \(s\). In the uniform case it is simply a polynomial in \(e^{-as}\). Such exponential polynomials are of finite exponential type, and their zero/pole counting in a vertical strip is \(O(T)\).

Riemann’s nontrivial zeros obey the Riemann–von Mangoldt law
\[
N(T)=\frac{T}{2\pi}\log\frac{T}{2\pi}
-\frac{T}{2\pi}+O(\log T).
\]
Their density therefore grows like \(T\log T\), not \(T\). A finite number of periodic vertical lattices cannot match it.

> **Theorem 3 — finite spectral-complexity obstruction.** The finite Fibonacci transfer operator, and any finite cyclic decoration of it with a finite locally constant roof, cannot supply the resonance spectrum required by the Riemann explicit formula.

The obstruction concerns counting order, not a failed parameter fit. Rescaling \(a\), shifting \(s\), or adding finitely many phases cannot change \(O(T)\) into \(T\log T\).

## 8. The 40- and 60-step phases do not cure the problem

A generous test is to tensor the Fibonacci matrix with a cyclic clock \(C_m\). Then
\[
\det(I-zA\otimes C_m)
=
[1-(\varphi z)^m][1-(\psi z)^m],
\qquad \psi=-\varphi^{-1}.
\]
For even \(m\), this is
\[
1-L_mz^m+z^{2m}.
\]
Thus:
\[
\det(I-zA\otimes C_{40})=1-L_{40}z^{40}+z^{80},
\]
\[
\det(I-zA\otimes C_{60})=1-L_{60}z^{60}+z^{120}.
\]
For simultaneous 40- and 60-step clocks, the 2,400 clock states split into 20 joint orbits of length \(120\), giving
\[
\det(I-zA\otimes C_{40}\otimes C_{60})
=
(1-L_{120}z^{120}+z^{240})^{20}.
\]
These are larger reciprocal polynomials, but still reciprocal polynomials. They increase the number of periodic pole families without changing the finite-rank or \(O(T)\) obstruction.

## 9. Why simple word-to-integer constructions fail

Several tempting encodings were tested conceptually and rejected before prime comparison.

### Binary or decimal reading

A closed word has no preferred first symbol. Reading it as a binary or decimal integer changes under cyclic rotation unless one imposes a canonical starting point. Choosing the least rotation can make an invariant, but that convention is external to the return dynamics. More importantly, concatenating or repeating the word does not produce the powers required by an Euler factor.

### Matrix trace

Continued-fraction words naturally produce integer matrices. Their traces can sometimes be prime. The reproducible sample enumerated 32 primitive cyclic words over digits \(1,2,3\) through length four; eight had prime trace. But
\[
\operatorname{tr}(M^2)=\operatorname{tr}(M)^2-2\det M,
\]
not \(\operatorname{tr}(M)^2\). In all 32 samples, trace failed multiplicativity under cycle repetition. Prime traces are therefore incidental rather than Euler factors.

### Spectral radius

The spectral radius is multiplicative under repetition:
\[
\rho(M^k)=\rho(M)^k.
\]
This is the correct kind of invariant for a geodesic norm. But for a hyperbolic integer matrix of determinant \(1\) and trace \(t>2\),
\[
\rho(M)=\frac{t+\sqrt{t^2-4}}2,
\]
which is a quadratic irrational. Since \(t^2-4\) lies strictly between consecutive relevant squares for \(t>2\), it is not a square. The natural multiplicative norm is not a rational prime.

This yields a useful design rule: an integer-valued invariant such as trace tends not to respect repetitions, while the natural repetition-respecting eigenvalue invariant is algebraic rather than prime-valued.

## 10. The continued-fraction completion

### 10.1 Why it is not an arbitrary analogy

There is a precise algebraic overlap. The RSS/Fibonacci matrix is
\[
M_1=\begin{pmatrix}1&1\\1&0\end{pmatrix}.
\]
The positive continued-fraction digit \(a\) has matrix
\[
M_a=\begin{pmatrix}a&1\\1&0\end{pmatrix}.
\]
The inverse branch for digit one is
\[
g_1(x)=\frac1{1+x}.
\]
Its positive fixed point is \(x=\varphi^{-1}\), and its finite convergents are Fibonacci ratios. Thus the Fibonacci sector is exactly the all-ones itinerary of the Gauss continued-fraction map
\[
G(x)=\left\{\frac1x\right\}.
\]
Allowing all positive digits gives branches
\[
g_a(x)=\frac1{a+x},\qquad a=1,2,3,\ldots.
\]
This is the minimal known way to turn the one Fibonacci branch into a countably infinite transfer system while preserving the same inversion-plus-translation form.

### 10.2 What the extension supplies

The weighted transfer operator is
\[
(\mathcal L_s f)(x)=
\sum_{a\ge1}(a+x)^{-2s}
 f\!\left(\frac1{a+x}\right).
\]
On suitable holomorphic function spaces it is nuclear in an initial half-plane and admits meromorphic continuation. Its Fredholm determinants encode the Selberg zeta function for the modular surface. Periodic continued fractions correspond to hyperbolic conjugacy classes and closed modular geodesics.

This solves two deficiencies of the finite RSS model:

- the state alphabet is countably infinite, so finite length rank no longer applies in the same form;
- the transfer operator is infinite-dimensional and has a genuine resonance spectrum.

It also gives a concrete geometric interpretation for periodic words rather than an arbitrary binary-to-integer reading.

### 10.3 Where Riemann zeta actually appears

For the modular surface, the cusp contributes continuous spectrum. The scalar scattering coefficient can be written
\[
\Phi(s)=
\sqrt\pi\,
\frac{\Gamma(s-\tfrac12)\zeta(2s-1)}
     {\Gamma(s)\zeta(2s)}.
\]
Consequently,
\[
\frac{\Phi'(s)}{\Phi(s)}
=
\psi\!\left(s-\tfrac12\right)-\psi(s)
+2\frac{\zeta'(2s-1)}{\zeta(2s-1)}
-2\frac{\zeta'(2s)}{\zeta(2s)},
\]
up to the derivative of the constant factor. The logarithmic derivatives of \(\zeta\) insert prime-power terms into the scattering side of the modular trace formula, while zeros of \(\zeta\) become scattering zeros or poles after the indicated shifts.

This is a rigorous arithmetic-dynamical bridge defined initially by integer Möbius transformations, not by a supplied table of primes or zeros.

### 10.4 What it does not supply

The direct closed-geodesic product is Selberg’s
\[
Z_{\rm Sel}(s)=
\prod_{\{\gamma\}_{\rm primitive}}
\prod_{k=0}^{\infty}
\left(1-N(\gamma)^{-(s+k)}\right),
\]
where \(N(\gamma)\) is the hyperbolic norm of a primitive modular conjugacy class. These norms are generally quadratic units, not rational primes. Therefore the Riemann Euler factors do not arise by pairing one modular geodesic with one prime.

Riemann \(\zeta\) enters through the **cusp scattering determinant**, which is global boundary data of the noncompact arithmetic surface. That is a deeper connection than numerical resemblance, but it is different from the proposed RSS primitive-orbit identity.

Most importantly, RSS currently supplies the digit-one branch. It does not yet derive:

1. why every positive digit \(a\) must occur;
2. why the invariant geometry should be the modular quotient \(\mathrm{PSL}(2,\mathbb Z)\backslash\mathbb H\);
3. why a cusp and its scattering boundary condition are physically or conceptually required; or
4. why the resulting scattering phase should be the observable attached to the splice.

Until those steps are supplied without reference to the desired zeta result, the Gauss/modular construction is a candidate completion, not an RSS theorem.

## 11. Trace-formula assessment

The Riemann explicit formula, in one common form away from discontinuities, is
\[
\psi(x)
=x-\sum_{\rho}\frac{x^{\rho}}{\rho}
-\log(2\pi)-\frac12\log(1-x^{-2}),
\]
where the sum runs over nontrivial zeros and \(\psi(x)=\sum_{n\le x}\Lambda(n)\).

A dynamical model matching this formula must provide both sides of the dictionary:

| Arithmetic | Required dynamical object |
|---|---|
| prime \(p\) | primitive structure |
| prime power \(p^k\) | \(k\)-fold repetition |
| \(\log p\) | primitive length or action |
| zero \(\rho\) | spectral resonance/eigenvalue |
| gamma/trivial-zero terms | boundary, local or archimedean contribution |

The finite Fibonacci model supplies primitive cycles and repetitions, but only at commensurable lengths and with a finite-lattice resonance pattern. It fails the last three rows.

The modular completion supplies primitive geodesics, infinitely many transfer resonances, and a cusp contribution containing the gamma and Riemann-zeta factors. It therefore has the architecture of a trace formula. But its geodesic side is not the von Mangoldt measure. Riemann’s prime powers enter through scattering arithmetic rather than through the all-ones Fibonacci orbit sector.

## 12. What would falsify or advance the extension

A useful next programme should be preregistered around derivation, not numerical fit.

### Gate A — derive the alphabet

Starting only from stated RSS operations, derive the branches
\[
x\mapsto\frac1{a+x},\qquad a\in\mathbb N,
\]
including why \(a\) ranges over every positive integer and why no extra branches occur. If the digits are merely added because the Gauss map is known to involve zeta functions, the bridge is circular at the model-selection level.

### Gate B — derive the invariant measure and operator

Show why the Jacobian weight is \((a+x)^{-2s}\), identify the natural function space, and prove that the RSS return operation gives the Mayer operator rather than only resembling it.

### Gate C — derive the cusp

Show that continued integration or self-disintegration creates a noncompact boundary with modular cusp geometry. Without a cusp, the scattering determinant containing Riemann \(\zeta\) has no RSS reason to be present.

### Gate D — obtain the prime measure without inserting Euler factors

Derive the logarithmic derivative of the scattering determinant from the RSS/modular return problem before expanding it as \(\zeta'/\zeta\). Then verify that the resulting distribution is exactly
\[
\sum_{p,k}(\log p)\delta_{k\log p}.
\]
This would not make primes primitive RSS cycles, but it could make them intrinsic scattering data of an RSS-derived completion.

### Gate E — explain the Riemann line

The appearance of \(\zeta(2s)\) in \(\Phi(s)\) maps Riemann zeros to shifted scattering poles. It does not prove that those poles lie on a symmetry line. Any RH claim still needs positivity, self-adjointness, or another mechanism strong enough to force the relevant spectral location. Merely possessing a transfer operator is not enough.

## 13. Reproducibility

Run from the repository root:

```bash
npm run research:rss-orbits
```

The program uses only Node’s standard library. It performs:

1. exact BigInt Fibonacci and Lucas arithmetic;
2. Möbius inversion and the Dold integrality test through \(n=30\);
3. exact primitive Fibonacci-cycle enumeration by count;
4. an integer sieve through \(\lfloor\varphi^2\log\varphi\,\varphi^{30}\rfloor=2{,}343{,}909\);
5. the calibrated prime-shell comparison;
6. exact finite-phase determinant coefficients; and
7. continued-fraction matrix tests for primitive words over digits \(1,2,3\) through length four.

Assertions stop the program if the period-two obstruction, known cycle total, or trace-repetition test changes unexpectedly. The full result is written to `docs/rh/rss-prime-orbit-results.json`.

## 14. Evidence grading

| Statement | Grade | Reason |
|---|---|---|
| \(R_n=F_{n+2}-1\) fails fixed-point integrality at \(n=2\) | **Exact theorem** | Elementary orbit decomposition |
| Golden-mean completion has \(Z(z)=1/(1-z-z^2)\) | **Exact theorem** | Finite matrix determinant |
| \(S_n\sim\pi(\varphi^2\log\varphi\,\varphi^n)\) | **Exact asymptotic consequence** | Fibonacci orbit asymptotic plus the prime number theorem |
| 0.271% RMS difference for \(12\le n\le30\) | **Reproducible computation** | Exact cycle counts and integer sieve |
| Finite roof labels cannot yield all \(\log p\) | **Exact theorem** | Finite rational rank versus unique factorisation |
| Finite cyclic phases cannot supply Riemann zero density | **Exact structural obstruction** | Exponential-polynomial versus \(T\log T\) counting |
| Fibonacci is the all-ones Gauss-map sector | **Exact mathematical identification** | Continued-fraction fixed point and digit matrices |
| Gauss/Mayer dynamics yields modular Selberg zeta | **Established literature** | Transfer-operator theory |
| Modular scattering contains \(\zeta(2s-1)/\zeta(2s)\) | **Established literature** | Eisenstein-series constant term |
| RSS intrinsically requires the full modular completion | **Open conjecture** | No derivation from current splice axioms |
| Current RSS proves RH or generates the Riemann Euler product | **Not supported; finite version ruled out** | Multiple exact obstructions above |

## 15. Final conclusion

The investigation did not find a hidden direct prime generator in the present Rankin Skeletal Splice. It found something more precise and, scientifically, more useful.

The open RSS population cannot be re-labelled as periodic points. Its proper Fibonacci closed completion has a valid dynamical Euler product, but that product is rational. Its primitive cycles reproduce a prime-number-theorem-shaped envelope with a derived golden calibration and striking finite accuracy, yet they collapse many cycles onto each integer period and therefore cannot reproduce individual prime logarithms. Finite phase decorations preserve the same obstruction. No adjustment of finitely many scales can change the finite length rank or the wrong resonance density.

The strongest surviving idea is the continued-fraction completion. The Fibonacci matrix is not merely analogous to the Gauss system: it is its digit-one branch, and the golden ratio is its all-ones fixed itinerary. Completing that branch to all positive continued-fraction digits leads to a genuine infinite transfer operator, modular closed geodesics, Selberg zeta and a scattering determinant containing Riemann zeta. This is a rigorous route from a Fibonacci seed to a setting where Riemann zeros are spectral data.

But the location of Riemann zeta in that setting matters. It appears in cusp scattering, not as the primitive-orbit product of the original finite splice. The next legitimate question is therefore no longer “Can the existing Fibonacci cycles secretly be the primes?” The answer to that is no. The sharper question is:

> **Can RSS independently derive the countable inversion branches and cusp boundary whose scattering determinant is the completed Riemann zeta ratio?**

That question is open, concrete and falsifiable. It is the recommended direction for further work.

---

## Selected sources

1. W. Parry and M. Pollicott, *Zeta Functions and the Periodic Orbit Structure of Hyperbolic Dynamics*, Astérisque 187–188 (1990): <https://www.numdam.org/item/AST_1990__187-188__1_0/>
2. D. Ruelle, “Dynamical zeta functions and transfer operators,” *Notices of the AMS* 49 (2002): <https://www.ams.org/notices/200208/fea-ruelle.pdf>
3. M. V. Berry and J. P. Keating, periodic-orbit/Riemann dictionary and the requirement \(\ell_p=\log p\): <https://empslocal.ex.ac.uk/people/staff/mrwatkin/zeta/berry-keating1.pdf>
4. Mayer-transfer-operator treatment of modular Selberg/Ruelle zeta functions: <https://arxiv.org/abs/1008.4229>
5. Farey/Gauss transfer operators and Selberg/Ruelle zeta functions: <https://arxiv.org/abs/0907.1471>
6. D. Zagier, periodic continued fractions, modular geodesics and transfer operators: <https://people.mpim-bonn.mpg.de/zagier/files/tex/NewPointsSelbergZeta/fulltext.pdf>
7. Clay Mathematics Institute, *The Riemann Hypothesis* survey, including spectral and dynamical perspectives: <https://www.aimath.org/WWN/rh/rh.pdf>

The literature establishes the general dynamical, Gauss-map and modular statements. The RSS-specific no-go arguments, calibrated Fibonacci-cycle comparison and reproducible computations are the results of this investigation.
