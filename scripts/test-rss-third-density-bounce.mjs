#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-third-density-bounce-results.json'));

assert.equal(results.analysisDate, '2026-10-14');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.quotient999BouncePeriodic, true);
assert.equal(results.verdict.carryAwareBouncePeriodic, true);
assert.equal(results.verdict.missingOneProducesContraction, false);
assert.equal(results.verdict.xiContractionSymmetryDerived, false);
assert.equal(results.verdict.contractionZeroSymmetryRhEquivalent, true);

const quotient = results.quotient999Model;
assert.equal(quotient.modulus, 999);
assert.equal(quotient.step, 333);
assert.deepEqual(quotient.orbit, [0, 333, 666]);
assert.equal(quotient.translationOrder, 3);
assert.equal(quotient.group, 'D3');

const carry = results.carryAware1000Model;
assert.equal(carry.modulus, 1000);
assert.equal(carry.gcd, 1);
assert.equal(carry.translationOrder, 1000);
assert.equal(carry.visitsEveryState, true);
assert.deepEqual(carry.firstOrbitStates.slice(0, 10),
  [0, 333, 666, 999, 332, 665, 998, 331, 664, 997]);
assert.deepEqual(carry.firstDescendingOrbitStates.slice(0, 10),
  [999, 666, 333, 0, 667, 334, 1, 668, 335, 2]);
assert.match(carry.exactCarryIdentity, /T_\+\^3\(n\)=n-1/);
assert.match(carry.reverseCarryIdentity, /T_-\^3\(n\)=n\+1/);
assert.match(carry.spectralConsequence, /modulus one/);

assert.equal(results.missingOne.identity, '1000-3*333=1');
assert.match(results.missingOne.role, /drift\/cocycle/);

const contraction = results.affineContractionCandidate;
assert.equal(contraction.combinedBounce,
  'B(n)=R(C(n))=666-n/3; in centered normalized coordinates eta -> -eta/3');
assert.deepEqual(contraction.firstRoute, [999, 666, 333]);
assert.deepEqual(contraction.nextRoute, [333, 444, 555]);
assert.equal(contraction.leavesNamedStationSet, true);

const xi = results.completedXiDiagnostics;
assert.ok(xi.xiAtFirstZero.absolute < 2e-16);
assert.ok(xi.xiAtQuotientTranslationImage.absolute > 1e-4);
assert.ok(xi.xiAtCarryTranslationImage.absolute > 1e-4);
assert.ok(xi.maximumFunctionalEquationError < 3e-13);
assert.ok(xi.contractionSamples.every((entry) => entry.absoluteDifference > 1e-4));

assert.match(results.bounceContractionLemma.statement, /finite point/);
assert.match(results.bounceContractionLemma.status, /equivalent to RH/);
assert.match(results.primeSideAssessment.requiredTheorem, /immediately prove RH/);

const report = await read('docs/rh/rss-third-density-bounce.md');
for (const marker of [
  'Closing at 999 gives a three-cycle',
  'The carry changes \\(D_3\\) into a 1000-state orbit',
  'The missing one is a drift, not damping',
  'Where the apparent factor \\(1/3\\) comes from',
  'The bounce-contraction lemma',
  'Why equal bouncing does not erase the positive residue',
  'Möbius extraction does not generate the contraction',
  'No proof of RH is obtained'
]) {
  assert.ok(report.includes(marker), `third-density bounce report is missing: ${marker}`);
}

const publicSplice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(publicSplice.includes('id="t-rh-third-density-bounce"'));
assert.ok(publicSplice.includes('T^3(n)=n-1'));
assert.ok(publicSplice.includes('bounce-contraction lemma'));

const builtSplice = await read('tti/_site/riemann-splice-questions/index.html');
assert.ok(builtSplice.includes('id="t-rh-third-density-bounce"'));
assert.ok(builtSplice.includes('The missing one creates drift, not contraction'));

const publicAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(publicAudit.includes('/riemann-splice-questions/#t-rh-third-density-bounce'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('The missing-one carry produces drift, not xi contraction'));
assert.ok(consolidated.includes('rss-third-density-bounce.md'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('The eleventh-stage bounce test distinguishes two exact finite dynamics'));

console.log('Third-density bounce passed: D3 quotient, D1000 carry orbit, missing-one drift, xi diagnostics and RH-equivalent contraction lemma verified.');
