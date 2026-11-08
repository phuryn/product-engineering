---
name: release-gate
description: "Before 'push it', 'ship it', a deploy, release or go-live, or calling a stage done: the gate, the owner's preview, go/no-go, promote, prove it serves, roll back."
---

# Release gate — how a change ships

A release is a decision: **the owner says go; the agent supplies the evidence.** This skill defines the evidence needed at each shipping step, the promotion procedure and how to prove the reviewed build serves.

**The product's own instructions come first.** Use its named branches, gate, backlog and record files, taking these rules as defaults where its instructions or release doc say nothing.

**On another stack, keep the principle and swap the mechanism.** Each rule states its principle first and the stack's mechanism second. The web-app rules were learned on Next.js (App Router), Supabase, Clerk and Netlify, with Vitest and Playwright. The client-and-backend rules were learned on a relay service with a web client and an editor extension with desktop installers (`references/runbook.md`).

## Two branches, named once

**Name the product and production branches in the release doc.** Write their real names there at the first push, and nowhere else.

- **Land stage work on the product branch.** Its default name is `<product>`.
- **Move the production branch only by fast-forward after release approval.** The host deploys this branch to production, with `<product>-prod` as its default name. Require the local gate, independent review and owner's go first.

**Treat product-branch pushes as deploys until the production branch exists.** Before then, the host deploys the product branch itself; apply the `environments` skill for branch-to-environment mapping.

**A host that deploys by CLI upload deploys the working tree, not a commit.** Treat the upload as the push: close the review round first and upload a clean worktree of the reviewed commit. Name the target: `railway up --ci -p <project> -e <environment> -s <service>`. Bare `railway up` in an unlinked folder offers to create a project.

**Stamp every upload with its commit.** Use `railway up --message <commit>` so the deployment records its commit as `meta.cliMessage`. Railway uploads otherwise have a snapshot id without a commit, preventing comparison of web and worker trees (observed `2026-11-03`). State-reading scripts must account for these behaviours (Railway, observed `2026-11-03`):

- **Exclude stopped deployments when checking what is running.** A stopped deployment remains in `activeDeployments` with status `SUCCESS` and `deploymentStopped: true`.
- **Ignore empty patches when checking for staged changes.** Reading `environmentStagedChanges` creates an empty staged record, `{ patch: {} }`.

## The product's records

**Keep the release's evidence in the product's existing records.** Use the following meanings even when your product gives the records different names:

| Record | Holds |
|---|---|
| Plan | Stages, each with a done-when, and the one current status |
| Backlog | Deferred work, each with its reason and the trigger that reopens it |
| Coverage map | What was verified, by which run (`test-harness`) |
| Integrations doc | Each provider's dashboard configuration, with screenshots |
| Environments doc | Which deployment uses which database, identity instance and keys, plus a dated environment-event log |
| Release history | One dated section per release |

The suggested script names are `gate`, `smoke -- <url>`, `visual` and `agents:live`, shared with `test-harness`. Use your product's names.

## Three moments, three bars

| Moment | What it owes |
|---|---|
| **A stage is done** | Its done-when (in the product's plan) holds, the gate is green **on your own run**, and its tests and docs landed in the same change (`test-harness`). A stage that changes what a person sees is done only once the owner has tried it (§ The owner's preview). This is not yet the release checklist. |
| **A push to a branch that deploys** | A clean independent review round covering everything the push adds; **the push closes that round**. Before go-live the product branch is that branch: its URL is shared with nobody, so the preconditions are not yet owed — but the round is, and pending migrations are applied to development first. **"Just push it" is a go for the push it names**: name back, in one line, any of these still open rather than pushing past it. |
| **A promotion to production** | Every precondition (`references/checklist.md`), then the go/no-go, the promote and the verify. **Going live is the first promotion** (`references/go-live.md`). |

## What counts as evidence

- **Read the exit code from the log, never the notification.** A background wrapper can report exit 0 when its inner command failed, so read that command's code rather than the notification.
- **An inherited report is a claim, not evidence.** Run the gate yourself before repeating a count, and take the release subject from git.
- **The coverage map is written by whoever ran the gate, and by nobody else.** A delegated sandbox without Postgres or browser access has no passing gate to report. Read every line the delegate adds and rewrite evidence from your own run, rather than editing its numbers. Apply `test-harness` for the map's format.
- **A delegated diff is unreviewed code.** Read what comes back before believing it, and give it independent review. Keep product decisions, review-finding acceptance and stage-completion judgement with you. Also keep every real-system action: deploys, migrations on any database, workers and secrets, including development. Apply `delegation` and `codex-agents` for these boundaries.
- **What was left out is stated, not hidden.** Record preconditions the owner waives as waived, never ticked as completed.
- **A caveat is a claim about the world, and gets checked like one.** Before saying something has not happened, was not tested or still needs doing, find where its evidence would live and look. Caveats can sound humble enough to escape verification, yet wrong ones still cost the owner's time.
- **The gate is the exit code, not the printed counts.** Printed passing counts can accompany exit 1 (`test-harness`).

