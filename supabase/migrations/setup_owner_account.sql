-- ============================================================================
-- Setup Owner Account (GOD TIER Admin)
-- ============================================================================
-- This migration sets up the owner account with full administrative privileges
-- Run this in Supabase SQL Editor after creating the auth user
-- ============================================================================

-- Insert or update profile for owner account
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
)
VALUES (
  'c3770f70-6c96-4ddc-8b30-3a9016c7c572', -- Your user ID
  'douglastalley1977@gmail.com',
  'Douglas Talley', -- Update with your preferred name
  'owner', -- GOD TIER - highest privilege level
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = 'owner', -- Ensure role is set to owner
  updated_at = NOW();

-- Verify the profile was created/updated
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles
WHERE id = 'c3770f70-6c96-4ddc-8b30-3a9016c7c572';

