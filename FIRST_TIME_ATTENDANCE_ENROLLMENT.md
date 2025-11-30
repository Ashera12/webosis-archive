# FIRST-TIME ATTENDANCE ENROLLMENT SYSTEM

## 📋 Overview

Sistem absensi dengan enrollment otomatis pada absensi pertama:

1. **Absensi pertama** = Enrollment (ambil foto reference + biometrik)
2. **Absensi berikutnya** = Verifikasi dengan data tersimpan
3. **Re-enrollment** = Hanya dengan approval admin

---

## 🎯 Flow Diagram

```
┌─────────────────┐
│  User Login     │
└────────┬────────┘
         │
         v
┌─────────────────────────────┐
│ Check biometric_data table  │
└────────┬────────────────────┘
         │
         ├── Data exists? ──> YES ──┐
         │                          │
         └── NO ─────────────────┐  │
                                 │  │
              ┌──────────────────┘  │
              │                     │
              v                     v
    ┌──────────────────┐   ┌─────────────────┐
    │ ENROLLMENT MODE  │   │ VERIFICATION    │
    │                  │   │ MODE            │
    │ 1. Take photo    │   │                 │
    │ 2. Get biometric │   │ 1. Take selfie  │
    │ 3. Save to DB    │   │ 2. Verify AI    │
    │ 4. Submit attend │   │ 3. Check finger │
    └──────────────────┘   │ 4. Submit       │
                           └─────────────────┘
```

---

## 🗃️ Database Schema

### biometric_data Table Changes

```sql
ALTER TABLE biometric_data ADD COLUMN IF NOT EXISTS:

-- Track enrollment method
is_first_attendance_enrollment BOOLEAN DEFAULT FALSE

-- Re-enrollment control (admin only)
re_enrollment_allowed BOOLEAN DEFAULT FALSE
re_enrollment_reason TEXT
re_enrollment_approved_by UUID REFERENCES auth.users(id)
re_enrollment_approved_at TIMESTAMPTZ
```

---

## 🔄 Implementation

### 1. API: Check Enrollment Status

**Endpoint:** `GET /api/attendance/enrollment-status`

```typescript
// Returns:
{
  isEnrolled: boolean,
  enrollmentDate: string | null,
  isFirstAttendance: boolean,
  canReEnroll: boolean,
  reEnrollReason: string | null
}
```

### 2. Attendance Page Behavior

#### Scenario A: First Time (No biometric data)

```typescript
// Show enrollment UI
<EnrollmentMode>
  <Step1>📸 Ambil Foto Reference (untuk verifikasi selanjutnya)</Step1>
  <Step2>🔐 Register biometrik device</Step2>
  <Step3>✅ Submit absensi pertama</Step3>
</EnrollmentMode>
```

#### Scenario B: Already Enrolled

```typescript
// Show verification UI
<VerificationMode>
  <Step1>📸 Ambil Selfie</Step1>
  <Step2>🔍 AI Verification (compare dengan reference)</Step2>
  <Step3>🔐 Biometric check</Step3>
  <Step4>✅ Submit absensi</Step4>
</VerificationMode>
```

#### Scenario C: Re-enrollment Needed

```typescript
// Show re-enrollment request UI
<ReEnrollmentRequest>
  <Message>⚠️ Data biometrik Anda bermasalah</Message>
  <Action>
    Hubungi admin untuk approval re-enrollment
  </Action>
</ReEnrollmentRequest>
```

---

## 📝 API Changes

### `/api/attendance/submit` Modifications

```typescript
// Check enrollment status FIRST
const { data: biometric } = await supabase
  .from('biometric_data')
  .select('*')
  .eq('user_id', userId)
  .single();

if (!biometric) {
  // FIRST TIME - Save enrollment data
  await supabase.from('biometric_data').insert({
    user_id: userId,
    reference_photo_url: photoUrl,
    fingerprint_template: fingerprintHash,
    is_first_attendance_enrollment: true,
    enrollment_status: 'complete',
  });
  
  // Then save attendance
  await supabase.from('attendance').insert({
    user_id: userId,
    check_in_time: new Date(),
    photo_url: photoUrl,
    is_enrollment_attendance: true, // NEW FLAG
    // ... other fields
  });
  
  return { 
    success: true, 
    message: '✅ Enrollment berhasil! Absensi pertama tercatat.',
    isFirstTime: true 
  };
}

// ALREADY ENROLLED - Verify
const verified = await verifyBiometric({
  userId,
  photoUrl,
  fingerprintHash,
  referenceData: biometric
});

if (!verified) {
  return { 
    success: false, 
    error: 'Verifikasi biometrik gagal',
    needReEnrollment: true
  };
}

// Save attendance
await supabase.from('attendance').insert({
  user_id: userId,
  check_in_time: new Date(),
  photo_url: photoUrl,
  verification_score: verified.score,
  // ... other fields
});

return { 
  success: true, 
  message: '✅ Absensi berhasil!',
  isFirstTime: false 
};
```

---

## 🔐 Admin: Re-enrollment Approval

