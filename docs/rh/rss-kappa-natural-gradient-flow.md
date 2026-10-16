# A support-changing natural-gradient law from the kappa geometry

**Thirtieth-stage investigation — 15 October 2026**  
**Question:** Can the established \(\kappa_{\rm R}\)-kernel produce a support-changing open-system law whose unique invariant ledger lies on \(\eta=0\)?  
**Companion program:** `scripts/research-rss-kappa-natural-gradient-flow.py`  
**Machine-readable results:** `docs/rh/rss-kappa-natural-gradient-flow-results.json`

## Verdict

Yes: the normalised Rankin feature family supplies a canonical information-geometric candidate,
\[
\boxed{
\frac{d\eta}{dt}=-\eta,
\qquad
\eta(t)=e^{-t}\eta(0).
}
\]
At the decimal-golden time
\[
t_\varphi=\log\varphi,
\]
it gives exactly
\[
\eta(t_\varphi)=\frac{\eta(0)}{\varphi}.
\]
This law changes support, preserves the critical strip, commutes with reflection, retains the ordinate and has \(\eta=0\) as its unique invariant finite-probability ledger.

The construction uses the already-derived kernel
\[
K_\kappa(s,t)
=
\kappa_{\rm R}\zeta(s+\overline t+2),
\qquad
\kappa_{\rm R}=\frac1{4\pi^2}.
\]
It does not insert a new \(K\), potential or horizontal contraction coefficient. The flow is the Fisher-natural gradient of relative entropy between the normalised feature intensity at \(\eta\) and the central feature intensity at \(\eta=0\).

The remaining gap is invariance of the actual completed \(\xi\) ledger. The functional equation proves reflection symmetry, not stationarity under \(\eta\mapsto e^{-t}\eta\). If the finite-height \(\xi\) ledger were invariant under this flow for any positive time, its horizontal second moment would force every zero onto the critical line. Thus same-\(\xi\) invariance is once again the RH-strength premise, not a consequence of the kernel geometry.

The result is therefore a genuine support-changing candidate with the correct unique fixed point and exact golden time, but not a proof that Riemann zeros obey it. RH remains open.

---

## 1. The probability family already inside the Rankin kernel

For
\[
s=\frac12+\eta+i\gamma,
\]
the established feature is
\[
v_s(n)
=
\sqrt{\kappa_{\rm R}}\,n^{-3/2-\eta-i\gamma}.
\]
Its squared norm is
\[
\|v_s\|^2
=
\kappa_{\rm R}\zeta(3+2\eta).
\]
Normalising the feature intensity gives a probability distribution over positive integers:
\[
\boxed{
\pi_\eta(n)
=
\frac{n^{-3-2\eta}}{\zeta(3+2\eta)}.
}
\]
The ordinate phase disappears from the intensity, while the horizontal displacement becomes the natural parameter of a zeta exponential family. The global factor \(\kappa_{\rm R}\) cancels on normalisation; its value remains fixed rather than retuned.

Put
\[
a=3+2\eta,
\qquad
L(a)=\log\zeta(a).
\]
The critical-line member is
\[
\pi_0(n)=\frac{n^{-3}}{\zeta(3)}.
\]
The relative entropy from \(\pi_\eta\) to \(\pi_0\) is
\[
\boxed{
D(\pi_\eta\Vert\pi_0)
=
2\eta L'(3+2\eta)
-L(3+2\eta)+L(3).
}
\]
It is positive away from \(\eta=0\).

## 2. Fisher geometry cancels the nonlinear zeta factor

Differentiation gives
\[
\frac{dD}{d\eta}
=
4\eta L''(3+2\eta).
\]
The Fisher information of the same family is
\[
I(\eta)
=
4L''(3+2\eta)
=
4\operatorname{Var}_{\pi_\eta}(\log n)
>0.
\]
Therefore the Fisher-natural gradient flow is
\[
\frac{d\eta}{dt}
=-I(\eta)^{-1}
\frac{dD}{d\eta}
=-\eta.
\]
The zeta curvature cancels exactly. This cancellation is why the resulting law is linear even though the feature embedding is not.

Along the flow,
\[
\frac{dD}{dt}
=
-4\eta^2L''(3+2\eta)
<0
\]
for every nonzero strip displacement. Relative entropy strictly dissipates until the central distribution is reached.

The companion calculation tested eight displacements from \(-0.49\) to \(+0.49\). Every Fisher metric was positive, every computed velocity agreed with \(-\eta\), and every relative entropy decreased after one golden step.

## 3. The support-changing Markov semigroup

The coordinate solution defines
\[
T_t(\eta,\gamma)
=
(e^{-t}\eta,\gamma).
\]
On probability ledgers its deterministic Markov kernel is
\[
\mathsf K_t
\bigl((\eta,\gamma),d\eta'\,d\gamma'\bigr)
=
\delta_{(e^{-t}\eta,\gamma)}
(d\eta'\,d\gamma').
\]
Its generator is
\[
\mathcal Lf
=-\eta\,\partial_\eta f,
\]
and the corresponding transport equation is
\[
\partial_t\mu_t
=
\partial_\eta(\eta\mu_t).
\]
The maps obey
\[
T_{t+u}=T_t\circ T_u.
\]
They preserve \(|\eta|<1/2\), commute with \(\eta\mapsto-\eta\), keep \(\gamma\) fixed and introduce no unparented support.

