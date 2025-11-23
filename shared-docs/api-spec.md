# API Specification

## Overview
Complete RESTful API specification for all endpoints. All endpoints require Supabase session cookie or Bearer token authentication.

## Base URLs
- Field App: `/api/field`
- Work Management: `/api`
- Hydro/Drying: `/api/hydro`
- Content: `/api/content`
- Integration: `/api`
- Reports: `/api/reports`
- Automation: `/api/automations`
- Admin: `/api/admin`

## Authentication
All endpoints require Supabase session cookie or Bearer token.

---

## Field App API (`/api/field`)

### Job Operations

#### Get Assigned Jobs
`GET /api/field/jobs`
- Returns: List of jobs assigned to authenticated field tech
- Response: `{ success: true, data: { jobs: Job[] } }`

#### Get Job Details
`GET /api/field/jobs/:jobId`
- Returns: Job details with gates
- Response: `{ success: true, data: { job: Job, gates: JobGate[] } }`

### Gate Operations

#### Get Gate Status
`GET /api/field/gates/:gateId`
- Returns: Current gate status and requirements
- Response: `{ success: true, data: { gate: JobGate, requirements: string[], canComplete: boolean } }`

#### Complete Gate
`POST /api/field/gates/:gateId/complete`
- Body: `{ photoData?: string, exceptionReason?: string }`
- Returns: Updated gate status
- Response: `{ success: true, data: { gate: JobGate } }`

#### Log Exception
`POST /api/field/gates/:gateId/exception`
- Body: `{ reason: string }`
- Returns: Updated gate with exception
- Response: `{ success: true, data: { gate: JobGate } }`

### Photo Operations

#### Upload Photo
`POST /api/field/photos/upload`
- Body: `FormData` with `file`, `jobId`, `gateId`, `metadata`
- Returns: Photo record
- Response: `{ success: true, data: { photo: JobPhoto, storageUrl: string } }`

### Natural Language Interface

#### Process Voice Command
`POST /api/field/voice/command`
- Body: `{ command: string, context?: { jobId?: string, gateId?: string } }`
- Returns: Interpreted command and action
- Response: `{ success: true, data: { intent: string, action: string, data?: any, response: string } }`

---

## Work Management API

### Boards

#### List Boards
`GET /api/boards?account_id={id}&board_type={type}&limit={n}&offset={n}`
- Query Params: `account_id` (optional), `board_type` (optional), `limit` (optional, default 50), `offset` (optional, default 0)
- Response: `{ success: true, data: { boards: Board[], pagination: { total, limit, offset, totalPages } } }`

#### Create Board
`POST /api/boards`
- Body: `{ name: string, description?: string, board_type: string, account_id?: string, icon?: string, color?: string, is_template?: boolean }`
- Response: `{ success: true, data: Board }` (201)

#### Get Board
`GET /api/boards/:boardId`
- Response: `{ success: true, data: { board: Board } }`

#### Update Board
`PUT /api/boards/:boardId`
- Body: `{ name?: string, description?: string, icon?: string, color?: string }`
- Response: `{ success: true, data: Board }`

#### Delete Board
`DELETE /api/boards/:boardId`
- Response: `{ success: true, data: { deleted: true } }`

### Groups

#### List Groups
`GET /api/groups?board_id={id}`
- Query Params: `board_id` (required)
- Response: `{ success: true, data: { groups: Group[] } }`

#### Create Group
`POST /api/groups`
- Body: `{ board_id: string, name: string, position?: number, color?: string, is_archived?: boolean }`
- Response: `{ success: true, data: Group }` (201)

#### Get Group
`GET /api/groups/:groupId`
- Response: `{ success: true, data: { group: Group } }`

#### Update Group
`PUT /api/groups/:groupId`
- Body: `{ name?: string, position?: number, color?: string, is_archived?: boolean }`
- Response: `{ success: true, data: Group }`

#### Delete Group
`DELETE /api/groups/:groupId`
- Response: `{ success: true, data: { deleted: true } }`

#### Reorder Group
`PATCH /api/groups/:groupId/reorder`
- Body: `{ position: number }`
- Response: `{ success: true, data: Group }`

### Items

#### List Items
`GET /api/items?board_id={id}&group_id={id}&limit={n}&offset={n}`
- Query Params: `board_id` (required), `group_id` (optional), `limit` (optional, default 50), `offset` (optional, default 0)
- Response: `{ success: true, data: { items: Item[], pagination: { total, limit, offset, totalPages } } }`

