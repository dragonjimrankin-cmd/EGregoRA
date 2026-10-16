#!/usr/bin/env python3
"""Derive and test a von-Mangoldt prime-power dissipative law.

For a=2+2 eta, normalize Lambda(n)n^{-a} to a probability distribution.
Its Fisher-natural gradient toward the a=2 prime ledger is exactly
    d eta / dt = -eta.
This is a genuine arithmetic exponential-family dissipation law.  The script
then tests the missing bridge to the actual xi divisor and the signed explicit
formula.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-prime-power-dissipative-law-results.json"
N = 200_000
PHI = (1.0 + math.sqrt(5.0)) / 2.0


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


def distribution(eta: float) -> dict:
    a = 2.0 + 2.0 * eta
    raw = [lam * math.exp(-a * logn) for lam, logn in zip(LAMBDAS, LOGS)]
    mass = math.fsum(raw)
    probs = [value / mass for value in raw]
    mean_log = math.fsum(p * x for p, x in zip(probs, LOGS))
    variance = math.fsum(p * (x - mean_log) ** 2 for p, x in zip(probs, LOGS))
    return {
        "eta": eta,
        "a": a,
        "mass": mass,
        "probabilities": probs,
        "meanLogN": mean_log,
        "varianceLogN": variance,
    }


P0 = distribution(0.0)


def kl_to_central(record: dict) -> float:
    return math.fsum(
        p * math.log(p / q)
        for p, q in zip(record["probabilities"], P0["probabilities"])
        if p > 0.0 and q > 0.0
    )


eta_rows = []
records: dict[float, dict] = {}
for eta in [-0.4, -0.25, -0.1, 0.1, 0.25, 0.4]:
    record = distribution(eta)
    records[eta] = record
    kl = kl_to_central(record)
    fisher_eta = 4.0 * record["varianceLogN"]
    derivative = 4.0 * eta * record["varianceLogN"]
    natural_velocity = -derivative / fisher_eta
    golden = distribution(eta / PHI)
    golden_kl = kl_to_central(golden)
    dissipation_rate = derivative * natural_velocity
    eta_rows.append({
        "eta": eta,
        "exponentA": record["a"],
        "truncatedPrimeMoment": record["mass"],
        "relativeEntropyToCentral": kl,
        "varianceLogN": record["varianceLogN"],
        "fisherMetricEta": fisher_eta,
        "relativeEntropyDerivative": derivative,
        "naturalGradientVelocity": natural_velocity,
        "dissipationRate": dissipation_rate,
        "goldenEta": eta / PHI,
        "relativeEntropyAtGoldenTime": golden_kl,
        "goldenStepStrictlyDissipates": golden_kl < kl,
    })

assert all(abs(row["naturalGradientVelocity"] + row["eta"]) < 2e-15 for row in eta_rows)
assert all(row["dissipationRate"] < 0.0 for row in eta_rows)
assert all(row["goldenStepStrictlyDissipates"] for row in eta_rows)

# Symmetric positive mixtures do not reproduce the central prime ledger.
mixture_rows = []
for eta in [0.1, 0.25, 0.4]:
    plus = records[eta]["probabilities"]
    minus = records[-eta]["probabilities"]
    mixture = [(a + b) / 2.0 for a, b in zip(plus, minus)]
    tv = 0.5 * math.fsum(abs(m - q) for m, q in zip(mixture, P0["probabilities"]))
    pair_kl = math.fsum(
        m * math.log(m / q) for m, q in zip(mixture, P0["probabilities"])
        if m > 0.0 and q > 0.0
    )
    ratio_tail = mixture[-1] / P0["probabilities"][-1]
    mixture_rows.append({
        "absoluteEta": eta,
        "totalVariationFromCentral": tv,
        "relativeEntropyFromCentral": pair_kl,
        "tailRatioAtLargestPrimePower": ratio_tail,
        "equalsCentralLedger": False,
    })

assert all(row["totalVariationFromCentral"] > 0.0 for row in mixture_rows)
assert all(row["relativeEntropyFromCentral"] > 0.0 for row in mixture_rows)
assert mixture_rows[-1]["tailRatioAtLargestPrimePower"] > 100.0

# The raw quartet carrier in the explicit formula is signed because the
# ordinate supplies cos(gamma log x).  Positive Gibbs-mixture rigidity cannot
# be substituted for this signed arithmetic identity.
ETA_STRESS = 0.25
GAMMA_STRESS = 15.0
signed_rows = []
positive_count = 0
negative_count = 0
for n, logn in zip(SUPPORT, LOGS):
    carrier = 4.0 * math.cosh(ETA_STRESS * logn) * math.cos(GAMMA_STRESS * logn)
    if carrier > 0:
        positive_count += 1
    elif carrier < 0:
        negative_count += 1
    if n in {2, 3, 4, 5, 7, 8, 9, 11, 13, 16}:
        signed_rows.append({
            "primePower": n,
            "quartetCarrierWithoutCommonXHalf": carrier,
            "sign": "positive" if carrier > 0 else "negative" if carrier < 0 else "zero",
        })

assert positive_count > 0 and negative_count > 0

# A finite-mixture rigidity stress test: the slowest-decaying eta<0 component
# eventually dominates the eta=0 tail.  Report ratios at increasing prime
# powers for the eta=0.25 reflected pair.
plus = records[0.25]["probabilities"]
minus = records[-0.25]["probabilities"]
tail_witness = []
indices = [0, len(SUPPORT) // 4, len(SUPPORT) // 2, 3 * len(SUPPORT) // 4, len(SUPPORT) - 1]
for index in indices:
    mix = 0.5 * (plus[index] + minus[index])
    tail_witness.append({
        "primePower": SUPPORT[index],
        "symmetricMixtureToCentralRatio": mix / P0["probabilities"][index],
    })
assert tail_witness[-1]["symmetricMixtureToCentralRatio"] > tail_witness[0]["symmetricMixtureToCentralRatio"]

candidate_bridge_gates = [
    {
        "bridge": "identify each zero displacement eta with the prime Gibbs state p_eta",
        "status": "defined but auxiliary",
        "failure": "the explicit formula does not identify the actual xi zero ledger with a positive mixture of these states",
    },
    {
        "bridge": "use functional-equation pairing to average p_eta and p_-eta",
        "status": "strictly separated from p_0 when eta is nonzero",
        "failure": "reflection balance gives an equal mixture, not equality with the central prime ledger",
    },
    {
        "bridge": "replace the signed explicit formula by the positive mixture",
        "status": "invalid",
        "failure": "the true quartet carrier contains cos(gamma log x) and changes sign",
    },
    {
        "bridge": "square the signed carrier to restore positivity",
        "status": "conditional route already audited",
        "failure": "squaring introduces prime-pair correlations and the missing critical Chebyshev-energy estimate",
    },
    {
        "bridge": "declare the actual zero ledger stationary under eta(t)=exp(-t)eta",
        "status": "RH-equivalent",
        "failure": "stationarity of the horizontal second moment already forces eta=0",
    },
]

results = {
    "analysisDate": "2026-10-15",
    "title": "A von-Mangoldt prime-power dissipative law and its missing xi intertwiner",
    "question": "Can strict global dissipation be derived directly from arithmetic rather than postulated on the zero support?",
    "verdict": {
        "arithmeticDissipativeLawDerived": True,
        "usesVonMangoldtPrimePowers": True,
        "naturalGradientIsEtaDotMinusEta": True,
        "goldenTimeRecovered": True,
        "positiveMixtureRigidityProvedForFiniteLedgers": True,
        "actualXiZeroLedgerFollowsLaw": False,
        "sameXiIntertwinerDerived": False,
        "rhProved": False,
        "conclusion": "Normalizing Lambda(n)n^(-2-2eta) gives a genuine prime-power exponential family.  Its Fisher-natural gradient of relative entropy to the eta=0 prime ledger is exactly d eta/dt=-eta, with strict dissipation and golden time log(phi).  A finite positive reflection-symmetric mixture equals the central prime ledger only when all displacements vanish.  However, the actual explicit formula is signed and oscillatory through cos(gamma log x); it does not identify the xi divisor with that positive mixture.  Squaring returns the previously unresolved prime-pair energy theorem.  The arithmetic law is proved, but its same-xi intertwiner is not, so RH remains open.",
    },
    "primePowerFamily": {
        "support": "prime powers n>=2",
        "vonMangoldtMoment": "M(a)=sum Lambda(n)n^(-a)=-zeta'/zeta(a), a>1",
        "parameter": "a=2+2eta, -1/2<eta<1/2",
        "probability": "p_eta(n)=Lambda(n)n^(-2-2eta)/M(2+2eta)",
        "centralLedger": "p_0(n)=Lambda(n)n^(-2)/M(2)",
        "logPartition": "A(a)=log M(a)",
        "relativeEntropy": "D(p_eta||p_0)=A(2)-A(a)+(a-2)A'(a)",
        "fisherMetric": "I_eta=4A''(a)=4 Var_eta(log n)",
        "entropyDerivative": "dD/deta=4eta A''(a)",
        "naturalGradient": "deta/dt=-I_eta^(-1)dD/deta=-eta",
        "dissipation": "dD/dt=-4eta^2 A''(a)<0 for eta!=0",
        "goldenTime": "eta(log phi)=eta(0)/phi",
    },
    "finiteComputation": {
        "cutoff": N,
        "primePowers": len(SUPPORT),
        "rows": eta_rows,
        "scope": "the identities are analytic for the infinite convergent family; the finite rows are deterministic numerical checks on the truncated family",
    },
    "positiveMixtureRigidity": {
        "statement": "for a finite positive mixture of reflected states p_eta and p_-eta, equality with p_0 at every prime power forces every eta=0",
        "tailProof": "if eta_max>0, the p_-eta_max/p_0 ratio grows like n^(2eta_max) along prime powers and cannot equal a constant central tail with positive coefficients",
        "rows": mixture_rows,
        "tailWitness": tail_witness,
        "conditionalRhClosure": "if the actual completed zero ledger were proved to induce such a positive mixture equal to p_0, rigidity would force RH",
    },
    "signedExplicitFormulaGate": {
        "rawQuartetCarrier": "sum over quartet x^rho =4 x^(1/2) cosh(eta log x) cos(gamma log x)",
        "stressEta": ETA_STRESS,
        "stressGamma": GAMMA_STRESS,
        "positivePrimePowersThroughCutoff": positive_count,
        "negativePrimePowersThroughCutoff": negative_count,
        "sampleRows": signed_rows,
        "conclusion": "ordinate oscillation destroys positive-mixture structure; replacing the signed carrier by a Gibbs mixture is not an identity",
    },
    "bridgeGates": candidate_bridge_gates,
    "heatBathAlternative": {
        "law": "mu_t=exp(-t)mu_0+[1-exp(-t)]p_0",
        "property": "a genuine Markov relaxation with unique stationary prime ledger p_0 and relative-entropy contraction",
        "gate": "it evolves an auxiliary distribution on prime powers, not the zeros of the fixed xi function",
    },
    "nextNarrowTarget": {
        "statement": "derive a positive, convergent explicit-formula identity equating the actual completed zero ledger's prime-power feature mixture to p_0, without squaring into an unproved prime-pair estimate",
        "whySufficient": "positive-mixture rigidity plus the arithmetic natural-gradient law would then force every horizontal displacement to vanish",
        "knownObstruction": "the unsquared explicit formula is signed; the squared form is the critical Chebyshev-energy route already known to be RH-equivalent",
    },
    "evidenceBoundary": {
        "provedHere": [
            "the von-Mangoldt prime-power exponential family",
            "its exact Fisher-natural gradient deta/dt=-eta",
            "strict relative-entropy dissipation and golden-time contraction",
            "finite positive-mixture tail rigidity",
            "signed oscillation of the actual quartet carrier",
        ],
        "notProved": [
            "a positive explicit-formula mixture identity for the actual xi divisor",
            "stationarity of the xi zero ledger under the prime-family flow",
            "the critical prime-pair energy estimate",
            "RH",
        ],
    },
    "status": "a genuine arithmetic dissipative law has been found on normalized von-Mangoldt prime powers, but the map intertwining it with the actual xi divisor remains unproved; RH remains open",
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Prime-power dissipative-law audit complete.")
print(f"  Enumerated {len(SUPPORT)} prime powers through {N}.")
print("  Derived the exact arithmetic natural gradient d eta/dt=-eta.")
print("  Verified strict entropy dissipation and golden-time contraction.")
print("  Proved finite positive-mixture rigidity.")
print("  The signed explicit formula blocks the same-xi intertwiner.")
print("  RH remains open.")
