# From the Rankin Skeletal Splice to the modular cusp

**Follow-up investigation — 14 October 2026**<br>
**Question:** Can the continued-fraction digits and cusp geometry be derived from RSS rather than imported because they are known to contain Riemann zeta?<br>
**Companion program:** `scripts/research-rss-modular-closure.mjs`<br>
**Machine-readable results:** `docs/rh/rss-modular-closure-results.json`

> **Third-stage follow-up completed:** `docs/rh/rss-ledger-hyperbolic-completion.md` derives the concrete ledger from consecutive declared RSS splice multiplicities, gives the positive imaginary coordinate an exact two-period Gram-matrix meaning, and derives the hyperbolic metric as the affine-invariant relative-strain metric on unit-area torus shapes. It discharges both premises for the mathematical RSS state model while preserving the need for an empirical physical carrier.

## Result in one sentence

A **conditional RSS derivation has been achieved**: if the existing integrated/returned ledger is represented by a primitive two-coordinate integer state and the existing integer seam maps act projectively, then unit integration, reciprocal seam exchange and the \(-1\) mirror force the modular generators; the Gauss digits become counts of completed unit integrations, the cusp is forced by the infinite-order unit translation, the Fibonacci splice is exactly the all-ones branch, and Riemann zeta emerges without prime input from the decomposition of all lattice states into primitive states and integer repetitions.

The qualification “conditional” remains essential. RSS already uses integer \(GL(2,\mathbb Z)\) maps for winding ledgers, a unit interval, integration, a mirror and an order-two seam. It does **not yet prove** that the integrated amount and returned residue form the particular two-component projective ledger used below, nor that its physical state space carries the canonical hyperbolic metric. Those are now isolated as the two bridge premises. The continued-fraction alphabet and cusp are no longer independent assumptions once those premises are accepted.

## 1. What had to be derived

The first investigation established that the finite Fibonacci sector cannot itself have primitive lengths \(\log p\), and identified the countable Gauss-map completion as the most promising extension. Two serious debts remained:

1. Why should the extra digits \(a=2,3,4,\ldots\) exist if RSS initially supplies only Fibonacci growth and the golden branch?
2. Why should the completed state space be the modular surface, with a cusp whose scattering coefficient contains Riemann zeta?

Simply choosing the Gauss map because its transfer operator is famous would be circular model selection. A derivation has to begin with RSS operations and arrive at the Gauss and modular objects before primes or zeta functions are mentioned.

The key observation is that RSS already contains the right *types* of operation:

- completed integration from \(0\) to \(1\);
- integer levels obtained by repeating a completed unit;
- a seam that exchanges inside and outside, or smallward and largeward roles;
- a mirror represented by \(-1\);
- two-coordinate integer winding ledgers acted on by \(GL(2,\mathbb Z)\); and
- a complex direction introduced by the quarter-turn.

The new work asks for the smallest projective closure of those operations.

## 2. The projective ledger premise

Let an RSS state carry two integer ledger entries
\[
(u,v)\in\mathbb Z^2,
\qquad \gcd(u,v)=1.
\]
They may be read abstractly as integrated amount and residual amount. Only their ratio is used:
\[
x=\frac uv\in\mathbb P^1(\mathbb R)
=\mathbb R\cup\{\infty\}.
\]
The coprimality condition says that the ledger state is primitive rather than an integer repetition of a smaller state.

This premise is not invented from modular-form terminology. The existing inverted-torus construction already lets seam transport act on a two-coordinate winding lattice by matrices in \(GL(2,\mathbb Z)\). Projectivising any such two-coordinate integer ledger necessarily produces fractional-linear transformations
\[
x\longmapsto\frac{ax+b}{cx+d},
\qquad
\begin{pmatrix}a&b\\c&d\end{pmatrix}
\in GL(2,\mathbb Z).
\]
The unresolved RSS step is the identification of the winding pair with the integration/residue pair. The mathematics after that identification is forced.

The shared word “Möbius” does no work here. A Möbius strip and a Möbius fractional-linear transformation are different objects named after the same mathematician. The bridge comes from the declared two-coordinate \(GL(2,\mathbb Z)\) ledger and its projectivisation, not from the name of the strip.

## 3. Three RSS operations and their unique matrices

### 3.1 Unit integration

