---
name: product-analytics
description: "Adding analytics, session recordings, heatmaps, 'what did users do', Clarity or PostHog: behaviour analytics without analytics cookies, read back by the agent, and what changes when a cookie comes in."
---

# Product analytics: what people did, without analytics cookies

After the first release, the next round starts from what people did: where they clicked, where they stopped, what they never found. This skill sets that up so the product sets no analytics cookie and keeps to essential cookies only, and so the agent can read the data back itself instead of asking the owner for screenshots.

Its Clarity setup was designed on a monitoring product, where it is not wired yet, and its policy rule comes from a live Q&A product, both named here only by kind; every vendor fact carries the date it was read.

## The default, and the option

- **Microsoft Clarity, cookies off: the default.** Session recordings, one page each without cookies, and heatmaps, free, with the project's cookies switched off and storage consent denied from the page, so Clarity sets no cookie and cannot follow a visitor between visits. Not on a product aimed at people under 18, where Clarity says it shouldn't be used (Clarity's FAQ, read on `2026-10-29`).
- **That removes the cookie, not the question.** The EDPB reads ePrivacy Article 5(3) as covering any script that has the browser send information (Guidelines 2/2023, § 33), so whether the product may record visitors without a consent banner where it is offered is the owner's decision, with their counsel. The agent asks for it by name before the tag goes on, and never states it as settled. If consent is needed, the tag loads only after the visitor accepts, through the banner in § When a cookie comes in, with the denial still queued so it stays cookieless, and the browser test proves nothing from the tool loads before acceptance.
- **PostHog, when the question needs events**: funnels and counts within a day, on anonymous visitors, without cookies (§ PostHog). Retention, use per account and experiments need an id that lasts (`identify()` or a stored id), which PostHog says makes the id personal data and undoes the cookieless mode; adding one is the owner's decision, handled as § When a cookie comes in.
- Both can run. Start with Clarity on the landing page (rule 5); add PostHog when a question names an event.

## What binds

1. **Off without a project id.** An empty id means no script, no request and nothing to consent to (`environments`, optional feature switches). Development leaves it empty, so the owner's own testing never lands in the data.
2. **Clarity's two halves, and only one of them is code.**
   - **The dashboard (the owner):** the project's cookies switched off, which puts it in consent mode. Screenshot the setting when it is set.
   - **The page (the agent):** a script that runs before the tag defines Clarity's queue and queues the denial: `window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments) }; window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' })`. Called before the queue exists, the denial throws, and nothing else notices. Clarity then gives each page view its own id, writes no `_clck` or `_clsk` cookie, and cannot follow anyone between visits.
   - **What it costs:** without cookies each page view is its own session and every visitor counts as new, so read pages, flows and where people stop, not visitors or pages per session. Since 31 October 2025 Clarity also applies consent mode by default to visitors from the EEA, the UK and Switzerland; the page's own denial makes every visitor the same, wherever Clarity places them (Clarity's docs, read on `2026-10-29`).
   - **Held by tests:** a unit test fails if the word `granted` appears anywhere in the component or the denial is not queued before the tag's script is added, and a browser test, with the test project's id (§ What the owner does by hand), first proves the tag's script loaded (an unknown id gets an empty answer and loads nothing), then reads the cookie jar, `localStorage`, `sessionStorage` and IndexedDB after visiting every page the tag is on, because the privacy policy promises both halves and a dashboard setting is something a person can flip. On production, the page's half is the same build the unit test held, and the dashboard's half shows only in the dashboard, so its screenshot is the evidence (§ What the owner does by hand, step 2).
3. **The privacy policy's analytics sentence lands in the change that adds the tag, and renders only when the project id is set**, so no deploy names a tool that does not load; the legal test pins the page in both states (the `legal-pages` skill; `design`, `references/screens.md`). (The live Q&A product's original ask requested the analytics sentence before the tag existed: exactly the overclaim that rule forbids.)
4. **The Content-Security-Policy admits the tool's origins only once it is wired** (`clerk-production`, the CSP). Clarity's docs name `*.clarity.ms` and `c.bing.com`; PostHog's name `*.posthog.com`, plus `worker-src 'self' blob: data:`, or only the product's own domain behind a reverse proxy (both read on `2026-10-29`).
5. **Only the landing page, as a document of its own.** Clarity records the address and referrer of the page it runs on, and of every page the visitor reaches without a full page load, because it follows the browser's history (Microsoft's `clarity` repository, `packages/clarity-js/src/core/history.ts`); its masking covers neither referrers nor query parameters it was not asked to mask (Clarity's FAQ; both read on `2026-10-29`). In one root layout, a document that moved without a full page load can hold pricing (checkout for members), sign-up (which carries the identity provider's invitation ticket in its query), the member home, or a page whose unguessable id is its only lock (`saas-authorization`), in its history or ahead of it. So:
   - the tag's component adds the script only when the landing page is the only entry its document holds: `const n = window.navigation; if (n && location.pathname === '/' && n.entries().filter((e) => e.sameDocument).length === 1) addTag()`, and nothing where the Navigation API is missing. A load at `/` is not enough: after a client-side arrival (a `<Link>`, `router.push`, the identity provider's redirect after sign-out), a reload, a Back that reloads the page, or a link to `/` followed while on it keeps the entries reached before, and Back reaches them inside the same document (observed in Chrome 156, `2026-10-29`);
   - every way out of the landing page is a full page load: a plain `<a href>`, never `<Link>`, `next/form`'s `<Form>`, `router.push` or a server action that redirects, and nothing from the identity provider's client library on the page (its sign-in and user buttons, its sign-up form, its pricing table, its hooks); the provider in the root layout stays (`clerk-production`), and the landing's plan cards are its own, read from the billing file (`app-lifecycle`, default choices, pricing);
   - the whole site sends `Referrer-Policy: strict-origin` (`clerk-production`, the CSP), so no page hands its address to the next, and the raw-response check there reads it on the landing page and on a page reached by an id;
   - a browser test opens the landing page and follows each of its same-origin links that leave `/` (not `mailto:` or `tel:`, a link that opens a new tab, a link to another origin, or a link to `/` itself or a fragment on it) and submits each of its forms with valid test values, failing when a link or a submission changes the address or adds a history entry without a new `load` event, or when the page it reaches adds a `*.clarity.ms` script or sends a request there after its own `load` event. Then, from the member home, it signs out onto the landing page and walks each path from there, signing in and out again before the next: Back; a reload of `/`, then Back; the landing page's link to `/`, then Back; a public page, Back to `/`, then Back again. Each fails on any request to `*.clarity.ms` from the sign-out on.
   - the front door's source guard holds the ban: once any file imports the tag's component, wherever it is mounted and whatever its project id, it fails on any import from the identity provider's client library in the root layout, the public layout, the landing page and every component they import, the root layout's provider excepted (`clerk-production`, the front door).

   Another page is tagged only when the owner decides, with the tool's masking at its strictest and the policy saying so.
6. **The agent reads the data back itself** (§ Reading it back), through the vendor's MCP server, with a token the owner made. The token is an operator value, one per environment, never in the app's runtime (`environments`).

## PostHog

PostHog's own docs, read on `2026-10-29`:

- **Cookieless:** `cookieless_mode: 'always'` in the `posthog-js` init, **and** *Enable cookieless tracking* switched on in the project's settings (Settings, Project, Web analytics), without which cookieless events are ignored. PostHog says this needs no banner unless something else on the site uses cookies; the consent question (§ The default, and the option) still applies.
- **What it costs:** each visitor counts as new every day, and session replay and surveys are off for anyone who has not consented. For recordings, keep Clarity beside it.
- **`on_reject`** captures nothing until the visitor has chosen, which means a banner: § When a cookie comes in.
- **Hosts:** a US and an EU cloud (`https://eu.i.posthog.com`); the owner picks by where the users are. PostHog recommends a reverse proxy through the product's own domain before production, which it says typically captures 10 to 30% more events; the CSP then admits only that domain.

