-- =============================
-- Admin Actions Audit Table
-- Records admin operations performed via admin endpoints
-- Run this after your main schema migrations
-- =============================

create table if not exists public.admin_actions (
  id bigserial primary key,
  user_id uuid,
  action text not null,
  payload jsonb,
  result jsonb,
  created_at timestamptz default now()
);

create index if not exists admin_actions_user_idx on public.admin_actions(user_id);

-- Success notice
do $$
begin
  raise notice '✅ admin_actions audit table ensured';
end $$;
