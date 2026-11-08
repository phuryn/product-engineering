---
name: propose
description: "'I have an idea', 'is this worth building', 'what next': research it and propose what to build, with sources and key screens to review. Not for agreed changes or bugs."
---

# Propose — research an idea, then propose what to build

**Research the idea and propose something the owner reviews, interface first.** Use this for a new idea or a product's next step, testing what the owner shared against the evidence you find.

**Treat product claims as sourced hypotheses until people use and pay.** Bring in what the owner does not yet know, presenting informed hypotheses rather than findings. Questions come last, limited to what evidence cannot decide; interviewing alone sharpens what the owner already thinks.

**Plan or build agreed changes, bugs and small UI changes directly.** Also go straight to the build when the owner has already decided and asks for it.

**Leave thesis, segment, build scope and timing with the owner.** You own the evidence and proposal artifact, and say plainly where evidence disagrees with the owner's idea.

## Steps

**Follow the evidence through research, a reviewable proposal and recorded decisions.** The owner sees the interface before any plan.

### 1. Read what was shared, then what already exists

**Read the owner's material and the product's existing record first.** Read all supplied notes, research, data, links, screenshots and competitor names, then any brief, decision log and earlier proposal.

**Use the repository's existing proposal equivalent before creating another.** Duplicated proposals lose decisions between them. Rewrite an existing Markdown proposal once as HTML in the same place, removing the Markdown in that change while git keeps its history. On a rerun, start from the existing proposal (§ Running it again).

**Write a published method's sourced steps before the product's use cases.** When the product implements a method, place its steps in the brief above the use cases. Use the `app-lifecycle` skill's brief or the product's equivalent. Give each step a source, have the owner identify the authority and any simplification, then order the use cases accordingly. Check the first use case against the authoritative document as the first thing a new user does.

### 2. Research what is missing

**Research actual alternatives and fill the evidence gaps.** Match the research to the choices still open.

- **Research up to five alternatives people actually use, including doing nothing.** Include substitutes such as spreadsheets, agencies and manual workarounds, keeping them distinct from direct competitors. When installed, apply `competitor-analysis` with this narrower scope rather than its full report. Tell it to omit market-size, share and funding figures without sources.
- **Research an open segment and compare the value offered.** Apply `market-segments` and `beachhead-segment` while the segment remains open. Apply `value-proposition` and `value-curve` for the proposition and curve against alternatives.
- **Gather what people say when the owner wants it.** Use reviews, forums, Reddit and X for problems and people's words, without inferring prevalence or willingness to pay from those comments.
  - **Check every quote verbatim against the fetched page.** Include its link and the date read.
  - **Exclude vendor, staff, affiliate, paid and promoted posts.** Use independent accounts because astroturf can look like demand.
  - **Flag quotes fetched through mirrors or archives.** Say when blocked fetching required that route.
- **Give every source its address and date read.** A claim without a source is your own.

**Handle standalone market research here without building a proposal.** For requests covering competitors, segments, a value proposition, a value curve or people's comments, follow this order without a proposal. Gather people's comments alongside under the same rules:

1. **Apply `competitor-analysis` to the alternatives.**
2. **Apply `market-segments`, then `beachhead-segment` while the segment is open.**
3. **Apply `value-proposition` for the chosen segment.**
4. **Apply `value-curve` against the alternatives.**

Finish by marking every claim by kind (step 3); standalone research ends there.

### 3. Mark every claim by kind

**Mark every claim's kind, source and your own inferences.** For new products, most evidence is other people's words interpreted by a fluent model. Without those marks, confident prose hides assumptions.

| Kind | Example | Used as |
|---|---|---|
| Observed fact or reported behaviour | a published price; a review saying "I export it to a spreadsheet every Friday" | evidence, with source and date |
| Owner constraint or preference | "I want to start with educators"; "no mobile app" | a decision: recorded, not argued with |
| Agent inference | "educators will pay, because they already pay for a similar tool" | marked as the agent's, with the evidence it rests on |
| Unsupported assumption | "teams will switch within a month" | named, and tested before anything rests on it |

- **Use competitor marketing as evidence of positioning.** It does not establish capabilities or customer outcomes.
- **Record owner preferences as decisions and assertions as hypotheses.** "I want this segment" records a choice. "This segment will pay" remains a hypothesis sourced only to the owner; say so in the proposal.

### 4. Check feasibility before drawing screens

**Check uncertain dependencies before drawing screens of something you cannot build.** Screens of something unbuildable waste the owner's review. Verify uncertain APIs, platform permissions, data access and costs per user that could consume the price, and say what you checked.

### 5. Propose

**Recommend the direction the evidence supports and explain why.** Show a real choice when one remains.

- **Offer one clear direction or two or three real alternatives.** Use one when the evidence clearly favours it. For a real choice, give two or three with trade-offs, since invented alternatives hide the recommendation.
- **Explain each direction's audience, value proposition, scope and advantage over alternatives.** State what its first version does and deliberately leaves out.
- **Weigh each first-version part's visible value against its cost.** Put visible, cheap parts early: a landing, displayed pricing and example data filling every screen. Add hard logic once the product is worth it.
- **Name the weakest assumption that could change the recommendation.** Identify the consequential assumption, since a shaky detail that changes nothing can wait even if it is the weakest overall.
- **Recommend one direction and give the reason.** Make the choice explicit in the artifact.

### 6. Build what the owner reviews, interface first

**Build one self-contained HTML page with research, decisions and key screens.** The page opens from its file without a server or build, with its sections in this order:

1. Research, marking every claim by kind and source (§ 3).
2. Alternatives.
3. Segment.
4. Value proposition and value curve.
5. Recommendation (§ 5), with its impact-and-effort grid.
6. Jobs map.
7. Key screens.
8. Open decisions.
9. Hypotheses, including the weakest consequential assumption and its experiment.

- **Map jobs before drawing one high-fidelity screen per key job.** Number each job in the user's words, naming its screen, the question that screen answers and its primary action. Each screen shows its job's number and realistic sample data labelled as such. When replacing a familiar tool, start from its structure and justify departures.
- **Apply `ui-design` before drawing screens and check screenshots against its method.** Read the method first, with `app-stack` installed, or use the jobs map, `frontend-design` direction, token values and a checked screenshot without it. Embed and compose an existing kit's CSS inside the HTML. For new products, choose one subject-grounded direction and keep values in tokens. Where the method is present, check screenshots against it before the owner sees them.
- **Agree on static or clickable screens and build no separate prototype.** The person and agent choose together. The first working version takes hours and tests the full flow.
- **Choose chart forms first and inspect their renders.** In Claude Code, apply built-in `dataviz` (read `2026-11-07`). In other agents, follow its rules:
  - **Choose the form first, using a number when that fits.** Sometimes a number serves better than a chart.
  - **Use one axis and legends for two or more series.**
  - **Keep colour with the entity and status colours for status.**
  - **Use text colours for text, never a series colour.**
  - **Inspect the rendered chart.**

  Draw the value curve, segment scores and impact-and-effort grid. The grid weighs § 5's first-version parts and next builds by what people will see against cost. Mark "do first".
- **Give a fresh session only screenshots and a reader's role.** Cut tall pages into ordered parts, sharing neither brief nor code with the fresh reader. Ask what the page is, what the reader would decide from it and what is unclear, then fix what they cannot explain. This checks the page itself: no app crawl or sign-in.
- **Name key screens and what to inspect before any plan.** Give the owner that preview.
- **Define the customer experiment and what would change the recommendation.** Include hypothesis ID, participants, task, observed behaviour and the decisive result. Building the first version and putting it before paying users is often the experiment.

### 7. Ask only what the evidence can't decide

**Keep questions in the artifact and record every answer durably.** Ask only the few questions evidence cannot decide, about the owner's values, segment or scope. Put each in open decisions with options, a recommendation and its reason.

**Support both saved page picks and choices copied into chat.** Where the host saves viewer picks, let the person pick on the page and read those picks next iteration. Claude.ai artifacts can save picks (read `2026-11-07`). For local files and other hosts without saved picks, provide a button copying choices as text for chat; direct chat answers also work. The same file supports both paths.

**Write each pick into HTML and the decision log immediately.** Do this in the same turn whichever way it arrives, then republish. Host-only page storage loses choices to the next session and other agents.

**Ask these questions only here and keep decisions with the owner.** If work has an owner's page, apply `flight-deck` and link from that page to the questions. (The author's preference, as an example to replace with your own: "a person talking to Claude", `2026-11-07`.) The owner may share the page like any other; the decisions remain theirs.

### 8. Write the record

**Keep the HTML file as the one durable proposal record.** Use the repository's existing location, else `docs/product/proposal.html`, and read `references/proposal.md` for its sections, keeping key screens inside the record. Create no Markdown duplicate; restating the record elsewhere loses decisions.

**Publish from the HTML file and republish it each iteration.** Where the host publishes pages, keep the published page aligned with this file; in Claude, publish a claude.ai artifact (observed `2026-11-07`).

| Record | Holds |
|---|---|
| The proposal artifact | research with claim kinds and sources, alternatives, segment, value proposition and curve, jobs, screens, decisions, hypotheses and experiments |
| The brief (or the product's refined idea) | the accepted intent and use cases |
| The decision log, if there is one | the choices made, their reasons, what would reopen them |

**After acceptance, reuse a proposal that already serves as the brief.** After owner acceptance, update the brief and decision log where needed, linking the artifact as evidence. When the accepted proposal already serves as the brief, keep it as that record. For SaaS, apply `app-lifecycle` with the accepted artifact.

**Plan complex changes next, opening with assumptions the owner must review.** After acceptance, the next step for a complex change in any product is a plan. Explain what the ask means in this product, any wrong number or word the owner supplied, and what needs their decision.

**Put visible changes and open choices on the review page.** Use this page or a new one in the same form, showing key assumptions, high-fidelity screens of changed flows, then choices picked as § 7 describes. Keep the builders' part in the repository's plan: phases, files each changes, tests and acceptance criteria. Name tests touching production, its users or its data; run them only with the owner's go.

## Running it again, once people have used it

**Rerun the proposal using what real users did and paid for.** Collect what they used, returned to and abandoned, and record its origin: analytics, payments, support or interviews.

- **Update and republish the same HTML file with one current recommendation.** Append evidence, update conclusions, and place each dated observation under the hypothesis it bears on, by ID. Update each hypothesis's status: supported, weakened, refuted or untested. Replace the recommendation; keeping old and new together leaves the builder choosing between them.
- **Count reported past behaviour as evidence and future intentions as hypotheses.** What people say they did counts, while what they say they would do needs testing again.

Each rule's origin, the case that taught it, is in `receipts.md` beside this file; read it when a rule's edge is unclear.

## How you can tell it worked

**Confirm the owner knows claim sources and the hypothesis first users test.** They saw key screens before planning, chose on the page or in chat, answered only questions they could decide, and know what result changes the plan.

## Files

**Read the proposal sections when writing or updating the record.**

| File | Holds | Read when |
|---|---|---|
| `references/proposal.md` | the proposal's sections, the hypothesis table and the observation log, as HTML page sections | writing or updating the record |
