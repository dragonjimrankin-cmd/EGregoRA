#!/usr/bin/env python3
"""
Gather the topics of every limb page into one map.

The atlas on the index page needs a third tier: under each limb and
sub-limb, the actual subjects that limb page covers. Rather than keep a
second hand-written list that will drift out of step with the pages, this
reads the pages themselves.

For every page referenced by src/_data/limbs.js it finds the <h2> headings,
skips the furniture (the page head, the ledgers, the closing creed), stamps
an id on any heading that has none so the atlas can link straight at it, and
writes src/_data/atlas.json.

Run it after adding or renaming a section on a limb page:

    python3 scripts/gather-topics.py
"""

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = SRC / "_data" / "atlas.json"

# Headings that are structure rather than subject.
SKIP = {
    "what holds up", "what does not", "a line through it", "the four diamonds",
    "where to begin", "further reading", "the reading list", "a closing stance",
    "how to read this", "the standing instruction", "glossary", "timeline",
    "what survives", "what does not survive", "sources", "the ledger",
    "survives", "does not survive", "the honest shelf", "reading",
}

TAG = re.compile(r"<[^>]+>")
def heads(level):
    return re.compile(r"<h%d(?P<attrs>[^>]*)>(?P<body>.*?)</h%d>" % (level, level), re.S)


H2, H3 = heads(2), heads(3)
HAS_ID = re.compile(r"\bid\s*=")


def plain(html: str) -> str:
    """The reading text of a heading, entities and markup removed."""
    t = TAG.sub("", html)
    t = (t.replace("&amp;", "&").replace("&middot;", "\u00b7")
          .replace("&mdash;", "\u2014").replace("&ndash;", "\u2013")
          .replace("&rsquo;", "\u2019").replace("&lsquo;", "\u2018")
          .replace("&nbsp;", " ").replace("&hellip;", "\u2026"))
    return re.sub(r"\s+", " ", t).strip()


def slug(text: str) -> str:
    t = unicodedata.normalize("NFKD", text.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:46] or "topic"


def pages_from_limbs():
    """Every distinct page the limb canon points at, in canon order."""
    text = (SRC / "_data" / "limbs.js").read_text()
    hrefs = re.findall(r"href:\s*'([^']+)'", text)
    seen, out = set(), []
    for h in hrefs:
        path = h.split("#")[0]
        if path in seen:
            continue
        seen.add(path)
        out.append(path)
    return out


def by_permalink():
    """href -> source file, read from each page's own front matter."""
    out = {}
    for f in sorted(SRC.glob("*.njk")):
        m = re.search(r"^permalink:\s*(\S+)", f.read_text(), re.M)
        if m:
            out[m.group(1).strip('"\'')] = f
        else:
            out["/%s/" % f.stem] = f
    out.setdefault("/", SRC / "index.njk")
    return out


PERMALINKS = by_permalink()


def file_for(href: str):
    return PERMALINKS.get(href)


def main():
    atlas, stamped = {}, 0

    for href in pages_from_limbs():
        f = file_for(href)
        if not f:
            print("  (no source for %s)" % href)
            continue

        text = f.read_text()
        topics, used, changed = [], set(), False

        """Most pages carry their sections as <h2>; a few (the Occult) hang
        them off <h3> instead. Take whichever the page actually uses."""
        pattern = H2 if len(H2.findall(text)) >= 3 else H3
        level = 2 if pattern is H2 else 3

        for m in pattern.finditer(text):
            title = plain(m.group("body"))
            if not title or title.lower() in SKIP or len(title) > 70:
                continue

            attrs = m.group("attrs")
            found = re.search(r'id\s*=\s*"([^"]+)"', attrs)
            if found:
                anchor = found.group(1)
            else:
                anchor = "t-" + slug(title)
                n, base = 2, anchor
                while anchor in used or ('id="%s"' % anchor) in text:
                    anchor = "%s-%d" % (base, n)
                    n += 1
                text = text.replace(m.group(0),
                                    '<h%d id="%s"%s>%s</h%d>'
                                    % (level, anchor, attrs, m.group("body"), level), 1)
                changed = True
                stamped += 1
            used.add(anchor)
            topics.append({"title": title, "href": "%s#%s" % (href, anchor)})

        if changed:
            f.write_text(text)
        atlas[href] = topics
        print("  %-24s %2d topics" % (href, len(topics)))

    OUT.write_text(json.dumps(atlas, indent=2, ensure_ascii=False) + "\n")
    print("wrote %s \u2014 %d pages, %d new anchors" % (OUT.relative_to(ROOT), len(atlas), stamped))


if __name__ == "__main__":
    main()
