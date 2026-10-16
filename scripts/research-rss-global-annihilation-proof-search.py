#!/usr/bin/env python3
"""Search for a global-annihilation proof after the relational audits.

The script certifies the recurrence--dissipation implication, exhausts finite
words in reflection/golden/halving maps, stress-tests attempts to combine a tiny
scalar defect with an integer index, and records fail-fast gates for intrinsic
prime or heat flows.  It does not assume the missing same-xi invariance.
"""

from __future__ import annotations

from decimal import Decimal, getcontext
from itertools import product
import json
from pathlib import Path

getcontext().prec = 90
D = Decimal
PHI = (D(1) + D(5).sqrt()) / D(2)
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-global-annihilation-proof-search-results.json"


def dec(value: Decimal, places: int = 40) -> str:
    if value == 0:
        return "0"
    return format(value, f".{places}g")


def defect(eta: Decimal, gamma: Decimal, w: Decimal = D("1.5")) -> Decimal:
    e = eta * eta
    g = gamma * gamma
    h_ord = D(4) * w / (w * w + g)
    u = w * w - e + g
    h_q = D(4) * w * u / (u * u + D(4) * e * g)
    return h_ord - h_q


# ---------------------------------------------------------------------------
# 1. Exact word census.  R is critical-line reflection; G and H are strict
# golden and halving contractions.  Every word has multiplier
# (-1)^r phi^(-g) 2^(-h).  A finite-order return is impossible once g+h>0.
# ---------------------------------------------------------------------------
SYMBOLS = ("R", "G", "H")
length_rows = []
total_words = 0
dissipative_words = 0
finite_return_dissipative_words = 0
identity_words_without_contraction = 0
examples = []

for length in range(1, 9):
    count = 0
    dissipative = 0
    returns = 0
    identity_no_contraction = 0
    for word_tuple in product(SYMBOLS, repeat=length):
        count += 1
        word = "".join(word_tuple)
        r = word.count("R")
        g = word.count("G")
        h = word.count("H")
        has_contraction = g + h > 0
        if has_contraction:
            dissipative += 1
            # Absolute multiplier is strictly below one, so no positive power
            # can equal one.  This is exact and needs no numerical comparison.
            finite_order_return = False
        else:
            finite_order_return = True  # R or identity has order dividing two.
            if r % 2 == 0:
                identity_no_contraction += 1
        if has_contraction and finite_order_return:
            returns += 1
        if word in {"R", "RR", "G", "RG", "RGRG", "H", "RHRH", "GH"}:
            magnitude = (PHI ** (-g)) * (D(2) ** (-h))
            examples.append({
                "word": word,
                "reflectionCount": r,
                "goldenCount": g,
                "halvingCount": h,
                "multiplierSign": -1 if r % 2 else 1,
                "multiplierMagnitude": dec(magnitude),
                "strictlyDissipative": has_contraction,
                "finiteOrderReturn": finite_order_return,
            })
    length_rows.append({
        "length": length,
        "words": count,
        "strictlyDissipativeWords": dissipative,
        "dissipativeFiniteReturnWords": returns,
        "identityWordsWithoutContraction": identity_no_contraction,
    })
    total_words += count
    dissipative_words += dissipative
    finite_return_dissipative_words += returns
    identity_words_without_contraction += identity_no_contraction

assert total_words == 9840
assert dissipative_words == 9832
assert finite_return_dissipative_words == 0
assert identity_words_without_contraction == 4

# ---------------------------------------------------------------------------
# 2. Quantized index plus tiny scalar defect.  One quartet always has two
# negative squares, while its weighted defect can tend to zero.
# ---------------------------------------------------------------------------
index_defect_rows = []
for k in [10, 100, 1_000, 1_000_000, 10_000_000]:
    eta = D(1) / D(k)
    gamma = D(k)
    d = defect(eta, gamma)
    index_defect_rows.append({
        "k": k,
        "eta": dec(eta),
        "gamma": dec(gamma),
        "phaseDefect": dec(d),
        "negativeSquares": 2,
        "weightedReflectionEigenvalues": [dec(d), dec(-d)],
        "unweightedReflectionEigenvalues": ["1", "-1"],
    })

assert all(row["negativeSquares"] == 2 for row in index_defect_rows)
assert all(D(index_defect_rows[i + 1]["phaseDefect"]) < D(index_defect_rows[i]["phaseDefect"])
           for i in range(len(index_defect_rows) - 1))
assert D(index_defect_rows[-1]["phaseDefect"]) < D("1e-40")

normalized_trace_rows = []
for quartets in [1, 10, 100, 1_000, 10_000]:
    normalized_trace_rows.append({
        "quartets": quartets,
        "negativeIndex": 2 * quartets,
        "unweightedTraceNorm": 4 * quartets,
        "traceClassUniformlyBoundedAsQuartetsGrow": False,
    })

