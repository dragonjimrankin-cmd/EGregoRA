/**
 * A phone-shaped smoke test.
 *
 * There is no real browser in this sandbox, so this is jsdom standing in for
 * one: the built pages are loaded at 390x844 with the scripts running, and
 * the things a visitor does with a thumb are done to them — open the menu,
 * open an admin door, choose an elemental phase, press a tab. What it can
 * prove is that nothing throws, every control a finger needs is present and
 * reachable, and the handlers are actually bound. What it cannot prove is
 * pixel layout; check-mobile.py covers that side statically.
 */
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import * as esbuild from 'esbuild';

const PHONE = { width: 390, height: 844 };
const fails = [];
const notes = [];
const bad = (page, what) => fails.push(page + '  ' + what);

function stub(win) {
  /* The APIs a phone has and jsdom does not. Stubbed, not faked: enough for
     the scripts to bind their handlers without pretending a camera exists. */
  win.HTMLCanvasElement.prototype.getContext = function () {
    const noop = () => {};
    return new Proxy({}, {
      get: (_t, k) => (k === 'canvas' ? this
        : k === 'measureText' ? () => ({ width: 10 })
          : k === 'createLinearGradient' || k === 'createRadialGradient'
            ? () => ({ addColorStop: noop })
            : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) })
              : noop),
      set: () => true
    });
  };
  win.HTMLCanvasElement.prototype.captureStream = () => ({
    getTracks: () => [], getAudioTracks: () => [], getVideoTracks: () => [], addTrack: () => {}
  });
  win.HTMLMediaElement.prototype.play = () => Promise.resolve();
  win.HTMLMediaElement.prototype.pause = () => {};
  win.HTMLMediaElement.prototype.load = () => {};
  win.MediaRecorder = function () {};
  win.MediaRecorder.isTypeSupported = () => true;
  win.MediaSource = function () { this.addEventListener = () => {}; };
  win.MediaSource.isTypeSupported = () => true;
  win.navigator.mediaDevices = {
    getUserMedia: () => Promise.reject(new Error('no camera in a test')),
    getDisplayMedia: () => Promise.reject(new Error('no screen in a test'))
  };
  win.AudioContext = function () {
    return {
      createGain: () => ({ gain: {}, connect: () => {}, disconnect: () => {} }),
      createMediaStreamDestination: () => ({ stream: { getAudioTracks: () => [] } }),
      createMediaElementSource: () => ({ connect: () => {} }),
      createMediaStreamSource: () => ({ connect: () => {} }),
      state: 'running', resume: () => {}, close: () => Promise.resolve()
    };
  };
  win.URL.createObjectURL = () => 'blob:test';
  win.scrollTo = () => {};
  win.matchMedia = (q) => ({
    matches: /max-width:\s*(\d+)/.test(q) ? Number(RegExp.$1) >= PHONE.width : false,
    media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}
  });
  if (!win.IntersectionObserver) {
    win.IntersectionObserver = class {
      constructor(cb) { this.cb = cb; }
      observe(el) { this.cb([{ isIntersecting: true, target: el }], this); }
      unobserve() {} disconnect() {}
    };
  }
  if (!win.ResizeObserver) {
    win.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
  /* A small, honest stand-in for the API: it answers the shapes the front
     end expects so the page can be driven, and nothing more. */
  win.fetch = (url, opts) => {
    let body = {};
    try { body = JSON.parse((opts && opts.body) || '{}'); } catch (e) { body = {}; }
    const reply = { ok: true };
    if (body.action === 'list') {
      reply.feeds = [{ id: 1, title: 'A test feed', note: '', since: new Date().toISOString(), watchers: 2 }];
    }
    if (body.action === 'mine') reply.feeds = [];
    if (body.action === 'tapes') {
      reply.tapes = [{ id: 1, folder: '2026-10-07', name: 'a.webm', title: 'A test recording',
        mime: 'video/webm', bytes: 4096, seconds: 61, at: new Date().toISOString(), url: 'blob:test' }];
    }
    if (body.action === 'people') {
      reply.people = [
        { id: 1, who: 'A member', element: 'fire', can_chat: true, can_cam: false, can_mic: false, blocked: false, on_camera: false },
        { id: 2, who: 'Another', element: 'aether', can_chat: true, can_cam: true, can_mic: true, blocked: false, on_camera: true }
      ];
    }
    return Promise.resolve({
      ok: true, status: 200, json: () => Promise.resolve(reply), text: () => Promise.resolve('')
    });
  };
}

