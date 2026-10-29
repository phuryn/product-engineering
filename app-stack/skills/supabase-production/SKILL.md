---
name: supabase-production
description: "A Supabase query, RPC or migration, 'db push', 'supabase link', RLS or grants, a Supabase error: server-only keys, deny-all RLS, migrations via the CLI."
---

# Supabase in production: the choices its own skills cannot make

Supabase's own agent skills know the API. They cannot decide how your product uses it: who holds a key, what RLS is for, how a migration reaches production, and whether a push applies one. Those decisions are here, with the incident that produced each.

They were learned on **Next.js (App Router) + Supabase Postgres + Clerk + Netlify**, across several products. Among them were a live Q&A product with an anonymous audience and a monitoring product that runs Workers and worker boxes beside the app, named here only by kind. **Where Supabase's defaults or quickstarts contradict this skill, this skill wins.**

The principles carry to any hosted Postgres. Under them:

- each runtime holds its own credential, and only the app server holds the one that bypasses RLS;
- isolation lives in code you can test;
- schema is files, applied to a target you state rather than one a config file remembers;
- a deploy and a migration are two separate acts unless an integration joins them, so know which you have.

## Supabase's own skills: get them, prefer them for the API

- **`supabase`** covers any Supabase task: client libraries, auth, the CLI, the MCP server, schema changes. **`supabase-postgres-best-practices`** covers anything that lives in Postgres: tables, types, indexes, functions, migrations, RLS. Both come from the GitHub repository `supabase/agent-skills`.
- **Install:** `npx skills add supabase/agent-skills`. This uses the open `skills` CLI, and the Supabase dashboard's *Connect → MCP* page offers the same command (observed 2026-08). Vendor them into the product's skills folder (`.claude/skills/` or `.agents/skills/`) so they load whenever Supabase is touched. Prefer them over training-era memory of the API.
- **Pin them.** A `skills-lock.json` at the repository root records each skill's source repository, its path and a content hash. `npx skills update` refreshes them on purpose, never by surprise.
- **What they will offer that this skill refuses:** `@supabase/ssr` and a key in the browser; RLS policies written to match an access model; applying a migration through the MCP; schema edits in the dashboard; `supabase link` to whichever project you are working on.

## The choices

1. **Only the app server holds the secret key.** One server-only module holds it, with no session persistence. No browser ever holds a Supabase key, so `@supabase/ssr`, the anon or publishable key in app code, and browser-side queries are all out, whatever the quickstarts show. **A second runtime that must reach the database** (a Worker, a worker box, a job on another host) **gets its own Postgres login, never the secret key:** one group role per component holding EXECUTE on that component's functions only, and one login per environment that cannot bypass RLS. A leaked login then does only what its component does. → `references/access-model.md § A second runtime`
2. **RLS is on with zero policies on every table: deny-all for every role that cannot bypass it.** RLS is therefore *not* the tenant isolation; the three authorization functions are (`saas-authorization`). Also:
   - revoke PUBLIC, `anon` and `authenticated` grants and the creator's default privileges, including Postgres's global default of EXECUTE to PUBLIC on new functions, which a per-schema revoke leaves in place;
   - make views `security_invoker = true`;
   - allow no `security definer` function except those a second runtime's login calls and a trigger that writes on a restricted writer's behalf (`transactional-email`), each with an empty `search_path`, pinned by exact signature in the catalog suite, and preferably in a schema the Data API does not expose;
   - have the catalog suite enumerate every schema it guards, future objects included.

   Legacy grants are pinned debt, never a default for new objects. (`2026-09-16`, a review round pinned legacy grants separately from new objects.) Supabase's skill will offer to write policies matching your access model; there is none to match. → `references/access-model.md`
