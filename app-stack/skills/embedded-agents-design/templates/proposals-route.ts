import { z } from 'zod';
import { confirmProposal, readCards } from '@/lib/proposals';
// The app supplies these three modules using its session, actions and database.
import { getCaller } from '@/lib/caller';
import { ACTIONS } from '@/lib/agent-actions';
import { store } from '@/lib/proposal-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.strictObject({ id: z.uuid() });
const Scope = z.string().min(1).max(200);
const MAX_BODY_BYTES = 1024;

function ownOrigin(req: Request) {
  const site = req.headers.get('sec-fetch-site');
  if (site !== null) return site === 'same-origin';
  return req.headers.get('origin') === new URL(req.url).origin;
}

async function readId(req: Request) {
  if (req.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
    return new Response('Expected JSON', { status: 415 });
  }
  if (Number(req.headers.get('content-length')) > MAX_BODY_BYTES) {
    return new Response('Body too large', { status: 413 });
  }
  const reader = req.body?.getReader();
  if (!reader) return new Response('Invalid request', { status: 400 });
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0;
  let json = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) return new Response('Body too large', { status: 413 });
      json += decoder.decode(value, { stream: true });
    }
    const parsed = Body.safeParse(JSON.parse(json + decoder.decode()));
    if (parsed.success) return parsed.data.id;
  } catch {
    return new Response('Invalid request', { status: 400 });
  } finally {
    // Stop reading on a bad or oversized body, without waiting for more bytes.
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  return new Response('Invalid request', { status: 400 });
}

const json = (value: unknown, status = 200) => Response.json(value, {
  status, headers: { 'Cache-Control': 'private, no-store' },
});

export async function GET(req: Request) {
  const caller = await getCaller(req);
  if (!caller) return new Response('Unauthorized', { status: 401 });
  const scope = Scope.safeParse(new URL(req.url).searchParams.get('scope'));
  if (!scope.success) return new Response('Invalid scope', { status: 400 });
  return json({ cards: await readCards(caller, { store, scope: scope.data }) });
}

const status = { done: 200, refused: 403, failed: 500, used: 409, expired: 410, gone: 404 };

async function mutate(req: Request, dismiss: boolean) {
  const caller = await getCaller(req);
  if (!caller) return new Response('Unauthorized', { status: 401 });
  if (!ownOrigin(req)) return new Response('Forbidden', { status: 403 });
  const id = await readId(req);
  if (id instanceof Response) return id;
  if (dismiss) {
    if (await store.dismiss(id, caller.id)) return json({ state: 'dismissed' });
    return json({ state: 'gone', message: 'This proposal is unavailable.' }, 404);
  }
  const result = await confirmProposal({ id, caller, actions: ACTIONS, store });
  return json(result, status[result.state]);
}

export const POST = (req: Request) => mutate(req, false);
export const DELETE = (req: Request) => mutate(req, true);
