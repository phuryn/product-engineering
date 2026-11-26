import { describe, test, expect, vi } from 'vitest';
import { query, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { randomUUID } from 'node:crypto';

vi.mock('server-only', () => ({}));
import { askAgent, agentOptions, agentTool, listAgents } from '@/lib/agent';

// Every agent, against the real SDK and model. Costs money and needs ANTHROPIC_API_KEY
// (or the developer's own local login) plus each agent's MCP secrets. Runs outside the
// gate as `npm run agents:live`, before any release that adds or changes an agent.

async function initMessage(agent: string) {
  const ac = new AbortController();
  try {
    for await (const msg of query({ prompt: 'x', options: { ...agentOptions({ agent }), abortController: ac } })) {
      if (msg.type === 'system' && msg.subtype === 'init') { ac.abort(); return msg as Extract<SDKMessage, { subtype: 'init' }>; }
    }
  } catch (err) {
    if (!ac.signal.aborted) throw err;
  }
  throw new Error(`${agent}: no init message`);
}

describe.each(listAgents())('%s', (agent) => {
  test('sees exactly the MCP servers its .mcp.json declares, all connected, and only its allowed tools', async () => {
    const options = agentOptions({ agent });
    const init = await initMessage(agent);
    expect(init.mcp_servers.map((s) => s.name).sort()).toEqual(Object.keys(options.mcpServers ?? {}).sort());
    for (const s of init.mcp_servers) expect(s.status).toBe('connected');
    const builtIns = init.tools.filter((t) => !t.startsWith('mcp__'));
    for (const t of builtIns) expect(options.tools).toContain(t);
  });

  test('answers', async () => {
    let done = false;
    for await (const ev of askAgent({ agent, prompt: 'Introduce yourself in one sentence.' })) {
      if (ev.type === 'done') done = true;
    }
    expect(done).toBe(true);
  });
});

const agent = listAgents()[0] ?? '';
test.skipIf(!agent)('answers with a one-time code from a caller tool', async () => {
  const code = randomUUID();
  const getCode = agentTool({
    name: 'get_test_code',
    description: 'Return the one-time code for this live test run.',
    input: {},
    run: async () => code,
  });
  let answer = '';
  for await (const ev of askAgent({
    agent,
    prompt: 'Call the get_test_code tool and report the exact code it returns.',
    context: 'For this live test, use the caller tool as your source for the one-time code.',
    tools: [getCode],
  })) {
    if (ev.type === 'done') answer = ev.text;
  }
  expect(answer).toContain(code);
});
