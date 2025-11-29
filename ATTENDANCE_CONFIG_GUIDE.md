# 📝 Panduan Edit & Backup Konfigurasi Attendance

## ✨ Fitur Baru

### 1. **Edit Konfigurasi yang Sudah Ada**
Sekarang konfigurasi bisa di-edit dan di-update tanpa membuat duplikat!

**Cara Menggunakan:**
1. Buka halaman `/admin/attendance/settings`
2. Jika sudah ada konfigurasi, akan muncul badge **"Sudah Dikonfigurasi"** ✅
3. Edit field yang ingin diubah (nama lokasi, GPS, radius, WiFi)
4. Klik **"Simpan Konfigurasi"**
5. Toast akan muncul: **"Konfigurasi berhasil diperbarui!"** 🎉

**Catatan:**
- Data akan di-UPDATE, bukan INSERT baru
- ID config tetap sama, hanya data yang berubah
- Timestamp `updated_at` otomatis terupdate

---

### 2. **Lihat Riwayat/History Konfigurasi**
Semua perubahan konfigurasi tersimpan sebagai backup!

**Cara Menggunakan:**
1. Klik tombol **"Riwayat"** (icon jam) di kanan atas
2. Modal akan muncul menampilkan:
   - ✅ Config yang aktif (highlight hijau)
   - 📋 10 config terakhir
   - 📍 Detail: Nama lokasi, GPS, radius, WiFi
   - 📅 Tanggal dibuat

**Info yang Ditampilkan:**
```
📍 SMK Fithrah Insani (Aktif)
📍 Lat: -6.123456, Lon: 106.789012
📏 Radius: 100m
📶 WiFi: SMKFI2025 (5G), SMKFI-Staff
Dibuat: 29 Nov 2025, 14:30:15
```

---

### 3. **Restore Backup Konfigurasi**
Bisa kembali ke konfigurasi sebelumnya kapan saja!

**Cara Menggunakan:**
1. Buka riwayat (tombol "Riwayat")
2. Pilih config yang ingin dipulihkan
3. Klik tombol **"Pulihkan"** (icon undo)
4. Konfirmasi: "Yakin ingin memulihkan konfigurasi ini?"
5. Klik **OK**
6. Config terpilih akan menjadi aktif ✅
7. Config sebelumnya masuk ke history

**Kapan Digunakan:**
- ❌ Salah ubah data → restore ke config sebelumnya
- 🔄 Testing berbeda lokasi → restore ke config asli
- 📂 Backup sebelum perubahan besar

---

## 🔧 API Endpoints

### **GET** `/api/admin/attendance/config`
Ambil config yang aktif
```json
{
  "success": true,
  "data": {
    "id": 1,
    "location_name": "SMK Fithrah Insani",
    "latitude": -6.123456,
    "longitude": 106.789012,
    "radius_meters": 100,
    "allowed_wifi_ssids": ["SMKFI2025 (5G)"],
    "is_active": true,
    "created_at": "2025-11-29T07:30:00Z",
    "updated_at": "2025-11-29T08:15:00Z"
  }
}
```

### **GET** `/api/admin/attendance/config?history=true`
Ambil semua config (history/backup)
```json
{
  "success": true,
  "data": [
    { "id": 3, "is_active": true, ... },   // Config aktif
    { "id": 2, "is_active": false, ... },  // Backup 1
    { "id": 1, "is_active": false, ... }   // Backup 2
  ]
}
```

### **POST** `/api/admin/attendance/config`
Simpan config (UPDATE jika ada, INSERT jika baru)
```json
// Request
{
  "location_name": "SMK Fithrah Insani",
  "latitude": -6.123456,
  "longitude": 106.789012,
  "radius_meters": 100,
  "allowed_wifi_ssids": ["SMKFI2025 (5G)"],
  "is_active": true
}

// Response
{
  "success": true,
  "data": { ... },
  "message": "Konfigurasi berhasil diperbarui" // atau "disimpan"
}
```

