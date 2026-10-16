#!/usr/bin/env python3
"""Finite completed functions for per-splice golden delays, including x=1.

TTI places a splice at 1 as well as at 10, 100, 1000, ... .  Its Fibonacci
indexing is not yet fixed, so this verifier compares all three coherent readings:

  zeroth-seed:          x=1 has one seed carrier; 10 keeps index F_1;
  reindexed-fibonacci:  x=1 receives F_1 and every later splice shifts;
  boundary-only:        x=1 has a delay but no theta carrier.

Every carrier-bearing splice has its own initial golden depth and local clock.
The resulting finite theta completions are entire and preserve both xi
symmetries. Numerical zero counts use a discrete argument-principle winding
number and bracketed critical-line roots. Only the Python standard library is
used.
"""

from __future__ import annotations

import cmath
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-golden-catchup-completion-results.json"
PHI = (1 + math.sqrt(5)) / 2
STAGES = [14, 20, 30, 40]
MODELS = ["zeroth-seed", "reindexed-fibonacci", "boundary-only"]
SCHEDULES = ["chronological", "equal-local-ticks"]
T_MAX = 30.0
NUMERICAL_CARRIER_LIMIT = 16


def fibonacci(index: int) -> int:
    left, right = 0, 1
    for _ in range(index):
        left, right = right, left + right
    return left


def cohort_specifications(cutoff: int, model: str) -> list[dict[str, int | bool]]:
    """Return splice levels 0,...,cutoff and their carrier/depth data.

    `level` is the decimal exponent, so threshold=10^level and level zero is
    the splice at 1. `depthIndex` means initial gap phi^(-depthIndex).
    """
    assert model in MODELS
    specifications: list[dict[str, int | bool]] = []
    carrier_end = 0
    for level in range(cutoff + 1):
        if model == "zeroth-seed":
            cohort_size = 1 if level == 0 else fibonacci(level)
            depth_index = level
            boundary_only = False
        elif model == "reindexed-fibonacci":
            cohort_size = fibonacci(level + 1)
            depth_index = level + 1
            boundary_only = False
        else:
            cohort_size = 0 if level == 0 else fibonacci(level)
            depth_index = level
            boundary_only = level == 0

        carrier_start = carrier_end + 1 if cohort_size else 0
        carrier_end += cohort_size
        specifications.append(
            {
                "level": level,
                "threshold": 10 ** level,
                "cohortSize": cohort_size,
                "depthIndex": depth_index,
                "carrierStart": carrier_start,
                "carrierEnd": carrier_end if cohort_size else 0,
                "boundaryOnly": boundary_only,
            }
        )
    return specifications


def gauss_legendre(count: int, lower: float, upper: float) -> tuple[list[float], list[float]]:
    nodes = [0.0] * count
    weights = [0.0] * count
    half = (count + 1) // 2
    midpoint = (lower + upper) / 2
    radius = (upper - lower) / 2
    for index in range(1, half + 1):
        root = math.cos(math.pi * (index - 0.25) / (count + 0.5))
        while True:
            p1 = 1.0
            p2 = 0.0
            for degree in range(1, count + 1):
                p3 = p2
                p2 = p1
                p1 = ((2 * degree - 1) * root * p2 - (degree - 1) * p3) / degree
            derivative = count * (root * p1 - p2) / (root * root - 1)
            previous = root
            root = previous - p1 / derivative
            if abs(root - previous) < 1e-15:
                break
        weight = (upper - lower) / ((1 - root * root) * derivative * derivative)
        nodes[index - 1] = midpoint - radius * root
        nodes[count - index] = midpoint + radius * root
        weights[index - 1] = weight
        weights[count - index] = weight
    return nodes, weights


# u=log x. Beyond u=6 the first theta term is below floating range. At x>=1,
# carrier m>=16 is likewise below binary64 range. The mathematical functions
# retain every finite carrier; the evaluator omits only underflowed terms.
QUADRATURE_NODES, QUADRATURE_WEIGHTS = gauss_legendre(256, 0.0, 6.0)


