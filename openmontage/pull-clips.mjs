#!/usr/bin/env node
/*
 * Pull clips the order has already generated at /api/video into a local
 * folder that OpenMontage can cut. Node 18+ (global fetch), no packages.
 *
 *   node openmontage/pull-clips.mjs --ids 3,4,7 --out openmontage/projects/first-cut
 *
 * Ids are the job ids returned by POST /api/video (the Ask Ed page shows
 * them in the clip card). Each ready clip is downloaded and listed in
 * assets.json with its prompt, so the asset-director skill can read the
 * provenance straight off disk.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { argv } from 'node:process';

const arg = (name, fallback) => {
  const i = argv.indexOf('--' + name);
  return i > -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const base = arg('base', 'https://egregora.hatchable.site');
const out = arg('out', 'openmontage/projects/untitled');
const ids = arg('ids', '').split(',').map((s) => s.trim()).filter(Boolean);

if (!ids.length) {
  console.error('Give me some job ids:  --ids 3,4,7');
  process.exit(1);
}

await mkdir(out, { recursive: true });
const assets = [];

for (const id of ids) {
  const res = await fetch(`${base}/api/video?id=${encodeURIComponent(id)}`);
  if (!res.ok) { console.error(`job ${id}: HTTP ${res.status}`); continue; }
  const job = await res.json();
  if (job.status !== 'ready' || !job.url) {
    console.error(`job ${id}: ${job.status}${job.error ? ' — ' + job.error : ''}`);
    continue;
  }
  const bin = await fetch(job.url);
  const name = `clip-${id}.mp4`;
  await writeFile(`${out}/${name}`, Buffer.from(await bin.arrayBuffer()));
  assets.push({
    clip_id: `egregora-${id}`,
    file: name,
    prompt: job.prompt || '',
    model: job.model || 'unknown',
    provider: 'EGregoRA /api/video',
    original_url: job.url,
    license: 'generated for EGregoRA; no third-party footage'
  });
  console.log(`✓ ${name}  ${job.prompt || ''}`);
}

await writeFile(`${out}/assets.json`, JSON.stringify({ source: base, assets }, null, 2));
console.log(`\n${assets.length} clip(s) in ${out}/ — assets.json written.`);
