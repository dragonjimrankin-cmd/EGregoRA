/**
 * The shared jsdom harness.
 *
 * One stand-in browser, used at two sizes: check-phone.mjs drives it at
 * 390x844 and check-desktop.mjs at 1440x900. Keeping the stubs in one file
 * means a fix for one shape is a fix for both, which is the whole point of
 * testing both shapes.
 *
 * It is honest about what it is: jsdom with the media APIs stubbed and a
 * small API stand-in. It can prove that nothing throws, that every control
 * is present and bound, and that handlers do what they say. It cannot prove
 * pixel layout; check-mobile.py covers that side statically.
 */
import { readFileSync, existsSync, readdirSync as fsReaddir, statSync as fsStat } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import * as esbuild from 'esbuild';

/** Build an `open(page)` bound to one viewport and one failure collector. */
export function harness(view, bad) {
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
      matches: /max-width:\s*(\d+)/.test(q) ? Number(RegExp.$1) >= view.width : false,
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
    dom.window.innerWidth = view.width;
    dom.window.innerHeight = view.height;

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
  return open;
}

/** Walk the built site and return every page path, '/like/this/'. */
export function pages(root = '_site') {
  const { readdirSync, statSync } = require_fs();
  const walk = (dir) => readdirSync(dir).flatMap((n) => {
    const f = dir + '/' + n;
    return statSync(f).isDirectory() ? walk(f) : (n === 'index.html' ? [f] : []);
  });
  return walk(root).map((f) => f.replace(root, '').replace('index.html', ''));
}

function require_fs() {
  return { readdirSync: fsReaddir, statSync: fsStat };
}
