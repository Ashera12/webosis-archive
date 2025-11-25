# 🗄️ Database Setup Guide - Comment System

## Urutan Instalasi SQL Files

Jalankan di **Supabase SQL Editor** dengan urutan berikut:

### **Step 1: Create Base Comments Table**
File: `create_comments_table.sql`

Membuat:
- Tabel `comments` (id, content_id, content_type, content, author_name, author_id, is_anonymous, created_at, updated_at)
- RLS policies: SELECT (anyone), INSERT (anyone), DELETE (owner/admin)
- Indexes: content_id+content_type, author_id, created_at
- Trigger: auto-update updated_at

```sql
-- Copy paste semua isi file create_comments_table.sql
```

**Expected Result:**
```
✅ Table "comments" created
✅ 3 indexes created
✅ 3 policies created
✅ 1 trigger created
```

---

### **Step 2: Add Replies & Likes Support**
File: `update_comments_with_replies_likes.sql`

Membuat:
- Column `parent_id` di tabel comments (untuk nested replies)
- Tabel `comment_likes` (id, comment_id, user_id, created_at)
- RLS policies untuk comment_likes
- Indexes untuk performa

```sql
-- Copy paste semua isi file update_comments_with_replies_likes.sql
```

**Expected Result:**
```
✅ Column "parent_id" added to comments
✅ Table "comment_likes" created
✅ 3 indexes created (parent_id, comment_id, user_id)
✅ 3 policies created for comment_likes
```

**IMPORTANT:** Jika ada error "policy already exists", jalankan ini dulu:
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Anyone can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON comment_likes;
```

---

### **Step 3: Add Edit Permission**
File: `add_comment_update_policy.sql`

Membuat:
- UPDATE policy (user bisa edit komentar sendiri)

```sql
-- Copy paste semua isi file add_comment_update_policy.sql
```

**Expected Result:**
```
✅ Policy "Users can update own comments" created
✅ Query shows all policies for verification
```

---

## Verification Checklist

Setelah semua SQL dijalankan, verify dengan query ini:

### **1. Check Tables**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('comments', 'comment_likes');
```

Expected: 2 rows (comments, comment_likes)

### **2. Check Columns**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'comments'
ORDER BY ordinal_position;
```

Expected columns:
- id (UUID)
- content_id (TEXT)
- content_type (TEXT)
- content (TEXT)
- author_name (TEXT)
- author_id (UUID, nullable)
- is_anonymous (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- **parent_id (UUID, nullable)** ← Must exist!

### **3. Check Policies**
```sql
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('comments', 'comment_likes')
ORDER BY tablename, policyname;
```

Expected policies:
- **comments**: Anyone can view (SELECT), Anyone can create (INSERT), Users can delete own (DELETE), Users can update own (UPDATE)
- **comment_likes**: Anyone can view (SELECT), Anyone can like (INSERT), Users can unlike (DELETE)

### **4. Check Indexes**
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('comments', 'comment_likes')
AND schemaname = 'public';
```

Expected indexes:
- idx_comments_content
- idx_comments_author
- idx_comments_created_at
- idx_comments_parent ← Must exist!
- idx_comment_likes_comment
- idx_comment_likes_user

---

## Test Data (Optional)

Insert test comment untuk verify:

```sql
-- Test insert comment
INSERT INTO comments (content_id, content_type, content, author_name, is_anonymous)
VALUES ('test-123', 'post', 'Test comment', 'Test User', false)
RETURNING *;

-- Test insert reply
INSERT INTO comments (content_id, content_type, content, author_name, is_anonymous, parent_id)
VALUES ('test-123', 'post', 'Test reply', 'Test User 2', false, 
  (SELECT id FROM comments WHERE content = 'Test comment' LIMIT 1))
RETURNING *;

-- Test insert like
INSERT INTO comment_likes (comment_id, user_id)
VALUES (
  (SELECT id FROM comments WHERE content = 'Test comment' LIMIT 1),
  'test-user-id'
)
RETURNING *;

-- Cleanup test data
DELETE FROM comments WHERE content_id = 'test-123';
```

---

## Troubleshooting

### Error: "syntax error at or near NOT"
**Problem:** PostgreSQL doesn't support `CREATE POLICY IF NOT EXISTS`

**Solution:** File sudah diperbaiki dengan `DROP POLICY IF EXISTS` sebelum `CREATE POLICY`

### Error: "policy already exists"
**Solution:**
```sql
-- Drop semua policies dulu
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Anyone can view comment likes" ON comment_likes;
DROP POLICY IF EXISTS "Anyone can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON comment_likes;

-- Lalu jalankan ulang create policy statements
```

### Error: "table already exists"
**Solution:** Tabel sudah ada, skip step 1, langsung ke step 2

### Error: "column already exists"
**Solution:** Column sudah ada, skip ALTER TABLE, lanjut ke CREATE TABLE berikutnya

### User tidak bisa kirim comment (403 Forbidden)
**Check:**
1. RLS policy "Anyone can create comments" exists?
```sql
SELECT * FROM pg_policies WHERE policyname = 'Anyone can create comments';
```

2. Policy menggunakan `WITH CHECK (true)` bukan condition lain?

3. Test manual insert:
```sql
INSERT INTO comments (content_id, content_type, content, author_name, is_anonymous)
VALUES ('test', 'post', 'test', 'Test', false);
```

Jika berhasil = Database OK, problem di frontend/API.
Jika gagal = RLS policy masalah.

**Fix:**
```sql
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
CREATE POLICY "Anyone can create comments"
  ON comments
  FOR INSERT
  WITH CHECK (true); -- Pastikan true, bukan condition
```

### Comment muncul tapi tidak bisa like
**Check:** Tabel comment_likes exists?
```sql
SELECT * FROM comment_likes LIMIT 1;
```

Jika error "relation does not exist" = Belum jalankan step 2.

---

## API Environment Variables

Pastikan di `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Service Role Key** diperlukan untuk bypass RLS di server-side API.

---

## Summary

**3 SQL Files, 3 Steps:**
1. ✅ `create_comments_table.sql` - Base table + policies
2. ✅ `update_comments_with_replies_likes.sql` - Add replies & likes
3. ✅ `add_comment_update_policy.sql` - Add edit permission

**Total Objects Created:**
- 2 tables (comments, comment_likes)
- 7 policies (4 comments, 3 comment_likes)
- 6 indexes
- 1 trigger
- 1 function (update_updated_at)

Setelah setup selesai, test di frontend:
1. Klik icon comment → Section terbuka
2. Tulis comment → Kirim
3. Comment muncul di list
4. Click ❤️ → Like counter +1
5. Click Reply → Reply form muncul
6. Click ✏️ → Edit inline (jika own comment)
7. Click 🗑️ → Delete confirmation (jika own/admin)

🎉 **Done!**
