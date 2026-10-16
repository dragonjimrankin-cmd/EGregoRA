#!/usr/bin/env python3
"""Audit combinations of relational synchronisation and prior TTI/RH analogies.

The calculation deliberately separates circular phase, reflection-branch bias and
horizontal zero displacement.  It tests every non-empty combination of seven
previously proposed mechanisms on an explicit off-line quartet, then builds a
positive Fibonacci/splice/proximity graph and checks its consensus energy.

Nothing in this program assumes RH or moves the divisor while calling it the
same xi function.
"""

from __future__ import annotations

from decimal import Decimal, getcontext
from itertools import combinations
import json
import math
from pathlib import Path

getcontext().prec = 80

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-relational-synchronisation-combinations-results.json"

D = Decimal
PHI = (D(1) + D(5).sqrt()) / D(2)
ETA0 = D(1) / D(4)
GAMMA0 = D(15)
Q0 = D(3) / D(4)  # q=tan((theta_1-theta_2)/2)
M0 = D(0)  # a completed quartet is already reflection balanced


def dec(value: Decimal, places: int = 36) -> str:
    """Stable human-readable decimal without changing proof comparisons."""
    if value == 0:
        return "0"
    return format(value, f".{places}g")


def phase_defect(eta: Decimal, gamma: Decimal) -> Decimal:
    """Exact Stage-32/33 positive Euler-anchor defect for one quartet."""
    e = eta * eta
    g = gamma * gamma
    numerator = D(6) * e * (e + D(3) * g - D(9) / D(4))
    denominator = (g + D(9) / D(4)) * (
        (g - e + D(9) / D(4)) ** 2 + D(4) * e * g
    )
    return numerator / denominator


def horizontal_residue(eta: Decimal, gamma: Decimal) -> Decimal:
    e = eta * eta
    g = gamma * gamma
    return D(4) * e * (e + D(3) * g) / (g * (e + g) ** 2)


def quartet_coefficients(eta: Decimal, gamma: Decimal) -> tuple[Decimal, Decimal]:
    """Return z^2 and constant coefficients of the centered quartet factor."""
    e = eta * eta
    g = gamma * gamma
    return D(2) * (g - e), (e + g) ** 2


def diagnostic_state(label: str, eta: Decimal, gamma: Decimal, q: Decimal = Q0, m: Decimal = M0) -> dict:
    a2, a0 = quartet_coefficients(eta, gamma)
    return {
        "label": label,
        "eta": dec(eta),
        "gamma": dec(gamma),
        "phaseHalfAngleQ": dec(q),
        "branchBias": dec(m),
        "phaseDefect": dec(phase_defect(eta, gamma)),
        "horizontalResidue": dec(horizontal_residue(eta, gamma)),
        "quartetFactorZ2Coefficient": dec(a2),
        "quartetFactorConstant": dec(a0),
        "negativeSquaresForOneFullQuartet": 2 if eta != 0 else 0,
        "onCriticalLine": eta == 0,
    }


# The first four mechanisms act on sectors other than horizontal support.  The
# final three alter support and therefore alter an off-line quartet polynomial.
MECHANISMS = [
    {
        "id": "proximity_phase_lock",
        "sector": "circular phase",
        "map": "q=tan(delta/2) -> q/2 for the audited finite coupling step",
        "changesHorizontalSupport": False,
        "interpretation": "attractive two-being Kuramoto coupling",
    },
    {
        "id": "common_pi_register",
        "sector": "common phase gauge",
        "map": "theta_i -> theta_i+pi for every participant; delta and q unchanged",
        "changesHorizontalSupport": False,
        "interpretation": "universal pi phase or common clock register",
    },
    {
        "id": "golden_branch_entropy",
        "sector": "reflection branch label",
        "map": "m -> m/phi",
        "changesHorizontalSupport": False,
        "interpretation": "golden random-reflection channel",
    },
    {
        "id": "fibonacci_catchup_clock",
        "sector": "schedule",
        "map": "selects coupling times by Fibonacci cohorts but has no state map alone",
        "changesHorizontalSupport": False,
        "interpretation": "independent golden depths and catch-up clocks",
    },
    {
        "id": "golden_support_flow",
        "sector": "horizontal zero support",
        "map": "eta -> eta/phi",
        "changesHorizontalSupport": True,
        "interpretation": "kappa Fisher-natural gradient at t=log(phi)",
    },
    {
        "id": "halving_support_flow",
        "sector": "horizontal zero support",
        "map": "eta -> eta/2",
        "changesHorizontalSupport": True,
        "interpretation": "repeated splice halving interpreted as coordinate movement",
    },
    {
        "id": "mirror_barycentre_projection",
        "sector": "horizontal zero support",
        "map": "(+eta,-eta) -> (0,0)",
        "changesHorizontalSupport": True,
        "interpretation": "replace a reflected pair by its central barycentre",
    },
]


