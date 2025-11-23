// Verify job assignment for RLS debugging
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '../apps/web/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyJobAssignment(jobId, userEmail) {
  console.log('🔍 Verifying Job Assignment for RLS Debugging\n');
  console.log('='.repeat(60));

  // Get user by email
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: process.env.TEST_PASSWORD || 'TestPass123!'
  });

  if (authError || !user) {
    console.error('❌ Authentication failed:', authError?.message);
    console.log('\n💡 Try running with: TEST_PASSWORD=yourpassword node scripts/verify_job_assignment.js <jobId> <email>');
    return;
  }

  console.log(`✅ Authenticated as: ${user.email}`);
  console.log(`   User ID: ${user.id}\n`);

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile) {
    console.log(`👤 Profile:`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Name: ${profile.full_name || 'N/A'}\n`);
  }

  // Get the specific job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, lead_tech_id, status, address_line_1')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    console.error(`❌ Job not found: ${jobId}`);
    console.error(`   Error: ${jobError?.message}`);
    return;
  }

  console.log(`📋 Job Details:`);
  console.log(`   ID: ${job.id}`);
  console.log(`   Title: ${job.title || 'Untitled'}`);
  console.log(`   Status: ${job.status}`);
  console.log(`   Lead Tech ID: ${job.lead_tech_id || 'NULL (UNASSIGNED)'}\n`);

  // Check assignment
  const isAssigned = job.lead_tech_id === user.id;
  console.log(`🔐 Assignment Check:`);
  console.log(`   Job lead_tech_id: ${job.lead_tech_id || 'NULL'}`);
  console.log(`   Current user ID: ${user.id}`);
  console.log(`   Match: ${isAssigned ? '✅ YES' : '❌ NO'}\n`);

  if (!isAssigned) {
    console.log('⚠️  PROBLEM IDENTIFIED:');
    console.log('   The job is NOT assigned to this user.');
    console.log('   RLS policy will FAIL because it requires: jobs.lead_tech_id = auth.uid()\n');
    
    if (job.lead_tech_id) {
      // Get the assigned tech
      const { data: assignedTech } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', job.lead_tech_id)
        .single();
      
      if (assignedTech) {
        console.log(`   Job is assigned to: ${assignedTech.email} (${assignedTech.full_name || 'N/A'})`);
      }
    } else {
      console.log('   Job is UNASSIGNED (lead_tech_id is NULL)');
    }
    
    console.log('\n💡 SOLUTION:');
    console.log('   1. Assign the job to this user in Supabase, OR');
    console.log('   2. Log in as the user the job is assigned to, OR');
    console.log('   3. Update the job\'s lead_tech_id to match this user');
  } else {
    console.log('✅ Job is correctly assigned to this user.');
    console.log('   If RLS is still failing, check:');
    console.log('   1. RLS policies are applied (run supabase/verify_rls_policies.sql)');
    console.log('   2. Policies match the schema (run supabase/fix_rls_complete.sql)');
  }

  // Check all jobs assigned to this user
  const { data: assignedJobs } = await supabase
    .from('jobs')
    .select('id, title, status')
    .eq('lead_tech_id', user.id);

  console.log(`\n📊 All Jobs Assigned to ${user.email}:`);
  if (assignedJobs && assignedJobs.length > 0) {
    assignedJobs.forEach(j => {
      console.log(`   - ${j.title || 'Untitled'} (${j.id})`);
    });
  } else {
    console.log('   No jobs assigned to this user.');
  }

  console.log('\n' + '='.repeat(60));
}

// Get command line arguments
const jobId = process.argv[2];
const userEmail = process.argv[3] || 'tech@legacyfield.com';

if (!jobId) {
  console.error('Usage: node scripts/verify_job_assignment.js <jobId> [userEmail]');
  console.error('Example: node scripts/verify_job_assignment.js d5d28607-d55e-434c-8d93-15f53dfc21c9 tech@legacyfield.com');
  process.exit(1);
}

verifyJobAssignment(jobId, userEmail).catch(console.error);

