#!/usr/bin/env python3
"""Construct the nonlinear prime-ledger map that exactly realizes eta contraction.

The normalized geometric interpolation G_c(q) proportional to q^c p_0^(1-c)
provides a positive nonlinear map on prime-power probabilities.  It maps each
von-Mangoldt exponential-family state p_eta exactly to p_(c eta).  Its fixed
points are p_0 conditioned on their support, so p_0 is the unique full-support
fixed point.  It strictly contracts KL divergence to p_0 for full-support
inputs other than p_0, under the usual integrability conditions.  The script verifies these identities in a
finite prime-power truncation and records that invariance of the actual xi
mixture under G_c remains unproved (and is RH-equivalent).
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-geometric-prime-reweighting-results.json"
LIMIT = 20_000
C = 1 / ((1 + math.sqrt(5.0)) / 2.0)


def prime_power_lambdas(limit: int) -> list[tuple[int, float]]:
    sieve = bytearray(b"\x01") * (limit + 1)
    sieve[:2] = b"\x00\x00"
    for p in range(2, math.isqrt(limit) + 1):
        if sieve[p]:
            start = p * p
            sieve[start : limit + 1 : p] = b"\x00" * (((limit - start) // p) + 1)
    values: dict[int, float] = {}
    for p in range(2, limit + 1):
        if not sieve[p]:
            continue
        log_p = math.log(p)
        power = p
        while power <= limit:
            values[power] = log_p
            if power > limit // p:
                break
            power *= p
    return sorted(values.items())


TERMS = prime_power_lambdas(LIMIT)
N = [n for n, _ in TERMS]
LAMBDA = [value for _, value in TERMS]
LOG_N = [math.log(n) for n in N]


def normalized_state(eta: float) -> list[float]:
    raw = [lam * math.exp(-(2 + 2 * eta) * log_n) for lam, log_n in zip(LAMBDA, LOG_N)]
    total = math.fsum(raw)
    return [value / total for value in raw]


def geometric_map(q: list[float], p0: list[float], c: float) -> list[float]:
    raw = [left**c * right ** (1 - c) for left, right in zip(q, p0)]
    total = math.fsum(raw)
    return [value / total for value in raw]


def kl(q: list[float], p: list[float]) -> float:
    return math.fsum(x * math.log(x / y) for x, y in zip(q, p) if x > 0 and y > 0)


def max_distance(left: list[float], right: list[float]) -> float:
    return max(abs(x - y) for x, y in zip(left, right))


def main() -> None:
    p0 = normalized_state(0.0)
    rows = []
    for eta in (-0.4, -0.25, -0.1, 0.1, 0.25, 0.4):
        q = normalized_state(eta)
        contracted = geometric_map(q, p0, C)
        expected = normalized_state(C * eta)
        error = max_distance(contracted, expected)
        divergence_before = kl(q, p0)
        divergence_after = kl(contracted, p0)
        assert error < 2e-15
        assert divergence_before > 0
        assert divergence_after < divergence_before
        rows.append({
            "eta": eta,
            "contractedEta": C * eta,
            "maximumProbabilityError": error,
            "klBefore": divergence_before,
            "klAfter": divergence_after,
            "strictKLDissipation": divergence_after < divergence_before,
        })

    # A symmetric reflected stress mixture is not fixed by the nonlinear map.
    eta_stress = 0.25
    plus = normalized_state(eta_stress)
    minus = normalized_state(-eta_stress)
    stress = [0.5 * (x + y) for x, y in zip(plus, minus)]
    stress_after = geometric_map(stress, p0, C)
    stress_fixed_point_error = max_distance(stress, stress_after)
    assert stress_fixed_point_error > 0.0
    assert kl(stress_after, p0) < kl(stress, p0)

    results = {
        "analysisDate": "2026-10-15",
        "title": "A nonlinear geometric-mean map exactly contracts prime-family eta",
        "question": "After ruling out a fixed Markov channel, can a positive nonlinear arithmetic operation realize the derived horizontal contraction?",
        "verdict": {
            "nonlinearPrimeMapConstructed": True,
            "mapsEveryFeatureStateEtaToCEta": True,
            "p0IsUniqueFullSupportFixedPoint": True,
            "allFixedPointsAreP0ConditionedOnSupport": True,
            "actualXiMixtureHasFullSupport": True,
            "actualXiMixtureInvarianceProved": False,
            "actualXiMixtureInvarianceEquivalentToRh": True,
            "rhProved": False,
            "conclusion": "The normalized geometric interpolation G_c(q) proportional to q^c p_0^(1-c) is a positive nonlinear map on prime-power laws. Its fixed points are p_0 conditioned on support; since the actual zero mixture has full support, its only possible fixed point is p_0. Thus G_c(P_xi)=P_xi would prove RH; no arithmetic theorem establishes that fixed-point relation.",
        },
        "map": {
            "definition": "G_c(q)(n)=q(n)^c p_0(n)^(1-c)/Z_c(q)",
            "normalizer": "Z_c(q)=sum_n q(n)^c p_0(n)^(1-c)<=1 by Holder",
            "goldenFactor": C,
            "parameterMap": "a=2+2eta -> a_c=2+c(a-2), equivalently eta -> c eta",
            "featureFamilyIdentity": "G_c(p_eta)=p_(c eta)",
            "normalizerOnFeature": "Z_c(p_eta)=M(2+2c eta)/(M(2+2eta)^c M(2)^(1-c))",
            "fixedPointProof": "G_c(q)=q iff q is p_0 conditioned on its support S; full support S gives q=p_0",
            "klIdentity": "D(G_t(q)||p_0)=t L'(t)-L(t), L(t)=log E_(p_0)[(q/p_0)^t]",
            "klDerivative": "d/dt D(G_t(q)||p_0)=t Var_(G_t(q))(log(q/p_0))>=0; moving from t=1 down to c<1 strictly lowers KL unless q/p_0 is constant on q's support, i.e. q is p_0 conditioned on its support; in particular it is strict for full-support q != p_0",
        },
        "finiteFeatureChecks": {
            "primePowerCutoff": LIMIT,
            "primePowers": len(TERMS),
            "rows": rows,
            "reflectedStressEta": eta_stress,
            "reflectedStressFixedPointError": stress_fixed_point_error,
            "reflectedStressKlBefore": kl(stress, p0),
            "reflectedStressKlAfter": kl(stress_after, p0),
        },
        "actualXiGate": {
            "candidateCondition": "G_c(P_xi)=P_xi",
            "equivalentCondition": "P_xi=p_0",
            "equivalenceToRH": True,
            "whyNotDerived": "Every zero-feature p_eta is strictly positive on every prime power, so their positive mixture P_xi has full support. The completed explicit formula is linear and signed; no same-xi prime-side identity proves invariance of this aggregate under G_c.",
        },
        "scope": "This constructs a nonlinear positive map on probability ledgers; it is not a Markov kernel on prime indices, not a holomorphic deformation of xi, and not evidence that the actual zero ledger is invariant.",
        "status": "The contraction is realized exactly on the prime feature family. The fixed-point link to the actual xi zero mixture remains RH-equivalent and unproved.",
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print("Nonlinear geometric prime reweighting complete.")
    print("  G_c(q) proportional to q^c p_0^(1-c) exactly maps p_eta to p_(c eta).")
    print("  Fixed points are p_0 conditioned on support; p_0 is unique at full support.")
    print("  KL strictly decreases for full-support noncentral inputs.")
    print("  Invariance of the actual xi mixture remains RH-equivalent and unproved.")


if __name__ == "__main__":
    main()
