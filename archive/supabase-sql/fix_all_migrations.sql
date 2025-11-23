-- Comprehensive fix script for all migrations
-- This ensures RLS, policies, and triggers are properly set up
-- Safe to run multiple times (idempotent)

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE IF EXISTS public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.measurements ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLICIES TABLE - RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all policies" ON public.policies;
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

DROP POLICY IF EXISTS "Techs can view policies for assigned jobs" ON public.policies;
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

DROP POLICY IF EXISTS "Admins can insert policies" ON public.policies;
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

DROP POLICY IF EXISTS "Admins can update policies" ON public.policies;
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

DROP POLICY IF EXISTS "Admins can delete policies" ON public.policies;
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

-- ============================================================================
-- 3. COMMUNICATIONS TABLES - RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all templates" ON public.email_templates;
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

DROP POLICY IF EXISTS "Admins can manage templates" ON public.email_templates;
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

DROP POLICY IF EXISTS "Admins can view all communications" ON public.communications;
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

DROP POLICY IF EXISTS "Techs can view communications for assigned jobs" ON public.communications;
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

DROP POLICY IF EXISTS "Users can create communications" ON public.communications;
CREATE POLICY "Users can create communications"
  ON public.communications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- ============================================================================
-- 4. ESTIMATES TABLES - RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all estimates" ON public.estimates;
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

DROP POLICY IF EXISTS "Techs can view estimates for assigned jobs" ON public.estimates;
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

DROP POLICY IF EXISTS "Admins can manage estimates" ON public.estimates;
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

DROP POLICY IF EXISTS "Users can view line items for accessible estimates" ON public.estimate_line_items;
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

DROP POLICY IF EXISTS "Admins can manage line items" ON public.estimate_line_items;
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

-- ============================================================================
-- 5. ALERTS TABLES - RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage alert rules" ON public.alert_rules;
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

DROP POLICY IF EXISTS "Admins can view all alerts" ON public.alerts;
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

DROP POLICY IF EXISTS "Techs can view alerts for assigned jobs" ON public.alerts;
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

DROP POLICY IF EXISTS "Users can update alerts" ON public.alerts;
CREATE POLICY "Users can update alerts"
  ON public.alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all metrics" ON public.monitoring_metrics;
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

-- ============================================================================
-- 6. TEMPLATES TABLE - RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage templates" ON public.job_templates;
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

DROP POLICY IF EXISTS "Users can view enabled templates" ON public.job_templates;
CREATE POLICY "Users can view enabled templates"
  ON public.job_templates FOR SELECT
  TO authenticated
  USING (enabled = TRUE);

-- ============================================================================
-- 7. MEASUREMENTS TABLE - RLS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all measurements" ON public.measurements;
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

DROP POLICY IF EXISTS "Techs can view measurements for assigned jobs" ON public.measurements;
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

DROP POLICY IF EXISTS "Users can upload measurements" ON public.measurements;
CREATE POLICY "Users can upload measurements"
  ON public.measurements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Admins can manage measurements" ON public.measurements;
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

-- ============================================================================
-- 8. TRIGGERS (updated_at functions)
-- ============================================================================

-- Policies trigger
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

-- Email templates trigger
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

-- Estimates triggers
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

-- Alerts triggers
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

-- Templates trigger
DROP TRIGGER IF EXISTS update_job_templates_updated_at ON public.job_templates;
CREATE TRIGGER update_job_templates_updated_at
  BEFORE UPDATE ON public.job_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_rules_updated_at();

-- Measurements trigger
DROP TRIGGER IF EXISTS update_measurements_updated_at ON public.measurements;
CREATE TRIGGER update_measurements_updated_at
  BEFORE UPDATE ON public.measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_rules_updated_at();

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- This script ensures all RLS policies, triggers, and functions are properly
-- set up. It's idempotent and safe to run multiple times.

