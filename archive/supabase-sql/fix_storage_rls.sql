-- FIX STORAGE BUCKET RLS POLICIES
-- Run this in Supabase SQL Editor
-- This fixes the "new row violates row-level security policy" error for storage uploads

-- Storage policies are on the storage.objects table, not a regular table
-- We need to create policies for the 'job-photos' bucket

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Techs can upload photos to assigned jobs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Techs can view photos from assigned jobs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all photos" ON storage.objects;

-- Techs can INSERT (upload) files to job-photos bucket for their assigned jobs
-- The path format is: jobs/{job_id}/photos/{filename}
-- We need to extract the job_id from the path and check if it's assigned to the user
CREATE POLICY "Techs can upload photos to assigned jobs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND (
    -- Extract job_id from path: jobs/{job_id}/photos/{filename}
    -- Path format: jobs/d5d28607-d55e-434c-8d93-15f53dfc21c9/photos/arrival_xxx.jpg
    -- Split by '/' and get the 2nd element (index 2, 1-indexed in PostgreSQL arrays)
    EXISTS (
      SELECT 1
      FROM jobs
      WHERE jobs.id::text = (string_to_array(name, '/'))[2]
        AND jobs.lead_tech_id = auth.uid()
        AND jobs.lead_tech_id IS NOT NULL
    )
  )
);

-- Admins can INSERT (upload) files to job-photos bucket
CREATE POLICY "Admins can upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
  )
);

-- Techs can SELECT (download) files from job-photos bucket for their assigned jobs
CREATE POLICY "Techs can view photos from assigned jobs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-photos'
  AND (
    EXISTS (
      SELECT 1
      FROM jobs
      WHERE jobs.id::text = (string_to_array(name, '/'))[2]
        AND jobs.lead_tech_id = auth.uid()
    )
  )
);

-- Admins can SELECT (download) all files from job-photos bucket
CREATE POLICY "Admins can view all photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-photos'
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
  )
);

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%photo%'
ORDER BY policyname;

