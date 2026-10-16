#!/usr/bin/env python3
"""Thirty-fifth-stage negative-index and conductor-commutator fail-fast gate.

The program proves the finite synthetic inertia theorem by exact arithmetic:
the reflection permutation form has one negative square per nontrivial mirror
2-cycle.  A full off-line quartet has two such cycles.  Polynomial evaluation
at distinct nodes is a Vandermonde isomorphism, so Sylvester inertia is
unchanged after pulling the form back to coefficient space.

It then records the arithmetic promotion test.  For zeta, the corresponding
completed form is the Weil explicit-formula form.  Establishing index zero on
its complete test domain is Weil positivity and therefore RH-equivalent.  The
existing local conductor commutators do not provide a global Fredholm pair
with an independently computed arithmetic index.
"""

from __future__ import annotations

import hashlib
import json
import sys
from decimal import Decimal, getcontext
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-negative-index-conductor-gate-results.json"

sys.set_int_max_str_digits(100_000)
getcontext().prec = 60

Node = tuple[Fraction, Fraction]  # centered coordinate eta+i*gamma


def mirror(node: Node) -> Node:
    """Centered functional-equation reflection z -> -conjugate(z)."""
    eta, gamma = node
    return -eta, gamma


def conjugate(node: Node) -> Node:
    eta, gamma = node
    return eta, -gamma


def quartet(eta: Fraction, gamma: Fraction) -> list[Node]:
    rho = (eta, gamma)
    return [rho, mirror(rho), conjugate(rho), mirror(conjugate(rho))]


def reflection_cycles(nodes: list[Node]) -> tuple[int, list[tuple[int, int]]]:
    index = {node: i for i, node in enumerate(nodes)}
    assert len(index) == len(nodes), "nodes must be distinct for the simple-node census"
    fixed = 0
    pairs: list[tuple[int, int]] = []
    seen: set[int] = set()
    for i, node in enumerate(nodes):
        if i in seen:
            continue
        j = index[mirror(node)]
        if i == j:
            fixed += 1
            seen.add(i)
        else:
            pairs.append((min(i, j), max(i, j)))
            seen.update([i, j])
    pairs = sorted(set(pairs))
    assert fixed + 2 * len(pairs) == len(nodes)
    return fixed, pairs


def reflection_matrix(nodes: list[Node]) -> list[list[int]]:
    index = {node: i for i, node in enumerate(nodes)}
    matrix = [[0 for _ in nodes] for _ in nodes]
    for i, node in enumerate(nodes):
        matrix[i][index[mirror(node)]] = 1
    # Exact involutive Hermitian permutation matrix.
    for i in range(len(nodes)):
        for j in range(len(nodes)):
            assert matrix[i][j] == matrix[j][i]
            square_entry = sum(
                matrix[i][k] * matrix[k][j] for k in range(len(nodes))
            )
            assert square_entry == (1 if i == j else 0)
    return matrix


def abs_difference_squared(a: Node, b: Node) -> Fraction:
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2


def vandermonde_abs_squared(nodes: list[Node]) -> Fraction:
    product = Fraction(1)
    for j in range(len(nodes)):
        for i in range(j):
            product *= abs_difference_squared(nodes[j], nodes[i])
    return product


def decimal_text(value: Fraction) -> str:
    return format(Decimal(value.numerator) / Decimal(value.denominator), ".40E")


def fingerprint(value: Fraction) -> str:
    text = f"{value.numerator}/{value.denominator}"
    return hashlib.sha256(text.encode()).hexdigest()


def configuration_row(name: str, nodes: list[Node]) -> dict[str, object]:
    fixed, pairs = reflection_cycles(nodes)
    positive = fixed + len(pairs)
    negative = len(pairs)
    zero = 0
    determinant_sign = -1 if negative % 2 else 1
    vandermonde = vandermonde_abs_squared(nodes)
    assert vandermonde > 0
    return {
        "name": name,
        "dimension": len(nodes),
        "fixedCriticalNodes": fixed,
        "mirrorTwoCycles": len(pairs),
        "inertia": {"positive": positive, "negative": negative, "zero": zero},
        "reflectionMatrix": reflection_matrix(nodes),
        "determinantSign": determinant_sign,
        "vandermondeAbsSquared": decimal_text(vandermonde),
        "vandermondeFingerprint": fingerprint(vandermonde),
        "proof": (
            "J has one +1 for every fixed node and eigenvalues (+1,-1) on every mirror 2-cycle; "
            "G=V*JV has the same inertia because the distinct-node Vandermonde V is invertible"
        ),
    }