Adding one completed copy of the residual unit to the integrated account gives
\[
(u,v)\longmapsto(u+v,v).
\]
On the ratio coordinate this is
\[
T(x)=x+1,
\qquad
T=\begin{pmatrix}1&1\\0&1\end{pmatrix}.
\]
It is the unique affine translation fixing \(\infty\) and carrying \(0\) to \(1\). There is no fitted scale parameter: the RSS interval is normalised by its own endpoints.

### 3.2 Reciprocal seam exchange

If the seam exchanges the integrated and residual roles, then
\[
(u,v)\longmapsto(v,u),
\]
so
\[
R(x)=\frac1x,
\qquad
R=\begin{pmatrix}0&1\\1&0\end{pmatrix},
\qquad R^2=I.
\]
This map exchanges \(0\) and \(\infty\), fixes \(1\), and has determinant \(-1\), so it reverses projective orientation. It is also the unique fractional-linear map with those three actions. More generally, exchanging \(0\) and \(\infty\) gives \(R(x)=\kappa_{\rm proj}/x\); fixing the RSS threshold \(1\) forces \(\kappa_{\rm proj}=1\). This projective coordinate normalisation is distinct from the framework’s geometric coupling \(\kappa_{\rm R}=1/(4\pi^2)\), whose modular cusp interpretation is derived in `rss-spectral-positivity-investigation.md`.

This is more specific than saying that a Möbius strip reverses orientation. The projective derivation requires the seam to **swap the two ledger coordinates**, not merely flip a sign. That distinction is one of the remaining empirical or conceptual tests.

### 3.3 The mirror

The RSS mirror at \(-1\) supplies
\[
N(u,v)=(-u,v),
\qquad
N(x)=-x,
\qquad
N=\begin{pmatrix}-1&0\\0&1\end{pmatrix},
\qquad N^2=I.
\]
Both \(R\) and \(N\) reverse orientation. Their composition preserves it:
\[
S=NR=egin{pmatrix}0&-1\\1&0\end{pmatrix},
\qquad
S(x)=-\frac1x.
\]

## 4. The modular group is then forced

The matrices \(S\) and \(T\) satisfy
\[
S^2=-I,
\qquad
(ST)^3=-I.
\]
On the projective line, \(I\) and \(-I\) act identically. Therefore
\[
S^2=(ST)^3=1
\]
in the projective group. The standard generation theorem now gives
\[
\boxed{\langle S,T\rangle=PSL(2,\mathbb Z).}
\]
Adding the orientation-reversing mirror gives
\[
\langle S,T,N\rangle=PGL(2,\mathbb Z).
\]

This is the first central result.

> **RSS projective-closure theorem.** A primitive two-coordinate integer ledger, together with unit integration \((u,v)\mapsto(u+v,v)\), seam exchange \((u,v)\mapsto(v,u)\), and the RSS mirror \((u,v)\mapsto(-u,v)\), has orientation-preserving closure exactly \(PSL(2,\mathbb Z)\).

No continued fractions, primes or zeta zeros occur in the premises.

The modular orbifold has signature \((2,3,\infty)\): an order-two point from \(S\), an order-three point from \(ST\), and a cusp from the infinite-order translation \(T\). RSS already emphasises an order-two seam, a three-part skeleton and an asymptotic infinity. That correspondence is supporting structure, not part of the proof; three labelled points do not automatically constitute an order-three group action.

## 5. The continued-fraction digits are unit-integration counts

Take a normalised residual state
\[
0<x<1.
\]
Reciprocal seam exchange sends it above the unit threshold:
\[
R(x)=\frac1x>1.
\]
There is a unique integer
\[
a(x)=\left\lfloor\frac1x\right\rfloor\ge1
\]
counting how many complete unit intervals fit before the residual state returns to \([0,1)\). Remove those completed units with \(T^{-a}\). The normalised return map is
\[
\boxed{
G(x)=T^{-a(x)}R(x)
=\frac1x-\left\lfloor\frac1x\right\rfloor.}
\]
This is precisely the Gauss continued-fraction map.

The digit \(a\) is therefore not an imported symbol. It has an RSS interpretation:

> \(a\) is the number of completed unit integrations between one reciprocal seam crossing and the next normalised return.

Every positive integer occurs because
\[
a(x)=a
\quad\Longleftrightarrow\quad
\frac1{a+1}<x\le\frac1a.
\]
Each interval is nonempty. Thus the entire countable alphabet \(\{1,2,3,\ldots\}\) follows from the full RSS unit interval, reciprocal exchange and unit normalisation.

