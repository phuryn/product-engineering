---
name: codex-agents
description: "'Ask Codex', 'check with Codex', handing Codex a build or review, or stuck between two framings: the Codex CLI as peer, builder or fresh reviewer."
---

# Codex agents — the Codex CLI as peer, builder and reviewer

**Treat Codex as a peer with the same standing as Claude.** Not a formatter, not a gate, not an authority. Run it on the newest model the Codex CLI offers, at its highest reasoning effort: `xhigh`, the wrapper's default on every turn.

**It can build, and what it builds is reviewed by someone else.** Hand it a build stage with the goal, binding decisions and files it will touch. Read its diff before believing it; a delegated diff is unreviewed code. The session that wrote code never clears it. An independent review does, through `independent-review` or whatever the project uses. Codex can review code it didn't write (§ Reviewer).

**Keep product decisions, real systems and stage-completion judgement with the session agent.** This includes accepting or rejecting review findings and anything touching a real system, development included. Any database, even one only you use, a server and a setting count. Say so in the brief, asking for each real-system step as one command the session agent runs. Without the Codex CLI, or while it is out of usage (§ Resume or start fresh), the session agent builds the stage itself.

**Delegate only what is worth the hand-off; the test is size, not time.** If the brief would be nearly as long as the diff, write the diff. A stage small enough to describe precisely is small enough to write, and handing it over only buys a wait. Stop a build round that has made no writes on a small change; twelve minutes on a fifteen-line change is enough. Check `git status`. Kill its leftover process and write the change in-session. The session agent keeps the same responsibilities, and its diff still gets independent review.

**Manage Codex with the goal, context and room for judgement.** Use the way the human manages Claude: avoid step-by-step direction, trust judgement and push back on disagreement.

**Ask for the deliverable's actual format, including an image when needed.** Codex can write code and generate images directly through multimodal output. If the goal is a PNG, say that. Don't translate it to "an HTML file we'll screenshot."

## Core discipline (read before every session)

1. **Treat Codex as a peer, not a tool.** It has the same standing as Claude. Trust its judgement on path, structure, format, fonts, dimensions and libraries. A choice you wouldn't have made is a useful disagreement to surface, not a defect. Its view is not binding; push back where warranted.
2. **Bring Codex in at ideation and framing, before a sign-off.** The cheapest wins concern the angle, load-bearing claim and what to cut. Late peer review is the least valuable use; don't use it only as a pre-publish gate.
3. **Give the goal, facts and reasoning behind non-obvious choices.** Do not prescribe paths, filenames, fonts, dimensions, libraries, chart types or step-by-step procedures unless they are hard requirements.
4. **Iterate.** Continue iterating after Codex produces the first draft. About 3–8 turns is normal. Stopping at turn 1 treats Codex as a one-shot generator; the value comes from the back-and-forth.
5. **Converge before surfacing.** The human arbitrates intent and taste, not editorial trade-offs two agents can resolve. Default to one result after convergence.

## When to invoke (proactively, not just on explicit request)

**Invoke Codex for explicit requests and decisions that need a peer.** Explicit requests include "check with Codex", "iterate with Codex", "ideate with Codex" and "ask Codex". Claude should also reach for this skill without being asked in these situations:

- **Consult Codex when stuck between two reasonable framings or angles.** Do this before punting the choice to the human.
- **Pressure-test a load-bearing claim, structure or hook before committing.**
- **Argue options through before asking the human to choose.** Use this when two agents could resolve the choice.
- **Work through an unvoiced critique of a draft with Codex.**
- **Use a fresh model when its misses would matter on an important deliverable.** A different model has different blind spots.

**Do not invoke Codex for routine work Claude confidently handles in-session.** This includes routine drafting, formatting and mechanical tasks. This is a peer-agent skill, not a text-formatter API.

## Opening turn — the four things Codex needs

**Give Codex the target, research, draft and specific uncertainty.**

