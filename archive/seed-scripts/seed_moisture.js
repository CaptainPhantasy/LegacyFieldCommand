
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use anon key - anonymous policies should allow inserts if SQL was run
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Current Dir:', process.cwd());

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log('🌱 Seeding Test Data for Moisture Gate...');

  // Try to sign in as tech@legacy.com to bypass RLS for "assigned jobs" if we are using anon key?
  // But we don't know the password.
  // If we are using Service Role, we are admin.
  
  if (supabaseKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('✅ Using ANON key with anonymous policies (if SQL setup was run)');
  } else {
      console.log('✅ Using Service Role Key - RLS bypassed');
  }

  // 1. Find any user (with service role, we can query all)
  console.log('🔍 Looking for users...');
  const { data: allProfiles, error: profilesError } = await supabase.from('profiles').select('*');
  
  if (profilesError) {
    console.error('❌ Error querying profiles:', profilesError);
    return;
  }
  
  let tech = allProfiles && allProfiles.length > 0 ? allProfiles[0] : null;
  
  if (!tech) {
    console.log('👤 No users found. Creating test user...');
    // Try to create via direct profile insert with a dummy UUID (won't work with FK, but let's try)
    // Actually, we need a real auth user. Let's just fail gracefully and tell user to sign up
    console.error('❌ No users in database. Please sign up at http://localhost:8765/login first, then run this script again.');
    console.log('💡 Or manually create a user in Supabase Dashboard > Authentication > Users');
    return;
  }
  
  console.log(`👤 Using Tech: ${tech.email} (${tech.id})`);

  console.log(`👤 Using Tech: ${tech.email} (${tech.id})`);

  // 2. Create a Job
  const jobTitle = 'TEST - 123 Moisture Demo';
  
  // Check if we can even read jobs
  const { data: existingJobs, error: readError } = await supabase.from('jobs').select('id').eq('title', jobTitle);
  
  if (readError) {
      console.error('❌ Error reading jobs (RLS?):', readError);
      return;
  }

  if (existingJobs && existingJobs.length > 0) {
    for (const j of existingJobs) {
       await supabase.from('jobs').delete().eq('id', j.id);
    }
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      title: jobTitle,
      address_line_1: '999 Drywall Lane, Testville',
      status: 'active_work',
      lead_tech_id: tech.id
    })
    .select()
    .single();

  if (jobError) {
    console.error('❌ Error creating job:', jobError);
    console.log('👉 Note: This is expected if you are using ANON key and have RLS policies that require Admin role to insert jobs.');
    return;
  }

  console.log(`🏠 Created Job: ${job.title} (${job.id})`);

  // 3. Create Gates
  const GATES = ['Arrival', 'Intake', 'Photos', 'Moisture/Equipment', 'Scope', 'Sign-offs', 'Departure'];
  
  const gatesData = GATES.map(name => ({
    job_id: job.id,
    stage_name: name,
    status: name === 'Moisture/Equipment' ? 'in_progress' : 
            (['Arrival', 'Intake', 'Photos'].includes(name) ? 'complete' : 'pending')
  }));

  const { error: gatesError } = await supabase.from('job_gates').insert(gatesData);

  if (gatesError) {
    console.error('❌ Error creating gates:', gatesError);
    return;
  }

  console.log('✅ Gates created. "Moisture/Equipment" is set to IN_PROGRESS.');
  console.log(`🚀 Ready to test. Job ID: ${job.id}`);
  console.log(`🔗 Direct Link: http://localhost:8765/field/job/${job.id}`);
}

seed();
