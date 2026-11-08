---
name: product-analytics
description: "Adding analytics, session recordings, heatmaps, 'what did users do', Clarity or PostHog: behaviour analytics without analytics cookies, read back by the agent."
---

# Product analytics: what people did, without analytics cookies

**Start the next round from what people did after release.** Look at clicks, stopping points and things people never found. Set up analytics without analytics cookies, keeping only essential cookies, and let the agent read the data without asking for screenshots.

Every vendor fact carries the date it was read.

## The default, and the option

- **Default to Microsoft Clarity with cookies off.** Session recordings, one page each without cookies, and heatmaps, free, with the project's cookies switched off and storage consent denied from the page, so Clarity sets no cookie and cannot follow a visitor between visits. Not on a product aimed at people under 18, where Clarity says it shouldn't be used (Clarity's FAQ, read on `2026-10-29`).
- **That removes the cookie, not the question.** The EDPB reads ePrivacy Article 5(3) as covering any script that has the browser send information (Guidelines 2/2023, § 33), so whether the product may record visitors without a consent banner where it is offered is the owner's decision, with their counsel. The agent asks for it by name before the tag goes on, and never states it as settled. If consent is needed, the tag loads only after the visitor accepts, through the banner in § When a cookie comes in, with the denial still queued so it stays cookieless, and the browser test proves nothing from the tool loads before acceptance.
- **Add PostHog when the question needs events.** Use it for funnels and counts on the landing page within a day, on anonymous visitors, without cookies (§ PostHog). Retention, use per account and experiments need an id that lasts (`identify()` or a stored id), which PostHog says makes the id personal data and undoes the cookieless mode. That id, and PostHog on any page past the landing page, are each a new decision for the owner, built and reviewed as its own change (§ PostHog, Start PostHog only in Clarity's tag component behind the same check); an id that lasts also brings everything in § When a cookie comes in.
- **Start with Clarity on the landing page (rule 5).** Both can run; add PostHog when a question names an event.

## What binds

1. **Off without a project id.** An empty id means no script, no request and nothing to consent to (`environments`, optional feature switches). Development leaves it empty, so the owner's own testing never lands in the data.
2. **Clarity's two halves, and only one of them is code.**
   - **Have the owner switch the project's cookies off.** Switch the project's cookies off in the dashboard, putting it in consent mode. Screenshot the setting when it is set.
   - **Define Clarity's queue and queue denial before the tag runs.** The agent adds a script before the tag: `window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments) }; window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' })`. Called before the queue exists, the denial throws, and nothing else notices. Clarity then gives each page view its own id, writes no `_clck` or `_clsk` cookie, and cannot follow anyone between visits.
   - **Read pages, flows and stopping points, not visitors or pages per session.** Without cookies each page view is its own session and every visitor counts as new. Since 31 October 2025 Clarity also applies consent mode by default to visitors from the EEA, the UK and Switzerland; the page's own denial makes every visitor the same, wherever Clarity places them (Clarity's docs, read on `2026-10-29`).
   - **Test the denial and measure storage with the tag running.** A unit test fails if `granted` appears anywhere in the component or denial is not queued before adding the tag's script. With the test project's id (§ What the owner does by hand), a browser test first proves that script loaded. An unknown id gets an empty answer and loads nothing. Then visit every tagged page and read the cookie jar, `localStorage`, `sessionStorage` and IndexedDB. The privacy policy promises both halves, and a person can flip the dashboard setting. Where the local gate runs no vendor, the browser test is guarded live (the `derive-tests` skill: behind an explicit flag), skipping loudly without a test id, and the `release-gate` checklist runs it at each release that touches a tagged page or the tag. On production, the page's half is the same build the unit test held, and the dashboard's half shows only in the dashboard, so its screenshot is the evidence (§ What the owner does by hand, step 2).
3. **Add the analytics policy sentence with the tag and gate its rendering.** Render it only when the project id is set, so no deploy names a tool that does not load. The legal test pins both states (apply `legal-pages`; `ui-design`, `references/screens.md`).
4. **The Content-Security-Policy admits the tool's origins only once it is wired.** Apply `clerk-production`, the CSP. Clarity's docs name `*.clarity.ms` and `c.bing.com`; PostHog's name `*.posthog.com`, plus `worker-src 'self' blob: data:`, or only the product's own domain behind a reverse proxy (both read on `2026-10-29`).
5. **Tag only the landing page, as a document of its own.** Clarity records the address and referrer of the page it runs on, and of every page the visitor reaches without a full page load, because it follows the browser's history (Microsoft's `clarity` repository, `packages/clarity-js/src/core/history.ts`); its masking covers neither referrers nor query parameters it was not asked to mask (Clarity's FAQ; both read on `2026-10-29`). In one root layout, a document that moved without a full page load can hold pricing (checkout for members), sign-up (which carries the identity provider's invitation ticket in its query), the member home, or a page whose unguessable id is its only lock (`saas-authorization`), in its history or ahead of it. So:
   - **Add the script only to a document holding solely the landing page.** The tag's component checks: `const n = window.navigation; if (n && location.pathname === '/' && n.entries().filter((e) => e.sameDocument).length === 1) addTag()`. Add nothing where the Navigation API is missing. Links to a landing page can carry ad click ids (`gclid`, `fbclid`) and an email platform's subscriber id (Klaviyo's `_kx`), which PostHog's own code lists as personal data (posthog-js, read on `2026-10-29`). PostHog masks its own list and, through `custom_personal_data_properties`, the rest the agent names (§ PostHog). Clarity records the page address as it is unless its support masks named parameters for the project (page addresses only, not referrers or clicked links; Clarity's FAQ, read on `2026-10-30`), so before the tag goes on the agent names to the owner every click id in posthog-js's `PERSONAL_DATA_CAMPAIGN_PARAMS` (`gclid`, `fbclid`, `msclkid`, `ttclid`, `li_fat_id` …) and the subscriber id of the owner's email platform, whether or not today's links carry them, and the owner has Clarity's support mask them in both projects or decides with counsel to record them. Never strip them in the browser: called from the tag's mount effect, `history.replaceState` runs before Next's router patches the History API, and the router writes the original address back at its next refresh or server action (Next 16 `app-router.tsx`, read on `2026-10-30`). A load at `/` is not enough: after a client-side arrival (a `<Link>`, `router.push`, the identity provider's redirect after sign-out), a reload, a Back that reloads the page, or a link to `/` followed while on it keeps the entries reached before, and Back reaches them inside the same document (observed in Chrome 156, `2026-10-29`);
   - **Make every way out of the landing page a full load.** Use a plain `<a href>`, never `<Link>`, `next/form`'s `<Form>`, `router.push` or a server action that redirects, and nothing from the identity provider's client library on the page (its sign-in and user buttons, its sign-up form, its pricing table, its hooks); the provider in the root layout stays (`clerk-production`), and any plan cards the landing shows are its own, read from the billing file (`app-lifecycle`, default choices, pricing); a landing that names no price shows none;
   - **Send `Referrer-Policy: strict-origin` across the whole site.** Set it (`clerk-production`, the CSP), so no page hands its address to the next, and the raw-response check there reads it on the landing page and on a page reached by an id;
   - **Test every departure and history path for full loads and no analytics.** A browser test opens the landing page and follows each of its same-origin links that leave `/` (not `mailto:` or `tel:`, a link that opens a new tab, a link to another origin, or a link to `/` itself or a fragment on it) and submits each of its forms with valid test values, failing when a link or a submission changes the address or adds a history entry without a new `load` event, or when the page it reaches adds a `*.clarity.ms` script or sends a request there after its own `load` event. Then, from the member home, it signs out onto the landing page and walks each path from there, signing in and out again before the next: Back; a reload of `/`, then Back; the landing page's link to `/`, then Back; a public page, Back to `/`, then Back again. Each fails on any request to `*.clarity.ms` from the sign-out on.
   - **Hold the client-library ban with the front door's source guard.** Once any file imports the tag's component, wherever it is mounted and whatever its project id, it fails on any import from the identity provider's client library in every layout, template, loading, error, global-error and not-found file around the landing page, the landing page and every component they import, the root layout's provider excepted (`clerk-production`, the front door).

   **Tag another page only after the owner decides.** Use the tool's strictest masking and state it in the policy.
6. **The agent reads the data back itself.** Use the vendor's MCP server. The agent uses a token the owner made (§ Reading it back). The token is an operator value, one per environment, never in the app's runtime (`environments`).

## PostHog

**Keep PostHog cookieless and within the same landing-page boundary.** These are PostHog's own docs, read on `2026-10-29`:

- **Enable cookieless mode in both code and the project settings.** Set `cookieless_mode: 'always'` in `posthog-js` init and switch on *Enable cookieless tracking* in project settings (Settings, Project, Web analytics), without which cookieless events are ignored. PostHog says this needs no banner unless something else on the site uses cookies; the consent question (§ The default, and the option) still applies.
- **Cookieless PostHog counts each visitor as new every day.** Session replay and surveys are off for anyone who has not consented. For recordings, keep Clarity beside it.
- **Start PostHog only in Clarity's tag component behind the same check.** It runs only on the landing page, never from `instrumentation-client.ts` or a provider in a layout, as PostHog's Next.js guide does, and with `mask_personal_data_properties: true` and `custom_personal_data_properties` listing every parameter the agent named that PostHog's own list lacks (an email platform's subscriber id other than Klaviyo's `_kx`, such as Mailchimp's `mc_eid`), both held by a unit test. A source guard fails on any import of `posthog-js` outside that component. The test environment gives PostHog a fake key, so rule 5's browser test first sees its request from the landing page, then fails on one to its host (or the proxy path) wherever it fails on `*.clarity.ms`. PostHog past the landing page is a new decision for the owner, built and reviewed as its own change.
- **`on_reject` captures nothing until the visitor has chosen.** That means a banner: § When a cookie comes in.
- **Have the owner choose the cloud by where users are.** PostHog has US and EU clouds (`https://eu.i.posthog.com`). PostHog recommends a reverse proxy through the product's own domain before production, which it says typically captures 10 to 30% more events; the CSP then admits only that domain.

