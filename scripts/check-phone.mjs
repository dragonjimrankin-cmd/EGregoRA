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
      reply.air = win.__egAir || { on: false, note: 'Cutting runes all week.', back_at: 'Thursday' };
      reply.feeds = win.__egAir
        ? [{ id: 1, title: 'A test feed', note: '', since: new Date().toISOString(), watchers: 2 }] : [];
    }
    if (body.action === 'air') reply.on = body.on === true;
    if (body.action === 'mine') reply.feeds = [];
    if (body.action === 'tapes') {
      reply.tapes = [{ id: 1, folder: '2026-10-07', name: 'a.webm', title: 'A test recording',
        mime: 'video/webm', bytes: 4096, seconds: 61, at: new Date().toISOString(), url: 'blob:test' }];
    }
    if (body.action === 'ready') {
      reply.providers = [
        { id: 'google', label: 'Google', ready: true },
        { id: 'github', label: 'GitHub', ready: true },
        { id: 'apple', label: 'Apple', ready: false }
      ];
    }
    if (body.action === 'room') {
      reply.state = 'live';
      reply.you = { who: 'You', element: 'aether', can_chat: true, can_cam: true, can_mic: false };
      reply.lines = [{ id: 1, who: 'The Order', body: 'Welcome in.', order: true, at: new Date().toISOString() }];
      reply.people = [
        { who: 'You', element: 'aether', can_chat: true, can_cam: true, can_mic: false, blocked: false },
        { who: 'A quiet one', element: 'earth', can_chat: true, can_cam: false, can_mic: false, blocked: false },
        { who: 'A loud one', element: 'fire', can_chat: false, can_cam: true, can_mic: true, blocked: false }
      ];
      reply.cams = [{ id: 9, who: 'A loud one' }];
    }
    if (body.action === 'pull') reply.parts = [];
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

async function open(page, opts) {
  const wants = opts || {};
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
    beforeParse: (win) => { win.__egAir = wants.air || null; stub(win); }
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
  ['/join/', async ({ doc, dom }, t) => {
    t(doc.getElementById('social-door'), 'the door for outside accounts is on the page');
    t(doc.getElementById('a-id-block'), 'and the age and identity check has a home of its own');
    t(dom.window.EGNeedCheck, 'the site knows how to bring the check up');
  }],
  ['/ask-ed/', async ({ doc, dom }, t) => {
    t(doc.querySelector('.fox-panel, #gink, [data-fox]'), 'Gink has a home on the page');
    t(doc.querySelector('textarea, input[type="text"]'), 'a question can be typed');
    /* A refusal that carries a gate must bring the check up, not a sentence. */
    dom.window.EGNeedCheck('identity');
    const sheet = doc.getElementById('check-sheet');
    t(sheet, 'asking for the check opens it over the page');
    t(sheet.querySelector('iframe[allow*="camera"]'), 'with the camera allowed through to it');
    sheet.querySelector('.check-shut').dispatchEvent(new dom.window.Event('click', { bubbles: true }));
    t(!doc.getElementById('check-sheet'), 'and it closes again without losing the page');
  }],
  ['/podcast/', async ({ doc }, t) => {
    const open = doc.querySelector('[data-am="open"]');
    t(open, 'the admin door is on the podcast page');
    open.dispatchEvent(new doc.defaultView.Event('click', { bubbles: true }));
    t(!doc.querySelector('[data-am="panel"]').hidden, 'and it opens to a thumb');
  }]
];

/* The Free.ai doors: present in every admin panel, and shut to everyone who
   has not opened the order's door in this tab. */
for (const page of ['/podcast/', '/videos/', '/live/', '/ask-ed/']) {
  TESTS.push([page, async ({ doc }, t) => {
    const fa = doc.querySelector('[data-fa="root"]');
    t(fa, 'the Free.ai panel is in the admin section');
    t(fa.hidden, 'and it stays shut until the order\u2019s passcode has been typed');
    const heads = [...fa.querySelectorAll('thead th')].map((h) => h.textContent.trim());
    t(heads.length === 7, 'the doors table has a column for each thing asked for');
    t(/tokens left/i.test(heads.join(' ')) && /resets in/i.test(heads.join(' ')),
      'tokens left and the time to reset are both columns');
    t(/films left/i.test(heads.join(' ')), 'and the films left, with their own reset');
    t(['model-chat', 'model-image', 'model-video'].every((n) => fa.querySelector('[data-fa="' + n + '"]')),
      'there is a model dropdown for chat, pictures and film');
    const doorPick = [...fa.querySelectorAll('[data-fa="door"] option')].map((o) => o.textContent.trim());
    t(doorPick.filter((d) => /^Free\.ai [1-5]$/.test(d)).length === 5,
      'the five doors are named Free.ai 1 to 5 and nothing else');
    t(!/shakradragon|cervixen|pellegrin|jim\.rankin/i.test(fa.innerHTML),
      'no account behind a door is named in the panel');
    t(!/sk-free-/.test(doc.body.innerHTML), 'and no key is anywhere in the page');
  }]);
}

