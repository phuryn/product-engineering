---
name: app-lifecycle
description: "Planning a SaaS stage, 'what's next', 'where are we', calling a stage done: the detailed path from an idea to production, each stage with its done-when."
---

# App lifecycle — from an idea to a product in production

The detailed path for a SaaS, by stage. Each stage says what it produces and when it is done; how to build it lives in the skills each stage points to. An agent that knows which stage it is in knows what to build, what not to build yet, what *done* means, and what to propose next.

The same lifecycle for any product, in eight steps and without the stack (start, proposal, a plan for a complex change, build with its reviews, the owner's click-through, the release review, release, real users), is what the owner gets by typing `/product:start-here` (Codex: `$product:start-here`). **Discovery and the first prototype usually come from the `propose` skill**: when its accepted proposal and prototype exist, they are stages 0 and 1's input, and the path starts at the brief or at design.

The path was learned building SaaS products with coding agents on **Next.js (App Router) + Supabase Postgres + Clerk + Netlify**, tested with Vitest and Playwright. A live Q&A product walked every stage first; a monitoring product and several others followed. The order, the done-whens and the rules that hold at every stage are general. Where a stage names a vendor, read the principle first and the vendor second, and substitute your own stack's equivalent.

## What binds, in order

1. **The owner.** The owner decides what the product is, picks between options, approves the design, tries each stage and says **go** to a release. The agent proposes, builds and supplies evidence.
2. **The product's own plan.** Its phases, and each stage's done-when, are the product's. These stages are defaults a plan may merge, split or reorder.
3. **The product section of the agent instructions**, above all the shape it declares (below). Wherever this skill names something the shape says the product does not have, the shape wins and that part is skipped.
4. **This skill's defaults**, and the skills each stage points to for the how.

## Find the stage you are in

| # | Stage | What it produces | Done when |
|---|---|---|---|
| 0 | **Brief** *(optional)* | the product section of the agent instructions (short; the shape declared) and the brief; what the idea leaves open becomes open entries in the decision log | the owner recognises the product in the product section |
| 1 | **Prototype** *(optional)* | one interactive HTML prototype comparing the open options; the picks recorded in the decision log. No app code | every open decision the prototype covers has a pick |
| 2 | **Design** | the kit (tokens, primitives, the kit's README) and artboards for the first screens: two directions to pick from, or an existing design adopted | the owner approves the artboards, and every raw value lives in the tokens |
| 3 | **Screens on sample data** | the first screens, built from the kit, with sample data behind the seams the real system will use. The member's main screen sits at its own route, the member home, never at `/`. No database, no sign-in | the owner clicks through every screen state at phone and desktop width |
| 4 | **Setup** | the identity provider's app (organizations on, in the organization shape), a development database project, the CLI linked, the keys in `.env` | the app boots on the development keys |
| 5 | **The first real slice** | sign-in landing on the member home, which sends a signed-out visitor to sign-in and back; workspaces, the first migration, the member's own resources, and the public surface if there is one | two members of different workspaces can't see each other's data, and the stage's tests and docs landed with it |
| 6 | **Browser proof** | the authenticated browser suite and the permission matrix | the gate, including the authenticated mile, is green on the agent's own run |
| 7 | **Publish** | the repository, the first deploy with its environment, `/health`, the uptime monitor (the `uptime-monitoring` skill). The URL is shared with nobody yet. **From here, every push to the product branch is a deploy** | the deployed `/health` reports the database, and an outside monitor on it is green |
| 8 | **The front door, roles and plans** | the landing at `/` and the legal pages, the same for every visitor and reading no session; the second role and plan limits where the shape has them; pricing where the product bills | a stranger could sign up and see true legal pages, their text approved by the owner, and every capacity derives from the plan module |
| 9 | **Go live** | production resources and the production branch, with the custom domain on the production site; the first release, reviewed over the whole product | the production URL serves the reviewed commit, every runtime beside the app runs production's build on production's keys, `/health` answers ok, the served pages carry the identity provider's production publishable key (`pk_live_` on Clerk), a stranger can sign up on a phone with legal consent shown and that account is read back in production's identity instance and database, every token belongs to one environment, is scoped and recorded, the time-boxed ones revoked and the identity provider's CLI signed out, and production's secret keys made for the setup are deleted, or, where it used production's own, those are rotated (`environments`, `references/domain-and-provider-access.md` § Before the first users), nothing sold is unbuilt (production billing waits until that holds), the legal pages match the code, their test green and their text approved by the owner (`legal-pages`), no doc still describes production as unbuilt, the environment record holds the verified production mapping (the same list as `release-gate`'s go-live) |
| 10 | **Every release after** | the checklist, the review, the audits proposed on the release's changes, promotion, the checks after it | the post-promotion checks pass |
| 11 | **What comes next** | the agent proposes the next capability when its trigger fires; once people use the product, the `propose` skill runs again with what they did; the next phases go into the plan | — |

Stages 0–1 are optional and skipped whole when the brief and its options already exist, an accepted proposal and its prototype included: the brief then takes the accepted intent and use cases from the proposal and links it as their evidence, rather than restating it. Every other stage applies to any product, read through its shape: **a part of a stage the shape does not have is skipped, never the stage.** Nothing after the front door has a default stage, on purpose: what later phases hold depends on the product.

**When the plan's status is missing or stale, the stage you are in is the first one whose done-when does not hold** — checked against the code, the deploy and the gate, not against a handoff that says so. An inherited report is a claim.

Each stage in depth — what doing it well looks like, the owner's part, the traps, and the skill that holds the how — is `references/stages.md`.

## What holds at every stage

These are never a separate task:

- **Tests and docs land with the change.** A bug fix lands with a test that fails before the fix; every doc line the change made false is corrected in the same change.
- **A stage is done** when its done-when holds and the gate is green **on the agent's own run** — and, when it changes what a person sees, once the owner has tried it from a link and a short list of the key user flows to try, each an action and what should happen. What the owner finds is fixed in the same stage. Stage 3's click-through is the first such preview. (`2026-10-22`, a monitoring product: ten minutes of its owner using a preview found six problems no review had.) How to send one: the `release-gate` skill (the owner's preview) and the `environments` skill (showing development to the owner).
- **Before any push to a branch that deploys** — from stage 7 on — an independent review round covers what the push adds: a fresh session that never saw the build, with or without a dedicated reviewer CLI (the `grok-agents` skill). **A promotion to production** (stages 9–10) also needs the full release checklist (the `release-gate` skill).
- **At a release the agent proposes, and never runs unasked**, static security and performance audits on the release's changes (the `security-audit-static` and `performance-audit-static` skills) — over the whole repository only on the first release, after a large refactor, or when the owner asks. They sit beside the independent review, never instead of it.
- **Who does what.** The session agent coordinates and judges. A builder agent builds a stage from its brief when one is available (the `codex-agents` and `delegation` skills); without one, or while it is out of usage, the session agent builds the stage itself and the plan's line for the stage is its brief. A fresh independent reviewer reviews. Deciding what the product does, accepting a review finding, anything that touches a real system (development included: a deploy, a migration on any database, a worker and its secrets) and the judgement that a stage is done never delegate.

## Declare the shape before anything is built

Four switches and one route, declared in the product section at the brief stage, read by every stage after (`references/product-shapes.md`):

- **Workspace model** — *organization* (the default: every workspace is an organization, a solo user an organization of one, roles inside it) or *individual* (the workspace row keyed to one user: no organizations, no second role).
- **Billing** — *the identity provider's billing* (the default; on this stack Clerk Billing, the workspace pays) or *none*. Billing in the individual shape has not been built and proven yet, so an individual product declares *none* until a product writes and proves that recipe.
- **Anonymous public** — yes or no: visitors who act without an account.
- **Embedded agents** — yes or no.
- **Member home** — the route sign-in lands on: `/dashboard`, or the product's own noun.

Then the **reopened defaults**: each default choice this product changes, the trigger that fired, what replaces it, and the dated decision-log entry that holds the options and reasoning. If it changes none, say so in one line.

What each shape skips, in one line each: **no anonymous public** skips the anonymous-token half of authorization, its cookie secret, the anonymous half of the public browser journey and the public-surface edge rule. **Individual** skips organizations at setup, the organization half of the harness, the second role and organization management. **No billing** skips plan limits, every entitlement, and all pricing — no table, no page, no link, no plan copy on the landing. **No surface that changes while a person watches** skips the polling feed. **No embedded agents** skips everything about agents.

## The defaults a new product proposes rather than re-derives

A new product proposes these until it records, in its product section, that a choice's trigger fired. A default is not a claim that the product has it built. Each one's full rule, reason, receipt and reopen condition is in `references/default-choices.md` — read it before reopening one.

- Every workspace is an organization — **reopen:** a product for individual users declares the individual shape.
- Organization management is the identity provider's own modal — **reopen:** never.
- Pricing is the billing provider's own table; plans and prices in one billing file the provider's CLI applies and a test reads back; capacities from one plan module; no currency literal in app code — **reopen:** the landing prints its own plan cards from that file when the provider's signed-out table can't show what a plan sells, and always once it carries the analytics tag (`product-analytics`).
- One native top-layer primitive for dialogs and popovers — **reopen:** never.
- Theme is a first-party cookie read on the server — **reopen:** one palette skips the second token set, not the tests.
- No page declares its own share-card keys; file-based images, asserted on the raw response — **reopen:** never.
- Polling, not realtime — **reopen:** when the five-second delay is the complaint.
- Two per-IP edge rules, `POST` only, one per surface — **reopen:** no public `POST` surface needs one.
- Monitoring is `/health` plus an external monitor, and an outside check on every other runtime — **reopen:** never; extend when error tracking arrives. A public status page is the default the owner confirms before one is created.
- Behaviour analytics run cookieless, off without a project id — **reopen:** any non-essential cookie brings the banner.
- The front door reads no session; members have their own home — **reopen:** never for the session read.
- Legal pages before the first stranger is asked for anything — **reopen:** check the promises whenever the behaviour changes.

## After the first release, the next step is proposed

The default stages carry a product to its first release. From there **the agent proposes a capability when its trigger fires, and the owner says go**; the rest of the product is proposed, not pasted. A prerequisite can fire earlier — legal pages do not wait for release, and the uptime monitor fires at the first deploy. When planning any phase, read the capabilities and propose every row whose trigger has fired. A row is not a claim of implementation: the product records what is actually connected as it builds. Email, scheduled jobs and an API for outside agents are capabilities, not stages.

| Capability | Propose it when |
|---|---|
| Uptime monitor + status page (the `uptime-monitoring` skill) | immediately after the first deploy; re-point at go-live |
| Edge flood limits | the first deploy is done and a public `POST` surface exists |
| Legal pages + legal consent at sign-up (the `legal-pages` skill) | before the first stranger is asked for anything (with the front door) |
| Share cards + icons | any public page that will be pasted into a chat — the front door is one |
| Behaviour analytics, cookieless (the `product-analytics` skill) | a landing page exists and the privacy page can promise it |
| Error tracking | the first real users, or the first 500 nobody saw |
| Production branch + release procedure | the first release to a real audience |
| Hosted CI gate | at go-live, or when a second person pushes to the product branch — as its own change |
| Transactional email | a flow must reach someone outside the session |
| Deletion webhooks + personal data | before the first paying customer, or the first deletion request |
| Retention / purge job | the first promise about retention on a legal page |
| API tokens | the phase that gives an outside agent access |
| Remote MCP server with OAuth | an outside agent should act as a member and a pasted token is the friction, or a directory requires OAuth |
| Public companion repository | the first public page that needs a place to report a bug, or the MCP package |
| Realtime | when polling's delay is the complaint, not before |
| Embedded agent deployed | the first agent that must leave localhost |
| Proxy WAF + origin seal | blocked until a host that accepts a proxy is chosen |

What each is, the owner's part, how to propose one and where its how lives: `references/capabilities.md`.

## The documents a product keeps

| Document | What it is for | Template |
|---|---|---|
| Product section of the agent instructions | what every session needs about the product: what it is, users, the shape, who can do what, scope, data constraints, three status lines | `references/product-section.md` |
| Brief | segments, value propositions, jobs, use cases: the depth behind the product section | `references/brief.md` |
| Plan | the phases and stages, each with its done-when; **the status lives here** | `references/plan.md` |
| Decision log | dated decisions that had real options; open questions as open entries | `references/decisions.md` |
| Strategy *(optional)* | direction, only once the owner has confirmed it | `references/strategy.md` |
| Stage brief | what a builder is handed for one stage, what it can finish in its own sandbox, and what the stage is judged against | `references/stage-brief.md` |

Where each document lives is the product's choice. One layout that works: `docs/product/` for the brief, plan, decision log and strategy; `docs/work/<stage>.md` for a stage brief in flight, moved to an archive folder when the stage is done; a release history and a backlog (deferred work, each item with the trigger that reopens it) beside them; and the product section as a section of its own in the agent instructions file.

The rest of a product's docs — architecture, permissions, flows, variables, the coverage map — are the `shipping-artifacts` skill's; the instruction file itself, and how to keep it lean, is the `agent-instructions` skill's.

## Driving the path

Tell the agent what you want to build; it follows these stages. **Example prompts are one way to drive it**: a set of prompts walked a live Q&A product through stages 0–8, one per stage. Each told the agent *where it sat in the lifecycle*, not how to do its job, because the instructions already held the how; a product can follow this skill without them. Two habits from them carry to every product:

- **Stop at the decision.** A stage that offers options (two design directions, a one-page plan, open questions) stops and lets the owner pick before building on it.
- **From the first real slice on, the working mode is a flat list** of what is wrong or missing, each item saying what should happen rather than how to build it.

Five stages need the owner in a dashboard, because the agent cannot make those clicks: setup (the identity provider's application, the development database project, their keys, the scoped access token), browser proof (the identity provider's test mode and a test account), publish (the product's repository, the host's environment, the monitoring service's account and its alert channels), the front door (the second role, signing the identity provider's CLI in so the billing file can be applied and out once it is read back, the legal-consent switch), and go-live (the production database project, the production identity instance with its social sign-in clients and legal consent, the payment account, the zone and its nameservers, the agent's tokens and the setup's secret keys). Each stage says which clicks and why.

## Why the stages are in this order

Design and the screens come first on purpose: neither needs an account or a key, so anyone new to the stack gets to a running app before anyone signs up for anything — and the two services are easier to explain once there is a screen they serve. Screens built on sample data stay behind the seams the real system will use, so they survive the database's arrival. Browser proof and publishing close the first slice: a permission matrix nobody has read is where the first real bug hides, and a deploy that has never happened is not a deploy that works.

## How you can tell it worked

The agent can name the stage the product is in from the code, the deploy and the gate rather than from a status line, and what would make that stage done; and nothing it built belongs to a later stage.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/stages.md` | each stage: what it produces, done-when, doing it well, the owner's part, the traps, where the how lives | entering a stage; planning one; saying one is done |
| `references/product-shapes.md` | the shape declarations, what each shape skips and why, the proven individual-shape recipe | the brief stage; any stage whose part the shape may skip |
| `references/default-choices.md` | the stack, and each default choice with its rule, reason, receipt and reopen condition | proposing a design or architecture; before reopening a choice |
| `references/capabilities.md` | every capability: what it is, its trigger, the owner's part, where the how lives; how to propose one | planning a phase; after the first release; "what's next" |
| `references/product-section.md` · `brief.md` · `plan.md` · `decisions.md` · `strategy.md` · `stage-brief.md` | what each document is for, its rules, and a skeleton to copy | writing or updating that document |

## When something is learned

- **This skill is general and will be published.** A product appears in it only as an example, named by kind. What is true of one product — its stages, statuses, receipts — goes in that product's own plan and history.
- **Date what a platform did or required**, because vendors change without notice; correct the line, never leave the old one beside it.
- A lesson about *how* to do a stage usually belongs in the skill that stage points to, not here.
