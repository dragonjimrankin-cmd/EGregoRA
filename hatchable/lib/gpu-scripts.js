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

export function imageScript({ prompt }) {
  return `# EGregoRA — FLUX.1-schnell on Kaggle's GPU.
import subprocess, sys, os

def pip(*a):
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", *a], check=False)

pip("--upgrade", "diffusers>=0.31.0", "transformers>=4.44", "accelerate", "safetensors", "sentencepiece", "protobuf")

import torch
if not torch.cuda.is_available():
    sys.exit("NO GPU: Kaggle gave this notebook a CPU-only machine. Accelerators "
             "need a phone-verified Kaggle account and remaining weekly quota.")
print("device:", torch.cuda.get_device_name(0), flush=True)
from diffusers import FluxPipeline

PROMPT = ${py(prompt)}
OUT = "/kaggle/working/out.png"

pipe = FluxPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-schnell", torch_dtype=torch.bfloat16
)
pipe.enable_model_cpu_offload()
try:
    pipe.vae.enable_tiling()
    pipe.vae.enable_slicing()
except Exception:
    pass

img = pipe(
    PROMPT,
    guidance_scale=0.0,
    num_inference_steps=4,
    max_sequence_length=256,
    height=1024, width=1024,
    generator=torch.Generator("cpu").manual_seed(1618),
).images[0]
img.save(OUT)
print("WROTE", OUT, os.path.getsize(OUT), "bytes", flush=True)
`;
}
