#!/usr/bin/env python3
"""Floating-point, non-certified comparison of normalized TTI coefficient bases."""
from __future__ import annotations

import math


def tti_weights(nmax: int) -> list[float]:
    phi = (1.0 + math.sqrt(5.0)) / 2.0
    fib = [0, 1]
    for _ in range(2, nmax + 3):
        fib.append(fib[-1] + fib[-2])
    return [0.0] + [(fib[n + 2] - 1) * phi ** (-n) for n in range(1, nmax + 1)]


def cosine_columns(mmax: int, d: list[float]) -> list[list[float]]:
    """Prefix A_m columns, with coefficients in 1, cos θ, cos 2θ, ..."""
    matrix = [[0.0] * mmax for _ in range(mmax)]
    for m in range(1, mmax + 1):
        for k in range(m):
            corr = sum(d[n + k] * d[n] for n in range(1, m - k + 1))
            matrix[k][m - 1] = corr if k == 0 else 2.0 * corr
    return matrix


def curvature_columns(prefix: list[list[float]]) -> list[list[float]]:
    mmax = len(prefix)
    result = [row[:] for row in prefix]
    for m in range(3, mmax + 1):
        col = m - 1
        for k in range(m):
            result[k][col] = (
                prefix[k][col]
                - 2.0 * prefix[k][col - 1]
                + prefix[k][col - 2]
            )
    return result


def symmetric_eigenvalues(matrix: list[list[float]]) -> list[float]:
    """Jacobi diagonalization for small real symmetric diagnostic matrices."""
    a = [row[:] for row in matrix]
    n = len(a)
    for _ in range(100 * n * n):
        p = q = 0
        largest = 0.0
        for i in range(n):
            for j in range(i + 1, n):
                if abs(a[i][j]) > largest:
                    largest, p, q = abs(a[i][j]), i, j
        if largest < 1e-13:
            break
        app, aqq, apq = a[p][p], a[q][q], a[p][q]
        tau = (aqq - app) / (2.0 * apq)
        t = (
            math.copysign(1.0, tau) / (abs(tau) + math.sqrt(1.0 + tau * tau))
            if tau
            else 1.0
        )
        c = 1.0 / math.sqrt(1.0 + t * t)
        s = t * c
        for k in range(n):
            if k not in (p, q):
                akp, akq = a[k][p], a[k][q]
                a[k][p] = a[p][k] = c * akp - s * akq
                a[k][q] = a[q][k] = s * akp + c * akq
        a[p][p] = app - t * apq
        a[q][q] = aqq + t * apq
        a[p][q] = a[q][p] = 0.0
    return [a[i][i] for i in range(n)]


def unit_column_condition(matrix: list[list[float]]) -> float:
    n = len(matrix)
    norms = [math.sqrt(sum(matrix[i][j] ** 2 for i in range(n))) for j in range(n)]
    normalized = [[matrix[i][j] / norms[j] for j in range(n)] for i in range(n)]
    gram = [
        [sum(normalized[k][i] * normalized[k][j] for k in range(n)) for j in range(n)]
        for i in range(n)
    ]
    eigenvalues = symmetric_eigenvalues(gram)
    if min(eigenvalues) <= 0:
        raise ArithmeticError("diagnostic Gram matrix lost positive definiteness")
    return math.sqrt(max(eigenvalues) / min(eigenvalues))


def main() -> None:
    print("Exploratory double-precision diagnostic; not an interval certificate.")
    print("M  unit-column κ(prefix)  unit-column κ(curvature)")
    for mmax in (4, 8, 12, 16, 20, 24):
        d = tti_weights(mmax)
        prefix = cosine_columns(mmax, d)
        curvature = curvature_columns(prefix)
        print(
            f"{mmax:2d} {unit_column_condition(prefix):20.6f}"
            f" {unit_column_condition(curvature):24.6f}"
        )


if __name__ == "__main__":
    main()
