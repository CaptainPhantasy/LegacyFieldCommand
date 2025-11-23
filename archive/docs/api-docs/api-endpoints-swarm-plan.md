# API Endpoints Swarm Orchestration Plan

## Overview
Deploy specialized agents to implement all missing API endpoints in parallel waves, following existing patterns and standards.

## Task Analysis

### Completed ✅
- Groups API (GET list, POST create, GET/PUT/DELETE by ID, PATCH reorder)

### Remaining Tasks

**Wave 1: Independent CRUD APIs** (Parallel - No dependencies)
1. Subitems API - Nested items/checklists
2. Dashboards API - Dashboard CRUD + metrics
3. Floor Plans API - Structure plans
4. Rooms API - Room definitions
5. Boxes API - Box tracking
6. Content Items API - Content inventory

**Wave 2: Dependent APIs** (After Wave 1)
7. Chamber Rooms API - Many-to-many associations (needs Rooms)
8. Moisture Maps API - Floor plan overlays (needs Floor Plans)
9. Drying Logs API - Time-series readings (needs Chambers)

**Wave 3: Integration APIs** (After Wave 1-2)
10. Job-Board Sync API - Sync job to board item
11. Item-Job Sync API - Sync board item to job

**Wave 4: Documentation** (After all APIs)
12. Update api-reference.md
13. Update api-spec.md
14. Update api-standards.md

## Patterns to Follow

### File Structure
```
apps/web/app/api/
├── [resource]/
│   ├── route.ts (GET list, POST create)
│   └── [resourceId]/
│       ├── route.ts (GET, PUT, DELETE)
│       └── [action]/route.ts (PATCH actions)
```

### Code Patterns
- Use `requireAuth` for authentication
- Use `validateRequest`, `validateQuery`, `validateParams` for validation
- Use Zod schemas for all validation
- Use `sanitizeError` and `errorResponse` for errors
- Use `successResponse` for success responses
- Use `getCacheHeaders` for GET endpoints
- Verify access via job/board relationships
- Follow existing response format: `{ success: true, data: {...} }`

### Reference Files
- `apps/web/app/api/groups/route.ts` - List/Create pattern
- `apps/web/app/api/groups/[groupId]/route.ts` - Get/Update/Delete pattern
- `apps/web/app/api/hydro/chambers/route.ts` - Hydro CRUD pattern
- `apps/web/app/api/boards/route.ts` - Board CRUD pattern

## Success Criteria

Each agent must:
1. ✅ Implement all specified endpoints
2. ✅ Follow existing patterns exactly
3. ✅ Include proper validation (Zod schemas)
4. ✅ Include proper error handling
5. ✅ Include proper authentication/authorization
6. ✅ Include cache headers for GET endpoints
7. ✅ Verify access via job/board relationships
8. ✅ No linting errors

## Coordination

- All agents update this file with progress
- Agents report completion with file paths
- Any issues or questions documented here
- Final validation after all waves complete

