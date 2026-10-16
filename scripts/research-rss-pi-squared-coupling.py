#!/usr/bin/env python3
"""Twenty-seventh-stage direct tests of pi-times-pi coupling.

The user asked to test, rather than merely classify, universal pi coupling. This
script tests both natural meanings of pi*pi: replacing the canonical Gaussian,
sine and strip scales by pi^2, and tensoring two pi-normalized channels. It also
computes finite dyadic prime-energy diagnostics for untwisted, logarithmically
twisted and additively twisted channels. No finite computation is promoted to
an all-X estimate.
"""

from __future__ import annotations

import cmath
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "docs/rh/rss-universal-pi-coupling-results.json"
OUTPUT = ROOT / "docs/rh/rss-pi-squared-coupling-results.json"

prior = json.loads(INPUT.read_text())
assert prior["verdict"]["rhProved"] is False


def theta_a(a: float, x: float, cutoff: int = 120) -> float:
    return 1 + 2 * sum(math.exp(-a * n * n * x) for n in range(1, cutoff + 1))


theta_tests = []
for a_name, a in [("pi", math.pi), ("piSquared", math.pi**2), ("one", 1.0)]:
    rows = []
    for x in [0.1, 0.2, 0.5, 2.0, 5.0, 10.0]:
        value = theta_a(a, x)
        same_parameter_reciprocal = theta_a(a, 1 / x) / math.sqrt(x)
        dual_parameter = math.pi**2 / a
        dual_reciprocal = math.sqrt(math.pi / (a * x)) * theta_a(dual_parameter, 1 / x)
        assert abs(value - dual_reciprocal) < 3e-14
        rows.append({
            "x": x,
            "theta": value,
            "sameParameterSelfDualResidual": abs(value - same_parameter_reciprocal),
            "dualParameter": dual_parameter,
            "pairedDualResidual": abs(value - dual_reciprocal),
        })
    theta_tests.append({"parameter": a_name, "a": a, "rows": rows})

pi_rows = next(entry["rows"] for entry in theta_tests if entry["parameter"] == "pi")
pi2_rows = next(entry["rows"] for entry in theta_tests if entry["parameter"] == "piSquared")
assert max(row["sameParameterSelfDualResidual"] for row in pi_rows) < 3e-14
assert max(row["sameParameterSelfDualResidual"] for row in pi2_rows) > 0.1
assert all(abs(row["dualParameter"] - 1) < 1e-15 for row in pi2_rows)

# The pi^2 strip exponential fails to keep the full critical strip in the
# right half-plane once |eta| > 1/(2pi).
strip_samples = []
for eta in [0.0, 0.1, 1 / (2 * math.pi), 0.2, 0.25, 0.4, 0.49]:
    ordinary_real_factor = math.cos(math.pi * eta)
    pi2_real_factor = math.cos(math.pi**2 * eta)
    strip_samples.append({
        "eta": eta,
        "ordinaryPiRealFactor": ordinary_real_factor,
        "piSquaredRealFactor": pi2_real_factor,
        "piSquaredRemainsInRightHalfPlane": pi2_real_factor >= -1e-15,
    })
assert all(row["ordinaryPiRealFactor"] > 0 for row in strip_samples if abs(row["eta"]) < 0.5)
assert any(not row["piSquaredRemainsInRightHalfPlane"] for row in strip_samples)

# Sieve von Mangoldt values for finite arithmetic diagnostics.
def von_mangoldt_table(limit: int) -> list[float]:
    is_prime = bytearray(b"\x01") * (limit + 1)
    is_prime[0:2] = b"\x00\x00"
    for p in range(2, math.isqrt(limit) + 1):
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


x_values = [2**k for k in range(8, 19)]
limit = 2 * x_values[-1]
lambdas = von_mangoldt_table(limit)
finite_energy = {x: {} for x in x_values}