3. **Supabase never sees the identity provider's token.** Writes stay server-side. The one exception worth reopening is Realtime subscribed from the browser. It would need Clerk as a third-party auth provider plus a read-only policy scoped to the public resource. Decide it when Realtime arrives (when polling's delay is the complaint), not before.
4. **Schema changes are migration files, nothing else.** They are ordered, idempotent, and never edited after they are applied. The dashboard is read-only. Keep `supabase/config.toml` minimal. **The schema is the source, not memory:** read the migrations newest first and the generated types before writing a query. → `references/migrations.md`
5. **A migration is applied by the CLI against a target you state, never through the MCP.**
   - `apply_migration` timestamps a migration when it runs, so the ledger and the directory drift apart.
   - **The target must be stated rather than inherited** from whatever a config file was last left pointing at, and the CLI's link is such a file. **Which wins when `--linked` and `--project-ref` disagree is not something to depend on:** on `2026-10-23` a monitoring product found `db push --linked --project-ref <production ref>` writing to the linked development project, while on `2026-10-25` a probe of CLI 2.122.0 saw the first request of `db push`, `migration list` and `db query` go to the typed ref. So the CLI stays linked to development for good, production is reached only with `--db-url`, for every command including `migration list`, and nobody runs `supabase link` against production. Then no command's target depends on which flag wins. (The CLI's help and docs, read 2026-10-25: `references/migrations.md § Applied by the CLI`.)

   Reads have the same edge: `list_migrations` answers about whatever the MCP's config names, so it can give a confident all-clear about the wrong database. (`2026-09-16`, the MCP config named production while the product's rules still blessed migration writes through it.)
6. **The MCP is for looking** at tables, logs and advisors, against **development**. Its config is per machine and the next clone may name a different target, so **check its URL before believing any MCP answer about schema**. Never use it for ad-hoc schema changes.
7. **Know whether a push applies migrations; never assume either way.** The host's deploy builds and ships code and never touches the database. **Supabase's GitHub integration does, when its *Deploy to production* option is on:** a push or merge to the git branch production tracks applies new migrations, racing the host's build (Supabase's docs, read 2026-10-25). How to tell which case you are in: `references/migrations.md § Does a push apply migrations?` In both cases, **at every promotion, read production's migration ledger and, after the owner's go, apply what is pending by CLI before the push**, so the push finds nothing to do. Shipping code that calls a function production does not have is a 500 on every affected page. (`2026-09-16`, three migrations were absent from production through a handoff that called the release verified. `2026-10-24`, a monitoring product found the integration attached to production with branching on; its five promotions that day found nothing pending, because each had applied by hand first.)
8. **Applying before the push opens a window where every build still serving meets the new schema**: the app's, and each separately deployed runtime's.
   - A replaced function keeps every parameter the deployed call passes.
   - A rename, a drop or a revoked grant that a deployed build still uses ships in steps, and the contracting migration waits **outside** `supabase/migrations/` until every runtime runs the build that no longer needs it, because the next push applies every file in that directory.
   - Name the window in the go/no-go.

   (`2026-09-21` and `2026-10-11`, one action failed in each product until the build finished. `2026-10-22`, a monitoring product: a grant revocation sat beside the additive migration, so one push would have applied both while its worker boxes still needed the grants.) → `references/migrations.md § The window`
9. **Separate development and production projects, each with its own key set.** The app refuses to boot on a partial configuration. Record the verified project and branch mapping with its date, and **never infer the target from an old MCP configuration or the CLI's link**. (`2026-09-15`: the former development project was promoted to production and a new development branch created.) → `references/projects-and-backups.md`
10. **Read the gotchas before writing a query, a migration or a connection string.** Server reads must never be cached. PostgREST will not guess an ambiguous embed. `create or replace` cannot widen a return type. A refused delete changed its SQLSTATE in Postgres 18. Some error codes answer with misleading HTTP statuses. The generated types call every argument without a default non-null. supabase-js needs a global `WebSocket`. The direct database host is IPv6-only, and TLS is whatever each URL asks for. The hosted development project fails intermittently in three costumes. → `references/gotchas.md`

## Applying a migration

```sh
# Development: the only project the CLI is ever linked to. <dev-ref> is the ref in the app's own
# SUPABASE_URL. Each line checks the link itself, because a check run as its own command stops nothing.
test "$(cat supabase/.temp/project-ref 2>/dev/null)" = "<dev-ref>" && npx supabase migration list --linked && npx supabase db push --linked --dry-run
```

If that listing is already aligned, stop: record *no migration*. Otherwise read the dry run, then apply, as its own command:

```sh
test "$(cat supabase/.temp/project-ref 2>/dev/null)" = "<dev-ref>" && npx supabase db push --linked && npx supabase migration list --linked
```

