Admin Tools & Maintenance — Quick Guide
=====================================

What this provides

- A small admin UI at `/admin/tools` (client-side) that lets a signed-in admin run repository SQL files (server-side) and call an AI assistant.

- Server endpoints:

  - `POST /api/admin/maintenance` — runs SQL files using `psql` on the server (requires `DATABASE_URL` env and `psql` available). Restricted to `super_admin`.

  - `POST /api/admin/ai` — proxies prompts to OpenAI (requires `OPENAI_API_KEY`). Restricted to `admin` or `super_admin`.

Safety & Security

- Running SQL from server-side needs a privileged DB connection. Only run on trusted servers.

- The maintenance endpoint executes `psql` and is protected via NextAuth; review access controls before deploying to production. Consider removing the endpoint after use.

- The AI endpoint requires an API key; never expose it to clients. Keep it in server environment variables.

How to run the SQL files (recommended)

- Supabase Dashboard (recommended):

  Use the Supabase Dashboard → SQL Editor and run the following files in this order:

  - `supabase-fix-schema.sql`

  - `supabase-seed-data.sql`

  - `supabase-super-admin-seed.sql`

  Additionally, to enable audit logging for admin-run operations, run:

  - `supabase-admin-audit.sql`

- CLI (if you have `psql` and a `DATABASE_URL`):

  ```powershell
  $env:DATABASE_URL = 'postgres://user:password@host:5432/dbname'
  ./scripts/run_supabase_sql.ps1
  ```

- After running SQL in Supabase, refresh the API (Dashboard → API → Refresh) or restart the project to update PostgREST schema cache.

Verify

- Run this query in Supabase SQL Editor to ensure `events` table has expected columns:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'events';
```

If you see `start_date` and `end_date` listed, the schema is aligned.

Using the admin UI

- Visit `/admin/tools` when signed in as `admin` or `super_admin`.

- Click "Run Migrations" to execute repository SQL files from the server (requires server `psql` and DATABASE_URL). The endpoint will return per-file results.

- Use the AI Assistant box to send prompts (server must have `OPENAI_API_KEY`).

Cleaning up

- After finishing maintenance, consider removing or disabling the `/api/admin/maintenance` endpoint from production to avoid accidental use.

Questions or next steps

- I can add an audit log (DB table) that records who ran migrations and when. I can also implement stricter safeguards (IP allowlist, confirmation codes). Tell me which you prefer.

Automation (GitHub Actions)

If you want scheduled automatic processing of pending auto-execute suggestions, you can create a GitHub Actions workflow that POSTs to `/api/admin/auto_runner` every N minutes. To do this securely:

1. Create a repository secret `APP_URL` set to your deployed app base URL (e.g. `https://app.example.com`).
2. Create a repository secret `ADMIN_OPS_TOKEN` with a strong random value. Set the same value as the `ADMIN_OPS_TOKEN` env var on your server.
3. Add the supplied `.github/workflows/auto-runner.yml` workflow to your repo (it is included in this repository). The workflow will POST the token in the `x-admin-ops-token` header.

Important: keep `ADMIN_OPS_TOKEN` secret. The workflow calls the auto_runner endpoint which still requires `ALLOW_ADMIN_OPS=true` on the server.