def apply_combination(ids: tuple[str, ...]) -> dict:
    eta = ETA0
    q = Q0
    m = M0

    if "proximity_phase_lock" in ids:
        q /= D(2)
    # A common pi shift cancels from the relative phase exactly.
    if "golden_branch_entropy" in ids:
        m /= PHI
    if "golden_support_flow" in ids:
        eta /= PHI
    if "halving_support_flow" in ids:
        eta /= D(2)
    if "mirror_barycentre_projection" in ids:
        eta = D(0)

    support_changers = {
        "golden_support_flow",
        "halving_support_flow",
        "mirror_barycentre_projection",
    }.intersection(ids)
    projected = "mirror_barycentre_projection" in ids
    preserves_original_xi = not support_changers

    if not support_changers:
        classification = "same-divisor but horizontal-support-inert"
        missing = "none of the selected maps changes eta"
    elif projected:
        classification = "critical projection of a different divisor"
        missing = "an arithmetic theorem identifying the projected polynomial with the original xi"
    else:
        classification = "finite support contraction of a different divisor"
        missing = "same-xi or principal-prime invariance under the support flow"

    return {
        "mechanisms": list(ids),
        "mechanismCount": len(ids),
        "finalEta": dec(eta),
        "finalPhaseHalfAngleQ": dec(q),
        "finalBranchBias": dec(m),
        "phaseDefect": dec(phase_defect(eta, GAMMA0)),
        "negativeSquares": 2 if eta != 0 else 0,
        "preservesOriginalXiForOffLineQuartet": preserves_original_xi,
        "forcesCriticalSupportInTransformedState": eta == 0,
        "provesRhForOriginalXi": False,
        "classification": classification,
        "missingPremise": missing,
    }


combination_rows: list[dict] = []
for size in range(1, len(MECHANISMS) + 1):
    for subset in combinations([item["id"] for item in MECHANISMS], size):
        combination_rows.append(apply_combination(subset))

assert len(combination_rows) == 127
category_counts: dict[str, int] = {}
for row in combination_rows:
    category_counts[row["classification"]] = category_counts.get(row["classification"], 0) + 1
assert category_counts == {
    "same-divisor but horizontal-support-inert": 15,
    "finite support contraction of a different divisor": 48,
    "critical projection of a different divisor": 64,
}
assert not any(row["provesRhForOriginalXi"] for row in combination_rows)


# Two-being phase locking and its exact clock alignments.
delta_omega = D(1) / D(2)
critical_distance = (D(4)).ln()  # J0=ell=1 and |Delta omega|=1/2.
distance_rows = []
for r_text in ["0.5", "1", "1.5", "2"]:
    r = D(r_text)
    coupling = (-r).exp()
    distance_rows.append(
        {
            "distance": dec(r),
            "couplingJ": dec(coupling),
            "phaseLocked": D(2) * coupling >= abs(delta_omega),
            "thresholdMargin2JMinusAbsDeltaOmega": dec(D(2) * coupling - abs(delta_omega)),
        }
    )

clock_rows = []
for label, time in [("golden", PHI.ln()), ("halving", D(2).ln())]:
    # Identical-frequency pair: q(t)=q(0) exp(-2 J t).  J=1/2 aligns
    # the phase half-angle contraction with eta(t)=eta(0) exp(-t).
    phase_scale = (-time).exp()
    support_scale = (-time).exp()
    clock_rows.append(
        {
            "clock": label,
            "time": dec(time),
            "couplingJ": "0.5",
            "phaseHalfAngleScale": dec(phase_scale),
            "horizontalSupportScale": dec(support_scale),
            "scalesMatch": abs(phase_scale - support_scale) < D("1e-70"),
            "identifiesPhaseWithHorizontalSupport": False,
        }
    )
assert all(row["scalesMatch"] for row in clock_rows)