# Exact untwisted interval energy.
psi = 0.0
untwisted = {x: 0.0 for x in x_values}
for k in range(1, limit):
    psi += lambdas[k]
    for x in x_values:
        if x <= k < 2 * x:
            untwisted[x] += ((k + 1 - psi) ** 3 - (k - psi) ** 3) / 3
for x in x_values:
    finite_energy[x]["untwisted"] = untwisted[x] / (x * x)

# Midpoint diagnostics for three pi-coupled prime channels. The logarithmic
# twists have the PNT main integral x^(1+ia)/(1+ia); the fixed additive twist
# has the oscillatory integral exp(iax)/(ia). These are finite diagnostics only.
channel_specs = [
    ("logPi", "log", math.pi),
    ("logPiSquared", "log", math.pi**2),
    ("additivePiSquared", "additive", math.pi**2),
]
for name, kind, alpha in channel_specs:
    prime_sum = 0j
    accumulators = {x: 0.0 for x in x_values}
    for k in range(1, limit):
        if lambdas[k]:
            if kind == "log":
                phase = cmath.exp(1j * alpha * math.log(k))
            else:
                phase = cmath.exp(1j * alpha * k)
            prime_sum += lambdas[k] * phase
        midpoint = k + 0.5
        if kind == "log":
            main = (midpoint ** (1 + 1j * alpha) - 1) / (1 + 1j * alpha)
        else:
            main = (cmath.exp(1j * alpha * midpoint) - cmath.exp(1j * alpha)) / (1j * alpha)
        error_squared = abs(prime_sum - main) ** 2
        for x in x_values:
            if x <= k < 2 * x:
                accumulators[x] += error_squared
    for x in x_values:
        finite_energy[x][name] = accumulators[x] / (x * x)

finite_rows = []
for x in x_values:
    finite_rows.append({
        "X": x,
        "normalizedDyadicEnergies": finite_energy[x],
        "scope": "finite diagnostic; not an all-X exponent proof",
    })

# Tensoring two identical scalar channels squares the scalar determinant. Its
# zeros gain multiplicity two but their locations and the coefficient radius do
# not change. Squaring integer pi phases also collapses parity phases to one.

