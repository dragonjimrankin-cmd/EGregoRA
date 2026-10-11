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
  speaker changes; the podcast HTML cache-busts that browser update.
