# Swarm Next Phase - Critical Features

## Chain of Thought Analysis

### Current State
✅ **Completed:**
- Security & Performance foundation (validation, error handling, rate limiting, virtual scrolling, React Query)
- Monday.com Work Management API (boards, items, columns, views) - 20+ endpoints
- Encircle Hydro/Drying System API (chambers, psychrometric readings, moisture points, equipment logs) - 8+ endpoints

### Critical Gaps
❌ **Missing:**
1. **UI Components** - Users cannot interact with the APIs without UI
2. **Automation Engine** - Core workflow feature from blueprint
3. **Report Generation** - Critical for field documentation
4. **Integration Layer** - Connect boards to documentation

### Priority Analysis

**Highest Priority: UI Components**
- Users cannot use the system without UI
- Blocks all user workflows
- Must be built first

**High Priority: Automation Engine**
- Core feature from blueprint
- Enables workflow automation
- Can be built in parallel with UI

**High Priority: Report Generation**
- Critical for field documentation
- Required for professional deliverables
- Can be built in parallel with UI

**Medium Priority: Integration**
- Connects boards to documentation
- Depends on UI being complete
- Can be built after UI

### Dependency Graph

```
UI Components (Wave 1)
├── Board List/View (Agent 1.1)
├── Table View (Agent 1.2)
├── Kanban View (Agent 1.3)
└── Hydro UI Components (Agent 1.4)

Automation Engine (Wave 2) - Parallel
├── Trigger System (Agent 2.1)
├── Condition Evaluator (Agent 2.2)
└── Action Executor (Agent 2.3)

Report Generation (Wave 2) - Parallel
├── Report API (Agent 2.4)
├── PDF Generator (Agent 2.5)
└── Report Builder UI (Agent 2.6)

Integration (Wave 3) - After UI
└── Board-Documentation Sync (Agent 3.1)
```

---

## Wave 1: UI Components (Parallel Execution)

### Agent 1.1: Board List & Navigation
**Goal**: Create board list page and navigation
**Files to Create**:
- `apps/web/app/boards/page.tsx` - Board list page
- `apps/web/components/boards/BoardList.tsx` - Board list component
- `apps/web/components/boards/BoardCard.tsx` - Board card component
- `apps/web/hooks/useBoards.ts` - React Query hooks for boards

**Success Criteria**:
- ✅ Board list displays all boards
- ✅ Filtering by board_type works
- ✅ Clicking board navigates to board view
- ✅ Create board button works

### Agent 1.2: Board View & Table View
**Goal**: Create board detail page with table view
**Files to Create**:
- `apps/web/app/boards/[boardId]/page.tsx` - Board detail page
- `apps/web/components/boards/BoardView.tsx` - Board view container
- `apps/web/components/views/TableView.tsx` - Table view component
- `apps/web/components/views/TableCell.tsx` - Editable table cell
- `apps/web/hooks/useBoard.ts` - React Query hooks for single board
- `apps/web/hooks/useItems.ts` - React Query hooks for items

**Success Criteria**:
- ✅ Board view displays items in table format
- ✅ Columns are displayed as table headers
- ✅ Inline editing of column values works
- ✅ Adding new items works
- ✅ Sorting and filtering work

### Agent 1.3: Kanban View
**Goal**: Create Kanban view with drag-and-drop
**Files to Create**:
- `apps/web/components/views/KanbanView.tsx` - Kanban view component
- `apps/web/components/views/KanbanColumn.tsx` - Kanban column component
- `apps/web/components/views/KanbanCard.tsx` - Kanban card component
- `apps/web/lib/dnd.ts` - Drag-and-drop utilities

**Dependencies to Install**:
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

**Success Criteria**:
- ✅ Kanban view displays items grouped by status column
- ✅ Drag-and-drop between groups works
- ✅ Items update position and group_id on drop
- ✅ Visual feedback during drag

### Agent 1.4: Hydro UI Components
**Goal**: Create UI for hydro/drying system in field app
**Files to Create**:
- `apps/web/components/hydro/ChamberSetup.tsx` - Chamber setup component
- `apps/web/components/hydro/PsychrometricCapture.tsx` - Reading capture form
- `apps/web/components/hydro/MoistureMap.tsx` - Moisture map visualization
- `apps/web/components/hydro/EquipmentLog.tsx` - Equipment logging form
- `apps/web/app/field/jobs/[jobId]/hydro/page.tsx` - Hydro system page
- `apps/web/hooks/useHydro.ts` - React Query hooks for hydro system

**Files to Update**:
- `apps/web/app/field/jobs/[jobId]/page.tsx` - Add hydro system link

**Success Criteria**:
- ✅ Chamber setup form works
- ✅ Psychrometric readings can be captured
- ✅ Moisture points can be added to floor plans
- ✅ Equipment logs can be created
- ✅ All data displays correctly

---

## Wave 2: Automation & Reports (Parallel Execution)

