# Swarm Orchestration - Integration Layer

## Goal
Build integration layer to connect Jobs ↔ Boards with bidirectional sync, coordinating with other agent on API endpoints.

---

## Wave 1: Foundation (Parallel Execution)

### Agent 1.1: Sync Service Builder
**Task**: Build core sync service for Job ↔ Board bidirectional sync

**Files to Create**:
- `apps/web/lib/integration/sync-service.ts` - Core sync logic
- `apps/web/lib/integration/field-mapper.ts` - Field mapping utilities
- `apps/web/lib/integration/conflict-resolver.ts` - Conflict resolution

**Success Criteria**:
- ✅ `syncJobToBoard()` function implemented
- ✅ `syncBoardToJob()` function implemented
- ✅ Field mapping (job fields ↔ board columns)
- ✅ Conflict prevention (sync state tracking)
- ✅ Error handling and logging

**Dependencies**: None (uses existing automation engine)

---

### Agent 1.2: Automation Rules Creator
**Task**: Create automation rules for automatic sync

**Files to Create**:
- `apps/web/lib/integration/automation-rules.ts` - Auto-sync rules
- Integration with existing automation engine

**Success Criteria**:
- ✅ Auto-create board item when job created
- ✅ Auto-update board item when job updated
- ✅ Auto-update job when board item updated
- ✅ Rules use existing automation engine
- ✅ No circular update loops

**Dependencies**: Agent 1.1 (sync service)

---

### Agent 1.3: UI Components Builder
**Task**: Build UI components for integration visibility

**Files to Create**:
- `apps/web/components/integration/JobBoardLink.tsx` - Job → Board link component
- `apps/web/components/integration/BoardJobLink.tsx` - Board → Job link component
- `apps/web/components/integration/SyncButton.tsx` - Manual sync button
- `apps/web/components/integration/SyncStatus.tsx` - Sync status indicator

**Files to Update**:
- `apps/web/app/field/jobs/[id]/page.tsx` - Add board link
- `apps/web/app/boards/[boardId]/page.tsx` - Add job link

**Success Criteria**:
- ✅ Job detail page shows linked board item
- ✅ Board item shows linked job
- ✅ Manual sync buttons functional
- ✅ Sync status indicators visible
- ✅ Navigation between job and board item works

**Dependencies**: None (can build in parallel)

---

## Wave 2: Integration & Testing (Sequential)

### Agent 2.1: API Integration Tester
**Task**: Test integration with API endpoints (from other agent)

**Files to Create**:
- `apps/web/lib/integration/api-client.ts` - API client for sync endpoints
- Integration tests for API endpoints

**Success Criteria**:
- ✅ Sync endpoints work correctly
- ✅ Linked entity endpoints work
- ✅ Error handling works
- ✅ API validation works

**Dependencies**: Other agent's API endpoints complete

---

### Agent 2.2: End-to-End Workflow Tester
**Task**: Test complete integration workflow

**Files to Create**:
- `apps/web/e2e/integration-workflow.spec.ts` - E2E tests
- Test scenarios for full workflow

**Success Criteria**:
- ✅ Job creation → Board item creation works
- ✅ Job update → Board item update works
- ✅ Board item update → Job update works
- ✅ Manual sync works
- ✅ Conflict resolution works
- ✅ Error scenarios handled

**Dependencies**: Agent 2.1 complete

---

### Agent 2.3: Documentation & Examples
**Task**: Create comprehensive documentation

**Files to Create**:
- `shared-docs/integration-guide.md` - Complete integration guide
- `shared-docs/integration-examples.md` - Code examples
- Update API documentation with integration endpoints

**Success Criteria**:
- ✅ Integration guide complete
- ✅ Code examples provided
- ✅ API documentation updated
- ✅ Troubleshooting guide included

**Dependencies**: All agents complete

---

## Shared Documentation

### API Contract (For Other Agent)
**File**: `shared-docs/integration-api-contract.md`

**Required Endpoints**:
1. `POST /api/jobs/[jobId]/sync-to-board` - Sync job to board
2. `POST /api/items/[itemId]/sync-to-job` - Sync board item to job
3. `GET /api/jobs/[jobId]/board-item` - Get linked board item
4. `GET /api/items/[itemId]/job` - Get linked job

**Request/Response Formats**: Documented in contract

---

## Coordination Strategy

### With Other Agent
1. **Shared Documentation**: API contracts in `shared-docs/`
2. **Clear Interfaces**: Well-defined function signatures
3. **Parallel Development**: This agent builds logic, other builds APIs
4. **Integration Testing**: Test together once both complete

### Communication
- Update `shared-docs/swarm-integration-progress.md` after each agent completes
- Document any API changes or requirements
- Share test results and issues

---

## Success Metrics

### Technical
- ✅ All sync functions work correctly
- ✅ No circular update loops
- ✅ Conflict resolution works
- ✅ Error handling comprehensive
- ✅ Performance acceptable (< 500ms per sync)

### User Experience
- ✅ Automatic sync works seamlessly
- ✅ Manual sync available when needed
- ✅ Linked entities visible in UI
- ✅ Clear sync status indicators
- ✅ Navigation between entities works

### Quality
- ✅ All tests passing
- ✅ No linting errors
- ✅ Documentation complete
- ✅ Code follows existing patterns

---

## Timeline Estimate

- **Wave 1**: 2-3 hours (parallel execution)
- **Wave 2**: 1-2 hours (sequential, depends on other agent)
- **Total**: 3-5 hours

---

## Risk Mitigation

1. **API Coordination**: Clear contracts, shared documentation
2. **Circular Updates**: Sync state tracking, debouncing
3. **Data Conflicts**: Last-write-wins, manual resolution option
4. **Performance**: Batch operations, optimize queries
5. **Testing**: Comprehensive test coverage

