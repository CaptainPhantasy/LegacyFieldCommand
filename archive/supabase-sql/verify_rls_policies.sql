-- VERIFY RLS POLICIES FOR JOB_PHOTOS
-- Run this in Supabase SQL Editor to check current policies

-- Check all policies on job_photos
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'job_photos'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'job_photos';

-- Check job_photos table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'job_photos'
ORDER BY ordinal_position;

-- Check sample jobs and their lead_tech_id assignments
SELECT 
  j.id,
  j.title,
  j.lead_tech_id,
  p.email as tech_email,
  p.role as tech_role
FROM jobs j
LEFT JOIN profiles p ON j.lead_tech_id = p.id
LIMIT 10;

