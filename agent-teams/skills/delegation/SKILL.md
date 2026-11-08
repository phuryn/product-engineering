---
name: delegation
description: "Before spawning a subagent or dispatching a build, review or research, and before trusting its report: the brief, the delegate, parallel runs, the handoff."
---

# Delegation — a delegate is a partner

**A delegate knows only what you hand it, so brief the goal.** Say what you are trying to achieve and for whom. Name the constraints that bind, the traps a smart newcomer would walk into, and how the result will be proved.

**A brief with the goal in it comes back with judgement.** "Change X to Y" gets Y, even when Y is wrong. A delegate that knows the goal can answer "this step is redundant, here is why", and that answer often changes what ships. That is the return on a brief's length: not compliance, judgement.

**Manage a delegate the way a good owner manages you.** Give it the goal and context, then trust its judgement on the means instead of prescribing steps. Push back where you disagree; its view doesn't bind you.

**Apply the delegate's own skill for its mechanics.** Apply `codex-agents`, `grok-agents` or `claude-agents` for a headless CLI peer, builder or reviewer. Apply `independent-review` for the unsteered review loop, normally through Grok or a fresh headless Claude session. This skill covers their shared discipline.

## What never delegates

- **Decide what the product should do yourself.** Keep the thesis, scope, taste and interpretation of the owner's wishes with you.
- **Accept or reject review findings yourself.** Treat the finding and its severity as claims (`independent-review` § Triage).
- **Run every step that touches a real system yourself.** Keep deploys, promotions, applied migrations, servers, workers, secrets, live configuration and drills with you, including development and databases only you use. Ask the delegate to make each step one command and name those commands; you run them.
- **Perform final verification yourself.** Run the tests, typecheck, gate and smoke, inspecting their results to check the delegate's passing claim.
- **Judge whether a stage is done yourself.** A delegate's handoff supplies evidence for that judgement.

## When it is worth handing off: size, not time

**If the brief would be nearly as long as the diff, write the diff.** A delegate must rediscover the file, conventions and surrounding code before changing anything.

| Situation | Who |
|---|---|
| You know the file and the line, and the change is mechanical | **you, directly** — no brief, no round trip |
| It needs exploration, or you are unsure of the mechanism | a delegate |
| It needs real test coverage | a delegate, or one focused test you write yourself |
| A naive fix would walk into a trap | a delegate, **with the trap in the brief** — this is where a long brief earns out |

- **A build round that has made no writes on a small change is stopped.** Kill its leftover process and write the change in-session, keeping your responsibilities and the requirement for independent review.
- **Use the parallelism or don't pay for it.** Work while the background delegate runs. Waiting pays delegation's latency without gaining its throughput.
- **Keep work whose reasoning you need yourself.** Also keep synthesis that needs everything held in one head.

## The brief

Three things, and the first is the one most often skipped:

1. **Explain what you are trying to achieve and why.** Name the decision this handoff feeds. In the owner's terms, "we are choosing between A and B" lets a delegate suggest a third option or challenge the question. A delegate told "research A and B" cannot.
2. **State the constraints that bind, including the do-nots.** Explain traps that would make a plausible local fix wrong in the larger system. For example: "Keep this out of the argument builder; the same string feeds another spawn path."
3. **Define proof for this handoff, including checks you must run.** Name the tests, gate and handoff's done-when, keeping that narrower than the stage's whenever completion needs real systems. Say what the sandbox cannot reach, such as a database, browser, Docker or network, and assign those checks: "Write them; I run them." Ask for a code handoff with checks marked "written, not run", rather than invented counts or a stage marked done.

**Ask it to exercise every existing page and function the stage touches, not only its own.** Ask for this explicitly in the brief, including code the delegate did not write.

