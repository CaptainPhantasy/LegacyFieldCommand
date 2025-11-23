-- ============================================================================
-- Database Schema Reference
-- ============================================================================
-- This is a REFERENCE file showing the complete database structure.
-- DO NOT RUN THIS FILE DIRECTLY - it is for documentation purposes only.
-- 
-- To modify the database, use the migration files in migrations/ directory.
-- See MIGRATION_EXECUTION_ORDER.md for migration instructions.
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS & TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('field_tech', 'lead_tech', 'estimator', 'admin', 'owner', 'program_admin');
CREATE TYPE job_status AS ENUM ('lead', 'inspection_scheduled', 'job_created', 'active_work', 'ready_to_invoice', 'paid', 'closed');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'field_tech',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACCOUNTS / ORGANIZATIONS (For multi-tenant/white-label capability)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOBS
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  status job_status DEFAULT 'lead',
  address_line_1 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  lead_tech_id UUID REFERENCES public.profiles(id),
  estimator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOB GATES (Stages)
CREATE TABLE IF NOT EXISTS public.job_gates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  stage_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES public.profiles(id),
  requires_exception BOOLEAN DEFAULT FALSE,
  exception_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOB PHOTOS / EVIDENCE
CREATE TABLE IF NOT EXISTS public.job_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  gate_id UUID REFERENCES public.job_gates(id),
  taken_by UUID REFERENCES public.profiles(id),
  storage_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_ppe BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  job_id UUID REFERENCES public.jobs(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- All tables have RLS enabled
-- See individual migration files for RLS policies

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'field_tech');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NOTE: This is a reference file only
-- 
-- For actual database setup:
-- 1. Use migration files in migrations/ directory
-- 2. Follow MIGRATION_EXECUTION_ORDER.md
-- 3. All migrations are idempotent and safe to re-run
-- ============================================================================

