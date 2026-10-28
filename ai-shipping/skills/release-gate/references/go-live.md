# Going live, guards, rollback

The first promotion, the monitor that watches it, the two rules about guards and hosted CI, and how each kind of change goes back.

## Go live

The first promotion to production, once: the product moves from a URL shared with nobody to one strangers use. Enter it when the owner says the product is ready for a real audience — after the front door and its legal pages are live (`app-lifecycle` has where this sits on the path).

1. **Production resources, separate from development** (`environments`):
   - an identity provider **production** instance with its own keys, its email DNS records, and express consent to the legal documents required at sign-up (on Clerk, *Require express consent to legal documents* — `clerk-production`);
   - a real payment account connected to the billing provider when the product bills;
   - a production database project, every migration applied to it by CLI through its connection string (`--db-url`; the CLI stays linked to development and is never relinked — `SKILL.md § Migrations`), and the ledger read again the same way (`supabase-production`). No build reads that project yet, so no window opens; from the first release on, a production migration waits for the go (checklist § 3);
   - the production values ready for the host, with **generated secrets generated afresh, never copied from development** (`environments`, `references/variables.md`). They go into the host's production environment only in step 3, after the product branch is pinned to development values and the production branch exists: until then the host deploys the product branch to production, so values set early make its next push read and write the production database.

   Each dashboard change gets its screenshot.
2. **The first release** follows the checklist's § 1–2 with **the whole product as its range**: round 1 of the review is everything the product holds, or, when it began from a starter repository, everything it added since (`--subject HEAD` when the history is the product's own, its first commit included, or `<the commit it left its starter at>..HEAD`: `grok-agents` § The subject), run **before** the production branch exists, and the whole-repository audits are proposed.

   **Sell only what runs — the go-live check.** One list of the product's areas, each marked live or not yet, is read by every page that sells or promises: the plan table, the terms and privacy policy, the footer, plan labels. A test fails while anything sold as live is unbuilt. It runs **outside the normal suite**, as its own command, so no environment variable or skip can turn it off, and it passes on the exact commit before production billing exists and at every promotion after (checklist § 1). **The flag flips the day the thing goes live**, with every "not yet" sentence about it, because a lagging flag lies the other way. Moving an area to "not yet" is a product decision, with its pages to update. (`2026-10-23`, a monitoring product: review rounds found an alert delay, maintenance windows, a third check location and CSV export sold as part of the paid plan, and the terms promising locations, all unbuilt. `2026-10-24`: the day its production checks started, the site still said checks had not started, and the go-live check was first found failing only after the push.) What a screen may claim is the `design` skill.
3. **On the owner's go, creating the production branch is the promotion.** In this order, from a clean checkout at `<cleared>`, the commit the round cleared:

   1. **Apply what is pending**, checklist § 3's apply, and read the ledger again. Step 1 applied what existed then; the review may have added more.
   2. **Pin the product branch to development values** — on Netlify, its branch deploy-context values, or a development site of its own that builds only that branch (`netlify.md § The site`). From here it never builds with production's values, or it starts writing to production.
   3. **Create the production branch**, a push of `<cleared>` and nothing else, and point the host's production deploys at it:

      ```sh
      git push origin <cleared>:refs/heads/<product>-prod && git branch <product>-prod <cleared>
      ```

   4. **Put the production values in the host's production environment, then start a fresh production deploy.** A variable change takes effect only on a new deploy, and a public build-time value only on a rebuild (`environments`, `references/variables.md`), so the deploy that creating the branch started was built without them. The fresh deploy is the build that goes live; check that it is the one serving before § 4 (a failed build leaves the previous deploy live).

   The uptime monitor, and the status page if there is one, move to the production URL. Then the checklist's § 4. (Both branch names were written into the release doc at the first push.)
