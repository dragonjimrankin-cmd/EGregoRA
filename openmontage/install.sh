#!/usr/bin/env bash
# Install OpenMontage beside the order's own repository.
#
# OpenMontage is a local, agentic video-production system: Python tools,
# YAML pipeline manifests and Markdown skills, driven by an AI coding
# assistant and rendered through Remotion/FFmpeg. It is NOT a hosted
# service and has no API, so it cannot run inside the EGregoRA serverless
# functions. It runs on your machine. This script sets it up.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
vendor="$here/vendor/OpenMontage"

need() { command -v "$1" >/dev/null 2>&1 || { echo "MISSING: $1 — $2"; exit 1; }; }
need git    "install git"
need python3 "OpenMontage needs Python 3.10 or newer"
need node   "OpenMontage needs Node 18 or newer (Remotion)"
need ffmpeg "install FFmpeg and put it on PATH"

python3 - <<'PY'
import sys
assert sys.version_info[:2] >= (3, 10), "Python 3.10+ required, found %s" % sys.version.split()[0]
PY

if [ -d "$vendor/.git" ]; then
  echo "==> Updating OpenMontage"
  git -C "$vendor" pull --ff-only
else
  echo "==> Cloning OpenMontage (AGPL-3.0)"
  mkdir -p "$here/vendor"
  git clone --depth 1 https://github.com/calesthio/OpenMontage "$vendor"
fi

echo "==> make setup"
make -C "$vendor" setup

[ -f "$vendor/.env" ] || cp "$vendor/.env.example" "$vendor/.env"

echo
echo "OpenMontage is installed at: $vendor"
echo "Next:"
echo "  1. node $here/pull-clips.mjs --out $here/projects/first-cut   # fetch the order's clips"
echo "  2. open $vendor in Claude Code / Cursor / Codex / Copilot / Windsurf"
echo "  3. tell it: run the documentary-montage pipeline using"
echo "     $here/project-brief.md and the house skill in $here/skills/"