## The independent review — mandatory at every release

**Review before every deploying push and again before production promotion.** Apply this however small the change and however green the gate. Before every round, read and apply `independent-review` for the wrapper, brief, scope, triage, short reports, severity, fix costs, and commit/push effects.

The session must never have seen the build; choose it in this order:

1. **Use the product's named reviewer when it meets review requirements.** Take the choice from its agent instructions or release doc, checking that it can run as `independent-review` requires. If it cannot, use its recorded fallback when that can, otherwise the wrapper's reviewer without asking. If no other family can run, use a fresh session of the builder's family. The report names the actual reviewer and why.
2. **Default to Grok when no reviewer is named.** Use the installed Grok CLI's newest model at its highest reasoning effort, otherwise fresh headless Claude Code, the wrapper's fallback.
3. **Only the tools are optional; the review never is.** With neither CLI available, review manually in a fresh read-only session of the agent you are using.

**Keep the review read-only, fresh and unsteered.** Start without carried-over memory, using a fresh session rather than resuming or forking the building thread. Supply the unreleased diff plus working tree, without a checklist, earlier findings or an argument for the design.

**Compute review subjects from git and repeat until the bar holds.** Cover the whole unreleased range in round one, then only changes since the last round, with everything else as context. Fix findings, rerun the gate yourself, then review again. Stop only when the round has no INTRODUCED finding above Low and no High or Critical of any age remains open. Put pre-existing findings in the backlog with a reason and revisit trigger. Fix High and Critical now, regardless of age.

## Static audits — proposed, never run unasked

**Propose static audits at each release and wait for the request.** Propose `security-audit-static` and `performance-audit-static` on the release's changes. Propose a whole-repository pass only for the first release, after a large refactor, or when the owner asks. Run these steered passes beside the independent review rather than using them to replace it. Keep reports under gitignored `reports/` so security reports stay out of repository history. Fix findings or backlog them, and record declined passes as declined. Exact ranges are in `references/checklist.md`.

**Use documentation checks without overwriting records maintained during the change.** This restriction applies when docs are written with the change and coverage evidence belongs to whoever ran the gate. In that product, use `ai-shipping` documentation skills only for:

- Document definitions from `shipping-artifacts`.
- The two static audits above.
- `check` modes of `document-app` and `derive-tests`: they write nothing and list every disagreement among docs, coverage and code.

**For records maintained with changes, decline audit recommendations to rewrite them.** Without `check`, `document-app` and `derive-tests` rewrite docs and coverage from code. `ship-check` also rewrites agent instructions and runs its own review. Decline an audit's recommendation to run them. If the owner explicitly names one, explain what it would overwrite and offer this release path before running it.

## Migrations: never rely on a push to apply them, or not to

**Read migration integration settings and record them with the read date.** The release doc must say which case applies:

- **The push applies nothing to the database.** Production's database remains untouched without warning. Calling a missing database function produces a `500` on every affected page.
- **The push also applies migrations.** This happens when the database provider's git integration deploys on push to the production branch. On Supabase, its GitHub integration with *Deploy to production* on applies new migration files when that branch is pushed or merged (Supabase's docs, read `2026-10-25`). The build and the migration run then start together with nothing ordering them, and the provider takes every file in the migrations directory.

**Unread means on.** Read the provider dashboard's integration settings and the production branch's provider commit checks. On Supabase, check the project's GitHub integration, its production branch and *Deploy to production*.

**Apply pending migrations by CLI before pushing after the owner's go.** Before the go, read production's ledger and dry-run pending migrations. After the go, apply them before the push and reread the ledger, leaving nothing pending to race the build. Keep files you do not intend to run out of the migrations directory.

**Reach production through its connection string only.** Keep the CLI unlinked for both environments. Reach production through `--db-url` on the Supabase CLI; use development's own connection string for development. Avoid `db push --linked --project-ref <production ref>`: precedence is not reliable across versions. A dummy-ref probe used the typed ref for its first request (Supabase CLI 2.122.0, read `2026-10-25`). A connection string names one database across versions. Apply `supabase-production` for the ledger and `environments` for the window where deployed code meets the new schema.

