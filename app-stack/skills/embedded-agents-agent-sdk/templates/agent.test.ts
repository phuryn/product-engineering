import { describe, test, expect, vi, beforeAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { z } from 'zod';

vi.mock('server-only', () => ({}));
vi.mock('@anthropic-ai/claude-agent-sdk', async (importOriginal) => ({
  ...await importOriginal<typeof import('@anthropic-ai/claude-agent-sdk')>(),
  query: vi.fn(),
}));

// The embedded-agent contract, pinned without a model call. See the embedded-agents-agent-sdk
// skill, reference/playbook.md, for the SDK measurements and what the tests cover.

const root = mkdtempSync(join(tmpdir(), 'agents-'));
const agentsDir = join(root, '.claude', 'agents');
function write(path: string, body: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}
write(join(agentsDir, 'plain', 'AGENTS.md'), 'You are Plain.');
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

describe('agents are directories', () => {
  test('lists only directories that hold an AGENTS.md', () => {
    expect(lib.listAgents()).toEqual(['app-server', 'plain', 'tooled']);
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
    const server = lib.agentOptions({ agent: 'plain', tools: [lookup(run)] }).mcpServers?.app;
    if (server?.type !== 'sdk') throw new Error('Expected an in-process app server');
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'caller-tool-test', version: '1.0.0' });
    await server.instance.connect(serverTransport);
    try {
      await client.connect(clientTransport);
      const bad = await client.callTool({ name: 'lookup', arguments: { path: ' ' } });
      expect(bad.isError).toBe(true);
      expect(run).not.toHaveBeenCalled();
      await expect(client.callTool({ name: 'lookup', arguments: { path: ' invoices ' } })).resolves.toEqual({
        content: [{ type: 'text', text: 'Found invoices' }],
      });
      expect(run).toHaveBeenCalledExactlyOnceWith({ path: 'invoices' });
    } finally {
      await client.close();
      await server.instance.close();
    }
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
