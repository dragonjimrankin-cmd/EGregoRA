#!/usr/bin/env node
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import site from '../tti/src/_data/site.js';

const projectRoot = path.resolve(process.cwd());
const siteRoot = path.join(projectRoot, 'tti', '_site');
const expectedTitle = 'The Two Infinities: Eternal Integration of the Self';
const retiredTitle = 'The Shape of Becoming: Infinity, Gravity and Existence';
const expectedTagline = 'A speculative cosmology by Jim Rankin, UK, 2026';
const expectedProjectDescription = 'The Two Infinities: Eternal Integration of the Self is an independent speculative cosmology research project founded by Jim Rankin, UK, in 2026. It investigates infinity, geometry, integration, consciousness, gravity, time, topology, cosmic return, mathematical proof auditing and testable failure conditions across thirty studies and four project resources.';
const expectedOrigin = 'https://the-two-infinities.hatchable.site';
const runtimeRoutes = new Set(['/join/', '/account/']);
const expectedArchiveRoutes = site.navGroups.flatMap((group) => group.items.map((item) => item.url));
const expectedFocusRoutes = site.focusAreas.map((focus) => focus.url);
const expectedPartCount = site.navGroups.length;
const essayDocuments = site.navGroups
  .filter((group) => ['I', 'II', 'III', 'IV'].includes(group.part))
  .flatMap((group) => group.items);
const essayMinimumWords = 2_000;
const essayMaximumWords = 4_000;
const expectedPageLabels = new Map(site.navGroups.flatMap((group) => group.items.map((item) => [
  item.url,
  `Part ${group.part} — ${group.shortLabel} · ${item.kind} ${item.code} · ${item.label}`
])));
const normaliseLabel = (text) => text.replace(/\s+/g, ' ').trim().replace(/’/g, "'");
const errors = [];
const notices = [];
let linkedCardCount = 0;

const fail = (message) => errors.push(message);
const note = (message) => notices.push(message);

/* Count the readable essay itself rather than repeated project navigation.
   Headings, equations, captions and evidence notes belong to the paper;
   the project drawer, generated outline and inaccessible SVG labels do not. */
function countEssayWords(text) {
  const normalised = text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{L}\p{N}'-]+/gu, ' ')
    .trim();
  return normalised ? normalised.split(/\s+/).length : 0;
}

async function exists(file) {
  try { return (await stat(file)).isFile(); } catch { return false; }
}

const names = await readdir(siteRoot, { recursive: true });
const htmlFiles = names
  .filter((name) => name.endsWith('.html'))
  .map((name) => path.join(siteRoot, name))
  .sort();

if (htmlFiles.length < 30) fail(`expected at least 30 HTML documents, found ${htmlFiles.length}`);

