#!/usr/bin/env python3
"""Eleventh-stage RSS/RH investigation.

Test whether the 999-666-333 third-density bounce is an exact periodic
permutation or whether the missing-one carry derives a contraction symmetry of
the completed xi zero spectrum.

The script uses only Python's standard library. Xi values are evaluated with an
Euler-Maclaurin zeta expansion and a Lanczos gamma approximation; the exact
finite arithmetic is checked independently with integers and Fractions.
"""

from __future__ import annotations

import cmath
import json
import math
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-third-density-bounce-results.json"

CEILING = 999
THRESHOLD = 1000
STEP = 333
FIRST_ZERO_ORDINATE = 14.134725141734693


def gcd(a: int, b: int) -> int:
    while b:
        a, b = b, a % b
    return abs(a)


def additive_order(step: int, modulus: int) -> int:
    return modulus // gcd(step, modulus)


def orbit(step: int, modulus: int, start: int = 0) -> list[int]:
    values: list[int] = []
    seen: set[int] = set()
    value = start % modulus
    while value not in seen:
        seen.add(value)
        values.append(value)
        value = (value + step) % modulus
    assert value == start % modulus
    return values


def translate(value: int, modulus: int = THRESHOLD) -> int:
    return (value + STEP) % modulus


def reflect(value: int, modulus: int = THRESHOLD) -> int:
    return (CEILING - value) % modulus


def inverse_translate(value: int, modulus: int = THRESHOLD) -> int:
    return (value - STEP) % modulus


# Exact quotient-999 model: a three-cycle and its reflection.
quotient_orbit = orbit(STEP, CEILING)
assert quotient_orbit == [0, 333, 666]
assert additive_order(STEP, CEILING) == 3
for value in range(CEILING):
    assert reflect(reflect(value, CEILING), CEILING) == value
    reflected_translate_reflected = reflect(
        translate(reflect(value, CEILING), CEILING), CEILING
    )
    assert reflected_translate_reflected == inverse_translate(value, CEILING)

# Exact carry-aware model: 333 is coprime to 1000, so every state is visited.
carry_orbit = orbit(STEP, THRESHOLD)
assert additive_order(STEP, THRESHOLD) == 1000
assert len(carry_orbit) == THRESHOLD
assert len(set(carry_orbit)) == THRESHOLD
assert set(carry_orbit) == set(range(THRESHOLD))
assert carry_orbit[:10] == [0, 333, 666, 999, 332, 665, 998, 331, 664, 997]
descending_carry_orbit = orbit(-STEP, THRESHOLD, CEILING)
assert descending_carry_orbit[:10] == [999, 666, 333, 0, 667, 334, 1, 668, 335, 2]

# The missing one is an exact drift. The sign depends only on which way the
# bounce is traversed: three +333 moves shift by -1; three -333 moves by +1.
for value in range(THRESHOLD):
    thrice = translate(translate(translate(value)))
    reverse_thrice = inverse_translate(inverse_translate(inverse_translate(value)))
    assert thrice == (value - 1) % THRESHOLD
    assert reverse_thrice == (value + 1) % THRESHOLD
    assert reflect(reflect(value)) == value
    assert reflect(translate(reflect(value))) == inverse_translate(value)

# Thus T and R generate a dihedral action, but all maps are permutations.
assert gcd(STEP, THRESHOLD) == 1
assert 3 * STEP == CEILING
assert THRESHOLD - 3 * STEP == 1

# Centered 999 geometry.
center = Fraction(CEILING, 2)
normalized_stations = {
    "999": {"x": Fraction(1, 1), "eta": Fraction(1, 2)},
    "666": {"x": Fraction(2, 3), "eta": Fraction(1, 6)},
    "333": {"x": Fraction(1, 3), "eta": Fraction(-1, 6)},
    "0": {"x": Fraction(0, 1), "eta": Fraction(-1, 2)},
}
assert normalized_stations["666"]["eta"] == -normalized_stations["333"]["eta"]


def contract_toward_center(value: Fraction) -> Fraction:
    return center + (value - center) / 3


def complement_999(value: Fraction) -> Fraction:
    return Fraction(CEILING, 1) - value


def bounce_contraction(value: Fraction) -> Fraction:
    return complement_999(contract_toward_center(value))


# The first route 999 -> 666 -> 333 admits a contraction-plus-reflection reading.
assert contract_toward_center(Fraction(999)) == 666
assert bounce_contraction(Fraction(999)) == 333

# But iteration immediately leaves the named three-station set.
assert contract_toward_center(Fraction(333)) == 444
assert bounce_contraction(Fraction(333)) == 555
contraction_orbit = [Fraction(999)]
for _ in range(10):
    contraction_orbit.append(bounce_contraction(contraction_orbit[-1]))
for index, value in enumerate(contraction_orbit):
    expected_eta = Fraction(1, 2) * Fraction(-1, 3) ** index
    assert (value / CEILING) - Fraction(1, 2) == expected_eta

