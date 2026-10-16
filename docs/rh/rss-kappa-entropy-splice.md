# Does splice entropy contract the established kappa geometry?

**Twenty-ninth-stage investigation — 15 October 2026**  
**Question:** Can entropy production or strict contraction be derived inside the already-established Rankin \(\kappa_{\rm R}\)-kernel geometry, while the completed \(\xi\) ledger remains invariant?  
**Companion program:** `scripts/research-rss-kappa-entropy-splice.py`  
**Machine-readable results:** `docs/rh/rss-kappa-entropy-splice-results.json`

## Verdict

A natural entropy-producing splice channel can be derived, and the completed \(\xi\) zero ledger is invariant under it. The result does not prove RH because the invariant state is not unique.

The established objects are retained without alteration:
\[
\kappa_{\rm R}=\frac{1}{4\pi^2},
\qquad
K_\kappa(s,t)=\kappa_{\rm R}\zeta(s+\overline t+2),
\qquad
v_s(n)=\sqrt{\kappa_{\rm R}}\,n^{-s-1}.
\]
No new \(K\) or adjustable coupling is introduced.

Put
\[
p=\cos\frac{\pi}{5}=\frac{\varphi}{2},
\qquad
q=1-p,
\qquad
c=p-q=\frac1\varphi.
\]
On the identity/reflection branch label, the golden random-reflection channel is
\[
P=
\begin{pmatrix}
p&q\\
q&p
\end{pmatrix}.
\]
Its eigenvalues are \(1\) and \(c\). It preserves the equal branch distribution and contracts every branch imbalance \(m\) by
\[
m\longmapsto cm.
\]
It also satisfies the strict binary data-processing inequality
\[
D(P\mu\Vert u)
\le c^2D(\mu\Vert u),
\qquad
u_{\rm unif}=
\begin{pmatrix}1/2\\1/2\end{pmatrix},
\]
with equality only at the stationary distribution in the nontrivial finite case. Thus entropy production is real, not metaphorical, once the branch record is coarse-grained.

But the functional equation already gives equal multiplicity to \(+\eta\) and \(-\eta\). Hence the completed zero measure is reflection symmetric and is fixed by \(P\), whether or not \(\eta=0\). Every off-line quartet is another fixed state. The channel removes antisymmetric branch-label information; it does not move the horizontal support.

The established \(K_\kappa\) geometry makes the obstruction sharper. The weighted feature barycentre
\[
pv_\eta+qv_{-\eta}
\]
is not the feature at the contracted coordinate \(v_{c\eta}\). Random reflection can increase the expected raw \(K_\kappa\)-distance from the critical feature on one side of the line, while the equal-pair energy is stationary. Exact coordinate contraction would reduce that distance, but coordinate contraction is precisely the unproved operation.

Entropy therefore supplies a rigorous contraction of branch bias and a rigorous invariant \(\xi\) ledger. It does not supply a unique critical-line invariant state. RH remains open.

---

## 1. The golden binary channel

Represent a distribution on the identity and reflected branches by its bias
\[
\mu_m=
\left(\frac{1+m}{2},\frac{1-m}{2}\right),
\qquad -1\le m\le1.
\]
Multiplication by \(P\) gives
\[
P\mu_m=
\mu_{cm},
\qquad c=\frac1\varphi.
\]
The Shannon entropy in nats is
\[
H(m)
=-\frac{1+m}{2}\log\frac{1+m}{2}
-\frac{1-m}{2}\log\frac{1-m}{2}.
\]
For every nonzero \(m\),
\[
H(cm)>H(m).
\]
Starting from one known branch, \(m=1\), the first splice produces
\[
H(c)
=-p\log p-q\log q
=0.4876451975\ldots\text{ nats}
=0.7035233082\ldots\text{ bits}.
\]

Equivalently, relative entropy to the uniform state is
\[
D(m)=\log2-H(m)
=\frac{1+m}{2}\log(1+m)
+
\frac{1-m}{2}\log(1-m).
\]
The strong contraction
\[
D(cm)\le c^2D(m)
\]
has a short proof. Since
\[
D''(m)=\frac1{1-m^2},
\]
the second derivative of \(c^2D(m)-D(cm)\) is
\[
c^2\left(
\frac1{1-m^2}
-
\frac1{1-c^2m^2}
\right)
\ge0.
\]
The function and its first derivative vanish at zero, proving the inequality by convexity. The calculation stress-tested the ratio on 9,999 biases; its supremum approaches
\[
c^2=0.3819660112\ldots
\]
near equilibrium.

