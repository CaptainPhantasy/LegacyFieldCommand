# Supabase Security Fixes - Swarm Orchestration

## Overview
Fix all security warnings and info items identified by Supabase linter to ensure production-grade security.

## Issues Identified

### 🔴 CRITICAL: Function Search Path Mutable (12 functions)
**Risk**: HIGH - SQL injection vulnerability
**Functions Affected**:
1. `update_alert_rules_updated_at`
2. `refresh_dashboard_metrics`
3. `is_admin`
4. `can_access_job`
5. `get_chamber_summary`
6. `calculate_equipment_days`
7. `update_email_templates_updated_at`
8. `update_policies_updated_at`
9. `update_updated_at_column`
10. `handle_new_user`
11. `recalculate_estimate_totals`
12. `update_estimates_updated_at`

**Fix**: Add `SET search_path = ''` or `SET search_path = public, pg_temp` to all functions

### 🟡 WARNING: Materialized View in API
**Risk**: MEDIUM - Unrestricted access to dashboard_metrics
**Issue**: `dashboard_metrics` materialized view accessible via Data API
**Fix**: Add RLS policies or restrict access

### 🟡 WARNING: Leaked Password Protection Disabled
**Risk**: MEDIUM - Users can use compromised passwords
**Issue**: Supabase Auth leaked password protection is disabled
**Fix**: Enable in Supabase Dashboard (not code change)

### 🟢 INFO: RLS Enabled No Policy (2 tables)
**Risk**: LOW - Tables locked down but may need policies
**Tables Affected**:
1. `accounts`
2. `audit_logs`

**Fix**: Add appropriate RLS policies or document why no policies needed

---

## Wave Execution Plan

### Wave 1: Fix Function Search Path (Parallel - 3 agents)
**Status**: 🔄 Ready to Start
**Priority**: CRITICAL

**Agent 1.1**: Fix Trigger Functions (4 functions)
- `update_alert_rules_updated_at`
- `update_email_templates_updated_at`
- `update_policies_updated_at`
- `update_updated_at_column`

**Agent 1.2**: Fix Helper Functions (4 functions)
- `is_admin`
- `can_access_job`
- `refresh_dashboard_metrics`
- `handle_new_user`

**Agent 1.3**: Fix Business Logic Functions (4 functions)
- `get_chamber_summary`
- `calculate_equipment_days`
- `recalculate_estimate_totals`
- `update_estimates_updated_at`

### Wave 2: Fix Materialized View Security (Sequential)
**Status**: ⏳ Pending Wave 1
**Priority**: HIGH

- Add RLS policies to `dashboard_metrics` or restrict access
- Update refresh function security

### Wave 3: Add Missing RLS Policies (Parallel - 2 agents)
**Status**: ⏳ Pending Wave 2
**Priority**: MEDIUM

**Agent 3.1**: Add RLS policies for `accounts` table
**Agent 3.2**: Add RLS policies for `audit_logs` table

### Wave 4: Documentation & Verification (Sequential - FINAL)
**Status**: ⏳ Pending Wave 3
**Priority**: HIGH

1. Document password protection enablement (manual step)
2. Verify all fixes
3. Re-run Supabase linter
4. Create migration file

---

## Success Criteria
- ✅ All 12 functions have immutable search_path
- ✅ dashboard_metrics has proper access control
- ✅ accounts table has RLS policies (or documented why not)
- ✅ audit_logs table has RLS policies (or documented why not)
- ✅ Password protection documented for manual enablement
- ✅ All fixes verified with Supabase linter
- ✅ Migration file created and tested

## Security Pattern

### Function Search Path Fix Pattern
```sql
CREATE OR REPLACE FUNCTION function_name()
RETURNS type AS $$
BEGIN
  -- Function body
END;
$$ LANGUAGE plpgsql
SET search_path = '';  -- Add this line
```

For SECURITY DEFINER functions:
```sql
CREATE OR REPLACE FUNCTION function_name()
RETURNS type AS $$
BEGIN
  -- Function body
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;  -- Or specific schema
```

