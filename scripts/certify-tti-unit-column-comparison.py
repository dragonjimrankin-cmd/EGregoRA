#!/usr/bin/env python3
"""Rational-interval comparison of normalized M=4 TTI coefficient bases.

This certifies a coarse conditioning separation for the coefficient maps only;
it says nothing about positivity of the Weil form.
"""
from fractions import Fraction as F
from math import isqrt

Interval = tuple[F, F]


def add(a: Interval, b: Interval) -> Interval:
    return a[0] + b[0], a[1] + b[1]


def neg(a: Interval) -> Interval:
    return -a[1], -a[0]


def sub(a: Interval, b: Interval) -> Interval:
    return add(a, neg(b))


def mul(a: Interval, b: Interval) -> Interval:
    p = (a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1])
    return min(p), max(p)


def div(a: Interval, b: Interval) -> Interval:
    assert b[0] * b[1] > 0, "denominator interval must exclude zero"
    recips = (1 / b[0], 1 / b[1])
    return mul(a, (min(recips), max(recips)))


def scale(a: Interval, x: F | int) -> Interval:
    return mul(a, (F(x), F(x)))


def power(a: Interval, n: int) -> Interval:
    if n == 0:
        return F(1), F(1)
    if n % 2 == 0 and a[0] <= 0 <= a[1]:
        return F(0), max(a[0] ** n, a[1] ** n)
    p = (a[0] ** n, a[1] ** n)
    return min(p), max(p)


def sqrt_lower(x: F, scale_digits: int = 30) -> F:
    assert x >= 0
    scale_n = 10**scale_digits
    k = isqrt((x.numerator * scale_n**2) // x.denominator)
    return F(k, scale_n)


def sqrt_upper(x: F, scale_digits: int = 30) -> F:
    lo = sqrt_lower(x, scale_digits)
    return lo if lo * lo == x else lo + F(1, 10**scale_digits)


def sqrt_interval(x: Interval) -> Interval:
    assert x[0] >= 0
    return sqrt_lower(x[0]), sqrt_upper(x[1])


def abs_upper(x: Interval) -> F:
    return max(abs(x[0]), abs(x[1]))


def fibs(n: int) -> list[int]:
    f = [0, 1]
    for _ in range(2, n + 1):
        f.append(f[-1] + f[-2])
    return f


def build_bases() -> tuple[list[list[Interval]], list[list[Interval]]]:
    # Rational enclosure; the endpoint squares strictly bracket 5.
    sqrt5 = (F(2236067977499789696, 10**18), F(2236067977499789697, 10**18))
    assert sqrt5[0] ** 2 < 5 < sqrt5[1] ** 2
    r = scale(sub(sqrt5, (F(1), F(1))), F(1, 2))
    d = [(F(0), F(0))]
    f = fibs(8)
    for n in range(1, 5):
        d.append(scale(power(r, n), f[n + 2] - 1))

    mmax = 4
    prefix = [[(F(0), F(0)) for _ in range(mmax)] for _ in range(mmax)]
    for m in range(1, mmax + 1):
        for k in range(m):
            corr = (F(0), F(0))
            for n in range(1, m - k + 1):
                corr = add(corr, mul(d[n + k], d[n]))
            prefix[k][m - 1] = corr if k == 0 else scale(corr, 2)

    curvature = [[prefix[i][j] for j in range(mmax)] for i in range(mmax)]
    for m in range(3, mmax + 1):
        col = m - 1
        for k in range(m):
            curvature[k][col] = add(
                sub(prefix[k][col], scale(prefix[k][col - 1], 2)),
                prefix[k][col - 2],
            )
    return prefix, curvature


def normalized_gram(basis: list[list[Interval]]) -> list[list[Interval]]:
    n = len(basis)
    norms = []
    for j in range(n):
        squared = (F(0), F(0))
        for i in range(n):
            squared = add(squared, power(basis[i][j], 2))
        norms.append(sqrt_interval(squared))
    gram = [[(F(0), F(0)) for _ in range(n)] for _ in range(n)]
    for i in range(n):
        for j in range(n):
            dot = (F(0), F(0))
            for k in range(n):
                dot = add(dot, mul(basis[k][i], basis[k][j]))
            gram[i][j] = div(dot, mul(norms[i], norms[j]))
    return gram


def ldlt_positive_pivots(a: list[list[Interval]]) -> list[F]:
    """Interval no-pivot LDL^T; positive lower pivot bounds certify SPD."""
    n = len(a)
    ell = [[(F(0), F(0)) for _ in range(n)] for _ in range(n)]
    pivots: list[Interval] = []
    for k in range(n):
        pivot = a[k][k]
        for s in range(k):
            pivot = sub(pivot, mul(power(ell[k][s], 2), pivots[s]))
        assert pivot[0] > 0, f"LDL pivot {k} not certified positive"
        pivots.append(pivot)
        ell[k][k] = (F(1), F(1))
        for i in range(k + 1, n):
            value = a[i][k]
            for s in range(k):
                value = sub(value, mul(mul(ell[i][s], ell[k][s]), pivots[s]))
            ell[i][k] = div(value, pivot)
    return [p[0] for p in pivots]


def main() -> None:
    prefix, curvature = build_bases()
    gp = normalized_gram(prefix)
    gd = normalized_gram(curvature)

    # A rational test vector gives a certified upper bound for lambda_min(Gp).
    x = (F(16, 1000), F(-299, 1000), F(793, 1000), F(-530, 1000))
    numerator = (F(0), F(0))
    for i in range(4):
        for j in range(4):
            numerator = add(numerator, scale(gp[i][j], x[i] * x[j]))
    denominator = sum(t * t for t in x)
    rayleigh = div(numerator, (denominator, denominator))
    assert rayleigh[1] < F(1, 64)

    # Certify G_curvature > (1/10) I by interval LDL^T.
    shifted = [[gd[i][j] for j in range(4)] for i in range(4)]
    for i in range(4):
        shifted[i][i] = sub(shifted[i][i], (F(1, 10), F(1, 10)))
    pivots = ldlt_positive_pivots(shifted)

    # Unit columns imply trace(G)=4: lambda_max >= 1 and <= 4.
    # Thus kappa(prefix)>8, while kappa(curvature)<sqrt(40)<6.33.
    assert F(1, 64) < F(1, 10)
    assert 40 < F(633, 100) ** 2
    print("PASS: exact rational intervals certify prefix Rayleigh quotient < 1/64")
    print("PASS: interval LDL certifies normalized curvature Gram > (1/10) I")
    print("PASS: unit-column bounds imply kappa(prefix) > 8")
    print("PASS: unit-column bounds imply kappa(curvature) < sqrt(40) < 6.33")
    print("LDL pivot lower bounds:", *(float(p) for p in pivots))
    print("prefix Rayleigh upper bound:", float(rayleigh[1]))
    print("This compares coordinate bases only; it is not a Weil-positivity certificate.")


if __name__ == "__main__":
    main()
