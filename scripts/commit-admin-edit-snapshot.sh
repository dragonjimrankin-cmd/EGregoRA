#!/usr/bin/env bash
set -euo pipefail

SITE="${1:-}"
ENDPOINT="${2:-}"
SNAPSHOT="${3:-}"
BRANCH="${4:-}"
MODE="${5:-check}"

if [[ -z "$SITE" || -z "$ENDPOINT" || -z "$SNAPSHOT" || -z "$BRANCH" ]]; then
  echo "usage: commit-admin-edit-snapshot <site> <endpoint> <snapshot> <branch> [refresh|check]" >&2
  exit 2
fi
if [[ "$BRANCH" != "arena/c016ca5c-egregora" ]]; then
  echo "refusing to commit Admin Edit state outside arena/c016ca5c-egregora" >&2
  exit 2
fi

REMOTE_REF="refs/remotes/origin/$BRANCH"
git fetch --no-tags origin "refs/heads/$BRANCH:$REMOTE_REF"
LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse "$REMOTE_REF")"

if [[ "$MODE" == "refresh" && "$LOCAL_SHA" != "$REMOTE_SHA" ]]; then
  if git merge-base --is-ancestor "$LOCAL_SHA" "$REMOTE_SHA"; then
    echo "$SITE: advancing this deployment checkout to the latest branch commit $REMOTE_SHA."
    git checkout --detach "$REMOTE_SHA"
    LOCAL_SHA="$REMOTE_SHA"
  else
    echo "$SITE: branch history diverged while preparing the deployment; no deployment will run." >&2
    exit 1
  fi
elif [[ "$MODE" != "refresh" && "$LOCAL_SHA" != "$REMOTE_SHA" ]]; then
  echo "$SITE: the branch advanced after validation; a newer workflow must deploy it." >&2
  exit 1
fi

node scripts/sync-admin-edit-snapshot.mjs \
  --site "$SITE" \
  --endpoint "$ENDPOINT" \
  --output "$SNAPSHOT" \
  --allow-missing-empty

git diff --check -- "$SNAPSHOT"
if ! git diff --quiet -- "$SNAPSHOT"; then
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  git add -- "$SNAPSHOT"
  git commit --only "$SNAPSHOT" \
    -m "Commit $SITE Admin Edit changes before deployment [skip ci]"
  git push origin "HEAD:refs/heads/$BRANCH"
  echo "$SITE: Admin Edit state committed and pushed before deployment."
else
  echo "$SITE: no uncommitted Admin Edit state."
fi

CURRENT_SHA="$(git rev-parse HEAD)"
if [[ -n "${GITHUB_ENV:-}" ]]; then
  echo "ADMIN_COMMIT_SHA=$CURRENT_SHA" >> "$GITHUB_ENV"
fi
printf '%s\n' "$CURRENT_SHA"
