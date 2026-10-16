#!/usr/bin/env python3
"""Thirty-fourth-stage audit of the reverse prime-phase inequality.

The preceding stage proved

    I_C^crit - C'/C(2) = sum_off-line-quartets d(eta, gamma) >= 0.

This program does not attempt to infer the opposite sign numerically.  It
records the canonical-factorisation and Nyman--Beurling comparison, applies a
strict circularity test to the candidate closure routes, and computes a
rigorous finite-verification/tail-count upper bound for the positive defect.
"""

from __future__ import annotations

import json
from decimal import Decimal, getcontext
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-reverse-prime-phase-inequality-results.json"

getcontext().prec = 60
D = Decimal
PI = D("3.14159265358979323846264338327950288419716939937510582097494")
E = D(1).exp()

# Platt--Trudgian, Theorem 1: every positive-height nontrivial zero through
# this exact endpoint is on the critical line.
VERIFIED_HEIGHT = D(3_000_175_332_800)
VERIFIED_ZERO_COUNT = 12_363_153_437_138

# Bellotti--Wong, arXiv:2412.15470v2, Theorem 1.1 (upper half):
# N(T) <= T/(2*pi) log(T/(2*pi*e))
#         + A log T + B log log T + C, T >= e.
# We replace B log log T by B log T in the integrated tail.  This is weaker
# but valid for T >= e and keeps the antiderivative elementary.
ZERO_COUNT_A = D("0.10076")
ZERO_COUNT_B = D("0.24460")
ZERO_COUNT_C = D("8.08344")


def quartet_defect(eta: Decimal, gamma: Decimal) -> Decimal:
    """Exact Stage-33 d_(eta,gamma) at the a=3/2 anchor."""
    eta2 = eta * eta
    gamma2 = gamma * gamma
    return (
        D(6)
        * eta2
        * (eta2 + D(3) * gamma2 - D(9) / D(4))
        / (
            (gamma2 + D(9) / D(4))
            * (
                (gamma2 - eta2 + D(9) / D(4)) ** 2
                + D(4) * eta2 * gamma2
            )
        )
    )


def bsy_quartet_mass(eta: Decimal, gamma: Decimal) -> Decimal:
    """BSY sum from the two right-half-plane members of one quartet."""
    gamma2 = gamma * gamma
    numerator = gamma2 + (D("0.5") + eta) ** 2
    denominator = gamma2 + (D("0.5") - eta) ** 2
    return (numerator / denominator).ln()


def tail_moment_upper(power: int, height: Decimal = VERIFIED_HEIGHT) -> dict[str, Decimal]:
    """Upper bound sum_(gamma>H) gamma^(-power) from explicit N(T).

    Stieltjes integration gives

      sum gamma^-p <= p integral_H^infinity N(T) T^(-p-1) dT.

    The negative endpoint term is discarded.  Bellotti--Wong bounds N(T),
    and log log T <= log T for T >= e.
    """
    p = D(power)
    q = p - D(1)
    main = (
        p
        * height ** (1 - power)
        / (D(2) * PI * q)
        * ((height / (D(2) * PI * E)).ln() + D(1) / q)
    )
    error = (
        (ZERO_COUNT_A + ZERO_COUNT_B)
        * height ** (-power)
        * (height.ln() + D(1) / p)
        + ZERO_COUNT_C * height ** (-power)
    )
    return {"main": main, "error": error, "upper": main + error}


# For |eta|<1/2 and gamma>0,
#
# d_(eta,gamma)
# <= [3/8 + (9/2) gamma^2]/gamma^6
# = (9/2) gamma^-4 + (3/8) gamma^-6.
#
# This follows by bounding eta^2 <= 1/4 and the two denominator factors by
# gamma^2 and gamma^4 respectively.
tail4 = tail_moment_upper(4)
tail6 = tail_moment_upper(6)
defect_upper = D("4.5") * tail4["upper"] + D("0.375") * tail6["upper"]
assert defect_upper < D("9.274e-37")

