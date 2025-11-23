# Security Fix: Removed Hardcoded Secrets

## Summary
All hardcoded Supabase service role keys and JWT tokens have been removed from script files and replaced with environment variables.

## Files Fixed (9 total)

### User Management Scripts
1. ✅ `scripts/update_user_role.js`
2. ✅ `scripts/update_user_password.js`
3. ✅ `scripts/create_user.js`
4. ✅ `scripts/create_field_tech.js`
5. ✅ `scripts/assign_job_to_tech.js`

### Database/Storage Scripts
6. ✅ `scripts/create_storage_buckets.js`
7. ✅ `scripts/execute_secure_rls.js`
8. ✅ `scripts/execute_migrations.js`
9. ✅ `scripts/execute_sql_in_supabase.js`

## Changes Made

### Before
```javascript
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
// or
const serviceRoleKey = 'sbp_1c3492ae02ff8a02b1e46b99dd593b9afcc99d6a';
```

### After
```javascript
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  process.exit(1);
}
```

## Required Environment Variables

All scripts now require these environment variables to be set:

- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (admin key)

## Setup Instructions

1. Create a `.env` file in the project root (or use `.env.local` in `apps/web/`)
2. Add your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
3. Run scripts as before - they will now read from environment variables

## Security Recommendations

⚠️ **IMPORTANT**: Since these secrets were previously committed to git:

1. **Rotate your Supabase service role key immediately**:
   - Go to: Supabase Dashboard > Project Settings > API
   - Generate a new service role key
   - Update your `.env` file with the new key
   - Revoke the old key

2. **Check git history**: The old keys may still be in git history. Consider:
   - Using `git filter-branch` or BFG Repo-Cleaner to remove secrets from history
   - Or creating a new repository if the history contains sensitive data

3. **Verify `.gitignore`**: Ensure `.env*` files are ignored (they should be)

4. **Never commit secrets**: Always use environment variables for sensitive data

## Verification

To verify no secrets remain in the codebase:
```bash
# Check for JWT tokens
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" scripts/

# Check for service role keys
grep -r "sbp_" scripts/
```

Both commands should return no results.

