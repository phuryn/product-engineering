import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { confirmProposal, defineAction, PROPOSAL_TTL_SECONDS, proposeTool, readCards, Refused, statusTool, withCards, type ProposalStore } from '@/lib/proposals';
import { proposalStoreContract, type StoreFixture } from './proposals.contract';

vi.mock('server-only', () => ({}));

function memoryFixture(): StoreFixture {
  type Draft = Parameters<ProposalStore['propose']>[0];
  type State = Awaited<ReturnType<ProposalStore['recent']>>[number]['state'];
  type Row = Draft & { id: string; expires: number; state: State; note: string | null };
  const rows: Row[] = [];
  const owned = (id: string, ownerId: string) => rows.find((row) => row.id === id && row.ownerId === ownerId);
  const scoped = (ownerId: string, scope: string) => rows.filter((row) => row.ownerId === ownerId && row.scope === scope);
  const expired = (row: Row) => row.expires <= Date.now();
  return {
    async expire(id) { rows.find((row) => row.id === id)!.expires = 0; },
    store: {
      async propose(draft) {
        const previous = scoped(draft.ownerId, draft.scope).find((row) =>
          (row.state === 'pending' || row.state === 'running') && row.action === draft.action && row.subject === draft.subject);
        if (previous?.state === 'running') return null;
        const expires = Date.now() + PROPOSAL_TTL_SECONDS * 1000;
        if (previous && isDeepStrictEqual([previous.args, previous.card], [draft.args, draft.card])) {
          previous.expires = expires;
          return previous.id;
        }
        if (previous) rows.splice(rows.indexOf(previous), 1);
        const id = randomUUID();
        rows.push({ ...structuredClone(draft), id, expires, state: 'pending', note: null });
        return id;
      },
      async pending(ownerId, scope) {
        return scoped(ownerId, scope).flatMap(({ id, card, state, ...rest }) => {
          if (state === 'running' || (state === 'pending' && rest.expires > Date.now())) return [{ id, card, state }];
          return [];
        });
      },
      async consume(id, ownerId) {
        const row = owned(id, ownerId);
        if (!row || row.state === 'dismissed') return { state: 'gone' };
        if (row.state !== 'pending') return { state: 'used' };
        if (expired(row)) return { state: 'expired' };
        row.state = 'running';
        return { state: 'ok', action: row.action, args: row.args };
      },
      async finish(id, ownerId, state, note) {
        const row = owned(id, ownerId);
        if (row?.state === 'running') Object.assign(row, { state, note });
      },
      async dismiss(id, ownerId) {
        const row = owned(id, ownerId);
        if (row?.state !== 'pending') return false;
        row.state = 'dismissed';
        return true;
      },
      async recent(ownerId, scope) {
        return scoped(ownerId, scope).slice(-10).reverse().map((row) => ({
          action: row.action, state: row.state === 'pending' && expired(row) ? 'expired' : row.state, note: row.note,
        }));
      },
    },
  };
}

proposalStoreContract(memoryFixture);

const owner = { id: 'first' };
const args = { invoiceId: 'invoice-1' };
const card = { title: 'Refund invoice', lines: [{ label: 'Invoice', value: 'invoice-1' }], confirmLabel: 'Refund invoice' };
function actionFixture() {
  const { store } = memoryFixture();
  const scope = 'chat-a';
  let allowed = true;
  const act = vi.fn(async (_idempotencyKey: string) => 'Refunded.');
  const check = () => { if (!allowed) throw new Refused('You cannot refund this invoice.'); };
  const action = defineAction<typeof owner>()({
    name: 'refund', description: 'Propose an invoice refund.', input: { invoiceId: z.string() },
    async prepare() { check(); return card; },
    async run(_args, _caller, options) { check(); return act(options.idempotencyKey); },
  });
  const actions = { refund: action };
  const tool = proposeTool(action, owner, { store, scope });
  const confirm = (id: string) => confirmProposal({ id, caller: owner, actions, store });
  return { store, scope, act, tool, actions, confirm, revoke: () => { allowed = false; } };
}

afterEach(() => vi.restoreAllMocks());

