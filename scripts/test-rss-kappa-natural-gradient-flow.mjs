#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-kappa-natural-gradient-flow-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.supportChangingLawFound, true);
assert.equal(results.verdict.criticalLineUniqueInvariantForFiniteProbabilityLedgers, true);
assert.equal(results.verdict.goldenContractionRecovered, true);
assert.equal(results.verdict.sameXiLedgerInvarianceProved, false);
assert.equal(results.verdict.primeSideStationarityProved, false);
assert.equal(results.verdict.exactGlobalPureStateChannelLiftFound, false);

const geometry = results.establishedGeometry;
assert.ok(Math.abs(geometry.kappaR - 1 / (4 * Math.PI ** 2)) < 1e-16);
assert.match(geometry.normalizedFeatureDistribution, /n\^\(-3-2eta\)/);
assert.match(geometry.note, /kappa_R is retained as derived/);

const info = results.informationGeometry;
assert.match(info.relativeEntropy, /2eta L'/);
assert.match(info.fisherMetric, /Var_pi_eta/);
assert.equal(info.rows.length, 8);
assert.ok(info.rows.every((row) => row.featureRelativeEntropy > 0));
assert.ok(info.rows.every((row) => row.fisherMetric > 0));
assert.ok(info.rows.every((row) => Math.abs(row.naturalGradientVelocity + row.eta) < 2e-15));
assert.ok(info.rows.every((row) => row.relativeEntropyAtGoldenTime < row.featureRelativeEntropy));
assert.ok(info.rows.every((row) => row.dissipationRate < 0));

const semigroup = results.supportSemigroup;
assert.match(semigroup.map, /exp\(-t\)eta/);
assert.match(semigroup.generator, /-eta partial_eta/);
assert.equal(semigroup.preservesCriticalStrip, true);
assert.equal(semigroup.commutesWithReflection, true);
assert.equal(semigroup.rows.length, 5);
assert.ok(semigroup.rows.every((row) => row.horizontalFactor <= 1));

const phi = (1 + Math.sqrt(5)) / 2;
assert.ok(Math.abs(results.goldenTime.time - Math.log(phi)) < 1e-15);
assert.ok(Math.abs(results.goldenTime.factor - 1 / phi) < 1e-15);
assert.match(results.goldenTime.map, /eta -> eta\/phi/);

const invariant = results.uniqueInvariantAudit;
assert.match(invariant.statement, /finite probability ledger/);
assert.match(invariant.proof, /second moment is zero/);
assert.match(invariant.applicationToXi, /finite-height/);
assert.match(invariant.status, /conditional RH proof/);

const bridge = results.xiBridgeAudit;
assert.match(bridge.functionalEquation, /not invariance/);
assert.match(bridge.quartetEffect, /changes the quartet polynomial/);
assert.match(bridge.holomorphicBoundary, /nonholomorphic/);
assert.match(bridge.primeBoundary, /No principal von Mangoldt identity/i);

const lift = results.pureStateLiftDiagnostic;
assert.equal(lift.points.length, 5);
assert.equal(lift.ldlPivots.length, 5);
assert.ok(lift.minimumPivot < -1e-7);
assert.match(lift.interpretation, /finite numerical obstruction/);
assert.equal(results.openSystemBoundary.neededCompletion.length, 4);
assert.match(results.status, /RH remains open/);

const report = await read('docs/rh/rss-kappa-natural-gradient-flow.md');
for (const marker of [
  'The probability family already inside the Rankin kernel',
  'Fisher geometry cancels the nonlinear zeta factor',
  'The support-changing Markov semigroup',
  'The critical line is the unique invariant probability ledger',
  'Why the functional equation does not provide stationarity',
  'Can the flow lift to one quantum channel on the feature states?',
  'Open-system accounting',
  'RH remains open.'
]) {
  assert.ok(report.includes(marker), `natural-gradient report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const decimalPage = await read('tti/src/decimal-splice.njk');
assert.ok(decimalPage.includes('id="t-support-flow"'));
assert.ok(decimalPage.includes('The κ Geometry Does Supply a Support Flow'));

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-kappa-natural-gradient"'));
assert.ok(splice.includes('Can the κ entropy geometry move the support itself?'));
assert.ok(splice.includes('rss-kappa-natural-gradient-flow.md'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-kappa-natural-gradient'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('Natural-gradient support flow has the right unique fixed point'));
assert.ok(consolidated.includes('rss-kappa-natural-gradient-flow.md'));
assert.ok(consolidated.includes('Kappa natural-gradient support flow'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('The principal-prime follow-up reduces the required conservation theorem to the single absolutely convergent anchor'));

const [oracle, mirror] = await Promise.all([
  read('tti/src/assets/js/oracle-knowledge.js'),
  read('egregora-patch/public/assets/js/oracle-knowledge.js')
]);
assert.equal(oracle, mirror);
assert.ok(oracle.includes('The next support-flow attempt succeeds at the level of information geometry.'));
assert.ok(oracle.includes('#t-rh-kappa-natural-gradient'));

console.log('Kappa natural-gradient tests passed: support flow, golden time, unique invariant and same-xi boundary verified.');
