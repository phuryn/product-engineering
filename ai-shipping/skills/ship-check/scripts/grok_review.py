#!/usr/bin/env python3
"""grok_review.py — Runs one unsteered independent review round.

The session that built the code never clears it. Wrapper only. The how-and-when discipline (what a
round is scoped to, the stopping rule, author != reviewer, how to triage what
comes back) lives in ../SKILL.md: the grok-agents skill's, or, for the copy ship-check carries,
its Step 6. Read it before invoking this.

The reviewer is the Grok CLI when it is installed. Without it the round still
runs: --reviewer auto (the default) falls back to a fresh, headless Claude Code
session with read-only tools, no MCP servers, no auto-memory and no saved
session, so it starts from the repository and the brief alone. `--check`
says which reviewer a round would use. The thread that
built the code is never the reviewer.

THE REASON THIS EXISTS, and it is one specific failure (2026-09-08):

    A review round run without --always-approve EXITS 0 AFTER ONE LINE, and
    that looks exactly like a clean round.

No error, no timeout, exit code 0, a sentence or two of preamble. Two rounds
were read as "the reviewer found nothing" before a third, run properly, found
a real defect in the same commit both silent rounds had "cleared". The failure
is biased toward SILENCE, so it always reads as good news.

This wrapper closes that gap in two ways:

  1. The flags that make a round real are applied here, not remembered.
  2. A round whose output is too short to be a real round FAILS LOUDLY
     (exit 2) instead of printing a few lines and returning 0.

The length check is the whole point. A round that comes back genuinely empty
still argues its way there over paragraphs; one that comes back in three lines
did not run. Treat a suspiciously short clean round as a failed round, never
as a fast one.

Usage:
    python grok_review.py --brief BRIEF.md --cwd REPO --subject origin/PROD..HEAD
    python grok_review.py --brief BRIEF.md --cwd REPO --subject HEAD   # nothing released yet: every file and every removed line
    python grok_review.py --brief BRIEF.md --cwd REPO --subject abc123^! --out round2.md
  PROD is whatever the repository says was last released (a branch, a tag).
    python grok_review.py --check          # which reviewer, and its flags; run nothing
    python grok_review.py --brief BRIEF.md --cwd REPO --subject HEAD --subject-only
                                           # neither CLI: write the subject and prompt, print their paths
    python grok_review.py --reviewer claude ...   # force the fallback reviewer

There is deliberately NO way to pass a prompt inline. The brief goes in a file
(a command over ~10k chars is downgraded by the permission analyser, and a
brief in a file is better practice anyway), and --cwd is mandatory (without it
a delegate works in the *session's* directory and can resume another repo's
thread). Both are correctness rules that happen to also avoid a prompt.

Grok binary lookup, in order:
    1. $GROK_BIN
    2. ~/.grok/bin/grok[.exe]
    3. `grok` on PATH (via shutil.which)
The fallback reviewer is $CLAUDE_BIN, or `claude` on PATH.

Exit codes:
    0  round completed and looks like a real round
    1  usage / environment problem (no binary, bad path, missing flag)
    2  round is suspiciously short — treat as FAILED, not clean
    N  the reviewer's own non-zero exit, passed through
"""

import argparse
import atexit
import os
import platform
import shutil
import subprocess
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

GROK_BIN_NAME = "grok.exe" if platform.system() == "Windows" else "grok"

# A real round argues its way to its conclusion over paragraphs. Measured on
# 2026-09-16, a genuine round over a two-commit range came back at 15,292
# bytes; the 2026-09-08 silent failures were "a sentence or two". 1500 sits far
# enough below a real round to avoid false alarms and far enough above a
# preamble to catch the failure this wrapper exists for.
DEFAULT_MIN_CHARS = 1500

# A brief thinner than this is very unlikely to carry the goal, the constraints
# that bind, and how to prove it. Warned about, never fatal — some legitimate
# fix-sized rounds are short.
THIN_BRIEF_CHARS = 400

