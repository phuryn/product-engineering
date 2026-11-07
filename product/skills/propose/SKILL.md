---
name: propose
description: "'I have an idea', 'is this worth building', 'what next': research it and propose what to build, with sources and key screens to review. Not for agreed changes or bugs."
---

# Propose — research an idea, then propose what to build

The owner has an idea, or a product in use needs its next step. The agent reads what the owner shared, looks for what is missing, sets the idea against that evidence and proposes something the owner reviews, **the interface first**. What comes out is **informed hypotheses**: until people use the product and pay for it, every claim is a hypothesis with a source, never a finding.

This is not an interview. Questions come last, and only the ones the evidence cannot decide. An interview sharpens what the owner already thinks; this brings in what the owner doesn't know yet.

**Not for** an agreed change, a bug or a small UI change: those go straight to a plan or a build. **Not when** the owner has already decided and asks for the build.

**Who decides.** The owner owns the thesis, the segment, what gets built and when. The agent owns the evidence and the proposal artifact, and says plainly where the evidence and the owner's idea disagree.

## Steps

### 1. Read what was shared, then what already exists

Everything the owner gave: notes, research, data, links, screenshots, competitor names. Then the product's own record, if there is one: the brief, the decision log, an earlier proposal. **Use the repository's existing equivalent of a proposal** before creating one; a second document that restates the first is how decisions get lost between them. On a re-run, start from the existing proposal (§ Running it again).

**When the product implements a published method, write its steps before the use cases**, with a source per step, in the brief above its use cases (the `app-lifecycle` skill's brief, or the product's equivalent). The owner names which source is the authority and which is a simplification. The use cases follow that order; check the first against the authoritative document as the first thing a new user does. (`2026-11-03`, an evals product's accepted proposal, brief and UX replan all began with production traces although the method starts earlier; the owner's article had been read only to check quotes, never compared with the plan.)

### 2. Research what is missing

- **Alternatives:** up to five that the people in question actually use, including substitutes (the spreadsheet, the agency, the manual workaround) and **doing nothing**. Keep direct competitors distinct from substitutes. When the `competitor-analysis` skill is installed, hand it this narrower scope instead of its full report, and tell it to leave out any market size, share or funding figure it has no source for.
- **The segment**, when it is still open: the `market-segments` and `beachhead-segment` skills. **The value proposition and the value curve** against the alternatives: the `value-proposition` and `value-curve` skills.
- **What people say** in reviews, forums, Reddit and X, when the owner wants it: for the problems and the words people use, never for how common a problem is or what anyone would pay.
  - **Each quote is verbatim, checked against the page as fetched**, with its link and the date it was read.
  - **Leave out posts by a vendor, its staff or its affiliates**, and paid or promoted ones: astroturf reads as demand.
  - **A quote read from a mirror or an archived copy**, because the site blocks fetching, is flagged as such.
  - (`2026-11-01`, an evals product's market research: these rules made its quotes usable, and had to be written into the brief because no skill held them.)
- **Every source gets its address and the date it was read.** A claim without one is the agent's own.

**Market research asked for on its own** (competitors, segments, a value proposition, a value curve, what people say) is this step without the proposal, in this order: the alternatives (`competitor-analysis`), the segments (`market-segments`, then `beachhead-segment` while the first one is open), the value proposition for the chosen segment (`value-proposition`), and the value curve against the alternatives (`value-curve`), with what people say gathered alongside under the rules above. It ends with every claim marked by kind (step 3), not with a proposal. (`2026-11-01`, an evals product: such a request took four skills composed by hand, in an order none of them stated.)

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

### 4. Check feasibility before drawing screens

When the idea depends on something that may not exist or may not be allowed (an API, a platform rule, access to the data, a cost per user that eats the price), check it now and say what was checked. Screens of something that can't be built waste the owner's review.

### 5. Propose

- **One direction when the evidence clearly favours it; two or three, with their trade-offs, when the choice is real.** Inventing alternatives to fill a template hides the recommendation.
- For each: who it is for, the value proposition, what the first version does and deliberately doesn't do, and why this over the alternatives. **Weigh each part of the first version by what people will see against what it costs**: visible, cheap parts early (a landing, pricing on display, example data that fills every screen), hard logic once the product is worth it (`2026-11-03`, an evals product spent ten review rounds on hard logic before it had a landing; the owner: "Seeing app with all those elements that costs a little is wow. Debugging hard logic for hours isn't.").
- **Name the weakest consequential assumption**: the one that, if wrong, changes the recommendation. Not the weakest assumption overall; a shaky detail that changes nothing can wait.
- Recommend one, and say why.

### 6. Build what the owner reviews, interface first

- **One self-contained HTML page**, opening from its file with no server or build. Order: research, alternatives, segment, value proposition and value curve, the recommendation (§ 5), jobs map, key screens, open decisions, hypotheses with the weakest consequential assumption and its experiment. Research marks every claim by kind and source (§ 3).
- **The jobs map first:** each job numbered and in the user's words, the screen it happens on, the one question that screen answers and its primary action. Draw one high-fidelity screen per key job, each showing its job's number, with realistic sample data marked as such. When replacing a familiar tool, start from its structure and justify departures. (`2026-11-07`, a static discovery page: a cold reader valued the jobs map most; matching numbers connected its rows to screens.)
- **Apply the `ui-design` skill**, reading its method before screens; it needs `app-stack` installed. Without it, use the jobs map above, `frontend-design` direction, token values and a checked screenshot. Embed and compose an existing kit's CSS inside the HTML file; for a new product, choose one subject-grounded direction and keep values in tokens. Check screenshots against the method, where present, before the owner sees them. (`2026-11-03`, an evals product's artifact imitated its kit and invented borderless buttons; the owner caught those and misaligned chips.)
- **Static or clickable screens**, as the person and agent agree. The first working version takes hours and tests the full flow; build no separate app prototype.
- **Charts:** use `dataviz`, built into Claude Code (observed `2026-11-07`), for the value curve, segment scores and impact/effort view. Elsewhere use its distilled rules in `ui-design`'s `references/collections.md` § `dataviz`. (`2026-11-07`, a static discovery page: a scatter was unreadable; a labelled 3×3 grid with a legend read clearly.)
- **Fresh eyes before the owner:** apply the `ui-design` newcomer walkthrough to the artifact when installed. A fresh session receives only artifact screenshots and the reader's role. Ask what the page is, what decisions they would make and what is unclear. Fix failures before the owner sees the page. (`2026-11-07`, a static discovery page: screenshots alone exposed a reversed label, a band contradicting its chart title and screens disconnected from jobs.)
- **The owner's preview:** name the key screens and what to inspect on each, before any plan.
- **The customer experiment:** its hypothesis ID, participants, task, observed behaviour and the result that would change the recommendation. Building the first version and putting it in front of paying users is often the experiment.

