#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

function option(name, fallback = '') {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function flag(name) {
  return process.argv.includes(`--${name}`);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

function effectiveFrom(value) {
  const dates = Array.isArray(value?.dates) ? value.dates.map((row) => ({
    page: String(row?.page || '/'), date: String(row?.date || '')
  })).filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date)) : [];
  const edits = Array.isArray(value?.edits) ? value.edits.map((row) => ({
    id: Number(row?.id), page: String(row?.page || '/'),
    ops: Array.isArray(row?.ops) ? canonical(row.ops) : []
  })).filter((row) => Number.isFinite(row.id) && row.ops.length) : [];
  const sources = Array.isArray(value?.sources) ? value.sources.map((row) => ({
    page: String(row?.page || '/'), html: String(row?.html || '')
  })).filter((row) => row.html) : [];

  dates.sort((left, right) => left.page.localeCompare(right.page));
  edits.sort((left, right) => left.page.localeCompare(right.page) || left.id - right.id);
  sources.sort((left, right) => left.page.localeCompare(right.page));
  return canonical({ dates, edits, sources });
}

function digest(effective) {
  return createHash('sha256').update(JSON.stringify(effective)).digest('hex');
}

async function existingSnapshot(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); } catch { return null; }
}

function isEmpty(snapshot) {
  const effective = effectiveFrom(snapshot || {});
  return !effective.dates.length && !effective.edits.length && !effective.sources.length;
}

const endpoint = option('endpoint');
const output = path.resolve(option('output'));
const site = option('site');
if (!endpoint || !option('output') || !site) {
  throw new Error('Usage: sync-admin-edit-snapshot --site <name> --endpoint <url> --output <file>');
}
if (!/^https:\/\//i.test(endpoint) && !flag('allow-http')) {
  throw new Error('The Admin Edit snapshot endpoint must use HTTPS.');
}

const existing = await existingSnapshot(output);
const mayBootstrap = flag('allow-missing-empty') && existing?.endpointInstalled === false && isEmpty(existing);
function retainBootstrap(reason) {
  if (!mayBootstrap) return false;
  console.log(`${site}: ${reason}; empty bootstrap snapshot retained until the endpoint is deployed.`);
  return true;
}

let response;
try {
  response = await fetch(endpoint, {
    headers: { accept: 'application/json', 'cache-control': 'no-cache' },
    signal: AbortSignal.timeout(20_000)
  });
} catch (error) {
  if (retainBootstrap(`Admin Edit snapshot endpoint is not reachable (${error.message})`)) process.exit(0);
  throw new Error(`Admin Edit snapshot could not be reached: ${error.message}`);
}

if (!response.ok) {
  if (retainBootstrap(`Admin Edit snapshot endpoint returned HTTP ${response.status}`)) process.exit(0);
  throw new Error(`Admin Edit snapshot returned HTTP ${response.status}; deployment must not continue.`);
}

let payload;
try { payload = await response.json(); } catch {
  if (retainBootstrap('Admin Edit snapshot endpoint has not begun returning JSON')) process.exit(0);
  throw new Error('Admin Edit snapshot did not return JSON.');
}
if (payload?.kind !== 'admin-edit-commit-snapshot' || Number(payload?.schema) !== 1) {
  if (retainBootstrap('Admin Edit snapshot endpoint has not installed the expected schema')) process.exit(0);
  throw new Error('Admin Edit snapshot has an unknown schema.');
}

const effective = effectiveFrom(payload);
const calculated = digest(effective);
if (payload.digest !== calculated) {
  throw new Error('Admin Edit snapshot digest did not match its effective page state.');
}

const snapshot = canonical({
  kind: 'admin-edit-commit-snapshot',
  schema: 1,
  site,
  endpointInstalled: true,
  digest: calculated,
  ...effective
});
const content = `${JSON.stringify(snapshot, null, 2)}\n`;
let previous = '';
try { previous = await readFile(output, 'utf8'); } catch { /* first snapshot */ }
if (previous === content) {
  console.log(`${site}: Admin Edit repository snapshot is current (${calculated.slice(0, 12)}).`);
  process.exit(0);
}

const temporary = `${output}.tmp-${process.pid}`;
await writeFile(temporary, content);
await rename(temporary, output);
console.log(`${site}: Admin Edit repository snapshot updated (${calculated.slice(0, 12)}).`);
