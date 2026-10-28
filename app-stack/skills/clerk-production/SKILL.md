---
name: clerk-production
description: "Setting up or changing Clerk sign-in, organizations, roles or billing on Next.js, or sign-in that does nothing or lands wrong: Clerk in production."
---

# Clerk in production: the choices its own skills cannot make

Clerk's own agent skills know the API. They cannot decide how your product uses it:

- where a session is verified, and what may read it;
- what a workspace is;
- where billing ends and authorization begins;
- which dashboard settings silently change what your code is allowed to do.

Those decisions are here, each with the incident that produced it.

They were learned on **Next.js (App Router, Next 16, where middleware is `proxy.ts`) + Clerk Core 3 (`@clerk/nextjs` v7) + Supabase + Netlify**, building several products with coding agents. Among them were a live Q&A product with organizations, a moderator role and paid plans, and a monitoring product with paid plans and API tokens, named here only by kind. **Where Clerk's defaults or quickstarts contradict this skill, this skill wins.** The authorization model these mechanics serve, which carries to any identity provider, is `saas-authorization`.

Three things of the product's own are named throughout. **The integration notes** are its dated record of how each provider is configured: instances, settings, slugs, read-backs. **The permission module** is the one module that maps roles to permission strings. **The member home** is the route sign-in lands on, `/dashboard` unless the product names another.

## Clerk's own skills: get them, prefer them for the API

- **The set**, from the GitHub repository `clerk/skills`:
  - `clerk` (a router);
  - `clerk-setup`, `clerk-nextjs-patterns`, `clerk-custom-ui`, `clerk-orgs`, `clerk-billing`, `clerk-webhooks`, `clerk-testing`;
  - `clerk-backend-api` (browse and call the Backend API);
  - `clerk-cli`.
- **Install:** `npx skills add clerk/skills` with the open `skills` CLI. Vendor them into the product's skills folder so they load whenever Clerk is touched, and prefer them over training-era memory of the API.
- **Pin them:** a `skills-lock.json` records each skill's source, its path and a content hash. `npx skills update` refreshes them on purpose.
- **What they will offer that this skill refuses:**
  - `createRouteMatcher` path lists;
  - `<SignedIn>` and `<SignedOut>`, which Core 3 deleted;
  - `<ClerkProvider dynamic>`;
  - rebuilt sign-in screens;
  - `clerk.signIn()` in the browser suite;
  - Clerk permissions with features attached;
  - a hand-written CSP.

## The choices

1. **Verify, never decode, always behind one session seam** (`SessionVerifier`). Tests substitute a mock verifier when `CLERK_SECRET_KEY` is absent; keyless mode is for development only. → `references/sessions-and-front-door.md § Sessions`
2. **Store Clerk ids only.** Read names and emails from Clerk at render time. Only the `workspaces` table holds a Clerk org or user id (`saas-authorization`).
3. **Authorization lives with the data, not in a path list.** Clerk v7 deprecates `createRouteMatcher`, and `proxy.ts` only attaches the session. Every protected page and every action checks for itself; a check in a layout alone is not a check. (`2026-08-27`, building the first slice with sign-in and data.)
4. **Clerk's own components are the sign-in surface**: `<SignIn />`, `<SignUp />`, `<UserButton />`. They are dressed through `appearance`, never rebuilt.
5. **Sign-in lands on the member home, never on `/`.**
   - `signInFallbackRedirectUrl` and `signUpFallbackRedirectUrl` name the member home, and `afterSignOutUrl` is `/`.
   - The member home sends a signed-out visitor to `/sign-in` with a `redirect_url` back to itself.
   - The root `<ClerkProvider>` takes `nonce`, never `dynamic`.
