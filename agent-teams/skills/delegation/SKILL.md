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

**Keep product decisions, real systems and final judgement with you.** A delegate prepares the work; you decide and run the steps that need your authority.

- **Decide what the product should do yourself.** Keep the thesis, scope, taste and interpretation of the owner's wishes with you.
- **Accept or reject review findings yourself.** Treat the finding and its severity as claims (`independent-review` § Triage).
- **Run every step that touches a real system yourself.** Keep deploys, promotions, applied migrations, servers, workers, secrets, live configuration and drills with you, including development and databases only you use. Ask the delegate to make each step one command and name those commands; you run them.
- **Perform final verification yourself.** Run the tests, typecheck, gate and smoke, inspecting their results to check the delegate's passing claim.
- **Judge whether a stage is done yourself.** A delegate's handoff supplies evidence for that judgement.

## When it is worth handing off: size, not time

**Write the diff when its brief would be nearly as long.** A delegate must rediscover the file, conventions and surrounding code before changing anything.

| Situation | Who |
|---|---|
| You know the file and the line, and the change is mechanical | **you, directly** — no brief, no round trip |
| It needs exploration, or you are unsure of the mechanism | a delegate |
| It needs real test coverage | a delegate, or one focused test you write yourself |
| A naive fix would walk into a trap | a delegate, **with the trap in the brief** — this is where a long brief earns out |

- **Stop a small delegated build that has made no writes.** Kill its leftover process and write the change in-session, keeping your responsibilities and the requirement for independent review.
- **Work while the background delegate runs.** Waiting pays delegation's latency without gaining its throughput.
- **Keep work whose reasoning you need yourself.** Also keep synthesis that needs everything held in one head.

## The brief

**Brief the goal, binding constraints and proof of completion.** The goal explains which decision the work feeds and lets the delegate question your framing.

1. **Explain what you are trying to achieve and why.** In the owner's terms, "we are choosing between A and B" lets a delegate suggest a third option or challenge the question. "Research A and B" gives it less room.
2. **State the constraints that bind, including the do-nots.** Explain traps that would make a plausible local fix wrong in the larger system. For example: "Keep this out of the argument builder; the same string feeds another spawn path."
3. **Define proof for this handoff, including checks you must run.** Name the tests, gate and handoff's done-when, keeping that narrower than the stage's whenever completion needs real systems. Say what the sandbox cannot reach, such as a database, browser, Docker or network, and assign those checks: "Write them; I run them." Ask for a code handoff with checks marked "written, not run", rather than invented counts or a stage marked done.

**Exercise every existing page and function the stage touches.** Ask for this explicitly in the brief, including code the delegate did not write.

- **Compress the evidence and keep the context complete.** Three log lines beat twenty lines explaining how you reached your conclusion. Keep the goal, binding constraints and traps at full length. A terse brief can produce a locally correct change that fails in the larger system.
- **Put every consequential claim in the brief for verification.** The brief is the delegate's whole context, so ask it to confirm or refute claims against primary sources. Treat absence claims such as "none of them shipped X" as extraordinary. Engagement numbers, link lists and filenames do not establish product reality. When a fact changes mid-build, append a dated "Added while you build" section to the brief file. Keep that file complete rather than relying on a side message.
- **Measure real input before briefing a feature that guesses.** Run unchanged code on a real corpus first, citing its numbers for each binding decision. After the build, pin a live golden set that runs on demand, outside the gate. Treat a research-based decision as a hypothesis the live run may reverse, and record any reversal with its measurement.
- **Let the delegate choose means unless they are hard constraints.** For paths, filenames, libraries and structure, "the existing system uses X" gives context without requiring X. Surface a choice you disagree with as a disagreement, rather than calling it a defect.
- **Pass long briefs by file path or stdin.** Long inline arguments trip permission classifiers and shell quoting.
- **Use ranges in reusable briefs and check them against git.** A pinned SHA can send the next round back to an already reviewed commit. Use `git log --oneline <last-reviewed>..HEAD` to fail loudly when the range is stale.
- **Use the brief template and request its handoff.** Start from `references/brief-template.md`, asking for what it built, choices where the brief was silent, spec corrections, blockers and validation actually run. It also names commands for you and what must be redeployed after the push.

