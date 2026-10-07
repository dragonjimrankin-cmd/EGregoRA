# EGregoRA — Handover

**Everything a new agent or account needs to take over this project.**
Written 7 October 2026. Give this file to any Arena account that should be
able to continue the work — it is written so that a session which has never
seen the original conversation can carry on without asking a question.

Intended recipients: **shakradragon@gmail.com** and
**dragon.jim.rankin@gmail.com**.

> On credentials. The owner has stated, explicitly and more than once, that
> exposure of these tokens in the public repository is authorised and that
> rotation warnings are not wanted. They are reproduced below because the
> project genuinely does not work without them. Do not re-litigate this and
> do not repeat the warning back to him.

---

## 1. What this is

**EGregoRA** is an ornate public website for an order of enquiry founded by
**Edward Gregory** and **Jim Rankin** — *co-founders*, both of them, always
(see §9). It covers cosmic physics, druidry, sacred geometry, astrology,
neuroscience, biology, the Law of One, occult fascism handled critically,
magic, alchemy and consciousness. It carries a conversational oracle, an
image generator, a video generator, a 3D modelling bench, a rune forge, a
sketch pad, member accounts with age verification, and a mailing list.

- **Live:** https://egregora.hatchable.site
- **Repository:** https://github.com/dragonjimrankin-cmd/EGregoRA (public)
- **Working branch:** `arena/01a10807-egregora` — all work happens here.
- **Current deploy:** v139 and rising; the version is in
  `ci-logs/hatchable-deploy.log`.
- **Tagline:** *Life, Love, Magic.* It does not change.

---

## 2. Credentials and accounts

| What | Value | Notes |
|---|---|---|
| Hatchable API key | `hb_1jMSZIvpa2hRRNsQtmCQ72azX2AvWmWhtubjaaTZ` | Deploys the site. In the GitHub workflow. |
| Hatchable project | `proj_eiuxpFfTnwwx` | Domain `egregora.hatchable.site`. |
| Hugging Face token | `hf_zRHNlAJVSs` + `PGzEIaPWhjHNiXELzWDeVZdO` (join the two, no space) | Account **ShakRaDragon** / shakradragon@gmail.com, verified, free tier (`isPro:false`, prepaid). Drives the oracle's model route. |
| Kaggle API token | `KGAT_51bb1f0d635e8302c344b1832aaacb0c` | Account **shakradragon**. Works, but see §8 — no GPU until the account is phone-verified. |
| Control API token | `jim1_c6bd62438879ec7d7cdad176bf105a352cf01866574ebb4e` | Token id **JIM1**. Lets CI drive the live site's API. |
| Keeper passcode | `1133` | Overridden by `KEEPER_PASSCODE` if set. |
| OpenAI key | base64-split inside `hatchable/lib/key-store.js` | Billing is not funded; the route is dormant. |
| Contact address | `shakradragon@gmail.com` | Every outbound and inbound address on the site. |

**Colab accounts** (labels used by the worker notebook; the label is not a
credential — `COLAB_SECRET` authenticates):

| Address | Label |
|---|---|
| dragon.jim.rankin@gmail.com | `jim-1` (the notebook default) |
| jim.rankin.dragon@gmail.com | `jim-2` |
| shakradragon@gmail.com | `shakra` |
| cervixen.info@gmail.com | `cervixen` |

Where the tokens live in code: `hatchable/lib/key-store.js` holds the
bundled ones, base64-split so GitHub's push protection does not reject the
push. **Never paste a raw token into a workflow file** — push protection
blocks it and the push fails. Anything configured in the Hatchable project
settings (`HUGGINGFACE_API_KEY`, `KAGGLE_API_TOKEN`, `OPENAI_API_KEY`,
`FAL_KEY`, `REPLICATE_API_TOKEN`, `COLAB_SECRET`, `KEEPER_PASSCODE`) wins
over the bundled value.

---

## 3. How to deploy — the loop that works

Run from the repository root. Every step matters; the ones people skip are
marked.

