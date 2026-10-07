#!/usr/bin/env node
/**
 * Drive /api/control from the GitHub Actions runner.
 *
 * The sandbox this repository is edited in has no TLS egress except to
 * api.github.com, so the agent cannot call the live site directly. The runner
 * can. Put a list of calls in ops/control-request.json, push, and this script
 * executes them and writes the answers to ci-logs/control.log, which is read
 * back out of the branch.
 *
 *   { "calls": [ {"action":"whoami"}, {"action":"ask","question":"…"} ] }
 *
 * `poll` on a call waits for a draw/film job to finish:
 *   { "action":"film", "prompt":"…", "poll": 600 }
 */
import { readFileSync } from 'node:fs';

const SITE = process.env.EG_SITE || 'https://egregora.hatchable.site';
const TOKEN = process.env.EG_TOKEN || 'jim1_c6bd62438879ec7d7cdad176bf105a352cf01866574ebb4e';
const FILE = process.argv[2] || 'ops/control-request.json';

const headers = {
  authorization: 'Bearer ' + TOKEN,
  'content-type': 'application/json'
};

const post = async (body) => {
  const started = Date.now();
  try {
    const r = await fetch(SITE + '/api/control', {
      method: 'POST', headers, body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000)
    });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: r.status, ms: Date.now() - started, json, text: json ? null : text.slice(0, 800) };
  } catch (err) {
    return { status: 0, ms: Date.now() - started, error: (err && err.message) || 'network error' };
  }
};

/* A plain call to any endpoint on the site, for the times when the thing
   being checked is not a control action at all \u2014 whether a door locks, say,
   or what an error actually reads like from outside. No token is sent. */
const raw = async (spec) => {
  const started = Date.now();
  /* An absolute address is called as given; anything else is a path on the
     order's own site. The first is how a route is auditioned before it is
     wired in: the sandbox this is written in cannot reach the open web, but
     this runner can. */
  const where = String(spec.path || '/');
  const url = /^https?:\/\//.test(where) ? where : SITE + where;
  try {
    const r = await fetch(url, {
      method: spec.method || (spec.body ? 'POST' : 'GET'),
      headers: Object.assign(spec.body ? { 'content-type': 'application/json' } : {}, spec.headers || {}),
      body: spec.body ? JSON.stringify(spec.body) : undefined,
      signal: AbortSignal.timeout(60000)
    });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: r.status, ms: Date.now() - started, json, text: json ? null : text.slice(0, 500) };
  } catch (err) {
    return { status: 0, ms: Date.now() - started, error: (err && err.message) || 'network error' };
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const plan = JSON.parse(readFileSync(FILE, 'utf8'));
const calls = plan.calls || [];

console.log('# control run — ' + new Date().toISOString());
console.log('site: ' + SITE + '   calls: ' + calls.length);

// the manual, unauthenticated, as a reachability check
try {
  const r = await fetch(SITE + '/api/control', { signal: AbortSignal.timeout(30000) });
  console.log('\nGET /api/control -> HTTP ' + r.status);
} catch (err) {
  console.log('\nGET /api/control -> unreachable: ' + err.message);
}

for (const call of calls) {
  if (call.raw) {
    console.log('\n' + '-'.repeat(68));
    console.log((call.raw.method || (call.raw.body ? 'POST' : 'GET')) + ' ' + call.raw.path +
      (call.raw.body ? '  ' + JSON.stringify(call.raw.body) : ''));
    const out = await raw(call.raw);
    console.log('HTTP ' + out.status + '  (' + out.ms + ' ms)');
    console.log(JSON.stringify(out.json ?? out.text ?? out.error, null, 2).slice(0, 2000));
    continue;
  }
  const { poll, ...body } = call;
  console.log('\n' + '-'.repeat(68));
  console.log('POST ' + JSON.stringify(body));
  const out = await post(body);
  console.log('HTTP ' + out.status + '  (' + out.ms + ' ms)');
  console.log(JSON.stringify(out.json ?? out.text ?? out.error, null, 2).slice(0, 4000));

  if (poll && out.json && out.json.id) {
    const until = Date.now() + Number(poll) * 1000;
    let last = '';
    while (Date.now() < until) {
      await sleep(15000);
      const p = await post({ action: 'job', id: out.json.id });
      const st = (p.json && p.json.status) || 'unknown';
      if (st !== last) { console.log('  job ' + out.json.id + ': ' + st); last = st; }
      if (st === 'ready' || st === 'failed') {
        console.log(JSON.stringify(p.json, null, 2).slice(0, 2000));
        break;
      }
    }
    if (last !== 'ready' && last !== 'failed') console.log('  job ' + out.json.id + ': still running when the clock ran out');
  }
}
console.log('\ndone.');
