-- ============================================
-- COMPLETE SETUP: Admin Settings + Error Monitoring
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- 1. CREATE admin_settings table (for runtime config)
create table if not exists public.admin_settings (
  key text primary key,
  value text not null,
  is_secret boolean default false,
  updated_at timestamptz default now()
);

comment on table public.admin_settings is 'Runtime configuration storage - no redeploy needed for changes';

-- Insert default values
insert into public.admin_settings (key, value, is_secret) values
  ('ALLOW_ADMIN_OPS', 'false', false),
  ('ALLOW_UNSAFE_TERMINAL', 'false', false),
  ('ADMIN_OPS_TOKEN', '', true)
on conflict (key) do nothing;

-- 2. CREATE error_logs table (for AI auto-fix system)
create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  error_type text not null, -- 'api_error', '404_page', 'runtime_error', 'build_error'
  url text,
  method text,
  status_code int,
  error_message text,
  error_stack text,
  user_agent text,
  ip_address text,
  user_id uuid references public.users(id),
  request_body jsonb,
  response_body jsonb,
  headers jsonb,
  context jsonb, -- additional context (component name, file path, etc.)
  ai_analysis jsonb, -- AI-generated analysis and fix suggestions
  fix_status text default 'pending', -- 'pending', 'analyzing', 'fix_suggested', 'fix_applied', 'ignored'
  fix_applied_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_error_logs_type on public.error_logs(error_type);
create index if not exists idx_error_logs_status on public.error_logs(fix_status);
create index if not exists idx_error_logs_created on public.error_logs(created_at desc);

comment on table public.error_logs is 'Centralized error logging for AI-powered auto-fix system';

-- 3. CREATE admin_actions table if not exists (for audit logging)
create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  action text not null,
  payload jsonb,
  result jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_admin_actions_user on public.admin_actions(user_id);
create index if not exists idx_admin_actions_created on public.admin_actions(created_at desc);

comment on table public.admin_actions is 'Audit log for all admin operations';

-- 4. Cleanup function for old errors (30 day retention)
create or replace function public.cleanup_old_errors()
returns void as $$
begin
  delete from public.error_logs where created_at < now() - interval '30 days';
end;
$$ language plpgsql;

-- 5. Enable RLS (Row Level Security) - optional but recommended
alter table public.admin_settings enable row level security;
alter table public.error_logs enable row level security;
alter table public.admin_actions enable row level security;

-- 6. Create policies (super_admin only access)
-- Note: Adjust based on your auth setup

-- Drop existing policies first (safe to run multiple times)
drop policy if exists "Super admin can read settings" on public.admin_settings;
drop policy if exists "Super admin can update settings" on public.admin_settings;
drop policy if exists "Super admin can read errors" on public.error_logs;
drop policy if exists "Anyone can insert errors" on public.error_logs;
drop policy if exists "Super admin can update errors" on public.error_logs;
drop policy if exists "Super admin can read actions" on public.admin_actions;
drop policy if exists "Super admin can insert actions" on public.admin_actions;

-- admin_settings policies
create policy "Super admin can read settings"
  on public.admin_settings for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'super_admin'
    )
  );

create policy "Super admin can update settings"
  on public.admin_settings for all
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'super_admin'
    )
  );

-- error_logs policies
create policy "Super admin can read errors"
  on public.error_logs for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'super_admin'
    )
  );

create policy "Anyone can insert errors"
  on public.error_logs for insert
  with check (true);

create policy "Super admin can update errors"
  on public.error_logs for update
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'super_admin'
    )
  );

-- admin_actions policies
create policy "Super admin can read actions"
  on public.admin_actions for select
  using (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'super_admin'
    )
  );

create policy "Super admin can insert actions"
  on public.admin_actions for insert
  with check (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'super_admin'
    )
  );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables created
select 
  'admin_settings' as table_name, 
  count(*) as row_count 
from public.admin_settings
union all
select 
  'error_logs', 
  count(*) 
from public.error_logs
union all
select 
  'admin_actions', 
  count(*) 
from public.admin_actions;

-- Show admin_settings default values
select * from public.admin_settings order by key;

-- ============================================
-- DONE! Tables created and ready to use.
-- ============================================
