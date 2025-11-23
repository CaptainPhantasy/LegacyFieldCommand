# Testing Swarm Orchestration - New Features Coverage

## Goal
Create comprehensive tests for all newly implemented features to ensure production readiness.

## Current Test Coverage

### ✅ Existing Tests (12 E2E test files)
- Job creation and assignment
- Gate completion workflows
- Validation rules
- Error scenarios
- Admin APIs
- Policy/Communications/Estimates endpoints

### ❌ Missing Tests (New Features)
- Work Management APIs (boards, items, columns, groups, subitems, dashboards)
- Field Documentation APIs (chambers, psychrometrics, moisture, equipment, floor plans, rooms, boxes, content items)
- Integration Layer (Job ↔ Board sync)
- Automation Engine
- Report Generation

---

## Wave 1: Work Management API Tests (Parallel)

### Agent 1.1: Boards & Groups API Tests
**Task**: Create E2E tests for boards and groups APIs

**Files to Create**:
- `e2e/work-management-boards.spec.ts` - Boards CRUD tests
- `e2e/work-management-groups.spec.ts` - Groups CRUD tests

**Test Cases**:
- Create board with different types
- List and filter boards
- Update board
- Delete board
- Create groups within board
- Reorder groups
- Delete groups

**Success Criteria**:
- ✅ All board operations tested
- ✅ All group operations tested
- ✅ Error scenarios covered
- ✅ Access control verified

---

### Agent 1.2: Items & Columns API Tests
**Task**: Create E2E tests for items and columns APIs

**Files to Create**:
- `e2e/work-management-items.spec.ts` - Items CRUD tests
- `e2e/work-management-columns.spec.ts` - Columns CRUD tests

**Test Cases**:
- Create item with column values
- Update item column values
- Delete item
- Create columns of all 14 types
- Update column settings
- Delete column
- Inline editing in table view

**Success Criteria**:
- ✅ All item operations tested
- ✅ All column operations tested
- ✅ All column types tested
- ✅ Column value updates tested

---

### Agent 1.3: Subitems & Dashboards API Tests
**Task**: Create E2E tests for subitems and dashboards APIs

**Files to Create**:
- `e2e/work-management-subitems.spec.ts` - Subitems CRUD tests
- `e2e/work-management-dashboards.spec.ts` - Dashboards CRUD tests

**Test Cases**:
- Create subitem
- Toggle subitem completion
- Delete subitem
- Create dashboard
- Update dashboard widgets
- Delete dashboard

**Success Criteria**:
- ✅ All subitem operations tested
- ✅ All dashboard operations tested
- ✅ Completion toggling tested

---

## Wave 2: Field Documentation API Tests (Parallel)

### Agent 2.1: Chambers & Psychrometrics API Tests
**Task**: Create E2E tests for chambers and psychrometric readings APIs

**Files to Create**:
- `e2e/field-documentation-chambers.spec.ts` - Chambers CRUD tests
- `e2e/field-documentation-psychrometrics.spec.ts` - Psychrometric readings tests

**Test Cases**:
- Create chamber
- List chambers for job
- Update chamber
- Delete chamber
- Create psychrometric reading
- List readings for chamber
- Update reading
- Delete reading

**Success Criteria**:
- ✅ All chamber operations tested
- ✅ All psychrometric operations tested
- ✅ Chamber-room relationships tested

---

### Agent 2.2: Moisture & Equipment API Tests
**Task**: Create E2E tests for moisture points and equipment logs APIs

**Files to Create**:
- `e2e/field-documentation-moisture.spec.ts` - Moisture points tests
- `e2e/field-documentation-equipment.spec.ts` - Equipment logs tests

**Test Cases**:
- Create moisture point
- List moisture points for chamber
- Update moisture point
- Delete moisture point
- Create equipment log
- List equipment for job
- Update equipment status
- Delete equipment log

**Success Criteria**:
- ✅ All moisture operations tested
- ✅ All equipment operations tested
- ✅ Coordinate-based moisture points tested

---

### Agent 2.3: Floor Plans, Rooms, Boxes, Content API Tests
**Task**: Create E2E tests for floor plans, rooms, boxes, and content items APIs

**Files to Create**:
- `e2e/field-documentation-floorplans.spec.ts` - Floor plans tests
- `e2e/field-documentation-rooms.spec.ts` - Rooms tests
- `e2e/field-documentation-boxes.spec.ts` - Boxes tests
- `e2e/field-documentation-content.spec.ts` - Content items tests

**Test Cases**:
- Create floor plan
- Upload floor plan image
- Create room
- Link room to floor plan
- Create box
- Add content items to box
- Update box status
- Delete box and contents

