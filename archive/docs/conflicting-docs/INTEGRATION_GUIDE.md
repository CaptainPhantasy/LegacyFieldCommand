# Integration Guide: New Features with Existing Platform

## Overview

This document explains how the new **Monday.com-style Work Management** and **Encircle-style Field Documentation** features integrate with the existing Legacy Field Command platform.

---

## 🏗️ Architecture Overview

### Current Platform Structure
```
┌─────────────────────────────────────────────────┐
│           EXISTING CORE SYSTEM                 │
├─────────────────────────────────────────────────┤
│ • Jobs (job_status, lead_tech_id, etc.)         │
│ • Job Gates (7-stage workflow)                  │
│ • Job Photos (evidence/documentation)           │
│ • Profiles (user roles)                         │
│ • Accounts (multi-tenant)                       │
│ • Policies (insurance)                          │
│ • Estimates (line items)                        │
└─────────────────────────────────────────────────┘
```

### New Features Being Added
```
┌─────────────────────────────────────────────────┐
│      NEW WORK MANAGEMENT LAYER                   │
├─────────────────────────────────────────────────┤
│ • Boards (8 preconfigured types)               │
│ • Items, Groups, Columns, Views                 │
│ • Automation Rules                             │
│ • Dashboards                                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│      NEW FIELD DOCUMENTATION LAYER              │
├─────────────────────────────────────────────────┤
│ • Chambers (drying management)                  │
│ • Rooms, Floor Plans                            │
│ • Psychrometric Readings                        │
│ • Moisture Points & Maps                        │
│ • Equipment Logs                                │
│ • Content Inventory (boxes, items)               │
│ • Reports                                       │
└─────────────────────────────────────────────────┘
```

---

## 🔗 Integration Points

### 1. **Jobs ↔ Boards Integration**

#### Connection Strategy
- **Jobs** remain the primary entity for field operations
- **Boards** provide work management capabilities that can track jobs and related entities
- Each job can optionally have a linked board item for enhanced tracking

#### Data Flow
```
┌─────────────┐
│   Job       │───creates───►┌──────────────┐
│ (Core)      │              │ Board Item   │
│             │              │ (Tracking)   │
└─────────────┘              └──────────────┘
     │                              │
     │                              │
     └───────────► Updates sync bidirectionally
```

#### Implementation Pattern
```sql
-- Link job to board item via column_value
-- In "Active Jobs" board, create item with:
-- - Name: job.title
-- - Status column: job.status
-- - Assigned column: job.lead_tech_id (people column)
-- - Job ID column: job.id (link column)
```

#### Use Cases
1. **Active Jobs Board**: Track all jobs with status, assignments, dates
2. **Sales Leads Board**: Track leads before they become jobs
3. **Estimates Board**: Track estimate status, approval workflow
4. **BDM Accounts Board**: Manage business development accounts
5. **Commissions Board**: Track commission calculations per job

---

### 2. **Gates ↔ Field Documentation Integration**

#### Connection Strategy
- **Job Gates** (7-stage workflow) remain the primary field workflow
- **Field Documentation** (chambers, moisture, equipment) enhances specific gates
- Field documentation data is captured during gate completion

#### Integration During Gate Workflow

```
ARRIVAL GATE
    └─► Creates initial floor_plan (if needed)
    └─► Sets up job context

INTAKE GATE
    └─► Captures customer info
    └─► Links to board item (if tracking in board)

PHOTOS GATE
    └─► job_photos table (existing)
    └─► Can link photos to moisture_points
    └─► Can link photos to content_items

MOISTURE/EQUIPMENT GATE ⭐ PRIMARY INTEGRATION POINT
    ├─► Creates chambers (if not exists)
    ├─► Creates rooms (from photos metadata)
    ├─► Records psychrometric_readings
    ├─► Records moisture_points
    ├─► Records equipment_logs
    └─► Links to floor_plans

SCOPE GATE
    ├─► Uses moisture_points data for damage assessment
    ├─► Uses equipment_logs for justification
    ├─► Links to estimate_line_items (future)
    └─► Updates board item status

SIGN-OFFS GATE
    └─► Generates initial report (if configured)

DEPARTURE GATE
    ├─► Finalizes equipment_logs (end_date)
    ├─► Updates chamber status
    └─► Marks board item as "Visit Complete"
```