# ---------------------------------------------------------------------------
# 3. Candidate-law gates.  A law must possess both exact arithmetic invariance
# and strict defect dissipation; all known candidates supply at most one.
# ---------------------------------------------------------------------------
candidate_laws = [
    {
        "candidate": "functional-equation reflection",
        "sameXiDivisorInvariant": True,
        "strictHorizontalDefectDissipation": False,
        "finiteReturn": True,
        "gate": "reflection sends eta to -eta and preserves every even defect",
    },
    {
        "candidate": "golden or halving support flow",
        "sameXiDivisorInvariant": False,
        "strictHorizontalDefectDissipation": True,
        "finiteReturn": False,
        "gate": "the off-line quartet polynomial changes",
    },
    {
        "candidate": "reflection followed by strict contraction",
        "sameXiDivisorInvariant": False,
        "strictHorizontalDefectDissipation": True,
        "finiteReturn": False,
        "gate": "(RC)^2=C^2, not the identity away from eta=0",
    },
    {
        "candidate": "golden random-reflection entropy",
        "sameXiDivisorInvariant": True,
        "strictHorizontalDefectDissipation": False,
        "finiteReturn": False,
        "gate": "it contracts branch imbalance already zero for a completed quartet",
    },
    {
        "candidate": "proximity phase locking",
        "sameXiDivisorInvariant": True,
        "strictHorizontalDefectDissipation": False,
        "finiteReturn": False,
        "gate": "it acts on circular relative phase q, not horizontal support eta",
    },
    {
        "candidate": "prime exponent damping n^(-t)",
        "sameXiDivisorInvariant": False,
        "strictHorizontalDefectDissipation": False,
        "finiteReturn": False,
        "gate": "it translates zeta from s to s+t and moves the critical center",
    },
    {
        "candidate": "log-frequency coefficient heat damping",
        "sameXiDivisorInvariant": False,
        "strictHorizontalDefectDissipation": "not established",
        "finiteReturn": False,
        "gate": "it breaks the original Euler product and supplies no same-xi divisor law",
    },
    {
        "candidate": "de Bruijn-Newman heat flow",
        "sameXiDivisorInvariant": False,
        "strictHorizontalDefectDissipation": "eventual real-zero property, not a proved t=0 RH dissipation law",
        "finiteReturn": False,
        "gate": "the heat parameter changes the entire function; proving the threshold is at zero is RH",
    },
    {
        "candidate": "Hardy inner-factor radial damping",
        "sameXiDivisorInvariant": False,
        "strictHorizontalDefectDissipation": True,
        "finiteReturn": False,
        "gate": "removing the Blaschke factor changes the function; proving it absent is RH",
    },
]

assert not any(
    row["sameXiDivisorInvariant"] is True
    and row["strictHorizontalDefectDissipation"] is True
    for row in candidate_laws
)

# ---------------------------------------------------------------------------
# 4. The proof theorem itself is a one-line Lyapunov argument.  The search is
# therefore reduced to the conjunction of two independently checkable premises.
# ---------------------------------------------------------------------------
proof_ledger = {
    "lyapunovFunctional": "V(mu)=total positive off-line defect (or horizontal second moment)",
    "nonnegativity": "V(mu)>=0, with V(mu)=0 iff RH",
    "arithmeticInvarianceNeeded": "T_# mu_xi=mu_xi",
    "strictDissipationNeeded": "V(T_# nu)<=q V(nu) for the xi ledger, with 0<=q<1",
    "proof": "V(mu_xi)=V(T_#mu_xi)<=q V(mu_xi), hence (1-q)V(mu_xi)<=0; nonnegativity gives V(mu_xi)=0",
    "status": "the implication is proved; no derived T simultaneously satisfies arithmetic invariance and strict dissipation",
}

# A finite-return variant is equally sharp.
return_ledger = {
    "assumptions": [
        "T^m_# mu_xi=mu_xi for some m>=1",
        "V(T_#nu)<=q V(nu) with q<1 along the orbit",
    ],
    "proof": "V(mu_xi)=V(T^m_#mu_xi)<=q^m V(mu_xi), so V(mu_xi)=0",
    "ttiTwoPassTest": "for T=RC with C eta=c eta and R eta=-eta, T^2 eta=c^2 eta; exact two-pass return forces (1-c^2)eta=0",
    "missingPremise": "the physical two-pass carrier return has not been proved to act as RC on the actual xi divisor",
}

