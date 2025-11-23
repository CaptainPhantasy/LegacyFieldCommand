-- Migration: Add measurements/3D data table
-- This supports Phase 4: 3D/Measurement APIs

-- Create measurements table
CREATE TABLE IF NOT EXISTS public.measurements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  room TEXT, -- Which room this measurement applies to
  
  -- File storage
  file_storage_path TEXT NOT NULL, -- Path to file in storage
  file_type TEXT NOT NULL, -- '3d_scan', 'lidar', 'floorplan', 'measurement_file'
  file_format TEXT, -- 'obj', 'ply', 'pdf', 'dwg', etc.
  file_size BIGINT, -- File size in bytes
  
  -- Measurement data
  measurement_data JSONB, -- Structured measurement data
  metadata JSONB, -- Additional metadata
  
  -- Linking
  linked_to_line_items UUID[], -- Array of estimate_line_items IDs
  linked_to_gates UUID[], -- Array of job_gates IDs
  
  -- Audit
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Measurements
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Admins can view all measurements" ON public.measurements;
DROP POLICY IF EXISTS "Techs can view measurements for assigned jobs" ON public.measurements;
DROP POLICY IF EXISTS "Users can upload measurements" ON public.measurements;
DROP POLICY IF EXISTS "Admins can manage measurements" ON public.measurements;

-- Admins can view all measurements
CREATE POLICY "Admins can view all measurements"
  ON public.measurements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Field techs can view measurements for their assigned jobs
CREATE POLICY "Techs can view measurements for assigned jobs"
  ON public.measurements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = measurements.job_id
      AND jobs.lead_tech_id = auth.uid()
    )
  );

-- Authenticated users can upload measurements
CREATE POLICY "Users can upload measurements"
  ON public.measurements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- Admins can manage measurements
CREATE POLICY "Admins can manage measurements"
  ON public.measurements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_measurements_job_id ON public.measurements(job_id);
CREATE INDEX IF NOT EXISTS idx_measurements_room ON public.measurements(room);
CREATE INDEX IF NOT EXISTS idx_measurements_file_type ON public.measurements(file_type);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_measurements_updated_at ON public.measurements;
CREATE TRIGGER update_measurements_updated_at
  BEFORE UPDATE ON public.measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_rules_updated_at();

