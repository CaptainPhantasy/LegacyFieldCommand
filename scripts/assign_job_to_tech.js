import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://anwltpsdedfvkbscyylk.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFud2x0cHNkZWRmdmtic2N5eWxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5MTgwMiwiZXhwIjoyMDc5MTY3ODAyfQ.H7xF9yonUAj2Gkj0y8fPSAicFkU--efKXxpOAAO8c9c';

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

