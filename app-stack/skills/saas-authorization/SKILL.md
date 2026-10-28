---
name: saas-authorization
description: "Adding sign-in, a role, a route that touches data, API tokens, a webhook or job, or 'is this secure': who may do what in a multi-tenant SaaS."
---

# SaaS authorization: who may do what, and the threats every app has

How a multi-tenant app decides who may act on what, and the classes of threat every such app has whatever it does. The rules were learned building several products with coding agents on **Next.js (App Router) + Supabase Postgres + Clerk + Netlify**. Among them were a live Q&A product with an anonymous audience and a monitoring product with API tokens and background workers. Each rule carries the date and the incident that produced it. They appear here only as examples, named by kind.

Every principle is stated first so that it holds on any stack. The Clerk, Supabase or Next mechanism comes second; a reader on another stack keeps the principle and substitutes their own mechanism. The vendor mechanics in depth are in `clerk-production` and `supabase-production`.

## What binds, in order

1. **The product's declared shape.** What a workspace is (an organization, or one user), whether it bills, whether it has an anonymous public, whether it embeds agents. Everything below reads through it. Write it down before the first migration, in the product's agent instructions, where every session reads it.
2. **This skill:** the model and the threat classes.
3. **The product's permissions doc**, the capability × actor matrix (`references/documents-and-tests.md`). It is the intent an audit compares the code against (`intended-vs-implemented`, `security-audit-static`). Beside it sit the architecture doc (what exists: routes, ownership, invariants, known risks), the flows doc (the journeys where permissions, money or personal data are exercised) and the backlog (deferred work, each with the trigger that reopens it). What each must say about authorization is in the same file; `shipping-artifacts` defines the core set.
4. **The vendors' own agent skills, for the API only, never for the access model.** Where their defaults contradict this skill, this skill wins. Examples: RLS policies written to match an access model, `@supabase/ssr` and a browser key, a middleware path list deciding who may see a page.

## The model on one page

The full rule, its reason and its receipt for each is in `references/model.md`.

1. **Everything belongs to a workspace, and the product keys on its own row.** Every domain table hangs off a workspace or off something that does. Only the `workspaces` table holds the identity provider's org or user id, so a change of provider is a migration of one table.
2. **Two credentials, never mixed.** A member session, verified server-side on every request and never decoded and trusted. An anonymous token (a cookie: random, one row per token, hash stored), only when the product has an anonymous public. Member routes never trust the token; public routes never read session claims; no route carries both.
3. **Deterministic code decides whatever crosses a trust boundary or can't be taken back:** authorization, money, sending, deleting, changing someone's records. A screen, a client, a prompt or a model may *propose* the action; a tool, a constraint, a hook or the orchestration code decides it. A two-way door can rest on judgement. A one-way door cannot.
4. **Three functions carry the model; no route reads raw claims.** `resolve<Thing>(publicId)` → the thing and its workspace. `requireVisitor(thingId, cookie)` → the anonymous visitor row. `requireWorkspaceAccess(workspaceId, auth, permission)` → throws unless the caller holds that permission in *that* workspace.
5. **Check permissions, not roles.** Permissions are strings; roles map to them. A screen gates a control on the *same* permission its action checks, not on a neighbouring one the same roles hold today. (`2026-09-16`, a control was shown under one permission while its action checked another.)
6. **What a screen *says* is gated too.** Assert it as a capability: no state offers this caller anything their permissions withhold. (`2026-09-17`, two lifecycle states promised the second role actions reserved for the first.)
7. **The active-organization claim says where the caller is acting, not who owns what they asked for.** Resolve the resource from the URL, find its workspace, then check membership.
8. **Entitlements come from billing, read on the server.** No permission or quota decision reads them from your database or a client claim. A caller with no session reads the subscription for the plan, and the provider's plan list for that plan's features, never the subscription's embedded copy. A background worker that must know a plan may read a mirror the app writes only from a verified read, and only to route work. Gate on features, not plan names, and fail towards the free tier.
9. **Roles and entitlements never touch.** A role says *who may act*; a feature says *how much*. A feature never decides which member may act, and a role never carries a limit. Gate a capability on a feature and a lapsed card removes it mid-session. Sell scale, not permission.
10. **Invariants are database constraints, not application code.** A once-only action is a primary key. A quota is checked inside the transaction that creates the thing. A missing quota is an error, never an entitlement (`2026-09-16`). A limit of N is a lock and a count, and then every write must go through the function (`2026-09-03`).
11. **Ids in URLs are unguessable, and not-found and not-owned return the same 404.**

## The threat classes

