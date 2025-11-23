# Swarm Orchestration Plan - Feature Build

## Overview
Building features from two plans:
1. **Security & Performance Hardening** (plan.plan.md)
2. **Blueprint Gap Analysis** (blueprint-gap-analysis-and-implementation-plan.plan.md)

## Wave Structure

### Wave 1: Foundation & Dependencies (Parallel)
**Goal**: Install dependencies and create shared infrastructure
**Agents**: 3 parallel agents

#### Agent 1.1: Install Security Dependencies
- Install: `zod`, `zod-to-json-schema`
- Install: `@upstash/ratelimit`, `@upstash/redis`
- Success: All packages installed, no conflicts

#### Agent 1.2: Install Performance Dependencies
- Install: `@tanstack/react-virtual`
- Install: `@tanstack/react-query`
- Install: `browser-image-compression`
- Success: All packages installed, no conflicts

#### Agent 1.3: Create Shared Documentation
- Create validation patterns doc
- Create API standards doc
- Create database schema doc
- Success: Documentation created in `/shared-docs/`

---

### Wave 2: Security Foundation (Parallel)
**Goal**: Implement security features
**Dependencies**: Wave 1 complete

#### Agent 2.1: Input Validation System
**Files to Create**:
- `apps/web/lib/validation/schemas.ts` - Zod schemas
- `apps/web/lib/validation/validator.ts` - Validation middleware
- `apps/web/lib/validation/file-upload.ts` - File validation
- `apps/web/lib/validation/common.ts` - Common patterns

**Files to Update**:
- All API routes (add validation)
- `apps/web/lib/api/middleware.ts` - Add validation helper

**Success Criteria**:
- ✅ All API endpoints validate input with Zod
- ✅ File uploads enforce size limits (10MB photos, 50MB PDFs)
- ✅ TypeScript types inferred from schemas

#### Agent 2.2: SQL Injection Audit
**Files to Create**:
- `scripts/audit-sql-queries.js` - Query audit script

**Files to Review**:
- All API route files

**Success Criteria**:
- ✅ All queries use Supabase query builder
- ✅ Audit script passes with no vulnerabilities

#### Agent 2.3: Error Handling Enhancement
**Files to Create**:
- `apps/web/lib/api/error-handler.ts` - Error sanitization
- `apps/web/lib/api/error-messages.ts` - Error message mapping

**Files to Update**:
- `apps/web/lib/api/middleware.ts` - Use sanitized errors
- All API routes

**Success Criteria**:
- ✅ All errors return generic user-friendly messages
- ✅ Detailed errors logged server-side only

#### Agent 2.4: Rate Limiting & CORS
**Files to Create**:
- `apps/web/lib/api/rate-limit.ts` - Rate limiting config

**Files to Update**:
- `apps/web/middleware.ts` - Add rate limiting & CORS

**Success Criteria**:
- ✅ Rate limiting applied to all API routes
- ✅ CORS headers configured

---

### Wave 3: Performance - Frontend (Parallel)
**Goal**: Implement frontend performance optimizations
**Dependencies**: Wave 1 complete

#### Agent 3.1: Virtual Scrolling
**Files to Create**:
- `apps/web/components/ui/VirtualTable.tsx`
- `apps/web/components/ui/VirtualList.tsx`

**Files to Update**:
- `apps/web/components/jobs/JobList.tsx` (or equivalent)

**Success Criteria**:
- ✅ Virtual scrolling works with 1000+ items
- ✅ 60fps scrolling performance

#### Agent 3.2: Cursor Pagination
**Files to Create**:
- `apps/web/lib/api/pagination.ts` - Cursor pagination utilities

**Files to Update**:
- All list API endpoints
- Frontend components using pagination

**Success Criteria**:
- ✅ All list endpoints use cursor pagination
- ✅ Consistent performance at any scale

