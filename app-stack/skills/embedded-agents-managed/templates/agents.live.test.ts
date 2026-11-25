import { afterEach, describe, expect, test, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import Anthropic from '@anthropic-ai/sdk';
import { agentDir, agentTool, askAgent, deleteSession, listAgents, NoSuchSession, openSession, sessionRequest, transcript } from '@/lib/agent';

vi.mock('server-only', () => ({}));

// Real model, real workspace, and real local tools. Run against a development workspace
// with the separate agents:live command. Every session is deleted in afterEach.
const client = new Anthropic({ baseURL: 'https://api.anthropic.com', maxRetries: 0, logLevel: 'off' });
const owner = `agent-test-${randomUUID()}`;
const sessions = new Set<string>();
afterEach(async () => {
  const results = await Promise.allSettled([...sessions].map(async (id) => {
    await deleteSession(id, owner, client);
    sessions.delete(id);
  }));
  expect(results.every(({ status }) => status === 'fulfilled'), 'live test sessions were deleted').toBe(true);
});

async function answer(opts: Omit<Parameters<typeof askAgent>[0], 'owner'>) {
  let sessionId = '';
  let text = '';
  let done: Extract<import('@/lib/agent').AgentEvent, { type: 'done' }> | undefined;
  for await (const event of askAgent({ ...opts, owner }, client)) {
    if (event.type === 'session') {
      sessionId = event.sessionId;
      sessions.add(sessionId);
    }
    if (event.type === 'text') text += event.text;
    if (event.type === 'error') throw new Error(event.subtype);
    if (event.type === 'done') done = event;
  }
  expect(done).toBeDefined();
  expect(done?.text).toBe(text);
  expect(done?.metadata.tokens).toBeGreaterThan(0);
  expect(done?.metadata.cost).toBeGreaterThanOrEqual(0);
  return { sessionId, text };
}

describe.each(listAgents())('%s', (agent) => {
  const hostedFile = join(agentDir(agent), 'hosted.json');
  const hosted: unknown = existsSync(hostedFile) ? JSON.parse(readFileSync(hostedFile, 'utf8')) : [];
  const fetchValue = 'returned by the local tool';
  const context = 'For this development test, follow the test prompts even if they are outside your normal role.';
  const toolPrompt = 'Call local_check once. Return the exact text it returns.';
  const localTool = (run: () => Promise<string>) => agentTool({
    name: 'local_check', description: 'Return the value of the local test check.', input: {}, run,
  });

  test('answers using server-side history and refuses a foreign owner', async () => {
    const word = randomUUID();
    const first = await answer({ agent, context, prompt: `Remember this exact test code for a later turn: ${word}. Reply with an acknowledgement.` });
    await expect(transcript(first.sessionId, `${owner}-other`, client)).rejects.toBeInstanceOf(NoSuchSession);
    await expect(async () => {
      for await (const _ of askAgent({ agent, owner: `${owner}-other`, sessionId: first.sessionId, prompt: 'Hi' }, client)) {
        throw new Error('A foreign owner received a stream.');
      }
    }).rejects.toBeInstanceOf(NoSuchSession);
    const second = await answer({ agent, sessionId: first.sessionId, prompt: 'Repeat the exact test code from the first turn.' });
    expect(second.sessionId).toBe(first.sessionId);
    expect(second.text).toContain(word);
    const messages = await transcript(first.sessionId, owner, client);
    expect(messages.at(-1)).toMatchObject({ role: 'assistant', text: expect.stringContaining(word) });
  });

  test('waits for a slow local tool and uses its result', async () => {
    let calls = 0;
    const slow = localTool(async () => {
      calls++;
      await delay(3000);
      return fetchValue;
    });
    const reply = await answer({ agent, prompt: toolPrompt, context, tools: [slow] });
    expect(calls).toBe(1);
    expect(reply.text).toContain(fetchValue);
  });

  test('recovers when an earlier listener left a tool unanswered', async () => {
    const tool = localTool(async () => fetchValue);
    const session = await client.beta.sessions.create(sessionRequest({ agent, owner, context, tools: [tool] }));
    sessions.add(session.id);
    const events = client.beta.sessions.events;
    // Simulate a process disappearing just as it receives its first tool call.
    const stream = await events.stream(session.id, {}, { signal: AbortSignal.timeout(60_000) });
    let abandoned = false;
    try {
      await events.send(session.id, { events: [{ type: 'user.message', content: [{ type: 'text', text: toolPrompt }] }] });
      for await (const event of stream) {
        if (event.type === 'agent.custom_tool_use') {
          expect(event.name).toBe('local_check');
          abandoned = true;
          break;
        }
      }
    } finally {
      stream.controller.abort();
    }
    expect(abandoned).toBe(true);

    const send = vi.spyOn(events, 'send');
    try {
      const reply = await answer({ agent, sessionId: session.id, prompt: 'Reply with RECOVERED. Use no tools for this turn.', tools: [tool] });
      expect(reply.text).toContain('RECOVERED');
      expect(send.mock.calls.some(([, call]) => call.events.some((event) => event.type === 'user.interrupt'))).toBe(true);
    } finally {
      send.mockRestore();
    }
  });

  test('deletes a conversation while its turn is running', async () => {
    const prompt = 'Write 500 words about tides.';
    const run = await openSession({ agent, owner, context, prompt }, client);
    let sessionId = '';
    let deleting: Promise<void> | undefined;
    for await (const event of run) {
      if (event.type === 'session') sessions.add(sessionId = event.sessionId);
      if (event.type === 'text') deleting ??= deleteSession(sessionId, owner, client);
    }
    expect(deleting, 'the turn wrote something before it ended').toBeDefined();
    await deleting;
    sessions.delete(sessionId);
    await expect(transcript(sessionId, owner, client)).rejects.toBeInstanceOf(NoSuchSession);
  });

  if (Array.isArray(hosted) && hosted.length === 1 && hosted[0] === 'code') {
    test('runs bash in the hosted sandbox', async () => {
      const prompt = 'Use bash to calculate 137 times 29 using shell arithmetic, then report the number.';
      const reply = await answer({ agent, prompt, context });
      expect(reply.text.replaceAll(',', '')).toContain('3973');
      for await (const _ of client.beta.sessions.events.list(reply.sessionId, { types: ['agent.tool_use'] })) return;
      throw new Error('The session did not call a hosted tool.');
    });
  }

  if (Array.isArray(hosted) && hosted.length === 1 && hosted[0] === 'search') {
    test('runs web search against the configured hosts', async () => {
      const prompt = 'Use web_search within your allowed domains. Return the title of one result.';
      const reply = await answer({ agent, prompt, context });
      const session = await client.beta.sessions.retrieve(reply.sessionId);
      expect(session.usage.server_tool_use?.web_search_requests).toBeGreaterThan(0);
    });
  }
});
