-- FIX STORAGE BUCKET RLS POLICIES FOR ALL BUCKETS
-- Run this in Supabase SQL Editor after creating all buckets
-- This ensures all storage buckets are properly secured

-- ============================================================================
-- JOB-PHOTOS BUCKET (should be PRIVATE)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Techs can upload photos to assigned jobs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Techs can view photos from assigned jobs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all photos" ON storage.objects;

-- Techs can INSERT (upload) files to job-photos bucket for their assigned jobs
-- Path format: jobs/{job_id}/photos/{filename}
CREATE POLICY "Techs can upload photos to assigned jobs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jobs
    WHERE jobs.id::text = (string_to_array(name, '/'))[2]
      AND jobs.lead_tech_id = auth.uid()
      AND jobs.lead_tech_id IS NOT NULL
  )
);

-- Admins can INSERT (upload) files to job-photos bucket
CREATE POLICY "Admins can upload photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-photos'
  AND auth.uid() IS NOT NULL
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
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jobs
    WHERE jobs.id::text = (string_to_array(name, '/'))[2]
      AND jobs.lead_tech_id = auth.uid()
  )
);

-- Admins can SELECT (download) all files from job-photos bucket
CREATE POLICY "Admins can view all photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-photos'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
  )
);

-- ============================================================================
-- POLICIES BUCKET (should be PRIVATE)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can upload policies" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view policies" ON storage.objects;
DROP POLICY IF EXISTS "Techs can view policies for assigned jobs" ON storage.objects;

-- Admins can upload policy PDFs
CREATE POLICY "Admins can upload policies"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'policies'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
  )
);

-- Admins can view all policy PDFs
CREATE POLICY "Admins can view policies"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'policies'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
  )
);

-- Techs can view policies for their assigned jobs
-- Path format: policies/{filename} - need to check via policies table
CREATE POLICY "Techs can view policies for assigned jobs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'policies'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM policies
    WHERE policies.pdf_storage_path = (storage.objects.bucket_id || '/' || storage.objects.name)
      AND (
        policies.job_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM jobs
          WHERE jobs.id = policies.job_id
            AND jobs.lead_tech_id = auth.uid()
        )
      )
  )
);

-- ============================================================================
-- VOICE-RECORDINGS BUCKET (should be PRIVATE)
-- ============================================================================

DROP POLICY IF EXISTS "Users can upload voice recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their voice recordings" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all voice recordings" ON storage.objects;

-- Authenticated users can upload voice recordings
CREATE POLICY "Users can upload voice recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-recordings'
  AND auth.uid() IS NOT NULL
);

-- Users can view their own voice recordings
CREATE POLICY "Users can view their voice recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-recordings'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM communications
    WHERE communications.voice_audio_path = (storage.objects.bucket_id || '/' || storage.objects.name)
      AND communications.created_by = auth.uid()
  )
);

-- Admins can view all voice recordings
CREATE POLICY "Admins can view all voice recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-recordings'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
  )
);

-- ============================================================================
-- MEASUREMENTS BUCKET (should be PRIVATE)
-- ============================================================================

DROP POLICY IF EXISTS "Users can upload measurements" ON storage.objects;
DROP POLICY IF EXISTS "Techs can view measurements for assigned jobs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all measurements" ON storage.objects;

-- Users can upload measurements for jobs they have access to
CREATE POLICY "Users can upload measurements"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'measurements'
  AND auth.uid() IS NOT NULL
  AND (
    -- Extract job_id from path: measurements/{job_id}/{filename}
    EXISTS (
      SELECT 1
      FROM jobs
      WHERE jobs.id::text = (string_to_array(name, '/'))[2]
        AND (
          jobs.lead_tech_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'owner', 'estimator')
          )
        )
    )
  )
);

-- Techs can view measurements for their assigned jobs
CREATE POLICY "Techs can view measurements for assigned jobs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'measurements'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM jobs
    WHERE jobs.id::text = (string_to_array(name, '/'))[2]
      AND jobs.lead_tech_id = auth.uid()
  )
);

-- Admins can view all measurements
CREATE POLICY "Admins can view all measurements"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'measurements'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
  )
);

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================

-- List all storage policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- Verify policies by bucket (check policy definitions)
-- Job-photos policies
SELECT 'job-photos' as bucket, policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (qual LIKE '%job-photos%' OR with_check LIKE '%job-photos%')
ORDER BY policyname;

-- Policies bucket
SELECT 'policies' as bucket, policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (qual LIKE '%policies%' OR with_check LIKE '%policies%')
ORDER BY policyname;

-- Voice-recordings bucket
SELECT 'voice-recordings' as bucket, policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (qual LIKE '%voice-recordings%' OR with_check LIKE '%voice-recordings%')
ORDER BY policyname;

-- Measurements bucket
SELECT 'measurements' as bucket, policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (qual LIKE '%measurements%' OR with_check LIKE '%measurements%')
ORDER BY policyname;

