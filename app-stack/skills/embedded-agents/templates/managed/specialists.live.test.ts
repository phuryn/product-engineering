import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { expect, test, vi } from 'vitest';
import type { AgentEvent } from '@/lib/agent';

vi.mock('server-only', () => ({}));

// Uses the default model in a development workspace with CLAUDE_AGENT_ID and CLAUDE_ENVIRONMENT_ID set.
test('the lead gets a fresh code word through the vault with separate session tool offers', async () => {
  const root = mkdtempSync(join(tmpdir(), 'specialists-'));
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue(root);
  try {
    const lead = 'When asked for the code word, call ask_vault once with a standalone question. Return the code word it gives you exactly.';
    const vault = 'Call read_code to find the code word. Reply with the code word exactly.';
    for (const [agent, instructions] of [['lead', lead], ['vault', vault]]) {
      const dir = join(root, '.claude', 'agents', agent);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'AGENTS.md'), instructions);
    }
    const { agentTool, askAgent, askSpecialist, deleteSession, NoSuchSession, specialistRuns } = await import('@/lib/agent');
    const owner = `agent-test-${randomUUID()}`;
    const client = new Anthropic({ maxRetries: 0, logLevel: 'off' });
    const create = vi.spyOn(client.beta.sessions, 'create');
    const remove = vi.spyOn(client.beta.sessions, 'delete');
    const code = `vault-${randomBytes(6).toString('hex')}`;
    const readCode = vi.fn(async () => code);
    const consult = askSpecialist({
      agent: 'vault', description: 'Ask the vault for its current code word.', runs: specialistRuns(1), owner,
      tools: [agentTool({ name: 'read_code', description: 'Read the current code word.', input: {}, run: readCode })],
    }, client);
    const tools = [
      agentTool({ name: 'lookup_hours', description: 'Read the opening hours.', input: {}, run: async () => '9 am to 5 pm.' }),
      agentTool(consult),
    ];
    try {
      let last: AgentEvent | undefined;
      for await (const event of askAgent({ agent: 'lead', prompt: 'What is the current code word?', owner, tools }, client)) last = event;

      expect(last?.type).toBe('done');
      expect(last).toMatchObject({ text: expect.stringContaining(code) });
      expect(readCode).toHaveBeenCalled();
      expect(create.mock.calls.map(([{ agent }]) => {
        if (typeof agent !== 'object' || agent.type !== 'agent_with_overrides') throw new Error('Expected session overrides.');
        return agent.tools?.flatMap((tool) => tool.type === 'custom' ? [tool.name] : []).sort();
      })).toEqual([['ask_vault', 'lookup_hours'], ['read_code']]);
      const [leadSession, vaultSession] = await Promise.all(create.mock.results.map(({ value }) => value));
      expect(last).toMatchObject({ sessionId: leadSession.id });
      expect(remove).toHaveBeenCalledWith(vaultSession.id);
      await expect(client.beta.sessions.retrieve(vaultSession.id)).rejects.toBeInstanceOf(Anthropic.NotFoundError);
      const saved = await client.beta.sessions.retrieve(leadSession.id);
      expect(saved.metadata).toMatchObject({ owner, agent: 'lead' });
      expect(saved.agent.tools.flatMap((tool) => tool.type === 'custom' ? [tool.name] : []).sort()).toEqual(['ask_vault', 'lookup_hours']);
    } finally {
      const sessions = await Promise.allSettled(create.mock.results.map(({ value }) => value));
      const deleted = await Promise.allSettled(sessions.flatMap((session) => session.status === 'fulfilled'
        ? [deleteSession(session.value.id, owner, client).catch((error: unknown) => { if (!(error instanceof NoSuchSession)) throw error; })] : []));
      expect(deleted.every(({ status }) => status === 'fulfilled'), 'live test sessions were deleted').toBe(true);
    }
  } finally {
    cwd.mockRestore();
    rmSync(root, { recursive: true, force: true });
  }
});
