-- Migration: Add alerts and monitoring tables
-- This supports Phase 3: Alerts & Monitoring

-- Create alert_rules table
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'stale_job', 'missing_artifact', 'compliance', 'custom'
  conditions JSONB NOT NULL, -- Rule conditions (e.g., {"days_without_update": 7})
  severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  enabled BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rule_id UUID REFERENCES public.alert_rules(id) ON DELETE SET NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  gate_id UUID REFERENCES public.job_gates(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type TEXT NOT NULL, -- 'stale_job', 'missing_artifact', 'compliance', etc.
  severity TEXT DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB, -- Additional context
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'dismissed'
  acknowledged_by UUID REFERENCES public.profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create monitoring_metrics table (for dashboard/analytics)
CREATE TABLE IF NOT EXISTS public.monitoring_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'job_completion_rate', 'gate_compliance', 'response_time', etc.
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(12, 2),
  metric_data JSONB, -- Additional metric data
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Alert Rules
-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Admins can manage alert rules" ON public.alert_rules;
DROP POLICY IF EXISTS "Admins can view all alerts" ON public.alerts;
DROP POLICY IF EXISTS "Techs can view alerts for assigned jobs" ON public.alerts;
DROP POLICY IF EXISTS "Users can update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins can view all metrics" ON public.monitoring_metrics;

-- Admins can manage alert rules
CREATE POLICY "Admins can manage alert rules"
  ON public.alert_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- RLS Policies for Alerts
-- Admins can view all alerts
CREATE POLICY "Admins can view all alerts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Field techs can view alerts for their assigned jobs
CREATE POLICY "Techs can view alerts for assigned jobs"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (
    job_id IS NULL OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = alerts.job_id
      AND jobs.lead_tech_id = auth.uid()
    )
  );

-- Authenticated users can acknowledge/resolve their own alerts
CREATE POLICY "Users can update alerts"
  ON public.alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for Monitoring Metrics
-- Admins can view all metrics
CREATE POLICY "Admins can view all metrics"
  ON public.monitoring_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON public.alert_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON public.alert_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_job_id ON public.alerts(job_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_type ON public.monitoring_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_calculated_at ON public.monitoring_metrics(calculated_at);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_alert_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_alert_rules_updated_at ON public.alert_rules;
CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_rules_updated_at();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON public.alerts;
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_rules_updated_at();

