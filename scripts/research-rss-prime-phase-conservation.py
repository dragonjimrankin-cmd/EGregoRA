#!/usr/bin/env python3
"""Thirty-third-stage attempt to prove the one-point prime conservation law.

The s=2 completed-logarithmic-derivative anchor is coercively equivalent to
horizontal-residue dissipation.  This continuation derives an exact weighted
prime-phase identity in Re(sigma)>1 and tests whether it can be transported to
the critical boundary sigma=1/2 without a zero-crossing defect.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-prime-phase-conservation-results.json"
A = 1.5
FIRST_ZERO = 14.134725141734693


def primes_up_to(limit: int) -> list[int]:
    sieve = bytearray(b"\x01") * (limit + 1)
    sieve[:2] = b"\x00\x00"
    for p in range(2, math.isqrt(limit) + 1):
        if sieve[p]:
            start = p * p
            sieve[start : limit + 1 : p] = b"\x00" * (((limit - start) // p) + 1)
    return [p for p in range(2, limit + 1) if sieve[p]]


PRIME_LIMIT = 1_000_000
PRIMES = primes_up_to(PRIME_LIMIT)


def mangoldt_moment(exponent: float) -> tuple[float, int]:
    total = 0.0
    terms = 0
    for p in PRIMES:
        log_p = math.log(p)
        power = p
        while power <= PRIME_LIMIT:
            total += log_p / power**exponent
            terms += 1
            if power > PRIME_LIMIT // p:
                break
            power *= p
    return total, terms


def sine_kernel_integral_closed(frequency: float, a: float = A) -> float:
    # Integral_0^infinity T sin(bT)/(T^2+a^2)^2 dT.
    return math.pi * frequency * math.exp(-a * frequency) / (4 * a)


def sine_kernel_integral_numeric(frequency: float, a: float = A) -> float:
    # Composite Simpson check on a long finite interval.  The O(T^-3) tail is
    # oscillatory; this is a diagnostic, while the closed transform is exact.
    upper = 400.0
    steps = 400_000
    h = upper / steps

    def value(t: float) -> float:
        return t * math.sin(frequency * t) / (t * t + a * a) ** 2

    total = value(0.0) + value(upper)
    for index in range(1, steps):
        total += (4 if index % 2 else 2) * value(index * h)
    return total * h / 3


def anchor_gap(eta: float, gamma: float, w: float = A) -> float:
    e = eta * eta
    g = gamma * gamma
    denominator = (w * w + g) * ((w * w - e + g) ** 2 + 4 * e * g)
    return 4 * w * e * (e + 3 * g - w * w) / denominator


fourier_checks = []
for frequency in [math.log(2), math.log(3), math.log(5), math.log(11)]:
    closed = sine_kernel_integral_closed(frequency)
    numeric = sine_kernel_integral_numeric(frequency)
    error = abs(numeric - closed)
    assert error < 4e-8
    fourier_checks.append({
        "frequency": frequency,
        "closed": closed,
        "numeric": numeric,
        "absoluteError": error,
    })

# For sigma>1, the exact transform is
#   I(sigma) = -sum Lambda(n) n^(-(sigma+3/2)).
# The finite sums below are diagnostics; convergence is absolute.
prime_phase_rows = []
for sigma in [2.0, 1.5, 1.1, 0.5]:
    exponent = sigma + A
    moment, terms = mangoldt_moment(exponent)
    prime_phase_rows.append({
        "sigma": sigma,
        "exponent": exponent,
        "partialPrimeMoment": moment,
        "zetaPhaseTransformPartial": -moment,
        "endpointCompletedPhaseTransformPartial": 1 / (sigma + 0.5) - moment,
        "termsThroughOneMillion": terms,
        "provedByEulerProduct": sigma > 1,
    })

assert prime_phase_rows[0]["partialPrimeMoment"] < prime_phase_rows[1]["partialPrimeMoment"]
assert prime_phase_rows[1]["partialPrimeMoment"] < prime_phase_rows[2]["partialPrimeMoment"]
assert abs(prime_phase_rows[-1]["partialPrimeMoment"] - 0.5699609931) < 2e-6

# At the boundary, arg(-1/2+iT)=pi-arctan(2T). The constant pi
# contributes 3/a^2=4/3 and the arctangent contributes 1/2, leaving 5/6.
boundary_endpoint_phase = 3 / (A * A) - 3 / (2 * A * (A + 0.5))
assert abs(boundary_endpoint_phase - 5 / 6) < 1e-15
pole_correction = boundary_endpoint_phase - 1
assert abs(pole_correction + 1 / 6) < 1e-15

# Synthetic off-line quartets exhibit the positive contour-crossing/Blaschke
# defect that blocks continuation of the prime phase identity to sigma=1/2.
defect_rows = []
for gamma in [FIRST_ZERO, 50.0, 1000.0]:
    for eta in [0.1, 0.25, 0.49]:
        defect = anchor_gap(eta, gamma)
        assert defect > 0
        defect_rows.append({"eta": eta, "gamma": gamma, "anchorDefect": defect})

results = {
    "analysisDate": "2026-10-15",
    "title": "Attempting to continue the principal-prime phase law to the critical boundary",
    "question": (
        "can the exact s=2 principal-prime anchor identity be conserved under the zero-support flow "
        "by transporting an Euler-product phase formula from sigma>1 to sigma=1/2?"
    ),
    "verdict": {
        "rhProved": False,
        "scalarConservationProved": False,
        "primePhaseLawProvedInEulerHalfPlane": True,
        "endpointCompletedPhaseLawProvedInEulerHalfPlane": True,
        "criticalBoundaryContinuationProved": False,
        "continuationEquivalentToRh": True,
        "conclusion": (
            "An exact weighted argument transform converts the Euler-product phase at every sigma>1 into "
            "the absolutely convergent moment -sum Lambda(n)n^(-(sigma+3/2)). Including the endpoint factor "
            "s-1 gives 1/(sigma+1/2) minus that moment. At sigma=1/2 its formal endpoint is exactly "
            "1-sum Lambda(n)/n^2, the endpoint-completed prime anchor at s=2. Moving the contour from sigma>1 "
            "to the critical boundary crosses every zero with beta>1/2; their Blaschke residues sum to the "
            "nonnegative Euler-anchor defect. Proving defect-free continuation is therefore equivalent to RH, "
            "not a consequence of dominated convergence or analytic continuation of the prime series."
        ),
    },
    "weightedPrimePhaseLaw": {
        "a": A,
        "phase": "S_sigma(T)=arg zeta(sigma+iT)/pi with the Euler-product branch",
        "transform": (
            "I(sigma)=(6/pi) integral_0^infinity T arg zeta(sigma+iT)/(T^2+9/4)^2 dT"
        ),
        "law": "I_zeta(sigma)=-sum_(n>=2) Lambda(n)n^(-(sigma+3/2)) for sigma>1",
        "endpointCompletedTransform": (
            "I_C(sigma)=(6/pi) integral T arg((sigma-1+iT)zeta(sigma+iT))/(T^2+9/4)^2 dT"
        ),
        "endpointCompletedLaw": (
            "I_C(sigma)=1/(sigma+1/2)-sum Lambda(n)n^(-(sigma+3/2)) for sigma>1"
        ),
        "derivation": [
            "log zeta(sigma+iT)=sum Lambda(n)/(log n)n^(-sigma-iT)",
            "the imaginary part contributes -sin(T log n)",
            "integral T sin(bT)/(T^2+a^2)^2 dT=pi b exp(-ab)/(4a)",
            "at a=3/2 the prefactor 6/(4a) equals one",
            "the phase of sigma-1+iT contributes 1/(sigma+1/2)",
        ],
        "fourierChecks": fourier_checks,
        "primePhaseRows": prime_phase_rows,
    },
    "criticalBoundaryTarget": {
        "formalZetaEndpoint": "I_zeta(1/2)=-sum Lambda(n)/n^2",
        "formalEndpointCompletedValue": "I_C(1/2)=1-sum Lambda(n)/n^2=C'/C(2)",
        "ordinateIdentity": (
            "H_ord(3/2)=6 integral_0^infinity T N(T)/(T^2+9/4)^2 dT"
        ),
        "countingFormula": "N(T)=1+theta(T)/pi+arg zeta(1/2+iT)/pi",
        "gammaIdentity": (
            "(6/pi) integral T theta(T)/(T^2+9/4)^2 dT=-(EulerGamma+log pi)/2"
        ),
        "boundaryEndpointPhaseTransform": boundary_endpoint_phase,
        "analyticEndpointValue": 1.0,
        "poleCorrection": pole_correction,
        "zetaPoleCorrection": (
            "the boundary endpoint phase is 5/6 rather than the formal value 1, producing the -1/6 correction"
        ),
        "defectIdentityZetaPhase": (
            "D_2=I_zeta,crit+sum Lambda(n)/n^2-1/6"
        ),
        "defectIdentityEndpointCompleted": (
            "D_2=I_C,crit-[1-sum Lambda(n)/n^2]"
        ),
        "equivalence": (
            "D_2=0 iff the endpoint-completed prime phase law reaches sigma=1/2 without a zero-crossing defect iff RH"
        ),
    },
    "zeroCrossingAudit": {
        "mechanism": (
            "log zeta has no single holomorphic branch across a zero; shifting the vertical line from "
            "sigma>1 to sigma=1/2 acquires argument/Blaschke contributions from beta>1/2"
        ),
        "quartetDefect": (
            "6eta^2(eta^2+3gamma^2-9/4)/[(gamma^2+9/4)"
            "((gamma^2-eta^2+9/4)^2+4eta^2gamma^2)]"
        ),
        "sign": "strictly positive for every off-line nontrivial quartet",
        "rows": defect_rows,
        "consequence": (
            "the desired scalar conservation is exactly the assertion that no zero-crossing contribution exists"
        ),
    },
    "failedClosureRoutes": [
        {
            "route": "dominated convergence in sigma",
            "failure": (
                "growth in T is integrable, but branches of arg zeta are not uniform through zeros; "
                "the missing finite jump is the positive defect"
            ),
        },
        {
            "route": "analytic continuation of the prime moment",
            "failure": (
                "-sum Lambda(n)n^(-(sigma+3/2)) continues as a scalar function, but identity theorem cannot "
                "continue an equality whose left side uses a logarithm crossing zeros"
            ),
        },
        {
            "route": "functional equation cancellation",
            "failure": (
                "reflection sends beta>1/2 to beta<1/2; only the right member is crossed before the critical line, "
                "so the defects do not cancel"
            ),
        },
        {
            "route": "natural-gradient/Noether conservation",
            "failure": (
                "the support law is dissipative rather than Hamiltonian; the s=2 anchor is a strict Lyapunov "
                "quantity off the line, not a conserved observable"
            ),
        },
        {
            "route": "critical Chebyshev energy",
            "failure": (
                "it would justify the zero-free continuation, but its required all-scale estimate is itself RH-equivalent"
            ),
        },
    ],
    "minimalRemainingStatement": (
        "prove that the weighted Euler-product phase identity has no Blaschke jump as sigma decreases from "
        "greater than one to one half"
    ),
    "status": "the conservation law is proved only in the Euler half-plane; its critical-boundary extension and RH remain open",
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Prime-phase conservation attempt complete.")
print("  Exact weighted phase law proved for sigma>1.")
print("  Endpoint completion gives the required 1-sum Lambda(n)/n^2 at sigma=1/2.")
print("  Off-line zeros contribute a strictly positive contour-crossing defect.")
print("  Defect-free continuation was not proved; RH remains open.")
