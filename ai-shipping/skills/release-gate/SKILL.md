---
name: release-gate
description: "Before 'push it', 'ship it', a deploy, release or go-live, or calling a stage done: the gate, the owner's preview, go/no-go, promote, prove it serves, roll back."
---

# Release gate — how a change ships

**Supply release evidence and get the owner's go.** This skill defines the evidence needed at each shipping step, the promotion procedure and how to prove the reviewed build serves.

**Follow the product's instructions and adapt mechanisms to its stack.** Use its named branches, gate, backlog and record files, taking these rules as defaults where its instructions or release doc say nothing. Keep each principle when replacing a stack-specific mechanism.

## Two branches, named once

**Name the product and production branches in the release doc.** Write their real names there at the first push, and nowhere else.

- **Land stage work on the product branch.** Its default name is `<product>`.
- **Move the production branch only by fast-forward after release approval.** The host deploys this branch to production, with `<product>-prod` as its default name. Require the local gate, independent review and owner's go first.

**Treat product-branch pushes as deploys until the production branch exists.** Before then, the host deploys the product branch itself; apply the `environments` skill for branch-to-environment mapping.

**Review a CLI upload before sending its clean working tree.** Hosts using `railway up` and similar commands upload the tree rather than a commit. Treat the upload as the push: close the review round first and upload a clean worktree of the reviewed commit. Name the target: `railway up --ci -p <project> -e <environment> -s <service>`. Bare `railway up` in an unlinked folder offers to create a project.

**Stamp every upload with its commit and check provider state carefully.** Use `railway up --message <commit>` so the deployment records its commit as `meta.cliMessage`. Railway uploads otherwise have a snapshot id without a commit, preventing comparison of web and worker trees (observed `2026-11-03`). State-reading scripts must account for these behaviours (Railway, observed `2026-11-03`):

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

**Apply the bar for the shipping moment you are at.** Stage completion, a deploying push and a production promotion owe different evidence.

| Moment | What it owes |
|---|---|
| **A stage is done** | Its done-when (in the product's plan) holds, the gate is green **on your own run**, and its tests and docs landed in the same change (`test-harness`). A stage that changes what a person sees is done only once the owner has tried it (§ The owner's preview). This is not yet the release checklist. |
| **A push to a branch that deploys** | A clean independent review round covering everything the push adds; **the push closes that round**. Before go-live the product branch is that branch: its URL is shared with nobody, so the preconditions are not yet owed — but the round is, and pending migrations are applied to development first. **"Just push it" is a go for the push it names**: name back, in one line, any of these still open rather than pushing past it. |
| **A promotion to production** | Every precondition (`references/checklist.md`), then the go/no-go, the promote and the verify. **Going live is the first promotion** (`references/go-live.md`). |

## What counts as evidence

**Check evidence at its source before repeating a release claim.** Reports, counts and caveats all need verification.

- **Read the command's exit code from its log.** A background wrapper can report exit 0 when its inner command failed, so read that command's code rather than the notification.
- **Rerun inherited checks and take the release subject from git.** An inherited report is a claim, so run the gate yourself before repeating a count.
- **Let only the gate runner write its coverage evidence.** A delegated sandbox without Postgres or browser access has no passing gate to report. Read every line the delegate adds and rewrite evidence from your own run, rather than editing its numbers. Apply `test-harness` for the map's format.
- **Read delegated diffs and give them independent review.** They arrive as unreviewed code. Keep product decisions, review-finding acceptance and stage-completion judgement with you. Also keep every real-system action: deploys, migrations on any database, workers and secrets, including development. Apply `delegation` and `codex-agents` for these boundaries.
- **Record waived preconditions as waived.** State what was left out; never tick a waived item as completed.
- **Verify caveats before asking the owner to act on them.** Before saying something has not happened, was not tested or still needs doing, find where its evidence would live and look. Caveats can sound humble enough to escape verification, yet wrong ones still cost the owner's time.
- **Use the gate's exit code to judge its result.** Printed passing counts can accompany exit 1 (`test-harness`).

## The independent review — mandatory at every release

**Review before every deploying push and again before production promotion.** Apply this however small the change and however green the gate. Before every round, read and apply `independent-review` for the wrapper, brief, scope, triage, short reports, severity, fix costs, and commit/push effects.

**Select a fresh reviewer using the product's recorded choice first.** The session must never have seen the build; choose it in this order:

1. **Use the product's named reviewer when it meets review requirements.** Take the choice from its agent instructions or release doc, checking that it can run as `independent-review` requires. If it cannot, use its recorded fallback when that can, otherwise the wrapper's reviewer without asking. If no other family can run, use a fresh session of the builder's family. The report names the actual reviewer and why.
2. **Default to Grok when no reviewer is named.** Use the installed Grok CLI's newest model at its highest reasoning effort, otherwise fresh headless Claude Code, the wrapper's fallback.
3. **Review manually in a fresh session when neither CLI exists.** Use a fresh read-only session of the agent you are using, since the tools are optional and review is mandatory.

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

- **Apply migrations yourself when the push only ships code.** Production's database remains untouched without warning. Calling a missing database function produces a `500` on every affected page.
- **Account for automatic migrations when the integration deploys on push.** Supabase's GitHub integration applies new files when its production branch is pushed or merged with *Deploy to production* enabled (read `2026-10-25`). The build and migrations start together without ordering, and the provider takes every file in the migrations directory.

**Treat unread migration settings as enabled and inspect them before promotion.** Read the provider dashboard's integration settings and the production branch's provider commit checks. On Supabase, check the project's GitHub integration, its production branch and *Deploy to production*.

**Apply pending migrations by CLI before pushing after the owner's go.** Before the go, read production's ledger and dry-run pending migrations. After the go, apply them before the push and reread the ledger, leaving nothing pending to race the build. Keep files you do not intend to run out of the migrations directory.

**Use each database's connection string and keep the CLI unlinked.** Reach production through `--db-url` on the Supabase CLI; use development's own connection string for development. Avoid `db push --linked --project-ref <production ref>`: precedence is not reliable across versions. A dummy-ref probe used the typed ref for its first request (Supabase CLI 2.122.0, read `2026-10-25`). A connection string names one database across versions. Apply `supabase-production` for the ledger and `environments` for the window where deployed code meets the new schema.

## The owner's preview

**Send a preview link and actions once the change is ready.** This applies to a stage or any change a person would see. First run a green gate yourself, with the independent review either clean or running. Apply `ui-design` to new or changed screens: walkthrough, rendered pass, screenshot critique and its scored audit where required. Include a look review in the actions, since the owner finds things by using the product that reading code misses.

- **List changed flows as actions with their expected results.** For example: "Upload a 6 MB photo as the logo: the page shows it sharp." Then state missing or unverified work and unbuilt features, naming the stage that brings each. This keeps the owner's review focused on what exists.
- **Link deployed development or use a temporary development tunnel.** Prefer the deployed development URL when hosting exists and contains the change. Otherwise, or before deployment, use a Cloudflare quick tunnel to `next dev`. Its address is public: use development only, share the link only with the owner, then stop tunnel and server when done. Apply `environments`, `references/environments-and-branches.md § Showing development to the owner`.
- **Fix preview findings within the same stage and review the fixes.** A visible-change stage is not done until the owner has looked. If its done-when already requires owner click-through, this one link and list fulfil the request; do not ask twice.
- **Run the full exploratory pass at promotion as well.** It examines every screen and state; the preview covers only the stage's changes.
- **Install every owner-facing surface before calling the change ready to test.** Nothing should need doing first. Sites serve the latest push, installed apps or extensions their last installed build, and phones their last pushed bundle. These surfaces can diverge silently, so require your own green gate, a committed change, and every owner-used surface rebuilt and reinstalled or pushed. Say which surfaces carry which build and which need a reload or restart. Finish the batch, or hand off what exists with its edges stated. Apply `delegation` for the handoff side of this rule.

## Verify — the build serving is the one you reviewed

**Verify the live build after promotion before tagging the release.** Commands and the record are in `references/checklist.md § 4`.

- **First prove the new build is the one serving.** A failed build can leave the old deploy serving, letting checks pass against old code. Find something the diff adds and something it removes, then check both in production's response. A cache holding two builds can serve an addition, while a removal rules that out. Choose probes from the diff, since an untouched page's content-hashed assets can stay identical. Count occurrences with `grep -o … | wc -l`. Avoid `grep -c`: it counts lines, and a production document is one line. If no served byte changes, record "unprobeable by content" and read the framework's build id, replaced on every build. A generic `200` cannot establish build identity.
- **Prove deployed code and schema agree through every affected entry point.** A ledger read before promotion cannot show that deployed code met deployed schema. Request an unguessable id that cannot exist through a public route. Require **404** with the product's own not-found to show a database round trip. Use one request, no account and no write, on every entry point reading through the same function. Record any other answer as a failed probe. Find its cause from the body's error code, rather than status, before any production write (checklist § 4).
- **Check every runtime after every push and promotion.** A push deploys one runtime; workers, edge hosts and worker boxes retain their last deployed bundles. Compare each build identity with the tree and redeploy runtimes that are behind. Determine that from bundle inputs: compare a bundler's metafile with the diff since that runtime's last deploy. Folder changes cannot establish this; bundles include whatever their entries import.
- **Deploy runtimes only from a clean checkout at the release tip.** Make every deploy and status command refuse any other tree. A promotion does not move an operator's checkout, and "current" compares only with the tree running the check.
- **Verify CDN-backed releases on a path the CDN never caches.** Cached responses can come from the old origin. When moving an origin, deploy the new target and read it ready before repointing DNS.
- **Reverify hardening controls after every deploy.** The local gate has no edge. An unpinned host adapter is an untracked release input. When behaviour changes without a diff, check versions before changing code. Intermittent enforcement is worse than an absent control because you may quote its passing run.
- **Run smoke last, after checks that trip edge limits.** Edge limits can refuse your own address for a minute.
- **Run an authenticated canary when sign-in or access behaviour changes.** Use dedicated canary credentials after deploys touching sign-in, sessions, ownership or entitlements, since unauthenticated smoke cannot cover those paths. When development uses a different identity instance, state that its green run establishes nothing about production sign-in.
- **Verify installed clients on their installed bundles.** Run the same removal probe on the installation, rather than trusting rollout summaries (`references/runbook.md § E`).
- **Tag only after the verification checks pass.** Record the results with the release.

