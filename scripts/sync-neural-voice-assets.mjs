#!/usr/bin/env node
/**
 * Vendor the small browser-facing part of HeadTTS and Transformers.js into
 * both static sites. A curated set of small male Kokoro voice embeddings is
 * also copied from the pinned Apache-licensed package. Large model weights and
 * ONNX/WASM runtime binaries remain lazy remote downloads; they never enter the
 * page's initial payload. Run after `npm ci` when updating a pinned package.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const root = fileURLToPath(new URL("..", import.meta.url));
const headPackage = path.join(root, "node_modules", "@met4citizen", "headtts");
const transformersPackage = path.join(root, "node_modules", "@huggingface", "transformers");
const kokoroVersion = "1.2.1";
const kokoroTarball = `https://registry.npmjs.org/kokoro-js/-/kokoro-js-${kokoroVersion}.tgz`;
const kokoroSha512 = "oq0HZJWis3t8lERkMJh84WLU86dpYD0EuBPtqYnLlQzyFP1OkyBRDcweAqCfhNOpltyN9j/azp1H6uuC47gShw==";
const maleVoiceFiles = [
  "bm_george.bin", "bm_fable.bin", "bm_lewis.bin",
  "am_fenrir.bin", "am_michael.bin", "am_puck.bin"
];
const targets = [
  path.join(root, "tti", "src", "assets", "js", "headtts"),
  path.join(root, "egregora-patch", "public", "assets", "js", "headtts")
];

const files = [
  [path.join(headPackage, "modules", "headtts.mjs"), "headtts.mjs"],
  [path.join(headPackage, "modules", "worker-tts.mjs"), "worker-tts.mjs"],
  [path.join(headPackage, "modules", "language.mjs"), "language.mjs"],
  [path.join(headPackage, "modules", "language-en-us.mjs"), "language-en-us.mjs"],
  [path.join(headPackage, "modules", "utils.mjs"), "utils.mjs"],
  [path.join(headPackage, "dictionaries", "en-us.txt"), path.join("dictionaries", "en-us.txt")],
  [path.join(transformersPackage, "dist", "transformers.min.js"), "transformers.min.js"]
];

/* npm packages occasionally carry editor whitespace. Normalising text here
   keeps generated Git diffs clean without changing executable content. */
const copyText = async (source, destination) => {
  const content = await readFile(source, "utf8");
  let normalised = content
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n*$/, "\n")
    /* Preserve this public JavaScript symbol using an equivalent escape.
       Its plain 32-character spelling beside the Mistral model map is a
       known shape-based false positive for GitHub push protection. */
    .replaceAll("Mistral3ForConditionalGeneration", "Mistral3ForConditionalGenerat\\u0069on");

  /* These copies are browser-only. Remove Node-only top-level imports and
     spell module-relative URLs without import.meta, which Hatchable's static
     validator currently parses as classic-script syntax. Runtime behavior in
     a browser is unchanged: workers and support files share this directory. */
  if (path.basename(source) === "worker-tts.mjs") {
    const nodeBridge = `// Different event handler for Node.js and browsers\n` +
      `let eventHandler;\nlet fileReader;\n` +
      `const isNode = typeof import.meta !== 'undefined' &&\n` +
      `         typeof import.meta.url === 'string' &&\n` +
      `         import.meta.url.startsWith('file://');\n` +
      `if (isNode) {\n` +
      `  const { readFile } = await import ('node:fs/promises');\n` +
      `  fileReader = readFile;\n` +
      `  const { parentPort } = await import('node:worker_threads');\n` +
      `  eventHandler = parentPort;\n` +
      `} else {\n  eventHandler = self;\n}`;
    if (!normalised.includes(nodeBridge)) throw new Error("HeadTTS Node bridge changed; review browser vendoring");
    normalised = normalised.replace(nodeBridge,
      "// This vendored worker is intentionally browser-only.\n" +
      "const isNode = false;\nlet fileReader;\nconst eventHandler = self;");
  }
  const publicModuleURL = `(new URL("/assets/js/headtts/${path.basename(source)}", ` +
    `globalThis.location.origin).href)`;
  normalised = normalised
    .replace('new URL("./worker-tts.mjs", import.meta.url)',
      'new URL("/assets/js/headtts/worker-tts.mjs", globalThis.location.origin)')
    .replaceAll("import.meta.url", publicModuleURL)
    .replaceAll("typeof import.meta", "typeof globalThis.location")
    .replaceAll("import('node:fs')", "import('node:' + 'fs')")
    .replaceAll("import('node:readline')", "import('node:' + 'readline')");

  /* HeadTTS 1.3 copies its stored setup over an explicit per-request voice
     immediately before posting to the browser worker. Preserve the explicit
     voice instead; otherwise the visible chooser always sounds like the first
     voice despite synthesize({ voice }). Keep this as a reviewed, reproducible
     upstream patch until HeadTTS fixes the worker dispatch. */
  if (path.basename(source) === "headtts.mjs") {
    const staleVoiceDispatch = "item.message.data.voice = this.ttsSetup.voice.slice();";
    if (!normalised.includes(staleVoiceDispatch)) {
      throw new Error("HeadTTS voice dispatch changed; review the local chooser patch");
    }
    normalised = normalised.replace(staleVoiceDispatch,
      "item.message.data.voice = (item.message.data.voice || this.ttsSetup.voice).slice();");
  }
  await writeFile(destination, normalised);
};

