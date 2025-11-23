# Database Schema Reference

## Existing Tables

### Core Tables
- `profiles` - User profiles with roles
- `accounts` - Multi-tenant accounts
- `jobs` - Job records
- `job_gates` - Gate/stage tracking
- `job_photos` - Photo evidence
- `audit_logs` - Audit trail

## New Tables (To Be Created)

### Work Management Tables
- `workspaces` - Workspace/tenant isolation
- `boards` - Work management boards
- `groups` - Board groups (sections)
- `items` - Board items (rows)
- `subitems` - Nested items
- `columns` - Column definitions
- `column_values` - Item field values
- `views` - View configurations
- `dashboards` - Dashboard definitions
- `automation_rules` - Automation rules

### Hydro/Drying Tables
- `chambers` - Drying chambers
- `psychrometric_readings` - Temp/RH/GPP readings
- `moisture_points` - Moisture measurement points
- `moisture_maps` - Floor plan overlays
- `drying_logs` - Time-series drying data
- `equipment_logs` - Detailed equipment tracking
- `rooms` - Room definitions
- `floor_plans` - Structure plans

## Indexes (To Be Created)

See `supabase/migrations/add_performance_indexes.sql` for full list.

Key indexes:
- `idx_jobs_status` - Jobs by status
- `idx_jobs_created_at_desc` - Jobs by creation date
- `idx_job_gates_job_id_status` - Gates by job and status
- `idx_job_photos_job_id_created_at` - Photos by job and date

## Materialized Views (To Be Created)

- `dashboard_metrics` - Aggregate dashboard metrics

