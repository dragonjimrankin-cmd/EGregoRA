# EGregoRA live patch

This directory contains credential-free, server-side fixes for the existing
EGregoRA Hatchable project. The deployment workflow writes these files into the
existing project; it does not replace or re-import the project's historical
credential-bearing bundle.

Current patch:

- `api/transcribe.js` adds the existing admin-only Free.ai doors as fallbacks
  for podcast transcription and listing generation when separate OpenAI or
  Hugging Face routes are unavailable.
- `api/media.js` formats transcripts as speaker turns, maps the two identified
  voices in the latest podcast, and stores compact linguistic cadence profiles.
- `migrations/0029_speaker_profiles.sql` keeps episode-to-speaker names and
  aggregate patterns. It stores no extra audio or reversible voiceprint.
- `public/assets/js/media-admin.js` emits one timestamp only when the inferred
  speaker changes, can transcribe an episode already on the shelf, and lets
  administrators change its purported creation date.
- `api/edit.js` and `public/assets/js/admin-edit.js` add a Date tab to Admin
  Edit Mode on every page. The claimed date is visible and updates metadata;
  real deployment and audit timestamps are preserved.
- `migrations/0030_purported_creation_dates.sql` stores page/media date claims
  separately and appends every change to an audit log. `pages/feed.js` uses a
  podcast episode's claimed date when one has been set. Every generated HTML
  page cache-busts the shared Admin Edit script so the Date tab is available
  throughout the site immediately.
- `migrations/0031_speaker_bootstrap.sql` and the guarded one-shot media action
  recover the latest named podcast transcript when the speech provider returns
  diarized segments, without exposing the admin passcode or creating a general
  public transcription proxy.