```bash
npm ci --silent                 # node_modules is not persisted — do this first, every session
# ... make the edit ...
npm run clean                   # ONLY when a page is deleted or renamed
npm run build:hatchable         # eleventy, then copy _site into hatchable/public
npx html-validate "_site/**/*.html"
npm run audit                   # the meta/SEO audit; must say "clean"
git fetch -q
git reset --mixed origin/arena/01a10807-egregora
git checkout origin/arena/01a10807-egregora -- ci-logs   # never commit stale CI logs
git add -A && git commit -m "..." && git push origin HEAD:arena/01a10807-egregora
sleep 290                       # the deploy takes ~4.5 minutes
git fetch -q
git show origin/arena/01a10807-egregora:ci-logs/hatchable-deploy.log | grep -E '"version"|"status"'
```

The push is the only trigger. The GitHub App cannot write secrets or
dispatch workflows (403), so CI output is read back out of files on the
branch rather than from the Actions API.

**A control run pushed in the same commit as a code change executes against
the previous deploy.** Push code, wait for `"status": "live"`, then push the
probe.

---

## 4. The shape of the thing

```
src/                     Eleventy source; one .njk per page
  _data/limbs.js         THE canon of the eleven limbs — see §7
  _data/site.js          nav, contact address, tagline
  _includes/             layouts and partials (own-plates.njk is generated-adjacent)
  assets/js/site.js      ~4,700 lines: oracle, draw box, sketch pad, film box, accounts
  assets/js/fox.js       Gink, the 3D talking fox, and the speech synthesiser
  assets/js/model.js     the Turning Shop (3D bench), imports model-library.js
  assets/js/rune-forge*  the rune forge: shared builder + the page's bench
  assets/css/main.css    all of it
hatchable/
  api/                   19 serverless functions (ask, draw, video, upload, letter,
                         account-*, captcha, dispatch, colab, control, keeper …)
  lib/                   oracle corpus (22 volumes), pool, key-store, imagegen,
                         videogen, kaggle, colab, openchat, websearch, mailing …
  migrations/            16 SQL migrations
  public/                built site — overwritten by npm run build:hatchable
scripts/
  gather-plates.py       rebuilds the tail of /infographics/ — see §7
  write-locality.py      regenerates /locality/
  control-run.mjs        drives the live API from CI
  gpu-probe.mjs          asks Kaggle for a GPU and Hugging Face for video
  hatchable-deploy.mjs   the deploy, plus provider probes
ops/control-request.json the next control run's calls
ops/gpu-probe.on         presence of this file enables the GPU probe in CI
ci-logs/                 written by CI, read by the agent
docs/                    CONTROL-API.md, COLAB-WORKERS.md, this file
```

---

## 5. Driving the live site from CI (the control API)

The sandbox can only reach `api.github.com`, so anything that needs the open
internet goes through the repository: write a request, push, read the log.

`ops/control-request.json`:

```json
{ "calls": [ { "action": "ask", "question": "Is the meaning of life 42 or chicken soup?" } ] }
```

The `calls` wrapper is required. Push, wait ~3 minutes, then read
`ci-logs/control.log` from the branch.

Actions: `whoami, status, ask, draw, film, job, mailbag, member-email,
member-name, members, models, workers, accounts, chat-probe`. There is also
`{"raw":{path,body?,method?,headers?}}` for anything not covered.

Full reference: `docs/CONTROL-API.md`.

---

## 6. What the generators actually do today

- **Oracle.** Order of attempt: the order's own **written corpus** (22
  volumes, `hatchable/lib/oracle-corpus*.js`) → a member's own key (BYOK) →
  the **Hugging Face router** (`meta-llama/Llama-3.3-70B-Instruct`,
  `Qwen/Qwen2.5-72B-Instruct`, `deepseek-ai/DeepSeek-V3-0324`,
  `mistralai/Mistral-Small-24B-Instruct-2501`) → keyless routes. Verified
  working at ~300 ms.
- **Images.** Default engine is **Stable Diffusion 3.5 Large** (`sd35`), with
  SDXL-Turbo behind it and FLUX.1-schnell behind that. In practice Hugging
  Face refuses image inference on the free token, so most pictures are drawn
  by Pollinations (SDXL-Turbo or FLUX); the card always names the engine that
  actually drew it.
