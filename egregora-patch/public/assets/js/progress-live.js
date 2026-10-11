/* A progress bar should never look abandoned during a legitimate long stage.
   The reported percentage remains honest; after a short quiet interval this
   reporter adds an elapsed-time heartbeat and a moving visual state until the
   next measured update arrives. */

const clamp = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

function elapsedLabel(milliseconds) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes ? `${minutes}m ${String(seconds).padStart(2, '0')}s` : `${seconds}s`;
}

export function createProgressLiveness(options = {}) {
  const staleAfter = Number(options.staleAfter) || 4000;
  const tickEvery = Number(options.tickEvery) || 1000;
  const now = options.now || (() => Date.now());
  const startTimer = options.setInterval || ((callback, delay) => globalThis.setInterval(callback, delay));
  const stopTimer = options.clearInterval || ((timer) => globalThis.clearInterval(timer));
  const states = new WeakMap();

  function paint(node, state) {
    const current = now();
    const percent = Math.round(state.value * 100);
    const waiting = state.active && current - state.lastSignal >= staleAfter;
    const elapsed = elapsedLabel(current - state.startedAt);
    node.textContent = waiting
      ? `${state.text} — still working · ${elapsed} elapsed · ${percent}% confirmed`
      : `${state.text} — ${percent}%`;
    node.style.setProperty('--done', percent + '%');
    node.setAttribute('role', 'progressbar');
    if (!node.hasAttribute('aria-label')) node.setAttribute('aria-label', 'Media processing progress');
    node.setAttribute('aria-valuemin', '0');
    node.setAttribute('aria-valuemax', '100');
    node.setAttribute('aria-valuenow', String(percent));
    node.setAttribute('aria-valuetext', waiting
      ? `${state.text}; ${percent}% confirmed; still working; ${elapsed} elapsed`
      : `${state.text}; ${percent}%`);
    node.setAttribute('aria-busy', state.active ? 'true' : 'false');
    node.classList.toggle('is-bad', state.bad);
    node.classList.toggle('is-active', state.active);
    node.classList.toggle('is-waiting', waiting);
  }

  function update(node, text, fraction, bad = false) {
    if (!node) return;
    const prior = states.get(node);
    const priorValue = prior ? prior.value : Number(node.getAttribute('aria-valuenow')) / 100;
    const requested = fraction == null ? priorValue : Number(fraction);
    const value = clamp(Number.isFinite(requested) ? requested : 0);
    const timestamp = now();
    const restarting = !prior || !prior.active || value + 0.02 < prior.value;
    const state = prior || { timer: null };
    state.value = value;
    state.text = String(text || 'Working…');
    state.bad = !!bad;
    state.active = !state.bad && value < 1;
    state.lastSignal = timestamp;
    if (restarting) state.startedAt = timestamp;
    node.hidden = false;
    states.set(node, state);
    paint(node, state);

    if (state.active && state.timer == null) {
      state.timer = startTimer(() => paint(node, state), tickEvery);
    } else if (!state.active && state.timer != null) {
      stopTimer(state.timer);
      state.timer = null;
    }
  }

  function stop(node) {
    const state = states.get(node);
    if (!state) return;
    state.active = false;
    if (state.timer != null) stopTimer(state.timer);
    state.timer = null;
    paint(node, state);
  }

  return { update, stop };
}
