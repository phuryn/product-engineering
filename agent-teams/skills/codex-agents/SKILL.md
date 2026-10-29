---
name: codex-agents
description: "'Ask Codex', 'check with Codex', handing Codex a build, or stuck between two framings: the Codex CLI as a peer that argues and builds."
---

# Codex agents — the Codex CLI as peer and builder

Codex is a peer, same standing as Claude. Not a formatter, not a gate, not an authority. It runs on the newest model the Codex CLI offers, at its highest reasoning effort (`xhigh`, the wrapper's default on every turn).

**It can build, and what it builds is reviewed by someone else.** Hand it a build stage — the goal, the decisions that bind it, the files it will touch — and read the diff that comes back before believing it: a delegated diff is unreviewed code. The session that wrote code never clears it; an independent review (the `grok-agents` skill, or whatever the project uses) does. Deciding what the product should do, accepting or rejecting a review finding, anything that touches a real system, development included (any database, even one only you use, a server, a setting), and judging that a stage is done stay with the session agent; the brief says so, and asks for each real-system step as one command the session agent runs. Without the Codex CLI, or while it is out of usage (§ Resume or start fresh), the session agent builds the stage itself.

**Delegate only what is worth the hand-off; the test is size, not time.** If the brief would be nearly as long as the diff, write the diff: a stage small enough to describe precisely is small enough to write, and handing it over only buys a wait. A build round that has made no writes on a small change (check `git status`) is stopped, its leftover process killed, and the change written in-session rather than waited on. What stays with the session agent is unchanged, and its diff still gets the independent review. (`2026-09-22`, a builder sat twelve minutes on a fifteen-line change with zero writes and a clean tree.)

The way the human manages Claude (goal + context, not step-by-step; trust judgment; push back on disagreement) is how Claude manages Codex.

Codex can write code AND generate images directly (multimodal output) — don't assume deliverables must be HTML/code. If the goal is a PNG, say that. Don't translate it to "an HTML file we'll screenshot."

## Core discipline (read before every session)

1. **Peer, not tool.** Same standing as Claude. Trust its judgment on path, structure, format, fonts, dimensions, libraries — Codex picks those. If it picks something you wouldn't have, that's a useful disagreement to surface, not a defect. Codex's view is **not binding** — push back where warranted.

2. **Early, not late.** Bring Codex in at ideation and framing, not only as a pre-publish gate. The cheapest wins are at the start: choosing the angle, naming the load-bearing claim, deciding what to cut. Late peer-review is the *least* valuable use.

3. **Strategic context, not step-by-step.** Hand over the goal, the facts, and the reasoning behind non-obvious choices. Do **not** prescribe paths, filenames, fonts, dimensions, libraries, chart types, or step-by-step procedures unless they are hard requirements.

4. **Iterate.** ~3-8 turns is normal. **Stopping at turn 1 because Codex produced a draft is the failure mode** — that treats Codex like a one-shot generator. The value is in the back-and-forth.

5. **Converge before surfacing.** The human arbitrates intent and taste, not editorial trade-offs two agents can resolve. Default: converge first, present one result.

## When to invoke (proactively, not just on explicit request)

Explicit invocation:
- "check with Codex" / "iterate with Codex" / "ideate with Codex" / "ask Codex"

Proactive invocation (Claude should reach for this skill without being asked):
- Stuck between two reasonable framings/angles — would otherwise punt to the human
- Pressure-testing a load-bearing claim, structure, or hook before committing
- About to ask the human to choose between options two agents could argue through
- Have a draft + an unvoiced critique you haven't worked through
- Important deliverable where a fresh model's misses would matter (different model, different blind spots)

Do **not** invoke for: routine drafting, formatting, mechanical tasks Claude can confidently handle in-session. This is a peer-agent skill, not a text-formatter API.

## Opening turn — the four things Codex needs

| | What | Example |
|---|---|---|
| **TARGET** | What we're producing or deciding | "X reply to <link>", "framing for <topic>", "call on <trade-off>" |
| **RESEARCH** | What's actually known | Parent tweet, source quotes, verified facts, what the other party actually said, audience size, prior posts |
| **DRAFT** | Current version + variants considered | Paste the artifact, not a description of it |
| **REASONING** | Why you're stuck | What you've rejected and why; name the specific load-bearing question. Not "give me feedback" — name the genuine uncertainty |

Long opening briefs go to a scratch file (system temp, project scratch dir, whatever the cwd convention is), then `--read`:

```bash
python <skill dir>/scripts/codex.py --new --read <scratch_file>
```

Add `--sandbox workspace-write` if Codex needs to write files or pull data, and `--cwd <repo>` to scope the session to the repository it works in.

**Pass it on every build dispatch, not only the ones you think are new sessions.**
The default is `read-only`, and the flag applies to new sessions only, so a resume you
expected and did not get silently lands read-only. What comes back then is a *reasoned
report* that changed nothing — it argues a verdict, notes real defects, and reads
exactly like a round that worked, because nothing failed. The tell is the disk: check
`git status` and file mtimes before believing a build round happened at all.
(`2026-09-16`: a round meant to fix twelve failing tests resumed as a
new session, ran read-only, and reported a decision with no diff behind it.)

**Even with `workspace-write`, a build cannot commit, and cannot run git in another
checkout.** The sandbox keeps `.git` read-only, so `git add` fails creating
`.git/index.lock` (Permission denied); in a linked worktree the index lives in the main
checkout's `.git/worktrees/<name>/`, which fails the same way. Adding that `.git` with
`--add-dir` did not lift it. On Windows the sandbox also runs commands as a separate local
user, so git refuses any other repository as "dubious ownership". (Codex CLI 0.159 on
Windows 11, `2026-10-25`, all three reproduced in scratch repositories; `2026-10-23`, a
monitoring product: four worktree builds came back uncommitted, three of them quoting the
`index.lock` error; other platforms not tested here.) So the brief asks for the work left
uncommitted, with its commit message in the handoff, and you read the diff and commit it.
A brief that sends it to another repository for prior art says to read the files from disk.

## Follow-up turns — conversational, short, peer-to-peer

React like a colleague. Agree where it's right, push back where it's wrong, ask why where it's surprising, name what you notice it missed. Don't re-package the goal as a new structured prompt. Don't number your points.

> "the opener still feels abstract — what if we lead with X instead?"
> "agree on the third option, but 'harness' is too broad, doesn't it collapse the distinction you just made?"
> "you're right about Y but it loses Z — can we keep both?"

```bash
python <skill dir>/scripts/codex.py "<your reaction>"
```

Auto-resumes the session the wrapper last ran in this directory. Loop until convergence or until the disagreement is articulated cleanly enough to hand back to the human.

## Iterate — signs you should still be going

- You have a critique of the current draft you haven't voiced yet
- Codex made a choice you don't fully buy but didn't push on
- There's a non-obvious option neither of you has explored
- The human's stated goal isn't fully reflected in the draft yet
- You're tempted to ask the human "which version do you prefer" between two reasonable options — that's a question for Codex first
- You've identified an open trade-off (recipe vs frame, tighter vs richer, hook A vs B) and haven't run it past Codex yet

## Iterate — signs you've actually converged

- You'd defend the current draft against your own critique
- Codex and you have stopped finding new angles
- Remaining trade-offs are taste, not correctness

## Surface to the human — when

- **Genuine deadlock** — both agents iterated through it and stayed disagreed; the disagreement is articulated cleanly
- **Intent ambiguity** — what the human wants is unclear, and resolving it would change the iteration direction
- **Hard new info** — a constraint, audience signal, content rule, or strategic call the human knows and you don't, that would reshape the draft

Do **not** surface:
- "Which of these two do you prefer" between two reasonable options not argued through with Codex
- Taste-level word choice / hook / closer trade-offs not pressure-tested
- Spotted trade-offs (tighter vs richer, frame vs recipe) you haven't run past Codex

**The failure mode: stopping at 1-2 Codex turns and dumping the open calls on the human as a menu.** The loop is supposed to converge before the human sees the result.

## Anti-patterns

- Numbered "concrete asks" with sub-bullets in the brief — that's recipe-writing dressed up as a brief, not partnership. State the goal once, hand over context, let the partner pick the means.
- Prescribed file paths, filenames, fonts, dimensions, libraries, frameworks (unless they're hard constraints — "the existing system uses X" is context, not a directive).
- On follow-up turns: a fresh structured prompt. If you're rewriting the goal section in turn 3, you've left the conversation.
- Treating Codex's view as binding. It isn't.
- Translating a deliverable to a different format because you assume Codex can only produce code/HTML. It can produce images directly.

## Resume or start fresh

A build round either continues a session or starts one; the wrapper continues by default, so starting fresh is the choice you make on purpose.

- **Within a stage, resume.** Follow-up rounds on the same piece of work — fixing what a review found, finishing it — continue the session that built it. The wrapper resumes per directory, so in the stage's worktree this is the default.
- **A new stage or a new area starts fresh, with `--new`.** What the project knows belongs in its docs and the stage's brief, not in an old thread. A long thread carries assumptions the docs have since replaced and fills its context window, while a fresh session's start-up is a few minutes of reading. If a fresh session would miss something, that is a gap in the docs: write it there.
- **Parallel builds get a worktree, a session and a marker each.** One session can't drive two builds. The wrapper's marker is one file per user and holds one directory, so a second build's run overwrites the first's, and the first build's next round starts a new session (read-only unless `--sandbox` is passed) instead of resuming. Give each build its own marker: `CODEX_AGENTS_STATE=<a file per build>` on every call for it.
- **An earlier session can still be resumed, by its id: `--session <id>`.** Every session stays in `~/.codex/sessions/<yyyy>/<mm>/<dd>/`, one `rollout-<time>-<id>.jsonl` each, whose first line names its `cwd`; the wrapper also prints each run's id. Run it with the `--cwd` that session ran in, and with `--model` when it ran on anything but the config default, since a resume does not keep the model (§ Session continuity). It fails rather than starting a new session; once codex has opened it, even on a run that then fails, the marker names it, so the next plain call continues it.
- **A usage limit makes the builder unavailable, as a missing CLI does.** Codex answers "You've hit your usage limit … try again at <time>" and exits at once. Wait when the reset is near; otherwise the session agent builds the stage itself, and the independent review still applies. The marker keeps the stage's session through the failure, so after the reset the next call continues it. (`2026-10-22`: the reset was 90 minutes away, and the session agent built two stages with its own subagents rather than wait.)

## How you can tell it worked

Codex argued at least one point you then changed or defended, the run's header shows the session and model you meant, and any diff it reported is on disk and was reviewed by someone else.

## Mechanics

The script is this skill's own `<skill dir>/scripts/codex.py`, wherever the skill is installed (for the user, or vendored into a repository). Use its absolute path so it works from any cwd, and pass `--cwd` so the session is scoped to the right repository.

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
| `--sandbox MODE` | `read-only` | `read-only` / `workspace-write` / `danger-full-access`. **New sessions only** — `exec resume` inherits sandbox from the original session. |
| `--cwd DIR` | current directory | Directory the codex run happens in. Required to drive a repo other than the one the caller is sitting in, and it also scopes session continuity (below). Fails loudly if `DIR` is not a directory. |
| `--raw` | off | Pass through raw codex output (default strips the codex header block) |

### Session continuity

A marker at `~/.claude/.codex_agents_active` (override with `$CODEX_AGENTS_STATE`) records the active session's directory, model and id, and the wrapper resumes that id (`codex exec resume <id>`), so the default is "continue" until `--reset` or `--new`. Not `--last`: that takes the newest session codex recorded in the run's directory (`--all` lifts that; codex 0.159, checked 2026-10-22), whoever started it, such as a `--new` consult run there. A marker written before ids were recorded resumes with `--last` once and records the id of whatever that picked; if that is not the stage's session, `--session` puts it right.

**The marker names the last session codex opened for the directory, whether the run then succeeded or failed.** Codex prints the header naming a session only once it has opened it. So a usage limit, which fails a run after the session took the turn, leaves the marker on that session — a new one included, since it holds the brief and the work so far — and the next call continues it; `--new` starts over. A resume falls back to a new session only when codex could not open the old one: no rollout left for its id, which fails with no header. When it could, a failed resume exits with the error, because a new session would start without the stage.

**Sessions are scoped to the working directory.** The marker is one file per user, so it records which directory it belongs to, and a run resumes only when the directory matches; otherwise it starts a fresh thread. Without that, delegating into a second repo would resume a conversation the wrapper never had there. One marker holds one directory, which is why parallel builds each need their own (§ Resume or start fresh). `--status` tells you when a session exists but belongs to another directory. A legacy bare-timestamp marker (written before `--cwd` existed) counts as "no session here", so the first run after this change starts new.

**A resume does not keep the session's model.** `codex exec resume` takes its model from `~/.codex/config.toml`, not from the session it resumes, and says so only in the run's header — so a session started with `--model` and continued without it silently answers on the config default. The wrapper records the model a session started with, re-sends `-m` on every resume, and writes the model codex reports to stderr after each run, with a warning when it differs from the one requested. Read that line before trusting a round. When calling `codex exec resume` directly, pass `-m <model> -c model_reasoning_effort=<level>` every time. (`2026-10-01`: a resumed session came back on the config default, and nothing failed to say so.)

### Codex binary lookup

Auto-locates, in order:
1. `$CODEX_BIN` env var (if set and the path exists)
2. `codex` on PATH — for the npm package, the native binary its shim runs, so a long prompt never passes through `cmd.exe`
3. OpenAI ChatGPT VS Code extension bundle (`~/.vscode/extensions/openai.chatgpt-*/bin/<arch>/codex[.exe]`)

The installed CLI comes first because it is the one you install and update; the extension ships whatever build it pins. (`2026-10-22`: the extension's bundle was a 0.155 alpha without `codex-code-mode-host.exe`, and every tool call of a build round failed before it ran, with no file changed.)

Works on Windows and macOS (and Linux if the extension or PATH provides the binary).

### Cost

Uses whichever account the Codex CLI is signed in to (`codex login`). On a ChatGPT subscription there is no per-call API charge, which makes routine peer-ideation cheap; check your own plan's limits.

### Why it works this way (gotchas captured)

- **Piped, codex writes its metadata header — workdir, model, session id — to stderr, and the answer alone to stdout.** The wrapper reads the model and the session id from that header, records the id for the next resume and prints both after each run. It strips a header from stdout only when the block between two `----` lines is one, so an answer with two horizontal rules is never cut. (`2026-10-22`, codex 0.159.)
- **`-s SANDBOX` is an exec-level flag, not valid on `exec resume`**, which inherits the sandbox; the wrapper splits into a new-session path (with it) and a resume path (without). **Outside a git repository a resume also needs `--skip-git-repo-check`**, or codex refuses it ("Not inside a trusted directory") and the wrapper falls back to a new session — the conversation is lost and only the stderr says so. The wrapper adds the flag there and only there. (`2026-10-21`, a live test of the wrapper in a scratch folder.)
- **Stdin must be closed** (subprocess `input=""`) or codex hangs waiting for interactive input.
