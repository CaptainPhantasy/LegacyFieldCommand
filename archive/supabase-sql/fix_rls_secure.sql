-- SECURE RLS FIX - Ensures anon users are completely blocked
-- This adds explicit auth.uid() checks and ensures no anon access

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES (if not already)
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
-- 2. DROP ALL EXISTING POLICIES (clean slate)
-- ============================================================================
-- Policies table
DROP POLICY IF EXISTS "Admins can view all policies" ON public.policies;
DROP POLICY IF EXISTS "Techs can view policies for assigned jobs" ON public.policies;
DROP POLICY IF EXISTS "Admins can insert policies" ON public.policies;
DROP POLICY IF EXISTS "Admins can update policies" ON public.policies;
DROP POLICY IF EXISTS "Admins can delete policies" ON public.policies;

-- Email templates
DROP POLICY IF EXISTS "Admins can view all templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can manage templates" ON public.email_templates;

-- Communications
DROP POLICY IF EXISTS "Admins can view all communications" ON public.communications;
DROP POLICY IF EXISTS "Techs can view communications for assigned jobs" ON public.communications;
DROP POLICY IF EXISTS "Users can create communications" ON public.communications;

-- Estimates
DROP POLICY IF EXISTS "Admins can view all estimates" ON public.estimates;
DROP POLICY IF EXISTS "Techs can view estimates for assigned jobs" ON public.estimates;
DROP POLICY IF EXISTS "Admins can manage estimates" ON public.estimates;

-- Estimate line items
DROP POLICY IF EXISTS "Users can view line items for accessible estimates" ON public.estimate_line_items;
DROP POLICY IF EXISTS "Admins can manage line items" ON public.estimate_line_items;

-- Alert rules
DROP POLICY IF EXISTS "Admins can manage alert rules" ON public.alert_rules;

-- Alerts
DROP POLICY IF EXISTS "Admins can view all alerts" ON public.alerts;
DROP POLICY IF EXISTS "Techs can view alerts for assigned jobs" ON public.alerts;
DROP POLICY IF EXISTS "Users can update alerts" ON public.alerts;

-- Monitoring metrics
DROP POLICY IF EXISTS "Admins can view all metrics" ON public.monitoring_metrics;

-- Job templates
DROP POLICY IF EXISTS "Admins can manage templates" ON public.job_templates;
DROP POLICY IF EXISTS "Users can view enabled templates" ON public.job_templates;

-- Measurements
DROP POLICY IF EXISTS "Admins can view all measurements" ON public.measurements;
DROP POLICY IF EXISTS "Techs can view measurements for assigned jobs" ON public.measurements;
DROP POLICY IF EXISTS "Users can upload measurements" ON public.measurements;
DROP POLICY IF EXISTS "Admins can manage measurements" ON public.measurements;

-- ============================================================================
-- 3. CREATE SECURE POLICIES WITH EXPLICIT AUTH CHECKS
-- ============================================================================

-- POLICIES TABLE
CREATE POLICY "Admins can view all policies"
  ON public.policies FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

CREATE POLICY "Techs can view policies for assigned jobs"
  ON public.policies FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = policies.job_id
      AND jobs.lead_tech_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert policies"
  ON public.policies FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

CREATE POLICY "Admins can update policies"
  ON public.policies FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

CREATE POLICY "Admins can delete policies"
  ON public.policies FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- EMAIL TEMPLATES
CREATE POLICY "Admins can view all templates"
  ON public.email_templates FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

CREATE POLICY "Admins can manage templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- COMMUNICATIONS
CREATE POLICY "Admins can view all communications"
  ON public.communications FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

CREATE POLICY "Techs can view communications for assigned jobs"
  ON public.communications FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = communications.job_id
      AND jobs.lead_tech_id = auth.uid()
    )
  );

CREATE POLICY "Users can create communications"
  ON public.communications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = created_by
  );

-- ESTIMATES
CREATE POLICY "Admins can view all estimates"
  ON public.estimates FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

CREATE POLICY "Techs can view estimates for assigned jobs"
  ON public.estimates FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = estimates.job_id
      AND jobs.lead_tech_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage estimates"
  ON public.estimates FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- ESTIMATE LINE ITEMS
CREATE POLICY "Users can view line items for accessible estimates"
  ON public.estimate_line_items FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
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
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- ALERT RULES
CREATE POLICY "Admins can manage alert rules"
  ON public.alert_rules FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- ALERTS
CREATE POLICY "Admins can view all alerts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

CREATE POLICY "Techs can view alerts for assigned jobs"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (
      job_id IS NULL OR EXISTS (
        SELECT 1 FROM public.jobs
        WHERE jobs.id = alerts.job_id
        AND jobs.lead_tech_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update alerts"
  ON public.alerts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- MONITORING METRICS
CREATE POLICY "Admins can view all metrics"
  ON public.monitoring_metrics FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- JOB TEMPLATES
CREATE POLICY "Admins can manage templates"
  ON public.job_templates FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'program_admin')
    )
  );

CREATE POLICY "Users can view enabled templates"
  ON public.job_templates FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND enabled = TRUE
  );

-- MEASUREMENTS
CREATE POLICY "Admins can view all measurements"
  ON public.measurements FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

CREATE POLICY "Techs can view measurements for assigned jobs"
  ON public.measurements FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = measurements.job_id
      AND jobs.lead_tech_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload measurements"
  ON public.measurements FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = uploaded_by
  );

CREATE POLICY "Admins can manage measurements"
  ON public.measurements FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- ============================================================================
-- COMPLETE - All policies now explicitly check auth.uid() IS NOT NULL
-- ============================================================================

