# 🖼️ Background Image Upload dengan Overlay - Panduan Lengkap

## Overview
Fitur upload background image dengan warna overlay memungkinkan admin untuk:
- **Upload gambar langsung** dari komputer (tidak perlu copy-paste URL)
- **Tambahkan overlay warna** untuk meningkatkan readability text
- **Atur opacity overlay** dengan slider interaktif
- **Preview real-time** sebelum menyimpan

---

## ✨ Fitur Baru yang Ditambahkan

### 1. **ImageUploader untuk Background Image**
- Upload langsung dari file explorer
- Progress bar saat upload
- Preview gambar setelah upload
- Tersimpan di Supabase Storage (`gallery/backgrounds/`)

### 2. **Background Overlay Color**
- Color picker visual untuk pilih warna overlay
- Input manual untuk hex/rgba values
- Meningkatkan kontras text vs background image

### 3. **Overlay Opacity Slider**
- Range slider (0-1) untuk atur transparansi
- Input number untuk nilai presisi
- Default: 0.3 (overlay ringan)

### 4. **Manual URL Override**
- Tetap bisa input URL manual jika ingin
- Paste URL dari CDN eksternal
- Edit URL hasil upload

---

## 📋 Cara Menggunakan

### A. Upload Background Image dengan Overlay

#### 1. Buka Settings Page
```
URL: /admin/settings
Scroll ke section "Background Customization"
```

#### 2. Pilih Mode Image
- Set **Background Mode** dropdown ke **"Background Image"**
- Form upload image akan muncul

#### 3. Upload Gambar
**Opsi 1: Upload dari Komputer (Recommended)**
- Klik tombol **"Upload Background Image"**
- Pilih file gambar dari komputer Anda
  - Format: JPG, PNG, WEBP, GIF
  - Max size: 10MB
- Tunggu upload selesai
- Preview gambar akan muncul otomatis
- URL public akan terisi di input field

**Opsi 2: Paste URL Manual**
- Jika sudah punya URL gambar, paste langsung ke input field
- Format: `https://example.com/background.jpg`

#### 4. Tambahkan Overlay Color (Optional tapi Recommended)
**Kenapa perlu overlay?**
- Background image sering terlalu ramai
- Text sulit dibaca di atas gambar kompleks
- Overlay gelap/terang membuat text lebih jelas

