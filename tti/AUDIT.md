# TTI Site Audit

**Project:** The Two Infinities: Eternal Integration of the Self
**Tagline:** A speculative cosmology by Jim Rankin, UK, 2026
**Revision:** r4.12
**Audit date:** 13 October 2026

## Scope

The audit covers all generated TTI documents, shared metadata, local navigation, fragments, structured data, discovery files, the interactive Atlas and its written fallback, the visual plate room, the prepared ShakDrah corpus, and deployment smoke checks.

Run the complete local audit with:

```sh
npm run audit:tti
```

The command performs two Eleventy builds around deterministic plate gathering, validates every generated HTML document, tests the five-Part masthead and matching research labels, the five-path Atlas, the canonical twenty-nine-entry project contents, per-document records and outline shells, the exclusive plate accordion, the custom site audit, and the prepared browser-side knowledge corpus. It also treats the twenty-five Part I–IV documents as the research essays and rejects any essay outside 2,000–4,000 readable words.

## Admin Edit commits in r4.12

- Added the same read-only `/api/admin-commit` endpoint to EGregoRA and TTI. It exports a deterministic digest of effective live operations, saved page sources and purported dates, while excluding passcodes, prompts, administrator identities and audit notes.
- Added versioned snapshots at `egregora-patch/public/admin-edits.snapshot.json` and `tti/src/static/admin-edits.snapshot.json`; each is also included in the corresponding deployment bundle.
- Both deployment workflows now share one non-cancelling concurrency group, fetch the latest branch head, compare the live state with the versioned snapshot, and create and push a real Git commit whenever Admin Edit state changed.
- The workflows perform the comparison once before validation and again immediately before deployment, use the resulting commit SHA for server-side file imports, and refuse to deploy if the branch advances unexpectedly.
- Admin Edit Mode now tells administrators that publish, undo, redo, whole-source and purported-date changes are queued for an automatic Git commit before the next deployment.
- Added `scripts/test-admin-edit-commit.mjs`, including a local endpoint fixture, digest validation, idempotence checks, endpoint privacy checks and workflow-ordering regressions for both sites.

## Accessible research essays in r4.11

- Kept the project&rsquo;s essay scope explicit: all twenty-five research documents in Parts I–IV are essays; Part V&rsquo;s Plates, Ask ShakDrah, Join and Account remain functional project resources.
- Expanded the twelve papers that were below 2,000 words with substantive, plain-language routes through their mathematics, physical claims, analogies, assumptions, null models and conditions for failure.
- Preserved the thirteen papers already in range, apart from tightening two redundant passages in `TTI-III.06` so the longest paper remains below the upper boundary under the automated count.
- Kept exact mathematics separate from speculative promotion throughout: theorem, coordinate model, physical mechanism, philosophical interpretation and visionary reading remain visibly graded.
- Added a complete regression to `scripts/audit-tti.mjs`. It derives the essay set from canonical Parts I–IV, excludes repeated project navigation and inaccessible SVG labels, enforces 2,000–4,000 words, and requires stable section headings, a plain-language lede, readable paragraph lengths and evidence-grade markers.
- Created and integrity-tested the pre-expansion archive `tti-site-2026-10-13-44111ea-before-accessible-essays.zip`; SHA-256 `481f3faefedfe8cb05caff5af5de19f94aa16cc1af7bd5767745a71d3f5089a9`. The ZIP and checksum sidecar were uploaded to the Google Drive folder `baks` before essay changes began.

