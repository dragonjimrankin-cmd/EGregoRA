# What if every number above one is entangled with π?

**Twenty-sixth-stage investigation — 15 October 2026**  
**Question:** Can a universal coupling between numbers and \(\pi\) alter the critical-energy, spin–colour, seam or RH obstruction?  
**Companion program:** `scripts/research-rss-universal-pi-coupling.py`  
**Machine-readable results:** `docs/rh/rss-universal-pi-coupling-results.json`

## Verdict

There are two rigorous senses in which every integer above one is already coupled to \(\pi\):

\[
\prod_{n=2}^{\infty}
\left(1-\frac{z^2}{n^2}\right)
=
\frac{\sin(\pi z)}{\pi z(1-z^2)},
\tag{S}
\]

and

\[
\vartheta(x)
=
\sum_{n\in\mathbb Z}e^{-\pi n^2x}
=
x^{-1/2}\vartheta(1/x).
\tag{T}
\]

The sine product packages the complete integer lattice in one order-one entire function. The theta identity couples every integer Gaussian mode to its Fourier-dual mode and is the source of the Riemann completion’s functional symmetry. The existing finite theta models already contain this second universal \(\pi\)-coupling.

Neither identity proves the critical Chebyshev-energy estimate. They belong primarily to the integer lattice and archimedean completion, while the unresolved theorem controls the fluctuating von Mangoldt prime weights. Unit-modulus \(\pi\)-phases preserve positive \(L^2\) energy. A multiplicative logarithmic phase merely shifts \(\zeta\) vertically and leaves the real parts of its zeros unchanged.

Nor does a shared constant constitute quantum entanglement. A state with the same \(\pi\)-register for every number factors into a product state. Genuine entanglement requires number-dependent, non-collinear register states and a declared observable and dynamics.

The spin and colour follow-up fits this distinction. \(\pi\) parametrizes the central \(SU(2)\) and \(SU(3)\) phases, but a scalar singlet trace removes those phases. The missing singlet prime-energy estimate remains.

Thus universal \(\pi\)-coupling is exact and structurally important. It explains lattice completion, Fourier duality, spinorial return phases and the angular seam marker. It does not yet supply prime cancellation, RH or a physical entangling interaction.

---

## 1. First decide what “number” and “entangled” mean

If *number* means every real \(x>1\), then
\[
x\longmapsto\pi x
\]
is simply a reversible rescaling. It creates no discrete arithmetic structure.

If *number* means every integer \(n\ge2\), identities (S) and (T) give canonical, non-arbitrary ways for \(\pi\) to enter all modes simultaneously.

If *entangled* is used in the quantum-mechanical sense, common occurrence is insufficient. Entanglement is a property of a state in a tensor-product Hilbert space: it must fail to factor into one state for the number register and one state for the second register.

The investigation therefore separates four ideas that should not be conflated:

1. common multiplication by \(\pi\);
2. integer-dependent complex phase;
3. analytic coupling through sine or theta duality;
4. nonseparable quantum state.

Only the fourth is quantum entanglement.

## 2. The exact sine lattice for every integer above one

Euler’s/Hadamard’s sine product gives
\[
\frac{\sin(\pi z)}{\pi z}
=
\prod_{n=1}^{\infty}
\left(1-\frac{z^2}{n^2}\right).
\]
Removing the \(n=1\) factor yields (S):
\[
\boxed{
\prod_{n=2}^{\infty}
\left(1-\frac{z^2}{n^2}\right)
=
\frac{\sin(\pi z)}{\pi z(1-z^2)}.
}
\]

Its logarithmic derivative is
\[
\boxed{
\pi\cot(\pi z)-\frac1z+rac{2z}{1-z^2}
=
-2z\sum_{n=2}^{\infty}\frac1{n^2-z^2}.
}
\]

This is a literal global coupling: every integer above one contributes one divisor factor, while \(\pi\) fixes the unique exponential scale of the integer lattice.

### What it does for RH

The sine lattice does not distinguish primes from composites. It carries unit weights at every integer, not von Mangoldt weights \(\Lambda(n)\). Multiplying \(\xi\) by the sine product preserves all existing zeta zeros and adds an infinite integer divisor. It cannot move an off-line zeta zero onto the critical line.

Because the sine product has order one, it is compatible with order-one entire-function theory, but it changes the divisor. The earlier Hadamard-rigidity result therefore applies: it is a new reservoir, not a zero-free correction of the existing completion.

The companion program checks finite products against (S) at real and complex sample points. Those checks verify implementation, not a new theorem.

## 3. The theta coupling is already in the Riemann programme

Define
\[
\vartheta(x)
=
\sum_{n\in\mathbb Z}e^{-\pi n^2x}.
\]
Poisson summation for the self-dual Gaussian gives
\[
\boxed{
\vartheta(x)=x^{-1/2}\vartheta(1/x).
}
\]

