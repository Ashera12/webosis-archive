# Panduan Lengkap: Mengubah Background & Menambah Konten

## 🎨 Cara Mengubah Background Global

### Langkah-langkah:

1. **Buka Admin Settings**
   - Login ke admin: `/admin/login`
   - Klik menu **Settings** di sidebar

2. **Scroll ke bagian "Background Configuration"** atau cari settings ini:
   - `GLOBAL_BG_MODE`
   - `GLOBAL_BG_COLOR`
   - `GLOBAL_BG_GRADIENT`
   - `GLOBAL_BG_IMAGE_URL`

3. **Pilih Mode Background:**

   ### Mode 1: Warna Solid
   ```
   GLOBAL_BG_MODE = color
   GLOBAL_BG_COLOR = #f0f0f0
   ```

   ### Mode 2: Gradient
   ```
   GLOBAL_BG_MODE = gradient
   GLOBAL_BG_GRADIENT = linear-gradient(135deg, #667eea 0%, #764ba2 100%)
   ```
   
   **Contoh gradient populer:**
   - Gold: `linear-gradient(135deg, #D4AF37, #E6C547)`
   - Blue Ocean: `linear-gradient(135deg, #667eea, #764ba2)`
   - Sunset: `linear-gradient(135deg, #FA709A, #FEE140)`
   - Purple Dream: `linear-gradient(135deg, #a8edea, #fed6e3)`

   ### Mode 3: Gambar
   ```
   GLOBAL_BG_MODE = image
   GLOBAL_BG_IMAGE_URL = https://your-supabase-url.co/storage/v1/object/public/gallery/bg-pattern.jpg
   GLOBAL_BG_IMAGE_STYLE = cover
   GLOBAL_BG_IMAGE_OPACITY = 0.3
   GLOBAL_BG_IMAGE_FIXED = true
   ```

4. **Klik tombol "💾 Save Settings"**

5. **Refresh halaman public** untuk melihat perubahan

### Upload Gambar Background:

1. Buka `/admin/gallery`
2. Upload gambar background
3. Klik kanan pada gambar → Copy Image URL
4. Paste URL tersebut ke `GLOBAL_BG_IMAGE_URL` di Settings

---

## 📝 Cara Menambah Konten Baru di CMS

### Langkah-langkah:

1. **Buka Content Management**
   - Login ke admin
   - Klik menu **Content** di sidebar

2. **Klik tombol "➕ Tambah Konten"** (hijau, di kanan atas)

3. **Isi Form Konten Baru:**

   - **Page Key** (ID unik): 
     - Format: `halaman_bagian_nama`
     - Contoh: `home_hero_title`, `about_mission_text`
     - Gunakan underscore, tanpa spasi
   
   - **Tipe Konten:**
     - `Text`: untuk judul/teks pendek
     - `Rich Text`: untuk paragraf/deskripsi panjang
     - `Image URL`: untuk link gambar
   
   - **Kategori:**
     - `Home Page`: konten di halaman utama
     - `About Page`: konten di halaman About
     - `Navbar`: item menu navigasi
     - `General`: konten umum lainnya
   
   - **Konten/Nilai:**
     - Isi dengan teks/URL sesuai tipe

4. **Klik "💾 Simpan Konten Baru"**

5. **Konten akan langsung tersedia** untuk diedit kapan saja

### Contoh Konten yang Bisa Ditambahkan:

**Hero Section:**
```
Page Key: home_hero_subtitle
Tipe: Text
Kategori: Home Page
Konten: Membangun Generasi Berakhlak Mulia
```

**About Section:**
```
Page Key: about_vision_text
Tipe: Rich Text
Kategori: About Page
Konten: Visi kami adalah menciptakan siswa yang...
```

**Gambar Banner:**
```
Page Key: home_banner_image
Tipe: Image URL
Kategori: Home Page
Konten: https://....supabase.co/storage/.../banner.jpg
```

---

## 🔄 Cara Edit Konten yang Sudah Ada

1. Buka `/admin/content`
2. Gunakan **filter kategori** untuk memudahkan pencarian
3. Klik tombol **"✏️ Edit"** pada konten yang ingin diubah
4. Edit nilai kontennya
5. Klik **"💾 Simpan"**
6. Refresh halaman public untuk melihat perubahan

---

## 💡 Tips & Trik

### Background:
- Gunakan opacity 0.2-0.4 untuk gambar background agar teks tetap terbaca
- Set `GLOBAL_BG_IMAGE_FIXED = true` untuk efek parallax
- Mode `cover` = gambar menutupi penuh, `contain` = gambar muat penuh

### Content:
- Gunakan Page Key yang deskriptif: `section_component_type`
- Untuk teks panjang, gunakan Rich Text (mendukung enter/paragraf)
- Simpan URL gambar yang sudah diupload di Gallery

### Debugging:
- Jika background tidak muncul, cek console browser (F12)
- Pastikan URL gambar bisa diakses (coba buka di tab baru)
- Refresh dengan Ctrl+Shift+R untuk clear cache

---

## 🚀 Contoh Setup Lengkap Background Gradient Gold

Di Admin Settings, isi seperti ini:

```
GLOBAL_BG_MODE = gradient
GLOBAL_BG_GRADIENT = linear-gradient(135deg, #D4AF37 0%, #E6C547 50%, #F4E5B0 100%)
```

Klik Save → Refresh halaman → Background langsung berubah! ✨

---

**Dibuat oleh: GitHub Copilot**  
*Last updated: November 2025*
