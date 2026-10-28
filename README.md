# Product Engineering — skills for the whole product lifecycle with coding agents

Agent skills for building a real product with coding agents, from the first idea to paying users and the next round. From [The Product Compass](https://www.productcompass.pm).

26 of the 41 skills were learned on real products built with Claude Code, Codex and Grok, and keep their receipts: the date, and what broke or was measured. 14 are established methods without dated notes: the strategy frameworks in `product` and the documentation and review methods in `ai-shipping`. The last, `work-humanizer`, rests on a detector test from October 2026. The skills work in Claude Code, Codex, Cursor, Gemini CLI, OpenCode, GitHub Copilot and any other agent that reads `SKILL.md` folders. Free, under the MIT License.

**[Install](#install), then type `/product:start-here`** (Codex: `$product:start-here`) and say what you have.

## Who it's for

- **Product managers, founders and designers who build with coding agents.** You check the product, not every line of the code.
- **Engineers who build a product, not only the code.** That means deciding what to build, and running it in production with real users and real payments.
- **Anyone working with more than one agent**, where one session coordinates, another builds and a third reviews.

If you want an agent that writes test-first code in a vocabulary you review line by line, the collections written for engineers who own their code do that well. This one is about the product.

## How it works

- **Evidence before the build.** The agent reads what you shared and researches what's missing: alternatives, the market, what people say. It proposes informed hypotheses, each with its source, and asks only what the evidence can't decide.
- **The product is the spec.** You review the interface first, often an interactive prototype on sample data. Once it's built, you click through it yourself, and agents review the docs, the tests and the code.
- **Building is the experiment.** Building is cheap now, and use beats intent. Build the first version with payment in days, put it in front of real users, and go round again with what they did.
- **Production is part of the method.** Nobody pays until payment works in production. The release gate, environments, authorization, billing, email and monitoring are in the collection, not left for later.
- **The session that wrote the code never clears it.** Before a release, a fresh reviewer that never saw the build reads the change: Grok when it's installed, so another model family, otherwise a fresh Claude Code session with nothing carried over. Rounds repeat until one finds nothing new above low severity.
- **No ceremony for small work.** A change you can check in a minute goes straight to the build and its check. Only a complex change gets a plan, and the agent writes it.
- **Rules learned in practice keep their receipts.** About 700 dated notes say when something broke or was measured, and how. A new rule of that kind needs an observed failure. Requests the collection turned down are in [rejected.md](rejected.md), with the reason.

The process is the one in the [Product Engineering for PMs](https://www.productcompass.pm/p/product-engineering-for-pms) series, which builds a real SaaS app with it, step by step.

## The lifecycle, and the skill that walks it

**`start-here`** reads your request and the repository, finds where the work stands, and names the next step and the skill that does it. Bring an idea, new evidence from users, an agreed change, a bug or a release.

1. **Discover and propose.** The agent researches and proposes what to build, marking every claim by its source. You review a prototype, interface first, and answer the few questions left. *`propose`, with `competitor-analysis`, `market-segments`, `beachhead-segment`, `value-proposition`, `value-curve` and `growth-loops`.*
2. **The refined idea, when it helps.** A short record of the intent and use cases you accepted. Skipped for a small change. *`propose`; for a SaaS, the brief in `app-lifecycle`.*
3. **A plan, for a complex change only.** The agent writes what to implement, how to test it and the acceptance criteria. You skim it, and read how it will be tested. *`start-here` carries the prompt.*
4. **Build.** One session coordinates and another builds. Tests and docs land with the change. *`delegation`, `codex-agents`, `claude-agents`, `test-harness`, `design`.*
5. **Your click-through.** After every change you can see, you get a link and 3 to 7 things to try. That's 15 to 20 minutes for a mid-size app, every time. *`start-here`; the preview itself is in `release-gate`.*
6. **Agentic reviews.** Are the docs right? Are the tests right? Is the code right? Then a fresh reviewer that never saw the build. The doc and test checks only report: where a doc, the coverage map and the code disagree, you decide, because a doc rewritten to match faulty code blesses the bug. *`document-app` and `derive-tests` in check mode; `code-review`, `intended-vs-implemented`, `security-audit-static` and `performance-audit-static`; then `grok-agents`.*

   `ship-check`, which you start, is a different pass: one long session that writes the system docs from the code where they are missing or stale, refreshes the agent instructions, reviews, rewrites the coverage map, and ends in a packet you sign off on. It fits an app built without docs. Where docs already say what the product should do, or whoever runs the gate keeps the coverage map, it lists what it would overwrite and asks first; at a release, `release-gate` keeps to the check modes.
7. **Release and run it.** The gate, go-live, then production data, sign-in, payments, email and monitoring. *`release-gate`, `environments`, `supabase-production`, `clerk-production`, `saas-authorization`, `transactional-email`, `uptime-monitoring`.*
8. **People use it, then the next round.** What they did, came back to, abandoned and paid for goes back into step 1. *`propose`.*

A small fix goes straight to step 4 and its check. Between sessions, `handover` writes the note the next one starts from and `retro` turns a session's friction into a setup fix.

## What goes wrong with skill collections, and what this one does

| What goes wrong | What this collection does |
|---|---|
| The flow starts from what the builder already thinks. An interview sharpens your assumptions, and nothing checks them against the market or users. | `propose` researches first and brings in what you don't know yet. It marks every claim: observed, your call, the agent's inference, or unsupported. |
| Ten or more questions at once, before any research. | One round of a few questions, after the research, each with a recommended answer. |
| Decisions get lost between the interview, the spec and the tickets, and decision records pile up and go stale. | One proposal you reviewed, which the build reads, with your decisions marked as yours. Its recommendation is rewritten, never appended to. |
| The flow ends at the pull request, leaving release, environments, authorization, billing, email and monitoring to you. | The lifecycle runs through production and back into the next round. |
| The code is reviewed by the session that wrote it, or by its own subagents, which share what it believes. | A fresh reviewer that never saw the build, from another model family when Grok is installed, reviews the change round after round until one finds nothing new above low severity. |
| Tests that check the mocks, so green means nothing. | A fix lands with a test that failed before it. After two fixes that pass and leave the symptom, the agent stops and gets one observation. The last check is you, clicking through. |
| Skills that fail to load what they depend on. | Every skill works from its own folder. A validator checks every skill and file a skill names. |
| Rules that read as common sense, with nothing behind them. | A rule learned in practice keeps its receipt: the date, and what broke or was measured. |

## The packs

| Pack | For | Skills |
|---|---|---|
| **product** | Deciding what to build before building it: research an idea and propose, competitors and segments, the value proposition and the value curve, the first segment to win, how it grows | `start-here` (you start it) · `propose` · `competitor-analysis` · `market-segments` · `beachhead-segment` · `value-curve` · `value-proposition` · `growth-loops` |
| **ai-shipping** | Shipping an AI-built app you would sign: document it, review it, test it so green means something, and release it through a gate | `ship-check` (you start it) · `code-review` · `intended-vs-implemented` · `shipping-artifacts` · `release-gate` · `test-harness` · `document-app` · `derive-tests` · `security-audit-static` · `performance-audit-static` |
| **agent-teams** | Working with other agents as partners: briefing any delegate, Codex as builder and peer, the independent review loop, other agents driving Claude | `delegation` · `codex-agents` · `grok-agents` · `claude-agents` |
| **agent-harness** | Making your own agent setup reliable, and keeping the owner in the loop without the transcript | `handover` (you start it) · `retro` (you start it) · `agent-instructions` · `guardrail-hooks` · `flight-deck` · `windows-agent-shell` |
| **app-stack** | Building a SaaS on Next.js, Supabase, Clerk and Netlify, from idea to production, and putting agents inside it | `app-lifecycle` · `saas-authorization` · `supabase-production` · `clerk-production` · `environments` · `design` · `mcp-server` · `chatgpt-plugin` · `embedded-agents-messages-api` · `embedded-agents-agent-sdk` · `transactional-email` · `uptime-monitoring` |
| **work-humanizer** | Work writing that doesn't read as AI | `work-humanizer` |

Each pack's own `README.md` says what every skill does and when it triggers.

## Skills you start, and skills that start themselves

**Four skills run only when you start them**, because each is a whole session's work or a moment only you can pick: `start-here`, `ship-check`, `handover` (the note the next session starts from) and `retro` (a session's friction turned into a setup fix). Their descriptions cost your agent no context until you call them.

| | Claude Code | Codex | A skill folder copied into a repository |
|---|---|---|---|
| Start one | `/<pack>:<skill>`, such as `/agent-harness:handover` | `$<pack>:<skill>`, such as `$agent-harness:handover` | `/handover` · `$handover` |

**The rest start themselves** when the work matches their description ("review this", "ship it", "set up monitoring"); you can also name them the same way. Their descriptions are what your agent always carries, so they are kept short: about 5,500 characters for all 37 together. Installed in Claude Code, all the packs add about 2,400 tokens to every turn, down from about 9,100 before the descriptions were rewritten (measured `2026-10-27`). `tools/validate.py` holds them to 6,000 characters in total and 300 each, because a crowded agent setup cuts every description short, and the cut falls on the words that say when to use it.

## Install

### Claude Code

```bash
claude plugin marketplace add phuryn/product-engineering
claude plugin install product@product-engineering
claude plugin install ai-shipping@product-engineering
claude plugin install agent-teams@product-engineering
claude plugin install agent-harness@product-engineering
claude plugin install app-stack@product-engineering
claude plugin install work-humanizer@product-engineering
```

Then turn on updates: `/plugin` → Marketplaces → `product-engineering` → enable auto-update. Third-party marketplaces don't auto-update by default; without it, run `claude plugin marketplace update product-engineering`.

**If you already use the free [pm-skills](https://github.com/phuryn/pm-skills) marketplace:**

- **Disable its `pm-ai-shipping` plugin.** `ai-shipping` here is a superset of it, and two copies of the same skills trigger twice.
- **Its `pm-market-research`, `pm-product-strategy` and `pm-go-to-market` plugins** each carry one or two of the `product` pack's skills (`competitor-analysis`, `market-segments`, `value-proposition`, `beachhead-segment`, `growth-loops`) beside many others. Keep them for the others, and expect those five to appear twice.
- **The free `work-humanizer`**, if you installed it on its own, is the same skill as the pack here: keep one.

### Codex

```bash
codex plugin marketplace add phuryn/product-engineering
codex plugin add product@product-engineering   # and the other packs
```

Codex reads this repository's Claude Code marketplace as it is. Every skill runs in Codex. The four you start run only when you name them: `$product:start-here`, `$ai-shipping:ship-check`, `$agent-harness:handover`, `$agent-harness:retro`. The rest also start themselves when you ask in plain words, and run when named the same way. Measured on Codex CLI 0.159.0 (`2026-10-27`).

### Any other agent (Cursor, Gemini CLI, OpenCode, Copilot, Windsurf …)

```bash
npx skills add phuryn/product-engineering          # pick skills and agents interactively
npx skills update                             # later, to update
```

`npx skills` needs Node.js 22.20 or later; on an older Node it fails at start with `does not provide an export named 'glob'` (observed 2026-10-24 on Node 20.19). Upgrade Node, or run it once through a temporary Node 22: `npx -p node@22 -p skills -c "skills add phuryn/product-engineering"`.

Or copy skill folders by hand into the folder your agent reads (`.agents/skills/`, `.claude/skills/`, `.cursor/skills/`, `~/.gemini/skills/` …). Every skill works from its own folder alone.

### Into a product's own repository

Several skills say it outright: **a rule that lives only in another repository doesn't get read**, and an agent sees only what is installed for that agent or committed in the repository it works in — a plugin installed in Claude Code is invisible to Codex run in the same folder. For a product you build with more than one agent, copy the skills it depends on into the product's `.claude/skills/` (or `.agents/skills/`) and commit them, then name them in the product's agent instructions. `agent-instructions` shows how.

## Scripts

Some skills ship scripts — the Codex wrapper, the review wrapper, the Claude wrapper, hook templates. They need Python 3.10+ (standard library, except where a skill says otherwise) and the CLI they drive. Each skill says which. Nothing runs unless your agent runs it.

## More techniques

For additional discovery, prioritization, experimentation and go-to-market techniques, see the free [PM Skills collection](https://github.com/phuryn/pm-skills).

## Updates and feedback

Skills change as the agents and platforms do; every platform fact inside is dated. What changed is in each commit. Requests the collection decided not to take, and why, are in [rejected.md](rejected.md). Questions and reports: [open an issue](https://github.com/phuryn/product-engineering/issues).

## License

MIT: see [LICENSE.md](LICENSE.md).