## The owner's preview

**Send the owner a link and a short list of what to try.** Do it when a stage, or any change a person would see, is ready. Ready means your own gate is green, the independent review is clean or running, and new or changed screens have passed `ui-design`: its walkthrough, rendered pass and screenshot critique, and its scored audit where that skill calls for one. Include the look review in the list. Ten minutes of the owner using the product finds what reading code does not, so their time is best spent there, not on code review.

- **List changed flows as actions with their expected results.** For example: "Upload a 6 MB photo as the logo: the page shows it sharp." Then state missing or unverified work and unbuilt features, naming the stage that brings each. This keeps the owner's review focused on what exists.
- **Link deployed development or use a temporary development tunnel.** Prefer the deployed development URL when hosting exists and contains the change. Otherwise, or before deployment, use a Cloudflare quick tunnel to `next dev`. Its address is public: use development only, share the link only with the owner, then stop tunnel and server when done. Apply `environments`, `references/environments-and-branches.md § Showing development to the owner`.
- **What the owner finds is fixed within the same stage.** Review the fixes like any other change. A visible-change stage is not done until the owner has looked. If its done-when already requires owner click-through, this one link and list fulfil the request; do not ask twice.
- **Run the full exploratory pass at promotion as well.** It examines every screen and state; the preview covers only the stage's changes.
- **"Ready to test" means installed on every surface the owner holds, with nothing for the owner to do first.** Sites serve the latest push, installed apps or extensions their last installed build, and phones their last pushed bundle. These surfaces can diverge silently, so require your own green gate, a committed change, and every owner-used surface rebuilt and reinstalled or pushed. Say which surfaces carry which build and which need a reload or restart. Finish the batch, or hand off what exists with its edges stated. Apply `delegation` for the handoff side of this rule.

## Verify — the build serving is the one you reviewed

Commands and the record are in `references/checklist.md § 4`.

- **First prove the new build is the one serving.** A failed build can leave the old deploy serving, letting checks pass against old code. Find something the diff adds and something it removes, then check both in production's response. A cache holding two builds can serve an addition, while a removal rules that out. Choose probes from the diff, since an untouched page's content-hashed assets can stay identical. Count occurrences with `grep -o … | wc -l`. Avoid `grep -c`: it counts lines, and a production document is one line. If no served byte changes, record "unprobeable by content" and read the framework's build id, replaced on every build. A generic `200` cannot establish build identity.
- **Then prove code and schema agree.** A ledger read before promotion cannot show that deployed code met deployed schema. Request an unguessable id that cannot exist through a public route. Require **404** with the product's own not-found to show a database round trip. Use one request, no account and no write, on every entry point reading through the same function. Record any other answer as a failed probe. Find its cause from the body's error code, rather than status, before any production write (checklist § 4).
- **A push deploys one runtime; every other keeps its last bundle.** Check workers, edge hosts and worker boxes after every push and promotion. Compare each build identity with the tree and redeploy runtimes that are behind. **Decide which are behind from each bundle's inputs.** Compare a bundler's metafile with the diff since that runtime's last deploy. Folder changes cannot establish this; bundles include whatever their entries import.
- **Deploy only from a clean checkout at the release branch's tip.** Make every deploy and status command refuse any other tree. A promotion does not move an operator's checkout, and "current" compares only with the tree running the check.
- **Behind a CDN, prove on a path it never caches.** Cached responses can come from the old origin. When moving an origin, deploy the new target and read it ready before repointing DNS.
- **A deploy can change behaviour nothing in your diff touched.** Reverify hardening controls after every deploy. The local gate has no edge. An unpinned host adapter is an untracked release input. When behaviour changes without a diff, check versions before changing code. **A transient control is worse than an absent one.** Its passing run is the one you quote.
- **The smoke runs last.** Edge limits can refuse your own address for a minute.
- **An unauthenticated smoke cannot see the authenticated mile.** Run an authenticated canary with dedicated credentials after deploys touching sign-in, sessions, ownership or entitlements. When development uses a different identity instance, state that its green run establishes nothing about production sign-in.
- **For an installed client, read the installation, not the rollout's summary.** Run the same removal probe on the installation, rather than trusting rollout summaries (`references/runbook.md § E`).
- **Tag after the checks, never before.** Record the results with the release.

## Any release, not only a web deploy

**Run each release as one ordered, logged checklist.** This includes packages, extensions, installers, store listings, and clients with backends. Log each step's command, pass and evidence in the release plan (`references/runbook.md`). Record every skip with its reason; correct a faulty list in the same pass.

