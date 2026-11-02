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
- **codex-agents** — The OpenAI Codex CLI as a peer you argue decisions with, a builder you hand stages to, or a fresh reviewer, through a wrapper that keeps sessions per directory, resumes by id and re-sends the model on every resume, and a tested command for a read-only review session.
- **grok-agents** — The Grok CLI driven headless from another agent as a peer, a builder or a fresh reviewer: the flags for each, sessions you name and resume, the isolation a review needs, signing in by device code, and what an out-of-credit answer looks like.
- **claude-agents** — How Codex, Grok, Cursor or another Claude session drives Claude Code headless as a peer, builder or reviewer, through a wrapper with session continuity and safe permission modes.

Which of them reviews a release, and how a review round runs, is `independent-review`, in the `ai-shipping` pack.

## Author

Paweł Huryn — [The Product Compass](https://www.productcompass.pm)
