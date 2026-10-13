#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createProgressLiveness } from '../egregora-patch/public/assets/js/progress-live.js';

class FakeClassList {
  constructor() { this.values = new Set(); }
  toggle(name, on) { on ? this.values.add(name) : this.values.delete(name); }
  contains(name) { return this.values.has(name); }
}

function fakeNode() {
  const attributes = new Map();
  const properties = new Map();
  return {
    hidden: true,
    textContent: '',
    classList: new FakeClassList(),
    style: { setProperty: (name, value) => properties.set(name, value) },
    setAttribute: (name, value) => attributes.set(name, String(value)),
    getAttribute: (name) => attributes.get(name) ?? null,
    hasAttribute: (name) => attributes.has(name),
    attributes,
    properties
  };
}

let time = 0;
let timerCallback = null;
let timersStarted = 0;
let timersStopped = 0;
const reporter = createProgressLiveness({
  staleAfter: 4000,
  tickEvery: 1000,
  now: () => time,
  setInterval: (callback) => { timerCallback = callback; timersStarted += 1; return timersStarted; },
  clearInterval: () => { timersStopped += 1; timerCallback = null; }
});
const node = fakeNode();

reporter.update(node, 'Transcribing locally', 0.31, false);
assert.equal(node.hidden, false);
assert.equal(node.textContent, 'Transcribing locally — 31%');
assert.equal(node.getAttribute('aria-valuenow'), '31');
assert.equal(node.getAttribute('aria-busy'), 'true');
assert.equal(node.properties.get('--done'), '31%');
assert.ok(node.classList.contains('is-active'));
assert.equal(timersStarted, 1);

time = 5000;
timerCallback();
assert.match(node.textContent, /still working · 5s elapsed · 31% confirmed/);
assert.match(node.getAttribute('aria-valuetext'), /31% confirmed; still working; 5s elapsed/);
assert.ok(node.classList.contains('is-waiting'));

reporter.update(node, 'Writing the summary', 0.95, false);
assert.equal(node.textContent, 'Writing the summary — 95%');
assert.ok(!node.classList.contains('is-waiting'));
time = 66000;
timerCallback();
assert.match(node.textContent, /still working · 1m 06s elapsed · 95% confirmed/);

reporter.update(node, 'Transcript and summary ready', 1, false);
assert.equal(node.textContent, 'Transcript and summary ready — 100%');
assert.equal(node.getAttribute('aria-busy'), 'false');
assert.ok(!node.classList.contains('is-active'));
assert.equal(timersStopped, 1);
assert.equal(timerCallback, null);

const failedNode = fakeNode();
reporter.update(failedNode, 'Uploading', 0.62, false);
assert.equal(timersStarted, 2);
reporter.update(failedNode, 'Upload failed', null, true);
assert.equal(failedNode.textContent, 'Upload failed — 62%');
assert.equal(failedNode.getAttribute('aria-busy'), 'false');
assert.ok(failedNode.classList.contains('is-bad'));
assert.ok(!failedNode.classList.contains('is-active'));
assert.ok(!failedNode.classList.contains('is-waiting'));
assert.equal(timersStopped, 2);
assert.equal(timerCallback, null);

const podcast = await readFile(new URL(
  '../egregora-patch/public/podcast/index.html', import.meta.url), 'utf8');
const admin = await readFile(new URL(
  '../egregora-patch/public/assets/js/media-admin.js', import.meta.url), 'utf8');
assert.ok(podcast.includes('media-admin.js?v=avatar-summary-1'));
assert.ok(podcast.includes('@keyframes am-progress-sweep'));
assert.ok(podcast.includes('.am-bar.is-waiting'));
assert.ok(podcast.includes('prefers-reduced-motion'));
assert.ok(admin.includes('createProgressLiveness'));
assert.ok(admin.includes('./progress-live.js?v=progress-live-1'));

console.log('Podcast progress liveness passed: measured percentages, elapsed heartbeat, active sheen, completion/error cleanup, ARIA, and reduced motion.');