const documents = new Map();
const canonicals = new Map();
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const relative = path.relative(siteRoot, file).split(path.sep).join('/');
  const urlPath = relative === 'index.html' ? '/' : `/${relative.replace(/index\.html$/, '')}`;
  const $ = cheerio.load(html);
  documents.set(urlPath, { $, html, file, relative });

  if ($('html').attr('lang') !== 'en-GB') fail(`${relative}: html lang must be en-GB`);
  if ($('h1').length !== 1) fail(`${relative}: expected one h1, found ${$('h1').length}`);
  if (!$('head > title').text().trim()) fail(`${relative}: missing title`);
  if ($('head > title').text().trim().length > 70) fail(`${relative}: title exceeds 70 characters`);
  if (!$('meta[name="description"]').attr('content')?.trim()) fail(`${relative}: missing description`);
  if (!$('link[rel="manifest"][href="/site.webmanifest"]').length) fail(`${relative}: missing manifest link`);
  if (!$('link[rel="sitemap"][href="/sitemap.xml"]').length) fail(`${relative}: missing sitemap link`);
  if (!$('link[rel="alternate"][type="application/atom+xml"][href="' + expectedOrigin + '/feed.xml"]').length) {
    fail(`${relative}: missing canonical Atom feed link`);
  }

  const canonical = $('link[rel="canonical"]').attr('href');
  const expectedCanonical = expectedOrigin + urlPath;
  if (canonical !== expectedCanonical) fail(`${relative}: canonical is ${canonical || 'missing'}, expected ${expectedCanonical}`);
  if (canonicals.has(canonical)) fail(`${relative}: duplicate canonical also used by ${canonicals.get(canonical)}`);
  canonicals.set(canonical, relative);

  if (!$('.brand-name').text().includes(expectedTitle)) fail(`${relative}: masthead is missing the exact project title`);
  if (!$('.brand-tag').text().includes(expectedTagline)) fail(`${relative}: masthead is missing the exact tagline`);
  if ($('#primary-nav .focus-nav-link').length !== 3) {
    fail(`${relative}: header does not foreground exactly three conjectures`);
  }
  const focusRoutes = $('#primary-nav .focus-nav-link').map((_, element) => $(element).attr('href')).get();
  if (JSON.stringify(focusRoutes) !== JSON.stringify(expectedFocusRoutes)) {
    fail(`${relative}: focus destinations or ordering drifted`);
  }
  if ($('#primary-nav .nav-archive').length !== 1 || $('#primary-nav .archive-part').length !== expectedPartCount) {
    fail(`${relative}: header archive does not expose all ${expectedPartCount} numbered Parts`);
  }
  const archiveRoutes = $('#primary-nav [data-archive-document]').map((_, element) => $(element).attr('href')).get();
  if (JSON.stringify(archiveRoutes) !== JSON.stringify(expectedArchiveRoutes)) {
    fail(`${relative}: archive destinations or ordering drifted`);
  }
  if (new Set(archiveRoutes).size !== expectedArchiveRoutes.length) fail(`${relative}: archive repeats a destination`);
  if (!$('.nav-toggle[aria-controls="primary-nav"][aria-expanded="false"]').length) {
    fail(`${relative}: mobile navigation toggle is not wired to the primary navigation`);
  }
  const expectedCurrentUrl = urlPath === '/archive/' ? '/archive/' : (expectedArchiveRoutes.includes(urlPath) ? urlPath : null);
  const currentLinks = $('#primary-nav a[aria-current="page"]');
  if (currentLinks.length !== (expectedCurrentUrl ? 1 : 0) ||
      (expectedCurrentUrl && currentLinks.attr('href') !== expectedCurrentUrl)) {
    fail(`${relative}: current archive destination is not marked correctly`);
  }
  const expectedPageLabel = expectedPageLabels.get(urlPath);
  if (expectedPageLabel) {
    const pageLabel = $('main > .page-head > .kicker').first().text();
    if (!normaliseLabel(pageLabel).startsWith(normaliseLabel(expectedPageLabel))) {
      fail(`${relative}: page Part label is ${normaliseLabel(pageLabel) || 'missing'}, expected ${expectedPageLabel}`);
    }
  }
  if (/\bPart (?:VII|VIII)\b/.test($('body').text())) {
    fail(`${relative}: retains an obsolete Part VII or VIII page label`);
  }
  if (html.includes(retiredTitle)) fail(`${relative}: contains the retired project title`);
  if (html.includes('A Geometry of Existence') || html.includes('A Geometry of the Cosmos')) {
    fail(`${relative}: contains a retired tagline`);
  }
  if (/\b(?:localhost|127\.0\.0\.1)\b/.test(html)) fail(`${relative}: contains a browser-facing local address`);

  const ids = new Set();
  $('[id]').each((_, element) => {
    const id = $(element).attr('id');
    if (ids.has(id)) fail(`${relative}: duplicate id #${id}`);
    ids.add(id);
  });

  $('.card--linked').each((index, element) => {
    linkedCardCount += 1;
    const primaryLinks = $(element).find('a.card-link');
    if (primaryLinks.length !== 1) {
      fail(`${relative}: linked card ${index + 1} must have exactly one primary card-link`);
    } else if (!primaryLinks.attr('href')?.trim()) {
      fail(`${relative}: linked card ${index + 1} has no destination`);
    }
  });

  $('script[type="application/ld+json"]').each((index, element) => {
    try { JSON.parse($(element).text()); } catch (error) {
      fail(`${relative}: invalid JSON-LD block ${index + 1}: ${error.message}`);
    }
  });
}