## When a cookie comes in

**Explain all three changes before adding any non-essential cookie.** This includes PostHog with cookies on, advertising pixels, chat widgets and anything else:

1. **Load nothing that sets the cookie before the visitor accepts.** Add a consent banner. Nothing that sets the cookie loads before the visitor accepts; refusing is as easy as accepting, and the choice can be changed later from the footer. The unit test turns around: it fails if the tag loads before consent.
2. **Name the cookie in the policy in the same change.** Include who sets it, what for and how long it lasts; apply `legal-pages`.
3. **List the owner's dashboard steps by name for that tool.** Include the setting that turns cookies on, the data processing agreement, the data region, and the retention period.

## Reading it back

**Read the data, answer the question and weigh it against each hypothesis.** Apply `propose`. Both servers below are the vendors' own (read on `2026-10-29`). Add each at user or local scope, never to a committed MCP config, because the credential travels with it.

- **Read Clarity through Microsoft's own local MCP server.** Use Microsoft's `@microsoft/clarity-mcp-server`, run locally with `npx`. It reads the owner's API token from the `CLARITY_API_TOKEN` environment variable (version 2.0.1, read on `2026-10-29`), so the owner, with that variable loaded from the operator's file, adds the server in their own terminal as an environment value, never an argument: `claude mcp add -e CLARITY_API_TOKEN="$CLARITY_API_TOKEN" --scope user clarity -- npx -y @microsoft/clarity-mcp-server`. That leaves a plaintext copy in the owner's Claude Code configuration (`~/.claude.json`), so list it in the variables doc's copies table, and a rotation removes the server (`claude mcp remove --scope user clarity`) and adds it again with the new value (`environments`). Nobody pastes the token into the session. Its tools query the dashboard's metrics, list session recordings, and search Clarity's documentation. Clarity's export answers ten requests a project a day, about the previous one to three days, so a weekly read is seven daily reads, each kept in the repository's notes as counts and paths, with every id in an address replaced by `:id`; the agent spends the ten on the question asked, not on browsing.
- **Connect to PostHog's hosted MCP server read-only.** Use its hosted server at `https://mcp.posthog.com/mcp`, which its docs say routes to the project's region (its repository names `mcp-eu.posthog.com` for EU projects). Sign in by OAuth, or with a personal API key made from the *MCP Server* preset, and connect read-only (`?readonly=true`), because the agent is there to read. In Claude Code: `claude mcp add --transport http --scope user posthog "https://mcp.posthog.com/mcp?readonly=true"`. Calling it is free; the queries count as ordinary PostHog usage, and its AI-backed tools may bill as PostHog AI spend.

