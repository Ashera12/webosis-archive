# NextAuth + Ngrok Troubleshooting

## Common NextAuth Errors dengan Ngrok

### ❌ Error 1: "Callback URL Mismatch"

**Full Error:**
```
[next-auth][error][CALLBACK_URL_MISMATCH] 
Callback URL is not allowed by the configuration
```

**Penyebab:**
`NEXTAUTH_URL` di `.env.local` tidak match dengan ngrok URL

**Solution:**

1. **Check ngrok URL:**
   ```
   Forwarding    https://abc123.ngrok-free.app -> http://localhost:3001
   ```
   Copy: `https://abc123.ngrok-free.app`

2. **Update .env.local:**
   ```bash
   # Comment out localhost
   # NEXTAUTH_URL=http://localhost:3001
   
   # Add ngrok URL (NO trailing slash!)
   NEXTAUTH_URL=https://abc123.ngrok-free.app
   ```

3. **Restart Next.js:**
   ```powershell
   # Ctrl+C in Next.js terminal
   npm run dev
   ```

4. **Clear browser cookies:**
   - DevTools (F12) → Application → Cookies → Delete all for localhost

5. **Try login again** at `https://abc123.ngrok-free.app/admin/login`

---

### ❌ Error 2: "Invalid CSRF Token"

**Full Error:**
```
[next-auth][error][CSRF_TOKEN_MISMATCH]
CSRF token verification failed
```

**Penyebab:**
Session/cookies dari localhost masih tersimpan

**Solution:**

1. **Clear ALL cookies:**
   ```
   DevTools → Application → Storage → Clear site data
   ```

2. **Clear session storage:**
   ```javascript
   // Di console browser
   sessionStorage.clear()
   localStorage.clear()
   ```

3. **Restart browser** (optional tapi recommended)

4. **Akses ngrok URL dari private/incognito:**
   ```
   Ctrl+Shift+N (Chrome/Edge)
   Ctrl+Shift+P (Firefox)
   ```

5. **Login lagi**

---

### ❌ Error 3: "Mixed Content Blocked"

**Full Error:**
```
Mixed Content: The page at 'https://...' was loaded over HTTPS, 
but requested an insecure resource 'http://...'
```

**Penyebab:**
Ada resource yang load dari `http://` bukan `https://`

**Solution:**

1. **Check untuk hard-coded URLs:**
   ```typescript
   // ❌ BAD
   const API_URL = "http://localhost:3001/api"
   
   // ✅ GOOD
   const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"
   ```

2. **Update .env.local:**
   ```bash
   NEXT_PUBLIC_API_URL=/api
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   ```

3. **Use relative URLs:**
   ```typescript
   // ❌ Absolute
   fetch('http://localhost:3001/api/posts')
   
   // ✅ Relative
   fetch('/api/posts')
   ```

---

### ❌ Error 4: "Failed to Fetch" / Network Error

**Full Error:**
```
TypeError: Failed to fetch
```

**Penyebab:**
Ngrok tunnel tidak jalan atau Next.js server mati

**Solution:**

1. **Check ngrok status:**
   ```powershell
   # Lihat terminal ngrok - harus ada:
   # Session Status: online
   # Forwarding: https://xxxxx.ngrok-free.app -> http://localhost:3001
   ```

2. **Check Next.js status:**
   ```powershell
   # Lihat terminal Next.js - harus ada:
   # ✓ Ready in 2.3s
   # Local: http://localhost:3001
   ```

3. **Test local dulu:**
   ```
   Buka http://localhost:3001 di browser
   Pastikan site load dengan benar
   ```

4. **Then test ngrok:**
   ```
   Buka https://xxxxx.ngrok-free.app
   ```

---

### ❌ Error 5: "Session Expired" / Auto Logout

**Full Error:**
```
Session expired or invalid
```

**Penyebab:**
- `NEXTAUTH_SECRET` berubah
- JWT token invalid
- Cookie expired

**Solution:**

1. **Generate new NEXTAUTH_SECRET:**
   ```powershell
   $bytes = New-Object byte[] 32
   [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
   [Convert]::ToBase64String($bytes)
   ```

2. **Update .env.local:**
   ```bash
   NEXTAUTH_SECRET=<paste-new-secret-here>
   ```

3. **Restart Next.js**

4. **Clear cookies & login lagi**

---

### ❌ Error 6: "Redirect Loop" / Infinite Redirect

**Full Error:**
Browser says: "This page isn't working - too many redirects"

**Penyebab:**
Middleware atau auth check issue dengan ngrok URL

**Solution:**

1. **Check middleware.ts:**
   ```typescript
   // Pastikan /admin/login di-exclude
   export const config = {
     matcher: [
       '/admin/:path*',
       '/((?!api|_next/static|_next/image|favicon.ico|admin/login).*)',
     ],
   };
   ```

