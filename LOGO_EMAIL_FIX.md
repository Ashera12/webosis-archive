# 🖼️ Fix Logo Email & Anti-Spam

## ✅ Yang Sudah Diperbaiki

1. **Email sender name** → Sekarang tampil "OSIS SMK Informatika FI"
2. **Anti-spam headers** → Disable tracking di SendGrid
3. **Logo support** → Siap pakai URL public

---

## 🚀 Langkah Upload Logo (5 Menit)

### Pilih salah satu:

### OPSI 1: ImgBB (Paling Mudah) ⚡

**1. Upload Logo**
```
1. Buka: https://imgbb.com/
2. Klik "Start uploading"
3. Pilih file: public\images\logo-2.png
4. Wait upload...
5. Copy "Direct link" (klik tombol di sebelah URL)
   Contoh: https://i.ibb.co/abc123/logo-2.png
```

**2. Update .env.local**
```env
# Paste URL yang di-copy tadi
LOGO_URL=https://i.ibb.co/abc123/logo-2.png
```

**3. Restart Server**
```powershell
# Tekan Ctrl+C di terminal
npm run dev
```

**4. Test Kirim Email**
- Forgot password atau register user baru
- Cek inbox → logo harus muncul! ✅

---

### OPSI 2: Supabase Storage 🔒

**1. Create Public Bucket**
```
1. Buka: https://supabase.com/dashboard/project/mhefqwregrldvxtqqxbb
2. Klik "Storage" di sidebar
3. Klik "Create a new bucket"
4. Name: public-assets
5. ✅ Check "Public bucket"
6. Create bucket
```

**2. Upload Logo**
```
1. Klik bucket "public-assets"
2. Klik "Upload file"
3. Pilih: public\images\logo-2.png
4. Upload
5. Klik file yang ter-upload
6. Copy "Public URL"
   Contoh: https://mhefqwregrldvxtqqxbb.supabase.co/storage/v1/object/public/public-assets/logo-2.png
```

**3. Update .env.local**
```env
LOGO_URL=https://mhefqwregrldvxtqqxbb.supabase.co/storage/v1/object/public/public-assets/logo-2.png
```

**4. Restart & Test**

---

## 📧 Fix Spam Filter

### Sudah Otomatis Fix di Code ✅
- Sender name: "OSIS SMK Informatika FI"
- No tracking (anti-spam signal)
- Professional HTML template

### Setup SendGrid (Opsional tapi Recommended)

**1. Verify Single Sender**
```
1. Buka: https://app.sendgrid.com/
2. Settings → Sender Authentication
3. Klik "Verify a Single Sender"
4. Klik "Create New Sender"
5. Isi form:
   From Name: OSIS SMK Informatika FI
   From Email: bilaniumn1@gmail.com
   Reply To: bilaniumn1@gmail.com
   Company: SMKN Informatika Fithrah Insani
   Address: (alamat sekolah)
   City: (kota)
   Country: Indonesia
6. Submit
7. Cek inbox bilaniumn1@gmail.com → klik verify link
```

**2. Mark as "Not Spam" di Gmail**
```
1. Buka email OSIS di Gmail (yang di folder Spam)
2. Klik "Report not spam"
3. Atau drag email ke Inbox
4. Gmail akan "belajar" bahwa email dari OSIS bukan spam
```

**3. Domain Authentication (Advanced - Opsional)**
Kalau punya domain sendiri (contoh: osisskn1.sch.id):
```
1. Settings → Sender Authentication
2. Klik "Authenticate Your Domain"
3. Follow wizard (perlu akses DNS domain)
4. Setelah verify, email OSIS kredibilitas tinggi ✅
```

---

## 🧪 Testing

### Test 1: Forgot Password
```bash
1. http://localhost:3000/admin/forgot-password
2. Email: bilaniumn1@gmail.com
3. Kirim
4. Cek inbox (atau spam) → email harus muncul dengan:
   ✅ Sender: "OSIS SMK Informatika FI <bilaniumn1@gmail.com>"
   ✅ Logo OSIS muncul
   ✅ Button "Reset Kata Sandi" works
```

### Test 2: Register User
```bash
1. http://localhost:3000/admin/register
2. Isi form dengan email lain
3. Register
4. Cek inbox → email verifikasi dengan logo ✅
```

---

## 🔍 Troubleshooting

### Logo masih tidak muncul?

**1. Cek LOGO_URL di .env.local**
```powershell
# Harus diisi dengan URL public
LOGO_URL=https://i.ibb.co/xxxxx/logo-2.png
```

**2. Test URL di browser**
- Copy paste LOGO_URL ke browser
- Kalau logo muncul → URL valid ✅
- Kalau 404 → upload ulang

**3. Restart server**
```powershell
# Ctrl+C lalu
npm run dev
```

**4. Clear cache email client**
- Di Gmail: Ctrl+F5
- Atau buka di incognito/private mode

### Email masih masuk spam?

**1. Verify sender di SendGrid** (lihat langkah di atas)

**2. Warm up email**
- Kirim beberapa email ke diri sendiri
- Mark as "Not Spam" setiap kali
- Gmail akan adjust spam filter

**3. Cek spam score**
- Buka: https://www.mail-tester.com/
- Kirim test email ke alamat yang diberikan
- Fix semua yang score merah

**4. Avoid spam words**
- Jangan pakai kata: FREE, CLICK HERE, WIN, URGENT
- Pakai bahasa formal dan profesional

---

## 📝 Checklist

Setelah setup:
- [ ] Logo uploaded to ImgBB/Supabase
- [ ] LOGO_URL added to .env.local
- [ ] SENDGRID_FROM_NAME added to .env.local
- [ ] Server restarted
- [ ] Test forgot password → logo muncul
- [ ] Test register → logo muncul
- [ ] SendGrid sender verified
- [ ] Gmail marked "Not Spam"
- [ ] Email tidak masuk spam lagi

---

## 🎯 Final .env.local Example

```env
# =============== MAILER / SENDGRID =================
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM=bilaniumn1@gmail.com
SENDGRID_FROM_NAME=OSIS SMK Informatika FI

# Logo URL - PENTING! Harus URL public
LOGO_URL=https://i.ibb.co/abc123/logo-2.png

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=bilaniumn1@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_SECURE=false
```

---

## 🆘 Masih Bermasalah?

Screenshot dan share:
1. Email yang diterima (tunjukkan logo tidak muncul)
2. File .env.local (sensor API key)
3. Console terminal saat kirim email
4. LOGO_URL di browser (apakah logo muncul?)
