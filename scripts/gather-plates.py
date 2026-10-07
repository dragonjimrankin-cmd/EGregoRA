# -*- coding: utf-8 -*-
"""Gathers every infographic drawn anywhere on the site into /infographics/.

Reads each page, finds the figures that contain vector art, gives each one an
anchor on its own page, and rewrites the tail of the infographics page so the
collection is complete by construction rather than by anyone remembering.
Identifiers inside each copied drawing are prefixed with the page they came
from, because two pages may both have called a marker "arrow".
"""
import os, re, html, io

SRC = "/home/user/EGregoRA/src"
SKIP = {"infographics.njk", "feed.njk", "sitemap.njk", "404.njk", "account.njk",
        "join.njk", "products.njk", "videos.njk", "podcast.njk", "ask-ed.njk", "index.njk"}

def front(text, key):
    m = re.search(r"^%s:\s*(.+)$" % key, text, re.M)
    if not m:
        return None
    return m.group(1).strip().strip('"')

def figures(text):
    """Every <figure ...> ... </figure> that contains an <svg>, with offsets."""
    out = []
    for m in re.finditer(r"<figure\b", text):
        start = m.start()
        depth, i = 0, start
        while True:
            nxt = re.search(r"<figure\b|</figure>", text[i:])
            if not nxt:
                return out
            at = i + nxt.start()
            if text[at:at + 8] == "</figure":
                depth -= 1
                i = at + 9
                if depth == 0:
                    break
            else:
                depth += 1
                i = at + 7
        block = text[start:i]
        if "<svg" in block and 'class="rune"' not in block[:120]:
            out.append((start, i, block))
    return out

def title_of(block):
    cap = re.search(r"<figcaption[^>]*>(.*?)</figcaption>", block, re.S)
    if not cap:
        return "A plate"
    t = re.sub(r"<[^>]+>", " ", cap.group(1))
    t = html.unescape(re.sub(r"\s+", " ", t)).strip()
    # The caption carries the plate's grading diamond. Stripped of its span
    # the mark would arrive here as a bare character in link text, where it
    # has no class, no colour and no meaning — so it is dropped.
    t = re.sub(r"\s*\u25c6+\s*", " ", t).strip()
    return re.sub(r"\s+", " ", t)[:140]

def prefix_ids(block, slug):
    """Rename every id defined inside this drawing so two copies cannot clash."""
    ids = set(re.findall(r'\bid="([^"]+)"', block))
    for i in sorted(ids, key=len, reverse=True):
        if i.startswith(slug + "-"):
            continue
        block = block.replace('id="%s"' % i, 'id="%s-%s"' % (slug, i))
        block = block.replace("url(#%s)" % i, "url(#%s-%s)" % (slug, i))
        block = block.replace('href="#%s"' % i, 'href="#%s-%s"' % (slug, i))
        block = block.replace('xlink:href="#%s"' % i, 'xlink:href="#%s-%s"' % (slug, i))
    return block

gathered = []
for name in sorted(os.listdir(SRC)):
    if not name.endswith(".njk") or name in SKIP:
        continue
    path = os.path.join(SRC, name)
    text = open(path, encoding="utf-8").read()
    link = front(text, "permalink") or "/"
    page = front(text, "title") or name
    slug = link.strip("/").replace("/", "-") or "home"
    figs = figures(text)
    if not figs:
        continue
    # give each figure an anchor on its own page, back to front so offsets hold
    n = 0
    changed = text
    marks = []
    for start, end, block in figs:
        n += 1
        marks.append((start, end, block, "fig-%d" % n))
    for start, end, block, anchor in reversed(marks):
        if re.match(r"<figure\b[^>]*\bid=", block):
            anchor = re.search(r'id="([^"]+)"', block).group(1)
        else:
            new = block.replace("<figure", '<figure id="%s"' % anchor, 1)
            changed = changed[:start] + new + changed[end:]
        gathered.append({
            "page": page, "link": link, "slug": slug, "anchor": anchor,
            "title": title_of(block), "html": block
        })
    if changed != text:
        open(path, "w", encoding="utf-8").write(changed)

gathered.sort(key=lambda g: (g["page"], g["anchor"]))

# ---- rewrite the tail of the infographics page -------------------------
ip = os.path.join(SRC, "infographics.njk")
page = open(ip, encoding="utf-8").read()
MARK = '<p class="kicker">THE REST OF THE COLLECTION</p>'
cut = page.index(MARK)
head = page[:cut]

body = io.StringIO()
body.write(MARK + "\n")
body.write('''    <p>Everything in this part was drawn for a particular argument somewhere else on the site, and
    every one of them is here: %d drawings from %d pages, gathered so the whole collection sits in one
    place. They are folded by the page they belong to &mdash; open a fold to see its plates. Each
    carries a link that opens that page in a new tab, at the exact figure, where the drawing is
    surrounded by the reasoning it was made for. The forty plates drawn for this page itself are at the
    foot, below the folds.</p>
  </div>
</section>

<div class="divider">\u2726</div>
''' % (len(gathered), len({g["page"] for g in gathered})))

by_page = {}
for g in gathered:
    by_page.setdefault(g["page"], []).append(g)

for pagename in sorted(by_page):
    items = by_page[pagename]
    link = items[0]["link"]
    body.write("""
<section class="wrap narrow reveal">
  <details class="scroll info-fold">
    <summary>%s &mdash; %d %s</summary>
    <p class="muted small">Drawn for <a href="%s" target="_blank" rel="noopener">%s</a>. Each card carries its link at the
    top: it opens that page in a new tab, at the figure itself.</p>
""" % (html.escape(pagename), len(items), "drawing" if len(items) == 1 else "drawings",
       link, html.escape(pagename)))
    for g in items:
        art = prefix_ids(g["html"], g["slug"] + "-" + g["anchor"])
        body.write("""
    <div class="frame plate-card">
      <p class="plate-link"><a href="%s#%s" target="_blank" rel="noopener">%s &mdash; on %s, in a new
      tab</a></p>
      %s
    </div>
""" % (g["link"], g["anchor"], html.escape(g["title"]), html.escape(pagename), art))
    body.write("""  </details>
</section>

<div class="divider">\u2726</div>
""")


body.write('''
{% include "partials/own-plates.njk" %}

<section class="wrap narrow reveal">
  <div class="frame frame--creed">
    <p>Every drawing on this site is on this page: the gathered folds above, and the forty plates drawn
    for this page itself immediately before this note. If one is added anywhere else it is gathered here
    by the same script that built this list, so the collection cannot quietly fall behind the site.</p>
    <p class="mt-1"><a href="/">The index &rarr;</a></p>
  </div>
</section>
''')

open(ip, "w", encoding="utf-8").write(head + body.getvalue())
print("gathered %d drawings from %d pages" % (len(gathered), len(by_page)))
for p in sorted(by_page):
    print("  %-38s %d" % (p, len(by_page[p])))