# The flags that make a round a REVIEW rather than a build, applied every time.
#   --always-approve      lets it use tools at all; without it, the silent exit
#   --tools               an ALLOWLIST of read-only tools: the write boundary
#
# Measured 2026-10-10 on Windows: `--sandbox read-only --always-approve
# --disallowed-tools edit,write` still created a file. The sandbox enforces only
# where the platform supports it, and a denylist leaves the shell and the edit
# tool in place. With `--tools read_file,grep,list_dir` the same prompt could not
# write. A reviewer with no shell cannot run git, so the subject goes on disk
# first (--subject below).
#
# `--tools` allowlists built-in tools only: the MCP meta-tools (search_tool,
# use_tool) stay unless removed, and through them any connected MCP server's
# tools, a database's included. So they are removed (`--disallowed-tools` wins
# over `--tools`), and every MCP call, shell command, edit and write is denied
# as well (a deny rule wins over --always-approve). Web tools are off: a review
# reads this repository, nothing else.
READ_ONLY_TOOLS = "read_file,grep,list_dir"
REVIEW_FLAGS = [
    "--always-approve",
    "--tools", READ_ONLY_TOOLS,
    "--disallowed-tools", "search_tool,use_tool",
    "--deny", "MCPTool", "--deny", "Bash", "--deny", "Edit", "--deny", "Write",
    "--disable-web-search",
]

# The fallback reviewer: a fresh headless Claude Code session. --restricted
# removes every code-running tool and ignores the user, project and local
# settings files, so no hook, plugin or personal setting rides along; --tools is
# the allowlist on top (read-only tools only; no shell, so the subject goes on
# disk as for Grok); --strict-mcp-config with no config loads no MCP server;
# --no-session-persistence leaves nothing to resume. Auto-memory is switched off
# in its environment (CLAUDE_CODE_DISABLE_AUTO_MEMORY=1): measured 2026-10-10, a
# headless session otherwise loads the project's memory index, which holds the
# builder's notes. Measured the same day: with these flags no project instructions,
# personal notes, memory or skills list is in its context, so like Grok it reads the
# project's spec because the brief names it, not because it was handed it.
CLAUDE_READ_ONLY_TOOLS = "Read,Grep,Glob"
CLAUDE_REVIEW_FLAGS = [
    "-p", "--restricted", "--tools", CLAUDE_READ_ONLY_TOOLS, "--strict-mcp-config",
    "--no-session-persistence", "--output-format", "text",
]

# A file read returns at most this many lines per call (Grok's read_file does not
# say there are more), so the prompt states the subject's length and how to page.
READ_FILE_LINES = 1000

# An untracked file's content goes into the subject only below this size; above
# it, only its name (the reviewer can still open it by path).
UNTRACKED_INLINE_BYTES = 200_000

# The cap above is per file, so a directory of small generated files goes in
# whole. Past these, the wrapper warns (never refuses: an untracked file is how a
# change goes unreviewed). The floor keeps a small round whose change is one new
# file from warning just because that file is most of it.
UNTRACKED_WARN_LINES = 20_000
UNTRACKED_WARN_FLOOR = 5_000


def find_grok_bin() -> str | None:
    """Locate the grok CLI. Env override > ~/.grok/bin > PATH. None when absent."""
    env_override = os.environ.get("GROK_BIN")
    if env_override:
        if Path(env_override).exists():
            return env_override
        sys.exit(f"[grok_review.py] $GROK_BIN is set but does not exist: {env_override}")

    home_bin = Path.home() / ".grok" / "bin" / GROK_BIN_NAME
    if home_bin.is_file():
        return str(home_bin)

    return shutil.which("grok")


def find_claude_bin() -> str | None:
    env_override = os.environ.get("CLAUDE_BIN")
    if env_override:
        if Path(env_override).exists():
            return env_override
        sys.exit(f"[grok_review.py] $CLAUDE_BIN is set but does not exist: {env_override}")
    return shutil.which("claude")


def pick_reviewer(choice: str) -> tuple[str, str]:
    """(reviewer, binary). auto: Grok when installed, else a fresh Claude Code session."""
    grok = find_grok_bin() if choice in ("auto", "grok") else None
    if grok:
        return "grok", grok
    if choice == "grok":
        sys.exit("[grok_review.py] could not locate the grok binary. Install the Grok CLI, "
                 "set $GROK_BIN, or run with --reviewer claude.")
    claude = find_claude_bin()
    if claude:
        return "claude", claude
    sys.exit("[grok_review.py] neither the Grok CLI nor `claude` is on PATH. The review is "
             "still mandatory: run with --subject-only to write the subject and prompt files, then give "
             "the prompt to a fresh read-only session of your agent, started as a separate process in the "
             "checkout, never a subagent, fork or resumed session of this one (the grok-agents skill, "
             "'Running it'; ship-check, Step 6).")


