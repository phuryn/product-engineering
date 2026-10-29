# agent-harness — make your own agent setup reliable

The machinery around the agent: instructions met at the moment they apply, rules held by code instead of prose, state that survives the context window, and the shell traps that break agents on Windows.

## Install

```bash
claude plugin marketplace add phuryn/product-engineering
claude plugin install agent-harness@product-engineering
```

Codex, Cursor and other agents: see the collection's root `README.md`.

## Skills (6)

**You start them**, at the end of a session (`/agent-harness:<skill>` in Claude Code, `$agent-harness:<skill>` in Codex):

- **handover** — The note the next session starts from: the objective, what is true now, the evidence actually obtained, what is left, the open decisions and the next concrete action, reconciled with the disk and the running processes before it is written.
- **retro** — A session's learnings, built into your setup: what went wrong and why, then an improved instruction, route, hook or script, checked where it applies, or "no setup change warranted".

**They start on their own:**

- **agent-instructions** — Writing and maintaining the instruction file every session reads (AGENTS.md / CLAUDE.md): a general section and a product section, a router keyed by what the agent is doing, progressive disclosure, receipts, and the passes that keep it short and true.
- **guardrail-hooks** — Turning a rule an agent must remember at the decisive moment into a code path: Claude Code hooks that ask before one-way doors or block a wrong commit identity, with templates to adapt.
- **flight-deck** — Two files per area of work — a STATUS board rewritten in place and a LOG appended to — so long-running work stays legible across context compaction; and the owner's page, one shared page holding only what needs the human, under a three-line status.
- **windows-agent-shell** — The Windows (Git Bash, PowerShell, cmd) traps that make coding agents fail or silently corrupt files, and the wider class of works-here-breaks-there.

## Author

Paweł Huryn — [The Product Compass](https://www.productcompass.pm)
