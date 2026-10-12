#!/usr/bin/env python3
"""Build TTI's /podcast/ and /videos/ from EGregoRA's, in TTI's own shell.

The two houses share the publishing machinery but not their faces. EGregoRA's
pages carry the recorder, the enhancer, the transcript door and the speaker
report inside one <main>; everything outside it is house identity — the
palette, the emblem, the JSON-LD, the nav, the footer.

So the splice takes TTI's live page as the shell — its <head>, header, nav and
footer are already right for that house, and its live page is the one TTI page
that definitely exists — and drops EGregoRA's <main> straight into it. Four
module scripts live *inside* that main on EGregoRA, so they travel with it.

Boundaries are found by marker, never by line number: these files are edited
often and by more than one hand, and a line count that is off by one produces
a page that is quietly wrong rather than loudly broken.

Run:  python3 scripts/splice-tti-media-pages.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHELL_SRC = os.path.join(ROOT, "tti/hatchable/public/live/index.html")

TWIN_URL = "https://the-two-infinities.hatchable.site"

PAGES = [
    {
        "src": "hatchable/public/podcast/index.html",
        "out": "tti/hatchable/public/podcast/index.html",
        "title": "Podcasts \u00b7 The Two Infinities",
        "crumb": "Podcasts",
        "desc": ("Long-form conversation from The Two Infinities \u2014 the two infinities and "
                 "beyond: cosmology, the spiral, the torus, consciousness, and the pendulum "
                 "that cannot settle."),
    },
    {
        "src": "hatchable/public/videos/index.html",
        "out": "tti/hatchable/public/videos/index.html",
        "title": "Videos \u00b7 The Two Infinities",
        "crumb": "Videos",
        "desc": ("Films and moving work from The Two Infinities \u2014 the spiral, the torus, "
                 "the seam, and the geometry of existence, filmed."),
    },
]

# The shell is TTI's live page. Everything the live room says about itself has
# to be rewritten before it can host a shelf of recordings.
LIVE_NAME = "The Live Room \u00b7 The Two Infinities"
LIVE_DESC = ("The Live Room of The Two Infinities: the order's camera when it is on air, the "
             "room around it, and the honest account of how it works \u2014 two-second segments, "
             "a few seconds behind the room, two locks to come in: an account here, and the "
             "watchword the broadcaster set.")
LIVE_DESC_HTML = LIVE_DESC.replace("'", "&#x27;")


def between(text, start_marker, end_marker, include_start=True, include_end=True):
    """The slice of text between two markers, with the markers themselves kept."""
    i = text.find(start_marker)
    if i < 0:
        raise SystemExit("start marker not found: %r" % start_marker)
    j = text.find(end_marker, i + len(start_marker))
    if j < 0:
        raise SystemExit("end marker not found: %r" % end_marker)
    if not include_start:
        i += len(start_marker)
    if include_end:
        j += len(end_marker)
    return text[i:j]


def main():
    shell_src = open(SHELL_SRC, encoding="utf-8").read()

    head = shell_src[: shell_src.find("</header>") + len("</header>")]
    foot = shell_src[shell_src.find('<footer class="site-foot"'):]

    # The live page's footer links to Live twice — once for itself. A shelf page
    # wants the shelves named instead.
    foot = foot.replace('<a href="/live/">Live</a><a href="/live/">Live</a>',
                        '<a href="/podcast/">Podcasts</a><a href="/videos/">Videos</a>'
                        '<a href="/live/">Live</a>')

    wrote = []
    for page in PAGES:
        src_path = os.path.join(ROOT, page["src"])
        out_path = os.path.join(ROOT, page["out"])
        main = between(open(src_path, encoding="utf-8").read(),
                       '<main id="main">', "</main>")

        head_p = head
        url = TWIN_URL + "/" + page["out"].split("/public/")[1].replace("index.html", "")

        subs = [
            ("<title>" + LIVE_NAME + "</title>", "<title>" + page["title"] + "</title>"),
            ('<meta name="description" content="' + LIVE_DESC_HTML + '">',
             '<meta name="description" content="' + page["desc"] + '">'),
            ('<link rel="canonical" href="' + TWIN_URL + '/live/">',
             '<link rel="canonical" href="' + url + '">'),
            ('<meta property="og:title" content="' + LIVE_NAME + '">',
             '<meta property="og:title" content="' + page["title"] + '">'),
            ('<meta property="og:url" content="' + TWIN_URL + '/live/">',
             '<meta property="og:url" content="' + url + '">'),
            ('<meta name="twitter:title" content="' + LIVE_NAME + '">',
             '<meta name="twitter:title" content="' + page["title"] + '">'),
            # structured data
            ('"@id": "' + TWIN_URL + '/live/#page"', '"@id": "' + url + '#page"'),
            ('"url": "' + TWIN_URL + '/live/"', '"url": "' + url + '"'),
            ('"name": "' + LIVE_NAME + '"', '"name": "' + page["title"] + '"'),
            ('"description": "' + LIVE_DESC + '"', '"description": "' + page["desc"] + '"'),
            ('"@id": "' + TWIN_URL + '/live/#breadcrumb"',
             '"@id": "' + url + '#breadcrumb"'),
            ('"name": "The Live Room", "item": "' + TWIN_URL + '/live/"',
             '"name": "' + page["crumb"] + '", "item": "' + url + '"'),
        ]
        for a, b in subs:
            if head_p.count(a) != 1:
                sys.exit("shell anchor matched %d times: %r" % (head_p.count(a), a[:80]))
            head_p = head_p.replace(a, b)
        head_p = re.sub(r'(<meta property="og:description" content=")[^"]*(")',
                        lambda m: m.group(1) + page["desc"] + m.group(2), head_p, count=1)
        head_p = re.sub(r'(<meta name="twitter:description" content=")[^"]*(")',
                        lambda m: m.group(1) + page["desc"] + m.group(2), head_p, count=1)

        # TTI's own words, in the part of the page that came from EGregoRA.
        main = main.replace('<p class="kicker">The Order&rsquo;s Passcode</p>',
                            '<p class="kicker">Admin Only</p>')
        main = main.replace("given to EGregoRA for the summary",
                            "given to The Two Infinities for the summary")
        main = main.replace('data-tag="egregora">egregora<',
                            'data-tag="the two infinities">the two infinities<')
        main = main.replace("The EGregoRA emblem", "The emblem of The Two Infinities")
        main = main.replace("/assets/img/sigil.svg", "/assets/img/torus.svg")
        main = main.replace("/assets/img/og-egregora.jpg", "/assets/img/og-two-infinities.jpg")

        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as fh:
            fh.write(head_p + "\n\n" + main + "\n" + foot)
        wrote.append(out_path)
        print("wrote %s (%d bytes)" % (os.path.relpath(out_path, ROOT), os.path.getsize(out_path)))

    return wrote


if __name__ == "__main__":
    main()
