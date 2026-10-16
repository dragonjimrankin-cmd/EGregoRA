#!/usr/bin/env python3
"""Thirtieth-stage search for a support-changing splice law.

The established Rankin feature amplitudes define a normalized zeta exponential
family. Its Fisher-natural gradient toward the critical member is computed
exactly. The resulting Markov transport sends eta to exp(-t) eta and therefore
realizes the golden support contraction at t=log(phi). The program also audits
why invariance of the actual xi zero ledger remains the missing RH-equivalent
statement and stress-tests an exact pure-state channel lift.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-kappa-natural-gradient-flow-results.json"

phi = (1 + math.sqrt(5)) / 2
c = 1 / phi
golden_time = math.log(phi)
kappa_r = 1 / (4 * math.pi**2)


def zeta(x: float) -> float:
    """Real zeta for x>1 via Euler-Maclaurin."""
    n_cut = 128
    total = math.fsum(n ** (-x) for n in range(1, n_cut))
    total += n_cut ** (1 - x) / (x - 1) + 0.5 * n_cut ** (-x)
    bernoulli = [
        1 / 6,
        -1 / 30,
        1 / 42,
        -1 / 30,
        5 / 66,
        -691 / 2730,
        7 / 6,
        -3617 / 510,
    ]
    rising = x
    factorial = 2.0
    for order, bernoulli_number in enumerate(bernoulli, start=1):
        if order > 1:
            rising *= (x + 2 * order - 3) * (x + 2 * order - 2)
            factorial *= (2 * order - 1) * (2 * order)
        total += (
            bernoulli_number
            * rising
            / factorial
            * n_cut ** (-x - 2 * order + 1)
        )
    return total


assert abs(zeta(3) - 1.2020569031595942) < 2e-15


def log_zeta(a: float) -> float:
    return math.log(zeta(a))


def derivative_one(a: float, h: float = 1e-4) -> float:
    return (
        log_zeta(a - 2 * h)
        - 8 * log_zeta(a - h)
        + 8 * log_zeta(a + h)
        - log_zeta(a + 2 * h)
    ) / (12 * h)


def derivative_two(a: float, h: float = 5e-4) -> float:
    return (
        -log_zeta(a + 2 * h)
        + 16 * log_zeta(a + h)
        - 30 * log_zeta(a)
        + 16 * log_zeta(a - h)
        - log_zeta(a - 2 * h)
    ) / (12 * h * h)


def feature_kl_to_centre(eta: float) -> float:
    # pi_eta(n)=n^(-a)/zeta(a), a=3+2eta.
    a = 3 + 2 * eta
    return (a - 3) * derivative_one(a) - log_zeta(a) + log_zeta(3)


def fisher_metric(eta: float) -> float:
    # Fisher information in the eta parameter.
    return 4 * derivative_two(3 + 2 * eta)


def natural_gradient_velocity(eta: float) -> float:
    # d_eta KL=4 eta L'' and I_eta=4L'', hence -I^-1 dKL=-eta.
    return -eta


def normalized_overlap(eta_one: float, eta_two: float) -> float:
    return zeta(3 + eta_one + eta_two) / math.sqrt(
        zeta(3 + 2 * eta_one) * zeta(3 + 2 * eta_two)
    )


def ldl_pivots(matrix: list[list[float]]) -> list[float]:
    size = len(matrix)
    lower = [[0.0] * size for _ in range(size)]
    diagonal = [0.0] * size
    for row in range(size):
        lower[row][row] = 1.0
        diagonal[row] = matrix[row][row] - math.fsum(
            lower[row][k] ** 2 * diagonal[k] for k in range(row)
        )
        for below in range(row + 1, size):
            numerator = matrix[below][row] - math.fsum(
                lower[below][k] * lower[row][k] * diagonal[k]
                for k in range(row)
            )
            lower[below][row] = numerator / diagonal[row]
    return diagonal


flow_rows = []
for eta in [-0.49, -0.4, -0.25, -0.1, 0.1, 0.25, 0.4, 0.49]:
    contracted = c * eta
    metric = fisher_metric(eta)
    derivative_kl = 4 * eta * derivative_two(3 + 2 * eta)
    velocity = -derivative_kl / metric
    before = feature_kl_to_centre(eta)
    after = feature_kl_to_centre(contracted)
    flow_rows.append({
        "eta": eta,
        "zetaExponent": 3 + 2 * eta,
        "featureRelativeEntropy": before,
        "fisherMetric": metric,
        "relativeEntropyDerivative": derivative_kl,
        "naturalGradientVelocity": velocity,
        "etaAtGoldenTime": contracted,
        "relativeEntropyAtGoldenTime": after,
        "relativeEntropyRatio": after / before,
        "dissipationRate": -4 * eta * eta * derivative_two(3 + 2 * eta),
    })

assert all(row["featureRelativeEntropy"] > 0 for row in flow_rows)
assert all(row["fisherMetric"] > 0 for row in flow_rows)
assert all(
    abs(row["naturalGradientVelocity"] + row["eta"]) < 2e-15
    for row in flow_rows
)
assert all(row["relativeEntropyAtGoldenTime"] < row["featureRelativeEntropy"] for row in flow_rows)
assert all(row["dissipationRate"] < 0 for row in flow_rows)
assert abs(math.exp(-golden_time) - c) < 1e-15

# A necessary Gram-factor condition for one CPTP map to send every normalized
# pure feature state |v_eta> exactly to |v_c eta> is positivity of
# Q_ij=<v_i,v_j>/<v_ci,v_cj>. A robust negative LDL pivot on a five-point
# family is a numerical obstruction to that exact pure-state lift.
channel_points = [-0.4, -0.2, 0.0, 0.2, 0.4]
quotient_matrix = [
    [
        normalized_overlap(eta_one, eta_two)
        / normalized_overlap(c * eta_one, c * eta_two)
        for eta_two in channel_points
    ]
    for eta_one in channel_points
]
quotient_pivots = ldl_pivots(quotient_matrix)
assert min(quotient_pivots) < -1e-7

# Coordinate-flow diagnostics. The semigroup is deterministic and preserves
# gamma while changing horizontal support.
semigroup_rows = []
for time in [0.0, golden_time, 1.0, 2.0, 5.0]:
    factor = math.exp(-time)
    semigroup_rows.append({
        "time": time,
        "horizontalFactor": factor,
        "etaFromQuarter": 0.25 * factor,
        "secondMomentFactor": factor * factor,
    })

results = {
    "analysisDate": "2026-10-15",
    "title": "A support-changing natural-gradient flow in the established kappa geometry",
    "question": "can the kappa entropy geometry produce a law with the critical-line ledger as unique invariant state?",
    "verdict": {
        "rhProved": False,
        "supportChangingLawFound": True,
        "criticalLineUniqueInvariantForFiniteProbabilityLedgers": True,
        "goldenContractionRecovered": True,
        "sameXiLedgerInvarianceProved": False,
        "primeSideStationarityProved": False,
        "exactGlobalPureStateChannelLiftFound": False,
        "conclusion": (
            "The normalized Rankin feature family has a canonical Fisher-natural gradient of relative entropy. "
            "It gives d eta/dt=-eta, hence eta(t)=exp(-t)eta(0), and at t=log(phi) gives the exact golden "
            "support contraction. Delta at eta=0 is its unique invariant finite-probability ledger. However, "
            "proving that the actual completed xi zero ledger is invariant under this support-changing flow is "
            "RH-equivalent and is not supplied by the functional equation or the prime ledger."
        ),
    },
    "establishedGeometry": {
        "kappaR": kappa_r,
        "kernel": "K_kappa(s,t)=kappa_R zeta(s+conjugate(t)+2)",
        "normalizedFeatureDistribution": "pi_eta(n)=n^(-3-2eta)/zeta(3+2eta)",
        "centreDistribution": "pi_0(n)=n^(-3)/zeta(3)",
        "note": "kappa_R is retained as derived; its global scalar cancels when feature intensities are normalized to probabilities",
    },
    "informationGeometry": {
        "logPartition": "L(a)=log zeta(a), a=3+2eta",
        "relativeEntropy": "D(pi_eta||pi_0)=2eta L'(3+2eta)-L(3+2eta)+L(3)",
        "relativeEntropyDerivative": "dD/deta=4eta L''(3+2eta)",
        "fisherMetric": "I(eta)=4L''(3+2eta)=4 Var_pi_eta(log n)",
        "naturalGradient": "deta/dt=-I(eta)^(-1)dD/deta=-eta",
        "dissipation": "dD/dt=-4eta^2 L''(3+2eta)<0 for eta nonzero",
        "rows": flow_rows,
    },
    "supportSemigroup": {
        "map": "T_t(eta,gamma)=(exp(-t)eta,gamma)",
        "markovKernel": "K_t((eta,gamma),deta' dgamma')=delta_(exp(-t)eta,gamma)",
        "generator": "L f(eta,gamma)=-eta partial_eta f(eta,gamma)",
        "fokkerPlanck": "partial_t mu=partial_eta(eta mu)",
        "semigroupLaw": "T_(t+u)=T_t composed with T_u",
        "preservesCriticalStrip": True,
        "commutesWithReflection": True,
        "rows": semigroup_rows,
    },
    "goldenTime": {
        "time": golden_time,
        "identity": "t_phi=log(phi)",
        "factor": math.exp(-golden_time),
        "factorIdentity": "exp(-t_phi)=1/phi",
        "map": "eta -> eta/phi",
    },
    "uniqueInvariantAudit": {
        "statement": (
            "if a finite probability ledger mu with finite second moment satisfies T_t push(mu)=mu for one t>0, then mu is supported at eta=0"
        ),
        "proof": (
            "invariance gives integral eta^2 dmu=exp(-2t) integral eta^2 dmu; because exp(-2t)<1, the second moment is zero"
        ),
        "applicationToXi": (
            "for each finite-height normalized zero ledger, invariance would force every represented zero onto the critical line"
        ),
        "status": "the invariant-measure statement is a conditional RH proof, not a derived invariance law for xi",
    },
    "xiBridgeAudit": {
        "functionalEquation": "proves reflection symmetry eta <-> -eta, not invariance under eta -> exp(-t)eta",
        "quartetEffect": "contracting eta changes the quartet polynomial coefficients and therefore changes the completed entire function",
        "holomorphicBoundary": "the horizontal flow keeps gamma fixed and is nonholomorphic as a map of s",
        "primeBoundary": "no principal von Mangoldt identity has been shown stationary under this flow",
        "noBirthBoundary": "the constructed transport has no births by definition, but identifying its transported ledger with the same xi ledger is unproved",
    },
    "pureStateLiftDiagnostic": {
        "necessaryCondition": (
            "for one CPTP map sending every normalized pure v_eta to pure v_(c eta), the environment overlap quotient Q_ij=C(eta_i,eta_j)/C(c eta_i,c eta_j) must be positive semidefinite"
        ),
        "points": channel_points,
        "ldlPivots": quotient_pivots,
        "minimumPivot": min(quotient_pivots),
        "interpretation": (
            "the negative five-point pivot is a finite numerical obstruction to an exact global pure-state channel lift; it is not a directed-rounding impossibility proof"
        ),
    },
    "openSystemBoundary": {
        "deterministicNature": (
            "the support semigroup compresses spectral-coordinate distributions; their differential entropy decreases, so an environment must receive the missing information"
        ),
        "additiveNoise": (
            "adding ordinary diffusion produces a nonzero-width stationary law rather than delta at the critical line and can leak toward the strip boundary"
        ),
        "neededCompletion": [
            "derive this natural-gradient transport from the physical splice rather than select it from information geometry alone",
            "prove the completed xi zero ledger or an equivalent prime-side functional is stationary under it",
            "lift the law consistently to the completed entire function or supply a controlled open-system replacement",
            "retain the no-birth property at unbounded height",
        ],
    },
    "status": (
        "a canonical support-changing candidate with unique critical invariant has been found; its same-xi or principal-prime invariance remains unproved, so RH remains open"
    ),
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Kappa natural-gradient support-flow attempt complete.")
print("  Derived flow: d eta/dt=-eta.")
print(f"  Golden time: log(phi)={golden_time:.12f}; factor={c:.12f}.")
print("  Unique finite-probability invariant: eta=0.")
print(f"  Pure-state lift diagnostic minimum pivot: {min(quotient_pivots):.3e}.")
print("  Same-xi/prime stationarity: not derived; RH remains open.")
