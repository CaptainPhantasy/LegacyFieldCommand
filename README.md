# Legacy Field Command

**Last Updated:** 2025-01-23  
**Status:** ~70% Complete - Framework Phase  
**Version:** 0.7.0

A white-labeled field service management platform for restoration contractors. Built with Next.js (web), React Native/Expo (mobile), and Supabase (backend).

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Quick Start](#quick-start)
3. [Environment Setup](#environment-setup)
4. [Database Schema](#database-schema)
5. [User Roles & Permissions](#user-roles--permissions)
6. [API Architecture](#api-architecture)
7. [Development Patterns](#development-patterns)
8. [Current Status](#current-status)

---

## Project Structure

```
legacy-field-command/
├── apps/
│   ├── web/              # Next.js admin dashboard and CRM
│   │   ├── app/          # Next.js app router (pages & API routes)
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities, validation, API middleware
│   │   └── hooks/        # React Query hooks
│   └── mobile/           # React Native (Expo) field app
├── supabase/
│   ├── migrations/       # Database migrations (run in order)
│   └── schema.sql        # Reference schema (DO NOT RUN)
├── packages/             # Shared TypeScript types
└── scripts/              # Utility scripts (user management, cleanup, etc.)
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase project
- npm or yarn

### Setup

1. **Clone and install:**
   ```bash
   cd legacy-field-command
   npm install
   ```

2. **Configure environment:**
   - Copy `apps/web/.env.example` to `apps/web/.env.local`
   - Add Supabase credentials (see [Environment Setup](#environment-setup))

3. **Run migrations:**
   - Apply migrations in `supabase/migrations/` via Supabase Dashboard
   - See `supabase/MIGRATION_EXECUTION_ORDER.md` for order

4. **Start development:**
   ```bash
   # Web app
   cd apps/web
   npm run dev

   # Mobile app
   cd apps/mobile
   npx expo start
   ```

---

## Environment Setup

### Required Variables (`apps/web/.env.local`)

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LLM Features (Optional)
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
LLM_ENABLED=true
LLM_OPENAI_ENABLED=true
LLM_ANTHROPIC_ENABLED=true
```

### Scripts Environment

Scripts in `scripts/` require:
- `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

These can be in project root `.env` or `apps/web/.env.local`.

---

## Database Schema

### Core Tables

**User Management:**
- `profiles` - User profiles with roles (extends auth.users)
- `accounts` - Multi-tenant accounts/organizations

**Job Management:**
- `jobs` - Job records
- `job_gates` - Gate/stage tracking (7 gates: Arrival, Intake, Photos, Moisture/Equipment, Scope, Sign-offs, Departure)
- `job_photos` - Photo evidence
- `audit_logs` - Audit trail

**Work Management (Monday.com-style):**
- `boards` - Work management boards
- `groups` - Board groups (sections)
- `items` - Board items (rows)
- `subitems` - Nested items/checklists
- `columns` - Column definitions (14 types)
- `column_values` - Item field values
- `views` - View configurations
- `dashboards` - Dashboard definitions
- `automation_rules` - Automation rules
- `automation_executions` - Automation execution logs

**Field Documentation (Encircle-style):**
- `chambers` - Drying chambers
- `chamber_rooms` - Chamber-room associations
- `psychrometric_readings` - Temp/RH/GPP readings
- `moisture_points` - Moisture measurement points
- `moisture_maps` - Floor plan overlays
- `drying_logs` - Time-series drying data
- `equipment_logs` - Detailed equipment tracking
- `rooms` - Room definitions
- `floor_plans` - Structure plans
- `boxes` - Box tracking
- `content_items` - Content inventory

**Additional Features:**
- `policies` - Insurance policy documents
- `email_templates` - Email templates
- `communications` - Communication history
- `estimates` - Job estimates
- `estimate_line_items` - Estimate line items
- `alert_rules` - Alert rules
- `alerts` - Alert records
- `monitoring_metrics` - Monitoring metrics
- `job_templates` - Job templates
- `measurements` - 3D measurement files
- `reports` - Generated reports
- `report_templates` - Report templates

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies. See:
- Individual migration files for table-specific policies
- `supabase/migrations/fix_security_lints.sql` for security fixes

### Schema Reference

- **Reference file:** `supabase/schema.sql` (DO NOT RUN - reference only)
- **Migrations:** `supabase/migrations/` (run in order via Supabase Dashboard)
- **Execution order:** See `supabase/MIGRATION_EXECUTION_ORDER.md`

---

## User Roles & Permissions

### Role Hierarchy (Lowest to Highest)

1. **`field_tech`** - Field Technician
   - View assigned jobs
   - Complete job gates
   - Upload photos, add moisture readings, log equipment
   - Access field dashboard (`/field`)

2. **`lead_tech`** - Lead Technician
   - All `field_tech` privileges
   - Can be assigned as lead technician on jobs

3. **`estimator`** - Estimator
   - All `field_tech` privileges
   - Create and manage estimates
   - View all jobs (for estimation)
   - Access estimates dashboard

4. **`admin`** - Administrator
   - All `estimator` privileges
   - User management (create, edit, delete users)
   - Policy management (upload, parse, link policies)
   - System administration (admin dashboard, metrics, alerts)
   - Full job access (view all, create, assign)
   - Access all measurements, communications, templates

5. **`program_admin`** - Program Administrator
   - All `admin` privileges
   - Program-level management
   - Job template management
   - Multi-tenant capabilities (future)

6. **`owner`** - Owner (Highest Level)
   - **ALL PRIVILEGES** - No restrictions
   - Ultimate system authority
   - Can manage all users including other admins
   - Full access to all data and features

### Role Access Matrix

| Feature | field_tech | lead_tech | estimator | admin | program_admin | owner |
|---------|-----------|-----------|----------|-------|---------------|-------|
| View Own Jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Complete Gates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Estimates | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| View All Jobs | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Policies | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Admin Dashboard | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |

### Setting Owner Role

Use scripts in `scripts/`:
- `grant_god_admin.js` - Interactive script
- `grant_god_admin_direct.sql` - Direct SQL (fastest)

See `scripts/GRANT_GOD_ADMIN_README.md` for details.

---

## API Architecture

### Endpoint Structure

**106+ API endpoints** organized by domain:
- `/api/field/*` - Field operations (jobs, gates, photos)
- `/api/admin/*` - Admin operations (users, policies, dashboard)
- `/api/boards/*` - Work management (boards, items, columns)
- `/api/hydro/*` - Field documentation (chambers, moisture, equipment)
- `/api/estimates/*` - Estimate management
- `/api/reports/*` - Report generation
- `/api/alerts/*` - Alert management
- `/api/communications/*` - Email, templates, history
- `/api/templates/*` - Job templates
- `/api/automations/*` - Automation rules and execution
- `/api/integrations/*` - External integrations (Xactimate, CoreLogic)

### Authentication

All endpoints require authentication via:
- Supabase session cookie (web)
- Bearer token (API clients)

### Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "error": true,
  "message": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### API Standards

All endpoints follow consistent patterns:
- **Validation:** Zod schemas via `validateRequest()`, `validateQuery()`, `validateParams()`
- **Error Handling:** Sanitized errors via `sanitizeError()` and `createApiErrorFromSanitized()`
- **Rate Limiting:** Handled in middleware automatically
- **Pagination:** Offset-based with `limit` and `offset` query params
- **Cache Headers:** Applied via `getCacheHeaders()` utility

See `shared-docs/api-standards.md` for detailed patterns and examples.

---

## Development Patterns

### Error Handling

**API Level:**
- Use `ApiError` class with status codes
- Sanitize errors (detailed logs server-side, generic messages to client)
- Role-specific error codes: `FORBIDDEN_ADMIN_REQUIRED`, `FORBIDDEN_ESTIMATOR_REQUIRED`, etc.

**UI Level:**
- `PermissionDenied` component for role-based denials
- `ApiErrorDisplay` component for API errors
- User-friendly messages via `getPermissionDenialMessage()`

### Validation

All API routes use Zod validation:

```typescript
import { validateRequest } from '@/lib/validation/validator';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1),
  job_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const validationResult = await validateRequest(request, schema);
  if (validationResult.error) return validationResult.error;
  // Use validated data
}
```

### File Uploads

Use FormData with validation:

```typescript
const formData = await request.formData();
const file = formData.get('file') as File;

// Validate type and size
if (!file.type.startsWith('image/')) {
  throw new ApiError('File must be an image', 400);
}

// Upload to Supabase Storage
const { data } = await supabase.storage
  .from('bucket-name')
  .upload(path, file);
```

### Access Control

Always verify access:

```typescript
// For job-related resources
const { data: job } = await supabase
  .from('jobs')
  .select('id, lead_tech_id')
  .eq('id', job_id)
  .single();

if (!job) throw new ApiError('Job not found', 404);

if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
  throw new ApiError('Forbidden', 403);
}
```

---

## Current Status

### ✅ Completed (~70%)

**Core Infrastructure:**
- ✅ Database schema (all tables, RLS policies)
- ✅ Authentication & authorization
- ✅ 106+ API endpoints (CRUD operations)
- ✅ Error handling & validation
- ✅ Rate limiting & security

**Work Management:**
- ✅ Boards, items, columns, views
- ✅ Table view with inline editing
- ✅ Kanban view
- ✅ Automation engine

**Field Documentation:**
- ✅ Chambers, psychrometrics, moisture points
- ✅ Equipment tracking
- ✅ Floor plans, rooms, boxes
- ✅ Content inventory

**Additional Features:**
- ✅ Job templates
- ✅ Estimates
- ✅ Reports (PDF generation)
- ✅ Alerts & monitoring
- ✅ Communications (email, templates)
- ✅ Admin dashboard
- ✅ User management
- ✅ Policy management

### 🔄 In Progress / Pending

**UI/UX:**
- 🔄 Layout improvements (full-width layouts)
- 🔄 Mobile responsiveness
- 🔄 Loading states & empty states

**Testing:**
- 🔄 E2E test coverage
- 🔄 Integration tests
- 🔄 Performance testing

**Features:**
- 🔄 Voice commands (LLM integration)
- 🔄 Advanced integrations (Xactimate, CoreLogic)
- 🔄 Mobile app completion

---

## Key Routes

### Pages (31 total)

**Authentication:**
- `/login` - Login page
- `/` - Root (role-based routing)
- `/unauthorized` - Unauthorized access

**Field Tech:**
- `/field` - Field dashboard
- `/field/jobs/[id]` - Job detail
- `/field/gates/[id]` - Gate screen
- `/field/gates/photos/[id]` - Photos gate

**Admin:**
- `/` - Admin dashboard (for admin/owner/estimator)
- `/admin/users` - User management
- `/admin/policies` - Policy management
- `/admin/dashboard` - Admin metrics

**Work Management:**
- `/boards` - Board list
- `/boards/[boardId]` - Board detail

**Other:**
- `/estimates` - Estimates list
- `/alerts` - Alerts list
- `/communications` - Communications hub
- `/templates` - Job templates
- `/measurements` - 3D measurements
- `/monitoring` - Monitoring dashboard

---

## Scripts

Utility scripts in `scripts/`:

- `cleanup_test_jobs.js` - Delete test jobs from database
- `cleanup_test_data.js` - Delete old automation executions
- `create_user.js` - Create new user
- `update_user_role.js` - Update user role
- `grant_god_admin.js` - Grant owner role
- `assign_job_to_tech.js` - Assign job to technician

All scripts require environment variables (see [Environment Setup](#environment-setup)).

---

## Notes for AI Agents

### Codebase Truth

**Always verify against actual code:**
- Database schema: Check `supabase/schema.sql` and migrations
- API endpoints: Check `apps/web/app/api/` directory
- User roles: Check `supabase/schema.sql` (user_role enum)
- Routes: Check `apps/web/app/` directory structure

**For detailed reference documentation:**
- See `docs/` folder for in-depth guides on specific topics
- Database schema details: `docs/database-schema.md`
- API patterns: `docs/api-standards.md`
- User roles: `docs/user-roles-and-privileges.md`
- Error handling: `docs/error-handling-and-permissions.md`

### Development Guidelines

1. **Follow existing patterns** - Use established validation, error handling, and access control patterns
2. **RLS policies** - All database access is filtered by RLS; verify policies exist
3. **Role-based access** - Check user role before allowing operations
4. **Validation first** - Always validate input with Zod schemas
5. **Error handling** - Use sanitized error handling for security

### Common Issues

- **Layout constraints:** Use `app-shell` and `app-shell-inner` classes for full-width layouts
- **Test data:** Use cleanup scripts to remove test jobs/executions
- **Environment variables:** Required for scripts and API features

---

## Additional Documentation

**Setup Guides:**
- `STORAGE_BUCKET_SETUP.md` - Storage bucket configuration
- `SUPABASE_AUTH_SETUP.md` - Authentication setup
- `NGROK_SETUP.md` - Development tunnel setup

**Workflow Documentation:**
- `UX_WORKFLOW_DOCUMENTATION.md` - Complete UX workflow reference (1600+ lines)
- `USER_JOURNEYS.md` - Daily user journey flows
- `GATE_REQUIREMENTS.md` - Gate workflow requirements

**Detailed Reference Docs (in `docs/`):**
For more depth on specific topics, see the `docs/` folder:
- `database-schema.md` - Complete database schema reference
- `user-roles-and-privileges.md` - Detailed role documentation with access matrix
- `api-standards.md` - API development patterns and examples
- `error-handling-and-permissions.md` - Error handling architecture and patterns
- `ENV_SETUP_INSTRUCTIONS.md` - Environment variable setup guide
- `LLM_API_KEYS_SETUP.md` - LLM feature setup and configuration

---

## Archive

Historical documentation moved to `archive/`:
- **Root docs:** Implementation verification, accessibility analysis, asset integration summaries
- **Shared docs:** Audit summaries, implementation plans, swarm coordination docs, component audits
- **Outdated:** API specs, route mappings (verify against actual code)

---

**Last Updated:** 2025-01-23  
**Status:** ~70% Complete - Framework Phase  
**Maintained by:** Development Team
