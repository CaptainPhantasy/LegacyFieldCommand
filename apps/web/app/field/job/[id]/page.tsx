import React from 'react';
import { getJobDetails } from '@/app/actions/gates';
import JobDetail from '@/components/job/JobDetail';
import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import type { JobGate, GateStageName, JobWithGates } from '@/types/gates';

function transformJob(job: JobWithGates | null): (JobWithGates & { currentGate?: JobGate }) | null {
  if (!job) return null;

  const gates = job.gates || [];
  // Determine current gate
  const currentGate = gates.find((g: JobGate) => g.status === 'in_progress') 
    || gates.find((g: JobGate) => g.status === 'pending') 
    || undefined;

  // If there are duplicate gate entries (e.g. multiple 'Departure' gates) we should probably dedup or handle, 
  // but assuming standard set for now.
  
  return {
    ...job,
    gates,
    currentGate
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const rawJob = await getJobDetails(id);
  
  if (!rawJob) {
    notFound();
  }

  const job = transformJob(rawJob);

  // Check if tech is allowed to see this job? 
  // RLS handles it in getJobDetails select, but if rawJob is null it's caught above.

  if (!job) {
    notFound();
  }

  return (
    <JobDetail 
      job={job}
      userEmail={user.email}
    />
  );
}

