---
name: claude-agents
description: "'Ask Claude', 'have Claude build or review this': drive Claude Code headless (claude -p) from another agent as a peer, builder or fresh reviewer."
---

# Claude agents — Claude Code headless as a partner

**Run headless Claude Code as a peer, builder or fresh reviewer.** Any agent can run `claude -p` for a full session: the repository's instructions, its tools and a conversation that can continue. It is a partner with the same standing as its caller. A peer argues a decision through, a builder takes a stage, and a reviewer has never seen the build. This skill covers briefs, modes and mechanics through `<skill dir>/scripts/claude_agent.py`.

## The partner discipline (compact)

**Apply the `delegation` skill for the full partner discipline.** These rules must hold even when this folder is copied alone.

1. **A delegate gets the why, not just the what.** Give the goal in the owner's terms, the decision it feeds and the facts. Include reasoning behind non-obvious choices, binding constraints, traps a smart newcomer would walk into, and how the result will be proved. Never a keystroke script: no prescribed paths, filenames, libraries or steps unless they are hard constraints. A brief containing the goal gets judgement; instructions alone get compliance that is wrong in the larger system.
2. **Treat the delegate as a peer, not a tool.** Its view is not binding, and neither is yours. A choice you would not have made is a disagreement to surface, not a defect.
3. **Bring the partner in early, while the framing is open.** The cheapest wins concern the angle, the load-bearing claim and what to cut. A late sign-off is the least valuable use.
4. **Iterate.** Continue the conversation after the first draft comes back. Three to eight turns is normal. Stopping at turn 1 treats a partner as a one-shot generator.
5. **Converge before surfacing.** The human arbitrates intent and taste, not trade-offs two agents could argue through. Bring one result, or a disagreement stated cleanly.
6. **A delegated diff is unreviewed code, and the session that wrote it never clears it.** Read it, check the disk and re-run the gate yourself. The independent review is a fresh session; apply `independent-review`.
7. **Keep product decisions, real systems and final judgement with you.** Decide what the product should do, accept or reject review findings, perform final verification and judge whether a stage is done. Keep anything touching a real system, development included, such as deploys, migrations applied to any database, server secrets and live settings. The builder makes each real-system step one command and names it; you run it.
8. **Write the diff yourself when the brief would be nearly as long.** Judge delegation by size, not time.

## Peer, builder or reviewer

| Role | Mode | What it can do | Session |
|---|---|---|---|
| Peer — argue a framing, pressure-test a claim, a second opinion on a plan | `consult` (default) | Read, Grep, Glob and the read-only shell (`git log`, `git diff`, `git status`); every write is denied | continued turn after turn |
| Builder — a stage with a goal, its binding decisions and how to prove it | `build` | Edits, shell, tests; a classifier reviews each action (auto mode) | continued within the stage |
| Reviewer — fresh eyes on an artifact, a plan, a change | `review` | Read, Grep, Glob only; no settings, hooks, plugins, MCP, project instructions or memory | always new, never saved |

- **A review needs a fresh session.** Never resume or fork the building thread, or use its subagent. `--fork-session` copies the builder's beliefs with its transcript. `--mode review` always starts a fresh session and never saves it.
- **Route reviews of commits through the `independent-review` skill's wrapper.** Review mode has no shell and cannot read a git range. The wrapper's `--reviewer claude` uses this same fresh headless session for a change before a push or a release. It writes the range's log and diffs to a file the reviewer pages through, and fails short rounds loudly. It loops until nothing introduced is above Low and no High or Critical of any age is open. Don't give review mode git commands instead: `Bash(git diff:*)` also allows `git diff --output=<file>` to write.
- **When the caller is itself Claude, a headless Claude is the same model family.** A consult still buys fresh context and different reasoning, but blind spots are shared. For an independent review, prefer another family: Grok, the `independent-review` wrapper's default, as `grok-agents` describes. Without Grok, that wrapper's accepted fallback is this same fresh headless session.
- **In consult and build the delegate reads what you read.** It loads the repository's `CLAUDE.md`, or `AGENTS.md` when no `CLAUDE.md` exists, and the user's `~/.claude/CLAUDE.md`. The project's auto-memory, hooks and skills load too. This suits a builder but makes it dependent on those instructions, which review mode excludes.

