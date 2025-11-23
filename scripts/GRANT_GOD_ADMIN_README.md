# Grant God Admin (Owner) Role - IMMORTAL ACCESS

This directory contains scripts to grant yourself the **OWNER** role (GOD TIER) - the highest level of access in the system.

## ⚠️ WARNING

The **OWNER** role has **UNRESTRICTED** access to:
- All users and their data
- All jobs, estimates, and system data
- System settings and configuration
- Ability to delete/restore critical data
- Override any restrictions
- Full admin dashboard access

**NO ONE ELSE** will have this level of access unless you explicitly grant it.

---

## Your User Information

- **User ID**: `c3770f70-6c96-4ddc-8b30-3a9016c7c572`
- **Email**: `douglastalley1977@gmail.com`
- **Name**: Douglas Talley

---

## Option 1: Quick JavaScript Script (Recommended)

The fastest way - uses your user ID directly:

```bash
cd legacy-field-command
node scripts/grant_god_admin_quick.js
```

**Requirements:**
- Environment variables set in `.env` or `apps/web/.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## Option 2: Interactive JavaScript Script

For any user (with prompts):

```bash
cd legacy-field-command
node scripts/grant_god_admin.js
```

Or with your email:
```bash
node scripts/grant_god_admin.js douglastalley1977@gmail.com
```

**Requirements:**
- Same environment variables as Option 1

---

## Option 3: Direct SQL (Fastest)

Run this SQL directly in Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/[your-project]/sql/new
2. Copy and paste the contents of `grant_god_admin_direct.sql`
3. Click "Run"

**No environment variables needed** - runs directly in Supabase.

---

## Verification

After running any script, verify your role:

```sql
SELECT id, email, role, full_name 
FROM public.profiles 
WHERE id = 'c3770f70-6c96-4ddc-8b30-3a9016c7c572';
```

Expected result: `role` should be `owner` ⭐

---

## Troubleshooting

### "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"

1. Create `.env` file in project root, or
2. Use `apps/web/.env.local`
3. Add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### "User not found"

- Make sure you've created your user account in Supabase Auth first
- Verify your email matches exactly

### "Error updating profile"

- Check that the `profiles` table exists
- Verify RLS policies allow service role updates
- Check Supabase logs for detailed error messages

---

## Security Notes

- The service role key has **full database access** - keep it secret
- Never commit service role keys to git
- The owner role cannot be revoked except by another owner or direct database access
- Use this power responsibly

---

## Files

- `grant_god_admin_quick.js` - Quick script with your user ID (recommended)
- `grant_god_admin.js` - Interactive script for any user
- `grant_god_admin_direct.sql` - Direct SQL for Supabase SQL Editor