#### Data Relationships
```sql
-- Example: Moisture/Equipment Gate creates:
chamber (job_id) 
  └─► chamber_rooms (room_id from job_photos.metadata)
  └─► psychrometric_readings (chamber_id)
  └─► moisture_points (chamber_id, room_id, photo_id)
  └─► equipment_logs (chamber_id, job_id)
```

---

### 3. **Photos ↔ Field Documentation Integration**

#### Connection Strategy
- **job_photos** table remains primary photo storage
- Field documentation references photos via foreign keys
- Photos can be linked to multiple documentation entities

#### Photo Linkage Points
```sql
-- Photos can be linked to:
moisture_points.photo_id → job_photos.id
content_items.photos → job_photos.id[] (array)
moisture_maps (via metadata) → job_photos.id[]
floor_plans.image_storage_path → job_photos.storage_path
```

#### Workflow
1. **Photos Gate**: Tech uploads photos with room metadata
2. **System**: Auto-creates `rooms` from photo metadata
3. **Moisture Gate**: Tech links moisture readings to photos
4. **Content Gate**: Tech links content items to photos

---

### 4. **Estimates ↔ Boards Integration**

#### Connection Strategy
- **Estimates** (existing table) can be tracked in boards
- **Estimate Board** provides workflow management
- Line items can be linked to board items

#### Data Flow
```
┌─────────────┐
│  Estimate   │───►┌──────────────┐
│             │    │ Board Item   │
│             │    │ (Estimate)   │
└─────────────┘    └──────────────┘
     │                    │
     │                    │
     └───► Status syncs: draft → pending_review → approved
```

#### Board Columns for Estimates
- **Status**: draft, pending_review, approved, rejected
- **Total Amount**: Formula column (sum of line items)
- **Job**: Link column → jobs table
- **Policy**: Link column → policies table
- **Assigned Estimator**: People column

---

### 5. **Reports ↔ Jobs Integration**

#### Connection Strategy
- **Reports** are generated from job data
- Reports pull from multiple sources:
  - Job gates (workflow completion)
  - Field documentation (chambers, moisture, equipment)
  - Photos (evidence)
  - Estimates (costs)

#### Report Generation Flow
```
Job Data Sources:
├─► job_gates (workflow stages)
├─► chambers (drying management)
├─► psychrometric_readings (environmental data)
├─► moisture_points (damage assessment)
├─► equipment_logs (equipment justification)
├─► job_photos (visual evidence)
├─► estimates (cost breakdown)
└─► policies (insurance info)

     │
     ▼

Report Template
     │
     ▼

Generated Report (PDF)
     │
     ▼

Stored in reports table
```

---

## 👥 User Workflow Integration

### Field Tech Workflow (Enhanced)

#### Before (Current)
```
1. Login → /field dashboard
2. Select job → /field/jobs/[id]
3. Complete gates sequentially
4. Upload photos
5. Complete departure gate
```

#### After (With New Features)
```
1. Login → /field dashboard
   └─► Can also see board items assigned to them

2. Select job → /field/jobs/[id]
   └─► Enhanced view shows:
       - Gate status (existing)
       - Chamber status (new)
       - Equipment deployed (new)
       - Moisture readings summary (new)

3. Complete gates sequentially
   └─► MOISTURE/EQUIPMENT GATE now includes:
       - Chamber setup
       - Room mapping
       - Psychrometric readings
       - Moisture point entry
       - Equipment deployment tracking

4. Upload photos
   └─► Photos can be linked to:
       - Rooms (auto-created from metadata)
       - Moisture points
       - Content items

5. Complete departure gate
   └─► Finalizes equipment logs
   └─► Updates chamber status
   └─► Triggers report generation (optional)
```

### Admin/Estimator Workflow (Enhanced)

#### Before (Current)
```
1. Login → Admin dashboard
2. Create jobs
3. Assign to field techs
4. Monitor gate completion
5. Review photos
```

