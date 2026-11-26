import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { beforeEach, describe, expect, test } from 'vitest';
import { readCards, type ProposalStore } from '@/lib/proposals';

export type StoreFixture = { store: ProposalStore; expire(id: string): Promise<void> };

const draft = {
  ownerId: 'first', scope: 'chat-a', action: 'refund', subject: 'invoice-1',
  args: { invoiceId: 'invoice-1', amount: 4 } as Record<string, unknown>,
  card: { title: 'Refund invoice', lines: [{ label: 'Amount', value: '$4' }], confirmLabel: 'Refund $4' },
};

export function proposalStoreContract(fixture: () => StoreFixture | Promise<StoreFixture>) {
  describe('proposal store contract', () => {
    let store: ProposalStore;
    let expire: StoreFixture['expire'];
    beforeEach(async () => { ({ store, expire } = await fixture()); });
    const propose = async (proposal: typeof draft) => {
      const id = await store.propose(proposal);
      if (!id) throw new Error('Nothing was proposed');
      return id;
    };

    test('the same proposal refreshes its id; changed args or a changed card retire it', async () => {
      const original = await propose(draft);
      await expire(original);
      expect(await store.pending('first', 'chat-a')).toEqual([]);
      expect(await propose({ ...draft, args: { amount: 4, invoiceId: 'invoice-1' } })).toBe(original);
      expect(await store.pending('first', 'chat-a')).toMatchObject([{ id: original, state: 'pending' }]);
      const changed = await propose({ ...draft, args: { ...draft.args, amount: 5 } });
      expect(changed).not.toBe(original);
      expect(await store.consume(original, 'first')).toEqual({ state: 'gone' });
      expect(await store.pending('first', 'chat-a')).toMatchObject([{ id: changed }]);
      const card = { ...draft.card, lines: [{ label: 'Amount', value: '$5' }] };
      const shown = await propose({ ...draft, args: { ...draft.args, amount: 5 }, card });
      expect(await store.consume(changed, 'first')).toEqual({ state: 'gone' });
      expect(await store.pending('first', 'chat-a')).toEqual([{ id: shown, card, state: 'pending' }]);
    });

    test('owner, action and subject keep their own slots, and a new chat takes the card', async () => {
      const a = await propose(draft);
      const b = await propose({ ...draft, scope: 'chat-b', subject: 'invoice-3' });
      const c = await propose({ ...draft, ownerId: 'second' });
      const d = await propose({ ...draft, action: 'other' });
      const e = await propose({ ...draft, subject: 'invoice-2' });
      expect(new Set([a, b, c, d, e]).size).toBe(5);
      expect((await store.pending('first', 'chat-a')).map(({ id }) => id).sort()).toEqual([a, d, e].sort());
      expect(await store.pending('first', 'chat-b')).toMatchObject([{ id: b }]);
      expect(await store.pending('second', 'chat-a')).toMatchObject([{ id: c }]);
      expect(await store.recent('third', 'chat-a')).toEqual([]);
      const moved = await propose({ ...draft, scope: 'chat-b' });
      expect(await store.consume(a, 'first')).toEqual({ state: 'gone' });
      expect((await store.pending('first', 'chat-a')).map(({ id }) => id).sort()).toEqual([d, e].sort());
      expect((await store.pending('first', 'chat-b')).map(({ id }) => id).sort()).toEqual([moved, b].sort());
    });

    test('the same click can claim a row only once, including during a race', async () => {
      const id = await propose(draft);
      const results = await Promise.all([store.consume(id, 'first'), store.consume(id, 'first')]);
      expect(results).toEqual(expect.arrayContaining([
        { state: 'ok', action: draft.action, args: draft.args }, { state: 'used' },
      ]));
      expect(await store.consume(id, 'first')).toEqual({ state: 'used' });
      await expect(store.dismiss(id, 'first')).resolves.toBe(false);
      expect(await readCards({ id: 'first' }, { store, scope: 'chat-a' })).toEqual([{
        id, state: 'running', message: 'Check before trying again.', card: { title: draft.card.title, lines: draft.card.lines },
      }]);
      await store.finish(id, 'second', 'done', 'wrong owner');
      expect(await store.recent('first', 'chat-a')).toMatchObject([{ state: 'running', note: null }]);
      // Until somebody records the outcome, a second button could run the same act twice.
      expect(await store.propose(draft)).toBeNull();
      expect(await store.propose({ ...draft, scope: 'chat-b' })).toBeNull();
      expect(await store.propose({ ...draft, args: { ...draft.args, amount: 5 } })).toBeNull();
      expect(await store.pending('first', 'chat-a')).toMatchObject([{ id, state: 'running' }]);
      await store.finish(id, 'first', 'done', 'Refunded.');
      await store.finish(id, 'first', 'failed', 'wrong state');
      expect(await store.recent('first', 'chat-a')).toMatchObject([{ state: 'done', note: 'Refunded.' }]);
      expect(await store.pending('first', 'chat-a')).toEqual([]);
      expect(await propose(draft)).not.toBe(id);
    });

    test('another owner and an unknown id are indistinguishable', async () => {
      const id = await propose(draft);
      expect(await store.consume(id, 'second')).toEqual(await store.consume(randomUUID(), 'second'));
      expect(await store.consume(id, 'second')).toEqual({ state: 'gone' });
      expect(await store.dismiss(id, 'second')).toBe(false);
      expect(await store.consume(id, 'first')).toMatchObject({ state: 'ok' });
    });

    test('expired and dismissed proposals cannot be used and do not block a new card', async () => {
      const expired = await propose(draft);
      await expire(expired);
      expect(await store.consume(expired, 'first')).toEqual({ state: 'expired' });
      expect(await store.recent('first', 'chat-a')).toMatchObject([{ state: 'expired' }]);
      const dismissed = await propose({ ...draft, args: { ...draft.args, amount: 5 } });
      expect(dismissed).not.toBe(expired);
      expect(await store.dismiss(dismissed, 'first')).toBe(true);
      expect(await store.consume(dismissed, 'first')).toEqual({ state: 'gone' });
      expect(await store.pending('first', 'chat-a')).toEqual([]);
      expect(await propose(draft)).not.toBe(dismissed);
    });

    test('recent returns only the last ten in its owner and scope', async () => {
      for (let i = 0; i < 11; i++) {
        // Give PGlite distinct creation times rather than asserting an order for timestamp ties.
        await setTimeout(2);
        await propose({ ...draft, subject: `${i}`, action: `action_${i}` });
      }
      await propose({ ...draft, scope: 'chat-b' });
      expect((await store.recent('first', 'chat-a')).map(({ action }) => action)).toEqual(
        Array.from({ length: 10 }, (_, i) => `action_${10 - i}`),
      );
    });
  });
}
