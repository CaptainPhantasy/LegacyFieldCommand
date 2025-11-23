-- ============================================================================
-- GRANT GOD ADMIN (OWNER) ROLE - IMMORTAL ACCESS
-- ============================================================================
-- 
-- ⚠️  WARNING: This SQL grants the HIGHEST level of access in the system.
-- ⚠️  The 'owner' role has UNRESTRICTED access to ALL features and data.
-- ⚠️  This should ONLY be run for the system owner/founder.
-- 
-- This script will:
-- 1. Grant you the 'owner' role (GOD TIER - highest privilege)
-- 2. Ensure your profile exists and is properly configured
-- 3. Verify the change was successful
-- 
-- NO ONE ELSE will have this level of access unless you explicitly grant it.
-- ============================================================================

-- Your user information:
-- ID: c3770f70-6c96-4ddc-8b30-3a9016c7c572
-- Email: douglastalley1977@gmail.com

-- Upsert profile with owner role (GOD TIER)
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
  'douglastalley1977@gmail.com',           -- Your email
  'Douglas Talley',                         -- Your name (update if needed)
  'owner',                                  -- GOD TIER - highest privilege
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
  role = 'owner',                           -- Ensure role is ALWAYS owner
  updated_at = NOW();

-- Verify the profile was created/updated
SELECT 
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
FROM public.profiles
WHERE id = 'c3770f70-6c96-4ddc-8b30-3a9016c7c572';

-- Expected result: role should be 'owner' ⭐

