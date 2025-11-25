-- Add global background configuration keys (idempotent insert)
-- This migration does NOT alter table structure (key/value model already supports new keys)
-- It just seeds defaults if not present.

insert into public.admin_settings (key, value, is_secret, description) values
  ('GLOBAL_BG_MODE','none', false, 'Global background mode: none|color|gradient|image'),
  ('GLOBAL_BG_COLOR','', false, 'Hex/RGB color if mode=color'),
  ('GLOBAL_BG_GRADIENT','', false, 'CSS gradient string if mode=gradient'),
  ('GLOBAL_BG_IMAGE_URL','', false, 'Image URL if mode=image'),
  ('GLOBAL_BG_IMAGE_STYLE','cover', false, 'Image sizing: cover|contain'),
  ('GLOBAL_BG_IMAGE_OPACITY','1', false, 'Opacity 0-1 for image darkening'),
  ('GLOBAL_BG_IMAGE_FIXED','false', false, 'Use fixed attachment for parallax effect')
ON CONFLICT (key) DO NOTHING;