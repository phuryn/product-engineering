import 'server-only';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';

type Caller = { id: string };
type Input<S extends z.ZodRawShape> = z.infer<z.ZodObject<S>>;
export type ToolSpec<S extends z.ZodRawShape = any> = {
  name: string;
  description: string;
  input: S;
  run(input: Input<S>): Promise<string>;
};

// Use only messages safe to show the person and the model.
export class Refused extends Error {}
export type Card = { title: string; lines: { label: string; value: string }[]; confirmLabel: string };
export type Action<C extends Caller, S extends z.ZodRawShape = any> = {
  name: string;
  description: string;
  input: S;
  subject?(args: Input<S>): string;
  prepare(args: Input<S>, caller: C): Promise<Card>;
  run(args: Input<S>, caller: C, options: { idempotencyKey: string }): Promise<string>;
};
export const defineAction = <C extends Caller>() => <S extends z.ZodRawShape>(action: Action<C, S>) => action;

type Outcome = 'done' | 'refused' | 'failed';
type Unavailable = 'used' | 'expired' | 'gone';
type NewProposal = { ownerId: string; scope: string; action: string; subject: string; args: unknown; card: Card };
type OpenProposal = { id: string; card: Card; state: 'pending' | 'running' };
type Recent = { action: string; state: 'pending' | 'running' | 'dismissed' | 'expired' | Outcome; note: string | null };
type Consumed = { state: 'ok'; action: string; args: unknown } | { state: Unavailable };
export type PublicCard = { id: string; card: Card; state: 'pending' } | { id: string; card: Omit<Card, 'confirmLabel'>; state: 'running'; message: string };

export const PROPOSAL_TTL_SECONDS = 10 * 60;
const CHECK_FIRST = 'Check before trying again.';

export interface ProposalStore {
  // The proposal's id, or null while a clicked one for the same subject has no recorded outcome.
  propose(proposal: NewProposal): Promise<string | null>;
  // Open confirm cards: live pending rows and running rows awaiting an outcome.
  pending(ownerId: string, scope: string): Promise<OpenProposal[]>;
  consume(id: string, ownerId: string): Promise<Consumed>;
  finish(id: string, ownerId: string, state: Outcome, note: string): Promise<void>;
  dismiss(id: string, ownerId: string): Promise<boolean>;
  recent(ownerId: string, scope: string): Promise<Recent[]>;
}

type ProposalContext = { store: ProposalStore; scope: string };

export function proposeTool<C extends Caller, S extends z.ZodRawShape>(action: Action<C, S>, caller: C, { store, scope }: ProposalContext): ToolSpec<S> {
  return {
    name: `propose_${action.name}`,
    description: action.description,
    input: action.input,
    async run(args) {
      // The click parses the saved arguments again. Input that parsing would change twice would run something the card never showed.
      const again = z.strictObject(action.input).safeParse(JSON.parse(JSON.stringify(args)));
      if (!again.success || !isDeepStrictEqual(again.data, args)) throw new Error(`The input of ${action.name} must parse to itself: move the transform into prepare and run.`);
      try {
        const card = await action.prepare(args, caller);
        // Hash stable JSON so object key order alone cannot change the default subject.
        const subject = action.subject?.(args) ?? createHash('sha256').update(JSON.stringify(args, (_, value) =>
          value && typeof value === 'object' && !Array.isArray(value)
            ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))
            : value,
        )).digest('hex');
        const id = await store.propose({ ownerId: caller.id, scope, action: action.name, subject, args, card });
        if (!id) return `Nothing was proposed: the person already clicked this, and its outcome is not recorded. ${CHECK_FIRST}`;
        return `The action is proposed. It has not run. The app shows the person a confirm card with the button "${card.confirmLabel}".`;
      } catch (error) {
        if (error instanceof Refused) return error.message;
        throw error;
      }
    },
  };
}

