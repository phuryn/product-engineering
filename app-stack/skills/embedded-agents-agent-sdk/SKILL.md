---
name: embedded-agents-agent-sdk
description: "Only when the Agent SDK is asked for, an agent needs Claude Code's own tools, or the app already runs it: embed Claude agents in a Next.js app with the Agent SDK."
---

# Embedded agents — Claude Agent SDK

**Use the Agent SDK when the agent needs the Claude Code engine.** Also use it when the product already runs it. The SDK starts that engine as a subprocess with built-in file and shell tools and Claude Code's own system prompt. It loads skills and MCP and needs a long-lived Node host. This skill and `embedded-agents-messages-api` run the same agent directories. The `embedded-agents-messages-api` skill is the default for a new product. It uses the Anthropic SDK's tool runner in the app's own process on any Node host, with only the wrapper's tools and no subprocess.

**Build no agent without its card.** Apply the `embedded-agents-design` skill first: the card fixes the agent's job, its exact tools, what code enforces and what waits for a person's click. A change to a tool, a prompt or a limit updates the card in the same change, not at the release.

**Read the product's own agent instructions before changing its embedded agents.** Start with its root `AGENTS.md` or `CLAUDE.md`, and tell any subagent spawned for this work to read it too. Its rules on secrets, environment variables, validation, callers, tests and release apply here. This skill adds how to run Claude agents inside the app. Read `reference/playbook.md` before changing the wrapper's contract or explaining it in depth. It holds the full playbook and the measurement behind every option.

**Keep request, caller, storage and UI ownership in the app.** The agent owns reasoning and tools. An agent is a directory, `.claude/agents/<name>/`, with `AGENTS.md` as its only instruction file. It may also hold `knowledge/`, agent-local skills in `.claude/skills/`, and `.mcp.json`. One wrapper function, `askAgent`, runs any agent. The wrapper hardcodes no agent names.

## 1. First use: install the wrapper

**Search for `askAgent` before installing another wrapper.** If it exists, skip to § 2. Otherwise:

1. **Create only the smallest requested app when none exists.** Use Next.js App Router in TypeScript, which these files target. Add nothing unasked for: no database, sign-in or billing for a local prototype.
2. **Install the missing dependencies.** Run `npm i @anthropic-ai/claude-agent-sdk zod server-only` and `npm i -D vitest @modelcontextprotocol/sdk`. The unit test uses an in-memory MCP client to check the app's tools.
3. **Copy the wrapper, route and tests, changing only import paths.**

   | From this skill | To the app |
   |---|---|
   | `templates/agent.ts` | `src/lib/agent.ts` — the wrapper |
   | `templates/route.ts` | `src/app/api/agents/route.ts` — `GET` lists agents, `POST` streams one |
   | `templates/agent.test.ts` | `tests/unit/agent.test.ts` — the contract, inside `npm test`, no model call |
   | `templates/agents.live.test.ts` | `tests/live/agents.live.test.ts` — every agent against the real model |
   | `templates/specialists.live.test.ts` | `tests/live/specialists.live.test.ts` — a lead consulting a specialist against the real model |

   The tests import `@/lib/agent`, so Vitest needs the same `@` alias as `tsconfig.json`. The live tests share a Vitest config (include `tests/live/**/*.live.test.ts`, `testTimeout: 180_000`, `fileParallelism: false`) and a script, `agents:live`. They cost money, so they stay out of `npm test` and the gate.
4. **Set each required secret per environment and never commit it.** Set `ANTHROPIC_API_KEY` and every secret referenced by an agent's `.mcp.json`; apply `environments`. On a developer's laptop the SDK falls back to their own Claude login when the key is absent; a deployed product always uses the key.
5. **Keep the contract.** Every isolation option in `agentOptions()` exists because an SDK default failed a measurement (playbook § 9). Change one only after re-measuring it.

## 2. Add an agent

