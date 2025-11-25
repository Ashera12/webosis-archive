# Password Reset Testing Guide

## ✅ Fixes Implemented

### 1. Hydration Error Fixed
- **Problem**: Browser extensions (like form autofill) adding `fdprocessedid` attributes causing React hydration mismatch
- **Solution**: Added `suppressHydrationWarning` to all form inputs and buttons
- **Files Fixed**:
  - `app/admin/forgot-password/page.tsx`
  - `app/admin/reset-password/[token]/page.tsx`

### 2. Next.js 15 Params Compatibility
- **Problem**: Dynamic route params are now Promises in Next.js 15
- **Solution**: Used `use()` hook to unwrap params Promise
- **File Fixed**: `app/admin/reset-password/[token]/page.tsx`

### 3. Logo Integration in Emails
- **Added**: Logo OSIS (`/images/logo-2.png`) automatically included in all reset password emails
- **Files Updated**:
  - `lib/mailer.ts` - Added `logoUrl` parameter
  - `app/api/auth/forgot-password/route.ts` - Passes logo URL to email template

---

## 🧪 Complete Testing Checklist

### Phase 1: Request Reset Password

1. **Navigate to Forgot Password**
   ```
   URL: http://localhost:3000/admin/forgot-password
   ```

2. **Test Invalid Email**
   - Input: `notexist@example.com`
   - Expected: ✅ Generic success message (security: don't reveal user existence)
   - Actual behavior: "Jika email terdaftar, link reset telah dibuat"

3. **Test Valid Email**
   - Input: Email of existing user (e.g., admin email)
   - Expected:
     - ✅ Success message shown
     - ✅ Console log shows `[mailer] Sent via SendGrid` or `[mailer] Sent via SMTP`
     - ✅ In development: `debugResetLink` displayed on page
     - ✅ Email received in inbox with logo OSIS

4. **Test Rate Limiting**
   - Try requesting reset 4+ times in 5 minutes
   - Expected: ❌ Error "Terlalu banyak permintaan lupa password"

5. **Check Email Content**
   - Subject: "Reset Password Akun OSIS Anda" (Indonesian) or "Reset Your OSIS Account Password" (English)
   - Logo: OSIS logo visible at top (modern variant: white on gradient, minimal variant: color)
   - Button: "Reset Password" clickable
   - Link expiry: States "valid for 60 minutes"
   - Footer: Copyright © 2025 OSIS SMK Informatika Fithrah Insani

---

### Phase 2: Reset Password via Email Link

1. **Click Email Link**
   - Email link format: `https://yourdomain.com/admin/reset-password/[64-char-hex-token]`
   - Expected: Redirects to reset password form page

2. **Test Invalid Token Format**
   - Try: `http://localhost:3000/admin/reset-password/invalid`
   - Expected: ❌ "Token format tidak valid" warning shown, submit button disabled

3. **Test Expired Token**
   - Use token created >60 minutes ago
   - Expected: ❌ Error "Token telah kedaluwarsa" when submitting

4. **Test Weak Password**
   - Password: `weak`
   - Expected: ❌ Error with validation messages:
     - "Minimal 8 karakter"
     - "Harus ada huruf besar (A-Z)"
     - "Harus ada angka (0-9)"

5. **Test Password Mismatch**
   - Password: `NewPass123`
   - Confirm: `NewPass124`
   - Expected: ❌ Error "Konfirmasi password tidak cocok"

6. **Test Valid Reset**
   - Password: `NewSecure123`
   - Confirm: `NewSecure123`
   - Expected:
     - ✅ Success message "Password berhasil direset"
     - ✅ Auto-redirect to `/admin/login` after 2.5 seconds
     - ✅ Console log: `[reset-password] Password updated for user [id]`

7. **Test Token Reuse**
   - Try using same token again after successful reset
   - Expected: ❌ Error "Token sudah digunakan"

---

### Phase 3: Login with New Password

1. **Test Old Password**
   - Email: (user email)
   - Password: (old password before reset)
   - Expected: ❌ Error "Password salah"

2. **Test New Password**
   - Email: (user email)
   - Password: `NewSecure123` (the new password)
   - Expected:
     - ✅ Login successful
     - ✅ Redirected to `/admin` dashboard
     - ✅ Session created with correct role

3. **Verify Role Persistence**
   - After login, check session:
     ```typescript
     const session = await auth();
     console.log(session.user.role); // Should match original role
     ```
   - Expected: Role unchanged (e.g., `admin`, `super_admin`, `osis`)

---

### Phase 4: Security & Role Verification

1. **Check Middleware Protection**
   - Try accessing `/admin` without login
   - Expected: ❌ Redirect to `/admin/login?callbackUrl=/admin`

2. **Test Role-Based Access**
   - User with role `siswa` tries accessing `/admin`
   - Expected: ❌ Redirect to `/admin/login?error=unauthorized`

3. **Test Allowed Roles**
   - Roles from `ADMIN_ALLOWED_ROLES` env var (default: `super_admin,admin,osis`)
   - Expected: ✅ Access granted to admin area

4. **Check Password Hash**
   - Query database:
     ```sql
     SELECT password_hash FROM users WHERE email = 'user@example.com';
     ```
   - Expected: Hash changed after reset (bcrypt hash format: starts with `$2a$` or `$2b$`)

5. **Verify Token Cleanup**
   - Check `password_resets` table:
     ```sql
     SELECT * FROM password_resets WHERE user_id = 'user-id' ORDER BY created_at DESC;
     ```
   - Expected:
     - Latest token marked `used = true`
     - Expired tokens can be cleaned up (optional background job)

---

## 🔒 Security Validation

### Password Requirements
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)

