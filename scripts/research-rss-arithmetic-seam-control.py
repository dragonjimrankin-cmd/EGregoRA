#!/usr/bin/env python3
"""Twenty-first-stage attempt to control the seam from arithmetic data.

The script derives a generalized Li/Keiper generating function at a base point
strictly inside the Euler-product half-plane.  Its coefficients have an
absolutely convergent von-Mangoldt/Laguerre formula for each fixed index, and
their exponential growth radius detects every off-line zero.  This is an exact
arithmetic controller, not a proof of the required all-index growth bound.
"""

from __future__ import annotations

import cmath
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-arithmetic-seam-control-results.json"
PI = math.pi
PHI = (1 + math.sqrt(5)) / 2

# Euler-Maclaurin and Lanczos data already used by the earlier zero diagnostics.
BERNOULLI_OVER_FACTORIAL = [
    1 / 12,
    -1 / 720,
    1 / 30240,
    -1 / 1209600,
    1 / 47900160,
    -691 / 1307674368000,
    7 / 523069747200,
    -3617 / 10670622842880000,
]
LANCZOS = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
]


def complex_gamma(z: complex) -> complex:
    if z.real < 0.5:
        return PI / (cmath.sin(PI * z) * complex_gamma(1 - z))
    shifted = z - 1
    series = complex(LANCZOS[0], 0)
    for index, coefficient in enumerate(LANCZOS[1:], start=1):
        series += coefficient / (shifted + index)
    t = shifted + 7.5
    return cmath.sqrt(2 * PI) * t ** (shifted + 0.5) * cmath.exp(-t) * series


def complex_zeta(s: complex, cutoff: int = 100) -> complex:
    total = sum(cmath.exp(-s * math.log(n)) for n in range(1, cutoff))
    total += cmath.exp((1 - s) * math.log(cutoff)) / (s - 1)
    total += 0.5 * cmath.exp(-s * math.log(cutoff))
    rising = complex(1, 0)
    for k, coefficient in enumerate(BERNOULLI_OVER_FACTORIAL, start=1):
        if k == 1:
            rising = s
        else:
            rising *= (s + (2 * k - 3)) * (s + (2 * k - 2))
        total += coefficient * rising * cmath.exp((-s - 2 * k + 1) * math.log(cutoff))
    return total


def endpoint_completed_prime(s: complex) -> complex:
    return (s - 1) * complex_zeta(s)


def remaining_archimedean(s: complex) -> complex:
    return 0.5 * s * cmath.exp((-s / 2) * math.log(PI)) * complex_gamma(s / 2)


def xi(s: complex) -> complex:
    return remaining_archimedean(s) * endpoint_completed_prime(s)


# Generalized Li coordinate.  a=-1 puts the expansion point s0=2 in the
# absolutely convergent Euler-product half-plane.
A_PARAMETER = -1.0
D = 1 - 2 * A_PARAMETER
S0 = 1 - A_PARAMETER
C = 0.5 - A_PARAMETER
ENDPOINT_RATIO = (1 - A_PARAMETER) / (-A_PARAMETER)
assert (D, S0, C, ENDPOINT_RATIO) == (3.0, 2.0, 1.5, 2.0)


def li_coordinate(s: complex, a: float = A_PARAMETER) -> complex:
    return (s + a - 1) / (s - a)


def inverse_li_coordinate(z: complex, a: float = A_PARAMETER) -> complex:
    return (1 - a - a * z) / (1 - z)


for sample in [complex(0.5, 14), complex(0.75, 30), complex(2, 0.2)]:
    assert abs(inverse_li_coordinate(li_coordinate(sample)) - sample) < 1e-12
for gamma in [14.134725141734693, 50, 1000]:
    assert abs(abs(li_coordinate(complex(0.5, gamma))) - 1) < 1e-14


def cauchy_li_coefficients(function, maximum: int = 10, radius: float = 0.18, samples: int = 1024) -> list[dict[str, float]]:
    base = function(complex(S0, 0))
    values: list[complex] = []
    for index in range(samples):
        angle = 2 * PI * index / samples
        z = radius * cmath.exp(1j * angle)
        s = inverse_li_coordinate(z)
        values.append(cmath.log(function(s) / base))

    result = []
    for n in range(1, maximum + 1):
        coefficient = sum(
            values[index] * cmath.exp(-2j * PI * n * index / samples)
            for index in range(samples)
        ) / samples / radius**n
        li_value = n * coefficient
        result.append({
            "n": n,
            "value": li_value.real,
            "imaginaryNumericalError": li_value.imag,
        })
    return result