At
\[
t_\varphi=
\log\varphi
=0.4812118250\ldots,
\]
one has
\[
e^{-t_\varphi}
=
\frac1\varphi.
\]
Thus the exact golden contraction from the Decimal Splice appears as one distinguished time step of the natural-gradient semigroup.

The overall unit of flow time is the standard unit-mobility convention of natural-gradient descent. The decimal law selects the elapsed step \(\log\varphi\); it does not independently establish that Riemann zeros evolve in this auxiliary time.

## 4. The critical line is the unique invariant probability ledger

Let \(\mu\) be a finite probability ledger with finite horizontal second moment. If, for some \(t>0\),
\[
(T_t)_\#\mu=
\mu,
\]
then
\[
\int\eta^2\,d\mu
=
\int e^{-2t}\eta^2\,d\mu.
\]
Since \(e^{-2t}<1\),
\[
\int\eta^2\,d\mu=0.
\]
Consequently
\[
\boxed{
\mu\text{ is supported on }\eta=0.
}
\]
This proves uniqueness of the invariant finite-probability ledger.

The nontrivial zero measure is infinite globally, but every finite-height zero ledger is finite. Because the flow preserves \(\gamma\), one can normalise the zeros below any height \(T\) and apply the same argument. Invariance of all these finite ledgers would put every represented zero on the line.

This is exactly the fixed-point mechanism sought in the previous stage. It is also why ledger invariance cannot be declared without proof: for the actual \(\xi\) ledger, it would establish RH immediately.

## 5. Why the functional equation does not provide stationarity

The functional equation gives
\[
\eta\longleftrightarrow-\eta.
\]
It proves reflection symmetry of the zero ledger. The new semigroup instead gives
\[
\eta\longmapsto e^{-t}\eta.
\]
These are different actions. Reflection preserves the magnitude of displacement; the natural-gradient flow changes it.

For one quartet, the centred polynomial is
\[
P_{\eta,\gamma}(z)
=
 z^4+2(\gamma^2-\eta^2)z^2
+(\eta^2+\gamma^2)^2.
\]
Replacing \(\eta\) by \(e^{-t}\eta\) changes its coefficients unless \(\eta=0\). The flow therefore produces a different completed entire function when an off-line quartet is present.

The map is also horizontal-only and hence nonholomorphic as a map of \(s\). That is acceptable for a classical open-system transport on zero coordinates, but it prevents ordinary holomorphic reparameterisation from supplying same-function invariance.

No principal von Mangoldt identity has been shown stationary under this flow. The exact \(K_\xi\) transform and the arithmetic screw kernel still leave that prime-side statement at the RH-equivalent boundary.

## 6. Can the flow lift to one quantum channel on the feature states?

A stronger construction would be one completely positive trace-preserving map taking every normalised pure feature state \(|\widehat v_\eta\rangle\) to \(|\widehat v_{c\eta}\rangle\).

For a pure-state transformation of this type, the input and output Gram matrices must admit an environment correlation factor. On any finite family, the quotient
\[
Q_{ij}
=
\frac{
\langle\widehat v_{\eta_i},
\widehat v_{\eta_j}\rangle}
{
\langle\widehat v_{c\eta_i},
\widehat v_{c\eta_j}\rangle}
\]
must be positive semidefinite.

The calculation tested
\[
\{-0.4,-0.2,0,0.2,0.4\}.
\]
The quotient matrix had an LDL pivot of approximately
\[
-3.94\times10^{-7}.
\]
This is a finite numerical obstruction to an exact global pure-state lift. It is not a directed-rounding impossibility theorem, but it shows that the classical parameter flow should not be silently promoted to a linear quantum channel on the whole existing feature space.

A measurement-and-repreparation construction would face the related problem that the feature states at different \(\eta\) are nonorthogonal, so their parameter cannot be read perfectly without disturbance.

## 7. Open-system accounting

The deterministic transport compresses a distribution of horizontal coordinates. Its differential entropy decreases under scaling. If the law is physically irreversible, the missing information must be exported to an environment; the total enlarged evolution need not lose information.

Adding ordinary diffusion would change the fixed point. An Ornstein–Uhlenbeck equation with nonzero additive noise has a Gaussian stationary width rather than a delta function at \(\eta=0\), and unrestricted noise can approach the strip boundary. The unique critical-line invariant therefore belongs to the zero-noise support transport, or to a more carefully derived noise law that vanishes strongly enough at the centre.

The remaining completion must do four things:

1. derive the natural-gradient transport from the physical splice rather than select it only because it is canonical in information geometry;
2. prove stationarity of the completed \(\xi\) ledger or an equivalent principal-prime functional;
3. lift the flow to a controlled family of completed functions or provide a justified open-system replacement; and
4. retain the no-birth property at unbounded height.

A support-changing law with the desired unique fixed point has now been found. Its action on the same Riemann \(\xi\) function has not. RH remains open.

**Stationarity follow-up:** [`rss-xi-ledger-stationarity.md`](./rss-xi-ledger-stationarity.md) proves that stationarity for one positive time, weak quadratic stationarity and zero variation of the convergent horizontal residue are all RH-equivalent. Functional symmetry and central normalisation do not supply them.

**Prime-channel follow-up:** [`rss-prime-channel-contraction-no-go.md`](./rss-prime-channel-contraction-no-go.md) proves that no single parameter-independent Markov kernel on prime powers realizes the contraction across an open family of feature states. This removes one natural channel lift, not every possible same-\(\xi\) arithmetic identity.
