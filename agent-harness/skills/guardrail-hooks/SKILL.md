---
name: guardrail-hooks
description: "An agent keeps breaking a rule ('it did it again', 'make this impossible', 'add a hook', 'my hook didn't fire'): make it a hook, permission rule or script."
---

# Guardrail hooks — rules held by code

**A rule whose compliance depends on an agent remembering it at the decisive moment becomes a code path**, because prose loses that contest to everything else the agent has read. The principle, its evidence and the test question are in the `agent-instructions` skill (its prose-vs-code reference). This skill is the practice: which code path to use, how to write a hook that holds a rule without becoming noise, and two hooks to adapt.

The receipt that made the hooks here: on `2026-10-12` an owner answered "up to you" about a wording choice, and the agent stretched it into "my call: delete the live post and repost tomorrow". Nothing was deleted, but only the agent's judgment stood in the way of a one-line delete. The instructions had said since `2026-06-02` that deleting anything public needs the owner. The fix was a hook that makes the owner click.

## Pick the smallest code path that holds the rule

| The rule is about | Hold it with | Example |
|---|---|---|
| a command the agent may run, recognisable by its prefix | a **permission rule** in settings: `permissions.ask: ["Bash(gh repo delete *)"]`, or `permissions.deny` | checked against every subcommand, inside `$()` and loop bodies too, and still prompts in auto mode (read `2026-10-24`). No script to maintain |
| what a command does when its text alone can't tell: code in a heredoc, a script it runs, the value of an argument | a **PreToolUse hook** | `scripts/guard_one_way_doors.py`, `scripts/block_wrong_identity.py` |
| how your own tool may be used | a **required argument, or a refusal inside the tool** | a search-analytics tool, after four silent data errors in one session (`2026-08-12`: a capped, click-sorted single pull kept 23% of impressions; a cached file read as a 40-day window was a 17-month aggregate): pulls now paginate and write a manifest of the exact window, and the report refuses to run without one |
| what a commit may contain | a **git pre-commit hook** in the repository, switched on per clone (`git config core.hooksPath .githooks`, set by a session-start hook) | refusing a commit that empties or halves a bookkeeping file (`2026-09-07`: a ledger committed as 0 bytes while resolving a conflict, 209 rows gone, and the nightly job crashed on it) |
| what must be true before the agent says it is done | a **Stop hook** returning `decision: "block"` with the reason | tests ran; the release log has every step |
| what the agent must know when it starts | a **SessionStart hook** returning `additionalContext` | git state checked by code: a shallow clone deepened before any ancestry check (`2026-08-05`, after three sessions burned time on bogus "unrelated histories"); a warning when the session started on a machine-named branch (`2026-07-30`, three days of work stranded on one) |
| a derived file that must track its source | a **PostToolUse hook** that runs the sync | a one-way mirror of the skills folder for agents that read another path, re-synced on every write; it always exits 0 so a sync hiccup never blocks a tool |

Prefer the higher rows: a permission rule beats a hook, and a refusal inside your own tool beats both, because it holds for every agent and every human that runs it. When the instruction file states such a rule, it says what holds it and where it doesn't ("Bash is held by a hook; MCP tools and browser clicks are not covered, so the rule still binds there").

## Writing a guard that holds without becoming noise

Each rule came from a receipt.

