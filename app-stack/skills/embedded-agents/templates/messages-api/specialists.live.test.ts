import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { expect, test, vi } from 'vitest';
import type { AgentEvent } from '@/lib/agent';

vi.mock('server-only', () => ({}));

type RequestBody = { tools?: { name: string }[]; thread?: { type: string; previous_message_id?: string } };

function recordingClient() {
  const requests: RequestBody[] = [];
  const client = new Anthropic({
    fetch: async (input, init) => {
      requests.push(JSON.parse(String(init?.body)));
      return globalThis.fetch(input, init);
    },
  });
  return { client, requests };
}

function expectTools(requests: RequestBody[], names: string[]) {
  expect(requests[0]?.tools?.map(({ name }) => name).sort()).toEqual(names);
  for (const { tools, thread } of requests.slice(1)) {
    if (tools) expect(tools.map(({ name }) => name).sort()).toEqual(names);
    else expect(thread).toMatchObject({ type: 'continue', previous_message_id: expect.any(String) });
  }
}

// Uses the real model and default model selection. Run with the other live agent tests.
test('the lead gets a fresh code word through the vault with each agent offered only its own tools', async () => {
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
    const { agentTool, askAgent, askSpecialist, specialistRuns } = await import('@/lib/agent');
    const leadRun = recordingClient();
    const vaultRun = recordingClient();
    const code = `vault-${randomBytes(6).toString('hex')}`;
    const readCode = vi.fn(async () => code);
    const consult = askSpecialist({
      agent: 'vault', description: 'Ask the vault for its current code word.', runs: specialistRuns(1),
      tools: [agentTool({ name: 'read_code', description: 'Read the current code word.', input: {}, run: readCode })],
    }, vaultRun.client);
    const tools = [
      agentTool({ name: 'lookup_hours', description: 'Read the opening hours.', input: {}, run: async () => '9 am to 5 pm.' }),
      agentTool(consult),
    ];
    let last: AgentEvent | undefined;
    for await (const event of askAgent({ agent: 'lead', prompt: 'What is the current code word?', tools }, leadRun.client)) last = event;

    expect(last).toMatchObject({ type: 'done', text: expect.stringContaining(code) });
    expect(readCode).toHaveBeenCalled();
    expectTools(leadRun.requests, ['ask_vault', 'lookup_hours']);
    expectTools(vaultRun.requests, ['read_code']);
  } finally {
    cwd.mockRestore();
    rmSync(root, { recursive: true, force: true });
  }
});
