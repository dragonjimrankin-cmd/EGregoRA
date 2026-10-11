import { webcrypto } from 'node:crypto';
import {
  voiceTemplate,
  sealVoiceprint,
  openVoiceprint,
  voiceSimilarity
} from '../egregora-patch/public/assets/js/voiceprint.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

function syntheticVoice(fundamental, phase = 0) {
  const sampleRate = 16000;
  const duration = 12;
  const samples = new Float32Array(sampleRate * duration);
  for (let index = 0; index < samples.length; index++) {
    const at = index / sampleRate;
    const envelope = 0.22 * (0.72 + 0.28 * Math.sin(2 * Math.PI * 2.4 * at) ** 2);
    samples[index] = envelope * (
      Math.sin(2 * Math.PI * fundamental * at + phase) +
      0.45 * Math.sin(2 * Math.PI * fundamental * 2 * at) +
      0.2 * Math.sin(2 * Math.PI * fundamental * 3 * at));
  }
  return {
    sampleRate,
    numberOfChannels: 1,
    duration,
    length: samples.length,
    getChannelData: () => samples
  };
}

const edward = voiceTemplate(syntheticVoice(118), [{ from: 0, to: 12 }]);
const edwardAgain = voiceTemplate(syntheticVoice(121, 0.4), [{ from: 0, to: 12 }]);
const jim = voiceTemplate(syntheticVoice(207), [{ from: 0, to: 12 }]);
const sameSpeaker = voiceSimilarity(edward, edwardAgain);
const otherSpeaker = voiceSimilarity(edward, jim);
if (!(sameSpeaker > otherSpeaker && sameSpeaker > 0.7)) {
  throw new Error(`Synthetic speaker separation failed: ${sameSpeaker} / ${otherSpeaker}`);
}

const testPhrase = 'synthetic-only-key-material';
const envelope = await sealVoiceprint('Edward Gregory', edward, testPhrase);
const opened = await openVoiceprint({ name: 'Edward Gregory', ...envelope }, testPhrase);
if (opened.embedding.length !== edward.embedding.length || voiceSimilarity(edward, opened) < 0.9999) {
  throw new Error('AES-GCM voiceprint round trip failed.');
}
let refused = false;
try {
  await openVoiceprint({ name: 'Edward Gregory', ...envelope }, 'wrong-test-pass');
} catch {
  refused = true;
}
if (!refused) throw new Error('A wrong passphrase opened the synthetic voiceprint.');

console.log('Synthetic speaker separation and encrypted voiceprint round trip passed.');