function routeToFile(pathname) {
  if (pathname === '/') return path.join(siteRoot, 'index.html');
  if (pathname.endsWith('/')) return path.join(siteRoot, pathname.slice(1), 'index.html');
  return path.join(siteRoot, pathname.slice(1));
}

for (const [urlPath, { $, relative }] of documents) {
  const refs = [];
  $('a[href], link[href], script[src], img[src], source[src], video[src], audio[src]').each((_, element) => {
    const attr = $(element).attr('href') !== undefined ? 'href' : 'src';
    refs.push({ element, value: $(element).attr(attr), attr });
  });
  for (const { value } of refs) {
    if (!value || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value)) continue;
    let target;
    try { target = new URL(value, expectedOrigin + urlPath); } catch {
      fail(`${relative}: malformed local reference ${value}`);
      continue;
    }
    if (target.origin !== expectedOrigin) continue;
    if (target.pathname.startsWith('/api/') || runtimeRoutes.has(target.pathname)) continue;
    const targetFile = routeToFile(target.pathname);
    if (!(await exists(targetFile))) {
      fail(`${relative}: broken local reference ${value}`);
      continue;
    }
    if (target.hash && target.pathname.endsWith('/')) {
      const targetDoc = documents.get(target.pathname);
      const fragmentId = decodeURIComponent(target.hash.slice(1));
      const hasFragment = targetDoc && targetDoc.$('[id]').toArray()
        .some((element) => targetDoc.$(element).attr('id') === fragmentId);
      if (targetDoc && !hasFragment) fail(`${relative}: missing fragment ${value}`);
    }
  }
}

const home = documents.get('/');
if (!home) {
  fail('homepage was not built');
} else {
  if (home.$('head > title').text().trim() !== expectedTitle) fail('homepage title metadata is not the exact project title');
  const heroTitle = home.$('h1').text().replace(/:\s*/g, ': ').replace(/\s+/g, ' ').trim();
  if (!heroTitle.includes(expectedTitle)) fail('homepage hero is missing the exact project title');
  if (home.$('.focus-hero .kicker').first().text().trim() !== expectedTagline) {
    fail('homepage hero is missing the exact attribution tagline');
  }
  if (home.$('.focus-status').text().trim() !== 'Working hypotheses') {
    fail('homepage research status must read exactly Working hypotheses');
  }
  if (!home.$('.hero-ctas a[href="#fundamental-conjectures"]').length ||
      !home.$('.hero-ctas a[href="/archive/"]').length) {
    fail('homepage hero does not expose the three conjectures and complete archive');
  }
  const focusPillars = home.$('.focus-pillars > .focus-pillar');
  if (focusPillars.length !== 3) fail(`homepage exposes ${focusPillars.length} of 3 fundamental conjectures`);
  const focusTitles = focusPillars.find('h2').map((_, element) => home.$(element).text().trim()).get();
  if (JSON.stringify(focusTitles) !== JSON.stringify([
    'Eternal Integration', 'The Rankin Skeletal Splice', 'Seams and Return'
  ])) fail('homepage fundamental-conjecture order drifted');
  if (focusPillars.find('.focus-equation').length !== 3) {
    fail('every fundamental conjecture must display its representative expression');
  }
  for (const href of [
    '/foundations/', '/the-self/', '/entropy-and-self-renewal/', '/cosmic-ratio-in-time/',
    '/skeletal-splice/', '/spiral/', '/prime-plane/', '/riemann-programme/',
    '/seams/', '/moebius/', '/temporal-antipodes/', '/time-and-residue/'
  ]) {
    if (!focusPillars.find(`a[href="${href}"]`).length) fail(`fundamental conjectures do not expose ${href}`);
  }
}
const archive = documents.get('/archive/');
if (!archive) {
  fail('research archive was not built');
} else {
  if (archive.$('#project-contents .research-toc-part').length !== 6) {
    fail('research archive does not expose all six Parts');
  }
  if (archive.$('#project-contents .research-toc-part > ol > li').length !== 34) {
    fail('research archive does not expose all 34 destinations');
  }
  if (!archive.$('#atlas-box #atlas-data').length || !archive.$('script[src="/assets/js/atlas.js"]').length) {
    fail('research archive does not preserve the interactive Atlas');
  }
}
if (linkedCardCount < 19) fail(`expected at least 19 whole-card destinations in the retained research corpus, found ${linkedCardCount}`);
else note(`${linkedCardCount} navigation cards expose their full surface as a link`);

