# Password Reset Database Setup

## Missing Table Error Fix

**Error**: `Could not find the table 'public.password_resets' in the schema cache`

**Solution**: Run the SQL migration to create the `password_resets` table.

---

## Quick Setup

### Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire content of `create_password_resets_table.sql`
5. Click **Run** or press `Ctrl+Enter`
6. Verify success message: "password_resets table created successfully"

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push create_password_resets_table.sql
```

### Option 3: psql Command Line

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f create_password_resets_table.sql
```

---

## Table Schema

```sql
password_resets
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key → users.id)
├── token_hash (VARCHAR(64), SHA-256 hash)
├── expires_at (TIMESTAMPTZ)
├── used (BOOLEAN, default: false)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### Indexes Created
- `idx_password_resets_token_hash` - Fast token lookup
- `idx_password_resets_user_id` - Fast user lookup
- `idx_password_resets_expires_at` - Fast expiry checks

---

## Row Level Security (RLS)

The table has RLS enabled with the following policies:

1. **Admin Management**: Super admins, admins, and service roles can manage all records
2. **User View Own**: Users can view their own password reset history
3. **Service Insert**: API can insert new reset tokens
4. **Service Update**: API can mark tokens as used

---

## Testing After Setup

1. **Verify Table Creation**:
   ```sql
   SELECT tablename FROM pg_tables WHERE tablename = 'password_resets';
   ```
   Expected: 1 row returned

2. **Check Indexes**:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'password_resets';
   ```
   Expected: 4 indexes (3 custom + 1 primary key)

3. **Test Insert** (via API):
   - Go to `http://localhost:3000/admin/forgot-password`
   - Enter a valid email
   - Click "Kirim Link Reset"
   - Expected: ✅ Success message (no more "Could not find table" error)

4. **Verify Data**:
   ```sql
   SELECT id, user_id, used, expires_at, created_at 
   FROM password_resets 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

---

## Maintenance

### Clean Up Expired Tokens (Optional)

Run this periodically to remove old expired tokens:

```sql
DELETE FROM password_resets 
WHERE expires_at < NOW() - INTERVAL '7 days';
```

Or create a cron job in Supabase:

```sql
-- Create a function to clean up old tokens
CREATE OR REPLACE FUNCTION cleanup_expired_password_resets()
RETURNS void AS $$
BEGIN
  DELETE FROM password_resets 
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule it to run daily (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-password-resets', '0 2 * * *', 'SELECT cleanup_expired_password_resets();');
```

---

## Troubleshooting

### Issue: "permission denied for table password_resets"

**Solution**: Grant permissions to service role
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_resets TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.password_resets TO authenticated;
```

### Issue: "relation password_resets does not exist"

**Solution**: Make sure you ran the migration in the correct database/schema
```sql
-- Check current schema
SELECT current_schema();

-- Should return: public
```

### Issue: Foreign key constraint fails

**Solution**: Ensure `users` table exists first
```sql
-- Verify users table exists
SELECT tablename FROM pg_tables WHERE tablename = 'users';
```

---

## Next Steps

After creating the table:

1. ✅ Test forgot password flow: `/admin/forgot-password`
2. ✅ Verify email delivery with reset link
3. ✅ Test password reset: `/admin/reset-password/[token]`
4. ✅ Confirm login with new password
5. ✅ Check token marked as `used = true` after reset

---

## Related Files

- `create_password_resets_table.sql` - Migration SQL script
- `app/api/auth/forgot-password/route.ts` - API endpoint that uses this table
- `app/api/auth/reset-password/route.ts` - API endpoint that validates tokens
- `PASSWORD_RESET_TESTING_GUIDE.md` - Complete testing guide

---

**Status**: Ready to deploy
**Last Updated**: 2025-11-22
