# Rejected and deferred

Requests the collection decided not to take, or not yet: a skill, a pattern, a change of approach. Read this before proposing a new skill; reopen an entry only with new evidence, and say what it is. Upstream changes deliberately not ported are recorded with the skill's provenance (`skipped`, in `sources.json` or `sources.local.json`), not here.

Each entry: the date, the request, **rejected** or **deferred**, the reason, the evidence, and who decided.

---

## Tickets: a spec cut into vertical slices on a tracker

- **2026-10-27 · rejected.**
- **Request:** a skill that turns a spec into tickets sized for one context window, as another public collection does.
- **Reason:** in this collection's process the unit of work is the artifact the owner reviews, and a plan only for a complex change (what to implement, how to test it, acceptance criteria). Tickets make a document about the code the thing the human checks, and the agents here own the code and review it for each other.
- **Evidence:** a monitoring product went from three days of research to a spec the owner reviewed, a prototype of every screen on simulated data and the build (`2026-10-16` to `2026-10-21`), and was in production by `2026-10-27`, with no tickets anywhere: the reviewed spec and prototype were the unit of work. The other collection's own docs call its spec "intended to be deleted immediately".
- **Decided by:** the owner, accepting the comparison's recommendation.

## Test-first as a skill

- **2026-10-27 · rejected.**
- **Request:** a test-driven-development skill: tests written first at agreed seams.
- **Reason:** what it protects is already a rule where it matters: a fix lands with a regression test whose failing half is run before the fix (the `test-harness` skill). Writing every test first makes the code the human checks; here the human checks the product.
- **Evidence:** `test-harness` § Tests and docs are part of the change (`2026-10-23`: a fix's journey check passed on the commit before it, so the fix was reverted and the assertion kept).
- **Decided by:** the owner, accepting the comparison's recommendation.

## A glossary or domain-modeling skill

- **2026-10-27 · rejected.**
- **Request:** a shared glossary file and decision records every skill reads.
- **Reason:** the shared language here is the product itself, with its business objects visible on realistic data, and the system docs hold the roles, flows and rules (`shipping-artifacts`). Decisions already have a home: the decision log (`app-lifecycle`) and the proposal (`propose`).
- **Evidence:** none of the collection's receipts trace a defect to vocabulary drift.
- **Decided by:** the owner, accepting the comparison's recommendation.

## A code-shape or codebase-architecture skill

- **2026-10-27 · deferred.**
- **Request:** a skill for module boundaries, code structure and refactoring toward a design.
- **Reason:** no receipt yet. The collection adds a rule only from an observed failure.
- **Reopen when:** the review rounds on the next product show defects whose cause is the code's structure.
- **Decided by:** the owner, accepting the comparison's recommendation.

## Debugging as its own skill

- **2026-10-27 · rejected, in favour of a section in `test-harness`.**
- **Request:** a separate debugging skill.
- **Reason:** models already know that a fix should fail without the change and pass with it. The receipts show the failure is elsewhere: the agent's picture of the problem is wrong, so correct, green fixes don't move the symptom. That is one rule, now `test-harness` § When a fix doesn't land: after two such fixes, stop and get one observation that tells the explanations apart.
- **Evidence:** `2026-08-21`, a remote-control product: four rounds of correct, green fixes, none fixing what the owner saw; `2026-08-19`: a fix tested twice against the previous night's build.
- **Decided by:** the owner.

## An interview ("grilling") skill

- **2026-10-27 · rejected, in favour of `propose`.**
- **Request:** a skill that interviews the builder about the open decisions before anything is built.
- **Reason:** questions sharpen what the builder already thinks; they don't bring in what the builder doesn't know. Here the agent researches first and asks only what the evidence can't decide, inside `propose` (step 7).
- **Evidence:** the other collection's users: "10+ questions at once is unbearable", and decisions lost between the interview, the spec and the tickets.
- **Decided by:** the owner.

## Making `release-gate`, `grok-agents`, `delegation` and `app-lifecycle` user-invoked

- **2026-10-27 · rejected.**
- **Request:** mark the four process skills as started by the user only, to take their descriptions out of the agent's context.
- **Reason:** other skills and ordinary agent moments rely on loading them: before a push that deploys, before spawning a delegate, when planning a stage. In Claude Code an agent can't load a user-invoked skill at all, and in Codex it drops out of the list the agent chooses from, so the calls other skills make to them would stop working. The context cost was cut instead by rewriting every description, trigger first: from 24,767 characters for 32 skills to 5,576 for the 38 an agent can load, and in Claude Code from 9,143 tokens a turn to 2,423. Only workflows that are a whole session's work or a moment the user picks are user-invoked: `start-here`, `ship-check`, `handover`, `retro`.
- **Evidence:** the calls themselves (`app-lifecycle` § What holds at every stage, `test-harness` § The gate). Measured `2026-10-27`: in Claude Code 2.1.311 the Skill tool refuses such a skill ("cannot be used with Skill tool due to disable-model-invocation"); in Codex CLI 0.159.0 it is left out of the prompt's skill list, still runs when named with `$`, and can still be read by an agent that goes looking for the file.
- **Decided by:** the maintaining agent and Codex, converged over two rounds; confirmed by the owner on `2026-10-28` ("keep what works").

## Cutting the always-loaded descriptions to under 1,500 tokens

- **2026-10-28 · rejected.**
- **Request:** bring the descriptions an agent always has in context under 1,500 tokens a turn.
- **Reason:** the target came from dividing characters by four. Measured, the listing runs about 2.8 characters a token, so 1,500 tokens would mean descriptions of about 80 characters: room for the trigger and nothing else. At about 150 there is room for the trigger, a clause on what the skill does and, where a skill needs one, a clause that stops it starting on the wrong request (`propose`: "Not for agreed changes or bugs"; three others start "Only when"). The validator holds the total to 6,000 characters (rule 7 in `AGENTS.md`).
- **Evidence:** measured `2026-10-27` in Claude Code 2.1.311: 5,576 characters of descriptions cost 2,423 tokens a turn, against 9,143 before the rewrite. The trigger evals passed 17 of 17 at this length, the must-not-start cases included; 80-character descriptions are untested.
- **Decided by:** the owner ("keep").

## A full rewrite of `competitor-analysis` for use inside `propose`

- **2026-10-27 · deferred.**
- **Request:** make the helper fit a proposal: fewer alternatives, substitutes and doing nothing included, no figures without a source.
- **Reason:** `propose` passes that narrower scope when it calls the helper. Two parts were taken on `2026-10-27`, after an independent review found the helper's output sections contradicting its own done-when: a figure with no source is now left out ("no source found"), and substitutes and doing nothing are named beside the competitors. Deferred: the rest of the rewrite, such as asking for fewer than five direct competitors.
- **Reopen when:** the helper is next used on its own, or the scoped call is seen to be ignored.
- **Decided by:** the maintaining agent and Codex.
