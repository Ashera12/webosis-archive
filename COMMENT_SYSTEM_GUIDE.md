# 💬 Comment System Guide

## Overview
Sistem komentar yang terintegrasi dengan ContentInteractions memungkinkan user (termasuk anonymous) untuk memberikan komentar pada berbagai tipe konten.

## ✨ Fitur

### 1. **Anonymous Comments**
- User yang belum login dapat memberikan komentar
- Otomatis terdeteksi sebagai "Anonymous"
- Ditandai dengan badge orange "Anonymous"
- Avatar berwarna abu-abu

### 2. **Authenticated Comments**
- User yang login menggunakan nama mereka
- Avatar dengan initial nama berwarna gradient
- Dapat menghapus komentar sendiri

### 3. **Admin Features**
- Admin dapat menghapus semua komentar
- Access control berbasis role

## 🛠️ Setup Database

### 1. Jalankan SQL Migration
```sql
-- Jalankan file: create_comments_table.sql
```

File ini akan membuat:
- Tabel `comments` dengan struktur lengkap
- RLS policies untuk keamanan
- Indexes untuk performa
- Trigger untuk auto-update timestamps

### 2. Struktur Tabel

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_id UUID (NULL untuk anonymous),
  is_anonymous BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## 📝 Penggunaan

### Komponen Sudah Terintegrasi
ContentInteractions sudah include CommentSection secara otomatis:

```tsx
<ContentInteractions
  contentId="post-123"
  contentType="post"
  contentTitle="Judul Post"
  contentUrl="/posts/example"
/>
```

### Standalone Usage (Opsional)
```tsx
import CommentSection from '@/components/CommentSection';

<CommentSection
  contentId="event-456"
  contentType="event"
  onCommentCountChange={(count) => console.log(`${count} comments`)}
/>
```

## 🎨 UI/UX Features

### Comment Form
- Avatar dengan initial user
- Textarea dengan auto-resize
- Badge "Tidak login" untuk anonymous users
- Button kirim dengan loading state
- Info text untuk anonymous users

### Comment Display
- Sortir: Terbaru di atas
- Avatar berbeda untuk authenticated vs anonymous
- Timestamp dengan format Indonesia
- Button hapus (conditional):
  - Muncul jika user = author
  - Muncul untuk admin (semua comment)
- Hover effects dan transitions
- Empty state yang informatif

### Toggle Comments
- Button show/hide dengan counter
- Lazy loading: Fetch hanya saat dibuka
- Loading state saat fetch data

## 🔒 Security & Permissions

### RLS Policies
1. **SELECT**: Semua orang bisa baca
2. **INSERT**: Semua orang bisa buat (termasuk anonymous)
3. **DELETE**: Hanya author atau admin

### API Authorization
```typescript
// POST /api/comments
// - Deteksi session untuk determine anonymous
// - Set author_id = null jika anonymous
// - Set is_anonymous = true

// DELETE /api/comments/[id]
// - Cek ownership atau admin role
// - Return 403 jika unauthorized
```

## 🌐 API Endpoints

### GET /api/comments
Ambil semua komentar untuk konten tertentu

**Query Params:**
- `contentId`: ID konten (required)
- `contentType`: Tipe konten (required)

**Response:**
```json
{
  "comments": [
    {
      "id": "uuid",
      "content": "Komentar saya...",
      "author_name": "John Doe",
      "author_id": "uuid-or-null",
      "is_anonymous": false,
      "created_at": "2025-11-25T10:00:00Z"
    }
  ]
}
```

### POST /api/comments
Buat komentar baru

**Body:**
```json
{
  "contentId": "post-123",
  "contentType": "post",
  "content": "Isi komentar",
  "authorName": "John Doe"
}
```

**Response:**
```json
{
  "comment": {
    "id": "uuid",
    "content_id": "post-123",
    "content_type": "post",
    "content": "Isi komentar",
    "author_name": "John Doe",
    "author_id": "uuid-or-null",
    "is_anonymous": false,
    "created_at": "2025-11-25T10:00:00Z"
  }
}
```

### DELETE /api/comments/[id]
Hapus komentar

**Authorization:**
- Harus login
- Harus author atau admin

**Response:**
```json
{
  "success": true
}
```

## 🎯 Implementasi di Halaman

### Info Page
```tsx
// app/info/page.tsx
// Sudah terintegrasi melalui ContentInteractions
```

