# Integration API Contract

## Overview
This document defines the API contract for the integration layer, coordinating between this agent (building logic/UI) and the other agent (building API endpoints).

---

## Required Endpoints

### 1. Sync Job to Board
**Endpoint**: `POST /api/jobs/[jobId]/sync-to-board`

**Purpose**: Manually trigger sync from job to board item

**Request**:
```typescript
// Path params
jobId: string (UUID)

// Body (optional)
{
  board_id?: string (UUID), // Target board (defaults to "Active Jobs" board)
  force?: boolean // Force sync even if already synced
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    board_item: {
      id: string,
      name: string,
      board_id: string,
      column_values: Array<{
        column_id: string,
        value: unknown
      }>
    },
    synced_at: string (ISO timestamp)
  }
}
```

**Errors**:
- `404`: Job not found
- `403`: Forbidden (no access to job)
- `500`: Sync failed

---

### 2. Sync Board Item to Job
**Endpoint**: `POST /api/items/[itemId]/sync-to-job`

**Purpose**: Manually trigger sync from board item to job

**Request**:
```typescript
// Path params
itemId: string (UUID)

// Body (optional)
{
  force?: boolean // Force sync even if already synced
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    job: {
      id: string,
      title: string,
      status: string,
      lead_tech_id: string | null,
      // ... other job fields
    },
    synced_at: string (ISO timestamp)
  }
}
```

**Errors**:
- `404`: Board item not found or no linked job
- `403`: Forbidden (no access to board/item)
- `500`: Sync failed

---

### 3. Get Linked Board Item
**Endpoint**: `GET /api/jobs/[jobId]/board-item`

**Purpose**: Get the board item linked to a job

**Request**:
```typescript
// Path params
jobId: string (UUID)
```

**Response**:
```typescript
{
  success: true,
  data: {
    board_item: {
      id: string,
      name: string,
      board_id: string,
      board_name: string,
      column_values: Array<{
        column_id: string,
        column_title: string,
        value: unknown
      }>
    } | null // null if no linked board item
  }
}
```

**Errors**:
- `404`: Job not found
- `403`: Forbidden

---

### 4. Get Linked Job
**Endpoint**: `GET /api/items/[itemId]/job`

**Purpose**: Get the job linked to a board item

**Request**:
```typescript
// Path params
itemId: string (UUID)
```

**Response**:
```typescript
{
  success: true,
  data: {
    job: {
      id: string,
      title: string,
      status: string,
      address_line_1: string | null,
      city: string | null,
      state: string | null,
      lead_tech_id: string | null,
      created_at: string,
      updated_at: string
    } | null // null if no linked job
  }
}
```

**Errors**:
- `404`: Board item not found
- `403`: Forbidden

---

## Field Mapping

### Job → Board Item Mapping
- `job.title` → Item `name`
- `job.status` → Status column value
- `job.lead_tech_id` → People column value
- `job.id` → Link column value (job_id)
- `job.address_line_1` → Text column value
- `job.created_at` → Date column value
- `job.updated_at` → Date column value

### Board Item → Job Mapping
- Status column → `job.status`
- People column → `job.lead_tech_id`
- Date column → `job.updated_at`
- Link column (job_id) → Used to find job

---

## Column Types Required

### For "Active Jobs" Board
1. **Status Column** (status) - Maps to `job.status`
2. **People Column** (people) - Maps to `job.lead_tech_id`
3. **Link Column** (link) - Stores `job.id`
4. **Text Column** (text) - Stores `job.address_line_1`
5. **Date Column** (date) - Stores `job.created_at`, `job.updated_at`

---

## Sync Behavior

### Automatic Sync
- Triggered by automation rules
- Job created → Create board item
- Job updated → Update board item
- Board item updated → Update job

### Manual Sync
- User clicks sync button
- Calls sync endpoint
- Returns updated entity

### Conflict Resolution
- **Last-write-wins**: Most recent update wins
- **Sync State Tracking**: Prevents circular updates
- **Manual Override**: User can force sync

---

## Error Handling

### Common Errors
- **404 Not Found**: Entity doesn't exist
- **403 Forbidden**: No access to entity
- **400 Bad Request**: Invalid request data
- **409 Conflict**: Sync conflict detected
- **500 Internal Error**: Sync failed

### Error Response Format
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: unknown
  }
}
```

---

## Authentication & Authorization

### Required
- All endpoints require authentication
- User must have access to job/board
- Admin can sync any job/board
- Field tech can sync their assigned jobs

---

## Performance Requirements

- Sync operation: < 500ms
- Get linked entity: < 200ms
- Batch operations: < 1s per 10 items

---

## Testing Requirements

### Unit Tests
- Field mapping functions
- Conflict resolution logic
- Sync state tracking

### Integration Tests
- Sync endpoints work correctly
- Linked entity endpoints work
- Error handling works

### E2E Tests
- Full workflow (create job → see in board → update → sync)
- Conflict resolution
- Error scenarios

---

## Notes for Other Agent

1. **Use Existing Patterns**: Follow patterns from other API endpoints
2. **Validation**: Use Zod schemas (see `lib/validation/schemas.ts`)
3. **Error Handling**: Use `errorResponse()` helper (see `lib/api/middleware.ts`)
4. **Authentication**: Use `requireAuth()` helper
5. **RLS**: Ensure RLS policies allow sync operations

---

## Questions or Changes

If you need to modify this contract, please update this document and notify via `shared-docs/swarm-integration-progress.md`.