#### Create Item
`POST /api/items`
- Body: `{ board_id: string, group_id?: string, name: string, position?: number }`
- Response: `{ success: true, data: Item }` (201)

#### Get Item
`GET /api/items/:itemId`
- Response: `{ success: true, data: { item: Item } }`

#### Update Item
`PUT /api/items/:itemId`
- Body: `{ name?: string, group_id?: string, position?: number, is_archived?: boolean }`
- Response: `{ success: true, data: Item }`

#### Delete Item
`DELETE /api/items/:itemId`
- Response: `{ success: true, data: { deleted: true } }`

### Subitems

#### List Subitems
`GET /api/subitems?item_id={id}`
- Query Params: `item_id` (required)
- Response: `{ success: true, data: { subitems: Subitem[] } }`

#### Create Subitem
`POST /api/subitems`
- Body: `{ item_id: string, name: string, position?: number, is_completed?: boolean }`
- Response: `{ success: true, data: Subitem }` (201)

#### Get Subitem
`GET /api/subitems/:subitemId`
- Response: `{ success: true, data: { subitem: Subitem } }`

#### Update Subitem
`PUT /api/subitems/:subitemId`
- Body: `{ name?: string, position?: number, is_completed?: boolean }`
- Response: `{ success: true, data: Subitem }`

#### Delete Subitem
`DELETE /api/subitems/:subitemId`
- Response: `{ success: true, data: { deleted: true } }`

#### Toggle Subitem Completion
`PATCH /api/subitems/:subitemId/complete`
- Response: `{ success: true, data: Subitem }`

### Dashboards

#### List Dashboards
`GET /api/dashboards?account_id={id}&limit={n}&offset={n}`
- Query Params: `account_id` (optional), `limit` (optional, default 50), `offset` (optional, default 0)
- Response: `{ success: true, data: { dashboards: Dashboard[], pagination: { total, limit, offset, totalPages } } }`

#### Create Dashboard
`POST /api/dashboards`
- Body: `{ account_id?: string, name: string, description?: string, layout?: Record<string, unknown> }`
- Response: `{ success: true, data: Dashboard }` (201)

#### Get Dashboard
`GET /api/dashboards/:dashboardId`
- Response: `{ success: true, data: { dashboard: Dashboard } }`

#### Update Dashboard
`PUT /api/dashboards/:dashboardId`
- Body: `{ name?: string, description?: string, layout?: Record<string, unknown> }`
- Response: `{ success: true, data: Dashboard }`

#### Delete Dashboard
`DELETE /api/dashboards/:dashboardId`
- Response: `{ success: true, data: { deleted: true } }`

#### Get Dashboard Metrics
`GET /api/dashboards/:dashboardId/metrics`
- Response: `{ success: true, data: { metrics: { leads_count, active_jobs_count, ready_to_invoice_count, jobs_last_7_days, avg_job_duration_seconds } } }`

---

## Hydro/Drying System API

### Chambers

#### List Chambers
`GET /api/hydro/chambers?job_id={id}`
- Query Params: `job_id` (required)
- Response: `{ success: true, data: { chambers: Chamber[] } }`

#### Create Chamber
`POST /api/hydro/chambers`
- Body: `{ job_id: string, name: string, description?: string, chamber_type?: 'standard' | 'containment' | 'negative_pressure', status?: 'active' | 'completed' | 'archived' }`
- Response: `{ success: true, data: Chamber }` (201)

#### Get Chamber
`GET /api/hydro/chambers/:chamberId`
- Response: `{ success: true, data: { chamber: Chamber, latest_readings: PsychrometricReading[], moisture_point_count: number, active_equipment: EquipmentLog[] } }`

#### Update Chamber
`PUT /api/hydro/chambers/:chamberId`
- Body: `{ name?: string, description?: string, chamber_type?: string, status?: string }`
- Response: `{ success: true, data: Chamber }`

#### Delete Chamber
`DELETE /api/hydro/chambers/:chamberId`
- Response: `{ success: true, data: { deleted: true } }`

### Chamber Rooms

#### List Rooms in Chamber
`GET /api/hydro/chambers/:chamberId/rooms`
- Response: `{ success: true, data: { rooms: Array<{ room_id, assigned_at, rooms: Room }> } }`

