'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Job, JobGate, Reading, MoistureData, JobWithGates, GateMetadata } from '@/types/gates';

export async function getAssignedJobs() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch jobs assigned to this user
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(`
      *,
      gates:job_gates(*)
    `)
    .eq('lead_tech_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }

  // Sort gates for each job to ensure we can determine progress
  const jobsWithGates: JobWithGates[] = jobs.map((job: Job & { gates?: JobGate[] }) => ({
    ...job,
    gates: (job.gates || []).sort((a: JobGate, b: JobGate) => {
      // Simple sort or use a predefined order map if needed
      // For now, rely on creation or name if consistent, but ideally add an 'order' column
      return 0; 
    })
  }));

  return jobsWithGates;
}

export async function getJobDetails(jobId: string) {
  const supabase = await createClient();
  
  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      gates:job_gates(*)
    `)
    .eq('id', jobId)
    .single();

  if (error) {
    console.error('Error fetching job details:', error);
    return null;
  }

  return job;
}

export async function saveGateData(gateId: string, data: GateMetadata) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('job_gates')
    .update({ 
      metadata: data,
      updated_at: new Date().toISOString()
    })
    .eq('id', gateId);

  if (error) {
    console.error('Error saving gate data:', error);
    throw new Error('Failed to save data');
  }

  revalidatePath('/field');
  revalidatePath('/demo'); // For demo purposes
}

export async function addMoistureReading(gateId: string, reading: Reading) {
  const supabase = await createClient();

  // 1. Get current data
  const { data: gate, error: fetchError } = await supabase
    .from('job_gates')
    .select('metadata')
    .eq('id', gateId)
    .single();

  if (fetchError) throw new Error('Could not fetch gate');

  const currentMetadata = (gate.metadata as MoistureData) || { readings: [], equipment: [], equipmentPhotos: [] };
  const currentReadings = currentMetadata.readings || [];

  // 2. Append new reading
  const newMetadata = {
    ...currentMetadata,
    readings: [...currentReadings, reading]
  };

  // 3. Save back
  const { error: updateError } = await supabase
    .from('job_gates')
    .update({ 
      metadata: newMetadata,
      status: 'in_progress', // Automatically mark as in progress
      updated_at: new Date().toISOString()
    })
    .eq('id', gateId);

  if (updateError) throw new Error('Failed to save reading');

  revalidatePath('/field');
  revalidatePath('/field/job');
  revalidatePath('/demo');
}

export async function completeGate(gateId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('job_gates')
    .update({ 
      status: 'complete',
      completed_at: new Date().toISOString(),
      completed_by: user?.id
    })
    .eq('id', gateId);

  if (error) throw new Error('Failed to complete gate');
  
  revalidatePath('/field');
  revalidatePath('/field/job');
}

export async function logException(gateId: string, reason: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('job_gates')
    .update({ 
      requires_exception: true,
      exception_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', gateId);

  if (error) throw new Error('Failed to log exception');
  
  revalidatePath('/field');
  revalidatePath('/field/job');
}

