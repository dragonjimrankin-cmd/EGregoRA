#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');
const certificate = JSON.parse(await read('docs/rh/rss-prime-phase-defect-certificate.json'));

assert.equal(certificate.analysisDate, '2026-10-15');
assert.equal(certificate.arithmetic.proofComparisonsUseFloatingPoint, false);
assert.match(certificate.arithmetic.type, /Fraction exact rational/);
assert.match(certificate.arithmetic.piMethod, /Machin/);
assert.match(certificate.arithmetic.logMethod, /atanh/);
assert.equal(certificate.inputs.verifiedHeight, '3000175332800');
assert.equal(certificate.inputs.targetRational, '9274/10^40');
assert.equal(certificate.bounds.strictlyBelowTarget, true);

const defect = Number(certificate.bounds.defectUpper);
const target = Number(certificate.bounds.target);
assert.ok(defect > 9.273e-37 && defect < target);
assert.equal(target, 9.274e-37);
assert.ok(Number(certificate.bounds.tailMoment4Upper) < 2.061e-37);
assert.ok(Number(certificate.bounds.tailMoment6Upper) < 2.051e-62);
assert.equal(certificate.proofChain.length, 6);
assert.ok(Object.values(certificate.exactFingerprints).every((row) => /^[0-9a-f]{64}$/.test(row.sha256)));
assert.match(certificate.status, /no RH claim/);

const source = await read('scripts/certify-rss-prime-phase-defect.py');
assert.ok(source.includes('from fractions import Fraction'));
assert.ok(source.includes('assert defect_upper < TARGET'));
assert.ok(source.includes('pi = 16 atan(1/5) - 4 atan(1/239)'));
assert.doesNotMatch(source, /import (numpy|scipy|mpmath)/);

const report = await read('docs/rh/rss-reverse-prime-phase-inequality.md');
assert.ok(report.includes('Exact rational interval certificate'));
assert.ok(report.includes('9274}{10^{40}'));
assert.ok(report.includes('prime-phase-independent-review-note.md'));

const review = await read('docs/rh/prime-phase-independent-review-note.md');
assert.ok(review.includes('Claim boundary'));
assert.ok(review.includes('Requested reviewer response'));
assert.ok(review.includes('No claim of novelty'));
assert.ok(review.includes('RH | Not proved'));
assert.doesNotMatch(review, /[\x00-\x08\x0B\x0C\x0E-\x1F]/);

console.log('Exact phase-defect certificate passed: rational pi/log enclosures and integer comparison prove the 9.274e-37 upper bound without floating-point proof steps.');
