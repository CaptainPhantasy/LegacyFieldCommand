-- Migration: Add INSERT policy for alerts table
-- This allows admins and authenticated users to create alerts

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can create alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can create alerts" ON public.alerts;

-- Admins can create alerts
CREATE POLICY "Admins can create alerts"
  ON public.alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'estimator')
    )
  );

-- Authenticated users can also create alerts (for system-generated alerts and user-created alerts)
-- This is more permissive but allows the API to work
CREATE POLICY "Users can create alerts"
  ON public.alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

