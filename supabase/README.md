# Supabase SQL Files

## Active SQL Files

### Migrations (`migrations/`)
These are the **active table migrations** that should be run in order:

1. `add_policies_table.sql` - Creates policies table
2. `add_communications_table.sql` - Creates email_templates and communications tables
3. `add_estimates_table.sql` - Creates estimates and estimate_line_items tables
4. `add_alerts_table.sql` - Creates alerts and alert_rules tables
5. `add_templates_table.sql` - Creates job_templates table
6. `add_measurements_table.sql` - Creates measurements table

**See `MIGRATION_EXECUTION_ORDER.md` for detailed execution instructions.**

### Storage RLS
- `fix_storage_rls_all_buckets.sql` - **Active** RLS policies for all storage buckets (job-photos, policies, voice-recordings, measurements)

### Reference Files
- `schema.sql` - Complete database schema reference
- `create_storage_buckets.sql` - Reference SQL for creating storage buckets (manual setup in Dashboard)

### Documentation
- `MIGRATION_EXECUTION_ORDER.md` - **Active** guide for running migrations

## Archived Files

Obsolete SQL files have been moved to `archive/supabase-sql/`:
- Old RLS fix scripts (fix_rls_*.sql)
- Old comprehensive fix scripts (fix_all_migrations.sql)
- Temporary dev fixes (temp_relax_rls.sql)
- Duplicate migration files (final_anon_policies.sql variants)
- One-time setup scripts (setup_db_complete.sql, enable_rls_all_tables.sql)
- Obsolete utility scripts (add_gate_metadata.sql, create_test_user.sql)

## Usage

### Running Migrations
1. Follow `MIGRATION_EXECUTION_ORDER.md` for the correct order
2. Run each migration file in Supabase SQL Editor
3. All migrations are idempotent (safe to re-run)

### Storage Setup
1. Create buckets manually in Supabase Dashboard (see `STORAGE_BUCKET_SETUP.md`)
2. Run `fix_storage_rls_all_buckets.sql` to set up RLS policies

### Schema Reference
- Use `schema.sql` as a reference for the complete database structure
- This file shows all tables, types, and relationships

