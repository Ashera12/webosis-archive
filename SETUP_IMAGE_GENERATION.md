# Setup Image Generation - Panduan Lengkap

## 🎯 Masalah yang Dialami

```
❌ Tidak ada provider yang tersedia atau semua gagal:
OpenAI DALL-E 3: Billing hard limit has been reached
OpenAI DALL-E 2: Billing hard limit has been reached
HuggingFace: API key not configured
Gemini: Imagen public API not available (skipped)
```

## ✅ Solusi Tercepat - HuggingFace (GRATIS & POWERFUL)

HuggingFace FLUX.1 adalah pilihan terbaik karena:
- ✅ **100% GRATIS** (tidak perlu kartu kredit)
- ✅ **Kualitas tinggi** (setara DALL-E untuk banyak kasus)
- ✅ **Cepat** (generasi 5-15 detik)
- ✅ **No billing limit** (free tier cukup besar)

### Langkah Setup HuggingFace (5 menit):

#### 1. Buat/Login Akun HuggingFace
- Kunjungi: https://huggingface.co/join
- Daftar dengan email atau GitHub

#### 2. Generate Access Token
- Buka: https://huggingface.co/settings/tokens
- Klik **"New token"** atau **"Create new token"**
- **Name**: `webosis-image-gen` (atau nama bebas)
- **Type**: Pilih **"Read"** (bukan Write)
- Klik **"Generate token"**

#### 3. Copy Token
- Token format: `hf_xxxxxxxxxxxxxxxxxxxxxxxxx`
- Klik icon **Copy** atau select semua lalu Ctrl+C

#### 4. Tambahkan ke Admin Settings

**Opsi A - Via Admin Panel (Recommended):**
1. Login sebagai admin di website Anda
2. Buka menu **Admin** → **Settings** → **API Configuration**
3. Tambahkan key baru:
   - **Key**: `HUGGINGFACE_API_KEY`
   - **Value**: `hf_xxxxxxxxxxxxxxxxxxxxxxxxx` (paste token Anda)
4. Klik **Save**

**Opsi B - Via .env.local File:**
1. Buka file `.env.local` di root project
2. Tambahkan baris:
   ```env
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Save file

#### 5. Restart Development Server
```powershell
# Stop server (Ctrl+C di terminal yang running dev server)
# Lalu jalankan lagi:
npm run dev
```

#### 6. Test Image Generation
Buka chat di website, ketik:
```
/generate logo osis smk yang modern dan minimalis
```

Atau test via API:
```powershell
curl -X POST http://localhost:3000/api/ai/image-gen `
  -H "Content-Type: application/json" `
  -d '{"prompt":"logo osis smk yang modern","provider":"auto"}'
```

**Expected Result:**
```json
{
  "success": true,
  "provider": "huggingface-FLUX.1-schnell",
  "images": [
    {
      "url": "data:image/png;base64,iVBORw0KGgo..."
    }
  ]
}
```

---

## 🔧 Advanced Configuration

### Pilih Model HuggingFace (Opsional)

Secara default menggunakan `FLUX.1-schnell` (cepat). Untuk kualitas lebih tinggi:

**Admin Settings / .env.local:**
```env
HUGGINGFACE_MODEL=black-forest-labs/FLUX.1-dev
```

**Perbandingan Model:**
| Model | Kecepatan | Kualitas | Use Case |
|-------|-----------|----------|----------|
| `FLUX.1-schnell` | ⚡⚡⚡ Fast (5-10s) | ⭐⭐⭐⭐ Good | Testing, iterasi cepat |
| `FLUX.1-dev` | ⚡⚡ Medium (15-30s) | ⭐⭐⭐⭐⭐ Excellent | Production, final output |

### Alternatif: Setup OpenAI (Berbayar)

Jika ingin kualitas maksimal dan punya budget:

#### 1. OpenAI Platform
- Kunjungi: https://platform.openai.com/signup
- Daftar akun OpenAI

#### 2. Add Billing
- Menu: **Settings** → **Billing**
- Add kartu kredit
- Set usage limit (misal $5-10/bulan)

#### 3. Generate API Key
- Menu: **API Keys**
- Klik **"Create new secret key"**
- Copy key (format: `sk-proj-...`)

#### 4. Add to Admin Settings
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 5. Restart & Test
```powershell
npm run dev
```

**Pricing:**
- DALL-E 3 Standard (1024x1024): **$0.040/image**
- DALL-E 3 HD (1024x1024): **$0.080/image**
- DALL-E 2 (1024x1024): **$0.020/image**

---

## 📊 Provider Fallback Chain

Sistem akan otomatis mencoba provider dalam urutan:

1. **DALL-E 3** (jika ada OPENAI_API_KEY & billing OK)
   - Kualitas tertinggi
   - Fitur HD mode
   