4. **Propose hosted CI** as its own change (§ Guards and hosted CI), now that there is an audience.
5. **Done when** the production URL serves the reviewed commit (the added-and-removed probe), every runtime beside the app runs production's build on production's keys, `/health` answers ok, the served pages carry the identity provider's production publishable key (`pk_live_` on Clerk), a stranger can sign up on a phone with the legal consent shown and that account is read back in production's identity instance and database, nothing sold is unbuilt (production billing waits until that holds), no doc still describes production as unbuilt (swept by phrase, checklist § 1), and the environments doc records the verified production mapping with its date.

## The health route and the uptime monitor

From the first deploy, not from go-live. The principle: an external probe of one route that proves **configuration and database together**.

- **`/health` answers `200 {"status":"ok","database":"ok"}` only when the configuration parsed *and* the database replied, and `503` otherwise.** It returns a count, never a row. It is the one route an origin seal would have to exempt (`netlify.md`).
- **The monitor: apply the `uptime-monitoring` skill.** A check on `https://<host>/health` that asserts on the `database` field, not the status code alone, confirmed from a second location, a heartbeat for every scheduled job, and an alert route proven by a controlled failure. Until that drill has run, the monitor is reported as not yet proven.
- **The status page** is the owner's call, public, members-only or none, decided before the monitoring service creates one; the monitor is needed either way. A public one is linked from the site footer, in a new tab.
- **Screenshot the monitor's settings, and the status page if there is one**, link them from the integrations doc, and record the status page URL when there is one: what it probes and who it pages live in the monitoring service's dashboard, not in the repository, so that record is the only place the next reader can learn them.
- **Re-point it** when the production branch and the custom domain arrive.

## Guards and hosted CI

- **Never ship a new fail-closed guard in the same change as the product it guards.** A check that has never passed is indistinguishable from a broken build, and the host may silently keep serving the previous deploy. Land the product, confirm it, then wire the guard as its own change. (`2026-09-16`, an exact-commit CI guard needed six secrets that did not exist.)
- **The build is deliberately not gated on hosted CI.** The local gate plus a human **go** is the whole gate. Propose hosted CI at go-live, or when a second person starts pushing to the product branch: it runs what the gate runs except the authenticated mile (`test-harness`), and it is wired as its own change after its secrets exist, never bundled with a product release. (`2026-09-16`, the tested CI guard and workflow remained unwired and had never run.)

## Rollback

**Each runtime has its own way back, planned before it is needed, and a rollback never rehearsed is named in the go/no-go** of a release that might need it: its first use is its test. Fixing forward through the checklist is the default. (`2026-10-24`, a monitoring product: none of its rollbacks — the app, the schema, the probe boxes, the status edge, the workers — had been rehearsed.)

- **Code:** redeploy the previous deploy from the host's deploy list **once it is known to run against the current schema**. Migrations are forward-only, so if one removed a column or function signature the older build calls, a forward migration tested on development restores it first. Then fix forward on the product branch. Read the deploy list after the next push: whether a hand-published deploy survives it is the host's behaviour, not yours.
- **A runtime the push does not build** (a worker box, an edge, a serverless worker): often only a revert, released through the checklist and then deployed. A box may keep no previous bundle, and a deploy guard that accepts only the release tip refuses an older commit by design — lift it deliberately, for one deploy, or release the revert. A worker platform's own rollback (Wrangler's `wrangler rollback`, for one) returns the previous version without a build.
- **Schema:** forward-only. Never edit an applied migration; write a compensating one (`supabase-production`).
- **Configuration:** restore the last known-good value, and **rebuild when it is a `NEXT_PUBLIC_*` or other build-time value** — it was compiled into the bundle, so changing the variable alone changes nothing. A screenshot records the intended configuration, not the live value.
- **A suspected leaked key:** the four steps in `environments` § Rotating, done at once; if the key is being used against you, revoke first and accept that every holder fails until it has the new value. Either way, update **every copy a deploy reads** — the host's environment, and the `.env` of each operator checkout a worker's deploy uploads its secrets from, or that deploy puts the old value back — redeploy every runtime that holds the key, and write it down in the environments doc's log (`environments`). (`2026-10-24`, a monitoring product: after a rotation, one worker was found still holding the old identity-provider key.)
