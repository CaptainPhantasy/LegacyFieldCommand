// Execute SQL migrations directly using Supabase Management API
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
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Extract project ref from URL
const projectMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!projectMatch) {
  console.error('❌ Could not extract project ref from Supabase URL');
  process.exit(1);
}
const projectRef = projectMatch[1];

// Read SQL file
const sqlPath = path.join(__dirname, '../supabase/fix_all_migrations.sql');
if (!fs.existsSync(sqlPath)) {
  console.error(`❌ SQL file not found: ${sqlPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

async function executeSQL() {
  console.log('🚀 Executing migrations via Supabase Management API...\n');
  console.log('='.repeat(70));
  console.log(`Project: ${projectRef}`);
  console.log(`SQL file: ${sqlPath}\n`);

  try {
    // Try using Supabase Management API
    // First, we need to get an access token - but we can try with service role key
    // The Management API endpoint for SQL execution
    const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
    
    // Try with service role key as bearer token
    const response = await fetch(managementApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SQL executed successfully!\n');
      console.log('Result:', JSON.stringify(result, null, 2));
      return;
    }

    // If Management API doesn't work, try direct PostgREST approach
    // Split SQL into statements and execute via RPC if available
    console.log('⚠️  Management API approach failed, trying alternative...\n');
    
    // Alternative: Use Supabase client with service role to execute via RPC
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Try to create an exec_sql function if it doesn't exist, then use it
    // But actually, we can't create functions via REST API either
    
    // Last resort: Use psql if available
    console.log('📋 Attempting to execute via psql...\n');
    
    // Extract database connection details from Supabase URL
    // We need the database password from connection string
    // For now, let's try using Supabase CLI if available
    
    const { execSync } = require('child_process');
    
    try {
      // Check if supabase CLI is installed
      execSync('which supabase', { stdio: 'ignore' });
      console.log('✅ Supabase CLI found, attempting to execute SQL...\n');
      
      // Write SQL to temp file
      const tempSqlFile = path.join(__dirname, '../supabase/temp_migration.sql');
      fs.writeFileSync(tempSqlFile, sql);
      
      // Try to execute via supabase CLI
      // This requires the project to be linked
      try {
        execSync(`supabase db execute --file ${tempSqlFile}`, {
          stdio: 'inherit',
          cwd: path.join(__dirname, '..')
        });
        console.log('\n✅ Migrations executed successfully via Supabase CLI!');
        fs.unlinkSync(tempSqlFile);
        return;
      } catch (cliError) {
        console.log('⚠️  Supabase CLI execution failed:', cliError.message);
        console.log('   This might require project linking or different approach.\n');
        fs.unlinkSync(tempSqlFile);
      }
    } catch (e) {
      console.log('⚠️  Supabase CLI not found or not in PATH.\n');
    }

    // Final fallback: Use direct PostgreSQL connection if we have connection string
    console.log('📋 Final attempt: Direct PostgreSQL connection...\n');
    
    // We would need the database password from Supabase dashboard
    // For security, this should be in env vars
    const dbPassword = env.SUPABASE_DB_PASSWORD;
    const dbHost = `${projectRef}.supabase.co`;
    const dbPort = 5432;
    const dbName = 'postgres';
    const dbUser = 'postgres';
    
    if (dbPassword) {
      try {
        // Use psql directly
        const { execSync } = require('child_process');
        const tempSqlFile = path.join(__dirname, '../supabase/temp_migration.sql');
        fs.writeFileSync(tempSqlFile, sql);
        
        const pgUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
        
        execSync(`psql "${pgUrl}" -f ${tempSqlFile}`, {
          stdio: 'inherit'
        });
        
        console.log('\n✅ Migrations executed successfully via psql!');
        fs.unlinkSync(tempSqlFile);
        return;
      } catch (psqlError) {
        console.log('⚠️  psql execution failed:', psqlError.message);
        console.log('   Make sure psql is installed and password is correct.\n');
      }
    } else {
      console.log('⚠️  SUPABASE_DB_PASSWORD not found in .env.local');
      console.log('   Add it to enable direct PostgreSQL connection.\n');
    }

    // If all else fails, provide instructions
    console.log('='.repeat(70));
    console.log('\n⚠️  Could not execute SQL automatically.');
    console.log('📋 Please run the SQL manually in Supabase SQL Editor:\n');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
    console.log('SQL file location:');
    console.log(`   ${sqlPath}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    console.log('\n📋 Fallback: Run SQL manually in Supabase SQL Editor:');
    console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  }
}

executeSQL();