# Synthetic rows show why a tiny positive upper bound cannot be rounded to
# zero: canonical inner defects have no positive metric gap.
collapse_rows = []
for eta_text, gamma_text in [
    ("0.1", "14.134725141734693"),
    ("0.001", "14.134725141734693"),
    ("0.1", "1000"),
    ("0.001", "1000000"),
]:
    eta = D(eta_text)
    gamma = D(gamma_text)
    defect = quartet_defect(eta, gamma)
    bsy = bsy_quartet_mass(eta, gamma)
    assert defect > 0
    assert bsy > 0
    collapse_rows.append(
        {
            "eta": eta,
            "gamma": gamma,
            "stage33Defect": defect,
            "bsyQuartetMass": bsy,
            "defectToBsyMassSquared": defect / (bsy * bsy),
        }
    )

candidate_routes = [
    {
        "route": "Hardy/Nevanlinna canonical factorisation",
        "establishedContent": (
            "For f(z)=C(1/(1-z)) the singular inner measure vanishes and "
            "f factors into its Blaschke zero factor and an outer factor."
        ),
        "whatItControls": "the boundary data determine the outer factor; the right-half-plane zeros form the inner factor",
        "reverseSignStatus": "not supplied",
        "circularityTest": (
            "declaring f outer, cyclic, or zero-inner is exactly the assertion that the Blaschke factor is one"
        ),
        "classification": "RH-equivalent detector",
    },
    {
        "route": "Balazard--Saias--Yor logarithmic integral",
        "establishedContent": (
            "(1/(2pi)) integral_(Re s=1/2) log|zeta(s)|/|s|^2 |ds| "
            "= sum_(Re rho>1/2) log|rho/(1-rho)| >= 0"
        ),
        "whatItControls": "a positive Green/Blaschke mass of every forbidden zero",
        "reverseSignStatus": "the inequality <=0 is equivalent to RH",
        "circularityTest": "assuming the integral vanishes assumes that the same inner zero divisor is absent",
        "classification": "exact parallel equivalence",
    },
    {
        "route": "Nyman--Beurling/Burnol Hardy projection",
        "establishedContent": (
            "the Mellin image of the Nyman space is the Blaschke product times H^2, "
            "and the squared target distance is 1-|B(1)|^2"
        ),
        "whatItControls": "the complete off-line-zero inner factor, with no cancellation",
        "reverseSignStatus": "distance zero/cyclicity is equivalent to RH",
        "circularityTest": "density, cyclicity, or d_N tending to zero is the Nyman--Beurling criterion itself",
        "classification": "exact parallel equivalence",
    },
    {
        "route": "Báez--Duarte discrete approximants",
        "establishedContent": "integer dilations suffice in the Nyman--Beurling criterion",
        "whatItControls": "finite Gram distances converging to the Nyman closure distance",
        "reverseSignStatus": "the required convergence remains RH-equivalent",
        "circularityTest": "Gram positivity is automatic; convergence to zero imports Möbius cancellation at the critical scale",
        "classification": "equivalent approximation target",
    },
    {
        "route": "de Branges--Sonine completeness and spectral synthesis",
        "establishedContent": "unconditional complete/minimal zero systems and biorthogonal structures exist",
        "whatItControls": "representation and completeness of the actual zero system",
        "reverseSignStatus": "no zero-location sign follows",
        "circularityTest": "the missing positive reflection metric or Hermite--Biehler property would encode RH",
        "classification": "no independent sign theorem found",
    },
    {
        "route": "Nevanlinna negative squares or an integer index",
        "establishedContent": "an off-line zero can be represented by a quantised negative-index obstruction",
        "whatItControls": "detection without a collapsing metric amplitude",
        "reverseSignStatus": "no arithmetic computation proving index zero was found",
        "circularityTest": "computing the index from the analytic factor is only the argument-principle zero count",
        "classification": "promising detector, missing exclusion engine",
    },
    {
        "route": "conductor-operator/commutator formulae",
        "establishedContent": "local explicit-formula and bounded commutator structures retain phase information",
        "whatItControls": "local completed terms, not a global zeta-sensitive vanishing index",
        "reverseSignStatus": "no global Fredholm or trace sign implying the reverse inequality was found",
        "circularityTest": "a proposed index must be computed arithmetically without first locating the zeros",
        "classification": "research proposal, not an established implication",
    },
    {
        "route": "critical Chebyshev energy or subexponential Laguerre growth",
        "establishedContent": "either condition would continue the relevant Mellin transform to Re s>1/2",
        "whatItControls": "zero-freeness of the whole right critical half-plane",
        "reverseSignStatus": "sufficient but not established",
        "circularityTest": "both all-scale bounds are already RH-equivalent in the programme audit",
        "classification": "rejected circular input",
    },
]