#### Agent 3.3: React Query Caching
**Files to Create**:
- `apps/web/lib/api/react-query.ts` - React Query config
- `apps/web/lib/api/cache-headers.ts` - Cache header utilities
- `apps/web/hooks/useJobs.ts`
- `apps/web/hooks/useUsers.ts`
- `apps/web/hooks/usePolicies.ts`

**Files to Update**:
- `apps/web/app/layout.tsx` - Add QueryClientProvider
- All API routes - Add cache headers
- Frontend components - Use React Query hooks

**Success Criteria**:
- ✅ React Query implemented
- ✅ Cache headers on API responses
- ✅ Reduced database load

---

### Wave 4: Performance - Backend (Parallel)
**Goal**: Database optimization and photo upload performance
**Dependencies**: None (can run parallel to Wave 3)

#### Agent 4.1: Database Indexes & Views
**Files to Create**:
- `supabase/migrations/add_performance_indexes.sql`
- `supabase/migrations/add_materialized_views.sql`

**Success Criteria**:
- ✅ All frequently queried columns have indexes
- ✅ Materialized views for dashboard metrics
- ✅ Query performance < 100ms

#### Agent 4.2: Query Optimization
**Files to Update**:
- All API routes - Optimize N+1 queries
- Use Supabase `.select()` with joins

**Success Criteria**:
- ✅ No N+1 query patterns
- ✅ Queries use joins where appropriate

#### Agent 4.3: Photo Upload Optimization
**Files to Create**:
- `apps/web/lib/utils/image-compression.ts`
- `apps/web/lib/utils/chunked-upload.ts`

**Files to Update**:
- `apps/web/components/photos/PhotoUpload.tsx` (or equivalent)
- Photo upload API endpoint

**Success Criteria**:
- ✅ Images compressed before upload
- ✅ Large files uploaded in chunks
- ✅ Upload progress displayed

---

### Wave 5: Monday.com Foundation - Database (Sequential)
**Goal**: Create work management database schema
**Dependencies**: None (can start early)

#### Agent 5.1: Work Management Schema
**Files to Create**:
- `supabase/migrations/add_work_management_tables.sql`

**Tables to Create**:
- `workspaces` / `accounts` (multi-tenant)
- `boards` (work management tables)
- `groups` (color-coded sections)
- `items` (rows/records)
- `subitems` (nested rows)
- `columns` (field definitions)
- `column_values` (item field values)
- `views` (view configurations)
- `dashboards` (aggregate metrics)
- `automation_rules` (trigger/condition/action)

**Success Criteria**:
- ✅ All tables created with proper indexes
- ✅ RLS policies configured
- ✅ Foreign keys established

#### Agent 5.2: Preconfigured Boards Seed
**Files to Create**:
- `supabase/migrations/seed_preconfigured_boards.sql`

**Boards to Create**:
1. Sales/Leads Board
2. Estimate/Submissions Board
3. BDM/Accounts Board
4. Field Board
5. Mitigation AR Board
6. Shop/Equipment Rotation Board
7. Commission Boards
8. Current/Active Jobs Board

**Success Criteria**:
- ✅ All 8 boards created with standard columns
- ✅ Seed data inserted

---

### Wave 6: Monday.com Foundation - API (Parallel)
**Goal**: Create API endpoints for work management
**Dependencies**: Wave 5 complete

#### Agent 6.1: Board API
**Files to Create**:
- `apps/web/app/api/boards/route.ts` - List/create boards
- `apps/web/app/api/boards/[boardId]/route.ts` - Get/update/delete board

**Success Criteria**:
- ✅ Board CRUD operations working
- ✅ Validation applied

#### Agent 6.2: Item API
**Files to Create**:
- `apps/web/app/api/items/route.ts` - List/create items
- `apps/web/app/api/items/[itemId]/route.ts` - Get/update/delete item

**Success Criteria**:
- ✅ Item CRUD operations working
- ✅ Column values handled

