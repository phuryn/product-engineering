---
name: gemini-agents
description: "'Ask Gemini', 'have Gemini build or review this': Google's Antigravity CLI as a partner. It may break Google's terms on a consumer plan, so the user agrees first."
---

# Gemini agents — Google's Antigravity CLI as a partner

**Get the user's clear agreement before driving Gemini through this CLI.** Consumer sign-in this way may break Google's terms. Loading this skill is not agreement. A request naming Gemini is not agreement until the user has heard the support status.

Before the first run, use `--check`, say which sign-in the machine appears to use and what Google says (§ Support), and ask. A clear yes covers that run. A standing preference covers later runs only when the user clearly says it applies from now on. Keep that preference in the agent's own memory or the user's agent instructions, outside this skill. Neither this skill nor its wrapper stores agreement.

> “This looks like a Google sign-in; consumer use here can breach Google's terms and risk suspension. Do you agree to this run?”

**Loading this skill never makes Gemini a default or recommendation.** No skill in this collection names it as a default partner, builder or reviewer. An agent does not propose it unasked. It drives Google's Antigravity CLI (`agy`) as a requested peer, builder or second reviewer through `<skill dir>/scripts/agy.py`.

The CLI recipes were run on `2026-11-14`, Antigravity CLI 1.5.8, macOS, on a paid consumer sign-in. The collection's author chose that for an account of their own; it is evidence, not a recommendation. Follow-up wrapper runs used `gemini-3.8-flash-medium` (observed `2026-11-14`, CLI 1.5.8, macOS).

## Support

**Google does not support another agent driving `agy` on a consumer plan.** Its FAQ, read on `2026-11-13`, says headless `-p` is intended for direct scripts and CI. It names Free, Google AI Plus, Pro and Ultra as unsupported for use inside a third-party coding agent. A neighbouring answer says third-party access through an Antigravity sign-in breaks the terms and can lead to suspension. It recommends Gemini Enterprise or a Google AI Studio API key. API-key and Cloud credential routes are documented below.

**The owner chooses the sign-in, and the agent never chooses it for them.** The wrapper's `--check` reports the apparent route without printing credentials. State that route and Google's position before asking for agreement. Apply the opening rule on each run unless a standing preference already covers it.

**The owner puts an API key in the environment themselves.** Never ask for it in chat, type it for them or write it to a file.

**Token spend on the paid routes is the owner's decision.** Both API-key and Cloud routes charge per token (read on `2026-11-13`). The agent never selects that spend for the owner.

## The partner discipline (compact)

**Apply `delegation` for the full discipline of working with a partner.** These rules must hold even when this folder is copied alone.

1. **A delegate gets the why, not just the what.** Give the goal in the owner's terms, the decision it feeds, facts and reasoning behind non-obvious choices. Include binding constraints, traps a smart newcomer would walk into, and how the result will be proved. Never a keystroke script.
2. **Treat the delegate as a peer, not a tool.** Its view is not binding, and neither is yours. A choice you would not have made is a disagreement to surface, not a defect.
3. **Bring the partner in at framing and keep iterating.** The cheapest wins are at framing; three to eight turns is normal.
4. **Converge before surfacing.** Bring the human one result, or a disagreement stated cleanly.
5. **A delegated diff is unreviewed code, and the session that wrote it never clears it.** Read it, check the disk and re-run its tests yourself. The full gate and fresh independent review come at the stage's end and before anything ships or deploys; apply `test-harness` § The gate and `independent-review` § When.
6. **Keep product decisions, real systems and final judgement with you.** Decide what the product should do, accept or reject review findings, perform final verification and judge whether a stage is done. Keep anything touching a real system, development included, such as deploys, migrations applied to any database, server secrets and live settings.

## Three modes

**Set each turn's boundary and judge the events it actually produced.** The wrapper repeats settings on every resume, closes stdin and starts the process in `--cwd`. CLI behavior in this table was observed `2026-11-14`, CLI 1.5.8, macOS.

| Mode | What the wrapper sets | What can still happen | Session |
|---|---|---|---|
| `consult` | Deny file writes, commands, unsandboxed scripts, URLs and MCP; provide a repository file list | File reads by path; web search remains available and is counted | Saved id; continued by default |
| `build` | Sandbox; deny URLs and MCP, unless `--mcp` enables MCP | Shell writes in the workspace, temp, caches and added folders; staging and commits fail | Saved id; continued within the stage |
| `review` | Fresh detached clone without hardlinks; sandbox; deny file-tool writes, URLs and MCP; add only copied inputs | Shell writes in the clone, temp, caches and handoff folder; web search causes failure | Always new; never saved or resumed |

