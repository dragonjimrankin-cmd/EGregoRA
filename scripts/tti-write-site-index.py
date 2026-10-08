#!/usr/bin/env python3
"""Regenerate tti/src/site-index.njk from the built site.

Walks tti/_site, reads every page's title, description, headings (h2/h3 with
ids), plates and fundamentals, and writes a complete listing with a link to
every addressable anchor on the site. Run it after a build, like
scripts/tti-gather-plates.py, then build again.
"""
from __future__ import annotations

import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "tti" / "_site"
OUT = ROOT / "tti" / "src" / "site-index.njk"

# Reading order of the site; anything built but unlisted is appended at the end
# under "Also on the site" so a new page can never silently vanish.
ORDER = [
    ("", "The Opening Page", "the thesis, the twelve claims, and the chain of necessity"),
    ("summary", "The Summary", "the whole framework in one sitting"),
    ("foundations", "Foundations", "Part I — zero, one, π, and the eternal integration"),
    ("the-self", "The Self", "Part II — consciousness as an integral"),
    ("dx", "dx", "Part II — what a differential is, mathematically and philosophically"),
    ("skeletal-splice", "The Skeletal Splice", "Part III — Fibonacci, accumulation, and the pace"),
    ("megatubule", "The Megatubule", "Part III — the throat, and the Cold Spot"),
    ("gravity", "Gravity", "Part IV — curvature as the thing itself"),
    ("spiral", "The Spiral", "Part IV — the integers placed, and where 666 falls"),
    ("torus", "The Torus", "Part V — return without repetition"),
    ("moebius", "The Möbius Strip", "Part V — the half-twist, and galaxy handedness"),
    ("cosmic-ledger", "The Cosmic Ledger", "Part VI — residue, polarity, and the χ-field"),
    ("seams", "The Seams", "Part VII — where inside and boundary meet"),
    ("stress-tests", "Stress Tests", "Part VII — the framework argued against itself"),
    ("essays", "The Essays", "Part VIII — eleven essays"),
    ("plates", "The Plate Room", "every figure drawn anywhere on the site"),
    ("ask-shakdrah", "Ask ShakDrah", "the dragon, the draw box, the film box, and the letter form"),
]

SKIP = {"site-index"}

H = re.compile(r'<h([23])[^>]*\bid="([^"]+)"[^>]*>(.*?)</h\1>', re.S)
PLATE_CAP = re.compile(
    r'<figcaption class="plate-cap">(.*?)</figcaption>', re.S)
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
    # The plate room is a copy of every other page's figures; counting it
    # would double the total and tell the reader nothing.
    plates = ([] if slug == "plates"
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
                "    <h2 id=\"x-also\">Also on the site</h2>\n"
                "    <ul class=\"sitemap-also\">\n"
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
            f'    <ol class="sitemap-sections">\n'
            + "\n".join(items)
            + ("\n" if items else "")
            + "    </ol>\n"
            f"{plate_html}"
            f"  </div>\n</section>\n\n"
        )

    head = f'''---
layout: layouts/base.njk
title: The Index
permalink: /site-index/
description: "Every page and every section of The Two Infinities, listed in reading order with a direct link to each: {n_pages} pages, {n_sections} addressable sections and {n_plates} plates, from the chain of necessity to the Cosmic Ledger and the dragon."
---

<!-- GENERATED by scripts/tti-write-site-index.py from tti/_site -- do not hand-edit. -->

<section class="page-head">
  <p class="kicker">The Whole Site &middot; {n_pages} pages &middot; {n_sections} sections &middot; {n_plates} plates</p>
  <h1>The Index</h1>
  <p class="lede muted"><strong>E</strong>verything the site contains, in one list.</p>
</section>

<section class="wrap narrow reveal">
  <div class="frame frame--first illuminated">
    <p class="lede">Every section of every page, in reading order, each one linked directly. Nothing here
      is written by hand &mdash; the list is rebuilt from the site itself on every deploy, so it cannot
      drift out of step with what is actually published.</p>
    <p>If you want the argument rather than the contents, the <a href="/summary/">summary</a> gives the
      whole framework in one sitting, and the <a href="/">opening page</a> gives the twelve claims with
      their status attached. If you want pictures, the <a href="/plates/">plate room</a> holds every
      figure drawn anywhere on the site.</p>
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
    <p class="lede">A framework that cannot be navigated cannot be checked, and a claim nobody can find
      is a claim nobody can refute.</p>
    <p class="muted small">Next: <a href="/ask-shakdrah/">ask ShakDrah</a> &middot;
      <a href="/summary/">the summary</a>.</p>
  </div>
</section>
'''

    OUT.write_text(head + "".join(blocks) + tail, encoding="utf-8")
    print(f"wrote {OUT} -- {n_pages} pages, {n_sections} sections, {n_plates} plates")


if __name__ == "__main__":
    main()