#### Add Room to Chamber
`POST /api/hydro/chambers/:chamberId/rooms`
- Body: `{ room_id: string }`
- Response: `{ success: true, data: { room_id, assigned_at, rooms: Room } }` (201)

#### Remove Room from Chamber
`DELETE /api/hydro/chambers/:chamberId/rooms/:roomId`
- Response: `{ success: true, data: { removed: true } }`

### Floor Plans

#### List Floor Plans
`GET /api/hydro/floor-plans?job_id={id}`
- Query Params: `job_id` (required)
- Response: `{ success: true, data: { floor_plans: FloorPlan[] } }`

#### Create Floor Plan
`POST /api/hydro/floor-plans`
- Body: `{ job_id: string, name: string, level?: number, image_storage_path?: string, width?: number, height?: number, scale_factor?: number, metadata?: Record<string, unknown> }`
- Response: `{ success: true, data: FloorPlan }` (201)

#### Get Floor Plan
`GET /api/hydro/floor-plans/:floorPlanId`
- Response: `{ success: true, data: { floor_plan: FloorPlan } }`

#### Update Floor Plan
`PUT /api/hydro/floor-plans/:floorPlanId`
- Body: `{ name?: string, level?: number, image_storage_path?: string, width?: number, height?: number, scale_factor?: number, metadata?: Record<string, unknown> }`
- Response: `{ success: true, data: FloorPlan }`

#### Delete Floor Plan
`DELETE /api/hydro/floor-plans/:floorPlanId`
- Response: `{ success: true, data: { deleted: true } }`

#### Upload Floor Plan Image
`POST /api/hydro/floor-plans/:floorPlanId/upload`
- Body: `FormData` with `file` (image, max 10MB)
- Response: `{ success: true, data: { floor_plan: FloorPlan, storage_url: string } }`

### Rooms

#### List Rooms
`GET /api/hydro/rooms?job_id={id}&floor_plan_id={id}`
- Query Params: `job_id` (required), `floor_plan_id` (optional)
- Response: `{ success: true, data: { rooms: Room[] } }`

#### Create Room
`POST /api/hydro/rooms`
- Body: `{ job_id: string, floor_plan_id?: string, name: string, room_type?: string, level?: number, coordinates?: Record<string, unknown>, area_sqft?: number, metadata?: Record<string, unknown> }`
- Response: `{ success: true, data: Room }` (201)

#### Get Room
`GET /api/hydro/rooms/:roomId`
- Response: `{ success: true, data: { room: Room } }`

#### Update Room
`PUT /api/hydro/rooms/:roomId`
- Body: `{ name?: string, room_type?: string, level?: number, floor_plan_id?: string, coordinates?: Record<string, unknown>, area_sqft?: number, metadata?: Record<string, unknown> }`
- Response: `{ success: true, data: Room }`

#### Delete Room
`DELETE /api/hydro/rooms/:roomId`
- Response: `{ success: true, data: { deleted: true } }`

### Moisture Maps

#### List Moisture Maps
`GET /api/hydro/moisture-maps?floor_plan_id={id}&chamber_id={id}`
- Query Params: `floor_plan_id` (required), `chamber_id` (optional)
- Response: `{ success: true, data: { moisture_maps: MoistureMap[] } }`

#### Create Moisture Map
`POST /api/hydro/moisture-maps`
- Body: `{ floor_plan_id: string, chamber_id: string, map_date: string, overlay_image_storage_path?: string, metadata?: Record<string, unknown> }`
- Response: `{ success: true, data: MoistureMap }` (201)

#### Get Moisture Map
`GET /api/hydro/moisture-maps/:mapId`
- Response: `{ success: true, data: { moisture_map: MoistureMap } }`

#### Delete Moisture Map
`DELETE /api/hydro/moisture-maps/:mapId`
- Response: `{ success: true, data: { deleted: true } }`

### Drying Logs

#### List Drying Logs
`GET /api/hydro/drying-logs?chamber_id={id}&start_date={date}&end_date={date}`
- Query Params: `chamber_id` (required), `start_date` (optional), `end_date` (optional)
- Response: `{ success: true, data: { drying_logs: DryingLog[] } }`

#### Create Drying Log
`POST /api/hydro/drying-logs`
- Body: `{ chamber_id: string, log_date: string, summary_data?: Record<string, unknown>, notes?: string }`
- Response: `{ success: true, data: DryingLog }` (201)

