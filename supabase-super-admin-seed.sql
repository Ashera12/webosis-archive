-- =============================
-- Super Admin Seed
-- Run this AFTER running supabase-fix-schema.sql and supabase-seed-data.sql
-- This creates or updates a super_admin user. It uses pgcrypto. Ensure the
-- `pgcrypto` extension is enabled in your Supabase project (the main schema
-- already recommends it).
--
-- Default credentials (change after first login):
--   email: admin@example.com
--   password: ChangeMe123!
-- =============================

-- Create super admin user if not exists; if exists, upgrade role and flags.
insert into public.users (id, email, name, password_hash, role, approved, email_verified, created_at)
values (
  gen_random_uuid(),
  'admin@example.com',
  crypt('ChangeMe123!', gen_salt('bf')),
  'super_admin',
  true,
  true,
  now()
)
on conflict (email) do update
set
  role = 'super_admin',
  approved = true,
  email_verified = true,
  password_hash = excluded.password_hash,
  updated_at = now();

do $$
begin
  raise notice '✅ Super admin user ensured: admin@example.com (password: ChangeMe123!). Please change the password after first login.';
end $$;

-- Notes:
-- - After running this, sign in via the admin UI (or implement a local sign-in flow)
--   and immediately change the password or remove the seed.
-- - If you prefer to set your own email/password, edit the email and the plaintext
--   password above before running, or replace the crypt(...) expression with a
--   precomputed hash.
-- ========================================
-- SUPER ADMIN DEFAULT ACCOUNT
-- ========================================
-- Password: SuperAdmin123!
-- Email: admin@osis.sch.id
-- ========================================

-- Insert Super Admin account
-- Password hash for "SuperAdmin123!" using bcrypt
INSERT INTO public.users (
  email,
  password_hash,
  name,
  role,
  email_verified,
  approved
) VALUES (
  'admin@osis.sch.id',
  '$2b$10$Nw24lu9zm38dgOgToK8kweBASz6DRcxZOYvZ/IPlEUNfuDlaaJj9i', -- SuperAdmin123!
  'Super Administrator',
  'super_admin',
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  email_verified = true,
  approved = true;

-- ========================================
-- ADDITIONAL TEST ACCOUNTS (Optional)
-- ========================================

-- Admin Account
-- Password: Admin123!
INSERT INTO public.users (
  email,
  password_hash,
  name,
  role,
  email_verified,
  approved
) VALUES (
  'admin2@osis.sch.id',
  '$2b$10$nZyAi72B9gAfg3HZz1yVHu8tjXguZjU2xP2u1d00Speu5RJoSt6xu', -- Admin123!
  'Admin User',
  'admin',
  true,
  true
)
ON CONFLICT (email) DO NOTHING;

-- OSIS Account
-- Password: Osis123!
INSERT INTO public.users (
  email,
  password_hash,
  name,
  role,
  email_verified,
  approved
) VALUES (
  'osis@osis.sch.id',
  '$2b$10$3jEdk2TP8qNo524rqaV5FuqCtn8MeSpjNx/nN3rgl9j76Xn.P9p9G', -- Osis123!
  'OSIS Member',
  'osis',
  true,
  true
)
ON CONFLICT (email) DO NOTHING;

-- Moderator Account
-- Password: Moderator123!
INSERT INTO public.users (
  email,
  password_hash,
  name,
  role,
  email_verified,
  approved
) VALUES (
  'moderator@osis.sch.id',
  '$2b$10$0YAR.9aSXQ7gfWnSsnjJgejOHE576b8kVD.IxE/wzM3nRXGF/voZ6', -- Moderator123!
  'Moderator User',
  'moderator',
  true,
  true
)
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- VERIFICATION
-- ========================================

-- Check created users
SELECT 
  id,
  email,
  name,
  role,
  email_verified,
  approved,
  created_at
FROM public.users
WHERE email IN (
  'admin@osis.sch.id',
  'admin2@osis.sch.id',
  'osis@osis.sch.id',
  'moderator@osis.sch.id'
)
ORDER BY role DESC;