### Posts Detail
```tsx
// app/posts/[slug]/page.tsx
// Sudah terintegrasi melalui ContentInteractions
```

### Posts List
```tsx
// app/posts/page.tsx
// Sudah terintegrasi melalui ContentInteractions
```

## 📊 Data Flow

```
User Action (Submit Comment)
    ↓
CommentSection.handleSubmitComment()
    ↓
POST /api/comments
    ↓
Check Session (Authenticated?)
    ↓
    ├─ Yes: Use user.id + user.name
    └─ No: Set null + "Anonymous"
    ↓
Insert to Supabase
    ↓
Return new comment
    ↓
Update UI (prepend to list)
    ↓
Update counter
```

## 🔍 Features Detail

### Author Detection
```typescript
const isAnonymous = !session?.user?.id;
const displayName = isAnonymous 
  ? 'Anonymous' 
  : (authorName || session.user.name || 'User');
```

### Delete Permission
```typescript
const canDeleteComment = (comment: Comment) => {
  if (!session?.user) return false;
  return session.user.role === 'admin' 
    || session.user.id === comment.author_id;
};
```

### Real-time Counter
```typescript
onCommentCountChange?.(comments.length + 1); // After add
onCommentCountChange?.(comments.length - 1); // After delete
```

## 🎨 Styling

### Anonymous User Badge
```tsx
<span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded">
  Anonymous
</span>
```

### Avatar Colors
- **Authenticated**: Gradient blue-purple
- **Anonymous**: Solid gray (#9CA3AF)

### Dark Mode Support
Semua komponen support dark mode dengan tailwind dark: classes

## ⚡ Performance

### Optimizations
1. **Lazy Loading**: Comments hanya fetch saat section dibuka
2. **Conditional Rendering**: Modal dan dropdown hanya render saat needed
3. **Indexed Queries**: Database indexes untuk fast retrieval
4. **Pagination Ready**: Structure siap untuk implementasi pagination

### Database Indexes
```sql
idx_comments_content    -- (content_id, content_type)
idx_comments_author     -- (author_id)
idx_comments_created_at -- (created_at DESC)
```

## 🚀 Testing

### Test Anonymous Comment
1. Buka halaman dengan ContentInteractions (tanpa login)
2. Klik "Tampilkan Komentar"
3. Tulis komentar
4. Verify badge "Anonymous" dan "Tidak login" muncul
5. Submit komentar
6. Verify muncul di list dengan badge "Anonymous"

### Test Authenticated Comment
1. Login sebagai user
2. Buka halaman dengan ContentInteractions
3. Klik "Tampilkan Komentar"
4. Tulis komentar
5. Verify nama user muncul (bukan Anonymous)
6. Submit komentar
7. Verify button delete muncul untuk komentar sendiri

### Test Delete Permission
1. Login sebagai admin
2. Verify bisa hapus semua komentar
3. Login sebagai user biasa
4. Verify hanya bisa hapus komentar sendiri
5. Logout
6. Verify tidak ada button delete

## 🐛 Troubleshooting

### Error: "Module not found 'next-auth/react'"
```bash
npm install next-auth
```

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
npm install @supabase/supabase-js
```

### Comments tidak muncul
1. Check console untuk errors
2. Verify database table exists
3. Check RLS policies enabled
4. Verify API endpoint accessible

### Delete tidak bekerja
1. Check user session
2. Verify RLS policy untuk DELETE
3. Check author_id matches session.user.id
4. Verify admin role jika admin yang delete

## 📈 Future Enhancements

### Prioritas Tinggi
- [ ] Pagination (load more)
- [ ] Comment reactions (like komentar)
- [ ] Reply to comments (threading)
- [ ] Edit comment functionality
- [ ] Real-time updates (Supabase subscriptions)

### Prioritas Medium
- [ ] Mention users (@username)
- [ ] Rich text editor (bold, italic, links)
- [ ] Image upload in comments
- [ ] Comment moderation queue
- [ ] Report inappropriate comments

### Prioritas Rendah
- [ ] Comment search
- [ ] Sort options (newest, oldest, popular)
- [ ] Pin comments
- [ ] Comment badges (author, admin, etc.)
- [ ] Comment statistics dashboard

## 📞 Support

Jika ada masalah:
1. Check dokumentasi ini
2. Review console errors
3. Check database connection
4. Verify RLS policies
5. Test API endpoints langsung

Happy commenting! 🎉
