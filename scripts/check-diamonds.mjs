#!/usr/bin/env node
/**
 * Every grading diamond, the right colour.
 *
 * The order grades its claims with a diamond: green for established
 * science, gold for scholarship, violet for speculation, rose for myth and
 * symbol. A diamond that is not inside one of those four classes inherits
 * whatever colour its paragraph happens to be — which looks like a grade
 * and is not one, and is worse than no mark at all.
 *
 * So this walks the built site with a real DOM, finds every U+25C6, and
 * insists that the element it sits in carries exactly one of
 * `sci`, `hist`, `spec` or `myth`. It also checks the stylesheet actually
 * colours those four classes outside any container, so the colour does not
 * depend on the diamond happening to be inside a .frame or a .plate.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const MARK = '\u25c6';
const GRADES = ['sci', 'hist', 'spec', 'myth'];
const fails = [];
let seen = 0;
let pages = 0;

/* 1 — the stylesheet must colour the four classes on their own. */
const css = readFileSync('src/assets/css/main.css', 'utf8');
for (const g of GRADES) {
  const bare = new RegExp('(^|[,{}\\n])\\s*\\.' + g + '\\s*(,[^{]*)?\\{[^}]*color', 'm');
  if (!bare.test(css)) {
    fails.push('main.css  .' + g + ' has no colour of its own, only inside a container');
  }
}

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const f = dir + '/' + n;
  return statSync(f).isDirectory() ? walk(f) : (n.endsWith('.html') ? [f] : []);
});

for (const file of walk('_site')) {
  const page = file.replace('_site', '').replace('index.html', '');
  const dom = new JSDOM(readFileSync(file, 'utf8'));
  const doc = dom.window.document;
  pages += 1;

  const walker = doc.createTreeWalker(doc.body, dom.window.NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.indexOf(MARK) === -1) continue;
    const host = node.parentElement;
    const graded = GRADES.filter((g) => host.classList.contains(g));
    const count = (node.nodeValue.match(/\u25c6/g) || []).length;
    seen += count;
    const near = node.nodeValue.replace(/\s+/g, ' ').trim().slice(0, 70);
    if (!graded.length) {
      fails.push(page + '  ungraded diamond in <' + host.tagName.toLowerCase() +
        (host.className ? ' class="' + host.className + '"' : '') + '>  ' + near);
    } else if (graded.length > 1) {
      fails.push(page + '  diamond carrying two grades (' + graded.join(', ') + ')  ' + near);
    }
  }
  dom.window.close();
}

console.log('check-diamonds \u2014 ' + seen + ' diamonds across ' + pages + ' pages');
if (fails.length) {
  console.log('\n' + fails.length + ' wrongly coloured:');
  for (const f of fails) console.log('  ' + f);
  process.exit(1);
}
console.log('  every one of them inside its own grade class');
