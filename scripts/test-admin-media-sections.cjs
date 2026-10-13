#!/usr/bin/env node
/* Guard the podcast admin's three-step order and its one remaining publish
   control in both source templates and both currently served pages. */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const failures = [];
const check = (ok, message) => {
  console.log((ok ? "PASS " : "FAIL ") + message);
  if (!ok) failures.push(message);
};
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

function checkSource(file) {
  const html = read(file);
  const start = html.indexOf('<div data-am="work" hidden>');
  const stop = html.indexOf('{% set faWhere = amKind %}', start);
  const section = start >= 0 && stop > start ? html.slice(start, stop) : "";
  const labels = ["1. Recording", "2. Work", "3. {% if amKind == \"audio\" %}Words{% else %}Details{% endif %}"];
  const positions = labels.map((label) => section.indexOf(label));
  check(positions.every((p) => p >= 0) && positions[0] < positions[1] && positions[1] < positions[2],
    `${file}: source order is Recording → Work → Words`);
  check(!section.includes('data-am="send"'), `${file}: retired send control is absent`);
  check((section.match(/data-am="pubnow"/g) || []).length === 1,
    `${file}: exactly one pubnow control remains`);
}

function checkServed(file, jsFile, site) {
  const html = read(file);
  const start = html.indexOf('<div data-am="work" hidden>');
  const stop = html.indexOf('<div class="freeai" data-fa="root"', start);
  const section = start >= 0 && stop > start ? html.slice(start, stop) : "";
  const labels = ["1. Recording", "2. Work", "3. Words"];
  const positions = labels.map((label) => section.indexOf(label));
  check(positions.every((p) => p >= 0) && positions[0] < positions[1] && positions[1] < positions[2],
    `${site}: served podcast order is Recording → Work → Words`);
  check(!section.includes('data-am="send"'), `${site}: retired send control is absent`);
  check((section.match(/data-am="pubnow"/g) || []).length === 1 &&
        /Publish it on the site/.test(section), `${site}: the existing pubnow action remains`);
  const js = read(jsFile);
  check(/el\.pubnow\s*\)\s*el\.pubnow\.addEventListener\(["']click["'],\s*\(\)\s*=>\s*publishIt\(el\.pubnow\)/.test(js),
    `${site}: pubnow remains wired to publishIt()`);
}

function checkVideo(file, site) {
  const html = read(file);
  check(!html.includes('data-am="send"'), `${site} videos: no retired send button`);
  check((html.match(/data-am="pubnow"/g) || []).length === 1,
    `${site} videos: the remaining pubnow action is present`);
}

checkSource("src/_includes/partials/admin-media.njk");
checkSource("tti/src/_includes/partials/admin-media.njk");
checkServed("hatchable/public/podcast/index.html", "hatchable/public/assets/js/media-admin.js", "EGregoRA");
checkServed("tti/hatchable/public/podcast/index.html", "tti/hatchable/public/assets/js/media-admin.js", "TTI");
checkVideo("hatchable/public/videos/index.html", "EGregoRA");
checkVideo("tti/hatchable/public/videos/index.html", "TTI");
check(/\$\("\[data-am=pubnow\]"\)\s*\|\|\s*\$\("\[data-am=send\]"\)/.test(read("tti/src/assets/js/media-admin.js")),
  "TTI source media-admin script resolves the active pubnow control");

console.log(failures.length ? `\n${failures.length} failure(s)` : "\nAll podcast admin section checks passed.");
process.exitCode = failures.length ? 1 : 0;
