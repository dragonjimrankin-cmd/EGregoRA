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

export function videoScript({ prompt, aspect = '16:9', frames = 121 }) {
  const [w, h] = aspect === '9:16' ? [480, 848] : [848, 480];
  return `# EGregoRA — HunyuanVideo 1.5, 480p, written by the order's oracle.
import subprocess, sys, os, traceback

def pip(*a):
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", *a], check=False)

pip("--upgrade", "diffusers>=0.36.0", "transformers>=4.49", "accelerate", "safetensors", "imageio", "imageio-ffmpeg", "sentencepiece", "ftfy")

import torch
print("torch", torch.__version__, "cuda", torch.cuda.is_available(), flush=True)
if not torch.cuda.is_available():
    # 8.3B parameters on a CPU would still be running next week. Stop here so
    # the order is told the truth instead of waiting twelve hours for nothing.
    sys.exit("NO GPU: Kaggle gave this notebook a CPU-only machine. Accelerators "
             "need a phone-verified Kaggle account and remaining weekly quota.")
print("device:", torch.cuda.get_device_name(0), flush=True)

PROMPT = ${py(prompt)}
WIDTH, HEIGHT, FRAMES = ${w}, ${h}, ${frames}
OUT = "/kaggle/working/out.mp4"

try:
    from diffusers import HunyuanVideo15Pipeline
    pipe = HunyuanVideo15Pipeline.from_pretrained(
        "tencent/HunyuanVideo-1.5",
        torch_dtype=torch.bfloat16,
    )
except Exception as e:
    print("HunyuanVideo 1.5 pipeline unavailable:", e, flush=True)
    traceback.print_exc()
    # A 16 GB T4 cannot hold the 8.3B model without aggressive offloading; if
    # the dedicated pipeline is missing from this diffusers build, fall back
    # to the generic auto pipeline rather than failing silently.
    from diffusers import DiffusionPipeline
    pipe = DiffusionPipeline.from_pretrained(
        "tencent/HunyuanVideo-1.5", torch_dtype=torch.bfloat16, trust_remote_code=True
    )

pipe.enable_model_cpu_offload()
try:
    pipe.vae.enable_tiling()
    pipe.vae.enable_slicing()
except Exception:
    pass

g = torch.Generator(device="cpu").manual_seed(1618)
result = pipe(
    prompt=PROMPT,
    height=HEIGHT, width=WIDTH,
    num_frames=FRAMES,
    num_inference_steps=28,
    guidance_scale=6.0,
    generator=g,
)
frames_out = result.frames[0]

from diffusers.utils import export_to_video
export_to_video(frames_out, OUT, fps=24)
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
