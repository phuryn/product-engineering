import { describe, test, expect, vi, beforeAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { query, type Options, type SDKMessage, type SDKResultError } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

vi.mock('server-only', () => ({}));
vi.mock('@anthropic-ai/claude-agent-sdk', async (importOriginal) => ({
  ...await importOriginal<typeof import('@anthropic-ai/claude-agent-sdk')>(),
  query: vi.fn(),
}));

// The embedded-agent contract, pinned without a model call. See the embedded-agents
// skill, references/agent-sdk-playbook.md, for the SDK measurements and what the tests cover.

const root = mkdtempSync(join(tmpdir(), 'agents-'));
const agentsDir = join(root, '.claude', 'agents');
function write(path: string, body: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}
write(join(agentsDir, 'plain', 'AGENTS.md'), 'You are Plain.');
write(join(agentsDir, 'vault', 'AGENTS.md'), 'You are Vault.');
write(join(agentsDir, 'tooled', 'AGENTS.md'), 'You are Tooled.');
write(join(agentsDir, 'tooled', '.claude', 'skills', 'cite', 'SKILL.md'), '---\nname: cite\ndescription: Cite sources.\n---\n');
write(join(agentsDir, 'tooled', '.mcp.json'), JSON.stringify({
  mcpServers: { search: { type: 'stdio', command: 'npx', args: ['-y', 'some-mcp'], env: { KEY: '${SEARCH_KEY}' }, allowedTools: ['find'] } },
}));
write(join(agentsDir, 'app-server', 'AGENTS.md'), 'You have a directory MCP server.');
write(join(agentsDir, 'app-server', '.mcp.json'), JSON.stringify({
  mcpServers: { app: { type: 'stdio', command: 'some-mcp', allowedTools: ['lookup'] } },
}));
write(join(agentsDir, 'not-an-agent', 'README.md'), 'No AGENTS.md here.');

let lib: typeof import('@/lib/agent');
beforeAll(async () => {
  vi.spyOn(process, 'cwd').mockReturnValue(root);
  process.env.SEARCH_KEY = 'k-123';
  lib = await import('@/lib/agent');
});

function lookup(run = async ({ path }: { path: string }) => `Found ${path}`) {
  return lib.agentTool({
    name: 'lookup',
    description: 'Look up a record by its path.',
    input: { path: z.string().trim().min(1) },
    run,
  });
}

async function withAppTools(options: Options | undefined, use: (client: Client) => Promise<void>) {
  const server = options?.mcpServers?.app;
  if (server?.type !== 'sdk') throw new Error('Expected an in-process app server');
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'caller-tool-test', version: '1.0.0' });
  await server.instance.connect(serverTransport);
  try {
    await client.connect(clientTransport);
    await use(client);
  } finally {
    await client.close();
    await server.instance.close();
  }
}

describe('agents are directories', () => {
  test('lists only directories that hold an AGENTS.md', () => {
    expect(lib.listAgents()).toEqual(['app-server', 'plain', 'tooled', 'vault']);
  });

  test('refuses a name that is a path, so a request body cannot pick the repo root', () => {
    expect(() => lib.agentOptions({ agent: '../..' })).toThrow(/Invalid agent name/);
    expect(() => lib.agentOptions({ agent: 'Plain' })).toThrow(/Invalid agent name/);
  });

  test('refuses a directory without AGENTS.md', () => {
    expect(() => lib.agentOptions({ agent: 'not-an-agent' })).toThrow(/missing AGENTS\.md/);
  });
});

