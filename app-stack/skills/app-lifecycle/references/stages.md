# The stages, one by one

Each stage: what it produces, when it is done, what doing it well looks like, the owner's part, and which skill holds the how. The guidance under *Doing it well* is distilled from the prompts that walked a live Q&A product through these stages; where it names that product's nouns (rooms, questions, upvotes, a moderator), read your own.

On the stack these were learned on, *the identity provider* is Clerk, *the database* Supabase Postgres, *the host* Netlify. The principle is stated first; the vendor detail after it is that stack's mechanism.

---

## 0 — Brief *(optional)*

**Produces:** the product section of the agent instructions — short, because every session reads it — with the shape declared, and the brief behind it (segments, value propositions, jobs to be done, use cases). Whatever the idea leaves open becomes an **open entry** in the decision log. No code, no design, no `.env`.

**Done when:** the product section and the brief describe the product in words the owner agrees with, the shape is declared, and every question the idea left open is an open entry in the decision log.

**Doing it well**

- **Ask what you need first; then write, stop, and list the open entries.** The owner's idea is a few sentences: who it is for, what they do with it, what they get.
- **Where the idea does not settle something, do not guess.** Record it as an open entry with the options you see. A guess written into the brief reads as a decision.
- Declare the shape explicitly (`product-shapes.md`): workspace model, billing, anonymous public, embedded agents, member home. Every later stage reads it.
- The `product` pack's skills (`market-segments`, `beachhead-segment`, `value-curve`, `value-proposition`) can sharpen a draft; what they produce is a draft the owner confirms, not a decision.
- The strategy stays a stub until the owner has confirmed one (`strategy.md`).

**Skip it** when the product section and the brief already exist, or a workshop hands you the product.

**Templates:** `product-section.md`, `brief.md`, `decisions.md`.

---

## 1 — Prototype *(optional)*

**Produces:** one interactive HTML prototype that compares the product and UX options the brief left open, so the owner decides by using them rather than reading about them. The picks are recorded in the decision log. No app code, no database, no `.env`.

**Done when:** the prototype opens from its file, every pick the owner made is an entry in the decision log, and the product section and brief agree with the picks.

**Doing it well**

- **One file that opens in a browser with no build and no server.** It walks the brief's use cases with realistic fake content.
- **A panel of the options to compare** — every open decision a screen can show, and any others you see — so the owner switches between them while clicking.
- **Show the behaviour a screen hides.** Where it matters, a second panel shows, as the owner clicks, which actor may do what and what is refused — and, if the product embeds agents, which agent answers and which tool call would be allowed or refused.
- **Stop when it opens; the owner picks.** Record each pick with its options, the pick, why, and its reopen trigger; update the product section and brief where a pick changes them.
- **The prototype is for deciding, not building.** It lives in its own folder (`design/prototype/`, say), and the app never imports anything from it. The next stage designs the kit from the picks.

**Skip it** when nothing is open that a screen would settle.

**How:** the `design` skill.

---

## 2 — Design

**Produces:** the kit — tokens, primitives, and the kit's README (what it contains and why) — and artboards for the first screens, kept in the repository. Either two directions to pick from, or an existing design adopted. No code, no database, no `.env`.

**Done when:** the owner has picked a direction or adopted one, the kit, its README and the artboards are in the repository, and **every raw value lives in the tokens and none in the kit's stylesheet** — so the kit tests the next stage adds have something to hold.

**Doing it well**

- **Design the first two screens with their empty states:** the member's main screen (desktop) and the public's, if the product has one (phone). For a live Q&A product those were the host's list of rooms and a participant's room page.
- **Two genuinely different directions**, one line each on what it optimizes for and the trade-off. Stop; the owner picks — a single letter is enough.
- **Decide theming with the direction:** one palette or two token sets. Either way the browser harness pins one colour scheme, and contrast floors are tested for every set that exists.
- After the pick: build the kit, rebuild the two screens from it, keep the artboards, commit, and stop again.
- Layout, copy, type, colour and what the kit contains are the agent's to propose. Real copy, an icon set, phone-first.
- If a prototype ran, its picks bind both directions.
- **Or adopt an existing design** when the product must match something that already exists (another site, a sibling product). There are no directions to invent: extract its colours, type, spacing, radii and motion as tokens, its layout and components as primitives, and say in the kit's README what came from where. **Where the source breaks a rule of the design method — a contrast floor, a raw value outside the tokens — keep the rule and say what you changed.**

