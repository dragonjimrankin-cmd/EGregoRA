#!/usr/bin/env python3
"""Twenty-ninth-stage entropy test in the established Rankin kappa geometry.

This program does not derive a new K. It uses kappa_R=(2*pi)^(-2), the
existing Dirichlet Gram feature v_s(n)=sqrt(kappa_R)n^(-s-1), and the exact
decimal/golden random-reflection channel. It distinguishes contraction of a
branch imbalance from movement of spectral support.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-kappa-entropy-splice-results.json"

phi = (1 + math.sqrt(5)) / 2
kappa_r = 1 / (4 * math.pi**2)
p_stay = phi / 2
p_flip = 1 - p_stay
contrast = p_stay - p_flip  # 1/phi

assert abs(contrast - 1 / phi) < 1e-15
assert 0 < p_flip < p_stay < 1


def binary_entropy_from_bias(m: float) -> float:
    """Shannon entropy in nats for probabilities ((1+m)/2,(1-m)/2)."""
    values = ((1 + m) / 2, (1 - m) / 2)
    return -sum(x * math.log(x) for x in values if x > 0)


def kl_to_uniform(m: float) -> float:
    return math.log(2) - binary_entropy_from_bias(m)


# Golden binary-symmetric channel on the identity/reflection branch label.
# P[[a,b]] has eigenvalues 1 and p_stay-p_flip=1/phi.
channel = [[p_stay, p_flip], [p_flip, p_stay]]
stationary = [0.5, 0.5]
assert all(abs(sum(row) - 1) < 1e-15 for row in channel)
assert all(
    abs(sum(stationary[i] * channel[i][j] for i in range(2)) - stationary[j]) < 1e-15
    for j in range(2)
)

branch_rows = []
for m in [1.0, 0.8, 0.5, 0.2, 0.1, 0.01]:
    after = contrast * m
    before_kl = kl_to_uniform(m)
    after_kl = kl_to_uniform(after)
    branch_rows.append({
        "inputBias": m,
        "outputBias": after,
        "entropyBeforeNats": binary_entropy_from_bias(m),
        "entropyAfterNats": binary_entropy_from_bias(after),
        "entropyProductionNats": binary_entropy_from_bias(after) - binary_entropy_from_bias(m),
        "relativeEntropyBefore": before_kl,
        "relativeEntropyAfter": after_kl,
        "relativeEntropyRatio": after_kl / before_kl,
        "cSquaredUpperBound": contrast**2,
    })

assert all(row["entropyProductionNats"] > 0 for row in branch_rows)
assert all(row["relativeEntropyRatio"] <= contrast**2 + 2e-13 for row in branch_rows)


def zeta(x: float) -> float:
    """Real zeta for x>1 via Euler-Maclaurin, with double-precision accuracy."""
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


def kappa_distance_to_centre(eta: float) -> float:
    # ||v_(1/2+eta+i gamma)-v_(1/2+i gamma)||^2; gamma cancels.
    return kappa_r * (zeta(3 + 2 * eta) - 2 * zeta(3 + eta) + zeta(3))


def normalized_reflection_overlap(eta: float) -> float:
    return zeta(3) / math.sqrt(zeta(3 + 2 * eta) * zeta(3 - 2 * eta))


def binary_von_neumann_entropy(lam: float) -> float:
    return -sum(x * math.log(x) for x in (lam, 1 - lam) if x > 0)


def dephased_pair_entropy(eta: float, weight: float) -> float:
    overlap = normalized_reflection_overlap(eta)
    discriminant = math.sqrt(1 - 4 * weight * (1 - weight) * (1 - overlap**2))
    eigenvalue = (1 + discriminant) / 2
    return binary_von_neumann_entropy(eigenvalue)


def mixer_feature_residual(eta: float) -> float:
    # ||p v_eta+(1-p)v_-eta-v_(c eta)||^2 in the existing kappa Hilbert space.
    p = p_stay
    q = p_flip
    c = contrast
    return kappa_r * (
        p * p * zeta(3 + 2 * eta)
        + q * q * zeta(3 - 2 * eta)
        + zeta(3 + 2 * c * eta)
        + 2 * p * q * zeta(3)
        - 2 * p * zeta(3 + (1 + c) * eta)
        - 2 * q * zeta(3 - (1 - c) * eta)
    )


kappa_rows = []
for eta in [0.01, 0.1, 0.25, 0.4, 0.49]:
    overlap = normalized_reflection_overlap(eta)
    distance_plus = kappa_distance_to_centre(eta)
    distance_minus = kappa_distance_to_centre(-eta)
    contracted_distance = kappa_distance_to_centre(contrast * eta)
    random_reflection_expected_distance = p_stay * distance_plus + p_flip * distance_minus
    equal_pair_energy = 0.5 * (distance_plus + distance_minus)
    kappa_rows.append({
        "eta": eta,
        "normalizedReflectionOverlap": overlap,
        "equalPairVonNeumannEntropyNats": dephased_pair_entropy(eta, 0.5),
        "goldenOutputVonNeumannEntropyNats": dephased_pair_entropy(eta, p_stay),
        "equalPairEntropyAfterCoordinateContractionNats": dephased_pair_entropy(contrast * eta, 0.5),
        "distanceToCentrePlus": distance_plus,
        "distanceToCentreMinus": distance_minus,
        "distanceUnderAssumedCoordinateContraction": contracted_distance,
        "coordinateContractionRatio": contracted_distance / distance_plus,
        "randomReflectionExpectedDistance": random_reflection_expected_distance,
        "randomReflectionDistanceRatioFromPlus": random_reflection_expected_distance / distance_plus,
        "stationaryEqualPairEnergy": equal_pair_energy,
        "featureMixerResidual": mixer_feature_residual(eta),
    })

assert all(0 < row["normalizedReflectionOverlap"] < 1 for row in kappa_rows)
assert all(row["equalPairVonNeumannEntropyNats"] > 0 for row in kappa_rows)
assert all(
    row["equalPairEntropyAfterCoordinateContractionNats"]
    < row["equalPairVonNeumannEntropyNats"]
    for row in kappa_rows
)
assert all(row["coordinateContractionRatio"] < 1 for row in kappa_rows)
assert all(row["randomReflectionDistanceRatioFromPlus"] > 1 for row in kappa_rows)
assert all(row["featureMixerResidual"] > 0 for row in kappa_rows)

# The normalized K_kappa Gram geometry is not globally invariant under
# horizontal reflection. Thus reflection is not one global unitary on the
# established feature space, even though each individual xi zero quartet is
# reflection symmetric.
def normalized_cross_overlap(eta_one: float, eta_two: float) -> float:
    return zeta(3 + eta_one + eta_two) / math.sqrt(
        zeta(3 + 2 * eta_one) * zeta(3 + 2 * eta_two)
    )


reflection_tests = []
for eta_one, eta_two in [(0.1, 0.2), (0.1, 0.4), (-0.15, 0.3)]:
    before = normalized_cross_overlap(eta_one, eta_two)
    after = normalized_cross_overlap(-eta_one, -eta_two)
    reflection_tests.append({
        "etaOne": eta_one,
        "etaTwo": eta_two,
        "overlapBeforeReflection": before,
        "overlapAfterReflection": after,
        "absoluteDifference": abs(after - before),
    })
assert any(row["absoluteDifference"] > 1e-7 for row in reflection_tests)

# Finite grid stress check of the strong binary data-processing inequality.
max_kl_ratio = 0.0
for index in range(1, 10000):
    m = index / 10000
    max_kl_ratio = max(max_kl_ratio, kl_to_uniform(contrast * m) / kl_to_uniform(m))
assert max_kl_ratio <= contrast**2 + 2e-9

results = {
    "analysisDate": "2026-10-15",
    "title": "Entropy production in the established Rankin kappa-kernel geometry",
    "question": "can splice entropy provide strict contraction while leaving the completed xi ledger invariant?",
    "verdict": {
        "rhProved": False,
        "newKernelDerived": False,
        "existingKappaKernelUsed": True,
        "completedXiLedgerInvariantUnderRandomReflection": True,
        "strictBranchEntropyContractionDerived": True,
        "zeroSupportContracted": False,
        "uniqueCriticalLineInvariantStateDerived": False,
        "conclusion": (
            "The golden random-reflection channel has exact entropy production and contracts every antisymmetric "
            "branch bias by 1/phi; the completed xi ledger is invariant because it is already reflection symmetric. "
            "But every equal off-line quartet is also invariant. In the established kappa geometry the channel "
            "does not uniformly contract distance to the critical feature, and the feature barycentre is not the "
            "feature at the contracted coordinate. Entropy removes branch-label information, not horizontal support."
        ),
    },
    "establishedGeometry": {
        "kappaR": kappa_r,
        "kappaIdentity": "kappa_R=(2pi)^(-2)=1/(4pi^2)",
        "kernel": "K_kappa(s,t)=kappa_R zeta(s+conjugate(t)+2)",
        "feature": "v_s(n)=sqrt(kappa_R)n^(-s-1)",
        "notRederived": "this stage uses the previously derived kappa value and kernel",
    },
    "goldenRandomReflectionChannel": {
        "matrix": channel,
        "stayWeight": p_stay,
        "flipWeight": p_flip,
        "eigenvalues": [1.0, contrast],
        "contrast": contrast,
        "stationaryDistribution": stationary,
        "biasLaw": "m -> (p-q)m=m/phi",
        "strongDataProcessing": (
            "D(Pmu||uniform)<=phi^(-2)D(mu||uniform), with strict inequality away from the uniform state"
        ),
        "proof": (
            "for binary bias m, D''(m)=1/(1-m^2); the second derivative of c^2D(m)-D(cm) is nonnegative"
        ),
        "rows": branch_rows,
        "maxStressTestRatio": max_kl_ratio,
    },
    "xiLedgerInvariance": {
        "reflection": "R(eta,gamma)=(-eta,gamma)",
        "functionalEquationConsequence": "the completed xi zero counting measure satisfies R_push(mu_xi)=mu_xi",
        "channelOnMeasures": "S_push(mu)=p mu+(1-p)R_push(mu)",
        "invariance": "S_push(mu_xi)=mu_xi",
        "fixedPointSet": "every reflection-symmetric measure, including every off-line quartet ledger",
        "decisiveLimitation": (
            "strict contraction acts only on antisymmetric branch imbalance; xi already has zero branch imbalance even if RH is false"
        ),
    },
    "kappaPairGeometry": {
        "reflectionOverlap": (
            "r(eta)=zeta(3)/sqrt(zeta(3+2eta)zeta(3-2eta)); strict log convexity gives r<1 off the line"
        ),
        "distanceToCriticalFeature": (
            "E_kappa(eta)=kappa_R[zeta(3+2eta)-2zeta(3+eta)+zeta(3)]"
        ),
        "featureMixerNonidentity": (
            "p v_eta+(1-p)v_-eta is not v_(eta/phi); the reported residual is strictly positive"
        ),
        "entropyInterpretation": (
            "dephasing a reflected feature pair creates positive von Neumann entropy off the line, but the equal mixture is stationary at every eta"
        ),
        "rows": kappa_rows,
    },
    "globalReflectionAudit": {
        "tests": reflection_tests,
        "conclusion": (
            "normalized K_kappa overlaps are not preserved by reflecting all horizontal coordinates, so no single global reflection unitary is supplied by this RKHS"
        ),
    },
    "twoPassNoGo": {
        "spliceLaw": "R^2=I",
        "statement": (
            "an exact involution cannot satisfy a strict global data-processing contraction D(Rx,Ry)<=lambda D(x,y) with lambda<1"
        ),
        "proof": (
            "applying the inequality twice gives D(x,y)<=lambda^2D(x,y), impossible for a separated pair"
        ),
        "consequence": (
            "entropy production requires coarse graining or an environment; the enlarged reversible two-pass state retains the information"
        ),
    },
    "boundedTransformBoundary": {
        "existingResult": (
            "K_kappa feature norms are bounded at the critical boundary, whereas K_xi diverges near every critical-line zero"
        ),
        "consequence": (
            "a bounded stochastic or quantum channel on K_kappa cannot produce the full K_xi geometry; the exact conversion uses an unbounded inverse-Green operation"
        ),
        "remainingPositivity": (
            "global positivity of the arithmetic screw kernel G_g, needed to extend the Gram representation to the critical half-plane, remains RH-equivalent"
        ),
    },
    "sharpenedRequirement": {
        "neededObject": (
            "a support-changing open-system semigroup derived from splice dynamics, with the critical-line ledger as its unique invariant state"
        ),
        "requirements": [
            "move horizontal support rather than only randomize identity/reflection labels",
            "derive the channel in the established kappa/arithmetic screw geometry without assuming Weil positivity",
            "account for environmental entropy while proving no zero support enters from infinity",
            "recover the principal completed prime channel rather than only a reflected or period-20 mode",
        ],
        "status": "the natural entropy channel is derived and audited, but its fixed-point set is too large; RH remains open",
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Kappa-entropy splice attempt complete.")
print(f"  Existing coupling: kappa_R={kappa_r:.12f}.")
print(f"  Golden branch bias: m -> {contrast:.12f} m.")
print(f"  KL contraction coefficient: c^2={contrast**2:.12f}.")
print("  Xi ledger: invariant under random reflection, but not uniquely.")
print("  Kappa distance: not uniformly contracted by the branch channel.")
print("  Verdict: entropy contracts labels, not zero support; RH remains open.")
