# Quick RLS Fix - Run These Steps

## The Problem
You're getting "new row violates row-level security policy" even after running the SQL fix.

## Most Likely Causes (in order):

### 1. Job Not Assigned (90% likely)
The job's `lead_tech_id` doesn't match your user ID.

**Fix:** Run this in Supabase SQL Editor (replace with your actual values):
```sql
-- Find your user ID
SELECT id, email FROM profiles WHERE email = 'tech@legacyfield.com';

-- Find the job ID you're trying to upload photos for
SELECT id, title, lead_tech_id FROM jobs;

-- Assign the job to your user (replace USER_ID and JOB_ID)
UPDATE jobs 
SET lead_tech_id = 'YOUR_USER_ID_HERE' 
WHERE id = 'YOUR_JOB_ID_HERE';
```

### 2. Policies Not Applied (5% likely)
The RLS policies weren't actually created.

**Fix:** Run `supabase/fix_rls_complete_v2.sql` in Supabase SQL Editor, then verify:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'job_photos';
```
Should show 4 policies.

### 3. Wrong User Logged In (5% likely)
You're logged in as a different user than the one the job is assigned to.

**Fix:** Log out and log in as the correct field tech user.

## Test Script

Run this to diagnose:
```bash
node scripts/test_rls_policies.js tech@legacyfield.com TestPass123! YOUR_JOB_ID
```

This will show you exactly what's wrong.