try {
  const hatchableManifest = await readFile(path.join(projectRoot, 'tti', 'hatchable', 'hatchable.toml'), 'utf8');
  if (!hatchableManifest.includes(`name        = "${expectedTitle}"`)) {
    fail('Hatchable project manifest is missing the exact TTI project name');
  }
  if (!hatchableManifest.includes(`description = "${expectedProjectDescription}"`)) {
    fail('Hatchable project manifest is missing the founder-specific TTI project description');
  }
  for (const stale of ['EGregoRA — Life, Love, Magic', 'founded by Edward Gregory']) {
    if (hatchableManifest.includes(stale)) fail(`Hatchable TTI project manifest retains stale metadata: ${stale}`);
  }

  const workflow = await readFile(path.join(projectRoot, '.github', 'workflows', 'tti-deploy.yml'), 'utf8');
  if (!workflow.includes(`TTI_PROJECT_DESCRIPTION: "${expectedProjectDescription}"`)) {
    fail('TTI deployment workflow does not declare the founder-specific project description');
  }
  for (const option of ['--description "$TTI_PROJECT_DESCRIPTION"', '--intent "$TTI_DEPLOY_INTENT"', '--summary "$TTI_DEPLOY_SUMMARY"']) {
    if (!workflow.includes(option)) fail(`TTI deployment workflow does not pass ${option.split(' ')[0]}`);
  }
  if (!workflow.includes('project metadata synchronised: The Two Infinities: Eternal Integration of the Self')) {
    fail('TTI deployment workflow does not require Hatchable project-metadata synchronisation');
  }

  const deployer = await readFile(path.join(projectRoot, 'scripts', 'hatchable-deploy.mjs'), 'utf8');
  for (const marker of ['PROJECT_DESCRIPTION', 'DEPLOY_INTENT', 'DEPLOY_SUMMARY', 'update_project', 'get_project']) {
    if (!deployer.includes(marker)) fail(`shared Hatchable deployer lacks metadata support: ${marker}`);
  }
  if (!deployer.includes('opt("description",') ||
      !deployer.includes('opt("intent", "Deploy the EGregoRA website")') ||
      !deployer.includes('opt("summary",')) {
    fail('shared Hatchable deployer no longer preserves explicit EGregoRA metadata defaults');
  }
  note('Hatchable project metadata is TTI-specific, founder-attributed and API-synchronised');
} catch (error) {
  fail(`Hatchable project metadata audit failed: ${error.message}`);
}

const manifestPath = path.join(siteRoot, 'site.webmanifest');
try {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.name !== expectedTitle) fail('web manifest name is not the exact project title');
  if (!manifest.description.includes(expectedTagline)) fail('web manifest omits the exact tagline');
} catch (error) {
  fail(`invalid web manifest: ${error.message}`);
}

