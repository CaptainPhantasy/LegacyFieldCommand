/**
 * GET /api/jobs/[jobId]/board-item - Get linked board item for a job
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
 * GET /api/jobs/[jobId]/board-item
 * Get the board item linked to a job
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

    // Check access
    if (job.lead_tech_id !== user.id && user.role !== 'admin' && user.role !== 'owner') {
      throw new ApiError('Forbidden: You do not have access to this job', 403, 'FORBIDDEN');
    }

    // Find board item with job_id in link column
    // First, find link columns in all boards
    const { data: linkColumns } = await supabase
      .from('columns')
      .select('id, board_id')
      .eq('column_type', 'link');

    if (!linkColumns || linkColumns.length === 0) {
      return successResponse({ board_item: null });
    }

    // Search for item with job_id in any link column
    let boardItem = null;
    for (const column of linkColumns) {
      const { data: columnValue } = await supabase
        .from('column_values')
        .select(`
          item_id,
          items:item_id (
            id,
            name,
            board_id,
            boards:board_id (
              id,
              name
            ),
            column_values (
              column_id,
              value,
              columns:column_id (
                id,
                title,
                column_type
              )
            )
          )
        `)
        .eq('column_id', column.id)
        .eq('value', jobId)
        .single();

      if (columnValue?.items && Array.isArray(columnValue.items) && columnValue.items.length > 0) {
        boardItem = columnValue.items[0];
        break;
      } else if (columnValue?.items && !Array.isArray(columnValue.items)) {
        boardItem = columnValue.items;
        break;
      }
    }

    // Format response
    if (boardItem) {
      const boardItemData = boardItem as any;
      const board = Array.isArray(boardItemData.boards) ? boardItemData.boards[0] : boardItemData.boards;
      return successResponse({
        board_item: {
          id: boardItemData.id,
          name: boardItemData.name,
          board_id: boardItemData.board_id,
          board_name: board?.name || null,
          column_values: Array.isArray(boardItemData.column_values) ? boardItemData.column_values.map((cv: any) => ({
            column_id: cv.column_id,
            column_title: cv.columns?.title || null,
            value: cv.value,
          })) : [],
        },
      });
    }

    return successResponse({ board_item: null });
  } catch (error) {
    const sanitized = sanitizeError(error, 'GET /api/jobs/[jobId]/board-item');
    return errorResponse(createApiErrorFromSanitized(sanitized));
  }
}

