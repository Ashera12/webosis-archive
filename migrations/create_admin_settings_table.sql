-- Idempotent creation of admin_settings table to fix ENOENT errors when API expects this migration file.
-- Safe to run multiple times.

create table if not exists public.admin_settings (
  id bigserial primary key,
  key text not null unique,
  value text,
  is_secret boolean default false,
  description text,
  updated_at timestamptz default now()
);

-- Optional trigger function to touch updated_at if not already defined
create or replace function public.touch_updated_at_admin_settings()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;$$ language plpgsql;

drop trigger if exists trg_admin_settings_touch on public.admin_settings;
create trigger trg_admin_settings_touch
before update on public.admin_settings
for each row execute function public.touch_updated_at_admin_settings();

-- Ensure RLS enabled and basic policies (adjust if your environment already manages these elsewhere)
alter table public.admin_settings enable row level security;

-- Grant read to authenticated users and write only to service role (adjust as needed)
-- Drop existing policies if any to avoid duplicates
drop policy if exists "Admin settings read" on public.admin_settings;
drop policy if exists "Admin settings write" on public.admin_settings;

create policy "Admin settings read" on public.admin_settings for select using ( true );
create policy "Admin settings write" on public.admin_settings for all using ( auth.role() = 'service_role' );

-- Insert defaults if table empty (non-secret runtime flags). Use ON CONFLICT to avoid duplication.
insert into public.admin_settings (key, value, is_secret, description) values
  ('ALLOW_ADMIN_OPS','true', false, 'Enable admin operations via UI'),
  ('ALLOW_UNSAFE_TERMINAL','false', false, 'Allow potentially unsafe terminal commands'),
  ('AUTO_EXECUTE_MODE','off', false, 'Auto execution mode: off|safe|full'),
  ('AUTO_EXECUTE_DELAY_MINUTES','5', false, 'Delay before auto execution tasks run'),
  ('ADMIN_OPS_TOKEN','change-me', true, 'Token required for privileged operations')
on conflict (key) do nothing;

-- Verification notice
-- SELECT * FROM public.admin_settings ORDER BY key;