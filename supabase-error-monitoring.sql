-- Error monitoring table for AI-powered auto-fix system
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

-- Function to auto-cleanup old errors (keep only last 30 days)
create or replace function public.cleanup_old_errors()
returns void as $$
begin
  delete from public.error_logs where created_at < now() - interval '30 days';
end;
$$ language plpgsql;

comment on table public.error_logs is 'Centralized error logging for AI-powered auto-fix system';
