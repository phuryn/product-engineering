---
name: claude-agents
description: "'Ask Claude', 'have Claude build or review this': drive Claude Code headless (claude -p) from another agent as a peer, builder or fresh reviewer."
---

# Claude agents — Claude Code headless as a partner

Any agent can run Claude Code non-interactively (`claude -p`) and get a full Claude Code session back: the repository's instructions, its tools, a conversation that can be continued. Used that way it is a **partner**, same standing as the agent calling it — a peer that argues a decision through, a builder that takes a stage, or a reviewer that has never seen the build. This skill is how to brief it, which mode to run it in, and the mechanics, through the wrapper in `<skill dir>/scripts/claude_agent.py`.

## The partner discipline (compact)

The full doctrine is the `delegation` skill; this is what must hold even when this folder is copied alone.

1. **A delegate gets the why, not just the what.** The goal in the owner's terms, the decision it feeds, the facts, the reasoning behind non-obvious choices, the constraints that bind and the traps a smart newcomer would walk into, and how the result will be proved. Never a keystroke script: no prescribed paths, filenames, libraries or steps unless they are hard constraints. A brief with the goal in it comes back with judgement; an instruction-only brief comes back compliant and wrong in the large.
2. **Peer, not tool.** Its view is not binding, and neither is yours. A choice you would not have made is a disagreement to surface, not a defect.
3. **Early, not late.** The cheapest wins are at framing: the angle, the load-bearing claim, what to cut. A late sign-off is the least valuable use.
4. **Iterate.** Three to eight turns is normal. Stopping at turn 1 because a draft came back treats a partner as a one-shot generator.
5. **Converge before surfacing.** The human arbitrates intent and taste, not trade-offs two agents could argue through. Bring one result, or a disagreement stated cleanly.
6. **A delegated diff is unreviewed code, and the model that wrote it never clears it.** Read it, check the disk, re-run the gate yourself; the independent review is a fresh session (`grok-agents`).
7. **What never delegates:** deciding what the product should do; accepting or rejecting a review finding; anything that touches a real system, development included (a deploy, a migration applied to any database, a server's secrets, a live setting): the builder makes each one command and names it, and you run it; final verification; the judgement that a stage is done.
8. **Size, not time.** If the brief would be nearly as long as the diff, write the diff yourself.

## Peer, builder or reviewer

| Role | Mode | What it can do | Session |
|---|---|---|---|
| **Peer** — argue a framing, pressure-test a claim, a second opinion on a plan | `consult` (default) | Read, Grep, Glob and the read-only shell (`git log`, `git diff`, `git status`); every write is denied | continued turn after turn |
| **Builder** — a stage with a goal, its binding decisions and how to prove it | `build` | Edits, shell, tests; a classifier reviews each action (auto mode) | continued within the stage |
| **Reviewer** — fresh eyes on an artifact, a plan, a change | `review` | Read, Grep, Glob only; no settings, hooks, plugins, MCP, project instructions or memory | always new, never saved |

- **A review needs a fresh session.** Never the building thread resumed or forked (`--fork-session` copies the builder's beliefs with its transcript), never a subagent of it. `--mode review` always starts one and never saves it. For the release-gate loop — the subject computed from git, written to disk for a reviewer with no shell, rounds repeated until nothing introduced is above Low, short rounds failed loudly — use `grok-agents`, whose fallback reviewer is this same fresh headless session.
- **When the caller is itself Claude, a headless Claude is the same model family.** A consult still buys a fresh context and a different line of reasoning, but blind spots are shared; for an independent review prefer another family (Grok, Codex) and accept a same-family reviewer only when none is available.
- **In consult and build the delegate reads what you read.** The repository's `CLAUDE.md` (or `AGENTS.md` when there is no `CLAUDE.md`), the user's own `~/.claude/CLAUDE.md`, the project's auto-memory, its hooks and skills all load. It is not independent of what is written there — which is the point for a builder and the reason review mode loads none of it.

## The opening brief

Claude Code reads the repository's instructions on its own in consult and build, so **the brief carries what those files do not**: the decision at hand, the conversation so far, what you have already tried and rejected.

| | What | Example |
|---|---|---|
| **TARGET** | What we are producing or deciding, and for whom | "a call on whether retries belong in the client or the queue", "stage 3: the export endpoint" |
| **RESEARCH** | What is actually known | logs, measurements, the source quote, what the owner said, prior attempts |
| **DRAFT** | The current version and the variants considered | paste the artifact, not a description of it |
| **REASONING** | Why you are stuck, or what binds the build | what you rejected and why; the trap ("the same string feeds another spawn path, so not in the argument builder"); how it will be proved |

In review mode it reads nothing on its own, so the brief also names the files that are the binding spec.

Long briefs go in a file and are read from there: the wrapper sends every prompt on stdin, never as an argument.

```bash
python <skill dir>/scripts/claude_agent.py --new --cwd <repo> --read <brief file>
python <skill dir>/scripts/claude_agent.py --new --mode build --cwd <worktree> --read <stage brief>
python <skill dir>/scripts/claude_agent.py --mode review --cwd <repo> --read <review brief>
```

Run a partner on the strongest model the account offers (`--model opus` tracks the newest Opus; `best` picks Fable where the account has it) — the wrapper sends `xhigh` effort by default and `max` for a review, because without an explicit level Opus, Sonnet and Haiku 5.5 run at `medium` (model configuration docs, read 2026-10-24).

## Follow-up turns

React like a colleague: agree where it is right, push back where it is wrong, ask why where it surprises you, name what it missed. Do not re-package the goal as a new structured prompt; if you are rewriting the goal in turn 3, you have left the conversation.

```bash
python <skill dir>/scripts/claude_agent.py --cwd <repo> "agree on the queue, but a poison message would block the shard — doesn't that kill it?"
```

A plain call continues the session the wrapper last opened in that directory, in the same mode, on the same model and effort.

**Signs you are not done:** a critique you have not voiced; a choice it made that you do not buy and did not push on; an option neither of you explored; the temptation to ask the human "which of these two?". **Signs you have converged:** you would defend the result against your own critique; neither of you is finding new angles; what remains is taste. **Surface to the human** on genuine deadlock, on ambiguity about what they want, or on a fact only they have.

## Resume or start fresh

- **Within a stage or a conversation, resume.** The default.
- **A new stage or a new question starts fresh, with `--new`.** What the project knows belongs in its docs and the brief, not in a long thread carrying assumptions the docs have since replaced. If a fresh session would miss something, that is a gap in the docs.
- **Parallel builds get a worktree each.** The wrapper keeps one session per working directory, so two worktrees never share one. Two sessions in one directory need a state file each: `CLAUDE_AGENT_STATE=<a file per session>` on every call for it.
- **An earlier session resumes by id: `--session <id>`.** The wrapper prints every run's id; Claude Code finds an id in any project on the machine and keeps transcripts 30 days by default (sessions docs, read 2026-10-24). `--session` fails rather than starting a new session.
- **A usage limit makes the partner unavailable, as a missing CLI does.** The run fails with the limit's message ("You've hit your session limit · resets 3:45pm", errors docs, read 2026-10-24) and a non-zero exit. Wait if the reset is near; otherwise do the work yourself, and the independent review still applies. The state keeps the session, so after the reset the next call continues it.

## How you can tell it worked

The answer came from a session that started with only your brief, its exit code and output were read from the run itself, and anything it built was reviewed before it was trusted.

## Mechanics

The script is this skill's own `scripts/claude_agent.py`. Use its absolute path so it works from any directory, and pass `--cwd` so the session is scoped to the repository it works in. Python standard library only; `--check` shows the binary, its version and the state file without running anything, `--dry-run` prints the exact `claude` command.

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

What each mode sends, every turn:

| Mode | Flags |
|---|---|
| `consult` | `--permission-mode dontAsk --permission-prompts none --tools Read,Grep,Glob,Bash --strict-mcp-config` |
| `build` | `--permission-mode auto --permission-prompts none --strict-mcp-config` (default tools) |
| `review` | `--restricted --tools Read,Grep,Glob --strict-mcp-config --permission-mode dontAsk --permission-prompts none --no-session-persistence`, and `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` |

All three add `-p --output-format stream-json --verbose --effort <level>`. After each run the answer goes to stdout and one line to stderr — new or resumed session id, mode and the permission mode that actually ran, the model that ran, the effort the reply ran at, this run's cost and the session's, turns — plus a warning when any of those differs from what was asked, the list of denied tool calls, and a warning when Claude Code saved no transcript. **Read that line before trusting a round.** A failed run prints nothing on stdout and exits non-zero (2 for a bad argument to the wrapper).

### Session continuity

One small state file per working directory under `<claude config dir>/claude-agent/` records the session id Claude Code reported when it opened the session, with its mode, model, effort and extra directories; the next call resumes that id (`--resume <id>`) with the same settings. Not `--continue`: that takes the most recent conversation in the directory, whoever started it, and `claude -p --continue` includes every `-p` session there (CLI reference, read 2026-10-24).

**The state names the last session that opened in the directory, whether the run then succeeded or failed.** A usage limit or a timeout part-way through a build leaves it on that session, which holds the brief and the work so far, so the next call continues it; `--new` starts over. A resume falls back to a new session only when Claude Code has no transcript for the id (`No conversation found with session ID`, exit 1, no session opened — observed 2026-10-24); with `--session` it fails instead.

**`claude -p --resume` restores the model and nothing else the wrapper sets.** Observed 2026-10-24, Claude Code 2.1.310: a session started on Haiku at effort `low` with `--permission-mode dontAsk`, three tools and no MCP servers, resumed with a bare `--resume <id>`, came back on Haiku — but at effort `medium`, in permission mode `default`, with 145 tools and 11 MCP servers. The docs agree: a `-p` resume starts in the permission mode a new `-p` run would, and `--add-dir`, `--mcp-config` and `--settings` must be passed again (sessions docs, read 2026-10-24). So the wrapper re-sends mode, model, effort and directories on every turn. When calling `claude -p --resume` directly, pass them all every time — a build session resumed without its permission mode runs in a mode that denies its writes and reports work it never did.

### What a `-p` session loads

| | Plain `claude -p` | consult / build | review | `--bare` |
|---|---|---|---|---|
| Project `CLAUDE.md` / `AGENTS.md`, user `~/.claude/CLAUDE.md` | yes | yes (the project file observed) | no (observed) | no |
| Auto-memory for the directory | yes | yes | no | no |
| Hooks, skills, plugins from settings | yes | yes; consult lists the skills but has no Skill tool to run them | no (`--restricted` ignores user, project and local settings) | no |
| MCP servers | all configured, the account's connectors included | none unless `--mcp` | none | only `--mcp-config` |
| Login | subscription or API key | same | same | `ANTHROPIC_API_KEY` or `apiKeyHelper` only |

Observed 2026-10-24: a plain `claude -p` in a scratch folder loaded 145 tools, 11 MCP servers (the account's mail, chat and drive connectors among them), 15 plugins and 110 skills, and its first reply wrote a 47k-token prompt cache — $0.0096 on Haiku 5.5, against $0.0012 with three tools and no MCP. A delegate does not need the owner's mailbox; the modes leave MCP out unless asked. **`--bare` is not usable on a subscription login** (it never reads OAuth or the keychain) and skips the project's instructions; the headless docs (read 2026-10-24) say it will become the default for `-p` in a future release, which would change all of this — re-check `claude --help` when the wrapper's runs start answering without the project's instructions.

Without `--bare` or `--restricted`, a `-p` run executes the project's hooks, and without `--strict-mcp-config` connects its `.mcp.json` servers, even in a folder never trusted, with no trust dialog (headless docs, read 2026-10-24). Consult and build keep the hooks; point them only at repositories you trust.

### Permission modes, and why nothing may wait on a prompt

Since 2.1.302 a `-p` run with no mode set starts in Manual, which denies every call that needs approval, unless a settings file's `defaultMode` says otherwise (permission-modes docs, read 2026-10-24) — so the mode depends on the machine unless it is passed. The wrapper always passes one, plus `--permission-prompts none` (2.1.259+): anything that would prompt is denied at once, Claude is told nobody can approve it, and the run continues. `dontAsk` still runs what an allow rule in the user's settings permits; `--restricted` (review) does not read those settings.

Observed 2026-10-24: in consult, the Write tool was absent, `echo x > f` and a `python -c` file write were both denied (two `permission_denials`), `git status` ran, and the disk was unchanged; in review the session had only Read, Grep and Glob and did not attempt a write; in build (auto mode, Haiku 5.5) it edited a file, ran it and ran `git status`. Auto mode needs a supported model (on the Anthropic API: Opus 4.6+, Sonnet 4.6+, Haiku 5.5, Fable; narrower on cloud providers) and an organization that has not turned it off; otherwise the session starts in Manual (permission-modes docs, read 2026-10-24), and the wrapper's stderr line shows the mode that actually ran. Auto mode is a safety net, not a boundary: production, and every other real system, stays out of a build brief.

### Calling it from inside a sandbox

The `claude` process needs the network, to reach the API, and write access to its config directory (`claude auth status` prints it as `configDirectory`), to save the session. A sandbox that blocks either breaks the partner in a different way:

- **Codex `workspace-write`** (Codex CLI 0.159 on Windows, observed 2026-10-24). Default config: the session opened, then the run failed with `API Error: Connection refused … (ECONNREFUSED)` after about three minutes of retries. With `-c sandbox_workspace_write.network_access=true` it answered in seven seconds but saved no transcript, so the next call could not continue it — the wrapper now warns when that happens. Adding the config directory as a writable root made a two-turn conversation work:

  ```bash
  codex exec -s workspace-write \
    -c sandbox_workspace_write.network_access=true \
    -c "sandbox_workspace_write.writable_roots=['<claude config dir>']" ...
  ```

  The two keys are in Codex's config reference and its approvals-and-security page (read 2026-10-24), as `[sandbox_workspace_write]` entries in `config.toml` too. `danger-full-access` also works, with no sandbox at all. Codex ran the command through PowerShell, so a message with quotes belongs in a file passed with `--read`.
- **Other agents' sandboxes** (Cursor, Gemini CLI, OpenCode, Grok Build): not tested here. The same two needs apply; check the disk for the transcript, or read the wrapper's warning.

### Cost, limits and long runs

- **Login decides the bill.** On a Claude subscription a run draws on the plan's usage limits; with an API key it is billed per token. The cost the result reports is a client-side estimate either way (headless docs, read 2026-10-24). On resume `total_cost_usd` is the session's whole total; the wrapper prints this run's cost from `model_usage_since_last_result` beside it (observed 2026-10-24).
- **`--budget` and `--max-turns` stop a run** with a non-zero exit: the budget as `error_max_budget_usd` (observed 2026-10-24), and spend can pass the cap, so leave headroom (CLI reference). `--max-turns` is in the CLI reference though `claude --help` does not list it.
- **Usage limits** show up as a failed run carrying the limit's message; every stream also carries a `rate_limit_event` with the five-hour and seven-day utilization (observed 2026-10-24).
- **A build round takes minutes to an hour.** Run the wrapper as a background job of your own harness rather than inside a shell tool with a short timeout, and `--log` the events to watch progress. After its last turn a `-p` run waits up to ten idle minutes for background work it started (`CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`, headless docs, read 2026-10-24).
- **Background sessions** (`claude --bg "<task>"`, then `claude agents --json`, `claude logs <id>`, `claude attach <id>`, `claude stop <id>`) are for a human watching sessions. `--bg` cannot be combined with `-p`, and prints a session id and returns at once instead of a result (CLI help and headless docs, read 2026-10-24); the wrapper runs in the foreground.

### Binary lookup

`$CLAUDE_BIN`, then `claude` on PATH (on Windows the native `claude.exe` is preferred over an npm `.cmd` shim), then the native installer's locations (`~/.local/bin`, `~/.claude/local`, and on macOS `/opt/homebrew/bin`, `/usr/local/bin`). The wrapper refuses a Claude Code older than 2.1.259, which lacks `--permission-prompts`.

### Gotchas captured

- **Effort is visible only in the transcript.** The JSON result names the model (`modelUsage`, and the init event's `model`) but not the effort; the transcript records it on every reply, and the wrapper reads it from there, best-effort, since that format is internal (observed 2026-10-24). `CLAUDE_CODE_EFFORT_LEVEL` in the environment overrides `--effort` (env-vars docs); the wrapper warns when it is set.
- **An unknown model is not caught up front.** The session opens, the first request fails with `There's an issue with the selected model` (API 404), the exit is 1, and the state keeps that session, so pass `--model` again or `--new` (observed 2026-10-24).
- **A failed run's `result` is the error text.** The wrapper prints it on stderr, never as the answer; check `is_error`, not the exit code alone, when calling `claude -p` directly.
- **Nested under Claude Code it still works.** The child inherits `CLAUDECODE=1` and `CLAUDE_CODE_CHILD_SESSION=1`; `-p` sessions are still saved and resumable (observed 2026-10-24; env-vars docs agree).
- **The prompt goes on stdin**, capped at 10 MB (headless docs); larger material goes in a file the brief names. **Stdin is closed** after it, or the run waits for more.

## Not this skill

The general doctrine — briefs, what never delegates, parallel work, verifying what comes back — is `delegation`. The release-gate review loop is `grok-agents`. Driving the Codex CLI the same way is `codex-agents`.
