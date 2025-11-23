# Database Migration Execution Order

## ⚠️ CRITICAL: Run migrations in this exact order

Migrations have dependencies and **must be executed sequentially** in Supabase SQL Editor.

## ✅ Idempotent Migrations

**All migrations are now idempotent** - they can be safely re-run without errors. Each migration:
- Uses `CREATE TABLE IF NOT EXISTS` for tables
- Uses `DROP POLICY IF EXISTS` before `CREATE POLICY` for RLS policies
- Uses `CREATE INDEX IF NOT EXISTS` for indexes
- Uses `CREATE OR REPLACE FUNCTION` for functions

This means if a migration partially fails, you can re-run it without conflicts.

---

## Execution Order

### Step 1: Policies Table (No Dependencies)
**File**: `migrations/add_policies_table.sql`
- Creates `policies` table
- Required by: Estimates table

**Run this first!**

---

### Step 2: Communications Tables (No Dependencies)
**File**: `migrations/add_communications_table.sql`
- Creates `email_templates` table
- Creates `communications` table
- Independent of other migrations

**Can run in parallel with Step 1, but run Step 1 first to be safe**

---

### Step 3: Estimates Tables (Depends on Policies)
**File**: `migrations/add_estimates_table.sql`
- Creates `estimates` table (references `policies`)
- Creates `estimate_line_items` table (references `estimates`)
- **Requires**: `policies` table to exist

**Must run AFTER Step 1**

---

### Step 4: Alerts Tables (No Dependencies)
**File**: `migrations/add_alerts_table.sql`
- Creates `alert_rules` table
- Creates `alerts` table
- Creates `monitoring_metrics` table
- Independent of other migrations

**Can run anytime after base schema**

---

### Step 5: Templates Table (Depends on Estimates Structure)
**File**: `migrations/add_templates_table.sql`
- Creates `job_templates` table
- References estimate structure (for default_line_items)
- **Requires**: Estimates table structure (Step 3)

**Must run AFTER Step 3**

---

### Step 6: Measurements Table (No Dependencies)
**File**: `migrations/add_measurements_table.sql`
- Creates `measurements` table
- Independent of other migrations

**Can run anytime**

---

## Quick Execution Script

Copy and paste each migration file **in order** into Supabase SQL Editor:

```sql
-- 1. Policies (REQUIRED FIRST)
-- Copy contents of: migrations/add_policies_table.sql

-- 2. Communications (Can run after #1)
-- Copy contents of: migrations/add_communications_table.sql

-- 3. Estimates (REQUIRES #1)
-- Copy contents of: migrations/add_estimates_table.sql

-- 4. Alerts (Can run anytime)
-- Copy contents of: migrations/add_alerts_table.sql

-- 5. Templates (REQUIRES #3)
-- Copy contents of: migrations/add_templates_table.sql

-- 6. Measurements (Can run anytime)
-- Copy contents of: migrations/add_measurements_table.sql
```

---

## Dependency Graph

```
policies (Step 1)
    ↓
estimates (Step 3) → templates (Step 5)

communications (Step 2) [independent]
alerts (Step 4) [independent]
measurements (Step 6) [independent]
```

---

## Verification Queries

After running all migrations, verify with:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'policies',
  'email_templates',
  'communications',
  'estimates',
  'estimate_line_items',
  'alert_rules',
  'alerts',
  'monitoring_metrics',
  'job_templates',
  'measurements'
)
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'policies',
  'email_templates',
  'communications',
  'estimates',
  'estimate_line_items',
  'alert_rules',
  'alerts',
  'monitoring_metrics',
  'job_templates',
  'measurements'
);
```

---

## Storage Buckets Setup

After migrations, create storage buckets:

1. **policies** bucket
   - Public: No (authenticated only)
   - File size limit: 10MB
   - Allowed MIME types: application/pdf

2. **voice-recordings** bucket
   - Public: No (authenticated only)
   - File size limit: 25MB
   - Allowed MIME types: audio/*

3. **measurements** bucket
   - Public: No (authenticated only)
   - File size limit: 100MB
   - Allowed MIME types: */* (various 3D formats)

---

## Troubleshooting

### Error: "relation does not exist"
- **Cause**: Migration order incorrect
- **Fix**: Run migrations in the order specified above

### Error: "permission denied"
- **Cause**: RLS policies blocking access
- **Fix**: Verify RLS policies were created correctly

### Error: "function does not exist"
- **Cause**: Trigger functions not created
- **Fix**: Re-run the migration file that creates the function

