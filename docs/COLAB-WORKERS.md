# The Colab workers, and how the site comes to trust them

## The four accounts the order uses

These are the Google accounts the order's GPU workers are to run in. One free
Colab runtime each, so four workers when all four are awake:

| account | notebook | label to give it |
|---|---|---|
| `dragon.jim.rankin@gmail.com` | `colab/egregora-gpu.ipynb` | `jim-1` |
| `jim.rankin.dragon@gmail.com` | `colab/egregora-gpu.ipynb` | `jim-2` |
| `shakradragon@gmail.com` | `colab/egregora-gpu.ipynb` | `shakra` |
| `cervixen.info@gmail.com` | `colab/egregora-gpu.ipynb` | `cervixen` |

The `account` field in the registration is what the pool shows in the keeper's
panel and in `{"action":"workers"}`, so putting the right label in tells you at
a glance which runtime has gone to sleep. Nothing authenticates the account
name itself — the shared secret below is what authenticates the worker — so it
is a label for humans, not a credential.

A free Colab runtime is reclaimed after a few hours and more aggressively if
the tab is closed, so the realistic pattern is: open all four, run all four,
and expect one or two to be awake at any moment. The pool prefers whichever is
idle and ignores the rest.

## Who is in the pool right now

**Nobody.** Asked of the live site on 7 October 2026:

```
POST /api/control {"action":"workers"}   →  { "workers": [] }
POST /api/control {"action":"accounts"}  →  { "kaggle": [], "huggingface": [],
                                              "fal": [], "replicate": [], "openai": [] }
```

The pool is empty because a Colab worker cannot be created from here. Google
publishes no API that lets an application open a notebook, attach a runtime or
sign in on somebody's behalf, and there is no token that can be bought or
borrowed to do it. A human with a Google account has to press Run. That is the
whole of the obstacle, and it is not one the order can automate around.

## How a worker joins

The notebook introduces itself. Nothing on the site goes looking for it.

1. **The notebook wakes.** `colab/egregora-gpu.ipynb` installs its
   dependencies, loads the weights and starts a small HTTP server inside the
   runtime.
2. **It opens a tunnel.** Colab runtimes have no public address, so the
   notebook opens one (Cloudflare or ngrok) and learns its own public URL.
3. **It knocks.** It posts to `/api/colab`:

   ```json
   { "action": "register", "label": "ed-colab-1", "endpoint": "https://....trycloudflare.com",
     "gpu": "Tesla T4", "account": "ed@…", "caps": "video,image,chat",
     "model": "hunyuan-1.5", "secret": "…" }
   ```

4. **It keeps knocking.** Every couple of minutes: `{ "action": "heartbeat",
   "endpoint": "…", "secret": "…" }`. A worker that stops knocking drops out of
   `liveWorkers()` and is no longer offered any jobs.
5. **It says goodbye** when the runtime is reclaimed:
   `{ "action": "retire", "endpoint": "…", "secret": "…" }`.

## How the site authenticates them

There are two directions and they use the same shared phrase.

**Notebook → site.** Every write to `/api/colab` must carry `COLAB_SECRET`,
either in the body as `secret` or in the `x-egregora-secret` header. Without it
the call is refused with 403. The `GET` is public but deliberately shows no
endpoint URLs — only labels, GPUs and job counts — so reading the pool tells an
outsider nothing they could abuse.

**Site → notebook.** When the order sends work to a worker it attaches the same
phrase as `x-egregora-secret`. The notebook refuses anything that does not carry
it. This matters more than it looks: the tunnel URL is a public address on the
open internet, and without the shared phrase anyone who guessed it would have
free use of the GPU.

If `COLAB_SECRET` is not configured, the writes are accepted unauthenticated.
That is convenient for a first test and should not be left that way.

## Setting it up, start to finish

1. In the Hatchable project settings, add a config value named **`COLAB_SECRET`**
   — any long random phrase.
2. Open `colab/egregora-gpu.ipynb` in Colab, signed into any Google account.
3. **Runtime → Change runtime type → T4 GPU**, then Run all.
4. Paste the same phrase into the `SECRET` cell at the top.
5. Watch for `registered with the order` in the output.
6. Confirm from outside: `GET https://egregora.hatchable.site/api/colab`
   should now list the worker, and `{"action":"workers"}` on the control API
   should show it as free.

Repeat in as many Google accounts as you have. Each one is a separate free GPU,
the pool prefers whichever is idle, and a worker that disappears when Colab
reclaims its runtime simply drops out of the list.

## What was tried on 7 October 2026, and what came back

Rather than assert that the free GPUs are out of reach, the order went and
asked. `scripts/gpu-probe.mjs` runs from CI, where there is real egress, and
drives Kaggle through its own API with the order's token.

* **The token is good.** `oauth2/introspect` returns `shakradragon`.
* **The push was accepted with a GPU requested.** Kernel
  `shakradragon/egregora-gpu-check-muxgitio`, `enableGpu: true`,
  `kernelExecutionType: SaveAndRunAll`, no error.
* **The kernel ran and finished.** And what it found was:

  ```json
  { "torch": "2.11.0+cpu", "cuda_available": false, "device": null,
    "smi_error": "[Errno 2] No such file or directory: 'nvidia-smi'" }
  ```

So Kaggle accepts the request for an accelerator and quietly allocates a CPU
machine. That is the phone-verification wall, now measured rather than
assumed: **an unverified Kaggle account can push GPU kernels all day and never
receive a card.** This is also why five video jobs sat at "running" for ever
and why the GPU lock kept wedging.

Hugging Face was asked the same question in the same run: its router has no
text-to-video route at all (404 on every model tried), so the order's Hugging
Face token buys pictures and thinking but not film.

**Asked again on the Shakra account, naming the card outright.** The order's
Kaggle token belongs to `shakradragon` (confirmed by `oauth2/introspect`), so
that account *is* the one the site already uses for GPU work — `KNOWN_USER`
in `hatchable/lib/kaggle.js`. The probe was re-run against it with
`enableGpu: true` **and** `machineShape: "NvidiaTeslaT4"` so there could be no
ambiguity about what was being asked for. Kernel
`shakradragon/egregora-gpu-check-muxk3kn9` was accepted, ran, and reported
`torch 2.11.0+cpu`, `cuda_available: false`, no `nvidia-smi`. The account
choice is not the blocker; the entitlement is. Kaggle grants accelerators only
to phone-verified accounts, at kaggle.com/settings → Phone verification.
Once that is done nothing needs changing in the code: the same probe will come
back with a T4 and the video and image routes will start landing on it.

**The single highest-value human action, therefore, is not Colab — it is
phone-verifying `shakradragon` on Kaggle.** It takes under a minute, and once
it is done the order can drive the whole thing through the API without anyone
opening a browser again: push, poll, fetch the file, release the lock.

## Why this cannot be done from the agent's side

Recorded so that it is not attempted again: the sandbox can reach only
`api.github.com`, and the live site is reached through a control request run by
CI. Colab itself requires an interactive Google login with no programmatic
equivalent. Kaggle, the other free-GPU route, allocates CPU only until the
account is phone-verified, which is also a human step.