1. **Create the agent directory and fill in its instructions.** Run `node <skill dir>/scripts/new-agent.mjs <name> [--knowledge] [--mcp]`, then fill in `AGENTS.md`: role, sources, output format, refusals. A fixed sign-off line is the cheapest live-test proof that the instructions are in force.
2. **Keep knowledge and automatically discovered skills inside the agent directory.** Put knowledge in `knowledge/*.md`, and tell the agent in `AGENTS.md` to answer only from them. Agent-local skills are found automatically in `.claude/agents/<name>/.claude/skills/<skill>/SKILL.md`.
3. **Allow only MCP tools the agent's job needs.** Put servers in `.mcp.json`, with secrets as `${VAR}`, never literal. Run `node --env-file=.env <skill dir>/scripts/discover-mcp-tools.mjs <name>` to list each server's tools, then restrict its `allowedTools`. Anything unlisted is denied. Commit the agent's `.mcp.json`, which holds no secrets. If `git check-ignore` reports it ignored, the repository's `.gitignore` has an unanchored `.mcp.json` rule meant for the root file. Anchor it as `/.mcp.json`.
4. **Discover agents from their directories rather than hardcoding the UI list.** `listAgents()` finds the directory, `GET /api/agents` returns it, and the UI's picker shows it when users choose between agents. A specialist only agents talk to stays out of that list (§ 3). Fix a UI that hardcodes that list.
5. **The instruction file is always `AGENTS.md`.** Asked for another name, create `AGENTS.md` and say why: the wrapper loads only `AGENTS.md`, and the SDK loads some other instruction files on its own, which would give the agent two sets of instructions.
6. **Add a live test for each promise worth pinning.** Examples include citing, refusing and answering only from its files. Put it beside the generic test.

## 3. Tools that act for the caller

**Build caller tools per request after resolving the caller.** For reads or changes to the caller's records, such as invoices or settings, build the app's own tools inside the route. Pass them as `askAgent({ …, tools })`:

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

- **Identity is closed over, never a parameter.** No tool takes an email, user, customer or account id: the model cannot ask for anyone else's records because no input can name them. Pin it with a unit test that reads every tool's `inputSchema`.
- **Validate tool input and control which failures reach the model.** `run` returns the text the model reads. A refusal or a planned failure throws `ToolError(text)`; the model reads it as an error result. Any other exception reaches the model as a fixed sentence, never its message. Input is validated against the zod shape before `run` sees it.
- **Have code decide risky or one-way actions proposed by tools.** A model may propose but never decide what cannot be taken back (`saas-authorization`): the tool stores a proposal, the app shows a button, the click runs it. The `embedded-agents-design` skill has the code and its tests. Links and buttons travel through the app, not through model text.
- **Put per-run facts in `context`, never user text.** It supplies facts such as the caller's identity to the system prompt after `AGENTS.md`.
- **Move the history to the server before passing any caller tool.** The supplied route reads it from the client, who can forge earlier turns, the agent's own included (§ 7).
- **Caller tools run in the app's process, not in the subprocess.** The wrapper serves them from one in-process MCP server named `app`, so they use the app's own clients and secrets and the subprocess needs neither (playbook § 2).

### One agent consults another

**Give each specialist its own query so it keeps its boundary.** Anthropic's subagent docs, read `2026-11-26`, describe native subagents using the lead's project and query budget. A separate `query()` gives the specialist its own directory, path guard, skills, MCP servers and limits. Each consultation starts another engine, with Claude Code's own system prompt: `reference/playbook.md` § 5 has the reasons and § 8 the measured time and cost.

**Give the lead an `ask_<specialist>` tool built for each request.** `askSpecialist` returns a spec named with the directory name's hyphens as underscores. Put it in the app's per-request tool registry (`AGENT_TOOLS` in the `embedded-agents-design` skill) and wrap it with `agentTool`. Its description says when to ask and what the question must carry, because the specialist sees nothing else. A wrapper copied before these helpers existed lacks them. Compare the app's `src/lib/agent.ts` and `tests/unit/agent.test.ts` with `templates/agent.ts` and `templates/agent.test.ts`, and take every change the app lacks, fixtures included. Here that includes the value import of `z` and the `Agent` and `Task` filter.

