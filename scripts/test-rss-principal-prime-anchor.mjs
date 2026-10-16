#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const results = JSON.parse(await read('docs/rh/rss-principal-prime-anchor-results.json'));

assert.equal(results.analysisDate, '2026-10-15');
assert.equal(results.verdict.rhProved, false);
assert.equal(results.verdict.independentConservationLawProved, false);
assert.equal(results.verdict.onePointEulerCriterionDerived, true);
assert.equal(results.verdict.onePointCriterionEquivalentToRh, true);
assert.equal(results.verdict.quantitativeResidueBridgeDerived, true);

const anchor = results.eulerAnchor;
assert.match(anchor.point, /s=2/);
assert.match(anchor.completedPrimeIdentity, /Lambda\(n\)\/n\^2/);
assert.equal(anchor.absoluteConvergence, true);
assert.ok(Math.abs(anchor.completedAnchorNumerical - 0.06906623153) < 2e-11);
assert.equal(anchor.primePowerPartial.limit, 1_000_000);
assert.ok(anchor.primePowerPartial.terms > 78_000);
assert.ok(Math.abs(anchor.primePowerPartial.completedAnchorFromPartial - anchor.completedAnchorNumerical) < 2e-6);
assert.match(anchor.ordinateAnchor, /gamma_rho/);
assert.match(anchor.defectConsequence, /RH/);

const variation = results.quartetAnchorVariation;
assert.match(variation.anchorDerivative, /8eta\^2/);
assert.match(variation.signAtTwo, /strictly positive/);
assert.equal(variation.rows.length, 9);
assert.ok(variation.rows.every((row) => row.ordinateMinusExactAnchor > 0));
assert.ok(variation.rows.every((row) => row.anchorTimeDerivative > 0));
assert.ok(variation.rows.every((row) => row.residueDissipationMagnitude > 0));

const bridge = results.coerciveResidueComparison;
assert.ok(bridge.decimalLowerBound > 1.42);
assert.ok(bridge.decimalUpperBound < 1.53);
assert.ok(variation.rows.every((row) => row.variationRatio > bridge.decimalLowerBound));
assert.ok(variation.rows.every((row) => row.variationRatio < bridge.decimalUpperBound));
assert.match(bridge.consequence, /RH/);

assert.match(results.onePointEquivalence.statement, /RH iff/);
assert.match(results.onePointEquivalence.gain, /one absolutely convergent/);
assert.equal(results.conservationAudit.length, 6);
assert.match(results.missingTheorem.minimalForm, /xi_t'\/xi_t\(2\)/);
assert.match(results.missingTheorem.status, /not established/);
assert.match(results.status, /RH remains open/);

const report = await read('docs/rh/rss-principal-prime-anchor.md');
for (const marker of [
  'An absolutely convergent prime anchor',
  'The ordinate anchor and its positive defect',
  'First variation at the Euler anchor',
  'Quantitative bridge to horizontal-residue dissipation',
  'Why the static prime moment is not yet a conservation law',
  'Candidate conservation mechanisms tested',
  'Minimal missing theorem',
  'RH remains open.'
]) {
  assert.ok(report.includes(marker), `principal-prime anchor report is missing: ${marker}`);
}
assert.doesNotMatch(report, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

const decimalPage = await read('tti/src/decimal-splice.njk');
assert.ok(decimalPage.includes('id="t-principal-prime-anchor"'));
assert.ok(decimalPage.includes('One Euler Anchor Is Enough'));

const splice = await read('tti/src/riemann-splice-questions.njk');
assert.ok(splice.includes('id="t-rh-principal-prime-anchor"'));
assert.ok(splice.includes('Can one principal-prime scalar force the residue variation to vanish?'));
assert.ok(splice.includes('rss-principal-prime-anchor.md'));

const proofAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(proofAudit.includes('/riemann-splice-questions/#t-rh-principal-prime-anchor'));

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('One Euler anchor is enough'));
assert.ok(consolidated.includes('rss-principal-prime-anchor.md'));
assert.ok(consolidated.includes('Principal-prime one-point conservation search'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('The principal-prime follow-up reduces the required conservation theorem to the single absolutely convergent anchor'));

const [oracle, mirror] = await Promise.all([
  read('tti/src/assets/js/oracle-knowledge.js'),
  read('egregora-patch/public/assets/js/oracle-knowledge.js')
]);
assert.equal(oracle, mirror);
assert.ok(oracle.includes('The principal-prime follow-up reduces the target to one Euler anchor at s equals 2.'));
assert.ok(oracle.includes('#t-rh-principal-prime-anchor'));

console.log('Principal-prime anchor tests passed: s=2 criterion, positive quartet variation, coercive residue bridge and missing Euler-flow compatibility verified.');