**Pass copies of external briefs and attachments in a dedicated folder.** An added folder is writable by a sandboxed shell (observed `2026-11-14`, CLI 1.5.8, macOS). The partner gets prepared copies, never the external brief's real folder. The handoff folder holds the brief and explicitly prepared inputs, including the peer's file list.

Use repeatable `--attach <file>` for external files the brief names. The wrapper copies each file, handles name collisions and rewrites its absolute path in the brief copy. An ordinary in-workspace brief stays at its original path unless attachment substitutions require a copy. Sources are never edited.

For consult and build, copied inputs stay beside the state file in a stable handoff folder, with distinct paths per turn. A resume can re-read earlier briefs; `--new` and `--reset` clear that folder. Inputs already in that folder are read before `--new` clears it, then copied into the new handoff. Review inputs live beside its clone, sharing its cleanup and `--keep-snapshot` lifetime. `--dry-run` previews paths without creating or clearing durable handoff material.

**Resolve relative paths in the work directory, never the brief's folder.** The pointer states that directory explicitly; for a review it is the snapshot. A peer resolved a relative name against the brief's folder and failed to find it (observed `2026-11-14`, CLI 1.5.8, macOS).

**Put the brief in a file and name the files it needs.** For example: “Read `src/parser.py` and `tests/test_parser.py`; challenge the retry decision before proposing changes.” Positional messages and `--read -` also become brief files. Ordinary stdin beside `-p` was ignored (observed `2026-11-14`, CLI 1.5.8, macOS).

```bash
python3 <skill dir>/scripts/agy.py --check
# Model turns below require the agreement described above.
python3 <skill dir>/scripts/agy.py --probe
python3 <skill dir>/scripts/agy.py --dry-run --mode consult --cwd <repo> --read <brief>
```

**Probe protected paths without treating writable temporary folders as failures.** The probe costs two short turns in a temporary repository. It checks subject reads, file-tool denials, command denial, an inside write, a protected outside write and shell network denial. The outside canary is under the wrapper's state folder, which is never added. A separate informational line reports whether a temp-folder write landed; that is not a gate.

Each checked boundary reports `held`, `NOT HELD` or `not attempted`; anything except every boundary held fails. Run it after CLI updates. Unknown permission action names were silently accepted and denied nothing (observed `2026-11-14`, CLI 1.5.8, macOS).

**An empty answer or a denied permission means the turn failed.** A permission headless mode cannot ask for is auto-denied and ends the turn. The CLI returned `SUCCESS`, exit 0 and an empty response with `denied_actions` (observed `2026-11-14`, CLI 1.5.8, macOS). A deny-rule refusal instead appeared as a tool error and the agent continued. The wrapper distinguishes them; it names denied actions and rejects the ended turn.

**Never answer a denial with an allow rule or skipped permissions.** The CLI advised an allow rule or `--dangerously-skip-permissions` after automatic denial (observed `2026-11-14`, CLI 1.5.8, macOS). Either removes the boundary. Change the brief so the action is unnecessary, or perform it yourself. The wrapper adds that instruction after the CLI's advice and prints repeated error text once.

**Count tool errors without calling each one a permission refusal.** Missing files and protected paths both produced tool errors (observed `2026-11-14`, CLI 1.5.8, macOS). Diagnostics count `tool_errors`, covering every tool step whose final state is `ERROR`. A repeated step index counts once, by its last state; an error is not a completed action or successful read.

**Keep the events with the answer and inspect the wrapper's exit code.** `--out` writes the answer and `<out>.events.jsonl`; `--log` streams raw events as they arrive. Diagnostics use `[agy.py]` on stderr and count completed commands, successful reads, searches and tool errors, with duration.

Keep the adjacent `.meta.json` file too; replay uses its brief path, process outcome and changed-file evidence. Without metadata, older recordings cannot establish whether a read went beyond the brief; the wrapper warns. An appended log's metadata selects its latest turn.

```bash
python3 <skill dir>/scripts/agy.py --replay <events.jsonl> --mode review
```

Exit 1 means a failed or empty run, missing result, denied permission, missing binary or unsupported flag. Exit 2 means a broken boundary or missing successful read. Exit 3 means documented quota wording, not the CLI's own timeout exit 3. The wrapper maps `finished_reason: print_timeout` to exit 1; `--timeout` defaults to 3,600 seconds, with a later process kill as backup.

**Use bare CLI calls only when you can perform the wrapper's checks.** This fallback leaves copied-input preparation, event inspection, session recording, read evidence and changed-file checks to you.