results = {
    "analysisDate": "2026-10-15",
    "title": "Directly testing pi-times-pi coupling",
    "question": "does replacing pi by pi^2, or coupling two pi channels, prove critical energy or RH?",
    "verdict": {
        "rhProved": False,
        "criticalEnergyEstimateProved": False,
        "piSquaredThetaSelfDual": False,
        "piSquaredStripMapValidOnFullCriticalStrip": False,
        "doublePiChannelChangesZetaZeroLocations": False,
        "finiteDiagnosticsProveAsymptotic": False,
        "conclusion": (
            "The direct pi^2 substitutions fail in the two places where canonical pi is rigid. A Gaussian with "
            "coefficient pi^2 is dual to coefficient one rather than itself, and exp(i pi^2(s-1/2)) leaves the "
            "right half-plane inside the critical strip. Tensoring two canonical pi channels only squares the zeta "
            "factor, doubling zero multiplicities without moving zeros or changing the coefficient radius. Finite "
            "prime-energy diagnostics do not supply an all-X theorem."
        ),
    },
    "twoInterpretations": {
        "piSquaredSubstitution": "replace the canonical lattice, Gaussian, phase or strip coefficient pi by pi^2",
        "twoPiChannels": "tensor or pair two separately pi-normalized channels",
    },
    "thetaPiSquaredTest": {
        "generalPoissonIdentity": (
            "Theta_a(x)=sqrt(pi/(a x)) Theta_(pi^2/a)(1/x)"
        ),
        "selfDualFixedPoint": "a=pi is the unique positive fixed point of a -> pi^2/a",
        "piSquaredOutcome": "a=pi^2 is paired with a=1, not with itself",
        "tests": theta_tests,
        "mellinConsequence": (
            "the a=pi^2 and a=1 theta Mellin channels differ by zero-free exponential scale factors and carry the same zeta zero set"
        ),
    },
    "sinePiSquaredTest": {
        "ordinaryIntegerLattice": "sin(pi z)/(pi z) has zeros at every nonzero integer",
        "piSquaredLattice": "sin(pi^2 z)/(pi^2 z) has zeros at z=n/pi, not at the integers",
        "consequence": "pi^2 does not preserve the integer divisor; restoring integer zeros reduces the scale back to pi",
    },
    "stripPiSquaredTest": {
        "ordinaryMap": "q=exp(i pi(s-1/2)) has Re(q)>0 throughout |Re(s)-1/2|<1/2",
        "piSquaredMap": "q=exp(i pi^2(s-1/2)) changes the sign of Re(q) inside the strip",
        "firstFailureDisplacement": 1 / (2 * math.pi),
        "samples": strip_samples,
        "consequence": "the Cayley disk and height-independent seam construction no longer cover the full critical strip",
    },
    "doubleChannelTest": {
        "thetaPair": "the pi^2/one dual pair is a two-channel swap under x->1/x, not a new scalar self-duality",
        "mellinProduct": "two identical completed channels produce a factor proportional to zeta(s)^2",
        "zeroEffect": "all zeta zeros keep the same locations and acquire multiplicity two",
        "coefficientEffect": "fixed multiplicity leaves limsup |p_n|^(1/n) and the analytic radius unchanged",
        "integerPhaseEffect": "for integer n, exp(i pi n) squared equals exp(2pi i n)=1, so the doubled parity phase collapses",
    },
    "finitePrimeEnergyDiagnostics": {
        "channels": {
            "untwisted": "psi(x)-x, integrated exactly between jumps",
            "logPi": "sum Lambda(n)n^(i pi) minus its PNT main integral",
            "logPiSquared": "sum Lambda(n)n^(i pi^2) minus its PNT main integral",
            "additivePiSquared": "sum Lambda(n)exp(i pi^2 n) minus its oscillatory integral",
        },
        "rows": finite_rows,
        "interpretation": (
            "logarithmic twists reorganize the same horizontal zero problem; the additive twist is a different channel. "
            "No finite range certifies the required subpower all-X energy bound or transfers a twisted estimate to the principal channel."
        ),
    },
    "positiveNormTest": {
        "identity": "|exp(i pi^2 f(n))E_n|^2=|E_n|^2",
        "result": "pi^2 unit phases preserve the critical Hilbert energy exactly",
    },
    "applicationToPreviousWork": [
        {
            "object": "theta completion",
            "result": "pi is the unique self-dual positive Gaussian coefficient; pi^2 creates a paired one/pi^2 doublet",
        },
        {
            "object": "integer sine divisor",
            "result": "pi^2 moves lattice zeros from integers to n/pi",
        },
        {
            "object": "two-ended seam",
            "result": "pi^2 fails the full-strip right-half-plane map beyond |eta|=1/(2pi)",
        },
        {
            "object": "prime-Laguerre controller",
            "result": "doubling channels changes multiplicity, not radius",
        },
        {
            "object": "critical energy",
            "result": "unit pi^2 phases preserve the norm; twisted finite diagnostics do not prove the principal estimate",
        },
    ],
    "proofBoundary": {
        "testedConclusion": (
            "both direct meanings of pi*pi have been tested: pi^2 substitution breaks canonical self-duality or strip geometry, "
            "while two pi channels only duplicate the existing zeta obstruction"
        ),
        "remainingPossibility": (
            "a different number-dependent pi-register interaction could be proposed, but it must specify its kernel and prove recovery of the untwisted prime ledger"
        ),
        "status": "no tested pi*pi coupling proves critical energy or RH",
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Pi-times-pi coupling tests complete.")
print("  Theta: pi^2 pairs with 1; only pi is scalar self-dual.")
print("  Seam: pi^2 exits the right half-plane inside the critical strip.")
print("  Double channel: zero multiplicity doubles; locations do not move.")
print("  Verdict: finite twisted energies do not prove critical energy or RH.")
