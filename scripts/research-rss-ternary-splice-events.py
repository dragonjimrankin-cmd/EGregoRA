#!/usr/bin/env python3
"""Test ternary splicing at 100, 666 and 999.

Three meanings of 'splice into three' are compared across all three unresolved
splice-at-one conventions:
  * three-new: a cohort of three new carriers at each named event;
  * three-total: one incoming path becomes three, a net cohort of two;
  * three-state: one existing scalar channel has a Z_3 internal state and no
    new theta carrier unless an additional coupling is supplied.

Each population model is tested with chronological and equal-local-clock
schedules. Only the Python standard library is used.
"""

from __future__ import annotations

import cmath
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-ternary-splice-events-results.json"
PHI = (1 + math.sqrt(5)) / 2
STAGES = [14, 20, 30, 40]
ORIGIN_MODELS = ["zeroth-seed", "reindexed-fibonacci", "boundary-only"]
TERNARY_MODELS = ["three-new", "three-total", "three-state"]
SCHEDULES = ["chronological", "equal-local-ticks"]
TERNARY_EVENTS = [100, 666, 999]
T_MAX = 30.0
NUMERICAL_CARRIER_LIMIT = 16
SCENARIOS = [f"{model}-{origin}" for model in TERNARY_MODELS for origin in ORIGIN_MODELS]


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


def parse_scenario(scenario: str) -> tuple[str, str]:
    origin = next(value for value in ORIGIN_MODELS if scenario.endswith(value))
    model = scenario[: -(len(origin) + 1)]
    assert model in TERNARY_MODELS
    return model, origin


def scenario_cohorts(cutoff: int, scenario: str) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    model, origin = parse_scenario(scenario)
    depth_offset = 1.0 if origin == "reindexed-fibonacci" else 0.0
    cohorts: list[dict[str, object]] = []
    for level in range(cutoff + 1):
        size, depth, boundary_only = origin_size_depth(level, origin)
        threshold = 10 ** level
        if model == "three-new" and threshold == 100:
            size = 3
        elif model == "three-total" and threshold == 100:
            size = 2
        cohorts.append(
            {
                "threshold": threshold,
                "label": f"decimal-{threshold}",
                "cohortSize": size,
                "boundaryOnly": boundary_only,
                "delaySource": {
                    "threshold": threshold,
                    "depthIndex": depth,
                    "birthCoordinate": float(level),
                },
            }
        )

    if model in {"three-new", "three-total"}:
        size = 3 if model == "three-new" else 2
        for threshold in (666, 999):
            coordinate = math.log10(threshold)
            cohorts.append(
                {
                    "threshold": threshold,
                    "label": f"ternary-{threshold}",
                    "cohortSize": size,
                    "boundaryOnly": False,
                    "delaySource": {
                        "threshold": threshold,
                        "depthIndex": coordinate + depth_offset,
                        "birthCoordinate": coordinate,
                    },
                }
            )

    ternary_metadata = []
    for threshold in TERNARY_EVENTS:
        coordinate = math.log10(threshold)
        ternary_metadata.append(
            {
                "threshold": threshold,
                "branchCount": 3,
                "newCarrierCount": 3 if model == "three-new" else 2 if model == "three-total" else 0,
                "stateOnly": model == "three-state",
                "depthIndex": coordinate + depth_offset,
                "birthCoordinate": coordinate,
            }
        )

    cohorts.sort(key=lambda cohort: int(cohort["threshold"]))
    carrier_end = 0
    for cohort in cohorts:
        size = int(cohort["cohortSize"])
        cohort["carrierStart"] = carrier_end + 1 if size else 0
        carrier_end += size
        cohort["carrierEnd"] = carrier_end if size else 0
    return cohorts, ternary_metadata


