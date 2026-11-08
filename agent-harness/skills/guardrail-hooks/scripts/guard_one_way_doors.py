#!/usr/bin/env python3
"""PreToolUse guard for shell commands: an irreversible or public action needs a human's click.

A template. Replace the rules in CONFIG with your own one-way doors, or keep CONFIG and
pass a JSON file with the same keys (`--config <file>` or ONE_WAY_DOORS_CONFIG=<file>);
keys in the file replace the ones here.

Why it exists (receipt, 2026-10-12). Asked whether a tool belonged in a post's opening
line, the owner answered "up to you". The agent stretched that into "my call: delete the
live post and repost tomorrow". Nothing was deleted, but only judgment stood in the way:
the delete was one CLI call, and the publishing client's delete method was callable from
any inline script. The fix was this hook, not a sentence in the instructions.

Why it is this narrow (same day). The first version also gated process kills, `rm -rf`,
HTTP DELETE and destructive git, and scanned ALL command text. It fired twice on a
benchmark session whose heredoc merely CONTAINED a scoped `pkill -f` for its own proxy,
and the owner said "I don't want those questions." A guard that asks too often trains
the human to click yes, which is worse than no guard. So:
  - command rules are matched against what the shell actually runs, with heredoc bodies
    cut out first (text written to a file is not a command);
  - code rules are matched inside heredoc bodies and inside local scripts the command
    runs, and they name API calls, not CLI strings (a script that mentions a command in
    a docstring is not running it).

Modes (CONFIG["mode"], or ONE_WAY_DOORS_MODE):
  ask    print permissionDecision "ask": Claude Code shows the human a prompt, even in
         auto mode. In a non-interactive run (-p) nobody can answer, so the call is denied.
  deny   print permissionDecision "deny": the call is refused and the reason goes to the agent.
  block  exit 2 with the reason on stderr. The most portable form: Codex and Cursor also
         treat exit 2 as a block, while Codex does not support "ask" (read 2026-10-24).

Input: the PreToolUse JSON on stdin. The command is read from tool_input.command (Claude
Code, Codex) or from a top-level "command" (Cursor's beforeShellExecution). Anything it
cannot parse is allowed through (exit 0): the guard never breaks an unrelated call.

Test after every edit: run the test_hooks.py beside this file (python .claude/hooks/test_hooks.py once installed).
"""
import json
import os
import re
import sys

CONFIG = {
    "mode": "ask",
    # Matched against the shell text with heredoc bodies removed. [regex, what it is].
    # EXAMPLES: replace with the commands that are one-way doors for YOU.
    "command_rules": [
        [r"\bgh\s+(repo|gist|release)\s+delete\b", "GitHub repo, gist or release delete"],
        [r"\bnpm\s+(publish|unpublish)\b", "npm publish or unpublish"],
        [r"\bpublish_cli\.py\s+(post|delete)\b", "your publishing CLI posting or deleting (example)"],
        # Uncomment only if force-push is never routine for you; it was cut from the
        # original after it fired on ordinary work.
        # [r"\bgit\s+push\b[^\n;&|]*\s(--force\b|--force-with-lease\b|-f\b)", "force-push"],
    ],
    # Matched inside heredoc bodies and inside local scripts the command runs.
    # Name the API call itself, never a CLI string a script might merely mention.
    "code_rules": [
        [r"\.delete_post\s*\(", "a publishing client's delete call (example)"],
        [r"/posts/[^\s'\"]*/publish\b", "a publish endpoint (example)"],
    ],
    # Scripts not opened and scanned (regex on the forward-slash path), because their
    # dangerous subcommands are already covered by command_rules, e.g. r"(^|/)tools/[^/]+$".
    "skip_scripts": [],
    "reason_prefix": "Irreversible or public action, needs the owner's explicit OK: ",
    "reason_suffix": ". Agent: never approve this on the owner's behalf.",
}

HEREDOC = re.compile(r"<<-?\s*['\"]?(\w+)['\"]?[^\n]*\n.*?\n\s*\1\s*(?:\n|$)", re.S)
# An interpreter is a whole shell word wherever it stands: after the line's start, whitespace, a
# separator, a quote, a backtick or a `/`. That covers wrappers (sudo -E, op run --, uv run --with x,
# bash -c "...", if ...; then) and NAME=$(...) prefixes without listing them. Only `py`, which is also
# a file extension and a `-t py` argument, must stand where a command starts.
WORD = r"""(?:^|(?<=[\s;&|(){}'"`/=]))"""
INTERPRETER = (r"(?:" + WORD + r"(?:bun\s+run|uv\s+run|deno\s+run|python[\d.]*|node|bun|tsx)"
               r"|(?:^|(?<=[;&|(\n]))\s*py)(?:\.exe)?(?=\s)")
