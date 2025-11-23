const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Try to get service role key from env, or use the one from execute_sql_in_supabase.js
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sbp_1c3492ae02ff8a02b1e46b99dd593b9afcc99d6a';

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLFile(filePath) {
  console.log(`📖 Reading SQL file: ${filePath}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Split into statements and execute via RPC if possible, or use direct HTTP
  // Supabase doesn't support raw SQL via JS client, so we'll use the REST API directly
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('do $$'));

  console.log(`🔧 Found ${statements.length} SQL statements`);

  // Use Supabase REST API to execute SQL
  // Note: This requires the Management API or we need to use psql
  // For now, let's try using the Supabase client's ability to call functions
  
  // Actually, we can't execute arbitrary SQL via the JS client
  // We need to use the Supabase CLI or Management API
  // Let me try a different approach - use the REST API directly with fetch
  
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    // RPC might not exist, so we'll need to use a different method
    console.log('⚠️  Cannot execute SQL via REST API directly.');
    console.log('📋 SQL file contents (run this in Supabase Dashboard):');
    console.log('\n' + '='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
    return false;
  }

  return true;
}

async function runSeed() {
  console.log('🌱 Running seed script...');
  
  // First, try to execute the SQL setup
  const setupSqlPath = path.join(__dirname, '../supabase/add_anon_policies.sql');
  if (fs.existsSync(setupSqlPath)) {
    console.log('📝 Attempting to apply anonymous policies...');
    await executeSQLFile(setupSqlPath);
  }

  // Now run the actual seed
  const { exec } = require('child_process');
  return new Promise((resolve, reject) => {
    exec('node seed_moisture.js', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Seed script error:', error.message);
        console.log(stdout);
        console.error(stderr);
        reject(error);
      } else {
        console.log(stdout);
        resolve();
      }
    });
  });
}

runSeed().catch(console.error);

