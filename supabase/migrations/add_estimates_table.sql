-- Migration: Add estimates and line items tables
-- This supports Phase 3: AI Estimate Engine

-- Create estimates table
CREATE TABLE IF NOT EXISTS public.estimates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  policy_id UUID REFERENCES public.policies(id) ON DELETE SET NULL,
  
  -- Estimate metadata
  estimate_number TEXT UNIQUE,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft', -- 'draft', 'pending_review', 'approved', 'rejected', 'final'
  
  -- Totals
  total_amount DECIMAL(12, 2) DEFAULT 0,
  insurance_amount DECIMAL(12, 2) DEFAULT 0,
  customer_pay_amount DECIMAL(12, 2) DEFAULT 0,
  non_covered_amount DECIMAL(12, 2) DEFAULT 0,
  
  -- Coverage application
  deductible_applied DECIMAL(10, 2) DEFAULT 0,
  coverage_limits_applied JSONB, -- Which limits were applied
  
  -- Export status
  exported_to_xactimate BOOLEAN DEFAULT FALSE,
  exported_to_corelogic BOOLEAN DEFAULT FALSE,
  export_metadata JSONB, -- Export timestamps, file paths, etc.
  
  -- AI generation metadata
  generated_by_ai BOOLEAN DEFAULT FALSE,
  generation_metadata JSONB, -- AI model, confidence scores, etc.
  
  -- Review and approval
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create estimate_line_items table
CREATE TABLE IF NOT EXISTS public.estimate_line_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  estimate_id UUID REFERENCES public.estimates(id) ON DELETE CASCADE NOT NULL,
  
  -- Line item details
  code TEXT NOT NULL, -- Internal Gen/core code
  xactimate_code TEXT, -- Mapped Xactimate code
  description TEXT NOT NULL,
  category TEXT, -- e.g., 'Demolition', 'Drying', 'Reconstruction'
  room TEXT, -- Which room this applies to
  
  -- Quantities and pricing
  quantity DECIMAL(10, 3) NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  
  -- Coverage bucket
  coverage_bucket TEXT NOT NULL DEFAULT 'insurance', -- 'insurance', 'customer_pay', 'non_covered'
  
  -- Coverage application
  covered_amount DECIMAL(12, 2), -- Amount covered by insurance (after limits/deductibles)
  customer_pay_amount DECIMAL(12, 2), -- Amount customer pays
  non_covered_amount DECIMAL(12, 2), -- Amount not covered
  
  -- Notes and metadata
  notes TEXT,
  metadata JSONB, -- Additional data (photos linked, measurements, etc.)
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Estimates
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Admins can view all estimates" ON public.estimates;
DROP POLICY IF EXISTS "Techs can view estimates for assigned jobs" ON public.estimates;
DROP POLICY IF EXISTS "Admins can manage estimates" ON public.estimates;
DROP POLICY IF EXISTS "Users can view line items for accessible estimates" ON public.estimate_line_items;
DROP POLICY IF EXISTS "Admins can manage line items" ON public.estimate_line_items;

-- Admins and estimators can view all estimates
CREATE POLICY "Admins can view all estimates"
  ON public.estimates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Field techs can view estimates for their assigned jobs
CREATE POLICY "Techs can view estimates for assigned jobs"
  ON public.estimates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = estimates.job_id
      AND jobs.lead_tech_id = auth.uid()
    )
  );

-- Admins and estimators can manage estimates
CREATE POLICY "Admins can manage estimates"
  ON public.estimates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- RLS Policies for Estimate Line Items
-- Same access as estimates (line items inherit estimate permissions)
CREATE POLICY "Users can view line items for accessible estimates"
  ON public.estimate_line_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.estimates
      WHERE estimates.id = estimate_line_items.estimate_id
      AND (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'owner', 'estimator')
        )
        OR EXISTS (
          SELECT 1 FROM public.jobs
          WHERE jobs.id = estimates.job_id
          AND jobs.lead_tech_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Admins can manage line items"
  ON public.estimate_line_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_estimates_job_id ON public.estimates(job_id);
CREATE INDEX IF NOT EXISTS idx_estimates_policy_id ON public.estimates(policy_id);
CREATE INDEX IF NOT EXISTS idx_estimates_status ON public.estimates(status);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_estimate_id ON public.estimate_line_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_code ON public.estimate_line_items(code);
CREATE INDEX IF NOT EXISTS idx_estimate_line_items_room ON public.estimate_line_items(room);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_estimates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_estimates_updated_at ON public.estimates;
CREATE TRIGGER update_estimates_updated_at
  BEFORE UPDATE ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION update_estimates_updated_at();

DROP TRIGGER IF EXISTS update_estimate_line_items_updated_at ON public.estimate_line_items;
CREATE TRIGGER update_estimate_line_items_updated_at
  BEFORE UPDATE ON public.estimate_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_estimates_updated_at();

-- Function to recalculate estimate totals
CREATE OR REPLACE FUNCTION recalculate_estimate_totals(estimate_uuid UUID)
RETURNS VOID AS $$
DECLARE
  totals RECORD;
BEGIN
  SELECT 
    COALESCE(SUM(total_cost), 0) as total,
    COALESCE(SUM(CASE WHEN coverage_bucket = 'insurance' THEN covered_amount ELSE 0 END), 0) as insurance,
    COALESCE(SUM(CASE WHEN coverage_bucket = 'customer_pay' THEN customer_pay_amount ELSE 0 END), 0) as customer_pay,
    COALESCE(SUM(CASE WHEN coverage_bucket = 'non_covered' THEN non_covered_amount ELSE 0 END), 0) as non_covered
  INTO totals
  FROM public.estimate_line_items
  WHERE estimate_id = estimate_uuid;
  
  UPDATE public.estimates
  SET 
    total_amount = totals.total,
    insurance_amount = totals.insurance,
    customer_pay_amount = totals.customer_pay,
    non_covered_amount = totals.non_covered,
    updated_at = NOW()
  WHERE id = estimate_uuid;
END;
$$ LANGUAGE plpgsql;

