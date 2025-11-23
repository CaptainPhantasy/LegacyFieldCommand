// Create storage buckets for file uploads
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
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const buckets = [
  {
    name: 'policies',
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['application/pdf']
  },
  {
    name: 'voice-recordings',
    public: false,
    fileSizeLimit: 26214400, // 25MB
    allowedMimeTypes: ['audio/*']
  },
  {
    name: 'measurements',
    public: false,
    fileSizeLimit: 104857600, // 100MB
    allowedMimeTypes: ['*/*'] // Various 3D formats
  }
];

async function createBuckets() {
  console.log('📦 Creating Storage Buckets...\n');
  console.log('='.repeat(70));

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existing, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.log(`   ⚠️  ${bucket.name}: Could not check existing buckets`);
        continue;
      }

      const exists = existing?.some(b => b.name === bucket.name);

      if (exists) {
        console.log(`   ✅ ${bucket.name.padEnd(20)} Already exists`);
      } else {
        // Create bucket
        const { data, error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        });

        if (error) {
          console.log(`   ❌ ${bucket.name.padEnd(20)} Error: ${error.message}`);
        } else {
          console.log(`   ✅ ${bucket.name.padEnd(20)} Created successfully`);
        }
      }
    } catch (err) {
      console.log(`   ❌ ${bucket.name.padEnd(20)} Exception: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 Note: Storage bucket creation via API may be limited.');
  console.log('   If buckets were not created, create them manually in Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/project/[PROJECT_ID]/storage/buckets\n');
}

createBuckets().catch(console.error);

