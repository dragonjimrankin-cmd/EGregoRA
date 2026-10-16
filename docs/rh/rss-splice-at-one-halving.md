# What if every splice at 1 halves everything else?

**Sixteenth-stage investigation — 14 October 2026**  
**Question:** If every return through the splice at \(1\) halves what remains downstream, does repeated halving force the xi zeros onto the critical line?  
**Companion program:** `scripts/research-rss-splice-at-one-halving.py`  
**Machine-readable results:** `docs/rh/rss-splice-at-one-halving-results.json`

## Verdict

“Everything else halves” has three materially different readings:

1. every zero’s horizontal displacement from the critical line halves;
2. downstream populations or admitted theta weights halve;
3. the remaining interval—or equivalently the remaining admission deficit—halves.

They do not have the same consequence.

If the first rule acts repeatedly on the zero set of the **same function \(\xi\)**, it proves RH immediately. Indeed, the map
\[
H(\beta+i\gamma)
=
\frac12+rac{\beta-1/2}{2}+i\gamma
\]
gives
\[
H^n(\beta+i\gamma)
=
\frac12+2^{-n}\left(\beta-\frac12\right)+i\gamma.
\]
An off-line zero would generate infinitely many distinct zeros of \(\xi\) converging to the finite point \(1/2+i\gamma\). Since \(\xi\) is entire and not identically zero, that is impossible. Conversely, RH makes every zero a fixed point of \(H\). The zero-preserving halving rule is therefore **equivalent to RH**, not an independent proof of it. TTI has not yet derived that the splice at 1 maps every xi zero to another xi zero.

Literal halving of admitted theta weights has the opposite analytic effect: repeated multiplication by \(2^{-n}\) drives the downstream contribution to zero and destroys convergence to \(\xi\). Literal population halving also fails on odd Fibonacci cohorts unless another rounding, pairing or fractional-weight rule is supplied.

Halving the remaining deficit is coherent. If \(a\) is the admitted fraction and \(g=1-a\), then
\[
g_{n+1}=\frac{g_n}{2},
\qquad
a_{n+1}=1-\frac{g_n}{2}=rac{1+a_n}{2}.
\]
This accelerates every downstream carrier toward full admission and preserves local convergence to \(\xi\). It does not, by itself, halve horizontal zero displacement.

Finite-stage halving also leaves a global loophole. It may contract every tracked zero while a new quartet appears at a height growing with the stage. The escaping-quartet obstruction therefore remains unless the halving law applies globally to **every** finite-stage zero, including newly created and escaping zeros.

No proof of RH is obtained.

---

## 1. Two scopes that must not be conflated

### 1.1 A map of the same xi zero set

This is the strong reading:
\[
H(Z(\xi))\subseteq Z(\xi).
\]
Every iterate remains a zero of the same entire function. Under this assumption, finite accumulation gives a contradiction for every off-line starting point.

### 1.2 A transition between finite completions

This is weaker:
\[
Z(\Xi_N)\longrightarrow Z(\Xi_{N+1}).
\]
Zeros at different stages belong to different functions. Their convergence does not create an infinite zero set of one fixed function. Furthermore, the observed counts
\[
2,2,4,3
\]
in the earlier approximants show that there is no canonical one-to-one labelling of every zero from stage to stage: zeros may enter or leave a fixed window.

A stage transition can support a proof only if it supplies a global shrinking strip for all finite-stage zeros and local uniform convergence to \(\xi\).

## 2. Horizontal zero halving

Write
\[
\rho=rac12+\eta+i\gamma.
\]
The proposed halving map is
\[
H(\rho)=\frac12+\frac\eta2+i\gamma.
\]
It commutes with critical-line reflection and conjugation. An off-line quartet with horizontal residue \(\pm\eta\) is sent to a quartet with residue \(\pm\eta/2\).

After \(n\) returns,
\[
H^n(\rho)=\frac12+2^{-n}\eta+i\gamma.
\]
If all these points are xi zeros, they are distinct whenever \(\eta\ne0\), and they accumulate at
\[
\rho_\infty=\frac12+i\gamma.
\]
The identity theorem forbids this for a nonzero entire function. Therefore
\[
\eta=0.
\]

This proves the following conditional lemma:

> **Same-xi halving lemma.** RH holds if and only if horizontal halving at the splice at 1 sends every nontrivial xi zero to another xi zero.

The reverse direction is immediate: if RH holds, every zero has \(\eta=0\), so \(H\) fixes it.

The lemma isolates the exact missing statement. Neither the endpoint identification \(0\sim1\), the phase \(\pi\), Fibonacci population arithmetic nor the finite theta completions have yet established
\[
\xi(\rho)=0
\quad\Longrightarrow\quad
\xi(H(\rho))=0.
\]

## 3. Why a half-turn is not yet a half-distance

The previously identified \(\pi\)-phase gives a reflection or half-turn. In horizontal coordinates it exchanges
\[
\eta\longleftrightarrow-\eta.
\]
Repeated application produces a two-cycle:
\[
\eta,-\eta,\eta,-\eta,\ldots
\]
It does not produce
\[
\eta,\frac\eta2,\frac\eta4,\frac\eta8,\ldots.
\]

Thus the new halving proposal is stronger than the existing closure result. TTI needs a reason why passage through the seam changes the **magnitude** of horizontal residue, not only its orientation.

## 4. Literal downstream weight or population halving

