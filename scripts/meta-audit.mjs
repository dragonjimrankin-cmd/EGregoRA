/**
 * Meta audit — walks the built site and checks that every page carries the
 * full head: unique title and description, a self-referencing canonical, the
 * Open Graph and Twitter sets, an absolute image, valid JSON-LD, one h1, and
 * a lang attribute. Run after `npm run build`:
 *
 *   node scripts/meta-audit.mjs
 *
 * Exits non-zero on any error so CI can refuse a regression.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as cheerio from 'cheerio';

const ROOT = '_site';
const SITE = 'https://egregora.hatchable.site';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const errors = [];
const warnings = [];
const titles = new Map();
const descs = new Map();
const files = walk(ROOT).sort();

for (const file of files) {
  const rel = '/' + relative(ROOT, file).replace(/index\.html$/, '').replace(/\\/g, '/');
  const $ = cheerio.load(readFileSync(file, 'utf8'));
  const err = (m) => errors.push(`${rel}  ${m}`);
  const warn = (m) => warnings.push(`${rel}  ${m}`);
  const meta = (sel) => $(sel).attr('content');

  /* A page that exists only to send a reader somewhere else is held to a
     different standard: it should be noindex and it should say where it is
     going. Asking it for Open Graph art would be asking it to be shared. */
  if (/noindex/i.test(meta('meta[name="robots"]') || '')) {
    if (!$('meta[http-equiv="refresh"]').length && !$('link[rel="canonical"]').length) {
      err('noindex with neither a redirect nor a canonical');
    }
    continue;
  }

  if (!$('html').attr('lang')) err('no lang on <html>');

  const title = $('title').text().trim();
  if (!title) err('no <title>');
  else {
    if (title.length > 70) warn(`title is ${title.length} chars (over 70)`);
    if (titles.has(title)) err(`duplicate title, shared with ${titles.get(title)}`);
    titles.set(title, rel);
  }

  const desc = meta('meta[name="description"]');
  if (!desc) err('no meta description');
  else {
    if (desc.length < 50) warn(`description is only ${desc.length} chars`);
    if (desc.length > 320) warn(`description is ${desc.length} chars (long)`);
    if (descs.has(desc)) warn(`duplicate description, shared with ${descs.get(desc)}`);
    descs.set(desc, rel);
  }

  const canonical = $('link[rel="canonical"]').attr('href');
  const noindex = /noindex/.test(meta('meta[name="robots"]') || '');
  if (!canonical) err('no canonical');
  else if (canonical !== SITE + rel) err(`canonical ${canonical} does not match ${SITE + rel}`);

  for (const prop of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image',
                      'og:site_name', 'og:locale', 'og:image:width', 'og:image:height', 'og:image:alt']) {
    if (!meta(`meta[property="${prop}"]`)) err(`missing ${prop}`);
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
    if (!meta(`meta[name="${name}"]`)) err(`missing ${name}`);
  }
  const img = meta('meta[property="og:image"]');
  if (img && !/^https?:\/\//.test(img)) err('og:image is not absolute');

  let ld = 0;
  $('script[type="application/ld+json"]').each((_, el) => {
    try { JSON.parse($(el).contents().text()); ld++; }
    catch (e) { err('JSON-LD does not parse: ' + e.message); }
  });
  if (!ld && !noindex) err('no JSON-LD');

  const h1 = $('main h1').length;
  if (h1 === 0) warn('no <h1> in <main>');
  if (h1 > 1) warn(`${h1} <h1> elements`);

  if (!$('link[rel="icon"]').length) err('no favicon link');
  if (!$('link[rel="manifest"]').length) err('no manifest link');
}

console.log(`meta-audit — ${files.length} pages`);
for (const w of warnings) console.log('  warn  ' + w);
for (const e of errors) console.log('  ERROR ' + e);
console.log(errors.length ? `\n${errors.length} error(s), ${warnings.length} warning(s)`
                          : `\nclean — ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
