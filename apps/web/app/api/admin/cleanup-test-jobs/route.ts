/**
 * POST /api/admin/cleanup-test-jobs
 * Delete test jobs from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse } from '@/lib/api/middleware';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAuth(request);

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

    // Get all jobs
    const { data: allJobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, title');

    if (fetchError) {
      return errorResponse(new Error(fetchError.message));
    }

    if (!allJobs || allJobs.length === 0) {
      return successResponse({ deleted: 0, message: 'No jobs found' });
    }

    // Filter test jobs
    const testJobIds = allJobs
      .filter(job => {
        const title = (job.title || '').trim();
        return testPatterns.some(pattern => pattern.test(title));
      })
      .map(job => job.id);

    if (testJobIds.length === 0) {
      return successResponse({ deleted: 0, message: 'No test jobs found' });
    }

    // Delete in batches
    let deleted = 0;
    const batchSize = 100;

    for (let i = 0; i < testJobIds.length; i += batchSize) {
      const batch = testJobIds.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('jobs')
        .delete()
        .in('id', batch);

      if (error) {
        return errorResponse(new Error(`Error deleting batch: ${error.message}`));
      }

      deleted += batch.length;
    }

    return successResponse({
      deleted,
      total: testJobIds.length,
      message: `Deleted ${deleted} test jobs`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

