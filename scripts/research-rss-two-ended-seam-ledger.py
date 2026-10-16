#!/usr/bin/env python3
"""Twentieth-stage continuation of the final three RH routes.

This investigation strengthens the order-one ledger obstruction, tests actual
consecutive and one-carrier theta refinements on the positive spectral axis,
and rewrites the Blaschke seam marker as a two-ended Poisson-kernel ledger.
Only the Python standard library is used.
"""

from __future__ import annotations

import cmath
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-two-ended-seam-ledger-results.json"
PI = math.pi
PHI = (1 + math.sqrt(5)) / 2
T_MAX = 30.0
NUMERICAL_CARRIER_LIMIT = 16


def fibonacci(index: int) -> int:
    left, right = 0, 1
    for _ in range(index):
        left, right = right, left + right
    return left


def gauss_legendre(count: int, lower: float, upper: float) -> tuple[list[float], list[float]]:
    nodes = [0.0] * count
    weights = [0.0] * count
    midpoint = (lower + upper) / 2
    for index in range(1, (count + 1) // 2 + 1):
        root = math.cos(PI * (index - 0.25) / (count + 0.5))
        while True:
            p1, p2 = 1.0, 0.0
            for degree in range(1, count + 1):
                p3, p2 = p2, p1
                p1 = ((2 * degree - 1) * root * p2 - (degree - 1) * p3) / degree
            derivative = count * (root * p1 - p2) / (root * root - 1)
            previous = root
            root -= p1 / derivative
            if abs(root - previous) < 1e-15:
                break
        weight = (upper - lower) / ((1 - root * root) * derivative * derivative)
        nodes[index - 1] = midpoint - (upper - lower) * root / 2
        nodes[count - index] = midpoint + (upper - lower) * root / 2
        weights[index - 1] = weight
        weights[count - index] = weight
    return nodes, weights


class ThetaCompletion:
    def __init__(self, carrier_weights: dict[int, float], quadrature_count: int = 256):
        nodes, weights = gauss_legendre(quadrature_count, 0.0, 6.0)
        self.features: list[tuple[float, float]] = []
        for u, quadrature_weight in zip(nodes, weights):
            x = math.exp(u)
            theta = sum(
                admitted * math.exp(-PI * carrier * carrier * x)
                for carrier, admitted in carrier_weights.items()
            )
            self.features.append((u, quadrature_weight * 2 * math.exp(u / 4) * theta))

    def value(self, s: complex) -> complex:
        centered = s - 0.5
        integral = sum(weight * cmath.cosh(centered * u / 2) for u, weight in self.features)
        return 0.5 + 0.5 * (centered * centered - 0.25) * integral


def deficit_weights(cutoff: int) -> dict[int, float]:
    """Zeroth-seed, chronological, repeated-deficit-halving carrier weights."""
    carrier_end = 0
    result: dict[int, float] = {}
    for level in range(cutoff + 1):
        cohort_size = 1 if level == 0 else fibonacci(level)
        depth = level
        ticks = cutoff - level
        base_gap = PHI ** (-(depth + ticks))
        repeated_factor = 1.0 if level == 0 else 2.0 ** (-cutoff)
        admitted = 1 - base_gap * repeated_factor
        start = carrier_end + 1
        carrier_end += cohort_size
        for carrier in range(start, min(carrier_end, NUMERICAL_CARRIER_LIMIT) + 1):
            result[carrier] = admitted
        if carrier_end >= NUMERICAL_CARRIER_LIMIT:
            break
    return result


def full_carrier_weights(carrier_count: int) -> dict[int, float]:
    return {carrier: 1.0 for carrier in range(1, carrier_count + 1)}


def rectangle_boundary() -> list[complex]:
    horizontal_steps, vertical_steps = 250, 1500
    points = [complex(index / horizontal_steps, 0) for index in range(horizontal_steps)]
    points += [complex(1, T_MAX * index / vertical_steps) for index in range(vertical_steps)]
    points += [complex(1 - index / horizontal_steps, T_MAX) for index in range(horizontal_steps)]
    points += [complex(0, T_MAX * (1 - index / vertical_steps)) for index in range(vertical_steps + 1)]
    return points


BOUNDARY = rectangle_boundary()


def argument_count(completion: ThetaCompletion) -> dict[str, float | int]:
    values = [completion.value(point) for point in BOUNDARY]
    increments = [cmath.phase(right / left) for left, right in zip(values, values[1:])]
    winding = sum(increments) / (2 * PI)
    count = round(winding)
    assert abs(winding - count) < 1e-9
    assert max(abs(increment) for increment in increments) < 0.08
    assert min(abs(value) for value in values) > 1e-9
    return {
        "winding": winding,
        "zeroCount": count,
        "maximumBoundaryPhaseStep": max(abs(increment) for increment in increments),
        "minimumBoundaryMagnitude": min(abs(value) for value in values),
    }


def critical_line_roots(completion: ThetaCompletion, spacing: float = 0.005) -> list[float]:
    def line_value(gamma: float) -> float:
        value = completion.value(complex(0.5, gamma))
        assert abs(value.imag) < 1e-12
        return value.real

    roots: list[float] = []
    left, left_value = 0.0, line_value(0.0)
    for index in range(1, round(T_MAX / spacing) + 1):
        right = index * spacing
        right_value = line_value(right)
        if left_value * right_value < 0:
            low, high, low_value = left, right, left_value
            for _ in range(58):
                middle = (low + high) / 2
                middle_value = line_value(middle)
                if low_value * middle_value <= 0:
                    high = middle
                else:
                    low, low_value = middle, middle_value
            roots.append((low + high) / 2)
        left, left_value = right, right_value
    return roots


def diagnose(weights: dict[int, float], quadrature_count: int = 256) -> dict[str, object]:
    completion = ThetaCompletion(weights, quadrature_count)
    roots = critical_line_roots(completion)
    count = argument_count(completion)
    assert count["zeroCount"] == len(roots)
    return {
        "criticalLineRootsThroughHeight30": roots,
        "argumentPrinciple": count,
        "offLineZerosDetectedInRectangle": count["zeroCount"] - len(roots),
    }


def labelled_order(left: list[float], right: list[float], left_label: str, right_label: str) -> list[dict[str, float | str]]:
    return [
        {"root": root, "family": family}
        for root, family in sorted(
            [(root, left_label) for root in left] + [(root, right_label) for root in right]
        )
    ]


def strictly_alternates(order: list[dict[str, float | str]]) -> bool:
    return all(order[index]["family"] != order[index - 1]["family"] for index in range(1, len(order)))


# Route 1: exact dyadic curvature and divisor/order rigidity.
exact_curvature_coefficient = 4 + 3 * math.sqrt(2)
p2_curvature = -exact_curvature_coefficient * math.log(2) ** 2
gaussian_coefficient = -p2_curvature / 2
assert abs(p2_curvature + 3.960201560771257) < 1e-14


def dyadic_factor(s: complex) -> complex:
    return 1 - cmath.exp(-s * math.log(2))


def symmetric_dyadic_factor(s: complex) -> complex:
    return dyadic_factor(s) * dyadic_factor(1 - s)


symmetry_errors = [
    abs(symmetric_dyadic_factor(sample) - symmetric_dyadic_factor(1 - sample))
    for sample in [complex(0.2, 3), complex(0.5, 8), complex(1.3, -2)]
]
assert max(symmetry_errors) < 1e-13
boundary_divisor_samples = [
    {
        "k": k,
        "leftBoundaryZero": [0.0, 2 * PI * k / math.log(2)],
        "rightBoundaryZero": [1.0, 2 * PI * k / math.log(2)],
    }
    for k in range(-2, 3)
]

# Route 2: consecutive stages and literal one-carrier additions.
stage14 = diagnose(deficit_weights(14))
stage15 = diagnose(deficit_weights(15))
stage14_low_resolution = diagnose(deficit_weights(14), 192)
stage15_low_resolution = diagnose(deficit_weights(15), 192)
for high, low in [(stage14, stage14_low_resolution), (stage15, stage15_low_resolution)]:
    assert len(high["criticalLineRootsThroughHeight30"]) == len(low["criticalLineRootsThroughHeight30"])
    assert max(abs(a - b) for a, b in zip(
        high["criticalLineRootsThroughHeight30"], low["criticalLineRootsThroughHeight30"]
    )) < 1e-9
stage_order = labelled_order(
    stage14["criticalLineRootsThroughHeight30"],
    stage15["criticalLineRootsThroughHeight30"],
    "N14",
    "N15",
)
stage_alternation = strictly_alternates(stage_order)
assert stage_alternation is False
assert [entry["family"] for entry in stage_order] == ["N15", "N14", "N14", "N15"]

carrier1 = diagnose(full_carrier_weights(1))
carrier2 = diagnose(full_carrier_weights(2))
carrier_order = labelled_order(
    carrier1["criticalLineRootsThroughHeight30"],
    carrier2["criticalLineRootsThroughHeight30"],
    "M1",
    "M2",
)
carrier_alternation = strictly_alternates(carrier_order)
assert carrier_alternation is False
assert [entry["family"] for entry in carrier_order] == ["M2", "M1", "M1", "M2", "M2"]

# Route 3: the exact two-ended Poisson seam ledger.
def seam_quantities(eta: float, gamma: float) -> dict[str, float]:
    theta = PI * eta
    cosine = math.cos(theta)
    p_plus = math.exp(-PI * gamma) * cosine
    p_minus = math.exp(PI * gamma) * cosine
    raw_endpoint_product = p_plus * p_minus
    endpoint_product = cosine * cosine
    distance = math.atanh(abs(math.sin(theta)))
    defect = -math.log(endpoint_product)
    assert abs(raw_endpoint_product - endpoint_product) < 1e-13
    assert abs(endpoint_product - 1 / math.cosh(distance) ** 2) < 1e-13
    assert abs(defect - 2 * math.log(math.cosh(distance))) < 1e-13
    return {
        "eta": eta,
        "gamma": gamma,
        "poissonAtPlusOne": p_plus,
        "poissonAtMinusOne": p_minus,
        "floatingEndpointProduct": raw_endpoint_product,
        "endpointProduct": endpoint_product,
        "hyperbolicDistance": distance,
        "additiveSeamDefect": defect,
    }


seam_samples = [
    seam_quantities(eta, gamma)
    for eta in [0.0, 0.1, 0.25, 0.49]
    for gamma in [14.134725141734693, 50.0]
]
quarter = seam_quantities(0.25, 14.134725141734693)
half_quarter = seam_quantities(0.125, 14.134725141734693)
assert abs(quarter["endpointProduct"] - 0.5) < 1e-15
assert abs(quarter["additiveSeamDefect"] - math.log(2)) < 1e-15
assert abs(quarter["hyperbolicDistance"] - math.asinh(1)) < 1e-15

branch_table = []
for descendants in range(1, 6):
    after_defect = descendants * half_quarter["additiveSeamDefect"]
    branch_table.append({
        "descendantsAtHalfDisplacement": descendants,
        "beforeDefect": quarter["additiveSeamDefect"],
        "afterDefect": after_defect,
        "afterToBeforeRatio": after_defect / quarter["additiveSeamDefect"],
        "strictContraction": after_defect < quarter["additiveSeamDefect"],
    })
assert all(entry["strictContraction"] for entry in branch_table[:4])
assert branch_table[4]["strictContraction"] is False

results = {
    "analysisDate": "2026-10-15",
    "title": "Order-one rigidity, consecutive carrier tests, and a two-ended seam ledger",
    "question": "can the final-three investigation be strengthened by an exact divisor theorem, actual canonical microsteps, and endpoint harmonic data?",
    "verdict": {
        "rhProved": False,
        "sameDivisorOrderOneCancellationAvailable": False,
        "naturalSymmetricDyadicFactorHasEmptyReservoir": False,
        "consecutiveCanonicalStagesInterlace": False,
        "oneCarrierThetaRefinementsInterlace": False,
        "twoEndedPoissonSeamLedgerConstructed": True,
        "heightIndependentSeamDeterminantConstructed": True,
        "seamLedgerControlledArithmetically": False,
        "conclusion": (
            "order-one Hadamard rigidity closes the appended-counterterm route more generally; the natural "
            "symmetric dyadic completion remains order one only by adding an infinite boundary divisor. "
            "Actual N=14 to N=15 and one-to-two-carrier numerical refinements fail positive-axis interlacing. "
            "The Blaschke marker admits an exact two-ended Poisson product and an unweighted seam determinant, "
            "but no prime or theta theorem yet forces its endpoint product to one."
        ),
    },
    "completedLedgerRigidity": {
        "exactP2Curvature": "-(4+3 sqrt(2))(log 2)^2",
        "p2Curvature": p2_curvature,
        "gaussianCoefficient": gaussian_coefficient,
        "sameDivisorTheorem": (
            "if two entire functions of order at most one have the same zeros with multiplicity, their quotient "
            "is exp(a+bs), so their logarithmic second derivatives are identical"
        ),
        "consequence": (
            "no order-one re-completion with the xi divisor can change the central curvature; cancelling the "
            "dyadic term must reappear in another ledger component rather than leave every reservoir empty"
        ),
        "symmetricDyadicFactor": "D2(s)=(1-2^(-s))(1-2^(s-1))=D2(1-s)",
        "symmetricDyadicCurvature": 2 * p2_curvature,
        "symmetricFactorOrder": 1,
        "boundaryDivisor": boundary_divisor_samples,
        "boundaryDivisorDescription": (
            "zeros lie at s=2 pi i k/log 2 and s=1+2 pi i k/log 2 on both strip boundaries; "
            "using the reciprocal replaces them by poles"
        ),
        "gammaDuplicationCheck": (
            "Gamma(s/4)Gamma(s/4+1/2)=2^(1-s/2)sqrt(pi)Gamma(s/2); the power of two is exp(linear in s) "
            "and has zero logarithmic curvature, so duplication does not supply the missing quadratic counterterm"
        ),
        "maximumFunctionalSymmetryError": max(symmetry_errors),
        "status": "the curvature can be moved only by raising order or adding a zero/pole boundary reservoir",
    },
    "canonicalInterlacing": {
        "comparisonDomain": "positive critical-line ordinates through height 30; using the full symmetric line would create a trivial central-pair obstruction for any two even functions",
        "consecutiveStages": {
            "stage14": stage14,
            "stage15": stage15,
            "mergedPositiveRootOrder": stage_order,
            "strictAlternation": stage_alternation,
            "quadratureCrossCheck": "192- and 256-node roots agree within 1e-9",
        },
        "literalCarrierAddition": {
            "oneCarrier": carrier1,
            "twoCarriers": carrier2,
            "mergedPositiveRootOrder": carrier_order,
            "strictAlternation": carrier_alternation,
        },
        "consequence": (
            "failure is present both in the actual consecutive N=14 to N=15 deficit transition and when the "
            "second fully admitted theta carrier is added; it is not an artefact of comparing distant N=14 and N=20 stages"
        ),
        "limitation": (
            "these are robust argument-principle and quadrature diagnostics for the implemented canonical completions, "
            "not a rigorous interval-arithmetic theorem for the exact untruncated integral"
        ),
        "remainingTarget": "a redesigned refinement with a proved Sturm, Hermite-Biehler, or total-positivity structure",
    },
    "twoEndedSeamLedger": {
        "diskCoordinate": "q=exp(i pi(s-1/2)), w=(q-1)/(q+1)",
        "poissonKernel": "P_a(zeta)=(1-|a|^2)/|zeta-a|^2 for |zeta|=1",
        "endpointIdentities": {
            "plusOne": "P_a(+1)=exp(-pi gamma) cos(pi eta)",
            "minusOne": "P_a(-1)=exp(+pi gamma) cos(pi eta)",
            "product": "P_a(+1)P_a(-1)=cos^2(pi eta)=sech^2(d_seam)",
        },
        "additiveDefect": "epsilon(a)=-log(P_a(+1)P_a(-1))=-2log cos(pi eta)=2log cosh(d_seam)",
        "finiteHeightDeterminant": "Delta_T=product over zero-orbit representatives with |gamma|<=T of cos^2(pi eta)",
        "extendedLimit": (
            "Delta=lim_T Delta_T exists in [0,1] because every factor is at most one; Delta=1 exactly under RH, "
            "although it may collapse to zero when the unweighted defect sum diverges"
        ),
        "coerciveInfimum": "inf_a P_a(+1)P_a(-1)=sech^2(sup_a d_seam), equal to one exactly under RH",
        "blaschkePhaseMeaning": (
            "P_a at a boundary point is the boundary phase derivative of the elementary Blaschke factor, "
            "so horizontal displacement is the product of its phase slopes at the two seam endpoints"
        ),
        "samples": seam_samples,
        "quarterDisplacement": quarter,
        "halfQuarterDisplacement": half_quarter,
        "branchTableAtQuarterDisplacement": branch_table,
        "fourBranchIdentity": (
            "for 0<|eta|<1/2, 4 epsilon(eta/2)<epsilon(eta), because with c=cos^2(pi eta/2), "
            "c^2-(2c-1)=(c-1)^2>0"
        ),
        "advance": (
            "unlike the quadratic residue, the exact seam defect still contracts under as many as four half-displacement descendants"
        ),
        "remainingFailure": (
            "the full Blaschke phase derivative is a sum of Poisson kernels and diverges at the accumulation endpoints; "
            "recovering the per-zero two-ended product requires a renormalized endpoint factorization not supplied by current prime data"
        ),
        "sufficientMissingTheorem": (
            "derive from the completed prime ledger or canonical theta kernel that the two-ended endpoint product has infimum one, "
            "or that it is invariant under a globally defined halving return"
        ),
    },
    "combinedAssessment": {
        "exactAdvances": [
            "upgraded the counterterm obstruction to same-divisor order-one Hadamard rigidity",
            "located the natural symmetric dyadic reservoir explicitly on both strip boundaries",
            "tested a genuinely consecutive stage and a literal one-carrier refinement on the positive spectral axis",
            "converted the seam norm into an exact product of two endpoint Poisson phase slopes",
            "constructed an unweighted seam determinant and defect that remain sensitive to escape",
            "proved the seam defect contracts even under four descendants at half displacement",
        ],
        "remainingObligations": [
            "prove a renormalized two-ended endpoint identity from prime or theta data",
            "or construct a different canonical refinement with rigorous interlacing",
            "or supply an internal completed-ledger identity without shifting curvature into a boundary divisor",
        ],
        "status": "the seam ledger is sharper and branch-robust, but arithmetic control remains missing and RH is not proved",
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Two-ended seam-ledger investigation complete.")
print(f"  Exact p=2 curvature: -(4+3sqrt(2))(log 2)^2 = {p2_curvature:.12f}.")
print(f"  Consecutive N=14/N=15 positive-axis interlacing: {stage_alternation}.")
print(f"  One-to-two-carrier positive-axis interlacing: {carrier_alternation}.")
print(f"  Quarter-displacement endpoint product: {quarter['endpointProduct']:.12f}; defect=log 2.")
print("  Verdict: two-ended seam accounting advances; endpoint arithmetic control remains open.")
