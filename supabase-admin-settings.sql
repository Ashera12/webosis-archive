-- Admin settings key-value store (for server-side use only)
create table if not exists public.admin_settings (
  key text primary key,
  value text not null,
  is_secret boolean default false,
  updated_at timestamptz default now()
);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_admin_settings_touch on public.admin_settings;
create trigger trg_admin_settings_touch
before update on public.admin_settings
for each row execute procedure public.touch_updated_at();