**How:** the `design` skill — its method is what the kit must satisfy, and it says which design skill leads at this stage.

---

## 3 — Screens on sample data

**Produces:** the approved design as a running app — the first screens, with realistic content and their empty states — built from the kit, with sample data behind the seams the real system will use. The member's main screen sits at its own route, the **member home**, never at `/`. No database, no sign-in.

**Done when:** the owner has clicked through every screen state at phone and desktop width and what they asked for is in; the kit tests pass; nothing anywhere asks anyone to sign in.

**Doing it well**

- **The screens call the data and action functions the first real slice will make real, never the fixtures directly**, so the swap changes what is behind the seam and not the screens. **Invent no storage in the meantime.** The plan that later introduces the database names the workspace table, the authorization functions and the first migration; screens built before it read fixtures, never invented persistence.
- **Add the kit tests the design method asks for:** always contrast floors parsed from the tokens for every set, and no colour literal in the kit's stylesheet; then the pins for whatever the kit contains (the dialog's declarations, the button variants, complete wrapping). Pin the browser harness's colour scheme, with a comment saying why.
- Compose every screen from the kit; extend a primitive rather than invent one. Public screens are phone-first.
- **A phone is a phone-sized viewport, not a resized window** — the `test-harness` skill says why.
- Plan briefly, build, commit, run it, and give the owner the URL and what they can click. Then stop.
- **The owner adjusts here, before setup**, as a flat list of what should happen: a screen is cheapest to change while nothing real is behind it.

**How:** the `design` skill; the `test-harness` skill for the kit tests and viewports.

---

## 4 — Setup

**Produces:** the identity provider's application (development instance; organizations on, in the organization shape), a **development database project** of its own (production's comes at go-live; a development branch of production instead is the owner's choice, `supabase-production`), the CLI linked to the development target, and the keys in `.env`.

**Done when:** `.env` is filled with no placeholder left, the database's agent connection and the CLI both name the development target, the development database is still empty, and the app boots on the development keys.

**The owner's part** — dashboard clicks the agent cannot make:

- **The identity provider's application**, on its development instance, with the sign-in options the owner wants. Skip any "add authentication" prompt the dashboard offers to paste: in a repository it does not recognise, it scaffolds an app of its own in a subfolder (Clerk, observed 2026-08-27). The page you want is its API keys.
- **In the organization shape, turn organizations on and require membership** (Clerk calls it *Membership required*; the switch reads "Force organization selection"). What it buys: one kind of workspace, one set of roles, one billing tab, and plans built in the right tab the first time. What it costs: every new member meets the provider's choose-organization screen before the app, and until they finish it their session is *pending*, which the provider treats as signed out, so a protected page sends them back to sign-in. A person continues through it in seconds; a headless browser cannot, which is why the browser harness creates each test account's organization and lands it past the screen — known and handled, not avoided. (`2026-08-31`, `2026-09-03`.) **In the individual shape, leave organizations off.**
- **The development database project, and an access token scoped to it alone**, in `SUPABASE_ACCESS_TOKEN` in the environment the agent starts in, set outside the chat and off the command line (`environments`, `references/domain-and-provider-access.md`; as a branch of production, the time-boxed token of `supabase-production`'s setup step 1). Development is what `.env`, the CLI and the agent's database connection point at from here on, and the two are never confused because every command names its target.
- **The keys go into `.env` and nowhere else — never into the chat.** A key that touched the chat is rotated in its dashboard.

**Doing it well**

- The agent's database connection (an MCP server, on this stack) is for **looking** — tables, logs, advisors — at development. Its configuration is per machine and gitignored. Migrations go through the CLI, which stays linked to development for good (as a branch of production, the owner's choice, by its own `--db-url` instead: `supabase-production`): production is never reached by relinking it, only by its own connection string (`--db-url`). Never put `--project-ref` beside `--linked`: which of the two wins has differed between observations (the `supabase-production` skill).
- **Then verify, don't assume:** the agent connection answers about the development target, the CLI is linked to the same one, the development database has no tables, `.env` has no placeholders.

