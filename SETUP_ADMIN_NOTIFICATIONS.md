# Setup Admin Notifications

This document explains how to configure environment variables required for admin in-app notifications and email delivery.

1) Copy environment example

  - Copy `.env.example` to `.env.local` (Next.js) or add the variables to your deployment environment.

  Example (PowerShell):

```powershell
$envFile = "C:\path\to\repo\.env.local"
Get-Content .env.example | Set-Content $envFile
# Then edit the file with your values (e.g. supabase url, service role key, and mailer keys)
notepad $envFile
```

2) Required variables

- `NEXT_PUBLIC_BASE_URL` / `NEXTAUTH_URL`: Your site URL (e.g. `http://localhost:3000` for local dev).
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: Supabase project URL and service role key.
- `ADMIN_NOTIFICATION_EMAILS`: Comma-separated admin emails to receive notification emails.

Mailer options (one of the following):

- SendGrid (preferred): set `SENDGRID_API_KEY`.
- SMTP fallback: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_SECURE`.

3) Development option

- `DEV_RETURN_RESET_TOKEN=1` will make the forgot-password endpoint return the raw token in the response — useful for local testing only. Do NOT enable this in production.

4) Test mailer configuration

There is a helper script at `tools/check_mailer_config.js` that will attempt to send a test email to the addresses in `ADMIN_NOTIFICATION_EMAILS`.

Run it with Node (from repo root):

```powershell
node .\tools\check_mailer_config.js
```

If your environment is configured correctly, you should see the test email delivered or the tool will print helpful diagnostics.

5) Restart dev server

After changing env vars, restart the Next.js dev server (`npm run dev`).

6) If you prefer explicit environment settings (PowerShell example)

```powershell
# Set an environment variable for the current session
$env:ADMIN_NOTIFICATION_EMAILS = "admin@example.com"

# Persist a user environment variable (requires new shell/session to take effect)
setx ADMIN_NOTIFICATION_EMAILS "admin@example.com"
```

7) Notes

- If no mailer keys are configured the app will log reset links locally instead of sending email.
- For production, keep secrets out of source control and use your hosting provider's secret manager.