## The opening brief

**Give the brief what the repository's instructions do not contain.** Consult and build read those instructions themselves. Supply the decision at hand, conversation so far, and what you have already tried and rejected.

| | What | Example |
|---|---|---|
| TARGET | What we are producing or deciding, and for whom | "a call on whether retries belong in the client or the queue", "stage 3: the export endpoint" |
| RESEARCH | What is actually known | logs, measurements, the source quote, what the owner said, prior attempts |
| DRAFT | The current version and the variants considered | paste the artifact, not a description of it |
| REASONING | Why you are stuck, or what binds the build | what you rejected and why; the trap ("the same string feeds another spawn path, so not in the argument builder"); how it will be proved |

**Name the binding-spec files in a review brief.** Review mode reads nothing on its own.

**Put long briefs in a file and read them from there.** The wrapper sends every prompt on stdin, never as an argument.

```bash
python <skill dir>/scripts/claude_agent.py --new --cwd <repo> --read <brief file>
python <skill dir>/scripts/claude_agent.py --new --mode build --cwd <worktree> --read <stage brief>
python <skill dir>/scripts/claude_agent.py --mode review --cwd <repo> --read <review brief>
```

**Run a partner on the strongest model the account offers.** `--model opus` tracks the newest Opus; `best` picks Fable where the account has it. The wrapper sends `xhigh` effort by default and `max` for a review. Without an explicit level, Opus, Sonnet and Haiku 5.5 run at `medium` (model configuration docs, read 2026-10-24).

## Follow-up turns

**React like a colleague and continue the conversation already under way.** Agree where it is right, push back where it is wrong, ask why where it surprises you, and name what it missed. Do not re-package the goal as a new structured prompt. Rewriting the goal in turn 3 leaves the conversation.

```bash
python <skill dir>/scripts/claude_agent.py --cwd <repo> "agree on the queue, but a poison message would block the shard — doesn't that kill it?"
```

A plain call continues the session the wrapper last opened in that directory, in the same mode, on the same model and effort.

**Keep iterating while a critique, disputed choice or unexplored option remains.** This includes a critique you haven't voiced and a choice you don't buy but haven't pushed on. The temptation to ask the human “which of these two?” also signals unfinished work. You have converged when you would defend the result against your critique, neither partner finds new angles, and only taste remains. Surface genuine deadlock, ambiguity about what the human wants, or a fact only they have.

## Resume or start fresh

- **Within a stage or a conversation, resume.** This is the default.
- **A new stage or a new question starts fresh, with `--new`.** Project knowledge belongs in its docs and the brief. A long thread carries assumptions those docs have since replaced. If a fresh session would miss something, that is a gap in the docs.
- **Parallel builds get a worktree each.** The wrapper keeps one session per working directory, so two worktrees never share one. Two sessions in one directory need separate state files: `CLAUDE_AGENT_STATE=<a file per session>` on every call for that session.
- **An earlier session resumes by id: `--session <id>`.** The wrapper prints every run's id. Claude Code finds an id in any project on the machine and keeps transcripts 30 days by default (sessions docs, read 2026-10-24). `--session` fails rather than starting a new session.
- **A usage limit makes the partner unavailable, as a missing CLI does.** The run fails with a non-zero exit and the limit's message, such as "You've hit your session limit · resets 3:45pm" (errors docs, read 2026-10-24). Wait if the reset is near; otherwise do the work yourself, and the independent review still applies. State keeps the session, so the next call after reset continues it.

Each rule's origin, the case that taught it, is in `receipts.md` beside this file; read it when a rule's edge is unclear.

## How you can tell it worked

The answer came from a session that started with only your brief. You read its exit code and output from the run itself, and anything it built was reviewed before it was trusted.

## Mechanics

