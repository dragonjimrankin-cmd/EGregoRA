#!/usr/bin/env python3
"""Test three meanings of 'everything else halves' at every splice at 1.

The comparison separates:
  * horizontal contraction of zero displacement;
  * literal halving of downstream admitted weights or populations;
  * halving the remaining interval to completed integration.

It also separates an action on the zero set of the same xi function from an
action that only advances a sequence of finite theta completions.
"""

from __future__ import annotations

import cmath
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-splice-at-one-halving-results.json"
PHI = (1 + math.sqrt(5)) / 2
STAGES = [14, 20, 30, 40]
ORIGIN_MODELS = ["zeroth-seed", "reindexed-fibonacci", "boundary-only"]
SCHEDULES = ["chronological", "equal-local-ticks"]
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
    radius = (upper - lower) / 2
    for index in range(1, (count + 1) // 2 + 1):
        root = math.cos(math.pi * (index - 0.25) / (count + 0.5))
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
        nodes[index - 1] = midpoint - radius * root
        nodes[count - index] = midpoint + radius * root
        weights[index - 1] = weight
        weights[count - index] = weight
    return nodes, weights


QUADRATURE_NODES, QUADRATURE_WEIGHTS = gauss_legendre(256, 0.0, 6.0)


def origin_size_depth(level: int, origin: str) -> tuple[int, float, bool]:
    if origin == "zeroth-seed":
        return (1 if level == 0 else fibonacci(level), float(level), False)
    if origin == "reindexed-fibonacci":
        return (fibonacci(level + 1), float(level + 1), False)
    return (0 if level == 0 else fibonacci(level), float(level), level == 0)


def scenario_cohorts(cutoff: int, origin: str, schedule: str) -> list[dict[str, object]]:
    cohorts = []
    carrier_end = 0
    for level in range(cutoff + 1):
        size, depth, boundary_only = origin_size_depth(level, origin)
        ticks = cutoff - level if schedule == "chronological" else cutoff
        base_gap = PHI ** (-(depth + ticks))
        repeated_splice_factor = 2.0 ** (-cutoff) if level > 0 else 1.0
        remaining_gap = base_gap * repeated_splice_factor
        start = carrier_end + 1 if size else 0
        carrier_end += size
        cohorts.append({
            "threshold": 10 ** level,
            "cohortSize": size,
            "boundaryOnly": boundary_only,
            "depthIndex": depth,
            "localClockTicks": ticks,
            "baseRemainingGap": base_gap,
            "spliceAtOneHalvingFactor": repeated_splice_factor,
            "remainingGap": remaining_gap,
            "admittedFraction": 1 - remaining_gap,
            "carrierStart": start,
            "carrierEnd": carrier_end if size else 0,
        })
    return cohorts


class DeficitHalvingCompletion:
    def __init__(self, cutoff: int, origin: str, schedule: str):
        self.cutoff = cutoff
        self.origin = origin
        self.schedule = schedule
        self.cohorts = scenario_cohorts(cutoff, origin, schedule)
        numerical_carriers: dict[int, float] = {}
        gaps = []
        for cohort in self.cohorts:
            if int(cohort["cohortSize"]) <= 0:
                continue
            gap = float(cohort["remainingGap"])
            gaps.append(gap)
            start = int(cohort["carrierStart"])
            end = min(int(cohort["carrierEnd"]), NUMERICAL_CARRIER_LIMIT)
            for carrier in range(start, end + 1):
                numerical_carriers[carrier] = gap
        self.maximum_gap = max(gaps)
        self.features: list[tuple[float, float]] = []
        for u, quadrature_weight in zip(QUADRATURE_NODES, QUADRATURE_WEIGHTS):
            x = math.exp(u)
            theta = sum(
                (1 - gap) * math.exp(-math.pi * carrier * carrier * x)
                for carrier, gap in numerical_carriers.items()
            )
            self.features.append((u, quadrature_weight * 2 * math.exp(u / 4) * theta))

    def value(self, s: complex) -> complex:
        centered = s - 0.5
        integral = sum(weight * cmath.cosh(centered * u / 2) for u, weight in self.features)
        return 0.5 + 0.5 * (centered * centered - 0.25) * integral


def rectangle_boundary() -> list[complex]:
    horizontal_steps, vertical_steps = 250, 1500
    points = [complex(index / horizontal_steps, 0) for index in range(horizontal_steps)]
    points += [complex(1, T_MAX * index / vertical_steps) for index in range(vertical_steps)]
    points += [complex(1 - index / horizontal_steps, T_MAX) for index in range(horizontal_steps)]
    points += [complex(0, T_MAX * (1 - index / vertical_steps)) for index in range(vertical_steps + 1)]
    return points


BOUNDARY_POINTS = rectangle_boundary()


def argument_count(completion: DeficitHalvingCompletion) -> dict[str, float | int]:
    values = [completion.value(point) for point in BOUNDARY_POINTS]
    increments = [cmath.phase(right / left) for left, right in zip(values, values[1:])]
    winding = sum(increments) / (2 * math.pi)
    rounded = round(winding)
    assert abs(winding - rounded) < 1e-9
    assert max(abs(value) for value in increments) < 0.08
    assert min(abs(value) for value in values) > 1e-9
    return {
        "winding": winding,
        "zeroCount": rounded,
        "maximumBoundaryPhaseStep": max(abs(value) for value in increments),
        "minimumBoundaryMagnitude": min(abs(value) for value in values),
    }


def critical_line_roots(completion: DeficitHalvingCompletion, spacing: float = 0.01) -> list[float]:
    def line_value(gamma: float) -> float:
        value = completion.value(complex(0.5, gamma))
        assert abs(value.imag) < 1e-12
        return value.real

    roots = []
    left, left_value = 0.0, line_value(0.0)
    for index in range(1, round(T_MAX / spacing) + 1):
        right = index * spacing
        right_value = line_value(right)
        if left_value * right_value < 0:
            low, high, low_value = left, right, left_value
            for _ in range(55):
                middle = (low + high) / 2
                middle_value = line_value(middle)
                if low_value * middle_value <= 0:
                    high = middle
                else:
                    low, low_value = middle, middle_value
            roots.append((low + high) / 2)
        left, left_value = right, right_value
    return roots


def diagnose(cutoff: int, origin: str, schedule: str) -> dict[str, object]:
    completion = DeficitHalvingCompletion(cutoff, origin, schedule)
    count = argument_count(completion)
    roots = critical_line_roots(completion)
    assert count["zeroCount"] == len(roots)
    samples = [complex(0.2, 3), complex(0.6, 8), complex(1.2, 4)]
    functional_errors = [abs(completion.value(s) - completion.value(1 - s)) for s in samples]
    conjugation_errors = [abs(completion.value(s.conjugate()) - completion.value(s).conjugate()) for s in samples]
    assert max(functional_errors) < 1e-14
    assert max(conjugation_errors) < 1e-14
    return {
        "stage": cutoff,
        "originModel": origin,
        "schedule": schedule,
        "repeatedSpliceCount": cutoff,
        "downstreamRemainingFactor": 2.0 ** (-cutoff),
        "maximumCarrierGap": completion.maximum_gap,
        "argumentPrinciple": count,
        "criticalLineRoots": roots,
        "criticalLineRootCount": len(roots),
        "offLineZerosDetectedInRectangle": count["zeroCount"] - len(roots),
        "maximumFunctionalSymmetryError": max(functional_errors),
        "maximumConjugationError": max(conjugation_errors),
        "cohortsThrough1000": [cohort for cohort in completion.cohorts if int(cohort["threshold"]) <= 1000],
    }


def escaping_factor(centered: complex, stage: int, eta: float = 0.25) -> complex:
    upper = complex(eta, PHI ** stage)
    lower = upper.conjugate()
    return (1 - centered * centered / (upper * upper)) * (1 - centered * centered / (lower * lower))


finite_diagnostics = {
    origin: {
        schedule: [diagnose(stage, origin, schedule) for stage in STAGES]
        for schedule in SCHEDULES
    }
    for origin in ORIGIN_MODELS
}
expected_finite_counts = {
    "zeroth-seed": [2, 2, 4, 3],
    "reindexed-fibonacci": [2, 2, 4, 3],
    "boundary-only": [4, 3, 3, 3],
}
for origin, schedules in finite_diagnostics.items():
    for diagnostics in schedules.values():
        assert [entry["criticalLineRootCount"] for entry in diagnostics] == expected_finite_counts[origin]

eta0 = 0.25
horizontal_iterations = [
    {"iteration": iteration, "horizontalDisplacement": eta0 * 2.0 ** (-iteration)}
    for iteration in range(13)
]
assert horizontal_iterations[-1]["horizontalDisplacement"] < 1e-4

weight_iterations = []
for iteration in range(9):
    admitted_multiplier = 2.0 ** (-iteration)
    initial_gap = 0.2
    remaining_gap = initial_gap * 2.0 ** (-iteration)
    weight_iterations.append({
        "iteration": iteration,
        "literalAdmittedWeightMultiplier": admitted_multiplier,
        "literalAdmittedWeightLimitDirection": "toward zero",
        "initialRemainingGap": initial_gap,
        "halvedRemainingGap": remaining_gap,
        "admittedFractionAfterDeficitHalving": 1 - remaining_gap,
    })

compact_samples = [complex(0, 0), complex(0.3, 2), complex(-0.4, 5)]
escaping_stress = [
    {
        "stage": stage,
        "height": PHI ** stage,
        "horizontalDisplacement": eta0,
        "candidateInheritedBound": eta0 * 2.0 ** (-stage),
        "violatesInheritedHalvingBound": eta0 > eta0 * 2.0 ** (-stage),
        "maximumCompactFactorError": max(abs(escaping_factor(z, stage) - 1) for z in compact_samples),
    }
    for stage in STAGES
]

results = {
    "analysisDate": "2026-10-14",
    "title": "Repeated halving at every splice at 1",
    "question": "what changes if every time there is a splice at 1, everything else halves?",
    "verdict": {
        "rhProved": False,
        "allThreeMeaningsTested": True,
        "sameXiAndFiniteStageScopesCompared": True,
        "sameXiHorizontalContractionWouldProveRh": True,
        "sameXiHorizontalContractionDerivedByTti": False,
        "literalWeightHalvingRetainsXiLimit": False,
        "remainingIntervalHalvingRetainsXiLimit": True,
        "finiteInheritedHalvingExcludesNewEscapingZeros": False,
        "offLineZerosDetectedThroughHeight30InDeficitModel": False,
        "conclusion": (
            "halving the horizontal displacement of every zero within the same xi zero set is RH-equivalent, "
            "but has not been derived. At finite stages, halving only inherited states cannot exclude new zeros "
            "escaping at growing heights. Literal admitted-weight halving destroys the xi limit, while halving "
            "the remaining deficit preserves and accelerates that limit without itself controlling zeros."
        ),
    },
    "sameXiZeroContraction": {
        "map": "H(beta+i gamma)=1/2+(beta-1/2)/2+i gamma",
        "iteration": "H^n(beta+i gamma)=1/2+2^(-n)(beta-1/2)+i gamma",
        "identityTheoremArgument": (
            "an off-line xi zero would generate infinitely many distinct xi zeros at the same ordinate, "
            "accumulating at the finite point 1/2+i gamma; since xi is entire and nonzero, this is impossible"
        ),
        "converse": "if RH holds, every zero is fixed by H",
        "status": "the zero-set invariance H(Z(xi)) subset Z(xi) is equivalent to RH, not an independent proof",
        "sampleIterations": horizontal_iterations,
    },
    "finiteStageZeroContraction": {
        "conditionalTheorem": (
            "if every zero of every finite completion obeys |Re(s)-1/2| <= C 2^(-N) and the completions "
            "converge locally uniformly to xi, Rouche-Hurwitz transfer forces every xi zero onto the line"
        ),
        "trackedOnlyLimitation": (
            "the observed finite counts 2,2,4,3 do not define one-to-one trajectories, and halving inherited "
            "zeros does not prohibit newly created zeros or quartets at heights growing with N"
        ),
        "escapingQuartet": escaping_stress,
    },
    "downstreamWeightHalving": {
        "literalAdmittedWeights": (
            "multiplying downstream admitted theta coefficients by 2^(-n) drives them to zero, so the completion "
            "does not tend to xi"
        ),
        "integerPopulation": (
            "literal repeated halving is undefined for odd Fibonacci cohorts without a rounding, pairing or "
            "fractional-weight rule"
        ),
        "remainingDeficits": (
            "halving g=1-a gives g_n=2^(-n)g and a_n=1-2^(-n)g, which tends to full admission and preserves the xi limit"
        ),
        "sampleIterations": weight_iterations,
    },
    "remainingIntervalHalving": {
        "map": "a maps to 1-(1-a)/2=(1+a)/2",
        "iteration": "a_n=1-2^(-n)(1-a_0)",
        "equivalence": "when a is the admitted fraction and g=1-a, remaining-interval halving is exactly remaining-deficit halving",
        "zeroConsequence": "no horizontal zero contraction follows unless TTI derives a map from a to Re(s)-1/2",
    },
    "finiteDeficitHalvingDiagnostics": finite_diagnostics,
    "finiteCompletion": {
        "entire": True,
        "functionalEquation": "Xi_N(s)=Xi_N(1-s)",
        "conjugation": "Xi_N(conj(s))=conj(Xi_N(s))",
        "limit": "halved downstream deficits tend to zero, so fixed carrier coefficients tend to one and the scalar families tend locally uniformly to xi",
    },
    "logicalAssessment": {
        "strongConditionalResult": "same-xi horizontal halving would prove RH immediately by finite accumulation",
        "missingConditions": [
            "a TTI derivation that the splice at 1 acts on horizontal zero displacement",
            "proof that the halving image of every xi zero is another zero of the same xi function",
            "or a global all-zero shrinking strip for every finite completion, not merely tracked zeros",
            "a rule preventing newly created zeros and escaping quartets",
            "an integer or fractional interpretation if carrier populations themselves halve",
        ],
        "status": "the proposed rule identifies an RH-equivalent contraction, but does not yet derive it",
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Splice-at-one halving investigation complete.")
for origin in ORIGIN_MODELS:
    counts = [entry["criticalLineRootCount"] for entry in finite_diagnostics[origin]["chronological"]]
    print(f"  {origin}: deficit-halving chronological counts={counts}")
print("  Same-xi horizontal halving: RH-equivalent but not derived.")
print("  Finite inherited halving: escaping-zero obstruction remains.")
