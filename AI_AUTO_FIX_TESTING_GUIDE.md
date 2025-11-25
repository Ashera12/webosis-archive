# AI Auto-Fix System - Quick Testing Guide

## 🎯 Sistem Selesai!

AI Auto-Fix system sudah **fully implemented** dengan komponen berikut:

### ✅ Completed Components

1. **Database Schema** (`supabase-error-monitoring.sql`)
   - Table `error_logs` dengan semua field monitoring
   - Indexes untuk performance
   - Auto-cleanup function (30 hari retention)

2. **Error Monitoring Library** (`lib/errorMonitoring.ts`)
   - `logError()` - Log error ke database
   - `getRecentErrors()` - Ambil error list dengan filter
   - `updateErrorAnalysis()` - Update AI analysis result
   - `markErrorFixed()` - Mark error as resolved

3. **API Endpoints**
   - `GET /api/admin/errors` - List errors dengan filter
   - `POST /api/admin/errors` - AI analyze error dengan OpenAI
   - `POST /api/admin/errors/fix` - Apply fix suggestions

4. **Auto-Capture Mechanisms**
   - `app/error.tsx` - Global error boundary untuk runtime errors
   - `app/not-found.tsx` - Auto-log 404 pages
   - `lib/apiErrorHandler.ts` - Wrapper untuk API route errors

5. **Admin UI** (`app/admin/errors/page.tsx`)
   - Error list dengan filter
   - AI analysis trigger
   - One-click fix application
   - Fix status tracking

---

## 🚀 Cara Testing End-to-End

### Step 1: Setup Database

```bash
# Run migration di Supabase SQL Editor
# Copy isi supabase-error-monitoring.sql dan execute
```

### Step 2: Pastikan OpenAI API Key Configured

Di admin settings atau ENV:
```env
OPENAI_API_KEY=sk-...
```

### Step 3: Test Error Logging

#### Test A: Runtime Error
```typescript
// Di any page, trigger error
throw new Error('Test runtime error for monitoring');
```
Harusnya:
- Error boundary muncul
- Error logged ke error_logs table
- Bisa dilihat di /admin/errors

#### Test B: 404 Page
```
# Buka URL random yang tidak exist
http://localhost:3000/test-404-monitoring
```
Harusnya:
- 404 page muncul
- Error logged dengan errorType='404_page'

#### Test C: API Error
Wrap API route dengan error handler:
```typescript
import { withErrorLogging } from '@/lib/apiErrorHandler';

export const POST = withErrorLogging(async (req) => {
  throw new Error('Test API error');
});
```
Call endpoint, harusnya error logged.

### Step 4: Test AI Analysis

1. Buka `/admin/errors`
2. Klik "Analyze dengan AI" pada error
3. Tunggu OpenAI response (5-10 detik)
4. Check AI analysis dengan fix suggestions muncul

### Step 5: Test Auto-Fix Application

1. Di error yang sudah di-analyze
2. Review fix suggestion
3. Klik "Apply Fix"
4. Check:
   - File created/modified sesuai suggestion
   - admin_actions table ada log
   - Error status = 'fix_applied'

---

## 🔐 Security Checklist

- ✅ Only super_admin can access /admin/errors
- ✅ ALLOW_ADMIN_OPS must be enabled untuk apply fix
- ✅ Whitelisted directories: `app/`, `components/`, `lib/`
- ✅ Whitelisted commands: `npm install`, `pnpm install`
- ✅ Config files: `next.config.js`, `tailwind.config.ts`, dll

---

## 🛠️ Fix Types yang Supported

### 1. `create_file`
```json
{
  "type": "create_file",
  "filePath": "app/test/page.tsx",
  "code": "export default function Page() { return <div>Test</div>; }",
  "description": "Create missing page component"
}
```

### 2. `code_patch`
```json
{
  "type": "code_patch",
  "filePath": "app/api/test/route.ts",
  "code": "// New code to replace old",
  "description": "Fix import statement"
}
```

### 3. `dependency_install`
```json
{
  "type": "dependency_install",
  "command": "npm install react-icons",
  "description": "Install missing dependency"
}
```

### 4. `config_change`
```json
{
  "type": "config_change",
  "filePath": "next.config.js",
  "changes": {"experimental": {"appDir": true}},
  "description": "Enable app directory"
}
```

---

## 📊 Monitoring Best Practices

### Auto-Capture Sudah Enable:
- ✅ Runtime errors (via error.tsx)
- ✅ 404 pages (via not-found.tsx)
- ✅ API errors (via apiErrorHandler wrapper)

### Manual Logging:
Untuk custom error tracking:
```typescript
import { logError } from '@/lib/errorMonitoring';

try {
  // risky operation
} catch (e: any) {
  await logError({
    errorType: 'api_error',
    url: '/custom-operation',
    method: 'POST',
    statusCode: 500,
    errorMessage: e.message,
    errorStack: e.stack,
    context: { customData: 'whatever' },
  });
}
```

---

## 🎯 Expected AI Analysis Output

OpenAI akan return JSON:
```json
{
  "errorType": "runtime_error",
  "rootCause": "Missing import statement for React",
  "severity": "high",
  "fixSuggestions": [
    {
      "type": "code_patch",
      "filePath": "app/test/page.tsx",
      "code": "import React from 'react';",
      "description": "Add missing React import"
    }
  ],
  "preventionTips": [
    "Always import React in component files",
    "Use ESLint to catch missing imports"
  ],
  "estimatedImpact": "Page will render correctly after fix"
}
```

---

## 🔄 Error Lifecycle

```
1. Error occurs
   ↓
2. Auto-logged via error.tsx / not-found.tsx / apiErrorHandler
   ↓
3. Admin sees in /admin/errors (fix_status='pending')
   ↓
4. Admin clicks "Analyze dengan AI"
   ↓
5. OpenAI analyzes → returns fix suggestions (fix_status='fix_suggested')
   ↓
6. Admin reviews, clicks "Apply Fix"
   ↓
7. System applies fix (create file/patch code/install dep/update config)
   ↓
8. Error marked as fixed (fix_status='fix_applied')
```

---

## ⚠️ Known Limitations

1. **Code Patch**: Currently writes entire file (not AST-based patching)
   - Safe untuk new files
   - Risky untuk editing existing complex files
   
2. **Security**: Whitelisted paths only
   - Cannot create files outside app/components/lib
   - Cannot run arbitrary shell commands
   
3. **AI Quality**: Depends on OpenAI response quality
   - May suggest incorrect fixes
   - Always review before applying

---

## 📝 Next Enhancements (Optional)

- [ ] Background scheduler untuk auto-apply low severity fixes
- [ ] AST-based code patching untuk safer edits
- [ ] Error grouping/deduplication
- [ ] Slack/Email notifications untuk critical errors
- [ ] Fix rollback mechanism
- [ ] More granular permission control

---

## ✅ System Ready!

Semua komponen sudah implemented. Tinggal:
1. Run migration `supabase-error-monitoring.sql`
2. Set OpenAI API key
3. Test dengan trigger error
4. Analyze dan apply fix

**Sistem AI Auto-Fix siap digunakan!** 🎉
