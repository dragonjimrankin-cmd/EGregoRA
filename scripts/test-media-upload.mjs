#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  UploadAssemblyError,
  assembleUpload,
  decodedBase64Size
} from '../egregora-patch/lib/upload-parts.js';

const source = await readFile(new URL('../egregora-patch/api/media.js', import.meta.url), 'utf8');
const transcribe = await readFile(new URL(
  '../egregora-patch/api/transcribe.js', import.meta.url), 'utf8');
const client = await readFile(new URL(
  '../egregora-patch/public/assets/js/media-admin.js', import.meta.url), 'utf8');
assert.doesNotMatch(source + transcribe, /Buffer\.concat\([^\n]*media_chunks/,
  'media uploads must not decode every database row before concatenation');
assert.doesNotMatch(source, /SELECT\s+(?:seq,\s*)?part\s+FROM\s+media_chunks[^;]*ORDER BY/,
  'media uploads must not fetch every encoded part in one result');
assert.ok(source.includes('assembleUpload(db, upload'),
  'publishing must use bounded upload assembly');
assert.ok(transcribe.includes('assembleUpload(db, upload'),
  'transcription audio must use bounded upload assembly');
assert.doesNotMatch(transcribe, /SELECT\s+part\s+FROM\s+media_chunks[^;]*ORDER BY/,
  'transcription must not fetch every encoded audio part in one result');
assert.ok(client.includes('blob.slice(from, to).arrayBuffer()'),
  'the browser must read one outgoing Blob slice at a time');
assert.doesNotMatch(client, /new Uint8Array\(await blob\.arrayBuffer\(\)\)/,
  'the browser must not duplicate the complete publish Blob');

assert.equal(decodedBase64Size(4, 'YQ=='), 1);
assert.equal(decodedBase64Size(4, 'YWI='), 2);
assert.equal(decodedBase64Size(4, 'YWJj'), 3);
assert.equal(decodedBase64Size(3, 'abc'), -1);

const original = Buffer.allocUnsafe(4 * 1024 * 1024 + 137);
for (let index = 0; index < original.length; index += 1) original[index] = (index * 31 + 17) & 255;
const RAW = 613777;
const encoded = [];
for (let at = 0; at < original.length; at += RAW) {
  encoded.push(original.subarray(at, Math.min(original.length, at + RAW)).toString('base64'));
}

function fakeDatabase(parts, sequence = parts.map((_, index) => index)) {
  const stats = { manifestQueries: 0, partQueries: 0, largestEncodedRow: 0 };
  return {
    stats,
    async query(sql, params) {
      if (/LENGTH\(part\)/i.test(sql)) {
        stats.manifestQueries += 1;
        return {
          rows: parts.map((part, index) => ({
            seq: sequence[index],
            encoded_length: part.length,
            tail: part.slice(-2)
          }))
        };
      }
      if (/WHERE upload_id = \$1 AND seq = \$2/i.test(sql)) {
        stats.partQueries += 1;
        const part = parts[Number(params[1])];
        stats.largestEncodedRow = Math.max(stats.largestEncodedRow, part ? part.length : 0);
        return { rows: part == null ? [] : [{ part }] };
      }
      throw new Error('Unexpected upload query: ' + String(sql).replace(/\s+/g, ' '));
    }
  };
}

const db = fakeDatabase(encoded);
const assembled = await assembleUpload(db, 'long-podcast', { maxBytes: original.length + 1 });
assert.deepEqual(assembled, original, 'chunk-wise assembly changed the podcast bytes');
assert.equal(db.stats.manifestQueries, 1, 'assembly should read one lightweight manifest');
assert.equal(db.stats.partQueries, encoded.length, 'assembly should fetch each encoded row once');
assert.ok(db.stats.largestEncodedRow < original.length / 4,
  'the mock did not exercise bounded one-row-at-a-time assembly');

const tooLargeDb = fakeDatabase(encoded);
await assert.rejects(
  assembleUpload(tooLargeDb, 'too-large', { maxBytes: original.length - 1 }),
  (error) => error instanceof UploadAssemblyError && error.status === 413
);
assert.equal(tooLargeDb.stats.partQueries, 0,
  'an oversized upload must be rejected from its manifest before any parts are loaded');

const missingDb = fakeDatabase(encoded, encoded.map((_, index) => index + (index > 1 ? 1 : 0)));
await assert.rejects(
  assembleUpload(missingDb, 'missing-piece', { maxBytes: original.length + 1 }),
  (error) => error instanceof UploadAssemblyError && error.status === 400 && /missing|damaged/.test(error.message)
);

const damaged = encoded.slice();
damaged[2] = damaged[2].slice(0, -1) + '!';
const damagedDb = fakeDatabase(damaged);
await assert.rejects(
  assembleUpload(damagedDb, 'damaged-piece', { maxBytes: original.length + 16 }),
  (error) => error instanceof UploadAssemblyError && error.status === 400
);

console.log(`Media upload assembly passed: ${(original.length / 1048576).toFixed(1)} MB across ` +
  `${encoded.length} bounded database chunks.`);
