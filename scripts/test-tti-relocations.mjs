#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = fileURLToPath(new URL('../', import.meta.url));
const egRoot = join(repository, 'egregora-patch', 'public');
const routes = [
  {
    slug: 'moebius-seam',
    label: 'The Möbius Seam',
    destination: 'https://the-two-infinities.hatchable.site/moebius/',
    source: 'moebius.njk',
    sourceMarkers: ['t-transferred-audit', 't-double-inversion']
  },
  {
    slug: 'entropy',
    label: 'Entropy and the Phases of Integration',
    destination: 'https://the-two-infinities.hatchable.site/entropy/',
    source: 'entropy.njk',
    sourceMarkers: ['t-two-ledgers', 't-integration-phases', 't-symbolic-poles']
  },
  {
    slug: 'cosmic-ledger',
    label: 'The Cosmic Ledger',
    destination: 'https://the-two-infinities.hatchable.site/cosmic-ledger/',
    source: 'cosmic-ledger.njk',
    sourceMarkers: ['t-transferred-audit', 't-accumulated-bridge']
  }
];

const htmlFiles = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith('.html')) htmlFiles.push(path);
  }
}
await walk(egRoot);

for (const route of routes) {
  const stubPath = join(egRoot, route.slug, 'index.html');
  const stub = await readFile(stubPath, 'utf8');
  assert.ok(stub.length < 5000, `${route.slug} is still a substantive EGregoRA page`);
  assert.ok(stub.includes(`<link rel="canonical" href="${route.destination}">`),
    `${route.slug} does not canonicalise to TTI`);
  assert.ok(stub.includes(`http-equiv="refresh" content="0; url=${route.destination}"`),
    `${route.slug} does not relocate readers to TTI`);
  assert.ok(stub.includes('The Shape of Becoming: Infinity, Gravity and Existence'),
    `${route.slug} does not identify the canonical project`);

  const source = await readFile(join(repository, 'tti', 'src', route.source), 'utf8');
  for (const marker of route.sourceMarkers) {
    assert.ok(source.includes(`id="${marker}"`), `${route.source} omits #${marker}`);
  }

  for (const file of htmlFiles) {
    if (file === stubPath) continue;
    const html = await readFile(file, 'utf8');
    assert.ok(!html.includes(`href="/${route.slug}/`),
      `${relative(egRoot, file)} still links to the retired EG route /${route.slug}/`);
    assert.ok(!html.includes(`"/${route.slug}/`),
      `${relative(egRoot, file)} still advertises the retired EG route /${route.slug}/`);
  }
}

const home = await readFile(join(egRoot, 'index.html'), 'utf8');
for (const route of routes) {
  assert.ok(home.includes(route.destination), `EGregoRA home omits the moved ${route.label} destination`);
}
for (const oldNavLabel of ['<span>The Möbius Seam</span>', '<span>Entropy</span>', '<span>The Cosmic Ledger</span>']) {
  assert.ok(!home.includes(oldNavLabel), `EGregoRA primary navigation retains ${oldNavLabel}`);
}

const siteIndex = await readFile(join(egRoot, 'site-index', 'index.html'), 'utf8');
for (const route of routes) {
  assert.ok(!siteIndex.includes(`id="x-${route.slug}"`), `site index retains ${route.slug}`);
  assert.ok(!siteIndex.includes(`href="#x-${route.slug}"`), `site index table retains ${route.slug}`);
}

const newPages = [
  ['double-inversion.njk', '/double-inversion/', ['Does residue of a single inversion make it through', 'P^2=I', 't-experiment']],
  ['accumulated-differentials.njk', '/accumulated-differentials/', ['F_{n+2}-1', 'frac{\\varphi^2}{\\sqrt5}', 't-conservation']]
];
for (const [name, permalink, markers] of newPages) {
  const source = await readFile(join(repository, 'tti', 'src', name), 'utf8');
  assert.ok(source.includes(`permalink: ${permalink}`), `${name} has the wrong canonical route`);
  assert.ok(source.includes('ogType: article'), `${name} is absent from article syndication`);
  assert.ok(source.includes('class="plate"'), `${name} has no plate for the visual compendium`);
  for (const marker of markers) assert.ok(source.includes(marker), `${name} omits ${marker}`);
}

console.log('TTI relocation passed: three EGregoRA pages reduced to canonical stubs, navigation removed, and five TTI destinations integrated.');

if (process.argv.includes('--live')) {
  let detail = 'relocations did not become current';
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      const checks = await Promise.all(routes.map(async (route) => {
        const response = await fetch(`https://egregora.hatchable.site/${route.slug}/?move=${process.env.GITHUB_SHA || Date.now()}`, {
          headers: { 'cache-control': 'no-cache' }
        });
        const html = await response.text();
        return {
          route,
          status: response.status,
          current: response.ok && html.includes(`href="${route.destination}"`) &&
            html.includes('http-equiv="refresh"') && html.length < 5000
        };
      }));
      const homeResponse = await fetch(`https://egregora.hatchable.site/?move=${process.env.GITHUB_SHA || Date.now()}`, {
        headers: { 'cache-control': 'no-cache' }
      });
      const liveHome = await homeResponse.text();
      const homeCurrent = homeResponse.ok && routes.every((route) => liveHome.includes(route.destination)) &&
        !liveHome.includes('href="/moebius-seam/') && !liveHome.includes('href="/entropy/') &&
        !liveHome.includes('href="/cosmic-ledger/');
      if (checks.every((check) => check.current) && homeCurrent) {
        console.log('Live EGregoRA relocation stubs and canonical TTI discovery links passed.');
        process.exit(0);
      }
      detail = checks.map((check) => `${check.route.slug}=HTTP ${check.status}, current=${check.current}`).join(' | ') +
        ` | homeCurrent=${homeCurrent}`;
    } catch (error) {
      detail = error?.message || String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 8000));
  }
  const safe = String(detail).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A').slice(0, 1800);
  console.log(`::error title=Live TTI relocation audit failed::${safe}`);
  throw new Error(`Live TTI relocation audit failed: ${detail}`);
}