# Positive Fibonacci/splice/proximity consensus graph.  Squaring the normalized
# splice kernel makes every edge attractive even though a PSD Gram kernel can
# be pointwise negative.
DEPOSITS = [1, 1, 2, 3, 5, 8, 13, 21]
OMEGAS = [D(2) * D(str(math.pi)) * D(n + 1) / D(10).ln() for n in range(8)]
K0 = D(sum(DEPOSITS))
U = [D(n) / D(8) for n in range(8)]


def splice_kernel(u: Decimal, v: Decimal) -> Decimal:
    # Decimal has no cosine; float evaluation is used only for this numerical
    # graph stress test, not for the exact sector/census conclusions.
    delta = float(u - v)
    return D(str(sum(DEPOSITS[n] * math.cos(float(OMEGAS[n]) * delta) for n in range(8))))


# Sixteen nodes: each Fibonacci cohort and its reflected partner.
nodes = [(n, sign) for n in range(8) for sign in (1, -1)]
N = len(nodes)
adjacency = [[0.0 for _ in range(N)] for _ in range(N)]
for a in range(N):
    n, sign_n = nodes[a]
    for b in range(a + 1, N):
        m, sign_m = nodes[b]
        if n == m:
            weight = DEPOSITS[n] / DEPOSITS[-1] if sign_n != sign_m else 0.0
        else:
            proximity = math.exp(-abs(float(U[n] - U[m])))
            compatibility = float(splice_kernel(U[n], U[m]) / K0) ** 2
            cohort = math.sqrt(DEPOSITS[n] * DEPOSITS[m]) / DEPOSITS[-1]
            # The quarter factor keeps the cross-cohort network subordinate to
            # direct reflected-pair coupling; it has no claimed physical status.
            weight = 0.25 * proximity * compatibility * cohort
        adjacency[a][b] = adjacency[b][a] = weight

laplacian = [[0.0 for _ in range(N)] for _ in range(N)]
for i in range(N):
    laplacian[i][i] = sum(adjacency[i])
    for j in range(N):
        if i != j:
            laplacian[i][j] = -adjacency[i][j]


def matvec(matrix: list[list[float]], vector: list[float]) -> list[float]:
    return [sum(row[j] * vector[j] for j in range(len(vector))) for row in matrix]


def dot(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right))


def jacobi_eigenvalues(matrix: list[list[float]], tolerance: float = 1e-13, max_steps: int = 200000) -> list[float]:
    a = [row[:] for row in matrix]
    n = len(a)
    for _ in range(max_steps):
        p, q, largest = 0, 1, 0.0
        for i in range(n):
            for j in range(i + 1, n):
                if abs(a[i][j]) > largest:
                    p, q, largest = i, j, abs(a[i][j])
        if largest < tolerance:
            break
        angle = 0.5 * math.atan2(2.0 * a[p][q], a[q][q] - a[p][p])
        c, s = math.cos(angle), math.sin(angle)
        app, aqq, apq = a[p][p], a[q][q], a[p][q]
        a[p][p] = c * c * app - 2.0 * s * c * apq + s * s * aqq
        a[q][q] = s * s * app + 2.0 * s * c * apq + c * c * aqq
        a[p][q] = a[q][p] = 0.0
        for k in range(n):
            if k in (p, q):
                continue
            akp, akq = a[k][p], a[k][q]
            a[k][p] = a[p][k] = c * akp - s * akq
            a[k][q] = a[q][k] = s * akp + c * akq
    else:
        raise RuntimeError("Jacobi diagonalisation did not converge")
    return sorted(a[i][i] for i in range(n))


def derivative(vector: list[float]) -> list[float]:
    return [-value for value in matvec(laplacian, vector)]


def rk4(vector: list[float], dt: float, steps: int) -> list[float]:
    x = vector[:]
    for _ in range(steps):
        k1 = derivative(x)
        k2 = derivative([x[i] + 0.5 * dt * k1[i] for i in range(N)])
        k3 = derivative([x[i] + 0.5 * dt * k2[i] for i in range(N)])
        k4 = derivative([x[i] + dt * k3[i] for i in range(N)])
        x = [x[i] + dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6 for i in range(N)]
    return x


row_sum_error = max(abs(sum(row)) for row in laplacian)
eigenvalues = jacobi_eigenvalues(laplacian)
initial_graph_eta = []
for n, sign in nodes:
    initial_graph_eta.append(sign * 0.4 / (n + 1))
