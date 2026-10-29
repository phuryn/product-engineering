---
name: environments
description: "Adding a variable or secret, 'set up production', a domain or a provider token, 'which database is this', a leaked key: dev and production for an AI-built app, backups, incidents."
---

# Environments — development, production, and what moves between them

Two of everything, never mixed, and every claim about which is which written down with the date it was checked. This skill is how the environments are kept apart, how configuration and secrets enter them and leave them, how a schema change meets the code that is already serving, and what to do when something leaks, breaks or has to be rebuilt.

The rules were learned on Next.js (App Router) + Supabase + Clerk + Netlify, by several products: a live Q&A product, a monitoring product that also runs Workers and worker boxes, and others, named here only by kind. Each states its principle first and the stack's mechanism second; on another stack, keep the principle and swap the mechanism. **The product's own instructions come first** — where they name its environments doc, variables doc or branches, follow them.

**The product's records this skill writes to**, whatever the product calls them:

- the **environments doc**: which resource each environment uses, verified and dated, ending in the **environment log**, one row per environment event;
- the **variables doc**: one row per variable, and where every copy of each secret lives;
- the **env schema**: the one module that validates configuration, at build and at boot;
- **`.env`**, the local configuration, never committed, and **`.env.example`**, its committed list of placeholders;
- the **backlog**: deferred work, each item with its reason and the trigger that reopens it.

## What binds

- **The target is stated, never inferred.** Every command that reads or writes an environment names it (a project ref, a URL, an instance) rather than inheriting it from whatever a config file was last left pointing at. A per-machine, gitignored config (an MCP server's, a CLI's link) may name production today and development tomorrow, and a CLI given both a link and a typed ref may follow either. So production is never the linked target: it is reached by its own connection string, and no command depends on which flag wins. (`2026-09-16`, an MCP configuration named production while the product's instructions still blessed migration writes through it. `2026-10-23`, a monitoring product found `db push --linked` with production's ref writing to the linked development project; `2026-10-25`, a probe of the current CLI saw the first request go to the typed ref instead.) **Operator tooling has no production default:** a command that writes to something both environments share (one DNS zone, one account) refuses to run until its target is named. `references/environments-and-branches.md § Operator commands`; the database mechanics are `supabase-production`.
- **Separate development and production resources and key sets**, none shared, **operator credentials included**: one provider token or SSH key in both environments' files means a leak from any development checkout reaches production. (`2026-10-24`, a monitoring product's inventory found the same DNS-provider token, cloud token and root SSH key in both.) The app **refuses to build and to boot on a partial configuration**. Production's generated secrets are generated afresh, never copied from development.
- **Record the verified mapping — which resource each environment uses — with the date it was checked**, and the command that showed it. Re-read it, never remember it: mappings move. (`2026-09-15`, a product's former development database was promoted to production and a new development branch created.) A line in the environments doc still holding a placeholder is a thing that has not happened yet.
- **Secrets are never in the repository, a URL, a log line, a command line or a client bundle.** Every module that imports one is marked server-only (on Next.js, `import "server-only"`), so a client import fails the build. Only `NEXT_PUBLIC_*` values reach the browser.
- **Every new environment variable gets three things in the same change**: a placeholder in `.env.example`, a row in the variables doc, and a line in the env schema that fails when it is missing. **The schema runs at build and dev start, not only at boot**, because a `NEXT_PUBLIC_*` value is inlined into the client bundle when the build runs, and a boot check comes after the leak. It checks each key's shape where the vendor gives one and **never echoes a value**. (`2026-10-10`, a product's `.env` held the Clerk secret key in the publishable variable; caught before anything was built with it.) `references/variables.md`.
- **A value you generate rather than fetch is generated now.** A cookie-signing secret, a token pepper, anything of that shape: generate it, write it into `.env`, and name it in your summary. Nobody can look that value up, so a placeholder left empty is a boot failure with no instruction attached to it. **One that seals or tags stored data can never be replaced without breaking that data**: keep a copy off the operator's machine (`references/variables.md § The kinds of variable`).
- **Know whether a push applies migrations, and apply them by hand before the push** (production's after the owner's go). Applying before the push opens a window where every build still serving, the app's and each separately deployed runtime's, meets the new schema. Every pending migration is written to survive that window, a contracting one waits outside the migrations directory until every runtime has moved past it, or the outage is named in the go/no-go. `references/migrations-window.md`.
- **A tunnel's address is public.** Development only, the link to the owner and nowhere else (never a deployed runtime's configuration), closed when the owner is done. `references/environments-and-branches.md § Showing development to the owner`.
- **Every holder keeps its own copy of a secret**: the host, each Worker, each box, and the operator's `.env` that a deploy uploads again. Keep a map of every copy. **A planned rotation revokes last:** make the new value beside the old, put it into every holder and deploy each, check it works, then revoke the old one. Revoking first breaks whatever still holds the old value, and a deploy from an operator file not yet updated puts the old value back. (`2026-10-24`, a monitoring product rotated its identity provider's production key on the app's host only; a Worker still held the old key, so deleting it would have silently stopped members' email.) A push redeploys only the app; the rest is `release-gate`. `references/variables.md § Where every copy lives`, `§ Rotating`.
- **A leaked key is the same order, done at once**, and written in the environment log. If it is being used against you, revoke first and accept that every holder fails until it has the new value. If a build or a dev server ever ran with a secret in a public variable, that secret was served: rotate it.
- **A backup is *not verified* until a restore drill has run**, with its date and result recorded. A provider's schedule is not evidence, and **a database backup is not the system**: list what no backup holds and how each comes back. Once the product runs more than its host builds, keep a runbook for rebuilding both environments from nothing. `references/data-and-incidents.md § Backups and restore`, `references/rebuild-from-nothing.md`.
- **No screen and no legal page promises automatic deletion until the job that deletes exists.**

