# Testing π×π coupling directly

**Twenty-seventh-stage investigation — 15 October 2026**  
**Request:** Test the proposed \(\pi\)-coupling rather than stopping at a classification.  
**Companion program:** `scripts/research-rss-pi-squared-coupling.py`  
**Machine-readable results:** `docs/rh/rss-pi-squared-coupling-results.json`

## Verdict

Both natural meanings of \(\pi\times\pi\) were tested:

1. replace the canonical \(\pi\) in the sine, theta, phase or seam formulas by \(\pi^2\);
2. tensor or pair two separately \(\pi\)-normalized channels.

Neither closes the critical-energy estimate.

The direct \(\pi^2\) substitution fails in the two places where \(\pi\) is geometrically rigid. A Gaussian with coefficient \(\pi^2\) is Fourier-dual to a Gaussian with coefficient \(1\), not to itself. The exponential \(e^{i\pi^2(s-1/2)}\) also leaves the right half-plane while still inside the critical strip, so the full-strip seam-to-disk map breaks at
\[
|\eta|>\frac1{2\pi}=0.1591549430\ldots.
\]

Pairing two canonical channels preserves the geometry, but it produces a factor proportional to \(\zeta(s)^2\). Every zero remains in the same location with twice the multiplicity. The generalized Li radius is unchanged.

Finite prime computations were also run through \(X=262{,}144\) for the untwisted error, logarithmic \(\pi\) and \(\pi^2\) twists, and an additive \(e^{i\pi^2n}\) twist. They verify that these are distinct numerical channels. They do not prove an all-\(X\) exponent, and no twisted bound transfers automatically to the untwisted principal channel.

Thus the proposal has now been tested algebraically, geometrically and numerically. It does not prove RH. The tests identify why: canonical \(\pi\) is already the self-dual fixed point, while duplicating it changes multiplicity rather than zero location.

---

## 1. The general Gaussian duality test

For \(a>0\), define
\[
\Theta_a(x)=\sum_{n\in\mathbb Z}e^{-a n^2x}.
\]
Poisson summation gives the exact identity
\[
\boxed{
\Theta_a(x)
=
\sqrt{\frac{\pi}{ax}}
\Theta_{\pi^2/a}(1/x).
}
\tag{P}
\]

The duality involution is
\[
a\longmapsto\frac{\pi^2}{a}.
\]
Its unique positive fixed point solves
\[
a=\frac{\pi^2}{a},
\]
so
\[
\boxed{a=\pi.}
\]

This explains why the Riemann theta kernel uses \(e^{-\pi n^2x}\): \(\pi\), not \(\pi^2\), is the scalar self-dual coefficient.

### Substituting \(a=\pi^2\)

Equation (P) becomes
\[
\boxed{
\Theta_{\pi^2}(x)
=
\frac1{\sqrt{\pi x}}
\Theta_1(1/x).
}
\]

Thus \(\pi^2\) does not produce a new self-dual scalar channel. It produces a two-channel exchange
\[
\pi^2\longleftrightarrow1.
\]

The companion program verifies (P) to better than \(3\times10^{-14}\) at six reciprocal scales. It also directly tests the false same-parameter relation
\[
\Theta_{\pi^2}(x)
\stackrel{?}{=}
x^{-1/2}\Theta_{\pi^2}(1/x).
\]
The residual is not small: it ranges from approximately \(0.28\) to \(1.38\) at the tested scales.

### Mellin consequence

The Mellin transform of \(\Theta_a-1\) contains
\[
a^{-s/2}\Gamma(s/2)\zeta(s)
\]
up to standard factors. Changing \(a\) multiplies the same zeta function by a zero-free exponential scale. Consequently the \(a=1\) and \(a=\pi^2\) channels have the same nontrivial zero set.

The two-channel swap is exact, but it does not move a zero horizontally.

## 2. The π² sine-lattice test

The canonical sine product is
\[
\frac{\sin(\pi z)}{\pi z}
=
\prod_{n=1}^{\infty}
\left(1-\frac{z^2}{n^2}\right),
\]
with zeros at every nonzero integer.

Replacing \(\pi\) by \(\pi^2\) gives
\[
\frac{\sin(\pi^2z)}{\pi^2z}
=
\prod_{n=1}^{\infty}
\left(1-\frac{\pi^2z^2}{n^2}\right).
\]
Its zeros are
\[
z=\frac{n}{\pi},
\]
not the integers.

Therefore \(\pi^2\) does not strengthen the all-integer coupling; it changes the lattice. Restoring zeros at \(z=n\) requires rescaling the argument by \(1/\pi\), which reduces the formula to the original \(\sin(\pi z)\) normalization.

## 3. The π² seam-map test

Write
\[
s=\frac12+\eta+i\gamma.
\]
The canonical strip exponential is
\[
q=e^{i\pi(s-1/2)}.
\]
Its real part is
\[
\Re q=e^{-\pi\gamma}\cos(\pi\eta)>0
\]
throughout
\[
|\eta|<\frac12.
\]
This is why the entire critical strip maps to the right half-plane before the Cayley disk map is applied.

The proposed \(\pi^2\) replacement gives
\[
q_2=e^{i\pi^2(s-1/2)},
\qquad
\Re q_2=e^{-\pi^2\gamma}\cos(\pi^2\eta).
\]
The first sign change occurs when
\[
\pi^2|\eta|=\frac\pi2,
\]
that is,
\[
\boxed{
|\eta|=\frac1{2\pi}.
}
\]

This lies well inside the critical strip. For example,
\[
\cos(0.2\pi^2)<0.
\]
Hence the right-half-plane and Cayley-disk construction no longer covers all possible zeta zeros. The original \(\pi\) is the maximal coefficient compatible with the full width-one strip.

