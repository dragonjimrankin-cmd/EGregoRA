#!/usr/bin/env python3
"""Thirty-second-stage search for a principal-prime conservation law.

The completed xi zero divisor is transported by
    T_t(eta, gamma) = (exp(-t) eta, gamma).
This program asks whether one absolutely convergent Euler-half-plane scalar is
already enough to detect the horizontal-residue dissipation.  It derives the
variation of xi_t'/xi_t at s=2 quartet by quartet, compares it quantitatively
with the central residue variation, and audits whether the fixed von Mangoldt
ledger independently conserves that scalar for the transported divisor.
"""

from __future__ import annotations

import cmath
import json
import math
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-principal-prime-anchor-results.json"

FIRST_ZERO = 14.134725141734693
EULER_GAMMA = 0.5772156649015329
W = 1.5  # s=2 in the centred coordinate w=s-1/2

# Euler-Maclaurin coefficients B_(2k)/(2k)!.
BERNOULLI_OVER_FACTORIAL = [
    1 / 12,
    -1 / 720,
    1 / 30240,
    -1 / 1209600,
    1 / 47900160,
    -691 / 1307674368000,
    7 / 523069747200,
    -3617 / 10670622842880000,
]


def complex_zeta(s: complex, cutoff: int = 120) -> complex:
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


def zeta_log_derivative_at_two() -> float:
    # For a positive real analytic value, Im log(zeta(2+ih))/h is a stable
    # complex-step estimate of zeta'(2)/zeta(2).
    h = 1e-5
    forward = cmath.log(complex_zeta(complex(2, h))).imag / h
    half_step = cmath.log(complex_zeta(complex(2, h / 2))).imag / (h / 2)
    # Cancel the O(h^2) error.
    return (4 * half_step - forward) / 3


