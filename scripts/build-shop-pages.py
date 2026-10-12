#!/usr/bin/env python3
"""Build the shop pages: EGregoRA's shelf, and both houses' thanks and
membership pages.

TTI's /shop/ is hand-written and stays that way — every card carries a
description somebody chose. EGregoRA has no shop page at all, so its cards are
generated straight from lib/shelf.js, which is the only reason the page and
the shelf cannot disagree about a price.

The two houses keep their own shells. Everything outside <main> is house
identity: the palette, the emblem, the nav, the JSON-LD, the footer. Shells
are taken from a page that already exists on that house, so the result looks
like the rest of the site rather than like something dropped in.

Boundaries are found by marker, never by line number.

Run:  python3 scripts/build-shop-pages.py
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HOUSES = {
    "eg": {
        "shell": "hatchable/public/products/index.html",
        "out": "hatchable/public",
        "url": "https://egregora.hatchable.site",
        "shelf": "hatchable/lib/shelf.js",
        "label": "EGregoRA",
        "line": "Life, Love, Magic.",
    },
    "tti": {
        # The shop page is the obvious shell and the wrong one: it never closes
        # its <header>, so cutting at that marker would yield eight characters.
        # The live page is well-formed and already the shell for /podcast/ and
        # /videos/, so all three shelves share a face.
        "shell": "tti/hatchable/public/live/index.html",
        "out": "tti/hatchable/public",
        "url": "https://the-two-infinities.hatchable.site",
        "shelf": "tti/hatchable/lib/shelf.js",
        "label": "The Two Infinities",
        "line": "The Eternal Integration, and the Pendulum That Cannot Settle.",
    },
}

# TTI's order slip lives outside <main> on its shop page. It is house-neutral,
# so EGregoRA takes the same one rather than growing a second.
DRAWER_SRC = "tti/hatchable/public/shop/index.html"


def cut(text, start, end, inclusive_start=True, inclusive_end=False):
    i = text.find(start)
    if i < 0:
        sys.exit("marker not found: %r" % start)
    j = text.find(end, i + len(start))
    if j < 0:
        sys.exit("marker not found: %r" % end)
    if not inclusive_start:
        i += len(start)
    if inclusive_end:
        j += len(end)
    return text[i:j]


def head_and_foot(shell_path):
    s = open(os.path.join(ROOT, shell_path), encoding="utf-8").read()
    head = s[: s.find("</header>") + len("</header>")]
    foot = s[s.find('<footer class="site-foot"'):]
    return head, foot


def read_shelf(path):
    src = open(os.path.join(ROOT, path), encoding="utf-8").read()
    block = cut(src, "export const SHELF", "export const REF_PREFIX")
    items = []
    for key, name, price in re.findall(
            r"'([a-z0-9-]+)':\s*\{ name: '(.*?)',\s*price:\s*([0-9.]+)", block):
        name = name.encode().decode("unicode_escape")
        items.append((key, name, price))
    tiers = {}
    tblock = cut(src, "export const MEMBERSHIP", "export const DONATION")
    for key, name, amount, interval in re.findall(
            r"'([a-z0-9-]+)':\s*\{ name: '(.*?)',\s*amount: ([0-9.]+),\s*"
            r"interval: '(\w+)'", tblock):
        tiers[key] = (name, amount, interval)
    return items, tiers


def retag(head, house, page_dir, title, desc):
    """Rewrite whatever the shell page said about itself."""
    m = re.search(r"<title>(.*?)</title>", head)
    if not m:
        sys.exit("no <title> in the shell")
    head = head.replace(m.group(0), "<title>" + title + "</title>")
    head = re.sub(r'(<meta name="description" content=")[^"]*(")',
                  lambda x: x.group(1) + desc + x.group(2), head, count=1)
    head = re.sub(r'(<link rel="canonical" href=")[^"]*(")',
                  lambda x: x.group(1) + house["url"] + "/" + page_dir + "/" + x.group(2),
                  head, count=1)
    for prop in ('property="og:title"', 'property="og:url"', 'name="twitter:title"',
                 'property="og:description"', 'name="twitter:description"'):
        value = title if "title" in prop else (
            house["url"] + "/" + page_dir + "/" if "url" in prop else desc)
        head = re.sub(r'(<meta ' + re.escape(prop) + r' content=")[^"]*(")',
                      lambda x, v=value: x.group(1) + v + x.group(2), head, count=1)
    # the structured-data WebPage node
    head = re.sub(r'"@id": "' + re.escape(house["url"]) + r'/[^"#]*#page"',
                  '"@id": "' + house["url"] + "/" + page_dir + '/#page"', head)
    head = re.sub(r'"url": "' + re.escape(house["url"]) + r'/[^"]*/"',
                  '"url": "' + house["url"] + "/" + page_dir + '/"', head)
    head = re.sub(r'"name": "[^"]* \u00b7 ' + re.escape(house["label"]) + '"',
                  '"name": "' + title + '"', head)
    return head


def cards(items):
    out = []
    for key, name, price in items:
        out.append(
            '      <article class="shop-card" data-key="%s" data-name="%s" data-price="%s">\n'
            '        <div class="shop-card-body">\n'
            '          <h3 class="shop-card-name">%s</h3>\n'
            '          <p class="shop-card-price">&#163;%s</p>\n'
            '        </div>\n'
            '        <button type="button" class="btn btn--ghost" data-order="%s">Order</button>\n'
            '      </article>' % (key, name.replace('"', "&quot;"), price, name, price, key))
    return "\n".join(out)


# ----------------------------------------------------------------- the pages

def eg_shop(house, items, drawer):
    desc = ("The EGregoRA shop: Ed Gregory's prints, the fox and the badger. "
            "Order written down, or paid by card.")
    head, foot = head_and_foot(house["shell"])
    head = retag(head, house, "shop", "The Shop \u00b7 " + house["label"], desc)

    main = """
