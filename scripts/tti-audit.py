#!/usr/bin/env python3
"""Audit the built TTI site: links, anchors, ids, metadata, plates, wording.

Reads tti/_site. Reports only; changes nothing.
"""
from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "tti" / "_site"
SRC = ROOT / "tti" / "src"

pages: dict[str, str] = {}
for f in sorted(SITE.rglob("index.html")):
    url = "/" + str(f.parent.relative_to(SITE)).replace(".", "").strip("/")
    url = "/" if url in ("/", "//") else url.rstrip("/") + "/"
    pages[url] = f.read_text()

issues: dict[str, list[str]] = defaultdict(list)


def flag(cat: str, msg: str) -> None:
    issues[cat].append(msg)


# ---------------------------------------------------------------- ids
ids: dict[str, set[str]] = {}
for url, h in pages.items():
    found = re.findall(r'\sid="([^"]+)"', h)
    ids[url] = set(found)
    for i, n in Counter(found).items():
        if n > 1:
            flag("duplicate ids", f"{url} #{i} x{n}")

# ---------------------------------------------------------------- links
for url, h in pages.items():
    for href in set(re.findall(r'href="([^"]+)"', h)):
        if href.startswith(("http", "mailto:", "tel:", "#!", "data:")):
            continue
        if href.startswith("#"):
            if href[1:] and href[1:] not in ids[url]:
                flag("dead anchors", f"{url} -> {href}")
            continue
        href = href.split("?")[0]
        path, _, frag = href.partition("#")
        if not path.startswith("/"):
            continue
        if path.endswith((".css", ".js", ".png", ".svg", ".ico", ".webmanifest",
                          ".txt", ".json", ".woff2", ".jpg", ".xml")):
            if not (SITE / path.lstrip("/")).exists():
                flag("missing assets", f"{url} -> {path}")
            continue
        target = path if path.endswith("/") else path + "/"
        if target not in pages:
            flag("dead links", f"{url} -> {href}")
        elif frag and frag not in ids[target]:
            flag("dead anchors", f"{url} -> {href}")

# ---------------------------------------------------------------- metadata
for url, h in pages.items():
    t = re.search(r"<title>(.*?)</title>", h, re.S)
    title = t.group(1).strip() if t else ""
    if not title:
        flag("metadata", f"{url} has no <title>")
    elif len(title) > 70:
        flag("metadata", f"{url} title {len(title)} chars (>70): {title[:60]}…")
    d = re.search(r'<meta name="description" content="(.*?)"', h, re.S)
    if not d:
        flag("metadata", f"{url} has no description")
    elif not (50 <= len(d.group(1)) <= 200):
        flag("metadata", f"{url} description {len(d.group(1))} chars (want 50-200)")
    if 'rel="canonical"' not in h:
        flag("metadata", f"{url} has no canonical")
    for p in ('og:title', 'og:description', 'og:image', 'twitter:card'):
        if p not in h:
            flag("metadata", f"{url} missing {p}")
    if 'application/ld+json' not in h:
        flag("metadata", f"{url} has no JSON-LD")

# ---------------------------------------------------------------- structure
for url, h in pages.items():
    n_h1 = len(re.findall(r"<h1[ >]", h))
    if n_h1 != 1:
        flag("headings", f"{url} has {n_h1} h1")
    # heading level skips
    levels = [int(m) for m in re.findall(r"<h([1-6])[ >]", h)]
    for a, b in zip(levels, levels[1:]):
        if b > a + 1:
            flag("headings", f"{url} skips h{a} -> h{b}")
            break
    for img in re.findall(r"<img\b[^>]*>", h):
        if "alt=" not in img:
            flag("a11y", f"{url} img without alt")
    for svg in re.findall(r"<svg\b[^>]*>", h):
        if 'role="img"' in svg and "aria-label" not in svg:
            flag("a11y", f"{url} svg role=img without aria-label")

# ---------------------------------------------------------------- plates
plate_pages = defaultdict(list)
for url, h in pages.items():
    for m in re.finditer(r'<figure id="([^"]+)" class="plate"', h):
        plate_pages[url].append(m.group(1))
    for m in re.finditer(r'class="plate-num">([^<]+)<', h):
        pass
# plate numbering per page
for url, h in pages.items():
    nums = re.findall(r'class="plate-num">Plate ([IVXL]+)<', h)
    if url != "/plates/" and len(set(nums)) != len(nums):
        flag("plates", f"{url} repeats a plate number: {nums}")

idx = pages.get("/plates/", "")
for url, figs in plate_pages.items():
    if url == "/plates/":
        continue
    for fig in figs:
        if f'href="{url}#{fig}"' not in idx and fig not in idx:
            flag("plates", f"{url}#{fig} absent from /plates/")

# ---------------------------------------------------------------- nav coverage
nav = set(re.findall(r'<a href="(/[^"#]*)"[^>]*class="nav-link|<a class="nav-link" href="(/[^"#]*)"',
                     pages.get("/", "")))
nav_urls = set(re.findall(r'href="(/[^"#]*/)"', pages.get("/", "")))
for url in pages:
    if url not in nav_urls and url != "/":
        flag("navigation", f"{url} not linked from the homepage")

# ---------------------------------------------------------------- wording
BAD = {
    "out-of-control thesis": r"out[- ]of[- ]control",
    "'the founder'": r"\bthe founder\b",
    "ether disproved": r"ether (?:was )?(?:wrong|disproved|renamed)",
    "polarize": r"(?<![a-z])polari[sz]e",
    "lorem": r"lorem ipsum",
    "TODO": r"\bTODO\b|\bFIXME\b",
}
THESIS = ("eternal integration of opposing infinities, which together swing like a "
          "pendulum that cannot settle")
for url, h in pages.items():
    text = re.sub(r"<[^>]+>", " ", h)
    for name, pat in BAD.items():
        for m in re.finditer(pat, text, re.I):
            flag("wording", f"{url}: {name} — …{text[max(0,m.start()-60):m.end()+60].strip()[:140]}…")
    if "opposing infinities" in text and "pendulum" in text:
        pass

n_thesis = sum(1 for h in pages.values()
               if THESIS.lower() in re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).lower())
print(f"thesis sentence verbatim on {n_thesis} pages")

# ---------------------------------------------------------------- oracle coverage
corpus_ids: set[str] = set()
for f in (ROOT / "tti" / "hatchable" / "lib").glob("oracle-corpus*.js"):
    corpus_ids |= set(re.findall(r"E\('([a-z0-9-]+)'", f.read_text()))
print(f"oracle entries: {len(corpus_ids)}")

sections = 0
for url, h in pages.items():
    sections += len(re.findall(r'<h[23] id="t-', h))
print(f"pages: {len(pages)}  sections: {sections}  "
      f"plates: {sum(len(v) for k, v in plate_pages.items() if k != '/plates/')}")

# ---------------------------------------------------------------- report
total = 0
for cat in sorted(issues):
    v = issues[cat]
    total += len(v)
    print(f"\n## {cat} ({len(v)})")
    for line in v[:25]:
        print("  -", line)
    if len(v) > 25:
        print(f"  … and {len(v)-25} more")
print(f"\nTOTAL ISSUES: {total}")