**Production is its own run, only at a release and on the owner's go**, never in the same script or command list as development. It is never linked, and is reached by its own connection string, kept in the production operator file outside the development checkout and loaded only into the command that uses it, never into the session's environment, which everything the agent starts inherits: run each command below as `( set -a; . <production operator file>; set +a; <command> )`. Read first:

```sh
npx supabase migration list --db-url "$PROD_DB_URL" && npx supabase db push --db-url "$PROD_DB_URL" --dry-run
```

Then, only once the dry run is read and the owner's go is in the chat, as its own command:

```sh
npx supabase db push --db-url "$PROD_DB_URL" && npx supabase migration list --db-url "$PROD_DB_URL"
```

- **The second listing is the receipt, not the `db push` output**, which reports only what was attempted.
- The file's timestamp must be the version the ledger records.
- If the first listing is already aligned, record *no migration* and run no write command.
- **Production's URL is never typed, printed or pasted into a chat.** It comes from an operator file that is never committed, percent-encoded, and is expanded from its variable on the operator's own machine only, because `--db-url` puts it in the process list while the command runs (`environments`, `references/variables.md`). A machine without IPv6 uses the session pooler (`gotchas.md`).
- **Development as a branch of production** (setup step 1's alternative): once setup step 5 passes the agent holds no token, so the development commands take `--db-url "$DEV_DB_URL"` in place of `--linked`, and the link check becomes a check that the URL names the development ref, without printing it: `case "$DEV_DB_URL" in *<dev-ref>*) ;; *) false ;; esac && npx supabase …` (a branch's connection string carries its own ref, in the pooler user `postgres.<ref>` or the host `db.<ref>.supabase.co`) (`references/migrations.md`).
- **Put the sequence behind a script**, because a rule a script can hold should be held by one: it checks that the link names development before it writes, passes no `--project-ref` beside `--linked`, refuses any option it does not read, and never echoes a value.
- **Development is the session agent's to apply without asking the owner when nobody else depends on it** (a delegated builder only names the command, `delegation`) (no teammate working against it, no demo running on it, no data anyone needs); otherwise ask, as for production. **Production only at a release, on the owner's go.** (`2026-10-22`, a monitoring product's owner, about a development project only they used: "This is dev. Nobody uses it.")
- Afterwards, regenerate the database types from that same target and run the tests: the integration suite reads the schema it expects.

## Before a promotion

Run `npx supabase migration list --db-url "$PROD_DB_URL"`. A row with an empty `remote` is a migration production has never seen.

1. Name the pending rows with the `--dry-run`.
2. Ask the window questions of each (`references/migrations.md § The window`), for the app and for every other runtime that reads the schema.
3. After the owner's go, apply them by CLI with production's `--db-url` (§ Applying a migration), immediately before promoting.
4. List again, then promote.

After the deploy, prove that code and schema agree with one read through an id that cannot exist (`references/migrations.md § After the deploy`). The release procedure around these steps is `release-gate`, which also covers the runtimes a push does not redeploy.

## Setting it up the first time

1. **A development project of its own**, so the token the agent holds for the CLI and the MCP reaches development alone: unless the token form lists a branch on its own, a token that reaches a development branch reaches production, its parent, too, and `supabase link` reads the project's secret key (`environments`, `references/domain-and-provider-access.md`). Production gets its own project at go-live (`release-gate`). A development branch inside the production project instead is the owner's choice: then the agent's token is time-boxed to steps 3 to 5 and revoked once step 5 passes, and afterwards development is reached by `--db-url` and the MCP server is removed (`claude mcp remove supabase`; § Applying a migration). Development is what `.env`, the CLI and the MCP point at from here on.
2. **Keys** from *Project Settings → API*: the project URL, the **secret** key, and the **publishable** key, which is for tests only. Keys go into `.env` and nowhere else, never into a chat; a key that touched a chat is rotated.
3. **The CLI:** the scoped token the owner issued goes in `SUPABASE_ACCESS_TOKEN`, set by the owner outside the chat, in the environment the agent starts in (a token pasted into the chat is revoked; set after the agent started, the session is restarted to inherit it, which in Claude Code `claude --resume`, picking this conversation, does without losing it). Never `supabase login`'s browser flow, which creates a token with the account's full access and is what the CLI falls back on when the variable is unset; if `supabase login` was ever run on this machine (in bash, `env -u SUPABASE_ACCESS_TOKEN npx supabase projects list >/dev/null 2>&1 && echo logged-in` prints `logged-in`), the owner runs `npx supabase logout` before linking, or the agent does on the owner's go, with `npx supabase logout --yes` (without `--yes` it asks, and a shell with no terminal answers no): it deletes the saved token and every database password the CLI saved on this machine, for every project, and revokes nothing; then the owner deletes that token in the account's access tokens (`environments`, `references/domain-and-provider-access.md`). Then link, once, in one command that stops when the variable is missing and never prints it: `test -n "$SUPABASE_ACCESS_TOKEN" && npx supabase link --project-ref <dev-ref>`. The link stays on development; production is never linked (§ The choices, 5).
4. **The MCP:** *Connect → MCP* in the dashboard generates the add command for your project; add the same token as a header, single-quoted so the shell writes the variable's name, not its value: `claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<dev-ref>&features=…" --header 'Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}'`. Check it without printing it: `grep -qF 'Bearer ${SUPABASE_ACCESS_TOKEN}' .mcp.json && echo ok`. Anything but `ok` means a value was written in: remove the server (`claude mcp remove supabase`), and the owner revokes that token and issues a new one. Claude Code expands the name from the environment it starts in. Not the browser sign-in, which grants the whole organization; one made before is signed out in the client and revoked by the owner in the Supabase account. Keep its config file out of git. The server loads in a new session: restart (`claude --resume`, picking this conversation), and the owner approves the project's `supabase` server when Claude Code asks, until `/mcp` shows it connected.
5. **Verify before building:** the MCP answers about the development ref, the CLI is linked to the same ref, the development database has no tables, and `.env` has no placeholders left.

