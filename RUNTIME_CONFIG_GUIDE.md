# Runtime Configuration Guide

## Overview

Mulai sekarang, kamu **tidak perlu redeploy** untuk mengubah konfigurasi kritis seperti API keys, mode ops, atau terminal settings. Semua settings tersimpan di database `admin_settings` dan langsung aktif.

## Cara Menggunakan

### 1. Akses Halaman Settings

- Login sebagai **super_admin**
- Buka `/admin/settings`

### 2. Quick Toggles (Toggle Cepat)

Di bagian atas halaman, ada **Quick Toggles** untuk mengaktifkan/menonaktifkan flag kritis:

#### `ALLOW_ADMIN_OPS`
- **Fungsi**: Mengaktifkan semua endpoint ops, terminal, dan automation.
- **Default**: `false` (nonaktif)
- **Cara Toggle**: Klik tombol `ENABLE` / `DISABLE`
- **Efek**: Langsung aktif tanpa redeploy. Semua route ops (`/api/admin/ops`, `/api/admin/terminal`, `/api/admin/suggestions`, `/api/admin/auto_runner`) akan menggunakan nilai ini.

#### `ALLOW_UNSAFE_TERMINAL`
- **Fungsi**: Mengizinkan raw command execution di terminal (BERBAHAYA!).
- **Default**: `false` (nonaktif)
- **Cara Toggle**: Klik tombol `ENABLE` / `DISABLE`
- **Efek**: Setelah diaktifkan, terminal akan menampilkan input RAW command. Kamu bisa menjalankan **semua command** termasuk yang tidak ada di whitelist.
- **⚠️ Peringatan**: Mode ini memungkinkan eksekusi arbitrary command. HANYA aktifkan untuk debugging singkat. Pastikan `ADMIN_OPS_TOKEN` sudah di-set untuk keamanan.

### 3. Settings Form (Lengkap)

Di bagian bawah Quick Toggles, ada form lengkap untuk semua konfigurasi:

- **API Keys**: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
- **Automation**: `AUTO_EXECUTE_MODE`, `AUTO_EXECUTE_DELAY_MINUTES`
- **Ops & Security**: `ALLOW_ADMIN_OPS`, `ALLOW_UNSAFE_TERMINAL`, `ADMIN_OPS_TOKEN`
- **Database**: `DATABASE_URL`
- **Monitoring**: `OPS_WEBHOOK_URL`

### 3.1 Tampilan Global: Background Seluruh Halaman

Tambahan konfigurasi untuk mengatur background website secara global (aktif tanpa redeploy):

- `GLOBAL_BG_MODE` — `none` | `color` | `gradient` | `image`
- `GLOBAL_BG_COLOR` — contoh `#ffffff` (aktif jika mode=`color`)
- `GLOBAL_BG_GRADIENT` — contoh `linear-gradient(135deg,#D4AF37,#E6C547)` (aktif jika mode=`gradient`)
- `GLOBAL_BG_IMAGE_URL` — URL gambar publik (aktif jika mode=`image`)
- `GLOBAL_BG_IMAGE_STYLE` — `cover` | `contain` (default `cover`)
- `GLOBAL_BG_IMAGE_OPACITY` — 0..1, misal `0.7` untuk meredupkan gambar
- `GLOBAL_BG_IMAGE_FIXED` — `true` untuk efek parallax (background-attachment: fixed)

Layout aplikasi sudah di-mark `force-dynamic`, jadi perubahan ini langsung terlihat setelah disimpan.

**Cara Menyimpan:**
1. Isi nilai yang ingin diubah
2. Klik tombol **Simpan Settings**
3. Settings tersimpan ke database `admin_settings`
4. Langsung aktif—tidak perlu restart server

### 4. Menggunakan Raw Terminal

Setelah mengaktifkan `ALLOW_UNSAFE_TERMINAL`:

1. Buka `/admin/terminal`
2. Scroll ke bawah—akan muncul section **RAW MODE AKTIF**
3. Masukkan command (contoh: `node -v`, `npm list`, `git status`, dll)
4. Klik **Run RAW**
5. Masukkan `ADMIN_OPS_TOKEN` saat diminta (untuk security)
6. Command akan dijalankan langsung di server