class TernarySpliceCompletion:
    def __init__(self, cutoff: int, scenario: str, schedule: str):
        assert scenario in SCENARIOS
        assert schedule in SCHEDULES
        self.cutoff = cutoff
        self.scenario = scenario
        self.schedule = schedule
        self.model, self.origin = parse_scenario(scenario)
        self.cohorts, self.ternary_metadata = scenario_cohorts(cutoff, scenario)
        self.population = sum(int(cohort["cohortSize"]) for cohort in self.cohorts)

        numerical_carriers: dict[int, float] = {}
        carrier_gaps = []
        for cohort in self.cohorts:
            gap = self.gap(cohort["delaySource"])
            cohort["remainingGap"] = gap
            if int(cohort["cohortSize"]) > 0:
                carrier_gaps.append(gap)
                start = int(cohort["carrierStart"])
                end = min(int(cohort["carrierEnd"]), NUMERICAL_CARRIER_LIMIT)
                for carrier in range(start, end + 1):
                    numerical_carriers[carrier] = gap

        for event in self.ternary_metadata:
            event["localClockTicks"] = self.local_ticks(event)
            event["remainingGap"] = self.gap(event)

        self.maximum_gap = max(carrier_gaps)
        self.minimum_gap = min(carrier_gaps)
        self.features: list[tuple[float, float]] = []
        for u, quadrature_weight in zip(QUADRATURE_NODES, QUADRATURE_WEIGHTS):
            x = math.exp(u)
            theta = sum(
                (1 - gap) * math.exp(-math.pi * carrier * carrier * x)
                for carrier, gap in numerical_carriers.items()
            )
            self.features.append((u, quadrature_weight * 2 * math.exp(u / 4) * theta))

    def local_ticks(self, source: dict[str, object]) -> float:
        if self.schedule == "chronological":
            return self.cutoff - float(source["birthCoordinate"])
        return float(self.cutoff)

    def gap(self, source: dict[str, object]) -> float:
        return PHI ** (-(float(source["depthIndex"]) + self.local_ticks(source)))

    def value(self, s: complex) -> complex:
        centered = s - 0.5
        integral = sum(weight * cmath.cosh(centered * u / 2) for u, weight in self.features)
        return 0.5 + 0.5 * (centered * centered - 0.25) * integral


def rectangle_boundary() -> list[complex]:
    hs, vs = 250, 1500
    points = [complex(index / hs, 0) for index in range(hs)]
    points += [complex(1, T_MAX * index / vs) for index in range(vs)]
    points += [complex(1 - index / hs, T_MAX) for index in range(hs)]
    points += [complex(0, T_MAX * (1 - index / vs)) for index in range(vs + 1)]
    return points


BOUNDARY_POINTS = rectangle_boundary()


def argument_count(completion: TernarySpliceCompletion) -> dict[str, float | int]:
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


def critical_line_roots(completion: TernarySpliceCompletion, spacing: float = 0.01) -> list[float]:
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


def escaping_factor(centered: complex, cutoff: int, eta: float = 0.25) -> complex:
    upper = complex(eta, PHI ** cutoff)
    lower = upper.conjugate()
    return (1 - centered * centered / (upper * upper)) * (1 - centered * centered / (lower * lower))


