/* Test-only ESM loader: lets the real hatchable/api/edit.js be imported
   without the platform. It redirects the bare 'hatchable' module and the
   lib/* imports to tiny stubs; edit.js itself is loaded for real, so the
   validation under test (tidyOps, OPS, INSERT_TAGS, SAFE_URL) is the
   shipping code, not a copy. */
const STUBS = {
  "/lib/door.js": "export async function adminDoor(){ return globalThis.__doorResult; }",
  "/lib/freeai.js": "export async function freeChat(){ return null; }",
  "/lib/openchat.js": "export async function openChat(){ return null; }",
  "/lib/openai.js": "export async function openaiChat(){ return null; }",
  "/lib/oracle-corpus.js": "export async function topMatches(){ return []; }",
  "/lib/site-map.js": "export const SECTIONS = [];"
};

export async function resolve(specifier, context, next) {
  if (specifier === "hatchable") {
    return { url: "stub:hatchable", format: "module", shortCircuit: true };
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url === "stub:hatchable") {
    return {
      format: "module",
      shortCircuit: true,
      source: "export const ai = {};\nexport const db = { query: (...a) => globalThis.__dbQuery(...a) };"
    };
  }
  for (const suffix of Object.keys(STUBS)) {
    if (url.endsWith(suffix)) {
      return { format: "module", shortCircuit: true, source: STUBS[suffix] };
    }
  }
  return next(url, context);
}
