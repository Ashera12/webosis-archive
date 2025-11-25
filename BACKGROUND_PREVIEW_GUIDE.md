# 🎨 Background Preview & Gradient Templates - Panduan Lengkap

## Overview
Fitur background preview dan gradient templates memudahkan admin untuk mengustomisasi tampilan website dengan preview real-time sebelum menyimpan perubahan.

---

## ✨ Fitur Utama

### 1. **Live Background Preview**
- Preview langsung tampilan background sebelum disimpan
- Mendukung semua mode background: color, gradient, dan image
- Toggle preview untuk menghemat ruang layar

### 2. **Gradient Template Library**
- 8 preset gradient profesional siap pakai
- One-click apply template ke form
- Tampilan visual untuk setiap gradient

### 3. **Color Picker Integration**
- Color picker visual untuk solid color mode
- Input manual hex code tetap tersedia
- Preview warna langsung update

---

## 📋 Cara Menggunakan

### A. Mengubah Background dengan Preview

#### 1. Buka Settings Page
```
URL: /admin/settings
Scroll ke section "Background Customization"
```

#### 2. Aktifkan Preview
- Klik tombol **"Tampilkan Preview"** di kanan atas section
- Preview box akan muncul di sebelah kanan form
- Preview akan update otomatis saat Anda mengetik atau memilih template

#### 3. Pilih Background Mode
Dropdown tersedia 4 mode:
- **None**: Tidak ada background custom (default)
- **Solid Color**: Warna tunggal
- **Gradient**: Gradasi warna dengan CSS linear-gradient
- **Background Image**: Gambar dari URL

#### 4. Konfigurasi Berdasarkan Mode

**Mode: Solid Color**
- Color picker visual akan muncul
- Klik box warna untuk membuka picker
- Atau ketik hex code manual di input text
- Preview langsung menampilkan warna yang dipilih

**Mode: Gradient**
- Textarea CSS gradient akan muncul
- Ketik CSS linear-gradient manual, contoh:
  ```css
  linear-gradient(135deg, #667eea 0%, #764ba2 100%)
  ```
- **ATAU** gunakan Quick Templates:
  - Grid 8 template gradient muncul di bawah textarea
  - Klik salah satu untuk auto-apply gradient
  - Template yang tersedia:
    - **Gold Luxury**: Gradient emas elegan
    - **Blue Ocean**: Biru ungu profesional
    - **Sunset Glow**: Pink kuning hangat
    - **Purple Dream**: Pastel ungu lembut
    - **Green Forest**: Hijau teal natural
    - **Fire Red**: Merah dramatik
    - **Midnight Blue**: Biru cyan futuristik
    - **Peach Pink**: Pink pastel soft

**Mode: Background Image**
- Input URL gambar
- Preview akan menampilkan gambar sebagai background
- Pastikan URL publik dan accessible
- Contoh URL: `https://example.com/background.jpg`

#### 5. Preview & Simpan
- Lihat preview di box sebelah kanan
- Text "OSIS Website" ditampilkan overlay untuk simulasi konten
- Jika puas dengan tampilan, klik **"Simpan Settings"**
- Perubahan langsung aktif di website tanpa redeploy!

---

## 🎨 Gradient Template Details

### Template 1: Gold Luxury
```css
linear-gradient(135deg, #D4AF37 0%, #E6C547 50%, #F4E5B0 100%)
```
**Kesan**: Elegan, mewah, cocok untuk website premium/formal

### Template 2: Blue Ocean
```css
linear-gradient(135deg, #667eea 0%, #764ba2 100%)
```
**Kesan**: Profesional, tenang, cocok untuk website sekolah/institusi

### Template 3: Sunset Glow
```css
linear-gradient(135deg, #FA709A 0%, #FEE140 100%)
```
**Kesan**: Hangat, energik, cocok untuk event/promosi

### Template 4: Purple Dream
```css
linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)
```
**Kesan**: Lembut, modern, cocok untuk website youth/creative

### Template 5: Green Forest
```css
linear-gradient(135deg, #134E5E 0%, #71B280 100%)
```
**Kesan**: Natural, segar, cocok untuk tema lingkungan

### Template 6: Fire Red
```css
linear-gradient(135deg, #eb3349 0%, #f45c43 100%)
```
**Kesan**: Dinamis, berani, cocok untuk campaign/action

### Template 7: Midnight Blue
```css
linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)
```
**Kesan**: Futuristik, tech, cocok untuk website inovasi

### Template 8: Peach Pink
```css
linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)
```
**Kesan**: Soft, friendly, cocok untuk website friendly/casual

---

## 🔧 Technical Details

### Database Storage
Background settings tersimpan di tabel `admin_settings`:

| Key | Deskripsi | Contoh Value |
|-----|-----------|--------------|
| `GLOBAL_BG_MODE` | Mode background | `none`, `color`, `gradient`, `image` |
| `GLOBAL_BG_COLOR` | Warna solid | `#ffffff`, `rgb(255,0,0)` |
| `GLOBAL_BG_GRADIENT` | CSS gradient | `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` |
| `GLOBAL_BG_IMAGE_URL` | URL gambar | `https://cdn.example.com/bg.jpg` |

### Preview Implementation
- Preview menggunakan inline style dengan dynamic value dari form state
- Update real-time tanpa reload page
- Overlay simulasi konten untuk visualisasi lebih baik
- Responsive design: preview stack di mobile, side-by-side di desktop

### Apply to Website
Setelah save settings, background diterapkan ke root layout:
- File: `app/layout.tsx`
- Injection via server-side component
- Fetch settings dari database
- Generate inline style sesuai mode

---

## 💡 Tips & Best Practices

### 1. **Preview Sebelum Simpan**
- Selalu aktifkan preview untuk melihat hasil
- Coba scroll konten di preview untuk cek readability
- Pastikan text tetap terbaca di atas background

### 2. **Pilih Gradient yang Tepat**
- Untuk website sekolah: Blue Ocean atau Purple Dream
- Untuk event: Sunset Glow atau Fire Red
- Untuk formal: Gold Luxury atau Midnight Blue

### 3. **Custom Gradient**
- Gunakan tools seperti [cssgradient.io](https://cssgradient.io) untuk buat custom
- Copy CSS linear-gradient, paste ke textarea
- Preview langsung update

### 4. **Background Image**
- Pastikan gambar resolusi tinggi (min 1920x1080)
- Ukuran file tidak terlalu besar (< 500KB untuk performance)
- Gunakan CDN atau Supabase Storage untuk hosting

### 5. **Accessibility**
- Pastikan contrast ratio text vs background memenuhi WCAG (min 4.5:1)
- Hindari gradient terlalu ramai yang bikin text susah dibaca
- Test di device berbeda (mobile, tablet, desktop)

---

## 🐛 Troubleshooting

### Preview Tidak Muncul
- **Solusi**: Klik tombol "Tampilkan Preview" di kanan atas section
- Refresh page jika masih tidak muncul

### Gradient Tidak Smooth
- **Penyebab**: Browser lama tidak support modern CSS gradient
- **Solusi**: Update browser ke versi terbaru

### Background Image Tidak Muncul
- **Penyebab**: URL tidak valid atau CORS issue
- **Solusi**: 
  - Pastikan URL public accessible
  - Upload gambar ke Supabase Storage untuk avoid CORS
  - Test URL di browser langsung

### Preview Berbeda dengan Website
- **Penyebab**: Cache browser
- **Solusi**: Hard refresh (Ctrl+Shift+R) setelah save settings

### Template Button Tidak Bekerja
- **Penyebab**: Mode bukan "gradient"
- **Solusi**: Pilih mode "Gradient" dulu, baru klik template

---

## 📊 Workflow Example

### Skenario: Ganti Background untuk Event Ramadhan

1. **Buka Settings** → `/admin/settings`
2. **Aktifkan Preview** → Klik "Tampilkan Preview"
3. **Pilih Mode** → Gradient
4. **Pilih Template** → Klik "Midnight Blue" (biru futuristik)
5. **Cek Preview** → Lihat tampilan di box preview
6. **Custom (Optional)** → Edit gradient CSS untuk adjust warna
7. **Simpan** → Klik "Simpan Settings"
8. **Verify** → Buka homepage, background sudah berubah!

---

## 🔗 Related Documentation
- [PANDUAN_BACKGROUND_DAN_KONTEN.md](./PANDUAN_BACKGROUND_DAN_KONTEN.md) - Panduan background customization lengkap
- [RUNTIME_CONFIG_GUIDE.md](./RUNTIME_CONFIG_GUIDE.md) - Runtime configuration system
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API endpoints untuk settings

---

## 📝 Changelog

### Version 1.0 (Current)
- ✅ Live preview panel with toggle
- ✅ 8 gradient templates library
- ✅ Color picker integration
- ✅ Real-time preview updates
- ✅ Responsive layout (mobile + desktop)
- ✅ One-click template apply

### Future Enhancements
- [ ] Image gallery browser untuk background selection
- [ ] Opacity slider untuk image backgrounds
- [ ] Preset color palettes untuk solid color mode
- [ ] Export/import background presets
- [ ] A/B testing untuk background variants

---

**Dibuat**: 2025
**Last Update**: Current session
**Maintainer**: Admin OSIS System