The plan that introduces the database names the workspace table, the three functions and the first migration (`saas-authorization`).

## Keep a record of every dashboard setting

Anything configured in the dashboard rather than in code gets a dated record, a CLI or API read-back where one exists and a screenshot where none does, in the product's integration notes:

- the production project's branch list (the owner's read): which git branch production tracks, and which branch is development where the owner chose one;
- the GitHub integration, and whether *Deploy to production* is on;
- the backup and point-in-time-recovery settings;
- SSL enforcement and network restrictions;
- the third-party auth provider, if Realtime ever reopens the boundary.

**A screenshot records intended configuration, not the live value.** Re-read the live value (the CLI, the API) before relying on it.

## How you can tell it worked

Every schema change reached each database through a migration in the repository, no client key can read a table directly (the catalog test holds deny-all), and every dashboard setting is recorded.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/access-model.md` | the app server's client and its timeout; RLS deny-all, grants and their defaults, invoker views, the definer exceptions; a second runtime's login; what the permissions doc records; the Realtime exception; the integration and catalog suites and the rules that came from their bugs | creating the client; adding a table, view or function; giving another runtime database access; writing or debugging an RLS, grant or integration test |
| `references/migrations.md` | migration files and parking one that must wait; the CLI against a stated target; the ledger; the MCP's edge; whether a push applies migrations; the window between apply and deploy; after the deploy; rollback | writing, applying or reviewing a migration; any promotion |
| `references/projects-and-backups.md` | dev and prod projects and branches, the verified mapping, keys and variables, backups and restore drills, incidents and keys | setting up environments; touching keys; planning backups; an incident |
| `references/gotchas.md` | every query, connection and platform gotcha, each with its receipt | writing a query, an RPC, a migration or a connection string; a Supabase error that makes no sense; a flaky integration run |

## When something is learned

- A Supabase lesson true for any product goes here, with its receipt: the date, what happened, the product named by kind.
- A platform behaviour is dated ("observed 2026-10"), because Supabase changes without notice. When it changes, correct the line; never leave the old one beside the new.
- What is true of one product goes in its own environments doc: its refs, its Postgres majors, its ledger receipts.

**The product's records this skill writes to**, whatever the product calls them: its **integration notes** (each provider's configuration, as set and as last verified), its **environments doc** (which project is which, the migrations applied, and an environment log of dated events), its **permissions doc** (who may do what, and how the database enforces it), and its **backlog** (deferred work, each item with its reason and the trigger that reopens it).