| | What | Example |
|---|---|---|
| TARGET | What we're producing or deciding | "X reply to <link>", "framing for <topic>", "call on <trade-off>" |
| RESEARCH | What's actually known | Parent tweet, source quotes, verified facts, what the other party actually said, audience size, prior posts |
| DRAFT | Current version + variants considered | Paste the artifact, not a description of it |
| REASONING | Why you're stuck | What you've rejected and why; name the specific load-bearing question. Not "give me feedback" — name the genuine uncertainty |

**Put long opening briefs in a scratch file and use `--read`.** Use system temp, project scratch or whatever the working directory's convention is.

```bash
python <skill dir>/scripts/codex.py --new --read <scratch_file>
```

**Pass it on every build dispatch, not only the ones you think are new sessions.** Add `--sandbox workspace-write` when Codex needs to write files or pull data. Add `--cwd <repo>` to scope the session to its repository. The sandbox defaults to `read-only`, and its flag applies only to new sessions. An expected resume that starts new silently lands read-only. The resulting reasoned report argues a verdict and notes real defects while changing nothing, with nothing failing. It reads exactly like a round that worked. Check `git status` and file mtimes before believing a build round happened.

**Leave sandboxed builds uncommitted and ask for a commit-message handoff.** On Codex CLI 0.159, Windows 11, `workspace-write` could neither commit nor run git in another checkout (observed 2026-10-25). All three restrictions below were reproduced in scratch repositories. Other platforms were not tested here. The sandbox keeps `.git` read-only: `git add` fails creating `.git/index.lock` with `Permission denied`. A linked worktree's index lives in the main checkout's `.git/worktrees/<name>/` and fails the same way. Adding that `.git` with `--add-dir` did not lift the restriction. Windows also runs sandbox commands as a separate local user, so git refuses other repositories as "dubious ownership". Read the diff and commit it yourself. If a brief sends Codex to another repository for prior art, tell it to read files from disk.

**Name `$app-stack:ui-design` in a build that adds or changes screens.** Name the `ui-design` skill with that invocation and carry its jobs-map rows in the brief. Codex loads a skill only from a pack installed in Codex. Before the first such brief, run `codex plugin list` and check `app-stack@product-engineering` is installed and enabled. If absent, run `codex plugin marketplace add phuryn/product-engineering`, then `codex plugin add app-stack@product-engineering`. Loading `$app-stack:ui-design` in a headless `codex exec` was observed on codex-cli 0.166.0, 2026-11-03.

**Budget real-database integration tests in the build brief.** Include the session agent's integration-fix pass when the sandbox cannot run them. Apply `test-harness`'s round-trip budget (§ Tests and docs are part of the change). State the target's measured latency and which checks the session agent runs.

## Follow-up turns — conversational, short, peer-to-peer

**React like a colleague without rewriting the goal or numbering points.** Agree where it's right, push back where it's wrong, ask why where it's surprising, and name what it missed. Don't re-package the goal as a new structured prompt.

> "the opener still feels abstract — what if we lead with X instead?"
> "agree on the third option, but 'harness' is too broad, doesn't it collapse the distinction you just made?"
> "you're right about Y but it loses Z — can we keep both?"

```bash
python <skill dir>/scripts/codex.py "<your reaction>"
```

The wrapper auto-resumes the session it last ran in this directory. Loop until convergence or until the disagreement is clear enough to hand back to the human.

## Iterate — signs you should still be going

**Keep iterating while relevant critiques, choices or trade-offs remain untested.**

- A critique of the current draft you haven't voiced.
- A choice Codex made that you don't fully buy and haven't pushed on.
- A non-obvious option neither of you has explored.
- The human's stated goal not fully reflected in the draft.
- The temptation to ask the human which of two reasonable versions they prefer. Ask Codex first.
- An open trade-off you haven't run past Codex: recipe versus frame, tighter versus richer, or hook A versus B.

## Iterate — signs you've actually converged

**Stop iterating when the draft holds and only taste remains.** You would defend it against your own critique. Neither you nor Codex finds new angles, and remaining trade-offs concern taste rather than correctness.

