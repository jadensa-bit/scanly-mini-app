# Profile Photo Upload Setup Guide

## Current Status
✅ **Enhanced profile photo upload functionality**
- Better error handling and validation
- Saves to both auth metadata AND profiles table
- Auto-creates profile record if missing
- Shows upload progress
- Clear success/error messages

## ⚠️ REQUIRED: Database Migration

The `avatar_url` column is **missing** from the `profiles` table and must be added.

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** → **New Query**
4. Paste this SQL and click **Run**:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

5. Verify success (should see "Success. No rows returned")

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db reset  # Runs all migrations
```

Or apply just this migration:

```bash
supabase migration up --file 10_create_profiles_table.sql
```

## What Was Enhanced

### 1. Improved Error Handling (`/src/app/profile/page.tsx`)
- ✅ Better file validation messages
- ✅ Auto-dismissing error/success messages (5s/3s)
- ✅ Creates profile record if missing
- ✅ Detailed console logging for debugging
- ✅ Fallback to profile creation if update fails

### 2. Upload Flow
```
1. User selects image file
2. Validates file type (image/*) and size (<5MB)
3. Uploads to Supabase storage: uploads/profile-pictures/{userId}-{timestamp}.{ext}
4. Gets public URL
5. Updates auth.user metadata (profile_picture field)
6. Updates profiles.avatar_url in database
7. Refreshes user session
8. Shows success message
```

### 3. Display Logic
- Shows profile picture from `profiles.avatar_url` OR `user.user_metadata.profile_picture`
- Fallback to user's first letter if no photo
- Multiple display locations:
  - Large avatar at top of profile page
  - Thumbnail in profile settings
  - Public profile page (`/profile/[handle]`)

## Testing

After adding the column, run this test:

```bash
node test-profile-photo.mjs
```

Expected output:
```
✅ Uploads bucket exists
✅ Profiles table has avatar_url column
✅ Storage policies configured
✅ Path structure is correct
```

## Files Modified

1. **`/src/app/profile/page.tsx`**
   - Enhanced `handleProfilePictureUpload` function
   - Better error messages
   - Auto-create profile if missing
   - Better logging

2. **`/test-profile-photo.mjs`** (NEW)
   - Verification script for setup

3. **`/add-avatar-url-column.mjs`** (NEW)
   - Helper script to add column (requires manual SQL)

## Next Steps

1. ✅ Add the `avatar_url` column (see migration above)
2. ✅ Test profile photo upload in your app
3. ✅ Verify photos display correctly
4. ✅ Check public profile pages show avatars

## Troubleshooting

### "Column avatar_url does not exist"
→ Run the migration SQL above

### "Failed to upload profile picture"
→ Check:
- Uploads bucket exists and is public
- File is under 5MB
- File is a valid image type

### Photo not displaying
→ Check browser console for:
- 403 errors (bucket not public)
- 404 errors (file not found)
- CORS errors (bucket policy issue)

## Storage Bucket Configuration

The `uploads` bucket should have these settings:
- **Public**: ✅ Yes
- **File size limit**: 5MB
- **Allowed types**: image/jpeg, image/png, image/gif, image/webp, image/svg+xml

Verify with:
```bash
node verify-uploads.mjs
```

---

**Summary**: Run the SQL migration above, then users can upload profile photos that will save correctly! 🎉
