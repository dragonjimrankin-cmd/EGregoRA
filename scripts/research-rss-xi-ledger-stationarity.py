#!/usr/bin/env python3
"""Thirty-first-stage attempt to prove xi-ledger stationarity.

The support flow is T_t(eta,gamma)=(exp(-t)eta,gamma). This program derives
its action on a reflected zero quartet, on the convergent central horizontal
residue, and on finite-height moments. It tests whether functional symmetry,
central normalization, the established kappa geometry, or the principal prime
ledger supplies stationarity of the same completed xi divisor.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-xi-ledger-stationarity-results.json"

phi = (1 + math.sqrt(5)) / 2
c = 1 / phi
t_phi = math.log(phi)
first_zero = 14.134725141734693


def quartet_coefficients(eta: float, gamma: float) -> dict[str, float]:
    return {
        "z4": 1.0,
        "z2": 2 * (gamma * gamma - eta * eta),
        "z0": (eta * eta + gamma * gamma) ** 2,
    }


def quartet_derivative_coefficients(eta: float, gamma: float) -> dict[str, float]:
    # Along dot eta=-eta.
    return {
        "z4": 0.0,
        "z2": 4 * eta * eta,
        "z0": -4 * eta * eta * (eta * eta + gamma * gamma),
    }


def quartet_value(z: float, eta: float, gamma: float) -> float:
    return z**4 + 2 * (gamma * gamma - eta * eta) * z * z + (
        eta * eta + gamma * gamma
    ) ** 2


def quartet_log_derivative_in_time(z: float, eta: float, gamma: float) -> float:
    numerator = 4 * eta * eta * (z * z - eta * eta - gamma * gamma)
    return numerator / quartet_value(z, eta, gamma)


def central_residue(eta: float, gamma: float) -> float:
    return 4 * eta * eta * (eta * eta + 3 * gamma * gamma) / (
        gamma * gamma * (eta * eta + gamma * gamma) ** 2
    )


def central_residue_dissipation(eta: float, gamma: float) -> float:
    x = eta * eta / (gamma * gamma)
    return -8 * x * (3 - x) / (gamma * gamma * (1 + x) ** 3)


quartet_rows = []
for eta in [0.1, 0.25, 0.49]:
    gamma = first_zero
    before = quartet_coefficients(eta, gamma)
    after = quartet_coefficients(c * eta, gamma)
    derivative = quartet_derivative_coefficients(eta, gamma)
    # Normalize each factor to one at the centre z=0; evenness, reality, order,
    # and central value are then all preserved, but the function still moves.
    centre_log_derivative = quartet_log_derivative_in_time(0.0, eta, gamma)
    normalized_variations = []
    for z in [0.25, 1.0, 2.0]:
        normalized_variations.append({
            "z": z,
            "timeDerivativeLogCentralNormalizedFactor": (
                quartet_log_derivative_in_time(z, eta, gamma)
                - centre_log_derivative
            ),
        })
    quartet_rows.append({
        "eta": eta,
        "gamma": gamma,
        "before": before,
        "afterGoldenStep": after,
        "infinitesimalDerivative": derivative,
        "centralNormalizedVariations": normalized_variations,
    })

assert all(abs(row["infinitesimalDerivative"]["z2"]) > 0 for row in quartet_rows)
assert all(abs(row["infinitesimalDerivative"]["z0"]) > 0 for row in quartet_rows)
assert all(
    any(abs(item["timeDerivativeLogCentralNormalizedFactor"]) > 1e-12 for item in row["centralNormalizedVariations"])
    for row in quartet_rows
)

residue_rows = []
for gamma in [first_zero, 50.0, 1000.0]:
    for eta in [0.1, 0.25, 0.49]:
        before = central_residue(eta, gamma)
        derivative = central_residue_dissipation(eta, gamma)
        after = central_residue(c * eta, gamma)
        residue_rows.append({
            "eta": eta,
            "gamma": gamma,
            "residue": before,
            "timeDerivative": derivative,
            "goldenStepResidue": after,
            "goldenStepRatio": after / before,
        })

assert all(row["timeDerivative"] < 0 for row in residue_rows)
assert all(row["goldenStepRatio"] < 1 for row in residue_rows)

# A synthetic finite reflected ledger demonstrates all exact symmetries while
# retaining nonzero support and strict flow dissipation.
synthetic_quartets = [
    (0.10, first_zero),
    (0.25, 21.022039638771556),
    (0.40, 25.01085758014569),
]
synthetic_residue = sum(central_residue(eta, gamma) for eta, gamma in synthetic_quartets)
synthetic_dissipation = sum(
    central_residue_dissipation(eta, gamma) for eta, gamma in synthetic_quartets
)
synthetic_after = sum(
    central_residue(c * eta, gamma) for eta, gamma in synthetic_quartets
)
assert synthetic_residue > 0 and synthetic_dissipation < 0 and synthetic_after < synthetic_residue

# Weak stationarity requires integral Lf dmu=0. The single test f=eta^2 has
# Lf=-2eta^2, so it already forces the horizontal second moment to vanish.
second_moment_examples = []
for displacements in [[0.0, 0.0], [-0.25, 0.25], [-0.4, -0.1, 0.1, 0.4]]:
    moment = sum(eta * eta for eta in displacements) / len(displacements)
    generator_value = -2 * moment
    second_moment_examples.append({
        "displacements": displacements,
        "secondMoment": moment,
        "generatorExpectation": generator_value,
        "weaklyStationaryForQuadraticTest": abs(generator_value) < 1e-15,
    })
assert second_moment_examples[0]["weaklyStationaryForQuadraticTest"]
assert all(not row["weaklyStationaryForQuadraticTest"] for row in second_moment_examples[1:])

results = {
    "analysisDate": "2026-10-15",
    "title": "Attempting stationarity of the completed xi ledger under the support flow",
    "question": "can the actual completed xi zero ledger be proved stationary under eta(t)=exp(-t)eta?",
    "verdict": {
        "rhProved": False,
        "sameXiStationarityProved": False,
        "stationarityEquivalentToRh": True,
        "functionalEquationSufficient": False,
        "centralNormalizationSufficient": False,
        "kappaGeometrySufficient": False,
        "principalPrimeStationarityProved": False,
        "conclusion": (
            "For any positive flow time, stationarity of every finite-height completed xi ledger is equivalent "
            "to RH. Functional reflection, reality, order, and central normalization are all preserved by an "
            "explicit off-line quartet factor whose support flow is nonstationary. The convergent horizontal "
            "residue has a strictly negative first variation for every off-line quartet. No completed-prime "
            "identity was found that sets this variation to zero."
        ),
    },
    "stationarityEquivalence": {
        "flow": "T_t(eta,gamma)=(exp(-t)eta,gamma)",
        "statement": (
            "RH iff the completed xi zero ledger is stationary under T_t for one, equivalently every, t>0"
        ),
        "forward": "under RH every eta is zero and is fixed",
        "reverseFiniteHeight": (
            "stationarity gives M2=exp(-2t)M2 for the finite-height horizontal second moment, hence M2=0"
        ),
        "reverseDiscrete": (
            "an off-line zero would generate distinct support points exp(-nt)eta accumulating at eta=0 at fixed gamma"
        ),
    },
    "weakGeneratorAudit": {
        "generator": "L f=-eta partial_eta f",
        "quadraticTest": "f=eta^2 gives Lf=-2eta^2",
        "consequence": (
            "even weak stationarity against this one test forces the horizontal second moment to vanish"
        ),
        "examples": second_moment_examples,
    },
    "quartetFirstVariation": {
        "factor": "Q_(eta,gamma)(z)=z^4+2(gamma^2-eta^2)z^2+(eta^2+gamma^2)^2",
        "derivative": "partial_t Q=4eta^2[z^2-(eta^2+gamma^2)]",
        "preservedWithoutStationarity": [
            "evenness Q(-z)=Q(z)",
            "reality Q(conjugate z)=conjugate Q(z)",
            "entire order after multiplication by a completed function",
            "central value after scalar normalization",
        ],
        "rows": quartet_rows,
        "conclusion": (
            "functional-equation symmetry, reality, order, and central normalization do not imply flow stationarity"
        ),
    },
    "centralResidueDissipation": {
        "residue": "r=4eta^2(eta^2+3gamma^2)/(gamma^2(eta^2+gamma^2)^2)",
        "x": "x=eta^2/gamma^2",
        "derivative": "dr/dt=-8x(3-x)/(gamma^2(1+x)^3)",
        "criticalStripSign": "strictly negative for every off-line nontrivial zero because 0<x<3",
        "rows": residue_rows,
        "syntheticLedger": {
            "quartets": synthetic_quartets,
            "residue": synthetic_residue,
            "timeDerivative": synthetic_dissipation,
            "goldenStepResidue": synthetic_after,
        },
        "stationarityConsequence": (
            "zero first variation of the convergent total residue would force RH, but no prime-side conservation law proves it"
        ),
    },
    "functionLevelAudit": {
        "centredVariable": "z=s-1/2",
        "flowNature": "the divisor flow is nonholomorphic and nonlocal as an operation on entire functions",
        "sameFunctionRequirement": (
            "a stationary completed function would require the sum of quartet logarithmic variations to vanish identically"
        ),
        "poleArgument": (
            "an off-line moving zero creates a nonzero principal part in the logarithmic variation, which cannot disappear while that divisor point moves"
        ),
        "status": "the natural-gradient flow defines a family of different completed divisors unless RH already holds",
    },
    "primeSideAudit": {
        "requiredIdentity": (
            "the completed logarithmic derivative in Re(s)>1 must be unchanged under the transported zero divisor"
        ),
        "uniquenessBoundary": (
            "if the principal von Mangoldt and archimedean logarithmic derivative were unchanged on an open half-plane, analytic uniqueness would give the same xi function and stationarity"
        ),
        "failure": (
            "the quartet first variation is nonzero off the line, and no Euler-product identity cancels it"
        ),
        "equivalentTarget": (
            "proving zero variation of the central horizontal residue or the principal completed prime functional is another RH-equivalent stationarity criterion"
        ),
    },
    "routeAudit": [
        {
            "route": "functional equation",
            "result": "preserves reflection symmetry only; explicit even real quartet factors remain nonstationary",
        },
        {
            "route": "central normalization",
            "result": "a scalar can keep the central value fixed while normalized logarithmic variation remains nonzero",
        },
        {
            "route": "kappa natural gradient",
            "result": "derives the transport and entropy dissipation but not that xi zeros follow the transport",
        },
        {
            "route": "completed prime ledger",
            "result": "stationarity would close the proof, but the required all-scale principal identity is not derived",
        },
    ],
    "status": (
        "the stationarity target has been reduced to equivalent infinitesimal, moment, residue, divisor, and prime forms; none is proved unconditionally, so RH remains open"
    ),
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Xi-ledger stationarity attempt complete.")
print("  Stationarity for one positive time is RH-equivalent.")
print("  Weak quadratic stationarity already forces eta=0.")
print("  Every off-line quartet has nonzero divisor and residue variation.")
print("  Functional symmetry and central normalization do not stop the flow.")
print("  Principal-prime stationarity was not derived; RH remains open.")