## Surface to the human — when

**Surface deadlock, unclear intent or consequential information you lack.**

- **State genuine deadlock after both agents iterated and still disagree.** Articulate the disagreement cleanly.
- **Ask about unclear intent when resolving it changes the iteration's direction.**
- **Surface information the human knows and you don't when it would reshape the draft.** This includes a constraint, audience signal, content rule or strategic call.

**Do not surface reasonable options or taste trade-offs you haven't argued through.** This includes "which of these two do you prefer", untested word choice, hook or closer choices, and tighter-versus-richer or frame-versus-recipe trade-offs. Stopping after 1–2 Codex turns and dumping open calls on the human as a menu is the failure mode. Converge before the human sees the result.

## Anti-patterns

- **State the goal once and let the partner pick the means.** Numbered "concrete asks" with sub-bullets dress a step-by-step recipe as a brief.
- **Prescribe paths and other implementation choices only when they are hard constraints.** This includes file paths, filenames, fonts, dimensions, libraries and frameworks. "The existing system uses X" gives context rather than a directive.
- **Keep follow-up turns conversational instead of sending a fresh structured prompt.** Rewriting the goal section in turn 3 leaves the conversation.
- **Treat Codex's view as a judgement you can challenge.** It isn't binding.
- **Keep the requested deliverable format when Codex can produce it directly.** Don't translate it because you assume Codex produces only code or HTML; it can generate images.

## Resume or start fresh

**Continue by default and choose fresh sessions deliberately.** A build round either continues a session or starts one.

- **Within a stage, resume.** Follow-up rounds fixing review findings or finishing the same work continue the session that built it. The wrapper resumes per directory, so this is the default in the stage's worktree.
- **A new stage or a new area starts fresh, with `--new`.** Project knowledge belongs in docs and the stage's brief, not an old thread. Long threads carry replaced assumptions and fill their context window; a fresh start takes a few minutes of reading. If a fresh session would miss something, write it in the docs.
- **Parallel builds get a worktree, a session and a marker each.** One session can't drive two builds. The wrapper's marker is one file per user and holds one directory, so the second build overwrites the first's marker. The first build's next round then starts new, read-only unless `--sandbox` is passed. Use `CODEX_AGENTS_STATE=<a file per build>` on every call for each build.
- **An earlier session can still be resumed, by its id: `--session <id>`.** Sessions stay in `~/.codex/sessions/<yyyy>/<mm>/<dd>/`, one `rollout-<time>-<id>.jsonl` each. Its first line names `cwd`, and the wrapper prints each run's id. Use that session's `--cwd`, plus `--model` if it used something other than the config default; resume doesn't keep the model (§ Session continuity). Explicit resume fails rather than starting new. Once Codex opens it, even if the run later fails, the marker names it and the next plain call continues it.
- **A usage limit makes the builder unavailable, as a missing CLI does.** Codex answers "You've hit your usage limit … try again at <time>" and exits at once. Wait when reset is near; otherwise the session agent builds the stage itself, treating 90 minutes away as too long. Independent review still applies. The marker keeps the stage's session through failure, so the next call after reset continues it.

## Reviewer

**Apply `independent-review` for round scope, brief, triage and stopping.** Its wrapper defaults to Grok or a fresh Claude Code session. Codex reviews when repository instructions name it or the owner asks. Get that skill's prompt with its wrapper's `--subject-only`, which writes subject and prompt into the git directory and prints their paths. Use a new session meeting the review bar, never this wrapper and never a resume of the building thread:

```bash
# macOS and Linux
codex exec --ephemeral --ignore-user-config --ignore-rules -s read-only \
     -m <the newest model> -c model_reasoning_effort=xhigh -C <repo> - < "<prompt file>" > "$S/review-NNN.md" 2> "$S/review-NNN.err"
# Windows: the same, plus the sandbox mode under [windows] in ~/.codex/config.toml (elevated or unelevated)
codex exec --ephemeral --ignore-user-config --ignore-rules -s read-only -c 'windows.sandbox="<that mode>"' \
     -m <the newest model> -c model_reasoning_effort=xhigh -C <repo> - < "<prompt file>" > "$S/review-NNN.md" 2> "$S/review-NNN.err"
```