1. **Gate only what the owner would actually want to click for.** The first version of the one-way-door guard (`2026-10-12`) also gated process kills, `rm -rf`, HTTP DELETE and destructive git, and scanned all command text. It fired twice on a benchmark session whose heredoc merely *contained* a scoped `pkill -f`, and the owner said "I don't want those questions." It was narrowed the same day to public deletes and publishes. A guard that asks too often trains a reflexive yes, which is worse than no guard.
2. **Match what runs, not what is mentioned.** Cut heredoc bodies out before matching command rules: text written to a file is not a command. Inside code, match the API call (`.delete_post(`), never a CLI string a docstring might quote. Same class, found while porting (`2026-10-24`): an identity guard that matched a forbidden address anywhere in a command also blocked `git log --author=<address>`, the search its own docstring said it allowed, and blocked a test whose JSON merely contained the address. The script here (`scripts/block_wrong_identity.py`) matches per command segment and only on `commit` for `--author`.
3. **Look inside what the command runs.** A command-text guard is blind to `python cleanup.py`. The guard here opens local scripts the command runs (and heredoc bodies fed to an interpreter) and scans them with the code rules, because the delete in the receipt above was callable from any inline script.
4. **Choose the verdict on purpose.** `ask` puts a human in the loop, forces a prompt even in auto mode, and denies in a non-interactive run where nobody can answer. `deny` refuses and tells the agent why. Exit 2 refuses and is the one form Claude Code, Codex and Cursor all honor. Address the agent in the reason too ("Agent: never approve this on the owner's behalf"): the agent reads it, and a prompt it can talk the owner through is a formality.
5. **The go for a one-way door is typed in the conversation, never on a side page.** An approval the owner wrote on a decisions page, a doc or a ticket reaches the agent as a tool result, and the harness's check does not read tool results. Claude Code's auto-mode classifier sees the user's messages and the agent's tool calls, with tool results stripped so that content in a file or page cannot steer it; an approval in a message clears a block only when it names the action and its specifics (the branch of a force push), not the verb alone (permission-modes docs, read `2026-10-25`). A prompt forced by an ask rule or a hook needs the click whatever was said. So when the owner answered on a side page, ask for the go in the conversation, naming the action and its target. (`2026-10-24`, a monitoring product: a go for a production push given on the owner's decisions page did not clear the permission check; it had to be typed in the chat.)
6. **Never block the way out.** A spend fuse exempts its own management commands, so disarming works when the session is over budget (`2026-06-22`, burnstop, an open-source budget-fuse plugin for Claude Code). A guard that blocks the command that clears it has to be removed by hand.
7. **Decide which way it fails.** By default a hook that can't start, crashes, exits 1 or times out lets the action through. For a policy hook set `"onFailure": "block"` (Claude Code 2.1.295 or later), use exit 2 (never 1) to block, and watch the first run for a `hook error` notice: a mistyped path in settings means the hook never runs and nothing else says so.
8. **Keep stdout to one JSON object.** Anything else on stdout, such as a shell profile's greeting, makes the decision unreadable, and an unreadable decision is a non-blocking error.
9. **Test it like a program, before wiring it.** A command hook reads JSON on stdin and answers with an exit code and stdout, so pipe sample payloads in: one that must trigger, and look-alikes that must not. `scripts/test_hooks.py` does this; replace its cases when you replace the rules.
10. **Know what a hook can't see.** `PreToolUse` fires on tool calls only: not on files the user `@`-mentions, and a `Bash` matcher doesn't cover an MCP tool or a browser that does the same thing. Codex's docs say some tool paths opt out of hooks entirely. A hook is a guardrail, not a sandbox.
11. **To stop a run, use `Stop`.** `continue: false` from a `Stop` hook stops the agent and takes precedence over event-specific "continue" decisions, which is how the spend fuse beats `/goal`, itself a Stop hook (`2026-06-22`; the precedence confirmed in the docs on `2026-10-24`). A `Stop` hook that blocks must check `stop_hook_active`; Claude Code ends the turn after 8 consecutive continuations anyway.

## The scripts

All standard-library Python, configured in a `CONFIG` block at the top (or a JSON file / environment variables), reading the command from `tool_input.command` (Claude Code, Codex) or a top-level `command` (Cursor's `beforeShellExecution`), and reading and writing UTF-8 explicitly (on Windows, Python otherwise decodes the pipe with the ANSI code page).

| File | Does | Configure |
|---|---|---|
| `scripts/guard_one_way_doors.py` | asks (or denies, or exits 2) before an irreversible or public action: command rules on what the shell runs with heredocs cut out; code rules inside heredoc bodies and local scripts the command runs | `command_rules`, `code_rules`, `skip_scripts`, `mode` in `CONFIG`; or `--config <file>` / `ONE_WAY_DOORS_CONFIG` (keys replace CONFIG's); `ONE_WAY_DOORS_MODE=ask\|deny\|block` |
| `scripts/block_wrong_identity.py` | exits 2 when a forbidden address is set as a git identity (`user.email`, `-c user.email=`, `GIT_AUTHOR_EMAIL=` and friends) or passed as a commit's `--author`; searching for it is allowed. Receipt: an agent harness showed the owner's sign-in address as "the user's email"; on the code host it belonged to another account, and commits authored with it were credited there in three repositories (`2026-09-07`, `2026-10-02`, `2026-10-05`) | `blocked_emails` in `CONFIG`, or `BLOCKED_GIT_EMAILS=a@x,b@y`; `GIT_IDENTITY_HINT` for what to use instead |
| `scripts/test_hooks.py` | pipes sample payloads into both and checks exit codes and decisions: the triggers, the look-alikes, each mode, a config file, a Git Bash `/c/` path and a non-ASCII rule | replace the cases with yours |

Install, for Claude Code:

1. Copy the scripts to `.claude/hooks/` (one project, committed) or `~/.claude/hooks/` (every project on your machine; cloud sessions don't read it).
2. Replace the example rules with your own one-way doors and the look-alikes you expect, then run `python <skill dir>/scripts/test_hooks.py` until it passes.
3. Wire them in the settings file next to them. Exec form (`args`) passes the path as one argument with no shell to mangle it:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "python",
            "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/block_wrong_identity.py"], "onFailure": "block" },
          { "type": "command", "command": "python",
            "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/guard_one_way_doors.py"], "onFailure": "block" }
        ]
      }
    ]
  }
}
```

   In `~/.claude/settings.json` there is no project directory: give the absolute path, with forward slashes. Use `python3` where `python` is Python 2 or missing.
4. Open `/hooks` and check both are listed. Then ask the agent to run `echo gh repo delete test/test`: the guard matches the text and prompts. Decline it.

For **Codex**, wire the same scripts in `.codex/hooks.json` and set `mode` to `block`: Codex parses `ask` but doesn't support it yet, marks the run failed and lets the call through (read `2026-10-24`). Trust each hook in `/hooks`, and again after every edit. For **Cursor**, register them on `beforeShellExecution` in `block` mode, or adapt the output to its `{"permission": ...}` shape. Details: `references/hook-contract.md`.

## On Windows

- **Shell-form hooks run through Git Bash, which eats backslashes.** A hook command written `C:\Python313\python.exe ...` ran as `C:Python313python.exe: command not found`, and every hook errored (`2026-06-22`, burnstop's installer). Forward slashes, or exec form.
- **File paths in `tool_input` arrive with backslashes** even under Git Bash. Normalize (`path.replace("\\", "/")`) before matching a segment such as `/src/`, or the check silently never matches.
- **Without Git Bash, shell-form hooks run in PowerShell.** Several of those cases failed open until recently (the changelog lists fixes in 2.1.299, 2.1.309 and 2.1.310, read `2026-10-24`): run a current version and set `onFailure`.
- **Python hook output is in the ANSI code page unless you say otherwise.** A hook's `§` reached the transcript as `�` (`2026-10-24`, Python 3.13 on Windows 11). The scripts here reconfigure stdout and stderr to UTF-8 and decode stdin as UTF-8.
- The rest of the Windows traps are the `windows-agent-shell` skill.

## Re-verify

Every vendor fact here is dated; hooks change monthly. Before relying on one, or every few months:

1. `claude --version`, then re-read the hooks reference (`https://code.claude.com/docs/en/hooks.md`, append `.md` for the raw page) for exit codes, `permissionDecision` values, `onFailure` and the Windows notes. Correct `references/hook-contract.md` and its dates.
2. Codex (`https://developers.openai.com/codex/hooks`): is `ask` supported yet? If so, the guard's `block` advice for Codex can go.
3. Cursor (`https://cursor.com/docs/agent/hooks`): which events enforce `ask`, and the input shape.
4. Run `scripts/test_hooks.py`, then trigger each wired hook once in a real session and see it act. A test proves the script; only the live trigger proves the wiring.

## How you can tell it worked

The hook asks or blocks on a sample that must trigger, stays silent on the look-alikes, and fired in a real session: the debug log shows it ran.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/hook-contract.md` | Claude Code's hook contract (locations, matchers, exec vs shell form, stdin, exit codes, JSON decisions, failure modes, debugging) and how Codex and Cursor differ, each dated | writing or debugging any hook |
| `scripts/guard_one_way_doors.py` | the one-way-door guard template | gating irreversible or public actions |
| `scripts/block_wrong_identity.py` | the commit-identity guard template | an agent sees an address it must never commit as |
| `scripts/test_hooks.py` | the hooks' test runner | after every edit to a hook or its rules |