describe('isolation contract', () => {
  test("appends the agent's AGENTS.md to the preset, because the SDK does not load it", () => {
    const o = lib.agentOptions({ agent: 'plain' });
    expect(o.systemPrompt).toEqual({ type: 'preset', preset: 'claude_code', append: 'You are Plain.' });
    expect(o.settingSources).toEqual(['project']);
  });

  test('appends per-run context after AGENTS.md', () => {
    const o = lib.agentOptions({ agent: 'plain', context: 'The caller: Maya.' });
    expect(o.systemPrompt).toEqual({ type: 'preset', preset: 'claude_code', append: 'You are Plain.\n\nThe caller: Maya.' });
  });

  test('only the built-in tools on the allowlist exist, and anything unapproved is denied', () => {
    const o = lib.agentOptions({ agent: 'plain' });
    expect(o.tools).toEqual(['Read', 'Glob', 'Grep']);
    expect(o.allowedTools).toEqual(['Read', 'Glob', 'Grep']);
    expect(o.permissionMode).toBe('dontAsk');
    expect(o.strictMcpConfig).toBe(true);
    expect(o.skills).toEqual([]);
    expect(o.mcpServers).toBeUndefined();
  });

  test("agent-local skills and .mcp.json are discovered, secrets expanded, tools granted per server", () => {
    const o = lib.agentOptions({ agent: 'tooled' });
    expect(o.skills).toEqual(['cite']);
    expect(o.mcpServers).toEqual({ search: { type: 'stdio', command: 'npx', args: ['-y', 'some-mcp'], env: { KEY: 'k-123' } } });
    expect(o.allowedTools).toEqual(['Read', 'Glob', 'Grep', 'mcp__search__find']);
    expect(o.tools).toEqual(['Read', 'Glob', 'Grep']);
  });
});

describe('caller tools', () => {
  test('adds one in-process app server beside the directory server and allows each app tool', () => {
    const count = lib.agentTool({ name: 'count', description: 'Count records.', input: {}, run: async () => '2' });
    const base = lib.agentOptions({ agent: 'tooled' });
    const o = lib.agentOptions({ agent: 'tooled', tools: [lookup(), count] });
    expect(o.mcpServers).toEqual({ ...base.mcpServers, app: { type: 'sdk', name: 'app', instance: expect.any(Object) } });
    expect(o.allowedTools).toEqual([...base.allowedTools!, 'mcp__app__lookup', 'mcp__app__count']);
    expect(o.tools).toEqual(base.tools);
  });

  test('allows app tools even with an explicit allowlist', () => {
    const allowedTools = ['Grep'];
    const o = lib.agentOptions({ agent: 'tooled', allowedTools, tools: [lookup()] });
    expect(o.allowedTools).toEqual(['Grep', 'mcp__app__lookup']);
    expect(o.tools).toEqual(['Grep']);
    expect(allowedTools).toEqual(['Grep']);
  });

  test('allows an empty tools list and leaves options as they were without caller tools', () => {
    const base = lib.agentOptions({ agent: 'app-server' });
    expect(lib.agentOptions({ agent: 'app-server', tools: [] })).toEqual({ ...base, hooks: expect.any(Object) });
    expect(base.allowedTools).toEqual(['Read', 'Glob', 'Grep', 'mcp__app__lookup']);
    expect(base.mcpServers).toEqual({ app: { type: 'stdio', command: 'some-mcp' } });
  });

  test('refuses an app server name already in use', () => {
    expect(() => lib.agentOptions({ agent: 'app-server', tools: [lookup()] })).toThrow(/already has an MCP server named "app"/);
  });

  test('refuses two caller tools with one name', () => {
    expect(() => lib.agentOptions({ agent: 'plain', tools: [lookup(), lookup()] })).toThrow(/two tools named "lookup"/);
  });

  test('returns planned errors and hides unplanned exception messages', async () => {
    const planned = lookup(async () => { throw new lib.ToolError('Record unavailable.'); });
    const unplanned = lookup(async () => { throw new Error('private database details'); });
    await expect(planned.handler({ path: 'invoices' }, undefined)).resolves.toEqual({
      isError: true, content: [{ type: 'text', text: 'Record unavailable.' }],
    });
    await expect(unplanned.handler({ path: 'invoices' }, undefined)).resolves.toEqual({
      isError: true,
      content: [{ type: 'text', text: "The tool failed before it could answer. Say so plainly; don't guess what it would have returned." }],
    });
  });

  test('the app server rejects bad input before run and passes valid input through the schema', async () => {
    const run = vi.fn(async ({ path }: { path: string }) => `Found ${path}`);
    await withAppTools(lib.agentOptions({ agent: 'plain', tools: [lookup(run)] }), async (client) => {
      const bad = await client.callTool({ name: 'lookup', arguments: { path: ' ' } });
      expect(bad.isError).toBe(true);
      expect(run).not.toHaveBeenCalled();
      await expect(client.callTool({ name: 'lookup', arguments: { path: ' invoices ' } })).resolves.toEqual({
        content: [{ type: 'text', text: 'Found invoices' }],
      });
      expect(run).toHaveBeenCalledExactlyOnceWith({ path: 'invoices' });
    });
  });
});

