#!/usr/bin/env python3
"""Test whether relational synchronisation destroys or transports RH defect.

This Stage-37 audit follows the proximity/consensus combination study.  It
separates closed fixed-ordinate anchor conservation, defect transfer between
quartets, export to an environment, counterfeit one-anchor conservation by
ordinate motion, finite-anchor null directions, and full analytic uniqueness.
"""

from __future__ import annotations

from decimal import Decimal, ROUND_CEILING, getcontext
import json
import math
from pathlib import Path

getcontext().prec = 80
D = Decimal
PHI = (D(1) + D(5).sqrt()) / D(2)
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-relational-defect-transport-results.json"


def dec(value: Decimal, places: int = 36) -> str:
    if value == 0:
        return "0"
    return format(value, f".{places}g")


def h_quartet(w: Decimal, eta: Decimal, gamma: Decimal) -> Decimal:
    """Centered quartet contribution to xi'/xi at w=s-1/2."""
    e = eta * eta
    g = gamma * gamma
    u = w * w - e + g
    return D(4) * w * u / (u * u + D(4) * e * g)


def h_ordinate(w: Decimal, gamma: Decimal) -> Decimal:
    return D(4) * w / (w * w + gamma * gamma)


def defect(w: Decimal, eta: Decimal, gamma: Decimal) -> Decimal:
    return h_ordinate(w, gamma) - h_quartet(w, eta, gamma)


def solve_eta_for_defect(target: Decimal, w: Decimal, gamma: Decimal) -> Decimal:
    """Invert the positive defect on 0<=eta<1/2 by bisection."""
    if target == 0:
        return D(0)
    low = D(0)
    high = D("0.499999999999999999999999999999")
    if defect(w, high, gamma) < target:
        raise ValueError("target exceeds one-quartet critical-strip capacity")
    for _ in range(300):
        mid = (low + high) / D(2)
        if defect(w, mid, gamma) < target:
            low = mid
        else:
            high = mid
    return (low + high) / D(2)


W = D("1.5")
GAMMA = D(15)
ETA = D("0.25")

# 1. A closed two-quartet system can move defect between participants, but not
# eliminate a conserved positive total.
transfer_eta0 = D("0.2")
transfer_total = D(2) * defect(W, transfer_eta0, GAMMA)
transfer_rows = []
for scale_text in ["1", "0.75", "0.5", "0.25", "0"]:
    scale = D(scale_text)
    eta_1 = transfer_eta0 * scale
    remaining = transfer_total - defect(W, eta_1, GAMMA)
    eta_2 = solve_eta_for_defect(remaining, W, GAMMA)
    d1 = defect(W, eta_1, GAMMA)
    d2 = defect(W, eta_2, GAMMA)
    transfer_rows.append({
        "firstQuartetScale": scale_text,
        "eta1": dec(eta_1),
        "eta2": dec(eta_2),
        "defect1": dec(d1),
        "defect2": dec(d2),
        "totalDefect": dec(d1 + d2),
        "totalConservedError": dec(abs(d1 + d2 - transfer_total)),
        "negativeSquares": (2 if eta_1 != 0 else 0) + (2 if eta_2 != 0 else 0),
        "bothCritical": eta_1 == 0 and eta_2 == 0,
    })

assert all(D(row["totalConservedError"]) < D("1e-70") for row in transfer_rows)
assert transfer_rows[-1]["eta1"] == "0"
assert D(transfer_rows[-1]["eta2"]) > transfer_eta0
assert not any(row["bothCritical"] for row in transfer_rows)

# 2. An open subsystem can lose its defect only by exporting it to a reservoir.
initial_defect = defect(W, ETA, GAMMA)
reservoir_rows = []
for step in range(13):
    eta_system = ETA / (PHI ** step)
    system_defect = defect(W, eta_system, GAMMA)
    reservoir = initial_defect - system_defect
    reservoir_rows.append({
        "goldenStep": step,
        "etaSystem": dec(eta_system),
        "systemDefect": dec(system_defect),
        "exportedDefect": dec(reservoir),
        "closedTotal": dec(system_defect + reservoir),
        "conservationError": dec(abs(system_defect + reservoir - initial_defect)),
    })

assert all(D(row["conservationError"]) == 0 for row in reservoir_rows)
assert all(
    D(reservoir_rows[i + 1]["exportedDefect"]) > D(reservoir_rows[i]["exportedDefect"])
    for i in range(len(reservoir_rows) - 1)
)

exported_final = D(reservoir_rows[-1]["exportedDefect"])
reservoir_capacity_rows = []
for gamma_text in ["15", "100", "1000", "1000000"]:
    gamma = D(gamma_text)
    capacity = defect(W, D("0.499999999999"), gamma)
    required = int((exported_final / capacity).to_integral_value(rounding=ROUND_CEILING))
    reservoir_capacity_rows.append({
        "reservoirOrdinate": gamma_text,
        "maximumOneQuartetDefectNearStripEdge": dec(capacity),
        "quartetsRequiredToHoldExportedToyDefect": required,
    })

