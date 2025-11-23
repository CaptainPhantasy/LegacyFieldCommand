# Swarm Coordination - Field App Migration to Web

## Mission
Migrate React Native mobile app to web-based field app in Next.js, consolidating to single codebase.

## Task Breakdown & Dependencies

### Wave 1: Foundation (Parallel)
- **Agent 1**: Create field job detail page with gates list
- **Agent 2**: Create gate validation utilities (port from mobile)
- **Agent 3**: Set up HTML5 camera component for web

### Wave 2: Gate Screens (Parallel)
- **Agent 4**: Create Arrival Gate screen with photo capture
- **Agent 5**: Create Photos Gate screen with room-by-room capture
- **Agent 6**: Create placeholder screens for other gates (Intake, Moisture/Equipment, Scope, Sign-offs, Departure)

### Wave 3: Integration & Testing
- **Agent 7**: Wire up navigation and routing
- **Agent 8**: Test complete flow end-to-end
- **Agent 9**: Fix any errors and validate

## Success Criteria
- ✅ Field tech can log in and see assigned jobs
- ✅ Can view job detail with all 7 gates
- ✅ Can complete Arrival gate with photo
- ✅ Can complete Photos gate with room documentation
- ✅ All gates accessible and functional
- ✅ No errors in server logs
- ✅ Works on mobile browsers (responsive)

## Shared State
- Base URL: `/field`
- Job detail: `/field/jobs/[id]`
- Gate detail: `/field/gates/[id]`
- Using Supabase directly (no WatermelonDB)
- HTML5 APIs: camera, geolocation