#### Agent 6.3: Column & View API
**Files to Create**:
- `apps/web/app/api/columns/route.ts` - Column management
- `apps/web/app/api/views/route.ts` - View management

**Success Criteria**:
- ✅ Column CRUD working
- ✅ View CRUD working

---

### Wave 7: Monday.com Foundation - UI (Parallel)
**Goal**: Create UI components for work management
**Dependencies**: Wave 6 complete

#### Agent 7.1: Board Components
**Files to Create**:
- `apps/web/components/boards/BoardList.tsx`
- `apps/web/components/boards/BoardView.tsx`
- `apps/web/components/boards/BoardNavigation.tsx`

**Success Criteria**:
- ✅ Board list displays
- ✅ Board view works
- ✅ Navigation functional

#### Agent 7.2: Table View Component
**Files to Create**:
- `apps/web/components/views/TableView.tsx`

**Success Criteria**:
- ✅ Table view renders items
- ✅ Inline editing works
- ✅ Sorting/filtering works

#### Agent 7.3: Kanban View Component
**Files to Create**:
- `apps/web/components/views/KanbanView.tsx`

**Success Criteria**:
- ✅ Kanban view renders items
- ✅ Drag-and-drop works
- ✅ Grouped by status column

---

### Wave 8: Automation Engine (Sequential)
**Goal**: Build automation rule engine
**Dependencies**: Wave 6 complete

#### Agent 8.1: Automation Database & API
**Files to Create**:
- `apps/web/app/api/automations/route.ts` - Automation CRUD
- `apps/web/lib/automation/trigger.ts` - Trigger system
- `apps/web/lib/automation/condition.ts` - Condition evaluator
- `apps/web/lib/automation/action.ts` - Action executor

**Success Criteria**:
- ✅ Automation rules can be created
- ✅ Triggers fire correctly
- ✅ Conditions evaluate correctly
- ✅ Actions execute correctly

#### Agent 8.2: Automation Templates
**Files to Create**:
- `apps/web/lib/automation/templates.ts` - Common templates

**Templates**:
- Sales → Job creation
- Job → Estimate creation
- Estimate → AR creation
- AR → Commission updates

**Success Criteria**:
- ✅ All templates work
- ✅ Automations trigger correctly

---

### Wave 9: Encircle Hydro System (Parallel)
**Goal**: Implement Encircle-style field documentation
**Dependencies**: None (can start early)

#### Agent 9.1: Hydro Database Schema
**Files to Create**:
- `supabase/migrations/add_hydro_tables.sql`

**Tables**:
- `chambers` (drying chambers)
- `psychrometric_readings` (temp, RH, GPP)
- `moisture_points` (X/Y, material, reading)
- `moisture_maps` (floor plan overlays)
- `drying_logs` (time-series readings)
- `equipment_logs` (detailed equipment tracking)
- `rooms` (room definitions)
- `floor_plans` (structure plans)

**Success Criteria**:
- ✅ All tables created
- ✅ RLS policies configured

#### Agent 9.2: Hydro API
**Files to Create**:
- `apps/web/app/api/hydro/chambers/route.ts`
- `apps/web/app/api/hydro/psychrometrics/route.ts`
- `apps/web/app/api/hydro/moisture/route.ts`
- `apps/web/app/api/hydro/equipment/route.ts`

**Success Criteria**:
- ✅ All CRUD operations working
- ✅ Validation applied

#### Agent 9.3: Hydro UI Components
**Files to Create**:
- `apps/web/components/hydro/ChamberSetup.tsx`
- `apps/web/components/hydro/PsychrometricCapture.tsx`
- `apps/web/components/hydro/MoistureMap.tsx`
- `apps/web/components/hydro/EquipmentLog.tsx`

**Files to Update**:
- `apps/web/app/field/gates/[id]/page.tsx` - Integrate hydro UI

**Success Criteria**:
- ✅ Hydro system functional in field app
- ✅ Data capture working

---

