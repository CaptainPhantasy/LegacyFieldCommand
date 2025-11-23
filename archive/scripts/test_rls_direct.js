// Test RLS by trying to query tables with service role (should work) vs anon (should fail)
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
const envPath = path.join(__dirname, '../apps/web/.env.local');
let env = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length) {
      env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || 'sbp_1c3492ae02ff8a02b1e46b99dd593b9afcc99d6a';
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const tables = [
  'policies',
  'email_templates',
  'communications',
  'estimates',
  'estimate_line_items',
  'alert_rules',
  'alerts',
  'monitoring_metrics',
  'job_templates',
  'measurements'
];

async function testRLS() {
  console.log('🔐 Testing RLS on all tables...\n');
  console.log('='.repeat(70));

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const anonClient = createClient(supabaseUrl, anonKey);

  for (const table of tables) {
    // Service role should always work (bypasses RLS)
    const { error: serviceError } = await serviceClient
      .from(table)
      .select('*')
      .limit(0);

    // Anon key should fail if RLS is enabled and no policies allow access
    const { error: anonError } = await anonClient
      .from(table)
      .select('*')
      .limit(0);

    if (serviceError) {
      console.log(`❌ ${table.padEnd(25)} Service role failed: ${serviceError.message}`);
    } else if (anonError && (anonError.code === '42501' || anonError.message.includes('permission denied') || anonError.message.includes('row-level security'))) {
      console.log(`✅ ${table.padEnd(25)} RLS enabled (anon blocked)`);
    } else if (anonError) {
      console.log(`⚠️  ${table.padEnd(25)} Anon error: ${anonError.message}`);
    } else {
      console.log(`⚠️  ${table.padEnd(25)} RLS may not be enabled (anon allowed)`);
    }
  }

  console.log('\n' + '='.repeat(70));
}

testRLS().catch(console.error);

