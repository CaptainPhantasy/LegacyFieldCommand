# Supabase Schema Verification Report

## ✅ Tables Accessible
- ✅ `profiles` - 3 users found
- ✅ `jobs` - 0 jobs (needs jobs to be created)
- ✅ `job_photos` - 0 photos (expected, no jobs yet)
- ✅ `job_gates` - Not checked, but should exist

## 👥 Current Users
1. **tech@legacyfield.com** (field_tech)
   - ID: `42e04a00-7c38-4828-a40c-3fe118a9d230`
   
2. **test@legacyfield.com** (admin)
   - ID: `dda091a4-28d7-436e-99b6-ef091fb3c73e`
   
3. **testuser@legacyfield.com** (field_tech)
   - ID: `1c18876b-37a7-4acb-b2ba-2ab3cfcfc156`

## ⚠️ CRITICAL ISSUE FOUND

**NO JOBS EXIST IN THE DATABASE**

This is why RLS policies are failing! The RLS policy requires:
```sql
jobs.lead_tech_id = auth.uid()
```

But if there are no jobs, or if jobs don't have `lead_tech_id` set, the policy will fail.

## 📋 Required Actions

### 1. Verify RLS Policies Exist
Run this SQL in Supabase SQL Editor:
```sql
-- File: supabase/verify_rls_policies.sql
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'job_photos';
```

**Expected Policies:**
- ✅ "Techs insert photos for assigned jobs" (INSERT)
- ✅ "Techs view photos for assigned jobs" (SELECT)
- ✅ "Admins insert photos" (INSERT)
- ✅ "Admins view all photos" (SELECT)

### 2. Fix RLS Policies (If Missing)
Run this SQL in Supabase SQL Editor:
```sql
-- File: supabase/fix_rls_complete.sql
```

This will:
- Drop all existing policies
- Recreate them correctly
- Add admin insert policy
- Verify they were created

### 3. Create a Test Job
You need to:
1. Log in as admin (`test@legacyfield.com`)
2. Create a new job
3. **Assign it to a field tech** (set `lead_tech_id` to one of the field tech user IDs)
4. Then the field tech can upload photos

## 🔍 Schema Structure (Verified)

### job_photos Table
- `id` (uuid, primary key)
- `job_id` (uuid, references jobs)
- `gate_id` (uuid, references job_gates)
- `storage_path` (text)
- `metadata` (jsonb)
- `is_ppe` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- **RLS Enabled**: ✅ Yes

### RLS Policy Logic
```sql
-- For field_tech users:
-- Can INSERT if: jobs.lead_tech_id = auth.uid()
-- Can SELECT if: jobs.lead_tech_id = auth.uid()

-- For admin/owner/estimator users:
-- Can INSERT: Always (if role matches)
-- Can SELECT: Always (if role matches)
```

## ✅ Next Steps

1. **Run `supabase/verify_rls_policies.sql`** to check current policies
2. **Run `supabase/fix_rls_complete.sql`** if policies are missing/wrong
3. **Create a test job** assigned to a field tech
4. **Test photo upload** as that field tech

## 🎯 Summary

- ✅ Schema structure is correct
- ✅ Tables are accessible
- ✅ Users exist
- ⚠️ **No jobs exist** - this is the main issue
- ❓ **RLS policies need verification** - run the SQL scripts

The RLS error you're getting is likely because:
1. Either the policies don't exist (run fix_rls_complete.sql)
2. Or the job doesn't have lead_tech_id set (assign job to field tech)

