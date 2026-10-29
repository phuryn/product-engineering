---
name: release-gate
description: "Before 'push it', 'ship it', a deploy, release or go-live, or calling a stage done: the gate, the owner's preview, go/no-go, promote, prove it serves, roll back."
---

# Release gate — how a change ships

A release is a decision: **the owner says go; the agent supplies the evidence.** This skill is what the evidence has to be at each moment of shipping, how a promotion is done, and how to prove afterwards that the build serving is the one that was reviewed.

The rules come from two kinds of product, named here only by kind. **The web-app half** — the bars, the preview, the promotion checklist, go-live, the verify probes, Netlify's edge — was learned on Next.js (App Router) + Supabase + Clerk + Netlify, with Vitest and Playwright, by several products (a live Q&A product, a monitoring product with worker boxes and edge workers beside its web app, and others). **The client+backend half** — any release as one logged checklist, the backend before the client, artifacts and store listings, issues — was learned on a remote-control product: a relay service with a web client, and an editor extension with desktop installers that drives a CLI agent (`references/runbook.md`). Each rule states its principle first and the stack's mechanism second; on another stack, keep the principle and swap the mechanism. **The product's own instructions come first**: where its agent instructions or release doc name the branches, the gate, the backlog or the record files, follow them. What follows is the default where they say nothing.

## Two branches, named once

- The **product branch** (`<product>`) is where stage work lands.
- The **production branch** (`<product>-prod`) is what the host deploys to production. It moves only by fast-forward, after the local gate, the independent review and the owner's **go**.

Write the real names into the product's release doc at the first push, and nowhere else. **Until the production branch exists, the host deploys the product branch itself, so every push to it is a deploy.** How branches map to environments is the `environments` skill.

## The product's records

