-- ============================================================================
-- Comprehensive Schema for New Features
-- ============================================================================
-- This migration adds:
-- 1. Monday.com-style Work Management Layer (boards, items, columns, views, automations)
-- 2. Encircle-style Field Documentation Layer (hydro, chambers, moisture, reports)
-- 3. Performance indexes and materialized views
-- 4. Proper RLS policies and triggers
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 1: MONDAY.COM-STYLE WORK MANAGEMENT LAYER
-- ============================================================================

-- 1.1 WORKSPACES (Multi-tenant support - can use existing accounts table or create workspaces)
-- Note: Using accounts table as workspace, but adding workspace-specific fields if needed
-- If accounts already exists, we'll just add any missing fields

-- 1.2 BOARDS (Work management tables)
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  board_type TEXT NOT NULL, -- 'sales_leads', 'estimates', 'bdm_accounts', 'field', 'mitigation_ar', 'shop_equipment', 'commissions', 'active_jobs'
  icon TEXT, -- Icon identifier
  color TEXT, -- Color code
  is_template BOOLEAN DEFAULT FALSE,
  template_id UUID REFERENCES public.boards(id), -- If created from template
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 GROUPS (Color-coded sections within boards)
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0, -- Order within board
  color TEXT, -- Group color
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, position)
);

-- 1.4 ITEMS (Rows/records in boards)
CREATE TABLE IF NOT EXISTS public.items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0, -- Order within group
  is_archived BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 SUBITEMS (Nested rows/checklists)
CREATE TABLE IF NOT EXISTS public.subitems (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_by UUID REFERENCES public.profiles(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 COLUMNS (Field definitions)
CREATE TYPE column_type AS ENUM (
  'text', 'long_text', 'numbers', 'status', 'date', 'people', 'tags', 
  'timeline', 'link', 'file', 'checkbox', 'rating', 'formula', 'dependency'
);

CREATE TABLE IF NOT EXISTS public.columns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  column_type column_type NOT NULL DEFAULT 'text',
  position INTEGER NOT NULL DEFAULT 0, -- Order within board
  width INTEGER DEFAULT 200, -- Column width in pixels
  settings JSONB DEFAULT '{}'::jsonb, -- Type-specific settings (e.g., status options, date format)
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(board_id, position)
);

-- 1.7 COLUMN_VALUES (Item field values)
CREATE TABLE IF NOT EXISTS public.column_values (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  column_id UUID REFERENCES public.columns(id) ON DELETE CASCADE NOT NULL,
  value JSONB, -- Flexible JSONB to store any type of value
  text_value TEXT, -- Denormalized text for search/filtering
  numeric_value DECIMAL(20, 4), -- Denormalized numeric for calculations
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_id, column_id)
);

-- 1.8 VIEWS (View configurations: table, Kanban, calendar, timeline, chart)
CREATE TYPE view_type AS ENUM ('table', 'kanban', 'calendar', 'timeline', 'chart', 'gantt');

CREATE TABLE IF NOT EXISTS public.views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  view_type view_type NOT NULL DEFAULT 'table',
  settings JSONB DEFAULT '{}'::jsonb, -- View-specific settings (filters, sorting, grouping, etc.)
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.9 DASHBOARDS (Aggregate metrics across boards)
CREATE TABLE IF NOT EXISTS public.dashboards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB DEFAULT '[]'::jsonb, -- Widget layout configuration
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.10 AUTOMATION_RULES (Trigger/condition/action engine)
CREATE TYPE automation_trigger_type AS ENUM (
  'item_created', 'item_updated', 'column_changed', 'date_reached', 
  'status_changed', 'dependency_completed'
);

CREATE TYPE automation_action_type AS ENUM (
  'update_column', 'move_to_group', 'create_item', 'send_notification',
  'change_status', 'assign_person', 'add_tag', 'create_subitem'
);

CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  trigger_type automation_trigger_type NOT NULL,
  trigger_config JSONB DEFAULT '{}'::jsonb, -- Trigger-specific configuration
  conditions JSONB DEFAULT '[]'::jsonb, -- Array of condition objects
  actions JSONB DEFAULT '[]'::jsonb, -- Array of action objects
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.11 AUTOMATION_EXECUTIONS (Log of automation runs)
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  trigger_data JSONB DEFAULT '{}'::jsonb,
  execution_status TEXT DEFAULT 'success', -- 'success', 'failed', 'skipped'
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 2: ENCIRCLE-STYLE FIELD DOCUMENTATION LAYER
-- ============================================================================