6. **The front door reads no session.** `/` and every public page never call `auth()`, the seam or `<Show>`, and a signed-in visitor is never redirected away. The header's one button is labelled from the `__client_uat` cookie. → `references/sessions-and-front-door.md § The front door and the member home`
7. **In the organization shape, *Membership required* goes on at setup, before the first migration.** The authenticated harness then creates each test account's organization. In the individual shape, organizations stay off. → `references/organizations-and-billing.md § Organizations`
8. **Organization management is Clerk's own modal**, never a page you build. What it lacks goes in as a custom page inside it, whose Server Actions re-resolve the caller and recheck the permission.
9. **With Clerk Billing, plans and features live in a file the Clerk CLI applies, and a test reads each instance back against it.** The gated features are hidden from the pricing table and ride the session token, where `has()` reads them; one plan module maps them to capacities. A caller with no session reads the subscription for the plan id and takes that plan's slugs from the plan list, never from the subscription's embedded `plan.features`. Checkout is `<PricingTable for="organization">`, and no price is typed into application code. → `references/organizations-and-billing.md § Billing`
10. **Never attach a feature to a Clerk permission.** With billing enabled, Clerk gates permissions by feature, so a lapsed subscription silently removes a *capability* rather than a quota: a member loses permission to act in the middle of a session. Roles decide who may act, features decide how much, and they meet nowhere. (`2026-09-03`, building plans for a live Q&A product.)
11. **The CSP comes from Clerk's middleware, never a hand-written policy.** → `references/csp-and-variables.md § The CSP header`
12. **Clerk's wording is not part of your contract.** Locate its controls by their element-key class (`.cl-<elementKey>`), never by their text. (`2026-09-20`, a vendor rewording broke six specs at once.)
13. **Read the gotchas before touching Clerk** (`references/gotchas.md`). Each failed silently, or looked like a different problem, the first time:
    - a task that runs before the app;
    - Test mode as a dashboard toggle;
    - a development instance's silent `dev-browser-missing` refusal;
    - wording that is not in your tree;
    - the components Core 3 deleted;
    - the provider's `dynamic` and the server redirect that ignores `signInUrl`;
    - middleware that makes a page wait;
    - the bounce lost when members move off `/`;
    - a secret key in the publishable variable;
    - a provider-less surface linking into one that needs Clerk;
    - Clerk's menus opening behind a modal dialog, and a design token that loops through Clerk's own variable;
    - the plan tab that must match the workspace model;
    - a dashboard feature's slug derived from its name, and a billing patch that moves features to Free;
    - a subscription read that carries only a plan's visible features;
    - the personal-data webhooks, and Clerk's own deletion paths;
    - production keys that refuse any host not on the instance's domain list, such as the host's default deploy subdomain, which still serves pages;
    - sign-in down while every page answers 200;
    - the production instance's DNS and legal consent.

## Setting it up, in order

All on the **development** instance first.

1. **Create the application.** The dashboard offers a long "Add authentication" prompt: don't paste it. In a repository it does not recognise, it scaffolds an app of its own in a subfolder (observed 2026-08). The page you want is *Configure → API keys*. Choose the sign-in methods: email, and Google if you want one-click sign-in.
2. **The workspace model.**
   - In the organization shape, turn *Organizations* on and set *Membership required* (the switch Clerk calls *Force organization selection*). Do it now, before the first migration and before billing.
   - In the individual shape, leave *Organizations* off.
   - **Turn off Clerk's own deletion paths** (an admin deleting an organization, a user deleting their own account) until the product can delete what a workspace owns. → `references/organizations-and-billing.md § Webhooks and personal data`
3. **The second role** (organization shape), when the product has one.
   - In *Configure → Organizations → Roles*, edit the default **Member** role and rename it, name and key, to the product's second role (for example `org:moderator`). A product whose second role is a plain member keeps `org:member`.
   - Leave **Admin** (`org:admin`) alone: Clerk gives it to whoever creates an organization, and an instance cannot be without it.
   - Define no Clerk permissions.
4. **Test mode** (*Configure → Instance → Test mode*: on), before the authenticated browser suite.
   - Change the default verification code: it is the password to every test account on the instance.
   - Create one user with a `+clerk_test` address by hand, the fastest proof that Test mode is really on. → `references/authenticated-mile.md`
