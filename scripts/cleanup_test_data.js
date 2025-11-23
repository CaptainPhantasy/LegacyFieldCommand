/**
 * Cleanup Test Data Script
 * Removes old automation executions (test runs) and optionally test automation rules
 * 
 * Usage:
 *   node scripts/cleanup_test_data.js
 *   node scripts/cleanup_test_data.js --delete-rules  (also delete test automation rules)
 *   node scripts/cleanup_test_data.js --days 30  (delete executions older than 30 days, default: 7)
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
const deleteRules = args.includes('--delete-rules');
const daysArg = args.find(arg => arg.startsWith('--days='));
const days = daysArg ? parseInt(daysArg.split('=')[1]) : 7;

async function cleanupAutomationExecutions() {
  console.log('🧹 Cleaning up automation executions (test runs)...\n');
  console.log(`   Deleting executions older than ${days} days\n`);

  // Calculate cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffISO = cutoffDate.toISOString();

  // First, count how many we'll delete
  const { count: totalCount } = await supabaseAdmin
    .from('automation_executions')
    .select('*', { count: 'exact', head: true })
    .lt('executed_at', cutoffISO);

  console.log(`   Found ${totalCount || 0} old executions to delete\n`);

  if (totalCount === 0) {
    console.log('✅ No old executions to clean up!\n');
    return { deleted: 0 };
  }

  // Delete in batches to avoid timeouts
  let deleted = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    // Get a batch of IDs to delete
    const { data: batch } = await supabaseAdmin
      .from('automation_executions')
      .select('id')
      .lt('executed_at', cutoffISO)
      .limit(batchSize);

    if (!batch || batch.length === 0) {
      hasMore = false;
      break;
    }

    const ids = batch.map(e => e.id);

    // Delete the batch
    const { error } = await supabaseAdmin
      .from('automation_executions')
      .delete()
      .in('id', ids);

    if (error) {
      console.error(`❌ Error deleting batch:`, error.message);
      break;
    }

    deleted += ids.length;
    console.log(`   Deleted ${deleted} / ${totalCount} executions...`);

    if (batch.length < batchSize) {
      hasMore = false;
    }
  }

  console.log(`\n✅ Deleted ${deleted} automation executions\n`);
  return { deleted };
}

async function cleanupTestAutomationRules() {
  if (!deleteRules) {
    return { deleted: 0 };
  }

  console.log('🧹 Cleaning up test automation rules...\n');

  // Find rules with test-related names
  const testKeywords = ['test', 'validation', 'demo', 'sample', 'temporary'];
  
  // Get all rules
  const { data: allRules, error: fetchError } = await supabaseAdmin
    .from('automation_rules')
    .select('id, name, description');

  if (fetchError) {
    console.error(`❌ Error fetching rules:`, fetchError.message);
    return { deleted: 0 };
  }

  if (!allRules || allRules.length === 0) {
    console.log('✅ No automation rules found\n');
    return { deleted: 0 };
  }

  // Filter test rules
  const testRules = allRules.filter(rule => {
    const nameLower = (rule.name || '').toLowerCase();
    const descLower = (rule.description || '').toLowerCase();
    return testKeywords.some(keyword => 
      nameLower.includes(keyword) || descLower.includes(keyword)
    );
  });

  console.log(`   Found ${testRules.length} test rules to delete\n`);

  if (testRules.length === 0) {
    console.log('✅ No test rules to clean up!\n');
    return { deleted: 0 };
  }

  // Delete test rules (this will cascade delete executions via foreign key)
  const testRuleIds = testRules.map(r => r.id);
  const { error } = await supabaseAdmin
    .from('automation_rules')
    .delete()
    .in('id', testRuleIds);

  if (error) {
    console.error(`❌ Error deleting test rules:`, error.message);
    return { deleted: 0 };
  }

  console.log(`✅ Deleted ${testRules.length} test automation rules\n`);
  return { deleted: testRules.length };
}

async function main() {
  console.log('='.repeat(70));
  console.log('🧹 Cleanup Test Data Script');
  console.log('='.repeat(70));
  console.log();

  try {
    // Cleanup executions
    const execResult = await cleanupAutomationExecutions();

    // Cleanup rules if requested
    const rulesResult = await cleanupTestAutomationRules();

    console.log('='.repeat(70));
    console.log('✅ Cleanup Complete!');
    console.log('='.repeat(70));
    console.log(`   Deleted ${execResult.deleted} automation executions`);
    if (deleteRules) {
      console.log(`   Deleted ${rulesResult.deleted} test automation rules`);
    }
    console.log();

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

