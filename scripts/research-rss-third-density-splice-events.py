#!/usr/bin/env python3
"""Test possible extra splices at 333, 666 and 999.

Three internal-splice interpretations are compared:
  1. one extra carrier at every internal station;
  2. successive Fibonacci cohorts at every ordered splice event;
  3. three delayed faces sharing the existing 1000 cohort.

The first and third interpretations are crossed with all three unresolved
splice-at-one conventions, giving seven population models. Each is tested
under chronological and equal-local-clock schedules. Only the Python standard
library is used.
"""

from __future__ import annotations

import cmath
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-third-density-splice-events-results.json"
PHI = (1 + math.sqrt(5)) / 2
STAGES = [14, 20, 30, 40]
SCHEDULES = ["chronological", "equal-local-ticks"]
ORIGIN_MODELS = ["zeroth-seed", "reindexed-fibonacci", "boundary-only"]
INTERNAL_STATIONS = [333, 666, 999]
T_MAX = 30.0
NUMERICAL_CARRIER_LIMIT = 16

SCENARIOS = [
    *(f"extra-one-{origin}" for origin in ORIGIN_MODELS),
    "every-event-fibonacci",
    *(f"shared-faces-{origin}" for origin in ORIGIN_MODELS),
]


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


def base_cohorts(cutoff: int, origin: str) -> list[dict[str, object]]:
    cohorts: list[dict[str, object]] = []
    for level in range(cutoff + 1):
        size, depth, boundary_only = origin_size_depth(level, origin)
        threshold = 10 ** level
        cohorts.append(
            {
                "threshold": threshold,
                "label": f"decimal-{threshold}",
                "cohortSize": size,
                "boundaryOnly": boundary_only,
                "delaySources": [
                    {
                        "threshold": threshold,
                        "depthIndex": depth,
                        "birthCoordinate": float(level),
                        "label": str(threshold),
                    }
                ],
            }
        )
    return cohorts


def scenario_cohorts(cutoff: int, scenario: str) -> tuple[list[dict[str, object]], str, float]:
    """Return cohorts, clock-coordinate type and maximum clock coordinate."""
    assert cutoff >= 3
    if scenario == "every-event-fibonacci":
        thresholds = [10 ** level for level in range(cutoff + 1)] + INTERNAL_STATIONS
        thresholds = sorted(set(thresholds))
        cohorts = []
        for ordinal, threshold in enumerate(thresholds, start=1):
            cohorts.append(
                {
                    "threshold": threshold,
                    "label": f"event-{threshold}",
                    "cohortSize": fibonacci(ordinal),
                    "boundaryOnly": False,
                    "eventOrdinal": ordinal,
                    "delaySources": [
                        {
                            "threshold": threshold,
                            "depthIndex": float(ordinal),
                            "birthCoordinate": float(ordinal),
                            "label": str(threshold),
                        }
                    ],
                }
            )
        return cohorts, "event-ordinal", float(len(thresholds))

    prefix, origin = scenario.rsplit("-", 1)
    # rsplit is insufficient for hyphenated origins; resolve explicitly.
    origin = next(value for value in ORIGIN_MODELS if scenario.endswith(value))
    prefix = scenario[: -(len(origin) + 1)]
    cohorts = base_cohorts(cutoff, origin)
    depth_offset = 1.0 if origin == "reindexed-fibonacci" else 0.0

    if prefix == "extra-one":
        for threshold in INTERNAL_STATIONS:
            coordinate = math.log10(threshold)
            cohorts.append(
                {
                    "threshold": threshold,
                    "label": f"internal-{threshold}",
                    "cohortSize": 1,
                    "boundaryOnly": False,
                    "delaySources": [
                        {
                            "threshold": threshold,
                            "depthIndex": coordinate + depth_offset,
                            "birthCoordinate": coordinate,
                            "label": str(threshold),
                        }
                    ],
                }
            )
    else:
        target = next(cohort for cohort in cohorts if cohort["threshold"] == 1000)
        target["label"] = "shared-333-666-999"
        target["delaySources"] = [
            {
                "threshold": threshold,
                "depthIndex": math.log10(threshold) + depth_offset,
                "birthCoordinate": math.log10(threshold),
                "label": str(threshold),
            }
            for threshold in INTERNAL_STATIONS
        ]
    cohorts.sort(key=lambda cohort: int(cohort["threshold"]))
    return cohorts, "decimal-log", float(cutoff)