results = {
    "analysisDate": "2026-10-15",
    "title": "Search for the reverse critical prime-phase inequality",
    "target": "I_C^crit <= C'/C(2)",
    "baseline": "I_C^crit-C'/C(2)=D_2=sum_off-line_quartets d_(eta,gamma)>=0",
    "verdict": {
        "rhProved": False,
        "reverseInequalityProved": False,
        "independentEstablishedImplicationFound": False,
        "onlyEquivalentFactorisationsRecovered": True,
        "rigorousNearEqualityProvedFromLiterature": True,
        "conclusion": (
            "No independent proof of the reverse inequality was found. Hardy factorisation, "
            "Balazard--Saias--Yor and Nyman--Beurling/Burnol all isolate the same forbidden-zero "
            "Blaschke factor. Their desired vanishing, outerness, density or cyclicity statements "
            "are RH-equivalent, not established arithmetic upper bounds for the Stage-33 defect."
        ),
    },
    "canonicalFactorisation": {
        "diskMap": "s=1/(1-z), mapping |z|<1 to Re(s)>1/2",
        "function": "f(z)=C(s(z))=(s(z)-1)zeta(s(z))",
        "singularInnerFactor": "absent (Balazard--Saias--Yor)",
        "factorisation": "f=B*O, where B is the Blaschke product of zeros with Re(rho)>1/2",
        "bsyMass": (
            "S_BSY=sum_(Re rho>1/2) log|rho/(1-rho)|=-log|B(1)|>=0"
        ),
        "nymanDistance": "dist(1,NB)^2=1-|B(1)|^2=1-exp(-2S_BSY)",
        "stage33Relation": (
            "D_2 is a different positive kernel applied to the same off-line divisor; "
            "D_2=0 iff S_BSY=0 iff B=1 iff the Nyman distance is zero iff RH"
        ),
        "logicalBarrier": (
            "canonical factorisation proves the plus sign and identifies the defect; "
            "it cannot prove B=1 from boundary or outer-factor data alone"
        ),
    },
    "candidateRoutes": candidate_routes,
    "verifiedTailBound": {
        "status": "rigorous consequence of two established cited inputs",
        "plattTrudgianHeight": VERIFIED_HEIGHT,
        "plattTrudgianZerosVerified": VERIFIED_ZERO_COUNT,
        "bellottiWongBound": (
            "N(T)<=T/(2pi)log(T/(2pi e))+0.10076log T+0.24460loglog T+8.08344 for T>=e"
        ),
        "quartetPointwiseBound": "d_(eta,gamma)<=(9/2)gamma^-4+(3/8)gamma^-6",
        "tailMoment4": tail4,
        "tailMoment6": tail6,
        "defectUpper": defect_upper,
        "roundedCertifiedUpper": D("9.274e-37"),
        "nearReverseInequality": (
            "0<=I_C^crit-C'/C(2)<9.274e-37"
        ),
        "exactCertificate": {
            "script": "scripts/certify-rss-prime-phase-defect.py",
            "results": "docs/rh/rss-prime-phase-defect-certificate.json",
            "arithmetic": "exact rational intervals; no floating-point proof comparisons",
            "strictComparison": "defect upper < 9274/10^40",
        },
        "doesNotImplyRh": (
            "a forbidden zero can be arbitrarily close to the critical line or sufficiently high, "
            "so the positive defect has no known uniform positive gap"
        ),
    },
    "collapsingMargin": {
        "rows": collapse_rows,
        "highZeroAsymptotic": (
            "for fixed eta and large gamma, the BSY quartet mass is asymptotic to "
            "2eta/gamma^2 and d_(eta,gamma) is asymptotic to 18eta^2/gamma^4, "
            "so d is asymptotic to (9/2) times the square of the BSY mass"
        ),
        "consequence": (
            "finite verification and tail estimates can make D_2 extremely small but cannot round it to zero"
        ),
    },
    "evidenceAudit": {
        "primaryEstablished": [
            {
                "source": "Balazard--Saias--Yor, Notes sur la fonction zeta de Riemann, 2, Advances in Mathematics 143 (1999), 284-287",
                "use": "exact Hardy/Jensen identity and absence of a singular inner contribution",
            },
            {
                "source": "Burnol, A note on Nyman's equivalent formulation of the Riemann Hypothesis, Contemp. Math. 287 (2001), 23-26, arXiv:math/9910055v3",
                "use": "Nyman projection expressed by the forbidden-zero Blaschke product",
            },
            {
                "source": "Burnol, A lower bound in an approximation problem involving the zeros of the Riemann zeta function, Advances in Mathematics 170 (2002), 56-70",
                "use": "exact zero-evaluation obstruction and approximation lower bounds",
            },
            {
                "source": "Baez-Duarte, A strengthening of the Nyman-Beurling criterion for the Riemann Hypothesis, arXiv:math/0202141v2",
                "use": "integer-dilation closure criterion",
            },
            {
                "source": "Platt--Trudgian, The Riemann hypothesis is true up to 3*10^12, Bull. Lond. Math. Soc. 53 (2021), 792-797",
                "use": "all zeros through the exact height 3000175332800 are on the critical line",
            },
            {
                "source": "Bellotti--Wong, Improved estimates for the argument and zero-counting function of the Riemann zeta-function, arXiv:2412.15470v2, Theorem 1.1",
                "use": "explicit upper bound for the zero-counting tail",
            },
        ],
        "secondaryDiagnosticOnly": [
            "GitHub route audits were used to locate literature and compare normalisations, not as proof authorities",
            "the post-equivalence portfolio's negative-square and commutator proposals are research suggestions, not theorems implying RH",
        ],
        "excludedSpeculativeClaims": [
            "an unvalidated GitHub catalogue entry claiming a 2026 zero-free half-plane Re(s)>7/8",
            "self-published Balazard--Saias--Yor comparisons with inferred definitions or unsupported closure claims",
        ],
        "excludedClaimReason": (
            "neither was verified as a correct primary proof; moreover a zero-free region Re(s)>7/8 "
            "would not exclude zeros in 1/2<Re(s)<=7/8 and therefore would not imply the target inequality"
        ),
    },
    "minimalOpenInput": (
        "supply genuinely arithmetic information proving that the right-half-plane Blaschke factor B is trivial; "
        "renaming this as outerness, cyclicity, zero Nyman distance, zero BSY mass, zero negative index, "
        "critical Chebyshev energy or defect-free phase continuation does not establish it"
    ),
    "status": (
        "search closed with no reverse inequality; only equivalent inner-factor formulations and the rigorous "
        "near equality 0<=I_C^crit-C'/C(2)<9.274e-37 were obtained; RH remains open"
    ),
}


def encode_decimal(value):
    if isinstance(value, Decimal):
        return str(value)
    raise TypeError(f"cannot encode {type(value)!r}")


OUTPUT.write_text(json.dumps(results, indent=2, default=encode_decimal) + "\n")

print("Reverse prime-phase inequality audit complete.")
print("  No independent reverse inequality was found.")
print("  Hardy/BSY/Nyman formulations recover the same Blaschke obstruction.")
print(f"  Certified literature tail bound: 0 <= D_2 < {D('9.274e-37')}.")
print("  A tiny positive bound is not vanishing; RH remains open.")
