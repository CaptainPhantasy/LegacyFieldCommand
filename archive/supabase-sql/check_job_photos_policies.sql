-- Verify all job_photos RLS policies exist
-- Run this to check which policies are missing

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

