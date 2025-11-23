// Execute secure RLS fix
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
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || 'sbp_1c3492ae02ff8a02b1e46b99dd593b9afcc99d6a';
const projectMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = projectMatch ? projectMatch[1] : null;

const sqlPath = path.join(__dirname, '../supabase/fix_rls_secure.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function execute() {
  console.log('🔐 Executing SECURE RLS fix...\n');
  
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey
    },
    body: JSON.stringify({ query: sql })
  });

  if (response.ok) {
    console.log('✅ Secure RLS policies applied!\n');
    console.log('All policies now explicitly check auth.uid() IS NOT NULL');
  } else {
    const error = await response.text();
    console.error('❌ Error:', error);
  }
}

execute();

