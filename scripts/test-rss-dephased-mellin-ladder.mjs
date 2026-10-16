#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const data = JSON.parse(await read('docs/rh/rss-dephased-mellin-ladder-results.json'));
const report = await read('docs/rh/rss-dephased-mellin-ladder.md');

assert.equal(data.analysisDate, '2026-10-15');
assert.equal(data.verdict.uniformFrameBoundProved, false);
assert.equal(data.verdict.countableMellinCriterionEquivalentToRh, true);
assert.equal(data.verdict.allFiniteRenyiCriterionEquivalentToRh, true);
assert.equal(data.verdict.probabilityNormalizationClosesFirstMellinRung, true);
assert.equal(data.verdict.firstNontrivialMellinRungProved, false);
assert.equal(data.verdict.dephasingAloneSuppliesHigherRungs, false);
assert.equal(data.verdict.rhProved, false);

assert.match(data.mellinLadder.definition, /P_xi/);
assert.match(data.mellinLadder.divergenceCondition, /2eta>=1\/j/);
assert.match(data.mellinLadder.equivalence, /RH iff/);
assert.equal(data.mellinLadder.rungs.length, 12);
assert.equal(data.mellinLadder.rungs[0].automaticFromProbabilityNormalization, true);
assert.ok(data.mellinLadder.rungs.slice(1).every((row) => !row.automaticFromProbabilityNormalization));
assert.equal(data.mellinLadder.rungs[1].etaExclusionThreshold, 0.25);

assert.match(data.renyiLadder.divergenceCondition, /qeta>=1\/2/);
assert.match(data.renyiLadder.equivalence, /RH iff/);
assert.equal(data.renyiLadder.rungs[0].etaExclusionThreshold, 0.25);
assert.equal(data.firstRungs.j2Status.startsWith('unproved'), true);

assert.match(data.structuralCounterexample.state, /0\.1/);
assert.match(data.structuralCounterexample.failure, /A_5 diverges/);
assert.equal(data.structuralCounterexample.propertiesRetained.length, 6);
assert.equal(data.toyDiagnostics.length, 6);
assert.ok(data.toyDiagnostics.every((row) => row.partialRows.length === 4));
assert.equal(data.toyDiagnostics.find((row) => row.eta === 0.1 && row.j === 5).predictedStatus, 'diverges');
assert.equal(data.toyDiagnostics.find((row) => row.eta === 0.25 && row.j === 2).predictedStatus, 'diverges');
assert.match(data.arithmeticBoundary.weakestDisplayedNewTarget, /A_2/);
assert.match(data.status, /remains open/);

for (const marker of [
  'Forty-second-stage investigation',
  'Exact Mellin threshold of one off-line component',
  'The first rungs',
  'Rényi version',
  'Why the established structure does not imply the next rung',
  'Mellin-transform interpretation',
  'A_2<\\infty',
  'The obstruction has been narrowed, not overcome',
  'RH remains open'
]) {
  assert.ok(report.includes(marker), `dephased Mellin ladder report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const dephasing = await read('docs/rh/rss-logarithmic-dephasing.md');
assert.ok(dephasing.includes('rss-dephased-mellin-ladder.md'));
const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('rss-dephased-mellin-ladder.md'));
assert.ok(consolidated.includes('The dephased frame bound has a countable Mellin ladder'));

console.log('Dephased Mellin ladder passed: negative moments, Renyi strips, first-rung boundary and off-line countermodel verified.');
