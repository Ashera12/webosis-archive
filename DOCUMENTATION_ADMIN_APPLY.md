# Admin Apply & Safety Guide

Ringkasan singkat
- Tujuan: menjelaskan cara aman menggunakan fitur "Apply SQL" yang ditambahkan ke admin UI, menjalankan runner CI manual, dan cara membuat backup sebelum operasi destruktif.
- Lokasi terkait di repo:
  - Admin UI client: `components/admin/ApplySqlControls.tsx`
  - Server apply endpoint: `app/api/admin/maintenance/apply-sql/route.ts`
  - Helper supabase client: `lib/supabase/server.ts`
  - Repo runner scripts: `tools/run_apply_all.js`, `tools/backup_duplicates.js`, `tools/probe_db.js`, `tools/exec_sql_file.js`
  - Combined SQL: `supabase-apply-all.sql`

Prasyarat
- Pastikan environment lokal atau CI memiliki kredensial service-role Supabase (rahasia). Jangan pernah mengekspos service-role di klien publik.
- Untuk mengizinkan operasi destruktif lewat UI/CI, set env var guard:
  - `ALLOW_DESTRUCTIVE_SQL=1` (lokal) atau set secret di CI. Endpoint server memeriksa ini sebelum menjalankan section yang berpotensi merusak.

Status kesiapan fitur (ringkas)
- Admin Apply UI: sudah ditambahkan ke halaman Admin Tools. UI memungkinkan preview per-section dari `supabase-apply-all.sql` dan tombol "Apply".
  - Keamanan: server-side endpoint memeriksa user super_admin dan `ALLOW_DESTRUCTIVE_SQL` untuk sections destruktif.
  - Siap dipakai di lingkungan yang aman (local admin / staging) setelah mengisi service-role key.
- CI manual workflow: ada workflow manual (manual dispatch) untuk menjalankan `tools/run_apply_all.js`. Workflow membutuhkan secrets di repo (lihat bagian CI).
- Backup tools: `tools/backup_duplicates.js` dan `tools/probe_db.js` tersedia dan telah digunakan. Mereka menulis ke direktori `backups/`.
- Tests: unit tests untuk check-in paths sudah distabilkan dan passing. E2E/integration tests yang memerlukan akses live DB masih guarded and NOT RUN by default.

Cara menjalankan (lokal) — ringkas
1. Jalankan dev server Next.js (untuk menggunakan Admin UI):

```pwsh
npm install
npm run dev
```

2. Jika ingin menjalankan runner/SQL via node script (lokal):
- Pastikan `.env.local` berisi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` serta `ALLOW_DESTRUCTIVE_SQL=1` jika kamu akan menjalankan bagian destruktif.
- Jalankan runner (contoh):

```pwsh
node tools/run_apply_all.js
```

Perhatian: runner yang mengeksekusi SQL menggunakan RPC `public.exec_sql(sql)` (atau service-role client). Pastikan RPC tersebut ada di DB jika runner bergantung padanya.

3. Backup duplicate / probe DB sebelum apply (recommended):

```pwsh
node tools/backup_duplicates.js
node tools/probe_db.js
```

Hasil: file backup disimpan di `backups/` (JSON/CSV).

CI: manual GitHub Actions
- Workflow sudah ditambahkan ke `.github/workflows/manual-apply.yml` (manual dispatch). Sebelum menjalankan, tambahkan secrets di repo settings:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (service role) — *required*
  - `ALLOW_DESTRUCTIVE_SQL=1` (set via env in the workflow or a separate secret)
- Jalankan workflow via manual dispatch di GitHub -> Actions -> <workflow> -> Run workflow.
- The workflow will use the service-role to call the same runner script.

Safety checklist (manual) — wajib sebelum apply di staging/prod
- [ ] Ambil backup DB snapshot (preferred) or at minimum use `tools/backup_duplicates.js` to export any rows that may be affected.
- [ ] Review the SQL in `supabase-apply-all.sql` — each section is annotated. Preview first in the Admin UI (it shows the SQL sections).
- [ ] Ensure `ALLOW_DESTRUCTIVE_SQL` guard is set only in trusted environment and endpoint shows it enabled.
- [ ] Ensure admin user has `super_admin` role when using Admin UI apply endpoint.
- [ ] Run in staging first; verify application health and data consistency.

Quick troubleshooting
- If scripts error because `exec_sql` RPC not found: create / verify RPC on DB with signature `exec_sql(sql text)` that can be called by the service role. The runner expects this RPC when configured that way.
- If test/integration needs live DB: set `RUN_LIVE_INTEGRATION=1` and ensure service-role key is present. Tests are guarded to avoid accidental runs.

Notes & Next steps
- Consider adding an immutable backup step that creates a DB snapshot (if platform supports) before the runner proceeds automatically.
- We can add a small admin audit-log entry whenever the UI triggers an apply (to track who applied what and when).

If you want, I can:
- Commit this doc and open a PR.
- Add a brief README section under `README.md` instead.
- Run `npm run build` and lint to catch any issues before we open a PR.

---
File created by the automation agent. Edit or tell me if you'd prefer Indonesian/English changes or an alternate filename (e.g., `README_ADMIN_APPLY.md`).