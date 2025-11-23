-- COMPLETE RLS FIX FOR JOB_PHOTOS - VERSION 2
-- This version uses a more explicit policy structure
-- Run this in Supabase SQL Editor

-- First, drop ALL existing policies on job_photos to start fresh
DROP POLICY IF EXISTS "Techs insert photos for assigned jobs" ON job_photos;
DROP POLICY IF EXISTS "Techs view photos for assigned jobs" ON job_photos;
DROP POLICY IF EXISTS "Admins view all photos" ON job_photos;
DROP POLICY IF EXISTS "Admins insert photos" ON job_photos;
DROP POLICY IF EXISTS "Techs can insert photos" ON job_photos;
DROP POLICY IF EXISTS "Techs can view photos" ON job_photos;

-- IMPORTANT: For INSERT policies, WITH CHECK uses the NEW row values
-- So job_photos.job_id refers to the job_id being inserted

-- Techs can INSERT photos for their assigned jobs
-- This policy checks: does the job exist AND is it assigned to this user?
CREATE POLICY "Techs insert photos for assigned jobs"
  ON job_photos 
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM jobs
      WHERE jobs.id = job_photos.job_id
        AND jobs.lead_tech_id = auth.uid()
        AND jobs.lead_tech_id IS NOT NULL
    )
  );

-- Techs can SELECT photos for their assigned jobs
CREATE POLICY "Techs view photos for assigned jobs"
  ON job_photos 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM jobs
      WHERE jobs.id = job_photos.job_id
        AND jobs.lead_tech_id = auth.uid()
    )
  );

-- Admins can INSERT photos for any job
CREATE POLICY "Admins insert photos"
  ON job_photos 
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM profiles
      WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Admins can SELECT all photos
CREATE POLICY "Admins view all photos"
  ON job_photos 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles
      WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'job_photos'
ORDER BY policyname;

-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'job_photos';

