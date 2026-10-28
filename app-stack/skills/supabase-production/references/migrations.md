# Migrations: files, the CLI, the ledger, the window

## Contents

- Files only
- Applied by the CLI, against a target you state
- The MCP is for looking
- Does a push apply migrations?
- The window between apply and deploy
- Before a promotion
- After the deploy
- Rollback

## Files only

- **Every schema change is a file** in `supabase/migrations/`, named `<timestamp>_<name>.sql`. Files are ordered and idempotent. The first is the first slice's schema; every later change is a new file.
- **An applied migration is never edited.** A change is a new file, and a mistake is a compensating one.
- **A migration you do not mean to run yet is not in `supabase/migrations/`.** `db push` applies every pending file there, and a git integration hands the provider the whole directory. Park it in a sibling directory (`supabase/pending/`) and move it back when its precondition holds, such as every runtime running the build that no longer needs what it removes (§ The window). (`2026-10-22`, a monitoring product: a revocation sat beside the additive migration it depended on, so the next push would have applied both while two worker boxes still needed the grants.)
- **An unapplied file whose timestamp sorts before one already applied takes a new timestamp after it.** Branches built in parallel produce this; the ledger otherwise refuses it or needs `--include-all`. (`2026-10-22`, a monitoring product: a migration from one branch had a later file from another already applied to development.)
- **The dashboard is read-only.** A change made there exists in no file, so the next environment never gets it.
- **Keep `supabase/config.toml` minimal.**
- **The schema is the source, not memory.** Before writing a query or a migration, read the migrations (newest first) and the generated database types.

## Applied by the CLI, against a target you state

```sh
# Development: the only project the CLI is ever linked to. <dev-ref> is the ref in the app's own
# SUPABASE_URL. Each line checks the link itself, because a check run as its own command stops nothing.
test "$(cat supabase/.temp/project-ref 2>/dev/null)" = "<dev-ref>" && npx supabase migration list --linked && npx supabase db push --linked --dry-run
```

If that listing is already aligned, stop: record *no migration*. Otherwise read the dry run, then apply, as its own command:

```sh
test "$(cat supabase/.temp/project-ref 2>/dev/null)" = "<dev-ref>" && npx supabase db push --linked && npx supabase migration list --linked
```

**Production is its own run, only at a release and on the owner's go**, never in the same script or command list as development. It is never linked; its connection string comes from an operator file, never typed or printed. Read first:

```sh
npx supabase migration list --db-url "$PROD_DB_URL" && npx supabase db push --db-url "$PROD_DB_URL" --dry-run
```

Then, only once the dry run is read and the owner's go is in the chat, as its own command:

```sh
npx supabase db push --db-url "$PROD_DB_URL" && npx supabase migration list --db-url "$PROD_DB_URL"
```

For either target:

1. **List first.** If the listing is already aligned, record *no migration* and run no write command.
2. **Dry-run** to see exactly which files would run.
3. **Apply** (`db push`): production only after the owner's go.
4. **List again.** The second listing is the receipt, not the `db push` output, which reports what was attempted.

The file's timestamp must be the version the ledger records. The first migration is named after the version the ledger will record.

After applying, regenerate the types from that same target and run the tests. The integration suite reads the schema it expects.

**Why the link stays on development and production takes `--db-url`.** The target must be *stated*, never inherited from whatever a link or config file was last left pointing at, and the CLI's link is exactly such a file.

- **Observed `2026-10-23`:** `db push --linked --project-ref <production ref>` wrote to the *linked* project. A monitoring product's review found its production migration command could silently target the linked development project.
- **Probed `2026-10-25`:** with CLI 2.122.0 linked to one ref and `--project-ref` naming another (dummy refs, a fake token), the first request of `db push`, `migration list` and `db query` went to the typed ref. Where the database connection itself goes was not confirmed.
- **What the vendor says (read 2026-10-25):** Supabase's web CLI reference lists only `--linked`, `--local` and `--db-url` as targets for `db push` and `migration list`. The CLI's own `--help` (2.121.0 and 2.122.0) also lists `--project-ref`, described only as "Project ref of the Supabase project", and says nothing of which wins over `--linked`. The CLI is mid-rewrite, so behaviour can differ between versions.
- **So no command may depend on which flag wins.** Link once, to development, and never to production ("I'll just relink" is the mistake, not the fallback). Every production command, the ledger read included, takes `--db-url`. The same holds for `db query`.

**Hold it in a script**, because a rule a script can hold should be held by one. The wrapper:

- checks that the link names development before it writes, passes no `--project-ref` beside `--linked`, and refuses a requested ref that is not the linked one, rather than reporting about the wrong database (`2026-10-23`, the same product's wrapper after that review);
- refuses any option it does not read, so a mistyped `--dry-run` cannot become a real run;
- never prints the connection string, its password or the CLI's raw error.

**Who applies.** Development's migrations are the session agent's to apply without asking the owner, never a delegated builder's (it names the command), when nobody else depends on that project (no teammate working against it, no demo running on it, no data anyone needs); otherwise ask first. Production's are applied only at a release, on the owner's go. (`2026-10-22`, a monitoring product's owner, about a development project only they used: "This is dev. Nobody uses it.")

**Development migrations never establish production state.** Both ledgers are re-read, never remembered, and a count written down is a receipt for the moment it was taken.

## The MCP is for looking

The Supabase MCP server is for **looking** at tables, logs and advisors, against **development**.

- **Never apply a migration through it.** `apply_migration` timestamps the migration when it runs, so the ledger and the directory drift apart.
- **Its reads have the same edge.** `list_migrations` answers about whatever the MCP config names, so it can give a confident all-clear about the wrong database.
- **Check its URL before believing any answer about schema.** The config is gitignored and per machine, and the next clone may name a different target.

