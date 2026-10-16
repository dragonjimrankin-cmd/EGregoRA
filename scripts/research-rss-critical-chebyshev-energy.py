#!/usr/bin/env python3
"""Twenty-fourth-stage search for the weakest usable prime-error theorem.

The preceding stage asked for pointwise square-root Chebyshev error or direct
signed Laguerre cancellation. This stage replaces both with a positive,
all-scale L2 statement and verifies its exact Mellin and Laguerre thresholds.
It does not prove the new estimate or RH.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "docs/rh/rss-dual-prime-error-routes-results.json"
OUTPUT = ROOT / "docs/rh/rss-critical-chebyshev-energy-results.json"

prior = json.loads(INPUT.read_text())
assert prior["verdict"]["rhProved"] is False


def von_mangoldt_table(limit: int) -> list[float]:
    """Return Lambda(n), 0 <= n <= limit, by marking prime powers."""
    is_prime = bytearray(b"\x01") * (limit + 1)
    if limit >= 0:
        is_prime[0] = 0
    if limit >= 1:
        is_prime[1] = 0
    for p in range(2, int(math.isqrt(limit)) + 1):
        if is_prime[p]:
            is_prime[p * p : limit + 1 : p] = b"\x00" * (((limit - p * p) // p) + 1)

    values = [0.0] * (limit + 1)
    for p in range(2, limit + 1):
        if not is_prime[p]:
            continue
        logp = math.log(p)
        power = p
        while power <= limit:
            values[power] = logp
            if power > limit // p:
                break
            power *= p
    return values


def interval_energy_from_steps(lambdas: list[float], x0: int, x1: int) -> float:
    """Integrate (psi(x)-x)^2 exactly between integer jump points."""
    psi = sum(lambdas[: x0 + 1])
    total = 0.0
    for k in range(x0, x1):
        # psi is constant on [k,k+1), apart from a null endpoint.
        total += ((k + 1 - psi) ** 3 - (k - psi) ** 3) / 3
        psi += lambdas[k + 1]
    return total


def interval_energy_from_pair_ledger(lambdas: list[float], x0: int, x1: int) -> float:
    """Expand the same energy into its finite von Mangoldt pair ledger."""
    support = [(n, lambdas[n]) for n in range(2, x1 + 1) if lambdas[n]]
    psi_square = 0.0
    for m, lm in support:
        for n, ln in support:
            psi_square += lm * ln * max(0, x1 - max(x0, m, n))

    cross = 0.0
    for m, lm in support:
        lower = max(x0, m)
        if lower < x1:
            cross += lm * (x1 * x1 - lower * lower)

    x_square = (x1**3 - x0**3) / 3
    return psi_square - cross + x_square


# Verify that the positive integral and the finite prime-pair identity agree.
small_lambda = von_mangoldt_table(256)
pair_checks = []
for x0 in [4, 8, 16, 32, 64, 128]:
    step_value = interval_energy_from_steps(small_lambda, x0, 2 * x0)
    pair_value = interval_energy_from_pair_ledger(small_lambda, x0, 2 * x0)
    tolerance = 2e-9 * max(1.0, step_value)
    assert abs(step_value - pair_value) < tolerance
    pair_checks.append({
        "X": x0,
        "stepIntegral": step_value,
        "primePairLedger": pair_value,
        "absoluteDifference": abs(step_value - pair_value),
    })

# Finite samples are implementation checks only. They do not test the all-X bound.
max_x = 32768
lambdas = von_mangoldt_table(2 * max_x)
finite_samples = []
for x0 in [32, 128, 512, 2048, 8192, 32768]:
    energy = interval_energy_from_steps(lambdas, x0, 2 * x0)
    finite_samples.append({
        "X": x0,
        "dyadicEnergy": energy,
        "energyOverX2": energy / (x0 * x0),
        "scope": "finite diagnostic only",
    })

# Weighted L2 at epsilon gives a Laguerre Hilbert-space weight
# c=1-2 epsilon/3. The vector-valued generating function is square
# integrable on |z|=r when c-2r/(1+r)>0, i.e. r<c/(2-c).
# The limiting coefficient base exactly matches B_theta at theta=1/2+epsilon.
laguerre_thresholds = []
for epsilon in [0.25, 0.1, 0.05, 0.01, 0.001]:
    c = 1 - 2 * epsilon / 3
    radius = c / (2 - c)
    base = 1 / radius
    theta = 0.5 + epsilon
    half_plane_base = (1 + theta) / (2 - theta)
    assert abs(base - half_plane_base) < 1e-14
    assert c > 0
    assert radius < 1
    laguerre_thresholds.append({
        "epsilon": epsilon,
        "laguerreWeightC": c,
        "admissibleRadiusSupremum": radius,
        "limitingCoefficientBase": base,
        "halfPlaneBaseAtThetaHalfPlusEpsilon": half_plane_base,
    })

results = {
    "analysisDate": "2026-10-15",
    "title": "The critical dyadic Chebyshev-energy theorem",
    "question": "what is the weakest concrete positive arithmetic theorem that closes the prime-Laguerre route?",
    "verdict": {
        "rhProved": False,
        "criticalEnergyEstimateProved": False,
        "missingTheoremFoundAsExactEquivalent": True,
        "strictlyWeakerThanPointwiseSquareRootControl": True,
        "finiteComputationsProveAllScaleEstimate": False,
        "conclusion": (
            "The missing input can be stated as a positive all-scale mean-square theorem: for every delta>0, "
            "the integral from X to 2X of |psi(x)-x|^2 is O_delta(X^(2+delta)). It is weaker than a pointwise "
            "square-root bound, but Mellin continuation shows it is still equivalent to RH. It also gives the "
            "critical weighted L2 norms needed for the signed Laguerre transform. The estimate itself remains unproved."
        ),
    },
    "criticalDyadicEnergyTheorem": {
        "statement": "for every delta>0, integral_X^(2X) |psi(x)-x|^2 dx = O_delta(X^(2+delta)) for all X>=2",
        "normalizedStatement": "X^(-2) integral_X^(2X) |psi(x)-x|^2 dx = X^(o(1))",
        "equivalentCumulativeStatement": (
            "for every delta>0, integral_1^X |psi(x)-(x-1)|^2 x^(-2) dx = O_delta(X^delta)"
        ),
        "equivalentWeightedStatement": (
            "for every epsilon>0, integral_1^infinity |psi(x)-(x-1)|^2 x^(-2-2epsilon) dx is finite"
        ),
        "status": "identified and proved equivalent to RH; its asserted bound is not proved",
    },
    "whyItIsWeaker": {
        "pointwisePremise": "psi(x)-x=O_epsilon(x^(1/2+epsilon)) for every epsilon>0",
        "energyConsequence": "the pointwise premise implies the dyadic energy theorem by integration",
        "nonConverseAtFunctionLevel": (
            "an L2 bound permits errors larger than square-root scale on sufficiently sparse sets, so it does not "
            "supply a pointwise estimate for a general error function"
        ),
        "importantQualification": (
            "for the specific Chebyshev error, the all-scale energy theorem still implies RH by Mellin analyticity; "
            "RH then separately returns the standard pointwise bound"
        ),
    },
    "mellinClosure": {
        "shiftedError": "E_tilde(x)=psi(x)-(x-1)",
        "identity": (
            "integral_1^infinity E_tilde(x)x^(-s-1)dx = -(1/s) d/ds log((s-1)zeta(s)) for Re(s)>1"
        ),
        "cauchySchwarz": (
            "the epsilon-weighted L2 norm makes this Mellin integral absolutely convergent whenever "
            "Re(s)>1/2+epsilon"
        ),
        "continuation": (
            "having every epsilon>0 continues the logarithmic derivative holomorphically through Re(s)>1/2, "
            "so (s-1)zeta(s) has no zero there"
        ),
        "functionalSymmetry": "zero-freeness in Re(s)>1/2 and the functional equation place every nontrivial zero on Re(s)=1/2",
    },
    "primePairLedger": {
        "identity": (
            "with Y=2X, integral_X^Y(psi(x)-x)^2dx equals "
            "sum_(m,n<=Y) Lambda(m)Lambda(n)[Y-max(X,m,n)]_+ minus "
            "sum_(m<=Y) Lambda(m)[Y^2-max(X,m)^2]_+ plus (Y^3-X^3)/3"
        ),
        "interpretation": (
            "the missing theorem is a finite all-X cancellation estimate for a triangularly weighted von Mangoldt pair ledger"
        ),
        "verifiedChecks": pair_checks,
    },
    "laguerreHilbertBridge": {
        "kernel": "K_n(t)=2L_(n-1)^1(t)+3L_(n-2)^2(t)",
        "vectorGeneratingFunction": (
            "sum_(n>=1) K_n(t)z^n = z(2+z)(1-z)^(-3) exp(-tz/(1-z))"
        ),
        "weightedNorm": (
            "Cauchy-Schwarz uses I_epsilon=integral |E_tilde(x)|^2 x^(-2-2epsilon)dx and "
            "integral exp(-(1-2epsilon/3)t)|K_n(t)|^2dt"
        ),
        "diskCondition": (
            "for c=1-2epsilon/3 the Hilbert-valued generating function is square integrable when "
            "c-2r/(1+r)>0, equivalently r<c/(2-c)"
        ),
        "coefficientBaseIdentity": (
            "the limiting base (2-c)/c=(1+2epsilon/3)/(1-2epsilon/3) equals "
            "B_(1/2+epsilon)=(3/2+epsilon)/(3/2-epsilon)"
        ),
        "thresholds": laguerre_thresholds,
        "consequence": (
            "because the energy theorem supplies I_epsilon for every epsilon>0 and the base tends to one, "
            "p_n=exp(o(n)) follows"
        ),
    },
    "finiteDiagnostics": finite_samples,
    "whyKnownAveragesDoNotSupplyIt": {
        "distinction": (
            "ordinary zero-density or averaged-in-height estimates may leave an exceptional zero; this theorem is "
            "an all-X critical energy bound on the arithmetic error itself"
        ),
        "unconditionalScale": (
            "pointwise PNT-sized control gives a dyadic energy on essentially the X^3 scale, while the missing theorem requires X^(2+o(1))"
        ),
        "singleExceptionalZero": (
            "the critical energy theorem cannot coexist with a zero of real part greater than one half because its Mellin transform would be both holomorphic and singular there"
        ),
    },
    "proofBoundary": {
        "whatWasFound": [
            "a positive all-scale theorem strictly weaker in form than pointwise square-root error",
            "an exact finite von Mangoldt pair-ledger formulation",
            "a Mellin proof that the theorem excludes every exceptional zero",
            "a Hilbert-valued Laguerre generating-function bound recovering the exact exponent-to-base map",
        ],
        "whatRemainsUnproved": (
            "the all-X estimate integral_X^(2X)|psi(x)-x|^2dx=O_delta(X^(2+delta)) for every delta>0"
        ),
        "status": "the missing theorem has been isolated, not established; RH remains open",
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Critical Chebyshev-energy investigation complete.")
print("  Missing theorem: dyadic prime-error energy is X^(2+o(1)).")
print("  Exact forms: weighted Mellin norm, finite prime-pair ledger, Laguerre Hilbert bound.")
print("  Verdict: theorem isolated but not proved; RH remains open.")
