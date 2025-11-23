import React from 'react';
import { getAssignedJobs } from '@/app/actions/gates';
import FieldDashboard from '@/components/dashboard/FieldDashboard';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import type { JobGate, GateStageName, JobWithGates } from '@/types/gates';

// Helper to map the raw DB response to the UI's expected shape
function transformJob(job: JobWithGates): JobWithGates & { nextGate?: JobGate; activeException?: boolean } {
  const GATES_ORDER: GateStageName[] = ['Arrival', 'Intake', 'Photos', 'Moisture/Equipment', 'Scope', 'Sign-offs', 'Departure'];
  
  const gates = job.gates || [];
  const currentGate = gates.find((g: JobGate) => g.status === 'in_progress') 
    || gates.find((g: JobGate) => g.status === 'pending') // Fallback to first pending
    || undefined;

  return {
    ...job,
    gates,
    nextGate: currentGate,
    activeException: gates.some((g: JobGate) => g.requires_exception && g.status !== 'complete')
  };
}

export default async function FieldPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check user role - redirect admins to admin dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Redirect non-field-tech users to admin dashboard
  if (profile?.role !== 'field_tech') {
    redirect('/');
  }

  const rawJobs = await getAssignedJobs();
  const jobs = rawJobs.map(transformJob);

  return (
    <FieldDashboard 
      jobs={jobs}
      userEmail={user.email}
    />
  );
}
