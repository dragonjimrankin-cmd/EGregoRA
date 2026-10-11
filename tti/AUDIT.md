# TTI Site Audit

**Project:** The Shape of Becoming: Infinity, Gravity and Existence  
**Tagline:** A Geometry of the Cosmos  
**Revision:** r3.6  
**Audit date:** 11 October 2026

## Scope

The audit covers all generated TTI documents, shared metadata, local navigation, fragments, structured data, discovery files, the visual plate room, the prepared ShakDrah corpus, and deployment smoke checks.

Run the complete local audit with:

```sh
npm run audit:tti
```

The command performs two Eleventy builds around deterministic plate gathering, validates every generated HTML document, runs the custom site audit, and tests the prepared browser-side knowledge corpus.

## Current audited result

- 22 HTML documents built.
- 22 unique canonical URLs verified.
- Exact project title and tagline verified in the homepage, masthead, metadata and manifest.
- Every local document, asset and fragment link verified.
- JSON-LD parsed on every HTML page.
- Nested breadcrumbs verified for the Zero-Seam research proposal.
- `sitemap.xml`, Atom `feed.xml`, `robots.txt` and the SVG favicon verified.
- 27 source plates reconciled with 27 gathered plates; SVG IDs and marker references are namespaced in the compendium.
- The research proposal is discoverable from the homepage, parent conjecture, Essays, Stress Tests, Time and Residue, and Inverted Tori.
- 18 prepared answers and 18 paraphrase routes verified for both ShakDrah and Gink, including fallback and attachment bypass.
- Six male neural voices, per-voice dispatch, prosody, consent and lip-sync metadata remain covered by the existing neural-voice test.
- Workflow YAML and focused Hatchable build markers are validated before deployment.

## Findings repaired in r3.6

1. The plate room still contained 20 older figures and omitted recent standalone essays and all three Little Red Dots diagrams. It is now generated deterministically from the built source and contains all 27 source plates.
2. The shared layout advertised a feed that did not exist. A valid Atom feed and sitemap are now built.
3. `robots.txt` pointed to the EGregoRA host rather than the TTI host. It now names the correct sitemap.
4. The shared SVG favicon reference had no corresponding file. A local torus mark is now present.
5. One display equation used a raw `<` that could break strict HTML tokenisation. It is encoded correctly.
6. Several metadata titles exceeded the audit limit. They now remain descriptive while staying concise.
7. The Zero-Seam proposal was not represented across the homepage, Foundations, Time and Residue, Inverted Tori, Stress Tests, the plate room or prepared avatar knowledge. Those reciprocal links and epistemic boundaries are now present.
8. The proposal page previously had a flat breadcrumb. It now records the parent Little Red Dots conjecture.
9. Site revision text was partly hard-coded. The masthead now reads the shared `site.revision` value.

## Boundaries of this audit

The local audit does not claim that the TTI physics is correct, that a previous universe exists, or that the negative interval is a physical domain. It checks the site’s internal integrity and whether those claims retain their declared speculative status.

External scientific links are preserved but are not treated as automatically valid forever. The deployment workflow separately verifies selected live pages after Hatchable publishes them. Visual and audible quality still require human inspection even when markup, voice routing and timing metadata pass automated tests.
