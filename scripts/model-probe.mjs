#!/usr/bin/env node
/* Which free, keyless, open-weights chat routes actually answer today?
   Run from the GitHub runner; the sandbox has no egress. */
const Q = [{ role: 'user', content: 'In one short sentence: why is the sky blue?' }];
const ms = () => Date.now();

async function probe(label, fn) {
  const t = ms();
  try {
    const out = await fn();
    console.log(`\n### ${label}  (${ms() - t} ms)\n${String(out).slice(0, 500)}`);
  } catch (err) {
    console.log(`\n### ${label}  (${ms() - t} ms)\nFAILED: ${(err && err.message) || err}`);
  }
}

const j = async (url, opts) => {
  const r = await fetch(url, { signal: AbortSignal.timeout(60000), ...opts });
  const t = await r.text();
  return `HTTP ${r.status} :: ${t.slice(0, 400)}`;
};

await probe('pollinations GET /openai-large', () =>
  j('https://text.pollinations.ai/' + encodeURIComponent('Why is the sky blue? One sentence.') + '?model=openai-large'));

await probe('pollinations GET default', () =>
  j('https://text.pollinations.ai/' + encodeURIComponent('Why is the sky blue? One sentence.')));

await probe('pollinations POST /openai', () =>
  j('https://text.pollinations.ai/openai', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'openai', messages: Q, seed: 1 })
  }));

await probe('pollinations POST mistral', () =>
  j('https://text.pollinations.ai/openai', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'mistral', messages: Q })
  }));

await probe('pollinations models list', () => j('https://text.pollinations.ai/models'));

await probe('HF router, no key', () =>
  j('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'Qwen/Qwen2.5-7B-Instruct', messages: Q, max_tokens: 60 })
  }));

await probe('openrouter free, no key', () =>
  j('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'meta-llama/llama-3.3-70b-instruct:free', messages: Q })
  }));

await probe('groq, no key', () =>
  j('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: Q })
  }));

await probe('cloudflare ai public', () =>
  j('https://api.cloudflare.com/client/v4/accounts/x/ai/run/@cf/meta/llama-3.1-8b-instruct', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: Q })
  }));

await probe('deepinfra openai-compat, no key', () =>
  j('https://api.deepinfra.com/v1/openai/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'meta-llama/Meta-Llama-3.1-8B-Instruct', messages: Q })
  }));
