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
| `models` | — | the open-weights video models on offer |
| `workers` | — | the live Colab GPU pool |

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
> manual. Actions: whoami, status, ask, draw, film, job, mailbag, models,
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
