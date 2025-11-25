# Login Debug Guide - Session Not Created After signIn

## Masalah
Login berhasil authenticate (password benar, user approved), tapi:
- ❌ Halaman hanya refresh
- ❌ Tidak redirect ke dashboard
- ❌ Status masih "belum login"

## Root Causes yang Mungkin

### 1. ✅ FIXED: bcrypt import di admin panel
**Status:** SUDAH DIPERBAIKI di commit `7457985`
- Admin panel menggunakan `await import('bcryptjs')` tanpa `.default`
- Menyebabkan password hash rusak
- **Solusi:** Reset password user lagi di admin panel

### 2. 🔍 INVESTIGATING: Session cookie tidak terbuat

Kemungkinan penyebab:
- NEXTAUTH_URL tidak match dengan domain production
- NEXTAUTH_SECRET berbeda antara local dan production
- Cookie secure/sameSite settings
- Domain mismatch (www vs non-www)

## Verifikasi Environment Variables di Vercel

**CRITICAL:** Pastikan environment variables ini ada di Vercel Dashboard:

```bash
NEXTAUTH_URL=https://your-production-domain.vercel.app
NEXTAUTH_SECRET=<same_secret_as_local>
```

### Cara Check di Vercel:
1. Buka https://vercel.com/dashboard
2. Pilih project `webosis-archive`
3. Settings → Environment Variables
4. Cari `NEXTAUTH_URL` dan `NEXTAUTH_SECRET`
5. Pastikan nilai-nya benar

### Cara Update (jika salah):
```bash
# Di Vercel Dashboard
NEXTAUTH_URL = https://webosis-archive.vercel.app
NEXTAUTH_SECRET = TDBb5or_vE9Lo6w8QXFKjPut7xxMl3Jjp5MMFg9OKqk_webosis_2024_secret_key

# PENTING: Redeploy setelah update env vars!
```

## Console Logs untuk Debug

Setelah deployment terbaru (commit `a025c6d`), buka Browser Console (F12) saat login:

### Expected Flow (Success):
```
[Login] Calling signIn with credentials...
[NextAuth] authorize called with email: user@example.com
[NextAuth] Normalized email: user@example.com
[NextAuth] User lookup result: { found: true, hasPassword: true, email_verified: true, approved: true }
[NextAuth] Comparing password...
[NextAuth] Password valid: true
[NextAuth] authorize SUCCESS, returning user: { id: '...', email: '...', name: '...', role: '...' }
[NextAuth] signIn callback triggered: { user: user@example.com, hasUser: true, account: credentials }
[NextAuth] jwt callback: { hasUser: true, trigger: undefined, tokenSub: '...' }
[NextAuth] jwt - Added user to token: { id: '...', role: '...' }
[NextAuth] session callback: { hasSession: true, hasToken: true, tokenId: '...' }
[NextAuth] session - User in session: { id: '...', email: '...', role: '...' }
[Login] signIn response: { ok: true, error: null, status: 200, url: null }
[Login] signIn returned OK, verifying session...
[Login] Session verification: { user: { name: '...', email: '...', role: '...' } }
[Login] Session confirmed, redirecting to /admin
```

### If Session Not Created:
```
[Login] signIn response: { ok: true }
[Login] Session verification: {}  ← NO USER!
[Login] Session not found after signIn success!
Error: "Login berhasil tetapi sesi tidak terbuat"
```

## Troubleshooting Steps

### Step 1: Verify Environment Variables
```bash
# Check Vercel env vars
vercel env ls

# Should show:
# NEXTAUTH_URL     Production    https://your-domain.vercel.app
# NEXTAUTH_SECRET  Production    (encrypted)
```

### Step 2: Check Cookie Settings
Buka DevTools (F12) → Application → Cookies → Check for:
- `next-auth.session-token` (production)
- `__Secure-next-auth.session-token` (HTTPS)

Jika cookie tidak ada = session tidak terbuat!

### Step 3: Reset Password User
Karena bcrypt bug sebelumnya, reset password semua user yang bermasalah:
1. Login ke admin panel dengan akun yang masih bisa
2. Users → Edit user bermasalah
3. Set password baru
4. Save
5. Test login dengan password baru

### Step 4: Check NEXTAUTH_URL Domain Match
Production harus EXACT match:
```bash
# Jika deploy ke Vercel dengan custom domain:
NEXTAUTH_URL=https://webosis.yourdomain.com

# Jika pakai domain Vercel default:
NEXTAUTH_URL=https://webosis-archive.vercel.app

# PENTING: Harus HTTPS di production!
```

## Quick Fix Checklist

- [ ] Reset password user di admin panel (setelah bcrypt fix)
- [ ] Verify `NEXTAUTH_URL` di Vercel = production domain
- [ ] Verify `NEXTAUTH_SECRET` di Vercel ada dan valid
- [ ] Redeploy di Vercel setelah update env vars
- [ ] Clear browser cache/cookies
- [ ] Test login dengan password yang baru di-reset
- [ ] Check console logs untuk flow lengkap
- [ ] Check DevTools cookies untuk session token

## Next Steps

Jika semua di atas sudah dicek dan masih gagal, check:
1. Vercel deployment logs untuk error
2. NextAuth API routes `/api/auth/session` status
3. Cookie domain/path settings
4. Secure/SameSite cookie attributes
5. Middleware yang mungkin block cookies

## Contact
Jika masih stuck, provide:
- Screenshot console logs (full flow)
- Screenshot DevTools cookies tab
- Screenshot Vercel env vars (censored NEXTAUTH_SECRET)
- URL production yang diakses