## When a cookie comes in

Any cookie that is not essential, from PostHog with cookies on, an advertising pixel, a chat widget or anything else, changes three things, and the agent says all three before adding it:

1. **A consent banner.** Nothing that sets the cookie loads before the visitor accepts; refusing is as easy as accepting, and the choice can be changed later from the footer. The unit test turns around: it fails if the tag loads before consent.
2. **A line in the privacy policy** naming the cookie, who sets it, what for and how long it lasts, in the same change (the `legal-pages` skill).
3. **The owner's steps in the tool's dashboard**, which the agent lists by name for the tool in question: the setting that turns cookies on, the data processing agreement, the data region, and the retention period.

## Reading it back

The agent reads the data itself and answers the question asked, then weighs it against each hypothesis (the `propose` skill). Both servers below are the vendors' own (read on `2026-10-29`). Each is added to the agent at user or local scope, never to a committed MCP config, because the credential travels with it.

- **Clarity:** Microsoft's `@microsoft/clarity-mcp-server`, run locally with `npx`. It reads the owner's API token from the `CLARITY_API_TOKEN` environment variable (version 2.0.1, read on `2026-10-29`), so the owner, with that variable loaded from the operator's file, adds the server in their own terminal as an environment value, never an argument: `claude mcp add -e CLARITY_API_TOKEN="$CLARITY_API_TOKEN" --scope user clarity -- npx -y @microsoft/clarity-mcp-server`. That leaves a plaintext copy in the owner's Claude Code configuration (`~/.claude.json`), so list it in the variables doc's copies table, and a rotation removes the server (`claude mcp remove --scope user clarity`) and adds it again with the new value (`environments`). Nobody pastes the token into the session. Its tools query the dashboard's metrics, list session recordings, and search Clarity's documentation. Clarity's export answers **ten requests a project a day, about the previous one to three days**, so a weekly read is seven daily reads, each kept in the repository's notes as counts and paths, with every id in an address replaced by `:id`; the agent spends the ten on the question asked, not on browsing.
- **PostHog:** its hosted server at `https://mcp.posthog.com/mcp`, which its docs say routes to the project's region (its repository names `mcp-eu.posthog.com` for EU projects). Sign in by OAuth, or with a personal API key made from the *MCP Server* preset, and connect read-only (`?readonly=true`), because the agent is there to read. In Claude Code: `claude mcp add --transport http --scope user posthog "https://mcp.posthog.com/mcp?readonly=true"`. Calling it is free; the queries count as ordinary PostHog usage, and its AI-backed tools may bill as PostHog AI spend.

