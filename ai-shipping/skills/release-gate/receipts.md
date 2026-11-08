# release-gate: receipts

Each heading is a rule from `SKILL.md`, with the case that taught it.

## Follow the product's instructions and adapt mechanisms to its stack.

The rules come from two kinds of product, named here only by kind. The web-app half — the bars, the preview, the promotion checklist, go-live, the verify probes, Netlify's edge — was learned on Next.js (App Router) + Supabase + Clerk + Netlify, with Vitest and Playwright, by several products (a live Q&A product, a monitoring product with worker boxes and edge workers beside its web app, and others). The client+backend half — any release as one logged checklist, the backend before the client, artifacts and store listings, issues — was learned on a remote-control product: a relay service with a web client, and an editor extension with desktop installers that drives a CLI agent (`references/runbook.md`). (Undated in the original.)

## Review a CLI upload before sending its clean working tree.

- `2026-11-01`, an evals product's first deploy: this skill and `environments` both assumed a host that builds from a git branch.

## Stamp every upload with its commit and check provider state carefully.

- `2026-11-03`, an evals product's worker stop and start script: each found only by running it. A stopped deployment stays in `activeDeployments` with status `SUCCESS` and `deploymentStopped: true`, and reading `environmentStagedChanges` creates an empty staged record (`{ patch: {} }`), so a "nothing staged" check ignores an empty patch.

## Read the command's exit code from its log.

- `2026-09-17`, a visual sweep's log ended `VISUAL_EXIT=1` under an exit-0 notification.

## Rerun inherited checks and take the release subject from git.

- `2026-09-16`, a verified-sounding handoff missed unapplied production migrations.

## Let only the gate runner write its coverage evidence.

- `2026-09-16` and `2026-09-17`, blocked builder runs were reported in the coordinator's name with invented counts.

## Verify caveats before asking the owner to act on them.

- `2026-08-25`, twice in one session: "never fired on a schedule" with nineteen scheduled runs on disk, and "still needs a live connect" with the token already saved.

## Apply migrations yourself when the push only ships code.

- `2026-09-16`, three migrations were absent from production through a handoff that called the release verified.

## Treat unread migration settings as enabled and inspect them before promotion.

- `2026-10-24`, a monitoring product: every push to its production branch drew the provider's check against the production project, and whether that run applied migrations was a setting nobody had read.

## Use each database's connection string and keep the CLI unlinked.

- `2026-10-23`, a monitoring product: a review round observed `db push --linked --project-ref <production ref>` write to the linked project. On CLI 2.122.0, read 2026-10-25, a probe with dummy refs saw the typed ref used for the first request, so the precedence of that pair is not something to rely on across versions; a connection string names one database on every version.

## Send a preview link and actions once the change is ready.

- `2026-10-22`, a monitoring product: through a tunnel to `next dev`, its owner found six problems no review had — placeholder examples naming the owner's own app, guessed defaults such as `/api/health` and `$.db.ok` prefilled as if they were real, both free-tier locations in Europe, an image size limit, an accent colour that did nothing visible, and a switch for a feature not built yet.

## List changed flows as actions with their expected results.

- `2026-11-03`, an evals product's owner, meeting a placeholder landing: "Did you create legal pages, landing page …?"

## Install every owner-facing surface before calling the change ready to test.

- `2026-08-19`, the remote-control product: the owner tested two fixes against the previous night's build and had to ask whether they had been reinstalled.

## First prove the new build is the one serving.

- `2026-09-19` and `2026-09-21`, a live Q&A product: a chunk-hash probe that could never move, then a removal probe that could never reach zero.

## Check every runtime after every push and promotion.

- `2026-10-23` and `2026-10-24`, a monitoring product: its probes ran a build without a new check type for a day while every monitor of that type alerted; a release that changed a shared module but no probe folder left every box behind; and a deploy from a detached operator checkout shipped the previous release while its status read current.

## Verify CDN-backed releases on a path the CDN never caches.

- `2026-10-24`, a monitoring product moving its status-page host behind Cloudflare: review rounds found its written procedure repointing DNS before the new host read ready, and calling the move done on a script the CDN could serve from cache.

## Reverify hardening controls after every deploy.

- `2026-09-17` and `2026-09-18`, identical edge configuration enforced, stopped enforcing, then enforced again.

## Use the existing release script for every step it encodes.

- `Undated`: A hand-rolled release once attached a staging build to the public release.

- `2026-11-05`, a VS Code extension: one command checks the branch, runs every gate and checks the tag is free, then packages, pushes, waits for CI on the pushed commit, tags, publishes the release with its changelog section and installs it, with `--dry-run` and a skip per gate; the version bump, the changelog and the second store's publish stay the owner's.

## Run each release as one ordered, logged checklist.

- `Undated`: A live Q&A product's release doc lists its no-go checks with their commands, a go/no-go paragraph ("Silence is not go"), the promotion commands with the production refs spelled out, and how to prove the release serves. A skipped gate is a recorded waiver. (No separate date in the original's `2026-11-05` release examples.)

## Treat the branch a marketplace serves as production.

- `2026-11-07`, a skill collection: two commits pushed after a release's tag reached auto-updated installs within the hour, a skill rename among them, before their review had finished.
