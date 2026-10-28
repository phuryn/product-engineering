---
name: embedded-agents-messages-api
description: "Building, adding or wiring up an agent or an agent chat inside a Next.js app: embed Claude agents on the Messages API, the default way."
---

# Embedded agents — Claude API

**Which skill.** Two skills run the same agent directories. This one runs them on the Claude API: the Anthropic SDK's tool runner (`client.beta.messages.toolRunner`) drives the loop inside the app's process, and the agent has exactly the tools the wrapper gives it — nothing built in. It is the default for a new product. The `embedded-agents-agent-sdk` skill runs them through the Claude Agent SDK, which starts the Claude Code engine as a subprocess with built-in file and shell tools and needs a long-lived Node host: use it only when an agent needs what only that engine has, or the product already runs it. An agent directory moves between the two unchanged (playbook § 10).

Read the product's own agent instructions first (its root `AGENTS.md` or `CLAUDE.md`), and tell any subagent you spawn for this work to read them too: their rules on secrets, environment variables, validation, callers, tests and release apply to everything here. `reference/playbook.md` is the full playbook, with the measurement behind every choice — read it before changing the wrapper's contract or explaining it in depth.

The model: the app owns the request, the caller, storage and the UI; the agent owns reasoning and tool choice. An agent is a directory, `.claude/agents/<name>/`, holding `AGENTS.md` (its instructions — its whole system prompt), and optionally `knowledge/`, agent-local skills in `.claude/skills/`, and `.mcp.json`. One wrapper function, `askAgent`, runs any of them. No agent name appears in code.

## 1. First use: install the wrapper

Search the code for `askAgent`. If it exists, skip to § 2 (if it imports `@anthropic-ai/claude-agent-sdk`, the product is on the other skill — moving it is playbook § 10). Otherwise:

1. **No app yet?** Create the smallest Next.js App Router app in TypeScript (what this skill's files are written for) and nothing the user did not ask for — no database, sign-in or billing for a local prototype.
2. **Install** what is missing: `npm i @anthropic-ai/sdk @modelcontextprotocol/sdk zod server-only` and `npm i -D vitest`. Pin exact versions: the tool runner is marked beta in the TypeScript SDK, so an upgrade is re-tested, not assumed.
3. **Copy**, changing only import paths:

   | From this skill | To the app |
   |---|---|
   | `templates/agent.ts` | `src/lib/agent.ts` — the wrapper |
   | `templates/agent-mcp.ts` | `src/lib/agent-mcp.ts` — an agent's MCP servers, opened per run |
   | `templates/route.ts` | `src/app/api/agents/route.ts` — `GET` lists agents, `POST` streams one |
   | `templates/agent.test.ts` | `tests/unit/agent.test.ts` — the contract, inside `npm test`, no model call |
   | `templates/agents.live.test.ts` | `tests/live/agents.live.test.ts` — every agent against the real model |

   The tests import `@/lib/agent` and `@/lib/agent-mcp`, so Vitest needs the same `@` alias as `tsconfig.json`. The live test gets its own Vitest config (include `tests/live/**/*.live.test.ts`, `testTimeout: 180_000`, `fileParallelism: false`, and `process.loadEnvFile('.env')` in a `try`) and a script, `agents:live`. It costs money, so it stays out of `npm test` and the gate.
4. **Environment:** `ANTHROPIC_API_KEY`, plus every secret an agent's `.mcp.json` references, each set per environment and never committed (the `environments` skill). On a developer's machine the SDK also reads a profile from `ant auth login`; a deployed product always uses the key.
5. **Keep the contract.** Every choice in `agentRequest()` and `askAgent()` is pinned by the unit test and explained in the playbook (§ 3, § 7). Change one only after re-measuring it.

## 2. Add an agent

1. `node <skill dir>/scripts/new-agent.mjs <name> [--knowledge] [--mcp]`, then fill in `AGENTS.md`: role, sources, output format, refusals. It is the agent's **whole** system prompt — no product preset sits under it — so write it complete. A fixed sign-off line is the cheapest proof, in a live test, that the instructions are in force.
2. **Knowledge:** files in `knowledge/`, and `AGENTS.md` says to answer only from them. The agent gets `list_files`, `search_files` and `read_file`, confined to `knowledge/` (playbook § 5); name those tools in `AGENTS.md`, not Claude Code's Read/Glob/Grep. **Agent-local skills:** `.claude/agents/<name>/.claude/skills/<skill>/SKILL.md` with `description:` frontmatter; the wrapper lists them in the system prompt and the agent loads one with `load_skill`. A skill is instructions and reference files; nothing in it runs.
3. **MCP:** servers in `.mcp.json`, secrets as `${VAR}`, never literal. Run `node --env-file=.env <skill dir>/scripts/discover-mcp-tools.mjs <name>` to list what each server offers, then put in that server's `allowedTools` only what the agent's job needs. An unlisted tool is never shown to the model. The agent's `.mcp.json` holds no secrets and is committed: if `git check-ignore` reports it ignored, the repo's `.gitignore` has an unanchored `.mcp.json` rule meant for the root file — anchor it as `/.mcp.json`.
4. **Routing needs nothing:** `listAgents()` finds the directory, `GET /api/agents` returns it, and — when users choose between agents — the UI's picker shows it. A UI that hardcodes the list is the bug to fix.
5. **The instruction file is always `AGENTS.md`.** Asked for another name, create `AGENTS.md` and say why: the wrapper loads only `AGENTS.md`, and the same directory must also run under the Agent SDK skill, which loads some other instruction files on its own.
6. When the agent makes a promise worth pinning — it cites, it refuses, it answers only from its files — add a live test for it beside the generic one.

## 3. Tools that act for the caller

When an agent must read or change the caller's own records (their invoices, their settings), give it the app's own tools, built **per request** inside the route after the caller is resolved, and pass them as `askAgent({ …, tools })`:

```ts
const tools = [
  agentTool({
    name: 'list_invoices',
    description: "List the signed-in subscriber's invoices.",
    input: {},
    run: async () => JSON.stringify(await listInvoices(caller)), // closes over the caller
  }),
];
```

- **Identity is closed over, never a parameter.** No tool takes an email, user, customer or account id: the model cannot ask for anyone else's records because no input can name them. Pin it with a unit test that reads every tool's `input_schema.properties`.
- `run` returns the text the model reads. A refusal or a planned failure throws `ToolError(text)`; the model reads it as an error result. Any other exception reaches the model as a fixed sentence, never its message. Input is validated against the zod shape before `run` sees it.
- A tool that only attaches something to the reply — a link, a list the app draws — goes in `askAgent({ …, closingTools: ['share_link'] })`: when a response that already has text calls only such tools, they run and the run ends. Otherwise the model, asked again, may write its reply a second time (playbook § 7).
- A risky or one-way action is proposed by the tool and decided by code, because a model may propose but never decide what can't be taken back (`saas-authorization`): the tool stores a proposal, the app shows a button, the click runs it. Links and buttons travel through the app, not through model text.
- `context` carries per-run facts for the system prompt — who the caller is — after `AGENTS.md`; never user text.

## 4. Examples — only when asked

`examples/` holds two finished agents. Use them when the user asks for examples, or describes one of them: an agent that answers only from local product-management knowledge files (`knowledge-agent`), or one that researches the live web through Perplexity with citations (`research-agent`). Copy `examples/<name>/` to `.claude/agents/<name>/` and `examples/<name>.live.test.ts` to `tests/live/`. `research-agent` needs `PERPLEXITY_API_KEY`. Otherwise, never copy them.

## 5. The chat UI

Product-specific, so there is no template. What it must do:

- When users choose between agents, fill the picker from `GET /api/agents`. A product may run one front agent and show no picker; the route still checks the name against `listAgents()`.
- `POST { agent, prompt, history }` to `/api/agents` and read server-sent events: `{ text }` chunks (one per model response), then `{ done, agent, metadata }` or `{ error, agent }`. The parser is in playbook § 7.
- Store the agent on every message and, when there is more than one, show it on each reply. History is the conversation so far, kept in client state unless the product asks to persist it.
- Render agent output as plain text or sanitized markdown, never raw HTML: it is untrusted text, like anything a user typed. Show an `error` event instead of spinning forever.

## 6. Explaining routing and the tool boundary

**Routing:** UI → `POST /api/agents { agent }` → the route validates the body and requires the name to be in `listAgents()` → `askAgent` → `agentRequest()` accepts only a plain directory name and reads `.claude/agents/<agent>/` → the tool runner sends the request, runs the tools the model asks for, and repeats → events stream back.

**Boundary** — each layer pinned by a test (playbook § 4):
1. **The tool list is the boundary.** The model can call only what `agentRequest()` put in `tools`: the caller's own tools, the file and skill tools when the directory has knowledge or skills, and the MCP tools its `.mcp.json` allows. Nothing is built in: no shell, no web, no file system beyond these.
2. File tools resolve every path (symlinks included) and refuse anything outside `knowledge/` or the skill's own directory, and any `.env` file.
3. MCP: a server's unlisted tools never reach the model; a stdio server starts with a safe environment allowlist plus its own `env`, never the app's secrets.
4. A tool's exception reaches the model as a fixed sentence; bad input is refused by its schema before it runs.
5. `maxTurns` (10 by default) and `maxBudgetUsd` cap a run, checked between responses: the tools of the response that crosses one never run.

## 7. Before it leaves localhost

- **Hosting.** No subprocess: any host that runs a Node process for the length of a run can host it — a long-lived server, or a serverless function whose time limit covers the slowest run (playbook § 8). A stdio MCP server is a child process per run, which rules out edge runtimes, and an agent's files must be in the deployment's trace.
- **History is a client claim.** `templates/route.ts` accepts `history` from the client, `assistant` turns included, and the wrapper sends it as the conversation — so a client can forge earlier turns, the agent's own included. That is acceptable for a read-only agent, which can only be talked into saying something to the person forging it. Before any tool acts on the caller's behalf, keep the transcript on the server and stop reading it from the request.
- **Caller and cost:** before anyone but the developer can reach the route, resolve the caller there (who they are, which workspace, which permission: `saas-authorization`) and set a per-actor limit and a `maxBudgetUsd`.
- **Release:** run `npm run agents:live` before any release that adds or changes an agent, its prompt or its model, record the run in the product's test-coverage map (which test proves what, and when it last passed), and describe each agent in its automation doc: what it may read, the exact tools it may call, and what the app enforces around it (`shipping-artifacts`). A feature that calls the model once, not as an agent, keeps the same live run and cost ceiling (playbook § 3).

## How you can tell it worked

The agent answers in the deployed app using only the tools its role allows, and the live agent suite passes against the real model.

## Running the scripts

Run them from the app's repository root: `<skill dir>` is wherever this skill is installed (a plugin, `~/.claude/skills/`, or the repo's own `.claude/skills/`), and the scripts write into the current directory.
