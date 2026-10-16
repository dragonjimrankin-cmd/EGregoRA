# Relational synchronisation and the combined RH analogies

**Thirty-sixth-stage investigation — 15 October 2026**  
**Question:** Can proximity to other beings, combined with the earlier \(\pi\)-register, Fibonacci-cohort, entropy, halving, natural-gradient, phase-defect and negative-index analogies, affect RH?  
**Companion program:** `scripts/research-rss-relational-synchronisation-combinations.py`  
**Machine-readable results:** `docs/rh/rss-relational-synchronisation-combinations-results.json`

## Verdict

The analogies can be combined into a coherent **relational consensus model**, but the combined model still does not prove RH.

The constructive result is real. Attractive proximity coupling, Fibonacci cohort weights and the squared splice Gram kernel produce a connected positive graph Laplacian. Its consensus energy decreases, and a reflection-balanced horizontal toy ledger approaches the critical line. For one reflected pair, the consensus equation is exactly the previously derived support contraction after a change of clock:
\[
\eta_+(t)=\eta_0e^{-2Jt},
\qquad
\eta_-(t)=-\eta_0e^{-2Jt}.
\]
At \(t=\log\varphi/(2J)\), the displacement is divided by \(\varphi\); at \(t=\log2/(2J)\), it is halved.

The obstruction is also exact. Circular phase, branch bias and horizontal zero displacement are different state variables. Perfect phase synchrony and maximal reflection balance can coexist with a nonzero horizontal displacement:
\[
q=\tan\frac{\theta_1-\theta_2}{2}=0,
\qquad
m=0,
\qquad
\eta=\frac14.
\]
For the audited quartet at \(\gamma=15\), this state still has
\[
\mathcal D_2
=2.1487184769922357\ldots\times10^{-5}>0
\]
and two negative squares. Synchronising beings or phases therefore does not by itself synchronise a zeta zero with the critical line.

Every non-empty combination of seven declared mechanisms was tested: \(127\) combinations in total. The exhaustive classification is:

| Combination class | Count | Result |
|---|---:|---|
| Same-divisor, horizontal-support-inert | 15 | Preserves the quartet but leaves \(\eta\) unchanged. |
| Finite support contraction | 48 | Lowers \(|\eta|\) and the defect, but changes the quartet polynomial. |
| Mirror-barycentre projection | 64 | Places the transformed support on the line, but replaces the original divisor. |
| Valid proofs of RH | **0** | Same-\(\xi\)/principal-prime invariance remains missing. |

Thus combination does not remove the earlier boundary:
\[
\boxed{
\text{same }\xi
\;\Longrightarrow\;
\text{tested combinations do not move horizontal support},
}
\]
while
\[
\boxed{
\text{horizontal support moves}
\;\Longrightarrow\;
\text{the off-line quartet factor changes}.
}
\]
RH remains open.

---

## 1. Keep the three phase-like variables separate

The combined audit uses
\[
(q,m,\eta),
\]
where
\[
q=\tan\frac{\delta}{2},
\qquad
\delta=\theta_1-\theta_2,
\]
is a circular relative phase,
\[
m=\Pr(+)-\Pr(-)
\]
is reflection-branch imbalance, and
\[
\eta=\Re\rho-\frac12
\]
is horizontal zero displacement.

The earlier analogies act on different coordinates:

| Earlier mechanism | Coordinate acted on |
|---|---|
| Proximity/Kuramoto entrainment | \(q\) |
| Common \(\pi\) register | common phase, not \(q\) |
| Golden reflection entropy | \(m\) |
| Fibonacci catch-up clock | schedule only |
| Kappa natural-gradient flow | \(\eta\) |
| Repeated halving | \(\eta\), if promoted to coordinate movement |
| Mirror barycentre | projection of \(\pm\eta\) to zero |
| Prime-phase defect | detects \(\eta\ne0\) |
| Negative-square census | quantises reflected off-line support |

A common \(\pi\) shift gives
\[
(\theta_1,\theta_2)
\longmapsto
(\theta_1+\pi,\theta_2+\pi)
\]
and leaves \(\delta\) exactly unchanged. The golden branch channel sends \(m\mapsto m/\varphi\), but a completed off-line quartet already has \(m=0\). Neither operation changes \(\eta\).

This sector separation supplies an explicit combined counterexample. Set \(q=m=0\) and retain any \(\eta\ne0\). The state is perfectly phase locked and branch balanced but still violates RH if it represents a zeta zero. A new cross-sector law must therefore be derived; verbal identification of the three uses of “phase” is insufficient.

## 2. Two-being proximity locking