**How:** the `clerk-production`, `supabase-production` and `environments` skills.

---

## 5 — The first real slice

**Produces:** sign-in that lands on the member home, which sends a signed-out visitor to sign-in and back; workspaces; the first migration; the member's own resources; and the public surface, if there is one — from the screen down to the table. It is the long stage.

**Done when** a person can:

- sign in as two members of different workspaces and **not see each other's data**;
- take the public action from a phone without an account, where there is an anonymous public;
- take the product's **once-only action and be refused it a second time** (for a live Q&A product: join a room, ask, upvote, and be refused a second upvote);
- submit `<script>alert(1)</script>` and **see it as text**;

— and the stage's tests and doc lines landed with the code, and the gate is green on the agent's own run. Nothing is deployed yet, so the release checklist is not owed.

**Doing it well**

- **Check the ground first** — the agent's database connection answers about the development target (with development as a branch of production, its `--db-url`, the MCP server removed), the CLI's link names it, the development database has no tables, `.env` is filled — **and stop if any of that is false.**
- **Plan in one page and stop.** The plan names the workspace table (keyed to the organization, or in the individual shape to the user), the authorization functions and the first migration.
- The first migration is applied by the CLI with the target spelled out, named after the version the migration ledger records.
- **The screens keep their shape;** what changes is where their data comes from and how people authenticate. Use the identity provider's own components, dressed to the design, never rebuilt.
- End with one summary: what exists, what the tests cover, what was left out, and how the owner checks it by hand.
- **Checking by hand without inboxes:** a Clerk development instance accepts any address shaped like `you+clerk_test@example.com` with the test code (observed 2026-08-31), so one person can be two members. "Phone" means the browser's device mode until there is a deploy.
- The example prompt for this stage also asked for a pass over the agent instructions at its end (the `agent-instructions` skill): it is the stage where the instructions first meet real code.
- **Then keep going.** The session does not end at the first summary: the owner uses the thing and asks for what is missing, as a flat list — each item what should happen, not how to build it ("Closing a room should block anonymous participants only; I should still be able to open it and reopen it"). That is the normal working mode from here on.

**How:** the `saas-authorization` skill (workspaces, the three functions, invariants as constraints, the threat model), `supabase-production`, `clerk-production`, `test-harness`.

---

## 6 — Browser proof

**Produces:** the authenticated browser suite — a real sign-in, a real session, the member's own screens driven by a headless browser — and the permission matrix: who may do what, and what is not built yet. Everything before this stage could be tested without an identity; this is the stage that buys one.

**Done when:** the authenticated suite **passes twice in a row** (a suite that only passes on a clean database is not a suite), the public suite still passes without any of the new variables, the test docs and the coverage map describe what now exists, and the permissions document holds a matrix the owner can read and a "not implemented yet" section the owner believes.

**The owner's part:** in the identity provider's development instance, turn on test mode and **change the default verification code to one of your own** — it is the password to every test account on the instance; create a test user with a test subaddress (`you+clerk_test@…` on Clerk, which never mails it and always accepts the test code). The suite can create the user itself, but creating it by hand the first time is the fastest way to see that test mode is really on.

**Doing it well**

