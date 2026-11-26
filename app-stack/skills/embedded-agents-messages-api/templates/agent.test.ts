import { describe, test, expect, vi, beforeAll } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

vi.mock('server-only', () => ({}));

// The embedded-agent contract on the Claude API, pinned without a model call: what each request
// sends, which files an agent can read, and how a run ends. The loop is the SDK's real tool
// runner; only the network is scripted. See the embedded-agents-messages-api skill, reference/playbook.md.

const root = mkdtempSync(join(tmpdir(), 'agents-'));
const agentsDir = join(root, '.claude', 'agents');
function write(path: string, body: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}
write(join(root, 'AGENTS.md'), 'The repository instructions: never readable by an agent.');
write(join(root, '.env'), 'SECRET=1');
write(join(agentsDir, 'billing-help', 'AGENTS.md'), 'You are Billing Help.');
write(join(agentsDir, 'plain', 'AGENTS.md'), 'You are Plain.');
write(join(agentsDir, 'policy', 'AGENTS.md'), 'You are Policy.');
write(join(agentsDir, 'tooled', 'AGENTS.md'), 'You are Tooled.');
write(join(agentsDir, 'tooled', 'knowledge', 'okrs.md'), '# OKRs\nScore OKRs from 0 to 1.\nAim for 0.7.');
write(join(agentsDir, 'tooled', 'knowledge', 'deep', 'jtbd.md'), 'Jobs to be done.');
write(join(agentsDir, 'tooled', 'knowledge', '.env'), 'SECRET=2');
write(join(agentsDir, 'tooled', '.claude', 'skills', 'cite', 'SKILL.md'), '---\nname: cite\ndescription: "Cite every source."\n---\nEnd with Source: <file>.');
write(join(agentsDir, 'tooled', '.claude', 'skills', 'cite', 'format.md'), 'One source per line.');
write(join(agentsDir, 'tooled', '.mcp.json'), JSON.stringify({
  mcpServers: { search: { type: 'stdio', command: 'npx', args: ['-y', 'some-mcp'], env: { KEY: '${SEARCH_KEY}' }, allowedTools: ['find'] } },
}));
write(join(agentsDir, 'not-an-agent', 'README.md'), 'No AGENTS.md here.');

let lib: typeof import('@/lib/agent');
let mcp: typeof import('@/lib/agent-mcp');
beforeAll(async () => {
  vi.spyOn(process, 'cwd').mockReturnValue(root);
  process.env.SEARCH_KEY = 'k-123';
  lib = await import('@/lib/agent');
  mcp = await import('@/lib/agent-mcp');
});

/** Calls a tool the way the runner does: parse, then run; a ToolError is an error result. */
async function callTool(tools: import('@/lib/agent').AgentTool[], name: string, input: Record<string, unknown> = {}) {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`no tool ${name}`);
  try {
    return { text: String(await tool.run(tool.parse ? tool.parse(input) : input)), error: false };
  } catch (e) {
    if (e instanceof lib.ToolError) return { text: String(e.content), error: true };
    throw e;
  }
}

type Block = Record<string, unknown>;
type Sent = { model: string; system: Block[]; tools: Block[]; messages: { role: string; content: string | Block[] }[]; [k: string]: unknown };
const usage = (over: Partial<Record<string, number>> = {}) => ({ input_tokens: 100, output_tokens: 50, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, ...over });
const reply = (content: Block[], stop_reason: string, u = usage(), model = 'claude-sonnet-5-5') => ({ id: 'msg_1', type: 'message', role: 'assistant', model, content, stop_reason, stop_sequence: null, stop_details: null, usage: u });
const text = (t: string) => ({ type: 'text', text: t });
const call = (name: string, input: Block, id = 'toolu_1') => ({ type: 'tool_use', id, name, input });

