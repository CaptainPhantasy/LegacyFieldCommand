-- Migration: Add communications tables for email and voice
-- This supports Phase 2: Communications Infrastructure

-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL, -- HTML or plain text
  template_type TEXT, -- 'quote', 'update', 'request', 'custom'
  variables JSONB, -- Template variables like {{customer_name}}, {{job_title}}
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create communications table (email and voice history)
CREATE TABLE IF NOT EXISTS public.communications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'email', 'voice', 'sms'
  direction TEXT NOT NULL, -- 'outbound', 'inbound'
  subject TEXT,
  body TEXT, -- Email body or transcribed voice text
  recipient_email TEXT,
  recipient_name TEXT,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  voice_audio_path TEXT, -- Path to audio file in storage
  voice_transcription TEXT, -- Transcribed text
  voice_interpretation JSONB, -- Structured interpretation of voice
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'pending'
  metadata JSONB, -- Additional metadata
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Email Templates
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Admins can view all templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can manage templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can view all communications" ON public.communications;
DROP POLICY IF EXISTS "Techs can view communications for assigned jobs" ON public.communications;
DROP POLICY IF EXISTS "Users can create communications" ON public.communications;

-- Admins can view all templates
CREATE POLICY "Admins can view all templates"
  ON public.email_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Admins can manage templates
CREATE POLICY "Admins can manage templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- RLS Policies for Communications
-- Admins can view all communications
CREATE POLICY "Admins can view all communications"
  ON public.communications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Field techs can view communications for their assigned jobs
CREATE POLICY "Techs can view communications for assigned jobs"
  ON public.communications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = communications.job_id
      AND jobs.lead_tech_id = auth.uid()
    )
  );

-- Authenticated users can create communications
CREATE POLICY "Users can create communications"
  ON public.communications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_communications_job_id ON public.communications(job_id);
CREATE INDEX IF NOT EXISTS idx_communications_type ON public.communications(type);
CREATE INDEX IF NOT EXISTS idx_communications_created_at ON public.communications(created_at);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON public.email_templates(template_type);

-- Add updated_at trigger for templates
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