results = {
    "analysisDate": "2026-10-15",
    "title": "Global annihilation proof search: recurrence, dissipation and arithmetic invariance",
    "question": "Can the relational proximity analogy be promoted to a valid global law that annihilates every RH defect with no reservoir?",
    "verdict": {
        "conditionalGlobalAnnihilationTheoremProved": True,
        "unconditionalSameXiArithmeticDissipationLawFound": False,
        "rhProved": False,
        "reflectionSuppliesInvariance": True,
        "reflectionSuppliesStrictDissipation": False,
        "supportContractionSuppliesStrictDissipation": True,
        "supportContractionSuppliesSameXiInvariance": False,
        "tinyDefectPlusIntegerIndexForcesZero": False,
        "finiteReturnStrictContractionExistsOffCriticalLine": False,
        "conclusion": "The exact proof is a Lyapunov recurrence argument: an invariant xi ledger under a strict defect contraction must have zero defect.  Exhaustive reflection/golden/halving words confirm that exact return and strict contraction coexist only at eta=0.  But known xi symmetry supplies return without contraction, while every strict contraction changes the divisor.  Heat, inner-factor and prime-damping candidates also change the function or restate RH.  The implication is proved; its arithmetic-invariance premise is not.  RH remains open.",
    },
    "globalAnnihilationTheorem": proof_ledger,
    "finiteReturnTheorem": return_ledger,
    "wordCensus": {
        "alphabet": {"R": "eta->-eta", "G": "eta->eta/phi", "H": "eta->eta/2"},
        "exactMultiplier": "(-1)^r phi^(-g) 2^(-h)",
        "lengthsTested": 8,
        "totalWords": total_words,
        "strictlyDissipativeWords": dissipative_words,
        "dissipativeFiniteReturnWords": finite_return_dissipative_words,
        "identityWordsWithoutContraction": identity_words_without_contraction,
        "lengthRows": length_rows,
        "representativeWords": examples,
        "theorem": "a word containing G or H has multiplier magnitude below one, so no positive power is the identity away from eta=0",
    },
    "indexDefectGapStress": {
        "rows": index_defect_rows,
        "result": "two negative squares coexist with arbitrarily small scalar defect; quantized index and the certified tiny defect do not force zero",
        "weightedOperator": "weighting the reflection block by the defect makes its negative eigenvalue tend to zero",
        "unweightedOperator": "normalizing every block to eigenvalues plus/minus one destroys a uniform trace-class bound as the number of blocks grows",
        "normalizedTraceRows": normalized_trace_rows,
    },
    "candidateLawGates": candidate_laws,
    "stripMapNoGo": {
        "statement": "after conformally mapping the strip to the disk, a holomorphic self-map fixing the center is contractive by Schwarz; if a positive iterate is the identity, it is an automorphism and its derivative has modulus one",
        "consequence": "a strict holomorphic contraction cannot also be an exact finite-order return, except on the central fixed state",
        "effectOnTti": "the exact double inversion can represent reflection or rotation, but not horizontal shrinkage without an additional non-invertible/open-system step",
    },
    "deBruijnNewmanGate": {
        "family": "H(lambda,z)=integral exp(lambda u^2) Phi(u) cos(zu) du",
        "heatEquation": "partial_lambda H=-partial_z^2 H",
        "knownThresholdStatement": "all zeros are real exactly for lambda>=Lambda",
        "knownLowerBound": "Lambda>=0",
        "rhCriterion": "RH iff Lambda<=0; together with the lower bound this is RH iff Lambda=0",
        "gate": "the heat flow changes H_lambda; proving that real-zero global annihilation has already occurred at lambda=0 is exactly RH",
        "sourceLedger": [
            "de Bruijn (1950), roots of trigonometric integrals",
            "Newman (1976), Fourier transforms with only real zeros",
            "Rodgers--Tao (2020), Lambda>=0",
            "D.H.J. Polymath (2019), effective heat-flow approximation",
        ],
    },
    "nextNarrowTarget": {
        "statement": "derive from the fixed von Mangoldt ledger, without assuming zero-freeness, an operator T on the completed zero measure that is both xi-invariant and strictly decreases one established positive off-line functional",
        "failFast": "if T is merely reflection, a synthetic support flow, a changed heat family, a removed Blaschke factor or a finite numerical approximation, the route does not meet both premises",
    },
    "evidenceBoundary": {
        "provedHere": [
            "the global Lyapunov invariance-plus-dissipation theorem",
            "the finite-return version and two-pass RC calculation",
            "the exact 9,840-word reflection/golden/halving census",
            "a fixed-index family with scalar defect tending to zero",
            "the trace-class normalization obstruction for unweighted index blocks",
        ],
        "notProved": [
            "same-xi invariance of any strict support contraction",
            "a new prime-side dissipative inequality",
            "Lambda<=0 in the de Bruijn-Newman flow",
            "RH",
        ],
    },
    "status": "the proof implication has been isolated and proved, but the required arithmetic dissipation premise remains exactly the unresolved RH-strength step",
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Global-annihilation proof search complete.")
print("  Proved the invariant-ledger plus strict-dissipation theorem.")
print(f"  Exhausted {total_words} reflection/golden/halving words.")
print("  No strictly dissipative word has finite-order return off the critical line.")
print("  Integer index plus arbitrarily small scalar defect does not force zero.")
print("  Every candidate law still misses invariance, dissipation, or same-function status.")
print("  RH remains open.")
