# Archive Directory

This directory contains obsolete test files, scripts, documentation, and artifacts that are no longer actively used but are preserved for reference.

## Archive Structure

```
archive/
├── scripts/          # Obsolete test and verification scripts
├── docs/            # Old documentation and status reports
├── supabase-sql/    # Old SQL test/verification files
├── test-files/      # Standalone test files
├── test-artifacts/  # Test result screenshots and reports
├── seed-scripts/    # Seed/demo scripts
├── one-time-fixes/ # One-time fix scripts
└── legacy-field-command/ # Nested project directories
```

## What Was Archived and Why

### Scripts (`archive/scripts/`)

**Test Scripts** - One-time verification scripts:
- `test_anon_access_detailed.js` - RLS verification (replaced by comprehensive script)
- `test_rls_direct.js` - Direct RLS testing (superseded)
- `test_rls_policies.js` - Policy verification (superseded)

**Final Verification Scripts** - Completed verification:
- `final_rls_security_test.js` - Final RLS security check (completed)
- `final_verification.js` - Database verification (completed)

**Comprehensive Scripts** - One-time comprehensive checks:
- `comprehensive_rls_verification.js` - Comprehensive RLS check (completed)

**Verify Scripts** - One-time verification:
- `verify_database_complete.js` - Database completeness check (completed)
- `verify_storage_rls.js` - Storage RLS verification (completed)

**Note**: These scripts were used during development/migration phases and are no longer needed for active development.

### Documentation (`archive/docs/`)

**Status Reports** (Completed/Superseded):
- `AUTOMATED_TESTING_STATUS.md` - Old testing status
- `AUTONOMOUS_BUILD_PLAN.md` - Completed build plan
- `ENDPOINT_ADEQUACY_ANALYSIS.md` - Completed analysis
- `IMPLEMENTATION_COMPLETE.md` - Completed implementation report
- `PLATFORM_COMPLETION_REPORT.md` - Completed platform report
- `TESTING_AND_POLISH_SUMMARY.md` - Completed testing summary
- `TESTING_CHECKLIST.md` - Completed checklist
- `TESTING_COMPLETE_SUMMARY.md` - Completed summary
- `CLEANUP_SUMMARY.md` - Cleanup summary (completed)

**RLS/Testing Documentation** (Superseded):
- `DIAGNOSE_RLS.md` - Old RLS diagnosis (replaced by current RLS setup)
- `QUICK_RLS_FIX.md` - Quick fix guide (no longer needed)
- `QUICK_START_TESTING.md` - Old quick start (replaced by e2e/README.md)
- `RLS_FIX_INSTRUCTIONS.md` - Old fix instructions (superseded)
- `SCHEMA_VERIFICATION_REPORT.md` - Completed verification

**Mobile Testing** (Superseded):
- `IOS_TEST_RESULTS.md` - Old iOS test results
- `IOS_TESTING_GUIDE.md` - Old iOS guide (may be referenced but not active)
- `MOBILE_TESTING.md` - Old mobile testing docs
- `MOBILE_GATE_UI_SUMMARY.md` - Old UI summary

**Shared Documentation** (Completed):
- `BUILD_PROGRESS.md` - Completed build progress
- `completion-summary.md` - Completed summary
- `testing-status.md` - Old testing status
- `swarm-completion-plan.md` - Completed swarm plan
- `swarm-coordination.md` - Completed coordination docs
- `TEST_EXECUTION_PLAN.md` - Old test execution plan (replaced by e2e/README.md)
- `COT_BUILD_CONTINUATION.md` - Old build continuation doc
- `swarm-i1-progress.md` - Old progress tracking
- `swarm-i1-summary.md` - Old summary
- `MIGRATION_PLAN.md` - Completed migration plan
- `SUPABASE_EMAIL_FIX.md` - One-time fix guide

### Supabase SQL (`archive/supabase-sql/`)

**Old SQL Test Files** - Superseded by current migrations:
- `test_rls_directly.sql` - Old RLS test (replaced by fix_storage_rls_all_buckets.sql)
- `check_job_photos_policies.sql` - Old policy check (superseded)
- `verify_rls_policies.sql` - Old verification (superseded)
- `add_anon_policies.sql` - Old anon policies (superseded)
- `final_anon_policies.sql` - Old final policies (superseded)
- `fix_job_photos_rls.sql` - Old fix (replaced by fix_storage_rls_all_buckets.sql)