initial_energy = 0.5 * dot(initial_graph_eta, initial_graph_eta)
initial_dissipation = -dot(initial_graph_eta, matvec(laplacian, initial_graph_eta))
eta_t1 = rk4(initial_graph_eta, 0.002, 500)
eta_t10 = rk4(initial_graph_eta, 0.002, 5000)
energy_t1 = 0.5 * dot(eta_t1, eta_t1)
energy_t10 = 0.5 * dot(eta_t10, eta_t10)

assert row_sum_error < 1e-12
assert abs(eigenvalues[0]) < 1e-10
assert eigenvalues[1] > 1e-8
assert eigenvalues[0] > -1e-10
assert initial_dissipation < 0
assert energy_t10 < energy_t1 < initial_energy
assert abs(sum(initial_graph_eta)) < 1e-14
assert abs(sum(eta_t10)) < 1e-11


# The most direct relational-horizontal analogy: a reflected pair under
# consensus has eta_+(t)=eta_0 exp(-2Jt), eta_-(t)=-eta_+(t).  It is exactly a
# support flow, not a theorem that the original xi divisor evolves this way.
pair_consensus = {
    "flow": "dot(eta_+)=-J(eta_+-eta_-), dot(eta_-)=-J(eta_--eta_+)",
    "reflectionSolution": "eta_+(t)=eta_0 exp(-2Jt), eta_-(t)=-eta_0 exp(-2Jt)",
    "goldenAlignment": "at t=log(phi)/(2J), eta_+-eta_- is divided by phi",
    "halvingAlignment": "at t=log(2)/(2J), eta_+-eta_- is divided by 2",
    "finiteTimeCollision": False,
    "changesQuartetPolynomialWhenEtaNonzero": True,
    "sameXiInvarianceProved": False,
}

initial = diagnostic_state("off-line control quartet", ETA0, GAMMA0)
golden = diagnostic_state("golden support contraction", ETA0 / PHI, GAMMA0, Q0 / PHI, M0)
half = diagnostic_state("halving support contraction", ETA0 / D(2), GAMMA0, Q0 / D(2), M0)
both = diagnostic_state("golden plus halving support contraction", ETA0 / (D(2) * PHI), GAMMA0, Q0 / (D(2) * PHI), M0)
projection = diagnostic_state("mirror barycentre projection", D(0), GAMMA0, D(0), M0)
phase_only = diagnostic_state("perfect circular-phase lock with off-line support", ETA0, GAMMA0, D(0), M0)
high_ordinate = diagnostic_state("same off-line displacement at high ordinate", ETA0, D(1_000_000), D(0), M0)

assert phase_only["phaseDefect"] == initial["phaseDefect"]
assert D(golden["phaseDefect"]) < D(initial["phaseDefect"])
assert D(half["phaseDefect"]) < D(initial["phaseDefect"])
assert D(both["phaseDefect"]) > 0
assert projection["phaseDefect"] == "0"
assert projection["quartetFactorZ2Coefficient"] != initial["quartetFactorZ2Coefficient"]
assert D(high_ordinate["phaseDefect"]) > 0
assert D(high_ordinate["phaseDefect"]) < D(initial["phaseDefect"])

