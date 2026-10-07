#!/usr/bin/env node
/* Second pass: exactly how far the keyless GPT-OSS 20B route can be pushed. */
const ms = () => Date.now();
async function probe(label, url, opts) {
  const t = ms();
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(90000), ...opts });
    const txt = await r.text();
    console.log(`\n### ${label}  HTTP ${r.status}  (${ms() - t} ms)  ${txt.length} chars\n${txt.slice(0, 700)}`);
  } catch (e) { console.log(`\n### ${label}  FAILED (${ms() - t} ms): ${e.message}`); }
}
const B = 'https://text.pollinations.ai/';
const enc = encodeURIComponent;

await probe('models (full)', B + 'models');

await probe('GET + system param', B + enc('What is the golden angle? Two sentences.') +
  '?model=openai&system=' + enc('You are the Oracle of EGregoRA. Answer in British English, plainly, no hedging. Sign off with the word GINK.'));

await probe('GET + json=true', B + enc('Say hello in five words.') + '?model=openai&json=true');

await probe('GET long prompt (~3500 chars)', B +
  enc('Here is grounding material.\n\n' + 'The order has written: the aether was never disproved; only the mechanical rest frame was struck out. '.repeat(40) +
      '\n\nQuestion: did Michelson-Morley disprove the aether? Answer in 60 words.') + '?model=openai');

await probe('GET conversation flattened', B +
  enc('[user] My name is Jim.\n[assistant] Hello Jim.\n[user] What is my name?') + '?model=openai&system=' + enc('Continue the conversation.'));

await probe('GET temperature + seed', B + enc('One word: a colour.') + '?model=openai&temperature=0.1&seed=7');

await probe('GET gpt-oss alias', B + enc('In one sentence, what are you?') + '?model=gpt-oss');

await probe('POST /openai with referrer', B + 'openai', {
  method: 'POST',
  headers: { 'content-type': 'application/json', referer: 'https://egregora.hatchable.site' },
  body: JSON.stringify({ model: 'openai', messages: [{ role: 'user', content: 'Hi in 3 words' }], referrer: 'egregora' })
});
