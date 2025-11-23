-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- DROP TABLES IF EXISTS (For clean reset during dev)
drop table if exists public.audit_logs;
drop table if exists public.job_photos;
drop table if exists public.job_gates;
drop table if exists public.jobs;
drop table if exists public.accounts;
drop table if exists public.profiles;
-- Drop types if they exist
drop type if exists user_role;
drop type if exists job_status;

-- 1. ENUMS & TYPES
create type user_role as enum ('field_tech', 'lead_tech', 'estimator', 'admin', 'owner', 'program_admin');
create type job_status as enum ('lead', 'inspection_scheduled', 'job_created', 'active_work', 'ready_to_invoice', 'paid', 'closed');

-- 2. PROFILES (Extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text not null,
  full_name text,
  role user_role not null default 'field_tech',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- 3. ACCOUNTS / ORGANIZATIONS (For multi-tenant/white-label capability in future)
create table public.accounts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

alter table public.accounts enable row level security;

-- 4. JOBS
create table public.jobs (
  id uuid default uuid_generate_v4() primary key,
  title text not null, -- e.g., "Smith Residence - Water Loss"
  account_id uuid references public.accounts(id) on delete cascade, 
  status job_status default 'lead',
  
  -- Address / Location
  address_line_1 text,
  city text,
  state text,
  zip_code text,
  
  -- Assignment
  lead_tech_id uuid references public.profiles(id),
  estimator_id uuid references public.profiles(id),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.jobs enable row level security;

-- 5. JOB STAGES (Gates)
-- Each job goes through specific stages that act as gates
create table public.job_gates (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  stage_name text not null, -- e.g., "Arrival", "Intake", "Moisture", "Scope"
  status text default 'pending', -- pending, in_progress, complete, skipped
  
  completed_at timestamptz,
  completed_by uuid references public.profiles(id),
  
  requires_exception boolean default false,
  exception_reason text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.job_gates enable row level security;

-- 6. PHOTOS / EVIDENCE
create table public.job_photos (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  gate_id uuid references public.job_gates(id), -- Link to specific gate/stage
  taken_by uuid references public.profiles(id),
  
  storage_path text not null, -- Path in Supabase Storage bucket
  metadata jsonb default '{}'::jsonb, -- e.g., { "room": "Kitchen", "tag": "North Wall" }
  
  is_ppe boolean default false,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.job_photos enable row level security;

-- 7. AUDIT LOGS
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  job_id uuid references public.jobs(id),
  action text not null, -- e.g., "OVERRIDE_GATE", "UPDATE_ESTIMATE"
  details jsonb,
  created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

-- BASIC RLS POLICIES (Permissive for Phase 0 dev, lock down later)

-- Jobs: Admins see all; Techs see assigned
create policy "Admins view all jobs"
  on jobs for select
  using ( 
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.role in ('admin', 'owner', 'estimator')
    )
  );

create policy "Techs view assigned jobs"
  on jobs for select
  using ( 
    lead_tech_id = auth.uid()
  );

-- TRIGGERS (Auto-update updated_at)
create or replace function update_updated_at_column()
returns trigger as $$
begin
   new.updated_at = now();
   return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
before update on profiles
for each row execute procedure update_updated_at_column();

create trigger update_jobs_updated_at
before update on jobs
for each row execute procedure update_updated_at_column();

create trigger update_job_gates_updated_at
before update on job_gates
for each row execute procedure update_updated_at_column();

create trigger update_job_photos_updated_at
before update on job_photos
for each row execute procedure update_updated_at_column();

-- 8. AUTH TRIGGER (Auto-create profile)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'field_tech');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- EXTRA RLS POLICIES (Insert/Update)

-- Jobs: Admins can insert/update
create policy "Admins insert jobs"
  on jobs for insert
  with check ( 
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.role in ('admin', 'owner', 'estimator')
    )
  );

create policy "Admins update jobs"
  on jobs for update
  using ( 
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.role in ('admin', 'owner', 'estimator')
    )
  );

-- Gates: Admins can insert (creation time); Techs can update status
create policy "Admins insert gates"
  on job_gates for insert
  with check ( 
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.role in ('admin', 'owner', 'estimator')
    )
  );

create policy "Techs update assigned gates"
  on job_gates for update
  using ( 
    exists (
      select 1 from jobs
      where jobs.id = job_gates.job_id
      and jobs.lead_tech_id = auth.uid()
    )
  );

-- Techs need to view gates too
create policy "Techs view assigned gates"
  on job_gates for select
  using ( 
    exists (
      select 1 from jobs
      where jobs.id = job_gates.job_id
      and jobs.lead_tech_id = auth.uid()
    )
  );
  
-- Admins view all gates
create policy "Admins view all gates"
  on job_gates for select
  using ( 
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.role in ('admin', 'owner', 'estimator')
    )
  );

-- JOB_PHOTOS RLS POLICIES

-- Techs can insert photos for their assigned jobs
create policy "Techs insert photos for assigned jobs"
  on job_photos for insert
  with check (
    exists (
      select 1 from jobs
      where jobs.id = job_photos.job_id
      and jobs.lead_tech_id = auth.uid()
    )
  );

-- Techs can view photos for their assigned jobs
create policy "Techs view photos for assigned jobs"
  on job_photos for select
  using (
    exists (
      select 1 from jobs
      where jobs.id = job_photos.job_id
      and jobs.lead_tech_id = auth.uid()
    )
  );

-- Admins can view all photos
create policy "Admins view all photos"
  on job_photos for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.role in ('admin', 'owner', 'estimator')
    )
  );