### **PUT** `/api/admin/attendance/config`
Restore backup config
```json
// Request
{
  "configId": 2
}

// Response
{
  "success": true,
  "data": { ... },
  "message": "Konfigurasi berhasil dipulihkan"
}
```

---

## 💡 Use Cases

### **Scenario 1: Setup Awal**
```
1. Admin buka /admin/attendance/settings
2. Belum ada config → badge "Sudah Dikonfigurasi" tidak muncul
3. Isi form → Save
4. Toast: "Konfigurasi berhasil disimpan!"
5. Badge muncul ✅
```

### **Scenario 2: Edit Config**
```
1. Admin lihat config lama: Radius 100m
2. Ubah radius jadi 150m
3. Save
4. Toast: "Konfigurasi berhasil diperbarui!"
5. Data terupdate, tidak duplikat ✅
```

### **Scenario 3: Testing & Rollback**
```
1. Admin punya config: SMK Fithrah (Lat: -6.123, Lon: 106.789)
2. Mau test lokasi baru → Edit jadi: SMK Cabang 2 (Lat: -6.456, Lon: 106.012)
3. Save → Config lama masuk history
4. Test absensi di lokasi baru
5. Gagal/tidak cocok → Klik "Riwayat"
6. Pilih config lama → Klik "Pulihkan"
7. Kembali ke config asli ✅
```

### **Scenario 4: Audit Trail**
```
1. Kepala sekolah tanya: "Kapan lokasi absensi diubah?"
2. Admin buka "Riwayat"
3. Lihat timestamp semua perubahan
4. Info lengkap tersedia ✅
```

---

## 🎯 Benefits

✅ **Data Tidak Duplikat** - UPDATE mengganti data lama, bukan tambah baru  
✅ **History Lengkap** - Semua perubahan tercatat dengan timestamp  
✅ **Easy Rollback** - Bisa kembali ke config sebelumnya  
✅ **Audit Trail** - Tahu kapan dan apa yang berubah  
✅ **User Friendly** - UI clear dengan badge dan visual feedback  

---

## 🔒 Security

- ✅ Hanya role `super_admin`, `admin`, `osis` yang bisa akses
- ✅ Semua request butuh authentication
- ✅ Validasi input di frontend & backend
- ✅ RLS policies di Supabase tetap aktif

---

## 📱 Testing Checklist

### Setup Awal
- [ ] Buka halaman settings
- [ ] Isi form konfigurasi
- [ ] Save
- [ ] Lihat badge "Sudah Dikonfigurasi" muncul
- [ ] Data tersimpan di database ✅

### Edit Config
- [ ] Ubah nama lokasi
- [ ] Ubah koordinat GPS
- [ ] Ubah radius
- [ ] Tambah/hapus WiFi SSID
- [ ] Save
- [ ] Toast muncul "diperbarui"
- [ ] Data terupdate (tidak duplikat) ✅

### View History
- [ ] Klik tombol "Riwayat"
- [ ] Modal muncul
- [ ] Config aktif highlight hijau
- [ ] Semua backup terlihat
- [ ] Timestamp ditampilkan ✅

### Restore Backup
- [ ] Buka riwayat
- [ ] Pilih config lama
- [ ] Klik "Pulihkan"
- [ ] Konfirmasi popup
- [ ] Config terpilih jadi aktif
- [ ] Config sebelumnya masuk history ✅

---

## 🚀 Next Steps

Fitur sudah live! Tunggu 2-3 menit untuk Vercel deployment selesai, lalu:

1. **Clear cache** (Ctrl+Shift+R)
2. **Login** sebagai admin
3. **Test edit config** → Save → Lihat toast "diperbarui"
4. **Test history** → Klik "Riwayat" → Lihat semua backup
5. **Test restore** → Pilih backup → Pulihkan

Semua fitur siap digunakan! 🎉