The inverse branch is
\[
g_a(y)=\frac1{a+y}=RT^a(y),
\]
represented by
\[
B_a=egin{pmatrix}0&1\\1&a\end{pmatrix},
\qquad \det B_a=-1.
\]
The computation reconstructed exactly all 323 primitive rational states \(p/q\in(0,1)\) with \(q\le32\) from their terminating Gauss words. First digits \(1\) through \(32\) already occur in that small range. Irrational states continue indefinitely.

## 6. The existing Fibonacci splice is recovered, not discarded

The digit-one inverse branch is
\[
g_1(x)=\frac1{1+x}.
\]
Its positive fixed point obeys
\[
x=\frac1{1+x}
\quad\Longleftrightarrow\quad
x^2+x-1=0
\quad\Longleftrightarrow\quad
x=\varphi^{-1}.
\]
So the golden return depth is the unique fixed residual state that crosses exactly one complete integration unit at every return.

The standard continued-fraction digit matrix is
\[
A=\begin{pmatrix}1&1\\1&0\end{pmatrix},
\]
and
\[
A^n=
\begin{pmatrix}
F_{n+1}&F_n\\
F_n&F_{n-1}
\end{pmatrix}.
\]
The branch matrix \(B_1\) is conjugate to \(A\) by the coordinate swap:
\[
B_1=RAR.
\]
Therefore:

- the golden ratio is the fixed point of the one-unit branch;
- Fibonacci numbers are its matrix iterates; and
- the finite RSS/Fibonacci system is the constant itinerary
  \[
  [1,1,1,\ldots].
  \]

This closes an important explanatory circle. Unit integration plus reciprocal seam exchange generates the golden ratio and Fibonacci matrix already used by RSS. The wider continued-fraction system is obtained by allowing the number of completed units before return to vary.

The landing depths \(\varphi^{-n}\) should not be confused with successive Gauss iterates of \(\varphi^{-1}\): the latter is a fixed point. The powers \(\varphi^{-n}\) are separate RSS depth stations. What embeds into the Gauss system is the **golden branch law**, not the claim that every listed depth is the next point of one Gauss orbit.

## 7. Why the cusp is no longer an arbitrary addition

### 7.1 From the real boundary to the upper half-plane

The fractional-linear maps extend from the real projective boundary to
\[
\mathbb H=\{z=x+iy:y>0\}
\]
by
\[
z\longmapsto\frac{az+b}{cz+d}.
\]
The orientation-preserving matrices in \(PSL(2,\mathbb Z)\) preserve \(\mathbb H\) and its canonical hyperbolic metric
\[
ds^2=\frac{dx^2+dy^2}{y^2}.
\]
The quotient
\[
\mathcal M=PSL(2,\mathbb Z)\backslash\mathbb H
\]
is the modular surface.

The upper-half-plane completion is the second declared bridge premise. It is mathematically canonical once RSS asks for an orientation-preserving complex/projective geometry, but RSS has not established that this metric is physical spacetime or its integration field.

### 7.2 Translation forces the cusp

The unit-integration generator acts as
\[
T(z)=z+1.
\]
It has infinite order and fixes the boundary point \(\infty\). Quotienting by repeated unit integrations identifies every horizontal translate. The local invariant coordinate is
\[
q=e^{2\pi iz},
\qquad q(z+1)=q(z).
\]
As \(\operatorname{Im}z\to\infty\), \(q\to0\). The puncture at \(q=0\) is the modular cusp.

Thus the cusp is not separately selected after the modular group is known. It is the geometric quotient of the endless unit-integration direction. All rational boundary points belong to the orbit of \(\infty\): if \(a/c\) is reduced, Bézout’s identity completes \((a,c)\) to a determinant-one matrix. Hence the modular surface has one cusp.

On the RSS reading, terminating rational integration histories and the unbounded integration direction meet in one quotient boundary. This is an interpretation of the established geometry, not additional proof of a physical seam.

### 7.3 Gauss return as a geodesic return

A theorem of Artin and Series identifies the Gauss map with a factor of a first-return map for the geodesic flow on the modular surface. Continued-fraction digits record blocks in the cutting sequence of a geodesic through copies of the fundamental domain. The RSS “completed units before the next seam return” interpretation therefore agrees with the established geodesic coding; it is not only an algebraic coincidence.

## 8. Riemann zeta emerges from primitive versus repeated ledger states