def diagnose(cutoff: int, scenario: str, schedule: str) -> dict[str, object]:
    completion = TernarySpliceCompletion(cutoff, scenario, schedule)
    samples = [complex(0.2, 3), complex(0.6, 8), complex(1.2, 4)]
    functional_errors = [abs(completion.value(s) - completion.value(1 - s)) for s in samples]
    conjugation_errors = [abs(completion.value(s.conjugate()) - completion.value(s).conjugate()) for s in samples]
    count = argument_count(completion)
    roots = critical_line_roots(completion)
    assert count["zeroCount"] == len(roots)
    assert max(functional_errors) < 1e-14
    assert max(conjugation_errors) < 1e-14

    named_cohorts = [
        {
            "threshold": cohort["threshold"],
            "cohortSize": cohort["cohortSize"],
            "carrierBlock": [cohort["carrierStart"], cohort["carrierEnd"]],
            "remainingGap": cohort["remainingGap"],
        }
        for cohort in completion.cohorts
        if int(cohort["threshold"]) in TERNARY_EVENTS
    ]
    compact_samples = [complex(0, 0), complex(0.3, 2), complex(-0.4, 5)]
    return {
        "stage": cutoff,
        "scenario": scenario,
        "ternaryMeaning": completion.model,
        "originModel": completion.origin,
        "schedule": schedule,
        "finiteCarrierCount": completion.population,
        "ternaryEvents": completion.ternary_metadata,
        "namedCarrierCohorts": named_cohorts,
        "maximumCarrierGap": completion.maximum_gap,
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


model_diagnostics = {
    scenario: {
        schedule: [diagnose(stage, scenario, schedule) for stage in STAGES]
        for schedule in SCHEDULES
    }
    for scenario in SCENARIOS
}
for schedules in model_diagnostics.values():
    for diagnostics in schedules.values():
        assert [entry["criticalLineRootCount"] for entry in diagnostics] == [2, 2, 4, 3]

through_1000 = {}
for scenario in SCENARIOS:
    cohorts, metadata = scenario_cohorts(3, scenario)
    through_1000[scenario] = {
        "finiteCarrierCount": sum(int(cohort["cohortSize"]) for cohort in cohorts),
        "ternaryEvents": metadata,
        "cohorts": cohorts,
    }
assert [through_1000[scenario]["finiteCarrierCount"] for scenario in SCENARIOS] == [
    13, 14, 12, 10, 11, 9, 5, 7, 4
]

results = {
    "analysisDate": "2026-10-14",
    "title": "Ternary splice models at 100, 666 and 999",
    "question": "what changes if the splices at 100, 666 and 999 each splice into three?",
    "verdict": {
        "rhProved": False,
        "allThreeMeaningsOfThreeTested": True,
        "allSpliceAtOneModelsRetained": True,
        "scenarioCount": len(SCENARIOS),
        "clockScheduleCount": len(SCHEDULES),
        "finiteCompletedFamiliesConstructed": True,
        "functionalEquationPreserved": True,
        "conjugationPreserved": True,
        "locallyUniformLimitIsXi": True,
        "offLineZerosDetectedThroughHeight30": False,
        "globalGoldenZeroBoundProved": False,
        "ternarySplicingForcesGlobalBound": False,
        "conclusion": (
            "interpreting three as three new carriers, three total branches, or three internal states changes "
            "the population and representation theory but not the bounded-window zero verdict. All eighteen "
            "scenario/schedule paths have only critical-line zeros through height 30 at the selected cutoffs; "
            "none removes the escaping-quartet obstruction."
        ),
    },
    "ternaryEvents": TERNARY_EVENTS,
    "models": {
        "threeNew": {
            "meaning": "each named event contributes a cohort of three new carriers",
            "carrierCountsThrough1000": {"zerothSeed": 13, "reindexed": 14, "boundaryOnly": 12},
        },
        "threeTotal": {
            "meaning": "one incoming path becomes three outgoing paths, so the net new cohort has size two",
            "carrierCountsThrough1000": {"zerothSeed": 10, "reindexed": 11, "boundaryOnly": 9},
        },
        "threeState": {
            "meaning": "one scalar carrier has a Z_3 internal state; without state-dependent coupling no new theta carrier appears",
            "carrierCountsThrough1000": {"zerothSeed": 5, "reindexed": 7, "boundaryOnly": 4},
            "fourierDecomposition": "C^3 = 1 (+) chi (+) conjugate(chi)",
            "scalarConsequence": "the invariant scalar completion sees only the mean channel",
        },
    },
    "populationConvention": (
        "in the three-new and three-total models the existing cohort at 100 is replaced by size three or two; "
        "666 and 999 add cohorts of the same size. The distinguished station 333 is not assigned a ternary "
        "cohort in this isolated hypothesis."
    ),
    "delayLaw": (
        "named-event depth is log_10(q), shifted by one in the reindexed origin model; each event has its own "
        "clock and chronological age N-log_10(q) or equal local ticks N"
    ),
    "through1000": through_1000,
    "finiteCompletion": {
        "formula": (
            "Xi(s)=1/2+[s(s-1)/2] integral_1^infinity sum_B (1-g_B) "
            "sum_(m in B) exp(-pi m^2 x) [x^(s/2)+x^((1-s)/2)] dx/x"
        ),
        "entire": True,
        "functionalEquation": "Xi(s)=Xi(1-s)",
        "conjugation": "Xi(conj(s))=conj(Xi(s))",
        "limit": "every fixed carrier coefficient tends to one along cofinal clocks, so every family tends locally uniformly to xi",
    },
    "representationAssessment": {
        "ternaryGroup": "Z_3",
        "characters": ["1", "omega", "omega^2"],
        "identity": "1+omega+omega^2=0",
        "consequence": (
            "a symmetric scalar trace cancels the two nontrivial phase channels; a spectral effect requires a "
            "derived coupling that distinguishes them"
        ),
    },
    "modelDiagnostics": model_diagnostics,
    "stressFamily": {
        "factor": "P_N(z)=[1-z^2/(1/4+i phi^N)^2][1-z^2/(1/4-i phi^N)^2]",
        "zeros": "s=1/2 +/- 1/4 +/- i phi^N",
        "consequence": (
            "ternary branching does not prevent an off-line quartet from escaping upward while all completion "
            "symmetries and the compact xi limit are preserved"
        ),
    },
    "logicalAssessment": {
        "robustResult": "no off-line zero detected through height 30 in any of eighteen tested paths",
        "missingConditions": [
            "a TTI rule deciding whether three counts new carriers, total branches or internal states",
            "a state-dependent coupling if the nontrivial Z_3 channels are to affect the scalar completion",
            "a derived clock law for 100, 666 and 999",
            "uniform-in-height zero control excluding escaping quartets",
        ],
        "status": "ternary splicing changes finite multiplicity but does not establish RH",
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Ternary splice investigation complete.")
for scenario in SCENARIOS:
    count = through_1000[scenario]["finiteCarrierCount"]
    zeros = [entry["criticalLineRootCount"] for entry in model_diagnostics[scenario]["chronological"]]
    print(f"  {scenario}: carriers through 1000={count}, chronological counts={zeros}")
print("  Verdict: all bounded-window zeros are on-line; ternary branching does not force the global bound.")