- **In the organization shape**, the harness's global setup creates an organization per test account and lands it past the choose-organization screen, and gives each further role its membership in the first account's organization, so the matrix is exercised by real members with different powers. **A sign-in that succeeds and a wait for the member URL that times out anyway is the symptom of a harness that did not.** In the individual shape there is no such screen and no second role: each test account is its own workspace.
- **One sequence a real person performs, end to end, with more than one actor in it at the same time**, wherever the product has more than one. A member on a desktop and the anonymous public on phones, in the same room, is a very different test from either half alone — and it is the half no unit test can reach.
- **Read the permission document against intent** — the part to slow down for. The matrix is the base for every future test and every automated code review; without it the agent cannot tell a bug from a feature. Two questions per row: *is this what I wanted?* and *does the code actually do this, or does the document only say so?* A permission that exists in the model and is held by nobody belongs in "not implemented yet", not in the matrix as though it worked. A wrong row is fixed by a sentence ("a moderator should not be able to X"), and the agent changes the code and the document together.

**How:** the `test-harness` skill (the authenticated mile), `saas-authorization` (the matrix), `shipping-artifacts` (the permissions document).

---

## 7 — Publish

**Produces:** the repository on the code host, the first deploy with its environment, `/health`, and the uptime monitor. Still the development identity instance and the development database, no custom domain. **The URL is shared with nobody yet:** sign-up is open and there are no terms or privacy pages until the front door.

**Done when:** the deploy is green, the deployed `/health` reports the database, the monitor is green (whether or not there is a status page) and, where the owner chose a public one, it is linked from the footer, and the owner can sign in and use the app from a phone that has never seen their laptop.

**Doing it well**