### 7. Ask only what the evidence can't decide

Keep the few questions in the artifact's open decisions, each with options, a recommendation and its reason. They concern the owner's values, segment or scope. Where hosts save viewer picks, as claude.ai artifacts can (read `2026-11-07`), the person picks on the page. Read those picks back next iteration and record them in the decision log. For local files and other hosts without that capability, a button copies choices as text for chat; the person can also answer in chat. The same file supports both paths. (The author's preference, as an example to replace with your own: "a person talking to Claude", `2026-11-07`.) The owner may share the page like any other; the decisions stay the owner's. (`2026-09`, a live Q&A product: the agent asked "what if there is a single user and no moderator?", and the answer, moderated by default with a switch to turn it off, went into the build prompt.)

### 8. Write the record

The HTML file is the one durable record, in the repository's existing place, else `docs/product/proposal.html`; `references/proposal.md` gives its sections. Where the host publishes pages, publish from this file and republish from it each iteration, keeping both aligned. In Claude, that is a claude.ai artifact (observed `2026-11-07`). Create no Markdown duplicate: a second document restating the first loses decisions. Key screens live inside the record.

| Record | Holds |
|---|---|
| The proposal artifact | research with claim kinds and sources, alternatives, segment, value proposition and curve, jobs, screens, decisions, hypotheses and experiments |
| The brief (or the product's refined idea) | the accepted intent and use cases |
| The decision log, if there is one | the choices made, their reasons, what would reopen them |

**After the owner accepts**, update the brief and decision log where needed and link the artifact as evidence. Write no second brief when the accepted proposal already does that job. For a SaaS, apply the `app-lifecycle` skill with the accepted artifact. For a complex change in any product, the next step is a plan that opens with its key assumptions (what the ask means in this product, where a number or a word the owner gave is wrong, what the owner must decide). When the change alters what people see or leaves choices open, that part goes on this page, or a new one in the same form: the key assumptions first, then the screens of the flows that change in high fidelity, then the choices still open, picked as § 7 says. The builders' part stays in the repository's plan: phases, the files each changes, how to test it (a test that would touch production, its users or its data runs only with the owner's go) and acceptance criteria.

## Running it again, once people have used it

The proposal is run again after real people have tried the product, with what they **did**: what they used, returned to, abandoned and paid for, and where that came from (analytics, payments, support, interviews).

- **Update and republish the same HTML file.** Append evidence, update conclusions. Add each dated observation under the hypothesis it bears on, by ID. Then update each hypothesis's current status (supported, weakened, refuted, untested) and replace the recommendation. Never leave the old recommendation beside the new one: a proposal that only grows leaves the builder choosing between them.
- **What people say they did counts; what they say they would do is a hypothesis again.**

## Receipt

(`2026-10-16` to `2026-10-21`, a monitoring product.) Competitor and market research over three days led to a first-version spec the owner reviewed (`2026-10-18`), then a prototype of every screen on simulated data, then the build. A pre-order test was dropped for a narrower first version that works. No tickets anywhere: the reviewed artifact was the unit of work.

(`2026-11-07`, the author dropped the separate prototype: "building an app like the first version that works is like what? A few hours." Screens "perhaps with some dynamic elements, perhaps clickable" in one artifact with the research and the decisions are enough, and the plan for a complex change grows the same page.)

## How you can tell it worked

The owner can say where each claim came from, saw the key screens before any plan, made the open decisions on the page or in the chat, and was asked only what they alone could answer; they know which hypothesis the first users will test and what result would change the plan.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/proposal.md` | the proposal's sections, the hypothesis table and the observation log, as HTML page sections | writing or updating the record |
