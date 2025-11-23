# Test Fixes & RLS Policies - Swarm Orchestration

## Chain of Thought Analysis

### Current State
- ✅ Auth optimization complete (reduced excessive getUser() calls)
- ✅ Login timeout fixes applied
- ✅ Alerts POST endpoint added
- ✅ Alerts INSERT RLS policy applied
- ⚠️ ~10 test failures remaining (from sample of 56)
- ⚠️ Original: 128 passing, 212 failing, 47 skipped (340 total)

### Root Cause Analysis

#### Category 1: Missing RLS Policies (High Priority)
**Impact**: Tests fail with 403/404 errors when trying to INSERT/UPDATE/DELETE
**Tables Affected**:
- `moisture_points` - Field tech operations failing
- `equipment_logs` - Field tech operations failing
- Potentially others from recent migrations

#### Category 2: Missing/Incomplete API Endpoints (Medium Priority)
**Impact**: Tests fail with 404/405 errors
**Endpoints to Verify**:
- `/api/jobs/[jobId]/sync-to-board` - Integration sync
- `/api/jobs/[jobId]/board-item` - Get linked board item
- `/api/items/[itemId]/job` - Get linked job
- `/api/items/[itemId]/sync-to-job` - Sync board to job
- `/api/estimates/[estimateId]/export` - Export functionality

#### Category 3: Test Data/Setup Issues (Low Priority)
**Impact**: Tests skip or fail due to missing prerequisites
**Issues**:
- Job creation/assignment in beforeEach
- Chamber creation dependencies
- Board item sync timing

### Success Criteria
1. ✅ All RLS policies for field documentation tables exist
2. ✅ All integration sync endpoints functional
3. ✅ Test pass rate > 95% (323+ passing out of 340)
4. ✅ Auth requests reduced by >70% (from 16,000 to <5,000)
5. ✅ No critical security gaps

---

## Wave 1: RLS Policy Fixes (Parallel - 3 agents)

### Agent 1.1: Moisture Points RLS Policies
**Task**: Add missing RLS policies for `moisture_points` table

**Files to Check/Create**:
- Check: `supabase/migrations/comprehensive_new_features_schema.sql`
- Create: `supabase/migrations/add_moisture_points_rls.sql` (if needed)

**Policies Needed**:
- SELECT: Field techs can view moisture points for their assigned jobs (via chamber → job relationship)
- INSERT: Field techs can create moisture points for chambers in their jobs
- UPDATE: Field techs can update moisture points in their jobs
- DELETE: Field techs can delete moisture points in their jobs

**Success Criteria**:
- ✅ All 4 policies created
- ✅ Policies allow field tech access via job relationship
- ✅ Migration file created and ready to apply

---

### Agent 1.2: Equipment Logs RLS Policies
**Task**: Add missing RLS policies for `equipment_logs` table

**Files to Check/Create**:
- Check: `supabase/migrations/comprehensive_new_features_schema.sql`
- Create: `supabase/migrations/add_equipment_logs_rls.sql` (if needed)

**Policies Needed**:
- SELECT: Field techs can view equipment logs for their assigned jobs
- INSERT: Field techs can create equipment logs for their jobs
- UPDATE: Field techs can update equipment logs in their jobs
- DELETE: Field techs can delete equipment logs in their jobs

**Success Criteria**:
- ✅ All 4 policies created
- ✅ Policies allow field tech access via job relationship
- ✅ Migration file created and ready to apply

---

### Agent 1.3: Audit All Field Documentation Tables
**Task**: Verify RLS policies exist for all field documentation tables

**Tables to Audit**:
- `chambers` ✅ (likely exists)
- `chamber_rooms` (check)
- `psychrometric_readings` (check)
- `moisture_points` ⚠️ (needs fixes)
- `moisture_maps` (check)
- `drying_logs` (check)
- `equipment_logs` ⚠️ (needs fixes)
- `floor_plans` (check)
- `rooms` (check)
- `boxes` (check)
- `content_items` (check)

**Files to Check**:
- `supabase/migrations/comprehensive_new_features_schema.sql`
- `supabase/migrations/add_alerts_table.sql` (for reference pattern)

**Success Criteria**:
- ✅ All tables have appropriate RLS policies
- ✅ Document any missing policies
- ✅ Create migration for any missing policies

---

## Wave 2: Integration Sync Endpoints (Parallel - 2 agents)

### Agent 2.1: Verify Job → Board Sync Endpoints
**Task**: Verify and fix job-to-board sync endpoints

**Endpoints to Verify**:
- `POST /api/jobs/[jobId]/sync-to-board` - Manual sync
- `GET /api/jobs/[jobId]/board-item` - Get linked board item