# Numerical completed-xi diagnostics. These are not used for the exact group
# claims; they test proposed functional/spectral promotions of those claims.
BERNOULLI_OVER_FACTORIAL = [
    1 / 12,
    -1 / 720,
    1 / 30240,
    -1 / 1209600,
    1 / 47900160,
    -691 / 1307674368000,
    1 / 74724249600,
    -3617 / 10670622842880000,
]

LANCZOS = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
]


def complex_gamma(z: complex) -> complex:
    if z.real < 0.5:
        return math.pi / (cmath.sin(math.pi * z) * complex_gamma(1 - z))
    shifted = z - 1
    series = complex(LANCZOS[0], 0)
    for index, coefficient in enumerate(LANCZOS[1:], start=1):
        series += coefficient / (shifted + index)
    t = shifted + 7.5
    return cmath.sqrt(2 * math.pi) * t ** (shifted + 0.5) * cmath.exp(-t) * series


def complex_zeta(s: complex, cutoff: int = 80) -> complex:
    total = sum(cmath.exp(-s * math.log(n)) for n in range(1, cutoff))
    total += cmath.exp((1 - s) * math.log(cutoff)) / (s - 1)
    total += 0.5 * cmath.exp(-s * math.log(cutoff))
    rising = complex(1, 0)
    for k, coefficient in enumerate(BERNOULLI_OVER_FACTORIAL, start=1):
        if k == 1:
            rising = s
        else:
            rising *= (s + (2 * k - 3)) * (s + (2 * k - 2))
        total += coefficient * rising * cmath.exp((-s - 2 * k + 1) * math.log(cutoff))
    return total


def xi(s: complex) -> complex:
    return (
        0.5
        * s
        * (s - 1)
        * cmath.exp((-s / 2) * math.log(math.pi))
        * complex_gamma(s / 2)
        * complex_zeta(s)
    )


def encode_complex(value: complex) -> dict[str, float]:
    return {"real": value.real, "imaginary": value.imag, "absolute": abs(value)}


def horizontal_contraction(s: complex, factor: float = 1 / 3) -> complex:
    return complex(0.5 - factor * (s.real - 0.5), s.imag)


first_zero = complex(0.5, FIRST_ZERO_ORDINATE)
xi_first_zero = xi(first_zero)
assert abs(xi_first_zero) < 2e-16

# A literal third-step translation fails even at the first zero.
quotient_translated_zero = complex(0.5 + STEP / CEILING, FIRST_ZERO_ORDINATE)
carry_translated_zero = complex(0.5 + STEP / THRESHOLD, FIRST_ZERO_ORDINATE)
xi_quotient_translation = xi(quotient_translated_zero)
xi_carry_translation = xi(carry_translated_zero)
assert abs(xi_quotient_translation) > 1e-4
assert abs(xi_carry_translation) > 1e-4

# The known xi reflection is recovered numerically.
functional_samples = [complex(0.2, 3), complex(0.6, 4), complex(1.3, 2)]
functional_errors = [abs(xi(s) - xi(1 - s)) for s in functional_samples]
assert max(functional_errors) < 2e-12

# The proposed horizontal contraction is not a functional identity of xi.
# It fixes critical-line zeros, so zero-set invariance cannot be tested from
# known on-line zeros: that invariance is itself RH-equivalent.
contraction_samples = [complex(0.2, 3), complex(0.8, 3), complex(0.6, 4)]
contraction_diagnostics = []
for sample in contraction_samples:
    image = horizontal_contraction(sample)
    source_xi = xi(sample)
    image_xi = xi(image)
    difference = abs(source_xi - image_xi)
    assert difference > 1e-4
    contraction_diagnostics.append(
        {
            "source": encode_complex(sample),
            "image": encode_complex(image),
            "xiSource": encode_complex(source_xi),
            "xiImage": encode_complex(image_xi),
            "absoluteDifference": difference,
        }
    )


def fraction_string(value: Fraction) -> str:
    return str(value.numerator) if value.denominator == 1 else f"{value.numerator}/{value.denominator}"


