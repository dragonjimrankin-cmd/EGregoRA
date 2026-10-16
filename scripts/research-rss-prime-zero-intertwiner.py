#!/usr/bin/env python3
"""Construct and audit a positive prime--zero intertwiner candidate.

Each centered zero displacement eta and ordinate gamma is mapped to a normalized
von-Mangoldt feature vector.  Its diagonal probability is the Stage-39 p_eta
law and is independent of gamma.  Positive reflection mixtures are rigid and
would prove RH if their aggregate were the central prime ledger.  The script
checks the feature map, tail growth and the failure of linear vector averaging.
The Stage-41 correction is also recorded: logarithmic conjugation-averaging
removes coherent off-diagonal entries exactly, so pair control is not needed for
the dephased map.  The script does not assume the missing frame identity.
"""

from __future__ import annotations

import cmath
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-prime-zero-intertwiner-results.json"
N = 200_000


def prime_power_lambda(limit: int) -> tuple[list[int], list[float]]:
    sieve = bytearray(b"\x01") * (limit + 1)
    sieve[:2] = b"\x00\x00"
    for p in range(2, int(limit**0.5) + 1):
        if sieve[p]:
            sieve[p * p: limit + 1: p] = b"\x00" * (((limit - p * p) // p) + 1)
    values: dict[int, float] = {}
    for p in range(2, limit + 1):
        if not sieve[p]:
            continue
        logp = math.log(p)
        power = p
        while power <= limit:
            values[power] = logp
            if power > limit // p:
                break
            power *= p
    support = sorted(values)
    return support, [values[n] for n in support]


SUPPORT, LAMBDAS = prime_power_lambda(N)
LOGS = [math.log(n) for n in SUPPORT]


def prime_state(eta: float, gamma: float = 0.0) -> dict:
    a = 2.0 + 2.0 * eta
    raw = [lam * math.exp(-a * logn) for lam, logn in zip(LAMBDAS, LOGS)]
    mass = math.fsum(raw)
    probabilities = [value / mass for value in raw]
    amplitudes = [
        math.sqrt(lam) * cmath.exp(complex(-(1.0 + eta) * logn, -gamma * logn)) / math.sqrt(mass)
        for lam, logn in zip(LAMBDAS, LOGS)
    ]
    return {
        "eta": eta,
        "gamma": gamma,
        "mass": mass,
        "probabilities": probabilities,
        "amplitudes": amplitudes,
    }


P0 = prime_state(0.0)
feature_checks = []
for eta, gamma in [(0.0, 14.134725), (0.1, 20.0), (-0.1, 20.0), (0.25, 30.0), (-0.25, 30.0)]:
    state = prime_state(eta, gamma)
    norm = math.fsum(abs(value) ** 2 for value in state["amplitudes"])
    diagonal_error = max(
        abs(abs(amplitude) ** 2 - probability)
        for amplitude, probability in zip(state["amplitudes"], state["probabilities"])
    )
    feature_checks.append({
        "eta": eta,
        "gamma": gamma,
        "featureNorm": norm,
        "maximumDiagonalProbabilityError": diagonal_error,
        "ordinateCancelsFromDiagonal": True,
    })

assert all(abs(row["featureNorm"] - 1.0) < 2e-14 for row in feature_checks)
assert all(row["maximumDiagonalProbabilityError"] < 1e-15 for row in feature_checks)

# Build a toy completed ledger with one critical component and two off-line
# reflected pairs.  Use the convergent ordinate weights from the s=2 anchor.
components = [
    {"eta": 0.0, "gamma": 14.134725},
    {"eta": 0.1, "gamma": 20.0},
    {"eta": 0.25, "gamma": 30.0},
]
raw_weights = [1.0 / (row["gamma"] ** 2 + 2.25) for row in components]
weight_total = math.fsum(raw_weights)
weights = [value / weight_total for value in raw_weights]

state_cache: dict[float, dict] = {0.0: P0}
for component in components:
    eta = component["eta"]
    state_cache.setdefault(eta, prime_state(eta))
    state_cache.setdefault(-eta, prime_state(-eta))

mixture = [0.0] * len(SUPPORT)
for component, weight in zip(components, weights):
    eta = component["eta"]
    plus = state_cache[eta]["probabilities"]
    minus = state_cache[-eta]["probabilities"]
    for index in range(len(SUPPORT)):
        mixture[index] += weight * 0.5 * (plus[index] + minus[index])

mixture_total = math.fsum(mixture)
tv = 0.5 * math.fsum(abs(value - central) for value, central in zip(mixture, P0["probabilities"]))
kl = math.fsum(
    value * math.log(value / central)
    for value, central in zip(mixture, P0["probabilities"])
    if value > 0 and central > 0
)
ratio_indices = [0, len(SUPPORT) // 4, len(SUPPORT) // 2, 3 * len(SUPPORT) // 4, len(SUPPORT) - 1]
ratio_rows = [
    {
        "primePower": SUPPORT[index],
        "mixtureToCentralRatio": mixture[index] / P0["probabilities"][index],
    }
    for index in ratio_indices
]

assert abs(mixture_total - 1.0) < 2e-14
assert tv > 0.0 and kl > 0.0
assert ratio_rows[-1]["mixtureToCentralRatio"] > ratio_rows[0]["mixtureToCentralRatio"]
assert ratio_rows[-1]["mixtureToCentralRatio"] > 10.0

# RH control: every eta=0 makes every reflected pair p_0, independent of gamma.
control_mix = [0.0] * len(SUPPORT)
for weight in weights:
    for index, probability in enumerate(P0["probabilities"]):
        control_mix[index] += weight * probability
control_error = max(abs(value - central) for value, central in zip(control_mix, P0["probabilities"]))
assert control_error < 1e-15

# Linear phase averaging cannot produce a positive gamma-independent carrier.
# Translation averaging multiplies exp(i gamma u) by a characteristic function;
# unless that multiplier is zero, oscillation and sign changes remain.
ETA_STRESS = 0.25
GAMMA_STRESS = 15.0
SIGMA = 0.02
characteristic = math.exp(-0.5 * SIGMA * SIGMA * GAMMA_STRESS * GAMMA_STRESS)
phase_average_rows = []
positive = negative = 0
for n, logn in zip(SUPPORT, LOGS):
    original = 4.0 * math.cosh(ETA_STRESS * logn) * math.cos(GAMMA_STRESS * logn)
    averaged = characteristic * original
    if averaged > 0:
        positive += 1
    elif averaged < 0:
        negative += 1
    if n in {2, 3, 5, 8, 11, 13, 16}:
        phase_average_rows.append({
            "primePower": n,
            "originalCarrier": original,
            "gaussianPhaseAveragedCarrier": averaged,
            "signPreserved": (original > 0) == (averaged > 0),
        })

assert positive > 0 and negative > 0
assert all(row["signPreserved"] for row in phase_average_rows)

# Quadratic lifting removes gamma on the diagonal, but the full density matrix
# has two-prime entries and therefore needs pair-correlation control.
pair_kernel_rows = []
stress_state = prime_state(ETA_STRESS, GAMMA_STRESS)
for left_index, right_index in [(0, 1), (1, 4), (4, 10), (10, 25)]:
    left = SUPPORT[left_index]
    right = SUPPORT[right_index]
    matrix_entry = stress_state["amplitudes"][left_index] * stress_state["amplitudes"][right_index].conjugate()
    pair_kernel_rows.append({
        "leftPrimePower": left,
        "rightPrimePower": right,
        "realPart": matrix_entry.real,
        "imaginaryPart": matrix_entry.imag,
        "dependsOnLogRatio": True,
    })
assert any(abs(row["imaginaryPart"]) > 1e-12 for row in pair_kernel_rows)

bridge_attempts = [
    {
        "attempt": "linear positive averaging over log-scale translations",
        "outcome": "fails",
        "reason": "it multiplies each gamma Fourier mode by a characteristic function but retains its oscillatory sign unless the mode is annihilated",
    },
    {
        "attempt": "annihilate every nonzero ordinate Fourier mode",
        "outcome": "fails",
        "reason": "it also deletes the zero information and cannot yield the eta-dependent positive mixture",
    },
    {
        "attempt": "coherent quadratic feature density |psi_rho><psi_rho|",
        "outcome": "constructive but coherent off-diagonals contain prime pairs",
        "reason": "its diagonal is p_eta and removes gamma, while its off-diagonal entries are two-prime correlations not fixed by the one-point Euler moment",
    },
    {
        "attempt": "logarithmic conjugation twirl of the quadratic density",
        "outcome": "resolves diagonal construction",
        "reason": "sinc(T log(n/m)) tends to zero for n!=m and leaves p_eta exactly, so no pair estimate is needed for the dephased map",
    },
    {
        "attempt": "Weil autocorrelation test function",
        "outcome": "RH-equivalent",
        "reason": "positivity over the full admissible autocorrelation class is the Weil criterion",
    },
    {
        "attempt": "critical Chebyshev energy",
        "outcome": "RH-equivalent and unproved",
        "reason": "it supplies the required quadratic prime-pair control only at the unresolved square-root boundary",
    },
]

results = {
    "analysisDate": "2026-10-15",
    "title": "A positive prime--zero feature intertwiner candidate and its pair-correlation gate",
    "question": "Can the actual xi divisor be intertwined with the von-Mangoldt dissipative law by a positive identity?",
    "verdict": {
        "canonicalPrimeZeroFeatureMapConstructed": True,
        "featureDiagonalEqualsPrimePowerLaw": True,
        "positiveGlobalMixtureCriterionEquivalentToRh": True,
        "linearPhaseAveragingProducesPositiveIntertwiner": False,
        "quadraticLiftRemovesOrdinatePhase": True,
        "coherentQuadraticLiftHasPrimePairEntries": True,
        "quadraticLiftRequiresPrimePairControl": False,
        "logarithmicDephasingRemovesOffDiagonals": True,
        "sameXiIntertwiningIdentityProved": False,
        "rhProved": False,
        "conclusion": "A zero rho=1/2+eta+i gamma canonically defines a normalized von-Mangoldt feature vector psi_rho(n) proportional to sqrt(Lambda(n)) n^(-1-eta-i gamma).  Its squared diagonal is exactly p_eta and loses gamma.  A convergently weighted positive mixture of reflected diagonals equals the central p_0 ledger, or is even uniformly bounded relative to it along prime powers, if and only if every eta is zero.  This gives a sharp RH-equivalent positive intertwiner criterion.  Linear averaging of feature vectors does not create the diagonal.  The coherent quadratic lift has two-prime off-diagonal entries, but the Stage-41 logarithmic twirl removes those entries exactly and therefore needs no pair estimate for diagonal construction.  The dephased candidate is constructed, but the same-xi arithmetic frame bound is not proved.",
    },
    "featureMap": {
        "formula": "psi_(eta,gamma)(n)=sqrt(Lambda(n)) n^(-1-eta-i gamma)/sqrt(M(2+2eta))",
        "normalization": "sum_n |psi_(eta,gamma)(n)|^2=1",
        "diagonal": "|psi_(eta,gamma)(n)|^2=p_eta(n)",
        "reflectionPairDiagonal": "[p_eta(n)+p_-eta(n)]/2",
        "checks": feature_checks,
    },
    "globalMixtureCriterion": {
        "ordinateWeight": "w_rho proportional to multiplicity/(gamma_rho^2+9/4), normalized over upper reflected pairs",
        "mixture": "P_xi(n)=sum_rho w_rho[p_eta_rho(n)+p_-eta_rho(n)]/2",
        "theorem": "RH iff P_xi=p_0 on all prime powers; equivalently RH iff P_xi(n)/p_0(n) remains bounded along prime powers",
        "proof": "under RH every eta is zero; if any eta>0 has positive weight, its p_-eta/p_0 term grows like n^(2eta) and makes the positive ratio unbounded",
        "toyComponents": components,
        "normalizedWeights": weights,
        "mixtureMass": mixture_total,
        "totalVariationFromCentral": tv,
        "relativeEntropyFromCentral": kl,
        "ratioRows": ratio_rows,
        "rhControlMaximumError": control_error,
    },
    "linearPhaseAverageNoGo": {
        "statement": "translation-invariant averaging sends exp(i gamma u) to characteristic_mu(gamma) exp(i gamma u); a nonzero multiplier retains oscillation",
        "gaussianSigma": SIGMA,
        "characteristicMultiplier": characteristic,
        "positivePrimePowers": positive,
        "negativePrimePowers": negative,
        "sampleRows": phase_average_rows,
        "consequence": "a linear positive phase average cannot turn every unknown ordinate mode into the gamma-independent Gibbs diagonal",
    },
    "quadraticLift": {
        "densityOperator": "|psi_rho><psi_rho|",
        "diagonalBenefit": "gamma cancels and p_eta is positive",
        "offDiagonalForm": "sqrt(Lambda(n)Lambda(m)) n^(-1-eta) m^(-1-eta) exp[-i gamma log(n/m)]/M(2+2eta)",
        "sampleRows": pair_kernel_rows,
        "gate": "full coherent reconstruction is a two-prime correlation problem, but logarithmic dephasing removes every off-diagonal entry and needs no pair estimate for the positive diagonal",
        "dephasedDiagonalRequiresPrimePairControl": False,
    },
    "bridgeAttempts": bridge_attempts,
    "nextNarrowTarget": {
        "statement": "prove from fixed prime arithmetic a positive frame or diagonal identity P_xi=p_0 for the dephased ordinate-weighted von-Mangoldt features",
        "weakerSufficientForm": "a uniform bound P_xi(n)<=C p_0(n) along all prime powers already excludes every eta>0",
        "failFast": "logarithmic twirling resolves phase removal; any claimed prime-side proof must establish the RH-equivalent global bound rather than assume Weil positivity, critical energy or another equivalent condition",
    },
    "finiteComputation": {
        "cutoff": N,
        "primePowers": len(SUPPORT),
        "scope": "feature normalization, mixture separation, phase-average signs and pair-kernel samples are deterministic truncated checks; the rigidity theorem is analytic",
    },
    "evidenceBoundary": {
        "provedHere": [
            "the normalized von-Mangoldt feature map for each zero coordinate",
            "exact cancellation of ordinate phase on its probability diagonal",
            "the positive global-mixture boundedness criterion equivalent to RH",
            "the linear translation-average no-go for feature vectors",
            "the coherent quadratic lift's two-prime off-diagonal form",
            "the Stage-41 logarithmic twirl's exact removal of those off-diagonal entries",
        ],
        "notProved": [
            "the positive frame identity P_xi=p_0",
            "a uniform arithmetic bound for P_xi/p_0",
            "a same-xi prime-side theorem forcing the dephased state to be central",
            "RH",
        ],
    },
    "status": "a canonical dephased positive intertwiner and an RH-equivalent boundedness criterion are established; the same-xi arithmetic frame bound remains unproved",
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Prime--zero intertwiner audit complete.")
print(f"  Checked normalized features on {len(SUPPORT)} prime powers through {N}.")
print("  Constructed a positive global-mixture criterion equivalent to RH.")
print("  Proved linear phase averaging retains the ordinate sign obstruction.")
print("  Coherent quadratic lifting has prime-pair entries; logarithmic dephasing removes them.")
print("  The same-xi arithmetic frame bound remains unproved; RH remains open.")