TESTS.push(['/ask-ed/', async ({ doc }, t) => {
  t(doc.querySelector('#ask-admin [data-aa="signin"]'), 'the oracle page has the order\u2019s own door');
  t(doc.querySelector('#ask-admin [data-aa="panel"]').hidden, 'which is shut to begin with');
  t(typeof doc.defaultView.EGToLiveFiles === 'function',
    'and a way to send a generation to the live files folder');
  t(typeof doc.defaultView.EGFileButton === 'function', 'hung on the cards as a button');
  t(!doc.querySelector('.card-to-files'),
    'but no such button exists while nobody is signed in as an administrator');
}]);

/* The device studio — this turn's work, on both media pages. */
for (const [page, kind] of [['/podcast/', 'audio'], ['/videos/', 'video']]) {
  TESTS.push([page, async ({ doc }, t) => {
    const root = doc.querySelector('[data-device-studio]');
    t(root, 'the device studio is on the page');
    t(root.getAttribute('data-device-studio') === kind, 'and it knows it is ' + kind);
    const open = root.querySelector('[data-ds="open"]');
    t(/record now on your device/i.test(open.textContent), 'the offer is plainly worded');
    open.dispatchEvent(new doc.defaultView.Event('click', { bubbles: true }));
    t(!root.querySelector('[data-ds="panel"]').hidden, 'and it opens to a thumb');
    t(root.querySelector('[data-ds="start"]') && root.querySelector('[data-ds="stop"]'),
      'it can be started and stopped');
    t(root.querySelector('[data-ds="keep"]'), 'it asks whether to keep what was recorded');
    for (const key of ['play', 'pause', 'rew', 'ff', 'seek']) {
      t(root.querySelector('[data-ds="' + key + '"]'), 'the transport has its ' + key);
    }
    t(root.querySelector('[data-ds="seek"]').getAttribute('type') === 'range',
      'the position is a slider a thumb can drag');
    t(root.querySelector('[data-ds="crop"]') && root.querySelector('[data-ds="mute-range"]'),
      'it can crop, and strip the sound from a marked stretch');
    t(root.querySelector('[data-ds="ins-file"]')?.getAttribute('accept') === 'audio/*',
      'audio can be inserted');
    t(root.querySelector('[data-ds="archive"]'), 'and the result archived on this device');
    const table = root.querySelector('table.cell-table');
    t(table, 'the files are listed in a table of cells');
    t(table.querySelectorAll('thead th').length === 6, 'with a column for each thing worth knowing');
    t(root.querySelector('.table-wrap'), 'and the table can be scrolled sideways on a phone');
  }]);
}

/* The live page is where this turn's work lives, so it gets its thumb
   pressed properly rather than only inspected. */
