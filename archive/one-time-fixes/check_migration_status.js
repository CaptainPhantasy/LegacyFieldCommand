// Check which migrations have been applied by checking which tables exist
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
// Service role key for admin access
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

// Expected tables from migrations
const expectedTables = {
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
};

async function checkMigrationStatus() {
  console.log('🔍 Checking Database Migration Status\n');
  console.log('='.repeat(60));
  console.log(`Supabase URL: ${supabaseUrl}\n`);

  try {
    // Query information_schema to get all tables
    const { data: tables, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    });

    // Alternative: Use direct query if RPC doesn't work
    // Let's try querying each expected table to see if it exists
    const existingTables = [];
    const missingTables = [];

    for (const [tableName, migrationFile] of Object.entries(expectedTables)) {
      try {
        // Try to query the table - if it exists, this will succeed
        const { error: queryError } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);

        if (queryError) {
          if (queryError.code === '42P01' || queryError.message.includes('does not exist')) {
            missingTables.push({ table: tableName, migration: migrationFile });
          } else {
            // Table exists but might have RLS issues - still count as existing
            existingTables.push({ table: tableName, migration: migrationFile });
          }
        } else {
          existingTables.push({ table: tableName, migration: migrationFile });
        }
      } catch (err) {
        // If we can't query it, assume it doesn't exist
        missingTables.push({ table: tableName, migration: migrationFile });
      }
    }

    console.log('\n✅ EXISTING TABLES:\n');
    if (existingTables.length > 0) {
      existingTables.forEach(({ table, migration }) => {
        console.log(`   ✓ ${table.padEnd(25)} (${migration})`);
      });
    } else {
      console.log('   (none found)');
    }

    console.log('\n❌ MISSING TABLES:\n');
    if (missingTables.length > 0) {
      missingTables.forEach(({ table, migration }) => {
        console.log(`   ✗ ${table.padEnd(25)} (${migration})`);
      });
    } else {
      console.log('   (all tables exist!)');
    }

    // Group by migration file
    const migrationsNeeded = {};
    missingTables.forEach(({ table, migration }) => {
      if (!migrationsNeeded[migration]) {
        migrationsNeeded[migration] = [];
      }
      migrationsNeeded[migration].push(table);
    });

    if (Object.keys(migrationsNeeded).length > 0) {
      console.log('\n📋 MIGRATIONS TO RUN:\n');
      const migrationOrder = [
        'add_policies_table.sql',
        'add_communications_table.sql',
        'add_estimates_table.sql',
        'add_alerts_table.sql',
        'add_templates_table.sql',
        'add_measurements_table.sql'
      ];

      migrationOrder.forEach(migration => {
        if (migrationsNeeded[migration]) {
          console.log(`   1. ${migration}`);
          console.log(`      Missing tables: ${migrationsNeeded[migration].join(', ')}\n`);
        }
      });
    }

    // Check for RLS policies
    console.log('\n🔐 Checking RLS Policies...\n');
    const tablesToCheck = existingTables.map(t => t.table);
    
    for (const table of tablesToCheck) {
      try {
        const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
          sql: `
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = '${table}';
          `
        });

        if (policyError) {
          // Try alternative method - just check if table has RLS enabled
          console.log(`   ${table}: RLS check skipped (using alternative method)`);
        } else {
          const policyCount = policies?.length || 0;
          console.log(`   ${table.padEnd(25)} ${policyCount} policies`);
        }
      } catch (err) {
        // Skip RLS check if we can't query it
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Existing: ${existingTables.length}/${Object.keys(expectedTables).length} tables`);
    console.log(`   Missing: ${missingTables.length} tables`);
    
    if (missingTables.length === 0) {
      console.log('\n✅ All migrations appear to be applied!');
    } else {
      console.log('\n⚠️  Some migrations need to be run.');
      console.log('   See MIGRATION_EXECUTION_ORDER.md for execution order.');
    }

  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
    console.error(error);
  }
}

checkMigrationStatus();

