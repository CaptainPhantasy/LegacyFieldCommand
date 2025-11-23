# Route Mapping for Testing

## Pages (31 total)

### Authentication & Routing (Agent 1)
- `/login` - Login/Signup page
- `/auth/signout` - Sign out route
- `/` - Root (role-based routing)
- `/unauthorized` - Unauthorized access page

### Admin Dashboard & Job Management (Agent 2)
- `/` - Admin dashboard (for admin/owner/estimator)
- `/jobs/new` - Create new job

### Field Tech Dashboard & Gates (Agent 3)
- `/field` - Field tech dashboard
- `/field/jobs/[id]` - Job detail for field tech
- `/field/job/[id]` - Alternative job detail route
- `/field/gates/[id]` - Gate screen
- `/field/gates/photos/[id]` - Photos gate screen

### Boards & Work Management (Agent 4)
- `/boards` - Board list
- `/boards/[boardId]` - Board detail

### Communications (Agent 5)
- `/communications` - Communications dashboard
- `/communications/email` - Email page
- `/communications/templates` - Email templates

### Estimates (Agent 6)
- `/estimates` - Estimates list
- `/estimates/generate` - Generate estimate
- `/estimates/[estimateId]` - Estimate detail

### Reports (Agent 7)
- `/jobs/[jobId]/reports` - Report generation

### Alerts & Monitoring (Agent 8)
- `/alerts` - Alerts list
- `/alerts/[alertId]` - Alert detail
- `/monitoring` - Monitoring dashboard

### Admin Features (Agent 9)
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - Users list
- `/admin/users/new` - Create user
- `/admin/users/[userId]` - User detail
- `/admin/policies` - Policies list
- `/admin/policies/upload` - Upload policy
- `/admin/policies/[policyId]` - Policy detail

### Hydro/Drying System (Agent 10)
- No dedicated pages found (API-only)

### Content Management (Agent 11)
- No dedicated pages found (API-only)

### Measurements (Agent 12)
- `/measurements` - Measurements page

### Templates (Agent 13)
- `/templates` - Templates page

### Other
- `/demo` - Demo page (can skip)

## API Endpoints (105+ total)

### Authentication & Routing (Agent 1)
- `/api/auth/signout` (if exists)

### Admin Dashboard & Job Management (Agent 2)
- `/api/admin/jobs` - GET, POST
- `/api/admin/jobs/[jobId]` - GET, PUT, DELETE
- `/api/admin/jobs/[jobId]/assign` - POST

### Field Tech Dashboard & Gates (Agent 3)
- `/api/field/jobs` - GET
- `/api/field/jobs/[jobId]` - GET
- `/api/field/gates/[gateId]` - GET
- `/api/field/gates/[gateId]/complete` - POST
- `/api/field/gates/[gateId]/exception` - POST
- `/api/field/photos/[photoId]/url` - GET
- `/api/field/context` - GET, POST
- `/api/field/voice/command` - POST

### Boards & Work Management (Agent 4)
- `/api/boards` - GET, POST
- `/api/boards/[boardId]` - GET, PUT, DELETE
- `/api/groups` - GET, POST
- `/api/groups/[groupId]` - GET, PUT, DELETE
- `/api/groups/[groupId]/reorder` - PATCH
- `/api/items` - GET, POST
- `/api/items/bulk` - DELETE
- `/api/items/[itemId]` - GET, PUT, DELETE
- `/api/items/[itemId]/column-values` - PUT
- `/api/items/[itemId]/comments` - GET, POST
- `/api/items/[itemId]/attachments` - GET, POST
- `/api/items/[itemId]/attachments/[attachmentId]` - DELETE
- `/api/items/[itemId]/activity` - GET
- `/api/items/[itemId]/job` - GET
- `/api/items/[itemId]/sync-to-job` - POST
- `/api/subitems` - GET, POST
- `/api/subitems/[subitemId]` - GET, PUT, DELETE
- `/api/subitems/[subitemId]/complete` - PATCH
- `/api/columns` - GET, POST
- `/api/columns/[columnId]` - GET, PUT, DELETE
- `/api/views` - GET, POST
- `/api/dashboards` - GET, POST
- `/api/dashboards/[dashboardId]` - GET, PUT, DELETE
- `/api/dashboards/[dashboardId]/metrics` - GET
- `/api/jobs/[jobId]/board-item` - GET
- `/api/jobs/[jobId]/sync-to-board` - POST

