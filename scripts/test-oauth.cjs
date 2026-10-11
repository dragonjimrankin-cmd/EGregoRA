#!/usr/bin/env node
/* Drives the real hatchable/api/oauth.js: the provider table, the
   redirect it builds, the host check that keeps the two houses apart, and
   the Microsoft profile merge. Platform deps are stubbed by
   _oauth-test-loader.mjs; nothing here stands in for the code under test. */
const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
const path = require("path");

register(pathToFileURL(path.join(__dirname, "_oauth-test-loader.mjs")));

let failures = 0;
function check(name, cond, extra) {
  if (cond) console.log("  ok  - " + name);
  else { failures++; console.log("  FAIL- " + name + (extra ? "  [" + extra + "]" : "")); }
}

/* ---- stubs the loader points at ------------------------------------- */
const states = new Map();
let identities = [];
let made = [];
let sessionFor = null;

globalThis.__dbQuery = async function (sql, params) {
  const p = params || [];
  if (/INSERT INTO oauth_states/.test(sql)) {
    states.set(p[0], { state: p[0], provider: p[1], verifier: p[2], back: p[3] });
    return { rows: [] };
  }
  if (/DELETE FROM oauth_states WHERE expires_at/.test(sql)) return { rows: [] };
  if (/SELECT \* FROM oauth_states/.test(sql)) {
    const row = states.get(p[0]);
    return { rows: row && row.provider === p[1] ? [row] : [] };
  }
  if (/DELETE FROM oauth_states WHERE state/.test(sql)) { states.delete(p[0]); return { rows: [] }; }
  if (/INSERT INTO oauth_identities/.test(sql)) {
    identities.push({ provider: p[0], subject: p[1], member_id: p[2], handle: p[3] });
    return { rows: [] };
  }
  if (/UPDATE members/.test(sql)) return { rows: [] };
  return { rows: [] };
};

const CREDS = {
  GOOGLE_CLIENT_ID: "g-id", GOOGLE_CLIENT_SECRET: "g-sec",
  MICROSOFT_CLIENT_ID: "ms-id", MICROSOFT_CLIENT_SECRET: "ms-sec",
  GITHUB_CLIENT_ID: "gh-id", GITHUB_CLIENT_SECRET: "gh-sec"
  /* apple, x, facebook, discord deliberately left unconfigured */
};
globalThis.__configGet = async function (k) { return CREDS[k] || null; };

globalThis.__cleanEmail = function (v) {
  const s = String(v == null ? "" : v).trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s) ? s : "";
};
globalThis.__findOrCreate = async function (email, name) {
  made.push({ email, name });
  return { id: 7 };
};
globalThis.__startSession = async function (id, how) {
  sessionFor = { id, how };
  return "tok." + id + "." + how;
};
let tick = 0;
globalThis.__randomToken = function () { tick++; return "st" + tick + "v" + tick; };

/* A real-looking id_token: header.payload.signature, payload base64url. */
function idToken(payload) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b64({ alg: "RS256" }) + "." + b64(payload) + ".sig";
}

function mockRes(capture) {
  return {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    send(b) { capture.body = b; capture.status = this.statusCode; capture.headers = this.headers; },
    json(d) { capture.out = d; capture.status = this.statusCode; }
  };
}

/* Point the handler's outbound fetch at whatever the case needs. */
function stubFetch(routes) {
  globalThis.fetch = async function (url) {
    for (const key of Object.keys(routes)) {
      if (String(url).indexOf(key) === 0) return routes[key];
    }
    throw new Error("unexpected fetch: " + url);
  };
}
const json = (obj, ok) => ({ ok: ok !== false, status: ok === false ? 400 : 200, json: async () => obj });

const EG = "egregora.hatchable.site";
const TTI = "the-two-infinities.hatchable.site";

