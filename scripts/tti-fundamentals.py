#!/usr/bin/env python3
"""Wrap the six load-bearing plates of the TTI site in the fundamentals callout.

Fundamental I is written inline in tti/src/index.njk. II to VI are applied here
by wrapping a named <figure> on each page. Idempotent: re-running replaces the
wrapper rather than nesting another one.

The splice page is generated, so its callout lives in the generator; this script
only handles the hand-maintained chapters.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "tti" / "src"

OPEN_RE = '<aside class="fundamental" aria-labelledby="t-fundamental-{slug}">'


def block(slug, tag, heading, body, foot):
    return (
        f'<aside class="fundamental" aria-labelledby="t-fundamental-{slug}">\n'
        f'    <p class="fundamental-tag">Fundamental&nbsp;{tag}</p>\n'
        f'    <div class="fundamental-head">\n'
        f'      <h3 id="t-fundamental-{slug}">{heading}</h3>\n'
        f'      {body}\n'
        f'    </div>\n\n  '
    ), (
        f'\n\n    <p class="fundamental-foot">{foot}</p>\n  </aside>'
    )


FUNDAMENTALS = [
    dict(
        page="the-self", fig="fig-integral", slug="two", tag="II",
        heading="A self is an operation, not a thing.",
        body="<p>The second fundamental, and the one readers resist hardest. Nothing in this work "
             "treats a self as a substance that persists and occasionally changes. A self is an "
             "<em>integral</em>: a running sum, taken continuously, over moments too small to be "
             "experienced individually. <strong>If you keep picturing a thing rather than an "
             "operation, the chapters on the splice, the seam and the ledger will all read as "
             "mysticism</strong> &mdash; because each of them is about what happens to a sum, not "
             "about what happens to an object.</p>",
        foot="Hold on to one sentence: <strong>a life is not something that lasts, it is a sum that "
             "keeps being taken</strong> &mdash; and the grain it is taken at is set by the body, not "
             "chosen by the mind.",
    ),
    dict(
        page="torus", fig="fig-torus", slug="four", tag="IV",
        heading="Return, without repetition. This is the only shape that allows both.",
        body="<p>A circle can come back but cannot keep count: every point on it is identical to "
             "itself on every pass, so a circle has no way to carry history. Curve that loop around a "
             "second loop and a path acquires two winding numbers, and the pair of them is a memory. "
             "<strong>The torus is the smallest shape that can both return and accumulate</strong>, "
             "which is why the framework needs π applied twice rather than once, and why every later "
             "structure &mdash; the densities, the ascent, the non-contractible loop that carries the "
             "geometric phase &mdash; is drawn on one.</p>",
        foot="Hold on to one sentence: <strong>a density is a turn, not a place</strong> &mdash; and "
             "the only reason an ascent can happen without anything ever leaving is that the surface "
             "it climbs is a torus.",
    ),
    dict(
        page="moebius", fig="fig-twist", slug="five", tag="V",
        heading="One half-twist, and inside becomes outside without a boundary being crossed.",
        body="<p>The circle, the torus and the complex plane are places to be. The M&ouml;bius strip is "
             "the fourth object and the odd one out: it is a <em>transition</em>, the surface of the "
             "moment when what was outside one level becomes inside the next. <strong>i is that strip "
             "caught mid-twist</strong> &mdash; not imaginary in the sense of being unreal, but "
             "imaginary in the sense of being a quarter of the way through an inversion, since i&sup2; "
             "= &minus;1 completes the turn. Collapse, CP violation, confinement and the handedness of "
             "galaxies are all read off this one operation.</p>",
        foot="Hold on to one sentence: <strong>the twist does not produce one oriented thing, it "
             "produces an inverted pair sharing a single surface</strong> &mdash; which is why colour "
             "is never seen alone, and why the sky may carry a plane where handedness reverses.",
    ),
    dict(
        page="cosmic-ledger", fig="fig-poles", slug="six", tag="VI",
        heading="The universe is a structured zero, and its three poles are three degrees of completion.",
        body="<p>The last fundamental is the one that turns geometry into arithmetic. Model the cosmos "
             "as a meromorphic function on the Riemann sphere and the Global Residue Theorem requires "
             "the total residue to vanish: the universe sums to nothing, but it is a nothing with "
             "structure. <strong>The three poles are not three substances; they are one process caught "
             "at three stages</strong> of the chain α &rarr; π &rarr; π/2 &rarr; i &mdash; which is why "
             "dark matter must gravitate and must not shine, and why the dark sector needs no new "
             "particle to be dark.</p>",
        foot="Hold on to one sentence: <strong>68.10, 26.95 and 4.95 are not three ingredients but "
             "three degrees of completion</strong> &mdash; and the number that would refute this is a "
             "single clean direct detection.",
    ),
]


def wrap(page, fig, slug, tag, heading, body, foot):
    path = SRC / f"{page}.njk"
    text = path.read_text()
    opener, closer = block(slug, tag, heading, body, foot)

    # strip any previous wrapper for this slug
    text = re.sub(
        re.escape(OPEN_RE.format(slug=slug)) + r".*?</h3>\n.*?</div>\n\n  ",
        "", text, flags=re.S,
    )
    text = re.sub(r'\n\n    <p class="fundamental-foot">.*?</p>\n  </aside>', "", text, flags=re.S)

    start = text.index(f'<figure id="{fig}"')
    # back up to the start of that line so indentation survives
    line_start = text.rfind("\n", 0, start) + 1
    end = text.index("\n  </figure>", start) + len("\n  </figure>")

    text = text[:line_start] + opener + text[line_start:end] + closer + text[end:]
    path.write_text(text)
    print(f"Fundamental {tag:>3} -> tti/src/{page}.njk ({fig})")


def main():
    for f in FUNDAMENTALS:
        wrap(**f)


if __name__ == "__main__":
    main()
