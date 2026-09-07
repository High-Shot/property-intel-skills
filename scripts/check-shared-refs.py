#!/usr/bin/env python3
"""
check-shared-refs.py — guard for synced shared references across skills.

Some reference files are intentionally duplicated into each skill so that a
downloaded, self-contained `.skill` package can reach them at runtime (a
packaged skill cannot read a repo-root shared file). The trade-off is that the
copies must be kept byte-identical by hand.

This script asserts that every such shared reference is byte-identical across
all three skills. It is run in CI and can be run locally before committing:

    python3 scripts/check-shared-refs.py

Exit code 0 = all synced. Non-zero = a copy has drifted (the report names the
offending files and their hashes). When you edit one copy, edit all of them.
"""

import hashlib
import sys
from pathlib import Path

# Reference filenames that MUST stay byte-identical across every skill that
# ships them. Only files that are genuinely a single shared source belong here.
# (data_schema.md, data_sources.md, rates_and_anchors.md intentionally DIFFER
# per skill and must NOT be listed.)
SHARED_REFERENCES = [
    "property_facts.md",
]

REPO_ROOT = Path(__file__).resolve().parent.parent
SKILLS_DIR = REPO_ROOT / "skills"


def main() -> int:
    if not SKILLS_DIR.is_dir():
        print(f"ERROR: no skills/ directory found at {SKILLS_DIR}", file=sys.stderr)
        return 2

    failures = 0

    for ref_name in SHARED_REFERENCES:
        copies = sorted(SKILLS_DIR.glob(f"*/references/{ref_name}"))
        if len(copies) < 2:
            print(
                f"ERROR: expected {ref_name} in at least 2 skills, found "
                f"{len(copies)}: {[str(p.relative_to(REPO_ROOT)) for p in copies]}",
                file=sys.stderr,
            )
            failures += 1
            continue

        digests = {}
        for path in copies:
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            digests.setdefault(digest, []).append(path.relative_to(REPO_ROOT))

        if len(digests) == 1:
            digest = next(iter(digests))
            print(f"OK: {ref_name} identical across {len(copies)} skills ({digest[:12]}).")
        else:
            failures += 1
            print(f"FAIL: {ref_name} has drifted across skills:", file=sys.stderr)
            for digest, paths in sorted(digests.items()):
                print(f"  {digest[:12]}  ->  {', '.join(str(p) for p in paths)}", file=sys.stderr)
            print(
                f"  Fix: make every copy of {ref_name} byte-identical, then re-run.",
                file=sys.stderr,
            )

    if failures:
        print(f"\n{failures} shared-reference check(s) failed.", file=sys.stderr)
        return 1

    print("\nAll shared references are in sync.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