/* Off air: the holding card, and the sign. */
TESTS.push(['/live/', async ({ doc, dom }, t) => {
  await new Promise((r) => setTimeout(r, 120));
  const host = doc.querySelector('[data-lw="holding"]');
  t(host && !host.hidden, 'off air, the page puts up a holding card rather than an apology');
  t(host.querySelector('canvas.holding-canvas'), 'the card is drawn, not written');
  t(/press/i.test(host.querySelector('.holding-cap').textContent),
    'and it invites you to do something with it');
  const lamp = doc.querySelector('[data-lw="lamp"]');
  t(lamp && !lamp.classList.contains('is-lit'), 'the lamp over the door is dark');
  t(doc.querySelector('[data-lv="air"]'), 'the broadcaster has an ON AIR switch');
  t(doc.querySelector('[data-lv="air-note"]') && doc.querySelector('[data-lv="air-back"]'),
    'with a line to leave and a time to promise');

  /* Close a loop of stars and the naming box should come up. The canvas is
     pressed through its own pointer handler, at the coordinates jsdom will
     report, so this is the real gesture rather than a poke at the state. */
  const sky = host.querySelector('canvas.holding-canvas');
  const win = doc.defaultView;
  const tapCanvas = () => sky.dispatchEvent(new win.Event('keydown', { bubbles: true }));
  const name = host.querySelector('.sky-name');
  t(name && name.hidden, 'the naming box keeps out of the way until a loop is closed');
  t(name.querySelector('[data-sky="regen"]'), 'and when it comes it can ask the order for a name');
  t(name.querySelector('[data-sky="field"]')?.getAttribute('maxlength') === '40',
    'you can also type your own, within reason');
  t(name.querySelector('[data-sky="again"]'), 'and sweep the sky to start again');
  t(/close the loop/i.test(host.querySelector('.holding-cap').textContent),
    'the card says how to close the figure');
  t(typeof tapCanvas === 'function', 'the sky takes a press from the keyboard too');
}]);

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

  /* Inside the room: the wall of everyone, the spotlight, the float. */
  await new Promise((r) => setTimeout(r, 120));
  const room = doc.getElementById('live-room');
  t(!room.hidden, 'the room opens once you are through the door');
  const tiles = room.querySelectorAll('.cam-cell');
  t(tiles.length === 3, 'everyone in the room has a tile, camera or not');
  t(room.querySelectorAll('.cam-cell--quiet').length === 2,
    'the ones without a camera show their elemental phase instead of being left out');
  const camTile = room.querySelector('.cam-cell[data-cam]');
  t(camTile, 'a live camera has its own tile');
  tap(camTile);
  t(!room.querySelector('[data-lr="spot"]').hidden, 'pressing a tile brings it up large');
  t(room.querySelector('[data-lr="spot-stage"] video'), 'and the picture itself moves to the big stage');
  t(room.querySelector('[data-lr="spot-who"]').textContent === 'A loud one', 'named, so you know who you are watching');
  tap(camTile);
  t(room.querySelector('[data-lr="spot"]').hidden, 'pressing it again lets them go');

  const float = room.querySelector('[data-lr="float"]') || doc.querySelector('[data-lr="float"]');
  t(float, 'your own picture has a window of its own');
  t(float.querySelector('[data-lr="float-grip"]'), 'with a grip to size it');
  const bar = float.querySelector('[data-lr="float-bar"]');
  const down = new win.Event('pointerdown', { bubbles: true });
  down.clientX = 100; down.clientY = 100; down.pointerId = 1;
  bar.setPointerCapture = () => {};
  bar.dispatchEvent(down);
  t(float.classList.contains('is-floating'), 'dragging its bar lifts it out of the panel');
  const move = new win.Event('pointermove', { bubbles: true });
  move.clientX = 160; move.clientY = 220;
  bar.dispatchEvent(move);
  t(parseInt(float.style.top, 10) > 0 || parseInt(float.style.left, 10) > 0,
    'and it follows the finger');
  bar.dispatchEvent(new win.Event('pointerup', { bubbles: true }));
  tap(float.querySelector('[data-lr="float-dock"]'));
  t(!float.classList.contains('is-floating'), 'and docks back into the panel when told');

  /* The broadcaster's table, with people in it. */
  doc.querySelector('[data-lv="pass"]').value = '8===D';
  tap(doc.querySelector('[data-lv="signin"]'));
  await new Promise((r) => setTimeout(r, 80));
  t(doc.querySelector('[data-lv="folders"]').textContent.indexOf('2026-10-07') >= 0,
    'the archive lists its folders when the door opens');

  /* The live table stands even when the room is empty. */
  const table = doc.querySelector('[data-lv="people"] table');
  t(table, 'the table of the room is drawn before anyone arrives');
  t(table.querySelectorAll('thead th').length === 7,
    'it has a column for the element and one for each power');
  t(table.querySelectorAll('tbody tr').length >= 6, 'and six rows stand when the room is empty');
  t(doc.querySelectorAll('[data-lv="people"] .phase-strip').length === 6,
    'every elemental phase has its own camera and microphone controls');

  /* The presentation: add two pages, then flick through them. */
  const press = doc.querySelector('[data-lv="p-save"]');
  doc.querySelector('[data-lv="p-title"]').value = 'Page one';
  tap(press);
  doc.querySelector('[data-lv="p-title"]').value = 'Page two';
  tap(press);
  const cards = doc.querySelectorAll('[data-lv="deck"] .deck-card');
  t(cards.length >= 2, 'pages can be added to the deck like a slide deck');
  t(/of 2$/.test(doc.querySelector('[data-lv="deck-count"]').textContent) ||
    /2/.test(doc.querySelector('[data-lv="deck-count"]').textContent), 'the page count keeps up');
  tap(doc.querySelector('[data-lv="deck-next"]'));
  t(/camera first/i.test(doc.querySelector('[data-lv="msg"]').textContent),
    'flicking with a dark gallery says so rather than failing quietly');
  t(doc.querySelector('[data-lv="deck-keys"]').checked, 'the arrow keys are armed by default');
  const nums = [...doc.querySelectorAll('[data-lv="deck"] .deck-num')].map((n) => n.textContent);
  t(nums.join() === '1,2', 'the pages are numbered in the order they will run');
}, { air: { on: true, note: '', back_at: '' } }]);

for (const [page, run, opts] of TESTS) {
  let { dom, doc, errors } = await open(page, opts);
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