Here \(\pi\) is not decorative. With the Fourier convention used in the completion, it is the normalization making the Gaussian its own Fourier transform. Every integer mode \(n\) is paired with the reciprocal-scale theta mode.

The Mellin transform of this identity produces the functional equation of the completed zeta function. The finite golden-delay constructions use precisely the kernels
\[
e^{-\pi n^2x}.
\]
Therefore “every integer is coupled to \(\pi\) through the theta Gaussian” is already an exact premise of the previous work.

### What theta duality earns

It earns:

- the archimedean completion;
- functional symmetry \(s\leftrightarrow1-s\);
- conjugation symmetry;
- rapidly convergent kernel representations; and
- the correct compactification scale for the integer lattice.

It does not earn:

- real-rootedness of every finite theta transform;
- a uniform shrinking strip;
- the critical Chebyshev-energy estimate; or
- control of every nontrivial zeta zero.

Functional symmetry says zeros are reflected. It does not say every zero lies on the reflection axis.

## 4. Five possible π-phase assignments

A phrase such as “attach a \(\pi\)-phase to every number” still leaves the phase law unspecified.

### 4.1 One common phase

If every term receives
\[
e^{i\pi}=-1,
\]
the phase factors out of the sum. It contains no relative arithmetic information.

### 4.2 Parity phase

The assignment
\[
e^{i\pi n}=(-1)^n
\]
separates even and odd integers. It leads to the alternating eta function,
\[
\eta(s)=(1-2^{1-s})\zeta(s).
\]
This removes the zeta pole by a dyadic factor but retains every nontrivial zeta zero and adds the zeros of \(1-2^{1-s}\). It is the same dyadic reservoir already encountered in the completion audit.

### 4.3 Multiplicative logarithmic phase

The completely multiplicative unit phase
\[
n^{i\pi}=e^{i\pi\log n}
\]
gives
\[
\sum_{n\ge1}\frac{n^{i\pi}}{n^s}
=
\zeta(s-i\pi).
\]
This translates the zero set vertically by \(\pi\). It leaves every zero’s real part unchanged and therefore cannot improve RH.

### 4.4 One root of unity per integer

The assignment
\[
e^{2\pi i/n}
\]
associates each integer with its regular-polygon angle. It is unitary but not multiplicative:
\[
e^{2\pi i/(mn)}
e e^{2\pi i/m}e^{2\pi i/n}
\]
in general. Hence it does not preserve the Euler product or the prime ledger.

### 4.5 Irrational additive rotation

Using \(e^{2\pi^2 i n}\) creates an irrational rotation sequence. Such phases can be equidistributed as \(n\) varies, but additive equidistribution is not multiplicative prime cancellation. The untwisted principal channel must still be recovered, and its Chebyshev energy remains the missing theorem.

## 5. Why π-phases do not lower positive energy

For every real phase law \(\phi(n)\),
\[
|e^{i\phi(n)}E_n|^2=|E_n|^2.
\]
Thus unitary phase attachment preserves the Hilbert energy exactly.

Phases can change a scalar sum if terms are recombined before taking the absolute square. But this offers two choices:

1. keep only the twisted sum, in which case the arithmetic target has changed; or
2. retain an untwisted/principal channel, in which case the original critical-energy obstruction remains there.

Averaging over a complete phase family generally invokes Parseval: cross terms disappear, but positive diagonal energies add. Orthogonality organizes the ledger without proving that its principal component is small.

This is the same singlet bottleneck found for spin and colour.

## 6. The archimedean π-sector and the prime sector

The completed function splits as
\[
\xi(s)
=
\underbrace{\left[
\frac12s\pi^{-s/2}\Gamma(s/2)
\right]}_{A_\pi(s)}
\underbrace{\left[(s-1)\zeta(s)\right]}_{C(s)}.
\]

In \(\Re s>1/2\), the archimedean factor \(A_\pi(s)\) is zero-free. It supplies normalization and completion but cannot cancel a zero of \(C(s)\). Consequently:

- a zero-free universal \(\pi\)-factor does not enlarge the analytic disk of \(\log C(s)\);
- a \(\pi\)-factor with zeros adds a new divisor rather than removing the old one; and
- the coefficient radius remains controlled by the nearest mapped nontrivial zeta zero.

The critical Chebyshev-energy theorem acts on the second factor. Universal \(\pi\)-completion of the first factor does not prove that theorem.

## 7. Genuine tensor entanglement with a π-register

Let \(|n\rangle\) label integers. If the same second-register state is assigned to every number, then
\[
\sum_{n\ge2}a_n|n\rangle\otimes|\pi\rangle
=
\left(\sum_{n\ge2}a_n|n\rangle\right)
\otimes|\pi\rangle.
\]
This is a separable product state, not entanglement.

