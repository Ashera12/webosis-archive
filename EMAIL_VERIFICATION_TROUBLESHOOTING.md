# Email Verification Troubleshooting

Tujuan: Memastikan email verifikasi benar-benar terkirim ke user baru dan alur verifikasi berjalan lancar.

## 1. Variabel Lingkungan (ENV) Wajib/Disarankan
Pilih salah satu metode pengiriman email (SendGrid atau SMTP). Tambahkan ke `.env.local`.

### SendGrid
- `SENDGRID_API_KEY` (wajib) – API key.
- `SENDGRID_FROM` (opsional, disarankan) – alamat pengirim (mis: `no-reply@domain.com`).

### SMTP (Nodemailer)
- `SMTP_HOST` (wajib) – host server SMTP.
- `SMTP_PORT` (opsional, default 587) – port.
- `SMTP_SECURE` (`true`/`false`) – gunakan TLS/SSL jika perlu.
- `SMTP_USER` (opsional) – username auth.
- `SMTP_PASS` (opsional) – password auth.
- `SMTP_FROM` (opsional) – alamat pengirim jika berbeda.

### Lainnya
- `NEXT_PUBLIC_BASE_URL` – basis URL publik (mis: `https://app.example.com`). Dipakai untuk fallback domain `from`.
- `EXPOSE_VERIFICATION_TOKENS=true` (opsional dev) – paksa response menampilkan token & link verifikasi.
- `RESEND_MAX_ATTEMPTS` (opsional) – batas kirim ulang (default 3).

## 2. Memverifikasi Konfigurasi
1. Pastikan minimal satu set variabel pengirim (SendGrid atau SMTP) terisi.
2. Jalankan `npm run dev` lalu daftar user baru.
3. Periksa respons API `POST /api/auth/register` di Network tab:
   - Field `mail_configured` harus `true` bila env sudah benar.
   - Field `mail_sent` harus `true` bila pengiriman sukses.
   - Jika `mail_configured` false, gunakan `dev_verification_link` untuk verifikasi manual di dev.
4. Cek inbox email (dan folder spam).

## 3. Kirim Ulang (Resend)
Gunakan endpoint `POST /api/auth/resend-verification` dengan body JSON `{ "email": "user@example.com" }`.
- Respons dev akan menyertakan: `dev_link`, `mail_sent`, `mail_configured`.
- Pastikan tidak melebihi limit `RESEND_MAX_ATTEMPTS`.

## 4. Alur Lengkap
1. User register → token dibuat di tabel `email_verifications` (hash disimpan, raw token hanya di response bila dev/expose).
2. Email dikirim (SendGrid/SMTP) atau dilog jika tidak ada konfigurasi.
3. User klik link `/verify-email/{token}` → backend verifikasi token hash → set `email_verified=true`.
4. User diarahkan ke halaman `waiting-approval` sambil menunggu admin approve.
5. Setelah admin approve (`approved=true`), user dapat login.

## 5. Debug Cepat
- Tidak menerima email & `mail_configured=false`: lengkapi ENV atau pakai `dev_verification_link` sementara.
- Tidak menerima email & `mail_configured=true` tetapi `mail_sent=false`: cek log terminal untuk error SendGrid/SMTP.
- Email masuk ke spam: tambah SPF/DKIM/DMARC di domain pengirim (produksi).
- Token kadaluarsa (>24 jam): kirim ulang melalui endpoint resend.

## 6. Cek Tabel (Opsional SQL)
Pastikan token tersimpan:
```sql
select id, user_id, used, expires_at, created_at
from email_verifications
order by created_at desc limit 10;
```
Pastikan user diverifikasi & diapprove:
```sql
select id, email, email_verified, approved, rejected
from users
where email ilike '%example.com%';
```

## 7. Langkah Validasi Manual
1. Copy `dev_verification_link` dari respons register (dev).
2. Paste di browser → harus redirect ke `waiting-approval`.
3. Cek user record: `email_verified` menjadi true.
4. Admin approve user → `approved` menjadi true.
5. Login kredensial berhasil.

## 8. Common Pitfalls
- Lupa set `.env.local` → hanya logging tanpa kirim.
- Memakai `localhost` dengan provider email yang memblokir domain non valid → gunakan domain nyata di `NEXT_PUBLIC_BASE_URL`.
- Menggunakan port 465 tapi `SMTP_SECURE` belum di-set → koneksi gagal.
- Salah API key SendGrid (dapat 401/403) → `mail_sent=false`.

## 9. Checklist Produksi
- [ ] `SENDGRID_API_KEY` atau SMTP kredensial valid.
- [ ] Domain pengirim punya SPF + DKIM.
- [ ] `NEXT_PUBLIC_BASE_URL` pakai HTTPS.
- [ ] Logging error dipantau (SendGrid/SMTP).
- [ ] Rate limit resend disesuaikan kebutuhan.

## 10. Resend Endpoint Contoh Curl
```bash
curl -X POST https://app.example.com/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

Jika masih ada kendala, tangkap log `[mailer]` dan `[register]` / `[resend-verification]` untuk analisa lebih lanjut.
