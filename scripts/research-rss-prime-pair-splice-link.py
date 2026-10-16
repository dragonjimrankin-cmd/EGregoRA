#!/usr/bin/env python3
"""Audit whether the (101,101) prime-pair term closes the xi contraction link.

The exact exponential-family Fisher metric is written as a positive pairwise
log-ratio sum.  This makes the (101,101) self-pair vanish from the centered
variance, even though Lambda(101)^2 occurs in an uncentered pair ledger.  The
script also checks the local (101,101) coefficient in the critical Chebyshev
energy expansion and records the already-proved all-scale Mellin bridge to RH.
It does not assert that the needed all-scale estimate or same-xi invariance is
proved.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-prime-pair-splice-link-results.json"


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


def fisher_identity_check(a: float, terms: list[tuple[int, float]]) -> dict[str, float | int]:
    logs = [math.log(n) for n, _ in terms]
    raw = [lam * math.exp(-a * log_n) for (n, lam), log_n in zip(terms, logs)]
    mass = math.fsum(raw)
    probs = [weight / mass for weight in raw]
    mean = math.fsum(prob * log_n for prob, log_n in zip(probs, logs))
    second = math.fsum(prob * log_n * log_n for prob, log_n in zip(probs, logs))
    variance = second - mean * mean

    # The symmetric pairwise form equals the centered variance.  Compute the
    # ordered sum with the factor 1/2 from the exact identity.
    pair_sum = math.fsum(
        0.5 * probs[i] * probs[j] * (logs[i] - logs[j]) ** 2
        for i in range(len(terms))
        for j in range(len(terms))
    )
    target_index = next(i for i, (n, _) in enumerate(terms) if n == 101)
    self_pair = (
        0.5
        * probs[target_index]
        * probs[target_index]
        * (logs[target_index] - logs[target_index]) ** 2
    )
    target_cross = math.fsum(
        probs[target_index] * probs[j] * (logs[target_index] - logs[j]) ** 2
        for j in range(len(terms))
        if j != target_index
    )
    assert abs(variance - pair_sum) < 5e-13
    assert self_pair == 0.0
    assert target_cross > 0.0
    return {
        "supportSize": len(terms),
        "normalizer": mass,
        "logVariance": variance,
        "pairwiseLogVariance": pair_sum,
        "101SelfPairContribution": self_pair,
        "101CrossPairSubtotal": target_cross,
    }


def chebyshev_101_diagonal(x: int, lambda_101: float) -> dict[str, int | float]:
    y = 2 * x
    weight = max(0, y - max(x, 101))
    return {
        "X": x,
        "Y": y,
        "triangularWeight": weight,
        "lambda101Squared": lambda_101 * lambda_101,
        "diagonalContribution": weight * lambda_101 * lambda_101,
    }


def main() -> None:
    terms = prime_power_lambdas(20_000)
    assert dict(terms)[101] == math.log(101)
    fisher = fisher_identity_check(2.0, terms)
    lambda_101 = math.log(101)
    energy_rows = [chebyshev_101_diagonal(x, lambda_101) for x in (50, 51, 101, 250, 1000)]
    assert energy_rows[0]["diagonalContribution"] == 0.0
    assert energy_rows[1]["diagonalContribution"] > 0.0
    for row in energy_rows:
        if row["X"] >= 101:
            assert row["triangularWeight"] == row["X"]
            assert abs(row["diagonalContribution"] - row["X"] * math.log(101) ** 2) < 1e-10

    # Reuse the exact, previously certified prime-phase defect bound.  Its
    # strict positive-sum interpretation is an RH-equivalent criterion, not a
    # proof that the defect vanishes.
    certificate_path = ROOT / "docs/rh/rss-prime-phase-defect-certificate.json"
    certificate = json.loads(certificate_path.read_text(encoding="utf-8"))
    defect_upper = float(certificate["bounds"]["defectUpper"])
    assert defect_upper < 9.274e-37

    results = {
        "analysisDate": "2026-10-15",
        "title": "The (101,101) prime-pair event and the same-xi contraction link",
        "question": "Does the prime-supported catch-up at 101, through its Lambda(101)^2 pair term, supply same-xi invariance or eliminate horizontal zero displacement?",
        "verdict": {
            "lambda101IsPrimeSupported": True,
            "lambda101": "log(101)",
            "101SelfPairSurvivesCenteredFisherMetric": False,
            "allScalePrimePairEnergyHasExactMellinBridgeToRh": True,
            "criticalEnergyEstimateProved": False,
            "sameXiContractionInvarianceProved": False,
            "rhProved": False,
            "conclusion": "The (101,101) diagonal is present in the raw Chebyshev pair ledger, but its contribution is only one local term. In the centered Fisher metric that drives the prime-power natural gradient, the self-pair vanishes exactly; only log-ratio cross-pairs contribute. The complete all-scale critical Chebyshev energy would exclude every off-line zero by Mellin holomorphy, but that estimate is RH-equivalent and unproved. The event at 101 supplies neither that estimate nor invariance of the actual xi divisor under the derived contraction.",
        },
        "fisherPairIdentity": {
            "normalizer": "M(a)=sum_n Lambda(n)n^(-a)",
            "identity": "d^2(log M)/da^2 = [2 M(a)^2]^-1 sum_(m,n) Lambda(m)Lambda(n)(mn)^(-a)(log(m/n))^2",
            "naturalGradient": "deta/dt=-eta for a=2+2eta",
            "101Diagonal": "The (101,101) summand has log(101/101)^2=0; its self-pair contributes exactly zero to the Fisher curvature.",
            "finiteCheckAtA2": fisher,
        },
        "criticalChebyshevPairLedger": {
            "identity": "integral_X^(2X)(psi(x)-x)^2 dx = sum_(m,n<=2X) Lambda(m)Lambda(n)[2X-max(X,m,n)]_+ - sum_(m<=2X) Lambda(m)[(2X)^2-max(X,m)^2]_+ + ((2X)^3-X^3)/3",
            "101Diagonal": "Lambda(101)^2 [2X-max(X,101)]_+",
            "forXAtLeast101": "X(log 101)^2, an O(X) local term",
            "rows": energy_rows,
            "requiredAllScaleEstimate": "for every delta>0, integral_X^(2X)|psi(x)-x|^2 dx <= C_delta X^(2+delta) for all X>=2",
            "status": "The exact pair expansion is positive as a whole, but its all-scale critical upper bound is not established; for this arithmetic error function that bound is equivalent to RH.",
        },
        "actualZeroBridge": {
            "positivePrimeAnchorDefect": "D_2=H_ord(3/2)-xi'/xi(2)=sum_quartets 6 eta^2(eta^2+3 gamma^2-9/4)/[(gamma^2+9/4)((gamma^2-eta^2+9/4)^2+4eta^2gamma^2)]",
            "criterion": "D_2=0 iff every horizontal displacement eta is zero iff RH",
            "certifiedUpperBound": defect_upper,
            "certifiedUpperBoundIsZero": False,
            "101InLinearEulerAnchor": "The ordinary s=2 anchor contains Lambda(101)/101^2, not a new independent copy of the prime ledger.",
            "closureGap": "To turn the exact positive defect identity into RH, one must prove D_2=0 (or prove the critical energy bound / same-xi flow invariance); a finite 101 contribution or a tiny positive upper bound does not do this.",
        },
        "evidenceBoundary": {
            "provedHere": [
                "the exact pairwise Fisher identity and cancellation of the (101,101) self-pair",
                "the exact triangular weight of the (101,101) term in the finite Chebyshev pair ledger",
                "the distinction between a local prime-pair term and the all-scale energy theorem",
                "the exact existing positive prime-anchor defect is the direct prime-to-horizontal-displacement identity",
            ],
            "notProved": [
                "the critical Chebyshev-energy upper bound",
                "D_2=0",
                "same-xi invariance under eta -> eta/phi or eta -> eta/2",
                "any new zero-free strip",
                "RH",
            ],
        },
        "status": "The arithmetic link is explicit at the level of criteria: prime-pair energy -> Mellin holomorphy -> no off-line zero. The required global energy bound remains unproved. The local (101,101) event does not supply same-xi closure. RH remains open.",
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print("101 prime-pair/same-xi link audit complete.")
    print("  The centered Fisher metric has an exact pairwise log-ratio formula.")
    print("  The (101,101) self-pair cancels from that metric; cross-pairs drive the curvature.")
    print("  The full critical pair-energy estimate would imply RH, but is not proved.")
    print("  No same-xi contraction invariance or RH proof was obtained.")


if __name__ == "__main__":
    main()
