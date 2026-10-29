---
name: propose
description: "'I have an idea', 'is this worth building', 'what next': research it and propose what to build, with sources and a prototype to review. Not for agreed changes or bugs."
---

# Propose — research an idea, then propose what to build

The owner has an idea, or a product in use needs its next step. The agent reads what the owner shared, looks for what is missing, sets the idea against that evidence and proposes something the owner reviews, **the interface first**. What comes out is **informed hypotheses**: until people use the product and pay for it, every claim is a hypothesis with a source, never a finding.

This is not an interview. Questions come last, and only the ones the evidence cannot decide. An interview sharpens what the owner already thinks; this brings in what the owner doesn't know yet.

**Not for** an agreed change, a bug or a small UI change: those go straight to a plan or a build. **Not when** the owner has already decided and asks for the build.

**Who decides.** The owner owns the thesis, the segment, what gets built and when. The agent owns the evidence, the proposal and the prototype, and says plainly where the evidence and the owner's idea disagree.

## Steps

### 1. Read what was shared, then what already exists

Everything the owner gave: notes, research, data, links, screenshots, competitor names. Then the product's own record, if there is one: the brief, the decision log, an earlier proposal. **Use the repository's existing equivalent of a proposal** before creating one; a second document that restates the first is how decisions get lost between them. On a re-run, start from the existing proposal (§ Running it again).

### 2. Research what is missing

- **Alternatives:** up to five that the people in question actually use, including substitutes (the spreadsheet, the agency, the manual workaround) and **doing nothing**. Keep direct competitors distinct from substitutes. When the `competitor-analysis` skill is installed, hand it this narrower scope instead of its full report, and tell it to leave out any market size, share or funding figure it has no source for.
- **The segment**, when it is still open: the `market-segments` and `beachhead-segment` skills. **The value proposition and the value curve** against the alternatives: the `value-proposition` and `value-curve` skills.
- **What people say** in reviews, forums, Reddit and X, when the owner wants it: for the problems and the words people use, never for how common a problem is or what anyone would pay.
- **Every source gets its address and the date it was read.** A claim without one is the agent's own.

### 3. Mark every claim by kind

| Kind | Example | Used as |
|---|---|---|
| Observed fact or reported behaviour | a published price; a review saying "I export it to a spreadsheet every Friday" | evidence, with source and date |
| Owner constraint or preference | "I want to start with educators"; "no mobile app" | a decision: recorded, not argued with |
| Agent inference | "educators will pay, because they already pay for a similar tool" | marked as the agent's, with the evidence it rests on |
| Unsupported assumption | "teams will switch within a month" | named, and tested before anything rests on it |

- **A competitor's marketing is evidence of how it positions itself**, not of what it does or what its customers get.
- **The owner's preference is a decision; the owner's assertion is a hypothesis.** "I want this segment" is recorded as a choice. "This segment will pay" stays a hypothesis with no source but the owner, and the proposal says so.
- For a new product most evidence is other people's words, read by a model that writes fluently. **If the proposal doesn't show each claim's source and mark the agent's own inferences, it is assumptions in a confident tone.**

### 4. Check feasibility before the prototype

When the idea depends on something that may not exist or may not be allowed (an API, a platform rule, access to the data, a cost per user that eats the price), check it now and say what was checked. A prototype of something that can't be built wastes the owner's review.

### 5. Propose

- **One direction when the evidence clearly favours it; two or three, with their trade-offs, when the choice is real.** Inventing alternatives to fill a template hides the recommendation.
- For each: who it is for, the value proposition, what the first version does and deliberately doesn't do, and why this over the alternatives.
- **Name the weakest consequential assumption**: the one that, if wrong, changes the recommendation. Not the weakest assumption overall; a shaky detail that changes nothing can wait.
- Recommend one, and say why.

### 6. Build what the owner reviews, interface first

- **An interactive prototype on realistic sample data**, every screen marked as sample data. HTML is enough. The owner tries it before reading any plan. When the product needs them, the plan and the technical assumptions come after, for the owner to challenge once the interface makes sense.
- **The owner's preview:** a link and 3 to 7 things to try, each an action and what should happen.
- **The customer experiment** is a different thing: the hypothesis it tests (by ID), who takes part, what they are asked to do, the behaviour that is observed, and **which result would change the recommendation**. Building the first version and putting it in front of paying users is often the experiment.

### 7. Ask only what the evidence can't decide

One round, a few questions at most, each with the agent's recommendation and the reason. These are the decisions that are the owner's: a trade-off between values, a segment, a scope line. (`2026-09`, a live Q&A product: the agent asked "what if there is a single user and no moderator?", and the answer, moderated by default with a switch to turn it off, went into the build prompt.)

### 8. Write the record

One durable file, in the repository's existing place for it, else `docs/product/proposal.md`; its sections are in `references/proposal.md`. Link the prototype from it.

| Record | Holds |
|---|---|
| The proposal | evidence, hypotheses with IDs, alternatives, the recommendation, experiments, the prototype link |
| The brief (or the product's refined idea) | the accepted intent and use cases |
| The decision log, if there is one | the choices made, their reasons, what would reopen them |

**After the owner accepts**, update the brief and the decision log where needed and link the proposal as their evidence. Don't write a second brief when the accepted proposal already does that job. For a SaaS, the `app-lifecycle` skill picks up from here with the brief and the prototype in hand; for a complex change in any product, the next step is a plan that opens with its key assumptions (what the ask means in this product, where a number or a word the owner gave is wrong, what the owner must decide), then what to implement, how to test it (a test that would touch production, its users or its data runs only with the owner's go) and acceptance criteria.

## Running it again, once people have used it

The proposal is run again after real people have tried the product, with what they **did**: what they used, returned to, abandoned and paid for, and where that came from (analytics, payments, support, interviews).

- **Append evidence, update conclusions.** Add each dated observation under the hypothesis it bears on, by ID. Then update each hypothesis's current status (supported, weakened, refuted, untested) and replace the recommendation. Never leave the old recommendation beside the new one: a proposal that only grows leaves the builder choosing between them.
- **What people say they did counts; what they say they would do is a hypothesis again.**

## Receipt

(`2026-10-16` to `2026-10-21`, a monitoring product.) Competitor and market research over three days led to a first-version spec the owner reviewed (`2026-10-18`), then a prototype of every screen on simulated data, then the build. A pre-order test was dropped for a narrower first version that works. No tickets anywhere: the reviewed artifact was the unit of work.

## How you can tell it worked

The owner can say where each claim came from, tried the prototype before reading any plan, was asked only questions they alone could answer, and knows which hypothesis the first users will test and what result would change the plan.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/proposal.md` | the proposal's sections, the hypothesis table and the observation log, as a skeleton to copy | writing or updating the record |
