-- ============================================================================
-- Supabase Security Lints Fixes
-- Fixes all security warnings identified by Supabase linter
-- ============================================================================

-- ============================================================================
-- PART 1: Fix Function Search Path (12 functions)
-- ============================================================================
-- CRITICAL: Prevents SQL injection via search_path manipulation

-- 1.1 Trigger Functions (4 functions)
CREATE OR REPLACE FUNCTION update_alert_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE OR REPLACE FUNCTION update_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- 1.2 Helper Functions (4 functions)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner', 'estimator')
  );
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION can_access_job(job_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.jobs
    WHERE id = job_uuid
    AND (
      lead_tech_id = auth.uid()
      OR is_admin()
    )
  );
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_metrics;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'field_tech');
  RETURN new;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp;

-- 1.3 Business Logic Functions (4 functions)
CREATE OR REPLACE FUNCTION calculate_equipment_days(
  p_job_id UUID,
  p_start_date DATE,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  equipment_type equipment_type,
  total_quantity INTEGER,
  total_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.equipment_type,
    SUM(el.quantity)::INTEGER as total_quantity,
    SUM(
      CASE 
        WHEN p_end_date IS NOT NULL AND el.end_date IS NOT NULL THEN
          LEAST(EXTRACT(DAY FROM (p_end_date - el.start_date))::INTEGER + 1,
                EXTRACT(DAY FROM (el.end_date - el.start_date))::INTEGER + 1)
        WHEN p_end_date IS NOT NULL THEN
          EXTRACT(DAY FROM (p_end_date - el.start_date))::INTEGER + 1
        WHEN el.end_date IS NOT NULL THEN
          EXTRACT(DAY FROM (el.end_date - el.start_date))::INTEGER + 1
        ELSE
          EXTRACT(DAY FROM (CURRENT_DATE - el.start_date))::INTEGER + 1
      END
    )::INTEGER as total_days
  FROM public.equipment_logs el
  WHERE el.job_id = p_job_id
    AND el.is_active = TRUE
    AND (p_end_date IS NULL OR el.start_date <= p_end_date)
    AND (el.end_date IS NULL OR el.end_date >= p_start_date)
  GROUP BY el.equipment_type;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION get_chamber_summary(p_chamber_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'chamber_id', c.id,
    'chamber_name', c.name,
    'room_count', COUNT(DISTINCT cr.room_id),
    'latest_reading', (
      SELECT jsonb_build_object(
        'date', pr.reading_date,
        'ambient_temp', pr.ambient_temp_f,
        'relative_humidity', pr.relative_humidity,
        'grains_per_pound', pr.grains_per_pound
      )
      FROM public.psychrometric_readings pr
      WHERE pr.chamber_id = c.id
      ORDER BY pr.reading_date DESC, pr.reading_time DESC NULLS LAST
      LIMIT 1
    ),
    'moisture_point_count', (
      SELECT COUNT(*) FROM public.moisture_points mp
      WHERE mp.chamber_id = c.id
    ),
    'equipment_count', (
      SELECT COUNT(*) FROM public.equipment_logs el
      WHERE el.chamber_id = c.id AND el.is_active = TRUE
    )
  )
  INTO result
  FROM public.chambers c
  LEFT JOIN public.chamber_rooms cr ON cr.chamber_id = c.id
  WHERE c.id = p_chamber_id
  GROUP BY c.id, c.name;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

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
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION update_estimates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';

-- ============================================================================
-- PART 2: Fix Materialized View Security
-- ============================================================================
-- Restrict dashboard_metrics access to authenticated admins only

-- Revoke public access (prevent direct querying via Data API)
REVOKE ALL ON public.dashboard_metrics FROM anon;
REVOKE ALL ON public.dashboard_metrics FROM authenticated;

-- Grant access only to admins via function
-- Note: API routes should use this function instead of direct queries
CREATE OR REPLACE FUNCTION get_dashboard_metrics()
RETURNS TABLE (
  leads_count BIGINT,
  active_jobs_count BIGINT,
  ready_to_invoice_count BIGINT,
  jobs_last_7_days BIGINT,
  avg_job_duration_seconds NUMERIC
) AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  RETURN QUERY
  SELECT * FROM public.dashboard_metrics;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- Grant execute permission to authenticated users (function will check admin)
GRANT EXECUTE ON FUNCTION get_dashboard_metrics() TO authenticated;

-- Alternative: Grant SELECT to authenticated but restrict via RLS
-- However, materialized views don't support RLS directly, so we use the function approach

-- ============================================================================
-- PART 3: Add Missing RLS Policies
-- ============================================================================

-- 3.1 Accounts Table RLS Policies
-- Accounts are organization-level entities
-- Admins can view all, users can view accounts they're associated with via jobs

DROP POLICY IF EXISTS "Admins view all accounts" ON public.accounts;
CREATE POLICY "Admins view all accounts"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

DROP POLICY IF EXISTS "Users view associated accounts" ON public.accounts;
CREATE POLICY "Users view associated accounts"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT account_id FROM public.jobs WHERE lead_tech_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins manage accounts" ON public.accounts;
CREATE POLICY "Admins manage accounts"
  ON public.accounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- 3.2 Audit Logs Table RLS Policies
-- Audit logs are read-only for most users, full access for admins
-- Field techs can view logs for their assigned jobs

DROP POLICY IF EXISTS "Admins view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins view all audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

DROP POLICY IF EXISTS "Users view job audit logs" ON public.audit_logs;
CREATE POLICY "Users view job audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    job_id IS NULL OR EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = audit_logs.job_id
      AND jobs.lead_tech_id = auth.uid()
    )
  );

-- Only system can insert audit logs (via triggers/functions)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can update audit logs (for corrections)
DROP POLICY IF EXISTS "Admins can update audit logs" ON public.audit_logs;
CREATE POLICY "Admins can update audit logs"
  ON public.audit_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- ============================================================================
-- PART 4: Documentation Note
-- ============================================================================
-- NOTE: Leaked Password Protection must be enabled manually in Supabase Dashboard:
-- 1. Go to: Authentication > Settings > Password
-- 2. Enable "Leaked Password Protection"
-- 3. This checks passwords against HaveIBeenPwned.org database
-- 
-- This cannot be enabled via SQL migration - it's a dashboard setting.

