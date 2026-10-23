# Vendored: freellmapi

- Upstream: https://github.com/tashfeenahmed/freellmapi
- Pinned commit: 26484157fd15f5fb66f54d3a86f568997ea304de (main, 23 Oct 2026)
- Licence: MIT (see LICENSE in this folder; copyright notice preserved)
- Copied with `.git`, `.claude/` and `.github/` left out. No `node_modules` included.

## Status

Vendored only. Not built, not deployed, and no site calls it yet.

## Open decisions (not yet made)

1. Where it runs: hosting for the gateway, since the sandbox cannot reach Hatchable.
2. Which sites call it: EGregoRA, TTI, or both, and through what base URL setting.
3. Public or private: upstream says "personal experimentation only". Exposing one pooled gateway to visitors needs a decision.
4. Provider terms: routing across free-tier provider keys can breach each provider's terms.
5. Keys: provider keys live only in the gateway's encrypted store or the host's secrets. Never in this repo or in chat.

## Updating

Re-copy from a newer upstream commit, record the new pin here, and review the diff first.
