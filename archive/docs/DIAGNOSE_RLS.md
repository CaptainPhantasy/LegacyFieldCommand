# RLS Diagnosis Guide

You're still getting RLS errors. Let's diagnose the exact issue.

## Step 1: Verify Policies Are Applied

Run this in Supabase SQL Editor:

```sql
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'job_photos';
```

**Expected:** You should see 4 policies:
- "Techs insert photos for assigned jobs" (INSERT)
- "Techs view photos for assigned jobs" (SELECT)  
- "Admins insert photos" (INSERT)
- "Admins view all photos" (SELECT)

**If you see fewer than 4 policies:** The policies weren't applied. Run `supabase/fix_rls_complete_v2.sql`.

## Step 2: Check Job Assignment

Run this in Supabase SQL Editor (replace with your actual job ID):

```sql
SELECT 
  j.id,
  j.title,
  j.lead_tech_id,
  p.email as assigned_to,
  p.role as assigned_role
FROM jobs j
LEFT JOIN profiles p ON j.lead_tech_id = p.id
WHERE j.id = 'YOUR_JOB_ID_HERE';
```

**Check:**
- Is `lead_tech_id` NULL? → Job is unassigned
- Does `lead_tech_id` match your user ID? → Should work
- Does `lead_tech_id` match a different user? → Won't work

## Step 3: Test RLS Directly

Run the test script:

```bash
node scripts/test_rls_policies.js tech@legacyfield.com TestPass123! YOUR_JOB_ID
```

This will:
- Log in as the field tech
- Check job assignment
- Try to INSERT a test photo
- Show exactly why it fails

## Step 4: If Still Failing

If the test shows assignment is correct but INSERT still fails, the policy might have a bug. Try this alternative policy structure in `supabase/fix_rls_complete_v2.sql`.

## Common Issues:

1. **Job not assigned** → Update job: `UPDATE jobs SET lead_tech_id = 'USER_ID' WHERE id = 'JOB_ID';`
2. **Policies not applied** → Run `supabase/fix_rls_complete_v2.sql` again
3. **Wrong user logged in** → Make sure you're logged in as the assigned field tech
4. **Policy syntax issue** → The v2 script uses a more explicit structure