The modular Eisenstein series at the cusp is initially defined, for \(\Re s>1\), by primitive integer pairs:
\[
E(z,s)
=\frac12
\sum_{\substack{(c,d)\in\mathbb Z^2\\ \gcd(c,d)=1}}
\frac{y^s}{|cz+d|^{2s}}.
\]
No prime list appears in this definition. It sums over primitive projective ledger states.

Now include every nonzero lattice state:
\[
E_{\rm all}(z,s)
=\frac12
\sum_{(m,n)\ne(0,0)}
\frac{y^s}{|mz+n|^{2s}}.
\]
Every nonzero pair has a unique decomposition
\[
(m,n)=k(c,d),
\qquad k\ge1,
\qquad \gcd(c,d)=1.
\]
Homogeneity gives
\[
|k(cz+d)|^{-2s}=k^{-2s}|cz+d|^{-2s}.
\]
Therefore
\[
\boxed{
E_{\rm all}(z,s)
=\left(\sum_{k=1}^{\infty}k^{-2s}\right)E(z,s)
=\zeta(2s)E(z,s).}
\]

This is an exact RSS-compatible origin for Riemann zeta:

> Riemann zeta is the universal scale-repetition factor between all integer ledger states and primitive ledger states.

Primes are not supplied. They emerge later as the irreducible multiplicative scales when unique factorisation rewrites
\[
\sum_{k\ge1}k^{-w}
=\prod_p(1-p^{-w})^{-1}.
\]

This does **not** make primes primitive modular geodesics. It derives the Riemann Euler product from multiplicative dilation of projective ledger vectors, a different dynamical role from the closed-geodesic Selberg product.

## 9. The scattering coefficient follows from the same ledger

Average \(E(x+iy,s)\) over one unit-integration period \(0\le x<1\). Its constant term is
\[
E_0(y,s)=y^s+\Phi(s)y^{1-s}.
\]
For each denominator \(c\), there are \(\phi(c)\) primitive residue classes \(d\pmod c\), where \(\phi\) is Euler’s totient. Unfolding the translated intervals gives
\[
\Phi(s)
=\left(\int_{-\infty}^{\infty}(1+t^2)^{-s}\,dt\right)
\left(\sum_{c=1}^{\infty}\frac{\phi(c)}{c^{2s}}\right).
\]
The integral is
\[
\int_{-\infty}^{\infty}(1+t^2)^{-s}\,dt
=\sqrt\pi\frac{\Gamma(s-\tfrac12)}{\Gamma(s)}.
\]
The totient series is derived from primitive residue counting:
\[
\sum_{c=1}^{\infty}\frac{\phi(c)}{c^w}
=\frac{\zeta(w-1)}{\zeta(w)}.
\]
Consequently
\[
\boxed{
\Phi(s)
=\sqrt\pi\,
\frac{\Gamma(s-\tfrac12)}{\Gamma(s)}
\frac{\zeta(2s-1)}{\zeta(2s)}.}
\]

The calculation does not assume the desired scattering formula. It obtains it by counting coprime ledger states at the cusp. The reproducible computation independently checked at \(w=4\) that
\[
\sum_{n\le200000}\frac{\phi(n)}{n^4}
\]
and the prime Euler product truncated at the same bound differ by only
\[
7.78\times10^{-12},
\]
consistent with the omitted series tail. The state map and modular generators were fixed before that prime factorisation check.

