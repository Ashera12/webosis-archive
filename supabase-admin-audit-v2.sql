-- Add status column to admin_actions for suggestion/approval workflow
alter table public.admin_actions
  add column if not exists status text default 'done';

-- Add an index on status for quick queries
create index if not exists admin_actions_status_idx on public.admin_actions(status);

do $$ begin raise notice '✅ admin_actions v2 applied'; end $$;
