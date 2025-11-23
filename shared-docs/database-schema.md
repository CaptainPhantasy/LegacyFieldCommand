# Database Schema Reference

## Overview

This document provides a reference for the current database schema. All tables listed here are **already created** in the database.

## Core Tables

### User Management
- `profiles` - User profiles with roles (extends auth.users)
- `accounts` - Multi-tenant accounts/organizations

### Job Management
- `jobs` - Job records
- `job_gates` - Gate/stage tracking (Arrival, Intake, Photos, etc.)
- `job_photos` - Photo evidence
- `audit_logs` - Audit trail

## Work Management Tables

All work management tables are **already created**:
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

## Field Documentation Tables

All field documentation tables are **already created**:
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

## Additional Tables

All additional tables are **already created**:
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

## Indexes

Performance indexes are created via `migrations/add_performance_indexes.sql`.

## Materialized Views

- `dashboard_metrics` - Aggregate dashboard metrics (accessed via secure function `get_dashboard_metrics()`)

## Row Level Security

All tables have RLS enabled with appropriate policies. See:
- Individual migration files for table-specific policies
- `migrations/fix_security_lints.sql` for security fixes
- `migrations/fix_field_documentation_rls_with_check.sql` for field documentation RLS

## Migration Files

All schema changes are managed through migration files in `supabase/migrations/`:
- See `MIGRATION_EXECUTION_ORDER.md` for execution order
- All migrations are idempotent (safe to re-run)

## Schema Reference File

For a complete SQL reference, see `supabase/schema.sql` (reference only, do not run directly).

