import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import Anthropic from '@anthropic-ai/sdk';
import type { SessionCreateParams } from '@anthropic-ai/sdk/resources/beta/sessions/sessions';
import type { BetaManagedAgentsEventParams, BetaManagedAgentsStreamSessionEvents } from '@anthropic-ai/sdk/resources/beta/sessions/events';
import { z } from 'zod';

vi.mock('server-only', () => ({}));
const getCaller = vi.hoisted(() => vi.fn<(req: Request) => Promise<{ id: string } | null>>());
vi.mock('@/lib/caller', () => ({ getCaller }));

const root = mkdtempSync(join(tmpdir(), 'managed-agents-'));
const agents = join(root, '.claude', 'agents');
const write = (name: string, body: string) => {
  const path = join(agents, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
};

const configs = { code: '["code"]', search: '["search"]', both: '["code","search"]', bad: '["fetch"]', malformed: '[' };
for (const [dir, config] of Object.entries(configs)) {
  write(`${dir}/AGENTS.md`, 'Use your tools.');
  write(`${dir}/hosted.json`, config);
}
write('plain/AGENTS.md', 'You are Plain.');
write('vault/AGENTS.md', 'You are Vault.');
write('files/AGENTS.md', 'You answer from files.');
write('files/knowledge/okrs.md', '# OKRs\nScore from 0 to 1.');
write('files/knowledge/deep/jtbd.md', 'Jobs to be done.');
write('files/knowledge/.env-fixture', 'PRIVATE_FIXTURE');
write('files/.claude/skills/cite/SKILL.md', '---\ndescription: "Cite every source."\n---\nName the source.');
write('files/.claude/skills/cite/format.md', 'One source per line.');
write('mcp/AGENTS.md', 'You have MCP.');
write('mcp/.mcp.json', '{}');
write('missing/notes.md', 'No instructions.');

let lib: typeof import('@/lib/agent');
beforeAll(async () => {
  vi.spyOn(process, 'cwd').mockReturnValue(root);
  vi.stubEnv('CLAUDE_AGENT_ID', 'agent_base');
  vi.stubEnv('CLAUDE_ENVIRONMENT_ID', 'env_main');
  vi.stubEnv('CLAUDE_SEARCH_ENVIRONMENT_ID', 'env_search');
  lib = await import('@/lib/agent');
});
afterAll(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  rmSync(root, { recursive: true, force: true });
});

type StreamEvent = BetaManagedAgentsStreamSessionEvents;
type Sent = BetaManagedAgentsEventParams;
type Options = import('@/lib/agent').AskAgentOptions;
const sid = 'sesn_test';
const opts = { agent: 'plain', owner: 'member-1', prompt: 'Hi?' };
const sessionMetadata = { agent: opts.agent, owner: opts.owner, app: 'embedded-agents-managed' };
const processed_at = '2026-11-25T00:00:00Z';
const block = (text: string) => ({ type: 'text' as const, text });
const user = (id = 'echo') => ({ type: 'user.message' as const, id, processed_at, content: [block(opts.prompt)] });
const message = (id: string, ...text: string[]) => ({ type: 'agent.message' as const, id, processed_at, content: text.map(block) });
const idle = (type: 'end_turn' | 'budget_reached' | 'retries_exhausted' = 'end_turn') =>
  ({ type: 'session.status_idle' as const, id: 'idle', processed_at, stop_details: null, stop_reason: { type } });
const model = { type: 'span.model_request_start' as const, id: 'model', processed_at };
const call = (id: string, name: string, input: Record<string, unknown> = {}) =>
  ({ type: 'agent.custom_tool_use' as const, id, processed_at, name, input });