**Use the wrapper's absolute path and pass its repository through `--cwd`.** This skill's `<skill dir>/scripts/claude_agent.py` works from any directory and uses only the Python standard library. `--check` shows the binary, version and state file without running anything. `--dry-run` prints the exact `claude` command.

| Command | Effect |
|---|---|
| `claude_agent.py "<msg>"` | Continue this directory's session, else start one (consult) |
| `claude_agent.py --new "<msg>"` | Force a new session |
| `claude_agent.py --session ID "<msg>"` | Resume that session; no fallback |
| `claude_agent.py --read FILE` | Message from FILE (`-` for stdin) |
| `claude_agent.py --status` / `--reset` | Show / forget this directory's session |

| Flag | Default | Notes |
|---|---|---|
| `--mode` | `consult`; a resume keeps the session's last mode | `consult` / `build` / `review` (table below). Applied on every turn. |
| `--model` | the CLI's | Alias or full id. Remembered and re-sent on every resume. |
| `--effort` | `xhigh`; review `max` | `low` … `max`. Remembered and re-sent on every resume, which does not keep it. |
| `--cwd DIR` | current directory | Where the session works; sessions are scoped to it. |
| `--add-dir DIR` | — | Extra directory the tools may reach; repeatable; re-sent on resume. |
| `--budget USD` | none | `--max-budget-usd`: stops the run at that estimated spend. |
| `--max-turns N` | none | Stops after N agentic turns. |
| `--schema FILE` | — | A JSON Schema; prints the validated `structured_output` instead of text. |
| `--mcp` | off | Load the configured MCP servers (consult, build). |
| `--timeout SEC` | 3600 | Kills the run; the state keeps the session if it opened. |
| `--log FILE` | — | Appends the raw `stream-json` events as they arrive, to tail a long build. |
| `--raw` | off | Prints the whole result event as JSON. |

**Apply the mode's flags again on every turn.**

| Mode | Flags |
|---|---|
| `consult` | `--permission-mode dontAsk --permission-prompts none --tools Read,Grep,Glob,Bash --strict-mcp-config` |
| `build` | `--permission-mode auto --permission-prompts none --strict-mcp-config` (default tools) |
| `review` | `--restricted --tools Read,Grep,Glob --strict-mcp-config --permission-mode dontAsk --permission-prompts none --no-session-persistence`, `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`, and `CLAUDE_CODE_EFFORT_LEVEL` removed |

**Read that line before trusting a round.** After each run, the answer goes to stdout and one status line to stderr. It names the new or resumed session id, mode, actual permission mode, model, reply effort, this run's cost, session cost and turns. It warns about differences from requested values, lists denied tool calls and warns when Claude Code saved no transcript. All modes add `-p --output-format stream-json --verbose --effort <level>`. A failed run prints nothing on stdout and exits non-zero; a bad wrapper argument exits 2.

### Session continuity

**Resume the recorded session id rather than the directory's latest conversation.** Each working directory has a small state file under `<claude config dir>/claude-agent/`. It records the id Claude Code reported on opening, plus mode, model, effort and extra directories. The next call uses `--resume <id>` with those settings. `--continue` instead takes the directory's latest conversation, whoever started it. `claude -p --continue` includes every `-p` session there (CLI reference, read 2026-10-24).

**The state names the last session that opened, including failed runs.** A usage limit or mid-build timeout leaves state on the session holding the brief and work so far. The next call continues it; `--new` starts over. Automatic resume falls back to a new session only when Claude Code has no transcript for the id. That returns `No conversation found with session ID`, exit 1, without opening a session (observed 2026-10-24). Explicit `--session` fails instead.

**`claude -p --resume` restores the model and nothing else the wrapper sets.** Observed 2026-10-24, Claude Code 2.1.310: a Haiku session started at effort `low`, with `--permission-mode dontAsk`, three tools and no MCP servers. Bare `--resume <id>` kept Haiku but changed effort to `medium`, permission mode to `default`, and access to 145 tools and 11 MCP servers.

