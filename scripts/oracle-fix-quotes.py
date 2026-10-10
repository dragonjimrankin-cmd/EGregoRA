#!/usr/bin/env python3
"""Repair apostrophes in oracle corpus question strings.

Entry questions are written as single-quoted JavaScript strings, so an
apostrophe inside one ends the string and the whole volume fails to load:

    'What is the framework's thesis, exactly?',   // SyntaxError

The typographic apostrophe is the correct character for this in any case, so
internal apostrophes in question strings are rewritten to U+2019 and the
delimiter stays a straight quote. Answer bodies are backtick-quoted and are
left alone, as are the keys arrays (which are short lowercase phrases and
should not contain apostrophes at all — those are reported rather than
silently rewritten, because a stray one there usually means a typo).

    python3 scripts/oracle-fix-quotes.py            # report
    python3 scripts/oracle-fix-quotes.py --fix      # rewrite in place
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIX = "--fix" in sys.argv

QUESTION_LINE = re.compile(r"^( *)'(.*)',\s*$")
ENTRY_LINE = re.compile(r"^\s*E\('([a-z0-9-]+)'")

total_fixed = 0
problems: list[str] = []

for path in sorted((ROOT / "hatchable" / "lib").glob("oracle-corpus*.js")):
    lines = path.read_text().split("\n")
    changed = 0
    in_entry = False

    for i, line in enumerate(lines):
        if ENTRY_LINE.match(line):
            in_entry = True
            continue
        if not in_entry:
            continue

        m = QUESTION_LINE.match(line)
        if not m:
            continue

        indent, inner = m.group(1), m.group(2)
        # Only the question line sits between the E( line and the answer body,
        # and it is the only one matching this shape before a backtick line.
        if "'" in inner:
            fixed = inner.replace("'", "\u2019")
            lines[i] = f"{indent}'{fixed}',"
            changed += 1
            print(f"  {path.name}:{i + 1}  {inner[:64]}")
        in_entry = False

    if changed:
        total_fixed += changed
        if FIX:
            path.write_text("\n".join(lines))

# Keys arrays: report only.
for path in sorted((ROOT / "hatchable" / "lib").glob("oracle-corpus*.js")):
    for i, line in enumerate(path.read_text().split("\n"), 1):
        if not line.lstrip().startswith("E("):
            continue
        keyblock = line.split("[", 1)[-1].rsplit("]", 1)[0] if "[" in line else ""
        for key in re.findall(r"'([^']*)'", keyblock):
            if "\u2019" in key or '"' in key:
                problems.append(f"{path.name}:{i} key {key!r}")

print()
if problems:
    print(f"{len(problems)} key strings worth a look:")
    for p in problems[:20]:
        print("  " + p)
else:
    print("key strings clean")

print(f"\n{total_fixed} question string(s) {'repaired' if FIX else 'need repair (pass --fix)'}")
