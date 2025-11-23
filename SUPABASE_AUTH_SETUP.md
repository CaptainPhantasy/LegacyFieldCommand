# Supabase Auth Setup - Quick Start

## ✅ What We Have
- Auth trigger configured (auto-creates profiles)
- Login/Signup UI built
- Server actions ready

## ❌ What's Missing
- Email Auth Provider enabled in Supabase
- Test user created

## 🚀 Setup Steps (5 minutes)

### Step 1: Enable Email Auth Provider

1. Go to: https://supabase.com/dashboard/project/anwltpsdedfvkbscyylk/auth/providers
2. Find **"Email"** in the provider list
3. Click **"Enable"** or toggle it ON
4. Save

### Step 2: Disable Email Confirmation (For Development)

1. Go to: https://supabase.com/dashboard/project/anwltpsdedfvkbscyylk/auth/url-configuration
2. Or: Settings → Auth → Email Auth
3. **Uncheck** "Enable email confirmations" (for quick dev testing)
4. Save

### Step 3: Create Test User (Choose One Method)

**Option A: Via Dashboard (Easiest)**
1. Go to: https://supabase.com/dashboard/project/anwltpsdedfvkbscyylk/auth/users
2. Click **"Add User"** → **"Create new user"**
3. Enter:
   - Email: `test@legacyfield.com`
   - Password: `TestPass123!`
   - Auto Confirm User: ✅ (checked)
4. Click **"Create user"**
5. The trigger will auto-create the profile in `public.profiles`

**Option B: Via Web App Signup**
1. After enabling Email Auth (Step 1 & 2)
2. Go to: http://localhost:8765/login
3. Fill in the signup form
4. Click "Sign up"
5. User will be created (no email confirmation needed if disabled)

### Step 4: Verify It Works

1. Go to: http://localhost:8765/login
2. Enter: `test@legacyfield.com` / `TestPass123!`
3. Click "Sign in"
4. Should redirect to Dashboard

## 🔍 Verify Auth is Working

Check in Supabase Dashboard:
- **Authentication → Users**: Should see your test user
- **Table Editor → profiles**: Should see matching profile row

## 🐛 Troubleshooting

**"Email address is invalid"**
→ Email provider not enabled. Do Step 1.

**"User already exists" but can't login**
→ Email confirmation required. Do Step 2 (disable confirmations) OR manually confirm:
```sql
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'test@legacyfield.com';
```

**Profile not created after signup**
→ Check trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```
If missing, re-run the trigger section from `schema.sql`

## 📝 Test Credentials (After Setup)

- **Email:** test@legacyfield.com
- **Password:** TestPass123!
- **Role:** field_tech (default)