/** A real client whose network is a script: one response per request, each request recorded. */
function scripted(...responses: (ReturnType<typeof reply> | number)[]) {
  const sent: Sent[] = [];
  const fetch = async (_url: unknown, init?: { body?: unknown }) => {
    sent.push(JSON.parse(String(init?.body)));
    const next = responses.shift();
    if (next === undefined) throw new Error('No scripted response left');
    if (typeof next === 'number') return new Response(JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'down' } }), { status: next, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify(next), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return { client: new Anthropic({ apiKey: 'test', fetch: fetch as never, maxRetries: 0 }), sent };
}

async function run(opts: Partial<import('@/lib/agent').AskAgentOptions>, client: Anthropic) {
  const events: import('@/lib/agent').AgentEvent[] = [];
  for await (const ev of lib.askAgent({ agent: 'plain', prompt: 'Hi?', ...opts }, client)) events.push(ev);
  return events;
}

function lookup(seen: string[] = []) {
  return lib.agentTool({
    name: 'lookup',
    description: 'Look up a key.',
    input: { key: z.string().min(2) },
    run: async ({ key }) => {
      seen.push(key);
      if (key === 'refuse') throw new lib.ToolError('Not yours.');
      if (key === 'crash') throw new Error('connection to db-internal:5432 failed, password=hunter2');
      return `value of ${key}`;
    },
  });
}

describe('agents are directories', () => {
  test('lists only directories that hold an AGENTS.md', () => {
    expect(lib.listAgents()).toEqual(['billing-help', 'plain', 'policy', 'tooled']);
  });

  test('refuses a name that is a path, so a request body cannot pick the repo root', () => {
    expect(() => lib.agentRequest({ agent: '../..' })).toThrow(/Invalid agent name/);
    expect(() => lib.agentRequest({ agent: 'Plain' })).toThrow(/Invalid agent name/);
  });

  test('refuses a directory without AGENTS.md', () => {
    expect(() => lib.agentRequest({ agent: 'not-an-agent' })).toThrow(/missing AGENTS\.md/);
  });
});