**⚠️ Catatan Keamanan:**
- Raw mode memungkinkan **semua command** termasuk yang destruktif (`rm -rf`, `shutdown`, dll)
- **HANYA** gunakan untuk debugging cepat
- Pastikan token aman dan tidak bocor
- Matikan kembali setelah selesai debugging

## Cara Kerja Internal

### Centralized Config Helper (`lib/adminConfig.ts`)

Semua route admin sekarang menggunakan helper function:

```typescript
import { getConfig, getConfigBoolean } from '@/lib/adminConfig';

// Membaca config (DB first, fallback ke env)
const apiKey = await getConfig('OPENAI_API_KEY');
const allowOps = await getConfigBoolean('ALLOW_ADMIN_OPS');
```

**Prioritas:**
1. Database `admin_settings` (jika ada)
2. Environment variable `process.env`

**Route yang Sudah Menggunakan:**
- `/api/admin/terminal`
- `/api/admin/ops`
- `/api/admin/suggestions`
- `/api/admin/auto_runner`
- `/api/admin/ai`

### Database Schema

```sql
create table public.admin_settings (
  key text primary key,
  value text not null,
  is_secret boolean default false,
  updated_at timestamptz default now()
);
```

**Kolom:**
- `key`: Nama setting (misal `ALLOW_ADMIN_OPS`)
- `value`: Nilai setting (misal `true`)
- `is_secret`: Flag untuk masking di GET response
- `updated_at`: Auto-update timestamp

### API Endpoints

#### GET `/api/admin/settings`
- **Auth**: Super admin only
- **Response**: 
  ```json
  {
    "values": {
      "ALLOW_ADMIN_OPS": "true",
      "ADMIN_OPS_TOKEN": "***",
      "OPENAI_API_KEY": "***"
    },
    "note": "Secret values masked. Update via POST."
  }
  ```
- **Behavior**: Secret values (`is_secret=true`) di-mask dengan `***`

#### POST `/api/admin/settings`
- **Auth**: Super admin only
- **Body**:
  ```json
  {
    "settings": {
      "ALLOW_ADMIN_OPS": "true",
      "ADMIN_OPS_TOKEN": "my_secure_token_123",
      "OPENAI_API_KEY": "sk-..."
    }
  }
  ```
- **Response**: `{ "ok": true }` atau error
- **Behavior**: Upsert ke `admin_settings`, log ke `admin_actions`

## Workflow End-to-End

### Skenario: Mengaktifkan Terminal RAW Mode

1. **Login** sebagai super_admin → buka `/admin/settings`
2. **Set Token** (opsional jika belum):
   - Di form settings, isi `ADMIN_OPS_TOKEN` dengan nilai aman (misal: `my_token_xyz`)
   - Klik **Simpan Settings**
3. **Enable Ops**:
   - Di Quick Toggles, klik **ENABLE** pada `ALLOW_ADMIN_OPS`
   - Konfirmasi prompt → status berubah **AKTIF**
4. **Enable Raw Terminal**:
   - Di Quick Toggles, klik **ENABLE** pada `ALLOW_UNSAFE_TERMINAL`
   - Konfirmasi prompt → status berubah **AKTIF**
5. **Buka Terminal**:
   - Navigasi ke `/admin/terminal`
   - Scroll ke bawah → muncul section **RAW MODE AKTIF**
6. **Jalankan Command**:
   - Masukkan command (misal: `node -v`)
   - Klik **Run RAW**
   - Masukkan token `my_token_xyz` saat diminta
   - Output command muncul di layar

### Skenario: Mengubah AI Provider Key

1. **Login** → buka `/admin/settings`
2. **Klik "Tampilkan Secret"** (toggle di form API & Environment)
3. **Isi** `OPENAI_API_KEY` dengan key baru (misal: `sk-proj-xyz...`)
4. **Klik "Simpan Settings"**
5. **Test AI**:
   - Buka `/admin/tools`
   - Di section AI Assistant, pilih provider **openai**
   - Masukkan prompt test
   - Klik **Ask AI** → response menggunakan key baru langsung

## Keamanan

### Token Protection
- `ADMIN_OPS_TOKEN` digunakan untuk:
  - GitHub Actions calling `/api/admin/auto_runner`
  - Raw terminal execution validation
- Jangan expose token di client-side atau commit ke git
- Simpan hanya di database (encrypted at rest) atau secret manager