**Files to Check**:
- `apps/web/app/api/jobs/[jobId]/sync-to-board/route.ts`
- `apps/web/app/api/jobs/[jobId]/board-item/route.ts`

**Success Criteria**:
- ✅ Both endpoints exist and are functional
- ✅ Endpoints handle authentication correctly
- ✅ Endpoints verify job access via RLS
- ✅ Tests pass for these endpoints

---

### Agent 2.2: Verify Board → Job Sync Endpoints
**Task**: Verify and fix board-to-job sync endpoints

**Endpoints to Verify**:
- `GET /api/items/[itemId]/job` - Get linked job
- `POST /api/items/[itemId]/sync-to-job` - Manual sync

**Files to Check**:
- `apps/web/app/api/items/[itemId]/job/route.ts`
- `apps/web/app/api/items/[itemId]/sync-to-job/route.ts`

**Success Criteria**:
- ✅ Both endpoints exist and are functional
- ✅ Endpoints handle authentication correctly
- ✅ Endpoints verify board/item access via RLS
- ✅ Tests pass for these endpoints

---

## Wave 3: Estimates & Export Endpoints (1 agent)

### Agent 3.1: Fix Estimates Export Endpoint
**Task**: Verify and fix estimates export functionality

**Endpoints to Verify**:
- `GET /api/estimates/[estimateId]/export?format=xactimate`

**Files to Check**:
- `apps/web/app/api/estimates/[estimateId]/export/route.ts`

**Issues to Check**:
- RLS policy for estimates table
- Export format handling
- File generation/response

**Success Criteria**:
- ✅ Export endpoint functional
- ✅ Handles different formats correctly
- ✅ Proper authentication and authorization
- ✅ Test passes

---

## Wave 4: Test Fixes & Validation (Parallel - 2 agents)

### Agent 4.1: Fix Test Data Setup
**Task**: Improve test reliability with better data setup

**Files to Update**:
- `apps/web/e2e/field-documentation-moisture.spec.ts`
- `apps/web/e2e/integration-job-board-sync.spec.ts`
- `apps/web/e2e/full-workflow.spec.ts`

**Improvements**:
- Better error handling in beforeEach
- Retry logic for async operations
- More reliable job/chamber creation
- Better cleanup between tests

**Success Criteria**:
- ✅ Tests are more reliable
- ✅ Better error messages on failure
- ✅ Reduced flakiness

---

### Agent 4.2: Full Test Suite Validation
**Task**: Run full test suite and document results

**Actions**:
1. Apply all RLS policy migrations
2. Run full Playwright test suite
3. Document pass/fail/skip counts
4. Identify any remaining issues
5. Verify auth request reduction

**Success Criteria**:
- ✅ >95% test pass rate (323+ passing)
- ✅ Auth requests reduced by >70%
- ✅ All critical paths tested
- ✅ Documentation updated

---

## Execution Plan

### Phase 1: Preparation (5 min)
1. Review existing RLS policies in schema files
2. Identify exact gaps
3. Create migration files

### Phase 2: Wave 1 - RLS Policies (15 min)
- Deploy 3 agents in parallel
- Create all missing RLS policy migrations
- Document policies created

### Phase 3: Wave 2 - Integration Endpoints (10 min)
- Deploy 2 agents in parallel
- Verify and fix sync endpoints
- Test endpoints work

### Phase 4: Wave 3 - Estimates Export (5 min)
- Deploy 1 agent
- Fix export endpoint
- Test functionality

### Phase 5: Wave 4 - Test Fixes (15 min)
- Deploy 2 agents in parallel
- Improve test reliability
- Run full validation

### Phase 6: Final Validation (10 min)
- Apply all migrations
- Run full test suite
- Document final results
- Verify auth reduction

**Total Estimated Time**: ~60 minutes

---

## Migration Execution Order

1. `add_alerts_insert_policy.sql` ✅ (Already applied)
2. `add_moisture_points_rls.sql` (Wave 1.1)
3. `add_equipment_logs_rls.sql` (Wave 1.2)
4. Any additional RLS policies from Wave 1.3

---

## Success Metrics

### Before
- Tests: 128 passing, 212 failing, 47 skipped (340 total)
- Auth Requests: ~16,000
- Test Pass Rate: 37.6%

### Target After
- Tests: 323+ passing, <17 failing, 47 skipped (340 total)
- Auth Requests: <5,000 (70% reduction)
- Test Pass Rate: >95%

---

## Notes

- All migrations should be idempotent (use `DROP POLICY IF EXISTS`)
- RLS policies should follow existing patterns from `comprehensive_new_features_schema.sql`
- Test fixes should maintain existing test coverage
- All changes should be backward compatible

