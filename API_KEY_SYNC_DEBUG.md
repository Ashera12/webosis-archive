# 🔧 API Key Sync - Debugging & Testing Guide

## ✅ Fixes Applied

### 1. **Filter Logic Fixed** (`app/api/admin/settings/route.ts`)
- **Before**: Skip jika value contains `***` atau starts with `***`
- **After**: Skip HANYA jika value PERSIS `***` (exact match)
- **Why**: API keys bisa mengandung `***` di tengah (misal: `sk-proj-abc***def`)

### 2. **Enhanced Logging** (`lib/adminConfig.ts` & `app/api/admin/settings/route.ts`)
- Show value preview: `AIzaSyDW... (39 chars)`
- Show source: `[getConfig] Using DB value` or `Using ENV fallback`
- Show what will be saved: `Will save GEMINI_API_KEY: AIzaSyDW... (39 chars)`

---

## 🧪 Testing Steps

### Step 1: Check Current Database State

```sql
-- Check semua API keys di database
SELECT 
  key, 
  LEFT(value, 15) || '...' as value_preview, 
  LENGTH(value) as value_length,
  is_secret,
  updated_at
FROM admin_settings 
WHERE key LIKE '%API_KEY%'
ORDER BY key;
```

Expected result:
- Kalau kosong → API keys belum di-save ke database
- Kalau ada → Pastikan `value_length > 0` dan bukan `***`

### Step 2: Test Save API Key via UI

1. **Buka Admin Settings**:
   ```
   http://localhost:3000/admin/settings
   ```

2. **Expand "AI & Automation" section**

3. **Isi salah satu API key**:
   - **OpenAI**: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Gemini**: `AIzaSyDWxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Anthropic**: `sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. **Klik "Simpan Perubahan"** (pojok kanan atas)

5. **Check Browser Console** untuk logs:
   ```
   [Settings] Saving settings: { count: X, keys: [...] }
   [/api/admin/settings] Will save GEMINI_API_KEY: AIzaSyDW... (39 chars)
   [/api/admin/settings] Filtered entries to save: [...]
   [/api/admin/settings] Save complete: { insertedCount: X, updatedCount: Y }
   ```

6. **Verify Success Message**:
   ```
   ✅ Settings tersimpan! X key diupdate.
   ```

### Step 3: Verify Database Saved

```sql
-- Check lagi setelah save
SELECT 
  key, 
  LEFT(value, 15) || '...' as value_preview, 
  LENGTH(value) as value_length,
  is_secret,
  updated_at
FROM admin_settings 
WHERE key IN ('OPENAI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY')
ORDER BY updated_at DESC;
```

Expected:
- `value_length > 30` (API keys biasanya 30+ chars)
- `is_secret = true`
- `updated_at` baru (just now)

### Step 4: Test AI Chat Uses Database Value

1. **Buka AI Chat Widget** (pojok kanan bawah)

2. **Send Test Message**: "Hello!"

3. **Check Browser Console**:
   ```
   [getConfig] Using DB value for GEMINI_API_KEY: AIzaSyDW... (39 chars)
   [AI] Available providers: { openai: false, gemini: true, anthropic: false }
   [AI] Using Gemini provider
   ```

4. **Should NOT see**:
   ```
   ❌ AI provider is not configured
   ❌ Incorrect API key provided
   ```

5. **Should see AI response** in chat

---

## 🐛 Debugging Common Issues

### Issue 1: "AI provider is not configured"

**Possible Causes**:
1. API key tidak tersimpan di database
2. API key format salah (tidak match pattern)
3. Nilai di database adalah `***`

**Debug Steps**:
```sql
-- Check database value
SELECT key, value, LENGTH(value) 
FROM admin_settings 
WHERE key LIKE '%API_KEY%';
```

**Check Console Logs**:
```
[getConfig] No value found for GEMINI_API_KEY  ← Key tidak ada di DB & .env
[getConfig] Using DB value for GEMINI_API_KEY: *** (3 chars)  ← Salah! Harusnya 30+ chars
```

**Fix**: Ulang Step 2 (save via UI)

### Issue 2: "Skipping masked/empty value"

**Meaning**: Value yang di-submit adalah `***` (tidak berubah dari load awal)

**Console Log**:
```
[/api/admin/settings] Skipping masked/empty value for GEMINI_API_KEY: "***"
```

**Fix**: 
- Pastikan user **benar-benar ketik/paste** API key baru
- Jangan submit tanpa ubah field (value tetap `***`)

### Issue 3: Value saved tapi AI tetap error

**Check Priority Order**:
```
[getConfig] Using ENV fallback for GEMINI_API_KEY: sk-proj-... (40 chars)
```

**Problem**: Masih pakai `.env`, bukan database

**Possible Causes**:
1. Database value kosong/null
2. Database connection error

**Debug**:
```sql
-- Pastikan value NOT NULL
SELECT key, value IS NULL as is_null, value = '' as is_empty
FROM admin_settings 
WHERE key = 'GEMINI_API_KEY';
```

**Fix**:
```sql
-- Force update di database
UPDATE admin_settings 
SET value = 'AIzaSyDWxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
WHERE key = 'GEMINI_API_KEY';
```

---

## 🎯 Quick Test Checklist

- [ ] API key di database (bukan `***`)
- [ ] Console log: `Using DB value for X_API_KEY: ... (30+ chars)`
- [ ] Console log: `Available providers: { ... true ... }`
- [ ] Console log: `Using X provider`
- [ ] AI chat responds (tidak error)
- [ ] Tidak ada message "not configured"

---

## 📊 Expected Console Flow

### On Settings Save:
```
[Settings] Saving settings: { count: 1, keys: ['GEMINI_API_KEY'] }
[/api/admin/settings] POST - Saving settings: { count: 1, keys: [...], secretKeys: [...] }
[/api/admin/settings] Will save GEMINI_API_KEY: AIzaSyDW... (39 chars)
[/api/admin/settings] Filtered entries to save: [{ key: 'GEMINI_API_KEY', is_secret: true }]
[/api/admin/settings] Inserting new keys: ['GEMINI_API_KEY']
[/api/admin/settings] Save complete: { insertedCount: 1, updatedCount: 0, total: 1 }
```

### On AI Chat Request:
```
[getConfig] Using DB value for GEMINI_API_KEY: AIzaSyDW... (39 chars)
[getConfig] No value found for OPENAI_API_KEY
[getConfig] No value found for ANTHROPIC_API_KEY
[AI] Available providers: { openai: false, gemini: true, anthropic: false }
[AI] Using Gemini provider
[Gemini] Request to: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
[Gemini] Response OK: true
```

---

## 🔄 If All Else Fails - Nuclear Reset

```sql
-- Delete all API keys
DELETE FROM admin_settings WHERE key LIKE '%API_KEY%';

-- Restart dev server
-- Restart browser (hard refresh)
-- Isi ulang API key via UI
```

---

## ✨ Success Indicators

1. **Database has valid key**: `LENGTH(value) > 30`
2. **Console shows DB usage**: `Using DB value for X_API_KEY`
3. **Provider auto-detected**: `Using X provider`
4. **AI responds**: No errors in chat
5. **No masked values saved**: No `*** (3 chars)` in logs

---

## 📝 Notes

- **Priority**: Database FIRST → .env fallback
- **Exception**: `ADMIN_OPS_TOKEN` always from `.env` (security)
- **Filter**: Only skip value if EXACTLY `***` (exact match, case-sensitive)
- **Logging**: All `getConfig()` calls log source and preview
- **Secrets**: Auto-detected by pattern `/KEY|TOKEN|SECRET|PASSWORD/i`
