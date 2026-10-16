#!/usr/bin/env python3
"""Twenty-second-stage attempt to prove subexponential prime-Laguerre growth.

The calculation subtracts the continuous prime-density main term exactly,
rewrites the remaining coefficient as a Stieltjes transform of psi(x)-x,
and checks the positivity, finite-verification, and classical PNT routes.  It
identifies precisely why each known input stops short of the required bound.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "docs/rh/rss-arithmetic-seam-control-results.json"
OUTPUT = ROOT / "docs/rh/rss-prime-laguerre-growth-proof-results.json"
PI = math.pi
FIRST_ZERO = 14.134725141734693
C = 1.5

prior = json.loads(INPUT.read_text())
coefficient_table = prior["coefficientDiagnosticsAtAEqualsMinusOne"]["table"]


def laguerre_value(degree: int, alpha: float, x: float) -> float:
    if degree == 0:
        return 1.0
    if degree == 1:
        return 1 + alpha - x
    older, old = 1.0, 1 + alpha - x
    for current_degree in range(2, degree + 1):
        current = (
            (2 * current_degree - 1 + alpha - x) * old
            - (current_degree - 1 + alpha) * older
        ) / current_degree
        older, old = old, current
    return old


def positive_roots(degree: int, alpha: float = 1.0, maximum: float = 100.0, step: float = 0.005) -> list[float]:
    roots: list[float] = []
    left, left_value = 0.0, laguerre_value(degree, alpha, 0.0)
    for index in range(1, round(maximum / step) + 1):
        right = index * step
        right_value = laguerre_value(degree, alpha, right)
        if left_value * right_value < 0:
            low, high, low_value = left, right, left_value
            for _ in range(55):
                middle = (low + high) / 2
                middle_value = laguerre_value(degree, alpha, middle)
                if low_value * middle_value <= 0:
                    high = middle
                else:
                    low, low_value = middle, middle_value
            roots.append((low + high) / 2)
        left, left_value = right, right_value
    return roots


def laplace_laguerre_integral(n: int) -> int:
    # Integral_0^infinity exp(-t/3)L_(n-1)^1(t)dt, evaluated from the
    # polynomial coefficients and integral t^k exp(-t/3)=k! 3^(k+1).
    return sum(
        (-1) ** k * math.comb(n, k + 1) * 3 ** (k + 1)
        for k in range(n)
    )


main_term_checks = []
for n in range(1, 21):
    integral = laplace_laguerre_integral(n)
    endpoint = 1 - (-2) ** n
    assert integral == endpoint
    main_term_checks.append({
        "n": n,
        "laplaceIntegral": integral,
        "endpointTerm": endpoint,
        "exactMatch": True,
    })

cancellation_table = []
for entry in coefficient_table:
    n = entry["n"]
    endpoint = 1 - (-2) ** n
    weighted_prime_sum = endpoint - entry["completedPrimeCoefficient"]
    cancellation_table.append({
        "n": n,
        "endpointMainTerm": endpoint,
        "threeTimesPrimeLaguerreSum": weighted_prime_sum,
        "completedPrimeRemainder": entry["completedPrimeCoefficient"],
        "relativeRemainder": abs(entry["completedPrimeCoefficient"]) / max(
            abs(endpoint), abs(weighted_prime_sum), 1
        ),
    })

laguerre_roots = {
    str(n): positive_roots(n - 1)
    for n in [5, 10, 20]
}
assert len(laguerre_roots["5"]) == 4
assert len(laguerre_roots["10"]) == 9
assert len(laguerre_roots["20"]) == 19

# Coarse exponential envelope available from only the critical strip and the
# first possible nontrivial-zero height.  It is deliberately not a claim about
# an off-line zero at that point; it quantifies why finite strip information is
# not subexponential control.
maximum_eta = 0.5
ratio = 2 * C * maximum_eta / (FIRST_ZERO**2 + C**2 + maximum_eta**2)
coarse_alpha = math.atanh(ratio)
coarse_growth_base = math.exp(coarse_alpha)
assert coarse_growth_base > 1

results = {
    "analysisDate": "2026-10-15",
    "title": "Attempting the subexponential prime-Laguerre bound",
    "question": "can the explicit endpoint-completed von Mangoldt-Laguerre sequence be proved subexponential from established prime estimates?",
    "verdict": {
        "rhProved": False,
        "subexponentialGrowthProved": False,
        "continuousMainTermCancelledExactly": True,
        "remainderReducedToChebyshevPrimeError": True,
        "positivityRouteAvailable": False,
        "finiteVerificationSufficient": False,
        "knownPntScaleSufficient": False,
        "conclusion": (
            "the endpoint exponential is exactly the Laplace transform of the continuous prime-density main term. "
            "After subtracting it, p_n is a signed Laguerre transform of psi(x)-x. Subexponential growth would "
            "follow from square-root-scale prime error or from the later, weaker-in-form critical Chebyshev-energy "
            "theorem, while established unconditional PNT error remains near the x scale. The kernel changes sign "
            "increasingly often, so positivity and termwise bounds do not close the gap."
        ),
    },
    "exactMainTermCancellation": {
        "laguerreIntegral": (
            "3 integral_1^infinity x^(-2)L_(n-1)^1(3log x)dx="
            "integral_0^infinity exp(-t/3)L_(n-1)^1(t)dt=1-(-2)^n"
        ),
        "endpointTerm": "1+(-1)^(n+1)2^n=1-(-2)^n",
        "interpretation": (
            "the large endpoint term is not an added reservoir; it is exactly the transform of d x, the continuous "
            "main term of d psi(x)"
        ),
        "checks": main_term_checks,
    },
    "primeErrorIdentity": {
        "definitions": "psi(x)=sum_(m<=x)Lambda(m), E_tilde(x)=psi(x)-(x-1), f_n(x)=x^(-2)L_(n-1)^1(3log x)",
        "stieltjesForm": "p_n=-3 integral_1^infinity f_n(x)dE_tilde(x)",
        "integratedForm": (
            "p_n=-3 integral_1^infinity E_tilde(x)x^(-3)[2L_(n-1)^1(3log x)+"
            "3L_(n-2)^2(3log x)]dx"
        ),
        "boundaryCondition": "E_tilde(1)=0 and the boundary at infinity vanishes under the standard prime number theorem",
        "meaning": "the desired coefficient bound is now entirely a uniform oscillatory estimate for psi(x)-x",
    },
    "finiteCancellationDiagnostics": {
        "table": cancellation_table,
        "status": (
            "the first ten coefficients show strong endpoint/main-prime cancellation, but a finite table cannot "
            "bound the radius of convergence"
        ),
    },
    "failedProofRoutes": {
        "termwiseAbsoluteValues": {
            "status": "fails",
            "reason": (
                "absolute values destroy the cancellation between 1-(-2)^n and the transformed continuous prime density, "
                "leaving an exponential scale"
            ),
        },
        "kernelPositivity": {
            "status": "fails",
            "reason": (
                "L_(n-1)^1 has n-1 positive roots and alternates sign; the differentiated kernel also changes sign"
            ),
            "samplePositiveRoots": laguerre_roots,
        },
        "ordinaryPntError": {
            "status": "insufficient",
            "reason": (
                "a classical error of x times a decaying subpower factor remains much larger than the square-root "
                "scale required to exclude zeros with real part above one half"
            ),
        },
        "finiteZeroVerification": {
            "status": "insufficient",
            "reason": (
                "verification to any finite height only makes a possible exponential rate extremely small; it does not make it zero"
            ),
            "coarseStripAndFirstHeightEnvelope": {
                "logGrowthRate": coarse_alpha,
                "growthBase": coarse_growth_base,
                "description": (
                    "using only |eta|<1/2 and gamma>=the first-zero ordinate gives a base above one, not a subexponential bound"
                ),
            },
        },
    },
    "equivalentPrimeErrorTarget": {
        "sufficientBound": "psi(x)-x=O(x^(1/2) log^2 x)",
        "status": "this square-root-scale estimate follows from RH and, in standard explicit-formula form, is equivalent to RH",
        "consequenceForSequence": "it yields subexponential p_n; conversely subexponential p_n excludes every zero with Re(rho)>1/2 and hence implies RH",
        "whyCurrentInputStops": (
            "the established framework supplies no square-root prime-error estimate, no positive Laguerre kernel, "
            "and no uniform cancellation theorem in n"
        ),
    },
    "proofBoundary": {
        "provedHere": [
            "the continuous prime-density transform cancels the endpoint exponential exactly",
            "the remainder is an exact signed transform of psi(x)-x",
            "the Laguerre kernels have increasing sign variation",
            "finite verification and fixed-index convergence cannot imply the required radius bound",
        ],
        "notProved": "p_n=exp(o(n))",
        "status": (
            "completing the requested proof now requires a new square-root-scale theorem for the prime error or an "
            "equivalent uniform cancellation theorem; neither is available in the conversation or derived by TTI"
        ),
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Prime-Laguerre growth proof attempt complete.")
print("  Continuous density main term: cancels 1-(-2)^n exactly for n=1,...,20.")
print("  Remaining object: signed Laguerre transform of psi(x)-(x-1).")
print(f"  L_19^1 sign structure: {len(laguerre_roots['20'])} positive roots.")
print(f"  Coarse finite-information growth base: {coarse_growth_base:.12f} > 1.")
print("  Verdict: subexponential growth not proved; an RH-strength prime-error theorem remains missing.")
