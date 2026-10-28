---
name: delegation
description: "Before spawning a subagent or dispatching a build, review or research, and before trusting its report: the brief, the delegate, parallel runs, the handoff."
---

# Delegation — a delegate is a partner

A delegate starts with nothing but what you hand it. **Give it the why, not just the what**: what you are trying to achieve and for whom, the constraints that bind, the traps a smart newcomer would walk into, and how the result will be proved. An instruction-only brief ("change X to Y") gets X changed to Y even when Y is not what you wanted. A brief with the goal in it comes back with judgement: *"the force at replay end is redundant, here is why"*, *"a 30px overlay would cover the last line, which is worse than the jump"* — each of which changed what shipped (`2026-08-21`, a remote-control product). That is the return on a brief's length: not compliance, judgement.

Manage a delegate the way a good owner manages you: goal and context, not step-by-step; trust its judgement on the means; push back where you disagree; its view is not binding.

The mechanics of each delegate live in their own skills: `codex-agents` (the Codex CLI as builder and peer), `grok-agents` (the unsteered independent review, through the Grok CLI or a fresh headless Claude session), `claude-agents` (any agent driving Claude Code headless). This skill is what they share.

## What never delegates

- **Deciding what the product should do** — thesis, scope, taste, what the owner wants.
- **Accepting or rejecting a review finding.** A finding is a claim, its severity included (`grok-agents` § Triage).
- **Anything that touches a real system, development included** — a deploy or a promotion, a migration applied to any database (a development project only you use included), a server or worker and its secrets, a live configuration, a drill. The delegate builds each so it is one command and names the commands; you run them. (`2026-10-23` and `24`, a monitoring product: every stage brief listed these under "What stays with me". Delegated builds made 28 commits the day before the first release and none on the day of five production promotions, which was review fixes and real systems throughout.)
- **Final verification.** The tests, the typecheck, the gate, the smoke run on your own eyes. "It says it passes" is a claim to check, never a result.
- **The judgement that a stage is done.**

## When it is worth handing off: size, not time

**If the brief would be nearly as long as the diff, write the diff.** Delegation costs a hand-off: the delegate rediscovers the file, the conventions and the surrounding code before it changes anything. (`2026-08-21`: having already found the exact lines, an agent wrote a 60-line brief and waited twenty minutes for a change it could have made in two.)

| Situation | Who |
|---|---|
| You know the file and the line, and the change is mechanical | **you, directly** — no brief, no round trip |
| It needs exploration, or you are unsure of the mechanism | a delegate |
| It needs real test coverage | a delegate, or one focused test you write yourself |
| A naive fix would walk into a trap | a delegate, **with the trap in the brief** — this is where a long brief earns out |

- **A build round that has made no writes on a small change is stopped**, its leftover process killed, and the change written in-session (`2026-09-22`, a builder sat twelve minutes on a fifteen-line change with a clean tree). What stays with you is unchanged, and your diff still gets the independent review.
- **Use the parallelism or don't pay for it.** The point of a background agent is that you work while it runs. Waiting on it is the latency of delegation without the throughput.
- Don't delegate when you need the reasoning yourself, or when the synthesis needs everything held in one head.

## The brief

Three things, and the first is the one most often skipped:

1. **What we are trying to achieve, and why** — the goal in the owner's terms, and the decision it feeds. A delegate that knows "we are choosing between A and B" can flag a third option or tell you the question is wrong; one told "research A and B" cannot.
2. **The constraints that bind, including the do-nots.** The briefs that mattered most carried a warning, not a task: *"do not fix this in the argument builder — the same string feeds another spawn path"*, *"replay is off the table, recovery only"* (`2026-08-21`). Each stopped a plausible fix that would have been wrong in the large.
3. **How to prove it** — the tests, the gate, what "done" looks like **for this hand-off**, which is narrower than the stage's own done-when whenever that needs real systems. Say what the delegate's sandbox cannot reach (a database, a browser, Docker, the network) and who runs those checks: "write them; I run them". Its handoff then reports them as written but not run, instead of inventing a count, and says it is a code handoff, not the stage done. (`2026-10-22` and `23`, a monitoring product: briefs that said so got "written, not run" back. The invented counts under § When it comes back are what happens when a brief doesn't.)

Then:

- **Compress the evidence, not the context.** Three lines of log beat twenty lines of the reasoning that convinced you. Keep the goal, the binding constraints and the traps at full length; a terse brief produces a locally correct change that is wrong in the large.
- **The brief is the delegate's entire reality.** If your conclusion will rest on a specific claim being true ("none of them shipped X"), put the claim in the brief and ask the delegate to confirm or refute it against primary sources. Treat absence claims as extraordinary. Surface data (engagement numbers, link lists, file names) is not product reality. **When a fact changes while it builds**, append a dated "Added while you build" section to the brief file rather than sending a side message, so the file stays the whole of it (`2026-10-23`: the owner changed the identity provider's organization settings mid-build).
- **A feature that guesses from real-world input starts from evidence.** Run the unchanged code on a real corpus first and cite its numbers for each binding decision. After the build, pin a live golden set that runs on demand, outside the gate. A decision taken from research is a hypothesis the live run may reverse; record the reversal with its measurement. (`2026-10-23` and `24`, a monitoring product: a brief for suggested health checks was built on a scan of 495 real apps. A live run on 30 sites reversed one binding decision, because a browser-like `Accept` header turned checks into page loads: one framework's health route answered HTML, and an identity provider's development instance redirected every check to its sign-in. The same run found four more defects.)
- **Don't prescribe the means** — paths, filenames, libraries, structure — unless they are hard constraints. "The existing system uses X" is context, not a directive. A choice you wouldn't have made is a disagreement to surface, not a defect.
- **Long briefs go in a file**, passed by path or stdin, never as a long inline argument: a long prompt inline trips permission classifiers and shell quoting.
- **Name ranges, not commits, in a brief you will reuse.** A second round run from a brief that pins a SHA re-reviews the commit already reviewed and confidently re-reports what was fixed one commit later (`2026-08-22`, twice in one session). `git log --oneline <last-reviewed>..HEAD` fails loudly when stale.
- `references/brief-template.md` is a starting shape, and also the handoff to ask for back: what was built, the choices where the brief was silent, corrections to the spec, blockers stated as blockers, validation actually run, the commands for you, and what must be redeployed after the push.

