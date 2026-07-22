import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function removeDuplicateGate() {
  // Get the job
  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('title', 'Test Water Loss - Smith Residence')
    .limit(1);

  if (!jobs || jobs.length === 0) {
    console.error('Job not found');
    return;
  }

  const job = jobs[0];

  // Delete the old "Sign-off" gate (keep "Sign-offs")
  const { error } = await supabaseAdmin
    .from('job_gates')
    .delete()
    .eq('job_id', job.id)
    .eq('stage_name', 'Sign-off');

  if (error) {
    console.error('Error removing duplicate:', error);
  } else {
    console.log('Removed duplicate "Sign-off" gate');
  }

  // Verify final gates
  const { data: allGatesData } = await supabaseAdmin
    .from('job_gates')
    .select('stage_name, status')
    .eq('job_id', job.id)
    .order('created_at');

  console.log(`\nFinal gate count: ${allGatesData?.length || 0}`);
  allGatesData?.forEach(gate => {
    console.log(`  - ${gate.stage_name}: ${gate.status}`);
  });
}

removeDuplicateGate();
