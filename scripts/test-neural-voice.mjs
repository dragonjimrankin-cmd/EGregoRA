#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AVATAR_VOICE_PROFILES,
  NaturalVoiceEngine,
  buildPerformanceInput,
  normaliseSpeechText,
  rankNativeVoices
} from "../tti/src/assets/js/neural-voice.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const text = async (relative) => readFile(path.join(root, relative), "utf8");
const hash = async (file) => createHash("sha256").update(await readFile(file)).digest("hex");
const walk = async (directory, base = directory) => {
  const found = [];
  for (const name of await readdir(directory)) {
    const file = path.join(directory, name);
    if ((await stat(file)).isDirectory()) found.push(...await walk(file, base));
    else found.push(path.relative(base, file));
  }
  return found.sort();
};

assert.notEqual(AVATAR_VOICE_PROFILES.shakdrah.neuralVoice, AVATAR_VOICE_PROFILES.gink.neuralVoice,
  "The two characters must not share a neural voice");
assert.notEqual(AVATAR_VOICE_PROFILES.shakdrah.nativeRate, AVATAR_VOICE_PROFILES.gink.nativeRate,
  "The two native performances must remain distinct");
assert.notEqual(AVATAR_VOICE_PROFILES.shakdrah.pauseScale, AVATAR_VOICE_PROFILES.gink.pauseScale,
  "The two characters must pace explicit dramatic pauses differently");
assert.notDeepEqual(AVATAR_VOICE_PROFILES.shakdrah.audioTone, AVATAR_VOICE_PROFILES.gink.audioTone,
  "The two characters must use distinct, restrained mastering profiles");
assert.equal(NaturalVoiceEngine.isSupported(), false,
  "Importing the helper in Node must not try to create browser workers or audio contexts");

const audioNodes = [];
const audioNode = () => {
  const node = {
    type: "", frequency: { value: 0 }, gain: { value: 0 }, Q: { value: 0 },
    threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 0 },
    attack: { value: 0 }, release: { value: 0 },
    connect(target) { this.target = target; return target; }
  };
  audioNodes.push(node);
  return node;
};
const mastered = new NaturalVoiceEngine({ profile: "shakdrah" });
mastered.audioContext = {
  destination: { destination: true },
  createBiquadFilter: audioNode,
  createDynamicsCompressor: audioNode
};
mastered.prepareOutput();
assert.equal(audioNodes.length, 3, "The neural voice must use two gentle tone stages and compression");
assert.equal(audioNodes[0].type, "lowshelf");
assert.equal(audioNodes[1].type, "peaking");
assert.equal(mastered.outputNode, audioNodes[0]);
const unmastered = new NaturalVoiceEngine({ profile: "gink" });
unmastered.audioContext = { destination: { destination: true } };
unmastered.prepareOutput();
assert.equal(unmastered.outputNode, unmastered.audioContext.destination,
  "Older Web Audio implementations must fall back directly to the destination");

/* Cancellation is testable without loading a model: every active queue,
   source and timing callback must be invalidated atomically. */
let cleared = 0;
let stopped = 0;
let disconnected = 0;
let ended = 0;
const cancellable = new NaturalVoiceEngine({ onEnd: () => { ended += 1; } });
cancellable.session = 7;
cancellable.generating = true;
cancellable.paused = true;
cancellable.started = true;
cancellable.audioQueue.push({ audio: true });
cancellable.current = { data: {}, offset: 0 };
cancellable.cueTimers.push(setTimeout(() => {}, 10000));
cancellable.source = {
  onended: () => {},
  stop: () => { stopped += 1; },
  disconnect: () => { disconnected += 1; }
};
cancellable.tts = { clear: () => { cleared += 1; } };
cancellable.stop();
assert.equal(cancellable.session, 8);
assert.equal(cancellable.generating, false);
assert.equal(cancellable.paused, false);
assert.equal(cancellable.source, null);
assert.equal(cancellable.current, null);
assert.equal(cancellable.audioQueue.length, 0);
assert.equal(cancellable.cueTimers.length, 0);
assert.deepEqual({ cleared, stopped, disconnected, ended },
  { cleared: 1, stopped: 1, disconnected: 1, ended: 1 });