async function open(page) {
  const file = '_site' + page + 'index.html';
  const path = existsSync(file) ? file : '_site' + page;
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', (e) => errors.push(e.message));
  vc.on('error', (m) => errors.push(String(m)));

  const dom = new JSDOM(readFileSync(path, 'utf8'), {
    url: 'https://egregora.hatchable.site' + page,
    runScripts: 'dangerously',
    resources: undefined,
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse: stub
  });
  dom.window.innerWidth = PHONE.width;
  dom.window.innerHeight = PHONE.height;

  /* jsdom fetches nothing, and will not run a module at all, so the page's
     own scripts are bundled and evaluated here against the same document.
     That is what makes this a test of the site's behaviour rather than of
     its markup. */
  await new Promise((r) => setTimeout(r, 40));
  for (const tag of dom.window.document.querySelectorAll('script[src^="/assets/js/"]')) {
    const file = 'src' + tag.getAttribute('src').split('?')[0];
    if (!existsSync(file)) { bad(page, 'script missing from the source: ' + file); continue; }
    try {
      const built = await esbuild.build({
        entryPoints: [file], bundle: true, format: 'iife', write: false,
        platform: 'browser', target: 'es2020', logLevel: 'silent',
        external: ['./vendor/three.module.js']
      });
      dom.window.eval(built.outputFiles[0].text);
    } catch (e) {
      const msg = String((e && e.message) || e);
      /* three.js needs a real WebGL context; a missing one is this harness's
         limit, not the page's fault. */
      if (/WebGL|three|vendor\/three/i.test(msg)) continue;
      bad(page, 'script would not run: ' + msg.split('\n')[0]);
    }
  }
  await new Promise((r) => setTimeout(r, 40));
  return { dom, doc: dom.window.document, errors };
}

const TESTS = [
  ['/', async ({ doc }, t) => {
    t(doc.querySelector('.brand-order-text'), 'the order name is in the header');
    t(/All Natural Enquiry/.test(doc.querySelector('.brand-order-text')?.textContent || ''),
      'it reads The Order of All Natural Enquiry');
    const cards = [...doc.querySelectorAll('.card')];
    t(cards.length >= 11, 'the eleven limb cards are there');
    t(cards.every((c) => c.querySelectorAll('.tag').length === 2),
      'every limb card carries its number top and bottom');
    t(!/>Limb [IVX]+\u00b7/.test(doc.body.innerHTML.split('card-link')[1] || ''),
      'the sub-limb links no longer repeat a limb number');
    const toggle = doc.querySelector('.nav-toggle');
    t(toggle, 'the menu button exists on a phone');
    toggle.dispatchEvent(new doc.defaultView.Event('click', { bubbles: true }));
    t(doc.querySelector('.site-nav')?.classList.contains('open'), 'the menu opens when tapped');
  }],
  ['/live/', async ({ doc }, t) => {
    t(doc.querySelector('[data-lw="list"]'), 'the feed list is on the page');
    t(doc.querySelectorAll('input[name="lw-element"]').length === 5,
      'all five elemental phases are offered at the door');
    t([...doc.querySelectorAll('input[name="lw-element"]')].map((i) => i.value).join() ===
      'earth,fire,water,air,aether', 'and the fifth is aether');
    t(doc.querySelectorAll('[data-air]').length === 8, 'eight sources can go on air');
    t(doc.querySelector('[data-lv="programme"]'), 'the programme monitor is there to drop a picture on');
    t(doc.querySelector('[data-lv="still-file"]'), 'and a file chooser for those who cannot drag');
    t(doc.querySelector('[data-lv="screen-mode"]')?.querySelectorAll('option').length === 3,
      'the second screen has its three placements');
    t(doc.querySelector('[data-lv="folders"]') && doc.querySelector('[data-lv="filelist"]'),
      'the archive browser has both panes');
    t(doc.querySelector('[data-lv="keep"]')?.checked, 'recording to the archive is on by default');
  }],
  ['/products/', async ({ doc }, t) => {
    t(doc.querySelectorAll('.product').length >= 20, 'the whole range is listed');
    t(doc.querySelectorAll('.mark svg').length === 4, 'the four marks are drawn');
    t(doc.querySelectorAll('.quote-list li').length >= 8, 'the printed lines are there');
    t([...doc.querySelectorAll('.product img')].every((i) => i.getAttribute('loading') === 'lazy'),
      'product photographs are lazy, which is what a phone on data wants');
  }],
  ['/cosmic-aether/', async ({ doc }, t) => {
    t(!/\bether\b/i.test(doc.body.textContent.replace(/aether/gi, '')), 'no bare ether survives');
    t(doc.querySelector('h1'), 'the page has its heading');
  }],
  ['/cosmic-ether/', async ({ doc }, t) => {
    t(doc.querySelector('meta[http-equiv="refresh"]'), 'the old address redirects');
    t(/noindex/.test(doc.querySelector('meta[name="robots"]')?.content || ''), 'and is noindex');
  }],
  ['/ask-ed/', async ({ doc }, t) => {
    t(doc.querySelector('.fox-panel, #gink, [data-fox]'), 'Gink has a home on the page');
    t(doc.querySelector('textarea, input[type="text"]'), 'a question can be typed');
  }],
  ['/podcast/', async ({ doc }, t) => {
    const open = doc.querySelector('[data-am="open"]');
    t(open, 'the admin door is on the podcast page');
    open.dispatchEvent(new doc.defaultView.Event('click', { bubbles: true }));
    t(!doc.querySelector('[data-am="panel"]').hidden, 'and it opens to a thumb');
  }]
];

