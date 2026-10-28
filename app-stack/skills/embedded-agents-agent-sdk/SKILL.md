---
name: embedded-agents-agent-sdk
description: "Only when the Agent SDK is asked for, an agent needs Claude Code's own tools, or the app already runs it: embed Claude agents in a Next.js app with the Agent SDK."
---

# Embedded agents — Claude Agent SDK

**Which skill.** Two skills run the same agent directories. This one runs them through the Claude Agent SDK, which starts the Claude Code engine as a subprocess: built-in file and shell tools, Claude Code's own system prompt, its skill and MCP loading, and a long-lived Node host to run on. The `embedded-agents-messages-api` skill runs them on the Claude API with the Anthropic SDK's tool runner, in the app's own process: only the tools the wrapper gives the agent, no subprocess, any Node host. It is the default for a new product. Use this one when the agent needs what only the engine has, or when the product already runs it.

Read the product's own agent instructions first (its root `AGENTS.md` or `CLAUDE.md`), and tell any subagent you spawn for this work to read them too: their rules on secrets, environment variables, validation, callers, tests and release apply to everything here. This skill adds how to run Claude agents inside the app. `reference/playbook.md` is the full playbook, with the measurement behind every option — read it before changing the wrapper's contract or explaining it in depth.

The model: the app owns the request, the caller, storage and the UI; the agent owns reasoning and tools. An agent is a directory, `.claude/agents/<name>/`, holding `AGENTS.md` (its instructions — its only instruction file), and optionally `knowledge/`, agent-local skills in `.claude/skills/`, and `.mcp.json`. One wrapper function, `askAgent`, runs any of them. No agent name appears in code.

## 1. First use: install the wrapper

Search the code for `askAgent`. If it exists, skip to § 2. Otherwise:

1. **No app yet?** Create the smallest Next.js App Router app in TypeScript (what this skill's files are written for) and nothing the user did not ask for — no database, sign-in or billing for a local prototype.
2. **Install** what is missing: `npm i @anthropic-ai/claude-agent-sdk zod server-only` and `npm i -D vitest`.
3. **Copy**, changing only import paths:

   | From this skill | To the app |
   |---|---|
   | `templates/agent.ts` | `src/lib/agent.ts` — the wrapper |
   | `templates/route.ts` | `src/app/api/agents/route.ts` — `GET` lists agents, `POST` streams one |
   | `templates/agent.test.ts` | `tests/unit/agent.test.ts` — the contract, inside `npm test`, no model call |
   | `templates/agents.live.test.ts` | `tests/live/agents.live.test.ts` — every agent against the real model |

   The tests import `@/lib/agent`, so Vitest needs the same `@` alias as `tsconfig.json`. The live test gets its own Vitest config (include `tests/live/**/*.live.test.ts`, `testTimeout: 180_000`, `fileParallelism: false`) and a script, `agents:live`. It costs money, so it stays out of `npm test` and the gate.
4. **Environment:** `ANTHROPIC_API_KEY`, plus every secret an agent's `.mcp.json` references, each set per environment and never committed (the `environments` skill). On a developer's laptop the SDK falls back to their own Claude login when the key is absent; a deployed product always uses the key.
5. **Keep the contract.** Every option in `agentOptions()` exists because an SDK default failed a measurement (playbook § 9). Change one only after re-measuring it.

## 2. Add an agent

1. `node <skill dir>/scripts/new-agent.mjs <name> [--knowledge] [--mcp]`, then fill in `AGENTS.md`: role, sources, output format, refusals. A fixed sign-off line is the cheapest proof, in a live test, that the instructions are in force.
2. **Knowledge:** files in `knowledge/*.md`, and `AGENTS.md` says to answer only from them. **Agent-local skills:** `.claude/agents/<name>/.claude/skills/<skill>/SKILL.md`; found automatically.
3. **MCP:** servers in `.mcp.json`, secrets as `${VAR}`, never literal. Run `node --env-file=.env <skill dir>/scripts/discover-mcp-tools.mjs <name>` to list what each server offers, then put in that server's `allowedTools` only what the agent's job needs. Anything unlisted is denied. The agent's `.mcp.json` holds no secrets and is committed: if `git check-ignore` reports it ignored, the repo's `.gitignore` has an unanchored `.mcp.json` rule meant for the root file — anchor it as `/.mcp.json`.
4. **Routing needs nothing:** `listAgents()` finds the directory, `GET /api/agents` returns it, and — when users choose between agents — the UI's picker shows it. A UI that hardcodes the list is the bug to fix.
5. **The instruction file is always `AGENTS.md`.** Asked for another name, create `AGENTS.md` and say why: the wrapper loads only `AGENTS.md`, and the SDK loads some other instruction files on its own, which would give the agent two sets of instructions.
6. When the agent makes a promise worth pinning — it cites, it refuses, it answers only from its files — add a live test for it beside the generic one.

## 3. Examples — only when asked

`examples/` holds two finished agents. Use them when the user asks for examples, or describes one of them: an agent that answers only from local product-management knowledge files (`knowledge-agent`), or one that researches the live web through Perplexity with citations (`research-agent`). Copy `examples/<name>/` to `.claude/agents/<name>/` and `examples/<name>.live.test.ts` to `tests/live/`. `research-agent` needs `PERPLEXITY_API_KEY`. Otherwise, never copy them.

## 4. The chat UI

Product-specific, so there is no template. What it must do:

- When users choose between agents, fill the picker from `GET /api/agents`. A product may run one front agent and show no picker; the route still checks the name against `listAgents()`.
- `POST { agent, prompt, history }` to `/api/agents` and read server-sent events: `{ text }` chunks, then `{ done, agent, metadata }` or `{ error, agent }`. The parser is in playbook § 5.
- Store the agent on every message and, when there is more than one, show it on each reply, so the reader always knows which agent answered. History is the conversation so far, kept in client state unless the product asks to persist it.
- Render agent output as plain text or sanitized markdown, never raw HTML: it is untrusted text, like anything a user typed. Show an `error` event instead of spinning forever.

## 5. Explaining routing and the tool boundary

**Routing:** UI → `POST /api/agents { agent }` → the route validates the body and requires the name to be in `listAgents()` → `askAgent` → `agentOptions()` accepts only a plain directory name and resolves `.claude/agents/<agent>/` → `query()` starts the Claude Code engine with that directory as `cwd` and its `AGENTS.md` appended to the system prompt → events stream back.

**Boundary** — each layer measured (playbook § 9):
1. `tools`: only the built-ins on the allowlist exist — `Read`, `Glob`, `Grep` by default. `Bash`, `Write`, `Edit` and `WebFetch` do not.
2. `permissionMode: 'dontAsk'` with `allowedTools`: an MCP tool runs only if its server's `allowedTools` in `.mcp.json` lists it.
3. `strictMcpConfig`: only the agent's own `.mcp.json` servers load — nothing from the developer's or the server's user configuration.
4. `skills`: only the agent's own skills are listed.
5. The PreToolUse guard blocks any path outside the agent's directory, and any `.env` file.
6. `maxTurns` (10 by default) and `maxBudgetUsd` cap a run.

## 6. Before it leaves localhost

- **Hosting.** The SDK runs the Claude Code engine as a subprocess, so an agent cannot run in a serverless function such as a Netlify Function (playbook § 7). A product whose site deploys there needs a second, long-lived Node host (a container or VM, such as Railway), chosen before the agent goes beyond localhost; write its deploy procedure into the product's docs the first time it is used. `next dev` needs nothing.
- **History is a client claim.** `templates/route.ts` accepts `history` from the client, `assistant` turns included, and `composePrompt` turns it into a "Previous conversation" preamble — so a client can forge earlier turns, the agent's own included. That is acceptable for a read-only agent, which can only be talked into saying something to the person forging it. Before any tool acts on the caller's behalf, keep the transcript on the server and stop reading it from the request.
- **Caller and cost:** before anyone but the developer can reach the route, resolve the caller there (who they are, which workspace, which permission: `saas-authorization`) and set a per-actor limit and a `maxBudgetUsd`.
- **Release:** run `npm run agents:live` before any release that adds or changes an agent, its prompt or its model, record the run in the product's test-coverage map (which test proves what, and when it last passed), and describe each agent in its automation doc: what it may read, the exact tools it may call, and what the app enforces around it (`shipping-artifacts`).

## How you can tell it worked

The agent runs on the deployed host, not only on localhost, uses only the tools it was given, and the live agent suite passes against the real model.

## Running the scripts

Run them from the app's repository root: `<skill dir>` is wherever this skill is installed (a plugin, `~/.claude/skills/`, or the repo's own `.claude/skills/`), and the scripts write into the current directory.
