# Deployment targets and verification

## CLI uploads and local scheduled jobs

**A host that deploys by CLI upload deploys the working tree, not a commit.** Treat the upload as the push: close the review round first and upload a clean worktree of the reviewed commit. Name the target: `railway up --ci -p <project> -e <environment> -s <service>`. Bare `railway up` in an unlinked folder offers to create a project.

**Local scheduled jobs run a released copy that changes only at release.** A job pointed at the working tree runs each edit on its next tick. The released copy includes local code the job imports. Check the job's target during promotion (`checklist.md` § 4).

**Stamp every upload with its commit.** Use `railway up --message <commit>` so the deployment records its commit as `meta.cliMessage`. Railway uploads otherwise have a snapshot id without a commit, preventing comparison of web and worker trees (observed `2026-11-03`). State-reading scripts must account for these behaviours (Railway, observed `2026-11-03`):

- **Exclude stopped deployments when checking what is running.** A stopped deployment remains in `activeDeployments` with status `SUCCESS` and `deploymentStopped: true`.
- **Ignore empty patches when checking for staged changes.** Reading `environmentStagedChanges` creates an empty staged record, `{ patch: {} }`.

## Proving build identity and avoiding a CDN cache

Choose probes from the diff, since an untouched page's content-hashed assets can stay identical. Count occurrences with `grep -o … | wc -l`. Avoid `grep -c`: it counts lines, and a production document is one line. If no served byte changes, record "unprobeable by content" and read the framework's build id, replaced on every build. A generic `200` cannot establish build identity.

- **Behind a CDN, prove on a path it never caches.** Cached responses can come from the old origin. When moving an origin, deploy the new target and read it ready before repointing DNS.

## Database schema and runtimes outside the push

- **Then prove code and schema agree.** A ledger read before promotion cannot show that deployed code met deployed schema. Request an unguessable id that cannot exist through a public route. Require **404** with the product's own not-found to show a database round trip. Use one request, no account and no write, on every entry point reading through the same function. Record any other answer as a failed probe. Find its cause from the body's error code, rather than status, before any production write (checklist § 4).
- **A push deploys one runtime; every other keeps its last bundle.** Check workers, edge hosts and worker boxes after every push and promotion. Compare each build identity with the tree and redeploy runtimes that are behind. **Decide which are behind from each bundle's inputs.** Compare a bundler's metafile with the diff since that runtime's last deploy. Folder changes cannot establish this; bundles include whatever their entries import.

## Authenticated canaries and installed clients

- **An unauthenticated smoke cannot see the authenticated mile.** Run an authenticated canary with dedicated credentials after deploys touching sign-in, sessions, ownership or entitlements. When development uses a different identity instance, state that its green run establishes nothing about production sign-in.
- **For an installed client, read the installation, not the rollout's summary.** Run the same removal probe on the installation, rather than trusting rollout summaries (`runbook.md` § E).