describe('proposal tools and confirmation', () => {
  test('propose only stores a card and racing clicks act once with the idempotency key', async () => {
    const f = actionFixture();
    expect(await f.tool.run(args)).toContain('It has not run.');
    expect(f.act).not.toHaveBeenCalled();
    const [open] = await f.store.pending(owner.id, f.scope);
    expect(open.card).toEqual(card);
    const results = await Promise.all([f.confirm(open.id), f.confirm(open.id)]);
    expect(results.map((result) => result.state).sort()).toEqual(['done', 'used']);
    expect(f.act).toHaveBeenCalledExactlyOnceWith(open.id);
    expect(JSON.parse(await statusTool(owner, f).run({}))).toEqual([{ action: 'refund', state: 'done', note: 'Refunded.' }]);
  });

  test('refusal at prepare stores nothing', async () => {
    const f = actionFixture();
    f.revoke();
    expect(await f.tool.run(args)).toBe('You cannot refund this invoice.');
    expect(await f.store.recent(owner.id, f.scope)).toEqual([]);
    expect(f.act).not.toHaveBeenCalled();
  });

  test('permission lost before the click gives a refusal without acting', async () => {
    const f = actionFixture();
    await f.tool.run(args);
    const [{ id }] = await f.store.pending(owner.id, f.scope);
    f.revoke();
    expect(await f.confirm(id)).toEqual({ state: 'refused', message: 'You cannot refund this invoice.' });
    expect(f.act).not.toHaveBeenCalled();
    expect(await f.store.recent(owner.id, f.scope)).toMatchObject([{ state: 'refused' }]);
  });

  test('confirmation reparses saved arguments before it can act', async () => {
    const f = actionFixture();
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const id = await f.store.propose({ ownerId: owner.id, scope: f.scope, action: 'refund', subject: 'invoice-1', args: { invoiceId: 7 }, card });
    expect(await f.confirm(id!)).toMatchObject({ state: 'failed' });
    expect(f.act).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledExactlyOnceWith('Proposal confirmation failed', { id });
    expect(await f.store.recent(owner.id, f.scope)).toMatchObject([{ state: 'failed' }]);
  });

  test('input that a second parse would change is refused before a card exists', async () => {
    const { store, scope } = actionFixture();
    const prepare = vi.fn(async () => card);
    const propose = (input: z.ZodRawShape, value: unknown) => proposeTool(
      defineAction<typeof owner>()({ name: 'refund', description: 'Propose a refund.', input, prepare, run: async () => 'Refunded.' }), owner, { store, scope },
    ).run(z.object(input).parse(value));
    const cents = { dollars: z.number().transform((dollars) => dollars * 100) };
    await expect(propose(cents, { dollars: 5 })).rejects.toThrow('must parse to itself');
    await expect(propose({ dollars: z.string().transform(Number) }, { dollars: '5' })).rejects.toThrow('must parse to itself');
    expect(prepare).not.toHaveBeenCalled();
    expect(await propose({ note: z.string().trim(), copies: z.number().default(1), on: z.coerce.date() }, { note: ' hello ', on: '2026-01-01' })).toContain('It has not run.');
  });

  test('a clicked action with no recorded outcome cannot be proposed again', async () => {
    const f = actionFixture();
    await f.tool.run(args);
    const [{ id }] = await f.store.pending(owner.id, f.scope);
    await f.store.consume(id, owner.id);
    expect(await f.tool.run(args)).toContain('Nothing was proposed');
    expect(await f.store.pending(owner.id, f.scope)).toMatchObject([{ id, state: 'running' }]);
  });

  test('an unplanned action error records a fixed sentence and logs only the proposal id', async () => {
    const f = actionFixture();
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    f.act.mockRejectedValueOnce(new Error('private provider detail'));
    await f.tool.run(args);
    const [{ id }] = await f.store.pending(owner.id, f.scope);
    const message = 'The action could not be confirmed. Check before trying again.';
    expect(await f.confirm(id)).toEqual({ state: 'failed', message });
    expect(await f.store.recent(owner.id, f.scope)).toMatchObject([{ state: 'failed', note: message }]);
    expect(log).toHaveBeenCalledExactlyOnceWith('Proposal confirmation failed', { id });
  });
});

