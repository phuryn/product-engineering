# A brief's skeleton, and the handoff that comes back

Copy, fill, delete what doesn't apply. Order matters: the goal comes first because it is the part a delegate cannot reconstruct from the code.

```markdown
## Goal — what we're trying to achieve, and why
<The outcome in the owner's terms: who it is for and what changes for them.
 The decision this feeds, if any: "we are choosing between A and B".>

## Where things stand
<What is known, with the evidence compressed: three lines of log, the failing
 test's name, the file and line you suspect. Paste the artifact, not a
 description of it. Name what you already ruled out and why. For a feature that
 guesses from real-world input, the numbers from running today's code on a
 real corpus. Prior art from another product that solved the same surface:
 what it learned, the files to read (read-only), and what doesn't apply here.>

## Constraints that bind
<The rules the code alone doesn't show: invariants, trust boundaries, a
 contract mirrored elsewhere, files that are generated and never hand-edited,
 what may not be touched (commits, pushes, migrations, production). For a stage
 built beside others: the shared numbers it takes (its migration number and
 timestamp floor), which migrations are applied and which only written.>

## Traps
<The plausible fixes that would be wrong, and why: "do not fix this in X —
 the same value feeds Y". This section is where a long brief earns out.>

## Load-bearing claims to check
<Any claim your conclusion will rest on. Ask the delegate to confirm or refute
 it against a primary source, not to assume it.>

## What stays with me
<Everything that touches a real system, development included: deploys,
 migrations applied to any database, servers and their secrets, live
 settings, drills. "Build so I can do each with one command, and name the
 commands.">

## How it's proved — done, for this hand-off
<What the delegate can finish where it runs: the code, its tests, its doc lines,
 the handoff. What its sandbox cannot reach (database, browser, Docker,
 network) and who runs those checks: "write them; I run them". The stage's own
 done-when, when it needs real systems, stays with me.>

## Scope
<The files or area it may change. The range under review, named as a git
 range (`<last-reviewed>..HEAD`), never a pinned commit in a reusable brief.>

## Added while you build
<Dated, appended when a fact changes mid-build; never a side message.>
```

What a brief does **not** carry: a step-by-step procedure, prescribed filenames or libraries that are not hard constraints, your argument for why the design is right (for a reviewer, that is steering), or what an earlier reviewer found (for a fresh review round, `grok-agents` § Writing the brief).

## The handoff the delegate writes

Ask for it by name in the brief, as a file beside the brief. Each part is there because a handoff without it once cost a round or a day:

```markdown
<Status line, added by you when you take it over: dated — merged, reviewed in
 which rounds, deployed where, what still waits.>

Branch and base. Which real systems it touched (normally: none). "This is a
code handoff, not the stage done."

## Built
## Choices where the brief was silent      <each with its reason>
## Where the spec needs correcting         <with the vendor docs that say so>
## Blockers                                <stated as blockers, never as a
                                            claimed fix; an unreproduced bug
                                            stays open, with what to capture
                                            when it recurs>
## Validation actually run                 <commands, exit codes read from the
                                            log, counts; what was written but
                                            not run; any attempt that may have
                                            reached a real system>
## Commands for you                        <each real-system step as one command>
## Integration notes                       <for stages built in parallel: what
                                            to merge or apply first>
## Release follow-through                  <what must be redeployed after the
                                            push: a runtime whose code changed>
## Deferred candidates
## Doc mismatches noticed, not caused      <left for the owner, not reconciled>

## Your changes                            <added by you, dated; the
                                            delegate's text above stays as written>
```

(`2026-10-23`, a monitoring product's builder handoffs: one's spec correction — the payment provider's events API names no endpoint and no first-failure time — was carried out the next day; another's release follow-through, "this check code changed: redeploy the probes", was done that night; a third reported an icon bug it could not reproduce as a blocker rather than a fix, and the coordinator's own run with the original bytes did not reproduce it either.)