#### After (With New Features)
```
1. Login → Admin dashboard
   └─► Can access boards for work management
   └─► Can view dashboards with metrics

2. Create jobs
   └─► Optionally creates board item in "Active Jobs" board
   └─► Can create item in "Sales Leads" board first

3. Assign to field techs
   └─► Updates board item (people column)
   └─► Updates job.lead_tech_id

4. Monitor gate completion
   └─► Can view in board (status column)
   └─► Can view in job detail (existing)

5. Review photos
   └─► Can view moisture maps
   └─► Can view floor plans with overlays
   └─► Can review equipment deployment

6. NEW: Review field documentation
   └─► View chamber summaries
   └─► Review psychrometric trends
   └─► Analyze moisture point data
   └─► Review equipment justification

7. NEW: Generate reports
   └─► Select report template
   └─► Configure sections (chambers, equipment, etc.)
   └─► Generate PDF report
   └─► Send to customer/insurance
```

---

## 🔄 Data Synchronization Patterns

### 1. **Job Status ↔ Board Item Status**

```typescript
// When job.status changes:
async function syncJobToBoard(jobId: string) {
  const job = await getJob(jobId);
  const boardItem = await findBoardItemByJobId(jobId);
  
  if (boardItem) {
    await updateColumnValue(boardItem.id, 'status_column_id', job.status);
  }
}

// When board item status changes:
async function syncBoardToJob(itemId: string) {
  const item = await getItem(itemId);
  const jobId = await getColumnValue(itemId, 'job_id_column_id');
  
  if (jobId) {
    await updateJob(jobId, { status: item.status });
  }
}
```

### 2. **Gate Completion → Board Update**

```typescript
// When gate completes:
async function onGateComplete(gateId: string) {
  const gate = await getGate(gateId);
  const job = await getJob(gate.job_id);
  
  // Update board item progress
  const boardItem = await findBoardItemByJobId(job.id);
  if (boardItem) {
    const completedGates = await countCompletedGates(job.id);
    await updateColumnValue(boardItem.id, 'progress_column_id', 
      `${completedGates}/7`);
  }
  
  // If Moisture/Equipment gate, create chambers
  if (gate.stage_name === 'Moisture/Equipment') {
    await initializeChambersForJob(job.id);
  }
}
```

### 3. **Photo Upload → Room Creation**

```typescript
// When photo uploaded with room metadata:
async function onPhotoUpload(photo: JobPhoto) {
  if (photo.metadata?.room) {
    // Check if room exists
    let room = await findRoomByName(photo.job_id, photo.metadata.room);
    
    if (!room) {
      // Auto-create room
      room = await createRoom({
        job_id: photo.job_id,
        name: photo.metadata.room,
        room_type: photo.metadata.room_type || 'other'
      });
    }
    
    // Link photo to room (via metadata update)
    await updatePhoto(photo.id, {
      metadata: {
        ...photo.metadata,
        room_id: room.id
      }
    });
  }
}
```

---

## 📊 Database Relationships Diagram

```
┌─────────────┐
│   accounts  │
└──────┬──────┘
       │
       ├───►┌─────────────┐
       │    │   boards    │
       │    └──────┬──────┘
       │           │
       │           ├───►┌─────────────┐
       │           │    │   items     │
       │           │    └──────┬──────┘
       │           │           │
       │           │           └───►┌──────────────┐
       │           │                │ column_values│
       │           │                └──────────────┘
       │           │
       │           └───►┌─────────────┐
       │                │   columns    │
       │                └──────────────┘
       │
       └───►┌─────────────┐
            │    jobs     │
            └──────┬──────┘
                   │
                   ├───►┌──────────────┐
                   │    │  job_gates   │
                   │    └──────────────┘
                   │
                   ├───►┌──────────────┐
                   │    │  job_photos  │
                   │    └──────┬───────┘
                   │           │
                   │           └───►┌──────────────┐
                   │                │moisture_points│
                   │                └──────────────┘
                   │
                   ├───►┌──────────────┐
                   │    │  chambers    │
                   │    └──────┬───────┘
                   │           │
                   │           ├───►┌──────────────┐
                   │           │    │chamber_rooms │
                   │           │    └──────────────┘
                   │           │
                   │           ├───►┌──────────────┐
                   │           │    │psychrometric_│
                   │           │    │  readings     │
                   │           │    └──────────────┘
                   │           │
                   │           └───►┌──────────────┐
                   │                │moisture_points│
                   │                └──────────────┘
                   │
                   ├───►┌──────────────┐
                   │    │  floor_plans │
                   │    └──────┬───────┘
                   │           │
                   │           └───►┌──────────────┐
                   │                │    rooms     │
                   │                └──────────────┘
                   │
                   ├───►┌──────────────┐
                   │    │equipment_logs│
                   │    └──────────────┘
                   │
                   ├───►┌──────────────┐
                   │    │    boxes     │
                   │    └──────┬───────┘
                   │           │
                   │           └───►┌──────────────┐
                   │                │content_items │
                   │                └──────────────┘
                   │
                   └───►┌──────────────┐
                        │   reports    │
                        └──────────────┘
```

