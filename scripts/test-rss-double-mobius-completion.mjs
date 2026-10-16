#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

const result = JSON.parse(await read('docs/rh/rss-double-mobius-completion-results.json'));

assert.equal(result.analysisDate, '2026-10-14');
assert.equal(result.verdict.weilPositivityProved, false,
  'the finite experiment must not be promoted into Weil positivity');
assert.equal(result.verdict.secondInversionExistsAsExactBlockInvolution, true);
assert.equal(result.verdict.inducesCanonicalWeilCompletion, false);

const algebra = result.operatorAlgebra;
assert.equal(algebra.maximumMZError, 0, 'MZ must be the identity');
assert.equal(algebra.maximumZMError, 0, 'ZM must be the identity');
assert.ok(algebra.maximumM2IdentityError > 1, 'M squared must remain visibly different from I');
assert.equal(algebra.maximumP2IdentityError, 0, 'the doubled operator must square to I');
assert.ok(algebra.maximumTransportedMetricInvarianceError < 1e-12,
  'the transported metric must be invariant');
assert.ok(algebra.euclideanOrthogonalityDefect > 1,
  'P must not be misreported as Euclidean-orthogonal');

const growth = result.featureTest.rawPrimitiveNormGrowth;
assert.ok(growth.length >= 6, 'the cutoff study is too short');
assert.ok(growth.at(-1).rawNormSquared > 50 * growth[0].rawNormSquared,
  'the unweighted primitive norm should expose divergence');
assert.ok(growth.at(-1).greenNormSquared < 1.02 * growth.at(-2).greenNormSquared,
  'the Green norm should stabilise with cutoff');
assert.ok(result.featureTest.maximumInverseReturnFeatureError < 1e-12,
  'inverse second passage must return the original feature');

const comparisons = result.screwComparison.completionComparisons;
assert.ok(comparisons.length >= 6, 'the screw comparison needs several truncations');
for (const comparison of comparisons) {
  assert.ok(comparison.inverseReturnError < 1e-12);
  assert.ok(comparison.originalMinimumPivot > 0);
  assert.ok(comparison.primitiveAdjointMinimumPivot > 0);
  assert.ok(comparison.repeatedMinimumPivot > 0);
}
assert.ok(comparisons.at(-1).primitiveAdjointFit.fittedResidual > 0.7,
  'the candidate should remain quantitatively separated from the screw target');

const discriminator = result.localRegularityNoGo.smallTDiscriminator;
assert.ok(discriminator.at(-1).targetOverTSquared > 100 * discriminator[0].targetOverTSquared,
  'the target cusp must diverge after division by t squared');
const greenRatios = discriminator.slice(-3).map((row) => row.greenDualOverTSquared);
assert.ok(Math.max(...greenRatios) - Math.min(...greenRatios) < 1e-7,
  'the Green completion should retain its quadratic small-t signature');
assert.ok(result.allIntegerReturnVsXiPick.equalSumPickDefect > 1e-4,
  'the xi Pick kernel must remain distinct from a combined-argument ledger kernel');

const report = await read('docs/rh/rss-double-mobius-weil-completion.md');
for (const marker of [
  'The canonical double inversion restores the positive repetition ledger',
  'The ordinary adjoint completion is unbounded',
  'Exact local-regularity obstruction',
  'history-bearing cocycle on the doubled inversion space'
]) {
  assert.ok(report.includes(marker), `operator audit is missing: ${marker}`);
}

const consolidated = await read('docs/rh/RH_CONSOLIDATED_AUDIT.md');
assert.ok(consolidated.includes('Double Möbius inversion does not supply the promotion'));
assert.ok(consolidated.includes('rss-double-mobius-weil-completion.md'));

const publicAudit = await read('tti/src/riemann-proof-audit.njk');
assert.ok(publicAudit.includes('id="t-rh-double-mobius"'));
assert.ok(publicAudit.includes('Does the second inversion complete the Weil form?'));

const doubleInversion = await read('tti/src/double-inversion.njk');
assert.ok(doubleInversion.includes('/riemann-proof-audit/#t-rh-double-mobius'));
assert.ok(doubleInversion.includes('The second face restores the'));

const longform = await read('tti/longform/part-vi-riemann-programme.md');
assert.ok(longform.includes('A seventh-stage audit tested whether TTI’s own language'));
assert.ok(longform.includes('One is differentiably quadratic and the other has a logarithmic cusp'));

console.log('Double Möbius completion passed: exact return, metric transport, divergence, Green regularity and non-Weil verdict verified.');
