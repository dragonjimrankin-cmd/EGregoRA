#!/usr/bin/env python3
"""Walk the built site and look for the errors nobody notices by hand.

Checks, in order of how often they actually bite:
  1. internal links that point at a page which is not built
  2. #anchors that point at an id which is not on the target page
  3. <img>/<video>/<source> files that are not in _site
  4. duplicate ids within one page
  5. scripts and stylesheets referenced but missing
  6. remote assets (a CDN that goes down takes the page with it). Fonts are
     allowed: losing them costs typography. Scripts are not: losing one
     costs a feature, which is the bug that took the podcast panel down.
  7. pages missing a title, description or canonical

Exit code 1 if anything is found, so it can gate a deploy.
"""
import os
import re
import sys
from html.parser import HTMLParser

ROOT = "_site"


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.assets = []
        self.title = ""
        self.desc = ""
        self.canonical = ""
        self._in_title = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.append(a["id"])
        if a.get("name") and tag == "a":
            self.ids.append(a["name"])
        if tag == "a" and a.get("href"):
            self.links.append(a["href"])
        if tag in ("img", "video", "source", "audio") and a.get("src"):
            self.assets.append(a["src"])
        if tag == "script" and a.get("src"):
            self.assets.append(a["src"])
        if tag == "link":
            rel = (a.get("rel") or "").lower()
            if "stylesheet" in rel and a.get("href"):
                self.assets.append(a["href"])
            if "preconnect" in rel or "dns-prefetch" in rel:
                pass
            if "canonical" in rel:
                self.canonical = a.get("href", "")
            if "icon" in rel and a.get("href"):
                self.assets.append(a["href"])
        if tag == "meta" and (a.get("name") or "").lower() == "description":
            self.desc = a.get("content", "")
        if tag == "title":
            self._in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data.strip()


def built(path):
    """Does this site-absolute path exist in the build?"""
    path = path.split("?")[0]
    if path.endswith("/"):
        return os.path.exists(os.path.join(ROOT, path.strip("/"), "index.html"))
    return os.path.exists(os.path.join(ROOT, path.lstrip("/")))


def ids_of(path):
    path = path.split("?")[0]
    f = os.path.join(ROOT, path.strip("/"), "index.html") if path.endswith("/") \
        else os.path.join(ROOT, path.lstrip("/"))
    if not os.path.exists(f):
        return None
    p = Page()
    p.feed(open(f, encoding="utf-8").read())
    return set(p.ids)


def main():
    pages = []
    for base, _dirs, files in os.walk(ROOT):
        for f in files:
            if f.endswith(".html"):
                pages.append(os.path.join(base, f))

    faults = []
    anchors = {}

    for f in sorted(pages):
        where = "/" + os.path.relpath(f, ROOT)
        p = Page()
        p.feed(open(f, encoding="utf-8").read())

        seen = set()
        for i in p.ids:
            if i in seen:
                faults.append((where, "duplicate id", i))
            seen.add(i)
        anchors[where] = seen

        if not p.title:
            faults.append((where, "no title", ""))
        if not p.desc:
            faults.append((where, "no meta description", ""))
        if not p.canonical:
            faults.append((where, "no canonical", ""))

        for href in p.links:
            if href.startswith(("http://", "https://", "mailto:", "tel:", "data:", "javascript:")):
                continue
            if href.startswith("#"):
                if href[1:] and href[1:] not in seen:
                    faults.append((where, "anchor not on this page", href))
                continue
            if not href.startswith("/"):
                continue
            path, _, frag = href.partition("#")
            if not built(path):
                faults.append((where, "link to a page that is not built", href))
                continue
            if frag:
                there = ids_of(path)
                if there is not None and frag not in there:
                    faults.append((where, "anchor not on the target page", href))

        for src in p.assets:
            if src.startswith(("data:", "blob:")):
                continue
            if src.startswith(("http://", "https://")):
                if src.startswith(("https://fonts.googleapis.com", "https://fonts.gstatic.com")):
                    continue
                faults.append((where, "asset fetched from another host", src))
                continue
            if src.startswith("/") and not built(src):
                faults.append((where, "asset missing from the build", src))

    if faults:
        print("%d problem(s):\n" % len(faults))
        for where, what, detail in faults:
            print("  %-34s %-34s %s" % (where, what, detail))
        return 1
    print("check-site — %d pages, nothing wrong" % len(pages))
    return 0


sys.exit(main())
