#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';

const root = path.resolve(process.cwd());
const builtRoot = path.join(root, 'tti', '_site');
const output = path.join(root, 'tti', 'src', 'plates.njk');

const pages = [
  ['index.html', '/', 'Introduction', 'introduction'],
  ['foundations/index.html', '/foundations/', 'Foundations', 'foundations'],
  ['the-self/index.html', '/the-self/', 'The Self', 'the-self'],
  ['dx/index.html', '/dx/', 'dx', 'dx'],
  ['gravity/index.html', '/gravity/', 'Gravity', 'gravity'],
  ['spiral/index.html', '/spiral/', 'The Spiral', 'spiral'],
  ['skeletal-splice/index.html', '/skeletal-splice/', 'The Splice', 'skeletal-splice'],
  ['torus/index.html', '/torus/', 'Torus', 'torus'],
  ['megatubule/index.html', '/megatubule/', 'The Megatubule', 'megatubule'],
  ['moebius/index.html', '/moebius/', 'Möbius', 'moebius'],
  ['cosmic-ledger/index.html', '/cosmic-ledger/', 'Cosmic Ledger', 'cosmic-ledger'],
  ['seams/index.html', '/seams/', 'Seams', 'seams'],
  ['stress-tests/index.html', '/stress-tests/', 'Stress Tests', 'stress-tests'],
  ['essays/index.html', '/essays/', 'Essays', 'essays'],
  ['prime-plane/index.html', '/prime-plane/', 'The Prime Plane', 'prime-plane'],
  ['temporal-antipodes/index.html', '/temporal-antipodes/', 'Temporal Antipodes', 'temporal-antipodes'],
  ['entropy/index.html', '/entropy/', 'Entropy and Integration', 'entropy'],
  ['double-inversion/index.html', '/double-inversion/', 'Two Inversions', 'double-inversion'],
  ['accumulated-differentials/index.html', '/accumulated-differentials/', 'Accumulated Differentials', 'accumulated-differentials'],
  ['time-and-residue/index.html', '/time-and-residue/', 'Time and Residue', 'time-and-residue'],
  ['inverted-toruses/index.html', '/inverted-toruses/', 'Inverted Tori', 'inverted-toruses'],
  ['out-of-phase/index.html', '/out-of-phase/', 'Matter and Antimatter Out of Phase', 'out-of-phase'],
  ['little-red-dots/index.html', '/little-red-dots/', 'JWST’s Little Red Dots', 'little-red-dots']
];

function safeId(value) {
  return String(value || 'mark').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function prefixFigureIds($, $figure, prefix) {
  const replacements = new Map();
  $figure.find('[id]').addBack('[id]').each((_, element) => {
    const oldId = $(element).attr('id');
    if (!oldId) return;
    const newId = element === $figure.get(0) ? prefix : `${prefix}-${safeId(oldId)}`;
    replacements.set(oldId, newId);
    $(element).attr('id', newId);
  });
  if (!$figure.attr('id')) $figure.attr('id', prefix);

  const attrs = ['fill', 'stroke', 'filter', 'clip-path', 'mask', 'marker-start', 'marker-mid',
    'marker-end', 'href', 'xlink:href', 'aria-labelledby', 'aria-describedby'];
  $figure.find('*').addBack().each((_, element) => {
    const node = $(element);
    for (const attr of attrs) {
      let value = node.attr(attr);
      if (!value) continue;
      for (const [oldId, newId] of replacements) {
        value = value
          .replaceAll(`url(#${oldId})`, `url(#${newId})`)
          .replaceAll(`#${oldId}`, `#${newId}`)
          .split(' ').map((token) => token === oldId ? newId : token).join(' ');
      }
      node.attr(attr, value);
    }
  });
}

const groups = [];
let total = 0;
for (const [file, url, title, slug] of pages) {
  let html;
  try {
    html = await readFile(path.join(builtRoot, file), 'utf8');
  } catch (error) {
    throw new Error(`Build the TTI site before gathering plates; missing ${file}: ${error.message}`);
  }
  const $ = cheerio.load(html);
  const figures = [];
  $('figure.plate').each((index, element) => {
    const fragment = cheerio.load($.html(element), null, false);
    const figure = fragment('figure').first();
    const prefix = `plate-${slug}-${index + 1}`;
    prefixFigureIds(fragment, figure, prefix);
    figure.attr('data-plate-source', url);
    figure.append(`\n<p class="muted xsmall">Drawn in context on <a href="${url}">${title}</a>.</p>\n`);
    figures.push(fragment.html(figure));
  });
  if (figures.length) {
    groups.push({ url, title, slug, figures });
    total += figures.length;
  }
}

const indexItems = groups.map((group) =>
  `      <li><a href="#g-${group.slug}">${group.title}</a> <span class="muted">&mdash; ${group.figures.length} ${group.figures.length === 1 ? 'plate' : 'plates'}</span></li>`
).join('\n');

const sections = groups.map((group) => `
<div class="divider">✦</div>
<section class="wrap narrow reveal">
  <div class="frame">
    <p class="kicker">Gathered from <a href="${group.url}">${group.title}</a></p>
    <h2 id="g-${group.slug}">${group.title}</h2>
    <p class="muted small">${group.figures.length} ${group.figures.length === 1 ? 'plate' : 'plates'}, drawn in place on that page and reproduced here unchanged.</p>
  </div>
</section>
${group.figures.map((figure) => `<section class="wrap reveal">\n${figure}\n</section>`).join('\n')}
`).join('');

const document = `---
layout: layouts/base.njk
title: The Plates
permalink: /plates/
description: "Every plate drawn across The Shape of Becoming: Infinity, Gravity and Existence, gathered in one accessible vector compendium and linked back to its argument."
---

<!-- GENERATED by scripts/tti-gather-plates.mjs from tti/_site. Do not hand-edit. -->

<section class="page-head">
  <p class="kicker">The Visual Compendium &middot; ${total} plates</p>
  <h1>The Plates</h1>
  <p class="lede muted"><strong>Z</strong>oom as far as you like; nothing will blur.</p>
</section>

<section class="wrap narrow reveal">
  <div class="frame frame--first illuminated">
    <p class="lede">Every figure the site draws, collected. Each one is vector, built in the page it belongs
      to and reproduced here with a link back to the complete argument.</p>
    <ul>
${indexItems}
    </ul>
    <p class="muted small">Grading: <span class="sci">&#9670; established</span> &middot;
      <span class="hist">&#9670; scholarship</span> &middot;
      <span class="spec">&#9670; the framework&rsquo;s argument</span> &middot;
      <span class="myth">&#9670; vision, stated as vision</span>.</p>
  </div>
</section>
${sections}
<div class="divider">✦</div>
<section class="wrap narrow reveal">
  <div class="frame frame--creed">
    <p class="lede">A diagram is an argument you can check at a glance. These are kept together so the
      shape of the whole framework can be read before a word of it is.</p>
    <p class="muted small">Continue with <a href="/stress-tests/">the framework&rsquo;s declared failure conditions</a>
      or <a href="/ask-shakdrah/">ask ShakDrah</a>.</p>
  </div>
</section>
`;

const cleanDocument = document.replace(/[ \t]+$/gm, '');
await writeFile(output, cleanDocument, 'utf8');
console.log(`Gathered ${total} plates from ${groups.length} pages into ${path.relative(root, output)}.`);
