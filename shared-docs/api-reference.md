# Field App API Reference

## Overview
Complete API reference for all endpoints organized by domain. All endpoints require authentication via Supabase session cookie or Bearer token.

---

## Field App API (`/api/field`)

### Routes
- `GET /api/field/jobs` - Field dashboard (jobs assigned to tech)
- `GET /api/field/jobs/[id]` - Job detail with gates
- `GET /api/field/gates/[id]` - Individual gate screen
- `POST /api/field/gates/[id]/complete` - Complete a gate
- `POST /api/field/gates/[id]/exception` - Log exception for gate
- `POST /api/field/photos/upload` - Upload photo
- `GET /api/field/context` - Get current context
- `POST /api/field/context` - Set context
- `POST /api/field/voice/command` - Process voice command

### Data Models
```typescript
interface Job {
  id: string
  title: string
  address_line_1: string
  status: string
  lead_tech_id: string
}

interface JobGate {
  id: string
  job_id: string
  stage_name: string
  status: 'pending' | 'in_progress' | 'complete' | 'skipped'
  requires_exception: boolean
  exception_reason?: string
}

interface JobPhoto {
  id: string
  job_id: string
  gate_id: string
  storage_path: string
  metadata: string (JSON)
  is_ppe: boolean
}
```

### Gate Order
1. Arrival
2. Intake
3. Photos
4. Moisture/Equipment
5. Scope
6. Sign-offs
7. Departure

---

## Work Management API (`/api`)

### Boards
- `GET /api/boards` - List boards
- `POST /api/boards` - Create board
- `GET /api/boards/[boardId]` - Get board
- `PUT /api/boards/[boardId]` - Update board
- `DELETE /api/boards/[boardId]` - Delete board

### Groups
- `GET /api/groups?board_id={id}` - List groups for board
- `POST /api/groups` - Create group
- `GET /api/groups/[groupId]` - Get group
- `PUT /api/groups/[groupId]` - Update group
- `DELETE /api/groups/[groupId]` - Delete group
- `PATCH /api/groups/[groupId]/reorder` - Reorder groups

### Items
- `GET /api/items?board_id={id}` - List items for board
- `POST /api/items` - Create item
- `GET /api/items/[itemId]` - Get item
- `PUT /api/items/[itemId]` - Update item
- `DELETE /api/items/[itemId]` - Delete item

### Subitems
- `GET /api/subitems?item_id={id}` - List subitems for item
- `POST /api/subitems` - Create subitem
- `GET /api/subitems/[subitemId]` - Get subitem
- `PUT /api/subitems/[subitemId]` - Update subitem
- `DELETE /api/subitems/[subitemId]` - Delete subitem
- `PATCH /api/subitems/[subitemId]/complete` - Toggle completion

### Columns
- `GET /api/columns?board_id={id}` - List columns for board
- `POST /api/columns` - Create column
- `GET /api/columns/[columnId]` - Get column
- `PUT /api/columns/[columnId]` - Update column
- `DELETE /api/columns/[columnId]` - Delete column

### Column Values
- `GET /api/items/[itemId]/column-values` - Get column values for item
- `POST /api/items/[itemId]/column-values` - Set column value
- `PUT /api/items/[itemId]/column-values/[columnId]` - Update column value

### Views
- `GET /api/views?board_id={id}` - List views for board
- `POST /api/views` - Create view
- `GET /api/views/[viewId]` - Get view
- `PUT /api/views/[viewId]` - Update view
- `DELETE /api/views/[viewId]` - Delete view

### Dashboards
- `GET /api/dashboards` - List dashboards
- `POST /api/dashboards` - Create dashboard
- `GET /api/dashboards/[dashboardId]` - Get dashboard
- `PUT /api/dashboards/[dashboardId]` - Update dashboard
- `DELETE /api/dashboards/[dashboardId]` - Delete dashboard
- `GET /api/dashboards/[dashboardId]/metrics` - Get dashboard metrics

