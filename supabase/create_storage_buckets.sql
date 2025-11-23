-- Create storage buckets for file uploads
-- Run this in Supabase SQL Editor

-- Note: Storage buckets are created via Supabase Dashboard, not SQL
-- This file documents the required buckets and their configurations

-- Required Buckets:
-- 1. policies - Policy PDF storage
--    - Public: No (authenticated only)
--    - File size limit: 10MB
--    - Allowed MIME types: application/pdf

-- 2. voice-recordings - Voice audio files
--    - Public: No (authenticated only)
--    - File size limit: 25MB
--    - Allowed MIME types: audio/*

-- 3. measurements - 3D/measurement files
--    - Public: No (authenticated only)
--    - File size limit: 100MB
--    - Allowed MIME types: */* (various 3D formats)

-- To create buckets:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Configure each bucket with the settings above
-- 4. Set up RLS policies for each bucket (see fix_storage_rls.sql)

-- Storage RLS policies are handled in: supabase/fix_storage_rls.sql