def assign_carrier_blocks(cohorts: list[dict[str, object]]) -> int:
    carrier_end = 0
    for cohort in cohorts:
        size = int(cohort["cohortSize"])
        cohort["carrierStart"] = carrier_end + 1 if size else 0
        carrier_end += size
        cohort["carrierEnd"] = carrier_end if size else 0
    return carrier_end


class InternalSpliceCompletion:
    def __init__(self, cutoff: int, scenario: str, schedule: str):
        assert scenario in SCENARIOS
        assert schedule in SCHEDULES
        self.cutoff = cutoff
        self.scenario = scenario
        self.schedule = schedule
        self.cohorts, self.coordinate_type, self.maximum_clock = scenario_cohorts(cutoff, scenario)
        self.population = assign_carrier_blocks(self.cohorts)

        all_carrier_source_gaps: list[float] = []
        numerical_carriers: dict[int, float] = {}
        for cohort in self.cohorts:
            source_gaps = [self.source_gap(source) for source in cohort["delaySources"]]
            cohort["sourceGaps"] = source_gaps
            cohort["effectiveGap"] = sum(source_gaps) / len(source_gaps)
            if int(cohort["cohortSize"]) > 0:
                all_carrier_source_gaps.extend(source_gaps)
                start = int(cohort["carrierStart"])
                end = min(int(cohort["carrierEnd"]), NUMERICAL_CARRIER_LIMIT)
                for carrier in range(start, end + 1):
                    numerical_carriers[carrier] = float(cohort["effectiveGap"])

        self.maximum_gap = max(all_carrier_source_gaps)
        self.minimum_gap = min(all_carrier_source_gaps)
        self.features: list[tuple[float, float]] = []
        for u, quadrature_weight in zip(QUADRATURE_NODES, QUADRATURE_WEIGHTS):
            x = math.exp(u)
            delayed_theta = sum(
                (1 - gap) * math.exp(-math.pi * carrier * carrier * x)
                for carrier, gap in numerical_carriers.items()
            )
            self.features.append((u, quadrature_weight * 2 * math.exp(u / 4) * delayed_theta))

    def local_ticks(self, source: dict[str, object]) -> float:
        if self.schedule == "chronological":
            return self.maximum_clock - float(source["birthCoordinate"])
        return self.maximum_clock

    def source_gap(self, source: dict[str, object]) -> float:
        return PHI ** (-(float(source["depthIndex"]) + self.local_ticks(source)))

    def value(self, s: complex) -> complex:
        centered = s - 0.5
        integral = sum(
            weight * cmath.cosh(centered * u / 2)
            for u, weight in self.features
        )
        return 0.5 + 0.5 * (centered * centered - 0.25) * integral


def rectangle_boundary() -> list[complex]:
    horizontal_steps, vertical_steps = 250, 1500
    points = [complex(index / horizontal_steps, 0) for index in range(horizontal_steps)]
    points += [complex(1, T_MAX * index / vertical_steps) for index in range(vertical_steps)]
    points += [complex(1 - index / horizontal_steps, T_MAX) for index in range(horizontal_steps)]
    points += [complex(0, T_MAX * (1 - index / vertical_steps)) for index in range(vertical_steps + 1)]
    return points


BOUNDARY_POINTS = rectangle_boundary()


def argument_count(completion: InternalSpliceCompletion) -> dict[str, float | int]:
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


def critical_line_roots(completion: InternalSpliceCompletion, spacing: float = 0.01) -> list[float]:
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


def escaping_factor(centered: complex, cutoff: int, eta: float = 0.25) -> complex:
    upper = complex(eta, PHI ** cutoff)
    lower = upper.conjugate()
    return (1 - centered * centered / (upper * upper)) * (1 - centered * centered / (lower * lower))


