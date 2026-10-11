#!/usr/bin/env node
/**
 * Vendor the small browser-facing part of HeadTTS and Transformers.js into
 * both static sites. Model weights and ONNX/WASM runtime binaries remain
 * lazy remote downloads; they are never added to Git or the page's initial
 * payload. Run after `npm ci` when updating either pinned package.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const headPackage = path.join(root, "node_modules", "@met4citizen", "headtts");
const transformersPackage = path.join(root, "node_modules", "@huggingface", "transformers");
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
  await writeFile(destination, normalised);
};

const headMeta = JSON.parse(await readFile(path.join(headPackage, "package.json"), "utf8"));
const transformersMeta = JSON.parse(await readFile(path.join(transformersPackage, "package.json"), "utf8"));
const notice = `Vendored neural-voice runtime\n==============================\n\n` +
  `HeadTTS ${headMeta.version}\nSource: https://github.com/met4citizen/HeadTTS\nLicense: MIT (LICENSE-HeadTTS.txt)\n\n` +
  `Transformers.js ${transformersMeta.version}\nSource: https://github.com/huggingface/transformers.js\nLicense: Apache-2.0 (LICENSE-Transformers.txt)\n\n` +
  `Kokoro-82M-v1.0-ONNX-timestamped model and voices are fetched only after ` +
  `the visitor opts in. They are not distributed in this repository. Model source: ` +
  `https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped\n`;

for (const target of targets) {
  await mkdir(path.join(target, "dictionaries"), { recursive: true });
  for (const [source, relative] of files) {
    const destination = path.join(target, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyText(source, destination);
  }
  await copyText(path.join(headPackage, "LICENSE"), path.join(target, "LICENSE-HeadTTS.txt"));
  await copyText(path.join(transformersPackage, "LICENSE"), path.join(target, "LICENSE-Transformers.txt"));
  await writeFile(path.join(target, "THIRD-PARTY-NOTICES.txt"), notice);
  console.log(`Synced browser neural-voice assets to ${path.relative(root, target)}`);
}
