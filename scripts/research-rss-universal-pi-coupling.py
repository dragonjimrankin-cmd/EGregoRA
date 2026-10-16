#!/usr/bin/env python3
"""Twenty-sixth-stage audit of a universal coupling between numbers and pi.

Several exact meanings are tested: the sine Hadamard product, theta/Poisson
self-duality, unitary phases, multiplicative logarithmic twists, and a genuine
tensor-product notion of entanglement. The script records what each meaning
changes in the RH programme. It does not infer quantum entanglement from a
shared constant or prove the critical Chebyshev-energy estimate.
"""

from __future__ import annotations

import cmath
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENERGY_INPUT = ROOT / "docs/rh/rss-critical-chebyshev-energy-results.json"
SPIN_INPUT = ROOT / "docs/rh/rss-energy-spin-colour-results.json"
OUTPUT = ROOT / "docs/rh/rss-universal-pi-coupling-results.json"

energy = json.loads(ENERGY_INPUT.read_text())
spin_colour = json.loads(SPIN_INPUT.read_text())
assert energy["verdict"]["rhProved"] is False
assert spin_colour["verdict"]["spinColourClosesCriticalEnergy"] is False


def all_above_one_sine_product(z: complex, cutoff: int) -> complex:
    product = 1 + 0j
    for n in range(2, cutoff + 1):
        product *= 1 - (z * z) / (n * n)
    return product


def exact_all_above_one_product(z: complex) -> complex:
    return cmath.sin(math.pi * z) / (math.pi * z * (1 - z * z))


sine_checks = []
for z in [0.25, 0.75, 1.25, 1.5 + 0.2j]:
    exact = exact_all_above_one_product(z)
    errors = []
    for cutoff in [100, 1000, 10000]:
        approximation = all_above_one_sine_product(z, cutoff)
        errors.append({
            "cutoff": cutoff,
            "absoluteError": abs(approximation - exact),
        })
    assert errors[-1]["absoluteError"] < errors[0]["absoluteError"]
    sine_checks.append({
        "zReal": z.real,
        "zImag": z.imag,
        "exactReal": exact.real,
        "exactImag": exact.imag,
        "errors": errors,
    })


def theta(x: float, cutoff: int = 80) -> float:
    return 1 + 2 * sum(math.exp(-math.pi * n * n * x) for n in range(1, cutoff + 1))


theta_checks = []
for x in [0.1, 0.2, 0.5, 2.0, 5.0, 10.0]:
    left = theta(x)
    right = theta(1 / x) / math.sqrt(x)
    assert abs(left - right) < 2e-14
    theta_checks.append({
        "x": x,
        "thetaX": left,
        "reciprocalSide": right,
        "absoluteDifference": abs(left - right),
    })

# Unit phases preserve positive L2 energy exactly.
phase_energy_checks = []
coefficients = [complex(1.2, -0.4), complex(-2.1, 0.7), complex(0.3, 1.9), complex(-0.8, -1.1)]
for phase_rule in [
    lambda n: cmath.exp(1j * math.pi),
    lambda n: cmath.exp(1j * math.pi * n),
    lambda n: cmath.exp(2j * math.pi / n),
    lambda n: cmath.exp(1j * math.pi * math.log(n)),
]:
    before = sum(abs(value) ** 2 for value in coefficients)
    after = sum(abs(value * phase_rule(n + 2)) ** 2 for n, value in enumerate(coefficients))
    assert abs(before - after) < 1e-14
    phase_energy_checks.append({"energyBefore": before, "energyAfter": after})

# A global pi register is a common tensor factor and therefore separable.
# N-dependent registers could be entangled, but then require a declared inner
# product and dynamics. This logical distinction is recorded in the output.