Let a theta carrier have admitted coefficient
\[
a_B=1-g_B.
\]
If every splice at 1 literally halves that admitted coefficient, then after \(n\) returns
\[
a_{B,n}=2^{-n}a_{B,0}\longrightarrow0.
\]
The downstream theta contribution disappears. The resulting completed family does not approach \(\xi\); depending on whether the splice-at-one carrier remains, it approaches a one-carrier completion or the constant \(1/2\).

Population is even less straightforward. Fibonacci cohorts include odd sizes:
\[
1,1,2,3,5,8,\ldots
\]
Repeated literal halving does not remain an integer population. A physical model would need to say whether halving means selection, pairing, expectation weight, amplitude or probability. These choices produce different completions.

Literal weight halving is therefore not compatible with the established cofinal carrier limit.

## 5. Remaining-interval or deficit halving

A coherent interpretation is to halve what is still missing rather than what is already admitted. Let
\[
a_B=1-g_B.
\]
Then
\[
g_{B,n}=2^{-n}g_{B,0},
\qquad
a_{B,n}=1-2^{-n}g_{B,0}.
\]
Equivalently,
\[
a_{B,n+1}=\frac{1+a_{B,n}}2.
\]
This is exactly the map that moves an integration state halfway toward the completed boundary \(a=1\).

It is compatible with the golden carrier construction. If the independent local gap was
\[
g_{B,0}=\varphi^{-(d_B+k_B)},
\]
then repeated returns give
\[
g_{B,n}=2^{-n}\varphi^{-(d_B+k_B)}.
\]
Every fixed carrier still approaches coefficient one, now faster. The entire completion symmetries are unchanged, and the local limit remains \(\xi\).

This establishes an important distinction:
\[
\boxed{
\text{halving the admission deficit is not the same as halving zero displacement.}
}
\]
A bridge from one variable to the other remains to be derived.

## 6. Finite deficit-halving completions

For a numerical diagnostic, the stage number \(N\) was also used as the number of repeated returns through the splice at 1. Every downstream remaining gap received the factor
\[
2^{-N}.
\]
The splice-at-one cohort itself retained its independent golden gap.

The three origin conventions and both clock schedules produced six paths. Their zero counts through height 30 were:

| Origin convention | \(N=14\) | \(N=20\) | \(N=30\) | \(N=40\) |
|---|---:|---:|---:|---:|
| Zeroth seed | 2 | 2 | 4 | 3 |
| Reindexed Fibonacci | 2 | 2 | 4 | 3 |
| Boundary only | 4 | 3 | 3 | 3 |

Every argument-principle total matched the separately bracketed critical-line roots, so no off-line zero was detected in the tested rectangle.

The boundary-only model approaches the first xi ordinates especially rapidly:

| Stage | First critical-line ordinates, chronological schedule |
|---:|---|
| 14 | 14.13475132, 21.02000324, 25.03996467, 29.65146356 |
| 20 | 14.13472516, 21.02203786, 25.01088251 |
| 30 | 14.13472514, 21.02203964, 25.01085760 |
| 40 | 14.13472514, 21.02203964, 25.01085760 |

This rapid numerical stabilization follows from the imposed \(2^{-N}\) deficit factor. It is evidence about the chosen finite completion, not evidence that xi zeros obey the horizontal map \(H\).

## 7. A finite-stage theorem that would be sufficient

There is a second valid route. Suppose the entire finite completions satisfy
\[
\Xi_N\longrightarrow\xi
\]
locally uniformly, and suppose **every** zero \(\rho\) of \(\Xi_N\), at every height, satisfies
\[
\left|\Re\rho-\frac12\right|
\le C2^{-N}
\]
for one fixed \(C\).

Take any zero of \(\xi\). Rouché’s theorem transfers the correct number of nearby zeros from \(\Xi_N\) into a small surrounding disc for sufficiently large \(N\). Since all those approximating zeros lie in a strip shrinking to the critical line, the xi zero must have real part \(1/2\).

Thus a **global all-zero halving strip** for the finite completions would prove RH. But tracking only inherited zeros does not establish that strip.

## 8. The escaping-zero loophole

A finite-stage model can halve every inherited horizontal residue while adding a new quartet
\[
s=\frac12\pm\frac14\pm i\varphi^N.
\]
The new quartet lies above every fixed numerical window for large \(N\), preserves functional and conjugation symmetry and does not alter the local xi limit. Its fixed horizontal displacement violates the inherited bound
\[
\frac14\,2^{-N}.
\]

This does not defeat a genuinely global rule saying that **every** zero halves. It shows why such global coverage must be proved rather than inferred from tracked trajectories or bounded calculations.

## 9. Determination

The proposed rule contains a real proof mechanism, but only in its strongest form:
\[
\boxed{
\xi(\rho)=0
\quad\Longrightarrow\quad
\xi\!\left(
\frac12+rac{\Re\rho-1/2}{2}+i\Im\rho
\right)=0.
}
\]
That implication is RH-equivalent. It cannot be assumed as the explanation of RH without a separate TTI derivation.

Of the other readings:

- literal admitted-weight halving destroys the xi limit;
- literal population halving lacks an integer cohort rule;
- remaining-deficit halving preserves and accelerates the xi limit;
- finite inherited zero halving leaves room for new escaping zeros;
- a global shrinking strip covering every finite-stage zero would suffice.

The next mathematical task is therefore sharply defined: derive a splice-at-one operator and prove either that it preserves the zero set of \(\xi\), or that it places every zero of every finite completion inside one global \(2^{-N}\) strip. Without one of those the halving proposal remains conditional.

No proof of RH is obtained.