Rescaling \(\eta\) to repair the map again reduces the coefficient to the original \(\pi\).

## 4. Testing two π-normalized channels

A different interpretation is not to replace \(\pi\) by \(\pi^2\), but to couple two canonical \(\pi\)-channels.

### Tensoring identical completed channels

If one scalar channel contributes a completed factor containing \(\zeta(s)\), two identical channels contribute schematically
\[
\zeta(s)\otimes\zeta(s)
\longrightarrow
\zeta(s)^2
\]
at determinant level.

The zeros are unchanged:
\[
\zeta(\rho)=0
\quad\Longrightarrow\quad
\zeta(
ho)^2=0.
\]
Only multiplicity doubles.

For logarithmic coefficients,
\[
p_n\longmapsto2p_n,
\]
and therefore
\[
|2p_n|^{1/n}
=2^{1/n}|p_n|^{1/n}
\longrightarrow|p_n|^{1/n}

\quad\text{at root-test scale}.
\]
The analytic radius does not change.

### Squaring integer phases

For integer \(n\),
\[
(e^{i\pi n})^2=e^{2\pi i n}=1.
\]
Thus two identical parity phases cancel the twist entirely and return the principal channel. This does not generate a new cancellation law.

### The \(1/\pi^2\) Gaussian pair

The exact pair \(a=1\) and \(a=\pi^2\) swaps under reciprocal scale. It can be represented as a two-component theta vector. But each Mellin component contains the same \(\zeta(s)\) multiplied by a different zero-free scale factor. The pair is a doubled completion, not an independent horizontal-zero constraint.

## 5. Direct finite prime-energy diagnostics

The companion program computes von Mangoldt sums through \(2^{19}=524{,}288\) and dyadic diagnostics through
\[
X=2^{18}=262{,}144.
\]
For each channel it records energy divided by \(X^2\).

The channels are:

1. the untwisted Chebyshev error \(\psi(x)-x\);
2. the logarithmic twist \(\sum\Lambda(n)n^{i\pi}\), after subtracting its PNT main integral;
3. the logarithmic twist \(\sum\Lambda(n)n^{i\pi^2}\), similarly centered;
4. the additive twist \(\sum\Lambda(n)e^{i\pi^2n}\), centered by its oscillatory integral.

Representative normalized values are:

| \(X\) | Untwisted | Log-\(\pi\) | Log-\(\pi^2\) | Additive \(\pi^2\) |
|---:|---:|---:|---:|---:|
| 256 | 0.05580 | 0.05420 | 0.11840 | 10.4098 |
| 4,096 | 0.05373 | 0.05499 | 0.11027 | 4.8127 |
| 32,768 | 0.08368 | 0.08954 | 0.19153 | 10.4097 |
| 262,144 | 0.08259 | 0.08639 | 0.17329 | 57.5040 |

These data establish only finite behavior.

The logarithmic twists are vertical translates of the same zeta problem, so comparable finite scales are expected and do not provide an independent theorem. The additive twist is a different arithmetic channel and shows large irregular variation. Even a strong bound for it would not automatically control the untwisted principal channel.

Most importantly, a finite table cannot establish
\[
\forall\delta>0,
\qquad
\int_X^{2X}|\psi(x)-x|^2dx
\ll_\delta X^{2+\delta}
\]
for every \(X\).

## 6. Positive-energy invariance survives π²

For any real number-dependent function \(f(n)\),
\[
|e^{i\pi^2f(n)}E_n|^2=|E_n|^2.
\]
Thus replacing \(\pi\)-phases with \(\pi^2\)-phases does not reduce a positive Hilbert norm. Cancellation can occur only after projecting or summing channels before squaring.

A projection that discards the principal channel no longer proves a theorem about \(\psi(x)-x\). A projection retaining that channel retains its critical-energy obstruction.

## 7. Application to the preceding programme

| Previous object | Direct \(\pi\times\pi\) test |
|---|---|
| Integer sine lattice | \(\pi^2\) moves zeros to \(n/\pi\) |
| Theta completion | \(\pi^2\) pairs with \(1\); only \(\pi\) is scalar self-dual |
| Critical strip seam | \(\pi^2\) exits the right half-plane at \(|\eta|=1/(2\pi)\) |
| Prime–Laguerre controller | Two channels double coefficients, not radius |
| Critical energy | Unit \(\pi^2\)-phases preserve the norm |
| Spin–colour singlet | Duplicated centre phases still disappear under the scalar trace |

The proposal therefore does not reveal a hidden second normalization. It confirms that the first \(\pi\) is already fixed simultaneously by the integer lattice, Gaussian duality and strip width.

## 8. Determination

The direct tests give a sharper conclusion than the previous classification:

\[
\boxed{
\pi\text{ is the self-dual fixed point; }
\pi^2\text{ is a dual-pair parameter, not a stronger self-duality.}
}
\]

And
\[
\boxed{
\text{two canonical }\pi\text{-channels double multiplicity, not analytic reach.}
}
\]

The tested \(\pi\times\pi\) candidates therefore fail for explicit reasons:

- \(\pi^2\) breaks the integer sine lattice;
- \(\pi^2\) breaks scalar theta self-duality;
- \(\pi^2\) breaks the full-strip seam map;
- two \(\pi\) channels retain the same zeta zeros;
- unit phases retain the same positive energy; and
- finite twisted computations do not establish an all-scale principal-channel estimate.

A different number-dependent \(\pi\)-register interaction could still be proposed, but it must specify its kernel and prove exact recovery of the untwisted von Mangoldt ledger. No tested \(\pi\times\pi\) coupling proves critical energy or RH.