- **Start the product's history at one commit holding its starting point** (starting from a template repository on GitHub, its *Use this template* button, not a clone). That commit is part of the product, so every review of the whole product includes it (`--subject HEAD`, `grok-agents` § The subject). A folder whose history began in another repository (a clone or a fork: its first commit, `git log --max-parents=0 --format='%h %an %s'`, is not the product's) takes the same `--subject HEAD`; its tags and branches are that repository's, not the product's releases (`grok-agents` § The subject). Its first push goes only to the repository the owner made for the product (the owner's part, below), never the one it was cloned or forked from.
- **Name the product branch at the first push**, in the release procedure, with the production branch's name (`<name>-prod`) for later.
- **Keep the host's build configuration in the repository**, and add nothing to it that the dashboard could drift from. Without a build command Netlify publishes the repository root as static files, and a repository root has no `index.html`, so every page 404s.
- **`/health` answers only when the configuration parsed and the database replied**, so one request says which half is wrong. Open it before anything else.
- **The host's environment** holds the set the app refuses to boot without, secrets marked secret. A public key compiled into the browser bundle is needed **at build time**, not only at run time. **`APP_URL` is the one that is easy to skip**: nothing local needed it to be right, the build goes green without it, and every request still fails — and it is the base for the share card, `robots.txt` and the sitemap, so a deploy that leaves it unset emits URLs that resolve nowhere but the machine that built them. Test variables do not belong on the host; nothing on the server reads them.
- **An independent review round on the whole product runs before the push** (its subject as the first bullet says), because the host builds what you push; push the commit that round cleared (the `grok-agents` skill).
- **The uptime monitor fires here**, the first capability whose trigger fires (the `uptime-monitoring` skill): a monitor on `/health`, who gets paged, and a status page the owner chose before it was created: public by default, linked from the footer of every page and opening in a new tab, or members-only, or none. The monitor is needed either way: where creating it would publish a page the owner declined, the owner creates that part on the service's dashboard. Record it in the integration notes with a screenshot. A deploy nobody watches is a deploy that is down.
- **When the build fails, read the log from the top.** "No config file was defined", a build command you did not write, or a type error in a file you fixed days ago all mean the host is building a commit that does not have your work: **the branch is not pushed.** From here, **committing is not publishing**: a commit is local, a push is what the world sees — and every push to this branch is now a deploy, so it gets a review round first.

**The owner's part:** the product's repository on the code host, private unless the owner wants the code public: the one *Use this template* made, when the product's first commit is that button's; otherwise, a clone or a fork included, new and empty, with nothing added when it is made (no README, licence or `.gitignore`), so what the first push sends is all it holds; the host's site and its environment, or a token the agent sets them with (time-boxed on Netlify, whose tokens reach the whole account: `environments`, `references/domain-and-provider-access.md`); the monitoring service's account and the token the agent uses on it; the alert channels where only a person can add them; and the part of the monitor whose creation would publish a page the owner declined (`uptime-monitoring`, steps 4 and 5).

**How:** the `release-gate` skill (the three bars), `environments` (branches, variables), `grok-agents` (the round).

---

## 8 — The front door, roles and plans

**Produces:** three blocks, selected by the shape:

| Block | Applies when |
|---|---|
| **A. Organizations and the second role** | the workspace model is *organization* |
| **B. Billing** — paid limits | billing is the provider's billing, in the organization shape; skipped with *none* |
| **C. The public front door** — landing and legal; pricing only with billing | always |

**Done when** — read block by block: *(A)* organization boundaries and both roles are enforced server-side, and the second role's actions work on every surface that shows their effect; *(B)* every plan limit is enforced under concurrency and every capacity derives from the plan module; *(C)* signed-out visitors get the finished landing and legal pages, their text approved by the owner — plus pricing they can read without an account, where the product sells — **on a phone**; a pasted link renders a preview card; nothing reached by an unguessable id is indexable; and the full gate passes.

**The owner's part, first:** with blocks A and B, some of the work is **dashboard settings the agent cannot create, and each one silently changes what the code is allowed to do.** Do them before the build.

- **Organizations before billing.** Clerk keeps user plans and organization plans in two separate tabs, their slugs are scoped per tab, and a plan cannot be moved between them after it is created (observed 2026-09-03). Enable billing first and you build your plans in the wrong tab and build them again.
- **Check that membership is still required** rather than assuming it: from here that setting is load-bearing, because the organization a person is in is the workspace that owns their data.
- **The second role:** rename the provider's default member role to the product's second role (its name and key, e.g. a moderator), or keep the default where the second role *is* a plain member. Leave the admin role alone — it is what the creator of an organization gets, and an instance cannot be without it. Roles exist only inside an organization; there is no personal-workspace path to add in this phase — that is the individual shape, declared before setup, not grown here.
- **Do not define the provider's own permissions, and never attach a billing feature to one.** The product's permissions are strings in its own code, mapped from roles. With billing on, Clerk gates its permissions by feature, so a lapsed subscription would silently take a capability away — for a live Q&A product, a moderator's right to approve, leaving every question in a live room pending forever. **Roles decide who may act; features decide how much.**
- **Plans:** Free and one paid tier, in the organization tab, even before the product means to charge, because the plan module and pricing page are where the limits are stated. **Free carries nothing the code reads; Free is the absence of the paid features.** **Name a feature for what the paid tier adds, never for what the free tier has**: a slug mistyped, renamed or forgotten can then only cost somebody something they paid for, never grant anything. **The plans live in a billing file the provider's CLI applies**, where each feature's key is the slug the code reads; the gated features stay hidden from the pricing table, and each plan's visible lines are display-only features no code reads (Clerk, `2026-10-23`). Built by hand in the dashboard instead, a feature's slug is derived from its display name: "Up to 1,000 participants / room" slugs to `up_to_1_000_participants_room`, which matches nothing, and every paying account silently drops back to Free (observed 2026-09-03).
- **Should the second role be a paid feature?** The obvious form is a trap: gating the *act* on a feature means a lapsed card stops the act at the worst moment. To sell team size, sell it where it fails safely — a **seat limit on the organization plan**, which the provider enforces at invite time with no code.
- **Prices are the owner's**, written once in the billing file and applied by the provider's CLI. Application code never holds one: checkout is the provider's own table, the charge is the provider's, and a unit test refuses any currency literal in the app's source.
- **The identity provider's CLI** is signed in by the owner for the billing apply and its read-back, and signed out (`npx clerk auth logout`) once both are done: its session reaches every instance in the account, production included (`environments`, `references/domain-and-provider-access.md`).
- An optional public contact address stays empty until the mailbox exists; the legal pages then show the postal address alone, which is honest — an address that bounces is worse than none. Where an email address is required, the mailbox exists before the front door is shared (`legal-pages`, rule 9).

**Doing it well**

- **Gate on features, never on plan names and never on roles.** A caller holding no paid feature is on Free, and a missing or renamed feature fails towards Free. Limits are enforced inside the transaction, under concurrency (the `saas-authorization` skill).
- **The provider's pricing table is checkout, on the pricing page, signed in or out.** Signed out it renders the cards with prices and no buttons, so the page supplies its own call to action, and a short server-rendered summary above it takes its capacities from the plan module the code enforces. The landing shows the same table, or plan cards of its own read from the billing file (`default-choices.md`, pricing).
- **The landing page is the same for every visitor and reads no session** (`default-choices.md`, the front door). Focus it on the members who will run the product; cover who it is for, the core benefit, the jobs and pains, a clear before and after, and the practical objections (no installation, any browser, and — only with billing — what the free plan includes). Research comparable products to sharpen the claim, but do not name competitors on the page.
- **Every public page is phone-first; assert the layout, not just the DOM**: one column at a phone width, no sideways scroll. **The public pages share one navigation**: a visitor who looks at the price must not lose the way in.
- **Legal pages** (the `legal-pages` skill): footer links to terms and a privacy policy written for the jurisdictions the product serves. When another product by the same company already has legal pages, start from them: keep the company's boilerplate, rewrite everything about processing from this product's code, and add a unit test that fails when the code reaches a provider the policy does not name. Essential cookies only.
- **Sell only what runs.** Every page that sells or promises (the plan table and its lines, the terms, the privacy policy, the footer) reads one launch list of what is built, and a unit test fails when a sold line names something the list marks unbuilt; that line says *Coming soon* instead. (`2026-10-23`, a monitoring product's paid plan was found selling four capabilities that were not built.) The go-live check that holds it at release, and the flag that flips the day a thing goes live, are the `release-gate` skill's.
- **Every sentence of the legal copy matches what the code does today.** The privacy policy names an analytics tool only in the change that adds its tag. (The live Q&A product's original ask requested the analytics sentence before the tag existed — exactly the overclaim this rule forbids.) A privacy policy is the one document where a confident guess is a legal problem: every claim in it should be traceable to a table, a cookie or a script. Once the pages are live, turn on the identity provider's express consent to legal documents with their URLs, so the sign-up form carries the checkbox.
- **Search and sharing:** an absolute metadata base, a title and description per page, a canonical per indexed page, a file-based preview image per segment, and the card asserted on the raw response body (`default-choices.md`, share cards). **Keep every resource reached by an unguessable id out of `robots.txt` and the sitemap**: its id is the only thing protecting it, so a crawler that indexed one would turn an unlisted resource into a search result while it is still open.
- Use the providers' development and test modes for test users, invitations, roles and subscriptions; **never create a real charge.**

**Check by hand the things a test cannot see:**

- **The paid tier really grants more** *(block B)*: subscribe through the pricing table in test mode (Clerk's development billing takes the card `4242 4242 4242 4242`, never a real one), then do the thing the paid tier adds, in the browser and, where the product has them, through an API token. Cancel, and check that both keep the paid features until the period's end. If it is refused, the plan sits in the user tab instead of the organization tab, or a feature slug does not match — check the plan's payer type in the billing API and compare the slugs with the literals in the plan module. If only the token is refused, its entitlements are read from the subscription alone (the `clerk-production` skill).
- **The front door on a real phone**, not a resized window. A responsive rule that never fires — wrong breakpoint, wrong nesting, a block that ended up inside a `@keyframes` — leaves every DOM assertion green while the page is unreadable on the device it was written for. (`2026-09-04`, a live Q&A product shipped one and a screenshot caught it; the suite now measures left edges and overflow rather than visibility.)
- **A pasted link**: drop the site's URL into a chat and look at the card. An empty one usually means `APP_URL` is unset on the deploy, so the image URL resolved to localhost.

Then **read the permission document again**, as in stage 6. With block A it has grown a column for the second role and rows for its job; the questions are the same.

**How:** `clerk-production` (organizations, roles, billing), `saas-authorization` (roles versus entitlements, quotas), `design` (what a screen may claim), `test-harness` (layout assertions, raw-response cards), and `default-choices.md` for the front door, pricing, legal and share-card defaults.

---

## 9 — Go live

**Produces:** production resources, separate from development — the identity provider's production instance with its own keys, email DNS and legal consent on; a real payment account connected to billing and the billing file applied to production, when the product bills; a production database with every migration applied through the CLI against production's own connection URL, never by relinking, and the ledger read again (the `supabase-production` skill); the host's production environment with **generated secrets generated afresh, never copied from development**, set only at the promotion, after the product branch is pinned to development values — and the production branch, with the custom domain on the production site. Each dashboard change gets its screenshot.

**Enter it** when the owner says the product is ready for a real audience, after the front door and its legal pages are live.

**Done when:** the production URL serves the reviewed commit (probed by something the release both adds and removes), every runtime beside the app runs production's build on production's keys, `/health` answers ok, the served pages carry the identity provider's production publishable key (`pk_live_` on Clerk), a stranger can sign up on a phone with the legal consent shown and that account is read back in production's identity instance and database, every token belongs to one environment, is scoped and recorded, the time-boxed ones revoked and the identity provider's CLI signed out, and production's secret keys made for the setup are deleted, or, where it used production's own, those are rotated (`environments`, `references/domain-and-provider-access.md` § Before the first users), nothing sold is unbuilt (production billing waits until that holds), the legal pages match the code, their test green and their text approved by the owner (`legal-pages`), no doc still describes production as unbuilt, and the environment record holds the verified production mapping with its date. The same list is the `release-gate` skill's go-live.

**Doing it well:** the first release's review covers the whole product, its subject as in stage 7, and runs **before** the production branch exists; the whole-repository audits are proposed. On the owner's **go**, creating the production branch from the commit the round cleared *is* the promotion, in the order the `release-gate` skill's go-live step 3 gives: apply what is pending, pin the product branch to development values, create the production branch, set production's values and deploy again, then attach the custom domain to the production site if it isn't there yet. From then on the product branch never builds with production's values: give its deploy context the development values, or build it on a development site of its own (the `environments` skill). Otherwise it starts writing to production. The uptime monitor moves to the production URL. Hosted CI is proposed as its own change.

**The owner's part** — the clicks that commit the account (`environments`, `references/domain-and-provider-access.md`): the zone and its nameservers, DNSSEC off first; the production database project (`supabase-production`); the production identity instance, its own OAuth client for each social sign-in, its legal-consent switch and, when the product bills, the payment account connected (`clerk-production`); every token the agent uses, made and recorded as § Who holds what there says; the identity provider's CLI, signed in for production's billing apply and its read-back and signed out once both are done; the setup's own secret keys, made for it; the time-boxed tokens revoked and those keys deleted once the rest of go-live's done-when is checked; and the go each production step waits for (`release-gate`, go-live).

**How:** the `release-gate` skill (go live), `environments`, `supabase-production`, `clerk-production`.

---

## 10 — Every release after

**Produces:** the release checklist with evidence, the independent review over the whole unreleased range, the audits proposed on the release's changes, the owner's **go**, the promotion, and the checks after it. At each release the agent instructions get their pass (the `agent-instructions` skill), the plan's status is brought current, the previous release's narrative moves to the history, and finished stage briefs move with it.

**Done when:** the post-promotion checks pass.

**How:** the `release-gate` skill; `grok-agents` for the review loop.

---

## 11 — What comes next

**Produces:** a proposal, not a build. The agent proposes the capability whose trigger has fired (`capabilities.md`), the owner says go, and the next phases go into the plan — each stage with its own done-when. There is no default stage here and no example prompt, on purpose: what the later phases hold depends on the product.
