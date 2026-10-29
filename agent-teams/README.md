# agent-teams — work with other agents as partners

A delegate is a partner, not a tool: it gets the why, not just the what. These skills are how to brief any delegate, and how to drive each kind — the Codex CLI as builder and peer, an independent reviewer that never saw the build, and Claude Code run headless by another agent.

## Install

```bash
claude plugin marketplace add phuryn/product-engineering
claude plugin install agent-teams@product-engineering
```

Codex, Cursor and other agents: see the collection's root `README.md`.

## Skills (4)

- **delegation** — The shared doctrine: what never delegates, when a change is too small to hand off, the brief (goal and why, binding constraints and traps, how to prove it), choosing the delegate and its model, parallel work without lost writes, and verifying what comes back.
- **codex-agents** — The OpenAI Codex CLI as a peer you argue decisions with and a builder you hand stages to, through a wrapper that keeps sessions per directory, resumes by id and re-sends the model on every resume.
- **grok-agents** — The unsteered independent review loop before anything ships: a fresh reviewer (the Grok CLI, or a fresh read-only Claude session; a default your agent instructions can change, to a reviewer that can run the way this skill requires) reads the unreleased diff and the working tree; how to scope a round, write its brief, triage what it finds and when to stop.
- **claude-agents** — How Codex, Grok, Cursor or another Claude session drives Claude Code headless as a peer, builder or reviewer, through a wrapper with session continuity and safe permission modes.

## Author

Paweł Huryn — [The Product Compass](https://www.productcompass.pm)