## Choosing the delegate

| Delegate | Strong at | Watch for |
|---|---|---|
| **A Claude subagent** (the Agent tool) | Work that needs this repository's context: it loads the project instructions automatically | Fresh context — none of your conversation or tool results. Same model family as you, so it is never the reviewer of your work. Often one level deep: a subagent may have no Agent tool of its own (observed 2026-06-10) |
| **The Codex CLI** (`codex-agents`) | Building a stage to a brief; arguing a decision through as a peer over several turns | Sandbox: a new session is read-only unless told otherwise, and a "build" round that changed nothing reads exactly like one that worked — check the disk |
| **The Grok CLI** (`grok-agents`) | The independent review: a different model family that never saw the build | A round that could not read exits 0 after a sentence; length is the tell |
| **Headless Claude Code** (`claude-agents`) | A session with none of your conversation: a builder or peer for an agent that is not Claude, or a reviewer | A plain `-p` run still loads the project's and the user's instruction files and auto-memory; only a restricted review run starts from the repository alone. A resume keeps the model but drops effort, permission mode and tools unless re-sent (observed 2026-10-24) |

**The model that wrote the code never clears it.** The reviewer is a fresh session, ideally another model family, never the building thread resumed or forked and never a subagent of it. The loop and its stopping rule are `grok-agents`.

## Model and effort (Claude subagents)

- **Set the model explicitly on every spawn.** Omitting it inherits the parent's model; "inherit" is never a routing decision, it is the absence of one. (`2026-07-03`: a full day of mining agents, evidence filers and a benchmark babysitter ran silently at top-tier rates; the babysitter alone was about twenty rounds of purely mechanical work a mid-tier model does identically.)
- **Route by the job, not by how important it feels.** The smallest tier for bulk mechanics with no judgement (renames, CSV parsing, log scans); the mid tier for scoped research, code exploration and building to a written spec; the top tiers for multi-step reasoning and for judgement bottlenecks — architecture, adversarial review, taste. Model names change every few months; the shape doesn't.
- **Use the top tier adversarially.** The highest-value top-tier call of one day was "refute this audit", which overturned the parent's framing and trimmed two over-read magnitudes (`2026-07-24`).
- **Consult up.** A cheaper parent running a plan spawns ONE top-tier child for the single judgement-heavy step — packed with the full context, the why and the specific decision — and treats its answer as the ruling on that step.
- **Pull down, decide up.** For data work, the child pulls and reduces to a table; the parent decides what the table means. (`2026-08-12`: a whole search-data scan ran in a top-tier parent — paginating an API, reducing 39K rows — when the only step that needed it was deciding that one 219K-impression row was worth zero.)
- **Effort.** Check what a spawn actually ran at rather than assuming: each subagent transcript records it (`grep -o '"effort":"[a-z]*"' <transcript> | sort | uniq -c`). Measured 2026-08-22: Agent-tool spawns inherited the parent session's effort, whatever tier they ran on. Claude Code 2.1.310 (read 2026-10-24) gives the Agent tool its own `effort` field; a workflow's agent options or an agent definition's frontmatter set it too.
- **A child that finds the task needs more reasoning than its tier gives returns to the parent** rather than burning tokens; the parent re-runs that step a tier up.

## Several agents at once