def diagnose(cutoff: int, scenario: str, schedule: str) -> dict[str, object]:
    completion = InternalSpliceCompletion(cutoff, scenario, schedule)
    samples = [complex(0.2, 3), complex(0.6, 8), complex(1.2, 4)]
    functional_errors = [abs(completion.value(s) - completion.value(1 - s)) for s in samples]
    conjugation_errors = [abs(completion.value(s.conjugate()) - completion.value(s).conjugate()) for s in samples]
    count = argument_count(completion)
    roots = critical_line_roots(completion)
    assert count["zeroCount"] == len(roots)
    assert max(functional_errors) < 1e-14
    assert max(conjugation_errors) < 1e-14

    internal = []
    for cohort in completion.cohorts:
        sources = cohort["delaySources"]
        if any(int(source["threshold"]) in INTERNAL_STATIONS for source in sources):
            internal.append(
                {
                    "cohortLabel": cohort["label"],
                    "cohortSize": cohort["cohortSize"],
                    "carrierBlock": [cohort["carrierStart"], cohort["carrierEnd"]],
                    "sources": [
                        {
                            **source,
                            "localClockTicks": completion.local_ticks(source),
                            "remainingGap": completion.source_gap(source),
                        }
                        for source in sources
                    ],
                    "effectiveGap": cohort["effectiveGap"],
                }
            )

    compact_samples = [complex(0, 0), complex(0.3, 2), complex(-0.4, 5)]
    return {
        "stage": cutoff,
        "scenario": scenario,
        "schedule": schedule,
        "finiteCarrierCount": completion.population,
        "internalSpliceDiagnostics": internal,
        "maximumCarrierSourceGap": completion.maximum_gap,
        "minimumCarrierSourceGap": completion.minimum_gap,
        "argumentPrinciple": count,
        "criticalLineRoots": roots,
        "criticalLineRootCount": len(roots),
        "offLineZerosDetectedInRectangle": count["zeroCount"] - len(roots),
        "maximumFunctionalSymmetryError": max(functional_errors),
        "maximumConjugationError": max(conjugation_errors),
        "escapingQuartetStressTest": {
            "eta": 0.25,
            "gamma": PHI ** cutoff,
            "violatesCandidateGap": 0.25 > completion.maximum_gap,
            "maximumCompactFactorError": max(abs(escaping_factor(z, cutoff) - 1) for z in compact_samples),
        },
    }


model_diagnostics: dict[str, dict[str, list[dict[str, object]]]] = {}
for scenario in SCENARIOS:
    model_diagnostics[scenario] = {
        schedule: [diagnose(stage, scenario, schedule) for stage in STAGES]
        for schedule in SCHEDULES
    }

for schedules in model_diagnostics.values():
    for diagnostics in schedules.values():
        assert [entry["criticalLineRootCount"] for entry in diagnostics] == [2, 2, 4, 3]

through_1000 = {}
for scenario in SCENARIOS:
    cohorts, coordinate_type, maximum_clock = scenario_cohorts(3, scenario)
    through_1000[scenario] = {
        "finiteCarrierCount": assign_carrier_blocks(cohorts),
        "clockCoordinate": coordinate_type,
        "maximumClockCoordinate": maximum_clock,
        "cohorts": cohorts,
    }

assert [through_1000[scenario]["finiteCarrierCount"] for scenario in SCENARIOS] == [
    8, 10, 7, 33, 5, 7, 4
]

