// Comprehensive RLS verification - actually test policies work correctly
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
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

// Extract project ref
const projectMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = projectMatch ? projectMatch[1] : null;

async function verifyRLS() {
  console.log('🔐 COMPREHENSIVE RLS VERIFICATION\n');
  console.log('='.repeat(70));
  console.log(`Project: ${projectRef || 'unknown'}\n`);

  const issues = [];
  const warnings = [];

  // 1. Check RLS is enabled via Management API
  console.log('1️⃣  Checking RLS is enabled on all tables...\n');
  
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

  try {
    // Query pg_tables to check RLS status
    const rlsCheckSQL = `
      SELECT 
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public' 
      AND tablename IN (${tables.map(t => `'${t}'`).join(', ')})
      ORDER BY tablename;
    `;

    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({ query: rlsCheckSQL })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('   RLS Status:');
      for (const table of tables) {
        const row = result.find(r => r.tablename === table);
        if (row && row.rls_enabled) {
          console.log(`   ✅ ${table.padEnd(25)} RLS enabled`);
        } else {
          console.log(`   ❌ ${table.padEnd(25)} RLS NOT enabled`);
          issues.push(`RLS not enabled on ${table}`);
        }
      }
    } else {
      console.log('   ⚠️  Could not check RLS status via API');
      warnings.push('Could not verify RLS status automatically');
    }
  } catch (error) {
    console.log(`   ⚠️  Error checking RLS: ${error.message}`);
    warnings.push(`RLS check error: ${error.message}`);
  }

  // 2. Check policies exist
  console.log('\n2️⃣  Checking RLS policies exist...\n');
  
  const expectedPolicies = {
    'policies': [
      'Admins can view all policies',
      'Techs can view policies for assigned jobs',
      'Admins can insert policies',
      'Admins can update policies',
      'Admins can delete policies'
    ],
    'email_templates': [
      'Admins can view all templates',
      'Admins can manage templates'
    ],
    'communications': [
      'Admins can view all communications',
      'Techs can view communications for assigned jobs',
      'Users can create communications'
    ],
    'estimates': [
      'Admins can view all estimates',
      'Techs can view estimates for assigned jobs',
      'Admins can manage estimates'
    ],
    'estimate_line_items': [
      'Users can view line items for accessible estimates',
      'Admins can manage line items'
    ],
    'alert_rules': [
      'Admins can manage alert rules'
    ],
    'alerts': [
      'Admins can view all alerts',
      'Techs can view alerts for assigned jobs',
      'Users can update alerts'
    ],
    'monitoring_metrics': [
      'Admins can view all metrics'
    ],
    'job_templates': [
      'Admins can manage templates',
      'Users can view enabled templates'
    ],
    'measurements': [
      'Admins can view all measurements',
      'Techs can view measurements for assigned jobs',
      'Users can upload measurements',
      'Admins can manage measurements'
    ]
  };

  try {
    const policiesCheckSQL = `
      SELECT 
        tablename,
        policyname
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename IN (${tables.map(t => `'${t}'`).join(', ')})
      ORDER BY tablename, policyname;
    `;

    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({ query: policiesCheckSQL })
    });

    if (response.ok) {
      const result = await response.json();
      const existingPolicies = {};
      
      // Group by table
      result.forEach(row => {
        if (!existingPolicies[row.tablename]) {
          existingPolicies[row.tablename] = [];
        }
        existingPolicies[row.tablename].push(row.policyname);
      });

      for (const [table, expected] of Object.entries(expectedPolicies)) {
        const existing = existingPolicies[table] || [];
        console.log(`   ${table}:`);
        
        for (const policyName of expected) {
          if (existing.includes(policyName)) {
            console.log(`      ✅ ${policyName}`);
          } else {
            console.log(`      ❌ ${policyName} - MISSING`);
            issues.push(`Missing policy "${policyName}" on ${table}`);
          }
        }
        
        // Check for unexpected policies
        const unexpected = existing.filter(p => !expected.includes(p));
        if (unexpected.length > 0) {
          unexpected.forEach(p => {
            console.log(`      ⚠️  ${p} - Unexpected (may be from old migration)`);
            warnings.push(`Unexpected policy "${p}" on ${table}`);
          });
        }
      }
    } else {
      console.log('   ⚠️  Could not check policies via API');
      warnings.push('Could not verify policies automatically');
    }
  } catch (error) {
    console.log(`   ⚠️  Error checking policies: ${error.message}`);
    warnings.push(`Policy check error: ${error.message}`);
  }

  // 3. Check triggers exist
  console.log('\n3️⃣  Checking triggers exist...\n');
  
  const expectedTriggers = {
    'policies': 'update_policies_updated_at',
    'email_templates': 'update_email_templates_updated_at',
    'estimates': 'update_estimates_updated_at',
    'estimate_line_items': 'update_estimate_line_items_updated_at',
    'alert_rules': 'update_alert_rules_updated_at',
    'alerts': 'update_alerts_updated_at',
    'job_templates': 'update_job_templates_updated_at',
    'measurements': 'update_measurements_updated_at'
  };

  try {
    const triggersCheckSQL = `
      SELECT 
        event_object_table as table_name,
        trigger_name
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
      AND event_object_table IN (${Object.keys(expectedTriggers).map(t => `'${t}'`).join(', ')})
      ORDER BY event_object_table, trigger_name;
    `;

    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({ query: triggersCheckSQL })
    });

    if (response.ok) {
      const result = await response.json();
      const existingTriggers = {};
      
      result.forEach(row => {
        if (!existingTriggers[row.table_name]) {
          existingTriggers[row.table_name] = [];
        }
        existingTriggers[row.table_name].push(row.trigger_name);
      });

      for (const [table, expectedTrigger] of Object.entries(expectedTriggers)) {
        const existing = existingTriggers[table] || [];
        if (existing.includes(expectedTrigger)) {
          console.log(`   ✅ ${table.padEnd(25)} ${expectedTrigger}`);
        } else {
          console.log(`   ❌ ${table.padEnd(25)} ${expectedTrigger} - MISSING`);
          issues.push(`Missing trigger "${expectedTrigger}" on ${table}`);
        }
      }
    } else {
      console.log('   ⚠️  Could not check triggers via API');
      warnings.push('Could not verify triggers automatically');
    }
  } catch (error) {
    console.log(`   ⚠️  Error checking triggers: ${error.message}`);
    warnings.push(`Trigger check error: ${error.message}`);
  }

  // 4. Test actual access patterns
  console.log('\n4️⃣  Testing access patterns...\n');
  
  const supabase = createClient(supabaseUrl, env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
  
  // Test that anon user is blocked (RLS working)
  console.log('   Testing anon access (should be blocked by RLS):');
  for (const table of tables.slice(0, 3)) { // Test first 3 tables
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error) {
        if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('row-level security')) {
          console.log(`      ✅ ${table} - Anon blocked (RLS working)`);
        } else {
          console.log(`      ⚠️  ${table} - Error: ${error.message}`);
          warnings.push(`Unexpected error on ${table}: ${error.message}`);
        }
      } else {
        console.log(`      ❌ ${table} - Anon allowed (RLS may not be working)`);
        issues.push(`RLS not blocking anon access on ${table}`);
      }
    } catch (err) {
      console.log(`      ⚠️  ${table} - Exception: ${err.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 VERIFICATION SUMMARY:\n');
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ ALL CHECKS PASSED - RLS is properly configured!\n');
  } else {
    if (issues.length > 0) {
      console.log(`❌ CRITICAL ISSUES (${issues.length}):\n`);
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      console.log('');
    }
    
    if (warnings.length > 0) {
      console.log(`⚠️  WARNINGS (${warnings.length}):\n`);
      warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
      console.log('');
    }
    
    console.log('💡 ACTION REQUIRED:');
    console.log('   Re-run fix_all_migrations.sql in Supabase SQL Editor');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
  }

  console.log('='.repeat(70));
  
  return { issues, warnings };
}

verifyRLS().catch(console.error);

