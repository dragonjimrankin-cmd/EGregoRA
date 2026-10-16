# From splice deposits to a mathematical action

**Constructive map and nonuniqueness audit — 15 October 2026**  
**Companion program:** `scripts/research-splice-to-action-map.py`  
**Machine-readable results:** `docs/splice-to-action-map-results.json`

## Verdict

A precise splice-to-kernel-to-action family has been constructed:
\[
\{\delta\Pi_n\}
\longrightarrow
K(u,v)
\longrightarrow
S_E[\chi;g].
\]
The finite kernel is positive semidefinite by an exact feature-map theorem. The corresponding Euclidean quadratic action is diffeomorphism-covariant when the kernel is expressed through spectral functional calculus of the Laplace--Beltrami operator.

This does not derive a unique physical action. Two explicit, inequivalent and positive form factors satisfy the same splice data, covariance and Euclidean stability requirements. Their coexistence proves that those requirements do not select one action. The splice sequence also remains dimensionless and therefore cannot determine its own physical length scale.

The accomplished result is a mathematically legitimate candidate family and a nonuniqueness theorem. Lorentzian causality, field content, interactions and the normalisations of \(G\), electric charge, \(\alpha_{\rm EM}\) and \(r_0\) remain open.

---

## 1. Fibonacci cohort data

The tested cohort deposits are
\[
\delta\Pi_n=1,1,2,3,5,8,13,21,
\]
with cumulative populations
\[
1,2,4,7,12,20,33,54.
\]
These are the already established Fibonacci cohort increments behind the splice population ledger. Their key mathematical property for the present construction is
\[
\delta\Pi_n\ge0.
\]

Associate the decimal log-frequencies
\[
\omega_n=\frac{2\pi(n+1)}{\log 10},
\qquad n=0,\ldots,7.
\]
The base-ten choice is internal to this candidate and is not presented as an empirical derivation of a physical frequency.

## 2. Exact positive kernel

Define
\[
\boxed{
K_N(u,v)
=
\sum_{n=0}^{N}
\delta\Pi_n
\cos\bigl(\omega_n(u-v)\bigr).
}
\]
Introduce the real two-component feature
\[
\Phi_n(u)
=
\sqrt{\delta\Pi_n}
\begin{pmatrix}
\cos(\omega_nu)\\
\sin(\omega_nu)
\end{pmatrix}.
\]
Then
\[
K_N(u,v)
=
\sum_n\langle\Phi_n(u),\Phi_n(v)\rangle.
\]
For arbitrary real points \(u_j\) and coefficients \(c_j\),
\[
\begin{aligned}
\sum_{j,k}c_jc_kK_N(u_j,u_k)
={}&
\sum_n\delta\Pi_n
\left(\sum_jc_j\cos(\omega_nu_j)\right)^2\\
&+
\sum_n\delta\Pi_n
\left(\sum_jc_j\sin(\omega_nu_j)\right)^2\\
\ge{}&0.
\end{aligned}
\]
Therefore
\[
\boxed{K_N\succeq0}
\]
for every finite set of points. This is an exact Gram theorem, not a numerical positivity claim. The companion program evaluates three nontrivial finite quadratic forms as regression diagnostics.

The construction supplies a valid stationary kernel on logarithmic splice coordinate space. It does not by itself identify that coordinate with physical time, distance or energy.

## 3. Covariant Euclidean action family

Let \((M,g)\) be a Riemannian manifold and let \(-\Delta_g\) be its nonnegative scalar Laplace--Beltrami operator. Introduce an independent length \(\ell_*\). For any nonnegative spectral form factor \(F(z)\), define
\[
\boxed{
S_E[\chi;g]
=
\frac12
\int_M\sqrt g\,
\chi\,
F\!\left(\ell_*^2(-\Delta_g)\right)
\chi\,d^dx.
}
\]
The operator is defined through spectral functional calculus. Because \(\Delta_g\) is geometrically defined, the quadratic form is diffeomorphism-covariant. If \(F(z)\ge0\) for \(z\ge0\), the Euclidean quadratic action is nonnegative on its spectral domain.

Use the decimal scale parameters
\[
r_n=10^{-n},
\qquad n=0,
\ldots,7.
\]
Two admissible form factors are
\[
\boxed{
F_A(z)
=z+
\sum_n\delta\Pi_n
\left(1-e^{-r_nz}\right)
}
\]
and
\[
\boxed{
F_B(z)
=z+
\sum_n\delta\Pi_n
\frac{r_nz}{1+r_nz}.
}
\]
For \(z\ge0\), every summand in both expressions is nonnegative. Hence
\[
F_A(z)\ge0,
\qquad
F_B(z)
\ge0.
\]
Both actions are Euclidean-stable quadratic candidates built from the same cohort weights and decimal scales.

