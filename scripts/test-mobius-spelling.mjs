#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../egregora-patch/public/', import.meta.url));
const htmlFiles = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith('.html')) htmlFiles.push(path);
  }
}
await walk(root);

const wrong = [];
let corrected = 0;
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  if (html.includes('Moebius')) wrong.push(relative(root, file));
  corrected += (html.match(/Möbius/g) || []).length;
}
assert.deepEqual(wrong, [],
  'Visible EGregoRA copy and metadata must spell Möbius with an umlaut');
assert.ok(corrected >= 15,
  `Expected the corrected spelling in the retained copy and relocation path, found only ${corrected} occurrences`);

const seamFile = join(root, 'moebius-seam', 'index.html');
assert.ok((await stat(seamFile)).isFile(),
  'the established ASCII route must remain in place for compatible links');
const seam = await readFile(seamFile, 'utf8');
assert.ok(seam.includes('<title>The Möbius Seam'));
assert.ok(seam.includes('href="https://the-two-infinities.hatchable.site/moebius/"'));
assert.ok(seam.includes('http-equiv="refresh"'));
assert.ok(seam.includes('The Möbius Seam'));

const home = await readFile(join(root, 'index.html'), 'utf8');
assert.ok(home.includes('href="https://the-two-infinities.hatchable.site/moebius/"'));
assert.ok(!home.includes('href="/moebius-seam/"'));
const siteIndex = await readFile(join(root, 'site-index', 'index.html'), 'utf8');
assert.ok(!siteIndex.includes('/moebius-seam/'));
assert.ok(!siteIndex.includes('id="x-moebius-seam"'));

console.log(`Möbius spelling passed: ${corrected} corrected display/metadata occurrences across ` +
  `${htmlFiles.length} EGregoRA pages; the stable /moebius-seam/ URL is preserved.`);

if (process.argv.includes('--live')) {
  const routes = [];
  for (const file of htmlFiles) {
    const name = relative(root, file).replaceAll('\\', '/');
    if (name === '404.html') continue;
    routes.push({
      route: name === 'index.html' ? '/'
        : name.endsWith('/index.html') ? '/' + name.slice(0, -10) : '/' + name,
      expectsRight: (await readFile(file, 'utf8')).includes('Möbius')
    });
  }
  let detail = 'live pages did not become current';
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const pages = await Promise.all(routes.map(async ({ route, expectsRight }) => {
        const joiner = route.includes('?') ? '&' : '?';
        const response = await fetch('https://egregora.hatchable.site' + route + joiner +
          'mobius-audit=' + (process.env.GITHUB_SHA || Date.now()), {
          headers: { 'cache-control': 'no-cache' }
        });
        return { route, expectsRight, status: response.status, html: await response.text() };
      }));
      const stale = pages.filter((page) =>
        (page.expectsRight && !page.html.includes('Möbius')) ||
        page.html.includes('Moebius') || page.status < 200 || page.status >= 400);
      const liveCorrected = pages.reduce((sum, page) =>
        sum + (page.html.match(/Möbius/g) || []).length, 0);
      /* The local fixture enforces the exact corpus-wide count above. Live
         redirects and edge rendering can legitimately deduplicate shared
         navigation, so the deployed audit is route-semantic instead: every
         route that contains Möbius locally must contain it live, and no route
         may reintroduce the retired spelling. */
      if (!stale.length) {
        console.log(`Live Möbius spelling passed on ${pages.length} routes with ` +
          `${liveCorrected} corrected display/metadata occurrences.`);
        process.exit(0);
      }
      detail = `corrected=${liveCorrected}; stale=` + stale.map((page) =>
        `${page.route} HTTP ${page.status} expected=${page.expectsRight} ` +
        `right=${page.html.includes('Möbius')} wrong=${page.html.includes('Moebius')}`).join(' | ');
    } catch (error) {
      detail = error && error.message || String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 8000));
  }
  const safeDetail = String(detail).replace(/%/g, '%25').replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A').slice(0, 1800);
  console.log(`::error title=Live Möbius spelling audit failed::${safeDetail}`);
  throw new Error('Live Möbius spelling audit failed: ' + detail);
}
