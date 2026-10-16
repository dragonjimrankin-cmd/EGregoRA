#!/usr/bin/env python3
"""Twenty-eighth-stage attempt to derive RH contraction from the decimal splice.

The decimal phase alpha=pi/10 suggests an exact golden mixer of the identity
and critical-line reflection. This program derives its contraction coefficient,
tests the nonlinear seam and central-residue consequences, distinguishes a
contracted barycentre from contracted zero support, and computes a finite
period-20 von Mangoldt diagnostic. It does not assume that a weighted average
of two zeros is another zero of xi.
"""

from __future__ import annotations

import cmath
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-decimal-splice-contraction-results.json"

phi = (1 + math.sqrt(5)) / 2
alpha = math.pi / 10
reflection_weight = math.cos(2 * alpha)  # cos(pi/5)=phi/2
return_weight = 1 - reflection_weight
golden_contraction = 2 * reflection_weight - 1  # phi-1=1/phi

assert abs(reflection_weight - phi / 2) < 1e-15
assert abs(golden_contraction - 1 / phi) < 1e-15
assert 0 < golden_contraction < 1


def seam_defect(eta: float) -> float:
    return -2 * math.log(math.cos(math.pi * eta))


def central_residue(eta: float, gamma: float) -> float:
    return 4 * eta * eta * (eta * eta + 3 * gamma * gamma) / (
        gamma * gamma * (eta * eta + gamma * gamma) ** 2
    )


seam_rows = []
for eta in [1e-6, 0.01, 0.1, 0.25, 0.4, 0.49]:
    before = seam_defect(eta)
    after = seam_defect(golden_contraction * eta)
    seam_rows.append({
        "eta": eta,
        "oneDescendantRatio": after / before,
        "twoDescendantRatio": 2 * after / before,
        "threeDescendantRatio": 3 * after / before,
    })

# -log(cos x) has a power series with positive even coefficients. Therefore
# epsilon(c eta) < c^2 epsilon(eta), and b descendants contract uniformly if
# b*c^2 <= 1 (strictly for eta != 0 and c < 1).
seam_quadratic_bound = golden_contraction**2
assert 2 * seam_quadratic_bound < 1
assert 3 * seam_quadratic_bound > 1
assert all(row["twoDescendantRatio"] < 1 for row in seam_rows)

first_zero = 14.134725141734693
central_rows = []
for gamma in [first_zero, 50.0, 1000.0]:
    for eta in [0.1, 0.25, 0.49]:
        before = central_residue(eta, gamma)
        after = central_residue(golden_contraction * eta, gamma)
        central_rows.append({
            "eta": eta,
            "gamma": gamma,
            "oneDescendantRatio": after / before,
            "twoDescendantRatio": 2 * after / before,
        })
assert all(row["twoDescendantRatio"] < 1 for row in central_rows)

# For x=eta^2/gamma^2, q=c^2 and the displayed exact ratio A(x),
# (qx+3)/(x+3) <= 1 gives A(x) <= q((1+x)/(1+qx))^2
# <= q(1+x)^2. In the critical strip above the first zero ordinate,
# x < 1/(4 gamma_1^2), so even two descendants contract uniformly.
central_x_max = 1 / (4 * first_zero**2)
central_two_descendant_upper_bound = (
    2 * seam_quadratic_bound * (1 + central_x_max) ** 2
)
assert central_two_descendant_upper_bound < 1

# A reflection-symmetric quartet can be represented by this even real quartic.
# Contracting eta changes its coefficients unless eta=0 or c^2=1, so the root
# contraction is not an invariance of the same polynomial.
def quartet_coefficients(eta: float, gamma: float) -> dict[str, float]:
    return {
        "z4": 1.0,
        "z2": 2 * (gamma * gamma - eta * eta),
        "z0": (eta * eta + gamma * gamma) ** 2,
    }


stress_eta = 0.25
stress_gamma = first_zero
stress_before = quartet_coefficients(stress_eta, stress_gamma)
stress_after = quartet_coefficients(golden_contraction * stress_eta, stress_gamma)
quartic_differences = {
    key: stress_after[key] - stress_before[key] for key in stress_before
}
assert abs(quartic_differences["z2"]) > 0
assert abs(quartic_differences["z0"]) > 0

