-- Add metadata column to job_gates table
-- Run this in Supabase SQL Editor

alter table public.job_gates
add column if not exists metadata jsonb default '{}'::jsonb;

-- Add comment
comment on column public.job_gates.metadata is 'Stores gate-specific data (intake info, scope details, etc.)';

