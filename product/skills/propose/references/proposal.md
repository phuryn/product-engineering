# The proposal

**What it is for:** the evidence behind what the product should do next, the hypotheses it rests on, the alternatives considered, the recommendation, and how the weakest assumption will be tested. It is the one record of *why*; the brief holds *what was accepted*, the decision log *what was chosen*.

**Rules**

- **Every claim has a kind and a source** (`SKILL.md` § 3). A claim with no source is the agent's inference or an assumption, and says so.
- **Hypotheses keep their IDs for life.** Observations attach to an ID; a hypothesis that turned out wrong is marked refuted, not deleted.
- **One current recommendation.** Rewrite it when the evidence changes; history lives in the observation log.
- **The prototype is sample data**, and the record says so where it links it.

## Skeleton — copy from here

```markdown
# Proposal: <the idea, in a line>

Updated <YYYY-MM-DD>. Prototype: <link> (sample data). Status: <draft | reviewed by the owner on <date> | accepted on <date>>

## What was shared

<What the owner gave, one line each, with where it lives.>

## Evidence

| # | Claim | Kind | Source, date read |
|---|---|---|---|
| E1 | <a competitor charges per seat from $12 a month> | observed | <url>, <date> |
| E2 | <"we start with educators"> | owner preference | the owner, <date> |
| E3 | <educators already pay for a similar tool, so they will pay for this> | agent inference, from E1 and E4 | — |

## Alternatives

<Up to five that the people in question actually use, direct competitors kept apart from substitutes and doing nothing. Each: what it does for them, where it falls short, the source.>

## Hypotheses

| ID | Hypothesis | Rests on | Status | Last evidence |
|---|---|---|---|---|
| H1 | <solo educators will pay monthly for ranked questions> | E1, E3 | untested | — |

The weakest consequential assumption: <ID>, because if it is wrong <what changes in the recommendation>.

## Directions

<One, or two or three when the choice is real: who it is for, the value proposition, what the first version does and doesn't do, the trade-off.>

## Recommendation

<One direction and why. Rewritten, never appended to.>

## The owner's preview

1. <action> → <what should happen>
2. …

## Experiments

| Tests | Who takes part | What they do | What is observed | The result that changes the recommendation |
|---|---|---|---|---|
| H1 | <ten educators from the waitlist> | <run one session with the first version> | <how many pay after the trial> | <fewer than two pay> |

## Open decisions for the owner

<Each with the agent's recommendation and the reason. Moved to the decision log once decided.>

## Observation log

<Dated, appended. Each: the date, what people did (used, returned to, abandoned, paid for), the source, and the hypothesis IDs it bears on.>
```
