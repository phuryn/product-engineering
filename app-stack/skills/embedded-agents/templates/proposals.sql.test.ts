import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { sqlStore } from '@/lib/proposals';
import { proposalStoreContract } from './proposals.contract';

vi.mock('server-only', () => ({}));

// Point this at the migration copied from proposals.sql in the product.
const migration = readFileSync('db/migrations/agent-proposals.sql', 'utf8');
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(migration);
});
afterAll(async () => { await db?.close(); });

proposalStoreContract(async () => {
  await db.exec('truncate public.agent_proposals');
  return {
    store: sqlStore(async (fn, args) => {
      // Names come from sqlStore, and values are always bound as parameters.
      const parameters = Object.keys(args).map((key, i) => `${key} => $${i + 1}`).join(', ');
      return (await db.query(`select * from public.${fn}(${parameters})`, Object.values(args))).rows;
    }),
    async expire(id) {
      await db.query("update public.agent_proposals set expires_at = now() - interval '1 second' where id = $1", [id]);
    },
  };
});

test('the migration denies browser roles table reads and function execution', async () => {
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls');
  // Exercise installations with and without the Supabase roles.
  await db.exec(migration);
  const { rows } = await db.query(`
    select relrowsecurity, (select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'agent_proposals') as policies
    from pg_class where oid = 'public.agent_proposals'::regclass
  `);
  expect(rows).toEqual([{ relrowsecurity: true, policies: 0 }]);
  for (const role of ['anon', 'authenticated', 'service_role']) {
    await db.exec(`set role ${role}`);
    try {
      const read = () => db.query('select * from public.agent_proposals');
      const rpc = () => db.query("select * from public.agent_proposal_pending('first', 'chat-a')");
      if (role === 'service_role') {
        await expect(read()).resolves.toBeDefined();
        await expect(rpc()).resolves.toBeDefined();
      } else {
        await expect(read()).rejects.toMatchObject({ code: '42501' });
        await expect(rpc()).rejects.toMatchObject({ code: '42501' });
      }
    } finally {
      await db.exec('reset role');
    }
  }
});
