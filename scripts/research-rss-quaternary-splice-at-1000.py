#!/usr/bin/env python3
"""Compare a quaternary splice at 1000 alone and after the ternary splice models.

At 1000, "four" can mean four new carriers, four total outgoing branches
(a net cohort of three), or four internal states with no added scalar carrier.
The event is tested against the splice-at-one baseline and in combination with
all three meanings of ternary splicing at 100, 666 and 999. Each population is
run with chronological and equal-local-ticks schedules.
"""

from __future__ import annotations

import cmath
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-quaternary-splice-at-1000-results.json"
PHI = (1 + math.sqrt(5)) / 2
STAGES = [14, 20, 30, 40]
ORIGIN_MODELS = ["zeroth-seed", "reindexed-fibonacci", "boundary-only"]
TERNARY_MODELS = ["three-new", "three-total", "three-state"]
QUATERNARY_MODELS = ["four-new", "four-total", "four-state"]
SCHEDULES = ["chronological", "equal-local-ticks"]
TERNARY_EVENTS = [100, 666, 999]
QUATERNARY_EVENT = 1000
T_MAX = 30.0
NUMERICAL_CARRIER_LIMIT = 16

SCENARIOS = []
for quaternary_model in QUATERNARY_MODELS:
    for origin in ORIGIN_MODELS:
        SCENARIOS.append({
            "id": f"baseline-q-{quaternary_model}-{origin}",
            "scope": "baseline-only",
            "ternaryModel": None,
            "quaternaryModel": quaternary_model,
            "origin": origin,
        })
for ternary_model in TERNARY_MODELS:
    for quaternary_model in QUATERNARY_MODELS:
        for origin in ORIGIN_MODELS:
            SCENARIOS.append({
                "id": f"combined-t-{ternary_model}-q-{quaternary_model}-{origin}",
                "scope": "combined",
                "ternaryModel": ternary_model,
                "quaternaryModel": quaternary_model,
                "origin": origin,
            })
SCENARIO_BY_ID = {scenario["id"]: scenario for scenario in SCENARIOS}

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



def scenario_cohorts(cutoff: int, scenario_id: str) -> tuple[list[dict[str, object]], list[dict[str, object]], dict[str, object]]:
    scenario = SCENARIO_BY_ID[scenario_id]
    origin = str(scenario["origin"])
    ternary_model = scenario["ternaryModel"]
    quaternary_model = str(scenario["quaternaryModel"])
    depth_offset = 1.0 if origin == "reindexed-fibonacci" else 0.0
    cohorts: list[dict[str, object]] = []

    for level in range(cutoff + 1):
        size, depth, boundary_only = origin_size_depth(level, origin)
        threshold = 10 ** level
        if scenario["scope"] == "combined" and threshold == 100:
            if ternary_model == "three-new":
                size = 3
            elif ternary_model == "three-total":
                size = 2
        if threshold == QUATERNARY_EVENT:
            if quaternary_model == "four-new":
                size = 4
            elif quaternary_model == "four-total":
                size = 3
        cohorts.append({
            "threshold": threshold,
            "label": f"decimal-{threshold}",
            "cohortSize": size,
            "boundaryOnly": boundary_only,
            "delaySource": {
                "threshold": threshold,
                "depthIndex": depth,
                "birthCoordinate": float(level),
            },
        })

    ternary_metadata: list[dict[str, object]] = []
    if scenario["scope"] == "combined":
        if ternary_model in {"three-new", "three-total"}:
            size = 3 if ternary_model == "three-new" else 2
            for threshold in (666, 999):
                coordinate = math.log10(threshold)
                cohorts.append({
                    "threshold": threshold,
                    "label": f"ternary-{threshold}",
                    "cohortSize": size,
                    "boundaryOnly": False,
                    "delaySource": {
                        "threshold": threshold,
                        "depthIndex": coordinate + depth_offset,
                        "birthCoordinate": coordinate,
                    },
                })
        for threshold in TERNARY_EVENTS:
            coordinate = math.log10(threshold)
            ternary_metadata.append({
                "threshold": threshold,
                "branchCount": 3,
                "newCarrierCount": 3 if ternary_model == "three-new" else 2 if ternary_model == "three-total" else 0,
                "stateOnly": ternary_model == "three-state",
                "depthIndex": coordinate + depth_offset,
                "birthCoordinate": coordinate,
            })

    coordinate = math.log10(QUATERNARY_EVENT)
    quaternary_metadata = {
        "threshold": QUATERNARY_EVENT,
        "branchCount": 4,
        "newCarrierCount": 4 if quaternary_model == "four-new" else 3 if quaternary_model == "four-total" else 0,
        "stateOnly": quaternary_model == "four-state",
        "depthIndex": coordinate + depth_offset,
        "birthCoordinate": coordinate,
    }

    cohorts.sort(key=lambda cohort: int(cohort["threshold"]))
    carrier_end = 0
    for cohort in cohorts:
        size = int(cohort["cohortSize"])
        cohort["carrierStart"] = carrier_end + 1 if size else 0
        carrier_end += size
        cohort["carrierEnd"] = carrier_end if size else 0
    return cohorts, ternary_metadata, quaternary_metadata