## What the owner does by hand

**Ask the owner for each dashboard action and decision by name.** The agent wires the tag, denial, tests, CSP and policy line. These remain the owner's:

### Clarity
1. **Create a Clarity project for the production site.**
2. **Switch Clarity's cookies off and screenshot the setting.** Use Settings, Setup, Advanced Settings, *Cookies*.
3. **Create a second Clarity project solely for tests.** Switch its cookies off too; its id goes in the test environment only.
4. **Mask the named URL parameters or decide with counsel to record them.** Ask Clarity's support to mask them in both projects. Keep the reply beside the cookies screenshot.
5. **Give production's project id only after support replies or counsel decides.** Until then, production's id stays empty, so no tag loads. Give it to the agent for production's variables; development stays empty.
6. **Generate the read-back API token and add it in your own terminal.** Only a project admin can: Settings, Data Export, *Generate new API token*. Use § Reading it back; never paste it into the session or repository.

### PostHog, when it is added
1. **Create the PostHog project in the chosen US or EU cloud.**
2. **Switch on PostHog's cookieless tracking.** Use *Enable cookieless tracking* in Settings, Project, Web analytics.
3. **Give the agent PostHog's API key and host for production's variables.**
4. **Approve MCP OAuth or create a key from its preset.** Use the *MCP Server* preset for the personal API key.

**Accept PostHog's processing agreement and decide consent for either tool.** For Clarity, Microsoft says it operates as a data controller, so there is no processor agreement to accept. The policy names Microsoft as a recipient acting as controller with its own privacy statement. Counsel decides how the product's own collection role is described (Clarity's FAQ, read on `2026-10-29`). For either tool, decide consent (§ The default, and the option) and approve the policy line (`legal-pages`).

Each rule's origin, the case that taught it, is in `receipts.md` beside this file; read it when a rule's edge is unclear.

## How you can tell it worked

Every tagged-page visit leaves no analytics cookie or stored browser id, and its recording appears in the dashboard. The agent answered a question about yesterday's visitors through MCP without asking the owner for a screenshot.

Related skills:

- `legal-pages` (the policy line, the banner when a cookie comes in)
- `environments` (empty means off; the token as an operator value)
- `clerk-production` (the CSP)
- `propose` (weighing what people did against each hypothesis)
- `app-lifecycle` (when to propose it: a landing page exists and the privacy page can promise it).
