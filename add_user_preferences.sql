-- Add user preference columns for theme and language persistence
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_preference text CHECK (theme_preference IN ('light','dark')) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS language_preference text CHECK (language_preference IN ('id','en')) DEFAULT NULL;

-- Optional index for querying by preferences (low cardinality, skip if not needed)
-- CREATE INDEX IF NOT EXISTS users_theme_pref_idx ON users(theme_preference);
-- CREATE INDEX IF NOT EXISTS users_language_pref_idx ON users(language_preference);