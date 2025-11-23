-- Quick fix: Add anonymous policies for seed script
-- Run this if seed script still fails after setup_db_complete.sql

-- Jobs: Allow anonymous inserts (DEV ONLY)
DROP POLICY IF EXISTS "Dev anonymous insert jobs" ON public.jobs;
CREATE POLICY "Dev anonymous insert jobs"
  ON public.jobs FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Dev anonymous select jobs" ON public.jobs;
CREATE POLICY "Dev anonymous select jobs"
  ON public.jobs FOR SELECT
  TO anon
  USING (true);

-- Gates: Allow anonymous inserts (DEV ONLY)
DROP POLICY IF EXISTS "Dev anonymous insert gates" ON public.job_gates;
CREATE POLICY "Dev anonymous insert gates"
  ON public.job_gates FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Dev anonymous select gates" ON public.job_gates;
CREATE POLICY "Dev anonymous select gates"
  ON public.job_gates FOR SELECT
  TO anon
  USING (true);

-- Profiles: Allow anonymous select (needed to find tech user)
DROP POLICY IF EXISTS "Dev anonymous select profiles" ON public.profiles;
CREATE POLICY "Dev anonymous select profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

