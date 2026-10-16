#!/usr/bin/env python3
"""Twenty-fifth-stage application of critical energy and spin-colour audit.

This script records the conditional implications of the critical Chebyshev
energy theorem across the previous RH programme and tests two mathematically
distinct readings of spin/colour: internal degeneracy and spectral branching.
It does not assert a physical coupling, prove the energy estimate, or prove RH.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENERGY_INPUT = ROOT / "docs/rh/rss-critical-chebyshev-energy-results.json"
SEAM_INPUT = ROOT / "docs/rh/rss-two-ended-seam-ledger-results.json"
OUTPUT = ROOT / "docs/rh/rss-energy-spin-colour-results.json"

energy = json.loads(ENERGY_INPUT.read_text())
seam = json.loads(SEAM_INPUT.read_text())
assert energy["verdict"]["criticalEnergyEstimateProved"] is False
assert energy["verdict"]["missingTheoremFoundAsExactEquivalent"] is True
assert seam["verdict"]["rhProved"] is False


def seam_defect(eta: float) -> float:
    return -2 * math.log(math.cos(math.pi * eta))


def branching_balance(eta: float, descendants: int) -> float:
    """Positive means the parent defect exceeds descendant defect."""
    return seam_defect(eta) - descendants * seam_defect(eta / 2)


def threshold_for_branching(descendants: int) -> float | None:
    """Find the nonzero threshold where b half-displacement children contract."""
    if descendants <= 4:
        return None
    lo = 1e-8
    hi = 0.5 - 1e-10
    assert branching_balance(lo, descendants) < 0
    assert branching_balance(hi, descendants) > 0
    for _ in range(100):
        mid = (lo + hi) / 2
        if branching_balance(mid, descendants) > 0:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


eta_sample = 0.25
parent_defect = seam_defect(eta_sample)
half_defect = seam_defect(eta_sample / 2)
assert abs(parent_defect - math.log(2)) < 1e-14
assert 4 * half_defect < parent_defect
assert 6 * half_defect > parent_defect

branching_table = []
for descendants in [1, 2, 3, 4, 5, 6, 8, 12]:
    threshold = threshold_for_branching(descendants)
    if descendants <= 4:
        # Numerical diagnostics support the exact b<=4 inequality already
        # proved in the two-ended seam report.
        assert all(
            branching_balance((i + 1) * (0.5 - 1e-7) / 10000, descendants) > -1e-14
            for i in range(10000)
        )
    branching_table.append({
        "descendantCount": descendants,
        "uniformContractionForAllNonzeroStripDisplacements": descendants <= 4,
        "contractionThresholdEtaIfNotUniform": threshold,
        "balanceAtEtaOneQuarter": branching_balance(eta_sample, descendants),
        "contractsAtEtaOneQuarter": branching_balance(eta_sample, descendants) > 0,
    })

six_threshold = next(
    row["contractionThresholdEtaIfNotUniform"]
    for row in branching_table
    if row["descendantCount"] == 6
)
assert six_threshold is not None
assert abs(six_threshold - 0.4241411958556915) < 1e-12

# Direct-sum multiplicity scales coefficients, never their root-test radius.
coefficient_multiplicity = []
for dimension in [1, 2, 3, 6]:
    coefficient_multiplicity.append({
        "internalDimension": dimension,
        "coefficientMap": f"p_n -> {dimension} p_n",
        "nthRootMultiplicityFactor": f"{dimension}^(1/n) -> 1",
        "changesRadiusOfConvergence": False,
    })

results = {
    "analysisDate": "2026-10-15",
    "title": "Applying critical energy and testing spin-colour channels",
    "question": "how does the critical energy theorem close the earlier programme, and can spin or colour supply its missing estimate?",
    "verdict": {
        "rhProved": False,
        "criticalEnergyAppliedConditionally": True,
        "criticalEnergyEstimateProved": False,
        "spinColourClosesCriticalEnergy": False,
        "internalDegeneracyChangesCoefficientRadius": False,
        "sixDescendantSeamContractionUniform": False,
        "physicalSpinColourCouplingDerived": False,
        "conclusion": (
            "If the critical dyadic Chebyshev-energy estimate were proved, it would close the arithmetic controller, "
            "force RH, set every seam defect and horizontal residue to zero, and identify the ordinate and exact Weil "
            "channels. Spin and colour do not presently prove that estimate. As internal SU(2)xSU(3) degeneracy they "
            "leave the scalar singlet and coefficient radius unchanged; as six spectral descendants they exceed the "
            "four-branch seam-contraction theorem and can expand the defect at small displacement."
        ),
    },
    "conditionalApplicationMap": [
        {
            "previousObject": "weighted Chebyshev error",
            "energyConsequence": "I_epsilon is finite for every epsilon>0",
            "status": "direct equivalent form of the unproved critical energy estimate",
        },
        {
            "previousObject": "prime-Laguerre controller p_n",
            "energyConsequence": "p_n=exp(o(n)) by the Hilbert-valued Laguerre generating function",
            "status": "conditional closure",
        },
        {
            "previousObject": "generalized Li disk",
            "energyConsequence": "radius at least one and no mapped zeta zero inside the disk",
            "status": "conditional closure",
        },
        {
            "previousObject": "two-ended seam determinant",
            "energyConsequence": "eta=0 for every zero, so every Poisson product is one and the total defect is zero",
            "status": "conditional closure through RH",
        },
        {
            "previousObject": "central horizontal residue",
            "energyConsequence": "R_hor=0",
            "status": "conditional closure through RH",
        },
        {
            "previousObject": "ordinate projection and exact Weil kernel",
            "energyConsequence": "D_ord=G_g and the RH-equivalent positivity criterion holds",
            "status": "conditional closure through RH",
        },
        {
            "previousObject": "same-xi horizontal halving",
            "energyConsequence": "all zero displacements already vanish, so halving acts trivially on the zero set",
            "status": "consequence, not a derivation of splice dynamics",
        },
        {
            "previousObject": "finite theta completions and splice clocks",
            "energyConsequence": "no theorem for the zeros of each finite approximant and no clock law",
            "status": "not supplied by critical energy",
        },
        {
            "previousObject": "physical action, G, charge normalization and halo scale",
            "energyConsequence": "none",
            "status": "outside the arithmetic theorem",
        },
    ],
    "spinColourStateSpace": {
        "spinRepresentation": "V_spin=C^2, fundamental SU(2) doublet with two spin projections",
        "colourRepresentation": "V_colour=C^3, fundamental SU(3) triplet with three colours",
        "combinedRepresentation": "V=C^2 tensor C^3 has dimension 6",
        "operatorDecomposition": (
            "End(V)=(1,1) plus (3,1) plus (1,8) plus (3,8), with dimensions 1+3+8+24=36"
        ),
        "scalarVisibility": (
            "a normalized colour- and spin-blind trace sees only the (1,1) singlet; Pauli and colour generators are traceless"
        ),
        "existingTernaryRelation": (
            "the earlier Z_3 phase model can at most represent the center/triality shadow of SU(3); Z_3 alone does not derive "
            "the full eight-generator colour gauge symmetry"
        ),
        "existingQuaternaryRelation": (
            "the earlier four-state alternatives do not derive spin: SU(2) has a two-dimensional fundamental representation "
            "and center Z_2, while a four-state scalar model needs an independently specified tensor product or coupling"
        ),
    },
    "singletBottleneck": {
        "matrixError": "A(x)=E(x)I_d+A_0(x), Tr(A_0)=0",
        "hilbertSchmidtIdentity": "||A||_HS^2=d|E|^2+||A_0||_HS^2",
        "traceInequality": "|(1/d)Tr(A)|^2 <= (1/d)||A||_HS^2",
        "candidateMatrixTheorem": (
            "for every delta>0, integral_X^(2X)||Psi_matrix(x)-x I_6||_HS^2 dx "
            "is O_delta(X^(2+delta))"
        ),
        "consequence": "the matrix theorem implies the scalar critical energy theorem",
        "difficulty": (
            "it is stronger, not weaker: nonsinglet spin-colour channels add nonnegative energy and cannot cancel the scalar singlet norm"
        ),
    },
    "coefficientMultiplicity": coefficient_multiplicity,
    "spinPhaseAndSupertrace": {
        "unitaryPhase": "spin or colour phases disappear from absolute-square Hilbert energy",
        "orthogonalChannels": "energies add by Pythagoras rather than cancel",
        "supertrace": (
            "a signed boson-fermion supertrace could cancel amplitudes, but it is indefinite and does not provide the positive L2 norm "
            "needed for the Mellin Cauchy-Schwarz argument"
        ),
    },
    "seamMultiplicityAudit": {
        "defect": "epsilon(eta)=-2log(cos(pi eta))",
        "internalDegeneracyReading": (
            "if all d internal states remain attached to one spectral zero before and after halving, the common factor d cancels "
            "from the comparison and the defect contracts"
        ),
        "spectralDescendantReading": (
            "if one parent zero creates six distinct half-displacement zeros, compare epsilon(eta) with 6epsilon(eta/2)"
        ),
        "etaOneQuarter": {
            "parentDefect": parent_defect,
            "oneHalfDisplacementDefect": half_defect,
            "fourDescendantTotal": 4 * half_defect,
            "sixDescendantTotal": 6 * half_defect,
            "sixDescendantsContract": False,
        },
        "sixDescendantThreshold": six_threshold,
        "interpretation": (
            "six half-displacement descendants expand the defect for 0<|eta|<about 0.424141 and contract only above that threshold"
        ),
        "table": branching_table,
    },
    "twistedEulerProducts": {
        "possibleConstruction": (
            "prime-dependent SU(2) or SU(3) matrices would define matrix Euler products or automorphic/L-function-like sectors"
        ),
        "singletPersistence": (
            "if the scalar zeta ledger is recovered in the singlet, its critical energy obstruction remains unchanged"
        ),
        "strength": (
            "critical energy in every nontrivial channel would generally ask for zero control of additional L-functions and is stronger than RH"
        ),
        "status": "no prime-to-spin or prime-to-colour representation is derived by TTI",
    },
    "proofBoundary": {
        "validApplication": (
            "critical energy conditionally closes every exact zeta-side object downstream of RH, but not finite splice models or physical constants"
        ),
        "validSpinColourRole": (
            "spin and colour can organize a future matrix-valued ledger and expose singlet versus nonsinglet channels"
        ),
        "missingInput": (
            "derive a non-circular prime-dependent SU(2)xSU(3) coupling and prove a critical energy estimate for its singlet component"
        ),
        "status": "spin and colour sharpen the ontology and multiplicity audit; they do not prove the missing estimate or RH",
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Critical-energy application and spin-colour audit complete.")
print("  Conditional zeta-side closure: all previous RH-equivalent residues vanish.")
print("  Internal 2x3 degeneracy: coefficient radius unchanged; scalar singlet remains.")
print(f"  Six-descendant seam threshold: eta={six_threshold:.12f}.")
print("  Verdict: no spin-colour proof of critical energy or RH.")