critical_nodes = [
    (Fraction(0), Fraction(14)),
    (Fraction(0), Fraction(-14)),
    (Fraction(0), Fraction(21)),
    (Fraction(0), Fraction(-21)),
]
one_quartet = quartet(Fraction(1, 10), Fraction(14))
two_quartets = one_quartet + quartet(Fraction(1, 4), Fraction(21))
near_line_quartet = quartet(Fraction(1, 1_000_000), Fraction(14))
high_quartet = quartet(Fraction(1, 10), Fraction(1_000_000))

configuration_rows = [
    configuration_row("four simple critical-line nodes", critical_nodes),
    configuration_row("one simple off-line quartet", one_quartet),
    configuration_row("two simple off-line quartets", two_quartets),
    configuration_row("one quartet at displacement 10^-6", near_line_quartet),
    configuration_row("one quartet at ordinate 10^6", high_quartet),
]

assert configuration_rows[0]["inertia"] == {"positive": 4, "negative": 0, "zero": 0}
assert configuration_rows[1]["inertia"] == {"positive": 2, "negative": 2, "zero": 0}
assert configuration_rows[2]["inertia"] == {"positive": 4, "negative": 4, "zero": 0}
assert configuration_rows[3]["inertia"] == {"positive": 2, "negative": 2, "zero": 0}
assert configuration_rows[4]["inertia"] == {"positive": 2, "negative": 2, "zero": 0}

base_vander = vandermonde_abs_squared(one_quartet)
near_vander = vandermonde_abs_squared(near_line_quartet)
collapse_ratio = near_vander / base_vander
assert 0 < collapse_ratio < Fraction(1, 10**18)

# At eta=0, each horizontal mirror pair coalesces.  The four-node
# Vandermonde vanishes, while the reduced two-node critical form is positive.
collision_nodes = quartet(Fraction(0), Fraction(14))
assert len(set(collision_nodes)) == 2

# Multiplicity audit.  The standard zero sum multiplies a 2-cycle block by m;
# [[0,m],[m,0]] still has only one negative eigenvalue.  A multiplicity-counting
# index requires m independent confluent jet coordinates, which is a new lift,
# not the ordinary Weil zero sum.
multiplicity_rows = []
for multiplicity in [1, 2, 3, 5]:
    multiplicity_rows.append(
        {
            "multiplicity": multiplicity,
            "standardQuartetInertia": {
                "positive": 2,
                "negative": 2,
                "zero": 0,
            },
            "standardBlockEigenvalues": [multiplicity, -multiplicity],
            "confluentJetLiftInertia": {
                "positive": 2 * multiplicity,
                "negative": 2 * multiplicity,
                "zero": 0,
            },
            "warning": (
                "the confluent lift counts multiplicity only after derivative-jet coordinates are added; "
                "those coordinates are not supplied by the ordinary multiplicity-weighted Weil zero sum"
            ),
        }
    )

arithmetic_gates = [
    {
        "gate": "same completed form",
        "outcome": "passes as an identity",
        "detail": (
            "the Guinand--Weil explicit formula equates the zero reflection form with pole, gamma and "
            "prime-power terms on its legitimate test domain"
        ),
    },
    {
        "gate": "independent arithmetic sign",
        "outcome": "fails",
        "detail": (
            "proving that this completed form has no negative square for every admissible test is Weil positivity, "
            "which is equivalent to RH"
        ),
    },
    {
        "gate": "multiplicity-counting index",
        "outcome": "fails for the standard form",
        "detail": (
            "multiplicity rescales a mirror block but does not add independent negative directions; "
            "a confluent derivative-jet lift has no established prime-side realization"
        ),
    },
    {
        "gate": "window-stable arithmetic index",
        "outcome": "not established",
        "detail": (
            "finite bandwidth restricts interpolation, while removing the window restores the complete "
            "RH-equivalent Weil test space"
        ),
    },
]