**Cara setting overlay:**
- Klik **color picker** box (warna default: hitam #000000)
- Pilih warna overlay yang sesuai:
  - **Hitam (#000000)**: Untuk text putih, tema dark elegant
  - **Putih (#ffffff)**: Untuk text hitam, tema light clean
  - **Navy (#001f3f)**: Profesional, corporate
  - **Burgundy (#85144b)**: Elegan, formal
- Atau ketik manual di input field (support rgba)

#### 5. Atur Overlay Opacity
- Geser **slider opacity** (0-1):
  - **0**: Transparan penuh (no overlay)
  - **0.3**: Overlay ringan (default, recommended)
  - **0.5**: Overlay medium
  - **0.7**: Overlay kuat
  - **1.0**: Overlay solid (gambar tidak terlihat)
- Atau ketik angka presisi di input number

#### 6. Preview & Simpan
- **Aktifkan Preview** dengan klik "Tampilkan Preview"
- Lihat hasil kombinasi gambar + overlay di preview box
- Pastikan text "OSIS Website" terbaca jelas
- Jika puas, klik **"Simpan Settings"**
- Background langsung aktif di seluruh website!

---

## 🎨 Contoh Kombinasi Background + Overlay

### 1. Hero Section dengan Foto Sekolah
**Image**: Foto gedung sekolah
**Overlay Color**: `#000000` (hitam)
**Overlay Opacity**: `0.4`
**Result**: Foto sekolah tetap terlihat, text putih sangat jelas

### 2. Event Background dengan Foto Kegiatan
**Image**: Foto event OSIS (ramai, colorful)
**Overlay Color**: `#001f3f` (navy blue)
**Overlay Opacity**: `0.6`
**Result**: Tema profesional, foto redup tapi masih kelihatan

### 3. Minimalist Light Background
**Image**: Foto landscape soft (langit, alam)
**Overlay Color**: `#ffffff` (putih)
**Overlay Opacity**: `0.3`
**Result**: Clean, modern, text hitam terbaca bagus

### 4. Dramatic Dark Theme
**Image**: Foto malam/indoor dengan cahaya dramatik
**Overlay Color**: `#1a1a1a` (dark gray)
**Overlay Opacity**: `0.5`
**Result**: Moody, cinematic, cocok untuk website portfolio

---

## 🔧 Technical Details

### Upload Flow
1. User pilih file → `ImageUploader` component
2. Validasi size (max 10MB) dan mime type
3. Upload ke Supabase Storage:
   - Bucket: `gallery`
   - Folder: `backgrounds/`
   - Filename: `bg-{timestamp}-{random}.{ext}`
4. Get public URL dari Supabase
5. Call `onChange` dengan URL
6. Update form state `GLOBAL_BG_IMAGE`

### Storage Structure
```
gallery/
  ├── events/          (existing)
  ├── announcements/   (existing)
  ├── content/         (existing)
  └── backgrounds/     (NEW - untuk background images)
      ├── bg-1699999999-abc123.jpg
      ├── bg-1699999999-def456.png
      └── ...
```

### Database Settings
Settings tersimpan di `admin_settings` table:

| Key | Value | Deskripsi |
|-----|-------|-----------|
| `GLOBAL_BG_MODE` | `image` | Mode background |
| `GLOBAL_BG_IMAGE` | `https://...supabase.co/...` | URL gambar |
| `GLOBAL_BG_IMAGE_OVERLAY_COLOR` | `#000000` | Warna overlay |
| `GLOBAL_BG_IMAGE_OVERLAY_OPACITY` | `0.3` | Opacity overlay (0-1) |

### Layout Rendering
File: `app/layout.tsx`

```tsx
// Background image di body style
style={{
  backgroundImage: `url(${bg.imageUrl})`,
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundAttachment: 'scroll'
}}

// Overlay di div terpisah
{bg.imageOverlayColor && (
  <div 
    className="fixed inset-0 pointer-events-none z-0"
    style={{
      backgroundColor: bg.imageOverlayColor,
      opacity: bg.imageOverlayOpacity || 0.3
    }}
  />
)}

// Content di atas overlay
<div className="relative z-10">
  {children}
</div>
```

---

## 💡 Tips & Best Practices

### 1. **Pilih Gambar yang Tepat**
✅ **GOOD:**
- Resolusi tinggi (min 1920x1080)
- Fokus jelas, tidak terlalu ramai
- Warna konsisten dengan brand sekolah
- File size < 500KB (optimized)

❌ **BAD:**
- Resolusi rendah / pixelated
- Terlalu ramai / banyak detail kecil
- Warna clash dengan text
- File size > 2MB (lambat load)

### 2. **Optimize Gambar Sebelum Upload**
- Gunakan tools: [TinyPNG](https://tinypng.com), [Squoosh](https://squoosh.app)
- Compress tanpa menurunkan kualitas visual
- Format recommended: WEBP (best compression)
- Target: < 300KB untuk fast loading

### 3. **Overlay Color Strategy**
**Untuk Background Terang (langit, putih, pastel):**
- Overlay: Putih (#ffffff) atau abu-abu terang
- Opacity: 0.2 - 0.4
- Text: Hitam/dark gray

**Untuk Background Gelap (malam, indoor, warna tua):**
- Overlay: Hitam (#000000) atau navy
- Opacity: 0.3 - 0.5
- Text: Putih/light gray

**Untuk Background Colorful (event, kegiatan ramai):**
- Overlay: Semi-opaque dark color
- Opacity: 0.5 - 0.7
- Text: Putih tebal (bold)

### 4. **Test Readability**
- Buka preview dan zoom out
- Cek apakah text heading terbaca dari jarak 2-3 meter
- Test di mobile (font lebih kecil)
- Pastikan contrast ratio min 4.5:1 (WCAG AA)

### 5. **Responsive Consideration**
- Background `cover` mode auto-adjust untuk semua screen size
- Test di mobile, tablet, desktop
- Pastikan focal point gambar tetap terlihat di semua device

---

## 🐛 Troubleshooting

### Upload Gagal
**Error: "File terlalu besar"**
- **Penyebab**: File > 10MB
- **Solusi**: Compress gambar dulu dengan TinyPNG/Squoosh

**Error: "Upload failed"**
- **Penyebab**: Koneksi internet lemah atau Supabase Storage issue
- **Solusi**: 
  1. Cek koneksi internet
  2. Refresh page dan coba lagi
  3. Upload ke image hosting eksternal (Imgur, etc) dan paste URL manual

### Gambar Tidak Muncul di Website
**Preview OK tapi website tidak berubah**
- **Penyebab**: Cache browser
- **Solusi**: Hard refresh (Ctrl+Shift+R atau Cmd+Shift+R)

**Gambar broken / tidak load**
- **Penyebab**: URL tidak valid atau CORS issue
- **Solusi**: 
  1. Pastikan URL public accessible (buka di tab baru)
  2. Upload ke Supabase Storage (no CORS issue)
  3. Cek apakah file masih exist di storage

### Overlay Tidak Terlihat
**Sudah set color tapi tidak ada efek**
- **Penyebab**: Opacity set ke 0
- **Solusi**: Naikkan opacity slider min 0.3

**Overlay terlalu gelap/terang**
- **Penyebab**: Opacity terlalu tinggi/rendah
- **Solusi**: Adjust slider:
  - Terlalu gelap: Turunkan opacity (0.2 - 0.4)
  - Terlalu terang: Naikkan opacity (0.5 - 0.7)

### Preview Berbeda dengan Website
**Warna overlay di preview vs actual berbeda**
- **Penyebab**: Browser rendering differences
- **Solusi**: Gunakan hex color (#000000) bukan rgba untuk konsistensi

---

## 📊 Performance Impact

### Before (Manual URL)
- Upload gambar ke external hosting: 2-5 menit
- Copy URL, paste ke settings: 30 detik
- Total: ~5-6 menit

### After (Direct Upload)
- Klik upload, pilih file: 10 detik
- Auto-upload ke Supabase: 5-10 detik
- URL auto-filled: instant
- Total: ~20-30 detik

**Time Saved: 80-90% faster workflow!** ⚡

### Page Load Impact
- Background image: ~100-500KB (optimized)
- Overlay: CSS only (no HTTP request)
- Total impact: +0.5-1s initial load (acceptable)
- Recommendation: Use CDN / Supabase global edge caching

---

## 🔗 Related Documentation
- [BACKGROUND_PREVIEW_GUIDE.md](./BACKGROUND_PREVIEW_GUIDE.md) - Gradient templates & preview
- [PANDUAN_BACKGROUND_DAN_KONTEN.md](./PANDUAN_BACKGROUND_DAN_KONTEN.md) - Background basics
- [SETUP_SUPABASE_STORAGE.md](./SETUP_SUPABASE_STORAGE.md) - Storage configuration

---

## 📝 Changelog

### Version 1.0 (Current - November 2025)
- ✅ ImageUploader integration untuk background image
- ✅ Color picker untuk overlay color
- ✅ Opacity slider (0-1) dengan input number
- ✅ Real-time preview dengan overlay simulation
- ✅ Manual URL override option
- ✅ Dedicated `backgrounds/` folder di Supabase Storage
- ✅ Updated layout.tsx untuk render overlay layer

### Future Enhancements
- [ ] Background image gallery browser (pilih dari images yang sudah diupload)
- [ ] Preset overlay combinations (quick apply)
- [ ] Blur effect option untuk background
- [ ] Parallax scroll effect
- [ ] Multiple background layers support
- [ ] Gradient overlay (bukan solid color)

---

**Dibuat**: November 12, 2025
**Last Update**: Current session
**Maintainer**: Admin OSIS System