-- 2.1 FLOOR_PLANS (Structure plans, levels)
CREATE TABLE IF NOT EXISTS public.floor_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g., "First Floor", "Basement"
  level INTEGER DEFAULT 1, -- Floor level
  image_storage_path TEXT, -- Path to floor plan image
  width DECIMAL(10, 2), -- Width in feet/meters
  height DECIMAL(10, 2), -- Height in feet/meters
  scale_factor DECIMAL(10, 4), -- Pixels per unit
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 ROOMS (Room definitions)
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  floor_plan_id UUID REFERENCES public.floor_plans(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  room_type TEXT, -- 'bedroom', 'kitchen', 'bathroom', 'living_room', etc.
  level INTEGER DEFAULT 1,
  coordinates JSONB, -- Polygon coordinates for room boundaries
  area_sqft DECIMAL(10, 2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 CHAMBERS (Drying chambers grouping affected rooms)
CREATE TABLE IF NOT EXISTS public.chambers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g., "Chamber 1", "Main Floor Chamber"
  description TEXT,
  chamber_type TEXT DEFAULT 'standard', -- 'standard', 'containment', 'negative_pressure'
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'archived'
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 CHAMBER_ROOMS (Many-to-many: chambers contain rooms)
CREATE TABLE IF NOT EXISTS public.chamber_rooms (
  chamber_id UUID REFERENCES public.chambers(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (chamber_id, room_id)
);

-- 2.5 PSYCHROMETRIC_READINGS (Ambient temp, RH, GPP for exterior/unaffected/affected/HVAC)
CREATE TYPE reading_location AS ENUM ('exterior', 'unaffected', 'affected', 'hvac');

CREATE TABLE IF NOT EXISTS public.psychrometric_readings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chamber_id UUID REFERENCES public.chambers(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  reading_date DATE NOT NULL,
  reading_time TIME,
  location reading_location NOT NULL,
  ambient_temp_f DECIMAL(5, 2), -- Fahrenheit
  relative_humidity DECIMAL(5, 2), -- Percentage
  grains_per_pound DECIMAL(8, 2), -- GPP
  notes TEXT,
  taken_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 MOISTURE_POINTS (X/Y position, material type, moisture reading, timestamp)
CREATE TABLE IF NOT EXISTS public.moisture_points (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chamber_id UUID REFERENCES public.chambers(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  floor_plan_id UUID REFERENCES public.floor_plans(id) ON DELETE SET NULL,
  x_position DECIMAL(10, 4), -- X coordinate on floor plan
  y_position DECIMAL(10, 4), -- Y coordinate on floor plan
  material_type TEXT, -- 'drywall', 'wood', 'concrete', 'carpet', etc.
  moisture_reading DECIMAL(8, 2), -- Moisture percentage or reading
  reading_unit TEXT DEFAULT 'percent', -- 'percent', 'mc', etc.
  notes TEXT,
  photo_id UUID REFERENCES public.job_photos(id) ON DELETE SET NULL,
  taken_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.7 MOISTURE_MAPS (Floor plan overlays)
CREATE TABLE IF NOT EXISTS public.moisture_maps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  floor_plan_id UUID REFERENCES public.floor_plans(id) ON DELETE CASCADE NOT NULL,
  chamber_id UUID REFERENCES public.chambers(id) ON DELETE CASCADE NOT NULL,
  map_date DATE NOT NULL,
  overlay_image_storage_path TEXT, -- Path to generated moisture map overlay
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.8 DRYING_LOGS (Time-series daily readings per chamber/room)
CREATE TABLE IF NOT EXISTS public.drying_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chamber_id UUID REFERENCES public.chambers(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  summary_data JSONB DEFAULT '{}'::jsonb, -- Aggregated readings for the day
  notes TEXT,
  logged_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chamber_id, log_date)
);

-- 2.9 EQUIPMENT_LOGS (Detailed equipment tracking)
CREATE TYPE equipment_type AS ENUM (
  'dehumidifier', 'air_mover', 'air_scrubber', 'heater', 
  'moisture_meter', 'thermal_imaging', 'other'
);

CREATE TABLE IF NOT EXISTS public.equipment_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  chamber_id UUID REFERENCES public.chambers(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  equipment_type equipment_type NOT NULL,
  equipment_name TEXT,
  asset_id TEXT, -- Barcode/ID for equipment tracking
  quantity INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  placed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.10 BOXES (Box ID, room of origin, current location)
CREATE TABLE IF NOT EXISTS public.boxes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  box_number TEXT NOT NULL,
  room_of_origin_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  current_location TEXT, -- 'warehouse', 'on_site', 'customer_home', etc.
  location_details TEXT,
  packed_by UUID REFERENCES public.profiles(id),
  packed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, box_number)
);

-- 2.11 CONTENT_ITEMS (Description, condition, photos, estimated value)
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  box_id UUID REFERENCES public.boxes(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  condition_before TEXT, -- 'good', 'damaged', 'destroyed', etc.
  condition_after TEXT,
  estimated_value DECIMAL(12, 2),
  photos UUID[], -- Array of job_photos IDs
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.12 REPORT_TEMPLATES (Report system)
CREATE TYPE report_template_type AS ENUM ('initial', 'hydro', 'full', 'custom');

CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  template_type report_template_type NOT NULL,
  description TEXT,
  sections JSONB DEFAULT '[]'::jsonb, -- Template section configuration
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.13 REPORTS (Generated reports)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  report_number TEXT UNIQUE,
  report_type report_template_type NOT NULL,
  status TEXT DEFAULT 'draft', -- 'draft', 'generating', 'completed', 'sent'
  pdf_storage_path TEXT, -- Path to generated PDF
  configuration JSONB DEFAULT '{}'::jsonb, -- Report generation config (rooms, date ranges, etc.)
  generated_by UUID REFERENCES public.profiles(id),
  generated_at TIMESTAMPTZ,
  sent_to TEXT[], -- Array of email addresses
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 3: PERFORMANCE INDEXES
-- ============================================================================

-- Existing table indexes (from security plan)
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_lead_tech_id ON public.jobs(lead_tech_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at_desc ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON public.jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_gates_job_id_status ON public.job_gates(job_id, status);
CREATE INDEX IF NOT EXISTS idx_job_photos_job_id_created_at ON public.job_photos(job_id, created_at DESC);

-- Partial index for active jobs
CREATE INDEX IF NOT EXISTS idx_jobs_active ON public.jobs(created_at DESC) 
WHERE status IN ('job_created', 'active_work');

-- Work Management indexes
CREATE INDEX IF NOT EXISTS idx_boards_account_id ON public.boards(account_id);
CREATE INDEX IF NOT EXISTS idx_boards_board_type ON public.boards(board_type);
CREATE INDEX IF NOT EXISTS idx_groups_board_id ON public.groups(board_id);
CREATE INDEX IF NOT EXISTS idx_items_board_id ON public.items(board_id);
CREATE INDEX IF NOT EXISTS idx_items_group_id ON public.items(group_id);
CREATE INDEX IF NOT EXISTS idx_subitems_item_id ON public.subitems(item_id);
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON public.columns(board_id);
CREATE INDEX IF NOT EXISTS idx_column_values_item_id ON public.column_values(item_id);
CREATE INDEX IF NOT EXISTS idx_column_values_column_id ON public.column_values(column_id);
CREATE INDEX IF NOT EXISTS idx_column_values_text_search ON public.column_values USING gin(to_tsvector('english', text_value));
CREATE INDEX IF NOT EXISTS idx_views_board_id ON public.views(board_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_account_id ON public.dashboards(account_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_board_id ON public.automation_rules(board_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON public.automation_rules(board_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_automation_executions_rule_id ON public.automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_item_id ON public.automation_executions(item_id);

-- Field Documentation indexes
CREATE INDEX IF NOT EXISTS idx_floor_plans_job_id ON public.floor_plans(job_id);
CREATE INDEX IF NOT EXISTS idx_rooms_job_id ON public.rooms(job_id);
CREATE INDEX IF NOT EXISTS idx_rooms_floor_plan_id ON public.rooms(floor_plan_id);
CREATE INDEX IF NOT EXISTS idx_chambers_job_id ON public.chambers(job_id);
CREATE INDEX IF NOT EXISTS idx_chambers_status ON public.chambers(status);
CREATE INDEX IF NOT EXISTS idx_chamber_rooms_chamber_id ON public.chamber_rooms(chamber_id);
CREATE INDEX IF NOT EXISTS idx_chamber_rooms_room_id ON public.chamber_rooms(room_id);
CREATE INDEX IF NOT EXISTS idx_psychrometric_readings_chamber_id ON public.psychrometric_readings(chamber_id);
CREATE INDEX IF NOT EXISTS idx_psychrometric_readings_reading_date ON public.psychrometric_readings(reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_moisture_points_chamber_id ON public.moisture_points(chamber_id);
CREATE INDEX IF NOT EXISTS idx_moisture_points_room_id ON public.moisture_points(room_id);
CREATE INDEX IF NOT EXISTS idx_moisture_points_created_at ON public.moisture_points(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moisture_maps_floor_plan_id ON public.moisture_maps(floor_plan_id);
CREATE INDEX IF NOT EXISTS idx_moisture_maps_chamber_id ON public.moisture_maps(chamber_id);
CREATE INDEX IF NOT EXISTS idx_drying_logs_chamber_id ON public.drying_logs(chamber_id);
CREATE INDEX IF NOT EXISTS idx_drying_logs_log_date ON public.drying_logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_logs_job_id ON public.equipment_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_equipment_logs_chamber_id ON public.equipment_logs(chamber_id);
CREATE INDEX IF NOT EXISTS idx_equipment_logs_is_active ON public.equipment_logs(job_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_boxes_job_id ON public.boxes(job_id);
CREATE INDEX IF NOT EXISTS idx_content_items_job_id ON public.content_items(job_id);
CREATE INDEX IF NOT EXISTS idx_content_items_box_id ON public.content_items(box_id);
CREATE INDEX IF NOT EXISTS idx_reports_job_id ON public.reports(job_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ============================================================================
-- PART 4: MATERIALIZED VIEWS
-- ============================================================================

-- Dashboard metrics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_metrics AS
SELECT
  COUNT(*) FILTER (WHERE status = 'lead') as leads_count,
  COUNT(*) FILTER (WHERE status = 'active_work') as active_jobs_count,
  COUNT(*) FILTER (WHERE status = 'ready_to_invoice') as ready_to_invoice_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as jobs_last_7_days,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_job_duration_seconds
FROM public.jobs;

-- Create unique index on materialized view (ensures single row)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_metrics_single_row ON public.dashboard_metrics ((1));

-- Refresh function for dashboard metrics
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_metrics;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subitems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.column_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floor_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chambers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamber_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychrometric_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moisture_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moisture_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drying_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner', 'estimator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can access job
CREATE OR REPLACE FUNCTION can_access_job(job_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.jobs
    WHERE id = job_uuid
    AND (
      lead_tech_id = auth.uid()
      OR is_admin()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Boards: Admins see all, users see boards in their account
DROP POLICY IF EXISTS "Admins view all boards" ON public.boards;
CREATE POLICY "Admins view all boards"
  ON public.boards FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Users view account boards" ON public.boards;
CREATE POLICY "Users view account boards"
  ON public.boards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = boards.account_id
      AND accounts.id IN (
        SELECT account_id FROM public.jobs WHERE lead_tech_id = auth.uid()
        UNION
        SELECT id FROM public.accounts WHERE EXISTS (
          SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Admins manage boards" ON public.boards;
CREATE POLICY "Admins manage boards"
  ON public.boards FOR ALL
  TO authenticated
  USING (is_admin());

-- Groups, Items, Subitems, Columns, Column Values: Inherit board permissions
DROP POLICY IF EXISTS "Users access board groups" ON public.groups;
CREATE POLICY "Users access board groups"
  ON public.groups FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.boards WHERE boards.id = groups.board_id)
  );

DROP POLICY IF EXISTS "Users access board items" ON public.items;
CREATE POLICY "Users access board items"
  ON public.items FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.boards WHERE boards.id = items.board_id)
  );

DROP POLICY IF EXISTS "Users access item subitems" ON public.subitems;
CREATE POLICY "Users access item subitems"
  ON public.subitems FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = subitems.item_id)
  );

DROP POLICY IF EXISTS "Users access board columns" ON public.columns;
CREATE POLICY "Users access board columns"
  ON public.columns FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.boards WHERE boards.id = columns.board_id)
  );

DROP POLICY IF EXISTS "Users access column values" ON public.column_values;
CREATE POLICY "Users access column values"
  ON public.column_values FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.items WHERE items.id = column_values.item_id)
  );

-- Views and Dashboards: Similar to boards
DROP POLICY IF EXISTS "Users access board views" ON public.views;
CREATE POLICY "Users access board views"
  ON public.views FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.boards WHERE boards.id = views.board_id)
  );

DROP POLICY IF EXISTS "Users access dashboards" ON public.dashboards;
CREATE POLICY "Users access dashboards"
  ON public.dashboards FOR ALL
  TO authenticated
  USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM public.accounts
      WHERE accounts.id = dashboards.account_id
    )
  );

-- Automation Rules: Board-level access
DROP POLICY IF EXISTS "Users access automation rules" ON public.automation_rules;
CREATE POLICY "Users access automation rules"
  ON public.automation_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.boards WHERE boards.id = automation_rules.board_id)
  );

DROP POLICY IF EXISTS "Users view automation executions" ON public.automation_executions;
CREATE POLICY "Users view automation executions"
  ON public.automation_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.automation_rules
      WHERE automation_rules.id = automation_executions.rule_id
    )
  );

