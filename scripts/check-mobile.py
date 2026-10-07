#!/usr/bin/env python3
"""Check the built site for the faults that actually break a phone.

There is no browser in this sandbox, so this does not measure pixels. It
reads the markup and the stylesheet and looks for the things that reliably
cause a horizontal scrollbar, a 4-point tap target or an iOS zoom-on-focus,
all of which can be found statically:

  1. a missing or wrong viewport meta
  2. grid tracks whose minimum column is wider than a narrow phone's content
     box (360px screen minus the page gutters)
  3. fixed pixel widths above that, declared outside a media query
  4. wide tables with no scrolling container around them
  5. text inputs below 16px, which makes iOS Safari zoom the page on focus
  6. long unbroken strings in the prose that cannot wrap
  7. images in the markup with no width and height, which jump the layout

Exit code 1 if anything is found.
"""
import os
import re
import sys

ROOT = "_site"
CSS = os.path.join(ROOT, "assets", "css", "main.css")
NARROW = 360          # the phone being designed for
GUTTER = 24           # the page padding at that width, both sides together
BODY = NARROW - GUTTER

faults = []


def note(where, what, detail=""):
    faults.append((where, what, detail))


def strip_media(css):
    """Return only the declarations that are NOT inside a media query."""
    out = []
    i = 0
    while True:
        at = css.find("@media", i)
        if at < 0:
            out.append(css[i:])
            break
        out.append(css[i:at])
        depth = 0
        j = css.find("{", at)
        if j < 0:
            break
        depth = 1
        j += 1
        while j < len(css) and depth:
            if css[j] == "{":
                depth += 1
            elif css[j] == "}":
                depth -= 1
            j += 1
        i = j
    return "".join(out)


_restored = None


def restored(css):
    """Selectors given a 16px font back inside a phone-width media query."""
    global _restored
    if _restored is None:
        _restored = set()
        for blk in re.finditer(r"@media[^{]*max-width:\s*(\d+)px[^{]*\{(.+?)\n\}", css, re.S):
            if int(blk.group(1)) > 820:
                continue
            for rule in re.finditer(r"([^{}]+)\{([^{}]*font-size:\s*16px[^{}]*)\}", blk.group(2)):
                for sel in rule.group(1).split(","):
                    _restored.add(sel.strip().replace("\n", " "))
    return _restored


def check_css():
    if not os.path.exists(CSS):
        note("css", "no stylesheet in the build")
        return
    css = open(CSS, encoding="utf-8").read()
    base = strip_media(css)

    for m in re.finditer(r"minmax\(\s*(\d+)px", base):
        if int(m.group(1)) > BODY:
            line = base[:m.start()].count("\n") + 1
            sel = base.rfind("{", 0, m.start())
            sel = base[max(0, base.rfind("}", 0, sel) + 1):sel].strip().replace("\n", " ")
            note("main.css:%d" % line, "grid column cannot fit a %dpx phone" % NARROW,
                 (sel[:48] + " \u2192 " + m.group(0)))

    for m in re.finditer(r"(?<![-\w])(?:min-)?width:\s*(\d{3,4})px", base):
        if int(m.group(1)) > BODY:
            sel = base.rfind("{", 0, m.start())
            name = base[max(0, base.rfind("}", 0, sel) + 1):sel].strip().replace("\n", " ")
            if "max-width" in base[max(0, m.start() - 10):m.start() + 6]:
                continue
            note("main.css", "fixed width wider than a phone, outside a media query",
                 name[:48] + " \u2192 " + m.group(0))

    for m in re.finditer(r"font-size:\s*([\d.]+)(rem|px)", base):
        sel_end = base.rfind("{", 0, m.start())
        name = base[max(0, base.rfind("}", 0, sel_end) + 1):sel_end].strip().replace("\n", " ")
        if "input" not in name and "textarea" not in name and "select" not in name:
            continue
        px = float(m.group(1)) * (16 if m.group(2) == "rem" else 1)
        if px < 16 and name not in restored(css):
            note("main.css", "a form field under 16px makes iOS zoom on focus",
                 name[:48] + " \u2192 " + m.group(0))


SCROLLERS = ("table-wrap", "scroll-x", "keeper-wrap", "wide-scroll")


def check_html():
    pages = []
    for base, _dirs, files in os.walk(ROOT):
        for f in files:
            if f.endswith(".html"):
                pages.append(os.path.join(base, f))

    for f in sorted(pages):
        where = "/" + os.path.relpath(f, ROOT).replace("index.html", "")
        html = open(f, encoding="utf-8").read()

        vp = re.search(r'<meta[^>]+name="viewport"[^>]+content="([^"]+)"', html)
        if not vp:
            note(where, "no viewport meta")
        elif "width=device-width" not in vp.group(1):
            note(where, "viewport is not width=device-width", vp.group(1))
        elif "user-scalable=no" in vp.group(1) or "maximum-scale=1" in vp.group(1):
            note(where, "viewport forbids zooming", vp.group(1))

        for m in re.finditer(r"<table\b", html):
            before = html[max(0, m.start() - 420):m.start()]
            if not any(s in before for s in SCROLLERS) and "overflow" not in before:
                note(where, "a table with no scrolling container", "at char %d" % m.start())

        for m in re.finditer(r'<img\b([^>]*)>', html):
            at = m.group(1)
            if "width=" not in at or "height=" not in at:
                src = re.search(r'src="([^"]+)"', at)
                note(where, "image with no width/height", src.group(1) if src else "?")

        for m in re.finditer(r">([^<>\s]{48,})<", html):
            word = m.group(1)
            if word.startswith(("http", "/", "&")) or "&" in word:
                continue
            note(where, "an unbreakable string in the text", word[:40] + "\u2026")

        if re.search(r'style="[^"]*width:\s*\d{3,}px', html):
            note(where, "an inline pixel width in the markup")


check_css()
check_html()

if faults:
    print("%d thing(s) a phone will not like:\n" % len(faults))
    for where, what, detail in faults:
        print("  %-26s %-52s %s" % (where, what, detail))
    sys.exit(1)
print("check-mobile \u2014 nothing a phone will trip over")
