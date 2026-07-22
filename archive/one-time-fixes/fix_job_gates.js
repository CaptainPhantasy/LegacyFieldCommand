import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function fixJobGates() {
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
  console.log('Fixing gates for job:', job.id);

  // Get existing gates
  const { data: existingGates } = await supabaseAdmin
    .from('job_gates')
    .select('stage_name')
    .eq('job_id', job.id);

  const existingStageNames = existingGates?.map(g => g.stage_name) || [];
  console.log('Existing gates:', existingStageNames);

  // Add missing gates
  const allGates = [
    'Arrival',
    'Intake',
    'Photos',
    'Moisture/Equipment',
    'Scope',
    'Sign-offs',
    'Departure'
  ];

  const missingGates = allGates.filter(name => !existingStageNames.includes(name));
  
  if (missingGates.length > 0) {
    console.log('Adding missing gates:', missingGates);
    const newGates = missingGates.map(stage_name => ({
      job_id: job.id,
      stage_name,
      status: 'pending'
    }));

    const { error } = await supabaseAdmin.from('job_gates').insert(newGates);
    if (error) {
      console.error('Error adding gates:', error);
    } else {
      console.log('Successfully added missing gates');
    }
  } else {
    console.log('All gates already exist');
  }

  // Verify final count
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

fixJobGates();