-- Field Documentation: Job-based access
DROP POLICY IF EXISTS "Users access job floor plans" ON public.floor_plans;
CREATE POLICY "Users access job floor plans"
  ON public.floor_plans FOR ALL
  TO authenticated
  USING (can_access_job(job_id));

DROP POLICY IF EXISTS "Users access job rooms" ON public.rooms;
CREATE POLICY "Users access job rooms"
  ON public.rooms FOR ALL
  TO authenticated
  USING (can_access_job(job_id));

DROP POLICY IF EXISTS "Users access job chambers" ON public.chambers;
CREATE POLICY "Users access job chambers"
  ON public.chambers FOR ALL
  TO authenticated
  USING (can_access_job(job_id));

DROP POLICY IF EXISTS "Users access chamber rooms" ON public.chamber_rooms;
CREATE POLICY "Users access chamber rooms"
  ON public.chamber_rooms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = chamber_rooms.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

DROP POLICY IF EXISTS "Users access psychrometric readings" ON public.psychrometric_readings;
CREATE POLICY "Users access psychrometric readings"
  ON public.psychrometric_readings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = psychrometric_readings.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

DROP POLICY IF EXISTS "Users access moisture points" ON public.moisture_points;
CREATE POLICY "Users access moisture points"
  ON public.moisture_points FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = moisture_points.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

