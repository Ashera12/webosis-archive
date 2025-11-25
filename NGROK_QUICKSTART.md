# 🚀 Ngrok Quick Reference

## ⚡ Super Quick Start (3 Steps)

### 1️⃣ Start Tunnel
```powershell
npm run tunnel
```
✅ Otomatis start Next.js + Ngrok

### 2️⃣ Copy URL & Update .env.local
Copy URL dari output ngrok (contoh: `https://abc123.ngrok-free.app`)

**Option A - Manual:**
Edit `.env.local`:
```bash
NEXTAUTH_URL=https://abc123.ngrok-free.app
```

**Option B - Script:**
```powershell
.\update-ngrok-url.ps1 "https://abc123.ngrok-free.app"
```

### 3️⃣ Restart Next.js
Di terminal Next.js: `Ctrl+C` → `npm run dev`

**Share URL ke teman!** 🎉

---

## 🔄 Restore ke Localhost

Setelah selesai demo:

**Option A - Script (Recommended):**
```powershell
npm run tunnel:restore
```

**Option B - Manual:**
Edit `.env.local`:
```bash
NEXTAUTH_URL=http://localhost:3001
```

Restart: `Ctrl+C` → `npm run dev`

---

## 📋 Complete Command List

| Command | Description |
|---------|-------------|
| `npm run tunnel` | Start ngrok tunnel (auto-start Next.js) |
| `npm run tunnel:restore` | Restore to localhost |
| `ngrok http 3001` | Manual ngrok start |
| `.\update-ngrok-url.ps1 "URL"` | Update .env.local |
| `.\restore-localhost.ps1` | Restore .env.local |

---

## 🔍 Monitoring

| Tool | URL | Purpose |
|------|-----|---------|
| Ngrok Inspector | http://localhost:4040 | See all requests |
| Next.js Server | http://localhost:3001 | Local dev |
| Public URL | https://xxxxx.ngrok-free.app | Share to friends |

---

## 🎯 What Teman Can Access

Teman bisa buka:
- ✅ **Homepage:** `https://xxxxx.ngrok-free.app/`
- ✅ **Members:** `https://xxxxx.ngrok-free.app/people`
- ✅ **Sekbid:** `https://xxxxx.ngrok-free.app/sekbid`
- ✅ **Sekbid Detail:** `https://xxxxx.ngrok-free.app/sekbid/1`
- ✅ **Admin Login:** `https://xxxxx.ngrok-free.app/admin/login`
- ✅ **Admin Panel:** Setelah login (perlu credentials)

---

## ⚠️ Important Notes

### ⏰ URL Changes
Ngrok **free** → URL berubah setiap restart
- Harus update `NEXTAUTH_URL` setiap kali restart ngrok
- Teman harus pakai URL baru

**Solution:** Pakai script `update-ngrok-url.ps1` untuk cepat update

### 🔒 Security
- Public URL = anyone can access (if they know the URL)
- Protect admin dengan strong password
- Jangan share admin credentials
- Stop tunnel setelah demo selesai

### 🌐 Performance
- Free plan = limited bandwidth
- Bisa slow kalau banyak traffic
- Loading bisa lebih lambat dari localhost

---

## 🐛 Common Issues

### Issue: "Ngrok not found"
**Fix:**
```powershell
choco install ngrok
```

### Issue: "Session expired"
**Fix:**
```powershell
ngrok config add-authtoken YOUR_TOKEN
```
Get token: https://dashboard.ngrok.com/get-started/your-authtoken

### Issue: NextAuth callback error
**Fix:**
- Pastikan `NEXTAUTH_URL` di `.env.local` match dengan ngrok URL
- Restart Next.js server setelah update

### Issue: Port 3001 already in use
**Fix:**
```powershell
# Kill existing process
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force

# Or use different port
$env:PORT=3002; npm run dev
# Then: ngrok http 3002
```

---

## 📞 Support

- Ngrok Docs: https://ngrok.com/docs
- Ngrok Dashboard: https://dashboard.ngrok.com
- Full Guide: See `NGROK_SETUP_GUIDE.md`

---

## 🎁 Pro Tips

1. **Save Ngrok URL for quick reuse:**
   ```powershell
   # Save to variable
   $NGROK_URL = "https://abc123.ngrok-free.app"
   
   # Quick update
   .\update-ngrok-url.ps1 $NGROK_URL
   ```

2. **Monitor traffic in real-time:**
   - Open http://localhost:4040
   - See who's accessing what
   - Debug request/response

3. **Use basic auth for extra security:**
   ```powershell
   ngrok http 3001 --basic-auth="demo:password123"
   ```
   Teman harus login dengan user `demo` pass `password123`

4. **Restart both at once:**
   ```powershell
   # Stop ngrok (Ctrl+C in ngrok terminal)
   # Stop Next.js (Ctrl+C in Next.js terminal)
   # Then run:
   npm run tunnel
   ```

---

**Ready? Run `npm run tunnel` dan share ke teman! 🚀**