```bash
# Start in the repository. Prepare a dedicated folder containing only copied inputs.
agy -p "Read <copied-brief> and do what it says. Resolve relative paths in <repo>; do not run commands or write files." \
  --add-dir <prepared-input-folder> --print-timeout 120s --output-format stream-json \
  --settings '{"permissions":{"deny":["write_file(*)","command(*)","unsandboxed(*)","read_url(*)","execute_url(*)","mcp(*)"]}}' < /dev/null
```

## Peer

**Give the peer a file list before asking it to explore.** Headless has no listing, grep or glob tool of its own (observed `2026-11-14`, CLI 1.5.8, macOS). Each consult turn writes `git ls-files --cached --others --exclude-standard` into the handoff folder and names that list in the standing sentence. Outside a git checkout, the wrapper prints that the listing and the Git status comparison were skipped; name the files yourself.

**Keep the peer inside the work directory and explicitly named folders.** A file-tool read outside those folders needed permission and ended the turn (observed `2026-11-14`, CLI 1.5.8, macOS). The standing sentence tells the peer where it may read. The wrapper denies `write_file(*)`, `command(*)`, `unsandboxed(*)`, `read_url(*)`, `execute_url(*)` and `mcp(*)` on every consult turn.

```bash
python3 <skill dir>/scripts/agy.py --new --mode consult --cwd <repo> --read <brief> --out <scratch>/peer.md
python3 <skill dir>/scripts/agy.py --cwd <repo> "That drops the retry constraint; read src/parser.py and reconsider."
python3 <skill dir>/scripts/agy.py --cwd <repo> --status
python3 <skill dir>/scripts/agy.py --cwd <repo> --reset
```

**Treat web search as available even when every guessed deny fails.** No tested rule denied `search_web` (observed `2026-11-14`, CLI 1.5.8, macOS). The wrapper reports searches; a consult may use them. Never promise an offline peer.

**Resume the recorded id rather than the folder's latest conversation.** State lives per work directory under `~/.gemini/agy-agents/`; `AGY_AGENTS_STATE` overrides its file. It holds the output's conversation id, mode, model, effort and extra directories. `--session <id>` names an explicit resume with no fallback; never use the CLI's `-c`.

## Builder

**Give the builder its own clone or worktree and exclude real systems.** Keep deploys, applied migrations, server secrets and live settings with the session agent, including development systems. Read the diff and run its tests yourself.

```bash
python3 <skill dir>/scripts/agy.py --new --mode build --cwd <clone> --read <stage-brief> --out <scratch>/build.md
python3 <skill dir>/scripts/agy.py --cwd <clone> --read <follow-up>
```

**The sandbox permits workspace, temporary, cache and added-folder writes.** These results were observed `2026-11-14`, CLI 1.5.8, macOS:

| Operation | Worked | Refused |
|---|---|---|
| Shell writes | Workspace; `$TMPDIR`, `/tmp`, `/private/tmp`; `~/Library/Caches`; folders passed with `--add-dir` | Workspace `.git/`; home; `~/.gemini`; a sibling repository; a dotfile in home |
| Listing | Added folder; `/usr/bin`; `/private/tmp` | Home; `~/Desktop`; `~/.ssh`; a sibling repository |
| Reads | `/etc/hosts`; `~/.gitconfig`; a file in the added folder | `~/.zshrc`; `~/.gemini/antigravity-cli/settings.json`; a file in a sibling repository |

Shell `curl https://example.com` exited 6 and `curl http://1.1.1.1` exited 7 (observed `2026-11-14`, CLI 1.5.8, macOS). A self-contained clone's `git log` exited 0 under the same sandbox.

**Leave sandboxed build changes unstaged for the session agent to commit.** `git add -A && git commit` exited 128 because `.git/index.lock` could not be created (observed `2026-11-14`, CLI 1.5.8, macOS). The standing sentence tells the builder to leave its changes in the working tree. Read the diff before the session agent stages or commits it.

**Use the sandbox with default permissions and never request a bypass.** A failed command invited `BypassSandbox`; requesting permission ended the turn empty (observed `2026-11-14`, CLI 1.5.8, macOS). A file-tool write outside allowed folders also needed permission and ended empty. The standing sentence tells the builder not to ask to leave the sandbox.

**A linked worktree's external git directory is outside the sandbox.** Git could not read its history; a self-contained clone worked (observed `2026-11-14`, CLI 1.5.8, macOS). The wrapper warns on a linked worktree.

**Do not substitute CLI permission modes for the wrapper's boundaries.** `--mode auto` was unavailable for the account and continued in default mode (observed `2026-11-14`, CLI 1.5.8, macOS). `accept-edits` allowed edits but auto-denied every command. Plan mode added a prefix, wrote a plan under the user's configuration directory and asked for confirmation; it was no write barrier.

