import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anwltpsdedfvkbscyylk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFud2x0cHNkZWRmdmtic2N5eWxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5MTgwMiwiZXhwIjoyMDc5MTY3ODAyfQ.H7xF9yonUAj2Gkj0y8fPSAicFkU--efKXxpOAAO8c9c';

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

