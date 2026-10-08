/**
 * The scripts the order sends to Kaggle's GPU.
 *
 * A Kaggle kernel takes no arguments and reads no environment, so the prompt
 * is rendered into the source at push time. Each script installs what it
 * needs, generates, and leaves a single file in /kaggle/working, which the
 * Notebooks API hands back when the run completes.
 */

/** Python string literal, safely quoted. */
const py = (s) => JSON.stringify(String(s == null ? '' : s));

export function videoScript({ prompt, aspect = '16:9', frames = 121, model = null }) {
  const m = model || { repo: 'tencent/HunyuanVideo-1.5', cls: 'HunyuanVideo15Pipeline', w: 848, h: 480, frames: 121, steps: 28, fps: 24 };
  const upright = aspect === '9:16';
  const w = upright ? Math.min(m.w, m.h) : Math.max(m.w, m.h);
  const h = upright ? Math.max(m.w, m.h) : Math.min(m.w, m.h);
  const n = Math.max(25, Math.min(Number(m.frames) || frames, Number(frames) || m.frames));

  return `# EGregoRA — ${m.repo} on Kaggle's GPU, written by the order's oracle.
import subprocess, sys, os, traceback

def pip(*a):
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", *a], check=False)

pip("--upgrade", "diffusers>=0.36.0", "transformers>=4.49", "accelerate", "safetensors",
    "imageio", "imageio-ffmpeg", "sentencepiece", "ftfy")

import torch
print("torch", torch.__version__, "cuda", torch.cuda.is_available(), flush=True)
if not torch.cuda.is_available():
    # These models on a CPU would still be running next week. Stop here so the
    # order is told the truth instead of waiting twelve hours for nothing.
    sys.exit("NO GPU: Kaggle gave this notebook a CPU-only machine. Accelerators "
             "need a phone-verified Kaggle account and remaining weekly quota.")
print("device:", torch.cuda.get_device_name(0), flush=True)

PROMPT = ${py(prompt)}
REPO = ${py(m.repo)}
WIDTH, HEIGHT, FRAMES, STEPS, FPS = ${w}, ${h}, ${n}, ${m.steps}, ${m.fps}
OUT = "/kaggle/working/out.mp4"

import diffusers
pipe = None
for name in [${py(m.cls)}, "DiffusionPipeline"]:
    cls = getattr(diffusers, name, None)
    if cls is None:
        print("no such pipeline in this diffusers build:", name, flush=True)
        continue
    try:
        pipe = cls.from_pretrained(REPO, torch_dtype=torch.bfloat16)
        print("loaded with", name, flush=True)
        break
    except Exception as e:
        print("could not load with", name, "-", e, flush=True)
        traceback.print_exc()

if pipe is None:
    sys.exit("LOAD FAILED: " + REPO + " would not load in this environment.")

# A 16 GB T4 holds none of these outright; offloading trades speed for fitting.
pipe.enable_model_cpu_offload()
for fn in ("enable_tiling", "enable_slicing"):
    try:
        getattr(pipe.vae, fn)()
    except Exception:
        pass

g = torch.Generator(device="cpu").manual_seed(1618)
kw = dict(prompt=PROMPT, height=HEIGHT, width=WIDTH, num_frames=FRAMES,
          num_inference_steps=STEPS, generator=g)
try:
    result = pipe(**kw)
except TypeError as e:
    # not every pipeline takes every argument
    print("retrying without size hints:", e, flush=True)
    result = pipe(prompt=PROMPT, num_frames=FRAMES, num_inference_steps=STEPS, generator=g)

frames_out = result.frames[0]
from diffusers.utils import export_to_video
export_to_video(frames_out, OUT, fps=FPS)
print("WROTE", OUT, os.path.getsize(OUT), "bytes", flush=True)
`;
}

export function imageScript({ prompt, model = null }) {
  return `# EGregoRA \u2014 Stable Diffusion on Kaggle's GPU.
#
# Stable Diffusion is the house generator: open weights, Stability AI's own
# release, and the one the order can run on hardware it borrows rather than
# on somebody else's hosted endpoint. 3.5 Medium is tried first and SDXL is
# the fallback, because 3.5 is gated behind a licence click and SDXL never
# is \u2014 so a machine with no Hugging Face token still draws.
import subprocess, sys, os

def pip(*a):
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", *a], check=False)

pip("--upgrade", "diffusers>=0.31.0", "transformers>=4.44", "accelerate", "safetensors", "sentencepiece", "protobuf")

import torch
if not torch.cuda.is_available():
    sys.exit("NO GPU: Kaggle gave this notebook a CPU-only machine. Accelerators "
             "need a phone-verified Kaggle account and remaining weekly quota.")
print("device:", torch.cuda.get_device_name(0), flush=True)

import diffusers

PROMPT = ${py(prompt)}
WANTED = ${py(model || '')}
OUT = "/kaggle/working/out.png"

# repo, pipeline class, steps, guidance, size
LADDER = [
    ("stabilityai/stable-diffusion-3.5-medium", "StableDiffusion3Pipeline", 28, 4.5, 1024),
    ("stabilityai/stable-diffusion-xl-base-1.0", "AutoPipelineForText2Image", 30, 7.0, 1024),
    ("stabilityai/sd-turbo", "AutoPipelineForText2Image", 4, 0.0, 512),
]
if WANTED:
    LADDER.sort(key=lambda row: 0 if WANTED in row[0] else 1)

img, used, last = None, None, None
for repo, cls, steps, guide, size in LADDER:
    try:
        print("loading", repo, flush=True)
        Pipe = getattr(diffusers, cls, None) or diffusers.DiffusionPipeline
        try:
            pipe = Pipe.from_pretrained(repo, torch_dtype=torch.bfloat16)
        except Exception:
            pipe = Pipe.from_pretrained(repo, torch_dtype=torch.float16)
        pipe.enable_model_cpu_offload()
        for fn in ("enable_vae_tiling", "enable_vae_slicing"):
            try: getattr(pipe.vae, fn)()
            except Exception: pass
        img = pipe(
            PROMPT,
            num_inference_steps=steps,
            guidance_scale=guide,
            height=size, width=size,
            generator=torch.Generator("cpu").manual_seed(1618),
        ).images[0]
        used = repo
        break
    except Exception as e:
        last = "%s: %s" % (repo, e)
        print("that one would not run \u2014", last, flush=True)

if img is None:
    sys.exit("No Stable Diffusion model would run. " + str(last))

img.save(OUT)
print("MODEL", used, flush=True)
print("WROTE", OUT, os.path.getsize(OUT), "bytes", flush=True)
`;
}