## Choosing the delegate

**Choose a delegate for the work and check its limits.** Apply its named skill for the mechanics below.

| Delegate | Strong at | Watch for |
|---|---|---|
| **A Claude subagent** (the Agent tool) | Work that needs this repository's context: it loads the project instructions automatically | Fresh context: none of your conversation or tool results. It loads project instructions and your settings and inherits your framing, so it never reviews your work. A review starts from the repository and brief alone (`independent-review`). A subagent may have no Agent tool of its own (observed `2026-06-10`). |
| **The Codex CLI** (`codex-agents`) | Building a stage to a brief; arguing a decision through as a peer over several turns | A new session is read-only unless told otherwise. A build that changed nothing can sound successful; check the disk. |
| **The Grok CLI** (`grok-agents`) | A peer, builder or reviewer from a different model family; the independent review's default reviewer (`independent-review`) | A round that could not read exits 0 after a sentence; length is the tell. |
| **Headless Claude Code** (`claude-agents`) | A session with none of your conversation: a builder or peer for a non-Claude agent, or a reviewer | Plain `-p` loads project and user instructions and auto-memory; only a restricted review starts from the repository alone. Resume keeps the model but drops effort, permission mode and tools unless re-sent (observed `2026-10-24`). |

**Use a fresh reviewer who did not build the code.** Prefer another model family, or use a fresh session of the builder's family when no other family can run. Never resume or fork the building thread, or use its subagent as reviewer. Apply `independent-review` for the loop and its stopping rule.

## Model and effort (Claude subagents)

**Choose the model and verify the effort for each job.** Model names change every few months; the routing principle stays the same.

- **Set the model explicitly on every spawn.** Omitting it inherits the parent's model; choose a tier deliberately.
- **Route by the job rather than its apparent importance.** Use the smallest tier for bulk mechanics without judgement, such as renames, CSV parsing and log scans. Use the mid tier for scoped research, code exploration and building to a written spec. Reserve top tiers for multi-step reasoning and judgement bottlenecks: architecture, adversarial review and taste.
- **Use top-tier calls to challenge your framing.** For example, ask "refute this audit" to test your own conclusions against the reviewer's reasoning.
- **Assign one top-tier child the judgement-heavy step of a cheaper plan.** Give it the full context, why and specific decision, then treat its answer as the ruling on that step.
- **Have children pull and reduce data; keep interpretation with the parent.** Ask for a table, then decide what it means.
- **Check the effort each spawn actually used.** Each subagent transcript records it: `grep -o '"effort":"[a-z]*"' <transcript> | sort | uniq -c`. Agent-tool spawns inherited parent effort at every tier (measured `2026-08-22`). Claude Code 2.1.310 adds an Agent-tool `effort` field (read `2026-10-24`). Workflow agent options and agent-definition frontmatter can also set it.
- **Return reasoning-heavy work to the parent when the tier cannot cope.** The parent reruns that step a tier up, rather than letting the child burn tokens.

## Several agents at once

**Measure overlap and isolate concurrent work before parallelising.** Separate files alone do not isolate accounts, databases or workers.

