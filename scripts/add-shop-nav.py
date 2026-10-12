#!/usr/bin/env python3
"""Put the shop and the membership page in both houses' navigation.

The same reasoning as the shelves: a page nobody can reach is not a feature.
Both go into the primary nav and the footer nav of every page on both houses.

Idempotent — a page that already has them is left alone, so this can be run
again after the other AI rebuilds a page.

Run:  python3 scripts/add-shop-nav.py
"""
import glob
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TREES = ["hatchable/public", "tti/hatchable/public"]

SHOP_NAV = """
      <li>
        <a href="/shop/" >
          <i aria-hidden="true"><svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 34 h56 l-6 46 H28 z"/><path d="M38 34 a12 12 0 0 1 24 0"/></g></svg></i>
          <span>Shop</span>
        </a>
      </li>
"""

MEMBER_NAV = """
      <li>
        <a href="/membership/" >
          <i aria-hidden="true"><svg class="glyph" viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M50 78 C30 64 20 51 20 40 a14 14 0 0 1 26 -7 a14 14 0 0 1 26 7 c0 11 -10 24 -22 38 z"/></g></svg></i>
          <span>Membership</span>
        </a>
      </li>
"""

FOOT = '<a href="/shop/">Shop</a><a href="/membership/">Membership</a>'


def main():
    total = nav_added = foot_added = 0
    for tree in TREES:
        pages = sorted(glob.glob(os.path.join(ROOT, tree, "**/index.html"), recursive=True))
        for path in pages:
            s = open(path, encoding="utf-8").read()
            orig = s
            total += 1

            # Each link is tested for separately. Guarding on /shop/ alone
            # skipped the shop page itself, which already links to its own
            # shop, and so it never got Membership.
            for href, block in (("/shop/", SHOP_NAV), ("/membership/", MEMBER_NAV)):
                i = s.find('id="primary-nav"')
                if i >= 0 and '<a href="' + href + '"' not in s[i:s.find("</nav>", i)]:
                    j = s.find("</ul>", i)
                    if j > 0:
                        s = s[:j] + block + "      " + s[j:]
                        nav_added += 1

                k = s.find('class="foot-nav"')
                if k >= 0:
                    end = s.find("</nav>", k)
                    if '<a href="' + href + '"' not in s[k:end]:
                        s = s[:end] + '<a href="' + href + '">' +                             ("Shop" if href == "/shop/" else "Membership") + '</a>' + s[end:]
                        foot_added += 1

            if s != orig:
                open(path, "w", encoding="utf-8").write(s)

    print("pages seen: %d   primary nav: %d   footer nav: %d" % (total, nav_added, foot_added))
    return 0


if __name__ == "__main__":
    sys.exit(main())
