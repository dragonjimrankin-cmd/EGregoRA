#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const admin = await readFile(new URL(
  'egregora-patch/public/assets/js/media-admin.js', root), 'utf8');
const podcast = await readFile(new URL(
  'egregora-patch/public/podcast/index.html', root), 'utf8');
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const moduleUrl = new URL(
  'egregora-patch/public/assets/js/private-whisper/browser-whisper.js', root);
const moduleStat = await stat(moduleUrl);

assert.equal(pkg.devDependencies['browser-whisper'], '1.2.0',
  'the private transcription app must be reproducibly pinned');
assert.ok(moduleStat.size > 1_000_000,
  'the site-hosted BrowserWhisper application is missing or truncated');
assert.ok(admin.includes('/assets/js/private-whisper/browser-whisper.js?v=private-whisper-1'),
  'the media editor must load the site-hosted private transcription app');
assert.ok(admin.includes('new module.BrowserWhisper'),
  'the media editor must instantiate BrowserWhisper');
assert.ok(admin.includes('model: "whisper-base"') && admin.includes('language: "en"'),
  'private transcription must use the English Whisper Base route');
assert.ok(admin.includes('for await (const segment of stream)'),
  'long transcription must be consumed as bounded worker segments');
assert.ok(admin.includes('start - lastEnd > 2.5'),
  'local timestamps must still drive provisional consolidated speaker turns');
assert.doesNotMatch(admin, /cdn\.jsdelivr\.net\/npm\/@xenova\/transformers/,
  'the old third-party CDN transcription application must not remain');
assert.doesNotMatch(admin, /SpeechRecognition|webkitSpeechRecognition/,
  'private transcription must not silently play audio to a microphone service');
assert.doesNotMatch(admin, /action:\s*["']hear["']/,
  'the browser must not silently send recording chunks to the old server transcription providers');
const keepTranscript = admin.indexOf('listing = { transcript: lastTranscript');
const askArchivist = admin.indexOf('await describeListing(lastTranscript', keepTranscript);
assert.ok(keepTranscript >= 0 && askArchivist > keepTranscript,
  'a successful private transcript must be retained before optional summary generation');
assert.ok(admin.includes('The private transcript is safe and will publish with the episode.'));

assert.ok(podcast.includes('Transcribe privately, then write the summary'));
assert.ok(podcast.includes('Private local Whisper:'));
assert.ok(podcast.includes('recording is never sent to a\n        speech-to-text service'));
assert.ok(podcast.includes('about 206&nbsp;MB'));
assert.ok(podcast.includes('media-admin.js?v=avatar-summary-1'));

const browserWhisper = await import(moduleUrl.href + '?test=' + Date.now());
assert.equal(typeof browserWhisper.BrowserWhisper, 'function');
assert.equal(browserWhisper.MODELS['whisper-base'].hfId, 'onnx-community/whisper-base');
assert.equal(browserWhisper.MODELS['whisper-base'].supportsTimestamps, true);

console.log('Private BrowserWhisper passed: local app, Whisper Base, worker streaming, privacy boundary, and UI disclosure.');
