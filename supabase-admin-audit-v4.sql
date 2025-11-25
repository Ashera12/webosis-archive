-- Add reviewed_by and reviewed_at columns to admin_actions
alter table public.admin_actions
  add column if not exists reviewed_by uuid,
  add column if not exists reviewed_at timestamptz;

create index if not exists admin_actions_reviewed_at_idx on public.admin_actions(reviewed_at);
create index if not exists admin_actions_reviewed_by_idx on public.admin_actions(reviewed_by);

do $$ begin raise notice '✅ admin_actions v4 (reviewed_by/reviewed_at) applied'; end $$;