# Finite period-20 prime diagnostic. The decimal additive phase has zero mean
# on reduced residue classes modulo 20, but it is a nonprincipal Fourier mode.
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
psi = 0.0
phase_sum = 0j
untwisted_energy = {x: 0.0 for x in x_values}
decimal_energy = {x: 0.0 for x in x_values}
for n in range(1, limit):
    psi += lambdas[n]
    if lambdas[n]:
        phase_sum += lambdas[n] * cmath.exp(1j * math.pi * n / 10)
    for x in x_values:
        if x <= n < 2 * x:
            untwisted_energy[x] += ((n + 1 - psi) ** 3 - (n - psi) ** 3) / 3
            decimal_energy[x] += abs(phase_sum) ** 2

finite_rows = []
for x in x_values:
    finite_rows.append({
        "X": x,
        "untwistedNormalizedEnergy": untwisted_energy[x] / (x * x),
        "decimalAdditiveNormalizedEnergy": decimal_energy[x] / (x * x),
        "scope": "finite diagnostic only",
    })

units_mod_20 = [r for r in range(20) if math.gcd(r, 20) == 1]
reduced_residue_phase_sum = sum(cmath.exp(2j * math.pi * r / 20) for r in units_mod_20)
assert abs(reduced_residue_phase_sum) < 1e-14
all_class_mode_one = sum(cmath.exp(2j * math.pi * r / 20) for r in range(20))
all_class_principal = 20
assert abs(all_class_mode_one) < 1e-14 and all_class_principal == 20