/* The live page is where this turn's work lives, so it gets its thumb
   pressed properly rather than only inspected. */
TESTS.push(['/live/', async ({ doc }, t) => {
  const win = doc.defaultView;
  const tap = (el) => el.dispatchEvent(new win.Event('click', { bubbles: true }));

  const door = doc.querySelector('[data-lv="open"]');
  tap(door);
  t(!doc.querySelector('[data-lv="panel"]').hidden, 'the broadcaster door opens on a tap');

  /* Going on air with nothing lit should say so, not fail silently. */
  tap(doc.querySelector('[data-air="plate"]'));
  t(/camera first/i.test(doc.querySelector('[data-lv="msg"]').textContent),
    'cutting with a dark gallery is explained rather than ignored');

  /* The plate composer draws without a feed, so plates can be built first. */
  t(doc.querySelector('[data-lv="pk"]').options.length === 8, 'all eight kinds of plate are offered');
  t(doc.querySelector('[data-lv="p-preview"]').querySelector('canvas'),
    'the plate preview is drawn as soon as the page loads');

  /* The watcher door, driven the way a visitor drives it: choose the feed
     that is live, type the watchword, and try to go in without answering
     the question at the door. */
  await new Promise((r) => setTimeout(r, 60));
  const feedBtn = doc.querySelector('[data-lw="list"] [data-feed]');
  t(feedBtn, 'a live feed is listed and tappable');
  tap(feedBtn);
  t(!doc.querySelector('[data-lw="gate"]').hidden, 'choosing it opens the watchword gate');
  doc.querySelector('[data-lw="word"]').value = 'gink';
  tap(doc.querySelector('[data-lw="enter"]'));
  t(/elemental phase/i.test(doc.querySelector('[data-lw="msg"]').textContent),
    'the door asks for an elemental phase before the watchword counts');
  doc.querySelector('input[name="lw-element"][value="aether"]').checked = true;
  tap(doc.querySelector('[data-lw="enter"]'));
  await new Promise((r) => setTimeout(r, 60));
  t(!/elemental phase/i.test(doc.querySelector('[data-lw="msg"]').textContent),
    'and lets you through once it is answered');

  /* The broadcaster's table, with people in it. */
  doc.querySelector('[data-lv="pass"]').value = '8===D';
  tap(doc.querySelector('[data-lv="signin"]'));
  await new Promise((r) => setTimeout(r, 80));
  t(doc.querySelector('[data-lv="folders"]').textContent.indexOf('2026-10-07') >= 0,
    'the archive lists its folders when the door opens');
}]);

for (const [page, run] of TESTS) {
  let { dom, doc, errors } = await open(page);
  const t = (cond, what) => {
    if (cond) notes.push('    ' + page + '  ' + what);
    else bad(page, 'FAILED: ' + what);
  };
  try {
    await run({ dom, doc }, t);
  } catch (e) {
    bad(page, 'threw: ' + e.message);
  }
  for (const e of errors) {
    if (/Not implemented|Could not parse CSS|resource/i.test(e)) continue;
    bad(page, 'script error: ' + e.split('\n')[0]);
  }
  dom.window.close();
}

/* Every page, loaded with its scripts, looking only for things that throw. */
const { readdirSync, statSync } = await import('node:fs');
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const f = dir + '/' + n;
  return statSync(f).isDirectory() ? walk(f) : (n === 'index.html' ? [f] : []);
});
let swept = 0;
for (const file of walk('_site')) {
  const page = file.replace('_site', '').replace('index.html', '');
  if (TESTS.some(([p]) => p === page)) continue;
  const { dom, errors } = await open(page);
  swept += 1;
  for (const e of errors) {
    if (/Not implemented|Could not parse CSS|resource/i.test(e)) continue;
    bad(page, 'script error: ' + e.split('\n')[0]);
  }
  if (!dom.window.document.querySelector('meta[name="viewport"]')) bad(page, 'no viewport');
  dom.window.close();
}
console.log('    swept ' + swept + ' more pages for script errors');

console.log('check-phone \u2014 ' + PHONE.width + '\u00d7' + PHONE.height + ', ' + TESTS.length + ' pages');
for (const n of notes) console.log('  ok' + n);
if (fails.length) {
  console.log('\n' + fails.length + ' failure(s):');
  for (const f of fails) console.log('  ' + f);
  process.exit(1);
}
