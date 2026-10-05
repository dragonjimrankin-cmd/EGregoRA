# Continuity — the same fox in every shot

The oldest failure in generated video is that nothing remembers anything. Each
clip is made from scratch by a model with no memory, so the second shot of "the
fox" is a different fox: another coat, another face, another room, another lens.
Cut those together and you do not have a film, you have a slideshow of
strangers.

This is how EGregoRA holds a sequence together.

## Three locks, strongest first

| # | lock | what it does | where it works |
|---|---|---|---|
| 1 | **the frame** | the chosen frame is handed to the model as the literal first frame of the next clip | any image-to-video route: fal (`.../image-to-video`), Replicate, and a Colab worker whose pipeline accepts an `image` |
| 2 | **the seed** | the same noise means the same world, even on a text-only route | everywhere a seed can be passed |
| 3 | **the words** | the clauses that described the characters, the place, the camera, the light and the stock are reused *verbatim* | everywhere, always |

Lock 3 is the one that never fails, which is why it is the one built most
carefully.

## The continuity sheet

`hatchable/lib/continuity.js` splits a prompt into clauses and files each under
one of five headings:

```
characters  A red fox with a torn left ear standing in frosted bracken
setting     ancient stone circle behind it
light       low winter sun
camera      slow dolly in, shallow depth of field
style       35mm film grain
```

Ordering matters and is deliberate: style is tested before camera, because
"35 mm film grain" is a stock and not a lens; light before setting, because
"low winter sun" is not a place; people before setting, because a fox standing
in bracken is first of all a fox. The first clause of any prompt is taken as the
subject whatever it contains — that is near-universally true of how people write
prompts.

The sheet is stored with the generation (`videos.sheet`). When a later shot is
extended from it, `composePrompt()` rebuilds a prompt in natural order —
subject, scene, **action**, place, light, camera, stock — reusing every carried
clause word for word and changing only the action. A continuation prompt also
opens with:

> Continuing directly from the previous shot. Identical characters with
> identical faces, markings and wardrobe; identical location and background;
> identical camera, lens and framing; identical light and colour.

No model is called to do any of this. It is deterministic string work, which
means that when continuity does break you can read the log and see exactly which
clause went missing — which is never true of asking a language model to
"remember the character".

## Using it

On the Ask Ed page, every picture and every clip drops into **Make a Montage**.
Each shot carries a **Continue from this shot** button. Pressing it:

1. reads the frame off the clip at its out point (or the picture itself) onto a
   canvas;
2. uploads that frame via `/api/upload` so the model can be given a URL;
3. hands the parent's id, sheet and seed to the film box, which shows a strip
   with the thumbnail and the exact list of what is being carried.

Then you write only what happens next.

If the browser cannot read the frame — a clip served without permissive CORS
headers taints the canvas — the page says so plainly and falls back to locks 2
and 3 rather than pretending it has the frame.

## Progress and hardware

The same work gave every generator a real progress bar. Two kinds of number can
arrive and the page never conflates them:

- **measured** — the sampler's own step counter. A Colab worker reports it on
  every diffusion step (`callback_on_step_end`); fal and Replicate stream it
  into their logs, which `progressFromLogs()` parses.
- **estimated** — nobody is reporting, so the page reads the clock against how
  long that route usually takes: fal ~190 s a clip, Colab ~330 s, Kaggle ~1500 s
  because it re-downloads the model every run. An estimate eases toward 94% and
  stops there. A bar that sits at 99% is a lie; one that hits 100% before the
  file exists is a worse one.

The label under the bar always says which of the two you are looking at, and the
line beneath names the machine: `Tesla T4 16GB · Google Colab, lent to the
order`, `Nvidia Tesla T4 16GB · Kaggle`, or — honestly — `fal.ai hosted
accelerator — the provider does not say which card`.

## Files

- `hatchable/lib/continuity.js` — the sheet: `readSheet`, `extendSheet`,
  `composePrompt`, `describeSheet`, `seedFor`
- `hatchable/lib/videogen.js` — image-to-video routes, seeds, `estimateProgress`,
  `progressFromLogs`, hardware strings
- `hatchable/api/video.js` — `POST { prompt, from, frame, sheet, seed }`,
  `GET ?id=` returning `{ progress, measured, stage, hardware, carried }`
- `hatchable/migrations/0014_continuity.sql` — `sheet`, `parent_id`, `seed`,
  `init_url`, `progress`, `hardware`
- `src/assets/js/site.js` — `EGBar`, `EGExtendFrom`, `EGMontageAdd(url, prompt,
  kind, meta)`, frame grabbing, stills in the cut
- `colab/egregora-gpu.ipynb` — reports step progress and the GPU name, accepts
  a seed and a starting frame