### Data Models
```typescript
interface Board {
  id: string
  account_id: string
  name: string
  board_type: 'sales_leads' | 'estimates' | 'bdm_accounts' | 'field' | 'mitigation_ar' | 'shop_equipment' | 'commissions' | 'active_jobs'
  icon?: string
  color?: string
  is_template: boolean
  created_by: string
  created_at: string
  updated_at: string
}

interface Group {
  id: string
  board_id: string
  name: string
  position: number
  color?: string
  is_archived: boolean
}

interface Item {
  id: string
  board_id: string
  group_id?: string
  name: string
  position: number
  is_archived: boolean
  created_by: string
}

interface Subitem {
  id: string
  item_id: string
  name: string
  position: number
  is_completed: boolean
  completed_by?: string
  completed_at?: string
}

interface Column {
  id: string
  board_id: string
  title: string
  column_type: 'text' | 'long_text' | 'numbers' | 'status' | 'date' | 'people' | 'tags' | 'timeline' | 'link' | 'file' | 'checkbox' | 'rating' | 'formula' | 'dependency'
  position: number
  width: number
  settings: Record<string, unknown>
}

interface Dashboard {
  id: string
  account_id?: string
  name: string
  description?: string
  layout: Record<string, unknown>
  created_by: string
}
```

---

## Hydro/Drying System API (`/api/hydro`)

### Chambers
- `GET /api/hydro/chambers?job_id={id}` - List chambers for job
- `POST /api/hydro/chambers` - Create chamber
- `GET /api/hydro/chambers/[chamberId]` - Get chamber
- `PUT /api/hydro/chambers/[chamberId]` - Update chamber
- `DELETE /api/hydro/chambers/[chamberId]` - Delete chamber

### Chamber Rooms
- `GET /api/hydro/chambers/[chamberId]/rooms` - List rooms in chamber
- `POST /api/hydro/chambers/[chamberId]/rooms` - Add room to chamber
- `DELETE /api/hydro/chambers/[chamberId]/rooms/[roomId]` - Remove room from chamber

### Psychrometric Readings
- `GET /api/hydro/psychrometrics?chamber_id={id}` - List readings for chamber
- `POST /api/hydro/psychrometrics` - Create reading

### Moisture Points
- `GET /api/hydro/moisture?chamber_id={id}` - List moisture points for chamber
- `POST /api/hydro/moisture` - Create moisture point

### Floor Plans
- `GET /api/hydro/floor-plans?job_id={id}` - List floor plans for job
- `POST /api/hydro/floor-plans` - Create floor plan
- `GET /api/hydro/floor-plans/[floorPlanId]` - Get floor plan
- `PUT /api/hydro/floor-plans/[floorPlanId]` - Update floor plan
- `DELETE /api/hydro/floor-plans/[floorPlanId]` - Delete floor plan
- `POST /api/hydro/floor-plans/[floorPlanId]/upload` - Upload floor plan image

### Rooms
- `GET /api/hydro/rooms?job_id={id}` - List rooms for job
- `POST /api/hydro/rooms` - Create room
- `GET /api/hydro/rooms/[roomId]` - Get room
- `PUT /api/hydro/rooms/[roomId]` - Update room
- `DELETE /api/hydro/rooms/[roomId]` - Delete room

### Moisture Maps
- `GET /api/hydro/moisture-maps?floor_plan_id={id}` - List maps for floor plan
- `POST /api/hydro/moisture-maps` - Create moisture map
- `GET /api/hydro/moisture-maps/[mapId]` - Get moisture map
- `DELETE /api/hydro/moisture-maps/[mapId]` - Delete moisture map

### Drying Logs
- `GET /api/hydro/drying-logs?chamber_id={id}` - List drying logs for chamber
- `POST /api/hydro/drying-logs` - Create drying log
- `GET /api/hydro/drying-logs/[logId]` - Get drying log
- `PUT /api/hydro/drying-logs/[logId]` - Update drying log
- `DELETE /api/hydro/drying-logs/[logId]` - Delete drying log

### Equipment Logs
- `GET /api/hydro/equipment?job_id={id}` - List equipment for job
- `POST /api/hydro/equipment` - Create equipment log

