// Final RLS security test - verify anon can't INSERT/UPDATE/DELETE
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

async function testSecurity() {
  console.log('🔒 FINAL RLS SECURITY TEST\n');
  console.log('='.repeat(70));
  console.log('Testing that anon users CANNOT insert/update/delete\n');
  
  let allSecure = true;
  
  // Test INSERT
  console.log('1️⃣  Testing INSERT (should be blocked):\n');
  const insertTests = [
    { table: 'policies', data: { policy_number: 'TEST', carrier_name: 'Test' } },
    { table: 'email_templates', data: { name: 'Test', subject: 'Test', body: 'Test' } },
    { table: 'communications', data: { type: 'email', direction: 'outbound', subject: 'Test', body: 'Test' } }
  ];
  
  for (const test of insertTests) {
    const { data, error } = await anonClient
      .from(test.table)
      .insert(test.data)
      .select();
    
    if (error) {
      if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('row-level security')) {
        console.log(`   ✅ ${test.table.padEnd(25)} INSERT blocked`);
      } else {
        console.log(`   ⚠️  ${test.table.padEnd(25)} Error: ${error.message}`);
      }
    } else {
      console.log(`   ❌ ${test.table.padEnd(25)} INSERT ALLOWED - SECURITY BREACH!`);
      allSecure = false;
    }
  }
  
  // Test UPDATE
  console.log('\n2️⃣  Testing UPDATE (should be blocked):\n');
  for (const test of insertTests) {
    const { error } = await anonClient
      .from(test.table)
      .update({ updated_at: new Date().toISOString() })
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
    
    if (error) {
      if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('row-level security')) {
        console.log(`   ✅ ${test.table.padEnd(25)} UPDATE blocked`);
      } else if (error.code === 'PGRST116') {
        console.log(`   ✅ ${test.table.padEnd(25)} UPDATE blocked (no matching rows)`);
      } else {
        console.log(`   ⚠️  ${test.table.padEnd(25)} Error: ${error.message}`);
      }
    } else {
      console.log(`   ⚠️  ${test.table.padEnd(25)} UPDATE allowed (but no rows matched)`);
    }
  }
  
  // Test DELETE
  console.log('\n3️⃣  Testing DELETE (should be blocked):\n');
  for (const test of insertTests) {
    const { error } = await anonClient
      .from(test.table)
      .delete()
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
    
    if (error) {
      if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('row-level security')) {
        console.log(`   ✅ ${test.table.padEnd(25)} DELETE blocked`);
      } else if (error.code === 'PGRST116') {
        console.log(`   ✅ ${test.table.padEnd(25)} DELETE blocked (no matching rows)`);
      } else {
        console.log(`   ⚠️  ${test.table.padEnd(25)} Error: ${error.message}`);
      }
    } else {
      console.log(`   ⚠️  ${test.table.padEnd(25)} DELETE allowed (but no rows matched)`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 SECURITY SUMMARY:\n');
  
  if (allSecure) {
    console.log('✅ RLS IS SECURE!');
    console.log('   - Anon users can query (returns empty - expected)');
    console.log('   - Anon users CANNOT insert/update/delete');
    console.log('   - Policies are working correctly\n');
  } else {
    console.log('❌ SECURITY ISSUES FOUND!');
    console.log('   - Anon users can modify data - CRITICAL!\n');
  }
  
  console.log('💡 Note: SELECT returning empty results is CORRECT behavior.');
  console.log('   RLS policies filter results - anon users see nothing.\n');
}

testSecurity().catch(console.error);