results = {
    "analysisDate": "2026-10-14",
    "title": "Possible splice events at 333, 666 and 999",
    "question": "what changes if 333, 666 and 999 are additional delayed splices before 1000?",
    "verdict": {
        "rhProved": False,
        "allThreeInternalSpliceModelsTested": True,
        "allCompatibleSpliceAtOneModelsRetained": True,
        "scenarioCount": len(SCENARIOS),
        "clockScheduleCount": len(SCHEDULES),
        "finiteCompletedFamiliesConstructed": True,
        "functionalEquationPreserved": True,
        "conjugationPreserved": True,
        "locallyUniformLimitIsXi": True,
        "offLineZerosDetectedThroughHeight30": False,
        "globalGoldenZeroBoundProved": False,
        "internalSplicesForceGlobalBound": False,
        "conclusion": (
            "treating 333, 666 and 999 as extra carriers, successive Fibonacci events, or three delayed "
            "faces of the 1000 cohort changes finite population counts and root ordinates. All fourteen tested "
            "scenario/schedule paths have only critical-line zeros through height 30 at the selected cutoffs, "
            "but the escaping-quartet obstruction survives every interpretation."
        ),
    },
    "internalStations": INTERNAL_STATIONS,
    "models": {
        "additionalOneCarrier": {
            "description": "add one independent carrier at each of 333, 666 and 999 while retaining the decimal cohorts",
            "crossedWithOriginModels": ORIGIN_MODELS,
            "carrierCountsThrough1000": {"zerothSeed": 8, "reindexed": 10, "boundaryOnly": 7},
        },
        "everyEventFibonacci": {
            "description": "order 1,10,100,333,666,999,1000 and assign F_1,...,F_7",
            "carrierCountThrough1000": 33,
            "effect": "1000 becomes the seventh splice event rather than the third or fourth",
        },
        "sharedFaces": {
            "description": (
                "333, 666 and 999 share the existing 1000 carrier block; its coefficient is the mean of "
                "their three admitted fractions, so no population is added"
            ),
            "crossedWithOriginModels": ORIGIN_MODELS,
            "carrierCountsThrough1000": {"zerothSeed": 5, "reindexed": 7, "boundaryOnly": 4},
            "specialObservation": (
                "only the reindexed splice-at-one model gives the 1000 cohort size F_4=3, permitting a "
                "one-to-one face/carrier assignment without averaging"
            ),
        },
    },
    "delayCoordinates": {
        "additionalAndShared": (
            "internal depth uses log_10(q), plus one in the reindexed origin model; chronological age "
            "N-log_10(q) synchronises the gaps while equal local ticks retain distinct delays"
        ),
        "everyEventFibonacci": (
            "the r-th ordered splice has depth index r; chronological age R-r synchronises all event gaps"
        ),
    },
    "through1000": through_1000,
    "finiteCompletion": {
        "formula": (
            "Xi(s)=1/2+[s(s-1)/2] integral_1^infinity sum_B (1-g_B) "
            "sum_(m in B) exp(-pi m^2 x) [x^(s/2)+x^((1-s)/2)] dx/x"
        ),
        "sharedFaceGap": "g_B=(g_333+g_666+g_999)/3 for the shared-face 1000 block",
        "entire": True,
        "functionalEquation": "Xi(s)=Xi(1-s)",
        "conjugation": "Xi(conj(s))=conj(Xi(s))",
        "limit": "every fixed coefficient tends to one along cofinal clocks, so each family tends locally uniformly to xi",
    },
    "modelDiagnostics": model_diagnostics,
    "stressFamily": {
        "factor": "P_N(z)=[1-z^2/(1/4+i phi^N)^2][1-z^2/(1/4-i phi^N)^2]",
        "zeros": "s=1/2 +/- 1/4 +/- i phi^N",
        "consequence": (
            "the factor preserves all completion symmetries and tends locally to one while retaining fixed "
            "horizontal displacement, so internal splices do not imply a global shrinking strip"
        ),
    },
    "logicalAssessment": {
        "robustResult": "no off-line zero detected through height 30 in any tested scenario/schedule path",
        "modelSelection": (
            "the arithmetic does not choose whether the three stations add population, reindex all events, "
            "or act as faces of one cohort"
        ),
        "missingConditions": [
            "a TTI rule selecting the population effect of 333, 666 and 999",
            "a derived timing law for their independent clocks",
            "uniform-in-height zero control and complete zero accounting",
            "an exclusion of escaping off-line quartets",
        ],
        "status": "internal third-density splices change the finite model but do not establish RH",
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Internal third-density splice investigation complete.")
for scenario in SCENARIOS:
    counts = through_1000[scenario]["finiteCarrierCount"]
    line_counts = [entry["criticalLineRootCount"] for entry in model_diagnostics[scenario]["chronological"]]
    print(f"  {scenario}: carriers through 1000={counts}, chronological counts={line_counts}")
print("  Verdict: all bounded-window counts are on-line; no internal-splice model forces the global bound.")
