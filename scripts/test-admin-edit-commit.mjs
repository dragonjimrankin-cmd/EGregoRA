#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFile(path.join(root, relative), 'utf8');

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

function digest(effective) {
  return createHash('sha256').update(JSON.stringify(canonical(effective))).digest('hex');
}

function runNode(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0
      ? resolve({ stdout, stderr })
      : reject(new Error(`child exited ${code}: ${stderr || stdout}`)));
  });
}

const egApi = await read('egregora-patch/api/admin-commit.js');
const ttiApi = await read('tti/hatchable/api/admin-commit.js');
assert.equal(ttiApi, egApi, 'both projects must expose the same read-only Admin Edit snapshot endpoint');
for (const marker of [
  "state = 'live'", 'page_sources', 'page_dates', 'admin-edit-commit-snapshot',
  "access = 'public'", "methods = ['GET', 'POST']"
]) {
  assert.ok(egApi.includes(marker), `Admin Edit snapshot endpoint is missing ${marker}`);
}
assert.ok(!egApi.includes('SELECT id, page, prompt'), 'the public snapshot must not export admin prompts');

const egEditor = await read('egregora-patch/public/assets/js/admin-edit.js');
const ttiEditor = await read('tti/src/assets/js/admin-edit.js');
for (const [name, source] of [['EGregoRA', egEditor], ['TTI', ttiEditor]]) {
  assert.ok(source.includes('queued for an automatic Git commit before the next deployment'),
    `${name} Admin Edit Mode does not explain its commit queue`);
}

const commitScript = await read('scripts/commit-admin-edit-snapshot.sh');
for (const marker of [
  'git commit --only "$SNAPSHOT"',
  'git push origin "HEAD:refs/heads/$BRANCH"',
  'ADMIN_COMMIT_SHA=',
  'arena/c016ca5c-egregora'
]) {
  assert.ok(commitScript.includes(marker), `automatic Git commit script is missing ${marker}`);
}
assert.ok(commitScript.indexOf('git commit --only') < commitScript.indexOf('git push origin'),
  'the Admin Edit snapshot must be committed before it is pushed');

const workflows = [
  ['EGregoRA', await read('.github/workflows/egregora-patch-deploy.yml')],
  ['TTI', await read('.github/workflows/tti-deploy.yml')]
];
for (const [name, workflow] of workflows) {
  assert.ok(workflow.includes('contents: write'), `${name} workflow cannot push the required commit`);
  assert.ok(workflow.includes('group: serialized-live-deployment-${{ github.ref }}'),
    `${name} workflow is not in the shared deployment serialisation group`);
  const commitGates = [...workflow.matchAll(/commit-admin-edit-snapshot\.sh/g)].map((match) => match.index);
  assert.ok(commitGates.length >= 2,
    `${name} must check Admin Edit state before validation and immediately before deployment`);
  const deployStep = workflow.indexOf('- name: Deploy ');
  assert.ok(deployStep > 0 && commitGates.every((position) => position < deployStep),
    `${name} must complete both Admin Edit commit gates before its deployment step`);
  assert.ok(workflow.includes('${ADMIN_COMMIT_SHA}'),
    `${name} deployment URL imports must use the post-commit SHA`);
  assert.ok(workflow.includes('/api/admin-commit'), `${name} does not read the live snapshot endpoint`);
}

execFileSync('bash', ['-n', 'scripts/commit-admin-edit-snapshot.sh'], { cwd: root });
execFileSync(process.execPath, ['--check', 'scripts/sync-admin-edit-snapshot.mjs'], { cwd: root });
execFileSync(process.execPath, ['--check', 'egregora-patch/api/admin-commit.js'], { cwd: root });
execFileSync(process.execPath, ['--check', 'tti/hatchable/api/admin-commit.js'], { cwd: root });

for (const [relative, site] of [
  ['egregora-patch/public/admin-edits.snapshot.json', 'egregora'],
  ['tti/src/static/admin-edits.snapshot.json', 'tti']
]) {
  const raw = await read(relative);
  const snapshot = JSON.parse(raw);
  assert.equal(snapshot.kind, 'admin-edit-commit-snapshot');
  assert.equal(snapshot.schema, 1);
  assert.equal(snapshot.site, site);
  assert.equal(snapshot.endpointInstalled, true,
    `${site} has already completed endpoint bootstrap and must not return to tolerant mode`);
  assert.ok(Array.isArray(snapshot.edits));
  assert.ok(Array.isArray(snapshot.sources));
  assert.ok(Array.isArray(snapshot.dates));
  assert.equal(snapshot.digest, digest({
    dates: snapshot.dates,
    edits: snapshot.edits,
    sources: snapshot.sources
  }), `${site} snapshot digest does not match its effective public state`);
  const forbiddenKeys = [];
  const inspectKeys = (value, trail = []) => {
    if (Array.isArray(value)) return value.forEach((item, index) => inspectKeys(item, [...trail, index]));
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (/(?:passcode|password|secret|token|prompt|admin(?:istrator)?identity|auditnotes?)/i.test(key)) {
        forbiddenKeys.push([...trail, key].join('.'));
      }
      inspectKeys(child, [...trail, key]);
    }
  };
  inspectKeys(snapshot);
  assert.deepEqual(forbiddenKeys, [], `${site} snapshot exports private editor keys`);
}

const effective = canonical({
  dates: [{ page: '/example/', date: '2026-10-13' }],
  edits: [{
    id: 42,
    page: '/example/',
    ops: [{ op: 'text', ref: 'body > main:nth-of-type(1)', value: 'Committed words' }]
  }],
  sources: []
});
const payload = {
  ok: true,
  kind: 'admin-edit-commit-snapshot',
  schema: 1,
  digest: digest(effective),
  ...effective
};
const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(payload));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const temporary = await mkdtemp(path.join(os.tmpdir(), 'admin-edit-commit-'));
const output = path.join(temporary, 'snapshot.json');
await writeFile(output, `${JSON.stringify({
  dates: [], digest: digest({ dates: [], edits: [], sources: [] }), edits: [],
  endpointInstalled: false, kind: 'admin-edit-commit-snapshot', schema: 1, site: 'fixture', sources: []
}, null, 2)}\n`);
try {
  const args = [
    'scripts/sync-admin-edit-snapshot.mjs', '--site', 'fixture',
    '--endpoint', `http://127.0.0.1:${address.port}/api/admin-commit`,
    '--output', output, '--allow-http'
  ];
  const first = await runNode(args);
  assert.match(first.stdout, /snapshot updated/);
  const written = JSON.parse(await readFile(output, 'utf8'));
  assert.equal(written.site, 'fixture');
  assert.equal(written.endpointInstalled, true);
  assert.equal(written.digest, payload.digest);
  assert.equal(written.edits[0].id, 42);
  assert.equal(written.dates[0].date, '2026-10-13');

  const before = (await stat(output)).mtimeMs;
  const second = await runNode(args);
  assert.match(second.stdout, /snapshot is current/);
  assert.equal((await stat(output)).mtimeMs, before, 'an unchanged snapshot must not be rewritten');
} finally {
  await new Promise((resolve) => server.close(resolve));
  await rm(temporary, { recursive: true, force: true });
}

console.log('Admin Edit commit regression passed: both sites export deterministic state, queue it visibly, commit twice-gated snapshots, and deploy from the committed SHA.');
