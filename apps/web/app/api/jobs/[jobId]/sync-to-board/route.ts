/**
 * POST /api/jobs/[jobId]/sync-to-board - Sync job to board item
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { syncJobToBoard } from '@/lib/integration/sync-service';

const syncJobSchema = z.object({
  board_id: z.string().uuid().optional(),
  force: z.boolean().optional(),
});

const jobIdSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
});

/**
 * POST /api/jobs/[jobId]/sync-to-board
 * Manually trigger sync from job to board item
 */
export async function POST(
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

    // Validate request body (optional)
    const validationResult = await validateRequest(request, syncJobSchema);
    if (validationResult.error) {
      return validationResult.error;
    }
    const { board_id, force } = validationResult.data || {};

    // Verify job access
    const { data: job } = await supabase
      .from('jobs')
      .select('id, lead_tech_id')
      .eq('id', jobId)
      .single();

    if (!job) {
      throw new ApiError('Job not found', 404, 'NOT_FOUND');
    }

    // Check access
    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: You do not have access to this job', 403, 'FORBIDDEN');
    }

    // Perform sync
    const syncResult = await syncJobToBoard(
      jobId,
      board_id || null,
      supabase,
      user.id
    );

    if (!syncResult.success) {
      throw new ApiError(
        syncResult.error || 'Sync failed',
        500,
        'SYNC_ERROR'
      );
    }

    // Get board item with column values
    const { data: boardItem } = await supabase
      .from('items')
      .select(`
        id,
        name,
        board_id,
        column_values (
          column_id,
          value,
          columns:column_id (
            id,
            title,
            column_type
          )
        )
      `)
      .eq('id', syncResult.board_item_id!)
      .single();

    return successResponse({
      board_item: boardItem,
      synced_at: syncResult.synced_at,
    });
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/jobs/[jobId]/sync-to-board');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