try {
  const robots = await readFile(path.join(siteRoot, 'robots.txt'), 'utf8');
  if (!robots.includes(`Sitemap: ${expectedOrigin}/sitemap.xml`)) fail('robots.txt has the wrong sitemap origin');
  if (robots.includes('egregora.hatchable.site')) fail('robots.txt still points at the EGregoRA host');
} catch (error) {
  fail(`robots.txt unavailable: ${error.message}`);
}

for (const xmlName of ['sitemap.xml', 'feed.xml']) {
  if (!(await exists(path.join(siteRoot, xmlName)))) fail(`${xmlName} was not built`);
}
try {
  const sitemap = await readFile(path.join(siteRoot, 'sitemap.xml'), 'utf8');
  for (const pathname of documents.keys()) {
    if (!sitemap.includes(`<loc>${expectedOrigin}${pathname}</loc>`)) fail(`sitemap omits ${pathname}`);
  }
  if (sitemap.includes('egregora.hatchable.site')) fail('sitemap contains the EGregoRA origin');
} catch {}
try {
  const feed = await readFile(path.join(siteRoot, 'feed.xml'), 'utf8');
  if (!feed.includes(`<title>${expectedTitle}</title>`)) fail('feed title is incorrect');
  if (!feed.includes(`<subtitle>${expectedTagline}</subtitle>`)) fail('feed tagline is incorrect');
  if (!feed.includes(`${expectedOrigin}/little-red-dots/research-proposal/`)) fail('feed omits the research proposal');
  if (!feed.includes(`${expectedOrigin}/temporal-antipodes/`)) fail('feed omits Temporal Antipodes');
  for (const pathname of ['/pi-from-zero-and-one/', '/entropy/', '/wormholes/', '/double-inversion/', '/accumulated-differentials/']) {
    if (!feed.includes(`${expectedOrigin}${pathname}`)) fail(`feed omits ${pathname}`);
  }
} catch {}

const plates = documents.get('/plates/');
if (!plates) {
  fail('plate room was not built');
} else {
  let sourcePlateCount = 0;
  for (const [pathname, document] of documents) {
    if (pathname === '/plates/') continue;
    sourcePlateCount += document.$('figure.plate').length;
  }
  const gathered = plates.$('figure.plate[data-plate-source]').length;
  if (gathered !== sourcePlateCount) fail(`plate room gathers ${gathered} of ${sourcePlateCount} source plates`);
  const plateGroups = plates.$('.plate-accordion > .plate-accordion-group');
  if (plateGroups.length !== 26) fail(`plate room exposes ${plateGroups.length} of 26 source headings`);
  if (plates.$('.plate-accordion-group[name="plate-room"]').length !== plateGroups.length) {
    fail('plate room headings do not form one native exclusive disclosure group');
  }
  if (plates.$('.frame--first.illuminated').first().find('ul, li').length) {
    fail('plate room retains its obsolete bullet index');
  }
  if (plates.$('.plate-accordion-group[open]').length) fail('plate room does not begin fully collapsed');
  note(`plate room reconciled ${gathered} source plates beneath ${plateGroups.length} exclusive headings`);
}

const proposalLinks = [
  '/', '/little-red-dots/', '/essays/', '/stress-tests/', '/time-and-residue/', '/inverted-toruses/'
];
for (const pathname of proposalLinks) {
  const doc = documents.get(pathname);
  if (!doc?.$(`a[href="/little-red-dots/research-proposal/"]`).length) {
    fail(`${pathname} does not link to the Zero-Seam research proposal`);
  }
}