2. **Check NEXTAUTH_URL format:**
   ```bash
   # ❌ BAD (dengan trailing slash)
   NEXTAUTH_URL=https://abc123.ngrok-free.app/
   
   # ✅ GOOD
   NEXTAUTH_URL=https://abc123.ngrok-free.app
   ```

3. **Test tanpa middleware:**
   - Temporary rename `middleware.ts` → `middleware.ts.bak`
   - Restart server
   - Test login
   - Rename back

---

### ❌ Error 7: "Unauthorized" di Admin Pages

**Full Error:**
```
401 Unauthorized
Access Denied
```

**Penyebab:**
Session tidak ter-pass dengan benar di ngrok

**Solution:**

1. **Check auth() call:**
   ```typescript
   // Di app/admin/layout.tsx
   const session = await auth();
   console.log('Session:', session); // Debug
   ```

2. **Check cookies settings:**
   ```typescript
   // Di auth.ts atau next-auth config
   cookies: {
     sessionToken: {
       name: `__Secure-next-auth.session-token`,
       options: {
         httpOnly: true,
         sameSite: 'lax',
         path: '/',
         secure: true, // Important untuk HTTPS (ngrok)
       },
     },
   },
   ```

3. **Verify role di database:**
   ```sql
   -- Run di Supabase SQL Editor
   SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
   ```

---

## 🔍 Debug Checklist

Kalau ada error, cek satu per satu:

### ✅ Environment Variables
```powershell
# Check .env.local
Get-Content .env.local | Select-String "NEXTAUTH"
```

Harus ada:
- ✅ `NEXTAUTH_URL=https://xxxxx.ngrok-free.app` (match ngrok URL)
- ✅ `NEXTAUTH_SECRET=<long-random-string>` (bukan default/placeholder)

### ✅ Next.js Server
```
✓ Ready in X.Xs
Local: http://localhost:3001
```

### ✅ Ngrok Tunnel
```
Session Status: online
Forwarding: https://xxxxx.ngrok-free.app -> http://localhost:3001
```

### ✅ Browser
- Clear cookies & cache
- No mixed content warnings
- Session cookies present (check DevTools → Application → Cookies)

### ✅ Database
```sql
-- Check user exists
SELECT * FROM users WHERE email = 'admin@example.com';

-- Check role
SELECT role FROM users WHERE email = 'admin@example.com';
```

---

## 🛠️ Advanced Debugging

### Enable NextAuth Debug Mode

Update `.env.local`:
```bash
NEXTAUTH_DEBUG=true
LOG_LEVEL=debug
```

Restart → Check terminal untuk detailed logs

### Use Ngrok Inspector

1. Open http://localhost:4040
2. See all HTTP requests
3. Inspect headers (check cookies, auth tokens)
4. Replay requests for testing

### Check Network Tab

1. F12 → Network
2. Filter: `Fetch/XHR`
3. Look for failed auth requests
4. Check request/response headers

---

## 📝 Working Configuration Example

**File: `.env.local`**
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# NextAuth (Ngrok Mode)
NEXTAUTH_URL=https://abc123.ngrok-free.app
NEXTAUTH_SECRET=Kix2f5gRa9x4yQ+8vP7lM2nB3cD4eF5gH6iJ7kL8mN9o=

# Debug (optional)
# NEXTAUTH_DEBUG=true
```

**Terminal 1 - Next.js:**
```powershell
npm run dev
```

**Terminal 2 - Ngrok:**
```powershell
ngrok http 3001
```

**Steps:**
1. ✅ Start Next.js → wait for "Ready"
2. ✅ Start ngrok → copy URL
3. ✅ Update `NEXTAUTH_URL` in `.env.local`
4. ✅ Restart Next.js
5. ✅ Clear browser cookies
6. ✅ Test login at ngrok URL

---

## 🆘 Still Not Working?

### Option 1: Test Local First
```bash
# Revert to localhost
NEXTAUTH_URL=http://localhost:3001
```

Kalau local works → masalah di ngrok config
Kalau local fails → masalah di NextAuth setup

### Option 2: Use Production Mode
```powershell
npm run build
npm start
# Then ngrok http 3000
```

Sometimes dev mode has issues, production mode more stable

### Option 3: Check Supabase RLS
```sql
-- Make sure RLS tidak block authenticated users
SELECT * FROM pg_policies WHERE tablename = 'users';
```

---

## 📞 Resources

- NextAuth Docs: https://next-auth.js.org/configuration/options
- Ngrok Docs: https://ngrok.com/docs/secure-tunnels
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

---

**Masih error? Share screenshot error + output dari kedua terminal (Next.js & Ngrok)** 🔍
