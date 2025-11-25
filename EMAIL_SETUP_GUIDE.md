# 📧 Panduan Setup Email (SendGrid)

## ⚠️ Masalah Saat Ini
Email verifikasi dan reset password **tidak terkirim** karena:
- SendGrid API key tidak valid/expired
- Atau email sender belum diverifikasi di SendGrid

---

## 🔧 Solusi: Setup SendGrid Baru

### Opsi 1: SendGrid (GRATIS - Recommended) ✅

SendGrid memberikan **100 email gratis per hari** selamanya.

#### Langkah-langkah:

**1. Daftar SendGrid**
- Buka: https://signup.sendgrid.com/
- Pilih **Free Plan** (100 emails/day forever)
- Verifikasi email Anda

**2. Verifikasi Sender Email**
- Login ke: https://app.sendgrid.com/
- Sidebar kiri → **Settings** → **Sender Authentication**
- Pilih **Single Sender Verification**
- Klik **Create New Sender**
- Isi form:
  ```
  From Name: OSIS SMKN 1
  From Email: bilaniumn1@gmail.com
  Reply To: bilaniumn1@gmail.com
  Company: SMKN 1
  Address: (alamat sekolah)
  City: (kota)
  Country: Indonesia
  ```
- Klik **Create**
- Cek inbox email `bilaniumn1@gmail.com`
- Klik **Verify Single Sender**

**3. Buat API Key**
- Sidebar kiri → **Settings** → **API Keys**
- Klik **Create API Key**
- Name: `webosis-production`
- API Key Permissions: **Full Access** (atau pilih **Restricted** → Mail Send saja)
- Klik **Create & View**
- **COPY API KEY** (hanya muncul sekali!)
  ```
  SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  ```

**4. Update .env.local**
```env
# Ganti dengan API key baru dari langkah 3
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Pastikan email sender sama dengan yang diverifikasi di langkah 2
SENDGRID_FROM=bilaniumn1@gmail.com
```

**5. Restart Development Server**
```powershell
# Stop server (Ctrl+C)
# Start lagi
npm run dev
```

**6. Test Email**
- Buka: http://localhost:3000/admin/forgot-password
- Masukkan email: `bilaniumn1@gmail.com`
- Klik **Kirim Link Reset**
- **Cek inbox** (atau spam folder)

---

### Opsi 2: Gmail SMTP (Alternatif) ⚡

Jika tidak mau pakai SendGrid, bisa pakai Gmail langsung.

#### Langkah-langkah:

**1. Enable 2-Step Verification di Gmail**
- Buka: https://myaccount.google.com/security
- Scroll ke **2-Step Verification** → Turn On

**2. Generate App Password**
- Buka: https://myaccount.google.com/apppasswords
- Name: `webosis`
- Klik **Create**
- COPY password 16 karakter (tanpa spasi)

**3. Update .env.local**
```env
# Kosongkan SendGrid
SENDGRID_API_KEY=

# Isi SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=bilaniumn1@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # App password dari langkah 2
SMTP_SECURE=false
```

**4. Restart dan Test**
```powershell
npm run dev
```

---

## 🧪 Testing Email

### Test 1: Forgot Password
```
1. Buka: http://localhost:3000/admin/forgot-password
2. Email: bilaniumn1@gmail.com
3. Klik "Kirim Link Reset"
4. Lihat console terminal → harus muncul:
   [mailer] Sent via SendGrid { to: 'bilaniumn1@gmail.com', subject: '...' }
5. Cek inbox email (atau spam)
```

### Test 2: Register User Baru
```
1. Buka: http://localhost:3000/admin/register
2. Isi form dengan email baru
3. Klik Register
4. Cek inbox → email verifikasi harus masuk
```

---

## 🔍 Debugging

### Jika email masih tidak masuk:

**1. Cek Console Terminal**
Saat kirim email, harus muncul log:
```
[mailer] Sent via SendGrid { to: '...', subject: '...' }
```

Jika muncul error:
```
[mailer] SendGrid error: ...
[mailer] SendGrid response: { ... }
```
→ Berarti API key masih salah atau sender belum diverifikasi

**2. Cek Spam Folder**
Email pertama sering masuk spam.

**3. Cek SendGrid Activity**
- https://app.sendgrid.com/
- Sidebar → **Activity**
- Lihat apakah email ter-deliver atau bounce

**4. Verifikasi Environment Variables**
```powershell
# Pastikan .env.local ter-load
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.SENDGRID_API_KEY)"
```

---

## ✅ Checklist

Setelah setup berhasil, pastikan:
- [ ] SendGrid sender email verified (cek email verifikasi)
- [ ] API key dibuat dengan permission Mail Send
- [ ] `.env.local` updated dengan API key baru
- [ ] Server di-restart
- [ ] Test forgot password → email masuk
- [ ] Test register → email verifikasi masuk
- [ ] Tidak ada error di console terminal

---

## 📝 Catatan Penting

1. **Sender Email HARUS Diverifikasi**
   - SendGrid tidak akan mengirim email jika sender belum verified
   - Cek inbox `bilaniumn1@gmail.com` untuk verification link

2. **API Key Permissions**
   - Minimal perlu: **Mail Send** permission
   - Untuk production: gunakan **Restricted Access** (lebih aman)

3. **Free Plan Limits**
   - SendGrid: 100 emails/day (cukup untuk development)
   - Gmail SMTP: 500 emails/day (free tier)

4. **Production Deployment**
   - Gunakan domain sendiri untuk sender email (lebih profesional)
   - Contoh: `noreply@osisskn1.sch.id`
   - Perlu setup domain authentication di SendGrid

---

## 🆘 Masih Bermasalah?

Jika masih tidak bisa kirim email, kirim screenshot:
1. Console terminal saat kirim email
2. SendGrid Activity page
3. File `.env.local` (sensor API key kalau share)