- **Parallelise on evidence, not impatience.** Measure the file overlap before deciding: `git show --stat --name-only --format= <ref>` per planned change. (`2026-08-20`: of eight commits, six touched one protocol file and five one host file, so almost nothing in the batch was parallel-safe; the two that touched neither were exactly the two that should have run alongside.)
- **Never two writers in one tree.** A fix written while a delegate built in the same checkout vanished silently when the delegate wrote its files back; `git status` showed the file identical to `HEAD` (`2026-08-19`). Parallel means separate worktrees or nothing.
- **Worktrees carry their own dependencies.** Never remove a worktree whose `node_modules` is a link to another checkout: removal deletes through the link (`grok-agents` has the recipe).
- **Parallel stages merge through an integration branch.** Each stage builds on its own branch in its own worktree and gets a clean review round before it merges; the merge names that round, and the gate runs again after every merge, because two branches that pass alone can fail together (a test fixture from one predated a field the other made required). Shared ledgers are where merges conflict — the backlog, the decision log, the test doc, the architecture doc, the plan — and the resolution keeps both sides' entries. Briefs for concurrent stages reserve the shared sequence numbers: which migration number and timestamp floor each stage takes, and which migrations are applied rather than only written. (`2026-10-22` and `23`, a monitoring product: 39 merges into the integration branch, 16 with conflicts; 25 of the 37 conflicted files were shared docs. Two branches' migrations collided once, and the unapplied one was renumbered after the other, already applied with a later timestamp.)
- **Parallel sessions share more than a tree**: test accounts, the development database, and any worker running against it. Give each concurrent session its own accounts or run them one at a time, and scope background workers to named accounts. (`2026-10-22`, a monitoring product: a design-review session created records in the gate's test account mid-run and turned the gate red, and development's workers picked up the suites' test records, about 90 checks a gate run racing their assertions; `2026-10-24`, a signed-in browser step failed two runs of three under a parallel review's load.)
- **The binding constraint is usually review, not build.** Findings do not exist until a round runs, and fix commits are where the worst defects come from, so parallel building cannot compress that chain. Within one branch, review stays sequential: each round needs a stable "what changed since the last round".

## While it runs

- **Don't edit a tree a delegate is building in.** Wait, or work in another worktree.
- **Never `git checkout -- <file>` (or `git restore`) on a tree carrying uncommitted work** to undo a probe edit: it destroys everything uncommitted in the file, a delegate's whole build included. (`2026-08-15`, twice in one day; one implementation was recovered only from a source map that still embedded the original TypeScript.) Undo a probe by re-editing the exact change back, or `git stash push -- <file>` around it. Commit a build before breaking it on purpose to verify a test.
- **Long runs go detached, with a completion marker** you watch for, because a shell tool kills its process tree at its timeout. Keep their state in files that survive your context window (`flight-deck`).

## When it comes back

- **A delegated diff is unreviewed code.** Read it before believing it, and it still gets the independent review.
- **Check the disk before believing a round happened**: `git status`, file times. A round that ran without write access returns a reasoned report that changed nothing and reads exactly like one that worked (`2026-09-16`).
- **Re-run the gate yourself, and rewrite any evidence it wrote from your own run.** A delegated builder whose sandbox could not reach the database or a browser had no passing gate to report; twice its runs were written up with invented counts (`2026-09-16`, `2026-09-17`). Read every line a delegate adds to a coverage map or a status file.
- **Before passing a delegate's "commands for the owner" up, do every one you can** — through an API, a CLI, a key you hold — and re-read the result. Escalate only what truly needs a person: a dashboard-only click, money, taste. (`2026-10-23`, a monitoring product: a handoff listed the identity provider's OAuth settings as owner settings; they were applied through its backend API with the instance's secret key and re-read, and the migrations and edge rollout in two other handoffs' owner commands were run by the coordinator.)
- **When you take a handoff over, put a dated status line at its top** (merged, reviewed in which rounds, deployed where, what still waits) **and your own changes in a section of their own**, leaving the delegate's text as written. Check what it claims was deployed against your environment's log. (`2026-10-24`: a handoff still opened "incomplete" and "uncommitted" after the coordinator had committed, reviewed and pushed it, and it claimed a deploy the environment log never recorded; review rounds found both.)
- **Audits record `HEAD` and `git status --short` at the start and again before delivering**, and re-verify any finding about a deleted, moved or renamed file against current `HEAD`. Put that instruction in the audit's brief. (An audit once reported a file "in limbo" whose deletion had been committed earlier the same session.)
- **Repeated correct fixes that don't work mean the model of the problem is wrong**, not the implementation. Stop fixing and get one observation that discriminates between two mechanisms — a screenshot, one question the owner can answer in a minute. Ask it the second time a fix does not land, not the fifth (`2026-08-21`: four rounds, each correct and green, none fixing the symptom). Green tests that exercise a sequence the user never receives convert "I don't understand this" into "this is fixed".
- **Converge before surfacing.** The owner arbitrates intent and taste, not trade-offs two agents could argue through; bring them one result, or a disagreement stated cleanly.
- **"Ready to test" means testable with nothing to do first** — built, installed or deployed on the surface the owner will use, with what needs a reload said. A handoff that names its edges is fine; one that stops midway and calls itself done is not (`2026-08-19`: the owner tested a fix twice against last night's build).

## How you can tell it worked

The delegate's report could be checked against the disk without asking it anything, and whatever it claimed to have run, you ran again yourself.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/brief-template.md` | a brief's skeleton, with what each part is for, and the handoff the delegate writes back | writing any brief longer than a paragraph; reading a handoff |
