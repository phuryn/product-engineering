---
name: grok-agents
description: "'Ask Grok', 'have Grok build or review this': drive the Grok CLI headless from another agent as a peer, builder or fresh reviewer."
---

# Grok agents — the Grok CLI headless as a partner

Any agent can run the Grok CLI non-interactively and get a full Grok session back: its tools, the repository's instructions where Grok reads them, a session that can be continued. Used that way it is a **partner** from another model family, same standing as the agent calling it: a peer that argues a decision through, a builder that takes a stage, or a reviewer that has never seen the build. This skill is how to brief it, which mode to run it in, and the commands. Everything here was read from `grok --help` and run on Grok CLI 1.0.70 (`2026-11-02`) unless it says otherwise; the CLI changes often, so check `grok --help` before relying on a flag.

## The partner discipline (compact)

The full doctrine is the `delegation` skill; this is what must hold even when this folder is copied alone.

1. **A delegate gets the why, not just the what.** The goal in the owner's terms, the decision it feeds, the facts, the reasoning behind non-obvious choices, the constraints that bind and the traps a smart newcomer would walk into, and how the result will be proved. Never a keystroke script.
2. **Peer, not tool.** Its view is not binding, and neither is yours. A choice you would not have made is a disagreement to surface, not a defect.
3. **Early, not late, and iterate.** The cheapest wins are at framing; three to eight turns is normal.
4. **Converge before surfacing.** Bring the human one result, or a disagreement stated cleanly.
5. **A delegated diff is unreviewed code, and the session that wrote it never clears it.** Read it, check the disk, re-run the gate yourself; the independent review is a fresh session (the `independent-review` skill).
6. **What never delegates:** deciding what the product should do; accepting or rejecting a review finding; anything that touches a real system, development included (a deploy, a migration applied to any database, a server's secrets, a live setting); final verification; the judgement that a stage is done.

## Three modes

| Mode | What it is for | Tools | Session |
|---|---|---|---|
| **Peer** | a decision argued through, a draft pushed on, a framing checked | read-only: `--tools read_file,grep,list_dir`, no shell, no edits | continued with `--resume <id>` |
| **Builder** | a stage with a goal, its binding decisions and how to prove it | every tool, approved: `--always-approve`, in a worktree of its own | continued within the stage |
| **Reviewer** | fresh eyes on a change | read-only, isolated from memory and other tools' settings (§ Reviewer) | always new |

Every mode shares four rules, each from a run that went wrong:

- **The prompt goes in a file: `--prompt-file <brief>`**, never an inline `-p "…"`. A long prompt inline trips the calling agent's permission classifier and the call is refused.
- **`--cwd <repo>`** on every call, so the session works in the repository you mean, and **`< /dev/null`**, because a CLI with an open stdin waits for input forever. A bare `grok` with no prompt flag opens the interactive screen and hangs with no output.
- **Read the output format you asked for.** `--output-format json` returns one object with `text`, `stopReason`, `sessionId`, `num_turns` and `usage`, which is what a calling agent wants; `plain` is the text alone.
- **Effort and model are stated.** `--reasoning-effort xhigh` for anything that needs judgement; the CLI's default is lower. `grok models` lists the models and the default (`grok-4.7` on `2026-11-02`); `-m <id>` pins one.

## Peer

```bash
SID=$(python -c "import uuid; print(uuid.uuid4())")       # name the session yourself
grok --prompt-file "$S/turn-1.md" --cwd <repo> --session-id "$SID" \
     --tools read_file,grep,list_dir --disallowed-tools search_tool,use_tool \
     --deny MCPTool --deny Bash --deny Edit --deny Write --disable-web-search \
     --always-approve --reasoning-effort xhigh --output-format json < /dev/null > "$S/turn-1.json"
# the next turn continues it: every flag again, --resume in place of --session-id
grok --resume "$SID" --prompt-file "$S/turn-2.md" --cwd <repo> \
     --tools read_file,grep,list_dir --disallowed-tools search_tool,use_tool \
     --deny MCPTool --deny Bash --deny Edit --deny Write --disable-web-search \
     --always-approve --reasoning-effort xhigh --output-format json < /dev/null > "$S/turn-2.json"
```

- **`--session-id <uuid>` names the session, and `--resume <uuid>` continues it with its context** (`2026-11-02`: a word given in the first turn came back from the second). Keep the id in a file beside the brief; `-c` continues the most recent session in the directory, which is whatever ran there last, so don't rely on it.
- **`--always-approve` is what lets it read at all.** Without it Grok can't approve its own file reads, and it exits 0 after a sentence of preamble, which reads like an answer. With the read-only allowlist above, approving everything approves only reading.
- In peer mode Grok reads what you read: in a folder it trusts, the project's own instruction files and the skills its Claude compatibility finds load too (`grok inspect` lists them). That is the point for a peer, and the reason the reviewer turns it off.

## Builder

```bash
grok --prompt-file "$S/stage-brief.md" --cwd <worktree> --session-id "$SID" \
     --always-approve --deny MCPTool --disable-web-search \
     --reasoning-effort xhigh --output-format json < /dev/null > "$S/build-1.json"
```

- **`--always-approve` approves every tool call, the shell included.** So the builder works in a git worktree of its own, never the tree you are editing, and its brief keeps every real system out: no pushes, no deploys, no migrations, no secrets (§ The partner discipline, 6). `--deny MCPTool` keeps it off the MCP servers this machine has connected, a database's included.
- **Check the disk before believing a run happened**: `git status`, the files it names. A run that couldn't write returns a reasoned report that reads exactly like one that did.
- `--sandbox <profile>` is not a write boundary: it enforces only on platforms that support it (`2026-10-10`, on Windows a sandboxed run still created a file).
- This mode's command is from `grok --help`, 1.0.70; it was **not yet run end to end** when this was written (`2026-11-02`: the calling agent's safety classifier refused a fully approved Grok session on the author's machine). Run a small build first and read the disk.

## Reviewer

A review round's discipline (what it covers, the brief, triage, when to stop) is the `independent-review` skill's, and its wrapper runs Grok this way by default. The bare call, so the flags are understood rather than remembered (the wrapper also sets the turn cap and writes the subject, the range's log and diffs, to a file the reviewer can read, since it has no shell):

```bash
GROK_MEMORY=0 GROK_MANAGED_MCPS_ENABLED=false GROK_MANAGED_MCP_GATEWAY_TOOLS_ENABLED=false \
GROK_CODEX_SESSIONS_ENABLED=false <and GROK_{CLAUDE,CURSOR}_{AGENTS,RULES,SKILLS,HOOKS,MCPS,SESSIONS}_ENABLED=false> \
grok --prompt-file "$S/review-NNN-brief.md" --cwd <repo> \
     --reasoning-effort xhigh \
     --tools read_file,grep,list_dir --disallowed-tools search_tool,use_tool \
     --deny MCPTool --deny Bash --deny Edit --deny Write --disable-web-search \
     --always-approve \
     --output-format plain < /dev/null > "$S/review-NNN.md" 2>&1
```

Every part is load-bearing:

- **The environment variables** switch off, for this process, Grok's memory, its managed MCP servers and gateway tools, its reading of Codex sessions, and every Claude and Cursor compatibility cell (their instructions, rules, skills, hooks, MCP servers and sessions). The environment wins over Grok's config file (measured with `grok inspect --json` on 1.0.70, `2026-10-30`: all 13 cells off). **What still loads, `grok inspect --json` run with the same variables lists**: in a folder Grok trusts that includes the project's own instruction files, a gitignored `CLAUDE.local.md` among them. Name it in the round's report.
- **`--always-approve`** or the round doesn't happen: without it, an exit 0 after a sentence of preamble, which reads as "found nothing" (`2026-09-08`). **The tell is length, and it is the only tell**: a genuinely empty round still argues its way there over paragraphs.
- **`--tools read_file,grep,list_dir`** is the write boundary: an allowlist, so a review can't edit the tree it is scoring. Not `--sandbox read-only`, and not a denylist such as `--disallowed-tools edit,write`, which leaves the shell and the edit tool in place (`2026-10-10`, on Windows: those two flags together still let a round create a file; the allowlist did not). With no shell the reviewer can't run git, which is why the subject goes on disk first.
- **`--disallowed-tools search_tool,use_tool`, the `--deny` rules and `--disable-web-search`** close what the allowlist leaves open: `--tools` covers built-in tools only, so the MCP meta-tools stay, and through them every connected MCP server. `--disallowed-tools` wins over `--tools`, and a deny rule wins over `--always-approve` (`2026-10-10`: asked to write, call MCP tools and run a shell, a round with these flags did none of them).
- **Always a new session**, never `--resume` or `--fork-session` of the thread that built the code: the reviewer must not inherit what the builder believes.
- **A round can fail by running out of room**, leaving the same short output. Size the subject to a build stage, and keep findings emitted before a failure.

## Accounts and sign-in

- **`grok login --device-auth`** signs in without a browser on this machine: the CLI prints a link and a code, and whoever owns the account approves on any device. An agent can start it and relay the link and code to an owner who is away from the machine (`2026-10-31`, an evals product signed its reviewer in this way). Never paste the resulting credentials anywhere.
- **A signed-in CLI can still be out of credit.** It answers `402 usage balance exhausted` and stops (`2026-10-31`). In a review round the `independent-review` wrapper exits 3 and prints the same round for the fallback reviewer; in peer or builder mode, wait for the reset, or do the work yourself, and say so.
- `grok usage` prints a session's persisted token and cost usage; `grok sessions list` lists recent sessions with their ids.

## How you can tell it worked

The answer came from a session that started with only your brief and was run with the flags its mode needs, its exit code and output were read from the run itself, a resumed turn named the session it continued, and anything it built was on disk and reviewed before it was trusted.

## Not this skill

The review loop, with its wrapper, is the `independent-review` skill. Driving Claude Code or Codex the same way is `claude-agents` and `codex-agents`; how to brief and verify any delegate is `delegation`.