class QuaternarySpliceCompletion:
    def __init__(self, cutoff: int, scenario_id: str, schedule: str):
        assert scenario_id in SCENARIO_BY_ID
        assert schedule in SCHEDULES
        self.cutoff = cutoff
        self.scenario = SCENARIO_BY_ID[scenario_id]
        self.schedule = schedule
        self.cohorts, self.ternary_metadata, self.quaternary_metadata = scenario_cohorts(cutoff, scenario_id)
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
        self.quaternary_metadata["localClockTicks"] = self.local_ticks(self.quaternary_metadata)
        self.quaternary_metadata["remainingGap"] = self.gap(self.quaternary_metadata)

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


def argument_count(completion: QuaternarySpliceCompletion) -> dict[str, float | int]:
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


def critical_line_roots(completion: QuaternarySpliceCompletion, spacing: float = 0.01) -> list[float]:
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



def diagnose(cutoff: int, scenario_id: str, schedule: str) -> dict[str, object]:
    completion = QuaternarySpliceCompletion(cutoff, scenario_id, schedule)
    samples = [complex(0.2, 3), complex(0.6, 8), complex(1.2, 4)]
    functional_errors = [abs(completion.value(s) - completion.value(1 - s)) for s in samples]
    conjugation_errors = [abs(completion.value(s.conjugate()) - completion.value(s).conjugate()) for s in samples]
    count = argument_count(completion)
    roots = critical_line_roots(completion)
    assert count["zeroCount"] == len(roots)
    assert max(functional_errors) < 1e-14
    assert max(conjugation_errors) < 1e-14

    event_cohort = next(cohort for cohort in completion.cohorts if int(cohort["threshold"]) == QUATERNARY_EVENT)
    compact_samples = [complex(0, 0), complex(0.3, 2), complex(-0.4, 5)]
    return {
        "stage": cutoff,
        "scenario": scenario_id,
        "scope": completion.scenario["scope"],
        "ternaryMeaning": completion.scenario["ternaryModel"],
        "quaternaryMeaning": completion.scenario["quaternaryModel"],
        "originModel": completion.scenario["origin"],
        "schedule": schedule,
        "finiteCarrierCount": completion.population,
        "ternaryEvents": completion.ternary_metadata,
        "quaternaryEvent": completion.quaternary_metadata,
        "quaternaryCarrierCohort": {
            "threshold": event_cohort["threshold"],
            "cohortSize": event_cohort["cohortSize"],
            "carrierBlock": [event_cohort["carrierStart"], event_cohort["carrierEnd"]],
            "remainingGap": event_cohort["remainingGap"],
        },
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
    scenario["id"]: {
        schedule: [diagnose(stage, scenario["id"], schedule) for stage in STAGES]
        for schedule in SCHEDULES
    }
    for scenario in SCENARIOS
}
for schedules in model_diagnostics.values():
    for diagnostics in schedules.values():
        assert [entry["criticalLineRootCount"] for entry in diagnostics] == [2, 2, 4, 3]