## 4. Exact nonuniqueness result

The two functions are not equal. For example, at \(z=1\), the finite construction gives approximately
\[
F_A(1)=1.7507770484,
\qquad
F_B(1)=1.6143031233.
\]
Therefore the same data satisfy

- the same Fibonacci deposit ledger;
- the same decimal scale assignment;
- nonnegative Euclidean spectral weight;
- diffeomorphism covariance;
- the same local leading term \(z\);

while producing different actions.

Consequently,
\[
\boxed{
\text{splice data + covariance + Euclidean positivity}
\not\Longrightarrow
\text{a unique action}.
}
\]
This is the principal result of the construction. It replaces the earlier absence of a map with an explicit family while proving that an additional physical selection principle is unavoidable.

Infinitely many further positive form factors can be built from the same data. The two displayed forms are enough to establish nonuniqueness.

## 5. The independent scale remains explicit

The argument of the form factor is
\[
z=\ell_*^2\lambda,
\]
where \(\lambda\) is an eigenvalue of \(-\Delta_g\). The splice sequence and decimal ratios are dimensionless. They do not determine \(\ell_*\).

Changing
\[
\ell_*\mapsto a\ell_*
\]
produces a different physical spectrum without altering any Fibonacci or decimal identity. Thus a measured or independently derived scale is still required before the action predicts a dimensional quantity.

This blocks derivations of

- Newton's constant from the sequence alone;
- an absolute particle mass;
- a galactic length \(r_0\);
- an electromagnetic coupling normalisation.

The scale has not been hidden inside a convention; it is shown explicitly as an unresolved input.

## 6. Lorentzian continuation is not automatic

Euclidean positivity does not prove Lorentzian causality or unitarity. Replacing \(-\Delta_g\) by a Lorentzian d'Alembertian requires choices of:

- contour and boundary conditions;
- retarded, advanced or Feynman prescription;
- treatment of nonlocal memory kernels;
- spectral branch structure;
- initial-value data;
- ghost and pole conditions.

Neither \(F_A\) nor \(F_B\) is promoted here as a physical Lorentzian theory. They are covariant Euclidean candidates. A successful physical continuation must show either ordinary causal evolution or explicitly declare and test a controlled nonlocal alternative.

## 7. Field content and interactions

The scalar construction does not determine whether the underlying TTI field should be

- scalar;
- tensorial;
- spinorial;
- gauge-valued;
- a collective density;
- an open-system state.

Nor does a positive quadratic kernel determine cubic and higher interactions. A complete action would need
\[
S=S_2+S_3+S_4+\cdots
\]
with a stated symmetry and conservation law. The splice deposits currently constrain only a candidate quadratic spectral measure.

The earlier \(SU(2)\times SU(3)\) analysis remains relevant: introducing internal states does not automatically determine their gauge coupling or remove the scalar singlet channel.

## 8. What has and has not been derived

### Derived

1. An explicit map from Fibonacci deposits to a decimal log-frequency kernel.
2. An exact proof that the finite kernel is positive semidefinite.
3. A covariant Euclidean spectral-action family.
4. Two explicit positive form factors using the same splice data.
5. A proof that the current principles do not select a unique action.
6. An explicit display of the independent dimensional scale.

### Not derived

1. A unique action.
2. Lorentzian causality or unitarity.
3. A preferred field representation.
4. Interaction vertices.
5. Newton's constant.
6. Electric charge or \(\alpha_{\rm EM}\).
7. A physical reference radius \(r_0\).
8. Empirical confirmation of the decimal spectrum.

## 9. Next physical promotion gate

A candidate action should be promoted only after one additional principle distinguishes it from the alternatives. Possible principles include:

- a declared semigroup or Markov composition law;
- reflection positivity strong enough for reconstruction;
- a causal Lorentzian spectral representation;
- a local auxiliary-field realization;
- a conservation law tied to the splice genealogy;
- an independently specified empirical observable that selects the form factor without fitting it retrospectively.

Until such a principle is supplied, the correct conclusion is:
\[
\boxed{
\text{a positive splice action family exists, but the physical action is not unique.}
}
\]

**Relational-combination follow-up:** [`rh/rss-relational-synchronisation-combinations.md`](./rh/rss-relational-synchronisation-combinations.md) squares the normalized Gram kernel to build an explicitly attractive Fibonacci/proximity consensus graph. It verifies positive graph energy and clock compatibility while retaining the nonuniqueness and same-divisor obstructions.