---

## 🎯 Key Integration Patterns

### Pattern 1: **Job-Centric with Board Tracking**
- Jobs remain the source of truth
- Boards provide enhanced visibility and workflow
- Bidirectional sync keeps data consistent

### Pattern 2: **Gate-Triggered Documentation**
- Field documentation is created during gate completion
- Moisture/Equipment gate is the primary trigger
- Documentation enhances gate data, doesn't replace it

### Pattern 3: **Photo-Driven Room Creation**
- Photos with room metadata auto-create rooms
- Rooms link to chambers, moisture points, content
- Photos remain in job_photos, referenced by documentation

### Pattern 4: **Report Aggregation**
- Reports pull from multiple sources
- Templates define what data to include
- Generated reports stored for audit trail

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- ✅ Schema creation (completed)
- Deploy schema to database
- Create basic API endpoints for new tables

### Phase 2: Board Integration (Week 3-4)
- Create 8 preconfigured boards
- Build board UI components
- Implement job ↔ board sync

### Phase 3: Field Documentation (Week 5-6)
- Enhance Moisture/Equipment gate UI
- Build chamber/room management UI
- Integrate moisture point entry
- Build equipment logging UI

### Phase 4: Reports (Week 7-8)
- Build report template system
- Create report generation engine
- Integrate with job completion workflow

### Phase 5: Automation (Week 9-10)
- Build automation rule engine
- Create trigger system
- Implement action handlers

---

## 📝 API Endpoint Examples

### Board Integration
```typescript
// Get board items for a job
GET /api/boards/active-jobs/items?job_id={jobId}

// Sync job to board
POST /api/jobs/{jobId}/sync-to-board

// Update board item from job
PATCH /api/boards/items/{itemId}/sync-from-job
```

### Field Documentation
```typescript
// Get chambers for a job
GET /api/jobs/{jobId}/chambers

// Create chamber from gate
POST /api/gates/{gateId}/create-chamber

// Get moisture points for chamber
GET /api/chambers/{chamberId}/moisture-points

// Record psychrometric reading
POST /api/chambers/{chamberId}/readings
```

### Reports
```typescript
// Generate report
POST /api/jobs/{jobId}/reports
Body: { template_id, configuration }

// Get report
GET /api/reports/{reportId}

// Send report
POST /api/reports/{reportId}/send
Body: { emails: string[] }
```

---

## 🔐 Security & Permissions

### RLS Integration
- All new tables use existing `can_access_job()` helper
- Board access follows account membership
- Field documentation follows job assignment rules

### Role-Based Access
- **Field Tech**: Can create/update documentation for assigned jobs
- **Admin/Owner**: Can view all documentation, manage boards
- **Estimator**: Can view documentation, generate reports

---

## 📈 Performance Considerations

### Indexes
- All foreign keys indexed
- Job-based queries optimized
- Board item lookups indexed

### Materialized Views
- Dashboard metrics refreshed on schedule
- Can be refreshed on-demand for real-time data

### Caching Strategy
- Board data cached (refresh on updates)
- Chamber summaries cached per job
- Report templates cached

---

## 🧪 Testing Strategy

### Integration Tests
1. **Job → Board Sync**: Verify bidirectional updates
2. **Gate → Documentation**: Verify chamber creation on gate complete
3. **Photo → Room**: Verify auto-room creation from photo metadata
4. **Report Generation**: Verify data aggregation from all sources

### User Acceptance Tests
1. Field tech completes Moisture/Equipment gate → Documentation created
2. Admin views board → Sees job status updates
3. Estimator generates report → All data included correctly

---

## 📚 Next Steps

1. **Review this integration guide** with team
2. **Prioritize integration points** based on business needs
3. **Build API endpoints** for new features
4. **Create UI components** for board and documentation views
5. **Implement sync logic** for job ↔ board
6. **Test end-to-end workflows** with real data

---

This integration maintains backward compatibility while adding powerful new capabilities. The existing job/gate workflow remains intact, enhanced by work management and detailed field documentation.

