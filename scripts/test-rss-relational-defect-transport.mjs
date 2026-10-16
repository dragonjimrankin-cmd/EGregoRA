#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const data = JSON.parse(await read('docs/rh/rss-relational-defect-transport-results.json'));
const report = await read('docs/rh/rss-relational-defect-transport.md');

assert.equal(data.analysisDate, '2026-10-15');
assert.equal(data.verdict.closedAnchorConservingNetworkCanEliminatePositiveDefect, false);
assert.equal(data.verdict.defectCanBeTransferredBetweenQuartets, true);
assert.equal(data.verdict.subsystemDefectCanBeExportedToReservoir, true);
assert.equal(data.verdict.oneAnchorCanBeCounterfeitedByOrdinateMotion, true);
assert.equal(data.verdict.finiteAnchorsDetermineFullDivisor, false);
assert.equal(data.verdict.openSetLogDerivativeDeterminesDivisor, true);
assert.equal(data.verdict.rhProved, false);

const transfer = data.closedDefectTransfer.rows;
assert.equal(transfer.length, 5);
assert.ok(transfer.every((row) => Number(row.totalConservedError) < 1e-70));
assert.equal(transfer[0].negativeSquares, 4);
assert.equal(transfer.at(-1).eta1, '0');
assert.ok(Number(transfer.at(-1).eta2) > 0.2);
assert.equal(transfer.at(-1).negativeSquares, 2);
assert.ok(transfer.every((row) => row.bothCritical === false));

const reservoir = data.openSystemReservoir;
assert.equal(reservoir.rows.length, 13);
assert.ok(reservoir.rows.every((row) => row.closedTotal === reservoir.rows[0].closedTotal));
assert.ok(reservoir.rows.every((row) => row.conservationError === '0'));
assert.ok(Number(reservoir.rows.at(-1).systemDefect) < Number(reservoir.rows[0].systemDefect));
assert.ok(Number(reservoir.rows.at(-1).exportedDefect) > 0);
assert.equal(reservoir.capacityRows.length, 4);
assert.ok(reservoir.capacityRows.at(-1).quartetsRequiredToHoldExportedToyDefect > 1e18);

const counterfeit = data.counterfeitSingleAnchor;
assert.equal(counterfeit.projectedEta, '0');
assert.ok(Number(counterfeit.shiftedGamma) > Number(counterfeit.originalGamma));
assert.equal(counterfeit.sameDivisor, false);
assert.equal(counterfeit.zeroCountingMeasurePreserved, false);
assert.deepEqual(counterfeit.rows.map((row) => row.preserved), [false, true, false, false]);
assert.ok(Math.abs(Number(counterfeit.rows[1].difference)) < 1e-70);
assert.ok(counterfeit.rows.filter((row) => !row.preserved).every((row) => Number(row.difference) !== 0));

const jacobian = data.finiteAnchorJacobian;
assert.equal(jacobian.variables.length, 6);
assert.equal(jacobian.anchorsW.length, 3);
assert.equal(jacobian.rank, 3);
assert.equal(jacobian.nullity, 3);
assert.ok(Math.max(...jacobian.nullResidual.map(Math.abs)) < 1e-10);
assert.ok(jacobian.firstOrderNullDirection.some((value) => Math.abs(value) > 1e-4));
assert.equal(data.rigidityHierarchy.length, 5);
assert.match(data.conditionalClosure.missingTheorem, /no proximity/);
assert.match(data.status, /RH remains open/);

for (const marker of [
  'Thirty-seventh-stage investigation',
  'Closed systems: bringing one participant into phase transfers the defect',
  'Open systems: the environment stores the exported obstruction',
  'Why the single anchor needs the fixed-ordinate flow',
  'Several anchors still leave collective deformation directions',
  'Open-set rigidity returns the original obstruction',
  'Relational synchronisation can transport the obstruction, but it does not annihilate it.'
]) {
  assert.ok(report.includes(marker), `defect-transport report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const combinations = await read('docs/rh/rss-relational-synchronisation-combinations.md');
assert.ok(combinations.includes('rss-relational-defect-transport.md'));
const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('rss-relational-defect-transport.md'));
assert.ok(consolidated.includes('Relational coherence transports a conserved defect'));

console.log('Relational defect transport passed: closed transfer, open reservoir export, one-anchor counterfeit, finite-anchor nullspace and open-set rigidity verified.');
