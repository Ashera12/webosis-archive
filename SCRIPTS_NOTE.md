Notes & commands to enable automated runner and ops
=================================================

1) Environment variables to set on your deployment (required for automated ops):

- `ALLOW_ADMIN_OPS=true`
- `DATABASE_URL` = your Postgres service-role connection string (used by psql subprocesses)
- (optional) `PGPASSWORD` = password for psql subprocess
- `ADMIN_OPS_TOKEN` = a strong secret used by CI to authenticate (keep private)
- `OPENAI_API_KEY` = for AI assistant
- `AUTO_EXECUTE_MODE` = `off` | `delay` | `auto` (default `off`)
- `AUTO_EXECUTE_DELAY_MINUTES` = minutes to wait for delay mode (default 5)
- `OPS_WEBHOOK_URL` = optional webhook to notify on pending/executed/failed ops


GitHub Actions automation

- Create repo secrets `APP_URL` and `ADMIN_OPS_TOKEN` and ensure the server has `ADMIN_OPS_TOKEN` env set to the same value.

- The workflow `.github/workflows/auto-runner.yml` in this repo will POST to `${APP_URL}/api/admin/auto_runner` using header `x-admin-ops-token`.

Quick manual test of auto_runner using curl (from any secure machine):

```bash
curl -X POST "$APP_URL/api/admin/auto_runner" -H "x-admin-ops-token: $ADMIN_OPS_TOKEN" -H 'Content-Type: application/json'
```

Security notes

- Never expose `ADMIN_OPS_TOKEN` or `DATABASE_URL` publicly. Use managed secrets only.
- Use `AUTO_EXECUTE_MODE=delay` for safest semi-automatic behavior.