A resume starts in the permission mode a new `-p` run would. Pass `--add-dir`, `--mcp-config` and `--settings` again (sessions docs, read 2026-10-24). The wrapper re-sends mode, model, effort and directories every turn. Pass them all every time when calling `claude -p --resume` directly. Without its permission mode, a resumed build denies writes and reports work it never did.

### What a `-p` session loads

**Consult and build load project context; review excludes it.** The observed entries below were checked on 2026-10-24.

| | Plain `claude -p` | consult / build | review | `--bare` |
|---|---|---|---|---|
| Project `CLAUDE.md` / `AGENTS.md`, user `~/.claude/CLAUDE.md` | yes | yes (the project file observed) | no (observed) | no |
| Auto-memory for the directory | yes | yes | no | no |
| Hooks, skills, plugins from settings | yes | yes; consult lists the skills but has no Skill tool to run them | no (`--restricted` ignores user, project and local settings) | no |
| MCP servers | all configured, the account's connectors included | none unless `--mcp` | none | only `--mcp-config` |
| Login | subscription or API key | same | same | `ANTHROPIC_API_KEY` or `apiKeyHelper` only |

**Leave MCP out unless asked.** A delegate does not need the owner's mailbox.

Measured 2026-10-24, a plain `claude -p` in a scratch folder loaded 145 tools and 11 MCP servers. These included the account's mail, chat and drive connectors, alongside 15 plugins and 110 skills. Its first reply wrote a 47k-token prompt cache. That cost $0.0096 on Haiku 5.5, against $0.0012 with three tools and no MCP.

**`--bare` cannot use subscription login and skips the project's instructions.** It never reads OAuth or the keychain. The headless docs, read 2026-10-24, say it will become the default for `-p` in a future release. Re-check `claude --help` when wrapper runs start answering without the project's instructions.

**Point consult and build only at repositories you trust.** Without `--bare` or `--restricted`, a `-p` run executes the project's hooks even in a folder never trusted, with no trust dialog (headless docs, read `2026-10-24`). Without `--strict-mcp-config`, it connects `.mcp.json` servers even in a folder never trusted, with no trust dialog (headless docs, read `2026-10-24`). Consult and build keep the hooks.

### Permission modes, and why nothing may wait on a prompt

**Pass the permission mode explicitly and disable permission prompts.** Since 2.1.302, a `-p` run without a mode starts in Manual unless settings specify `defaultMode` (permission-modes docs, read 2026-10-24). Manual denies every call needing approval. The wrapper always passes a mode and `--permission-prompts none` (2.1.259+). Calls that would prompt are denied immediately, Claude learns nobody can approve them, and the run continues. `dontAsk` still runs calls allowed by the user's settings; review's `--restricted` ignores those settings.

Observed 2026-10-24: consult had no Write tool; `echo x > f` and a `python -c` file write were denied (two `permission_denials`). `git status` ran, and the disk was unchanged. Review had only Read, Grep and Glob and attempted no write. Build, in auto mode on Haiku 5.5, edited a file, ran it and ran `git status`.

**Keep every real system out of an auto-mode build brief.** Auto mode is a safety net, not a boundary. It needs a supported model and an organization that hasn't disabled it; otherwise the session starts in Manual (permission-modes docs, read 2026-10-24). Supported Anthropic API models are Opus 4.6+, Sonnet 4.6+, Haiku 5.5 and Fable; cloud providers support fewer. The wrapper's stderr line shows the mode that actually ran. Production and every other real system stay out.

### Calling it from inside a sandbox

**Give the Claude process network access and a writable config directory.** It needs the network to reach the API and config writes to save the session. `claude auth status` prints that directory as `configDirectory`.

