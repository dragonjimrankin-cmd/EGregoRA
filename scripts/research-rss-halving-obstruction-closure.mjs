#!/usr/bin/env node
/**
 * Seventeenth-stage attempt to close the repeated-halving obstruction.
 *
 * Tests four possible bridges:
 *   1. replace pointwise zero invariance by invariance of the exact positive
 *      central horizontal-residue scalar;
 *   2. impose complete finite-stage zero genealogy (no unparented births);
 *   3. exclude the escaping factor by canonical theta-kernel admissibility;
 *   4. use real-rooted Pólya-like kernels plus convergent dyadic refinement.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'docs/rh/rss-halving-obstruction-closure-results.json');
const PHI = (1 + Math.sqrt(5)) / 2;
const FIRST_ZERO_ORDINATE = 14.134725141734693;
const STAGES = [14, 20, 30, 40];

function centralResidue(eta, gamma) {
  return 4 * eta * eta * (eta * eta + 3 * gamma * gamma)
    / (gamma * gamma * (eta * eta + gamma * gamma) ** 2);
}

function halvingRatioClosed(eta, gamma) {
  const x = eta * eta / (gamma * gamma);
  return (x + 12) * (x + 1) ** 2 / ((x + 4) ** 2 * (x + 3));
}

const contractionChecks = [];
for (const eta of [0.01, 0.1, 0.25, 0.49]) {
  for (const gamma of [FIRST_ZERO_ORDINATE, 21.022039638771556, 50, 100]) {
    const direct = centralResidue(eta / 2, gamma) / centralResidue(eta, gamma);
    const closed = halvingRatioClosed(eta, gamma);
    assert.ok(Math.abs(direct - closed) < 2e-15);
    assert.ok(direct > 0.25 && direct < 0.251);
    contractionChecks.push({ eta, gamma, directRatio: direct, closedRatio: closed });
  }
}

const branchScaling = [1, 2, 3, 4].map((totalDescendants) => {
  const eta = 0.25;
  const gamma = FIRST_ZERO_ORDINATE;
  const exactResidueRatio = totalDescendants * halvingRatioClosed(eta, gamma);
  const quadraticEnergyRatio = totalDescendants / 4;
  return {
    totalDescendants,
    exactCentralResidueRatio: exactResidueRatio,
    quadraticHorizontalEnergyRatio: quadraticEnergyRatio,
    strictlyContractsExactResidue: exactResidueRatio < 1,
  };
});
assert.equal(branchScaling[0].strictlyContractsExactResidue, true);
assert.equal(branchScaling[1].strictlyContractsExactResidue, true);
assert.equal(branchScaling[2].strictlyContractsExactResidue, true);
assert.equal(branchScaling[3].strictlyContractsExactResidue, false);
assert.equal(branchScaling[3].quadraticHorizontalEnergyRatio, 1);

const lineageBounds = STAGES.map((stage) => ({
  stage,
  maximumInheritedDisplacement: 0.5 * 2 ** (-stage),
  escapingQuartetDisplacement: 0.25,
  escapingQuartetHeight: PHI ** stage,
  escapingQuartetViolatesLineageBound: 0.25 > 0.5 * 2 ** (-stage),
}));

const escapingResidues = STAGES.map((stage) => {
  const eta = 0.25;
  const gamma = PHI ** stage;
  const residue = centralResidue(eta, gamma);
  return {
    stage,
    eta,
    gamma,
    centralResidue: residue,
    gammaFourthScaledResidue: residue * gamma ** 4,
    compactifiedSupremumContribution: eta,
  };
});
for (const entry of escapingResidues) {
  assert.ok(Math.abs(entry.gammaFourthScaledResidue - 0.75) < 1e-5);
}
assert.ok(escapingResidues.at(-1).centralResidue < escapingResidues[0].centralResidue * 1e-20);
assert.ok(escapingResidues.every((entry) => entry.compactifiedSupremumContribution === 0.25));

function multiply(left, right) {
  return [
    left[0] * right[0] - left[1] * right[1],
    left[0] * right[1] + left[1] * right[0],
  ];
}

function divide(left, right) {
  const norm = right[0] ** 2 + right[1] ** 2;
  return [
    (left[0] * right[0] + left[1] * right[1]) / norm,
    (left[1] * right[0] - left[0] * right[1]) / norm,
  ];
}

function subtract(left, right) {
  return [left[0] - right[0], left[1] - right[1]];
}

function square(value) {
  return multiply(value, value);
}

function stressFactor(z, stage, eta = 0.25) {
  const gamma = PHI ** stage;
  const upper = [eta, gamma];
  const lower = [eta, -gamma];
  const first = subtract([1, 0], divide(square(z), square(upper)));
  const second = subtract([1, 0], divide(square(z), square(lower)));
  return multiply(first, second);
}

function normalizedStressFactor(z, stage) {
  return divide(stressFactor(z, stage), stressFactor([0.5, 0], stage));
}

const normalizedStressChecks = STAGES.map((stage) => {
  const positiveEndpoint = normalizedStressFactor([0.5, 0], stage);
  const negativeEndpoint = normalizedStressFactor([-0.5, 0], stage);
  const compactSamples = [[0, 0], [0.3, 2], [-0.4, 5]];
  const maximumCompactError = Math.max(...compactSamples.map((z) => {
    const value = normalizedStressFactor(z, stage);
    return Math.hypot(value[0] - 1, value[1]);
  }));
  assert.ok(Math.hypot(positiveEndpoint[0] - 1, positiveEndpoint[1]) < 1e-15);
  assert.ok(Math.hypot(negativeEndpoint[0] - 1, negativeEndpoint[1]) < 1e-15);
  return { stage, positiveEndpoint, negativeEndpoint, maximumCompactError };
});
assert.ok(normalizedStressChecks.at(-1).maximumCompactError < normalizedStressChecks[0].maximumCompactError);

const prior = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'docs/rh/rss-splice-at-one-halving-results.json'), 'utf8'
));
const observedWindowCounts = Object.fromEntries(Object.entries(prior.finiteDeficitHalvingDiagnostics)
  .map(([origin, schedules]) => [origin, schedules.chronological.map((entry) => entry.criticalLineRootCount)]));
assert.deepEqual(observedWindowCounts, {
  'zeroth-seed': [2, 2, 4, 3],
  'reindexed-fibonacci': [2, 2, 4, 3],
  'boundary-only': [4, 3, 3, 3],
});

const results = {
  analysisDate: '2026-10-14',
  title: 'Attempt to close the splice-at-one halving obstruction',
  question: 'can the escaping-quartet and same-xi invariance obstruction be replaced by a derivable global condition?',
  verdict: {
    rhProved: false,
    pointwiseSameXiInvarianceEstablished: false,
    aggregateResidueContractionDerived: true,
    aggregateResidueClosureInvarianceEstablished: false,
    completeFiniteZeroGenealogyWouldSuffice: true,
    completeFiniteZeroGenealogyEstablished: false,
    endpointNormalizationExcludesEscapingQuartet: false,
    positiveKernelAloneExcludesOffLineZeros: false,
    realRootedConvergentKernelRouteWouldSuffice: true,
    realRootedConvergentKernelRouteEstablished: false,
    conclusion: 'the strongest replacement is an aggregate fixed-point theorem for the exact positive horizontal residue, or a complete no-birth genealogy for all finite zeros. Both would prove RH without assuming pointwise same-xi halving, but neither closure invariance nor genealogy completeness follows from the current TTI arithmetic. Quaternary spectral branching exactly cancels quadratic halving and must not be conflated with carrier branching.',
  },
  aggregateCentralResidue: {
    definition: 'R=sum_quartets 4 eta^2(eta^2+3 gamma^2)/[gamma^2(eta^2+gamma^2)^2]',
    properties: [
      'R is nonnegative and convergent',
      'R=0 if and only if RH',
      'one-to-one horizontal halving strictly contracts every nonzero summand in the critical strip',
    ],
    exactHalvingRatio: 'R(eta/2,gamma)/R(eta,gamma)=(x+12)(x+1)^2/[(x+4)^2(x+3)], x=eta^2/gamma^2',
    contractionChecks,
    conditionalFixedPointTheorem: 'if the completed splice returns the same aggregate spectral residue while halving eta one-to-one, then R=R_after<R unless R=0; hence RH',
    missingBridge: 'derive aggregate residue invariance from the prime-side completed ledger or seam law',
  },
  branchMultiplicity: {
    assessment: branchScaling,
    consequence: 'with four spectral descendants at half displacement, sum eta^2 is exactly conserved and the exact central residue is slightly increased; therefore the four-way carrier event cannot also be assumed to multiply zero quartets in a contraction proof',
  },
  finiteGenealogyRoute: {
    sufficientConditions: [
      'every finite-stage zero has a parent at the preceding stage',
      'every child has half its parent horizontal displacement',
      'there are no unparented births at any height',
      'the finite completions converge locally uniformly to xi',
    ],
    resultingBound: '|Re rho-1/2| <= 2^(-N-1) for every stage-N zero',
    consequence: 'Rouche-Hurwitz transfer then forces every xi zero onto the critical line',
    lineageBounds,
    currentFailure: 'the observed bounded-window counts are nonmonotone and do not define complete parent maps',
    observedWindowCounts,
  },
  escapingDetection: {
    weightedResidues: escapingResidues,
    consequence: 'the convergent central residue weights a fixed-displacement quartet at height phi^N by O(phi^(-4N)), so residue convergence alone cannot detect escape; a supremum or compactified seam norm is required',
  },
  normalizedStressFamily: {
    factor: 'P_hat_N(z)=P_N(z)/P_N(1/2)',
    properties: [
      'even and real under conjugation',
      'equals one at z=+/-1/2, preserving Xi_N(0)=Xi_N(1)=1/2',
      'tends locally uniformly to one',
      'retains the off-line quartet at z=+/-1/4+/-i phi^N',
    ],
    checks: normalizedStressChecks,
    consequence: 'endpoint normalization and the two xi symmetries do not exclude escape',
  },
  canonicalKernelRoute: {
    observation: 'the polynomial stress factor is not shown to remain inside the positive theta-carrier class, so canonical admissibility can exclude this particular perturbation',
    limitation: 'positivity, evenness and log-concavity of a Fourier kernel do not by themselves imply that its transform has only real zeros',
    sufficientTarget: 'construct kernels K_N whose Fourier transforms are real-rooted and which converge to the exact Riemann kernel strongly enough to give local uniform convergence of the transforms',
    literatureContext: 'Pólya-like real-rooted approximations exist, but matching the body of the exact Riemann kernel while preserving real-rootedness remains the unresolved step',
    source: 'https://arxiv.org/abs/1502.06844',
    dyadicRequirement: 'each splice-at-one refinement must preserve the Laguerre-Polya or total-positivity property; positive carrier addition alone is insufficient without an interlacing theorem',
  },
  logicalAssessment: {
    progress: [
      'pointwise same-xi invariance can be weakened to aggregate positive-residue fixed-point invariance',
      'the exact contraction ratio is derived and is close to one quarter in the critical strip',
      'a complete no-birth genealogy gives the required global strip directly',
      'normalizing the escaping factor at s=0 and s=1 does not remove it',
      'quaternary spectral multiplication is incompatible with a quadratic contraction argument',
    ],
    remainingObligations: [
      'derive aggregate residue invariance from TTI rather than postulate it',
      'or prove complete zero genealogy with no births at arbitrary height',
      'or prove a convergent sequence of real-rooted canonical kernel approximations',
      'construct a compactified seam norm that remains coercive at infinite height',
    ],
    status: 'the obstruction is narrowed but not overcome; no proof of RH is obtained',
  },
};

fs.writeFileSync(OUTPUT, `${JSON.stringify(results, null, 2)}\n`);

console.log('Halving-obstruction closure investigation complete.');
console.log(`  One-descendant residue ratios: ${contractionChecks.slice(0, 4).map((entry) => entry.directRatio.toFixed(9)).join(', ')}`);
console.log(`  Four-descendant exact ratio: ${branchScaling[3].exactCentralResidueRatio.toFixed(9)}.`);
console.log('  Endpoint-normalized escaping quartet survives.');
console.log('  Verdict: aggregate and genealogy routes are sufficient but remain underived.');