### Wave 10: Report Builder (Sequential)
**Goal**: PDF report generation
**Dependencies**: Wave 9 complete

#### Agent 10.1: Report Templates & API
**Files to Create**:
- `apps/web/lib/reports/templates.ts` - Report templates
- `apps/web/app/api/reports/generate/route.ts` - Generate endpoint

**Dependencies to Install**:
- PDF generation library (PDFKit or similar)

**Success Criteria**:
- ✅ Report templates defined
- ✅ API endpoint generates reports

#### Agent 10.2: PDF Generation
**Files to Create**:
- `apps/web/lib/reports/pdf-generator.ts` - PDF generation logic

**Success Criteria**:
- ✅ PDFs generated with all sections
- ✅ Photos included
- ✅ Tables formatted correctly

#### Agent 10.3: Report Builder UI
**Files to Create**:
- `apps/web/components/reports/ReportBuilder.tsx`
- `apps/web/components/reports/ReportPreview.tsx`

**Success Criteria**:
- ✅ Report builder UI functional
- ✅ Preview works
- ✅ Export works

---

### Wave 11: Integration & Polish (Sequential)
**Goal**: Connect boards to documentation, polish UX
**Dependencies**: Waves 5-10 complete

#### Agent 11.1: Board-Documentation Integration
**Files to Create**:
- `apps/web/lib/integration/board-sync.ts` - Sync logic

**Files to Update**:
- Job creation endpoints - Create board items
- Board item updates - Sync to documentation

**Success Criteria**:
- ✅ Jobs from boards create documentation records
- ✅ Documentation data populates board columns
- ✅ Bidirectional sync working

#### Agent 11.2: UX Polish
**Files to Create**:
- `apps/web/components/views/CalendarView.tsx`
- `apps/web/components/views/TimelineView.tsx`
- `apps/web/components/dashboards/DashboardWidget.tsx`

**Success Criteria**:
- ✅ Calendar view works
- ✅ Timeline view works
- ✅ Dashboard widgets functional

---

## Success Metrics

### Security
- ✅ 100% of endpoints validate input with Zod
- ✅ File uploads limited to 10MB (photos) / 50MB (PDFs)
- ✅ Rate limiting: 100 req/min (API), 10 req/min (uploads)
- ✅ Zero SQL injection vulnerabilities
- ✅ Zero error information leakage

### Performance
- ✅ Virtual scrolling: 60fps with 1000+ items
- ✅ Initial load: < 500ms for 1000 items
- ✅ Cursor pagination: Consistent performance at any scale
- ✅ Database queries: < 100ms for common queries
- ✅ Photo uploads: < 30s for 10MB compressed images
- ✅ Cache hit rate: > 70% for frequently accessed data

### Monday.com Layer
- ✅ 8 boards functional
- ✅ 4+ view types (Table, Kanban, Calendar, Timeline)
- ✅ Automation engine working

### Encircle Layer
- ✅ Hydro system complete
- ✅ Report builder functional
- ✅ Equipment tracking detailed

### Integration
- ✅ Board-to-documentation sync working
- ✅ Automations triggering correctly

---

## Coordination Notes

- **Shared State**: All agents should update this file with progress
- **Conflicts**: If two agents need same file, coordinate via comments
- **Testing**: Each agent should test their changes before marking complete
- **Documentation**: Update shared docs as you create new patterns

---

## Current Status

- [ ] Wave 1: Foundation & Dependencies
- [ ] Wave 2: Security Foundation
- [ ] Wave 3: Performance - Frontend
- [ ] Wave 4: Performance - Backend
- [ ] Wave 5: Monday.com Foundation - Database
- [ ] Wave 6: Monday.com Foundation - API
- [ ] Wave 7: Monday.com Foundation - UI
- [ ] Wave 8: Automation Engine
- [ ] Wave 9: Encircle Hydro System
- [ ] Wave 10: Report Builder
- [ ] Wave 11: Integration & Polish