### Agent 2.1: Automation Trigger System
**Goal**: Build trigger detection system
**Files to Create**:
- `apps/web/lib/automation/trigger.ts` - Trigger detection
- `apps/web/lib/automation/triggers/item-created.ts`
- `apps/web/lib/automation/triggers/item-updated.ts`
- `apps/web/lib/automation/triggers/column-changed.ts`
- `apps/web/lib/automation/triggers/date-reached.ts`

**Files to Update**:
- All item/column update endpoints - Add trigger detection

**Success Criteria**:
- ✅ Triggers fire on item creation
- ✅ Triggers fire on item updates
- ✅ Triggers fire on column value changes
- ✅ Triggers fire on date conditions

### Agent 2.2: Automation Condition Evaluator
**Goal**: Build condition evaluation system
**Files to Create**:
- `apps/web/lib/automation/condition.ts` - Condition evaluator
- `apps/web/lib/automation/conditions/equals.ts`
- `apps/web/lib/automation/conditions/contains.ts`
- `apps/web/lib/automation/conditions/greater-than.ts`
- `apps/web/lib/automation/conditions/date-range.ts`

**Success Criteria**:
- ✅ Conditions evaluate correctly
- ✅ Multiple conditions with AND/OR logic work
- ✅ Complex conditions work

### Agent 2.3: Automation Action Executor
**Goal**: Build action execution system
**Files to Create**:
- `apps/web/lib/automation/action.ts` - Action executor
- `apps/web/lib/automation/actions/update-column.ts`
- `apps/web/lib/automation/actions/move-to-group.ts`
- `apps/web/lib/automation/actions/create-item.ts`
- `apps/web/lib/automation/actions/send-notification.ts`
- `apps/web/lib/automation/actions/change-status.ts`

**Files to Create**:
- `apps/web/app/api/automations/execute/route.ts` - Automation execution endpoint

**Success Criteria**:
- ✅ All action types execute correctly
- ✅ Actions update database correctly
- ✅ Error handling works
- ✅ Action logging works

### Agent 2.4: Report Generation API
**Goal**: Create report generation endpoints
**Files to Create**:
- `apps/web/app/api/reports/generate/route.ts` - Generate report endpoint
- `apps/web/app/api/reports/templates/route.ts` - Template management
- `apps/web/lib/reports/templates.ts` - Report templates

**Success Criteria**:
- ✅ Report generation endpoint works
- ✅ Templates are configurable
- ✅ Report data is correctly formatted

### Agent 2.5: PDF Generator
**Goal**: Implement PDF generation
**Files to Create**:
- `apps/web/lib/reports/pdf-generator.ts` - PDF generation logic
- `apps/web/lib/reports/sections/initial-report.ts`
- `apps/web/lib/reports/sections/hydro-report.ts`
- `apps/web/lib/reports/sections/full-report.ts`

**Dependencies to Install**:
- `pdfkit` or `@react-pdf/renderer`

**Success Criteria**:
- ✅ PDFs generate with all sections
- ✅ Photos are included
- ✅ Tables are formatted correctly
- ✅ Reports are saved to storage

### Agent 2.6: Report Builder UI
**Goal**: Create report builder interface
**Files to Create**:
- `apps/web/components/reports/ReportBuilder.tsx` - Report builder
- `apps/web/components/reports/ReportPreview.tsx` - Report preview
- `apps/web/app/jobs/[jobId]/reports/page.tsx` - Reports page

**Success Criteria**:
- ✅ Report builder UI works
- ✅ Preview displays correctly
- ✅ Export to PDF works
- ✅ Report configuration is saved

---

## Wave 3: Integration & Polish

### Agent 3.1: Board-Documentation Integration
**Goal**: Connect boards to documentation
**Files to Create**:
- `apps/web/lib/integration/board-sync.ts` - Sync logic
- `apps/web/lib/integration/job-to-board.ts` - Job to board sync
- `apps/web/lib/integration/board-to-job.ts` - Board to job sync

**Files to Update**:
- Job creation endpoints - Create board items
- Board item update endpoints - Sync to jobs

**Success Criteria**:
- ✅ Jobs create board items automatically
- ✅ Board item updates sync to jobs
- ✅ Bidirectional sync works
- ✅ No data loss

---

## Execution Plan

### Phase 1: UI Components (Week 1)
- Deploy Agents 1.1, 1.2, 1.3, 1.4 in parallel
- All agents work independently
- Coordinate via shared documentation

### Phase 2: Automation & Reports (Week 2)
- Deploy Agents 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 in parallel
- Automation agents depend on each other (sequential within automation)
- Report agents are independent

### Phase 3: Integration (Week 3)
- Deploy Agent 3.1
- Depends on UI being complete

---

## Success Metrics

### UI Components
- ✅ All board views functional
- ✅ Inline editing works
- ✅ Drag-and-drop works
- ✅ Hydro system fully functional

### Automation
- ✅ All trigger types work
- ✅ All condition types work
- ✅ All action types work
- ✅ Automation templates work

### Reports
- ✅ PDFs generate correctly
- ✅ All sections included
- ✅ Photos included
- ✅ Export works

### Integration
- ✅ Bidirectional sync works
- ✅ No data loss
- ✅ Performance acceptable