through_1000 = {}
for scenario in SCENARIOS:
    cohorts, ternary_metadata, quaternary_metadata = scenario_cohorts(3, scenario["id"])
    through_1000[scenario["id"]] = {
        "scope": scenario["scope"],
        "ternaryMeaning": scenario["ternaryModel"],
        "quaternaryMeaning": scenario["quaternaryModel"],
        "originModel": scenario["origin"],
        "finiteCarrierCount": sum(int(cohort["cohortSize"]) for cohort in cohorts),
        "ternaryEvents": ternary_metadata,
        "quaternaryEvent": quaternary_metadata,
        "cohorts": cohorts,
    }

expected_baseline = {
    "four-new": [7, 8, 6],
    "four-total": [6, 7, 5],
    "four-state": [5, 7, 4],
}
expected_combined = {
    ("three-new", "four-new"): [15, 15, 14],
    ("three-new", "four-total"): [14, 14, 13],
    ("three-new", "four-state"): [13, 14, 12],
    ("three-total", "four-new"): [12, 12, 11],
    ("three-total", "four-total"): [11, 11, 10],
    ("three-total", "four-state"): [10, 11, 9],
    ("three-state", "four-new"): [7, 8, 6],
    ("three-state", "four-total"): [6, 7, 5],
    ("three-state", "four-state"): [5, 7, 4],
}
for quaternary_model, counts in expected_baseline.items():
    actual = [through_1000[f"baseline-q-{quaternary_model}-{origin}"]["finiteCarrierCount"] for origin in ORIGIN_MODELS]
    assert actual == counts
for meanings, counts in expected_combined.items():
    ternary_model, quaternary_model = meanings
    actual = [through_1000[f"combined-t-{ternary_model}-q-{quaternary_model}-{origin}"]["finiteCarrierCount"] for origin in ORIGIN_MODELS]
    assert actual == counts

