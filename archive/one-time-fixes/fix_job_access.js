import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function fixJobAccess() {
  console.log('🔍 Checking jobs and assignments...\n');

  // List all jobs
  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from('jobs')
    .select('id, title, lead_tech_id, status, created_at');

  if (jobsError) {
    console.error('Error fetching jobs:', jobsError);
    return;
  }

  console.log(`Found ${jobs?.length || 0} jobs:\n`);
  
  jobs?.forEach(job => {
    console.log(`📋 ${job.title}`);
    console.log(`   ID: ${job.id}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Assigned to: ${job.lead_tech_id || '❌ UNASSIGNED'}`);
    console.log('');
  });

  // Find the Smith job (case-insensitive search)
  const smithJob = jobs?.find(j => 
    j.title.toLowerCase().includes('smith') && 
    j.title.toLowerCase().includes('water')
  );

  if (!smithJob) {
    console.log('❌ Could not find "Smith" water loss job');
    console.log('   Available jobs:', jobs?.map(j => j.title).join(', '));
    return;
  }

  console.log(`\n✅ Found job: "${smithJob.title}"`);
  console.log(`   Current assignment: ${smithJob.lead_tech_id || 'UNASSIGNED'}\n`);

  // Get all field tech users
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const techUsers = users.filter(u => {
    // Check profile role
    return true; // We'll check profiles below
  });

  // Get profiles to check roles
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, full_name');

  const fieldTechs = profiles?.filter(p => p.role === 'field_tech') || [];

  console.log('👥 Available field techs:');
  fieldTechs.forEach(tech => {
    console.log(`   - ${tech.email} (${tech.full_name || 'No name'}) - ID: ${tech.id}`);
  });

  if (fieldTechs.length === 0) {
    console.log('\n❌ No field tech users found!');
    return;
  }

  // If job is unassigned, assign to first tech
  if (!smithJob.lead_tech_id) {
    const firstTech = fieldTechs[0];
    console.log(`\n🔧 Assigning job to ${firstTech.email}...`);
    
    const { error } = await supabaseAdmin
      .from('jobs')
      .update({ lead_tech_id: firstTech.id })
      .eq('id', smithJob.id);

    if (error) {
      console.error('❌ Error assigning job:', error);
    } else {
      console.log(`✅ Job "${smithJob.title}" assigned to ${firstTech.email}`);
    }
  } else {
    // Check if assigned tech exists
    const assignedTech = fieldTechs.find(t => t.id === smithJob.lead_tech_id);
    if (assignedTech) {
      console.log(`\n✅ Job is already assigned to ${assignedTech.email}`);
    } else {
      console.log(`\n⚠️  Job assigned to user ID ${smithJob.lead_tech_id}, but that user is not a field tech or doesn't exist`);
      console.log('   Reassigning to first available tech...');
      
      const firstTech = fieldTechs[0];
      const { error } = await supabaseAdmin
        .from('jobs')
        .update({ lead_tech_id: firstTech.id })
        .eq('id', smithJob.id);

      if (error) {
        console.error('❌ Error reassigning job:', error);
      } else {
        console.log(`✅ Job reassigned to ${firstTech.email}`);
      }
    }
  }
}

fixJobAccess().catch(console.error);
