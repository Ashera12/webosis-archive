-- ============================================
-- FIX: Admin Settings RLS Policies
-- Problem: Service role blocked by RLS
-- Solution: DISABLE RLS for admin tables
-- (Auth already handled at API level)
-- ============================================

-- Drop all existing policies first
drop policy if exists "Super admin can read settings" on public.admin_settings;
drop policy if exists "Super admin can update settings" on public.admin_settings;
drop policy if exists "Service role full access" on public.admin_settings;
drop policy if exists "Super admin can read errors" on public.error_logs;
drop policy if exists "Anyone can insert errors" on public.error_logs;
drop policy if exists "Super admin can update errors" on public.error_logs;
drop policy if exists "Service role full access errors" on public.error_logs;
drop policy if exists "Super admin can read actions" on public.admin_actions;
drop policy if exists "Super admin can insert actions" on public.admin_actions;
drop policy if exists "Service role full access actions" on public.admin_actions;

-- DISABLE RLS completely for these admin tables
-- Security is already enforced at API route level (requireSuperAdmin)
alter table public.admin_settings disable row level security;
alter table public.error_logs disable row level security;
alter table public.admin_actions disable row level security;

-- ============================================
-- DONE! RLS disabled, tables fully accessible
-- ============================================