**Check report length and successful reads before accepting a review round.** No wrapper ran, so check it as the wrapper would:

```bash
python -c "import sys; print(len(open(sys.argv[1], encoding='utf-8').read().strip()))" "$S/review-NNN.md"
grep -i "blocked by policy" "$S/review-NNN.err"
```

A report under 1,500 is a failed round. Refused reads with none successful also fail, however long the answer. Opening, listing and searching files are reads; a refused write is the read-only sandbox doing its job. Codex logs every refused command to stderr, where the `grep` command lists them.

- **Read the prompt from the file the wrapper wrote through stdin.** Use `- < "<prompt file>"`, never `< /dev/null`: stdin here is the prompt. An empty or missing prompt file means the round never started.
- **Use the manual check as the round's gate.** No wrapper measures this run; the `independent-review` bar fails a short round or one unable to read.
- **Start with `--ephemeral` so the review saves no session.** A new `codex exec` starts from the prompt alone.
- **Exclude user config and execpolicy rules from the review session.** `--ignore-user-config` omits `~/.codex/config.toml`, including its MCP servers and tools. The sandbox covers only shell commands the model runs; `-s read-only` does not bind those added tools (Codex CLI 0.159.0, observed 2026-10-29). It also omits the model and, on Windows, the sandbox mode without which every read is refused. Put both back on the command line. Observed on Codex CLI 0.166.0, Windows 11, 2026-11-02: with model and mode specified, a session read a file and was refused a write. Without the mode, both were refused as "blocked by policy", yet the session still answered in full sentences. `--ignore-rules` skips execpolicy rule files.
- **Name the instruction files still loaded in the round's report.** These flags were not shown to disable Codex's instruction files: the repository's `AGENTS.md` and the one in `CODEX_HOME`.
- **Treat a short answer as failed and delete the temporary review files.** It is never a clean round. Delete subject and prompt files when the round ends, as `independent-review` requires.

Each rule's origin, the case that taught it, is in `receipts.md` beside this file; read it when a rule's edge is unclear.

## How you can tell it worked

Codex argued at least one point you then changed or defended, and the run's header shows the session and model you meant. Any diff it reported is on disk and was reviewed by someone else.

## Mechanics

**Use the script's absolute path and scope its session with `--cwd`.** This skill owns `<skill dir>/scripts/codex.py`, whether installed for the user or vendored into a repository. Its absolute path works from any working directory.

| Command | Effect |
|---|---|
| `codex.py "<msg>"` | Send; auto-resume if a session exists, else start new |
| `codex.py --new "<msg>"` | Force new session |
| `codex.py --session ID "<msg>"` | Resume the session with that id (§ Resume or start fresh) |
| `codex.py --read FILE` | Read message body from FILE (`-` for stdin) |
| `codex.py --status` | Show whether a session is active and how long since last call |
| `codex.py --reset` | Clear the session marker (next call starts fresh) |

### Flags

| Flag | Default | Notes |
|---|---|---|
| `--new` | off | Force new session even if one is stored |
| `--session ID` | — | Resume that session in `--cwd`, with no fallback to a new one. The model comes from `--model`, or from the marker when it names this session. |
| `--read FILE` | — | Read message body from FILE (`-` for stdin). Use for long context-rich openings. |
| `--model MODEL` | codex's configured default | Override the model. Pass one only to pin the newest model the Codex CLI offers when the configured default (`~/.codex/config.toml`) is not it. Remembered for the session and re-sent on every resume. |
| `--effort LEVEL` | `xhigh`, on every turn | `low` / `medium` / `high` / `xhigh`, sent as `-c model_reasoning_effort=…`. |
| `--sandbox MODE` | `read-only` | `read-only` / `workspace-write` / `danger-full-access`. New sessions only — `exec resume` inherits sandbox from the original session. |
| `--cwd DIR` | current directory | Directory the codex run happens in. Required to drive a repo other than the one the caller is sitting in, and it also scopes session continuity (below). Fails loudly if `DIR` is not a directory. |
| `--raw` | off | Pass through raw codex output (default strips the codex header block) |

