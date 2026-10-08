#!/usr/bin/env python3
"""Keep Gink (EGregoRA) and ShakDrah (TTI) in step with the sites.

Two jobs, both idempotent, both safe to run on every build:

  1. MIRROR  — the two oracles share one corpus. Any oracle-corpus*.js that
     differs between hatchable/lib and tti/hatchable/lib is copied from the
     newer side to the older, so the dragon and the fox can never drift apart.

  2. COVERAGE — walk every built page of both sites, collect every section
     heading that carries an id (these are the things a reader can see and
     will therefore ask about), and check that the corpus has an answer whose
     question or keys plausibly cover it. Anything uncovered is reported.

Usage:
    python3 scripts/oracle-sync.py            # report
    python3 scripts/oracle-sync.py --strict   # exit 1 if anything is uncovered
    python3 scripts/oracle-sync.py --mirror-only

The coverage test is deliberately crude (content-word overlap). It is not
trying to judge an answer; it is trying to make sure no section of either site
can be published without somebody having written the oracle a line about it.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIBS = (ROOT / "hatchable" / "lib", ROOT / "tti" / "hatchable" / "lib")
SITES = {
    "egregora": ROOT / "_site",
    "tti": ROOT / "tti" / "_site",
}

STOP = set("""a an and are as at be been but by for from has have how in into is it its of on or
that the their them there these they this to was what when where which who why will with you your
does do did not no nor if then than so such over under about between within without page part
section one two three four five six seven eight nine ten first second third""".split())

# Headings that are furniture rather than content; asking the oracle about
# "Terms" or "Reading" is not a thing a reader does.
SKIP_HEADINGS = {
    "terms", "reading", "glossary", "sources", "earned chosen refused",
    "earned", "chosen", "refused", "chosen and refused", "what would break it",
    "the ledger", "index", "contents", "notes",
}


def words(text: str) -> set[str]:
    return {w for w in re.findall(r"[a-z]+", text.lower()) if w not in STOP and len(w) > 2}


# ---------------------------------------------------------------- 1. mirror
def mirror() -> list[str]:
    a, b = LIBS
    moved = []
    names = {p.name for p in a.glob("oracle-corpus*.js")} | {
        p.name for p in b.glob("oracle-corpus*.js")
    }
    for name in sorted(names):
        pa, pb = a / name, b / name
        if pa.exists() and pb.exists():
            if pa.read_bytes() == pb.read_bytes():
                continue
            src, dst = (pa, pb) if pa.stat().st_mtime >= pb.stat().st_mtime else (pb, pa)
        elif pa.exists():
            src, dst = pa, pb
        else:
            src, dst = pb, pa
        shutil.copy2(src, dst)
        moved.append(f"{name}: {src.parent.relative_to(ROOT)} -> {dst.parent.relative_to(ROOT)}")
    return moved


# ---------------------------------------------------------------- 2. corpus
def load_corpus() -> list[dict]:
    """Import the corpus through node so the single source of truth is the JS."""
    lib = (LIBS[1] / "oracle-corpus.js").as_posix()
    out = subprocess.run(
        ["node", "-e",
         f"import('file://{lib}').then(m=>process.stdout.write(JSON.stringify("
         "m.ANSWERS.map(x=>({q:x.q,keys:x.keys,limb:x.limb,n:(x.a||'').length})))))"],
        capture_output=True, text=True, cwd=ROOT,
    )
    if out.returncode != 0:
        print(out.stderr.strip()[:800], file=sys.stderr)
        raise SystemExit("oracle-sync: could not import the corpus")
    return json.loads(out.stdout)


def headings(site: Path) -> list[tuple[str, str, str]]:
    found = []
    if not site.exists():
        return found
    for f in sorted(site.rglob("index.html")):
        slug = "/" + f.parent.relative_to(site).as_posix().strip(".") + "/"
        slug = slug.replace("//", "/")
        html = f.read_text(errors="ignore")
        for m in re.finditer(r'<h[23][^>]*\bid="([^"]+)"[^>]*>(.*?)</h[23]>', html, re.S):
            hid, raw = m.group(1), m.group(2)
            title = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", raw)).strip()
            title = title.replace("&mdash;", "-").replace("&rsquo;", "'")
            if not title or title.lower().strip(" :.") in SKIP_HEADINGS:
                continue
            found.append((slug, hid, title))
    return found


def covered(title: str, corpus_words: list[set[str]]) -> bool:
    w = words(title)
    if not w:
        return True
    for cw in corpus_words:
        hit = len(w & cw)
        if hit >= max(2, round(0.6 * len(w))) or (len(w) <= 2 and hit == len(w)):
            return True
    return False


def main() -> int:
    argv = sys.argv[1:]
    if "--check" in argv:
        a, b = LIBS
        bad = [n.name for n in sorted(a.glob("oracle-corpus*.js"))
               if not (b / n.name).exists() or (b / n.name).read_bytes() != n.read_bytes()]
        bad += [n.name for n in sorted(b.glob("oracle-corpus*.js")) if not (a / n.name).exists()]
        if bad:
            print("oracle-sync: Gink and ShakDrah have DIVERGED: " + ", ".join(sorted(set(bad))))
            print("run: python3 scripts/oracle-sync.py")
            return 1
        print("oracle-sync: Gink and ShakDrah carry an identical corpus")
        return 0
    moved = mirror()
    print(f"mirror: {len(moved)} file(s) synchronised between Gink and ShakDrah")
    for m in moved:
        print(f"  {m}")
    if "--mirror-only" in argv:
        return 0

    corpus = load_corpus()
    print(f"corpus: {len(corpus)} answers, shared by both oracles")
    cwords = [words(c["q"] + " " + " ".join(c.get("keys") or [])) for c in corpus]

    gaps = 0
    for name, site in SITES.items():
        hs = headings(site)
        missing = [(s, i, t) for s, i, t in hs if not covered(t, cwords)]
        print(f"\n{name}: {len(hs)} addressable sections, {len(missing)} without an obvious answer")
        for slug, hid, title in missing:
            print(f"  [ ] {slug}#{hid}  {title}")
        gaps += len(missing)

    if gaps and "--strict" in argv:
        print(f"\noracle-sync: {gaps} uncovered section(s) - write them before deploying")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