results = {
    "analysisDate": "2026-10-14",
    "title": "Quaternary splice models at 1000",
    "question": "what changes if the event at 1000 splices into four?",
    "verdict": {
        "rhProved": False,
        "allThreeMeaningsOfFourTested": True,
        "baselineAndTernaryScopesCompared": True,
        "allSpliceAtOneModelsRetained": True,
        "populationScenarioCount": len(SCENARIOS),
        "clockScheduleCount": len(SCHEDULES),
        "diagnosticPathCount": len(SCENARIOS) * len(SCHEDULES),
        "finiteCompletedFamiliesConstructed": True,
        "functionalEquationPreserved": True,
        "conjugationPreserved": True,
        "locallyUniformLimitIsXi": True,
        "offLineZerosDetectedThroughHeight30": False,
        "globalGoldenZeroBoundProved": False,
        "quaternarySplicingForcesGlobalBound": False,
        "conclusion": (
            "four new carriers, four total branches, and four internal states at 1000 all give coherent finite "
            "completions, both alone and after the ternary events. The bounded-window zeros remain on-line, "
            "but every path retains the escaping-quartet obstruction."
        ),
    },
    "scopes": ["baseline-only", "combined"],
    "ternaryEventsInCombinedScope": TERNARY_EVENTS,
    "quaternaryEvent": QUATERNARY_EVENT,
    "models": {
        "fourNew": {
            "meaning": "the 1000 event contributes a replacement cohort of four new carriers",
            "baselineCarrierCountsThrough1000": {"zerothSeed": 7, "reindexed": 8, "boundaryOnly": 6},
        },
        "fourTotal": {
            "meaning": "one incoming path becomes four outgoing paths, so the replacement net cohort has size three",
            "baselineCarrierCountsThrough1000": {"zerothSeed": 6, "reindexed": 7, "boundaryOnly": 5},
            "reindexedCoincidence": "the existing reindexed F_4=3 cohort already equals the net cohort of a four-way fork",
        },
        "fourState": {
            "meaning": "the 1000 channel has four internal states; without a state-dependent coupling no new theta carrier appears",
            "baselineCarrierCountsThrough1000": {"zerothSeed": 5, "reindexed": 7, "boundaryOnly": 4},
            "cyclicDecomposition": "C^4 = 1 (+) chi (+) chi^2 (+) chi^3",
            "scalarConsequence": "a symmetric scalar completion sees only the invariant mean channel",
        },
    },
    "populationConvention": (
        "four-new and four-total replace the existing 1000 cohort by size four or three. Four-state leaves the "
        "base population unchanged. In the combined scope, the selected ternary model at 100, 666 and 999 is retained."
    ),
    "delayLaw": (
        "the 1000 depth is log_10(1000)=3, shifted to four in the reindexed origin model; it has its own clock "
        "and chronological age N-3 or equal local ticks N"
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
        "cyclicCandidate": "Z_4",
        "characters": ["1", "i", "-1", "-i"],
        "identity": "1+i-1-i=0",
        "decomposition": "C^4 = 1 (+) chi (+) chi^2 (+) chi^3",
        "nonUniqueness": "four states do not select Z_4 uniquely; the Klein four group and non-cyclic permutation actions require separate coupling rules",
        "consequence": (
            "a symmetric scalar trace cancels every nontrivial character channel; a spectral effect requires a "
            "derived state-dependent coupling"
        ),
    },
    "modelDiagnostics": model_diagnostics,
    "stressFamily": {
        "factor": "P_N(z)=[1-z^2/(1/4+i phi^N)^2][1-z^2/(1/4-i phi^N)^2]",
        "zeros": "s=1/2 +/- 1/4 +/- i phi^N",
        "consequence": (
            "quaternary branching does not prevent an off-line quartet from escaping upward while all completion "
            "symmetries and the compact xi limit are preserved"
        ),
    },
    "logicalAssessment": {
        "robustResult": "no off-line zero detected through height 30 in any of seventy-two tested paths",
        "structuralFit": "under reindexed Fibonacci, F_4=3 is exactly the net new cohort for one incoming path splitting into four total branches",
        "missingConditions": [
            "a TTI rule deciding whether four counts new carriers, total branches or internal states",
            "a rule selecting Z_4, the Klein four group or another four-state action",
            "a state-dependent coupling if nontrivial internal channels are to affect the scalar completion",
            "a derived clock law at 1000",
            "uniform-in-height zero control excluding escaping quartets",
        ],
        "status": "the four-total reading fits the reindexed F_4 cohort, but quaternary splicing does not establish RH",
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Quaternary splice-at-1000 investigation complete.")
print(f"  Population scenarios: {len(SCENARIOS)}; clock paths: {len(SCENARIOS) * len(SCHEDULES)}")
for model in QUATERNARY_MODELS:
    counts = [through_1000[f"baseline-q-{model}-{origin}"]["finiteCarrierCount"] for origin in ORIGIN_MODELS]
    print(f"  baseline {model}: carriers through 1000={counts}")
for ternary_model in TERNARY_MODELS:
    for quaternary_model in QUATERNARY_MODELS:
        counts = [through_1000[f"combined-t-{ternary_model}-q-{quaternary_model}-{origin}"]["finiteCarrierCount"] for origin in ORIGIN_MODELS]
        print(f"  combined {ternary_model} + {quaternary_model}: carriers through 1000={counts}")
print("  Verdict: all bounded-window zeros are on-line; quaternary branching does not force the global bound.")
