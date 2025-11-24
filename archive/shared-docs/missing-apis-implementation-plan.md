# Missing APIs Implementation Plan

## Chain of Thought Analysis

### Current State
- **Missing APIs**: Comments, File Attachments, Activity Log
- **Database**: No tables exist for item comments or attachments
- **Frontend**: ItemDetailsPanel has placeholder UI for all three features
- **Pattern**: Existing APIs follow consistent patterns (requireAuth, Zod validation, error handling)

### Success Criteria (98%+ confidence)
1. ✅ All three API sets fully implemented
2. ✅ Database migrations created and tested
3. ✅ Frontend hooks created and wired
4. ✅ ItemDetailsPanel fully functional
5. ✅ All endpoints follow existing patterns
6. ✅ RLS policies in place
7. ✅ File uploads work with Supabase Storage

### Dependencies
- **Wave 1**: Database migrations (parallel - no dependencies)
  - item_comments table
  - item_attachments table  
  - item_activity_logs table (or extend audit_logs)
- **Wave 2**: API endpoints (depends on Wave 1)
  - Comments API
  - Attachments API
  - Activity API
- **Wave 3**: Frontend integration (depends on Wave 2)
  - React hooks
  - ItemDetailsPanel updates

### Implementation Strategy

#### Database Schema Design
1. **item_comments**: Comments/updates on items
   - id, item_id, user_id, content, created_at, updated_at
   - RLS: Users can view comments for items they can access
   - RLS: Users can create comments for items they can access
   - RLS: Users can edit/delete their own comments

2. **item_attachments**: File attachments on items
   - id, item_id, user_id, file_name, storage_path, file_size, mime_type, created_at
   - RLS: Users can view attachments for items they can access
   - RLS: Users can upload attachments for items they can access
   - RLS: Users can delete their own attachments (or all if admin)

3. **item_activity_logs**: Activity tracking for items
   - id, item_id, user_id, action, details (JSONB), created_at
   - Or extend audit_logs to support item_id
   - RLS: Users can view activity for items they can access

#### API Endpoints

**Comments API** (`/api/items/[itemId]/comments`)
- GET: List comments for item (ordered by created_at desc)
- POST: Create new comment

**Attachments API** (`/api/items/[itemId]/attachments`)
- GET: List attachments for item
- POST: Upload attachment (FormData with file)
- DELETE `/api/items/[itemId]/attachments/[attachmentId]`: Delete attachment

**Activity API** (`/api/items/[itemId]/activity`)
- GET: List activity log entries for item (ordered by created_at desc)

#### Frontend Integration
- Create hooks: `useComments`, `useAttachments`, `useActivity`
- Update ItemDetailsPanel to use real data
- Add file upload UI
- Add comment creation UI
- Display activity timeline

### Risk Assessment
- **Low Risk**: Well-defined patterns, existing examples
- **Medium Risk**: File uploads need storage bucket setup
- **Mitigation**: Follow existing file upload patterns exactly

### Testing Strategy
1. Test database migrations
2. Test API endpoints (auth, validation, RLS)
3. Test file uploads
4. Test frontend integration
5. End-to-end testing in ItemDetailsPanel

## Task Breakdown

### Agent 1: Database Migrations
- Create migration for item_comments table
- Create migration for item_attachments table
- Create migration for item_activity_logs table
- Add RLS policies for all tables
- Add indexes for performance

### Agent 2: Comments API
- Create GET /api/items/[itemId]/comments endpoint
- Create POST /api/items/[itemId]/comments endpoint
- Add validation schemas
- Add error handling
- Test endpoints

### Agent 3: Attachments API
- Create GET /api/items/[itemId]/attachments endpoint
- Create POST /api/items/[itemId]/attachments endpoint (file upload)
- Create DELETE /api/items/[itemId]/attachments/[attachmentId] endpoint
- Add file validation (type, size)
- Test file uploads

### Agent 4: Activity API
- Create GET /api/items/[itemId]/activity endpoint
- Add activity logging triggers/hooks
- Test activity retrieval

### Agent 5: Frontend Hooks
- Create useComments hook
- Create useAttachments hook
- Create useActivity hook
- Test hooks

### Agent 6: Frontend Integration
- Update ItemDetailsPanel Updates tab
- Update ItemDetailsPanel Files tab
- Update ItemDetailsPanel Activity tab
- Add file upload UI
- Test all tabs

## Execution Order
1. **Wave 1** (Parallel): Database migrations
2. **Wave 2** (Parallel): API endpoints (after Wave 1)
3. **Wave 3** (Parallel): Frontend hooks (after Wave 2)
4. **Wave 4**: Frontend integration (after Wave 3)
5. **Wave 5**: Testing and validation