describe('card events', () => {
  test('a throwing run still ends with the cards, then throws for the route to report', async () => {
    const f = actionFixture();
    async function* run() {
      yield { type: 'text', text: 'Checking.' };
      await f.tool.run(args);
      throw new Error('run failed');
    }
    const events: unknown[] = [];
    await expect((async () => {
      for await (const event of withCards(run(), () => readCards(owner, f))) events.push(event);
    })()).rejects.toThrow('run failed');
    expect(events).toEqual([
      { type: 'text', text: 'Checking.' },
      { type: 'cards', cards: [{ state: 'pending', card, id: expect.any(String) }] },
    ]);
  });

  test('an empty run still clears the card list', async () => {
    async function* empty() {}
    expect(await withCards(empty(), async () => []).next()).toEqual({ done: false, value: { type: 'cards', cards: [] } });
  });

  test('ending the stream early closes the inner run', async () => {
    const closed = vi.fn();
    async function* run() { try { yield 'first'; yield 'second'; } finally { closed(); } }
    const cards = vi.fn(async () => []);
    for await (const event of withCards(run(), cards)) { expect(event).toBe('first'); break; }
    expect(closed).toHaveBeenCalledOnce();
    expect(cards).not.toHaveBeenCalled();
  });
});

const route = actionFixture();
vi.doMock('@/lib/caller', () => ({
  async getCaller(req: Request) {
    const id = req.headers.get('x-test-caller');
    return id ? { id } : null;
  },
}));
vi.doMock('@/lib/agent-actions', () => ({ ACTIONS: route.actions }));
vi.doMock('@/lib/proposal-store', () => ({ store: route.store }));
const { GET, POST, DELETE } = await import('@/app/api/agents/proposals/route');

function request(method: string, id: string, headers: Record<string, string>) {
  return new Request('https://app.example/api/agents/proposals', {
    method, headers: { 'content-type': 'application/json', 'x-test-caller': 'first', ...headers }, body: JSON.stringify({ id }),
  });
}

test('the confirm route rejects cross-site POST and accepts same-origin with Origin null', async () => {
  await route.tool.run(args);
  const [{ id }] = await route.store.pending(owner.id, route.scope);
  expect((await POST(request('POST', id, { 'sec-fetch-site': 'cross-site', origin: 'https://app.example' }))).status).toBe(403);
  expect(route.act).not.toHaveBeenCalled();
  expect((await POST(request('POST', id, { 'sec-fetch-site': 'same-origin', origin: 'null' }))).status).toBe(200);
  expect(route.act).toHaveBeenCalledExactlyOnceWith(id);
});

test('the route lists by scope and dismisses through an exact Origin fallback', async () => {
  await route.tool.run(args);
  const url = 'https://app.example/api/agents/proposals?scope=chat-a';
  expect((await GET(new Request(url))).status).toBe(401);
  const listed = await GET(new Request(url, { headers: { 'x-test-caller': 'first' } }));
  expect(listed.headers.get('cache-control')).toBe('private, no-store');
  const { cards: [{ id }] } = await listed.json();
  expect((await DELETE(request('DELETE', id, { origin: 'http://app.example' }))).status).toBe(403);
  expect((await DELETE(request('DELETE', id, { origin: 'https://app.example' }))).status).toBe(200);
  expect((await POST(request('POST', id, { 'sec-fetch-site': 'same-origin' }))).status).toBe(404);
});

test('confirming a foreign proposal is indistinguishable from confirming an unknown one', async () => {
  await route.tool.run(args);
  const [{ id }] = await route.store.pending(owner.id, route.scope);
  const headers = { 'sec-fetch-site': 'same-origin', 'x-test-caller': 'second' };
  const foreign = await POST(request('POST', id, headers));
  const unknown = await POST(request('POST', randomUUID(), headers));
  expect(foreign.status).toBe(404);
  expect(foreign.status).toBe(unknown.status);
  expect(await foreign.text()).toBe(await unknown.text());
  expect(await route.store.pending(owner.id, route.scope)).toMatchObject([{ id, state: 'pending' }]);
});

test('the route caps bytes without relying on Content-Length and rejects extra fields', async () => {
  const send = (body: string) => POST(new Request('https://app.example/api/agents/proposals', {
    method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', 'x-test-caller': 'first' }, body,
  }));
  expect((await send(JSON.stringify({ id: 'é'.repeat(600) }))).status).toBe(413);
  expect((await send(JSON.stringify({ id: randomUUID(), ownerId: 'second' }))).status).toBe(400);
});
