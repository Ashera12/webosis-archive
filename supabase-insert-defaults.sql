-- ============================================
-- INSERT DEFAULT VALUES for admin_settings
-- Run this to populate initial values
-- ============================================

-- First, let's see what exists
select key, value, is_secret from public.admin_settings order by key;

-- Update ALL existing rows to have proper is_secret values
update public.admin_settings set is_secret = true where key in (
  'ADMIN_OPS_TOKEN',
  'OPENAI_API_KEY', 
  'ANTHROPIC_API_KEY',
  'GEMINI_API_KEY',
  'DATABASE_URL',
  'OPS_WEBHOOK_URL'
);

update public.admin_settings set is_secret = false where key in (
  'ALLOW_ADMIN_OPS',
  'ALLOW_UNSAFE_TERMINAL',
  'AUTO_EXECUTE_MODE',
  'AUTO_EXECUTE_DELAY_MINUTES'
);

-- Insert any missing keys with proper defaults
insert into public.admin_settings (key, value, is_secret) values
  ('ALLOW_ADMIN_OPS', 'false', false),
  ('ALLOW_UNSAFE_TERMINAL', 'false', false),
  ('ADMIN_OPS_TOKEN', '', true),
  ('OPENAI_API_KEY', '', true),
  ('ANTHROPIC_API_KEY', '', true),
  ('GEMINI_API_KEY', '', true),
  ('GEMINI_MODEL', '', false),
  ('OPENAI_MODEL', 'gpt-4o-mini', false),
  ('SITE_KETUA', '', false),
  ('AUTO_EXECUTE_MODE', 'off', false),
  ('AUTO_EXECUTE_DELAY_MINUTES', '5', false),
  ('DATABASE_URL', '', true),
  ('OPS_WEBHOOK_URL', '', true)
on conflict (key) do nothing;

-- Verify final state
select key, value, is_secret, updated_at from public.admin_settings order by key;
