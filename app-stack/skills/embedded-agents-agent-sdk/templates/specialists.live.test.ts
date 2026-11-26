import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test, vi } from 'vitest';
import type { AgentEvent } from '@/lib/agent';

vi.mock('server-only', () => ({}));
const inits = vi.hoisted((): { cwd: string | undefined; tools: string[] }[] => []);
vi.mock('@anthropic-ai/claude-agent-sdk', async (importOriginal) => {
  const sdk = await importOriginal<typeof import('@anthropic-ai/claude-agent-sdk')>();
  return {
    ...sdk,
    async *query(request: Parameters<typeof sdk.query>[0]) {
      for await (const message of sdk.query(request)) {
        if (message.type === 'system' && message.subtype === 'init') {
          inits.push({ cwd: request.options?.cwd, tools: [...message.tools].sort() });
        }
        yield message;
      }
    },
  };
});

// Uses the real engine and default model. Run with the other live agent tests.
test('the lead gets a fresh code word through the vault with separate tool offers', async () => {
  inits.length = 0;
  const root = mkdtempSync(join(tmpdir(), 'specialists-'));
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue(root);
  try {
    const agents = join(root, '.claude', 'agents');
    const lead = 'When asked for the code word, call mcp__app__ask_vault once with a standalone question. Return the code word it gives you exactly.';
    const vault = 'Call mcp__app__read_code to find the code word. Reply with the code word exactly.';
    for (const [agent, instructions] of [['lead', lead], ['vault', vault]]) {
      const dir = join(agents, agent);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'AGENTS.md'), instructions);
    }
    const { agentTool, askAgent, askSpecialist, specialistRuns } = await import('@/lib/agent');
    const code = `vault-${randomBytes(6).toString('hex')}`;
    const readCode = vi.fn(async () => code);
    const consult = askSpecialist({
      agent: 'vault', description: 'Ask the vault for its current code word.', runs: specialistRuns(1), allowedTools: [],
      tools: [agentTool({ name: 'read_code', description: 'Read the current code word.', input: {}, run: readCode })],
    });
    const tools = [
      agentTool({ name: 'lookup_hours', description: 'Read the opening hours.', input: {}, run: async () => '9 am to 5 pm.' }),
      agentTool(consult),
    ];
    let last: AgentEvent | undefined;
    const options = { agent: 'lead', prompt: 'What is the current code word?', tools, allowedTools: [] };
    for await (const event of askAgent(options)) last = event;

    expect(last).toMatchObject({ type: 'done', text: expect.stringContaining(code) });
    expect(readCode).toHaveBeenCalled();
    expect(inits).toEqual([
      { cwd: join(agents, 'lead'), tools: ['mcp__app__ask_vault', 'mcp__app__lookup_hours'] },
      { cwd: join(agents, 'vault'), tools: ['mcp__app__read_code'] },
    ]);
  } finally {
    cwd.mockRestore();
    rmSync(root, { recursive: true, force: true });
  }
});