<main id="main">

<section class="page-head">
  <p class="kicker">What the order keeps</p>
  <h1>The Shop</h1>
  <p class="lede">A small shelf. Ed Gregory in the poses he is known for, and the
    fox and the badger who keep him company. Every order is written to the ledger
    the moment it is made.</p>
</section>

<div class="wrap">
  <section class="shop-group">
    <h2 class="kicker">The shelf</h2>
    <p class="shop-group-sub">Nine things. Press <em>Order</em> on one and the slip opens.</p>
    <div class="shop-grid">
%s
    </div>
  </section>

  <div class="frame frame--creed">
    <h2 class="kicker">How an order works</h2>
    <ol class="shop-steps">
      <li>Press <em>Order</em> on the thing you want. The order slip opens; the
        gate-word keeps the bots out.</li>
      <li>Pay by card there and then, or send the order to be followed up by hand.
        Either way it is written to the ledger first, so it cannot be lost.</li>
      <li>A confirmation follows, with a first word on timing.</li>
      <li>The goods are made or gathered, and go in the post. Tracking comes by email.</li>
    </ol>
    <p class="muted small">Returns: unworn, within thirty days, to
      <a href="mailto:shakradragon@gmail.com">shakradragon@gmail.com</a> with the order
      reference. The fox and the badger are, as ever, non-refundable in principle.</p>
  </div>
</div>
</main>
""" % cards(items)

    # The shell's scripts are the products page's. Without this the order slip
    # would open and then do nothing at all — a drawer is markup until shop.js
    # gives it hands.
    slip = '<script src="/assets/js/shop.js?v=pay1" defer></script>'
    if slip not in foot:
        foot = foot.replace("</body>", slip + "\n</body>")
    return head + "\n" + main + "\n" + drawer + "\n" + foot


def thanks(house, page_dir, title, desc):
    head, foot = head_and_foot(house["shell"])
    head = retag(head, house, page_dir, title, desc)
    main = """
<main id="main">

<section class="page-head">
  <p class="kicker">Stripe has sent you back</p>
  <h1 id="thanks-head">Checking with Stripe&hellip;</h1>
  <p class="lede" id="thanks-body">
    The card was taken by Stripe, not by this site. This page is asking Stripe
    what happened, and will say so plainly either way.
  </p>
  <p class="muted small" id="thanks-note" hidden></p>
  <p><a class="btn btn--ghost" href="/shop/">Back to the shop</a></p>