export function statusTool(caller: Caller, { store, scope }: ProposalContext): ToolSpec<{}> {
  return {
    name: 'proposal_status', description: 'Read what happened to recent proposals in this chat.', input: {},
    async run() {
      const recent = await store.recent(caller.id, scope);
      return JSON.stringify(recent.map(({ action, state, note }) => ({ action, state, note: state === 'running' ? CHECK_FIRST : note })));
    },
  };
}

const unavailable: Record<Unavailable, string> = {
  used: 'This proposal has already been used.',
  expired: 'This proposal has expired.',
  gone: 'This proposal is unavailable.',
};
type Confirmation = { state: Outcome | Unavailable; message: string };

export async function confirmProposal<C extends Caller>({ id, caller, actions, store }: {
  id: string; caller: C; actions: Record<string, Action<C>>; store: ProposalStore;
}): Promise<Confirmation> {
  const failed = (): { state: 'failed'; message: string } => {
    console.error('Proposal confirmation failed', { id });
    return { state: 'failed', message: `The action could not be confirmed. ${CHECK_FIRST}` };
  };
  try {
    const proposal = await store.consume(id, caller.id);
    if (proposal.state !== 'ok') return { state: proposal.state, message: unavailable[proposal.state] };
    let result: { state: Outcome; message: string };
    try {
      if (!Object.hasOwn(actions, proposal.action)) throw new Error('Missing action');
      const action = actions[proposal.action];
      const args = z.strictObject(action.input).parse(proposal.args);
      result = { state: 'done', message: await action.run(args, caller, { idempotencyKey: id }) };
    } catch (error) {
      result = error instanceof Refused ? { state: 'refused', message: error.message } : failed();
    }
    await store.finish(id, caller.id, result.state, result.message);
    return result;
  } catch {
    return failed();
  }
}

export async function readCards(caller: Caller, { store, scope }: ProposalContext): Promise<PublicCard[]> {
  const open = await store.pending(caller.id, scope);
  return open.map(({ id, card: { title, lines, confirmLabel }, state }) => state === 'pending'
    ? { id, card: { title, lines, confirmLabel }, state }
    : { id, card: { title, lines }, state, message: CHECK_FIRST });
}

export async function* withCards<E>(events: AsyncIterable<E>, cards: () => Promise<PublicCard[]>) {
  let failure: { error: unknown } | undefined;
  try {
    yield* events;
  } catch (error) {
    failure = { error };
  }
  // Also after a failed run: one of its tools may have stored a proposal.
  yield { type: 'cards', cards: await cards() } as const;
  if (failure) throw failure.error;
}

export function sqlStore(rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown>): ProposalStore {
  const rows = async <T>(fn: string, args: Record<string, unknown>) => await rpc(`agent_proposal_${fn}`, args) as T[];
  const ownerScope = (ownerId: string, scope: string) => ({ p_owner_id: ownerId, p_scope: scope });
  const ownedId = (id: string, ownerId: string) => ({ p_id: id, p_owner_id: ownerId });
  return {
    async propose({ ownerId, scope, action, subject, args, card }) {
      const [row] = await rows<{ id: string } | undefined>('propose', {
        ...ownerScope(ownerId, scope), p_action: action, p_subject: subject, p_args: args, p_card: card,
        p_ttl_seconds: PROPOSAL_TTL_SECONDS,
      });
      return row?.id ?? null;
    },
    pending: (ownerId, scope) => rows<OpenProposal>('pending', ownerScope(ownerId, scope)),
    async consume(id, ownerId) {
      const [row] = await rows<Consumed>('consume', ownedId(id, ownerId));
      return row.state === 'ok' ? row : { state: row.state };
    },
    async finish(id, ownerId, state, note) {
      await rpc('agent_proposal_finish', { ...ownedId(id, ownerId), p_state: state, p_note: note });
    },
    async dismiss(id, ownerId) {
      const [row] = await rows<{ dismissed: boolean }>('dismiss', ownedId(id, ownerId));
      return row.dismissed;
    },
    recent: (ownerId, scope) => rows<Recent>('recent', ownerScope(ownerId, scope)),
  };
}
