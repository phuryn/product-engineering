---
name: chatgpt-plugin
description: "Before building, submitting or changing a ChatGPT plugin or Apps SDK app: get it through OpenAI's directory review (auth, package, OAuth, data rules, portal)."
---

# ChatGPT plugin

How to put a product into OpenAI's plugin directory, which ChatGPT and Codex share, and get through review the first time. Nothing here depends on a stack: the server is any remote MCP server, in any language, behind any OAuth provider or none. The rules come from OpenAI's own pages, read on 2026-10-26, and from two products' submissions: a live Q&A product that submitted a plugin with no sign-in (rejected once, then resubmitted), and a monitoring product preparing one behind OAuth. They appear here only as examples.

OpenAI's pages, each available as Markdown by appending `.md`: `developers.openai.com/plugins/deploy/submission`, `/deploy/submission-errors`, `/deploy/app-review`, `/plugin-guidelines`, `/build/plugins`, `/build/auth`, `/reference` and `/deploy/connect-chatgpt`.

## What binds, in order

1. **OpenAI's current pages.** They change without notice, and on 2026-10-26 they contradicted each other in six places (§ Where OpenAI's pages disagree). Read them again before every upload and every submission, and record the date. Where this skill and a page disagree, the page wins and this skill gets a dated correction.
2. **This skill**, for what the pages leave out: what the portal and the reviewers actually did.
3. **The server's own engineering rules.** This skill covers only what ChatGPT adds to an MCP server. The route, tool descriptions, output schemas and their tests are the `mcp-server` skill's, if you use this collection; this skill does not need it.

## Two ways in

| | Custom connector | Directory plugin |
|---|---|---|
| How a user gets it | adds the server's URL in ChatGPT: Plugins → + → Add custom MCP server (workspace policy permitting) | finds it in the directory, by its link or by name |
| What you ship | a remote MCP server | the server **and** a ZIP package: manifest, `mcp.json`, at least one skill, assets, review materials |
| Sign-in | whatever the server's OAuth discovery offers | declared in the package: none, OAuth, or both |
| Review | none | automated scans, then people, then daily rescans for as long as it is listed |

A server that works as a custom connector is most of the way there. The directory adds the package, the data rules, the publishing identity and the review. **Connect it as a custom connector against production first**: that is also how the review video is recorded, because before approval the plugin itself runs only as a local install (ChatGPT's desktop app, Codex), never on the web.

## Decide these first, and record them

| Decision | The default | Why it is decided before the first upload | Where |
|---|---|---|---|
| Who signs in | OAuth on the server the product already has, if it has accounts | The portal reads the authentication from each upload's `mcp.json`, but an existing connection can lock it: an anonymous server whose first package declared nothing was taken for OAuth, signed in, and only a new plugin undid it (October 2026) | `references/package.md § mcp.json` · `references/portal-and-review.md § Create the draft` |
| Which endpoint | One per plugin, on a host you will keep | Only one MCP server can be connected per plugin, and the origin (scheme, host, port) can never change: a new origin is a new plugin | `references/portal-and-review.md § After publication` |
| Which tools | The everyday actions, minus anything that takes or returns a secret | OpenAI's restricted data includes API keys and passwords, and the review reads the server's own tool list. A server whose setup tools take provider keys needs a narrowed list on a route of its own | `references/tools-and-data.md § Restricted data` |
| Who publishes | The legal entity the privacy policy and terms name, verified on the OpenAI Platform | The directory shows the verified identity chosen when the draft is created, whatever the ZIP says, and a mismatch with the legal pages was a rejection reason | `references/portal-and-review.md § Before the first upload` |
| Which project | One with global data residency | Projects with EU data residency cannot submit plugins with MCP servers | same |
| Where it is available | Everywhere (`publication.countries` omitted) | An allowlist in the package applies when the plugin is published | `references/package.md § plugin.json` |

## The rules every submission meets

- **Authentication is declared in `mcp.json`, per server, before the first upload.** For a server with no sign-in, never complete an OAuth sign-in in the portal: the connection it makes is kept. `references/package.md § mcp.json`.
- **Discovery answers the portal's scanner**, which called from outside ChatGPT's published address ranges (observed 2026-10-23). Gate tool calls, not `initialize` and `tools/list`. `references/server-and-auth.md § A surface with no sign-in`.
- **Every request's `params` may carry `_meta`, and the server accepts it.** ChatGPT sends user, session, location, trace and call ids on every tool call (twelve keys on one OAuth connector's call, 2026-10-27), and OpenAI documents a locale on `initialize`. A parser that refuses unknown keys there would refuse every one of those calls; one product's did, found in its code before any ChatGPT call. `references/server-and-auth.md § What every request carries`.
- **No tool asks for a secret and no reply contains one**, and no reply carries a field the request did not need. `references/tools-and-data.md`.
- **The privacy policy names every field a reply returns**, nested and error replies included, and a test holds the two equal both ways. A policy that summarized was a rejection reason (October 2026). `references/tools-and-data.md § The privacy policy`.
- **Every tool sets `readOnlyHint`, `destructiveHint` and `openWorldHint` explicitly**, an irreversible effect is a tool of its own, and an action stays destructive even when another tool can undo it. `references/tools-and-data.md § Annotations`.
- **Review materials travel in the ZIP; credentials never do.** Five positive cases, three negative ones, the video's link and the release notes in `plugin.json`; the reviewer's account in the portal. `references/package.md § plugin.json`.
- **The ZIP is checked, then pinned to the package.** `python <skill dir>/scripts/check_package.py <package dir> --zip <zip>` before every upload; a test in the product's suite holds the same byte-for-byte equality, because the portal reads only the ZIP and a ZIP rebuilt by hand goes stale.
- **Listing copy sells nothing.** No pricing, trials or promotions; nothing that steers the model toward the plugin; no "MCP" or "Plugin" after the name. `references/tools-and-data.md § Names, descriptions and copy`.

