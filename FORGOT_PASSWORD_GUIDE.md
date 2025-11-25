# Forgot Password & Reset Flow

## Tujuan
Memungkinkan pengguna mereset password ketika lupa tanpa bantuan manual admin sambil menjaga keamanan (token sekali pakai, kedaluwarsa, hashing, rate limit).

## Komponen
- Tabel `password_resets`: simpan `token_hash`, `expires_at`, `used`.
- Endpoint `POST /api/auth/forgot-password`: terima email, buat token (1 jam), hash dengan SHA-256, simpan. Tidak bocorkan apakah email ada.
- Endpoint `POST /api/auth/reset-password`: terima token + password baru, validasi kompleksitas, verifikasi token aktif, update user password (bcrypt), tandai token `used=true`.
- Halaman UI: `/admin/forgot-password` & `/admin/reset-password/[token]`.
- Middleware: publikasikan halaman forgot + reset; perketat role untuk area admin.

## Password Policy
- Minimal 8 karakter
- Mengandung huruf besar, huruf kecil, angka
(Bisa ditambah simbol jika diperlukan.)

## Rate Limiting
Permintaan lupa password dibatasi (default 3 per 5 menit per email) menggunakan in-memory map (cukup untuk dev). Produksi sebaiknya pakai Redis.

## Token
- Panjang: 32 random bytes → hex (64 chars)
- Disimpan sebagai hash SHA-256 (jika DB bocor, token asli tetap aman)
- Masa berlaku: 1 jam
- Sekali pakai (field `used`)

## Alur
1. Pengguna membuka `/admin/forgot-password`, input email.
2. Server membuat token & (PROD) kirim email berisi link: `https://domain/admin/reset-password/<token>`.
3. Pengguna klik link, buka form reset, masukkan password baru.
4. Server verifikasi token, update `users.password_hash` (bcrypt), tandai token used.
5. User login kembali dengan password baru.

## Email Pengiriman (Belum diimplementasi)
Tambahkan integrasi SMTP/Resend di file `forgot-password` route mengganti debug return.
Contoh pseudo:
```ts
await sendResetEmail({ to: email, link: resetLink });
```

## Variabel Lingkungan
- `PASSWORD_SALT_ROUNDS` (opsional, default 10)
- `ADMIN_ALLOWED_ROLES` untuk membatasi akses (default `admin,super_admin`)

## Keamanan Tambahan (Opsional)
- Simpan log setiap permintaan reset (audit trail)
- Tambahkan CAPTCHA di form lupa password
- Tambahkan pengecekan password sebelumnya (hindari reuse) dengan menyimpan hash lama di tabel historis

## Troubleshooting
| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| Token tidak valid | Salah atau sudah dipakai | Minta reset baru |
| Token kedaluwarsa | >1 jam | Lupa password lagi untuk token baru |
| Tidak menerima email | SMTP belum dikonfigurasi | Cek dev `debugResetLink` atau atur SMTP |
| Role ditolak | `ADMIN_ALLOWED_ROLES` tidak memuat role user | Update env & restart |

## Langkah Deploy
1. Jalankan migrasi `migrations/001-create-password-resets.sql` di database.
2. Set env: `ADMIN_ALLOWED_ROLES` jika perlu.
3. Konfigurasi layanan email (opsional).
4. Restart aplikasi.
5. Uji: lupa password → reset → login.

## Checklist Uji
- [ ] Lupa password dengan email valid: dapat link (dev mode) / email
- [ ] Lupa password dengan email tidak terdaftar: pesan generik
- [ ] Token sekali pakai: tidak bisa dipakai ulang
- [ ] Token kadaluarsa setelah 1 jam
- [ ] Password policy ditolak jika lemah
- [ ] Role non-admin ditolak masuk ke /admin

Selesai.