### Session continuity

**Resume the recorded id rather than whichever session ran most recently.** The marker at `~/.claude/.codex_agents_active`, overridden by `$CODEX_AGENTS_STATE`, records the active directory, model and id. The wrapper uses `codex exec resume <id>` and continues until `--reset` or `--new`. `--last` instead takes the newest session Codex recorded in that directory, whoever started it, including a `--new` consult. `--all` lifts that directory scope (codex 0.159, checked 2026-10-22). A marker predating recorded ids uses `--last` once and records the selected id. If it picked the wrong stage session, correct it with `--session`.

**The marker names the last session Codex opened, including failed runs.** Codex prints a session header only after opening it. A usage limit fails after the session takes the turn, so the marker keeps that session, including a newly opened one. It holds the brief and work so far; the next call continues it, while `--new` starts over. Resume falls back to a new session only when Codex couldn't open the old one: no rollout remains, so it fails without a header. Otherwise, a failed resume exits with its error rather than starting without the stage.

**Sessions are scoped to the working directory.** The per-user marker records its directory and resumes only when that matches; otherwise it starts fresh. Without that check, a second repository would resume a conversation the wrapper never had there. One marker holds one directory, so parallel builds need their own (§ Resume or start fresh). `--status` reports a session belonging to another directory. A legacy bare-timestamp marker predating `--cwd` counts as no session here, making the first run after this change new.

**A resume does not keep the session's model.** `codex exec resume` takes its model from `~/.codex/config.toml`, not the resumed session, and reports it only in the header. A session started with `--model` and resumed without it silently uses the config default. The wrapper records the starting model, re-sends `-m` on every resume and prints the reported model to stderr after each run. It warns when that differs from the request. Read that line before trusting a round. Direct `codex exec resume` calls must pass `-m <model> -c model_reasoning_effort=<level>` every time.

### Codex binary lookup

**Use the configured binary, installed CLI, then the extension bundle.** Automatic lookup tries these in order:

1. `$CODEX_BIN` when set to an existing path.
2. `codex` on PATH. For the npm package, use the native binary its shim runs so a long prompt never passes through `cmd.exe`.
3. The OpenAI ChatGPT VS Code extension bundle: `~/.vscode/extensions/openai.chatgpt-*/bin/<arch>/codex[.exe]`.

The installed CLI comes first because you install and update it; the extension ships its pinned build. This works on Windows and macOS, and on Linux if PATH or the extension provides the binary.

### Cost

**Check the signed-in account's plan and usage limits.** The wrapper uses the account signed into the Codex CLI through `codex login`. A ChatGPT subscription has no per-call API charge, making routine peer ideation cheap; check your own plan's limits.

### Why it works this way (gotchas captured)

- **Read the piped run's metadata from stderr and answer from stdout.** The header contains workdir, model and session id (codex 0.159, observed 2026-10-22). The wrapper reads model and id, records the id for resume and prints both after each run. It strips a stdout header only when the block between two `----` lines is a header. An answer with two horizontal rules is never cut.
- **Pass `-s SANDBOX` only to new sessions, not `exec resume`.** It is an exec-level flag; resume inherits the sandbox. The wrapper separates new-session and resume paths accordingly. Outside a git repository, resume also needs `--skip-git-repo-check` (observed in a live scratch-folder wrapper test, 2026-10-21). Without it, Codex refuses with "Not inside a trusted directory" and the wrapper falls back to a new session. The conversation is lost, and only stderr says so. The wrapper adds this flag there and only there.
- **Close stdin so Codex does not wait for interactive input.** Use subprocess `input=""`.
