# ai-shipping — ship AI-built apps

For builders, PMs and founders accountable for AI-built code. Document a vibe-coded app, review it for correctness, security and performance defects, prove it with a test harness that fakes the right side, and release it through a gate the owner says go to.

It is where the AI Shipping Kit from [pm-skills](https://github.com/phuryn/pm-skills) moved: its three skills and the five workflows that are commands there, plus `release-gate` and `test-harness`. `pm-ai-shipping` in pm-skills now only points here, so once this pack is installed, turn it off.

## Overview

AI agents write code fast but leave no record of *intent* — what the system should do, who may do what, where the secrets live. Without that record, no human and no auditing agent can tell whether the code is safe to ship. This kit restores reviewability: it documents the system, then audits the gap between what the docs say and what the code does — the class of bug generic scanners miss because they have no model of intent.

Start the whole sequence yourself with the ship check: `/ai-shipping:ship-check` in Claude Code, `$ai-shipping:ship-check` in Codex. Every stage of it is also a skill of its own that starts when you ask for that stage ("document the app", "what should we test", "run a security audit").

Folders and file names are defaults. The kit follows the repo's own setup — its agent instructions, its docs folder, and the documents and test-coverage file it already has — and falls back to `documentation/`, `documentation/tests.md` and `reports/` only where the repo has none, saying so in its output.

The two static audits take a git range (`<base>..<head>`, such as a release's unreleased commits) or `changes` (the uncommitted working tree) and then audit only the change: the changed files plus what the change makes newly reachable or newly wrong elsewhere. A release normally audits only its changes; audit the whole repository for the first release, or after a large refactor.

For a repo that keeps its docs and coverage map by hand as intent, `document-app` and `derive-tests` in `check` mode are the release-time form ("check the docs against the code"): they write no file, list each disagreement with `file:line` on both sides, leave the owner to decide whether the code or the doc is wrong, and end with a one-line summary a release checklist can cite.

## Install

```bash
claude plugin marketplace add phuryn/product-engineering
claude plugin install ai-shipping@product-engineering
```

Codex and other agents: see the collection's root `README.md`. Any skill can be started by name: `/ai-shipping:<skill>` in Claude Code, `$ai-shipping:<skill>` in Codex. All but `ship-check` also start on their own when the work matches.

## Skills (10)

**You start it:**

- **ship-check** — Turn a vibe-coded repo into a reviewer-ready shipping packet: document, wire agent context, run correctness, security and performance reviews, add an independent unsteered pass by a fresh reviewer that never saw the build (the reviewer the repository's instructions name, when it can run the way `grok-agents` requires; otherwise, through the `grok-agents` wrapper it carries: Grok when its CLI is installed, so another model family, or a fresh read-only Claude Code session; with neither CLI, a fresh read-only session of your own agent, given the prompt the wrapper writes), map test coverage, and compile the results. Only when you start it, because it writes docs, the agent instructions and the coverage map, and takes a long session; where docs already say what the product should do, or whoever runs the gate keeps the coverage map, it lists what it would overwrite and asks first.

**They start on their own:**

- **shipping-artifacts** — The durable documentation set that makes an AI-built app reviewable: a core every app needs (architecture, user/permission flows, permissions, variables/secrets, test-coverage map) plus conditional docs added only when they apply (emails, cron, SEO, embedded agents/automation). Defines what each doc must capture and how a reviewer uses it.
- **code-review** — The top-level review skill. Correctness is its core; **performance and security are optional sub-cases** of the same engine. Anchors on agreements between participants across a boundary — the defects that are invisible file-by-file because each side looks reasonable alone — forces a violating execution, and refutes every candidate before reporting.
- **release-gate** — How a change ships: the three moments and their bars (a stage done, a push that deploys, a promotion), the owner's preview, the preconditions, go/no-go, promote, and proving the build serving is the one reviewed. Learned on Next.js + Supabase + Clerk + Netlify, principle first.
- **test-harness** — How to test an AI-built app so a green gate means something: what each harness fakes, the script contract, the authenticated mile, the rules that came from bugs, what to do when a fix doesn't land, and the coverage map written by whoever ran the gate.
- **intended-vs-implemented** — The method for finding the gap between what a system is documented to do and what the code actually does, with cited evidence on both sides and without hand-wavy findings.
- **document-app** — Reverse-engineer a codebase into the system documents reviewers and auditors need — a core set (architecture, flows, permissions, variables) plus conditional docs (emails, cron, SEO, automation) when they apply. In `check` mode it writes nothing and reports where the existing docs and the code disagree.
- **derive-tests** — Turn documented intent into a test-coverage map: inventory the tests that exist today, separate them from proposed tests and unverified gaps, mark each by what it depends on, and recommend a gate that follows the repo's stated gate policy (a green-before-merge CI gate where it states none). In `check` mode it writes nothing and reports where the coverage map is stale.
- **security-audit-static** — Static security audit: map trust boundaries, cross-reference documented intent, self-refute every finding, and report only evidence-backed risks. Given `<base>..<head>` or `changes`, it audits only a change. Starts on its own only when a security audit is asked for: `ship-check` runs it, and `release-gate` proposes it and never runs it unasked.
- **performance-audit-static** — Static performance audit: find N+1 queries and request waterfalls, over-fetching, missing indexes, and caching opportunities, ranked by effort and impact. Given `<base>..<head>` or `changes`, it audits only a change. Starts on its own only when a performance audit is asked for: `ship-check` runs it, and `release-gate` proposes it and never runs it unasked.

## Author

Paweł Huryn — [The Product Compass Newsletter](https://www.productcompass.pm)

## License

MIT