**Obsolete Fix Scripts** - Superseded by individual migrations:
- `fix_all_migrations.sql` - Comprehensive fix (migrations handle this now)
- `fix_rls_complete.sql` - Old RLS fix v1 (superseded)
- `fix_rls_complete_v2.sql` - Old RLS fix v2 (superseded)
- `fix_rls_secure.sql` - Another RLS fix variant (superseded)
- `fix_storage_rls.sql` - Old storage RLS (replaced by fix_storage_rls_all_buckets.sql)
- `enable_rls_all_tables.sql` - Redundant (migrations handle RLS)
- `setup_db_complete.sql` - Redundant (migrations handle setup)

**Temporary/One-time Scripts**:
- `temp_relax_rls.sql` - Temporary dev fix (no longer needed)
- `add_gate_metadata.sql` - One-time fix (already applied)
- `create_test_user.sql` - Documentation only (scripts handle this better)

**Duplicate Migration Files**:
- `20251122034802_final_anon_policies.sql` - Duplicate/old migration
- `20251122034820_final_anon_policies.sql` - Duplicate/old migration

### Test Files (`archive/test-files/`)

- `test-photo-capture.js` - Standalone browser console test script (no longer needed)

### Test Artifacts (`archive/test-artifacts/`)

- `test-results/` - Playwright test result screenshots (6.2MB)
- `playwright-report/` - Playwright HTML test reports (1.3MB)

**Note**: These are generated files that can be recreated by running tests. Archived to save space.

### Seed Scripts (`archive/seed-scripts/`)

- `seed_moisture.js` - Seed script for moisture demo data
- `auto_setup_and_seed.js` - Auto setup and seed script
- `seed_moisture_demo.js` - Demo seed script v1
- `seed_moisture_demo_v2.js` - Demo seed script v2

**Note**: These were used for development/demo purposes and are no longer needed.

### One-Time Fixes (`archive/one-time-fixes/`)

- `fix_job_access.js` - One-time fix for job access issues
- `fix_job_gates.js` - One-time fix for job gates
- `remove_duplicate_gate.js` - One-time fix to remove duplicate gates
- `create_job_photos_rls.js` - One-time setup for job photos RLS
- `enable_rls_all_tables.js` - One-time setup (migrations handle this now)
- `check_migration_status.js` - One-time check script
- `check_rls_policies.js` - One-time check script

**Note**: These were used to fix specific issues during development and are no longer needed.

### Nested Directories (`archive/legacy-field-command/`)

- `apps/mobile/legacy-field-command/` - Empty nested directory
- `apps/web/legacy-field-command/` - Nested project directory (32KB)

**Note**: These appear to be accidentally created nested project directories.

## What Was Kept (Active Files)

### Active Test Files
- `apps/web/e2e/*.spec.ts` - Active Playwright E2E tests
- `apps/web/e2e/helpers/*` - Active test helpers
- `apps/web/e2e/README.md` - Active test documentation

### Active Scripts (in `scripts/`)
- `create_*.js` - User/job creation utilities (still useful)
- `assign_*.js` - Job assignment utilities
- `update_*.js` - User update utilities
- `execute_*.js` - Migration execution scripts (may be needed)
- `start-ngrok.sh`, `stop-ngrok.sh` - Active ngrok scripts
- `test-ios-simulator.sh`, `test-data-persistence.sh` - Testing tools

### Active Documentation
- `README.md` - Main project README
- `STORAGE_BUCKET_SETUP.md` - Active storage setup guide
- `SWARM_ORCHESTRATION_PLAN.md` - Active swarm plan
- `SWARM_PROGRESS.md` - Active progress tracking
- `UX_WORKFLOW_DOCUMENTATION.md` - Active UX docs
- `GATE_REQUIREMENTS.md` - Active gate requirements
- `NGROK_SETUP.md` - Active ngrok setup guide
- `SUPABASE_AUTH_SETUP.md` - Active auth setup guide
- `shared-docs/final-integration-*.md` - Active integration docs
- `shared-docs/api-reference.md` - API reference
- `shared-docs/api-spec.md` - API specification
- `supabase/MIGRATION_EXECUTION_ORDER.md` - Active migration guide
- `supabase/README.md` - Active Supabase documentation

## Restoration

If you need to restore any archived files:
1. Check this README to understand what was archived
2. Copy the file back from `archive/` to its original location
3. Update any references if the file structure has changed

## Archive Date

Archived: $(date)
Reason: Comprehensive cleanup of obsolete files, test artifacts, and completed documentation