def prime_power_partial(limit: int) -> tuple[float, int]:
    """Return sum_(n<=limit) Lambda(n)/n^2 by enumerating prime powers."""
    sieve = bytearray(b"\x01") * (limit + 1)
    sieve[:2] = b"\x00\x00"
    for p in range(2, math.isqrt(limit) + 1):
        if sieve[p]:
            start = p * p
            sieve[start : limit + 1 : p] = b"\x00" * (((limit - start) // p) + 1)
    total = 0.0
    terms = 0
    for p in range(2, limit + 1):
        if not sieve[p]:
            continue
        log_p = math.log(p)
        power = p
        while power <= limit:
            total += log_p / (power * power)
            terms += 1
            if power > limit // p:
                break
            power *= p
    return total, terms


def q_value(w: float, eta: float, gamma: float) -> float:
    e = eta * eta
    g = gamma * gamma
    return w**4 + 2 * (g - e) * w * w + (e + g) ** 2


def anchor_gap(eta: float, gamma: float, w: float = W) -> float:
    """H_ord(w)-H_q(w), positive in the certified anchor window."""
    e = eta * eta
    g = gamma * gamma
    denominator = (w * w + g) * ((w * w - e + g) ** 2 + 4 * e * g)
    return 4 * w * e * (e + 3 * g - w * w) / denominator


def anchor_time_derivative(eta: float, gamma: float, w: float = W) -> float:
    """d/dt [xi_t'/xi_t](1/2+w) for one transported quartet."""
    e = eta * eta
    g = gamma * gamma
    a = e + g
    polynomial = -(w**4) + 2 * a * w * w + a * (3 * g - e)
    return 8 * e * w * polynomial / q_value(w, eta, gamma) ** 2


def residue_dissipation_magnitude(eta: float, gamma: float) -> float:
    """-d r/dt for the central horizontal residue of one quartet."""
    e = eta * eta
    g = gamma * gamma
    return 8 * e * (3 * g - e) / (e + g) ** 3


# The certified first zero gives gamma^2>199.  Together with eta^2<1/4 and
# w^2=9/4 this puts x=e/g <=1/796 and u=w^2/g <=9/796.
assert FIRST_ZERO * FIRST_ZERO > 199
x_max = Fraction(1, 796)
u_max = Fraction(9, 796)
w_exact = Fraction(3, 2)

# In dimensionless variables,
#   P=-u^2+2(1+x)u+(1+x)(3-x),
#   D=u^2+2(1-x)u+(1+x)^2,
# and anchorVariation/residueDissipation = w P(1+x)^3/((3-x)D^2).
# Coarse rational interval bounds suffice and are deliberately wider than the
# sampled extrema.
p_lower = 3 - u_max * u_max
p_upper = 2 * (1 + x_max) * u_max + 3 * (1 + x_max)
d_upper = u_max * u_max + 2 * u_max + (1 + x_max) ** 2
ratio_lower = w_exact * p_lower / (3 * d_upper * d_upper)
ratio_upper = w_exact * p_upper * (1 + x_max) ** 3 / (3 - x_max)
assert ratio_lower > Fraction(142, 100)
assert ratio_upper < Fraction(153, 100)

rows = []
for gamma in [FIRST_ZERO, 50.0, 1000.0]:
    for eta in [0.1, 0.25, 0.49]:
        anchor_dot = anchor_time_derivative(eta, gamma)
        residue_loss = residue_dissipation_magnitude(eta, gamma)
        gap = anchor_gap(eta, gamma)
        assert anchor_dot > 0
        assert residue_loss > 0
        assert gap > 0
        ratio = anchor_dot / residue_loss
        assert float(ratio_lower) < ratio < float(ratio_upper)
        rows.append({
            "eta": eta,
            "gamma": gamma,
            "ordinateMinusExactAnchor": gap,
            "anchorTimeDerivative": anchor_dot,
            "residueDissipationMagnitude": residue_loss,
            "variationRatio": ratio,
        })

zeta_log_derivative = zeta_log_derivative_at_two()
completed_anchor = (
    1.5
    - 0.5 * (EULER_GAMMA + math.log(math.pi))
    + zeta_log_derivative
)
prime_partial, prime_terms = prime_power_partial(1_000_000)
completed_anchor_from_partial = (
    1.5
    - 0.5 * (EULER_GAMMA + math.log(math.pi))
    - prime_partial
)
assert zeta_log_derivative < 0
assert abs(completed_anchor - 0.06906623153) < 2e-11
assert abs(prime_partial + zeta_log_derivative) < 2e-6

results = {
    "analysisDate": "2026-10-15",
    "title": "Searching for a principal-prime anchor conserved by the xi support flow",
    "question": (
        "can an independent principal-prime or completed-logarithmic-derivative conservation law "
        "force the horizontal-residue variation to vanish?"
    ),
    "verdict": {
        "rhProved": False,
        "independentConservationLawProved": False,
        "onePointEulerCriterionDerived": True,
        "onePointCriterionEquivalentToRh": True,
        "quantitativeResidueBridgeDerived": True,
        "conclusion": (
            "The full half-plane target can be reduced to one absolutely convergent Euler anchor at s=2. "
            "For the transported completed divisor, d_t[xi_t'/xi_t(2)] is strictly positive for every "
            "off-line quartet and is termwise comparable to minus the horizontal-residue variation. Thus "
            "conservation of this one scalar would force RH and zero residue variation. The scalar has an "
            "exact principal-prime formula, but the transported divisor has no independently derived Euler "
            "product tying it to the same fixed von Mangoldt moment for t>0. The proposed conservation law "
            "therefore remains unproved; RH remains open."
        ),
    },
    "eulerAnchor": {
        "point": "s=2 (centred coordinate w=3/2)",
        "completedPrimeIdentity": (
            "xi'/xi(2)=3/2-(EulerGamma+log pi)/2-sum_(n>=2) Lambda(n)/n^2"
        ),
        "absoluteConvergence": True,
        "zetaLogDerivativeAtTwo": zeta_log_derivative,
        "completedAnchorNumerical": completed_anchor,
        "primePowerPartial": {
            "limit": 1_000_000,
            "terms": prime_terms,
            "sumLambdaOverNSquared": prime_partial,
            "completedAnchorFromPartial": completed_anchor_from_partial,
        },
        "ordinateAnchor": (
            "H_ord(3/2)=sum_(rho: Im rho>0) 3/(gamma_rho^2+9/4), counting multiplicity"
        ),
        "positiveDefect": (
            "H_ord(3/2)-xi'/xi(2)=sum_quartets "
            "6eta^2(eta^2+3gamma^2-9/4)/[(gamma^2+9/4)"
            "((gamma^2-eta^2+9/4)^2+4eta^2gamma^2)]"
        ),
        "defectConsequence": "the defect is nonnegative and vanishes exactly under RH",
    },
    "quartetAnchorVariation": {
        "quartet": (
            "Q=z^4+2(gamma^2-eta^2)z^2+(eta^2+gamma^2)^2"
        ),
        "logVariation": (
            "partial_t log Q=4eta^2[z^2-(eta^2+gamma^2)]/Q"
        ),
        "anchorDerivative": (
            "partial_t(Q'/Q)(w)=8eta^2 w[-w^4+2Aw^2+A(3gamma^2-eta^2)]/Q(w)^2, "
            "A=eta^2+gamma^2"
        ),
        "signAtTwo": (
            "strictly positive at w=3/2 for every off-line nontrivial quartet because "
            "eta^2<1/4 and gamma^2>199"
        ),
        "rows": rows,
    },
    "coerciveResidueComparison": {
        "residueLoss": (
            "-partial_t r=8eta^2(3gamma^2-eta^2)/(eta^2+gamma^2)^3"
        ),
        "ratioVariables": "x=eta^2/gamma^2, u=(9/4)/gamma^2",
        "exactRationalLowerBound": str(ratio_lower),
        "exactRationalUpperBound": str(ratio_upper),
        "decimalLowerBound": float(ratio_lower),
        "decimalUpperBound": float(ratio_upper),
        "statement": (
            "1.4269*(-partial_t R_hor) <= partial_t[xi_t'/xi_t(2)] "
            "<= 1.5196*(-partial_t R_hor), termwise and hence after summation"
        ),
        "consequence": (
            "zero variation of the s=2 completed logarithmic derivative is equivalent to zero "
            "horizontal-residue variation and to RH"
        ),
    },
    "onePointEquivalence": {
        "statement": (
            "RH iff partial_t[xi_t'/xi_t(2)] at t=0 is zero iff partial_t R_hor at t=0 is zero"
        ),
        "forward": "under RH every eta is zero, so both variations vanish",
        "reverse": (
            "each off-line quartet contributes strictly positively at s=2 and strictly negatively to R_hor"
        ),
        "gain": (
            "an open-half-plane conservation law is unnecessary; one absolutely convergent principal-prime "
            "moment would suffice"
        ),
    },
    "conservationAudit": [
        {
            "candidate": "static principal von Mangoldt moment at s=2",
            "result": (
                "sum Lambda(n)/n^2 is fixed, but xi_t'/xi_t(2) equals its completed value only at t=0; "
                "no Euler product for the transported divisor is derived"
            ),
        },
        {
            "candidate": "same Euler product for every t",
            "result": (
                "this would conserve the anchor, but Euler-product uniqueness would already make xi_t=xi; "
                "the premise is the stationarity theorem in arithmetic form"
            ),
        },
        {
            "candidate": "functional reflection",
            "result": (
                "the quartet contribution is even in eta, so reflected partners add rather than cancel"
            ),
        },
        {
            "candidate": "central normalization",
            "result": (
                "multiplying xi_t by a scalar does not change xi_t'/xi_t and cannot affect the anchor variation"
            ),
        },
        {
            "candidate": "arithmetic Mobius return",
            "result": (
                "Mobius inversion recovers Lambda from the all-integer ledger but supplies no t-evolution "
                "intertwining that ledger with the horizontally transported divisor"
            ),
        },
        {
            "candidate": "kappa natural-gradient geometry",
            "result": (
                "it derives dot eta=-eta but does not preserve the Euler anchor; off-line support makes the "
                "anchor strictly increase"
            ),
        },
    ],
    "missingTheorem": {
        "minimalForm": (
            "prove independently that the transported divisor obeys "
            "xi_t'/xi_t(2)=3/2-(EulerGamma+log pi)/2-sum Lambda(n)/n^2 for t near zero"
        ),
        "whyNotYetProved": (
            "the right side is the fixed principal ledger, whereas xi_t is an auxiliary canonical product "
            "with moved zeros; identifying them for t>0 is exactly the missing same-xi compatibility"
        ),
        "status": "the target is reduced from all-scale half-plane stationarity to one scalar, but not established",
    },
    "status": "no independent conservation law was proved; RH remains open",
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Principal-prime anchor search complete.")
print(f"  xi'/xi(2) from completion: {completed_anchor:.12f}")
print("  One s=2 conservation law would force zero horizontal-residue variation.")
print(
    "  Coercive ratio bounds: "
    f"{float(ratio_lower):.6f} < anchor variation / residue loss < {float(ratio_upper):.6f}."
)
print("  No Euler-product law for the transported divisor was derived; RH remains open.")