DROP POLICY IF EXISTS "Users access moisture maps" ON public.moisture_maps;
CREATE POLICY "Users access moisture maps"
  ON public.moisture_maps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = moisture_maps.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

DROP POLICY IF EXISTS "Users access drying logs" ON public.drying_logs;
CREATE POLICY "Users access drying logs"
  ON public.drying_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chambers
      WHERE chambers.id = drying_logs.chamber_id
      AND can_access_job(chambers.job_id)
    )
  );

DROP POLICY IF EXISTS "Users access equipment logs" ON public.equipment_logs;
CREATE POLICY "Users access equipment logs"
  ON public.equipment_logs FOR ALL
  TO authenticated
  USING (can_access_job(job_id));

DROP POLICY IF EXISTS "Users access boxes" ON public.boxes;
CREATE POLICY "Users access boxes"
  ON public.boxes FOR ALL
  TO authenticated
  USING (can_access_job(job_id));

DROP POLICY IF EXISTS "Users access content items" ON public.content_items;
CREATE POLICY "Users access content items"
  ON public.content_items FOR ALL
  TO authenticated
  USING (can_access_job(job_id));

DROP POLICY IF EXISTS "Admins view all report templates" ON public.report_templates;
CREATE POLICY "Admins view all report templates"
  ON public.report_templates FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins manage report templates" ON public.report_templates;
