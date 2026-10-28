---
name: mcp-server
description: "Before adding a remote MCP server or tool to a web product, adding OAuth to it, or listing it in a directory: ship it right the first time, tests included."
---

# MCP server

How to put a remote MCP server in front of outside agents and get it listed, written so the next product does not relearn it. The lessons come from products built on the same stack (Next.js + Supabase + Clerk + Netlify): a live Q&A product with an authenticated server, a stdio package and an anonymous ChatGPT plugin, and a monitoring product that decided against any unauthenticated surface. They appear here only as examples.

What is true of one product alone lives in that product's repository, in records this skill names by what they hold:

- **the API contract**: every REST route and MCP tool, what it accepts, returns and refuses;
- **the distribution record**: one row per listing (directory, registry, package), with its state, its date and how it is updated, and each client verified, with the date and what was called;
- **the decision log**: dated decisions that had real options, each with its reopen trigger;
- **the backlog**: deferred work, each item with the trigger that reopens it.

Clerk's settings for OAuth are **not** here. They are in `clerk-production` § MCP OAuth, with the four behaviours the route must allow for: a discovery list that is not the token's shape, a `503` for a verifier outage, an unknown `kid` refused before Clerk sees it, and revocation unseen until expiry. Read that section before writing the route; this skill does not repeat it.

## What binds, in order

1. **`saas-authorization`.** A tool is a route: its caller is resolved by the three functions, deterministic code decides what it may do, and everything it returns that a person wrote is untrusted text.
2. **`clerk-production` § MCP OAuth** for every Clerk setting, applied and re-read per instance.
3. **This skill** for the server, its tools, the directories, the clients and the package.
4. **The directories' own current pages.** They change without notice: read them again before every submission, and record the date you read them. Where this skill and a directory's page disagree, the page wins and this skill gets a dated correction.

## Decide these first, in the product's decision log