| Part | Document | Audited words |
|---|---|---:|
| I | TTI-I.01 · Foundations | 2,238 |
| I | TTI-I.02 · π from 0 and 1 | 2,102 |
| I | TTI-I.03 · The Self | 2,005 |
| I | TTI-I.04 · The Differential | 2,268 |
| I | TTI-I.05 · Prime Plane | 2,081 |
| II | TTI-II.01 · Gravity | 2,034 |
| II | TTI-II.02 · Spiral | 2,118 |
| II | TTI-II.03 · Skeletal Splice | 3,564 |
| II | TTI-II.04 · Torus | 2,040 |
| II | TTI-II.05 · Megatubule | 2,231 |
| III | TTI-III.01 · Möbius | 3,250 |
| III | TTI-III.02 · Cosmic Ledger | 2,216 |
| III | TTI-III.03 · Seams | 2,057 |
| III | TTI-III.04 · Entropy | 2,094 |
| III | TTI-III.05 · Temporal Antipodes | 2,077 |
| III | TTI-III.06 · Time and Residue | 3,978 |
| III | TTI-III.07 · Inverted-Torus Universe | 2,339 |
| III | TTI-III.08 · Wormholes | 2,222 |
| III | TTI-III.09 · Matter and Antimatter Out of Phase | 2,427 |
| IV | TTI-IV.01 · Stress Tests | 2,141 |
| IV | TTI-IV.02 · Essays | 3,152 |
| IV | TTI-IV.03 · Double Inversion | 2,044 |
| IV | TTI-IV.04 · Accumulated Differentials | 2,047 |
| IV | TTI-IV.05 · Little Red Dots | 2,851 |
| IV | TTI-IV.06 · Zero-Seam Research Programme | 2,134 |

## π from 0 and 1 in r4.10

- Added **Why π Appears Between Zero and One** to Part I as mathematical note `TTI-I.02`, between Foundations and The Self.
- Replaced the compressed claim that 0 and 1 simply produce π with the exact dependency: a unit continuum, Euclidean metric and circular closure are additional declared premises.
- Centred Euler&rsquo;s beta-integral theorem, \(B(\tfrac12,\tfrac12)=\int_0^1[x(1-x)]^{-1/2}dx=\pi\), and opened it by substitution into the unit-semicircle arc-length integral.
- Added the arcsine normalisation, fundamental-theorem/arctangent route, Gregory&ndash;Leibniz series and Euler&rsquo;s Basel theorem as exact but assumption-distinct checks.
- Added an explicit non-Euclidean objection and an earned/chosen/refused ledger so the theorem does not masquerade as proof of TTI cosmology.
- Added one accessible vector plate, reciprocal Foundations and homepage discovery, sitemap and Atom entries, a twenty-fourth prepared ShakDrah/Gink answer, and deterministic local/live deployment checks.
- Advanced the research corpus to twenty-five studies plus four project resources while keeping all five top-level Parts unchanged.

## Research-project edition in r4.9

- Reorganised the introduction as an independent working research project with a formal abstract, research question, method, status statement, project record and evidence key.
- Added a canonical **Project Table of Contents** listing all five Parts and all twenty-eight documents with stable `TTI-Part.Sequence` codes, document types, research statuses and concise aims.
- Made the header, project contents, interactive Atlas, per-document context and footer citations consume the same authoritative data so titles, Part labels and order cannot drift.
- Added a compact research record to every built document with its code, type, status, corpus position, previous/next reading and a complete five-Part contents drawer.
- Added a progressively enhanced **In this document** outline generated from each paper’s section headings, preserving existing fragment identifiers and assigning stable collision-safe identifiers where needed.
- Reframed masthead, introduction, footer, figure register and selected page language around working papers, competing models, open derivations and failure conditions without claiming peer review.
- Retained the exact project title, exact Jim Rankin attribution line, five-Part hierarchy, expandable navigation, all existing papers and resources, the interactive Atlas, plate accordion and avatar functions.
- Corrected the Hatchable project-level name and description so the platform listing identifies **The Two Infinities** as an independent research project founded by **Jim Rankin**, rather than inheriting EGregoRA metadata.
- Made project descriptions and deployment records configurable in the shared deployer, with EGregoRA defaults preserved, metadata updates acknowledged by Hatchable and the existing project read back before each deployment.

## Wormholes and inverted tori in r4.8

