#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/splice-to-action-map-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.candidateMapConstructed, true);
assert.equal(results.verdict.finiteKernelPositiveSemidefinite, true);
assert.equal(results.verdict.euclideanCovariantActionFamilyConstructed, true);
assert.equal(results.verdict.uniqueActionDerived, false);
assert.equal(results.verdict.lorentzianCausalityProved, false);
assert.equal(results.verdict.physicalScaleDerived, false);
assert.equal(results.verdict.gravityOrGaugeNormalisationDerived, false);

assert.deepEqual(results.spliceData.deposits, [1, 1, 2, 3, 5, 8, 13, 21]);
assert.deepEqual(results.spliceData.cumulativeCarriers, [1, 2, 4, 7, 12, 20, 33, 54]);
assert.equal(results.spliceData.frequencies.length, 8);
assert.match(results.positiveKernel.formula, /cos/);
assert.match(results.positiveKernel.proof, />=0/);
assert.equal(results.positiveKernel.checks.length, 3);
assert.ok(results.positiveKernel.checks.every((row) => row.featureSumOfSquares >= 0));

const action = results.actionFamily;
assert.match(action.euclideanAction, /Delta_g/);
assert.match(action.covariance, /diffeomorphism-covariant/);
assert.match(action.heatFormFactor, /exp/);
assert.match(action.resolventFormFactor, /1\+10\^\(-n\)z/);
assert.equal(action.sampleRows.length, 6);
assert.ok(action.sampleRows.every((row) => row.heatFamily >= 0 && row.resolventFamily >= 0));
assert.ok(action.sampleRows.some((row) => Math.abs(row.difference) > 0.1));
assert.match(results.nonuniquenessTheorem.statement, /do not determine a unique/);
assert.equal(results.independentInputsStillRequired.length, 6);
assert.match(results.status, /no unique physical action/);

const report = await read('docs/splice-to-action-map.md');
for (const marker of [
  'Fibonacci cohort data',
  'Exact positive kernel',
  'Covariant Euclidean action family',
  'Exact nonuniqueness result',
  'The independent scale remains explicit',
  'Lorentzian continuation is not automatic',
  'Field content and interactions',
  'What has and has not been derived',
  'Next physical promotion gate',
  'rss-relational-synchronisation-combinations.md'
]) {
  assert.ok(report.includes(marker), `splice-action report missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('../splice-to-action-map.md'));
assert.ok(consolidated.includes('two inequivalent positive form factors prove nonuniqueness'));
assert.ok(consolidated.includes('Splice-to-action map'));

console.log('Splice-to-action map passed: exact PSD kernel, two positive covariant Euclidean form factors, nonuniqueness and unresolved physical inputs verified.');
