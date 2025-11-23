/**
 * Cleanup Test Jobs Script
 * Removes test jobs from the database
 * 
 * Usage:
 *   node scripts/cleanup_test_jobs.js
 *   node scripts/cleanup_test_jobs.js --dry-run  (show what would be deleted without deleting)
 *   node scripts/cleanup_test_jobs.js --keep-recent  (keep jobs from last 7 days)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root or apps/web/.env.local
config({ path: resolve(__dirname, '../.env') });
config({ path: resolve(__dirname, '../apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables');
  process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const keepRecent = args.includes('--keep-recent');

async function cleanupTestJobs() {
  console.log('🧹 Cleaning up test jobs...\n');
  if (dryRun) {
    console.log('   DRY RUN MODE - No jobs will be deleted\n');
  }

  // Test job patterns to match
  const testPatterns = [
    /^test\s+/i,
    /^validation\s+test/i,
    /^assign\s+test/i,
    /^e2e\s+test/i,
    /^ios\s+test/i,
    /^api\s+test/i,
    /^assignment\s+test/i,
    /^chamber\s+test/i,
    /^floor\s+plan\s+test/i,
    /^moisture\s+test/i,
    /^sync\s+test/i,
    /^manual\s+sync/i,
    /^update\s+test/i,
    /^link\s+test/i,
    /^reverse\s+link\s+test/i,
    /^board\s+sync\s+test/i,
    /^report\s+test/i,
    /^hydro\s+ui\s+test/i,
    /^integration\s+ui\s+test/i,
    /^test\s+job\s*-\s*\d+$/i,
    /^validation\s+test\s*-\s*\d+$/i,
    /^assign\s+test\s*-\s*\d+$/i,
    /^e2e\s+test\s+job\s*-\s*\d+$/i,
    /^ios\s+test\s+job\s*-\s*\d+$/i,
    /^api\s+test\s+job\s*-\s*\d+$/i,
    /^assignment\s+test\s*-\s*\d+$/i,
  ];

  // Build query
  let query = supabaseAdmin
    .from('jobs')
    .select('id, title, created_at, lead_tech_id, profiles:lead_tech_id(full_name)');

  // If keeping recent, filter by date
  if (keepRecent) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    query = query.lt('created_at', cutoffDate.toISOString());
  }

  const { data: allJobs, error: fetchError } = await query;

  if (fetchError) {
    console.error(`❌ Error fetching jobs:`, fetchError.message);
    return { deleted: 0 };
  }

  if (!allJobs || allJobs.length === 0) {
    console.log('✅ No jobs found\n');
    return { deleted: 0 };
  }

  // Filter test jobs
  const testJobs = allJobs.filter(job => {
    const title = (job.title || '').trim();
    return testPatterns.some(pattern => pattern.test(title));
  });

  console.log(`   Found ${testJobs.length} test jobs out of ${allJobs.length} total jobs\n`);

  if (testJobs.length === 0) {
    console.log('✅ No test jobs to clean up!\n');
    return { deleted: 0 };
  }

  // Show some examples
  console.log('   Examples of jobs to be deleted:');
  testJobs.slice(0, 10).forEach(job => {
    console.log(`     - ${job.title} (${job.created_at ? new Date(job.created_at).toLocaleDateString() : 'unknown date'})`);
  });
  if (testJobs.length > 10) {
    console.log(`     ... and ${testJobs.length - 10} more\n`);
  } else {
    console.log();
  }

  if (dryRun) {
    console.log(`✅ DRY RUN: Would delete ${testJobs.length} test jobs\n`);
    return { deleted: 0, wouldDelete: testJobs.length };
  }

  // Delete in batches to avoid timeouts
  let deleted = 0;
  const batchSize = 100;
  let hasMore = true;
  const testJobIds = testJobs.map(j => j.id);

  while (hasMore && deleted < testJobIds.length) {
    const batch = testJobIds.slice(deleted, deleted + batchSize);

    // Delete jobs (this will cascade delete gates, photos, etc. via foreign keys)
    const { error } = await supabaseAdmin
      .from('jobs')
      .delete()
      .in('id', batch);

    if (error) {
      console.error(`❌ Error deleting batch:`, error.message);
      break;
    }

    deleted += batch.length;
    console.log(`   Deleted ${deleted} / ${testJobs.length} test jobs...`);

    if (batch.length < batchSize) {
      hasMore = false;
    }
  }

  console.log(`\n✅ Deleted ${deleted} test jobs\n`);
  return { deleted };
}

async function main() {
  console.log('='.repeat(70));
  console.log('🧹 Cleanup Test Jobs Script');
  console.log('='.repeat(70));
  console.log();

  try {
    const result = await cleanupTestJobs();

    console.log('='.repeat(70));
    console.log('✅ Cleanup Complete!');
    console.log('='.repeat(70));
    if (dryRun) {
      console.log(`   Would delete ${result.wouldDelete || 0} test jobs`);
    } else {
      console.log(`   Deleted ${result.deleted} test jobs`);
    }
    console.log();

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

