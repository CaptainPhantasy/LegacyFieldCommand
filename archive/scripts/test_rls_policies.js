// Test RLS policies directly to see what's actually happening
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
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLS() {
  console.log('🧪 Testing RLS Policies for job_photos\n');
  console.log('='.repeat(60));

  // Test as field tech
  const techEmail = process.argv[2] || 'tech@legacyfield.com';
  const techPassword = process.argv[3] || 'TestPass123!';
  const jobId = process.argv[4];

  if (!jobId) {
    console.error('Usage: node scripts/test_rls_policies.js [email] [password] <jobId>');
    console.error('Example: node scripts/test_rls_policies.js tech@legacyfield.com TestPass123! d5d28607-d55e-434c-8d93-15f53dfc21c9');
    process.exit(1);
  }

  console.log(`📧 Logging in as: ${techEmail}\n`);

  // Sign in
  const { data: { user, session }, error: authError } = await supabase.auth.signInWithPassword({
    email: techEmail,
    password: techPassword
  });

  if (authError || !user) {
    console.error('❌ Authentication failed:', authError?.message);
    return;
  }

  console.log(`✅ Authenticated as: ${user.email}`);
  console.log(`   User ID: ${user.id}\n`);

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  console.log(`👤 Profile:`);
  console.log(`   Role: ${profile?.role || 'N/A'}\n`);

  // Get job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, lead_tech_id, status')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    console.error(`❌ Job not found: ${jobId}`);
    console.error(`   Error: ${jobError?.message}`);
    return;
  }

  console.log(`📋 Job:`);
  console.log(`   ID: ${job.id}`);
  console.log(`   Title: ${job.title || 'Untitled'}`);
  console.log(`   Lead Tech ID: ${job.lead_tech_id || 'NULL'}`);
  console.log(`   Your User ID: ${user.id}`);
  console.log(`   Match: ${job.lead_tech_id === user.id ? '✅ YES' : '❌ NO'}\n`);

  // Test SELECT (should work if assigned)
  console.log('🔍 Testing SELECT policy...');
  const { data: photos, error: selectError } = await supabase
    .from('job_photos')
    .select('*')
    .eq('job_id', jobId)
    .limit(5);

  if (selectError) {
    console.log(`❌ SELECT failed: ${selectError.message}`);
    console.log(`   Code: ${selectError.code}`);
    console.log(`   Details: ${selectError.details || 'N/A'}`);
  } else {
    console.log(`✅ SELECT works! Found ${photos?.length || 0} photos`);
  }

  console.log('');

  // Test INSERT with a dummy record
  console.log('🔍 Testing INSERT policy...');
  const testPhotoData = {
    job_id: job.id,
    gate_id: null, // We'll use null for testing
    storage_path: `test/rls-test-${Date.now()}.jpg`,
    metadata: JSON.stringify({ test: true }),
    is_ppe: false
  };

  console.log('   Attempting insert with:');
  console.log(`   - job_id: ${testPhotoData.job_id}`);
  console.log(`   - Your user ID: ${user.id}`);
  console.log(`   - Job lead_tech_id: ${job.lead_tech_id || 'NULL'}`);
  console.log(`   - Match: ${job.lead_tech_id === user.id ? 'YES' : 'NO'}\n`);

  const { data: insertedPhoto, error: insertError } = await supabase
    .from('job_photos')
    .insert(testPhotoData)
    .select()
    .single();

  if (insertError) {
    console.log(`❌ INSERT FAILED:`);
    console.log(`   Message: ${insertError.message}`);
    console.log(`   Code: ${insertError.code || 'N/A'}`);
    console.log(`   Details: ${insertError.details || 'N/A'}`);
    console.log(`   Hint: ${insertError.hint || 'N/A'}\n`);

    if (insertError.message?.includes('row-level security') || insertError.message?.includes('RLS')) {
      console.log('🔍 RLS Policy Analysis:');
      console.log('   The INSERT was blocked by RLS policy.');
      console.log('   This means:');
      console.log('   1. RLS is enabled on job_photos table ✅');
      console.log('   2. The INSERT policy check failed ❌');
      console.log('');
      console.log('   The policy requires: jobs.lead_tech_id = auth.uid()');
      console.log(`   - jobs.lead_tech_id: ${job.lead_tech_id || 'NULL'}`);
      console.log(`   - auth.uid(): ${user.id}`);
      console.log(`   - Match: ${job.lead_tech_id === user.id ? 'YES' : 'NO'}\n`);

      if (job.lead_tech_id !== user.id) {
        console.log('💡 SOLUTION:');
        console.log('   The job is not assigned to this user.');
        console.log('   Update the job in Supabase:');
        console.log(`   UPDATE jobs SET lead_tech_id = '${user.id}' WHERE id = '${job.id}';`);
      } else {
        console.log('⚠️  UNEXPECTED: Assignment matches but RLS still fails!');
        console.log('   This suggests the RLS policy might not be applied correctly.');
        console.log('   Run: supabase/verify_rls_policies.sql to check policies.');
      }
    }
  } else {
    console.log(`✅ INSERT SUCCESS!`);
    console.log(`   Inserted photo ID: ${insertedPhoto.id}`);
    console.log('');
    console.log('🧹 Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('job_photos')
      .delete()
      .eq('id', insertedPhoto.id);
    
    if (deleteError) {
      console.log(`⚠️  Could not delete test record: ${deleteError.message}`);
      console.log(`   Please manually delete: ${insertedPhoto.id}`);
    } else {
      console.log('✅ Test record deleted');
    }
  }

  console.log('\n' + '='.repeat(60));
}

testRLS().catch(console.error);