assert reservoir_capacity_rows[-1]["quartetsRequiredToHoldExportedToyDefect"] > 10**18

# 3. If ordinates are allowed to move, one scalar anchor can be counterfeited.
# Move eta to zero and solve H_ord(w,gamma*)=H_q(w,eta,gamma).
initial_anchor = h_quartet(W, ETA, GAMMA)
gamma_star_squared = D(4) * W / initial_anchor - W * W
gamma_star = gamma_star_squared.sqrt()
assert gamma_star > GAMMA
assert abs(h_ordinate(W, gamma_star) - initial_anchor) < D("1e-70")

counterfeit_rows = []
for w_text in ["1", "1.5", "2", "3"]:
    w = D(w_text)
    before = h_quartet(w, ETA, GAMMA)
    after = h_ordinate(w, gamma_star)
    counterfeit_rows.append({
        "w": w_text,
        "originalQuartetAnchor": dec(before),
        "criticalProjectedShiftedOrdinateAnchor": dec(after),
        "difference": dec(after - before),
        "preserved": abs(after - before) < D("1e-60"),
    })

assert [row["preserved"] for row in counterfeit_rows] == [False, True, False, False]

# 4. A finite list of anchors leaves null directions when enough quartets can
# move.  Compute a numerical Jacobian for three anchors and three quartets
# (six eta/gamma variables), then exhibit a first-order null direction.
def h_float(w: float, eta: float, gamma: float) -> float:
    e, g = eta * eta, gamma * gamma
    u = w * w - e + g
    return 4.0 * w * u / (u * u + 4.0 * e * g)


anchor_ws = [1.0, 1.5, 2.0]
quartets = [[0.1, 15.0], [0.2, 20.0], [0.3, 30.0]]
variables = [value for pair in quartets for value in pair]


def anchors(vector: list[float]) -> list[float]:
    pairs = [(vector[i], vector[i + 1]) for i in range(0, len(vector), 2)]
    return [sum(h_float(w, eta, gamma) for eta, gamma in pairs) for w in anchor_ws]


jacobian = [[0.0 for _ in variables] for _ in anchor_ws]
for column, value in enumerate(variables):
    step = 1e-6 * max(1.0, abs(value))
    plus, minus = variables[:], variables[:]
    plus[column] += step
    minus[column] -= step
    ap, am = anchors(plus), anchors(minus)
    for row in range(len(anchor_ws)):
        jacobian[row][column] = (ap[row] - am[row]) / (2.0 * step)


def rref_and_null(matrix: list[list[float]], tolerance: float = 1e-12) -> tuple[int, list[float], list[int]]:
    a = [row[:] for row in matrix]
    rows, cols = len(a), len(a[0])
    pivots: list[int] = []
    r = 0
    for c in range(cols):
        pivot = max(range(r, rows), key=lambda i: abs(a[i][c]), default=r)
        if r >= rows or abs(a[pivot][c]) <= tolerance:
            continue
        a[r], a[pivot] = a[pivot], a[r]
        scale = a[r][c]
        a[r] = [value / scale for value in a[r]]
        for i in range(rows):
            if i == r:
                continue
            factor = a[i][c]
            a[i] = [a[i][j] - factor * a[r][j] for j in range(cols)]
        pivots.append(c)
        r += 1
        if r == rows:
            break
    free = [c for c in range(cols) if c not in pivots]
    vector = [0.0] * cols
    vector[free[0]] = 1.0
    for row in range(len(pivots) - 1, -1, -1):
        pc = pivots[row]
        vector[pc] = -sum(a[row][j] * vector[j] for j in free)
    norm = math.sqrt(sum(value * value for value in vector))
    vector = [value / norm for value in vector]
    return len(pivots), vector, pivots


rank, null_vector, pivot_columns = rref_and_null(jacobian)
null_residual = [sum(jacobian[i][j] * null_vector[j] for j in range(6)) for i in range(3)]
base_anchors = anchors(variables)
epsilon = 1e-3
moved_variables = [variables[i] + epsilon * null_vector[i] for i in range(6)]
moved_anchors = anchors(moved_variables)
finite_anchor_drift = [moved_anchors[i] - base_anchors[i] for i in range(3)]

assert rank == 3
assert max(abs(value) for value in null_residual) < 1e-10
assert any(abs(value) > 1e-4 for value in null_vector)
assert moved_variables != variables