| Class | The rule | Depth |
|---|---|---|
| Untrusted text | Plain text unless rich text is needed, and then a server-side allowlist sanitizer. Validate shape on client and server, and escape on render. A CSP header. An origin check on every mutation, reading `Sec-Fetch-Site` first. Every route handler reads its body through one helper that has its own byte ceiling, counted while the body streams | `references/threat-model.md § Untrusted text` |
| Abuse and floods | Per-IP flood limits at the host's edge (one rule per surface: member, public). Per-actor budgets in the app, answered by `429` + `Retry-After` or a structured delay. One client wrapper for refused calls. Turnstile only where abuse shows | `§ Abuse and floods` |
| Cross-tenant access | Every query scoped by workspace through the three functions, and a cross-tenant test on every route that touches data | `§ Cross-tenant access` |
| Origin bypass | A secret header from the proxy, checked by the app. It needs a host that accepts a proxy. Until then, trust no forwarded header | `§ Origin bypass` |
| Leaked tokens | `prefix_<kid>.<secret>`, stored as `kid` + `HMAC(pepper, owner ‖ secret)`. Shown once, compared in constant time, revoked by tombstone. Scoped and workspace-owned | `§ Leaked tokens and credentials` |
| Leaked database | Ids and hashes, not identities: no emails, no profile copies, no IPs. Logs hold ids, never bodies | `§ Leaked database` |
| Anonymous identity | The token *is* the visitor. A surface that needs enforceable identity refuses to work without the cookie, and says what the cookie is for | `§ Anonymous identity` |
| Webhooks | Verify signatures, handle replays idempotently, process only events you own | `§ Webhooks` |
| Scheduled work | No public cron endpoint. Each run idempotent: a unique key per run, or a receipt per unit of work claimed under a lease | `§ Scheduled work` |
| Secrets | Never in the repo, a URL, a log line or a client bundle. `server-only` on every module that imports one. A leaked key is rotated before anything else; a planned rotation reaches every holder before the old value is revoked | `§ Secrets` |
| Embedded agents | What an agent can do is bounded by its tools, never by its prompt. Each run and each actor has a cost ceiling | `§ Embedded agents` |

## Order of work

- **The plan that introduces the database names the workspace table, the three functions and the first migration.** Screens built before it read fixtures behind the seams the real system will use, never invented persistence.
- **The first real slice is done when** two members of different workspaces cannot see each other's data. Where there is an anonymous public, a visitor takes the public action from a phone without an account. The once-only action is refused the second time. `<script>alert(1)</script>` renders as text. Its tests and its permissions doc land in the same change.
- **Every later change that touches sign-in, workspaces, roles, a route or a permission**: the three functions, the same permission on the screen as in the action, and a cross-tenant test. The permissions doc changes in the same commit.
- **A new role or a paid tier**: decide which question it answers (who may act, or how much) before writing any code. A role goes into the permission map. A feature goes into the plan module and a quota parameter, never into a permission (`references/model.md § Roles and entitlements never touch`).
- **Before a release**, propose the static security audit (`security-audit-static`) on the release's changes; it compares code against the permissions doc. The release procedure itself is `release-gate`.

## Required for every feature that touches data

- **Cross-tenant:** a member of workspace A, holding B's ids, is refused with the same 404 as a missing id.
- **The invariant:** the once-only action refused the second time; the quota under a race (ten simultaneous creates against a limit of one leave exactly one winner).
- **The sanitizer:** a script tag renders as text.
- **Idempotency:** runs twice, acts once.
- **Token scope:** a token does only what its scope and its workspace allow.

A denial test must prove it reached the check it claims to test. A `404` from a function that does not exist passes for an ownership check that works (`references/documents-and-tests.md § Rules that came from bugs`). Which harness runs each test is `test-harness`.

## How you can tell it worked

A member of one workspace, holding another workspace's ids, can neither see nor change its data, and a test in the gate proves it.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/model.md` | workspaces and the two shapes; the two credentials; deterministic enforcement; the three functions; the active organization; permissions and roles, and what screens show and say; entitlements; roles vs entitlements; invariants as constraints; unguessable ids and public reads | adding sign-in, a workspace, a role, a permission, a plan limit, or any route that touches data |
| `references/threat-model.md` | each threat class in depth, with the stack's mechanism: the body helper, the origin check, edge and per-actor limits, the origin seal, token storage, what the database may hold, the anonymous cookie, webhooks, jobs, secrets, agents | adding a public surface, a mutation, an API token, a webhook, a job, a secret or an agent; a security review |
| `references/documents-and-tests.md` | what the permissions, architecture and flows docs must hold about authorization; the required tests; the authorization rules that came from bugs; reading the matrix against intent | writing or checking those docs; writing an authorization test; reviewing a permission matrix |

## When something is learned

- A rule true for any multi-tenant app goes here, with its receipt: the date, what happened, the product named by kind.
- A Clerk or Supabase mechanism goes in `clerk-production` or `supabase-production`; this skill keeps the principle and a one-line pointer.
- What is true of one product goes in that product's own permissions and architecture docs, never here.
- A rule a test can hold gets the test. The skill says what the test asserts.