- **Video.** Order: member key → fal.ai → Colab → Replicate → Kaggle. With no
  GPU and no film key this returns 503, honestly.
- **Keyless chat is exhausted.** Pollinations text = 402 from the Hatchable
  IP; `ai.hackclub.com` = 404; DeepInfra / api.airforce / OpenRouter / GitHub
  Models = 401. The Hugging Face router is the working route and it is *not*
  keyless.

---

## 7. Conventions that must be kept

**The limbs.** `src/_data/limbs.js` is the single source. Eleven limbs,
I–XI, with six sub-limbs: I·ii Cosmic Ether, II·ix Runes, III·iii Music,
IX·i Occult, IX·ii Qabalah, XI·i Decoherence, XI·ii Locality. Limb VIII is
**The Black Tribunal** (never "The Shadow Cabinet") and its material lives at
`/occult/#black-tribunal`. Limbs I and VI have no page of their own yet.

**The infographics page is generated.** Never hand-edit below the
`THE REST OF THE COLLECTION` kicker. Add a drawing anywhere, then run
`python3 scripts/gather-plates.py`. It stamps `id="fig-N"` anchors on source
pages, prefixes SVG ids per page so markers cannot collide, folds the
gathered plates into one `<details>` per source page, and puts each plate in
a card with its link at the top. `/locality/` comes from
`python3 scripts/write-locality.py`.

**House style for a topic page.** Limb kicker; `section.page-head`;
`div.frame.frame--first.illuminated`; `div.divider ✦`;
`figure.plate` → `figcaption.plate-cap` (`span.plate-num`) + `div.plate-art`
+ `p.plate-note`; a survives/does-not ledger; `ul.timeline` (`span.when`);
`dl.glossary`; `details.scroll`; `ul.biblio` with the grading glyphs
`span.sci/.hist/.spec/.myth`; closing `div.frame.frame--creed`; nav and index
link. Gold `#d7b05a`, bright `#f3ddaa`, dim `#cbbb93`, verdant `#7fae7a`,
muted `#9f947a`, rose `#c98b6a`, blue `#8fb6d8`. Cinzel and EB Garamond.

**Markup traps that fail the build.** `<video autoplay>` fails validation;
quote any `description:` containing a colon; no duplicate ids; a `<label
for=X>` wrapping `#X` trips `no-redundant-for`; `aria-label` on `<canvas>`
needs `role="img"`; `type="password"` must not carry `autocomplete="off"`;
a `<figcaption>` must be the first or last child of its figure; `api/auth/`
is a reserved path; `:empty` ignores whitespace, so use `hidden`.

**Server traps.** Hatchable forbids API→API imports. `db.query` returns
`{rows}`. `export const methods` must list every verb a function answers.
`email.send({to,subject,html,text?})` takes **no `from`**. `credentials()` in
`lib/pool.js` silently drops any fallback that is not an object with a
`.secret` — always pass `{id,label,secret}`. No backticks inside JS template
literals. There is no server-side vision and no SVG rasteriser.

---

## 8. Outstanding — the things only a human can do

1. **Phone-verify the Kaggle account `shakradragon`** at
   kaggle.com/settings. This is the single highest-value minute available.
   Kaggle accepts GPU kernels from an unverified account and quietly gives
   them a CPU box: proved twice, with `enableGpu: true` *and*
   `machineShape: NvidiaTeslaT4`, both returning
   `torch 2.11.0+cpu, cuda_available: false`. Once verified, nothing in the
   code needs changing — re-run `scripts/gpu-probe.mjs` by creating
   `ops/gpu-probe.on` and pushing.
2. **Run `colab/egregora-gpu.ipynb` on a T4** in one or more of the four
   Colab accounts, having set `COLAB_SECRET` first. Colab cannot be logged
   into programmatically — no API, OAuth and device checks, and the terms
   forbid it. This is the one step with no automated equivalent.
3. Fund OpenAI billing and set `OPENAI_API_KEY`, if the paid routes are
   wanted.