results = {
    "analysisDate": "2026-10-14",
    "title": "The 999-666-333 bounce, missing-one carry and xi contraction test",
    "verdict": {
        "rhProved": False,
        "quotient999BouncePeriodic": True,
        "carryAwareBouncePeriodic": True,
        "missingOneProducesContraction": False,
        "xiContractionSymmetryDerived": False,
        "contractionZeroSymmetryRhEquivalent": True,
        "conclusion": (
            "the exact 999 quotient is a D3 three-cycle, while the actual 1000 carry lifts it to a "
            "1000-state dihedral permutation with T^3 equal to a one-step backward drift; neither is "
            "contractive. The affine factor-one-third contraction is a separate interpolation that leaves "
            "the named stations after one bounce and whose zero-set invariance would already be equivalent to RH"
        ),
    },
    "normalizedThirdDensity": {
        label: {key: fraction_string(value) for key, value in values.items()}
        for label, values in normalized_stations.items()
    },
    "quotient999Model": {
        "modulus": CEILING,
        "step": STEP,
        "orbit": quotient_orbit,
        "translationOrder": additive_order(STEP, CEILING),
        "reflection": "R(n)=999-n; on the quotient it fixes the seam and exchanges 333 with 666",
        "group": "D3",
        "status": "exact periodic reflection/rotation model; no contraction",
    },
    "carryAware1000Model": {
        "modulus": THRESHOLD,
        "step": STEP,
        "gcd": gcd(STEP, THRESHOLD),
        "translationOrder": additive_order(STEP, THRESHOLD),
        "firstOrbitStates": carry_orbit[:16],
        "firstDescendingOrbitStates": descending_carry_orbit[:16],
        "visitsEveryState": len(carry_orbit) == THRESHOLD,
        "exactCarryIdentity": "for T_+(n)=n+333, T_+^3(n)=n-1 mod 1000",
        "reverseCarryIdentity": "for T_-(n)=n-333, T_-^3(n)=n+1 mod 1000; this is the 999->666->333 direction",
        "reflectionIdentity": "R^2=1 and R T R=T^(-1)",
        "group": "D_1000 (order 2000)",
        "spectralConsequence": "the bounce operators are finite permutations with root-of-unity eigenvalues of modulus one, so they preserve rather than contract channel norm",
    },
    "missingOne": {
        "identity": "1000-3*333=1",
        "role": "a one-step drift/cocycle after every three translations, not a contraction",
        "arithmeticEffect": "the apparent order-three orbit modulo 999 becomes one orbit through all 1000 states when the carry is retained",
    },
    "affineContractionCandidate": {
        "center": fraction_string(center),
        "contraction": "C(n)=999/2+(n-999/2)/3",
        "reflection": "R(n)=999-n",
        "combinedBounce": "B(n)=R(C(n))=666-n/3; in centered normalized coordinates eta -> -eta/3",
        "firstRoute": [999, 666, 333],
        "nextRoute": [333, 444, 555],
        "leavesNamedStationSet": True,
        "iterates": [fraction_string(value) for value in contraction_orbit],
        "status": "mathematically valid strict contraction, but not generated by the exact periodic bounce rule",
    },
    "completedXiDiagnostics": {
        "method": "standard-library Euler-Maclaurin zeta and Lanczos gamma evaluation",
        "firstZeroInput": encode_complex(first_zero),
        "xiAtFirstZero": encode_complex(xi_first_zero),
        "quotientTranslationImage": encode_complex(quotient_translated_zero),
        "xiAtQuotientTranslationImage": encode_complex(xi_quotient_translation),
        "carryTranslationImage": encode_complex(carry_translated_zero),
        "xiAtCarryTranslationImage": encode_complex(xi_carry_translation),
        "maximumFunctionalEquationError": max(functional_errors),
        "contractionSamples": contraction_diagnostics,
        "interpretation": (
            "the cyclic translations are not symmetries of the xi zero spectrum, and the horizontal contraction "
            "is not a functional identity of xi. It fixes known critical-line zeros, so requiring it to preserve "
            "the complete zero set is an RH-equivalent new hypothesis rather than an independently observed symmetry"
        ),
    },
    "bounceContractionLemma": {
        "map": "B_a(eta+i gamma)=-a eta+i gamma for any fixed 0<a<1",
        "statement": (
            "if every non-trivial xi zero is mapped to another xi zero by B_a, then all eta vanish: otherwise "
            "the iterates are distinct zeros converging to the finite point i gamma, contradicting isolation of zeros of a nonzero entire function"
        ),
        "converse": "under RH every zero has eta=0 and is fixed by B_a",
        "status": "zero-set invariance under any strict horizontal contraction is equivalent to RH",
    },
    "primeSideAssessment": {
        "translationFailure": "shifting the real part rescales each Euler factor by a prime-dependent p^(-c), so it is not induced by M=mu* or its inverse Z",
        "supportFailure": "the finite decimal orbit has root-of-unity frequencies, not the log(p^k) event support of the completed explicit formula",
        "requiredTheorem": (
            "derive from the completed von Mangoldt ledger, without assuming RH, that its zero image is invariant "
            "under one strict horizontal contraction; this would immediately prove RH by the bounce-contraction lemma"
        ),
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Third-density bounce investigation complete.")
print(f"  Modulo 999 translation order: {results['quotient999Model']['translationOrder']}")
print(f"  Carry-aware modulo 1000 order: {results['carryAware1000Model']['translationOrder']}")
print(f"  First translated-zero xi magnitude: {abs(xi_quotient_translation):.16g}")
print(f"  Maximum xi functional-equation check error: {max(functional_errors):.3g}")
print("  Verdict: missing-one carry creates periodic drift, not an independently derived xi contraction.")
