# Managed Agents playbook

Observed `2026-11-25` with Sonnet 5.5, the TypeScript SDK 1.14.0 and beta `managed-agents-2026-04-01`, from an app on localhost. The SDK adds the beta header itself.

## Which runtime

| Measured | So |
|---|---|
| The same question with one tool call, five runs each: median 3.4 s on the Messages API, 3.8 s here | The Messages API stays the default; speed is no reason to move |
| Three tools of two seconds each: 10.8 s with the SDK's own session tool runner, 5.5 s with this loop | Each result is posted as soon as its tool finishes |
| The SDK's runner passed raw exception text to the model, left an unknown tool unanswered, and ended silently on a missing session | The app validates, dispatches and checks ownership itself |

## The session

One base agent and one environment per Console workspace, made by `scripts/setup-managed.mjs`. Each conversation overrides the agent:

```ts
{
  agent: { type: 'agent_with_overrides', id, model, system, tools, mcp_servers: [], skills: [] },
  environment_id,
  budget: { type: 'limit', max_list_cost: { amount: '100', currency: 'USD' } },
  metadata: { owner, agent, app },
}
```

- `environment_id` is required, even with no hosted tool.
- `system` is `AGENTS.md`, the list of the agent's skills, then `context`. An open session's `system` cannot change (400); its tools can, but the wrapper leaves them alone.
- Facts about the caller sent later as `system.message` were disowned by the model three times out of three, so they go in `system`.
- `metadata` comes back unchanged, and `sessions.list` filters by `agent_id`. Ownership lives there, so there is no table. Use an opaque id, never an email.
- A client cannot write the agent's side: sending `agent.message` answered 400.
- An unknown session id answers 404; a malformed one 400, so the route checks the shape first.

## One turn

1. Open `events.stream` with `event_deltas: ['agent.message']`, then send the `user.message`. In that order, or the first events are missed.
2. `events.send` returns the accepted event and its id. Ignore the stream until that id appears: it also carries earlier turns and other listeners' turns. When another `user.message` follows yours, your turn is over.
3. `event_start` opens a preview, and `event_delta` (matched by `event_id`; it has no `id`) fills it. Deltas can stop early. The final `agent.message` has the same id and the whole text, so yield the part not yet shown. On one measured answer the first text came after 1.4 s with previews, 8.6 s without.
4. Each `agent.message` after the first starts a new paragraph. Joined as they came, a live run read "…the test value.local_check returned…".
5. `agent.custom_tool_use` carries `id`, `name` and `input`. The platform refuses `strict` and does not check input against the schema, so `zod` does.
6. Answer with `user.custom_tool_result`. A second result for one call, or one for an interrupted call, answers 200 with empty data, so a retry is safe. A message is never retried by the SDK: one already accepted would run twice.
7. `session.status_idle` with `requires_action` waits for results. Any other stop reason ends the turn.
8. Close the stream on every way out. Interrupt on a timeout, the turn limit, an abandoned request, or a result that could not be posted.

An idle stream closed on its own after about ten minutes, with no error; a result posted 16 minutes after the call was still accepted. The wrapper's 120-second deadline comes first.

## A call nobody answered

A crash between a tool call and its result leaves the session waiting, and the next message answers 400, "waiting on responses to events". The wrapper sends `user.interrupt` alone, then the message every 400 ms, up to ten times. The second try was accepted, 1.26 s in all. The model reads "Tool execution was interrupted before completion. Please retry." An interrupt and the message in one send were refused.

The tool may therefore run twice. Two listeners on one session ran the same call twice too.

## Deleting

- A running session answers 400, "Cannot delete session while it is running". The wrapper interrupts it and tries again every 400 ms, up to ten times. With `sleep 40` running in the sandbox, that took 1.6 s.
- A session waiting for a local tool is deleted at once.
- `deleteOwnerSessions` lists every session of the base agent, archived ones included, and keeps the owner's.

## Usage and spend

- The cap counts the whole conversation, in whole US cents as a string. With a 1-cent cap one long answer ended at 2 cents with `budget_reached`. The next message answers 400, "session budget reached"; the wrapper reports both as `error_max_budget_usd`.
- `session.usage` carries the conversation's tokens and its list cost. The wrapper reports the last one it saw, so no price table is needed. A turn that ended before any reports zero.

## Hosted tools

`agent_toolset_20260401` with `default_config.enabled: false`, and one tool enabled with `always_allow`.

| Mode | Tool | Environment | Observed |
|---|---|---|---|
| `code` | `bash` | Limited networking, no hosts, no MCP servers, no package managers | Root, Python 3.11.18, no DNS |
| `search` | `web_search` | Its own, with `allowed_hosts` as bare names, or unrestricted | Worked with one host; refused with none |

## Not tested

A deployed or serverless host, remote MCP, uploaded skills, webhooks, a self-hosted worker, partner clouds, and a network that drops mid-run. The unit tests script a dropped stream; they say nothing about a real proxy.