- Added **Wormholes and Inverted Tori** to Part III — Seams and Return as a new standalone page at `/wormholes/`.
- Distinguished a torus surface, an orientation-reversing mapping torus and a Lorentzian wormhole instead of treating seam, portal and throat as synonyms.
- Carried the proposal through the Morris–Thorne metric, flare-out and null-energy conditions, Einstein–Rosen non-traversability, thin-shell junction bookkeeping, two-crossing holonomy, chronology, topological censorship and six gates for a physical model.
- Added one accessible vector plate contrasting global mapping-torus return with a local two-mouth throat.
- Relabelled the existing Part III destination as **Inverted-Torus Universe**, inserted the new page as III·viii and advanced **Matter and Antimatter Out of Phase** to III·ix; the five top-level Parts remain unchanged.
- Integrated reciprocal discovery through the introduction, Torus, Möbius, Seams, the inverted-torus essay, Essays and Stress Tests.
- Added a twenty-third prepared ShakDrah/Gink answer and paraphrase route while preserving the same browser-side knowledge corpus for both avatars.
- Extended the Atlas, header, Plates, sitemap, Atom feed, audit and both deployment workflows to cover the page and its failure conditions.

## Expanding header links in r4.7

- Kept the five-Part desktop rail compact at rest while allowing a hovered, keyboard-focused or open Part heading to wrap to its full text instead of retaining an ellipsis.
- Made each hovered or keyboard-focused page destination expand vertically so its complete explanatory note is visible without clipping.
- Made Part headings and destination notes wrap in the touch navigation, where hover is unavailable.
- Allowed a signed-in account chip to reveal a long member label on hover or keyboard focus without an ellipsis.
- Added header regression checks and live CSS deployment markers for the expansion behaviour.

## Interlinked core claims in r4.6

- Added an ordered ten-claim account to the introduction, covering the two infinities, closure through π, the complex plane, wavefunction realism, the integral self, time, mass and gravity, toroidal/Möbius return, the Cosmic Ledger and empirical failure surfaces.
- Each claim now states what earlier proposition it depends on and what later part of the framework it supplies.
- Added a compact dependency equation and six-branch written map separating the foundational spine, integration, asymmetry, topology, cosmological synthesis and empirical terminus.
- Preserved the distinction between established mathematics or physics and TTI’s speculative promotion of those results, including the incomplete stress–energy bridge and the Ledger’s ansatz status.
- Added audit and deployment guards for all ten claims, all ten interlink descriptions and the dependency map.

## Project title in r4.5

- Renamed the project throughout to **The Two Infinities: Eternal Integration of the Self**.
- Set the introduction hero on two lines as **The Two Infinities:** and *Eternal Integration of the Self*.
- Updated masthead identity, page and social metadata, structured data, Atom discovery, manifest, Atlas root and written fallback, Plates generation, ShakDrah metadata, Hatchable project configuration and deployment checks.
- Updated the EGregoRA relocation notices for Möbius, Entropy and the Cosmic Ledger so they name the current TTI project.
- Retained the exact attribution line **“A speculative cosmology by Jim Rankin, UK, 2026”** and every existing route.

## Header-aligned page labels in r4.4

- Re-labelled all 25 built destination pages with the same numbered Part, Part title and page title used by the main header and Atlas.
- Reclassified older chapter-era labels such as Part VI, Part VII and Part VIII into the current five-Part structure without changing the original chapter numbers.
- Updated visible next-page references and Part-bearing metadata descriptions so they no longer contradict the main navigation.
- Added client-side alignment for the Hatchable-provided Join and Account rooms: **Part V &mdash; Reading Rooms &middot; Join** and **Part V &mdash; Reading Rooms &middot; Your Account**.
- Extended the header regression and complete site audit to derive every expected page label from the canonical header data and reject obsolete Part VI&ndash;VIII labels.

## Five-Part header in r4.3

- Replaced the abstract **Begin / Cosmos / Seams / Enquire** rail with the framework&rsquo;s own five numbered headings: **Part I &middot; First Principles**, **Part II &middot; Cosmic Architecture**, **Part III &middot; Seams and Return**, **Part IV &middot; Tests and Essays**, and **Part V &middot; Reading Rooms**.
- Rendered every page as a contextual subheading beneath its Part, including Prime Plane, Temporal Antipodes, Time and Residue, Inverted Tori, Matter and Antimatter Out of Phase, Plates, Ask ShakDrah, Join and Account.
- Made the masthead and introduction Atlas consume the same authoritative table of contents, preventing their Part and page order from drifting apart.
- Removed the detached duplicate Plates and Ask ShakDrah actions; both remain directly available beneath Part V.
- Kept the desktop rail slim with a compact two-line Part label, retained mutually exclusive native disclosure panels, active-page state, Escape and outside-click dismissal, and the responsive two-column mobile page list.
- Extended the deterministic header regression and live deployment markers to require five Parts and all 27 unique page subheadings.