results = {
    "analysisDate": "2026-10-15",
    "title": "What if every number above one is entangled with pi?",
    "question": "can a universal pi coupling alter the critical energy, spin-colour, seam or RH obstruction?",
    "verdict": {
        "rhProved": False,
        "criticalEnergyEstimateProved": False,
        "universalPiCouplingAlreadyPresentInThetaCompletion": True,
        "sharedPiFactorIsQuantumEntanglement": False,
        "unitaryPiPhasesChangePositiveEnergy": False,
        "piCouplingMovesZerosOntoCriticalLine": False,
        "physicalMechanismDerived": False,
        "conclusion": (
            "There are exact senses in which every integer is coupled to pi: the sine Hadamard product and the "
            "self-dual theta Gaussian. These already supply the integer lattice, archimedean completion and functional "
            "equation. They do not control the prime fluctuation required by critical Chebyshev energy. Common or "
            "unit-modulus pi phases preserve positive energy; multiplicative log phases only shift zeta vertically; "
            "and a common pi register is separable rather than quantum-entangled."
        ),
    },
    "literalScopeDistinction": {
        "allRealNumbers": (
            "if number means every real x>1, the map x->pi x is only a reversible rescaling and adds no discrete arithmetic structure"
        ),
        "allIntegers": (
            "if number means every integer n>=2, the canonical exact coupling is the sine product or theta lattice"
        ),
        "quantumUseOfEntangled": (
            "quantum entanglement requires a nonseparable state in a tensor product, not merely occurrence of the same constant pi"
        ),
    },
    "sineLattice": {
        "identity": "product_(n>=2)(1-z^2/n^2)=sin(pi z)/(pi z(1-z^2))",
        "meaning": "one order-one entire function packages every integer above one together with pi",
        "logDerivative": (
            "pi cot(pi z)-1/z+2z/(1-z^2)=-2z sum_(n>=2)1/(n^2-z^2)"
        ),
        "rhEffect": (
            "the lattice knows all integers but not the von Mangoldt prime weights; multiplying xi by it adds integer zeros and does not move zeta zeros"
        ),
        "checks": sine_checks,
    },
    "thetaPoissonCoupling": {
        "identity": "theta(x)=sum_(n in Z)exp(-pi n^2 x)=x^(-1/2)theta(1/x)",
        "meaning": (
            "pi is the exact self-dual Gaussian normalization coupling every integer mode to its Fourier-dual mode"
        ),
        "alreadyUsed": (
            "the finite theta completions and the Riemann xi Mellin representation already contain this universal pi coupling"
        ),
        "whatItGives": "entire completion, functional symmetry and the archimedean factor",
        "whatItDoesNotGive": "real-rootedness of each finite transform or the critical prime-error energy estimate",
        "checks": theta_checks,
    },
    "phaseModels": [
        {
            "model": "common phase exp(i pi)=-1",
            "effect": "factors out of every scalar sum and carries no relative information",
        },
        {
            "model": "parity phase exp(i pi n)=(-1)^n",
            "effect": (
                "produces the alternating eta completion with factor (1-2^(1-s))zeta(s); it retains every nontrivial zeta zero and adds a dyadic divisor"
            ),
        },
        {
            "model": "multiplicative logarithmic phase n^(i pi)",
            "effect": "sum n^(-s)n^(i pi)=zeta(s-i pi), a vertical shift that leaves all zero real parts unchanged",
        },
        {
            "model": "root-of-unity assignment exp(2 pi i/n)",
            "effect": "unit modulus but not multiplicative, so it does not preserve the Euler product",
        },
        {
            "model": "additive irrational rotation exp(2 pi i pi n)",
            "effect": "can create equidistributed phases in n but destroys multiplicative prime structure and supplies no untwisted Chebyshev bound",
        },
    ],
    "positiveEnergyInvariance": {
        "identity": "|exp(i phi(n))E_n|^2=|E_n|^2",
        "consequence": (
            "pi phases can reorganize amplitudes but cannot lower a Hilbert L2 norm unless channels are recombined before squaring; "
            "recovering the untwisted principal channel then restores the original obstruction"
        ),
        "checks": phase_energy_checks,
    },
    "archimedeanPrimeSplit": {
        "factorization": (
            "xi(s)=[(1/2)s pi^(-s/2)Gamma(s/2)] times [(s-1)zeta(s)]"
        ),
        "piSector": (
            "the first factor is zero-free in Re(s)>1/2 and supplies normalization and symmetry, not nontrivial zero cancellation"
        ),
        "primeSector": (
            "the second factor carries the nontrivial zeros and the critical Chebyshev-energy obstruction"
        ),
        "consequence": (
            "a universal zero-free pi completion cannot enlarge the prime logarithm's analytic disk; a pi factor with zeros merely adds a divisor reservoir"
        ),
    },
    "genuineTensorEntanglement": {
        "separableState": (
            "sum_n a_n|n> tensor |pi> = (sum_n a_n|n>) tensor |pi>, so a common pi register is separable"
        ),
        "possibleEntangledState": "sum_n a_n|n> tensor |pi;n> with non-collinear n-dependent register states",
        "cost": (
            "one must specify the pi-register Hilbert space, overlaps, dynamics and observable; tracing orthogonal registers removes rather than enhances interference"
        ),
        "arithmeticRequirement": (
            "the reduced scalar channel must still reconstruct psi(x)-x and satisfy critical energy, otherwise the model has changed the target"
        ),
    },
    "spinColourPiCenters": {
        "spin": "the central SU(2) spinor phase for a 2pi rotation is -I=exp(i pi)I; a 4pi rotation returns I",
        "colour": "the SU(3) centre uses exp(2pi i k/3)I for k=0,1,2",
        "connection": (
            "pi parametrizes the compact phases already suggested by spin and colour, but singlet traces remove their central phase"
        ),
        "status": (
            "this identifies compatible phase geometry, not a prime-to-spin-colour coupling or a physical entangling interaction"
        ),
    },
    "seamRole": {
        "identity": "epsilon(eta)=-2log(cos(pi eta))",
        "meaning": (
            "pi already converts horizontal strip displacement into a dimensionless angular defect and cancels height in the two-ended product"
        ),
        "normalization": (
            "the coefficient pi is fixed by the conformal map of a strip of width one; changing it changes coordinates rather than proving eta=0"
        ),
    },
    "applicationToPreviousWork": [
        {
            "object": "critical Chebyshev energy",
            "result": "unit pi phases leave its positive norm unchanged; theta pi coupling does not prove the bound",
        },
        {
            "object": "prime-Laguerre radius",
            "result": "zero-free archimedean pi factors do not remove interior singularities created by zeta zeros",
        },
        {
            "object": "finite theta completions",
            "result": "universal pi coupling is already built in through exp(-pi n^2 x), but finite real-rootedness remains open",
        },
        {
            "object": "spin-colour channels",
            "result": "pi supplies their central phases, while the scalar singlet bottleneck remains",
        },
        {
            "object": "two-ended seam",
            "result": "pi makes the marker coercive and height-independent, but arithmetic control is still critical energy",
        },
        {
            "object": "physical splice",
            "result": "no Hamiltonian, action, unit-bearing scale or entanglement mechanism follows from universal pi occurrence",
        },
    ],
    "proofBoundary": {
        "exactFinding": (
            "the sine and theta identities are rigorous universal integer-pi couplings, and pi also parametrizes the spin and colour centres"
        ),
        "missingTheorem": (
            "prove that one such structure controls the untwisted singlet prime error at critical dyadic energy scale"
        ),
        "status": "no tested pi coupling supplies that estimate; RH and the physical interpretation remain open",
    },
}

OUTPUT.write_text(json.dumps(results, indent=2) + "\n")

print("Universal pi-coupling investigation complete.")
print("  Exact integer couplings: sine product and theta/Poisson self-duality.")
print("  Positive energy: unchanged by all unit pi phases tested.")
print("  Spin/colour: pi supplies centre phases, not the singlet estimate.")
print("  Verdict: no proof of critical energy or RH.")
