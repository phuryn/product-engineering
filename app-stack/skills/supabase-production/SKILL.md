---
name: supabase-production
description: "A Supabase query, RPC or migration, 'db push', 'supabase link', RLS or grants, a Supabase error: server-only keys, deny-all RLS, migrations via the CLI."
---

# Supabase in production: the choices its own skills cannot make

**Decide how the product uses Supabase before following API guidance.** Supabase's own agent skills know the API. They cannot decide key holders, RLS purpose, migration delivery or whether a push applies migrations. Those decisions are here.

**Where Supabase's defaults or quickstarts contradict this skill, this skill wins.** The mechanisms use Next.js (App Router), Supabase Postgres, Clerk and Netlify.

**Keep these principles on any hosted Postgres.** Under them:

- each runtime holds its own credential, and only the app server holds the one that bypasses RLS;
- isolation lives in code you can test;
- schema is files, applied to a target you state rather than one a config file remembers;
- a deploy and a migration are two separate acts unless an integration joins them, so know which you have.

## Supabase's own skills: get them, prefer them for the API

- **Use Supabase's own skills for its APIs and Postgres mechanics.** `supabase` covers any Supabase task: client libraries, auth, the CLI, the MCP server, schema changes. `supabase-postgres-best-practices` covers anything that lives in Postgres: tables, types, indexes, functions, migrations, RLS. Both come from the GitHub repository `supabase/agent-skills`.
- **Install and vendor the skills instead of relying on API memory.** Run `npx skills add supabase/agent-skills`. This uses the open `skills` CLI, and the Supabase dashboard's *Connect → MCP* page offers the same command (observed `2026-08`). Vendor them into the product's skills folder (`.claude/skills/` or `.agents/skills/`) so they load whenever Supabase is touched. Prefer them over training-era memory of the API.
- **Pin them.** A `skills-lock.json` at the repository root records each skill's source repository, its path and a content hash. `npx skills update` refreshes them on purpose, never by surprise.
- **Refuse vendor suggestions that contradict this skill.** These include `@supabase/ssr` and a key in the browser; RLS policies written to match an access model; applying a migration through the MCP; schema edits in the dashboard; `supabase link` to whichever project you are working on.

## The choices

1. **Only the app server holds the secret key.** One server-only module holds it, with no session persistence. No browser ever holds a Supabase key, so `@supabase/ssr`, the anon or publishable key in app code, and browser-side queries are all out, whatever the quickstarts show. **Give every other database runtime its own Postgres login, never the secret key.** For a Worker, worker box or job on another host, use one group role per component holding EXECUTE on that component's functions only, and one login per environment that cannot bypass RLS. A leaked login then does only what its component does. → `references/access-model.md § A second runtime`
2. **RLS is on with zero policies on every table: deny-all for every role that cannot bypass it.** RLS is therefore *not* the tenant isolation; the three authorization functions are (`saas-authorization`). Also:
   - revoke PUBLIC, `anon` and `authenticated` grants and the creator's default privileges, including Postgres's global default of EXECUTE to PUBLIC on new functions, which a per-schema revoke leaves in place;
   - make views `security_invoker = true`;
   - allow no `security definer` function except those a second runtime's login calls and a trigger that writes on a restricted writer's behalf (`transactional-email`), each with an empty `search_path`, pinned by exact signature in the catalog suite, and preferably in a schema the Data API does not expose;
   - have the catalog suite enumerate every schema it guards, future objects included.

   Legacy grants are pinned debt, never a default for new objects. Supabase's skill will offer to write policies matching your access model; there is none to match. → `references/access-model.md`
3. **Supabase never sees the identity provider's token.** Writes stay server-side. The one exception worth reopening is Realtime subscribed from the browser. It would need Clerk as a third-party auth provider plus a read-only policy scoped to the public resource. Decide it when Realtime arrives (when polling's delay is the complaint), not before.
4. **Schema changes are migration files, nothing else.** They are ordered, idempotent, and never edited after they are applied. The dashboard is read-only. Keep `supabase/config.toml` minimal. **The schema is the source, not memory.** Read the migrations newest first and the generated types before writing a query. → `references/migrations.md`
5. **A migration is applied by the CLI against a target you state, never through the MCP.**
   - **Keep ledger versions aligned by applying migrations through the CLI.** `apply_migration` timestamps a migration when it runs, so the ledger and directory drift apart.
   - **The target must be stated rather than inherited.** State it rather than using a config file's last destination. The CLI's link is such a file. **Which wins when `--linked` and `--project-ref` disagree is not something to depend on.** Precedence has differed between observations. So the CLI is never linked: every command, `migration list` included, names its database with `--db-url`, development's or production's, and nobody runs `supabase link`. Then no command's target depends on which flag wins, and the CLI needs no token. (The CLI's help and docs, read `2026-10-25`: `references/migrations.md § Applied by the CLI`.) **Pin a 2.x CLI release until all commands migrate together.** CLI 3.0.0 (publication date observed as `2026-11-02`) deprecates `--db-url` and `--linked` for `--remote=<url>`, with removal in v4: pin a 2.x release as a development dependency, the version these commands were read against, and move every command in one change when you upgrade (`references/migrations.md § Applied by the CLI`).

   Reads have the same edge: `list_migrations` answers about whatever the MCP's config names, so it can give a confident all-clear about the wrong database.