describe('the request', () => {
  test("AGENTS.md is the whole system prompt, cached with the tools; the run's context follows it", () => {
    const r = lib.agentRequest({ agent: 'plain', context: 'The caller: Maya.' });
    expect(r.system).toEqual([
      { type: 'text', text: 'You are Plain.', cache_control: { type: 'ephemeral' } },
      { type: 'text', text: 'The caller: Maya.' },
    ]);
    expect(r.cache_control).toEqual({ type: 'ephemeral' });
    expect(r.model).toBe(lib.DEFAULT_MODEL);
    expect(r.output_config).toEqual({ effort: 'medium' });
  });

  test('an agent with no files, skills or MCP servers has no tools: no built-in tool exists', () => {
    expect(lib.agentRequest({ agent: 'plain' }).tools).toEqual([]);
  });

  test('a model with a server-side refusal fallback gets it; Haiku 5.5, which has none, does not', () => {
    expect(lib.agentRequest({ agent: 'plain' })).toMatchObject({ betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
    const haiku = lib.agentRequest({ agent: 'plain', model: 'claude-haiku-5-5' });
    expect(haiku).not.toHaveProperty('fallbacks');
    expect(haiku).not.toHaveProperty('betas');
  });

  test('a model without a price cannot run, so a budget is never unknown', () => {
    expect(() => lib.agentRequest({ agent: 'plain', model: 'claude-unknown-1' })).toThrow(/No price for model/);
  });

  test("the caller's tools come first, then the directory's; two tools with one name are refused", () => {
    const r = lib.agentRequest({ agent: 'tooled', tools: [lookup()] });
    expect(r.tools.map((t) => t.name)).toEqual(['lookup', 'list_files', 'read_file', 'search_files', 'load_skill', 'read_skill_file']);
    expect(() => lib.agentRequest({ agent: 'plain', tools: [lookup(), lookup()] })).toThrow(/two tools named "lookup"/);
  });

  test('history is sent as the conversation it was: it opens with the user, and empty turns are dropped', () => {
    expect(lib.conversation('Next?', [
      { role: 'assistant', content: 'Hi! What do you need?' },
      { role: 'user', content: 'My invoices' },
      { role: 'assistant', content: '' },
      { role: 'assistant', content: 'Here they are.' },
    ])).toEqual([
      { role: 'user', content: 'My invoices' },
      { role: 'assistant', content: 'Here they are.' },
      { role: 'user', content: 'Next?' },
    ]);
  });

  test('cost follows the price list, cache included; a model off the list is priced at the top rates', () => {
    expect(lib.costOf('claude-sonnet-5-5', usage({ input_tokens: 1_000, output_tokens: 1_000, cache_creation_input_tokens: 1_000, cache_read_input_tokens: 1_000 })))
      .toBeCloseTo((1_000 * 2 + 1_000 * 10 + 1_000 * 2.5 + 1_000 * 0.1) / 1e6, 10);
    expect(lib.costOf('claude-haiku-5-5', usage({ input_tokens: 1, output_tokens: 1_000, cache_read_input_tokens: 100_000 })))
      .toBeCloseTo((1 * 0.5 + 1_000 * 2.5 + 100_000 * 0.05) / 1e6, 10);
    expect(lib.costOf('claude-fallback-x', usage({ input_tokens: 1_000, output_tokens: 1_000 }))).toBeCloseTo((1_000 * 10 + 1_000 * 50) / 1e6, 10);
  });
});

describe('knowledge files', () => {
  test('list, search and read stay inside knowledge/, and every read is recorded', async () => {
    const filesRead: string[] = [];
    const tools = lib.agentRequest({ agent: 'tooled' }, filesRead).tools;
    expect((await callTool(tools, 'list_files')).text).toBe('knowledge/deep/jtbd.md\nknowledge/okrs.md');
    expect((await callTool(tools, 'search_files', { query: 'okrs score' })).text.split('\n')[0]).toBe('knowledge/okrs.md:2: Score OKRs from 0 to 1.');
    expect(await callTool(tools, 'read_file', { path: 'knowledge/okrs.md' })).toEqual({ text: '# OKRs\nScore OKRs from 0 to 1.\nAim for 0.7.', error: false });
    expect((await callTool(tools, 'read_file', { path: 'deep/jtbd.md' })).text).toBe('Jobs to be done.');
    expect(filesRead).toEqual(['knowledge/okrs.md', 'knowledge/deep/jtbd.md']);
  });

  test('refuses the agent directory, the repo, absolute paths and env files', async () => {
    const tools = lib.agentRequest({ agent: 'tooled' }).tools;
    for (const path of ['../AGENTS.md', '../../../../AGENTS.md', join(root, 'AGENTS.md'), '.env', '.ENV', 'knowledge/.env', '../.mcp.json', 'knowledge/']) {
      expect(await callTool(tools, 'read_file', { path }), path).toMatchObject({ error: true });
    }
    expect((await callTool(tools, 'search_files', { query: 'SECRET' })).text).not.toContain('SECRET=');
    expect((await callTool(tools, 'list_files')).text).not.toContain('.env');
  });

  test('inside() resolves before it compares, so traversal and symlinked escapes both fail', () => {
    const dir = join(agentsDir, 'tooled', 'knowledge');
    expect(lib.inside(dir, 'okrs.md')).toBeTruthy();
    expect(lib.inside(dir, 'deep/../okrs.md')).toBeTruthy();
    expect(lib.inside(dir, 'deep/../../AGENTS.md')).toBeNull();
    expect(lib.inside(dir, '.')).toBeNull();
    // A link inside knowledge/ that points out of it ('junction' needs no privileges on Windows; elsewhere it is ignored).
    symlinkSync(root, join(dir, 'escape'), 'junction');
    // A link with a plain name to an env directory inside it.
    write(join(dir, '.env.d', 'keys.md'), 'SECRET=3');
    symlinkSync(join(dir, '.env.d'), join(dir, 'keys'), 'junction');
    try {
      expect(lib.inside(dir, 'escape/AGENTS.md')).toBeNull();
      expect(lib.inside(dir, 'keys/keys.md')).toBeNull();
    } finally {
      for (const link of ['escape', 'keys']) rmSync(join(dir, link), { recursive: false, force: true });
      rmSync(join(dir, '.env.d'), { recursive: true, force: true });
    }
  });
});

describe('agent-local skills', () => {
  test('are listed by name and description in the cached system prompt', () => {
    const r = lib.agentRequest({ agent: 'tooled' });
    expect(r.system[0].text).toContain('## Skills');
    expect(r.system[0].text).toContain('- cite: Cite every source.');
    expect(lib.agentRequest({ agent: 'plain' }).system[0].text).not.toContain('## Skills');
  });

  test('load_skill returns the instructions and names the other files; read_skill_file stays inside the skill', async () => {
    const filesRead: string[] = [];
    const tools = lib.agentRequest({ agent: 'tooled' }, filesRead).tools;
    const loaded = await callTool(tools, 'load_skill', { name: 'cite' });
    expect(loaded.text).toContain('End with Source: <file>.');
    expect(loaded.text).toContain('format.md');
    expect((await callTool(tools, 'read_skill_file', { name: 'cite', path: 'format.md' })).text).toBe('One source per line.');
    expect(await callTool(tools, 'read_skill_file', { name: 'cite', path: '../../../AGENTS.md' })).toMatchObject({ error: true });
    expect(filesRead).toEqual(['.claude/skills/cite/SKILL.md', '.claude/skills/cite/format.md']);
    await expect(callTool(tools, 'load_skill', { name: 'other' })).rejects.toThrow();
  });
});

describe('MCP servers', () => {
  test(".mcp.json is read with its secrets expanded and each server's allowed tools", () => {
    expect(mcp.readMcpConfig(join(agentsDir, 'tooled'))).toEqual({
      search: { type: 'stdio', command: 'npx', args: ['-y', 'some-mcp'], env: { KEY: 'k-123' }, allowedTools: ['find'] },
    });
    expect(mcp.readMcpConfig(join(agentsDir, 'plain'))).toEqual({});
  });

  test('a secret that is not set fails by name, before any server starts', () => {
    delete process.env.SEARCH_KEY;
    try {
      expect(() => mcp.readMcpConfig(join(agentsDir, 'tooled'))).toThrow(/MCP server "search" needs SEARCH_KEY/);
    } finally {
      process.env.SEARCH_KEY = 'k-123';
    }
  });

  test('an MCP tool that throws reaches the model as a fixed sentence, like any other tool', async () => {
    const raw = { type: 'custom', name: 'find', input_schema: { type: 'object' as const }, run: async () => { throw new Error('ECONNRESET 10.0.0.4 token=abc'); } };
    const tools = lib.agentRequest({ agent: 'plain' }, [], [raw as never]).tools;
    expect(await callTool(tools, 'find')).toEqual({ text: lib.TOOL_FAILED, error: true });
  });
});

describe('the run', () => {
  test('runs the tools the model asks for, then answers: a text event per response, then done with its cost', async () => {
    const seen: string[] = [];
    const { client, sent } = scripted(
      reply([text('Checking.'), call('lookup', { key: 'alpha' })], 'tool_use', usage({ cache_creation_input_tokens: 2000 })),
      reply([text('It is alpha.')], 'end_turn', usage({ cache_read_input_tokens: 2000 })),
    );
    const events = await run({ tools: [lookup(seen)] }, client);
    expect(seen).toEqual(['alpha']);
    expect(events.map((e) => e.type)).toEqual(['text', 'text', 'done']);
    const done = events.at(-1) as Extract<import('@/lib/agent').AgentEvent, { type: 'done' }>;
    expect(done.text).toBe('Checking.It is alpha.');
    expect(done.metadata.tokens).toBe(150 * 2 + 4000);
    expect(done.metadata.cost).toBeGreaterThan(0);
    expect(sent[0]).toMatchObject({ model: 'claude-sonnet-5-5', fallbacks: 'default', system: [{ text: 'You are Plain.' }] });
    expect(Object.keys(sent[0].tools[0])).not.toContain('run');
    expect(sent[1].messages.at(-1)).toEqual({ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: 'value of alpha' }] });
  });

  test('a response with text that calls only closing tools runs them and ends the run: no second request', async () => {
    const seen: string[] = [];
    const { client, sent } = scripted(reply([text('Here it is.'), call('lookup', { key: 'alpha' })], 'tool_use'));
    const events = await run({ tools: [lookup(seen)], closingTools: ['lookup'], maxTurns: 1 }, client);
    expect(seen).toEqual(['alpha']);
    expect(events).toEqual([{ type: 'text', text: 'Here it is.' }, expect.objectContaining({ type: 'done', text: 'Here it is.' })]);
    expect(sent).toHaveLength(1);
  });

  test('a closing tool called before any text, or beside another tool, does not end the run', async () => {
    const quiet = scripted(reply([call('lookup', { key: 'alpha' })], 'tool_use'), reply([text('It is alpha.')], 'end_turn'));
    expect((await run({ tools: [lookup()], closingTools: ['lookup'] }, quiet.client)).at(-1)).toMatchObject({ type: 'done', text: 'It is alpha.' });
    expect(quiet.sent).toHaveLength(2);
    const other = lib.agentTool({ name: 'other', description: 'Other.', input: {}, run: async () => 'ok' });
    const mixed = scripted(reply([text('Checking.'), call('lookup', { key: 'alpha' }), call('other', {}, 'toolu_2')], 'tool_use'), reply([text('Done.')], 'end_turn'));
    expect((await run({ tools: [lookup(), other], closingTools: ['lookup'] }, mixed.client)).at(-1)).toMatchObject({ type: 'done', text: 'Checking.Done.' });
    expect(mixed.sent).toHaveLength(2);
  });

  test('stops at maxTurns before running the tools the last response asked for', async () => {
    const seen: string[] = [];
    const { client, sent } = scripted(reply([call('lookup', { key: 'alpha' })], 'tool_use'));
    expect(await run({ tools: [lookup(seen)], maxTurns: 1 }, client)).toEqual([expect.objectContaining({ type: 'error', subtype: 'error_max_turns' })]);
    expect(seen).toEqual([]);
    expect(sent).toHaveLength(1);
  });

  test('stops at maxBudgetUsd the same way; a response that crosses it but answers is kept', async () => {
    const seen: string[] = [];
    const over = usage({ output_tokens: 100_000 });
    const stopped = await run({ tools: [lookup(seen)], maxBudgetUsd: 0.5 }, scripted(reply([text('Checking.'), call('lookup', { key: 'alpha' })], 'tool_use', over)).client);
    expect(stopped.at(-1)).toMatchObject({ type: 'error', subtype: 'error_max_budget_usd', text: 'Checking.' });
    expect(seen).toEqual([]);
    expect((await run({ maxBudgetUsd: 0.5 }, scripted(reply([text('Done.')], 'end_turn', over)).client)).at(-1)).toMatchObject({ type: 'done' });
  });

  test('a refusal or a cut-off answer is an error, not an answer', async () => {
    expect((await run({}, scripted(reply([], 'refusal')).client)).at(-1)).toMatchObject({ type: 'error', subtype: 'refusal' });
    expect((await run({}, scripted(reply([text('Half')], 'max_tokens')).client)).at(-1)).toMatchObject({ type: 'error', subtype: 'max_tokens' });
  });

  test('a ToolError is an error result the model reads; any other exception reaches it as a fixed sentence, never its message', async () => {
    const { client, sent } = scripted(
      reply([call('lookup', { key: 'refuse' }, 'toolu_a'), call('lookup', { key: 'crash' }, 'toolu_b')], 'tool_use'),
      reply([text('Sorry.')], 'end_turn'),
    );
    await run({ tools: [lookup()] }, client);
    expect(sent[1].messages.at(-1)!.content).toEqual([
      { type: 'tool_result', tool_use_id: 'toolu_a', content: 'Not yours.', is_error: true },
      { type: 'tool_result', tool_use_id: 'toolu_b', content: lib.TOOL_FAILED, is_error: true },
    ]);
    expect(JSON.stringify(sent)).not.toContain('hunter2');
  });

  test('a request that still fails after retries throws, for the caller to report', async () => {
    await expect(run({}, scripted(500).client)).rejects.toThrow();
  });
});

