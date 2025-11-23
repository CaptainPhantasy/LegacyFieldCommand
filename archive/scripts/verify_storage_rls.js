/**
 * Verify Storage RLS Policies
 * 
 * This script verifies that all storage buckets have the correct RLS policies
 * and that they're properly secured.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const EXPECTED_POLICIES = {
  'job-photos': [
    'Techs can upload photos to assigned jobs',
    'Admins can upload photos',
    'Techs can view photos from assigned jobs',
    'Admins can view all photos',
  ],
  'policies': [
    'Admins can upload policies',
    'Admins can view policies',
    'Techs can view policies for assigned jobs',
  ],
  'voice-recordings': [
    'Users can upload voice recordings',
    'Users can view their voice recordings',
    'Admins can view all voice recordings',
  ],
  'measurements': [
    'Users can upload measurements',
    'Techs can view measurements for assigned jobs',
    'Admins can view all measurements',
  ],
}

async function verifyStorageRLS() {
  console.log('🔍 Verifying Storage RLS Policies...\n')

  try {
    // Query all storage policies
    const { data: policies, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          policyname,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
        ORDER BY policyname;
      `,
    })

    if (error) {
      // Try direct query instead
      const { data: directPolicies, error: directError } = await supabase
        .from('storage.objects')
        .select('*')
        .limit(0)

      if (directError) {
        console.error('❌ Could not query policies directly')
        console.error('Please run the verification queries in Supabase SQL Editor instead')
        console.log('\nRun these queries:')
        Object.keys(EXPECTED_POLICIES).forEach(bucket => {
          console.log(`\n-- ${bucket} bucket:`)
          console.log(`SELECT policyname, cmd FROM pg_policies`)
          console.log(`WHERE schemaname = 'storage' AND tablename = 'objects'`)
          console.log(`AND (qual LIKE '%${bucket}%' OR with_check LIKE '%${bucket}%')`)
          console.log(`ORDER BY policyname;`)
        })
        process.exit(1)
      }
    }

    // Group policies by bucket
    const policiesByBucket = {}
    Object.keys(EXPECTED_POLICIES).forEach(bucket => {
      policiesByBucket[bucket] = []
    })

    if (policies && policies.length > 0) {
      policies.forEach(policy => {
        const policyDef = (policy.qual || '') + (policy.with_check || '')
        Object.keys(EXPECTED_POLICIES).forEach(bucket => {
          if (policyDef.includes(`bucket_id = '${bucket}'`)) {
            if (!policiesByBucket[bucket]) {
              policiesByBucket[bucket] = []
            }
            policiesByBucket[bucket].push(policy.policyname)
          }
        })
      })
    }

    // Verify each bucket
    let allGood = true
    Object.keys(EXPECTED_POLICIES).forEach(bucket => {
      const expected = EXPECTED_POLICIES[bucket]
      const found = policiesByBucket[bucket] || []

      console.log(`📦 ${bucket}:`)
      console.log(`   Expected: ${expected.length} policies`)
      console.log(`   Found: ${found.length} policies`)

      expected.forEach(policyName => {
        if (found.includes(policyName)) {
          console.log(`   ✅ ${policyName}`)
        } else {
          console.log(`   ❌ ${policyName} - MISSING`)
          allGood = false
        }
      })

      // Check for unexpected policies
      found.forEach(policyName => {
        if (!expected.includes(policyName)) {
          console.log(`   ⚠️  ${policyName} - UNEXPECTED`)
        }
      })

      console.log('')
    })

    if (allGood) {
      console.log('✅ All storage RLS policies are correctly configured!')
      console.log('\n⚠️  IMPORTANT: Verify that all buckets are set to PRIVATE (not public)')
      console.log('   Especially check: job-photos bucket')
    } else {
      console.log('❌ Some policies are missing. Please run fix_storage_rls_all_buckets.sql')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error verifying policies:', error.message)
    console.log('\n💡 Tip: Run the verification queries directly in Supabase SQL Editor')
    process.exit(1)
  }
}

verifyStorageRLS()