**Removing the sandbox is the owner's choice on each build turn.** `--no-sandbox` removes its shell restrictions; commands and writes then run with the user's own rights. The wrapper prints that fact every turn. A user's `--add-dir` remains available in consult and build; each build turn says the shell can write in those added folders. `--mcp` permits configured MCP in build mode; its enforcement has not been established (§ Not established).

## Reviewer

**Use Gemini as a second opinion beside the release reviewer.** It is never the round a release rests on: instructions stay loaded, web search remains available, and shell writes reach the clone, temp, caches and handoff folder.

**Apply `independent-review` for a round's scope, brief, triage and stopping rule.** Its wrapper's `--subject-only` prints two paths, `subject:` and `prompt:`. Pass the prompt with `--read` and the subject with `--attach`; neither original parent folder is added.

```bash
python3 <skill dir>/scripts/agy.py --mode review --cwd <repo> --rev HEAD --read <prompt-file> --attach <subject-file> --out <scratch>/second-opinion.md
```

**Attach external review inputs before asking the snapshot to read them.** The wrapper rewrites attachment paths first, then source-repository paths to the snapshot, preserving path boundaries. It prints how many path occurrences changed. A named snapshot path that does not exist stops the run before a model starts; attach the file or commit it. Review refuses user `--add-dir` because that would expose another writable folder.

**Review a fresh detached clone and report what changed inside it.** The wrapper clones with `--no-hardlinks`, so rewriting an object inside the clone cannot rewrite a source object through a hardlink. It excludes uncommitted work and warns when any exists. `--rev` selects the snapshot; `--keep-snapshot` keeps both clone and handoff folder. Otherwise their temporary parent is deleted after clone changes are reported.

**Require successful subject reads even when the partner answers confidently.** File-tool writes are denied, while the shell retains the reach documented under Builder (observed `2026-11-14`, CLI 1.5.8, macOS). The wrapper rejects completed file-tool writes, scripts and subagents, any web search, unknown tools and a run without successful reading beyond the brief. Tool errors can mean a missing file or a permission failure; neither proves a successful read.

**Report the instructions that still load and cannot be switched off.** Workspace `AGENTS.md` and `GEMINI.md`, the user's `~/.gemini/` rules and five built-in skills loaded (observed `2026-11-14`, CLI 1.5.8, macOS). `--disable-slash-commands` did not remove them. The tool registry still listed 60 names with deny rules applied; its size was no evidence of available permissions.

## Accounts and limits

**Configure both the API provider and its environment key.** Google's route needs `"modelProvider": "gemini"` in `~/.gemini/antigravity-cli/settings.json` and `GEMINI_API_KEY` in the environment (read on `2026-11-13`). The variable alone has no effect; `.env` and `GOOGLE_API_KEY` are ignored. This route was read, not run.

**Have the owner establish Cloud credentials and decide its token spend.** The documented command is `gcloud auth application-default login --project <project>`, followed by `AGY_ADC_AUTH=true` (read on `2026-11-13`). This route was read, not run.

**Treat quota wording as a limit rather than completed work.** Google documents `429 RESOURCE_EXHAUSTED` (read on `2026-11-13`); its live output has not been established. The wrapper's quota detection follows that documentation and exits 3. Report the limit and leave any paid-route decision with the owner.

**Choose a listed model and pass effort only when you choose it.** The CLI's `models` subcommand lists slugs, some with effort suffixes. A slug without the suffix plus `--effort` also ran; an unknown model exited 1 (observed `2026-11-14`, CLI 1.5.8, macOS). The wrapper remembers explicit model and effort choices and re-sends them on resumes.

## Not established

**Keep untested routes and boundaries explicit when reporting a run.** These remain unestablished after the runs above:

- Live out-of-quota output.
- Whether `mcp(*)` holds a configured server; none was configured.
- Whether a subagent inherits deny rules, or anything carries between separate conversations.
- Linux and Windows; the sandbox observations above are macOS's.
- The API-key and Cloud routes.

Each rule's origin, the case that taught it, is in `receipts.md` beside this file; read it when a rule's edge is unclear.

## How you can tell it worked

The user's agreement covers the run, and events show successful reads and the answer's claimed work, with searches and tool errors counted separately. The intended session resumes; a review reports clone changes and its remaining reach beside the release reviewer's findings.

## Not this skill

**Apply the sibling skills for their CLIs and shared discipline.** Apply `claude-agents`, `codex-agents` or `grok-agents` for those partners, and `delegation` to brief and verify them. Apply `independent-review` for the release review loop; Gemini supplies an optional second opinion.
