#!/usr/bin/env python3
"""validate.py — the checks every commit to this collection passes.

- Every plugin in .claude-plugin/marketplace.json has a manifest whose name matches.
- Every skill: SKILL.md with frontmatter; `name` equals its folder; `description`
  present and at most 1024 characters (the Agent Skills limit).
- No plugin commands: Codex doesn't load them, so a workflow the user starts is a user-invoked skill.
- Every skill says how to tell it worked (`## How you can tell it worked`), and every file its
  SKILL.md names under references/, scripts/ and the like exists in its own folder (or in the
  skill named on the same line): a skill works from its folder alone.
- A user-invoked skill carries both flags: `disable-model-invocation: true` in SKILL.md (Claude
  Code) and `agents/openai.yaml` with `allow_implicit_invocation: false` (Codex). Either alone
  leaves the description in the other agent's context.
- The descriptions of the skills an agent can load on its own total at most MAX_LISTED characters,
  each at most MAX_LISTED_EACH: those are always in context, and both agents cut them to a budget.
- Every "the `x` skill" names a skill in the collection, and none names a user-invoked one: an
  agent cannot load those, so other skills name their command instead.
- No generated clutter (__pycache__, .pyc) in the tree.
- No leaks into any tracked file: local paths, the author's names outside their allowed places, and
  the private product and repository names listed in tools/leaks.local.txt (untracked: the public
  repository must not carry the list itself).
- No reference a reader cannot resolve: "the template", `AGENTS.md § <n>`, name-mapping notes.
- `claude plugin validate .` passes, when the Claude Code CLI is installed.

    python tools/validate.py
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_DESCRIPTION = 1024
# Always-loaded descriptions (AGENTS.md, rule 7). 6,000 characters, names included, is about 2,600 tokens.
MAX_LISTED = 6000
MAX_LISTED_EACH = 300

# Names that must never reach the repository outside their allowed places (AGENTS.md, rule 1).
# Matched case-insensitively. Private names are not listed here: this file is public, so they
# live in tools/leaks.local.txt (untracked), one regular expression a line.
LEAKS = [r"\bStaygreen\b", r"productcompass\.pm", r"[A-Za-z]:[\\/](GitHub|Users)[\\/]", r"\bTPC\b"]
LOCAL_LEAKS = ROOT / "tools" / "leaks.local.txt"
if LOCAL_LEAKS.exists():
    LEAKS += [s.strip() for s in LOCAL_LEAKS.read_text(encoding="utf-8").splitlines()
              if s.strip() and not s.lstrip().startswith("#")]
# A leak pattern allowed in named places only, each with the owner's decision (AGENTS.md, rule 1).
# The places are regular expressions matched against the whole repository-relative path.
LEAK_EXCEPTIONS = {
    # The author's public monitoring product, named in its own adapter and in that skill's README
    # line, each with a disclosure, and in the rule that allows it (owner, 2026-10-27).
    r"\bStaygreen\b": (r"app-stack/skills/uptime-monitoring/.*", r"app-stack/README\.md", r"AGENTS\.md"),
    # The author's newsletter: linked from the root and pack READMEs; the author's address in the manifests.
    r"productcompass\.pm": (r"(?:[^/]+/)?README\.md", r"(?:[^/]+/)?\.claude-plugin/[^/]+\.json"),
}
# References a reader can't resolve, because they don't have the template these skills came
# from (AGENTS.md, rule 4). Matched case-insensitively.
UNRESOLVED = [r"\bthe template\b", r"\btemplate's\b", r"AGENTS\.md\s*§\s*\d", r"names in these files"]

errors, warnings = [], []


def frontmatter(text):
    """Parse a skill's frontmatter: with PyYAML when installed (what agents' loaders do),
    else a flat key: value reader that handles block scalars."""
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    if end == -1:
        return None
    try:
        import yaml
        data = yaml.safe_load(text[3:end])
        if not isinstance(data, dict):
            return None
        return {k: (v.strip() if isinstance(v, str) else v) for k, v in data.items()}
    except ImportError:
        pass
    except Exception as e:  # invalid YAML is what an agent's loader would choke on
        errors.append(f"frontmatter is not valid YAML: {e}")
        return None
    lines, out, key, block = text[3:end].strip("\n").splitlines(), {}, None, []
    for line in lines:
        m = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if m and not line.startswith(" "):
            if key and block:
                out[key] = " ".join(s.strip() for s in block).strip()
            key, value, block = m.group(1), m.group(2).strip(), []
            if value in ("|", ">", "|-", ">-"):
                continue
            value = value.strip('"').strip("'") if value[:1] in "\"'" else value
            out[key] = {"true": True, "false": False}.get(value, value)
            key = None
        elif key is not None:
            block.append(line)
    if key and block:
        out[key] = " ".join(s.strip() for s in block).strip()
    return out


def check_plugins():
    market = json.loads((ROOT / ".claude-plugin" / "marketplace.json").read_text(encoding="utf-8"))
    for plugin in market["plugins"]:
        base = ROOT / plugin["source"]
        manifest = base / ".claude-plugin" / "plugin.json"
        if not manifest.exists():
            errors.append(f"{plugin['name']}: no {manifest.relative_to(ROOT)}")
            continue
        data = json.loads(manifest.read_text(encoding="utf-8"))
        if data.get("name") != plugin["name"]:
            errors.append(f"{manifest.relative_to(ROOT)}: name {data.get('name')!r} != {plugin['name']!r}")
        readme = base / "README.md"
        pack_text = readme.read_text(encoding="utf-8") if readme.exists() else ""
        if not pack_text:
            errors.append(f"{plugin['name']}: no README.md")
        root_text = (ROOT / "README.md").read_text(encoding="utf-8")
        for skill_md in sorted(base.glob("skills/*/SKILL.md")):
            check_skill(skill_md)
            name = skill_md.parent.name
            for where, text in ((f"{plugin['name']}/README.md", pack_text), ("README.md", root_text)):
                if text and f"`{name}`" not in text and f"**{name}**" not in text:
                    errors.append(f"{where}: skill {name!r} is not listed")
        for cmd in sorted(base.glob("commands/*.md")):
            errors.append(f"{cmd.relative_to(ROOT)}: Codex doesn't load plugin commands; make it a skill "
                          "the user starts (AGENTS.md, rule 7)")


skills = {}  # name -> {"rel": path, "listed": bool, "description": str}


def implicit_policy(skill_dir):
    """The Codex policy in agents/openai.yaml: False, True, or None when there is no file."""
    f = skill_dir / "agents" / "openai.yaml"
    if not f.exists():
        return None
    try:
        import yaml
        data = yaml.safe_load(f.read_text(encoding="utf-8")) or {}
        value = (data.get("policy") or {}).get("allow_implicit_invocation", True)
    except ImportError:
        m = re.search(r"allow_implicit_invocation:\s*(\w+)", f.read_text(encoding="utf-8"))
        value = m.group(1) if m else True
    except Exception as e:
        errors.append(f"{f.relative_to(ROOT)}: not valid YAML: {e}")
        return None
    return {"true": True, "false": False}.get(value, value) if isinstance(value, str) else value


def check_skill(skill_md):
    rel = skill_md.relative_to(ROOT)
    text = skill_md.read_text(encoding="utf-8")
    fm = frontmatter(text)
    if fm is None:
        errors.append(f"{rel}: no frontmatter")
        return
    folder = skill_md.parent.name
    if fm.get("name") != folder:
        errors.append(f"{rel}: name {fm.get('name')!r} != folder {folder!r}")
    desc = fm.get("description", "")
    if not desc:
        errors.append(f"{rel}: no description")
    elif len(desc) > MAX_DESCRIPTION:
        errors.append(f"{rel}: description is {len(desc)} characters (max {MAX_DESCRIPTION})")
    flag = fm.get("disable-model-invocation", False)
    if not isinstance(flag, bool):
        errors.append(f"{rel}: disable-model-invocation must be true or false, not {flag!r}")
    user_only, policy = flag is True, implicit_policy(skill_md.parent)
    if user_only and policy is not False:
        errors.append(f"{rel}: user-invoked in Claude Code but not in Codex: add agents/openai.yaml "
                      "with policy: allow_implicit_invocation: false")
    if policy is False and not user_only:
        errors.append(f"{rel}: user-invoked in Codex but not in Claude Code: add disable-model-invocation: true")
    skills[folder] = {"rel": rel, "listed": not user_only, "description": desc, "dir": skill_md.parent}
    if "\n## How you can tell it worked\n" not in text:
        errors.append(f"{rel}: no '## How you can tell it worked' section (AGENTS.md, rule 9)")
    if not user_only and len(desc) > MAX_LISTED_EACH:
        errors.append(f"{rel}: an agent can load it, so its description is always in context: "
                      f"{len(desc)} characters (max {MAX_LISTED_EACH})")


def check_listing():
    listed = sum(len(s["description"]) for s in skills.values() if s["listed"])
    if listed > MAX_LISTED:
        errors.append(f"always-loaded descriptions total {listed} characters (max {MAX_LISTED})")
    own_file = re.compile(r"`((?:references|reference|scripts|assets|templates|examples)/[A-Za-z0-9_./-]+)`")
    for name, s in skills.items():
        for n, line in enumerate((s["dir"] / "SKILL.md").read_text(encoding="utf-8").splitlines(), 1):
            for f in own_file.findall(line):
                f = f.rstrip(".")
                if not (s["dir"] / f).exists() and not any(
                        o in line and (t["dir"] / f).exists() for o, t in skills.items()):
                    errors.append(f"{s['rel']}:{n}: names {f}, which is not in the skill's folder")
    named = re.compile(r"the `([a-z0-9-]+)` skill")
    for p in ROOT.glob("*/skills/*/**/*.md"):
        own = p.relative_to(ROOT).parts[2]
        for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
            for name in named.findall(line):
                where = f"{p.relative_to(ROOT)}:{n}"
                if name not in skills:
                    errors.append(f"{where}: names a skill the collection doesn't have: {name!r}")
                elif not skills[name]["listed"] and name != own:
                    errors.append(f"{where}: {name!r} is user-invoked, so an agent can't load it; "
                                  "name its command instead")
    return listed


def check_tree():
    for p in ROOT.rglob("*"):
        if ".git" in p.parts:
            continue
        if p.name == "__pycache__" or p.suffix == ".pyc":
            errors.append(f"generated file in tree: {p.relative_to(ROOT)}")
    unresolved = re.compile("|".join(UNRESOLVED), re.IGNORECASE)
    # Every tracked file is public, so the leak check reads all of them (2026-10-28: going public,
    # sources.json and the validator's own name list carried private repository names that a check
    # reading only the skills and READMEs never saw). New files count before they are added; ignored
    # files (the local lists) don't. Outside git, every file in the tree.
    ls = subprocess.run(["git", "-C", str(ROOT), "ls-files", "--cached", "--others", "--exclude-standard"],
                        capture_output=True, text=True, encoding="utf-8")
    files = [ROOT / f for f in ls.stdout.splitlines()] if ls.returncode == 0 else [
        f for f in ROOT.rglob("*") if ".git" not in f.parts]
    for p in files:
        rel = p.relative_to(ROOT).as_posix()
        readme = re.fullmatch(r"[^/]+/README\.md", rel) is not None
        if not p.is_file() or p.suffix not in (".md", ".py", ".mjs", ".ts", ".json", ".sh", ".ps1", ".txt",
                                               ".html", ".yaml", ".yml"):
            continue
        allowed = [pat for pat, places in LEAK_EXCEPTIONS.items()
                   if any(re.fullmatch(pl, rel) for pl in places)]
        leak = re.compile("|".join(pat for pat in LEAKS if pat not in allowed), re.IGNORECASE)
        skill_text = "skills" in p.parts or readme
        for n, line in enumerate(p.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            if m := leak.search(line):
                errors.append(f"{rel}:{n}: leak {m.group(0)!r}")
            if skill_text and (m := unresolved.search(line)):
                errors.append(f"{rel}:{n}: assumes the reader has the template: {m.group(0)!r}")


def check_cli():
    claude = shutil.which("claude")
    if not claude:
        warnings.append("claude CLI not found; skipped `claude plugin validate`")
        return
    p = subprocess.run([claude, "plugin", "validate", str(ROOT)], capture_output=True, text=True, encoding="utf-8")
    if p.returncode:
        errors.append("claude plugin validate failed:\n" + (p.stdout + p.stderr).strip())


def main():
    check_plugins()
    listed = check_listing()
    check_tree()
    check_cli()
    for w in warnings:
        print(f"warning: {w}")
    for e in errors:
        print(f"error: {e}")
    n = sum(s["listed"] for s in skills.values())
    print(f"{n} of {len(skills)} skills load on their own; their descriptions total {listed} characters")
    if errors:
        print(f"{len(errors)} error(s)")
    elif LOCAL_LEAKS.exists():
        print("ok")
    else:
        print("ok, except that private names were not checked: no tools/leaks.local.txt here")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
