# 🔍 Comment System Troubleshooting Guide

## Error 500: Failed to load resource /api/comments

### Kemungkinan Penyebab & Solusi

#### 1. **Database Belum Setup** ⚠️ (Paling Umum)

**Cek:**
```sql
-- Di Supabase SQL Editor
SELECT * FROM comments LIMIT 1;
```

**Jika error "relation does not exist":**
✅ **Solusi:** Jalankan SQL files:
1. `create_comments_table.sql`
2. `update_comments_with_replies_likes.sql`
3. `add_comment_update_policy.sql`

**Verifikasi tabel ada:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('comments', 'comment_likes');
```
Expected: 2 rows

---

#### 2. **Environment Variables Missing** 🔐

**Cek file `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**Cara mendapat keys:**
1. Buka Supabase Dashboard → Settings → API
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY` (secret!)

**After update .env.local:**
```bash
# Restart dev server
npm run dev
```

---

#### 3. **RLS Policy Blocking Insert** 🚫

**Test manual insert di Supabase:**
```sql
INSERT INTO comments (content_id, content_type, content, author_name, is_anonymous)
VALUES ('test-123', 'post', 'Test comment', 'Test User', false)
RETURNING *;
```

**Jika error "new row violates row-level security policy":**

**Fix:** Drop dan recreate policy
```sql
-- Drop existing policy
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;

-- Recreate dengan WITH CHECK (true)
CREATE POLICY "Anyone can create comments"
  ON comments
  FOR INSERT
  WITH CHECK (true);
```

**Verify policy:**
```sql
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'comments' AND cmd = 'INSERT';
```
Expected: `with_check = true`

---

#### 4. **Column parent_id Missing** ❌

**Error di console:** "column parent_id does not exist"

**Check:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'comments' AND column_name = 'parent_id';
```

**Jika tidak ada:**
```sql
ALTER TABLE comments 
ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
```

---

#### 5. **Auth Function Error** 🔑

**Error:** "auth() is not a function" atau "Cannot read property 'user'"

**Check `lib/auth.ts`:**
```typescript
export async function auth() {
  // Should return session or null
}
```

**Quick fix di API:**
```typescript
// Temporary fallback
const session = await auth().catch(() => null);
```

---

#### 6. **CORS / Network Issues** 🌐

**Error di browser console:** "CORS policy" atau "net::ERR_BLOCKED"

**Check:**
1. Supabase project status (not paused?)
2. URL correct (no typos in .env.local)
3. Browser dev tools → Network tab → check request details

**Test API directly:**
```bash
# PowerShell
curl http://localhost:3000/api/comments?contentId=test&contentType=post
```

Expected: JSON response (not HTML error page)

---

## Debug Checklist ✅

Run this in order:

### Step 1: Check Database
```sql
-- 1. Tables exist?
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('comments', 'comment_likes');
-- Expected: 2 rows

-- 2. Columns correct?
SELECT column_name FROM information_schema.columns
WHERE table_name = 'comments'
ORDER BY ordinal_position;
-- Expected: id, content_id, content_type, content, author_name, 
--           author_id, is_anonymous, created_at, updated_at, parent_id

-- 3. RLS policies?
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'comments';
-- Expected: 4 policies (SELECT, INSERT, DELETE, UPDATE)

-- 4. Can insert manually?
INSERT INTO comments (content_id, content_type, content, author_name, is_anonymous)
VALUES ('test', 'post', 'test', 'Test', false)
RETURNING *;
-- Expected: 1 row returned
-- Cleanup: DELETE FROM comments WHERE content_id = 'test';
```

### Step 2: Check Environment
```bash
# In PowerShell at project root
Get-Content .env.local | Select-String "SUPABASE"
```
Expected: 3 lines with SUPABASE

### Step 3: Check Server Logs
```bash
# Run dev server dan watch console
npm run dev
```

**When submitting comment, look for:**
```
[Comments API] POST request started
[Comments API] Session: Anonymous
[Comments API] Request body: { contentId: ..., content: ... }
[Comments API] Inserting comment: { ... }
[Comments API] Comment created successfully: uuid
```

