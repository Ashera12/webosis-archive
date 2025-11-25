# ContentInteractions Component - Panduan Integrasi

## 📋 Deskripsi
Component reusable untuk fitur interaksi sosial (like, comment, share) dengan QR Code pada semua jenis konten (posts, events, polls, announcements, news).

## ✨ Fitur Lengkap

### 1. **Like System**
- ❤️ Tombol like dengan animasi heart
- 📊 Counter likes real-time
- 🎨 Hover effect scale & color transition
- 💾 Local state management (siap backend integration)

### 2. **Comment System** (Coming Soon)
- 💬 Comment button dengan counter
- 🔔 Placeholder untuk future implementation
- 📝 Info toast notification

### 3. **Share Options**
**Modal dengan 7 opsi berbagi:**

#### Native Share (Mobile)
- 📱 Web Share API untuk device mobile
- 🔄 Auto-detect browser capability
- ✅ Fallback ke clipboard jika tidak support

#### Copy Link
- 📋 Copy URL ke clipboard
- ✅ Toast notification sukses/error
- 🔐 Secure navigator.clipboard API

#### QR Code
- 📷 Generate QR Code dari URL konten
- 🎨 Canvas-based 300x300px
- 💫 Modal terpisah dengan instruksi scan
- ↩️ Tombol kembali ke share options

#### Social Media Sharing
- 💚 **WhatsApp**: Share via wa.me
- 💙 **Facebook**: Facebook Sharer
- 🐦 **Twitter**: Tweet intent dengan title + URL
- 🎯 Auto-encode URL dan title
- 🔗 Open di new tab (600x400)

## 🚀 Cara Menggunakan

### 1. Import Component
```tsx
import ContentInteractions from '@/components/ContentInteractions';
```

### 2. Gunakan di JSX
```tsx
<ContentInteractions
  contentId={post.id}
  contentType="post"
  contentTitle={post.title}
  contentUrl={`/posts/${post.slug}`}
  initialLikes={post.likes || 0}
  initialComments={post.comments || 0}
  isLiked={false}
  onLike={() => handleLikePost(post.id)}
  onComment={() => setShowComments(true)}
  className="justify-center sm:justify-start"
/>
```

## 📝 Props API

| Prop | Type | Required | Default | Deskripsi |
|------|------|----------|---------|-----------|
| `contentId` | `string` | ✅ | - | Unique ID konten |
| `contentType` | `'post' \| 'event' \| 'poll' \| 'announcement' \| 'news'` | ✅ | - | Tipe konten |
| `contentTitle` | `string` | ✅ | - | Judul konten untuk share |
| `contentUrl` | `string` | ✅ | - | Relative URL konten (e.g. `/posts/slug`) |
| `initialLikes` | `number` | ❌ | `0` | Jumlah likes awal |
| `initialComments` | `number` | ❌ | `0` | Jumlah comments awal |
| `isLiked` | `boolean` | ❌ | `false` | Status sudah like atau belum |
| `onLike` | `() => void` | ❌ | - | Callback saat like diklik |
| `onComment` | `() => void` | ❌ | - | Callback saat comment diklik |
| `className` | `string` | ❌ | `''` | Custom Tailwind classes |

## 🎯 Contoh Integrasi

### 1. Posts Detail (`/posts/[slug]`)
✅ **Sudah diimplementasi**

```tsx
// app/posts/[slug]/page.tsx
<ContentInteractions
  contentId={post.id}
  contentType="post"
  contentTitle={post.title}
  contentUrl={`/posts/${post.slug}`}
  initialLikes={0}
  initialComments={0}
  isLiked={false}
  className="justify-center sm:justify-start"
/>
```

### 2. Events Detail
❌ **Belum diimplementasi** - Cara integrasinya:

```tsx
// app/events/[id]/page.tsx atau di InfoPage modal
import ContentInteractions from '@/components/ContentInteractions';

<ContentInteractions
  contentId={event.id}
  contentType="event"
  contentTitle={event.title}
  contentUrl={`/events/${event.id}`}
  initialLikes={event.likes || 0}
  initialComments={event.comments || 0}
  isLiked={false}
  className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
/>
```

### 3. Polls Detail
❌ **Belum diimplementasi** - Cara integrasinya:

```tsx
// app/info/page.tsx - di dalam Poll card
<ContentInteractions
  contentId={poll.id}
  contentType="poll"
  contentTitle={poll.question}
  contentUrl={`/polls/${poll.id}`}
  initialLikes={0}
  initialComments={0}
  isLiked={false}
  className="mt-4"
/>
```

### 4. Announcements
❌ **Belum diimplementasi** - Cara integrasinya:

```tsx
// app/info/page.tsx - di dalam Announcement modal/detail
<ContentInteractions
  contentId={announcement.id}
  contentType="announcement"
  contentTitle={announcement.title}
  contentUrl={`/announcements/${announcement.id}`}
  initialLikes={0}
  initialComments={0}
  isLiked={false}
  className="mt-6"
/>
```

### 5. News/Article Grid
```tsx
// Di dalam news card list
{news.map((article) => (
  <div key={article.id} className="card">
    {/* Article content */}
    <ContentInteractions
      contentId={article.id}
      contentType="news"
      contentTitle={article.title}
      contentUrl={`/news/${article.slug}`}
      initialLikes={article.likes}
      initialComments={article.comments}
      isLiked={article.isLiked}
      className="mt-4 pt-4 border-t"
    />
  </div>
))}
```

## 🎨 Styling & Responsive

### Desktop (≥640px)
- Flex row layout dengan gap-6
- Icon size: text-2xl (24px)
- Font size: text-base (16px)

### Mobile (<640px)
- Flex row layout dengan gap-4
- Icon size: text-xl (20px)
- Font size: text-sm (14px)

### Custom Styling
```tsx
// Centered alignment
<ContentInteractions className="justify-center" />

// Left aligned with top border
<ContentInteractions className="pt-6 border-t border-gray-200 dark:border-gray-700" />

// Custom gap
<ContentInteractions className="gap-8" />
```

## 🔧 Backend Integration (TODO)

Untuk koneksi ke backend, tambahkan di `onLike` callback:

```tsx
const handleLike = async (contentId: string) => {
  try {
    const response = await apiFetch(`/api/content/${contentId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      // Update state dengan data dari server
      setLikes(data.likes);
      setIsLiked(data.isLiked);
    }
  } catch (error) {
    console.error('Like error:', error);
    showToast('Gagal like konten', 'error');
  }
};

<ContentInteractions
  onLike={() => handleLike(post.id)}
  // ...props lainnya
/>
```

## 📱 Modal UX

### Share Modal
- ✅ Click outside to close
- ✅ ESC key support (native)
- ✅ Backdrop blur dark overlay
- ✅ Scale-100 entrance animation
- ✅ Responsive padding & sizing

### QR Modal
- ✅ White card dengan border kuning
- ✅ Canvas auto-generate saat open
- ✅ Back button ke share modal
- ✅ Centered layout dengan instructions

## 🚦 Toast Notifications

Component menggunakan `useToast` context:

- ✅ Like: "Konten disukai!" / "Like dibatalkan"
- ✅ Comment: "Fitur komentar akan segera hadir!"
- ✅ Share WhatsApp/FB/Twitter: "Dibagikan via {platform}!"
- ✅ Copy Link: "Link disalin ke clipboard!"
- ⚠️ Browser not support: "Browser tidak mendukung fitur share"
- ❌ Copy error: "Gagal menyalin link"

## 🎯 Next Steps - Implementasi ke Halaman Lain

### Priority 1: Events
File: `app/info/page.tsx` atau buat `app/events/[id]/page.tsx`

### Priority 2: Polls
File: `app/info/page.tsx` - tambahkan di poll cards

### Priority 3: Announcements
File: `app/info/page.tsx` - tambahkan di announcement modal/detail

### Priority 4: News/Article Lists
File: `app/info/page.tsx` - tambahkan di news cards

## 📦 Dependencies

Komponen ini menggunakan:
- ✅ `qrcode` - Already installed in package.json
- ✅ `react-icons/fa` - Already installed
- ✅ `@/hooks/useTranslation` - Custom hook
- ✅ `@/contexts/ToastContext` - Custom context
- ✅ Next.js (window.location, navigator APIs)

## 🔐 Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Like/Comment | ✅ | ✅ | ✅ | ✅ |
| QR Code | ✅ | ✅ | ✅ | ✅ |
| Clipboard API | ✅ | ✅ | ✅ | ✅ |
| Web Share API | ✅ (Mobile) | ⚠️ (Android only) | ✅ (iOS) | ✅ (Mobile) |
| Social Share | ✅ | ✅ | ✅ | ✅ |

## 📝 Notes

1. **QR Code Generation**: Menggunakan canvas API, generate saat modal dibuka untuk performance
2. **URL Detection**: Auto-detect `window.location.origin` untuk build full URL
3. **Social Media**: URL di-encode dengan `encodeURIComponent` untuk kompatibilitas
4. **State Management**: Saat ini local state, siap untuk Redux/Zustand integration
5. **Accessibility**: Semua buttons memiliki `aria-label` yang jelas

---

**Created by:** OSIS SMK Fithrah Insani Development Team
**Last Updated:** 2025-11-25
**Version:** 1.0.0
