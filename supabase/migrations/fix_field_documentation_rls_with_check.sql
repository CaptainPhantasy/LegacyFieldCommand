-- Migration: Fix RLS policies for field documentation tables
-- Add WITH CHECK clauses for INSERT operations
-- The existing policies use FOR ALL with only USING, which doesn't properly handle INSERTs

-- ============================================================================
-- MOISTURE POINTS - Fix INSERT policy
-- ============================================================================
DROP POLICY IF EXISTS "Users access moisture points" ON public.moisture_points;

-- SELECT, UPDATE, DELETE policy
CREATE POLICY "Users access moisture points"
  ON public.moisture_points FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = moisture_points.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

-- INSERT policy with WITH CHECK
CREATE POLICY "Users can insert moisture points"
  ON public.moisture_points FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = moisture_points.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

-- UPDATE policy
CREATE POLICY "Users can update moisture points"
  ON public.moisture_points FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = moisture_points.chamber_id
      AND can_access_job(chambers.job_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = moisture_points.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

-- DELETE policy
CREATE POLICY "Users can delete moisture points"
  ON public.moisture_points FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = moisture_points.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

-- ============================================================================
-- EQUIPMENT LOGS - Fix INSERT policy
-- ============================================================================
DROP POLICY IF EXISTS "Users access equipment logs" ON public.equipment_logs;

-- SELECT policy
CREATE POLICY "Users access equipment logs"
  ON public.equipment_logs FOR SELECT
  TO authenticated
  USING (can_access_job(job_id));

-- INSERT policy with WITH CHECK
CREATE POLICY "Users can insert equipment logs"
  ON public.equipment_logs FOR INSERT
  TO authenticated
  WITH CHECK (can_access_job(job_id));

-- UPDATE policy
CREATE POLICY "Users can update equipment logs"
  ON public.equipment_logs FOR UPDATE
  TO authenticated
  USING (can_access_job(job_id))
  WITH CHECK (can_access_job(job_id));

-- DELETE policy
CREATE POLICY "Users can delete equipment logs"
  ON public.equipment_logs FOR DELETE
  TO authenticated
  USING (can_access_job(job_id));

-- ============================================================================
-- MOISTURE MAPS - Fix INSERT policy (if needed)
-- ============================================================================
DROP POLICY IF EXISTS "Users access moisture maps" ON public.moisture_maps;

CREATE POLICY "Users access moisture maps"
  ON public.moisture_maps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = moisture_maps.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

CREATE POLICY "Users can insert moisture maps"
  ON public.moisture_maps FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = moisture_maps.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

CREATE POLICY "Users can update moisture maps"
  ON public.moisture_maps FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = moisture_maps.chamber_id
      AND can_access_job(chambers.job_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = moisture_maps.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

CREATE POLICY "Users can delete moisture maps"
  ON public.moisture_maps FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = moisture_maps.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

-- ============================================================================
-- DRYING LOGS - Fix INSERT policy (if needed)
-- ============================================================================
DROP POLICY IF EXISTS "Users access drying logs" ON public.drying_logs;

CREATE POLICY "Users access drying logs"
  ON public.drying_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = drying_logs.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

CREATE POLICY "Users can insert drying logs"
  ON public.drying_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = drying_logs.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

CREATE POLICY "Users can update drying logs"
  ON public.drying_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = drying_logs.chamber_id
      AND can_access_job(chambers.job_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = drying_logs.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

CREATE POLICY "Users can delete drying logs"
  ON public.drying_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = drying_logs.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

