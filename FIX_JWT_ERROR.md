# Fix JWT Decryption Error

## Problem
```
JWTSessionError: no matching decryption secret
```

## Cause
NEXTAUTH_SECRET berubah atau tidak ada di `.env.local`

## Solution

### 1. Generate Secret Baru
```powershell
# PowerShell - Generate random 32-byte base64 string
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### 2. Update .env.local
Tambah/update baris ini di `.env.local`:

```bash
NEXTAUTH_SECRET=your-generated-secret-here
```

**Contoh:**
```bash
NEXTAUTH_SECRET=Kix2f5gRa9x4yQ+8vP7lM2nB3cD4eF5gH6iJ7kL8mN9o=
```

### 3. Restart Server
```powershell
# Ctrl+C untuk stop, lalu:
npm run dev
```

### 4. Clear Browser Cookies (Optional)
Jika masih error, clear cookies untuk localhost:
- Chrome: DevTools → Application → Cookies → localhost
- Edge: DevTools → Application → Cookies → localhost

## Verification
- Login lagi di `/admin/login`
- Error `JWTSessionError` tidak muncul
- Session tersimpan dengan benar

---
**Note:** Jangan share NEXTAUTH_SECRET di public repo. Tambahkan ke `.gitignore`.
