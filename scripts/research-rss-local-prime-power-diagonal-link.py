#!/usr/bin/env python3
"""Test the local prime-power Hankel criterion for the zero-mixture link.

For any positive mixture of the reflected prime features, the conditional
coefficients along a fixed prime-power tower form a positive moment sequence.
A zero 2x2 Hankel determinant at one prime and one index forces the mixture to
be central. The finite model below checks this exact algebra on central and
off-line stress mixtures; it does not assert the missing identity for P_xi.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-local-prime-power-diagonal-link-results.json"
LIMIT = 20_000
ETA = 0.25


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


def moment(a: float) -> float:
    return math.fsum(lam * n ** (-a) for n, lam in TERMS)


def local_atoms(prime: int, displacements: list[tuple[float, float]]) -> list[tuple[float, float]]:
    """Return (rate, mass) atoms for the finite reflected feature mixture."""
    atoms = []
    for eta, weight in displacements:
        atoms.append((prime ** (-2 - 2 * eta), weight / (2 * moment(2 + 2 * eta))))
        atoms.append((prime ** (-2 + 2 * eta), weight / (2 * moment(2 - 2 * eta))))
    return atoms


def local_coefficients(prime: int, displacements: list[tuple[float, float]],
                       count: int) -> list[float]:
    """Return q(p^k)/log(p) as moments of the finite positive rate measure.

    Each (eta, mixture weight) contributes the reflected half-mixture
    (p_eta + p_-eta)/2. The finite M_N normalizers define the finite model.
    """
    atoms = local_atoms(prime, displacements)
    return [math.fsum(mass * rate**k for rate, mass in atoms)
            for k in range(1, count + 1)]


def hankel_determinant(values: list[float], index: int) -> float:
    # Values are indexed from k=1, so index=1 uses a_1, a_2, a_3.
    a, b, c = values[index - 1 : index + 2]
    return a * c - b * b


def hankel_integral(atoms: list[tuple[float, float]], index: int) -> float:
    """Evaluate one-half the exact double-integral identity on finite atoms."""
    return 0.5 * math.fsum(
        mass_a * mass_b * (rate_a * rate_b) ** index * (rate_a - rate_b) ** 2
        for rate_a, mass_a in atoms
        for rate_b, mass_b in atoms
    )


def main() -> None:
    primes = (2, 3, 5, 7, 11)
    stress = [(ETA, 1.0)]
    checks = []
    for prime in primes:
        central = [prime ** (-2 * k) / moment(2) for k in range(1, 4)]
        central_atoms = [(prime**-2, 1 / moment(2))]
        stress_atoms = local_atoms(prime, stress)
        stressed = local_coefficients(prime, stress, 3)
        central_det = hankel_determinant(central, 1)
        stress_det = hankel_determinant(stressed, 1)
        central_integral = hankel_integral(central_atoms, 1)
        stress_integral = hankel_integral(stress_atoms, 1)
        assert abs(central_det) < 2e-17
        assert stress_det > 0
        assert math.isclose(central_det, central_integral, rel_tol=0.0, abs_tol=2e-17)
        assert math.isclose(stress_det, stress_integral, rel_tol=2e-12, abs_tol=2e-20)
        checks.append({
            "centralHankelIntegral": central_integral,
            "prime": prime,
            "centralCoefficients": central,
            "centralHankelDeterminant": central_det,
            "stressCoefficients": stressed,
            "stressHankelDeterminant": stress_det,
            "stressHankelIntegral": stress_integral,
            "stressToCentralFirstCoefficientRatio": stressed[0] / central[0],
            "slowDecayRateAboveCentral": prime ** (-2 + 2 * ETA) > prime ** -2,
            "fastDecayRateBelowCentral": prime ** (-2 - 2 * ETA) < prime ** -2,
        })

    results = {
        "analysisDate": "2026-10-15",
        "title": "A one-prime Hankel test for the positive zero-mixture link",
        "question": "Can the nonlinear fixed-point gate be reduced to a local Euler-factor recurrence on one prime-power tower?",
        "verdict": {
            "localPositiveMomentRepresentationProved": True,
            "oneLocalHankelEqualityWouldImplyRh": True,
            "actualXiLocalHankelEqualityProved": False,
            "standardExplicitFormulaSuppliesTheEquality": False,
            "rhProved": False,
            "conclusion": "For every prime p, the sequence P_xi(p^k)/log(p) is a positive moment sequence in rates p^(-2+/-2eta). If one 2x2 Hankel determinant vanishes exactly, the rate measure is a point mass; reflected positive weights then force every eta=0. No explicit-formula identity proves this determinant vanishes for the actual zero ledger.",
        },
        "localIdentity": {
            "coefficient": "a_(p,k)=P_xi(p^k)/log(p)",
            "rateMeasure": "a_(p,k)=integral r^k dnu_p(r)",
            "rates": ["p^(-2-2eta)", "p^(-2+2eta)"],
            "weights": "w_rho/(2 M(2+2eta)) and w_rho/(2 M(2-2eta)), respectively",
            "hankelIdentity": "a_k a_(k+2)-a_(k+1)^2 = (1/2) integral integral (rs)^k (r-s)^2 dnu_p(r)dnu_p(s) >= 0",
            "centralSequence": "a_(p,k)=p^(-2k)/M(2), a geometric sequence with zero Hankel determinant",
            "localGeneratingFunction": "F_p(z)=sum_k a_(p,k)z^k; one off-line feature has simple-pole terms at p^(2+2eta) and p^(2-2eta), while its positive slow-decay rate forces aggregate radius <= p^(2-2eta) < p^2; under RH the radius is p^2",
        },
        "finiteChecks": {
            "primePowerCutoff": LIMIT,
            "primePowers": len(TERMS),
            "stressEta": ETA,
            "primes": checks,
        },
        "missingGate": {
            "requiredIdentity": "P_xi(p^k)=log(p) p^(-2k)/M(2) for one fixed prime p and every k>=1",
            "weakerSufficientIdentity": "a_(p,1)a_(p,3)=a_(p,2)^2 for one fixed prime p",
            "whyNotDerived": "The local coefficient depends on rho and conjugate(rho) through eta=Re(rho)-1/2 and M(1+rho+conjugate(rho)). A one-variable Weil explicit formula tests holomorphic functions of rho; this diagonal statistic requires a two-variable zero/prime correlation identity. Squaring the explicit formula introduces the uncontrolled off-diagonal pair terms.",
            "scope": "This is a new RH-equivalent local criterion, not a proof of the zero-mixture/Euler-factor identity and not the (101,101) raw-energy event.",
        },
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print("Local prime-power diagonal-link audit complete.")
    print("  Positive moment representation and Hankel identity verified.")
    print("  A zero local determinant is RH-forcing; its actual xi value is unknown.")
    print("  No standard explicit-formula identity supplies that equality.")


if __name__ == "__main__":
    main()