The logarithmic derivative of \(\Phi\) contains \(\zeta'/\zeta\), so the modular scattering contribution to the trace formula contains the von Mangoldt prime-power terms. A Riemann zero \(\rho\) appears as a shifted scattering zero or pole through \(\zeta(2s)\) and \(\zeta(2s-1)\).

This is the strongest result of the follow-up:

Writing
\[
\Lambda(w)=\pi^{-w/2}\Gamma(w/2)\zeta(w),
\]
the scattering formula is equivalently \(\Phi(s)=\Lambda(2s-1)/\Lambda(2s)\).

> **Conditional RSS–Riemann theorem.** Under the projective-ledger and hyperbolic-completion premises, RSS unit integration and reciprocal seam exchange generate the modular surface. Primitive-versus-repeated ledger decomposition yields \(\zeta(2s)\), and cusp scattering yields the completed ratio \(\Lambda(2s-1)/\Lambda(2s)\), without primes or zeta zeros as construction input.

## 10. The transfer operator is also forced after the return map

For the Gauss return map, the inverse branches are
\[
g_a(x)=\frac1{a+x},
\qquad
|g_a'(x)|=(a+x)^{-2}.
\]
The natural weighted transfer operator is therefore
\[
(\mathcal L_s f)(x)
=\sum_{a=1}^{\infty}|g_a'(x)|^s f(g_a(x))
=\sum_{a=1}^{\infty}(a+x)^{-2s}
 f\!\left(\frac1{a+x}\right).
\]
The exponent \(-2s\) is the Jacobian of the derived projective branch, not a fitted prime weight. Mayer’s theorem then gives the modular Selberg-zeta factorisation
\[
Z_{\rm Sel}(s)
=\det(1-\mathcal L_s)\det(1+\mathcal L_s)

after choosing the standard holomorphic function space and conventions.

This supplies the infinite transfer spectrum missing from the finite Fibonacci model. It also keeps the two arithmetic appearances separate:

- primitive modular geodesics give Selberg zeta;
- integer dilation and cusp scattering give Riemann zeta.

Conflating them would undo the main clarification achieved by the research.

## 11. The golden Hecke-group rival

A serious rival must be considered. Hecke triangle groups are generated by
\[
S(z)=-\frac1z,
\qquad
T_q(z)=z+\lambda_q,
\qquad
\lambda_q=2\cos\frac\pi q.
\]
For \(q=3\), \(\lambda_3=1\), giving the modular group. For \(q=5\),
\[
\lambda_5=2\cos\frac\pi5=\varphi,
\]
giving the golden Hecke group of signature \((2,5,\infty)\).

Because RSS prominently uses \(\varphi\) and a speculative five-state plane, one could select \(q=5\). That would produce a valid countable transfer system, but generally not the simple modular scattering ratio containing Riemann zeta. Choosing \(q=3\) only because it yields Riemann zeta would be circular.

The projective derivation resolves the ambiguity conditionally. RSS normalises its completed interval as \(0\to1\), so unit integration requires translation length \(1\). The golden ratio then emerges as the fixed point of the one-unit branch
\[
x=\frac1{1+x},
\]
rather than being inserted as the translation length. This uses fewer independent choices and recovers the existing Fibonacci law.

Nevertheless, RSS must explicitly decide which statement is fundamental:

- **unit-threshold reading:** one completed integration is the translation scale; modular \(q=3\) follows and \(\varphi\) is a fixed state;
- **golden-translation reading:** \(\varphi\) is the translation scale; Hecke \(q=5\) follows and the direct Riemann scattering formula is lost.

The present project’s repeated insistence that \(0\) and \(1\) are the normalised boundaries favours the unit-threshold reading. This is a reason internal to RSS, not an arithmetic fit, but it should be declared as an axiom in any formal version.

## 12. What has and has not been achieved

### Achieved mathematically

1. An explicit RSS-derived projective state space has been defined.
2. Unit integration, seam swap and mirror have exact \(GL(2,\mathbb Z)\) matrices.
3. Their orientation-preserving closure is exactly \(PSL(2,\mathbb Z)\).
4. Every continued-fraction digit is derived as a completed-unit count.
5. The golden/Fibonacci sector is recovered as the all-ones branch.
6. The infinite-order translation forces the modular cusp after hyperbolic completion.
7. Riemann zeta is derived as the primitive/all-lattice repetition factor.
8. Its scattering ratio is derived from totient counts at the cusp.
9. The Mayer operator follows from the Jacobians of the derived inverse branches.

### Not achieved

1. The original finite RSS cycles still do not equal rational primes.
2. Modular closed geodesics still have quadratic-unit norms, not prime norms.
3. No proof of RH follows from placing zeros in a scattering determinant.
4. RSS has not yet physically established the two-coordinate ledger or hyperbolic metric.
5. The connection between this mathematical cusp and a cosmological horizon remains speculative.
6. The integer-dilation derivation of \(\zeta\) is not the originally requested positive primitive-cycle identity
   \[
   \sum_{C,k}\ell(C)\delta_{k\ell(C)}
   =\sum_{p,k}\log p\,\delta_{k\log p}.
   \]

The outcome is therefore stronger than an analogy but weaker than a proof that the pre-existing RSS already contained Riemann zeta with no added premise.

## 13. The remaining two bridge tests

> **Follow-up status:** the third-stage report `rss-ledger-hyperbolic-completion.md` answers both tests for the mathematical RSS state model: consecutive splice multiplicities supply the primitive recurrence ledger, and the marked two-cycle Gram matrix supplies \(\tau\) and the invariant shape metric. Physical channel identification and material seam exchange remain empirical tests.

The work has reduced a diffuse problem to two explicit questions.

### Test A — is the RSS ledger genuinely projective?

RSS must derive or reject a measurable pair \((u,v)\) for which:

- unit integration is \((u,v)\mapsto(u+v,v)\);
- seam crossing is \((u,v)\mapsto(v,u)\); and
- common integer scaling \((u,v)\mapsto(k u,k v)\) represents repetition rather than a new primitive state.

A different update law would produce a different group. Merely borrowing the existing torus winding matrix is insufficient unless the map from winding to integration/residue is supplied.

### Test B — is the upper-half-plane metric intrinsic?

RSS must identify what \(x\) and \(y>0\) measure, why fractional-linear seam maps preserve their physically or conceptually relevant relation, and why the invariant metric is hyperbolic. If \(y\) cannot be tied to a resolution, throughput, phase or return scale, the modular surface remains a mathematically canonical completion rather than an RSS necessity.

These tests are falsifiable. If either fails, the new theorem remains valid as mathematics but ceases to be an RSS derivation.

## 14. Verdict

The additional continued-fraction digits no longer need to be postulated. They are the Euclidean quotients generated whenever reciprocal seam exchange is renormalised by completed unit integrations. The cusp no longer needs to be selected because it is known to contain zeta. It is forced by quotienting the infinite unit-translation direction in the orientation-preserving projective completion.

Most importantly, Riemann zeta appears twice by exact calculation:
\[
E_{\rm all}(z,s)=\zeta(2s)E_{\rm primitive}(z,s)
\]
and
\[
\Phi(s)=\frac{\Lambda(2s-1)}{\Lambda(2s)}.
\]
The first says that zeta counts integer repetitions of primitive ledger directions. The second says that the same arithmetic controls scattering at the cusp. Neither formula requires primes or zeros as construction data.

This is a legitimate conditional RSS derivation of the modular/Gauss/scattering bridge. It does not revive the ruled-out claim that finite Fibonacci cycles are the primes, and it does not prove RH. Its outstanding burden is now sharply located: derive the projective integration/residue ledger and its hyperbolic metric from RSS’s own ontology or observables.

> **Later stages:** `rss-ledger-hyperbolic-completion.md` derives the mathematical ledger and intrinsic shape metric. `rss-spectral-positivity-investigation.md` then tests the remaining RH step and isolates the unproved arithmetic Gram identity that would be needed to confine the zeros.

---

## Reproducibility

Run from the repository root:

```bash
npm run research:rss-modular
```

The program uses only Node’s standard library and verifies:

- \(R^2=N^2=I\), \(S^2=(ST)^3=-I\) at matrix level;
- exact Fibonacci matrix powers through \(n=12\);
- the golden fixed point of \(g_1(x)=1/(1+x)\);
- exact Gauss coding and reconstruction of primitive rationals through denominator 32;
- exact totient identities through 10,000; and
- the totient-series/Euler-product comparison through 200,000.

## Selected literature

1. Caroline Series, “The modular surface and continued fractions,” *Journal of the London Mathematical Society* 31 (1985), 69–80: <http://reu.dimacs.rutgers.edu/~ks1613/documents/series.pdf>
2. Dieter H. Mayer, “The thermodynamic formalism approach to Selberg’s zeta function for \(PSL(2,\mathbb Z)\),” *Bulletin of the AMS* 25 (1991): <https://projecteuclid.org/journalArticle/Download?urlid=bams%2F1183657045>
3. Don Zagier, “Eisenstein series and the Riemann zeta-function”: <https://people.mpim-bonn.mpg.de/zagier/files/scanned/EisensteinRiemannZeta/eisenstein-zeta-978-3-662-00734-1_10.pdf>
4. J. S. Milne, *Modular Functions and Modular Forms*, including the cusp coordinate \(q=e^{2\pi iz}\): <https://www.jmilne.org/math/CourseNotes/MF110.pdf>
5. Mayer, Mühlenbruch and Strömberg, “The transfer operator for the Hecke triangle groups,” for the \(\lambda_q=2\cos(\pi/q)\) rival family: <https://arxiv.org/abs/0912.2236>
6. Lagarias and Suzuki, “The Riemann hypothesis for certain integrals of Eisenstein series,” for the completed lattice-sum formulation: <https://arxiv.org/html/math/0412039>