const transferredPages = new Map([
  ['/entropy/', ['t-two-ledgers', 't-boltzmann', 't-integration-phases', 't-symbolic-poles', 't-bridge']],
  ['/double-inversion/', ['t-answer', 't-moebius-frame', 't-polarization', 't-residue-ledger', 't-experiment']],
  ['/accumulated-differentials/', ['t-three-levels', 't-calculus', 't-einstein', 't-splice', 't-conservation']]
]);
for (const [pathname, ids] of transferredPages) {
  const doc = documents.get(pathname);
  if (!doc) {
    fail(`${pathname} was not built`);
    continue;
  }
  for (const id of ids) {
    if (!doc.$(`[id="${id}"]`).length) fail(`${pathname} omits #${id}`);
  }
  if (!doc.$('figure.plate').length) fail(`${pathname} has no visual-compendium plate`);
}
const wormholes = documents.get('/wormholes/');
if (!wormholes) {
  fail('Wormholes and Inverted Tori was not built');
} else {
  for (const id of [
    't-proposal', 't-three-objects', 't-morris-thorne', 'fig-wormhole-or-seam',
    't-models', 't-transport', 't-junction', 't-two-crossings', 't-causality',
    't-observables', 't-censorship', 't-programme', 't-ledger'
  ]) {
    if (!wormholes.$(`[id="${id}"]`).length) fail(`/wormholes/ omits #${id}`);
  }
  if (wormholes.$('figure.plate').length !== 1) fail('/wormholes/ must contribute exactly one plate');
}
for (const pathname of ['/', '/torus/', '/moebius/', '/seams/', '/inverted-toruses/', '/essays/', '/stress-tests/']) {
  const doc = documents.get(pathname);
  if (!doc?.$('a[href="/wormholes/"]').length) fail(`${pathname} does not expose /wormholes/`);
}

for (const [pathname, href] of [
  ['/moebius/', '/double-inversion/'],
  ['/cosmic-ledger/', '/accumulated-differentials/'],
  ['/gravity/', '/accumulated-differentials/'],
  ['/dx/', '/accumulated-differentials/'],
  ['/skeletal-splice/', '/accumulated-differentials/'],
  ['/essays/', '/entropy/'],
  ['/entropy/', '/entropy-and-self-renewal/'],
  ['/the-self/', '/entropy-and-self-renewal/'],
  ['/essays/', '/entropy-and-self-renewal/'],
  ['/gravity/', '/cosmic-ratio-in-time/'],
  ['/cosmic-ledger/', '/cosmic-ratio-in-time/'],
  ['/essays/', '/cosmic-ratio-in-time/'],
  ['/entropy-and-self-renewal/', '/cosmic-ratio-in-time/'],
  ['/cosmic-ratio-in-time/', '/entropy-and-self-renewal/'],
  ['/essays/', '/double-inversion/'],
  ['/essays/', '/accumulated-differentials/']
]) {
  const doc = documents.get(pathname);
  if (!doc?.$(`a[href="${href}"]`).length) fail(`${pathname} does not expose ${href}`);
}

const temporalAntipodeLinks = [
  '/', '/foundations/', '/seams/', '/stress-tests/', '/essays/', '/prime-plane/',
  '/time-and-residue/', '/inverted-toruses/', '/out-of-phase/'
];
for (const pathname of temporalAntipodeLinks) {
  const doc = documents.get(pathname);
  if (!doc?.$(`a[href="/temporal-antipodes/"]`).length) {
    fail(`${pathname} does not link to the Temporal Antipodes conjecture`);
  }
}
const temporalAntipodes = documents.get('/temporal-antipodes/');
if (!temporalAntipodes) {
  fail('Temporal Antipodes was not built');
} else {
  for (const id of ['t-proposal', 't-names', 't-compact-time', 't-synchrony', 't-test', 't-ledger']) {
    if (!temporalAntipodes.$(`[id="${id}"]`).length) fail(`Temporal Antipodes omits #${id}`);
  }
  if (!temporalAntipodes.$('figure.plate').length) fail('Temporal Antipodes has no plate');
}

