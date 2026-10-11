/* Profile client — face, name and the 400-word bio for the account page.
 *
 * The picture never leaves the browser at full size: it is drawn onto a
 * 512px canvas, exported as JPEG, and sent as one base64 piece to
 * /api/profile. The bio's word count is enforced in the browser and again on
 * the server, because the server is the one with the shelf.
 */
(function () {
  'use strict';
  var sec = document.getElementById('acct-profile');
  if (!sec) return;

  function token() {
    try {
      if (typeof window.EGToken === 'function') { var t = window.EGToken(); if (t) return t; }
      return localStorage.getItem('eg-session') || window.__egTok || '';
    } catch (e) { return window.__egTok || ''; }
  }
  function $(id) { return document.getElementById(id); }
  function post(body) {
    body.token = token();
    var h = { 'Content-Type': 'application/json' };
    var t = token();
    if (t) h.Authorization = 'Bearer ' + t;
    return fetch('/api/profile', {
      method: 'POST', headers: h, body: JSON.stringify(body)
    }).then(function (r) { return r.json().then(function (d) { d._ok = r.ok; return d; }); });
  }

  var face = $('acct-face'), fileIn = $('acct-avatar-file'), avMsg = $('acct-avatar-msg');
  var nameIn = $('acct-display'), bioIn = $('acct-bio'), count = $('acct-bio-count');
  var save = $('acct-profile-save'), msg = $('acct-profile-msg');
  var MAX_WORDS = 400;

  function words(s) { return (s || '').trim().split(/\s+/).filter(Boolean).length; }
  function paint(url) {
    if (!url) { face.textContent = '?'; face.style.backgroundImage = ''; return; }
    face.textContent = '';
    face.style.backgroundImage = 'url(' + url + ')';
    face.style.backgroundSize = 'cover';
    face.style.backgroundPosition = 'center';
  }
  function initial(name) {
    face.textContent = ((name || '?').trim()[0] || '?').toUpperCase();
  }

  /* ---- load what the shelf already holds ---- */
  function load() {
    if (!token()) { sec.hidden = true; return; }
    post({ action: 'get' }).then(function (d) {
      if (!d._ok || !d.ok) { sec.hidden = true; if (hsec) hsec.hidden = true; return; }
      var p = d.profile || {};
      nameIn.value = p.display_name || '';
      bioIn.value = p.bio || '';
      onBio();
      if (p.avatar) paint(p.avatar); else initial(nameIn.value || d.name);
      loadHouse(d);
    }).catch(function () { sec.hidden = true; if (hsec) hsec.hidden = true; });
  }

  /* ---- the house biography: the owner's nod, then the people page ---- */
  function loadHouse(d) {
    if (!hsec) return;
    hsec.hidden = false;
    hname.value = (d.profile && d.profile.display_name) || d.name || '';
    var r = d.bio_review;
    if (!r) { hstatus.textContent = ''; return; }
    if (hbio.value === '') {
      /* keep the member's own words if they have not edited yet */
      hbio.value = (d.profile && d.profile.bio) || '';
    }
    if (r.status === 'pending') {
      hstatus.textContent = 'Submitted ' + String(r.submitted_at || '').slice(0, 10) + ' — waiting on the owner\u2019s nod.';
      hstatus.className = 'auth-msg';
    } else if (r.status === 'approved') {
      hstatus.textContent = 'Approved — you are on the people page.';
      hstatus.className = 'auth-msg is-good';
    } else if (r.status === 'rejected') {
      hstatus.textContent = 'The owner passed on this one. Edit it and submit again whenever you like.';
      hstatus.className = 'auth-msg is-bad';
    }
  }

  /* ---- the bio's honest counter ---- */
  function onBio() {
    var n = words(bioIn.value);
    count.textContent = n + ' / ' + MAX_WORDS + ' words';
    count.style.color = n > MAX_WORDS ? '#d98b6f' : '';
    save.disabled = n > MAX_WORDS;
  }
  bioIn.addEventListener('input', onBio);

  /* ---- the face: shrink here, send small ---- */
  fileIn.addEventListener('change', function () {
    var f = fileIn.files && fileIn.files[0];
    avMsg.textContent = '';
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) { avMsg.textContent = 'Under 25 MB, please.'; return; }
    var img = new Image();
    var url = URL.createObjectURL(f);
    img.onload = function () {
      URL.revokeObjectURL(url);
      var S = 512;
      var side = Math.min(img.width, img.height);
      var c = document.createElement('canvas');
      c.width = S; c.height = S;
      var g = c.getContext('2d');
      g.fillStyle = '#15120d';
      g.fillRect(0, 0, S, S);
      g.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S);
      var jpeg = c.toDataURL('image/jpeg', 0.86);
      var b64 = jpeg.split(',')[1] || '';
      avMsg.textContent = 'Uploading…';
      post({ action: 'avatar', part: b64 }).then(function (d) {
        if (!d._ok || !d.ok) { avMsg.textContent = d.error || 'That piece did not take.'; return; }
        return post({ action: 'avatar-finish', mime: 'image/jpeg' });
      }).then(function (d) {
        if (!d) return;
        if (!d._ok || !d.ok) { avMsg.textContent = d.error || 'The picture did not land.'; return; }
        avMsg.textContent = 'Face saved. It shows beside your forum posts on both sites.';
        paint(jpeg);
      }).catch(function () { avMsg.textContent = 'The upload stumbled. Try once more.'; });
    };
    img.onerror = function () { URL.revokeObjectURL(url); avMsg.textContent = 'That file is not a picture this browser can read.'; };
    img.src = url;
  });

  /* ---- save name and words ---- */
  save.addEventListener('click', function () {
    msg.textContent = '';
    post({ action: 'save', display_name: nameIn.value, bio: bioIn.value }).then(function (d) {
      if (!d._ok || !d.ok) { msg.textContent = d.error || 'That did not save.'; msg.dataset.err = '1'; return; }
      delete msg.dataset.err;
      msg.textContent = 'Saved — the same face and words will greet you on The Two Infinities.';
    }).catch(function () { msg.textContent = 'The shelf did not answer. Try once more.'; });
  });

  var hsec = document.getElementById('acct-house');
  var hname = document.getElementById('acct-house-name');
  var hbio = document.getElementById('acct-house-bio');
  var hfile = document.getElementById('acct-house-file');
  var hmsg = document.getElementById('acct-house-msg');
  var hstatus = document.getElementById('acct-house-status');
  var hsend = document.getElementById('acct-house-send');
  var hdrop = document.getElementById('acct-house-drop');
  var hface = document.getElementById('acct-house-face');
  var houseJpeg = '';

  function shrink(file, cb) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      URL.revokeObjectURL(url);
      var S = 512;
      var side = Math.min(img.width, img.height);
      var c = document.createElement('canvas');
      c.width = S; c.height = S;
      var g = c.getContext('2d');
      g.fillStyle = '#15120d';
      g.fillRect(0, 0, S, S);
      g.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S);
      cb(c.toDataURL('image/jpeg', 0.86).split(',')[1] || '');
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(''); };
    img.src = url;
  }

  if (hsec) {
    if (hbio) {
      hbio.addEventListener('input', function () {
        var n = words(hbio.value);
        var c = document.getElementById('acct-house-count');
        if (c) {
          c.textContent = n + ' / ' + MAX_WORDS + ' words';
          c.style.color = n > MAX_WORDS ? '#d98b6f' : '';
        }
        if (hsend) hsend.disabled = n > MAX_WORDS;
      });
    }
    if (hfile) hfile.addEventListener('change', function () {
      var f = hfile.files && hfile.files[0];
      if (!f) return;
      if (f.size > 25 * 1024 * 1024) { hmsg.textContent = 'Under 25 MB, please.'; return; }
      hmsg.textContent = 'Preparing the picture\u2026';
      shrink(f, function (b64) {
        houseJpeg = b64;
        hmsg.textContent = b64 ? 'Picture ready. It leaves this device at 512 px.' : 'That file is not a picture this browser can read.';
        if (b64 && hface) {
          hface.style.backgroundImage = 'url(data:image/jpeg;base64,' + b64 + ')';
          hface.textContent = '';
        }
      });
    });
    if (hsend) hsend.addEventListener('click', function () {
      hmsg.textContent = '';
      post({
        action: 'bio-submit',
        display_name: hname.value,
        bio: hbio.value,
        image: houseJpeg || ''
      }).then(function (d) {
        if (!d._ok || !d.ok) { hmsg.textContent = d.error || 'That did not go through.'; return; }
        hmsg.textContent = 'Submitted. The owner reads it, and the people page gets your story once they nod.';
        if (hstatus) { hstatus.textContent = 'Waiting on the owner\u2019s nod.'; hstatus.className = 'auth-msg'; }
      }).catch(function () { hmsg.textContent = 'The shelf did not answer. Try once more.'; });
    });
    if (hdrop) hdrop.addEventListener('click', function () {
      hdrop.disabled = true;
      post({ action: 'bio-remove' }).then(function (d) {
        if (d && d.ok) { hstatus.textContent = 'Taken off the shelf.'; hstatus.className = 'auth-msg'; }
        hdrop.disabled = false;
      }).catch(function () { hdrop.disabled = false; });
    });
  }

  load();
})();