# A script it runs by path, after its own options (with or without a value); `-m` and `-c` end the
# options, since what follows them is a module or code, not a script path.
RUNS_FILE = re.compile(INTERPRETER + r"(?:\s+(?!-[mc]\b)-\S+(?:\s+(?!-)\S+)??)*?\s+([^\s;&|<>'\"]+\.(?:py|mjs|cjs|js|ts))\b")
# Code passed inline: python -c "...", node -e '...'. Scanned with code_rules like a heredoc body.
INLINE = re.compile(INTERPRETER + r"""[^\n;&|]*?\s-[ce]\s+(?:"((?:[^"\\]|\\.)*)"|'([^']*)')""")
# Code in a here-string: python <<< '...'.
HERESTRING = re.compile(r"""<<<\s*(?:"((?:[^"\\]|\\.)*)"|'([^']*)')""")
# A `cd <dir>` before them moves where the scripts after it are found.
CD = re.compile(r"\bcd\s+(['\"]?)([^\s;&|'\"]+)\1\s*(?:&&|\|\||;|\n)")
# The wiring canary. It always answers, whatever the config's rules, so a person can prove the
# hook runs with `true guard-canary`: a command that does nothing when the hook is not wired.
CANARY = re.compile(r"\btrue\s+guard-canary\b")
# This guard's own test runner holds the code rules' samples; scanning it would ask on every test run.
OWN_TESTS = os.path.realpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_hooks.py"))


def read_payload():
    """The hook JSON is UTF-8. On Windows, Python decodes a pipe with the ANSI code page
    and writes stderr in it too, so non-ASCII text arrives garbled (observed 2026-10-24,
    Python 3.13, Windows 11: a hook's section sign reached the transcript as U+FFFD).
    Read bytes, decode UTF-8, and write UTF-8."""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    try:
        payload = json.loads(sys.stdin.buffer.read().decode("utf-8", errors="replace"))
    except Exception:
        return None
    return payload if isinstance(payload, dict) else None


def load_config():
    cfg = dict(CONFIG)
    path = os.environ.get("ONE_WAY_DOORS_CONFIG")
    if "--config" in sys.argv[1:]:
        i = sys.argv.index("--config")
        if i + 1 < len(sys.argv):
            path = sys.argv[i + 1]
    if path:
        try:
            with open(path, encoding="utf-8") as fh:
                cfg.update(json.load(fh))
        except (OSError, ValueError) as exc:
            # A broken config must not silently disable the guard: say so where the
            # human sees it (stderr shows in the debug log; exit 1 is a visible hook error).
            sys.stderr.write(f"guard_one_way_doors: cannot read config {path}: {exc}\n")
            sys.exit(1)
    cfg["mode"] = os.environ.get("ONE_WAY_DOORS_MODE", cfg["mode"])
    return cfg


def scan(text, rules):
    return [why for pat, why in rules if re.search(pat, text, re.IGNORECASE)]


def win(path):
    """Git Bash spells C:/x as /c/x; Windows Python can only open the former."""
    m = re.match(r"^/([a-zA-Z])/(.*)", path)
    return f"{m.group(1).upper()}:/{m.group(2)}" if m else path


def main():
    payload = read_payload()
    if payload is None:
        return 0
    tool_input = payload.get("tool_input")
    command = (tool_input.get("command") if isinstance(tool_input, dict) else None) or payload.get("command")
    if not isinstance(command, str) or not command:
        return 0

    cfg = load_config()
    cwd = payload.get("cwd") or os.getcwd()
    bodies = [m.group(0) for m in HEREDOC.finditer(command)]
    shell_only = HEREDOC.sub("\n", command)

    hits = [f"{w} [command]" for w in scan(shell_only, cfg["command_rules"])]
    for body in bodies:
        hits += [f"{w} [inline script]" for w in scan(body, cfg["code_rules"])]
    for pattern, where in ((INLINE, "inline -c/-e"), (HERESTRING, "here-string")):
        for m in pattern.finditer(shell_only):
            code = m.group(1) if m.group(1) is not None else m.group(2)
            hits += [f"{w} [{where}]" for w in scan(code, cfg["code_rules"])]

    # Where a script path is looked for: the payload's cwd first, then any `cd` target, then ours.
    bases = [win(cwd)] + [os.path.join(win(cwd), win(d)) for _, d in CD.findall(shell_only)] + [os.getcwd()]
    for path in RUNS_FILE.findall(shell_only):
        path = win(path.strip("'\""))
        if any(re.search(p, path.replace("\\", "/")) for p in cfg["skip_scripts"]):
            continue
        # Scan every place the path could resolve to: a same-named file in the cwd must not hide
        # the one a `cd` makes run. Asking about a file that did not run is the safe mistake.
        seen = set()
        for candidate in ([path] if os.path.isabs(path) else [os.path.join(b, path) for b in bases]):
            real = os.path.realpath(candidate)
            if real == OWN_TESTS or real in seen:
                continue
            seen.add(real)
            try:
                with open(candidate, encoding="utf-8", errors="ignore") as fh:
                    src = fh.read()
            except OSError:
                continue
            hits += [f"{w} [in {os.path.basename(path)}]" for w in scan(src, cfg["code_rules"])]

    if hits:
        reason = cfg["reason_prefix"] + "; ".join(dict.fromkeys(hits)) + cfg["reason_suffix"]
    elif CANARY.search(shell_only):
        reason = "guard-canary: the one-way-door hook is wired and answered. Decline this; nothing ran."
    else:
        return 0
    if cfg["mode"] == "block":
        sys.stderr.write(reason + "\n")
        return 2
    decision = "deny" if cfg["mode"] == "deny" else "ask"
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": decision,
        "permissionDecisionReason": reason,
    }}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