describe('path guard', () => {
  const dir = join(agentsDir, 'plain');

  test('allows paths inside the agent directory', () => {
    expect(lib.isBlockedPath(dir, 'Read', { file_path: 'knowledge/okrs.md' })).toBe(false);
    expect(lib.isBlockedPath(dir, 'Read', { file_path: join(dir, 'knowledge', 'okrs.md') })).toBe(false);
    expect(lib.isBlockedPath(dir, 'Glob', { pattern: 'knowledge/*.md' })).toBe(false);
    expect(lib.isBlockedPath(dir, 'Grep', { pattern: 'OKR', path: 'knowledge' })).toBe(false);
  });

  test('blocks absolute paths and traversal out of it, and env files anywhere', () => {
    expect(lib.isBlockedPath(dir, 'Read', { file_path: join(root, 'AGENTS.md') })).toBe(true);
    expect(lib.isBlockedPath(dir, 'Read', { file_path: '../tooled/AGENTS.md' })).toBe(true);
    expect(lib.isBlockedPath(dir, 'Glob', { pattern: join(root, '**', '*.md') })).toBe(true);
    expect(lib.isBlockedPath(dir, 'Grep', { pattern: 'x', path: '..' })).toBe(true);
    expect(lib.isBlockedPath(dir, 'Read', { file_path: '.env' })).toBe(true);
    expect(lib.isBlockedPath(dir, 'Read', { file_path: '.ENV' })).toBe(true);
  });

  test('is wired into PreToolUse', async () => {
    const hook = lib.agentOptions({ agent: 'plain' }).hooks!.PreToolUse![0].hooks[0];
    const signal = new AbortController().signal;
    await expect(hook({ tool_name: 'Read', tool_input: { file_path: join(root, 'AGENTS.md') } } as never, undefined, { signal }))
      .resolves.toMatchObject({ decision: 'block' });
    await expect(hook({ tool_name: 'Read', tool_input: { file_path: 'notes.md' } } as never, undefined, { signal }))
      .resolves.toEqual({});
  });

  test('leaves path fields of the registered caller tools to the app', async () => {
    const hook = lib.agentOptions({ agent: 'tooled', tools: [lookup()] }).hooks!.PreToolUse![0].hooks[0];
    const signal = new AbortController().signal;
    const input = { tool_input: { path: '/invoices' } };
    await expect(hook({ ...input, tool_name: 'mcp__app__lookup' } as never, undefined, { signal })).resolves.toEqual({});
    await expect(hook({ ...input, tool_name: 'mcp__search__find' } as never, undefined, { signal }))
      .resolves.toMatchObject({ decision: 'block' });
    const directoryHook = lib.agentOptions({ agent: 'app-server' }).hooks!.PreToolUse![0].hooks[0];
    await expect(directoryHook({ ...input, tool_name: 'mcp__app__lookup' } as never, undefined, { signal }))
      .resolves.toMatchObject({ decision: 'block' });
  });
});

