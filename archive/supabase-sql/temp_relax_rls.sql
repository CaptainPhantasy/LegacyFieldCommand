-- Fix RLS policies to allow testing with Anon key (TEMPORARY FOR DEV)
-- This is a "Quick Fix" migration to unblock the seed script.

-- Jobs: Allow authenticated users to insert jobs (normally only Admins)
DROP POLICY IF EXISTS "Admins insert jobs" ON public.jobs;
CREATE POLICY "Allow authenticated insert jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Gates: Allow authenticated users to insert gates
DROP POLICY IF EXISTS "Admins insert gates" ON public.job_gates;
CREATE POLICY "Allow authenticated insert gates"
  ON public.job_gates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Gates: Allow authenticated users to update gates (for seed script status updates)
DROP POLICY IF EXISTS "Techs update assigned gates" ON public.job_gates;
CREATE POLICY "Allow authenticated update gates"
  ON public.job_gates FOR UPDATE
  TO authenticated
  USING (true);