- **Compress the evidence, not the context.** Three log lines beat twenty lines explaining how you reached your conclusion. Keep the goal, binding constraints and traps at full length. A terse brief can produce a locally correct change that fails in the larger system.
- **The brief is the delegate's entire reality.** Ask it to confirm or refute every consequential claim against primary sources. Treat absence claims such as "none of them shipped X" as extraordinary. Engagement numbers, link lists and filenames do not establish product reality. When a fact changes mid-build, append a dated "Added while you build" section to the brief file. Keep that file complete rather than relying on a side message.
- **A feature that guesses from real-world input starts from evidence.** Run unchanged code on a real corpus first, citing its numbers for each binding decision. After the build, pin a live golden set that runs on demand, outside the gate. Treat a research-based decision as a hypothesis the live run may reverse, and record any reversal with its measurement.
- **Don't prescribe the means.** Leave paths, filenames, libraries and structure to the delegate unless they are hard constraints. For those choices, "the existing system uses X" gives context without requiring X. Surface a choice you disagree with as a disagreement, rather than calling it a defect.
- **Long briefs go in a file.** Pass them by path or stdin, rather than as a long inline argument. Long inline arguments trip permission classifiers and shell quoting.
- **Name ranges, not commits, in a brief you will reuse.** A pinned SHA can send the next round back to an already reviewed commit. Use `git log --oneline <last-reviewed>..HEAD` to fail loudly when the range is stale.
- **Use the brief template and request its handoff.** Start from `references/brief-template.md`, asking for what it built, choices where the brief was silent, spec corrections, blockers and validation actually run. It also names commands for you and what must be redeployed after the push.

## Choosing the delegate

| Delegate | Strong at | Watch for |
|---|---|---|
| **A Claude subagent** (the Agent tool) | Work that needs this repository's context: it loads the project instructions automatically | Fresh context: none of your conversation or tool results. It loads project instructions and your settings and inherits your framing, so it never reviews your work. A review starts from the repository and brief alone (`independent-review`). A subagent may have no Agent tool of its own (observed `2026-06-10`). |
| **The Codex CLI** (`codex-agents`) | Building a stage to a brief; arguing a decision through as a peer over several turns | A new session is read-only unless told otherwise. A build that changed nothing can sound successful; check the disk. |
| **The Grok CLI** (`grok-agents`) | A peer, builder or reviewer from a different model family; the independent review's default reviewer (`independent-review`) | A round that could not read exits 0 after a sentence; length is the tell. |
| **Headless Claude Code** (`claude-agents`) | A session with none of your conversation: a builder or peer for a non-Claude agent, or a reviewer | Plain `-p` loads project and user instructions and auto-memory; only a restricted review starts from the repository alone. Resume keeps the model but drops effort, permission mode and tools unless re-sent (observed `2026-10-24`). |

**The session that wrote the code never clears it.** Use a fresh reviewer who did not build the code. Prefer another model family, or use a fresh session of the builder's family when no other family can run. Never resume or fork the building thread, or use its subagent as reviewer. Apply `independent-review` for the loop and its stopping rule.

## Model and effort (Claude subagents)

- **Set the model explicitly on every spawn.** Omitting it inherits the parent's model, and "inherit" is never a routing decision: it is the absence of one.
- **Route by the job, not by how important it feels.** Use the smallest tier for bulk mechanics without judgement, such as renames, CSV parsing and log scans. Use the mid tier for scoped research, code exploration and building to a written spec. Reserve top tiers for multi-step reasoning and judgement bottlenecks: architecture, adversarial review and taste. Model names change every few months; the routing principle stays the same.
- **Use the top tier adversarially.** For example, ask "refute this audit" to test your own conclusions against the reviewer's reasoning.
- **Consult up.** A cheaper parent running a plan spawns one top-tier child for the judgement-heavy step. Pack its brief with the full context, the why and the specific decision, then treat its answer as the ruling on that step.
- **Pull down, decide up.** For data work, the child pulls and reduces to a table; the parent decides what it means.
- **Check the effort each spawn actually used.** Each subagent transcript records it: `grep -o '"effort":"[a-z]*"' <transcript> | sort | uniq -c`. Agent-tool spawns inherited parent effort at every tier (measured `2026-08-22`). Claude Code 2.1.310 adds an Agent-tool `effort` field (read `2026-10-24`). Workflow agent options and agent-definition frontmatter can also set it.
- **A child that finds the task needs more reasoning than its tier gives returns to the parent.** The parent reruns that step a tier up, rather than letting the child burn tokens.

## Several agents at once