Whatever your product calls them, this skill means: the **plan** (its stages, each with a done-when, and the one current status); the **backlog** (deferred work, each entry with its reason and the trigger that reopens it); the **coverage map** (what was verified, by which run — `test-harness`); the **integrations doc** (each provider's dashboard configuration, with screenshots); the **environments doc** (which deployment uses which database, identity instance and keys, and a dated log of environment events); the **release history** (one dated section per release). `gate`, `smoke -- <url>`, `visual` and `agents:live` are the script names this skill and `test-harness` suggest — call yours what you like.

## Three moments, three bars

| Moment | What it owes |
|---|---|
| **A stage is done** | Its done-when (in the product's plan) holds, the gate is green **on your own run**, and its tests and docs landed in the same change (`test-harness`). A stage that changes what a person sees is done only once the owner has tried it (§ The owner's preview). This is not yet the release checklist. |
| **A push to a branch that deploys** | A clean independent review round covering everything the push adds; **the push closes that round**. Before go-live the product branch is that branch: its URL is shared with nobody, so the preconditions are not yet owed — but the round is, and pending migrations are applied to development first. **"Just push it" is a go for the push it names**: name back, in one line, any of these still open rather than pushing past it. |
| **A promotion to production** | Every precondition (`references/checklist.md`), then the go/no-go, the promote and the verify. **Going live is the first promotion** (`references/go-live.md`). |

## What counts as evidence

- **Read the exit code from the log, never the notification.** A background wrapper can report exit 0 while the command inside it failed; the wrapper's code is not the command's. (`2026-09-17`, a visual sweep's log ended `VISUAL_EXIT=1` under an exit-0 notification.)
- **An inherited report is a claim, not evidence.** Re-run the gate yourself before repeating a count, and take the release subject from git, not prose. (`2026-09-16`, a verified-sounding handoff missed unapplied production migrations.)
- **The coverage map is written by whoever ran the gate, and by nobody else.** A delegated builder whose sandbox cannot reach Postgres or a browser has no passing gate to report. Read every line a delegated stage adds and rewrite the evidence from your own run, not by editing its numbers. (`2026-09-16` and `2026-09-17`, blocked builder runs were reported in the coordinator's name with invented counts.) The map's format is in `test-harness`.
- **A delegated diff is unreviewed code.** Read what comes back before believing it; the review applies to it like any other change. **What never delegates:** deciding what the product should do, accepting or rejecting a review finding, anything that touches a real system (development included: a deploy, a migration on any database, a worker and its secrets), and the judgement that a stage is actually done (`delegation`, `codex-agents`).
- **What was left out is stated, not hidden.** A precondition the owner waives is recorded as waived, never ticked.
- **A caveat is a claim about the world, and gets checked like one.** Before saying something has not happened, has not been tested or still needs doing, ask where the evidence would live if it had, and look. A caveat feels like humility, so it slips past the verify-before-you-state-it reflex — and the ones that ask the owner to do work cost the owner's time when they are wrong. (`2026-08-25`, twice in one session: "never fired on a schedule" with nineteen scheduled runs on disk, and "still needs a live connect" with the token already saved.)
- **The gate is the exit code, not the printed counts** — a run can print every test passed and still exit 1 (`test-harness`).

## The independent review — mandatory at every release

**Before every push to a branch that deploys, and again at promotion to production, however green the gate and however small the change.** The reviewer is a fresh session that never saw the build — Grok when the Grok CLI is installed (its newest model, at its highest reasoning effort), otherwise a fresh headless Claude Code session (the wrapper's fallback), read-only, with no memory carried over, and with neither CLI a fresh read-only session of the agent you are using, by hand; never the building thread, resumed or forked. It reads the unreleased diff **plus the working tree**, un-steered: no checklist, no earlier findings, no argument for the design. The subject is computed from git — round 1 the whole unreleased range, later rounds only what changed since the last, with the rest as context. Fix, re-run the gate **yourself**, review again, until a round produces **no INTRODUCED finding above Low**. Pre-existing findings go to the backlog with a reason and a revisit trigger; High and Critical are fixed now regardless of age. **Only the tools are optional; the review never is.** Running, scoping and triaging a round — the wrapper, the brief, a round that came back too short, severity, the price of a fix, what a commit and a push mean for a round — is the `grok-agents` skill. Read it before any round.

## Static audits — proposed, never run unasked

At every release the agent **proposes** the `security-audit-static` and `performance-audit-static` skills on the release's changes, and a whole-repository pass only on the first release, after a large refactor, or when the owner asks. They are steered passes **beside** the independent review, never instead of it. Their reports go under a gitignored `reports/` (a security report does not belong in the repository's history); what they find is fixed or in the backlog, and a pass the owner declines is recorded as declined. The exact ranges are in `references/checklist.md`.

**In a product whose docs are written in the change and whose coverage map is written by whoever ran the gate**, the documentation skills of `ai-shipping` are used for three things only: their document definitions (`shipping-artifacts`), the two static audits, and the `check` modes of the `document-app` and `derive-tests` skills, which write nothing and list every place docs, coverage map and code disagree. **Never their writing modes**: `document-app` and `derive-tests` without `check` rewrite the docs and the coverage map from the code, and `ship-check` does both, rewrites the agent instructions and runs its own review. A recommendation from an audit to run one is declined. If the owner asks for one by name, say what it would overwrite and offer the release path here before running it.

## Migrations: never rely on a push to apply them, or not to

Which case you are in is a setting, so the release doc names it, with the date it was read:

- **The push applies nothing to the database.** The host builds and ships code; the production database is untouched, and nothing warns you. Code that calls a function production does not have is a `500` on every affected page. (`2026-09-16`, three migrations were absent from production through a handoff that called the release verified.)
- **The push also applies migrations**, when the database provider's git integration deploys on push to the production branch — on Supabase, its GitHub integration with *Deploy to production* on applies new migration files when that branch is pushed or merged (Supabase's docs, read 2026-10-25). The build and the migration run then start together with nothing ordering them, and the provider takes every file in the migrations directory.

**How to tell:** read the integration's settings in the provider's dashboard (on Supabase: the GitHub integration under the project's integrations — its production branch and *Deploy to production*), and look at the production branch's commit checks for the provider's run. **Unread means on.** (`2026-10-24`, a monitoring product: every push to its production branch drew the provider's check against the production project, and whether that run applied migrations was a setting nobody had read.)

**Either way, one procedure:** before the go, read production's migration ledger and dry-run what is pending; after the go, apply it by CLI **before** the push, and read the ledger again, so the push finds nothing pending and nothing races the build. A file you do not intend to run never sits in the migrations directory. **Reach production through its connection string only** (`--db-url` on the Supabase CLI), leave the CLI linked to development, and never relink it. (`2026-10-23`, a monitoring product: a review round observed `db push --linked --project-ref <production ref>` write to the linked project. On CLI 2.122.0, read 2026-10-25, a probe with dummy refs saw the typed ref used for the first request, so the precedence of that pair is not something to rely on across versions; a connection string names one database on every version.) The ledger mechanics are `supabase-production`; the window where deployed code meets a newly applied schema is `environments`.

## The owner's preview

When a stage, or any change a person would see, is ready — the gate green on your own run, the independent review clean or running — send the owner **a link and a short list of what to try**. Ten minutes of the owner using the product finds what reading code does not; the owner's time is best spent there, not on code review. (`2026-10-22`, a monitoring product: through a tunnel to `next dev`, its owner found six problems no review had — placeholder examples naming the owner's own app, guessed defaults such as `/api/health` and `$.db.ok` prefilled as if they were real, both free-tier locations in Europe, an image size limit, an accent colour that did nothing visible, and a switch for a feature not built yet.)

- **The list:** the key user flows the change touches, each an action and what should happen ("Upload a 6 MB photo as the logo: the page shows it sharp"), then anything known to be missing or not verified, so the look is not spent on it.
- **The link:** the deployed development URL when hosting exists and the change is deployed there; otherwise, or to try something before it deploys, a Cloudflare quick tunnel to your `next dev`. The tunnel's address is public — development only, the link to the owner and nowhere else, tunnel and dev server stopped when the owner is done (`environments`, `references/environments-and-branches.md § Showing development to the owner`).
- **What the owner finds is fixed within the same stage.** A stage that changes what people see is not done until the owner has looked. Where a stage's done-when already names an owner click-through, this preview is how it is asked for: one link and one list, not a second request.
- It does **not** replace the exploratory pass at a promotion, which looks at every screen and state; the preview looks at what the stage changed.
- **"Ready to test" means installed on every surface the owner holds, with nothing for the owner to do first.** Where a product has several surfaces — a site that serves the latest push, an extension or app that runs the last *installed* build, a phone that loads the last *pushed* bundle — they diverge silently. Before saying ready: the gate green on your own run, the change committed, every surface the owner uses rebuilt and reinstalled or pushed, and the message says which surfaces carry what and which need a reload or a restart. Finish the batch, or hand off what is genuinely there and name its edges. (`2026-08-19`, the remote-control product: the owner tested two fixes against the previous night's build and had to ask whether they had been reinstalled.) The delegation side of the same rule is in `delegation`.

## Verify — the build serving is the one you reviewed

The checks after a promotion, in principle; the commands and the record are in `references/checklist.md § 4`.

- **First prove the new build is the one serving.** A failed build keeps the previous deploy live while the release looks landed, so every later check could pass against the old code. Read off the production response something this release both **adds** and **removes**: an addition alone can be served by a cache holding two builds; a removal cannot. Choose it from the diff, not from the landing page — content-hashed assets mean a page whose code the release did not touch serves identical bytes. Count with `grep -o … | wc -l`, never `grep -c`, which counts lines, and a production document is one line. A release that changes no served byte is **unprobeable by content**: write that down rather than quoting a generic `200`, and read the framework's build id instead, which every build replaces. (`2026-09-19` and `2026-09-21`, a live Q&A product: a chunk-hash probe that could never move, then a removal probe that could never reach zero.)
- **Then prove code and schema agree.** The ledger was read *before* the promotion, so it cannot prove the deployed code met the deployed schema. One read through an unguessable id that cannot exist settles it: a public route answering **404** with the product's own not-found went to the database and back. Anything else has not proved it: the probe is recorded as failed, and its cause is found from the error code in the body, not the status, before any production write (checklist § 4). One request, no account, no write — on every entry point that reads through the same function.
- **A push deploys one runtime; every other keeps its last bundle.** Workers, edge hosts and worker boxes that the host does not build on push run whatever they were last deployed with. After every push and every promotion, read each runtime's build identity against the tree and redeploy the ones behind. **Decide which are behind from each bundle's inputs** — a bundler's metafile against the diff since that runtime's last deploy — **never from which folders changed**: a bundle holds whatever its entry imports. **Deploy only from a clean checkout at the release branch's tip**, and make every deploy and status command refuse anything else: a promotion does not move an operator's checkout, and a "current" check compares only against the tree it runs from. (`2026-10-23` and `2026-10-24`, a monitoring product: its probes ran a build without a new check type for a day while every monitor of that type alerted; a release that changed a shared module but no probe folder left every box behind; and a deploy from a detached operator checkout shipped the previous release while its status read current.)
- **Behind a CDN, prove on a path it never caches**: a cached path can be the CDN's copy of the old origin's answer. When a release moves an origin, deploy the new target and read it ready **before** repointing DNS. (`2026-10-24`, a monitoring product moving its status-page host behind Cloudflare: review rounds found its written procedure repointing DNS before the new host read ready, and calling the move done on a script the CDN could serve from cache.)
- **A deploy can change behaviour nothing in your diff touched.** Re-verify the hardening controls after every deploy — the local gate has no edge. An unpinned host adapter is an untracked release input; when behaviour moves without a diff, ask about versions before changing code. **A transient control is worse than an absent one**, because the passing run is the one you quote. (`2026-09-17` and `2026-09-18`, identical edge configuration enforced, stopped enforcing, then enforced again.)
- **The smoke runs last**, because tripping the edge limits refuses your own address for a minute.
- **An unauthenticated smoke cannot see the authenticated mile.** After a deploy that touches sign-in, sessions, ownership or entitlements, run an authenticated canary with dedicated canary credentials. And when development runs a different identity instance from production, green on development says nothing about production's sign-in — say so.
- **For an installed client, read the installation, not the rollout's summary**: the same removal probe, run on the installed bundle (`references/runbook.md § E`).
- **Tag after the checks, never before.**

## Any release, not only a web deploy

When a release is packages, an extension, installers, store listings, or a client and the backend it talks to, run it as **one ordered list, each step with its command, its pass and its evidence, logged in the release's plan; a skip written down with its reason; the list fixed in the same pass when it proves wrong** (`references/runbook.md`). The rules that bind at the moment:

- **If a script exists for a step, use the script**; a reinvented step is subtly wrong (a hand-rolled release once attached a staging build to the public release). **And the script refuses every option it does not read**, names no target by default, and never echoes a flag's value: an ignored `--dry-run` deploys for real.
- **The backend ships first**: a client that relies on new backend behaviour is published only once that backend is in *production*; every backend release stays usable against the last published client.
- **A release is finished only when every artifact is attached** — read the asset list.
- **Publishing is not availability**: poll the store for the version, never infer from a timestamp, and never announce a listing as live.
- **Nothing unreleased is described in the present tense**, and **an issue is done only once its fix is installable** from the store its reporter uses.
- **A leak check runs on the outgoing ref**, never a bare diff, when a public repository must not carry something; then read what you push.
- **A generated listing is never hand-edited**; a test holds it equal to its generator.
- **A contributor's commits keep their authorship.**

## Never

Force-push the production branch · promote with a skipped suite, a stale doc, or an unrun local gate · run any authenticated smoke with a real user's credentials · test against production data · apply a migration through an MCP server or the dashboard · link the database CLI to production · deploy a runtime from a checkout that is not the release tip · hand-roll a step a release script encodes · infer a go from an ambiguous reply · announce a store listing as live before it serves the version.

## A promotion, in order

1. The preconditions, every box, with evidence (`references/checklist.md § 1`).
2. The go/no-go: the checklist, the evidence and one paragraph; the owner answers, in the chat. **Silence is not go** (`§ 2`).
3. Apply pending migrations by CLI through production's connection string, re-read the ledger, then promote by fast-forward (`§ 3`).
4. Verify — the build serving, code and schema, every other runtime current — then tag and record (`§ 4`).

## How you can tell it worked

The build serving production is the commit that was reviewed, checked on the live site rather than in the deploy log; the owner said go after the preview; and the checks after the promotion passed.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/checklist.md` | § 1 every precondition with its reason; § 2 the go/no-go; § 3 the promote commands; § 4 the verify steps (every runtime the push does not build included), the tag and the record, with the release-history format | before any promotion; when posting a go/no-go; after a deploy; deploying a worker, an edge or a box |
| `references/go-live.md` | the first promotion, step by step, and the go-live check (sell only what runs); the health route and the uptime monitor; guards and hosted CI; rollback, per runtime | making the product live for the first time; adding a fail-closed guard or hosted CI; rolling back code, schema, a runtime, configuration or a key |
| `references/runbook.md` | any release as one logged checklist: the scripts it calls, the candidate (clean trees, live checks, the review, pins), docs and bookkeeping (staleness, the docs round, the backlog sweep), the backend first, the client release (leak check, the script, artifacts, stores), after the stores (deferred deletions, installations in the field, issues, contributors) | releasing a package, an extension, installers or a store listing; a client and its backend; any release with more than one artifact; writing an operator script |
| `references/netlify.md` | build settings and the adapter; how Netlify's edge handles a request (firewall, WAF, rate limiting, functions); edge-refused Server Actions; the client IP; `after()`; redirects that keep the query; Cloudflare as DNS only | writing or changing an edge rule; reading a client IP; a deploy that behaves differently with no diff; any redirect on Netlify |

Related skills: `grok-agents` (the review loop) · `test-harness` (the gate, the harnesses, the coverage map, the script contract) · `environments` (branches, variables, the migrations window, the tunnel, incidents) · `supabase-production` (the migration ledger) · `clerk-production` (the production instance) · `agent-instructions` (the pass over the agent instructions at each release) · `app-lifecycle` (where publish and go-live sit on the path) · `design` (what a screen may claim; what the exploratory pass looks at) · `shipping-artifacts` (the core docs).