</section>

</main>

<script>
(() => {
  "use strict";
  const head = document.getElementById("thanks-head");
  const body = document.getElementById("thanks-body");
  const note = document.getElementById("thanks-note");
  const id = new URLSearchParams(location.search).get("session_id") || "";

  const settle = (t, b, n) => {
    head.textContent = t; body.textContent = b;
    if (n) { note.textContent = n; note.hidden = false; }
  };

  if (!id) {
    settle("Nothing to check",
      "No payment was named in the address, so there is nothing here to confirm. " +
      "If you did pay, the ledger will have it and a confirmation is on its way.", null);
    return;
  }

  fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "confirm", session_id: id })
  })
    .then((r) => r.json().catch(() => ({})).then((d) => ({ ok: r.ok, d })))
    .then(({ ok, d }) => {
      if (d.state === "paid" || d.state === "active") {
        settle("Thank you \\u2014 that is settled",
          "Stripe confirms the payment arrived" + (d.ref ? ", against order " + d.ref : "") +
          ". A confirmation is on its way by email, and the goods or the membership " +
          "follow from there.", null);
      } else if (d.state === "awaiting") {
        settle("Written down, not yet settled",
          "The order is safe in the ledger, but Stripe has not confirmed the payment. " +
          "That is normal for a moment or two; if it is still open in an hour, write to " +
          "shakradragon@gmail.com with the reference.", null);
      } else {
        settle("We could not confirm that",
          "Stripe would not confirm this payment, so nothing has been marked as settled. " +
          "Nothing has been lost: the order is in the ledger either way, and a note to " +
          "shakradragon@gmail.com will sort it out.",
          ok ? "" : "Ask Stripe did not answer; try this page again in a minute.");
      }
    })
    .catch(() => settle("We could not reach the ledger",
      "The order is written down either way. Give it a minute and reload this page; " +
      "if it still will not answer, write to shakradragon@gmail.com.", null));
})();
</script>
"""
    return head + "\n" + main + "\n" + foot


def membership(house, page_dir, tiers):
    head, foot = head_and_foot(house["shell"])
    head = retag(head, house, page_dir, "Membership \u00b7 " + house["label"],
                 "Paid membership and gifts for " + house["label"] + ".")

    tier_html = []
    for key, (name, amount, interval) in tiers.items():
        tier_html.append(
            '    <article class="shop-card" data-tier="%s" data-name="%s" data-amount="%s">\n'
            '      <div class="shop-card-body">\n'
            '        <h3 class="shop-card-name">%s</h3>\n'
            '        <p class="shop-card-price">&#163;%s every %s</p>\n'
            '      </div>\n'
            '      <button type="button" class="btn btn--ghost" data-join="%s">Join</button>\n'
            '    </article>' % (key, name, amount, name, amount, interval, key))

    main = """
<main id="main">

<section class="page-head">
  <p class="kicker">Keeping the lights on</p>
  <h1>Membership</h1>
  <p class="lede">Three ways to stand behind the work: a membership that renews,
    a gift that does not, or nothing at all. The pages are open either way, and
    will stay open.</p>
</section>

<div class="wrap">
  <section class="shop-group">
    <h2 class="kicker">Membership</h2>
    <p class="shop-group-sub">Billed by Stripe, at a fixed amount each period.
      Cancel any time; the record of what you paid stays honest either way.</p>
    <div class="shop-grid">