## What the owner does by hand

The agent wires the tag, the denial, the tests, the CSP and the policy line. These are the owner's, and the agent asks for each by name:

**Clarity**
1. Create a project for the production site.
2. Switch its cookies off: Settings, Setup, Advanced Settings, *Cookies*. Screenshot it.
3. Give the agent the project id for production's variables; development stays empty.
4. Create a second project for the tests, its cookies off too; its id goes in the test environment only.
5. For reading it back: Settings, Data Export, *Generate new API token* (only a project admin can), added in the owner's own terminal (§ Reading it back), never pasted into the session or the repository.

**PostHog**, when it is added
1. Create the project in the US or EU cloud.
2. Switch on *Enable cookieless tracking* (Settings, Project, Web analytics).
3. Give the agent the project's API key and host for production's variables.
4. Approve the MCP server's OAuth sign-in, or make the personal API key from the *MCP Server* preset.

**PostHog**: accept its data processing agreement. **Clarity**: Microsoft says Clarity operates as a data controller, so there is no processor agreement to accept; the policy names Microsoft as a recipient acting as a controller, with its own privacy statement, and counsel decides how the product's own role in the collection is described (Clarity's FAQ, read on `2026-10-29`). **Either**: decide on consent (§ The default, and the option) and approve the policy line (`legal-pages`).

## How you can tell it worked

A visit to every tagged page leaves no analytics cookie or stored id in the browser, the visit's recording appears in the dashboard, and the agent answered a question about yesterday's visitors from the MCP server without asking the owner for a screenshot.

Related skills: `legal-pages` (the policy line, the banner when a cookie comes in) · `environments` (empty means off; the token as an operator value) · `clerk-production` (the CSP) · `propose` (weighing what people did against each hypothesis) · `app-lifecycle` (when to propose it: a landing page exists and the privacy page can promise it).