## Any release, not only a web deploy

**Run each release as one ordered, logged checklist.** This includes packages, extensions, installers, store listings, and clients with backends. Log each step's command, pass and evidence in the release plan (`references/runbook.md`). Record every skip with its reason; correct a faulty list in the same pass.

- **Use the existing release script for every step it encodes.** Reinventing a step can change what ships. On the first manual release, record commands and evidence in the release doc. On the second, script them and route the command from the entry file; apply `agent-instructions`. Run the script only after the owner's clear go, authorizing that one release (`references/runbook.md`). The doc names the steps the owner keeps.
- **Make release scripts reject unread options and require an explicit target.** Never echo a flag's value. An ignored `--dry-run` deploys for real.
- **Ship new backend behaviour to production before publishing dependent clients.** Keep every backend release usable with the last published client.
- **Read the asset list before calling the release finished.** Check that every artifact is attached to the release before declaring it finished.
- **Poll the store for the published version before announcing availability.** A publishing timestamp is insufficient, so describe a listing as live only once it serves the version.
- **Describe unreleased work as future and close issues only when installable.** The fix must be installable from the reporter's store before its issue is done.
- **Leak-check the outgoing ref and read what you push.** When public repositories must exclude content, check the whole ref rather than a bare diff.
- **Generate listings and test their equality to their generator.** Make changes through the generator rather than hand-editing generated listings.
- **Keep contributors' authorship on their commits.** Preserve it through the release.
- **Treat the branch a marketplace serves as production.** When a pack source names a folder without a ref, installs read the branch's head (Claude Code, observed `2026-11-07`). Pushing there is a release regardless of tags. Keep next-release work on another branch. Move the served branch to the reviewed commit only at the go, with the tag naming its head.

## Never

**Use the release procedure and resolve blockers before proceeding.** These guardrails also apply:

- **Fast-forward production and keep its history intact.** Never force-push the production branch.
- **Resolve skipped suites, stale docs and unrun gates before promotion.** Record waivers honestly; do not promote with a skipped suite, stale doc or unrun local gate.
- **Use dedicated canary credentials and development test data.** Never run authenticated smoke with real-user credentials or test against production data.
- **Apply migrations by CLI connection string with the CLI unlinked.** Never apply through an MCP server or dashboard, or link the database CLI to any project.
- **Deploy from the release tip and use encoded release steps.** Keep the checkout clean and use the release script rather than hand-rolling its steps.
- **Get an unambiguous go and confirm store availability.** Ask for clarity on an ambiguous reply. Announce a listing as live only when it serves the version.

## A promotion, in order

**Finish preconditions, get the go, migrate, promote, verify and record.** Follow the checklist's order:

1. **Complete every precondition with evidence.** Use `references/checklist.md § 1`.
2. **Post the go/no-go and get the owner's answer in chat.** Include the checklist, evidence and one paragraph (`§ 2`). Silence does not authorize promotion.
3. **Migrate by production connection string before promoting by fast-forward.** Apply pending migrations through the CLI and reread the ledger (`§ 3`).
4. **Verify the serving build, schema and runtimes before tagging and recording.** Check that every other runtime is current (`§ 4`).

Each rule's origin, the case that taught it, is in `receipts.md` beside this file; read it when a rule's edge is unclear.

## How you can tell it worked

**Confirm the reviewed commit serves and post-promotion checks passed.** The owner gave the go after the preview, and the live site confirms build identity beyond the deploy log.

## Files

**Read the matching checklist or runbook before the release step.**

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
