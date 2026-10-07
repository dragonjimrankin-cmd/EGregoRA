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

## Why this cannot be done from the agent's side

Recorded so that it is not attempted again: the sandbox can reach only
`api.github.com`, and the live site is reached through a control request run by
CI. Colab itself requires an interactive Google login with no programmatic
equivalent. Kaggle, the other free-GPU route, allocates CPU only until the
account is phone-verified, which is also a human step.
