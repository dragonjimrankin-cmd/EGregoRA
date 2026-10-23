# Vendored: freellmapi

- Upstream: https://github.com/tashfeenahmed/freellmapi
- Pinned commit: 26484157fd15f5fb66f54d3a86f568997ea304de (main, 23 Oct 2026)
- Licence: MIT (see LICENSE in this folder; copyright notice preserved)
- Copied with `.git`, `.claude/` and `.github/` left out. No `node_modules` included.

## Status

Vendored only. Not built, not deployed, and no site calls it yet.

## Decisions so far

- Host: the owner's own server.
- Callers: EGregoRA and TTI, server-side only.
- Access: private (sites and owner only).

See `arena/README.md` for the setup and the open conflict with upstream's no-internet-exposure advice.

## Still open

1. Upstream says it must not be exposed to the internet; the setup needs a TLS proxy and token check. Confirm.
2. Provider terms for free-tier pooling.
3. TTI's Hatchable project is frozen; its gateway settings need the owner to unfreeze it.
4. Provider keys stay in the gateway's encrypted store or server secrets, never in the repo or chat.

## Updating

Re-copy from a newer upstream commit, record the new pin here, and review the diff first.