results = {
    "analysisDate": "2026-10-15",
    "title": "Trying to derive an RH contraction from the decimal splice",
    "question": "does the decimal pi-over-ten phase derive eta -> c eta on the zero set of the same xi function?",
    "verdict": {
        "rhProved": False,
        "sameXiZeroInvarianceDerived": False,
        "untwistedCriticalEnergyProved": False,
        "exactGoldenContractionCoefficientDerived": True,
        "twoDescendantSeamDefectContracts": True,
        "conclusion": (
            "The decimal phase yields an exact golden barycentric contraction c=1/phi, and two hypothetical "
            "contracted descendants strictly reduce both the nonlinear seam defect and the central horizontal residue. "
            "But the contraction acts on a weighted coordinate or selected channel, not on the support of xi zeros. "
            "At function level the reflection average collapses to xi itself, horizontal-only contraction is "
            "nonholomorphic, and the period-20 prime twist is nonprincipal. The missing same-xi or untwisted-prime "
            "invariance is not derived."
        ),
    },
    "goldenDecimalMixer": {
        "decimalAngle": "alpha=pi/10",
        "reflectionWeight": reflection_weight,
        "reflectionWeightIdentity": "p=cos(pi/5)=phi/2",
        "returnWeight": return_weight,
        "map": "T_p(eta)=p eta+(1-p)(-eta)=(2p-1)eta",
        "contraction": golden_contraction,
        "contractionIdentity": "c=2cos(pi/5)-1=phi-1=1/phi",
        "iteration": "eta_n=phi^(-n) eta_0",
        "interpretation": (
            "this is an exact contraction of the barycentre or a declared output coordinate; the two input support points remain +eta and -eta"
        ),
    },
    "sameXiAudit": {
        "functionLevelReflectionAverage": (
            "M_p xi(s)=p xi(s)+(1-p)xi(1-s)=xi(s) by the functional equation; it does not equal xi at a contracted horizontal argument"
        ),
        "zeroBarycentreWarning": "a weighted average of two zero locations is not generally another zero",
        "horizontalMap": (
            "T_c(eta+i gamma)=c eta+i gamma=((1+c)/2)z+((c-1)/2)conjugate(z), so it is nonholomorphic when c is not 1"
        ),
        "holomorphicAlternative": (
            "z -> c z contracts the ordinate as well as the displacement and would create a forbidden finite accumulation if it preserved the known nonempty xi zero set under indefinite iteration"
        ),
        "quartetStressTest": {
            "eta": stress_eta,
            "gamma": stress_gamma,
            "beforeCoefficients": stress_before,
            "afterCoefficients": stress_after,
            "differences": quartic_differences,
            "conclusion": "contracting the quartet changes the entire function unless eta=0 or c^2=1",
        },
    },
    "seamDefectTest": {
        "defect": "epsilon(eta)=-2log(cos(pi eta))",
        "positiveSeriesBound": "epsilon(c eta)<c^2 epsilon(eta) for 0<c<1 and eta nonzero in the strip",
        "cSquared": seam_quadratic_bound,
        "twoDescendantUpperFactor": 2 * seam_quadratic_bound,
        "threeDescendantSmallEtaFactor": 3 * seam_quadratic_bound,
        "twoDescendantsContractUniformly": True,
        "threeDescendantsContractUniformly": False,
        "rows": seam_rows,
    },
    "centralResidueTest": {
        "residue": "r(eta,gamma)=4eta^2(eta^2+3gamma^2)/(gamma^2(eta^2+gamma^2)^2)",
        "ratioFormula": (
            "r(c eta,gamma)/r(eta,gamma)=c^2(c^2 x+3)(x+1)^2/((c^2 x+1)^2(x+3)), x=eta^2/gamma^2"
        ),
        "uniformCriticalStripBound": {
            "domain": "abs(eta)<1/2 and abs(gamma)>=14.134725141734693",
            "xUpperBound": central_x_max,
            "inequality": "2r(c eta,gamma)/r(eta,gamma) <= 2c^2(1+x)^2",
            "upperFactor": central_two_descendant_upper_bound,
            "twoDescendantsContract": True,
        },
        "twoDescendantsContractAtTestedCriticalStripScales": True,
        "rows": central_rows,
    },
    "branchAndProjectionAudit": {
        "equalHalfBarycentre": "(eta+(-eta))/2=0, but the branch support remains the two points +eta and -eta",
        "goldenWeightedBarycentre": "p=phi/2 and 1-p produce expectation eta/phi without moving either support point",
        "unitaryBoundary": "a lossless two-channel mixer preserves total norm and stores the missing horizontal information in the complementary output",
        "projectionBoundary": "discarding the complementary output is nonunitary postselection, not an invariance of the completed xi determinant",
    },
    "finitePrimeDiagnostic": {
        "phase": "exp(i pi n/10)=exp(2pi i n/20)",
        "period": 20,
        "reducedResiduePhaseSumReal": reduced_residue_phase_sum.real,
        "reducedResiduePhaseSumImag": reduced_residue_phase_sum.imag,
        "rows": finite_rows,
        "fourierCounterexample": {
            "input": "constant vector on all 20 residue classes",
            "modeOne": abs(all_class_mode_one),
            "principalMode": all_class_principal,
            "conclusion": "the decimal mode can vanish while the principal mode is nonzero",
        },
        "interpretation": (
            "the decimal additive twist cancels its own leading reduced-residue mean, but it is a nonprincipal residue-class channel and does not bound the untwisted Chebyshev error"
        ),
    },
    "conditionalTheorem": {
        "statement": (
            "If the completed decimal splice preserves the same xi zero ledger while sending every upper zero quartet to at most two descendants with displacement eta/phi, and if no zeros are born at infinity, repeated contraction forces RH."
        ),
        "newGain": (
            "the factor c=1/phi is derived from the decimal phase, and two descendants still contract the exact seam defect; c is no longer an arbitrary assumed constant"
        ),
        "missingPremises": [
            "prove that the barycentric mixer acts on zero support rather than only on an expectation or projected channel",
            "prove same-xi closure or a globally complete no-birth genealogy",
            "prove exact recovery of the untwisted principal von Mangoldt channel",
        ],
        "status": "conditional RH criterion sharpened; RH remains open",
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Decimal-splice RH contraction attempt complete.")
print(f"  Exact mixer: c=1/phi={golden_contraction:.12f}.")
print(f"  Two-branch seam bound: 2c^2={2*seam_quadratic_bound:.12f} < 1.")
print("  Same-xi zero support: not derived; barycentre is not a zero map.")
print("  Prime side: period-20 twist is nonprincipal.")
print("  Verdict: sharpened conditional criterion, no RH proof.")