2. **DALL-E 2** (fallback otomatis jika DALL-E 3 error)
   - Lebih murah
   - Support multiple images
   
3. **HuggingFace FLUX** (jika ada HUGGINGFACE_API_KEY)
   - Gratis unlimited
   - Fast generation
   
4. **Gemini** (skip - not available)
   - Public Imagen API belum tersedia

---

## 🧪 Testing & Verification

### Test via Chat
```
/generate sunset over mountains with vibrant colors
/generate logo perusahaan teknologi modern minimalis
/generate portrait cat in renaissance painting style
```

### Test via API
```powershell
# Basic generation
curl -X POST http://localhost:3000/api/ai/image-gen `
  -H "Content-Type: application/json" `
  -d '{
    "prompt": "futuristic cityscape at night",
    "provider": "auto"
  }'

# Force specific provider
curl -X POST http://localhost:3000/api/ai/image-gen `
  -H "Content-Type: application/json" `
  -d '{
    "prompt": "mountain landscape",
    "provider": "huggingface"
  }'

# With size option
curl -X POST http://localhost:3000/api/ai/image-gen `
  -H "Content-Type: application/json" `
  -d '{
    "prompt": "abstract art",
    "size": "1024x1024",
    "provider": "auto"
  }'
```

### Expected Console Logs
```
[Image Gen] ❌ OpenAI DALL-E 3 failed: billing hard limit reached
[Image Gen] 🔄 Trying DALL-E 2 as fallback...
[Image Gen] ❌ DALL-E 2 also failed: billing hard limit reached
[Image Gen] 🔄 Trying HuggingFace model black-forest-labs/FLUX.1-schnell ...
[Image Gen] ✅ Generated with HuggingFace model black-forest-labs/FLUX.1-schnell
```

---

## ❓ Troubleshooting

### Error: "HuggingFace: API key not configured"
**Solusi:**
1. Pastikan token sudah ditambahkan di Admin Settings atau `.env.local`
2. Restart server setelah menambahkan key
3. Cek format token: harus mulai dengan `hf_`

### Error: "HuggingFace request failed (503)"
**Penyebab:** Model sedang cold start (loading pertama kali)
**Solusi:** Tunggu 10-30 detik, coba lagi. Model akan tetap aktif setelahnya.

### Error: "HuggingFace: Model loading timeout"
**Solusi:** 
1. Coba model alternatif: `stabilityai/stable-diffusion-xl-base-1.0`
2. Atau gunakan model lain di HuggingFace Inference API

### Gambar tidak muncul di chat
**Solusi:**
1. Cek browser console untuk error
2. Pastikan response mengandung base64 data URL
3. Test dengan membuka data URL langsung di browser

### Semua provider gagal
**Checklist:**
- [ ] Minimal ada 1 API key configured (HuggingFace atau OpenAI)
- [ ] Server sudah di-restart setelah add key
- [ ] Internet connection stable
- [ ] Cek Admin Settings → API Keys → verify key tersimpan

---

## 🚀 Production Deployment

### Environment Variables untuk Production

**Vercel/Netlify:**
```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
HUGGINGFACE_MODEL=black-forest-labs/FLUX.1-dev
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxx
```

**Docker:**
```dockerfile
ENV HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
ENV HUGGINGFACE_MODEL=black-forest-labs/FLUX.1-schnell
```

### Recommended Setup
- **Development**: HuggingFace FLUX.1-schnell (fast iteration)
- **Staging**: HuggingFace FLUX.1-dev (quality check)
- **Production**: OpenAI DALL-E 3 (primary) + HuggingFace (fallback)

---

## 📚 Resources

- **HuggingFace Tokens**: https://huggingface.co/settings/tokens
- **HuggingFace Inference API Docs**: https://huggingface.co/docs/api-inference/
- **FLUX.1 Model Page**: https://huggingface.co/black-forest-labs/FLUX.1-schnell
- **OpenAI Platform**: https://platform.openai.com/
- **API Documentation**: Lihat `IMAGE_GENERATION_ENHANCEMENT_GUIDE.md`

---

## ✅ Quick Checklist

Setup berhasil jika:
- [ ] HuggingFace token berhasil di-generate
- [ ] Token ditambahkan ke Admin Settings atau .env.local
- [ ] Server di-restart setelah konfigurasi
- [ ] Test `/generate` berhasil menghasilkan gambar
- [ ] Console log menampilkan "✅ Generated with HuggingFace"
- [ ] Gambar ter-render di chat atau response JSON

**Total waktu setup: ~5 menit**  
**Biaya: $0 (100% gratis dengan HuggingFace)**

Selamat mencoba! 🎨✨
