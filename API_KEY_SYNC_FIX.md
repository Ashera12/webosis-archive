# 🐛 API Key Sync Fix - Critical Configuration Bug

## ❌ Masalah yang Terjadi

**Bug**: API key yang diupdate di `/admin/settings` tidak digunakan oleh sistem
- Error: `Incorrect API key provided: SuperAdm**123!`
- Padahal user sudah update API key di admin settings
- API tetap pakai key lama dari `.env.local`

**Root Cause**:
```typescript
// ❌ SALAH - Prioritas terbalik!
export async function getConfig(key: string) {
  // 1. Check .env FIRST
  if (process.env[key]) return process.env[key];  // ❌ Always returns old key!
  
  // 2. Check database SECOND (never reached if .env exists)
  const { data } = await db.select(...);
  return data?.value;
}
```

**Akibat**:
1. User update API key di admin settings → tersimpan ke database ✅
2. AI chat request → panggil `getConfig('OPENAI_API_KEY')` 
3. `getConfig` cek `.env.local` dulu → ada value lama → return value lama ❌
4. Database value baru tidak pernah dipakai! ❌

---

## ✅ Perbaikan yang Dilakukan

### 1. **Fix Priority Order di `lib/adminConfig.ts`**

**Before:**
```typescript
export async function getConfig(key: string) {
  // ❌ Wrong order!
  if (process.env[key]) return process.env[key];  // Check .env FIRST
  
  const { data } = await db.select(...);          // Check DB SECOND
  return data?.value;
}
```

**After:**
```typescript
export async function getConfig(key: string) {
  // Exception: ADMIN_OPS_TOKEN always from .env for security
  if (key === 'ADMIN_OPS_TOKEN' && process.env.ADMIN_OPS_TOKEN) {
    return process.env.ADMIN_OPS_TOKEN;
  }
  
  // ✅ CORRECT ORDER:
  // 1. Check DATABASE FIRST (allows live updates)
  const { data } = await db.select(...)
    .eq('key', key)
    .maybeSingle();
  
  if (data?.value) {
    console.log(`[getConfig] Using DB value for ${key}`);
    return data.value;  // ✅ Database has priority!
  }
  
  // 2. Fallback to .env SECOND (only if DB doesn't have it)
  if (process.env[key]) {
    console.log(`[getConfig] Using ENV fallback for ${key}`);
    return process.env[key];
  }
  
  return null;
}
```

**Priority Order (NEW):**
1. 🥇 **Database** (`admin_settings` table) - Live updates via UI
2. 🥈 **Environment** (`.env.local`) - Fallback only if DB empty
3. ⚠️ **Exception**: `ADMIN_OPS_TOKEN` always from `.env` (security)

### 2. **Fix Masked Value Filter di `app/api/admin/settings/route.ts`**

**Before:**
```typescript
// ❌ No filtering - saves '***' to database!
const entries = Object.entries(settings).map(([key, value]) => ({
  key,
  value: String(value ?? ''),
}));
```

**After:**
```typescript
// ✅ Filter out masked values
const filteredSettings = Object.entries(settings)
  .filter(([key, value]) => {
    const val = String(value ?? '').trim();
    // Skip empty, masked, or placeholder values
    if (!val || val === '***' || val === '...' || val.startsWith('***')) {
      console.log(`Skipping masked/empty value for ${key}`);
      return false;
    }
    return true;
  })
  .reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

// ✅ Auto-detect secrets
const entries = Object.entries(filteredSettings).map(([key, value]) => ({
  key,
  value: String(value),
  is_secret: secrets.includes(key) || /KEY|TOKEN|SECRET|PASSWORD/i.test(key),
}));
```

