# Setup Ngrok untuk Share Development Server

## ⚡ Quick Start

### 1. Install Ngrok
```powershell
# Via Chocolatey (recommended)
choco install ngrok

# Atau download manual dari https://ngrok.com/download
```

### 2. Setup Ngrok Account (Free)
1. Buka https://dashboard.ngrok.com/signup
2. Sign up dengan email/GitHub
3. Copy authtoken dari dashboard
4. Run di PowerShell:
   ```powershell
   ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
   ```

### 3. Start Next.js Server
```powershell
npm run dev
```
Server jalan di `http://localhost:3001`

### 4. Start Ngrok Tunnel
**Buka PowerShell baru**, lalu:
```powershell
ngrok http 3001
```

### 5. Share URL ke Teman
Ngrok akan tampilkan:
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:3001
```

**Copy URL** `https://abc123.ngrok-free.app` → share ke teman via WhatsApp/email

---

## 🔧 Configuration for Next.js

### Update next.config.js (Optional - untuk domain check)
Tambahkan ngrok domain ke allowed hosts:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};
```

### Update .env.local untuk Ngrok
Tambah variable untuk ngrok URL:

```bash
# Development (default)
NEXTAUTH_URL=http://localhost:3001

# Ngrok (update saat tunneling)
# NEXTAUTH_URL=https://your-ngrok-url.ngrok-free.app
```

**⚠️ Important:** Setiap kali restart ngrok, URL berubah (kecuali pakai paid plan). Update `NEXTAUTH_URL` sesuai URL baru.

---

## 📋 Full Steps dengan Ngrok

### Terminal 1: Next.js
```powershell
cd "C:\Users\Irga\OneDrive\Documents\Dokumen Osis\webosis-archive"
npm run dev
```

### Terminal 2: Ngrok
```powershell
ngrok http 3001
```

### Update Environment (Penting!)
1. Copy URL dari ngrok (contoh: `https://abc123.ngrok-free.app`)
2. Buka `.env.local`
3. Comment/update `NEXTAUTH_URL`:
   ```bash
   # NEXTAUTH_URL=http://localhost:3001
   NEXTAUTH_URL=https://abc123.ngrok-free.app
   ```
4. **Restart Next.js server** (Ctrl+C di Terminal 1, lalu `npm run dev` lagi)

### Share ke Teman
Send URL: `https://abc123.ngrok-free.app`

Teman bisa:
- ✅ Akses homepage: `https://abc123.ngrok-free.app/`
- ✅ Lihat members: `https://abc123.ngrok-free.app/people`
- ✅ Lihat sekbid: `https://abc123.ngrok-free.app/sekbid`
- ✅ Login admin: `https://abc123.ngrok-free.app/admin/login`

---

## 🎯 Ngrok Commands Cheatsheet

```powershell
# Basic tunnel
ngrok http 3001

# With custom subdomain (requires paid plan)
ngrok http 3001 --subdomain=myosis

# With basic auth (protect from strangers)
ngrok http 3001 --basic-auth="username:password"

# Inspect traffic
# Buka http://localhost:4040 di browser (ngrok inspector)

# Stop tunnel
# Ctrl+C di terminal ngrok
```

---

## 🔒 Security Tips

### 1. Protect Admin Routes
Ngrok free plan = public URL. Siapapun bisa akses kalau tahu URL.

**Recommendations:**
- ✅ Pakai strong password untuk admin login
- ✅ Jangan share admin credentials
- ✅ Monitor ngrok inspector (http://localhost:4040)
- ✅ Stop tunnel setelah selesai demo

### 2. Database Access
Supabase sudah secure dengan RLS. Tapi:
- ⚠️ Jangan expose API keys di frontend
- ⚠️ Check `.env.local` tidak ter-commit ke Git

### 3. Ngrok with Auth (Recommended)
```powershell
# Protect dengan basic auth
ngrok http 3001 --basic-auth="admin:rahasia123"
```

Teman harus masukkan username/password sebelum akses site.

---

## 🚀 Alternative: Ngrok Script (Automation)

Buat file `start-tunnel.ps1`:

```powershell
# Start Next.js in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

# Wait for server to start
Start-Sleep -Seconds 5

# Start ngrok
ngrok http 3001

# When ngrok stops, kill Next.js
Stop-Process -Name node -Force
```

**Usage:**
```powershell
.\start-tunnel.ps1
```

---

## 🐛 Troubleshooting

### Issue 1: "ERR_NGROK_108 - Session Expired"
**Solution:**
```powershell
ngrok config add-authtoken YOUR_NEW_TOKEN
```
Get new token from https://dashboard.ngrok.com/get-started/your-authtoken

### Issue 2: NextAuth Callback Error
**Error:** `[next-auth][error][CALLBACK_CREDENTIALS_HANDLER_ERROR]`

**Solution:**
Update `.env.local`:
```bash
NEXTAUTH_URL=https://your-current-ngrok-url.ngrok-free.app
```
Restart Next.js server.

### Issue 3: "Tunnel Not Found"
**Solution:**
Pastikan Next.js server jalan di port 3001:
```powershell
# Check if running
netstat -ano | findstr :3001

# If not, start dev server
npm run dev
```

### Issue 4: Slow Loading
Ngrok free = limited bandwidth + shared infra.

**Solutions:**
- ✅ Compress images sebelum upload
- ✅ Pakai `npm run build` → `npm start` (production mode)
- ✅ Upgrade ke ngrok paid plan (faster)

### Issue 5: "Ngrok Not Found"
**Solution:**
Install ulang:
```powershell
# Via Chocolatey
choco install ngrok

# Or add to PATH manually
# Download from https://ngrok.com/download
# Extract to C:\ngrok\
# Add C:\ngrok\ to System PATH
```

---

## 📊 Monitoring

### Ngrok Inspector (Local)
Buka http://localhost:4040 untuk:
- 📡 See all incoming requests
- 🔍 Inspect headers/body
- 🔄 Replay requests
- 📈 Traffic stats

### Ngrok Dashboard (Cloud)
Buka https://dashboard.ngrok.com untuk:
- 📊 Usage stats
- 🌐 Active tunnels
- 🔐 Auth config
- 💳 Billing (if paid)

---

## ⚡ Quick Commands Summary

```powershell
# 1. Start Next.js (Terminal 1)
npm run dev

# 2. Start Ngrok (Terminal 2)
ngrok http 3001

# 3. Update .env.local
# NEXTAUTH_URL=https://your-ngrok-url.ngrok-free.app

# 4. Restart Next.js (Terminal 1)
# Ctrl+C, then npm run dev

# 5. Share URL ke teman
# Copy dari ngrok output
```

---

## 🎁 Ngrok Free vs Paid

| Feature | Free | Paid ($8/mo) |
|---------|------|--------------|
| Random URL | ✅ Yes (changes on restart) | ✅ Yes |
| Custom subdomain | ❌ No | ✅ Yes (`myosis.ngrok.app`) |
| Reserved domain | ❌ No | ✅ Yes (static URL) |
| Concurrent tunnels | 1 | 3+ |
| Bandwidth | Limited | Higher |
| Uptime | Session-based | Persistent |

**Recommendation untuk demo:** Free plan cukup. Kalau sering demo, consider paid plan untuk static URL.

---

## 🔗 Resources

- Ngrok Docs: https://ngrok.com/docs
- Ngrok Dashboard: https://dashboard.ngrok.com
- Next.js Deployment: https://nextjs.org/docs/deployment
- Supabase + Ngrok: https://supabase.com/docs/guides/local-development

---

**Ready to tunnel? Start dengan ngrok http 3001! 🚀**