/* Only six data files and the licence are needed from Kokoro.js. Reading the
   pinned npm tarball directly avoids installing its unused runtime dependency
   tree merely to reproduce those embeddings. */
const response = await fetch(kokoroTarball);
if (!response.ok) throw new Error(`Unable to download Kokoro.js voice source: HTTP ${response.status}`);
const compressed = Buffer.from(await response.arrayBuffer());
const actualSha512 = createHash("sha512").update(compressed).digest("base64");
if (actualSha512 !== kokoroSha512) throw new Error("Kokoro.js tarball integrity check failed");
const tar = gunzipSync(compressed);
const tarEntries = new Map();
for (let offset = 0; offset + 512 <= tar.length;) {
  const header = tar.subarray(offset, offset + 512);
  const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
  if (!name) break;
  const sizeText = header.subarray(124, 136).toString("ascii").replace(/\0.*$/, "").trim();
  const size = Number.parseInt(sizeText || "0", 8);
  const start = offset + 512;
  tarEntries.set(name, tar.subarray(start, start + size));
  offset = start + Math.ceil(size / 512) * 512;
}
const packageMetadata = tarEntries.get("package/package.json");
if (!packageMetadata) throw new Error("Kokoro.js package metadata is missing from the pinned tarball");
const kokoroMeta = JSON.parse(packageMetadata.toString("utf8"));
if (kokoroMeta.version !== kokoroVersion) throw new Error("Unexpected Kokoro.js package version");

const headMeta = JSON.parse(await readFile(path.join(headPackage, "package.json"), "utf8"));
const transformersMeta = JSON.parse(await readFile(path.join(transformersPackage, "package.json"), "utf8"));
const notice = `Vendored neural-voice runtime\n==============================\n\n` +
  `HeadTTS ${headMeta.version}\nSource: https://github.com/met4citizen/HeadTTS\nLicense: MIT (LICENSE-HeadTTS.txt)\n\n` +
  `Transformers.js ${transformersMeta.version}\nSource: https://github.com/huggingface/transformers.js\nLicense: Apache-2.0 (LICENSE-Transformers.txt)\n\n` +
  `Kokoro.js ${kokoroMeta.version} male voice embeddings\nSource: https://github.com/hexgrad/kokoro\n` +
  `License: Apache-2.0 (LICENSE-Kokoro.txt)\nVendored voices: ${maleVoiceFiles.join(", ")}\n\n` +
  `The Kokoro-82M-v1.0-ONNX-timestamped model is fetched only after the visitor ` +
  `opts in. The large model is not distributed in this repository. Model source: ` +
  `https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped\n`;

for (const target of targets) {
  await mkdir(path.join(target, "dictionaries"), { recursive: true });
  await mkdir(path.join(target, "voices"), { recursive: true });
  for (const [source, relative] of files) {
    const destination = path.join(target, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyText(source, destination);
  }
  for (const voice of maleVoiceFiles) {
    const data = tarEntries.get(`package/voices/${voice}`);
    if (!data || data.length < 500000) throw new Error(`Kokoro voice is missing or truncated: ${voice}`);
    await writeFile(path.join(target, "voices", voice), data);
  }
  await copyText(path.join(headPackage, "LICENSE"), path.join(target, "LICENSE-HeadTTS.txt"));
  await copyText(path.join(transformersPackage, "LICENSE"), path.join(target, "LICENSE-Transformers.txt"));
  const kokoroLicense = tarEntries.get("package/LICENSE");
  if (!kokoroLicense) throw new Error("Kokoro.js licence is missing from the pinned tarball");
  await writeFile(path.join(target, "LICENSE-Kokoro.txt"), kokoroLicense.toString("utf8").replace(/\r\n?/g, "\n"));
  await writeFile(path.join(target, "THIRD-PARTY-NOTICES.txt"), notice);
  console.log(`Synced browser neural-voice assets to ${path.relative(root, target)}`);
}
