# 🔧 QUICK FIX: Database Column Missing

## ❌ Error
```
Could not find the 'webauthn_credential_id' column of 'user_biometric' in the schema cache
```

## ✅ Solution (1 minute)

### Step 1: Run SQL in Supabase

1. **Go to Supabase Dashboard**: https://mhefqwregrldvxtqqxbb.supabase.co
2. **Navigate to**: SQL Editor (left sidebar)
3. **Copy-paste this SQL**:

```sql
-- Add webauthn_credential_id column (nullable for AI-only mode)
ALTER TABLE user_biometric 
ADD COLUMN IF NOT EXISTS webauthn_credential_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_biometric_webauthn_credential 
ON user_biometric(webauthn_credential_id);
```

4. **Click "Run"** (or press Ctrl+Enter)
5. **Done!** Column added.

### Step 2: Test Biometric Setup

1. Refresh page: https://osissmktest.biezz.my.id/attendance
2. Click "Daftar Biometric"
3. Capture photo
4. **Should work now!** ✅

## 📊 Expected Result

**Console log (SUCCESS):**
```
[Upload] ✅ Upload successful
[Setup] Mode: AI-only
[Setup] Setup payload: {
  referencePhotoUrl: "https://...",
  fingerprintTemplate: "0a497eb3...",
  webauthnCredentialId: null  ← NULL is OK for AI-only mode
}
[Setup] ✅ Setup biometric berhasil!
```

## 🔍 What This Column Does

- **Stores**: WebAuthn credential ID (for Windows Hello, Face ID, etc.)
- **Value**: 
  - String = WebAuthn + AI mode (optimal)
  - NULL = AI-only mode (fallback, masih berfungsi sempurna!)
- **Required**: NO (nullable, karena AI-only mode tidak butuh)

## 📝 Complete Schema

After running the SQL, your `user_biometric` table will have:

```sql
CREATE TABLE user_biometric (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  reference_photo_url TEXT NOT NULL,
  fingerprint_template TEXT NOT NULL,
  webauthn_credential_id TEXT,  ← NEW COLUMN
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## ✅ Verification

Check if column exists:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_biometric' 
  AND column_name = 'webauthn_credential_id';
```

Expected result:
```
column_name             | data_type | is_nullable
webauthn_credential_id  | text      | YES
```

## 🚀 After Fix

System will work in 2 modes:

### Mode 1: WebAuthn + AI ✅
- User allows Windows Hello/Face ID
- `webauthn_credential_id` = "abc123..."
- Best security

### Mode 2: AI-only ✅
- User cancels/skips WebAuthn
- `webauthn_credential_id` = NULL
- Still 100% functional with AI verification

**Both modes are fully supported!** No errors.

## 📞 Still Getting Errors?

1. **Clear Supabase cache**: 
   - Dashboard > Settings > API > Reload schema cache
   
2. **Check RLS policies**:
   ```sql
   SELECT * FROM user_biometric WHERE user_id = auth.uid();
   ```

3. **Restart Next.js** (if running locally):
   ```bash
   npm run dev
   ```

4. **Check browser console** for updated errors

---

**File**: `ADD_WEBAUTHN_COLUMN.sql` contains the complete SQL script.
