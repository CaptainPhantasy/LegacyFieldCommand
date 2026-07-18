import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function verifyJob() {
  // Get the job
  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('title', 'Test Water Loss - Smith Residence')
    .limit(1);

  if (jobsError) {
    console.error('Error fetching job:', jobsError);
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.error('Job not found');
    return;
  }

  const job = jobs[0];
  console.log('Job found:', job.id, job.title);

  // Get gates for this job
  const { data: gates, error: gatesError } = await supabaseAdmin
    .from('job_gates')
    .select('*')
    .eq('job_id', job.id)
    .order('created_at');

  if (gatesError) {
    console.error('Error fetching gates:', gatesError);
    return;
  }

  console.log(`Found ${gates.length} gates:`);
  gates.forEach(gate => {
    console.log(`  - ${gate.stage_name}: ${gate.status}`);
  });

  if (gates.length !== 7) {
    console.error(`Expected 7 gates, found ${gates.length}`);
  }
}

verifyJob();