CREATE POLICY "Admins manage report templates"
  ON public.report_templates FOR ALL
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Users access job reports" ON public.reports;
CREATE POLICY "Users access job reports"
  ON public.reports FOR ALL
  TO authenticated
  USING (can_access_job(job_id));

-- ============================================================================
-- PART 6: TRIGGERS
-- ============================================================================

-- Updated_at triggers for all new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subitems_updated_at
  BEFORE UPDATE ON public.subitems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_columns_updated_at
  BEFORE UPDATE ON public.columns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_column_values_updated_at
  BEFORE UPDATE ON public.column_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_views_updated_at
  BEFORE UPDATE ON public.views
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_floor_plans_updated_at
  BEFORE UPDATE ON public.floor_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chambers_updated_at
  BEFORE UPDATE ON public.chambers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_psychrometric_readings_updated_at
  BEFORE UPDATE ON public.psychrometric_readings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moisture_points_updated_at
  BEFORE UPDATE ON public.moisture_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drying_logs_updated_at
  BEFORE UPDATE ON public.drying_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_logs_updated_at
  BEFORE UPDATE ON public.equipment_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boxes_updated_at
  BEFORE UPDATE ON public.boxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 7: HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate equipment days (for billing/justification)
CREATE OR REPLACE FUNCTION calculate_equipment_days(
  p_job_id UUID,
  p_start_date DATE,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  equipment_type equipment_type,
  total_quantity INTEGER,
  total_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.equipment_type,
    SUM(el.quantity)::INTEGER as total_quantity,
    SUM(
      CASE 
        WHEN p_end_date IS NOT NULL AND el.end_date IS NOT NULL THEN
          LEAST(EXTRACT(DAY FROM (p_end_date - el.start_date))::INTEGER + 1,
                EXTRACT(DAY FROM (el.end_date - el.start_date))::INTEGER + 1)
        WHEN p_end_date IS NOT NULL THEN
          EXTRACT(DAY FROM (p_end_date - el.start_date))::INTEGER + 1
        WHEN el.end_date IS NOT NULL THEN
          EXTRACT(DAY FROM (el.end_date - el.start_date))::INTEGER + 1
        ELSE
          EXTRACT(DAY FROM (CURRENT_DATE - el.start_date))::INTEGER + 1
      END
    )::INTEGER as total_days
  FROM public.equipment_logs el
  WHERE el.job_id = p_job_id
    AND el.is_active = TRUE
    AND (p_end_date IS NULL OR el.start_date <= p_end_date)
    AND (el.end_date IS NULL OR el.end_date >= p_start_date)
  GROUP BY el.equipment_type;
END;
$$ LANGUAGE plpgsql;

-- Function to get chamber summary (for reports)
CREATE OR REPLACE FUNCTION get_chamber_summary(p_chamber_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'chamber_id', c.id,
    'chamber_name', c.name,
    'room_count', COUNT(DISTINCT cr.room_id),
    'latest_reading', (
      SELECT jsonb_build_object(
        'date', pr.reading_date,
        'ambient_temp', pr.ambient_temp_f,
        'relative_humidity', pr.relative_humidity,
        'grains_per_pound', pr.grains_per_pound
      )
      FROM public.psychrometric_readings pr
      WHERE pr.chamber_id = c.id
      ORDER BY pr.reading_date DESC, pr.reading_time DESC NULLS LAST
      LIMIT 1
    ),
    'moisture_point_count', (
      SELECT COUNT(*) FROM public.moisture_points mp
      WHERE mp.chamber_id = c.id
    ),
    'equipment_count', (
      SELECT COUNT(*) FROM public.equipment_logs el
      WHERE el.chamber_id = c.id AND el.is_active = TRUE
    )
  )
  INTO result
  FROM public.chambers c
  LEFT JOIN public.chamber_rooms cr ON cr.chamber_id = c.id
  WHERE c.id = p_chamber_id
  GROUP BY c.id, c.name;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

