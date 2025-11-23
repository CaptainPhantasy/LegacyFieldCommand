# Storage Bucket Setup Guide

## ✅ Buckets Created
- `job-photos` (needs to be changed to **PRIVATE**)
- `policies` ✅
- `voice-recordings` ✅
- `measurements` ✅

## ⚠️ CRITICAL: Change job-photos to Private

**Why**: Job photos contain sensitive property information and should not be publicly accessible.

**Steps**:
1. Go to Supabase Dashboard > Storage
2. Click on `job-photos` bucket
3. Click "Edit bucket"
4. **Uncheck "Public bucket"** (make it private)
5. Save

## Storage Bucket Configuration

### All Buckets Should Be:
- **Public**: ❌ **NO** (Private/authenticated only)
- **File size limits**: As specified below
- **RLS**: Enabled (via SQL policies)

### Bucket Details

#### 1. `job-photos` (CHANGE TO PRIVATE)
- **Purpose**: Gate photos, arrival/departure photos
- **Public**: ❌ **NO** (change from public to private)
- **File size limit**: 10MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
- **Path format**: `jobs/{job_id}/photos/{filename}`

#### 2. `policies`
- **Purpose**: Policy PDF uploads
- **Public**: ❌ **NO**
- **File size limit**: 10MB
- **Allowed MIME types**: `application/pdf`
- **Path format**: `policies/{filename}`

#### 3. `voice-recordings`
- **Purpose**: Voice audio files for transcription
- **Public**: ❌ **NO**
- **File size limit**: 25MB
- **Allowed MIME types**: `audio/*` (mp3, wav, m4a, webm)
- **Path format**: `voice/{filename}`

#### 4. `measurements`
- **Purpose**: 3D scans, floorplans, measurement files
- **Public**: ❌ **NO**
- **File size limit**: 100MB
- **Allowed MIME types**: `*/*` (various 3D formats)
- **Path format**: `measurements/{job_id}/{filename}`

## RLS Policies Setup

After creating buckets and making `job-photos` private, run:

```sql
-- File: supabase/fix_storage_rls_all_buckets.sql
```

This will create RLS policies for all 4 buckets ensuring:
- Only authorized users can upload
- Only authorized users can view/download
- Role-based access control (admins see all, techs see assigned jobs)

## Signed URLs

Since all buckets are private, photos/files are accessed via **signed URLs**:

- **Field tech photos**: `/api/field/photos/[photoId]/url`
- **Admin photos**: `/api/admin/photos/[photoId]/url`
- **Policies**: Already uses signed URLs in `/api/admin/policies/[policyId]`
- **Measurements**: Already uses signed URLs in `/api/measurements/by-job/[jobId]`
- **Voice recordings**: Will use signed URLs when accessed

## Security Benefits

✅ **Private buckets** prevent direct URL access
✅ **RLS policies** enforce authorization at storage level
✅ **Signed URLs** provide time-limited access (1 hour expiry)
✅ **Role-based access** ensures users only see what they should

## Next Steps

1. ✅ Change `job-photos` to private
2. ✅ Run `fix_storage_rls_all_buckets.sql` in Supabase SQL Editor
3. ✅ Verify RLS policies are working
4. ✅ Test photo upload/access with different user roles

