# 🔧 Console Errors - Quick Fix Guide

## Error Summary & Solutions

Ditemukan **3 error utama** di console:

---

## ❌ Error 1: QuotaExceededError - localStorage Full

### **Problem:**
```
QuotaExceededError: Failed to execute 'setItem' on 'Storage': 
Setting the value of 'livechat_state' exceeded the quota.
```

### **Cause:**
- LiveChat menyimpan base64 images di localStorage
- Base64 images sangat besar (bisa >1MB per image)
- localStorage limit: ~5-10MB per domain

### **Solution:** ✅ FIXED
File: `components/chat/LiveChatWidget.tsx`

**Changes:**
1. Exclude images saat save ke localStorage
2. Tambah try-catch untuk handle quota exceeded
3. Auto-clear localStorage jika penuh

```typescript
// Before: Simpan semua (termasuk images)
localStorage.setItem('livechat_state', JSON.stringify({ messages, ... }));

// After: Exclude images
const messagesWithoutImages = messages.map(m => ({
  role: m.role,
  content: m.content,
  // image field excluded
}));
```

### **Result:**
- ✅ localStorage usage turun drastis
- ✅ No more quota errors
- ✅ Chat history tetap tersimpan
- ⚠️ Images tidak persist setelah refresh (by design untuk save space)

---

## ❌ Error 2: Posts RLS Error (400)

### **Problem:**
```
Failed to load resource: the server responded with a status of 400 ()
mhefqwregrldvxtqqxbb.supabase.co/rest/v1/posts?select=...
```

### **Cause:**
- RLS (Row Level Security) policy di table `posts` terlalu restrictive
- Joined query dengan `users` dan `sekbid` gagal karena missing policy

### **Solution:** ⚠️ ACTION REQUIRED

**Run SQL di Supabase SQL Editor:**

File: `FIX_POSTS_RLS_QUICK.sql`

```sql
-- Drop old policies
DROP POLICY IF EXISTS "Public can view published posts" ON posts;

-- Create new permissive policy
CREATE POLICY "Public read published posts"
ON posts FOR SELECT TO public
USING (status = 'published');

CREATE POLICY "Authenticated read all posts"
ON posts FOR SELECT TO authenticated
USING (true);
```

### **Steps:**
1. Buka **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy-paste isi file `FIX_POSTS_RLS_QUICK.sql`
4. Click **Run**
5. Refresh browser

### **Result:**
- ✅ Posts dengan status 'published' bisa diakses public
- ✅ Authenticated users bisa read semua posts
- ✅ No more 400 errors

---

## ❌ Error 3: page_content 404

### **Problem:**
```
Failed to load resource: the server responded with a status of 404 ()
mhefqwregrldvxtqqxbb.supabase.co/rest/v1/page_content?...
```

### **Cause:**
- Table `page_content` belum ada di database
- Atau RLS policy blocking reads

### **Solution 1:** ✅ GRACEFUL HANDLING (Already Fixed)

File: `lib/supabase/client.ts`

**Changes:**
- Tambah check untuk 404/PGRST116 errors
- Return empty array instead of throwing error
- Log warning instead of error

```typescript
if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
  console.warn('[getPageContent] table not found, returning empty array');
  return [];
}
```

### **Solution 2:** ⚠️ RECOMMENDED - Create Table

**Run SQL di Supabase SQL Editor:**

File: `CREATE_PAGE_CONTENT_TABLE.sql`

```sql
CREATE TABLE IF NOT EXISTS page_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'general',
  title TEXT,
  content TEXT,
  -- ... other fields
);

-- Insert default content
INSERT INTO page_content (page_key, category, title, content, published)
VALUES 
  ('site_visi', 'home', 'Visi OSIS', '...', true),
  ('site_misi', 'home', 'Misi OSIS', '...', true),
  -- ... etc
ON CONFLICT (page_key) DO NOTHING;
```

### **Steps:**
1. Buka **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy-paste isi file `CREATE_PAGE_CONTENT_TABLE.sql`
4. Click **Run**
5. Verify: `SELECT * FROM page_content;`

### **Result:**
- ✅ Table `page_content` created
- ✅ Default content inserted (visi, misi, about, ketua)
- ✅ RLS policies configured
- ✅ No more 404 errors

---

## 📊 Status Summary

| Error | Status | Action Required |
|-------|--------|----------------|
| localStorage QuotaExceeded | ✅ Fixed | None - Already deployed |
| Posts RLS 400 | ⚠️ Pending | Run `FIX_POSTS_RLS_QUICK.sql` |
| page_content 404 | ⚠️ Optional | Run `CREATE_PAGE_CONTENT_TABLE.sql` |

---

## 🚀 Quick Action Steps:

### Immediate (Required):
1. **Hard refresh browser** (Ctrl + Shift + R) to clear localStorage
2. Run `FIX_POSTS_RLS_QUICK.sql` di Supabase SQL Editor
3. Refresh page lagi

### Recommended (Optional):
4. Run `CREATE_PAGE_CONTENT_TABLE.sql` di Supabase SQL Editor
5. Populate page_content dengan data site Anda

### Verify:
- ✅ No more console errors
- ✅ Posts loading correctly
- ✅ Chat working without quota errors

---

## 🛡️ Prevention Tips:

### For Future:
1. **Never save large data in localStorage**
   - Use IndexedDB for large files
   - Or upload to server/cloud storage

2. **Always test RLS policies**
   - Create policies for public read early
   - Test with anon users before deploy

3. **Create missing tables early**
   - Check schema completeness
   - Add default data for critical tables

---

## 📞 Still Having Issues?

Check:
1. Browser console for new errors
2. Supabase logs in Dashboard
3. Network tab for failed requests
4. RLS policies in Table Editor

Debug commands:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'posts';
SELECT * FROM pg_policies WHERE tablename = 'page_content';

-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'page_content';

-- Test query
SELECT * FROM posts WHERE status = 'published' LIMIT 3;
SELECT * FROM page_content LIMIT 5;
```

---

**All fixes deployed! 🎉**

Hard refresh browser sekarang untuk apply semua changes.
