# EGregoRA live patch

This directory contains credential-free, server-side fixes for the existing
EGregoRA Hatchable project. The deployment workflow writes these files into the
existing project; it does not replace or re-import the project's historical
credential-bearing bundle.

Current patch:

- `api/transcribe.js` adds the existing admin-only Free.ai doors as fallbacks
  for podcast transcription and listing generation when separate OpenAI or
  Hugging Face routes are unavailable.