- **Measure file overlap before deciding which changes can run together.** Use `git show --stat --name-only --format= <ref>` per planned change.
- **Give concurrent writers separate worktrees.** Two writers in one tree can silently overwrite each other's work. Without separate worktrees, run them one at a time.
- **Keep dependencies local to each worktree.** Never remove a worktree whose `node_modules` links to another checkout; removal deletes through the link. Apply `independent-review` for the recipe.
- **Merge parallel stages through an integration branch after clean reviews.** Give each stage its own branch and worktree, name its clean review round in the merge, and rerun the gate after every merge. Two passing branches can fail together when one changes a fixture's required fields. Resolve shared-ledger conflicts by keeping both sides' entries: backlog, decision log, test doc, architecture doc and plan. Concurrent briefs reserve shared sequence numbers, including each migration number and timestamp floor. They state which migrations are applied and which are only written.
- **Check new migration timestamps against the database ledger at every merge.** Run `migration list` on the database that will receive them, since a reserved floor cannot prevent collisions with migrations applied meanwhile.
- **Give concurrent sessions separate accounts or run them sequentially.** They share test accounts, the development database and workers against it, so scope background workers to named accounts.
- **Keep review rounds sequential within a branch.** Each round needs a stable account of changes since the last. Review usually limits throughput: findings arrive only when a round runs, and fix commits produce the worst defects. Parallel building cannot shorten that chain.

## While it runs

**Keep the delegate's tree intact and its run recoverable.** Use another worktree for concurrent edits and files for long-running state.

- **Wait or use another worktree while a delegate builds.** Leave its tree alone.
- **Undo only your probe edit when a file has uncommitted work.** Re-edit the exact change back, or use `git stash push -- <file>` around the probe. Never use `git checkout -- <file>` or `git restore` there; either destroys all uncommitted work in the file. Commit a build before deliberately breaking it to verify a test.
- **Detach long runs and watch a completion marker.** Shell-tool timeouts kill their process trees. Keep state in files that survive your context window; apply `flight-deck`.

## When it comes back

**Verify a handoff against the diff, disk and your own runs.** A delegate's report is evidence to check before deciding what is done.

- **Read a delegated diff and give it independent review.** Treat it as unreviewed code until then.
- **Check the disk before believing a round happened.** Inspect `git status` and file times, since a run without write access can return a convincing report with no changes.
- **Rerun the gate yourself and replace evidence from your own run.** A sandbox without database or browser access cannot supply a passing gate. Read every line the delegate adds to a coverage map or status file; replace its evidence rather than inventing counts.
- **Do every handoff command you can before escalating to the owner.** Use an API, CLI or key you hold and reread the result. Escalate only what needs a person: a dashboard-only click, money or taste.
- **Send a builder's product-decision objection to the owner separately.** Give it its own handoff section, keeping it separate from corrections you can accept yourself.
- **Add your dated status and changes without rewriting the delegate's handoff.** Put status at the top: merged, review rounds, deployed where and what still waits. Keep your changes in their own section, leaving the delegate's text as written. Check claimed deploys against your environment log.
- **Record audit state twice and recheck findings against current HEAD.** Put this instruction in the audit brief: record `HEAD` and `git status --short` at the start and before delivery. Reverify findings about deleted, moved or renamed files against current `HEAD`.
- **Get a distinguishing observation after the second fix that fails.** Repeated correct fixes that do not work indicate a wrong model of the problem. Stop fixing and distinguish two mechanisms with a screenshot or a question the owner can answer in a minute. Do this on the second failed fix, rather than the fifth. Green tests of a sequence the user never receives cannot establish that the symptom is fixed.
- **Resolve agent trade-offs before bringing the result to the owner.** Bring one result or a clearly stated disagreement, leaving the owner to arbitrate intent and taste.
- **Call work ready to test only when nothing needs doing first.** Build, install or deploy it on the surface the owner uses, and say what needs reloading. Complete the handoff, or state its remaining edges plainly.

Each rule's origin, the case that taught it, is in `receipts.md` beside this file; read it when a rule's edge is unclear.

## How you can tell it worked

**Check the report against disk and rerun its claimed checks yourself.** You can verify the delegate's report without asking it anything, and you have rerun whatever it claimed to run.

## Files

**Read the brief template when writing briefs or taking handoffs.**

| File | Holds | Read when |
|---|---|---|
| `references/brief-template.md` | a brief's skeleton, with what each part is for, and the handoff the delegate writes back | writing any brief longer than a paragraph; reading a handoff |
