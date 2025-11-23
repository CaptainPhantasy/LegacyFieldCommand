import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function assignJobToTech() {
  // Get field tech user
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const techUser = users.users.find(u => u.email === 'tech@legacyfield.com');
  
  if (!techUser) {
    console.error('Tech user not found');
    return;
  }

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

  // Assign job to tech
  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ lead_tech_id: techUser.id })
    .eq('id', job.id);

  if (error) {
    console.error('Error assigning job:', error);
  } else {
    console.log(`Job "${job.title}" assigned to tech@legacyfield.com`);
  }
}

assignJobToTech();