## Introduction Atlas in r4.2

- Added **The Atlas of Becoming** to the introduction: an interactive Three.js navigation map tailored to TTI rather than EGregoRA&rsquo;s taxonomy.
- Organised all 25 built pages beneath five reading paths, with Join and Account as two additional runtime destinations: 27 destinations in total.
- Preserved four visual forms, search, drag and zoom, full-screen focus, one-open-path folding, selected-destination reading panels and Escape recovery.
- Added a complete native-link written map as the no-JavaScript, reduced-motion and assistive-navigation fallback.
- Removed inherited EGregoRA language and eleven-limb assumptions from the renderer, changed its stored preference namespace, retained the user-visible spelling **Möbius**, and separated established topology from TTI&rsquo;s speculative cosmological use.
- Added deterministic local and deployment regression checks for data completeness, all built destinations, fallback links, controls, assets, terminology and live markers.

## Plates accordion in r4.1

- Replaced the Visual Compendium&rsquo;s bullet index and permanently expanded plate groups with twenty-one native, keyboard-operable disclosure headings.
- Each heading now contains its plate count and unfolds the original vector plate or plates directly beneath it.
- The shared disclosure name and JavaScript fallback enforce one open source chapter at a time; Escape closes the active chapter and hash links still open their named section.
- Added responsive accordion styling, a clear plus/minus state, source-chapter links, reduced-motion handling, and deterministic local/live regression checks.

## Header redesign in r4.0 (superseded by the r4.3 Part rail)

- Replaced the crowded row of equal desktop links with four compact navigation constellations: **Begin**, **Cosmos**, **Seams**, and **Enquire**.
- Added contextual dropdown panels with short descriptions, recognizable glyphs, active-page states, keyboard-readable native disclosure controls, outside-click and Escape dismissal, and one-open-group behaviour.
- Kept **Plates** and **Ask ShakDrah** permanently visible, while adding the transferred entropy, double-inversion, accumulated-differentials, Little Red Dots, and Zero-Seam destinations to primary discovery.
- Rebuilt the mobile navigation as a progressively enhanced accordion: it remains visible without JavaScript, becomes a compact Explore drawer when scripting runs, and uses one or two columns according to the viewport.
- Preserved the exact project title, exact Jim Rankin attribution line, compact desktop height, account control, six avatar voices, and every previously deployed destination.
- Added a deterministic header regression test and extended local and live deployment audits to verify all twenty unique destinations, four groups, responsive controls, active-page state, CSS and JavaScript.

## Integration added in r3.9

- Moved **The Möbius Seam**, **Entropy**, and **The Cosmic Ledger** out of EGregoRA&rsquo;s primary navigation and index. Their stable ASCII routes now provide small canonical relocation stubs to TTI rather than retaining duplicate essays.
- Merged the useful corrected Möbius and Cosmic Ledger material into their existing TTI pages, and established `/entropy/` as the canonical entropy-versus-integration account.
- Added **Two Inversions**, which compares Möbius frame return with light polarization and asks whether residue from a first inversion survives a second while retaining the exact-involution null \(P^2=I\).
- Added **When Differentials Accumulate**, which preserves the exact Skeletal Splice sums but requires units, a covariant field, conservation and a stress&ndash;energy coupling before interpreting accumulation as mass or gravity.
- Integrated the three canonical destinations and two new research notes across homepage and Essays discovery, metadata, Atom syndication, sitemap, reciprocal cross-links, prepared ShakDrah/Gink knowledge, plates, audit tests and both deployment workflows.

## Maintenance added in r3.8

- Replaced the former geometry tagline with the exact attribution line **“A speculative cosmology by Jim Rankin, UK, 2026”** across the masthead, homepage hero, metadata, structured-data slogan, manifest, Atom feed, deployment configuration and live smoke checks.
- Removed the duplicate hard-coded masthead phrase while retaining the compact revision mark and slim responsive header.