completed_prime_coefficients = cauchy_li_coefficients(endpoint_completed_prime)
archimedean_coefficients = cauchy_li_coefficients(remaining_archimedean)
total_coefficients = cauchy_li_coefficients(xi)
coefficient_table = []
for prime, arch, total in zip(completed_prime_coefficients, archimedean_coefficients, total_coefficients):
    assert prime["n"] == arch["n"] == total["n"]
    reconstruction_error = total["value"] - prime["value"] - arch["value"]
    assert abs(reconstruction_error) < 1e-6
    assert max(
        abs(prime["imaginaryNumericalError"]),
        abs(arch["imaginaryNumericalError"]),
        abs(total["imaginaryNumericalError"]),
    ) < 1e-5
    coefficient_table.append({
        "n": total["n"],
        "completedPrimeCoefficient": prime["value"],
        "archimedeanCoefficient": arch["value"],
        "generalizedLiCoefficient": total["value"],
        "reconstructionError": reconstruction_error,
    })

# Cross-check the first seven generalized coefficients against an independent
# high-precision calculation recorded by the investigator.  The tolerances are
# far wider than the Cauchy quadrature error but narrow enough to catch a map,
# normalization, or derivative-factor mistake.
reference = [
    0.20719869459000203,
    0.8258355452602285,
    1.8471347627589843,
    3.256805566280704,
    5.0355310855416315,
    7.159624662525872,
    9.601826853057695,
]
for observed, expected in zip(coefficient_table, reference):
    assert abs(observed["generalizedLiCoefficient"] - expected) < 1e-8


def mapped_zero_data(eta: float, gamma: float, c: float = C) -> dict[str, float]:
    # a=1/2-c, D=2c, s0=1/2+c.
    denominator_average = gamma * gamma + c * c + eta * eta
    ratio = 2 * c * eta / denominator_average
    alpha = math.atanh(ratio) if eta else 0.0  # -log |z_a(rho)| for eta>=0
    radius_squared = (denominator_average - 2 * c * eta) / (denominator_average + 2 * c * eta)
    radius = math.sqrt(radius_squared)
    direct = abs(li_coordinate(complex(0.5 + eta, gamma), 0.5 - c))
    assert abs(radius - direct) < 2e-16
    return {
        "eta": eta,
        "gamma": gamma,
        "c": c,
        "basePoint": 0.5 + c,
        "mappedRadius": radius,
        "logReciprocalRadius": alpha,
        "growthExcess": math.expm1(alpha),
        "eFoldCoefficientIndex": math.inf if alpha == 0 else 1 / abs(alpha),
    }


stress_detection = []
for stage in [14, 20, 30, 40]:
    gamma = PHI**stage
    fixed = mapped_zero_data(0.25, gamma)
    optimal_c = math.sqrt(gamma * gamma + 0.25**2)
    optimal_alpha = math.asinh(0.25 / gamma)
    stress_detection.append({
        "stage": stage,
        "height": gamma,
        "fixedBasePointAEqualsMinusOne": fixed,
        "scaleMatchedBasePoint": {
            "c": optimal_c,
            "basePoint": 0.5 + optimal_c,
            "logReciprocalRadius": optimal_alpha,
            "eFoldCoefficientIndex": 1 / optimal_alpha,
        },
    })

quarter_at_first_zero = mapped_zero_data(0.25, 14.134725141734693)
reflected_at_first_zero = mapped_zero_data(-0.25, 14.134725141734693)
assert abs(
    quarter_at_first_zero["mappedRadius"] * reflected_at_first_zero["mappedRadius"] - 1
) < 1e-14

