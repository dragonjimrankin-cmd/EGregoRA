#!/usr/bin/env python3
"""Keep labels in the vector plates readable without pinch-zooming.

Infographic SVGs are rendered at a stable width (up to 640 CSS pixels) and
labels below a 12-pixel physical size are raised to the equivalent SVG user
size. Narrow screens can pan across a plate instead of shrinking its text.
The source and Hatchable copies are both normalised so a direct deploy and a
future Eleventy build have the same result. This script is idempotent.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SVG_BLOCK = re.compile(r"<svg\b[^>]*>.*?</svg\s*>", re.I | re.S)
VIEWBOX = re.compile(r"\bviewBox\s*=\s*([\"'])(.*?)\1", re.I | re.S)
FONT_ATTR = re.compile(
    r"(\bfont-size\s*=\s*)([\"'])([+-]?(?:\d+(?:\.\d*)?|\.\d+))([a-zA-Z%]*)([\"'])",
    re.I,
)
FONT_STYLE = re.compile(
    r"(\bfont-size\s*:\s*)([+-]?(?:\d+(?:\.\d*)?|\.\d+))([a-zA-Z%]*)",
    re.I,
)
FONT_TEMPLATE = re.compile(r"(\bfont-size\s*=\s*)([\"'])(.*?)\2", re.I | re.S)
TEMPLATE_NUMBER = re.compile(r"(?<![\w.])([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?![\w.])")
STYLE_ATTR = re.compile(r"\bstyle\s*=\s*([\"'])(.*?)\1", re.I | re.S)
CLASS_ATTR = re.compile(r"\bclass\s*=\s*([\"'])(.*?)\1", re.I | re.S)


def is_plate_svg(text: str, start: int, opening: str) -> bool:
    classes = CLASS_ATTR.search(opening)
    if classes and re.search(r"(?:^|\s)svg-info(?:\s|$)", classes.group(2)):
        return True
    if re.search(r"\bdata-plate-readable\b", opening, re.I):
        return True

    # Most plates have a .plate-art wrapper immediately around the SVG. A
    # small number of the hand-drawn gallery cards place .svg-info directly
    # in a figure, handled above.
    before = text[max(0, start - 1200):start]
    art = before.rfind("class=\"plate-art")
    if art < 0:
        art = before.rfind("class='plate-art")
    if art >= 0:
        open_at = before.rfind("<div", 0, art)
        if open_at > before.rfind("</div>", 0, start - max(0, start - 1200)):
            return True
        # The wrapper is normally the nearest open div. Do not let a plate
        # from an earlier sibling classify an unrelated SVG.
        if before.rfind("</div>", art) < before.rfind("<div", 0, art):
            return True
        if re.search(r"<div\b[^>]*class=[\"'][^\"']*\bplate-art\b[^\"']*[\"'][^>]*>\s*$", before, re.I):
            return True

    # Some templates put the SVG directly in a figure. Only classify it when
    # the most recent figure is a plate and has not closed yet.
    figure_at = before.rfind("<figure")
    if figure_at > before.rfind("</figure>"):
        figure_open = before[figure_at:]
        cls = CLASS_ATTR.search(figure_open.split(">", 1)[0])
        if cls and re.search(r"(?:^|\s)plate(?:\s|$)", cls.group(2)):
            return True
    return False


def viewbox_width(opening: str) -> float | None:
    match = VIEWBOX.search(opening)
    if not match:
        return None
    values = re.split(r"[\s,]+", match.group(2).strip())
    if len(values) < 4:
        return None
    try:
        width = float(values[2])
    except ValueError:
        return None
    return width if width > 0 else None


def number(value: float) -> str:
    return f"{value:.1f}".rstrip("0").rstrip(".")


def normalise_svg(block: str) -> tuple[str, bool]:
    opening_end = block.find(">")
    if opening_end < 0:
        return block, False
    opening = block[:opening_end + 1]
    body = block[opening_end + 1:]
    width = viewbox_width(opening)
    if width is None:
        return block, False

    target_width = min(width, 640.0)
    min_user_size = 12.0 * width / target_width
    style_match = STYLE_ATTR.search(opening)
    preserved_styles: list[str] = []
    if style_match:
        for declaration in style_match.group(2).split(";"):
            if not declaration.strip():
                continue
            prop = declaration.split(":", 1)[0].strip().lower()
            if prop not in {"width", "max-width", "height"}:
                preserved_styles.append(declaration.strip())

    layout_styles = [f"width: {number(target_width)}px", "max-width: none", "height: auto"]
    style_value = "; ".join(preserved_styles + layout_styles)
    if style_match:
        opening = opening[:style_match.start(2)] + style_value + opening[style_match.end(2):]
    else:
        opening = opening[:-1] + f' style="{style_value}">'

    if not re.search(r"\bdata-plate-readable\s*=", opening, re.I):
        opening = opening[:-1] + ' data-plate-readable="true">'

    def lift(match: re.Match[str]) -> str:
        raw = match.group(3)
        unit = match.group(4)
        try:
            size = float(raw)
        except ValueError:
            return match.group(0)
        if unit.lower() in {"em", "rem", "%", "pt", "pc", "ex", "ch"} or size >= min_user_size:
            return match.group(0)
        return match.group(1) + match.group(2) + number(min_user_size) + unit + match.group(5)

    body = FONT_ATTR.sub(lift, body)

    def lift_style(match: re.Match[str]) -> str:
        try:
            size = float(match.group(2))
        except ValueError:
            return match.group(0)
        if match.group(3).lower() in {"em", "rem", "%", "pt", "pc", "ex", "ch"} or size >= min_user_size:
            return match.group(0)
        return match.group(1) + number(min_user_size) + match.group(3)

    body = FONT_STYLE.sub(lift_style, body)

    # Nunjucks plates may decide a label size while rendering, after the
    # source scan (for example: {{ 10 if isMajor else 8 }}). Raise numeric
    # branches in that font-size expression too, so generated HTML cannot
    # reintroduce labels below the physical-size floor.
    def lift_template(match: re.Match[str]) -> str:
        value = match.group(3)
        if "{{" not in value or "}}" not in value:
            return match.group(0)
        expression = value

        def lift_literal(literal: re.Match[str]) -> str:
            try:
                size = float(literal.group(1))
            except ValueError:
                return literal.group(0)
            return number(min_user_size) if size < min_user_size else literal.group(0)

        expression = TEMPLATE_NUMBER.sub(lift_literal, expression)
        return match.group(1) + match.group(2) + expression + match.group(2)

    body = FONT_TEMPLATE.sub(lift_template, body)
    return opening + body, True


def process_file(path: Path, check: bool) -> tuple[int, bool]:
    original = path.read_text(encoding="utf-8")
    changed = False
    plates = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal changed, plates
        block = match.group(0)
        if not is_plate_svg(original, match.start(), block[:block.find(">") + 1]):
            return block
        updated, targeted = normalise_svg(block)
        if targeted:
            plates += 1
            if updated != block:
                changed = True
            return updated
        return block

    rendered = SVG_BLOCK.sub(replace, original)
    if changed and not check:
        path.write_text(rendered, encoding="utf-8")
    return plates, changed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="*", help="source/output directories or files (default: all four site trees)")
    parser.add_argument("--check", action="store_true", help="report stale infographic SVGs without rewriting them")
    args = parser.parse_args()
    targets = [Path(p) if Path(p).is_absolute() else ROOT / p for p in args.paths]
    if not targets:
        targets = [ROOT / p for p in ("src", "hatchable/public", "tti/src", "tti/hatchable/public")]

    total = 0
    stale: list[str] = []
    for target in targets:
        if target.is_file():
            candidates = [target]
        elif target.is_dir():
            candidates = [p for p in target.rglob("*") if p.is_file() and p.suffix.lower() in {".njk", ".html"}]
        else:
            print(f"missing path: {target}", file=sys.stderr)
            return 2
        for path in candidates:
            plates, changed = process_file(path, args.check)
            total += plates
            if changed:
                stale.append(str(path.relative_to(ROOT)))

    action = "needs normalising" if args.check else "normalised"
    print(f"{total} infographic SVGs checked; {len(stale)} file(s) {action}.")
    if stale:
        for path in stale[:40]:
            print(f"  {path}")
        if len(stale) > 40:
            print(f"  ... and {len(stale) - 40} more")
    return 1 if args.check and stale else 0


if __name__ == "__main__":
    raise SystemExit(main())
