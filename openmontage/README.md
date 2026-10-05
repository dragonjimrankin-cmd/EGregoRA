# OpenMontage, installed for EGregoRA

Two things were asked for: the real OpenMontage, and an editor in the page.
They live in different places, for a reason worth stating plainly.

## Why OpenMontage cannot live on the website

[OpenMontage](https://github.com/calesthio/OpenMontage) (AGPL-3.0) is the
"world's first open-source agentic video production system" — 12 pipelines,
50+ Python tools, 500+ Markdown skills, composed through Remotion and FFmpeg.
It is a **developer tool, not a hosted service**. There is no sign-up, no API
endpoint, no browser build. It needs Python 3.10+, Node 18+, FFmpeg on PATH,
a writable working directory, minutes-to-hours of wall time, and an AI coding
assistant acting as the orchestrator — the project deliberately ships no LLM
key of its own.

EGregoRA's backend is a set of serverless functions on Hatchable: no
`npm install` at deploy, no Python runtime, no FFmpeg binary, no long-lived
filesystem, and a request timeout measured in seconds. Nothing about that can
host OpenMontage, and no amount of wiring would change it. So OpenMontage is
installed **here, as a local workshop**, and the website got a cutting room of
its own that needs nothing but a browser.

## Install it

```bash
./openmontage/install.sh
```

Checks your toolchain, clones OpenMontage into `openmontage/vendor/OpenMontage`
(ignored by git — it is 160 MB and AGPL, it belongs upstream), runs
`make setup`, and seeds `.env`.

## Cut a film from the order's own clips

```bash
# 1. pull clips the oracle has already generated
node openmontage/pull-clips.mjs --ids 12,13,14 --out openmontage/projects/first-cut

# 2. open openmontage/vendor/OpenMontage in Claude Code / Cursor / Codex / Copilot
# 3. ask it:
#    "Run the documentary-montage pipeline. Brief: ../../project-brief.md.
#     House skill: ../../skills/egregora-house-style.md.
#     Footage: ../../projects/first-cut/ (see assets.json)."
```

`pull-clips.mjs` needs nothing but Node 18+; it reads `GET /api/video?id=`,
downloads each ready clip and writes `assets.json` with prompt, model and
provenance for the asset-director stage.

The genuine zero-cost path is Piper TTS (offline) + free archive footage +
Remotion + FFmpeg. Paid generators are opt-in and the default budget cap is
$10; our brief lowers it to $1.

## Files here

| Path | What it is |
|---|---|
| `install.sh` | toolchain check, clone, `make setup` |
| `pull-clips.mjs` | fetch the order's generated clips into a project folder |
| `project-brief.md` | the standing brief handed to the pipeline |
| `skills/egregora-house-style.md` | house register, cutting rules, palette, type |
| `vendor/` | OpenMontage itself (git-ignored) |

## The other half: the cutting room in the page

`/ask-ed/` now carries **Make a Montage** under the film box. Every clip you
generate collects there; you reorder them, trim in and out points, choose a
straight cut or a crossfade, and the page edits them into one film — drawn
frame by frame onto a canvas and captured with `MediaRecorder`, entirely in
your browser. No upload, no server, no FFmpeg. It renders in real time (a
90-second montage takes 90 seconds) and downloads as a single `.webm`.

That is the everyday tool. OpenMontage is the workshop for when a film needs
narration, music, titles, stock footage and a proper timeline.
