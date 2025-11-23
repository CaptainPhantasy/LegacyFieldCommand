/**
 * GET /api/reports/jobs/[jobId] - List reports for a job
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { getCacheHeaders } from '@/lib/api/cache-headers';

const jobIdSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
});

/**
 * GET /api/reports/jobs/[jobId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { jobId } = await params;

    const paramResult = validateParams({ jobId }, jobIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Verify job access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', jobId)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden', 403, 'FORBIDDEN');
    }

    // Get reports for job
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(error.message, 500, 'DATABASE_ERROR');
    }

    return NextResponse.json(
      {
        success: true,
        data: { reports: reports || [] },
      },
      {
        headers: getCacheHeaders(60),
      }
    );
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/reports/jobs/[jobId]');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