const start = (id: string) => ({ type: 'event_start' as const, event: { id, type: 'agent.message' as const } });
const delta = (event_id: string, text: string, index = 0) => ({
  type: 'event_delta' as const, event_id, delta: { type: 'content_delta' as const, index, content: block(text) },
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const failed = (message: string, status = 400) => json({ type: 'error', error: { type: 'invalid_request_error', message } }, status);

function scripted(config: {
  onSend?: (event: Sent, send: (event: StreamEvent) => void) => Response | void;
  onMessage?: (send: (event: StreamEvent) => void, close: () => void, drop: () => void) => void;
  onDelete?: () => Response | undefined;
  session?: (id: string) => unknown;
  history?: StreamEvent[];
  sessions?: unknown[];
} = {}) {
  const requests: { method: string; url: URL; body: unknown }[] = [];
  const sent: Sent[] = [];
  let stream: ReadableStreamDefaultController<Uint8Array> | undefined;
  let streamSignal: AbortSignal | null | undefined;
  const send = (event: StreamEvent) => stream!.enqueue(new TextEncoder().encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? 'GET';
    const body: unknown = init?.body ? JSON.parse(String(init.body)) : undefined;
    requests.push({ method, url, body });
    const path = url.pathname;
    if (path.endsWith('/events/stream')) {
      streamSignal = init?.signal;
      return new Response(new ReadableStream<Uint8Array>({
        start(controller) {
          stream = controller;
          streamSignal?.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')), { once: true });
        },
      }), { headers: { 'content-type': 'text/event-stream' } });
    }
    if (path.endsWith('/events') && method === 'POST') {
      const { events } = body as { events: Sent[] };
      expect(events).toHaveLength(1);
      const event = events[0];
      sent.push(event);
      const override = config.onSend?.(event, send);
      if (override) return override;
      if (event.type === 'user.message') {
        expect(stream).toBeDefined();
        config.onMessage?.(send, () => stream!.close(), () => stream!.error(new Error('Connection lost')));
        return json({ data: [user()] });
      }
      return json({ data: [] });
    }
    if (path.endsWith('/events')) return json({ data: config.history ?? [], has_more: false });
    if (path === '/v1/sessions' && method === 'GET') {
      return json({ data: config.sessions ?? [], has_more: false });
    }
    if (path === '/v1/sessions' || method === 'DELETE') return (method === 'DELETE' && config.onDelete?.()) || json({ id: sid });
    const id = path.split('/').at(-1)!;
    const own = { id, metadata: sessionMetadata, agent: { id: 'agent_base', tools: [] } };
    return json(config.session ? config.session(id) : own, id === 'sesn_missing' ? 404 : 200);
  };
  const client = new Anthropic({ apiKey: 'offline-test', fetch, logLevel: 'off', maxRetries: 0 });
  return { client, fetch, sent, requests, streamClosed: () => streamSignal?.aborted };
}

function consultationScript(lead: ReturnType<typeof scripted>, ...specialists: ReturnType<typeof scripted>[]) {
  const scripts = [lead, ...specialists];
  const created: { id: string; params: SessionCreateParams }[] = [];
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const path = new URL(String(input)).pathname;
    if (path === '/v1/sessions' && init?.method === 'POST') {
      const id = `sesn_${created.length}`;
      created.push({ id, params: JSON.parse(String(init.body)) });
      return created.length <= scripts.length ? json({ id }) : failed('Unexpected session create.', 500);
    }
    const index = created.findIndex(({ id }) => id === path.split('/')[3]);
    if (!scripts[index]) return failed('Unexpected session.', 404);
    return scripts[index].fetch(input, init);
  };
  const client = new Anthropic({ apiKey: 'offline-test', fetch, logLevel: 'off', maxRetries: 0 });
  return { client, created };
}

async function run(client: Anthropic, overrides: Partial<Options> = {}) {
  const events: import('@/lib/agent').AgentEvent[] = [];
  for await (const event of lib.askAgent({ ...opts, ...overrides }, client)) events.push(event);
  return events;
}

function lookup(seen: string[] = []) {
  return lib.agentTool({
    name: 'lookup', description: 'Look up a key.', input: { key: z.string() },
    run: async ({ key }) => {
      seen.push(key);
      if (key === 'refusal') throw new lib.ToolError('This record is unavailable.');
      if (key === 'crash') throw new Error('sensitive database detail');
      return `value for ${key}`;
    },
  });
}

describe('session configuration', () => {
  test('sets overrides, workspace environment, budget and ownership without sending the prompt', () => {
    const r = lib.sessionRequest({ ...opts, model: 'claude-haiku-5-5', context: 'Caller has read access.', maxBudgetUsd: 0.29, tools: [lookup()] });
    expect(r).toMatchObject({
      agent: {
        type: 'agent_with_overrides', id: 'agent_base', model: { id: 'claude-haiku-5-5', effort: 'medium' },
        system: 'You are Plain.\n\nCaller has read access.',
        tools: [{ type: 'custom', name: 'lookup', description: 'Look up a key.', input_schema: { required: ['key'] } }],
      },
      environment_id: 'env_main',
      metadata: sessionMetadata,
      budget: { type: 'limit', max_list_cost: { amount: '29', currency: 'USD' } },
    });
    expect(r.initial_events).toBeUndefined();
    const tool = lookup();
    if (tool.type !== 'custom') throw new Error('Expected a custom tool.');
    expect(r.agent).toHaveProperty('tools.0.input_schema', tool.input_schema);
    expect(r.agent).not.toHaveProperty('tools.0.run');
    expect(() => lib.sessionRequest({ ...opts, maxBudgetUsd: 0.015 })).toThrow(/whole cents/);
  });

  test('discovers instruction folders and refuses traversal, MCP and duplicate names', () => {
    expect(lib.listAgents()).toEqual(['bad', 'both', 'code', 'files', 'malformed', 'mcp', 'plain', 'search', 'vault']);
    expect(() => lib.sessionRequest({ ...opts, agent: '../..' })).toThrow(/Invalid agent name/);
    expect(() => lib.sessionRequest({ ...opts, agent: 'missing' })).toThrow(/missing AGENTS/);
    expect(() => lib.sessionRequest({ ...opts, agent: 'mcp' })).toThrow(/\.mcp\.json.*embedded-agents-messages-api.*embedded-agents-agent-sdk/);
    expect(() => lib.sessionRequest({ ...opts, tools: [lookup(), lookup()] })).toThrow(/two tools named "lookup"/);
  });

  test('enables only bash or web search, using the corresponding environment', () => {
    for (const [agent, environment_id, name] of [['code', 'env_main', 'bash'], ['search', 'env_search', 'web_search']]) {
      expect(lib.sessionRequest({ ...opts, agent })).toMatchObject({ environment_id, agent: { tools: [{
        type: 'agent_toolset_20260401', default_config: { enabled: false },
        configs: [{ name, enabled: true, permission_policy: { type: 'always_allow' } }],
      }] } });
    }
    for (const agent of ['both', 'bad', 'malformed']) expect(() => lib.sessionRequest({ ...opts, agent })).toThrow(/hosted\.json/);
    vi.stubEnv('CLAUDE_SEARCH_ENVIRONMENT_ID', undefined);
    try {
      expect(() => lib.sessionRequest({ ...opts, agent: 'search' })).toThrow(/CLAUDE_SEARCH_ENVIRONMENT_ID/);
    } finally {
      vi.stubEnv('CLAUDE_SEARCH_ENVIRONMENT_ID', 'env_search');
    }
  });
});

describe('session ownership', () => {
  test('refuses missing sessions and mismatched owner, agent, base or app before opening a stream', async () => {
    const missing = scripted();
    await expect(lib.openSession({ ...opts, sessionId: 'sesn_missing' }, missing.client)).rejects.toBeInstanceOf(lib.NoSuchSession);
    for (const [metadata, base] of [
      [{ ...sessionMetadata, owner: 'foreign' }, 'agent_base'],
      [{ ...sessionMetadata, agent: 'files' }, 'agent_base'],
      [{ ...sessionMetadata, app: 'different' }, 'agent_base'],
      [sessionMetadata, 'agent_other'],
    ] as const) {
      const s = scripted({ session: () => ({ id: sid, metadata, agent: { id: base } }) });
      await expect(run(s.client, { sessionId: sid })).rejects.toBeInstanceOf(lib.NoSuchSession);
      expect(s.requests.map(({ method, url }) => [method, url.pathname])).toEqual([['GET', `/v1/sessions/${sid}`]]);
    }
  });

  test('transcript and deletion check ownership, and account deletion filters by owner and app', async () => {
    const own = { id: sid, metadata: sessionMetadata, agent: { id: 'agent_base' } };
    const s = scripted({ history: [user(), call('call', 'private'), message('reply', 'Hi')], sessions: [
      own, { ...own, id: 'sesn_archived', archived_at: processed_at },
      { ...own, id: 'sesn_foreign', metadata: { ...sessionMetadata, owner: 'foreign' } },
      { ...own, id: 'sesn_otherapp', metadata: { ...sessionMetadata, app: 'other' } },
    ] });
    await expect(lib.transcript(sid, 'foreign', s.client)).rejects.toBeInstanceOf(lib.NoSuchSession);
    await expect(lib.deleteSession(sid, 'foreign', s.client)).rejects.toBeInstanceOf(lib.NoSuchSession);
    expect(s.requests).toHaveLength(2);
    expect(await lib.transcript(sid, opts.owner, s.client)).toEqual([{ role: 'user', text: opts.prompt }, { role: 'assistant', text: 'Hi' }]);
    await lib.deleteOwnerSessions(opts.owner, s.client);
    const list = s.requests.find(({ url }) => url.pathname === '/v1/sessions')!.url;
    expect(list.searchParams.get('agent_id')).toBe('agent_base');
    expect(list.searchParams.get('include_archived')).toBe('true');
    expect(s.requests.filter(({ method }) => method === 'DELETE').map(({ url }) => url.pathname))
      .toEqual(['/v1/sessions/sesn_test', '/v1/sessions/sesn_archived']);
    await lib.deleteSession(sid, opts.owner, s.client);
    expect(s.requests.at(-1)?.method).toBe('DELETE');
  });

  test('deletion stops a running session first, and any other refusal is thrown', async () => {
    let refusals = 2;
    const s = scripted({ onDelete: () => refusals-- > 0 ? failed('Cannot delete session while it is running.') : undefined });
    await lib.deleteSession(sid, opts.owner, s.client);
    expect(s.sent).toEqual([{ type: 'user.interrupt' }]);
    expect(s.requests.filter(({ method }) => method === 'DELETE')).toHaveLength(3);
    const other = scripted({ onDelete: () => failed('another reason') });
    await expect(lib.deleteSession(sid, opts.owner, other.client)).rejects.toMatchObject({ status: 400 });
    expect(other.sent).toEqual([]);
  });
});

describe('the stream', () => {
  test('opens before sending, discards earlier runs, reconciles previews and stops at the next user message', async () => {
    const seen: string[] = [];
    const s = scripted({ onMessage(send) {
      for (const event of [
        user('earlier'), model, call('old', 'lookup', { key: 'old' }), start('old-text'), delta('old-text', 'old'),
        idle(), user(), delta('old-text', 'unmatched'), call('own', 'lookup', { key: 'new' }), start('reply'),
        delta('reply', 'Hel'), delta('reply', 'lo'), delta('reply', 'world', 1), message('reply', 'Hello ', 'world'),
        user('another'), message('another-reply', 'foreign'), idle(),
      ]) send(event);
    } });
    expect(await run(s.client, { tools: [lookup(seen)], maxTurns: 1 })).toEqual([
      { type: 'session', sessionId: sid },
      { type: 'text', text: 'Hel' }, { type: 'text', text: 'lo' }, { type: 'text', text: ' world' },
      expect.objectContaining({ type: 'done', text: 'Hello world', sessionId: sid }),
    ]);
    expect(seen).toEqual(['new']);
    expect(s.sent.some((event) => event.type === 'user.interrupt')).toBe(false);
    expect(s.requests[1].url.pathname).toMatch(/\/events\/stream$/);
    expect(s.requests[1].url.searchParams.getAll('event_deltas[]')).toEqual(['agent.message']);
    expect(s.streamClosed()).toBe(true);
  });

  test('keeps unpreviewed messages and reports only the last cumulative usage snapshot', async () => {
    const s = scripted({ onMessage(send) {
      send(user());
      send(message('reply', 'Answer.'));
      send({ type: 'session.usage', id: 'first', processed_at, usage: { input_tokens: 45 } });
      send({ type: 'session.usage', id: 'last', processed_at, usage: {
        input_tokens: 50, output_tokens: 25, cache_read_input_tokens: 10,
        cache_creation: { ephemeral_5m_input_tokens: 3, ephemeral_1h_input_tokens: 2 },
        list_cost: { amount: '7', currency: 'USD' },
      } });
      send(idle());
    } });
    expect((await run(s.client)).at(-1)).toMatchObject({ type: 'done', text: 'Answer.', metadata: { tokens: 90, cost: 0.07 } });
  });

  test.each([['budget_reached', 'error_max_budget_usd'], ['retries_exhausted', 'retries_exhausted'], ['end_turn', 'error_no_response']] as const)
  ('maps terminal idle %s to %s', async (reason, subtype) => {
    const s = scripted({ onMessage(send) { send(user()); send(idle(reason)); } });
    expect((await run(s.client)).at(-1)).toMatchObject({ type: 'error', sessionId: sid, subtype });
    expect(s.streamClosed()).toBe(true);
  });

  test('maps a truncated stream to a disconnect and aborts the stream', async () => {
    const s = scripted({ onMessage(send, close) { send(user()); send(message('reply', 'Partial.')); close(); } });
    expect((await run(s.client)).at(-1)).toMatchObject({ subtype: 'error_disconnected', text: 'Partial.' });
    expect(s.streamClosed()).toBe(true);
    expect(s.sent).toEqual([expect.objectContaining({ type: 'user.message' })]);
  });

  test('maps a broken stream to a disconnect and closes the request', async () => {
    const s = scripted({ onMessage(_send, _close, drop) { drop(); } });
    expect((await run(s.client)).at(-1)).toMatchObject({ subtype: 'error_disconnected' });
    expect(s.streamClosed()).toBe(true);
  });

  test('max turns runs no tool from that request, and interrupts before reporting the error', async () => {
    const seen: string[] = [];
    const s = scripted({ onMessage(send) { send(user()); send(model); send(call('limit', 'lookup', { key: 'never' })); } });
    expect((await run(s.client, { tools: [lookup(seen)], maxTurns: 1 })).at(-1)).toMatchObject({ subtype: 'error_max_turns' });
    expect(seen).toEqual([]);
    expect(s.sent.at(-1)).toEqual({ type: 'user.interrupt' });
    expect(s.streamClosed()).toBe(true);
  });

  test('interrupts a pending call and retries only the refused message', async () => {
    let messages = 0;
    const s = scripted({
      onSend(event) { if (event.type === 'user.message' && ++messages < 3) return failed('waiting on responses to events evt_1'); },
      onMessage(send) { send(user()); send(message('reply', 'Recovered.')); send(idle()); },
    });
    expect((await run(s.client, { sessionId: sid })).at(-1)).toMatchObject({ type: 'done', text: 'Recovered.' });
    expect(s.sent.map(({ type }) => type)).toEqual(['user.message', 'user.interrupt', 'user.message', 'user.message']);
    expect(s.requests.some(({ method, url }) => method === 'POST' && url.pathname === '/v1/sessions')).toBe(false);
  });

  test('throws a pending-call 400 that survives ten retries and closes the stream', { timeout: 8_000 }, async () => {
    const s = scripted({ onSend(event) {
      if (event.type === 'user.message') return failed('waiting on responses to events evt_1');
    } });
    await expect(run(s.client)).rejects.toMatchObject({ status: 400 });
    expect(s.sent.filter(({ type }) => type === 'user.message')).toHaveLength(11);
    expect(s.sent.filter(({ type }) => type === 'user.interrupt')).toHaveLength(1);
    expect(s.streamClosed()).toBe(true);
  });

  test('a message to a conversation whose budget is spent ends the run as the budget error', async () => {
    const s = scripted({ onSend: () => failed('session budget reached: consumed list cost has met `budget.max_list_cost`') });
    expect((await run(s.client, { sessionId: sid })).at(-1)).toMatchObject({ type: 'error', subtype: 'error_max_budget_usd' });
    expect(s.sent).toHaveLength(1);
    expect(s.streamClosed()).toBe(true);
  });

  test('text from two messages is two paragraphs', async () => {
    const s = scripted({ onMessage(send) {
      for (const event of [user(), start('a'), delta('a', 'Look'), message('a', 'Looking.'), message('b', 'Found it.'), idle()]) send(event);
    } });
    const events = await run(s.client);
    expect(events.flatMap((event) => event.type === 'text' ? [event.text] : [])).toEqual(['Look', 'ing.', '\n\nFound it.']);
    expect(events.at(-1)).toMatchObject({ type: 'done', text: 'Looking.\n\nFound it.' });
  });

  test('throws unrelated 400s without interrupting or retrying', async () => {
    const s = scripted({ onSend: () => failed('unrelated') });
    await expect(run(s.client)).rejects.toMatchObject({ status: 400 });
    expect(s.sent).toHaveLength(1);
    expect(s.streamClosed()).toBe(true);
  });

  test('times out on a live but stalled stream, closes it and interrupts', async () => {
    const s = scripted({ onMessage(send) { send(user()); } });
    expect((await run(s.client, { timeoutMs: 100 })).at(-1)).toMatchObject({ subtype: 'error_timeout' });
    expect(s.sent.at(-1)).toEqual({ type: 'user.interrupt' });
    expect(s.streamClosed()).toBe(true);
  });

  test('return after text closes the stream and interrupts', async () => {
    const s = scripted({ onMessage(send) { send(user()); send(message('reply', 'Started.')); } });
    const g = lib.askAgent(opts, s.client);
    expect((await g.next()).value).toEqual({ type: 'session', sessionId: sid });
    expect((await g.next()).value).toEqual({ type: 'text', text: 'Started.' });
    await g.return(undefined);
    expect(s.sent.at(-1)).toEqual({ type: 'user.interrupt' });
    expect(s.streamClosed()).toBe(true);
  });

  test('a request abort wakes a stalled reader and interrupts the turn', async () => {
    const controller = new AbortController();
    const s = scripted({ onMessage(send) { send(user()); send(message('reply', 'Started.')); } });
    const g = lib.askAgent({ ...opts, signal: controller.signal }, s.client);
    await g.next();
    expect((await g.next()).value).toEqual({ type: 'text', text: 'Started.' });
    const waiting = g.next();
    controller.abort();
    await waiting;
    await g.return(undefined);
    expect(s.sent.at(-1)).toEqual({ type: 'user.interrupt' });
    expect(s.streamClosed()).toBe(true);
  });
});

describe('local tools', () => {
  test('returns validation, unknown-tool, planned and fixed exception errors to the model', async () => {
    const seen: string[] = [];
    let received = 0;
    const s = scripted({
      onMessage(send) {
        send(user());
        send(call('invalid', 'lookup', { key: 7 }));
        send(call('unknown', 'unlisted'));
        send(call('planned', 'lookup', { key: 'refusal' }));
        send(call('crash', 'lookup', { key: 'crash' }));
        send({ ...idle(), stop_reason: { type: 'requires_action', event_ids: ['invalid', 'unknown', 'planned', 'crash'] } });
      },
      onSend(event, send) {
        if (event.type === 'user.custom_tool_result' && ++received === 4) { send(message('reply', 'Finished.')); send(idle()); }
      },
    });
    expect((await run(s.client, { tools: [lookup(seen)] })).at(-1)).toMatchObject({ type: 'done' });
    expect(seen).toEqual(['refusal', 'crash']);
    for (const [id, result] of [
      ['invalid', 'Invalid tool input. Check these fields: key.'], ['unknown', 'There is no tool unlisted.'],
      ['planned', 'This record is unavailable.'], ['crash', lib.TOOL_FAILED],
    ]) {
      expect(s.sent).toContainEqual({ type: 'user.custom_tool_result', custom_tool_use_id: id, is_error: true, content: [block(result)] });
    }
    expect(JSON.stringify(s.sent)).not.toContain('sensitive database detail');
  });

  test('posts the ready tool while the first is still running', async () => {
    let release!: (value: string) => void;
    const slow = new Promise<string>((resolve) => { release = resolve; });
    const tool = lib.agentTool({ name: 'work', description: 'Do work.', input: { slow: z.boolean() },
      run: async (input) => input.slow ? slow : 'fast',
    });
    const s = scripted({
      onMessage(send) { send(user()); send(call('slow', 'work', { slow: true })); send(call('fast', 'work', { slow: false })); },
      onSend(event, send) {
        if (event.type !== 'user.custom_tool_result') return;
        if (event.custom_tool_use_id === 'fast') release('slow');
        else { send(message('reply', 'Both.')); send(idle()); }
      },
    });
    expect((await run(s.client, { tools: [tool], timeoutMs: 500 })).at(-1)).toMatchObject({ type: 'done' });
    expect(s.sent.flatMap((event) => event.type === 'user.custom_tool_result' ? [event.custom_tool_use_id] : [])).toEqual(['fast', 'slow']);
  });

  test('a failed result post aborts the blocked stream and interrupts', async () => {
    const s = scripted({
      onMessage(send) { send(user()); send(call('one', 'lookup', { key: 'alpha' })); },
      onSend(event) { if (event.type === 'user.custom_tool_result') return failed('unavailable', 500); },
    });
    expect((await run(s.client, { tools: [lookup()], timeoutMs: 500 })).at(-1)).toMatchObject({ subtype: 'error_tool_result' });
    expect(s.sent.at(-1)).toEqual({ type: 'user.interrupt' });
    expect(s.streamClosed()).toBe(true);
  });

  test('a resumed session cannot run a tool absent from its initial snapshot', async () => {
    const seen: string[] = [];
    const s = scripted({
      onMessage(send) { send(user()); send(call('call', 'lookup', { key: 'new-tool' })); },
      onSend(event, send) {
        if (event.type === 'user.custom_tool_result') { send(message('reply', 'Finished.')); send(idle()); }
      },
    });
    expect((await run(s.client, { sessionId: sid, tools: [lookup(seen)] })).at(-1)).toMatchObject({ type: 'done' });
    expect(seen).toEqual([]);
    expect(s.sent.at(-1)).toMatchObject({ type: 'user.custom_tool_result', is_error: true });
  });

  test('file and skill tools only read their roots and report successful file reads', async () => {
    const knowledge = join(agents, 'files', 'knowledge');
    symlinkSync(agents, join(knowledge, 'escape'), 'junction');
    try {
      const attempts = [
        call('list', 'list_files'), call('search', 'search_files', { query: 'Score' }),
        call('okrs', 'read_file', { path: 'knowledge/okrs.md' }), call('skill', 'load_skill', { name: 'cite' }),
        call('format', 'read_skill_file', { name: 'cite', path: 'format.md' }),
        ...['../AGENTS.md', join(agents, 'plain', 'AGENTS.md'), '.env-fixture', '.ENV-fixture', 'escape/plain/AGENTS.md']
          .map((path, i) => call(`refuse${i}`, 'read_file', { path })),
        call('skill-escape', 'read_skill_file', { name: 'cite', path: '../../../AGENTS.md' }),
        call('other-skill', 'load_skill', { name: 'other' }),
      ];
      let received = 0;
      const s = scripted({
        onMessage(send) { send(user()); for (const event of attempts) send(event); },
        onSend(event, send) {
          if (event.type === 'user.custom_tool_result' && ++received === attempts.length) { send(message('reply', 'Finished.')); send(idle()); }
        },
      });
      expect((await run(s.client, { agent: 'files' })).at(-1)).toMatchObject({ metadata: { filesRead: [
        'knowledge/okrs.md', '.claude/skills/cite/SKILL.md', '.claude/skills/cite/format.md',
      ] } });
      const result = (id: string) => s.sent.find((e) => e.type === 'user.custom_tool_result' && e.custom_tool_use_id === id);
      expect(result('list')).toMatchObject({ content: [block('knowledge/deep/jtbd.md\nknowledge/okrs.md')] });
      expect(result('search')).toMatchObject({ content: [block('knowledge/okrs.md:2: Score from 0 to 1.')] });
      expect(result('skill')).toMatchObject({ content: [expect.objectContaining({ text: expect.stringContaining('format.md') })] });
      for (const id of ['refuse0', 'refuse1', 'refuse2', 'refuse3', 'refuse4', 'skill-escape', 'other-skill']) {
        expect(result(id)).toMatchObject({ is_error: true });
      }
      expect(JSON.stringify(s.sent)).not.toContain('PRIVATE_FIXTURE');
    } finally {
      rmSync(join(knowledge, 'escape'), { force: true });
    }
  });
});

describe('specialist consultations', () => {
  const agent = 'vault';
  const description = 'Ask the vault for its code.';
  const question = 'What is the current code?';
  const toolResultEvent = (id: string, text: string, is_error = false) => ({
    type: 'user.custom_tool_result', custom_tool_use_id: id, content: [block(text)], is_error,
  });
  const consultationLead = (questions = [question]) => {
    let received = 0;
    return scripted({
      onMessage(send) {
        send(user());
        send(model);
        questions.forEach((q, i) => send(call(`consult_${i}`, 'ask_vault', { question: q })));
      },
      onSend(event, send) {
        if (event.type === 'user.custom_tool_result' && ++received === questions.length) {
          send(message('lead_reply', 'Lead answer.'));
          send(idle());
        }
      },
    });
  };
  const specialistAnswer = (text: string) => scripted({ onMessage(send) { send(user()); send(message('vault_reply', text)); send(idle()); } });

  test('each session gets its own tools, and the specialist gets the question, context and same owner', async () => {
    const readCode = vi.fn(async () => 'Code from the vault.');
    const leadRun = vi.fn(async () => 'Lead data.');
    const leadTool = lib.agentTool({ name: 'lookup_hours', description: 'Read opening hours.', input: {}, run: leadRun });
    const vaultTool = lib.agentTool({ name: 'read_code', description: 'Read the code.', input: {}, run: readCode });
    let received = 0;
    const vault = scripted({
      onMessage(send) {
        send(user());
        send(call('outside', 'lookup_hours'));
        send(call('read', 'read_code'));
      },
      onSend(event, send) {
        if (event.type === 'user.custom_tool_result' && ++received === 2) {
          send(message('vault_reply', 'Specialist answer.'));
          send(idle());
        }
      },
    });
    const lead = consultationLead();
    const { client, created } = consultationScript(lead, vault);
    const create = vi.spyOn(client.beta.sessions, 'create');
    const signal = new AbortController().signal;
    const runs = lib.specialistRuns(1);
    const consult = lib.agentTool(lib.askSpecialist({
      agent, description, owner: opts.owner, tools: [vaultTool], runs, signal, timeoutMs: 2000,
      context: 'The caller is on the annual plan.', model: 'claude-haiku-5-5', maxBudgetUsd: 0.1,
    }, client));

    expect(await run(client, { tools: [leadTool, consult], context: 'Lead-only context.', signal })).toEqual([
      { type: 'session', sessionId: 'sesn_0' }, { type: 'text', text: 'Lead answer.' },
      expect.objectContaining({ type: 'done', sessionId: 'sesn_0', text: 'Lead answer.' }),
    ]);
    expect(created.map(({ params: { agent } }) => {
      if (typeof agent !== 'object' || agent.type !== 'agent_with_overrides') throw new Error('Expected session overrides.');
      return agent.tools?.flatMap((tool) => tool.type === 'custom' ? [tool.name] : []).sort();
    })).toEqual([['ask_vault', 'lookup_hours'], ['read_code']]);
    expect(created[1].params).toMatchObject({
      agent: { id: 'agent_base', system: 'You are Vault.\n\nThe caller is on the annual plan.', model: { id: 'claude-haiku-5-5' } },
      metadata: { agent, owner: opts.owner }, budget: { max_list_cost: { amount: '10', currency: 'USD' } },
    });
    expect(create.mock.calls[1][1]).toMatchObject({ signal, timeout: 2000 });
    expect(vault.sent.filter((event) => event.type === 'user.message')).toEqual([{ type: 'user.message', content: [block(question)] }]);
    expect(vault.sent).toContainEqual(toolResultEvent('outside', 'There is no tool lookup_hours.', true));
    expect(vault.sent).toContainEqual(toolResultEvent('read', 'Code from the vault.'));
    expect(lead.sent).toContainEqual(toolResultEvent('consult_0', 'Specialist answer.'));
    expect(leadRun).not.toHaveBeenCalled();
    expect(readCode).toHaveBeenCalledOnce();
    expect(vault.requests.at(-1)).toMatchObject({ method: 'DELETE', url: expect.objectContaining({ pathname: '/v1/sessions/sesn_1' }) });
    expect(lead.requests.some(({ method }) => method === 'DELETE')).toBe(false);
    expect(runs.runs).toEqual([{ agent, metadata: expect.objectContaining({ cost: 0 }) }]);
  });

  test('three parallel consult calls open only two specialist sessions', async () => {
    const lead = consultationLead(['First?', 'Second?', 'Third?']);
    const first = specialistAnswer('First answer.');
    const second = specialistAnswer('Second answer.');
    const { client, created } = consultationScript(lead, first, second);
    const runs = lib.specialistRuns(2);
    const consult = lib.agentTool(lib.askSpecialist({ agent, description, tools: [], runs, owner: opts.owner }, client));

    await run(client, { tools: [consult] });
    expect(created.map(({ params }) => params.metadata?.agent)).toEqual(['plain', 'vault', 'vault']);
    expect(first.sent).toEqual([{ type: 'user.message', content: [block('First?')] }]);
    expect(second.sent).toEqual([{ type: 'user.message', content: [block('Second?')] }]);
    expect(lead.sent.slice(1)).toEqual(expect.arrayContaining([
      toolResultEvent('consult_0', 'First answer.'),
      toolResultEvent('consult_1', 'Second answer.'),
      toolResultEvent('consult_2', 'This message has reached its specialist run limit.', true),
    ]));
    expect([first, second].map((s) => s.requests.at(-1)?.method)).toEqual(['DELETE', 'DELETE']);
    expect(runs.started).toBe(2);
    expect(runs.runs).toHaveLength(2);
  });

  test('reserves the slot synchronously before creating the specialist session', async () => {
    const { client } = consultationScript(specialistAnswer('Answer.'));
    const create = vi.spyOn(client.beta.sessions, 'create');
    const runs = lib.specialistRuns(1);
    const consult = lib.askSpecialist({ agent, description, tools: [], runs, owner: opts.owner }, client);
    const answer = consult.run({ question });
    expect(runs.started).toBe(1);
    expect(create).toHaveBeenCalledOnce();
    await expect(answer).resolves.toBe('Answer.');
  });

  test.each([
    ['turn limit', true, 'The vault specialist stopped before answering (error_max_turns).'],
    ['empty answer', false, 'The vault specialist stopped before answering (error_no_response).'],
  ] as const)('reports a specialist %s and deletes the stopped session', async (_stop, turns, error) => {
    const lead = consultationLead();
    const vault = scripted({ onMessage(send) {
      send(user());
      if (turns) { send(model); send(call('limit', 'lookup', { key: 'do not run' })); }
      else send(idle());
    } });
    const { client } = consultationScript(lead, vault);
    const runs = lib.specialistRuns(1);
    const seen: string[] = [];
    const consult = lib.agentTool(lib.askSpecialist({
      agent, description, tools: [lookup(seen)], runs, owner: opts.owner, maxTurns: 1,
    }, client));

    expect((await run(client, { tools: [consult] })).at(-1)).toMatchObject({ type: 'done', text: 'Lead answer.' });
    expect(lead.sent).toContainEqual(toolResultEvent('consult_0', error, true));
    expect(vault.requests.at(-1)?.method).toBe('DELETE');
    expect(seen).toEqual([]);
    expect(runs.runs).toEqual([{ agent, metadata: expect.objectContaining({ tokens: 0 }) }]);
  });

  test('preserves the answer if best-effort deletion fails', async () => {
    const vault = scripted({
      onMessage(send) { send(user()); send(message('vault_reply', 'Answer.')); send(idle()); },
      onDelete: () => failed('Cannot delete this session.'),
    });
    const { client } = consultationScript(vault);
    const consult = lib.askSpecialist({ agent, description, tools: [], runs: lib.specialistRuns(1), owner: opts.owner }, client);
    await expect(consult.run({ question })).resolves.toBe('Answer.');
    expect(vault.requests.at(-1)?.method).toBe('DELETE');
  });

  test('a cancelled request interrupts and deletes an in-flight consultation', async () => {
    const request = new AbortController();
    const vault = scripted({
      onMessage(send) { send(user()); send(call('ready', 'ready')); },
      onSend(event) { if (event.type === 'user.custom_tool_result') request.abort(); },
    });
    const { client } = consultationScript(vault);
    const readyTool = lib.agentTool({ name: 'ready', description: 'Mark the consultation as started.', input: {}, run: async () => 'Ready.' });
    const consult = lib.askSpecialist({
      agent, description, tools: [readyTool], runs: lib.specialistRuns(1), owner: opts.owner, signal: request.signal,
    }, client);

    await expect(consult.run({ question })).rejects.toThrow('The vault specialist stopped before answering (error_disconnected).');
    expect(vault.sent).toContainEqual({ type: 'user.interrupt' });
    expect(vault.streamClosed()).toBe(true);
    expect(vault.requests.at(-1)?.method).toBe('DELETE');
  });
});

describe('the HTTP boundary', () => {
  const endpoint = 'http://localhost/api/agents';
  const request = (body: unknown, headers?: HeadersInit) => new Request(endpoint, {
    method: 'POST', headers, body: JSON.stringify(body),
  });

  test('checks Sec-Fetch-Site before Origin and refuses unsigned calls', async () => {
    const { GET, POST, DELETE } = await import('@/app/api/agents/route');
    getCaller.mockResolvedValue(null);
    expect((await POST(request(opts, { 'sec-fetch-site': 'cross-site', origin: 'http://localhost' }))).status).toBe(403);
    expect((await DELETE(new Request(endpoint, { method: 'DELETE', headers: { origin: 'http://other.example' } }))).status).toBe(403);
    expect((await POST(request(opts))).status).toBe(401);
    expect((await GET(new Request(endpoint))).status).toBe(401);
  });

  test('validates session IDs, known agents and the request shape before contacting the API', async () => {
    const { GET, POST, DELETE } = await import('@/app/api/agents/route');
    getCaller.mockResolvedValue({ id: opts.owner });
    const body = { agent: opts.agent, prompt: opts.prompt };
    expect((await POST(request({ ...body, sessionId: 'bad' }))).status).toBe(400);
    expect((await POST(request({ ...body, agent: 'missing' }))).status).toBe(400);
    expect((await POST(request({ ...body, history: [] }))).status).toBe(400);
    expect((await GET(new Request(`${endpoint}?sessionId=bad`))).status).toBe(400);
    expect((await DELETE(new Request(`${endpoint}?sessionId=bad`, { method: 'DELETE' }))).status).toBe(400);
    expect(await (await GET(new Request(endpoint))).json()).toEqual({ agents: lib.listAgents() });
  });

  test('streams every event in its wire shape, the confirm cards after the end included', async () => {
    vi.resetModules();
    vi.doMock('@/lib/agent', () => ({ ...lib, openSession: async () => (async function* () {
      yield { type: 'session', sessionId: sid };
      yield { type: 'text', text: 'Proposed.' };
      yield { type: 'done', text: 'Proposed.', sessionId: sid, metadata: {} };
      yield { type: 'cards', cards: [{ id: 'card-1' }] };
    })() }));
    try {
      const { POST } = await import('@/app/api/agents/route');
      getCaller.mockResolvedValue({ id: opts.owner });
      const body = await (await POST(request({ agent: opts.agent, prompt: opts.prompt }))).text();
      expect(body.trim().split('\n\n').map((line) => JSON.parse(line.slice('data: '.length)))).toEqual([
        { sessionId: sid }, { text: 'Proposed.' }, { done: true, agent: opts.agent, sessionId: sid, metadata: {} }, { cards: [{ id: 'card-1' }] },
      ]);
    } finally {
      vi.doUnmock('@/lib/agent');
      vi.resetModules();
    }
  });
});