describe('specialist consultations', () => {
  const agent = 'billing-help';
  const description = 'Ask for help with a billing question.';

  test('each agent gets its own tools and the specialist gets only the new question and its context', async () => {
    const question = 'Which billing rule applies?';
    const context = 'The caller is on the annual plan.';
    const leadRun = vi.fn(async () => 'Lead data.');
    const readPolicy = vi.fn(async () => 'Policy attached.');
    const leadTool = lib.agentTool({ name: 'lead_lookup', description: 'Get lead data.', input: {}, run: leadRun });
    const specialistTool = lib.agentTool({ name: 'read_policy', description: 'Attach the policy.', input: {}, run: readPolicy });
    const { client, sent } = scripted(
      { ...reply([call('ask_billing_help', { question })], 'tool_use'), id: 'msg_lead' },
      { ...reply([call('lead_lookup', {}, 'toolu_outside')], 'tool_use'), id: 'msg_specialist' },
      reply([text('The annual rule applies.'), call('read_policy', {})], 'tool_use'),
      reply([text('Use the annual rule.')], 'end_turn'),
    );
    const runs = lib.specialistRuns(1);
    const consult = lib.askSpecialist({
      agent, description, runs, context, tools: [specialistTool], model: 'claude-haiku-5-5', closingTools: ['read_policy'],
    }, client);
    const events = await run({
      tools: [leadTool, lib.agentTool(consult)], context: 'Lead-only context.',
      history: [{ role: 'user', content: 'Lead-only history.' }],
    }, client);

    expect(sent).toHaveLength(4);
    expect(sent[0].tools.map(({ name }) => name).sort()).toEqual(['ask_billing_help', 'lead_lookup']);
    expect(sent[1].tools.map(({ name }) => name)).toEqual(['read_policy']);
    for (const [request, names, previous] of [
      [sent[2], ['read_policy'], 'msg_specialist'], [sent[3], ['ask_billing_help', 'lead_lookup'], 'msg_lead'],
    ] as const) {
      if (request.tools) expect(request.tools.map(({ name }) => name).sort()).toEqual(names);
      else expect(request.thread).toEqual({ type: 'continue', previous_message_id: previous });
    }
    expect(sent[1].system).toEqual([
      { type: 'text', text: 'You are Billing Help.', cache_control: { type: 'ephemeral' } },
      { type: 'text', text: context },
    ]);
    expect(sent[1].messages).toEqual([{ role: 'user', content: question }]);
    expect(sent[1].model).toBe('claude-haiku-5-5');
    expect(sent[2].messages.at(-1)?.content).toEqual([
      expect.objectContaining({ type: 'tool_result', tool_use_id: 'toolu_outside', is_error: true }),
    ]);
    expect(leadRun).not.toHaveBeenCalled();
    expect(readPolicy).toHaveBeenCalledOnce();
    expect(sent[3].messages.at(-1)?.content).toEqual([
      { type: 'tool_result', tool_use_id: 'toolu_1', content: 'The annual rule applies.' },
    ]);
    expect(events).toEqual([
      { type: 'text', text: 'Use the annual rule.' },
      expect.objectContaining({ type: 'done', text: 'Use the annual rule.' }),
    ]);
    expect(runs.runs).toEqual([{ agent, metadata: expect.objectContaining({ tokens: 300, cost: expect.any(Number) }) }]);
  });

  test('three parallel calls through two consult tools start only two runs', async () => {
    const { client, sent } = scripted(
      reply([
        call('ask_billing_help', { question: 'First?' }, 'toolu_first'),
        call('ask_policy', { question: 'Second?' }, 'toolu_second'),
        call('ask_billing_help', { question: 'Third?' }, 'toolu_third'),
      ], 'tool_use'),
      reply([text('Done.')], 'end_turn'),
    );
    const specialists = scripted(reply([text('First answer.')], 'end_turn'), reply([text('Second answer.')], 'end_turn'));
    const runs = lib.specialistRuns(2);
    const tools = [agent, 'policy'].map((agent) => lib.agentTool(lib.askSpecialist({ agent, description, tools: [], runs }, specialists.client)));

    await run({ tools }, client);
    expect(specialists.sent.map(({ messages }) => messages)).toEqual([
      [{ role: 'user', content: 'First?' }], [{ role: 'user', content: 'Second?' }],
    ]);
    expect(sent[1].messages.at(-1)?.content).toEqual([
      { type: 'tool_result', tool_use_id: 'toolu_first', content: 'First answer.' },
      { type: 'tool_result', tool_use_id: 'toolu_second', content: 'Second answer.' },
      { type: 'tool_result', tool_use_id: 'toolu_third', content: 'This message has reached its specialist run limit.', is_error: true },
    ]);
    expect(runs.started).toBe(2);
    expect(runs.runs.map(({ agent }) => agent).sort()).toEqual(['billing-help', 'policy']);
  });

  test('reserves a slot synchronously before a specialist run can finish', async () => {
    const runs = lib.specialistRuns(1);
    const { client } = scripted(reply([text('Answer.')], 'end_turn'));
    const consult = lib.askSpecialist({ agent, description, tools: [], runs }, client);
    const answer = consult.run({ question: 'Question?' });
    expect(runs.started).toBe(1);
    expect(runs.runs).toEqual([]);
    await expect(answer).resolves.toBe('Answer.');
  });

  test.each([
    [{ maxTurns: 1 }, reply([call('lookup', { key: 'alpha' })], 'tool_use'), 'The billing-help specialist stopped before answering (error_max_turns).'],
    [{ maxBudgetUsd: 0.0001 }, reply([call('lookup', { key: 'alpha' })], 'tool_use'), 'The billing-help specialist stopped before answering (error_max_budget_usd).'],
    [{}, reply([text('   ')], 'end_turn'), 'The billing-help specialist finished without an answer.'],
  ])('sends a stopped or empty specialist reply to the lead as an error (%j)', async (limits, response, error) => {
    const seen: string[] = [];
    const { client, sent } = scripted(
      reply([call('ask_billing_help', { question: 'Question?' })], 'tool_use'),
      response,
      reply([text('I could not get an answer.')], 'end_turn'),
    );
    const runs = lib.specialistRuns(1);
    const consult = lib.askSpecialist({ agent, description, tools: [lookup(seen)], runs, ...limits }, client);
    await run({ tools: [lib.agentTool(consult)] }, client);

    expect(seen).toEqual([]);
    expect(sent[2].messages.at(-1)?.content).toEqual([
      { type: 'tool_result', tool_use_id: 'toolu_1', content: error, is_error: true },
    ]);
    expect(runs.runs).toEqual([{ agent, metadata: expect.objectContaining({ tokens: 150, cost: expect.any(Number) }) }]);
  });

  test('validates the specialist directory and rules out nested consult tools when building the spec', () => {
    const spec = { agent, description, tools: [], runs: lib.specialistRuns(1) };
    expect(() => lib.askSpecialist({ ...spec, agent: '../..' })).toThrow(/Invalid agent name/);
    expect(() => lib.askSpecialist({ ...spec, agent: 'not-an-agent' })).toThrow(/missing AGENTS\.md/);
    const nested = lib.agentTool(lib.askSpecialist({ ...spec, agent: 'policy' }));
    expect(() => lib.askSpecialist({ ...spec, tools: [nested] })).toThrow('Remove consult tools from the billing-help specialist.');
  });
});