6. **The MCP is for looking.** Inspect development tables, logs and advisors only. Its config is per machine and the next clone may name a different target, so check its URL before believing any MCP answer about schema. Never use it for ad-hoc schema changes.
7. **Know whether a push applies migrations; never assume either way.** The host's deploy builds and ships code and never touches the database. Supabase's GitHub integration applies migrations when *Deploy to production* is on: a push or merge to the git branch production tracks applies new migrations, racing the host's build (Supabase's docs, read `2026-10-25`). How to tell which case you are in: `references/migrations.md § Does a push apply migrations?` In both cases, at every promotion, read production's migration ledger and, after the owner's go, apply pending migrations by CLI before the push, so the push finds nothing to do. Shipping code that calls a function production does not have is a 500 on every affected page.
8. **Keep new schema compatible with every build still serving.** Applying migrations before pushing opens a window for the app and every separately deployed runtime.
   - **Keep every parameter the deployed call passes when replacing a function.**
   - **Keep contracting migrations outside `supabase/migrations/` until every runtime has moved.** Ship renames, drops and grant revocations still used by deployed builds in steps. Wait until every runtime runs the build no longer needing them: the next push applies every file in that directory.
   - **Name the compatibility window in the go/no-go.**

   Read `references/migrations.md § The window`.
9. **Separate development and production projects, each with its own key set.** The app refuses to boot on a partial configuration. Record the verified project and branch mapping with its date, and never infer the target from an old MCP configuration or the CLI's link. → `references/projects-and-backups.md`
10. **Read the gotchas before writing a query, a migration or a connection string.** Server reads must never be cached. PostgREST will not guess an ambiguous embed. `create or replace` cannot widen a return type. A refused delete changed its SQLSTATE in Postgres 18. Some error codes answer with misleading HTTP statuses, and a conflict raised as `40001` can arrive with no code at all. A plpgsql loop variable named like a table alias, and an array bound to a `jsonb` parameter in node-postgres, fail only at runtime. The generated types call every argument without a default non-null. supabase-js needs a global `WebSocket`. The direct database host is IPv6-only, and TLS is whatever each URL asks for. The hosted development project fails intermittently in three costumes. → `references/gotchas.md`

## Scheduled SQL with `pg_cron`

**Make scheduled SQL safe on every database its migration reaches.** A `cron.schedule` also reaches development branches. It runs as its scheduler (`cron.job.username`); read that role's `rolbypassrls`. If it bypasses RLS, the job's SQL is its only authorization (read `2026-11-07`).

**Assert scheduled jobs through the catalog suite's available route.** Enumerating `public` misses `cron`. On the CLI route (`references/access-model.md` § The schema catalog suite), assert each job's name, schedule and command. Read failures from `cron.job_run_details`. Through the data API, the service role sees neither: pg_cron shows a role only its own jobs, and `cron` is not exposed (observed `2026-11-07`). A definer function exposing them breaks the invoker rule. There, write the run's time in the transaction doing the work. Test that the newest is within a few intervals; `/health` can report the same record.

**Give it an outside witness.** Apply `uptime-monitoring`. Either ping the monitor's heartbeat URL on success through `pg_net`, keeping the secret URL in Vault, never a committed migration. Or report the newest successful run's age in `/health` and assert it in the monitor.

## Applying a migration

**Check the database URL inside the same command that uses it.** A separate check stops nothing.

```sh
# Development. <dev-ref> is the ref in the app's own SUPABASE_URL. Each line loads development's
# connection string into itself alone and checks, without printing it, that it names <dev-ref>,
# because a check run as its own command stops nothing.
( . <development operator file> && case "$DEV_DB_URL" in *<dev-ref>*) ;; *) false ;; esac && npx supabase migration list --db-url "$DEV_DB_URL" && npx supabase db push --db-url "$DEV_DB_URL" --dry-run )
```

**Stop if the listing is aligned and record no migration.** Otherwise read the dry run, then apply as its own command:

