# RLS Policy Fix - URGENT

## The Problem
You're getting "new row violates row-level security policy" when trying to insert photos.

## The Solution
Run this SQL script in your Supabase SQL Editor:

**File: `supabase/fix_rls_complete.sql`**

This script will:
1. Drop all existing policies on `job_photos`
2. Recreate them correctly
3. Add an admin insert policy as backup
4. Verify the policies were created

## Why This Happens
The RLS policy requires that `jobs.lead_tech_id = auth.uid()`. If:
- The job doesn't have `lead_tech_id` set to your user ID
- The policies aren't applied in Supabase
- There's a mismatch between the job assignment and the user

Then the insert will fail.

## After Running the SQL
1. Verify the policies exist by checking the output of the SELECT query at the end
2. Make sure your job has `lead_tech_id` set to your user ID
3. Try uploading a photo again

## If It Still Fails
Check:
- Is the job assigned to you? (`jobs.lead_tech_id = your_user_id`)
- Are you logged in as the correct user?
- Do the policies show up in the verification query?