(`2026-09-16`, the MCP config named production while the product's rules still blessed migration writes through it.)

## Does a push apply migrations?

There are two cases, and the product's environments doc says which one it is in, with the date it was read.

- **Nothing applies migrations unless you configured it to.** The host (Netlify, for example) builds and ships code and never touches the database, and **nothing warns you**. Shipping code that calls a function production does not have is a 500 on every page that calls it. (`2026-09-16`, three migrations were absent from production through a handoff that called the release verified.)
- **Supabase's GitHub integration applies them when its *Deploy to production* option is on.** A push or merge to the git branch production tracks applies the new migrations in `supabase/migrations/`, and deploys the Edge Functions and Storage buckets declared in `config.toml`. Nothing orders that run against the host's build. (Supabase's GitHub integration docs, read 2026-10-25: the option is enabled in the integration's configuration, not on by default.)

**How to tell which case you are in:**

1. `npx supabase branches list --project-ref <prod-ref>` shows whether branching is on and which git branch the production branch tracks (`git_branch`).
2. Each push to that git branch then carries a *Supabase Preview* check on GitHub.
3. *Deploy to production* itself is visible only in the dashboard: *Project Settings → Integrations → GitHub*. **If nobody has read it, treat it as on.**

(`2026-10-24`, a monitoring product: production's project had branching on, tracking the production git branch, and every push there carried a passing *Supabase Preview* check; the option had never been read, so the product treats it as on.)

**Either way, apply by CLI before the push.** Production's ledger is read before every promotion, and pending files are applied by hand after the owner's go, immediately before the push. The push then finds nothing pending, so the build and a migration run cannot race. This is also why a file you do not mean to run must not sit in the directory (§ Files only).

## The window between apply and deploy

Applying before the push opens a window: between `db push` and the new build going live, the old code calls the new database. **"The old code" is every build still serving**: the app's, and each runtime deployed separately from it (a Worker, a worker box, a scheduled job elsewhere), which keeps the bundle it was last deployed with until someone deploys it again (`release-gate`). Write every migration so all of them survive it.

- **A replaced function keeps every parameter the deployed call passes**, with defaults for the new ones.
- **A new refusal is keyed to a state no existing row can hold.**
- **A renamed or dropped column or table cannot be made compatible that way**, because the deployed code still names the old one. Ship it in steps:
  1. Add the new one beside the old and keep them in step until no live build reads the old one, with a trigger that copies writes, or a view under the old name.
  2. Ship code that uses the new one.
  3. Drop the old one in a later migration, once that build is live.

  Or name the outage. **A one-time copy is not enough:** whatever the old build writes during the window never reaches the new one.
- **Tightening privileges under a running consumer has the same shape.** Apply the additive migration (the new functions); roll each consumer to the build that uses them, one at a time, confirming each; only then apply the revocation, parked outside the migrations directory until that moment. Once the revocation is applied, an older consumer build is no longer a rollback target. (`2026-10-22`, a monitoring product moved its worker boxes from table grants to functions this way on development: the additive migration, both boxes redeployed in turn, then the revocation.)

Ask two more questions of every pending file:

1. Does it delete or rewrite data?
2. Does the new code work before it is applied?

Name the window, anything that breaks inside it, and any one-time data effect in the go/no-go. A migration that drops and recreates something the old code calls breaks that code between the apply and the build finishing. Name that window once the product has users.

Receipts:

- `2026-09-21`, a live Q&A product: one of ten migrations refused a call the deployed code still made, so one action failed until the build finished.
- `2026-10-11`, a second product: a migration renamed a column the running build still read, so one action failed on a hosted development environment until its deploy finished.

## Before a promotion

These are the Supabase mechanics. The checklist they sit in is `release-gate`.

- **Every schema change is a migration file, no applied migration was edited, and the dashboard is untouched.**
- **`npx supabase migration list --db-url "$PROD_DB_URL"` shows no row with an empty `remote`.** Otherwise:
  1. `npx supabase db push --db-url "$PROD_DB_URL" --dry-run` names the pending rows.
  2. After the owner's go, they are applied by CLI, with that URL, immediately before the promotion.
  3. The list is re-run.
- **Going live the first time:** a production project separate from development. Every migration is applied to it with `--db-url` (a new project takes every file in one push), and the ledger is read again.
- **Never** apply a migration through the MCP or the dashboard, and never by linking the CLI to production.

## After the deploy

**The ledger check was taken before the promotion, so it cannot prove that the deployed code met the deployed schema.**

The proof is one read that reaches the database through an unguessable id that cannot exist. A public route answering **404** with the product's own not-found went to Postgres and back. Anything else has not proved it: the probe is recorded as failed, and its cause is found from the error code in the body before any production write (`release-gate`, checklist § 4).

- One request, no account, no write.
- Name that route in the coverage map (the product's list of what each test and smoke proves).
- Check every entry point that reads through the same function.

Mind the RPC status codes when choosing the probe. A product's own not-found must raise a `PTxxx` code, not `P0002`, and PostgREST's `PGRST202` is also a 404: no function the role can see matched the call (`gotchas.md`). So the probe reads the product's own not-found in what the route returns, never the status alone, and a `PGRST202` is not by itself a missing migration.

## Rollback

- **Schema is forward-only.** Never edit an applied migration; write a compensating one.
- **Code:** redeploy the previous build only once it is known to run against the current schema. Migrations are forward-only, so if one removed a column, a function signature or a grant the older build uses, a forward migration tested on development restores it first. Then fix forward on the product branch.
- The rest of rollback (configuration, leaked keys) is `release-gate` and `environments`.
