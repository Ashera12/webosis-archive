Safe apply instructions for QR Check-In SQL changes

Overview

This project adds safe DB changes and an RPC to support the QR Check-In system. Files included in this repo:

- supabase-cleanup-duplicates.sql (already present)
- supabase-qr-enhancements.sql (already present)
- supabase-add-qr-constraints.sql (already present)
- supabase-rpc-consume-checkin.sql (already present)
- supabase-apply-all.sql (combined file)

supabase-apply-all.sql contains the following ordered steps:
  1) Cleanup duplicate attendance rows (keeps earliest)
  2) Add single_use/used columns to event_qr_codes
  3) Create unique indexes to prevent duplicate attendance
  4) Create RPC function public.consume_checkin(...) for atomic consume+insert

Preflight checklist (highly recommended)

1. Backup your Supabase/Postgres database (snapshot or export).
2. Review the SQL files to understand changes.
3. If you have existing duplicates, either run the cleanup step or inspect duplicates using these queries:

-- find duplicate emails per event
SELECT event_id, lower(email) AS email_norm, COUNT(*)
FROM attendance
WHERE email IS NOT NULL
GROUP BY event_id, lower(email)
HAVING COUNT(*) > 1;

-- find duplicate user_id per event
SELECT event_id, user_id, COUNT(*)
FROM attendance
WHERE user_id IS NOT NULL
GROUP BY event_id, user_id
HAVING COUNT(*) > 1;

Applying SQL via Supabase UI (recommended for manual control)

1. Open your Supabase project -> SQL editor.
2. Paste the contents of supabase-apply-all.sql into a new query.
3. Click "Run".
4. If you prefer, run the sections manually in order: cleanup first, then enhancements, then constraints, then the RPC.

Using Supabase CLI (optional)

If you have the Supabase CLI configured and authenticated, you can run:

# run a file (example)
supabase db query --file=./supabase-apply-all.sql

Note: CLI commands and flags may change depending on your supabase cli version.

Post-apply verification

1. Verify `event_qr_codes` table now has columns: single_use (boolean), used (boolean), used_at (timestamptz).
2. Verify unique indexes exist: ux_attendance_event_email_lower, ux_attendance_event_user.
3. Verify the RPC exists: public.consume_checkin
   - In SQL editor: select proname, proargnames from pg_proc where proname ilike '%consume_checkin%';
4. Test flow:
   - Generate token via admin UI or POST /api/admin/events/{id}/generate-qr
   - Try check-in with { token, name, email }
   - Try duplicate check-ins with same email or user_id (should be rejected)
   - Test single_use token by generating with { single_use: true } and using it twice (2nd attempt should be rejected)

If anything fails

- If unique index creation fails due to duplicates, run the cleanup SQL first (supabase-cleanup-duplicates.sql) and retry.
- If RPC fails or is unavailable, the server still has fallback logic (the app will fall back to the non-RPC path), but single-use atomicity will be best-effort unless RPC is installed.

Need help?

If you want, I can:
- Produce a cleanup SQL that exports duplicates to a table so you can review before deletion.
- Produce a migration in your project's expected migration format (e.g., pg-migrate, Prisma, or your chosen tool).
- Create a one-click script that runs the SQL via the Supabase CLI (requires you to run it locally with credentials).

Say which you'd like and I'll prepare it next.