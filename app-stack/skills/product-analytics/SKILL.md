---
name: product-analytics
description: "Adding analytics, session recordings, heatmaps, 'what did users do', Clarity or PostHog: behaviour analytics with no cookie banner, read back by the agent, and what changes when a cookie comes in."
---

# Product analytics: what people did, with no cookie banner

After the first release, the next round starts from what people did: where they clicked, where they stopped, what they never found. This skill sets that up so the product still ships with essential cookies only and no consent banner, and so the agent can read the data back itself instead of asking the owner for screenshots.

It was learned on a monitoring product and a live Q&A product, named here only by kind.

## The default, and the option

- **Microsoft Clarity, cookies off: the default.** Session recordings, one page each without cookies, and heatmaps, free, with the project's cookies switched off and storage consent denied from the page, so nothing follows a visitor between visits and no banner is needed.
- **PostHog, when the question needs events**: funnels, retention, a feature's use counted per account, experiments. Run it without cookies too (§ PostHog); the moment it, or anything else, sets a cookie that is not essential, § When a cookie comes in applies.
- Both can run. Start with Clarity on the public pages; add PostHog when a question names an event.

## What binds

1. **Off without a project id.** An empty id means no script, no request and nothing to consent to (`environments`, optional feature switches). Development leaves it empty, so the owner's own testing never lands in the data.
2. **Clarity's two halves, and only one of them is code.**
   - **The dashboard (the owner):** the project's cookies switched off, which puts it in consent mode. Screenshot the setting when it is set.
   - **The page (the agent):** a script that runs before the tag sends `window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' })`. Clarity then gives each page view its own id, writes no `_clck` or `_clsk` cookie, and cannot follow anyone between visits.
   - **What it costs:** without cookies each page view is its own session and every visitor counts as new, so read pages, flows and where people stop, not visitors or pages per session. Since 31 October 2025 Clarity also applies consent mode by default to visitors from the EEA, the UK and Switzerland; the page's own denial makes every visitor the same, wherever Clarity places them (Clarity's docs, read on `2026-10-29`).
   - **Held by tests:** a unit test fails if the word `granted` appears anywhere in the component, and a browser test reads the cookie jar after visiting every public page, because the privacy policy promises both halves and a dashboard setting is something a person can flip. By hand, in the browser console: `clarity('metadata', (d, upgrade, consent) => console.log(consent), false, true, true)` prints both storage types `DENIED`.
3. **The privacy policy names the tool in the change that adds its tag**, never before and never after (the `legal-pages` skill). (The live Q&A product's original ask requested the analytics sentence before the tag existed: exactly the overclaim that rule forbids.)
4. **The Content-Security-Policy admits the tool's origins only once it is wired** (`clerk-production`, the CSP). Clarity's docs name `*.clarity.ms` and `c.bing.com`; PostHog's name `*.posthog.com`, plus `worker-src 'self' blob: data:`, or only the product's own domain behind a reverse proxy (both read on `2026-10-29`).
5. **Start on the public pages.** A recording shows what was on the screen, so recording a signed-in member's screens sends their workspace's data to the vendor. Before adding the tag there, set the tool's masking to its strictest and say so in the policy.
6. **The agent reads the data back itself** (§ Reading it back), through the vendor's MCP server, with a token the owner made. The token is an operator value, one per environment, never in the app's runtime (`environments`).

## PostHog

PostHog's own docs, read on `2026-10-29`:

- **Cookieless:** `cookieless_mode: 'always'` in the `posthog-js` init, **and** *Enable cookieless tracking* switched on in the project's settings (Settings, Project, Web analytics), without which cookieless events are ignored. PostHog says this needs no banner unless something else on the site uses cookies.
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

- **Clarity:** Microsoft's `@microsoft/clarity-mcp-server`, run locally with `npx` and the owner's API token (`--clarity_api_token`). Its tools query the dashboard's metrics, list session recordings, and search Clarity's documentation. Clarity's export answers **ten requests a project a day, about the previous one to three days**, so a weekly read is seven daily reads, each kept in the repository's notes; the agent spends the ten on the question asked, not on browsing.
- **PostHog:** its hosted server at `https://mcp.posthog.com/mcp`, which its docs say routes to the project's region (its repository names `mcp-eu.posthog.com` for EU projects). Sign in by OAuth, or with a personal API key made from the *MCP Server* preset, and connect read-only (`?readonly=true`), because the agent is there to read. In Claude Code: `claude mcp add --transport http posthog "https://mcp.posthog.com/mcp?readonly=true" -s user`. Calling it is free; the queries count as ordinary PostHog usage, and its AI-backed tools may bill as PostHog AI spend.

## What the owner does by hand

The agent wires the tag, the denial, the tests, the CSP and the policy line. These are the owner's, and the agent asks for each by name:

**Clarity**
1. Create a project for the production site.
2. Switch its cookies off: Settings, Setup, Advanced Settings, *Cookies*. Screenshot it.
3. Give the agent the project id for production's variables; development stays empty.
4. For reading it back: Settings, Data Export, *Generate new API token* (only a project admin can), handed to the agent's MCP setup, never to the repository.

**PostHog**, when it is added
1. Create the project in the US or EU cloud.
2. Switch on *Enable cookieless tracking* (Settings, Project, Web analytics).
3. Give the agent the project's API key and host for production's variables.
4. Approve the MCP server's OAuth sign-in, or make the personal API key from the *MCP Server* preset.

**Either**: accept the vendor's data processing agreement, and approve the policy line (`legal-pages`).

## How you can tell it worked

A visit to every public page leaves no analytics cookie in the jar, the visit's recording appears in the dashboard, and the agent answered a question about yesterday's visitors from the MCP server without asking the owner for a screenshot.

Related skills: `legal-pages` (the policy line, the banner when a cookie comes in) · `environments` (empty means off; the token as an operator value) · `clerk-production` (the CSP) · `propose` (weighing what people did against each hypothesis) · `app-lifecycle` (when to propose it: a landing page exists and the privacy page can promise it).