class PerSpliceThetaCompletion:
    """Finite completed theta function for one indexing model and clock schedule."""

    def __init__(self, cutoff: int, model: str, schedule: str):
        assert schedule in SCHEDULES
        self.cutoff = cutoff
        self.model = model
        self.schedule = schedule
        self.cohorts = cohort_specifications(cutoff, model)
        self.population = sum(int(cohort["cohortSize"]) for cohort in self.cohorts)
        self.cohort_gaps = {
            int(cohort["level"]): self.gap_for_cohort(cohort)
            for cohort in self.cohorts
        }
        carrier_gaps = [
            self.cohort_gaps[int(cohort["level"])]
            for cohort in self.cohorts
            if int(cohort["cohortSize"]) > 0
        ]
        self.maximum_gap = max(carrier_gaps)
        self.minimum_gap = min(carrier_gaps)

        numerical_carriers: dict[int, tuple[int, float]] = {}
        for cohort in self.cohorts:
            level = int(cohort["level"])
            start = int(cohort["carrierStart"])
            end = min(int(cohort["carrierEnd"]), NUMERICAL_CARRIER_LIMIT)
            if start:
                for carrier in range(start, end + 1):
                    numerical_carriers[carrier] = (level, self.cohort_gaps[level])

        self.features: list[tuple[float, float]] = []
        for u, quadrature_weight in zip(QUADRATURE_NODES, QUADRATURE_WEIGHTS):
            x = math.exp(u)
            delayed_theta = sum(
                (1 - gap) * math.exp(-math.pi * carrier * carrier * x)
                for carrier, (_, gap) in numerical_carriers.items()
            )
            feature_weight = quadrature_weight * 2 * math.exp(u / 4) * delayed_theta
            self.features.append((u, feature_weight))

    def clock_for_level(self, level: int) -> int:
        if self.schedule == "chronological":
            return self.cutoff - level
        return self.cutoff

    def gap_for_cohort(self, cohort: dict[str, int | bool]) -> float:
        depth_index = int(cohort["depthIndex"])
        level = int(cohort["level"])
        return PHI ** (-(depth_index + self.clock_for_level(level)))

    def value(self, s: complex) -> complex:
        centered = s - 0.5
        integral = sum(
            weight * cmath.cosh(centered * u / 2)
            for u, weight in self.features
        )
        return 0.5 + 0.5 * (centered * centered - 0.25) * integral


def rectangle_boundary(
    beta_left: float,
    beta_right: float,
    gamma_bottom: float,
    gamma_top: float,
    horizontal_steps: int,
    vertical_steps: int,
) -> list[complex]:
    points = [
        complex(beta_left + (beta_right - beta_left) * index / horizontal_steps, gamma_bottom)
        for index in range(horizontal_steps)
    ]
    points.extend(
        complex(beta_right, gamma_bottom + (gamma_top - gamma_bottom) * index / vertical_steps)
        for index in range(vertical_steps)
    )
    points.extend(
        complex(beta_right - (beta_right - beta_left) * index / horizontal_steps, gamma_top)
        for index in range(horizontal_steps)
    )
    points.extend(
        complex(beta_left, gamma_top - (gamma_top - gamma_bottom) * index / vertical_steps)
        for index in range(vertical_steps + 1)
    )
    return points


def argument_count(completion: PerSpliceThetaCompletion) -> dict[str, float | int]:
    points = rectangle_boundary(0.0, 1.0, 0.0, T_MAX, 250, 1500)
    values = [completion.value(point) for point in points]
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


def critical_line_roots(
    completion: PerSpliceThetaCompletion,
    maximum: float = T_MAX,
    spacing: float = 0.01,
) -> list[float]:
    def line_value(gamma: float) -> float:
        value = completion.value(complex(0.5, gamma))
        assert abs(value.imag) < 1e-12
        return value.real

    roots: list[float] = []
    left = 0.0
    left_value = line_value(left)
    for index in range(1, round(maximum / spacing) + 1):
        right = index * spacing
        right_value = line_value(right)
        if left_value * right_value < 0:
            low = left
            high = right
            low_value = left_value
            for _ in range(55):
                middle = (low + high) / 2
                middle_value = line_value(middle)
                if low_value * middle_value <= 0:
                    high = middle
                else:
                    low = middle
                    low_value = middle_value
            roots.append((low + high) / 2)
        left = right
        left_value = right_value
    return roots


def escaping_quartet_factor(centered: complex, cutoff: int, eta: float = 0.25) -> complex:
    height = PHI ** cutoff
    upper = complex(eta, height)
    lower = upper.conjugate()
    return (1 - centered * centered / (upper * upper)) * (
        1 - centered * centered / (lower * lower)
    )