5. **Billing**, only when the product bills, and only after organizations: Free and one paid plan for organizations, written in a billing file (its `plans` block included) and applied in two commands: `npx clerk config patch --file <file> --dry-run`, read what it would send, then the same without `--dry-run`. *Manage billing* goes to the admin role alone. → `references/organizations-and-billing.md § Billing`
6. **Legal consent**, once the legal pages are live: *Configure → Legal → Require express consent to legal documents*, with their URLs. The sign-up form then carries the consent checkbox.
7. **OAuth application settings**, only when the product is an MCP server (§ MCP OAuth).
8. **The production instance, at go-live.** It gets:
   - its own keys, which work only on the domains the instance is configured for, and its DNS records;
   - its own OAuth client for each social sign-in (development borrows Clerk's shared ones);
   - legal consent on;
   - a real Stripe account connected to Clerk Billing, and the billing file applied with the same two commands plus `--instance prod`, the dry run read first, when the product bills;
   - every dashboard setting above applied again and read back. An instance cloned from development drops the settings only the API sets;
   - generated secrets generated afresh, never copied from development.

   → `references/csp-and-variables.md § The production instance`; the release around it is `release-gate`.

## Keep a record of every dashboard setting

None of this lives in application code, and several settings silently change what the code is allowed to do. Record each in the integration notes, dated, **as a read-back wherever something can read it**, and as a screenshot only where nothing can:

- **the plans and features**: the billing file, and each instance's read-back against it (§ The choices, 9);
- **the organization settings**, `GET /v1/instance/organization_settings` with that instance's secret key: *Membership required*, automatic first organization, admin deletion off;
- **the OAuth settings**, `GET /v1/instance/oauth_application_settings` (§ MCP OAuth);
- **sign-in methods, legal consent, self-deletion and social providers**, from the instance's public settings, `GET https://<frontend API host>/v1/environment`, which needs no key;
- **a screenshot for the rest**: *Roles* (each role's name and key, and who holds *Manage billing*), *Test mode* on (development only), *Webhooks* (the endpoint and its events, once the personal-data trigger fires).

`npx clerk config pull --instance <dev|prod>` prints an instance's configuration as JSON as well (Clerk CLI 4.0.0, read `2026-10-25`). **A screenshot records intended configuration, not the live value.** Read the live value back before relying on it. (`2026-10-21` to `2026-10-24`, a monitoring product recorded its organization, sign-in and OAuth settings on both instances as read-backs.)

## MCP OAuth

Only when the product is an MCP server that outside agents reach as a signed-in member, with Clerk as the authorization server. This section holds only what Clerk must be set to. The server itself is `mcp-server`: who may call it, the route and its limits, the tools, the directories, the clients and the package. That skill also covers a sign-up that starts in an agent, through Clerk's *Create first organization automatically*, which is an organization setting rather than an OAuth one.

Everything below is on *OAuth applications → Settings* (as of `2026-10-06`). Every setting failed silently, or would have, the first time.

- **Create no OAuth application by hand.** MCP clients register themselves (DCR) or identify by a metadata URL (CIMD). Clerk says a DCR client appears under *OAuth applications → Applications* after its first sign-in; a CIMD client may not appear at all: after ChatGPT signed in by CIMD, the Backend API's `GET /v1/oauth_applications` listed none (2026-10-27; the dashboard was not checked). A manual application is only for a client that can do neither. It needs the consent screen on and the same scopes, because instance defaults do not rewrite its scopes.
- **Publish CIMD support: on, with Client admission set to *Any compatible CIMD client*.** That is `client_id_metadata_documents_advertised` `true`, with `client_id_metadata_documents_only_allow_pre_registered_clients` and `client_id_metadata_documents_block_implicitly_allowed_clients` both `false`. When the switch goes on, the dashboard preselects *pre-registered and previously connected clients*, which refuses every new client.
- **Publish DCR support: on** (`dynamic_oauth_client_registration`), although Clerk labels it *Deprecated*. Many MCP clients still register only through DCR.
- **Default scopes: `openid`, `profile`, `email`, plus `user:org:read` in the organization shape.**
  - Without `user:org:read`, the consent screen asks for no organization, and every connection is refused `organization_required`.
  - The dashboard shows `offline_access` and will not remove it. It is not stored in `default_scopes`, and it only lets a client that asks for it refresh. ChatGPT asks for it (2026-10-27).
- **Require PKCE: on** (`pkce_required`).
- **JWT access tokens, with *Include Audience* on** (`oauth_jwt_access_tokens`, and `aud_claim_enabled`, which is off by default).
  - The route requires its own exact URL as the resource in `aud`: `<APP_URL>/api/mcp` by default, or the path the product chose instead (one product mounts it at `/mcp`).
  - The protected-resource metadata describes that path, never the origin root.
- **Apply, then re-read** with `PATCH` and then `GET /v1/instance/oauth_application_settings`, against each instance with its own secret key. Record the re-read in the integration notes: development and production separately, dated.
- **An instance cloned from development does not carry these settings.** A production instance made from development's settings had DCR, CIMD and `aud_claim_enabled` off and no default scopes (`2026-10-24`). Apply and re-read them on the clone as on any new instance.
- **No new environment variable.** The publishable key gives the issuer, the secret key verifies tokens and reads membership, and `APP_URL` gives the resource and the discovery URLs.

Four behaviours the route must allow for:

- **Discovery's `claims_supported` is not the shape of the JWT Clerk emits.** A real grant carried `client_id` and `scope`, which the list omits. Run a real DCR + PKCE grant before changing which claims the route requires.
- **A JWKS or network failure while verifying is a retryable `503`, never an invalid-token `401`.** A `401` sends the client back through the whole OAuth flow.
- **An unknown `kid` never reaches Clerk's verifier.** Given a `kid` it has not cached, `verifyToken` fetches the JWKS from the Backend API with the secret key, and an unauthenticated caller chooses the `kid`. Check the unverified header's `kid` against the key list last loaded, refresh that list at most once a minute, and refuse the rest as invalid.
- **Offline JWT verification does not see a revoked grant until the token expires**, a day by default. Recheck workspace access on every request through `requireWorkspaceAccess`, never from the token's claims alone.

(`2026-10-06`, a live Q&A product's MCP OAuth stage, development and production.)

## How you can tell it worked

A new user signs up on a phone against the production instance and lands where they should, in the right organization and role, and the served pages carry the production publishable key.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/sessions-and-front-door.md` | the session seam; ids only; the sign-in surface and redirects; the front door and the member home: the rule, its shape on this stack, what was rejected, the tests that pin it | adding sign-in; touching the root layout, a public page, the member home or a redirect |
| `references/organizations-and-billing.md` | organizations and the choose-organization task; roles and *Manage billing*; the organization modal and custom pages; Clerk Billing: the billing file and the CLI, in code (callers with no session included) and in tests; pricing; webhooks, personal data and Clerk's own deletion paths | adding organizations, a role, a plan, a limit, pricing or a deletion webhook |
| `references/csp-and-variables.md` | the nonce CSP and static headers; every Clerk variable and the env schema's Clerk checks; what to record; the production instance | adding a CSP or a third-party origin; adding or checking a Clerk key; going live |
| `references/authenticated-mile.md` | Clerk's half of a real-session browser suite: Test mode, test accounts, the testing token, organizations in `globalSetup`, signing in through `<SignIn />`, the signed-out-action trap, locators | writing or debugging an authenticated end-to-end test |
| `references/gotchas.md` | every Clerk gotcha, each with its symptom and receipt | before touching Clerk; when sign-in or an authenticated action seems to do nothing |

## When something is learned

- A Clerk lesson true for any product goes here, with its receipt: the date, what happened, the product named by kind.
- Date what Clerk did or required ("observed 2026-10"), because the dashboard and its labels change without notice. When one changes, correct the line; never leave the old one beside the new.
- What is true of one product goes in its own integration notes: its instances, roles, slugs, confirmations and re-reads.