results = {
    "analysisDate": "2026-10-15",
    "title": "Relational defect transport, reservoirs and prime-anchor rigidity",
    "question": "When proximity synchronises one being or one zero-sector, is the RH obstruction destroyed, transferred to another participant, or exported to an environment?",
    "verdict": {
        "closedAnchorConservingNetworkCanEliminatePositiveDefect": False,
        "defectCanBeTransferredBetweenQuartets": True,
        "subsystemDefectCanBeExportedToReservoir": True,
        "oneAnchorCanBeCounterfeitedByOrdinateMotion": True,
        "finiteAnchorsDetermineFullDivisor": False,
        "openSetLogDerivativeDeterminesDivisor": True,
        "rhProved": False,
        "conclusion": "In a closed fixed-ordinate network, conserving the principal anchor conserves the positive total defect, so proximity can redistribute mismatch but cannot place every quartet on the line.  An open subsystem can synchronise only by exporting defect to a reservoir, the analogue of births or escaping high zeros.  Allowing ordinate motion can preserve one scalar anchor while changing the divisor, and finitely many anchors retain null directions.  Conservation on an open set restores analytic uniqueness but then forbids nontrivial zero motion.  No route proves RH.",
    },
    "closedDefectTransfer": {
        "anchor": "w=3/2 (s=2)",
        "initialEtaPerQuartet": dec(transfer_eta0),
        "conservedTotalDefect": dec(transfer_total),
        "rows": transfer_rows,
        "result": "bringing the first quartet exactly to the line forces the second farther off line when total defect is conserved",
    },
    "openSystemReservoir": {
        "initialEta": dec(ETA),
        "goldenMap": "eta_n=eta_0/phi^n",
        "rows": reservoir_rows,
        "capacityRows": reservoir_capacity_rows,
        "interpretation": "subsystem coherence does not destroy a conserved obstruction; the environment stores it, and a high-ordinate reservoir needs increasing multiplicity because one-quartet capacity decays rapidly",
    },
    "counterfeitSingleAnchor": {
        "originalEta": dec(ETA),
        "originalGamma": dec(GAMMA),
        "projectedEta": "0",
        "shiftedGamma": dec(gamma_star),
        "ordinateShift": dec(gamma_star - GAMMA),
        "preservedAnchorW": dec(W),
        "rows": counterfeit_rows,
        "sameDivisor": False,
        "zeroCountingMeasurePreserved": False,
        "result": "one scalar anchor is sufficient only along the fixed-ordinate monotone support flow; it is not a fingerprint of xi under arbitrary relational motion",
    },
    "finiteAnchorJacobian": {
        "quartets": quartets,
        "variables": ["eta1", "gamma1", "eta2", "gamma2", "eta3", "gamma3"],
        "anchorsW": anchor_ws,
        "jacobian": jacobian,
        "rank": rank,
        "nullity": len(variables) - rank,
        "pivotColumns": pivot_columns,
        "firstOrderNullDirection": null_vector,
        "nullResidual": null_residual,
        "finiteStep": epsilon,
        "finiteAnchorDrift": finite_anchor_drift,
        "result": "three scalar anchors leave a three-dimensional local deformation space for three movable quartets",
    },
    "rigidityHierarchy": [
        {
            "level": "phase or branch synchrony",
            "effect": "can align q or m while eta and the RH defect remain nonzero",
        },
        {
            "level": "one fixed-ordinate prime anchor plus strict inward flow",
            "effect": "conservation forces the initial defect to be zero and is therefore an RH criterion",
        },
        {
            "level": "one anchor with moving ordinates",
            "effect": "admits counterfeit critical projections with a changed zero-counting measure",
        },
        {
            "level": "finitely many anchors with enough movable quartets",
            "effect": "admits local Jacobian null directions and does not determine the divisor",
        },
        {
            "level": "logarithmic derivative on an open set plus normalization",
            "effect": "analytic uniqueness fixes xi and its divisor; a nontrivial support contraction is impossible unless every eta was already zero",
        },
    ],
    "conditionalClosure": {
        "closedFixedOrdinateIdentity": "D_total=H_ord-H_prime; if ordinates and H_prime are fixed then D_total is fixed",
        "positivity": "D_total>=0 and D_total=0 iff every quartet is critical",
        "sameXiFlow": "same-xi plus strict horizontal contraction is stationary only under RH",
        "missingTheorem": "no proximity, entropy, splice or cohort law proves that the actual xi divisor undergoes the auxiliary flow while retaining its principal-prime data",
    },
    "evidenceBoundary": {
        "provedHere": [
            "exact two-quartet defect-transfer examples at the s=2 anchor",
            "exact defect bookkeeping for a golden-contracting subsystem and reservoir",
            "an explicit shifted-ordinate critical projection preserving exactly one anchor",
            "failure of that counterfeit projection at three other anchors",
            "a rank-three finite-anchor Jacobian with a three-dimensional local nullspace",
        ],
        "notProved": [
            "that zeta zeros physically exchange defect",
            "that a biological or cosmological environment represents an arithmetic reservoir",
            "that any moved divisor retains the Euler product",
            "RH",
        ],
    },
    "status": "relational synchronisation can redistribute or export a toy RH defect but cannot annihilate it in a closed anchor-conserving same-xi system; RH remains open",
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Relational defect-transport audit complete.")
print("  Closed anchor conservation transfers positive defect; it does not destroy it.")
print("  Golden subsystem contraction exports the missing defect to a reservoir.")
print("  One scalar anchor can be counterfeited by a small ordinate shift.")
print("  Three finite anchors leave three local divisor-deformation directions.")
print("  Open-set conservation fixes the divisor and restores the same-xi obstruction.")
print("  RH remains open.")
