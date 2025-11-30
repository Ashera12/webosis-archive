# ✅ Quick Checklist - Testing Enrollment System

## 🎯 LANGKAH CEPAT (10 Menit)

### 1️⃣ Jalankan SQL Migration (2 menit)
```
1. Buka: https://supabase.com/dashboard
2. Pilih project → SQL Editor → New Query
3. Copy-paste SETUP_ENROLLMENT_SYSTEM.sql
4. Klik RUN
5. Tunggu "Success. No rows returned"
```

**Verifikasi:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('biometric_data', 'webauthn_credentials', 'webauthn_challenges');
-- Harus return 3 tabel
```

---

### 2️⃣ Test Admin Panel (2 menit)
```
1. Login admin: /login
2. Buka: /admin/attendance/settings
3. Scroll ke "🔒 Enrollment Security Settings"
4. Geser slider AI Face Match ke 75%
5. Geser slider Anti-Spoofing ke 90%
6. Geser slider Min Layers ke 6/8
7. Klik "💾 Simpan Konfigurasi"
8. Lihat toast "✅ Konfigurasi berhasil disimpan"
```

**Verifikasi:**
```sql
SELECT ai_verification_threshold, anti_spoofing_threshold, min_anti_spoofing_layers 
FROM school_location_config LIMIT 1;
-- Harus return: 0.75, 0.90, 6
```

---

### 3️⃣ Test Enrollment Flow (3 menit)
```
1. Logout dari admin
2. Login sebagai siswa/guru yang belum enrollment
3. Akses /attendance → Auto redirect ke /enroll
4. Ambil foto wajah (kamera muncul)
5. Tunggu AI verification (10-20 detik)
6. Klik "Continue" jika pass
7. Register passkey (Windows Hello/Touch ID)
8. Auto redirect ke /attendance
```

**Verifikasi:**
```sql
SELECT * FROM enrollment_dashboard WHERE email = 'email_user_test@example.com';
-- Harus return: is_enrolled = true, passkey_count = 1
```

---

### 4️⃣ Test Konfigurasi Bekerja (2 menit)

**Test 1: Matikan Enrollment**
```
1. Admin panel → Uncheck "✅ Mandatory Enrollment"
2. Simpan
3. Login user baru → /attendance (tidak redirect ke /enroll)
4. Kembalikan ON
```

**Test 2: Lower Threshold**
```
1. Admin panel → Geser AI Face Match ke 50%
2. Simpan
3. Test enrollment dengan foto kurang jelas → Harus pass
4. Kembalikan ke 75-80%
```

---

## 🚨 CRITICAL CHECKS

### ✅ Database Migration
- [ ] 3 tabel dibuat
- [ ] 6 kolom enrollment di school_location_config
- [ ] 12 RLS policies active

### ✅ Admin Panel
- [ ] Enrollment settings muncul
- [ ] 6 kontrol berfungsi
- [ ] Simpan berhasil

### ✅ Enrollment Flow
- [ ] Redirect ke /enroll bekerja
- [ ] Camera capture bekerja
- [ ] AI verification bekerja (10-20 detik)
- [ ] Passkey registration bekerja
- [ ] Redirect ke /attendance setelah complete

### ✅ Configuration Sync
- [ ] API status membaca config dari database
- [ ] API verify menggunakan threshold dari config
- [ ] Matikan enrollment → user langsung complete
- [ ] Lower threshold → verification lebih mudah pass

---

## 📋 ERROR YANG SUDAH DIPERBAIKI

✅ `relation "biometric_data" does not exist` → FIXED  
✅ `column "device_type" already exists` → FIXED  
✅ `policy already exists` → FIXED  
✅ SQL sekarang idempotent (aman dijalankan ulang)

---

## 🎯 PRODUCTION CHECKLIST

Sebelum deploy production:

- [ ] GPS Bypass OFF (bypass_gps_validation = false)
- [ ] IP Whitelist configured (CIDR sekolah, hapus 0.0.0.0/0)
- [ ] Enrollment mandatory ON (require_enrollment = true)
- [ ] Production thresholds:
  - [ ] AI Face Match: 80%
  - [ ] Anti-Spoofing: 95%
  - [ ] Min Layers: 7/8

---

## 📞 TROUBLESHOOTING

**SQL error saat run migration?**  
→ Lihat ENROLLMENT_SQL_MIGRATION_GUIDE.md section Troubleshooting

**Admin panel tidak muncul enrollment settings?**  
→ Hard refresh (Ctrl+Shift+R), tunggu Vercel deploy 1-2 menit

**AI verification selalu REJECT?**  
→ Lower threshold di admin panel (75% untuk testing)

**Passkey registration gagal?**  
→ Pastikan HTTPS, browser modern, allow biometric prompt

---

## ✅ SEMUA READY!

Jika semua checklist ✅ → **Sistem enrollment premium siap digunakan!** 🚀

Lihat panduan lengkap: `ENROLLMENT_SQL_MIGRATION_GUIDE.md`
