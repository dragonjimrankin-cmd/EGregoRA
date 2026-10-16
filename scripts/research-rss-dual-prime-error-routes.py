#!/usr/bin/env python3
"""Twenty-third-stage attempt on both remaining prime-error routes.

Route A seeks a square-root Chebyshev bound. Route B seeks direct uniform
cancellation in the signed Laguerre transform. The script maps both to the same
analytic continuation domain and quantifies why known weaker exponents retain
an exponential coefficient base.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "docs/rh/rss-prime-laguerre-growth-proof-results.json"
OUTPUT = ROOT / "docs/rh/rss-dual-prime-error-routes-results.json"

prior = json.loads(INPUT.read_text())
assert prior["verdict"]["subexponentialGrowthProved"] is False


def disk_radius_for_half_plane(theta: float) -> float:
    # For z=(s-2)/(s+1), the disk centered at zero tangent to Re(s)=theta
    # meets that line at real s=theta.
    return (2 - theta) / (1 + theta)


def coefficient_base(theta: float) -> float:
    return 1 / disk_radius_for_half_plane(theta)


exponent_table = []
for theta in [0.5, 0.51, 0.55, 0.6, 0.75, 0.9, 0.99, 1.0]:
    radius = disk_radius_for_half_plane(theta)
    base = coefficient_base(theta)
    assert abs((2 - radius) / (1 + radius) - theta) < 1e-15
    exponent_table.append({
        "primeErrorExponentTheta": theta,
        "guaranteedDiskRadius": radius,
        "coefficientExponentialBase": base,
        "subexponential": abs(base - 1) < 1e-15,
    })
assert exponent_table[0]["subexponential"] is True
assert all(not entry["subexponential"] for entry in exponent_table[1:])

# Symbolic coefficient checks for the inverse map.
# s(z)=2+3z/(1-z); |z|<1 is exactly Re(s)>1/2.
for radius in [0.1, 0.5, 0.9, 0.999]:
    leftmost_real_part = (2 - radius) / (1 + radius)
    assert leftmost_real_part > 0.5
assert abs((2 - 1) / (1 + 1) - 0.5) < 1e-15

# Translate the Laguerre remainder to t=3 log x.
# x^-3 dx=(1/3)e^(-2t/3)dt and the factor -3 cancels 1/3.
t_kernel_samples = []
for t in [0, 3, 9, 30, 90]:
    x = math.exp(t / 3)
    t_kernel_samples.append({
        "t": t,
        "x": x,
        "ordinaryPntEnvelopeFactor": math.exp(-t / 3),
        "squareRootEnvelopeFactor": math.exp(-t / 2),
    })

results = {
    "analysisDate": "2026-10-15",
    "title": "Attempting square-root prime error and uniform Laguerre cancellation",
    "question": "can either remaining route prove the subexponential arithmetic seam bound?",
    "verdict": {
        "rhProved": False,
        "squareRootPrimeErrorProved": False,
        "uniformLaguerreCancellationProved": False,
        "routesShownEquivalentAtAnalyticBoundary": True,
        "newUnconditionalExponentObtained": False,
        "conclusion": (
            "both attempts reach the same boundary. The generalized Li disk is exactly the half-plane Re(s)>1/2. "
            "A prime-error exponent theta>1/2 leaves coefficient base (1+theta)/(2-theta)>1, while direct "
            "subexponential Laguerre cancellation would analytically continue the endpoint-completed prime logarithm "
            "through that same half-plane. No established TTI identity or unconditional prime estimate crosses it."
        ),
    },
    "routeA_squareRootPrimeError": {
        "target": "psi(x)-x=O(x^(1/2) log^2 x), or more generally O_epsilon(x^(1/2+epsilon)) for every epsilon>0",
        "explicitFormula": (
            "psi(x)-x is governed by sums of x^rho/rho; a zero with Re(rho)=beta>1/2 contributes at x^beta scale "
            "and obstructs a uniform square-root bound"
        ),
        "attemptedInputs": [
            {
                "input": "ordinary prime number theorem psi(x)=x+o(x)",
                "outcome": "controls only an exponent tending down from one, not one half",
            },
            {
                "input": "classical zero-free region near Re(s)=1",
                "outcome": "improves the x-scale by a subpower factor but does not produce x^(1/2+epsilon)",
            },
            {
                "input": "finite verification of critical-line zeros",
                "outcome": "moves any first counterexample upward but gives no all-height prime-error exponent",
            },
            {
                "input": "positive central horizontal residue and seam contraction",
                "outcome": "supplies an RH-equivalent zero-side norm but no inequality for psi(x)-x",
            },
        ],
        "blockingEquivalence": (
            "the square-root Chebyshev estimate excludes every beta>1/2; functional symmetry then gives RH. "
            "Deriving it without new arithmetic input would already be a proof of RH"
        ),
        "status": "no square-root-scale estimate derived",
    },
    "routeB_uniformLaguerreCancellation": {
        "tVariableIdentity": (
            "p_n=-integral_0^infinity E_tilde(exp(t/3))exp(-2t/3)"
            "[2L_(n-1)^1(t)+3L_(n-2)^2(t)]dt"
        ),
        "kernelSamples": t_kernel_samples,
        "attemptedInputs": [
            {
                "input": "Laguerre orthogonality",
                "outcome": (
                    "the prime-error multiplier lies at the critical weighted boundary; available unconditional error "
                    "does not supply the needed critical L2 or pointwise norm"
                ),
            },
            {
                "input": "Cauchy-Schwarz after taking a weighted L2 norm",
                "outcome": (
                    "requires a critical weighted norm not supplied by unconditional estimates; the later all-scale "
                    "Chebyshev-energy theorem is weaker in pointwise form but still RH-equivalent"
                ),
            },
            {
                "input": "Laguerre recurrence in n",
                "outcome": "introduces new logarithmic prime moments and does not close to a contractive recurrence for p_n",
            },
            {
                "input": "signed oscillation of the Chebyshev error",
                "outcome": "neither its phase nor its correlation with all Laguerre kernels is controlled uniformly in n",
            },
        ],
        "generatingFunction": "P(z)=log(((s(z)-1)zeta(s(z)))/zeta(2)), s(z)=2+3z/(1-z)",
        "geometricIdentity": "|z|<1 maps exactly to Re(s)>1/2",
        "blockingEquivalence": (
            "a subexponential coefficient bound gives radius at least one and hence zero-freeness of (s-1)zeta(s) "
            "through Re(s)>1/2; this is RH after functional symmetry"
        ),
        "status": "no uniform signed-kernel estimate derived",
    },
    "quantitativeBoundary": {
        "halfPlaneToDiskRadius": "r_theta=(2-theta)/(1+theta)",
        "coefficientBase": "B_theta=(1+theta)/(2-theta)",
        "table": exponent_table,
        "interpretation": (
            "theta=1/2 gives B=1. Every fixed theta>1/2 gives B>1, so even an arbitrarily small fixed loss "
            "above square-root scale remains exponential in n"
        ),
    },
    "whyAveragingDoesNotClosePointwiseControl": {
        "statement": (
            "available zero-density and averaged-in-height estimates can bound most ordinates, but the seam infimum "
            "and coefficient radius are changed by one exceptional zero; the later critical all-X energy target is stronger"
        ),
        "consequence": "an exceptional-set theorem cannot replace a uniform all-zero or all-n estimate",
    },
    "strongestConditionalClosure": {
        "primeErrorPremise": "for every epsilon>0, psi(x)-x=O_epsilon(x^(1/2+epsilon))",
        "laguerrePremise": "equivalently, p_n=O_epsilon(exp(epsilon n)) for every epsilon>0",
        "conclusion": "either premise gives radius one, seam infimum one, and RH",
        "status": "both premises remain unproved and equivalent in strength to the target",
    },
    "proofBoundary": {
        "newExactInformation": [
            "the two proposed routes are the same analytic-continuation problem in different coordinates",
            "the loss from a prime-error exponent theta is exactly the coefficient base (1+theta)/(2-theta)",
            "Laguerre orthogonality reaches a critical weighted boundary rather than supplying a free positivity theorem",
        ],
        "missingTheorem": (
            "a genuinely new arithmetic inequality excluding every zero in Re(s)>1/2, expressed either as "
            "square-root Chebyshev error or uniform signed-Laguerre cancellation"
        ),
        "status": "neither attempted route proves the missing theorem; RH remains open",
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Dual prime-error routes investigation complete.")
print("  Route A: square-root Chebyshev error not derived.")
print("  Route B: uniform signed-Laguerre cancellation not derived.")
print("  Exact boundary: theta -> coefficient base (1+theta)/(2-theta).")
print("  Verdict: both routes coincide with zero-freeness in Re(s)>1/2; RH remains open.")
