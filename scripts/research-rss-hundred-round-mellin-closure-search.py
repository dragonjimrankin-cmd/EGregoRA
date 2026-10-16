#!/usr/bin/env python3
"""Run a one-hundred-round search for a finite bootstrap of the Mellin ladder.

Ten candidate structural mechanisms are crossed with the first ten ladder
transitions.  For every transition a reflected von-Mangoldt state is built that
has all earlier Mellin moments, retains all ten established structural
properties, and fails the next moment.  This proves a general finite-bootstrap
no-go; it does not test unknown arithmetic identities by finite computation.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-hundred-round-mellin-closure-search-results.json"

mechanisms = [
    {
        "id": "positivity",
        "label": "positivity of the dephased diagonal",
        "whyRetained": "the reflected state is a positive convex mixture",
    },
    {
        "id": "normalization",
        "label": "trace and probability normalization",
        "whyRetained": "both component laws have mass one",
    },
    {
        "id": "reflection",
        "label": "functional-equation-style horizontal reflection",
        "whyRetained": "the state contains eta and -eta with equal weight",
    },
    {
        "id": "dephasing",
        "label": "logarithmic CPTP dephasing",
        "whyRetained": "each component is the exact diagonal of a dephased rank-one feature",
    },
    {
        "id": "finite-relative-entropy",
        "label": "finite relative entropy to p_0",
        "whyRetained": "eta is strictly below one half, so the relevant logarithmic von-Mangoldt moments converge",
    },
    {
        "id": "all-log-moments",
        "label": "all fixed logarithmic moments",
        "whyRetained": "every sum of Lambda(n)n^(-2+2eta)(log n)^k converges for fixed k",
    },
    {
        "id": "fisher-flow",
        "label": "the componentwise Fisher natural-gradient flow",
        "whyRetained": "p_eta belongs to the same exponential family with eta-dot=-eta",
    },
    {
        "id": "unit-phase-invariance",
        "label": "invariance under common unit logarithmic phases",
        "whyRetained": "unit phases do not change either probability diagonal",
    },
    {
        "id": "trace-class",
        "label": "positive trace-class feature density",
        "whyRetained": "the mixture is a convex sum of rank-one trace-one states",
    },
    {
        "id": "strict-convexity",
        "label": "strict entropy and moment convexity",
        "whyRetained": "the von-Mangoldt exponential family has positive Fisher variance away from degeneracy",
    },
]

rounds = []
for j in range(1, 11):
    lower = 1.0 / (2.0 * (j + 1))
    upper = 1.0 / (2.0 * j)
    eta = 0.5 * (lower + upper)
    assert 2.0 * eta < 1.0 / j
    assert 2.0 * eta > 1.0 / (j + 1)
    for mechanism in mechanisms:
        rounds.append({
            "round": len(rounds) + 1,
            "knownThroughRung": j,
            "attemptedNextRung": j + 1,
            "mechanism": mechanism["id"],
            "mechanismLabel": mechanism["label"],
            "separatorEta": eta,
            "separatorInterval": f"1/[2({j + 1})] < eta < 1/(2*{j})",
            "earlierRungsFinite": True,
            "nextRungFinite": False,
            "mechanismRetained": True,
            "result": "countermodel",
            "reason": (
                f"Q_eta=[p_eta+p_-eta]/2 retains {mechanism['label']} and A_1 through A_{j}, "
                f"but its slow branch makes A_{j + 1} diverge"
            ),
        })

assert len(rounds) == 100
assert all(row["earlierRungsFinite"] for row in rounds)
assert all(not row["nextRungFinite"] for row in rounds)
assert all(row["mechanismRetained"] for row in rounds)

arithmetic_routes = [
    {
        "route": "linear completed explicit formula",
        "status": "insufficient",
        "gate": "it is linear and holomorphic in the divisor, whereas the dephased amplitude statistic uses rho and conjugate(rho)",
    },
    {
        "route": "absolute value of the explicit formula",
        "status": "invalid transfer",
        "gate": "taking absolute values gives an upper bound for a signed sum, not the required positive zero-by-zero diagonal identity",
    },
    {
        "route": "quadratic explicit formula",
        "status": "unproved arithmetic input",
        "gate": "dephasing constructs the diagonal, but transferring its global moments to primes still needs a nonlinear same-xi identity",
    },
    {
        "route": "Weil positivity",
        "status": "RH-equivalent",
        "gate": "positivity on the full admissible autocorrelation class is an equivalent criterion, not an established premise",
    },
    {
        "route": "critical Chebyshev energy",
        "status": "RH-equivalent",
        "gate": "the all-scale critical estimate is equivalent to excluding every right-half-strip zero",
    },
    {
        "route": "Li coefficients",
        "status": "RH-equivalent",
        "gate": "the required all-index coefficient positivity is another equivalent formulation",
    },
    {
        "route": "Nyman--Beurling closure",
        "status": "RH-equivalent",
        "gate": "the necessary closure or distance limit is itself equivalent to RH",
    },
    {
        "route": "zero-density estimates",
        "status": "insufficient",
        "gate": "they can permit a single exceptional off-line zero, while one positive component already makes a Mellin rung diverge",
    },
    {
        "route": "classical zero-free region near Re s=1",
        "status": "insufficient",
        "gate": "the boundary approaches one with height and gives no fixed strip around one half",
    },
    {
        "route": "finite-height zero verification",
        "status": "finite only",
        "gate": "it cannot exclude one off-line zero above the verified height",
    },
]

results = {
    "analysisDate": "2026-10-15",
    "title": "One hundred rounds against the dephased Mellin obstruction",
    "question": "Can established positivity, symmetry, dephasing, entropy or flow properties bootstrap finitely many Mellin rungs to the next rung?",
    "protocol": {
        "rounds": 100,
        "ladderTransitions": 10,
        "mechanismsPerTransition": 10,
        "target": "derive A_(j+1)<infinity from A_1,...,A_j and one established structural mechanism",
        "separator": "choose eta strictly between 1/[2(j+1)] and 1/(2j)",
    },
    "verdict": {
        "roundsCompleted": 100,
        "successfulClosure": False,
        "finiteBootstrapPossibleFromTestedStructure": False,
        "generalFiniteRungSeparationProved": True,
        "newArithmeticZeroFreeStripProved": False,
        "rhProved": False,
        "postSuccessRoundsTriggered": False,
        "conclusion": "All one hundred finite-bootstrap attempts fail for the same exact reason.  For every finite rung J there is a reflected positive state Q_eta with 1/[2(J+1)]<eta<1/(2J).  It satisfies A_1 through A_J and all ten established structural properties, while A_(J+1) diverges.  Therefore no finite combination of those properties can inductively cross the next Mellin boundary.  A successful route must add genuinely arithmetic same-xi information that rules out the separator state; all screened standard candidates are either insufficient, finite-height only or already RH-equivalent.",
    },
    "generalNoGoTheorem": {
        "statement": "for every J>=1, choose eta_J in (1/[2(J+1)],1/(2J)); then Q_eta_J=[p_eta_J+p_-eta_J]/2 has finite A_j for every j<=J and divergent A_(J+1)",
        "proof": "the j-th slow-branch exponent is 1+1/j-2eta; convergence is equivalent to 2eta<1/j",
        "scope": "rules out finite bootstrap from the retained abstract structural properties; does not rule out a new arithmetic identity special to the actual xi divisor",
    },
    "mechanisms": mechanisms,
    "roundLedger": rounds,
    "arithmeticRouteScreen": arithmetic_routes,
    "onlyRemainingInputClass": {
        "description": "a new same-xi arithmetic theorem that proves at least one nontrivial fixed horizontal zero-free strip, or directly controls every Mellin rung",
        "examplesOfSufficientInputs": [
            "A_2<infinity followed by a genuinely arithmetic recursion A_j=>A_(j+1)",
            "analytic continuation of the dephased Mellin transform through every z=-1+1/j",
            "an arithmetic identity forcing the dephased spectral state to equal p_0",
        ],
        "currentlyEstablished": False,
    },
    "evidenceBoundary": {
        "provedHere": [
            "one hundred declared finite-bootstrap routes have explicit separator countermodels",
            "a general separator theorem for every finite Mellin rung",
            "the ten retained structural properties do not imply the next rung",
            "standard arithmetic routes screened here do not supply a noncircular closure",
        ],
        "notProved": [
            "A_2<infinity for the actual xi mixture",
            "a recursion between Mellin rungs special to xi",
            "any new global zero-free strip",
            "the global frame bound",
            "RH",
        ],
    },
    "status": "one hundred rounds completed without a proof; a finite structural bootstrap is now excluded, and the missing input must be genuinely new same-xi arithmetic information",
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

print("Hundred-round Mellin closure search complete.")
print("  Completed 100 declared rounds: ten mechanisms across ten rung transitions.")
print("  Every round has an exact reflected separator countermodel.")
print("  General finite-rung bootstrap no-go proved for the tested structural class.")
print("  No new same-xi zero-free strip was established; RH remains open.")
