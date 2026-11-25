import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { deleteSession, listAgents, NoSuchSession, openSession, transcript, type AgentEvent } from '@/lib/agent';
import { getCaller } from '@/lib/caller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SessionId = z.string().regex(/^sesn_[A-Za-z0-9]+$/);
const Body = z.strictObject({
  agent: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  prompt: z.string().trim().min(1).max(4000),
  sessionId: SessionId.optional(),
});

const json = (body: unknown, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' },
});

function sameOrigin(req: Request) {
  const site = req.headers.get('sec-fetch-site');
  if (site !== null) return site === 'same-origin';
  const origin = req.headers.get('origin');
  return origin === null || origin === new URL(req.url).origin;
}

function sessionFailure(error: unknown) {
  if (error instanceof NoSuchSession) return json({ error: 'no such session' }, 404);
  logFailure(error, {});
  return json({ error: 'session unavailable' }, 502);
}

/** Ids and the error's kind, never its body: a vendor's message can quote what the person wrote. */
function logFailure(error: unknown, ids: Record<string, string | undefined>) {
  const vendor = error instanceof Anthropic.APIError;
  console.error('Managed Agents failed', {
    ...ids, kind: error instanceof Error ? error.constructor.name : 'unknown',
    ...(vendor ? { status: error.status, request: error.requestID } : { message: error instanceof Error ? error.message : String(error) }),
  });
}

export async function GET(req: Request) {
  const caller = await getCaller(req);
  if (!caller?.id) return json({ error: 'unauthorized' }, 401);
  const sessionId = new URL(req.url).searchParams.get('sessionId');
  if (sessionId === null) return json({ agents: listAgents() });
  if (!SessionId.safeParse(sessionId).success) return json({ error: 'invalid session id' }, 400);
  try {
    return json({ messages: await transcript(sessionId, caller.id) });
  } catch (error) {
    return sessionFailure(error);
  }
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'forbidden' }, 403);
  const caller = await getCaller(req);
  if (!caller?.id) return json({ error: 'unauthorized' }, 401);
  const sessionId = SessionId.safeParse(new URL(req.url).searchParams.get('sessionId'));
  if (!sessionId.success) return json({ error: 'invalid session id' }, 400);
  try {
    await deleteSession(sessionId.data, caller.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return sessionFailure(error);
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'forbidden' }, 403);
  const caller = await getCaller(req);
  if (!caller?.id) return json({ error: 'unauthorized' }, 401);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !listAgents().includes(parsed.data.agent)) return json({ error: 'invalid request' }, 400);

  const { agent, prompt } = parsed.data;
  let sessionId = parsed.data.sessionId;
  // Apply the app's per-person limit here, and build the caller's tools here, so they close over caller.
  const disconnect = new AbortController();
  const signal = AbortSignal.any([req.signal, disconnect.signal]);
  // `withCards(run, …)` from the embedded-agents-design skill adds the confirm cards as a last event.
  let run: AsyncGenerator<AgentEvent | { type: 'cards'; cards: unknown[] }, void>;
  try {
    run = await openSession({ agent, prompt, sessionId, owner: caller.id, signal });
  } catch (error) {
    return sessionFailure(error);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const send = (data: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      try {
        const { done, value } = await run.next();
        if (disconnect.signal.aborted) return;
        if (req.signal.aborted) { controller.close(); return; }
        if (done) { controller.close(); return; }
        if (value.type === 'session') {
          sessionId = value.sessionId;
          send({ sessionId });
        } else if (value.type === 'text') send({ text: value.text });
        else if (value.type === 'cards') send({ cards: value.cards });
        else if (value.type === 'done') send({ done: true, agent, sessionId, metadata: value.metadata });
        else send({ error: value.subtype, agent, sessionId });
      } catch (error) {
        if (disconnect.signal.aborted) return;
        if (req.signal.aborted) { controller.close(); return; }
        logFailure(error, { agent, sessionId });
        send({ error: 'failed', agent, sessionId });
        controller.close();
      }
    },
    async cancel() {
      disconnect.abort();
      await run.return(undefined);
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform' },
  });
}
