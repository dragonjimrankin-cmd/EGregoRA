#!/usr/bin/env python3
"""Test weaker Mellin and Renyi routes to the dephased global frame bound.

For the Stage-41 positive mixture P_xi, uniform domination by p_0 is stronger
than needed.  This script records a countable negative-moment ladder and an
all-finite-order Renyi ladder.  Either full ladder is equivalent to RH, while a
single rung only excludes a corresponding horizontal zero strip.  Toy off-line
states show that normalization, reflection, finite entropy and dephasing do not
supply the missing rungs.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-dephased-mellin-ladder-results.json"
LIMIT = 200_000


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


support, lambdas = prime_power_lambda(LIMIT)
logs = [math.log(n) for n in support]

# The j-th Mellin rung is A_j=sum_n P(n)n^(1-1/j).  A reflected slow component
# p_-eta contributes a von-Mangoldt Dirichlet series with exponent
# a=1+1/j-2eta.  It diverges exactly when a<=1, i.e. 2eta>=1/j.
mellin_rungs = []
for j in range(1, 13):
    eta_threshold = 1.0 / (2.0 * j)
    mellin_rungs.append({
        "j": j,
        "moment": f"A_{j}=sum_n P_xi(n)n^(1-1/{j})",
        "etaExclusionThreshold": eta_threshold,
        "impliedZeroStrip": f"|Re(rho)-1/2|<{eta_threshold:.12g}",
        "automaticFromProbabilityNormalization": j == 1,
    })

# Finite diagnostics for two explicit off-line slow branches.  The denominator
# is normalized at the largest cutoff; monotonic partial sums reveal the exact
# convergence/divergence exponent but are not used as a proof of it.
cutoffs = [1_000, 10_000, 100_000, 200_000]
toy_rows = []
for eta, js in [(0.10, [4, 5, 6]), (0.25, [1, 2, 3])]:
    base_exponent = 2.0 - 2.0 * eta
    mass = math.fsum(
        lam * math.exp(-base_exponent * logn)
        for lam, logn in zip(lambdas, logs)
    )
    for j in js:
        dirichlet_exponent = 1.0 + 1.0 / j - 2.0 * eta
        partials = []
        for cutoff in cutoffs:
            value = math.fsum(
                lam * math.exp(-dirichlet_exponent * logn)
                for n, lam, logn in zip(support, lambdas, logs)
                if n <= cutoff
            ) / mass
            partials.append({"cutoff": cutoff, "partialMoment": value})
        predicted = "diverges" if dirichlet_exponent <= 1.0 else "converges"
        toy_rows.append({
            "eta": eta,
            "j": j,
            "dirichletExponent": dirichlet_exponent,
            "predictedStatus": predicted,
            "partialRows": partials,
        })
        assert all(
            partials[index]["partialMoment"] < partials[index + 1]["partialMoment"]
            for index in range(len(partials) - 1)
        )

assert next(row for row in toy_rows if row["eta"] == 0.10 and row["j"] == 5)["predictedStatus"] == "diverges"
assert next(row for row in toy_rows if row["eta"] == 0.25 and row["j"] == 2)["predictedStatus"] == "diverges"

# The q-th relative moment is sum p_0 R^q, R=P_xi/p_0.  A single off-line
# component gives a lower bound c*n^(2eta), and the moment contains
# sum Lambda(n)n^(-2+2qeta), divergent when qeta>=1/2.
renyi_rungs = []
for q in [2, 3, 4, 5, 8, 10, 20, 50]:
    renyi_rungs.append({
        "q": q,
        "relativeMoment": f"R_{q}=sum_n p_0(n)(P_xi(n)/p_0(n))^{q}",
        "etaExclusionThreshold": 1.0 / (2.0 * q),
        "implication": f"R_{q}<infinity implies |eta|<{1.0/(2.0*q):.12g} for every zero",
    })

results = {
    "analysisDate": "2026-10-15",
    "title": "The Mellin--Renyi ladder behind the dephased frame bound",
    "question": "Can the uniform bound P_xi<=C p_0 be replaced by weaker positive arithmetic statements that are easier to prove?",
    "verdict": {
        "uniformFrameBoundProved": False,
        "countableMellinCriterionEquivalentToRh": True,
        "allFiniteRenyiCriterionEquivalentToRh": True,
        "probabilityNormalizationClosesFirstMellinRung": True,
        "firstNontrivialMellinRungProved": False,
        "dephasingAloneSuppliesHigherRungs": False,
        "rhProved": False,
        "conclusion": "Uniform domination is not necessary.  RH is equivalent to finiteness of A_j=sum P_xi(n)n^(1-1/j) for every positive integer j, and also to finiteness of every finite-order relative moment sum p_0(P_xi/p_0)^q.  A single off-line component with displacement eta makes A_j diverge once 2eta>=1/j and makes the q-th relative moment diverge once qeta>=1/2.  Normalization proves only A_1=1.  The first nontrivial rung A_2 is already the unproved zero-free strip |Re rho-1/2|<1/4.  Thus the L-infinity target is replaced by a countable ladder, but no new arithmetic estimate closes even its first nontrivial rung.",
    },
    "mellinLadder": {
        "definition": "A_j=sum_(prime powers n) P_xi(n)n^(1-1/j)",
        "componentFormula": "p_-eta contribution is M(1+1/j-2eta)/M(2-2eta) when the numerator series converges",
        "divergenceCondition": "2eta>=1/j",
        "equivalence": "RH iff A_j<infinity for every integer j>=1",
        "rungs": mellin_rungs,
    },
    "renyiLadder": {
        "definition": "R_q=sum_n p_0(n)[P_xi(n)/p_0(n)]^q",
        "offLineLowerBound": "R_q dominates a positive multiple of sum Lambda(n)n^(-2+2qeta)",
        "divergenceCondition": "qeta>=1/2",
        "equivalence": "RH iff P_xi/p_0 belongs to L^q(p_0) for every finite q>1",
        "rungs": renyi_rungs,
    },
    "firstRungs": {
        "j1": "A_1=sum P_xi=1 follows from trace preservation and probability normalization",
        "j2": "A_2=sum P_xi(n)sqrt(n)<infinity would exclude every zero with |Re rho-1/2|>=1/4",
        "j2Status": "unproved; it is already a nontrivial global zero-free strip",
        "limit": "letting j tend to infinity shrinks the permitted strip to the critical line",
    },
    "structuralCounterexample": {
        "state": "one positive reflected pair [p_0.1+p_-0.1]/2",
        "propertiesRetained": [
            "probability mass one",
            "reflection symmetry",
            "positive CPTP dephased construction",
            "finite relative entropy to p_0",
            "finite logarithmic moments of every fixed order",
            "the Stage-39 componentwise dissipative flow",
        ],
        "failure": "A_5 diverges and P/p_0 grows at least as a positive multiple of n^0.2",
        "consequence": "normalization, dephasing, reflection, entropy finiteness and componentwise dissipation cannot imply the global frame bound",
    },
    "toyDiagnostics": toy_rows,
    "arithmeticBoundary": {
        "weakestDisplayedNewTarget": "A_2=sum P_xi(n)sqrt(n)<infinity",
        "meaning": "a zero-free strip 1/4<Re rho<3/4 for every nontrivial zero",
        "whyOpen": "one exceptional zero outside that strip contributes a positive divergent von-Mangoldt series, so averaging and zero-density estimates cannot cancel it",
        "fullClosure": "prove A_j finite for every j, equivalently establish strips shrinking to Re rho=1/2",
    },
    "finiteComputation": {
        "primePowerCutoff": LIMIT,
        "primePowers": len(support),
        "cutoffs": cutoffs,
        "scope": "partial sums illustrate the threshold exponents; convergence and divergence follow analytically from the abscissa one of sum Lambda(n)n^-s",
    },
    "evidenceBoundary": {
        "provedHere": [
            "the countable Mellin negative-moment criterion equivalent to RH",
            "the all-finite-order Renyi criterion equivalent to RH",
            "the exact horizontal strip excluded by each finite rung",
            "normalization closes only the first Mellin rung",
            "an explicit off-line positive state satisfying the previously established structural properties while failing a higher rung",
        ],
        "notProved": [
            "A_2<infinity for the actual xi zero mixture",
            "any shrinking family of new zero-free strips",
            "the all-rung Mellin criterion",
            "the all-order Renyi criterion",
            "the uniform frame bound",
            "RH",
        ],
    },
    "status": "the uniform bound has been reduced to weaker countable positive moment ladders, but their first nontrivial arithmetic rung is already unproved and RH remains open",
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Dephased Mellin--Renyi ladder audit complete.")
print(f"  Checked finite diagnostics on {len(support)} prime powers through {LIMIT}.")
print("  Replaced L-infinity domination by two countable RH-equivalent moment ladders.")
print("  Probability normalization proves A_1=1 but not the first nontrivial rung A_2.")
print("  A reflected eta=0.1 countermodel keeps the structural properties and fails at A_5.")
print("  The global arithmetic obstruction and RH remain open.")
