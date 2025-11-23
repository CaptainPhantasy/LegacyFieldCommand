-- Migration: Add job templates table
-- This supports Phase 4: Program Templates

-- Create job_templates table
CREATE TABLE IF NOT EXISTS public.job_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL, -- 'program', 'non_program', 'carrier_specific', 'custom'
  carrier_name TEXT, -- For carrier-specific templates
  program_name TEXT, -- For program-specific templates
  
  -- Template structure (based on estimate structure)
  default_line_items JSONB, -- Default line items for this template
  required_gates TEXT[], -- Which gates are required
  required_fields JSONB, -- Required fields per gate
  default_metadata JSONB, -- Default job metadata
  
  -- Template configuration
  enabled BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.job_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Templates
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Admins can manage templates" ON public.job_templates;
DROP POLICY IF EXISTS "Users can view enabled templates" ON public.job_templates;

-- Admins can manage templates
CREATE POLICY "Admins can manage templates"
  ON public.job_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'program_admin')
    )
  );

-- All authenticated users can view enabled templates
CREATE POLICY "Users can view enabled templates"
  ON public.job_templates FOR SELECT
  TO authenticated
  USING (enabled = TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_templates_type ON public.job_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_job_templates_carrier ON public.job_templates(carrier_name);
CREATE INDEX IF NOT EXISTS idx_job_templates_enabled ON public.job_templates(enabled);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_job_templates_updated_at ON public.job_templates;
CREATE TRIGGER update_job_templates_updated_at
  BEFORE UPDATE ON public.job_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_rules_updated_at();

