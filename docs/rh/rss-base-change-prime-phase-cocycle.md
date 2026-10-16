# Base change as a prime-phase cocycle: an exact bridge and its limit

**Investigation — 15 October 2026**  
**Question:** Does the base-10/base-8 phase difference, together with the 1001 block reflection, define an action on the actual xi zeros?  
**Status:** An exact character identity and its explicit-formula realization are established. No cancellation law or RH-strength positivity follows.

## Finding

For every real ordinate \(\gamma\), the map
\[
\chi_\gamma(q)=q^{i\gamma}=e^{i\gamma\log q},\qquad q\in\mathbb Q_{>0},
\]
is a multiplicative character. Since \(10/8=5/4\),
\[
\boxed{\frac{\chi_\gamma(10)}{\chi_\gamma(8)}
=\chi_\gamma(5)\chi_\gamma(2)^{-2}.}
\]
Equivalently,
\[
\gamma(\log 10-\log 8)=\gamma(\log 5-2\log2)\pmod{2\pi}
\]
when interpreted inside the exponential. This is an exact prime-coordinate factorization of the base-change phase, valid at every actual zero ordinate. It can be viewed as a one-dimensional character/cocycle identity on the multiplicative prime lattice, not as a new zero relation.

More generally, for bases \(b,c>1\),
\[
e^{i\gamma\log_b n}=e^{i(\gamma/\log b)\log n},
\qquad
\gamma_c=\gamma_b\frac{\log c}{\log b}
\]
keeps the same phase when changing logarithmic coordinates. The parameter must be rescaled; holding its numerical value fixed changes the phase.

For the 1001 factorization, the same character gives
\[
\chi_\gamma(1001)=\chi_\gamma(7)\chi_\gamma(11)\chi_\gamma(13).
\]
Separately, \(10\equiv-1\pmod{11}\), so \(10^3+1\equiv0\pmod{11}\). This modular divisibility and the multiplicative character identity are different structures. In particular, \(10+1\equiv0\pmod{11}\) is not a signed cancellation among \(\Lambda(7),\Lambda(11),\Lambda(13)\), nor among zeros.

## Exact explicit-formula realization

The Guinand–Weil formula pairs a suitable test function in logarithmic prime coordinates with its Fourier/Mellin transform on the zero ordinates, together with pole and archimedean terms. Replacing the multiplicative coordinate \(u=\log x\) by \(v=\log_b x=u/\log b\) is a change of variables: the test function and its Fourier transform rescale reciprocally. Thus the base-coordinate change acts exactly on both sides when the test function is transformed with it.

Equivalently, Mellin characters are the unitary characters of \(\mathbb R_{>0}\) under multiplication; in logarithmic coordinates they are ordinary Fourier characters. The prime character identity above is the discrete prime-coordinate manifestation of that fact. Burnol's treatment of the explicit formula and conductor operator is a relevant source for the multiplicative/dilation viewpoint; the Guinand–Weil formula itself is the established prime/zero identity.

This yields a legitimate exact bridge:
\[
\text{prime-factor phase character}
\longleftrightarrow
\text{rescaled Mellin/Fourier test in the explicit formula}
\longleftrightarrow
\text{the actual zero ordinates},
\]
with the archimedean and pole terms retained. It does **not** give an operator on zero locations, change \(\eta=\Re\rho-1/2\), or impose relations between distinct ordinates. It transports test functions and phase coordinates.

## Full transformed Guinand–Weil identity