### Communications (Agent 5)
- `/api/communications/email/send` - POST
- `/api/communications/email/templates` - GET, POST
- `/api/communications/email/templates/[templateId]` - GET, PUT, DELETE
- `/api/communications/history/[jobId]` - GET
- `/api/communications/voice/interpret` - POST
- `/api/communications/voice/transcribe` - POST

### Estimates (Agent 6)
- `/api/estimates` - GET, POST
- `/api/estimates/generate` - POST
- `/api/estimates/[estimateId]` - GET, PUT, DELETE
- `/api/estimates/[estimateId]/export` - GET
- `/api/estimates/[estimateId]/apply-coverage` - POST
- `/api/estimates/[estimateId]/line-items` - GET, POST

### Reports (Agent 7)
- `/api/reports/generate` - POST
- `/api/reports/templates` - GET, POST
- `/api/reports/[reportId]` - GET, PUT, DELETE
- `/api/reports/[reportId]/download` - GET
- `/api/reports/jobs/[jobId]` - GET

### Alerts & Monitoring (Agent 8)
- `/api/alerts` - GET, POST
- `/api/alerts/[alertId]` - GET, PUT, DELETE
- `/api/alerts/[alertId]/acknowledge` - POST
- `/api/alerts/rules` - GET, POST
- `/api/monitoring/dashboard` - GET
- `/api/monitoring/compliance` - GET
- `/api/monitoring/jobs/stale` - GET
- `/api/monitoring/gates/missing` - GET

### Admin Features (Agent 9)
- `/api/admin/dashboard` - GET
- `/api/admin/users` - GET, POST
- `/api/admin/users/[userId]` - GET, PUT, DELETE
- `/api/admin/users/[userId]/jobs` - GET
- `/api/admin/policies` - GET, POST
- `/api/admin/policies/upload` - POST
- `/api/admin/policies/parse` - POST
- `/api/admin/policies/[policyId]` - GET, PUT, DELETE
- `/api/admin/policies/[policyId]/link` - POST
- `/api/admin/policies/[policyId]/coverage` - GET
- `/api/admin/photos/[photoId]/url` - GET

### Hydro/Drying System (Agent 10)
- `/api/hydro/chambers` - GET, POST
- `/api/hydro/chambers/[chamberId]` - GET, PUT, DELETE
- `/api/hydro/chambers/[chamberId]/rooms` - GET, POST
- `/api/hydro/chambers/[chamberId]/rooms/[roomId]` - DELETE
- `/api/hydro/rooms` - GET, POST
- `/api/hydro/rooms/[roomId]` - GET, PUT, DELETE
- `/api/hydro/floor-plans` - GET, POST
- `/api/hydro/floor-plans/[floorPlanId]` - GET, PUT, DELETE
- `/api/hydro/floor-plans/[floorPlanId]/upload` - POST
- `/api/hydro/moisture-maps` - GET, POST
- `/api/hydro/moisture-maps/[mapId]` - GET, PUT, DELETE
- `/api/hydro/moisture` - GET, POST
- `/api/hydro/psychrometrics` - GET, POST
- `/api/hydro/drying-logs` - GET, POST
- `/api/hydro/drying-logs/[logId]` - GET, PUT, DELETE
- `/api/hydro/equipment` - GET, POST

### Content Management (Agent 11)
- `/api/content/items` - GET, POST
- `/api/content/items/[itemId]` - GET, PUT, DELETE
- `/api/content/boxes` - GET, POST
- `/api/content/boxes/[boxId]` - GET, PUT, DELETE

### Measurements (Agent 12)
- `/api/measurements/upload` - POST
- `/api/measurements/by-job/[jobId]` - GET
- `/api/measurements/by-id/[measurementId]/link` - POST

### Templates (Agent 13)
- `/api/templates` - GET, POST
- `/api/templates/[templateId]` - GET, PUT, DELETE
- `/api/jobs/[jobId]/apply-template` - POST

### Other APIs (Agent 14)
- `/api/automations` - GET, POST
- `/api/automations/execute` - POST
- `/api/integrations/webhook` - POST
- `/api/integrations/status` - GET
- `/api/integrations/corelogic/export` - POST
- `/api/integrations/xactimate/export` - POST
- `/api/mcp` - GET, POST
- `/api/llm/test` - POST