results = {
    "analysisDate": "2026-10-15",
    "title": "An arithmetic controller for the two-ended seam",
    "question": "can prime data control the height-independent seam marker rather than merely restate it on the zero side?",
    "verdict": {
        "rhProved": False,
        "exactArithmeticControllerFound": True,
        "controllerUsesAbsolutelyConvergentPrimeSeriesAtEachFixedIndex": True,
        "allIndexSubexponentialBoundProved": False,
        "seamInfimumForcedToOne": False,
        "conclusion": (
            "a generalized Li expansion based at s=2 turns the seam question into one exact prime-side growth bound. "
            "Its endpoint-completed von-Mangoldt/Laguerre coefficients detect every off-line zero through their "
            "radius of convergence. Proving subexponential growth of the full sequence would force the seam "
            "infimum to one and prove RH, but that cancellation estimate is not derived."
        ),
    },
    "analyticTestObstruction": {
        "statement": (
            "no single holomorphic Weil test can have real part equal to the nonlinear seam defect as a function "
            "of horizontal displacement while remaining independent of ordinate"
        ),
        "reason": (
            "if Re h(x+iy)=f(y) on an open strip, harmonicity gives f''(y)=0; an even such f is constant, "
            "whereas -2 log cos(pi y) has second derivative 2 pi^2 sec^2(pi y)"
        ),
        "consequence": "arithmetic control must use a nonlinear determinant or an all-index family of analytic tests",
    },
    "generalizedLiMap": {
        "parameter": A_PARAMETER,
        "basePoint": S0,
        "scale": D,
        "coordinate": "z_a(s)=(s+a-1)/(s-a), with a=-1",
        "inverse": "s_a(z)=(1-a-a z)/(1-z)=2+3z/(1-z)",
        "criticalLineProperty": "|z_a(1/2+i gamma)|=1",
        "zeroRadius": (
            "for rho=1/2+eta+i gamma and c=1/2-a, |z_a(rho)|^2="
            "(gamma^2+(c-eta)^2)/(gamma^2+(c+eta)^2)"
        ),
        "functionalPair": "critical reflection sends z_a to 1/conj(z_a), so every off-line quartet has one member inside the unit disk",
    },
    "arithmeticGeneratingFunction": {
        "function": "P_a(z)=log(((s_a(z)-1) zeta(s_a(z)))/((-a) zeta(1-a)))",
        "series": "P_a(z)=sum_{n>=1} p_{n,a} z^n/n",
        "radiusStatement": (
            "the zeta pole is removed, trivial zeros map outside the unit disk, and nontrivial zeros map to its "
            "singularities; therefore the series radius is one exactly under RH"
        ),
        "growthCriterion": "RH iff limsup_n |p_{n,a}|^(1/n)=1 for one fixed a<0",
        "subexponentialForm": "equivalently, for every epsilon>0, p_{n,a}=O_epsilon(exp(epsilon n))",
    },
    "primeCoefficientFormula": {
        "general": (
            "p_{n,a}=1+(-1)^(n+1)((1-a)/(-a))^n-(1-2a) sum_{m>=2} "
            "Lambda(m)m^(-(1-a)) L_(n-1)^(1)((1-2a)log m)"
        ),
        "aEqualsMinusOne": (
            "p_n=1+(-1)^(n+1)2^n-3 sum_{m>=2} Lambda(m)m^(-2) "
            "L_(n-1)^(1)(3 log m)"
        ),
        "absoluteConvergence": (
            "for every fixed n and a<0 the von Mangoldt series converges absolutely because 1-a>1 and the "
            "Laguerre factor is a fixed polynomial in log m"
        ),
        "endpointTerm": (
            "1+(-1)^(n+1)((1-a)/(-a))^n comes from log(s-1) and cancels the artificial exponential caused "
            "by separating the zeta pole from the endpoint completion"
        ),
        "hardEstimate": (
            "prove the endpoint term and oscillatory prime-power Laguerre sum cancel to subexponential size "
            "uniformly in n"
        ),
    },
    "coefficientDiagnosticsAtAEqualsMinusOne": {
        "method": "1024-point Cauchy coefficient extraction at radius 0.18 using independent Euler-Maclaurin zeta and Lanczos gamma evaluators",
        "table": coefficient_table,
        "status": (
            "the first ten completed-prime coefficients remain moderate and reconstruct the generalized Li "
            "coefficients with the archimedean part; this finite computation does not establish all-index growth"
        ),
    },
    "seamConnection": {
        "liRadialExponent": "alpha_c(eta,gamma)=-log|z_a(rho)|=atanh(2c eta/(gamma^2+c^2+eta^2))",
        "seamDefect": "epsilon(eta)=-2log cos(pi eta)",
        "relationship": (
            "both vanish exactly at eta=0, but alpha_c decays like 2c eta/gamma^2 at fixed c; the all-index "
            "coefficient growth amplifies that decaying signal until an escaping zero becomes visible"
        ),
        "fixedControllerStressDetection": stress_detection,
        "firstZeroQuarterDisplacement": quarter_at_first_zero,
        "functionalReflectionQuarterDisplacement": reflected_at_first_zero,
        "optimizedBasePoint": (
            "for a known target height, c=sqrt(gamma^2+eta^2) maximizes the radial exponent and gives "
            "alpha=asinh(eta/gamma), but no height-dependent choice supplies one uniform proof"
        ),
    },
    "completedControlStatement": {
        "sufficientArithmeticTheorem": (
            "for a=-1, prove 1+(-1)^(n+1)2^n-3 sum Lambda(m)m^(-2)L_(n-1)^(1)(3log m)="
            "exp(o(n))"
        ),
        "consequence": (
            "the generating radius is one, so no nontrivial zero maps inside the disk; functional symmetry then "
            "places every nontrivial zero on Re(s)=1/2, making the two-ended seam infimum equal to one"
        ),
        "currentStatus": (
            "the controller and equivalence are exact, but the required all-index prime cancellation is another "
            "form of RH and is not proved by the present framework"
        ),
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Arithmetic seam-control investigation complete.")
print("  Exact controller: endpoint-completed generalized Li coefficients based at s=2.")
print("  Prime formula: absolutely convergent for every fixed coefficient index.")
print(f"  First ten generalized coefficients computed; lambda_10={coefficient_table[-1]['generalizedLiCoefficient']:.12f}.")
print(f"  Escaping stage-14 quartet e-fold index at fixed base point: {stress_detection[0]['fixedBasePointAEqualsMinusOne']['eFoldCoefficientIndex']:.0f}.")
print("  Verdict: arithmetic control is identified, but its all-index subexponential bound remains unproved.")
