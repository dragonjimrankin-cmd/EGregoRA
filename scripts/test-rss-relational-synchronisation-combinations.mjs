#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

const data = JSON.parse(await read('docs/rh/rss-relational-synchronisation-combinations-results.json'));
const report = await read('docs/rh/rss-relational-synchronisation-combinations.md');

assert.equal(data.analysisDate, '2026-10-15');
assert.equal(data.verdict.relationalSynchronisationModelIsMathematicallyCoherent, true);
assert.equal(data.verdict.positiveFibonacciSpliceProximityGraphConstructed, true);
assert.equal(data.verdict.allNonemptyMechanismCombinationsTested, 127);
assert.equal(data.verdict.combinationProvesRh, false);
assert.equal(data.verdict.rhRemainsOpen, true);

assert.equal(data.mechanisms.length, 7);
assert.deepEqual(data.combinationCensus.categoryCounts, {
  'same-divisor but horizontal-support-inert': 15,
  'finite support contraction of a different divisor': 48,
  'critical projection of a different divisor': 64
});
assert.equal(data.combinationCensus.nonemptyCombinations, 127);
assert.equal(data.combinationCensus.rows.length, 127);
assert.equal(data.combinationCensus.validRhProofs, 0);
assert.equal(data.combinationCensus.pairwiseSectorMapsCommute, true);
assert.ok(data.combinationCensus.rows.every((row) => row.provesRhForOriginalXi === false));

const sameXi = data.combinationCensus.rows.filter((row) => row.preservesOriginalXiForOffLineQuartet);
assert.equal(sameXi.length, 15);
assert.ok(sameXi.every((row) => row.finalEta === '0.25'));

const projected = data.combinationCensus.rows.filter((row) => row.forcesCriticalSupportInTransformedState);
assert.equal(projected.length, 64);
assert.ok(projected.every((row) => row.preservesOriginalXiForOffLineQuartet === false));

const phaseRows = data.twoBeingPhaseLock.distanceRows;
assert.deepEqual(phaseRows.map((row) => row.phaseLocked), [true, true, false, false]);
assert.equal(data.twoBeingPhaseLock.commonPiShiftChangesRelativePhase, false);
assert.ok(data.twoBeingPhaseLock.clockAlignments.every((row) => row.scalesMatch));
assert.ok(data.twoBeingPhaseLock.clockAlignments.every((row) => !row.identifiesPhaseWithHorizontalSupport));

assert.equal(data.relationalHorizontalConsensus.finiteTimeCollision, false);
assert.equal(data.relationalHorizontalConsensus.changesQuartetPolynomialWhenEtaNonzero, true);
assert.equal(data.relationalHorizontalConsensus.sameXiInvarianceProved, false);

const graph = data.fibonacciSpliceProximityGraph;
assert.equal(graph.nodes, 16);
assert.deepEqual(graph.cohorts, [1, 1, 2, 3, 5, 8, 13, 21]);
assert.equal(graph.connected, true);
assert.equal(graph.positiveSemidefinite, true);
assert.equal(graph.energyDecreases, true);
assert.equal(graph.finiteTimeStateIsNonzero, true);
assert.equal(graph.sameXiInvarianceProved, false);
assert.ok(Math.abs(graph.laplacianRowSumError) < 1e-12);
assert.ok(graph.eigenvalues[1] > 0);
assert.ok(graph.energyAtT10 < graph.energyAtT1);
assert.ok(graph.energyAtT1 < graph.initialCoherenceEnergy);
assert.ok(graph.initialEnergyDerivative < 0);

const [control, phaseOnly, golden, half, both, projection, high] = data.diagnosticStress;
assert.equal(control.phaseDefect, phaseOnly.phaseDefect);
assert.equal(phaseOnly.phaseHalfAngleQ, '0');
assert.equal(phaseOnly.negativeSquaresForOneFullQuartet, 2);
assert.ok(Number(golden.phaseDefect) < Number(control.phaseDefect));
assert.ok(Number(half.phaseDefect) < Number(control.phaseDefect));
assert.ok(Number(both.phaseDefect) > 0);
assert.equal(projection.phaseDefect, '0');
assert.equal(projection.negativeSquaresForOneFullQuartet, 0);
assert.notEqual(projection.quartetFactorZ2Coefficient, control.quartetFactorZ2Coefficient);
assert.ok(Number(high.phaseDefect) > 0);
assert.ok(Number(high.phaseDefect) < Number(control.phaseDefect));
assert.equal(high.negativeSquaresForOneFullQuartet, 2);

for (const marker of [
  'Thirty-sixth-stage investigation',
  'combinations in total',
  'Perfect phase synchrony and maximal reflection balance can coexist with a nonzero horizontal displacement',
  'Fibonacci cohorts plus the splice kernel',
  'principal-prime invariance remains missing',
  'no tested combination proves RH',
  'rss-relational-defect-transport.md'
]) {
  assert.ok(report.includes(marker), `combination report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('rss-relational-synchronisation-combinations.md'));
assert.ok(consolidated.includes('Relational synchronisation combines the clocks but not the sectors'));

console.log('Relational synchronisation combinations passed: 127 mechanism subsets, phase/branch/support separation, positive Fibonacci consensus graph and same-xi obstruction verified.');