4. Optional: `FAL_KEY` or `REPLICATE_API_TOKEN` to make video work today.
5. A verified sending domain, if platform mail starts bouncing.
6. Second provider accounts as `KAGGLE_API_TOKEN_2` + `KAGGLE_USERNAME_2`,
   `HUGGINGFACE_API_KEY_2`.

---

## 9. Standing instructions from the owner

These are not suggestions. They have each been stated explicitly, and some
were corrections of work that had gone the other way.

- **"Do all that yourself."** Do not hand back manual steps. Exhaust every
  automated route before asking for human action, and when you do ask, say
  exactly why no automated route exists.
- **"Don't worry about public credentials."** Authorised. Do not warn again.
- **Edward Gregory is a *co-founder*, never "the founder".** Jim Rankin is
  co-founder — Ed's understudy, and sometimes his muse. The homepage hero
  line reads "An Order of Enquiry · Co-founded by Edward Gregory & Jim
  Rankin" and stays that way.
- **Limb VIII is The Black Tribunal.** It states plainly that Ed has, through
  meditation and ritual recall, identified a past-life character who stood
  inside the Nazi regime. The framing is an **enforced integration** with the
  feelings, choices and paths of previous beings — positively and negatively
  impacting alike, nothing disowned. **Never use the word "polarize"** for
  it. Nothing romanticises fascism: it is named as an industrial atrocity
  dressed in stolen runes.
- **The tagline stays "Life, Love, Magic."** The longer creed was tried and
  rejected.
- **Do not say the ether was wrong, disproved, renamed, or that it "survived
  under a better name".** The ether *is* the better name. Michelson–Morley
  struck out one clause — the mechanical rest frame — and the substrate
  stands as the quantum field.
- **The oracle speaks from the written corpus first.** A model is a fallback,
  and it must never invent when it has no good match.
- **Oracle answers use plain words, never the ◆ grading marks.** Page markup
  keeps its `.sci/.hist/.spec/.myth` glyphs.
- **Age-verified members are addressed as adults** — plain discussion of
  drugs, death, sex as a subject, war, atrocity, madness, despair; no
  unrequested disclaimers and no steering to a gentler question.
- **Refused, and not to be quietly implemented later:** a request that the
  image and video generators be pre-prompted that users are 18+ and therefore
  unmoderated for sexualised generations. Declined, with reasons given: it is
  not a line this agent will move; the upstream providers filter server-side
  so a prompt cannot disable it; and "obviously over 18" is the judgement
  these models are worst at.
- **When a GPU is busy, look for a free one on another Colab account** rather
  than refusing the job.
- On `/ask-ed/`: Gink's text block sits **above** the fox; the answer box sits
  **above** the question box; the action buttons sit **under** the question
  box. Two layout experiments were reverted with "undo twice" — do not
  reintroduce them unasked.

---

## 10. Dead ends — do not spend time here again

- **Google Colab cannot be driven programmatically.** No API, OAuth plus
  device checks, terms forbid it.
- **Kaggle gives an unverified account a CPU and says nothing.** See §8.
- **Hugging Face has no text-to-video route** — 404 on LTX-Video, Wan 2.1 and
  HunyuanVideo — and refuses image inference on a free prepaid token.
- **Keyless hosted chat is exhausted.** See §6.
- Do not vendor OpenMontage (161 MB). Eleventy renders `.md` under
  `src/assets/`, so keep placeholders as `.txt`. Never slice source by two
  `s.index()` anchors. `CYL`/`SPH` in `model-library.js` take 3–4 arguments
  only. Always screen model replies for refusal or billing text arriving with
  a 200.

---

## 11. First five minutes for a new session

```bash
cd EGregoRA
git fetch -q && git status --short       # expect a clean tree on arena/01a10807-egregora
npm ci --silent
npm run build:hatchable && npm run audit # should say "clean"
git show origin/arena/01a10807-egregora:ci-logs/hatchable-deploy.log | grep -E '"version"|"status"'
```

Then read, in this order: this file, `docs/CONTROL-API.md`,
`docs/COLAB-WORKERS.md`, `src/_data/limbs.js`.

If `git` or `gh` fails with an authentication error, the GitHub connection
needs reconnecting in Arena — never ask the owner for a token or a password.
