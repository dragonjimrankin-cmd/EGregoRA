# EGregoRA — Life, Love, Magic

An ornate static website for **EGregoRA**, the order of enquiry co-founded by **Edward Gregory** and **Jim Rankin**:
cosmic physics, natural philosophy, astrology, nature, druids, trees, sacred geometry, magic,
the historical study of fascist occultism, wizards, reality, the contact question, neuroscience,
biology, psychology, astronomy, God, the Law of One and hallucinogenic meditation.

Built with [Eleventy 3](https://www.11ty.dev/) — no framework, no tracking, no build-time magic
you cannot read in an afternoon. It is a pile of HTML, CSS and ~60 lines of JavaScript, which is
why it will still work in ten years.

## Pages

| Page | Path | Purpose |
| --- | --- | --- |
| Introduction | `/` | The charter, the ten limbs of enquiry, the co-founders |
| Podcast | `/podcast/` | Episode list + RSS feed at `/feed.xml` |
| Videos | `/videos/` | Embedded films with ornate placeholders |
| Ask Ed a Question | `/ask-ed/` | Question form + the already-answered pile |
| Infographics | `/infographics/` | Four hand-drawn live SVG plates |
| Music | `/music/` | Drone / modal / seasonal releases with players |
| Products | `/products/` | The shop: codex, charts, deck, journal, solids, membership |
| Further Research | `/research/` | Annotated bibliography, graded by evidential weight |

## Running it

```bash
npm install
npm run dev     # http://localhost:8080, live reload
npm run build   # static output into _site/
npm run lint    # html-validate across the built site
```

## Adding content (no code required)

Everything that changes regularly lives in **`src/_data/*.json`**. Edit the JSON, commit, push.

- **New podcast episode** — drop the MP3 in `src/assets/audio/`, add an object to
  `src/_data/episodes.json` with `number`, `title`, `date`, `duration`, `summary`, `audio`, `tags`.
  The RSS feed updates itself.
- **New video** — add to `src/_data/videos.json` with an `embed` URL
  (`https://www.youtube-nocookie.com/embed/ID` or `https://player.vimeo.com/video/ID`).
  Leave `embed` empty and an ornate placeholder holds the slot.
- **New track** — `src/_data/music.json`, same pattern as episodes.
- **New product** — `src/_data/products.json`; photo into `src/assets/img/`.
  Swap the mailto link in `src/products.njk` for a Stripe Payment Link / Gumroad / Shopify
  button to take real payments on a static host.
- **New infographic** — add a `<figure class="frame">` to `src/infographics.njk`. SVG preferred:
  infinitely sharp, tiny, and its text is searchable and screen-readable.
- **The question form** — `src/ask-ed.njk` posts to Formspree. Replace `your-form-id` with your
  own endpoint (Formspree, Basin, Netlify Forms and Tally all work unchanged).

## Design notes

- **Palette** — midnight vellum, oxidised gold leaf, druid verdant, amethyst, rose.
- **Type** — Cinzel Decorative (display), Cinzel (titles), Cormorant Unicase (small caps),
  EB Garamond (body). Illuminated drop-caps via `:first-letter`.
- **Ornament** — all sigils are inline SVG shortcodes (`{% glyph "metatron" %}`) defined in
  `eleventy.config.js`: seed of life, Metatron's cube, world tree, the eye, the spiral, the star.
- **Motion** — a canvas starfield, slow-rotating mandalas and IntersectionObserver reveals,
  all fully disabled under `prefers-reduced-motion`.
- **Accessibility** — skip link, semantic landmarks, `aria-current` navigation, labelled form
  controls, focus rings retained, and the whole site passes `html-validate:recommended`.

## Editorial position

EGregoRA holds the esoteric and the empirical in the same hand without pretending they are the
same thing. The research page grades every source — ◆ established science, ◆ scholarship,
◆ speculative, ◆ myth — so a reader always knows what they are holding.

The **Shadow Cabinet** section studies the Nazi appropriation of myth, runes and pseudo-science
strictly as historical pathology and warning. Nothing on this site romanticises fascism; the
bibliography pairs every work on occult history with Levi, Arendt and Eco.

## Deployment

`.github/workflows/deploy.yml` builds and publishes `_site/` to GitHub Pages on every push to
`main` (enable Pages → Source: GitHub Actions). The output is plain static files, so Netlify,
Cloudflare Pages and Vercel work identically — build `npm run build`, publish `_site`.

---

© EGregoRA · *Life, Love, Magic* · Co-founded by Edward Gregory and Jim Rankin