**Jika ada error, akan muncul:**
```
[Comments API] Supabase error: { message: "..." }
```

### Step 4: Test API with Postman/curl

**Test POST:**
```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "test-123",
    "contentType": "post",
    "content": "Test comment dari curl",
    "authorName": "Test User"
  }'
```

Expected response:
```json
{
  "comment": {
    "id": "uuid",
    "content": "Test comment dari curl",
    "author_name": "Test User",
    ...
  }
}
```

**Test GET:**
```bash
curl "http://localhost:3000/api/comments?contentId=test-123&contentType=post"
```

Expected: Array of comments

---

## Common Error Messages & Fixes

### "Failed to load resource: 500"
**Check:** Server logs untuk detail error
**Usually:** Database table not exist atau RLS blocking

### "Gagal menambahkan komentar"
**Check:** Toast notification atau browser console
**Usually:** Missing required field atau auth error

### "relation comments does not exist"
**Fix:** Run `create_comments_table.sql`

### "column parent_id does not exist"
**Fix:** Run `update_comments_with_replies_likes.sql`

### "new row violates row-level security"
**Fix:** Check INSERT policy = `WITH CHECK (true)`

### "Missing SUPABASE_SERVICE_ROLE_KEY"
**Fix:** Add to `.env.local` dan restart server

### "Cannot read property 'user' of null"
**Fix:** Auth session handling di API
```typescript
const session = await auth();
const userId = session?.user?.id || null; // Safe access
```

---

## Quick Recovery Steps

**If everything broken, reset clean:**

### 1. Database Reset
```sql
-- Drop tables
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;

-- Recreate
-- (run all 3 SQL files in order)
```

### 2. Environment Reset
```bash
# Delete .env.local
Remove-Item .env.local

# Create new
New-Item .env.local

# Add vars (get from Supabase dashboard)
```

### 3. Code Reset
```bash
# Pull latest from main
git pull origin main

# Clean install
Remove-Item -Recurse node_modules
npm install
```

### 4. Test Clean
```bash
npm run dev
# Open http://localhost:3000
# Try submit comment
```

---

## Working Setup Checklist

Before asking for help, verify:

- ✅ Tables `comments` and `comment_likes` exist
- ✅ Column `parent_id` exists in comments
- ✅ RLS enabled on both tables
- ✅ INSERT policy = `WITH CHECK (true)`
- ✅ `.env.local` has all 3 SUPABASE_ vars
- ✅ Server restart after .env change
- ✅ No TypeScript errors in terminal
- ✅ Browser console shows request to `/api/comments`
- ✅ Server logs show `[Comments API]` messages

If all ✅ and still error 500:
→ Check server logs for exact Supabase error message
→ Share error message for specific help

---

## Test Data for Debugging

**Insert test comment directly:**
```sql
INSERT INTO comments (
  id,
  content_id,
  content_type,
  content,
  author_name,
  author_id,
  is_anonymous,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test-post-1',
  'post',
  'This is a test comment for debugging',
  'Debug User',
  null,
  true,
  NOW(),
  NOW()
) RETURNING *;
```

**Verify dalam UI:**
- Buka page dengan contentId = 'test-post-1'
- Click comment icon
- Should see "This is a test comment for debugging"

**Cleanup:**
```sql
DELETE FROM comments WHERE content_id = 'test-post-1';
```

---

## Still Not Working?

**Share this info:**
1. Server logs (copy `[Comments API]` messages)
2. Browser console errors (full stack trace)
3. Supabase error message (if any)
4. Which SQL files already run?
5. Environment check result

**Example good report:**
```
Error: 500 when submitting comment

Server log:
[Comments API] POST request started
[Comments API] Session: Anonymous
[Comments API] Supabase error: { 
  message: "relation comments does not exist" 
}

SQL files run: ✅ create_comments_table.sql

Browser console:
POST /api/comments 500 (Internal Server Error)
```

This helps diagnose exact problem! 🎯