## When you are…

| When you are… | Read |
|---|---|
| setting up an environment, recording which database or instance is which, naming branches, writing an operator command | `references/environments-and-branches.md` |
| showing a change to the owner before it is deployed | `references/environments-and-branches.md § Showing development to the owner` |
| adding, renaming or reading an environment variable; adding a secret; before go-live | `references/variables.md` |
| pointing a domain at the product; giving the agent a provider's token; which host goes behind a proxy; before the first users | `references/domain-and-provider-access.md` |
| rotating a key; finding every place a secret is held | `references/variables.md § Where every copy lives`, `§ Rotating` |
| writing a migration the deployed code will meet; renaming or dropping a column; revoking a grant; promoting a release with pending migrations | `references/migrations-window.md` |
| promising retention, deleting a workspace, listing what is held about people, backups, an incident, a leaked key, writing the environment log | `references/data-and-incidents.md` |
| rebuilding an environment from empty accounts, or writing the runbook for it | `references/rebuild-from-nothing.md` |

## How you can tell it worked

Every variable the code reads is in the variables record with where it lives in each environment, development never reaches production's data, and a leaked key would be retired by one rotation.

## Files

| File | Holds |
|---|---|
| `references/environments-and-branches.md` | the environments table; recording the verified mapping and the inventory; branches and sites; operator commands; showing development to the owner through a Cloudflare quick tunnel |
| `references/variables.md` | the variables doc's columns; the kinds of variable and how each is handled; the env schema's contract; setting values on the host; where every copy lives; rotating; the pre-go-live checklist |
| `references/domain-and-provider-access.md` | who creates and scopes each provider credential and what stays the owner's; the domain's order, from the nameservers to a certificate; proxy or DNS-only per host; what to tighten before the first users |
| `references/migrations-window.md` | whether a push applies migrations; the window between applying a migration and every runtime's new build going live; compatible changes; expand and contract, for columns and for grants; what to name in the go/no-go |
| `references/data-and-incidents.md` | data that expires; what we hold about people; backups, and what no backup holds; incident basics, the symptom table and panic buttons; a leaked key; the environment log |
| `references/rebuild-from-nothing.md` | the runbook for recreating both environments from empty accounts: what the repository cannot reproduce, the order, and what each step needs |

Related skills: `release-gate` (the release checklist, rollback, the runtimes a push does not redeploy, Netlify's edge) · `supabase-production` (the migration ledger, the CLI's link and `--db-url`, a second runtime's database login, database gotchas) · `clerk-production` (the production instance, its keys and DNS) · `transactional-email` (one provider server per environment, the development redirect) · `test-harness` (the harness's own variables and the pinned `.env`) · `saas-authorization` (the threat model the secrets rules come from) · `shipping-artifacts` (the variables doc as a reviewer reads it).
