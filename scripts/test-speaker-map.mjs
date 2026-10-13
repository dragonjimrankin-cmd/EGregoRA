#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [api, migration, workflow] = await Promise.all([
  readFile(new URL('../egregora-patch/api/media.js', import.meta.url), 'utf8'),
  readFile(new URL('../egregora-patch/migrations/0035_latest_podcast_speaker_map.sql', import.meta.url), 'utf8'),
  readFile(new URL('../.github/workflows/egregora-patch-deploy.yml', import.meta.url), 'utf8')
]);

assert.match(migration, /WHERE kind = 'audio' AND state = 'published'/);
assert.match(migration, /ORDER BY created_at DESC, id DESC/);
assert.match(migration, /LIMIT 1/);
assert.match(migration, /VALUES \(1, 'Edward Gregory'\), \(2, 'Jim Rankin'\)/);
assert.match(migration, /ON CONFLICT \(media_id, speaker_no\) DO UPDATE/);
assert.match(migration, /profiled_chars = NULL/);
assert.doesNotMatch(migration, /INSERT INTO media\s*\(/,
  'the repair must map the declared latest episode, never create media');

const bootstrap = api.slice(
  api.indexOf("if (action === 'bootstrap-speakers')"),
  api.indexOf('/* Everything else is behind the passcode.')
);
const mapCheck = bootstrap.indexOf("expected.get(1) !== 'Edward Gregory'");
const transcriptCheck = bootstrap.indexOf('if (row.transcript && String(row.transcript).trim())');
assert.ok(mapCheck >= 0 && transcriptCheck > mapCheck,
  'bootstrap must validate the declared speaker map before reporting an existing transcript recovered');
assert.ok(bootstrap.includes('ensureSpeakerPatterns(Number(row.id), row.transcript, speakers)'));
assert.ok(bootstrap.includes('speakers: profile.speakers.map'));

assert.ok(workflow.includes('node scripts/test-speaker-map.mjs'));
assert.ok(workflow.includes('The latest podcast speaker map was not stored.'));
assert.ok(workflow.includes('Private local transcription is still pending'));
assert.ok(!workflow.includes("body: JSON.stringify({ action: 'bootstrap-speakers' })"),
  'deployment must not send published audio to a cloud transcription bootstrap');

console.log('Latest podcast speaker-map repair passed: declared identities are migrated, verified, and private transcription remains local.');