(async function () {
  const mod = await import(pathToFileURL(path.join(__dirname, "..", "hatchable", "api", "oauth.js")).href);
  const handler = mod.default;

  /* ---------- 1. which doors are open ---------- */
  console.log("ready — the doors this house offers:");
  let cap = {};
  await handler({ query: {}, body: { action: "ready" }, headers: { host: EG } }, mockRes(cap));
  const prov = (cap.out && cap.out.providers) || [];
  const byId = {};
  prov.forEach((p) => { byId[p.id] = p; });

  ["google", "microsoft", "facebook", "x", "discord", "github"].forEach((want) => {
    check("offers " + want, !!byId[want]);
  });
  check("microsoft labelled 'Microsoft'", byId.microsoft && byId.microsoft.label === "Microsoft");
  check("configured door is ready", byId.microsoft && byId.microsoft.ready === true);
  check("unconfigured door is not ready", byId.discord && byId.discord.ready === false);
  check("apple still offered (not removed)", !!byId.apple);

  /* ---------- 2. leaving for Microsoft, from each house ---------- */
  console.log("go=microsoft — the redirect it builds:");
  cap = {};
  await handler({ query: { go: "microsoft" }, body: {}, headers: { host: EG } }, mockRes(cap));
  const loc = new URL(cap.headers.location);
  check("sends a 302", cap.status === 302);
  check("to Microsoft's authorise endpoint",
    loc.origin === "https://login.microsoftonline.com" &&
    loc.pathname === "/common/oauth2/v2.0/authorize", cap.href);
  check("carries the client id", loc.searchParams.get("client_id") === "ms-id");
  check("asks for code", loc.searchParams.get("response_type") === "code");
  check("scope covers openid, email, profile, User.Read",
    loc.searchParams.get("scope") === "openid email profile User.Read");
  check("offers account choice", loc.searchParams.get("prompt") === "select_account");
  check("redirect_uri is EGregoRA's own callback",
    loc.searchParams.get("redirect_uri") === "https://" + EG + "/api/oauth?back=microsoft",
    loc.searchParams.get("redirect_uri"));
  check("carries a state", !!loc.searchParams.get("state"));
  const egState = loc.searchParams.get("state");

  cap = {};
  await handler({ query: { go: "microsoft" }, body: {}, headers: { host: TTI } }, mockRes(cap));
  const ttiLoc = new URL(cap.headers.location);
  check("from TTI, redirect_uri is TTI's own callback",
    ttiLoc.searchParams.get("redirect_uri") === "https://" + TTI + "/api/oauth?back=microsoft",
    ttiLoc.searchParams.get("redirect_uri"));

  /* an invented Host must not be able to redirect a finished sign-in away */
  cap = {};
  await handler({ query: { go: "microsoft" }, body: {}, headers: { host: "evil.example.com" } }, mockRes(cap));
  const evil = new URL(cap.headers.location);
  check("a forged Host falls back, never follows",
    evil.searchParams.get("redirect_uri") === "https://" + EG + "/api/oauth?back=microsoft",
    evil.searchParams.get("redirect_uri"));

  /* ---------- 3. Microsoft coming back, address from Graph ---------- */
  console.log("back=microsoft — a work or school account:");
  identities = []; made = []; sessionFor = null;
  stubFetch({
    "https://login.microsoftonline.com/common/oauth2/v2.0/token":
      json({ access_token: "at", id_token: idToken({ oid: "oid-1", preferred_username: "upn@corp.onmicrosoft.com" }) }),
    "https://graph.microsoft.com/v1.0/me":
      json({ id: "graph-1", displayName: "Ada Lovelace", mail: "ada@corp.example", userPrincipalName: "upn@corp.onmicrosoft.com" })
  });
  cap = {};
  await handler({ query: { back: "microsoft", code: "c1", state: egState }, body: {}, headers: { host: EG } }, mockRes(cap));
  check("Graph's mailbox is the address used",
    made.length === 1 && made[0].email === "ada@corp.example", JSON.stringify(made));
  check("the display name is kept", made[0] && made[0].name === "Ada Lovelace");
  check("the identity is bound to the member",
    identities.length === 1 && identities[0].provider === "microsoft" && identities[0].subject === "graph-1",
    JSON.stringify(identities));
  check("a session is started", sessionFor && sessionFor.id === 7);
  check("the handover carries the session token",
    /eg-session/.test(cap.body || "") && /tok\.7\.microsoft/.test(cap.body || ""));
  check("the interstitial names EGregoRA", /EGregoRA<\/title>/.test(cap.body || ""));
  check("the state ticket was consumed", states.size === 0 || !states.has(egState));

  /* ---------- 4. a personal account: address only in the id_token ---------- */
  console.log("back=microsoft — a personal account, Graph has no mailbox:");
  cap = {};
  await handler({ query: { go: "microsoft" }, body: {}, headers: { host: TTI } }, mockRes(cap));
  const st2 = new URL(cap.headers.location).searchParams.get("state");
  identities = []; made = [];
  stubFetch({
    "https://login.microsoftonline.com/common/oauth2/v2.0/token":
      json({ access_token: "at2", id_token: idToken({ oid: "oid-2", email: "ada.personal@outlook.com", name: "Ada P" }) }),
    "https://graph.microsoft.com/v1.0/me": json({ id: "graph-2", displayName: "Ada P", mail: null })
  });
  cap = {};
  await handler({ query: { back: "microsoft", code: "c2", state: st2 }, body: {}, headers: { host: TTI } }, mockRes(cap));
  check("the id_token's address fills what Graph left empty",
    made.length === 1 && made[0].email === "ada.personal@outlook.com", JSON.stringify(made));
  check("the interstitial names The Two Infinities",
    /The Two Infinities<\/title>/.test(cap.body || ""), (cap.body || "").slice(0, 0));

  /* ---------- 5. an unconfigured door says so instead of failing ---------- */
  console.log("an unconfigured door:");
  cap = {};
  await handler({ query: { go: "discord" }, body: {}, headers: { host: EG } }, mockRes(cap));
  check("reports 503, not a broken button", cap.status === 503);
  check("explains what is missing", /client id and secret/.test(cap.body || ""));

  /* ---------- 6. a replayed callback is refused ---------- */
  console.log("a replayed callback:");
  cap = {};
  await handler({ query: { back: "microsoft", code: "c1", state: egState }, body: {}, headers: { host: EG } }, mockRes(cap));
  check("the used ticket will not open twice", cap.status === 400 && /stale/.test(cap.body || ""));

  console.log(failures ? "\nFAILURES: " + failures : "\nall passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error("threw:", (e && e.stack) || e); process.exit(1); });
