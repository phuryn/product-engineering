#!/usr/bin/env python3
"""check_budgets.py - word budgets and review dates for an agent's instruction files.

Reads budgets.json at the repository root: {"AGENTS.md": 1500, "docs/knowledge/*.md": 1000}. A key is a path or a
glob, relative to the root; a file matched by several keys takes the first. For each file it

  a. counts words (like `wc -w`) and fails when the count is over the budget;
  b. lists every "(review YYYY-MM)" whose month has passed, so the rule is earned again or deleted.

Exit 0 when every file is within its budget, 1 otherwise (past review dates are listed but do not fail, so a pass
can read them in one go). Run it in the test gate, and from a write-time hook (the guardrail-hooks skill) so an edit
that crosses a budget is refused when it is made.

    python check_budgets.py [--root DIR] [--today YYYY-MM]
"""
import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path

REVIEW = re.compile(r"\(review (\d{4})-(\d{2})\)")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--root", default=".", help="repository root holding budgets.json")
    ap.add_argument("--today", help="YYYY-MM to check review dates against (default: this month)")
    args = ap.parse_args()
    root = Path(args.root).resolve()
    cfg = root / "budgets.json"
    if not cfg.exists():
        print(f"no budgets.json in {root}", file=sys.stderr)
        return 1
    budgets = json.loads(cfg.read_text(encoding="utf-8"))
    month = args.today or dt.date.today().strftime("%Y-%m")

    seen, over = {}, 0
    for key, limit in budgets.items():
        for path in sorted(root.glob(key)):
            if path.is_file() and path not in seen:
                seen[path] = (key, int(limit))
    if not seen:
        print("budgets.json matches no file", file=sys.stderr)
        return 1

    for path, (key, limit) in seen.items():
        text = path.read_text(encoding="utf-8")
        words = len(text.split())
        rel = path.relative_to(root).as_posix()
        mark = "OVER" if words > limit else "ok"
        over += words > limit
        print(f"{mark:4}  {words:6} / {limit:<6} {rel}")
        for n, line in enumerate(text.splitlines(), 1):
            for y, m in REVIEW.findall(line):
                if f"{y}-{m}" < month:
                    print(f"      past review {y}-{m}: {rel}:{n}")
    print(f"result: {'ok' if not over else f'{over} file(s) over budget'}")
    return 1 if over else 0


if __name__ == "__main__":
    sys.exit(main())