```ts
support: (caller, scope) => {
  const runs = specialistRuns(4); // assumption on the card: specialist runs per message
  return [
    listInvoices(caller),
    askSpecialist({
      agent: 'billing',
      description: 'Ask about billing policy. Include the charge type and the policy question.',
      runs, maxTurns: 6, maxBudgetUsd: 0.1,
      tools: AGENT_TOOLS.billing(caller, scope).map((spec) => agentTool(spec)),
      context: `The caller's plan: ${caller.plan}.`,
    }),
  ];
},
```

- **Give each agent exactly the tools listed on its own card.** Build both tool lists around the signed-in caller. The lead's in-process `app` server offers `mcp__app__ask_<specialist>`, whose handler starts the specialist's `askAgent()`. The specialist's own `app` server offers its caller tools. It also keeps the wrapper's file tools over its own directory and its own `.mcp.json` tools, the `wrapper` rows on its card. Pass `allowedTools` to narrow them where its card lists fewer.
- **Start the specialist with the question and an app-written context line.** Its own `AGENTS.md` and `context` are appended to the preset. Its fresh prompt is the question alone. Put only app-supplied caller facts in `context`.
- **Set each specialist's limits and compute the budget for the whole message.** Pass its `model`, `maxTurns` and `maxBudgetUsd` to `askSpecialist`. Compute the message ceiling as the lead's budget plus the run cap times the largest specialist budget.
- **Share one counter per message and reserve each slot before starting.** A response can ask several specialists at once. Once full, the tool says “This message has reached its specialist run limit.” A stopped run returns an error naming the specialist and reason. An empty answer returns an error too. To log a message's whole cost, create the counter where the route can read it and add the costs in `runs.runs` to the lead's.
- **Send links and confirm cards to the page through app code.** `showInvoice(caller, links)` uses the same per-request collector the route reads. `proposeTool(refund, caller, { store, scope })` uses the same store and scope as `withCards` and `readCards`. Apply the `embedded-agents-design` skill for the card flow. Only the lead's text streams to the page. The specialist's answer is a tool result.
- **Refuse a specialist at the route when only agents talk to it.** `listAgents()` finds every directory, so the copied route and its picker would offer the specialist to people too. Check the posted name against the agents people may open directly, as each card's "Who talks to it" says. Return that same list from `GET /api/agents`, so the picker never offers a specialist.
- **Keep consultations one level deep.** Each hop adds a run's time and cost, and a specialist that could ask could ask the lead back. The specialist's card has no `ask_` row, and `askSpecialist` rejects that prefix in its tool list. The wrapper excludes native `Agent` and `Task` from `tools` and `allowedTools`.
- **Test the boundary with scripted queries and a live consultation.** `agent.test.ts` checks both tool lists, the specialist's question, the parallel cap, the native-tool exclusion and the error results. `specialists.live.test.ts` checks the actual tool offers and that the lead retrieves a fresh code word. See `reference/playbook.md` § 8.

## 4. Examples — only when asked

**Copy finished examples only when asked for or described.** The `examples/` agents are: answering only from local product-management knowledge files (`knowledge-agent`), or live-web research through Perplexity with citations (`research-agent`). Copy `examples/<name>/` to `.claude/agents/<name>/` and `examples/<name>.live.test.ts` to `tests/live/`. `research-agent` needs `PERPLEXITY_API_KEY`. Otherwise, never copy them.

## 5. The chat UI

**Build the chat UI for this product and its agent flow.** There is no template. It must do the following:

- **Fill the picker from `GET /api/agents` when users choose agents.** A product may run one front agent and show no picker; the route still checks the name against `listAgents()`.
- **Send the conversation to the route and read server-sent events.** `POST { agent, prompt, history }` to `/api/agents` and read: `{ text }` chunks, then `{ done, agent, metadata }` or `{ error, agent }`. The parser is in playbook § 5.
- **Store the agent on every message; identify replies with several agents.** When there is more than one agent, show it on each reply, so the reader always knows which agent answered. History is the conversation so far, kept in client state unless the product asks to persist it or passes caller tools (§ 3).
- **Render agent output as plain text or sanitized markdown.** Never render raw HTML: it is untrusted text, like anything a user typed. Show an `error` event instead of spinning forever.

## 6. Explaining routing and the tool boundary

**Validate the requested agent before routing it to the wrapper.**

1. UI
2. `POST /api/agents { agent }`
3. the route validates the body and requires the name to be in `listAgents()`
4. `askAgent`
5. `agentOptions()` accepts only a plain directory name and resolves `.claude/agents/<agent>/`
6. `query()` starts the Claude Code engine with that directory as `cwd` and its `AGENTS.md` appended to the system prompt
7. events stream back.

**Keep every measured layer of the tool boundary in force.** See playbook § 9:
1. **Expose only built-in tools on the allowlist.** In `tools`, only those built-ins exist — `Read`, `Glob`, `Grep` by default. `Bash`, `Write`, `Edit` and `WebFetch` do not.
2. **Allow an MCP tool only when its server lists it or the run passed it.** With `permissionMode: 'dontAsk'` and `allowedTools`: a directory's MCP tool runs only if its server's `allowedTools` in `.mcp.json` lists it. A caller tool runs only on the run it was passed to, as `mcp__app__<name>`.
3. **Load only the agent's own MCP servers and the app's.** `strictMcpConfig`: only the agent's own `.mcp.json` servers and the in-process `app` server load — nothing from the developer's or the server's user configuration.
4. **List only the agent's own skills.** `skills` enforces this.
5. **Block paths outside the agent directory and every `.env` file.** The PreToolUse guard enforces this for built-in and directory MCP tools. Caller tools are exempt, so one may have an input named `path`, and enforce their own access.
6. **Cap the run by turns and budget.** Use `maxTurns` (10 by default) and `maxBudgetUsd`.

## 7. Before it leaves localhost

- **Choose a long-lived Node host before the agent leaves localhost.** The SDK runs the Claude Code engine as a subprocess, so an agent cannot run in a serverless function such as a Netlify Function (playbook § 7). A product whose site deploys there needs a second, long-lived Node host (a container or VM, such as Railway), chosen before the agent goes beyond localhost; write its deploy procedure into the product's docs the first time it is used. `next dev` needs nothing.
- **History is a client claim.** `templates/route.ts` accepts `history` from the client, `assistant` turns included, and `composePrompt` turns it into a "Previous conversation" preamble — so a client can forge earlier turns, the agent's own included. That is acceptable for a read-only agent, which can only be talked into saying something to the person forging it. Before any tool acts on the caller's behalf, keep the transcript on the server and stop reading it from the request.
- **Resolve the caller and cap cost before opening the route.** Before anyone but the developer can reach the route, resolve the caller there (who they are, which workspace, which permission: `saas-authorization`) and set a per-actor limit and a `maxBudgetUsd`.
- **Run live tests before releasing any agent, prompt or model change.** Run `npm run agents:live` before any release that adds or changes an agent, its prompt or its model, record the run in the product's test-coverage map (which test proves what, and when it last passed), and check that each agent's card in the automation doc matches its code (`embedded-agents-design`, `shipping-artifacts`).

## How you can tell it worked

The agent runs on the deployed host, not only on localhost, uses only the tools it was given, and the live agent suite passes against the real model.

## Running the scripts

**Run these scripts from the app's repository root.** `<skill dir>` is this skill's installation location: a plugin, `~/.claude/skills/`, or the repository's own `.claude/skills/`. The scripts write into the current directory.
