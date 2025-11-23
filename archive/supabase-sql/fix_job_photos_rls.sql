-- Add missing RLS policies for job_photos
-- Run this in Supabase SQL Editor
-- This will drop and recreate policies if they exist

-- Techs can insert photos for their assigned jobs
drop policy if exists "Techs insert photos for assigned jobs" on job_photos;
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
drop policy if exists "Techs view photos for assigned jobs" on job_photos;
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
drop policy if exists "Admins view all photos" on job_photos;
create policy "Admins view all photos"
  on job_photos for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() 
      and profiles.role in ('admin', 'owner', 'estimator')
    )
  );

