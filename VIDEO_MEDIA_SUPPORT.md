# Video & Media Support

## Ringkas Fitur
- Admin Posts: dapat upload video (`mp4`, `webm`, `ogg`) selain gambar. Nama file asli dipertahankan untuk video (patch terbaru).
- Admin Gallery: dapat upload video dengan preview, nama file video asli dipertahankan.
- Public Posts (`/posts`): menampilkan featured media (gambar atau video) menggunakan `MediaRenderer` (autoplay loop muted untuk thumbnail, tanpa kontrol agar rapi).
- Public Gallery (`/gallery`): grid dan lightbox sekarang mendukung video (thumbnail autoplay loop muted, lightbox video dengan kontrol).
- Info Page (`/info`): preview artikel terbaru juga pakai `MediaRenderer` sehingga video di featured_image tampil.

## Komponen Inti
`components/MediaRenderer.tsx`:
- Deteksi otomatis via regex ekstensi: `mp4|webm|ogg`.
- Props: `src`, `alt`, `className`, `controlsForVideo`, `autoPlay`, `loop`, `muted`.
- Pada konten publik grid: video autoplay + loop + muted untuk pengalaman lancar tanpa gangguan audio.

## Upload Endpoint
`app/api/upload/route.ts`
- Allowed MIME: `image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg`.
- Bucket auto-create bila belum ada (public). Ukuran max default 10MB (kecuali backgrounds 5MB).
- Path format: `<folder>/<timestamp>_<originalName>` menjaga ekstensi video agar bisa diputar.

## Perubahan Penting Terbaru
1. Fallback key untuk item galeri dan opsi event/sekbid mencegah error `duplicate key null`.
2. Upload video sekarang mempertahankan `file.name` (admin posts & gallery) agar tidak dipaksa `.jpg`.
3. Semua render manual `<video>/<img>` digantikan oleh `MediaRenderer` di:
   - `app/admin/posts/page.tsx`
   - `app/admin/gallery/page.tsx`
   - `app/posts/page.tsx`
   - `app/gallery/page.tsx`
   - `app/info/page.tsx`
4. Lightbox galeri mendukung video.

## Cara Menggunakan (Admin)
- Posts: Klik area upload, pilih file video (`mp4/webm/ogg`). Sistem akan langsung upload tanpa crop. Setelah simpan, publik terlihat di page posts.
- Gallery: Sama seperti gambar, pilih video; preview langsung muncul. Simpan item untuk tampil di galeri publik.

## Rekomendasi Tambahan
- Tambah dukungan format: `video/mov`, `video/quicktime`, `video/x-matroska` jika diperlukan (update MIME list & ekstensi regex).
- Kompresi video sebelum upload (pengguna bisa gunakan HandBrake) untuk mempercepat load.
- Tambah lazy loading atau poster frame untuk video panjang (opsional di `MediaRenderer`).

## Troubleshooting
| Masalah | Penyebab Umum | Solusi |
|---------|---------------|--------|
| Video tidak autoplay | Browser policy memerlukan mute | Pastikan prop `muted` dikirim (sudah diimplementasi) |
| Tidak tampil di publik | API posts tidak mengembalikan `featured_image` benar | Cek mapping di route posts admin/public |
| Duplicate key error | ID null dari database | Fallback key patch sudah aktif; jika berlanjut, perbaiki skema DB PK |
| Format ditolak | MIME tidak termasuk daftar | Tambah MIME di `allowedMimeTypes` upload endpoint |

## Next Steps Opsional
- Tambah poster thumbnail generator (ambil frame pertama video via ffmpeg server-side).
- Implement streaming besar (HLS) untuk video >10MB.
- Caching layer CDN (Supabase Edge Functions / Cloudflare).

---
Dokumen ini otomatis dibuat untuk sinkronisasi fitur video. Edit bila perlu menambah spesifikasi lanjutan.
