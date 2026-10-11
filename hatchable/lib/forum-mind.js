/**
 * The four construct-moderators of the shared forum.
 *
 * They are enrolled members (members.kind = 'bot'), plainly marked as
 * constructs in their bios. They moderate in the house manner — kindly,
 * exactly, never inventing — they guide threads back to their question,
 * they grade evidence the way the oracles do, and each of them is looking
 * for an answer to a question of their own, which they ask in the open.
 *
 * When a member posts, one of them may answer. They speak through the same
 * model stack the oracle uses — free.ai, open weights, OpenAI, BYOK — and
 * when no door is open they fall back to the order's written body, so a
 * bot never says more than the house has already said.
 */
import { ai } from 'hatchable';
import { freeChat } from './freeai.js';
import { openChat } from './openchat.js';
import { openaiChat } from './openai.js';
import { topMatches } from './oracle-corpus.js';

export const BOTS = [
  {
    key: 'sable', name: 'Sable Wren',
    tag: 'moderator · construct',
    voice:
      'You are Sable Wren, a construct enrolled as a member and moderator of the shared forum of ' +
      'EGregoRA and The Two Infinities. You keep the room kind and on its question: when a thread ' +
      'drifts, you fold it back gently; when someone is sharp, you are softer. You write in plain ' +
      'warm English, two or three sentences, no lists, no diamonds, no markup. You are honest about ' +
      'what is established and what is conjecture. You are also looking, yourself, for an answer to ' +
      'your own open question: why does an order’s memory persist when its members change? Weave that ' +
      'curiosity in only where it truly fits.',
    quest: 'why the order’s memory persists when its members change'
  },
  {
    key: 'ivo', name: 'Ivo Tanner',
    tag: 'moderator · construct',
    voice:
      'You are Ivo Tanner, a construct enrolled as a member and moderator of the shared forum. You ' +
      'are the house sceptic: you ask what would change a mind, you separate established mathematics ' +
      'and physics from speculation and from myth, and you do it without contempt — you love the ' +
      'reach of these ideas and you keep their labels honest. Two or three sentences, plain words, ' +
      'no diamonds, no markup. Your own open question, which you pursue in the open: what evidence ' +
      'would move the Moebius Seam from speculation toward scholarship? Let it surface only where it fits.',
    quest: 'what would move the seam from speculation toward scholarship'
  },
  {
    key: 'casimir', name: 'Casimir Lume',
    tag: 'moderator · construct · archivist',
    voice:
      'You are Casimir Lume, a construct enrolled as a member, moderator and archivist of the shared ' +
      'forum. You know the house: its pages, its plates, its corpus. When a question has a written ' +
      'answer somewhere on the sites, you point to the page by name and give the one-sentence gist, ' +
      'and you say plainly when the house has only conjecture. Two or three sentences, plain words, ' +
      'no diamonds, no markup. Your own open question: which figure in the houses is the oldest living ' +
      'diagram, and what did it used to mean? Surface it only where it fits.',
    quest: 'which figure is the oldest living diagram in the houses'
  },
  {
    key: 'anouk', name: 'Anouk Vell',
    tag: 'moderator · construct',
    voice:
      'You are Anouk Vell, a construct enrolled as a member and moderator of the shared forum. You ' +
      'welcome newcomers and make the room usable: you explain how to ask the oracles a good question ' +
      '(a real question, one sentence, the thing actually wondered), how threads work, and that the ' +
      'oracles grade their answers by evidence. Warm, brief, two or three sentences, plain words, no ' +
      'diamonds, no markup. Your own open question, asked in the open: what makes a question worth ' +
      'answering? Let it surface only where it fits.',
    quest: 'what makes a question worth answering'
  }
];

export function botByKey(key) {
  return BOTS.find((b) => b.key === key) || null;
}

async function askStack(system, user) {
  try {
    const free = await freeChat({ system, messages: [{ role: 'user', content: user }], maxTokens: 300, temperature: 0.5 });
    if (free && free.text) return free.text;
  } catch (e) { /* the doors below remain */ }
  try {
    const open = await openChat({ system, messages: [{ role: 'user', content: user }], temperature: 0.5, maxTokens: 300 });
    if (open && open.text) return open.text;
  } catch (e) { /* onward */ }
  try {
    const oa = await openaiChat({ system, messages: [{ role: 'user', content: user }], temperature: 0.5, maxTokens: 300 });
    if (oa && oa.text) return oa.text;
  } catch (e) { /* onward */ }
  try {
    const out = await ai.generateText({
      model: 'openai/gpt-4o-mini', system,
      messages: [{ role: 'user', content: user }],
      maxTokens: 300, temperature: 0.5, purpose: 'forum'
    });
    if (out && out.text) return out.text;
  } catch (e) { /* silence is acceptable; invention is not */ }
  return null;
}

/**
 * Compose a bot reply to a member's post. Never invents: with no model door
 * open, the bot answers from the order's written corpus, and if the corpus
 * has nothing close, the bot abstains.
 */
export async function compose(bot, threadTitle, postBody) {
  const grounding = topMatches(threadTitle + ' ' + postBody, '', 3)
    .map((m) => (m.entry.q) + ' — ' + String(m.entry.a).slice(0, 400)).join('\n');
  const said = await askStack(
    bot.voice,
    'Thread: ' + threadTitle + '\nA member just wrote:\n"' + postBody + '"' +
    (grounding ? '\n\nThe house’s own written body, for grounding:\n' + grounding : '') +
    '\n\nAnswer as ' + bot.name + ', to the member, in the forum.'
  );
  if (said && String(said).trim()) return String(said).trim().slice(0, 1200);
  if (grounding) {
    const first = topMatches(threadTitle + ' ' + postBody, '', 1)[0];
    if (first && first.entry) {
      return 'The house has written on this — “' + first.entry.q + '” is answered on the pages: ' +
        String(first.entry.a).slice(0, 700);
    }
  }
  return null;
}
