#!/usr/bin/env python3
"""Exact rational interval certificate for the Stage-34 phase-defect bound.

No floating-point operation is used in any proof comparison.  Rational
alternating-series enclosures certify pi, and positive atanh-series
remainders certify logarithms.  The resulting exact Fraction inequality is

    0 <= D_2 < 9.274e-37.

The decimal strings in the JSON output are for readability only; every
boolean certificate is computed by integer cross multiplication.
"""

from __future__ import annotations

import hashlib
import json
import sys
from decimal import Decimal, getcontext
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-prime-phase-defect-certificate.json"

# Python protects against accidental huge integer-to-string conversions.  The
# interval fractions below intentionally have several thousand digits because
# they retain exact truncated-series denominators.
sys.set_int_max_str_digits(100_000)
getcontext().prec = 80

H = 3_000_175_332_800
A = Fraction(10076, 100000)
B = Fraction(24460, 100000)
C = Fraction(808344, 100000)
TARGET = Fraction(9274, 10**40)  # 9.274e-37


def atan_inverse_bounds(q: int, last_index: int) -> tuple[Fraction, Fraction]:
    """Alternating bounds for atan(1/q), including terms 0..last_index."""
    x = Fraction(1, q)
    partial = sum(
        ((-1) ** k * x ** (2 * k + 1) / (2 * k + 1) for k in range(last_index + 1)),
        Fraction(0),
    )
    next_term = x ** (2 * last_index + 3) / (2 * last_index + 3)
    if last_index % 2 == 0:
        return partial - next_term, partial
    return partial, partial + next_term


def log_bounds(x: Fraction, last_index: int) -> tuple[Fraction, Fraction]:
    """Positive atanh-series bounds for log(x), x>1.

    With y=(x-1)/(x+1),

      log x = 2 sum_(k>=0) y^(2k+1)/(2k+1).

    The omitted tail is at most

      2 y^(2N+3) / ((2N+3)(1-y^2)).
    """
    assert x > 1
    y = (x - 1) / (x + 1)
    partial = 2 * sum(
        (y ** (2 * k + 1) / (2 * k + 1) for k in range(last_index + 1)),
        Fraction(0),
    )
    tail = 2 * y ** (2 * last_index + 3) / (
        (2 * last_index + 3) * (1 - y * y)
    )
    return partial, partial + tail


def decimal_text(value: Fraction, digits: int = 70) -> str:
    getcontext().prec = digits
    return format(Decimal(value.numerator) / Decimal(value.denominator), ".60E")


def fingerprint(value: Fraction) -> dict[str, object]:
    numerator = str(value.numerator)
    denominator = str(value.denominator)
    digest = hashlib.sha256(f"{numerator}/{denominator}".encode()).hexdigest()
    return {
        "numeratorDigits": len(numerator.lstrip("-")),
        "denominatorDigits": len(denominator),
        "sha256": digest,
    }


# Machin's identity: pi = 16 atan(1/5) - 4 atan(1/239).
atan5_lower, atan5_upper = atan_inverse_bounds(5, 15)
atan239_lower, atan239_upper = atan_inverse_bounds(239, 4)
pi_lower = 16 * atan5_lower - 4 * atan239_upper
pi_upper = 16 * atan5_upper - 4 * atan239_lower
assert pi_lower < pi_upper
assert pi_lower > Fraction(314159, 100000)

# Normalize H to [1,2) before applying the log series.
log2_lower, log2_upper = log_bounds(Fraction(2), 40)
power_two = 41
height_ratio = Fraction(H, 2**power_two)
assert 1 < height_ratio < 2
ratio_log_lower, ratio_log_upper = log_bounds(height_ratio, 20)
log_h_lower = power_two * log2_lower + ratio_log_lower
log_h_upper = power_two * log2_upper + ratio_log_upper

# log(2*pi*e) = 1 + log(2*pi).  For the lower endpoint, using pi_lower
# preserves the direction of the inequality.
completion_log_lower = 1 + log_bounds(2 * pi_lower, 200)[0]
completion_log_upper = 1 + log_bounds(2 * pi_upper, 200)[1]
assert completion_log_lower < completion_log_upper

