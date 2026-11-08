---
name: app-lifecycle
description: "Planning a SaaS stage, 'what's next', 'where are we', calling a stage done: the detailed path from an idea to production, each stage with its done-when."
---

# App lifecycle — from an idea to a product in production

**Start at the first stage whose done-when remains open.** This is the detailed SaaS path: each stage names its output, completion evidence and the skills explaining how to build it. Knowing the stage tells the agent what to build, what to defer, what done means and what to propose next.

**Discovery and key screens come from the `propose` skill.** Its accepted artifact supplies stages 0–1's input. For any product, type `/product:start-here` (Codex: `$product:start-here`) for the same lifecycle in eight steps without the stack. Those steps are start, proposal, a plan for a complex change, build with reviews, owner click-through, release review, release and real users. Start at the first stage whose done-when remains open.

**Keep the stage principles and substitute your stack's vendor mechanisms.** The order, done-whens and rules holding at every stage are general. The mechanisms use Next.js (App Router), Supabase Postgres, Clerk and Netlify, with Vitest and Playwright.

## What binds, in order

1. **Keep product, design and release decisions with the owner.** The owner decides what the product is, picks between options, approves the design, tries each stage and says go to a release. The agent proposes, builds and supplies evidence.
2. **Follow the product's plan while preserving design and front-door ordering.** Its phases, and each stage's done-when, are the product's. These stages are defaults a plan may merge, split or reorder, except in two ways: design is never dropped for screens (a plan that does setup first still runs the design stage, with its artboards, before any app screen is built), and the front door (its block C) never moves behind the product's further feature phases (§ Order the work by what the owner will see).
3. **Read every stage through the product section of the agent instructions.** Above all, follow its declared shape (below); its scope and data constraints apply too. Wherever this skill names something the shape says the product does not have, the shape wins and that part is skipped.
4. **Use this skill's defaults and each stage's named implementation skills.**

## Find the stage you are in

| # | Stage | What it produces | Done when |
|---|---|---|---|
| 0 | Brief *(optional)* | the product section of the agent instructions (short; the shape declared) and the brief; what the idea leaves open becomes open entries in the decision log | the owner recognises the product in the product section |
| 1 | Screen options *(optional)* | open options on screens in the `propose` artifact; picks in the decision log | every decision the artifact covers has a pick |
| 2 | Design | the jobs map (each user job, its screen, that screen's one question and its primary action), the kit (tokens, primitives, the kit's README) and artboards for the first screens: two directions to pick from, or an existing design adopted; `app-stack` installed in every agent that builds screens | the owner approves the artboards, every raw value lives in the tokens, and every builder loads the method from its installed pack |
| 3 | Screens on sample data | the first screens, built from the kit, with sample data that fills every screen, behind the seams the real system will use, and the front door's screens with them (the landing at `/`, pricing on display where the product bills, and placeholder legal pages). The member's main screen sits at its own route, the member home, never at `/`. No database, no sign-in | the walkthrough, rendered pass, app-screen screenshot critique and scored audit passed (the `ui-design` skill, P0 and P1 fixed), then the owner approved the look and clicked through every state at phone and desktop width |
| 4 | Setup | the identity provider's app (organizations on, in the organization shape), a development database project, the CLI reaching it by its connection string (never linked), the keys in `.env` | the app boots on the development keys |
| 5 | The first real slice | sign-in landing on the member home, which sends a signed-out visitor to sign-in and back; workspaces, the first migration, the member's own resources, and the public surface if there is one | two members of different workspaces can't see each other's data, and the stage's tests and docs landed with it |
| 6 | Browser proof | the authenticated browser suite and the permission matrix | the gate, including the authenticated mile, is green on the agent's own run |
| 7 | Publish | the repository, the first deploy with its environment, `/health`. The URL is shared with nobody yet. From here, every push to the product branch is a deploy | the deployed `/health` reports the database |
| 8 | The front door, roles and plans | the landing at `/` and the legal pages made true, the same for every visitor and reading no session; the second role and plan limits where the shape has them; pricing where the product bills | a stranger could sign up and see true legal pages, their text approved by the owner, and every capacity derives from the plan module |
| 9 | Go live | production resources and the production branch, with the custom domain on the production site; the first release, reviewed over the whole product | the production URL serves the reviewed commit, every runtime beside the app runs production's build on production's keys, `/health` answers ok, the served pages carry the identity provider's production publishable key (`pk_live_` on Clerk), a stranger can sign up on a phone with legal consent shown and that account is read back in production's identity instance and database, every token belongs to one environment, is scoped and recorded, the time-boxed ones revoked and the identity provider's CLI signed out, and production's secret keys made for the setup are deleted, or, where it used production's own, those are rotated (`environments`, `references/domain-and-provider-access.md` § Before the first users), nothing sold is unbuilt (production billing waits until that holds), the legal pages match the code, their test green and their text approved by the owner (`legal-pages`), no doc still describes production as unbuilt, the environment record holds the verified production mapping (the same list as `release-gate`'s go-live) |
| 10 | Every release after | the checklist, the review, the audits proposed on the release's changes, promotion, the checks after it | the post-promotion checks pass |
| 11 | What comes next | the agent proposes the next capability when its trigger fires; once people use the product, the `propose` skill runs again with what they did; the next phases go into the plan | — |