def diagnose(cutoff: int, model: str, schedule: str) -> dict[str, object]:
    completion = PerSpliceThetaCompletion(cutoff, model, schedule)
    symmetry_samples = [complex(0.2, 3), complex(0.6, 8), complex(1.2, 4)]
    functional_errors = [
        abs(completion.value(sample) - completion.value(1 - sample))
        for sample in symmetry_samples
    ]
    conjugation_errors = [
        abs(completion.value(sample.conjugate()) - completion.value(sample).conjugate())
        for sample in symmetry_samples
    ]
    assert max(functional_errors) < 1e-14
    assert max(conjugation_errors) < 1e-14

    count = argument_count(completion)
    line_roots = critical_line_roots(completion)
    assert count["zeroCount"] == len(line_roots)

    stress_eta = 0.25
    assert stress_eta > 0.5 * completion.maximum_gap
    compact_samples = [complex(0, 0), complex(0.3, 2), complex(-0.4, 5)]
    compact_factor_errors = [
        abs(escaping_quartet_factor(value, cutoff, stress_eta) - 1)
        for value in compact_samples
    ]

    sample_cohorts = [cohort for cohort in completion.cohorts if int(cohort["level"]) <= 3]
    return {
        "stage": cutoff,
        "maximumDecimalThreshold": f"10^{cutoff}",
        "model": model,
        "schedule": schedule,
        "finiteCarrierCount": completion.population,
        "cohortDelaySamples": [
            {
                **cohort,
                "localClockTicks": completion.clock_for_level(int(cohort["level"])),
                "remainingGap": completion.cohort_gaps[int(cohort["level"])],
            }
            for cohort in sample_cohorts
        ],
        "maximumCarrierGap": completion.maximum_gap,
        "minimumCarrierGap": completion.minimum_gap,
        "candidateHalfWidthFromMaximumGap": 0.5 * completion.maximum_gap,
        "rectangle": {"beta": [0, 1], "gamma": [0, T_MAX]},
        "argumentPrinciple": count,
        "criticalLineRoots": line_roots,
        "criticalLineRootCount": len(line_roots),
        "offLineZerosDetectedInRectangle": count["zeroCount"] - len(line_roots),
        "observedMaximumHorizontalDisplacement": 0.0,
        "finiteWindowGoldenBoundPassed": True,
        "maximumFunctionalSymmetryError": max(functional_errors),
        "maximumConjugationError": max(conjugation_errors),
        "escapingQuartetStressTest": {
            "eta": stress_eta,
            "gamma": PHI ** cutoff,
            "violatesCandidateHalfWidth": stress_eta > 0.5 * completion.maximum_gap,
            "maximumCompactFactorError": max(compact_factor_errors),
        },
    }


model_diagnostics: dict[str, dict[str, list[dict[str, object]]]] = {}
for model in MODELS:
    model_diagnostics[model] = {}
    for schedule in SCHEDULES:
        model_diagnostics[model][schedule] = [
            diagnose(stage, model, schedule) for stage in STAGES
        ]

for schedules in model_diagnostics.values():
    for diagnostics in schedules.values():
        assert [entry["criticalLineRootCount"] for entry in diagnostics] == [2, 2, 4, 3]

# At 1000 (decimal exponent 3), the three interpretations have different
# finite carrier counts. This is the exact ambiguity created by adding x=1.
at_1000 = {
    model: {
        "cohorts": cohort_specifications(3, model),
        "finiteCarrierCount": sum(
            int(cohort["cohortSize"]) for cohort in cohort_specifications(3, model)
        ),
    }
    for model in MODELS
}
assert [at_1000[model]["finiteCarrierCount"] for model in MODELS] == [5, 7, 4]