### Data Models
```typescript
interface Chamber {
  id: string
  job_id: string
  name: string
  description?: string
  chamber_type: 'standard' | 'containment' | 'negative_pressure'
  status: 'active' | 'completed' | 'archived'
  created_by: string
}

interface PsychrometricReading {
  id: string
  chamber_id: string
  room_id?: string
  reading_date: string
  reading_time?: string
  location: 'exterior' | 'unaffected' | 'affected' | 'hvac'
  ambient_temp_f?: number
  relative_humidity?: number
  grains_per_pound?: number
  notes?: string
}

interface MoisturePoint {
  id: string
  chamber_id: string
  room_id?: string
  floor_plan_id?: string
  x_position?: number
  y_position?: number
  material_type?: string
  moisture_reading?: number
  reading_unit: string
}

interface FloorPlan {
  id: string
  job_id: string
  name: string
  level: number
  image_storage_path?: string
  width?: number
  height?: number
  scale_factor?: number
  metadata: Record<string, unknown>
}

interface Room {
  id: string
  job_id: string
  floor_plan_id?: string
  name: string
  room_type?: string
  level: number
  coordinates?: Record<string, unknown>
  area_sqft?: number
  metadata: Record<string, unknown>
}

interface MoistureMap {
  id: string
  floor_plan_id: string
  chamber_id: string
  map_date: string
  overlay_image_storage_path?: string
  metadata: Record<string, unknown>
}

interface DryingLog {
  id: string
  chamber_id: string
  log_date: string
  summary_data: Record<string, unknown>
  notes?: string
  logged_by: string
}
```

---

## Content Management API (`/api/content`)

### Boxes
- `GET /api/content/boxes?job_id={id}` - List boxes for job
- `POST /api/content/boxes` - Create box
- `GET /api/content/boxes/[boxId]` - Get box
- `PUT /api/content/boxes/[boxId]` - Update box
- `DELETE /api/content/boxes/[boxId]` - Delete box

### Content Items
- `GET /api/content/items?job_id={id}` - List content items for job
- `POST /api/content/items` - Create content item
- `GET /api/content/items/[itemId]` - Get content item
- `PUT /api/content/items/[itemId]` - Update content item
- `DELETE /api/content/items/[itemId]` - Delete content item

### Data Models
```typescript
interface Box {
  id: string
  job_id: string
  box_number: string
  room_of_origin_id?: string
  current_location?: string
  location_details?: string
  packed_by: string
  packed_date: string
}

interface ContentItem {
  id: string
  job_id: string
  box_id?: string
  room_id?: string
  description: string
  condition_before?: string
  condition_after?: string
  estimated_value?: number
  photos: string[]
  notes?: string
}
```

---

## Integration API (`/api`)

### Job-Board Sync
- `POST /api/jobs/[jobId]/sync-to-board` - Sync job to board item
- `GET /api/jobs/[jobId]/board-item` - Get linked board item

### Item-Job Sync
- `POST /api/items/[itemId]/sync-to-job` - Sync board item to job
- `GET /api/items/[itemId]/job` - Get linked job

---

## Reports API (`/api/reports`)

- `GET /api/reports/jobs/[jobId]` - List reports for job
- `POST /api/reports/generate` - Generate report
- `GET /api/reports/[reportId]` - Get report
- `GET /api/reports/[reportId]/download` - Download report PDF
- `GET /api/reports/templates` - List report templates

---

## Automation API (`/api/automations`)

- `GET /api/automations?board_id={id}` - List automation rules
- `POST /api/automations` - Create automation rule
- `PUT /api/automations/[ruleId]` - Update automation rule
- `DELETE /api/automations/[ruleId]` - Delete automation rule
- `POST /api/automations/execute` - Manually execute automation

---

## Admin API (`/api/admin`)

- `GET /api/admin/dashboard` - Admin dashboard metrics
- `GET /api/admin/users` - List users
- `GET /api/admin/jobs` - List all jobs
- `GET /api/admin/jobs/[jobId]` - Get job details
- `POST /api/admin/jobs/[jobId]/assign` - Assign job to tech

---

## Response Format

All endpoints return responses in the format:
```typescript
{
  success: true,
  data: { ... }
}
```

Error responses:
```typescript
{
  error: true,
  message: string,
  code: string,
  statusCode: number
}
```