### Secret Masking
- Semua field dengan `secret: true` akan di-mask di GET response
- Hanya POST yang bisa update secret values
- UI menampilkan `***` kecuali kamu klik "Tampilkan Secret"

### Audit Logging
- Semua perubahan settings di-log ke `admin_actions` table
- Kolom:
  - `user_id`: Super admin yang melakukan
  - `action`: `update_settings`
  - `payload`: `{ settings: {...} }`
  - `created_at`: Timestamp

## Migrasi dari ENV ke DB

Jika saat ini kamu sudah punya env vars (misal di Vercel / Supabase Function), cara migrasi:

1. **Copy nilai** dari env vars yang ada
2. **Paste** ke form `/admin/settings`
3. **Simpan** → nilai tersimpan di DB
4. **Opsional**: Hapus env vars dari platform hosting (route akan fallback ke DB)

**Keuntungan:**
- Update tanpa redeploy
- Version control di database (bisa di-track via audit table)
- Centralized config management

## Troubleshooting

### "Settings tidak berubah setelah di-save"
- **Cek**: Apakah ada error di network console browser?
- **Cek**: Apakah response POST `/api/admin/settings` return `{ ok: true }`?
- **Cek**: Di Supabase dashboard, query `SELECT * FROM admin_settings;` untuk verify DB content

### "Terminal RAW mode tidak muncul"
- **Cek**: Apakah `ALLOW_UNSAFE_TERMINAL` sudah di-toggle ENABLE?
- **Cek**: Refresh page `/admin/terminal` → GET endpoint harus return `{ unsafeAllowed: true }`
- **Cek**: Browser console untuk error

### "Raw command gagal dengan 401 Invalid token"
- **Cek**: Apakah `ADMIN_OPS_TOKEN` sudah di-set di settings?
- **Cek**: Apakah token yang kamu masukkan saat prompt sama dengan yang di-save?
- **Solusi**: Update token via settings form, pastikan tidak ada typo

### "AI provider return 501 not configured"
- **Cek**: Apakah API key provider sudah di-set? (misal `OPENAI_API_KEY`)
- **Solusi**: Buka settings, isi key yang sesuai, save

## Best Practices

1. **Minimal Privilege**: Hanya aktifkan `ALLOW_UNSAFE_TERMINAL` saat debugging urgent. Matikan setelah selesai.
2. **Token Rotation**: Ganti `ADMIN_OPS_TOKEN` secara berkala untuk keamanan.
3. **Audit Review**: Cek `admin_actions` table secara rutin untuk melihat perubahan config.
4. **Backup**: Export `admin_settings` table sebelum melakukan perubahan besar.
5. **Test di Dev**: Test config baru di development environment dulu sebelum apply di production.

## FAQ

**Q: Apakah settings bisa di-update via API eksternal (misal CI/CD)?**  
A: Ya, dengan token. POST ke `/api/admin/settings` dengan header `x-admin-ops-token`. Pastikan token match dengan `ADMIN_OPS_TOKEN` di DB.

**Q: Bagaimana cara rollback config yang salah?**  
A: Buka settings, ubah nilai kembali, save. Atau via SQL: `UPDATE admin_settings SET value='old_value' WHERE key='KEY_NAME';`

**Q: Apakah perubahan config perlu restart server?**  
A: **TIDAK**. Semua route membaca config setiap kali request. Perubahan langsung aktif.

**Q: Apakah bisa set config via SQL langsung?**  
A: Ya, jalankan:
```sql
INSERT INTO admin_settings (key, value, is_secret) VALUES ('ALLOW_ADMIN_OPS', 'true', false)
ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now();
```

**Q: Bagaimana cara disable semua ops secara cepat (emergency)?**  
A: Quick toggle `ALLOW_ADMIN_OPS` → klik **DISABLE**. Semua endpoint ops/terminal langsung 403.

---

## Referensi Tambahan

- [ADMIN_CREDENTIALS.md](./ADMIN_CREDENTIALS.md) - Setup super admin account
- [README_ADMIN_TOOLS.md](./README_ADMIN_TOOLS.md) - Overview admin features
- [CONFIGURATION.md](./CONFIGURATION.md) - Environment variables reference
- [supabase-admin-settings.sql](./supabase-admin-settings.sql) - DB migration for settings table