const performed = normaliseSpeechText(
  "ShakDrah: $\\frac{1}{5} \\times \\infty$; TTI ≠ EGregoRA at the Möbius seam.", "shakdrah");
assert.match(performed, /Shack Draah/);
assert.match(performed, /1 divided by 5 times infinity/);
assert.match(performed, /T T I is not equal to E Greg or ah/);
assert.match(performed, /Moebius seam/);
assert.ok(!performed.includes("$"), "Display maths delimiters must not be spoken");
const technical = normaliseSpeechText("CPT and QFT compare base-5 with 5D baryogenesis.", "gink");
assert.match(technical, /C P T and Q F T compare base 5 with 5 D barry-oh-jen-uh-sis/);

assert.deepEqual(buildPerformanceInput([
  { line: "First claim." }, { wait: 1000 }, { line: "$x^2$" }
], "gink"), [
  { type: "text", value: "First claim." },
  { type: "break", value: 940 },
  { type: "text", value: "x to the power of 2" }
], "Grade pauses and mathematical speech must survive performance preparation");
assert.deepEqual(buildPerformanceInput([{ wait: 1000 }], "shakdrah"),
  [{ type: "break", value: 1120 }], "ShakDrah should hold deliberate pauses longer");

const ranked = rankNativeVoices([
  { name: "Samantha", lang: "en-GB", localService: true },
  { name: "Bells", lang: "en-GB", localService: true },
  { name: "Microsoft Ryan Online (Natural)", lang: "en-GB", localService: false },
  { name: "Generic", lang: "en-US", localService: true }
], "shakdrah");
assert.match(ranked[0].name, /Ryan.*Natural/, "A natural British masculine voice should rank first");
assert.equal(ranked.at(-1).name, "Bells", "Novelty voices must rank last");

const [dragon, fox, patchFox, helper, patchHelper, shakPage, ginkPage, site, packageJson, npmrc, deployer] = await Promise.all([
  text("tti/src/assets/js/dragon.js"),
  text("tti/src/assets/js/fox.js"),
  text("egregora-patch/public/assets/js/fox.js"),
  text("tti/src/assets/js/neural-voice.js"),
  text("egregora-patch/public/assets/js/neural-voice.js"),
  text("tti/src/ask-shakdrah.njk"),
  text("egregora-patch/public/ask-ed/index.html"),
  text("tti/src/assets/js/site.js"),
  text("package.json"),
  text(".npmrc"),
  text("scripts/hatchable-deploy.mjs")
]);
assert.equal(patchFox, fox, "The deployed Gink sculpt must match the canonical Gink module");
assert.equal(patchHelper, helper, "Both sites must use the same neural engine");
assert.doesNotMatch(helper, /import\.meta/,
  "The neural adapter must remain valid under Hatchable's static parser");
assert.match(helper, /import\("\.\/headtts\/headtts\.mjs"\)/,
  "HeadTTS must stay lazy and load only after consent");
assert.doesNotMatch(helper, /^import .*headtts/m,
  "The multi-megabyte runtime must not enter the initial page payload");