# Bellotti--Wong:
# N(T) <= T/(2*pi)[log T-log(2*pi*e)] + A log T + B log log T + C.
# Since log log T <= log T for T>=e, use A+B on the error.  The main
# coefficient is bounded above by 1/(2*pi_lower), while the subtracted
# completion logarithm is bounded below.
main_coefficient_upper = 1 / (2 * pi_lower)


def tail_moment_upper(power: int) -> Fraction:
    q = power - 1
    main = (
        power
        * main_coefficient_upper
        * Fraction(1, H**q)
        * (
            log_h_upper / q
            + Fraction(1, q * q)
            - completion_log_lower / q
        )
    )
    error = (
        (A + B)
        * Fraction(1, H**power)
        * (log_h_upper + Fraction(1, power))
        + C * Fraction(1, H**power)
    )
    return main + error


tail4 = tail_moment_upper(4)
tail6 = tail_moment_upper(6)
defect_upper = Fraction(9, 2) * tail4 + Fraction(3, 8) * tail6

# These are the actual proof obligations.  Fraction comparisons are exact.
assert tail4 > 0
assert tail6 > 0
assert defect_upper > 0
assert defect_upper < TARGET

results = {
    "analysisDate": "2026-10-15",
    "title": "Exact rational interval certificate for the critical prime-phase defect",
    "claim": "0<=I_C^crit-C'/C(2)<9.274e-37",
    "arithmetic": {
        "proofComparisonsUseFloatingPoint": False,
        "type": "Python Fraction exact rational arithmetic",
        "piMethod": "Machin identity with alternating arctangent enclosures",
        "logMethod": "positive atanh series with an explicit geometric tail",
        "stieltjesEndpointTerm": "discarded because -N(H)H^(-p)<=0",
    },
    "inputs": {
        "verifiedHeight": str(H),
        "zeroCountBound": (
            "N(T)<=T/(2pi)log(T/(2pi e))+0.10076logT+"
            "0.24460loglogT+8.08344 for T>=e"
        ),
        "quartetBound": "d_(eta,gamma)<=(9/2)gamma^-4+(3/8)gamma^-6",
        "targetRational": "9274/10^40",
    },
    "intervals": {
        "piLower": decimal_text(pi_lower),
        "piUpper": decimal_text(pi_upper),
        "logHeightLower": decimal_text(log_h_lower),
        "logHeightUpper": decimal_text(log_h_upper),
        "logTwoPiELower": decimal_text(completion_log_lower),
        "logTwoPiEUpper": decimal_text(completion_log_upper),
    },
    "bounds": {
        "tailMoment4Upper": decimal_text(tail4),
        "tailMoment6Upper": decimal_text(tail6),
        "defectUpper": decimal_text(defect_upper),
        "target": decimal_text(TARGET),
        "strictlyBelowTarget": defect_upper < TARGET,
    },
    "exactFingerprints": {
        "piLower": fingerprint(pi_lower),
        "piUpper": fingerprint(pi_upper),
        "logHeightUpper": fingerprint(log_h_upper),
        "logTwoPiELower": fingerprint(completion_log_lower),
        "tailMoment4Upper": fingerprint(tail4),
        "tailMoment6Upper": fingerprint(tail6),
        "defectUpper": fingerprint(defect_upper),
    },
    "proofChain": [
        "Platt--Trudgian places every contributing off-line quartet above H",
        "the quartet formula is bounded by (9/2)gamma^-4+(3/8)gamma^-6",
        "Stieltjes integration bounds each zero tail by p integral_H^infinity N(T)T^(-p-1)dT",
        "Bellotti--Wong bounds N(T), with loglogT<=logT",
        "all constants and logarithms are enclosed by exact rational series bounds",
        "integer cross multiplication proves the final upper bound is strictly less than 9274/10^40",
    ],
    "status": "exact executable certificate passed; no RH claim is made",
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Exact prime-phase defect certificate passed.")
print(f"  tail p=4 upper: {decimal_text(tail4, 80)}")
print(f"  tail p=6 upper: {decimal_text(tail6, 80)}")
print(f"  defect upper:   {decimal_text(defect_upper, 80)}")
print("  exact comparison: defect upper < 9.274e-37")
