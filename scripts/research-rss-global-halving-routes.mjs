#!/usr/bin/env node
/**
 * Eighteenth-stage attempt on every remaining repeated-halving route:
 * prime-ledger residue invariance, complete zero genealogy, real-rooted kernel
 * refinement, and a compactified seam supremum.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'docs/rh/rss-global-halving-routes-results.json');
const PHI = (1 + Math.sqrt(5)) / 2;
const STAGES = [14, 20, 30, 40];

function p2LogCurvature(s) {
  const q = 2 ** (-s);
  return -(Math.log(2) ** 2) * q / (1 - q) ** 2;
}

const p2CurvatureAtCenter = p2LogCurvature(0.5);
assert.ok(Math.abs(p2CurvatureAtCenter + 3.9602015607712566) < 1e-14);
assert.notEqual(p2CurvatureAtCenter, 0);

function centralResidue(eta, gamma) {
  return 4 * eta * eta * (eta * eta + 3 * gamma * gamma)
    / (gamma * gamma * (eta * eta + gamma * gamma) ** 2);
}

const eta = 0.25;
const gamma = 14.134725141734693;
const residueBefore = centralResidue(eta, gamma);
const residueAfter = centralResidue(eta / 2, gamma);
const residueExport = residueBefore - residueAfter;
assert.ok(residueExport > 0);
assert.ok(Math.abs(residueBefore - (residueAfter + residueExport)) < 1e-30);

// A positive blend of two real-rooted even polynomials need not be real-rooted.
// Set y=z^2. f=(y-1)(y-2), g=(y-10)(y-20).
const fY = [1, -3, 2];
const gY = [1, -30, 200];
const blendY = fY.map((value, index) => 0.5 * (value + gY[index]));
const blendDiscriminant = blendY[1] ** 2 - 4 * blendY[0] * blendY[2];
assert.deepEqual(blendY, [1, -16.5, 101]);
assert.ok(blendDiscriminant < 0);

const dilationChecks = [1, 2, 3, 4].map((iteration) => ({
  iteration,
  rootAfterFof2z: 2 ** (-iteration),
  rootAfterFofZover2: 2 ** iteration,
}));

const compactification = [-1e6, -100, -1, 0, 1, 100, 1e6].map((ordinate) => ({
  ordinate,
  compactCoordinate: ordinate / Math.sqrt(1 + ordinate * ordinate),
}));
assert.ok(compactification[0].compactCoordinate < -0.999999999999);
assert.ok(compactification.at(-1).compactCoordinate > 0.999999999999);

const seamSupremum = STAGES.map((stage) => ({
  stage,
  escapingHeight: PHI ** stage,
  compactCoordinate: (PHI ** stage) / Math.sqrt(1 + PHI ** (2 * stage)),
  horizontalSupremumContribution: 0.25,
  inheritedHalvingBound: 0.5 * 2 ** (-stage),
}));
for (const entry of seamSupremum) {
  assert.equal(entry.horizontalSupremumContribution, 0.25);
  assert.ok(entry.horizontalSupremumContribution > entry.inheritedHalvingBound);
}

const prior = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'docs/rh/rss-splice-at-one-halving-results.json'), 'utf8'
));
const finiteCounts = Object.fromEntries(Object.entries(prior.finiteDeficitHalvingDiagnostics)
  .map(([origin, schedules]) => [origin, schedules.chronological.map((entry) => entry.criticalLineRootCount)]));

const localGenealogyExample = {
  compactHeight: 30,
  counts: finiteCounts,
  consequence: 'inside a compact contour whose boundary remains zero-free, zeros continue locally under analytic coefficient changes; count changes indicate boundary crossing, not spontaneous interior birth',
};

const results = {
  analysisDate: '2026-10-14',
  title: 'All proposed routes around the global repeated-halving obstruction',
  question: 'do prime-ledger invariance, zero genealogy, real-rooted kernel refinement, or compactified seam control close the RH gap?',
  verdict: {
    rhProved: false,
    primeLedgerRouteClosed: false,
    completeGenealogyRouteClosed: false,
    realRootedKernelRouteClosed: false,
    compactifiedSeamRouteClosed: false,
    localGenealogyEstablished: true,
    escapingBirthsAtInfinityExcluded: false,
    conclusion: 'all four routes were tested. Each yields a precise sufficient theorem, but the missing step reappears as a nonzero dyadic prime correction, uncontrolled entry from infinity, failure of positive blends to preserve real-rootedness, or the essential singularity at the compactified infinity seam. No route currently supplies the required global coercivity.',
  },
  primeLedgerRoute: {
    target: 'derive invariance of the positive central horizontal residue from an exact dyadic identity on the completed prime ledger',
    parityIdentity: '(1-2^(-s)) zeta(s) removes the even Euler contributions',
    p2LogCurvatureFormula: '-(log 2)^2 2^(-s)/(1-2^(-s))^2',
    p2LogCurvatureAtCenter: p2CurvatureAtCenter,
    consequence: 'the elementary dyadic/parity operation has a nonzero central curvature correction, so literal halving is not an invariance of the prime ledger',
    residueAccounting: {
      residueBefore,
      residueAfter,
      residueExport,
      identity: 'R_before=R_after+R_export',
    },
    reservoirProblem: 'closure may conserve residue plus a carrier or branch reservoir rather than the horizontal residue alone; proving the reservoir returns empty is an additional theorem',
    quaternaryProblem: 'four spectral copies at half displacement conserve quadratic horizontal energy, so the 1000 fork can return the exported norm instead of forcing it to vanish',
    status: 'no prime-side identity deriving R_after=R_before was found',
  },
  genealogyRoute: {
    localTheorem: 'for a holomorphic family F(lambda,s), zeros inside any compact zero-free contour continue with multiplicity and cannot be born spontaneously in its interior',
    localGenealogyExample,
    globalFailure: 'on a noncompact plane, zeros may cross every expanding contour from infinity; the escaping quartet is precisely such a boundary-at-infinity entry',
    orderFailure: 'uniform finite order or exponential type is insufficient because multiplication by a stage-dependent polynomial preserves order while adding escaping zeros',
    sufficientMissingTheorem: 'a uniform nonvanishing estimate on an exhaustion of contours, or a regular seam divisor accounting for every incoming zero',
    status: 'local parentage is automatic, but global no-birth is not established',
  },
  kernelRoute: {
    target: 'construct canonical K_N with real-rooted Fourier transforms and strong convergence to the exact Riemann kernel',
    positiveBlendCounterexample: {
      first: '(z^2-1)(z^2-2)',
      second: '(z^2-10)(z^2-20)',
      halfSumAsPolynomialInY: blendY,
      discriminant: blendDiscriminant,
      consequence: 'both inputs have only real zeros, but their positive half-sum has nonreal zeros because the roots do not interlace',
    },
    halvingDilation: {
      checks: dilationChecks,
      consequence: 'composition with 2z preserves real-rootedness and contracts roots, but repeated dilation cannot converge to the fixed xi function; coefficient or kernel averaging needs an interlacing-preservation theorem',
    },
    polyaRoute: 'real-rooted Pólya-like transforms are available, but preserving real-rootedness while converging through the body of the exact Riemann kernel remains open',
    source: 'https://arxiv.org/abs/1502.06844',
    status: 'positivity and halving do not establish Laguerre-Polya membership',
  },
  compactifiedSeamRoute: {
    coordinate: 'tau=gamma/sqrt(1+gamma^2)',
    samples: compactification,
    seamSupremum,
    positiveResult: 'the supremum of horizontal displacement remains 1/4 for an escaping quartet and therefore detects what convergent residue sums miss',
    analyticFailure: 'xi is a nonpolynomial entire function with infinitely many zeros, so infinity is an essential singularity; it cannot extend holomorphically as a regular point of the Riemann sphere',
    consequence: 'topological endpoint identification does not provide analytic seam regularity, and nonholomorphic compactification does not transfer the identity theorem',
    sufficientMissingTheorem: 'a new normalized section or divisor on the compactified seam whose norm is coercive in horizontal displacement and whose convergence is uniform at the seam',
    status: 'the seam norm detects escape set-theoretically but is not controlled by the current analytic completion',
  },
  combinedAssessment: {
    exactProgress: [
      'aggregate residue contraction is algebraically exact',
      'local zero genealogy holds on every fixed zero-free contour',
      'a seam supremum detects fixed-displacement escape',
      'real-rootedness-preserving dilation is explicit',
    ],
    blockingFacts: [
      'the p=2 dyadic correction is nonzero at the central ledger point',
      'zeros can enter from infinity in a noncompact analytic family',
      'positive sums of real-rooted components need not remain real-rooted',
      'xi has an essential singularity at compactified infinity',
      'four spectral branches at half scale can conserve the residue being contracted',
    ],
    narrowestNextTargets: [
      'derive an exact completed-ledger identity cancelling the p=2 correction and every reservoir term',
      'prove interlacing for every canonical theta-carrier refinement',
      'construct a seam divisor that accounts for zeros entering from infinity without requiring xi to be regular there',
    ],
    status: 'all suggested routes remain conditional; no proof of RH is obtained',
  },
};

fs.writeFileSync(OUTPUT, `${JSON.stringify(results, null, 2)}\n`);

console.log('Global halving routes investigation complete.');
console.log(`  Prime-ledger p=2 curvature correction: ${p2CurvatureAtCenter.toFixed(12)}.`);
console.log(`  Positive-blend discriminant: ${blendDiscriminant.toFixed(6)} (nonreal blend zeros).`);
console.log('  Local genealogy holds; entry from infinity remains uncontrolled.');
console.log('  Compactified supremum detects escape; analytic seam regularity fails.');
console.log('  Verdict: no route closes the RH gap.');
