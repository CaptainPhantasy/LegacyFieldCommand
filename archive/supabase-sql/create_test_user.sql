-- SIMPLE TEST USER CREATION
-- Run this in Supabase SQL Editor to create a test user

-- Step 1: Create user in auth.users (this will trigger the profile creation)
-- Note: We need to use Supabase's auth schema functions
-- Actually, the easiest way is via the Dashboard or API

-- Alternative: Use Supabase Management API or Dashboard
-- But for SQL, we can manually create if we have the right permissions:

-- First, check if auth schema is accessible
SELECT current_schema();

-- If you can't create users via SQL (common security restriction),
-- Use one of these methods:

-- METHOD 1: Supabase Dashboard (Easiest)
-- 1. Go to Authentication → Users
-- 2. Click "Add User" → "Create new user"
-- 3. Enter: test@legacyfield.com / TestPass123!
-- 4. Uncheck "Auto Confirm User" if you want to test email flow
-- 5. The trigger will auto-create the profile

-- METHOD 2: Enable Email Auth Provider
-- 1. Go to Authentication → Providers
-- 2. Enable "Email" provider
-- 3. Go to Settings → Auth
-- 4. Under "Email Auth", disable "Enable email confirmations" (for dev)
-- 5. Save
-- 6. Then signup via the web app will work

-- METHOD 3: Use Supabase CLI (if installed)
-- supabase auth users create test@legacyfield.com --password TestPass123!

-- The profile will be auto-created by the trigger we set up in schema.sql
