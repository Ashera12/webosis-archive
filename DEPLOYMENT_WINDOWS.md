# 🚀 Deployment ke PC/Windows Server (Self-Hosted)

Dokumen ini menjelaskan cara menjalankan project Next.js ini di PC Windows/Windows Server milikmu. Ada dua pilihan: tanpa Docker (Node.js + PM2) atau menggunakan Docker.

## ✅ Yang diperlukan
- Windows 10/11 atau Windows Server 2019/2022
- Node.js 20 LTS (https://nodejs.org)
- Git (opsional, kalau mau pull langsung dari repo)
- Supabase project aktif + environment variables terisi

Opsional:
- PM2 (process manager)
- Caddy atau Nginx sebagai reverse proxy (untuk domain + HTTPS)
- Docker Desktop (kalau pilih metode Docker)

---

## Opsi A — Tanpa Docker (Node.js + PM2)
Cocok untuk setup cepat di LAN atau server Windows tanpa Docker.

### 1) Install & siapkan environment
1. Install Node.js 20 LTS.
2. Salin file env:
   - Copy `.env.example` menjadi `.env.local` dan isi semua nilai penting:
     - NEXT_PUBLIC_SUPABASE_URL
     - NEXT_PUBLIC_SUPABASE_ANON_KEY
     - SUPABASE_SERVICE_ROLE_KEY
     - NEXTAUTH_SECRET (random 32+ chars)
     - NEXTAUTH_URL (sementara bisa http://localhost:3000 atau http://IP-LAN:3000)

### 2) Build dan test secara lokal
Buka PowerShell di folder project, jalankan:

```powershell
npm ci
npm run build
npm run start:prod
```

Aplikasi jalan di http://localhost:3000 (atau http://IP-LAN:3000)

### 3) Jalankan sebagai service dengan PM2
Install PM2 (sekali saja):

```powershell
npm i -g pm2
```

Start app via PM2 menggunakan file `ecosystem.config.cjs` yang sudah disiapkan:

```powershell
# Pastikan sudah npm run build sebelumnya
pm2 start ecosystem.config.cjs --env production
pm2 save
```

Agar auto-start saat boot Windows, install helper berikut:

```powershell
npm i -g pm2-windows-startup
pm2-startup install
```

Perintah berguna:
- `pm2 status` — lihat status proses
- `pm2 logs webosis-app --lines 100` — lihat log
- `pm2 restart webosis-app` — restart app
- `pm2 stop webosis-app` — stop app

### 4) (Opsional) Pasang reverse proxy + domain + HTTPS
Cara termudah di Windows adalah Caddy (single binary, auto HTTPS untuk domain publik).

1. Download Caddy: https://caddyserver.com/download
2. Buat file `Caddyfile` (di folder bebas), isi contoh berikut:

```caddy
# Ganti dengan domain kamu
webosis.example.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000
}

# Jika hanya di LAN tanpa domain, bisa pakai IP/port lokal:
# :80 {
#   encode zstd gzip
#   reverse_proxy 127.0.0.1:3000
# }
```

3. Jalankan Caddy (PowerShell di folder Caddyfile):

```powershell
caddy run --config .\Caddyfile --adapter caddyfile
```

Caddy akan menerbitkan sertifikat otomatis (Let’s Encrypt) jika domain publik mengarah ke IP server kamu.

---

## Opsi B — Docker (Docker Desktop)
Cocok jika kamu suka proses sekali jalan dan isolasi environment.

### 1) Siapkan environment
Isi file `.env` (atau gunakan environment pada compose) dengan variabel berikut:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXTAUTH_SECRET
- NEXTAUTH_URL (contoh: http://localhost:8080 atau domain kamu)

### 2) Build dan jalankan dengan Docker Compose
Dari root project:

```powershell
# Build image & run container (port host 8080 -> container 3000)
docker compose up -d --build
```

Buka: http://localhost:8080 (atau http://IP-LAN:8080)

Perintah berguna:
- `docker compose logs -f` — lihat log
- `docker compose restart` — restart
- `docker compose down` — stop dan remove container

### 3) (Opsional) Reverse proxy + HTTPS
Untuk domain publik, jalankan Caddy/Nginx terpisah dan proxikan ke `webosis:3000`.

Contoh Caddyfile (jika Caddy juga dijalankan via Docker di host yang sama):

```caddy
webosis.example.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:8080
}
```

---

## Checklist setelah server online
- Ganti `NEXTAUTH_URL` ke URL publik akhir (domain atau IP/port)
- Uji login dan halaman admin
- Cek upload ke Supabase Storage (izin bucket & RLS)
- Simulasikan restart server (PM2 save atau container restart) untuk pastikan auto start

Jika butuh bantuan remote setup (PM2, Caddy, atau Docker), kabari saja nilai yang kamu pilih dan kondisi server (domain/LAN), nanti aku sesuaikan konfigurasinya.