A genuinely entangled candidate would have the form
\[
|\Omega\rangle
=
\sum_{n\ge2}a_n|n\rangle\otimes|\pi;n\rangle,
\]
where the states \(|\pi;n\rangle\) are not all collinear.

That notation alone proves nothing. A physical model must specify:

- the Hilbert space containing the \(\pi\)-register;
- inner products \(\langle\pi;m|\pi;n\rangle\);
- the preparation or Hamiltonian producing \(|\Omega\rangle\);
- the observable that recovers prime weights or splice carriers; and
- why tracing or measuring the register gives the required scalar arithmetic.

If the register states are orthogonal, tracing them removes interference and leaves a positive mixture. If they overlap, their Gram matrix must be derived. Choosing overlaps to force the desired prime cancellation would be circular.

## 8. π, spin and colour centres

The previous spin–colour audit acquires one exact phase interpretation.

For a spinor, a \(2\pi\) spatial rotation acts through the nontrivial central element of \(SU(2)\):
\[
-I_2=e^{i\pi}I_2.
\]
A \(4\pi\) rotation returns the spinor to itself.

The centre of \(SU(3)\) is
\[
\left\{
I_3,
e^{2\pi i/3}I_3,
e^{4\pi i/3}I_3
\right\}.
\]
Thus \(\pi\) parametrizes the central phase geometry of both spin and colour.

But gauge-invariant colour singlets and scalar spin bilinears remove the centre phase. The scalar prime ledger again lands in the singlet channel. These phase identities make the representation proposal compatible with familiar group geometry; they do not derive a prime-to-particle map, local gauge field or entangling interaction.

## 9. π is already in the seam marker

The two-ended seam defect is
\[
\varepsilon(\eta)
=-2\log\cos(\pi\eta).
\]
The critical strip has width one, and the exponential strip map uses \(e^{i\pi(s-1/2)}\). This is why horizontal displacement becomes a dimensionless angle and why the product of endpoint Poisson kernels loses its height dependence.

So \(\pi\) already performs an essential job:
\[
\text{strip displacement}
\longmapsto
\text{coercive angular defect}.
\]
It does not force the angle to be zero. Arithmetic control of \(\eta\) still comes from the same missing critical prime-energy estimate.

## 10. Application to the previous work

| Previous object | Effect of universal π-coupling |
|---|---|
| Critical Chebyshev energy | Unit phases preserve its positive norm; no bound follows |
| Prime–Laguerre radius | Zero-free archimedean factors do not remove zeta singularities |
| Finite theta completions | Already contain \(e^{-\pi n^2x}\) and exact Poisson duality |
| Spin–colour channels | \(\pi\) supplies centre phases; the scalar singlet survives |
| Two-ended seam | \(\pi\) creates the angular, height-independent marker |
| Physical splice | No action, Hamiltonian, scale or entangling mechanism follows |

This separates a real structural insight from an unsupported promotion. The universal \(\pi\)-coupling is not missing from the mathematical construction. What is missing is a theorem converting its self-duality into critical cancellation of the untwisted prime error.

## 11. Determination

The strongest exact statement is
\[
\boxed{
\text{every integer mode is already coupled to }\pi
\text{ through sine and theta self-duality.}
}
\]

That coupling explains integer-lattice entire products, Gaussian Fourier reciprocity, the zeta functional equation, compact group centre phases and the seam’s angular scale.

The remaining implication
\[
\text{universal }\pi\text{-duality}
\stackrel{?}{\Longrightarrow}
\int_X^{2X}|\psi(x)-x|^2dx
\ll_\delta X^{2+\delta}
\]
has not been derived. Sine weights all integers equally; theta completion supplies symmetry; unit phases preserve energy; and a shared \(\pi\)-register is separable.

A valid next step would require a new identity tying theta self-duality or a derived number-dependent \(\pi\)-register directly to the untwisted von Mangoldt pair ledger, with a positive remainder small enough at every scale. No such identity is presently available. RH and the physical interpretation remain open.

## 12. π×π direct-test note

The later [direct \(\pi\times\pi\) tests](./rss-pi-squared-coupling.md) evaluate both natural meanings left open here. Replacing \(\pi\) by \(\pi^2\) breaks scalar theta self-duality, moves the sine lattice away from the integers and makes the strip exponential leave the right half-plane at \(|\eta|=1/(2\pi)\). Pairing two canonical \(\pi\)-channels instead produces doubled zeta multiplicities with unchanged zero locations and coefficient radius.

Finite twisted prime-energy diagnostics were also computed through \(X=262{,}144\). They distinguish the channels but do not prove the all-scale untwisted estimate.