### Admin Panel: `/admin/attendance`

```typescript
// Allow admin to approve re-enrollment requests

async function approveReEnrollment(userId: string, reason: string) {
  await supabase
    .from('biometric_data')
    .update({
      re_enrollment_allowed: true,
      re_enrollment_reason: reason,
      re_enrollment_approved_by: adminId,
      re_enrollment_approved_at: new Date(),
    })
    .eq('user_id', userId);
}

// When user re-enrolls:
async function handleReEnrollment(userId: string, newData: any) {
  // Check if allowed
  const { data: biometric } = await supabase
    .from('biometric_data')
    .select('re_enrollment_allowed')
    .eq('user_id', userId)
    .single();
  
  if (!biometric?.re_enrollment_allowed) {
    throw new Error('Re-enrollment not allowed. Contact admin.');
  }
  
  // Clear old data, save new
  await supabase
    .from('biometric_data')
    .update({
      reference_photo_url: newData.photoUrl,
      fingerprint_template: newData.fingerprint,
      re_enrollment_allowed: false, // Reset flag
      updated_at: new Date(),
    })
    .eq('user_id', userId);
}
```

---

## 🎨 UI/UX Messages

### First Time User:
```
🎉 Selamat datang!

Ini adalah absensi pertama Anda.
Kami akan mengambil foto reference dan data biometrik Anda.

Data ini akan digunakan untuk verifikasi absensi selanjutnya.

[📸 Mulai Enrollment]
```

### Returning User:
```
👋 Selamat datang kembali!

Silakan lakukan verifikasi untuk absensi hari ini.

[📸 Ambil Selfie untuk Verifikasi]
```

### Verification Failed:
```
❌ Verifikasi Gagal

Foto Anda tidak cocok dengan data reference.

Kemungkinan penyebab:
- Pencahayaan berbeda
- Sudut kamera berbeda
- Device berbeda

[🔄 Coba Lagi] [📞 Hubungi Admin]
```

### Re-enrollment Needed:
```
⚠️ Re-enrollment Diperlukan

Data biometrik Anda perlu diperbarui.
Silakan hubungi admin untuk approval.

Alasan: [Ganti device / Data corrupted / dll]

[📧 Request Re-enrollment]
```

---

## 🧪 Testing Checklist

### First Time Enrollment:
- [ ] User belum punya data di biometric_data
- [ ] Take photo sukses
- [ ] Fingerprint generated
- [ ] Data tersimpan ke biometric_data
- [ ] Attendance record dibuat dengan flag is_enrollment_attendance=true
- [ ] Success message ditampilkan

### Subsequent Attendance:
- [ ] User sudah punya data di biometric_data
- [ ] Take selfie sukses
- [ ] AI verification compare dengan reference photo
- [ ] Fingerprint match check
- [ ] Attendance record dibuat
- [ ] Success message ditampilkan

### Re-enrollment Flow:
- [ ] Verification gagal multiple times
- [ ] User request re-enrollment
- [ ] Admin approve re-enrollment
- [ ] User bisa update data biometrik
- [ ] New data tersimpan
- [ ] Attendance sukses dengan data baru

---

## 📊 Database Queries

### Check if user enrolled:
```sql
SELECT 
  id,
  user_id,
  reference_photo_url,
  fingerprint_template,
  is_first_attendance_enrollment,
  re_enrollment_allowed,
  created_at
FROM biometric_data
WHERE user_id = $1;
```

### Get first attendance record:
```sql
SELECT *
FROM attendance
WHERE user_id = $1
AND is_enrollment_attendance = TRUE
ORDER BY created_at ASC
LIMIT 1;
```

### Admin: Users needing re-enrollment:
```sql
SELECT 
  u.name,
  u.email,
  b.re_enrollment_reason,
  b.updated_at
FROM biometric_data b
JOIN users u ON u.id = b.user_id
WHERE b.re_enrollment_allowed = FALSE
AND b.reference_photo_url IS NOT NULL
-- Users who failed verification multiple times
AND EXISTS (
  SELECT 1 FROM attendance a
  WHERE a.user_id = b.user_id
  AND a.status = 'failed_verification'
  AND a.created_at > NOW() - INTERVAL '7 days'
  GROUP BY a.user_id
  HAVING COUNT(*) >= 3
);
```

---

## ✅ Success Criteria

1. **No redirect loop** - User tidak bolak-balik enrollment/attendance
2. **First time = enrollment** - Data biometrik diambil saat absensi pertama
3. **Subsequent = verification** - Compare dengan data tersimpan
4. **Admin control** - Re-enrollment hanya dengan approval
5. **Clear UX** - User tahu apakah enrollment atau verification
6. **Secure** - Data biometrik terenkripsi dan protected

---

## 🚀 Deployment Steps

1. Run SQL migration: `add_re_enrollment_flags.sql`
2. Update attendance submit API (enrollment logic)
3. Update attendance page (conditional UI)
4. Add admin re-enrollment panel
5. Test all scenarios
6. Deploy to production

---

**Status:** 📝 Design Complete - Ready for Implementation