#### Get Drying Log
`GET /api/hydro/drying-logs/:logId`
- Response: `{ success: true, data: { drying_log: DryingLog } }`

#### Update Drying Log
`PUT /api/hydro/drying-logs/:logId`
- Body: `{ log_date?: string, summary_data?: Record<string, unknown>, notes?: string }`
- Response: `{ success: true, data: DryingLog }`

#### Delete Drying Log
`DELETE /api/hydro/drying-logs/:logId`
- Response: `{ success: true, data: { deleted: true } }`

---

## Content Management API

### Boxes

#### List Boxes
`GET /api/content/boxes?job_id={id}`
- Query Params: `job_id` (required)
- Response: `{ success: true, data: { boxes: Box[] } }`

#### Create Box
`POST /api/content/boxes`
- Body: `{ job_id: string, box_number: string, room_of_origin_id?: string, current_location?: string, location_details?: string, packed_date?: string }`
- Response: `{ success: true, data: Box }` (201)

#### Get Box
`GET /api/content/boxes/:boxId`
- Response: `{ success: true, data: { box: Box } }`

#### Update Box
`PUT /api/content/boxes/:boxId`
- Body: `{ box_number?: string, room_of_origin_id?: string, current_location?: string, location_details?: string, packed_date?: string }`
- Response: `{ success: true, data: Box }`

#### Delete Box
`DELETE /api/content/boxes/:boxId`
- Response: `{ success: true, data: { deleted: true } }`

### Content Items

#### List Content Items
`GET /api/content/items?job_id={id}&box_id={id}&room_id={id}`
- Query Params: `job_id` (required), `box_id` (optional), `room_id` (optional)
- Response: `{ success: true, data: { content_items: ContentItem[] } }`

#### Create Content Item
`POST /api/content/items`
- Body: `{ job_id: string, box_id?: string, room_id?: string, description: string, condition_before?: string, condition_after?: string, estimated_value?: number, photos?: string[], notes?: string }`
- Response: `{ success: true, data: ContentItem }` (201)

#### Get Content Item
`GET /api/content/items/:itemId`
- Response: `{ success: true, data: { content_item: ContentItem } }`

#### Update Content Item
`PUT /api/content/items/:itemId`
- Body: `{ description?: string, box_id?: string, room_id?: string, condition_before?: string, condition_after?: string, estimated_value?: number, photos?: string[], notes?: string }`
- Response: `{ success: true, data: ContentItem }`

#### Delete Content Item
`DELETE /api/content/items/:itemId`
- Response: `{ success: true, data: { deleted: true } }`

---

## Integration API

### Job-Board Sync

#### Sync Job to Board
`POST /api/jobs/:jobId/sync-to-board`
- Body: `{ board_id?: string, force?: boolean }` (optional)
- Response: `{ success: true, data: { board_item: Item, synced_at: string } }`
- Errors: `404` (Job not found), `403` (Forbidden), `500` (Sync failed)

#### Get Linked Board Item
`GET /api/jobs/:jobId/board-item`
- Response: `{ success: true, data: { board_item: { id, name, board_id, board_name, column_values } | null } }`
- Errors: `404` (Job not found), `403` (Forbidden)

### Item-Job Sync

#### Sync Board Item to Job
`POST /api/items/:itemId/sync-to-job`
- Body: `{ force?: boolean }` (optional)
- Response: `{ success: true, data: { job: Job, synced_at: string } }`
- Errors: `404` (Board item not found or no linked job), `403` (Forbidden), `500` (Sync failed)

#### Get Linked Job
`GET /api/items/:itemId/job`
- Response: `{ success: true, data: { job: Job | null } }`
- Errors: `404` (Board item not found), `403` (Forbidden)

---

## Error Responses

All endpoints return errors in format:
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `FORBIDDEN` - Access denied
- `CONFLICT` - Resource conflict (e.g., duplicate)
- `DATABASE_ERROR` - Database operation failed
- `UPLOAD_ERROR` - File upload failed
- `SYNC_ERROR` - Sync operation failed

---

## Implementation Notes
- All endpoints use Zod validation
- All endpoints respect RLS policies
- All endpoints have proper error handling
- GET endpoints include cache headers
- File uploads limited to 10MB for images, 50MB for PDFs
- All operations validate user permissions
