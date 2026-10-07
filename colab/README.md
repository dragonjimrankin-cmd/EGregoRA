# The Colab GPU pool

## What could not be done, and why

Four Google accounts carry the order's GPU workers, confirmed 7 October 2026:

* `dragon.jim.rankin@gmail.com` — label `jim-1`
* `jim.rankin.dragon@gmail.com` — label `jim-2`
* `shakradragon@gmail.com` — label `shakra`
* `cervixen.info@gmail.com` — label `cervixen`

One free runtime each, so four GPUs when all four are awake. See
`docs/COLAB-WORKERS.md` for how a worker proves itself to the site.

**An application cannot sign into Google Colab.** There is no Colab API, no
service-account route to a Colab runtime, and no token that grants one. A
runtime is allocated to a human who is signed into Google in a browser, behind
OAuth and two-factor, and Google's terms forbid automating that sign-in. Even
with the passwords — which should never be handed over, and were not asked for —
the connection would break at the first device check.

So the link is built the other way round: **the notebook connects to us.**

## How it works instead

1. Open [`egregora-gpu.ipynb`](./egregora-gpu.ipynb) in Colab under any one of
   those four accounts (File → Open notebook → GitHub, or upload it).
2. Runtime → Change runtime type → **T4 GPU**.
3. Runtime → **Run all**.

The notebook then, by itself:

- installs `diffusers`, `transformers`, `accelerate`, `imageio-ffmpeg`;
- starts a small HTTP worker on the Colab machine (`/submit`, `/job`, `/file`);
- downloads `cloudflared` and opens a quick tunnel, giving it a public
  `https://….trycloudflare.com` address;
- **registers that address** with `POST /api/colab`, and heartbeats every two
  minutes.

From that moment the site treats the machine as a provider. `submitVideo()`
hands clips to the least-busy live worker before it falls back to Kaggle or to
any paid key, and `pollVideo()` pulls the finished mp4 and files it in the
order's own storage. The model stays resident between clips, so the second
clip on a warm worker is minutes rather than half an hour.

Close the tab and the worker stops heartbeating; fifteen minutes later it is
no longer in the pool. Run it in all four accounts and the pool has four GPUs,
and jobs spread across them by queue depth.

**Your Google account is never shared with the site.** All it ever learns is a
temporary tunnel URL and the GPU's name.

## Guarding the door

Set a `COLAB_SECRET` in the Hatchable project config and put the same string in
the notebook's `SECRET` field. Registration, heartbeats and job submission then
all require it, so a stranger cannot register a worker or feed one prompts.
Without a secret configured, registration is open — fine for an afternoon, not
for leaving running.

## Honest limits

- Colab's free tier cuts a session off after a few hours, and sooner if the tab
  is backgrounded for long. The worker is disposable by design; rerun the
  notebook when it dies.
- Free runtimes are rate-limited per account. Google throttles accounts that
  run GPUs back to back all day, and using five accounts to dodge that is
  against Colab's terms — this is the honest statement of it, not advice.
- A T4 will not hold Mochi 1 or the 14B Wan; those stay on the paid routes.
  Everything marked *own GPU* in the model dropdown will run here.

## Checking the pool

```bash
curl https://egregora.hatchable.site/api/colab
# {"workers":[{"label":"Colab","gpu":"Tesla T4","jobs":2,"age_s":41}]}
```
