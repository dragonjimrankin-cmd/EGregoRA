# Avatar neural voices

## Decision

ShakDrah and Gink now have an explicit, optional **Natural voice** mode built on:

- [HeadTTS 1.3.0](https://github.com/met4citizen/HeadTTS) (MIT), which adds phoneme timestamps and Oculus visemes;
- [Kokoro 82M v1.0 ONNX, timestamped](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped) (Apache-2.0 model), a compact open neural TTS model;
- [Transformers.js 4.3.1](https://github.com/huggingface/transformers.js) (Apache-2.0), running with WebGPU/fp32 where available and WASM/q4 as the fallback.

The model executes in a module worker in the visitor's browser. The answer text does not go to a speech API. On first use, the browser still has to fetch the public runtime, model and selected voice files. Depending on the backend and quantisation, that is roughly 100–350 MB. Browser caching normally avoids repeating it.

The existing Web Speech implementation remains an immediate progressive fallback. No model is loaded merely by visiting the page. The neural download begins only when the visitor selects **Natural voice**, or later asks an avatar to speak after having selected and remembered that preference.

## Why this route

HeadTTS was chosen over using Kokoro.js directly because these avatars need more than audio. Its timestamped Kokoro graph returns word and phoneme/viseme timings, so jaw shapes follow the generated sound rather than estimated spelling. It also already isolates inference in a worker and supports WebGPU with WASM fallback.

Other researched routes were not selected as the primary implementation:

- ElevenLabs, Azure Neural Speech and Google Cloud TTS can be excellent, but require a billed service/key and send answer text off-device. A browser must never receive a secret server key.
- Raw Kokoro.js is simpler and streams well, but does not expose the same ready-to-use timestamped viseme contract.
- Piper and eSpeak-derived browser engines are smaller or mature but generally less natural for these long, reflective answers.
- Native Web Speech has almost no download cost and remains valuable, but quality and boundary events vary sharply by operating system and installed voices.

## Character direction and prosody

Kokoro does not accept free-form acting prompts or SSML. Pretending otherwise would have no effect. The useful controls are voice embedding, speed, punctuation, breaks and phonetic/text preparation, so the implementation uses all of those:

| Character | Kokoro voice | Speed | Direction |
| --- | --- | ---: | --- |
| ShakDrah | `bm_george` | 0.91 | older British keeper; longer explicit pauses and gently weighted low register |
| Gink | `bm_fable` | 1.00 | lighter British familiar; shorter explicit pauses and restrained presence lift |

The spoken-only preparation layer:

- retains sentence punctuation for model prosody;
- turns grading beats into real timed silence;
- expands common LaTeX and mathematical operators;
- stabilises unusual names such as ShakDrah, EGregoRA and Möbius;
- strips URLs, Markdown delimiters and code fences that sound poor aloud;
- leaves the written answer entirely unchanged.

The native fallback independently ranks installed voices, preferring British voices marked natural, neural, premium, enhanced or studio; then known masculine names; and rejecting novelty voices. Its rate and pitch are character-specific rather than shared.

Each neural performance now passes through a deliberately mild local Web Audio chain: low-shelf and presence shaping specific to the character, followed by gentle compression to reduce sentence-to-sentence level jumps. This is mastering rather than a synthetic effect. Explicit dramatic pauses are also character-scaled. The visual rigs consume four articulation channels—jaw opening, lateral spread, rounding and bilabial pressure—so an O/U or M/B/P no longer looks like a generic jaw flap.

## Visual model refinements

Both procedural Three.js sculpts use stable seeded surface detail, bump-mapped materials, modeled nostril apertures with breathing motion, micro-saccades and four-channel articulation. Gink retains layered shell fur and now has fox-specific pupil dilation and muzzle compression. ShakDrah no longer wears the copied fox fur treatment over his hide: his scale relief stays crisp, his tail is scaled rather than cream-tipped, his pupil is a narrow reptilian slit, and his throat scutes, frills, wings and crest participate in the living rig. Desktop rendering keeps full shadows and up to a 2× pixel ratio; constrained mobile GPUs use a lighter budget, and hidden pages do not keep rendering.

## Privacy, failure and controls

- Neural mode is opt-in and its large first download is disclosed beside each avatar.
- Download progress, local generation, playback, completion and fallback states use the existing live status line.
- A failed model/runtime/voice fetch falls back to the best installed voice without losing the answer.
- Silence/cancel invalidates stale callbacks and clears native, neural and lip-sync queues.
- Pause/resume records the exact Web Audio offset for neural playback.
- Hidden pages stop speech.
- The model may remain in browser site/cache storage. Visitors can remove it with their browser's clear-site-data controls.
- No API key, passcode, answer or voice biometric is introduced or retained by this feature.

## Vendoring and updates

The small browser modules, US-English pronunciation dictionary, licences and Transformers.js loader are vendored under both sites' `assets/js/headtts/` directories. Model weights and ONNX runtime binaries are deliberately not in Git.

Pinned development packages and the synchronisation command are:

```sh
npm ci
npm run sync:neural-voice
node scripts/test-neural-voice.mjs
```

`.npmrc` disables install scripts because the transitive Node ONNX package otherwise downloads a roughly 280 MB native server binary that neither static site uses. Browser inference still works through Transformers.js and its browser runtime.
