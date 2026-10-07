import { harness, pages } from './lib/dom-harness.mjs';

/**
 * The same smoke test, at a desk.
 *
 * check-phone.mjs proves the site works under a thumb. This proves it works
 * under a mouse at 1440x900: every page loaded with its scripts running,
 * every one of them swept for anything that throws, and then the handful of
 * arrangements that only exist on a wide screen checked by hand — the
 * oracle's panel, the live room's door, the plates.
 *
 * It also carries the wrapping check that neither of the other two can do
 * from markup alone: any run of text long enough to push a column sideways
 * must either be breakable English or sit inside something the stylesheet
 * has given permission to break anywhere.
 */
const DESK = { width: 1440, height: 900 };
const fails = [];
const notes = [];
const bad = (page, what) => fails.push(page + '  ' + what);
const open = harness(DESK, bad);

/* Classes the stylesheet lets break mid-word, so a long string inside one
   of them is not a fault. Kept in step with the wrapping block at the end
   of main.css. */
const BREAKABLE = /\b(acct-email|invite-link|mono|tape-name|file-name|chat-line|code|biblio)\b/;

const TESTS = [
  ['/', async ({ doc }, t) => {
    t(doc.querySelector('.site-nav'), 'the navigation is on the page');
    t([...doc.querySelectorAll('.card')].length >= 11, 'all eleven limbs are shown');
    t(/Co-founded by Edward Gregory/i.test(doc.body.textContent),
      'the hero still says co-founded, never founded');
    t(/Life, Love, Magic/.test(doc.body.textContent), 'the tagline is intact');
    t(/Cosmic Ledger/.test(doc.body.textContent), 'the new limb is linked from the front page');
  }],

  ['/ask-ed/', async ({ doc }, t) => {
    const panel = doc.querySelector('.fox-panel--ask');
    t(panel, 'the fox panel is on the page');
    const side = panel.querySelector('.fox-side');
    const stage = panel.querySelector('.fox-stage');
    t(side && stage, "Gink's text block and the fox are both present");
    const order = [...panel.querySelectorAll('*')];
    t(order.indexOf(side) < order.indexOf(stage), "Gink's text block sits above the fox");
    t(side.querySelector('#fox-speak') && side.querySelector('#fox-stop') &&
      side.querySelector('#fox-status'),
      'name, Speak, Silence and status are all in that block');
    const chat = panel.querySelector('.oracle-chat');
    t(order.indexOf(stage) < order.indexOf(chat), 'the fox panel sits above the conversation');
    t(panel.querySelector('.fox-ask'), 'the ask-question box lives inside the fox panel');
    const chips = [...doc.querySelectorAll('#oracle-chips .chip')];
    t(chips.length >= 12, 'at least a dozen preset questions are offered');
    t(chips.every((c) => c.textContent.trim().length > 0), 'every chip carries a question');
  }],

  ['/live/', async ({ doc }, t) => {
    t(doc.querySelector('[data-lv="invite"]'),
      'the broadcaster has somewhere to be handed an invite link');
    t(doc.querySelectorAll('input[name="lw-element"]').length === 5,
      'all five elemental phases are offered at the door');
    t(/No identity or age check is asked of anyone just to\s+watch/i
      .test(doc.body.textContent.replace(/\s+/g, ' ')) ||
      /no identity or age check/i.test(doc.body.textContent),
      'the door says plainly that watching needs no identity check');
    t(/Join the order/i.test(doc.body.textContent), 'the door points a non-member at /join/');
  }],

  ['/entropy/', async ({ dom, doc }, t) => {
    /* Admin Edit Mode: present on an ordinary page, locked, and bottom-left
       of the document just above the footer. */
    const open = doc.querySelector('.admin-edit-open');
    t(open, 'the Admin Edit Mode button is on the page');
    const mount = doc.querySelector('.admin-edit-mount');
    t(mount && mount.nextElementSibling && mount.nextElementSibling.matches('footer.site-foot'),
      'it sits immediately above the footer');
    open.dispatchEvent(new dom.window.Event('click', { bubbles: true }));
    const panel = doc.querySelector('.admin-edit-panel');
    t(panel, 'pressing it opens the door');
    t(panel.classList.contains('admin-edit-locked'), 'and the door asks for the passcode first');
    t(panel.querySelector('input[type="password"]'), 'with a password field, not a browser prompt');
    t(!doc.querySelector('.ae-pick'), 'the selection tool stays shut until the passcode is given');

    /* And with the word given (the harness's stand-in API accepts it), the
       tool itself: a rectangle, a prompt, undo and redo, and two separate
       confirmations that are not shown until there is something to confirm. */
    panel.querySelector('input[type="password"]').value = '8===D';
    panel.querySelector('.ae-unlock').dispatchEvent(new dom.window.Event('click', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 30));
    const tool = doc.querySelector('.admin-edit-panel');
    t(tool && tool.querySelector('.ae-pick'), 'the selection tool opens once the door is open');
    t(tool.querySelector('.ae-prompt'), 'there is somewhere to say what should change');
    t(tool.querySelector('.ae-undo') && tool.querySelector('.ae-redo'),
      'undo and redo for the prompts are both there');
    t(tool.querySelector('.ae-publish') && !tool.querySelector('.ae-arm'),
      'one confirmation to publish, not two');
    t(tool.querySelector('.ae-confirm').hidden, 'and it stays hidden until something is proposed');
    t(/until it is\s+confirmed/i.test(tool.textContent.replace(/\s+/g, ' ')) ||
      /confirmed/i.test(tool.textContent),
      'the panel says a change must be confirmed before it takes effect');
    t(/logged/i.test(tool.textContent), 'and that every change is logged');
    t(tool.querySelector('.ae-log'), 'the log can be opened from the panel');
  }],

  ['/cosmic-ledger/', async ({ doc }, t) => {
    const plates = [...doc.querySelectorAll('figure.plate')];
    t(plates.length >= 14, 'the compendium carries its fourteen plates');
    t(plates.every((f) => f.querySelector('.plate-art svg[role="img"]')),
      'every plate is live vector art with a role');
    t(plates.every((f) => f.querySelector('.plate-art svg[aria-label]')),
      'every plate is described for a screen reader');
    t(/Two Infinities Framework/.test(doc.body.textContent), 'the framework is named');
    t(/shakradragon@gmail\.com/.test(doc.body.innerHTML), 'the contact address is given');
  }],

  ['/moebius-seam/', async ({ doc }, t) => {
    t(/Rankin Skeletal Splice/.test(doc.body.textContent), 'the Splice is named');
    t(/Two Infinities Framework/.test(doc.body.textContent),
      'the Splice is placed inside the framework');
    t(/shakradragon@gmail\.com/.test(doc.body.innerHTML), 'questions have somewhere to go');
  }],

  ['/infographics/', async ({ doc }, t) => {
    const plates = [...doc.querySelectorAll('figure.plate')];
    t(plates.length >= 79, 'its own plates plus a copy of every plate drawn elsewhere');
    t([...doc.querySelectorAll('.plate-link')].length >= 90,
      'every gathered plate links back to the page it belongs to');
    t(/^\s*Z/.test(doc.querySelector('.lede')?.textContent || ''), 'the lede still begins with Zoom');
  }]
];