- **If a script exists for a step, use the script.** Reinventing a step can change what ships. On the first manual release, record commands and evidence in the release doc. On the second, script them and route the command from the entry file; apply `agent-instructions`. Run the script only after the owner's clear go, authorizing that one release (`references/runbook.md`). The doc names the steps the owner keeps.
- **A release script refuses every option it does not read.** Name no target by default. Never echo a flag's value. An ignored `--dry-run` deploys for real.
- **The backend ships first.** Publish a client relying on new backend behaviour only once that backend is in production. Keep every backend release usable with the last published client.
- **A release is finished only when every artifact is attached.** Read the asset list.
- **Publishing is not availability.** Poll the store for the version. A publishing timestamp is insufficient, so describe a listing as live only once it serves the version.
- **Nothing unreleased is described in the present tense.** Describe it as future work.
- **An issue is done only once its fix is installable.** The fix must be installable from the reporter's store before its issue is done.
- **A leak check runs on the outgoing ref.** When public repositories must exclude content, check the whole ref rather than a bare diff. Then read what you push.
- **A generated listing is never hand-edited.** Make changes through the generator, and use a test to hold the listing equal to it.
- **A contributor's commits keep their authorship.** Preserve it through the release.
- **The branch a plugin or skill marketplace serves is production.** When a pack source names a folder without a ref, installs read the branch's head (Claude Code, observed `2026-11-07`). Pushing there is a release regardless of tags. Keep next-release work on another branch. Move the served branch to the reviewed commit only at the go, with the tag naming its head.

## Never

Force-push the production branch · promote with a skipped suite, a stale doc, or an unrun local gate · run any authenticated smoke with a real user's credentials · test against production data · apply a migration through an MCP server or the dashboard · link the database CLI to any project · deploy a runtime from a checkout that is not the release tip · hand-roll a step a release script encodes · infer a go from an ambiguous reply · announce a store listing as live before it serves the version.

## A promotion, in order

1. **Complete every precondition with evidence.** Use `references/checklist.md § 1`.
2. **Silence is not go.** Post the go/no-go with the checklist, evidence and one paragraph (`§ 2`), and get the owner's answer in chat.
3. **Migrate by production connection string before promoting by fast-forward.** Apply pending migrations through the CLI and reread the ledger (`§ 3`).
4. **Verify the serving build, schema and runtimes before tagging and recording.** Check that every other runtime is current (`§ 4`).

Each rule's origin, the case that taught it, is in `receipts.md` beside this file; read it when a rule's edge is unclear.

## How you can tell it worked

The reviewed commit serves on the live site, beyond the deploy log, and the post-promotion checks passed. The owner gave the go after the preview.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/checklist.md` | § 1 every precondition with its reason; § 2 the go/no-go; § 3 the promote commands; § 4 the verify steps (every runtime the push does not build included), the tag and the record, with the release-history format | before any promotion; when posting a go/no-go; after a deploy; deploying a worker, an edge or a box |
| `references/go-live.md` | the first promotion, step by step, and the go-live check (sell only what runs); the health route and the uptime monitor; guards and hosted CI; rollback, per runtime | making the product live for the first time; adding a fail-closed guard or hosted CI; rolling back code, schema, a runtime, configuration or a key |
| `references/runbook.md` | any release as one logged checklist: the scripts it calls, the candidate (clean trees, live checks, the review, pins), docs and bookkeeping (staleness, the docs round, the backlog sweep), the backend first, the client release (leak check, the script, artifacts, stores), after the stores (deferred deletions, installations in the field, issues, contributors) | releasing a package, an extension, installers or a store listing; a client and its backend; any release with more than one artifact; writing an operator script |
| `references/netlify.md` | build settings and the adapter; how Netlify's edge handles a request (firewall, WAF, rate limiting, functions); edge-refused Server Actions; the client IP; `after()`; redirects that keep the query; Cloudflare as DNS only | writing or changing an edge rule; reading a client IP; a deploy that behaves differently with no diff; any redirect on Netlify |

Related skills:

- `independent-review` (the review loop)
- `test-harness` (the gate, the harnesses, the coverage map, the script contract)
- `environments` (branches, variables, the migrations window, the tunnel, incidents)
- `supabase-production` (the migration ledger)
- `clerk-production` (the production instance)
- `agent-instructions` (the pass over the agent instructions at each release)
- `app-lifecycle` (where publish and go-live sit on the path)
- `ui-design` (what a screen may claim; what the exploratory pass looks at)
- `shipping-artifacts` (the core docs)