assert.match(helper, /endpoints: navigator\.gpu \? \["webgpu", "wasm"\] : \["wasm"\]/);
assert.match(helper, /type: "progress"/);
assert.match(helper, /data\.visemes[\s\S]*this\.onViseme\(\{[\s\S]*viseme/,
  "Generated phoneme visemes must drive the avatar mouth");
assert.doesNotMatch(helper, /fetch\s*\(/,
  "The adapter must not transmit answer text to an application speech endpoint");
for (const [source, key, voice, button] of [
  [dragon, "shakdrah", "bm_george", "dragon-natural"],
  [fox, "gink", "bm_fable", "fox-natural"]
]) {
  assert.match(source, new RegExp(`VOICE_KEY = "${key}"`));
  assert.match(source, new RegExp(button));
  assert.match(source, /naturalVoice\.speak\(scriptFrom\(text\)\)/);
  assert.match(source, /Natural voice unavailable[\s\S]*continuing with the best installed voice/,
    `${key} must fall back visibly after a neural failure`);
  assert.match(source, /naturalWanted = false;[\s\S]*naturalPreferenceKey[\s\S]*speakNative\(/,
    `${key} must stop retrying failed neural mode until the visitor opts in again`);
  assert.match(source, /naturalVoice\.pause\(\)/, `${key} must pause neural playback`);
  assert.match(source, /naturalVoice\.resume\(\)/, `${key} must resume neural playback`);
  assert.match(source, /rankNativeVoices/);
  assert.match(source, /normaliseSpeechText/);
  assert.match(source, /const random = \(\(\) =>/, `${key} needs a stable procedural identity`);
  assert.match(source, /bumpMap:/, `${key} needs material-scale surface relief`);
  assert.match(source, /microGaze/, `${key} needs character-specific micro-saccades`);
  assert.match(source, /roundNow[\s\S]*pressNow/, `${key} needs four-channel facial articulation`);
  assert.match(source, /const nostrils =/, `${key} needs modeled, breathing nostril apertures`);
  assert.match(source, /document\.hidden/, `${key} must stop rendering while its page is hidden`);
  assert.match(helper, new RegExp(`neuralVoice: "${voice}"`));
}
assert.match(dragon, /const throatScutes =/,
  "ShakDrah needs overlapping reptilian throat armour rather than a fox bib alone");
assert.match(dragon, /wings\.forEach[\s\S]*crest\.forEach/,
  "ShakDrah's wings and crest must participate in the living rig");
assert.match(dragon, /const target = listening \? 0\.55/,
  "ShakDrah must retain a reptilian slit pupil");
assert.match(fox, /const target = listening \? 0\.88/,
  "Gink's fox pupil must dilate separately from ShakDrah's");
for (const page of [shakPage, ginkPage]) {
  assert.match(page, /Natural voice: off/);
  assert.match(page, /100(?:&ndash;|–)350/);
  assert.match(page, /Answer text stays on this device/);
  assert.match(page, /immediate installed voice remains/);
}
assert.match(site, /window\.EGDragon \|\| window\.EGFox/g,
  "Shared controls must target ShakDrah as well as Gink");
assert.match(packageJson, /"@met4citizen\/headtts": "1\.3\.0"/);
assert.match(packageJson, /"@huggingface\/transformers": "4\.3\.1"/);
assert.match(npmrc, /ignore-scripts=true/,
  "The unused Node ONNX postinstall must remain disabled");
assert.match(deployer, /extension === "\.mjs"/,
  "Valid browser modules must bypass Hatchable's classic-script parser");
assert.match(deployer, /includes\("import\.meta"\)/,
  "JavaScript using import.meta must use Hatchable's byte uploader");
assert.match(deployer, /RAW_SOURCE_BASE/,
  "Generated neural assets must support one-call imports from their committed source tree");
assert.match(deployer, /const SIZE = 60 \* 1024/,
  "Byte chunks must remain below Hatchable's 65,536-character limit");

const ttiVendor = path.join(root, "tti", "src", "assets", "js", "headtts");
const patchVendor = path.join(root, "egregora-patch", "public", "assets", "js", "headtts");
const files = await walk(ttiVendor);
assert.deepEqual(await walk(patchVendor), files, "Both deployments need the complete same worker/runtime set");
for (const relative of files) {
  const ttiPath = path.join(ttiVendor, relative);
  assert.equal(await hash(ttiPath), await hash(path.join(patchVendor, relative)),
    `Vendored asset differs between sites: ${relative}`);
  if (/\.(?:mjs|js)$/.test(relative)) {
    const moduleSource = await text(path.relative(root, ttiPath));
    assert.doesNotMatch(moduleSource, /import\.meta/,
      `Hatchable-incompatible import.meta remains in ${relative}`);
  }
}
assert.doesNotMatch(await text("tti/src/assets/js/headtts/worker-tts.mjs"), /node:worker_threads/,
  "The vendored worker must remain browser-only");
for (const required of [
  "headtts.mjs", "worker-tts.mjs", "language.mjs", "language-en-us.mjs", "utils.mjs",
  "transformers.min.js", "dictionaries/en-us.txt", "LICENSE-HeadTTS.txt",
  "LICENSE-Transformers.txt", "THIRD-PARTY-NOTICES.txt"
]) assert.ok(files.includes(required), `Missing vendored neural asset: ${required}`);

console.log("Neural voice engine, consent, fallback, prosody, distinction, lip-sync assets, and parity verified.");
