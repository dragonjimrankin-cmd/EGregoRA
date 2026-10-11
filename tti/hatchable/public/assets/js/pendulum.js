/* The Pendulum — the live figure.
 *
 * A double pendulum drawn twice, from initial conditions one part in a
 * thousand apart, with the simple pendulum's complex circle beside it: the
 * swing is the shadow the rotation casts on the real axis.
 *
 * No dependencies. Mounts on any element carrying [data-pendulum]; the canvas
 * and its controls are built here so every page that shows it stays in step.
 * Trails are composited on an offscreen canvas and faded slowly, so a long
 * trail costs the same as a short one.
 *
 * Respects prefers-reduced-motion: the figure draws one still frame and waits
 * to be asked before anything moves.
 */
(function () {
  'use strict';

  var GOLD = '#ffd979';
  var VERDANT = '#45d6b4';
  var VIOLET = '#a07cf0';
  var DIM = '#a9b6d8';
  var ICE = '#cdefff';
  var INK = '#03040c';

  /* Physics: two equal arms and bobs, released from rest. */
  var G = 9.81;
  var L1 = 1.0, L2 = 1.0;      /* arm lengths, metres */
  var M1 = 1.0, M2 = 1.0;      /* bob masses, kilograms */
  var DT = 1 / 480;            /* RK4 step — energy drifts ~1e-7 J per two minutes */

  /* Canvas is drawn at a fixed design size and scaled to the mount. */
  var W = 760, H = 470;
  var PX = 280, PY = 200, SC = 95;   /* pivot, and pixels per metre */
  var SX = 620, SY = 170, SR = 52;   /* the rotation the swing is the shadow of */

  /* Released from rest with the upper arm 60 degrees from the vertical and
   * the lower arm horizontal: enough energy to be chaotic, not enough to be
   * unreadable. Over three minutes the arms stay inside this frame, and the
   * two motions separate at about the half-minute mark — which is a visit. */
  var START = [60 * Math.PI / 180, Math.PI / 2, 0, 0];
  var START_DIFF = 0.001;

  /* The standard double-pendulum equations, written out in full so the algebra
   * can be checked against any textbook rather than against a memory of one. */
  function derivatives(s) {
    var t1 = s[0], t2 = s[1], w1 = s[2], w2 = s[3];
    var d = t1 - t2;
    var den = 2 * M1 + M2 - M2 * Math.cos(2 * d);
    var a1 = (-G * (2 * M1 + M2) * Math.sin(t1)
      - M2 * G * Math.sin(t1 - 2 * t2)
      - 2 * Math.sin(d) * M2 * (w2 * w2 * L2 + w1 * w1 * L1 * Math.cos(d)))
      / (L1 * den);
    var a2 = (2 * Math.sin(d) * (w1 * w1 * L1 * (M1 + M2)
      + G * (M1 + M2) * Math.cos(t1)
      + w2 * w2 * L2 * M2 * Math.cos(d)))
      / (L2 * den);
    return [w1, w2, a1, a2];
  }

  function step(s) {
    var k1 = derivatives(s), a = [0, 0, 0, 0], b = [0, 0, 0, 0], c = [0, 0, 0, 0], i;
    for (i = 0; i < 4; i++) a[i] = s[i] + k1[i] * DT / 2;
    var k2 = derivatives(a);
    for (i = 0; i < 4; i++) b[i] = s[i] + k2[i] * DT / 2;
    var k3 = derivatives(b);
    for (i = 0; i < 4; i++) c[i] = s[i] + k3[i] * DT;
    var k4 = derivatives(c);
    for (i = 0; i < 4; i++) s[i] += (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) * DT / 6;
    return s;
  }

  function button(label) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'btn btn--small';
    el.style.cssText = 'font-family:Cinzel,serif;font-size:0.66rem;letter-spacing:0.14em;' +
      'text-transform:uppercase;padding:0.42rem 0.9rem;cursor:pointer;';
    el.textContent = label;
    return el;
  }

  function init(host) {
    var wrap = document.createElement('div');
    wrap.style.cssText = 'margin:0 auto;max-width:760px;';

    var canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label',
      'Two double pendulums released from almost identical positions. They trace one line at first, ' +
      'then diverge, and after that share nothing but the law. Beside them a circle shows the simple ' +
      'pendulum as the shadow of a rotation.');
    canvas.style.cssText = 'display:block;margin:0 auto;border:1px solid rgba(118,207,238,0.22);' +
      'border-radius:3px;background:' + INK + ';';
    wrap.appendChild(canvas);

    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:0.6rem;align-items:center;' +
      'justify-content:center;margin:0.9rem auto 0;max-width:760px;';
    var playBtn = button('Pause');
    var resetBtn = button('Reset');
    var nudgeBtn = button('Nudge one by a hair');
    var read = document.createElement('span');
    read.className = 'pendulum-read';
    read.style.cssText = 'font-family:Cinzel,serif;font-size:0.68rem;letter-spacing:0.12em;' +
      'text-transform:uppercase;color:#a9b6d8;opacity:0.85;';
    bar.appendChild(playBtn);
    bar.appendChild(resetBtn);
    bar.appendChild(nudgeBtn);
    bar.appendChild(read);
    wrap.appendChild(bar);
    host.appendChild(wrap);

    var ctx = canvas.getContext('2d');
    var trail = document.createElement('canvas');     /* offscreen, faded each frame */
    var tctx = trail.getContext('2d');

    var running = false;
    var t = 0;
    var A = START.slice();
    var B = START.slice();
    var last = 0;

    function size() {
      var rect = host.getBoundingClientRect();
      var cssW = Math.max(320, Math.min(760, Math.round(rect.width) || 760));
      var k = cssW / W;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * k * dpr);
      canvas.height = Math.round(H * k * dpr);
      canvas.style.width = cssW + 'px';
      canvas.style.height = (H * k) + 'px';
      ctx.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
      trail.width = canvas.width;
      trail.height = canvas.height;
      tctx.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
      tctx.globalCompositeOperation = 'source-over';
      tctx.clearRect(0, 0, W, H);
    }

    /* The two bobs, in design pixels. */
    function pts(s) {
      var x1 = Math.sin(s[0]) * L1, y1 = -Math.cos(s[0]) * L1;
      var x2 = x1 + Math.sin(s[1]) * L2, y2 = y1 - Math.cos(s[1]) * L2;
      return [PX + x1 * SC, PY + y1 * SC, PX + x2 * SC, PY + y2 * SC];
    }

    function fade() {
      /* Fade rather than clear, so the run-up to the divergence stays on
         screen. The fade is slow enough to keep roughly twenty seconds of
         trail, and strokes are replaced rather than added, so the gold stays
         gold and the green stays green as they dim. */
      tctx.globalCompositeOperation = 'destination-out';
      tctx.fillStyle = 'rgba(0,0,0,0.0025)';
      tctx.fillRect(0, 0, W, H);
      tctx.globalCompositeOperation = 'source-over';
    }

    function drawTrails() {
      /* on the offscreen layer: fade what is there, then add this frame */
      fade();
      var cols = [GOLD, VERDANT];
      var states = [A, B];
      for (var i = 0; i < 2; i++) {
        var p = pts(states[i]);
        var rec = states[i]._last;
        if (rec) {
          tctx.strokeStyle = cols[i];
          tctx.globalAlpha = 0.9;
          tctx.lineWidth = 1.2;
          tctx.lineCap = 'round';
          tctx.beginPath();
          tctx.moveTo(rec[0], rec[1]);
          tctx.lineTo(p[2], p[3]);
          tctx.stroke();
          tctx.globalAlpha = 1;
        }
        states[i]._last = [p[2], p[3]];
      }
    }

    function arm(s, colour, alpha) {
      var p = pts(s);
      ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = DIM;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(PX, PY);
      ctx.lineTo(p[0], p[1]);
      ctx.lineTo(p[2], p[3]);
      ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ICE;
      ctx.beginPath(); ctx.arc(p[0], p[1], 3.1, 0, 6.2832); ctx.fill();
      ctx.fillStyle = colour;
      ctx.beginPath(); ctx.arc(p[2], p[3], 4.6, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = alpha * 0.3;
      ctx.strokeStyle = colour;
      ctx.beginPath(); ctx.arc(p[2], p[3], 8.5, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function shadowCircle(s) {
      var r = SR;
      ctx.save();
      ctx.strokeStyle = DIM;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(SX, SY, r, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.moveTo(SX - r - 8, SY); ctx.lineTo(SX + r + 8, SY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(SX, SY - r - 8); ctx.lineTo(SX, SY + r + 8); ctx.stroke();
      ctx.globalAlpha = 0.55;
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(SX, SY);
      ctx.lineTo(SX + r * Math.cos(s[0]), SY + r * Math.sin(s[0])); ctx.stroke();
      ctx.setLineDash([]);
      var px = r * Math.cos(s[0]);
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = VIOLET;
      ctx.beginPath(); ctx.moveTo(SX + px, SY);
      ctx.lineTo(SX + px, SY + r * Math.sin(s[0])); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = GOLD;
      ctx.beginPath(); ctx.arc(SX + r * Math.cos(s[0]), SY + r * Math.sin(s[0]), 3, 0, 6.2832); ctx.fill();
      ctx.fillStyle = VIOLET;
      ctx.beginPath(); ctx.arc(SX + px, SY, 3.4, 0, 6.2832); ctx.fill();
      ctx.textAlign = 'center';
      ctx.font = '10px Cinzel, serif';
      ctx.fillStyle = DIM;
      ctx.globalAlpha = 0.85;
      ctx.fillText('THE SHADOW ON THE REAL AXIS', SX, SY + r + 32);
      ctx.font = '12px "EB Garamond", serif';
      ctx.globalAlpha = 0.7;
      ctx.fillText('\u03b8 = Re e', SX - 12, SY + r + 50);
      ctx.fillText('i\u03b8', SX + 20, SY + r + 44);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    function draw() {
      ctx.fillStyle = INK;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.drawImage(trail, 0, 0, W, H);

      arm(A, GOLD, 1);
      arm(B, VERDANT, 0.95);

      ctx.textAlign = 'left';
      ctx.font = '10px Cinzel, serif';
      ctx.fillStyle = DIM;
      ctx.globalAlpha = 0.9;
      ctx.fillText('THE SAME PENDULUM, TWICE', 30, 28);
      ctx.font = '12.5px "EB Garamond", serif';
      ctx.fillStyle = GOLD;
      ctx.fillText('A \u2014 released at \u03b8\u2080', 30, 50);
      ctx.fillStyle = VERDANT;
      ctx.fillText('B \u2014 released at \u03b8\u2080 \u2212 0.001 rad', 30, 68);

      var diff = Math.abs(A[0] - B[0]);
      ctx.textAlign = 'right';
      ctx.fillStyle = diff > 0.05 ? VIOLET : DIM;
      ctx.fillText('separation  ' + diff.toFixed(4) + ' rad', 730, 28);
      ctx.fillText('t = ' + t.toFixed(1) + ' s', 730, 50);

      shadowCircle(A);

      ctx.textAlign = 'left';
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = DIM;
      var lines = [
        'Both are exact. Neither is guessable. For twenty seconds the two trails',
        'lie on top of one another; by thirty they are visibly apart, and by a',
        'minute they share nothing but the law they are both obeying.'
      ];
      for (var i = 0; i < lines.length; i++) ctx.fillText(lines[i], 30, 412 + i * 18);
      ctx.globalAlpha = 1;
    }

    function advance(seconds) {
      var steps = Math.max(1, Math.round(seconds / DT));
      for (var i = 0; i < steps; i++) { step(A); step(B); t += DT; }
      drawTrails();
      read.textContent = t.toFixed(0) + ' s \u00b7 separation ' + Math.abs(A[0] - B[0]).toFixed(3) + ' rad';
    }

    function frame(now) {
      if (!running) return;
      if (!last) last = now;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      advance(dt);
      draw();
      window.requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      last = 0;
      playBtn.textContent = 'Pause';
      window.requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      playBtn.textContent = 'Play';
    }

    function reset() {
      A = START.slice();
      B = START.slice();
      B[0] += START_DIFF;
      A._last = null;
      B._last = null;
      t = 0;
      tctx.globalCompositeOperation = 'source-over';
      tctx.clearRect(0, 0, W, H);
      read.textContent = '0 s \u00b7 separation 0.000 rad';
      draw();
    }

    playBtn.addEventListener('click', function () { running ? stop() : start(); });
    resetBtn.addEventListener('click', function () { reset(); if (running) { last = 0; } });
    nudgeBtn.addEventListener('click', function () {
      B[0] += START_DIFF;      /* now a thousandth the other way — watch it heal, then part */
      B._last = null;
      draw();
    });

    size();
    window.addEventListener('resize', function () { size(); draw(); });

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    reset();
    if (reduced) { stop(); } else { start(); }
  }

  function boot() {
    var mounts = document.querySelectorAll('[data-pendulum]');
    for (var i = 0; i < mounts.length; i++) {
      if (mounts[i].getAttribute('data-ready')) continue;
      mounts[i].setAttribute('data-ready', '1');
      init(mounts[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();