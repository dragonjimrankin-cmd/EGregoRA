#!/usr/bin/env python3
"""Regenerate src/site-index.njk from the built site.

Walks _site, reads every page's title, description, headings (h2/h3 with
ids) and plates, and writes a complete listing with a link to every
addressable anchor on the site — the same shape as the TTI index. Run it
after a build, then build again; `npm run build` does both passes itself.
"""
from __future__ import annotations

import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"
OUT = ROOT / "src" / "site-index.njk"

# Reading order of the house; anything built but unlisted is appended at the
# end under "Also on the site" so a new page can never silently vanish.
ORDER = [
    ("", "The Introduction", "the house, its two co-founders, and the limbs of the work"),
    ("cosmic-aether", "The Cosmic Aether", "one field, named twice — the aether and the quantum vacuum"),
    ("astronomy", "Astronomy", "the sky as it is actually measured"),
    ("entropy", "Entropy and the Phases of Integration", "time's arrow, and the ledger of order"),
    ("decoherence", "Decoherence & the Remembered Self", "how the quantum becomes the everyday"),
    ("locality", "Local & Non-Local Reality", "what entanglement permits, and what it refuses"),
    ("cosmic-ledger", "The Cosmic Ledger", "residue, polarity, and phased integration"),
    ("moebius-seam", "The Moebius Seam", "the half-twist where inside becomes outside"),
    ("druids", "The Druids", "who they actually were, against the romance"),
    ("sacred-geometry", "Sacred Geometry", "the shapes nature keeps arriving at, and the ones it refuses"),
    ("astrology", "Astrology", "the history, the primary sources, and the honest assessment"),
    ("neurobiology", "Neurobiology", "the machinery of perception, from the glymphatic night to the visionary state"),
    ("consciousness", "Consciousness", "the hard problem, faced without flinching"),
    ("music", "Sound, Music and the Cosmic Brainwave", "resonance, tuning, and the brain's own frequencies"),
    ("elemental-alchemy", "Elemental Alchemy", "the four elements, rendered as states and energetics"),
    ("occult", "The Occult", "what the word actually means, with its real history"),
    ("qabalah", "The Hermetic Qabalah", "the tree of life as a map of everything"),
    ("wizardry", "Wizardry & Rituals", "practice, and the measurable edge of expectation"),
    ("runes", "Runes, Charms & Natural Energies", "the northern alphabets and the energies behind them"),
    ("extraterrestrials", "Extraterrestrials", "the contact question — neighbours rather than visitors"),
    ("research", "Further Research", "the reading list, sorted by evidential weight"),
    ("infographics", "Infographics", "every figure drawn anywhere on the site, at full size"),
    ("podcast", "Podcasts", "long-form conversation, and the feed that carries it"),
    ("videos", "Videos", "the film shelf"),
    ("artwork", "Artwork", "the paintings, with their provenance kept"),
    ("ask-ed", "Ask Ed", "Gink the fox, the oracle, and the letter form to Ed"),
]

SKIP = {"site-index", "assets", "404", "cosmic-ether"}

H = re.compile(r'<h([23])[^>]*\bid="([^"]+)"[^>]*>(.*?)</h\1>', re.S)
# The house uses both a bare <figcaption> and <figcaption class="plate-cap">.
PLATE_CAP = re.compile(r'<figcaption(?:\s+class="plate-cap")?>(.*?)</figcaption>', re.S)
FUND = re.compile(r'<p class="fundamental-tag">(.*?)</p>', re.S)
TITLE = re.compile(r"<title>(.*?)</title>", re.S)
DESC = re.compile(r'<meta name="description" content="(.*?)"', re.S)


def text(raw: str) -> str:
    t = re.sub(r"<[^>]+>", "", raw)
    t = re.sub(r"\s+", " ", t).strip()
    return t


def esc(t: str) -> str:
    """Re-escape for output, leaving existing entities alone."""
    t = t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return re.sub(r"&amp;(#?\w+);", r"&\1;", t)


def page_data(slug: str):
    f = SITE / slug / "index.html" if slug else SITE / "index.html"
    if not f.exists():
        return None
    raw = f.read_text(errors="ignore")
    body = raw.split("<footer", 1)[0]
    t = TITLE.search(raw)
    d = DESC.search(raw)
    heads = []
    for m in H.finditer(body):
        level, hid, inner = int(m.group(1)), m.group(2), m.group(3)
        label = text(inner)
        if not label:
            continue
        heads.append((level, hid, label))
    # The infographics page is a copy of every other page's figures; counting
    # it would double the total and tell the reader nothing.
    plates = ([] if slug == "infographics"
              else [text(m.group(1)) for m in PLATE_CAP.finditer(body)])
    funds = [text(m.group(1)) for m in FUND.finditer(body)]
    return {
        "title": html.unescape(text(t.group(1))) if t else slug,
        "desc": html.unescape(d.group(1)) if d else "",
        "heads": heads,
        "plates": plates,
        "funds": funds,
    }