- **Configure both network and config writes inside Codex `workspace-write`.** On Codex CLI 0.159, Windows, both were needed for a resumable conversation (observed 2026-10-24). Default config opened the session, then failed with `API Error: Connection refused … (ECONNREFUSED)` after about three minutes of retries. With `-c sandbox_workspace_write.network_access=true`, it answered in seven seconds but saved no transcript, preventing continuation. The wrapper now warns when that happens. Adding the config directory as a writable root made a two-turn conversation work:

  ```bash
  codex exec -s workspace-write \
    -c sandbox_workspace_write.network_access=true \
    -c "sandbox_workspace_write.writable_roots=['<claude config dir>']" ...
  ```

  Codex's config reference and approvals-and-security page document both keys, also as `[sandbox_workspace_write]` entries in `config.toml` (read 2026-10-24). `danger-full-access` also works, with no sandbox. Codex ran the command through PowerShell, so put messages containing quotes in a file passed with `--read`.
- **Check transcript saving when running inside another agent's sandbox.** Cursor, Gemini CLI, OpenCode and Grok Build were not tested here. The same network and config-write needs apply; check the disk for the transcript or read the wrapper's warning.

### Cost, limits and long runs

- **Login decides the bill.** A Claude subscription draws on plan limits; an API key bills per token. Reported cost is a client-side estimate either way (headless docs, read 2026-10-24). On resume, `total_cost_usd` is the whole session total. The wrapper prints this run's cost from `model_usage_since_last_result` beside it (observed 2026-10-24).
- **Budget and turn limits stop runs with a non-zero exit.** `--budget` and `--max-turns` both stop the run. Budget exhaustion returns `error_max_budget_usd` (observed 2026-10-24), and spend can exceed the cap, so leave headroom (CLI reference). `--max-turns` appears in the CLI reference but not `claude --help`.
- **Read usage failures and the stream's utilization information.** Usage limits fail the run with the limit's message. Every stream carries a `rate_limit_event` with five-hour and seven-day utilization (observed 2026-10-24).
- **A build round takes minutes to an hour.** Run the wrapper as your harness's background job, rather than inside a shell tool with a short timeout. Use `--log` to watch events. After its last turn, a `-p` run waits up to ten idle minutes for background work it started. `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS` controls this (headless docs, read 2026-10-24).
- **Use background sessions for a human watching sessions.** Commands are `claude --bg "<task>"`, then `claude agents --json`, `claude logs <id>`, `claude attach <id>` and `claude stop <id>`. `--bg` cannot combine with `-p`; it prints a session id and returns immediately instead of a result (CLI help and headless docs, read 2026-10-24). The wrapper runs in the foreground.

### Binary lookup

**Use the configured binary, then PATH, then native installer locations.** Lookup tries `$CLAUDE_BIN`, then `claude` on PATH. Windows prefers native `claude.exe` over an npm `.cmd` shim. Native locations are `~/.local/bin`, `~/.claude/local`, and macOS's `/opt/homebrew/bin` and `/usr/local/bin`. The wrapper refuses versions older than 2.1.259, which lack `--permission-prompts`.

### Gotchas captured

- **Effort is visible only in the transcript.** JSON names the model through `modelUsage` and the init event's `model`, but not effort. The transcript records effort on every reply. The wrapper reads it best-effort because that format is internal (observed 2026-10-24). Environment variable `CLAUDE_CODE_EFFORT_LEVEL` overrides `--effort` (env-vars docs). The wrapper warns when it is set and removes it in review mode, so reviews run at the requested effort.
- **An unknown model is not caught up front.** The session opens; its first request fails with `There's an issue with the selected model` (API 404), exit 1 (observed 2026-10-24). State keeps that session, so pass `--model` again or `--new`.
- **A failed run's `result` is the error text.** The wrapper prints it on stderr, never as the answer. When calling `claude -p` directly, check `is_error` rather than exit code alone.
- **Nested under Claude Code it still works.** The child inherits `CLAUDECODE=1` and `CLAUDE_CODE_CHILD_SESSION=1`. Its `-p` sessions remain saved and resumable (observed 2026-10-24; env-vars docs agree).
- **Send the prompt on stdin and close stdin afterward.** The prompt cap is 10 MB (headless docs); name larger material in a file in the brief. Open stdin makes the run wait for more.

## Not this skill

**Apply `delegation` for briefs, boundaries, parallel work and handoff verification.** Apply `independent-review` for the release-gate review loop, and `codex-agents` to drive the Codex CLI the same way.