const firstPrincipleAdditions = [
  ['/entropy-and-self-renewal/', 'Entropy as the Cost of Self-Renewal',
    ['t-answer', 't-entropy-account', 't-throughput', 't-bridge-law', 't-reversal', 't-conservation', 't-failure', 't-verdict'],
    ['A-D', 'A+D', 'sigma', 'T_{I}']],
  ['/cosmic-ratio-in-time/', 'The Cosmic Ratio in Time',
    ['t-answer', 't-density-parameters', 't-scaling', 't-three-swaps', 't-exchange', 't-conservation', 't-observations', 't-failure', 't-verdict'],
    ['a^{-3}', 'a^{-4}', 'Q_i', 'sum_i Q_i=0']]
];
for (const [pathname, label, ids, equationMarkers] of firstPrincipleAdditions) {
  const document = documents.get(pathname);
  if (!document) {
    fail(`${label} was not built`);
    continue;
  }
  for (const id of ids) {
    if (!document.$(`[id="${id}"]`).length) fail(`${label} omits #${id}`);
  }
  for (const marker of equationMarkers) {
    if (!document.html.includes(marker)) fail(`${label} omits equation marker ${marker}`);
  }
}

/* Parts I-IV are the project's long-form essays. Part V contains functional
   resources, while Part VI contains concise mathematical dossier studies. */
if (essayDocuments.length !== 27) {
  fail(`expected 27 Part I-IV research essays, found ${essayDocuments.length}`);
}
const essayLengths = [];
for (const essayRecord of essayDocuments) {
  const document = documents.get(essayRecord.url);
  if (!document) {
    fail(`${essayRecord.code}: essay was not built at ${essayRecord.url}`);
    continue;
  }

  const essay = document.$('main').clone();
  essay.find('.document-outline, .project-context, .editorial-guide, .longform-synthesis, nav, script, style, svg, .skip-link').remove();
  const wordCount = countEssayWords(essay.text());
  essayLengths.push({ code: essayRecord.code, url: essayRecord.url, wordCount });

  if (wordCount < essayMinimumWords || wordCount > essayMaximumWords) {
    fail(`${essayRecord.code} ${essayRecord.url}: ${wordCount} essay words; expected ${essayMinimumWords}-${essayMaximumWords}`);
  }

  const sectionHeadings = essay.find('h2');
  if (sectionHeadings.length < 4) {
    fail(`${essayRecord.code} ${essayRecord.url}: needs at least four named essay sections for navigation`);
  }
  if (sectionHeadings.filter((_, element) => !document.$(element).attr('id')).length) {
    fail(`${essayRecord.code} ${essayRecord.url}: every h2 needs a stable outline id`);
  }
  if (!essay.find('.lede').length) {
    fail(`${essayRecord.code} ${essayRecord.url}: missing a plain-language lede`);
  }
  const paragraphs = essay.find('p');
  if (paragraphs.length < 12) {
    fail(`${essayRecord.code} ${essayRecord.url}: needs at least twelve readable prose paragraphs`);
  }
  paragraphs.each((_, element) => {
    const paragraphWords = countEssayWords(document.$(element).text());
    if (paragraphWords > 150) {
      fail(`${essayRecord.code} ${essayRecord.url}: one paragraph has ${paragraphWords} words; split it below 150`);
    }
  });
  if (!essay.find('.sci, .spec, .hist, .myth').length) {
    fail(`${essayRecord.code} ${essayRecord.url}: missing evidence-grade markers`);
  }
}
if (essayLengths.length) {
  const shortest = essayLengths.reduce((left, right) => left.wordCount < right.wordCount ? left : right);
  const longest = essayLengths.reduce((left, right) => left.wordCount > right.wordCount ? left : right);
  note(`${essayLengths.length} Part I-IV essays hold ${shortest.wordCount}-${longest.wordCount} words (${shortest.code} to ${longest.code}) with accessible sectioning, ledes and evidence grading`);
}

if (errors.length) {
  console.error(`TTI audit failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`TTI audit passed: ${htmlFiles.length} HTML documents, ${canonicals.size} unique canonicals.`);
for (const message of notices) console.log(`  ${message}.`);
console.log('  Exact identity, three fundamental conjectures, the complete six-Part archive, theorem-led π paper, Riemann correction ledger, exclusive plate accordion, metadata, discovery, links, fragments, JSON-LD, transferred essays, new bridges and proposal surfaces passed.');
