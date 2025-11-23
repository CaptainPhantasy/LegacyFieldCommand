
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

console.log('Current Dir:', process.cwd());

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🌱 Seeding Test Data for Moisture Gate...');

  // 1. Find tech@legacy.com
  let { data: tech } = await supabase.from('profiles').select('*').eq('email', 'tech@legacy.com').single();

  if (!tech) {
    console.log('⚠️ Tech profile (tech@legacy.com) not found. Looking for any field_tech...');
     const { data: anyTech } = await supabase.from('profiles').select('*').eq('role', 'field_tech').limit(1).single();
     if (anyTech) {
       tech = anyTech;
       console.log(`👉 Found alternative tech: ${tech.email}`);
     } else {
       console.error('❌ No field tech found in profiles. You need to sign up a user first.');
       return;
     }
  }

  console.log(`👤 Using Tech: ${tech.email} (${tech.id})`);

  // 2. Create a Job
  const jobTitle = 'TEST - 123 Moisture Demo';
  
  const { data: existingJobs } = await supabase.from('jobs').select('id').eq('title', jobTitle);
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