conductor_gates = [
    {
        "gate": "local positivity",
        "outcome": "fails to imply the completed sign",
        "detail": (
            "Burnol's nonnegative local time-delay symbol enters the conductor as log(p)-tau_p; "
            "the conductor contribution is signed"
        ),
    },
    {
        "gate": "ordinary trace",
        "outcome": "fails",
        "detail": (
            "the local explicit formula is represented by a supertrace plus an identity correction, "
            "not by an ordinary positive trace"
        ),
    },
    {
        "gate": "global Fredholm pair",
        "outcome": "not established",
        "detail": (
            "no canonical completed pair of projections with compact difference is supplied by the local formulae; "
            "the unsmoothed sum over places requires the same global regularisation as the explicit formula"
        ),
    },
    {
        "gate": "independent index computation",
        "outcome": "fails",
        "detail": (
            "an index extracted from the phase of xi is the argument-principle zero count, while no place-by-place "
            "prime calculation proving zero index is known"
        ),
    },
    {
        "gate": "promotion decision",
        "outcome": "closed at fail-fast stage",
        "detail": (
            "the finite negative-square census succeeds as a detector, but neither the Weil prime side nor the "
            "conductor commutators provide an independent exclusion engine"
        ),
    },
]

sonine_gate = {
    "establishedInput": "Burnol's zero systems are complete and minimal with canonical biorthogonal data",
    "syntheticQuartetBlock": [[0, 1], [1, 0]],
    "blockInertia": {"positive": 1, "negative": 1, "zero": 0},
    "verdict": (
        "a positive reflection metric would have to eliminate exactly this negative block; completeness alone "
        "does not do so, and no arithmetic positivity theorem weaker than Weil positivity was found"
    ),
    "promotionDecision": "closed as another exact detector",
}

results = {
    "analysisDate": "2026-10-15",
    "title": "Finite negative-square census and conductor-commutator gate",
    "verdict": {
        "rhProved": False,
        "finiteSyntheticIndexTheoremProved": True,
        "collapsingAmplitudeAvoided": True,
        "multiplicityCountedByStandardWeilForm": False,
        "independentPrimeSideIndexFound": False,
        "globalConductorFredholmIndexFound": False,
        "sonineReflectionPositivityFound": False,
        "routePromoted": False,
        "conclusion": (
            "The reflection form gives an exact integer negative-square census for distinct off-line mirror cycles "
            "and remains indefinite arbitrarily near the line or high in the strip.  Pullback through finite "
            "interpolation preserves this inertia.  For zeta, however, the same completed form is the Weil form; "
            "proving zero index from its prime side is RH-equivalent.  Local conductor commutators do not assemble "
            "into an established independently computable global Fredholm index."
        ),
    },
    "finiteTheorem": {
        "reflection": "R(z)=-conjugate(z) in centered coordinates z=s-1/2",
        "form": "Q_Z(v)=sum_j v_j conjugate(v_(Rj))",
        "inertiaFormula": (
            "if f nodes are fixed by R and p mirror 2-cycles are present, inertia(Q_Z)=(f+p,p,0)"
        ),
        "fullQuartet": "one off-line quartet has two mirror 2-cycles and inertia (2,2,0)",
        "interpolation": (
            "for distinct nodes, polynomial evaluation is an invertible Vandermonde map V; "
            "G=V*JV is congruent to J and has the same inertia"
        ),
        "configurations": configuration_rows,
        "nearLineVandermondeRatio": decimal_text(collapse_ratio),
        "collisionAtEtaZero": (
            "the four-node Vandermonde becomes singular and reduces to two positive critical-line nodes; "
            "the index jump occurs exactly at collision"
        ),
    },
    "multiplicityAudit": multiplicity_rows,
    "arithmeticPromotionGates": arithmetic_gates,
    "conductorCommutatorGates": conductor_gates,
    "sonineReflectionGate": sonine_gate,
    "stopRuleApplied": (
        "the route was stopped because the only completed prime-side sign is Weil positivity and the proposed "
        "global conductor index is not defined by the established local theory"
    ),
    "minimalMissingObject": (
        "a completion-native Fredholm pair or homotopy whose index is forced by an off-line mirror cycle and "
        "can be computed as zero from primes, pole and gamma terms without invoking zero locations or Weil positivity"
    ),
    "status": "quantized detection proved; independent arithmetic exclusion not found; RH remains open",
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Negative-index and conductor gate complete.")
print("  Finite reflection inertia theorem proved exactly.")
print("  One off-line quartet contributes two negative squares in the full complex census.")
print("  The index survives near-line and high-ordinate stress tests.")
print("  Prime-side zero index is Weil positivity; conductor route fails the Fredholm/index gate.")
print("  Route closed; RH remains open.")
