# agent-teams — work with other agents as partners

A delegate is a partner who gets the goal and the reasons behind it. The `delegation` skill covers how to brief any delegate and drive Codex, Grok or Claude Code headless as a peer, builder or reviewer. Gemini through Google's Antigravity CLI is an option the user agrees to first. The review loop itself, round after round, is `independent-review`, in the `ai-shipping` pack.

## Install

```bash
claude plugin marketplace add phuryn/product-engineering
claude plugin install agent-teams@product-engineering
```

Codex, Cursor and other agents: see the collection's root `README.md`.

## Skill (1)

`delegation` covers what stays with the session agent, when a change is too small to hand off, and what the brief needs: the goal and why, binding constraints and traps, and how to prove the result. It explains how to choose the delegate and its model, work in parallel without lost writes, and verify what comes back.

- The [Codex reference](skills/delegation/references/codex.md) covers using OpenAI's Codex CLI as a peer, stage builder or fresh reviewer. Its wrapper keeps sessions per directory, resumes by id and re-sends the model on every resume. The reference includes a tested command for a read-only review session.
- The [Grok reference](skills/delegation/references/grok.md) covers driving the CLI headless as a peer, builder or fresh reviewer. It gives the flags for each role, how to name and resume sessions, how to isolate a review, how to sign in by device code, and how to recognize an out-of-credit answer.
- The [Claude Code reference](skills/delegation/references/claude.md) covers how Codex, Grok, Cursor or another Claude session drives Claude Code headless as a peer, builder or reviewer. Its wrapper manages session continuity and safe permission modes.
- The [Gemini reference](skills/delegation/references/gemini.md) covers using Google's Antigravity CLI as a peer, builder or second reviewer. Its wrapper checks what actually ran. Google says using Antigravity sign-in from a third-party agent on a consumer plan breaks its terms and can lead to suspension (FAQ read 2026-11-13). The reference covers API-key and Cloud routes. Use Gemini only when requested and the user agrees, per run or as an informed standing preference.

Which of them reviews a release, and how a review round runs, is `independent-review`, in the `ai-shipping` pack.

## Author

Paweł Huryn — [The Product Compass](https://www.productcompass.pm)
