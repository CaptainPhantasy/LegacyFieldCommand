-- COMPLETE RLS FIX FOR JOB_PHOTOS
-- Run this in Supabase SQL Editor to fix all RLS issues

-- First, drop ALL existing policies on job_photos to start fresh
DROP POLICY IF EXISTS "Techs insert photos for assigned jobs" ON job_photos;
DROP POLICY IF EXISTS "Techs view photos for assigned jobs" ON job_photos;
DROP POLICY IF EXISTS "Admins view all photos" ON job_photos;
DROP POLICY IF EXISTS "Admins insert photos" ON job_photos;

-- Techs can INSERT photos for their assigned jobs
CREATE POLICY "Techs insert photos for assigned jobs"
  ON job_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_photos.job_id
      AND jobs.lead_tech_id = auth.uid()
    )
  );

-- Techs can SELECT photos for their assigned jobs
CREATE POLICY "Techs view photos for assigned jobs"
  ON job_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_photos.job_id
      AND jobs.lead_tech_id = auth.uid()
    )
  );

-- Admins can INSERT photos for any job (for flexibility)
CREATE POLICY "Admins insert photos"
  ON job_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Admins can SELECT all photos
CREATE POLICY "Admins view all photos"
  ON job_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
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
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'job_photos'
ORDER BY policyname;