**Improvements:**
- ✅ Filter `***` values (don't save masked placeholders)
- ✅ Auto-detect secret keys by pattern
- ✅ Update `is_secret` flag on save
- ✅ Better logging for debugging

### 3. **Enhanced Logging**

Added console logs untuk debugging:
```typescript
console.log(`[getConfig] Using DB value for ${key}`);      // When DB used
console.log(`[getConfig] Using ENV fallback for ${key}`);  // When .env used
console.log(`[getConfig] No value found for ${key}`);      // When missing
```

---

## 🎯 How It Works Now

### **Scenario 1: First Time Setup (No DB Values)**
```
1. User opens /admin/settings
2. GET /api/admin/settings → returns '***' for secrets
3. User enters new API key: "sk-abc123..."
4. Click Save
5. POST /api/admin/settings → saves to database
6. AI chat request:
   ✅ getConfig('OPENAI_API_KEY') → checks DB first → finds "sk-abc123..."
   ✅ Uses new key!
```

### **Scenario 2: Update Existing Key**
```
1. Database has: OPENAI_API_KEY = "sk-old..."
2. .env.local has: OPENAI_API_KEY = "sk-even-older..."
3. User updates to: "sk-new123..."
4. Click Save
5. POST → database updated to "sk-new123..."
6. AI chat request:
   ✅ getConfig('OPENAI_API_KEY') → checks DB first → finds "sk-new123..."
   ✅ Uses new key! (.env ignored)
```

### **Scenario 3: Delete from DB (Use .env Fallback)**
```
1. Delete OPENAI_API_KEY from database
2. .env.local has: OPENAI_API_KEY = "sk-fallback..."
3. AI chat request:
   ✅ getConfig('OPENAI_API_KEY') → DB empty → fallback to .env
   ✅ Uses .env value as fallback
```

### **Scenario 4: Security Token (Always .env)**
```
1. ADMIN_OPS_TOKEN in .env.local = "secure-token-123"
2. User tries to save via UI (won't work, no field for it)
3. Any request:
   ✅ getConfig('ADMIN_OPS_TOKEN') → always returns .env value
   ✅ Security-critical tokens never from database
```

---

## 🔧 Testing Steps

### Test 1: Verify Priority Order
```bash
# 1. Set old key in .env.local
OPENAI_API_KEY=sk-old-key-from-env

# 2. Start dev server
npm run dev

# 3. Open /admin/settings
# 4. Update OPENAI_API_KEY to: sk-new-key-from-ui
# 5. Click Save
# 6. Open AI chat, send message

# Expected console logs:
[getConfig] Using DB value for OPENAI_API_KEY
# ✅ Should use sk-new-key-from-ui (not sk-old-key-from-env)
```

### Test 2: Verify Masked Values Not Saved
```bash
# 1. Open /admin/settings
# 2. See OPENAI_API_KEY = "***"
# 3. Click Save WITHOUT changing it
# 4. Check database:

SELECT key, value FROM admin_settings WHERE key = 'OPENAI_API_KEY';

# Expected: Original value unchanged (not '***')
```

### Test 3: Verify Fallback Works
```sql
-- 1. Delete from database
DELETE FROM admin_settings WHERE key = 'OPENAI_API_KEY';

-- 2. Ensure .env.local has:
OPENAI_API_KEY=sk-fallback-key

-- 3. Restart server and test AI chat

-- Expected console logs:
[getConfig] Using ENV fallback for OPENAI_API_KEY
-- ✅ Uses .env as fallback
```

### Test 4: End-to-End AI Chat
```bash
# 1. Update API key in /admin/settings
#    OPENAI_API_KEY = sk-proj-REAL-KEY-HERE

# 2. Click Save

# 3. Open AI chat widget

# 4. Send message: "Hello!"

# Expected:
# ✅ No "Incorrect API key" error
# ✅ AI responds successfully
# ✅ Console shows: [getConfig] Using DB value for OPENAI_API_KEY
```

---

## 📋 Checklist Fixes

- [x] Fix priority order in `lib/adminConfig.ts`
- [x] Database checked BEFORE environment variables
- [x] Exception for `ADMIN_OPS_TOKEN` (always .env)
- [x] Filter masked values (`***`) in POST handler
- [x] Auto-detect secret keys by pattern
- [x] Update `is_secret` flag on save
- [x] Enhanced console logging
- [x] No TypeScript errors
- [x] No compile errors

---

## 🚨 Breaking Changes

**None!** This is a bug fix with backward compatibility:
- ✅ Existing `.env.local` keys still work as fallback
- ✅ Database values now take priority (as intended)
- ✅ ADMIN_OPS_TOKEN behavior unchanged (always .env)

---

## 📊 Before vs After

### Before Fix:
```
Priority: .env.local > database
Result: Database updates ignored ❌
User Experience: Settings UI useless ❌
```

### After Fix:
```
Priority: database > .env.local
Result: Database updates used immediately ✅
User Experience: Settings UI works perfectly ✅
```

---

## 🎉 Summary

**Problem**: API key updates di admin settings tidak pernah dipakai

**Root Cause**: Priority order salah - `.env` dicek dulu sebelum database

**Solution**: 
1. ✅ Database priority > .env fallback
2. ✅ Filter masked values (`***`)
3. ✅ Enhanced logging
4. ✅ Auto-detect secrets

**Result**: Live configuration updates via UI now work! 🚀

---

## 📚 Related Files

- `lib/adminConfig.ts` - Config priority logic (FIXED)
- `app/api/admin/settings/route.ts` - Save endpoint (FIXED)
- `app/api/ai/chat/route.ts` - Uses getConfig (WORKS NOW)
- `app/admin/settings/page.tsx` - UI (already filters ***)

---

**Status**: ✅ **FIXED - API Key Sync Working**

Semua API keys yang diupdate di `/admin/settings` sekarang langsung dipakai oleh sistem tanpa perlu restart server!