def supported_flags(binary: str) -> set[str]:
    """Flags the installed CLI actually advertises.

    The discipline this wrapper encodes says to verify a flag is accepted
    before relying on it rather than trusting prose that may predate the
    binary. `grok --help` costs a second and no API call."""
    try:
        proc = subprocess.run(
            [binary, "--help"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            input="",
            timeout=60,
        )
    except (OSError, subprocess.SubprocessError) as err:
        sys.exit(f"[grok_review.py] could not run `{binary} --help`: {err}")
    text = proc.stdout + proc.stderr
    return {tok.split("=")[0] for tok in text.split() if tok.startswith("--")}


def require_flags(binary: str, wanted: list[str]) -> None:
    have = supported_flags(binary)
    missing = [f for f in wanted if f not in have]
    if missing:
        sys.exit(
            f"[grok_review.py] this {Path(binary).stem} build does not advertise: "
            + ", ".join(missing)
            + "\n  The review spelling depends on them. Check its `--help` and "
            "update this wrapper rather than dropping the flag — dropping "
            "--always-approve is exactly the silent-failure this exists to stop."
        )


# The prompt and subject files are named per run: rounds started in parallel
# against one checkout (one per area of a split range) otherwise overwrite each
# other's prompt, and every reviewer reads the last brief written (2026-10-22: three
# area rounds all reviewed the third area). Both are removed when the run exits.
RUN_ID = os.getpid()


def git_dir(cwd: Path) -> Path:
    proc = subprocess.run(["git", "rev-parse", "--absolute-git-dir"], cwd=str(cwd),
                          capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode != 0:
        sys.exit(f"[grok_review.py] --cwd is not a git checkout: {cwd}")
    return Path(proc.stdout.strip())


def product_start(cwd: Path) -> str:
    """The range a first release's round takes: every file HEAD holds and every line its history removed."""
    return "\n    --subject HEAD   (every file HEAD holds and every line its history removed)"


def range_ends(rng: str) -> tuple[str, str] | None:
    """The (start, end) a range's cumulative diff runs between, for the shapes
    the skill uses: A..B (an empty side is HEAD, as git reads it), <sha>^!
    (against its first parent) and a bare ref, every file it holds (start "", the
    empty tree, so the first commit's files are included). None for anything else, such as A...B."""
    if rng and ".." not in rng and not any(c in rng for c in "^~ "):
        return "", rng
    if rng.endswith("^!"):
        return f"{rng[:-2]}^1", rng[:-2]
    if ".." in rng and "..." not in rng:
        start, end = rng.split("..", 1)
        return start or "HEAD", end or "HEAD"
    return None


def write_subject(cwd: Path, rng: str) -> tuple[Path, int]:
    """The reviewer has no shell, so the subject is written where it can read it:
    inside the git directory, which is never committed. The range's log with
    patches, plus the range's cumulative diff when it contains a merge (for a bare
    ref such as HEAD, its log one line a commit, every file it holds, and every line
    its history removed), then
    everything uncommitted: tracked changes, and each untracked
    file listed by its own path (-uall) with its content (the skill reviews the
    working tree too, and an untracked file is how a change goes unreviewed)."""
    def git(*a: str, env: dict | None = None) -> str:
        proc = subprocess.run(["git", *a], cwd=str(cwd), capture_output=True, text=True,
                              encoding="utf-8", errors="replace", stdin=subprocess.DEVNULL, env=env)
        if proc.returncode != 0:
            hint = ""
            if "unknown revision" in proc.stderr or "ambiguous argument" in proc.stderr:
                hint = ("\n  A ref in that range doesn't exist. Check its spelling; if it names a remote "
                        "branch, run `git fetch` first, since a branch missing here is not proof that "
                        "nothing is released. If it is HEAD, "
                        "nothing is committed yet: commit the work first. If it names a release and "
                        "nothing has been released yet, round 1 is everything the first release ships "
                        f"(the grok-agents skill, 'The subject'; ship-check, Step 6):{product_start(cwd)}")
            sys.exit(f"[grok_review.py] git {' '.join(a)} failed: {proc.stderr.strip()}{hint}")
        return proc.stdout
    # the empty tree's id depends on the repository's hash (SHA-1 or SHA-256)
    empty = git("hash-object", "-t", "tree", "--stdin").strip()
    # A commit's diff follows the attributes files, where `-diff` or `binary` shows a text
    # file as "Binary files differ", content left out. Read from the empty tree, with the
    # global and system files switched off, they leave out only what git itself finds
    # binary (--attr-source, git 2.41 and later). The repository's info/attributes has no
    # switch, so a rule there is warned about.
    attrs = ["-c", f"core.attributesFile={os.devnull}", f"--attr-source={empty}"]
    plain = {**os.environ, "GIT_ATTR_NOSYSTEM": "1"}
    if subprocess.run(["git", *attrs, "version"], cwd=str(cwd), capture_output=True,
                      stdin=subprocess.DEVNULL).returncode != 0:
        attrs = []
        sys.stderr.write("[grok_review.py] warning: this git predates --attr-source (2.41), so a text "
                         "file that .gitattributes marks -diff or binary shows in the commits' diffs "
                         "without its content. Upgrade git.\n")
    info = cwd / git("rev-parse", "--git-path", "info/attributes").strip()
    try:
        rules = [r.strip() for r in info.read_text(encoding="utf-8", errors="replace").splitlines()
                 if r.strip() and not r.lstrip().startswith("#") and ("diff" in r or "binary" in r)]
    except OSError:
        rules = []
    if rules:
        sys.stderr.write(f"[grok_review.py] warning: {info} has a rule that can show a text file as "
                         f"binary ({rules[0]}), and git has no switch for that file: paths it marks show in "
                         "the commits' diffs without their content. Move the rule out for the round.\n")
    # A bare ref is round 1 before any release, whose subject is what a push sends: every
    # file the ref holds, as a diff from the empty tree, after the log one line a commit,
    # then every line its history removed. Patch by patch, a history begun in another
    # repository (a clone or a fork) can be many times that.
    ends = range_ends(rng)
    whole = bool(ends) and not ends[0]
    if whole:
        log = git("log", "--format=%h %ad %an  %s", "--date=short", rng)
        tree = git(*attrs, "diff", "--no-ext-diff", "--stat", "-p", empty, rng, env=plain)
        # A push sends every commit, so a key replaced by a variable, or an .env deleted
        # or dropped on a merged branch, still ships. Every line the history held is in the
        # tree or was removed by a commit against one of its parents (-m), so those lines
        # complete the subject: each once per file (a lockfile removes the same lines on
        # every upgrade), under the commit and the file that first removed it.
        removed, seen, commit, path, shown, hunk = [], set(), "", "", "", False
        for line in git(*attrs, "log", "-p", "-m", "-U0", "--no-renames", "--no-ext-diff",
                        "--format=commit %h %ad %an  %s", "--date=short", rng, env=plain).splitlines():
            if line.startswith("commit "):
                commit, path, hunk = line, "", False
            elif line.startswith("diff --git "):
                path, hunk = line, False
            elif line.startswith("@@"):
                hunk = True
            elif hunk and line.startswith("-") and (path, line) not in seen:
                seen.add((path, line))
                if commit:
                    removed.append(commit)
                    commit, shown = "", ""
                if shown != path:
                    removed.append(path)
                    shown = path
                removed.append(line)
        if removed:
            tree += (f"\n# Every line {rng}'s history removed, each once per file, under the commit "
                     "that first removed it (each commit against each parent)\n")
            tree += "\n".join(removed) + "\n"
    else:
        log = git(*attrs, "log", "--root", "--stat", "-p", rng, env=plain)
    status = git("status", "--short", "-uall")
    if not log.strip() and not status.strip():
        sys.exit(f"[grok_review.py] --subject {rng} has no commits and the tree is clean: "
                 "nothing in that range, which is not the same as nothing to review. Round 1 "
                 "is the whole unreleased range: <last release>..HEAD, or before the first release "
                 f"(the grok-agents skill, 'The subject'; ship-check, Step 6):{product_start(cwd)}")
    # `git log -p` shows a merge commit without its diff, so a conflict resolution,
    # or an edit made inside a merge, never reaches the reviewer from the log. A
    # two-dot diff of the range's ends does show it. Not `--cc`: a resolution that
    # keeps one parent's version over a line the range added has no combined hunk.
    merges = git("rev-list", "--merges", rng).split() if log.strip() and not whole else []
    header = f"# Review subject: {rng}\n"
    cumulative = []
    if whole:
        header = (f"# Review subject: {rng}, every file it holds (its log, one line a commit, then each "
                  "file as a diff from the empty tree, then every line its history removed, each once per file)\n")
        cumulative = [f"\n# Every file {rng} holds\n", tree]
    if merges:
        header = (f"# Review subject: {rng} ({len(merges)} merge commit"
                  f"{'' if len(merges) == 1 else 's'}; the range's cumulative diff follows the log)\n")
        why = ("it contains merge commits, and `git log -p` shows a merge without its diff, so a "
               "conflict resolution or an edit made inside a merge appears only here")
        if ends:
            cumulative = [f"\n# Cumulative diff of the range: {ends[0]} {ends[1]} ({why})\n",
                          git(*attrs, "diff", "--no-ext-diff", "--stat", "-p", ends[0], ends[1], env=plain)]
        else:
            cumulative = [f"\n# Cumulative diff of the range: not computed for `{rng}` ({why}). "
                          "Run the round with an A..B range to include it.\n"]
            sys.stderr.write(f"[grok_review.py] warning: {rng} contains merge commits but is not "
                             "an A..B, <sha>^! or bare-ref range, so the subject has no cumulative diff and "
                             "what the merges changed is not in it.\n")
    parts = [header, log or "(no commits in this range)\n", *cumulative,
             "\n# Working tree (uncommitted)\n", status or "(clean)\n", git("diff", "--no-ext-diff", "--no-textconv", "HEAD")]
    # The working tree's diff keeps the attributes, whose line-ending and filter rules
    # it needs, so a path it shows as binary goes in again with --text when its
    # content is text on both sides.
    as_text = []
    for entry in git("diff", "--no-textconv", "--no-renames", "--numstat", "-z", "HEAD").split("\0"):
        if not entry.startswith("-\t-\t"):
            continue
        rel = entry[4:]
        head = subprocess.run(["git", "cat-file", "blob", f"HEAD:{rel}"], cwd=str(cwd),
                              capture_output=True, stdin=subprocess.DEVNULL)
        sides = [head.stdout[:8192]] if head.returncode == 0 else []
        f = cwd / rel
        try:
            if f.is_file():
                with open(f, "rb") as fh:
                    sides.append(fh.read(8192))
        except OSError:
            continue
        if sides and all(b"\0" not in s for s in sides):
            as_text.append(rel)
    if as_text:
        parts.append("\n# Shown again as text (the attributes mark these -diff or binary; their content is text)\n")
        for i in range(0, len(as_text), 100):  # a command line has a length limit, on Windows 32,767
            parts.append(git("--literal-pathspecs", "diff", "--no-ext-diff", "--no-textconv", "--text", "HEAD", "--",
                             *as_text[i:i + 100]))
    untracked: list[tuple[int, int, str]] = []  # (lines, bytes, path) of each file inlined
    # -z gives raw paths: no quoting or octal escapes to undo, whatever the name.
    for entry in git("status", "--porcelain", "-z", "-uall").split("\0"):
        if not entry.startswith("?? "):
            continue
        rel = entry[3:]
        f = cwd / rel
        # Size and type are checked before anything is read, and one bad path
        # becomes an "open it by path" line instead of aborting the round.
        try:
            if not f.is_file():
                parts.append(f"\n# Untracked: {rel} (not a regular file; open it by path)\n")
                continue
            size = f.stat().st_size
            if size > UNTRACKED_INLINE_BYTES:
                parts.append(f"\n# Untracked file: {rel} ({size} bytes, large; open it by path)\n")
                continue
            with open(f, "rb") as fh:
                data = fh.read(UNTRACKED_INLINE_BYTES + 1)
        except Exception as err:  # noqa: BLE001 — any failure here must not stop the round
            parts.append(f"\n# Untracked: {rel} (could not read: {err}; open it by path)\n")
            continue
        if b"\0" in data[:8192]:
            parts.append(f"\n# Untracked file: {rel} ({size} bytes, binary; open it by path)\n")
        else:
            body = data.decode('utf-8', errors='replace')
            parts.append(f"\n# Untracked file: {rel}\n{body}")
            untracked.append((body.count("\n") + 1, size, rel))
    text = "".join(parts)
    total = text.count("\n") + 1
    from_untracked = sum(u[0] for u in untracked)
    if from_untracked > UNTRACKED_WARN_LINES or (
            total > UNTRACKED_WARN_FLOOR and 2 * from_untracked > total):
        largest = ", ".join(u[2] for u in sorted(untracked, key=lambda u: -u[1])[:5])
        sys.stderr.write(f"[grok_review.py] warning: {len(untracked)} untracked files add "
                         f"{from_untracked} of {total} subject lines; the largest: {largest}. "
                         "If they are not part of the change, stop this round, gitignore or delete "
                         "them, and run it again (the grok-agents skill, 'The subject'; ship-check, Step 6).\n")
    path = git_dir(cwd) / f"grok-review-subject-{RUN_ID}.diff"
    path.write_text(text, encoding="utf-8")
    return path, total


def compose_prompt(cwd: Path, brief: Path, subject: Path | None, lines: int = 0) -> Path:
    if subject:
        reading = (f"The subject is in `{subject}`: the range's commits with their diffs (and "
                   f"the range's cumulative diff when it contains a merge; for a bare ref such as "
                   f"HEAD, its log, every file it holds and every line its history removed, as "
                   f"its first line says), then "
                   f"the uncommitted working tree, untracked files with their content. It has "
                   f"{lines} lines. A file read returns at most {READ_FILE_LINES} lines per call "
                   f"and may not say there are more, so read it with limit {READ_FILE_LINES} "
                   f"and offset 1, {READ_FILE_LINES + 1}, {2 * READ_FILE_LINES + 1}, and so on "
                   f"until you pass line {lines}. A single read is not the subject. ")
    else:
        reading = "No subject file was prepared, so read the working tree as it stands. "
    note = ("\n\n## Reading the subject\n\nYou have read-only tools and no shell. " + reading
            + f"Everything else you need is in the repository's files, at `{cwd}`.\n")
    path = git_dir(cwd) / f"grok-review-prompt-{RUN_ID}.md"
    path.write_text(brief.read_text(encoding="utf-8", errors="replace") + note, encoding="utf-8")
    return path


def build_claude_command(claude_bin: str, args: argparse.Namespace, brief: Path) -> list[str]:
    # The prompt goes on stdin (never inline, as for Grok). The subject file sits
    # in the git directory, which for a worktree is outside the checkout: --add-dir
    # lets the read-only tools reach it. Highest effort, as for Grok.
    cmd = [claude_bin, *CLAUDE_REVIEW_FLAGS, "--add-dir", str(brief.parent), "--effort", "max"]
    if args.model:
        cmd += ["--model", args.model]
    return cmd


def build_command(grok_bin: str, args: argparse.Namespace, brief: Path) -> list[str]:
    cmd = [grok_bin, "--prompt-file", str(brief), "--cwd", str(args.cwd_resolved)]
    cmd += REVIEW_FLAGS
    cmd += ["--max-turns", str(args.max_turns)]
    if args.effort:
        cmd += ["--reasoning-effort", args.effort]
    if args.sandbox:
        cmd += ["--sandbox", args.sandbox]
    if args.model:
        cmd += ["--model", args.model]
    return cmd


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Runs one unsteered independent review round: Grok, or a fresh Claude Code session.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__.split("Usage:", 1)[1] if __doc__ else "",
    )
    parser.add_argument("--brief", metavar="FILE", help="Review brief. A FILE, never inline.")
    parser.add_argument("--cwd", metavar="DIR", help="Repo the round runs against. Mandatory.")
    parser.add_argument(
        "--effort",
        metavar="LEVEL",
        choices=["low", "medium", "high", "xhigh"],
        default="xhigh",
        help="Reasoning effort (default: xhigh, the highest the CLI offers)",
    )
    parser.add_argument("--max-turns", type=int, default=60, metavar="N", help="Turn cap (default: 60)")
    parser.add_argument(
        "--model",
        metavar="MODEL",
        help="Override the model (default: the CLI's). Reviews want the newest Grok "
        "model the CLI offers; `grok models` lists them.",
    )
    parser.add_argument(
        "--subject",
        metavar="RANGE",
        help="Git range under review (e.g. origin/PROD..HEAD, or abc123^! for one commit). "
        "Written to a file the reviewer can read, since it has no shell.",
    )
    parser.add_argument("--sandbox", metavar="PROFILE",
                        help="Sandbox profile, passed through. Not the write boundary: "
                        "the tool allowlist is (it does not enforce on every platform).")
    parser.add_argument("--out", metavar="FILE", help="Also write the round's output to FILE")
    parser.add_argument(
        "--min-chars",
        type=int,
        default=DEFAULT_MIN_CHARS,
        metavar="N",
        help=f"Below this, the round is treated as FAILED (default: {DEFAULT_MIN_CHARS})",
    )
    parser.add_argument(
        "--allow-short",
        action="store_true",
        help="Accept a short round anyway. Only after reading it and confirming "
        "it genuinely reasoned its way to empty.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=3600,
        metavar="SEC",
        help="Hard cap on the round (default: 3600)",
    )
    parser.add_argument(
        "--reviewer",
        choices=["auto", "grok", "claude"],
        default="auto",
        help="auto (default): Grok when its CLI is installed, else a fresh read-only Claude Code session",
    )
    parser.add_argument("--check", action="store_true",
                        help="Say which reviewer a round would use and verify its flags; run nothing")
    parser.add_argument("--dry-run", action="store_true", help="Print the command, run nothing")
    parser.add_argument("--subject-only", action="store_true",
                        help="Write the subject and the prompt, print their paths and run nothing, "
                        "for a round run by hand when neither CLI is installed")
    args = parser.parse_args()
    if args.subject is not None and (not args.subject.strip() or args.subject.startswith("..")):
        sys.exit(f"[grok_review.py] --subject {args.subject!r} is empty, or has no start (which git "
                 "reads as HEAD), so it holds no commits: usually a substitution that came back empty, such as "
                 "`git describe --tags` where no tag is reachable from HEAD. Name the last release (a "
                 "missing tag is not proof that nothing is released: a production branch or the deployed "
                 "commit may say, and where nothing does, ask the owner), or before the first "
                 f"release:{product_start(Path(args.cwd or '.'))}")
    if args.subject_only and (args.check or args.dry_run or not args.subject):
        sys.exit("[grok_review.py] --subject-only takes --brief, --cwd and --subject, and runs no reviewer")

    reviewer, binary = ("", "") if args.subject_only else pick_reviewer(args.reviewer)
    grok_flags = ["--prompt-file", "--cwd", "--always-approve", "--tools", "--disallowed-tools",
                  "--deny", "--disable-web-search", "--max-turns"]
    claude_flags = ["--restricted", "--tools", "--strict-mcp-config", "--no-session-persistence", "--add-dir",
                    "--effort", "--output-format"]

    if args.check:
        have = supported_flags(binary)
        print(f"reviewer: {reviewer} ({binary})")
        if reviewer == "claude" and args.reviewer == "auto":
            print("  no Grok CLI: a fresh Claude Code session reviews, read-only, with no settings, "
                  "hooks, plugins, MCP servers, auto-memory or saved session")
        wanted = grok_flags + ["--reasoning-effort", "--sandbox", "--model"] if reviewer == "grok" \
            else claude_flags + ["--model"]
        for flag in wanted:
            print(f"  {flag:<24} {'ok' if flag in have else 'MISSING'}")
        return

    if not args.brief:
        parser.error("--brief FILE is required (the brief goes in a file, never inline)")
    if not args.cwd:
        parser.error("--cwd DIR is required (without it the round runs in the session's directory)")

    brief = Path(args.brief).expanduser()
    if not brief.is_file():
        sys.exit(f"[grok_review.py] --brief is not a file: {args.brief}")
    brief = brief.resolve()

    cwd = Path(args.cwd).expanduser()
    if not cwd.is_dir():
        sys.exit(f"[grok_review.py] --cwd is not a directory: {args.cwd}")
    # The subject's paths are rooted at the checkout's top level, and a reviewer confined
    # to a subdirectory couldn't open the files around the change, so the round runs there.
    top = subprocess.run(["git", "rev-parse", "--show-toplevel"], cwd=str(cwd), capture_output=True,
                         text=True, encoding="utf-8", errors="replace").stdout.strip()
    args.cwd_resolved = Path(top).resolve() if top else cwd.resolve()

    brief_text = brief.read_text(encoding="utf-8", errors="replace")
    if len(brief_text.strip()) < THIN_BRIEF_CHARS:
        sys.stderr.write(
            f"[grok_review.py] warning: brief is {len(brief_text.strip())} chars. "
            "A brief carries the goal, the constraints that bind, and how to "
            "prove it — a thin one gets you a locally-correct answer to the "
            "wrong question.\n"
        )

    if not args.subject_only:
        require_flags(binary, grok_flags if reviewer == "grok" else claude_flags)

    if not args.subject:
        sys.stderr.write("[grok_review.py] warning: no --subject. The reviewer has no shell, "
                         "so it cannot run git; it will see only the working tree.\n")
    subject, lines = write_subject(args.cwd_resolved, args.subject) if args.subject else (None, 0)
    prompt = compose_prompt(args.cwd_resolved, brief, subject, lines)
    if args.subject_only:
        print(f"subject: {subject} ({lines} lines)\nprompt:  {prompt}")
        return
    # Paging the subject costs a turn per READ_FILE_LINES lines; leave room on top
    # to read the repository and write the review, so a large range can't run out
    # of turns before the review starts.
    if subject:
        needed = lines // READ_FILE_LINES + 1 + 40
        if args.max_turns < needed:
            sys.stderr.write(f"[grok_review.py] --max-turns raised to {needed} for a "
                             f"{lines}-line subject\n")
            args.max_turns = needed
    if reviewer == "grok":
        cmd = build_command(binary, args, prompt)
        stdin, env = "", None
    else:
        cmd = build_claude_command(binary, args, prompt)
        stdin = prompt.read_text(encoding="utf-8")
        env = {**os.environ, "CLAUDE_CODE_DISABLE_AUTO_MEMORY": "1"}

    if args.dry_run:
        print(" ".join(cmd) + ("" if reviewer == "grok" else f" < {prompt}"))
        return

    for f in (prompt, subject):
        if f:
            atexit.register(f.unlink, missing_ok=True)
    sys.stderr.write(f"[grok_review.py] {brief.name} -> {args.cwd_resolved} ({reviewer})\n")
    started = time.time()
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            input=stdin,
            cwd=str(args.cwd_resolved),
            env=env,
            timeout=args.timeout,
        )
    except subprocess.TimeoutExpired:
        sys.exit(f"[grok_review.py] round exceeded --timeout {args.timeout}s. Nothing to read.")

    elapsed = time.time() - started
    out = proc.stdout or ""
    body = out.strip()

    if args.out:
        Path(args.out).expanduser().write_text(out, encoding="utf-8")

    if proc.returncode != 0:
        sys.stderr.write(f"[grok_review.py] {reviewer} exited {proc.returncode} after {elapsed:.0f}s\n")
        if proc.stderr:
            sys.stderr.write(proc.stderr)
        sys.stdout.write(out)
        sys.exit(proc.returncode)

    sys.stdout.write(out)
    if out and not out.endswith("\n"):
        sys.stdout.write("\n")

    summary = f"[grok_review.py] {len(body)} chars in {elapsed:.0f}s"
    if args.out:
        summary += f", written to {args.out}"

    if len(body) < args.min_chars and not args.allow_short:
        sys.stderr.write(summary + "\n")
        sys.stderr.write(
            f"[grok_review.py] FAILED ROUND — {len(body)} chars is below "
            f"--min-chars {args.min_chars}.\n"
            "  This is the 2026-09-08 failure: exit 0, a short preamble, and it "
            "reads as a clean round.\n"
            "  A round that genuinely found nothing still argues its way there "
            "over paragraphs.\n"
            "  Read the output above. If it really did reason to empty, re-run "
            "with --allow-short.\n"
        )
        sys.exit(2)

    sys.stderr.write(summary + "\n")


if __name__ == "__main__":
    main()
