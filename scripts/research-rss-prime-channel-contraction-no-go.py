#!/usr/bin/env python3
"""Prove a tail obstruction to a prime-index Markov realization of eta contraction.

For the von-Mangoldt exponential family p_a(n)=Lambda(n)n^(-a)/M(a), this
script records the analytic-continuation/tail argument showing that no single
parameter-independent stochastic kernel on prime powers can map p_a to
p_{2+c(a-2)} on any open interval when 0<c<1.  It checks the golden choice
c=1/phi and produces the machine-readable proof ledger.  This is a no-go for a
natural channel construction, not a proof or disproof of RH and not a statement
about an operator defined only on the discrete actual zero set.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs/rh/rss-prime-channel-contraction-no-go-results.json"
PHI = (1.0 + math.sqrt(5.0)) / 2.0
C = 1.0 / PHI

# The leading asymptotic ratio between the target mass at 3 and all available
# non-2 input mass.  It is (2/3)^(a_c-a), with a_c=2+c(a-2), and diverges for
# 0<c<1.  These are asymptotic factors, not finite-a probability estimates.
asymptotic_rows = []
for a in (4.0, 10.0, 20.0, 50.0):
    a_target = 2.0 + C * (a - 2.0)
    ratio = (2.0 / 3.0) ** (a_target - a)
    asymptotic_rows.append({
        "a": a,
        "aTarget": a_target,
        "targetOverAvailableTailLeadingFactor": ratio,
    })
assert all(row["targetOverAvailableTailLeadingFactor"] > 1.0 for row in asymptotic_rows)
assert asymptotic_rows[-1]["targetOverAvailableTailLeadingFactor"] > asymptotic_rows[0]["targetOverAvailableTailLeadingFactor"]

results = {
    "analysisDate": "2026-10-15",
    "title": "No parameter-independent positive prime-index channel realizes strict eta contraction",
    "question": "Can the Fisher-natural flow eta -> c eta be realized by one fixed stochastic channel on prime powers, thereby linking the prime feature law to an arithmetic splice operation?",
    "verdict": {
        "goldenContractionFactor": C,
        "fixedMarkovKernelExistsForOpenParameterInterval": False,
        "proofIsExact": True,
        "actualXiZeroLedgerInvarianceProved": False,
        "rhProved": False,
        "conclusion": "No parameter-independent Markov kernel on prime powers can map every p_a in an open parameter interval to p_(2+c(a-2)) for any 0<c<1. Analyticity extends such an identity to all real a>1; concentration at the first support point forces the kernel to fix n=2, while the contracted target requires more n=3 mass than the input has outside n=2. This blocks a natural positive-channel bridge for the feature-family flow, but does not rule out a nonlinear same-xi identity or an operator specified only on actual zeros.",
    },
    "family": {
        "support": "prime powers n with Lambda(n)>0, ordered 2<3<4<...",
        "normalizer": "M(a)=sum_n Lambda(n)n^(-a), a>1",
        "probability": "p_a(n)=Lambda(n)n^(-a)/M(a)",
        "parameterRelation": "a=2+2eta; eta -> c eta is a -> a_c=2+c(a-2)",
        "targetAnalyticDomain": "Re(a)>1 implies Re(a_c)>2-c>1",
    },
    "proof": {
        "assumption": "A fixed column-stochastic kernel K(r|n)>=0 satisfies sum_n K(r|n)p_a(n)=p_(a_c)(r) for every a in a nonempty open subinterval of (1,3).",
        "analyticContinuation": "For each output r, F_r(z)=sum_n K(r|n)Lambda(n)n^(-z) is holomorphic on Re(z)>1. After cross multiplication by M(z)M(a_c), the assumed identity is holomorphic on Re(z)>1 and hence holds throughout that half-plane.",
        "firstSupportPoint": "As real a->infinity, p_a converges in total variation to delta_2 and p_(a_c) also converges to delta_2. Therefore K delta_2=delta_2, so K(3|2)=0.",
        "availableMassAtThree": "Then (K p_a)(3)<=sum_(n>=3)p_a(n)~[Lambda(3)/Lambda(2)](2/3)^a.",
        "requiredTargetMassAtThree": "p_(a_c)(3)~[Lambda(3)/Lambda(2)](2/3)^(a_c), where a_c=2+c(a-2).",
        "contradiction": "The ratio of required target mass to available non-2 input mass is asymptotic to (2/3)^(a_c-a)=(3/2)^((1-c)(a-2)), which tends to infinity for 0<c<1. This contradicts stochasticity.",
        "scope": "The identity on an open interval is essential for analytic continuation. The theorem does not forbid an eta-dependent resampling rule, a signed/non-Markov operator, or a rule defined only on a discrete unknown set of actual zero displacements.",
    },
    "goldenAsymptoticDiagnostics": asymptotic_rows,
    "relationToOtherExactBridges": {
        "primePairSpliceAudit": "The (101,101) self-pair vanishes in centered Fisher curvature; the current no-go rules out a single stochastic channel as the missing same-xi coupling.",
        "criticalEnergy": "The all-scale critical Chebyshev-energy bound still implies RH by Mellin holomorphy, but remains RH-equivalent and unproved.",
        "primeAnchor": "The positive defect D_2 is an exact prime-to-horizontal-zero identity; proving D_2=0 remains RH-equivalent.",
        "remainingTarget": "Find a nonlinear, same-xi arithmetic identity/conservation law that couples the actual completed zero divisor to the fixed prime ledger; this channel route cannot supply it.",
    },
    "status": "A candidate positive-channel bridge is ruled out exactly. No new same-xi identity, zero-free strip or RH proof is obtained.",
}

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
print("Prime-index contraction channel no-go complete.")
print(f"  Golden contraction factor c=1/phi={C:.15f}.")
print("  The open-interval channel identity analytically continues to all a>1.")
print("  Concentration at n=2 and the slower target n=3 tail contradict a fixed Markov kernel.")
print("  Same-xi invariance and RH remain unproved.")
