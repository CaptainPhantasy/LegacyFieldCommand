# Conflicting Files Cleanup Summary

## Date: 2025-11-23

## Files Archived Due to Conflicts

### 1. Dangerous Schema File ✅
**File**: `supabase/schema.sql` (original)
**Location**: `archive/docs/conflicting-files/schema-with-drop-statements.sql`
**Issue**: Contained `DROP TABLE IF EXISTS` statements that could wipe the database if accidentally run
**Action**: Archived original, created safe reference-only version without DROP statements

### 2. Comprehensive Schema File ✅
**File**: `supabase/migrations/comprehensive_new_features_schema.sql` (root directory)
**Location**: `archive/docs/conflicting-files/comprehensive_new_features_schema.sql`
**Issue**: Large monolithic schema file conflicts with current approach of individual migration files
**Impact**: Could cause confusion about which migrations to run
**Action**: Archived - use individual migration files instead

### 3. Outdated Database Schema Documentation ✅
**File**: `shared-docs/database-schema.md` (original)
**Location**: `archive/docs/conflicting-files/database-schema-outdated.md`
**Issue**: Said "New Tables (To Be Created)" but tables are already created
**Impact**: Could mislead developers about current state
**Action**: Archived original, created updated version reflecting current state

### 4. Phased MVP Roadmap ✅
**File**: `# 1. Phased MVP Roadmap.md` (root directory)
**Location**: `archive/docs/planning/# 1. Phased MVP Roadmap.md`
**Issue**: Planning document with potentially outdated phase objectives
**Impact**: Could conflict with current development priorities
**Action**: Archived

### 5. Integration Layer Plan ✅
**File**: `shared-docs/integration-layer-plan.md`
**Location**: `archive/docs/conflicting-files/integration-layer-plan.md`
**Issue**: Planning document that may have outdated objectives
**Impact**: Could conflict with current integration implementation
**Action**: Archived

---

## Files Updated (Not Archived)

### 1. Safe Schema Reference ✅
**File**: `supabase/schema.sql` (new version)
**Changes**:
- Removed all `DROP TABLE` statements
- Added clear warnings that it's reference-only
- Documented that migrations should be used for changes
- Made safe for viewing without risk

### 2. Updated Database Schema Documentation ✅
**File**: `shared-docs/database-schema.md` (new version)
**Changes**:
- Updated to reflect that all tables are **already created**
- Removed "To Be Created" language
- Added references to migration files
- Clarified current state vs. future plans

---

## Code with Backward Compatibility

The following code contains backward compatibility logic, which is **intentional and necessary**:
- `app/field/gates/[id]/page.tsx` - Handles migration from old `damageType` format to new `affectedAreas` format
- `app/field/gates/[id]/page.tsx` - Legacy moisture readings support (with deprecation warning)

**Action**: These are kept as they handle data migration from old formats to new formats.

---

## TODO Comments Reviewed

### Active TODOs (Keep)
- `components/boards/BoardView.tsx` - "TODO: Implement Kanban view" - Future feature, not conflicting
- `app/api/integrations/webhook/route.ts` - "TODO: Implement webhook processing" - Future feature
- `app/api/estimates/generate/route.ts` - "TODO: Use AI to generate estimate" - Future feature

**Action**: These are future features, not conflicting objectives. Keep as-is.

---

## Remaining Essential Files

### Active Documentation
- `shared-docs/api-reference.md` - Current API reference
- `shared-docs/api-spec.md` - API specification
- `shared-docs/api-standards.md` - API development standards
- `shared-docs/integration-api-contract.md` - Integration contract (current)
- `shared-docs/SUPABASE_SECURITY_FIXES.md` - Security fixes (current)

### Active Migrations
- All files in `supabase/migrations/` - Active, needed for database
- `supabase/MIGRATION_EXECUTION_ORDER.md` - Active guide
- `supabase/README.md` - Current documentation

### Active Configuration
- All config files are current and needed

---

## Summary

**Files Archived**: 5 conflicting files
**Files Updated**: 2 files (made safe/current)
**Code Reviewed**: Backward compatibility code is intentional and kept
**TODOs Reviewed**: All are future features, not conflicting objectives

**Result**: Codebase is now free of conflicting directives and outdated objectives.

