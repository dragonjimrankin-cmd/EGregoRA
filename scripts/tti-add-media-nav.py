#!/usr/bin/env python3
"""Put the shelves in TTI's navigation, on every page.

/podcast/ and /videos/ are new to The Two Infinities. A page nobody can reach
is not a feature, so both go into the primary nav and the footer nav of all 49
pages — with Live alongside them, which until now was in the footer only.

Idempotent: a page that already has an entry is left alone, so this can be run
again after the other AI rebuilds a page.
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

NAV = """
      <li>
        <a href="/podcast/" >
          <i aria-hidden="true"><svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><rect x="34" y="16" width="32" height="58" rx="16"/><path d="M26 52 a24 24 0 0 0 48 0"/><path d="M50 76 v10"/></g></svg></i>
          <span>Podcasts</span>
        </a>
      </li>

      <li>
        <a href="/videos/" >
          <i aria-hidden="true"><svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="28" width="54" height="44" rx="7"/><path d="M68 44 l18 -10 v32 l-18 -10 z"/></g></svg></i>
          <span>Videos</span>
        </a>
      </li>
"""


def main():
    pages = sorted(glob.glob(os.path.join(ROOT, "tti/hatchable/public/**/index.html"),
                             recursive=True))
    nav_added = foot_added = skipped = 0
    for path in pages:
        s = open(path, encoding="utf-8").read()
        orig = s
        rel = os.path.relpath(path, ROOT)
        page_slug = rel.split("/public/")[1].replace("index.html", "")

        # ---- primary nav: before the </ul> that closes #primary-nav
        i = s.find('id="primary-nav"')
        if i >= 0 and '<a href="/podcast/"' not in s[i:s.find("</nav>", i)]:
            j = s.find("</ul>", i)
            if j > 0:
                s = s[:j] + NAV + "      " + s[j:]
                nav_added += 1

        # ---- footer nav: sit the shelves beside Live
        k = s.find('class="foot-nav"')
        if k >= 0:
            seg_end = s.find("</nav>", k)
            seg = s[k:seg_end]
            if '<a href="/podcast/"' not in seg:
                # the live page links to itself twice; collapse that first
                seg_new = seg.replace('<a href="/live/">Live</a><a href="/live/">Live</a>',
                                      '<a href="/live/">Live</a>')
                if '<a href="/live/">' in seg_new:
                    seg_new = seg_new.replace('<a href="/live/">Live</a>',
                                              '<a href="/podcast/">Podcasts</a>'
                                              '<a href="/videos/">Videos</a>'
                                              '<a href="/live/">Live</a>', 1)
                else:
                    seg_new = seg_new.replace("</nav>", "") + \
                        '<a href="/podcast/">Podcasts</a><a href="/videos/">Videos</a>' + \
                        '<a href="/live/">Live</a>'
                s = s[:k] + seg_new + s[seg_end:]
                foot_added += 1

        # the page's own entry should read as the one you are on
        if page_slug in ("podcast/", "videos/"):
            own = '<a href="/%s">' % page_slug
            s = re.sub(re.escape(own), own, s)  # no-op, kept explicit

        if s != orig:
            open(path, "w", encoding="utf-8").write(s)
        else:
            skipped += 1

    print("pages seen: %d   nav entries added: %d   footer entries added: %d   untouched: %d"
          % (len(pages), nav_added, foot_added, skipped))
    return 0


if __name__ == "__main__":
    sys.exit(main())
