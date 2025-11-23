-- FINAL FIX: Ensure anonymous policies exist and work
-- This will force-create the policies needed for seed script

-- Drop ALL existing policies on jobs first
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'jobs' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.jobs';
    END LOOP;
END $$;

-- Drop ALL existing policies on job_gates
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'job_gates' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.job_gates';
    END LOOP;
END $$;

-- Drop ALL existing policies on profiles  
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Now create simple anonymous policies for DEV
CREATE POLICY "anon_all_jobs" ON public.jobs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_gates" ON public.job_gates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_select_profiles" ON public.profiles FOR SELECT TO anon USING (true);

-- Also allow authenticated users
CREATE POLICY "auth_all_jobs" ON public.jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_gates" ON public.job_gates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

