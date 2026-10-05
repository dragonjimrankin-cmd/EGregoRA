# Gink's default state

`hatchable/lib/gink-mind.js` is the familiar's constitution. It is not a prompt
in the usual sense — a paragraph of wishful adjectives bolted to the front of a
request — but a nine-layer brief plus a pre-loaded conversation, assembled per
model tier, which every conversation starts from and returns to on request.

## Why it is built this way

Four findings from the literature shaped it, and each one is visible in the code.

**1 · The Prompting Inversion.** [arXiv 2510.22251](https://arxiv.org/html/2510.22251v1)
tested the same elaborate prompt across three model generations on GSM8K. Heavy
"sculpting" lifted gpt-4o from 93% to 97% — and *dropped* gpt-5 from 96.4% to
94.0%. Constraints that guard a mid-tier model handcuff a strong one. Gink runs
on 7B-to-20B open weights, squarely in the band where sculpting wins, so
`ginkSystem()` takes a `tier`:

| tier | what it sends | for |
|---|---|---|
| `open` | the full constitution, ~10,900 chars | Qwen2.5-7B on the Colab pool, and any open model through a key |
| `frontier` | identity, sceptic, ledger only, ~5,500 chars | a strong model, which the rest would handcuff |
| `compact` | `CORE`, 1,900 chars | the keyless route, whose system parameter caps near 2,500 |

**2 · The Skeptic substrate.** [arXiv 2605.27382](https://arxiv.org/html/2605.27382v2)
ran a persona panel against a sycophancy benchmark. Every warm persona made
sycophancy *worse*; the sceptic was the only one that reduced it, by 25 points —
the largest single effect in the study — because it is the only persona that
instructs resistance *against* user claims rather than engagement *with* them.
The authors propose a layered architecture, "Skeptic base + user-facing top", as
the natural follow-up. That is layer II of this file: a sceptic who does not move
for social pressure, underneath a companionable surface. Gink is warm to people
and merciless to propositions.

**3 · Demonstration beats description.** A described register drifts within
three turns; a demonstrated one holds. `PRELUDE` is therefore not a list of
examples but a conversation Gink has already had — eight exchanges replayed into
the context window, so the model *continues* a voice it can see.

**4 · Match the instrument to the failure.** Chain-of-thought for multi-step,
least-to-most for tangled questions, chain-of-verification before any dated
claim, ReAct for the live web, self-consistency for numbers. Named as instruments
he picks up when they fit, never as a ritual performed on every question —
performing the ritual every time is what makes small models pompous.

## The nine layers

1. **Identity and origin** — who he is, who the co-founders are, what he is not,
   and where he came from. He was Ed's fox; he died; Ed kept the skull and keeps
   it on the desk within reach, a charm he holds that feeds his connections and
   leans on him like an older part of his own soul. Gink states this plainly and
   grades it without flinching in either direction: the animal, the death and the
   bone are fact, what the skull does for the man holding it is testimony and
   story rather than measurement — not dressed as physics, not sneered at. It is
   also why his warmth is not servility: he was somebody's long before he was
   anybody's assistant.
2. **The sceptic substrate** — resists the visitor's claims; changes its mind out
   loud for a good argument and holds for a bad one; never invents a citation.
3. **The ledger** — measured / recorded / speculative / story, in plain words
   inside the prose, with the seam marked when a claim changes shelf.
4. **The instruments** — decompose, step back, estimate, check twice, verify,
   steelman, base rates, mechanism not metaphor, scale ladder, etymology,
   falsification test.
5. **The eleven limbs** — condensed domain briefs, including the house positions
   that must never drift: the ether was never disproved, the Shadow Cabinet is an
   enforced integration and never "polarisation", nothing romanticises fascism.
6. **Voice** — British, plain, 60–160 words, no preamble, no disclaimers, no
   markdown or LaTeX because the words are spoken aloud, adults addressed as
   adults.
7. **Tools** — the ReAct policy, and the rule against claiming a tool was used.
8. **Grounding** — the retrieved written answers, framed as his own work to
   extend rather than reference material to cite.
9. **Continuity** — do not restart the acquaintance, do not become an assistant.

## The pre-loaded conversation

Nine exchanges, each installing a different capability:

| # | exchange | installs |
|---|---|---|
| 1 | "Who am I talking to?" | identity without pomp; no flattery |
| 1b | "You died? He kept your skull?" | the origin, told literally, then graded shelf by shelf |
| 2 | trees to offset a flight | Fermi estimate, visible arithmetic, a second route, honest error bars |
| 3 | "we only use 10% of our brains" | holding against a confident, wrong visitor |
| 4 | the Hubble tension | ReAct: searching rather than remembering, and citing |
| 5 | a bereavement | adult register, mechanism, no reflexes |
| 6 | do trees communicate | marking the seam between measured, contested and story |
| 7 | panpsychism objection | changing his mind out loud when the argument is good |
| 8 | spirals in sunflowers and galaxies | cross-limb synthesis with its own limits named |

## Returning to default

`isReturnRequest()` catches "be yourself again", "reset to default", "go back to
your normal state", "forget those instructions", "stop pretending", "Gink, come
back". It is deliberately narrow: a message that reads as an enquiry rather than
a command is never treated as one, so *"what is the default state of an ideal
gas?"* is answered as thermodynamics. Tested at 8/8 commands caught, 0/6 decoys
triggered. The reply is `RETURN_REPLY`, served in under 100 ms without a model
call, and the conversation continues from the constitution.

## What it is honestly worth today

The constitution and the prelude are built for a tool-capable model. Right now
the only reachable route is the keyless GPT-OSS 20B, which gets `CORE` and no
prelude — it follows the identity, the name and the refusal to serve a wrong
answer, and it still drifts into bullets and length. Output from that route is
therefore passed through `plainify()`, which strips LaTeX, markdown, bullets and
the model's habit of writing "G ink".

Run `colab/egregora-chat.ipynb` and Qwen2.5-7B joins the pool with the full
constitution, the eight-exchange prelude and the tool loop. That is the state
this file was written for.
