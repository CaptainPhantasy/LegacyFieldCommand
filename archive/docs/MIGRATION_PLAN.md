# Mobile App Migration Plan

## Decision: Consolidate to Single Web App

We're removing the React Native mobile app (`apps/mobile`) and consolidating everything into the Next.js web app (`apps/web`).

### Why?
- **Single codebase** - easier to maintain
- **Works on all devices** - responsive web design
- **No sync complexity** - direct Supabase queries
- **Easier testing** - can test in browser
- **Faster development** - no native build process

### Migration Steps

1. ✅ **Role-based routing** - Root page checks user role:
   - `field_tech` → `/field` (field app)
   - `admin/owner/estimator` → `/` (admin dashboard)

2. ✅ **Field dashboard** - `/field` shows jobs assigned to the tech

3. **Next steps:**
   - Create `/field/jobs/[id]` - Job detail with gates
   - Create `/field/gates/[id]` - Gate screens (Arrival, Photos, etc.)
   - Port gate validation logic
   - Add HTML5 camera API for photo capture
   - Add geolocation API for GPS

4. **Remove:**
   - `apps/mobile/` directory (after migration complete)
   - WatermelonDB sync logic (no longer needed)

### File Structure
```
apps/web/
  app/
    /              → Admin dashboard (admin/owner/estimator)
    /field/        → Field app (field_tech)
      /jobs/[id]   → Job detail with gates
      /gates/[id]  → Individual gate screens
    /jobs/new      → Create job (admin only)
    /login         → Login (all users)
```

This keeps everything in one place, no duplication, no conflicts.

