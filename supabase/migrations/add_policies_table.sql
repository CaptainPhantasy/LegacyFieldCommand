-- Migration: Add policies table for insurance policy management
-- This supports Phase 2: Policy Ingestion

-- Create policies table
CREATE TABLE IF NOT EXISTS public.policies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  policy_number TEXT,
  carrier_name TEXT,
  policy_type TEXT, -- e.g., 'Homeowners', 'Commercial', 'Renters'
  effective_date DATE,
  expiration_date DATE,
  deductible DECIMAL(10, 2),
  coverage_limits JSONB, -- Structured coverage data
  coverage_summary TEXT, -- Plain language summary
  pdf_storage_path TEXT, -- Path to uploaded PDF in storage
  parsed_data JSONB, -- Raw OCR/extracted data
  status TEXT DEFAULT 'pending', -- 'pending', 'parsed', 'verified', 'error'
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Policies
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Admins can view all policies" ON public.policies;
DROP POLICY IF EXISTS "Techs can view policies for assigned jobs" ON public.policies;
DROP POLICY IF EXISTS "Admins can insert policies" ON public.policies;
DROP POLICY IF EXISTS "Admins can update policies" ON public.policies;
DROP POLICY IF EXISTS "Admins can delete policies" ON public.policies;

-- Admins and owners can view all policies
CREATE POLICY "Admins can view all policies"
  ON public.policies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Field techs can view policies for their assigned jobs
CREATE POLICY "Techs can view policies for assigned jobs"
  ON public.policies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = policies.job_id
      AND jobs.lead_tech_id = auth.uid()
    )
  );

-- Admins can insert policies
CREATE POLICY "Admins can insert policies"
  ON public.policies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Admins can update policies
CREATE POLICY "Admins can update policies"
  ON public.policies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Admins can delete policies
CREATE POLICY "Admins can delete policies"
  ON public.policies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Create index for job_id lookups
CREATE INDEX IF NOT EXISTS idx_policies_job_id ON public.policies(job_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON public.policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_carrier ON public.policies(carrier_name);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_policies_updated_at ON public.policies;
CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION update_policies_updated_at();