This is the precise sense in which a coarse-grained golden splice causes entropy.

## 2. Why the completed xi ledger is invariant

Let \(R\) be critical-line reflection on an upper zero coordinate:
\[
R(\eta,\gamma)=(-\eta,\gamma).
\]
The functional equation and conjugation imply that the completed zero-counting measure satisfies
\[
R_\#\mu_\xi=\mu_\xi.
\]
Define the random-reflection pushforward
\[
\mathcal S_\#\mu
=p\mu+qR_\#\mu.
\]
Then the requested invariance is immediate:
\[
\boxed{
\mathcal S_\#\mu_\xi=
(p+q)\mu_\xi=
\mu_\xi.
}
\]
This part is proved.

The problem is the fixed-point set:
\[
\mathcal S_\#\mu=
\mu
\quad\Longleftrightarrow\quad
R_\#\mu=
\mu
\]
when \(q>0\). Every reflection-symmetric measure is fixed. In particular,
\[
\frac12\delta_{+\eta}+
\frac12\delta_{-\eta}
\]
is stationary for every \(\eta\), not only for \(\eta=0\).

An off-line quartet therefore begins at zero branch imbalance. Its Shannon branch entropy is already maximal, and the golden channel produces no further entropy at the completed-ledger level. Strict data processing acts only on the antisymmetric sector that the functional equation has already removed.

This proves both sides of the requested statement: the \(\xi\) ledger is invariant, but the invariant state is not uniquely supported on the critical line.

## 3. Entropy inside the established kappa feature space

For
\[
s_\pm=\frac12\pm\eta+i\gamma,
\]
normalise the two existing feature vectors. Their overlap is
\[
r(\eta)
=
\frac{\zeta(3)}
{\sqrt{\zeta(3+2\eta)\zeta(3-2\eta)}}.
\]
Strict log-convexity of \(\zeta(a)\) for \(a>1\) gives
\[
0<r(\eta)<1
\]
for nonzero strip displacement. The overlap is independent of \(\gamma\).

If the reflected feature pair is decohered with equal probabilities, its density matrix has eigenvalues
\[
\lambda_\pm=
\frac{1\pm r(\eta)}{2}.
\]
Its von Neumann entropy is therefore positive off the critical line and zero on it. Representative values are:

| \(|\eta|\) | overlap \(r(\eta)\) | equal-pair entropy, nats |
|---:|---:|---:|
| 0.01 | 0.999966 | 0.000206 |
| 0.10 | 0.996536 | 0.012743 |
| 0.25 | 0.977735 | 0.061143 |
| 0.40 | 0.939828 | 0.135041 |
| 0.49 | 0.905380 | 0.190518 |

This entropy detects horizontal displacement. It still does not force it to vanish. The equal density matrix
\[
\rho_\eta=
\frac12|\widehat v_{s_+}\rangle\langle \widehat v_{s_+}|
+
\frac12|\widehat v_{s_-}\rangle\langle \widehat v_{s_-}|
\]
is stationary under branch swapping for every \(\eta\). Indeed, entropy maximisation within a fixed pair favours the equal mixture, not the merger of its two support points.

If actual coordinate contraction \(\eta\mapsto\eta/\varphi\) were applied, this subsystem entropy would decrease because the feature vectors become less distinguishable. The missing entropy could be exported to an environment, but that again assumes the support-changing map rather than deriving it.

## 4. The kappa distance separates mixing from movement

The squared distance from a feature at horizontal displacement \(\eta\) to the central feature at the same ordinate is
\[
E_\kappa(\eta)
=
\kappa_{\rm R}
\left[
\zeta(3+2\eta)-2\zeta(3+\eta)+\zeta(3)
\right].
\]
Actual coordinate contraction gives
\[
E_\kappa(\eta/\varphi)<E_\kappa(\eta).
\]
Across the tested positive displacements, the ratios ranged from approximately \(0.3842\) to \(0.4787\).