**Skip stages 0–1 when the accepted proposal settled brief and options.** Keep accepted intent and use cases in the brief, linking the artifact as evidence rather than restating it. Every other stage applies to any product through its shape: **a part of a stage the shape does not have is skipped, never the stage.** Later phases depend on the product, so nothing after the front door has a default stage.

**Find the first stage whose done-when does not hold.** When the plan's status is missing or stale, check the code, deploy and gate, never a handoff's claim. An inherited report is a claim.

Each stage in depth — what doing it well looks like, the owner's part, the traps, and the skill that holds the how — is `references/stages.md`.

## Order the work by what the owner will see

**Order every stage and phase by visible value against cost.** Weigh what the owner and first users will see. **The visible, cheap first versions come early.** Start with landing, placeholder legal pages, displayed pricing and example data filling every screen. **Hard logic comes once the product is worth it.** This includes concurrency-safe billing, adaptive sampling and work taking repeated review rounds.

**Build front-door screens with the first screens on sample data.** From the first click-through, the owner judges the whole product: landing, pricing, legal pages and footer. Make the landing and legal pages true in stage 8, block C, before any further feature phase.

**Split stage 8 when needed without delaying its front-door block C.** Billing, its pricing page and concurrency-safe limits may wait until the product is worth it. Until then, public pages name no price: sample prices never reach a stranger. When the owner already runs a product on the same stack, look for its front door first and start from it.

## What holds at every stage

These hold within every stage, never as a separate task:

- **Tests and docs land with the change.** A bug fix lands with a test that fails before the fix; every doc line the change made false is corrected in the same change.
- **A stage is done when its done-when holds and its own gate passes on the agent's own run.** When the stage changes what a person sees, it is done only once the owner has tried it. Send a link and a short list of key user flows, each an action and its expected result. Then state what is not built yet and the stage that brings it. A stage that adds or changes screens reaches the owner only after the newcomer walkthrough, rendered-screen pass, and app-screen screenshot critique at 1440/768/390 (three rounds at most), with the scored audit where the `ui-design` skill calls for one (the `ui-design` skill; its local checklists work without the collections). The owner approves the look, and what they find is fixed in the same stage. Stage 3's click-through is the first such preview of the running app. How to send one: the `release-gate` skill (the owner's preview) and the `environments` skill (showing development to the owner).
- **Review everything added before any deploying push, from stage 7 on.** Use an independent review round: a fresh session that never saw the build, with or without a dedicated reviewer CLI (the `independent-review` skill). A production promotion in stages 9–10 also needs the full release checklist; apply `release-gate`.
- **Propose static release audits; never run them unasked.** Propose security and performance audits on the release's changes (the `security-audit-static` and `performance-audit-static` skills) — over the whole repository only on the first release, after a large refactor, or when the owner asks. They sit beside the independent review, never instead of it.
- **Never delegate product decisions, real-system actions or the judgement that a stage is done.** The session agent coordinates and judges. A builder agent builds a stage from its brief when one is available (the `codex-agents` and `delegation` skills); without one, or while it is out of usage, the session agent builds the stage itself and the plan's line for the stage is its brief. A fresh independent reviewer reviews. Deciding what the product does, accepting a review finding, anything that touches a real system (development included: a deploy, a migration on any database, a worker and its secrets) and the judgement that a stage is done never delegate.

## Declare the shape before anything is built

**Declare four shape switches and the member-home route before building.** Put them in the product section at the brief stage; every later stage reads them (`references/product-shapes.md`):

- **Choose the organization or individual workspace model.** Use *organization* (the default: every workspace is an organization, a solo user an organization of one, roles inside it) or *individual* (the workspace row keyed to one user: no organizations, no second role).
- **Declare identity-provider billing or none.** Use *the identity provider's billing* (the default; on this stack Clerk Billing, the workspace pays) or *none*. Billing in the individual shape has not been built and proven yet, so an individual product declares *none* until a product writes and proves that recipe.
- **Declare whether visitors can act without an account.** Set anonymous public to yes or no.
- **Declare whether the product embeds agents.** Set embedded agents to yes or no.
- **Declare the member-home route where sign-in lands.** Use `/dashboard`, or the product's own noun.

**Record every reopened default and the trigger that fired.** Name its replacement and the dated decision-log entry with options and reasoning. If none changed, say so in one line.

**Skip only the parts excluded by the declared product shape.**

- No anonymous public skips anonymous-token authorization, its cookie secret, the anonymous half of the public browser journey and the public-surface edge rule.
- Individual skips organizations at setup, the organization half of the harness, the second role and organization management.
- No billing skips plan limits, every entitlement and all pricing: no table, page, link or plan copy on the landing.
- No surface changing while a person watches skips the polling feed.
- No embedded agents skips everything about agents.

## The defaults a new product proposes rather than re-derives

**Propose the defaults until a recorded trigger reopens a choice.** Record the trigger in the product section. A default does not claim implementation. Read `references/default-choices.md` before reopening one; it holds each full rule, reason, receipt and reopen condition.

- **Every workspace is an organization by default.** Reopen: a product for individual users declares the individual shape.
- **Keep organization management in the identity provider's own modal.** Reopen: never.
- **Use the billing provider's table and one billing configuration file.** Keep plans and prices in that file, applied by the provider's CLI and read back by a test. Derive capacities from one plan module; no currency literal in app code. Reopen: the landing prints its own plan cards from that file when the provider's signed-out table can't show what a plan sells, and always, where it shows plans, once it carries the analytics tag (`product-analytics`).
- **Use one native top-layer primitive for dialogs and popovers.** Reopen: never.
- **Read the first-party theme cookie on the server.** Reopen: one palette skips the second token set, not the tests.
- **Use file-based share images and assert them on the raw response.** No page declares its own share-card keys. Reopen: never.
- **Use polling, not realtime.** Reopen: when the five-second delay is the complaint.
- **Use two POST-only per-IP edge rules, one per surface.** Reopen: no public `POST` surface needs one.
- **Propose external monitoring after go-live, including every other runtime.** Monitoring is `/health` plus an external monitor, proposed once go-live's done-when holds, on Staygreen (made by this collection's author; open the `uptime-monitoring` skill's adapter before proposing an account), and an outside check on every other runtime — Reopen: the service, when the owner already uses another; extend when error tracking arrives. A public status page is the default the owner confirms before one is created.
- **Run behaviour analytics cookieless and keep it off without a project id.** Reopen: any non-essential cookie brings the banner.
- **Keep the front door session-free and give members their own home.** Reopen: never for the session read.
- **Write legal pages before the first stranger is asked for anything.** Reopen: check the promises whenever the behaviour changes.

## After the first release, the next step is proposed

**The agent proposes a capability when its trigger fires, and the owner says go.** Default stages reach the first release. The rest is proposed, not pasted. Prerequisites can fire earlier: legal pages do not wait for release. When planning any phase, read the capabilities and propose every row whose trigger has fired. Rows do not claim implementation; the product records actual connections while building. Email, scheduled jobs and an API for outside agents are capabilities, not stages.

| Capability | Propose it when |
|---|---|
| Uptime monitor + status page (the `uptime-monitoring` skill; Staygreen by default, made by this collection's author) | once go-live's done-when holds; the status page linked from the footer, for example, in a change of its own |
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
| Plan | the phases and stages, each with its done-when; the status lives here | `references/plan.md` |
| Decision log | dated decisions that had real options; open questions as open entries | `references/decisions.md` |
| Strategy *(optional)* | direction, only once the owner has confirmed it | `references/strategy.md` |
| Stage brief | what a builder is handed for one stage, what it can finish in its own sandbox, and what the stage is judged against | `references/stage-brief.md` |

**Let the product choose where its documents live.** One layout that works:

- `docs/product/` for brief, plan, decision log and strategy.
- `docs/work/<stage>.md` for a stage brief in flight, moved to an archive folder when done.
- Release history and backlog beside them; each deferred backlog item has its reopen trigger.
- The product section as its own section in the agent instructions file.

Apply `shipping-artifacts` for architecture, permissions, flows, variables and the coverage map. Apply `agent-instructions` for the instruction file and how to keep it lean.

## Driving the path

**Example prompts are one way to drive it.** Tell the agent what you want to build; it follows these stages. Each can locate the agent in the lifecycle without prescribing its job, because the instructions already hold the how. A product can follow this skill without those prompts. These habits carry to every product:

- **Stop at the decision.** A stage that offers options (two design directions, a one-page plan, open questions) stops and lets the owner pick before building on it.
- **From the first real slice on, the working mode is a flat list.** List what is wrong or missing. Each item says what should happen, rather than how to build it.
- **Project the plan's status through `flight-deck` for owner progress reports.** "Where are we" and status decks use its files and the owner's page, never a separate account.

**Name the owner's dashboard steps at the five stages needing them.** The agent cannot make those clicks; each stage says which and why:

- Setup: the identity provider's application, development database project, keys, database connection string and the scoped access token where the agent gets a database connection for looking.
- Browser proof: the identity provider's test mode and a test account.
- Publish: the product's repository and the host's environment.
- Front door: the second role, identity-provider CLI sign-in for applying the billing file and sign-out after read-back, and the legal-consent switch.
- Go-live: production database project, production identity instance with social sign-in clients and legal consent, payment account, zone and nameservers, agent tokens and setup secret keys.

**An owner away from the machine can still sign a CLI in by device code.** The agent starts login and relays its link and code; the owner approves on their phone.

## Why the stages are in this order

**Build design and sample-data screens before requiring accounts and keys.** Neither needs them, so newcomers reach a running app before signing up. The two services are easier to explain once a screen needs them. Sample screens use the real system's seams, so they survive the database's arrival. Browser proof and publishing close the first slice. An unread permission matrix hides bugs, and a deploy never performed has not been proven to work.

Each rule's origin, the case that taught it, is in `receipts.md` beside this file; read it when a rule's edge is unclear.

## How you can tell it worked

The agent can name the current stage and its missing completion evidence from code, deploy and gate rather than a status line. Nothing it built belongs to a later stage.

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
- **Date what a platform did or required.** Vendors change without notice; correct the line, never leave the old one beside it.
- **Stage mechanics usually belong in the skill the stage points to.** A lesson about how to do a stage usually belongs there, not here.
