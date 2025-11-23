-- TEST RLS POLICIES DIRECTLY IN SUPABASE
-- Run this in Supabase SQL Editor to verify policies work

-- First, check what policies exist
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'job_photos'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'job_photos';

-- Test the policy logic manually (replace with actual values)
-- This simulates what the RLS policy checks
DO $$
DECLARE
  test_job_id uuid := 'YOUR_JOB_ID_HERE';  -- Replace with actual job ID
  test_user_id uuid := 'YOUR_USER_ID_HERE';  -- Replace with actual user ID
  job_lead_tech_id uuid;
  policy_check_passes boolean;
BEGIN
  -- Get the job's lead_tech_id
  SELECT lead_tech_id INTO job_lead_tech_id
  FROM jobs
  WHERE id = test_job_id;
  
  -- Check if policy condition would pass
  policy_check_passes := (job_lead_tech_id = test_user_id);
  
  RAISE NOTICE 'Job ID: %', test_job_id;
  RAISE NOTICE 'User ID: %', test_user_id;
  RAISE NOTICE 'Job lead_tech_id: %', job_lead_tech_id;
  RAISE NOTICE 'Policy check would pass: %', policy_check_passes;
  
  IF NOT policy_check_passes THEN
    RAISE NOTICE 'RLS policy would FAIL - job is not assigned to this user';
    IF job_lead_tech_id IS NULL THEN
      RAISE NOTICE 'Job is UNASSIGNED (lead_tech_id is NULL)';
    ELSE
      RAISE NOTICE 'Job is assigned to different user: %', job_lead_tech_id;
    END IF;
  ELSE
    RAISE NOTICE 'RLS policy would PASS - job is correctly assigned';
  END IF;
END $$;

-- Check all jobs and their assignments
SELECT 
  j.id as job_id,
  j.title,
  j.lead_tech_id,
  p.email as assigned_to_email,
  p.role as assigned_to_role,
  CASE 
    WHEN j.lead_tech_id IS NULL THEN 'UNASSIGNED'
    ELSE 'ASSIGNED'
  END as assignment_status
FROM jobs j
LEFT JOIN profiles p ON j.lead_tech_id = p.id
ORDER BY j.created_at DESC
LIMIT 10;