Here is one complete convention, with no RH assumption. Let \(g\in C_c^\infty(\mathbb R)\), and set
\[
\widehat g(\xi)=\int_{\mathbb R}e^{ix\xi}g(x)\,dx.
\]
Write every nontrivial zero with multiplicity as \(\rho=\tfrac12+i\gamma_\rho\); off RH, \(\gamma_\rho=(\rho-\tfrac12)/i\) is generally complex. Let \(\Gamma_{\mathbb R}(s)=\pi^{-s/2}\Gamma(s/2)\). Then the Guinand formula is
\[
\boxed{\begin{aligned}
\sum_\rho\widehat g(\gamma_\rho)
-\widehat g(i/2)-\widehat g(-i/2)
={}&\frac1{2\pi}\int_{\mathbb R}\widehat g(t)\left[
\frac{\Gamma_{\mathbb R}'}{\Gamma_{\mathbb R}}\!\left(\frac12+it\right)
+\frac{\Gamma_{\mathbb R}'}{\Gamma_{\mathbb R}}\!\left(\frac12-it\right)
\right]dt\\
&-\sum_{p}\sum_{m\ge1}\frac{\log p}{p^{m/2}}
\left[g(m\log p)+g(-m\log p)\right].
\end{aligned}}
\]
The two displayed transform values are the pole terms; the gamma integral is the archimedean contribution; the last line includes every prime power. The zero sum converges for this test class in the standard explicit-formula sense. This formulation sums over the actual complex \(\gamma_\rho\) and therefore does not presume RH. Garrett gives this formula and contour argument explicitly. [Guinand formula notes](https://www-users.cse.umn.edu/~garrett/m/mfms/notes_2019-20/04_Guinand_explicit_fml.pdf)

Put \(a=\log b\) and define the base-coordinate operator
\[
(U_b g)(v)=g(av),\qquad \widehat{U_b g}(\xi)=a^{-1}\widehat g(\xi/a).
\]
Because \(\log_b(p^m)=m\log p/a\), the prime samples are invariant:
\[
(U_b g)(\log_b(p^m))=g(m\log p).
\]
Inserting \(U_bg\) into the full formula gives the exact transformed identity
\[
\boxed{\begin{aligned}
\frac1a\sum_\rho\widehat g(\gamma_\rho/a)
-\frac1a\left[\widehat g(i/(2a))+\widehat g(-i/(2a))\right]
={}&\frac1{2\pi a}\int_{\mathbb R}\widehat g(t/a)\left[
\frac{\Gamma_{\mathbb R}'}{\Gamma_{\mathbb R}}\!\left(\frac12+it\right)
+\frac{\Gamma_{\mathbb R}'}{\Gamma_{\mathbb R}}\!\left(\frac12-it\right)
\right]dt\\
&-\sum_{p,m}\frac{\log p}{p^{m/2}}
\left[g(m\log p)+g(-m\log p)\right].
\end{aligned}}
\]
This is a proved test-space intertwining identity: prime-power samples stay fixed while the zero transform, pole terms, and archimedean transform rescale together. It is coordinate covariance, not cancellation. In particular, the gamma integral is not invariant by itself; it changes as required to balance the rescaled zero functional and the unchanged prime samples.

## Why this does not prove cancellation

The identity holds for each \(\gamma\) because \(\log(ab)=\log a+\log b\). It does not imply that
\[
\chi_\gamma(10)-\chi_\gamma(8)=0,
\]
that any weighted sum of such phases vanishes over the zeros, or that a positive zero-ledger quantity is zero. The explicit formula transfers a specified test identity; it does not manufacture the test identity or its sign. A proposed cancellation still needs an explicitly stated test function, all prime-power terms, and pole/gamma contributions, followed by an exact proof that the arithmetic side vanishes or has the needed sign.

The block observation \(10\leftrightarrow01\) contributes only the congruence \(10\equiv-1\pmod{11}\) in the factorization \(10^3+1\). No map has been found from this finite-field involution to the continuous Mellin-character action. Do not identify the two.

## New local-global connection: the product formula

A more informative exact connection comes from the idelic product formula. Normalize \(|p|_p=p^{-1}\). Then
\[
|10|_\infty |10|_2 |10|_5=10\cdot\frac12\cdot\frac15=1,
\qquad
|8|_\infty |8|_2=8\cdot\frac18=1.
\]
Taking logarithms gives
\[
\log10=\log2+\log5,
\qquad \log8=3\log2,
\qquad
\log(10/8)=\log5-2\log2.
\]
The rational-scale identity is compatible with the product formula, but the embeddings must be distinguished. The archimedean scale character \(\lambda\mapsto\lambda^{i\gamma}\) is evaluated on the idele class represented by an archimedean scale; the diagonal rational idele \(q\) is trivial in \(\mathbb A_{\mathbb Q}^{\times}/\mathbb Q^{\times}\), since \(|q|_{\infty}\prod_p|q|_p=1\). Thus \(q^{i\gamma}\) is a character of the abstract group \(\mathbb Q_{>0}^{\times}\), but must not be called the value of the global norm character on the diagonal rational idele. The real and finite local components cancel in the product formula, while a single-place scale remains nontrivial in the idele-class quotient. Garrett's Iwasawa–Tate notes state the product formula and its role in idele-class characters. [Iwasawa–Tate notes](https://www-users.cse.umn.edu/~garrett/m/mfms/notes_c/Iwasawa-Tate.pdf)

But it still does not connect the mod-11 reflection to the zero phase. At 11, 10 is a unit and \(|10|_{11}=1\); its residue \(10\equiv-1\) lies in the unit component, which the norm character does not see. A ramified finite character can see that unit and return a root of unity (for the quadratic character mod 11, \(\chi(10)=-1\)), whereas the archimedean factor \(e^{i\gamma\log10}\) varies continuously with \(\gamma\). The product formula for norms therefore balances the 2/5 valuations, not the mod-11 sign.

One can deliberately introduce Dirichlet characters modulo 11. Their explicit formulas then connect character-weighted prime powers to zeros of the corresponding Dirichlet \(L(s,\chi)\), not to the zero divisor of Riemann's \(\xi\) alone. Character orthogonality can recover primes in residue classes by combining that family of twisted zero ledgers. This is a rigorous route for studying residue-class arithmetic, but it enlarges the spectral object; identifying that family with the un-twisted \(\xi\) ledger would require an additional theorem. The principal character modulo 11 gives \(\zeta(s)(1-11^{-s})\), so it also adds/removes the local Euler factor rather than encoding the block reflection as a symmetry of \(\xi\). [Dirichlet L-function overview](https://encyclopediaofmath.org/wiki/Dirichlet_L-function)

**Useful conclusion:** the base-10/base-8 phase decomposition is explained by the diagonal rational product formula across the real, 2-adic, and 5-adic places. The mod-11 involution is a unit-character phenomenon at a different place. Both sit naturally in adelic language, but in different components; no canonical action identified between them has emerged.

## Mod-11 Dirichlet explicit formula: exact zero ledgers

This section fixes the meaning of “the modulo-11 zero ledgers” without assuming RH. Let \(\chi\) be a primitive nonprincipal character modulo 11, let \(a\in\{0,1\}\) satisfy \(\chi(-1)=(-1)^a\), and define
\[
\Lambda(s,\chi)=\left(\frac{11}{\pi}\right)^{(s+a)/2}\Gamma\!\left(\frac{s+a}{2}\right)L(s,\chi),\quad
A_a(s)=\frac12\log\frac{11}{\pi}+\frac12\psi\!\left(\frac{s+a}{2}\right).
\]
For \(c>1\), put \(D_\chi(s)=\Lambda'/\Lambda(s,\chi)=A_a(s)-\sum_{n\ge2}\chi(n)\Lambda(n)n^{-s}\). If \(H\) is entire and rapidly decreasing on the vertical strips used in shifting contours, the functional equation and residue theorem give
\[
\boxed{\sum_{\rho_\chi}m_\rho H(\rho)=\frac1{2\pi i}\int_{(c)}\left[D_\chi(s)H(s)+D_{\bar\chi}(s)H(1-s)\right]ds.}
\]
Here \(\rho_\chi\) ranges over the nontrivial zeros of the completed primitive \(L\)-function, with multiplicity. There are no pole terms for these nonprincipal primitive characters. The archimedean terms are explicitly the two integrals obtained by substituting \(A_a(s)\) and \(A_a(s)\) (the same parity for \(\bar\chi\)); the finite terms are
\[
-\frac1{2\pi i}\int_{(c)}\left[\sum_n\chi(n)\Lambda(n)n^{-s}H(s)+\sum_n\bar\chi(n)\Lambda(n)n^{-s}H(1-s)\right]ds.
\]
Thus each character's prime weights are paired with the zeros of its own \(L(s,\chi)\), not with the \(\zeta\)-zero ledger. The formula is a contour form of the Guinand–Weil identity; taking \(H(s)=\int g(u)e^{(s-1/2)u}du\) recovers Fourier/Mellin test formulations.

The principal character modulo 11 is imprimitive:
\[
L(s,\chi_0)=\left(1-11^{-s}\right)\zeta(s).
\]
Write \(L=\log11\), \(\Gamma_{\mathbb R}(s)=\pi^{-s/2}\Gamma(s/2)\),
\[
\Lambda_0(s)=\Gamma_{\mathbb R}(s)L(s,\chi_0),\quad
A_0(s)=-\tfrac12\log\pi+\tfrac12\psi(s/2),\quad
B_{11}(s)=\frac{L}{11^s-1}.
\]
For \(c>1\),
\[
D_0(s)=\frac{\Lambda_0'}{\Lambda_0}(s)
=A_0(s)-\sum_{\substack{n\ge2\\11\nmid n}}\Lambda(n)n^{-s}.
\]
Its functional equation has a local-factor ratio
\[
\frac{\Lambda_0(s)}{\Lambda_0(1-s)}
=\frac{1-11^{-s}}{1-11^{-(1-s)}},
\qquad
\frac{d}{ds}\log\frac{\Lambda_0(s)}{\Lambda_0(1-s)}=B_{11}(s)+B_{11}(1-s).
\]
Consequently its complete contour formula is
\[
\boxed{\begin{aligned}
\sum_{\rho\in Z(\zeta)}H(\rho)
+\sum_{k\in\mathbb Z\setminus\{0\}}H\!\left(\frac{2\pi i k}{L}\right)-H(1)
={}&\frac1{2\pi i}\int_{(c)}\Bigl[D_0(s)H(s)+D_0(s)H(1-s)\\
&\hspace{38mm}-\bigl(B_{11}(s)+B_{11}(1-s)\bigr)H(1-s)\Bigr]ds.
\end{aligned}}
\]
The pole term is \(-H(1)\). There is no pole term at zero: the zero of \(1-11^{-s}\) cancels the pole of \(\Gamma_{\mathbb R}\) there. The extra zeros are precisely \(s=2\pi ik/L\), \(k\ne0\), from the omitted Euler factor. The two archimedean integrals are carried by \(A_0(s)[H(s)+H(1-s)]\); the prime-power series in \(D_0\) omits exactly \(11^m\); the displayed \(B_{11}\)-terms are the local correction forced by the imprimitive functional equation. This makes explicit why simply deleting \(11^m\) from the prime sum while retaining the zeta zero side is not an identity: the Euler-factor zero lattice and local functional-equation correction must also be retained.

For \(\chi\bmod11\), the action \(x\mapsto10x=-x\) on \(\mathbb F_{11}^{\times}\) is diagonalized by characters:
\[
\chi(10)=\chi(-1)=(-1)^a.
\]
There are five even characters and five odd characters; the principal character is even, and the quadratic character is odd, so it indeed gives \(\chi(10)=-1\). This is an eigenvalue of the finite residue action, not a value of \(e^{i\gamma\log10}\). The primitive explicit formulas above assign separate zero ledgers to all nine nonprincipal characters.

Character orthogonality gives, for \((a,11)=1\),
\[
\mathbf1_{n\equiv a\ (11)}=\frac1{10}\sum_{\chi\bmod11}\bar\chi(a)\chi(n),
\]
so the explicit formula for primes in a residue class combines the zero sums over all corresponding \(L(s,\chi)\). It does not collapse them to the zeta zeros. The cyclotomic factorization requires care about imprimitive characters. In terms of primitive characters of conductor dividing 11,
\[
\zeta_{\mathbb Q(\zeta_{11})}(s)=\zeta(s)\prod_{\substack{\chi\ne\chi_0\\\chi\bmod11}}L(s,\chi),
\]
where \(\chi_0\) here denotes the trivial character of conductor 1 and the other nine characters are primitive of conductor 11. If instead one uses all ten characters modulo 11 with their imprimitive Euler factors, then
\[
\prod_{\chi\bmod11}L(s,\chi)
=\left(1-11^{-s}\right)\zeta_{\mathbb Q(\zeta_{11})}(s),
\]
not \(\zeta_{\mathbb Q(\zeta_{11})}\) itself. Equivalently,
\[
\zeta_{\mathbb Q(\zeta_{11})}(s)=\frac{\prod_{\chi\bmod11}L(s,\chi)}{1-11^{-s}}.
\]
At divisor level the corrected factorization combines the zeta divisor and the nine twisted divisors; using the all-mod-11 product additionally introduces the principal Euler-factor zero lattice, which must be divided back out. It yields no identity for the untwisted \(\xi\)-zeros alone unless the other divisors are separately controlled or cancel by a further theorem. None is supplied by orthogonality or by the factorization itself.

## Frobenius reveals a sharper arithmetic relation—and an order obstruction

The residue data has a canonical cyclotomic interpretation. For \(K=\mathbb Q(\zeta_{11})\),
\[
\operatorname{Gal}(K/\mathbb Q)\simeq(\mathbb Z/11\mathbb Z)^\times,
\qquad
\sigma_r(\zeta_{11})=\zeta_{11}^{r}.
\]
For rational primes \(p\ne11\), \(\operatorname{Frob}_p=\sigma_p\). Hence
\[
\operatorname{Frob}_2\operatorname{Frob}_5
=\sigma_{10}=\sigma_{-1},
\]
which is complex conjugation and has order 2. This is an exact Galois-theoretic realization of the product \(10=2\cdot5\) and the residue reflection \(10\equiv-1\pmod{11}\). It connects the two local prime factors to the finite reflection, but its natural spectral setting is the cyclotomic Dedekind zeta / Dirichlet-character family—not the untwisted zeta divisor alone. MIT's cyclotomic-field notes identify Frobenius with the residue class and give the Dirichlet-factorization context. [MIT 18.785 notes](https://math.mit.edu/classes/18.785/2015fa/LectureNotes18.pdf)

The base comparison gives a different Galois element:
\[
\sigma_{10}\sigma_8^{-1}=\sigma_{10\cdot8^{-1}}=\sigma_4.
\]
In \(\mathbb Q(\zeta_{11})\), the residue classes of 2 and 7 have order 10, so the rational primes 2, 7 and 13 (with 13\(\equiv2\)) are inert; 5 has order 5 and splits into two degree-5 primes. The rational prime 11 is totally ramified. Thus in the 1001 factorization, 7 and 13 contribute inert Frobenius elements \(\sigma_7,\sigma_{13}\), whose product is \(\sigma_3\) of order 5, while the factor 11 is ramified and has no Frobenius element. In particular, the whole composite 1001 cannot be assigned a Frobenius class by multiplying local Frobenii at all three factors: the very factor responsible for \(1001\equiv0\pmod{11}\) is the ramified place where the unramified Frobenius construction is unavailable.
Modulo 11, \(4\) has order 5, whereas \(10=-1\) has order 2. Thus the base-10/base-8 ratio corresponds to an order-five Frobenius element, not the order-two reflection. Characterwise,
\[
\chi(10)=\chi(-1)=\pm1,
\qquad
\chi(10/8)=\chi(4),\quad \chi(4)^5=1.
\]
The quadratic character has \(\chi(10)=-1\) but \(\chi(4)=1\), since 4 is a square modulo 11. So even within the character decomposition, the reflection and the base-ratio action are not the same eigensymmetry.

At the first zeta ordinate \(\gamma_1=14.134725141734693\ldots\), the base-ratio phase is
\[
\gamma_1\log(5/4)=3.1540727649769265\ldots
=\pi+0.0124801113871333\ldots.
\]
It is close to \(-1\) as a unit complex phase, but not equal. This is a finite numerical near-coincidence only. No theorem puts the zeta ordinates on the discrete lattice \((\arg\chi(4)+2\pi k)/\log(5/4)\), and such a condition must not be inferred from the first zero.

**Net result:** we now have an exact bridge from the rational factorization \(10=2\cdot5\) to a Frobenius reflection in \(\mathbb Q(\zeta_{11})\), plus an exact order mismatch showing that the 10/8 ratio acts as a different cyclotomic element. The Frobenius bridge explains the finite residue symmetry but still does not intertwine it with, or cancel terms in, the actual \(\xi\)-zero ledger.

## Local Euler-factor and representation audit

The decomposition type in \(K=\mathbb Q(\zeta_{11})\) is determined by the order of \(p\bmod11\) in \(G\), except at the ramified prime 11:

| rational prime | class/order in \((\mathbb Z/11)^\times\) | splitting in \(K\) | local factor of \(\zeta_K(s)\) |
|---|---:|---|---|
| 2 | 2, order 10 | inert: one prime of residue degree 10 | \((1-2^{-10s})^{-1}\) |
| 5 | 5, order 5 | two primes of residue degree 5 | \((1-5^{-5s})^{-2}\) |
| 7 | 7, order 10 | inert: one prime of residue degree 10 | \((1-7^{-10s})^{-1}\) |
| 11 | ramified, \(e=10,f=1\) | one prime, totally ramified | \((1-11^{-s})^{-1}\) |
| 13 | 2 mod 11, order 10 | inert: one prime of residue degree 10 | \((1-13^{-10s})^{-1}\) |

At each unramified \(p\), the local factor can also be checked character-by-character:
\[
\prod_{\chi\bmod11}(1-\chi(p)p^{-s})^{-1}
=(1-p^{-f_ps})^{-10/f_p},\qquad f_p=\operatorname{ord}_{11}(p).
\]
The character sum \(\sum_\chi\chi(p)^k\) is 10 when \(p^k\equiv1\pmod{11}\), and 0 otherwise. That is the exact local trace/orthogonality mechanism behind the residue-degree exponents. At 11 the nonprincipal characters have \(\chi(11)=0\), and the trivial primitive character supplies the factor \((1-11^{-s})^{-1}\).

For the specified products,
\[
\sigma_2\sigma_5=\sigma_{10}=\sigma_{-1},\qquad
\sigma_7\sigma_{13}=\sigma_3,
\]
where \(\sigma_3\) has order 5. The full integer 1001 is not an unramified Frobenius element because it is divisible by 11. Its two unramified prime factors contribute a product of order 5; the ramified factor 11 cannot be assigned a Frobenius element.

The Artin factorization is
\[
L(s,\mathrm{Reg}_G)=\zeta_K(s)
=\zeta(s)\prod_{\substack{\chi\bmod11\\\chi\ne\chi_0}}L(s,\chi),
\]
with \(\chi_0\) here the trivial primitive character of conductor 1 and the nine other characters primitive of conductor 11. The regular representation decomposes as the sum of these ten one-dimensional representations. Its trivial-isotypic projector
\[
e_{\mathrm{triv}}=\frac1{10}\sum_{g\in G}g
\]
selects the trivial representation, whose Artin \(L\)-function is exactly \(\zeta(s)\); its completed zero divisor is therefore the untwisted \(\xi\)-zero ledger (up to the standard pole/trivial-zero completion factors). This is a valid representation-theoretic projection, but it is tautological: it selects the zeta factor before summing zero divisors. It does not derive cancellation of the other nine zero ledgers from the Frobenius data.

By contrast, the ordinary regular-character trace satisfies \(\sum_\chi\chi(g)=0\) for nonidentity \(g\), including \(g=\sigma_{10}\) and \(\sigma_4\). This cancels character values in local prime Euler coefficients; through the explicit formula it yields the local factorization and splitting laws above. It does not imply that sums of test-function values over the distinct zero sets \(Z(L(s,\chi))\) vanish. Such a zero-side cancellation would require a further spectral identity, not character orthogonality alone.

The global zero-divisor contribution is additive under the product factorization: the zeros of \(\zeta_K\) are the multiset union of the nontrivial zeta zeros and the nine twisted \(L\)-zero sets, with multiplicities (coincident zeros add). The imprimitive product over all ten characters modulo 11 has the additional Euler-factor divisor \(1-11^{-s}\), whose zeros lie at \(s=2\pi ik/\log11\); dividing by that factor removes this lattice. The finite Euler factors at 2, 5, 7, 11 and 13 are nonzero in \(\Re s>0\), so they do not contribute zeros in the critical strip. No RH is used in these divisor statements.

## Full regular-representation trace formula for \(\mathbb Q(\zeta_{11})\)

Let \(G=\operatorname{Gal}(K/\mathbb Q)\simeq C_{10}\), \(D_K=11^9\), and \((r_1,r_2)=(0,5)\). The regular Artin representation has
\[
L(s,\operatorname{Reg}_G)=\zeta_K(s),
\qquad
\zeta_K(s)=\zeta(s)\prod_{\substack{\chi\bmod11\\\chi\ne\chi_0}}L(s,\chi),
\]
where \(\chi_0\) is the trivial primitive character of conductor 1 and the nine other characters are primitive of conductor 11. There are four nontrivial even characters and five odd characters. The product of their standard completed \(L\)-functions and the completed \(\zeta\)-function differs from the standard completed Dedekind zeta by the harmless constant \(11^{5/2}\); logarithmic derivatives and zero divisors agree.

Use
\[
\Gamma_{\mathbb C}(s)=2(2\pi)^{-s}\Gamma(s),\qquad
\Lambda_K(s)=11^{9s/2}\Gamma_{\mathbb C}(s)^5\zeta_K(s).
\]
Then \(\Lambda_K(s)=\Lambda_K(1-s)\), and it has simple poles at \(s=0,1\). Its logarithmic derivative on \(\Re s>1\) is
\[
\boxed{
D_K(s)=\frac{\Lambda_K'}{\Lambda_K}(s)
=\frac92\log11+5\bigl(\psi(s)-\log(2\pi)\bigr)
-\sum_{p\ne11}\frac{10\log p}{p^{f_p s}-1}
-\frac{\log11}{11^s-1},
}
\]
where \(f_p=\operatorname{ord}_{11}(p)\). This displays the discriminant, archimedean term, every unramified prime-power term, and the ramified 11-place. At the five requested primes the prime part is
\[
-\frac{10\log2}{2^{10s}-1}
-\frac{10\log5}{5^{5s}-1}
-\frac{10\log7}{7^{10s}-1}
-\frac{\log11}{11^s-1}
-\frac{10\log13}{13^{10s}-1}.
\]

For an entire test function \(H\) decaying sufficiently rapidly on vertical strips, contour shifting and the functional equation give the regular-representation explicit formula
\[
\boxed{
\sum_{\rho_K}m_\rho H(\rho_K)-H(0)-H(1)
=\frac1{2\pi i}\int_{(c)}D_K(s)\bigl(H(s)+H(1-s)\bigr)\,ds,
\qquad c>1.
}
\]
The zero sum is the multiset union of the nontrivial zeta zeros and the nine nontrivial primitive Dirichlet-\(L\) zero sets. No RH is used; \(H\) is evaluated at the actual complex zero locations. The terms \(-H(0)-H(1)\) are the two completed-function pole residues. The \(5(\psi(s)-\log2\pi)\) term is the archimedean contribution.

## Projection after the arithmetic trace: what it does and does not do

For an unramified prime \(p\),
\[
\operatorname{tr}(\operatorname{Frob}_p^k\mid\operatorname{Reg}_G)
=\sum_{\chi\in\widehat G}\chi(\operatorname{Frob}_p)^k
=\begin{cases}10,&f_p\mid k,\\0,&f_p\nmid k.\end{cases}
\]
This gives exactly the regular-representation Euler factors in the table. At 11, inertia is all of \(G\); \(\operatorname{Reg}_G^{I_{11}}\) is the one-dimensional trivial subspace, giving the ramified factor \((1-11^{-s})^{-1}\). These are prime-side trace facts.

There is an exact but tautological projection: apply \(e_{\rm triv}=|G|^{-1}\sum_g g\) to the representation-valued operator/trace before taking its scalar trace. It extracts the one-dimensional trivial Artin constituent, whose \(L\)-function is \(\zeta(s)\); its completed zero divisor is the Riemann \(\xi\)-zero ledger (with standard pole/trivial-zero completion terms). This is not a cancellation theorem: the projector selects the trivial constituent by definition.

If one has already taken the ordinary scalar regular trace, the character/isotypic data has been collapsed. No subsequent scalar operation can recover which part came from the trivial constituent without extra data. Moreover, the ordinary character identity \(\sum_\chi\chi(g)=0\) for nonidentity \(g\) cancels local Frobenius coefficients; it does not imply \(\sum_{\chi\ne\chi_0}\sum_{\rho_\chi}H(\rho_\chi)=0\). The explicit formula equates the complete arithmetic and spectral functionals, but supplies no such spectral cancellation on its own.

Thus the requested non-tautological post-trace projection is not obtained from Artin factorization. The missing theorem would have to construct an equivariant spectral realization/regularized trace in which the arithmetic group-algebra idempotent acts on the zero-side distribution and prove that its complementary nine-character component vanishes for the chosen test class, while retaining the trivial component. If this vanishing is equivalent to Weil positivity or RH, it is only a reformulation.

## Geometric scaling–Frobenius intertwiner from finite covers

A useful external source sharpens the preceding arithmetic correspondence into an actual action on a geometric cover. Connes and Consani construct a finite abelian cover \(X_{\mathbb Q}^{L}\to X_{\mathbb Q}\) for every finite abelian extension \(L/\mathbb Q\). A prime orbit \(C_p\) downstairs has length \(\log p\); in the cover, its monodromy is \(\operatorname{Frob}_p\), and the connected components above it correspond to primes of \(L\) above \(p\). This is Theorem 1 and the monodromy result in Section 3 of [“Knots, primes and class field theory”](https://arxiv.org/abs/2501.06560).

For \(L=\mathbb Q(\zeta_{11})\), the cover has deck group \(G=C_{10}\). The return data is therefore the pair
\[
\boxed{(\ell_p, m_p)=(\log p,\sigma_p)}
\]
for every unramified prime \(p\ne11\): continuous scaling length and finite Frobenius monodromy. The cover predicts the splitting patterns geometrically:

- \(p=2\): monodromy \(\sigma_2\) has order 10, so the lifted orbit is one circle of length \(10\log2\) (inert);
- \(p=5\): monodromy \(\sigma_5\) has order 5, so the preimage has two circles, each of length \(5\log5\);
- \(p=7,13\): order-10 monodromy, one circle of length \(10\log p\);
- \(p=11\): the cover ramifies, so no unramified Frobenius return is assigned.

This is exactly compatible with each local Euler factor \((1-p^{-f_ps})^{-10/f_p}\): the orbit-cycle length multiplier is \(f_p\), and the number of lifted cycles is \(10/f_p\). It is a genuine geometric scaling–Frobenius intertwining at the periodic-orbit level, not just an abstract group calculation.

For the decimal comparison, adding the abelianized return labels (a formal divisor operation, not a claim that distinct prime orbits concatenate canonically as paths) gives
\[
(\log2,\sigma_2)+(\log5,\sigma_5)=(\log10,\sigma_{10}),
\]
while three returns at 2 give \((3\log2,\sigma_8)=(\log8,\sigma_8)\). Their formal difference is
\[
\boxed{\bigl(\log(10/8),\sigma_{10}\sigma_8^{-1}\bigr)
=\bigl(\log(5/4),\sigma_4\bigr).}
\]
Thus the base phase and finite monodromy can be placed in one joint character:
\[
\Theta_{t,\chi}(q)=e^{it\log q}\,\chi(\sigma_q),\qquad (q,11)=1,
\]
which sends the 10/8 comparison to \(e^{it\log(5/4)}\chi(4)\). For the quadratic character, \(\chi(10)=-1\) but \(\chi(4)=1\); the reflection and ratio remain distinct. The finite cover explains how the prime return length and Frobenius monodromy coexist, but it does not force the continuous phase to equal the finite character value at any zeta-zero ordinate.

**Spectral boundary:** this external result establishes covers and orbit monodromy, not a new trace formula cancelling character zero distributions. Existing adelic trace-formula work interprets explicit formulas and Hecke/Grössencharakter zeros, but positivity conditions remain RH-strength. To obtain the requested zeta-only result, one still needs a theorem that lifts the trace formula to the finite cover, proves its deck-group-equivariant spectral decomposition, and shows that a nontrivial operation on the lifted trace yields the trivial-character zero distribution without simply inserting the trivial idempotent by definition. The cover alone gives arithmetic monodromy, not zero-side cancellation.

## TTI reading

The TTI framework's literal decimal splice hierarchy treats 10, 100, and 1000 as structural thresholds. On the finite cover, their formal Frobenius labels are \(\sigma_{10}=\sigma_{-1}\), \(\sigma_{100}=1\), and \(\sigma_{1000}=\sigma_{-1}\): the action alternates with the parity of the decimal exponent, since \(10^n\equiv(-1)^n\pmod{11}\). This gives the decimal hierarchy an exact but very small finite-monodromy shadow; it does not explain the hierarchy or make its levels prime orbits. The Riemann splice audit already warns that a discrete decimal tower has support at multiples of \(\log10\), while the prime ledger has events at every \(k\log p\); the supports do not coincide. Base-change covariance supplies a precise mathematical interpretation of a *joint length/Frobenius return label*, but it does not select base ten physically or turn the decimal splice into the prime/zero trace formula. Any such promotion would require a new theorem defining an operator that respects both the TTI threshold action and the full prime-power support.

This is consistent with the TTI editorial standard: distinguish established transform identities from the framework's proposed bridge; state competing explanations; name a falsifiable condition; do not promote analogy to derivation.

## Next concrete gate

The next gate now has two parts. First, exploit the actual finite cover to define a joint scaling/deck action: on the orbit over \(C_p\), scaling returns after \(\log p\) and the fiber returns by \(\sigma_p\). Its character-weighted orbit terms are exactly the local Dirichlet/Artin Euler coefficients. Second, determine whether this action lifts to a well-defined operator or regularized trace on a spectral space whose deck-character sectors have the corresponding \(L(s,\chi)\) zero divisors. The finite-cover theorem supplies the first part, not the second.

A valid advance must specify the spectral space, lifted scaling generator, commuting deck action, trace regularization, archimedean and ramified terms, and the zero-side action of the character projectors. It must explain why the trivial sector's \(\xi\)-ledger is recovered by a non-tautological operation rather than selecting the trivial idempotent at the outset. Merely decomposing the finite cover by characters recovers Artin factorization; it does not cancel the nine nontrivial zero divisors. Any positivity or vanishing equivalent to Weil positivity/RH must be labelled as such.

## Prompt upgrade for the next research pass

> For \(K=\mathbb Q(\zeta_{11})\), use the finite abelian cover of \(X_{\mathbb Q}\) constructed by Connes–Consani (arXiv:2501.06560): its deck group is \(G=(\mathbb Z/11\mathbb Z)^\times\), and the prime orbit \(C_p\) has length \(\log p\) and monodromy \(\sigma_p\) for \(p\ne11\). First derive explicitly how the lifted orbit cycles reproduce the local factors \((1-p^{-f_ps})^{-10/f_p}\), including the ramified 11-place. Then test whether scaling flow on this cover admits a specified deck-equivariant spectral operator/regularized trace whose \(\chi\)-isotypic explicit formula has zero divisor exactly that of the appropriate primitive Dirichlet \(L(s,\chi)\), with all gamma, pole, and conductor terms accounted for. Track the joint return character \(e^{it\log p}\chi(\sigma_p)\), the decimal formal comparison \((\log(5/4),\sigma_4)\), the nine nontrivial zero divisors, and the imprimitive principal factor \((1-11^{-s})\). Finally determine whether any operation yields the untwisted \(\xi\)-zero ledger non-tautologically, without identifying twisted zeros with zeta zeros or asserting cancellation from prime-side character orthogonality. Do not assume RH or RH-equivalent positivity. Either prove a precise operator/trace identity or state the obstruction and the additional theorem required; distinguish the cover's established Frobenius monodromy from any conjectural spectral lift.
>

## Sources

- A. P. Guinand, “A summation formula in the theory of prime numbers” (1948), classical source for the explicit summation formula; historical access and formula discussion: [MathOverflow reference](https://mathoverflow.net/questions/82635/explicit-formula-for-riemann-zeros-counting-function).
- A. Weil, “Sur les formules explicites de la théorie des nombres premiers” (1952), general explicit formula and positivity criterion.
- J.-F. Burnol, [“The Explicit Formula and the conductor operator”](https://arxiv.org/abs/math/9902080), derives the explicit formula in an adelic/multiplicative setting and studies dilation-invariant conductor operators.
- A. Connes, [“Trace formula in noncommutative geometry and the zeros of the Riemann zeta function”](https://doi.org/10.1007/PL00001465), spectral/trace-formula perspective on scaling and the zeros; this is a framework and not an RH proof.
- Existing internal TTI audit: [`riemann-splice-questions.njk`](../../tti/src/riemann-splice-questions.njk), especially the decimal support mismatch, ordinate projection, and explicit-formula channel sections.

## Second-pass literature update

The earlier next-gate prompt below predates two relevant findings and should now be treated as superseded by [`rss-frobenius-linking-second-pass.md`](./rss-frobenius-linking-second-pass.md). Morishita's Deninger–Connes–Consani comparison identifies the finite Frobenius cover monodromy as a quotient of arithmetic linking data, and existing adelic work already supplies character-wise spectral realizations / the virtual idele-class representation. The new prompt therefore does not ask for these known pieces again; it asks whether TTI's specifically defined operations induce a new operator on that framework and states a stopping criterion if no such action is defined.
