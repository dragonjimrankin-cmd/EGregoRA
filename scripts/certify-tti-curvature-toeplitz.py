#!/usr/bin/env python3
"""Exact rational-interval check for the TTI curvature-basis tail cutoff."""
from fractions import Fraction as F


Interval = tuple[F, F]


def add(a: Interval, b: Interval) -> Interval:
    return a[0] + b[0], a[1] + b[1]


def sub(a: Interval, b: Interval) -> Interval:
    return a[0] - b[1], a[1] - b[0]


def mul(a: Interval, b: Interval) -> Interval:
    values = (a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1])
    return min(values), max(values)


def div(a: Interval, b: Interval) -> Interval:
    assert b[0] * b[1] > 0, "denominator interval must exclude zero"
    reciprocals = (1 / b[0], 1 / b[1])
    return mul(a, (min(reciprocals), max(reciprocals)))


def scale(a: Interval, n: int) -> Interval:
    return mul(a, (F(n), F(n)))


def power(a: Interval, n: int) -> Interval:
    assert n >= 0
    if n == 0:
        return F(1), F(1)
    if n % 2 == 0 and a[0] <= 0 <= a[1]:
        return F(0), max(a[0] ** n, a[1] ** n)
    values = (a[0] ** n, a[1] ** n)
    return min(values), max(values)


def main() -> None:
    # These are rational endpoints; squaring certifies that they enclose sqrt(5).
    sqrt5 = (F(2236067977499789696, 10**18), F(2236067977499789697, 10**18))
    assert sqrt5[0] ** 2 < 5 < sqrt5[1] ** 2
    one = (F(1), F(1))
    three = (F(3), F(3))
    r = scale(sub(sqrt5, one), 1)  # temporarily (sqrt(5)-1), then halve below
    r = div(r, (F(2), F(2)))
    c = div(add(three, sqrt5), (F(2), F(2)))
    c = div(c, sqrt5)
    alpha = div(sub(three, sqrt5), (F(2), F(2)))
    alpha = div(alpha, sqrt5)

    x = power(r, 2)
    L = div(add(one, scale(power(r, 3), 2)), scale(mul(c, r), 2))
    C = scale(mul(mul(c, add(one, alpha)), add(one, r)), 4)

    # Sum_{m>K} m*x^(m-1) = x^K*((K+1)/(1-x) + x/(1-x)^2).
    K = 9
    one_minus_x = sub(one, x)
    tail = mul(
        power(x, K),
        add(
            div((F(K + 1), F(K + 1)), one_minus_x),
            div(x, power(one_minus_x, 2)),
        ),
    )
    residual_squared = mul(power(C, 2), tail)
    neumann_threshold_squared = power(div(one, scale(L, 2)), 2)

    residual_print_bound = F(483789, 10**6)
    threshold_print_bound = F(491535, 10**6)
    assert residual_squared[1] < residual_print_bound**2
    assert neumann_threshold_squared[0] > threshold_print_bound**2
    assert residual_squared[1] < neumann_threshold_squared[0]

    # Enclose the first nine-by-nine block and its inverse. Rows are cosine
    # coefficients k=0,...,8; columns are A_1,A_2,D_3,...,D_9.
    fib = [0, 1]
    for _ in range(2, 13):
        fib.append(fib[-1] + fib[-2])
    d = [(F(0), F(0))]
    for n in range(1, 11):
        d.append(scale(power(r, n), fib[n + 2] - 1))

    size = 9
    head = [[(F(0), F(0)) for _ in range(size)] for _ in range(size)]
    for m in range(1, size + 1):
        col = m - 1
        if m == 1:
            head[0][col] = power(d[1], 2)
        elif m == 2:
            head[0][col] = add(power(d[1], 2), power(d[2], 2))
            head[1][col] = scale(mul(d[1], d[2]), 2)
        else:
            head[0][col] = sub(power(d[m], 2), power(d[m - 1], 2))
            for k in range(1, m - 1):
                head[k][col] = scale(
                    sub(mul(d[m], d[m - k]), mul(d[m - 1], d[m - 1 - k])), 2
                )
            head[m - 1][col] = scale(mul(d[1], d[m]), 2)

    head_inverse = [[(F(0), F(0)) for _ in range(size)] for _ in range(size)]
    for i in range(size - 1, -1, -1):
        for j in range(i, size):
            if i == j:
                head_inverse[i][j] = div(one, head[i][i])
            else:
                total = (F(0), F(0))
                for k in range(i + 1, j + 1):
                    total = add(total, mul(head[i][k], head_inverse[k][j]))
                head_inverse[i][j] = div(scale(total, -1), head[i][i])

    def abs_upper(interval: Interval) -> F:
        return max(abs(interval[0]), abs(interval[1]))

    for n in range(1, size + 1):
        row_bound = max(
            sum((abs_upper(head_inverse[i][j]) for j in range(n)), F(0))
            for i in range(n)
        )
        column_bound = max(
            sum((abs_upper(head_inverse[i][j]) for i in range(n)), F(0))
            for j in range(n)
        )
        assert row_bound * column_bound < 25

    # Frobenius bound for the first nine columns of the exact-minus-Toeplitz
    # matrix. The tail columns are covered by the Hilbert-Schmidt estimate.
    head_error_squared = F(0)
    for m in range(1, size + 1):
        for k in range(m):
            ell = m - 1 - k
            j = ell + 1
            delta = d[1] if j == 1 else sub(d[j], d[j - 1])
            toeplitz_entry = scale(mul(c, delta), 2)
            error = sub(head[k][m - 1], toeplitz_entry)
            head_error_squared += abs_upper(error) ** 2
    assert head_error_squared < 4

    toeplitz_norm_bound = scale(power(c, 2), 2)[1]  # sum of positive q coefficients
    assert toeplitz_norm_bound < F(11, 4)  # 2.75
    assert scale(L, 2)[1] < F(51, 25)  # tail inverse <= 2L < 2.04
    offdiag_bound = toeplitz_norm_bound + residual_print_bound
    full_basis_bound = toeplitz_norm_bound + F(2) + residual_print_bound
    assert offdiag_bound < F(81, 25)  # 3.24
    assert full_basis_bound < F(131, 25)  # 5.24
    # Block inverse: ||A^-1|| + ||A^-1|| ||B12|| ||D^-1|| + ||D^-1||.
    full_inverse_bound = F(5) + F(5) * F(81, 25) * F(51, 25) + F(51, 25)
    assert full_inverse_bound < F(401, 10)  # 40.1
    assert full_basis_bound * full_inverse_bound < 211

    print("PASS: sqrt(5) enclosed by exact rational endpoints")
    print(f"PASS: K={K} residual bound < {float(residual_print_bound):.6f}")
    print(f"PASS: Neumann threshold > {float(threshold_print_bound):.6f}")
    print("PASS: every leading head inverse (sizes 1–9) has Euclidean norm < 5")
    print("PASS: first-nine-column residual Frobenius norm < 2")
    print("PASS: Toeplitz norm < 2.75, off-diagonal block norm < 3.24")
    print("PASS: tail inverse norm < 2.04, full basis norm < 5.24")
    print("PASS: full inverse norm < 40.1 and uniform condition number < 211")


if __name__ == "__main__":
    main()
