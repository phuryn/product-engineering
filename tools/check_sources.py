#!/usr/bin/env python3
"""check_sources.py — what changed upstream since each skill was taken.

Reads sources.json and, for every skill with an upstream, lists the upstream
commits after its recorded `ref` that touched its source `paths`. Those are the
candidates to port. Nothing is changed.

sources.json is public and records only public upstreams. Private upstreams, the
products, and the skills taken from them are in sources.local.json beside it, which
is never committed; it is merged in when present, and the report says when it isn't.

Each upstream needs a local clone. By default the tool looks for a sibling of
this repository named after the GitHub repo (../pm-skills, ../work-humanizer);
set PRODUCT_ENGINEERING_SOURCES (os.pathsep-separated "name=path" pairs) to point
elsewhere, e.g. PRODUCT_ENGINEERING_SOURCES="pm-skills=D:/work/pm-skills". An upstream marked
`"tracked": false` was a one-time copy: its entries record provenance and are skipped.

    python tools/check_sources.py              # fetch, then report
    python tools/check_sources.py --no-fetch   # report from what is already fetched
    python tools/check_sources.py --skill grok-agents

Products built with these skills are where most lessons are learned, and they land in the
product's own docs and commit bodies, never in its copies of the skills (2026-10-25: one
product's four-day build produced about 140 lessons while its skill copies stayed identical).
`--harvest` lists each product's commits since its `harvested` ref, oldest first, with `*`
on those that touched its `process_paths`; `--bodies` prints the commit bodies too. Run it at
each product release, port what is general, then move `harvested`.

    python tools/check_sources.py --harvest --bodies
"""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOCAL = ROOT / "sources.local.json"


def load_sources():
    """sources.json, with sources.local.json merged in when it exists: (data, has_local)."""
    data = json.loads((ROOT / "sources.json").read_text(encoding="utf-8"))
    data.setdefault("products", {})
    if not LOCAL.exists():
        return data, False
    local = json.loads(LOCAL.read_text(encoding="utf-8"))
    data["upstreams"].update(local.get("upstreams", {}))
    data["products"].update(local.get("products", {}))
    data["skills"] += local.get("skills", [])
    return data, True


def local_clones(upstreams):
    over = {}
    for pair in filter(None, os.environ.get("PRODUCT_ENGINEERING_SOURCES", "").split(os.pathsep)):
        name, _, path = pair.partition("=")
        over[name.strip()] = Path(path.strip())
    out = {}
    for name, up in upstreams.items():
        out[name] = over.get(name) or ROOT.parent / up.get("local", up["github"].split("/")[-1])
    return out


def git(repo, *args):
    p = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True, encoding="utf-8")
    return p.returncode, p.stdout.strip(), p.stderr.strip()


def harvest(data, fetch, bodies):
    products = data.get("products", {})
    clones = local_clones(products)
    total, missing = 0, []
    for name, prod in products.items():
        repo = clones[name]
        if not (repo / ".git").exists():
            print(f"! {name}: no local clone at {repo} (set PRODUCT_ENGINEERING_SOURCES)")
            missing.append(name)
            continue
        if fetch:
            code, _, err = git(repo, "fetch", "-q", "origin", prod["branch"])
            if code:
                print(f"! {name}: fetch failed: {err}")
        rng = f"{prod['harvested']}..origin/{prod['branch']}"
        code, out, err = git(repo, "log", "--reverse", "--no-merges", "--format=%h", rng)
        if code:
            print(f"! {name}: git log {rng} failed: {err}")
            continue
        commits = out.split()
        _, touched, _ = git(repo, "log", "--no-merges", "--format=%h", rng, "--", *prod.get("process_paths", []))
        touched = set(touched.split())
        total += len(commits)
        print(f"\n{name}  {prod['github']}  {len(commits)} commit(s) since {prod['harvested']} "
              f"(harvested {prod.get('harvested_on', '?')}), {len(touched)} touching process docs")
        for h in commits:
            _, line, _ = git(repo, "log", "-1", "--date=short", "--format=%h %ad %s", h)
            print(f"  {'*' if h in touched else ' '} {line}")
            if bodies:
                _, body, _ = git(repo, "log", "-1", "--format=%b", h)
                for b in body.splitlines():
                    if b.strip() and not b.startswith("Co-Authored-By"):
                        print(f"        {b}")
    print(f"\n{total} product commit(s) to read." if total else "\nNothing new in the products since the last harvest.")
    if missing:
        print(f"INCOMPLETE: not checked: {', '.join(missing)}. Set PRODUCT_ENGINEERING_SOURCES.")
        return 1


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--no-fetch", action="store_true", help="don't fetch upstreams first")
    ap.add_argument("--skill", help="only skills whose path contains this text")
    ap.add_argument("--harvest", action="store_true", help="list product commits since the last harvest instead")
    ap.add_argument("--bodies", action="store_true", help="with --harvest, print commit bodies too")
    args = ap.parse_args()

    data, has_local = load_sources()
    if not has_local:
        print(f"! no {LOCAL.name}: private upstreams and products are not checked")
    if args.harvest:
        if not data["products"]:
            print(f"INCOMPLETE: no products to harvest; they are listed in {LOCAL.name}.")
            return 1
        return harvest(data, not args.no_fetch, args.bodies)
    clones = local_clones(data["upstreams"])
    fetched, missing, pending = set(), set(), 0
    untracked = sorted(n for n, up in data["upstreams"].items() if up.get("tracked") is False)

    for entry in data["skills"]:
        if args.skill and args.skill not in entry["skill"]:
            continue
        name = entry.get("upstream")
        if not name or "ref" not in entry or not entry.get("paths"):
            continue
        up, repo = data["upstreams"][name], clones[name]
        if name in untracked:
            continue
        if not (repo / ".git").exists():
            if name not in missing:
                print(f"! {name}: no local clone at {repo} (set PRODUCT_ENGINEERING_SOURCES)")
                missing.add(name)
            continue
        if not args.no_fetch and name not in fetched:
            code, _, err = git(repo, "fetch", "-q", "origin", up["branch"])
            if code:
                print(f"! {name}: fetch failed: {err}")
            fetched.add(name)
        rng = f"{entry['ref']}..origin/{up['branch']}"
        code, out, err = git(repo, "log", "--oneline", "--no-merges", rng, "--", *entry["paths"])
        if code:
            print(f"! {entry['skill']}: git log {rng} failed: {err}")
            continue
        skipped = set(entry.get("skipped", {}))
        commits = [line for line in out.splitlines() if line and line.split()[0] not in skipped]
        if commits:
            pending += len(commits)
            print(f"\n{entry['skill']}  <- {up['github']} {', '.join(entry['paths'])}")
            for line in commits:
                print(f"    {line}")

    print(f"\n{pending} upstream commit(s) to look at." if pending else "\nNothing upstream since the recorded refs.")
    if untracked:
        print(f"Not tracked, one-time copies: {', '.join(untracked)} (`tracked: false`).")
    # A missing clone is not "nothing upstream" (2026-10-27: an upstream outside the default
    # sibling folder was skipped on every run, and the count above read as complete).
    if missing:
        print(f"INCOMPLETE: not checked: {', '.join(sorted(missing))}. Set PRODUCT_ENGINEERING_SOURCES.")
        return 1
    if not has_local:
        print(f"INCOMPLETE: private upstreams not checked (no {LOCAL.name}).")
        return 1


if __name__ == "__main__":
    sys.exit(main())