## The stage, in order

1. **Decide and record** the table above, in the product's decision log.
2. **The server as ChatGPT calls it**: `_meta` accepted, discovery open, OAuth meeting ChatGPT's client, the address check (if any) on the caller's own address. Connect it in ChatGPT as a custom connector against production and call every tool; record the date and what was called (`references/server-and-auth.md`).
3. **The tools and their data**: the list narrowed to what may be listed, replies allowlisted at every depth, annotations, the privacy page's field inventory, and the tests that hold them (`references/tools-and-data.md`).
4. **The package**: manifest, `mcp.json`, a skill that names the tools, assets, the five and three review cases taken from the routing evals' own file, the checker, and the ZIP pinned (`references/package.md`).
5. **The routing evals** against a local server, and **the video**, recorded in ChatGPT against production (`references/server-and-auth.md § Testing before approval`).
6. **The reviewer account**, for a server with sign-in: sample data, no emailed or texted code, a plan on which every case succeeds (`references/portal-and-review.md § Review information`).
7. **The portal**: the draft under the right identity, the Authentication field checked before connecting, domain verification, the scan, review details, then the checklist in `references/portal-and-review.md § Before you submit`.
8. **After the decision**: answer or appeal, publish when ready, and keep the live definitions working through every later deploy (`references/portal-and-review.md § After publication`).

## How you can tell it worked

Every item the review checks was verified on the deployed build before submitting, and the review came back with no fix request on any of them.

## Files

| File | Holds | Read when |
|---|---|---|
| `references/package.md` | the package's layout, every `plugin.json` field with its limit, `mcp.json`'s authentication, the skill inside the package, what cannot be submitted, pinning the ZIP | building or changing the package |
| `references/server-and-auth.md` | what every ChatGPT request carries, what ChatGPT's OAuth client needs, per-tool `securitySchemes`, a surface with no sign-in, shared addresses, testing before approval | building the endpoint, its OAuth or its address gate; testing it in ChatGPT |
| `references/tools-and-data.md` | restricted data, response minimization, the privacy policy, annotations, names and copy, and the tests that hold them | choosing the tools, shaping replies, writing the privacy page |
| `references/portal-and-review.md` | the account and identity, the draft, connecting and scanning, review information, the review, rejection and appeal, publishing, after publication, and the checklist before submitting | in the portal; answering a review; changing a listed plugin |
| `scripts/check_package.py` | checks a package folder and its ZIP against the rules OpenAI states and the traps met; errors exit 1 | before every upload |
| `scripts/test_check_package.py` | builds a valid package and breaks it one way at a time | after every edit to the checker |

## Where OpenAI's pages disagree

As read on 2026-10-26. Follow the stricter reading until the pages agree, and correct this list when they do.

- **Annotation justifications.** The guidelines say "Annotation justifications are no longer required." The submission-errors page still lists `justification_required` ("Every MCP tool annotation must include a justification") and a final-submission requirement of "a justification for each value on every MCP tool". Keep one sentence per hint per tool ready; it does not change the hint, which comes from the server.
- **Changing the server's URL.** The submission page says "To change an existing MCP server's URL, contact support; the current update flow does not support URL changes." The review page says a new origin needs a new plugin and a new path goes through the normal new-version flow. Treat the origin as permanent and a path change as a support conversation that may not be needed.
- **A rejected package.** The submission page says "For a rejected package, address the feedback and submit a corrected ZIP." On 2026-10-19 OpenAI support called a rejected plugin that could not be updated a known issue, with a new plugin as the fallback. Try the corrected ZIP first.
- **The package `name`.** The submission page asks for "lowercase letters, numbers, and single hyphens"; the submission-errors page allows "ASCII letters, digits, `_`, or `-`". Use the first.
- **The root `description`.** "At most 4000 characters" on the submission page, "1,024 characters or fewer" on the submission-errors page. Keep it within 1,024; the checker does.
- **Screenshots.** The guidelines say screenshots "are no longer shown in the Directory"; the submission-errors page allows them only when the tool scan reports a UI output template, one per starter prompt, exactly 706 px wide and 400–860 px tall. Without custom UI, ship none and write starter prompts instead.

## When something is learned

- **This skill is general and will be published.** Write the rule and why it holds; a product appears only as an example, named by kind, never by its name, listing or plugin id, commits, paths or account names.
- **Date what OpenAI did or required** ("read on", "observed in"). When it changes, correct the line; never leave the old one beside the new.
- **What is true of one product goes in that product's repository**: its plugin's id, package versions, review states and dates, the identity it publishes under, its verified clients.
- **A rule a test or the checker can hold gets one**, and this skill says what it asserts.
