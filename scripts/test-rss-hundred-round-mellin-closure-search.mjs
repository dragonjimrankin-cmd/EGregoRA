#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const data = JSON.parse(await read('docs/rh/rss-hundred-round-mellin-closure-search-results.json'));
const report = await read('docs/rh/rss-hundred-round-mellin-closure-search.md');

assert.equal(data.analysisDate, '2026-10-15');
assert.equal(data.protocol.rounds, 100);
assert.equal(data.protocol.ladderTransitions, 10);
assert.equal(data.protocol.mechanismsPerTransition, 10);
assert.equal(data.verdict.roundsCompleted, 100);
assert.equal(data.verdict.successfulClosure, false);
assert.equal(data.verdict.finiteBootstrapPossibleFromTestedStructure, false);
assert.equal(data.verdict.generalFiniteRungSeparationProved, true);
assert.equal(data.verdict.newArithmeticZeroFreeStripProved, false);
assert.equal(data.verdict.rhProved, false);
assert.equal(data.verdict.postSuccessRoundsTriggered, false);

assert.equal(data.mechanisms.length, 10);
assert.equal(data.roundLedger.length, 100);
assert.equal(new Set(data.roundLedger.map((row) => row.round)).size, 100);
assert.ok(data.roundLedger.every((row) => row.earlierRungsFinite));
assert.ok(data.roundLedger.every((row) => !row.nextRungFinite));
assert.ok(data.roundLedger.every((row) => row.mechanismRetained));
assert.ok(data.roundLedger.every((row) => row.result === 'countermodel'));
for (let j = 1; j <= 10; j += 1) {
  const rows = data.roundLedger.filter((row) => row.knownThroughRung === j);
  assert.equal(rows.length, 10);
  assert.equal(new Set(rows.map((row) => row.mechanism)).size, 10);
  assert.ok(rows.every((row) => 2 * row.separatorEta < 1 / j));
  assert.ok(rows.every((row) => 2 * row.separatorEta > 1 / (j + 1)));
}

assert.match(data.generalNoGoTheorem.statement, /every J>=1/);
assert.match(data.generalNoGoTheorem.proof, /convergence is equivalent/);
assert.equal(data.arithmeticRouteScreen.length, 10);
assert.ok(data.arithmeticRouteScreen.some((row) => row.status === 'RH-equivalent'));
assert.ok(data.arithmeticRouteScreen.some((row) => row.status === 'insufficient'));
assert.equal(data.onlyRemainingInputClass.currentlyEstablished, false);
assert.match(data.status, /without a proof/);

for (const marker of [
  'Forty-third-stage investigation',
  'One hundred declared research rounds were completed',
  'Separator proof',
  'Why each retained mechanism fails to bridge the gap',
  'Why interpolation does not cross the next rung',
  'Standard arithmetic routes screened',
  'What a successful next input must look like',
  'Why repeating the same mechanisms cannot help',
  'The hundred rounds did not overcome the obstruction',
  'RH remains open'
]) {
  assert.ok(report.includes(marker), `hundred-round closure report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const ladder = await read('docs/rh/rss-dephased-mellin-ladder.md');
assert.ok(ladder.includes('rss-hundred-round-mellin-closure-search.md'));
const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('rss-hundred-round-mellin-closure-search.md'));
assert.ok(consolidated.includes('One hundred finite-bootstrap rounds prove a separator no-go'));

console.log('Hundred-round Mellin search passed: 100 routes, ten mechanisms, exact separators and finite-bootstrap no-go verified.');