/* ------------------------------------------------------- the wrapping test */
function wrapping(page, doc) {
  const walker = doc.createTreeWalker(doc.body, 4 /* text nodes */);
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent) continue;
    const tag = parent.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'svg' || parent.closest('svg')) continue;
    const cls = parent.className && parent.className.baseVal === undefined
      ? String(parent.className) : '';
    if (BREAKABLE.test(cls) || tag === 'code' || tag === 'pre') continue;
    for (const word of node.textContent.split(/\s+/)) {
      /* 46 characters of unbroken text is about the width of a narrow
         column at reading size. Anything longer has to be in a box that is
         allowed to break, or it will push the page sideways. */
      if (word.length > 46) {
        bad(page, 'a ' + word.length + '-character unbroken string in <' + tag + '>: ' +
          word.slice(0, 40) + '\u2026');
        return;
      }
    }
  }
}

for (const [page, run] of TESTS) {
  const { dom, doc, errors } = await open(page);
  const t = (cond, what) => (cond ? notes.push('    ' + page + '  ' + what) : bad(page, what));
  try {
    await run({ dom, doc }, t);
  } catch (e) {
    bad(page, 'threw: ' + e.message);
  }
  wrapping(page, doc);
  for (const e of errors) {
    if (/Not implemented|Could not parse CSS|resource/i.test(e)) continue;
    bad(page, 'script error: ' + e.split('\n')[0]);
  }
  dom.window.close();
}

let swept = 0;
for (const page of pages()) {
  if (TESTS.some(([p]) => p === page)) continue;
  const { dom, doc, errors } = await open(page);
  swept += 1;
  wrapping(page, doc);
  for (const e of errors) {
    if (/Not implemented|Could not parse CSS|resource/i.test(e)) continue;
    bad(page, 'script error: ' + e.split('\n')[0]);
  }
  dom.window.close();
}

console.log('check-desktop \u2014 ' + DESK.width + '\u00d7' + DESK.height + ', ' +
  TESTS.length + ' pages examined, ' + swept + ' more swept');
for (const n of notes) console.log('  ok' + n);
if (fails.length) {
  console.log('\n' + fails.length + ' failure(s):');
  for (const f of fails) console.log('  ' + f);
  process.exit(1);
}
