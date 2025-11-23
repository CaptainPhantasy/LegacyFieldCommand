-- Performance indexes for frequently queried columns
-- Improves query performance, especially for large datasets

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_lead_tech_id ON jobs(lead_tech_id);
CREATE INDEX IF NOT EXISTS idx_jobs_estimator_id ON jobs(estimator_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at_desc ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_updated_at_desc ON jobs(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_account_id ON jobs(account_id);

-- Partial index for active jobs (most common query)
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(created_at DESC) 
WHERE status IN ('job_created', 'active_work', 'inspection_scheduled');

-- Job gates indexes
CREATE INDEX IF NOT EXISTS idx_job_gates_job_id ON job_gates(job_id);
CREATE INDEX IF NOT EXISTS idx_job_gates_status ON job_gates(status);
CREATE INDEX IF NOT EXISTS idx_job_gates_job_id_status ON job_gates(job_id, status);
CREATE INDEX IF NOT EXISTS idx_job_gates_stage_name ON job_gates(stage_name);
CREATE INDEX IF NOT EXISTS idx_job_gates_completed_at ON job_gates(completed_at DESC);

-- Job photos indexes
CREATE INDEX IF NOT EXISTS idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX IF NOT EXISTS idx_job_photos_gate_id ON job_photos(gate_id);
CREATE INDEX IF NOT EXISTS idx_job_photos_job_id_created_at ON job_photos(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_photos_room ON job_photos(room);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_job_id ON audit_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_jobs_tech_status ON jobs(lead_tech_id, status) 
WHERE lead_tech_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_job_gates_job_stage ON job_gates(job_id, stage_name);

-- Text search indexes (for full-text search if needed)
-- Note: Requires pg_trgm extension for trigram matching
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm ON jobs USING gin(title gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_jobs_address_trgm ON jobs USING gin(address_line_1 gin_trgm_ops);