| Decision | The default | The other choice, and what it costs | Where |
|---|---|---|---|
| Does anything answer without sign-in? | **No: every call is authenticated, `initialize` included**, by Clerk OAuth or a workspace API token | An anonymous surface buys users who have no account, such as a ChatGPT plugin that makes a room with no sign-up. It costs a new kind of caller, an identity only the platform can vouch for, limits and a lifetime of its own, a disclosure burden, and in OpenAI's directory a package that declares it before the first upload. A monitoring product declined it: "we do not do MCP without authentication" | `references/server.md § Who may call it` · the `chatgpt-plugin` skill |
| Who may connect? | An admitted OAuth caller gets the full grant a new API token carries, so admit by **the permission that mints such a token**, checked through the three functions on every call | A role compared by name, or a neighbouring permission the same role happens to hold today, hands write to whichever role is given that permission later. A caller without the permission gets a clear `403`, never a narrower connection | `references/server.md § Who may call it` |
| What must an agent never do? | A written list, held in code, and said in the instructions and the README | Examples: an audience product's agents cannot ask, vote or delete; a monitoring product's cannot delete, change billing, manage tokens or publish an incident note | `references/tools.md § Choosing the tools` |
| Must a sign-up that starts in an agent work? | Yes, for a product whose first user may arrive through an agent | Refusing the first call until the dashboard has been opened sends that user out of the agent; a Clerk setting and a workspace made on the first authenticated call close the gap | `references/server.md § The first call` |
| The path | `/api/mcp` or `/mcp`, chosen once | The OAuth audience and both protected-resource documents (the path's own and the root alias) name that exact URL, and the `401` challenge points at the path's own document; the authorization-server document stays Clerk's, relayed | `references/server.md § The route` |

## The rules every change meets

- **Descriptions, titles and the server's instructions are product copy, and each sentence is a claim.** Directories score them and show them; agents choose tools from them alone. Review them like code: one server's first independent round over rewritten descriptions found eight sentences the code did not keep, and they took five rounds to come back clean. `references/tools.md`.
- **Every argument has a description and every tool an `outputSchema`, and a test holds both against the real handlers.** Smithery scores each out of 10, and a server without them scored 0 on both (October 2026). `references/tools.md § The tests`.
- **Every tool carries a `title` and the hints a directory requires.** Claude's directory flags a tool without a title and without `readOnlyHint` or `destructiveHint`; OpenAI's listing check flagged a tool that closed something while declaring itself not destructive. `references/tools.md § Annotations`.
- **`tools/list` has a size budget**, because every client loads it into the model's context. Pin it in a test: per-field output descriptions once took one server from 12 KB to 49 KB.
- **Log every call, refused ones included, before the server is listed anywhere.** It is the only way to learn which clients and directories actually call you. `references/server.md § The per-call log`.
- **A client is supported only once a happy path with it is recorded**, by this product, against this product, with the date, the client and what was called. A client another product verified, or someone reports working, is unverified for you. `references/clients.md`.
- **A change to the tool surface owes the package and the directories, after promotion**, and a change to a description or a schema is a change to the surface: output schemas added to one hosted server never reached its package, which then offered a different surface from the one directories scored. `references/companion-repo.md § After a product release`.
- **Everything is published from the owner's account.** The registry namespace comes from the GitHub login that publishes, and a listing's maintainer is whoever claimed it; check which account the CLI is logged in as before any listing (`gh api user --jq .login`).

## The stage, in order

1. **REST functions first.** MCP and REST call the same module, so the two can never disagree about what a call does. REST stays token-only; OAuth is for MCP clients.
2. **The route**: stateless Streamable HTTP, the challenge, the three layers of error, the limits, the log (`references/server.md`).
3. **The tools** and their two tests (`references/tools.md`).
4. **OAuth** per `clerk-production` § MCP OAuth, then an automated real grant and a real client (`references/server.md § Proving it`).
5. **The docs**: the API contract, a public page for developers pinned to the code by a test, and the distribution record.
6. **The release** with its review rounds (the `grok-agents` skill); descriptions and instructions are in the subject, not context.
7. **Listings** (`references/directories.md`; a ChatGPT plugin, the `chatgpt-plugin` skill) and **the package** (`references/companion-repo.md`), after promotion, from what production serves.

## How you can tell it worked

A real client connects to the deployed server, signs in, lists the tools and calls one as a member, and the tests cover each tool's permission check.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/server.md` | who may call it, and what an anonymous surface costs; the first call of an agent-first sign-up; the route, its errors and transport; limits; the per-call log; proving it works | building or changing the route, its auth or its limits; deciding on an anonymous surface |
| `references/tools.md` | naming; choosing the tools; descriptions, arguments, results, output schemas, annotations, the server's instructions; the two tests | adding or changing any tool, or the instructions |
| `references/directories.md` | each directory and registry: what it lists, requires, scores or refuses, and how a listing is kept current | listing the server, answering a review, rescanning after a change |
| `references/clients.md` | each client: how it connects, what to verify, what is known about it | writing setup instructions, or saying which clients work |
| `references/companion-repo.md` | the public repository and the stdio package: layout, README, the package's rules, one version everywhere, the release procedure, what a product release owes it | creating the repository, changing the package, releasing it |

## When something is learned

- **This skill is general and will be published.** Write the rule and why it holds. A product appears only as an example, named by kind ("a live Q&A product"), never by its commits, release codes, file paths, listing or plugin ids, pull-request numbers or account names.
- **Date what a platform or directory did or required** ("read on", "observed in"), because they change without notice. When one changes, correct the line; do not leave the old one beside the new.
- **What is true of one product goes in that product's repository**: its listings and their states, versions, verified clients, open reviews and receipts, in its distribution record, API contract or backlog.
- **A rule a test can hold gets the test**, and the skill says what the test asserts, not where one product keeps it.

## Where the copies live

- **Each product carries its own copy** at `.claude/skills/mcp-server/` (or `.agents/skills/`), and a lesson a product learns goes back to your master copy, generalized. `diff -r <master>/mcp-server <product>/.claude/skills/mcp-server` shows what has not.
- **A builder that is not Claude Code reads these as plain files.** A stage brief for the MCP server names this folder by path.