## Current audited result

- Admin Edit changes on both sites are deterministically snapshotted and automatically committed before a subsequent deployment can proceed.
- All 25 Part I–IV research documents are accessible essays between 2,005 and 3,978 audited words; Part V remains four project resources.
- The length and accessibility regression is part of `npm run audit:tti` and derives its scope from the canonical table of contents.
- 28 HTML documents built.
- 28 unique canonical URLs verified.
- Exact project title and tagline verified in the homepage, redesigned masthead, metadata and manifest.
- Ten ordered core claims each explain their dependency and consequence; a six-branch map summarises how the framework interlinks.
- The Part I π paper is verified with the beta integral, semicircle substitution, arcsine normalisation, arctangent and Basel routes, non-Euclidean limit, one plate and reciprocal discovery.
- Wormholes and Inverted Tori is verified beneath Part III with one plate, thirteen required argument surfaces and reciprocal discovery links.
- Five numbered masthead Parts expose 29 unique page subheadings from the shared Atlas data, with full-text hover/focus expansion, touch wrapping, active-page state, mobile controls and keyboard dismissal verified.
- All 27 built destination pages carry the matching header Part and page title; runtime Join and Account labels are aligned to Part V.
- The introduction Atlas has five TTI-specific reading paths and the same 29 unique destinations, including all 27 built pages plus Join and Account; its interactive controls and complete written fallback are verified.
- Twenty-three mutually exclusive plate headings contain all 33 gathered vectors; the former bullet index is absent.
- Every local document, asset and fragment link verified.
- JSON-LD parsed on every HTML page.
- Nested breadcrumbs verified for the Zero-Seam research proposal.
- `sitemap.xml`, Atom `feed.xml`, `robots.txt` and the SVG favicon verified.
- 33 source plates reconciled with 33 gathered plates; SVG IDs and marker references are namespaced in the compendium.
- The research proposal is discoverable from the homepage, parent conjecture, Essays, Stress Tests, Time and Residue, and Inverted Tori.
- Temporal Antipodes is discoverable from the homepage, Foundations, Seams, Essays, Stress Tests, Prime Plane, Time and Residue, Inverted Tori, and the matter–antimatter essay.
- 24 prepared answers and 24 paraphrase routes verified for both ShakDrah and Gink, including π on the unit interval, wormholes, entropy, double inversion, accumulated differentials, fallback and attachment bypass.
- Six male neural voices, per-voice dispatch, prosody, consent and lip-sync metadata remain covered by the existing neural-voice test.
- Workflow YAML and focused Hatchable build markers are validated before deployment.

## Integration added in r3.7

1. The temporal-antipode idea now has a standalone essay that distinguishes scale from cardinality and makes its temporal assignment explicitly conjectural.
2. Full synchronisation is defined as persistent phase-and-rate locking after lawful transport to one comparison surface; an isolated phase crossing is not counted as synchrony.
3. The compactified-time scaffold states its assumptions and refuses to treat coordinate compactification, endpoint reflection or spatial orientation reversal as a physical clock channel.
4. The stress test supplies derivation gates, conventional null explanations and three explicit loss conditions, including a physical temporal gluing that provides a shared clock.
5. Foundations, Seams, Essays, Prime Plane, Time and Residue, Inverted Tori, the matter–antimatter essay and homepage now cross-link the conjecture without conflating it with entropy, baryogenesis or information transfer.
6. Both avatars carry a nineteenth prepared answer, and the new plate is gathered into the compendium and syndication/discovery surfaces.

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

The local audit does not claim that the TTI physics is correct, that a previous universe exists, that the negative interval is a physical domain, that the two scale-infinities are physical clocks at opposite temporal ends, that entropy equals TTI integration, that an exact double inversion retains physical residue, or that accumulated differentials generate mass or gravity. It checks the site’s internal integrity and whether those claims retain their declared speculative status.

External scientific links are preserved but are not treated as automatically valid forever. The deployment workflow separately verifies selected live pages after Hatchable publishes them. Visual and audible quality still require human inspection even when markup, voice routing and timing metadata pass automated tests.
