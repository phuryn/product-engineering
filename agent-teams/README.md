# agent-teams — work with other agents as partners

A delegate is a partner, not a tool: it gets the why, not just the what. These skills are how to brief any delegate, and how to drive each kind — the Codex CLI, the Grok CLI and Claude Code, each run headless by another agent as a peer, builder or reviewer. Gemini through Google's Antigravity CLI is an option the user agrees to first. The review loop itself, round after round, is `independent-review`, in the `ai-shipping` pack.

## Install

```bash
claude plugin marketplace add phuryn/product-engineering
claude plugin install agent-teams@product-engineering
```

Codex, Cursor and other agents: see the collection's root `README.md`.

## Skills (5)

- **delegation** — The shared doctrine: what never delegates, when a change is too small to hand off, the brief (goal and why, binding constraints and traps, how to prove it), choosing the delegate and its model, parallel work without lost writes, and verifying what comes back.
- **codex-agents** — The OpenAI Codex CLI as a peer you argue decisions with, a builder you hand stages to, or a fresh reviewer, through a wrapper that keeps sessions per directory, resumes by id and re-sends the model on every resume, and a tested command for a read-only review session.
- **grok-agents** — The Grok CLI driven headless from another agent as a peer, a builder or a fresh reviewer: the flags for each, sessions you name and resume, the isolation a review needs, signing in by device code, and what an out-of-credit answer looks like.
- **claude-agents** — How Codex, Grok, Cursor or another Claude session drives Claude Code headless as a peer, builder or reviewer, through a wrapper with session continuity and safe permission modes.
- **gemini-agents** — Gemini through Google's Antigravity CLI as a peer, builder or second reviewer, through a wrapper that checks what actually ran. Unsupported by Google on consumer plans (FAQ read 2026-11-13): third-party access through an Antigravity sign-in breaks the terms and can lead to suspension. API-key or Cloud routes are documented. The user agrees first, per run or as an explicit standing preference; Gemini is never a default.

Which of them reviews a release, and how a review round runs, is `independent-review`, in the `ai-shipping` pack.

## Author

Paweł Huryn — [The Product Compass](https://www.productcompass.pm)