### Token Security
- ✅ Tokens are 64-character hexadecimal (32 bytes random)
- ✅ Stored as SHA-256 hash in database
- ✅ Single-use only (marked `used = true` after reset)
- ✅ Auto-expire after 60 minutes

### Rate Limiting
- ✅ Max 3 forgot password requests per 5 minutes per email
- ✅ In-memory rate limiting (process-local)

### Data Protection
- ✅ Generic responses (don't reveal if email exists)
- ✅ Password hashed with bcrypt (10 rounds default)
- ✅ Role verification in middleware
- ✅ Session-based authentication via NextAuth

---

## 📧 Email Template Testing

### Modern Variant (Default)
```typescript
buildResetEmail({ 
  resetLink: '...', 
  name: 'Budi',
  logoUrl: 'https://example.com/images/logo-2.png'
})
```
- ✅ Gradient header (orange)
- ✅ Logo inverted to white
- ✅ Dark mode support
- ✅ Responsive design

### Minimal Variant
```typescript
buildResetEmail({ 
  resetLink: '...', 
  variant: 'minimal',
  logoUrl: 'https://example.com/images/logo-2.png'
})
```
- ✅ Clean white/gray design
- ✅ Logo original colors
- ✅ Better email client compatibility
- ✅ Simplified layout

### English Variant
```typescript
buildResetEmail({ 
  resetLink: '...', 
  lang: 'en',
  logoUrl: 'https://example.com/images/logo-2.png'
})
```
- ✅ All text in English
- ✅ Subject: "Reset Your OSIS Account Password"
- ✅ Button: "Reset Password"

---

## 🐛 Common Issues & Solutions

### Issue: Email Not Received
**Symptoms**: No email in inbox after requesting reset
**Checks**:
1. Check spam/junk folder
2. Verify SendGrid API key: `process.env.SENDGRID_API_KEY`
3. Verify sender email verified in SendGrid: `process.env.SENDGRID_FROM`
4. Check server logs for `[mailer]` errors
5. In development, use `debugResetLink` from response

**Solution**: Configure SMTP fallback or use development link

---

### Issue: Hydration Error
**Symptoms**: Console error "attributes didn't match"
**Cause**: Browser extension (form autofill, password manager) adding attributes
**Solution**: ✅ Already fixed with `suppressHydrationWarning`

---

### Issue: Token Invalid
**Symptoms**: "Token tidak valid atau sudah digunakan"
**Possible Causes**:
1. Token already used
2. Token expired (>60 minutes)
3. Token not found in database
4. Token format incorrect (not 64-char hex)

**Debug**:
```sql
SELECT * FROM password_resets 
WHERE token_hash = SHA256(UNHEX('your-token-here')) 
ORDER BY created_at DESC;
```

---

### Issue: Role Not Persisting
**Symptoms**: User role changes after password reset
**Expected**: Role should remain unchanged
**Verification**:
```sql
-- Before reset
SELECT id, email, role FROM users WHERE email = 'user@example.com';

-- After reset (should be same)
SELECT id, email, role FROM users WHERE email = 'user@example.com';
```

---

## 🎯 Production Deployment Checklist

- [ ] Set `SENDGRID_API_KEY` in production environment
- [ ] Set `SENDGRID_FROM` with verified sender email
- [ ] Configure `PASSWORD_SALT_ROUNDS` (default: 10)
- [ ] Set `ADMIN_ALLOWED_ROLES` (default: `super_admin,admin,osis`)
- [ ] Verify logo accessible via absolute URL
- [ ] Test email delivery in production domain
- [ ] Enable HTTPS for reset links
- [ ] Set up monitoring for `[mailer]` and `[reset-password]` logs
- [ ] Consider adding background job to clean expired tokens
- [ ] Document password policy for users

---

## ✅ All Tests Passed

- [x] Forgot password form loads without hydration errors
- [x] Email sent with OSIS logo
- [x] Reset link redirects to correct page
- [x] Password validation working
- [x] New password can login successfully
- [x] Role remains unchanged after reset
- [x] Token marked as used after successful reset
- [x] Expired tokens rejected
- [x] Rate limiting prevents abuse
- [x] Middleware protects admin routes

---

**Status**: ✅ Password reset system fully functional and secure
**Last Updated**: 2025-11-22
