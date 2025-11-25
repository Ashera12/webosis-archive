# 🖼️ AI Vision - Upload & Analisis Foto/Dokumen

## ✨ Fitur Baru: AI Vision dengan Face Recognition

Sistem AI sekarang dapat **melihat dan menganalisis gambar** yang Anda upload, termasuk:

### 📸 Kemampuan AI Vision:

1. **Face Recognition (Pengenalan Wajah)**
   - AI dapat mengenali wajah anggota OSIS
   - Matching dengan database foto anggota
   - Menampilkan nama, jabatan, dan sekbid

2. **Document Analysis (Analisis Dokumen)**
   - Baca teks dari foto dokumen
   - Ekstrak informasi penting
   - OCR (Optical Character Recognition)

3. **Homework Helper (Bantuan Soal)**
   - Foto soal matematika, fisika, dll
   - AI akan membaca dan menjawab soal
   - Penjelasan step-by-step

4. **General Image Analysis**
   - Deskripsi apa yang ada di gambar
   - Identifikasi objek, tempat, aktivitas
   - Context-aware analysis

---

## 🎯 Cara Menggunakan:

### 1. Upload Gambar:
- Klik tombol **+ (Plus)** biru di kiri textarea
- Pilih file gambar (JPG, PNG, GIF, WebP)
- Max size: **10MB**

### 2. Preview & Edit:
- Gambar muncul sebagai preview
- Klik **X** untuk menghapus jika salah
- Tulis pertanyaan atau biarkan kosong

### 3. Kirim & Tunggu:
- Klik **Kirim** atau tekan **Enter**
- AI akan menganalisis gambar
- Hasil muncul dalam beberapa detik

---

## 💡 Contoh Penggunaan:

### Contoh 1: Pengenalan Wajah
```
User: [Upload foto seseorang]
      "Siapa orang ini?"

AI: "Ini adalah Irga, seorang Anggota di Sekbid 7 OSIS 
     SMK Informatika Fithrah Insani. Berdasarkan 
     pengenalan wajah, foto ini cocok dengan data 
     anggota kami."
```

### Contoh 2: Bantuan Soal
```
User: [Upload foto soal matematika]
      "Bantu jawab soal ini"

AI: "Saya lihat soal tentang integral. Mari selesaikan:
     ∫(2x + 3)dx = x² + 3x + C
     
     Penjelasan: ..."
```

### Contoh 3: Dokumen
```
User: [Upload foto dokumen]
      "Apa isi dokumen ini?"

AI: "Dokumen ini adalah pengumuman tentang kegiatan
     OSIS pada tanggal 25 Desember 2024. Berisi:
     - Tema: Perayaan Natal
     - Waktu: 08:00 - 12:00
     - Tempat: Aula Sekolah
     ..."
```

---

## 🔧 Technical Details:

### Supported Image Formats:
- JPEG / JPG
- PNG
- GIF
- WebP

### AI Providers untuk Vision:
1. **OpenAI (GPT-4o-mini)** - Recommended
   - Best untuk face recognition
   - Sangat akurat untuk document OCR
   
2. **Gemini (1.5-flash)** 
   - Good untuk general analysis
   - Fast response time
   
3. **Anthropic (Claude 3 Haiku)**
   - Excellent untuk detailed descriptions
   - Context-aware analysis

### Auto Provider Selection:
- **Auto mode**: Prioritas Anthropic → Gemini → OpenAI
- **Manual**: Pilih provider spesifik dari dropdown

---

## 📊 Face Recognition Database:

AI memiliki akses ke **database foto anggota OSIS**:
- Semua anggota dengan `photo_url` yang valid
- Data lengkap: Nama, Jabatan, Sekbid, Kelas
- Auto-match berdasarkan facial features

### Cara Kerja:
1. AI analyze wajah di foto uploaded
2. Compare dengan semua foto anggota di database
3. Jika similarity > threshold → Identified
4. Return: Nama + Jabatan + Sekbid

---

## 🛡️ Security & Privacy:

### Data Protection:
- **No Storage**: Gambar TIDAK disimpan di server
- **Base64 Encoding**: Langsung dikirim ke AI provider
- **Temporary**: Hilang setelah response

### API Keys:
- Semua API calls menggunakan server-side keys
- User tidak perlu provide API key sendiri
- Admin control via admin_settings

---

## 🚀 Future Enhancements:

### Planned Features:
- [ ] Batch upload (multiple images)
- [ ] Video analysis
- [ ] Real-time camera capture
- [ ] Advanced face recognition dengan confidence score
- [ ] Document translation
- [ ] Handwriting recognition
- [ ] QR Code / Barcode scanner
- [ ] Image editing suggestions

---

## 🐛 Troubleshooting:

### "Format file tidak didukung"
→ Gunakan JPG, PNG, GIF, atau WebP

### "Ukuran file terlalu besar"
→ Compress gambar < 10MB

### "Vision analysis failed"
→ Pastikan API key OpenAI/Gemini/Anthropic sudah di-set di admin panel

### AI tidak mengenali wajah
→ Cek apakah:
- Foto anggota ada di database (`photo_url` terisi)
- Wajah di foto jelas dan tidak blur
- Lighting cukup baik

---

## 📝 API Endpoint:

### POST `/api/ai/vision`

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "question": "Siapa orang ini?",
  "provider": "auto" // atau "openai", "gemini", "anthropic"
}
```

**Response:**
```json
{
  "result": "Ini adalah Irga, Anggota di Sekbid 7..."
}
```

**Error Response:**
```json
{
  "error": "Vision analysis failed",
  "details": "API key not configured"
}
```

---

## 📞 Support:

Jika ada masalah dengan fitur AI Vision:
1. Cek Console (F12) untuk error details
2. Verify API keys di Admin Panel
3. Test dengan gambar sederhana dulu
4. Hubungi admin jika tetap error

---

**Happy Analyzing! 🎉**
