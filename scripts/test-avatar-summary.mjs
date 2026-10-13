#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [api, admin, podcast, videos] = await Promise.all([
  readFile(new URL('egregora-patch/api/transcribe.js', root), 'utf8'),
  readFile(new URL('egregora-patch/public/assets/js/media-admin.js', root), 'utf8'),
  readFile(new URL('egregora-patch/public/podcast/index.html', root), 'utf8'),
  readFile(new URL('egregora-patch/public/videos/index.html', root), 'utf8')
]);

assert.ok(api.includes("import { ai, db, storage } from 'hatchable'"));
assert.ok(api.includes("import { openaiChat, openaiKey } from '../lib/openai.js'"));
assert.ok(api.includes('async function askAvatarStack('));
assert.ok(api.includes('freeOptions.model = wantedModel'));
assert.ok(api.includes('freeOptions.slot = wantedSlot'));
assert.ok(api.includes("purpose: 'podcast-summary'"));
assert.ok(api.includes('const described = await askAvatarStack('));
assert.ok(!api.includes('https://api.openai.com/v1/chat/completions'),
  'podcast descriptions must not bypass the shared avatar model stack');

const stack = api.slice(
  api.indexOf('async function askAvatarStack('),
  api.indexOf('/* The next number in the run')
);
const routes = ['freeChat(', 'openChat(', 'openaiChat(', 'ai.generateText(']
  .map((marker) => stack.indexOf(marker));
assert.ok(routes.every((position) => position >= 0));
assert.deepEqual(routes, routes.slice().sort((a, b) => a - b),
  'summary providers must follow the avatar/oracle route order');

assert.ok(admin.includes('function avatarAiChoice()'));
assert.ok(admin.includes('window.EGFreeWants'));
assert.ok(admin.includes('free_model: wanted.chat || undefined'));
assert.ok(admin.includes('free_slot: Number(wanted.slot) || undefined'));
assert.ok((admin.match(/avatarAiChoice\(\)/g) || []).length >= 3,
  'new-upload and existing-episode summary requests must use the avatar choice');
assert.ok(admin.includes('same AI used by Gink and ShakDrah'));

const disclosure = 'same AI and selected\n        chat model used by Gink and ShakDrah';
assert.ok(podcast.includes(disclosure));
assert.ok(podcast.includes('oracle&rsquo;s answers, podcast summaries, pictures and films'));
assert.ok(podcast.includes('media-admin.js?v=avatar-summary-1'));
assert.ok(videos.includes('media-admin.js?v=avatar-summary-1'));

console.log('Avatar summary parity passed: podcast summaries use the avatar model choice and oracle provider order.');
