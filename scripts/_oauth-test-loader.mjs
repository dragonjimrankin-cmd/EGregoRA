/* Test-only ESM loader for hatchable/api/oauth.js. It redirects the bare
   'hatchable' module and the accounts library to stubs; oauth.js itself is
   loaded for real, so the provider table, the redirect construction, the
   host check and the profile merge under test are the shipping code. */
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
      source: [
        "export const db = { query: (...a) => globalThis.__dbQuery(...a) };",
        "export const config = { get: (k) => globalThis.__configGet(k) };",
        "export const ai = {};"
      ].join("\n")
    };
  }
  if (url.endsWith("/lib/accounts.js")) {
    return {
      format: "module",
      shortCircuit: true,
      source: [
        "export function cleanEmail(v) { return globalThis.__cleanEmail(v); }",
        "export async function findOrCreate(email, name) { return globalThis.__findOrCreate(email, name); }",
        "export async function startSession(id, how) { return globalThis.__startSession(id, how); }",
        "export function randomToken(n) { return globalThis.__randomToken(n); }"
      ].join("\n")
    };
  }
  return next(url, context);
}
