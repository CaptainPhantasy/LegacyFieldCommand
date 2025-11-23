-- Consolidated Schema + RLS Fix for Dev
-- Run this entire file in Supabase SQL Editor to fix "missing table" errors and allow testing.

-- 1. TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('field_tech', 'lead_tech', 'estimator', 'admin', 'owner', 'program_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('lead', 'inspection_scheduled', 'job_created', 'active_work', 'ready_to_invoice', 'paid', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text not null,
  full_name text,
  role user_role not null default 'field_tech',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. ACCOUNTS
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- 4. JOBS
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  account_id uuid references public.accounts(id) on delete cascade, 
  status job_status default 'lead',
  address_line_1 text,
  city text,
  state text,
  zip_code text,
  lead_tech_id uuid references public.profiles(id),
  estimator_id uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 5. GATES
CREATE TABLE IF NOT EXISTS public.job_gates (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  stage_name text not null,
  status text default 'pending',
  metadata jsonb default '{}'::jsonb,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id),
  requires_exception boolean default false,
  exception_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
ALTER TABLE public.job_gates ENABLE ROW LEVEL SECURITY;

-- 6. PHOTOS
CREATE TABLE IF NOT EXISTS public.job_photos (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  gate_id uuid references public.job_gates(id),
  taken_by uuid references public.profiles(id),
  storage_path text not null,
  metadata jsonb default '{}'::jsonb,
  is_ppe boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;

-- RLS RELAXATION FOR DEV (Fixes seed script errors)

-- Jobs: Allow authenticated users to insert jobs
DROP POLICY IF EXISTS "Admins insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow authenticated insert jobs" ON public.jobs;
CREATE POLICY "Allow authenticated insert jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Jobs: Allow authenticated users to select jobs (broadened for testing)
DROP POLICY IF EXISTS "Techs view assigned jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow authenticated select jobs" ON public.jobs;
CREATE POLICY "Allow authenticated select jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (true);

-- Jobs: Allow authenticated users to update jobs
DROP POLICY IF EXISTS "Allow authenticated update jobs" ON public.jobs;
CREATE POLICY "Allow authenticated update jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (true);

-- Gates: Allow authenticated users to insert gates
DROP POLICY IF EXISTS "Admins insert gates" ON public.job_gates;
DROP POLICY IF EXISTS "Allow authenticated insert gates" ON public.job_gates;
CREATE POLICY "Allow authenticated insert gates"
  ON public.job_gates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Gates: Allow authenticated users to update gates
DROP POLICY IF EXISTS "Techs update assigned gates" ON public.job_gates;
DROP POLICY IF EXISTS "Allow authenticated update gates" ON public.job_gates;
CREATE POLICY "Allow authenticated update gates"
  ON public.job_gates FOR UPDATE
  TO authenticated
  USING (true);

-- Gates: Allow authenticated users to select gates
DROP POLICY IF EXISTS "Techs view assigned gates" ON public.job_gates;
DROP POLICY IF EXISTS "Admins view all gates" ON public.job_gates;
DROP POLICY IF EXISTS "Allow authenticated select gates" ON public.job_gates;
CREATE POLICY "Allow authenticated select gates"
  ON public.job_gates FOR SELECT
  TO authenticated
  USING (true);

-- DEV ONLY: Allow anonymous inserts for seed scripts (REMOVE IN PRODUCTION)
DROP POLICY IF EXISTS "Dev anonymous insert jobs" ON public.jobs;
CREATE POLICY "Dev anonymous insert jobs"
  ON public.jobs FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Dev anonymous insert gates" ON public.job_gates;
CREATE POLICY "Dev anonymous insert gates"
  ON public.job_gates FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Dev anonymous select jobs" ON public.jobs;
CREATE POLICY "Dev anonymous select jobs"
  ON public.jobs FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Dev anonymous select gates" ON public.job_gates;
CREATE POLICY "Dev anonymous select gates"
  ON public.job_gates FOR SELECT
  TO anon
  USING (true);