results = {
    "analysisDate": "2026-10-14",
    "title": "Per-splice golden-delay completions including the splice at one",
    "correction": {
        "previousOmission": "the per-splice model began at 10 and omitted TTI's splice at 1",
        "correctedThresholds": "1,10,100,1000,... = 10^ell for ell>=0",
        "unresolvedIndexing": (
            "TTI does not yet specify whether the splice at 1 is a zeroth seed, the first Fibonacci "
            "cohort, or a carrier-free boundary, so all three readings are tested"
        ),
    },
    "verdict": {
        "rhProved": False,
        "spliceAtOneIncluded": True,
        "allThreeIndexingModelsTested": True,
        "finiteCompletedFamiliesConstructed": True,
        "functionalEquationPreserved": True,
        "conjugationPreserved": True,
        "locallyUniformLimitIsXi": True,
        "finiteWindowGoldenBoundObservedInAllModels": True,
        "globalGoldenZeroBoundProved": False,
        "spliceAtOneResolvesGlobalBound": False,
        "conclusion": (
            "all three coherent treatments of the splice at 1 yield entire, symmetry-preserving finite theta "
            "completions. Under both tested clock schedules each model has only critical-line zeros through "
            "height 30 at the selected stages. The indexing changes carrier counts and ordinates but does not "
            "remove the escaping-quartet obstruction to a global shrinking strip."
        ),
    },
    "delayLaw": {
        "decimalLevel": "ell>=0",
        "spliceThreshold": "10^ell",
        "independentClock": "k_ell>=0",
        "remainingGap": "g_(ell,k)=phi^(-(d_ell+k_ell)), where d_ell depends on the indexing model",
        "caughtFraction": "a_(ell,k)=1-g_(ell,k)",
    },
    "indexingModels": {
        "zerothSeed": {
            "description": (
                "level 0 at x=1 has one seed carrier with d_0=0; levels ell>=1 keep cohort F_ell "
                "and depth index d_ell=ell"
            ),
            "carrierCountThrough1000": 5,
            "preservesPublished10BasedIndexing": True,
        },
        "reindexedFibonacci": {
            "description": (
                "level ell receives cohort F_(ell+1) and depth index d_ell=ell+1, so x=1 is the first "
                "Fibonacci splice and every later label shifts"
            ),
            "carrierCountThrough1000": 7,
            "preservesPublished10BasedIndexing": False,
        },
        "boundaryOnly": {
            "description": (
                "x=1 has a geometric delay with d_0=0 but no theta carrier; levels ell>=1 retain the "
                "published F_ell cohorts"
            ),
            "carrierCountThrough1000": 4,
            "analyticConsequence": "without a coupling or carrier, the x=1 boundary does not alter the zeros",
        },
    },
    "at1000": at_1000,
    "finiteCompletion": {
        "delayedThetaCarrier": (
            "Psi_(N,k)(x)=sum_over_active_cohorts [1-phi^(-(d_ell+k_ell))] "
            "sum_(m in B_ell) exp(-pi m^2 x)"
        ),
        "formula": (
            "Xi_(N,k)(s)=1/2 + [s(s-1)/2] integral_1^infinity Psi_(N,k)(x) "
            "[x^(s/2)+x^((1-s)/2)] dx/x"
        ),
        "entire": True,
        "functionalEquation": "Xi_(N,k)(s)=Xi_(N,k)(1-s)",
        "conjugation": "Xi_(N,k)(conj(s))=conj(Xi_(N,k)(s))",
        "limit": (
            "as the decimal cutoff tends to infinity and every fixed carrier-bearing cohort clock tends to "
            "infinity, every fixed theta coefficient tends to one and Xi_(N,k) tends locally uniformly to xi"
        ),
        "numericalMethod": "256-point Gauss-Legendre quadrature in u=log x on [0,6]",
    },
    "testedSchedules": {
        "chronological": (
            "k_ell=N-ell. Zeroth-seed and boundary models synchronise carrier gaps to phi^(-N); "
            "the reindexed model synchronises them to phi^(-(N+1))."
        ),
        "equalLocalTicks": (
            "k_ell=N. Initial depths remain visible, producing distinct gaps within each carrier-bearing model."
        ),
    },
    "modelDiagnostics": model_diagnostics,
    # Backwards-compatible primary path: the zeroth-seed model preserves the
    # existing 10/100/1000 Fibonacci labels while adding x=1.
    "stageDiagnostics": model_diagnostics["zeroth-seed"]["chronological"],
    "independentClockDiagnostics": model_diagnostics["zeroth-seed"]["equal-local-ticks"],
    "stressFamily": {
        "centeredFactor": (
            "P_N(z)=[1-z^2/(a+i phi^N)^2][1-z^2/(a-i phi^N)^2], a=1/4"
        ),
        "completedFunction": "hat_Xi_N(s)=Xi_N(s) P_N(s-1/2)",
        "properties": [
            "hat_Xi_N is entire",
            "hat_Xi_N(s)=hat_Xi_N(1-s)",
            "hat_Xi_N(conj(s))=conj(hat_Xi_N(s))",
            "P_N tends to one locally at order phi^(-2N), so hat_Xi_N has the same locally uniform xi limit",
            "each stage has an off-line quartet with |eta|=1/4 at height phi^N",
        ],
        "consequence": (
            "including the splice at 1, under any of the three indexing conventions, does not imply a global "
            "shrinking zero strip"
        ),
    },
    "logicalAssessment": {
        "sufficientTheorem": (
            "if a selected indexing and clock schedule gives local convergence and every stage zero obeys a "
            "shrinking bound with no escaping quartets, then Rouche/Hurwitz forces RH"
        ),
        "missingConditions": [
            "a TTI rule choosing among the three splice-at-one indexing models",
            "a derived relation between every local clock and the global cutoff",
            "a global zero count matching xi rather than fixed-height counts",
            "an exclusion of escaping off-line quartets at heights growing with the cutoff",
        ],
        "status": "the splice at 1 changes the finite bookkeeping but does not establish the global bound",
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Splice-at-one golden-delay completion investigation complete.")
for model in MODELS:
    print(f"  Model: {model}; carriers through 1000={at_1000[model]['finiteCarrierCount']}")
    for schedule in SCHEDULES:
        counts = [
            entry["criticalLineRootCount"]
            for entry in model_diagnostics[model][schedule]
        ]
        print(f"    {schedule}: counts={counts}, off-line detected=0")
print("  Verdict: all three models pass the bounded window; none forces a global zero strip.")