For two oscillators,
\[
\dot\delta
=\Delta\omega-2J(r)\sin\delta.
\]
A stable locked phase exists exactly when
\[
|\Delta\omega|\le2J(r).
\]
The audit used
\[
\Delta\omega=\frac12,
\qquad
J(r)=e^{-r}.
\]
The critical distance is therefore
\[
r_c=\log4=1.3862943611\ldots.
\]
The direct tests agree:

| \(r\) | \(J(r)\) | Locked? |
|---:|---:|:---:|
| 0.5 | 0.606531 | yes |
| 1.0 | 0.367879 | yes |
| 1.5 | 0.223130 | no |
| 2.0 | 0.135335 | no |

For identical intrinsic frequencies, the half-angle coordinate obeys the exact linear law
\[
q(t)=q(0)e^{-2Jt}.
\]
At the normalisation \(J=1/2\), the proximity and natural-gradient clocks align:
\[
q(t)=q(0)e^{-t},
\qquad
\eta(t)=\eta(0)e^{-t}.
\]
Consequently both shrink by \(1/\varphi\) at \(t=\log\varphi\), and both halve at \(t=\log2\).

This is a precise compatibility between the analogies. It is not an identification theorem. The value \(J=1/2\) is a selected mobility normalisation, and equality of two decay factors does not identify circular phase with horizontal zero support.

## 3. Relational horizontal consensus

The strongest possible RH interpretation of “other beings bring one another back into phase” is to let reflected horizontal coordinates interact directly:
\[
\dot\eta_+
=-J(\eta_+-\eta_-),
\qquad
\dot\eta_-
=-J(\eta_--\eta_+).
\]
If \(\eta_-(0)=-\eta_+(0)=-\eta_0\), then
\[
\eta_+(t)=\eta_0e^{-2Jt},
\qquad
\eta_-(t)=-\eta_0e^{-2Jt}.
\]
So reflected proximity consensus exactly reproduces golden contraction and halving at the corresponding times.

This observation improves the analogy: the natural-gradient support flow can be read as a two-agent consensus law. But it also makes the old obstruction unavoidable. For every finite \(t\),
\[
\eta_0\ne0
\quad\Longrightarrow\quad
\eta_0e^{-2Jt}\ne0.
\]
There is no finite collision with the critical line. More importantly, the centered quartet factor
\[
Q_{\eta,\gamma}(z)
=z^4+2(\gamma^2-\eta^2)z^2+(\eta^2+\gamma^2)^2
\]
changes whenever \(\eta\) changes. Relational consensus is therefore another derivation of the auxiliary support flow, not a proof that the actual \(\xi\) divisor follows it.

## 4. Fibonacci cohorts plus the splice kernel

The splice-to-action audit supplied the positive-semidefinite kernel
\[
K(u,v)=
\sum_{n=0}^{7}F_{n+1}
\cos\left(\frac{2\pi(n+1)}{\log10}(u-v)\right),
\]
with cohort deposits
\[
1,1,2,3,5,8,13,21.
\]
Positive semidefiniteness does not imply that every pointwise value \(K(u,v)\) is positive. Directly using \(K\) as a Kuramoto edge could therefore introduce repulsive links. The combined audit uses
\[
J_{ab}
=e^{-r_{ab}}
\frac{
\sqrt{F_aF_b}}{21}
\left(
\frac{K(u_a,u_b)}{K(0,0)}
\right)^2
\ge0,
\]
with direct positive edges between each cohort and its reflected partner.

This creates a sixteen-node graph: eight Fibonacci cohorts and eight reflected partners. Its Laplacian satisfies
\[
x^TLx
=
\sum_{a<b}J_{ab}(x_a-x_b)^2
\ge0.
\]
The numerical checks found:

- row-sum error \(1.12\times10^{-16}\);
- smallest eigenvalue \(-2.52\times10^{-17}\), numerical zero;
- spectral gap \(0.0171863\ldots>0\), proving numerical connectivity;
- all remaining eigenvalues positive;
- zero mean horizontal displacement retained to numerical precision;
- coherence energy falling from \(0.2443875\) initially to \(0.1787806\) at \(t=1\) and \(0.0206900\) at \(t=10\);
- nonzero horizontal state still present at finite \(t=10\).

Thus the combined Fibonacci/splice/proximity construction is a valid positive consensus model. The squared kernel and edge normalisation are not uniquely selected by the splice sequence, however, and no evidence shows that people or zeta zeros interact through this graph.

## 5. What happens to the RH detectors

For the control quartet
\[
\eta=\frac14,
\qquad
\gamma=15,
\]
the tested combinations give:

| Operation | Final \(|\eta|\) | Quartet phase defect | Negative squares |
|---|---:|---:|---:|
| Perfect circular-phase lock only | 0.25 | \(2.1487185\times10^{-5}\) | 2 |
| Golden support contraction | 0.1545085 | \(8.2096377\times10^{-6}\) | 2 |
| Halving support contraction | 0.125 | \(5.3735941\times10^{-6}\) | 2 |
| Golden plus halving | 0.0772542 | \(2.0526718\times10^{-6}\) | 2 |
| Exact barycentre projection | 0 | 0 | 0 |

The scalar defect decreases continuously and can become arbitrarily small. The negative index remains exactly two at every nonzero displacement and changes only at the singular collision. The two diagnostics therefore retain their complementary roles under the combined model:

- the phase defect measures magnitude but has no positive uniform gap;
- the negative index detects an off-line mirror cycle but supplies no arithmetic exclusion theorem.

At \(\gamma=10^6\), the same displacement \(\eta=1/4\) has defect approximately
\[
1.1250\times10^{-24},
\]
while the negative index is still two. Proximity and finite-window tests do not remove the high-ordinate escape obstruction.

## 6. Exhaustive mechanism census

The companion program applies every non-empty subset of:

1. proximity phase locking;
2. a common \(\pi\) register;
3. golden branch entropy;
4. a Fibonacci catch-up clock;
5. golden horizontal support flow;
6. horizontal halving;
7. mirror-barycentre projection.

The maps commute in the declared product model because they act on \(q\), \(m\), \(\eta\), or the schedule separately. Their \(127\) combinations divide exhaustively into the three classes in the verdict.

Adding a cross-law such as
\[
\dot\eta=-\lambda R\eta,
\]
where \(R\) is collective phase coherence, does not evade the classification. If \(R>0\), it is another support-changing flow. It can lower \(|\eta|\), but it still changes the quartet polynomial. If the flow is required to preserve the same \(\xi\), its stationarity condition is the missing theorem.

Likewise, adding an index gate or defect feedback can change the speed without changing the logical issue. A law such as
\[
\dot\eta=-\lambda\mathcal D_2(\eta,\gamma)\eta
\]
approaches the line but does not independently establish that the actual divisor evolves, nor does it identify the moved canonical product with the fixed Euler product.

## 7. The conditional closure remains exact

Suppose any combined mechanism produces a strict horizontal factor
\[
\eta\mapsto c\eta,
\qquad 0<c<1.
\]
Then the horizontal second moment obeys
\[
M_2\mapsto c^2M_2.
\]
If the actual completed zero ledger were invariant under this map, then
\[
M_2=c^2M_2
\quad\Longrightarrow\quad
M_2=0,
\]
and RH would follow.

The same conclusion appears in the prime anchor. Conservation of
\[
\frac{\xi_t'}{\xi_t}(2)
\]
under a strict horizontal consensus flow would force the positive first variation to vanish and hence exclude every off-line quartet. But the transported divisor has not been proved to retain
\[
\frac{\xi'}{
\xi}(2)
=
\frac32-
\frac{\gamma_E+\log\pi}{2}
-
\sum_{n\ge2}\frac{\Lambda(n)}{n^2}.
\]
The primes on the right describe the original \(\xi\), not an arbitrarily synchronised divisor.

## 8. Evidence boundary

Established here:

- the exact two-oscillator locking threshold;
- the golden and halving clock alignments;
- the equivalence between reflected two-agent consensus and exponential horizontal contraction;
- a connected positive Fibonacci/splice/proximity graph;
- strict decay of its toy coherence energy;
- the exhaustive \(127\)-combination sector census;
- an explicit state with perfect phase synchrony and branch balance but a positive RH defect.

Not established:

- that biological beings couple through the splice kernel;
- that consciousness supplies a zeta-zero interaction;
- that zeta zeros undergo a physical or auxiliary proximity flow;
- that a moved divisor preserves the Euler product or the same completed \(\xi\);
- RH.

## Final status

The proximity idea does strengthen the TTI dynamical picture. It supplies a relational interpretation of the natural-gradient contraction and permits a positive cohort-weighted consensus network. Several earlier analogies genuinely align at the level of their decay clocks.

They do not align at the level required by RH. Circular synchrony, branch entropy and horizontal support are different sectors; support movement changes the divisor; and requiring the moved support to represent the same \(\xi\) is RH-equivalent.

\[
\boxed{
\text{The analogies combine coherently, but no tested combination proves RH.}
}
\]

**Defect-transport follow-up:** [`rss-relational-defect-transport.md`](./rss-relational-defect-transport.md) tests what happens when one participant reaches coherence while a closed prime-anchor ledger is conserved. The obstruction is transferred to another quartet or exported to an environment; finitely many scalar anchors can also be counterfeited by collective divisor motion.
