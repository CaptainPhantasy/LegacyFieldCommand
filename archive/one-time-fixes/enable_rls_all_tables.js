// Enable RLS on all new tables (idempotent - safe to run multiple times)
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

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL to enable RLS on all tables
const enableRLSSQL = `
-- Enable RLS on all new tables (idempotent)
ALTER TABLE IF EXISTS public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.measurements ENABLE ROW LEVEL SECURITY;
`;

async function enableRLS() {
  console.log('🔐 Enabling RLS on all tables...\n');
  console.log('='.repeat(60));
  console.log(`Supabase URL: ${supabaseUrl}\n`);

  // Since Supabase REST API doesn't support arbitrary SQL execution,
  // we need to use the Management API or provide instructions
  // For now, let's create a SQL file that can be run in Supabase Dashboard
  
  const sqlFilePath = path.join(__dirname, '../supabase/enable_rls_all_tables.sql');
  fs.writeFileSync(sqlFilePath, enableRLSSQL);
  
  console.log('📝 Created SQL file for RLS enablement:');
  console.log(`   ${sqlFilePath}\n`);
  console.log('SQL to execute:\n');
  console.log(enableRLSSQL);
  console.log('\n' + '='.repeat(60));
  console.log('\n⚠️  Supabase REST API cannot execute arbitrary SQL directly.');
  console.log('📋 Please run this SQL in Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/[PROJECT_ID]/sql/new\n');
  console.log('✅ The SQL is idempotent - safe to run multiple times.\n');
  
  // Try to provide a direct link if we can extract project ID
  const projectMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (projectMatch) {
    const projectId = projectMatch[1];
    console.log(`🔗 Direct SQL Editor link:`);
    console.log(`   https://supabase.com/dashboard/project/${projectId}/sql/new\n`);
  }
}

enableRLS();

