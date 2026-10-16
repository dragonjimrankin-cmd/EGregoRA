#!/usr/bin/env python3
"""Construct and audit an explicit splice-to-kernel-to-action family.

The construction is deliberately a candidate family, not a unique physical
derivation.  Fibonacci cohort deposits give nonnegative spectral weights.
They generate an exactly positive finite log-frequency kernel and two distinct
positive Euclidean covariant form factors.  The coexistence of the two form
factors proves nonuniqueness from splice data alone and exposes the independent
length scale and Lorentzian continuation still required.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/splice-to-action-map-results.json"

DEPOSITS = [1, 1, 2, 3, 5, 8, 13, 21]
CUMULATIVE = []
running = 0
for value in DEPOSITS:
    running += value
    CUMULATIVE.append(running)
assert CUMULATIVE == [1, 2, 4, 7, 12, 20, 33, 54]

LOG10 = math.log(10)
FREQUENCIES = [2 * math.pi * (index + 1) / LOG10 for index in range(len(DEPOSITS))]
SCALES = [10.0 ** (-index) for index in range(len(DEPOSITS))]


def kernel(x: float, y: float) -> float:
    return sum(
        weight * math.cos(frequency * (x - y))
        for weight, frequency in zip(DEPOSITS, FREQUENCIES)
    )


def kernel_quadratic(points: list[float], coefficients: list[float]) -> tuple[float, float]:
    direct = sum(
        coefficients[i] * coefficients[j] * kernel(points[i], points[j])
        for i in range(len(points))
        for j in range(len(points))
    )
    feature = 0.0
    for weight, frequency in zip(DEPOSITS, FREQUENCIES):
        cosine = sum(c * math.cos(frequency * x) for c, x in zip(coefficients, points))
        sine = sum(c * math.sin(frequency * x) for c, x in zip(coefficients, points))
        feature += weight * (cosine * cosine + sine * sine)
    assert abs(direct - feature) < 1e-8 * max(1.0, abs(feature))
    assert feature >= -1e-12
    return direct, feature


kernel_checks = []
for points, coefficients in [
    ([0.0, 0.25, 0.5], [1.0, -2.0, 1.0]),
    ([0.0, 1.0, 2.0, 3.0], [1.0, 1.0, -1.0, -1.0]),
    ([0.1, 0.7, 1.9, 2.6, 4.1], [2.0, -1.0, 0.5, -3.0, 1.5]),
]:
    direct, feature = kernel_quadratic(points, coefficients)
    kernel_checks.append(
        {
            "points": points,
            "coefficients": coefficients,
            "directQuadratic": direct,
            "featureSumOfSquares": feature,
        }
    )


def form_factor_heat(z: float) -> float:
    return z + sum(
        weight * (1 - math.exp(-scale * z))
        for weight, scale in zip(DEPOSITS, SCALES)
    )


def form_factor_resolvent(z: float) -> float:
    return z + sum(
        weight * (scale * z) / (1 + scale * z)
        for weight, scale in zip(DEPOSITS, SCALES)
    )


form_factor_rows = []
for z in [0.0, 1e-6, 0.01, 1.0, 10.0, 1_000.0]:
    heat = form_factor_heat(z)
    resolvent = form_factor_resolvent(z)
    assert heat >= 0
    assert resolvent >= 0
    form_factor_rows.append(
        {"z": z, "heatFamily": heat, "resolventFamily": resolvent, "difference": heat - resolvent}
    )

assert any(abs(row["difference"]) > 1e-6 for row in form_factor_rows[2:])

results = {
    "analysisDate": "2026-10-15",
    "title": "An explicit splice-to-kernel-to-action family and its nonuniqueness audit",
    "verdict": {
        "candidateMapConstructed": True,
        "finiteKernelPositiveSemidefinite": True,
        "euclideanCovariantActionFamilyConstructed": True,
        "uniqueActionDerived": False,
        "lorentzianCausalityProved": False,
        "physicalScaleDerived": False,
        "gravityOrGaugeNormalisationDerived": False,
        "conclusion": (
            "Fibonacci splice deposits canonically supply nonnegative weights for a decimal log-frequency "
            "Gram kernel.  They also admit positive Euclidean nonlocal actions through spectral functions of "
            "the Laplace--Beltrami operator.  Two explicit inequivalent positive form factors fit the same "
            "splice data, proving that the sequence alone does not select a unique action or physical scale."
        ),
    },
    "spliceData": {
        "deposits": DEPOSITS,
        "cumulativeCarriers": CUMULATIVE,
        "decimalScales": SCALES,
        "frequencies": FREQUENCIES,
        "frequencyLaw": "omega_n=2pi(n+1)/log(10)",
    },
    "positiveKernel": {
        "formula": "K(u,v)=sum_n deltaPi_n cos(omega_n(u-v))",
        "featureMap": (
            "Phi_n(u)=sqrt(deltaPi_n)(cos(omega_n u),sin(omega_n u)); "
            "K(u,v)=sum_n <Phi_n(u),Phi_n(v)>"
        ),
        "proof": (
            "for every real coefficient vector c, c^T K c=sum_n deltaPi_n[(sum_j c_j cos)^2+"
            "(sum_j c_j sin)^2]>=0"
        ),
        "checks": kernel_checks,
    },
    "actionFamily": {
        "euclideanAction": (
            "S_E[chi;g]=(1/2) integral sqrt(g) chi F(ell_*^2(-Delta_g)) chi"
        ),
        "covariance": (
            "Delta_g is the scalar Laplace--Beltrami operator, so spectral functional calculus gives a "
            "diffeomorphism-covariant Euclidean quadratic form"
        ),
        "heatFormFactor": "F_A(z)=z+sum_n deltaPi_n[1-exp(-10^(-n)z)]",
        "resolventFormFactor": "F_B(z)=z+sum_n deltaPi_n[10^(-n)z/(1+10^(-n)z)]",
        "positivity": "F_A(z)>=0 and F_B(z)>=0 for z>=0 because every deposit is nonnegative",
        "sampleRows": form_factor_rows,
    },
    "nonuniquenessTheorem": {
        "statement": (
            "the same splice deposits and decimal scales generate the distinct positive form factors F_A and F_B; "
            "therefore positivity, covariance and the splice sequence do not determine a unique quadratic action"
        ),
        "witness": "the recorded sample rows contain nonzero F_A-F_B",
    },
    "independentInputsStillRequired": [
        "a physical length ell_* converting dimensionless decimal scales into dimensions",
        "a Lorentzian prescription and proof of causality/unitarity or a declared nonlocal alternative",
        "a field-content principle selecting scalar, tensor, spinor or gauge sectors",
        "interaction terms and a conservation law beyond the quadratic kernel",
        "normalisations for G, electric charge and alpha_EM",
        "an independently anchored galactic reference radius r_0",
    ],
    "status": (
        "a precise positive candidate family and a nonuniqueness theorem are established; no unique physical "
        "action or measured constant is derived"
    ),
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Splice-to-action map audit complete.")
print("  Positive decimal log-frequency kernel constructed.")
print("  Two positive Euclidean covariant action families constructed.")
print("  Their inequivalence proves that the splice data do not select a unique action.")
print("  Lorentzian dynamics and physical normalisations remain open.")