%s
    </div>
    <form class="ornate" id="join-form" novalidate>
      <p class="muted small">Choose a tier above. Membership is attached to the
        address you give here, which must be the one you give Stripe too.</p>
      <label for="join-email">Your email</label>
      <input id="join-email" name="email" type="email" required autocomplete="email">
      <label for="join-name">Your name <span class="muted">(optional)</span></label>
      <input id="join-name" name="name" type="text" maxlength="80" autocomplete="name">
      <div class="captcha" data-captcha="join">
        <p class="captcha-label">Read the gate-word and type it back</p>
        <div class="captcha-row">
          <div class="captcha-art" data-captcha-art aria-live="polite"></div>
          <button class="captcha-new" type="button" data-captcha-new title="Draw another word" aria-label="Draw another gate-word">&#8634;</button>
        </div>
        <input type="text" data-captcha-input autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="8" required aria-label="The gate-word" placeholder="The five letters above">
      </div>
      <p class="shop-form-error" id="join-error" role="alert" hidden></p>
      <p class="muted small" id="join-picked" hidden></p>
      <div class="shop-form-actions">
        <button type="submit" class="btn" id="join-submit">Join</button>
      </div>
    </form>
  </section>

  <section class="shop-group">
    <h2 class="kicker">Or give once</h2>
    <p class="shop-group-sub">A gift, at whatever you choose. No renewal, no account.</p>
    <form class="ornate" id="gift-form" novalidate>
      <label for="gift-amount">Amount (&#163;)</label>
      <input id="gift-amount" name="amount" type="number" min="1" max="5000"
        step="1" value="10" inputmode="decimal">
      <label for="gift-name">Your name <span class="muted">(optional)</span></label>
      <input id="gift-name" name="name" type="text" maxlength="80">
      <label for="gift-message">A word to go with it <span class="muted">(optional)</span></label>
      <textarea id="gift-message" name="message" rows="3" maxlength="500"></textarea>
      <label for="gift-email">Where the thanks should go</label>
      <input id="gift-email" name="email" type="email" required>
      <div class="captcha" data-captcha="gift">
        <p class="captcha-label">Read the gate-word and type it back</p>
        <div class="captcha-row">
          <div class="captcha-art" data-captcha-art aria-live="polite"></div>
          <button class="captcha-new" type="button" data-captcha-new title="Draw another word" aria-label="Draw another gate-word">&#8634;</button>
        </div>
        <input type="text" data-captcha-input autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="8" required aria-label="The gate-word" placeholder="The five letters above">
      </div>
      <p class="shop-form-error" id="gift-error" role="alert" hidden></p>
      <div class="shop-form-actions">
        <button type="submit" class="btn" id="gift-submit">Give &#163;10 by card</button>
      </div>
    </form>
  </section>

  <p class="muted small">Card details go to Stripe, never to this site. If the card
    route is not switched on at this house yet, both forms will say so rather than
    pretending.</p>
</div>
</main>

<script src="/assets/js/membership.js?v=pay1" defer></script>
""" % "\n".join(tier_html)
    return head + "\n" + main + "\n" + foot


def main():
    tti_drawer_src = open(os.path.join(ROOT, DRAWER_SRC), encoding="utf-8").read()
    # Stop at the footer's opener. Cutting at "</footer>" instead swallows the
    # whole of TTI's footer, and the last </div> inside it is the foot glyph's —
    # which leaves a second <footer> stacked on the page.
    drawer = cut(tti_drawer_src, '<div class="shop-drawer"', '<footer class="site-foot"')
    drawer = drawer.rstrip()

    for key, house in HOUSES.items():
        items, tiers = read_shelf(house["shelf"])
        out = os.path.join(ROOT, house["out"])

        if key == "eg":
            p = os.path.join(out, "shop/index.html")
            os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, "w", encoding="utf-8").write(eg_shop(house, items, drawer))
            print("wrote %s (%d products)" % (os.path.relpath(p, ROOT), len(items)))

        p = os.path.join(out, "shop/thanks/index.html")
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, "w", encoding="utf-8").write(
            thanks(house, "shop/thanks", "Thank you \u00b7 " + house["label"],
                   "Your order with " + house["label"] + "."))
        print("wrote " + os.path.relpath(p, ROOT))

        p = os.path.join(out, "membership/index.html")
        os.makedirs(os.path.dirname(p), exist_ok=True)
        open(p, "w", encoding="utf-8").write(membership(house, "membership", tiers))
        print("wrote %s (%d tiers)" % (os.path.relpath(p, ROOT), len(tiers)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
