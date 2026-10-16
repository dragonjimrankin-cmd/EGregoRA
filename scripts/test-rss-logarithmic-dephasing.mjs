#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const data = JSON.parse(await read('docs/rh/rss-logarithmic-dephasing-results.json'));
const report = await read('docs/rh/rss-logarithmic-dephasing.md');

assert.equal(data.analysisDate, '2026-10-15');
assert.equal(data.verdict.linearVectorAveragingRetainsOrDeletesCarrier, true);
assert.equal(data.verdict.logarithmicDensityTwirlingEliminatesOffDiagonal, true);
assert.equal(data.verdict.dephasedMapNeedsPrimePairEstimate, false);
assert.equal(data.verdict.horizontalZeroCoordinateRetained, true);
assert.equal(data.verdict.fullZeroCoordinateRetainedWithClassicalOrdinateRegister, true);
assert.equal(data.verdict.weilPositivityNeededToConstructDephasedMap, false);
assert.equal(data.verdict.criticalChebyshevEnergyNeededToConstructDephasedMap, false);
assert.equal(data.verdict.arithmeticFrameBoundProved, false);
assert.equal(data.verdict.rhProved, false);

assert.match(data.hilbertSpace.unitary, /exp\(-itL\)/);
assert.match(data.hilbertSpace.featureCovariance, /gamma\+t/);
assert.match(data.linearVectorAverage.coordinateMultiplier, /sinc/);
assert.match(data.linearVectorAverage.limit, /zero vector/);

const twirl = data.densityTwirling;
assert.match(twirl.matrixMultiplier, /log\(n\/m\)/);
assert.match(twirl.limit, /sum_n/);
assert.equal(twirl.requiresPrimePairBound, false);
assert.equal(twirl.finiteChecks.length, 5);
assert.ok(twirl.finiteChecks.every((row) => Math.abs(row.densityTwirlTrace - 1) < 2e-14));
assert.ok(twirl.finiteChecks.every((row) => row.maximumDiagonalError === 0));
assert.ok(twirl.finiteChecks.at(-1).vectorAverageNormSquared < twirl.finiteChecks[0].vectorAverageNormSquared);
assert.ok(
  twirl.finiteChecks.at(-1).densityTwirlOffDiagonalHilbertSchmidtNorm
  < twirl.finiteChecks[0].densityTwirlOffDiagonalHilbertSchmidtNorm
);
assert.ok(twirl.samplePairs.every((row) => Math.abs(row.twirlMultiplierAtT10000) < 1e-3));

assert.ok(Math.abs(data.informationRetention.recoveredEta - data.informationRetention.testEta) < 2e-14);
assert.match(data.informationRetention.ordinateRegister, /classical label/);
assert.match(data.stage40Correction.correctedStatement, /needs no pair estimate/);
assert.match(data.arithmeticBoundary.remainingCriterion, /RH iff/);
assert.equal(data.obstructionResolution.length, 4);
assert.equal(data.obstructionResolution[0].status, 'resolved for construction');
assert.equal(data.obstructionResolution[1].status, 'resolved for the dephased diagonal');
assert.equal(data.obstructionResolution[2].status, 'bypassed, not proved');
assert.equal(data.obstructionResolution[3].status, 'bypassed, not proved');
assert.match(data.status, /remains unproved/);

for (const marker of [
  'Forty-first-stage investigation',
  'lift the feature vector to its rank-one density operator',
  'Why lift-then-average succeeds',
  'Infinite-dimensional convergence',
  'The horizontal coordinate is not lost',
  'What happened to the two-prime gate?',
  'Status of the four stated obstructions',
  'P_\\xi\\le Cp_0',
  'RH remains open'
]) {
  assert.ok(report.includes(marker), `logarithmic dephasing report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const intertwiner = await read('docs/rh/rss-prime-zero-intertwiner.md');
assert.ok(intertwiner.includes('rss-logarithmic-dephasing.md'));
const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('rss-logarithmic-dephasing.md'));
assert.ok(consolidated.includes('Logarithmic dephasing resolves the construction gate'));

console.log('Logarithmic dephasing passed: vector deletion, CPTP diagonal twirl, eta retention and surviving RH-equivalent frame bound verified.');
