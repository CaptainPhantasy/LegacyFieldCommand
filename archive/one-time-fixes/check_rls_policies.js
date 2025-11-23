// Check RLS policies in Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies for job_photos table...\n');

  // We can't directly query pg_policies with the anon key, so let's check by testing access
  // First, let's verify the table structure
  const { data: tableInfo, error: tableError } = await supabase
    .from('job_photos')
    .select('*')
    .limit(0);

  if (tableError) {
    console.error('❌ Error accessing job_photos table:', tableError.message);
    return;
  }

  console.log('✅ job_photos table is accessible\n');

  // Check if we can see any policies by trying to query the table
  // This won't show us the policies directly, but we can verify RLS is working
  console.log('📋 To verify RLS policies, run this SQL in Supabase SQL Editor:');
  console.log(`
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'job_photos'
ORDER BY policyname;
  `);

  // Check jobs table structure
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, lead_tech_id, title')
    .limit(5);

  if (jobsError) {
    console.error('❌ Error accessing jobs table:', jobsError.message);
  } else {
    console.log('\n✅ Jobs table accessible');
    console.log(`Found ${jobs?.length || 0} jobs`);
    if (jobs && jobs.length > 0) {
      console.log('Sample jobs:');
      jobs.forEach(job => {
        console.log(`  - ${job.title} (ID: ${job.id}, lead_tech_id: ${job.lead_tech_id || 'NULL'})`);
      });
    }
  }

  // Check profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .limit(5);

  if (profilesError) {
    console.error('❌ Error accessing profiles table:', profilesError.message);
  } else {
    console.log('\n✅ Profiles table accessible');
    console.log(`Found ${profiles?.length || 0} profiles`);
  }
}

checkRLSPolicies().catch(console.error);