def main() -> None:
    listed = [s for s, *_ in ORDER]
    extra = []
    for f in sorted(SITE.rglob("index.html")):
        slug = f.parent.relative_to(SITE).as_posix()
        slug = "" if slug == "." else slug
        if slug not in listed and slug not in SKIP and "/" not in slug:
            extra.append((slug, slug.replace("-", " ").title(), ""))

    blocks, toc = [], []
    n_pages = n_sections = n_plates = 0

    for slug, label, note in ORDER + ([("", "", "")] if extra else []):
        if slug == "" and label == "":
            blocks.append(
                '<div class="divider">&#10022;</div>\n\n'
                '<section class="wrap narrow reveal">\n  <div class="frame">\n'
                '    <h2 id="x-also">Also on the site</h2>\n'
                '    <ul class="sitemap-also">\n'
                + "".join(f'      <li><a href="/{s}/">{esc(l)}</a></li>\n' for s, l, _ in extra)
                + "    </ul>\n  </div>\n</section>\n\n"
            )
            continue
        d = page_data(slug)
        if not d:
            continue
        n_pages += 1
        n_plates += len(d["plates"])
        url = f"/{slug}/" if slug else "/"
        anchor = f"x-{slug or 'home'}"
        toc.append(f'      <li><a href="#{anchor}">{esc(label)}</a></li>')

        items = []
        for level, hid, lab in d["heads"]:
            n_sections += 1
            cls = "sitemap-h2" if level == 2 else "sitemap-h3"
            items.append(
                f'        <li class="{cls}"><a href="{url}#{hid}">{esc(lab)}</a></li>'
            )
        plate_html = ""
        if d["plates"]:
            plate_html = (
                '      <p class="sitemap-plates"><strong>Plates:</strong> '
                + " &middot; ".join(esc(p) for p in d["plates"])
                + "</p>\n"
            )
        fund_html = ""
        if d["funds"]:
            fund_html = (
                '      <p class="sitemap-fund">'
                + " &middot; ".join(esc(f) for f in d["funds"])
                + "</p>\n"
            )

        blocks.append(
            f'<section class="wrap narrow reveal">\n'
            f'  <div class="frame sitemap-page" id="{anchor}">\n'
            f'    <h2><a href="{url}">{esc(label)}</a></h2>\n'
            f'    <p class="sitemap-note muted">{esc(note)}</p>\n'
            f"{fund_html}"
            + (
                '    <ol class="sitemap-sections">\n' + "\n".join(items) + "\n    </ol>\n"
                if items else ""
            )
            + f"{plate_html}"
            f"  </div>\n</section>\n\n"
        )

    head = f'''---
layout: layouts/base.njk
title: The Index
permalink: /site-index/
description: "Every page and every section of EGregoRA, listed in reading order with a direct link to each: {n_pages} pages, {n_sections} addressable sections and {n_plates} plates."
---

<!-- GENERATED by scripts/write-site-index.py from _site -- do not hand-edit. -->

<section class="page-head">
  <p class="kicker">The Whole House &middot; {n_pages} pages &middot; {n_sections} sections &middot; {n_plates} plates</p>
  <h1>The Index</h1>
  <p class="lede muted"><strong>E</strong>verything the house contains, in one list.</p>
</section>

<section class="wrap narrow reveal">
  <div class="frame frame--first illuminated">
    <p class="lede">Every section of every page, in reading order, each one linked directly. Nothing here
      is written by hand &mdash; the list is rebuilt from the site itself on every deploy, so it cannot
      drift out of step with what is actually published.</p>
    <p>If you want the sources rather than the contents, <a href="/research/">the reading list</a> holds
      every book and paper this house stands on, sorted by evidential weight. If you want pictures,
      <a href="/artwork/">the artwork</a> holds the paintings and <a href="/infographics/">the
      infographics</a> hold every figure drawn anywhere on the site.</p>
    <ul class="sitemap-toc">
{chr(10).join(toc)}
    </ul>
  </div>
</section>

<div class="divider">&#10022;</div>

'''

    tail = '''<div class="divider">&#10022;</div>

<section class="wrap narrow reveal">
  <div class="frame frame--creed">
    <p class="lede">A house that cannot be navigated cannot be checked, and a claim nobody can find
      is a claim nobody can refute.</p>
    <p class="muted small">Next: <a href="/ask-ed/">ask Ed</a> &middot;
      <a href="/research/">the reading list</a>.</p>
  </div>
</section>
'''

    OUT.write_text(head + "".join(blocks) + tail, encoding="utf-8")
    print(f"wrote {OUT} -- {n_pages} pages, {n_sections} sections, {n_plates} plates")


if __name__ == "__main__":
    main()