- **Parallelise on evidence, not impatience.** Measure file overlap before deciding which changes can run together. Use `git show --stat --name-only --format= <ref>` per planned change.
- **Never two writers in one tree.** Give concurrent writers separate worktrees. Two writers in one tree can silently overwrite each other's work. Without separate worktrees, run them one at a time.
- **Worktrees carry their own dependencies.** Never remove a worktree whose `node_modules` links to another checkout; removal deletes through the link. Apply `independent-review` for the recipe.
- **Parallel stages merge through an integration branch.** Give each stage its own branch and worktree, and get a clean review before merging. Name that round in the merge and rerun the gate after every merge. Two passing branches can fail together when one changes a fixture's required fields. Resolve shared-ledger conflicts by keeping both sides' entries: backlog, decision log, test doc, architecture doc and plan. Concurrent briefs reserve shared sequence numbers, including each migration number and timestamp floor. They state which migrations are applied and which are only written.
- **Every merge checks the new migrations' timestamps against the ledger.** Run `migration list` on the database that will receive them, since a reserved floor cannot prevent collisions with migrations applied meanwhile.
- **Parallel sessions share more than a tree.** Give concurrent sessions separate accounts or run them sequentially. They share test accounts, the development database and workers against it, so scope background workers to named accounts.
- **The binding constraint is usually review, not build.** Keep review rounds sequential within a branch. Each round needs a stable account of changes since the last. Findings arrive only when a round runs, and fix commits produce the worst defects. Parallel building cannot shorten that chain.

## While it runs

- **Don't edit a tree a delegate is building in.** Wait or use another worktree.
- **Never `git checkout -- <file>` (or `git restore`) on a tree carrying uncommitted work.** Either destroys everything uncommitted in the file, a delegate's whole build included. Undo a probe by re-editing the exact change back, or use `git stash push -- <file>` around it. Commit a build before deliberately breaking it to verify a test.
- **Long runs go detached, with a completion marker.** Watch the marker for completion. Shell-tool timeouts kill their process trees. Keep state in files that survive your context window; apply `flight-deck`.

## When it comes back

- **A delegated diff is unreviewed code.** Read it before believing it, and give it independent review.
- **Check the disk before believing a round happened.** Inspect `git status` and file times, since a run without write access can return a convincing report with no changes.
- **Re-run the gate yourself, and rewrite any evidence it wrote from your own run.** A sandbox without database or browser access cannot supply a passing gate. Read every line the delegate adds to a coverage map or status file; replace its evidence rather than inventing counts.
- **Before passing a delegate's "commands for the owner" up, do every one you can.** Use an API, CLI or key you hold and reread the result. Escalate only what needs a person: a dashboard-only click, money or taste.
- **A builder's objection that is a product decision goes to the owner.** Give it its own handoff section, keeping it separate from corrections you can accept yourself.
- **When you take a handoff over, put a dated status line at its top.** Say whether it is merged, which rounds reviewed it, where it is deployed, and what still waits. Keep your changes in their own section, leaving the delegate's text as written. Check claimed deploys against your environment log.
- **Audits record `HEAD` and `git status --short` at the start and again before delivering.** Put this instruction in the audit brief. Reverify findings about deleted, moved or renamed files against current `HEAD`.
- **Repeated correct fixes that don't work mean the model of the problem is wrong.** Stop fixing and distinguish two mechanisms with a screenshot or a question the owner can answer in a minute. Do this on the second failed fix, rather than the fifth. Green tests that exercise a sequence the user never receives turn "I don't understand this" into "this is fixed".
- **Converge before surfacing.** Bring one result or a clearly stated disagreement, leaving the owner to arbitrate intent and taste.
- **"Ready to test" means testable with nothing to do first.** Build, install or deploy it on the surface the owner uses, and say what needs reloading. Complete the handoff, or state its remaining edges plainly.

Each rule's origin, the case that taught it, is in `receipts.md` beside this file; read it when a rule's edge is unclear.

## How you can tell it worked

You can verify the delegate's report without asking it anything, and you have rerun whatever it claimed to run.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/brief-template.md` | a brief's skeleton, with what each part is for, and the handoff the delegate writes back | writing any brief longer than a paragraph; reading a handoff |