```sh
( . <development operator file> && case "$DEV_DB_URL" in *<dev-ref>*) ;; *) false ;; esac && npx supabase db push --db-url "$DEV_DB_URL" && npx supabase migration list --db-url "$DEV_DB_URL" )
```

**Production is its own run, only at a release and on the owner's go.** Never in the same script or command list as development. Keep production's own connection string in its operator file outside the development checkout. Load it only into the command using it, never the session's environment, which everything the agent starts inherits. Run each command below as `( . <production operator file> && test -n "$PROD_DB_URL" && <command> )`, which expands the string without exporting the file's other values. With `;`, bash runs the command after a file that failed to load. An empty `--db-url` goes to whatever database the shell's `PG*` variables name, or to localhost (Supabase CLI 2.122.0, observed `2026-10-29`). The shell reads the file, so single-quote every value; a `'` inside one written `'\''` (`PROD_DB_URL='postgresql://…?sslmode=verify-full&sslrootcert=…'`). Unquoted, the `&` joining the URL's parameters ends the assignment and the variable comes out empty. Read first:

```sh
npx supabase migration list --db-url "$PROD_DB_URL" && npx supabase db push --db-url "$PROD_DB_URL" --dry-run
```

**Apply production only after reading the dry run and getting the owner's go in the chat.** Run this as its own command:

```sh
npx supabase db push --db-url "$PROD_DB_URL" && npx supabase migration list --db-url "$PROD_DB_URL"
```

- **The second listing is the receipt, not the `db push` output.** The push output reports only what was attempted.
- **Match the file's timestamp to the version the ledger records.**
- **Run no write command when the first listing is already aligned.** Record *no migration*.
- **Production's URL is never typed, printed or pasted into a chat.** It comes from an operator file that is never committed, percent-encoded, and is expanded from its variable on the operator's own machine only, because `--db-url` puts it in the process list while the command runs (`environments`, `references/variables.md`). A machine without IPv6 uses the session pooler (`gotchas.md`).
- **Use the same commands for development as a production branch.** For setup step 1's alternative, a branch's connection string carries its own ref, in the pooler user `postgres.<ref>` or the host `db.<ref>.supabase.co`, so the check above holds (`references/migrations.md`).
- **Put the sequence behind a script.** A script should hold every rule it can: it checks that the URL names development before it writes, passes neither `--linked` nor `--project-ref`, refuses any option it does not read, and never echoes a value.
- **Apply development without asking only when nobody else depends on it.** This is the session agent's job; a delegated builder only names the command (`delegation`). Require no teammate working against it, no demo running on it and no data anyone needs. Otherwise ask, as for production. **Production only at a release, on the owner's go.**
- **Regenerate database types from the same target and run tests afterwards.** The integration suite reads the schema it expects.

## Before a promotion

**Read production's migration ledger before every promotion.** Run `npx supabase migration list --db-url "$PROD_DB_URL"`, loading the production operator file into that command alone (§ Applying a migration). A row with an empty `remote` is a migration production has never seen.

1. **Name every pending row with the dry run.** Use `--dry-run`.
2. **Ask the compatibility-window questions for every pending migration and runtime.** Ask each (`references/migrations.md § The window`), for the app and for every other runtime that reads the schema.
3. **Apply pending migrations immediately before promoting, after the owner's go.** Use the CLI with production's `--db-url` (§ Applying a migration).
4. **List the ledger again before promoting.** Then promote.

**Prove code and schema agree after the deploy.** Use one read through an id that cannot exist (`references/migrations.md § After the deploy`). The release procedure around these steps is `release-gate`, which also covers the runtimes a push does not redeploy.

## Setting it up the first time

1. **Use a separate development project unless the owner chooses a branch.** What the agent holds for development should reach development alone: unless the token form lists a branch on its own, a token that reaches a development branch reaches production, its parent, too (`environments`, `references/domain-and-provider-access.md`). Production gets its own project at go-live (`release-gate`). A development branch inside the production project instead is the owner's choice: then the MCP's token (step 4) is time-boxed to steps 4 and 5 and revoked once step 5 passes, and the MCP server is removed (`claude mcp remove supabase`). Development is what `.env`, the CLI's connection string and the MCP point at from here on.
2. **Keep keys and the connection string outside chat and committed files.** From *Project Settings → API*: the project URL, the secret key, and the publishable key, which is for tests only. Keys go into `.env` and nowhere else, never into a chat; a key that touched a chat is rotated. From *Connect*: development's database connection string (the session pooler on a machine without IPv6, `references/gotchas.md`), which the owner saves outside the chat in a development operator file that is never committed, single-quoted as production's is (§ Applying a migration): `DEV_DB_URL='postgresql://…'`.
3. **The CLI is never linked, and needs no token.** Every command the build runs (`db push`, `migration list`, `db query`, `gen types`) names its database with `--db-url`, loaded from the operator file into that command alone (§ Applying a migration). Pin it as a development dependency (§ The choices, 5). Never `supabase link`, which leaves a target behind in a file and needs a token permission that reveals the project's secret key, and never `supabase login`'s browser flow, which creates a token with the account's full access; if it was ever run on this machine, the owner signs it out and deletes that token (`environments`, `references/domain-and-provider-access.md`, which has the check).
4. **Use the optional MCP only for looking, with its own token.** It is the one part that needs a token. The owner issues a scoped token for the development project alone, read-only, and sets it in `SUPABASE_ACCESS_TOKEN` outside the chat, in the environment the agent starts in (a token pasted into the chat is revoked; set after the agent started, the session is restarted to inherit it, which in Claude Code `claude --resume`, picking this conversation, does without losing it). *Connect → MCP* in the dashboard generates the add command for your project; add the token as a header, single-quoted so the shell writes the variable's name, not its value: `claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<dev-ref>&read_only=true&features=…" --header 'Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}'`. Check it without printing it: `grep -qF 'Bearer ${SUPABASE_ACCESS_TOKEN}' .mcp.json && echo ok`. Anything but `ok` means a value was written in: remove the server (`claude mcp remove supabase`), and the owner revokes that token and issues a new one. Claude Code expands the name from the environment it starts in. Not the browser sign-in, which grants the whole organization; one made before is signed out in the client and revoked by the owner in the Supabase account. Keep its config file out of git. The server loads in a new session: restart (`claude --resume`, picking this conversation), and the owner approves the project's `supabase` server when Claude Code asks, until `/mcp` shows it connected. Without the MCP the agent has no logs or advisors; everything else works.
5. **Verify the development target and configuration before building.** Require `migration list` through `DEV_DB_URL` answers, with the URL checked to name the development ref (§ Applying a migration); the MCP, where there is one, answers about the same ref; nothing is linked (`supabase/.temp/project-ref` does not exist); the development database has no tables; and `.env` has no placeholders left.

