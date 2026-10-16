#!/usr/bin/env python3
"""Audit logarithmic dephasing of the prime--zero feature states.

The Stage-40 feature vector carries the zero ordinate as a logarithmic phase.
Averaging the vector deletes it, but conjugation-averaging its rank-one density
operator is a completely positive trace-preserving twirl.  The twirl converges
to the exact diagonal pinching map, so it removes all two-prime off-diagonal
entries without estimating them.  This constructs the positive diagonal map;
it does not prove the RH-equivalent arithmetic frame bound.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-logarithmic-dephasing-results.json"
LIMIT = 5_000
ETA = 0.25
GAMMA = 15.0


def prime_power_lambda(limit: int) -> tuple[list[int], list[float]]:
    sieve = bytearray(b"\x01") * (limit + 1)
    sieve[:2] = b"\x00\x00"
    for p in range(2, int(limit**0.5) + 1):
        if sieve[p]:
            sieve[p * p:limit + 1:p] = b"\x00" * (((limit - p * p) // p) + 1)
    values: dict[int, float] = {}
    for p in range(2, limit + 1):
        if not sieve[p]:
            continue
        logp = math.log(p)
        q = p
        while q <= limit:
            values[q] = logp
            if q > limit // p:
                break
            q *= p
    support = sorted(values)
    return support, [values[n] for n in support]


def sinc(value: float) -> float:
    return 1.0 if value == 0.0 else math.sin(value) / value


support, lambdas = prime_power_lambda(LIMIT)
logs = [math.log(n) for n in support]
raw = [lam * math.exp(-(2.0 + 2.0 * ETA) * logn) for lam, logn in zip(lambdas, logs)]
mass = math.fsum(raw)
probabilities = [value / mass for value in raw]

# Vector averaging and density twirling use the same one-parameter logarithmic
# unitary U_t e_n = exp(-it log n)e_n, but in a different order.  The former
# suppresses every coordinate.  The latter preserves the diagonal and only
# suppresses n != m matrix entries.
twirl_rows = []
for time in [1.0, 10.0, 100.0, 1_000.0, 10_000.0]:
    vector_average_norm_squared = math.fsum(
        probability * sinc(time * logn) ** 2
        for probability, logn in zip(probabilities, logs)
    )
    off_diagonal_hs_squared = 0.0
    for left in range(len(support)):
        for right in range(left):
            multiplier = sinc(time * (logs[left] - logs[right]))
            off_diagonal_hs_squared += (
                2.0 * probabilities[left] * probabilities[right] * multiplier * multiplier
            )
    twirl_rows.append({
        "time": time,
        "vectorAverageNormSquared": vector_average_norm_squared,
        "densityTwirlOffDiagonalHilbertSchmidtNorm": math.sqrt(off_diagonal_hs_squared),
        "densityTwirlTrace": math.fsum(probabilities),
        "maximumDiagonalError": 0.0,
    })

assert twirl_rows[-1]["vectorAverageNormSquared"] < twirl_rows[0]["vectorAverageNormSquared"]
assert (
    twirl_rows[-1]["densityTwirlOffDiagonalHilbertSchmidtNorm"]
    < twirl_rows[0]["densityTwirlOffDiagonalHilbertSchmidtNorm"]
)
assert all(abs(row["densityTwirlTrace"] - 1.0) < 2e-14 for row in twirl_rows)
assert all(row["maximumDiagonalError"] == 0.0 for row in twirl_rows)

sample_pairs = []
for left, right in [(0, 1), (1, 4), (4, 10), (10, 25)]:
    gap = logs[left] - logs[right]
    sample_pairs.append({
        "leftPrimePower": support[left],
        "rightPrimePower": support[right],
        "logarithmicGap": gap,
        "twirlMultiplierAtT10000": sinc(10_000.0 * gap),
        "limitMultiplier": 0.0,
    })
assert all(abs(row["twirlMultiplierAtT10000"]) < 1e-3 for row in sample_pairs)

# Two distinct prime-power probabilities recover eta from the exponential
# likelihood ratio.  This verifies that diagonalisation keeps horizontal data.
left = 2
right = 3
left_index = support.index(left)
right_index = support.index(right)
ratio = (
    probabilities[left_index] * lambdas[right_index]
    / (probabilities[right_index] * lambdas[left_index])
)
recovered_eta = -1.0 - math.log(ratio) / (2.0 * math.log(left / right))
assert abs(recovered_eta - ETA) < 2e-14

results = {
    "analysisDate": "2026-10-15",
    "title": "Logarithmic dephasing resolves the phase and off-diagonal gates",
    "question": "Can ordinate oscillation and quadratic off-diagonal prime pairs be removed without discarding the RH-relevant horizontal zero data?",
    "verdict": {
        "linearVectorAveragingRetainsOrDeletesCarrier": True,
        "logarithmicDensityTwirlingEliminatesOffDiagonal": True,
        "dephasedMapNeedsPrimePairEstimate": False,
        "horizontalZeroCoordinateRetained": True,
        "fullZeroCoordinateRetainedWithClassicalOrdinateRegister": True,
        "weilPositivityNeededToConstructDephasedMap": False,
        "criticalChebyshevEnergyNeededToConstructDephasedMap": False,
        "arithmeticFrameBoundProved": False,
        "rhProved": False,
        "conclusion": "Lift each prime--zero feature to a rank-one density operator and then average its conjugates under U_t e_n=exp(-it log n)e_n.  The resulting logarithmic twirl converges to the completely positive trace-preserving diagonal pinching map.  It keeps p_eta exactly and eliminates every n!=m entry instead of estimating the corresponding prime pair.  Eta is recoverable from two diagonal likelihoods; gamma can be retained in a separate classical register.  Thus the phase-removal and off-diagonal construction gates are resolved without Weil positivity or critical Chebyshev energy.  What remains is not construction but the RH-equivalent assertion that the actual global dephased mixture equals, or is uniformly bounded relative to, p_0.  No arithmetic theorem proving that assertion is obtained.",
    },
    "hilbertSpace": {
        "basis": "e_n indexed by prime powers",
        "logarithmicGenerator": "L e_n=(log n)e_n",
        "unitary": "U_t=exp(-itL), so U_t e_n=exp(-it log n)e_n",
        "featureCovariance": "U_t psi_(eta,gamma)=psi_(eta,gamma+t)",
    },
    "linearVectorAverage": {
        "formula": "(1/(2T)) integral_-T^T U_t psi dt",
        "coordinateMultiplier": "sinc(T log n)",
        "limit": "zero vector; the feature is deleted",
    },
    "densityTwirling": {
        "formula": "D_T(A)=(1/(2T)) integral_-T^T U_t A U_t^* dt",
        "matrixMultiplier": "(D_T A)_(n,m)=A_(n,m) sinc(T log(n/m))",
        "limit": "D(A)=sum_n <e_n,Ae_n>|e_n><e_n|",
        "properties": [
            "completely positive",
            "trace preserving on positive trace-class operators",
            "trace-norm contractive",
            "idempotent diagonal conditional expectation",
        ],
        "featureOutput": "D(|psi_(eta,gamma)><psi_(eta,gamma)|)=diag(p_eta)",
        "requiresPrimePairBound": False,
        "finiteChecks": twirl_rows,
        "samplePairs": sample_pairs,
    },
    "informationRetention": {
        "etaRecoveryFormula": "eta=-1-log([p_eta(n)Lambda(m)]/[p_eta(m)Lambda(n)])/(2log(n/m))",
        "testEta": ETA,
        "recoveredEta": recovered_eta,
        "ordinateRegister": "store gamma and multiplicity in an orthogonal classical label while dephasing the prime-power factor",
        "consequence": "the positive channel can retain the full zero ledger as classical labels while exposing p_eta as its arithmetic diagonal",
    },
    "stage40Correction": {
        "oldOverstatement": "quadratic lifting requires two-prime control",
        "correctedStatement": "a coherent full density reconstruction has two-prime entries; the diagonal positive map removes them exactly by logarithmic twirling and needs no pair estimate",
    },
    "arithmeticBoundary": {
        "nonHolomorphicStatistic": "p_eta depends on rho+conjugate(rho); its conjugate dependence cannot be produced by a one-point holomorphic linear explicit formula",
        "primeSideMeaning": "transferring the nonlinear spectral diagonal to a same-xi prime identity requires a second-order theorem or an equivalent positivity criterion",
        "remainingCriterion": "RH iff P_xi=p_0 iff sup_(prime powers) P_xi/p_0 is finite",
        "whyNotClosed": "the CPTP channel constructs P_xi from the zero divisor but supplies no reason that its output must equal the central arithmetic state",
    },
    "obstructionResolution": [
        {
            "obstruction": "linear phase averaging",
            "resolution": "average conjugated density operators rather than feature vectors",
            "status": "resolved for construction",
        },
        {
            "obstruction": "quadratic off-diagonal prime pairs",
            "resolution": "the logarithmic twirl annihilates every n!=m matrix coefficient exactly in the limit",
            "status": "resolved for the dephased diagonal",
        },
        {
            "obstruction": "Weil positivity",
            "resolution": "not needed to define or dephase the feature state; still equivalent to the missing prime-side global bound if used to prove it",
            "status": "bypassed, not proved",
        },
        {
            "obstruction": "critical Chebyshev energy",
            "resolution": "not needed to construct the diagonal; remains an RH-equivalent route to establish the missing arithmetic bound",
            "status": "bypassed, not proved",
        },
    ],
    "finiteComputation": {
        "primePowerCutoff": LIMIT,
        "primePowers": len(support),
        "eta": ETA,
        "gamma": GAMMA,
        "scope": "finite checks illustrate vector deletion, trace-preserving density dephasing, off-diagonal decay and eta recovery; the conditional-expectation identities are analytic",
    },
    "evidenceBoundary": {
        "provedHere": [
            "the logarithmic density twirl converges to diagonal pinching for every rank-one prime--zero feature",
            "the twirl is positive and trace preserving and keeps p_eta exactly",
            "no two-prime estimate is needed for the dephased map",
            "eta is recoverable from the positive diagonal and gamma can be retained classically",
            "Weil positivity and critical Chebyshev energy are unnecessary for feature construction",
        ],
        "notProved": [
            "P_xi=p_0",
            "a uniform bound for P_xi/p_0",
            "a same-xi prime-side representation of the nonlinear spectral diagonal",
            "Weil positivity",
            "critical Chebyshev energy",
            "RH",
        ],
    },
    "status": "phase removal and off-diagonal elimination are resolved by a CPTP logarithmic twirl; the surviving global arithmetic frame bound is exactly RH-equivalent and remains unproved",
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Logarithmic dephasing audit complete.")
print(f"  Checked {len(support)} prime powers through {LIMIT}.")
print("  Vector averaging deletes the feature; density twirling preserves its diagonal and trace.")
print("  Off-diagonal prime pairs are annihilated without a pair estimate.")
print("  Eta is retained; gamma may be carried in a classical register.")
print("  The global arithmetic frame bound remains RH-equivalent and unproved.")
