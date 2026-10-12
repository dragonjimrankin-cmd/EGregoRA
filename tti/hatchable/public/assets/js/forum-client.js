/* Forum client — one component, both houses.
 *
 * Mounts the shared forum into any page:
 *   <div id="forum-root"></div>
 *   <script src="/assets/js/forum-client.js"></script>
 *
 * Cross-site: set window.__forumApi to the absolute API URL (the TTI page
 * points it at https://egregora.hatchable.site/api/forum). Reads the session
 * token from localStorage exactly as accounts.js stores it, so signing in on
 * either site signs you in here.
 */
(function () {
  'use strict';
  var API = window.__forumApi || '/api/forum';
  var root = document.getElementById('forum-root');
  if (!root) return;

  /* Same session the account page uses: window.EGToken (site.js) when it is
     loaded, else the 'eg-session' slot straight from localStorage. */
  function token() {
    try {
      if (typeof window.EGToken === 'function') { var t = window.EGToken(); if (t) return t; }
      return localStorage.getItem('eg-session') || window.__egTok || '';
    } catch (e) { return window.__egTok || ''; }
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function call(action, extra) {
    var body = Object.assign({ action: action }, extra || {});
    var t = token();
    if (t) body.token = t;
    return fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }
  function when(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return ''; }
  }
  function avatar(p) {
    var wrap = el('span', 'fm-av');
    if (p.author_avatar) {
      var img = el('img');
      img.src = p.author_avatar;
      img.alt = p.author_name || '';
      img.loading = 'lazy';
      img.onerror = function () { wrap.classList.add('fm-av-fallback'); img.remove(); };
      wrap.appendChild(img);
    } else {
      wrap.classList.add('fm-av-fallback');
    }
    if (!p.author_avatar || wrap.classList.contains('fm-av-fallback')) {
      wrap.textContent = (p.author_name || '?').trim().split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    }
    return wrap;
  }
  function chip(p) {
    var kind = p.author_kind === 'oracle' ? 'oracle' : (p.author_kind === 'bot' ? 'bot' : 'member');
    return el('span', 'fm-kind fm-' + kind,
      kind === 'oracle' ? (p.author_home === 'two-infinities' ? 'oracle · two infinities' : 'oracle')
        : kind === 'bot' ? 'moderator · construct' : (p.author_home === 'two-infinities' ? 'member · two infinities' : 'member'));
  }

  function notice(msg, cls) {
    var n = el('p', 'fm-note' + (cls ? ' ' + cls : ''), msg);
    return n;
  }

  /* The reply box itself. */
  function replyForm(threadId) {
    var form = el('form', 'fm-reply');
    var ta = el('textarea');
    ta.placeholder = 'Add to the thread…';
    ta.maxLength = 6000;
    ta.rows = 4;
    var send = el('button', 'fm-btn fm-send', 'Post reply');
    var msg = el('p', 'fm-note fm-quiet');
    form.appendChild(ta);
    var row = el('div', 'fm-row');
    row.appendChild(send); row.appendChild(msg);
    form.appendChild(row);
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var bodyText = ta.value.trim();
      if (!bodyText) { msg.textContent = 'Say something first.'; return; }
      send.disabled = true; msg.textContent = 'Posting…';
      call('post', { thread_id: threadId, body: bodyText }).then(function (res) {
        send.disabled = false;
        if (!res.ok) { msg.textContent = res.error || 'That did not post.'; return; }
        renderThread(threadId);
      }).catch(function () { send.disabled = false; msg.textContent = 'The room did not answer.'; });
    });
    return form;
  }

  /* Three doors: nobody signed in, signed in and able to write, and signed in
     but not. The third says what is missing rather than leaving a box that
     only fails. */
  function drawReply(root, threadId) {
    if (!token()) {
      var door = el('div', 'fm-door');
      door.appendChild(el('p', null, 'Sign in to reply — one account covers both houses.'));
      var link = el('a', 'fm-btn', 'Sign in or join');
      link.href = window.__forumAccount || '/account/';
      door.appendChild(link);
      root.appendChild(door);
      return;
    }
    call('me').then(function (res) {
      if (res && res.ok && res.can_post) { root.appendChild(replyForm(threadId)); return; }
      var gate = el('div', 'fm-door fm-gate');
      gate.appendChild(el('p', null, (res && res.why) ||
        'This room is open to read. Writing needs a membership.'));
      var go = el('a', 'fm-btn', 'See the membership');
      go.href = window.__forumMembership || '/membership/';
      gate.appendChild(go);
      root.appendChild(gate);
    }).catch(function () {
      /* If the door cannot be asked, draw the box anyway and let the server
         be the judge — never leave a member locked out of a room they belong
         in because one request went unanswered. */
      root.appendChild(replyForm(threadId));
    });
  }

  function renderThread(threadId) {
    root.textContent = '';
    var loading = notice('Opening the thread…');
    root.appendChild(loading);
    call('thread', { thread_id: threadId }).then(function (r) {
      root.textContent = '';
      if (!r.ok) { root.appendChild(notice(r.error || 'That thread would not open.', 'fm-bad')); return; }
      var t = r.thread;

      var back = el('button', 'fm-btn fm-back', '← All threads');
      back.addEventListener('click', renderList);
      root.appendChild(back);

      var head = el('header', 'fm-thead');
      head.appendChild(el('h2', null, t.title));
      if (t.blurb) head.appendChild(el('p', 'fm-blurb', t.blurb));
      root.appendChild(head);

      var list = el('div', 'fm-posts');
      (t.posts || []).forEach(function (p) {
        var post = el('article', 'fm-post fm-post-' + (p.author_kind || 'member'));
        var side = el('div', 'fm-side');
        side.appendChild(avatar(p));
        side.appendChild(el('div', 'fm-who', p.author_name || 'Someone'));
        side.appendChild(chip(p));
        side.appendChild(el('div', 'fm-when', when(p.created_at)));
        post.appendChild(side);
        var body = el('div', 'fm-body');
        String(p.body || '').split('\n').forEach(function (line) {
          body.appendChild(el('p', null, line));
        });
        post.appendChild(body);
        list.appendChild(post);
      });
      root.appendChild(list);

      /* The room is open to read for everybody, and always will be. Writing
         needs a membership, or the order's own key. So ask who this visitor is
         before drawing the box: no point letting someone write a reply that
         will be turned away at the door. */
      drawReply(root, threadId);
    }).catch(function () {
      root.textContent = '';
      root.appendChild(notice('The forum is quiet just now. Try again shortly.', 'fm-bad'));
    });
  }

  function renderList() {
    root.textContent = '';
    var loading = notice('Opening the room…');
    root.appendChild(loading);
    call('threads').then(function (r) {
      root.textContent = '';
      if (!r.ok) { root.appendChild(notice(r.error || 'The room would not open.', 'fm-bad')); return; }
      var intro = el('header', 'fm-intro');
      intro.appendChild(el('h2', null, 'The forum of both houses'));
      intro.appendChild(el('p', null,
        'Gink and ShakDrah keep the fire between them here. The moderators are constructs of the house — they read everything, they guide, and they carry their own questions. Your account works on both sites.'));
      root.appendChild(intro);

      /* Start a thread (signed in) */
      if (token()) {
        var opener = el('div', 'fm-opener');
        var titleIn = el('input');
        titleIn.placeholder = 'Start a thread — give it a title';
        titleIn.maxLength = 180;
        var bodyIn = el('textarea');
        bodyIn.placeholder = 'The first post…';
        bodyIn.rows = 4; bodyIn.maxLength = 6000;
        var openBtn = el('button', 'fm-btn', 'Open the thread');
        var openMsg = el('p', 'fm-note fm-quiet');
        openBtn.addEventListener('click', function () {
          var title = titleIn.value.trim(), body = bodyIn.value.trim();
          if (!title || !body) { openMsg.textContent = 'A title and a first post, then the door opens.'; return; }
          openBtn.disabled = true; openMsg.textContent = 'Opening…';
          call('new', { title: title, body: body }).then(function (res) {
            openBtn.disabled = false;
            if (!res.ok) { openMsg.textContent = res.error || 'That did not open.'; return; }
            renderThread(res.thread_id);
          }).catch(function () { openBtn.disabled = false; openMsg.textContent = 'The room did not answer.'; });
        });
        opener.appendChild(titleIn); opener.appendChild(bodyIn);
        var orow = el('div', 'fm-row'); orow.appendChild(openBtn); orow.appendChild(openMsg);
        opener.appendChild(orow);
        root.appendChild(opener);
      }

      var list = el('div', 'fm-threads');
      (r.threads || []).forEach(function (t) {
        var card = el('article', 'fm-thread' + (t.pinned ? ' fm-pinned' : ''));
        var top = el('div', 'fm-ttop');
        if (t.pinned) top.appendChild(el('span', 'fm-pin', 'pinned'));
        top.appendChild(el('h3', null, t.title));
        card.appendChild(top);
        if (t.blurb) card.appendChild(el('p', 'fm-blurb', t.blurb));
        var meta = el('div', 'fm-meta');
        meta.appendChild(el('span', null, (t.author_name || 'Someone') + ' · ' + when(t.created_at)));
        meta.appendChild(el('span', 'fm-count', (t.post_count || 0) + ' posts · last ' + when(t.last_at)));
        card.appendChild(meta);
        card.addEventListener('click', function () { renderThread(t.id); });
        card.tabIndex = 0;
        card.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') renderThread(t.id); });
        list.appendChild(card);
      });
      root.appendChild(list);
    }).catch(function () {
      root.textContent = '';
      root.appendChild(notice('The forum is quiet just now. Try again shortly.', 'fm-bad'));
    });
  }

  renderList();
})();
