# Kelas Column Migration Instructions

## Database Migration Required

Before deploying this update, you **MUST** run the following SQL script in your Supabase SQL Editor:

### Step-by-Step Guide:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**
   - Copy the contents of `ADD_KELAS_COLUMN.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - Check that the `kelas` column exists:
     ```sql
     SELECT column_name, data_type 
     FROM information_schema.columns 
     WHERE table_name = 'users' AND column_name = 'kelas';
     ```

## What This Migration Does

- ✅ Adds `kelas` column to `users` table (type: text, nullable)
- ✅ Creates index on `kelas` for better query performance
- ✅ Adds column comment for documentation

## Changes Included in This Update

### Database
- New `kelas` column in users table for student class/grade information

### API Endpoints (Updated to support kelas)
- ✅ `/api/admin/users` - List users with kelas
- ✅ `/api/admin/users/[id]` - Get/Update user with kelas
- ✅ `/api/profile` - User profile with kelas
- ✅ `/api/auth/register` - Registration with kelas (already supported)

### UI Enhancements
- ✅ Registration form - Added kelas input field
- ✅ Admin users panel - Added kelas, nickname, unit_sekolah, nik, nisn fields
- ✅ Role badges - Enhanced with gradients, shadows, better icons
  - Gradient backgrounds for visual depth
  - Shadow effects for better contrast
  - Improved dark mode visibility
  - Better icon selection (graduation cap for students)
  - Support for xl size badges

### Components Updated
- `components/RoleBadge.tsx` - Enhanced visual appearance
- `app/register/page.tsx` - Added kelas field
- `app/admin/users/page.tsx` - Added all profile fields to edit form

## Testing Checklist

After running the migration:

- [ ] Run the SQL migration in Supabase
- [ ] Restart your development server (`npm run dev`)
- [ ] Register a new user and fill in kelas field
- [ ] Verify kelas appears in user dashboard
- [ ] Edit a user in admin panel and set kelas
- [ ] Check that role badges display with new gradient/shadow styles
- [ ] Verify dark mode contrast improvements
- [ ] Test all role types (super_admin, admin, moderator, osis, guru, siswa)

## Rollback (If Needed)

If you encounter issues and need to rollback:

```sql
-- Remove the kelas column
DROP INDEX IF EXISTS idx_users_kelas;
ALTER TABLE public.users DROP COLUMN IF EXISTS kelas;
```

## Support

If you encounter any issues:
1. Check Supabase logs for errors
2. Verify the migration completed successfully
3. Clear browser cache and reload
4. Check browser console for errors
