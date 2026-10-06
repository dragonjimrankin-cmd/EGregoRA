# The control API — token JIM1

Another chat, a script, or any agent that is not a browser can drive EGregoRA
through one endpoint with one token.

```
POST https://egregora.hatchable.site/api/control
Authorization: Bearer jim1_c6bd62438879ec7d7cdad176bf105a352cf01866574ebb4e
Content-Type: application/json

{ "action": "…", … }
```

`GET /api/control` returns the manual and needs no token.

## The token

| name | JIM1 |
|---|---|
| value | `jim1_c6bd62438879ec7d7cdad176bf105a352cf01866574ebb4e` |
| scope | `control` |
| stored as | SHA-256 only — `9d7bccc0…f853ef` in `api_tokens` |

The database holds the hash, never the token. Every call bumps `uses`,
`last_used` and `last_action`, so the register shows what has been done with
it. To kill it: `UPDATE api_tokens SET revoked = TRUE WHERE name = 'JIM1';`

## Actions

| action | body | does |
|---|---|---|
| `whoami` | — | confirms the token and lists what it may do |
| `status` | — | limbs, corpus size, mailbag count, job counts, GPU pool |
| `ask` | `question`, optional `history[]`, `name`, `limb` | the oracle answers exactly as it would a visitor — corpus first, model second, web search when needed |
| `draw` | `prompt` | commissions a picture; returns a URL, or a job id if it went to a GPU queue |
| `film` | `prompt`, `aspect` `16:9`\|`9:16`, `model` | commissions a 480p clip; returns a job id |
| `job` | `id` | polls a picture or clip: `queued` → `running` → `ready` with a URL |
| `mailbag` | `limit` 1–50 | the questions visitors have asked |
| `member-email` | `from`, `to` | move an account (and its letters) to another address |
| `member-name` | `email`, `name` | set the display name the header chip and account page show |
| `members` | `limit?` | list the register, newest first |
| `models` | — | the open-weights video models on offer |
| `workers` | — | the live Colab GPU pool, with the account and capabilities of each |
| `accounts` | — | every credential the render pool holds, per provider, with failures and cooldowns |

## Examples

```bash
T=jim1_c6bd62438879ec7d7cdad176bf105a352cf01866574ebb4e
C="https://egregora.hatchable.site/api/control"
H=(-H "authorization: Bearer $T" -H "content-type: application/json")

curl -s "${H[@]}" -d '{"action":"whoami"}'            "$C"
curl -s "${H[@]}" -d '{"action":"status"}'            "$C"
curl -s "${H[@]}" -d '{"action":"ask","question":"Why 137.5 degrees and not 120?"}' "$C"
curl -s "${H[@]}" -d '{"action":"film","prompt":"an oak in winter fog, slow dolly","model":"ltx"}' "$C"
curl -s "${H[@]}" -d '{"action":"job","id":42}'       "$C"
```

## Giving another chat the keys

Paste this at the top of the other conversation:

> You can control the EGregoRA website. POST to
> `https://egregora.hatchable.site/api/control` with the header
> `Authorization: Bearer jim1_c6bd62438879ec7d7cdad176bf105a352cf01866574ebb4e`
> and a JSON body `{"action": "..."}`. Call `GET /api/control` first for the
> manual. Actions: whoami, status, ask, draw, film, job, mailbag, member-email, member-name,
> members, models,
> workers.

## Issuing another one

```sql
-- hash the new token with sha256 first, never store the token itself
INSERT INTO api_tokens (name, token_hash, scope) VALUES ('ED1', '<sha256>', 'control');
```

`node -e "console.log(require('crypto').createHash('sha256').update('<token>').digest('hex'))"`

## What it deliberately cannot do

Publish pages, edit the corpus, read members' details, send email, or spend
money on a paid key. It drives the public surface of the order and nothing
behind the Register.

## The render pool: more than one account

Images and clips are both drawn by a pool rather than a single provider, and
every provider in that pool may hold several accounts. Free GPU quota runs
out, a Colab runtime gets reclaimed, a token is revoked — none of that should
reach the visitor, so each account is tried in turn and the first that works
wins. An account that has just refused is put on a short cooldown and stepped
over next time rather than retried into the same wall; a success clears it.

**Adding a second account needs no code change.** Any of these shapes works,
for `KAGGLE_API_TOKEN`, `HUGGINGFACE_API_KEY`, `FAL_KEY`,
`REPLICATE_API_TOKEN` and `OPENAI_API_KEY`:

| Shape | Example |
| --- | --- |
| numbered | `KAGGLE_API_TOKEN`, `KAGGLE_API_TOKEN_2`, … up to `_6` (with matching `KAGGLE_USERNAME_2`) |
| several at once, lines | `KAGGLE_ACCOUNTS` = `ed \| edgregory \| KGAT_…` on one line per account |
| several at once, JSON | `KAGGLE_ACCOUNTS` = `[{"label":"ed","user":"edgregory","token":"KGAT_…"}]` |

Colab accounts are added differently, because Colab cannot be logged into
programmatically: open `colab/egregora-gpu.ipynb` in each Google account and
set **ACCOUNT** to a different name in each. The site then interleaves work
across accounts rather than loading whichever registered first, and each
worker now registers as able to draw **stills as well as clips**, so the
"Make an Image" box tries the order's own GPUs before any hosted service.

**A busy GPU is not a refusal.** Before any job is queued, each live worker's
`/health` is polled in parallel and the idle machines are put first, so work
lands on a free runtime in another Google account rather than behind a render
already in progress. If the Kaggle notebook is occupied, clips and stills both
divert to Colab instead of returning "the order's GPU is busy"; only when every
account is genuinely working does the visitor get told to come back.

Ask the pool how it is doing:

```bash
curl -s https://egregora.hatchable.site/api/control \
  -H "authorization: Bearer $EGREGORA_TOKEN" \
  -H "content-type: application/json" \
  -d '{"action":"accounts"}'
```