**Name the workspace table, three functions and first migration in the plan.** Do this in the plan introducing the database; apply `saas-authorization`.

## Keep a record of every dashboard setting

**Record every dashboard setting with its verification date.** Use CLI or API read-backs where available, screenshots where not, in the product's integration notes:

- the production project's branch list (the owner's read): which git branch production tracks, and which branch is development where the owner chose one;
- the GitHub integration, and whether *Deploy to production* is on;
- the backup and point-in-time-recovery settings;
- SSL enforcement and network restrictions;
- the third-party auth provider, if Realtime ever reopens the boundary.

**A screenshot records intended configuration, not the live value.** Re-read the live value (the CLI, the API) before relying on it.

Each rule's origin, the case that taught it, is in `receipts.md` beside this file; read it when a rule's edge is unclear.

## How you can tell it worked

Every schema change reached each database through a repository migration. No client key can read a table directly (the catalog test holds deny-all), and every dashboard setting is recorded.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/access-model.md` | the app server's client and its timeout; RLS deny-all, grants and their defaults, invoker views, the definer exceptions; a second runtime's login; what the permissions doc records; the Realtime exception; the integration and catalog suites and the rules that came from their bugs | creating the client; adding a table, view or function; giving another runtime database access; writing or debugging an RLS, grant or integration test |
| `references/migrations.md` | migration files and parking one that must wait; the CLI against a stated target; the ledger; the MCP's edge; whether a push applies migrations; the window between apply and deploy; after the deploy; rollback | writing, applying or reviewing a migration; any promotion |
| `references/projects-and-backups.md` | dev and prod projects and branches, the verified mapping, keys and variables, backups and restore drills, incidents and keys | setting up environments; touching keys; planning backups; an incident |
| `references/gotchas.md` | every query, connection and platform gotcha, each with its receipt | writing a query, an RPC, a migration or a connection string; a Supabase error that makes no sense; a flaky integration run |

## When something is learned

- **Keep general Supabase lessons here with their receipts.** Include the date, what happened, the product named by kind.
- **Date platform behaviour because Supabase changes without notice.** Use "observed 2026-10". When it changes, correct the line; never leave the old one beside the new.
- **Keep product-specific facts in its own environments doc.** Include its refs, its Postgres majors, its ledger receipts.

**Write to the product's own records, whatever it calls them.** Integration notes hold each provider's configuration, as set and as last verified. The environments doc holds project identities, applied migrations and a dated environment-event log. The permissions doc records who may do what and how the database enforces it. The backlog holds deferred work, each with its reason and reopening trigger.
