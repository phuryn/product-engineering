# The stage brief

**What it is for:** what the session agent hands a builder for one stage — the stage's goal, the decisions that bind it, and the files it will touch — what the builder can finish in its own sandbox, and **what the stage is judged against when it comes back.** One file per active stage.

**Rules**

- **A brief, not a keystroke script.** State the goal once, hand over the binding decisions and the context, and let the builder pick the means. Numbered micro-instructions are recipe-writing dressed up as a brief. (How to brief a builder well, and when not to: the `delegation` and `codex-agents` skills.)
- **If the brief would be nearly as long as the diff, write the diff yourself.** The test is size, not time. (`2026-09-22`, a live Q&A product: a builder sat twelve minutes on a fifteen-line change with zero writes.)
- **Two done-whens, kept apart.**
  - **The stage's done-when is the plan's, copied**, so the stage is judged against what the owner agreed to, not against what came back. It usually needs real systems the builder cannot reach: a deployed build, the development database, a signed-in browser, the owner's preview.
  - **"Done, for this hand-off" is what the builder can finish in its own sandbox**: the code, its tests written, its doc lines, a short note, and the commands the session agent will run. Say what the sandbox cannot reach (a database, a browser, Docker, the network) and who runs those checks: "write them; I run them."
  - **Every handoff then says plainly that it is a code handoff, not the stage done**, and lists what it wrote but could not run. The session agent marks the stage done only from its own run against the stage's done-when.
  - (`2026-10-23`, a monitoring product: once its briefs split the two, every handoff opened "This is a code handoff, not a claim that the stage's live done-when passed" and reported database tests as written but not run. Earlier, on another product, builders whose sandbox reached no database had twice reported gate counts nobody ran, `2026-09-16` and `2026-09-17`.)
- **What stays with the session agent: anything that touches a real system, development included** — a deploy, a migration applied to the development database, a worker's secrets, a drill. The builder makes each one a single command and names it in the handoff.
- **Without a builder**, the session agent builds the stage itself and the plan's line for the stage is its brief; no separate file is needed.
- **What a builder reports is a claim.** A delegated diff is unreviewed code: read it before believing it, re-run the gate yourself, and rewrite the coverage evidence from your own run. The independent review still applies.
- **When the stage is done, the brief moves unchanged to an archive folder** (`docs/history/briefs/<stage>.md`, say), and the stage's line in the plan points there. **A folder holding no brief means no stage is in flight.**

## Skeleton — copy from here

```markdown
# <stage> — <one-line goal>

## Goal

<What the stage delivers, in a paragraph, in the product's terms. Which use cases (by number, from the brief) it serves.>

## Done when

<The plan's done-when for this stage, copied: what a person can check. The session agent judges it, from its own run.>

## Done, for this hand-off

<What the builder finishes in its sandbox: the code, its tests and its doc lines, committed on <branch>. What the sandbox cannot reach (<a database, a browser, the network>): write those tests; the session agent runs them. Then the handoff: what was built, the choices where this brief is silent, corrections to the spec, what was run and what was not, and the commands the session agent runs (its full shape: the `delegation` skill's brief template). It opens by saying it is a code handoff, not the stage done.>

## What stays with the session agent

<Anything that touches a real system, development included: deploys, migrations applied, secrets set, drills. Each one a single command, named in the note.>

## Decisions that bind it

- <The product-section rules, decision-log entries and default choices this stage must hold — named, with where each lives.>
- <What is deliberately not in this stage.>

## Files it will touch

- <The files and areas the change lands in, and the docs whose lines it will make false.>

## Tests and docs that land with it

- <The tests the change owes, and in which harness they run; the doc lines to correct.>

## Needs a person

- <Dashboard settings, accounts, numbers that are judgements — anything the builder cannot do or decide.>
```