The random-reflection channel does something else. Starting from \(+\eta\), its expected feature distance is
\[
pE_\kappa(\eta)+qE_\kappa(-\eta).
\]
Because the Dirichlet feature weights grow toward the left side of the strip, this quantity exceeded \(E_\kappa(\eta)\) in every tested positive case. The ratios ranged from approximately \(1.0061\) at \(\eta=0.01\) to \(1.7843\) at \(\eta=0.49\). There is no uniform contraction of this natural raw kernel distance.

Nor is feature mixing equal to coordinate movement. The exact nonnegative residual is
\[
\Delta_\kappa(\eta)
=
\left\|
 p v_\eta+qv_{-\eta}-v_{c\eta}
\right\|_\kappa^2.
\]
The program evaluates it directly from zeta values and finds it strictly positive at every nonzero tested displacement. Mode by mode, the failed identity is
\[
pn^{-\eta}+qn^\eta
\ne
n^{-c\eta}.
\]
Thus the golden coordinate barycentre does not commute with the established nonlinear feature embedding.

A further audit shows that normalised \(K_\kappa\) overlaps are not preserved when all horizontal coordinates are reflected. Horizontal reflection is consequently not supplied as one global unitary of this reproducing-kernel Hilbert space. Pairwise branch swapping can be represented on each two-state span, but those separate swaps do not assemble automatically into a single derived global operator.

## 5. Exact two-pass return forbids strict global contraction

The original decimal seam is an involution:
\[
R^2=I.
\]
Suppose a divergence separated states and obeyed a strict global contraction under that same reversible map:
\[
D(Rx,Ry)
\le\lambda D(x,y),
\qquad \lambda<1.
\]
Applying the inequality a second time would give
\[
D(x,y)
=D(R^2x,R^2y)
\le\lambda^2D(x,y),
\]
which is impossible for any pair with positive divergence.

Therefore the exact two-pass state cannot itself produce strict entropy contraction. Entropy production requires coarse-graining, discarded branch records or an environment. On the enlarged state that includes the environment, reversible evolution retains the information. The binary matrix \(P\) is a legitimate visible Markov channel, but it is not the full involutive splice.

## 6. Why data processing cannot bypass the xi-kernel boundary

The previous kernel audit already proves that \(K_\kappa\) feature norms remain bounded at the critical boundary, while \(K_\xi\) diverges near every critical-line zero. No bounded operator can transform the entire first feature family into the second.

A stochastic channel, quantum channel or ordinary data-processing contraction is bounded on its natural normed state space. It therefore cannot perform the unbounded inverse-Green operation used in the exact conversion
\[
K_\kappa
\longrightarrow G_g
\xrightarrow{\mathcal L\otimes\mathcal L}
K_\xi.
\]
The equality of kernels is known. Extending the Gram representation to the critical half-plane still requires global positivity of the arithmetic screw kernel \(G_g\), which is RH-equivalent.

Entropy monotonicity in the smooth positive \(K_\kappa\) channel cannot silently transfer through that unbounded step. A proof would have to control the domain, the prime-power deformation and the boundary flux explicitly.

## 7. The narrower remaining target

The successful part of this attempt is exact:

1. the decimal angle fixes a binary Markov channel with contraction coefficient \(1/\varphi\);
2. Shannon relative entropy contracts by at most \(1/\varphi^2\);
3. decohered reflected features have a computable \(K_\kappa\)-geometric entropy;
4. the completed \(\xi\) ledger is invariant under the channel.

The failed part is equally exact:

1. all reflection-symmetric off-line quartets are fixed;
2. branch mixing does not change \(|\eta|\);
3. feature mixing does not equal the feature at the barycentric coordinate;
4. raw \(K_\kappa\)-distance is not uniformly contracted; and
5. exact two-pass reversibility excludes strict contraction without coarse-graining.

A successful entropy route now needs a support-changing open-system semigroup, derived from splice dynamics, whose unique invariant completed ledger is supported at \(\eta=0\). It must also account for environmental entropy, exclude support entering from infinity and recover the principal completed prime channel. Constructing that object would be a new theorem, not a consequence of branch entropy alone.

The natural entropy channel has now been derived and tested. Its fixed-point set is too large. RH remains open.

**Support-flow follow-up:** [`rss-kappa-natural-gradient-flow.md`](./rss-kappa-natural-gradient-flow.md) uses the normalised feature family to derive \(d\eta/dt=-\eta\). This supplies an actual support-changing semigroup with golden time \(\log\varphi\) and the critical line as unique invariant, while leaving same-\(\xi\) stationarity unproved.