**Success Criteria**:
- ✅ All floor plan operations tested
- ✅ All room operations tested
- ✅ All box operations tested
- ✅ All content item operations tested

---

## Wave 3: Integration & Automation Tests (Sequential)

### Agent 3.1: Integration Layer Tests
**Task**: Create E2E tests for Job ↔ Board integration

**Files to Create**:
- `e2e/integration-job-board-sync.spec.ts` - Integration sync tests

**Test Cases**:
- Job creation → Board item creation (automatic)
- Job update → Board item update (automatic)
- Board item update → Job update (automatic)
- Manual sync job → board
- Manual sync board → job
- Get linked board item
- Get linked job
- Conflict resolution
- Circular update prevention

**Success Criteria**:
- ✅ Automatic sync tested
- ✅ Manual sync tested
- ✅ Linked entities tested
- ✅ Conflict resolution tested
- ✅ No circular updates

---

### Agent 3.2: Automation Engine Tests
**Task**: Create E2E tests for automation engine

**Files to Create**:
- `e2e/automation-engine.spec.ts` - Automation tests

**Test Cases**:
- Create automation rule
- Trigger fires on item creation
- Trigger fires on item update
- Trigger fires on column change
- Conditions evaluate correctly (AND/OR)
- Actions execute correctly
- Multiple actions execute
- Automation templates work
- Execution logging works

**Success Criteria**:
- ✅ All trigger types tested
- ✅ All condition operators tested
- ✅ All action types tested
- ✅ Automation templates tested
- ✅ Execution logging verified

---

### Agent 3.3: Report Generation Tests
**Task**: Create E2E tests for report generation

**Files to Create**:
- `e2e/report-generation.spec.ts` - Report generation tests

**Test Cases**:
- Generate initial report
- Generate hydro report
- Generate full report
- Generate custom report
- List reports for job
- Download report PDF
- Report template management
- Report with all data sections

**Success Criteria**:
- ✅ All report types tested
- ✅ PDF generation tested
- ✅ Report download tested
- ✅ Template system tested

---

## Wave 4: UI Component Tests (Parallel)

### Agent 4.1: Board UI Tests
**Task**: Create E2E tests for board UI components

**Files to Create**:
- `e2e/ui-boards.spec.ts` - Board UI tests

**Test Cases**:
- Board list page loads
- Filter boards by type
- Create board modal works
- Navigate to board detail
- Table view displays items
- Inline editing works
- Add new item works

**Success Criteria**:
- ✅ Board list UI tested
- ✅ Board detail UI tested
- ✅ Table view tested
- ✅ Inline editing tested

---

### Agent 4.2: Hydro UI Tests
**Task**: Create E2E tests for hydro UI components

**Files to Create**:
- `e2e/ui-hydro.spec.ts` - Hydro UI tests

**Test Cases**:
- Chamber setup component works
- Create chamber from UI
- Psychrometric capture works
- Add psychrometric reading
- View recent readings
- Integration in Moisture/Equipment gate

**Success Criteria**:
- ✅ Chamber setup tested
- ✅ Psychrometric capture tested
- ✅ Gate integration tested

---

### Agent 4.3: Integration UI Tests
**Task**: Create E2E tests for integration UI components

**Files to Create**:
- `e2e/ui-integration.spec.ts` - Integration UI tests

**Test Cases**:
- Job detail shows board link
- Board item shows job link
- Manual sync button works
- Sync status updates
- Navigation between entities

**Success Criteria**:
- ✅ Job board link tested
- ✅ Board job link tested
- ✅ Manual sync tested
- ✅ Navigation tested

---

## Success Criteria

### Overall
- ✅ All new APIs have E2E tests
- ✅ All UI components have E2E tests
- ✅ Integration layer fully tested
- ✅ Automation engine fully tested
- ✅ Report generation fully tested
- ✅ Error scenarios covered
- ✅ Access control verified
- ✅ Test coverage > 80%

---

## Estimated Effort

- **Wave 1**: 3-4 hours (parallel execution)
- **Wave 2**: 3-4 hours (parallel execution)
- **Wave 3**: 2-3 hours (sequential)
- **Wave 4**: 2-3 hours (parallel execution)
- **Total**: 10-14 hours

---

## Coordination

### Test Helpers
- Extend existing helpers in `e2e/helpers/`
- Add new helpers for boards, items, chambers, etc.
- Reuse authentication helpers

### Test Data
- Use test users (admin, tech)
- Create test jobs for field documentation tests
- Create test boards for work management tests
- Clean up test data after tests

### Patterns
- Follow existing test patterns
- Use Playwright best practices
- Include error scenarios
- Test access control

