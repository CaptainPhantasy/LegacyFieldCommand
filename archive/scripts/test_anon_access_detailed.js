// Detailed test of anon access - check actual responses
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const anonClient = createClient(supabaseUrl, anonKey);

async function testAnonAccess() {
  console.log('🔍 Detailed Anon Access Test\n');
  console.log('='.repeat(70));
  
  const tables = ['policies', 'email_templates', 'communications'];
  
  for (const table of tables) {
    console.log(`\n📊 Testing ${table}:`);
    
    try {
      const { data, error, status, statusText } = await anonClient
        .from(table)
        .select('*')
        .limit(1);
      
      console.log(`   Status: ${status} ${statusText}`);
      console.log(`   Error: ${error ? JSON.stringify(error, null, 2) : 'None'}`);
      console.log(`   Data: ${data ? `Returned ${data.length} rows` : 'None'}`);
      
      if (error) {
        if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('row-level security')) {
          console.log(`   ✅ CORRECTLY BLOCKED by RLS`);
        } else if (error.code === 'PGRST116') {
          console.log(`   ✅ CORRECTLY BLOCKED (no rows returned)`);
        } else {
          console.log(`   ⚠️  Unexpected error: ${error.code} - ${error.message}`);
        }
      } else if (data && data.length === 0) {
        console.log(`   ⚠️  Query succeeded but returned empty (RLS may be working, just no data)`);
      } else {
        console.log(`   ❌ ALLOWED ACCESS - RLS NOT WORKING`);
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
}

testAnonAccess().catch(console.error);

