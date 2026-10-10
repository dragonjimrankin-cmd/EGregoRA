#!/usr/bin/env bash
# Publish a file to the repository through the GitHub contents API.
#
#   scripts/ci-publish.sh <path> "<commit message>"
#
# CI steps cannot `git push` reliably — a push from a workflow step has
# repeatedly reported success and landed nothing — so writes go through the
# contents API instead.
#
# The payload is built by Python and handed to `gh` with --input. Neither step
# may carry the file through argv: a saved page of ~130 KB base64s to ~175 KB,
# which is past the argument limit, and passing it to `jq --arg` fails exactly
# the same way as passing it to `gh -f`. This cost several CI runs to find.
#
# Never fails the caller. Reports what it did.
set -u

P="${1:-}"
M="${2:-ci: publish $P}"

if [ -z "$P" ]; then
  echo "  usage: ci-publish.sh <path> <message>" >&2
  exit 0
fi
if [ ! -f "$P" ]; then
  echo "  nothing to publish at $P"
  exit 0
fi
if [ -z "${GH_TOKEN:-}" ]; then
  echo "  ! GH_TOKEN is not set; cannot publish $P"
  exit 0
fi

REPO="${GITHUB_REPOSITORY:-}"
REF="${GITHUB_REF_NAME:-}"
if [ -z "$REPO" ] || [ -z "$REF" ]; then
  echo "  ! GITHUB_REPOSITORY / GITHUB_REF_NAME are not set; cannot publish $P"
  exit 0
fi

SHA=$(gh api "repos/${REPO}/contents/${P}?ref=${REF}" -q .sha 2>/dev/null || true)
PAY=$(mktemp)
trap 'rm -f "$PAY"' EXIT

PAY_PATH="$P" PAY_MSG="$M" PAY_SHA="$SHA" PAY_FILE="$PAY" python3 -c '
import base64, json, os
body = {
    "message": os.environ["PAY_MSG"],
    "content": base64.b64encode(open(os.environ["PAY_PATH"], "rb").read()).decode(),
    "branch": os.environ["GITHUB_REF_NAME"],
}
if os.environ.get("PAY_SHA"):
    body["sha"] = os.environ["PAY_SHA"]
with open(os.environ["PAY_FILE"], "w") as fh:
    json.dump(body, fh)
' || { echo "  ! could not build a payload for $P"; exit 0; }

if gh api --method PUT "repos/${REPO}/contents/${P}" --input "$PAY" >/dev/null 2>&1; then
  echo "  published $P"
else
  echo "  ! could not publish $P"
fi
