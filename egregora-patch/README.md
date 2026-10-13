# EGregoRA live patch

This directory contains credential-free, server-side fixes for the existing
EGregoRA Hatchable project. The deployment workflow writes these files into the
existing project; it does not replace or re-import the project's historical
credential-bearing bundle.

Current patch:

- `public/infographics/index.html`, `public/assets/css/infographics-accordion.css`, and
  `public/assets/js/infographics-accordion.js` place all 111 drawings inside thirteen
  numbered, keyboard-operable source sections. The shared native disclosure name
  and JavaScript fallback allow only one section to remain open; stable hash links,
  Escape dismissal, mobile layout and reduced-motion behaviour mirror TTI&rsquo;s
  Plates room without changing EGregoRA&rsquo;s historical shared stylesheet.
- `public/assets/js/oracle-knowledge.js` updates both Gink and ShakDrah with nineteen
  substantial prepared answers covering The Channeling Circle review, one Prime
  role per universe-instance, the one residue, the universe-as-Möbius-seam model,
  matter–antimatter phase relations, baryogenesis limits and Prime Plane base
  shifts. Matching questions are answered locally and exactly; attached or
  unrelated questions still pass to the existing oracle unchanged.
- `public/assets/js/private-whisper/browser-whisper.js` supplies a separate,
  site-hosted BrowserWhisper application. Whisper Base, decoding and inference
  run in background workers on the administrator's device; the model is fetched
  once and cached in private browser storage, while episode audio is never sent
  to a speech-to-text API. The completed transcript alone returns to EGregoRA
  for its summary and eventual episode storage. The pinned package, sync script,
  licences and regression test keep this vendored application reproducible.
- `api/transcribe.js` retains the admin-only transcript-to-listing route. Its
  description action now uses the same model stack as the Gink and ShakDrah
  avatars, in the same provider order, and honours the administrator's shared
  Free.ai chat-model and door selection. Its older server hearing action
  remains compatible with staged data, but the podcast interface no longer
  calls it or silently falls back to a cloud or microphone transcription
  service.
- `api/media.js` formats transcripts as speaker turns, maps the two identified
  voices in the latest podcast, and stores compact linguistic cadence profiles.
- `migrations/0029_speaker_profiles.sql` keeps episode-to-speaker names and
  aggregate patterns. It stores no extra audio or reversible voiceprint.
- `public/assets/js/media-admin.js` streams bounded segments from private local
  Whisper Base, emits one timestamp only when the provisional speaker changes,
  can transcribe an episode already on the shelf, and lets administrators
  change its purported creation date.
- `api/edit.js` and `public/assets/js/admin-edit.js` add a Date tab to Admin
  Edit Mode on every page. The claimed date is visible and updates metadata;
  real deployment and audit timestamps are preserved.
- `api/admin-commit.js` exports only the effective public Admin Edit state.
  Both deployment workflows serialise access to the shared branch, snapshot
  that state into each project bundle, create and push a real Git commit when
  it changed, and recheck immediately before deployment. A deployment therefore
  uses the post-commit SHA rather than leaving live editor changes outside the
  repository. The browser tells administrators that publish, undo, redo,
  source and date changes are queued for this automatic commit.
- `migrations/0030_purported_creation_dates.sql` stores page/media date claims
  separately and appends every change to an audit log. `pages/feed.js` uses a
  podcast episode's claimed date when one has been set. Every generated HTML
  page cache-busts the shared Admin Edit script so the Date tab is available
  throughout the site immediately.
- `migrations/0031_speaker_bootstrap.sql` and
  `migrations/0032_speaker_inference_fallback.sql` retain the historical
  one-shot recovery markers, but deployment no longer invokes cloud hearing.
  `migrations/0035_latest_podcast_speaker_map.sql` applies the administrators'
  explicit declaration to the one currently latest published episode: Speaker
  1 is Edward Gregory and Speaker 2 is Jim Rankin. If that episode has no
  transcript, it remains pending until an administrator runs private local
  Whisper on their own device.
- `migrations/0033_consenting_voiceprints.sql`,
  `migrations/0034_extensible_voiceprints.sql`, `public/assets/js/voiceprint.js`,
  and the podcast editor add explicit-consent biometric voiceprints. Every
  authenticated audio/transcript path checks Edward Gregory and Jim Rankin in
  particular, then every further enrolled person. Feature extraction,
  all-template comparison and one-to-one assignment run in the admin's browser;
  low-score or low-margin comparisons abstain instead of guessing. Only
  passcode-derived AES-GCM ciphertext is stored, raw enrollment audio is
  discarded, templates are revocable and the feature is technically excluded
  from login or access control.
- Transcription now has visible, accessible progress bars in both the new-upload
  workflow and each existing episode editor. Private-model download/cache,
  local decoding, worker transcription, turn consolidation, transcript saving,
  known-name restoration and voiceprint checks each report their stage and
  measured percentage. During any quiet stage, `progress-live.js` adds a
  once-per-second elapsed-time heartbeat, an animated sheen and explicit
  “still working” text after four seconds rather than leaving one percentage
  looking frozen; reduced-motion users retain the textual heartbeat without
  animation. Failures remain visible instead of silently clearing the bar.
  The main podcast button performs the whole transcript-to-summary sequence in
  one click, shows a prominent “busy—do not click again or close the page”
  notice beside its dedicated progress bar, and highlights the completed
  summary for review.
