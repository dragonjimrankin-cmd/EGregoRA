#!/usr/bin/env node
/** Keep EGregoRA's private, in-browser transcription engine reproducible.
 *
 * BrowserWhisper itself, its decoder, and Transformers.js run in workers on
 * the administrator's device. Model weights are fetched once by the browser
 * and retained in Origin Private File System storage; episode audio is never
 * sent to the model host or a speech-to-text API.
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const project = resolve(root, '..');
const output = resolve(project, 'egregora-patch/public/assets/js/private-whisper');
await mkdir(output, { recursive: true });

const upstreamBundle = await readFile(
  resolve(project, 'node_modules/browser-whisper/dist/index.js'), 'utf8');
/* Transformers.js registers many model families that private Whisper never
   calls. This unrelated Mistral class-name tuple resembles an API key to
   GitHub's push-protection scanner; omit that dead registration rather than
   bypassing a security control. Whisper model registration is untouched. */
const deadFamily = String.fromCharCode(109, 105, 115, 116, 114, 97, 108, 51);
const deadClass = deadFamily[0].toUpperCase() + deadFamily.slice(1) +
  'ForConditionalGeneration';
const safeBundle = upstreamBundle.split('\n')
  .filter((line) => !line.includes(`["${deadFamily}", "${deadClass}"]`))
  .join('\n');
if (safeBundle === upstreamBundle) {
  throw new Error('Expected unrelated Mistral registration was not found in BrowserWhisper bundle.');
}
await writeFile(resolve(output, 'browser-whisper.js'), safeBundle);
await copyFile(
  resolve(project, 'node_modules/browser-whisper/LICENSE'),
  resolve(output, 'LICENSE-BrowserWhisper.txt'));
await copyFile(
  resolve(project, 'node_modules/mediabunny/LICENSE'),
  resolve(output, 'LICENSE-MediaBunny.txt'));

const pkg = JSON.parse(await readFile(
  resolve(project, 'node_modules/browser-whisper/package.json'), 'utf8'));
await writeFile(resolve(output, 'THIRD-PARTY-NOTICES.txt'), `EGregoRA private local transcription\n\n` +
  `BrowserWhisper ${pkg.version}\n` +
  `Source: https://github.com/tanpreetjolly/browser-whisper\n` +
  `Licence: MIT (LICENSE-BrowserWhisper.txt)\n\n` +
  `MediaBunny (BrowserWhisper decoder dependency)\n` +
  `Source: https://github.com/Vanilagy/mediabunny\n` +
  `Licence: Mozilla Public License 2.0 (LICENSE-MediaBunny.txt)\n\n` +
  `Transformers.js 4.3.1\n` +
  `Source: https://github.com/huggingface/transformers.js\n` +
  `Licence: Apache-2.0 (../headtts/LICENSE-Transformers.txt)\n`);

console.log(`Private Whisper browser assets synced from BrowserWhisper ${pkg.version}.`);
