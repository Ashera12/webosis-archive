# ⚙️ Vercel Environment Variables Setup

## Required Environment Variables

Pastikan semua environment variables ini ada di Vercel Dashboard:

### 1. Supabase Configuration

**Settings → Environment Variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (IMPORTANT!)
```

### 2. Check di Vercel Dashboard

1. Buka project di Vercel
2. Go to **Settings** → **Environment Variables**
3. Verify ada 3 variables dengan nama exactly:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 3. Service Role Key (CRITICAL!)

**Why needed:**
- Service role key **bypasses RLS** policies
- Allows API to insert/delete regardless of user auth
- Without it, admin cannot delete other users' comments

**Get from Supabase:**
1. Supabase Dashboard → Project Settings → API
2. Copy **service_role** key (NOT anon key!)
3. Paste ke Vercel env var: `SUPABASE_SERVICE_ROLE_KEY`

### 4. Apply Environment Variables

After adding/updating env vars in Vercel:

1. **Redeploy** (automatic if you push to main)
2. Or manual: Deployments → ... → Redeploy

**Environment variables only apply after redeploy!**

---

## Troubleshooting Vercel Issues

### Issue: Works locally, 500 on Vercel

**Cause:** Environment variables not set in Vercel

**Check:**
```bash
# In Vercel deployment logs, look for:
Missing NEXT_PUBLIC_SUPABASE_URL
Missing SUPABASE_SERVICE_ROLE_KEY
```

**Fix:**
1. Add env vars in Vercel Settings
2. Redeploy
3. Check logs: `[Comments API]` messages

---

### Issue: Admin cannot delete comments (403)

**Cause 1:** Service role key not used correctly

**Check API logs:**
```
[Comments API] DELETE request started
[Comments API] Session: { authenticated: true, role: 'admin' }
[Comments API] Permission check: { isAdmin: true, canDelete: true }
[Comments API] Delete error: { message: "..." }
```

**If you see RLS error:**
- Service role key not working
- Check env var name exact: `SUPABASE_SERVICE_ROLE_KEY`

**Cause 2:** `session.user.role` not set

**Check types/next-auth.d.ts:**
```typescript
interface Session {
  user: {
    role?: string; // ← Must exist
  }
}
```

**Verify in lib/auth.ts:**
```typescript
callbacks: {
  session({ session, token }) {
    if (session.user) {
      session.user.id = token.id as string;
      session.user.role = token.role as string; // ← Must be set
    }
    return session;
  }
}
```

---

### Issue: User cannot delete own comment

**Cause:** `author_id` not matching `session.user.id`

**Debug:**
```
[Comments API] Comment found: { authorId: "abc-123" }
[Comments API] Session: { userId: "xyz-789" }
[Comments API] Permission: { isOwner: false }
```

**Fix:** Ensure comment created with correct author_id:
- Check POST /api/comments logs
- Verify `author_id: session?.user?.id` saved correctly

---

## Production Deployment Checklist

Before deploying comment system to Vercel:

### Database
- ✅ Run `create_comments_table.sql` in Supabase
- ✅ Run `update_comments_with_replies_likes.sql`
- ✅ Run `add_comment_update_policy.sql`
- ✅ Run `fix_comment_permissions.sql` (for admin delete)

### Vercel Environment
- ✅ `NEXT_PUBLIC_SUPABASE_URL` set
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- ✅ `SUPABASE_SERVICE_ROLE_KEY` set (critical!)
- ✅ All other env vars dari .env.local

### Verify Deployment
```bash
# After deploy, check these endpoints:
curl https://yoursite.vercel.app/api/comments?contentId=test&contentType=post

# Should return: { "comments": [...] }
```

### Test Admin Delete
1. Login sebagai admin
2. Find comment ID dari GET response
3. Try delete via UI
4. Check Vercel logs: `[Comments API] DELETE...`

If 403:
- Check session.user.role = 'admin'
- Check service role key configured

If 500:
- Check Vercel logs untuk exact error
- Verify database policies

---

## Vercel Logs Access

**View real-time logs:**
1. Vercel Dashboard → Deployments → [Latest]
2. Click "Runtime Logs"
3. Watch `[Comments API]` messages when testing

**Search logs:**
```
[Comments API] DELETE
[Comments API] Permission check
[Comments API] Delete error
```

This shows exact error happening on Vercel!

---

## Quick Fix Commands

### Redeploy from CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Redeploy
vercel --prod
```

### Check env vars from CLI
```bash
vercel env ls
```

### Add env var from CLI
```bash
vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste value when prompted
# Select: Production, Preview, Development
```

---

## Common Errors & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| 500 "Missing SUPABASE..." | Env var not set | Add in Vercel Settings |
| 403 "Tidak memiliki izin" | Service role key not used | Check env var name exact |
| 404 "Komentar tidak ditemukan" | Wrong comment ID | Check ID dari GET response |
| "RLS policy violation" | Service role not bypassing | Verify SUPABASE_SERVICE_ROLE_KEY |

---

## Success Indicators

When everything works:

**Logs show:**
```
[Comments API] DELETE request started for: abc-123
[Comments API] Session: { authenticated: true, userId: "...", role: "admin" }
[Comments API] Comment found: { id: "abc-123", authorId: "xyz-456" }
[Comments API] Permission check: { isAdmin: true, isOwner: false, canDelete: true }
[Comments API] Comment deleted successfully: abc-123
```

**Response:**
```json
{ "success": true }
```

**UI:**
- Comment disappears dari list
- Toast: "Komentar berhasil dihapus"
- No 403 or 500 errors

---

## Still Not Working?

**Share this info:**
1. Vercel deployment logs (copy `[Comments API]` section)
2. Environment variables list (names only, not values!)
3. Session info: `{ role: "admin", id: "..." }`
4. Exact error message

**Example:**
```
Environment vars in Vercel:
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
❌ SUPABASE_SERVICE_ROLE_KEY (missing!)

Error: 403 Forbidden
Logs: [Comments API] Permission: { isAdmin: true, canDelete: true }
      [Comments API] Delete error: RLS policy violation
```

This helps identify exact problem! 🎯