test('history is carried as a preamble, not a database shape', () => {
  expect(lib.composePrompt('Next?', [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello' }]))
    .toBe('Previous conversation:\nUser: Hi\nAssistant: Hello\n\nNew question: Next?');
  expect(lib.composePrompt('Only this')).toBe('Only this');
});

const assistant = (text: string) => ({ type: 'assistant', message: { content: [{ type: 'text', text }] } }) as SDKMessage;
const result = (subtype: 'success' | SDKResultError['subtype'] = 'success') => ({
  type: 'result', subtype, total_cost_usd: 0.02, duration_ms: 100, usage: { input_tokens: 30, output_tokens: 20 },
}) as SDKMessage;

function scriptQuery(script: (request: Parameters<typeof query>[0]) => AsyncGenerator<SDKMessage, void>) {
  return vi.mocked(query).mockReset().mockImplementation((request) => script(request) as ReturnType<typeof query>);
}

async function run(overrides: Partial<import('@/lib/agent').AskAgentOptions>) {
  const events: import('@/lib/agent').AgentEvent[] = [];
  for await (const event of lib.askAgent({ agent: 'plain', prompt: 'Find the code.', ...overrides })) events.push(event);
  return events;
}

describe('specialist consultations', () => {
  const agent = 'vault';
  const description = 'Ask the vault for its code.';

  test('runs each agent with its own tool server and gives the specialist only the question and context', async () => {
    const question = 'What is the current code?';
    const context = 'The caller is on the annual plan.';
    const leadRun = vi.fn(async () => 'Lead data.');
    const readCode = vi.fn(async () => 'Code from the vault.');
    const leadTool = lib.agentTool({ name: 'lookup_hours', description: 'Read opening hours.', input: {}, run: leadRun });
    const specialistTool = lib.agentTool({ name: 'read_code', description: 'Read the code.', input: {}, run: readCode });
    const runs = lib.specialistRuns(1);
    const consult = lib.agentTool(lib.askSpecialist({
      agent, description, runs, context, tools: [specialistTool], model: 'claude-haiku-5-5', maxTurns: 3, maxBudgetUsd: 0.1,
    }));
    const calls = scriptQuery(async function* ({ options }) {
      if (options?.cwd === join(agentsDir, 'vault')) {
        await withAppTools(options, async (client) => {
          expect((await client.listTools()).tools.map(({ name }) => name)).toEqual(['read_code']);
          expect(await client.callTool({ name: 'lookup_hours', arguments: {} })).toMatchObject({ isError: true });
          expect(await client.callTool({ name: 'read_code', arguments: {} })).toEqual({ content: [{ type: 'text', text: 'Code from the vault.' }] });
        });
        yield assistant('Specialist answer.');
      } else {
        await withAppTools(options, async (client) => {
          expect((await client.listTools()).tools.map(({ name }) => name).sort()).toEqual(['ask_vault', 'lookup_hours']);
          expect(await client.callTool({ name: 'ask_vault', arguments: { question } })).toEqual({ content: [{ type: 'text', text: 'Specialist answer.' }] });
        });
        yield assistant('Lead answer.');
      }
      yield result();
    });

    expect(await run({
      tools: [leadTool, consult], allowedTools: ['Grep'], context: 'Lead-only context.',
      history: [{ role: 'user', content: 'Lead-only history.' }],
    })).toEqual([{ type: 'text', text: 'Lead answer.' }, expect.objectContaining({ type: 'done', text: 'Lead answer.' })]);
    expect(calls.mock.calls).toHaveLength(2);
    const [lead, vault] = calls.mock.calls.map(([request]) => request);
    expect(lead.options).toMatchObject({ cwd: join(agentsDir, 'plain'), allowedTools: ['Grep', 'mcp__app__lookup_hours', 'mcp__app__ask_vault'] });
    expect(vault).toMatchObject({
      prompt: question,
      options: {
        cwd: join(agentsDir, 'vault'), strictMcpConfig: true, skills: [],
        tools: ['Read', 'Glob', 'Grep'], allowedTools: ['Read', 'Glob', 'Grep', 'mcp__app__read_code'],
        systemPrompt: { type: 'preset', preset: 'claude_code', append: `You are Vault.\n\n${context}` },
        model: 'claude-haiku-5-5', maxTurns: 3, maxBudgetUsd: 0.1,
      },
    });
    expect(leadRun).not.toHaveBeenCalled();
    expect(readCode).toHaveBeenCalledOnce();
    expect(runs.runs).toEqual([{ agent, metadata: { cost: 0.02, duration_ms: 100, filesRead: [], tokens: 50 } }]);
  });

  test('three parallel consult calls start only two runs', async () => {
    const runs = lib.specialistRuns(2);
    const consult = lib.agentTool(lib.askSpecialist({ agent, description, tools: [], runs }));
    const calls = scriptQuery(async function* ({ options, prompt }) {
      if (options?.cwd === join(agentsDir, 'vault')) {
        yield assistant(`Answer to ${prompt}`);
      } else {
        await withAppTools(options, async (client) => {
          const answers = await Promise.all(['First?', 'Second?', 'Third?'].map((question) =>
            client.callTool({ name: 'ask_vault', arguments: { question } })));
          expect(answers).toEqual([
            { content: [{ type: 'text', text: 'Answer to First?' }] },
            { content: [{ type: 'text', text: 'Answer to Second?' }] },
            { isError: true, content: [{ type: 'text', text: 'This message has reached its specialist run limit.' }] },
          ]);
        });
        yield assistant('Done.');
      }
      yield result();
    });

    await run({ tools: [consult] });
    expect(calls.mock.calls.slice(1).map(([request]) => request.prompt)).toEqual(['First?', 'Second?']);
    expect(runs.started).toBe(2);
    expect(runs.runs.map(({ agent }) => agent)).toEqual(['vault', 'vault']);
  });

  test('reserves the slot synchronously before starting the query', async () => {
    const calls = scriptQuery(async function* () { yield assistant('Answer.'); yield result(); });
    const runs = lib.specialistRuns(1);
    const consult = lib.askSpecialist({ agent, description, tools: [], runs });
    const answer = consult.run({ question: 'Question?' });
    expect(runs.started).toBe(1);
    expect(calls).toHaveBeenCalledOnce();
    await expect(answer).resolves.toBe('Answer.');
  });

  test.each([
    ['error_max_budget_usd', 'The vault specialist stopped before answering (error_max_budget_usd).'],
    ['success', 'The vault specialist finished without an answer.'],
  ] as const)('reports specialist %s to the lead as a tool error when it has no answer', async (subtype, error) => {
    const runs = lib.specialistRuns(1);
    const consult = lib.agentTool(lib.askSpecialist({ agent, description, tools: [], runs }));
    const calls = scriptQuery(async function* ({ options }) {
      if (options?.cwd === join(agentsDir, 'vault')) {
        yield result(subtype);
      } else {
        await withAppTools(options, async (client) => {
          expect(await client.callTool({ name: 'ask_vault', arguments: { question: 'Question?' } })).toEqual({
            isError: true, content: [{ type: 'text', text: error }],
          });
        });
        yield assistant('The vault could not answer.');
        yield result();
      }
    });

    expect((await run({ tools: [consult] })).at(-1)).toMatchObject({ type: 'done', text: 'The vault could not answer.' });
    expect(calls).toHaveBeenCalledTimes(2);
    expect(runs.runs).toEqual([{ agent, metadata: expect.objectContaining({ cost: 0.02 }) }]);
  });

  test('neither native subagent name enters the tools or allowlist with or without consultations', () => {
    const consult = lib.agentTool(lib.askSpecialist({ agent, description, tools: [], runs: lib.specialistRuns(1) }));
    for (const tools of [[], [consult]]) {
      const options = lib.agentOptions({ agent: 'plain', tools, allowedTools: ['Read', 'Agent', 'Task'] });
      expect(options.tools).toEqual(['Read']);
      expect(options.allowedTools).toEqual(tools.length ? ['Read', 'mcp__app__ask_vault'] : ['Read']);
    }
  });
});
