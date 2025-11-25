-- Add scheduled_at to admin_actions to support delayed auto-execution
alter table public.admin_actions
  add column if not exists scheduled_at timestamptz;

do $$ begin raise notice '✅ admin_actions v3 (scheduled_at) applied'; end $$;
