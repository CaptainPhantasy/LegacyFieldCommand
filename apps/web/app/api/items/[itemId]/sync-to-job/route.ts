/**
 * POST /api/items/[itemId]/sync-to-job - Sync board item to job
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, errorResponse, successResponse, ApiError } from '@/lib/api/middleware';
import { validateRequest, validateParams } from '@/lib/validation/validator';
import { z } from 'zod';
import { sanitizeError, createApiErrorFromSanitized } from '@/lib/api/error-handler';
import { syncBoardToJob } from '@/lib/integration/sync-service';

const syncItemSchema = z.object({
  force: z.boolean().optional(),
});

const itemIdSchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
});

/**
 * POST /api/items/[itemId]/sync-to-job
 * Manually trigger sync from board item to job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(request);
    const { itemId } = await params;

    const paramResult = validateParams({ itemId }, itemIdSchema);
    if (paramResult.error) {
      return paramResult.error;
    }

    // Validate request body (optional)
    const validationResult = await validateRequest(request, syncItemSchema);
    if (validationResult.error) {
      return validationResult.error;
    }

    // Verify item access via board
    const { data: item } = await supabase
      .from('items')
      .select('id, board_id')
      .eq('id', itemId)
      .single();

    if (!item) {
      throw new ApiError('Board item not found', 404, 'NOT_FOUND');
    }

    // Perform sync
    const syncResult = await syncBoardToJob(
      itemId,
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

    // Get updated job
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', syncResult.job_id!)
      .single();

    if (!job) {
      throw new ApiError('Job not found after sync', 404, 'NOT_FOUND');
    }

    return successResponse({
      job,
      synced_at: syncResult.synced_at,
    });
  } catch (error) {
    const sanitized = sanitizeError(error, 'POST /api/items/[itemId]/sync-to-job');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