results = {
    "analysisDate": "2026-10-15",
    "title": "Relational synchronisation and prior-analogy combination audit",
    "question": "Can proximity to other beings, combined with the earlier pi, Fibonacci, entropy, halving, kappa-flow, phase-defect and negative-index analogies, affect RH?",
    "verdict": {
        "relationalSynchronisationModelIsMathematicallyCoherent": True,
        "positiveFibonacciSpliceProximityGraphConstructed": True,
        "allNonemptyMechanismCombinationsTested": len(combination_rows),
        "combinationProvesRh": False,
        "rhRemainsOpen": True,
        "conclusion": "Proximity, Fibonacci cohorts and the squared positive splice kernel produce a valid attractive consensus graph.  Circular phase locking, a common pi register and reflection entropy leave horizontal zero support unchanged.  Horizontal consensus, golden contraction, halving and barycentric projection can move support, but then they change the off-line quartet polynomial.  Across all 127 non-empty combinations, every same-xi combination is support-inert and every support-changing combination lacks same-xi/principal-prime invariance.  The detectors remain detectors; no combination proves RH.",
    },
    "sectorSeparation": {
        "state": "(q,m,eta), with q=tan(relative phase/2), m=reflection-branch bias and eta=Re(rho)-1/2",
        "counterexample": phase_only,
        "meaning": "q=0 and m=0 give perfect circular synchrony and maximal branch balance while eta=1/4 retains a positive RH defect and two negative squares",
        "blockDiagonalUntilNewLawDerived": True,
    },
    "mechanisms": MECHANISMS,
    "twoBeingPhaseLock": {
        "equation": "dot(delta)=Delta omega-2J(r) sin(delta)",
        "lockingCriterion": "abs(Delta omega)<=2J(r)",
        "auditedParameters": {"DeltaOmega": "0.5", "JOfR": "exp(-r)", "criticalDistance": dec(critical_distance)},
        "distanceRows": distance_rows,
        "commonPiShiftChangesRelativePhase": False,
        "clockAlignments": clock_rows,
    },
    "relationalHorizontalConsensus": pair_consensus,
    "fibonacciSpliceProximityGraph": {
        "nodes": 16,
        "cohorts": DEPOSITS,
        "edgeLaw": "J_ab=exp(-distance)*sqrt(F_a F_b)/21*(K(u_a,u_b)/54)^2, with direct reflected-pair edges F_n/21",
        "whySquared": "the Gram kernel is PSD but can be pointwise negative; squaring makes each synchronising edge nonnegative",
        "laplacianRowSumError": row_sum_error,
        "eigenvalues": eigenvalues,
        "connected": eigenvalues[1] > 1e-8,
        "positiveSemidefinite": eigenvalues[0] > -1e-10,
        "initialMeanEta": sum(initial_graph_eta) / N,
        "meanEtaAtT10": sum(eta_t10) / N,
        "initialCoherenceEnergy": initial_energy,
        "energyAtT1": energy_t1,
        "energyAtT10": energy_t10,
        "initialEnergyDerivative": initial_dissipation,
        "energyDecreases": energy_t10 < energy_t1 < initial_energy,
        "finiteTimeStateIsNonzero": max(abs(value) for value in eta_t10) > 1e-12,
        "sameXiInvarianceProved": False,
    },
    "combinationCensus": {
        "nonemptyCombinations": len(combination_rows),
        "categoryCounts": category_counts,
        "validRhProofs": 0,
        "pairwiseSectorMapsCommute": True,
        "reason": "the audited maps act independently on q, m, eta or the schedule; introducing an eta-phase cross-law simply creates another support-changing flow whose arithmetic invariance must still be proved",
        "rows": combination_rows,
    },
    "diagnosticStress": [initial, phase_only, golden, half, both, projection, high_ordinate],
    "conditionalClosure": {
        "secondMoment": "M2(t)=c^2 M2(0); imposing M2(t)=M2(0) for 0<c<1 forces M2=0",
        "primeAnchor": "conservation of xi_t'/xi_t(2) under any strict horizontal contraction forces RH",
        "negativeIndex": "one full off-line quartet keeps two negative squares at every nonzero finite displacement and loses them only at exact collision",
        "status": "each closure requires same-xi or principal-prime invariance, which is RH-equivalent and remains unproved",
    },
    "evidenceBoundary": {
        "provedHere": [
            "the two-oscillator phase-lock threshold and golden/halving clock alignment",
            "an exhaustive 127-combination sector census for the declared mechanisms",
            "positive-semidefinite connected Fibonacci/splice/proximity graph Laplacian",
            "strict decay of its toy consensus energy",
            "phase synchrony and branch balance do not imply eta=0",
        ],
        "notProved": [
            "that people or biological systems couple through the splice kernel",
            "that zeta zeros undergo any physical or auxiliary proximity dynamics",
            "that a moved divisor retains the Euler product or the original xi function",
            "RH",
        ],
    },
    "status": "the analogies combine into a coherent relational consensus model, but their sector separation and same-xi obstruction survive every tested combination; RH remains open",
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Relational synchronisation combination audit complete.")
print(f"  Tested {len(combination_rows)} non-empty mechanism combinations.")
print("  Built a connected positive Fibonacci/splice/proximity consensus graph.")
print("  Same-xi combinations leave horizontal support unchanged.")
print("  Support-changing combinations alter the quartet divisor.")
print("  No combination proves RH; same-xi/principal-prime invariance remains open.")
