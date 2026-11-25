create table if not exists public.agent_proposals (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  owner_id text not null,
  scope text not null,
  action text not null,
  subject text not null,
  args jsonb not null,
  card jsonb not null,
  state text not null default 'pending' check (state in ('pending', 'running', 'done', 'refused', 'failed', 'dismissed')),
  note text,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create unique index if not exists agent_proposals_pending_subject
  on public.agent_proposals (owner_id, scope, action, subject) where state = 'pending';
create index if not exists agent_proposals_recent
  on public.agent_proposals (owner_id, scope, created_at desc);

alter table public.agent_proposals enable row level security;

create or replace function public.agent_proposal_propose(
  p_owner_id text, p_scope text, p_action text, p_subject text, p_args jsonb, p_card jsonb, p_ttl_seconds integer
) returns table (id uuid) language sql security invoker set search_path = '' as $$
  insert into public.agent_proposals as proposal (owner_id, scope, action, subject, args, card, expires_at)
  values (p_owner_id, p_scope, p_action, p_subject, p_args, p_card,
          pg_catalog.clock_timestamp() + pg_catalog.make_interval(secs => p_ttl_seconds))
  on conflict (owner_id, scope, action, subject) where state = 'pending' do update set
    -- The id is what a click approves, so it lives only while the arguments and the card stay what was shown.
    id = case when proposal.args = excluded.args and proposal.card = excluded.card
      then proposal.id else pg_catalog.gen_random_uuid() end,
    created_at = case when proposal.args = excluded.args and proposal.card = excluded.card
      then proposal.created_at else pg_catalog.clock_timestamp() end,
    args = excluded.args,
    card = excluded.card,
    expires_at = pg_catalog.clock_timestamp() + pg_catalog.make_interval(secs => p_ttl_seconds)
  returning proposal.id;
$$;

create or replace function public.agent_proposal_consume(p_id uuid, p_owner_id text)
returns table (state text, action text, args jsonb) language plpgsql security invoker set search_path = '' as $$
begin
  return query
    update public.agent_proposals as proposal
    set state = 'running', consumed_at = pg_catalog.clock_timestamp()
    where proposal.id = p_id and proposal.owner_id = p_owner_id and proposal.state = 'pending'
      and proposal.expires_at > pg_catalog.clock_timestamp()
    returning 'ok'::text, proposal.action, proposal.args;
  if found then return; end if;

  return query select coalesce((
    select case proposal.state when 'dismissed' then 'gone' when 'pending' then 'expired' else 'used' end
    from public.agent_proposals as proposal where proposal.id = p_id and proposal.owner_id = p_owner_id
  ), 'gone'), null::text, null::jsonb;
end;
$$;

create or replace function public.agent_proposal_finish(p_id uuid, p_owner_id text, p_state text, p_note text)
returns void language sql security invoker set search_path = '' as $$
  update public.agent_proposals set state = p_state, note = p_note
  where id = p_id and owner_id = p_owner_id and state = 'running' and p_state in ('done', 'refused', 'failed');
$$;

create or replace function public.agent_proposal_dismiss(p_id uuid, p_owner_id text)
returns table (dismissed boolean) language sql security invoker set search_path = '' as $$
  with dismissed as (
    update public.agent_proposals set state = 'dismissed'
    where id = p_id and owner_id = p_owner_id and state = 'pending'
    returning id
  )
  select exists (select 1 from dismissed);
$$;

create or replace function public.agent_proposal_pending(p_owner_id text, p_scope text)
returns table (id uuid, card jsonb, state text) language sql security invoker set search_path = '' as $$
  select id, card, state from public.agent_proposals
  where owner_id = p_owner_id and scope = p_scope
    and (state = 'running' or (state = 'pending' and expires_at > pg_catalog.statement_timestamp()))
  order by created_at, id;
$$;

create or replace function public.agent_proposal_recent(p_owner_id text, p_scope text)
returns table (action text, state text, note text) language sql security invoker set search_path = '' as $$
  select action, case when state = 'pending' and expires_at <= pg_catalog.statement_timestamp() then 'expired' else state end, note
  from public.agent_proposals where owner_id = p_owner_id and scope = p_scope
  order by created_at desc, id desc limit 10;
$$;

revoke all on table public.agent_proposals from public;

do $$
declare
  functions constant text := 'public.agent_proposal_propose(text,text,text,text,jsonb,jsonb,integer), '
    'public.agent_proposal_consume(uuid,text), public.agent_proposal_finish(uuid,text,text,text), '
    'public.agent_proposal_dismiss(uuid,text), public.agent_proposal_pending(text,text), public.agent_proposal_recent(text,text)';
  browser_role text;
begin
  execute 'revoke all on function ' || functions || ' from public';
  for browser_role in select rolname from pg_catalog.pg_roles where rolname in ('anon', 'authenticated') loop
    execute pg_catalog.format('revoke all on table public.agent_proposals from %I', browser_role);
    execute pg_catalog.format('revoke all on function %s from %I', functions, browser_role);
  end loop;
  if exists (select 1 from pg_catalog.pg_roles where rolname = 'service_role') then
    grant select, insert, update on public.agent_proposals to service_role;
    execute 'grant execute on function ' || functions || ' to service_role';
  end if;
end;
$$;
