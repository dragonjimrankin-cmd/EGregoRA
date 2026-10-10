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

PAY=$(mktemp)
ERR=$(mktemp)
trap 'rm -f "$PAY" "$ERR"' EXIT

# The branch head moves while we are working: the two deploy workflows fire on
# the same commit and each publishes several files, so a SHA read before the
# first write is stale by the second. The contents API answers that with 409,
# and because this script never fails the caller, three green steps once landed
# nothing at all — the EGregoRA deploy log and recorded version for a whole
# corpus commit simply vanished. So the SHA is re-read inside the retry, not
# once up front, and a conflict is the expected case rather than an error.
ATTEMPT=1
MAX=5
while [ "$ATTEMPT" -le "$MAX" ]; do
  SHA=$(gh api "repos/${REPO}/contents/${P}?ref=${REF}" -q .sha 2>/dev/null || true)

  if ! PAY_PATH="$P" PAY_MSG="$M" PAY_SHA="$SHA" PAY_FILE="$PAY" python3 -c '
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
'; then
    echo "  ! could not build a payload for $P"
    exit 0
  fi

  if gh api --method PUT "repos/${REPO}/contents/${P}" --input "$PAY" >/dev/null 2>"$ERR"; then
    echo "  published $P"
    exit 0
  fi

  if grep -q '409' "$ERR"; then
    echo "  … $P: branch moved under us, re-reading the sha (attempt $ATTEMPT of $MAX)"
    sleep $((ATTEMPT * 3))
    ATTEMPT=$((ATTEMPT + 1))
    continue
  fi

  echo "  ! could not publish $P: $(head -c 200 "$ERR" | tr -d '\n')"
  exit 0
done

echo "  ! could not publish $P after $MAX attempts; the branch kept moving"
