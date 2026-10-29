# app-stack — build a SaaS with coding agents

Next.js (App Router) + Supabase + Clerk + Netlify, from an idea to a product in production. The rules were learned on real products; each states its principle first, so most carry to another stack.

## Install

```bash
claude plugin marketplace add phuryn/product-engineering
claude plugin install app-stack@product-engineering
```

Codex, Cursor and other agents: see the collection's root `README.md`.

## Skills (14)

- **app-lifecycle** — The detailed path for a SaaS from idea to production, stage by stage: what each produces, when it is done, what each product shape skips, and which capability to propose next when its trigger fires. It takes an accepted proposal and prototype from the `product` pack's `propose` as its first stages.
- **saas-authorization** — Who may do what in a multi-tenant app: workspaces, the three functions every route goes through, permissions vs roles vs entitlements, invariants as database constraints, and the threat model every app has.
- **supabase-production** — The choices Supabase's own skill can't make: the server as the only database client, RLS on with zero policies, migrations by CLI with the target spelled out, production reached only by its own connection string, and how to tell whether a push applies migrations.
- **clerk-production** — The choices Clerk's own skills can't make: verify never decode, sign-in landing, organizations and billing, the CSP header, MCP OAuth, the authenticated test mile and the gotchas that failed silently.
- **environments** — Development and production kept apart: the verified mapping, branches, the migrations window, variables and secrets (with a schema that runs at build), backups, incidents, the domain and the agent's access to each provider, and showing development to the owner.
- **design** — How product UI is designed, built and judged: the method every kit and screen satisfies, which design skill collection leads at each stage, what a screen may claim, and reviewing the look with its owner.
- **mcp-server** — Shipping a remote MCP server right the first time: authentication, the route, tool descriptions and schemas held by tests, directory listings and what each requires, verified clients, and a companion package.
- **chatgpt-plugin** — Getting a plugin into OpenAI's plugin directory through review the first time, on any stack: the authentication decided before the first upload, the package and a script that checks it, ChatGPT's OAuth client and request metadata, the data and annotation rules review enforces, the reviewer account, the portal's traps, rejection, and what changes after publication.
- **embedded-agents-messages-api** — Embedding Claude agents in the app on the Claude API — the default: one wrapper, agents as directories, exactly the tools the app gives them, streamed to a chat UI.
- **embedded-agents-agent-sdk** — The same agent directories on the Claude Agent SDK, for an agent that needs Claude Code's built-in tools.
- **transactional-email** — Sending email from the app through a provider: an outbox, durable receipts and reconciliation instead of a promise of exactly-once, one-click unsubscribe, and a provider server per environment.
- **uptime-monitoring** — Knowing the app is down before its users do, on any monitoring service: content checks instead of status codes, confirmation from a second location, heartbeats for scheduled jobs, monitoring that doesn't run on what it monitors, and an alert route proven by a controlled failure. One adapter is included, for Staygreen, a monitoring service made by this collection's author.
- **product-analytics** — What people did, without analytics cookies: session recordings and heatmaps from Microsoft Clarity with cookies off by default, PostHog when you need events and funnels, the data read back by the agent through each vendor's MCP server, and what changes (a banner, a policy line, the owner's dashboard steps) when a cookie comes in.
- **legal-pages** — Terms, a privacy policy and consent at sign-up, drafted from what the code collects and sends while it is built, held to it by a test, with the facts only the owner has and the owner's approval.

## Author

Paweł Huryn — [The Product Compass](https://www.productcompass.pm)
