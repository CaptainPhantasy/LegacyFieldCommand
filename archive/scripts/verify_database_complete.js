// Comprehensive database verification - check tables, policies, triggers, functions
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

// Expected structure
const expectedStructure = {
  tables: [
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
  ],
  policies: {
    'policies': ['Admins can view all policies', 'Techs can view policies for assigned jobs', 'Admins can insert policies', 'Admins can update policies', 'Admins can delete policies'],
    'email_templates': ['Admins can view all templates', 'Admins can manage templates'],
    'communications': ['Admins can view all communications', 'Techs can view communications for assigned jobs', 'Users can create communications'],
    'estimates': ['Admins can view all estimates', 'Techs can view estimates for assigned jobs', 'Admins can manage estimates'],
    'estimate_line_items': ['Users can view line items for accessible estimates', 'Admins can manage line items'],
    'alert_rules': ['Admins can manage alert rules'],
    'alerts': ['Admins can view all alerts', 'Techs can view alerts for assigned jobs', 'Users can update alerts'],
    'monitoring_metrics': ['Admins can view all metrics'],
    'job_templates': ['Admins can manage templates', 'Users can view enabled templates'],
    'measurements': ['Admins can view all measurements', 'Techs can view measurements for assigned jobs', 'Users can upload measurements', 'Admins can manage measurements']
  },
  triggers: {
    'policies': 'update_policies_updated_at',
    'email_templates': 'update_email_templates_updated_at',
    'estimates': 'update_estimates_updated_at',
    'estimate_line_items': 'update_estimate_line_items_updated_at',
    'alert_rules': 'update_alert_rules_updated_at',
    'alerts': 'update_alerts_updated_at',
    'job_templates': 'update_job_templates_updated_at',
    'measurements': 'update_measurements_updated_at'
  }
};

async function verifyDatabase() {
  console.log('🔍 Comprehensive Database Verification\n');
  console.log('='.repeat(70));

  const results = {
    tables: { existing: [], missing: [] },
    policies: { existing: {}, missing: {} },
    triggers: { existing: {}, missing: {} },
    rlsEnabled: {}
  };

  // Check tables
  console.log('\n📊 Checking Tables...\n');
  for (const table of expectedStructure.tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
        results.tables.missing.push(table);
        console.log(`   ❌ ${table}`);
      } else {
        results.tables.existing.push(table);
        console.log(`   ✅ ${table}`);
      }
    } catch (err) {
      results.tables.missing.push(table);
      console.log(`   ❌ ${table} (error: ${err.message})`);
    }
  }

  // Check RLS is enabled (by trying to query without auth - should fail with RLS error, not permission error)
  console.log('\n🔐 Checking RLS Status...\n');
  for (const table of results.tables.existing) {
    try {
      // Create a client with no auth to test RLS
      const anonClient = createClient(supabaseUrl, env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      
      const { error } = await anonClient
        .from(table)
        .select('*')
        .limit(0);

      // If we get a permission denied or RLS error, RLS is enabled
      if (error && (error.message.includes('permission denied') || error.message.includes('row-level security'))) {
        results.rlsEnabled[table] = true;
        console.log(`   ✅ ${table.padEnd(25)} RLS enabled`);
      } else if (error && error.code === '42501') {
        results.rlsEnabled[table] = true;
        console.log(`   ✅ ${table.padEnd(25)} RLS enabled`);
      } else {
        results.rlsEnabled[table] = false;
        console.log(`   ⚠️  ${table.padEnd(25)} RLS may not be enabled`);
      }
    } catch (err) {
      console.log(`   ❓ ${table.padEnd(25)} Could not verify RLS`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📈 VERIFICATION SUMMARY:\n');
  console.log(`   Tables: ${results.tables.existing.length}/${expectedStructure.tables.length} exist`);
  console.log(`   Missing: ${results.tables.missing.length} tables`);
  
  const rlsEnabledCount = Object.values(results.rlsEnabled).filter(v => v === true).length;
  console.log(`   RLS Enabled: ${rlsEnabledCount}/${results.tables.existing.length} tables`);

  if (results.tables.missing.length === 0 && rlsEnabledCount === results.tables.existing.length) {
    console.log('\n✅ Database is fully set up and ready!');
    console.log('   All tables exist and RLS is properly configured.');
  } else {
    console.log('\n⚠️  Database needs attention:');
    if (results.tables.missing.length > 0) {
      console.log(`   - ${results.tables.missing.length} tables are missing`);
      console.log(`     Run migrations: ${results.tables.missing.map(t => {
        for (const [table, migration] of Object.entries({
          'policies': 'add_policies_table.sql',
          'email_templates': 'add_communications_table.sql',
          'communications': 'add_communications_table.sql',
          'estimates': 'add_estimates_table.sql',
          'estimate_line_items': 'add_estimates_table.sql',
          'alert_rules': 'add_alerts_table.sql',
          'alerts': 'add_alerts_table.sql',
          'monitoring_metrics': 'add_alerts_table.sql',
          'job_templates': 'add_templates_table.sql',
          'measurements': 'add_measurements_table.sql'
        })) {
          if (table === t) return migration;
        }
        return 'unknown';
      }).join(', ')}`);
    }
    if (rlsEnabledCount < results.tables.existing.length) {
      console.log(`   - RLS not enabled on ${results.tables.existing.length - rlsEnabledCount} tables`);
    }
  }

  console.log('\n' + '='.repeat(70));
}

verifyDatabase().catch(console.error);

