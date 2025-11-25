# Quick Testing Guide - Settings & Terminal Fixes

## 🧪 Testing Checklist

### CRITICAL BUG FIX: API Key Corruption

#### Test 1: Save New API Key
```bash
# 1. Buka browser: http://localhost:3001/admin/settings
# 2. Scroll ke form bawah
# 3. Isi OPENAI_API_KEY dengan: sk-test-1234567890abcdef
# 4. Klik "Simpan Settings"
# 5. Lihat message: "✅ Settings tersimpan ke database! (X keys updated)"
# 6. Klik "🔍 Verify Database Values"
# 7. Check JSON result:
```

Expected Result:
```json
{
  "success": true,
  "values": {
    "OPENAI_API_KEY": {
      "value": "sk-test-1234567890abcdef",  // ✅ EXACT match
      "is_secret": true,
      "updated_at": "2025-01-...",
      "length": 27  // ✅ Correct length
    }
  }
}
```

❌ **OLD BUG**: Value corrupted atau menjadi "***"
✅ **FIX EXPECTED**: Value tersimpan persis seperti yang diinput

---

#### Test 2: Multiple API Keys
```bash
# 1. Isi 3 API keys sekaligus:
#    - OPENAI_API_KEY: sk-openai-test-123
#    - ANTHROPIC_API_KEY: sk-ant-test-456
#    - GEMINI_API_KEY: AIza-gemini-test-789
# 2. Save
# 3. Verify
# 4. Refresh page
# 5. Check input fields masih terisi (TIDAK jadi ***)
```

Expected:
- ✅ All 3 keys tersimpan utuh
- ✅ Form values tidak di-overwrite dengan ***
- ✅ Refresh page → values masih ada

---

### FEATURE: Terminal Token Caching

#### Test 3: RAW Terminal Token Cache
```bash
# 1. Buka /admin/settings
# 2. Enable "ALLOW_UNSAFE_TERMINAL" toggle
# 3. Buka /admin → scroll ke Terminal Runner
# 4. Verify: "RAW MODE AKTIF" section muncul
# 5. Masukkan command: node -v
# 6. Klik "Run RAW"
# 7. Confirm: "Jalankan RAW command..."
# 8. Prompt: "Masukkan ADMIN_OPS_TOKEN"
# 9. Masukkan token dari database (check ADMIN_OPS_TOKEN value)
# 10. Command execute → see output
# 11. Masukkan command kedua: npm -v
# 12. Klik "Run RAW"
# 13. ✅ CHECK: TIDAK diminta token lagi!
```

Expected:
- ✅ Token diminta hanya sekali per session
- ✅ Command kedua langsung execute
- ✅ Button "Clear Token" muncul

#### Test 4: Token Cache Clear
```bash
# 1. (Lanjutan dari test 3)
# 2. Klik button "Clear Token"
# 3. Alert: "Token cache cleared..."
# 4. Masukkan command: ls
# 5. Klik "Run RAW"
# 6. ✅ CHECK: Diminta token lagi
```

Expected:
- ✅ Token di-clear dari sessionStorage
- ✅ Next command meminta token baru

---

### FEATURE: Database Verification

#### Test 5: Verify Endpoint
```bash
# PowerShell test:
Invoke-WebRequest http://localhost:3001/api/admin/settings/verify | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

Expected Response:
```json
{
  "success": true,
  "values": {
    "ALLOW_ADMIN_OPS": {
      "value": "true",
      "is_secret": false,
      "updated_at": "...",
      "length": 4
    },
    "ADMIN_OPS_TOKEN": {
      "value": "actual-token-value",
      "is_secret": true,
      "updated_at": "...",
      "length": 32
    }
  },
  "timestamp": "2025-01-..."
}
```

---

## 🐛 Bug Regression Tests

### Check: No More Corruption
```bash
# Scenario: Update hanya satu field
# 1. Verify current DB state
# 2. Update ONLY OPENAI_API_KEY
# 3. Save
# 4. Verify again
# 5. ✅ CHECK: Other fields tidak berubah
```

### Check: Partial Updates
```bash
# 1. Form memiliki 10 fields
# 2. Isi hanya 2 fields
# 3. Save
# 4. Message: "X keys updated" → should be 2
# 5. Verify: Hanya 2 keys yang ada di DB
```

### Check: Empty Fields Skip
```bash
# 1. Isi field dengan value
# 2. Delete value (kosongkan)
# 3. Save
# 4. ✅ CHECK: Empty field TIDAK update DB
# 5. Previous value tetap tersimpan
```

---

## 🔍 Manual Database Check (Optional)

```sql
-- Via Supabase SQL Editor:
SELECT 
  key,
  value,
  is_secret,
  length(value) as value_length,
  updated_at
FROM admin_settings
ORDER BY key;
```

Expected:
- All API keys have correct length
- No values = "***"
- No corrupted/random characters

---

## 📊 Success Criteria

✅ **API Key Corruption**: FIXED
- [x] Keys tersimpan utuh tanpa corruption
- [x] Masked values tidak overwrite user input
- [x] Partial updates tidak affect other keys

✅ **Terminal Token Cache**: IMPLEMENTED
- [x] Token diminta hanya sekali per session
- [x] sessionStorage caching works
- [x] Clear token button functional
- [x] Auto-clear on auth error

✅ **Verification Tool**: WORKING
- [x] Verify endpoint returns RAW values
- [x] UI button shows database state
- [x] Metadata (length, updated_at) displayed

---

## 🚨 Known Issues to Monitor

1. **Verify endpoint tidak ada auth** - Siapapun bisa akses
   - TODO: Add `requireSuperAdmin()` check
   
2. **sessionStorage tidak aman** - Token visible di DevTools
   - OK untuk development
   - Production: gunakan httpOnly cookie

3. **No visual feedback untuk cached token**
   - TODO: Show "🔓 Token cached" indicator
   - TODO: Show token expiry time

---

## 📝 Next Actions (After Testing)

If all tests pass:
1. ✅ Mark FIX_SUMMARY.md as verified
2. Update CHANGELOG.md
3. Commit changes dengan message: "fix: API key corruption & terminal token caching"
4. Test in production environment
5. Monitor error logs for any issues

If tests fail:
1. Document failure scenario
2. Check browser console for errors
3. Check terminal output for API errors
4. Review fix logic in affected files
