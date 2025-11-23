# Integration Layer Implementation Plan

## Goal
Connect Jobs ↔ Boards with bidirectional sync to enable seamless workflow between work management and field documentation.

---

## Integration Architecture

### Connection Strategy
- **Jobs** remain the primary entity for field operations
- **Boards** provide work management capabilities
- Connection via `column_values` storing `job_id` in a "link" type column
- Bidirectional sync: Job changes → Board item updates, Board item changes → Job updates

### Data Flow
```
Job Created → Automation Trigger → Create Board Item
Job Updated → Automation Trigger → Update Board Item
Board Item Updated → Webhook/Trigger → Update Job
```

---

## Implementation Components

### 1. Job → Board Sync (Automatic)
**When**: Job created or updated
**Action**: Create/update board item in "Active Jobs" board

**Implementation**:
- Use existing automation engine
- Create automation rule: "When job created, create board item"
- Map job fields to board columns:
  - `job.title` → Item name
  - `job.status` → Status column
  - `job.lead_tech_id` → People column
  - `job.id` → Link column (job_id)
  - `job.address_line_1` → Text column
  - `job.created_at` → Date column

### 2. Board → Job Sync (Bidirectional)
**When**: Board item updated (status, assignment, dates)
**Action**: Update corresponding job

**Implementation**:
- Add webhook/trigger on board item updates
- Check if item has job_id in link column
- Update job fields from board columns:
  - Status column → `job.status`
  - People column → `job.lead_tech_id`
  - Date column → `job.updated_at`

### 3. Sync Service
**Purpose**: Centralized sync logic to prevent circular updates

**Features**:
- Track sync state to prevent loops
- Handle conflicts (last-write-wins or manual resolution)
- Log sync operations for debugging

---

## API Endpoints Needed

### 1. `POST /api/jobs/[jobId]/sync-to-board`
- Manually trigger sync from job to board
- Create board item if doesn't exist
- Update board item if exists

### 2. `POST /api/items/[itemId]/sync-to-job`
- Manually trigger sync from board item to job
- Update job fields from board columns

### 3. `GET /api/jobs/[jobId]/board-item`
- Get the board item linked to a job
- Returns item with all column values

### 4. `GET /api/items/[itemId]/job`
- Get the job linked to a board item
- Returns job details

---

## Database Considerations

### No Schema Changes Needed
- Connection via `column_values` (existing)
- Link column type already supports UUIDs
- No foreign keys needed (loose coupling)

### Sync Tracking (Optional)
- Could add `sync_metadata` JSONB column to track:
  - Last sync timestamp
  - Sync direction
  - Conflict resolution

---

## Implementation Steps

### Step 1: Create Sync Service
- `lib/integration/sync-service.ts`
- Functions: `syncJobToBoard()`, `syncBoardToJob()`
- Conflict detection and resolution

### Step 2: Create API Endpoints
- Job → Board sync endpoint
- Board → Job sync endpoint
- Get linked entities endpoints

### Step 3: Add Automation Rules
- Auto-create board item when job created
- Auto-update board item when job updated

### Step 4: Add Board Item Update Hooks
- Detect when board item with job_id is updated
- Trigger job update

### Step 5: Add UI Integration
- Show board item link on job detail page
- Show job link on board item detail
- Manual sync buttons

---

## Testing Strategy

### Unit Tests
- Sync service functions
- Conflict resolution logic
- Field mapping

### Integration Tests
- Job creation → Board item creation
- Job update → Board item update
- Board item update → Job update
- Circular update prevention

### E2E Tests
- Full workflow: Create job → See in board → Update in board → See in job

---

## Success Criteria

- ✅ Job creation automatically creates board item
- ✅ Job updates automatically update board item
- ✅ Board item updates automatically update job
- ✅ No circular update loops
- ✅ Manual sync works
- ✅ Linked entities visible in UI
- ✅ All sync operations logged

---

## Estimated Effort

- **Sync Service**: 1 hour
- **API Endpoints**: 1 hour
- **Automation Rules**: 30 minutes
- **UI Integration**: 30 minutes
- **Testing**: 1 hour
- **Total**: ~4 hours

---

## Risk Mitigation

1. **Circular Updates**: Use sync state tracking
2. **Data Conflicts**: Last-write-wins or manual resolution
3. **Performance**: Batch sync operations
4. **Errors**: Comprehensive error handling and logging

