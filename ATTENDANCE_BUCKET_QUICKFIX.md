# URGENT FIX: Attendance Storage Bucket Missing

## ⚠️ Problem
Error: `Bucket not found` when uploading biometric photos.

The `attendance` storage bucket doesn't exist in your Supabase project.

## ✅ Quick Fix (2 minutes)

### Method 1: Supabase Dashboard (RECOMMENDED)

1. **Open Supabase Dashboard**
   - Go to: https://mhefqwregrldvxtqqxbb.supabase.co
   - Navigate to: **Storage** (left sidebar)

2. **Create Bucket**
   - Click **"New bucket"** button
   - Enter bucket name: `attendance`
   - ✅ **Check "Public bucket"** (IMPORTANT!)
   - Set file size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg, image/png, image/webp`
   - Click **"Create bucket"**

3. **Set Up Policies**
   - Click on the `attendance` bucket
   - Go to **Policies** tab
   - Click **"New Policy"**
   - Click **"For full customization"**
   - Add these policies:

   **Policy 1: INSERT (Upload own photos)**
   ```sql
   CREATE POLICY "Users can upload their own selfies"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'attendance' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

   **Policy 2: SELECT (Read public)**
   ```sql
   CREATE POLICY "Public read access"
   ON storage.objects
   FOR SELECT
   TO public
   USING (bucket_id = 'attendance');
   ```

   **Policy 3: UPDATE (Update own photos)**
   ```sql
   CREATE POLICY "Users can update their own selfies"
   ON storage.objects
   FOR UPDATE
   TO authenticated
   USING (
     bucket_id = 'attendance' AND
     (storage.foldername(name))[1] = auth.uid()::text
   )
   WITH CHECK (
     bucket_id = 'attendance' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

   **Policy 4: DELETE (Delete own photos)**
   ```sql
   CREATE POLICY "Users can delete their own selfies"
   ON storage.objects
   FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'attendance' AND
     (storage.foldername(name))[1] = auth.uid()::text
   );
   ```

4. **Done!** Test biometric registration again.

### Method 2: Supabase CLI (Alternative)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
npx supabase login

# Link project
npx supabase link --project-ref mhefqwregrldvxtqqxbb

# Create bucket
npx supabase storage create attendance --public

# Run SQL for policies
npx supabase db push --file SETUP_ATTENDANCE_STORAGE.sql
```

## 🔍 Verification

After creating the bucket, test the upload:

1. Go to: https://osissmktest.biezz.my.id/attendance
2. Click "Daftar Biometric"
3. Capture photo
4. Should succeed without "Bucket not found" error

## 📁 File Structure

After successful upload, files will be stored as:
```
attendance/
  └── selfies/
      └── {user-id}/
          └── {timestamp}.jpg
```

Example:
```
attendance/selfies/ec380051-e684-4dd0-b972-e05fdf246db2/1764476498262.jpg
```

## 🔒 Security Features

✅ Users can only upload to their own folder (by user ID)
✅ Public read access (needed for AI verification)
✅ Users can update/delete their own photos only
✅ 5MB file size limit
✅ Only image files allowed (JPEG, PNG, WebP)

## ⚡ Expected Behavior After Fix

1. **Capture Photo** → Photo displays in preview
2. **Click "Daftar Biometric"** → Upload starts
3. **Console logs**:
   ```
   [Upload] Starting upload for user: ec380051-...
   [Upload] Blob size: 105.39 KB
   [Upload] Response status: 200
   [Upload] ✅ Upload success!
   ```
4. **Registration succeeds** → Biometric setup complete
5. **Dashboard updated** → Activity logged

## 🐛 Common Issues

### Issue: "Bucket not found"
- **Cause**: Bucket doesn't exist
- **Fix**: Create bucket using Method 1 above

### Issue: "new row violates row-level security policy"
- **Cause**: RLS policies not set
- **Fix**: Add policies from Step 3 above

### Issue: "File too large"
- **Cause**: File > 5MB
- **Fix**: Increase bucket size limit or compress image

### Issue: "Invalid MIME type"
- **Cause**: File not JPEG/PNG/WebP
- **Fix**: Add MIME type to allowed list

## 📊 Monitoring

Check bucket usage in Supabase Dashboard:
- **Storage** > **attendance** > **Usage**
- Monitor: File count, Total size, Bandwidth

## 🔧 Related Files

- `app/api/attendance/upload-selfie/route.ts` - Upload handler
- `app/attendance/page.tsx` - Frontend upload logic
- `SETUP_ATTENDANCE_STORAGE.sql` - SQL setup script

## 💡 Next Steps After Fix

Once bucket is created:

1. ✅ Test biometric registration
2. ✅ Verify photo in Supabase Storage
3. ✅ Test AI face verification
4. ✅ Check dashboard activity log
5. ✅ Test attendance with biometric

## 🆘 Need Help?

If issues persist after creating bucket:

1. Check browser console for errors
2. Check Supabase logs: Dashboard > Logs > Storage
3. Verify policies: Storage > attendance > Policies
4. Test with Postman/curl to isolate frontend/backend
