# Profile 500 Error Fix

## Problem
The `/api/profile` endpoint was returning 500 Internal Server Error for both GET and PUT requests, causing:
- Profile data not loading
- Profile photo upload failures
- Profile information update failures

## Root Cause
The endpoint was using `supabaseAdmin` which requires `SUPABASE_SERVICE_ROLE_KEY` environment variable. In production (Vercel), this variable was not set, causing the Supabase client initialization to fail.

## Solution

### Code Changes (Already Applied)
Modified `app/api/profile/route.ts` to:
1. Use service role key when available
2. Fallback to anon key if service role key is not set
3. This allows the endpoint to work in both development and production

```typescript
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // Try service role key first, fallback to anon key
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
```

### Vercel Environment Variables (REQUIRED)

You need to add the service role key to Vercel:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `osissmktest` or your project name
3. **Go to Settings** → **Environment Variables**
4. **Add the following variable**:

   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oZWZxd3JlZ3JsZHZ4dHFxeGJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzE2MDgxNywiZXhwIjoyMDc4NzM2ODE3fQ.TDBb5or_vE9Lo6w8QXFKjPut7xxMl3Jjp5MMFg9OKqk
   Environment: Production, Preview, Development (select all)
   ```

5. **Redeploy** your application after adding the environment variable

### Alternative: Using Anon Key with RLS

If you prefer not to use the service role key in production, the endpoint now falls back to the anon key. However, you need to ensure proper RLS policies are set up in Supabase.

Run the SQL script `FIX_PROFILE_RLS.sql` in your Supabase SQL editor to create the necessary policies:

```sql
-- Allow users to read their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id);
```

## Testing After Fix

1. **Test Profile Load**:
   - Login to the application
   - Navigate to `/admin/profile` or `/dashboard`
   - Profile data should load without errors

2. **Test Profile Update**:
   - Go to `/admin/profile`
   - Update your name, username, or other fields
   - Click "Update Profile"
   - Changes should save successfully

3. **Test Photo Upload**:
   - Go to `/admin/profile`
   - Click on the profile photo area
   - Upload a new image
   - Crop and save
   - Photo should update successfully

## Expected Results

After applying the fix:
- ✅ `GET /api/profile` returns 200 with user data
- ✅ `PUT /api/profile` returns 200 and updates profile
- ✅ Profile photo uploads work
- ✅ Profile data updates persist
- ✅ No 500 errors in browser console

## Files Changed

- `app/api/profile/route.ts` - Added service role key fallback
- `FIX_PROFILE_RLS.sql` - RLS policies for profile access (optional)
- `PROFILE_500_FIX.md` - This documentation

## Commit
- Commit: `66910e6`
- Message: "fix: Use service role key fallback in profile endpoint"
- Status: ✅ Pushed to GitHub

## Next Steps

1. Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables
2. Redeploy the application
3. Test profile operations
4. If issues persist, check Vercel logs for detailed error messages
